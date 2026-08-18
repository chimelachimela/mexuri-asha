import { supabaseAdmin } from "../_lib/supabaseAdmin.js";
import { verifyUser } from "../_lib/verifyUser.js";

function isAdmin(email) {
  const allowed = (process.env.ADMIN_EMAILS || "")
    .split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
  return allowed.includes((email || "").toLowerCase());
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const user = await verifyUser(req);
  if (!user) return res.status(401).json({ error: "Authentication required" });
  if (!isAdmin(user.email)) return res.status(403).json({ error: "Admin access required" });

  try {
    const page = Math.max(1, Number(req.query?.page || 1));
    const perPage = Math.min(1000, Math.max(1, Number(req.query?.perPage || 100)));
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    return res.status(200).json({
      users: (data.users || []).map((u) => ({
        id: u.id,
        email: u.email || "",
        name: u.user_metadata?.full_name || u.user_metadata?.name || "",
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at || null,
      })),
      nextPage: (data.users || []).length === perPage ? page + 1 : null,
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return res.status(500).json({ error: "Unable to load users" });
  }
}
