import { useTabs } from '../context/TabsContext'
import {
    Twitter,
    Linkedin,
    Youtube,
    Facebook,
    ArrowLeft,
    ArrowRight,
    RefreshCw,
    ExternalLink,
    X,
    Plus,
    BookOpen,
    MessageCircle,
    Instagram,
    Music,
    Image,
    Users,
    AtSign,
    MessageSquare,
    Camera
} from 'lucide-react'

interface SocialPlatform {
    id: string
    name: string
    url: string
    icon: React.ReactNode
    color: string
}

const platforms: SocialPlatform[] = [
    { id: 'x', name: 'X (Twitter)', url: 'https://x.com', icon: <Twitter className="w-5 h-5" />, color: 'from-gray-800 to-gray-700' },
    { id: 'instagram', name: 'Instagram', url: 'https://instagram.com', icon: <Instagram className="w-5 h-5" />, color: 'from-pink-600 to-purple-600' },
    { id: 'tiktok', name: 'TikTok', url: 'https://tiktok.com', icon: <Music className="w-5 h-5" />, color: 'from-gray-900 to-pink-500' },
    { id: 'linkedin', name: 'LinkedIn', url: 'https://linkedin.com', icon: <Linkedin className="w-5 h-5" />, color: 'from-blue-700 to-blue-600' },
    { id: 'youtube', name: 'YouTube', url: 'https://youtube.com', icon: <Youtube className="w-5 h-5" />, color: 'from-red-700 to-red-600' },
    { id: 'facebook', name: 'Facebook', url: 'https://facebook.com', icon: <Facebook className="w-5 h-5" />, color: 'from-blue-600 to-blue-500' },
    { id: 'pinterest', name: 'Pinterest', url: 'https://pinterest.com', icon: <Image className="w-5 h-5" />, color: 'from-red-600 to-red-500' },
    { id: 'discord', name: 'Discord', url: 'https://discord.com', icon: <Users className="w-5 h-5" />, color: 'from-indigo-600 to-indigo-500' },
    { id: 'threads', name: 'Threads', url: 'https://threads.net', icon: <AtSign className="w-5 h-5" />, color: 'from-gray-800 to-gray-700' },
    { id: 'reddit', name: 'Reddit', url: 'https://reddit.com', icon: <MessageCircle className="w-5 h-5" />, color: 'from-orange-600 to-orange-500' },
    { id: 'whatsapp', name: 'WhatsApp', url: 'https://web.whatsapp.com', icon: <MessageSquare className="w-5 h-5" />, color: 'from-green-600 to-green-500' },
    { id: 'snapchat', name: 'Snapchat', url: 'https://web.snapchat.com', icon: <Camera className="w-5 h-5" />, color: 'from-yellow-400 to-yellow-300' },
    { id: 'medium', name: 'Medium', url: 'https://medium.com', icon: <BookOpen className="w-5 h-5" />, color: 'from-gray-900 to-gray-800' },
]

export default function SocialHub() {
    const { socialTabs: tabs, activeSocialTabId: activeTabId, openSocialTab, closeSocialTab: closeTab, setActiveSocialTab: setActiveTabId } = useTabs()

    const openPlatform = (platform: SocialPlatform) => {
        openSocialTab({
            id: platform.id,
            name: platform.name,
            url: platform.url,
            icon: platform.id,
            color: platform.color
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
                            {tab.platform.icon}
                            <span className="flex-1 truncate text-sm font-medium">{tab.platform.name}</span>
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

            {/* WebView or Platform Selector */}
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
                                key={`${tab.id}-${tab.platform.id}`}
                                data-tab={tab.id}
                                src={tab.url}
                                className="absolute inset-0 w-full h-full"
                                style={{ display: tab.id === activeTabId ? 'flex' : 'none' }}
                                // @ts-ignore - webview attributes
                                partition={`persist:social-${tab.platform.id}`}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-white mb-2">Social Hub</h1>
                            <p className="text-dark-400">Research, engage, and manage your social presence</p>
                        </div>

                        {/* Platforms Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {platforms.map((platform) => (
                                <button
                                    key={platform.id}
                                    onClick={() => openPlatform(platform)}
                                    className="group p-6 rounded-xl bg-dark-800 border border-dark-700 
                             hover:border-accent-primary/50 transition-all duration-200 text-left"
                                >
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${platform.color} 
                                  flex items-center justify-center text-white mb-4
                                  group-hover:scale-110 transition-transform`}>
                                        {platform.icon}
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-accent-primary transition-colors">
                                        {platform.name}
                                    </h3>
                                    <p className="text-sm text-dark-400">Click to open</p>
                                </button>
                            ))}
                        </div>

                        {/* Info Section */}
                        <div className="mt-8 p-6 rounded-xl bg-dark-800/50 border border-dark-700">
                            <h3 className="text-lg font-semibold text-white mb-2">About Social Hub</h3>
                            <p className="text-dark-400 leading-relaxed">
                                Access your social platforms directly within Creative Hub. Each platform maintains
                                its own isolated session, so your logins persist between sessions. Use this space
                                to research trending content, engage with your audience, and gather inspiration
                                for your creative projects.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
