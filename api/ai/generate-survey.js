import { verifyUser } from "../_lib/verifyUser.js";
import { callGroq } from "../_lib/groq.js";
import { applyCors } from "../_lib/cors.js";

const VALID_TYPES = new Set(["single", "multi", "text", "scale"]);

export default async function handler(req, res) {
  if (applyCors(req, res)) return; // handles the OPTIONS preflight
  if (req.method !== "POST") return res.status(405).end();

  const user = await verifyUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { chatContext } = req.body;
  const prompt = `Based on this conversation, design a survey with 4-6 questions that would gather useful, decision-relevant data.

Conversation context: ${chatContext}

Each question is one of: "single" (single choice), "multi" (multiple choice), "text" (open-ended, no options), "scale" (1-5 rating, options must be ["1","2","3","4","5"]). Give 4-6 realistic, specific options for single/multi questions — not generic placeholders.

Respond with ONLY a JSON object of this shape:
{"title": string, "description": string, "questions": [{"type": "single"|"multi"|"text"|"scale", "text": string, "options": string[]}, ...]}
(omit "options" or use an empty array for "text" questions)`;

  try {
    const result = await callGroq({
      prompt,
      systemInstruction: "You always respond with a single valid JSON object and nothing else — no markdown fences, no commentary outside the JSON.",
    });

    const questions = (Array.isArray(result.questions) ? result.questions : [])
      .filter((q) => VALID_TYPES.has(q.type) && q.text)
      .map((q) => ({
        id: crypto.randomUUID(),
        type: q.type,
        text: q.text,
        options: q.type === "text" ? undefined : Array.isArray(q.options) ? q.options : [],
      }));

    return res.status(200).json({
      title: result.title || "Untitled survey",
      description: result.description || "",
      questions,
    });
  } catch (err) {
    console.error(err);
    return logAndFail(res, 500, "ai/generate-survey", err, "Couldn't build the survey. Please try again.");
  }
}
