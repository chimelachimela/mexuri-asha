import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Circle, CheckCircle2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import Sidebar from "../components/Sidebar";

const HUES = [255, 200, 320, 165, 30, 280];

// A scaled-down live mockup of the survey's first question — same visual
// language as the question-card template — instead of a blank color block.
function CoverArt({ survey }) {
  const hue = HUES[(survey.coverColorSeed ?? 0) % HUES.length] ?? (survey.coverColorSeed ?? 0) % 360;
  const q = survey.questions?.[0];
  const totalQuestions = survey.questions?.length || 1;

  return (
    <div
      className="w-full aspect-square rounded-xl p-3.5 relative overflow-hidden flex flex-col"
      style={{
        background: `linear-gradient(155deg, hsl(${hue} 70% 22%), hsl(${hue + 40} 65% 12%))`,
      }}
    >
      <FileText size={14} className="absolute top-3 right-3 text-white/25" />

      {!survey.seenAt && (
        <span className="absolute top-3 left-3 text-[9px] font-semibold uppercase tracking-wide bg-red-500 text-white px-1.5 py-0.5 rounded-full">
          New
        </span>
      )}

      <div className="h-[3px] bg-white/15 rounded-full overflow-hidden mb-2.5 w-2/3">
        <div className="h-full w-1/3 bg-white/70 rounded-full" />
      </div>

      <div className="text-[9px] text-white/45 mb-1">Question 1 of {totalQuestions}</div>

      <div className="text-[11px] font-semibold text-white leading-snug line-clamp-2 mb-2.5 pr-4">
        {q?.text || survey.title}
      </div>

      {q && q.type !== "text" && (
        <div className="space-y-1 min-h-0 overflow-hidden">
          {(q.options || []).slice(0, 3).map((opt) => (
            <div
              key={opt}
              className="text-[9px] text-white/70 bg-white/[0.07] border border-white/10 rounded-md px-2 py-1 truncate"
            >
              {opt}
            </div>
          ))}
        </div>
      )}

      {q && q.type === "text" && (
        <div className="text-[9px] text-white/35 border border-dashed border-white/15 rounded-md px-2 py-1.5">
          Open response…
        </div>
      )}
    </div>
  );
}

export default function Surveys() {
  const { session, surveys, refreshSurveys } = useApp();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    refreshSurveys();
  }, [session.id]);

  return (
    <div className="h-screen w-full bg-canvas flex overflow-hidden">
      <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((c) => !c)} onNewChat={() => navigate("/chat")} />

      <div className="flex-1 min-w-0 overflow-y-auto px-6 sm:px-10 pt-16 pb-8 md:pt-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">Surveys</h1>
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
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {surveys.map((s) => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/surveys/${s.id}`)}
                  className="focus-ring text-left group"
                >
                  <CoverArt survey={s} />
                  <div className="mt-2.5 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{s.title}</div>
                      <div className="text-xs text-ink/40 truncate">{s.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[11px]">
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
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}