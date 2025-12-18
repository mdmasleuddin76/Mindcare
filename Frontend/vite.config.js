import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import typography from '@tailwindcss/typography'; // ✅ Import like this

export default defineConfig({
  plugins: [react(), tailwindcss(), typography], // ✅ Use directly
});
