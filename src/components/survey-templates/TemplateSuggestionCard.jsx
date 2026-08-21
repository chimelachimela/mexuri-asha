import { Sparkles, Loader2, Check, MessageSquare } from "lucide-react";
import TemplatePicker from "./TemplatePicker";
import { getTemplate } from "../../lib/templates/registry";
import { rankTemplates } from "../../lib/templates/compatibility";

// Shown in chat right after Asha drafts a survey. Rather than auto-picking
// one design and pre-selecting it, this offers three even-handed options —
// the founder decides, either by tapping a card here or by describing what
// they want in the chatbox below (see Chat.jsx's handleSend/matchTemplateFromText).
// Picking one is what actually triggers the survey to be created (see
// Chat.jsx's handleConfirmDesign) — this component never talks to the DB itself.
export default function TemplateSuggestionCard({
  questions,
  templateId, // set once locked (the design that was actually chosen)
  locked = false,
  building = false,
  onSelect,
}) {
  const shortlist = rankTemplates(questions, 3);
  const lockedTemplate = locked ? getTemplate(templateId) : null;

  return (
    <div className="mt-3 border border-line rounded-xl p-4 max-w-sm">
      <div className="flex items-center gap-1.5 text-xs font-medium text-accent-soft mb-2.5">
        <Sparkles size={13} />
        {locked ? "Design" : "Three directions that would fit"}
        {building && <Loader2 size={11} className="animate-spin ml-1 text-ink/40" />}
        {locked && !building && (
          <span className="flex items-center gap-1 text-emerald-400 ml-auto">
            <Check size={11} /> Chosen
          </span>
        )}
      </div>

      {locked && lockedTemplate ? (
        <>
          <div className="mb-1 text-sm font-semibold text-ink">{lockedTemplate.name}</div>
          <p className="text-xs text-ink/50 mb-3 leading-relaxed">{lockedTemplate.blurb}</p>
        </>
      ) : (
        <p className="text-xs text-ink/50 mb-3 leading-relaxed">
          None of these is "the" pick — tap one, or just tell me what look you want in the chatbox.
        </p>
      )}

      <fieldset disabled={locked || building} className="disabled:opacity-60">
        <TemplatePicker
          questions={questions}
          templates={locked ? [lockedTemplate] : shortlist}
          selectedId={locked ? templateId : null}
          onSelect={onSelect}
          compact
        />
      </fieldset>

      {!locked && !building && (
        <p className="text-[11px] text-ink/35 mt-3 flex items-center gap-1">
          <MessageSquare size={10} /> Or describe it — e.g. "make it feel like a slideshow".
        </p>
      )}
    </div>
  );
}
