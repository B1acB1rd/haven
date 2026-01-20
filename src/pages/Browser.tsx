import { useEffect, useState } from 'react'
import { Bot, PanelLeft } from 'lucide-react'
import { useBrowser } from '../context/BrowserContext'
import BrowserTabStrip from '../components/browser/BrowserTabStrip'
import BrowserAddressBar from '../components/browser/BrowserAddressBar'
import BrowserWebView from '../components/browser/BrowserWebView'
import BrowserAISidebar from '../components/browser/BrowserAISidebar'
import BrowserVerticalTabs from '../components/browser/BrowserVerticalTabs'

type TabLayout = 'horizontal' | 'vertical'

export default function Browser() {
    const { tabs, activeTabId, createTab, closeTab, navigateTo, bookmarks } = useBrowser()
    const [aiSidebarOpen, setAiSidebarOpen] = useState(false)
    const [tabLayout, setTabLayout] = useState<TabLayout>(() => {
        // Load saved preference
        const saved = localStorage.getItem('haven-tab-layout')
        return (saved as TabLayout) || 'horizontal'
    })

    // Save layout preference
    useEffect(() => {
        localStorage.setItem('haven-tab-layout', tabLayout)
    }, [tabLayout])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+T - New tab
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault()
                createTab()
            }
            // Ctrl+W - Close tab
            if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
                e.preventDefault()
                if (activeTabId) closeTab(activeTabId)
            }
            // Ctrl+L - Focus address bar
            if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                e.preventDefault()
                document.getElementById('browser-url-input')?.focus()
            }
            // Ctrl+Shift+A - Toggle AI sidebar
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
                e.preventDefault()
                setAiSidebarOpen(prev => !prev)
            }
            // Ctrl+Shift+V - Toggle vertical tabs
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
                e.preventDefault()
                setTabLayout(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')
            }
            // F5 - Refresh
            if (e.key === 'F5') {
                e.preventDefault()
                const webview = document.querySelector('webview') as any
                webview?.reload()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [activeTabId, createTab, closeTab])

    return (
        <div className="h-full flex bg-dark-900">
            {/* Vertical Tabs Sidebar */}
            {tabLayout === 'vertical' && (
                <BrowserVerticalTabs
                    onCollapse={() => setTabLayout('horizontal')}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Tab Strip (only in horizontal mode) */}
                {tabLayout === 'horizontal' && (
                    <div className="flex items-center bg-dark-950 border-b border-dark-700">
                        {/* Vertical tabs toggle */}
                        <button
                            onClick={() => setTabLayout('vertical')}
                            className="p-2 ml-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
                            title="Switch to vertical tabs (Ctrl+Shift+V)"
                        >
                            <PanelLeft className="w-4 h-4" />
                        </button>
                        <div className="flex-1">
                            <BrowserTabStrip />
                        </div>
                        {/* AI Toggle Button */}
                        <button
                            onClick={() => setAiSidebarOpen(!aiSidebarOpen)}
                            className={`p-2 mx-2 rounded-lg transition-colors ${aiSidebarOpen
                                ? 'bg-accent-primary text-white'
                                : 'text-dark-400 hover:text-white hover:bg-dark-700'
                                }`}
                            title="Toggle AI Assistant (Ctrl+Shift+A)"
                        >
                            <Bot className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Address Bar (with AI button for vertical mode) */}
                <div className="flex items-center">
                    <div className="flex-1">
                        <BrowserAddressBar />
                    </div>
                    {tabLayout === 'vertical' && (
                        <button
                            onClick={() => setAiSidebarOpen(!aiSidebarOpen)}
                            className={`p-2 mr-3 rounded-lg transition-colors ${aiSidebarOpen
                                ? 'bg-accent-primary text-white'
                                : 'text-dark-400 hover:text-white hover:bg-dark-700'
                                }`}
                            title="Toggle AI Assistant (Ctrl+Shift+A)"
                        >
                            <Bot className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Bookmarks Bar */}
                <div className="flex items-center gap-1 px-3 py-1.5 bg-dark-850 border-b border-dark-700 overflow-x-auto scrollbar-hide">
                    {bookmarks.map((bookmark) => (
                        <button
                            key={bookmark.url}
                            onClick={() => navigateTo(bookmark.url)}
                            className="px-3 py-1 rounded-md text-xs text-dark-300 
                                hover:text-white hover:bg-dark-700 transition-colors 
                                flex-shrink-0 flex items-center gap-2"
                        >
                            <img
                                src={`https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=16`}
                                alt=""
                                className="w-3 h-3"
                                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                            />
                            {bookmark.name}
                        </button>
                    ))}
                </div>

                {/* Main Content Area - WebView + AI Sidebar */}
                <div className="flex-1 flex overflow-hidden">
                    {/* WebView Container */}
                    <div className="flex-1 relative bg-dark-950">
                        {tabs.map((tab) => (
                            <BrowserWebView
                                key={tab.id}
                                tab={tab}
                                isActive={tab.id === activeTabId}
                            />
                        ))}

                        {/* Empty state */}
                        {tabs.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold text-white mb-2">Haven Browser</h2>
                                    <p className="text-dark-400">Press Ctrl+T to open a new tab</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* AI Sidebar */}
                    <BrowserAISidebar
                        isOpen={aiSidebarOpen}
                        onClose={() => setAiSidebarOpen(false)}
                    />
                </div>
            </div>

            {/* CSS for loading animation */}
            <style>{`
                @keyframes browserLoading {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(100%); }
                    100% { transform: translateX(400%); }
                }
            `}</style>
        </div>
    )
}
