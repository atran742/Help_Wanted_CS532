import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/authorizedusers": "http://localhost:3000",
      "/api": "http://localhost:3000",
    },
  },
});
