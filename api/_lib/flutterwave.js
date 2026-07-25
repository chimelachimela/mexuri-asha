// flutterwave.js — server-side Flutterwave calls.
// Set FLW_SECRET_KEY (test key first, e.g. FLWSECK_TEST-xxxx) in Vercel env
// vars and a local .env. Never expose this key to the browser.
const FLW_BASE_URL = "https://api.flutterwave.com/v3";

// Server-defined prices — never trust an amount sent from the client.
// Keep NGN roughly aligned with the USD price; update as FX drifts.
export const PLAN_PRICES = {
    monthly: { USD: 5, NGN: 8000 },
    yearly: { USD: 48, NGN: 76000 },
    weekly: { USD: 2, NGN: 3200 },
    daily: { USD: 0.5, NGN: 800 },
};

export async function initiateTransaction({ txRef, amount, currency, email, redirectUrl }) {
    if (!process.env.FLW_SECRET_KEY) {
        throw new Error("FLW_SECRET_KEY is not set.");
    }

    const res = await fetch(`${FLW_BASE_URL}/payments`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        },
        body: JSON.stringify({
            tx_ref: txRef,
            amount,
            currency,
            redirect_url: redirectUrl,
            customer: { email },
            payment_options: "card",
            customizations: {
                title: "Asha Pro",
                description: "Upgrade to Asha Pro",
            },
        }),
    });

    const data = await res.json();
    if (!res.ok || data.status !== "success") {
        throw new Error(`Flutterwave initiate failed: ${JSON.stringify(data)}`);
    }
    return data.data.link; // hosted checkout URL to redirect the user to
}