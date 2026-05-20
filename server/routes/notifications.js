import express from 'express';
import pool from "../db/db.js";

const router = express.Router();

router.get('/sessions-du-jour', async (req, res) => {
  try {
   const result = await pool.query(`
  SELECT 
    s.session_id, 
    s.date_realisation, 
    f.intitule
  FROM session_formation s
  JOIN formation f ON s.formation_id = f.id
  WHERE DATE(s.date_realisation) = CURRENT_DATE
    AND s.active = true
`);
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur dans /sessions-du-jour:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
