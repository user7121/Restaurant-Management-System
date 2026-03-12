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

// GET /api/products       - Herkes görebilir (token gerekli)
router.get('/', verifyToken, getAllProducts);

// GET /api/products/:id   - Herkes görebilir (token gerekli)
router.get('/:id', verifyToken, getProductById);

// POST /api/products      - Sadece Admin
router.post('/', verifyToken, checkRole(['Admin']), createProduct);

// PUT /api/products/:id   - Sadece Admin
router.put('/:id', verifyToken, checkRole(['Admin']), updateProduct);

// DELETE /api/products/:id - Sadece Admin
router.delete('/:id', verifyToken, checkRole(['Admin']), deleteProduct);

module.exports = router;
