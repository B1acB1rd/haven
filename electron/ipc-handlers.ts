import { ipcMain, dialog } from 'electron';
import { StorageService } from './services/storage';
import { AuthService } from './services/auth';
import { AIService } from './services/ai';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Input validation helpers
function isValidString(val: unknown, maxLength = 1000): val is string {
    return typeof val === 'string' && val.length > 0 && val.length <= maxLength;
}

function isValidId(val: unknown): val is string {
    return typeof val === 'string' && /^[a-f0-9-]{36}$/.test(val);
}

function sanitizeString(str: string): string {
    return str.replace(/[<>'"]/g, '').trim();
}

function isValidProjectType(type: unknown): type is string {
    const validTypes = ['video', 'audio', 'design', 'writing', 'other'];
    return typeof type === 'string' && validTypes.includes(type);
}

export function registerIPCHandlers(mainWindow: any) {
    // Auth Handlers
    ipcMain.handle('auth:login', async (_, email, password) => {
        if (!isValidString(email, 254) || !isValidString(password, 128)) {
            return { success: false, error: 'Invalid input' };
        }
        const result = await AuthService.login(email, password);
        if ('error' in result) {
            return { success: false, error: result.error };
        }
        return { success: true, token: result.token, user: result.user };
    });

    ipcMain.handle('auth:register', async (_, email, password, displayName) => {
        if (!isValidString(email, 254) || !isValidString(password, 128)) {
            return { success: false, error: 'Invalid input' };
        }
        const safeName = displayName && isValidString(displayName, 50)
            ? sanitizeString(displayName)
            : undefined;
        const result = await AuthService.register(email, password, safeName);
        if ('error' in result) {
            return { success: false, error: result.error };
        }
        return { success: true, token: result.token, user: result.user };
    });

    ipcMain.handle('auth:getSession', async () => {
        const session = AuthService.getCurrentSession();
        if (!session) return null;

        const user = await AuthService.validateSession(session.token);
        if (!user) return null;

        return { token: session.token, user };
    });

    ipcMain.handle('auth:logout', async (_, token) => {
        if (!isValidString(token, 500)) {
            return { success: false };
        }
        await AuthService.logout(token);
        return { success: true };
    });

    // Project Handlers
    ipcMain.handle('projects:getAll', async () => {
        const projects = StorageService.getProjects() || [];
        // Add asset count to each project
        const projectsWithCount = projects.map((p: any) => ({
            ...p,
            assetCount: StorageService.getAssetCount(p.id)
        }));
        return projectsWithCount.sort((a: any, b: any) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    });

    ipcMain.handle('projects:get', async (_, id) => {
        if (!isValidId(id)) {
            return null;
        }
        return StorageService.getProject(id);
    });

    ipcMain.handle('projects:create', async (_, projectData) => {
        // Validate and sanitize input
        if (!projectData || typeof projectData !== 'object') {
            return null;
        }

        const name = projectData.name;
        const description = projectData.description;
        const type = projectData.type;

        if (!isValidString(name, 100)) {
            return null;
        }

        const project = {
            id: uuidv4(),
            name: sanitizeString(name),
            description: isValidString(description, 500) ? sanitizeString(description) : '',
            type: isValidProjectType(type) ? type : 'other',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        return StorageService.inputProject(project);
    });

    ipcMain.handle('projects:update', async (_, id, data) => {
        if (!isValidId(id)) {
            return null;
        }
        if (!data || typeof data !== 'object') {
            return null;
        }

        // Only allow specific fields to be updated
        const sanitizedData: any = {};
        if (isValidString(data.name, 100)) {
            sanitizedData.name = sanitizeString(data.name);
        }
        if (isValidString(data.description, 500)) {
            sanitizedData.description = sanitizeString(data.description);
        }
        if (isValidProjectType(data.type)) {
            sanitizedData.type = data.type;
        }

        return StorageService.updateProject(id, sanitizedData);
    });

    ipcMain.handle('projects:delete', async (_, id) => {
        if (!isValidId(id)) {
            return false;
        }
        return StorageService.deleteProject(id);
    });

    // Asset Handlers
    ipcMain.handle('assets:getAll', async (_, projectId) => {
        if (projectId && !isValidId(projectId)) {
            return [];
        }
        if (projectId) {
            return StorageService.getProjectAssets(projectId) || [];
        }
        return StorageService.getAssets() || [];
    });

    ipcMain.handle('assets:get', async (_, id) => {
        if (!isValidId(id)) {
            return null;
        }
        return StorageService.getAsset(id);
    });

    ipcMain.handle('assets:create', async (_, assetData) => {
        if (!assetData || typeof assetData !== 'object') {
            return null;
        }

        const name = assetData.name;
        const type = assetData.type;

        if (!isValidString(name, 255) || !isValidString(type, 50)) {
            return null;
        }

        const asset = {
            id: uuidv4(),
            name: sanitizeString(name),
            type: sanitizeString(type),
            projectId: assetData.project_id && isValidId(assetData.project_id) ? assetData.project_id : null,
            sourceTool: isValidString(assetData.source_tool, 50) ? sanitizeString(assetData.source_tool) : null,
            filePath: isValidString(assetData.filePath, 500) ? assetData.filePath : null,
            createdAt: new Date().toISOString()
        };
        return StorageService.addAsset(asset);
    });

    ipcMain.handle('assets:delete', async (_, id) => {
        if (!isValidId(id)) {
            return false;
        }
        return StorageService.deleteAsset(id);
    });

    ipcMain.handle('assets:selectFile', async () => {
        if (!mainWindow) return null;

        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: [
                { name: 'All Supported', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'mp3', 'wav', 'mp4', 'webm', 'mov', 'txt', 'md', 'json'] },
            ],
        });

        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }

        const filePath = result.filePaths[0];
        const fileName = path.basename(filePath);
        const ext = path.extname(filePath).toLowerCase();

        let fileType: 'image' | 'audio' | 'video' | 'text' | 'other' = 'other';
        if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) fileType = 'image';
        else if (['.mp3', '.wav', '.ogg'].includes(ext)) fileType = 'audio';
        else if (['.mp4', '.webm', '.mov'].includes(ext)) fileType = 'video';
        else if (['.txt', '.md', '.json'].includes(ext)) fileType = 'text';

        return { filePath, fileName, fileType };
    });

    // AI Handlers
    ipcMain.handle('ai:generate', async (_, action, content, platform) => {
        if (!isValidString(action, 50) || !isValidString(content, 10000)) {
            return { success: false, error: 'Invalid input' };
        }
        const safePlatform = isValidString(platform, 50) ? platform : undefined;
        return AIService.generateContent(action, content, safePlatform);
    });

    ipcMain.handle('ai:chat', async (_, message) => {
        if (!isValidString(message, 10000)) {
            return { success: false, error: 'Invalid message' };
        }
        return AIService.chat(message);
    });

    ipcMain.handle('ai:setApiKey', async (_, key) => {
        if (!isValidString(key, 200)) {
            return;
        }
        // Only store if it looks like an API key pattern
        if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
            return;
        }
        return StorageService.updateSettings({ apiKeys: { gemini: key } });
    });

    ipcMain.handle('ai:getApiKey', async () => {
        const settings = StorageService.getSettings();
        return settings.apiKeys?.gemini || null;
    });

    ipcMain.handle('ai:isConfigured', async () => {
        const settings = StorageService.getSettings();
        return !!(settings.apiKeys?.openai || settings.apiKeys?.gemini);
    });

    ipcMain.handle('ai:getHistory', async (_, limit) => {
        return []; // Mock
    });

    // Settings Handlers
    ipcMain.handle('settings:get', async (_, key) => {
        if (key !== undefined && !isValidString(key, 50)) {
            return null;
        }
        const settings = StorageService.getSettings();
        return key ? settings[key] : settings;
    });

    ipcMain.handle('settings:set', async (_, key, value) => {
        if (!isValidString(key, 50)) {
            return null;
        }
        // Whitelist allowed settings keys
        const allowedKeys = ['theme', 'sidebarCollapsed', 'currentSessionToken'];
        if (!allowedKeys.includes(key)) {
            console.warn('Blocked attempt to set unauthorized setting:', key);
            return null;
        }
        return StorageService.updateSettings({ [key]: value });
    });

    // File Dialog Handlers
    ipcMain.handle('dialog:openVideo', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: 'Select Video File',
            filters: [
                { name: 'Videos', extensions: ['mp4', 'webm', 'mkv', 'avi', 'mov', 'wmv'] }
            ],
            properties: ['openFile']
        });

        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }

        const filePath = result.filePaths[0];
        return {
            path: filePath,
            name: path.basename(filePath)
        };
    });

    ipcMain.handle('dialog:openDocument', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: 'Select Document',
            filters: [
                { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'] }
            ],
            properties: ['openFile']
        });

        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }

        const filePath = result.filePaths[0];
        return {
            path: filePath,
            name: path.basename(filePath)
        };
    });
}
