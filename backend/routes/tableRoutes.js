// routes/tableRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const tableController = require('../controllers/tableController');

// GET /api/tables               - All authenticated users
router.get('/', verifyToken, (req, res) => tableController.getAll(req, res));

// GET /api/tables/:id           - All authenticated users
router.get('/:id', verifyToken, (req, res) => tableController.getById(req, res));

// PATCH /api/tables/:id/status  - Admin or Manager
router.patch('/:id/status', verifyToken, checkRole(['Admin', 'Manager']), (req, res) => tableController.updateStatus(req, res));

module.exports = router;
