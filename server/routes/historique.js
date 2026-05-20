import express from "express";
import { getHistoriqueModifications } from "../controllers/historiqueController.js";

const router = express.Router();

// 📦 GET /api/historique
router.get("/", getHistoriqueModifications);

export default router;
