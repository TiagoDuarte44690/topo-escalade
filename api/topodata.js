// api/topodata.js
export default function handler(req, res) {
  console.log("✅ Handler appelé !");
  console.log("Méthode:", req.method);
  console.log("Body:", req.body);

  try {
    if(req.method === "GET") {
      console.log("📤 GET : renvoi JSON vide");
      return res.status(200).json({ voies: [], ouvreurs: [] });
    }

    if(req.method === "POST") {
      console.log("📥 POST reçu :", req.body);
      // renvoi ce qu'on a reçu
      return res.status(200).json(req.body);
    }

    console.log("⚠️ Méthode non autorisée :", req.method);
    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch(e) {
    console.error("💥 ERREUR handler:", e);
    return res.status(500).json({ error: e.message });
  }
}