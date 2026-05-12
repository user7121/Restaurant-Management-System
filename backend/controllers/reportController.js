// controllers/reportController.js
// Sales Report & Best-Seller report endpoints
// Inheritance: extends BaseController
// Polymorphism: overrides handleError for VALIDATION errors

const BaseController = require('./BaseController');
const RevenueCalculator = require('../utils/revenueCalculator');

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

  // ── GET /api/reports/revenue-by-category ────────────────────────────────
  async getRevenueByCategory(req, res) {
    try {
      const { start_date, end_date } = req.query;
      const { startStr, endStr } = this._defaultDateRange(start_date, end_date);

      const sql = `
        SELECT
          c.category_id,
          c.category_name,
          SUM(oi.quantity)                 AS quantity_sold,
          SUM(oi.quantity * oi.unit_price) AS total_revenue,
          COUNT(DISTINCT oi.product_id)    AS unique_products,
          COUNT(DISTINCT oi.order_id)      AS order_count
        FROM order_items oi
        INNER JOIN orders o    ON oi.order_id   = o.order_id
        INNER JOIN products p  ON oi.product_id = p.product_id
        INNER JOIN categories c ON p.category_id = c.category_id
        WHERE o.status = 'Delivered' AND DATE(o.created_at) BETWEEN ? AND ?
        GROUP BY c.category_id, c.category_name
        ORDER BY total_revenue DESC
      `;

      const [rows] = await this.pool.execute(sql, [startStr, endStr]);

      return this.success(res, rows.map((r) => ({
        category_id:     r.category_id,
        category_name:   r.category_name,
        quantity_sold:   parseInt(r.quantity_sold, 10),
        total_revenue:   parseFloat(parseFloat(r.total_revenue).toFixed(2)),
        unique_products: parseInt(r.unique_products, 10),
        order_count:     parseInt(r.order_count, 10),
      })));
    } catch (error) {
      return this.handleError(res, error, 'getRevenueByCategory');
    }
  }

  // ── GET /api/reports/revenue-by-payment-method ──────────────────────────
  async getRevenueByPaymentMethod(req, res) {
    try {
      const { start_date, end_date } = req.query;
      const { startStr, endStr } = this._defaultDateRange(start_date, end_date);

      const sql = `
        SELECT
          COALESCE(o.payment_method, 'Unknown') AS payment_method,
          COUNT(o.order_id)                      AS transaction_count,
          SUM(o.total_amount)                    AS total_revenue,
          AVG(o.total_amount)                    AS average_transaction_value
        FROM orders o
        WHERE o.status = 'Delivered' AND DATE(o.created_at) BETWEEN ? AND ?
        GROUP BY o.payment_method
        ORDER BY total_revenue DESC
      `;

      const [rows] = await this.pool.execute(sql, [startStr, endStr]);

      return this.success(res, rows.map((r) => ({
        payment_method:           r.payment_method,
        transaction_count:        parseInt(r.transaction_count, 10),
        total_revenue:            parseFloat(parseFloat(r.total_revenue).toFixed(2)),
        average_transaction_value: parseFloat(parseFloat(r.average_transaction_value).toFixed(2)),
      })));
    } catch (error) {
      return this.handleError(res, error, 'getRevenueByPaymentMethod');
    }
  }

  // ── GET /api/reports/revenue-by-hour ────────────────────────────────────
  async getRevenueByHour(req, res) {
    try {
      const { start_date, end_date } = req.query;
      const { startStr, endStr } = this._defaultDateRange(start_date, end_date);

      const sql = `
        SELECT
          DATE_FORMAT(o.created_at, '%H:00') AS hour,
          COUNT(o.order_id)                   AS order_count,
          SUM(o.total_amount)                 AS total_revenue,
          AVG(o.total_amount)                 AS average_order_value
        FROM orders o
        WHERE o.status = 'Delivered' AND DATE(o.created_at) BETWEEN ? AND ?
        GROUP BY DATE_FORMAT(o.created_at, '%H:00')
        ORDER BY hour ASC
      `;

      const [rows] = await this.pool.execute(sql, [startStr, endStr]);

      return this.success(res, rows.map((r) => ({
        hour:                 r.hour,
        order_count:          parseInt(r.order_count, 10),
        total_revenue:        parseFloat(parseFloat(r.total_revenue).toFixed(2)),
        average_order_value:  parseFloat(parseFloat(r.average_order_value).toFixed(2)),
      })));
    } catch (error) {
      return this.handleError(res, error, 'getRevenueByHour');
    }
  }

  // ── GET /api/reports/daily-revenue ──────────────────────────────────────
  async getDailyRevenue(req, res) {
    try {
      const { start_date, end_date } = req.query;
      const { startStr, endStr } = this._defaultDateRange(start_date, end_date);

      const sql = `
        SELECT
          DATE(o.created_at)         AS date,
          COUNT(o.order_id)          AS order_count,
          SUM(o.total_amount)        AS total_revenue,
          AVG(o.total_amount)        AS average_order_value,
          MIN(o.total_amount)        AS min_order_value,
          MAX(o.total_amount)        AS max_order_value
        FROM orders o
        WHERE o.status = 'Delivered' AND DATE(o.created_at) BETWEEN ? AND ?
        GROUP BY DATE(o.created_at)
        ORDER BY date ASC
      `;

      const [rows] = await this.pool.execute(sql, [startStr, endStr]);

      return this.success(res, rows.map((r) => ({
        date:                  r.date,
        order_count:           parseInt(r.order_count, 10),
        total_revenue:         parseFloat(parseFloat(r.total_revenue).toFixed(2)),
        average_order_value:   parseFloat(parseFloat(r.average_order_value).toFixed(2)),
        min_order_value:       parseFloat(parseFloat(r.min_order_value).toFixed(2)),
        max_order_value:       parseFloat(parseFloat(r.max_order_value).toFixed(2)),
      })));
    } catch (error) {
      return this.handleError(res, error, 'getDailyRevenue');
    }
  }

  // ── GET /api/reports/comprehensive ──────────────────────────────────────
  async getComprehensiveReport(req, res) {
    try {
      const { start_date, end_date } = req.query;
      const { startStr, endStr } = this._defaultDateRange(start_date, end_date);

      // Fetch all necessary data
      const [orders] = await this.pool.execute(
        `SELECT order_id, total_amount, payment_method, created_at 
         FROM orders 
         WHERE status = 'Delivered' AND DATE(created_at) BETWEEN ? AND ?
         ORDER BY created_at ASC`,
        [startStr, endStr]
      );

      const [orderItems] = await this.pool.execute(
        `SELECT 
          oi.order_id, oi.product_id, oi.quantity, oi.unit_price,
          p.name AS product_name, c.category_name AS category
         FROM order_items oi
         INNER JOIN orders o ON oi.order_id = o.order_id
         INNER JOIN products p ON oi.product_id = p.product_id
         INNER JOIN categories c ON p.category_id = c.category_id
         WHERE o.status = 'Delivered' AND DATE(o.created_at) BETWEEN ? AND ?`,
        [startStr, endStr]
      );

      // Generate comprehensive report using RevenueCalculator
      const report = RevenueCalculator.generateComprehensiveReport(orders, orderItems);

      return this.success(res, report);
    } catch (error) {
      return this.handleError(res, error, 'getComprehensiveReport');
    }
  }

  // ── GET /api/reports/summary ────────────────────────────────────────────
  async getRevenueSummary(req, res) {
    try {
      const { start_date, end_date } = req.query;
      const { startStr, endStr } = this._defaultDateRange(start_date, end_date);

      const sql = `
        SELECT
          COUNT(o.order_id)           AS total_orders,
          SUM(o.total_amount)         AS total_revenue,
          AVG(o.total_amount)         AS average_order_value,
          MIN(o.total_amount)         AS minimum_order_value,
          MAX(o.total_amount)         AS maximum_order_value,
          COUNT(DISTINCT DATE(o.created_at)) AS days_with_orders
        FROM orders o
        WHERE o.status = 'Delivered' AND DATE(o.created_at) BETWEEN ? AND ?
      `;

      const [rows] = await this.pool.execute(sql, [startStr, endStr]);
      const summary = rows[0];

      return this.success(res, {
        total_orders:         parseInt(summary.total_orders, 10),
        total_revenue:        parseFloat(parseFloat(summary.total_revenue).toFixed(2)),
        average_order_value:  parseFloat(parseFloat(summary.average_order_value).toFixed(2)),
        minimum_order_value:  parseFloat(parseFloat(summary.minimum_order_value).toFixed(2)),
        maximum_order_value:  parseFloat(parseFloat(summary.maximum_order_value).toFixed(2)),
        days_with_orders:     parseInt(summary.days_with_orders, 10),
        date_range:           { start_date: startStr, end_date: endStr },
      });
    } catch (error) {
      return this.handleError(res, error, 'getRevenueSummary');
    }
  }
}

module.exports = new ReportController();
