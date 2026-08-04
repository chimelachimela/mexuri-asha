import { useState } from "react";
import { PLAN_PRICES, guessCurrency, startUpgrade } from "../lib/services/paymentService";

const SUBSCRIBE_CYCLES = [
    { id: "monthly", label: "Monthly" },
    { id: "yearly", label: "Yearly" },
];
const ONE_TIME_CYCLES = [
    { id: "daily", label: "Daily" },
    { id: "weekly", label: "Weekly" },
];

export default function PaymentModal({ onClose }) {
    const [mode, setMode] = useState("subscribe"); // "subscribe" | "one-time"
    const [cycle, setCycle] = useState("monthly");
    const [currency, setCurrency] = useState(guessCurrency());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const cycles = mode === "subscribe" ? SUBSCRIBE_CYCLES : ONE_TIME_CYCLES;
    const activeCycle = cycles.some((c) => c.id === cycle) ? cycle : cycles[0].id;
    const price = PLAN_PRICES[activeCycle][currency];

    const switchMode = (m) => {
        setMode(m);
        setCycle(m === "subscribe" ? "monthly" : "daily");
    };

    const handleUpgrade = async () => {
        setLoading(true);
        setError(null);
        try {
            await startUpgrade({ billingCycle: activeCycle, currency });
            // startUpgrade redirects the browser — no further state update needed
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="w-full max-w-md bg-panel border border-line rounded-xl2 shadow-modal overflow-hidden">
                {/* Fun visual header — swap for an actual illustration/graphic asset */}
                <div className="h-45 bg-gradient-to-br from-btn/30 to-panel3 flex items-center justify-center overflow-hidden">
                    <img
                        src="https://res.cloudinary.com/xtydyhi0/image/upload/v1785667381/1_ip9xxv.png"
                        alt=""
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="p-6">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-semibold text-ink">Upgrade to Asha Pro</h3>
                        <button onClick={onClose} className="focus-ring text-ink/50 hover:text-ink text-xl leading-none px-1">&times;</button>
                    </div>
                    <p className="text-sm text-ink/60 mb-5">Unlimited chat, all templates, no waiting.</p>

                    {/* Subscribe vs one-time */}
                    <div className="flex gap-2 mb-4">
                        {["subscribe", "one-time"].map((m) => (
                            <button
                                key={m}
                                onClick={() => switchMode(m)}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${mode === m ? "bg-btn text-btn-foreground border-btn" : "bg-panel2 text-ink/70 border-line"
                                    }`}
                            >
                                {m === "subscribe" ? "Subscribe" : "One-time pass"}
                            </button>
                        ))}
                    </div>

                    {/* Cycle toggle */}
                    <div className="flex gap-2 mb-4">
                        {cycles.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setCycle(c.id)}
                                className={`flex-1 py-1.5 rounded-md text-xs font-medium border transition ${activeCycle === c.id ? "border-btn text-ink" : "border-line text-ink/50"
                                    }`}
                            >
                                {c.label}
                            </button>
                        ))}
                    </div>

                    {/* Currency toggle */}
                    <div className="flex items-center justify-between mb-5 text-sm">
                        <span className="text-ink/60">Currency</span>
                        <div className="flex gap-1">
                            {["USD", "NGN"].map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setCurrency(c)}
                                    className={`px-2.5 py-1 rounded-md text-xs font-medium ${currency === c ? "bg-panel2 text-ink" : "text-ink/40"
                                        }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="text-2xl font-semibold text-ink mb-5">
                        {currency === "USD" ? "$" : "₦"}{price.toLocaleString()}
                        <span className="text-sm font-normal text-ink/50"> / {activeCycle}</span>
                    </div>

                    {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

                    <button
                        onClick={handleUpgrade}
                        disabled={loading}
                        className="w-full py-2.5 rounded-lg bg-btn text-btn-foreground font-medium disabled:opacity-60"
                    >
                        {loading ? "Redirecting…" : "Pay with Flutterwave"}
                    </button>
                </div>
            </div>
        </div>
    );
}