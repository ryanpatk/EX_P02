/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'Consolas', 'Courier New', 'monospace'],
      },
      colors: {
        // Core colors
        'white': '#FFFFFF',
        'light-grey': '#F5F5F5',
        'medium-grey': '#E0E0E0',
        'dark-grey': '#333333',
        'black': '#000000',
        
        // Accent colors
        'orange': {
          DEFAULT: '#FF6B35',
          500: '#FF6B35',
          600: '#FF8A5C',
        },
        'pink': {
          DEFAULT: '#FF69B4',
          500: '#FF69B4',
          600: '#FFB3DA',
        },
        'orange-muted': '#FF8A5C',
        'pink-muted': '#FFB3DA',
        
        // Semantic colors
        'success': '#00FF41',
        'warning': '#FFFF00',
        'error': '#FF0040',
        'info': '#00FFFF',
      },
      fontSize: {
        'xs': '0.75rem',     // 12px
        'sm': '0.875rem',    // 14px
        'base': '1rem',      // 16px
        'lg': '1.125rem',    // 18px
        'xl': '1.25rem',     // 20px
        '2xl': '1.5rem',     // 24px
        '3xl': '2rem',       // 32px
      },
      spacing: {
        '1': '8px',
        '2': '16px',
        '3': '24px',
        '4': '32px',
        '6': '48px',
        '8': '64px',
      },
      borderRadius: {
        'none': '0',
        'sm': '2px',
        'md': '4px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}