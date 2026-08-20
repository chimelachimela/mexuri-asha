import QuestionField from "../QuestionField";
import StepNav from "../StepNav";
import styles from "./Magazine.module.css";

export default function Magazine({ survey, runtime }) {
    const { index, answers, setAnswer, toggleMulti, isAnswered, submitting, next, back } = runtime;
    const q = survey.questions[index];
    const total = survey.questions.length;

    return (
        <div className={styles.page}>
            <div className={styles.column}>
                <div className={styles.kicker}>{survey.title}</div>
                <h2 className={styles.question}>{q.text}</h2>
                <div className={styles.field}>
                    <QuestionField
                        question={q}
                        value={answers[q.id]}
                        onSingle={(v) => setAnswer(q.id, v)}
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
            </div>
        </div>
    );
}
