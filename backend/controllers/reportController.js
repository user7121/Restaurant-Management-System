// controllers/reportController.js
// Sales Report & Best-Seller report endpoints
// Inheritance: extends BaseController
// Polymorphism: overrides handleError for VALIDATION errors

const BaseController = require('./BaseController');

class ReportController extends BaseController {
  // ── Polymorphic error handler ───────────────────────────────────────────
  handleError(res, error, context = 'report generation') {
    console.error(`${context} error:`, error.message);

    if (error.message.startsWith('VALIDATION:')) {
      return this.fail(res, error.message.replace('VALIDATION: ', ''), 400);
    }
    return this.fail(res, `Failed to complete ${context}.`, 500);
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  _parseDate(value, label) {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      throw new Error(`VALIDATION: Invalid ${label} date format. Expected YYYY-MM-DD.`);
    }
    return d;
  }

  _assertDateRange(start, end) {
    if (start && end && start > end) {
      throw new Error('VALIDATION: start_date cannot be after end_date.');
    }
  }

  _defaultDateRange(start_date, end_date) {
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setDate(defaultStart.getDate() - 29);

    const startDate = this._parseDate(start_date, 'start_date') ?? defaultStart;
    const endDate   = this._parseDate(end_date,   'end_date')   ?? now;

    this._assertDateRange(startDate, endDate);

    const fmt = (d) => d.toISOString().slice(0, 10);
    return { startStr: fmt(startDate), endStr: fmt(endDate) };
  }

  // ── GET /api/reports/sales ──────────────────────────────────────────────
  async getSalesReport(req, res) {
    try {
      const { start_date, end_date, group_by = 'day' } = req.query;

      const ALLOWED_GROUP_BY = ['day', 'week', 'month'];
      if (!ALLOWED_GROUP_BY.includes(group_by)) {
        return this.fail(res, `Invalid group_by value. Allowed values: ${ALLOWED_GROUP_BY.join(', ')}.`);
      }

      const { startStr, endStr } = this._defaultDateRange(start_date, end_date);

      const groupExpr =
        group_by === 'month' ? "DATE_FORMAT(o.created_at, '%Y-%m')"
        : group_by === 'week' ? "DATE_FORMAT(DATE_SUB(o.created_at, INTERVAL WEEKDAY(o.created_at) DAY), '%Y-%m-%d')"
        : "DATE(o.created_at)";

      const sql = `
        SELECT
          ${groupExpr}                      AS period,
          COUNT(o.order_id)                 AS order_count,
          COALESCE(SUM(o.total_amount), 0)  AS revenue
        FROM orders o
        WHERE o.status = 'Delivered' AND DATE(o.created_at) BETWEEN ? AND ?
        GROUP BY period
        ORDER BY period ASC
      `;

      const [rows] = await this.pool.execute(sql, [startStr, endStr]);

      const totalRevenue = rows.reduce((acc, r) => acc + parseFloat(r.revenue), 0);
      const totalOrders  = rows.reduce((acc, r) => acc + parseInt(r.order_count, 10), 0);

      return this.success(res, rows.map((r) => ({
        period:      r.period,
        order_count: parseInt(r.order_count, 10),
        revenue:     parseFloat(parseFloat(r.revenue).toFixed(2)),
      })));
    } catch (error) {
      return this.handleError(res, error, 'getSalesReport');
    }
  }

  // ── GET /api/reports/best-sellers ───────────────────────────────────────
  async getBestSellers(req, res) {
    try {
      const { start_date, end_date, limit: limitParam = '10' } = req.query;

      const limit = parseInt(limitParam, 10);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        return this.fail(res, 'Invalid limit value. Must be an integer between 1 and 100.');
      }

      const { startStr, endStr } = this._defaultDateRange(start_date, end_date);

      const sql = `
        SELECT
          p.product_id, p.name AS product_name, c.category_name,
          SUM(oi.quantity)                 AS total_quantity_sold,
          SUM(oi.quantity * oi.unit_price) AS total_revenue,
          COUNT(DISTINCT oi.order_id)      AS order_count
        FROM order_items oi
        INNER JOIN orders o    ON oi.order_id   = o.order_id
        INNER JOIN products p  ON oi.product_id = p.product_id
        INNER JOIN categories c ON p.category_id = c.category_id
        WHERE o.status = 'Delivered' AND DATE(o.created_at) BETWEEN ? AND ?
        GROUP BY p.product_id, p.name, c.category_name
        ORDER BY total_quantity_sold DESC, total_revenue DESC
        LIMIT ?
      `;

      const [rows] = await this.pool.execute(sql, [startStr, endStr, limit]);

      return this.success(res, rows.map((r, index) => ({
        rank:                index + 1,
        product_id:          r.product_id,
        product_name:        r.product_name,
        category_name:       r.category_name,
        total_quantity_sold: parseInt(r.total_quantity_sold, 10),
        total_revenue:       parseFloat(parseFloat(r.total_revenue).toFixed(2)),
        order_count:         parseInt(r.order_count, 10),
      })));
    } catch (error) {
      return this.handleError(res, error, 'getBestSellers');
    }
  }
}

module.exports = new ReportController();
