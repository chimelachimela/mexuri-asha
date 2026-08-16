import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const components = {
    h1: ({ children }) => <h1 className="text-lg font-semibold text-ink mt-1 mb-2">{children}</h1>,
    h2: ({ children }) => (
        <h2 className="text-[15px] font-semibold text-ink mt-4 mb-2 pb-1.5 border-b border-line first:mt-0">
            {children}
        </h2>
    ),
    h3: ({ children }) => <h3 className="text-sm font-semibold text-ink mt-3 mb-1.5">{children}</h3>,
    p: ({ children }) => <p className="text-[15px] leading-relaxed text-ink/90 mb-3 last:mb-0">{children}</p>,
    ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-3 text-[15px] text-ink/90">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-3 text-[15px] text-ink/90">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    a: ({ children, href }) => (
        <a href={href} target="_blank" rel="noreferrer" className="text-accent-soft underline hover:text-accent">
            {children}
        </a>
    ),
    blockquote: ({ children }) => (
        <blockquote className="border-l-2 border-line pl-3 text-ink/60 italic mb-3">{children}</blockquote>
    ),
    code: ({ inline, children }) =>
        inline ? (
            <code className="bg-panel2 border border-line rounded px-1.5 py-0.5 text-[13px] font-mono text-ink/85">
                {children}
            </code>
        ) : (
            <code className="block bg-panel2 border border-line rounded-lg p-3 overflow-x-auto text-[13px] font-mono text-ink/85 mb-3">
                {children}
            </code>
        ),
    hr: () => <hr className="border-line my-4" />,
    table: ({ children }) => (
        <div className="overflow-x-auto mb-3 border border-line rounded-lg">
            <table className="w-full text-sm border-collapse">{children}</table>
        </div>
    ),
    thead: ({ children }) => <thead className="bg-panel2">{children}</thead>,
    th: ({ children }) => (
        <th className="text-left font-medium text-ink/70 px-3 py-2 border-b border-line">{children}</th>
    ),
    td: ({ children }) => <td className="px-3 py-2 text-ink/80 border-b border-line/50">{children}</td>,
};

export default function MarkdownText({ content }) {
    if (!content) return null;
    return (
        <div className="chat-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {content}
            </ReactMarkdown>
        </div>
    );
}