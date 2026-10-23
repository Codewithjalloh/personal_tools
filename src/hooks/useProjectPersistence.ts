import { useEffect, useRef } from 'react'
import type { FitMode, MusicSettings, SlideItem, TitleCardSettings, TransitionType } from '../types'
import {
  defaultStoredProject,
  loadMusicFromStore,
  loadProjectMeta,
  loadSlideFromStore,
  saveProjectMeta,
  type StoredProject,
} from '../lib/projectStore'

type Args = {
  slides: SlideItem[]
  musicFile: File | null
  totalDurationSec: number
  resolutionIndex: number
  fit: FitMode
  format: 'mp4' | 'webm'
  intro: TitleCardSettings
  outro: TitleCardSettings
  crossfadeSec: number
  transitionType: TransitionType
  kenBurns: boolean
  music: MusicSettings
  exportFileName: string
  templateId: string
  onRestore: (payload: {
    slides: SlideItem[]
    musicFile: File | null
    meta: StoredProject
  }) => void
}

export function useProjectPersistence(args: Args) {
  const ready = useRef(false)

  useEffect(() => {
    ;(async () => {
      const meta = loadProjectMeta() ?? defaultStoredProject()
      const slides: SlideItem[] = []
      for (const s of meta.slides) {
        const loaded = await loadSlideFromStore(s)
        if (loaded) slides.push(loaded)
      }
      const musicFile = await loadMusicFromStore()
      args.onRestore({ slides, musicFile, meta })
      ready.current = true
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once
  }, [])

  useEffect(() => {
    if (!ready.current) return
    const t = window.setTimeout(() => {
      const meta: StoredProject = {
        version: 1,
        totalDurationSec: args.totalDurationSec,
        resolutionIndex: args.resolutionIndex,
        fit: args.fit,
        format: args.format,
        intro: args.intro,
        outro: args.outro,
        crossfadeSec: args.crossfadeSec,
        transitionType: args.transitionType,
        kenBurns: args.kenBurns,
        music: args.music,
        exportFileName: args.exportFileName,
        templateId: args.templateId,
        slides: args.slides.map((s) => ({
          id: s.id,
          name: s.name,
          durationSec: s.durationSec,
          mime: s.file.type,
        })),
        musicName: args.musicFile?.name ?? null,
      }
      saveProjectMeta(meta)
    }, 400)
    return () => clearTimeout(t)
  }, [
    args.slides,
    args.musicFile,
    args.totalDurationSec,
    args.resolutionIndex,
    args.fit,
    args.format,
    args.intro,
    args.outro,
    args.crossfadeSec,
    args.transitionType,
    args.kenBurns,
    args.music,
    args.exportFileName,
    args.templateId,
  ])
}
