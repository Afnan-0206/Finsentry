/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#050505',
        foreground: '#FFFFFF',
        card: {
          DEFAULT: '#101012',
          foreground: '#FFFFFF',
          subtle: '#151518',
          hover: '#18181C',
        },
        surface: {
          base: '#050505',
          card: '#101012',
          card2: '#151518',
          card3: '#1E1E22',
          hover: '#1B1B20',
          border: 'rgba(255, 255, 255, 0.08)',
          borderStrong: '#26262B',
        },
        border: 'rgba(255, 255, 255, 0.08)',
        muted: {
          DEFAULT: '#1E1E22',
          foreground: 'rgba(255, 255, 255, 0.56)',
        },
        lime: {
          accent: '#E8FF1F',
          hover: '#D4EB17',
          glow: 'rgba(232, 255, 31, 0.15)',
        },
        lavender: {
          accent: '#A9B2FF',
          glow: 'rgba(169, 178, 255, 0.15)',
        },
        copper: {
          accent: '#FFB37A',
          glow: 'rgba(255, 179, 122, 0.15)',
        },
        pink: {
          accent: '#FF6AA8',
          glow: 'rgba(255, 106, 168, 0.15)',
        },
        green: {
          accent: '#58B58C',
          glow: 'rgba(88, 181, 140, 0.15)',
        },
        cyan: {
          accent: '#38BDF8',
          glow: 'rgba(56, 189, 248, 0.15)',
        },
      },
      borderRadius: {
        'bento': '24px',
        'bento-lg': '28px',
        'bento-sm': '18px',
        'bento-xs': '12px',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'bento': '0 4px 20px -2px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.06)',
        'bento-glow': '0 0 25px -5px rgba(232, 255, 31, 0.12), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'bento-card': '0 8px 30px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'card-gradient': 'linear-gradient(180deg, #151518 0%, #101012 100%)',
        'card-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      }
    },
  },
  plugins: [],
}
