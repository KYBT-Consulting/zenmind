import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(__dirname, '.') },
        { find: /^simple-mind-map$/, replacement: path.resolve(__dirname, 'src/vendor/simple-mind-map/full.js') },
        { find: /^deepmerge$/, replacement: path.resolve(__dirname, 'src/shims/deepmerge.js') },
        { find: /^(node:)?stream$/, replacement: path.resolve(__dirname, 'src/shims/stream.js') },
      ],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
