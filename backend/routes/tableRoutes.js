// routes/tableRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const {
  getAllTables,
  getTableById,
  updateTableStatus,
} = require('../controllers/tableController');

// GET /api/tables       - Herkes görebilir (token gerekli)
router.get('/', verifyToken, getAllTables);

// GET /api/tables/:id   - Herkes görebilir (token gerekli)
router.get('/:id', verifyToken, getTableById);

// PATCH /api/tables/:id/status - Admin veya Manager
router.patch('/:id/status', verifyToken, checkRole(['Admin', 'Manager']), updateTableStatus);

module.exports = router;
