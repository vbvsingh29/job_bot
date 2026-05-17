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
        primary: { DEFAULT: '#185FA5', light: '#E6F1FB', dark: '#0C447C' },
        success: { DEFAULT: '#0F6E56', light: '#EAF3DE' },
        danger:  { DEFAULT: '#A32D2D', light: '#FCEBEB' },
        surface: '#F8F9FA'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      },
      borderRadius: {
        DEFAULT: '8px',
        card: '12px'
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
      }
    },
  },
  plugins: [],
}
