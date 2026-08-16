export default function SurveyPickerModal({ surveys, onPick, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="w-full max-w-sm bg-panel border border-line rounded-xl2 shadow-modal overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-line">
                    <h3 className="text-sm font-semibold text-ink">Add a survey</h3>
                    <button onClick={onClose} className="focus-ring text-ink/50 hover:text-ink text-xl leading-none px-1">
                        &times;
                    </button>
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                    {surveys.length === 0 && (
                        <div className="text-xs text-ink/30 px-5 py-4">No surveys yet</div>
                    )}
                    {surveys.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => onPick(s)}
                            className="focus-ring w-full text-left px-5 py-2.5 text-sm text-ink/80 hover:bg-panel2 hover:text-ink transition truncate"
                        >
                            {s.title}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}