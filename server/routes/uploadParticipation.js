import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { uploadParticipation } from "../controllers/participationController.js";

const router = express.Router();

// Config Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/participation";
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `participation_import_${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// Route d'importation des participations
router.post("/upload-participation", upload.single("file"), uploadParticipation);

export default router;
