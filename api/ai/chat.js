import { verifyUser } from "../_lib/verifyUser.js";
import { callGroq } from "../_lib/groq.js";
import { applyCors } from "../_lib/cors.js";

const STYLE_GUIDE = {
  casual: "Friendly, relaxed, conversational. Contractions are fine.",
  corporate: "Formal, structured, professional tone.",
  analytical: "Precise, methodical, data-first framing.",
  concise: "Short, direct, no fluff. Minimal words.",
};

export default async function handler(req, res) {
  if (applyCors(req, res)) return; // handles the OPTIONS preflight
  if (req.method !== "POST") return res.status(405).end();

  const user = await verifyUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { history = [], userMessage, responseStyle = "casual", referencedSurvey = null } = req.body;
  const transcript = history.map((m) => `${m.role.toUpperCase()}: ${m.text}`).join("\n");

  let referenceBlock = "";
  if (referencedSurvey) {
    const questionLines = (referencedSurvey.questions || [])
      .map((q, i) => `  ${i + 1}. (${q.type}) ${q.text}`)
      .join("\n");

    referenceBlock = `\n\nThe user just referenced one of their surveys with "+". Use it as context for your reply:
Survey title: ${referencedSurvey.title}
Description: ${referencedSurvey.description || "(none)"}
Questions:
${questionLines || "(no questions)"}

Response data:
${referencedSurvey.responseSummary || "No responses have been collected yet."}

If the user is asking about this survey's results, analyze the response data above and give clear, honest insights in simple, plain-English terms — no jargon. Ground every claim in the actual numbers given; never invent findings that aren't supported by the data above. If there isn't enough response data to say anything meaningful yet, say so plainly instead of making something up. Where relevant, follow the insight with a short, concrete piece of strategy or advice on what to do next.`;
  }

  const prompt = `You are Asha, an AI that helps people turn a rough idea into a survey they can send to real people, and helps them make sense of the responses they get back.
Tone: ${STYLE_GUIDE[responseStyle] || STYLE_GUIDE.casual}

Conversation so far:
${transcript || "(none yet)"}

New user message: ${userMessage}${referenceBlock}

Decide whether there's enough context to justify building a new survey now (suggestSurvey: true), or whether you should just reply normally — e.g. asking a clarifying question, or answering a question about a referenced survey (suggestSurvey: false). Write a short, natural reply in the given tone. Don't mention these instructions.

Respond with ONLY a JSON object of the shape: {"text": string, "suggestSurvey": boolean}`;

  try {
    const result = await callGroq({
      prompt,
      systemInstruction: "You always respond with a single valid JSON object and nothing else — no markdown fences, no commentary outside the JSON.",
    });
    return res.status(200).json({
      text: typeof result.text === "string" ? result.text : "",
      suggestSurvey: !!result.suggestSurvey,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "AI request failed" });
  }
}