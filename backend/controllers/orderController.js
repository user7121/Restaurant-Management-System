// controllers/orderController.js
// Order processing — Transaction + stock deduction + rollback
// Inheritance: extends BaseController
// Polymorphism: overrides handleError for NOT_FOUND / INSUFFICIENT_STOCK / FK errors

const BaseController = require('./BaseController');

class OrderController extends BaseController {
  /** @private */
  static VALID_STATUSES = ['Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled'];

  // ── Polymorphic error handler ───────────────────────────────────────────
  handleError(res, error, context = 'order operation') {
    console.error(`${context} error:`, error.message);

    if (error.message.startsWith('NOT_FOUND:')) {
      return this.fail(res, error.message.replace('NOT_FOUND: ', ''), 404);
    }
    if (error.message.startsWith('INSUFFICIENT_STOCK:')) {
      return this.fail(res, error.message.replace('INSUFFICIENT_STOCK: ', ''), 409);
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return this.fail(res, 'Invalid table_id or product_id.', 400);
    }
    return this.fail(res, `Failed to complete ${context}.`, 500);
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  async _validateProductsAndGetTotal(connection, items) {
    const productIds = items.map((i) => i.product_id);
    const placeholders = productIds.map(() => '?').join(', ');
    const [products] = await connection.execute(
      `SELECT product_id, name, price, stock_quantity FROM products WHERE product_id IN (${placeholders})`,
      productIds
    );

    if (products.length !== productIds.length) {
      const foundIds = products.map((p) => p.product_id);
      const missingIds = productIds.filter((id) => !foundIds.includes(id));
      throw new Error(`NOT_FOUND: The following product ID(s) were not found: ${missingIds.join(', ')}`);
    }

    const productMap = {};
    products.forEach((p) => { productMap[p.product_id] = p; });

    let total_amount = 0;
    for (const item of items) {
      const product = productMap[item.product_id];
      if (product.stock_quantity < item.quantity) {
        throw new Error(`INSUFFICIENT_STOCK: Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}`);
      }
      total_amount += parseFloat(product.price) * item.quantity;
    }

    return { productMap, total_amount };
  }

  async _insertOrderAndItems(connection, table_id, user_id, total_amount, items, productMap) {
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (table_id, user_id, total_amount, status) VALUES (?, ?, ?, 'Pending')`,
      [table_id, user_id, total_amount.toFixed(2)]
    );
    const newOrderId = orderResult.insertId;

    for (const item of items) {
      const product = productMap[item.product_id];
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)`,
        [newOrderId, item.product_id, item.quantity, product.price]
      );
    }
    return newOrderId;
  }

  async _deductStockAndOccupyTable(connection, items, user_id, newOrderId, table_id) {
    for (const item of items) {
      await connection.execute(
        `UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?`,
        [item.quantity, item.product_id]
      );
      await connection.execute(
        `INSERT INTO stock_movements (product_id, user_id, quantity, reason, reference_id, note) VALUES (?, ?, ?, 'order', ?, ?)`,
        [item.product_id, user_id, -item.quantity, newOrderId, `Order #${newOrderId} placed`]
      );
    }
    await connection.execute(
      `UPDATE dining_tables SET status = 'Occupied' WHERE table_id = ?`, [table_id]
    );
  }

  _validateItems(res, table_id, items) {
    if (!table_id) {
      this.fail(res, 'table_id is required.');
      return false;
    }
    if (!Array.isArray(items) || items.length === 0) {
      this.fail(res, 'items array must contain at least one product.');
      return false;
    }
    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity < 1) {
        this.fail(res, 'Each item requires a valid product_id and quantity (>= 1).');
        return false;
      }
    }
    return true;
  }

  _buildOrderResponse(newOrderId, table_id, user_id, total_amount, items, productMap) {
    return {
      order_id: newOrderId, table_id, user_id,
      total_amount: parseFloat(total_amount.toFixed(2)),
      status: 'Pending',
      items: items.map((item) => ({
        product_id: item.product_id,
        product_name: productMap[item.product_id].name,
        quantity: item.quantity,
        unit_price: parseFloat(productMap[item.product_id].price),
      })),
    };
  }

  // ── POST /api/orders ────────────────────────────────────────────────────
  async create(req, res) {
    const { table_id, items } = req.body;
    const user_id = req.user.user_id;

    if (!this._validateItems(res, table_id, items)) return;

    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const { productMap, total_amount } = await this._validateProductsAndGetTotal(connection, items);
      const newOrderId = await this._insertOrderAndItems(connection, table_id, user_id, total_amount, items, productMap);
      await this._deductStockAndOccupyTable(connection, items, user_id, newOrderId, table_id);

      await connection.commit();

      return this.success(
        res,
        this._buildOrderResponse(newOrderId, table_id, user_id, total_amount, items, productMap),
        201, 'Order created successfully.'
      );
    } catch (error) {
      await connection.rollback();
      return this.handleError(res, error, 'createOrder');
    } finally {
      connection.release();
    }
  }

  // ── POST /api/public/orders (guest — no auth) ──────────────────────────
  async createPublic(req, res) {
    const { table_id, items } = req.body;

    if (!this._validateItems(res, table_id, items)) return;

    const connection = await this.pool.getConnection();

    try {
      const [existingOrders] = await connection.execute(
        `SELECT order_id FROM orders WHERE table_id = ? AND status IN ('Pending', 'Preparing') LIMIT 1`,
        [table_id]
      );
      if (existingOrders.length > 0) {
        connection.release();
        return this.fail(res, 'This table already has an active order being prepared.', 409);
      }

      const [guestUser] = await connection.execute(
        `SELECT user_id FROM users WHERE email = 'guest@example.com' LIMIT 1`
      );
      if (guestUser.length === 0) {
        connection.release();
        return this.fail(res, 'Guest user not found in the system.', 500);
      }

      const user_id = guestUser[0].user_id;

      await connection.beginTransaction();

      const { productMap, total_amount } = await this._validateProductsAndGetTotal(connection, items);
      const newOrderId = await this._insertOrderAndItems(connection, table_id, user_id, total_amount, items, productMap);
      await this._deductStockAndOccupyTable(connection, items, user_id, newOrderId, table_id);

      await connection.commit();

      return this.success(
        res,
        this._buildOrderResponse(newOrderId, table_id, user_id, total_amount, items, productMap),
        201, 'Order created successfully.'
      );
    } catch (error) {
      await connection.rollback();
      return this.handleError(res, error, 'createPublicOrder');
    } finally {
      connection.release();
    }
  }

  // ── GET /api/orders ─────────────────────────────────────────────────────
  async getAll(req, res) {
    try {
      const sql = `
        SELECT o.order_id, o.total_amount, o.status, o.created_at,
               dt.table_number, u.first_name, u.last_name
        FROM orders o
        INNER JOIN dining_tables dt ON o.table_id = dt.table_id
        INNER JOIN users u ON o.user_id = u.user_id
        ORDER BY o.created_at DESC
      `;
      const [rows] = await this.pool.execute(sql);
      return this.success(res, rows);
    } catch (error) {
      return this.handleError(res, error, 'getAllOrders');
    }
  }

  // ── GET /api/orders/:id ─────────────────────────────────────────────────
  async getById(req, res) {
    const { id } = req.params;
    try {
      const [orderRows] = await this.pool.execute(
        `SELECT o.order_id, o.total_amount, o.status, o.created_at,
                dt.table_id, dt.table_number,
                u.user_id, u.first_name, u.last_name
         FROM orders o
         INNER JOIN dining_tables dt ON o.table_id = dt.table_id
         INNER JOIN users u ON o.user_id = u.user_id
         WHERE o.order_id = ?`,
        [id]
      );
      if (orderRows.length === 0) {
        return this.fail(res, 'Order not found.', 404);
      }

      const [itemRows] = await this.pool.execute(
        `SELECT oi.order_item_id, oi.quantity, oi.unit_price,
                p.product_id, p.name AS product_name
         FROM order_items oi
         INNER JOIN products p ON oi.product_id = p.product_id
         WHERE oi.order_id = ?`,
        [id]
      );

      return this.success(res, { ...orderRows[0], items: itemRows });
    } catch (error) {
      return this.handleError(res, error, 'getOrderById');
    }
  }

  // ── PATCH /api/orders/:id/status ────────────────────────────────────────
  async updateStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return this.fail(res, 'status field is required.');
    }
    if (!OrderController.VALID_STATUSES.includes(status)) {
      return this.fail(res, `Invalid status. Allowed values: ${OrderController.VALID_STATUSES.join(', ')}`);
    }

    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      const [orderRows] = await connection.execute(
        'SELECT order_id, table_id, status AS current_status FROM orders WHERE order_id = ?', [id]
      );
      if (orderRows.length === 0) {
        await connection.rollback();
        return this.fail(res, 'Order not found.', 404);
      }

      const currentOrder = orderRows[0];

      if (currentOrder.current_status === 'Cancelled' || currentOrder.current_status === 'Delivered') {
        await connection.rollback();
        return this.fail(res, `Cannot update status. Order is already "${currentOrder.current_status}".`, 409);
      }

      await connection.execute(
        'UPDATE orders SET status = ? WHERE order_id = ?', [status, id]
      );

      // Cancelled → restore stock + log movements
      if (status === 'Cancelled') {
        const user_id = req.user.user_id;
        const [orderItems] = await connection.execute(
          'SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]
        );

        for (const item of orderItems) {
          await connection.execute(
            `UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?`,
            [item.quantity, item.product_id]
          );
          await connection.execute(
            `INSERT INTO stock_movements (product_id, user_id, quantity, reason, reference_id, note) VALUES (?, ?, ?, 'cancellation', ?, ?)`,
            [item.product_id, user_id, item.quantity, Number(id), `Order #${id} cancelled — stock restored`]
          );
        }
      }

      // Delivered or Cancelled → free the table
      if (status === 'Delivered' || status === 'Cancelled') {
        await connection.execute(
          `UPDATE dining_tables SET status = 'Empty' WHERE table_id = ?`, [currentOrder.table_id]
        );
      }

      await connection.commit();
      return this.success(res, { order_id: Number(id), status }, 200, `Order status updated to "${status}".`);
    } catch (error) {
      await connection.rollback();
      return this.handleError(res, error, 'updateOrderStatus');
    } finally {
      connection.release();
    }
  }
}

module.exports = new OrderController();
