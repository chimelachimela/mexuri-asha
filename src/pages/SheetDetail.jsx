import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import { ArrowLeft, Plus, Trash2, Download, Pencil, Loader2 } from "lucide-react";
import Sidebar from "../components/Sidebar";
import ConfirmModal from "../components/ConfirmModal";
import { useApp } from "../context/AppContext";
import * as db from "../lib/services/dbService";

export default function SheetDetail() {
    const { sheetId } = useParams();
    const navigate = useNavigate();
    const { updateSheetInList, removeSheetFromList } = useApp();

    const [sheet, setSheet] = useState(null);
    const [columns, setColumns] = useState([]);
    const [rows, setRows] = useState([]);
    const [title, setTitle] = useState("");
    const [editingTitle, setEditingTitle] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const titleInputRef = useRef(null);

    useEffect(() => {
        db.getSheet(sheetId).then((s) => {
            setSheet(s);
            setColumns(s.columns);
            setRows(s.rows);
            setTitle(s.title);
        });
    }, [sheetId]);

    useEffect(() => {
        if (editingTitle) titleInputRef.current?.focus();
    }, [editingTitle]);

    // Autosave — fires on blur (title, cells, column names), not on every
    // keystroke, so this only ever writes once someone's actually done
    // typing a given field.
    async function persist(patch) {
        setSaving(true);
        setErrorMsg("");
        try {
            const updated = await db.updateSheet(sheetId, patch);
            setSheet(updated);
            updateSheetInList(sheetId, updated);
        } catch (err) {
            console.error(err);
            setErrorMsg("Couldn't save that change. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    function saveTitle() {
        setEditingTitle(false);
        const trimmed = title.trim();
        if (!trimmed || trimmed === sheet.title) {
            setTitle(sheet.title);
            return;
        }
        persist({ title: trimmed });
    }

    function updateCell(rowIndex, col, value) {
        setRows((prev) => prev.map((r, i) => (i === rowIndex ? { ...r, [col]: value } : r)));
    }

    function commitRows() {
        persist({ rows });
    }

    function addRow() {
        const blank = Object.fromEntries(columns.map((c) => [c, ""]));
        const next = [...rows, blank];
        setRows(next);
        persist({ rows: next });
    }

    function deleteRow(rowIndex) {
        const next = rows.filter((_, i) => i !== rowIndex);
        setRows(next);
        persist({ rows: next });
    }

    function renameColumn(oldName, newName) {
        const trimmed = newName.trim();
        if (!trimmed || trimmed === oldName || columns.includes(trimmed)) return;
        const nextCols = columns.map((c) => (c === oldName ? trimmed : c));
        const nextRows = rows.map((r) => {
            const { [oldName]: val, ...rest } = r;
            return { ...rest, [trimmed]: val };
        });
        setColumns(nextCols);
        setRows(nextRows);
        persist({ columns: nextCols, rows: nextRows });
    }

    function addColumn() {
        let n = columns.length + 1;
        while (columns.includes(`Column ${n}`)) n++;
        const name = `Column ${n}`;
        const nextCols = [...columns, name];
        const nextRows = rows.map((r) => ({ ...r, [name]: "" }));
        setColumns(nextCols);
        setRows(nextRows);
        persist({ columns: nextCols, rows: nextRows });
    }

    function deleteColumn(col) {
        const nextCols = columns.filter((c) => c !== col);
        const nextRows = rows.map((r) => {
            const { [col]: _omit, ...rest } = r;
            return rest;
        });
        setColumns(nextCols);
        setRows(nextRows);
        persist({ columns: nextCols, rows: nextRows });
    }

    function handleExport() {
        const worksheet = XLSX.utils.json_to_sheet(rows, { header: columns });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        XLSX.writeFile(workbook, `${(sheet?.title || "sheet").replace(/[^\w-]+/g, "_")}.xlsx`);
    }

    async function confirmDeleteSheet() {
        setDeleting(true);
        try {
            await db.deleteSheet(sheetId);
            removeSheetFromList(sheetId);
            navigate("/sheets");
        } catch (err) {
            console.error(err);
            setDeleting(false);
        }
    }

    if (!sheet) {
        return (
            <div className="h-screen w-full bg-canvas flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-accent-soft" />
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-canvas flex overflow-hidden">
            <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((c) => !c)} onNewChat={() => navigate("/chat")} />

            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-6 sm:px-10 pt-16 pb-4 md:pt-8 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => navigate("/sheets")}
                            className="focus-ring w-8 h-8 rounded-full flex items-center justify-center text-ink/50 hover:text-ink hover:bg-panel2 transition shrink-0"
                        >
                            <ArrowLeft size={16} />
                        </button>

                        {editingTitle ? (
                            <input
                                ref={titleInputRef}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={saveTitle}
                                onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); if (e.key === "Escape") { setTitle(sheet.title); setEditingTitle(false); } }}
                                className="text-xl font-bold bg-transparent outline-none border-b border-line2 min-w-0"
                            />
                        ) : (
                            <button
                                onClick={() => setEditingTitle(true)}
                                className="focus-ring flex items-center gap-2 text-xl font-bold hover:text-ink/80 transition min-w-0"
                            >
                                <span className="truncate">{sheet.title}</span>
                                <Pencil size={13} className="text-ink/30 shrink-0" />
                            </button>
                        )}

                        {saving && <Loader2 size={13} className="animate-spin text-ink/30 shrink-0" />}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={handleExport}
                            className="focus-ring flex items-center gap-1.5 text-xs font-medium bg-panel2 border border-line rounded-lg px-3 py-2 hover:border-line2 transition"
                        >
                            <Download size={13} /> Export .xlsx
                        </button>
                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="focus-ring w-8 h-8 rounded-lg flex items-center justify-center text-ink/40 hover:text-red-400 hover:bg-red-400/10 transition"
                            title="Delete sheet"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                {errorMsg && <div className="px-6 sm:px-10 pb-3 text-xs text-red-400 shrink-0">{errorMsg}</div>}

                <div className="flex-1 min-h-0 overflow-auto px-6 sm:px-10 pb-8">
                    <table className="border-collapse text-sm">
                        <thead>
                            <tr>
                                {columns.map((col) => (
                                    <th key={col} className="group sticky top-0 bg-canvas z-10 border border-line px-0 py-0 text-left align-top">
                                        <div className="flex items-center gap-1 px-3 py-2 min-w-[140px]">
                                            <input
                                                defaultValue={col}
                                                onBlur={(e) => renameColumn(col, e.target.value)}
                                                onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                                                className="w-full bg-transparent outline-none font-semibold text-xs text-ink/70 min-w-0"
                                            />
                                            <button
                                                onClick={() => deleteColumn(col)}
                                                className="focus-ring opacity-0 group-hover:opacity-100 text-ink/30 hover:text-red-400 transition shrink-0"
                                                title="Delete column"
                                            >
                                                <Trash2 size={11} />
                                            </button>
                                        </div>
                                    </th>
                                ))}
                                <th className="border border-line bg-canvas px-2 py-2 align-top">
                                    <button
                                        onClick={addColumn}
                                        className="focus-ring w-6 h-6 rounded flex items-center justify-center text-ink/40 hover:text-ink hover:bg-panel2 transition"
                                        title="Add column"
                                    >
                                        <Plus size={13} />
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, rowIndex) => (
                                <tr key={rowIndex} className="group">
                                    {columns.map((col) => (
                                        <td key={col} className="border border-line p-0">
                                            <input
                                                value={row[col] ?? ""}
                                                onChange={(e) => updateCell(rowIndex, col, e.target.value)}
                                                onBlur={commitRows}
                                                onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                                                className="w-full min-w-[140px] bg-transparent outline-none px-3 py-2 text-ink/80 focus:bg-panel2"
                                            />
                                        </td>
                                    ))}
                                    <td className="border border-line px-1">
                                        <button
                                            onClick={() => deleteRow(rowIndex)}
                                            className="focus-ring opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-ink/30 hover:text-red-400 transition"
                                            title="Delete row"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            <tr>
                                <td colSpan={columns.length + 1} className="border border-line p-0">
                                    <button
                                        onClick={addRow}
                                        className="focus-ring w-full flex items-center gap-1.5 px-3 py-2 text-xs text-ink/40 hover:text-ink hover:bg-panel2 transition"
                                    >
                                        <Plus size={12} /> Add row
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {confirmDelete && (
                <ConfirmModal
                    title={`Delete "${sheet.title}"?`}
                    description="This permanently deletes the sheet and all its data. This can't be undone."
                    confirmLabel="Delete"
                    danger
                    busy={deleting}
                    busyLabel="Deleting…"
                    onConfirm={confirmDeleteSheet}
                    onCancel={() => !deleting && setConfirmDelete(false)}
                />
            )}
        </div>
    );
}