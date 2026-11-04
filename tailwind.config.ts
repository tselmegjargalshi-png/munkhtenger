import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#15181E", 2: "#2A2F38", 3: "#5B6270", 4: "#8C93A0" },
        paper: { DEFAULT: "#FAF8F4", 2: "#F3F0E9", 3: "#E8E3D8" },
        sky: { DEFAULT: "#1E3A5F", 2: "#2C5282", soft: "#E6EDF5" },
        brass: { DEFAULT: "#A9814A", 2: "#C9A46B", soft: "#F4ECDF" },
        moss: { DEFAULT: "#2F6B4F", soft: "#E5F0EA" },
        rust: { DEFAULT: "#B4472F", soft: "#F8E7E2" },
      },
      fontFamily: {
        sans: ['"Manrope"', "system-ui", "sans-serif"],
        display: ['"Lora"', "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(21,24,30,.04), 0 8px 24px rgba(21,24,30,.06)",
        lift: "0 2px 4px rgba(21,24,30,.05), 0 18px 40px rgba(21,24,30,.10)",
      },
      keyframes: {
        fadeUp: { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "none" } },
        shimmer: { "0%": { backgroundPosition: "-400px 0" }, "100%": { backgroundPosition: "400px 0" } },
      },
      animation: {
        fadeUp: "fadeUp .45s ease-out both",
        shimmer: "shimmer 1.4s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
