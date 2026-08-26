// Single-provider setup — Groq only, GPT-OSS models for every task. Asha's
// scope is survey creation + response analysis now (no vision, no sheets),
// so there's no need for the multi-provider fallback chain that used to
// exist here for the general-chat/vision/sheets workload.
const PROVIDERS = {
  groq: {
    url: "https://api.groq.com/openai/v1/chat/completions",
    apiKeyEnv: "GROQ_API_KEY",
    // Groq's free/dev tier enforces an org-wide tokens-per-minute cap that
    // counts prompt + reserved completion tokens together — stay under it.
    defaultTokenBudget: 7800,
  },
};

// task -> which model handles it. Both tasks stay on Groq/GPT-OSS now;
// "reasoning" gets the bigger model as primary since it covers survey
// generation and response-analysis replies, "light" (titles, small
// planning questions) keeps the smaller model primary for speed/cost.
const TASK_CONFIG = {
  reasoning: {
    provider: "groq",
    primary: "openai/gpt-oss-120b",
    fallback: "openai/gpt-oss-20b",
  },
  light: {
    provider: "groq",
    primary: "openai/gpt-oss-20b",
    fallback: "openai/gpt-oss-120b",
  },
};

function estimateTokens(str = "") {
  return Math.ceil(str.length / 4);
}

function truncateToTokenBudget(str, maxTokens) {
  const maxChars = Math.max(maxTokens, 0) * 4;
  if (!str || str.length <= maxChars) return str;
  return str.slice(str.length - maxChars);
}

export async function callGroq({
  task = "reasoning",
  systemInstruction,
  prompt,
  content,
  maxTokens = 2048,
  totalTokenBudget,
}) {
  const taskConfig = TASK_CONFIG[task] || TASK_CONFIG.reasoning;

  function providerFor(name) {
    const cfg = PROVIDERS[name];
    const apiKey = process.env[cfg.apiKeyEnv];
    if (!apiKey) {
      throw new Error(
        `${cfg.apiKeyEnv} is not set. Add it to your environment (Vercel env vars, or .env for local dev).`
      );
    }
    return { ...cfg, apiKey };
  }

  function buildMessages(budget) {
    const systemTokens = estimateTokens(systemInstruction || "");
    const inputBudget = Math.max(budget - maxTokens - systemTokens, 300);
    const userContent = truncateToTokenBudget(content || prompt || "", inputBudget);
    const messages = [];
    if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
    messages.push({ role: "user", content: userContent });
    return messages;
  }

  async function attempt(providerName, model) {
    const provider = providerFor(providerName);
    const budget = totalTokenBudget || provider.defaultTokenBudget;
    return fetch(provider.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: buildMessages(budget),
        response_format: { type: "json_object" },
        temperature: 0.6,
        max_tokens: maxTokens,
      }),
    });
  }

  let res = await attempt(taskConfig.provider, taskConfig.primary);
  let usedProvider = taskConfig.provider;

  const shouldRetry =
    (res.status === 429 || res.status === 413 || res.status >= 500) &&
    taskConfig.fallback !== taskConfig.primary;

  if (shouldRetry) {
    console.error(`[llm] ${taskConfig.provider}/${taskConfig.primary} failed (${res.status}), retrying on ${taskConfig.fallback}`);
    res = await attempt(taskConfig.provider, taskConfig.fallback);
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${usedProvider} error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  console.log(`[llm:${usedProvider}] usage:`, data.usage);
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error(`Empty ${usedProvider} response`);

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${usedProvider} returned malformed JSON`);
  }
}
