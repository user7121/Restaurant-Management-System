# Sales Report & Revenue API Documentation

## Overview
This document describes the new Sales Report API endpoints for the Restaurant Management System backend.

## Base URL
```
http://localhost:3000/api/reports
```

## Authentication
All endpoints require JWT Bearer token authentication with Admin or Manager role.

### Request Header
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Endpoints

### 1. Sales Report (Original)
**GET** `/sales`

Returns sales summary grouped by day, week, or month.

**Query Parameters:**
- `start_date` (optional): YYYY-MM-DD format
- `end_date` (optional): YYYY-MM-DD format
- `group_by` (optional): 'day' | 'week' | 'month' (default: 'day')

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/reports/sales?start_date=2024-01-01&end_date=2024-01-31&group_by=day" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "period": "2024-01-01",
      "order_count": 25,
      "revenue": 1250.50
    }
  ]
}
```

---

### 2. Best Sellers (Original)
**GET** `/best-sellers`

Returns top-selling products by quantity and revenue.

**Query Parameters:**
- `start_date` (optional): YYYY-MM-DD format
- `end_date` (optional): YYYY-MM-DD format
- `limit` (optional): 1-100 (default: 10)

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/reports/best-sellers?limit=5" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "product_id": 1,
      "product_name": "Margherita Pizza",
      "category_name": "Pizza",
      "total_quantity_sold": 150,
      "total_revenue": 1500.00,
      "order_count": 120
    }
  ]
}
```

---

### 3. Revenue by Category (NEW)
**GET** `/revenue-by-category`

Returns revenue breakdown by product category.

**Query Parameters:**
- `start_date` (optional): YYYY-MM-DD format
- `end_date` (optional): YYYY-MM-DD format

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/reports/revenue-by-category?start_date=2024-01-01&end_date=2024-01-31" \
  -H "Authorization: Bearer your_jwt_token"
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
    },
    {
      "category_id": 2,
      "category_name": "Beverages",
      "quantity_sold": 600,
      "total_revenue": 1200.00,
      "unique_products": 12,
      "order_count": 450
    }
  ]
}
```

---

### 4. Revenue by Payment Method (NEW)
**GET** `/revenue-by-payment-method`

Returns revenue breakdown by payment method (Cash, Card, Online, etc.).

**Query Parameters:**
- `start_date` (optional): YYYY-MM-DD format
- `end_date` (optional): YYYY-MM-DD format

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/reports/revenue-by-payment-method" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "payment_method": "Card",
      "transaction_count": 250,
      "total_revenue": 3500.00,
      "average_transaction_value": 14.00
    },
    {
      "payment_method": "Cash",
      "transaction_count": 180,
      "total_revenue": 2200.00,
      "average_transaction_value": 12.22
    }
  ]
}
```

---

### 5. Revenue by Hour (NEW)
**GET** `/revenue-by-hour`

Returns revenue breakdown by hour of the day (identifies peak hours).

**Query Parameters:**
- `start_date` (optional): YYYY-MM-DD format
- `end_date` (optional): YYYY-MM-DD format

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/reports/revenue-by-hour?start_date=2024-01-20&end_date=2024-01-26" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "hour": "11:00",
      "order_count": 45,
      "total_revenue": 675.50,
      "average_order_value": 15.01
    },
    {
      "hour": "12:00",
      "order_count": 120,
      "total_revenue": 1800.00,
      "average_order_value": 15.00
    },
    {
      "hour": "19:00",
      "order_count": 95,
      "total_revenue": 1425.00,
      "average_order_value": 15.00
    }
  ]
}
```

---

### 6. Daily Revenue (NEW)
**GET** `/daily-revenue`

Returns daily revenue breakdown with detailed statistics.

**Query Parameters:**
- `start_date` (optional): YYYY-MM-DD format
- `end_date` (optional): YYYY-MM-DD format

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/reports/daily-revenue?start_date=2024-01-01&end_date=2024-01-07" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-01",
      "order_count": 45,
      "total_revenue": 675.50,
      "average_order_value": 15.01,
      "min_order_value": 5.00,
      "max_order_value": 45.50
    },
    {
      "date": "2024-01-02",
      "order_count": 52,
      "total_revenue": 780.00,
      "average_order_value": 15.00,
      "min_order_value": 4.50,
      "max_order_value": 50.00
    }
  ]
}
```

---

### 7. Revenue Summary (NEW)
**GET** `/summary`

Returns comprehensive revenue summary statistics for a date range.

**Query Parameters:**
- `start_date` (optional): YYYY-MM-DD format
- `end_date` (optional): YYYY-MM-DD format

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/reports/summary" \
  -H "Authorization: Bearer your_jwt_token"
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
      "start_date": "2024-01-01",
      "end_date": "2024-01-31"
    }
  }
}
```

---

### 8. Comprehensive Report (NEW)
**GET** `/comprehensive`

Returns complete revenue analysis across all dimensions (categories, payment methods, peak hours, top products, daily breakdown).

**Query Parameters:**
- `start_date` (optional): YYYY-MM-DD format
- `end_date` (optional): YYYY-MM-DD format

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/reports/comprehensive" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_revenue": 18750.00,
      "total_orders": 1250,
      "average_order_value": 15.00
    },
    "by_category": [
      {
        "category": "Pizza",
        "total_revenue": 8500.00,
        "quantity_sold": 500,
        "items_count": 450
      }
    ],
    "by_payment_method": [
      {
        "payment_method": "Card",
        "total_revenue": 11250.00,
        "transaction_count": 750,
        "average_transaction": 15.00
      }
    ],
    "top_products": [
      {
        "product_id": 1,
        "product_name": "Margherita Pizza",
        "category": "Pizza",
        "quantity_sold": 200,
        "total_revenue": 2000.00,
        "average_price": 10.00
      }
    ],
    "peak_hours": [
      {
        "hour": "12:00",
        "total_revenue": 1800.00,
        "order_count": 120
      }
    ],
    "daily_breakdown": [
      {
        "date": "2024-01-01",
        "total_revenue": 675.50,
        "order_count": 45,
        "average_order_value": 15.01
      }
    ]
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid start_date date format. Expected YYYY-MM-DD."
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to complete getSalesReport."
}
```

---

## Default Date Range
If `start_date` and `end_date` are not provided, the API defaults to:
- **start_date**: 30 days ago
- **end_date**: Today

---

## Date Format Requirements
- All date parameters must be in **YYYY-MM-DD** format
- Example: `2024-01-15`
- Dates are compared using the date only (time portion is ignored)

---

## Role-Based Access Control
Both **Admin** and **Manager** roles can access all report endpoints.

Other roles (Cashier, Waiter, Guest) will receive a 403 Forbidden response.

---

## Implementation Files

### New Files Created:
1. **`/backend/utils/revenueCalculator.js`** - Revenue calculation utility module with static methods for analyzing sales data
2. Updated **`/backend/routes/reportRoutes.js`** - Added 6 new route definitions
3. Updated **`/backend/controllers/reportController.js`** - Added 6 new async methods

### Features:
- Revenue breakdown by category, payment method, and time (hourly/daily)
- Top-selling products identification
- Peak hours analysis for operational insights
- Comprehensive multi-dimensional reporting
- Profit calculation utilities
- Consistent error handling and validation

---

## Testing Guide

### Using curl:
```bash
# Set your JWT token
TOKEN="your_jwt_token_here"

# Test Revenue Summary
curl -X GET "http://localhost:3000/api/reports/summary" \
  -H "Authorization: Bearer $TOKEN"

# Test Revenue by Category
curl -X GET "http://localhost:3000/api/reports/revenue-by-category?start_date=2024-01-01&end_date=2024-01-31" \
  -H "Authorization: Bearer $TOKEN"

# Test Comprehensive Report
curl -X GET "http://localhost:3000/api/reports/comprehensive" \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman:
1. Set Authorization header with Bearer token
2. Use endpoints as listed above
3. Add query parameters as needed
4. Send request and review response

---

## Performance Considerations

- All queries use indexed columns (date, status, payment_method)
- Queries are optimized with proper JOINs
- Consider limiting date ranges for very large datasets
- Peak hours and daily breakdown queries may take longer for large date ranges

---

## Future Enhancements

- Add profit margin calculations (requires cost tracking in database)
- Implement export functionality (CSV, PDF, Excel)
- Add filters by staff member or location
- Real-time dashboard integration
- Predictive revenue analytics
