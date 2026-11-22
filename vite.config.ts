import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'vendor-react',
                test: /node_modules[\\/](react|react-dom|scheduler)/,
                priority: 30,
              },
              {
                name: 'vendor-xlsx',
                test: /node_modules[\\/]xlsx/,
                priority: 25,
              },
              {
                name: 'vendor-jspdf',
                test: /node_modules[\\/]jspdf/,
                priority: 28,
              },
              {
                name: 'vendor-html2pdf',
                test: /node_modules[\\/](html2pdf\.js|html2canvas-pro|dompurify|canvg|fflate|rgbcolor|stackblur-canvas|svg-pathdata)/,
                priority: 25,
              },
              {
                name: 'vendor-docx',
                test: /node_modules[\\/](docx|jszip)/,
                priority: 25,
              },
              {
                name: 'vendor-ui',
                test: /node_modules[\\/](lucide-react|motion|framer-motion)/,
                priority: 20,
              },
            ],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
