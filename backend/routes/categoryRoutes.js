// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const categoryController = require('../controllers/categoryController');

// GET /api/categories        - All authenticated users
router.get('/', verifyToken, (req, res) => categoryController.getAll(req, res));

// POST /api/categories       - Admin only
router.post('/', verifyToken, checkRole(['Admin']), (req, res) => categoryController.create(req, res));

// PUT /api/categories/:id    - Admin only
router.put('/:id', verifyToken, checkRole(['Admin']), (req, res) => categoryController.update(req, res));

// DELETE /api/categories/:id - Admin only
router.delete('/:id', verifyToken, checkRole(['Admin']), (req, res) => categoryController.delete(req, res));

module.exports = router;
