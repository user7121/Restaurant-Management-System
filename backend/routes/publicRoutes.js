// routes/publicRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const productController  = require('../controllers/productController');
const orderController    = require('../controllers/orderController');

// GET /api/public/categories - Public menu categories
router.get('/categories', (req, res) => categoryController.getAll(req, res));

// GET /api/public/products - Public menu products
router.get('/products', (req, res) => productController.getAll(req, res));

// POST /api/public/orders - Public order creation (Guest)
router.post('/orders', (req, res) => orderController.createPublic(req, res));

module.exports = router;
