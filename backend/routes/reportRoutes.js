// routes/reportRoutes.js
// Report routes — Admin and Manager access only

const express = require('express');
const router  = express.Router();
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const reportController = require('../controllers/reportController');

const adminOrManager = [verifyToken, checkRole(['Admin', 'Manager'])];

// GET /api/reports/sales        - Sales summary grouped by day / week / month
router.get('/sales', ...adminOrManager, (req, res) => reportController.getSalesReport(req, res));

// GET /api/reports/best-sellers - Top-N best-selling products
router.get('/best-sellers', ...adminOrManager, (req, res) => reportController.getBestSellers(req, res));

// GET /api/reports/revenue-by-category - Revenue breakdown by product category
router.get('/revenue-by-category', ...adminOrManager, (req, res) => reportController.getRevenueByCategory(req, res));

// GET /api/reports/revenue-by-payment-method - Revenue breakdown by payment method
router.get('/revenue-by-payment-method', ...adminOrManager, (req, res) => reportController.getRevenueByPaymentMethod(req, res));

// GET /api/reports/revenue-by-hour - Revenue breakdown by hour of day
router.get('/revenue-by-hour', ...adminOrManager, (req, res) => reportController.getRevenueByHour(req, res));

// GET /api/reports/daily-revenue - Daily revenue breakdown with statistics
router.get('/daily-revenue', ...adminOrManager, (req, res) => reportController.getDailyRevenue(req, res));

// GET /api/reports/summary - Revenue summary statistics for date range
router.get('/summary', ...adminOrManager, (req, res) => reportController.getRevenueSummary(req, res));

// GET /api/reports/comprehensive - Complete revenue analysis across all dimensions
router.get('/comprehensive', ...adminOrManager, (req, res) => reportController.getComprehensiveReport(req, res));

module.exports = router;
