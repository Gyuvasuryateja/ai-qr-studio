import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          content: [
            path.resolve(__dirname, 'index.html'),
            path.resolve(__dirname, 'src/**/*.{js,ts,jsx,tsx}'),
          ],
          darkMode: 'class',
          theme: {
            extend: {
              colors: {
                brand: {
                  50: '#eef2ff',
                  100: '#e0e7ff',
                  200: '#c7d2fe',
                  300: '#a5b4fc',
                  400: '#818cf8',
                  500: '#6366f1',
                  600: '#4f46e5',
                  700: '#4338ca',
                  800: '#3730a3',
                  900: '#312e81',
                  950: '#1e1b4b',
                },
                cyber: {
                  neon: '#00f2fe',
                  purple: '#9d4edd',
                  pink: '#f72585',
                  dark: '#0b0f19',
                  card: '#111827',
                  surface: '#1f2937'
                }
              },
              animation: {
                'gradient-x': 'gradient-x 15s ease infinite',
                'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 3s ease-in-out infinite',
              },
              keyframes: {
                'gradient-x': {
                  '0%, 100%': {
                    'background-size': '200% 200%',
                    'background-position': 'left center'
                  },
                  '50%': {
                    'background-size': '200% 200%',
                    'background-position': 'right center'
                  },
                },
                pulseGlow: {
                  '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 15px rgba(99, 102, 241, 0.6))' },
                  '50%': { opacity: '0.8', filter: 'drop-shadow(0 0 5px rgba(99, 102, 241, 0.2))' },
                },
                float: {
                  '0%, 100%': { transform: 'translateY(0px)' },
                  '50%': { transform: 'translateY(-6px)' },
                }
              }
            }
          }
        }),
        autoprefixer(),
      ],
    },
  },
  server: {
    host: true, // Listen on all network interfaces including LAN (0.0.0.0)
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
});
