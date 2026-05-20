import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Container, Row, Col,Modal  } from 'react-bootstrap';
import Select from 'react-select';
import { Table } from 'react-bootstrap';
import './GestionCollab.css';
import axios from "../axiosConfig";

function GestionCollab() {
  const [formData, setFormData] = useState({
    cuid: '',
    matricule: '',
    nom: '',
    prenom: '',
    genre: '',
    date_naissance: '',
    situation_familiale: '',
    n_plus_1_cuid: '',
    n_plus_2_cuid: '',
    nb_absence_cumule: '',
    responsable_uo: false,
    filiere_metier: '',
    poste_id: '',
    direction_id: '',
    site_affectation_id: '',
    unite_organisationnelle: '',
    filiere_id: '',
    date_fin_contrat: '',
    date_entree: '',
    date_embauche_consolidee: '',
    grade_actuel: '',
    niveau: '',
    niveau_managerial: '',
    qualification_cadre: '',
    affectation_comex: false
  });

  const [poste, setPoste] = useState([]);
const [filieres, setFilieres] = useState([]);
const [message, setMessage] = useState(null);
const [sites, setSites] = useState([]);
const [directions, setDirections] = useState([]);
const [unites, setUnites] = useState([]);
const [searchTerm, setSearchTerm] = useState('');

//ça concerne la suppression 
const [collaborateurs, setCollaborateurs] = useState([]);
const [selected, setSelected] = useState(null);
const [showModal, setShowModal] = useState(false);
const [showEditModal, setShowEditModal] = useState(false);
const [editData, setEditData] = useState(null);

const userRole = localStorage.getItem("userRole")?.trim();
const isReadOnly = userRole === "top_manager";
useEffect(() => {
  const fetchData = async () => {
    try {
      const [posteRes, directionsRes, sitesRes, filieresRes, unitesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/dictionnaires/postes'),
        axios.get('http://localhost:5000/api/dictionnaires/directions'),
        axios.get('http://localhost:5000/api/dictionnaires/sites'),
        axios.get('http://localhost:5000/api/dictionnaires/filieres'),
       axios.get('http://localhost:5000/api/dictionnaires/unites')
      ]);
      setPoste(posteRes.data);
      setDirections(directionsRes.data);
      setSites(sitesRes.data);
      setFilieres(filieresRes.data);
      setUnites(unitesRes.data);  
    } catch (err) {
      console.error("❌ Erreur de chargement des dictionnaires :", err);
    }
  };

  fetchData();
}, []);

useEffect(() => {
  const fetchCollaborateurs = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/collaborateurs/actifs");
      setCollaborateurs(res.data);
    } catch (err) {
      console.error("❌ Erreur chargement collaborateurs :", err);
    }
  };

  fetchCollaborateurs();
}, []);


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/collaborateurs/add', formData);
      setMessage({ type: 'success', text: 'Collaborateur ajouté avec succès !' });
      setFormData({
        cuid: '', matricule: '', nom: '', prenom: '', genre: '', date_naissance: '',
        situation_familiale: '', n_plus_1_cuid: '',
        n_plus_2_cuid: '', nb_absence_cumule: '', responsable_uo: false,
        filiere_metier: '', poste_id: '', direction_id: '', site_affectation_id: '',
        unite_organisationnelle: '', filiere_id: '', date_fin_contrat: '', date_entree: '',
        date_embauche_consolidee: '', grade_actuel: '', niveau: '', niveau_managerial: '',
        qualification_cadre: '', affectation_comex: false
      });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'danger', text: 'Erreur lors de l\'ajout.' });
    }
  };

 const handleVoir = (collab) => {
  setSelected(collab);
  setShowModal(true);
};

const handleEdit = (collab) => {
  setEditData({
    ...collab,
    niveau_managerial: collab.niveau_managerial ?? false,
    qualification_cadre: collab.qualification_cadre ?? false,
    affectation_comex: collab.affectation_comex ?? false,
    n_plus_1_cuid: collab.n_plus_1_cuid ?? '',
    n_plus_2_cuid: collab.n_plus_2_cuid ?? '',
    filiere_metier: collab.filiere_metier ?? '',
    grade_actuel: collab.grade_actuel ?? '',
    situation_familiale: collab.situation_familiale ?? '',
    nb_absence_cumule: collab.nb_absence_cumule ?? 0,
    date_naissance: collab.date_naissance ?? '',
    poste_id: collab.poste_id ?? '',
    direction_id: collab.direction_id ?? '',
    site_affectation_id: collab.site_affectation_id ?? '',
  });
  setShowEditModal(true);
};

const handleEditChange = (e) => {
  const { name, value, type, checked } = e.target;
  setEditData({
    ...editData,
    [name]: type === 'checkbox' ? checked : value
  });
};

const handleSupprimer = async (cuid) => {
  if (!window.confirm("Confirmer la désactivation de ce collaborateur ?")) return;

  try {
    await axios.put(`http://localhost:5000/api/collaborateurs/delete/${cuid}`, {});
    setCollaborateurs(prev => prev.filter(c => c.cuid !== cuid));
  } catch (err) {
    console.error("❌ Erreur suppression :", err);
    alert("Erreur lors de la suppression");
  }
};

  return (
    <Container className="py-4">
      {!isReadOnly && (
  <>
      <h3 className="section-title">➕Ajouter un collaborateur</h3>

      <div className="section-card fade-in">
  <h5>📥 Importer un fichier Excel</h5>
  <form
    onSubmit={async (e) => {
      e.preventDefault();
      const formData = new FormData();
      const fileInput = document.getElementById("excelFile");
      const moisInput = document.getElementById("moisInput");
      const anneeInput = document.getElementById("anneeInput");

      if (!fileInput.files.length) return alert("Veuillez sélectionner un fichier Excel.");

      formData.append("file", fileInput.files[0]);
      formData.append("mois_reference", moisInput.value);
      formData.append("annee_reference", anneeInput.value);

      try {
        const response = await axios.post("http://localhost:5000/api/upload", formData);
        alert(response.data.message);
        window.location.reload(); // recharge la liste
      } catch (err) {
        console.error(err);
        alert("Erreur lors de l'import : " + (err.response?.data?.error || err.message));
      }
    }}
  >
    <Row className="align-items-center">
      <Col md={4}>
        <Form.Control id="excelFile" type="file" accept=".xlsx, .xls" required />
      </Col>
      <Col md={3}>
        <Form.Select id="moisInput" defaultValue={new Date().getMonth() + 1}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString("fr-FR", { month: "long" })}
            </option>
          ))}
        </Form.Select>
      </Col>
      <Col md={3}>
        <Form.Select id="anneeInput" defaultValue={new Date().getFullYear()}>
          {[2023, 2024, 2025].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </Form.Select>
      </Col>
      <Col md={2}>
        <Button type="submit" className="btn-primary">📥 Importer</Button>

      </Col>
    </Row>
  </form>
</div>
      {message && <Alert variant={message.type}>{message.text}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={6}><Form.Group><Form.Label>CUID</Form.Label><Form.Control name="cuid" value={formData.cuid} onChange={handleChange} required /></Form.Group></Col>
          <Col md={6}><Form.Group><Form.Label>Matricule</Form.Label><Form.Control name="matricule" value={formData.matricule} onChange={handleChange} type="number" required /></Form.Group></Col>
        </Row>
        <Row>
          <Col md={6}><Form.Group><Form.Label>Nom</Form.Label><Form.Control name="nom" value={formData.nom} onChange={handleChange} required /></Form.Group></Col>
          <Col md={6}><Form.Group><Form.Label>Prénom</Form.Label><Form.Control name="prenom" value={formData.prenom} onChange={handleChange} required /></Form.Group></Col>
        </Row>
        <Row>
<Col md={6}>
  <Form.Group>
    <Form.Label>Genre</Form.Label>
    <Form.Select name="genre" value={formData.genre} onChange={handleChange}>
      <option value="">-- Sélectionner un genre --</option>
      <option value="Masculin">Masculin</option>
      <option value="Féminin">Féminin</option>
    </Form.Select>
  </Form.Group>
</Col>
          <Col md={6}><Form.Group><Form.Label>Date de naissance</Form.Label><Form.Control name="date_naissance" type="date" value={formData.date_naissance} onChange={handleChange} /></Form.Group></Col>
        </Row>
       <Row className="mb-3">
  <Col md={6}>
    <Form.Group>
      <Form.Label>Situation familiale</Form.Label>
      <Form.Control
        name="situation_familiale"
        value={formData.situation_familiale}
        onChange={handleChange}
      />
    </Form.Group>
  </Col>
  <Col md={6}>
    <Form.Group>
      <Form.Label>Absences cumulées</Form.Label>
      <Form.Control
        name="nb_absence_cumule"
        type="number"
        value={formData.nb_absence_cumule}
        onChange={handleChange}
      />
    </Form.Group>
  </Col>
</Row>

<Row className="mb-3">
<Col md={6}>
  <Form.Group>
    <Form.Label>N+1</Form.Label>
    <Select
      name="n_plus_1_cuid"
      value={
        collaborateurs
          .map((c) => ({ value: c.cuid, label: `${c.nom} ${c.prenom} (${c.cuid})` }))
          .find((option) => option.value === formData.n_plus_1_cuid) || null
      }
      onChange={(selectedOption) =>
        setFormData({
          ...formData,
          n_plus_1_cuid: selectedOption ? selectedOption.value : '',
        })
      }
      options={collaborateurs.map((c) => ({
        value: c.cuid,
        label: `${c.nom} ${c.prenom} (${c.cuid})`,
      }))}
      placeholder="-- Sélectionner un manager N+1 --"
      isClearable
      styles={{
        container: (provided) => ({
          ...provided,
          width: '100%',
        }),
        control: (provided) => ({
          ...provided,
          minHeight: '48px',
          fontSize: '16px',
        }),
        menu: (provided) => ({
          ...provided,
          zIndex: 9999,
        }),
      }}
    />
  </Form.Group>
</Col>

<Col md={6}>
  <Form.Group>
    <Form.Label>N+2</Form.Label>
    <Select
      name="n_plus_2_cuid"
      value={
        collaborateurs
          .map((c) => ({ value: c.cuid, label: `${c.nom} ${c.prenom} (${c.cuid})` }))
          .find((option) => option.value === formData.n_plus_2_cuid) || null
      }
      onChange={(selectedOption) =>
        setFormData({
          ...formData,
          n_plus_2_cuid: selectedOption ? selectedOption.value : '',
        })
      }
      options={collaborateurs.map((c) => ({
        value: c.cuid,
        label: `${c.nom} ${c.prenom} (${c.cuid})`,
      }))}
      placeholder="-- Sélectionner un manager N+2 --"
      isClearable
      styles={{
        container: (provided) => ({
          ...provided,
          width: '100%',
        }),
        control: (provided) => ({
          ...provided,
          minHeight: '48px',
          fontSize: '16px',
        }),
        menu: (provided) => ({
          ...provided,
          zIndex: 9999,
        }),
      }}
    />
  </Form.Group>
</Col>

</Row>


<Row>
  <Col md={6}>
    <Form.Group>
      <Form.Label>Grade actuel</Form.Label>
      <Form.Control
        name="grade_actuel"
        value={formData.grade_actuel}
        onChange={(e) =>
          handleChange({ target: { name: 'grade_actuel', value: e.target.value.toUpperCase() } })
        }
      />
    </Form.Group>
  </Col>
</Row>
<Row className="mb-3">
  <Col md={2}>
    <Form.Group>
      <Form.Label>Niveau Managérial</Form.Label>
      <Form.Select
        name="niveau_managerial"
        value={formData.niveau_managerial ? "true" : "false"}
        onChange={(e) =>
          setFormData({
            ...formData,
            niveau_managerial: e.target.value === "true",
          })
        }
      >
        <option value="false">Non</option>
        <option value="true">Oui</option>
      </Form.Select>
    </Form.Group>
  </Col>

  <Col md={2}>
    <Form.Group>
      <Form.Label>Qualification Cadre</Form.Label>
      <Form.Select
        name="qualification_cadre"
        value={formData.qualification_cadre ? "true" : "false"}
        onChange={(e) =>
          setFormData({
            ...formData,
            qualification_cadre: e.target.value === "true",
          })
        }
      >
        <option value="false">Non</option>
        <option value="true">Oui</option>
      </Form.Select>
    </Form.Group>
  </Col>

  <Col md={2}>
    <Form.Group>
      <Form.Label>Affectation Comex</Form.Label>
      <Form.Select
        name="affectation_comex"
        value={formData.affectation_comex ? "true" : "false"}
        onChange={(e) =>
          setFormData({
            ...formData,
            affectation_comex: e.target.value === "true",
          })
        }
      >
        <option value="false">Non</option>
        <option value="true">Oui</option>
      </Form.Select>
    </Form.Group>
  </Col>

  <Col md={3}>
    <Form.Group>
      <Form.Label>Filière métier</Form.Label>
      <Form.Control
        name="filiere_metier"
        value={formData.filiere_metier}
        onChange={handleChange}
      />
    </Form.Group>
  </Col>

<Col md={3}>
  <Form.Group>
    <Form.Label>Direction</Form.Label>
    <Select
      name="direction_id"
      value={
        directions
          .map((d) => ({ value: d.id, label: `${d.id} - ${d.nom}` }))
          .find((option) => option.value === formData.direction_id) || null
      }
      onChange={(selectedOption) =>
        setFormData({
          ...formData,
          direction_id: selectedOption ? selectedOption.value : '',
        })
      }
      options={directions.map((d) => ({
        value: d.id,
        label: `${d.id} - ${d.nom}`,
      }))}
      placeholder="-- Sélectionner une direction --"
      isClearable
      styles={{
        container: (provided) => ({
          ...provided,
          width: '100%',
        }),
        control: (provided) => ({
          ...provided,
          minHeight: '48px',
          fontSize: '16px',
        }),
        menu: (provided) => ({
          ...provided,
          zIndex: 9999,
        }),
      }}
    />
  </Form.Group>
</Col>
</Row>


<Row className="mb-3">
<Col md={12}>
  <Form.Group>
    <Form.Label>Site d'affectation</Form.Label>
    <Select
      name="site_affectation_id"
      value={
        sites
          .map((s) => ({ value: s.id, label: `${s.id} - ${s.nom}` }))
          .find((option) => option.value === formData.site_affectation_id) || null
      }
      onChange={(selectedOption) =>
        setFormData({
          ...formData,
          site_affectation_id: selectedOption ? selectedOption.value : '',
        })
      }
      options={sites.map((s) => ({
        value: s.id,
        label: `${s.id} - ${s.nom}`,
      }))}
      placeholder="-- Sélectionner un site --"
      isClearable
      styles={{
        container: (provided) => ({
          ...provided,
          width: '100%',
        }),
        control: (provided) => ({
          ...provided,
          minHeight: '48px',
          fontSize: '16px',
        }),
        menu: (provided) => ({
          ...provided,
          zIndex: 9999,
        }),
      }}
    />
  </Form.Group>
</Col>

<Col md={12}>
  <Form.Group>
    <Form.Label>Poste</Form.Label>
    <Select
      name="poste_id"
      value={
        poste
          .map((p) => ({ value: p.id, label: `${p.id} - ${p.nom}` }))
          .find((option) => option.value === formData.poste_id) || null
      }
      onChange={(selectedOption) =>
        setFormData({
          ...formData,
          poste_id: selectedOption ? selectedOption.value : '',
        })
      }
      options={poste.map((p) => ({
        value: p.id,
        label: `${p.id} - ${p.nom}`,
      }))}
      placeholder="-- Sélectionner un poste --"
      isClearable
      styles={{
        container: (provided) => ({
          ...provided,
          width: '100%',
        }),
        control: (provided) => ({
          ...provided,
          minHeight: '48px',
          fontSize: '16px',
        }),
        menu: (provided) => ({
          ...provided,
          zIndex: 9999,
        }),
      }}
    />
  </Form.Group>
</Col>


</Row>

<Row className="mb-3">
<Col md={6}>
  <Form.Group>
    <Form.Label>Unité organisationnelle</Form.Label>
    <Select
      name="unite_organisationnelle"
      value={
        unites
          .map((u) => ({ value: u.id, label: `${u.id} - ${u.nom}` }))
          .find((option) => option.value === formData.unite_organisationnelle) || null
      }
      onChange={(selectedOption) =>
        setFormData({
          ...formData,
          unite_organisationnelle: selectedOption ? selectedOption.value : '',
        })
      }
      options={unites.map((u) => ({
        value: u.id,
        label: `${u.id} - ${u.nom}`,
      }))}
      placeholder="-- Sélectionner une unité --"
      isClearable
      styles={{
        container: (provided) => ({
          ...provided,
          width: '100%',
        }),
        control: (provided) => ({
          ...provided,
          minHeight: '48px',
          fontSize: '16px',
        }),
        menu: (provided) => ({
          ...provided,
          zIndex: 9999,
        }),
      }}
    />
  </Form.Group>
</Col>

  <Col md={6}>
    <Form.Group>
      <Form.Label>Filière</Form.Label>
      <Form.Select
        name="filiere_id"
        value={formData.filiere_id}
        onChange={handleChange}
      >
        <option value="">-- Sélectionner une filière --</option>
        {filieres.map((f) => (
          <option key={f.id} value={f.id}>
            {f.id} - {f.nom}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  </Col>
</Row>


        <div className="mt-4">
          <Button type="submit" className="btn-primary">💾 Ajouter</Button>

        </div>
      </Form>
        </>
)}


      <h4 className="mt-5">📋 Liste des collaborateurs actifs</h4>

        <Form.Group className="mb-3">
  <Form.Control
    type="text"
    placeholder="🔍 Rechercher un collaborateur..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
</Form.Group>
<Table striped bordered hover responsive className="mt-3">

  <thead className="table-light">
    <tr>
      <th>CUID</th>
      <th>Nom</th>
      <th>Prénom</th>
      {!isReadOnly && <th>Actions</th>}
    </tr>
  </thead>
  <tbody>
{collaborateurs
  .filter((c) =>
    `${c.cuid} ${c.nom} ${c.prenom}`.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .map((collab) => (
    <tr key={collab.cuid}>
      <td>{collab.cuid}</td>
      <td>{collab.nom}</td>
      <td>{collab.prenom}</td>
      <td>
       <Button className="btn-view me-2" onClick={() => handleVoir(collab)}>
  👁️ Voir
</Button>
         {!isReadOnly && (
    <>
        <Button className="btn-edit me-2" onClick={() => handleEdit(collab)}>
      ✏️ Modifier
    </Button>
         <Button className="btn-delete" onClick={() => handleSupprimer(collab.cuid)}>
      🗑️ Désactiver
    </Button>

           </>
  )}
      </td>
    </tr>
))}

  </tbody>
</Table>

{selected && (
  <Modal show={showModal} onHide={() => setShowModal(false)} centered>
    <Modal.Header closeButton>
      <Modal.Title>Détail du collaborateur</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <ul>
        {Object.entries(selected).map(([key, value]) => (
          <li key={key}>
            <strong>{key} :</strong> {String(value)}
          </li>
        ))}
      </ul>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={() => setShowModal(false)}>
        Fermer
      </Button>
    </Modal.Footer>
  </Modal>
)}



{editData && (
  <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg">
    <Modal.Header closeButton>
      <Modal.Title>✏️ Modifier le collaborateur</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Form>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-2">
              <Form.Label>Nom</Form.Label>
              <Form.Control name="nom" value={editData.nom} onChange={handleEditChange} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-2">
              <Form.Label>Prénom</Form.Label>
              <Form.Control name="prenom" value={editData.prenom} onChange={handleEditChange} />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-2">
              <Form.Label>Matricule</Form.Label>
              <Form.Control name="matricule" value={editData.matricule} onChange={handleEditChange} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-2">
              <Form.Label>CUID</Form.Label>
              <Form.Control name="cuid" value={editData.cuid} readOnly />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-2">
              <Form.Label>N+1</Form.Label>
              <Select
                value={
                  collaborateurs.map(c => ({ value: c.cuid, label: `${c.nom} ${c.prenom} (${c.cuid})` }))
                    .find(opt => opt.value === editData.n_plus_1_cuid) || null
                }
                onChange={(selected) =>
                  setEditData({ ...editData, n_plus_1_cuid: selected ? selected.value : '' })
                }
                options={collaborateurs.map(c => ({
                  value: c.cuid,
                  label: `${c.nom} ${c.prenom} (${c.cuid})`
                }))}
                isClearable
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-2">
              <Form.Label>N+2</Form.Label>
              <Select
                value={
                  collaborateurs.map(c => ({ value: c.cuid, label: `${c.nom} ${c.prenom} (${c.cuid})` }))
                    .find(opt => opt.value === editData.n_plus_2_cuid) || null
                }
                onChange={(selected) =>
                  setEditData({ ...editData, n_plus_2_cuid: selected ? selected.value : '' })
                }
                options={collaborateurs.map(c => ({
                  value: c.cuid,
                  label: `${c.nom} ${c.prenom} (${c.cuid})`
                }))}
                isClearable
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-2">
              <Form.Label>Direction</Form.Label>
              <Form.Select
  name="direction_id"
  value={editData.direction_id || ''}
  onChange={handleEditChange}
>
  <option value="">-- Sélectionner --</option>
  {directions.map(d => (
    <option key={d.id} value={d.id}>
      {d.nom}
    </option>
  ))}
</Form.Select>

            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-2">
              <Form.Label>Poste</Form.Label>
              <Form.Select name="poste_id" value={editData.poste_id} onChange={handleEditChange}>
                <option value="">-- Sélectionner --</option>
                {poste.map(p => (
                  <option key={p.id} value={p.id}>{p.nom}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-2">
              <Form.Label>Filière métier</Form.Label>
              <Form.Control name="filiere_metier" value={editData.filiere_metier} onChange={handleEditChange} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-2">
              <Form.Label>Grade actuel</Form.Label>
              <Form.Control name="grade_actuel" value={editData.grade_actuel} onChange={handleEditChange} />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={4}>
            <Form.Group className="mb-2">
              <Form.Label>Niveau managérial</Form.Label>
              <Form.Select
                name="niveau_managerial"
                value={editData.niveau_managerial ? "true" : "false"}
                onChange={(e) =>
                  setEditData({ ...editData, niveau_managerial: e.target.value === "true" })
                }
              >
                <option value="false">Non</option>
                <option value="true">Oui</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-2">
              <Form.Label>Qualification cadre</Form.Label>
              <Form.Select
                name="qualification_cadre"
                value={editData.qualification_cadre ? "true" : "false"}
                onChange={(e) =>
                  setEditData({ ...editData, qualification_cadre: e.target.value === "true" })
                }
              >
                <option value="false">Non</option>
                <option value="true">Oui</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-2">
              <Form.Label>Affectation Comex</Form.Label>
              <Form.Select
                name="affectation_comex"
                value={editData.affectation_comex ? "true" : "false"}
                onChange={(e) =>
                  setEditData({ ...editData, affectation_comex: e.target.value === "true" })
                }
              >
                <option value="false">Non</option>
                <option value="true">Oui</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-2">
              <Form.Label>Date de naissance</Form.Label>
              <Form.Control
                type="date"
                name="date_naissance"
                value={editData.date_naissance || ""}
                onChange={handleEditChange}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-2">
              <Form.Label>Absences cumulées</Form.Label>
              <Form.Control
                type="number"
                name="nb_absence_cumule"
                value={editData.nb_absence_cumule}
                onChange={handleEditChange}
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-2">
              <Form.Label>Situation familiale</Form.Label>
              <Form.Control
                name="situation_familiale"
                value={editData.situation_familiale}
                onChange={handleEditChange}
              />
            </Form.Group>
          </Col>
        </Row>
      </Form>
    </Modal.Body>

    <Modal.Footer>
      <Button variant="secondary" onClick={() => setShowEditModal(false)}>Annuler</Button>
      <Button variant="primary" onClick={async () => {
        try {
          await axios.put(`http://localhost:5000/api/collaborateurs/${editData.cuid}`, editData);
          setShowEditModal(false);
          const res = await axios.get("http://localhost:5000/api/collaborateurs/actifs");
          setCollaborateurs(res.data);
          alert("✅ Modification enregistrée !");
        } catch (error) {
          console.error("❌ Erreur modification :", error);
          alert("Erreur lors de la modification");
        }
      }}>
        Enregistrer
      </Button>
    </Modal.Footer>
  </Modal>
)}


    </Container>
  );
}

export default GestionCollab;
