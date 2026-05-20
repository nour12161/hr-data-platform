import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { importerFichierExcel } from "../controllers/uploadController.js";
import verifyToken from "../middlewares/verifyToken.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/";
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `base_admin_${Date.now()}${ext}`);
  }
});

const upload = multer({ storage });

router.post("/", verifyToken, upload.single("file"), importerFichierExcel);

export default router;
