import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // paleta extraída do brasão oficial ("logo nova.jpg"): azul-marinho
        // quase preto, dourado do bordado, creme das letras e vermelho do coração
        paper: "#FAF6EA",
        "paper-alt": "#F1E9D3",
        ink: "#11202B",
        "ink-soft": "#4C5A62",
        "ink-faint": "#8B969C",
        border: "#E4D9B9",
        eac: {
          DEFAULT: "#0F1B33",
          deep: "#060B18",
          soft: "#E3E7ED",
        },
        gold: {
          DEFAULT: "#C9A76B",
          deep: "#A9843F",
          soft: "#F3EAD3",
        },
        red: {
          DEFAULT: "#C81F2C",
          soft: "#F6DEDF",
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
