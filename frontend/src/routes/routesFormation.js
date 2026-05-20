import GestionProgramme from "views/GestionProgramme";
import GestionFormations from "views/GestionFormations";
import PlanifierSession from "views/PlanifierSession";
import SuiviParticipants from "views/SuiviParticipants";
import ChangePassword from "views/ChangePassword";

const formationRoutes = [
  {
    path: "gestion-programme",
    name: "Programmes",
    icon: "nc-icon nc-bullet-list-67",
    component: GestionProgramme,
    layout: "/formation",
    
  },
  {
    path: "gestion-formations",
    name: "Formations",
    icon: "bi bi-journal-text",
    component: GestionFormations,
    layout: "/formation",
    
  },
  {
    path: "planifier-session",
    name: "Sessions",
    icon: "nc-icon nc-simple-add",
    component: PlanifierSession,
    layout: "/formation",
    
  },
  {
    path: "suivi-participants/:sessionId",
    name: "Suivi des participants",
    icon: "bi bi-clipboard-check",
    component: SuiviParticipants,
    layout: "/formation",
    
  },
  {
    path: "changer-mdp",
    name: "Changer mot de passe",
    icon: "nc-icon nc-key-25",
    component: ChangePassword,
    layout: "/formation",
    inSidebar: false
  }
];

export default formationRoutes;
