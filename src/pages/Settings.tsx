import { useState, useEffect } from 'react'
import {
    User,
    Palette,
    Info,
    ChevronRight,
    Moon,
    Sun,
    Check
} from 'lucide-react'

interface SettingSection {
    id: string
    name: string
    icon: React.ReactNode
    description: string
}

const sections: SettingSection[] = [
    { id: 'account', name: 'Account', icon: <User className="w-5 h-5" />, description: 'Your workspace profile' },
    { id: 'appearance', name: 'Appearance', icon: <Palette className="w-5 h-5" />, description: 'Customize the app look and feel' },
    { id: 'about', name: 'About', icon: <Info className="w-5 h-5" />, description: 'App info and updates' },
]

export default function Settings() {
    const [activeSection, setActiveSection] = useState('account')
    const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark')

    // Load existing settings on mount
    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            // Check if running in Electron
            if (!window.electronAPI?.settings) {
                return // Use default theme
            }
            const savedTheme = await window.electronAPI.settings.get('theme') as 'dark' | 'light' | 'system' | null
            if (savedTheme) {
                setTheme(savedTheme)
                // Apply theme to body immediately
                const effectiveTheme = savedTheme === 'system'
                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                    : savedTheme
                document.body.setAttribute('data-theme', effectiveTheme)
            }
        } catch (error) {
            console.error('Failed to load settings:', error)
        }
    }

    const handleThemeChange = async (newTheme: 'dark' | 'light' | 'system') => {
        setTheme(newTheme)

        // Apply theme to body
        const effectiveTheme = newTheme === 'system'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : newTheme
        document.body.setAttribute('data-theme', effectiveTheme)

        try {
            if (window.electronAPI?.settings) {
                await window.electronAPI.settings.set('theme', newTheme)
            }
        } catch (error) {
            console.error('Failed to save theme:', error)
        }
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                <p className="text-dark-400">Manage your preferences</p>
            </div>

            <div className="flex gap-8">
                {/* Sidebar */}
                <div className="w-64 flex-shrink-0">
                    <nav className="space-y-1">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors
                  ${activeSection === section.id
                                        ? 'bg-accent-primary/20 text-accent-primary'
                                        : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                                    }`}
                            >
                                {section.icon}
                                <div className="flex-1">
                                    <span className="font-medium">{section.name}</span>
                                </div>
                                <ChevronRight className={`w-4 h-4 transition-transform ${activeSection === section.id ? 'rotate-90' : ''
                                    }`} />
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1">
                    {activeSection === 'account' && (
                        <div className="space-y-6">
                            <div className="p-6 rounded-xl bg-dark-800 border border-dark-700">
                                <h3 className="text-lg font-semibold text-white mb-4">Profile</h3>
                                <div className="flex items-center gap-6 mb-6">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary 
                                 flex items-center justify-center">
                                        <User className="w-10 h-10 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Guest User</p>
                                        <p className="text-dark-400 text-sm">No account needed — your data stays local</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-dark-900 border border-dark-700">
                                    <p className="text-sm text-dark-300">
                                        <strong className="text-white">Privacy First:</strong> Haven stores everything locally on your device.
                                        Your projects, notes, and preferences never leave your computer.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'appearance' && (
                        <div className="space-y-6">
                            <div className="p-6 rounded-xl bg-dark-800 border border-dark-700">
                                <h3 className="text-lg font-semibold text-white mb-4">Theme</h3>
                                <div className="flex gap-4">
                                    {[
                                        { id: 'dark', icon: Moon, label: 'Dark' },
                                        { id: 'light', icon: Sun, label: 'Light' },
                                        { id: 'system', icon: Palette, label: 'System' },
                                    ].map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => handleThemeChange(option.id as typeof theme)}
                                            className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border transition-all
                        ${theme === option.id
                                                    ? 'bg-accent-primary/20 border-accent-primary text-accent-primary'
                                                    : 'bg-dark-900 border-dark-600 text-dark-300 hover:border-dark-500'
                                                }`}
                                        >
                                            <option.icon className="w-5 h-5" />
                                            <span className="font-medium">{option.label}</span>
                                            {theme === option.id && <Check className="w-4 h-4 ml-2" />}
                                        </button>
                                    ))}
                                </div>

                            </div>
                        </div>
                    )}

                    {activeSection === 'about' && (
                        <div className="space-y-6">
                            <div className="p-6 rounded-xl bg-dark-800 border border-dark-700">
                                <h3 className="text-lg font-semibold text-white mb-4">About Haven</h3>
                                <div className="space-y-4 text-dark-300">
                                    <p><strong className="text-white">Version:</strong> 1.0.0</p>
                                    <p><strong className="text-white">Storage:</strong> Local (your device only)</p>
                                    <p className="leading-relaxed pt-2">
                                        <strong className="text-white">Haven</strong> is your creative sanctuary for AI tools and productivity.
                                        Access ChatGPT, Claude, Midjourney, social platforms, and more — all in one place.
                                    </p>
                                    <p className="leading-relaxed">
                                        <strong className="text-white">No API keys required.</strong> Log in directly to each platform.
                                        Your credentials stay with the platforms, not with us.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
