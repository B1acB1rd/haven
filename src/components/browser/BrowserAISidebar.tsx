import { useState, useEffect, useRef } from 'react'
import {
    X,
    Send,
    Sparkles,
    FileText,
    Languages,
    Lightbulb,
    BookOpen,
    RefreshCw,
    Bot,
    Copy,
    Check
} from 'lucide-react'
import { useBrowser } from '../../context/BrowserContext'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

interface QuickAction {
    id: string
    label: string
    icon: React.ReactNode
    prompt: (pageContent: string, pageTitle: string) => string
}

const QUICK_ACTIONS: QuickAction[] = [
    {
        id: 'summarize',
        label: 'Summarize',
        icon: <FileText className="w-4 h-4" />,
        prompt: (content, title) =>
            `Please provide a concise summary of this web page titled "${title}":\n\n${content.substring(0, 4000)}`
    },
    {
        id: 'explain',
        label: 'Explain',
        icon: <Lightbulb className="w-4 h-4" />,
        prompt: (content, title) =>
            `Explain the main concepts from this web page "${title}" in simple terms:\n\n${content.substring(0, 4000)}`
    },
    {
        id: 'translate',
        label: 'Translate',
        icon: <Languages className="w-4 h-4" />,
        prompt: (content, title) =>
            `Translate the following content from the page "${title}" to English (or summarize if already in English):\n\n${content.substring(0, 3000)}`
    },
    {
        id: 'keypoints',
        label: 'Key Points',
        icon: <BookOpen className="w-4 h-4" />,
        prompt: (content, title) =>
            `List the 5 most important key points from this web page "${title}":\n\n${content.substring(0, 4000)}`
    },
]

interface BrowserAISidebarProps {
    isOpen: boolean
    onClose: () => void
}

export default function BrowserAISidebar({ isOpen, onClose }: BrowserAISidebarProps) {
    const { activeTab, getWebview } = useBrowser()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [pageContent, setPageContent] = useState('')
    const [pageTitle, setPageTitle] = useState('')
    const [copied, setCopied] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Extract page content when tab changes
    useEffect(() => {
        if (activeTab && isOpen) {
            extractPageContent()
        }
    }, [activeTab?.id, isOpen])

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const extractPageContent = async () => {
        if (!activeTab) return

        try {
            const webview = getWebview(activeTab.id)
            if (!webview) return

            // Extract text content from page
            const content = await webview.executeJavaScript(`
                (function() {
                    // Get main content, avoiding nav/footer/scripts
                    const main = document.querySelector('main, article, .content, #content, .post, .article');
                    if (main) return main.innerText;
                    
                    // Fallback to body, removing scripts
                    const clone = document.body.cloneNode(true);
                    clone.querySelectorAll('script, style, nav, footer, header, aside').forEach(el => el.remove());
                    return clone.innerText.substring(0, 10000);
                })();
            `)

            setPageContent(content || '')
            setPageTitle(activeTab.title || activeTab.url)
        } catch (err) {
            console.error('Failed to extract page content:', err)
            setPageContent('')
        }
    }

    const sendMessage = async (messageContent: string) => {
        if (!messageContent.trim() || isLoading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: messageContent,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            // Add page context to the message if we have it
            let contextualMessage = messageContent
            if (pageContent && !messageContent.toLowerCase().includes('page')) {
                contextualMessage = `Context: I'm viewing a page titled "${pageTitle}".\n\nUser question: ${messageContent}`
            }

            const response = await window.electronAPI.ai.chat(contextualMessage)

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.success ? (response.response || 'No response generated.') : (response.error || 'Failed to get response.'),
                timestamp: new Date()
            }

            setMessages(prev => [...prev, assistantMessage])
        } catch (err) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please make sure Gemini API is configured in Settings.',
                timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    const handleQuickAction = async (action: QuickAction) => {
        if (!pageContent) {
            await extractPageContent()
        }

        if (!pageContent) {
            const errorMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Unable to extract page content. Please make sure a page is loaded.',
                timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMessage])
            return
        }

        const prompt = action.prompt(pageContent, pageTitle)
        await sendMessage(prompt)
    }

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setCopied(id)
        setTimeout(() => setCopied(null), 2000)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage(input)
        }
    }

    if (!isOpen) return null

    return (
        <div className="w-80 h-full bg-dark-800 border-l border-dark-700 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
                <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-accent-primary" />
                    <span className="font-semibold text-white">Haven AI</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Page Context Indicator */}
            {activeTab && (
                <div className="px-4 py-2 bg-dark-850 border-b border-dark-700">
                    <div className="flex items-center gap-2 text-xs text-dark-400">
                        <Sparkles className="w-3 h-3 text-accent-secondary" />
                        <span className="truncate">
                            Viewing: {pageTitle || activeTab.url}
                        </span>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="px-3 py-3 border-b border-dark-700">
                <div className="text-xs text-dark-500 mb-2">Quick Actions</div>
                <div className="grid grid-cols-2 gap-2">
                    {QUICK_ACTIONS.map((action) => (
                        <button
                            key={action.id}
                            onClick={() => handleQuickAction(action)}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg
                                bg-dark-700 hover:bg-dark-600 text-dark-300 hover:text-white
                                transition-colors text-sm disabled:opacity-50"
                        >
                            {action.icon}
                            {action.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-dark-500 py-8">
                        <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Ask me anything about this page</p>
                        <p className="text-xs mt-1">or use Quick Actions above</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`${msg.role === 'user'
                                ? 'ml-8'
                                : 'mr-4'
                                }`}
                        >
                            <div
                                className={`rounded-xl px-4 py-3 ${msg.role === 'user'
                                    ? 'bg-accent-primary text-white'
                                    : 'bg-dark-700 text-dark-100'
                                    }`}
                            >
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                            {msg.role === 'assistant' && (
                                <button
                                    onClick={() => copyToClipboard(msg.content, msg.id)}
                                    className="mt-1 text-xs text-dark-500 hover:text-dark-300 
                                        flex items-center gap-1"
                                >
                                    {copied === msg.id ? (
                                        <><Check className="w-3 h-3" /> Copied</>
                                    ) : (
                                        <><Copy className="w-3 h-3" /> Copy</>
                                    )}
                                </button>
                            )}
                        </div>
                    ))
                )}

                {isLoading && (
                    <div className="flex items-center gap-2 text-dark-400">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-dark-700">
                <div className="flex items-end gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about this page..."
                        rows={1}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-dark-900 border border-dark-600
                            text-white placeholder-dark-500 resize-none
                            focus:outline-none focus:border-accent-primary
                            text-sm max-h-24"
                        style={{ minHeight: '44px' }}
                    />
                    <button
                        onClick={() => sendMessage(input)}
                        disabled={!input.trim() || isLoading}
                        className="p-2.5 rounded-xl bg-accent-primary text-white
                            hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                            transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
