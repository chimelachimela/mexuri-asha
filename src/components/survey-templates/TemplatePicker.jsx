import { Check, Sparkles } from "lucide-react";
import { getCompatibleTemplates } from "../../lib/templates/compatibility";
import TemplateThumbnail from "./TemplateThumbnail";

// Shows a grid of visual preview cards (real layout shape, not just a
// name) so a founder can recognize and swap templates at a glance. Used
// in the builder panel, the survey detail page, and (compact) the in-chat
// design-suggestion card right after Asha builds a survey.
//
// By default shows every compatible template; pass `templates` to show a
// specific shortlist instead (e.g. the in-chat card's three even-handed
// options). `recommendedId` is optional — omit it to present options
// without biasing toward one (matches the "let them choose" chat flow).
export default function TemplatePicker({ questions, selectedId, recommendedId, templates, onSelect, compact = false }) {
  const list = templates || getCompatibleTemplates(questions);

  return (
    <div className={`grid gap-2.5 ${compact ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3"}`}>
      {list.map((t) => {
        const isSelected = t.id === selectedId;
        const isRecommended = recommendedId && t.id === recommendedId;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            title={t.blurb}
            className={`focus-ring group relative flex flex-col rounded-xl border overflow-hidden transition text-left ${
              isSelected
                ? "border-accent-soft ring-1 ring-accent-soft"
                : "border-line hover:border-line2"
            }`}
          >
            <div className={`bg-panel2 ${compact ? "p-2" : "p-2.5"}`}>
              <TemplateThumbnail id={t.id} className="w-full aspect-[3/2]" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1.5 border-t border-line">
              <span className={`truncate font-medium ${compact ? "text-[10px]" : "text-xs"} ${isSelected ? "text-ink" : "text-ink/70"}`}>
                {t.name}
              </span>
              {isSelected && <Check size={11} className="shrink-0 text-accent-soft ml-auto" />}
              {isRecommended && !isSelected && (
                <Sparkles size={10} className="shrink-0 text-accent-soft ml-auto" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
