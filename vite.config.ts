import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { devApiPlugin } from './server/devApiPlugin'
import { loadLocalEnv } from './server/loadLocalEnv'

export default defineConfig(({ mode }) => {
  loadLocalEnv()
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
  envDir: process.cwd(),
  base: process.env.GITHUB_PAGES === 'true' ? '/personal_tools/' : '/',
  plugins: [react(), tailwindcss(), devApiPlugin()],
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
}
})
