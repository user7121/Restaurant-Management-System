// controllers/productController.js
// Product CRUD operations - Admin only

const pool = require('../config/db');

// GET /api/products - List all products (authenticated users)
const getAllProducts = async (req, res) => {
  try {
    const sql = `
      SELECT
        p.product_id,
        p.name,
        p.price,
        p.stock_quantity,
        c.category_id,
        c.category_name
      FROM products p
      INNER JOIN categories c ON p.category_id = c.category_id
      ORDER BY c.category_name ASC, p.name ASC
    `;
    const [rows] = await pool.execute(sql);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('getAllProducts error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve products.' });
  }
};

// GET /api/products/:id - Get a single product
const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute(
      `SELECT p.product_id, p.name, p.price, p.stock_quantity,
              c.category_id, c.category_name
       FROM products p
       INNER JOIN categories c ON p.category_id = c.category_id
       WHERE p.product_id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('getProductById error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve product.' });
  }
};

// POST /api/products - Create a new product (Admin)
const createProduct = async (req, res) => {
  const { category_id, name, price, stock_quantity } = req.body;
  if (!category_id || !name || price === undefined) {
    return res.status(400).json({
      success: false,
      message: 'category_id, name and price are required.',
    });
  }
  if (parseFloat(price) < 0) {
    return res.status(400).json({ success: false, message: 'Price cannot be negative.' });
  }
  try {
    const [result] = await pool.execute(
      'INSERT INTO products (category_id, name, price, stock_quantity) VALUES (?, ?, ?, ?)',
      [category_id, name.trim(), price, stock_quantity ?? 0]
    );
    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: {
        product_id: result.insertId,
        category_id,
        name: name.trim(),
        price,
        stock_quantity: stock_quantity ?? 0,
      },
    });
  } catch (error) {
    console.error('createProduct error:', error.message);
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ success: false, message: 'Invalid category_id.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to create product.' });
  }
};

// PUT /api/products/:id - Update a product (Admin)
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { category_id, name, price, stock_quantity } = req.body;

  // At least one field must be provided
  if (!category_id && !name && price === undefined && stock_quantity === undefined) {
    return res.status(400).json({
      success: false,
      message: 'At least one field must be provided for update.',
    });
  }

  try {
    // Fetch current data first
    const [existing] = await pool.execute(
      'SELECT * FROM products WHERE product_id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const current = existing[0];
    const updatedCategoryId   = category_id    ?? current.category_id;
    const updatedName         = name           ? name.trim() : current.name;
    const updatedPrice        = price          ?? current.price;
    const updatedStock        = stock_quantity ?? current.stock_quantity;

    await pool.execute(
      `UPDATE products
       SET category_id = ?, name = ?, price = ?, stock_quantity = ?
       WHERE product_id = ?`,
      [updatedCategoryId, updatedName, updatedPrice, updatedStock, id]
    );

    return res.status(200).json({
      success: true,
      message: 'Product updated.',
      data: {
        product_id: Number(id),
        category_id: updatedCategoryId,
        name: updatedName,
        price: updatedPrice,
        stock_quantity: updatedStock,
      },
    });
  } catch (error) {
    console.error('updateProduct error:', error.message);
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ success: false, message: 'Invalid category_id.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
};

// DELETE /api/products/:id - Delete a product (Admin)
const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute(
      'DELETE FROM products WHERE product_id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    return res.status(200).json({ success: true, message: 'Product deleted.' });
  } catch (error) {
    console.error('deleteProduct error:', error.message);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        success: false,
        message: 'This product is referenced in existing orders and cannot be deleted.',
      });
    }
    return res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/products/:id/stock - Manual stock adjustment (Admin / Manager)
// Body: { "quantity": 10, "type": "add" | "remove", "note": "optional reason" }
// ─────────────────────────────────────────────────────────────────────────────
const updateStock = async (req, res) => {
  const { id } = req.params;
  const { quantity, type, note } = req.body;
  const user_id = req.user.user_id;

  // Validation
  if (!quantity || !Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({
      success: false,
      message: 'quantity must be a positive integer (>= 1).',
    });
  }
  if (!type || !['add', 'remove'].includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'type must be either "add" or "remove".',
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Check if product exists and get current stock
    const [rows] = await connection.execute(
      'SELECT product_id, name, stock_quantity FROM products WHERE product_id = ?',
      [id]
    );
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = rows[0];
    const delta = type === 'add' ? quantity : -quantity;
    const newStock = product.stock_quantity + delta;

    // Prevent negative stock
    if (newStock < 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: `Insufficient stock. Current: ${product.stock_quantity}, Attempted to remove: ${quantity}`,
      });
    }

    // Update stock
    await connection.execute(
      'UPDATE products SET stock_quantity = ? WHERE product_id = ?',
      [newStock, id]
    );

    // Log stock movement
    const reason = type === 'add' ? 'manual_add' : 'manual_remove';
    await connection.execute(
      `INSERT INTO stock_movements (product_id, user_id, quantity, reason, note)
       VALUES (?, ?, ?, ?, ?)`,
      [id, user_id, delta, reason, note || null]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Stock ${type === 'add' ? 'increased' : 'decreased'} successfully.`,
      data: {
        product_id: Number(id),
        product_name: product.name,
        previous_stock: product.stock_quantity,
        adjustment: delta,
        new_stock: newStock,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('updateStock error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to update stock.' });
  } finally {
    connection.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/products/:id/stock-movements - Stock movement history for a product
// ─────────────────────────────────────────────────────────────────────────────
const getStockMovements = async (req, res) => {
  const { id } = req.params;
  try {
    // Verify product exists
    const [product] = await pool.execute(
      'SELECT product_id, name, stock_quantity FROM products WHERE product_id = ?',
      [id]
    );
    if (product.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const [movements] = await pool.execute(
      `SELECT sm.movement_id, sm.quantity, sm.reason, sm.reference_id,
              sm.note, sm.created_at,
              u.first_name, u.last_name
       FROM stock_movements sm
       INNER JOIN users u ON sm.user_id = u.user_id
       WHERE sm.product_id = ?
       ORDER BY sm.created_at DESC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        product: product[0],
        movements,
      },
    });
  } catch (error) {
    console.error('getStockMovements error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve stock movements.' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getStockMovements,
};
