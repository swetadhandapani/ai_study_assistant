import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

  if (!user) {
    return <Navigate to="/" replace />; // redirect to login
  }

  if (!user.isVerified) {
    return <Navigate to="/resend-verification" replace />; 
  }

  return children;
}
