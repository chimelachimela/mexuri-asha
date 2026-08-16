import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Sidebar from "../components/Sidebar";
import ChatMessage from "../components/ChatMessage";
import SurveyBuildPanel from "../components/SurveyBuildPanel";
import UpgradePill from "../components/UpgradePill";
import PaymentModal from "../components/PaymentModal";
import SurveyPickerModal from "../components/SurveyPickerModal";
import * as db from "../lib/services/dbService";
import * as ai from "../lib/services/aiService";
import { parseSpreadsheetFile, summarizeSpreadsheet } from "../lib/documentInsights";
import { uploadAttachment, getAttachmentUrl } from "../lib/services/storageService";
import AttachmentPreview from "../components/AttachmentPreview";

// ---------- inline SVG icons (replaces lucide-react) ----------
function IconPlus({ size = 17, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconSend({ size = 15, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z" />
      <path d="M6 12h16" />
    </svg>
  );
}

function IconImage({ size = 14, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

function IconClipboard({ size = 14, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

function IconSquarePen({ size = 17, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
    </svg>
  );
}

function IconFileText({ size = 12, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}

function IconX({ size = 14, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function IconLoader({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
// ---------- end icons ----------

// ---------- idle placeholder: typewriter-cycles through example prompts
// while the composer is empty and idle ----------
const IDLE_PROMPTS = [
  "Help me create a customer satisfaction survey",
  "Survey my team about remote work preferences",
  "Build a post-event feedback form",
  "What should I ask before launching a new product?",
  "Help me find out why customers are churning",
  "Create a quick employee engagement survey",
  "Ask my users what feature they want next",
];

function useIdlePlaceholder(active) {
  const [text, setText] = useState("Ask Asha…");

  useEffect(() => {
    if (!active) {
      setText("Ask Asha…");
      return;
    }

    let cancelled = false;
    const timers = [];
    const schedule = (fn, ms) => {
      const id = setTimeout(() => !cancelled && fn(), ms);
      timers.push(id);
    };

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let promptIndex = 0;

    function runPrompt() {
      const prompt = IDLE_PROMPTS[promptIndex % IDLE_PROMPTS.length];
      promptIndex += 1;

      if (reduceMotion) {
        setText(prompt);
        schedule(runPrompt, 3500);
        return;
      }

      let i = 0;
      function typeStep() {
        if (cancelled) return;
        i += 1;
        setText(prompt.slice(0, i));
        if (i < prompt.length) schedule(typeStep, 28);
        else schedule(eraseStep, 1800); // pause once fully typed
      }
      function eraseStep() {
        if (cancelled) return;
        i -= 1;
        setText(prompt.slice(0, Math.max(i, 0)));
        if (i > 0) schedule(eraseStep, 14);
        else schedule(runPrompt, 400); // brief pause, then next prompt
      }
      typeStep();
    }

    schedule(runPrompt, 1200); // small pause before the first prompt starts

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [active]);

  return text;
}
// ---------- end idle placeholder ----------

// ---------- mobile keyboard awareness ----------
// Tracks how much of the viewport is covered by the on-screen keyboard
// (or browser chrome) using the visualViewport API. Returns 0 on browsers
// that don't support it (composer just stays in normal flow there).
function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;

    function handleResize() {
      const offset = window.innerHeight - vv.height - vv.offsetTop;
      setInset(Math.max(0, Math.round(offset)));
    }

    vv.addEventListener("resize", handleResize);
    vv.addEventListener("scroll", handleResize);
    handleResize();

    return () => {
      vv.removeEventListener("resize", handleResize);
      vv.removeEventListener("scroll", handleResize);
    };
  }, []);

  return inset;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}
// ---------- end mobile keyboard awareness ----------

export default function Chat() {
  const { session, chats, addChatToList, upsertChatMeta, removeChatFromList, addSurveyToList } = useApp();
  const { chatId } = useParams();
  const navigate = useNavigate();

  const [activeChat, setActiveChat] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [planningLoading, setPlanningLoading] = useState(false);

  const [mySurveys, setMySurveys] = useState([]);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  const [referencedSurvey, setReferencedSurvey] = useState(null);
  const [attachedDocument, setAttachedDocument] = useState(null); // { fileName, type, summary }
  const [attaching, setAttaching] = useState(false);
  const [attachingStage, setAttachingStage] = useState(""); // "uploading" | "analyzing"

  const [planningQuestions, setPlanningQuestions] = useState(null); // array | null
  const [planningIndex, setPlanningIndex] = useState(0);
  const [planningAnswers, setPlanningAnswers] = useState({});
  const [buildPanel, setBuildPanel] = useState(null); // { building, survey } | null
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const scrollRef = useRef(null);

  // keyboard-aware fixed composer (mobile only)
  const isMobile = useIsMobile();
  const keyboardInset = useKeyboardInset();
  const composerWrapRef = useRef(null);
  const [composerHeight, setComposerHeight] = useState(0);

  useEffect(() => {
    const el = composerWrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setComposerHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (session?.id) {
      db.listSurveys(session.id)
        .then(setMySurveys)
        .catch((err) => setErrorMsg(err.message || "Couldn't load your surveys."));
    }
  }, [session?.id]);

  useEffect(() => {
    if (!chatId) { setActiveChat(null); return; }
    let active = true;
    db.getChat(chatId)
      .then((c) => {
        if (!active) return;
        if (!c) { navigate("/chat", { replace: true }); return; } // chat doesn't exist/was deleted
        setActiveChat(c);
      })
      .catch((err) => active && setErrorMsg(err.message || "Couldn't load that chat."));
    return () => { active = false; };
  }, [chatId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [activeChat?.messages?.length]);

  function handleNewChat() {
    navigate("/chat");
    setInput("");
    setReferencedSurvey(null);
    setPlanningQuestions(null);
  }

  function handleSelectChat(id) {
    navigate(`/chat/${id}`);
  }

  function togglePlusMenu() {
    setPlusMenuOpen((o) => !o);
  }

  function openSurveyModal() {
    setPlusMenuOpen(false);
    setSurveyModalOpen(true);
  }

  async function pickReference(survey) {
    try {
      const full = await db.getSurvey(survey.id); // pulls questions + responses
      setReferencedSurvey(full);
    } catch (err) {
      setErrorMsg(err.message || "Couldn't load that survey.");
    }
    setSurveyModalOpen(false);
  }

  function clearReference() {
    setReferencedSurvey(null);
  }

  function clearAttachment() {
    if (attachedDocument?.previewUrl) URL.revokeObjectURL(attachedDocument.previewUrl);
    setAttachedDocument(null);
  }

  async function handleAttachFile(file) {
    if (!file) return;
    setAttaching(true);
    setAttachingStage("uploading");
    setErrorMsg("");
    const isImage = file.type.startsWith("image/");
    const previewUrl = isImage ? URL.createObjectURL(file) : null;

    try {
      const storagePath = await uploadAttachment(file, session.id);

      if (isImage) {
        // Show the attachment immediately (preview + "analyzing" state)
        // rather than blocking on the vision call before anything appears.
        setAttachedDocument({ fileName: file.name, type: "image", summary: null, storagePath, previewUrl });
        setAttachingStage("analyzing");
        try {
          // Groq's servers need to fetch this over the internet — a signed
          // URL into the private bucket, not the local blob: preview URL.
          const signedUrl = await getAttachmentUrl(storagePath);
          const summary = await ai.analyzeImage(signedUrl);
          setAttachedDocument((prev) =>
            prev?.storagePath === storagePath ? { ...prev, summary } : prev
          );
        } catch (err) {
          // Non-fatal: the image stays attached and visible, just without
          // an AI-readable summary — chat.js simply won't build a
          // documentBlock for it (same as any attachment with no summary).
          console.error("Image analysis failed:", err);
          setErrorMsg("Attached the image, but couldn't analyze it — Asha won't be able to reference its contents.");
        }
      } else {
        const { columns, rows } = await parseSpreadsheetFile(file);
        const summary = summarizeSpreadsheet({ fileName: file.name, columns, rows });
        setAttachedDocument({
          fileName: file.name,
          type: file.name.split(".").pop().toLowerCase(),
          summary,
          storagePath,
          previewUrl: null,
        });
      }
    } catch (err) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setErrorMsg(err.message || "Couldn't attach that file.");
    } finally {
      setAttaching(false);
      setAttachingStage("");
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setErrorMsg("");
    setSending(true);

    try {
      let chat = activeChat;
      if (!chat) {
        chat = await db.createChat(session.id);
        setActiveChat(chat);
        addChatToList(chat);
        navigate(`/chat/${chat.id}`, { replace: true });
      }

      const userMsg = await db.appendMessage(chat.id, {
        role: "user",
        text,
        referencedSurveyId: referencedSurvey?.id,
        referencedSurveyTitle: referencedSurvey?.title,
        attachmentName: attachedDocument?.fileName,
        attachmentType: attachedDocument?.type,
        attachmentSummary: attachedDocument?.summary,
        attachmentPath: attachedDocument?.storagePath,
      });
      const localPreviewUrl = attachedDocument?.type === "image" ? attachedDocument.previewUrl : undefined;
      chat = { ...chat, messages: [...chat.messages, { ...userMsg, previewUrl: localPreviewUrl }] };
      setActiveChat(chat);
      const sentDocument = attachedDocument;
      setAttachedDocument(null); // clear once it's attached to this message, same as a reference would be

      // Title generation and the AI reply are independent — run them
      // together instead of waiting on one before starting the other.
      const titlePromise = !chat.titleLocked ? ai.generateChatTitle(text) : Promise.resolve(null);
      const replyPromise = ai.sendMessage({
        history: chat.messages,
        userMessage: text,
        responseStyle: session.responseStyle,
        referencedSurvey: referencedSurvey || null,
        documentContext: sentDocument ? { fileName: sentDocument.fileName, summary: sentDocument.summary } : null,
      });

      const [title, reply] = await Promise.all([titlePromise, replyPromise]);

      if (title) {
        await db.updateChat(chat.id, { title, titleLocked: true });
        chat = { ...chat, title, titleLocked: true };
        upsertChatMeta(chat.id, { title, titleLocked: true });
      }

      const assistantMsg = await db.appendMessage(chat.id, {
        role: "assistant",
        text: reply.text,
        blocks: reply.blocks,
        suggestSurvey: reply.suggestSurvey,
      });
      chat = { ...chat, messages: [...chat.messages, assistantMsg] };
      setActiveChat(chat);
      upsertChatMeta(chat.id, { title: chat.title });
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Something went wrong reaching Asha. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function conversationTranscript() {
    return (activeChat?.messages || []).map((m) => `${m.role}: ${m.text}`).join("\n");
  }

  async function handleStartSurvey() {
    setPlanningLoading(true);
    setErrorMsg("");
    try {
      const questions = await ai.generatePlanningQuestions(conversationTranscript());
      setPlanningQuestions(questions);
      setPlanningIndex(0);
      setPlanningAnswers({});
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Couldn't start survey planning. Please try again.");
    } finally {
      setPlanningLoading(false);
    }
  }

  async function handlePlanningComplete(answers) {
    setPlanningQuestions(null);
    setBuildPanel({ building: true, survey: null });
    setErrorMsg("");

    try {
      const planningQA = (planningQuestions || [])
        .map((q) => `Q: ${q.text}\nA: ${answers[q.id] || "(skipped)"}`)
        .join("\n\n");

      const chatContext = [
        "Conversation with the founder:",
        conversationTranscript(),
        "",
        "Planning answers the founder just gave:",
        planningQA,
      ].join("\n");

      const drafted = await ai.generateSurvey({ chatContext });
      const survey = await db.createSurvey(session.id, drafted);
      await db.updateChat(activeChat.id, { surveyDraftId: survey.id });
      setBuildPanel({ building: false, survey });
      setMySurveys((prev) => [survey, ...prev]);
      addSurveyToList(survey);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Couldn't build the survey. Please try again.");
      setBuildPanel(null);
    }
  }

  async function handleDeleteChat(id) {
    await db.deleteChat(id);
    if (activeChat?.id === id) navigate("/chat");
    removeChatFromList(id);
  }

  // Extra breathing room below the last message so it never sits hidden
  // behind the composer — on mobile that's the fixed composer + on-screen
  // keyboard, but we pad on desktop too so long messages never end up
  // flush against the composer.
  const COMPOSER_BUFFER = 150; // extra px cushion beyond the composer's own height
  const scrollPaddingBottom = isMobile
    ? composerHeight + keyboardInset + COMPOSER_BUFFER
    : composerHeight + COMPOSER_BUFFER;

  return (
    <div className="h-[100dvh] w-full bg-canvas flex overflow-hidden">
      <Sidebar
        activeChat={activeChat?.id}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
      />

      <div className="flex-1 min-w-0 flex">
        <div className="flex-1 min-w-0 flex flex-col relative">
          {/* header */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0">
            {/* <UpgradePill onClick={() => setShowPaymentModal(true)} /> */}
            <button
              onClick={handleNewChat}
              title="New chat"
              className="focus-ring w-8 h-8 rounded-lg flex items-center justify-center text-ink/60 hover:text-ink hover:bg-panel transition"
            >
              <IconSquarePen size={17} />
            </button>
          </div>

          {showPaymentModal && <PaymentModal onClose={() => setShowPaymentModal(false)} />}

          {errorMsg && (
            <div className="mx-6 mb-2 flex items-center justify-between gap-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3.5 py-2.5">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg("")} className="focus-ring text-red-400/70 hover:text-red-400 shrink-0">
                <IconX size={14} />
              </button>
            </div>
          )}

          {/* messages / empty state */}
          {!activeChat || activeChat.messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              <h1 className="text-xl sm:text-3xl font-bold text-center mb-8 max-w-md">
                {session?.name ? `${session.name}, ` : ""}what's on your mind?
              </h1>
              <div className="w-full max-w-xl">
                <Composer
                  input={input}
                  setInput={setInput}
                  onSend={handleSend}
                  sending={sending}
                  centered
                  mySurveys={mySurveys}
                  referencedSurvey={referencedSurvey}
                  onPickReference={pickReference}
                  onClearReference={clearReference}
                  plusMenuOpen={plusMenuOpen}
                  onTogglePlusMenu={togglePlusMenu}
                  surveyModalOpen={surveyModalOpen}
                  onOpenSurveyModal={openSurveyModal}
                  onCloseSurveyModal={() => setSurveyModalOpen(false)}
                  attachedDocument={attachedDocument}
                  onAttachFile={handleAttachFile}
                  onClearAttachment={clearAttachment}
                  attaching={attaching}
                  attachingStage={attachingStage}
                />
              </div>
            </div>
          ) : (
            <>
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-6 py-4 space-y-6"
                style={{ paddingBottom: scrollPaddingBottom }}
              >
                <div className="max-w-3xl mx-auto space-y-6">
                  {activeChat.messages.map((m) => (
                    <ChatMessage key={m.id} message={m} onStartSurvey={handleStartSurvey} />
                  ))}
                  {sending && (
                    <div className="flex items-center gap-1.5 text-ink/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulseSoft" />
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulseSoft [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulseSoft [animation-delay:300ms]" />
                    </div>
                  )}
                </div>
              </div>

              {/*
                On mobile, this wrapper is pinned to the bottom of the visual
                viewport (not the layout viewport), and its `bottom` offset
                tracks the on-screen keyboard height via useKeyboardInset.
                That keeps the textarea sitting just above the keyboard
                instead of being pushed off-screen or buried under it.
                Desktop keeps the original in-flow, static positioning.
              */}
              <div
                ref={composerWrapRef}
                className={`px-6 pb-6 shrink-0 z-30 bg-canvas ${isMobile ? "fixed inset-x-0" : ""}`}
                style={isMobile ? { bottom: keyboardInset } : undefined}
              >
                <div className="max-w-2xl mx-auto">
                  {planningLoading ? (
                    <PlanningPreloader />
                  ) : planningQuestions ? (
                    <PlanningComposer
                      questions={planningQuestions}
                      index={planningIndex}
                      setIndex={setPlanningIndex}
                      answers={planningAnswers}
                      setAnswers={setPlanningAnswers}
                      onComplete={handlePlanningComplete}
                      onCancel={() => setPlanningQuestions(null)}
                    />
                  ) : (
                    <Composer
                      input={input}
                      setInput={setInput}
                      onSend={handleSend}
                      sending={sending}
                      mySurveys={mySurveys}
                      referencedSurvey={referencedSurvey}
                      onPickReference={pickReference}
                      onClearReference={clearReference}
                      plusMenuOpen={plusMenuOpen}
                      onTogglePlusMenu={togglePlusMenu}
                      surveyModalOpen={surveyModalOpen}
                      onOpenSurveyModal={openSurveyModal}
                      onCloseSurveyModal={() => setSurveyModalOpen(false)}
                      attachedDocument={attachedDocument}
                      onAttachFile={handleAttachFile}
                      onClearAttachment={clearAttachment}
                      attaching={attaching}
                      attachingStage={attachingStage}
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {buildPanel && (
          <SurveyBuildPanel
            survey={buildPanel.survey}
            building={buildPanel.building}
            onClose={() => setBuildPanel(null)}
          />
        )}
      </div>
    </div>
  );
}

const TEXTAREA_MAX_HEIGHT = 500;

function Composer({
  input, setInput, onSend, sending, centered, mySurveys, referencedSurvey,
  onPickReference, onClearReference,
  plusMenuOpen, onTogglePlusMenu, surveyModalOpen, onOpenSurveyModal, onCloseSurveyModal,
  attachedDocument, onAttachFile, onClearAttachment, attaching, attachingStage,
}) {
  const textareaRef = useRef(null);
  const docInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const idlePlaceholder = useIdlePlaceholder(!input && !sending);

  // Refocus once a send finishes — covers both "clicked the send button"
  // (which naturally steals focus) and the very first message, where the
  // composer remounts moving from the centered empty state to the docked one.
  useEffect(() => {
    if (!sending) textareaRef.current?.focus();
  }, [sending]);

  // Auto-expand the textarea as the user types, capped at TEXTAREA_MAX_HEIGHT —
  // beyond that it scrolls internally instead of growing further.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, TEXTAREA_MAX_HEIGHT);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > TEXTAREA_MAX_HEIGHT ? "auto" : "hidden";
  }, [input]);

  return (
    <div className={`bg-panel border border-line rounded-2xl p-3 ${centered ? "composer-glow" : ""}`}>
      {referencedSurvey && (
        <div className="flex items-center gap-2 mb-2 bg-panel2 border border-line rounded-lg px-2.5 py-1.5 w-fit">
          <IconFileText size={12} className="text-ink/40 shrink-0" />
          <span className="text-xs text-ink/70 truncate max-w-[180px]">{referencedSurvey.title}</span>
          <button onClick={onClearReference} className="focus-ring text-ink/30 hover:text-ink shrink-0">
            <IconX size={11} />
          </button>
        </div>
      )}
      {attachedDocument && (
        <div className="mb-2 flex items-center gap-2">
          <AttachmentPreview
            fileName={attachedDocument.fileName}
            type={attachedDocument.type}
            previewUrl={attachedDocument.previewUrl}
            onClear={onClearAttachment}
          />
          {attaching && attachingStage === "analyzing" && (
            <span className="text-xs text-ink/50 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-ink/40 animate-pulse" />
              Reading image…
            </span>
          )}
        </div>
      )}
      {attaching && !attachedDocument && (
        <div className="flex items-center gap-2 mb-2 bg-panel2 border border-line rounded-lg px-2.5 py-1.5 w-fit">
          <span className="text-xs text-ink/50">Uploading…</span>
        </div>
      )}
      <textarea
        ref={textareaRef}
        autoFocus
        rows={1}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder={idlePlaceholder}
        className="w-full bg-transparent resize-none text-sm placeholder:text-ink/30 px-1 py-1 outline-none focus:ring-0"
        style={{ maxHeight: TEXTAREA_MAX_HEIGHT }}
      />
      <div className="flex items-center justify-between mt-2 relative">
        <div className="relative">
          <button
            onClick={onTogglePlusMenu}
            title="Add"
            className="focus-ring w-8 h-8 rounded-lg flex items-center justify-center text-ink/50 hover:text-ink hover:bg-panel2 transition"
          >
            <IconPlus size={17} />
          </button>

          <input
            ref={docInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onAttachFile(file);
              e.target.value = "";
            }}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onAttachFile(file);
              e.target.value = "";
            }}
          />

          {plusMenuOpen && (
            <div className="absolute bottom-11 left-0 w-48 bg-panel border border-line rounded-xl shadow-modal py-1 z-10">
              <button
                onClick={() => { onTogglePlusMenu(); docInputRef.current?.click(); }}
                className="focus-ring w-full flex items-center gap-2 text-left px-3 py-2 text-xs text-ink/70 hover:bg-panel2 hover:text-ink transition"
              >
                <IconFileText size={14} /> Add documents
              </button>
              <button
                onClick={() => { onTogglePlusMenu(); imageInputRef.current?.click(); }}
                className="focus-ring w-full flex items-center gap-2 text-left px-3 py-2 text-xs text-ink/70 hover:bg-panel2 hover:text-ink transition"
              >
                <IconImage size={14} /> Add pictures
              </button>
              <button
                onClick={onOpenSurveyModal}
                className="focus-ring w-full flex items-center gap-2 text-left px-3 py-2 text-xs text-ink/70 hover:bg-panel2 hover:text-ink transition"
              >
                <IconClipboard size={14} /> Add survey
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onSend}
          disabled={!input.trim() || sending}
          className="focus-ring w-8 h-8 rounded-full bg-accent flex items-center justify-center disabled:opacity-40 transition hover:bg-accent-soft"
        >
          <IconSend size={15} />
        </button>
      </div>

      {surveyModalOpen && (
        <SurveyPickerModal
          surveys={mySurveys}
          onPick={onPickReference}
          onClose={onCloseSurveyModal}
        />
      )}
    </div>
  );
}

// Inline replacement for the composer while planning questions are being
// asked — same information as the old fullscreen modal, just docked in
// place instead of interrupting the chat.
function PlanningComposer({ questions, index, setIndex, answers, setAnswers, onComplete, onCancel }) {
  const q = questions[index];
  const selected = answers[q.id];
  const isLast = index === questions.length - 1;

  function selectOption(opt) {
    setAnswers((a) => ({ ...a, [q.id]: opt }));
  }

  function handleNext() {
    if (!selected) return;
    if (isLast) onComplete(answers);
    else setIndex(index + 1);
  }

  return (
    <div className="bg-panel border border-line rounded-2xl p-4 shadow-modal">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-ink/40">
          Question {index + 1} of {questions.length}
        </span>
        <button onClick={onCancel} className="focus-ring text-ink/40 hover:text-ink text-xs">
          Cancel
        </button>
      </div>
      <div className="h-1 bg-line rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-accent-from to-accent-to transition-all duration-300"
          style={{ width: `${((index + 1) / questions.length) * 100}%` }}
        />
      </div>
      <p className="text-sm font-medium mb-3">{q.text}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {q.options.map((opt) => (
          <button
            key={opt}
            onClick={() => selectOption(opt)}
            className={`focus-ring text-xs px-3 py-2 rounded-full border transition ${selected === opt
              ? "border-accent-soft bg-accent-soft/10 text-ink"
              : "border-line2 text-ink/60 hover:border-ink/30 hover:text-ink"
              }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="focus-ring text-xs text-ink/40 hover:text-ink disabled:opacity-30"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!selected}
          className="focus-ring bg-btn text-btn-foreground disabled:opacity-30 font-medium text-xs px-4 py-2 rounded-lg hover:bg-btn/90 transition"
        >
          {isLast ? "Build survey" : "Next"}
        </button>
      </div>
    </div>
  );
}

function PlanningPreloader() {
  return (
    <div className="bg-panel border border-line rounded-2xl p-4 shadow-modal flex items-center gap-3">
      <IconLoader size={16} className="animate-spin text-accent-soft" />
      <p className="text-sm text-ink/50">Asha is preparing a few quick questions…</p>
    </div>
  );
}