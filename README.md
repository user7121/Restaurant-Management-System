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
5. [QR Code Ordering System](#5-qr-code-ordering-system)
6. [API Reference](#6-api-reference)
7. [Database Schema](#7-database-schema)
8. [Quick Start (Docker)](#8-quick-start-docker)
9. [Quick Start (Manual)](#9-quick-start-manual)
10. [CI/CD Pipeline](#10-cicd-pipeline)
11. [Sprint Board](#11-sprint-board)
12. [Project Documentation](#12-project-documentation)
13. [Security Notes](#13-security-notes)
14. [Risk Register](#14-risk-register)
15. [Demo Plan](#15-demo-plan)

---

## 1. Executive Summary

The **Restaurant Management System (RMS)** is a full-stack web application that digitalises core restaurant operations:

| Module | Status |
|--------|--------|
| 🔐 JWT Authentication & RBAC | ✅ Complete (Redesigned Login UI) |
| 🗂️ Category Management (CRUD) | ✅ Complete |
| 🍕 Product Management + Stock | ✅ Complete (Redesigned Premium UI) |
| 🪑 Table Management | ✅ Complete |
| 📦 Order Processing (transactional) | ✅ Complete |
| 📊 Admin Dashboard | ✅ Complete |
| 🎨 Premium Dark Theme UI | ✅ Complete |
| 📱 QR Code Customer Ordering | ✅ Complete |
| 📈 Sales Reporting | 🔄 In Progress |

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
- Custom CSS variable-based Premium Dark Theme
- Containerised with Docker (Node 18 Alpine) with live-reload (HMR) volume mounts

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
 ┌──────────────────────┐        ┌─────────────────────────┐
 │  Admin Dashboard     │        │  Customer App (QR)      │
 │  React SPA :5173     │        │  React SPA :5174        │
 └──────────┬───────────┘        └────────────┬────────────┘
            │ REST + JWT Bearer               │ REST (public)
            └──────────────┬─────────────────┘
                           ▼
         ┌─────────────────────────────────┐
         │     Node.js / Express API       │
         │          (port 5000)            │
         │                                │
         │  /api/auth    /api/categories   │
         │  /api/products  /api/tables     │
         │  /api/orders  /api/public/*     │
         │  /api/health                   │
         └──────────────┬─────────────────┘
                        │ mysql2 pool
         ┌──────────────▼─────────────────┐
         │          MySQL 8.0             │
         │       (port 3307 on host)      │
         │                                │
         │  roles, users, auth_credentials│
         │  categories, products,          │
         │  dining_tables, orders,         │
         │  order_items, stock_movements   │
         └────────────────────────────────┘
```
### Backend OOP Architecture (Controllers)

The backend Express controllers have been refactored using Object-Oriented Programming (OOP) principles to ensure modularity and code reusability:

- **Encapsulation:** The database pool is kept private (`#pool`), and controllers encapsulate their specific domain logic.
- **Inheritance:** All domain controllers (`AuthController`, `ProductController`, etc.) extend the abstract-like `BaseController`, inheriting shared utilities like `success()` and `fail()` responses.
- **Polymorphism:** The `handleError(res, error, context)` method is defined in the base class and overridden in the child classes to handle domain-specific errors (e.g., duplicate entries, foreign key violations) seamlessly.

```mermaid
classDiagram
    class BaseController {
        -#pool: Pool
        +success(res, data, statusCode, message)
        +fail(res, message, statusCode)
        +handleError(res, error, context)
    }

    class AuthController {
        +register(req, res)
        +login(req, res)
        +handleError(res, error, context)
    }

    class CategoryController {
        +getAll(req, res)
        +create(req, res)
        +update(req, res)
        +delete(req, res)
        +handleError(res, error, context)
    }

    class ProductController {
        +getAll(req, res)
        +updateStock(req, res)
        +handleError(res, error, context)
    }

    class OrderController {
        +create(req, res)
        +handleError(res, error, context)
    }

    BaseController <|-- AuthController
    BaseController <|-- CategoryController
    BaseController <|-- ProductController
    BaseController <|-- OrderController
    BaseController <|-- TableController
    BaseController <|-- ReportController
```

### Role-Based Access Control

| Role | Level | Permissions |
|------|-------|-------------|
| Customer | 1 | View QR menu, Create order |
| Staff | 2 | Manage active orders, Manage tables |
| Admin | 3 | Full system access (all of the above + menu, reports, stock) |

---

## 5. QR Code Ordering System

The QR ordering system lets customers browse the menu and place orders directly from their phone — no app install, no login required.

### How it works

1. **Admin generates a QR code** — In the admin dashboard under **Table Management**, click the 📱 **QR** button on any table to open a QR modal. Click **Print QR** or **Open Menu** to test it.
2. **Customer scans the code** — The QR code encodes the URL `http://<customer-app>/<table_id>`. Any standard camera app can scan it.
3. **Customer places an order** — The customer browses the menu, adds items to cart, and taps **Place Order**. The order is submitted to the backend without requiring authentication.
4. **Admin sees the order instantly** — The order appears in the **Order Tracking** (Kanban board) under the **Pending** column. Staff advance it through `Preparing → Ready → Delivered`.

### Public API endpoints (no auth required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/public/categories` | Fetch all menu categories |
| GET | `/api/public/products` | Fetch all products with stock |
| POST | `/api/public/orders` | Submit a customer order |

### Services

| Service | Port | Description |
|---------|------|-------------|
| Admin Dashboard | `5173` | Staff-facing management interface |
| Customer App | `5174` | Public QR menu & ordering |
| Backend API | `5000` | Shared REST API |
| MySQL | `3307` | Database |

---

## 6. API Reference

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

## 8. Quick Start (Docker)

> **Recommended.** Spins up MySQL + Backend + Admin Dashboard + Customer App in one command.

```bash
# 1. Clone
git clone https://github.com/user7121/Restaurant-Management-System.git

# 2. Start all services (4 containers)
docker compose up -d --build

# 3. Wait ~15 seconds for MySQL to initialise, then open:
#    Admin Dashboard  → http://localhost:5173
#    Customer App     → http://localhost:5174/<table_id>
#    API              → http://localhost:5000/api/health
#    MySQL            → localhost:3307 (root / pass)
```

Stop all services:
```bash
docker compose down        # stop containers
docker compose down -v     # stop containers + remove DB volume
```

---

## 9. Quick Start (Manual)

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

### Admin Frontend
```bash
cd frontend
cp .env.example .env       # optional: set VITE_CUSTOMER_APP_URL
npm install
npm run dev                # http://localhost:5173
```

### Customer App
```bash
cd customer-app
cp .env.example .env       # optional: set VITE_API_URL
npm install
npm run dev                # http://localhost:5174
# Open http://localhost:5174/1 to test Table 1
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

View pipeline runs: [GitHub Actions →](https://github.com/user7121/Restaurant-Management-System/actions)

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

## 14. Demo Plan

> 🎯 Estimated duration: **~15 minutes**

### Prerequisites
Before the demo, make sure the full stack is running:
```bash
git clone https://github.com/user7121/Restaurant-Management-System.git
cd Restaurant-Management-System
docker compose up -d --build
# Wait ~15s for MySQL to initialise
```

Open two tabs:
- **App:** http://localhost:5173
- **API Health:** http://localhost:5000/api/health

---

### Step 1 — CI/CD Pipeline (2 min)
> Show the automated pipeline running on GitHub.

1. Open [GitHub Actions](https://github.com/user7121/Restaurant-Management-System/actions)
2. Click the latest successful run
3. Walk through the 5 jobs:
   - ✅ Backend — Lint & Unit Tests
   - ✅ Frontend — Lint & Vite Build
   - ✅ Docker — Build & Push Images
   - ✅ Integration — Full Stack Health Check
   - ✅ Pipeline Summary
4. Show the Docker images published to GHCR

---

### Step 2 — Authentication (2 min)
> Demonstrate JWT-based login and role separation.

1. Open http://localhost:5173
2. Log in with the **admin** account (credentials from seed file)
3. Show the JWT token in browser DevTools → Application → Local Storage
4. Show that accessing a protected route without a token returns `401 Unauthorized`

---

### Step 3 — Category & Product Management (3 min)
> Full CRUD demo as Admin.

1. Navigate to **Categories**
   - Create a new category (e.g. "Desserts")
   - Edit it, then delete it
2. Navigate to **Products**
   - Create a new product with stock quantity
   - Edit price and stock level
   - Show stock movement history

---

### Step 4 — Table & Order Management (4 min)
> Core restaurant workflow.

1. Navigate to **Tables**
   - Show available tables (Empty status)
   - Mark a table as **Occupied**
2. Navigate to **Orders**
   - Create a new order for the occupied table, add 2–3 items
   - Show order status: `Pending`
   - Advance status: `Pending` → `Preparing` → `Ready` → `Delivered`
   - Verify the table status resets to **Empty** after delivery
3. Show that stock quantities decreased automatically after the order

---

### Step 5 — Admin Dashboard (2 min)
> Overview of system state.

1. Navigate to **Dashboard**
2. Show the stock status panel — highlight any low-stock items
3. Show active orders summary

---

### Step 6 — API Health & Docker (2 min)
> Show the running infrastructure.

1. Open http://localhost:5000/api/health — show `{"success":true}`
2. Run in terminal:
   ```bash
   docker compose ps
   ```
   Show all 4 containers running: `rms-mysql`, `rms-backend`, `rms-frontend`, `rms-customer-app`
3. Show the architecture diagram from this README

---

### Step 7 — QR Code Customer Ordering (3 min)
> Demonstrate the end-to-end customer self-ordering flow.

1. In the admin dashboard, navigate to **Tables**
2. Click the **📱 QR** button on any table — show the QR modal
3. Click **Open Menu** — the customer app opens in a new tab at `http://localhost:5174/<table_id>`
4. Browse the menu, select items, open the cart, and click **Place Order**
5. Switch back to the admin dashboard → **Order Tracking**
6. Show the new order in the **Pending** column
7. Advance it: `Pending → Preparing → Ready → Delivered`
8. Show the table status resets to **Empty** automatically

---

### Demo Talking Points

| Topic | Key Message |
|-------|-------------|
| **CI/CD** | Every push to `main` automatically tests, builds, and publishes Docker images |
| **Security** | Passwords hashed with bcrypt (saltRounds=12), all routes protected with JWT |
| **Transactions** | Order creation uses MySQL transactions — stock and order are atomic |
| **Docker** | One command (`docker compose up`) spins up the entire stack |
| **Agile** | 4 sprints tracked in Jira, incremental delivery each sprint |

---

## License

This project is developed as an academic group project for the Software Project Management course and is intended for **educational purposes only**.
