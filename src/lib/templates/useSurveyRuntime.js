import { useState } from "react";

// Centralizes the state every template needs: answers, which step is
// active, and submit/loading state. Templates that show one question
// at a time use `index`/`next`/`back`/`goTo`; templates that show every
// question at once (Single panel) ignore stepping and just read
// `answers` + `isAnswered` for each question, then call `submit`
// directly once `allAnswered()` is true.
export function useSurveyRuntime(survey, onSubmit) {
    const [answers, setAnswers] = useState({});
    const [index, setIndex] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    function setAnswer(questionId, value) {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
    }

    function toggleMulti(questionId, option) {
        setAnswers((prev) => {
            const current = prev[questionId] || [];
            const nextVal = current.includes(option)
                ? current.filter((o) => o !== option)
                : [...current, option];
            return { ...prev, [questionId]: nextVal };
        });
    }

    function isAnswered(q) {
        const a = answers[q.id];
        return q.type === "multi" ? !!a && a.length > 0 : !!a;
    }

    function allAnswered() {
        return !!survey && survey.questions.every(isAnswered);
    }

    async function submit() {
        if (submitting || !survey) return;
        setSubmitting(true);
        try {
            await onSubmit(answers);
            setSubmitted(true);
        } catch (err) {
            console.error(err);
            setSubmitting(false);
        }
    }

    function next() {
        if (!survey) return;
        const q = survey.questions[index];
        if (!isAnswered(q)) return;
        if (index === survey.questions.length - 1) {
            submit();
        } else {
            setIndex((i) => i + 1);
        }
    }

    function back() {
        setIndex((i) => Math.max(0, i - 1));
    }

    function goTo(i) {
        if (!survey) return;
        setIndex(Math.max(0, Math.min(i, survey.questions.length - 1)));
    }

    return {
        answers,
        index,
        submitting,
        submitted,
        setAnswer,
        toggleMulti,
        isAnswered,
        allAnswered,
        next,
        back,
        goTo,
        submit,
    };
}
