/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Static theme tokens (no CSS variables)
        border: "hsl(215 20% 22%)",
        background: "#0b1220",
        foreground: "hsl(210 40% 96%)",
        primary: {
          DEFAULT: "hsl(199 89% 70%)",
          foreground: "hsl(210 40% 3%)",
        },
      },
      borderRadius: {
        lg: "12px",
        md: "10px",
        sm: "8px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
