
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/upload': 'http://127.0.0.1:8000',
  '/upload_image': 'http://127.0.0.1:8000',
      '/ask': 'http://127.0.0.1:8000',
      '/save_note': 'http://127.0.0.1:8000',
      '/notes': 'http://127.0.0.1:8000',
      '/status': 'http://127.0.0.1:8000',
      '/uploads-list': 'http://127.0.0.1:8000',
      '/uploads': 'http://127.0.0.1:8000',
      '/files': 'http://127.0.0.1:8000',
      '/files-meta': 'http://127.0.0.1:8000',
      '/file': 'http://127.0.0.1:8000',
  '/notebooks': 'http://127.0.0.1:8000',
  '/ingest_url': 'http://127.0.0.1:8000',
      '/health': 'http://127.0.0.1:8000'
    }
  }
});
