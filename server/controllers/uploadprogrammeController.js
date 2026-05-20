// 📂 controllers/programmeController.js
import XLSX from "xlsx";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";
import {
  findUserByEmail,
  createPiloteUser,
  findProgrammeByIntitule,
  updateProgrammeByIntitule,
 insertProgrammeFromExcel,
} from "../models/programmeModel.js";

const piloteMap = {
  "Imen O.": { cuid: "JBBM8760", email: "imen@example.com" },
  "Aziz M.": { cuid: "MGQZ8717", email: "aziz@example.com" },
  "Racha BR.": { cuid: "HLXK3879", email: "racha@example.com" },
};

function excelDateToISO(dateValue) {
  if (typeof dateValue === "number") {
    const excelDate = XLSX.SSF.parse_date_code(dateValue);
    if (excelDate) {
      const jsDate = new Date(Date.UTC(excelDate.y, excelDate.m - 1, excelDate.d));
      return jsDate.toISOString().split("T")[0];
    }
  } else if (typeof dateValue === "string") {
    const jsDate = new Date(dateValue);
    return isNaN(jsDate.getTime()) ? null : jsDate.toISOString().split("T")[0];
  }
  return null;
}

export const uploadProgramme = async (req, res) => {
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

    for (const row of cleanedData) {
      const rawPiloteNom = (row["Pilote (Liste déroulante)"] || row["Pilote"])?.trim();
      const piloteInfo = piloteMap[rawPiloteNom];

      let piloteUserId = null;
      if (piloteInfo && piloteInfo.email) {
        try {
          const existingUser = await findUserByEmail(piloteInfo.email);
          if (existingUser) {
            piloteUserId = existingUser.id;
          } else {
            const hashedPassword = await bcrypt.hash("123456", 10);
            const newUser = await createPiloteUser(piloteInfo.email, hashedPassword);
            piloteUserId = newUser.id;
          }
        } catch (err) {
          console.error("Erreur création utilisateur pilote:", err);
          continue;
        }
      } else {
        console.warn(`❗ Pilote non reconnu : ${rawPiloteNom}`);
      }

      const intitule = row["Intitulé du programme"]?.trim();
      if (!intitule) continue;

      const existingProgramme = await findProgrammeByIntitule(intitule);
      const values = {
        piloteUserId,
        intitule,
        cadre: row["Cadre du programme"] || null,
        nbCible: row["Nb de cible"] ? parseInt(row["Nb de cible"]) : null,
        dateDebut: excelDateToISO(row["Date de début"]),
        dateFin: excelDateToISO(row["Date de fin"]),
        conception: row["Conception"] || null,
        deploiement: row["Déploiement"] || null,
        budgetPrevisionnel: row["Budget prévisionnel associé en Kdt"] ? parseFloat(row["Budget prévisionnel associé en Kdt"]) : null,
        budgetReel: row["Budget réel en Kdt"] ? parseFloat(row["Budget réel en Kdt"]) : null,
      };

      if (existingProgramme) {
        await updateProgramme(values);
      } else {
        await insertProgrammeFromExcel(values);
      }
    }

    res.json({ success: true, message: "Importation des programmes terminée." });
  } catch (err) {
    console.error("❌ Erreur import programme:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
