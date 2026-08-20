import styles from "./StepNav.module.css";

export default function StepNav({ index, total, isAnswered, submitting, onBack, onNext }) {
    return (
        <div className={styles.nav}>
            <button type="button" className={styles.back} onClick={onBack} disabled={index === 0}>
                back
            </button>
            <span className={styles.progress}>
                {index + 1} of {total}
            </span>
            <button type="button" className={styles.next} onClick={onNext} disabled={!isAnswered || submitting}>
                {submitting ? "sending…" : index === total - 1 ? "send it" : "next"}
            </button>
        </div>
    );
}
