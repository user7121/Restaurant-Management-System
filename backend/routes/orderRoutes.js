// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/orderController');

// POST /api/orders         - Tüm yetkili kullanıcılar sipariş oluşturabilir
router.post('/', verifyToken, createOrder);

// GET /api/orders          - Sadece Admin ve Manager
router.get('/', verifyToken, checkRole(['Admin', 'Manager']), getAllOrders);

// GET /api/orders/:id      - Sadece Admin ve Manager
router.get('/:id', verifyToken, checkRole(['Admin', 'Manager']), getOrderById);

// PATCH /api/orders/:id/status - Sadece Admin ve Manager
router.patch('/:id/status', verifyToken, checkRole(['Admin', 'Manager']), updateOrderStatus);

module.exports = router;
