// api/topodata.js
import fetch from "node-fetch";

const GITHUB_REPO = "TiagoDuarte44690/topo-escalade";
const FILE_PATH = "topodata.json";
const BRANCH = "main";
const TOKEN = process.env.GITHUB_TOKEN;

// Stockage local temporaire pour fallback
let localData = { voies: [], ouvreurs: [] };

async function fetchFromGitHub() {
  if (!TOKEN) throw new Error("GITHUB_TOKEN non défini");

  console.log("🔹 GitHub GET:", FILE_PATH);
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}?ref=${BRANCH}`, {
      headers: { Authorization: `token ${TOKEN}` }
    });

    if (res.status === 404) {
      console.log("📂 Fichier GitHub inexistant, on initialise vide");
      return { content: { voies: [], ouvreurs: [] }, sha: undefined };
    }

    if (!res.ok) {
      const text = await res.text();
      console.error("❌ GitHub GET error:", res.status, text);
      throw new Error(`GitHub GET error: ${res.status}`);
    }

    const data = await res.json();
    const content = JSON.parse(Buffer.from(data.content, "base64").toString());
    console.log("✅ GitHub GET OK");
    return { content, sha: data.sha };

  } catch (err) {
    console.error("💥 Erreur fetchFromGitHub:", err);
    return { content: localData, sha: undefined }; // fallback
  }
}

async function pushToGitHub(content, sha) {
  if (!TOKEN) throw new Error("GITHUB_TOKEN non défini");
  console.log("🔹 GitHub PUT:", FILE_PATH);
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, {
      method: "PUT",
      headers: { Authorization: `token ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Mise à jour topodata.json via Vercel",
        content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
        sha, // undefined si fichier inexistant → GitHub crée le fichier
        branch: BRANCH
      })
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("❌ GitHub PUT error:", res.status, text);
      throw new Error(`GitHub PUT error: ${res.status}`);
    }
    console.log("✅ GitHub PUT OK");

  } catch (err) {
    console.error("💥 Erreur pushToGitHub:", err);
    throw err;
  }
}

export default async function handler(req, res) {
  try {
    console.log("📌 Handler appelé. Méthode:", req.method);

    if (!TOKEN) console.warn("⚠️ GITHUB_TOKEN non défini");

    if (req.method === "GET") {
      const { content } = await fetchFromGitHub();
      localData = content; // mettre à jour fallback
      return res.status(200).json(content);
    }

    if (req.method === "POST") {
      const body = req.body;
      console.log("📥 POST reçu :", body);

      const { sha, content: currentData } = await fetchFromGitHub();

      // Merge simple pour multijoueur
      const newData = { ...currentData, ...body };
      localData = newData;

      if (TOKEN) {
        try {
          await pushToGitHub(newData, sha);
        } catch(e) {
          console.warn("⚠️ GitHub PUT échoué, sauvegarde locale utilisée", e);
        }
      } else {
        console.warn("⚠️ Pas de TOKEN, sauvegarde locale seulement");
      }

      return res.status(200).json(newData);
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (err) {
    console.error("💥 Erreur handler:", err);
    return res.status(500).json({ error: err.message });
  }
}