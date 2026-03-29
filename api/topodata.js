// api/topodata.js
import fetch from "node-fetch";

const GITHUB_REPO = "TiagoDuarte44690/topo-escalade";
const FILE_PATH = "topodata.json";
const BRANCH = "main";
const TOKEN = process.env.GITHUB_TOKEN; // doit être défini sur Vercel

// --- Récupérer les données depuis GitHub ---
async function fetchFromGitHub() {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}?ref=${BRANCH}`, {
    headers: { Authorization: `token ${TOKEN}` }
  });
  if(res.status === 404) return { voies: [], ouvreurs: [] }; // fichier inexistant
  if(!res.ok) throw new Error(`GitHub GET error: ${res.status}`);
  const data = await res.json();
  const content = JSON.parse(Buffer.from(data.content, "base64").toString());
  return { content, sha: data.sha };
}

// --- Envoyer les données vers GitHub ---
async function pushToGitHub(content, sha) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, {
    method: "PUT",
    headers: { 
      Authorization: `token ${TOKEN}`, 
      "Content-Type": "application/json" 
    },
    body: JSON.stringify({
      message: "Mise à jour topodata.json via Vercel",
      content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
      sha, // undefined si fichier inexistant → GitHub crée le fichier
      branch: BRANCH
    })
  });
  if(!res.ok) throw new Error(`GitHub PUT error: ${res.status}`);
}

// --- Handler API ---
export default async function handler(req, res) {
  if(!TOKEN) return res.status(500).json({ error: "TOKEN GitHub non défini" });

  if(req.method === "GET") {
    try {
      const { content } = await fetchFromGitHub();
      res.status(200).json(content);
    } catch(err) {
      console.error(err);
      res.status(500).json({ error: "Impossible de récupérer les données depuis GitHub" });
    }
  } 
  else if(req.method === "POST") {
    try {
      const body = req.body;
      const { sha } = await fetchFromGitHub(); // récupère sha si existant
      await pushToGitHub(body, sha);
      res.status(200).json(body);
    } catch(err) {
      console.error(err);
      res.status(500).json({ error: "Impossible de sauvegarder les données sur GitHub" });
    }
  } 
  else {
    res.status(405).json({ error: "Méthode non autorisée" });
  }
}
