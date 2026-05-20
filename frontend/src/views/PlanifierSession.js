import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Container, Modal, Row, Col } from 'react-bootstrap'; 
import './PlanifierSession.css';
import Select from 'react-select';
const isReadOnly = localStorage.getItem("userRole")?.trim() === "top_manager";

function formatToInputDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date)) return '';
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().split('T')[0];
}


function PlanifierSession() {
  

const handleDeleteSession = async (sessionId) => {
  if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette session ?")) return;

  try {
    await axios.delete(`http://localhost:5000/api/sessions/${sessionId}`);
    alert("✅ Session supprimée avec succès");
    setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
  } catch (error) {
    console.error("❌ Erreur lors de la suppression :", error);

    if (error.response?.data?.error) {
      alert(error.response.data.error); // Affiche le message spécifique du backend
    } else {
      alert("❌ Une erreur inconnue est survenue.");
    }
  }
};
const [editingSession, setEditingSession] = useState(null); 
const [showEditModal, setShowEditModal] = useState(false);   

const handleEditSession = (session) => {
  setEditingSession({
    ...session,
    participants: session.participants || [],
    nb_participants_prevu: (session.participants || []).length,
  });
  setShowEditModal(true);
};


const handleSaveEdit = async () => {
  try {
    await axios.put(`http://localhost:5000/api/sessions/${editingSession.session_id}`, editingSession);
    alert("✅ Session mise à jour !");
    setShowEditModal(false);

    // Remplace la session modifiée dans le tableau
    setSessions((prev) =>
      prev.map((s) => (s.session_id === editingSession.session_id ? editingSession : s))
    );
  } catch (error) {
    console.error("❌ Erreur mise à jour session :", error);
    alert(error.response?.data?.error || "Erreur lors de la mise à jour.");
  }
};

  const [formations, setFormations] = useState([]);
  const [prestataires, setPrestataires] = useState([]);
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [sessions, setSessions] = useState([]);
const [filtreFormation, setFiltreFormation] = useState(null);
const [participants, setParticipants] = useState([]);
const [selectedSession, setSelectedSession] = useState(null);
const [showParticipantsModal, setShowParticipantsModal] = useState(false);
const [dateFilter, setDateFilter] = useState('');
  const [session, setSession] = useState({
    formation_id: null,
    date_realisation: '',
    formateur_cuid: '',
    prestataire_id: null,
    nb_participants_prevu: '',
    local: '',
    pauses: '',
    participants: [], // 👈 ajout
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resFormations, resPrestataires, resCollabs] = await Promise.all([
          axios.get('http://localhost:5000/api/formations'),
          axios.get('http://localhost:5000/api/prestataires'),
          axios.get('http://localhost:5000/api/collaborateurs/actifs'),
        ]);
        setFormations(resFormations.data);
        setPrestataires(resPrestataires.data);
        setCollaborateurs(resCollabs.data);
      } catch (error) {
        console.error('❌ Erreur chargement données:', error);
      }
    };
    fetchData();
  }, []);

useEffect(() => {
  const fetchSessions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/sessions/filtre', {
        params: {
          formation_id: filtreFormation || undefined,
          date: dateFilter || undefined, // 🔁 ici c'était filtreDate -> corrigé
        },
      });
      setSessions(res.data);
    } catch (error) {
      console.error('❌ Erreur chargement sessions:', error);
    }
  };

  fetchSessions();
}, [filtreFormation, dateFilter]); // 🔁 ici aussi, cohérence




  const handleChange = (e) => {
    const { name, value } = e.target;
    setSession((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (selected, field) => {
    setSession((prev) => ({
      ...prev,
      [field]: selected ? selected.value : null,
    }));
  };

const handleParticipantsChange = (selectedOptions) => {
  const updatedParticipants = selectedOptions ? selectedOptions.map((opt) => opt.value) : [];

  setSession((prev) => ({
    ...prev,
    participants: updatedParticipants,
    nb_participants_prevu: updatedParticipants.length, // 🔁 compteur dynamique
  }));
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/sessions', session);
      alert('✅ Session planifiée avec succès');
      setSession({
        formation_id: null,
        date_realisation: '',
        formateur_cuid: '',
        prestataire_id: null,
        nb_participants_prevu: '',
        local: '',
        pauses: '',
        participants: [],
      });
    } catch (error) {
  console.error('❌ Erreur lors de la planification :', error);
  
  // 🔽 S’il y a un message d’erreur clair venant du backend, on l’affiche
  if (error.response && error.response.data && error.response.data.error) {
    alert("❌ " + error.response.data.error);
  } else {
    alert("❌ Erreur inconnue lors de la planification.");
  }
}

  };

 const handleViewParticipants = async (sessionId) => {
  try {
    const res = await axios.get(`http://localhost:5000/api/participations/session/${sessionId}`);
    setParticipants(res.data);
    setSelectedSession(sessionId);
    setShowParticipantsModal(true);
  } catch (error) {
    console.error("❌ Erreur chargement participants :", error);
  }
};


const handleEtatChange = (index, newEtat) => {
  const updated = [...participants];
  updated[index].statut_participation = newEtat;
  setParticipants(updated);
};

const handleSaveParticipants = async () => {
  try {
  console.log("🔁 Envoi des participants :", participants);
console.log("🆔 Session cible :", selectedSession);
 await axios.put(
  `http://localhost:5000/api/participations/session/${selectedSession}`,
  { participants }
);

    alert("✅ État des participants mis à jour");
    setShowParticipantsModal(false);
  } catch (err) {
    console.error("❌ Erreur mise à jour :", err);
    alert("❌ Erreur lors de la mise à jour des participants.");
  }
};


const sessionsFiltrees = sessions.filter((s) => {
  const matchFormation = !filtreFormation || s.formation_id === filtreFormation;
  const matchDate = !dateFilter || s.date_realisation?.startsWith(dateFilter);
  return matchFormation && matchDate;
});



  return (
    <Container className="mt-4">
      {!isReadOnly && (
   <div className="section-card">
  <h3 className="section-title">📅 Planifier une session de formation</h3>
  <Form onSubmit={handleSubmit}>
    <Row>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Formation *</Form.Label>
          <Select
            options={formations.map(f => ({ value: f.id, label: f.intitule }))}
            value={
              formations.find(f => f.id === session.formation_id)
                ? {
                    value: session.formation_id,
                    label: formations.find(f => f.id === session.formation_id).intitule,
                  }
                : null
            }
            onChange={(selected) => handleSelectChange(selected, 'formation_id')}
            placeholder="Rechercher une formation..."
            isClearable
          />
        </Form.Group>
      </Col>

      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Date de réalisation *</Form.Label>
          <Form.Control
            type="date"
            name="date_realisation"
            value={session.date_realisation}
            onChange={handleChange}
            required
          />
        </Form.Group>
      </Col>
    </Row>

    <Row>
      <Col md={6}>
<Form.Group className="mb-3">
  <Form.Label>Formateur</Form.Label>
  <Select
    options={collaborateurs.map(c => ({
      value: c.cuid,
      label: `${c.nom} ${c.prenom}`,
    }))}
    value={
      collaborateurs.find(c => c.cuid === session.formateur_cuid)
        ? {
            value: session.formateur_cuid,
            label: `${collaborateurs.find(c => c.cuid === session.formateur_cuid).nom} ${collaborateurs.find(c => c.cuid === session.formateur_cuid).prenom}`
          }
        : null
    }
    onChange={(selected) => handleSelectChange(selected, 'formateur_cuid')}
    placeholder="Choisir un formateur"
    isClearable
  />
</Form.Group>

      </Col>

      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Prestataire</Form.Label>
          <Select
            options={prestataires.map(p => ({ value: p.id, label: p.nom }))}
            value={
              prestataires.find(p => p.id === session.prestataire_id)
                ? {
                    value: session.prestataire_id,
                    label: prestataires.find(p => p.id === session.prestataire_id).nom,
                  }
                : null
            }
            onChange={(selected) => handleSelectChange(selected, 'prestataire_id')}
            placeholder="Choisir un prestataire"
            isClearable
          />
        </Form.Group>
      </Col>
    </Row>

 <Form.Group className="mb-3">
  <Form.Label>Participants (Collaborateurs)</Form.Label>
  <Select
    isMulti
    options={collaborateurs.map(c => ({
      value: c.cuid,
      label: `${c.cuid} - ${c.nom} ${c.prenom}`,
    }))}
    value={collaborateurs
      .filter(c => session.participants.includes(c.cuid))
      .map(c => ({
        value: c.cuid,
        label: `${c.cuid} - ${c.nom} ${c.prenom}`,
      }))}
    onChange={handleParticipantsChange}
    placeholder="Ajouter des participants..."
  />
 <div style={{
  marginTop: '6px',
  fontSize: '0.9rem',
  color: '#856404',
  backgroundColor: '#fff3cd',
  padding: '4px 10px',
  borderRadius: '5px',
  display: 'inline-block'
}}>
  👥 <strong>{session.nb_participants_prevu || 0}</strong> participant(s) prévu(s)
</div>
</Form.Group> 



    <Row>
      <Col md={4}>
        <Form.Group className="mb-3">
          <Form.Label>Local</Form.Label>
          <Form.Control
            type="text"
            name="local"
            value={session.local}
            onChange={handleChange}
          />
        </Form.Group>
      </Col>
      <Col md={4}>
        <Form.Group className="mb-3">
          <Form.Label>Pauses</Form.Label>
          <Form.Control
            type="text"
            name="pauses"
            value={session.pauses}
            onChange={handleChange}
          />
        </Form.Group>
      </Col>
    </Row>

    <div className="text-end">
      <Button variant="primary" type="submit">
        ➕ Planifier
      </Button>
    </div>
  </Form>
</div>
  )}


 <div className="section-card">
  <h4 className="section-title">🔍 Filtres des sessions</h4>
  <Form className="d-flex gap-4 align-items-end flex-wrap">
    <Form.Group className="me-3">
      <Form.Label>Formation</Form.Label>
      <Select
        options={formations.map(f => ({ value: f.id, label: f.intitule }))}
        value={
          formations.find(f => f.id === filtreFormation)
            ? {
                value: filtreFormation,
                label: formations.find(f => f.id === filtreFormation).intitule,
              }
            : null
        }
        onChange={(selected) => setFiltreFormation(selected ? selected.value : null)}
        isClearable
        placeholder="Filtrer par formation"
      />
    </Form.Group>

    <Form.Group>
      <Form.Label>Date</Form.Label>
      <Form.Control
        type="date"
        value={dateFilter}
        onChange={(e) => setDateFilter(e.target.value)}
      />
    </Form.Group>
  </Form>
</div>



<div className="section-card mt-4">
  <h5 className="section-title">📄 Tableau des sessions</h5>

  {sessionsFiltrees.length === 0 ? (
    <p className="text-gray-500 mt-2">Aucune session enregistrée.</p>
  ) : (
    <div className="overflow-auto">
      <table className="table table-bordered text-sm text-left">
        <thead className="bg-gray-100 text-gray-700 font-semibold">
          <tr>
          
            <th className="border px-3 py-2">Date</th>
            <th className="border px-3 py-2">Formation</th>
            <th className="border px-3 py-2">Formateur</th>
            <th className="border px-3 py-2">Participants prévus</th>
            <th className="border px-3 py-2">Local</th>
            <th className="border px-3 py-2">Prestataire</th>
            <th className="border px-3 py-2">Pauses</th>
            <th className="border px-3 py-2">Actions</th>
          </tr>
        </thead>
 <tbody>
  {sessionsFiltrees.map((s) => {
    const sessionDate = new Date(s.date_realisation);
    const today = new Date();

    // Comparaison sur les dates sans l'heure
    const sessionDay = new Date(sessionDate.setHours(0, 0, 0, 0));
    const todayDay = new Date(today.setHours(0, 0, 0, 0));

let rowClass = '';
if (sessionDay < todayDay) {
  rowClass = 'table-danger'; // rouge (passée)
} else if (sessionDay.getTime() === todayDay.getTime()) {
  rowClass = 'table-warning'; // jaune (aujourd'hui)
} else {
  rowClass = 'table-success'; // vert (future)
}


    return (
    <tr key={s.session_id} className={rowClass}>
        <td className="border px-3 py-2">
          {new Date(s.date_realisation).toLocaleDateString()}
        </td>
        <td className="border px-3 py-2">
          {s.formation_intitule || formations.find(f => f.id === s.formation_id)?.intitule || 'Formation inconnue'}
        </td>
        <td className="border px-3 py-2">{s.formateur_nom_complet || '-'}</td>
        <td className="border px-3 py-2">{s.nb_participants_prevu || 0}</td>
        <td className="border px-3 py-2">{s.local || '-'}</td>
        <td className="border px-3 py-2">{s.nom_prestataire || '-'}</td>
        <td className="border px-3 py-2">{s.pauses || '-'}</td>
        <td className="border px-3 py-2">
         <div className="d-flex flex-wrap gap-2 justify-content-start">
<button onClick={() => handleViewParticipants(s.session_id)} className="btn-view">
  👁️ Voir les participants
</button>
{!isReadOnly && (
  <>
    <button onClick={() => handleEditSession(s)} className="btn-edit">✏️</button>
    <button onClick={() => handleDeleteSession(s.session_id)} className="btn-delete">🗑️</button>
  </>
)}

          </div>
        </td>
      </tr>
    );
  })}
</tbody>


      </table>
    </div>
  )}
</div>


<Modal
  show={showParticipantsModal}
  onHide={() => setShowParticipantsModal(false)}
  centered
>
  <Modal.Header closeButton>
    <Modal.Title>👥 Participants de la session</Modal.Title>
  </Modal.Header>
  <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
    {participants.length > 0 ? (
      <ul className="list-group">
        {participants.map((p, idx) => (
          <li
            key={p.cuid}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <div>{p.nom} {p.prenom} ({p.cuid})</div>
            <select
              className="form-select form-select-sm"
              value={p.statut_participation}
              onChange={(e) => handleEtatChange(idx, e.target.value)}
            >
              <option value="prévu">Prévu</option>
              <option value="présent">Présent</option>
              <option value="absent">Absent</option>
            </select>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-muted">Aucun participant trouvé.</p>
    )}
  </Modal.Body>
  <Modal.Footer>
    <Button
      variant="secondary"
      onClick={() => setShowParticipantsModal(false)}
    >
      Fermer
    </Button>
    <Button
      variant="primary"
      onClick={handleSaveParticipants}
    >
      Enregistrer
    </Button>
  </Modal.Footer>
</Modal>


<Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
  <Modal.Header closeButton>
    <Modal.Title>✏️ Modifier la session</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {editingSession && (
      <Form>
        {/* Date de réalisation */}
        <Form.Group className="mb-3">
          <Form.Label>Date de réalisation *</Form.Label>
         <Form.Control
  type="date"
  value={formatToInputDate(editingSession.date_realisation)}
  onChange={(e) =>
    setEditingSession({ ...editingSession, date_realisation: e.target.value })
  }
/>
        </Form.Group>

        {/* Formation */}
        <Form.Group className="mb-3">
          <Form.Label>Formation *</Form.Label>
          <Select
            options={formations.map(f => ({ value: f.id, label: f.intitule }))}
            value={
              formations.find(f => f.id === editingSession.formation_id)
                ? {
                    value: editingSession.formation_id,
                    label: formations.find(f => f.id === editingSession.formation_id).intitule,
                  }
                : null
            }
            onChange={(selected) =>
              setEditingSession({ ...editingSession, formation_id: selected?.value || null })
            }
            placeholder="Sélectionner une formation"
            isClearable
          />
        </Form.Group>

        {/* Formateur */}
    <Form.Group className="mb-3">
  <Form.Label>Formateur</Form.Label>
  <Select
    options={collaborateurs.map(c => ({
      value: c.cuid,
      label: `${c.nom} ${c.prenom}`,
    }))}
    value={
      collaborateurs.find(c => c.cuid === editingSession.formateur_cuid)
        ? {
            value: editingSession.formateur_cuid,
            label: `${collaborateurs.find(c => c.cuid === editingSession.formateur_cuid).nom} ${collaborateurs.find(c => c.cuid === editingSession.formateur_cuid).prenom}`
          }
        : null
    }
    onChange={(selected) =>
      setEditingSession({ ...editingSession, formateur_cuid: selected ? selected.value : null })
    }
    placeholder="Choisir un formateur"
    isClearable
  />
</Form.Group>

        {/* Prestataire */}
        <Form.Group className="mb-3">
          <Form.Label>Prestataire</Form.Label>
          <Select
            options={prestataires.map(p => ({ value: p.id, label: p.nom }))}
            value={
              prestataires.find(p => p.id === editingSession.prestataire_id)
                ? {
                    value: editingSession.prestataire_id,
                    label: prestataires.find(p => p.id === editingSession.prestataire_id).nom,
                  }
                : null
            }
            onChange={(selected) =>
              setEditingSession({ ...editingSession, prestataire_id: selected?.value || null })
            }
            placeholder="Sélectionner un prestataire"
            isClearable
          />
        </Form.Group>

        {/* Local */}
        <Form.Group className="mb-3">
          <Form.Label>Local</Form.Label>
          <Form.Control
            type="text"
            value={editingSession.local || ''}
            onChange={(e) =>
              setEditingSession({ ...editingSession, local: e.target.value })
            }
          />
        </Form.Group>

        {/* Pauses */}
        <Form.Group className="mb-3">
          <Form.Label>Pauses</Form.Label>
          <Form.Control
            type="text"
            value={editingSession.pauses || ''}
            onChange={(e) =>
              setEditingSession({ ...editingSession, pauses: e.target.value })
            }
          />
        </Form.Group>

        {/* Compteur automatique */}
  
      </Form>
    )}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowEditModal(false)}>
      Annuler
    </Button>
    <Button variant="primary" onClick={handleSaveEdit}>
      Enregistrer
    </Button>
  </Modal.Footer>
</Modal>


    </Container>
  );
}

export default PlanifierSession;
