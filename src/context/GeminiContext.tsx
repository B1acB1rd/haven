import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

interface GeminiContextType {
    isEnabled: boolean
    setIsEnabled: (enabled: boolean) => void
    isLoggedIn: boolean
    setIsLoggedIn: (loggedIn: boolean) => void
    sendMessage: (message: string) => Promise<string>
    webviewRef: React.RefObject<HTMLWebViewElement> | null
    setWebviewRef: (ref: React.RefObject<HTMLWebViewElement>) => void
}

const GeminiContext = createContext<GeminiContextType | undefined>(undefined)

export function GeminiProvider({ children }: { children: ReactNode }) {
    const [isEnabled, setIsEnabled] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [webviewRef, setWebviewRefState] = useState<React.RefObject<HTMLWebViewElement> | null>(null)

    const setWebviewRef = useCallback((ref: React.RefObject<HTMLWebViewElement>) => {
        setWebviewRefState(ref)
    }, [])

    const sendMessage = useCallback(async (message: string): Promise<string> => {
        if (!isEnabled || !isLoggedIn || !webviewRef?.current) {
            // Fallback to API-based response
            try {
                const response = await window.electronAPI.ai.chat(message)
                if (response.success && response.response) {
                    return response.response
                }
                return 'Please enable Gemini and log in to get AI responses.'
            } catch {
                return 'AI service not available. Please enable Gemini integration.'
            }
        }

        try {
            const webview = webviewRef.current as any

            // Inject message into Gemini
            await webview.executeJavaScript(`
                (function() {
                    const textarea = document.querySelector('textarea[aria-label*="prompt"], rich-textarea textarea, textarea');
                    if (textarea) {
                        textarea.value = ${JSON.stringify(message)};
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        setTimeout(() => {
                            const sendBtn = document.querySelector('button[aria-label*="Send"], button.send-button, button[data-test-id="send-button"]');
                            if (sendBtn) sendBtn.click();
                        }, 100);
                    }
                })();
            `)

            // Wait and capture response
            await new Promise(resolve => setTimeout(resolve, 3000))

            const response = await webview.executeJavaScript(`
                (function() {
                    const responses = document.querySelectorAll('.response-container, .model-response, [data-message-author-role="model"]');
                    const lastResponse = responses[responses.length - 1];
                    return lastResponse ? lastResponse.textContent.trim() : '';
                })();
            `)

            return response || 'Response received from Gemini.'
        } catch (err) {
            console.error('Gemini message error:', err)
            return 'Failed to get response from Gemini.'
        }
    }, [isEnabled, isLoggedIn, webviewRef])

    return (
        <GeminiContext.Provider value={{
            isEnabled,
            setIsEnabled,
            isLoggedIn,
            setIsLoggedIn,
            sendMessage,
            webviewRef,
            setWebviewRef
        }}>
            {children}
        </GeminiContext.Provider>
    )
}

export function useGemini() {
    const context = useContext(GeminiContext)
    if (!context) {
        throw new Error('useGemini must be used within a GeminiProvider')
    }
    return context
}
