import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Copy, Check, Link2, Eye, X, Code2, Pencil, Trash2, Plus } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { SurveyForm, SurveyFormChrome } from "../components/SurveyForm";
import ConfirmModal from "../components/ConfirmModal";
import * as db from "../lib/services/dbService";
import { aggregateResponses } from "../lib/surveyInsights";
import { useApp } from "../context/AppContext";
import TemplatePicker from "../components/survey-templates/TemplatePicker";
import { getTemplate } from "../lib/templates/registry";
import { recommendTemplate, resolveTemplateAfterEdit } from "../lib/templates/compatibility";

let tmpId = 0;
function newQuestion(type = "single") {
  return { id: `tmp-${tmpId++}`, type, text: "", options: type === "text" ? undefined : [""] };
}

export default function SurveyDetail() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { markSurveySeen, refreshSurveys } = useApp();
  const [survey, setSurvey] = useState(null);
  const [tab, setTab] = useState("questions"); // 'questions' | 'responses' | 'templates'
  const [pendingTemplateId, setPendingTemplateId] = useState(null); // awaiting confirm
  const [collapsed, setCollapsed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null); // { title, description, questions }
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    db.getSurvey(surveyId).then(setSurvey);
    markSurveySeen(surveyId);
  }, [surveyId]);

  // Deep-link from the Surveys grid's kebab menu ("Edit") — jump straight
  // into edit mode once the survey has actually loaded.
  useEffect(() => {
    if (survey && location.state?.autoEdit && !editing) {
      startEditing();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [survey]);

  async function togglePublish() {
    const next = survey.status === "published" ? "draft" : "published";
    const updated = await db.setSurveyStatus(survey.id, next);
    setSurvey(updated);
  }

  async function handlePickTemplate(id) {
    const prev = survey.templateId;
    setSurvey((s) => ({ ...s, templateId: id })); // optimistic
    try {
      await db.setSurveyTemplate(survey.id, id);
    } catch (err) {
      console.error(err);
      setSurvey((s) => ({ ...s, templateId: prev })); // revert on failure
    }
  }

  function requestTemplateChange(id) {
    const current = survey.templateId || recommendTemplate(survey.questions).id;
    if (id === current) return;
    setPendingTemplateId(id);
  }

  function confirmTemplateChange() {
    handlePickTemplate(pendingTemplateId);
    setPendingTemplateId(null);
  }

  function startEditing() {
    setDraft({
      title: survey.title,
      description: survey.description,
      questions: survey.questions.map((q) => ({ ...q, options: q.options ? [...q.options] : undefined })),
    });
    setEditing(true);
  }

  function cancelEditing() {
    setDraft(null);
    setEditing(false);
  }

  async function saveEditing() {
    const cleaned = draft.questions
      .map((q) => ({
        ...q,
        text: q.text.trim(),
        options: q.type !== "text" ? (q.options || []).map((o) => o.trim()).filter(Boolean) : undefined,
      }))
      .filter((q) => q.text && (q.type === "text" || q.options.length >= 2));

    if (!draft.title.trim() || cleaned.length === 0) return;

    setSaving(true);
    try {
      const updated = await db.updateSurvey(survey.id, {
        title: draft.title.trim(),
        description: draft.description.trim(),
        questions: cleaned,
      });

      const { templateId: resolvedId, changed } = resolveTemplateAfterEdit(survey.templateId, cleaned);
      let finalSurvey = updated;
      if (changed) {
        await db.setSurveyTemplate(survey.id, resolvedId);
        finalSurvey = { ...updated, templateId: resolvedId };
      }
      setSurvey(finalSurvey);
      setEditing(false);
      setDraft(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await db.deleteSurvey(survey.id);
      await refreshSurveys();
      navigate("/surveys");
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  }

  function updateDraftQuestion(id, patch) {
    setDraft((d) => ({ ...d, questions: d.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) }));
  }

  function addDraftQuestion() {
    setDraft((d) => ({ ...d, questions: [...d.questions, newQuestion()] }));
  }

  function removeDraftQuestion(id) {
    setDraft((d) => ({ ...d, questions: d.questions.filter((q) => q.id !== id) }));
  }

  function addOption(qid) {
    updateDraftQuestion(qid, { options: [...(draft.questions.find((q) => q.id === qid).options || []), ""] });
  }

  function updateOption(qid, i, value) {
    const q = draft.questions.find((q) => q.id === qid);
    const options = q.options.map((o, idx) => (idx === i ? value : o));
    updateDraftQuestion(qid, { options });
  }

  function removeOption(qid, i) {
    const q = draft.questions.find((q) => q.id === qid);
    updateDraftQuestion(qid, { options: q.options.filter((_, idx) => idx !== i) });
  }

  if (!survey) return null;

  const publicUrl = `${window.location.origin}/s/${survey.slug}`;
  const embedCode = `${window.location.origin}/s/${survey.slug}`;

  function copyLink() {
    navigator.clipboard?.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1500);
  }

  function copyEmbedCode() {
    navigator.clipboard?.writeText(embedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  }

  return (
    <div className="h-screen w-full bg-canvas flex overflow-hidden">
      <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((c) => !c)} onNewChat={() => navigate("/chat")} />

      <div className="flex-1 min-w-0 overflow-y-auto px-6 sm:px-10 pt-16 pb-8 md:pt-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate("/surveys")}
            className="focus-ring flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink transition mb-6"
          >
            <ArrowLeft size={15} /> Surveys
          </button>

          <div className="flex items-start justify-between gap-4 mb-1">
            {editing ? (
              <input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                className="text-2xl font-bold bg-transparent outline-none border-b border-line2 focus:border-ink/40 flex-1 min-w-0 pb-0.5"
                placeholder="Survey title"
              />
            ) : (
              <h1 className="text-2xl font-bold">{survey.title}</h1>
            )}
            <div className="flex items-center gap-4 shrink-0">
              {editing ? (
                <>
                  <button
                    onClick={cancelEditing}
                    disabled={saving}
                    className="focus-ring text-sm font-medium border border-line2 rounded-lg px-4 py-2 hover:bg-panel transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEditing}
                    disabled={saving}
                    className="focus-ring text-sm font-medium bg-btn text-btn-foreground rounded-lg px-4 py-2 hover:bg-btn/90 transition disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="focus-ring flex items-center justify-center w-9 h-9 rounded-lg border border-line2 text-ink/50 hover:text-red-400 hover:border-red-400/40 transition"
                    title="Delete survey"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={startEditing}
                    className="focus-ring flex items-center gap-1.5 text-sm font-medium border border-line2 rounded-lg px-4 py-2 hover:bg-panel transition"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={() => setPreviewOpen(true)}
                    className="focus-ring flex items-center gap-1.5 text-sm font-medium border border-line2 rounded-lg px-4 py-2 hover:bg-panel transition"
                  >
                    <Eye size={14} /> Preview
                  </button>
                  {survey.status === "published" ? (
                    <button
                      onClick={togglePublish}
                      className="focus-ring text-sm font-medium border border-line2 rounded-lg px-4 py-2 hover:bg-panel transition"
                    >
                      Unpublish
                    </button>
                  ) : (
                    <button
                      onClick={togglePublish}
                      className="focus-ring text-sm font-medium bg-btn text-btn-foreground rounded-lg px-4 py-2 hover:bg-btn/90 transition"
                    >
                      Publish
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          {editing ? (
            <textarea
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              rows={1}
              placeholder="Short description"
              className="text-ink/40 text-sm mb-4 bg-transparent outline-none border-b border-line2 focus:border-ink/40 w-full resize-none"
            />
          ) : (
            <p className="text-ink/40 text-sm mb-4">{survey.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span
              className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${survey.status === "published" ? "bg-emerald-400/10 text-emerald-400" : "bg-ink/10 text-ink/50"
                }`}
            >
              {survey.status === "published" ? "Published" : "Draft"}
            </span>
            <button
              onClick={copyLink}
              className="focus-ring flex items-center gap-1.5 text-[11px] text-ink/40 hover:text-ink border border-line rounded-full px-2.5 py-1 transition"
            >
              <Link2 size={11} />
              {survey.slug}
              {copiedLink ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            </button>
          </div>

          {/* Embed code — separate from the shareable link above, for sites that
              want the form inline rather than linking out. */}
          <div className="mb-8 border border-line rounded-xl p-3.5">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-ink/50">
                <Code2 size={13} /> Share this code
              </div>
              <button
                onClick={copyEmbedCode}
                className="focus-ring flex items-center gap-1.5 text-xs font-medium bg-panel2 hover:bg-panel3 rounded-lg px-2.5 py-1.5 transition"
              >
                {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copiedCode ? "Copied" : "Copy code"}
              </button>
            </div>
            <pre className="text-[11px] text-ink/40 bg-panel2 rounded-lg px-3 py-2.5 overflow-x-auto">
              <code>{embedCode}</code>
            </pre>
          </div>

          <div className="flex items-center gap-5 border-b border-line mb-6">
            {["questions", "responses", "templates"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`focus-ring pb-3 text-sm font-medium capitalize border-b-2 transition ${tab === t ? "border-ink text-ink" : "border-transparent text-ink/40 hover:text-ink/70"
                  }`}
              >
                {t} {t === "responses" && survey.responses.length > 0 && `(${survey.responses.length})`}
              </button>
            ))}
          </div>

          {tab === "questions" && (
            <>
              {editing ? (
                <div className="space-y-4">
                  {draft.questions.map((q, i) => (
                    <div key={q.id} className="border border-line rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-ink/35">Question {i + 1}</div>
                        <div className="flex items-center gap-2">
                          <select
                            value={q.type}
                            onChange={(e) => {
                              const type = e.target.value;
                              updateDraftQuestion(q.id, {
                                type,
                                options: type === "text" ? undefined : (q.options?.length ? q.options : ["", ""]),
                              });
                            }}
                            className="text-xs bg-panel2 border border-line rounded-lg px-2 py-1"
                          >
                            <option value="single">Single choice</option>
                            <option value="multiple">Multiple choice</option>
                            <option value="text">Open text</option>
                          </select>
                          <button
                            onClick={() => removeDraftQuestion(q.id)}
                            disabled={draft.questions.length <= 1}
                            className="focus-ring text-ink/35 hover:text-red-400 transition disabled:opacity-30"
                            title="Remove question"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <input
                        value={q.text}
                        onChange={(e) => updateDraftQuestion(q.id, { text: e.target.value })}
                        placeholder="Question text"
                        className="text-sm font-medium mb-3 w-full bg-transparent outline-none border-b border-line2 focus:border-ink/40 pb-1"
                      />

                      {q.type !== "text" ? (
                        <div className="space-y-1.5">
                          {(q.options || []).map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                              <input
                                value={opt}
                                onChange={(e) => updateOption(q.id, oi, e.target.value)}
                                placeholder={`Option ${oi + 1}`}
                                className="flex-1 text-xs text-ink/70 border border-line rounded-lg px-3 py-2 bg-transparent outline-none focus:border-ink/40"
                              />
                              <button
                                onClick={() => removeOption(q.id, oi)}
                                disabled={(q.options || []).length <= 2}
                                className="focus-ring text-ink/30 hover:text-red-400 transition disabled:opacity-30"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => addOption(q.id)}
                            className="focus-ring flex items-center gap-1 text-xs text-ink/40 hover:text-ink transition mt-1"
                          >
                            <Plus size={12} /> Add option
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-ink/30 border border-dashed border-line2 rounded-lg px-3 py-2">
                          Open text response
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={addDraftQuestion}
                    className="focus-ring w-full flex items-center justify-center gap-1.5 text-sm font-medium text-ink/50 hover:text-ink border border-dashed border-line2 rounded-xl py-3 transition"
                  >
                    <Plus size={14} /> Add question
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {survey.questions.map((q, i) => (
                    <div key={q.id} className="border border-line rounded-xl p-4">
                      <div className="text-xs text-ink/35 mb-1.5">Question {i + 1}</div>
                      <div className="text-sm font-medium mb-3">{q.text}</div>
                      {q.type !== "text" ? (
                        <div className="space-y-1.5">
                          {q.options.map((opt) => (
                            <div key={opt} className="text-xs text-ink/50 border border-line rounded-lg px-3 py-2">
                              {opt}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-ink/30 border border-dashed border-line2 rounded-lg px-3 py-2">
                          Open text response
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "responses" && <ResponsesTab survey={survey} />}

          {tab === "templates" && (
            <div>
              <p className="text-xs text-ink/40 mb-4">
                Choose how respondents see this survey. Currently: <span className="text-ink/70 font-medium">{getTemplate(survey.templateId || recommendTemplate(survey.questions).id).name}</span>
              </p>
              <TemplatePicker
                questions={survey.questions}
                selectedId={survey.templateId || recommendTemplate(survey.questions).id}
                recommendedId={recommendTemplate(survey.questions).id}
                onSelect={requestTemplateChange}
              />
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title={`Delete "${survey.title}"?`}
          description={`This permanently deletes the survey, its questions, and all ${survey.responses.length} response${survey.responses.length === 1 ? "" : "s"}. This can't be undone.`}
          confirmLabel="Delete"
          danger
          busy={deleting}
          busyLabel="Deleting…"
          onConfirm={handleDelete}
          onCancel={() => !deleting && setConfirmDelete(false)}
        />
      )}

      {pendingTemplateId && (
        <ConfirmModal
          title="Change template?"
          description={`Switch to "${getTemplate(pendingTemplateId).name}"? Respondents will see the new layout the next time they open this survey.`}
          confirmLabel="Change template"
          onConfirm={confirmTemplateChange}
          onCancel={() => setPendingTemplateId(null)}
        />
      )}

      {previewOpen && (
        <PreviewModal survey={survey} onClose={() => setPreviewOpen(false)} />
      )}
    </div>
  );
}

// Google-Forms-style summary: a per-question breakdown of every answer,
// followed by each individual response with its own answers laid out
// question-by-question — not just a bare submission timestamp.
function ResponsesTab({ survey }) {
  if (survey.responses.length === 0) {
    return (
      <div className="border border-dashed border-line2 rounded-xl py-16 text-center text-sm text-ink/40">
        No responses yet. Share the survey link to start collecting them.
      </div>
    );
  }

  const stats = aggregateResponses(survey);

  return (
    <div className="space-y-8">
      {/* Summary — aggregated per question */}
      <div className="space-y-5">
        {stats.map((stat) => (
          <div key={stat.id} className="border border-line rounded-xl p-4">
            <div className="text-sm font-medium mb-3">{stat.question}</div>
            {stat.type === "text" ? (
              stat.samples.length === 0 ? (
                <div className="text-xs text-ink/30">No answers yet</div>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {stat.samples.map((s, i) => (
                    <div key={i} className="text-xs text-ink/60 bg-panel2 rounded-lg px-3 py-2">
                      {s}
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="space-y-2">
                {stat.breakdown.map((b) => (
                  <div key={b.option} className="flex items-center gap-3">
                    <div className="text-xs text-ink/60 w-28 shrink-0 truncate">{b.option}</div>
                    <div className="flex-1 h-2 bg-panel2 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-accent-from to-accent-to" style={{ width: `${b.pct}%` }} />
                    </div>
                    <div className="text-xs text-ink/40 w-16 shrink-0 text-right">
                      {b.count} ({b.pct}%)
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Individual responses */}
      <div>
        <div className="text-[11px] font-semibold text-ink/35 uppercase tracking-wide mb-3">
          Individual responses ({survey.responses.length})
        </div>
        <div className="space-y-3">
          {survey.responses.map((r) => (
            <div key={r.id} className="border border-line rounded-xl p-4">
              <div className="text-xs text-ink/40 mb-3">
                Submitted {new Date(r.submittedAt).toLocaleString()}
              </div>
              <div className="space-y-2.5">
                {survey.questions.map((q) => {
                  const a = r.answers?.[q.id];
                  const display = Array.isArray(a) ? (a.length ? a.join(", ") : "—") : a || "—";
                  return (
                    <div key={q.id}>
                      <div className="text-xs text-ink/35 mb-0.5">{q.text}</div>
                      <div className="text-sm text-ink/80">{display}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Renders the survey exactly as a respondent would see it — read-only,
// nothing gets recorded — the same way Google Forms' eye-icon "Preview"
// works.
function PreviewModal({ survey, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div
        className="w-full max-w-xl max-h-[88vh] bg-canvas border border-line rounded-2xl shadow-modal overflow-hidden flex flex-col animate-fadeInUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-line shrink-0">
          <span className="text-sm font-medium text-ink/70">Survey preview</span>
          <button
            onClick={onClose}
            className="focus-ring w-7 h-7 rounded-full flex items-center justify-center text-ink/50 hover:text-ink hover:bg-panel2 transition"
          >
            <X size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SurveyFormChrome survey={survey} answeredCount={0} previewBanner>
            <SurveyForm survey={survey} interactive={false} />
          </SurveyFormChrome>
        </div>
      </div>
    </div>
  );
}