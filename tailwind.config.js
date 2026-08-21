/** @type {import('tailwindcss').Config} */

// rgb(var(--x) / <alpha-value>) lets Tailwind's opacity modifiers
// (e.g. text-ink/70) keep working on top of a CSS-variable color.
function withOpacity(variableName) {
  return `rgb(var(${variableName}) / <alpha-value>)`;
}

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: ["class"], // toggled via the .light class on <html> (light is the override, dark is default — see index.css)
  theme: {
    extend: {
      colors: {
        // Static dark palette — used only by Login.jsx, which is
        // intentionally always-dark (its hero side is a photo backdrop)
        // regardless of the in-app theme toggle.
        base: {
          950: "#141414",
          900: "#1a1a1a",
          850: "#1e1e1e",
          800: "#242424",
          700: "#2e2e2e",
          600: "#3a3a3a",
        },
        // page background
        canvas: withOpacity("--color-canvas"),
        // raised surfaces: sidebar, cards, inputs, composer
        panel: withOpacity("--color-panel"),
        // secondary raised surface (hover states, hover hover states)
        panel2: withOpacity("--color-panel-2"),
        panel3: withOpacity("--color-panel-3"),
        // borders
        line: withOpacity("--color-line"),
        line2: withOpacity("--color-line-2"),
        // body text (was hardcoded "white" — now theme-aware)
        ink: withOpacity("--color-ink"),
        // primary/solid button — intentionally inverted from canvas in both themes
        btn: {
          DEFAULT: withOpacity("--color-btn"),
          foreground: withOpacity("--color-btn-foreground"),
        },
        accent: {
          // Gemini's signature blue → violet → pink sweep
          from: "#4C8DF6",
          via: "#9168F0",
          to: "#F45FA0",
          DEFAULT: "#6C63F5",
          soft: "#9C8CFB",
        },
      }, fontFamily: {
        sans: ["Montserrat", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
        "4xl": "1.75rem", // M3 "extra-large" shape — hero cards, sheets
      },
      boxShadow: {
        modal: "0 20px 60px rgba(0,0,0,0.5)",
        elevation1: "var(--shadow-1)",
        elevation2: "var(--shadow-2)",
        elevation4: "var(--shadow-4)",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        fadeInUp: { "0%": { opacity: 0, transform: "translateY(8px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        pulseSoft: { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.55 } },
        slideInRight: { "0%": { transform: "translateX(24px)", opacity: 0 }, "100%": { transform: "translateX(0)", opacity: 1 } },
        slideUpSheet: { "0%": { transform: "translateY(100%)" }, "100%": { transform: "translateY(0)" } },
        orbit: { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } },
      },
      animation: {
        fadeIn: "fadeIn 0.4s ease-out both",
        fadeInUp: "fadeInUp 0.45s ease-out both",
        pulseSoft: "pulseSoft 1.6s ease-in-out infinite",
        slideInRight: "slideInRight 0.35s cubic-bezier(0.16,1,0.3,1) both",
        slideUpSheet: "slideUpSheet 0.35s cubic-bezier(0.16,1,0.3,1) both",
        orbit: "orbit 2.2s linear infinite",
      },

    },
  },
  plugins: [],
};
