import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(function({ mode }) {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || 'http://localhost:5000/api';
  const socketUrl = env.VITE_SOCKET_URL || 'http://localhost:5000';
  const targetBase = socketUrl;

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: targetBase,
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: targetBase,
          ws: true,
          changeOrigin: true,
        },
        '/uploads': {
          target: targetBase,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            socket: ['socket.io-client'],
          },
        },
      },
    },
    define: {
      __API_URL__: JSON.stringify(apiUrl),
    },
  };
});
