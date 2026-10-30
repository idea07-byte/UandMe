import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom plugin to display Render cloud deployment links in terminal on startup
function renderLinksPlugin() {
  return {
    name: 'render-links-plugin',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        setTimeout(() => {
          console.log('\x1b[32m%s\x1b[0m', '  ➜  Render App:     https://uandme-frontend.onrender.com');
          console.log('\x1b[36m%s\x1b[0m', '  ➜  Render Backend: https://uandme-8vka.onrender.com\n');
        }, 100);
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), renderLinksPlugin()],
})
