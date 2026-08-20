import { supabaseAdmin } from "../_lib/supabaseAdmin.js";
import { verifyUser } from "../_lib/verifyUser.js";
import { callGroq } from "../_lib/groq.js";

function isAdmin(email) {
  return (process.env.ADMIN_EMAILS || "")
    .split(",").map((v) => v.trim().toLowerCase()).filter(Boolean)
    .includes((email || "").toLowerCase());
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const user = await verifyUser(req);
  if (!user) return res.status(401).json({ error: "Authentication required" });
  if (!isAdmin(user.email)) return res.status(403).json({ error: "Admin access required" });

  const question = String(req.body?.question || "").trim();
  if (!question) return res.status(400).json({ error: "Question is required" });
  if (question.length > 1000) return res.status(400).json({ error: "Question is too long" });

  try {
    const [profiles, surveys, published, responses, chats] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("surveys").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("surveys").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabaseAdmin.from("responses").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("chats").select("id", { count: "exact", head: true }),
    ]);
    const failed = [profiles, surveys, published, responses, chats].find((r) => r.error);
    if (failed) throw failed.error;

    const context = {
      totalUsers: profiles.count || 0,
      totalSurveys: surveys.count || 0,
      publishedSurveys: published.count || 0,
      totalResponses: responses.count || 0,
      totalChats: chats.count || 0,
    };

    const result = await callGroq({
      systemInstruction: `You are Asha's internal product insights analyst. Answer the admin's question using ONLY the supplied platform metrics. Do not invent data. If the metrics are insufficient, say so. Return JSON with keys "answer" (string), "observations" (array of strings), and "nextSteps" (array of strings). Keep it concise and useful to a product team.`,
      content: JSON.stringify({ question, platformMetrics: context }),
      maxTokens: 1200,
    });

    return res.status(200).json({ ...result, metrics: context });
  } catch (error) {
    console.error("Admin insights error:", error);
    return res.status(500).json({ error: "Unable to generate Asha insight" });
  }
}
