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
      host: true, // This allows access from any IP
      port: 5173,
      strictPort: true,
      cors: true
    }
  }

  return config
})
