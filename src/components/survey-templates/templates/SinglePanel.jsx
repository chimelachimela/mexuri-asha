import QuestionField from "../QuestionField";
import styles from "./SinglePanel.module.css";

export default function SinglePanel({ survey, runtime }) {
    const { answers, setAnswer, toggleMulti, allAnswered, submitting, submit } = runtime;

    return (
        <div className={styles.page}>
            <div className={styles.panel}>
                <h1 className={styles.title}>{survey.title}</h1>
                <div className={styles.list}>
                    {survey.questions.map((q, i) => (
                        <div key={q.id} className={styles.item}>
                            <div className={styles.label}>
                                {i + 1}. {q.text}
                            </div>
                            <QuestionField
                                question={q}
                                value={answers[q.id]}
                                onSingle={(v) => setAnswer(q.id, v)}
                                onMulti={(v) => toggleMulti(q.id, v)}
                                onText={(v) => setAnswer(q.id, v)}
                            />
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    className={styles.submit}
                    disabled={!allAnswered() || submitting}
                    onClick={submit}
                >
                    {submitting ? "sending…" : "submit"}
                </button>
            </div>
        </div>
    );
}
