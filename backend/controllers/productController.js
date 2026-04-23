// controllers/productController.js
// Product CRUD + Stock management — Admin only
// Inheritance: extends BaseController
// Polymorphism: overrides handleError for FK & reference errors

const BaseController = require('./BaseController');

class ProductController extends BaseController {
  // ── Polymorphic error handler ───────────────────────────────────────────
  handleError(res, error, context = 'product operation') {
    console.error(`${context} error:`, error.message);

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return this.fail(res, 'Invalid category_id.', 400);
    }
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return this.fail(res, 'This product is referenced in existing orders and cannot be deleted.', 409);
    }
    return this.fail(res, `Failed to complete ${context}.`, 500);
  }

  // ── GET /api/products ───────────────────────────────────────────────────
  async getAll(req, res) {
    try {
      const sql = `
        SELECT p.product_id, p.name, p.price, p.stock_quantity,
               c.category_id, c.category_name
        FROM products p
        INNER JOIN categories c ON p.category_id = c.category_id
        ORDER BY c.category_name ASC, p.name ASC
      `;
      const [rows] = await this.pool.execute(sql);
      return this.success(res, rows);
    } catch (error) {
      return this.handleError(res, error, 'getAllProducts');
    }
  }

  // ── GET /api/products/:id ───────────────────────────────────────────────
  async getById(req, res) {
    const { id } = req.params;
    try {
      const [rows] = await this.pool.execute(
        `SELECT p.product_id, p.name, p.price, p.stock_quantity,
                c.category_id, c.category_name
         FROM products p
         INNER JOIN categories c ON p.category_id = c.category_id
         WHERE p.product_id = ?`,
        [id]
      );
      if (rows.length === 0) {
        return this.fail(res, 'Product not found.', 404);
      }
      return this.success(res, rows[0]);
    } catch (error) {
      return this.handleError(res, error, 'getProductById');
    }
  }

  // ── POST /api/products ──────────────────────────────────────────────────
  async create(req, res) {
    const { category_id, name, price, stock_quantity } = req.body;
    if (!category_id || !name || price === undefined) {
      return this.fail(res, 'category_id, name and price are required.');
    }
    if (parseFloat(price) < 0) {
      return this.fail(res, 'Price cannot be negative.');
    }
    try {
      const [result] = await this.pool.execute(
        'INSERT INTO products (category_id, name, price, stock_quantity) VALUES (?, ?, ?, ?)',
        [category_id, name.trim(), price, stock_quantity ?? 0]
      );
      return this.success(res, {
        product_id: result.insertId, category_id,
        name: name.trim(), price, stock_quantity: stock_quantity ?? 0,
      }, 201, 'Product created successfully.');
    } catch (error) {
      return this.handleError(res, error, 'createProduct');
    }
  }

  // ── PUT /api/products/:id ───────────────────────────────────────────────
  async update(req, res) {
    const { id } = req.params;
    const { category_id, name, price, stock_quantity } = req.body;

    if (!category_id && !name && price === undefined && stock_quantity === undefined) {
      return this.fail(res, 'At least one field must be provided for update.');
    }

    try {
      const [existing] = await this.pool.execute(
        'SELECT * FROM products WHERE product_id = ?', [id]
      );
      if (existing.length === 0) {
        return this.fail(res, 'Product not found.', 404);
      }

      const current = existing[0];
      const updatedCategoryId = category_id    ?? current.category_id;
      const updatedName       = name           ? name.trim() : current.name;
      const updatedPrice      = price          ?? current.price;
      const updatedStock      = stock_quantity ?? current.stock_quantity;

      await this.pool.execute(
        `UPDATE products SET category_id = ?, name = ?, price = ?, stock_quantity = ? WHERE product_id = ?`,
        [updatedCategoryId, updatedName, updatedPrice, updatedStock, id]
      );

      return this.success(res, {
        product_id: Number(id), category_id: updatedCategoryId,
        name: updatedName, price: updatedPrice, stock_quantity: updatedStock,
      }, 200, 'Product updated.');
    } catch (error) {
      return this.handleError(res, error, 'updateProduct');
    }
  }

  // ── DELETE /api/products/:id ────────────────────────────────────────────
  async delete(req, res) {
    const { id } = req.params;
    try {
      const [result] = await this.pool.execute(
        'DELETE FROM products WHERE product_id = ?', [id]
      );
      if (result.affectedRows === 0) {
        return this.fail(res, 'Product not found.', 404);
      }
      return this.success(res, undefined, 200, 'Product deleted.');
    } catch (error) {
      return this.handleError(res, error, 'deleteProduct');
    }
  }

  // ── PATCH /api/products/:id/stock ───────────────────────────────────────
  async updateStock(req, res) {
    const { id } = req.params;
    const { quantity, type, note } = req.body;
    const user_id = req.user.user_id;

    if (!quantity || !Number.isInteger(quantity) || quantity < 1) {
      return this.fail(res, 'quantity must be a positive integer (>= 1).');
    }
    if (!type || !['add', 'remove'].includes(type)) {
      return this.fail(res, 'type must be either "add" or "remove".');
    }

    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const [rows] = await connection.execute(
        'SELECT product_id, name, stock_quantity FROM products WHERE product_id = ?', [id]
      );
      if (rows.length === 0) {
        await connection.rollback();
        return this.fail(res, 'Product not found.', 404);
      }

      const product = rows[0];
      const delta = type === 'add' ? quantity : -quantity;
      const newStock = product.stock_quantity + delta;

      if (newStock < 0) {
        await connection.rollback();
        return this.fail(res, `Insufficient stock. Current: ${product.stock_quantity}, Attempted to remove: ${quantity}`, 409);
      }

      await connection.execute(
        'UPDATE products SET stock_quantity = ? WHERE product_id = ?', [newStock, id]
      );

      const reason = type === 'add' ? 'manual_add' : 'manual_remove';
      await connection.execute(
        `INSERT INTO stock_movements (product_id, user_id, quantity, reason, note) VALUES (?, ?, ?, ?, ?)`,
        [id, user_id, delta, reason, note || null]
      );

      await connection.commit();

      return this.success(res, {
        product_id: Number(id), product_name: product.name,
        previous_stock: product.stock_quantity, adjustment: delta, new_stock: newStock,
      }, 200, `Stock ${type === 'add' ? 'increased' : 'decreased'} successfully.`);
    } catch (error) {
      await connection.rollback();
      return this.handleError(res, error, 'updateStock');
    } finally {
      connection.release();
    }
  }

  // ── GET /api/products/:id/stock-movements ───────────────────────────────
  async getStockMovements(req, res) {
    const { id } = req.params;
    try {
      const [product] = await this.pool.execute(
        'SELECT product_id, name, stock_quantity FROM products WHERE product_id = ?', [id]
      );
      if (product.length === 0) {
        return this.fail(res, 'Product not found.', 404);
      }

      const [movements] = await this.pool.execute(
        `SELECT sm.movement_id, sm.quantity, sm.reason, sm.reference_id,
                sm.note, sm.created_at, u.first_name, u.last_name
         FROM stock_movements sm
         INNER JOIN users u ON sm.user_id = u.user_id
         WHERE sm.product_id = ?
         ORDER BY sm.created_at DESC`,
        [id]
      );

      return this.success(res, { product: product[0], movements });
    } catch (error) {
      return this.handleError(res, error, 'getStockMovements');
    }
  }
}

module.exports = new ProductController();
