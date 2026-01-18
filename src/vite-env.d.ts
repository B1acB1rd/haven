/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_AI_API_KEY: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

// Electron API type declarations
interface ElectronAPI {
    window: {
        minimize: () => Promise<void>
        maximize: () => Promise<void>
        close: () => Promise<void>
        isMaximized: () => Promise<boolean>
    }
    projects: {
        getAll: () => Promise<Array<{
            id: string
            name: string
            description: string | null
            type: string
            created_at: string
            updated_at: string
        }>>
        get: (id: string) => Promise<{
            id: string
            name: string
            description: string | null
            type: string
            created_at: string
            updated_at: string
        } | null>
        create: (data: { name: string; description?: string; type?: string }) => Promise<{
            id: string
            name: string
            description: string | null
            type: string
            created_at: string
            updated_at: string
        }>
        update: (id: string, data: { name?: string; description?: string; type?: string }) => Promise<{
            id: string
            name: string
            description: string | null
            type: string
            created_at: string
            updated_at: string
        } | null>
        delete: (id: string) => Promise<boolean>
    }
    assets: {
        getAll: (projectId?: string) => Promise<Array<{
            id: string
            project_id: string | null
            name: string
            type: string
            source_tool: string | null
            file_path: string | null
            file_size: number | null
            created_at: string
        }>>
        get: (id: string) => Promise<{
            id: string
            project_id: string | null
            name: string
            type: string
            source_tool: string | null
            file_path: string | null
            file_size: number | null
            created_at: string
        } | null>
        create: (data: { name: string; type: string; project_id?: string; source_tool?: string; filePath?: string }) => Promise<{
            id: string
            project_id: string | null
            name: string
            type: string
            source_tool: string | null
            file_path: string | null
            file_size: number | null
            created_at: string
        }>
        delete: (id: string) => Promise<boolean>
        selectFile: () => Promise<{ filePath: string; fileName: string; fileType: string } | null>
    }
    ai: {
        generate: (action: string, content: string, platform?: string) => Promise<{ success: boolean; response?: string; error?: string }>
        chat: (message: string) => Promise<{ success: boolean; response?: string; error?: string }>
        setApiKey: (key: string) => Promise<void>
        getApiKey: () => Promise<string | null>
        isConfigured: () => Promise<boolean>
        getHistory: (limit?: number) => Promise<Array<{
            id: string
            tool_id: string
            mode: string
            prompt: string
            response: string
            created_at: string
        }>>
    }
    settings: {
        get: (key: string) => Promise<unknown>
        set: (key: string, value: unknown) => Promise<void>
    }
    adBlocker: {
        isEnabled: () => Promise<boolean>
        setEnabled: (enabled: boolean) => Promise<void>
        getStats: () => Promise<{
            totalBlocked: number
            browserStats?: {
                blocked: number
                allowed: number
                lastBlocked: string[]
            }
        }>
        resetStats: () => Promise<void>
    }
}

declare global {
    interface Window {
        electronAPI: ElectronAPI
    }
}

export { }
