import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
  server: {
    open: true // Apre automaticamente la pagina nel browser all'avvio
  }
});