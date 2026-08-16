import { supabaseAdmin } from "../_lib/supabaseAdmin.js";
import { verifyUser } from "../_lib/verifyUser.js";

function getAllowedAdmins() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function requireAdmin(req, res) {
  const user = await verifyUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }

  const allowed = getAllowedAdmins();
  if (!allowed.includes((user.email || "").toLowerCase())) {
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

    const [users, profiles, surveys, published, responses, chats, messages, recentUsers, monthlyUsers] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 }),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("surveys").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("surveys").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabaseAdmin.from("responses").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("chats").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("messages").select("id", { count: "exact", head: true }).eq("role", "user"),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 20 }),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

    const authUsers = users.data?.users || [];
    const allUsers = monthlyUsers.data?.users || [];
    const newThisMonth = allUsers.filter((u) => new Date(u.created_at) >= start).length;
    const newPreviousMonth = allUsers.filter((u) => {
      const date = new Date(u.created_at);
      return date >= previousStart && date < start;
    }).length;

    const recent = (recentUsers.data?.users || []).map((u) => ({
      id: u.id,
      email: u.email || "",
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at || null,
      name: u.user_metadata?.full_name || u.user_metadata?.name || "",
    }));

    const errors = [profiles, surveys, published, responses, chats, messages].filter((r) => r.error);
    if (errors.length) throw errors[0].error;
    if (users.error) throw users.error;
    if (recentUsers.error) throw recentUsers.error;
    if (monthlyUsers.error) throw monthlyUsers.error;

    return res.status(200).json({
      users: {
        total: users.data?.total ?? authUsers.length,
        newThisMonth,
        newPreviousMonth,
      },
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
