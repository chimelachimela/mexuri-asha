import { TERMS_SECTIONS, TERMS_LAST_UPDATED } from "../data/termsContent";

export default function TermsModal({ onClose, dismissible = true, footer }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fadeIn">
            <div className="w-full max-w-lg max-h-[85vh] bg-base-900 border border-base-700 rounded-xl2 shadow-modal flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-base-700 shrink-0">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Terms & Conditions and Privacy Policy</h3>
                        <p className="text-xs text-white/40">Last updated {TERMS_LAST_UPDATED}</p>
                    </div>
                    {dismissible && (
                        <button
                            onClick={onClose}
                            aria-label="Close"
                            className="focus-ring text-white/50 hover:text-white transition text-xl leading-none px-2"
                        >
                            &times;
                        </button>
                    )}
                </div>

                <div className="overflow-y-auto px-6 py-5 space-y-5">
                    {TERMS_SECTIONS.map((s) => (
                        <div key={s.heading}>
                            <h4 className="text-sm font-semibold text-white mb-1.5">{s.heading}</h4>
                            <p className="text-sm text-white/60 leading-relaxed">{s.body}</p>
                        </div>
                    ))}
                </div>

                {footer && <div className="px-6 py-4 border-t border-base-700 shrink-0">{footer}</div>}
            </div>
        </div>
    );
}