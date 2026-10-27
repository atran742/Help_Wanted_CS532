import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/authorizedusers": "http://localhost:3000",
      "/api": "http://localhost:3000",
    },
  },
});
