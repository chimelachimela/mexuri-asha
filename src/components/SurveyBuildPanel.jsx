import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { X, FileText, ArrowRight, Loader2 } from "lucide-react";

export default function SurveyBuildPanel({ survey, building, onClose }) {
  const navigate = useNavigate();

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, []);

  const content = (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium text-ink/70">
          <FileText size={16} />
          Survey builder
        </div>
        <button
          onClick={onClose}
          className="focus-ring w-7 h-7 rounded-full flex items-center justify-center text-ink/50 hover:text-ink hover:bg-panel2 transition"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-5" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}>
        {building ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-16">
            <Loader2 size={22} className="animate-spin text-accent-soft" />
            <p className="text-sm text-ink/50">Asha is building your survey…</p>
          </div>
        ) : (
          <div className="animate-fadeInUp">
            <h3 className="text-xl font-bold mb-1.5">{survey.title}</h3>
            <p className="text-sm text-ink/50 mb-6">{survey.description}</p>

            <div className="space-y-4">
              {survey.questions.map((q, i) => (
                <div key={q.id} className="border border-line rounded-xl p-4">
                  <div className="text-xs text-ink/35 mb-1.5">Question {i + 1}</div>
                  <div className="text-sm font-medium mb-3">{q.text}</div>
                  {q.type !== "text" && (
                    <div className="space-y-1.5">
                      {q.options.map((opt) => (
                        <div key={opt} className="text-xs text-ink/50 border border-line rounded-lg px-3 py-2">
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                  {q.type === "text" && (
                    <div className="text-xs text-ink/30 border border-dashed border-line2 rounded-lg px-3 py-2">
                      Open text response
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {!building && (
        <div className="p-5 border-t border-line shrink-0">
          <button
            onClick={() => navigate(`/surveys/${survey.id}`)}
            className="focus-ring w-full flex items-center justify-center gap-2 bg-btn text-btn-foreground font-medium text-sm py-3 rounded-xl hover:bg-btn/90 transition"
          >
            Go to Survey
            <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop: right side panel */}
      <div className="hidden md:block w-[380px] shrink-0 h-screen border-l border-line bg-panel animate-slideInRight">
        {content}
      </div>

      {/* Mobile: bottom sheet overlay */}
      <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end touch-none" onClick={onClose}>
        <div
          className="w-full max-h-[85vh] bg-panel border-t border-line rounded-t-2xl animate-slideUpSheet flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-1 bg-ink/20 rounded-full mx-auto mt-3 shrink-0" />
          <div className="flex-1 min-h-0 flex flex-col">{content}</div>
        </div>
      </div>
    </>
  );
}