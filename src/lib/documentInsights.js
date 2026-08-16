// documentInsights.js — parses a spreadsheet file client-side and produces
// a compact plain-text summary to hand to the AI, the same role
// surveyInsights.js's summarizeSurveyResponses plays for referenced surveys.
//
// We send this summary, not the raw rows, for the same reason: it keeps the
// request small and fast, and gives the model something it can actually
// reason over instead of drowning in a full dataset dump.

import Papa from "papaparse";
import * as XLSX from "xlsx";

const MAX_SAMPLE_ROWS = 10;
const MAX_SUMMARY_CHARS = 6000; // keep the prompt payload bounded

// Returns { columns: string[], rows: object[] } from a File.
export async function parseSpreadsheetFile(file) {
    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "csv") {
        const text = await file.text();
        const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
        const columns = data.length ? Object.keys(data[0]) : [];
        return { columns, rows: data };
    }

    if (ext === "xlsx" || ext === "xls") {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheet = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: "" });
        const columns = rows.length ? Object.keys(rows[0]) : [];
        return { columns, rows };
    }

    throw new Error(`Unsupported file type: .${ext}`);
}

// Basic per-column stats: numeric columns get min/max/avg, everything else
// gets a distinct-value count — cheap signals that help the model orient
// itself without us doing real analysis client-side.
const MAX_BREAKDOWN_VALUES = 8;

function summarizeColumn(rows, col) {
    const values = rows.map((r) => r[col]).filter((v) => v !== "" && v != null);
    const numeric = values.filter((v) => typeof v === "number" || (!isNaN(v) && v !== ""));

    if (numeric.length === values.length && numeric.length > 0) {
        const nums = numeric.map(Number);
        const sum = nums.reduce((a, b) => a + b, 0);
        return `${col}: numeric, min ${Math.min(...nums)}, max ${Math.max(...nums)}, avg ${(sum / nums.length).toFixed(2)}`;
    }

    const distinct = new Set(values);
    let line = `${col}: text, ${distinct.size} distinct value${distinct.size === 1 ? "" : "s"}`;

    // Give exact counts per value when there aren't too many — this is what
    // makes it safe for the model to chart this column instead of guessing.
    if (distinct.size > 0 && distinct.size <= 20) {
        const counts = new Map();
        for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
        const top = [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, MAX_BREAKDOWN_VALUES)
            .map(([val, count]) => `${val}: ${count}`)
            .join(", ");
        line += ` — breakdown: ${top}`;
    }

    return line;
}

// fileName/columns/rows -> compact text block for the AI prompt.
export function summarizeSpreadsheet({ fileName, columns, rows }) {
    if (!rows.length) return `${fileName}: file appears to be empty.`;

    const lines = [
        `File: ${fileName}`,
        `${rows.length} row${rows.length === 1 ? "" : "s"}, ${columns.length} column${columns.length === 1 ? "" : "s"}: ${columns.join(", ")}`,
        "",
        "Column summary:",
        ...columns.map((c) => `- ${summarizeColumn(rows, c)}`),
        "",
        `Sample rows (first ${Math.min(MAX_SAMPLE_ROWS, rows.length)}):`,
        ...rows.slice(0, MAX_SAMPLE_ROWS).map((r) => JSON.stringify(r)),
    ];

    const text = lines.join("\n");
    return text.length > MAX_SUMMARY_CHARS ? text.slice(0, MAX_SUMMARY_CHARS) + "\n...(truncated)" : text;
}