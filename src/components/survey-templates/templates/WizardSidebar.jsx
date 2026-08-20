import QuestionField from "../QuestionField";
import StepNav from "../StepNav";
import styles from "./WizardSidebar.module.css";

export default function WizardSidebar({ survey, runtime }) {
    const { index, answers, setAnswer, toggleMulti, isAnswered, submitting, next, back, goTo } = runtime;
    const q = survey.questions[index];
    const total = survey.questions.length;

    return (
        <div className={styles.page}>
            <div className={styles.sidebar}>
                <div className={styles.title}>{survey.title}</div>
                <div className={styles.steps}>
                    {survey.questions.map((sq, i) => {
                        const visited = i <= index;
                        return (
                            <button
                                key={sq.id}
                                type="button"
                                className={`${styles.step} ${i === index ? styles.stepActive : ""}`}
                                disabled={!visited}
                                onClick={() => visited && goTo(i)}
                            >
                                {i + 1}. {sq.text}
                            </button>
                        );
                    })}
                </div>
            </div>
            <div className={styles.content}>
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
