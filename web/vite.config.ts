import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// `npm run dev:phone` serves over HTTPS on the local network: phones only send motion
// sensor data (for the tilting fuel) and location to secure pages. The API is proxied
// through the same origin, since a secure page may not call http://localhost:8080.
const phone = process.env.PHONE === '1'

export default defineConfig({
  plugins: [react(), tailwindcss(), ...(phone ? [basicSsl()] : [])],
  server: {
    port: 5173,
    host: phone ? true : undefined,
    proxy: phone ? { '/api': 'http://localhost:8080' } : undefined,
  },
})
