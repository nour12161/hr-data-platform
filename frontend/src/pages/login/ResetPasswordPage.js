import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Remplacer useHistory par useNavigate
import "./ResetPasswordPage.css";

const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate(); // Utilisation de useNavigate pour la navigation

  const handleSubmit = (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }

    // Logique pour envoyer le nouveau mot de passe (front-end) vers le back-end
    // Cette partie sera gérée côté back-end pour réinitialiser le mot de passe de l'utilisateur

    // Rediriger vers la page de connexion
    navigate("/login"); // Utilisation de navigate pour rediriger
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-box">
        <h2>Réinitialiser le mot de passe</h2>
        <form onSubmit={handleSubmit}>
          <div className="textbox">
            <input
              type="password"
              placeholder="Nouveau mot de passe"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="textbox">
            <input
              type="password"
              placeholder="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-submit">
            Réinitialiser le mot de passe
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

