import type { FitMode, MusicSettings, SlideItem, TitleCardSettings, TransitionType } from '../types'
import { DEFAULT_MUSIC, DEFAULT_TITLE_CARD } from '../types'

const DB_NAME = 'ImageSliderVideo'
const STORE = 'files'
const LS_KEY = 'imageslider-project-v1'

export type StoredSlideMeta = {
  id: string
  name: string
  durationSec: number | null
  mime: string
}

export type StoredProject = {
  version: 1
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
  slides: StoredSlideMeta[]
  musicName: string | null
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function putBlob(key: string, blob: Blob) {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(blob, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

async function getBlob(key: string): Promise<Blob | null> {
  const db = await openDb()
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(key)
    req.onsuccess = () => resolve(req.result as Blob | undefined)
    req.onerror = () => reject(req.error)
  })
  db.close()
  return blob ?? null
}

async function deleteKey(key: string) {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function clearProjectFiles(keys: string[]) {
  await Promise.all(keys.map((k) => deleteKey(k)))
}

export function loadProjectMeta(): StoredProject | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredProject
  } catch {
    return null
  }
}

export function saveProjectMeta(meta: StoredProject) {
  localStorage.setItem(LS_KEY, JSON.stringify(meta))
}

export async function persistSlideFile(slide: SlideItem) {
  await putBlob(`slide:${slide.id}`, slide.file)
}

export async function persistMusicFile(file: File) {
  await putBlob('music', file)
}

export async function saveMusicToProject(file: File | null) {
  if (file) await persistMusicFile(file)
  else await deleteKey('music')
}

export async function loadSlideFromStore(meta: StoredSlideMeta): Promise<SlideItem | null> {
  const blob = await getBlob(`slide:${meta.id}`)
  if (!blob) return null
  const file = new File([blob], meta.name, { type: meta.mime })
  return {
    id: meta.id,
    file,
    url: URL.createObjectURL(file),
    name: meta.name,
    durationSec: meta.durationSec,
  }
}

export async function loadMusicFromStore(): Promise<File | null> {
  const blob = await getBlob('music')
  if (!blob) return null
  const meta = loadProjectMeta()
  return new File([blob], meta?.musicName ?? 'music.mp3', { type: blob.type })
}

export function defaultStoredProject(): StoredProject {
  return {
    version: 1,
    totalDurationSec: 60,
    resolutionIndex: 1,
    fit: 'contain',
    format: 'mp4',
    intro: { ...DEFAULT_TITLE_CARD },
    outro: { ...DEFAULT_TITLE_CARD },
    crossfadeSec: 0.4,
    transitionType: 'fade',
    kenBurns: false,
    music: { ...DEFAULT_MUSIC },
    exportFileName: 'slideshow',
    templateId: 'custom',
    slides: [],
    musicName: null,
  }
}
