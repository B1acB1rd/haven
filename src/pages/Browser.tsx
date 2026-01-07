import { useState, useRef, useEffect } from 'react'
import {
    Globe,
    ArrowLeft,
    ArrowRight,
    RotateCw,
    Home,
    Search,
    ExternalLink,
    Lock,
    Shield
} from 'lucide-react'

const BOOKMARKS = [
    { name: 'Google', url: 'https://google.com' },
    { name: 'YouTube', url: 'https://youtube.com' },
    { name: 'GitHub', url: 'https://github.com' },
    { name: 'Reddit', url: 'https://reddit.com' },
    { name: 'Wikipedia', url: 'https://wikipedia.org' },
    { name: 'Twitter', url: 'https://x.com' },
]

export default function Browser() {
    const [url, setUrl] = useState('https://google.com')
    const [inputUrl, setInputUrl] = useState('https://google.com')
    const [isLoading, setIsLoading] = useState(false)
    const [isSecure, setIsSecure] = useState(true)
    const [pageTitle, setPageTitle] = useState('Google')
    const webviewRef = useRef<any>(null)

    useEffect(() => {
        const webview = webviewRef.current
        if (!webview) return

        const handleStartLoading = () => setIsLoading(true)
        const handleStopLoading = () => setIsLoading(false)
        const handleNavigate = (e: any) => {
            setInputUrl(e.url)
            setUrl(e.url)
            setIsSecure(e.url.startsWith('https://'))
        }
        const handleTitleUpdate = (e: any) => {
            setPageTitle(e.title || 'Haven Browser')
        }
        // Handle webview errors gracefully
        const handleError = (e: any) => {
            console.log('Webview error (handled):', e.errorDescription || e.errorCode)
            setIsLoading(false)
        }
        const handleFailLoad = (e: any) => {
            // Ignore ERR_ABORTED (-3) as it's often just navigation cancellation
            if (e.errorCode !== -3) {
                console.log('Page load failed:', e.errorDescription)
            }
            setIsLoading(false)
        }

        webview.addEventListener('did-start-loading', handleStartLoading)
        webview.addEventListener('did-stop-loading', handleStopLoading)
        webview.addEventListener('did-navigate', handleNavigate)
        webview.addEventListener('did-navigate-in-page', handleNavigate)
        webview.addEventListener('page-title-updated', handleTitleUpdate)
        webview.addEventListener('did-fail-load', handleFailLoad)
        webview.addEventListener('did-fail-provisional-load', handleError)

        return () => {
            webview.removeEventListener('did-start-loading', handleStartLoading)
            webview.removeEventListener('did-stop-loading', handleStopLoading)
            webview.removeEventListener('did-navigate', handleNavigate)
            webview.removeEventListener('did-navigate-in-page', handleNavigate)
            webview.removeEventListener('page-title-updated', handleTitleUpdate)
            webview.removeEventListener('did-fail-load', handleFailLoad)
            webview.removeEventListener('did-fail-provisional-load', handleError)
        }
    }, [])

    const navigate = (newUrl: string) => {
        let finalUrl = newUrl.trim()

        // Add protocol if missing
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            // Check if it looks like a URL
            if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
                finalUrl = 'https://' + finalUrl
            } else {
                // Treat as search query
                finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}`
            }
        }

        setUrl(finalUrl)
        setInputUrl(finalUrl)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            navigate(inputUrl)
        }
    }

    const goBack = () => webviewRef.current?.goBack()
    const goForward = () => webviewRef.current?.goForward()
    const refresh = () => webviewRef.current?.reload()
    const goHome = () => navigate('https://google.com')

    const openExternal = () => {
        window.open(url, '_blank')
    }

    return (
        <div className="h-full flex flex-col bg-dark-900">
            {/* Browser Chrome */}
            <div className="flex-shrink-0 p-3 border-b border-dark-700 bg-dark-800">
                {/* Navigation Bar */}
                <div className="flex items-center gap-2">
                    {/* Nav Buttons */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={goBack}
                            className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
                            title="Back"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={goForward}
                            className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
                            title="Forward"
                        >
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={refresh}
                            className={`p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors
                                ${isLoading ? 'animate-spin' : ''}`}
                            title="Refresh"
                        >
                            <RotateCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={goHome}
                            className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
                            title="Home"
                        >
                            <Home className="w-4 h-4" />
                        </button>
                    </div>

                    {/* URL Bar */}
                    <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-dark-900 border border-dark-600">
                        {isSecure ? (
                            <Lock className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                            <Shield className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        )}
                        <input
                            type="text"
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search or enter URL..."
                            className="flex-1 bg-transparent text-white placeholder-dark-500 focus:outline-none text-sm"
                        />
                        <button
                            onClick={() => navigate(inputUrl)}
                            className="p-1 text-dark-400 hover:text-white"
                        >
                            <Search className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={openExternal}
                            className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
                            title="Open in External Browser"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Bookmarks Bar */}
                <div className="flex items-center gap-1 mt-2 overflow-x-auto">
                    {BOOKMARKS.map((bookmark) => (
                        <button
                            key={bookmark.url}
                            onClick={() => navigate(bookmark.url)}
                            className="px-3 py-1.5 rounded-lg text-xs text-dark-300 
                                     hover:text-white hover:bg-dark-700 transition-colors flex-shrink-0"
                        >
                            {bookmark.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* WebView */}
            <div className="flex-1 relative">
                <webview
                    ref={webviewRef}
                    src={url}
                    partition="persist:browser"
                    className="w-full h-full"
                // @ts-ignore - webview attributes
                />

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-dark-700 overflow-hidden">
                        <div className="h-full w-1/3 bg-accent-primary animate-pulse rounded-r"
                            style={{ animation: 'loading 1s ease-in-out infinite' }} />
                    </div>
                )}
            </div>

            {/* Status Bar */}
            <div className="flex-shrink-0 px-3 py-1.5 border-t border-dark-700 bg-dark-800 flex items-center justify-between text-xs text-dark-500">
                <div className="flex items-center gap-2">
                    <Globe className="w-3 h-3" />
                    <span className="truncate max-w-md">{pageTitle}</span>
                </div>
                <div className="flex items-center gap-2">
                    {isSecure && <span className="text-green-500">Secure</span>}
                </div>
            </div>

            <style>{`
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(400%); }
                }
            `}</style>
        </div>
    )
}
