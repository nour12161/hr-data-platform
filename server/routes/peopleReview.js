import express from "express";
import { askGlobalCollaborateurIA  } from "../controllers/peopleReviewController.js";const router = express.Router();

router.post("/ask-global", askGlobalCollaborateurIA);

export default router;