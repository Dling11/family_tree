/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#7f1d1d',
        moss: '#a83232',
        cream: '#ffffff',
        sand: '#f8eeee',
        clay: '#CE2626',
        ink: '#301f21',
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        soft: '0 20px 60px rgba(206, 38, 38, 0.12)',
      },
    },
  },
  plugins: [],
};
