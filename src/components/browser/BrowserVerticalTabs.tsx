import { useState } from 'react'
import {
    X,
    Plus,
    RefreshCw,
    Search,
    ChevronDown,
    ChevronRight,
    FolderPlus,
    PanelLeftClose,
    Trash2
} from 'lucide-react'
import { useBrowser, BrowserTab } from '../../context/BrowserContext'

interface TabGroup {
    id: string
    name: string
    color: string
    collapsed: boolean
    tabIds: string[]
}

const GROUP_COLORS = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Red', value: '#ef4444' },
]

interface VerticalTabItemProps {
    tab: BrowserTab
    isActive: boolean
    onActivate: () => void
    onClose: () => void
    groupColor?: string
}

function VerticalTabItem({ tab, isActive, onActivate, onClose, groupColor }: VerticalTabItemProps) {
    const [isHovered, setIsHovered] = useState(false)

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
                group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer 
                transition-all duration-150 relative
                ${isActive
                    ? 'bg-dark-700/80 text-white'
                    : 'text-dark-400 hover:bg-dark-800/50 hover:text-dark-200'
                }
            `}
            onClick={onActivate}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Group color indicator */}
            {groupColor && (
                <div
                    className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg"
                    style={{ backgroundColor: groupColor }}
                />
            )}

            {/* Favicon or Loading */}
            <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
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

            {/* Title & URL */}
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                    {tab.title || 'New Tab'}
                </div>
                <div className="text-xs text-dark-500 truncate">
                    {domain}
                </div>
            </div>

            {/* Close button */}
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onClose()
                }}
                className={`
                    w-6 h-6 rounded-md flex items-center justify-center
                    hover:bg-dark-600 transition-all
                    ${isHovered || isActive ? 'opacity-100' : 'opacity-0'}
                `}
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    )
}

interface BrowserVerticalTabsProps {
    onCollapse: () => void
}

export default function BrowserVerticalTabs({ onCollapse }: BrowserVerticalTabsProps) {
    const { tabs, activeTabId, setActiveTab, closeTab, createTab } = useBrowser()
    const [searchQuery, setSearchQuery] = useState('')
    const [groups, setGroups] = useState<TabGroup[]>([])
    const [showNewGroupInput, setShowNewGroupInput] = useState(false)
    const [newGroupName, setNewGroupName] = useState('')

    // Filter tabs based on search
    const filteredTabs = tabs.filter(tab =>
        tab.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tab.url.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Get ungrouped tabs
    const groupedTabIds = new Set(groups.flatMap(g => g.tabIds))
    const ungroupedTabs = filteredTabs.filter(tab => !groupedTabIds.has(tab.id))

    // Create new group
    const createGroup = () => {
        if (!newGroupName.trim()) return
        const newGroup: TabGroup = {
            id: Date.now().toString(),
            name: newGroupName,
            color: GROUP_COLORS[groups.length % GROUP_COLORS.length].value,
            collapsed: false,
            tabIds: []
        }
        setGroups([...groups, newGroup])
        setNewGroupName('')
        setShowNewGroupInput(false)
    }

    // Toggle group collapse
    const toggleGroup = (groupId: string) => {
        setGroups(groups.map(g =>
            g.id === groupId ? { ...g, collapsed: !g.collapsed } : g
        ))
    }

    // Delete group (tabs become ungrouped)
    const deleteGroup = (groupId: string) => {
        setGroups(groups.filter(g => g.id !== groupId))
    }

    // Add tab to group (for future drag-drop implementation)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _addTabToGroup = (tabId: string, groupId: string) => {
        setGroups(groups.map(g =>
            g.id === groupId
                ? { ...g, tabIds: [...g.tabIds, tabId] }
                : { ...g, tabIds: g.tabIds.filter(id => id !== tabId) }
        ))
    }

    return (
        <div className="w-72 h-full bg-dark-850 border-r border-dark-700 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-dark-700">
                <span className="font-semibold text-white text-sm">
                    {tabs.length} {tabs.length === 1 ? 'Tab' : 'Tabs'}
                </span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => createTab()}
                        className="p-1.5 rounded-md text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
                        title="New Tab (Ctrl+T)"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onCollapse}
                        className="p-1.5 rounded-md text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
                        title="Collapse to horizontal tabs"
                    >
                        <PanelLeftClose className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="px-3 py-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search tabs..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-dark-900 border border-dark-700
                            text-sm text-white placeholder-dark-500 
                            focus:outline-none focus:border-accent-primary"
                    />
                </div>
            </div>

            {/* Tabs List */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
                {/* Tab Groups */}
                {groups.map((group) => {
                    const groupTabs = filteredTabs.filter(t => group.tabIds.includes(t.id))
                    if (groupTabs.length === 0 && searchQuery) return null

                    return (
                        <div key={group.id} className="mb-2">
                            {/* Group Header */}
                            <div
                                className="flex items-center gap-2 px-2 py-1.5 rounded-md 
                                    hover:bg-dark-800 cursor-pointer group"
                                onClick={() => toggleGroup(group.id)}
                            >
                                {group.collapsed ? (
                                    <ChevronRight className="w-4 h-4 text-dark-500" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-dark-500" />
                                )}
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: group.color }}
                                />
                                <span className="flex-1 text-sm font-medium text-dark-300">
                                    {group.name}
                                </span>
                                <span className="text-xs text-dark-500">
                                    {groupTabs.length}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        deleteGroup(group.id)
                                    }}
                                    className="p-1 rounded opacity-0 group-hover:opacity-100
                                        hover:bg-dark-600 transition-all"
                                >
                                    <Trash2 className="w-3 h-3 text-dark-400" />
                                </button>
                            </div>

                            {/* Group Tabs */}
                            {!group.collapsed && (
                                <div className="ml-4 mt-1 space-y-0.5">
                                    {groupTabs.map((tab) => (
                                        <VerticalTabItem
                                            key={tab.id}
                                            tab={tab}
                                            isActive={tab.id === activeTabId}
                                            onActivate={() => setActiveTab(tab.id)}
                                            onClose={() => closeTab(tab.id)}
                                            groupColor={group.color}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}

                {/* Ungrouped Tabs */}
                {ungroupedTabs.map((tab) => (
                    <VerticalTabItem
                        key={tab.id}
                        tab={tab}
                        isActive={tab.id === activeTabId}
                        onActivate={() => setActiveTab(tab.id)}
                        onClose={() => closeTab(tab.id)}
                    />
                ))}

                {/* Empty state */}
                {filteredTabs.length === 0 && (
                    <div className="text-center py-8 text-dark-500 text-sm">
                        {searchQuery ? 'No matching tabs' : 'No tabs open'}
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="px-3 py-2 border-t border-dark-700">
                {showNewGroupInput ? (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && createGroup()}
                            placeholder="Group name..."
                            autoFocus
                            className="flex-1 px-3 py-1.5 rounded-md bg-dark-900 border border-dark-700
                                text-sm text-white placeholder-dark-500
                                focus:outline-none focus:border-accent-primary"
                        />
                        <button
                            onClick={createGroup}
                            className="px-3 py-1.5 rounded-md bg-accent-primary text-white text-sm"
                        >
                            Add
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowNewGroupInput(true)}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-md
                            text-dark-400 hover:text-white hover:bg-dark-800 transition-colors text-sm"
                    >
                        <FolderPlus className="w-4 h-4" />
                        New Group
                    </button>
                )}
            </div>
        </div>
    )
}
