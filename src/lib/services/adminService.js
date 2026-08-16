import { supabase } from "../supabaseClient";

async function request(path, options = {}) {
  const { data: { session } = {} } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("You need to be signed in.");

  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...(options.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Admin request failed");
  return body;
}

export function getStats() {
  return request("/api/admin/stats");
}

export function getUsers(page = 1, perPage = 100) {
  return request(`/api/admin/users?page=${page}&perPage=${perPage}`);
}

export function askAsha(question) {
  return request("/api/admin/insights", {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}
