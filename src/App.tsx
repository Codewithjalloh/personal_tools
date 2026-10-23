import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ImageCompressPage } from './pages/ImageCompressPage'
import { LoopAudioPage } from './pages/LoopAudioPage'
import { SlideshowVideoPage } from './pages/SlideshowVideoPage'
import { ToolsHomePage } from './pages/ToolsHomePage'
import { YoutubeIdeasLayout } from './pages/youtubeIdeas/YoutubeIdeasLayout'
import { DashboardView } from './pages/youtubeIdeas/DashboardView'
import { GenerateView } from './pages/youtubeIdeas/GenerateView'
import { SavedView } from './pages/youtubeIdeas/SavedView'
import { SavedIdeaDetailView } from './pages/youtubeIdeas/SavedIdeaDetailView'
import { SeriesView } from './pages/youtubeIdeas/SeriesView'
import { SettingsView } from './pages/youtubeIdeas/SettingsView'
import { PhilosophersView } from './pages/youtubeIdeas/PhilosophersView'
import { PhilosopherDetailView } from './pages/youtubeIdeas/PhilosopherDetailView'
import { TerminologyView } from './pages/youtubeIdeas/TerminologyView'
import { GreatAfricanGlobalView } from './pages/youtubeIdeas/GreatAfricanGlobalView'
import { GreatAfricanGlobalDetailView } from './pages/youtubeIdeas/GreatAfricanGlobalDetailView'

function ResearchStudioAliasRedirect() {
  const location = useLocation()
  const target = location.pathname.replace(/^\/tools\/research-studio/, '/tools/youtube-ideas')
  return <Navigate to={`${target}${location.search}${location.hash}`} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/tools/research-studio/*" element={<ResearchStudioAliasRedirect />} />
        <Route path="/" element={<ToolsHomePage />} />
        <Route path="/tools/slideshow-video" element={<SlideshowVideoPage />} />
        <Route path="/tools/loop-audio" element={<LoopAudioPage />} />
        <Route path="/tools/image-compress" element={<ImageCompressPage />} />
        <Route path="/tools/youtube-ideas" element={<YoutubeIdeasLayout />}>
          <Route index element={<DashboardView />} />
          <Route path="generate" element={<GenerateView />} />
          <Route path="saved" element={<SavedView />} />
          <Route path="saved/:ideaId" element={<SavedIdeaDetailView />} />
          <Route path="philosophers" element={<PhilosophersView />} />
          <Route path="philosophers/:philosopherId" element={<PhilosopherDetailView />} />
          <Route path="great-african-global" element={<GreatAfricanGlobalView />} />
          <Route path="great-african-global/:profileId" element={<GreatAfricanGlobalDetailView />} />
          <Route path="terminology" element={<TerminologyView />} />
          <Route path="series" element={<SeriesView />} />
          <Route path="settings" element={<SettingsView />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
