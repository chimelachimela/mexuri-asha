// Small schematic previews of each layout — not live renders of the
// actual survey, just enough visual shape (card stacking, chat bubbles,
// sidebar vs. full-bleed, grid vs. list) that a founder can recognize
// "that's the one" without reading the name. Pure SVG, themed with
// currentColor so it inherits text-ink / text-accent-soft like any icon.

const FRAME = { width: 96, height: 64, rx: 6 };

function Frame({ children }) {
  return (
    <svg viewBox={`0 0 ${FRAME.width} ${FRAME.height}`} className="w-full h-full" fill="none">
      <rect x={0.5} y={0.5} width={FRAME.width - 1} height={FRAME.height - 1} rx={FRAME.rx} className="stroke-line" strokeWidth="1" />
      {children}
    </svg>
  );
}

const THUMBNAILS = {
  stack: () => (
    <Frame>
      <rect x="30" y="20" width="42" height="30" rx="3" className="fill-panel2 stroke-line2" strokeWidth="1" />
      <rect x="24" y="14" width="42" height="30" rx="3" className="fill-panel2 stroke-line2" strokeWidth="1" />
      <rect x="18" y="8" width="42" height="30" rx="3" className="fill-current text-accent-soft/15 stroke-accent-soft" strokeWidth="1.2" />
      <rect x="24" y="16" width="30" height="2.5" rx="1.25" className="fill-current text-ink/50" />
      <rect x="24" y="22" width="18" height="2.5" rx="1.25" className="fill-current text-ink/25" />
    </Frame>
  ),
  fullscreen: () => (
    <Frame>
      <rect x="18" y="18" width="60" height="4" rx="2" className="fill-current text-ink/60" />
      <rect x="26" y="26" width="44" height="3" rx="1.5" className="fill-current text-ink/25" />
      <circle cx="38" cy="42" r="4" className="fill-none stroke-accent-soft" strokeWidth="1.4" />
      <circle cx="58" cy="42" r="4" className="fill-none stroke-line2" strokeWidth="1.4" />
    </Frame>
  ),
  chat: () => (
    <Frame>
      <rect x="10" y="10" width="34" height="10" rx="5" className="fill-panel2 stroke-line2" strokeWidth="1" />
      <rect x="52" y="24" width="34" height="10" rx="5" className="fill-current text-accent-soft/20 stroke-accent-soft" strokeWidth="1" />
      <rect x="10" y="38" width="30" height="10" rx="5" className="fill-panel2 stroke-line2" strokeWidth="1" />
      <rect x="20" y="52" width="56" height="7" rx="3.5" className="fill-none stroke-line2" strokeWidth="1" />
    </Frame>
  ),
  singlepanel: () => (
    <Frame>
      {[12, 22, 32, 42, 52].map((y, i) => (
        <g key={y}>
          <rect x="14" y={y} width={i === 0 ? 40 : 30} height="2.5" rx="1.25" className={i === 0 ? "fill-current text-ink/55" : "fill-current text-ink/25"} />
          <rect x="14" y={y + 5} width="68" height="0.75" className="fill-line2" />
        </g>
      ))}
    </Frame>
  ),
  splitscreen: () => (
    <Frame>
      <rect x="0.5" y="0.5" width="34" height="63" rx="6" className="fill-current text-accent-soft/15" />
      <rect x="10" y="24" width="18" height="3" rx="1.5" className="fill-current text-accent-soft" />
      <rect x="48" y="18" width="34" height="3" rx="1.5" className="fill-current text-ink/55" />
      <rect x="48" y="26" width="26" height="2.5" rx="1.25" className="fill-current text-ink/25" />
      <rect x="48" y="40" width="34" height="8" rx="4" className="fill-none stroke-line2" strokeWidth="1" />
    </Frame>
  ),
  tilegrid: () => (
    <Frame>
      <rect x="16" y="10" width="34" height="3" rx="1.5" className="fill-current text-ink/55" />
      {[[14, 22], [50, 22], [14, 40], [50, 40]].map(([x, y], i) => (
        <rect
          key={i}
          x={x} y={y} width="32" height="16" rx="3"
          className={i === 0 ? "fill-current text-accent-soft/20 stroke-accent-soft" : "fill-panel2 stroke-line2"}
          strokeWidth="1"
        />
      ))}
    </Frame>
  ),
  wizard: () => (
    <Frame>
      <rect x="0.5" y="0.5" width="24" height="63" rx="6" className="fill-panel2" />
      {[14, 24, 34, 44].map((y, i) => (
        <g key={y}>
          <circle cx="12" cy={y} r="2.4" className={i === 1 ? "fill-current text-accent-soft" : "fill-current text-ink/25"} />
          <rect x="17" y={y - 1} width="6" height="2" rx="1" className="fill-current text-ink/20" />
        </g>
      ))}
      <rect x="36" y="18" width="42" height="3" rx="1.5" className="fill-current text-ink/55" />
      <rect x="36" y="26" width="30" height="2.5" rx="1.25" className="fill-current text-ink/25" />
    </Frame>
  ),
  magazine: () => (
    <Frame>
      <rect x="16" y="14" width="64" height="6" rx="1" className="fill-current text-ink/60" />
      <rect x="16" y="24" width="50" height="6" rx="1" className="fill-current text-ink/60" />
      <rect x="16" y="42" width="40" height="2.5" rx="1.25" className="fill-current text-ink/25" />
      <rect x="16" y="48" width="28" height="2.5" rx="1.25" className="fill-current text-ink/25" />
    </Frame>
  ),
  slidedeck: () => (
    <Frame>
      <rect x="14" y="16" width="68" height="26" rx="3" className="fill-current text-accent-soft/12 stroke-accent-soft" strokeWidth="1" />
      <rect x="22" y="24" width="36" height="3" rx="1.5" className="fill-current text-ink/55" />
      <rect x="22" y="31" width="24" height="2.5" rx="1.25" className="fill-current text-ink/25" />
      <text x="76" y="38" fontSize="6" textAnchor="end" className="fill-current text-ink/35">2/6</text>
      <rect x="14" y="48" width="68" height="2" rx="1" className="fill-line2" />
      <rect x="14" y="48" width="24" height="2" rx="1" className="fill-current text-accent-soft" />
    </Frame>
  ),
};

export default function TemplateThumbnail({ id, className = "" }) {
  const Render = THUMBNAILS[id] || THUMBNAILS.stack;
  return (
    <div className={className}>
      <Render />
    </div>
  );
}
