import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// บ้านไพบูลย์ = เว็บที่ 7 → พอร์ต 3007
export default defineConfig({
  plugins: [react()],
  server: { port: 3007, strictPort: true },
  preview: { port: 3007, strictPort: true },
})
