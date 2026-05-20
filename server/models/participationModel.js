
import pool from "../db/db.js";

export async function findFormationByName(formationName) {
  const result = await pool.query(
    "SELECT id FROM formation WHERE regexp_replace(intitule, '\\s+', ' ', 'g') ILIKE $1",
    [`%${formationName}%`]
  );
  return result.rows[0] || null;
}

export async function findSessionByFormationAndDate(formationId, sessionDate) {
  const result = await pool.query(
    `SELECT session_id FROM session_formation 
     WHERE formation_id = $1 AND date_realisation = $2`,
    [formationId, sessionDate]
  );
  return result.rows[0] || null;
}

export async function updateNomFormateur(sessionId, nomFormateur) {
  return pool.query(
    `UPDATE session_formation SET nom_formateur = $1 WHERE session_id = $2`,
    [nomFormateur, sessionId]
  );
}

export async function checkParticipationExists(cuid, sessionId) {
  const result = await pool.query(
    `SELECT 1 FROM participation 
     WHERE collaborateur_cuid = $1 AND session_id = $2`,
    [cuid, sessionId]
  );
  return result.rows.length > 0;
}

export async function insertParticipation({
  cuid,
  sessionId,
  cadre,
  statut,
  date,
  certification,
  statutCertif,
  dateObtention,
  dateExpiration
}) {
  return pool.query(
    `INSERT INTO participation (
      collaborateur_cuid, session_id, cadre_accompagnement, statut_participation,
      date_de_participation, certification_obtenue, statut_certification,
      date_obtention_certification, date_expiration_certification
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      cuid,
      sessionId,
      cadre || null,
      statut || null,
      date,
      certification,
      statutCertif || null,
      dateObtention,
      dateExpiration
    ]
  );
}

//  Récup les particip d'une session
export const getParticipantsBySessionModel = async (sessionId) => {
  return await pool.query(
    `SELECT p.session_id, p.collaborateur_cuid AS cuid, c.nom, c.prenom, p.statut_participation
     FROM participation p
     JOIN collaborateurs c ON c.cuid = p.collaborateur_cuid
     WHERE p.session_id = $1`,
    [sessionId]
  );
};

//  Insertion manuelle d'une participation
export const insertParticipationManuelleModel = async (session_id, cuid) => {
  return await pool.query(
    `INSERT INTO participation (session_id, collaborateur_cuid, date_de_participation, statut_participation)
     VALUES ($1, $2, CURRENT_DATE, 'prévu')`,
    [session_id, cuid]
  );
};

//  supp d'une participation
export const disableParticipationModel = async (session_id, cuid) => {
  return await pool.query(
    `DELETE FROM participation WHERE session_id = $1 AND collaborateur_cuid = $2`,
    [session_id, cuid]
  );
};

//  liste
export const getAllParticipationsModel = async () => {
  return await pool.query(`
    SELECT 
      p.session_id,
      p.collaborateur_cuid AS cuid,
      c.nom,
      c.prenom,
      f.intitule AS intitule_formation,
      s.date_realisation,
      p.statut_participation
    FROM participation p
    JOIN collaborateurs c ON c.cuid = p.collaborateur_cuid
    JOIN session_formation s ON s.session_id = p.session_id
    JOIN formation f ON f.id = s.formation_id
    ORDER BY s.date_realisation DESC
  `);
};

// ✅ màj multiple de statut
export const updateMultipleParticipationsModel = async (participants) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const p of participants) {
      await client.query(
        `UPDATE participation
         SET statut_participation = $1
         WHERE session_id = $2 AND collaborateur_cuid = $3`,
        [p.statut_participation, p.session_id, p.cuid]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

//  Liste active des participations avec détails
export const getParticipantsWithDetailsModel = async () => {
  return await pool.query(`
    SELECT 
      p.session_id,
      p.collaborateur_cuid AS cuid,
      c.nom,
      c.prenom,
      f.intitule AS intitule_formation,
      s.date_realisation,
      p.statut_participation
    FROM participation p
    JOIN collaborateurs c ON c.cuid = p.collaborateur_cuid
    JOIN session_formation s ON s.session_id = p.session_id
    JOIN formation f ON f.id = s.formation_id
    WHERE s.active = true
    ORDER BY s.date_realisation DESC
  `);
};