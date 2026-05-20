import React, { useEffect, useRef, useState } from "react";
import { useLocation, Route, Routes, Navigate } from "react-router-dom";

// Composants
import Sidebar from "../components/Sidebar/Sidebar";
import Footer from "../components/Footer/Footer";
import Navbar from "../components/Navbars/TopManagerNavbar";
import FixedPlugin from "../components/FixedPlugin/FixedPlugin";

// Données
import topManagerRoutes from "../routes/routesTopManager";
import sidebarImage from "../assets/img/sidebar-3.jpg";

function TopManagerLayout() {
  const location = useLocation();
  const mainPanel = useRef(null);

  const [image, setImage] = useState(sidebarImage);
  const [color, setColor] = useState("black");
  const [hasImage, setHasImage] = useState(true);

  // ✅ Corrigé : vérifier que route.layout === "/top-manager"
  const getRoutes = (routes) =>
    routes.map((route, key) => {
      if (route.layout === "/top-manager") {
        const Component = route.component;
        return <Route path={route.path} element={<Component />} key={key} />;
      }
      return null;
    });

  // Scroll en haut à chaque navigation
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
    if (mainPanel.current) {
      mainPanel.current.scrollTop = 0;
    }
  }, [location]);

  return (
    <>
      <div className="wrapper">
        <Sidebar
          color={color}
          image={hasImage ? image : ""}
          routes={topManagerRoutes}
        />
        <div className="main-panel" ref={mainPanel}>
          <Navbar />
          <div className="content">
            <Routes>
              {getRoutes(topManagerRoutes)}
              {/* ✅ Redirection vers le dashboard top-manager */}
              <Route
                path="*"
                element={<Navigate to="/top-manager/dashboard-rh" replace />}
              />
            </Routes>
          </div>
          <Footer />
        </div>
      </div>
     
    </>
  );
}

export default TopManagerLayout;
