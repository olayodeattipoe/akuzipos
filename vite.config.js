import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig(({ command }) => {
  const config = {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }

  if (command === 'serve') {
    // Development-specific settings
    config.server = {
      host: '192.168.0.101',
      port: 5173,
      strictPort: true,
      cors: true,
      hmr: {
        host: '192.168.0.101',
        clientPort: 5173,
        protocol: 'ws'
      },
      watch: {
        usePolling: true
      }
    }
  }

  return config
})
