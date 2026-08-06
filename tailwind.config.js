/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b0b10',
        panel: '#15151f',
        panel2: '#1d1d2b',
        line: '#2a2a3c',
        brand: '#e11d48',
        brand2: '#f43f5e',
        gold: '#f5b400',
        mint: '#34d399'
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif']
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(225,29,72,0.5)' },
          '100%': { boxShadow: '0 0 0 18px rgba(225,29,72,0)' }
        },
        flyUp: {
          '0%': { transform: 'translateY(0) scale(0.7)', opacity: '0' },
          '15%': { opacity: '1' },
          '100%': { transform: 'translateY(-65vh) scale(1.4)', opacity: '0' }
        },
        confetti: {
          '0%': { transform: 'translateY(-20px) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(105vh) rotate(720deg)', opacity: '0.6' }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' }
        },
        slideInL: {
          '0%': { transform: 'translateX(-70vw) rotate(-8deg)', opacity: '0' },
          '70%': { transform: 'translateX(6px) rotate(1deg)', opacity: '1' },
          '100%': { transform: 'translateX(0) rotate(0)' }
        },
        slideInR: {
          '0%': { transform: 'translateX(70vw) rotate(8deg)', opacity: '0' },
          '70%': { transform: 'translateX(-6px) rotate(-1deg)', opacity: '1' },
          '100%': { transform: 'translateX(0) rotate(0)' }
        },
        vsPop: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.6)', opacity: '1' },
          '100%': { transform: 'scale(1)' }
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 18px 2px rgba(245,180,0,0.55)' },
          '50%': { boxShadow: '0 0 42px 10px rgba(245,180,0,0.85)' }
        },
        winPop: {
          '0%': { transform: 'scale(0.3) rotate(-8deg)', opacity: '0' },
          '55%': { transform: 'scale(1.15) rotate(2deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0)' }
        },
        beerBounce: {
          '0%': { transform: 'scale(1)' },
          '35%': { transform: 'scale(1.5) rotate(-12deg)' },
          '70%': { transform: 'scale(0.92) rotate(6deg)' },
          '100%': { transform: 'scale(1)' }
        },
        sheetUp: {
          '0%': { transform: 'translateY(40px) scale(0.96)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' }
        }
      },
      animation: {
        pop: 'pop 0.25s ease-out',
        pulseRing: 'pulseRing 1.2s ease-out infinite',
        flyUp: 'flyUp 2.4s ease-out forwards',
        confetti: 'confetti linear forwards',
        shake: 'shake 0.4s ease-in-out',
        slideInL: 'slideInL 0.55s cubic-bezier(0.2,0.9,0.3,1.2) both',
        slideInR: 'slideInR 0.55s cubic-bezier(0.2,0.9,0.3,1.2) both',
        vsPop: 'vsPop 0.5s 0.35s cubic-bezier(0.2,0.9,0.3,1.4) both',
        glow: 'glow 1.6s ease-in-out infinite',
        winPop: 'winPop 0.6s cubic-bezier(0.2,0.9,0.3,1.3) both',
        beerBounce: 'beerBounce 0.5s ease-out',
        sheetUp: 'sheetUp 0.3s cubic-bezier(0.2,0.9,0.3,1.1) both'
      }
    }
  },
  plugins: []
}
