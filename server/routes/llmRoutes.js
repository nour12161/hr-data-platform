// server/routes/llmRoutes.js
import express from 'express';
import { repondreQuestion } from '../controllers/llmController.js';

const router = express.Router();
router.post('/repondre', repondreQuestion);

export default router;
