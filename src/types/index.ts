// Core type definitions for Creative AI Hub

// User types
export interface User {
    id: string
    email: string
    displayName?: string
    createdAt: string
    updatedAt: string
}

export interface AuthState {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
}

// Project types
export interface Project {
    id: string
    name: string
    description?: string
    type: ProjectType
    userId: string
    assetCount?: number
    createdAt: string
    updatedAt: string
}

export type ProjectType = 'video' | 'audio' | 'design' | 'writing' | 'other'

// Asset types
export interface Asset {
    id: string
    projectId?: string
    name: string
    type: AssetType
    sourceTool?: string
    filePath?: string
    fileSize?: number
    metadata?: Record<string, unknown>
    createdAt: string
}

export type AssetType = 'image' | 'audio' | 'video' | 'text' | 'other'

// Tag types
export interface Tag {
    id: string
    name: string
    color?: string
}

// AI Tool types
export interface AITool {
    id: string
    name: string
    url: string
    category: AIToolCategory
    description: string
    icon?: string
}

export type AIToolCategory = 'chat' | 'image' | 'video' | 'audio' | 'writing'

// Social Platform types
export interface SocialPlatform {
    id: string
    name: string
    url: string
    icon?: string
    color?: string
}

// Prompt types
export interface PromptHistoryItem {
    id: string
    userId: string
    toolId: string
    mode: PromptMode
    prompt: string
    response?: string
    createdAt: string
}

export type PromptMode = 'create' | 'edit' | 'analyze'

// AI Assistant types
export type AssistantAction = 'summarize' | 'rewrite' | 'ideas' | 'draft' | 'hashtags'

export interface AssistantRequest {
    action: AssistantAction
    content: string
    platform?: string
}

export interface AssistantResponse {
    success: boolean
    result?: string
    error?: string
}

// API Response types
export interface APIResponse<T> {
    success: boolean
    data?: T
    error?: string
}

// Tab types for WebViews
export interface WebViewTab {
    id: string
    url: string
    title: string
    isLoading: boolean
    canGoBack: boolean
    canGoForward: boolean
}

// Settings types
export interface AppSettings {
    theme: 'dark' | 'light' | 'system'
    sidebarCollapsed: boolean
    apiKeys: {
        gemini?: string
        openai?: string
        anthropic?: string
    }
}

// Utility functions
export function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}

export function formatFileSize(bytes: number | null | undefined): string {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
