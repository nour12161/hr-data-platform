import pool from "../db/db.js";

export async function getAllFormations() {
  return pool.query(`
    SELECT
      f.id,
      f.intitule,
      p.intitule AS programme_nom,
      ma.libelle AS modalite_apprentissage,
      mf.libelle AS mode_formation,
      fi.libelle AS mode_financement,
      f.certification,
      f.tfp,
      f.materiel_requis
    FROM formation f
    LEFT JOIN programme p ON f.programme_id = p.id
    LEFT JOIN modalite_apprentissage ma ON f.modalite_apprentissage_id = ma.id
    LEFT JOIN mode_formation mf ON f.mode_formation_id = mf.id
    LEFT JOIN mode_financement fi ON f.mode_financement_id = fi.id
    WHERE f.active = true
    ORDER BY f.id DESC
  `);
}


export async function updateFormationById(id, data) {
  const {
    intitule,
    modalite_apprentissage_id,
    mode_formation_id,
    certification
  } = data;

  const idInt = parseInt(id);
  if (isNaN(idInt)) throw new Error("ID invalide");

  return pool.query(
    `UPDATE formation 
     SET intitule = $1,
         modalite_apprentissage_id = $2,
         mode_formation_id = $3,
         certification = $4
     WHERE id = $5 AND active = true
     RETURNING *`,
    [
      intitule?.trim(),
      modalite_apprentissage_id || null,
      mode_formation_id || null,
      certification === true || certification === "true",
      idInt
    ]
  );
}
export async function disableFormationById(id) {
  return pool.query(
    `UPDATE formation 
     SET active = false 
     WHERE id = $1`,
    [id]
  );
}

export async function getSessionsByFormation(id) {
  return pool.query(
    `SELECT 
        s.session_id,
        s.date_realisation,
        s.nb_participants_prevu,
        s.local,
        s.pauses,
        s.formateur_cuid,
        c.nom AS nom_formateur,
        c.prenom AS prenom_formateur
     FROM session_formation s
     LEFT JOIN collaborateurs c ON s.formateur_cuid = c.cuid
     WHERE s.formation_id = $1 AND s.active = true
     ORDER BY s.date_realisation ASC`,
    [id]
  );
}

export async function getParticipantsBySessionId(sessionId) {
  return pool.query(
    `SELECT p.collaborateur_cuid AS cuid, c.nom, c.prenom
     FROM participation p
     JOIN collaborateurs c ON p.collaborateur_cuid = c.cuid
     WHERE p.session_id = $1`,
    [sessionId]
  );
}
