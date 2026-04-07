const express = require('express');
const router = express.Router();
const { getAllCategories } = require('../controllers/categoryController');
const { getAllProducts } = require('../controllers/productController');
const { createPublicOrder } = require('../controllers/orderController');

// GET /api/public/categories - Public menu categories
router.get('/categories', getAllCategories);

// GET /api/public/products - Public menu products
router.get('/products', getAllProducts);

// POST /api/public/orders - Public order creation (Guest)
router.post('/orders', createPublicOrder);

module.exports = router;
