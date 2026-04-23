import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // azul ciência — cor primária
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        correta: '#22c55e',
        incorreta: '#ef4444',
        neutra: '#94a3b8',
        performance: {
          forte: '#16a34a',
          medio: '#d97706',
          fraco: '#dc2626',
        },
        facil: '#4ade80',
        medio: '#facc15',
        dificil: '#f87171',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        // Mínimo 16px em textos de formulário (evita zoom no iOS)
        'questao': ['17px', { lineHeight: '1.7', letterSpacing: '-0.01em' }],
        'alternativa': ['15px', { lineHeight: '1.5' }],
        'label': ['16px', { lineHeight: '1.4' }],
      },
      spacing: {
        'touch': '48px',
      },
      animation: {
        'stream': 'stream 0.1s ease-in-out',
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        stream: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
