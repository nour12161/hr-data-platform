import express from 'express';
import {
  getPostes,
  getDirections,
  getSites,
  getFilieres,
  getUnites
} from '../controllers/dictionnairesController.js';

const router = express.Router();

// Routes dictionnaires
router.get('/postes', getPostes);
router.get('/directions', getDirections);
router.get('/sites', getSites);
router.get('/filieres', getFilieres);
router.get('/unites', getUnites);

export default router;
