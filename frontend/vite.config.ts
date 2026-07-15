import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    legacy({
      // Target browsers from 2020+ — covers Chrome 80, Firefox 78, Safari 14, iOS 14
      targets: ['chrome >= 80', 'firefox >= 78', 'safari >= 14', 'ios >= 14', 'edge >= 80'],
      // Adds polyfills for missing APIs (Promise, Object.assign, etc.)
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      modernPolyfills: true,
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/menu': 'http://localhost:3001',
      '/orders': 'http://localhost:3001',
      '/dashboard': 'http://localhost:3001',
      '/ai': 'http://localhost:3001',
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
})
