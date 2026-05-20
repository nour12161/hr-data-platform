// models/programmeModel.js
import pool from "../db/db.js";

// 🔍 Utilisateurs
export async function findUserByEmail(email) {
  const result = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  return result.rows[0] || null;
}

export async function createPiloteUser(email, hashedPassword) {
  const result = await pool.query(
    `INSERT INTO users (email, password, role, is_active)
     VALUES ($1, $2, 'pilote', true)
     RETURNING id`,
    [email, hashedPassword]
  );
  return result.rows[0];
}

// 🔍 Programmes
export async function findProgrammeByIntitule(intitule) {
  const result = await pool.query("SELECT id FROM programme WHERE intitule = $1", [intitule]);
  return result.rows[0] || null;
}

export async function getAllProgrammes() {
  const result = await pool.query("SELECT * FROM programme ORDER BY id DESC");
  return result.rows;
}

// insert excel
export async function insertProgrammeFromExcel({
  piloteUserId = null,
  intitule,
  cadre,
  nbCible,
  dateDebut,
  dateFin,
  conception,
  deploiement,
  budgetPrevisionnel,
  budgetReel,
}) {
  return pool.query(
    `INSERT INTO programme (
      pilote_user_id, intitule, cadre, nb_cible, date_debut,
      date_fin, conception, deploiement, budget_previsionnel, budget_reel
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      piloteUserId,
      intitule,
      cadre,
      nbCible,
      dateDebut,
      dateFin,
      conception,
      deploiement,
      budgetPrevisionnel,
      budgetReel,
    ]
  );
}

// insert programme
export async function insertProgrammeManuel({
  intitule,
  cadre,
  nbCible,
  dateDebut,
  dateFin,
  conception,
  deploiement,
  budgetPrevisionnel,
  budgetReel,
}) {
  return pool.query(
    `INSERT INTO programme (
      intitule, cadre, nb_cible, date_debut, date_fin,
      conception, deploiement, budget_previsionnel, budget_reel
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      intitule,
      cadre,
      nbCible,
      dateDebut,
      dateFin,
      conception,
      deploiement,
      budgetPrevisionnel,
      budgetReel,
    ]
  );
}

// ✅ Mise à jour par Intitulé (traitement Excel)
export async function updateProgrammeByIntitule(values) {
  return pool.query(
    `UPDATE programme SET
      pilote_user_id = $1, cadre = $3, nb_cible = $4,
      date_debut = $5, date_fin = $6, conception = $7,
      deploiement = $8, budget_previsionnel = $9, budget_reel = $10
     WHERE intitule = $2`,
    values
  );
}

// Màj par ID 
export async function updateProgrammeById(id, values) {
  return pool.query(
    `UPDATE programme SET
      intitule = $1,
      cadre = $2,
      nb_cible = $3,
      date_debut = $4,
      date_fin = $5,
      conception = $6,
      deploiement = $7,
      budget_previsionnel = $8,
      budget_reel = $9
     WHERE id = $10`,
    [...values, id]
  );
}

// Supp un programme
export const deleteProgramme = async (req, res) => {
  const id = req.params.id;
  try {
    const hasSessions = await hasSessionsForProgramme(id);

    if (hasSessions) {
      return res.status(400).json({
        success: false,
        message: "Ce programme est rattaché à des formations ayant des sessions. Suppression interdite.",
      });
    }

    await deleteProgrammeById(id);
    res.json({ success: true, message: "Programme supprimé avec succès." });
  } catch (err) {
    console.error("Erreur suppression programme :", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export async function deleteProgrammeById(id) {
  return pool.query(`DELETE FROM programme WHERE id = $1`, [id]);
}