import React, { useState } from "react";
import { useLocation, NavLink, useNavigate } from "react-router-dom";
import { Nav } from "react-bootstrap";
import logo from "assets/img/logo_orange.png";
import "./Sidebar.css";

function Sidebar({ color, image, routes }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (routePath) => location.pathname === routePath;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  const userRole = localStorage.getItem("userRole")?.trim();

  // 🌟 Appliquer filtre rôle
  const filteredRoutes = routes.filter((route) => {
    const isVisible = route.inSidebar !== false;
    if (userRole === "admin") return route.layout === "/admin" && isVisible;
    if (userRole === "dep_formation") return route.layout === "/formation" && isVisible;
    if (userRole === "top_manager") return route.layout === "/top-manager" && isVisible;
    return false;
  });

  // 🌟 Ajouter manuellement une route spécifique pour top_manager
  if (userRole === "top_manager") {
    filteredRoutes.push({
      path: "/suivi-participants",
      layout: "/top-manager",
      name: "Suivi des participants",
      icon: "bi bi-people-fill",
      group: "Formations", // 🔸 apparaîtra dans le groupe "Formations"
      inSidebar: true,
    });
  }

  // 🔽 Groupes repliables
  const [openGroups, setOpenGroups] = useState({});

  const toggleGroup = (group) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  // Séparer routes sans groupe
  const noGroupRoutes = filteredRoutes.filter((route) => !route.group);
  const groupedRoutes = {};
  filteredRoutes
    .filter((route) => route.group)
    .forEach((route) => {
      const group = route.group;
      if (!groupedRoutes[group]) groupedRoutes[group] = [];
      groupedRoutes[group].push(route);
    });

  return (
    <div className="sidebar" data-image={image} data-color={color}>
      <div className="sidebar-wrapper">
        {/* Logo */}
        <div className="logo d-flex align-items-center justify-content-start">
          <div className="logo-img">
            <img src={logo} alt="Logo Orange RH" />
          </div>
          <a className="simple-text">Orange Rh</a>
        </div>

        {/* Navigation */}
        <div className="sidebar-content">
          <Nav>
            {/* 🔹 Routes sans groupe */}
            {noGroupRoutes.map((prop, key) => {
              const fullPath = `${prop.layout}${prop.path.startsWith("/") ? prop.path : "/" + prop.path}`;
              return (
                <li className={isActive(fullPath) ? "active" : ""} key={key}>
                  <NavLink
                    to={fullPath}
                    className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                  >
                    <i className={prop.icon} />
                    <span>{prop.name}</span>
                  </NavLink>
                </li>
              );
            })}

            {/* 🔸 Routes avec groupe */}
            {Object.entries(groupedRoutes).map(([group, routesInGroup], idx) => (
              <div key={idx} className="sidebar-group">
                <div
                  className="sidebar-group-title"
                  onClick={() => toggleGroup(group)}
                  style={{ cursor: "pointer", fontWeight: "bold", padding: "8px 15px" }}
                >
                  <i className="bi bi-chevron-down me-2" />
                  {group}
                </div>

                {openGroups[group] !== false && (
                  <ul className="sidebar-submenu list-unstyled ps-3">
                    {routesInGroup.map((prop, key) => {
                      const fullPath = `${prop.layout}${prop.path.startsWith("/") ? prop.path : "/" + prop.path}`;
                      return (
                        <li className={isActive(fullPath) ? "active" : ""} key={key}>
                          <NavLink
                            to={fullPath}
                            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                          >
                            <i className={prop.icon} />
                            <span>{prop.name}</span>
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </Nav>
        </div>

        {/* Déconnexion fixée en bas */}
        <div className="sidebar-bottom">
          <button className="nav-link btn btn-danger" onClick={handleLogout}>
            <i className="nc-icon nc-button-power" />
            <p>Déconnexion</p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
