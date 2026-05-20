import axios from "axios";
import dotenv from "dotenv";
import pool from "../db/db.js";

dotenv.config();

// poser q Ai
export const askGlobalCollaborateurIA  = async (req, res) => {
  const { question } = req.body;

  try {
    //lire collab
    const result = await pool.query("SELECT * FROM collaborateurs");
    const collaborateurs = result.rows;

    // 2. Convertir chaque collaborateur en fiche texte
    const fichesTexte = collaborateurs.map(collab => {
      return `
Nom complet : ${collab.nom} ${collab.prenom}
Matricule : ${collab.matricule}
CUID : ${collab.cuid}
Poste ID : ${collab.poste_id}
Direction : ${collab.direction_id}
N+1 : ${collab.n_plus_1_cuid}
Genre : ${collab.genre}
Date de naissance : ${collab.date_naissance}
Absences cumulées : ${collab.nb_absence_cumule}
Statut contrat : ${collab.statut_contrat}
Ancienneté : ${collab.date_entree}
---`;
    }).join("\n");

    //prompt
    const prompt = `
Tu es un assistant RH intelligent.

Voici la base complète des collaborateurs de l’entreprise. Chaque bloc correspond à un collaborateur.

${fichesTexte}

---

📌 Voici la question de l’utilisateur :  
"${question}"

🧠 Analyse cette question, identifie le collaborateur concerné même si le nom n’est pas exact, puis réponds de manière claire, synthétique et professionnelle.

✅ Si la question demande une fiche People Review, rédige-la en 3 parties :
1. Informations Générales
2. Parcours RH
3. Analyse RH
`.trim();

    //api
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct",
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "chatbot orange"
        }
      }
    );

    res.json({ reponse: response.data.choices[0].message.content });

  } catch (err) {
    console.error("Erreur IA globale :", err.response?.data || err.message);
    res.status(500).json({ error: "Erreur serveur ou IA" });
  }
};
