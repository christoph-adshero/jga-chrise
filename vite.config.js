import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_BASE erlaubt Hosting im Unterpfad (GitHub Pages) wie auch an der Root (Vercel/Netlify)
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  }
})
