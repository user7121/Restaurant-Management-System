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
  updateStock,
  getStockMovements,
} = require('../controllers/productController');

// GET /api/products        - All authenticated users
router.get('/', verifyToken, getAllProducts);

// GET /api/products/:id    - All authenticated users
router.get('/:id', verifyToken, getProductById);

// GET /api/products/:id/stock-movements - All authenticated users
router.get('/:id/stock-movements', verifyToken, getStockMovements);

// POST /api/products       - Admin only
router.post('/', verifyToken, checkRole(['Admin']), createProduct);

// PUT /api/products/:id    - Admin only
router.put('/:id', verifyToken, checkRole(['Admin']), updateProduct);

// PATCH /api/products/:id/stock - Admin / Manager
router.patch('/:id/stock', verifyToken, checkRole(['Admin', 'Manager']), updateStock);

// DELETE /api/products/:id - Admin only
router.delete('/:id', verifyToken, checkRole(['Admin']), deleteProduct);

module.exports = router;

