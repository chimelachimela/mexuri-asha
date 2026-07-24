import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Check } from "lucide-react";
import * as db from "../lib/services/dbService";
import { SurveyThanksScreen } from "../components/SurveyForm";

// Small, irregular rotations so nothing lines up perfectly — that's the whole trick.
const OPTION_TILTS = ["-0.6deg", "0.5deg", "-0.4deg", "0.7deg", "-0.3deg", "0.4deg"];

export default function PublicSurvey() {
    const { slug } = useParams();
    const [survey, setSurvey] = useState(undefined); // undefined = loading, null = not found
    const [answers, setAnswers] = useState({});
    const [index, setIndex] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        db.getSurveyBySlug(slug).then((s) => setSurvey(s && s.status === "published" ? s : null));
    }, [slug]);

    function setAnswer(questionId, value) {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
    }

    function toggleMulti(questionId, option) {
        setAnswers((prev) => {
            const current = prev[questionId] || [];
            const next = current.includes(option)
                ? current.filter((o) => o !== option)
                : [...current, option];
            return { ...prev, [questionId]: next };
        });
    }

    function isAnswered(q) {
        const a = answers[q.id];
        return q.type === "multi" ? !!a && a.length > 0 : !!a;
    }

    async function handleSubmit() {
        if (submitting) return;
        setSubmitting(true);
        try {
            await db.submitResponse(survey.id, answers);
            setSubmitted(true);
        } catch (err) {
            console.error(err);
            setSubmitting(false);
        }
    }

    function handleNext() {
        const q = survey.questions[index];
        if (!isAnswered(q)) return;
        if (index === survey.questions.length - 1) {
            handleSubmit();
        } else {
            setIndex((i) => i + 1);
        }
    }

    function handleBack() {
        setIndex((i) => Math.max(0, i - 1));
    }

    if (survey === undefined) {
        return (
            <div className="min-h-screen bg-canvas flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-ink/20 border-t-ink/70 rounded-full animate-spin" />
            </div>
        );
    }

    if (survey === null) {
        return (
            <div className="min-h-screen bg-canvas flex items-center justify-center px-6">
                <div className="text-center max-w-sm">
                    <h1 className="text-xl font-bold mb-2">Survey not found</h1>
                    <p className="text-ink/40 text-sm">
                        This link may be wrong, or the survey isn't published anymore.
                    </p>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-canvas">
                <SurveyThanksScreen />
            </div>
        );
    }

    const q = survey.questions[index];
    const total = survey.questions.length;

    return (
        <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 py-10">
            <div className="flex items-center gap-2 mb-8">
                <img
                    src="https://res.cloudinary.com/xtydyhi0/image/upload/v1784464670/Asha_Logo_forBlack_mt8s2u.svg"
                    width="40"
                    alt=""
                />
                <span className="text-base font-medium text-ink/50">{survey.title}</span>
            </div>

            <div className="relative w-full max-w-md">
                {/* solid offset block instead of a soft shadow — this is the load-bearing move */}
                <div className="absolute inset-0 bg-accent rounded-xl2 -rotate-3" />

                <div
                    key={q.id}
                    className="relative bg-panel border-[3px] border-ink rounded-xl2 p-6 rotate-1 animate-fadeInUp"
                >
                    <div className="flex items-center justify-between mb-6">
                        <span
                            className="inline-block text-xs font-medium px-3 py-1 rounded-full border-2 border-ink bg-panel2 -rotate-2"
                        >
                            question {index + 1} of {total}
                        </span>
                    </div>

                    <h2 className="text-2xl font-bold mb-6 leading-snug">{q.text}</h2>

                    {(q.type === "single" || q.type === "multi") && (
                        <>
                            <div className="text-[11px] font-medium tracking-wide text-ink/40 mb-3">
                                {q.type === "multi" ? "pick as many as you want" : "pick one"}
                            </div>
                            <div className="flex flex-col gap-2.5">
                                {q.options.map((opt, i) => {
                                    const selected =
                                        q.type === "multi"
                                            ? (answers[q.id] || []).includes(opt)
                                            : answers[q.id] === opt;
                                    return (
                                        <button
                                            key={opt}
                                            onClick={() =>
                                                q.type === "multi" ? toggleMulti(q.id, opt) : setAnswer(q.id, opt)
                                            }
                                            style={{ transform: `rotate(${OPTION_TILTS[i % OPTION_TILTS.length]})` }}
                                            className={`focus-ring text-left text-sm font-medium py-3 px-4 rounded-2xl border-[2.5px] border-ink transition-transform hover:-translate-y-0.5 ${selected ? "bg-accent-soft/20" : "bg-panel"
                                                }`}
                                        >
                                            <span className="flex items-center gap-2.5">
                                                {selected && <Check size={15} strokeWidth={3} className="shrink-0" />}
                                                {opt}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {q.type === "scale" && (
                        <div className="flex gap-2.5">
                            {q.options.map((opt, i) => (
                                <button
                                    key={opt}
                                    onClick={() => setAnswer(q.id, opt)}
                                    style={{ transform: `rotate(${OPTION_TILTS[i % OPTION_TILTS.length]})` }}
                                    className={`focus-ring flex-1 text-sm font-bold rounded-2xl border-[2.5px] border-ink py-3 transition-transform hover:-translate-y-0.5 ${answers[q.id] === opt ? "bg-accent-soft/20" : "bg-panel"
                                        }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    )}

                    {q.type === "text" && (
                        <textarea
                            rows={3}
                            value={answers[q.id] || ""}
                            onChange={(e) => setAnswer(q.id, e.target.value)}
                            placeholder="Type away…"
                            className="focus-ring w-full bg-panel2 border-[2.5px] border-ink rounded-2xl px-4 py-3 text-sm placeholder:text-ink/30 resize-none"
                        />
                    )}

                    <div className="flex items-center justify-between mt-7">
                        <button
                            onClick={handleBack}
                            disabled={index === 0}
                            className="focus-ring text-sm font-medium text-ink/50 hover:text-ink disabled:opacity-30 disabled:cursor-default transition"
                        >
                            back
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={!isAnswered(q) || submitting}
                            className="focus-ring bg-btn text-btn-foreground font-bold text-sm rounded-full px-6 py-2.5 border-[2.5px] border-ink disabled:opacity-40 hover:-translate-y-0.5 transition -rotate-1"
                        >
                            {submitting
                                ? "sending…"
                                : index === total - 1
                                    ? "send it →"
                                    : "next →"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="text-xs text-ink/30 mt-6">
                {index + 1} of {total}
            </div>
        </div>
    );
}