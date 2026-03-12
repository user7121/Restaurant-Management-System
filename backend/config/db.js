// config/db.js
// MySQL bağlantı havuzu (connection pool) - mysql2/promise kullanır

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cafe_restaurant_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

// Başlangıçta bağlantıyı doğrula
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL veritabanına başarıyla bağlanıldı.');
    connection.release();
  } catch (error) {
    console.error('❌ MySQL bağlantı hatası:', error.message);
    process.exit(1);
  }
})();

module.exports = pool;
