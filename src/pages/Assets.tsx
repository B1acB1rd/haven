import { useState, useEffect } from 'react'
import {
    Image,
    Music,
    Video,
    FileText,
    Upload,
    Search,
    Grid3X3,
    List,
    Trash2,
    Eye,
    X,
    File,
    Loader2
} from 'lucide-react'

interface Asset {
    id: string
    projectId: string | null
    name: string
    type: 'image' | 'audio' | 'video' | 'text' | 'other'
    sourceTool: string | null
    filePath: string | null
    fileSize: number | null
    createdAt: string
}

const typeIcons = {
    image: Image,
    audio: Music,
    video: Video,
    text: FileText,
    other: File,
}

const typeColors = {
    image: 'from-pink-500 to-rose-500',
    audio: 'from-green-500 to-emerald-500',
    video: 'from-purple-500 to-violet-500',
    text: 'from-blue-500 to-cyan-500',
    other: 'from-gray-500 to-slate-500',
}

function formatFileSize(bytes: number | null): string {
    if (!bytes) return 'Unknown'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
}

export default function Assets() {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [searchQuery, setSearchQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [previewAsset, setPreviewAsset] = useState<Asset | null>(null)
    const [assets, setAssets] = useState<Asset[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        loadAssets()
    }, [])

    const loadAssets = async () => {
        try {
            setLoading(true)
            // Check if running in Electron
            if (!window.electronAPI?.assets) {
                setAssets([])
                return
            }
            const data = await window.electronAPI.assets.getAll()
            setAssets(data as unknown as Asset[])
        } catch (error) {
            console.error('Failed to load assets:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredAssets = assets.filter(a => {
        const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesType = typeFilter === 'all' || a.type === typeFilter
        return matchesSearch && matchesType
    })

    const types = ['all', 'image', 'audio', 'video', 'text']

    const handleUpload = async () => {
        try {
            setUploading(true)
            const result = await window.electronAPI.assets.selectFile()

            if (result) {
                await window.electronAPI.assets.create({
                    name: result.fileName,
                    type: result.fileType as Asset['type'],
                    filePath: result.filePath,
                    source_tool: 'Upload'
                })
                await loadAssets()
            }
        } catch (error) {
            console.error('Failed to upload asset:', error)
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this asset?')) return

        try {
            await window.electronAPI.assets.delete(id)
            setPreviewAsset(null)
            await loadAssets()
        } catch (error) {
            console.error('Failed to delete asset:', error)
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Asset Library</h1>
                    <p className="text-dark-400">All your creative assets in one place</p>
                </div>
                <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-accent-primary to-accent-secondary
                           text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    Upload
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                {/* Search */}
                <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input
                        type="text"
                        placeholder="Search assets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-800 border border-dark-700 
                       text-white placeholder-dark-500 focus:outline-none focus:border-accent-primary"
                    />
                </div>

                <div className="flex items-center gap-4">
                    {/* Type Filter */}
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-dark-800">
                        {types.map((type) => (
                            <button
                                key={type}
                                onClick={() => setTypeFilter(type)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors
                  ${typeFilter === type
                                        ? 'bg-dark-700 text-white'
                                        : 'text-dark-400 hover:text-white'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-dark-800">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-dark-700 text-white' : 'text-dark-400 hover:text-white'
                                }`}
                        >
                            <Grid3X3 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-dark-700 text-white' : 'text-dark-400 hover:text-white'
                                }`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
                </div>
            ) : filteredAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <File className="w-16 h-16 text-dark-600 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No assets yet</h3>
                    <p className="text-dark-400 mb-6">Upload files or save assets from AI tools</p>
                    <button
                        onClick={handleUpload}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-primary text-white font-medium hover:bg-accent-primary/90"
                    >
                        <Upload className="w-5 h-5" />
                        Upload Asset
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredAssets.map((asset) => {
                        const Icon = typeIcons[asset.type]
                        const color = typeColors[asset.type]
                        const isImage = asset.type === 'image'
                        const isVideo = asset.type === 'video'
                        const thumbnailSrc = asset.filePath
                            ? `local-file://${asset.filePath.replace(/\\/g, '/').replace(/^([a-zA-Z]):/, '$1')}`
                            : null

                        return (
                            <div
                                key={asset.id}
                                className="group card-animated p-3 rounded-xl bg-dark-800 border border-dark-700 
                                           hover:border-accent-primary/50 cursor-pointer overflow-hidden"
                                onClick={() => setPreviewAsset(asset)}
                            >
                                {/* Thumbnail */}
                                <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3 bg-dark-900">
                                    {(isImage || isVideo) && thumbnailSrc ? (
                                        <>
                                            <img
                                                src={thumbnailSrc}
                                                alt={asset.name}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                }}
                                            />
                                            <div className={`hidden w-full h-full bg-gradient-to-br ${color} 
                                                             flex items-center justify-center absolute inset-0`}>
                                                <Icon className="w-12 h-12 text-white" />
                                            </div>
                                            {isVideo && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                                                        <div className="w-0 h-0 border-l-[16px] border-l-white border-y-[10px] border-y-transparent ml-1" />
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className={`w-full h-full bg-gradient-to-br ${color} 
                                                         flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}>
                                            <Icon className="w-12 h-12 text-white" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <h3 className="font-medium text-white truncate text-sm mb-1">{asset.name}</h3>
                                <div className="flex items-center justify-between text-xs text-dark-500">
                                    <span>{formatFileSize(asset.fileSize)}</span>
                                    <span className="truncate ml-2">{asset.sourceTool || formatDate(asset.createdAt)}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredAssets.map((asset) => {
                        const Icon = typeIcons[asset.type]
                        const color = typeColors[asset.type]
                        return (
                            <div
                                key={asset.id}
                                className="group flex items-center gap-4 p-4 rounded-xl bg-dark-800 border border-dark-700 
                           hover:border-accent-primary/50 transition-all duration-200 cursor-pointer"
                                onClick={() => setPreviewAsset(asset)}
                            >
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} 
                                 flex items-center justify-center`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-white truncate">{asset.name}</h3>
                                    <p className="text-sm text-dark-500">{asset.sourceTool || 'Unknown'}</p>
                                </div>
                                <span className="text-sm text-dark-500 capitalize">{asset.type}</span>
                                <span className="text-sm text-dark-500 w-20 text-right">{formatFileSize(asset.fileSize)}</span>
                                <span className="text-sm text-dark-500 w-24">{formatDate(asset.createdAt)}</span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setPreviewAsset(asset); }}
                                        className="p-2 rounded-md text-dark-400 hover:text-white hover:bg-dark-700"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }}
                                        className="p-2 rounded-md text-dark-400 hover:text-red-400 hover:bg-dark-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Preview Modal */}
            {previewAsset && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setPreviewAsset(null)}>
                    <div className="w-full max-w-2xl p-6 rounded-2xl bg-dark-800 border border-dark-700" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">{previewAsset.name}</h2>
                            <button
                                onClick={() => setPreviewAsset(null)}
                                className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className={`w-full aspect-video rounded-xl bg-gradient-to-br ${typeColors[previewAsset.type]} 
                             flex items-center justify-center mb-4`}>
                            {(() => { const Icon = typeIcons[previewAsset.type]; return <Icon className="w-24 h-24 text-white opacity-80" />; })()}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-dark-500">Type:</span>
                                <span className="ml-2 text-white capitalize">{previewAsset.type}</span>
                            </div>
                            <div>
                                <span className="text-dark-500">Size:</span>
                                <span className="ml-2 text-white">{formatFileSize(previewAsset.fileSize)}</span>
                            </div>
                            <div>
                                <span className="text-dark-500">Source:</span>
                                <span className="ml-2 text-white">{previewAsset.sourceTool || 'Unknown'}</span>
                            </div>
                            <div>
                                <span className="text-dark-500">Created:</span>
                                <span className="ml-2 text-white">{formatDate(previewAsset.createdAt)}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-6">
                            <button
                                onClick={() => handleDelete(previewAsset.id)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 font-medium hover:bg-red-500/30"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
