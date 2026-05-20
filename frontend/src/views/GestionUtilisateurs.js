// src/views/GestionUtilisateurs.js
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function GestionUtilisateurs() {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ email: "", password: "", role: "admin" });
  const [editUserId, setEditUserId] = useState(null);

  // Charger la liste des utilisateurs
  const fetchUsers = async () => {
    const res = await axios.get("http://localhost:5000/api/users");
    setUsers(res.data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Ajouter ou modifier un utilisateur
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUserId) {
        await axios.put(`http://localhost:5000/api/users/${editUserId}`, formData);
      } else {
        await axios.post("http://localhost:5000/api/users", formData);
      }
      fetchUsers();
      setFormData({ email: "", password: "", role: "admin" });
      setEditUserId(null);
    } catch (err) {
      console.error("Erreur soumission utilisateur:", err);
    }
  };

  // Préparer les données à modifier
  const handleEdit = (user) => {
    setFormData({ email: user.email, password: "", role: user.role, is_active: user.is_active });
    setEditUserId(user.id);
  };

  // Désactiver un utilisateur
  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:5000/api/users/${id}`);
    fetchUsers();
  };

  // Réinitialiser le mot de passe
  const handleResetPassword = async (id) => {
    await axios.post(`http://localhost:5000/api/users/${id}/reset-password`);
    alert("Mot de passe temporaire envoyé par email.");
  };

  return (
    <div className="container p-4">
      <h2 className="text-xl font-bold mb-4">Gestion des utilisateurs</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="border p-2 w-full"
        />

        {!editUserId && (
          <input
            type="password"
            placeholder="Mot de passe"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            className="border p-2 w-full"
          />
        )}

        <select
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          className="border p-2 w-full"
        >
          <option value="admin">Admin</option>
          <option value="dep_formation">Dep Formation</option>
          <option value="top_manager">Top Manager</option>
        </select>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          {editUserId ? "Modifier" : "Ajouter"}
        </button>
      </form>

      <hr className="my-6" />

      <table className="w-full border text-left">
        <thead>
          <tr>
            <th className="border px-2 py-1">Email</th>
            <th className="border px-2 py-1">Rôle</th>
            <th className="border px-2 py-1">Statut</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="border px-2 py-1">{user.email}</td>
              <td className="border px-2 py-1">{user.role}</td>
              <td className="border px-2 py-1">{user.is_active ? "Actif" : "Inactif"}</td>
              <td className="border px-2 py-1 space-x-2">
                <button onClick={() => handleEdit(user)} className="text-blue-600">✏️</button>
                <button onClick={() => handleDelete(user.id)} className="text-red-600">🗑️</button>
                <button onClick={() => handleResetPassword(user.id)} className="text-green-600">🔁</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
