// In-memory store for session feedback
let feedbackData = [];

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    return res.json(feedbackData);
  }

  if (req.method === "POST") {
    const entry = req.body;
    if (!entry || !entry.name || !entry.value) {
      return res.status(400).json({ error: "Invalid body" });
    }
    // Prevent duplicate from same user
    const exists = feedbackData.find(f => f.name === entry.name);
    if (!exists) {
      feedbackData.push(entry);
    }
    return res.json(feedbackData);
  }

  if (req.method === "DELETE") {
    feedbackData = [];
    return res.json({ ok: true });
  }

  res.status(405).json({ error: "Method not allowed" });
}
