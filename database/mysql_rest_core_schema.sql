USE cafe_restaurant_management;

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_categories_category_name (category_name)
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

-- Dining tables
CREATE TABLE IF NOT EXISTS dining_tables (
  table_id INT AUTO_INCREMENT PRIMARY KEY,
  table_number INT NOT NULL UNIQUE,
  status ENUM('Empty', 'Occupied') NOT NULL DEFAULT 'Empty'
);

-- Orders (order header)
CREATE TABLE IF NOT EXISTS orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  table_id INT NOT NULL,
  user_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status ENUM('Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_table
    FOREIGN KEY (table_id) REFERENCES dining_tables(table_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

-- Order line items
CREATE TABLE IF NOT EXISTS order_items (
  order_item_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id) REFERENCES products(product_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

-- Seed a minimal dataset for the UI demo.
-- (Safe to rerun: uses INSERT ... WHERE NOT EXISTS)
INSERT INTO categories (category_name)
SELECT 'Drinks' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE category_name = 'Drinks');
INSERT INTO categories (category_name)
SELECT 'Desserts' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE category_name = 'Desserts');

INSERT INTO products (category_id, name, price, stock_quantity)
SELECT c.category_id, 'Latte', 95.00, 50
FROM categories c
WHERE c.category_name = 'Drinks'
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.name = 'Latte');

INSERT INTO products (category_id, name, price, stock_quantity)
SELECT c.category_id, 'Americano', 80.00, 40
FROM categories c
WHERE c.category_name = 'Drinks'
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.name = 'Americano');

INSERT INTO products (category_id, name, price, stock_quantity)
SELECT c.category_id, 'Cheesecake', 120.00, 15
FROM categories c
WHERE c.category_name = 'Desserts'
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.name = 'Cheesecake');

INSERT INTO dining_tables (table_number, status)
SELECT n, 'Empty'
FROM (SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3) x
WHERE NOT EXISTS (SELECT 1 FROM dining_tables t WHERE t.table_number = x.n);

