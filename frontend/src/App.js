import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";

// Pages & Layouts
import Login from './pages/login/Login';
import ForgotPassword from './pages/login/ForgotPassword';
import AdminLayout from './layouts/Admin';
import FormationLayout from './layouts/Formation';
import TopManagerLayout from './layouts/TopManager'; // ✅ Ajouté
import Unauthorized from './pages/Unauthorized';
import PrivateRoute from './components/PrivateRoute';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* Page d'accueil → redirection */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Authentification */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* 🔐 Espace Admin */}
        <Route
          path="/admin/*"
          element={
            <PrivateRoute allowedRole="admin">
              <AdminLayout />
            </PrivateRoute>
          }
        />

        {/* 🔐 Espace Responsable Formation */}
        <Route
          path="/formation/*"
          element={
            <PrivateRoute allowedRole="dep_formation">
              <FormationLayout />
            </PrivateRoute>
          }
        />

        {/* 🔐 Espace Top Manager */}
        <Route
          path="/top-manager/*"
          element={
            <PrivateRoute allowedRole="top_manager">
              <TopManagerLayout />
            </PrivateRoute>
          }
        />

        {/* 🚫 Accès non autorisé */}
        <Route path="/unauthorized" element={<Unauthorized />} />

      </Routes>
    </BrowserRouter>
  );
};

export default App;
