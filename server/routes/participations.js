import express from "express";
import {
  getParticipantsBySession,
  insertParticipationManuelle,
  disableParticipation,
  getAllParticipations,
  updateMultipleParticipations,
  updateParticipantsBySessionId,
  getParticipantsWithDetails 
} from "../controllers/participationController.js";

const router = express.Router();

router.get("/", getAllParticipations); 
router.get("/details", getAllParticipations);
router.get("/session/:id", getParticipantsBySession); 
router.post("/", insertParticipationManuelle); 
router.put("/:session_id/:cuid/disable", disableParticipation); 
router.put("/update-multiple", updateMultipleParticipations);
router.get("/details", getParticipantsWithDetails);
router.put('/session/:id', updateParticipantsBySessionId);

export default router;
