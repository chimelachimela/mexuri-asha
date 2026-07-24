// surveyInsights.js — aggregates raw response rows into a compact summary.
//
// Two consumers:
//  1. SurveyDetail.jsx's "Responses" tab — a per-question breakdown, like
//     Google Forms' summary view.
//  2. Chat.jsx — when a survey is referenced with "+", this summary (not the
//     raw response rows) is what gets sent to the AI, so it can reason about
//     real numbers instead of guessing. Sending the aggregate instead of
//     every raw row also keeps the request small and fast.

// Returns [{ question, type, total, breakdown: [{option, count, pct}], samples: [text] }]
export function aggregateResponses(survey) {
  const responses = survey?.responses || [];
  return (survey?.questions || []).map((q) => {
    if (q.type === "text") {
      const samples = responses.map((r) => r.answers?.[q.id]).filter((v) => v != null && v !== "");
      return { id: q.id, question: q.text, type: q.type, total: samples.length, samples };
    }
    const counts = {};
    let answered = 0;
    for (const r of responses) {
      const a = r.answers?.[q.id];
      const vals = Array.isArray(a) ? a : a != null && a !== "" ? [a] : [];
      if (vals.length) answered += 1;
      for (const v of vals) counts[v] = (counts[v] || 0) + 1;
    }
    const totalPicks = Object.values(counts).reduce((s, n) => s + n, 0) || 1;
    const breakdown = (q.options || Object.keys(counts))
      .map((opt) => ({ option: opt, count: counts[opt] || 0, pct: Math.round(((counts[opt] || 0) / totalPicks) * 100) }))
      .sort((a, b) => b.count - a.count);
    return { id: q.id, question: q.text, type: q.type, total: answered, breakdown };
  });
}

// Compact plain-text version for feeding into an AI prompt.
export function summarizeSurveyResponses(survey) {
  const responses = survey?.responses || [];
  if (responses.length === 0) return "No responses have been collected yet for this survey.";

  const lines = [`${responses.length} response${responses.length === 1 ? "" : "s"} collected in total.`];
  for (const stat of aggregateResponses(survey)) {
    lines.push(`\nQ: ${stat.question}`);
    if (stat.type === "text") {
      if (stat.samples.length === 0) {
        lines.push("  (no answers yet)");
      } else {
        stat.samples.slice(0, 8).forEach((s) => lines.push(`  - "${String(s).slice(0, 140)}"`));
        if (stat.samples.length > 8) lines.push(`  ...and ${stat.samples.length - 8} more open-text answers.`);
      }
    } else if (stat.breakdown.every((b) => b.count === 0)) {
      lines.push("  (no answers yet)");
    } else {
      stat.breakdown.forEach((b) => lines.push(`  - ${b.option}: ${b.count} (${b.pct}%)`));
    }
  }
  return lines.join("\n");
}
