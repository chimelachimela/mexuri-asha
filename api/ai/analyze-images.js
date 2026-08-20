import { verifyUser } from "../_lib/verifyUser.js";
import { callGroq } from "../_lib/groq.js";
import { applyCors } from "../_lib/cors.js";
import { logAndFail } from "../_lib/errors.js";

// Batched vision call: analyzes every attached image in ONE Groq request
// instead of one request per image. This is the actual token saving — the
// instructions/system overhead is paid once per message instead of once
// per file, and the model can see all images together (useful if the
// user's task spans them, e.g. "compare these two screenshots").
export default async function handler(req, res) {
    if (applyCors(req, res)) return;
    if (req.method !== "POST") return res.status(405).end();

    const user = await verifyUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { imageUrls } = req.body;
    if (!Array.isArray(imageUrls) || !imageUrls.length) {
        return res.status(400).json({ error: "imageUrls (non-empty array) is required" });
    }

    const instructions = `You will be shown ${imageUrls.length} image${imageUrls.length === 1 ? "" : "s"}, each labeled "Image N". For EACH image, describe it in enough detail for someone who can't see it to understand what it shows.

If it's a chart, graph, or table: extract every labeled value you can actually read — axis labels, category names, numbers, legend entries — as precisely as possible. Say what kind of chart it is and what it's comparing.
If it's a screenshot (an app, dashboard, spreadsheet, error message, etc.): describe what app/page it's from if visible, and transcribe any important visible text, numbers, or error messages exactly.
If it's a photo or general image: describe what's actually in it — objects, people (generically, no identification), setting, and any visible text.

Only describe what is actually visible in each image. Do not guess at values you can't clearly read, or assume context an image doesn't show — if something is blurry, cut off, or ambiguous, say so rather than filling it in. Do not mix up details between images.

Respond with ONLY a JSON object of this shape: {"summaries": [string, ...]} — exactly ${imageUrls.length} strings, in the same order as the images (Image 1 first, Image 2 second, etc).`;

    const content = [{ type: "text", text: instructions }];
    imageUrls.forEach((url, i) => {
        content.push({ type: "text", text: `Image ${i + 1}:` });
        content.push({ type: "image_url", image_url: { url } });
    });

    try {
        const result = await callGroq({
            task: "vision",
            systemInstruction: "You always respond with a single valid JSON object and nothing else — no markdown fences, no commentary outside the JSON.",
            content,
            // Scales with image count so a 5-image batch isn't starved of
            // output tokens the way a fixed single-image budget would be.
            maxTokens: Math.min(1536 * imageUrls.length, 6144),
        });
        const summaries = Array.isArray(result.summaries) ? result.summaries : [];
        // Defensive pad/trim in case the model returns the wrong count.
        const normalized = imageUrls.map((_, i) => summaries[i] || "");
        return res.status(200).json({ summaries: normalized });
    } catch (err) {
        return logAndFail(res, 500, "ai/analyze-images", err, "Asha couldn't read those images. Please try again.");
    }
}