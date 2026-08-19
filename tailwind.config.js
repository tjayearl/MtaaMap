/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ink': 'var(--color-ink)',
        'surface': 'var(--color-surface)',
        'surface-raised': 'var(--color-surface-raised)',
        'hairline': 'var(--color-hairline)',
        'mist': 'var(--color-mist)',
        'fog': 'var(--color-fog)',
        'paper': 'var(--color-paper)',
        'electric': 'var(--color-electric)',
        'electric-dim': 'var(--color-electric-dim)',
        'verified': 'var(--color-verified)',
        'flag': 'var(--color-flag)',
        'dispute': 'var(--color-dispute)',
      },
      fontFamily: {
        'display': 'var(--font-display)',
        'body': 'var(--font-body)',
        'data': 'var(--font-data)',
      }
    },
  },
  plugins: [],
}