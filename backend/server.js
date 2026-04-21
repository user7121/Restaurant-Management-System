// server.js
// Express application entry point

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes     = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes  = require('./routes/productRoutes');
const tableRoutes    = require('./routes/tableRoutes');
const orderRoutes    = require('./routes/orderRoutes');
const publicRoutes   = require('./routes/publicRoutes');
const reportRoutes   = require('./routes/reportRoutes');
const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. Postman) in development
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Blocked by CORS policy: ${origin}`));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/tables',     tableRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/public',     publicRoutes);
app.use('/api/reports',    reportRoutes);
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Restaurant Management System API is running.',
    timestamp: new Date().toISOString(),
  });
});

// 404 - Unknown route handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred on the server.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
  console.log(`📌 Environment: ${process.env.NODE_ENV || 'development'}`);
});
