// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const orderController = require('../controllers/orderController');

// POST /api/orders              - All authenticated users can create an order
router.post('/', verifyToken, (req, res) => orderController.create(req, res));

// GET /api/orders               - Admin and Manager only
router.get('/', verifyToken, checkRole(['Admin', 'Manager']), (req, res) => orderController.getAll(req, res));

// GET /api/orders/:id           - Admin and Manager only
router.get('/:id', verifyToken, checkRole(['Admin', 'Manager']), (req, res) => orderController.getById(req, res));

// PATCH /api/orders/:id/status  - Admin and Manager only
router.patch('/:id/status', verifyToken, checkRole(['Admin', 'Manager']), (req, res) => orderController.updateStatus(req, res));

module.exports = router;
