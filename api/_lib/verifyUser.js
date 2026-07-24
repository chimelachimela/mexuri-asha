import { supabaseAdmin } from "./supabaseAdmin.js";

// Every /api/ai/* and /api/delete-account route requires a valid
// Supabase session — this stops randoms from hammering your Groq quota
// or deleting accounts that aren't theirs.
export async function verifyUser(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) return null;
  return data.user;
}
