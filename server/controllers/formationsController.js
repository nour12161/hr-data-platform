
import {
  getAllFormations,
  updateFormationById,
  disableFormationById,
  getSessionsByFormation,
  getParticipantsBySessionId
} from "../models/formationsModel.js";
import pool from "../db/db.js";

// recup
export const getFormations = async (req, res) => {
  try {
    const result = await getAllFormations();
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Erreur récupération des formations :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

//modif
export const updateFormation = async (req, res) => {
  const { id } = req.params;
  const formationData = req.body;

  try {
    const result = await updateFormationById(id, formationData);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Formation introuvable ou désactivée." });
    }

    res.json({ success: true, message: "Formation modifiée avec succès" });
  } catch (error) {
    console.error("❌ Erreur modification formation :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

//desactiv
export const disableFormation = async (req, res) => {
  const { id } = req.params;

  try {
    await disableFormationById(id);
    res.json({ success: true, message: "Formation désactivée avec succès" });
  } catch (error) {
    console.error("❌ Erreur désactivation formation :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

//recup bysession
export const getSessionsByFormationId = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await getSessionsByFormation(id);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Erreur récupération des sessions :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

//recup particip 
export const getParticipantsBySession = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const result = await getParticipantsBySessionId(sessionId);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Erreur récupération participants :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

//ajout
export const createFormation = async (req, res) => {
  const {
    intitule,
    programme_id,
    modalite_apprentissage_id,
    mode_formation_id,
    certification,
    mode_financement_id,
    tfp,
    pilote_user_id,
    materiel_requis,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO formation (
        intitule,
        programme_id,
        modalite_apprentissage_id,
        mode_formation_id,
        certification,
        mode_financement_id,
        tfp,
        pilote_user_id,
        materiel_requis,
        active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true) RETURNING id`,
      [
        intitule,
        programme_id,
        modalite_apprentissage_id,
        mode_formation_id,
        certification,
        mode_financement_id,
        tfp,
        pilote_user_id,
        materiel_requis,
      ]
    );

    res.status(201).json({
      success: true,
      id: result.rows[0].id,
      message: "Formation ajoutée avec succès.",
    });
  } catch (error) {
    console.error("❌ Erreur ajout formation :", error);
    res.status(500).json({ error: "Erreur lors de l’ajout de la formation" });
  }
};


export const getModesFormation = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, libelle FROM mode_formation');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erreur récupération modes formation :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getModalitesApprentissage = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, libelle FROM modalite_apprentissage');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erreur récupération modalités :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getModesFinancement = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, libelle FROM mode_financement');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erreur récupération financements :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};


