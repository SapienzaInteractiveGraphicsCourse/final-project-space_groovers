import { defineConfig } from 'vite';

export default defineConfig({
  // For github action
  base: '/final-project-space_groovers/',
  
  root: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
  server: {
    open: true // open the browser page
  }
});