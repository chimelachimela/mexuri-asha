import { useApp } from "../context/AppContext";
import TermsModal from "./TermsModal";

export default function TermsGate() {
    const { acceptTerms } = useApp();

    return (
        <TermsModal
            dismissible={false}
            footer={
                <button
                    onClick={() => acceptTerms()}
                    className="focus-ring w-full bg-white text-base-950 font-medium rounded-xl py-3 hover:bg-white/90 transition"
                >
                    Accept & Continue
                </button>
            }
        />
    );
}