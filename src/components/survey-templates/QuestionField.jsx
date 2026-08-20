import { Check } from "lucide-react";
import styles from "./QuestionField.module.css";

// variant: "list" (default vertical option list) | "tile" (grid of tiles)
export default function QuestionField({ question, value, onSingle, onMulti, onText, variant = "list" }) {
    if (question.type === "single" || question.type === "multi") {
        return (
            <div className={variant === "tile" ? styles.tileGrid : styles.optionList}>
                {question.options.map((opt) => {
                    const selected = question.type === "multi" ? (value || []).includes(opt) : value === opt;
                    return (
                        <button
                            key={opt}
                            type="button"
                            className={`${styles.option} ${selected ? styles.optionSelected : ""}`}
                            onClick={() => (question.type === "multi" ? onMulti(opt) : onSingle(opt))}
                        >
                            <span className={styles.optionLabel}>
                                {selected && <Check size={14} strokeWidth={3} className={styles.check} />}
                                {opt}
                            </span>
                        </button>
                    );
                })}
            </div>
        );
    }

    if (question.type === "scale") {
        return (
            <div className={styles.scaleRow}>
                {question.options.map((opt) => (
                    <button
                        key={opt}
                        type="button"
                        className={`${styles.scaleOption} ${value === opt ? styles.optionSelected : ""}`}
                        onClick={() => onSingle(opt)}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        );
    }

    return (
        <textarea
            className={styles.textArea}
            rows={3}
            value={value || ""}
            onChange={(e) => onText(e.target.value)}
            placeholder="Type your answer…"
        />
    );
}
