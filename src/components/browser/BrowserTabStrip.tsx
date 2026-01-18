import { useState } from 'react'
import { X, Plus, RefreshCw } from 'lucide-react'
import { useBrowser, BrowserTab } from '../../context/BrowserContext'

interface TabItemProps {
    tab: BrowserTab
    isActive: boolean
    onActivate: () => void
    onClose: () => void
}

function TabItem({ tab, isActive, onActivate, onClose }: TabItemProps) {
    const [isHovered, setIsHovered] = useState(false)

    // Get domain for favicon
    const getDomain = (url: string) => {
        try {
            return new URL(url).hostname
        } catch {
            return ''
        }
    }

    const domain = getDomain(tab.url)
    const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : null

    return (
        <div
            className={`
                group relative flex items-center gap-2 px-3 py-2 min-w-[140px] max-w-[240px]
                rounded-t-lg cursor-pointer transition-all duration-150
                ${isActive
                    ? 'bg-dark-800 text-white'
                    : 'bg-dark-900/50 text-dark-400 hover:bg-dark-800/50 hover:text-dark-200'
                }
            `}
            onClick={onActivate}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Favicon or Loading */}
            <div className="w-4 h-4 flex-shrink-0">
                {tab.isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-accent-primary" />
                ) : faviconUrl ? (
                    <img
                        src={faviconUrl}
                        alt=""
                        className="w-4 h-4 rounded-sm"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                        }}
                    />
                ) : (
                    <div className="w-4 h-4 rounded-sm bg-dark-600" />
                )}
            </div>

            {/* Title */}
            <span className="flex-1 text-sm truncate">
                {tab.title || 'New Tab'}
            </span>

            {/* Audio indicator (placeholder for future) */}
            {/* <Volume2 className="w-3 h-3 text-dark-500" /> */}

            {/* Close button */}
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onClose()
                }}
                className={`
                    w-5 h-5 rounded-full flex items-center justify-center
                    hover:bg-dark-600 transition-colors
                    ${isHovered || isActive ? 'opacity-100' : 'opacity-0'}
                `}
            >
                <X className="w-3 h-3" />
            </button>

            {/* Active indicator */}
            {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary" />
            )}
        </div>
    )
}

export default function BrowserTabStrip() {
    const { tabs, activeTabId, setActiveTab, closeTab, createTab } = useBrowser()

    return (
        <div className="flex items-end bg-dark-950 border-b border-dark-700 px-2 pt-2">
            {/* Tab List */}
            <div className="flex items-end gap-1 flex-1 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                    <TabItem
                        key={tab.id}
                        tab={tab}
                        isActive={tab.id === activeTabId}
                        onActivate={() => setActiveTab(tab.id)}
                        onClose={() => closeTab(tab.id)}
                    />
                ))}
            </div>

            {/* New Tab Button */}
            <button
                onClick={() => createTab()}
                className="p-2 mb-1 ml-1 rounded-lg text-dark-400 hover:text-white 
                    hover:bg-dark-700 transition-colors"
                title="New Tab (Ctrl+T)"
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
    )
}
