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
        ivory: {
          DEFAULT: '#F7F7F0', // warm ivory page background
          surface: '#EFEFD8',
          card: '#FFFFFF',    // main white cards
        },
        sage: {
          50: '#F2F6F1',
          100: '#E7EFE3', // soft green cards
          200: '#C7DAC2',
          300: '#9CBF94',
          500: '#416A47', // primary green
          600: '#2F5436', // deep green
          700: '#234029',
          800: '#1D2A20', // primary text
          900: '#131D15',
        },
        farmText: {
          primary: '#1D2A20',   // primary text
          body: '#3F4A42',      // body text
          secondary: '#6F786F', // secondary text
        },
        farmStatus: {
          warning: '#D99A45', // warning accent
          danger: '#C85B57',  // danger accent
          success: '#416A47',
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(47, 84, 54, 0.06)',
        'card': '0 4px 12px -2px rgba(29, 42, 32, 0.05)',
      }
    },
  },
  plugins: [],
}


