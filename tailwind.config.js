/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1a1a1a",
        secondary: "#3E4C59",
        spanColor: "#52606D",
        tinWhite: "#FFFFFFDE",
        hover_color: "#242526",
        hover_color2: "#3a3b3c",
      },
    },
  },
  plugins: [],
};
