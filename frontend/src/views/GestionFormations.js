// ... imports
import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { Modal, Form, Button } from 'react-bootstrap';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './GestionFormations.css';

const isReadOnly = localStorage.getItem("userRole") === "top_manager";



function formatToInputDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  // Corriger le décalage de fuseau horaire
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().split('T')[0];
}



function GestionFormations() {
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [formationActiveId, setFormationActiveId] = useState(null);
  const [participantsBySession, setParticipantsBySession] = useState({});

const [modalites, setModalites] = useState([]);
const [modesFormation, setModesFormation] = useState([]);
const [modesFinancement, setModesFinancement] = useState([]);

const fetchReferentiels = async () => {
  try {
    const [modalitesRes, modesRes, financementRes] = await Promise.all([
      axios.get("http://localhost:5000/api/formations/referentiels/modalites-apprentissage"),
      axios.get("http://localhost:5000/api/formations/referentiels/modes-formation"),
      axios.get("http://localhost:5000/api/formations/referentiels/modes-financement")
    ]);
    setModalites(modalitesRes.data);
    setModesFormation(modesRes.data);
    setModesFinancement(financementRes.data);
  } catch (error) {
    console.error("Erreur chargement des référentiels :", error);
  }
};


  const [showEditModal, setShowEditModal] = useState(false);
  const [currentFormation, setCurrentFormation] = useState({
    id: null,
    intitule: '',
    modalite_apprentissage: '',
    type_formation: '',
    mode_formation: '',
    certification: false,
  });

  const [showAddModal, setShowAddModal] = useState(false);
const [newFormation, setNewFormation] = useState({
 intitule: '',
  programme_id: null,
  modalite_apprentissage: '',
  type_formation: '',
  mode_formation: '',
  certification: false,
  mode_financement: '',
  tfp: false,
  materiel_requis: '',
});


  // 🔵 Session
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [currentSession, setCurrentSession] = useState({
    session_id: null,
    date_realisation: '',
    nb_participants_prevu: '',
    local: '',
    pauses: '',
    formateur_cuid: '',
  });

  const handleEditClick = (formation) => {
    setCurrentFormation({ ...formation });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentFormation((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDisableFormation = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette formation ?")) return;
    try {
      await axios.put(`http://localhost:5000/api/formations/disable/${id}`);
      alert("❌ Formation supprimée avec succès.");
      fetchFormations();
    } catch (error) {
      console.error("Erreur suppression :", error);
      alert("Erreur lors de la suppression.");
    }
  };

  const submitEditFormation = async () => {
    try {
      await axios.put(`http://localhost:5000/api/formations/${currentFormation.id}`, currentFormation);
      alert("✅ Formation modifiée avec succès.");
      setShowEditModal(false);
      fetchFormations();
    } catch (err) {
      console.error("❌ Erreur modification :", err);
      alert("Erreur lors de la modification.");
    }
  };

  const submitAddFormation = async () => {
  try {
    await axios.post('http://localhost:5000/api/formations', newFormation);
    alert("✅ Formation ajoutée avec succès.");
    setShowAddModal(false);
    setNewFormation({
      intitule: '',
      modalite_apprentissage: '',
      type_formation: '',
      mode_formation: '',
      certification: false,
    });
    fetchFormations();
  } catch (err) {
    console.error("❌ Erreur ajout formation :", err);
    alert("Erreur lors de l'ajout.");
  }
};


  const fetchFormations = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/formations');
      setFormations(res.data);
    } catch (error) {
      console.error('Erreur chargement formations', error);
    } finally {
      setLoading(false);
    }
  };
const fetchProgrammes = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/programmes");
    setProgrammes(res.data);
  } catch (error) {
    console.error("Erreur chargement programmes :", error);
  }
};

const [formateurs, setFormateurs] = useState([]);

useEffect(() => {
  axios.get('http://localhost:5000/api/collaborateurs/actifs')
    .then(res => setFormateurs(res.data))
    .catch(err => console.error('Erreur chargement formateurs', err));
}, []);

const formateurOptions = formateurs.map(f => ({
  value: f.cuid,
  label: `${f.nom} ${f.prenom}`
}));

  useEffect(() => {
    fetchFormations();
    fetchProgrammes();
    fetchReferentiels();
  }, []);

  const loadParticipants = async (sessionId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/formations/sessions/${sessionId}/participants`);
      setParticipantsBySession((prev) => ({
        ...prev,
        [sessionId]: res.data,
      }));
    } catch (error) {
      console.error("Erreur chargement participants :", error);
    }
  };

  const fetchSessions = async (formationId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/formations/${formationId}/sessions`);
      setSessions(res.data);
      setFormationActiveId(formationId);

      for (const session of res.data) {
        await loadParticipants(session.session_id);
      }
    } catch (error) {
      console.error("Erreur récupération sessions :", error);
    }
  };

  const handleToggleSessions = async (formationId) => {
  if (formationActiveId === formationId) {
    setFormationActiveId(null); // on cache
  } else {
    await fetchSessions(formationId); // on charge
    setFormationActiveId(formationId); // on affiche
  }
};


const openEditSession = (session) => {
 
  setCurrentSession({
    ...session,
    date_realisation: formatToInputDate(session.date_realisation),
   
  });

  setShowSessionModal(true);
};
  const handleSessionChange = (e) => {
    const { name, value } = e.target;
    setCurrentSession((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitEditSession = async () => {
    try {
      await axios.put(`http://localhost:5000/api/sessions/${currentSession.session_id}`, currentSession);
      alert("✅ Session modifiée avec succès.");
      setShowSessionModal(false);
      fetchSessions(formationActiveId);
    } catch (err) {
      console.error("❌ Erreur modification session :", err);
      alert("Erreur lors de la modification.");
    }
  };

  const deleteSession = async (session_id) => {
    if (!window.confirm("Supprimer cette session ?")) return;
    try {
      await axios.put(`http://localhost:5000/api/sessions/disable/${session_id}`);
      alert("🗑️ Session supprimée (désactivée).");
      fetchSessions(formationActiveId);
    } catch (error) {
      console.error("Erreur suppression session :", error);
      alert("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="p-4">
     {!isReadOnly && (
  <Button variant="success" className="mb-3" onClick={() => setShowAddModal(true)}>
    ➕ Ajouter une formation
  </Button>
)}
{/* 🟩 Modal d’ajout de formation */}
<Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
  <Modal.Header closeButton>
    <Modal.Title>Ajouter une formation</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Form>
      <Form.Group className="mb-2">
        <Form.Label>Intitulé</Form.Label>
        <Form.Control
          name="intitule"
          value={newFormation.intitule}
          onChange={(e) =>
            setNewFormation({ ...newFormation, intitule: e.target.value })
          }
        />
      </Form.Group>

      <Form.Group className="mb-2">
        <Form.Label>Modalité d’apprentissage</Form.Label>
        <Form.Select
          name="modalite_apprentissage_id"
          value={newFormation.modalite_apprentissage_id || ''}
          onChange={(e) =>
            setNewFormation({ ...newFormation, modalite_apprentissage_id: parseInt(e.target.value) || null })
          }
        >
          <option value="">-- Sélectionner une modalité --</option>
          {modalites.map((m) => (
            <option key={m.id} value={m.id}>{m.libelle}</option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-2">
        <Form.Label>Mode de formation</Form.Label>
        <Form.Select
          name="mode_formation_id"
          value={newFormation.mode_formation_id || ''}
          onChange={(e) =>
            setNewFormation({ ...newFormation, mode_formation_id: parseInt(e.target.value) || null })
          }
        >
          <option value="">-- Sélectionner un mode --</option>
          {modesFormation.map((m) => (
            <option key={m.id} value={m.id}>{m.libelle}</option>
          ))}
        </Form.Select>
      </Form.Group>

 <Form.Group className="mb-2">
  <Form.Label>Certification</Form.Label>
  <Form.Select
    name="certification"
    value={newFormation.certification ? 'true' : 'false'}
    onChange={(e) =>
      setNewFormation({
        ...newFormation,
        certification: e.target.value === 'true',
      })
    }
  >
    <option value="true">Oui</option>
    <option value="false">Non</option>
  </Form.Select>
</Form.Group>


      <Form.Group className="mb-2">
        <Form.Label>Mode de financement</Form.Label>
        <Form.Select
          name="mode_financement_id"
          value={newFormation.mode_financement_id || ''}
          onChange={(e) =>
            setNewFormation({ ...newFormation, mode_financement_id: parseInt(e.target.value) || null })
          }
        >
          <option value="">-- Sélectionner un mode de financement --</option>
          {modesFinancement.map((m) => (
            <option key={m.id} value={m.id}>{m.libelle}</option>
          ))}
        </Form.Select>
      </Form.Group>

  <Form.Group className="mb-2">
  <Form.Label>TFP</Form.Label>
  <Form.Select
    name="tfp"
    value={newFormation.tfp ? 'true' : 'false'}
    onChange={(e) =>
      setNewFormation({
        ...newFormation,
        tfp: e.target.value === 'true',
      })
    }
  >
    <option value="true">Oui</option>
    <option value="false">Non</option>
  </Form.Select>
</Form.Group>

      <Form.Group className="mb-2">
        <Form.Label>Matériel requis</Form.Label>
        <Form.Control
          name="materiel_requis"
          value={newFormation.materiel_requis || ''}
          onChange={(e) =>
            setNewFormation({ ...newFormation, materiel_requis: e.target.value })
          }
        />
      </Form.Group>

<Form.Group className="mb-2">
  <Form.Label>Programme</Form.Label>
  <Select
    options={programmes.map((p) => ({
      value: p.id,
      label: p.intitule
    }))}
    value={
      programmes
        .map((p) => ({ value: p.id, label: p.intitule }))
        .find((option) => option.value === newFormation.programme_id) || null
    }
    onChange={(selectedOption) =>
      setNewFormation({
        ...newFormation,
        programme_id: selectedOption ? selectedOption.value : null,
      })
    }
    isClearable
    placeholder="-- Sélectionnez un programme --"
  />
</Form.Group>

    </Form>
  </Modal.Body>

  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowAddModal(false)}>
      Annuler
    </Button>
    <Button
      variant="primary"
      onClick={async () => {
        try {
          await axios.post("http://localhost:5000/api/formations", newFormation);
          alert("✅ Formation ajoutée avec succès.");
          setShowAddModal(false);
          setNewFormation({
            intitule: "",
            programme_id: null,
            modalite_apprentissage_id: null,
            type_formation: "",
            mode_formation_id: null,
            certification: false,
            mode_financement_id: null,
            tfp: false,
            materiel_requis: "",
          });
          fetchFormations();
        } catch (err) {
          console.error("Erreur ajout formation :", err);
          alert("L'intitulet de cette formation est déjà existant.");
        }
      }}
    >
      Enregistrer
    </Button>
  </Modal.Footer>
</Modal>
<h2 className="section-title">Gestion des Formations</h2>
{loading ? (
  <p>Chargement...</p>
) : (
  <div className="overflow-x-auto">
  <table className="w-full table-auto border">
    <thead>
      <tr className="bg-gray-100">
        <th className="px-4 py-2">Intitulé</th>
        <th className="px-4 py-2">Programme</th>
        <th className="px-4 py-2">Modalité</th>
        <th className="px-4 py-2">Mode</th>
        <th className="px-4 py-2">Financement</th>
        <th className="px-4 py-2">Certification</th>
        <th className="px-4 py-2">TFP</th>
        <th className="px-4 py-2">Matériel requis</th>
        <th className="px-4 py-2">Actions</th>
      </tr>
    </thead>
    <tbody>
      {formations.map((f) => (
        <React.Fragment key={f.id}>
          <tr>
            <td className="border px-4 py-2">{f.intitule}</td>
            <td className="border px-4 py-2">{f.programme_nom || '-'}</td>
            <td className="border px-4 py-2">{f.modalite_apprentissage || '-'}</td>
            <td className="border px-4 py-2">{f.mode_formation || '-'}</td>
            <td className="border px-4 py-2">{f.mode_financement || '-'}</td>
            <td className="border px-4 py-2">{f.certification ? 'Oui' : 'Non'}</td>
            <td className="border px-4 py-2">{f.tfp ? 'Oui' : 'Non'}</td>
            <td className="border px-4 py-2">{f.materiel_requis || '-'}</td>
       <td className="border px-4 py-2 flex gap-2">
  <button onClick={() => handleToggleSessions(f.id)} className="btn-view">
    {formationActiveId === f.id ? "Masquer Sessions" : "👁️ Voir Sessions"}
  </button>
  {!isReadOnly && (
    <>
      <button onClick={() => handleEditClick(f)} className="btn-edit">✏️</button>
      <button onClick={() => handleDisableFormation(f.id)} className="btn-delete">🗑️</button>
    </>
  )}
</td>

          </tr>

          {formationActiveId === f.id && (
            <tr>
              <td colSpan="11">
                {sessions.length === 0 ? (
                  <p className="text-gray-500 mt-2">Aucune session enregistrée.</p>
                ) : (
                  <table className="w-full table-auto border mt-2">
<thead>
  <tr className="bg-gray-200">
    <th className="px-2 py-1">ID</th>
    <th className="px-2 py-1">Date</th>
    <th className="px-2 py-1">Formateur</th>
    <th className="px-2 py-1">Participants prévus</th>
    <th className="px-2 py-1">Local</th>
    <th className="px-2 py-1">Pauses</th>
    <th className="px-2 py-1">Actions</th>
  </tr>
</thead>

                    <tbody>
                      {sessions.map((s) => (
                        <React.Fragment key={s.session_id}>
          <tr>
  <td className="border px-2 py-1">{s.session_id}</td>
  <td className="border px-2 py-1">
    {s.date_realisation ? new Date(s.date_realisation).toLocaleDateString() : '-'}
  </td>
  <td className="border px-2 py-1">
    {(() => {
      const formateur = formateurs.find(f => f.cuid === s.formateur_cuid);
      return formateur ? `${formateur.nom} ${formateur.prenom}` : '-';
    })()}
  </td>
  <td className="border px-2 py-1">{s.nb_participants_prevu || '-'}</td>
  <td className="border px-2 py-1">{s.local || '-'}</td>
  <td className="border px-2 py-1">{s.pauses || '-'}</td>
<td className="border px-2 py-1 flex gap-1">
  {!isReadOnly && (
    <>
      <button onClick={() => openEditSession(s)} className="bg-yellow-400 text-white px-2 py-1 rounded">✏️</button>
      <button onClick={() => deleteSession(s.session_id)} className="bg-red-600 text-white px-2 py-1 rounded">🗑️</button>
    </>
  )}
</td>

</tr>

                          {participantsBySession[s.session_id] && (
                            <tr>
                              <td colSpan="8" className="bg-gray-50 border px-4 py-2">
                                <ul className="text-sm text-gray-600 list-disc pl-5">
                                  {participantsBySession[s.session_id].map((p) => (
                                    <li key={p.cuid}>{p.cuid} - {p.nom} {p.prenom}</li>
                                  ))}
                                </ul>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                )}
              </td>
            </tr>
          )}
        </React.Fragment>
      ))}
    </tbody>
  </table>
  </div>
)}


  {/* 🟨 Modal modification formation */}
<Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
  <Modal.Header closeButton>
    <Modal.Title>Modifier une formation</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Form>
      <Form.Group className="mb-2">
        <Form.Label>Intitulé</Form.Label>
        <Form.Control
          name="intitule"
          value={currentFormation.intitule}
          onChange={handleEditChange}
        />
      </Form.Group>

      <Form.Group className="mb-2">
        <Form.Label>Modalité d’apprentissage</Form.Label>
        <Form.Select
          name="modalite_apprentissage_id"
          value={currentFormation.modalite_apprentissage_id || ''}
          onChange={(e) =>
            setCurrentFormation({
              ...currentFormation,
              modalite_apprentissage_id: parseInt(e.target.value) || null,
            })
          }
        >
          <option value="">-- Sélectionner une modalité --</option>
          {modalites.map((m) => (
            <option key={m.id} value={m.id}>{m.libelle}</option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-2">
        <Form.Label>Mode de formation</Form.Label>
        <Form.Select
          name="mode_formation_id"
          value={currentFormation.mode_formation_id || ''}
          onChange={(e) =>
            setCurrentFormation({
              ...currentFormation,
              mode_formation_id: parseInt(e.target.value) || null,
            })
          }
        >
          <option value="">-- Sélectionner un mode --</option>
          {modesFormation.map((m) => (
            <option key={m.id} value={m.id}>{m.libelle}</option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-2">
        <Form.Label>Certification</Form.Label>
        <Form.Select
          name="certification"
          value={currentFormation.certification ? 'true' : 'false'}
          onChange={(e) =>
            setCurrentFormation({
              ...currentFormation,
              certification: e.target.value === 'true',
            })
          }
        >
          <option value="true">Oui</option>
          <option value="false">Non</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-2">
        <Form.Label>TFP</Form.Label>
        <Form.Select
          name="tfp"
          value={currentFormation.tfp ? 'true' : 'false'}
          onChange={(e) =>
            setCurrentFormation({
              ...currentFormation,
              tfp: e.target.value === 'true',
            })
          }
        >
          <option value="true">Oui</option>
          <option value="false">Non</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-2">
        <Form.Label>Matériel requis</Form.Label>
        <Form.Control
          name="materiel_requis"
          value={currentFormation.materiel_requis || ''}
          onChange={handleEditChange}
        />
      </Form.Group>

      <Form.Group className="mb-2">
        <Form.Label>Programme</Form.Label>
        <Select
          options={programmes.map((p) => ({
            value: p.id,
            label: p.intitule,
          }))}
          value={
            programmes
              .map((p) => ({ value: p.id, label: p.intitule }))
              .find((option) => option.value === currentFormation.programme_id) || null
          }
          onChange={(selectedOption) =>
            setCurrentFormation({
              ...currentFormation,
              programme_id: selectedOption ? selectedOption.value : null,
            })
          }
          isClearable
          placeholder="-- Sélectionner un programme --"
        />
      </Form.Group>
    </Form>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowEditModal(false)}>
      Annuler
    </Button>
    <Button variant="primary" onClick={submitEditFormation}>
      Enregistrer
    </Button>
  </Modal.Footer>
</Modal>


      {/* 🟦 Modal session */}
 <Modal show={showSessionModal} onHide={() => setShowSessionModal(false)}>
  <Modal.Header closeButton>
    <Modal.Title>Modifier une session</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Form>
      {/* 📅 Date */}
      <Form.Group className="mb-3">
        <Form.Label>Date de réalisation</Form.Label>
        <Form.Control
          type="date"
          name="date_realisation"
          value={currentSession.date_realisation}
          onChange={handleSessionChange}
        />
      </Form.Group>

      {/* 🧑‍🏫 Nom formateur */}
<Form.Group className="mb-3">
  <Form.Label>Formateur</Form.Label>
  <Select
    name="formateur_cuid"
    options={formateurOptions}
    value={formateurOptions.find(opt => opt.value === currentSession.formateur_cuid) || null}
    onChange={(selectedOption) =>
      setCurrentSession({ ...currentSession, formateur_cuid: selectedOption?.value || '' })
    }
    placeholder="-- Sélectionner un formateur --"
    isClearable
  />
</Form.Group>




      {/* 👥 Participants */}
      <Form.Group className="mb-3">
        <Form.Label>Participants prévus</Form.Label>
        <Form.Control
          type="number"
          min="0"
          placeholder="Nombre"
          name="nb_participants_prevu"
          value={currentSession.nb_participants_prevu || ''}
          onChange={handleSessionChange}
        />
      </Form.Group>

      {/* 🏢 Local */}
      <Form.Group className="mb-3">
        <Form.Label>Local</Form.Label>
        <Form.Control
          type="text"
          placeholder="ex : Salle B2"
          name="local"
          value={currentSession.local || ''}
          onChange={handleSessionChange}
        />
      </Form.Group>

      {/* ☕ Pauses */}
      <Form.Group className="mb-3">
        <Form.Label>Pauses</Form.Label>
        <Form.Control
          type="text"
          placeholder="ex : matin, après-midi"
          name="pauses"
          value={currentSession.pauses || ''}
          onChange={handleSessionChange}
        />
      </Form.Group>

      {/* 🏢 Prestataire ID (si tu veux) */}
      <Form.Group className="mb-3">
        <Form.Label>Prestataire ID</Form.Label>
        <Form.Control
          type="number"
          name="prestataire_id"
          value={currentSession.prestataire_id || ''}
          onChange={handleSessionChange}
        />
      </Form.Group>
    </Form>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowSessionModal(false)}>Annuler</Button>
    <Button variant="primary" onClick={submitEditSession}>Enregistrer</Button>
  </Modal.Footer>
</Modal>

    </div>
  );
}

export default GestionFormations;
