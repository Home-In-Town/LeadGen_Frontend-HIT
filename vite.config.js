import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Phase-aware HTML transform plugin
function phaseHtmlPlugin() {
  return {
    name: 'phase-html-transform',
    transformIndexHtml(html, ctx) {
      const phase = Number(process.env.VITE_PHASE) || 2;
      if (phase === 1) {
        return html
          .replace(/__APP_TITLE__/g, 'WebMagnetMedia | AI-Powered Lead Automation')
          .replace(/__APP_DESCRIPTION__/g, 'WebMagnetMedia helps businesses capture leads, automate follow-ups, and grow revenue with AI-powered automation.')
          .replace(/__APP_OG_IMAGE__/g, '/webmagnetmedia-logo.png')
          .replace(/__APP_FAVICON__/g, '/webmagnetmedia-favicon.png')
          .replace(/__APP_FAVICON_TYPE__/g, 'image/png');
      }
      // Phase 2 (default)
      return html
        .replace(/__APP_TITLE__/g, 'OneEmployee | Precision Lead Filtration')
        .replace(/__APP_DESCRIPTION__/g, 'OneEmployee helps businesses capture leads, engage customers, automate follow-ups, and grow revenue with AI-powered employees that work 24/7.')
        .replace(/__APP_OG_IMAGE__/g, '/One Employee.svg')
        .replace(/__APP_FAVICON__/g, '/hub_icon.svg')
        .replace(/__APP_FAVICON_TYPE__/g, 'image/svg+xml');
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    phaseHtmlPlugin(),
  ],

  server: {
    host: true,
    allowedHosts: true,
  },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.js'],
  },
})