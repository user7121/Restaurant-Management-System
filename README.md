# 🍽️ Restaurant Management System

> **Academic Group Project** — Software Project Management Course | Agile Scrum | React + Node.js + MySQL

[![CI/CD Pipeline](https://github.com/user7121/Restaurant-Management-System/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/user7121/Restaurant-Management-System/actions/workflows/ci-cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange)](https://mysql.com)

---

## 📋 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Team](#2-team)
3. [Tech Stack](#3-tech-stack)
4. [Architecture](#4-architecture)
5. [API Reference](#5-api-reference)
6. [Database Schema](#6-database-schema)
7. [Quick Start (Docker)](#7-quick-start-docker)
8. [Quick Start (Manual)](#8-quick-start-manual)
9. [CI/CD Pipeline](#9-cicd-pipeline)
10. [Sprint Board](#10-sprint-board)
11. [Project Documentation](#11-project-documentation)
12. [Security Notes](#12-security-notes)
13. [Risk Register](#13-risk-register)

---

## 1. Executive Summary

The **Restaurant Management System (RMS)** is a full-stack web application that digitalises core restaurant operations:

| Module | Status |
|--------|--------|
| 🔐 JWT Authentication & RBAC | ✅ Complete |
| 🗂️ Category Management (CRUD) | ✅ Complete |
| 🍕 Product Management + Stock | ✅ Complete |
| 🪑 Table Management | ✅ Complete |
| 📦 Order Processing (transactional) | ✅ Complete |
| 📊 Admin Dashboard | ✅ Complete |
| 📈 Sales Reporting | 🔄 In Progress |
| 📱 QR Menu for Customers | 🔄 Planned |

---

## 2. Team

| Name | Role | Responsibility |
|------|------|---------------|
| **Batuhan İNAN** | Backend Developer | Node.js, Express, JWT Auth, REST API |
| **Emir İnanç ŞEKER** | Frontend Developer | React, Vite, UI Components |
| **İzzet Ali ARSLAN** | Database & Analytics | MySQL Schema, Reports, Stock Logic |

---

## 3. Tech Stack

### Frontend
- **React 18** + React Router v6
- **Vite 5** (build tool)
- Containerised with Docker (Node 18 Alpine)

### Backend
- **Node.js 18** + **Express 4**
- **bcryptjs** (password hashing, saltRounds=12)
- **jsonwebtoken** (JWT, 24h expiry)
- **mysql2** (connection pool)
- Containerised with Docker

### Database
- **MySQL 8.0**
- 4 schema files with auto-init on `docker compose up`
- Admin seed data pre-loaded

### DevOps
- **Docker** + **docker-compose**
- **GitHub Actions** CI/CD (5-job pipeline)
- **Jira** sprint board

---

## 4. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                       Browser                           │
│              React SPA  (port 5173)                     │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / REST + JWT Bearer
┌────────────────────────▼────────────────────────────────┐
│               Node.js / Express API                     │
│                    (port 5000)                          │
│                                                         │
│  Routes: /api/auth  /api/categories  /api/products      │
│          /api/tables  /api/orders  /api/health          │
│                                                         │
│  Middleware: CORS  │  express.json  │  verifyToken      │
└────────────────────┬────────────────────────────────────┘
                     │ mysql2 connection pool
┌────────────────────▼────────────────────────────────────┐
│                   MySQL 8.0                             │
│                   (port 3307 on host)                   │
│                                                         │
│  Tables: roles, users, auth_credentials,                │
│          categories, products, dining_tables,           │
│          orders, order_items, stock_movements           │
└─────────────────────────────────────────────────────────┘
```

### Role-Based Access Control

| Role | Level | Permissions |
|------|-------|-------------|
| Customer | 1 | View QR menu, Create order |
| Staff | 2 | Manage active orders, Manage tables |
| Admin | 3 | Full system access (all of the above + menu, reports, stock) |

---

## 5. API Reference

All endpoints are prefixed with `/api`. Protected routes require:
```
Authorization: Bearer <JWT_TOKEN>
```

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login, returns JWT |

### Categories
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/categories` | ✅ | List all categories |
| POST | `/categories` | ✅ Admin | Create category |
| PUT | `/categories/:id` | ✅ Admin | Update category |
| DELETE | `/categories/:id` | ✅ Admin | Delete category |

### Products
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/products` | ✅ | List all products with category |
| GET | `/products/:id` | ✅ | Get single product |
| POST | `/products` | ✅ Admin | Create product |
| PUT | `/products/:id` | ✅ Admin | Update product |
| DELETE | `/products/:id` | ✅ Admin | Delete product |
| PATCH | `/products/:id/stock` | ✅ Admin | Manual stock adjustment |
| GET | `/products/:id/stock-movements` | ✅ Admin | Stock movement history |

### Tables
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/tables` | ✅ | List all tables |
| GET | `/tables/:id` | ✅ | Get single table |
| PATCH | `/tables/:id/status` | ✅ | Update table status (Empty/Occupied) |

### Orders
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/orders` | ✅ | Create order (transactional) |
| GET | `/orders` | ✅ Admin | List all orders |
| GET | `/orders/:id` | ✅ | Get order with items |
| PATCH | `/orders/:id/status` | ✅ Admin | Update order status |

**Order statuses:** `Pending` → `Preparing` → `Ready` → `Delivered` / `Cancelled`

### Health
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | ❌ | API health check (used by CI) |

---

## 6. Database Schema

Four SQL files initialise the database in order:

```
database/
├── cafe_user_auth_role_schema.sql      # roles, users, auth_credentials tables
├── mysql_rest_core_schema.sql          # categories, products, dining_tables, orders, order_items
├── stock_movements_schema.sql          # stock_movements table
└── mysql_auth_admin_seed.sql           # Default admin user seed data
```

Default admin credentials (development only):
```
username: admin
password: (see mysql_auth_admin_seed.sql)
```

---

## 7. Quick Start (Docker)

> **Recommended.** Spins up MySQL + Backend + Frontend in one command.

```bash
# 1. Clone
git clone https://github.com/your-org/restaurant-management-system.git
cd restaurant-management-system

# 2. Start all services
docker compose up -d --build

# 3. Wait ~15 seconds for MySQL to initialise, then open:
#    Frontend  → http://localhost:5173
#    API       → http://localhost:5000/api/health
#    MySQL     → localhost:3307 (root / pass)
```

Stop all services:
```bash
docker compose down        # stop containers
docker compose down -v     # stop containers + remove DB volume
```

---

## 8. Quick Start (Manual)

### Prerequisites
- Node.js 18+
- MySQL Server 8.0 running on port 3306

### Database
```bash
mysql -u root -p < database/cafe_user_auth_role_schema.sql
mysql -u root -p < database/mysql_rest_core_schema.sql
mysql -u root -p < database/stock_movements_schema.sql
mysql -u root -p < database/mysql_auth_admin_seed.sql
```

### Backend
```bash
cd backend
cp .env.example .env       # edit DB credentials and JWT_SECRET
npm install
npm run dev                # http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                # http://localhost:5173
```

---

## 9. CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) runs **5 jobs** on every push to `main`:

```
push to main
    │
    ├─── [Job 1] backend-test ────── ESLint + Jest unit tests + MySQL service
    │
    ├─── [Job 2] frontend-build ──── ESLint + Vite production build
    │
    ├─── [Job 3] docker-build ────── Build & push images to GHCR (main only)
    │         (needs jobs 1 & 2)
    │
    ├─── [Job 4] integration-test ── docker-compose up + curl /api/health 200
    │         (needs jobs 1 & 2)
    │
    └─── [Job 5] pipeline-summary ── Reports final status
```

View pipeline runs: [GitHub Actions →](https://github.com/your-org/restaurant-management-system/actions)

---

## 10. Sprint Board

Project managed with **Jira Scrum** methodology.

🔗 **Sprint Board:** [https://emirseker368.atlassian.net/jira/software/projects/RMS/boards/36/backlog](https://emirseker368.atlassian.net/jira/software/projects/RMS/boards/36/backlog)

### Sprint Overview
| Sprint | Focus | Status |
|--------|-------|--------|
| Sprint 1 | Project setup, DB schema, Auth API | ✅ Done |
| Sprint 2 | Product & Category CRUD, Frontend Login | ✅ Done |
| Sprint 3 | Order Processing, Stock Management, Admin Dashboard | ✅ Done |
| Sprint 4 | Sales Reporting, QR Menu, Polish & Tests | 🔄 Active |

---

## 11. Project Documentation

```
docs/
├── UML_UseCase_RestaurantManagementSystem.png   # Use Case Diagram
├── Smart_Restaurant_Project_Planning.xlsx       # 14-week timeline + budget
└── risk_analysis.docx                           # Risk register
```

---

## 12. Security Notes

> ⚠️ **Before any production deployment:**

1. **Change JWT_SECRET** — `docker-compose.yml` uses `change_me`. Move to `.env` or GitHub Secrets.
2. **Change DB passwords** — `MYSQL_ROOT_PASSWORD: pass` is for development only.
3. **Set `NODE_ENV=production`** — hides stack traces in API error responses.
4. **Enable HTTPS** — place a reverse proxy (nginx/Caddy) in front of the backend.

---

## 13. Risk Register

See [`docs/risk_register.docx`](docs/risk_register.docx) for the full risk register.

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| R-01 | 🔴 HIGH | Database connection failure | OPEN |
| R-02 | 🔴 HIGH | JWT secret hardcoded in docker-compose | OPEN |
| R-03 | 🟡 MEDIUM | Stock concurrency / oversell | MITIGATED |
| R-04 | 🟡 MEDIUM | Scope creep beyond sprint capacity | OPEN |
| R-05 | 🟡 MEDIUM | No automated test suite | OPEN |
| R-06 | ✅ CLOSED | CI/CD had no health-check gate | CLOSED |
| R-07 | 🟢 LOW | Missing frontend form validation | OPEN |
| R-08 | 🟡 MEDIUM | Bus factor = 1 per layer | OPEN |

---

## License

This project is developed as an academic group project for the Software Project Management course and is intended for **educational purposes only**.
