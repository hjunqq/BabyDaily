import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy({
      // Kindle uses old Chromium-based browser without ES6 support
      // Target ES5 for maximum compatibility
      targets: ['ie >= 11', 'Chrome >= 49', 'Safari >= 10', 'defaults'],
      // Generate legacy chunks for old browsers
      renderLegacyChunks: true,
      // Include all necessary polyfills
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      modernPolyfills: true
    })
  ],
  build: {
    // Enable minification with terser
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for debugging
        drop_debugger: true,
        pure_funcs: ['console.log'] // Remove console.log in production
      }
    },
    // Configure chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split vendor libraries into separate chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            // Let Vite handle devextreme automatically
            return 'vendor';
          }
        }
      }
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Source maps for debugging (disable in production for smaller builds)
    sourcemap: false
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
