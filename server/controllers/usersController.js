import pool from "../db/db.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

// ✅ Lister tous les utilisateurs
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, email, role, is_active FROM users ORDER BY id");
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Erreur getAllUsers :", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
};

// ➕ Créer un utilisateur
const createUser = async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: "Champs requis manquants." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3)",
      [email, hashedPassword, role]
    );
    res.status(201).json({ message: "Utilisateur créé." });
  } catch (err) {
    console.error("❌ Erreur createUser :", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
};

// ✏️Modifier un utilisateur
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { email, role, is_active } = req.body;

  try {
    await pool.query(
      "UPDATE users SET email = $1, role = $2, is_active = $3 WHERE id = $4",
      [email, role, is_active, id]
    );
    res.status(200).json({ message: "Utilisateur mis à jour." });
  } catch (err) {
    console.error("❌ Erreur updateUser :", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
};

//  Désactiver (supprimer logiquement)
const deactivateUser = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("UPDATE users SET is_active = false WHERE id = $1", [id]);
    res.status(200).json({ message: "Utilisateur désactivé." });
  } catch (err) {
    console.error("❌ Erreur deactivateUser :", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
};

//  Réinitialiser le mot de passe
const resetUserPassword = async (req, res) => {
  const { id } = req.params;
  const temporaryPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  try {
    const result = await pool.query("SELECT email FROM users WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    const userEmail = result.rows[0].email;

    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, id]);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: "🔐 Réinitialisation de votre mot de passe – Orange RH",
      html: `<p>Votre nouveau mot de passe temporaire est : <strong>${temporaryPassword}</strong></p>`,
    });

    res.status(200).json({ message: "Mot de passe réinitialisé et email envoyé." });
  } catch (err) {
    console.error("❌ Erreur resetUserPassword :", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
};

export {
  getAllUsers,
  createUser,
  updateUser,
  deactivateUser,
  resetUserPassword
};
