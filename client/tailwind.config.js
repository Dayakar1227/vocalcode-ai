/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#171B26", soft: "#2A3042", mute: "#5B6377", faint: "#8A92A6" },
        canvas: "#F3F5F9",
        line: "#E1E5EE",
        cobalt: { DEFAULT: "#2B4BF2", dark: "#1F37C2", tint: "#E8ECFE" },
        mint: { DEFAULT: "#0E9F77", tint: "#DDF5EC" },
        amber: { DEFAULT: "#C97A04", tint: "#FFF0D6" },
        coral: { DEFAULT: "#D6453D", tint: "#FDE4E1" },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ['"Public Sans"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(23,27,38,.05), 0 8px 24px -12px rgba(23,27,38,.12)",
      },
    },
  },
  plugins: [],
};
