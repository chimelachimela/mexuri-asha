import { Sparkles, Loader2, Check } from "lucide-react";
import TemplatePicker from "./TemplatePicker";
import { getTemplate } from "../../lib/templates/registry";

// Shown in chat right after Asha drafts a survey — a Lovable-style "here's
// a design direction" moment, with a real visual preview instead of just
// naming the template. Picking one here is what actually triggers the
// survey to be created (see Chat.jsx's handleConfirmDesign) — this
// component is purely presentational and never talks to the DB itself.
export default function TemplateSuggestionCard({
  questions,
  templateId,
  reason,
  locked = false,
  building = false,
  onSelect,
}) {
  const template = getTemplate(templateId);

  return (
    <div className="mt-3 border border-line rounded-xl p-4 max-w-sm">
      <div className="flex items-center gap-1.5 text-xs font-medium text-accent-soft mb-2.5">
        <Sparkles size={13} />
        Design suggestion
        {building && <Loader2 size={11} className="animate-spin ml-1 text-ink/40" />}
        {locked && !building && (
          <span className="flex items-center gap-1 text-emerald-400 ml-auto">
            <Check size={11} /> Chosen
          </span>
        )}
      </div>

      <div className="mb-1 text-sm font-semibold text-ink">{template.name}</div>
      <p className="text-xs text-ink/50 mb-3 leading-relaxed">{reason || template.blurb}</p>

      <fieldset disabled={locked || building} className="disabled:opacity-60">
        <TemplatePicker
          questions={questions}
          selectedId={templateId}
          recommendedId={templateId}
          onSelect={onSelect}
          compact
        />
      </fieldset>

      {!locked && !building && (
        <p className="text-[11px] text-ink/35 mt-3">Pick a layout to build your survey.</p>
      )}
    </div>
  );
}
