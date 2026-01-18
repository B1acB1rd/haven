import { useState, useEffect } from 'react'
import {
    Bot,
    Image,
    TrendingUp,
    Globe,
    Music,
    File
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface Stats {
    totalAssets: number
}

const quickActions = [
    { icon: Bot, label: 'AI Tools', path: '/ai-tools', color: 'from-blue-500 to-cyan-500' },
    { icon: Image, label: 'Assets', path: '/assets', color: 'from-purple-500 to-pink-500' },
    { icon: Globe, label: 'Browser', path: '/browser', color: 'from-green-500 to-emerald-500' },
    { icon: Music, label: 'Music', path: '/music', color: 'from-orange-500 to-red-500' },
]

export default function Dashboard() {
    const [stats, setStats] = useState<Stats>({ totalAssets: 0 })
    const [loading, setLoading] = useState(true)
    const [notes, setNotes] = useState('')
    const [notesSaved, setNotesSaved] = useState(false)

    useEffect(() => {
        loadDashboardData()
        loadNotes()
    }, [])

    // Auto-save notes with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (notes && window.electronAPI?.settings) {
                window.electronAPI.settings.set('quickNotes', notes)
                setNotesSaved(true)
                setTimeout(() => setNotesSaved(false), 1500)
            }
        }, 1000)
        return () => clearTimeout(timer)
    }, [notes])

    const loadNotes = async () => {
        try {
            if (window.electronAPI?.settings) {
                const savedNotes = await window.electronAPI.settings.get('quickNotes') as string | null
                if (savedNotes) setNotes(savedNotes)
            }
        } catch (error) {
            console.error('Failed to load notes:', error)
        }
    }

    const loadDashboardData = async () => {
        try {
            setLoading(true)

            // Check if running in Electron (electronAPI available)
            if (!window.electronAPI?.assets) {
                setStats({ totalAssets: 0 })
                return
            }

            // Load assets count
            const assets = await window.electronAPI.assets.getAll()

            setStats({
                totalAssets: assets.length,
            })
        } catch (error) {
            console.error('Failed to load dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">Welcome to Haven</h1>
                <p className="text-dark-400 text-lg">Your creative sanctuary for AI tools and productivity</p>
            </div>

            {/* Browser Dev Mode Banner */}
            {!window.electronAPI?.assets && (
                <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <p className="text-sm text-amber-400">
                        <strong>Development Mode:</strong> Run <code className="bg-dark-800 px-2 py-0.5 rounded">npm run electron:dev</code> for full functionality with AI tools and webviews.
                    </p>
                </div>
            )}

            {/* Quick Actions */}
            <section className="mb-10">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent-primary" />
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {quickActions.map((action) => (
                        <Link
                            key={action.label}
                            to={action.path}
                            className="group relative overflow-hidden rounded-xl p-6 bg-dark-800 border border-dark-700 
                         hover:border-dark-600 transition-all duration-300 hover:scale-[1.02]"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 
                              group-hover:opacity-10 transition-opacity duration-300`} />
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} 
                              flex items-center justify-center mb-4`}>
                                <action.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-1">{action.label}</h3>
                            <p className="text-sm text-dark-400">Click to get started</p>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Quick Notes */}
            <section className="mb-10">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <File className="w-5 h-5 text-yellow-500" />
                    Quick Notes
                    {notesSaved && (
                        <span className="text-xs text-green-400 font-normal ml-2">✓ Saved</span>
                    )}
                </h2>
                <div className="p-4 rounded-xl bg-dark-800 border border-dark-700">
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Jot down quick ideas, links, or reminders..."
                        className="w-full h-32 bg-transparent text-white placeholder-dark-500 
                                   resize-none focus:outline-none text-sm leading-relaxed"
                    />
                </div>
            </section>

            {/* Stats Overview */}
            <section>
                <h2 className="text-lg font-semibold text-white mb-4">Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                        { label: 'Assets', value: loading ? '...' : stats.totalAssets.toString(), icon: Image },
                        { label: 'Storage', value: 'Local', icon: TrendingUp },
                        { label: 'Status', value: 'Ready', icon: Globe },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="p-5 rounded-xl bg-dark-800 border border-dark-700"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <stat.icon className="w-4 h-4 text-dark-500" />
                                <p className="text-sm text-dark-400">{stat.label}</p>
                            </div>
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}

