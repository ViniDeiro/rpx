/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cores de fundo e cartões
        'background': '#0F0A1F', // Fundo mais escuro com tom roxo
        'card-bg': '#1A123C',    // Cards com tom roxo escuro
        'card-hover': '#251A52', // Hover de cards com tom roxo médio
        'border': '#3D2A8A',     // Bordas em tom roxo mais visível
        
        // Cores de ação e destaque
        'primary': '#6D28D9',    // Roxo vibrante para ações primárias
        'primary-light': '#8B5CF6', // Roxo mais claro
        'primary-dark': '#5B21B6',  // Roxo mais escuro
        'secondary': '#2563EB',   // Azul para elementos secundários
        'secondary-light': '#3B82F6', // Azul mais claro
        
        // Cores de estados e feedback
        'error': '#EF4444',
        'success': '#10B981',
        'warning': '#F59E0B',
        
        // Cores de texto
        'muted': '#9CA3AF',
        'foreground': '#F8F9FA',
        'foreground-muted': '#CED4DA',
        
        // Cores de gradiente
        'gradient-start': '#6D28D9', // Roxo
        'gradient-mid': '#4F46E5',   // Indigo
        'gradient-end': '#2563EB',   // Azul
      },
      backgroundImage: {
        'rpx-gradient': 'linear-gradient(45deg, #6D28D9, #2563EB)',
        'rpx-gradient-hover': 'linear-gradient(45deg, #5B21B6, #1D4ED8)',
        'rpx-gradient-vertical': 'linear-gradient(to bottom, #6D28D9, #2563EB)',
        'rpx-gradient-radial': 'radial-gradient(circle, #6D28D9, #1E1A3A)',
      },
      boxShadow: {
        'rpx': '0 0 15px rgba(109, 40, 217, 0.4)',
        'rpx-hover': '0 0 25px rgba(109, 40, 217, 0.6)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-very-slow': 'pulse 12s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
        'tilt': 'tilt 10s infinite linear',
        'beam-move-slow': 'beam-move 15s ease-in-out infinite',
        'beam-move-delay': 'beam-move 15s 5s ease-in-out infinite',
        'twinkle': 'twinkle 8s ease-in-out infinite',
        'shine': 'shine 2s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        tilt: {
          '0%, 50%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(2deg)' },
          '75%': { transform: 'rotate(-2deg)' },
        },
        'beam-move': {
          '0%, 100%': { transform: 'translateY(10%) rotate(15deg)' },
          '50%': { transform: 'translateY(0%) rotate(10deg)' },
        },
        twinkle: {
          '0%, 100%': { opacity: 0.5 },
          '50%': { opacity: 1 }
        },
        shine: {
          '0%': { 'background-position': '-200% center' },
          '100%': { 'background-position': '200% center' }
        }
      },
      transformOrigin: {
        'center-bottom': 'center bottom',
      },
      translate: {
        'perspective-800': 'perspective(800px)',
      },
      rotate: {
        'rotateX-10': 'rotateX(-10deg)',
      },
    },
  },
  plugins: [],
} 