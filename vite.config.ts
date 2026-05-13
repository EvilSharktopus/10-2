import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600, // kB — raise threshold slightly above our split chunks
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Firebase SDK (~300KB) — changes rarely, cache a long time
          if (id.includes('node_modules/firebase')) return 'vendor-firebase';
          // React + router (~140KB)
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router')
          ) return 'vendor-react';
          // Zustand (~10KB)
          if (id.includes('node_modules/zustand')) return 'vendor-state';
          // Course content JSON (~300KB) — separate from app logic
          if (id.includes('stops-content-v4')) return 'course-content';
        },
      },
    },
  },
})
