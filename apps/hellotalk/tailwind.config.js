/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ht: {
          blue: '#2563EB',
          sky: '#0EA5E9',
          coral: '#F43F5E',
          emerald: '#10B981',
          amber: '#F59E0B',
          dark: '#0F172A',
          card: '#1E293B',
          border: '#334155',
        },
      },
    },
  },
  plugins: [],
};

