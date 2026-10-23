export type SlideItem = {
  id: string
  file: File
  url: string
  name: string
  /** Seconds for this slide; null = auto-split remaining body time */
  durationSec: number | null
}

export type FitMode = 'contain' | 'cover'

export type TextPosition = 'top' | 'center' | 'bottom'

export type TitleCardSettings = {
  text: string
  color: string
  durationSec: number
  fontScale: number
  position: TextPosition
  showBar: boolean
}

export type ExportSettings = {
  totalDurationSec: number
  width: number
  height: number
  fit: FitMode
  format: 'mp4' | 'webm'
  intro: TitleCardSettings
  outro: TitleCardSettings
  crossfadeSec: number
  kenBurns: boolean
  fastDraft: boolean
  exportFileName: string
  musicFile: File | null
}

export type ExportPhase = 'loading-encoder' | 'preparing' | 'encoding'

export type ExportProgress = {
  phase: ExportPhase
  progress: number
}

export const DEFAULT_TITLE_CARD: TitleCardSettings = {
  text: '',
  color: '#ffffff',
  durationSec: 10,
  fontScale: 1,
  position: 'center',
  showBar: false,
}
