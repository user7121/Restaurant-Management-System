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

// GET /api/categories     - Herkes görebilir (token gerekli)
router.get('/', verifyToken, getAllCategories);

// POST /api/categories    - Sadece Admin
router.post('/', verifyToken, checkRole(['Admin']), createCategory);

// PUT /api/categories/:id - Sadece Admin
router.put('/:id', verifyToken, checkRole(['Admin']), updateCategory);

// DELETE /api/categories/:id - Sadece Admin
router.delete('/:id', verifyToken, checkRole(['Admin']), deleteCategory);

module.exports = router;
