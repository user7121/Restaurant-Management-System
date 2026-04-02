import React from "react";
import { Link } from "react-router-dom";
import StockStatusDashboard from "../components/StockStatusDashboard";

export default function AdminDashboard() {
  const linkStyle = { 
    marginRight: '20px', 
    color: '#fff', 
    backgroundColor: '#3b82f6', 
    padding: '10px 15px', 
    borderRadius: '8px', 
    textDecoration: 'none', 
    fontWeight: 'bold',
    display: 'inline-block'
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", background: "#f4f7f6", minHeight: "100vh" }}>
      <div style={{ padding: "20px", background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        <h1 style={{ margin: 0, color: "#1f2937" }}>Restaurant Admin Dashboard</h1>
        <p style={{ margin: "6px 0 20px", color: "#6b7280" }}>
          Manage your restaurant inventory, categories, and take orders manually.
        </p>
        <div style={{ marginTop: '15px' }}>
          <Link to="/admin/categories" style={linkStyle}>Manage Categories</Link>
          <Link to="/admin/products" style={linkStyle}>Manage Products</Link>
          <Link to="/admin/tables" style={{...linkStyle, backgroundColor: '#10b981'}}>Table & POS System</Link>
        </div>
      </div>
      <div style={{ padding: "20px" }}>
        <StockStatusDashboard />
      </div>
    </div>
  );
}
