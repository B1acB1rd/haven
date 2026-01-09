import { useState, useRef } from 'react'
import {
    X,
    Sparkles,
    ExternalLink,
    RefreshCw,
    ArrowLeft,
    ArrowRight,
    Bot,
    Image,
    Music,
    Video,
    MessageSquare
} from 'lucide-react'

interface AIAssistantProps {
    isOpen: boolean
    onClose: () => void
}

interface AIPlatform {
    id: string
    name: string
    url: string
    icon: React.ReactNode
    color: string
    category: string
}

const aiPlatforms: AIPlatform[] = [
    // Chat AI
    { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/', icon: <Sparkles className="w-6 h-6" />, color: 'from-blue-500 to-purple-600', category: 'Chat' },
    { id: 'chatgpt', name: 'ChatGPT', url: 'https://chat.openai.com/', icon: <Bot className="w-6 h-6" />, color: 'from-green-500 to-teal-600', category: 'Chat' },
    { id: 'claude', name: 'Claude', url: 'https://claude.ai/', icon: <MessageSquare className="w-6 h-6" />, color: 'from-orange-500 to-amber-600', category: 'Chat' },
    { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/', icon: <Sparkles className="w-6 h-6" />, color: 'from-cyan-500 to-blue-600', category: 'Chat' },
    // Image AI
    { id: 'dalle', name: 'DALL-E', url: 'https://openai.com/dall-e-3', icon: <Image className="w-6 h-6" />, color: 'from-pink-500 to-rose-600', category: 'Image' },
    { id: 'midjourney', name: 'Midjourney', url: 'https://www.midjourney.com/', icon: <Image className="w-6 h-6" />, color: 'from-indigo-500 to-violet-600', category: 'Image' },
    { id: 'leonardo', name: 'Leonardo.ai', url: 'https://leonardo.ai/', icon: <Image className="w-6 h-6" />, color: 'from-purple-500 to-fuchsia-600', category: 'Image' },
    // Audio AI
    { id: 'suno', name: 'Suno', url: 'https://suno.ai/', icon: <Music className="w-6 h-6" />, color: 'from-red-500 to-orange-600', category: 'Audio' },
    { id: 'elevenlabs', name: 'ElevenLabs', url: 'https://elevenlabs.io/', icon: <Music className="w-6 h-6" />, color: 'from-slate-500 to-gray-600', category: 'Audio' },
    // Video AI
    { id: 'runway', name: 'Runway', url: 'https://runwayml.com/', icon: <Video className="w-6 h-6" />, color: 'from-emerald-500 to-green-600', category: 'Video' },
    { id: 'pika', name: 'Pika', url: 'https://pika.art/', icon: <Video className="w-6 h-6" />, color: 'from-yellow-500 to-amber-600', category: 'Video' },
]

export default function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
    const [selectedPlatform, setSelectedPlatform] = useState<AIPlatform | null>(null)
    const webviewRef = useRef<HTMLWebViewElement>(null)

    const handleBack = () => {
        const webview = webviewRef.current as any
        if (webview?.canGoBack?.()) webview.goBack()
    }

    const handleForward = () => {
        const webview = webviewRef.current as any
        if (webview?.canGoForward?.()) webview.goForward()
    }

    const handleRefresh = () => {
        const webview = webviewRef.current as any
        if (webview?.reload) webview.reload()
    }

    const handleSelectPlatform = (platform: AIPlatform) => {
        setSelectedPlatform(platform)
    }

    const handleBackToSelector = () => {
        setSelectedPlatform(null)
    }

    if (!isOpen) return null

    return (
        <div className="w-[420px] h-full bg-dark-900 border-l border-dark-700 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700 flex-shrink-0">
                <div className="flex items-center gap-2">
                    {selectedPlatform ? (
                        <>
                            <button
                                onClick={handleBackToSelector}
                                className="p-1 rounded hover:bg-dark-800 text-dark-400 hover:text-white"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedPlatform.color} flex items-center justify-center text-white`}>
                                {selectedPlatform.icon}
                            </div>
                            <span className="font-semibold text-white">{selectedPlatform.name}</span>
                        </>
                    ) : (
                        <>
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold text-white">AI Assistant</span>
                        </>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            {selectedPlatform ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Webview Controls */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-dark-800 border-b border-dark-700 flex-shrink-0">
                        <button onClick={handleBack} className="p-1.5 rounded text-dark-400 hover:text-white hover:bg-dark-700">
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <button onClick={handleForward} className="p-1.5 rounded text-dark-400 hover:text-white hover:bg-dark-700">
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button onClick={handleRefresh} className="p-1.5 rounded text-dark-400 hover:text-white hover:bg-dark-700">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <div className="flex-1" />
                        <button
                            onClick={() => window.open(selectedPlatform.url, '_blank')}
                            className="text-xs text-accent-primary hover:underline flex items-center gap-1"
                        >
                            Open Full <ExternalLink className="w-3 h-3" />
                        </button>
                    </div>

                    {/* AI Platform Webview */}
                    <webview
                        ref={webviewRef}
                        src={selectedPlatform.url}
                        className="flex-1 w-full"
                        partition={`persist:${selectedPlatform.id}`}
                        style={{ display: 'flex' }}
                    />
                </div>
            ) : (
                /* Platform Selector */
                <div className="flex-1 overflow-auto p-4">
                    <p className="text-sm text-dark-400 mb-4">
                        Select an AI platform to use. Your logins are saved.
                    </p>

                    {/* Chat AI */}
                    <div className="mb-6">
                        <h3 className="text-xs font-medium text-dark-500 uppercase tracking-wide mb-3">Chat AI</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {aiPlatforms.filter(p => p.category === 'Chat').map((platform) => (
                                <button
                                    key={platform.id}
                                    onClick={() => handleSelectPlatform(platform)}
                                    className="group p-4 rounded-xl bg-dark-800 border border-dark-700 hover:border-dark-500 transition-all text-left"
                                >
                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
                                        {platform.icon}
                                    </div>
                                    <p className="font-medium text-white text-sm">{platform.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Image AI */}
                    <div className="mb-6">
                        <h3 className="text-xs font-medium text-dark-500 uppercase tracking-wide mb-3">Image AI</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {aiPlatforms.filter(p => p.category === 'Image').map((platform) => (
                                <button
                                    key={platform.id}
                                    onClick={() => handleSelectPlatform(platform)}
                                    className="group p-4 rounded-xl bg-dark-800 border border-dark-700 hover:border-dark-500 transition-all text-left"
                                >
                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
                                        {platform.icon}
                                    </div>
                                    <p className="font-medium text-white text-sm">{platform.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Audio AI */}
                    <div className="mb-6">
                        <h3 className="text-xs font-medium text-dark-500 uppercase tracking-wide mb-3">Audio AI</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {aiPlatforms.filter(p => p.category === 'Audio').map((platform) => (
                                <button
                                    key={platform.id}
                                    onClick={() => handleSelectPlatform(platform)}
                                    className="group p-4 rounded-xl bg-dark-800 border border-dark-700 hover:border-dark-500 transition-all text-left"
                                >
                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
                                        {platform.icon}
                                    </div>
                                    <p className="font-medium text-white text-sm">{platform.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Video AI */}
                    <div className="mb-6">
                        <h3 className="text-xs font-medium text-dark-500 uppercase tracking-wide mb-3">Video AI</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {aiPlatforms.filter(p => p.category === 'Video').map((platform) => (
                                <button
                                    key={platform.id}
                                    onClick={() => handleSelectPlatform(platform)}
                                    className="group p-4 rounded-xl bg-dark-800 border border-dark-700 hover:border-dark-500 transition-all text-left"
                                >
                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
                                        {platform.icon}
                                    </div>
                                    <p className="font-medium text-white text-sm">{platform.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
