// api/topodata.js
module.exports = async function handler(req, res) {
  console.log("TOKEN:", process.env.GITHUB_TOKEN ? "OK" : "NON DEFINI");

  if (!process.env.GITHUB_TOKEN) {
    return res.status(500).json({ error: "TOKEN GitHub non défini" });
  }
 
  if (req.method === "GET") {
    return res.status(200).json({ voies: [], ouvreurs: [] });
  }

  if (req.method === "POST") {
    const body = req.body;
    console.log("POST body reçu:", body);
    return res.status(200).json(body);
  }

  res.status(405).json({ error: "Méthode non autorisée" });
};
