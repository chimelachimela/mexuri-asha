// sheetTransform.js — applies the AI's transform spec to the FULL parsed
// dataset in plain JS. The AI never re-types rows; it only decides which
// of these deterministic operations to run, in what order. That's what
// keeps this fast and accurate regardless of row count — 20 rows or
// 20,000 rows cost the same one AI call, since the call only ever sees a
// sample + column stats (see documentInsights.js), never the full data.
//
// Supported operation types (kept deliberately small — no arbitrary
// formula/eval, so this is safe to run on whatever the AI returns):
//   { type: "keep",    columns: string[] }                         reorder/select
//   { type: "rename",  from: string, to: string }
//   { type: "trim",    column: string, case?: "upper"|"lower"|"title" }
//   { type: "dedupe",  columns?: string[] }                         all columns if omitted
//   { type: "filter_not_empty", column: string }
//   { type: "filter_compare", column: string, op: "equals"|"contains"|"greater_than"|"less_than", value: string }
//   { type: "sort",    column: string, direction?: "asc"|"desc" }
//   { type: "flag",    column: string, newColumn: string, op: "equals"|"contains"|"greater_than"|"less_than", value: string, trueLabel: string, falseLabel: string }

function toTitleCase(str) {
    return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function compare(cellValue, op, value) {
    const a = cellValue ?? "";
    const bNum = Number(value);
    const aNum = Number(a);
    switch (op) {
        case "equals":
            return String(a).trim().toLowerCase() === String(value).trim().toLowerCase();
        case "contains":
            return String(a).toLowerCase().includes(String(value).toLowerCase());
        case "greater_than":
            return !isNaN(aNum) && !isNaN(bNum) && aNum > bNum;
        case "less_than":
            return !isNaN(aNum) && !isNaN(bNum) && aNum < bNum;
        default:
            return true;
    }
}

export function applySheetTransform({ columns, rows }, operations = []) {
    let cols = [...columns];
    let data = rows.map((r) => ({ ...r }));

    for (const op of operations) {
        switch (op.type) {
            case "keep":
                cols = op.columns.filter((c) => cols.includes(c));
                data = data.map((r) => Object.fromEntries(cols.map((c) => [c, r[c]])));
                break;

            case "rename":
                if (cols.includes(op.from)) {
                    cols = cols.map((c) => (c === op.from ? op.to : c));
                    data = data.map((r) => {
                        const { [op.from]: val, ...rest } = r;
                        return { ...rest, [op.to]: val };
                    });
                }
                break;

            case "trim":
                data = data.map((r) => {
                    if (typeof r[op.column] !== "string") return r;
                    let val = r[op.column].trim();
                    if (op.case === "upper") val = val.toUpperCase();
                    else if (op.case === "lower") val = val.toLowerCase();
                    else if (op.case === "title") val = toTitleCase(val);
                    return { ...r, [op.column]: val };
                });
                break;

            case "dedupe": {
                const keyCols = op.columns?.length ? op.columns : cols;
                const seen = new Set();
                data = data.filter((r) => {
                    const key = keyCols.map((c) => String(r[c] ?? "")).join("|||");
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                break;
            }

            case "filter_not_empty":
                data = data.filter((r) => r[op.column] !== "" && r[op.column] != null);
                break;

            case "filter_compare":
                data = data.filter((r) => compare(r[op.column], op.op, op.value));
                break;

            case "sort": {
                const dir = op.direction === "desc" ? -1 : 1;
                data = [...data].sort((a, b) => {
                    const av = a[op.column], bv = b[op.column];
                    const an = Number(av), bn = Number(bv);
                    if (!isNaN(an) && !isNaN(bn)) return (an - bn) * dir;
                    return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
                });
                break;
            }

            case "flag":
                if (!cols.includes(op.newColumn)) cols = [...cols, op.newColumn];
                data = data.map((r) => ({
                    ...r,
                    [op.newColumn]: compare(r[op.column], op.op, op.value) ? op.trueLabel : op.falseLabel,
                }));
                break;

            default:
                break; // unknown op type — skip rather than throw, keeps this forward-compatible
        }
    }

    return { columns: cols, rows: data };
}