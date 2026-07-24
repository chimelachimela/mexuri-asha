import { useState } from "react";
import { X } from "lucide-react";

export default function SurveyQuestionModal({ questions, onClose, onComplete }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const q = questions[index];
  const progress = ((index + 1) / questions.length) * 100;
  const selected = answers[q.id];

  function selectOption(opt) {
    setAnswers((a) => ({ ...a, [q.id]: opt }));
  }

  function handleNext() {
    if (index < questions.length - 1) {
      setIndex(index + 1);
    } else {
      onComplete({ ...answers });
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-panel border border-line rounded-2xl shadow-modal p-6 relative animate-fadeInUp">
        <div className="h-1 bg-line rounded-full overflow-hidden mb-5">
          <div
            className="h-full bg-gradient-to-r from-accent-from to-accent-to transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <button
          onClick={onClose}
          className="focus-ring absolute top-5 right-5 w-7 h-7 rounded-full border border-line2 flex items-center justify-center text-ink/50 hover:text-ink hover:border-ink/40 transition"
        >
          <X size={14} />
        </button>

        <div className="text-xs text-ink/40 mb-1.5">
          Question {index + 1} of {questions.length}
        </div>
        <h2 className="text-lg font-bold leading-snug mb-4 pr-8">{q.text}</h2>
        <div className="text-xs text-ink/40 mb-2">Choose one</div>

        <div className="space-y-2.5 mb-6">
          {q.options.map((opt) => (
            <button
              key={opt}
              onClick={() => selectOption(opt)}
              className={`focus-ring w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl border transition ${
                selected === opt
                  ? "border-accent-soft bg-accent-soft/10"
                  : "border-line2 hover:border-line2 hover:bg-panel3"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center ${
                  selected === opt ? "border-accent-soft" : "border-ink/30"
                }`}
              >
                {selected === opt && <span className="w-2 h-2 rounded-full bg-accent-soft" />}
              </span>
              <span className="text-sm">{opt}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleNext}
            disabled={!selected}
            className="focus-ring bg-btn text-btn-foreground disabled:opacity-30 disabled:cursor-not-allowed font-medium text-sm px-5 py-2.5 rounded-xl hover:bg-btn/90 transition"
          >
            {index === questions.length - 1 ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
