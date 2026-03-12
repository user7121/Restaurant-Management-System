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

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
