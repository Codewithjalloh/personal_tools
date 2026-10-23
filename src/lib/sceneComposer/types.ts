import type { FitMode, TitleFontId } from '../../types'

export type VisualClipKind = 'image' | 'video'

export type VisualClip = {
  id: string
  kind: VisualClipKind
  file: File
  url: string
  name: string
  startSec: number
  durationSec: number
  loop: boolean
  sourceDurationSec: number | null
}

export type TextLayer = {
  id: string
  text: string
  /** Center anchor, 0–1 across canvas width */
  x: number
  /** Center anchor, 0–1 across canvas height */
  y: number
  fontScale: number
  color: string
  showBar: boolean
  fontId: TitleFontId
  startSec: number
  endSec: number
}

export type SceneDurationMode = 'audio' | 'timeline'

export type SceneComposerSettings = {
  width: number
  height: number
  fit: FitMode
  durationMode: SceneDurationMode
  fastDraft: boolean
  exportFileName: string
}

export const DEFAULT_SCENE_SETTINGS: SceneComposerSettings = {
  width: 1920,
  height: 1080,
  fit: 'cover',
  durationMode: 'audio',
  fastDraft: false,
  exportFileName: 'scene',
}

export const RESOLUTION_PRESETS: { label: string; width: number; height: number }[] = [
  { label: '1080p', width: 1920, height: 1080 },
  { label: '720p', width: 1280, height: 720 },
  { label: 'Shorts 9:16', width: 1080, height: 1920 },
]
