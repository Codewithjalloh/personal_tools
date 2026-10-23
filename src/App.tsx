import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ImageCompressPage } from './pages/ImageCompressPage'
import { SlideshowVideoPage } from './pages/SlideshowVideoPage'
import { ToolsHomePage } from './pages/ToolsHomePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ToolsHomePage />} />
        <Route path="/tools/slideshow-video" element={<SlideshowVideoPage />} />
        <Route path="/tools/image-compress" element={<ImageCompressPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
