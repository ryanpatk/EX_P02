/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: [
          'JetBrains Mono',
          'SF Mono',
          'Monaco',
          'Cascadia Code',
          'Roboto Mono',
          'Consolas',
          'Courier New',
          'monospace',
        ],
      },
      colors: {
        // Core colors
        white: '#F7FAFF',
        'light-grey': '#E5EDF8',
        'medium-grey': '#A7B4CA',
        'dark-grey': '#111A2B',
        black: '#08101C',

        // Accent colors
        blue: {
          DEFAULT: '#0328F1',
          400: '#2545FF',
          500: '#0328F1',
          600: '#0223D0',
        },
        orange: {
          DEFAULT: '#FB4010',
          500: '#FB4010',
          600: '#FF7C2B',
        },
        yellow: {
          DEFAULT: '#F6F91E',
          500: '#F6F91E',
          600: '#C9CC27',
        },
        'orange-muted': '#FF7C2B',
        'yellow-muted': '#C9CC27',
        'light-orange': '#FFF1EB',

        // Semantic colors
        success: '#2545FF',
        warning: '#F6F91E',
        error: '#FB4010',
        info: '#0328F1',
      },
      fontSize: {
        xs: '0.75rem', // 12px
        sm: '0.875rem', // 14px
        base: '1rem', // 16px
        lg: '1.125rem', // 18px
        xl: '1.25rem', // 20px
        '2xl': '1.5rem', // 24px
        '3xl': '2rem', // 32px
      },
      spacing: {
        1: '8px',
        2: '16px',
        3: '24px',
        4: '32px',
        6: '48px',
        8: '64px',
      },
      borderRadius: {
        none: '0',
        sm: '2px',
        md: '4px',
      },
      borderColor: {
        orange: '#A7B4CA',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
