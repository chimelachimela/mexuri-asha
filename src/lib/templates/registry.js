// Template registry: each entry describes one form-presentation
// template — how a generated survey gets rendered to respondents.
//
// Two responsibilities live here per template:
//   - compatible(questions): hard gate — is this template even usable
//     for this survey's question mix? Used to hide/disable it in the
//     builder's template picker.
//   - score(questions): soft ranking, 0-1 — among compatible templates,
//     how good a fit is this one? Used to pick the default recommendation.

function optionLengths(questions) {
    return questions
        .filter((q) => q.type === "single" || q.type === "multi")
        .flatMap((q) => q.options || [])
        .map((o) => o.length);
}

function counts(questions) {
    const total = questions.length || 1;
    const text = questions.filter((q) => q.type === "text").length;
    const choice = questions.filter((q) => q.type === "single" || q.type === "multi").length;
    return { total, text, choice };
}

export const TEMPLATES = [
    {
        id: "stack",
        name: "Stack",
        blurb: "One question per card, next cards peeking behind.",
        compatible: () => true,
        score: () => 0.45, // safe universal fallback — never scores highest on its own merit
    },
    {
        id: "fullscreen",
        name: "Full screen",
        blurb: "One big centered question at a time, minimal chrome.",
        compatible: () => true,
        score: (questions) => (counts(questions).total <= 5 ? 0.75 : 0.35),
    },
    {
        id: "chat",
        name: "Chat",
        blurb: "Questions and answers as conversation bubbles.",
        compatible: (questions) => questions.length <= 15,
        score: (questions) => {
            const { total } = counts(questions);
            return total >= 4 && total <= 10 ? 0.6 : 0.4;
        },
    },
    {
        id: "singlepanel",
        name: "Single panel",
        blurb: "Every question on one scrollable page.",
        compatible: () => true,
        score: (questions) => (counts(questions).total <= 4 ? 0.7 : 0.3),
    },
    {
        id: "splitscreen",
        name: "Split screen",
        blurb: "Fixed brand panel beside the current question.",
        compatible: () => true,
        score: () => 0.5,
    },
    {
        id: "tilegrid",
        name: "Tile grid",
        blurb: "Answer options as tappable tiles instead of a list.",
        compatible: (questions) => {
            if (questions.length === 0) return false;
            const hasText = questions.some((q) => q.type === "text");
            const tooLong = optionLengths(questions).some((l) => l > 30);
            return !hasText && !tooLong;
        },
        score: (questions) => {
            const { choice, total } = counts(questions);
            const lens = optionLengths(questions);
            const avgLen = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
            return (choice / total) * (avgLen < 15 ? 1 : 0.5);
        },
    },
    {
        id: "wizard",
        name: "Wizard sidebar",
        blurb: "Desktop step list on the left, question on the right.",
        compatible: (questions) => questions.length >= 3,
        score: (questions) => {
            const { total } = counts(questions);
            return total >= 6 && total <= 20 ? 0.65 : 0.3;
        },
    },
    {
        id: "magazine",
        name: "Magazine",
        blurb: "Big serif headline question, editorial whitespace.",
        compatible: (questions) => questions.length <= 10,
        score: (questions) => {
            const { text, total } = counts(questions);
            return (text / total) * 0.8 + 0.2;
        },
    },
    {
        id: "slidedeck",
        name: "Slide deck",
        blurb: "Presentation-style, slide number in the corner.",
        compatible: (questions) => questions.length >= 3,
        score: (questions) => {
            const { total } = counts(questions);
            return total >= 5 && total <= 15 ? 0.55 : 0.3;
        },
    },
];

export function getTemplate(id) {
    return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}
