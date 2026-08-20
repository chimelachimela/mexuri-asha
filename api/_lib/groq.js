// Each provider is OpenAI-compatible, so the same fetch/parsing logic works
// for all of them — only the URL, key, and model IDs differ.
const PROVIDERS = {
  groq: {
    url: "https://api.groq.com/openai/v1/chat/completions",
    apiKeyEnv: "GROQ_API_KEY",
    // Groq's free/dev tier enforces an org-wide tokens-per-minute cap that
    // counts prompt + reserved completion tokens together — stay under it.
    defaultTokenBudget: 7800,
  },
  deepseek: {
    url: "https://platform.deepseek.com/chat/completions",
    apiKeyEnv: "DEEPSEEK_API_KEY",
    // 1M-token context on DeepSeek's side — this is just a sane ceiling on
    // what we send, not a hard platform limit like Groq's.
    defaultTokenBudget: 100000,
  },
  moonshot: {
    url: "https://api.moonshot.ai/v1/chat/completions",
    apiKeyEnv: "MOONSHOT_API_KEY",
    defaultTokenBudget: 100000,
  },
};

// task -> which provider/model handles it. Only "reasoning" (chat replies,
// survey/sheet/planning generation — the highest-volume calls) moved off
// Groq; "vision" and "light" stay put since they're low-volume and Groq's
// cap was never the bottleneck there.
const TASK_CONFIG = {
  vision: {
    provider: "groq",
    primary: "qwen/qwen3.6-27b",
    fallback: "qwen/qwen3.6-27b",
  },
  reasoning: {
    provider: "deepseek",
    primary: "deepseek-v4-flash",
    fallback: "deepseek-v4-flash",
    // If DeepSeek itself is down/erroring, fall back across providers to
    // Groq rather than failing the request outright.
    crossFallback: { provider: "groq", model: "openai/gpt-oss-120b" },
  },
  light: {
    provider: "groq",
    primary: "openai/gpt-oss-20b",
    fallback: "openai/gpt-oss-120b",
  },
};

// Rough token estimate: ~4 chars per token for English text
function estimateTokens(str = "") {
  return Math.ceil(str.length / 4);
}

function truncateToTokenBudget(str, maxTokens) {
  const maxChars = Math.max(maxTokens, 0) * 4;
  if (!str || str.length <= maxChars) return str;
  return str.slice(str.length - maxChars); // keep the tail
}

export async function callGroq({
  task = "reasoning",
  systemInstruction,
  prompt,
  content,
  maxTokens = 2048,
  totalTokenBudget, // optional override; defaults to the provider's budget below
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

  // Retry on rate limit (429), request-too-large (413), or server errors (5xx)
  const shouldRetrySamePvdr =
    (res.status === 429 || res.status === 413 || res.status >= 500) &&
    taskConfig.fallback !== taskConfig.primary;

  if (shouldRetrySamePvdr) {
    console.error(`[llm] ${taskConfig.provider}/${taskConfig.primary} failed (${res.status}), retrying on ${taskConfig.fallback}`);
    res = await attempt(taskConfig.provider, taskConfig.fallback);
  }

  // Still failing after the same-provider retry — hop to a different
  // provider entirely if one's configured for this task.
  if (!res.ok && taskConfig.crossFallback) {
    console.error(`[llm] ${taskConfig.provider} failed (${res.status}), falling back to ${taskConfig.crossFallback.provider}`);
    res = await attempt(taskConfig.crossFallback.provider, taskConfig.crossFallback.model);
    usedProvider = taskConfig.crossFallback.provider;
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