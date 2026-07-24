import { verifyUser } from "../_lib/verifyUser.js";
import { callGroq } from "../_lib/groq.js";
import { applyCors } from "../_lib/cors.js";

export default async function handler(req, res) {
  if (applyCors(req, res)) return; // handles the OPTIONS preflight
  if (req.method !== "POST") return res.status(405).end();

  const user = await verifyUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { firstMessage } = req.body;
  const prompt = `Give a short 2-5 word title summarizing what this chat is about, based on its first message. No ending punctuation, no quotes around it.

Message: ${firstMessage}

Respond with ONLY a JSON object of this shape: {"title": string}`;

  try {
    const result = await callGroq({
      prompt,
      systemInstruction: "You always respond with a single valid JSON object and nothing else — no markdown fences, no commentary outside the JSON.",
    });
    return res.status(200).json({ title: result.title || "New chat" });
  } catch (err) {
    console.error(err);
    // Non-fatal — fall back rather than blocking the chat.
    return res.status(200).json({ title: "New chat" });
  }
}
