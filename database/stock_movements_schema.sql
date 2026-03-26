-- =====================================================
-- STOCK MOVEMENTS TABLE
-- Tracks every stock change: order deductions, cancellation refunds,
-- and manual adjustments by Admin/Manager.
-- =====================================================

USE cafe_restaurant_management;

CREATE TABLE IF NOT EXISTS stock_movements (
    movement_id   INT AUTO_INCREMENT PRIMARY KEY,
    product_id    INT NOT NULL,
    user_id       INT NOT NULL,
    quantity      INT NOT NULL COMMENT 'Positive = stock added, Negative = stock removed',
    reason        ENUM('order', 'cancellation', 'manual_add', 'manual_remove') NOT NULL,
    reference_id  INT DEFAULT NULL COMMENT 'order_id when reason is order or cancellation',
    note          VARCHAR(255) DEFAULT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sm_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_sm_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- Index for quick lookups by product
CREATE INDEX idx_sm_product ON stock_movements(product_id);
-- Index for quick lookups by order reference
CREATE INDEX idx_sm_reference ON stock_movements(reference_id);
