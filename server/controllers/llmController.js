import axios from 'axios';
import pg from 'pg';

const TOGETHER_API_KEY = '3e29fe4cff91f5bfd3c3e35c267cb9ee6b933ad3856ccff360495da327accd8e';
const { Client } = pg;

// 🧠 Historique conversationnel global
let conversationHistory = [];

// 🔍 Lecture dynamique du schéma PostgreSQL
async function getDatabaseSchema(client) {
  const res = await client.query(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `);

  const tables = {};
  for (const row of res.rows) {
    const { table_name, column_name, data_type } = row;
    if (!tables[table_name]) tables[table_name] = [];
    tables[table_name].push(`- ${column_name} (${data_type})`);
  }

  return Object.entries(tables)
    .map(([table, columns]) => `Table: ${table}\n${columns.join('\n')}`)
    .join('\n\n');
}

// ✅ Fonction pour nettoyer le SQL
function cleanSQL(sql) {
  const match = sql.match(/```(?:vbnet|sql)?\s*([\s\S]*?)\s*```/i);
  return match ? match[1].trim() : sql.trim();
}

// ✅ Fonction pour remplacer :param par $1, $2… avec valeurs issues du contexte
function replaceNamedParams(sql, context) {
  const paramValues = [];
  let index = 1;

  const replacedSQL = sql.replace(/:([a-zA-Z_]+)/g, (_, key) => {
    if (context[key] !== undefined) {
      paramValues.push(context[key]);
      return `$${index++}`;
    } else {
      throw new Error(`Le paramètre :${key} est manquant dans le contexte.`);
    }
  });

  return { sql: replacedSQL, values: paramValues };
}

// 🎯 Route POST /api/repondre
export const repondreQuestion = async (req, res) => {
  const { question } = req.body;

  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'gestion_collaborateurs',
    password: 'admin',
    port: 5432,
  });

  try {
    await client.connect();
    const schema = await getDatabaseSchema(client);

    const lastExchange = [...conversationHistory].reverse().find(e => e.context);
    const lastContext = lastExchange?.context || {};

    const promptSQL = `
Tu es un assistant SQL PostgreSQL. Voici le schéma de la base :
${schema}

📌 Règles à respecter impérativement :

- Ne crée jamais de vue, de table ou de colonne qui n'existe pas dans le schéma.
- Toutes les requêtes doivent être **valide SQL PostgreSQL**.
- La table principale est "collaborateurs", identifiée par la colonne "cuid" (clé primaire).
- Utilise des JOIN explicites pour récupérer les managers :
  - N+1 : JOIN collaborateurs m ON c.n_plus_1_cuid = m.cuid
  - N+2 : JOIN collaborateurs n1 ON c.n_plus_1_cuid = n1.cuid
           JOIN collaborateurs n2 ON n1.n_plus_1_cuid = n2.cuid

🔍 Pour retrouver un collaborateur à partir de son **nom et prénom** :
- Utilise TOUJOURS une recherche insensible à la casse ET sans espace parasite avec LOWER(TRIM(...)).
- Si l’utilisateur écrit deux noms (ex. "abdelkader zouabi"), teste les deux combinaisons possibles :
  (LOWER(TRIM(nom)) = LOWER('abdelkader') AND LOWER(TRIM(prenom)) = LOWER('zouabi'))
  OR
  (LOWER(TRIM(nom)) = LOWER('zouabi') AND LOWER(TRIM(prenom)) = LOWER('abdelkader'))
- Ne jamais filtrer directement avec nom = '...' (sensible à la casse) ❌
- Ne pas utiliser LIKE ou ILIKE ❌ sauf si explicitement demandé

📊 Exemples :

- "Qui est insaf msakni ?" :
  Étape 1 : récupérer le cuid avec LOWER(TRIM())
  Étape 2 : SELECT * FROM collaborateurs WHERE cuid = '...';

- "Qui est le manager de Insaf MSAKNI ?" :
  SELECT m.nom, m.prenom, m.cuid
  FROM collaborateurs c
  JOIN collaborateurs m ON c.n_plus_1_cuid = m.cuid
  WHERE LOWER(TRIM(c.nom)) = LOWER('msakni') AND LOWER(TRIM(c.prenom)) = LOWER('insaf');

- "Qui est zouabi abdelkader ?" :
  SELECT * FROM collaborateurs 
  WHERE 
    (LOWER(TRIM(nom)) = LOWER('abdelkader') AND LOWER(TRIM(prenom)) = LOWER('zouabi')) 
    OR 
    (LOWER(TRIM(nom)) = LOWER('zouabi') AND LOWER(TRIM(prenom)) = LOWER('abdelkader'));

🧠 Contexte collaborateur (si connu) :
${JSON.stringify(lastContext, null, 2)}

❓ Question posée :
"${question}"

Génère uniquement la requête SQL sans explication :
SQL :
`;



    const sqlResponse = await axios.post(
      'https://api.together.xyz/v1/completions',
      {
        model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        prompt: promptSQL,
        max_tokens: 200,
        temperature: 0,
      },
      { headers: { Authorization: `Bearer ${TOGETHER_API_KEY}` } }
    );

    const generatedSQL = sqlResponse.data?.choices?.[0]?.text?.trim();
    if (!generatedSQL) throw new Error("Aucune requête SQL générée.");

    const cleanedSQL = cleanSQL(generatedSQL);
    console.log("🧠 SQL nettoyé :", cleanedSQL);

    if (!cleanedSQL.toLowerCase().startsWith("select")) {
      throw new Error("Requête non valide ou incomplète.");
    }

    // 🔄 Remplacement des paramètres nommés
    let finalSQL = cleanedSQL;
    let queryParams = [];

    try {
      const replaced = replaceNamedParams(cleanedSQL, lastContext);
      finalSQL = replaced.sql;
      queryParams = replaced.values;
    } catch (paramErr) {
      console.error("❌ Erreur de substitution :", paramErr.message);
      return res.status(400).json({ error: paramErr.message });
    }

    const result = await client.query(finalSQL, queryParams);
    console.log("🧠 SQL généré :", generatedSQL);

    const rows = result.rows;
    const firstRow = rows?.[0] || {};
    const newContext = {
      cuid: firstRow.cuid || lastContext.cuid || null,
      nom: firstRow.nom || lastContext.nom || null,
      prenom: firstRow.prenom || lastContext.prenom || null,
      matricule: firstRow.matricule || lastContext.matricule || null,
    };

    conversationHistory.push({
      question,
      sql: generatedSQL,
      result: rows,
      context: newContext,
    });

    const contextInfo = lastContext?.nom
      ? `Collaborateur : ${lastContext.prenom || ""} ${lastContext.nom} (CUID : ${lastContext.cuid || "?"})`
      : '';

const reformulationPrompt = `
Tu es un assistant RH. À partir des résultats SQL ci-dessous, rédige une réponse **en français clair, naturel et concis**, sans jamais inclure de code SQL ni expliquer la requête.

📌 Consignes obligatoires :
- Rédige une réponse professionnelle, fluide et directement compréhensible.
- N’inclus pas la question posée ni la requête SQL utilisée.
- Si aucun résultat n’est trouvé, réponds simplement :
  "Aucune donnée correspondante n’a été trouvée."

📎 Recommandations de style :
- Si le résultat contient uniquement nom, prénom, et cuid :  
  ➤ Exemple : *"Hend CHAFFAI BEN KHEDER est enregistrée dans la base."*

- Si la réponse concerne un lien hiérarchique (ex. manager ou N+2) :  
  ➤ Exemple : *"Insaf MSAKNI est managée par Hend CHAFFAI BEN KHEDER ."*

- S’il y a plusieurs collaborateurs, présente une liste lisible ou une synthèse claire, par exemple :
  ➤ *"Voici les collaborateurs de la direction X :*  
    - Nour Charfeddine  
    - Sami Ben Salah "*

- Utilise une ponctuation propre et une tournure naturelle, comme si tu rédigeais une note RH ou un compte rendu humain.

📍 Contexte collaborateur (si disponible) :
${contextInfo}

❓ Question posée :
${question}

📊 Résultats SQL (format JSON) :
${JSON.stringify(rows, null, 2)}

🗣️ Donne une réponse rédigée naturellement, en français clair et exploitable :
`;


    const reformulation = await axios.post(
      'https://api.together.xyz/v1/completions',
      {
        model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        prompt: reformulationPrompt,
        max_tokens: 300,
        temperature: 0.5,
      },
      { headers: { Authorization: `Bearer ${TOGETHER_API_KEY}` } }
    );

    const answer = reformulation.data?.choices?.[0]?.text?.trim() || "Je n’ai pas trouvé d’information pertinente.";
    console.log("💬 Réponse reformulée :", answer);

    res.json({ answer });

  } catch (err) {
    console.error("❌ Erreur :", err.message);
    res.status(500).json({ error: "Erreur lors du traitement de la question." });
  } finally {
    await client.end();
  }
};
