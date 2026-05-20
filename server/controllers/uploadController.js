

import fs from "fs";
import path from "path";
import XLSX from "xlsx";
import pool from "../db/db.js";

const moisTexteToNumber = {
  "Janvier": "01", "Février": "02", "Mars": "03", "Avril": "04", "Mai": "05", "Juin": "06",
  "Juillet": "07", "Août": "08", "Septembre": "09", "Octobre": "10", "Novembre": "11", "Décembre": "12"
};

function excelDateToJSDate(excelDate) {
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return isNaN(date.getTime()) ? null : date.toISOString().split("T")[0];
}

function nettoyerNomColonnes(row) {
  const fixedRow = {};
  for (const key in row) {
    const cleanedKey = key.replace(/’/g, "'").trim();
    fixedRow[cleanedKey] = row[key];
  }
  return fixedRow;
}

export async function importerFichierExcel(req, res) {
  try {
    const userId = req.user?.id || null;
    const moisInput = req.body.mois_reference?.toString().trim();
    const anneeInput = req.body.annee_reference?.toString().trim();
    const mois_reference = !isNaN(moisInput)
      ? parseInt(moisInput)
      : parseInt(moisTexteToNumber[moisInput?.charAt(0).toUpperCase() + moisInput?.slice(1).toLowerCase()] ?? 0);
    const annee_reference = parseInt(anneeInput);
    const dateImport = `${annee_reference}-${String(mois_reference).padStart(2, "0")}-01`;

    if (!req.file) return res.status(400).json({ success: false, error: "Aucun fichier reçu" });

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: true });

    const colonnesDate = ["Date de naissance", "Date d'entrée", "Date d'embauche consolidée", "Date de fin de contrat"];

    const data = rawData.map(row => {
      row = nettoyerNomColonnes(row);
      row['Niveau'] = row['Niveau']?.toString().trim();

      colonnesDate.forEach(col => {
        if (row[col]) {
          if (typeof row[col] === "number") {
            row[col] = excelDateToJSDate(row[col]);
          } else if (moisTexteToNumber[row[col]]) {
            row[col] = `${annee_reference}-${moisTexteToNumber[row[col]]}-01`;
          } else {
            row[col] = null;
          }
        }
      });

      row['Qualification Cadre'] = (row['Qualification Cadre']?.toString().toLowerCase() === 'cadre');
      row['Affectation Comex'] = (row['Affectation Comex']?.toString().toLowerCase() === 'membre comex');
      row['ResponsableUO'] = (row['ResponsableUO']?.toString().toLowerCase() === 'oui');
      row['Niveau Managerial'] = (row['Niveau Managerial']?.toString().toLowerCase() === 'oui');
      row['Statut Contrat'] = row['Statut Contrat']?.toString().trim().toLowerCase() === 'actif';

      return row;
    });

    const cuidMap = {};
    for (const row of data) {
      let cuid = row['CUID'];
      let originalCuid = cuid;
      let count = 1;
      while (cuidMap[cuid]) {
        cuid = `${originalCuid}-${count++}`;
      }
      cuidMap[cuid] = true;
      row['CUID'] = cuid;
    }

    const importCUIDs = data.map(r => r['CUID']);
    let ajoutCount = 0, modifCount = 0, suppressionCount = 0;
    const anciensCUIDsAvantImport = (await pool.query(`SELECT cuid FROM collaborateurs`)).rows.map(r => r.cuid);

    for (const row of data) {
      const cuid = row['CUID'];
      const existing = await pool.query(`SELECT * FROM collaborateurs WHERE cuid = $1`, [cuid]);
      const existingData = existing.rows[0];

      let posteId = null, directionId = null, siteId = null, filiereId = null;

      if (row['Intitulé de Poste']) {
        const r = await pool.query(`SELECT id FROM poste WHERE intitule_poste = $1`, [row['Intitulé de Poste']]);
        posteId = r.rows[0]?.id || (await pool.query(`INSERT INTO poste (intitule_poste, grade_poste) VALUES ($1, $2) RETURNING id`, [row['Intitulé de Poste'], row['Grade du poste']])).rows[0].id;
      }

      if (row['Direction']) {
        const r = await pool.query(`SELECT id FROM direction WHERE direction = $1`, [row['Direction']]);
        directionId = r.rows[0]?.id || (await pool.query(`INSERT INTO direction (direction) VALUES ($1) RETURNING id`, [row['Direction']])).rows[0].id;
      }

      if (row["Site d'affectation"]) {
        const r = await pool.query(`SELECT id FROM site_affectation WHERE site_nom = $1 AND localisation_demographique = $2`, [row["Site d'affectation"], row["Localisation démographique"]]);
        siteId = r.rows[0]?.id || (await pool.query(`INSERT INTO site_affectation (site_nom, localisation_demographique) VALUES ($1, $2) RETURNING id`, [row["Site d'affectation"], row["Localisation démographique"]])).rows[0].id;
      }

      if (row['Filière']) {
        const r = await pool.query(`SELECT id FROM filiere WHERE filiere = $1`, [row['Filière']]);
        filiereId = r.rows[0]?.id || (await pool.query(`INSERT INTO filiere (filiere) VALUES ($1) RETURNING id`, [row['Filière']])).rows[0].id;
      }

      if (row['Unité organisat']) {
        const r = await pool.query(`SELECT unite_organisationnelle FROM unite_organisationnelle WHERE unite_organisationnelle = $1`, [row['Unité organisat']]);
        if (r.rows.length === 0) {
          await pool.query(`INSERT INTO unite_organisationnelle (unite_organisationnelle, libelle_uo, centre_cout) VALUES ($1, $2, $3)`, [row['Unité organisat'], row['Libellé UO'] || null, row['Centre de coûts'] || null]);
        }
      }

      if (!existingData) {
        ajoutCount++;
       await pool.query(`
          INSERT INTO collaborateurs (
            cuid, matricule, nom, prenom, genre, date_naissance, situation_familiale, date_creation,
            nb_absence_cumule, responsable_uo, filiere_metier, poste_id, direction_id, site_affectation_id,
            unite_organisationnelle, filiere_id, statut_contrat, date_fin_contrat, date_entree,
            date_embauche_consolidee, grade_actuel, niveau, niveau_managerial, qualification_cadre, affectation_comex, n_plus_1_cuid, n_plus_2_cuid
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13, $14,
            $15, $16, $17, $18, $19,
            $20, $21, $22, $23, $24, $25,
            $26, $27
          )
        `, [
          row['CUID'],
          row['Matricule'],
          (row['Nom et Prénom'] || '').split(" ")[0],
          (row['Nom et Prénom'] || '').split(" ")[1] || '',
          row['Genre'],
          row['Date de naissance'],
          row['Situation familiale'],
          dateImport,
          row["Nb d'absence cumulé depuis Janvier"],
          row['ResponsableUO'],
          row['Filiere de metier'],
          posteId,
          directionId,
          siteId,
          row['Unité organisat'],
          filiereId,
          row['Statut Contrat'],
          row['Date de fin de contrat'],
          row["Date d'entrée"],
          row["Date d'embauche consolidée"],
          row['Grade Actuel'],
          row['Niveau'],
          row['Niveau Managerial'],
          row['Qualification Cadre'],
          row['Affectation Comex'],
          row['N+1'],
          row['N+2']
        ]);
      } else {
        // Historisation si champs significatifs changés
        const champsSignificatifs = ['grade_actuel', 'niveau', 'statut_contrat'];
        const donneesAvant = {}, donneesApres = {}, champsModifies = [];

        for (const champ of champsSignificatifs) {
          const dbField = champ;
          const excelField = champ === 'grade_actuel'
            ? 'Grade Actuel'
            : champ === 'niveau'
              ? 'Niveau'
              : 'Statut Contrat';

          const oldValue = existingData[dbField];
          const newValue = row[excelField];

          if (oldValue !== newValue) {
            donneesAvant[champ] = oldValue;
            donneesApres[champ] = newValue;
            champsModifies.push(champ);
          }
        }

        if (champsModifies.length > 0) {
          modifCount++;
 await pool.query(`
  INSERT INTO historique_modif_collaborateurs (
    cuid, date_operation, type_operation, donnees_avant, donnees_apres,
    champs_modifies, mois_reference, annee_reference, user_id
  ) VALUES ($1, $2, 'modification', $3, $4, $5, $6, $7, $8)
`, [
  cuid,
  dateImport,
  JSON.stringify(donneesAvant),
  JSON.stringify(donneesApres),
  champsModifies.join(', '),
  mois_reference,
  annee_reference,
  userId
]);
        }
      }
    }

    // Suppression logique des collaborateurs manquants
    const inBase = await pool.query(`SELECT cuid, statut_contrat FROM collaborateurs`);
    const anciensCUIDsFinal = inBase.rows.map(r => r.cuid);
    const statutContratMap = Object.fromEntries(inBase.rows.map(r => [r.cuid, r.statut_contrat]));

    const missingCUIDs = anciensCUIDsFinal.filter(cuid => !importCUIDs.includes(cuid));

    for (const cuid of missingCUIDs) {
      if (statutContratMap[cuid] === true) {
        const historiqueExist = await pool.query(`
          SELECT 1 FROM historique_modif_collaborateurs
          WHERE cuid = $1 AND type_operation = 'suppression'
        `, [cuid]);

        if (historiqueExist.rows.length === 0) {
          await pool.query(`UPDATE collaborateurs SET statut_contrat = false WHERE cuid = $1`, [cuid]);
          suppressionCount++;

await pool.query(`
  INSERT INTO historique_modif_collaborateurs (
    cuid, date_operation, type_operation, donnees_avant, donnees_apres,
    champs_modifies, mois_reference, annee_reference, user_id
  ) VALUES ($1, $2, 'suppression', $3, $4, $5, $6, $7, $8)
`, [
  cuid,
  dateImport,
  JSON.stringify({ statut_contrat: true }),
  JSON.stringify({ statut_contrat: false }),
  'statut_contrat',
  mois_reference,
  annee_reference,
  userId
]);

        }
      }
    }

    fs.unlinkSync(req.file.path);

    res.status(201).json({
      success: true,
      message: `✅ Import terminé. Ajout: ${ajoutCount}, Modification: ${modifCount}, Suppression: ${suppressionCount}`
    });

  } catch (err) {
    console.error("Erreur importation:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
