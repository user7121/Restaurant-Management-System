// controllers/BaseController.js
// Base class for all controllers — demonstrates Encapsulation & provides
// shared helpers that child classes inherit (Inheritance) and override (Polymorphism).

const pool = require('../config/db');

class BaseController {
  // ── Encapsulation: database pool is a private field ──────────────────────
  #pool;

  constructor() {
    this.#pool = pool;
  }

  /** Protected-style accessor so subclasses can reach the pool */
  get pool() {
    return this.#pool;
  }

  // ── Shared response helpers ──────────────────────────────────────────────

  success(res, data, statusCode = 200, message) {
    const body = { success: true };
    if (message) body.message = message;
    if (data !== undefined) body.data = data;
    return res.status(statusCode).json(body);
  }

  fail(res, message, statusCode = 400) {
    return res.status(statusCode).json({ success: false, message });
  }

  // ── Polymorphic error handler — children override for domain logic ──────
  handleError(res, error, context = 'operation') {
    console.error(`${context} error:`, error.message);
    return this.fail(res, `Failed to complete ${context}.`, 500);
  }
}

module.exports = BaseController;
