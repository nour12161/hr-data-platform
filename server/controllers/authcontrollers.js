// 📦 Import des dépendances nécessaires
import jwt from "jsonwebtoken";            
import bcrypt from "bcrypt";              
import pool from "../db/db.js";            
import nodemailer from "nodemailer";       


const htmlContent = (tempPassword) => `
  <div style="background-color:#f0f4f8;padding:40px 0;text-align:center;font-family:Arial,sans-serif;">
    <div style="background:white;width:90%;max-width:500px;margin:auto;border-radius:10px;padding:30px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
      <img src="https://i.postimg.cc/TwznvBYB/logo-orange.png" alt="Logo" style="width:120px;margin-bottom:20px;">
      <h2 style="color:#333;margin-bottom:10px;">Réinitialisation de votre mot de passe</h2>
      <p style="font-size:16px;color:#555;margin-bottom:30px;">
        Bonjour, voici un mot de passe temporaire pour accéder à votre compte :
      </p>
      <div style="margin:20px auto;width:max-content;">
        <span style="background-color:#007bff;color:white;padding:14px 28px;font-size:20px;border-radius:8px;font-weight:bold;">
          ${tempPassword}
        </span>
      </div>
      <div style="margin-top:30px;">
        <a href="http://localhost:3000/login" style="background-color:#28a745;color:white;padding:12px 24px;font-size:16px;border-radius:6px;text-decoration:none;">
          🔐 Se connecter
        </a>
      </div>
      <p style="font-size:14px;color:#666;margin-top:30px;">
        Si vous n'avez pas demandé cette réinitialisation, ignorez cet email ou contactez l’administrateur RH.
      </p>
    </div>
    <p style="font-size:11px;color:#aaa;margin-top:30px;">© Orange RH 2025 – Ne partagez jamais votre mot de passe.</p>
  </div>
`;

// 🔐 Fonction de connexion utilisateur
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérification de la saisie
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email et mot de passe requis." });
    }

    // Recherche de l'utilisateur en base
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Adresse email incorrecte." });
    }

    const user = result.rows[0];

    // Vérification si le compte est actif
    if (!user.is_active) {
      return res.status(403).json({ success: false, error: "Compte désactivé." });
    }

    // Vérification du mot de passe avec bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Mot de passe incorrect." });
    }

    // Génération du JWT avec rôle et ID utilisateur
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: "10d" }  // Token valide pendant 10 jours
    );

    // Réponse au client avec le token et les infos utiles
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("🔥 Erreur login PostgreSQL:", error);
    return res.status(500).json({ success: false, error: "Erreur serveur." });
  }
};

// envoie d'un mail lel reinitialisaition mdp
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    
    // verifie l'adresse
    if (result.rows.length === 0) {
      return res.status(200).json({ message: "Si l'adresse existe, un email a été envoyé." });
    }

   
    
    const temporaryPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Màj dans la bd
    await pool.query("UPDATE users SET password = $1 WHERE email = $2", [hashedPassword, email]);

    // envoeie email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "🔐 Votre mot de passe temporaire – Orange RH",
      html: htmlContent(temporaryPassword),
    });

    return res.status(200).json({ message: "Email envoyé." });

  } catch (error) {
    console.error("❌ Erreur lors de la réinitialisation :", error);
    return res.status(500).json({ error: "Erreur serveur lors de la réinitialisation." });
  }
};

// modif mdp par l'id connected
const changePassword = async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const userId = req.user.id;  // L’ID est extrait depuis le token JWT via le middleware

  
  if (!oldPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Les mots de passe ne correspondent pas." });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    // Vérif ancien mdp
    const user = result.rows[0];
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.status(401).json({ message: "Ancien mot de passe incorrect." });
    }

    // Màj du nouv mdp
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashed, userId]);

    res.status(200).json({ message: "✅ Mot de passe modifié avec succès." });

  } catch (err) {
    console.error("❌ Erreur modification mot de passe :", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

export { login, forgotPassword, changePassword };
