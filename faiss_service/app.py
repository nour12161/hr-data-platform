from flask import Flask, request, jsonify
import faiss
import numpy as np
import psycopg2
from sentence_transformers import SentenceTransformer

app = Flask(__name__)
model = SentenceTransformer("all-MiniLM-L6-v2")

# Connexion PostgreSQL
conn = psycopg2.connect(
    dbname="gestion_collaborateurs",
    user="postgres",
    password="admin",  # ⬅️ Remplace ici
    host="localhost",
    port="5432"
)
cursor = conn.cursor()

# 🔄 Fonction pour créer les dictionnaires ID -> libellé
def fetch_dict(table, id_col, label_col):
    cursor.execute(f"SELECT {id_col}, {label_col} FROM {table}")
    return dict(cursor.fetchall())

# 📘 Dictionnaires de correspondance
postes = fetch_dict("poste", "id", "intitule_poste")
directions = fetch_dict("direction", "id", "direction")
sites = fetch_dict("site_affectation", "id", "site_nom")
filieres = fetch_dict("filiere", "id", "filiere")

# Charger les collaborateurs
cursor.execute("SELECT * FROM collaborateurs")
columns = [desc[0] for desc in cursor.description]
rows = cursor.fetchall()

# Générer les fiches lisibles
fiches = []
for row in rows:
    data = dict(zip(columns, row))
    parts = []

    parts.append(f"CUID : {data.get('cuid', '')}")
    parts.append(f"Matricule : {data.get('matricule', '')}")
    parts.append(f"Nom : {data.get('nom', '')} {data.get('prenom', '')}")
    if data.get("genre"):
        parts.append(f"Genre : {data['genre']}")
    if data.get("date_naissance"):
        parts.append(f"Date de naissance : {data['date_naissance']}")
    if data.get("situation_familiale"):
        parts.append(f"Situation familiale : {data['situation_familiale']}")

    if data.get("date_entree"):
        parts.append(f"Date d'entrée : {data['date_entree']}")
    if data.get("date_embauche_consolidee"):
        parts.append(f"Date consolidée : {data['date_embauche_consolidee']}")
    if data.get("statut_contrat"):
        parts.append(f"Statut contrat : {data['statut_contrat']}")
    if data.get("date_fin_contrat"):
        parts.append(f"Fin de contrat : {data['date_fin_contrat']}")

    if data.get("n_plus_1_cuid"):
        parts.append(f"N+1 : {data['n_plus_1_cuid']}")
    if data.get("n_plus_2_cuid"):
        parts.append(f"N+2 : {data['n_plus_2_cuid']}")

    if data.get("poste_id"):
        parts.append(f"Poste : {postes.get(data['poste_id'], 'Inconnu')}")
    if data.get("direction_id"):
        parts.append(f"Direction : {directions.get(data['direction_id'], 'Inconnue')}")
    if data.get("site_affectation_id"):
        parts.append(f"Site d'affectation : {sites.get(data['site_affectation_id'], 'Inconnu')}")
    if data.get("unite_organisationnelle"):
        parts.append(f"Unité org. : {data['unite_organisationnelle']}")
    if data.get("filiere_id"):
        parts.append(f"Filière : {filieres.get(data['filiere_id'], 'Inconnue')}")
    if data.get("filiere_metier"):
        parts.append(f"Filière métier : {data['filiere_metier']}")

    if data.get("grade_actuel"):
        parts.append(f"Grade : {data['grade_actuel']}")
    if data.get("niveau"):
        parts.append(f"Niveau : {data['niveau']}")
    if data.get("niveau_managerial"):
        parts.append(f"Niveau managérial : {data['niveau_managerial']}")
    if data.get("qualification_cadre"):
        parts.append(f"Qualification cadre : {data['qualification_cadre']}")
    if data.get("affectation_comex"):
        parts.append(f"Affectation Comex : {data['affectation_comex']}")

    if data.get("nb_absence_cumule") is not None:
        parts.append(f"Absences : {data['nb_absence_cumule']} jours")
    if data.get("responsable_uo"):
        parts.append(f"Responsable UO : {data['responsable_uo']}")
    if data.get("date_creation"):
        parts.append(f"Date de création : {data['date_creation']}")

    texte = ", ".join(parts)

    fiches.append({
        "cuid": data.get("cuid", ""),
        "texte": texte
    })

# Encodage FAISS
corpus = [f["texte"] for f in fiches]
embeddings = model.encode(corpus)
index = faiss.IndexFlatL2(embeddings[0].shape[0])
index.add(np.array(embeddings))

# API de recherche
@app.route("/faiss/search", methods=["POST"])
def search():
    data = request.json
    question = data.get("question", "")
    limit = int(data.get("limit", 1))

    q_vec = model.encode([question])
    D, I = index.search(np.array(q_vec), limit)
    results = [fiches[i] for i in I[0]]
    return jsonify(results)

# Lancement
if __name__ == "__main__":
    app.run(port=7000)
