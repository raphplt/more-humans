import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// SPA 100 % client : pas de SSR. Cf. 01_ARCHITECTURE §1.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
