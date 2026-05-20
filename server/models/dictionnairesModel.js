// models/dictionnairesModel.js
import pool from "../db/db.js";

export async function getPostesModel() {
  return pool.query("SELECT id, intitule_poste AS nom FROM poste");
}

export async function getDirectionsModel() {
  return pool.query("SELECT id, direction AS nom FROM direction");
}

export async function getSitesModel() {
  return pool.query("SELECT id, site_nom AS nom FROM site_affectation");
}

export async function getFilieresModel() {
  return pool.query("SELECT id, filiere AS nom FROM filiere");
}

export async function getUnitesModel() {
  return pool.query("SELECT unite_organisationnelle AS id, libelle_uo AS nom FROM unite_organisationnelle");
}
