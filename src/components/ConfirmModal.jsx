// Reusable stand-in for window.confirm()/window.prompt() — native browser
// dialogs can't be themed and block the JS thread, so every "are you sure?"
// moment in the app should render this instead.
export default function ConfirmModal({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  busyLabel,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={() => !busy && onCancel?.()}
    >
      <div
        className="w-full max-w-sm bg-panel border border-line rounded-2xl shadow-modal p-5 animate-fadeInUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-sm font-semibold mb-1.5">{title}</div>
        {description && <p className="text-xs text-ink/50 mb-5 leading-relaxed">{description}</p>}
        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            onClick={onCancel}
            disabled={busy}
            className="focus-ring text-sm font-medium px-4 py-2 rounded-lg hover:bg-panel2 transition disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`focus-ring text-sm font-medium rounded-lg px-4 py-2 transition disabled:opacity-50 ${
              danger ? "bg-red-500 text-white hover:bg-red-500/90" : "bg-btn text-btn-foreground hover:bg-btn/90"
            }`}
          >
            {busy ? busyLabel || "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
