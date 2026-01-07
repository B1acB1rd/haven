import { useState } from 'react'
import {
    Search,
    Minus,
    Square,
    X,
    Sparkles
} from 'lucide-react'

interface TopBarProps {
    onToggleAssistant: () => void
}

export default function TopBar({ onToggleAssistant }: TopBarProps) {
    const [searchFocused, setSearchFocused] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const handleMinimize = () => (window.electronAPI as any)?.minimize()
    const handleMaximize = () => (window.electronAPI as any)?.maximize()
    const handleClose = () => (window.electronAPI as any)?.close()

    return (
        <header className="h-12 bg-dark-950 border-b border-dark-700 flex items-center justify-between px-4 drag-region">
            {/* Left Section - Drag Area */}
            <div className="flex-1 flex items-center gap-4">
                {/* Global Search */}
                <div className={`
          relative flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 no-drag
          ${searchFocused
                        ? 'bg-dark-800 ring-2 ring-accent-primary/50 w-80'
                        : 'bg-dark-800/50 hover:bg-dark-800 w-64'
                    }
        `}>
                    <Search className="w-4 h-4 text-dark-400" />
                    <input
                        type="text"
                        placeholder="Search projects, assets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        className="flex-1 bg-transparent border-none text-sm text-dark-100 placeholder-dark-500 focus:outline-none"
                    />
                    <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs text-dark-500 bg-dark-700 rounded">
                        ⌘K
                    </kbd>
                </div>
            </div>

            {/* Center Section - Actions */}
            <div className="flex items-center gap-2 no-drag">
                {/* AI Assistant Toggle */}
                <button
                    onClick={onToggleAssistant}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-accent-primary to-accent-secondary
                     text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    <Sparkles className="w-4 h-4" />
                    <span>AI Assistant</span>
                </button>
            </div>

            {/* Right Section */}
            <div className="flex-1 flex items-center justify-end gap-2 no-drag">

                {/* Window Controls */}
                <div className="flex items-center ml-4 gap-1">
                    <button
                        onClick={handleMinimize}
                        className="p-1.5 rounded hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleMaximize}
                        className="p-1.5 rounded hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
                    >
                        <Square className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={handleClose}
                        className="p-1.5 rounded hover:bg-red-600 text-dark-400 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </header>
    )
}
