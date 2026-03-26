import React from "react";
import StockStatusDashboard from "../components/StockStatusDashboard";

export default function AdminDashboard() {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", background: "#f4f7f6" }}>
      <div style={{ padding: "20px", background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
        <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
          Inventory & stock status
        </p>
      </div>
      <div style={{ padding: "20px" }}>
        <StockStatusDashboard />
      </div>
    </div>
  );
}

