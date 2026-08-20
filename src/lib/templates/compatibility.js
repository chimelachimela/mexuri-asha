import { TEMPLATES } from "./registry";

// Returns the subset of templates usable for this survey's question mix.
// Drives which templates are enabled vs grayed-out in the builder's
// template picker.
export function getCompatibleTemplates(questions) {
    if (!questions || questions.length === 0) return TEMPLATES;
    return TEMPLATES.filter((t) => t.compatible(questions));
}

// Picks the best default among compatible templates by score. Stack
// scores low on purpose, so it only wins when nothing else fits better —
// it's the fallback, not a competitor.
export function recommendTemplate(questions) {
    const compatible = getCompatibleTemplates(questions);
    if (compatible.length === 0) return TEMPLATES[0]; // stack is always compatible, this shouldn't happen

    let best = compatible[0];
    let bestScore = best.score(questions);
    for (const t of compatible.slice(1)) {
        const s = t.score(questions);
        if (s > bestScore) {
            best = t;
            bestScore = s;
        }
    }
    return best;
}

// Edit-time check: is the currently selected template still valid for
// the (possibly just-edited) question set?
//
// Call this after any question/option edit. If it returns false, the
// selected template is no longer usable — call recommendTemplate()
// again and apply the new result as the selection. Per policy, this is
// the ONLY time a re-recommendation should happen: routine edits that
// don't break the current template leave the founder's choice alone.
export function isTemplateCompatible(templateId, questions) {
    const compatible = getCompatibleTemplates(questions);
    return compatible.some((t) => t.id === templateId);
}

// Convenience wrapper for the edit flow described above.
export function resolveTemplateAfterEdit(currentTemplateId, questions) {
    if (isTemplateCompatible(currentTemplateId, questions)) {
        return { templateId: currentTemplateId, changed: false };
    }
    const recommended = recommendTemplate(questions);
    return { templateId: recommended.id, changed: true };
}
