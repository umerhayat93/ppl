/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"','cursive'],
        body:    ['"Rajdhani"','sans-serif'],
        mono:    ['"Orbitron"','monospace'],
      },
      colors: {
        gold:  { DEFAULT:'#f0c040', light:'#ffd966', dark:'#c8960a' },
        deep:  { DEFAULT:'#040810', 2:'#0a0f1e', 3:'#0f1628', 4:'#161f38', 5:'#1e2a4a' },
        cyan:  { DEFAULT:'#00d4ff' },
        green: { DEFAULT:'#00ff88' },
        red:   { DEFAULT:'#ff3b5c' },
        amber: { DEFAULT:'#ff8c00' },
      },
      animation: {
        'pulse-slow':  'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'slide-up':    'slideUp 0.3s ease-out',
        'fade-in':     'fadeIn 0.25s ease',
        'ping-slow':   'ping 2s cubic-bezier(0,0,0.2,1) infinite',
        'ticker':      'ticker 30s linear infinite',
        'spin-slow':   'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        'glow':        'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        slideUp:  { from:{ opacity:'0',transform:'translateY(8px)' }, to:{ opacity:'1',transform:'translateY(0)' } },
        fadeIn:   { from:{ opacity:'0' }, to:{ opacity:'1' } },
        ticker:   { '0%':{ transform:'translateX(0)' }, '100%':{ transform:'translateX(-50%)' } },
        glow:     { from:{ boxShadow:'0 0 10px rgba(240,192,64,0.3)' }, to:{ boxShadow:'0 0 25px rgba(240,192,64,0.7)' } },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    }
  },
  plugins: []
}
