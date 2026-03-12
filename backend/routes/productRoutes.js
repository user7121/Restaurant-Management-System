// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

// GET /api/products        - All authenticated users
router.get('/', verifyToken, getAllProducts);

// GET /api/products/:id    - All authenticated users
router.get('/:id', verifyToken, getProductById);

// POST /api/products       - Admin only
router.post('/', verifyToken, checkRole(['Admin']), createProduct);

// PUT /api/products/:id    - Admin only
router.put('/:id', verifyToken, checkRole(['Admin']), updateProduct);

// DELETE /api/products/:id - Admin only
router.delete('/:id', verifyToken, checkRole(['Admin']), deleteProduct);

module.exports = router;
