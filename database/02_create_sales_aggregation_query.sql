-- =====================================================
-- 02 - CREATE SALES AGGREGATION QUERY
-- Project: Cafe Sales Analysis Application
-- Compatible with: MySQL 8+
-- Purpose: Summarizes total sales, orders, sold items and average order value.
-- Required tables: orders, order_items
-- =====================================================

USE mysql_rest_core_schema;

-- General sales aggregation for selected date range
SELECT
    COUNT(DISTINCT o.order_id) AS total_orders,
    COALESCE(SUM(oi.quantity), 0) AS total_items_sold,
    ROUND(COALESCE(SUM(oi.quantity * oi.unit_price), 0), 2) AS total_revenue,
    ROUND(
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) /
        NULLIF(COUNT(DISTINCT o.order_id), 0),
        2
    ) AS average_order_value
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
WHERE o.status <> 'Cancelled'
  AND o.created_at BETWEEN '2026-01-01' AND '2026-12-31';

-- Daily sales aggregation
SELECT
    DATE(o.created_at) AS sales_date,
    COUNT(DISTINCT o.order_id) AS total_orders,
    SUM(oi.quantity) AS total_items_sold,
    ROUND(SUM(oi.quantity * oi.unit_price), 2) AS daily_revenue
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
WHERE o.status <> 'Cancelled'
GROUP BY DATE(o.created_at)
ORDER BY sales_date DESC;

-- Monthly sales aggregation
SELECT
    DATE_FORMAT(o.created_at, '%Y-%m') AS sales_month,
    COUNT(DISTINCT o.order_id) AS total_orders,
    SUM(oi.quantity) AS total_items_sold,
    ROUND(SUM(oi.quantity * oi.unit_price), 2) AS monthly_revenue
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
WHERE o.status <> 'Cancelled'
GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
ORDER BY sales_month DESC;
