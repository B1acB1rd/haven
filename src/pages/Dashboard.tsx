import { useState, useEffect } from 'react'
import {
    FolderKanban,
    Bot,
    Image,
    TrendingUp,
    Clock,
    Plus,
    ArrowRight,
    Loader2,
    File
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface Project {
    id: string
    name: string
    type: string
    updatedAt: string
}

interface Stats {
    totalProjects: number
    totalAssets: number
    aiConfigured: boolean
}

const quickActions = [
    { icon: Bot, label: 'AI Tools', path: '/ai-tools', color: 'from-blue-500 to-cyan-500' },
    { icon: Image, label: 'Assets', path: '/assets', color: 'from-purple-500 to-pink-500' },
    { icon: FolderKanban, label: 'Projects', path: '/projects', color: 'from-green-500 to-emerald-500' },
]

function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
}

export default function Dashboard() {
    const [recentProjects, setRecentProjects] = useState<Project[]>([])
    const [stats, setStats] = useState<Stats>({ totalProjects: 0, totalAssets: 0, aiConfigured: false })
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
            if (!window.electronAPI?.projects) {
                // Browser dev mode - use mock data
                setRecentProjects([])
                setStats({ totalProjects: 0, totalAssets: 0, aiConfigured: false })
                return
            }

            // Load projects (get first 3)
            const projects = await window.electronAPI.projects.getAll()
            setRecentProjects(projects.slice(0, 3) as unknown as Project[])

            // Load assets count
            const assets = await window.electronAPI.assets.getAll()

            setStats({
                totalProjects: projects.length,
                totalAssets: assets.length,
                aiConfigured: false // No longer tracking this
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
            {!window.electronAPI?.projects && (
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-dark-500 
                                     group-hover:text-white group-hover:translate-x-1 transition-all" />
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

            {/* Recent Projects */}
            <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-accent-secondary" />
                        Recent Projects
                    </h2>
                    <Link
                        to="/projects"
                        className="text-sm text-accent-primary hover:text-accent-primary/80 transition-colors"
                    >
                        View all →
                    </Link>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-6 h-6 text-accent-primary animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {recentProjects.length > 0 ? recentProjects.map((project) => (
                            <Link
                                key={project.id}
                                to={`/projects/${project.id}`}
                                className="group p-5 rounded-xl bg-dark-800 border border-dark-700 
                         hover:border-accent-primary/50 transition-all duration-200"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center">
                                        <FolderKanban className="w-5 h-5 text-dark-400" />
                                    </div>
                                    <span className="text-xs text-dark-500 bg-dark-700 px-2 py-1 rounded-full">
                                        {project.type}
                                    </span>
                                </div>
                                <h3 className="font-medium text-white mb-1 group-hover:text-accent-primary transition-colors">
                                    {project.name}
                                </h3>
                                <p className="text-sm text-dark-500">{formatDate(project.updatedAt)}</p>
                            </Link>
                        )) : (
                            <div className="col-span-3 p-8 rounded-xl bg-dark-800/50 border border-dark-700 text-center">
                                <FolderKanban className="w-10 h-10 text-dark-600 mx-auto mb-3" />
                                <p className="text-dark-400 mb-4">No projects yet</p>
                                <Link
                                    to="/projects"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-primary text-white font-medium hover:bg-accent-primary/90"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create First Project
                                </Link>
                            </div>
                        )}

                        {/* New Project Card */}
                        {recentProjects.length > 0 && recentProjects.length < 3 && (
                            <Link
                                to="/projects"
                                className="group p-5 rounded-xl border-2 border-dashed border-dark-700 
                               hover:border-accent-primary/50 transition-all duration-200
                               flex flex-col items-center justify-center text-center min-h-[140px]"
                            >
                                <div className="w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center mb-3
                               group-hover:bg-accent-primary/20 transition-colors">
                                    <Plus className="w-5 h-5 text-dark-400 group-hover:text-accent-primary" />
                                </div>
                                <span className="text-sm font-medium text-dark-400 group-hover:text-white">
                                    Create New Project
                                </span>
                            </Link>
                        )}
                    </div>
                )}
            </section>

            {/* Stats Overview */}
            <section>
                <h2 className="text-lg font-semibold text-white mb-4">Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Projects', value: stats.totalProjects.toString(), icon: FolderKanban },
                        { label: 'Assets', value: stats.totalAssets.toString(), icon: File },
                        { label: 'Storage', value: 'Local', icon: TrendingUp },
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
