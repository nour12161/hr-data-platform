import pool from "../db/db.js";

//recup histo
export const getHistoriqueModifications = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        h.id, 
        h.cuid, 
        h.date_operation, 
        h.type_operation, 
        h.champs_modifies, 
        h.donnees_avant, 
        h.donnees_apres,
        h.mois_reference,
        h.annee_reference,
        u.email AS utilisateur_email,
        c.nom,
        c.prenom
      FROM historique_modif_collaborateurs h
      LEFT JOIN collaborateurs c ON h.cuid = c.cuid
      LEFT JOIN users u ON h.user_id = u.id
      ORDER BY h.date_operation DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Erreur récupération historique :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
