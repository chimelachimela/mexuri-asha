import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import { canPromptInstall, promptInstall, isIOS, isStandalone, onInstallStateChange } from "../lib/pwaInstall";

export default function InstallAppStep({ onDone }) {
    const [installable, setInstallable] = useState(canPromptInstall());
    const [showIosSteps, setShowIosSteps] = useState(false);
    const ios = isIOS();

    useEffect(() => {
        // In case beforeinstallprompt fires after this screen has mounted.
        return onInstallStateChange(() => setInstallable(canPromptInstall()));
    }, []);

    // Already running as an installed app — nothing to do here.
    useEffect(() => {
        if (isStandalone()) onDone();
    }, [onDone]);

    async function handleDownload() {
        if (ios) {
            setShowIosSteps(true);
            return;
        }
        if (installable) {
            await promptInstall();
            onDone();
            return;
        }
        // Neither path available (unsupported browser, or Chrome hasn't
        // fired the event yet) — don't block the user on something that
        // can't work; just move them forward.
        onDone();
    }

    return (
        <div className="text-center animate-fadeInUp">
            <img
                src="https://res.cloudinary.com/xtydyhi0/image/upload/w_192,h_192,c_fill,f_png/v1784593591/White_JPG-100_bnhbsh.jpg"
                alt="Asha"
                className="w-24 h-24 rounded-2xl mx-auto shadow-modal ring-1 ring-line2"
            />

            <h1 className="text-2xl sm:text-3xl font-bold mt-6 mb-2">Get Asha On Your Home Screen</h1>
            <p className="text-ink/50 text-sm max-w-xs mx-auto mb-8">
                Install Asha for one-tap access, a full-screen experience, and no browser bar in the way.
            </p>

            {!showIosSteps ? (
                <button
                    onClick={handleDownload}
                    className="focus-ring inline-flex items-center gap-2 bg-btn text-btn-foreground font-medium rounded-xl px-6 py-3.5 hover:opacity-90 transition"
                >
                    <Download size={17} />
                    Download Asha
                </button>
            ) : (
                <div className="max-w-xs mx-auto text-left bg-panel border border-line2 rounded-xl p-4 text-sm text-ink/70 space-y-2">
                    <p className="flex items-center gap-2 font-medium text-ink">
                        <Share size={15} /> Tap the Share icon
                    </p>
                    <p>Then scroll down and tap <span className="font-medium text-ink">"Add to Home Screen."</span></p>
                </div>
            )}

            <div className="mt-6">
                <button onClick={onDone} className="focus-ring text-sm text-ink/40 hover:text-ink/70 transition">
                    Skip for now
                </button>
            </div>
        </div>
    );
}