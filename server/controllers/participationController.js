import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import pool from "../db/db.js";
import {
  findFormationByName,
  findSessionByFormationAndDate,
  updateNomFormateur,
  checkParticipationExists,
  insertParticipation,

    getParticipantsBySessionModel,
  insertParticipationManuelleModel,
  disableParticipationModel,
  getAllParticipationsModel,
  updateMultipleParticipationsModel,
  getParticipantsWithDetailsModel,
} from "../models/participationModel.js";

function parseExcelDate(value) {
  if (!value) return null;
  if (typeof value === "string") {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date.toISOString().split("T")[0];
  }
  if (typeof value === "number") {
    const jsDate = new Date((value - 25569) * 86400 * 1000);
    return isNaN(jsDate.getTime()) ? null : jsDate.toISOString().split("T")[0];
  }
  return null;
}

function extractFormationAndDate(reference) {
  if (!reference) return { formationName: null, sessionDate: null, nomFormateur: null };

  const moisMapping = {
    janvier: '01', février: '02', mars: '03', avril: '04', mai: '05', juin: '06',
    juillet: '07', août: '08', septembre: '09', octobre: '10', novembre: '11', décembre: '12',
    '01': '01', '02': '02', '03': '03', '04': '04', '05': '05', '06': '06',
    '07': '07', '08': '08', '09': '09', '10': '10', '11': '11', '12': '12'
  };

  const cleanedRef = reference
    .replace(/^Im_/, '')
    .replace(/^Ra\s*/, '')
    .replace(/^Az\s*/, '')
    .replace(/^#OTC:\s*/, '')
    .trim();

  const parts = cleanedRef.split('_');
  const sessionIndex = parts.findIndex(p => p.toLowerCase().includes("session"));

  if (sessionIndex !== -1 && sessionIndex + 2 < parts.length) {
    const formationName = parts.slice(0, sessionIndex).join(' ').trim();
    const day = parts[sessionIndex + 1].padStart(2, '0');
    const mois = moisMapping[parts[sessionIndex + 2].toLowerCase()];
    const sessionDate = mois ? `2025-${mois}-${day}` : null;
    return { formationName, sessionDate, nomFormateur: null };
  }

  const match = cleanedRef.match(/(.+?)__?(\d{1,2})_([a-zA-Zéû]+)/);
  if (match) {
    const formationName = match[1].trim();
    const day = match[2].padStart(2, '0');
    const mois = moisMapping[match[3].toLowerCase()];
    const sessionDate = mois ? `2025-${mois}-${day}` : null;
    return { formationName, sessionDate, nomFormateur: null };
  }

  const lastPart = parts[parts.length - 1];
  const mois = lastPart.substring(0, 2);
  const annee = lastPart.substring(2);
  const sessionDate = (moisMapping[mois] && annee) ? `${annee}-${mois}-01` : null;

  if (parts.length >= 3 && sessionDate) {
    const formationName = parts.slice(0, parts.length - 2).join('_').trim();
    const nomFormateur = parts[parts.length - 2].trim();
    return { formationName, sessionDate, nomFormateur };
  }

  return { formationName: null, sessionDate: null, nomFormateur: null };
}

export const uploadParticipation = async (req, res) => {
  try {
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    const cleanedData = data.map((row) => {
      const cleanedRow = {};
      for (const key in row) {
        const cleanKey = key.trim().replace(/\n/g, " ");
        cleanedRow[cleanKey] = row[key];
      }
      return cleanedRow;
    });

    console.log("✅ Nombre de lignes Excel :", cleanedData.length);

    for (const row of cleanedData) {
      const cuid = row["CUID Collaborateur"];
      if (!cuid) continue;

      for (let i = 1; i <= 5; i++) {
        const ref = row[`Référence action ${i}`];
        if (!ref) continue;

        const { formationName, sessionDate, nomFormateur } = extractFormationAndDate(ref);
        if (!formationName || !sessionDate) continue;

        const formation = await findFormationByName(formationName);
        if (!formation) continue;

        const session = await findSessionByFormationAndDate(formation.id, sessionDate);
        if (!session) continue;

        if (nomFormateur) await updateNomFormateur(session.session_id, nomFormateur);

        const exists = await checkParticipationExists(cuid, session.session_id);
        if (exists) continue;

        await insertParticipation({
          cuid,
          sessionId: session.session_id,
          cadre: row[`Cadre de l'accompagnement ${i}`],
          statut: row[`Statut du collaborateur ${i}`],
          date: sessionDate,
          certification: row[`Certification ${i}`] === "Oui",
          statutCertif: row[`Statut Certification ${i}`],
          dateObtention: parseExcelDate(row[`Date d'obtention Certification ${i}`]),
          dateExpiration: parseExcelDate(row[`Date d'expiration de la certification ${i}`])
        });

        console.log(`✅ Participation insérée : ${cuid} → session ${session.session_id}`);
      }
    }

    res.json({ success: true, message: "Importation des participations réussie." });
  } catch (err) {
    console.error("❌ Erreur import participation :", err);
    res.status(500).json({ success: false, error: err.message });
  }
};


//manuelle 


export const getParticipantsBySession = async (req, res) => {
  const { id: sessionId } = req.params;
  try {
    const result = await getParticipantsBySessionModel(sessionId);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Erreur récupération participants session :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Insertion manuelle
export const insertParticipationManuelle = async (req, res) => {
  const { session_id, cuid } = req.body;
  try {
    await insertParticipationManuelleModel(session_id, cuid);

    // màj du compteur automatique
    await pool.query(`
      UPDATE session_formation
    SET nb_participants_prevu = (
  SELECT COUNT(*) FROM participation
  WHERE session_id = $1
)

      WHERE session_id = $1
    `, [session_id]);

    res.json({ success: true, message: "Participant ajouté." });
  } catch (err) {
    console.error("❌ Erreur insertion participation :", err);
    res.status(500).json({ error: "Erreur insertion participation." });
  }
};


// ✅ [3] Désactivation
export const disableParticipation = async (req, res) => {
  const { session_id, cuid } = req.params;
  try {
    await disableParticipationModel(session_id, cuid);

    // 🔁 Mettre à jour automatiquement le nombre de participants actifs
    await pool.query(`
      UPDATE session_formation
     SET nb_participants_prevu = (
  SELECT COUNT(*) FROM participation
  WHERE session_id = $1
)
      WHERE session_id = $1
    `, [session_id]);

    res.json({ success: true, message: "Participation désactivée." });
  } catch (err) {
    console.error("❌ Erreur suppression participation :", err);
    res.status(500).json({ error: "Erreur suppression participation." });
  }
};


// afiich particip
export const getAllParticipations = async (req, res) => {
  try {
    const result = await getAllParticipationsModel();
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Erreur récupération participations détaillées :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// màj multiple
export const updateMultipleParticipations = async (req, res) => {
  const { participants } = req.body;
  try {
    await updateMultipleParticipationsModel(participants);
    res.json({ success: true, message: "Mise à jour réussie" });
  } catch (err) {
    console.error("❌ Erreur update multiple participations :", err);
    res.status(500).json({ error: "Erreur lors de la mise à jour des participations" });
  }
};

// ✅ [6] Liste active avec détails
export const getParticipantsWithDetails = async (req, res) => {
  try {
    const result = await getParticipantsWithDetailsModel();
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Erreur récupération participations :", err);
    res.status(500).json({ error: "Erreur récupération participations" });
  }
};


// màj des participants d'une session donnée
export const updateParticipantsBySessionId = async (req, res) => {
  const { id: session_id } = req.params;
  const { participants } = req.body;

  try {
    console.log("🟡 Participants reçus :", participants);
    console.log("📌 Session cible :", session_id);

    // Injecte le session_id dans chaque participant
    const updatedParticipants = participants.map(p => ({
      ...p,
      session_id: parseInt(session_id), // Assure-toi que c’est bien un nombre
    }));

    console.log("✅ Participants à mettre à jour :", updatedParticipants);

    await updateMultipleParticipationsModel(updatedParticipants);

    res.json({ success: true, message: "Participants mis à jour avec succès." });
  } catch (err) {
    console.error("❌ Erreur update participants by session :", err);
    res.status(500).json({ error: "Erreur lors de la mise à jour des participants." });
  }
};



