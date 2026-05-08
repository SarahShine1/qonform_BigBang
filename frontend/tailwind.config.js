export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:  { DEFAULT: '#1B2A4A', light: '#2d4270' },
        accent: { DEFAULT: '#C0183F' },
      },
    },
  },
  plugins: [],
}
