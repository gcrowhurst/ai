// In-memory store — persists while the serverless instance is warm.
// For a 50-min workshop this is reliable; Vercel keeps instances alive during active use.
let boardData = {};

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    return res.json(boardData);
  }

  if (req.method === "POST") {
    const incoming = req.body;
    if (!incoming || typeof incoming !== "object") {
      return res.status(400).json({ error: "Invalid body" });
    }
    // Merge: keep entry with latest timestamp per question
    for (const [key, val] of Object.entries(incoming)) {
      if (!boardData[key] || (val.time && val.time >= (boardData[key].time || 0))) {
        boardData[key] = val;
      }
    }
    return res.json(boardData);
  }

  if (req.method === "DELETE") {
    boardData = {};
    return res.json({ ok: true });
  }

  res.status(405).json({ error: "Method not allowed" });
}
