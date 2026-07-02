import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(20,184,166,0.18), 0 18px 60px rgba(15,23,42,0.14)"
      },
      keyframes: {
        floatIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseLine: {
          "0%, 100%": { transform: "scaleX(0.35)", opacity: "0.45" },
          "50%": { transform: "scaleX(1)", opacity: "1" }
        }
      },
      animation: {
        floatIn: "floatIn 220ms ease-out",
        pulseLine: "pulseLine 1.4s ease-in-out infinite"
      }
    }
  },
  plugins: []
} satisfies Config;
