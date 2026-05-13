-- =====================================================
-- 03 - CREATE PROFIT CALCULATION QUERY DATABASE
-- Project: Cafe Sales Analysis Application
-- Compatible with: MySQL 8+
-- Purpose: Calculates product profit, category profit and profit margin.
-- Required tables: orders, order_items, products, categories
-- Additional table: product_costs
-- =====================================================

USE mysql_rest_core_schema;

-- Product cost table: stores the production/purchase cost of each product
CREATE TABLE IF NOT EXISTS product_costs (
    cost_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE NULL,
    CONSTRAINT fk_product_costs_product
        FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- Example cost data. Update product_id values according to your products table.
INSERT INTO product_costs (product_id, cost_price, valid_from, valid_to) VALUES
(1, 35.00, '2026-01-01', NULL),
(2, 28.00, '2026-01-01', NULL),
(3, 42.00, '2026-01-01', NULL),
(4, 25.00, '2026-01-01', NULL);

-- Product-based profit calculation
SELECT
    p.product_id,
    p.name AS product_name,
    SUM(oi.quantity) AS total_quantity_sold,
    ROUND(SUM(oi.quantity * oi.unit_price), 2) AS total_revenue,
    ROUND(SUM(oi.quantity * pc.cost_price), 2) AS total_cost,
    ROUND(SUM(oi.quantity * (oi.unit_price - pc.cost_price)), 2) AS total_profit,
    ROUND(
        (SUM(oi.quantity * (oi.unit_price - pc.cost_price)) /
        NULLIF(SUM(oi.quantity * oi.unit_price), 0)) * 100,
        2
    ) AS profit_margin_percent
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN products p ON oi.product_id = p.product_id
JOIN product_costs pc ON p.product_id = pc.product_id
WHERE o.status <> 'Cancelled'
  AND o.created_at >= pc.valid_from
  AND (pc.valid_to IS NULL OR o.created_at <= pc.valid_to)
GROUP BY p.product_id, p.name
ORDER BY total_profit DESC;

-- Category-based profit calculation
SELECT
    c.category_name,
    ROUND(SUM(oi.quantity * oi.unit_price), 2) AS total_revenue,
    ROUND(SUM(oi.quantity * pc.cost_price), 2) AS total_cost,
    ROUND(SUM(oi.quantity * (oi.unit_price - pc.cost_price)), 2) AS total_profit,
    ROUND(
        (SUM(oi.quantity * (oi.unit_price - pc.cost_price)) /
        NULLIF(SUM(oi.quantity * oi.unit_price), 0)) * 100,
        2
    ) AS profit_margin_percent
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN products p ON oi.product_id = p.product_id
JOIN categories c ON p.category_id = c.category_id
JOIN product_costs pc ON p.product_id = pc.product_id
WHERE o.status <> 'Cancelled'
  AND o.created_at >= pc.valid_from
  AND (pc.valid_to IS NULL OR o.created_at <= pc.valid_to)
GROUP BY c.category_name
ORDER BY total_profit DESC;
