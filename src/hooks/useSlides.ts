import { useCallback, useEffect, useRef, useState } from 'react'
import type { SlideItem } from '../types'
import { persistSlideFile } from '../lib/projectStore'
import { resizeImageFile } from '../lib/resizeImage'

function makeId() {
  return crypto.randomUUID()
}

export function useSlides() {
  const [slides, setSlides] = useState<SlideItem[]>([])
  const [adding, setAdding] = useState(false)

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (imageFiles.length === 0) return

    setAdding(true)
    try {
      const next: SlideItem[] = []
      for (const raw of imageFiles) {
        const file = await resizeImageFile(raw)
        const item: SlideItem = {
          id: makeId(),
          file,
          url: URL.createObjectURL(file),
          name: file.name,
          durationSec: null,
        }
        await persistSlideFile(item)
        next.push(item)
      }
      setSlides((prev) => [...prev, ...next])
    } finally {
      setAdding(false)
    }
  }, [])

  const removeSlide = useCallback((id: string) => {
    setSlides((prev) => {
      const item = prev.find((s) => s.id === id)
      if (item) URL.revokeObjectURL(item.url)
      return prev.filter((s) => s.id !== id)
    })
  }, [])

  const moveSlide = useCallback((from: number, to: number) => {
    setSlides((prev) => {
      if (to < 0 || to >= prev.length || from === to) return prev
      const copy = [...prev]
      const [item] = copy.splice(from, 1)
      copy.splice(to, 0, item)
      return copy
    })
  }, [])

  const setSlideDuration = useCallback((id: string, durationSec: number | null) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, durationSec } : s)),
    )
  }, [])

  const clearAll = useCallback(() => {
    setSlides((prev) => {
      prev.forEach((s) => URL.revokeObjectURL(s.url))
      return []
    })
  }, [])

  const replaceSlides = useCallback((next: SlideItem[]) => {
    setSlides((prev) => {
      prev.forEach((s) => URL.revokeObjectURL(s.url))
      return next
    })
  }, [])

  const slidesRef = useRef(slides)
  slidesRef.current = slides

  useEffect(() => {
    return () => {
      slidesRef.current.forEach((s) => URL.revokeObjectURL(s.url))
    }
  }, [])

  return {
    slides,
    adding,
    addFiles,
    removeSlide,
    moveSlide,
    setSlideDuration,
    clearAll,
    replaceSlides,
    setSlides,
  }
}
