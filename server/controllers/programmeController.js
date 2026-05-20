// 📂 controllers/programmeController.js
import pool from "../db/db.js";
import {
  insertProgrammeManuel as insertProgrammeManuelModel,
  updateProgrammeById,
  getAllProgrammes as getAll,
  deleteProgrammeById,
} from "../models/programmeModel.js";

// ✅ Ajouter un programme (manuel)
export const ajouterProgrammeManuel = async (req, res) => {
  try {
    const {
      intitule,
      cadre,
      nbCible,
      dateDebut,
      dateFin,
      conception,
      deploiement,
      budgetPrevisionnel,
      budgetReel,
    } = req.body;

    await insertProgrammeManuelModel({
      intitule,
      cadre,
      nbCible: nbCible ? parseInt(nbCible) : null,
      dateDebut,
      dateFin,
      conception,
      deploiement,
      budgetPrevisionnel: budgetPrevisionnel ? parseFloat(budgetPrevisionnel) : null,
      budgetReel: budgetReel ? parseFloat(budgetReel) : null,
    });

    res.status(201).json({ success: true, message: "Programme ajouté." });
  } catch (err) {
    console.error("Erreur ajout programme :", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Modifier un programme par ID
export const updateProgrammeManuel = async (req, res) => {
  try {
    const programmeId = req.params.id;
    const {
      intitule,
      cadre,
      nbCible,
      dateDebut,
      dateFin,
      conception,
      deploiement,
      budgetPrevisionnel,
      budgetReel,
    } = req.body;

    const values = [
      intitule,
      cadre,
      nbCible ? parseInt(nbCible) : null,
      dateDebut,
      dateFin,
      conception,
      deploiement,
      budgetPrevisionnel ? parseFloat(budgetPrevisionnel) : null,
      budgetReel ? parseFloat(budgetReel) : null,
    ];

    await updateProgrammeById(programmeId, values);

    res.json({ success: true, message: "Programme modifié." });
  } catch (err) {
    console.error("Erreur modification programme :", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Récupérer tous les programmes
export const getAllProgrammes = async (req, res) => {
  try {
    const programmes = await getAll();
    res.json(programmes);
  } catch (err) {
    console.error("Erreur récupération programmes :", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// 🗑️ Supprimer un programme
export const deleteProgramme = async (req, res) => {
  const id = req.params.id;
  try {
    // Vérifier si des sessions sont liées à des formations appartenant à ce programme
    const result = await pool.query(
      `SELECT COUNT(*) FROM formation f
       JOIN session_formation s ON f.id = s.formation_id
       WHERE f.programme_id = $1`,
      [id]
    );

    const hasSessions = parseInt(result.rows[0].count, 10) > 0;

    if (hasSessions) {
      return res.status(400).json({
        success: false,
        message: "Ce programme est rattaché à des formations ayant des sessions. Suppression interdite.",
      });
    }

    // 🔁 Supprimer les formations associées à ce programme
    await pool.query(`DELETE FROM formation WHERE programme_id = $1`, [id]);

    // ✅ Supprimer le programme
    await deleteProgrammeById(id);

    res.json({ success: true, message: "Programme supprimé avec succès." });
  } catch (err) {
    console.error("Erreur suppression programme :", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
