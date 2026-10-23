import type { ExportProgress, ExportSettings, SlideItem } from '../types'
import { exportSlideshowVideo } from './exportVideo'

export function exportSlideshowMp4(
  slides: SlideItem[],
  settings: ExportSettings,
  onProgress: (p: ExportProgress) => void,
) {
  return exportSlideshowVideo(slides, { ...settings, format: 'mp4' }, onProgress)
}
