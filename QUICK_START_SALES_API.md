# Quick Start: Sales Report API

## 🎯 What You Got

6 new REST API endpoints for comprehensive sales analysis:

```
GET /api/reports/revenue-by-category       → Category breakdown
GET /api/reports/revenue-by-payment-method → Payment method breakdown
GET /api/reports/revenue-by-hour           → Peak hours analysis
GET /api/reports/daily-revenue             → Daily statistics
GET /api/reports/summary                   → Overall summary
GET /api/reports/comprehensive             → Complete analysis
```

Plus 1 new utility module: `RevenueCalculator` with 9 static methods.

---

## 🚀 Getting Started

### 1. No Installation Needed
- ✅ No new dependencies
- ✅ No database migrations
- ✅ Uses existing tables: orders, order_items, products, categories
- ✅ Just restart your server

```bash
npm start  # or: node server.js
```

### 2. Get Your JWT Token
Use existing authentication (login endpoint) to get a bearer token.

### 3. Test an Endpoint

```bash
curl -X GET "http://localhost:3000/api/reports/summary" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📊 Example Responses

### Revenue Summary
```bash
curl http://localhost:3000/api/reports/summary -H "Authorization: Bearer TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_orders": 1250,
    "total_revenue": 18750.00,
    "average_order_value": 15.00,
    "minimum_order_value": 2.50,
    "maximum_order_value": 125.00,
    "days_with_orders": 30,
    "date_range": {
      "start_date": "2024-04-13",
      "end_date": "2026-05-13"
    }
  }
}
```

### Revenue by Category
```bash
curl http://localhost:3000/api/reports/revenue-by-category \
  -H "Authorization: Bearer TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "category_id": 1,
      "category_name": "Pizza",
      "quantity_sold": 450,
      "total_revenue": 4500.00,
      "unique_products": 8,
      "order_count": 300
    }
  ]
}
```

### Revenue by Hour (Peak Analysis)
```bash
curl http://localhost:3000/api/reports/revenue-by-hour \
  -H "Authorization: Bearer TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "hour": "12:00",
      "order_count": 120,
      "total_revenue": 1800.00,
      "average_order_value": 15.00
    }
  ]
}
```

---

## 🔧 Common Query Parameters

All endpoints support optional date filtering:

```bash
# Default: last 30 days
GET /api/reports/summary

# Specific date range
GET /api/reports/summary?start_date=2024-01-01&end_date=2024-01-31

# Single day
GET /api/reports/daily-revenue?start_date=2024-01-15&end_date=2024-01-15
```

**Date Format**: YYYY-MM-DD

---

## ✅ Access Control

**Who can access?**
- ✅ Admin role
- ✅ Manager role
- ❌ Cashier (403 Forbidden)
- ❌ Waiter (403 Forbidden)
- ❌ Guest (403 Forbidden)

**Need proper JWT token with Admin or Manager role**

---

## 📂 Files Created/Modified

| File | Status | What |
|------|--------|------|
| `/backend/utils/revenueCalculator.js` | ✅ NEW | Utility module (9 methods) |
| `/backend/controllers/reportController.js` | ✅ MODIFIED | Added 6 new methods |
| `/backend/routes/reportRoutes.js` | ✅ MODIFIED | Added 6 new routes |
| `/backend/API_DOCUMENTATION.md` | ✅ NEW | Full API documentation |
| `IMPLEMENTATION_SUMMARY.md` | ✅ NEW | Implementation details |

---

## 🧪 Quick Test Using Postman

1. **Open Postman**
2. **Create a GET request**
3. **URL**: `http://localhost:3000/api/reports/summary`
4. **Headers**:
   - Key: `Authorization`
   - Value: `Bearer YOUR_JWT_TOKEN`
5. **Send** and see the response

---

## 📝 All 8 Endpoints

| # | Endpoint | Purpose |
|---|----------|---------|
| 1 | `GET /api/reports/sales` | Sales by day/week/month |
| 2 | `GET /api/reports/best-sellers` | Top N products |
| 3 | `GET /api/reports/revenue-by-category` | Revenue by category |
| 4 | `GET /api/reports/revenue-by-payment-method` | Revenue by payment type |
| 5 | `GET /api/reports/revenue-by-hour` | Peak hours analysis |
| 6 | `GET /api/reports/daily-revenue` | Daily statistics |
| 7 | `GET /api/reports/summary` | Revenue summary |
| 8 | `GET /api/reports/comprehensive` | Full analysis |

---

## 🎓 Utility Module (RevenueCalculator)

If you want to use the calculation methods directly in your code:

```javascript
const RevenueCalculator = require('./utils/revenueCalculator');

// Calculate total revenue from orders array
const total = RevenueCalculator.calculateTotalRevenue(orders);

// Get top 5 products
const topProducts = RevenueCalculator.getTopSellingProducts(orderItems, 5);

// Generate full report
const report = RevenueCalculator.generateComprehensiveReport(orders, orderItems);
```

---

## 🐛 Troubleshooting

### 401 Unauthorized
- ❌ Invalid or missing JWT token
- ✅ Add proper `Authorization: Bearer <token>` header

### 403 Forbidden
- ❌ Logged in user doesn't have Admin/Manager role
- ✅ Use Admin or Manager account

### 400 Bad Request
- ❌ Invalid date format (not YYYY-MM-DD)
- ❌ start_date is after end_date
- ✅ Check date parameters

### 500 Internal Server Error
- ❌ Database connection issue
- ✅ Ensure MySQL server is running
- ✅ Check database credentials in `.env`

---

## 📖 Full Documentation

For complete API documentation with all parameters and examples:
→ See `/backend/API_DOCUMENTATION.md`

---

## 🎉 You're Ready!

Start using the Sales Report API endpoints in your frontend application.

**All data is real-time from your restaurant's actual orders!**

