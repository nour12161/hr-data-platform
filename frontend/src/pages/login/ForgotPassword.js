import React, { useState } from "react";
import axios from "axios";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await axios.post("http://localhost:5000/api/auth/forgot-password", { email });
      setMessage("📩 Si l'adresse existe, un email vous a été envoyé.");
    } catch (err) {
      console.error(err);
      setMessage("❌ Une erreur s'est produite.");
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-box">
        <h2>Mot de passe oublié</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Votre adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Envoyer</button>
        </form>
        {message && <p>{message}</p>}
        <div className="back-home">
  <a href="/" className="home-link">← Retour à l'accueil</a>
</div>

      </div>
    </div>
  );
};

export default ForgotPassword;
