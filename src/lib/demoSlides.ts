export async function loadDemoImageFiles(): Promise<File[]> {
  const urls = ['/demo/1.png', '/demo/2.png', '/demo/3.png']
  const files: File[] = []
  for (let i = 0; i < urls.length; i++) {
    const res = await fetch(urls[i])
    if (!res.ok) throw new Error('Demo images missing — run from dev server')
    const blob = await res.blob()
    files.push(new File([blob], `demo-${i + 1}.png`, { type: 'image/png' }))
  }
  return files
}
