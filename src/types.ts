export type SlideItem = {
  id: string
  file: File
  url: string
  name: string
  durationSec: number | null
}

export type FitMode = 'contain' | 'cover'

export type TextPosition = 'top' | 'center' | 'bottom'

export type TextAnimation = 'none' | 'fade-up' | 'fade' | 'scale-in' | 'typewriter'

export type TitleFontId = 'system' | 'serif' | 'mono' | 'rounded' | 'condensed'

export type TransitionType = 'fade' | 'slideleft' | 'slideright' | 'wipeleft'

export type TitleCardSettings = {
  text: string
  color: string
  durationSec: number
  fontScale: number
  position: TextPosition
  showBar: boolean
  animation: TextAnimation
  fontId: TitleFontId
}

export type MusicSettings = {
  volume: number
  fadeInSec: number
  fadeOutSec: number
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
  transitionType: TransitionType
  kenBurns: boolean
  fastDraft: boolean
  exportFileName: string
  musicFile: File | null
  music: MusicSettings
}

export type ExportPhase = 'loading-encoder' | 'preparing' | 'encoding'

export type ExportProgress = {
  phase: ExportPhase
  progress: number
}

export const DEFAULT_MUSIC: MusicSettings = {
  volume: 0.85,
  fadeInSec: 1,
  fadeOutSec: 2,
}

export const DEFAULT_TITLE_CARD: TitleCardSettings = {
  text: '',
  color: '#ffffff',
  durationSec: 10,
  fontScale: 1,
  position: 'center',
  showBar: false,
  animation: 'none',
  fontId: 'system',
}
