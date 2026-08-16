const MODEL_CONFIG = {
  vision: { primary: "qwen/qwen3.6-27b", fallback: "qwen/qwen3.6-27b" },
  reasoning: { primary: "openai/gpt-oss-120b", fallback: "openai/gpt-oss-20b" },
  light: { primary: "openai/gpt-oss-20b", fallback: "openai/gpt-oss-120b" },
};
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function callGroq({ task = "reasoning", systemInstruction, prompt, content, maxTokens = 2048 }) {
  const models = MODEL_CONFIG[task] || MODEL_CONFIG.reasoning;
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to your environment (Vercel env vars, or .env for local dev)."
    );
  }

  async function attempt(model) {
    const messages = [];
    if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
    messages.push({ role: "user", content: content || prompt });

    return fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        response_format: { type: "json_object" },
        temperature: 0.6,
        max_tokens: maxTokens,
      }),
    });
  }

  let res = await attempt(models.primary);

  if ((res.status === 429 || res.status >= 500) && models.fallback !== models.primary) {
    console.error(`[groq] ${models.primary} unavailable (${res.status}), retrying on ${models.fallback}`);
    res = await attempt(models.fallback);
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  console.log("[groq] usage:", data.usage);
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty Groq response");

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Groq returned malformed JSON");
  }
}