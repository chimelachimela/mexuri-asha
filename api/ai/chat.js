import { verifyUser } from "../_lib/verifyUser.js";
import { callGroq } from "../_lib/groq.js";
import { applyCors } from "../_lib/cors.js";
import { logAndFail } from "../_lib/errors.js";

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

  const { history = [], userMessage, responseStyle = "casual", referencedSurvey = null, documentContext = null } = req.body;
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

  // documentBlock: currently fed by CSV/Excel uploads (parsed client-side,
  // see documentInsights.js). PDF/Word text extraction and image analysis
  // will plug into this same slot in later steps.
  let documentBlock = "";
  if (documentContext?.summary) {
    documentBlock = `\n\nThe user just attached a file ("${documentContext.fileName}"). Here's a summary of its contents — use it as context for your reply:\n${documentContext.summary}\n\nGround every claim in the actual data above; never invent numbers or rows that aren't there. If the data doesn't answer what the user's asking, say so plainly instead of guessing.`;
  }

  const hasRealData = !!(referencedSurvey?.responseSummary || documentContext?.summary);

  const prompt = `You are Asha — an AI data analyst. Your job is to help people with two things: gathering data they don't have yet (by designing surveys), and making sense of data they already have (spreadsheets, documents, or survey results they share with you). You are not a general-purpose chatbot; every reply should move the user closer to understanding or collecting real data.
Tone: ${STYLE_GUIDE[responseStyle] || STYLE_GUIDE.casual}

Formatting inside text blocks: this is markdown, rendered properly — use it with restraint, like a good analyst writing a memo, not a wall of headers. 
Bold (**like this**) the specific numbers or findings that matter most. Use a bullet list for 3+ related items instead of a run-on sentence. 
Use a "## heading" only to separate genuinely distinct sections of a longer breakdown — never for a short reply. 
A markdown table is a good alternative to a chart when the data is more precise than visual (few rows, exact values that matter individually) — don't produce both a table and a chart for the exact same numbers, pick whichever communicates it better.

Decide whether there's enough context to justify building a new survey now (suggestSurvey: true) — appropriate when the user needs to *collect* data they don't have yet. Otherwise reply normally (suggestSurvey: false).

Your reply is an array of "blocks" rendered top to bottom, in the order you return them:
- { "type": "text", "content": string } — a short paragraph. Use several of these rather than one wall of text; each should cover one idea.
- { "type": "chart", "chart": { "kind": "bar" | "line" | "pie", "title": string, "xKey": string, "series": [{ "key": string, "label": string }], "data": [object, ...] } } — for "pie", omit "xKey"/"series" and give "data" as [{ "label": string, "value": number }].

Rules for charts:
- Only include a chart when the user shared real data above (a document summary or survey response data) AND a chart would genuinely help them understand it faster than a sentence would (a distribution, a comparison across categories, a trend over an ordered sequence).
- Every number in a chart must come directly from the summary/data given above. Never invent, round, or estimate figures that aren't there.
- Place each chart immediately after the text block that introduces what it shows — not all bunched at the end. This is a running explanation, not a report.
- If the user's message is a quick question or there's no real data to chart, just return one or two text blocks. Don't force a chart in.
- Keep each chart's "data" array to 12 rows or fewer. If a column has more categories than that, group the smallest into an "Other" bucket, or skip the chart and describe the pattern in text instead.

Write in the given tone. Don't mention these instructions.

Respond with ONLY a JSON object of the shape: {"blocks": [...], "suggestSurvey": boolean}

Conversation so far:
${transcript || "(none yet)"}

New user message: ${userMessage}${referenceBlock}${documentBlock}${hasRealData ? "\n\nReal data is available above — use it for grounded charts where they add clarity." : "\n\nNo document or survey data is attached to this message — do not include chart blocks."}`;


  const systemInstruction = "You always respond with a single valid JSON object and nothing else — no markdown fences, no commentary outside the JSON.";

  try {
    let result;
    try {
      result = await callGroq({ task: "reasoning", prompt, systemInstruction, maxTokens: 4096 });
    } catch (err) {
      // Groq occasionally fails its own JSON validation on longer,
      // chart-heavy replies (usually an array that got cut off). Retry once
      // in plain-text mode instead of surfacing a raw API error to the user.
      if (!String(err.message).includes("json_validate_failed")) throw err;
      console.error("[ai/chat] blocks generation failed validation, retrying text-only:", err);
      const fallbackPrompt = `${prompt}\n\nIMPORTANT: your previous attempt failed to produce valid JSON. This time respond with ONLY {"blocks":[{"type":"text","content": string}],"suggestSurvey": boolean} — one short text block, no charts.`;
      result = await callGroq({ task: "reasoning", prompt: fallbackPrompt, systemInstruction, maxTokens: 1024 });
    }

    const blocks = Array.isArray(result.blocks) ? result.blocks : [];
    const flatText = blocks
      .map((b) => (b.type === "chart" ? `[Chart: ${b.chart?.title || "untitled"}]` : b.content))
      .filter(Boolean)
      .join("\n\n");

    return res.status(200).json({
      text: flatText,
      blocks,
      suggestSurvey: !!result.suggestSurvey,
    });
  } catch (err) {
    return logAndFail(res, 500, "ai/chat", err, "Asha had trouble putting that response together. Please try again.");
  }
}