import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#080a0f',
        foreground: '#f8f9fa',
        'card-bg': '#0d1117',
        'card-hover': '#161b22',
        border: '#30363d',
        primary: '#4d80ff',
        'primary-hover': '#3b6ef5',
        success: '#2ea043',
        warning: '#e6a700',
        error: '#f85149',
        muted: '#8b949e',
        secondary: "#F542A4",
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "rpx-gradient-radial":
          "radial-gradient(circle at 50% 0%, rgba(138, 82, 245, 0.2), transparent 70%)",
        "hero-pattern":
          "radial-gradient(circle at 50% 0%, rgba(138, 82, 245, 0.15), transparent 60%), linear-gradient(180deg, #0a0a0f 0%, #0c0c12 100%)",
        "card-gradient":
          "linear-gradient(135deg, var(--card-bg), var(--card-hover))",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "progress-to-right": "progress-to-right 1.5s ease-in-out forwards",
        "spin-slow": "spin-slow 3s linear infinite",
        "spin-slow-reverse": "spin-slow-reverse 4s linear infinite",
        "pulse-shadow": "pulse-shadow 2s infinite"
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "progress-to-right": {
          from: { width: '0%' },
          to: { width: '100%' }
        },
        "spin-slow": {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' }
        },
        "spin-slow-reverse": {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(-360deg)' }
        },
        "pulse-shadow": {
          '0%, 100%': { boxShadow: '0 0 0 0px rgba(139, 92, 246, 0.5)' },
          '50%': { boxShadow: '0 0 0 15px rgba(139, 92, 246, 0)' }
        }
      },
      borderRadius: {
        "xl": "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        rpx: "0 4px 20px rgba(138, 82, 245, 0.25)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config; 