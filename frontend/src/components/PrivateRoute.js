
import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole")?.trim();

  // 🔍 Debug
  console.log("🛡️ [PrivateRoute]");
  console.log("🔐 Token présent :", !!token);
  console.log("👤 Rôle utilisateur :", `"${userRole}"`);
  console.log("✅ Rôle attendu :", `"${allowedRole}"`);

  // Pas connecté
  if (!token) {
    console.warn("⛔ Accès refusé : Token manquant");
    return <Navigate to="/login" replace />;
  }

  // Mauvais rôle
  if (userRole.replace(/\s+/g, "_") !== allowedRole) {
    console.warn("⛔ Accès refusé : Rôle incorrect");
    return <Navigate to="/unauthorized" replace />;
  }

  
  return children;
};

export default PrivateRoute;
