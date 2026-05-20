// controllers/kpiController.js
import pool from "../db/db.js";

// ✅ Requête KPI : répartition + total + nouveaux
export const calculateKPI = async (req, res) => {
  const { champ } = req.params;
  const { annee, mois } = req.query;

  const champsAutorises = [
    "genre", "grade_actuel",
    "filiere_id", "direction_id", "site_affectation_id"
  ];

  if (!champ || !annee || !mois || !champsAutorises.includes(champ)) {
    return res.status(400).json({ success: false, message: "Paramètres invalides." });
  }

  try {
    let query;

    if (champ === "filiere_id") {
      query = `
        SELECT f.filiere AS name, COUNT(*) AS value
        FROM collaborateurs c
        JOIN filiere f ON f.id = c.filiere_id
        WHERE c.statut_contrat = true
          AND c.date_creation <= TO_DATE($1 || '-' || $2 || '-01', 'YYYY-MM-DD') 
            + INTERVAL '1 month' - INTERVAL '1 day'
        GROUP BY f.filiere
        ORDER BY value DESC;`;
    } else if (champ === "direction_id") {
      query = `
        SELECT d.direction AS name, COUNT(*) AS value
        FROM collaborateurs c
        JOIN direction d ON d.id = c.direction_id
        WHERE c.statut_contrat = true
          AND c.date_creation <= TO_DATE($1 || '-' || $2 || '-01', 'YYYY-MM-DD') 
            + INTERVAL '1 month' - INTERVAL '1 day'
        GROUP BY d.direction
        ORDER BY value DESC;`;
    } else if (champ === "site_affectation_id") {
      query = `
        SELECT s.site_nom AS name, COUNT(*) AS value
        FROM collaborateurs c
        JOIN site_affectation s ON s.id = c.site_affectation_id
        WHERE c.statut_contrat = true
          AND c.date_creation <= TO_DATE($1 || '-' || $2 || '-01', 'YYYY-MM-DD') 
            + INTERVAL '1 month' - INTERVAL '1 day'
        GROUP BY s.site_nom
        ORDER BY value DESC;`;
    } else {
      query = `
        SELECT ${champ} AS name, COUNT(*) AS value
        FROM collaborateurs
        WHERE statut_contrat = true
          AND date_creation <= TO_DATE($1 || '-' || $2 || '-01', 'YYYY-MM-DD') 
            + INTERVAL '1 month' - INTERVAL '1 day'
        GROUP BY ${champ}
        ORDER BY value DESC;`;
    }

    const { rows } = await pool.query(query, [annee, mois]);

    const totalResult = await pool.query(`
      SELECT COUNT(*) AS total
      FROM collaborateurs
      WHERE statut_contrat = true
        AND date_creation <= TO_DATE($1 || '-' || $2 || '-01', 'YYYY-MM-DD') 
          + INTERVAL '1 month' - INTERVAL '1 day'`, [annee, mois]);

    const nouveauxResult = await pool.query(`
      SELECT COUNT(*) AS nouveaux
      FROM collaborateurs
      WHERE statut_contrat = true
        AND date_creation >= TO_DATE($1 || '-' || $2 || '-01', 'YYYY-MM-DD')
        AND date_creation < TO_DATE($1 || '-' || $2 || '-01', 'YYYY-MM-DD') + INTERVAL '1 month'`, [annee, mois]);

    const total = Number(totalResult.rows[0].total);
    const nouveaux = Number(nouveauxResult.rows[0].nouveaux);

    res.json({ success: true, total, nouveaux, data: rows });

  } catch (err) {
    console.error("❌ Erreur KPI pour champ :", champ, err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ✅ Liste des champs disponibles dynamiquement
export const getChampsDisponibles = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'collaborateurs'
        AND table_schema = 'public'
        AND column_name NOT LIKE 'id'
        AND column_name NOT LIKE '%date%'
        AND column_name NOT IN ('created_at', 'updated_at', 'statut_contrat')
    `);

    const champs = result.rows.map(row => row.column_name);
    res.json({ success: true, data: champs.sort() });
  } catch (err) {
    console.error("Erreur récupération des champs :", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};


export const getEffectifActifParMois = async (req, res) => {
  const { annee } = req.query;

  try {
    const result = [];

    for (let mois = 1; mois <= 12; mois++) {
      const lastDayOfMonth = new Date(annee, mois, 0); // dernier jour du mois
      const dateStr = lastDayOfMonth.toISOString().split("T")[0];

      const { rows } = await pool.query(`
        SELECT COUNT(*)::int AS total
        FROM collaborateurs
        WHERE date_entree <= $1
          AND (date_fin_contrat IS NULL OR date_fin_contrat > $1)
          AND statut_contrat = true;
      `, [dateStr]);

      result.push({
        mois,
        total: rows[0].total,
      });
    }

    res.json(result);
  } catch (err) {
    console.error("Erreur KPI effectif par mois :", err);
    res.status(500).json({ error: "Erreur récupération de l’effectif mensuel" });
  }
};
