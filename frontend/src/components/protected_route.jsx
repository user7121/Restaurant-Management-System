import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles, user }) {
  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role not authorized
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
