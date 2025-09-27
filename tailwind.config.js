/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode colors
        background: '#F6F6F6',
        card: '#FFFFFF',
        primary: '#90CAF9',
        secondary: '#A5D6A7',
        accent: '#FFCC80',
        success: '#66BB6A',
        warning: '#EF9A9A',
        text: {
          primary: '#2C2C2C',
          secondary: '#5A5A5A',
        },
        // Dark mode colors
        dark: {
          background: '#121212',
          card: '#1E1E1E',
          primary: '#64B5F6',
          secondary: '#81C784',
          accent: '#FFB74D',
          success: '#43A047',
          warning: '#E57373',
          text: {
            primary: '#E0E0E0',
            secondary: '#9E9E9E',
          }
        }
      },
      fontFamily: {
        'japanese': ['Noto Sans JP', 'sans-serif'],
      },
      animation: {
        'flip': 'flip 0.8s ease-out',
        'bounce-gentle': 'bounce-gentle 0.8s ease-in-out',
        'slide-up': 'slide-up 0.6s ease-out',
        'slide-down': 'slide-down 1.2s ease-out',
        'fade-in': 'fade-in 0.8s ease-out',
        'pulse-subtle': 'pulse-subtle 3s ease-in-out infinite',
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
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' }
        }
      }
    },
  },
  plugins: [],
}