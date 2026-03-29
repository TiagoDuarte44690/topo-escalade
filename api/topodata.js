export default async function handler(req, res) {
  console.log("TOKEN:", process.env.GITHUB_TOKEN ? "OK" : "NON DEFINI");
  if (!process.env.GITHUB_TOKEN) return res.status(500).json({ error: "TOKEN GitHub non défini" });
  ...
}