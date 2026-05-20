// index.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';

// 📦 Connexion PostgreSQL (pas besoin d'appeler connect, juste import pour les routes)
import pool from './db/db.js';

// 🛣️ Routes
import authRouter from './routes/auth.js';
import uploadRouter from './routes/upload.js';
import collaborateursRoutes from './routes/collaborateurs.js';
import kpiRoutes from "./routes/kpi.js";
import uploadFormationRouter from "./routes/uploadFormation.js";
import importExcelRouter from './routes/upload.js';
import dictionnaireRoutes from './routes/dictionnaires.js';
import uploadProgrammeRouter from "./routes/uploadProgramme.js";
import uploadParticipationRoute from "./routes/uploadParticipation.js"; 
import formationRouter from './routes/formations.js';
import sessionsRouter from './routes/sessions.js';
import prestatairesRouter from './routes/prestataires.js';
import historiqueRouter from "./routes/historique.js";
import usersRouter from './routes/users.js';
import programmeRoutes from "./routes/programmes.js";
import participationRoutes from "./routes/participations.js";
import peopleReviewRoute from "./routes/peopleReview.js";
import llmRoutes from './routes/llmRoutes.js';
import notificationsRouter from './routes/notifications.js';
const app = express();

// 🛡️ Middlewares globaux
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🐛 Debug middleware pour auth
app.use('/api/auth', (req, res, next) => {
  console.log(`🔥 [${req.method}] ${req.originalUrl}`);
  next();
});

// 📡 Routes
app.use('/api/auth', authRouter);
app.use('/api/upload', uploadRouter);
app.use('/uploads', express.static(path.resolve('uploads')));
app.use("/api/kpi", kpiRoutes);
app.use('/api/collaborateurs', collaborateursRoutes);
app.use("/api", uploadFormationRouter);
app.use("/api/programmes", uploadProgrammeRouter);
app.use('/api/import', importExcelRouter);
app.use('/api/dictionnaires', dictionnaireRoutes);
app.use("/api", uploadParticipationRoute);
app.use('/api/formations', formationRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/prestataires', prestatairesRouter);
app.use("/api/historique", historiqueRouter);
app.use("/api/users", usersRouter);
app.use("/api/programmes", programmeRoutes);
app.use("/api/participations", participationRoutes);
app.use("/api/people-review", peopleReviewRoute);
app.use('/api', llmRoutes);
app.use('/api/notifications', notificationsRouter);



// 🚀 Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
