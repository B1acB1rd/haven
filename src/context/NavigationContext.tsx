import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

// Navigation items with their metadata
export const navItems = [
    { path: '/', icon: 'LayoutDashboard', label: 'Dashboard', shortcut: 1 },
    { path: '/ai-tools', icon: 'Bot', label: 'AI Tools', shortcut: 2 },
    { path: '/browser', icon: 'Globe', label: 'Browser', shortcut: 3 },
    { path: '/music', icon: 'Music', label: 'Music', shortcut: 4 },
    { path: '/videos', icon: 'PlayCircle', label: 'Videos', shortcut: 5 },
    { path: '/documents', icon: 'FileText', label: 'Documents', shortcut: 6 },
    { path: '/social', icon: 'Share2', label: 'Social Hub', shortcut: 7 },
    { path: '/assets', icon: 'Image', label: 'Assets', shortcut: 8 },
    { path: '/settings', icon: 'Settings', label: 'Settings', shortcut: 9 },
]

interface NavigationContextType {
    recentPages: string[]
    pinnedPages: string[]
    currentPath: string
    // History navigation
    canGoBack: boolean
    canGoForward: boolean
    goBack: () => void
    goForward: () => void
    // Core navigation
    addToRecent: (path: string) => void
    togglePin: (path: string) => void
    isPinned: (path: string) => boolean
    navigateToIndex: (index: number) => void
    navigateTo: (path: string) => void
    getPageLabel: (path: string) => string
    getPageIcon: (path: string) => string
    // Scroll memory
    saveScrollPosition: (path: string, position: number) => void
    getScrollPosition: (path: string) => number
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

const STORAGE_KEY_RECENT = 'haven-recent-pages'
const STORAGE_KEY_PINNED = 'haven-pinned-pages'
const MAX_RECENT = 10
const MAX_HISTORY = 50

export function NavigationProvider({ children }: { children: ReactNode }) {
    const navigate = useNavigate()
    const location = useLocation()

    // History stacks for back/forward
    const historyStack = useRef<string[]>([])
    const historyIndex = useRef<number>(-1)
    const isNavigatingHistory = useRef<boolean>(false)

    // Scroll position memory
    const scrollPositions = useRef<Map<string, number>>(new Map())

    // Initialize from localStorage
    const [recentPages, setRecentPages] = useState<string[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY_RECENT)
            return stored ? JSON.parse(stored) : []
        } catch {
            return []
        }
    })

    const [pinnedPages, setPinnedPages] = useState<string[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY_PINNED)
            return stored ? JSON.parse(stored) : ['/', '/music'] // Default pins
        } catch {
            return ['/', '/music']
        }
    })

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(recentPages))
    }, [recentPages])

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_PINNED, JSON.stringify(pinnedPages))
    }, [pinnedPages])

    // Track page visits and history
    useEffect(() => {
        const path = location.pathname
        if (path && navItems.some(item => item.path === path)) {
            addToRecent(path)

            // Update history stack (but not if we're navigating through history)
            if (!isNavigatingHistory.current) {
                // If we're not at the end of history, truncate forward history
                if (historyIndex.current < historyStack.current.length - 1) {
                    historyStack.current = historyStack.current.slice(0, historyIndex.current + 1)
                }

                // Only add if different from current
                if (historyStack.current[historyStack.current.length - 1] !== path) {
                    historyStack.current.push(path)
                    if (historyStack.current.length > MAX_HISTORY) {
                        historyStack.current.shift()
                    }
                    historyIndex.current = historyStack.current.length - 1
                }
            }
            isNavigatingHistory.current = false
        }
    }, [location.pathname])

    const addToRecent = useCallback((path: string) => {
        setRecentPages(prev => {
            const filtered = prev.filter(p => p !== path)
            const updated = [path, ...filtered].slice(0, MAX_RECENT)
            return updated
        })
    }, [])

    const togglePin = useCallback((path: string) => {
        setPinnedPages(prev => {
            if (prev.includes(path)) {
                return prev.filter(p => p !== path)
            } else {
                return [...prev, path]
            }
        })
    }, [])

    const isPinned = useCallback((path: string) => {
        return pinnedPages.includes(path)
    }, [pinnedPages])

    const navigateToIndex = useCallback((index: number) => {
        const item = navItems.find(nav => nav.shortcut === index)
        if (item) {
            navigate(item.path)
        }
    }, [navigate])

    const navigateTo = useCallback((path: string) => {
        navigate(path)
    }, [navigate])

    // History navigation
    const canGoBack = historyIndex.current > 0
    const canGoForward = historyIndex.current < historyStack.current.length - 1

    const goBack = useCallback(() => {
        if (historyIndex.current > 0) {
            isNavigatingHistory.current = true
            historyIndex.current--
            const path = historyStack.current[historyIndex.current]
            navigate(path)
        }
    }, [navigate])

    const goForward = useCallback(() => {
        if (historyIndex.current < historyStack.current.length - 1) {
            isNavigatingHistory.current = true
            historyIndex.current++
            const path = historyStack.current[historyIndex.current]
            navigate(path)
        }
    }, [navigate])

    // Scroll position memory
    const saveScrollPosition = useCallback((path: string, position: number) => {
        scrollPositions.current.set(path, position)
    }, [])

    const getScrollPosition = useCallback((path: string) => {
        return scrollPositions.current.get(path) || 0
    }, [])

    const getPageLabel = useCallback((path: string) => {
        const item = navItems.find(nav => nav.path === path)
        return item?.label || 'Unknown'
    }, [])

    const getPageIcon = useCallback((path: string) => {
        const item = navItems.find(nav => nav.path === path)
        return item?.icon || 'File'
    }, [])

    return (
        <NavigationContext.Provider value={{
            recentPages,
            pinnedPages,
            currentPath: location.pathname,
            canGoBack,
            canGoForward,
            goBack,
            goForward,
            addToRecent,
            togglePin,
            isPinned,
            navigateToIndex,
            navigateTo,
            getPageLabel,
            getPageIcon,
            saveScrollPosition,
            getScrollPosition,
        }}>
            {children}
        </NavigationContext.Provider>
    )
}

export function useNavigation() {
    const context = useContext(NavigationContext)
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationProvider')
    }
    return context
}
