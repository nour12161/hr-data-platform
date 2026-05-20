import React from "react";
import { useLocation, Route, Routes, Navigate } from "react-router-dom";

import AdminNavbar from "components/Navbars/AdminNavbar";
import Footer from "components/Footer/Footer";
import Sidebar from "components/Sidebar/Sidebar";


import routes from "routes.js";

import sidebarImage from "assets/img/sidebar-3.jpg";

function AdminLayout() {
  const [image, setImage] = React.useState(sidebarImage);
  const [color, setColor] = React.useState("black");
  const [hasImage, setHasImage] = React.useState(true);
  const location = useLocation();
  const mainPanel = React.useRef(null);

  // Génère les routes du layout /admin
  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.layout === "/admin") {
        const Component = prop.component;
        return (
          <Route path={prop.path} element={<Component />} key={key} />
        );
      }
      return null;
    });
  };

  React.useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
    if (mainPanel.current) {
      mainPanel.current.scrollTop = 0;
    }
    if (
      window.innerWidth < 993 &&
      document.documentElement.className.indexOf("nav-open") !== -1
    ) {
      document.documentElement.classList.toggle("nav-open");
      const element = document.getElementById("bodyClick");
      if (element) {
        element.parentNode.removeChild(element);
      }
    }
  }, [location]);

  return (
    <>
      <div className="wrapper">
        <Sidebar color={color} image={hasImage ? image : ""} routes={routes} />
        <div className="main-panel" ref={mainPanel}>
          <AdminNavbar />
          <div className="content">
            <Routes>
              {/* ✅ Redirection par défaut vers dashboard-rh */}
              <Route index element={<Navigate to="dashboard-rh" replace />} />
              {getRoutes(routes)}
            </Routes>
          </div>
          <Footer />
        </div>
      </div>
     
    </>
  );
}

export default AdminLayout;
