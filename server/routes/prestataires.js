import express from 'express';
import pool from '../db/db.js';

const router = express.Router();

// ✅ Récupérer tous les prestataires
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nom FROM prestataire ORDER BY nom ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erreur récupération prestataires :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
