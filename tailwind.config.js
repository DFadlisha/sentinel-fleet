/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sentinel-bg': '#0f172a',   // Dark Slate (Background)
        'sentinel-card': '#1e293b', // Lighter Slate (Cards)
        'sentinel-nav': '#1e1b4b',  // Deep Indigo (Navbar)
        'sentinel-red': '#ef4444',  // Alert Red
        'sentinel-green': '#10b981', // Good Status
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
