// routes/authRoutes.js
// Auth endpoint'leri için Express router

const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// POST /api/auth/register  → Blok 2
router.post('/register', register);

// POST /api/auth/login     → Blok 3
router.post('/login', login);

module.exports = router;
