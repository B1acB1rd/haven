import Store from 'electron-store';
import { app, safeStorage } from 'electron';

// Define the schema for our store
interface DataSchema {
    users: Array<{
        id: string;
        email: string;
        passwordHash: string;
        displayName: string;
        createdAt: string;
        updatedAt: string;
    }>;
    projects: any[];
    assets: any[];
    settings: any;
    sessions: any;
    prompts: any[];
    // Encrypted fields stored as base64
    encryptedApiKeys?: string;
}

// Initialize store with encryption for sensitive data
const store = new Store<DataSchema>({
    name: 'haven-db',
    defaults: {
        users: [],
        projects: [],
        assets: [],
        settings: {
            theme: 'dark',
            sidebarCollapsed: false
        },
        sessions: {},
        prompts: []
    }
});

// Encrypt sensitive data using Electron's safeStorage
function encryptData(data: string): string {
    if (!safeStorage.isEncryptionAvailable()) {
        console.warn('Encryption not available, storing in base64');
        return Buffer.from(data).toString('base64');
    }
    const encrypted = safeStorage.encryptString(data);
    return encrypted.toString('base64');
}

function decryptData(encryptedBase64: string): string {
    if (!safeStorage.isEncryptionAvailable()) {
        return Buffer.from(encryptedBase64, 'base64').toString('utf-8');
    }
    const encrypted = Buffer.from(encryptedBase64, 'base64');
    return safeStorage.decryptString(encrypted);
}

export const StorageService = {
    // Generic getters
    getUsers: () => store.get('users'),
    getProjects: () => store.get('projects'),
    getAssets: () => store.get('assets'),
    getSettings: () => {
        const settings = store.get('settings');
        // Decrypt API keys if present
        const encryptedKeys = store.get('encryptedApiKeys');
        if (encryptedKeys) {
            try {
                settings.apiKeys = JSON.parse(decryptData(encryptedKeys));
            } catch {
                settings.apiKeys = {};
            }
        } else {
            settings.apiKeys = settings.apiKeys || {};
        }
        return settings;
    },

    // User operations
    createUser: (user: any) => {
        const users = store.get('users');
        users.push(user);
        store.set('users', users);
        return user;
    },

    findUserByEmail: (email: string) => {
        const users = store.get('users');
        return users.find(u => u.email === email);
    },

    // Project operations
    inputProject: (project: any) => {
        const projects = store.get('projects');
        const index = projects.findIndex(p => p.id === project.id);
        if (index >= 0) {
            projects[index] = { ...projects[index], ...project, updatedAt: new Date().toISOString() };
        } else {
            projects.push(project);
        }
        store.set('projects', projects);
        return project;
    },

    getProject: (id: string) => {
        const projects = store.get('projects');
        return projects.find(p => p.id === id);
    },

    updateProject: (id: string, data: any) => {
        const projects = store.get('projects');
        const index = projects.findIndex(p => p.id === id);
        if (index >= 0) {
            const updated = { ...projects[index], ...data, updatedAt: new Date().toISOString() };
            projects[index] = updated;
            store.set('projects', projects);
            return updated;
        }
        return null;
    },

    deleteProject: (id: string) => {
        const projects = store.get('projects');
        const filtered = projects.filter(p => p.id !== id);
        store.set('projects', filtered);
        // Cleanup assets
        const assets = store.get('assets');
        const filteredAssets = assets.filter(a => a.projectId !== id);
        store.set('assets', filteredAssets);
        return true;
    },

    // Asset operations
    getAsset: (id: string) => {
        const assets = store.get('assets');
        return assets.find(a => a.id === id);
    },

    addAsset: (asset: any) => {
        const assets = store.get('assets');
        assets.push(asset);
        store.set('assets', assets);
        return asset;
    },

    getProjectAssets: (projectId: string) => {
        const assets = store.get('assets');
        return assets.filter(a => a.projectId === projectId);
    },

    deleteAsset: (id: string) => {
        const assets = store.get('assets');
        const filtered = assets.filter(a => a.id !== id);
        store.set('assets', filtered);
        return true;
    },

    getAssetCount: (projectId: string) => {
        const assets = store.get('assets');
        return assets.filter(a => a.projectId === projectId).length;
    },

    // Settings with encrypted API keys
    updateSettings: (newSettings: any) => {
        const current = store.get('settings');

        // Handle API keys separately - encrypt them
        if (newSettings.apiKeys) {
            const encryptedKeys = encryptData(JSON.stringify(newSettings.apiKeys));
            store.set('encryptedApiKeys', encryptedKeys);
            delete newSettings.apiKeys;
        }

        const updated = { ...current, ...newSettings };
        store.set('settings', updated);
        return StorageService.getSettings(); // Return with decrypted keys
    },

    // Session management
    storeSession: (token: string, userId: string) => {
        const sessions = store.get('sessions') || {};
        sessions[token] = {
            userId,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        };
        store.set('sessions', sessions);
        // Store current session token
        const settings = store.get('settings');
        settings.currentSessionToken = token;
        store.set('settings', settings);
    },

    removeSession: (token: string) => {
        const sessions = store.get('sessions') || {};
        delete sessions[token];
        store.set('sessions', sessions);
        // Clear current session if it matches
        const settings = store.get('settings');
        if (settings.currentSessionToken === token) {
            delete settings.currentSessionToken;
            store.set('settings', settings);
        }
        return true;
    },

    isSessionValid: (token: string) => {
        const sessions = store.get('sessions') || {};
        const session = sessions[token];
        if (!session) return false;

        // Check expiration
        if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
            // Session expired, clean it up
            delete sessions[token];
            store.set('sessions', sessions);
            return false;
        }

        return true;
    },

    getCurrentSession: () => {
        const settings = store.get('settings');
        const currentToken = settings.currentSessionToken;
        if (!currentToken) return null;

        const sessions = store.get('sessions') || {};
        const session = sessions[currentToken];
        if (!session) return null;

        // Check expiration
        if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
            return null;
        }

        return {
            token: currentToken,
            userId: session.userId
        };
    },

    // Cleanup expired sessions
    cleanupExpiredSessions: () => {
        const sessions = store.get('sessions') || {};
        const now = new Date();
        let cleaned = 0;

        Object.keys(sessions).forEach(token => {
            if (sessions[token].expiresAt && new Date(sessions[token].expiresAt) < now) {
                delete sessions[token];
                cleaned++;
            }
        });

        if (cleaned > 0) {
            store.set('sessions', sessions);
            console.log(`Cleaned up ${cleaned} expired sessions`);
        }
    }
};
