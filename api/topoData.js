// api/topoData.js
import fs from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "topoData.json");

export default async function handler(req, res) {
  // Lire le JSON
  let data = { voies: [], ouvreurs: [] };
  try {
    data = JSON.parse(fs.readFileSync(FILE, "utf-8"));
  } catch (e) {}

  if (req.method === "GET") {
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    // Mise à jour JSON
    const { voies, ouvreurs } = req.body;
    const newData = { voies, ouvreurs };
    fs.writeFileSync(FILE, JSON.stringify(newData, null, 2), "utf-8");
    return res.status(200).json(newData);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}