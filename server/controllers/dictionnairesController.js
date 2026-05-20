// controllers/dictionnairesController.js
import {
  getPostesModel,
  getDirectionsModel,
  getSitesModel,
  getFilieresModel,
  getUnitesModel
} from "../models/dictionnairesModel.js";

export const getPostes = async (req, res) => {
  try {
    const result = await getPostesModel();
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Erreur récupération postes:", error);
    res.status(500).json({ error: "Erreur serveur - postes" });
  }
};

export const getDirections = async (req, res) => {
  try {
    const result = await getDirectionsModel();
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Erreur récupération directions:", error);
    res.status(500).json({ error: "Erreur serveur - directions" });
  }
};

export const getSites = async (req, res) => {
  try {
    const result = await getSitesModel();
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Erreur récupération sites:", error);
    res.status(500).json({ error: "Erreur serveur - sites" });
  }
};

export const getFilieres = async (req, res) => {
  try {
    const result = await getFilieresModel();
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Erreur récupération filières:", error);
    res.status(500).json({ error: "Erreur serveur - filières" });
  }
};

export const getUnites = async (req, res) => {
  try {
    const result = await getUnitesModel();
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Erreur récupération unités organisationnelles:", error);
    res.status(500).json({ error: "Erreur serveur - unités organisationnelles" });
  }
};