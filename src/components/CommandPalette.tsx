import { useState, useEffect, useCallback } from 'react'
import {
    Search,
    FolderKanban,
    Bot,
    Music,
    Video,
    FileText,
    Image,
    Users,
    Settings,
    Home,
    Sparkles,
    ArrowRight,
    File,
    Loader2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface CommandPaletteProps {
    isOpen: boolean
    onClose: () => void
}

interface SearchResult {
    id: string
    name: string
    description: string
    icon: React.ReactNode
    action: () => void
    category: string
    type: 'navigation' | 'project' | 'asset'
}

const typeIcons: Record<string, React.ReactNode> = {
    image: <Image className="w-4 h-4" />,
    audio: <Music className="w-4 h-4" />,
    video: <Video className="w-4 h-4" />,
    text: <FileText className="w-4 h-4" />,
    other: <File className="w-4 h-4" />,
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
    const navigate = useNavigate()
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)

    // Static navigation commands
    const navigationCommands: SearchResult[] = [
        { id: 'home', name: 'Go to Dashboard', description: 'View your workspace', icon: <Home className="w-4 h-4" />, action: () => { navigate('/'); onClose() }, category: 'Navigation', type: 'navigation' },
        { id: 'projects', name: 'Projects', description: 'Manage your projects', icon: <FolderKanban className="w-4 h-4" />, action: () => { navigate('/projects'); onClose() }, category: 'Navigation', type: 'navigation' },
        { id: 'ai-tools', name: 'AI Tools', description: 'Access AI platforms', icon: <Bot className="w-4 h-4" />, action: () => { navigate('/ai-tools'); onClose() }, category: 'Navigation', type: 'navigation' },
        { id: 'music', name: 'Music Hub', description: 'Stream music services', icon: <Music className="w-4 h-4" />, action: () => { navigate('/music'); onClose() }, category: 'Navigation', type: 'navigation' },
        { id: 'videos', name: 'Video Player', description: 'Watch and play videos', icon: <Video className="w-4 h-4" />, action: () => { navigate('/videos'); onClose() }, category: 'Navigation', type: 'navigation' },
        { id: 'documents', name: 'Documents', description: 'View documents', icon: <FileText className="w-4 h-4" />, action: () => { navigate('/documents'); onClose() }, category: 'Navigation', type: 'navigation' },
        { id: 'social', name: 'Social Hub', description: 'Access social platforms', icon: <Users className="w-4 h-4" />, action: () => { navigate('/social'); onClose() }, category: 'Navigation', type: 'navigation' },
        { id: 'assets', name: 'Assets', description: 'Browse your files', icon: <Image className="w-4 h-4" />, action: () => { navigate('/assets'); onClose() }, category: 'Navigation', type: 'navigation' },
        { id: 'settings', name: 'Settings', description: 'Configure preferences', icon: <Settings className="w-4 h-4" />, action: () => { navigate('/settings'); onClose() }, category: 'Navigation', type: 'navigation' },
        { id: 'ai-assistant', name: 'Open AI Assistant', description: 'Chat with AI tools', icon: <Sparkles className="w-4 h-4" />, action: () => { onClose() }, category: 'Actions', type: 'navigation' },
    ]

    // Search projects and assets
    const searchContent = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim() || !window.electronAPI) {
            setResults(navigationCommands.filter(cmd =>
                cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cmd.description.toLowerCase().includes(searchQuery.toLowerCase())
            ))
            return
        }

        setLoading(true)
        try {
            const [projects, assets] = await Promise.all([
                window.electronAPI.projects?.getAll() || [],
                window.electronAPI.assets?.getAll() || []
            ])

            const searchLower = searchQuery.toLowerCase()

            // Filter and map projects
            const projectResults: SearchResult[] = (projects as any[])
                .filter(p => p.name.toLowerCase().includes(searchLower))
                .slice(0, 5)
                .map(p => ({
                    id: `project-${p.id}`,
                    name: p.name,
                    description: p.type || 'Project',
                    icon: <FolderKanban className="w-4 h-4" />,
                    action: () => { navigate(`/projects/${p.id}`); onClose() },
                    category: 'Projects',
                    type: 'project' as const
                }))

            // Filter and map assets
            const assetResults: SearchResult[] = (assets as any[])
                .filter(a => a.name.toLowerCase().includes(searchLower))
                .slice(0, 5)
                .map(a => ({
                    id: `asset-${a.id}`,
                    name: a.name,
                    description: `${a.type} • ${a.sourceTool || 'Unknown source'}`,
                    icon: typeIcons[a.type] || <File className="w-4 h-4" />,
                    action: () => { navigate('/assets'); onClose() },
                    category: 'Assets',
                    type: 'asset' as const
                }))

            // Filter navigation commands
            const navResults = navigationCommands.filter(cmd =>
                cmd.name.toLowerCase().includes(searchLower) ||
                cmd.description.toLowerCase().includes(searchLower)
            )

            setResults([...navResults, ...projectResults, ...assetResults])
        } catch (error) {
            console.error('Search error:', error)
            setResults(navigationCommands)
        } finally {
            setLoading(false)
        }
    }, [navigate, onClose])

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            searchContent(query)
        }, 150)
        return () => clearTimeout(timer)
    }, [query, searchContent])

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
                break
            case 'ArrowUp':
                e.preventDefault()
                setSelectedIndex(prev => Math.max(prev - 1, 0))
                break
            case 'Enter':
                e.preventDefault()
                if (results[selectedIndex]) {
                    results[selectedIndex].action()
                }
                break
            case 'Escape':
                e.preventDefault()
                onClose()
                break
        }
    }, [isOpen, results, selectedIndex, onClose])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    useEffect(() => {
        setSelectedIndex(0)
    }, [results])

    useEffect(() => {
        if (isOpen) {
            setQuery('')
            setSelectedIndex(0)
            setResults(navigationCommands)
        }
    }, [isOpen])

    if (!isOpen) return null

    // Group results by category
    const groupedResults = results.reduce((acc, result) => {
        if (!acc[result.category]) acc[result.category] = []
        acc[result.category].push(result)
        return acc
    }, {} as Record<string, SearchResult[]>)

    let flatIndex = -1

    return (
        <div
            className="fixed inset-0 z-50 modal-backdrop bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
            onClick={onClose}
        >
            <div
                className="modal-content w-full max-w-xl bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-dark-700">
                    {loading ? (
                        <Loader2 className="w-5 h-5 text-accent-primary animate-spin" />
                    ) : (
                        <Search className="w-5 h-5 text-dark-400" />
                    )}
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search projects, assets, and commands..."
                        className="flex-1 bg-transparent border-none text-white text-lg placeholder-dark-500 focus:outline-none"
                        autoFocus
                    />
                    <kbd className="px-2 py-1 text-xs text-dark-500 bg-dark-800 rounded">ESC</kbd>
                </div>

                {/* Results List */}
                <div className="max-h-[400px] overflow-auto py-2">
                    {Object.entries(groupedResults).map(([category, items]) => (
                        <div key={category}>
                            <div className="px-4 py-2 text-xs font-medium text-dark-500 uppercase tracking-wide">
                                {category}
                            </div>
                            {items.map((result) => {
                                flatIndex++
                                const isSelected = flatIndex === selectedIndex
                                const currentIndex = flatIndex

                                return (
                                    <button
                                        key={result.id}
                                        onClick={result.action}
                                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                                            ${isSelected ? 'bg-accent-primary/20 text-white' : 'text-dark-300 hover:bg-dark-800'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                                            ${isSelected ? 'bg-accent-primary text-white' : 'bg-dark-800 text-dark-400'}`}>
                                            {result.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{result.name}</p>
                                            <p className="text-sm text-dark-500 truncate">{result.description}</p>
                                        </div>
                                        {isSelected && <ArrowRight className="w-4 h-4 text-accent-primary flex-shrink-0" />}
                                    </button>
                                )
                            })}
                        </div>
                    ))}

                    {results.length === 0 && !loading && (
                        <div className="px-4 py-8 text-center text-dark-400">
                            No results found for "{query}"
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-4 px-4 py-3 border-t border-dark-700 text-xs text-dark-500">
                    <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-dark-800 rounded">↑↓</kbd> Navigate
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-dark-800 rounded">↵</kbd> Select
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-dark-800 rounded">ESC</kbd> Close
                    </span>
                </div>
            </div>
        </div>
    )
}
