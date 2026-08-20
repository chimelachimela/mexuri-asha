import { getCompatibleTemplates } from "../lib/templates/compatibility";
import { Check } from "lucide-react";

// Shows every template compatible with the current question mix as a
// row of chips. Used both right after Asha builds a survey (in the
// chat build panel) and later on the survey detail page, so a founder
// can override the recommendation at either point.
export default function TemplatePicker({ questions, selectedId, recommendedId, onSelect }) {
    const compatible = getCompatibleTemplates(questions);

    return (
        <div className="flex flex-wrap gap-2">
            {compatible.map((t) => {
                const isSelected = t.id === selectedId;
                const isRecommended = t.id === recommendedId;
                return (
                    <button
                        key={t.id}
                        onClick={() => onSelect(t.id)}
                        title={t.blurb}
                        className={`focus-ring flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition ${isSelected
                                ? "border-accent-soft bg-accent-soft/10 text-ink"
                                : "border-line2 text-ink/60 hover:border-ink/30 hover:text-ink"
                            }`}
                    >
                        {isSelected && <Check size={11} />}
                        {t.name}
                        {isRecommended && !isSelected && (
                            <span className="text-[9px] text-accent-soft">Suggested</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}