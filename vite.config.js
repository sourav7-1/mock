import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './', // Relative asset paths ensure it runs on any domain, subpath, Netlify, Vercel, or GitHub Pages
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
  },
});
