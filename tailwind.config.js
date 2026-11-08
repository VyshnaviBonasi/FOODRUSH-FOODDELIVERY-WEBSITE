/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        rush: {
          lime: '#CAF509',
          'lime-hover': '#B6DD06',
          orange: '#FF7A00',
          dark: '#0D0B0A',
          surface: '#151110',
          card: '#1D1715',
          border: '#2E2623',
          muted: '#8E8580',
          light: '#F8F7F5'
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
