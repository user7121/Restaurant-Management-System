// routes/reportRoutes.js
// Report routes — Admin and Manager access only

const express = require('express');
const router  = express.Router();
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const { getSalesReport, getBestSellers } = require('../controllers/reportController');

const adminOrManager = [verifyToken, checkRole(['Admin', 'Manager'])];

// GET /api/reports/sales        - Sales summary grouped by day / week / month
router.get('/sales', ...adminOrManager, getSalesReport);

// GET /api/reports/best-sellers - Top-N best-selling products
router.get('/best-sellers', ...adminOrManager, getBestSellers);

module.exports = router;
