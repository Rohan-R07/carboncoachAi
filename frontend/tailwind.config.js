/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    require('path').join(__dirname, "./app/**/*.{js,ts,jsx,tsx,mdx}"),
    require('path').join(__dirname, "./components/**/*.{js,ts,jsx,tsx,mdx}"),
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        accent: {
          light: "#ecfdf5",
          DEFAULT: "#10b981",
          dark: "#047857",
        },
        card: {
          background: "var(--card-background)",
          border: "var(--card-border)",
        }
      },
    },
  },
  plugins: [],
}
