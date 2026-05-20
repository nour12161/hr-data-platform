import express from "express";
import { calculateKPI, getChampsDisponibles,getEffectifActifParMois } from "../controllers/kpiController.js";

const router = express.Router();

router.get("/calculate/:champ", calculateKPI);
router.get("/champs", getChampsDisponibles);
router.get("/evolution/effectif", getEffectifActifParMois);

export default router;
