const MAX_EDGE = 1920

export async function resizeImageFile(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file

  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Failed to load image'))
      el.src = url
    })

    const { naturalWidth: w, naturalHeight: h } = img
    if (Math.max(w, h) <= MAX_EDGE) return file

    const scale = MAX_EDGE / Math.max(w, h)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w * scale)
    canvas.height = Math.round(h * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Resize failed'))),
        file.type === 'image/png' ? 'image/png' : 'image/jpeg',
        0.92,
      )
    })

    return new File([blob], file.name, { type: blob.type })
  } finally {
    URL.revokeObjectURL(url)
  }
}
