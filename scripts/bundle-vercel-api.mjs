import * as esbuild from 'esbuild'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

const handlersDir = 'api-handlers'
const apiDir = 'api'
const entries = (await readdir(handlersDir)).filter(
  (f) => f.endsWith('.ts') && f !== 'vercelConfig.ts',
)

if (entries.length === 0) {
  console.log('bundle-vercel-api: no api-handlers/*.ts entrypoints')
  process.exit(0)
}

for (const file of entries) {
  const base = file.replace(/\.ts$/, '')
  const outfile = join(apiDir, `${base}.js`)
  await esbuild.build({
    entryPoints: [join(handlersDir, file)],
    bundle: true,
    platform: 'node',
    target: 'node24',
    format: 'cjs',
    outfile,
    sourcemap: true,
    logLevel: 'info',
    mainFields: ['module', 'main'],
  })
  console.log(`bundled ${file} → ${outfile}`)
}
