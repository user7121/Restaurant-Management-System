-- =====================================================
-- 04 - CREATE CAMPAIGN IDEA AND SALES FORECAST DATABASE
-- Project: Cafe Sales Analysis Application
-- Compatible with: MySQL 8+
-- Purpose: Reviews cafe sales, suggests campaign ideas and estimates future sales.
-- Required tables: orders, order_items, products, categories
-- Additional tables: campaign_ideas, sales_forecasts
-- =====================================================

USE mysql_rest_core_schema;

-- Campaign ideas table
CREATE TABLE IF NOT EXISTS campaign_ideas (
    campaign_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    campaign_name VARCHAR(150) NOT NULL,
    discount_percent DECIMAL(5,2) NOT NULL,
    campaign_reason VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    CONSTRAINT fk_campaign_product
        FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- Sales forecast table
CREATE TABLE IF NOT EXISTS sales_forecasts (
    forecast_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    forecast_month VARCHAR(7) NOT NULL,
    previous_month_quantity INT NOT NULL,
    expected_growth_percent DECIMAL(5,2) NOT NULL,
    forecast_quantity INT NOT NULL,
    forecast_revenue DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_forecast_product
        FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- Campaign suggestion query:
-- Products with low sales but meaningful revenue can be promoted.
SELECT
    p.product_id,
    p.name AS product_name,
    c.category_name,
    SUM(oi.quantity) AS total_quantity_sold,
    ROUND(SUM(oi.quantity * oi.unit_price), 2) AS total_revenue,
    CASE
        WHEN SUM(oi.quantity) < 20 THEN 'Create discount campaign to increase sales volume'
        WHEN SUM(oi.quantity) BETWEEN 20 AND 50 THEN 'Create bundle campaign with best-seller products'
        ELSE 'Keep product visible, no urgent campaign needed'
    END AS campaign_suggestion
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN products p ON oi.product_id = p.product_id
JOIN categories c ON p.category_id = c.category_id
WHERE o.status <> 'Cancelled'
GROUP BY p.product_id, p.name, c.category_name
ORDER BY total_quantity_sold ASC, total_revenue DESC;

-- Insert example campaign ideas based on cafe logic.
-- Update product_id values according to your products table.
INSERT INTO campaign_ideas
(product_id, campaign_name, discount_percent, campaign_reason, start_date, end_date)
VALUES
(1, 'Morning Coffee Campaign', 10.00, 'Increase morning coffee sales', '2026-06-01', '2026-06-30'),
(2, 'Dessert Combo Campaign', 15.00, 'Increase dessert sales by combining with coffee', '2026-06-01', '2026-06-30'),
(3, 'Student Menu Campaign', 12.50, 'Attract students during afternoon hours', '2026-06-01', '2026-06-30');

-- Simple monthly sales forecast:
-- Uses the last month's sales quantity and applies expected growth.
INSERT INTO sales_forecasts
(product_id, forecast_month, previous_month_quantity, expected_growth_percent, forecast_quantity, forecast_revenue)
SELECT
    p.product_id,
    '2026-07' AS forecast_month,
    SUM(oi.quantity) AS previous_month_quantity,
    15.00 AS expected_growth_percent,
    ROUND(SUM(oi.quantity) * 1.15) AS forecast_quantity,
    ROUND(ROUND(SUM(oi.quantity) * 1.15) * AVG(oi.unit_price), 2) AS forecast_revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN products p ON oi.product_id = p.product_id
WHERE o.status <> 'Cancelled'
  AND o.created_at BETWEEN '2026-06-01' AND '2026-06-30'
GROUP BY p.product_id;

-- View sales forecast results
SELECT
    sf.forecast_month,
    p.name AS product_name,
    sf.previous_month_quantity,
    sf.expected_growth_percent,
    sf.forecast_quantity,
    sf.forecast_revenue
FROM sales_forecasts sf
JOIN products p ON sf.product_id = p.product_id
ORDER BY sf.forecast_revenue DESC;
