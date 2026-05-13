-- =====================================================
-- 01 - CREATE BEST-SELLER SQL QUERY
-- Project: Cafe Sales Analysis Application
-- Compatible with: MySQL 8+
-- Purpose: Finds the best-selling cafe products by quantity and revenue.
-- Required tables: orders, order_items, products, categories
-- =====================================================

USE mysql_rest_core_schema;

-- Top 10 best-selling products
SELECT
    p.product_id,
    p.name AS product_name,
    c.category_name,
    SUM(oi.quantity) AS total_quantity_sold,
    ROUND(SUM(oi.quantity * oi.unit_price), 2) AS total_revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN products p ON oi.product_id = p.product_id
JOIN categories c ON p.category_id = c.category_id
WHERE o.status <> 'Cancelled'
GROUP BY
    p.product_id,
    p.name,
    c.category_name
ORDER BY
    total_quantity_sold DESC,
    total_revenue DESC
LIMIT 10;

-- Best-selling products by category
SELECT
    c.category_name,
    p.name AS product_name,
    SUM(oi.quantity) AS total_quantity_sold,
    ROUND(SUM(oi.quantity * oi.unit_price), 2) AS total_revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN products p ON oi.product_id = p.product_id
JOIN categories c ON p.category_id = c.category_id
WHERE o.status <> 'Cancelled'
GROUP BY
    c.category_name,
    p.name
ORDER BY
    c.category_name ASC,
    total_quantity_sold DESC;
