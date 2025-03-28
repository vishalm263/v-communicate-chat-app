import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: 'gzip',
      filter: /\.(js|css|html|svg)$/,
      threshold: 10240, // Only compress files > 10kb
      deleteOriginFile: false
    })
  ],
  build: {
    outDir: 'public',
    // Increase the warning limit to avoid noise in terminal
    chunkSizeWarningLimit: 1000,
    // Optimize large dependencies into separate chunks
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI components and utilities
          ui: ['lucide-react', 'react-hot-toast', 'emoji-picker-react'],
          // Core utilities
          utils: ['zustand', 'axios', 'socket.io-client']
        },
        // Ensure chunk filenames include content hash for better caching
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Enable size minification optimizations
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // Generate smaller sourcemaps for production
    sourcemap: 'hidden'
  },
  // Optimize assets
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand']
  }
})
