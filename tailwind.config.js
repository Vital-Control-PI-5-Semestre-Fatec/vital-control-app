/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        // Tokens do Vital Control: cada chave tem DEFAULT (light) e dark (dark mode).
        'vc-bg': { DEFAULT: '#EDF2F7', dark: '#0C1B2E' },
        'vc-surface': { DEFAULT: '#C8D5E0', dark: '#0A2638' },
        'vc-surface-raised': { DEFAULT: '#D7E1EA', dark: '#10364A' },
        'vc-primary': { DEFAULT: '#2D4F8E', dark: '#5B9FE8' },
        'vc-secondary': { DEFAULT: '#1A7870', dark: '#7EDBB0' },
        'vc-accent': { DEFAULT: '#1A8A7A', dark: '#A0E8CA' },
        'vc-text': { DEFAULT: '#0C1B2E', dark: '#F1F5F9' },
        'vc-text-muted': { DEFAULT: '#4A6580', dark: '#94A3B8' },
        'vc-border': { DEFAULT: '#B2C4D8', dark: '#1A3A52' },
        'vc-danger': { DEFAULT: '#C83E55', dark: '#FF9CA8' },
        'vc-warning': { DEFAULT: '#9A6A00', dark: '#F3C969' },
      },
    },
  },
  plugins: [],
};
