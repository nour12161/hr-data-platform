import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Card,
  Button,
  Modal,
  Form,
  Table,
} from "react-bootstrap";

const GestionFormations = () => {
  const [formations, setFormations] = useState([]);
  const [selectedFormation, setSelectedFormation] = useState(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [newParticipant, setNewParticipant] = useState({
    cuid: "",
    nom_prenom: "",
    statut_participation: "",
    date_presence: "",
    certification: false,
  });

  // Charger les formations
  useEffect(() => {
    fetchFormations();
  }, []);

  const fetchFormations = async () => {
    const res = await axios.get("http://localhost:5000/api/formations");
    setFormations(res.data);
  };

  // Voir les participants
  const handleViewParticipants = (formation) => {
    setSelectedFormation(formation);
    setShowParticipantsModal(true);
  };

  // Ajouter un participant
  const handleAddParticipant = async () => {
    await axios.post(
      `http://localhost:5000/api/formations/${selectedFormation._id}/participants`,
      newParticipant
    );
    fetchFormations(); // refresh
    setShowParticipantsModal(false);
    setNewParticipant({
      cuid: "",
      nom_prenom: "",
      statut_participation: "",
      date_presence: "",
      certification: false,
    });
  };

  // Supprimer un participant
  const handleDeleteParticipant = async (participantId) => {
    await axios.delete(
      `http://localhost:5000/api/formations/${selectedFormation._id}/participants/${participantId}`
    );
    fetchFormations();
  };

  return (
    <Container>
      <h2>📚 Gestion des Formations</h2>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Référence Action</th>
            <th>Intitulé</th>
            <th>Pilote</th>
            <th>Date de Réalisation</th>
            <th>Participants</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {formations.map((formation) => (
            <tr key={formation._id}>
              <td>{formation["Référence Action"]}</td>
              <td>{formation["Intitulé de Formation"]}</td>
              <td>{formation["Pilote"]}</td>
              <td>{formation["Date de réalisation"]}</td>
              <td>{formation.participants?.length || 0}</td>
              <td>
                <Button
                  variant="info"
                  onClick={() => handleViewParticipants(formation)}
                >
                  Voir Participants
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal Participants */}
      <Modal show={showParticipantsModal} onHide={() => setShowParticipantsModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Participants</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>Participants existants</h5>
          <ul>
            {selectedFormation?.participants?.map((p) => (
              <li key={p._id}>
                {p.nom_prenom} - {p.statut_participation} - {p.date_presence}
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDeleteParticipant(p._id)}
                  style={{ marginLeft: "10px" }}
                >
                  Supprimer
                </Button>
              </li>
            ))}
          </ul>

          <h5>Ajouter un participant</h5>
          <Form>
            <Form.Group>
              <Form.Label>CUID</Form.Label>
              <Form.Control
                value={newParticipant.cuid}
                onChange={(e) =>
                  setNewParticipant({ ...newParticipant, cuid: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Nom & Prénom</Form.Label>
              <Form.Control
                value={newParticipant.nom_prenom}
                onChange={(e) =>
                  setNewParticipant({ ...newParticipant, nom_prenom: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Statut Participation</Form.Label>
              <Form.Control
                value={newParticipant.statut_participation}
                onChange={(e) =>
                  setNewParticipant({ ...newParticipant, statut_participation: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Date Présence</Form.Label>
              <Form.Control
                type="date"
                value={newParticipant.date_presence}
                onChange={(e) =>
                  setNewParticipant({ ...newParticipant, date_presence: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group>
              <Form.Check
                type="checkbox"
                label="Certification obtenue"
                checked={newParticipant.certification}
                onChange={(e) =>
                  setNewParticipant({ ...newParticipant, certification: e.target.checked })
                }
              />
            </Form.Group>
            <Button variant="primary" onClick={handleAddParticipant}>
              Ajouter
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default GestionFormations;
