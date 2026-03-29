import fs from "fs";
import path from "path";

const DATA_FILE = path.resolve("./topodata.json"); // ton JSON local dans le projet

export default async function handler(req, res) {
  if(req.method === "GET") {
    try {
      const data = fs.existsSync(DATA_FILE)
        ? JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"))
        : { voies: [], ouvreurs: [] };
      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ error: "Impossible de lire le JSON" });
    }
  } else if(req.method === "POST") {
    try {
      const body = req.body;
      fs.writeFileSync(DATA_FILE, JSON.stringify(body, null, 2), "utf-8");
      res.status(200).json(body);
    } catch (err) {
      res.status(500).json({ error: "Impossible de sauvegarder le JSON" });
    }
  } else {
    res.status(405).json({ error: "Méthode non autorisée" });
  }
}
