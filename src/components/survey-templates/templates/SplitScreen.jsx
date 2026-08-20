import QuestionField from "../QuestionField";
import StepNav from "../StepNav";
import styles from "./SplitScreen.module.css";

export default function SplitScreen({ survey, runtime }) {
    const { index, answers, setAnswer, toggleMulti, isAnswered, submitting, next, back } = runtime;
    const q = survey.questions[index];
    const total = survey.questions.length;

    return (
        <div className={styles.page}>
            <div className={styles.brandPanel}>
                <div className={styles.title}>{survey.title}</div>
                <div className={styles.progressDots}>
                    {survey.questions.map((_, i) => (
                        <span key={i} className={`${styles.dot} ${i <= index ? styles.dotActive : ""}`} />
                    ))}
                </div>
            </div>
            <div className={styles.questionPanel}>
                <div className={styles.inner}>
                    <h2 className={styles.question}>{q.text}</h2>
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
        </div>
    );
}
