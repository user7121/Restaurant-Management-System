-- Cafe / Restaurant Management System
-- User, Authentication, and Role Structure Schema
-- Compatible with MySQL 8+

CREATE DATABASE IF NOT EXISTS cafe_restaurant_management;
USE cafe_restaurant_management;

-- =====================================================
-- 1) ROLES TABLE
-- Stores role definitions such as Admin, Manager, Cashier, Waiter
-- =====================================================
CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2) USERS TABLE
-- Stores staff profile information
-- =====================================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(150) NOT NULL UNIQUE,
    role_id INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES roles(role_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =====================================================
-- 3) AUTH_CREDENTIALS TABLE
-- Stores login-related information separately from user profile data
-- =====================================================
CREATE TABLE auth_credentials (
    auth_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    last_login TIMESTAMP NULL,
    failed_attempts INT NOT NULL DEFAULT 0,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_auth_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- =====================================================
-- OPTIONAL SAMPLE ROLE DATA
-- =====================================================
INSERT INTO roles (role_name, description) VALUES
('Admin', 'Full system access'),
('Manager', 'Manages daily restaurant operations'),
('Cashier', 'Handles billing and payments'),
('Waiter', 'Takes and manages customer orders');

-- =====================================================
-- OPTIONAL SAMPLE USER DATA
-- =====================================================
INSERT INTO users (first_name, last_name, phone, email, role_id) VALUES
('Ali', 'Yilmaz', '05550000001', 'ali@cafe.com', 1),
('Ayse', 'Demir', '05550000002', 'ayse@cafe.com', 2);

-- IMPORTANT:
-- In a real project, password_hash must store hashed passwords
-- (for example using bcrypt), never plain text.
INSERT INTO auth_credentials (user_id, username, password_hash) VALUES
(1, 'ali_admin', '$2b$12$examplehashedpasswordforadmin'),
(2, 'ayse_manager', '$2b$12$examplehashedpasswordformanager');

-- =====================================================
-- RELATIONSHIP SUMMARY
-- =====================================================
-- roles (1) ---- (many) users
-- users (1) ---- (1) auth_credentials
--
-- This design provides:
-- 1. Clear role hierarchy
-- 2. Separation of authentication data from profile data
-- 3. Better maintainability and security
