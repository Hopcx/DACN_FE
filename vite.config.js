import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import process from 'node:process'

function devHttps(command) {
  if (command !== 'serve') return undefined
  const path = process.env.DACN_DEV_PFX_PATH
  if (!path) throw new Error('Set DACN_DEV_PFX_PATH for HTTPS development')
  return { pfx: readFileSync(path), passphrase: process.env.DACN_DEV_PFX_PASSWORD }
}

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  server: {
    https: devHttps(command),
    proxy: {
      '/web': {
        target: 'https://localhost:7242',
        changeOrigin: true,
        secure: false, // Trust the API development certificate; cookie Secure remains enabled.
      },
    },
  },
}))
