import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper: "#F8F5EC",
        "paper-alt": "#F3F0E7",
        ink: "#11202B",
        "ink-soft": "#4C5A62",
        "ink-faint": "#8B969C",
        border: "#DAD4C2",
        eac: {
          DEFAULT: "#014373",
          deep: "#002A59",
          soft: "#DCE7EE",
        },
        red: {
          DEFAULT: "#D01528",
          soft: "#F6D9DC",
        },
        missa: {
          DEFAULT: "#5A4B78",
          soft: "#E7E1EF",
        },
        // dark mode surfaces for the song screen
        dark: {
          paper: "#0F1B24",
          surface: "#16242F",
          border: "#243441",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
