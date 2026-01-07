import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDb, saveDatabase } from '../database';
import { v4 as uuid } from 'uuid';
import Store from 'electron-store';

const store = new Store();

let genAI: GoogleGenerativeAI | null = null;

export function setApiKey(apiKey: string): void {
    store.set('gemini-api-key', apiKey);
    genAI = new GoogleGenerativeAI(apiKey);
}

export function getApiKey(): string | null {
    return store.get('gemini-api-key') as string | null;
}

export function initGemini(): boolean {
    const apiKey = getApiKey();
    if (apiKey) {
        genAI = new GoogleGenerativeAI(apiKey);
        return true;
    }
    return false;
}

export function isConfigured(): boolean {
    return !!genAI;
}

export type AIAction = 'summarize' | 'rewrite' | 'ideas' | 'draft' | 'hashtags' | 'chat';

const actionPrompts: Record<AIAction, (content: string, platform?: string) => string> = {
    summarize: (content) => `Summarize the following content in a clear, concise manner with bullet points highlighting the key takeaways:\n\n${content}`,

    rewrite: (content, platform) => `Rewrite the following content optimized for ${platform || 'social media'}. Make it engaging, clear, and add a compelling call-to-action:\n\n${content}`,

    ideas: (content) => `Based on the following content, generate 5 creative content ideas that could be expanded into full pieces. Include a brief description for each:\n\n${content}`,

    draft: (content, platform) => `Create a ${platform || 'social media'} post based on the following content. Make it engaging, include relevant emojis, and optimize for the platform's audience:\n\n${content}`,

    hashtags: (content) => `Generate 10 relevant hashtags for the following content. Include a mix of popular and niche tags for better reach:\n\n${content}`,

    chat: (content) => content,
};

export async function generateContent(
    action: AIAction,
    content: string,
    platform?: string,
    toolId?: string
): Promise<{ success: boolean; response?: string; error?: string }> {
    if (!genAI) {
        return { success: false, error: 'Gemini API not configured. Please add your API key in Settings.' };
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const prompt = actionPrompts[action](content, platform);

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Save to history
        saveToHistory(toolId || 'gemini', action, content, response);

        return { success: true, response };
    } catch (error) {
        console.error('Gemini API error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate content'
        };
    }
}

export async function chat(message: string): Promise<{ success: boolean; response?: string; error?: string }> {
    return generateContent('chat', message, undefined, 'gemini');
}

function saveToHistory(toolId: string, mode: string, prompt: string, response: string): void {
    try {
        const db = getDb();
        const id = uuid();
        const now = new Date().toISOString();

        const stmt = db.prepare(
            'INSERT INTO prompt_history (id, tool_id, mode, prompt, response, created_at) VALUES (?, ?, ?, ?, ?, ?)'
        );
        stmt.run([id, toolId, mode, prompt, response, now]);
        stmt.free();

        saveDatabase();
    } catch (error) {
        console.error('Failed to save prompt history:', error);
    }
}

export function getPromptHistory(limit: number = 50): Array<{
    id: string;
    tool_id: string;
    mode: string;
    prompt: string;
    response: string;
    created_at: string;
}> {
    try {
        const db = getDb();
        const result = db.exec(`SELECT * FROM prompt_history ORDER BY created_at DESC LIMIT ${limit}`);

        if (result.length === 0) return [];

        const columns = result[0].columns;
        return result[0].values.map(row => {
            const obj: Record<string, unknown> = {};
            columns.forEach((col, i) => {
                obj[col] = row[i];
            });
            return obj as {
                id: string;
                tool_id: string;
                mode: string;
                prompt: string;
                response: string;
                created_at: string;
            };
        });
    } catch (error) {
        console.error('Failed to get prompt history:', error);
        return [];
    }
}
