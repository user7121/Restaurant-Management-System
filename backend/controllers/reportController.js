// controllers/reportController.js
// Sales Report & Best-Seller report endpoints

const pool = require('../config/db');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parses and validates an optional date string (YYYY-MM-DD).
 * Returns a Date object or throws a descriptive error.
 */
function parseDate(value, label) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    throw new Error(`VALIDATION: Invalid ${label} date format. Expected YYYY-MM-DD.`);
  }
  return d;
}

/**
 * Validates that start_date is not after end_date.
 */
function assertDateRange(start, end) {
  if (start && end && start > end) {
    throw new Error('VALIDATION: start_date cannot be after end_date.');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/sales
// Query params:
//   start_date  (YYYY-MM-DD, optional – defaults to 30 days ago)
//   end_date    (YYYY-MM-DD, optional – defaults to today)
//   group_by    ('day' | 'week' | 'month', optional – defaults to 'day')
//
// Response:
//   {
//     success: true,
//     meta: { start_date, end_date, group_by, total_revenue, total_orders },
//     data: [ { period, order_count, revenue } ]
//   }
// ─────────────────────────────────────────────────────────────────────────────
const getSalesReport = async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'day' } = req.query;

    const ALLOWED_GROUP_BY = ['day', 'week', 'month'];
    if (!ALLOWED_GROUP_BY.includes(group_by)) {
      return res.status(400).json({
        success: false,
        message: `Invalid group_by value. Allowed values: ${ALLOWED_GROUP_BY.join(', ')}.`,
      });
    }

    // Default date range: last 30 days
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setDate(defaultStart.getDate() - 29);

    const startDate = parseDate(start_date, 'start_date') ?? defaultStart;
    const endDate   = parseDate(end_date,   'end_date')   ?? now;

    assertDateRange(startDate, endDate);

    // Format as YYYY-MM-DD for MySQL
    const fmt = (d) => d.toISOString().slice(0, 10);
    const startStr = fmt(startDate);
    const endStr   = fmt(endDate);

    // Build the GROUP BY expression based on granularity
    const groupExpr =
      group_by === 'month' ? "DATE_FORMAT(o.created_at, '%Y-%m')"
      : group_by === 'week' ? "DATE_FORMAT(DATE_SUB(o.created_at, INTERVAL WEEKDAY(o.created_at) DAY), '%Y-%m-%d')"
      : "DATE(o.created_at)";

    // Aggregate query — only count Delivered orders as real revenue
    const sql = `
      SELECT
        ${groupExpr}                   AS period,
        COUNT(o.order_id)              AS order_count,
        COALESCE(SUM(o.total_amount), 0) AS revenue
      FROM orders o
      WHERE
        o.status = 'Delivered'
        AND DATE(o.created_at) BETWEEN ? AND ?
      GROUP BY period
      ORDER BY period ASC
    `;

    const [rows] = await pool.execute(sql, [startStr, endStr]);

    // Summary totals
    const totalRevenue = rows.reduce((acc, r) => acc + parseFloat(r.revenue), 0);
    const totalOrders  = rows.reduce((acc, r) => acc + parseInt(r.order_count, 10), 0);

    return res.status(200).json({
      success: true,
      meta: {
        start_date: startStr,
        end_date:   endStr,
        group_by,
        total_revenue: parseFloat(totalRevenue.toFixed(2)),
        total_orders:  totalOrders,
      },
      data: rows.map((r) => ({
        period:      r.period,
        order_count: parseInt(r.order_count, 10),
        revenue:     parseFloat(parseFloat(r.revenue).toFixed(2)),
      })),
    });
  } catch (error) {
    console.error('getSalesReport error:', error.message);
    if (error.message.startsWith('VALIDATION:')) {
      return res.status(400).json({
        success: false,
        message: error.message.replace('VALIDATION: ', ''),
      });
    }
    return res.status(500).json({ success: false, message: 'Failed to generate sales report.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/best-sellers
// Query params:
//   start_date  (YYYY-MM-DD, optional – defaults to 30 days ago)
//   end_date    (YYYY-MM-DD, optional – defaults to today)
//   limit       (integer 1–100, optional – defaults to 10)
//
// Response:
//   {
//     success: true,
//     meta: { start_date, end_date, limit },
//     data: [
//       {
//         rank, product_id, product_name, category_name,
//         total_quantity_sold, total_revenue, order_count
//       }
//     ]
//   }
// ─────────────────────────────────────────────────────────────────────────────
const getBestSellers = async (req, res) => {
  try {
    const { start_date, end_date, limit: limitParam = '10' } = req.query;

    // Validate limit
    const limit = parseInt(limitParam, 10);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid limit value. Must be an integer between 1 and 100.',
      });
    }

    // Default date range: last 30 days
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setDate(defaultStart.getDate() - 29);

    const startDate = parseDate(start_date, 'start_date') ?? defaultStart;
    const endDate   = parseDate(end_date,   'end_date')   ?? now;

    assertDateRange(startDate, endDate);

    const fmt = (d) => d.toISOString().slice(0, 10);
    const startStr = fmt(startDate);
    const endStr   = fmt(endDate);

    const sql = `
      SELECT
        p.product_id,
        p.name                                AS product_name,
        c.category_name,
        SUM(oi.quantity)                      AS total_quantity_sold,
        SUM(oi.quantity * oi.unit_price)      AS total_revenue,
        COUNT(DISTINCT oi.order_id)           AS order_count
      FROM order_items oi
      INNER JOIN orders   o ON oi.order_id   = o.order_id
      INNER JOIN products p ON oi.product_id = p.product_id
      INNER JOIN categories c ON p.category_id = c.category_id
      WHERE
        o.status = 'Delivered'
        AND DATE(o.created_at) BETWEEN ? AND ?
      GROUP BY p.product_id, p.name, c.category_name
      ORDER BY total_quantity_sold DESC, total_revenue DESC
      LIMIT ?
    `;

    const [rows] = await pool.execute(sql, [startStr, endStr, limit]);

    return res.status(200).json({
      success: true,
      meta: {
        start_date: startStr,
        end_date:   endStr,
        limit,
      },
      data: rows.map((r, index) => ({
        rank:                index + 1,
        product_id:          r.product_id,
        product_name:        r.product_name,
        category_name:       r.category_name,
        total_quantity_sold: parseInt(r.total_quantity_sold, 10),
        total_revenue:       parseFloat(parseFloat(r.total_revenue).toFixed(2)),
        order_count:         parseInt(r.order_count, 10),
      })),
    });
  } catch (error) {
    console.error('getBestSellers error:', error.message);
    if (error.message.startsWith('VALIDATION:')) {
      return res.status(400).json({
        success: false,
        message: error.message.replace('VALIDATION: ', ''),
      });
    }
    return res.status(500).json({ success: false, message: 'Failed to generate best-sellers report.' });
  }
};

module.exports = { getSalesReport, getBestSellers };
