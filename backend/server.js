// server.js
// Express uygulama giriş noktası

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes    = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes  = require('./routes/productRoutes');
const tableRoutes    = require('./routes/tableRoutes');
const orderRoutes    = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Postman gibi origin olmayan isteklere izin ver (geliştirme ortamı için)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS politikası tarafından engellendi: ${origin}`));
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

// Sağlık kontrolü (health check) endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Restoran Yönetim Sistemi API çalışıyor.',
    timestamp: new Date().toISOString(),
  });
});

// 404 - Tanımsız route yakalayıcı
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint bulunamadı: ${req.method} ${req.originalUrl}`,
  });
});

// Global hata yakalayıcı
app.use((err, req, res, next) => {
  console.error('Sunucu Hatası:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Sunucu tarafında beklenmeyen bir hata oluştu.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ─── Sunucuyu Başlat ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
  console.log(`📌 Ortam: ${process.env.NODE_ENV || 'development'}`);
});
