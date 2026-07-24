import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { useApp } from "../context/AppContext";
import { USE_CASES, RESPONSE_STYLES } from "../data/onboardingOptions";
import InstallAppStep from "../components/InstallAppStep";

const STEPS = ["name", "useCase", "style", "install"];

function Dots({ step }) {
  return (
    <div className="flex items-center justify-center gap-2 mt-14">
      {STEPS.map((s, i) => (
        <span
          key={s}
          className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-ink" : "w-1.5 bg-ink/25"
            }`}
        />
      ))}
    </div>
  );
}

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [useCase, setUseCase] = useState(null);
  const [style, setStyle] = useState(null);
  const { completeOnboarding } = useApp();
  const navigate = useNavigate();

  const canContinue =
    (step === 0 && name.trim().length > 0) ||
    (step === 1 && useCase) ||
    (step === 2 && style);

  function handleContinue() {
    setStep(step + 1);
  }

  function handleBack() {
    if (step === 0) return;
    setStep(step - 1);
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xl">
        {step === 0 && (
          <div className="text-center animate-fadeInUp">
            <h1 className="text-2xl sm:text-3xl font-bold mb-8">What's Your Name?</h1>
            <label className="block text-left text-sm font-medium text-ink/70 mb-2">Your name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canContinue && handleContinue()}
              placeholder="e.g. Nicole"
              className="focus-ring w-full bg-transparent border border-line2 rounded-xl px-4 py-3.5 text-center placeholder:text-ink/30 focus:border-accent-soft transition"
            />
          </div>
        )}

        {step === 1 && (
          <div className="text-center animate-fadeInUp">
            <h1 className="text-2xl sm:text-3xl font-bold mb-8">What Will You Use Asha For?</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {USE_CASES.map(({ id, label, icon: Icon, blurb }) => (
                <button
                  key={id}
                  onClick={() => setUseCase(id)}
                  className={`focus-ring text-left p-4 rounded-xl border transition ${useCase === id
                      ? "border-accent-soft bg-accent-soft/10"
                      : "border-line2 hover:border-line2 hover:bg-panel"
                    }`}
                >
                  <Icon size={20} className={useCase === id ? "text-accent-soft" : "text-ink/60"} />
                  <div className="mt-2.5 text-sm font-semibold">{label}</div>
                  <div className="text-[11px] text-ink/40 mt-0.5 leading-tight">{blurb}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="text-center animate-fadeInUp">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">How Should Asha Respond?</h1>
            <p className="text-ink/40 text-sm mb-8">You can change this anytime in settings.</p>
            <div className="grid grid-cols-2 gap-3">
              {RESPONSE_STYLES.map(({ id, label, blurb }) => (
                <button
                  key={id}
                  onClick={() => setStyle(id)}
                  className={`focus-ring relative text-left p-4 rounded-xl border transition ${style === id
                      ? "border-accent-soft bg-accent-soft/10"
                      : "border-line2 hover:border-line2 hover:bg-panel"
                    }`}
                >
                  {style === id && (
                    <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-accent-soft flex items-center justify-center">
                      <Check size={11} strokeWidth={3} />
                    </span>
                  )}
                  <div className="text-sm font-semibold">{label}</div>
                  <div className="text-[11px] text-ink/40 mt-0.5 leading-tight">{blurb}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <InstallAppStep
            onDone={async () => {
              await completeOnboarding({ name: name.trim(), useCase, responseStyle: style });
              navigate("/loading");
            }}
          />
        )}

        {step < 3 && (
          <div className="flex items-center justify-center gap-6 mt-9">
            {step > 0 && (
              <button onClick={handleBack} className="focus-ring text-sm text-ink/50 hover:text-ink transition">
                Back
              </button>
            )}
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className="focus-ring flex items-center gap-1.5 text-sm font-medium disabled:text-ink/25 disabled:cursor-not-allowed text-ink hover:text-accent-soft transition"
            >
              Continue
              <ArrowRight size={15} />
            </button>
          </div>
        )}

        <Dots step={step} />
      </div>
    </div>
  );
}