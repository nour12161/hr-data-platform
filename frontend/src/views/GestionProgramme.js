import React, { useState, useEffect } from "react";
import axios from "axios";
import "./GestionProgramme.css";

const userRole = localStorage.getItem("userRole");
const isReadOnly = userRole === "top_manager";

export default function GestionProgramme() {
  const [formData, setFormData] = useState({
    intitule: "",
    cadre: "",
    nbCible: "",
    dateDebut: "",
    dateFin: "",
    conception: "",
    deploiement: "",
    budgetPrevisionnel: "",
    budgetReel: "",
    piloteEmail: "",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [programmes, setProgrammes] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [programmeId, setProgrammeId] = useState(null);

  const fetchProgrammes = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/programmes");
      setProgrammes(res.data);
    } catch (err) {
      console.error("Erreur récupération programmes :", err);
    }
  };

  useEffect(() => {
    fetchProgrammes();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (programme) => {
    setEditMode(true);
    setProgrammeId(programme.id);
    setFormData({
      intitule: programme.intitule || "",
      cadre: programme.cadre || "",
      nbCible: programme.nb_cible || "",
      dateDebut: programme.date_debut?.slice(0, 10) || "",
      dateFin: programme.date_fin?.slice(0, 10) || "",
      conception: programme.conception || "",
      deploiement: programme.deploiement || "",
      budgetPrevisionnel: programme.budget_previsionnel || "",
      budgetReel: programme.budget_reel || "",
      piloteEmail: "",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Confirmer la suppression de ce programme ?")) return;
    try {
      const res = await axios.delete(`http://localhost:5000/api/programmes/${id}`);
      setMessage(res.data.message || "Programme supprimé.");
      setMessageType("success");
      fetchProgrammes();
    } catch (error) {
      setMessage(error.response?.data?.message || "Erreur lors de la suppression.");
      setMessageType("error");
      console.error(error);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setProgrammeId(null);
    setFormData({
      intitule: "",
      cadre: "",
      nbCible: "",
      dateDebut: "",
      dateFin: "",
      conception: "",
      deploiement: "",
      budgetPrevisionnel: "",
      budgetReel: "",
      piloteEmail: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axios.put(`http://localhost:5000/api/programmes/${programmeId}`, formData);
        setMessage("Programme modifié avec succès !");
      } else {
        await axios.post("http://localhost:5000/api/programmes", formData);
        setMessage("Programme ajouté avec succès !");
      }
      setMessageType("success");
      fetchProgrammes();
      handleCancelEdit();
    } catch (error) {
      setMessage("Intitulé du programme déjà existant.");
      setMessageType("error");
      console.error(error);
    }
  };

  return (
    <div className="section-card fade-in">
      {!isReadOnly && (
        <>
          <h2 className="section-title">
            {editMode ? "Modifier un programme" : "Ajouter un programme"}
          </h2>

          <form onSubmit={handleSubmit} className="grid gap-4">
            {[
              { name: "intitule", placeholder: "Intitulé du programme" },
              { name: "cadre", placeholder: "Cadre du programme" },
              { name: "nbCible", placeholder: "Nombre de cibles" },
              { name: "conception", placeholder: "Conception" },
              { name: "deploiement", placeholder: "Déploiement" },
              { name: "budgetPrevisionnel", placeholder: "Budget prévisionnel (Kdt)" },
              { name: "budgetReel", placeholder: "Budget réel (Kdt)" },
            ].map(({ name, placeholder }) => (
              <input
                key={name}
                name={name}
                placeholder={placeholder}
                value={formData[name]}
                onChange={handleChange}
                className="border p-2 rounded"
                type={name.includes("budget") || name === "nbCible" ? "number" : "text"}
                required={["intitule"].includes(name)}
              />
            ))}

            <div>
              <label htmlFor="dateDebut" className="block mb-1 font-medium">Date de début</label>
              <input
                id="dateDebut"
                name="dateDebut"
                value={formData.dateDebut}
                onChange={handleChange}
                className="border p-2 rounded w-full"
                type="date"
                required
              />
            </div>

            <div>
              <label htmlFor="dateFin" className="block mb-1 font-medium">Date de fin</label>
              <input
                id="dateFin"
                name="dateFin"
                value={formData.dateFin}
                onChange={handleChange}
                className="border p-2 rounded w-full"
                type="date"
                required
              />
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                {editMode ? "Modifier" : "Enregistrer"}
              </button>
              {editMode && (
                <button type="button" onClick={handleCancelEdit} className="btn-outline-primary">
                  Annuler
                </button>
              )}
            </div>
          </form>

          {message && (
            <p className={`mt-4 ${messageType === "success" ? "text-green-700" : "text-red-600"} font-medium`}>
              {message}
            </p>
          )}
        </>
      )}

      <h3 className="section-title">Liste des programmes</h3>
      <table className="w-full border border-gray-300 text-sm table-fixed">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Intitulé</th>
            <th className="border p-2">Cadre</th>
            <th className="border p-2">Date début</th>
            <th className="border p-2">Date fin</th>
            <th className="border p-2">Nb cibles</th>
            {!isReadOnly && <th className="border p-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {programmes.map((p) => (
            <tr key={p.id}>
              <td className="border p-2">{p.intitule}</td>
              <td className="border p-2">{p.cadre}</td>
              <td className="border p-2">{p.date_debut?.slice(0, 10)}</td>
              <td className="border p-2">{p.date_fin?.slice(0, 10)}</td>
              <td className="border p-2">{p.nb_cible}</td>
              {!isReadOnly && (
                <td className="border p-2 space-x-2">
                  <button className="btn-edit" onClick={() => handleEdit(p)}>Modifier</button>
                  <button className="btn-delete" onClick={() => handleDelete(p.id)}>Supprimer</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
