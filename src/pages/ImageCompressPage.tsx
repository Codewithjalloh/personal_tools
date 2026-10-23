import { useCallback, useState } from 'react'
import JSZip from 'jszip'
import { ToolPageHeader } from '../components/layout/ToolPageHeader'

type Item = { id: string; file: File; url: string; out?: Blob }

function compressImage(file: File, quality: number, maxEdge: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.naturalWidth * scale)
      canvas.height = Math.round(img.naturalHeight * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas unsupported'))
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Compress failed'))),
        mime,
        quality,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Load failed'))
    }
    img.src = url
  })
}

export function ImageCompressPage() {
  const [items, setItems] = useState<Item[]>([])
  const [quality, setQuality] = useState(0.82)
  const [maxEdge, setMaxEdge] = useState(1920)
  const [busy, setBusy] = useState(false)

  const addFiles = (files: FileList | File[]) => {
    const imgs = Array.from(files).filter((f) => f.type.startsWith('image/'))
    setItems((prev) => [
      ...prev,
      ...imgs.map((file) => ({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
      })),
    ])
  }

  const compressAll = useCallback(async () => {
    setBusy(true)
    try {
      const next: Item[] = []
      for (const item of items) {
        const out = await compressImage(item.file, quality, maxEdge)
        next.push({ ...item, out })
      }
      setItems(next)
    } finally {
      setBusy(false)
    }
  }, [items, quality, maxEdge])

  const downloadZip = async () => {
    const zip = new JSZip()
    for (const item of items) {
      if (!item.out) continue
      const ext = item.file.name.split('.').pop() ?? 'jpg'
      zip.file(`compressed-${item.file.name.replace(/\.[^.]+$/, '')}.${ext}`, item.out)
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'compressed-images.zip'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6">
      <ToolPageHeader
        title="Image Compress"
        description="Shrink JPG/PNG files in your browser — adjust quality and max size, then download individually or as ZIP."
      />

      <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/40 py-12 hover:border-zinc-500">
        <span className="text-zinc-200">Drop images or click to browse</span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </label>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-zinc-400">
          Quality ({Math.round(quality * 100)}%)
          <input
            type="range"
            min={0.4}
            max={1}
            step={0.02}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>
        <label className="text-sm text-zinc-400">
          Max edge (px)
          <input
            type="number"
            min={640}
            max={4096}
            value={maxEdge}
            onChange={(e) => setMaxEdge(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={items.length === 0 || busy}
          onClick={() => void compressAll()}
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? 'Compressing…' : 'Compress all'}
        </button>
        <button
          type="button"
          disabled={!items.some((i) => i.out)}
          onClick={() => void downloadZip()}
          className="rounded-xl bg-zinc-800 px-4 py-2 text-sm text-zinc-200 disabled:opacity-40"
        >
          Download ZIP
        </button>
      </div>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
            <img src={item.url} alt="" className="h-32 w-full rounded-lg object-cover" />
            <p className="mt-2 truncate text-xs text-zinc-500">{item.file.name}</p>
            <p className="text-xs text-zinc-400">
              {(item.file.size / 1024).toFixed(0)} KB
              {item.out && ` → ${(item.out.size / 1024).toFixed(0)} KB`}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
