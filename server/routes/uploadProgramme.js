import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { uploadProgramme } from "../controllers/uploadprogrammeController.js";

const router = express.Router();

//  Config Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/programmes";
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `programme_import_${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// Route d'importation des programmes
router.post("/upload-programme", upload.single("file"), uploadProgramme);

export default router;
