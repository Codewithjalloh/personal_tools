import type { ExportProgress, ExportSettings, SlideItem } from '../types'
import { exportSlideshowVideo, type ExportOverrides } from './exportVideo'

export function exportSlideshowWebm(
  slides: SlideItem[],
  settings: ExportSettings,
  onProgress: (p: ExportProgress) => void,
  overrides?: ExportOverrides,
) {
  return exportSlideshowVideo(slides, { ...settings, format: 'webm' }, onProgress, overrides)
}
