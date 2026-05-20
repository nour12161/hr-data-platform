// src/pages/login/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./LoginPage.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const { token, user } = response.data;

      // 🧼 Nettoyage et standardisation du rôle
      const cleanedRole = user?.role?.trim().toLowerCase().replace(/\s+/g, "_");

      // 🔐 Sauvegarde dans localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("userRole", cleanedRole);

      console.log("✅ Connexion réussie !");
      console.log("🎫 Token :", token);
      console.log("👤 Rôle :", cleanedRole);

      // 🎯 Redirection selon le rôle
      switch (cleanedRole) {
        case "admin":
          navigate("/admin/dashboard-rh");
          break;
        case "dep_formation":
          navigate("/formation/gestion-formations");
          break;
        case "top_manager":
          navigate("/top-manager/dashboard-rh");
          break;
        case "collaborateur":
      
          break;
        default:
          navigate("/unauthorized");
          break;
      }
    } catch (error) {
      console.error("❌ Erreur de connexion:", error);

      if (error.response) {
        const status = error.response.status;
        if ([401, 403, 404].includes(status)) {
          setErrorMsg(error.response.data.error || "Identifiants incorrects.");
        } else {
          setErrorMsg("Erreur inattendue. Veuillez réessayer plus tard.");
        }
      } else {
        setErrorMsg("Erreur réseau. Le serveur est injoignable.");
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Connexion</h2>
        {errorMsg && <p className="error-message">{errorMsg}</p>}

        <form onSubmit={handleLogin}>
          <div className="textbox">
            <input
              type="email"
              placeholder="Adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="textbox">
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-login">
            Se connecter
          </button>
        </form>

        <div className="forgot-password">
          <a href="/forgot-password">Mot de passe oublié ?</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
