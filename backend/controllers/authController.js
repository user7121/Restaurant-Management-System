// controllers/authController.js
// Auth operations: register and login
// Inheritance: extends BaseController
// Polymorphism: overrides handleError for duplicate-entry & FK errors

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const BaseController = require('./BaseController');

class AuthController extends BaseController {
  // ── Polymorphic error handler — domain-specific error mapping ───────────
  handleError(res, error, context = 'authentication') {
    console.error(`${context} error:`, error.message);

    if (error.code === 'ER_DUP_ENTRY') {
      const field = error.message.includes('email') ? 'Email' : 'Username';
      return this.fail(res, `${field} is already registered.`, 409);
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return this.fail(res, 'Invalid role_id: No role found matching this ID.', 400);
    }
    return this.fail(res, `Server error occurred during ${context}.`, 500);
  }

  // ── POST /api/auth/register ─────────────────────────────────────────────
  async register(req, res) {
    const { first_name, last_name, phone, email, role_id, username, password } = req.body;

    if (!first_name || !last_name || !email || !role_id || !username || !password) {
      return this.fail(res, 'Please fill in all required fields: first_name, last_name, email, role_id, username, password.');
    }
    if (password.length < 6) {
      return this.fail(res, 'Password must be at least 6 characters long.');
    }

    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const [userResult] = await connection.execute(
        `INSERT INTO users (first_name, last_name, phone, email, role_id) VALUES (?, ?, ?, ?, ?)`,
        [first_name, last_name, phone || null, email, role_id]
      );
      const newUserId = userResult.insertId;

      const password_hash = await bcrypt.hash(password, 12);

      await connection.execute(
        `INSERT INTO auth_credentials (user_id, username, password_hash) VALUES (?, ?, ?)`,
        [newUserId, username, password_hash]
      );

      await connection.commit();

      return this.success(res, {
        user_id: newUserId, first_name, last_name, email, username, role_id,
      }, 201, 'User registered successfully.');
    } catch (error) {
      await connection.rollback();
      return this.handleError(res, error, 'register');
    } finally {
      connection.release();
    }
  }

  // ── POST /api/auth/login ────────────────────────────────────────────────
  async login(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
      return this.fail(res, 'Username and password are required.');
    }

    try {
      const loginSQL = `
        SELECT ac.auth_id, ac.user_id, ac.username, ac.password_hash,
               ac.is_locked, ac.failed_attempts,
               u.first_name, u.last_name, u.email, u.is_active,
               r.role_name
        FROM auth_credentials ac
        INNER JOIN users u ON ac.user_id = u.user_id
        INNER JOIN roles r ON u.role_id = r.role_id
        WHERE ac.username = ?
      `;
      const [rows] = await this.pool.execute(loginSQL, [username]);

      if (rows.length === 0) {
        return this.fail(res, 'Invalid username or password.', 401);
      }

      const user = rows[0];

      if (user.is_locked) {
        return this.fail(res, 'Your account is locked. Please contact your administrator.', 403);
      }
      if (!user.is_active) {
        return this.fail(res, 'Your account is inactive. Please contact your administrator.', 403);
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        await this.pool.execute(
          `UPDATE auth_credentials SET failed_attempts = failed_attempts + 1 WHERE user_id = ?`,
          [user.user_id]
        );
        return this.fail(res, 'Invalid username or password.', 401);
      }

      const payload = {
        user_id: user.user_id, email: user.email,
        role_name: user.role_name, username: user.username,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      });

      await this.pool.execute(
        `UPDATE auth_credentials SET last_login = NOW(), failed_attempts = 0 WHERE user_id = ?`,
        [user.user_id]
      );

      return this.success(res, {
        token,
        user: {
          user_id: user.user_id, first_name: user.first_name,
          last_name: user.last_name, email: user.email,
          username: user.username, role_name: user.role_name,
        },
      }, 200, 'Login successful.');
    } catch (error) {
      return this.handleError(res, error, 'login');
    }
  }
}

// Export a singleton instance
module.exports = new AuthController();
