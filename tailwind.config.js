/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Helvetica Now Display Bold', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        accent: '#7342E2',
        text: '#192837',
        loginBg: '#F2F2EE',
        sheet: '#CFC8C5',
        obsidian: '#090d16',
      },
    },
  },
  plugins: [],
}
