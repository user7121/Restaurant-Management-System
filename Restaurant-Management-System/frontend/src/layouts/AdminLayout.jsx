import React from "react";
import { Link } from "react-router-dom";
// Import the component we created in the previous step
import StockStatusDashboard from "./StockStatusDashboard"; 

const AdminDashboard = () => {
  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial, sans-serif" }}>
      
      {/* Sidebar - Consistent with Admin Role Access */}
      <div
        style={{
          width: "220px",
          backgroundColor: "#2c3e50",
          color: "white",
          padding: "20px",
        }}
      >
        <h2>Admin Panel</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li style={{ margin: "10px 0" }}>
            <Link to="/admin" style={{ color: "white", textDecoration: "none" }}>Dashboard</Link>
          </li>
          <li style={{ margin: "10px 0" }}>
            <Link to="/admin/categories" style={{ color: "white", textDecoration: "none" }}>Categories</Link>
          </li>
          <li style={{ margin: "10px 0" }}>
            <Link to="/admin/products" style={{ color: "white", textDecoration: "none" }}>Products</Link>
          </li>
        </ul>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: "20px", overflowY: "auto", backgroundColor: "#f4f7f6" }}>
        <h1>Admin Dashboard</h1>
        <p>Welcome to the Restaurant Management System.</p>

        <div style={{ marginTop: "30px" }}>
          <h3>Quick Overview</h3>
          <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
            {/* Card 1: Categories */}
            <div style={cardStyle}>
              <h4>Categories</h4>
              <p>Manage menu categories</p>
            </div>

            {/* Card 2: Products */}
            <div style={cardStyle}>
              <h4>Products</h4>
              <p>Manage products</p>
            </div>
          </div>
        </div>

        {/* Stock Status Section - Fulfills Category and Stock Management feature */}
        <div style={{ marginTop: "40px" }}>
          <StockStatusDashboard />
        </div>
      </div>
    </div>
  );
};

// Simple reusable style object for cards
const cardStyle = {
  padding: "20px",
  backgroundColor: "#ecf0f1",
  borderRadius: "8px",
  width: "200px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
};

export default AdminDashboard;
