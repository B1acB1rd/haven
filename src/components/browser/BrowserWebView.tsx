import { useEffect, useRef } from 'react'
import { useBrowser, BrowserTab } from '../../context/BrowserContext'

interface BrowserWebViewProps {
    tab: BrowserTab
    isActive: boolean
}

export default function BrowserWebView({ tab, isActive }: BrowserWebViewProps) {
    const webviewRef = useRef<any>(null)
    const { updateTab, registerWebview, addToHistory } = useBrowser()

    useEffect(() => {
        const webview = webviewRef.current
        if (!webview) return

        // Register webview for navigation control
        registerWebview(tab.id, webview)

        // Event handlers
        const handleStartLoading = () => {
            updateTab(tab.id, { isLoading: true })
        }

        const handleStopLoading = () => {
            updateTab(tab.id, {
                isLoading: false,
                canGoBack: webview.canGoBack(),
                canGoForward: webview.canGoForward(),
            })
        }

        const handleNavigate = (e: any) => {
            const newUrl = e.url
            updateTab(tab.id, {
                url: newUrl,
                isSecure: newUrl.startsWith('https://'),
                canGoBack: webview.canGoBack(),
                canGoForward: webview.canGoForward(),
            })
            addToHistory(newUrl)
        }

        const handleTitleUpdate = (e: any) => {
            updateTab(tab.id, { title: e.title || 'New Tab' })
        }

        const handleFaviconUpdate = (e: any) => {
            if (e.favicons && e.favicons.length > 0) {
                updateTab(tab.id, { favicon: e.favicons[0] })
            }
        }

        const handleError = (e: any) => {
            console.log('Webview error:', e.errorDescription || e.errorCode)
            updateTab(tab.id, { isLoading: false })
        }

        const handleFailLoad = (e: any) => {
            // Ignore ERR_ABORTED (-3) as it's often navigation cancellation
            if (e.errorCode !== -3) {
                console.log('Page load failed:', e.errorDescription)
            }
            updateTab(tab.id, { isLoading: false })
        }

        // Attach listeners
        webview.addEventListener('did-start-loading', handleStartLoading)
        webview.addEventListener('did-stop-loading', handleStopLoading)
        webview.addEventListener('did-navigate', handleNavigate)
        webview.addEventListener('did-navigate-in-page', handleNavigate)
        webview.addEventListener('page-title-updated', handleTitleUpdate)
        webview.addEventListener('page-favicon-updated', handleFaviconUpdate)
        webview.addEventListener('did-fail-load', handleFailLoad)
        webview.addEventListener('did-fail-provisional-load', handleError)

        return () => {
            webview.removeEventListener('did-start-loading', handleStartLoading)
            webview.removeEventListener('did-stop-loading', handleStopLoading)
            webview.removeEventListener('did-navigate', handleNavigate)
            webview.removeEventListener('did-navigate-in-page', handleNavigate)
            webview.removeEventListener('page-title-updated', handleTitleUpdate)
            webview.removeEventListener('page-favicon-updated', handleFaviconUpdate)
            webview.removeEventListener('did-fail-load', handleFailLoad)
            webview.removeEventListener('did-fail-provisional-load', handleError)
        }
    }, [tab.id, updateTab, registerWebview, addToHistory])

    return (
        <div
            className={`absolute inset-0 ${isActive ? 'z-10' : 'z-0 invisible'}`}
        >
            <webview
                ref={webviewRef}
                src={tab.url}
                partition="persist:haven-browser"
                className="w-full h-full"
                // @ts-ignore - webview attributes
                allowpopups="true"
            />

            {/* Loading indicator */}
            {tab.isLoading && isActive && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-dark-700 overflow-hidden z-20">
                    <div
                        className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary"
                        style={{
                            width: '30%',
                            animation: 'browserLoading 1s ease-in-out infinite'
                        }}
                    />
                </div>
            )}
        </div>
    )
}
