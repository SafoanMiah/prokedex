import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0f0f17",
          deep: "#08080d",
          panel: "#1a1a2e",
          raised: "#232347",
          screen: "#1e2a3a",
        },
        ink: {
          DEFAULT: "#f5f5dc",
          dim: "#a8a8a0",
          mute: "#6b6b66",
        },
        accent: {
          red: "#ee1515",
          "red-dark": "#a00000",
          yellow: "#ffcc00",
          green: "#4ade80",
          blue: "#3b82f6",
        },
        type: {
          normal: "#A8A77A",
          fire: "#EE8130",
          water: "#6390F0",
          electric: "#F7D02C",
          grass: "#7AC74C",
          ice: "#96D9D6",
          fighting: "#C22E28",
          poison: "#A33EA1",
          ground: "#E2BF65",
          flying: "#A98FF3",
          psychic: "#F95587",
          bug: "#A6B91A",
          rock: "#B6A136",
          ghost: "#735797",
          dragon: "#6F35FC",
          dark: "#705746",
          steel: "#B7B7CE",
          fairy: "#D685AD",
        },
      },
      fontFamily: {
        display: ["var(--font-press-start)", "monospace"],
        body: ["var(--font-vt323)", "monospace"],
        sans: ["var(--font-vt323)", "monospace"],
      },
      fontSize: {
        "pixel-xs": ["8px", { lineHeight: "12px" }],
        "pixel-sm": ["10px", { lineHeight: "14px" }],
        "pixel-base": ["12px", { lineHeight: "18px" }],
        "pixel-lg": ["16px", { lineHeight: "22px" }],
        "pixel-xl": ["20px", { lineHeight: "28px" }],
        "pixel-2xl": ["28px", { lineHeight: "36px" }],
      },
      boxShadow: {
        "pixel-sm": "0 2px 0 0 rgba(0,0,0,0.6)",
        "pixel": "0 4px 0 0 rgba(0,0,0,0.6)",
        "pixel-lg": "0 6px 0 0 rgba(0,0,0,0.6)",
        "pixel-inset": "inset 0 -4px 0 0 rgba(0,0,0,0.35)",
        "pixel-glow": "0 0 0 2px #ffcc00, 0 4px 0 0 rgba(0,0,0,0.6)",
      },
      animation: {
        "pixel-bounce": "pixel-bounce 0.6s steps(4) infinite",
        "claim-flash": "claim-flash 0.8s steps(8) forwards",
        "scanline": "scanline 4s linear infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        "pixel-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "claim-flash": {
          "0%": { filter: "grayscale(1) brightness(0.5)" },
          "40%": { filter: "grayscale(0) brightness(2) saturate(2)" },
          "100%": { filter: "grayscale(0) brightness(1)" },
        },
        "scanline": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
