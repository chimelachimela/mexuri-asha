// errors.js — logs the real error server-side (visible in your terminal /
// Vercel function logs) and sends back a clean, generic message. Nothing
// with stack traces, provider error text, or internal details ever reaches
// the browser.
export function logAndFail(res, status, context, err, publicMessage) {
    console.error(`[${context}]`, err);
    return res.status(status).json({ error: publicMessage });
}