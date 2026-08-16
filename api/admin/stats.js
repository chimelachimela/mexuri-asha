import { supabaseAdmin } from "../_lib/supabaseAdmin.js";
import { verifyUser } from "../_lib/verifyUser.js";

function getAllowedAdmins() {
  return (process.env.ADMIN_EMAILS || "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
}

async function requireAdmin(req, res) {
  const user = await verifyUser(req);
  if (!user) { res.status(401).json({ error: "Authentication required" }); return null; }
  if (!getAllowedAdmins().includes((user.email || "").toLowerCase())) {
    res.status(403).json({ error: "Admin access required" });
    return null;
  }
  return user;
}

function monthStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!(await requireAdmin(req, res))) return;

  try {
    const start = monthStart();
    const previousStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 1, 1));

    const [profiles, newThisMonth, newPreviousMonth, surveys, published, responses, chats, messages, recentUsers] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", start.toISOString()),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", previousStart.toISOString()).lt("created_at", start.toISOString()),
      supabaseAdmin.from("surveys").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("surveys").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabaseAdmin.from("responses").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("chats").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("messages").select("id", { count: "exact", head: true }).eq("role", "user"),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 20 }),
    ]);

    const results = [profiles, newThisMonth, newPreviousMonth, surveys, published, responses, chats, messages];
    const failed = results.find((r) => r.error);
    if (failed) throw failed.error;
    if (recentUsers.error) throw recentUsers.error;

    const recent = (recentUsers.data?.users || []).map((u) => ({
      id: u.id,
      email: u.email || "",
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at || null,
      name: u.user_metadata?.full_name || u.user_metadata?.name || "",
    }));

    return res.status(200).json({
      users: { total: profiles.count || 0, newThisMonth: newThisMonth.count || 0, newPreviousMonth: newPreviousMonth.count || 0 },
      surveys: { total: surveys.count || 0, published: published.count || 0 },
      responses: responses.count || 0,
      chats: chats.count || 0,
      userMessages: messages.count || 0,
      recentUsers: recent,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return res.status(500).json({ error: "Unable to load admin statistics" });
  }
}
