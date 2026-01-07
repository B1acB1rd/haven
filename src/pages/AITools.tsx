import { useState } from 'react'
import {
    Bot,
    Sparkles,
    Music,
    Video,
    Image,
    FileText,
    RefreshCw,
    ArrowLeft,
    ArrowRight,
    ExternalLink,
    X,
    Plus
} from 'lucide-react'
import { useTabs } from '../context/TabsContext'

interface AITool {
    id: string
    name: string
    url: string
    icon: React.ReactNode
    category: string
    description: string
}

const aiTools: AITool[] = [
    { id: 'chatgpt', name: 'ChatGPT', url: 'https://chat.openai.com', icon: <Bot className="w-6 h-6" />, category: 'chat', description: 'OpenAI conversational AI' },
    { id: 'claude', name: 'Claude', url: 'https://claude.ai', icon: <Sparkles className="w-6 h-6" />, category: 'chat', description: 'Anthropic AI assistant' },
    { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com', icon: <Bot className="w-6 h-6" />, category: 'chat', description: 'Google AI assistant' },
    { id: 'midjourney', name: 'Midjourney', url: 'https://midjourney.com', icon: <Image className="w-6 h-6" />, category: 'image', description: 'AI image generation' },
    { id: 'dalle', name: 'DALL-E', url: 'https://labs.openai.com', icon: <Image className="w-6 h-6" />, category: 'image', description: 'OpenAI image creation' },
    { id: 'runway', name: 'Runway', url: 'https://runwayml.com', icon: <Video className="w-6 h-6" />, category: 'video', description: 'AI video generation' },
    { id: 'pika', name: 'Pika', url: 'https://pika.art', icon: <Video className="w-6 h-6" />, category: 'video', description: 'Text to video AI' },
    { id: 'suno', name: 'Suno AI', url: 'https://suno.ai', icon: <Music className="w-6 h-6" />, category: 'audio', description: 'AI music generation' },
    { id: 'elevenlabs', name: 'ElevenLabs', url: 'https://elevenlabs.io', icon: <Music className="w-6 h-6" />, category: 'audio', description: 'AI voice synthesis' },
    { id: 'jasper', name: 'Jasper', url: 'https://jasper.ai', icon: <FileText className="w-6 h-6" />, category: 'writing', description: 'AI content writing' },
]

export default function AITools() {
    const { aiTabs: tabs, activeAiTabId: activeTabId, openAiTab, closeAiTab: closeTab, setActiveAiTab: setActiveTabId } = useTabs()
    const [filter, setFilter] = useState<string>('all')

    const categories = ['all', 'chat', 'image', 'video', 'audio', 'writing']
    const filteredTools = filter === 'all' ? aiTools : aiTools.filter(t => t.category === filter)

    const openTool = (tool: AITool) => {
        // Convert to context format (without React nodes for icons)
        openAiTab({
            id: tool.id,
            name: tool.name,
            url: tool.url,
            category: tool.category,
            description: tool.description,
            icon: tool.id // Just store the id, we'll get the icon from aiTools
        })
    }

    const activeTab = tabs.find(t => t.id === activeTabId)

    return (
        <div className="h-full flex flex-col">
            {/* Tab Bar */}
            {tabs.length > 0 && (
                <div className="flex items-center gap-1 px-4 pt-2 bg-dark-900 border-b border-dark-700 overflow-x-auto">
                    {tabs.map((tab) => (
                        <div
                            key={tab.id}
                            className={`group flex items-center gap-2 px-3 py-2 rounded-t-lg cursor-pointer transition-colors min-w-[150px] max-w-[200px]
                ${activeTabId === tab.id
                                    ? 'bg-dark-800 text-white'
                                    : 'bg-dark-900 text-dark-400 hover:text-white hover:bg-dark-800/50'
                                }`}
                            onClick={() => setActiveTabId(tab.id)}
                        >
                            {tab.tool.icon}
                            <span className="flex-1 truncate text-sm font-medium">{tab.tool.name}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                                className="p-0.5 rounded hover:bg-dark-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => setActiveTabId(null)}
                        className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* WebView or Tool Selector */}
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

                    {/* WebView Container - Render ALL tabs, show only active */}
                    <div className="flex-1 bg-white relative">
                        {tabs.map((tab) => (
                            <webview
                                key={`${tab.id}-${tab.tool.id}`}
                                data-tab={tab.id}
                                src={tab.url}
                                className="absolute inset-0 w-full h-full"
                                style={{ display: tab.id === activeTabId ? 'flex' : 'none' }}
                                // @ts-ignore - webview attributes
                                partition={`persist:${tab.tool.id}`}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-6xl mx-auto">
                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-white mb-2">AI Tools</h1>
                            <p className="text-dark-400">Access your favorite AI creative tools in one place</p>
                        </div>

                        {/* Category Filter */}
                        <div className="flex items-center gap-2 mb-6">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setFilter(cat)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors
                    ${filter === cat
                                            ? 'bg-accent-primary text-white'
                                            : 'bg-dark-800 text-dark-400 hover:text-white hover:bg-dark-700'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Tools Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTools.map((tool) => (
                                <button
                                    key={tool.id}
                                    onClick={() => openTool(tool)}
                                    className="group p-5 rounded-xl bg-dark-800 border border-dark-700 
                             hover:border-accent-primary/50 transition-all duration-200 text-left"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dark-700 to-dark-600 
                                   flex items-center justify-center text-accent-primary
                                   group-hover:from-accent-primary/20 group-hover:to-accent-secondary/20 transition-colors">
                                            {tool.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-white mb-1 group-hover:text-accent-primary transition-colors">
                                                {tool.name}
                                            </h3>
                                            <p className="text-sm text-dark-400">{tool.description}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
