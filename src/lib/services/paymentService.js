// paymentService.js — talks to our own /api/payments/* routes.
// Same authedPost pattern as aiService.js.
import { supabase } from "../supabaseClient";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

async function authedPost(path, body) {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Request to ${path} failed (${res.status})`);
    }
    return res.json();
}

export async function startUpgrade({ billingCycle, currency }) {
    const { link } = await authedPost("/api/payments/initiate", { billingCycle, currency });
    window.location.href = link; // hand off to Flutterwave's hosted checkout
}

// Display-only prices, mirrors api/_lib/flutterwave.js's PLAN_PRICES.
// The server is the source of truth for the actual charge — this is
// just so the modal can render numbers without an extra round-trip.
export const PLAN_PRICES = {
    monthly: { USD: 5, NGN: 8000 },
    yearly: { USD: 48, NGN: 76000 },
    weekly: { USD: 2, NGN: 3200 },
    daily: { USD: 0.5, NGN: 800 },
};

// Rough default: Nigerian timezone → NGN, everyone else → USD.
// A heuristic, not a guarantee — the modal lets them switch either way.
export function guessCurrency() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone === "Africa/Lagos" ? "NGN" : "USD";
    } catch {
        return "USD";
    }
}