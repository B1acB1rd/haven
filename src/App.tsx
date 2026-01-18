import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import ActiveDock from './components/layout/ActiveDock'
import FloatingTabBar from './components/layout/FloatingTabBar'
import Dashboard from './pages/Dashboard'

import AITools from './pages/AITools'
import SocialHub from './pages/SocialHub'
import MusicHub from './pages/MusicHub'
import VideoPlayer from './pages/VideoPlayer'
import Documents from './pages/Documents'
import Assets from './pages/Assets'
import Browser from './pages/Browser'
import Settings from './pages/Settings'
import AIAssistant from './components/assistant/AIAssistant'
import CommandPalette from './components/CommandPalette'
import QuickNotes from './components/QuickNotes'
import { ErrorBoundary } from './components/ErrorBoundary'
import { TabsProvider } from './context/TabsContext'
import { GeminiProvider } from './context/GeminiContext'
import { NavigationProvider, useNavigation } from './context/NavigationContext'
import { BrowserProvider } from './context/BrowserContext'
import { ToastProvider } from './components/Toast'
import { useDownloadNotifications } from './hooks/useDownloadNotifications'

// Browser page wrapped with its context
function BrowserWithProvider() {
    return (
        <BrowserProvider>
            <Browser />
        </BrowserProvider>
    )
}

function AppContent() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [assistantOpen, setAssistantOpen] = useState(false)
    const [paletteOpen, setPaletteOpen] = useState(false)
    const [notesOpen, setNotesOpen] = useState(false)

    // Listen for AI downloads and show toast
    useDownloadNotifications()

    // Get navigation functions
    const { navigateToIndex, goBack, goForward } = useNavigation()

    // Global keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // ⌘K or Ctrl+K - Open Command Palette
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setPaletteOpen(prev => !prev)
            }
            // ⌘\ or Ctrl+\ - Toggle AI Assistant
            if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
                e.preventDefault()
                setAssistantOpen(prev => !prev)
            }
            // ⌘N or Ctrl+N - Toggle Quick Notes
            if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
                e.preventDefault()
                setNotesOpen(prev => !prev)
            }
            // ⌘1-9 or Ctrl+1-9 - Quick switch to tab
            if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
                e.preventDefault()
                navigateToIndex(parseInt(e.key))
            }
            // ⌘[ or Ctrl+[ - Go back
            if ((e.metaKey || e.ctrlKey) && e.key === '[') {
                e.preventDefault()
                goBack()
            }
            // ⌘] or Ctrl+] - Go forward
            if ((e.metaKey || e.ctrlKey) && e.key === ']') {
                e.preventDefault()
                goForward()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [navigateToIndex, goBack, goForward])

    return (
        <ErrorBoundary>
            <GeminiProvider>
                <TabsProvider>
                    <div className="h-full w-full flex flex-col bg-dark-900">
                        {/* Custom Title Bar */}
                        <TopBar
                            onToggleAssistant={() => setAssistantOpen(!assistantOpen)}
                        />

                        {/* Floating Tab Bar */}
                        <FloatingTabBar />

                        {/* Main Layout */}
                        <div className="flex flex-1 overflow-hidden">
                            {/* Active Dock replaces Sidebar when collapsed */}
                            {sidebarCollapsed ? (
                                <ActiveDock onExpand={() => setSidebarCollapsed(false)} />
                            ) : (
                                <Sidebar
                                    collapsed={sidebarCollapsed}
                                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                                />
                            )}

                            {/* Main Content Area */}
                            <main className="flex-1 overflow-auto bg-dark-900 page-transition">
                                <Routes>
                                    <Route path="/" element={<Dashboard />} />

                                    <Route path="/ai-tools" element={<AITools />} />
                                    <Route path="/browser" element={<BrowserWithProvider />} />
                                    <Route path="/music" element={<MusicHub />} />
                                    <Route path="/videos" element={<VideoPlayer />} />
                                    <Route path="/documents" element={<Documents />} />
                                    <Route path="/social" element={<SocialHub />} />
                                    <Route path="/assets" element={<Assets />} />
                                    <Route path="/settings" element={<Settings />} />
                                </Routes>
                            </main>

                            {/* AI Assistant Overlay */}
                            <AIAssistant isOpen={assistantOpen} onClose={() => setAssistantOpen(false)} />
                        </div>

                        {/* Command Palette */}
                        <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />

                        {/* Quick Notes */}
                        <QuickNotes isOpen={notesOpen} onClose={() => setNotesOpen(false)} />
                    </div>
                </TabsProvider>
            </GeminiProvider>
        </ErrorBoundary>
    )
}

// App wrapper that provides ToastProvider and NavigationProvider (needed for hooks)
function App() {
    return (
        <ToastProvider>
            <NavigationProvider>
                <AppContent />
            </NavigationProvider>
        </ToastProvider>
    )
}

export default App
