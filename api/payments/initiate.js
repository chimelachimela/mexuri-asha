import { verifyUser } from "../_lib/verifyUser.js";
import { supabaseAdmin } from "../_lib/supabaseAdmin.js";
import { applyCors } from "../_lib/cors.js";
import { initiateTransaction, PLAN_PRICES } from "../_lib/flutterwave.js";

export default async function handler(req, res) {
    if (applyCors(req, res)) return;
    if (req.method !== "POST") return res.status(405).end();

    const user = await verifyUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { billingCycle, currency } = req.body;
    if (!PLAN_PRICES[billingCycle] || !PLAN_PRICES[billingCycle][currency]) {
        return res.status(400).json({ error: "Invalid plan or currency" });
    }

    const amount = PLAN_PRICES[billingCycle][currency];
    const txRef = `asha-${user.id}-${Date.now()}`;

    try {
        // Log as pending before redirecting — webhook will flip this to successful.
        await supabaseAdmin.from("payments").insert({
            user_id: user.id,
            tx_ref: txRef,
            status: "pending",
            amount,
            currency,
            billing_cycle: billingCycle,
        });

        // Derive the origin from the request itself rather than an env var —
        // this stays correct across previews, production, and custom domains
        // without needing to be updated every time the deployment URL changes.
        const origin = req.headers.origin || `https://${req.headers.host}`;

        const link = await initiateTransaction({
            txRef,
            amount,
            currency,
            email: user.email,
            redirectUrl: `${origin}/settings?payment=complete`,
        });

        return res.status(200).json({ link });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Could not start payment" });
    }
}