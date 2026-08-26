import { verifyUser } from "../_lib/verifyUser.js";
import { callGroq } from "../_lib/groq.js";
import { applyCors } from "../_lib/cors.js";
import { logAndFail } from "../_lib/errors.js";
import { BRAND_RULES } from "../_lib/brand.js";
import { getCached, setCached, normalizeCacheKey } from "../_lib/aiCache.js";

const STYLE_GUIDE = {
  casual: "Friendly, relaxed, conversational. Contractions are fine.",
  corporate: "Formal, structured, professional tone.",
  analytical: "Precise, methodical, data-first framing.",
  concise: "Short, direct, no fluff. Minimal words.",
};

function shouldUseLightModel({ history, referencedSurvey, documentContexts }) {
  return history.length === 0 && !referencedSurvey && !documentContexts?.length;
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  const user = await verifyUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { history = [], userMessage, responseStyle = "casual", referencedSurvey = null, documentContexts = [] } = req.body;
  const transcript = history.map((m) => `${m.role.toUpperCase()}: ${m.text}`).join("\n");
  const simpleRequest = shouldUseLightModel({ history, referencedSurvey, documentContexts });

  // Cache only context-free, first-turn requests. Never reuse a response that
  // could contain survey, document, or conversation-specific information.
  const cacheKey = simpleRequest
    ? `${responseStyle}:${normalizeCacheKey(userMessage || "")}`
    : null;
  if (cacheKey) {
    const cached = getCached(cacheKey);
    if (cached) return res.status(200).json(cached);
  }

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

  let documentBlock = "";
  for (const [i, d] of (documentContexts || []).entries()) {
    if (!d?.summary) continue;
    documentBlock += `\n\nFile ${i + 1}: "${d.fileName}"\n${d.summary}`;
  }
  const hasRealData = !!(referencedSurvey?.responseSummary || documentBlock);

  const prompt = `You are Asha — an AI survey analyst. Your job is to help people with two things only: designing surveys to gather data they don't have yet, and making sense of survey response data they already have. You are not a general-purpose chatbot; every reply should move the user closer to a well-designed survey or a clear finding from their results.
Tone: ${STYLE_GUIDE[responseStyle] || STYLE_GUIDE.casual}

${BRAND_RULES}

Respond with ONLY a JSON object of the shape: {"blocks":[{"type":"text","content":string}],"suggestSurvey":boolean} or include chart blocks when real data makes a chart genuinely useful. Ground every number in supplied data and never invent findings.

Conversation so far:
${transcript || "(none yet)"}

New user message: ${userMessage}${referenceBlock}${documentBlock}${hasRealData ? "\n\nReal data is available above — use it for grounded charts where they add clarity." : "\n\nNo document or survey data is attached to this message — do not include chart blocks."}`;

  const systemInstruction = "You always respond with a single valid JSON object and nothing else — no markdown fences, no commentary outside the JSON.";

  try {
    let result;
    try {
      result = await callGroq({
        task: simpleRequest ? "light" : "reasoning",
        prompt,
        systemInstruction,
        maxTokens: simpleRequest ? 1024 : 4096,
      });
    } catch (err) {
      if (!String(err.message).includes("json_validate_failed")) throw err;
      const fallbackPrompt = `${prompt}\n\nIMPORTANT: respond with ONLY {"blocks":[{"type":"text","content":string}],"suggestSurvey":boolean}.`;
      result = await callGroq({ task: simpleRequest ? "light" : "reasoning", prompt: fallbackPrompt, systemInstruction, maxTokens: 1024 });
    }

    const blocks = Array.isArray(result.blocks) ? result.blocks : [];
    const response = {
      text: blocks.map((b) => (b.type === "chart" ? `[Chart: ${b.chart?.title || "untitled"}]` : b.content)).filter(Boolean).join("\n\n"),
      blocks,
      suggestSurvey: !!result.suggestSurvey,
    };

    if (cacheKey) setCached(cacheKey, response);
    return res.status(200).json(response);
  } catch (err) {
    return logAndFail(res, 500, "ai/chat", err, "Asha had trouble putting that response together. Please try again.");
  }
}