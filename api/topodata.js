// api/topodata.js
import fetch from "node-fetch";

const GITHUB_REPO = "TiagoDuarte44690/topo-escalade";
const FILE_PATH = "topodata.json";
const BRANCH = "main";
const TOKEN = process.env.GITHUB_TOKEN;

async function fetchFromGitHub() {
  if (!TOKEN) throw new Error("GITHUB_TOKEN non défini");
  
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}?ref=${BRANCH}`, {
    headers: { Authorization: `token ${TOKEN}` }
  });

  if (res.status === 404) return { content: { voies: [], ouvreurs: [] }, sha: undefined };
  if (!res.ok) {
    const text = await res.text();
    console.error("GitHub GET failed:", res.status, text);
    throw new Error(`GitHub GET error: ${res.status}`);
  }

  const data = await res.json();
  let content;
  try {
    content = JSON.parse(Buffer.from(data.content, "base64").toString());
  } catch(e) {
    console.error("Erreur parsing content GitHub:", e, data.content);
    content = { voies: [], ouvreurs: [] };
  }
  
  return { content, sha: data.sha };
}

async function pushToGitHub(content, sha) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, {
    method: "PUT",
    headers: { Authorization: `token ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Mise à jour topodata.json via Vercel",
      content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
      sha,
      branch: BRANCH
    })
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("GitHub PUT failed:", res.status, text);
    throw new Error(`GitHub PUT error: ${res.status}`);
  }
}

export default async function handler(req, res) {
  try {
    if (!TOKEN) return res.status(500).json({ error: "GITHUB_TOKEN non défini" });

    if (req.method === "GET") {
      const { content } = await fetchFromGitHub();
      return res.status(200).json(content);
    }

    if (req.method === "POST") {
      const body = req.body;
      const { sha } = await fetchFromGitHub();
      await pushToGitHub(body, sha);
      return res.status(200).json(body);
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (err) {
    console.error("Erreur handler:", err);
    return res.status(500).json({ error: err.message });
  }
}