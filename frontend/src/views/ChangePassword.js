import React, { useState } from "react";
import axios from "axios";
import "./ChangePassword.css";

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "http://localhost:5000/api/auth/change-password",
        { oldPassword, newPassword, confirmPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(true);
      setMessage(res.data.message);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setSuccess(false);
      setMessage(err.response?.data?.message || "Erreur inattendue.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Changer mon mot de passe</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Ancien mot de passe"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirmer le nouveau mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit" className="auth-button">
            Modifier
          </button>
        </form>
        {message && (
          <p className={`auth-message ${success ? "success" : "error"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChangePassword;
