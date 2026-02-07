import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#0a0e1a',
          secondary: '#141b2d',
          tertiary: '#1f2940',
        },
        text: {
          primary: '#e0e6ed',
          secondary: '#8b92a7',
          tertiary: '#5a607a',
        },
        accent: {
          profit: '#10b981',
          loss: '#ef4444',
          warning: '#f59e0b',
          info: '#3b82f6',
          purple: '#8b5cf6',
        },
        chart: {
          grid: '#252e42',
          axis: '#4a5568',
          bull: '#10b981',
          bear: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
