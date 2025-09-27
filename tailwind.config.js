/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          pink: '#FFE4E1',
          blue: '#E6F3FF',
          green: '#E8F5E8',
          yellow: '#FFF8DC',
          lavender: '#F0E6FF',
          peach: '#FFE5CC',
        },
        accent: {
          pink: '#FF69B4',
          blue: '#87CEEB',
          green: '#98FB98',
          yellow: '#FFD700',
          lavender: '#DDA0DD',
          peach: '#FFAB91',
        }
      },
      fontFamily: {
        'japanese': ['Noto Sans JP', 'sans-serif'],
      },
      animation: {
        'flip': 'flip 0.8s ease-out',
        'bounce-gentle': 'bounce-gentle 0.8s ease-in-out',
        'slide-up': 'slide-up 0.6s ease-out',
        'fade-in': 'fade-in 0.8s ease-out',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(-90deg)' },
          '100%': { transform: 'rotateY(0deg)' }
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' }
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      }
    },
  },
  plugins: [],
}