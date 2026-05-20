
import {
  insertCollaborateur,
  desactiverCollaborateur,
  getCollaborateursActifs,
  updateCollaborateur
} from "../models/collaborateursModel.js";


export async function ajouterCollaborateur(req, res) {
  try {
    const result = await insertCollaborateur(req.body);
    res.status(201).json({
      success: true,
      message: "Collaborateur ajouté avec succès.",
      collaborateur: result.rows[0]
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout manuel :", error.stack);
    res.status(500).json({ error: "Erreur serveur." });
  }
}


export async function supprimerCollaborateur(req, res) {
  const { cuid } = req.params;

  if (!cuid) {
    return res.status(400).json({ error: "CUID manquant." });
  }

  try {
    const result = await desactiverCollaborateur(cuid);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Collaborateur non trouvé ou déjà supprimé." });
    }

    res.json({ message: `Collaborateur ${cuid} supprimé logiquement.` });
  } catch (error) {
    console.error("❌ Erreur suppression logique :", error);
    res.status(500).json({ error: "Erreur serveur lors de la suppression." });
  }
}


export async function getCollaborateursActifsController(req, res) {
  try {
    const result = await getCollaborateursActifs();
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Erreur récupération collaborateurs actifs :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}


export async function modifierCollaborateur(req, res) {
  const userId = req.user?.id; // ID de l’utilisateur connecté par jwt
  const { cuid } = req.params;
  const donnees = req.body;

  
  const champsAutorises = [
    "matricule", "nom", "prenom", "genre", "date_naissance", "situation_familiale",
    "n_plus_1_cuid", "n_plus_2_cuid", "nb_absence_cumule", "responsable_uo",
    "filiere_metier", "poste_id", "direction_id", "site_affectation_id",
    "unite_organisationnelle", "filiere_id", "date_fin_contrat", "date_entree",
    "date_embauche_consolidee", "grade_actuel", "niveau", "niveau_managerial",
    "qualification_cadre", "affectation_comex"
  ];

  try {
    // recup
    const { rows } = await getCollaborateursActifs();
    const actuel = rows.find(c => c.cuid === cuid);

    if (!actuel) {
      return res.status(404).json({ error: "Collaborateur non trouvé." });
    }

    const champsModifies = [];
    const valeurs = [];

    // comp les valeurs propr
    function normalize(val) {
      if (val === null || val === undefined) return '';
      if (val instanceof Date) return val.toISOString().split('T')[0];
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) return val.split('T')[0];
      return String(val).trim();
    }

    
    for (const champ of champsAutorises) {
      if (donnees.hasOwnProperty(champ) && normalize(donnees[champ]) !== normalize(actuel[champ])) {
        champsModifies.push(champ);
        valeurs.push(donnees[champ]);
      }
    }

    
    if (champsModifies.length === 0) {
      return res.status(400).json({ error: "Aucune modification détectée." });
    }

    // màj sur les c modifiié
    const result = await updateCollaborateur(cuid, valeurs, champsModifies);

    res.json({
      message: "Collaborateur mis à jour avec succès.",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour :", error);
    res.status(500).json({ error: "Erreur serveur lors de la mise à jour." });
  }
}
