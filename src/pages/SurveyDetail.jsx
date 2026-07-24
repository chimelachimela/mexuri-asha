import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Check, Link2, Eye, X, Code2 } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { SurveyForm, SurveyFormChrome } from "../components/SurveyForm";
import * as db from "../lib/services/dbService";
import { aggregateResponses } from "../lib/surveyInsights";
import { useApp } from "../context/AppContext";

export default function SurveyDetail() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { markSurveySeen } = useApp();
  const [survey, setSurvey] = useState(null);
  const [tab, setTab] = useState("questions"); // 'questions' | 'responses'
  const [collapsed, setCollapsed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    db.getSurvey(surveyId).then(setSurvey);
    markSurveySeen(surveyId);
  }, [surveyId]);

  async function togglePublish() {
    const next = survey.status === "published" ? "draft" : "published";
    const updated = await db.setSurveyStatus(survey.id, next);
    setSurvey(updated);
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
            <h1 className="text-2xl font-bold">{survey.title}</h1>
            <div className="flex items-center gap-2 shrink-0">
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
            </div>
          </div>
          <p className="text-ink/40 text-sm mb-4">{survey.description}</p>

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
            {["questions", "responses"].map((t) => (
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

          {tab === "responses" && <ResponsesTab survey={survey} />}
        </div>
      </div>

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
