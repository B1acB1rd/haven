import { useTabs } from '../context/TabsContext'
import { useState, useRef } from 'react'
import {
    Music,
    Headphones,
    Radio,
    ArrowLeft,
    ArrowRight,
    RefreshCw,
    ExternalLink,
    X,
    Plus,
    FolderOpen,
    Play,
    Pause
} from 'lucide-react'

interface MusicPlatform {
    id: string
    name: string
    url: string
    icon: React.ReactNode
    color: string
}

const platforms: MusicPlatform[] = [
    { id: 'spotify', name: 'Spotify', url: 'https://open.spotify.com', icon: <Music className="w-6 h-6" />, color: 'from-green-600 to-green-500' },
    { id: 'apple-music', name: 'Apple Music', url: 'https://music.apple.com', icon: <Music className="w-6 h-6" />, color: 'from-pink-600 to-red-500' },
    { id: 'youtube-music', name: 'YouTube Music', url: 'https://music.youtube.com', icon: <Music className="w-6 h-6" />, color: 'from-red-600 to-red-500' },
    { id: 'soundcloud', name: 'SoundCloud', url: 'https://soundcloud.com', icon: <Radio className="w-6 h-6" />, color: 'from-orange-600 to-orange-500' },
    { id: 'deezer', name: 'Deezer', url: 'https://deezer.com', icon: <Headphones className="w-6 h-6" />, color: 'from-purple-600 to-purple-500' },
    { id: 'tidal', name: 'Tidal', url: 'https://tidal.com', icon: <Music className="w-6 h-6" />, color: 'from-gray-800 to-gray-700' },
]

export default function MusicHub() {
    const { musicTabs, activeMusicTabId, openMusicTab, closeMusicTab, setActiveMusicTab } = useTabs()
    const [localMusic, setLocalMusic] = useState<{ path: string; name: string } | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const audioRef = useRef<HTMLAudioElement>(null)

    const openPlatform = (platform: MusicPlatform) => {
        setLocalMusic(null) // Close local player when opening a platform
        openMusicTab({
            id: platform.id,
            name: platform.name,
            url: platform.url,
            icon: platform.id,
            color: platform.color
        })
    }

    const openLocalMusic = async () => {
        try {
            // Use electron dialog to select audio file
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'audio/*'
            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) {
                    const url = URL.createObjectURL(file)
                    setLocalMusic({ path: url, name: file.name })
                    setActiveMusicTab(null) // Close any web platform
                    setIsPlaying(true)
                }
            }
            input.click()
        } catch (error) {
            console.error('Failed to open music file:', error)
        }
    }

    const togglePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause()
            } else {
                audioRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    const activeTab = musicTabs.find(t => t.id === activeMusicTabId)

    return (
        <div className="h-full flex flex-col">
            {/* Tab Bar */}
            {musicTabs.length > 0 && (
                <div className="flex items-center gap-1 px-4 pt-2 bg-dark-900 border-b border-dark-700 overflow-x-auto">
                    {musicTabs.map((tab) => (
                        <div
                            key={tab.id}
                            className={`group flex items-center gap-2 px-3 py-2 rounded-t-lg cursor-pointer transition-colors min-w-[150px] max-w-[200px]
                ${activeMusicTabId === tab.id
                                    ? 'bg-dark-800 text-white'
                                    : 'bg-dark-900 text-dark-400 hover:text-white hover:bg-dark-800/50'
                                }`}
                            onClick={() => setActiveMusicTab(tab.id)}
                        >
                            <Music className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate text-sm">{tab.platform.name}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); closeMusicTab(tab.id); }}
                                className="ml-auto opacity-0 group-hover:opacity-100 hover:text-red-400"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                    <button className="p-2 text-dark-400 hover:text-white" onClick={() => setActiveMusicTab(null)}>
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Content */}
            {activeTab ? (
                <div className="flex-1 flex flex-col">
                    {/* WebView Toolbar */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-dark-800 border-b border-dark-700">
                        <button
                            onClick={() => {
                                const webview = document.querySelector(`webview[data-tab="${activeTab.id}"]`) as any;
                                if (webview?.canGoBack && webview.canGoBack()) webview.goBack();
                            }}
                            className="p-1.5 rounded-md text-dark-400 hover:text-white hover:bg-dark-700"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                                const webview = document.querySelector(`webview[data-tab="${activeTab.id}"]`) as any;
                                if (webview?.canGoForward && webview.canGoForward()) webview.goForward();
                            }}
                            className="p-1.5 rounded-md text-dark-400 hover:text-white hover:bg-dark-700"
                        >
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                                const webview = document.querySelector(`webview[data-tab="${activeTab.id}"]`) as any;
                                if (webview?.reload) webview.reload();
                            }}
                            className="p-1.5 rounded-md text-dark-400 hover:text-white hover:bg-dark-700"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <div className="flex-1 px-3 py-1.5 rounded-lg bg-dark-900 text-sm text-dark-300 truncate">
                            {activeTab.url}
                        </div>
                        <button
                            onClick={() => window.open(activeTab.url, '_blank')}
                            className="p-1.5 rounded-md text-dark-400 hover:text-white hover:bg-dark-700"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>

                    {/* WebView - Render ALL tabs, show only active */}
                    <div className="flex-1 relative">
                        {musicTabs.map((tab) => (
                            <webview
                                key={`music-${tab.id}`}
                                data-tab={tab.id}
                                src={tab.url}
                                className="absolute inset-0 w-full h-full"
                                style={{ display: tab.id === activeMusicTabId ? 'flex' : 'none' }}
                                // @ts-ignore - webview attributes
                                partition={`persist:music-${tab.id}`}
                            />
                        ))}
                    </div>
                </div>
            ) : localMusic ? (
                /* Local Music Player */
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-dark-900">
                    <div className="text-center mb-8">
                        <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 
                                      flex items-center justify-center mx-auto mb-6 shadow-xl">
                            <Music className="w-16 h-16 text-white" />
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2 max-w-md truncate">
                            {localMusic.name}
                        </h2>
                        <p className="text-dark-400 text-sm">Local File</p>
                    </div>

                    <audio
                        ref={audioRef}
                        src={localMusic.path}
                        autoPlay
                        onEnded={() => setIsPlaying(false)}
                        className="hidden"
                    />

                    <div className="flex items-center gap-4">
                        <button
                            onClick={togglePlayPause}
                            className="w-16 h-16 rounded-full bg-accent-primary flex items-center justify-center
                                     hover:scale-105 transition-transform"
                        >
                            {isPlaying ? (
                                <Pause className="w-8 h-8 text-white" />
                            ) : (
                                <Play className="w-8 h-8 text-white ml-1" />
                            )}
                        </button>
                    </div>

                    <button
                        onClick={() => setLocalMusic(null)}
                        className="mt-8 text-dark-400 hover:text-white text-sm"
                    >
                        Close Player
                    </button>
                </div>
            ) : (
                /* Platform Selection */
                <div className="flex-1 p-8 overflow-auto">
                    <div className="max-w-5xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-white mb-2">Music Hub</h1>
                            <p className="text-dark-400">Stream your favorite music from any platform or play local files</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {/* Local Music Card */}
                            <button
                                onClick={openLocalMusic}
                                className="group p-6 rounded-xl bg-dark-800 border-2 border-dashed border-dark-600 
                                         hover:border-accent-primary hover:bg-dark-700 transition-all duration-200 text-left"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 
                                              flex items-center justify-center mb-4 text-white
                                              group-hover:scale-110 transition-transform">
                                    <FolderOpen className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold text-white mb-1">Local Music</h3>
                                <p className="text-sm text-dark-400">Play audio files from your computer</p>
                            </button>

                            {platforms.map((platform) => (
                                <button
                                    key={platform.id}
                                    onClick={() => openPlatform(platform)}
                                    className="group p-6 rounded-xl bg-dark-800 border border-dark-700 hover:border-dark-500 
                                             transition-all duration-200 text-left"
                                >
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platform.color} 
                                                    flex items-center justify-center mb-4 text-white
                                                    group-hover:scale-110 transition-transform`}>
                                        {platform.icon}
                                    </div>
                                    <h3 className="font-semibold text-white mb-1">{platform.name}</h3>
                                    <p className="text-sm text-dark-400">Click to open</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
