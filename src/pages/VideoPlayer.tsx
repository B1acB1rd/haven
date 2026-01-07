import { useRef } from 'react'
import { useTabs } from '../context/TabsContext'
import {
    Maximize,
    FolderOpen,
    Youtube,
    Video,
    X,
    Plus
} from 'lucide-react'

export default function VideoPlayer() {
    const { videoTabs, activeVideoTabId, addVideoTab, closeVideoTab, setActiveVideoTab } = useTabs()
    const videoRef = useRef<HTMLVideoElement>(null)

    const activeTab = videoTabs.find(t => t.id === activeVideoTabId)

    const openYoutubeVideo = (url: string) => {
        if (!url.trim()) return

        // Extract video ID from YouTube URL
        let videoId = ''
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/)
        if (match) {
            videoId = match[1]
        } else if (url.length === 11) {
            videoId = url
        }

        if (videoId) {
            addVideoTab({
                name: `YouTube Video`,
                type: 'youtube',
                src: `https://www.youtube.com/embed/${videoId}?autoplay=1`
            })
        }
    }

    const toggleFullscreen = () => {
        if (videoRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen()
            } else {
                videoRef.current.requestFullscreen()
            }
        }
    }

    return (
        <div className="h-full flex flex-col">
            {/* Tab Bar */}
            {videoTabs.length > 0 && (
                <div className="flex items-center gap-1 px-4 pt-2 bg-dark-900 border-b border-dark-700 overflow-x-auto">
                    {videoTabs.map((tab) => (
                        <div
                            key={tab.id}
                            className={`group flex items-center gap-2 px-3 py-2 rounded-t-lg cursor-pointer transition-colors min-w-[150px] max-w-[200px]
                ${activeVideoTabId === tab.id
                                    ? 'bg-dark-800 text-white'
                                    : 'bg-dark-900 text-dark-400 hover:text-white hover:bg-dark-800/50'
                                }`}
                            onClick={() => setActiveVideoTab(tab.id)}
                        >
                            {tab.type === 'youtube' ? <Youtube className="w-4 h-4 flex-shrink-0 text-red-500" /> : <Video className="w-4 h-4 flex-shrink-0" />}
                            <span className="truncate text-sm">{tab.name}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); closeVideoTab(tab.id); }}
                                className="ml-auto opacity-0 group-hover:opacity-100 hover:text-red-400"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                    <button className="p-2 text-dark-400 hover:text-white" onClick={() => setActiveVideoTab(null)}>
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Video Content */}
            {activeTab ? (
                <div className="flex-1 flex flex-col bg-black overflow-hidden">
                    {activeTab.type === 'youtube' ? (
                        <iframe
                            src={activeTab.src}
                            className="flex-1 w-full h-full"
                            style={{ border: 'none' }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <video
                                ref={videoRef}
                                src={activeTab.src}
                                className="flex-1 w-full h-full object-contain bg-black"
                                style={{ maxHeight: 'calc(100% - 52px)' }}
                                controls
                            />
                            {/* Controls */}
                            <div className="flex items-center gap-4 px-4 py-3 bg-dark-900 border-t border-dark-700 flex-shrink-0">
                                <div className="flex-1" />
                                <button onClick={toggleFullscreen} className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-white">
                                    <Maximize className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Video Selection */
                <div className="flex-1 p-8 overflow-auto">
                    <div className="max-w-3xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-white mb-2">Video Player</h1>
                            <p className="text-dark-400">Watch local videos or stream from YouTube</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Local Video */}
                            <button
                                onClick={async () => {
                                    if (!(window.electronAPI as any)?.dialog) {
                                        alert('Local file access requires the Electron app.')
                                        return
                                    }
                                    const result = await (window.electronAPI as any).dialog.openVideo()
                                    if (result) {
                                        addVideoTab({
                                            name: result.name,
                                            type: 'local',
                                            src: `local-file://${result.path}`
                                        })
                                    }
                                }}
                                className="group p-8 rounded-xl bg-dark-800 border border-dark-700 hover:border-dark-500 
                                         transition-all duration-200 text-center"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 
                                                flex items-center justify-center mx-auto mb-4 text-white
                                                group-hover:scale-110 transition-transform">
                                    <FolderOpen className="w-8 h-8" />
                                </div>
                                <h3 className="font-semibold text-white text-lg mb-2">Open Local File</h3>
                                <p className="text-sm text-dark-400">MP4, WebM, MKV, AVI, MOV</p>
                            </button>

                            {/* YouTube */}
                            <div className="p-8 rounded-xl bg-dark-800 border border-dark-700">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-500 
                                                flex items-center justify-center mx-auto mb-4 text-white">
                                    <Youtube className="w-8 h-8" />
                                </div>
                                <h3 className="font-semibold text-white text-lg mb-4 text-center">YouTube Video</h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Paste YouTube URL..."
                                        className="flex-1 px-3 py-2 rounded-lg bg-dark-900 border border-dark-600 
                                                   text-white placeholder-dark-500 focus:outline-none focus:border-accent-primary"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                openYoutubeVideo((e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = ''
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={(e) => {
                                            const input = (e.target as HTMLElement).parentElement?.querySelector('input')
                                            if (input) {
                                                openYoutubeVideo(input.value)
                                                input.value = ''
                                            }
                                        }}
                                        className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-500"
                                    >
                                        Play
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
