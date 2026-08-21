import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sun, Moon, Trash2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import Sidebar from "../components/Sidebar";
import PaymentModal from "../components/PaymentModal";

export default function Settings() {
  const { session, updateProfile, refreshSession, theme, setTheme, signOut, deleteAccount } = useApp();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [name, setName] = useState(session?.name || "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [justPaid, setJustPaid] = useState(false);

  useEffect(() => {
    if (searchParams.get("payment") === "complete") {
      setJustPaid(true);
      searchParams.delete("payment");
      setSearchParams(searchParams, { replace: true });

      // The webhook updates plan_tier asynchronously and may lag a couple
      // seconds behind this redirect, so poll a few times instead of
      // relying on a single refetch.
      let attempts = 0;
      const maxAttempts = 8; // ~24s total
      const interval = setInterval(async () => {
        attempts += 1;
        const s = await refreshSession();
        if (s?.plan_tier === "pro" || attempts >= maxAttempts) {
          clearInterval(interval);
          setJustPaid(false);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, []);

  const isPro = session?.plan_tier === "pro";
  const expiresAt = session?.premium_until ? new Date(session.premium_until) : null;

  function saveName() {
    if (name.trim() && name.trim() !== session.name) updateProfile({ name: name.trim() });
  }

  async function handleDelete() {
    await deleteAccount();
    navigate("/login");
  }

  return (
    <div className="h-screen w-full bg-canvas flex overflow-hidden">
      <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((c) => !c)} onNewChat={() => navigate("/chat")} />

      <div className="flex-1 min-w-0 overflow-y-auto px-6 sm:px-10 pt-16 pb-8 md:pt-8">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold mb-8">Settings</h1>

          <section className="mb-8">
            <h2 className="text-sm font-semibold text-ink/50 mb-3">Profile</h2>
            <label className="block text-xs text-ink/40 mb-1.5">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              className="focus-ring w-full bg-panel border border-line rounded-xl px-4 py-2.5 text-sm focus:border-accent-soft transition"
            />
            <div className="text-xs text-ink/30 mt-2">{session?.email}</div>
          </section>

          {/* <section className="mb-8">
            <h2 className="text-sm font-semibold text-ink/50 mb-3">Plan</h2>

            {justPaid && (
              <div className="text-xs text-ink/60 bg-panel2 border border-line rounded-lg px-3 py-2 mb-3">
                Payment received — this may take a few seconds to reflect below.
              </div>
            )}

            <div className="flex items-center justify-between border border-line rounded-xl px-4 py-3.5">
              <div>
                <div className="text-sm font-medium">{isPro ? "Asha Pro" : "Free plan"}</div>
                <div className="text-xs text-ink/40">
                  {isPro && expiresAt
                    ? `${session.billing_cycle === "daily" || session.billing_cycle === "weekly" ? "Expires" : "Renews"} ${expiresAt.toLocaleDateString()}`
                    : "Limited chats & default template only"}
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="focus-ring text-sm font-medium bg-btn text-btn-foreground rounded-lg px-4 py-2 hover:bg-btn/90 hover:shadow-[0_0_16px_rgba(109,94,248,0.35)] transition"
              >
                {isPro ? "Renew" : "Upgrade"}
              </button>
            </div>
          </section>

          {showPaymentModal && <PaymentModal onClose={() => setShowPaymentModal(false)} />} */}

          <section className="mb-8">
            <h2 className="text-sm font-semibold text-ink/50 mb-3">Theme</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setTheme("dark")}
                className={`focus-ring flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition ${theme === "dark" ? "border-accent-soft bg-accent-soft/10" : "border-line hover:border-line2"
                  }`}
              >
                <Moon size={15} /> Dark
              </button>
              <button
                onClick={() => setTheme("light")}
                className={`focus-ring flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition ${theme === "light" ? "border-accent-soft bg-accent-soft/10" : "border-line hover:border-line2"
                  }`}
              >
                <Sun size={15} /> Light
              </button>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-ink/50 mb-3">Account</h2>
            <button
              onClick={signOut}
              className="focus-ring w-full text-left text-sm border border-line rounded-xl px-4 py-3 hover:bg-panel transition mb-3"
            >
              Sign out
            </button>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="focus-ring w-full flex items-center gap-2 text-left text-sm text-red-400 border border-red-500/30 rounded-xl px-4 py-3 hover:bg-red-500/10 transition"
              >
                <Trash2 size={15} /> Delete account
              </button>
            ) : (
              <div className="border border-red-500/30 rounded-xl p-4">
                <p className="text-sm text-ink/70 mb-3">
                  This permanently deletes your account, chats, and surveys. This can't be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    className="focus-ring text-sm font-medium bg-red-500 text-white rounded-lg px-4 py-2 hover:bg-red-600 transition"
                  >
                    Yes, delete everything
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="focus-ring text-sm text-ink/50 hover:text-ink px-4 py-2 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}