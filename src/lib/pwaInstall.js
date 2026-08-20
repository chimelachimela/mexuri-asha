// The browser only fires beforeinstallprompt once, early, and only if it
// hasn't already fired this session — so we capture it at module load
// time (main.jsx imports this once, on boot) rather than waiting for the
// onboarding screen to mount, which could miss it entirely.

let deferredPrompt = null;
const listeners = new Set();

function emit() {
    listeners.forEach((cb) => cb());
}

window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    emit();
});

window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    emit();
});

export function isStandalone() {
    return (
        window.matchMedia?.("(display-mode: standalone)").matches ||
        window.navigator.standalone === true // legacy iOS Safari flag
    );
}

export function isIOS() {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;
}

export function canPromptInstall() {
    return !!deferredPrompt;
}

// Fires the real native install prompt (Android/Chrome/Edge/desktop only).
// Resolves to "accepted" | "dismissed" | null (nothing to prompt).
export async function promptInstall() {
    if (!deferredPrompt) return null;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return outcome;
}

export function onInstallStateChange(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
}