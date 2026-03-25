import React from "react";
import { Link, Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      
      {/* Sidebar */}
      <div style={{
        width: "220px",
        background: "#2c3e50",
        color: "white",
        padding: "20px"
      }}>
        <h2>Admin Panel</h2>

        <ul style={{ listStyle: "none", padding: 0 }}>
          <li><Link to="/admin" style={{ color: "white" }}>Dashboard</Link></li>
          <li><Link to="/admin/categories" style={{ color: "white" }}>Categories</Link></li>
          <li><Link to="/admin/products" style={{ color: "white" }}>Products</Link></li>
        </ul>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, padding: "20px" }}>
        <Outlet />
      </div>

    </div>
  );
};

export default AdminLayout;
