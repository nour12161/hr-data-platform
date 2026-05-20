import {
  isFormationActive,
  isFormateurActif,
  sessionDejaExistante,
  insertSession,
  isFormateurDejaOccupe,
  insertParticipants,
  updateSessionById,
  disableSessionById,
  getParticipantsBySession,
  deleteParticipationsBySession,
} from "../models/sessionsModel.js";

import pool from "../db/db.js";

// 🔹 Créer une session
export const createSession = async (req, res) => {
  const client = await pool.connect();
  try {
    let {
      formation_id,
      date_realisation,
      nb_participants_prevu,
      local,
      pauses,
      formateur_cuid,
      prestataire_id,
      participants = []
    } = req.body;

    // 🔄 Nettoyage des champs
    formation_id = formation_id ? parseInt(formation_id) : null;
    prestataire_id = prestataire_id ? parseInt(prestataire_id) : null;
    nb_participants_prevu = nb_participants_prevu ? parseInt(nb_participants_prevu) : null;
    formateur_cuid = formateur_cuid?.trim() || null;
    local = local?.trim() || null;
    pauses = pauses?.trim() || null;

    if (!formation_id || !date_realisation) {
      return res.status(400).json({ error: "Les champs 'formation_id' et 'date_realisation' sont obligatoires." });
    }

    if (formateur_cuid) {
      const sessionExist = await sessionDejaExistante(formation_id, date_realisation, formateur_cuid);
      if (sessionExist) {
        return res.status(400).json({
          error: `Impossible de planifier cette session : le formateur est déjà assigné à la même formation à cette date.`
        });
      }

      const dejaOccupe = await isFormateurDejaOccupe(date_realisation, formateur_cuid);
      if (dejaOccupe) {
        return res.status(400).json({
          error: `Ce formateur est déjà affecté à une autre session le ${date_realisation}.`
        });
      }

      const formateurOk = await isFormateurActif(formateur_cuid);
      if (!formateurOk) {
        return res.status(400).json({
          error: "Le CUID du formateur est introuvable ou inactif dans la base des collaborateurs."
        });
      }
    }

    const formationActive = await isFormationActive(formation_id);
    if (!formationActive) {
      return res.status(400).json({
        error: "Impossible de créer une session pour une formation désactivée."
      });
    }

    await client.query('BEGIN');

    const sessionId = await insertSession({
      formation_id,
      date_realisation,
      nb_participants_prevu,
      local,
      pauses,
      formateur_cuid,
      prestataire_id
    });

    await insertParticipants(participants, sessionId, date_realisation, client);

    await client.query('COMMIT');
    res.status(201).json({
      success: true,
      message: "Session et participants créés avec succès",
      session_id: sessionId,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur création session :', error);
    res.status(500).json({ error: 'Erreur création session' });
  } finally {
    client.release();
  }
};

// 🔹 Modifier une session
export const updateSession = async (req, res) => {
  const { id } = req.params;
  const result = await updateSessionById(id, req.body);
  res.status(200).json({ success: true, session: result.rows[0] });
};

// 🔹 Supprimer une session uniquement si tous les participants sont "prévu"
// Au lieu de disableSession
export const deleteSession = async (req, res) => {
  const { id } = req.params;

  try {
    const participants = await getParticipantsBySession(id);
    const tousPrevus = participants.every(p => p.statut_participation === 'prévu');

    if (!tousPrevus) {
      return res.status(400).json({
        error: "❌ La session ne peut être supprimée que si tous les participants ont le statut 'prévu'."
      });
    }

    await deleteParticipationsBySession(id);
    const result = await disableSessionById(id); // suppression réelle

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Session non trouvée" });
    }

    res.json({ success: true, message: "✅ Session supprimée avec succès" });
  } catch (err) {
    console.error("❌ Erreur suppression session :", err);
    res.status(500).json({ error: "Erreur suppression session" });
  }
};

// 🔹 Récupérer les sessions filtrées
export const getFilteredSessions = async (req, res) => {
  const { formation_id, date } = req.query;

  try {
    let query = `
      SELECT 
        s.session_id,
        s.formation_id,
        s.date_realisation,
        s.nb_participants_prevu,
        s.local,
        s.pauses,
        s.formateur_cuid,
        c.nom || ' ' || c.prenom AS formateur_nom_complet,
        s.prestataire_id,
        p.nom AS nom_prestataire,
        f.intitule AS intitule_formation
      FROM session_formation s
      JOIN formation f ON f.id = s.formation_id
      LEFT JOIN collaborateurs c ON s.formateur_cuid = c.cuid
      LEFT JOIN prestataire p ON s.prestataire_id = p.id
      WHERE 1 = 1
    `;

    const conditions = [];
    const values = [];

    if (formation_id) {
      values.push(formation_id);
      conditions.push(`f.id = $${values.length}`);
    }

    if (date) {
      values.push(date);
      conditions.push(`DATE(s.date_realisation) = $${values.length}`);
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ' ORDER BY s.date_realisation DESC';

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Erreur filtre sessions :", err);
    res.status(500).json({ error: "Erreur récupération sessions filtrées" });
  }
};
