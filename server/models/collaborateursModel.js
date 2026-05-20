// models/collaborateursModel.js
import pool from "../db/db.js";

const toNullableInt = (val) => val === '' ? null : parseInt(val);
const toNullableText = (val) => val === '' ? null : val;

export async function insertCollaborateur(data) {
  const {
    cuid, matricule, nom, prenom, genre, date_naissance, situation_familiale,
    n_plus_1_cuid, n_plus_2_cuid, nb_absence_cumule, responsable_uo, filiere_metier,
    poste_id, direction_id, site_affectation_id, unite_organisationnelle, filiere_id,
    date_fin_contrat, date_entree, date_embauche_consolidee, grade_actuel, niveau,
    niveau_managerial, qualification_cadre, affectation_comex
  } = data;

  return pool.query(`
    INSERT INTO collaborateurs (
      cuid, matricule, nom, prenom, genre, date_naissance, situation_familiale,
      n_plus_1_cuid, n_plus_2_cuid, nb_absence_cumule,
      responsable_uo, filiere_metier, poste_id, direction_id, site_affectation_id,
      unite_organisationnelle, filiere_id, date_fin_contrat, date_entree,
      date_embauche_consolidee, grade_actuel, niveau, niveau_managerial,
      qualification_cadre, affectation_comex, statut_contrat, date_creation
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12, $13, $14, $15,
      $16, $17, $18, $19, $20, $21, $22, $23,
      $24, $25, true, CURRENT_DATE
    ) RETURNING *
  `, [
    toNullableText(cuid),
    toNullableInt(matricule),
    toNullableText(nom),
    toNullableText(prenom),
    toNullableText(genre),
    toNullableText(date_naissance),
    toNullableText(situation_familiale),
    toNullableText(n_plus_1_cuid),
    toNullableText(n_plus_2_cuid),
    toNullableInt(nb_absence_cumule),
    responsable_uo === true,
    toNullableText(filiere_metier),
    toNullableInt(poste_id),
    toNullableInt(direction_id),
    toNullableInt(site_affectation_id),
    toNullableText(unite_organisationnelle),
    toNullableInt(filiere_id),
    toNullableText(date_fin_contrat),
    toNullableText(date_entree),
    toNullableText(date_embauche_consolidee),
    toNullableText(grade_actuel),
    toNullableInt(niveau),
    niveau_managerial === true,
    qualification_cadre === true,
    affectation_comex === true
  ]);
}

export async function desactiverCollaborateur(cuid) {
  return pool.query(
    `UPDATE collaborateurs SET statut_contrat = false WHERE cuid = $1 AND statut_contrat = true`,
    [cuid]
  );
}

export async function getCollaborateursActifs() {
  return pool.query(`
    SELECT 
      c.cuid, c.matricule, c.nom, c.prenom, c.genre, c.date_naissance,
      c.situation_familiale, c.date_creation, c.n_plus_1_cuid, c.n_plus_2_cuid,
      c.nb_absence_cumule, c.responsable_uo, c.filiere_metier, c.grade_actuel,
      c.niveau, c.niveau_managerial, c.qualification_cadre, c.affectation_comex,
      c.date_fin_contrat, c.date_entree, c.date_embauche_consolidee,
      s.site_nom AS nom_site,
      p.intitule_poste AS nom_poste,
      d.direction AS nom_direction,
      f.filiere AS nom_filiere,
      u.unite_organisationnelle AS nom_unite
    FROM collaborateurs c
    LEFT JOIN site_affectation s ON c.site_affectation_id = s.id
    LEFT JOIN poste p ON c.poste_id = p.id
    LEFT JOIN direction d ON c.direction_id = d.id
    LEFT JOIN filiere f ON c.filiere_id = f.id
    LEFT JOIN unite_organisationnelle u ON c.unite_organisationnelle = u.unite_organisationnelle
    WHERE c.statut_contrat = true
    ORDER BY c.date_creation DESC;
  `);
}

/*
 
 Màj uniquement champs modif
 La clause SET est générée dynamiquement selon les champs à modifier

 */
export async function updateCollaborateur(cuid, nouveauxChamps, champsModifies) {
  const setClause = champsModifies.map((champ, i) => `${champ} = $${i + 1}`).join(", ");
  const query = `
    UPDATE collaborateurs
    SET ${setClause} 
    WHERE cuid = $${champsModifies.length + 1}
    RETURNING *;
  `;

  return pool.query(query, [...nouveauxChamps, cuid]);
}
