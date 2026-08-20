import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Circle, CheckCircle2, MoreVertical, Pencil, Trash2, ExternalLink, Search } from "lucide-react";
import { useApp } from "../context/AppContext";
import Sidebar from "../components/Sidebar";
import * as db from "../lib/services/dbService";

const HUES = [255, 200, 320, 165, 30, 280];

// A scaled-down "document" preview — like Google Forms' own thumbnails: a
// pale page with a thin colored accent strip up top and tiny lines standing
// in for the title, description, and first question's fields. Uses the
// app's theme tokens (panel/line/ink) instead of hardcoded white/gray, so
// it automatically matches whichever theme (light or dark) is active,
// the same way every other surface in the app does.
function CoverArt({ survey }) {
  const hue = HUES[(survey.coverColorSeed ?? 0) % HUES.length] ?? (survey.coverColorSeed ?? 0) % 360;
  const q = survey.questions?.[0];

  return (
    <div className="w-full aspect-square rounded-xl overflow-hidden bg-panel3 border border-line flex flex-col relative">
      {/* accent strip — stands in for a Forms theme color */}
      <div className="h-2 w-full shrink-0" style={{ background: `hsl(${hue} 65% 50%)` }} />

      {!survey.seenAt && (
        <span className="absolute top-3 left-2 text-[8px] font-semibold uppercase tracking-wide bg-red-500 text-white px-1.5 py-0.5 rounded-full z-10">
          New
        </span>
      )}
      <FileText size={12} className="absolute top-3 right-2.5 text-ink/15" />

      <div className="flex-1 min-h-0 px-3 pt-3 pb-3 flex flex-col">
        {/* title line */}
        <div className="text-[10px] font-semibold text-ink/80 leading-snug line-clamp-2 mb-2 pr-4">
          {survey.title}
        </div>

        {/* fake description lines */}
        <div className="space-y-1 mb-3">
          <div className="h-[3px] bg-line2 rounded-full w-full" />
          <div className="h-[3px] bg-line2 rounded-full w-4/5" />
        </div>

        {/* fake first-question field, pinned to the bottom like a real
            Forms thumbnail's field block. Only rendered once real
            question data is present — no phantom placeholder box. */}
        {q && (
          <div className="mt-auto space-y-1.5">
            {q.type !== "text" ? (
              (q.options || []).slice(0, 3).map((opt, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 border border-line2 shrink-0 ${q.type === "multiple" ? "rounded-[2px]" : "rounded-full"}`}
                  />
                  <span className="h-[3px] bg-line2 rounded-full flex-1" />
                </div>
              ))
            ) : (
              <div className="h-4 border border-line2 rounded-[3px]" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Kebab menu on each card — opens on click, closes on outside click.
// Keeps Edit/Delete off the card's main click target so they don't
// fight with "open the survey" as the default action.
function CardMenu({ onOpen, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="focus-ring w-7 h-7 rounded-full flex items-center justify-center bg-panel/90 text-ink/50 border border-line shadow-sm hover:bg-panel hover:text-ink transition backdrop-blur-sm"
        title="More"
      >
        <MoreVertical size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-10 w-40 bg-panel border border-line rounded-xl shadow-modal py-1 animate-fadeInUp">
          <button
            onClick={() => { setOpen(false); onOpen(); }}
            className="focus-ring w-full flex items-center gap-2 text-left px-3 py-2 text-xs text-ink/70 hover:bg-panel2 hover:text-ink transition"
          >
            <ExternalLink size={13} /> Open
          </button>
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="focus-ring w-full flex items-center gap-2 text-left px-3 py-2 text-xs text-ink/70 hover:bg-panel2 hover:text-ink transition"
          >
            <Pencil size={13} /> Edit
          </button>
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="focus-ring w-full flex items-center gap-2 text-left px-3 py-2 text-xs text-red-400 hover:bg-red-400/10 transition"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function Surveys() {
  const { session, surveys, refreshSurveys } = useApp();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null); // survey being confirmed
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    refreshSurveys();
  }, [session.id]);

  const filtered = surveys.filter((s) =>
    !query.trim() || s.title.toLowerCase().includes(query.trim().toLowerCase())
  );

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await db.deleteSurvey(pendingDelete.id);
      await refreshSurveys();
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
            <h1 className="text-2xl font-bold">Surveys</h1>
            {surveys.length > 0 && (
              <div className="relative w-full max-w-[220px]">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/30" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search surveys"
                  className="w-full text-xs bg-panel2 border border-line rounded-lg pl-8 pr-3 py-2 outline-none focus:border-ink/30 transition"
                />
              </div>
            )}
          </div>
          <p className="text-ink/40 text-sm mb-8">Everything Asha has built with you.</p>

          {surveys.length === 0 ? (
            <div className="border border-dashed border-line2 rounded-xl py-20 text-center">
              <p className="text-ink/40 text-sm mb-4">No surveys yet — start a chat and describe what you want to learn.</p>
              <button
                onClick={() => navigate("/chat")}
                className="focus-ring text-sm font-medium text-accent-soft hover:underline"
              >
                Go to chat
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="border border-dashed border-line2 rounded-xl py-16 text-center text-sm text-ink/40">
              No surveys match "{query}"
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {filtered.map((s) => (
                <div
                  key={s.id}
                  className="text-left group bg-panel border border-line rounded-xl p-2.5 hover:border-line2 hover:shadow-modal transition cursor-pointer"
                  onClick={() => navigate(`/surveys/${s.id}`)}
                >
                  <div className="relative">
                    <CoverArt survey={s} />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <CardMenu
                        onOpen={() => navigate(`/surveys/${s.id}`)}
                        onEdit={() => navigate(`/surveys/${s.id}`, { state: { autoEdit: true } })}
                        onDelete={() => setPendingDelete(s)}
                      />
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{s.title}</div>
                      <div className="text-xs text-ink/40 truncate">{s.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      {s.status === "published" ? (
                        <>
                          <CheckCircle2 size={12} className="text-emerald-400" />
                          <span className="text-emerald-400">Published</span>
                        </>
                      ) : (
                        <>
                          <Circle size={12} className="text-ink/30" />
                          <span className="text-ink/40">Draft</span>
                        </>
                      )}
                    </div>
                    {s.responses?.length > 0 && (
                      <span className="text-[11px] text-ink/30">
                        {s.responses.length} response{s.responses.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => !deleting && setPendingDelete(null)}
        >
          <div
            className="w-full max-w-sm bg-panel border border-line rounded-2xl shadow-modal p-5 animate-fadeInUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-semibold mb-1.5">Delete "{pendingDelete.title}"?</div>
            <p className="text-xs text-ink/50 mb-5">
              This permanently deletes the survey, its questions, and all responses. This can't be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                className="focus-ring text-sm font-medium px-4 py-2 rounded-lg hover:bg-panel2 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="focus-ring text-sm font-medium bg-red-500 text-white rounded-lg px-4 py-2 hover:bg-red-500/90 transition disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}