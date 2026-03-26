// routes/tableRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const {
  getAllTables,
  getTableById,
  updateTableStatus,
} = require('../controllers/tableController');

// GET /api/tables               - All authenticated users
router.get('/', verifyToken, getAllTables);

// GET /api/tables/:id           - All authenticated users
router.get('/:id', verifyToken, getTableById);

// PATCH /api/tables/:id/status  - Admin or Manager
router.patch('/:id/status', verifyToken, checkRole(['Admin', 'Manager']), updateTableStatus);

module.exports = router;
