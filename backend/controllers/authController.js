// controllers/authController.js
// Auth işlemleri: register (Blok 2) ve login (Blok 3)

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// ─────────────────────────────────────────────────────────────────────────────
// BLOK 2: Kullanıcı Kayıt (Register)
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  const { first_name, last_name, phone, email, role_id, username, password } = req.body;

  // ── Temel alan doğrulaması ────────────────────────────────────────────────
  if (!first_name || !last_name || !email || !role_id || !username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Lütfen tüm zorunlu alanları doldurun: first_name, last_name, email, role_id, username, password.',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Şifre en az 6 karakter olmalıdır.',
    });
  }

  // MySQL transaction başlat
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // ── Adım 1: users tablosuna kişisel bilgileri ekle ────────────────────
    const insertUserSQL = `
      INSERT INTO users (first_name, last_name, phone, email, role_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [userResult] = await connection.execute(insertUserSQL, [
      first_name,
      last_name,
      phone || null,
      email,
      role_id,
    ]);

    const newUserId = userResult.insertId;

    // ── Adım 2: Şifreyi hashle ────────────────────────────────────────────
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // ── Adım 3: auth_credentials tablosuna kimlik bilgilerini ekle ────────
    const insertAuthSQL = `
      INSERT INTO auth_credentials (user_id, username, password_hash)
      VALUES (?, ?, ?)
    `;
    await connection.execute(insertAuthSQL, [newUserId, username, password_hash]);

    // ── Transaction'ı onayla ──────────────────────────────────────────────
    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Kullanıcı başarıyla kayıt edildi.',
      data: {
        user_id: newUserId,
        first_name,
        last_name,
        email,
        username,
        role_id,
      },
    });
  } catch (error) {
    // Hata durumunda transaction'ı geri al
    await connection.rollback();
    console.error('Register hatası:', error.message);

    // Duplicate entry hatasını kullanıcı dostu mesaja çevir
    if (error.code === 'ER_DUP_ENTRY') {
      const field = error.message.includes('email') ? 'E-posta' : 'Kullanıcı adı';
      return res.status(409).json({
        success: false,
        message: `${field} zaten kayıtlı.`,
      });
    }

    // Yabancı anahtar hatası (geçersiz role_id)
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz role_id: Bu ID ile eşleşen bir rol bulunamadı.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Kayıt sırasında sunucu hatası oluştu.',
    });
  } finally {
    // Bağlantıyı her durumda havuza geri bırak
    connection.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BLOK 3: Giriş (Login) ve JWT Üretimi
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { username, password } = req.body;

  // ── Temel alan doğrulaması ────────────────────────────────────────────────
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Kullanıcı adı ve şifre zorunludur.',
    });
  }

  try {
    // ── auth_credentials + users + roles JOIN sorgusu ─────────────────────
    const loginSQL = `
      SELECT
        ac.auth_id,
        ac.user_id,
        ac.username,
        ac.password_hash,
        ac.is_locked,
        ac.failed_attempts,
        u.first_name,
        u.last_name,
        u.email,
        u.is_active,
        r.role_name
      FROM auth_credentials ac
      INNER JOIN users u ON ac.user_id = u.user_id
      INNER JOIN roles r ON u.role_id = r.role_id
      WHERE ac.username = ?
    `;
    const [rows] = await pool.execute(loginSQL, [username]);

    // Kullanıcı bulunamadı
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz kullanıcı adı veya şifre.',
      });
    }

    const user = rows[0];

    // ── Hesap kilitli mi? ─────────────────────────────────────────────────
    if (user.is_locked) {
      return res.status(403).json({
        success: false,
        message: 'Hesabınız kilitlenmiştir. Lütfen yöneticinizle iletişime geçin.',
      });
    }

    // ── Kullanıcı aktif mi? ───────────────────────────────────────────────
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Hesabınız pasif durumda. Lütfen yöneticinizle iletişime geçin.',
      });
    }

    // ── Şifre doğrulama ───────────────────────────────────────────────────
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      // Başarısız giriş sayısını artır
      await pool.execute(
        `UPDATE auth_credentials SET failed_attempts = failed_attempts + 1 WHERE user_id = ?`,
        [user.user_id]
      );
      return res.status(401).json({
        success: false,
        message: 'Geçersiz kullanıcı adı veya şifre.',
      });
    }

    // ── JWT payload'ı ─────────────────────────────────────────────────────
    const payload = {
      user_id: user.user_id,
      email: user.email,
      role_name: user.role_name,
      username: user.username,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });

    // Başarılı girişte: son giriş zamanını güncelle, başarısız sayacı sıfırla
    await pool.execute(
      `UPDATE auth_credentials SET last_login = NOW(), failed_attempts = 0 WHERE user_id = ?`,
      [user.user_id]
    );

    return res.status(200).json({
      success: true,
      message: 'Giriş başarılı.',
      data: {
        token,
        user: {
          user_id: user.user_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          username: user.username,
          role_name: user.role_name,
        },
      },
    });
  } catch (error) {
    console.error('Login hatası:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Giriş sırasında sunucu hatası oluştu.',
    });
  }
};

module.exports = { register, login };
