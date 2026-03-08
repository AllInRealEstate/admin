/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          // NEW CREAM & GOLD PALETTE
          cream: '#FAF8F3',           // Primary background (warm cream)
          beige: '#F5F1E8',           // Secondary background (light beige)
          gold: '#D4AF37',            // Accent gold (rich gold)
          'gold-light': '#E8C547',    // Lighter gold for hovers
          'gold-dark': '#B8941F',     // Darker gold for depth
          brown: '#2C2416',           // Primary text (deep brown)
          'brown-light': '#6B5D4F',   // Secondary text (medium brown)
          'brown-pale': '#9C8D7B',    // Tertiary text (pale brown)
          
          // Keep these for backwards compatibility
          black: '#2C2416',           // Maps to brown for dark text
          charcoal: '#F5F1E8',        // Maps to beige for cards
          gray: '#6B5D4F',            // Maps to brown-light
        }
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'serif'],
        sans: ['Inter', 'sans-serif'],
        accent: ['Cinzel', 'serif'],
        hebrew: ['Heebo', 'sans-serif'],
        arabic: ['Cairo', 'sans-serif'],
      }
    },
  },
  plugins: [],
};