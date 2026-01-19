import { app, BrowserWindow, ipcMain, session, protocol, net } from 'electron';
import path from 'path';
import { registerIPCHandlers } from './ipc-handlers';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from './services/storage';
import { adBlocker } from './services/adBlocker';

let mainWindow: BrowserWindow | null = null;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Disable WebAuthn/passkey to prevent Windows Security dialogs from appearing
// This must be called before app is ready
app.commandLine.appendSwitch('disable-features', 'WebAuthentication,WebAuthenticationConditionalUI');

// Suppress noisy unhandled rejections from webview navigation (GUEST_VIEW_MANAGER_CALL errors)
process.on('unhandledRejection', (reason: any) => {
    // Suppress common webview navigation errors
    if (reason?.code === 'ERR_ABORTED' ||
        reason?.code === 'ERR_NAME_NOT_RESOLVED' ||
        reason?.code === 'ERR_QUIC_PROTOCOL_ERROR' ||
        reason?.code === 'ERR_NETWORK_ACCESS_DENIED' ||
        reason?.code === '' ||  // Empty code from navigation failures
        reason?.message?.includes('GUEST_VIEW_MANAGER_CALL')) {
        return; // Silently ignore
    }
    console.error('Unhandled rejection:', reason);
});

// Assets download directory
const getAssetsDir = () => {
    const assetsDir = path.join(app.getPath('userData'), 'ai-downloads');
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }
    return assetsDir;
};

// Register custom protocol for local files
protocol.registerSchemesAsPrivileged([
    {
        scheme: 'local-file',
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
            stream: true,
            bypassCSP: true
        }
    }
]);

// All partitions to monitor for downloads (AI + Social + Music + Browser + everything)
const allPartitions = [
    // Haven Browser
    'persist:haven-browser', 'persist:browser',
    // AI platforms
    'persist:gemini', 'persist:chatgpt', 'persist:claude', 'persist:perplexity',
    'persist:dalle', 'persist:midjourney', 'persist:leonardo',
    'persist:suno', 'persist:elevenlabs',
    'persist:runway', 'persist:pika',
    // Social platforms
    'persist:twitter', 'persist:linkedin', 'persist:youtube', 'persist:medium', 'persist:reddit', 'persist:facebook',
    // Music platforms  
    'persist:spotify', 'persist:applemusic', 'persist:soundcloud', 'persist:tidal', 'persist:deezer', 'persist:amazonmusic'
];

// Get file type from extension
function getFileType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'];
    const audioExts = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac'];
    const videoExts = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    const docExts = ['.pdf', '.doc', '.docx', '.txt', '.md'];

    if (imageExts.includes(ext)) return 'image';
    if (audioExts.includes(ext)) return 'audio';
    if (videoExts.includes(ext)) return 'video';
    if (docExts.includes(ext)) return 'document';
    return 'other';
}

// Get friendly source name from partition
function getSourceName(partitionName: string, url?: string): string {
    const name = partitionName.replace('persist:', '');
    const platformNames: Record<string, string> = {
        gemini: 'Gemini', chatgpt: 'ChatGPT', claude: 'Claude', perplexity: 'Perplexity',
        dalle: 'DALL-E', midjourney: 'Midjourney', leonardo: 'Leonardo.ai',
        suno: 'Suno', elevenlabs: 'ElevenLabs',
        runway: 'Runway', pika: 'Pika',
        twitter: 'Twitter/X', linkedin: 'LinkedIn', youtube: 'YouTube',
        medium: 'Medium', reddit: 'Reddit', facebook: 'Facebook',
        spotify: 'Spotify', applemusic: 'Apple Music', soundcloud: 'SoundCloud',
        tidal: 'Tidal', deezer: 'Deezer', amazonmusic: 'Amazon Music'
    };
    return platformNames[name] || name.charAt(0).toUpperCase() + name.slice(1);
}

// Setup download handler for a session
function setupDownloadHandler(ses: Electron.Session, partitionName: string) {
    ses.on('will-download', (event, item, webContents) => {
        const filename = item.getFilename();
        const assetsDir = getAssetsDir();
        const uniqueFilename = `${Date.now()}-${filename}`;
        const savePath = path.join(assetsDir, uniqueFilename);

        item.setSavePath(savePath);

        item.on('done', (event, state) => {
            if (state === 'completed') {
                const sourceName = getSourceName(partitionName, item.getURL());

                // Register as asset
                const asset = {
                    id: uuidv4(),
                    name: filename,
                    type: getFileType(filename),
                    size: item.getTotalBytes(),
                    path: savePath,
                    source: sourceName,
                    createdAt: new Date().toISOString()
                };

                try {
                    StorageService.addAsset(asset);
                    console.log(`[Asset Library] Saved download: ${filename} from ${sourceName}`);

                    // Notify renderer about new asset
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.webContents.send('asset:downloaded', asset);
                    }
                } catch (err) {
                    console.error('Failed to save asset:', err);
                }
            }
        });
    });
}

// Setup all sessions before window creation
function setupAllSessions() {
    // Setup download handlers and permission handlers for all platform sessions
    allPartitions.forEach(partition => {
        const ses = session.fromPartition(partition);
        setupDownloadHandler(ses, partition);

        // Block WebAuthn/passkey and HID requests to prevent Windows Security dialogs
        ses.setPermissionRequestHandler((webContents, permission, callback) => {
            const blockedPermissions = ['hid', 'usb'];
            if (blockedPermissions.includes(permission)) {
                console.log(`Blocked ${permission} permission request in ${partition}`);
                callback(false);
            } else {
                callback(true);
            }
        });

        // Handle permission check for WebAuthn (publickey-credentials)
        ses.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
            // Block WebAuthn/passkey credential checks
            if (permission === 'hid') {
                return false;
            }
            return true;
        });
    });

    // Also setup download handler for default session (catches ALL other downloads)
    setupDownloadHandler(session.defaultSession, 'persist:app');

    // Block WebAuthn/passkey for default session as well
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        const blockedPermissions = ['hid', 'usb'];
        if (blockedPermissions.includes(permission)) {
            console.log(`Blocked ${permission} permission request in default session`);
            callback(false);
        } else {
            callback(true);
        }
    });

    session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
        if (permission === 'hid') {
            return false;
        }
        return true;
    });

    // Register ad blocker for browser partitions
    adBlocker.registerSession('persist:browser');
    adBlocker.registerSession('persist:haven-browser');

    console.log('All sessions initialized with permissions');
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        title: 'Haven',
        frame: false,
        titleBarStyle: 'hidden',
        backgroundColor: '#202123',
        show: false, // Don't show until ready - faster perceived startup
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false, // Disable sandbox for preload script compatibility in production
            preload: path.join(__dirname, 'preload.js'),
            webviewTag: true,
            webSecurity: true,
            // Additional security settings
            allowRunningInsecureContent: false,
            experimentalFeatures: false,
        },
    });

    // Show window when ready - improves perceived startup time
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    // Register the local-file protocol handler with path validation
    protocol.handle('local-file', (request) => {
        // Extract path from URL: local-file://C:/Users/... or local-file://C/Users/...
        let filePath = decodeURIComponent(request.url.replace('local-file://', ''));

        // Windows path fix: if path starts with single letter without colon, add it
        // e.g., "C/Users" -> "C:/Users"
        if (/^[a-zA-Z]\//.test(filePath)) {
            filePath = filePath[0] + ':' + filePath.slice(1);
        }

        // Normalize the path to prevent traversal attacks
        const normalizedPath = path.normalize(filePath);

        // SECURITY: Whitelist allowed directories
        const allowedPaths = [
            app.getPath('userData'),
            app.getPath('downloads'),
            app.getPath('pictures'),
            app.getPath('videos'),
            app.getPath('music'),
            app.getPath('documents'),
        ];

        const isAllowed = allowedPaths.some(allowed =>
            normalizedPath.toLowerCase().startsWith(allowed.toLowerCase())
        );

        if (!isAllowed) {
            console.warn('Blocked access to unauthorized path:', normalizedPath);
            return new Response('Forbidden', { status: 403 });
        }

        // Ensure proper file URL format
        const fileUrl = `file:///${normalizedPath.replace(/\\/g, '/')}`;
        console.log('Loading local file:', fileUrl);
        return net.fetch(fileUrl);
    });

    // Initialize IPC Handlers
    registerIPCHandlers(mainWindow);

    // Note: Session setup is now done in setupAllSessions() before window creation

    // Note: We don't override CSP for external webview sessions because:
    // 1. External sites (Google, Twitter, etc.) have their own CSP policies
    // 2. Overriding CSP can break site functionality
    // 3. The sites are already sandboxed in their own partition

    // Suppress common webview navigation errors (these are not security issues)
    app.on('web-contents-created', (_, contents) => {
        if (contents.getType() === 'webview') {
            contents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
                // Suppress common, expected errors:
                // -3: ERR_ABORTED - Navigation cancelled (user clicked another link, redirect)
                // -105: ERR_NAME_NOT_RESOLVED - DNS lookup failed (invalid domain)
                // -106: ERR_INTERNET_DISCONNECTED - No internet
                // -118: ERR_CONNECTION_TIMED_OUT - Connection timeout
                // -356: ERR_QUIC_PROTOCOL_ERROR - QUIC protocol negotiation issue
                // -138: ERR_NETWORK_ACCESS_DENIED - Network blocked (can happen during redirects)
                const suppressedErrors = [-3, -105, -106, -118, -356, -138];
                if (suppressedErrors.includes(errorCode)) {
                    return; // Silently ignore
                }
                // Only log unexpected errors
                console.log(`[Browser] Load failed: ${errorDescription} (${errorCode}) - ${validatedURL}`);
            });
        }
    });

    // Configure webview session to allow local file access
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        callback({ requestHeaders: details.requestHeaders });
    });

    // Prevent navigation away from the app
    mainWindow.webContents.on('will-navigate', (event, url) => {
        const currentUrl = mainWindow?.webContents.getURL();
        if (currentUrl && !url.startsWith(currentUrl.split('#')[0])) {
            event.preventDefault();
            console.log('Blocked navigation to:', url);
        }
    });

    // Prevent new window creation (except webviews)
    mainWindow.webContents.setWindowOpenHandler(() => {
        return { action: 'deny' };
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        // In production, main.js is at dist-electron/electron/main.js
        // So we need to go up 2 levels to root, then into dist
        mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Window Control IPC Handlers
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
});
ipcMain.handle('window:close', () => mainWindow?.close());
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized());

// Ad Blocker IPC Handlers
ipcMain.handle('adBlocker:isEnabled', () => adBlocker.isEnabled());
ipcMain.handle('adBlocker:setEnabled', (_, enabled: boolean) => adBlocker.setEnabled(enabled));
ipcMain.handle('adBlocker:getStats', () => ({
    totalBlocked: adBlocker.getTotalBlocked(),
    browserStats: adBlocker.getStats('persist:browser'),
}));
ipcMain.handle('adBlocker:resetStats', () => adBlocker.resetStats());

app.whenReady().then(() => {
    // Initialize all sessions BEFORE creating window
    setupAllSessions();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
