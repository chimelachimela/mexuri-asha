// documentInsights.js — parses spreadsheet files client-side and produces
// compact plain-text summaries to hand to the AI, the same role
// surveyInsights.js's summarizeSurveyResponses plays for referenced surveys.
//
// We send summaries, not raw rows, for the same reason: it keeps the
// request small and fast, and gives the model something it can actually
// reason over instead of drowning in a full dataset dump.

import Papa from "papaparse";
import * as XLSX from "xlsx";

const MAX_SAMPLE_ROWS = 10;
const MAX_SUMMARY_CHARS = 6000; // ceiling for a single attached file

// When several spreadsheets are attached to the same message, they share
// this budget instead of each getting the full single-file ceiling above —
// otherwise 5 attached files would mean 5x the prompt size for no benefit.
const TOTAL_SUMMARY_BUDGET_CHARS = 7000;
const MIN_PER_FILE_CHARS = 900; // floor so a summary isn't trimmed into uselessness

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
// maxChars/maxSampleRows let callers shrink the summary when several files
// share one message — see summarizeSpreadsheets below.
export function summarizeSpreadsheet({ fileName, columns, rows, maxChars = MAX_SUMMARY_CHARS, maxSampleRows = MAX_SAMPLE_ROWS }) {
    if (!rows.length) return `${fileName}: file appears to be empty.`;

    const lines = [
        `File: ${fileName}`,
        `${rows.length} row${rows.length === 1 ? "" : "s"}, ${columns.length} column${columns.length === 1 ? "" : "s"}: ${columns.join(", ")}`,
        "",
        "Column summary:",
        ...columns.map((c) => `- ${summarizeColumn(rows, c)}`),
        "",
        `Sample rows (first ${Math.min(maxSampleRows, rows.length)}):`,
        ...rows.slice(0, maxSampleRows).map((r) => JSON.stringify(r)),
    ];

    const text = lines.join("\n");
    return text.length > maxChars ? text.slice(0, maxChars) + "\n...(truncated)" : text;
}

// Batch version: summarizes several parsed spreadsheets at once, splitting
// a shared char/row budget between them so total prompt size stays roughly
// flat whether one file or five is attached. files: [{ fileName, columns, rows }]
// -> string[] summaries, same order as input.
export function summarizeSpreadsheets(files) {
    if (!files.length) return [];
    if (files.length === 1) return [summarizeSpreadsheet(files[0])];

    const perFileChars = Math.max(MIN_PER_FILE_CHARS, Math.floor(TOTAL_SUMMARY_BUDGET_CHARS / files.length));
    const perFileSampleRows = Math.max(3, Math.floor(MAX_SAMPLE_ROWS / Math.min(files.length, 4)));

    return files.map((f) => summarizeSpreadsheet({ ...f, maxChars: perFileChars, maxSampleRows: perFileSampleRows }));
}
