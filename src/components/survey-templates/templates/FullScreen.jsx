import QuestionField from "../QuestionField";
import StepNav from "../StepNav";
import styles from "./FullScreen.module.css";

export default function FullScreen({ survey, runtime }) {
    const { index, answers, setAnswer, toggleMulti, isAnswered, submitting, next, back } = runtime;
    const q = survey.questions[index];
    const total = survey.questions.length;

    return (
        <div className={styles.page}>
            <div className={styles.center}>
                <h2 key={q.id} className={styles.question}>
                    {q.text}
                </h2>
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
            </div>
        </div>
    );
}
