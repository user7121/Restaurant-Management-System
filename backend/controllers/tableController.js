// controllers/tableController.js
// Table management — Admin and Manager access
// Inheritance: extends BaseController

const BaseController = require('./BaseController');

class TableController extends BaseController {
  /** @private */
  static VALID_STATUSES = ['Empty', 'Occupied'];

  // ── GET /api/tables ─────────────────────────────────────────────────────
  async getAll(req, res) {
    try {
      const [rows] = await this.pool.execute(
        'SELECT table_id, table_number, status FROM dining_tables ORDER BY table_number ASC'
      );
      return this.success(res, rows);
    } catch (error) {
      return this.handleError(res, error, 'getAllTables');
    }
  }

  // ── GET /api/tables/:id ─────────────────────────────────────────────────
  async getById(req, res) {
    const { id } = req.params;
    try {
      const [rows] = await this.pool.execute(
        'SELECT table_id, table_number, status FROM dining_tables WHERE table_id = ?', [id]
      );
      if (rows.length === 0) {
        return this.fail(res, 'Table not found.', 404);
      }
      return this.success(res, rows[0]);
    } catch (error) {
      return this.handleError(res, error, 'getTableById');
    }
  }

  // ── PATCH /api/tables/:id/status ────────────────────────────────────────
  async updateStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return this.fail(res, 'status field is required.');
    }
    if (!TableController.VALID_STATUSES.includes(status)) {
      return this.fail(res, `Invalid status. Allowed values: ${TableController.VALID_STATUSES.join(', ')}`);
    }

    try {
      const [result] = await this.pool.execute(
        'UPDATE dining_tables SET status = ? WHERE table_id = ?', [status, id]
      );
      if (result.affectedRows === 0) {
        return this.fail(res, 'Table not found.', 404);
      }
      return this.success(res, { table_id: Number(id), status }, 200, `Table status updated to "${status}".`);
    } catch (error) {
      return this.handleError(res, error, 'updateTableStatus');
    }
  }
}

module.exports = new TableController();
