import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import { uploadFormation } from "../controllers/uploadFormationController.js";

const router = express.Router();

// 📂 Configuration du stockage des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/formations";
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `formation_import_${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// 📥 Route POST : importer une feuille de formations depuis Excel
router.post("/upload-formation", upload.single("file"), uploadFormation);

export default router;
