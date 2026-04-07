USE cafe_restaurant_management;

-- Seed a known working admin credential for the demo UI.
-- This repo's provided sample rows use placeholder password hashes.
-- We add a real bcrypt hash so Login works out-of-the-box.

INSERT INTO users (first_name, last_name, phone, email, role_id, is_active)
SELECT
  'Admin',
  'User',
  NULL,
  'admin@example.com',
  (SELECT role_id FROM roles WHERE role_name = 'Admin' LIMIT 1),
  1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com');

INSERT INTO roles (role_name, description)
SELECT 'Guest', 'System user for public QR code orders'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_name = 'Guest');

INSERT INTO users (first_name, last_name, phone, email, role_id, is_active)
SELECT
  'Guest',
  'User',
  NULL,
  'guest@example.com',
  (SELECT role_id FROM roles WHERE role_name = 'Guest' LIMIT 1),
  1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'guest@example.com');

INSERT INTO auth_credentials (user_id, username, password_hash)
SELECT
  u.user_id,
  'admin',
  '$2a$12$S7XxMIa96jucd51Jq/IBwOP4Y8ZAmrUmJlqT7ww0ksgfYhm/lW91m'
FROM users u
WHERE u.email = 'admin@example.com'
  AND NOT EXISTS (SELECT 1 FROM auth_credentials WHERE username = 'admin');

