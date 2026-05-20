import React, { useEffect, useRef, useState } from "react";
import { useLocation, Route, Routes } from "react-router-dom";

// Composants
import Sidebar from "components/Sidebar/Sidebar";
import Footer from "components/Footer/Footer";
import Navbar from "components/Navbars/FormationNavbar";
import FixedPlugin from "components/FixedPlugin/FixedPlugin";

// Données de navigation
import formationRoutes from "../routes/routesFormation";
import sidebarImage from "assets/img/sidebar-3.jpg";

function FormationLayout() {
  const location = useLocation();
  const mainPanel = useRef(null);

  const [image, setImage] = useState(sidebarImage);
  const [color, setColor] = useState("black");
  const [hasImage, setHasImage] = useState(true);

  // 🧭 Génère dynamiquement les routes liées à /formation
  const getRoutes = (routes) =>
    routes.map((route, key) => {
      if (route.layout === "/formation") {
        const Component = route.component;
        return <Route path={route.path} element={<Component />} key={key} />;
      }
      return null;
    });

  // 🔄 Scroll top sur navigation
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
          routes={formationRoutes} // ✅ on passe bien les routes formation
        />
        <div className="main-panel" ref={mainPanel}>
          <Navbar />
          <div className="content">
            <Routes>{getRoutes(formationRoutes)}</Routes>
          </div>
          <Footer />
        </div>
      </div>
    
    </>
  );
}

export default FormationLayout;
