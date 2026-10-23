import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ImageCompressPage } from './pages/ImageCompressPage'
import { SlideshowVideoPage } from './pages/SlideshowVideoPage'
import { ToolsHomePage } from './pages/ToolsHomePage'
import { YoutubeIdeasLayout } from './pages/youtubeIdeas/YoutubeIdeasLayout'
import { DashboardView } from './pages/youtubeIdeas/DashboardView'
import { GenerateView } from './pages/youtubeIdeas/GenerateView'
import { SavedView } from './pages/youtubeIdeas/SavedView'
import { SeriesView } from './pages/youtubeIdeas/SeriesView'
import { SettingsView } from './pages/youtubeIdeas/SettingsView'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ToolsHomePage />} />
        <Route path="/tools/slideshow-video" element={<SlideshowVideoPage />} />
        <Route path="/tools/image-compress" element={<ImageCompressPage />} />
        <Route path="/tools/youtube-ideas" element={<YoutubeIdeasLayout />}>
          <Route index element={<DashboardView />} />
          <Route path="generate" element={<GenerateView />} />
          <Route path="saved" element={<SavedView />} />
          <Route path="series" element={<SeriesView />} />
          <Route path="settings" element={<SettingsView />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
