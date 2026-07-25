import { supabaseAdmin } from "../_lib/supabaseAdmin.js";

// Cycle lengths in ms, used to push premium_until forward.
const CYCLE_MS = {
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000,
    yearly: 365 * 24 * 60 * 60 * 1000,
};

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    // Verify this request actually came from Flutterwave.
    const signature = req.headers["verif-hash"];
    if (!signature || signature !== process.env.FLW_WEBHOOK_HASH) {
        return res.status(401).end();
    }

    const event = req.body;
    if (event.event !== "charge.completed" || event.data?.status !== "successful") {
        return res.status(200).end(); // acknowledge, ignore anything else
    }

    const txRef = event.data.tx_ref;

    const { data: payment } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("tx_ref", txRef)
        .single();

    if (!payment || payment.status === "successful") {
        return res.status(200).end(); // unknown or already-processed — don't double-apply
    }

    const premiumUntil = new Date(Date.now() + CYCLE_MS[payment.billing_cycle]);

    await supabaseAdmin.from("payments")
        .update({ status: "successful", flw_transaction_id: String(event.data.id) })
        .eq("tx_ref", txRef);

    await supabaseAdmin.from("profiles")
        .update({
            plan_tier: "pro",
            premium_until: premiumUntil.toISOString(),
            billing_cycle: payment.billing_cycle,
        })
        .eq("id", payment.user_id);

    return res.status(200).end();
}