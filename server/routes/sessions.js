import express from 'express';
import {
  createSession,
  updateSession,
  deleteSession, // anciennement disableSession
  getFilteredSessions
} from "../controllers/sessionsController.js";

const router = express.Router();

router.post("/", createSession);
router.put("/:id", updateSession);
router.delete('/:id', deleteSession); // ✅ cohérent avec une suppression réelle
router.get('/filtre', getFilteredSessions);

export default router;
