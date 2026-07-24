// api/_lib/cors.js
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://asha.com.ng";

export function applyCors(req, res) {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        res.status(204).end();
        return true; // caller should return immediately
    }
    return false;
}