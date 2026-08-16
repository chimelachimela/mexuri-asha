import { verifyUser } from "../_lib/verifyUser.js";
import { callGroq } from "../_lib/groq.js";
import { applyCors } from "../_lib/cors.js";
import { logAndFail } from "../_lib/errors.js";

// One-shot vision call: describe whatever's in the image in enough detail
// that the main chat prompt (chat.js) can reason over it the same way it
// reasons over a spreadsheet summary. This keeps images and documents on
// the same "summary" contract instead of teaching chat.js a second,
// image-specific code path.
export default async function handler(req, res) {
    if (applyCors(req, res)) return;
    if (req.method !== "POST") return res.status(405).end();

    const user = await verifyUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "imageUrl is required" });

    const instructions = `Look at this image and describe it in enough detail for someone who can't see it to understand what it shows.

If it's a chart, graph, or table: extract every labeled value you can actually read — axis labels, category names, numbers, legend entries — as precisely as possible. Say what kind of chart it is and what it's comparing.
If it's a screenshot (an app, dashboard, spreadsheet, error message, etc.): describe what app/page it's from if visible, and transcribe any important visible text, numbers, or error messages exactly.
If it's a photo or general image: describe what's actually in it — objects, people (generically, no identification), setting, and any visible text.

Only describe what is actually visible. Do not guess at values you can't clearly read, or assume context the image doesn't show — if something is blurry, cut off, or ambiguous, say so rather than filling it in.

Respond with ONLY a JSON object of this shape: {"summary": string}`;

    try {
        const result = await callGroq({
            task: "vision",
            systemInstruction: "You always respond with a single valid JSON object and nothing else — no markdown fences, no commentary outside the JSON.",
            content: [
                { type: "text", text: instructions },
                { type: "image_url", image_url: { url: imageUrl } },
            ],
            maxTokens: 1536,
        });
        return res.status(200).json({ summary: result.summary || "" });
    } catch (err) {
        return logAndFail(res, 500, "ai/analyze-image", err, "Asha couldn't read that image. Please try again.");
    }
}