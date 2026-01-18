import { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react'

export interface BrowserTab {
    id: string
    url: string
    title: string
    favicon?: string
    isLoading: boolean
    isSecure: boolean
    canGoBack: boolean
    canGoForward: boolean
}

interface BrowserContextType {
    tabs: BrowserTab[]
    activeTabId: string | null
    activeTab: BrowserTab | null

    // Tab management
    createTab: (url?: string) => string
    closeTab: (id: string) => void
    setActiveTab: (id: string) => void
    updateTab: (id: string, updates: Partial<BrowserTab>) => void
    duplicateTab: (id: string) => void

    // Navigation
    navigateTo: (url: string) => void
    goBack: () => void
    goForward: () => void
    refresh: () => void
    goHome: () => void

    // History
    history: string[]
    addToHistory: (url: string) => void

    // Bookmarks
    bookmarks: { name: string; url: string; favicon?: string }[]
    addBookmark: (name: string, url: string, favicon?: string) => void
    removeBookmark: (url: string) => void
    isBookmarked: (url: string) => boolean

    // Webview refs (for navigation)
    registerWebview: (tabId: string, webview: any) => void
    getWebview: (tabId: string) => any
}

const BrowserContext = createContext<BrowserContextType | undefined>(undefined)

const STORAGE_KEY_HISTORY = 'haven-browser-history'
const STORAGE_KEY_BOOKMARKS = 'haven-browser-bookmarks'
const DEFAULT_HOME = 'https://google.com'
const MAX_HISTORY = 100

// Generate unique tab ID
const generateTabId = () => `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export function BrowserProvider({ children }: { children: ReactNode }) {
    // Webview references for navigation control
    const webviewRefs = useRef<Map<string, any>>(new Map())

    // Tab state
    const [tabs, setTabs] = useState<BrowserTab[]>([
        {
            id: generateTabId(),
            url: DEFAULT_HOME,
            title: 'New Tab',
            isLoading: false,
            isSecure: true,
            canGoBack: false,
            canGoForward: false,
        }
    ])
    const [activeTabId, setActiveTabId] = useState<string | null>(tabs[0]?.id || null)

    // History (persisted)
    const [history, setHistory] = useState<string[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY_HISTORY)
            return stored ? JSON.parse(stored) : []
        } catch {
            return []
        }
    })

    // Bookmarks (persisted)
    const [bookmarks, setBookmarks] = useState<{ name: string; url: string; favicon?: string }[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY_BOOKMARKS)
            return stored ? JSON.parse(stored) : [
                { name: 'Google', url: 'https://google.com' },
                { name: 'YouTube', url: 'https://youtube.com' },
                { name: 'GitHub', url: 'https://github.com' },
            ]
        } catch {
            return []
        }
    })

    // Get active tab
    const activeTab = tabs.find(t => t.id === activeTabId) || null

    // Persist history
    const saveHistory = useCallback((newHistory: string[]) => {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(newHistory.slice(0, MAX_HISTORY)))
    }, [])

    // Persist bookmarks
    const saveBookmarks = useCallback((newBookmarks: typeof bookmarks) => {
        localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(newBookmarks))
    }, [])

    // Tab management
    const createTab = useCallback((url: string = DEFAULT_HOME) => {
        const newTab: BrowserTab = {
            id: generateTabId(),
            url,
            title: 'New Tab',
            isLoading: true,
            isSecure: url.startsWith('https://'),
            canGoBack: false,
            canGoForward: false,
        }
        setTabs(prev => [...prev, newTab])
        setActiveTabId(newTab.id)
        return newTab.id
    }, [])

    const closeTab = useCallback((id: string) => {
        setTabs(prev => {
            const newTabs = prev.filter(t => t.id !== id)
            // If closing active tab, switch to adjacent tab
            if (activeTabId === id && newTabs.length > 0) {
                const closedIndex = prev.findIndex(t => t.id === id)
                const newActiveIndex = Math.min(closedIndex, newTabs.length - 1)
                setActiveTabId(newTabs[newActiveIndex].id)
            }
            // If no tabs left, create a new one
            if (newTabs.length === 0) {
                const newTab: BrowserTab = {
                    id: generateTabId(),
                    url: DEFAULT_HOME,
                    title: 'New Tab',
                    isLoading: false,
                    isSecure: true,
                    canGoBack: false,
                    canGoForward: false,
                }
                setActiveTabId(newTab.id)
                return [newTab]
            }
            return newTabs
        })
        // Clean up webview ref
        webviewRefs.current.delete(id)
    }, [activeTabId])

    const setActiveTab = useCallback((id: string) => {
        setActiveTabId(id)
    }, [])

    const updateTab = useCallback((id: string, updates: Partial<BrowserTab>) => {
        setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    }, [])

    const duplicateTab = useCallback((id: string) => {
        const tab = tabs.find(t => t.id === id)
        if (tab) {
            createTab(tab.url)
        }
    }, [tabs, createTab])

    // Navigation
    const navigateTo = useCallback((url: string) => {
        if (!activeTabId) return

        let finalUrl = url.trim()

        // Add protocol if missing
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
                finalUrl = 'https://' + finalUrl
            } else {
                // Treat as search query
                finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}`
            }
        }

        updateTab(activeTabId, {
            url: finalUrl,
            isLoading: true,
            isSecure: finalUrl.startsWith('https://')
        })

        // Navigate the webview
        const webview = webviewRefs.current.get(activeTabId)
        if (webview) {
            webview.src = finalUrl
        }
    }, [activeTabId, updateTab])

    const goBack = useCallback(() => {
        if (!activeTabId) return
        const webview = webviewRefs.current.get(activeTabId)
        if (webview?.canGoBack()) webview.goBack()
    }, [activeTabId])

    const goForward = useCallback(() => {
        if (!activeTabId) return
        const webview = webviewRefs.current.get(activeTabId)
        if (webview?.canGoForward()) webview.goForward()
    }, [activeTabId])

    const refresh = useCallback(() => {
        if (!activeTabId) return
        const webview = webviewRefs.current.get(activeTabId)
        webview?.reload()
    }, [activeTabId])

    const goHome = useCallback(() => {
        navigateTo(DEFAULT_HOME)
    }, [navigateTo])

    // History
    const addToHistory = useCallback((url: string) => {
        setHistory(prev => {
            const filtered = prev.filter(u => u !== url)
            const updated = [url, ...filtered].slice(0, MAX_HISTORY)
            saveHistory(updated)
            return updated
        })
    }, [saveHistory])

    // Bookmarks
    const addBookmark = useCallback((name: string, url: string, favicon?: string) => {
        setBookmarks(prev => {
            const updated = [...prev, { name, url, favicon }]
            saveBookmarks(updated)
            return updated
        })
    }, [saveBookmarks])

    const removeBookmark = useCallback((url: string) => {
        setBookmarks(prev => {
            const updated = prev.filter(b => b.url !== url)
            saveBookmarks(updated)
            return updated
        })
    }, [saveBookmarks])

    const isBookmarked = useCallback((url: string) => {
        return bookmarks.some(b => b.url === url)
    }, [bookmarks])

    // Webview management
    const registerWebview = useCallback((tabId: string, webview: any) => {
        webviewRefs.current.set(tabId, webview)
    }, [])

    const getWebview = useCallback((tabId: string) => {
        return webviewRefs.current.get(tabId)
    }, [])

    return (
        <BrowserContext.Provider value={{
            tabs,
            activeTabId,
            activeTab,
            createTab,
            closeTab,
            setActiveTab,
            updateTab,
            duplicateTab,
            navigateTo,
            goBack,
            goForward,
            refresh,
            goHome,
            history,
            addToHistory,
            bookmarks,
            addBookmark,
            removeBookmark,
            isBookmarked,
            registerWebview,
            getWebview,
        }}>
            {children}
        </BrowserContext.Provider>
    )
}

export function useBrowser() {
    const context = useContext(BrowserContext)
    if (!context) {
        throw new Error('useBrowser must be used within a BrowserProvider')
    }
    return context
}
