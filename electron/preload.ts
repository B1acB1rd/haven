import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Window controls
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

    // Projects
    projects: {
        getAll: () => ipcRenderer.invoke('projects:getAll'),
        get: (id: string) => ipcRenderer.invoke('projects:get', id),
        create: (data: { name: string; description?: string; type?: string }) =>
            ipcRenderer.invoke('projects:create', data),
        update: (id: string, data: { name?: string; description?: string; type?: string }) =>
            ipcRenderer.invoke('projects:update', id, data),
        delete: (id: string) => ipcRenderer.invoke('projects:delete', id),
    },

    // Assets
    assets: {
        getAll: (projectId?: string) => ipcRenderer.invoke('assets:getAll', projectId),
        get: (id: string) => ipcRenderer.invoke('assets:get', id),
        create: (data: { name: string; type: string; project_id?: string; source_tool?: string; filePath?: string }) =>
            ipcRenderer.invoke('assets:create', data),
        delete: (id: string) => ipcRenderer.invoke('assets:delete', id),
        selectFile: () => ipcRenderer.invoke('assets:selectFile'),
        onDownloaded: (callback: (asset: unknown) => void) => {
            ipcRenderer.on('asset:downloaded', (_event, asset) => callback(asset))
            return () => ipcRenderer.removeAllListeners('asset:downloaded')
        },
    },

    // AI / Gemini
    ai: {
        generate: (action: string, content: string, platform?: string) =>
            ipcRenderer.invoke('ai:generate', action, content, platform),
        chat: (message: string) => ipcRenderer.invoke('ai:chat', message),
        setApiKey: (key: string) => ipcRenderer.invoke('ai:setApiKey', key),
        getApiKey: () => ipcRenderer.invoke('ai:getApiKey'),
        isConfigured: () => ipcRenderer.invoke('ai:isConfigured'),
        getHistory: (limit?: number) => ipcRenderer.invoke('ai:getHistory', limit),
    },

    // Auth
    auth: {
        login: (email: string, password: string) => ipcRenderer.invoke('auth:login', email, password),
        register: (email: string, password: string, displayName?: string) =>
            ipcRenderer.invoke('auth:register', email, password, displayName),
        getSession: () => ipcRenderer.invoke('auth:getSession'),
        logout: (token: string) => ipcRenderer.invoke('auth:logout', token),
    },

    // Settings
    settings: {
        get: (key: string) => ipcRenderer.invoke('settings:get', key),
        set: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value),
    },

    // File Dialogs
    dialog: {
        openVideo: () => ipcRenderer.invoke('dialog:openVideo'),
        openDocument: () => ipcRenderer.invoke('dialog:openDocument'),
    },
});

// Type declarations for the exposed API
declare global {
    interface Window {
        electronAPI: {
            minimize: () => Promise<void>;
            maximize: () => Promise<void>;
            close: () => Promise<void>;
            isMaximized: () => Promise<boolean>;
            projects: {
                getAll: () => Promise<Array<{
                    id: string;
                    name: string;
                    description: string | null;
                    type: string;
                    assetCount: number;
                    createdAt: string;
                    updatedAt: string;
                }>>;
                get: (id: string) => Promise<any>;
                create: (data: { name: string; description?: string; type?: string }) => Promise<any>;
                update: (id: string, data: { name?: string; description?: string; type?: string }) => Promise<any>;
                delete: (id: string) => Promise<boolean>;
            };
            assets: {
                getAll: (projectId?: string) => Promise<Array<{
                    id: string;
                    projectId: string | null;
                    name: string;
                    type: string;
                    sourceTool: string | null;
                    filePath: string | null;
                    fileSize: number | null;
                    createdAt: string;
                }>>;
                get: (id: string) => Promise<any>;
                create: (data: { name: string; type: string; project_id?: string; source_tool?: string; filePath?: string }) => Promise<any>;
                delete: (id: string) => Promise<boolean>;
                selectFile: () => Promise<{ filePath: string; fileName: string; fileType: string } | null>;
            };
            ai: {
                generate: (action: string, content: string, platform?: string) => Promise<{ success: boolean; response?: string; error?: string }>;
                chat: (message: string) => Promise<{ success: boolean; response?: string; error?: string }>;
                setApiKey: (key: string) => Promise<void>;
                getApiKey: () => Promise<string | null>;
                isConfigured: () => Promise<boolean>;
                getHistory: (limit?: number) => Promise<any[]>;
            };
            auth: {
                login: (email: string, password: string) => Promise<{ success: boolean; token?: string; user?: any; error?: string }>;
                register: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; token?: string; user?: any; error?: string }>;
                getSession: () => Promise<{ token: string; user: any } | null>;
                logout: (token: string) => Promise<{ success: boolean }>;
            };
            settings: {
                get: (key: string) => Promise<unknown>;
                set: (key: string, value: unknown) => Promise<void>;
            };
            dialog: {
                openVideo: () => Promise<{ path: string; name: string } | null>;
                openDocument: () => Promise<{ path: string; name: string } | null>;
            };
        };
    }
}
