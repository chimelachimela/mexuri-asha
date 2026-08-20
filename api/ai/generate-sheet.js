import { verifyUser } from "../_lib/verifyUser.js";
import { callGroq } from "../_lib/groq.js";
import { applyCors } from "../_lib/cors.js";
import { BRAND_RULES } from "../_lib/brand.js";

const VALID_OPS = new Set(["keep", "rename", "trim", "dedupe", "filter_not_empty", "filter_compare", "sort", "flag"]);

// The model never sees or returns full row data — only a column summary +
// sample rows (same shape documentInsights.js already produces for chat).
// It decides WHICH deterministic operations to run; the client applies
// them to the real dataset via sheetTransform.js. That split is what
// keeps this fast regardless of how many rows the file actually has.
export default async function handler(req, res) {
    if (applyCors(req, res)) return;
    if (req.method !== "POST") return res.status(405).end();

    const user = await verifyUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { fileName, summary, instruction } = req.body;
    const prompt = `A founder uploaded a spreadsheet and wants it turned into a clean sheet.

File: ${fileName}
${summary}

What they asked for: "${instruction || "clean this up and organize it well"}"

Decide a short title for the resulting sheet, and a list of operations to transform the data. Available operation types:
- keep: { "type": "keep", "columns": string[] } — select/reorder columns (only include this if columns should change or reorder)
- rename: { "type": "rename", "from": string, "to": string }
- trim: { "type": "trim", "column": string, "case"?: "upper"|"lower"|"title" } — clean whitespace/casing
- dedupe: { "type": "dedupe", "columns"?: string[] } — remove duplicate rows (omit columns to dedupe on the full row)
- filter_not_empty: { "type": "filter_not_empty", "column": string } — drop rows missing this field
- filter_compare: { "type": "filter_compare", "column": string, "op": "equals"|"contains"|"greater_than"|"less_than", "value": string }
- sort: { "type": "sort", "column": string, "direction"?: "asc"|"desc" }
- flag: { "type": "flag", "column": string, "newColumn": string, "op": "equals"|"contains"|"greater_than"|"less_than", "value": string, "trueLabel": string, "falseLabel": string } — add a derived label column from a simple comparison

If they just want the data "as it is," return an empty operations array. Only use the operation types listed above — nothing else. Keep the list short and purposeful; don't invent transformations they didn't ask for or that aren't implied by "clean this up."

${BRAND_RULES}

Respond with ONLY a JSON object of this shape:
{"title": string, "operations": [...]}`;

    const systemInstruction = "Respond with ONLY valid JSON. No markdown fences, no commentary, no preamble.";

    try {
        const parsed = await callGroq({ task: "reasoning", prompt, systemInstruction, maxTokens: 2048 });

        const operations = Array.isArray(parsed.operations)
            ? parsed.operations.filter((op) => op && VALID_OPS.has(op.type))
            : [];

        return res.status(200).json({
            title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : fileName,
            operations,
        });
    } catch (err) {
        console.error("[generate-sheet]", err);
        return res.status(500).json({ error: "Couldn't generate that sheet. Please try again." });
    }
}