import QuestionField from "../QuestionField";
import StepNav from "../StepNav";
import styles from "./SlideDeck.module.css";

function pad(n) {
    return String(n).padStart(2, "0");
}

export default function SlideDeck({ survey, runtime }) {
    const { index, answers, setAnswer, toggleMulti, isAnswered, submitting, next, back } = runtime;
    const q = survey.questions[index];
    const total = survey.questions.length;

    return (
        <div className={styles.page}>
            <div className={styles.slide}>
                <h2 className={styles.question}>{q.text}</h2>
                <div className={styles.field}>
                    <QuestionField
                        question={q}
                        value={answers[q.id]}
                        onSingle={(v) => {
                            setAnswer(q.id, v);
                            if (q.type === "single") setTimeout(next, 150);
                        }}
                        onMulti={(v) => toggleMulti(q.id, v)}
                        onText={(v) => setAnswer(q.id, v)}
                    />
                </div>
                <StepNav
                    index={index}
                    total={total}
                    isAnswered={isAnswered(q)}
                    submitting={submitting}
                    onBack={back}
                    onNext={next}
                />
                <span className={styles.slideNumber}>
                    {pad(index + 1)} / {pad(total)}
                </span>
            </div>
        </div>
    );
}
