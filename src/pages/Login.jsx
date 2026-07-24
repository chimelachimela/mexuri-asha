import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import TermsModal from "../components/TermsModal";
import { markTermsAcceptedIntent } from "../lib/services/authService";

function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.46 1.14-4.07 1.14-3.13 0-5.78-2.11-6.73-4.95H1.27v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.27a12 12 0 0 0 0 10.76l4-3.1z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.1C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

export default function Login() {
  const { signInWithGoogle, session } = useApp();
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (session) navigate(session.onboarded ? "/chat" : "/onboarding", { replace: true });
  }, [session, navigate]);

  async function handleGoogle() {
    if (!accepted) return;
    setLoading(true);
    try {
      markTermsAcceptedIntent();
      await signInWithGoogle();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-base-950 flex flex-col lg:flex-row">
      {/* Hero side */}
      <div className="relative lg:w-4/5 min-h-[380px] lg:min-h-screen overflow-hidden flex flex-col justify-between p-8 sm:p-10">
        <img
          src="https://res.cloudinary.com/xtydyhi0/image/upload/v1784464515/img_m3zoyo.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-100"
        />
        <div className="absolute inset-0 from-base-950 via-base-950/70 to-base-950/20" />
        <div
          className="absolute -right-24 top-0 bottom-0 w-64 bg-base-950 hidden lg:block"
          style={{ borderRadius: "120px 0 0 120px" }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center">
            <img src="https://res.cloudinary.com/xtydyhi0/image/upload/v1784464670/Asha_Logo_forWhite_euepl3.svg" width={"50px"} alt="" />
          </div>
        </div>

        <div className="relative z-10 max-w-sm">
          <span className="inline-block text-[11px] font-semibold tracking-wide uppercase bg-white/10 text-white/80 px-3 py-1.5 rounded-full mb-4">
            Your AI survey builder
          </span>
          <p className="text-4xl font-semibold leading-snug">
            Who said surveys can't be fun? <br /> Definitely not us.
          </p>
        </div>
      </div>

      {/* Form side */}
      <div className="lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fadeInUp">
          <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
          <p className="text-white/50 mb-8">Sign in to your workspace</p>

          <button
            onClick={handleGoogle}
            disabled={loading || !accepted}
            className="focus-ring w-full flex items-center justify-center gap-3 bg-white text-base-950 font-medium rounded-xl py-3.5 mb-3 hover:bg-white/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-base-950/30 border-t-base-950 rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {loading ? "Signing in…" : "Continue with Google"}
          </button>

          <label className="flex items-start gap-2.5 mt-1 mb-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-white/30 bg-transparent accent-accent-soft shrink-0"
            />
            <span className="text-xs text-white/50 leading-relaxed">
              I agree to Asha's{" "}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="focus-ring text-accent-soft hover:underline"
              >
                Terms & Conditions
              </button>
            </span>
          </label>

          <p className="text-center text-sm text-white/40 mt-6">
            Don't have an account?{" "}
            <button
              onClick={handleGoogle}
              disabled={!accepted}
              className="focus-ring text-accent-soft font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
            >
              Sign up for free
            </button>
          </p>
        </div>
      </div>

      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </div>
  );
}
