import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** Load `.env.local` into process.env (dev). Re-reads so edits apply without restarting Vite. */
export function loadLocalEnv(): void {
  const path = resolve(process.cwd(), '.env.local')
  if (!existsSync(path)) return

  const content = readFileSync(path, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}
