import * as esbuild from 'esbuild'
import { readdir, unlink } from 'node:fs/promises'
import { join } from 'node:path'

const apiDir = 'api'
const entries = (await readdir(apiDir)).filter((f) => f.endsWith('.ts'))

if (entries.length === 0) {
  console.log('bundle-vercel-api: no api/*.ts entrypoints')
  process.exit(0)
}

for (const file of entries) {
  const base = file.replace(/\.ts$/, '')
  const outfile = join(apiDir, `${base}.js`)
  await esbuild.build({
    entryPoints: [join(apiDir, file)],
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

if (process.env.VERCEL === '1') {
  for (const file of entries) {
    await unlink(join(apiDir, file))
    console.log(`removed source ${file} (Vercel deploy)`)
  }
}
