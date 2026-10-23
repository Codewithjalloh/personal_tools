import type { ExportProgress, ExportSettings, SlideItem } from '../types'
import { exportSlideshowVideo } from './exportVideo'

export function exportSlideshowWebm(
  slides: SlideItem[],
  settings: ExportSettings,
  onProgress: (p: ExportProgress) => void,
) {
  return exportSlideshowVideo(slides, { ...settings, format: 'webm' }, onProgress)
}
