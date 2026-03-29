export default function handler(req, res) {
  console.log("Handler minimal appelé ! Méthode:", req.method);
  res.status(200).json({ voies: [], ouvreurs: [] });
}