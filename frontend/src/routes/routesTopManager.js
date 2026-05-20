import GestionFormations from "views/GestionFormations.js";
import GestionProgramme from "views/GestionProgramme";
import GestionCollab from "views/GestionCollab";
import DashboardRH from "views/DashboardRH.js";
import PlanifierSession from "views/PlanifierSession";
import HistoriqueModifications from "views/HistoriqueModifications";
import SuiviParticipants from "views/SuiviParticipants";
import FicheReview from "views/FicheReview";

const topManagerRoutes = [
  // 🏠 Dashboard RH
  {
    path: "dashboard-rh",
    name: "Dashboard RH",
    icon: "bi bi-graph-up-arrow",
    component: DashboardRH,
    layout: "/top-manager",
    group: "Tableau de bord"
  },

  // 👥 Collaborateurs
  {
    path: "gestion-collab",
    name: "Gestion des collaborateurs",
    icon: "nc-icon nc-badge",
    component: GestionCollab,
    layout: "/top-manager",
    group: "Collaborateurs"
  },
  {
    path: "historique",
    name: "Historique des modifications",
    icon: "nc-icon nc-time-alarm",
    component: HistoriqueModifications,
    layout: "/top-manager",
    group: "Collaborateurs"
  },

  // 🎓 Formations
  {
    path: "gestion-programme",
    name: "Programmes",
    icon: "nc-icon nc-bullet-list-67",
    component: GestionProgramme,
    layout: "/top-manager",
    group: "Formations"
  },
  {
    path: "gestion-formations",
    name: "Formations",
    icon: "bi bi-journal-text",
    component: GestionFormations,
    layout: "/top-manager",
    group: "Formations"
  },
  {
    path: "planifier-session",
    name: "Sessions",
    icon: "nc-icon nc-simple-add",
    component: PlanifierSession,
    layout: "/top-manager",
    group: "Formations"
  },
 {
  path: "/suivi-participants",
  name: "Suivi des participants",
  icon: "bi bi-people-fill",
  component: SuiviParticipants,
  layout: "/top-manager",
},

  // 🤖 IA
  {
    path: "fiche-review",
    name: "People Review IA",
    icon: "bi bi-chat-square-text-fill",
    component: FicheReview,
    layout: "/top-manager"
  },
];

export default topManagerRoutes;
