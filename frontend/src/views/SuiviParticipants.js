import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Form, Alert } from 'react-bootstrap';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';
import './SuiviParticipants.css';

// ✅ Format exact sans décalage UTC → JJ/MM/AAAA
function formatDateExact(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date)) return '';
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  const isoString = localDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const [year, month, day] = isoString.split('-');
  return `${day}/${month}/${year}`; // → JJ/MM/AAAA
}

export default function SuiviParticipants() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole")?.trim();
  const isReadOnly = userRole === "top_manager";

  const [participants, setParticipants] = useState([]);
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedCuids, setSelectedCuids] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchParticipants();
    fetchCollaborateurs();
    fetchSessions();
  }, []);

  const fetchParticipants = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/participations/details`);
      setParticipants(res.data);
    } catch (err) {
      console.error('Erreur chargement participants:', err);
    }
  };

  const fetchCollaborateurs = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/collaborateurs/actifs');
      setCollaborateurs(res.data);
    } catch (err) {
      console.error('Erreur chargement collaborateurs:', err);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/sessions/filtre');
      setSessions(res.data);
      console.log("Sessions récupérées :", res.data);
      console.log("Exemple de session :", res.data[0]);
    } catch (err) {
      console.error('Erreur chargement sessions:', err);
    }
  };

  const handleEtatChange = (index, newEtat) => {
    const updated = [...participants];
    updated[index].statut_participation = newEtat;
    setParticipants(updated);
  };

  const handleSave = async () => {
    try {
      await axios.put(`http://localhost:5000/api/participations/update-multiple`, { participants });
      setMessage('✅ Modifications enregistrées');
    } catch (err) {
      console.error(err);
      setMessage('❌ Erreur lors de la sauvegarde');
    }
  };

const handleAdd = async () => {
  if (!selectedSession || selectedCuids.length === 0) return;

  try {
    const promises = selectedCuids.map(cuid =>
      axios.post(`http://localhost:5000/api/participations`, {
        session_id: selectedSession.value,
        cuid: cuid.value,
      })
    );

    await Promise.all(promises);
    setSelectedCuids([]);
    setSelectedSession(null);
    fetchParticipants();
  } catch (err) {
    console.error(err);
    alert("Erreur lors de l'ajout des participants.");
  }
};


  const handleDisable = async (sessionId, cuid) => {
    if (!window.confirm('Confirmer la désactivation de cette participation ?')) return;
    try {
      await axios.put(`http://localhost:5000/api/participations/${sessionId}/${cuid}/disable`);
      fetchParticipants();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredParticipants = participants.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.nom?.toLowerCase().includes(term) ||
      p.prenom?.toLowerCase().includes(term) ||
      p.intitule_formation?.toLowerCase().includes(term) ||
      p.statut_participation?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="section-card fade-in">
      <h5>👥 Liste globale des participations</h5>

      {message && <Alert variant="info">{message}</Alert>}

      <Form.Control
        type="text"
        placeholder="🔍 Rechercher par nom, formation ou statut..."
        className="mb-3"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {!isReadOnly && (
        <div className="ajout-section">
        <Select
  placeholder="👤 Sélectionner un ou plusieurs collaborateurs"
  options={collaborateurs.map(c => ({
    value: c.cuid,
    label: `${c.cuid} - ${c.nom} ${c.prenom}`
  }))}
  value={selectedCuids}
  onChange={setSelectedCuids}
  isMulti
  className="flex-grow-1"
/>
          <Select
            placeholder="📅 Sélectionner une session"
            options={sessions.map(s => ({
              value: s.session_id,
              label: `${formatDateExact(s.date_realisation)} - ${s.intitule_formation}`

            }))}
            value={sessions.map(s => ({
              value: s.session_id,
              label: `${formatDateExact(s.date_realisation)} - ${s.intitule_formation}`
            })).find(opt => opt.value === selectedSession?.value) || null}
            onChange={setSelectedSession}
            className="flex-grow-1"
          />
         <Button
  className="btn-ajouter"
  onClick={handleAdd}
  disabled={selectedCuids.length === 0 || !selectedSession}
>
  ➕ Ajouter
</Button>

        </div>
      )}

      <Table striped bordered hover responsive size="sm" className="table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>CUID</th>
            <th>Formation</th>
            <th>Date</th>
            <th>Statut</th>
            {!isReadOnly && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filteredParticipants.map((p, i) => (
            <tr key={p.cuid + p.session_id}>
              <td>{p.nom} {p.prenom}</td>
              <td>{p.cuid}</td>
              <td>{p.intitule_formation}</td>
              <td>{formatDateExact(p.date_realisation)}</td>
              <td>
                <Form.Select
                  value={p.statut_participation}
                  onChange={(e) => handleEtatChange(i, e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="prévu">Prévu</option>
                  <option value="présent">Présent</option>
                  <option value="absent">Absent</option>
                </Form.Select>
              </td>
              {!isReadOnly && (
                <td>
                  <Button size="sm" variant="danger" onClick={() => handleDisable(p.session_id, p.cuid)}>
                    Supprimer
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>

      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={() => navigate(-1)}>Retour</Button>
        {!isReadOnly && (
          <Button variant="success" onClick={handleSave}>Enregistrer</Button>
        )}
      </div>
    </div>
  );
}
