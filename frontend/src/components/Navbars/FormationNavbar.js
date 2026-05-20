import React from "react";
import { Navbar, Container, Nav, Dropdown, Button } from "react-bootstrap";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import formationRoutes from "routes/routesFormation";
import "./navbars.css";

function FormationNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  const getBrandText = () => {
    for (let i = 0; i < formationRoutes.length; i++) {
      const fullPath = formationRoutes[i].layout + formationRoutes[i].path;
      if (location.pathname.includes(fullPath)) {
        return formationRoutes[i].name;
      }
    }
    return "Espace Formation";
  };

  const mobileSidebarToggle = (e) => {
    e.preventDefault();
    document.documentElement.classList.toggle("nav-open");

    const node = document.createElement("div");
    node.id = "bodyClick";
    node.onclick = function () {
      this.parentElement.removeChild(this);
      document.documentElement.classList.toggle("nav-open");
    };
    document.body.appendChild(node);
  };

  return (
    <Navbar bg="light" expand="lg" className="shadow-sm px-3">
      <Container fluid>
        <div className="d-flex align-items-center">
          <Button
            variant="dark"
            className="d-lg-none rounded-circle p-2 me-2"
            onClick={mobileSidebarToggle}
          >
            <i className="fas fa-bars"></i>
          </Button>
          <Navbar.Brand className="fw-bold text-orange">
            {getBrandText()}
          </Navbar.Brand>
        </div>

        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto align-items-center">
            {/* 👤 Utilisateur */}
            <Dropdown as={Nav.Item}>
              <Dropdown.Toggle as={Nav.Link}>
                <i className="bi bi-person-circle me-1"></i> Dep Formation
              </Dropdown.Toggle>
              <Dropdown.Menu align="end">
                <Dropdown.Item as={NavLink} to="/formation/changer-mdp">
                  <i className="bi bi-key me-2"></i> Changer mot de passe
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i> Déconnexion
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default FormationNavbar;
