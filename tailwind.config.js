/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#e8f1fb',
          100: '#c5d9f5',
          200: '#9ebef0',
          300: '#77a3ea',
          400: '#5a8fe6',
          500: '#3d7be2',
          600: '#1A6BCC',
          700: '#1557a8',
          800: '#104385',
          900: '#0a2f61',
        },
        orange: {
          50: '#fff4e6',
          100: '#ffe2b8',
          200: '#ffce88',
          300: '#ffba58',
          400: '#ffaa35',
          500: '#F7931E',
          600: '#e07d0a',
          700: '#b86500',
          800: '#904f00',
          900: '#683900',
        },
        navy: {
          900: '#0D1B2A',
          800: '#112234',
          700: '#172d44',
        },
      },
      boxShadow: {
        card: '0 4px 20px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 40px rgba(26,107,204,0.15)',
        glow: '0 0 20px rgba(37,211,102,0.5)',
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
};
