import React from "react";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      
      {/* Sidebar */}
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
            <Link to="/admin" style={{ color: "white", textDecoration: "none" }}>
              Dashboard
            </Link>
          </li>

          <li style={{ margin: "10px 0" }}>
            <Link
              to="/admin/categories"
              style={{ color: "white", textDecoration: "none" }}
            >
              Categories
            </Link>
          </li>

          <li style={{ margin: "10px 0" }}>
            <Link
              to="/admin/products"
              style={{ color: "white", textDecoration: "none" }}
            >
              Products
            </Link>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "20px" }}>
        <h1>Admin Dashboard</h1>

        <p>Welcome to the Restaurant Management System.</p>

        <div style={{ marginTop: "30px" }}>
          <h3>Quick Overview</h3>

          <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
            
            {/* Card 1 */}
            <div
              style={{
                padding: "20px",
                backgroundColor: "#ecf0f1",
                borderRadius: "8px",
                width: "150px",
              }}
            >
              <h4>Categories</h4>
              <p>Manage menu categories</p>
            </div>

            {/* Card 2 */}
            <div
              style={{
                padding: "20px",
                backgroundColor: "#ecf0f1",
                borderRadius: "8px",
                width: "150px",
              }}
            >
              <h4>Products</h4>
              <p>Manage products</p>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
