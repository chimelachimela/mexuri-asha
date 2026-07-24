// groq.js — talks to Groq's OpenAI-compatible /chat/completions endpoint
// instead of Gemini. Groq's inference is dramatically faster than Gemini
// Flash for these text-in/JSON-out tasks, which is most of what was making
// the app feel slow.
//
// Set GROQ_API_KEY in your environment (Vercel → Project → Settings →
// Environment Variables, and a local .env for `npm run dev`). Get a key at
// https://console.groq.com/keys
//
// Model: Llama 3.3 70B — Groq's flagship general-purpose Llama model. Good
// balance of quality and speed for chat + structured JSON generation. Swap
// GROQ_MODEL below (or set a GROQ_MODEL env var) if you want a different
// Llama size, e.g. "llama-3.1-8b-instant" for even faster/cheaper replies.
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Groq's JSON mode (response_format: { type: "json_object" }) just guarantees
// *valid* JSON — it doesn't enforce a specific shape the way Gemini's
// responseSchema did. So we describe the exact shape we want directly in the
// prompt and validate/normalize the result ourselves after parsing.
export async function callGroq({ systemInstruction, prompt }) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to your environment (Vercel env vars, or .env for local dev)."
    );
  }

  const messages = [];
  if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
  messages.push({ role: "user", content: prompt });

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.6,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty Groq response");

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Groq returned malformed JSON");
  }
}
