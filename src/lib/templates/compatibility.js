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

// Top N compatible templates by score, best first. Used to offer a short,
// even-handed shortlist (e.g. "pick one of these three") instead of either
// a single auto-picked winner or the full, unranked compatible list.
export function rankTemplates(questions, limit = 3) {
    const compatible = getCompatibleTemplates(questions);
    return [...compatible]
        .sort((a, b) => b.score(questions) - a.score(questions))
        .slice(0, limit);
}

// Keyword aliases so a founder can type a plain-language description
// ("something like a slideshow") instead of the exact template name.
const TEMPLATE_KEYWORDS = {
    stack: ["stack", "cards", "card stack", "peek"],
    fullscreen: ["full screen", "fullscreen", "minimal", "one at a time", "big centered", "focused"],
    chat: ["chat", "conversation", "conversational", "bubbles", "messaging"],
    singlepanel: ["single panel", "one page", "single page", "scrolling", "all on one page"],
    splitscreen: ["split screen", "split", "side by side", "brand panel"],
    tilegrid: ["tile", "grid", "tiles", "tappable"],
    wizard: ["wizard", "sidebar", "step list", "steps"],
    magazine: ["magazine", "editorial", "serif", "big headline"],
    slidedeck: ["slide deck", "slides", "slideshow", "presentation", "deck"],
};

// Matches free-typed text (from the chat composer) against a shortlist of
// offered templates — by exact/partial name, then by keyword alias. Returns
// the matching template id, or null if nothing in the shortlist matches
// confidently enough to auto-pick (caller should fall back to normal chat
// in that case, rather than guess).
export function matchTemplateFromText(text, templates) {
    if (!text || !templates?.length) return null;
    const needle = text.trim().toLowerCase();
    if (!needle) return null;

    for (const t of templates) {
        if (needle.includes(t.name.toLowerCase())) return t.id;
    }
    for (const t of templates) {
        const keywords = TEMPLATE_KEYWORDS[t.id] || [];
        if (keywords.some((k) => needle.includes(k))) return t.id;
    }
    return null;
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
