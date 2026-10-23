import type { ExportProgress, ExportSettings, SlideItem } from '../types'
import { exportSlideshowVideo, type ExportOverrides } from './exportVideo'

export function exportSlideshowMp4(
  slides: SlideItem[],
  settings: ExportSettings,
  onProgress: (p: ExportProgress) => void,
  overrides?: ExportOverrides,
) {
  return exportSlideshowVideo(slides, { ...settings, format: 'mp4' }, onProgress, overrides)
}
