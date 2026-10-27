import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  redirects: { '/company/lemonmicrofun': '/company/microfun/' },
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
});
