import { useState } from 'react'
import {
    LayoutDashboard,
    Bot,
    Share2,
    Image,
    Settings,
    Music,
    PlayCircle,
    FileText,
    Globe,
    Pin,
    PinOff,
    ChevronRight,
    LucideIcon
} from 'lucide-react'
import { useNavigation, navItems } from '../../context/NavigationContext'

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
    LayoutDashboard,
    Bot,
    Share2,
    Image,
    Settings,
    Music,
    PlayCircle,
    FileText,
    Globe,
}

interface DockItemProps {
    path: string
    icon: string
    label: string
    isActive: boolean
    isPinned: boolean
    onNavigate: () => void
    onTogglePin: () => void
}

function DockItem({ path, icon, label, isActive, isPinned, onNavigate, onTogglePin }: DockItemProps) {
    const [showTooltip, setShowTooltip] = useState(false)
    const [showContextMenu, setShowContextMenu] = useState(false)
    const IconComponent = iconMap[icon] || Globe

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault()
        setShowContextMenu(true)
    }

    return (
        <div className="relative">
            <button
                onClick={onNavigate}
                onContextMenu={handleContextMenu}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => {
                    setShowTooltip(false)
                    setShowContextMenu(false)
                }}
                className={`
                    w-10 h-10 rounded-xl flex items-center justify-center
                    transition-all duration-200 group relative
                    ${isActive
                        ? 'bg-accent-primary/30 text-accent-primary shadow-lg shadow-accent-primary/20'
                        : 'text-dark-400 hover:bg-dark-700/80 hover:text-white'
                    }
                `}
            >
                <IconComponent className="w-5 h-5" />

                {/* Active indicator */}
                {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-accent-primary rounded-r-full" />
                )}

                {/* Pin indicator */}
                {isPinned && !isActive && (
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent-secondary rounded-full" />
                )}
            </button>

            {/* Tooltip */}
            {showTooltip && !showContextMenu && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50
                    px-3 py-1.5 bg-dark-800 border border-dark-600 rounded-lg shadow-xl
                    text-sm text-white whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-150">
                    {label}
                    {navItems.find(n => n.path === path)?.shortcut && (
                        <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-dark-700 text-dark-300 rounded">
                            ⌘{navItems.find(n => n.path === path)?.shortcut}
                        </kbd>
                    )}
                </div>
            )}

            {/* Context Menu */}
            {showContextMenu && (
                <div
                    className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50
                        py-1 bg-dark-800 border border-dark-600 rounded-lg shadow-xl
                        min-w-[140px] animate-in fade-in slide-in-from-left-2 duration-150"
                    onMouseLeave={() => setShowContextMenu(false)}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onTogglePin()
                            setShowContextMenu(false)
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-dark-200 hover:bg-dark-700
                            flex items-center gap-2 transition-colors"
                    >
                        {isPinned ? (
                            <>
                                <PinOff className="w-4 h-4" />
                                Unpin
                            </>
                        ) : (
                            <>
                                <Pin className="w-4 h-4" />
                                Pin to Dock
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    )
}

interface ActiveDockProps {
    onExpand?: () => void
}

export default function ActiveDock({ onExpand }: ActiveDockProps) {
    const { recentPages, pinnedPages, currentPath, isPinned, togglePin, navigateTo } = useNavigation()

    // Get unique pages to show: pinned first, then recent (excluding already pinned)
    const recentNotPinned = recentPages
        .filter(path => !pinnedPages.includes(path))
        .slice(0, 3) // Show up to 3 recent unpinned

    return (
        <aside className="w-14 h-full bg-dark-950/80 backdrop-blur-xl border-r border-dark-700/50 
            flex flex-col items-center py-3 gap-1">

            {/* Pinned Section */}
            <div className="flex flex-col items-center gap-1">
                {pinnedPages.map(path => {
                    const item = navItems.find(n => n.path === path)
                    if (!item) return null
                    return (
                        <DockItem
                            key={path}
                            path={path}
                            icon={item.icon}
                            label={item.label}
                            isActive={currentPath === path}
                            isPinned={true}
                            onNavigate={() => navigateTo(path)}
                            onTogglePin={() => togglePin(path)}
                        />
                    )
                })}
            </div>

            {/* Separator */}
            {pinnedPages.length > 0 && recentNotPinned.length > 0 && (
                <div className="w-6 h-px bg-dark-600 my-2" />
            )}

            {/* Recent Section */}
            <div className="flex flex-col items-center gap-1">
                {recentNotPinned.map(path => {
                    const item = navItems.find(n => n.path === path)
                    if (!item) return null
                    return (
                        <DockItem
                            key={path}
                            path={path}
                            icon={item.icon}
                            label={item.label}
                            isActive={currentPath === path}
                            isPinned={false}
                            onNavigate={() => navigateTo(path)}
                            onTogglePin={() => togglePin(path)}
                        />
                    )
                })}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Settings always at bottom */}
            {!pinnedPages.includes('/settings') && !recentNotPinned.includes('/settings') && (
                <DockItem
                    path="/settings"
                    icon="Settings"
                    label="Settings"
                    isActive={currentPath === '/settings'}
                    isPinned={isPinned('/settings')}
                    onNavigate={() => navigateTo('/settings')}
                    onTogglePin={() => togglePin('/settings')}
                />
            )}

            {/* Expand button */}
            {onExpand && (
                <button
                    onClick={onExpand}
                    className="w-10 h-10 rounded-xl flex items-center justify-center
                        text-dark-400 hover:bg-dark-700/80 hover:text-white transition-all duration-200"
                    title="Expand sidebar"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            )}
        </aside>
    )
}

