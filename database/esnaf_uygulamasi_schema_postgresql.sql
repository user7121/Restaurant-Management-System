-- Esnaf Uygulamasi - Teslimlik SQL Dosyasi
-- Veritabani: PostgreSQL
-- Amaç: Kiralanabilir esnaf / cafe / restoran uygulamasi için temel tablo yapisi
-- Not: Bu dosya category tablosu odakli olacak sekilde,
--      business-category-product iliskisini de kurar.

BEGIN;

DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS app_users CASCADE;

-- =========================================================
-- 1) KULLANICILAR
-- =========================================================
CREATE TABLE app_users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'owner',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 2) ISLETMELER
-- Her kiraci / esnaf burada tutulur
-- =========================================================
CREATE TABLE businesses (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL,
    business_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    address TEXT,
    city VARCHAR(80),
    subscription_plan VARCHAR(30) NOT NULL DEFAULT 'basic',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_business_owner
        FOREIGN KEY (owner_id) REFERENCES app_users(id)
        ON DELETE CASCADE
);

-- =========================================================
-- 3) KATEGORILER
-- Istenen ana gorev: Create Category Table Schema
-- Her kategori bir isletmeye aittir
-- =========================================================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_category_business
        FOREIGN KEY (business_id) REFERENCES businesses(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_category_name_per_business
        UNIQUE (business_id, name)
);

-- =========================================================
-- 4) URUNLER
-- Her urun bir kategoriye baglanir
-- =========================================================
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_business
        FOREIGN KEY (business_id) REFERENCES businesses(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_product_category
        FOREIGN KEY (category_id) REFERENCES categories(id)
        ON DELETE CASCADE
);

-- =========================================================
-- INDEXLER
-- Performans icin
-- =========================================================
CREATE INDEX idx_categories_business_id ON categories(business_id);
CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_products_business_id ON products(business_id);
CREATE INDEX idx_products_category_id ON products(category_id);

-- =========================================================
-- ORNEK VERILER
-- =========================================================
INSERT INTO app_users (full_name, email, password_hash, role)
VALUES
('Izzet Arslan', 'izzet@example.com', 'hashed_password_example', 'owner');

INSERT INTO businesses (owner_id, business_name, phone, address, city, subscription_plan)
VALUES
(1, 'Defne Cafe', '+90 555 000 00 00', 'Defne / Hatay', 'Hatay', 'premium');

INSERT INTO categories (business_id, name, description, display_order)
VALUES
(1, 'Kahveler', 'Sicak ve soguk kahve cesitleri', 1),
(1, 'Tatlilar', 'Gunluk tatli cesitleri', 2),
(1, 'Icecekler', 'Soguk icecekler ve mesrubatlar', 3);

INSERT INTO products (business_id, category_id, name, description, price, stock_quantity)
VALUES
(1, 1, 'Latte', 'Orta boy latte', 95.00, 50),
(1, 1, 'Americano', 'Sekersiz klasik kahve', 80.00, 40),
(1, 2, 'Cheesecake', 'Frambuaz soslu cheesecake', 120.00, 15),
(1, 3, 'Limonata', 'Ev yapimi limonata', 70.00, 25);

COMMIT;

-- =========================================================
-- KULLANIM ORNEKLERI
-- =========================================================
-- Tum kategorileri getir:
-- SELECT * FROM categories;

-- Bir isletmenin kategorileri:
-- SELECT * FROM categories WHERE business_id = 1 ORDER BY display_order, id;

-- Urunleri kategoriyle beraber listele:
-- SELECT p.name AS product_name, c.name AS category_name, p.price
-- FROM products p
-- JOIN categories c ON p.category_id = c.id
-- ORDER BY c.display_order, p.name;
