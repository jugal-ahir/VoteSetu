/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef2ff",
          500: "#6366f1",
          600: "#4f46e5",
        },
        emerald: {
          500: "#10b981",
        },
        slate: {
          900: "#0f172a",
        },
      },
    },
  },
  plugins: [],
};


