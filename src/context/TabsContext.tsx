import { createContext, useContext, useState, ReactNode } from 'react'

// Types
interface AITool {
    id: string
    name: string
    url: string
    category: string
    description: string
    icon: string
}

interface Tab {
    id: string
    tool: AITool
    url: string
}

interface SocialPlatform {
    id: string
    name: string
    url: string
    icon: string
    color: string
}

interface SocialTab {
    id: string
    platform: SocialPlatform
    url: string
}

interface MusicPlatform {
    id: string
    name: string
    url: string
    icon: string
    color: string
}

interface MusicTab {
    id: string
    platform: MusicPlatform
    url: string
}

interface VideoTab {
    id: string
    name: string
    type: 'local' | 'youtube'
    src: string
}

interface DocumentTab {
    id: string
    name: string
    type: 'pdf' | 'url'
    src: string
}

interface TabsContextType {
    // AI Tools tabs
    aiTabs: Tab[]
    activeAiTabId: string | null
    openAiTab: (tool: AITool) => void
    closeAiTab: (id: string) => void
    setActiveAiTab: (id: string | null) => void

    // Social Hub tabs
    socialTabs: SocialTab[]
    activeSocialTabId: string | null
    openSocialTab: (platform: SocialPlatform) => void
    closeSocialTab: (id: string) => void
    setActiveSocialTab: (id: string | null) => void

    // Music Hub tabs
    musicTabs: MusicTab[]
    activeMusicTabId: string | null
    openMusicTab: (platform: MusicPlatform) => void
    closeMusicTab: (id: string) => void
    setActiveMusicTab: (id: string | null) => void

    // Video tabs
    videoTabs: VideoTab[]
    activeVideoTabId: string | null
    addVideoTab: (tab: Omit<VideoTab, 'id'>) => void
    closeVideoTab: (id: string) => void
    setActiveVideoTab: (id: string | null) => void

    // Document tabs
    documentTabs: DocumentTab[]
    activeDocumentTabId: string | null
    addDocumentTab: (tab: Omit<DocumentTab, 'id'>) => void
    closeDocumentTab: (id: string) => void
    setActiveDocumentTab: (id: string | null) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

export function TabsProvider({ children }: { children: ReactNode }) {
    // AI Tools state
    const [aiTabs, setAiTabs] = useState<Tab[]>([])
    const [activeAiTabId, setActiveAiTabId] = useState<string | null>(null)

    // Social Hub state
    const [socialTabs, setSocialTabs] = useState<SocialTab[]>([])
    const [activeSocialTabId, setActiveSocialTabId] = useState<string | null>(null)

    // Music Hub state
    const [musicTabs, setMusicTabs] = useState<MusicTab[]>([])
    const [activeMusicTabId, setActiveMusicTabId] = useState<string | null>(null)

    // Video state
    const [videoTabs, setVideoTabs] = useState<VideoTab[]>([])
    const [activeVideoTabId, setActiveVideoTabId] = useState<string | null>(null)

    // Document state
    const [documentTabs, setDocumentTabs] = useState<DocumentTab[]>([])
    const [activeDocumentTabId, setActiveDocumentTabId] = useState<string | null>(null)

    // AI Tools functions
    const openAiTab = (tool: AITool) => {
        const existingTab = aiTabs.find(t => t.tool.id === tool.id)
        if (existingTab) {
            setActiveAiTabId(existingTab.id)
        } else {
            const newTab: Tab = {
                id: `ai-${Date.now()}`,
                tool,
                url: tool.url
            }
            setAiTabs(prev => [...prev, newTab])
            setActiveAiTabId(newTab.id)
        }
    }

    const closeAiTab = (id: string) => {
        setAiTabs(prev => prev.filter(t => t.id !== id))
        if (activeAiTabId === id) {
            const remaining = aiTabs.filter(t => t.id !== id)
            setActiveAiTabId(remaining.length > 0 ? remaining[remaining.length - 1].id : null)
        }
    }

    // Social Hub functions
    const openSocialTab = (platform: SocialPlatform) => {
        const existingTab = socialTabs.find(t => t.platform.id === platform.id)
        if (existingTab) {
            setActiveSocialTabId(existingTab.id)
        } else {
            const newTab: SocialTab = {
                id: `social-${Date.now()}`,
                platform,
                url: platform.url
            }
            setSocialTabs(prev => [...prev, newTab])
            setActiveSocialTabId(newTab.id)
        }
    }

    const closeSocialTab = (id: string) => {
        setSocialTabs(prev => prev.filter(t => t.id !== id))
        if (activeSocialTabId === id) {
            const remaining = socialTabs.filter(t => t.id !== id)
            setActiveSocialTabId(remaining.length > 0 ? remaining[remaining.length - 1].id : null)
        }
    }

    // Music Hub functions
    const openMusicTab = (platform: MusicPlatform) => {
        const existingTab = musicTabs.find(t => t.platform.id === platform.id)
        if (existingTab) {
            setActiveMusicTabId(existingTab.id)
        } else {
            const newTab: MusicTab = {
                id: `music-${Date.now()}`,
                platform,
                url: platform.url
            }
            setMusicTabs(prev => [...prev, newTab])
            setActiveMusicTabId(newTab.id)
        }
    }

    const closeMusicTab = (id: string) => {
        setMusicTabs(prev => prev.filter(t => t.id !== id))
        if (activeMusicTabId === id) {
            const remaining = musicTabs.filter(t => t.id !== id)
            setActiveMusicTabId(remaining.length > 0 ? remaining[remaining.length - 1].id : null)
        }
    }

    // Video functions
    const addVideoTab = (tab: Omit<VideoTab, 'id'>) => {
        const newTab: VideoTab = {
            id: `video-${Date.now()}`,
            ...tab
        }
        setVideoTabs(prev => [...prev, newTab])
        setActiveVideoTabId(newTab.id)
    }

    const closeVideoTab = (id: string) => {
        setVideoTabs(prev => prev.filter(t => t.id !== id))
        if (activeVideoTabId === id) {
            const remaining = videoTabs.filter(t => t.id !== id)
            setActiveVideoTabId(remaining.length > 0 ? remaining[remaining.length - 1].id : null)
        }
    }

    // Document functions
    const addDocumentTab = (tab: Omit<DocumentTab, 'id'>) => {
        const newTab: DocumentTab = {
            id: `doc-${Date.now()}`,
            ...tab
        }
        setDocumentTabs(prev => [...prev, newTab])
        setActiveDocumentTabId(newTab.id)
    }

    const closeDocumentTab = (id: string) => {
        setDocumentTabs(prev => prev.filter(t => t.id !== id))
        if (activeDocumentTabId === id) {
            const remaining = documentTabs.filter(t => t.id !== id)
            setActiveDocumentTabId(remaining.length > 0 ? remaining[remaining.length - 1].id : null)
        }
    }

    return (
        <TabsContext.Provider value={{
            aiTabs,
            activeAiTabId,
            openAiTab,
            closeAiTab,
            setActiveAiTab: setActiveAiTabId,
            socialTabs,
            activeSocialTabId,
            openSocialTab,
            closeSocialTab,
            setActiveSocialTab: setActiveSocialTabId,
            musicTabs,
            activeMusicTabId,
            openMusicTab,
            closeMusicTab,
            setActiveMusicTab: setActiveMusicTabId,
            videoTabs,
            activeVideoTabId,
            addVideoTab,
            closeVideoTab,
            setActiveVideoTab: setActiveVideoTabId,
            documentTabs,
            activeDocumentTabId,
            addDocumentTab,
            closeDocumentTab,
            setActiveDocumentTab: setActiveDocumentTabId
        }}>
            {children}
        </TabsContext.Provider>
    )
}

export function useTabs() {
    const context = useContext(TabsContext)
    if (!context) {
        throw new Error('useTabs must be used within a TabsProvider')
    }
    return context
}
