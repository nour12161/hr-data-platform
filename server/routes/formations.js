import express from 'express';
import {
  getFormations,
  updateFormation,
  disableFormation,
  getSessionsByFormationId,
  getParticipantsBySession,
  createFormation,
  getModesFormation,
  getModalitesApprentissage,
  getModesFinancement
} from '../controllers/formationsController.js';

const router = express.Router();

// ✅ [1] Récupérer toutes les formations actives
router.get('/', getFormations);
router.post("/", createFormation);

// ✅ [2] Modifier une formation active uniquement
router.put('/:id', updateFormation);

// ✅ [3] Désactiver une formation (soft delete)
router.put('/disable/:id', disableFormation);

// ✅ [4] Récupérer les sessions d'une formation
router.get('/:id/sessions', getSessionsByFormationId);

// ✅ [5] Récupérer les participants d'une session
router.get('/sessions/:sessionId/participants', getParticipantsBySession);


// ✅ [6] Routes pour les listes déroulantes
router.get('/referentiels/modes-formation', getModesFormation);
router.get('/referentiels/modalites-apprentissage', getModalitesApprentissage);
router.get('/referentiels/modes-financement', getModesFinancement);

export default router;
