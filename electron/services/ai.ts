import { StorageService } from './storage';

// Simulated AI Service
// In a real app, this would make calls to OpenAI/Gemini APIs
export const AIService = {
    generateContent: async (action: string, content: string, platform?: string) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Check if API key is set
        const settings = StorageService.getSettings();
        const hasKey = settings.apiKeys?.openai || settings.apiKeys?.gemini;

        if (!hasKey) {
            // Return simulated response for demo even without key, 
            // but normally would throw error or ask for key
        }

        // Mock responses based on action
        switch (action) {
            case 'summarize':
                return {
                    success: true,
                    response: `Here is a summary of the content:\n\nThis text discusses ${content.substring(0, 20)}... \n\nKey points:\n• Important concept 1\n• Key takeaway 2\n• Action item 3`
                };
            case 'rewrite':
                return {
                    success: true,
                    response: `Rewritten for ${platform || 'general use'}:\n\n${content.split(' ').reverse().join(' ')} (Just kidding, this is a mock rewrite!)\n\nHere's a better version: "Unlock your creative potential with the new AI Hub. Integrate tools, manage projects, and create faster."`
                };
            case 'ideas':
                return {
                    success: true,
                    response: `Creative Ideas:\n1. innovative approach to ${content}\n2. A data-driven perspective on the topic\n3. Visual storytelling campaign\n4. Interactive community challenge\n5. Behind-the-scenes video series`
                };
            case 'hashtags':
                return {
                    success: true,
                    response: `#CreativeHub #AI #${platform || 'Innovation'} #Tech #FutureOfWork #Design`
                };
            default:
                return { success: false, error: 'Unknown action' };
        }
    },

    chat: async (message: string) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
            success: true,
            response: `I'm a simulated AI assistant. You said: "${message}". \n\nOnce connected to a real API like OpenAI or Gemini, I'll be able to help you draft content, brainstorm ideas, and analyze your projects!`
        };
    }
};
