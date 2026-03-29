// api/topodata.js
export default function handler(req, res) {
  console.log("Handler appelé ! Méthode:", req.method);
  res.status(200).json({ voies: [], ouvreurs: [] });
}