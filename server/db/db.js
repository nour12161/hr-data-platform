import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL
});

pool.connect()
    .then(() => console.log("✅ Connecté à PostgreSQL avec succès"))
    .catch((err) => console.error("❌ Erreur de connexion PostgreSQL :", err));

export default pool;
