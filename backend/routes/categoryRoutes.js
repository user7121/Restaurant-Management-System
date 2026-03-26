// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

// GET /api/categories        - All authenticated users
router.get('/', verifyToken, getAllCategories);

// POST /api/categories       - Admin only
router.post('/', verifyToken, checkRole(['Admin']), createCategory);

// PUT /api/categories/:id    - Admin only
router.put('/:id', verifyToken, checkRole(['Admin']), updateCategory);

// DELETE /api/categories/:id - Admin only
router.delete('/:id', verifyToken, checkRole(['Admin']), deleteCategory);

module.exports = router;
