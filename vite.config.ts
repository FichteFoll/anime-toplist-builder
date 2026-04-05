import { fileURLToPath, URL } from 'node:url'
import { execSync } from 'node:child_process'

import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const buildTime = new Date().toISOString()
  let commitHash = 'unknown'

  try {
    commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    // Keep the build working outside a git checkout.
  }

  return {
    base: env.VITE_BASE_PATH || '/',
    define: {
      __BUILD_COMMIT__: JSON.stringify(commitHash),
      __BUILD_TIME__: JSON.stringify(buildTime),
    },
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
