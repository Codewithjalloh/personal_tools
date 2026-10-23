import type { TitleFontId } from '../types'

export const TITLE_FONTS: { id: TitleFontId; label: string; stack: string }[] = [
  { id: 'system', label: 'System', stack: 'system-ui, -apple-system, Segoe UI, sans-serif' },
  { id: 'serif', label: 'Classic serif', stack: 'Georgia, "Times New Roman", serif' },
  { id: 'mono', label: 'Mono', stack: 'ui-monospace, "SF Mono", Menlo, monospace' },
  { id: 'rounded', label: 'Rounded', stack: '"Trebuchet MS", "Segoe UI", sans-serif' },
  { id: 'condensed', label: 'Condensed', stack: '"Arial Narrow", Arial, sans-serif' },
]

export function fontStackForId(id: TitleFontId): string {
  return TITLE_FONTS.find((f) => f.id === id)?.stack ?? TITLE_FONTS[0].stack
}
