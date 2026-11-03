/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-glass": "var(--surface-glass)",
        "accent-cyan": "var(--accent-cyan)",
        "accent-gold": "var(--accent-gold)",
        "accent-blue": "var(--accent-blue)",
        text: "var(--text)",
        "text-muted": "var(--text-muted)",
        "focus-ring": "var(--focus-ring)",
      },
      fontFamily: {
        sans: ['"Outfit"', '"Inter"', 'sans-serif'],
      },
      boxShadow: {
        'holo-cyan': '0 0 25px rgba(25, 217, 255, 0.45), inset 0 0 15px rgba(25, 217, 255, 0.25)',
        'holo-gold': '0 0 30px rgba(255, 198, 109, 0.55), inset 0 0 20px rgba(255, 198, 109, 0.3)',
        'tv-card': '0 15px 35px rgba(0, 0, 0, 0.6), 0 0 15px rgba(25, 217, 255, 0.2)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        }
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2.5s ease-in-out infinite',
        scanline: 'scanline 8s linear infinite',
      }
    },
  },
  plugins: [],
}
