import { useNavigate } from "react-router-dom";
import { Table2, ArrowRight } from "lucide-react";

// Shown in chat right after Asha builds a sheet from an uploaded file —
// same family as TemplateSuggestionCard/ChatChart: small, scannable,
// with a clear path to the real thing (the full Sheets page).
export default function SheetPreviewCard({ sheetId, title, columns, rows }) {
    const navigate = useNavigate();
    const previewCols = columns.slice(0, 4);
    const previewRows = rows.slice(0, 4);

    return (
        <div className="mt-3 border border-line rounded-xl overflow-hidden max-w-md">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-line bg-panel2">
                <Table2 size={14} className="text-accent-soft shrink-0" />
                <span className="text-sm font-semibold truncate">{title}</span>
                <span className="text-[11px] text-ink/35 ml-auto shrink-0">
                    {rows.length} row{rows.length === 1 ? "" : "s"} · {columns.length} col{columns.length === 1 ? "" : "s"}
                </span>
            </div>

            {previewRows.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-line">
                                {previewCols.map((c) => (
                                    <th key={c} className="text-left font-medium text-ink/50 px-3 py-1.5 whitespace-nowrap">{c}</th>
                                ))}
                                {columns.length > previewCols.length && (
                                    <th className="text-left font-medium text-ink/30 px-3 py-1.5">…</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {previewRows.map((r, i) => (
                                <tr key={i} className="border-b border-line last:border-0">
                                    {previewCols.map((c) => (
                                        <td key={c} className="px-3 py-1.5 text-ink/70 truncate max-w-[140px]">{String(r[c] ?? "")}</td>
                                    ))}
                                    {columns.length > previewCols.length && <td className="px-3 py-1.5 text-ink/30">…</td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <button
                onClick={() => navigate(`/sheets/${sheetId}`)}
                className="focus-ring w-full flex items-center justify-center gap-1.5 text-xs font-medium text-accent-soft px-4 py-2.5 border-t border-line hover:bg-panel2 transition"
            >
                Open in Asha Sheets
                <ArrowRight size={13} />
            </button>
        </div>
    );
}