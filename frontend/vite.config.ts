import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { rollupOptions: { output: { manualChunks: { qr: ['@zxing/browser','qrcode'] } } } },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:5000' },
    host: true,
  },
});
