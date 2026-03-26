// controllers/categoryController.js
// Category CRUD operations - Admin only

const pool = require('../config/db');

// GET /api/categories - List all categories
const getAllCategories = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT category_id, category_name FROM categories ORDER BY category_name ASC'
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('getAllCategories error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve categories.' });
  }
};

// POST /api/categories - Create a new category (Admin)
const createCategory = async (req, res) => {
  const { category_name } = req.body;
  if (!category_name || category_name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Category name is required.' });
  }
  try {
    const [result] = await pool.execute(
      'INSERT INTO categories (category_name) VALUES (?)',
      [category_name.trim()]
    );
    return res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: { category_id: result.insertId, category_name: category_name.trim() },
    });
  } catch (error) {
    console.error('createCategory error:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'This category name already exists.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to create category.' });
  }
};

// PUT /api/categories/:id - Update a category (Admin)
const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { category_name } = req.body;
  if (!category_name || category_name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Category name is required.' });
  }
  try {
    const [result] = await pool.execute(
      'UPDATE categories SET category_name = ? WHERE category_id = ?',
      [category_name.trim(), id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    return res.status(200).json({
      success: true,
      message: 'Category updated.',
      data: { category_id: Number(id), category_name: category_name.trim() },
    });
  } catch (error) {
    console.error('updateCategory error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to update category.' });
  }
};

// DELETE /api/categories/:id - Delete a category (Admin)
const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute(
      'DELETE FROM categories WHERE category_id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    return res.status(200).json({ success: true, message: 'Category deleted.' });
  } catch (error) {
    console.error('deleteCategory error:', error.message);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        success: false,
        message: 'This category has products attached. Please delete or reassign the products first.',
      });
    }
    return res.status(500).json({ success: false, message: 'Failed to delete category.' });
  }
};

module.exports = { getAllCategories, createCategory, updateCategory, deleteCategory };
