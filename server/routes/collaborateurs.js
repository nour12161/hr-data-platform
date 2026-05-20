import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import {
  ajouterCollaborateur,
  modifierCollaborateur,
  supprimerCollaborateur,
  getCollaborateursActifsController
} from "../controllers/collaborateursController.js";

const router = express.Router();

router.post("/add", verifyToken, ajouterCollaborateur);
router.put("/:cuid", verifyToken, modifierCollaborateur);
router.put("/delete/:cuid", verifyToken, supprimerCollaborateur);
router.get("/actifs", getCollaborateursActifsController); 

export default router;
