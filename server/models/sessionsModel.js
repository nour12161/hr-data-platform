import pool from "../db/db.js";


export async function isFormationActive(formation_id) {
  const result = await pool.query(
    `SELECT active FROM formation WHERE id = $1`,
    [formation_id]
  );
  return result.rows.length > 0 && result.rows[0].active;
}

// 🔹 Vérifier si un formateur est actif
export async function isFormateurActif(cuid) {
  const result = await pool.query(
    `SELECT 1 FROM collaborateurs WHERE cuid = $1 AND statut_contrat = true`,
    [cuid]
  );
  return result.rowCount > 0;
}

// 🔹 Vérifier s’il existe une session avec le même formateur, formation et date
export async function sessionDejaExistante(formation_id, date_realisation, formateur_cuid) {
  const result = await pool.query(
    `SELECT 1 FROM session_formation 
     WHERE formation_id = $1 AND date_realisation = $2 AND formateur_cuid = $3`,
    [formation_id, date_realisation, formateur_cuid]
  );
  return result.rowCount > 0;
}

//Vérif si le formateur est déjà occupé à la même date
export async function isFormateurDejaOccupe(date_realisation, formateur_cuid) {
  const result = await pool.query(
    `SELECT 1 FROM session_formation 
     WHERE date_realisation = $1 AND formateur_cuid = $2`,
    [date_realisation, formateur_cuid]
  );
  return result.rowCount > 0;
}

//Insérer une nouvelle session
export async function insertSession({
  formation_id,
  date_realisation,
  nb_participants_prevu,
  local,
  pauses,
  formateur_cuid,
  prestataire_id
}) {
  const result = await pool.query(
    `INSERT INTO session_formation
      (formation_id, date_realisation, nb_participants_prevu, local, pauses, formateur_cuid, prestataire_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING session_id`,
    [
      formation_id,
      date_realisation,
      nb_participants_prevu,
      local,
      pauses,
      formateur_cuid,
      prestataire_id
    ]
  );
  return result.rows[0].session_id;
}

//Modif une session
export async function updateSessionById(id, sessionData) {
  const {
    date_realisation,
    nb_participants_prevu,
    local,
    pauses,
    formateur_cuid,
    prestataire_id,
  } = sessionData;

  return pool.query(
    `UPDATE session_formation
     SET date_realisation = $1,
         nb_participants_prevu = $2,
         local = $3,
         pauses = $4,
         formateur_cuid = $5,
         prestataire_id = $6
     WHERE session_id = $7
     RETURNING *`,
    [
      date_realisation,
      nb_participants_prevu,
      local,
      pauses,
      formateur_cuid,
      prestataire_id,
      id
    ]
  );
}

//Supp session
export async function disableSessionById(id) {
  return pool.query(
    `DELETE FROM session_formation WHERE session_id = $1`,
    [id]
  );
}

//  Récup  participations d'une session
export async function getParticipantsBySession(sessionId) {
  const { rows } = await pool.query(
    `SELECT statut_participation FROM participation WHERE session_id = $1`,
    [sessionId]
  );
  return rows;
}

// supp les participations assoc à une session
export async function deleteParticipationsBySession(sessionId) {
  await pool.query(
    `DELETE FROM participation WHERE session_id = $1`,
    [sessionId]
  );
}

// insert particip 
export async function insertParticipants(participants, session_id, date_realisation, client) {
  for (const cuid of participants) {
    await client.query(
      `INSERT INTO participation (collaborateur_cuid, session_id, date_de_participation, statut_participation)
       VALUES ($1, $2, $3, 'prévu')`,
      [cuid, session_id, date_realisation]
    );
  }
}
