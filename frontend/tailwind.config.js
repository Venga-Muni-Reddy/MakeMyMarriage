/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Stitch Royal Luminescence Tokens
        primary: {
          DEFAULT: '#7f560c',
          container: '#bf8e42',
          fixed: '#ffddb1',
          'fixed-dim': '#f4bd6c',
        },
        secondary: {
          DEFAULT: '#b32446',
          container: '#fe5e7a',
          fixed: '#ffd9dc',
          'fixed-dim': '#ffb2ba',
        },
        surface: {
          DEFAULT: '#fff8f5',
          dim: '#e0d8d5',
          bright: '#fff8f5',
          container: '#f4ece8',
          'container-low': '#faf2ee',
          'container-high': '#eee7e3',
          'container-highest': '#e9e1dd',
          'container-lowest': '#ffffff',
        },
        'on-surface': {
          DEFAULT: '#1e1b19',
          variant: '#4f4538',
        },
        'on-primary': {
          DEFAULT: '#ffffff',
          container: '#432a00',
          fixed: '#291800',
        },
        'on-secondary': {
          DEFAULT: '#ffffff',
          container: '#63001e',
          fixed: '#400010',
          'fixed-variant': '#910130',
        },
        'inverse-surface': '#33302d',
        outline: {
          DEFAULT: '#827566',
          variant: '#d3c4b3',
        },
        // Semantic Gold & Rose palettes
        gold: {
          50: '#fdfbf7',
          100: '#fbf7ee',
          200: '#f5edd6',
          300: '#eddcb4',
          400: '#e2c589',
          500: '#d4aa5d',
          600: '#bf8e42',
          700: '#9f6f34',
          800: '#81572f',
          900: '#6a4729',
        },
        rose: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
