import { defineConfig } from 'vite';

export default defineConfig({
  // Aggiunto per GitHub Pages (deve corrispondere al nome del repository tra due slash)
  base: '/final-project-space_groovers/',
  
  root: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
  server: {
    open: true // Apre automaticamente la pagina nel browser all'avvio
  }
});