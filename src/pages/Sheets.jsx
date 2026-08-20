import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table2, Search, Trash2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import Sidebar from "../components/Sidebar";
import ConfirmModal from "../components/ConfirmModal";
import * as db from "../lib/services/dbService";

// A miniature version of the real grid — same idea as Surveys' CoverArt:
// gives a recognizable preview of the actual data without opening it.
function SheetPreviewGrid({ sheet }) {
    const cols = sheet.columns.slice(0, 3);
    const rows = sheet.rows.slice(0, 4);

    return (
        <div className="w-full aspect-square rounded-xl overflow-hidden bg-panel3 border border-line flex flex-col">
            <div className="h-2 w-full shrink-0 bg-accent-soft/40" />
            <div className="flex-1 min-h-0 p-2.5 flex flex-col">
                <div className="text-[10px] font-semibold text-ink/80 leading-snug line-clamp-2 mb-2">{sheet.title}</div>
                <div className="flex-1 min-h-0 border border-line2 rounded overflow-hidden">
                    <table className="w-full h-full text-[6px] table-fixed">
                        <thead>
                            <tr className="bg-panel2">
                                {cols.map((c) => (
                                    <th key={c} className="text-left px-1 py-0.5 text-ink/50 truncate font-medium">{c}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => (
                                <tr key={i} className="border-t border-line2">
                                    {cols.map((c) => (
                                        <td key={c} className="px-1 py-0.5 text-ink/35 truncate">{String(r[c] ?? "")}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default function Sheets() {
    const { session, sheets, refreshSheets, removeSheetFromList } = useApp();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [query, setQuery] = useState("");
    const [pendingDelete, setPendingDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        refreshSheets();
    }, [session.id]);

    const filtered = sheets.filter(
        (s) => !query.trim() || s.title.toLowerCase().includes(query.trim().toLowerCase())
    );

    async function confirmDelete() {
        if (!pendingDelete) return;
        setDeleting(true);
        try {
            await db.deleteSheet(pendingDelete.id);
            removeSheetFromList(pendingDelete.id);
            setPendingDelete(null);
        } catch (err) {
            console.error(err);
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="h-screen w-full bg-canvas flex overflow-hidden">
            <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((c) => !c)} onNewChat={() => navigate("/chat")} />

            <div className="flex-1 min-w-0 overflow-y-auto px-6 sm:px-10 pt-16 pb-8 md:pt-8">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center justify-between gap-4 mb-1">
                        <h1 className="text-2xl font-bold">Asha Sheets</h1>
                        {sheets.length > 0 && (
                            <div className="relative w-full max-w-[220px]">
                                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/30" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search sheets"
                                    className="w-full text-xs bg-panel2 border border-line rounded-lg pl-8 pr-3 py-2 outline-none focus:border-ink/30 transition"
                                />
                            </div>
                        )}
                    </div>
                    <p className="text-ink/40 text-sm mb-8">Documents Asha has turned into clean, editable data.</p>

                    {sheets.length === 0 ? (
                        <div className="border border-dashed border-line2 rounded-xl py-20 text-center">
                            <Table2 size={22} className="mx-auto text-ink/20 mb-3" />
                            <p className="text-ink/40 text-sm mb-4">
                                No sheets yet — attach a CSV or Excel file in chat and ask Asha to clean it up or organize it.
                            </p>
                            <button
                                onClick={() => navigate("/chat")}
                                className="focus-ring text-sm font-medium text-accent-soft hover:underline"
                            >
                                Go to chat
                            </button>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="border border-dashed border-line2 rounded-xl py-16 text-center text-sm text-ink/40">
                            No sheets match "{query}"
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                            {filtered.map((s) => (
                                <div
                                    key={s.id}
                                    className="text-left group bg-panel border border-line rounded-xl p-2.5 hover:border-line2 hover:shadow-modal transition cursor-pointer"
                                    onClick={() => navigate(`/sheets/${s.id}`)}
                                >
                                    <div className="relative">
                                        <SheetPreviewGrid sheet={s} />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setPendingDelete(s); }}
                                            className="focus-ring absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center bg-panel/90 text-ink/50 border border-line shadow-sm hover:bg-panel hover:text-red-400 transition backdrop-blur-sm opacity-0 group-hover:opacity-100"
                                            title="Delete"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                    <div className="mt-2.5 min-w-0">
                                        <div className="text-sm font-semibold truncate">{s.title}</div>
                                        <div className="text-xs text-ink/40 truncate">
                                            {s.rows.length} row{s.rows.length === 1 ? "" : "s"} · {s.columns.length} col{s.columns.length === 1 ? "" : "s"}
                                            {s.sourceFileName ? ` · from ${s.sourceFileName}` : ""}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {pendingDelete && (
                <ConfirmModal
                    title={`Delete "${pendingDelete.title}"?`}
                    description="This can't be undone."
                    confirmLabel="Delete"
                    danger
                    busy={deleting}
                    busyLabel="Deleting…"
                    onConfirm={confirmDelete}
                    onCancel={() => !deleting && setPendingDelete(null)}
                />
            )}
        </div>
    );
}