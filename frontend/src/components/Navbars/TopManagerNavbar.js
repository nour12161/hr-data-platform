import React from "react";
import { Navbar, Container, Nav, Dropdown, Button } from "react-bootstrap";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import topManagerRoutes from "../../routes/routesTopManager";
import "./navbars.css";

function TopManagerNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  const getBrandText = () => {
    for (let i = 0; i < topManagerRoutes.length; i++) {
      const fullPath = topManagerRoutes[i].layout + topManagerRoutes[i].path;
      if (location.pathname.includes(fullPath)) {
        return topManagerRoutes[i].name;
      }
    }
    return "Top Manager";
  };

  return (
    <Navbar bg="light" expand="lg" className="shadow-sm px-3">
      <Container fluid>
        <div className="d-flex align-items-center">
          <Button
            variant="dark"
            className="d-lg-none rounded-circle p-2 me-2"
            onClick={(e) => {
              e.preventDefault();
              document.documentElement.classList.toggle("nav-open");

              const node = document.createElement("div");
              node.id = "bodyClick";
              node.onclick = function () {
                this.parentElement.removeChild(this);
                document.documentElement.classList.toggle("nav-open");
              };
              document.body.appendChild(node);
            }}
          >
            <i className="fas fa-bars"></i>
          </Button>
          <Navbar.Brand className="fw-bold text-orange">{getBrandText()}</Navbar.Brand>
        </div>

        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto align-items-center">
            {/* 📊 Dashboard RH */}
            <Nav.Item className="me-3">
              <NavLink
                to="/top-manager/dashboard-rh"
                className={({ isActive }) => (isActive ? "nav-link active text-primary" : "nav-link")}
              >
                <i className="bi bi-graph-up me-1"></i> Dashboard RH
              </NavLink>
            </Nav.Item>

            {/* 👥 Suivi des participants */}
            <Nav.Item className="me-3">
              <NavLink
                to="/top-manager/suivi-participants"
                className={({ isActive }) => (isActive ? "nav-link active text-primary" : "nav-link")}
              >
                <i className="bi bi-people-fill me-1"></i> Suivi des participants
              </NavLink>
            </Nav.Item>

            {/* 🧠 People Review */}
            <Nav.Item className="me-3">
              <NavLink
                to="/top-manager/fiche-review"
                className={({ isActive }) => (isActive ? "nav-link active text-primary" : "nav-link")}
              >
                <i className="bi bi-chat-square-text me-1"></i> People Review
              </NavLink>
            </Nav.Item>

            {/* 👤 Utilisateur */}
            <Dropdown as={Nav.Item}>
              <Dropdown.Toggle as={Nav.Link}>
                <i className="bi bi-person-circle me-1"></i> Top Manager
              </Dropdown.Toggle>
              <Dropdown.Menu align="end">
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

export default TopManagerNavbar;
