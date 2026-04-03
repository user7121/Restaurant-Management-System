import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import LoginPage from "./pages/Login";
import CategoryManagement from "./components/CategoryManagement";
import ProductManagement from "./components/product/ProductManagement";
import TableDashboard from "./components/tables/TableDashboard";
import POSDashboard from "./components/orders/POSDashboard";
import OrderTracking from "./pages/OrderTracking";

function App() {
  const RequireAuth = ({ children }) => {
    const token = localStorage.getItem("token");
    if (!token) return <Navigate to="/login" replace />;
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="categories" element={<CategoryManagement />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="tables" element={<TableDashboard />} />
          <Route path="pos/:tableId" element={<POSDashboard />} />
          <Route path="orders" element={<OrderTracking />} />
        </Route>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
