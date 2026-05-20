import React, { useEffect, useState } from "react";

export default function HistoriqueModifications() {
  const [modifs, setModifs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/historique")
      .then(res => res.json())
      .then(data => {
        setModifs(data);
        setFiltered(data);
      })
      .catch(err => console.error("Erreur :", err));
  }, []);

  useEffect(() => {
    let results = modifs;

    if (search.trim() !== "") {
      results = results.filter(
        (m) =>
          m.cuid?.toLowerCase().includes(search.toLowerCase()) ||
          `${m.nom ?? ""} ${m.prenom ?? ""}`.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (typeFilter !== "all") {
      results = results.filter((m) => m.type_operation === typeFilter);
    }

    if (dateFilter !== "") {
      results = results.filter((m) => m.date_operation.startsWith(dateFilter));
    }

    setFiltered(results);
  }, [search, typeFilter, dateFilter, modifs]);



  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6 text-orange-600">📜 Historique des modifications</h2>

      {/* 🔍 Filtres */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="🔍 Recherche (nom ou CUID)"
          className="p-2 border rounded w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="all">📂 Tous les types</option>
          <option value="ajout">✅ Ajout</option>
          <option value="modification">✏️ Modification</option>
          <option value="suppression">❌ Suppression</option>
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="p-2 border rounded"
        />
      </div>

      {/* 🧾 Tableau */}
      <div className="overflow-x-auto rounded-lg border shadow-sm bg-white">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 border-b">CUID</th>
              <th className="px-4 py-3 border-b">Nom</th>
              <th className="px-4 py-3 border-b">Date</th>
              <th className="px-4 py-3 border-b">Type</th>
              <th className="px-4 py-3 border-b">Champs</th>
              <th className="px-4 py-3 border-b">Avant</th>
              <th className="px-4 py-3 border-b">Après</th>
             
            </tr>
          </thead>
     <tbody>
  {filtered.map((m, i) => (
    <tr
      key={i}
      className={`border-b hover:bg-gray-50 ${
        m.type_operation === "suppression" ? "bg-red-100 text-red-800 font-semibold" : ""
      }`}
    >
      <td className="px-4 py-2 border">{m.cuid}</td>
      <td className="px-4 py-2 border">{m.nom} {m.prenom}</td>
      <td className="px-4 py-2 border">{m.date_operation?.slice(0, 10)}</td>
      <td className={`px-4 py-2 border text-xs font-semibold
        ${m.type_operation === "suppression" ? "text-red-600" : ""}
      `}>
        {m.type_operation}
      </td>
      <td className="px-4 py-2 border text-sm">{m.champs_modifies}</td>
      <td className="px-4 py-2 border">
        <pre className="bg-gray-100 text-xs p-2 rounded max-w-xs overflow-auto">
          {JSON.stringify(m.donnees_avant, null, 2)}
        </pre>
      </td>
      <td className="px-4 py-2 border">
        <pre className="bg-gray-100 text-xs p-2 rounded max-w-xs overflow-auto">
          {JSON.stringify(m.donnees_apres, null, 2)}
        </pre>
      </td>
      
    </tr>
  ))}
  {filtered.length === 0 && (
    <tr>
      <td colSpan="8" className="text-center text-gray-500 p-4 border">
        Aucun résultat trouvé.
      </td>
    </tr>
  )}
</tbody>

        </table>
      </div>
    </div>
  );
}
