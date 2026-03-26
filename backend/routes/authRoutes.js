// routes/authRoutes.js
// Express router for auth endpoints

const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// POST /api/auth/register  → Block 2
router.post('/register', register);

// POST /api/auth/login     → Block 3
router.post('/login', login);

module.exports = router;
