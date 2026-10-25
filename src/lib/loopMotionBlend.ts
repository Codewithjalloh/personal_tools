import {
  drawLoopMotionTransform,
  loopMotionTransformContinuous,
  normalizeMotionSelection,
  type LoopMotionStyle,
} from './loopMotion'
import type { FitMode } from '../types'

export function drawMotionTimeline(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource & { naturalWidth?: number; naturalHeight?: number },
  width: number,
  height: number,
  fit: FitMode,
  elapsedSec: number,
  motions: LoopMotionStyle[],
  cycleDurationSec: number,
) {
  const tr = loopMotionTransformContinuous(elapsedSec, motions, cycleDurationSec)
  drawLoopMotionTransform(ctx, img, width, height, fit, tr)
}

export { loopMotionTransformContinuous, normalizeMotionSelection }
