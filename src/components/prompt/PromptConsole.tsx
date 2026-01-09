import { useState } from 'react'
import {
    X,
    Send,
    ChevronDown,
    Sparkles,
    Bot,
    Image,
    Music,
    Video,
    Loader2,
    AlertCircle,
    Info
} from 'lucide-react'
import { useGemini } from '../../context/GeminiContext'

interface PromptConsoleProps {
    isOpen: boolean
    onClose: () => void
}

const tools = [
    { id: 'gemini', name: 'Gemini', icon: Sparkles, category: 'chat' },
    { id: 'chatgpt', name: 'ChatGPT', icon: Bot, category: 'chat' },
    { id: 'claude', name: 'Claude', icon: Sparkles, category: 'chat' },
    { id: 'midjourney', name: 'Midjourney', icon: Image, category: 'image' },
    { id: 'suno', name: 'Suno AI', icon: Music, category: 'audio' },
    { id: 'runway', name: 'Runway', icon: Video, category: 'video' },
]

const modes = [
    { id: 'create', name: 'Create', description: 'Generate new content' },
    { id: 'edit', name: 'Edit', description: 'Modify existing content' },
    { id: 'analyze', name: 'Analyze', description: 'Get insights and feedback' },
]

export default function PromptConsole({ isOpen, onClose }: PromptConsoleProps) {
    const { isEnabled: _isEnabled } = useGemini()
    const [prompt, setPrompt] = useState('')
    const [selectedTool, setSelectedTool] = useState(tools[0])
    const [selectedMode, setSelectedMode] = useState(modes[0])
    const [showToolDropdown, setShowToolDropdown] = useState(false)
    const [showModeDropdown, setShowModeDropdown] = useState(false)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async () => {
        if (!prompt.trim()) return

        setLoading(true)
        setError(null)
        setResult(null)

        try {
            // Try API-based response
            const response = await window.electronAPI.ai.chat(`[${selectedMode.name}] ${prompt}`)
            if (response.success && response.response) {
                setResult(response.response)
            } else {
                setError(response.error || 'Failed to generate response')
            }
        } catch (err) {
            setError('AI service not configured. Use the AI Assistant panel for Gemini.')
            console.error('Prompt error:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
        if (e.key === 'Escape') {
            onClose()
        }
    }

    const handleClose = () => {
        setPrompt('')
        setResult(null)
        setError(null)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-in">
            <div className="max-w-4xl mx-auto p-4">
                <div className="bg-dark-800 rounded-2xl border border-dark-600 shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-accent-primary to-accent-secondary 
                             flex items-center justify-center">
                                <Sparkles className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="font-medium text-white">Universal Prompt</span>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Info Banner */}
                    <div className="px-4 py-2 bg-accent-primary/10 border-b border-dark-700 flex items-center gap-2">
                        <Info className="w-4 h-4 text-accent-primary flex-shrink-0" />
                        <p className="text-xs text-accent-primary">
                            For Gemini AI, open the <strong>AI Assistant</strong> panel (top right button) to chat directly with Gemini.
                        </p>
                    </div>

                    {/* Selectors */}
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-dark-700">
                        {/* Tool Selector */}
                        <div className="relative">
                            <button
                                onClick={() => { setShowToolDropdown(!showToolDropdown); setShowModeDropdown(false); }}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-900 border border-dark-600
                          text-white hover:border-dark-500 transition-colors"
                            >
                                <selectedTool.icon className="w-4 h-4 text-accent-primary" />
                                <span className="font-medium">{selectedTool.name}</span>
                                <ChevronDown className="w-4 h-4 text-dark-400" />
                            </button>

                            {showToolDropdown && (
                                <div className="absolute top-full left-0 mt-2 w-56 py-2 rounded-xl bg-dark-900 border border-dark-600 shadow-xl z-10">
                                    {tools.map((tool) => (
                                        <button
                                            key={tool.id}
                                            onClick={() => { setSelectedTool(tool); setShowToolDropdown(false); }}
                                            className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors
                        ${selectedTool.id === tool.id
                                                    ? 'bg-accent-primary/20 text-accent-primary'
                                                    : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                                                }`}
                                        >
                                            <tool.icon className="w-4 h-4" />
                                            <span className="font-medium">{tool.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Mode Selector */}
                        <div className="relative">
                            <button
                                onClick={() => { setShowModeDropdown(!showModeDropdown); setShowToolDropdown(false); }}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-900 border border-dark-600
                          text-white hover:border-dark-500 transition-colors"
                            >
                                <span className="font-medium">{selectedMode.name}</span>
                                <ChevronDown className="w-4 h-4 text-dark-400" />
                            </button>

                            {showModeDropdown && (
                                <div className="absolute top-full left-0 mt-2 w-48 py-2 rounded-xl bg-dark-900 border border-dark-600 shadow-xl z-10">
                                    {modes.map((mode) => (
                                        <button
                                            key={mode.id}
                                            onClick={() => { setSelectedMode(mode); setShowModeDropdown(false); }}
                                            className={`w-full flex flex-col px-4 py-2 text-left transition-colors
                        ${selectedMode.id === mode.id
                                                    ? 'bg-accent-primary/20 text-accent-primary'
                                                    : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                                                }`}
                                        >
                                            <span className="font-medium">{mode.name}</span>
                                            <span className="text-xs text-dark-500">{mode.description}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Prompt Input */}
                    <div className="flex items-center gap-3 px-4 py-3">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`Ask ${selectedTool.name} to ${selectedMode.name.toLowerCase()} something...`}
                            className="flex-1 bg-transparent border-none text-white placeholder-dark-500 text-lg
                        focus:outline-none"
                            autoFocus
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !prompt.trim()}
                            className="flex items-center justify-center w-10 h-10 rounded-xl 
                        bg-gradient-to-r from-accent-primary to-accent-secondary
                        text-white disabled:opacity-50 disabled:cursor-not-allowed
                        hover:opacity-90 transition-opacity"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="px-4 pb-3">
                            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-sm text-red-400 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="px-4 pb-3">
                            <div className="p-4 rounded-lg bg-dark-900 text-sm text-dark-200 whitespace-pre-wrap max-h-64 overflow-auto">
                                {result}
                            </div>
                        </div>
                    )}

                    {/* Hint */}
                    <div className="px-4 pb-3 text-xs text-dark-500">
                        Press <kbd className="px-1.5 py-0.5 rounded bg-dark-700 text-dark-300">Enter</kbd> to send
                        or <kbd className="px-1.5 py-0.5 rounded bg-dark-700 text-dark-300">Esc</kbd> to close
                    </div>
                </div>
            </div>
        </div>
    )
}
