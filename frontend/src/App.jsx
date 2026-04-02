import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard";
import LoginPage from "./pages/Login";
import CategoryManagement from "./components/CategoryManagement";
import ProductManagement from "./components/product/ProductManagement";
import TableDashboard from "./components/tables/TableDashboard";
import POSDashboard from "./components/orders/POSDashboard";

function App() {
  const RequireAuth = ({ children }) => {
    const token = localStorage.getItem("token");
    if (!token) return <Navigate to="/login" replace />;
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
        <Route path="/admin/categories" element={<RequireAuth><CategoryManagement /></RequireAuth>} />
        <Route path="/admin/products" element={<RequireAuth><ProductManagement /></RequireAuth>} />
        <Route path="/admin/tables" element={<RequireAuth><TableDashboard /></RequireAuth>} />
        <Route path="/admin/pos/:tableId" element={<RequireAuth><POSDashboard /></RequireAuth>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

