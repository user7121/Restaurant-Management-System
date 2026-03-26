// controllers/authController.js
// Auth operations: register (Block 2) and login (Block 3)

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 2: User Registration (Register)
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  const { first_name, last_name, phone, email, role_id, username, password } = req.body;

  // ── Basic field validation ────────────────────────────────────────────────
  if (!first_name || !last_name || !email || !role_id || !username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please fill in all required fields: first_name, last_name, email, role_id, username, password.',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.',
    });
  }

  // Start MySQL transaction
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // ── Step 1: Insert personal info into the users table ─────────────────
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

    // ── Step 2: Hash the password ─────────────────────────────────────────
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // ── Step 3: Insert credentials into the auth_credentials table ────────
    const insertAuthSQL = `
      INSERT INTO auth_credentials (user_id, username, password_hash)
      VALUES (?, ?, ?)
    `;
    await connection.execute(insertAuthSQL, [newUserId, username, password_hash]);

    // ── Commit the transaction ────────────────────────────────────────────
    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
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
    // Roll back the transaction on error
    await connection.rollback();
    console.error('Register error:', error.message);

    // Convert duplicate entry error to user-friendly message
    if (error.code === 'ER_DUP_ENTRY') {
      const field = error.message.includes('email') ? 'Email' : 'Username';
      return res.status(409).json({
        success: false,
        message: `${field} is already registered.`,
      });
    }

    // Foreign key error (invalid role_id)
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        message: 'Invalid role_id: No role found matching this ID.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error occurred during registration.',
    });
  } finally {
    // Always release the connection back to the pool
    connection.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 3: Login and JWT Generation
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { username, password } = req.body;

  // ── Basic field validation ────────────────────────────────────────────────
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required.',
    });
  }

  try {
    // ── JOIN query: auth_credentials + users + roles ───────────────────────
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

    // User not found
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    const user = rows[0];

    // ── Is the account locked? ────────────────────────────────────────────
    if (user.is_locked) {
      return res.status(403).json({
        success: false,
        message: 'Your account is locked. Please contact your administrator.',
      });
    }

    // ── Is the user active? ───────────────────────────────────────────────
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact your administrator.',
      });
    }

    // ── Password verification ─────────────────────────────────────────────
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      // Increment failed login attempt counter
      await pool.execute(
        `UPDATE auth_credentials SET failed_attempts = failed_attempts + 1 WHERE user_id = ?`,
        [user.user_id]
      );
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    // ── JWT payload ───────────────────────────────────────────────────────
    const payload = {
      user_id: user.user_id,
      email: user.email,
      role_name: user.role_name,
      username: user.username,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });

    // On successful login: update last_login and reset failed_attempts counter
    await pool.execute(
      `UPDATE auth_credentials SET last_login = NOW(), failed_attempts = 0 WHERE user_id = ?`,
      [user.user_id]
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
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
    console.error('Login error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred during login.',
    });
  }
};

module.exports = { register, login };
