/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Adding a 'CodeLens' Dark Theme palette
        editor: "#1e1e1e",
        sidebar: "#252526",
        brand: "#6366f1",
      }
    },
  },
  plugins: [],
}
