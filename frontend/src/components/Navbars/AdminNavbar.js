import React from "react";
import { useLocation, NavLink, useNavigate } from "react-router-dom";
import { Navbar, Container, Nav, Dropdown, Button } from "react-bootstrap";
import NotificationBell from '../NotificationBell';

import routes from "routes.js";
import "./navbars.css";

function Header() {
  const location = useLocation();
  const navigate = useNavigate();

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

  const getBrandText = () => {
    for (let i = 0; i < routes.length; i++) {
      if (location.pathname.indexOf(routes[i].layout + routes[i].path) !== -1) {
        return routes[i].name;
      }
    }
    return "Orange RH";
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/login");
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
            <i className="fas fa-bars"></i> {/* Icône menu mobile */}
          </Button>
          <Navbar.Brand className="fw-bold text-orange">
            {getBrandText()}
          </Navbar.Brand>
        </div>

        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto align-items-center">

            {/* 🔔 Notifications */}
     <NotificationBell />

            {/* 📊 Dashboard RH */}
<Nav.Item className="me-3">
  <NavLink
    to="/admin/dashboard-rh"
    className={({ isActive }) =>
      isActive ? "nav-link active text-primary" : "nav-link"
    }
  >
    <i className="bi bi-graph-up-arrow me-1"></i> Dashboard RH
  </NavLink>
</Nav.Item>


            {/* 📅 Sessions */}
            <Nav.Item className="me-3">
              <NavLink
                to="/admin/planifier-session"
                className={({ isActive }) =>
                  isActive ? "nav-link active text-primary" : "nav-link"
                }
              >
                <i className="bi bi-calendar-event me-1"></i> Sessions
              </NavLink>
            </Nav.Item>

            {/* 🧠 People Review */}
            <Nav.Item className="me-3">
              <NavLink
                to="/admin/fiche-review"
                className={({ isActive }) =>
                  isActive ? "nav-link active text-primary" : "nav-link"
                }
              >
                <i className="bi bi-chat-dots me-1"></i> People Review
              </NavLink>
            </Nav.Item>

            {/* 👤 Utilisateur */}
            <Dropdown as={Nav.Item}>
              <Dropdown.Toggle as={Nav.Link}>
                <i className="bi bi-person-circle me-1"></i> Admin
              </Dropdown.Toggle>
              <Dropdown.Menu align="end">
                <Dropdown.Item as={NavLink} to="/admin/gestion-utilisateurs">
                  <i className="bi bi-people me-2"></i> Gestion utilisateurs
                </Dropdown.Item>
                <Dropdown.Item as={NavLink} to="/admin/changer-mdp">
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

export default Header;
