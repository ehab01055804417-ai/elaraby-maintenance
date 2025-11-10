import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  server: {
    port: 3000,
    host: true,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: './index.html',
        login: './login.html'
      }
    }
  },
  publicDir: 'audio',
  optimizeDeps: {
    exclude: ['js/db.js', 'js/app.js']
  }
})