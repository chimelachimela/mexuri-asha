import QuestionField from "../QuestionField";
import StepNav from "../StepNav";
import styles from "./Chat.module.css";

function formatAnswer(value) {
    if (Array.isArray(value)) return value.join(", ");
    return String(value ?? "");
}

export default function Chat({ survey, runtime }) {
    const { index, answers, setAnswer, toggleMulti, isAnswered, submitting, next, back } = runtime;
    const total = survey.questions.length;
    const history = survey.questions.slice(0, index);
    const current = survey.questions[index];

    return (
        <div className={styles.page}>
            <div className={styles.thread}>
                {history.map((q) => (
                    <div key={q.id} className={styles.pair}>
                        <div className={styles.askBubble}>{q.text}</div>
                        <div className={styles.answerBubble}>{formatAnswer(answers[q.id])}</div>
                    </div>
                ))}
                <div className={styles.pair}>
                    <div className={styles.askBubble}>{current.text}</div>
                    <div className={styles.inputWrap}>
                        <QuestionField
                            question={current}
                            value={answers[current.id]}
                            onSingle={(v) => {
                                setAnswer(current.id, v);
                                if (current.type === "single") setTimeout(next, 150);
                            }}
                            onMulti={(v) => toggleMulti(current.id, v)}
                            onText={(v) => setAnswer(current.id, v)}
                        />
                        <StepNav
                            index={index}
                            total={total}
                            isAnswered={isAnswered(current)}
                            submitting={submitting}
                            onBack={back}
                            onNext={next}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
