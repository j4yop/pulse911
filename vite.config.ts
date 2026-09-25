import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'next/image': path.resolve(__dirname, './src/components/ui/image.tsx'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    // The Moss/ONNX WASM payload is intentionally large; keep the warning tuned
    // so real regressions still surface while the async runtime chunk is quiet.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          // Keep the async Moss + ONNX runtime isolated so it never loads on the landing page.
          if (id.includes('@moss-dev') || id.includes('onnxruntime')) {
            return 'moss-runtime';
          }
          if (id.includes('motion') || id.includes('framer-motion')) {
            return 'motion';
          }
          if (id.includes('lucide-react')) return 'icons-lucide';
          if (id.includes('@phosphor-icons')) return 'icons-phosphor';
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) {
            return 'react-vendor';
          }
          return undefined;
        },
      },
    },
  },
});
