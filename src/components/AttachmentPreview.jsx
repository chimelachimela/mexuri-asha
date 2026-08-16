const EXT_STYLES = {
    csv: "bg-emerald-500/15 text-emerald-400",
    xlsx: "bg-emerald-500/15 text-emerald-400",
    xls: "bg-emerald-500/15 text-emerald-400",
    pdf: "bg-red-500/15 text-red-400",
    docx: "bg-blue-500/15 text-blue-400",
    doc: "bg-blue-500/15 text-blue-400",
};

function IconFile({ size = 16, className = "" }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        </svg>
    );
}

function IconX({ size = 11, className = "" }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    );
}

export default function AttachmentPreview({ fileName, type, previewUrl, onClear }) {
    const isImage = type === "image";

    if (isImage && previewUrl) {
        return (
            <div className="relative inline-block w-20 h-20 shrink-0">
                <img src={previewUrl} alt={fileName} className="w-full h-full rounded-xl object-cover border border-line" />
                {onClear && (
                    <button
                        onClick={onClear}
                        className="focus-ring absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-panel border border-line flex items-center justify-center text-ink/60 hover:text-ink"
                    >
                        <IconX size={10} />
                    </button>
                )}
            </div>
        );
    }

    const ext = (fileName?.split(".").pop() || "").toLowerCase();
    const badge = EXT_STYLES[ext] || "bg-panel3 text-ink/50";

    return (
        <div className="relative inline-flex items-center gap-2.5 bg-panel2 border border-line rounded-xl pl-1.5 pr-3 py-1.5 max-w-[240px]">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${badge}`}>
                <IconFile />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-ink/80 truncate">{fileName}</p>
                <p className="text-[10px] uppercase tracking-wide text-ink/35">{ext}</p>
            </div>
            {onClear && (
                <button onClick={onClear} className="focus-ring text-ink/30 hover:text-ink shrink-0 ml-1">
                    <IconX />
                </button>
            )}
        </div>
    );
}