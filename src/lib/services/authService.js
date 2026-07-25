// authService.js — real Supabase Auth + Google OAuth
import { supabase } from "../supabaseClient";
import { TERMS_VERSION } from "../../data/termsContent";

const PENDING_TERMS_KEY = "asha_pending_terms_accept";

const listeners = new Set();
function emit(session) {
  listeners.forEach((cb) => cb(session));
}

let cachedSession = null;

async function fetchProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) return null;
  return data;
}

function toAppSession(authUser, profile) {
  if (!authUser) return null;
  return {
    id: authUser.id,
    email: authUser.email,
    name: profile?.name || authUser.user_metadata?.full_name || "",
    avatarUrl: authUser.user_metadata?.avatar_url || "",
    createdAt: authUser.created_at,
    onboarded: !!profile?.onboarded,
    useCase: profile?.use_case || null,
    responseStyle: profile?.response_style || null,
    termsAcceptedAt: profile?.terms_accepted_at || null,   // NEW
    termsVersion: profile?.terms_version ?? null,           // NEW
    plan_tier: profile?.plan_tier || "free",
    premium_until: profile?.premium_until || null,
    billing_cycle: profile?.billing_cycle || null,
  };
}

export async function acceptTerms() {
  if (!cachedSession) throw new Error("No active session");
  const { data, error } = await supabase
    .from("profiles")
    .update({
      terms_accepted_at: new Date().toISOString(),
      terms_version: TERMS_VERSION,
    })
    .eq("id", cachedSession.id)
    .select()
    .single();
  if (error) throw error;

  cachedSession = {
    ...cachedSession,
    termsAcceptedAt: data.terms_accepted_at,
    termsVersion: data.terms_version,
  };
  emit(cachedSession);
  return cachedSession;
}

export function markTermsAcceptedIntent() {
  localStorage.setItem(PENDING_TERMS_KEY, "1");
}

export function getSession() {
  return cachedSession;
}

// Re-fetches the profile row for the current user without a full
// auth round-trip — used after redirecting back from a payment, where
// the webhook may have updated plan_tier server-side in the meantime.
export async function refreshSession() {
  if (!cachedSession) return null;
  const profile = await fetchProfile(cachedSession.id);
  const {
    data: { session: authSession },
  } = await supabase.auth.getSession();
  if (!authSession) return null;
  cachedSession = toAppSession(authSession.user, profile);
  emit(cachedSession);
  return cachedSession;
}

// Called once on app boot — real session lookup is async, unlike the mock.
export async function initSession() {
  const {
    data: { session: authSession },
  } = await supabase.auth.getSession();
  if (!authSession) {
    cachedSession = null;
    return null;
  }
  const profile = await fetchProfile(authSession.user.id);
  cachedSession = toAppSession(authSession.user, profile);
  return cachedSession;
}

// Fires on sign-in, sign-out, and token refresh — including the moment
// the browser lands back from the Google redirect.
supabase.auth.onAuthStateChange(async (_event, authSession) => {
  if (!authSession) {
    cachedSession = null;
    emit(null);
    return;
  }
  const profile = await fetchProfile(authSession.user.id);
  cachedSession = toAppSession(authSession.user, profile);

  // New signup that checked the box pre-redirect: record it now that
  // we actually have a profile row and a session to attach it to.
  if (!cachedSession.termsAcceptedAt && localStorage.getItem(PENDING_TERMS_KEY)) {
    localStorage.removeItem(PENDING_TERMS_KEY);
    try {
      cachedSession = await acceptTerms();
    } catch (err) {
      console.error("Failed to record terms acceptance:", err);
    }
  }

  emit(cachedSession);
});

// This REDIRECTS the whole page to Google — it does not return a session.
// The eventual session shows up via onAuthChange once the browser comes back.
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/login`,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error) throw error;
}
export async function updateProfile(patch) {
  if (!cachedSession) throw new Error("No active session");
  const dbPatch = {};
  if ("name" in patch) dbPatch.name = patch.name;
  if ("useCase" in patch) dbPatch.use_case = patch.useCase;
  if ("responseStyle" in patch) dbPatch.response_style = patch.responseStyle;
  if ("onboarded" in patch) dbPatch.onboarded = patch.onboarded;

  const { data, error } = await supabase
    .from("profiles")
    .update(dbPatch)
    .eq("id", cachedSession.id)
    .select()
    .single();
  if (error) throw error;

  cachedSession = {
    ...cachedSession,
    name: data.name ?? cachedSession.name,
    useCase: data.use_case ?? cachedSession.useCase,
    responseStyle: data.response_style ?? cachedSession.responseStyle,
    onboarded: !!data.onboarded,
  };
  emit(cachedSession);
  return cachedSession;
}

export async function signOut() {
  await supabase.auth.signOut();
  cachedSession = null;
  emit(null);
}

export function onAuthChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

// Deleting an auth user needs the service-role key, which must never
// reach the client — so this calls a Vercel serverless route instead.
// (We'll add /api/delete-account.js in stage 3 alongside the AI routes.)
export async function deleteAccount() {
  const {
    data: { session: authSession },
  } = await supabase.auth.getSession();
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/delete-account`, {
    method: "POST",
    headers: { Authorization: `Bearer ${authSession?.access_token}` },
  });
  if (!res.ok) throw new Error("Failed to delete account");
  await supabase.auth.signOut();
  cachedSession = null;
  emit(null);
}