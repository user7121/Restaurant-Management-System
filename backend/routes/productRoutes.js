// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const productController = require('../controllers/productController');

// GET /api/products        - All authenticated users
router.get('/', verifyToken, (req, res) => productController.getAll(req, res));

// GET /api/products/:id    - All authenticated users
router.get('/:id', verifyToken, (req, res) => productController.getById(req, res));

// GET /api/products/:id/stock-movements - All authenticated users
router.get('/:id/stock-movements', verifyToken, (req, res) => productController.getStockMovements(req, res));

// POST /api/products       - Admin only
router.post('/', verifyToken, checkRole(['Admin']), (req, res) => productController.create(req, res));

// PUT /api/products/:id    - Admin only
router.put('/:id', verifyToken, checkRole(['Admin']), (req, res) => productController.update(req, res));

// PATCH /api/products/:id/stock - Admin / Manager
router.patch('/:id/stock', verifyToken, checkRole(['Admin', 'Manager']), (req, res) => productController.updateStock(req, res));

// DELETE /api/products/:id - Admin only
router.delete('/:id', verifyToken, checkRole(['Admin']), (req, res) => productController.delete(req, res));

module.exports = router;
