import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoadingSplash() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => navigate("/chat"), 2200);
    const p = setInterval(() => {
      setProgress((prev) => Math.min(prev + Math.random() * 18 + 8, 100));
    }, 240);
    return () => {
      clearTimeout(t);
      clearInterval(p);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 animate-fadeIn">
      <div className="relative w-24 h-24 mb-10">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent-from to-accent-to blur-2xl opacity-40 animate-pulseSoft" />
        <div className="absolute -inset-4 rounded-full border border-dashed border-ink/10 animate-orbit" />
        <div className="absolute -inset-7 rounded-full border border-dashed border-ink/[0.06] animate-orbit [animation-duration:3.4s] [animation-direction:reverse]" />
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src="https://res.cloudinary.com/xtydyhi0/image/upload/v1784464670/Asha_Logo_forBlack_mt8s2u.svg"
            width={64}
            alt="Asha"
            className="drop-shadow-[0_0_20px_rgba(109,94,248,0.35)]"
          />
        </div>
      </div>

      <div className="w-40 h-1 bg-panel2 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-gradient-to-r from-accent-from to-accent-to rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-ink/50 text-sm tracking-wide">Setting up your workspace…</p>
    </div>
  );
}