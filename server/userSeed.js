import dotenv from 'dotenv';
dotenv.config();  // Charger les variables d'environnement
import bcrypt from 'bcrypt';
import connectToDatabase from './db/db.js';  // Assure-toi que connectToDatabase est bien exporté de db.js
import User from './models/User.js';

// Fonction pour enregistrer un utilisateur
const userRegister = async () => {
  try {
    // Connexion à la base de données
    await connectToDatabase();
    console.log('Database connected successfully!');

    // Hachage du mot de passe
    const hashPassword = await bcrypt.hash("admin", 10);

    // Création du nouvel utilisateur
    const newUser = new User({
      name: "Admin",
      email: "admin@gmail.com",
      password: hashPassword,
      role: "admin"
    });

    // Sauvegarde de l'utilisateur dans la base de données
    await newUser.save(); 
    console.log("Admin user created successfully!");
  } catch (error) {
    // Gestion des erreurs
    console.log("Error:", error);
  }
};

// Exécution de la fonction userRegister
userRegister(); 

