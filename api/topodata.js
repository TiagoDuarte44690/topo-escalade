import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const DATA_FILE = path.resolve("./topodata.json"); // ✅ nom en minuscules
const GITHUB_REPO = "TiagoDuarte44690/topo-escalade";
const FILE_PATH = "topodata.json"; // ✅ nom en minuscules
const BRANCH = "main";
const TOKEN = process.env.GITHUB_TOKEN; // ⚠️ défini côté Vercel

async function pushToGitHub(content) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}?ref=${BRANCH}`, {
    headers: { Authorization: `token ${TOKEN}` }
  });
  const data = await res.json();
  const sha = data.sha;

  await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, {
    method: "PUT",
    headers: { Authorization: `token ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Mise à jour topodata.json via Vercel",
      content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
      sha,
      branch: BRANCH
    })
  });
}

export default async function handler(req, res) {
  if(req.method === "GET") {
    try {
      const data = fs.existsSync(DATA_FILE)
        ? JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"))
        : { voies: [], ouvreurs: [] };
      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ error: "Impossible de lire topodata.json" });
    }
  } else if(req.method === "POST") {
    try {
      const body = req.body;
      fs.writeFileSync(DATA_FILE, JSON.stringify(body, null, 2), "utf-8");

      if(TOKEN) {
        await pushToGitHub(body);
      }

      res.status(200).json(body);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Impossible de sauvegarder topodata.json" });
    }
  } else {
    res.status(405).json({ error: "Méthode non autorisée" });
  }
}
