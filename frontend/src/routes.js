
import GestionFormations from "views/GestionFormations.js";
import GestionProgramme from "views/GestionProgramme";
import GestionCollab from "views/GestionCollab";
import DashboardRH from "views/DashboardRH.js";
import PlanifierSession from "views/PlanifierSession";
import HistoriqueModifications from "views/HistoriqueModifications";
import GestionUtilisateurs from "views/GestionUtilisateurs";
import ChangePassword from "views/ChangePassword";
import SuiviParticipants from "views/SuiviParticipants";
import FicheReview from "views/FicheReview";

const dashboardRoutes = [
  // 🏠 Dashboard
  {
    path: "dashboard-rh",
    name: "Dashboard RH",
    icon: "bi bi-graph-up-arrow",
    component: DashboardRH,
    layout: "/admin",
    group: "Tableau de bord",
    inSidebar: false,
  },

  // 👥 Collaborateurs
  {
    path: "gestion-collab",
    name: "Gestion des collaborateurs",
    icon: "nc-icon nc-badge",
    component: GestionCollab,
    layout: "/admin",
    group: "Collaborateurs"
  },
  {
    path: "historique",
    name: "Historique des modifications",
    icon: "nc-icon nc-time-alarm",
    component: HistoriqueModifications,
    layout: "/admin",
    group: "Collaborateurs"
  },

  //  Formations
  {
    path: "gestion-programme",
    name: "Programmes",
    icon: "nc-icon nc-bullet-list-67",
    component: GestionProgramme,
    layout: "/admin",
    group: "Formations"
  },
  {
    path: "gestion-formations",
    name: "Formations",
    icon: "bi bi-journal-text",
    component: GestionFormations,
    layout: "/admin",
    group: "Formations"
  },
  {
    path: "planifier-session",
    name: "Sessions",
    icon: "nc-icon nc-simple-add",
    component: PlanifierSession,
    layout: "/admin",
    group: "Formations"
  },
  {
    path: "suivi-participants/:sessionId",
    name: "Suivi des participants",
    icon: "bi bi-clipboard-check",
    component: SuiviParticipants,
    layout: "/admin",
    group: "Formations"
    
  },

  // 🤖 IA
  {
    path: "fiche-review",
    name: "People Review IA",
    icon: "bi bi-chat-square-text-fill",
    component: FicheReview,
    layout: "/admin",
    
  },

  //  Param
  {
    path: "changer-mdp",
    name: "Changer mot de passe",
    icon: "nc-icon nc-key-25",
    component: ChangePassword,
    layout: "/admin",
    inSidebar: false
  },
  {
    path: "gestion-utilisateurs",
    name: "Gestion des utilisateurs",
    icon: "nc-icon nc-single-02",
    component: GestionUtilisateurs,
    layout: "/admin",
    inSidebar: false
  }
];

export default dashboardRoutes;
