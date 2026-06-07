/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        // Tokens do Vital Control. Os nomes com "-dark" continuam existindo para
        // compatibilidade com as telas atuais, mas agora seguem o tema do celular.
        'vc-bg': 'rgb(var(--vc-bg) / <alpha-value>)',
        'vc-bg-dark': 'rgb(var(--vc-bg) / <alpha-value>)',
        'vc-surface': 'rgb(var(--vc-surface) / <alpha-value>)',
        'vc-surface-dark': 'rgb(var(--vc-surface) / <alpha-value>)',
        'vc-surface-raised': 'rgb(var(--vc-surface-raised) / <alpha-value>)',
        'vc-surface-raised-dark': 'rgb(var(--vc-surface-raised) / <alpha-value>)',
        'vc-primary': 'rgb(var(--vc-primary) / <alpha-value>)',
        'vc-primary-dark': 'rgb(var(--vc-primary) / <alpha-value>)',
        'vc-secondary': 'rgb(var(--vc-secondary) / <alpha-value>)',
        'vc-secondary-dark': 'rgb(var(--vc-secondary) / <alpha-value>)',
        'vc-accent': 'rgb(var(--vc-accent) / <alpha-value>)',
        'vc-accent-dark': 'rgb(var(--vc-accent) / <alpha-value>)',
        'vc-text': 'rgb(var(--vc-text) / <alpha-value>)',
        'vc-text-dark': 'rgb(var(--vc-text) / <alpha-value>)',
        'vc-text-muted': 'rgb(var(--vc-text-muted) / <alpha-value>)',
        'vc-text-muted-dark': 'rgb(var(--vc-text-muted) / <alpha-value>)',
        'vc-border': 'rgb(var(--vc-border) / <alpha-value>)',
        'vc-border-dark': 'rgb(var(--vc-border) / <alpha-value>)',
        'vc-danger': 'rgb(var(--vc-danger) / <alpha-value>)',
        'vc-danger-dark': 'rgb(var(--vc-danger) / <alpha-value>)',
        'vc-warning': 'rgb(var(--vc-warning) / <alpha-value>)',
        'vc-warning-dark': 'rgb(var(--vc-warning) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};
