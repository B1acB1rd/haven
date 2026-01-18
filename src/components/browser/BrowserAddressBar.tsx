import {
    ArrowLeft,
    ArrowRight,
    RotateCw,
    Home,
    Search,
    Star,
    StarOff,
    Shield,
    Lock,
    Menu,
    X
} from 'lucide-react'
import { useBrowser } from '../../context/BrowserContext'
import { useState, useEffect } from 'react'
import ShieldButton from './ShieldButton'

export default function BrowserAddressBar() {
    const {
        activeTab,
        navigateTo,
        goBack,
        goForward,
        refresh,
        goHome,
        isBookmarked,
        addBookmark,
        removeBookmark
    } = useBrowser()

    const [inputValue, setInputValue] = useState('')
    const [isFocused, setIsFocused] = useState(false)

    // Sync input with active tab URL
    useEffect(() => {
        if (activeTab && !isFocused) {
            setInputValue(activeTab.url)
        }
    }, [activeTab?.url, isFocused])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        navigateTo(inputValue)
        setIsFocused(false)
    }

    const handleFocus = () => {
        setIsFocused(true)
        // Select all text on focus like Chrome
        setTimeout(() => {
            const input = document.querySelector<HTMLInputElement>('#browser-url-input')
            input?.select()
        }, 0)
    }

    const toggleBookmark = () => {
        if (!activeTab) return
        if (isBookmarked(activeTab.url)) {
            removeBookmark(activeTab.url)
        } else {
            addBookmark(activeTab.title || activeTab.url, activeTab.url)
        }
    }

    const displayUrl = isFocused ? inputValue : (activeTab?.url || '')
    const bookmarked = activeTab ? isBookmarked(activeTab.url) : false

    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-dark-800 border-b border-dark-700">
            {/* Navigation Buttons */}
            <div className="flex items-center gap-1">
                <button
                    onClick={goBack}
                    disabled={!activeTab?.canGoBack}
                    className={`p-2 rounded-lg transition-colors
                        ${activeTab?.canGoBack
                            ? 'text-dark-400 hover:text-white hover:bg-dark-700'
                            : 'text-dark-600 cursor-not-allowed'
                        }`}
                    title="Back (Alt+Left)"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                    onClick={goForward}
                    disabled={!activeTab?.canGoForward}
                    className={`p-2 rounded-lg transition-colors
                        ${activeTab?.canGoForward
                            ? 'text-dark-400 hover:text-white hover:bg-dark-700'
                            : 'text-dark-600 cursor-not-allowed'
                        }`}
                    title="Forward (Alt+Right)"
                >
                    <ArrowRight className="w-4 h-4" />
                </button>
                <button
                    onClick={refresh}
                    className={`p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors
                        ${activeTab?.isLoading ? 'animate-spin' : ''}`}
                    title="Refresh (Ctrl+R)"
                >
                    {activeTab?.isLoading ? (
                        <X className="w-4 h-4" />
                    ) : (
                        <RotateCw className="w-4 h-4" />
                    )}
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
            <form onSubmit={handleSubmit} className="flex-1">
                <div className={`
                    flex items-center gap-2 px-4 py-2 rounded-full 
                    bg-dark-900 border transition-colors
                    ${isFocused
                        ? 'border-accent-primary shadow-lg shadow-accent-primary/10'
                        : 'border-dark-600 hover:border-dark-500'
                    }
                `}>
                    {/* Security Icon */}
                    {!isFocused && (
                        activeTab?.isSecure ? (
                            <Lock className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                            <Shield className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        )
                    )}
                    {isFocused && (
                        <Search className="w-4 h-4 text-dark-400 flex-shrink-0" />
                    )}

                    {/* URL Input */}
                    <input
                        id="browser-url-input"
                        type="text"
                        value={displayUrl}
                        onChange={(e) => setInputValue(e.target.value)}
                        onFocus={handleFocus}
                        onBlur={() => setIsFocused(false)}
                        placeholder="Search or enter URL..."
                        className="flex-1 bg-transparent text-white placeholder-dark-500 
                            focus:outline-none text-sm"
                    />

                    {/* Bookmark button */}
                    <button
                        type="button"
                        onClick={toggleBookmark}
                        className="p-1 text-dark-400 hover:text-yellow-500 transition-colors"
                        title={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
                    >
                        {bookmarked ? (
                            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        ) : (
                            <StarOff className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </form>

            {/* Shield Button */}
            <ShieldButton />

            {/* Menu Button */}
            <button
                className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
                title="Menu"
            >
                <Menu className="w-4 h-4" />
            </button>
        </div>
    )
}
