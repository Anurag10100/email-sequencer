import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Single canonical port — matches the preview/launch config so `npm run dev`
  // and the in-app preview never diverge. strictPort avoids silent fallback.
  server: {
    port: 5176,
    strictPort: true,
    // proxy API calls to the Express backend so the frontend stays origin-clean
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
})
