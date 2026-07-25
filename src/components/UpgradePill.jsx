import { useApp } from "../context/AppContext";

export default function UpgradePill({ onClick }) {
    const { session } = useApp();
    if (session?.plan_tier === "pro") return null; // nothing to upgrade to

    return (
        <button
            onClick={onClick}
            className="focus-ring text-xs font-medium px-3 py-1.5 rounded-full bg-panel2 border border-line text-ink/80 hover:text-ink hover:border-line2 transition"
        >
            Free Plan · <span className="text-ink">Upgrade</span>
        </button>
    );
}