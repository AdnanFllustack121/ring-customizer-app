import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    watch: {},
    // outDir: '../extensions/product-options/assets/',  // Dist
    outDir: '../public/storefront/',     // Dev
    rollupOptions: {
      input: '/src/main.jsx',
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`,
      }
    }
  }
})