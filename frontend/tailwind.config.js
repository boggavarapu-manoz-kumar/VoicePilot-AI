/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0f172a',    // Deep slate / dark navy for sidebar
          subtle: '#1e293b',  // Subtle nav border / hover
          primary: '#2563eb', // Royal blue accent
          light: '#f8fafc',   // Crisp workspace background
        }
      }
    },
  },
  plugins: [],
}
