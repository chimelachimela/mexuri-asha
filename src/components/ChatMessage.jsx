import { useState, useEffect } from "react";
import { Copy, Check, ThumbsUp, ThumbsDown, Share2, RotateCw, MoreHorizontal, ArrowRight, FileText } from "lucide-react";
import ChatChart from "./ChatChart";
import AttachmentPreview from "./AttachmentPreview";
import MarkdownText from "./MarkdownText";
import { getAttachmentUrl } from "../lib/services/storageService";

function AttachedFile({ message }) {
  const [previewUrl, setPreviewUrl] = useState(message.previewUrl || null);

  useEffect(() => {
    if (!message.previewUrl && message.attachmentType === "image" && message.attachmentPath) {
      getAttachmentUrl(message.attachmentPath).then(setPreviewUrl).catch(() => { });
    }
  }, [message.previewUrl, message.attachmentPath, message.attachmentType]);

  return (
    <AttachmentPreview fileName={message.attachmentName} type={message.attachmentType} previewUrl={previewUrl} />
  );
}

export default function ChatMessage({ message, onStartSurvey }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard?.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (message.role === "user") {
    return (
      <div className="flex flex-col items-end animate-fadeInUp">
        {message.referencedSurveyTitle && (
          <div className="flex items-center gap-1.5 mb-1.5 bg-panel border border-line rounded-lg px-2 py-1 max-w-[80%]">
            <FileText size={11} className="text-ink/40 shrink-0" />
            <span className="text-[11px] text-ink/60 truncate">{message.referencedSurveyTitle}</span>
          </div>
        )}
        {message.attachmentName && (
          <div className="mb-1.5">
            <AttachedFile message={message} />
          </div>
        )}
        <div className="bg-panel2 rounded-2xl px-4 py-2.5 max-w-[80%] text-sm">{message.text}</div>
      </div>
    );
  }


  return (
    <div className="max-w-[85%] animate-fadeInUp">
      {Array.isArray(message.blocks) && message.blocks.length > 0 ? (
        message.blocks.map((block, i) =>
          block.type === "chart" ? (
            <ChatChart key={i} chart={block.chart} />
          ) : (
            <MarkdownText key={i} content={block.content} />
          )
        )
      ) : (
        <MarkdownText content={message.text} />
      )}

      {message.suggestSurvey && (
        <button
          onClick={() => onStartSurvey(message.id)}
          className="focus-ring mt-3 inline-flex items-center gap-1.5 font-semibold text-sm hover:gap-2.5 transition-all"
        >
          Start Survey
          <ArrowRight size={15} />
        </button>
      )}

      <div className="flex items-center gap-3 mt-2.5 text-ink/35">
        <button onClick={handleCopy} className="focus-ring hover:text-ink transition" title={copied ? "Copied" : "Copy"}>
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
        <button className="focus-ring hover:text-ink transition" title="Good response"><ThumbsUp size={14} /></button>
        <button className="focus-ring hover:text-ink transition" title="Bad response"><ThumbsDown size={14} /></button>
        <button className="focus-ring hover:text-ink transition" title="Share"><Share2 size={14} /></button>
        <button className="focus-ring hover:text-ink transition" title="Regenerate"><RotateCw size={14} /></button>
        <button className="focus-ring hover:text-ink transition" title="More"><MoreHorizontal size={14} /></button>
      </div>
    </div>
  );
}