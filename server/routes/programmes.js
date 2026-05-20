import express from "express";
import {
  ajouterProgrammeManuel,
  updateProgrammeManuel,
  getAllProgrammes,
  deleteProgramme
} from "../controllers/programmeController.js";

const router = express.Router();

router.post("/", ajouterProgrammeManuel); 
router.get("/", getAllProgrammes);       
router.put("/:id", updateProgrammeManuel); 
router.delete('/:id', deleteProgramme);

export default router;

