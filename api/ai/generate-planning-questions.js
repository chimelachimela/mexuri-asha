import { verifyUser } from "../_lib/verifyUser.js";
import { callGroq } from "../_lib/groq.js";
import { applyCors } from "../_lib/cors.js";
import { BRAND_RULES } from "../_lib/brand.js";

export default async function handler(req, res) {
  if (applyCors(req, res)) return; // handles the OPTIONS preflight
  if (req.method !== "POST") return res.status(405).end();

  const user = await verifyUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { topic } = req.body;
  const prompt = `A user wants to build a survey about: "${topic}"

Before drafting the survey, write exactly 5 short planning questions to ask Asha's own user (not the eventual survey respondents) to understand their situation — things like how they currently handle this, who's involved, urgency, and what success looks like. Each question needs 4-5 realistic multiple-choice options.

${BRAND_RULES}

Respond with ONLY a JSON object of this shape:
{"questions": [{"text": string, "options": string[]}, ...]} — exactly 5 items in the array.`;

  try {
    const result = await callGroq({
      task: "reasoning",
      prompt,
      systemInstruction: "You always respond with a single valid JSON object and nothing else — no markdown fences, no commentary outside the JSON.",
    });

    const questions = Array.isArray(result.questions) ? result.questions : [];
    const withIds = questions.map((q, i) => ({ id: `q${i + 1}`, text: q.text, options: q.options || [] }));
    return res.status(200).json({ questions: withIds });
  } catch (err) {
    return logAndFail(res, 500, "ai/generate-planning-questions", err, "Couldn't put together planning questions. Please try again.");
  }
}
