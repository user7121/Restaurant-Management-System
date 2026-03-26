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

// POST /api/orders              - All authenticated users can create an order
router.post('/', verifyToken, createOrder);

// GET /api/orders               - Admin and Manager only
router.get('/', verifyToken, checkRole(['Admin', 'Manager']), getAllOrders);

// GET /api/orders/:id           - Admin and Manager only
router.get('/:id', verifyToken, checkRole(['Admin', 'Manager']), getOrderById);

// PATCH /api/orders/:id/status  - Admin and Manager only
router.patch('/:id/status', verifyToken, checkRole(['Admin', 'Manager']), updateOrderStatus);

module.exports = router;
