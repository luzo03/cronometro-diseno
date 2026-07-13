/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,html}', './index.html'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0A0A0B',
          900: '#0A0A0B',
          800: '#111114',
          700: '#17171B',
          600: '#1F1F24',
          500: '#26262C'
        },
        mint: {
          DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft-rgb) / <alpha-value>)',
          deep: 'rgb(var(--accent-deep-rgb) / <alpha-value>)',
          dim: 'rgb(var(--accent-rgb) / 0.12)',
          glow: 'rgb(var(--accent-rgb) / 0.25)'
        },
        chalk: {
          DEFAULT: '#FAFAFA',
          70: 'rgba(250, 250, 250, 0.70)',
          50: 'rgba(250, 250, 250, 0.50)',
          30: 'rgba(250, 250, 250, 0.30)',
          15: 'rgba(250, 250, 250, 0.15)',
          08: 'rgba(250, 250, 250, 0.08)',
          05: 'rgba(250, 250, 250, 0.05)'
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'monospace'
        ]
      },
      letterSpacing: {
        tightish: '-0.01em',
        tighter2: '-0.02em'
      },
      keyframes: {
        pulseRing: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' }
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(2px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        pulseRing: 'pulseRing 1.2s ease-in-out infinite',
        fadeIn: 'fadeIn 0.2s ease-out'
      }
    }
  },
  plugins: []
}
