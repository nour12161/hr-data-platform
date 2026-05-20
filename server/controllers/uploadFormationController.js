import XLSX from "xlsx";
import fs from "fs";
import pool from "../db/db.js";
import bcrypt from "bcrypt";

// Mapping manuel entre noms et CUID/email
const piloteMap = {
  "Racha BR.": { cuid: "HLXK3879", email: "racha@example.com" },
  "Aziz M.": { cuid: "MGQZ8717", email: "aziz@example.com" },
  "Imen O.": { cuid: "JBBM8760", email: "imen@example.com" },
};

export const uploadFormation = async (req, res) => {
  try {
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const cleanedData = data.map(row => {
      const cleanedRow = {};
      for (const key in row) {
        cleanedRow[key.trim().replace(/\n/g, "")] = row[key];
      }
      return cleanedRow;
    });

    console.log("✅ Lignes Excel détectées :", cleanedData.length);

    for (const row of cleanedData) {
      console.log("📄 Traitement ligne Excel :", row);

      const piloteNom = row["Pilote"]?.trim();
      const piloteInfo = piloteMap[piloteNom];
      if (!piloteInfo) {
        console.log("⚠️ Pilote non reconnu :", piloteNom);
        continue;
      }

      // ➤ Gestion utilisateur (pilote)
      let piloteUserId;
      const { rows: existingUser } = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [piloteInfo.email]
      );

      if (existingUser.length > 0) {
        piloteUserId = existingUser[0].id;
      } else {
        const hashedPassword = await bcrypt.hash("123456", 10);
        const insertUser = await pool.query(
          "INSERT INTO users (email, password, role, is_active) VALUES ($1, $2, $3, $4) RETURNING id",
          [piloteInfo.email, hashedPassword, "pilote", true]
        );
        piloteUserId = insertUser.rows[0].id;
      }

      // ➤ Gestion prestataire
      let prestataireId = null;
      const nomPrestataire = row["Nom du prestataire"]?.trim();
      if (nomPrestataire) {
        const { rows: prestataires } = await pool.query(
          "SELECT id FROM prestataire WHERE nom = $1",
          [nomPrestataire]
        );
        if (prestataires.length > 0) {
          prestataireId = prestataires[0].id;
        } else {
          const insertPrestataire = await pool.query(
            "INSERT INTO prestataire (type, nom) VALUES ($1, $2) RETURNING id",
            [row["Prestataire(Liste déroulante)"] || "Inconnu", nomPrestataire]
          );
          prestataireId = insertPrestataire.rows[0].id;
        }
      }

      //  Gestion programme
      let programmeId = null;
      const programmeIntitule = row["Le programme"];
      if (programmeIntitule && programmeIntitule !== "--") {
        const { rows: existingProgrammes } = await pool.query(
          "SELECT id FROM programme WHERE intitule = $1",
          [programmeIntitule]
        );
        if (existingProgrammes.length > 0) {
          programmeId = existingProgrammes[0].id;
        } else {
          const insertProgramme = await pool.query(
            "INSERT INTO programme (pilote_user_id, intitule) VALUES ($1, $2) RETURNING id",
            [piloteUserId, programmeIntitule]
          );
          programmeId = insertProgramme.rows[0].id;
        }
      }

      //  Gestion formation
      const formationIntituleOriginal = row["Intitulé de Formation"];
      let formationNom = formationIntituleOriginal;
      let formateurNom = null;

      if (formationIntituleOriginal.includes("_")) {
        const parts = formationIntituleOriginal.split("_");
        formationNom = parts[0].trim();
        const lastPart = parts[parts.length - 2] || parts[parts.length - 1];
        if (lastPart && isNaN(lastPart)) {
          formateurNom = lastPart.trim();
        }
      }

      let formationId;
      const { rows: existingFormation } = await pool.query(
        "SELECT id FROM formation WHERE intitule = $1",
        [formationNom]
      );
      if (existingFormation.length > 0) {
        formationId = existingFormation[0].id;
      } else {
        const insertFormation = await pool.query(
          `INSERT INTO formation (
            intitule, programme_id, modalite_apprentissage, type_formation,
            mode_formation, prestataire_id, certification, mode_financement,
            tfp, pilote_user_id, materiel_requis
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
          [
            formationNom,
            programmeId,
            row["Modalité d'apprentissage"] || "Inconnu",
            row["Catégorie de compétence à développer"] || null,
            row["Mode de formation"] || "Inconnu",
            prestataireId,
            row["Certfication"] === "Oui",
            row["Mode de financement"] || null,
            row["TFP"] === "Oui",
            piloteUserId,
            row["Matériel requis"] || null
          ]
        );
        formationId = insertFormation.rows[0].id;
      }

      // ➤ Déduire formateur CUID
      let formateurCUID = piloteInfo.cuid;
      if (formateurNom) {
        const { rows: collab } = await pool.query(
          "SELECT cuid FROM collaborateurs WHERE CONCAT(nom, ' ', prenom) ILIKE $1",
          [`%${formateurNom}%`]
        );
        if (collab.length > 0) {
          formateurCUID = collab[0].cuid;
        }
      }

      // ➤ Date de session
      let dateRealisation = null;
      const rawDate = row["Date de réalisation"];
      if (typeof rawDate === 'string') {
        dateRealisation = new Date(rawDate).toISOString().split("T")[0];
      } else {
        const excelDate = XLSX.SSF.parse_date_code(rawDate);
        if (excelDate) {
          const jsDate = new Date(Date.UTC(excelDate.y, excelDate.m - 1, excelDate.d));
          dateRealisation = jsDate.toISOString().split("T")[0];
        }
      }

      // Vérifier session
      const { rows: existingSessions } = await pool.query(
        `SELECT session_id FROM session_formation 
         WHERE formation_id = $1 AND date_realisation = $2`,
        [formationId, dateRealisation]
      );

      if (existingSessions.length === 0) {
        await pool.query(
          `INSERT INTO session_formation (
            formation_id, date_realisation, local, pauses,
            nb_participants_prevu, formateur_cuid
          ) VALUES ($1,$2,$3,$4,$5,$6)`,
          [
            formationId,
            dateRealisation,
            row["Local"] || null,
            row["Pauses"] || null,
            row["Nombre prévisionnels de participants (Invités)"] || null,
            formateurCUID
          ]
        );
      }
    }

    fs.unlinkSync(filePath); // Nettoyage du fichier importé

    res.json({ success: true, message: "Importation des formations terminée." });
  } catch (err) {
    console.error("❌ Erreur importation formations :", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
