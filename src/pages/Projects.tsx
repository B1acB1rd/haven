import { useState, useEffect } from 'react'
import {
    Plus,
    FolderKanban,
    Grid3X3,
    List,
    Search,
    Trash2,
    Edit2,
    Loader2,
    X
} from 'lucide-react'

interface Project {
    id: string
    name: string
    description: string | null
    type: string
    assetCount: number
    createdAt: string
    updatedAt: string
}

export default function Projects() {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [searchQuery, setSearchQuery] = useState('')
    const [showNewModal, setShowNewModal] = useState(false)
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Form state
    const [formName, setFormName] = useState('')
    const [formDescription, setFormDescription] = useState('')
    const [formType, setFormType] = useState('other')
    const [editingProject, setEditingProject] = useState<Project | null>(null)

    // Load projects
    useEffect(() => {
        loadProjects()
    }, [])

    const loadProjects = async () => {
        try {
            setLoading(true)
            // Check if running in Electron
            if (!window.electronAPI?.projects) {
                setProjects([])
                return
            }
            const data = await window.electronAPI.projects.getAll()
            setProjects(data as unknown as Project[])
        } catch (error) {
            console.error('Failed to load projects:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )

    const openModal = (project?: Project) => {
        if (project) {
            setEditingProject(project)
            setFormName(project.name)
            setFormDescription(project.description || '')
            setFormType(project.type)
        } else {
            setEditingProject(null)
            setFormName('')
            setFormDescription('')
            setFormType('other')
        }
        setShowNewModal(true)
    }

    const closeModal = () => {
        setShowNewModal(false)
        setEditingProject(null)
        setFormName('')
        setFormDescription('')
        setFormType('other')
    }

    const handleSubmit = async () => {
        if (!formName.trim()) return

        setSaving(true)
        try {
            if (editingProject) {
                await window.electronAPI.projects.update(editingProject.id, {
                    name: formName,
                    description: formDescription,
                    type: formType
                })
            } else {
                await window.electronAPI.projects.create({
                    name: formName,
                    description: formDescription,
                    type: formType
                })
            }
            await loadProjects()
            closeModal()
        } catch (error) {
            console.error('Failed to save project:', error)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this project?')) return

        try {
            await window.electronAPI.projects.delete(id)
            await loadProjects()
        } catch (error) {
            console.error('Failed to delete project:', error)
        }
    }

    const formatDate = (dateStr: string) => {
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

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
                    <p className="text-dark-400">Manage your creative projects and assets</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-accent-primary to-accent-secondary
                     text-white font-medium hover:opacity-90 transition-opacity"
                >
                    <Plus className="w-5 h-5" />
                    New Project
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
                {/* Search */}
                <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-800 border border-dark-700 
                       text-white placeholder-dark-500 focus:outline-none focus:border-accent-primary"
                    />
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-1 p-1 rounded-lg bg-dark-800">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-dark-700 text-white' : 'text-dark-400 hover:text-white'
                            }`}
                    >
                        <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-dark-700 text-white' : 'text-dark-400 hover:text-white'
                            }`}
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <FolderKanban className="w-16 h-16 text-dark-600 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
                    <p className="text-dark-400 mb-6">Create your first project to get started</p>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-primary text-white font-medium hover:bg-accent-primary/90"
                    >
                        <Plus className="w-5 h-5" />
                        Create Project
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProjects.map((project) => (
                        <div
                            key={project.id}
                            className="group p-5 rounded-xl bg-dark-800 border border-dark-700 
                         hover:border-accent-primary/50 transition-all duration-200 cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dark-700 to-dark-600 
                               flex items-center justify-center">
                                    <FolderKanban className="w-6 h-6 text-accent-primary" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-dark-400 bg-dark-700 px-2 py-1 rounded-full">
                                        {project.type}
                                    </span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openModal(project); }}
                                            className="p-1 rounded-md text-dark-500 hover:text-white hover:bg-dark-700"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                                            className="p-1 rounded-md text-dark-500 hover:text-red-400 hover:bg-dark-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-accent-primary transition-colors">
                                {project.name}
                            </h3>
                            <p className="text-sm text-dark-400 mb-4 line-clamp-2">{project.description || 'No description'}</p>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-dark-500">{project.assetCount || 0} assets</span>
                                <span className="text-dark-500">{formatDate(project.updatedAt)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredProjects.map((project) => (
                        <div
                            key={project.id}
                            className="group flex items-center gap-4 p-4 rounded-xl bg-dark-800 border border-dark-700 
                         hover:border-accent-primary/50 transition-all duration-200 cursor-pointer"
                        >
                            <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center">
                                <FolderKanban className="w-5 h-5 text-accent-primary" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-white group-hover:text-accent-primary transition-colors">
                                    {project.name}
                                </h3>
                                <p className="text-sm text-dark-500 truncate">{project.description || 'No description'}</p>
                            </div>

                            <span className="text-xs text-dark-400 bg-dark-700 px-2 py-1 rounded-full">
                                {project.type}
                            </span>

                            <span className="text-sm text-dark-500 w-24 text-right">{project.assetCount || 0} assets</span>
                            <span className="text-sm text-dark-500 w-28">{formatDate(project.updatedAt)}</span>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); openModal(project); }}
                                    className="p-2 rounded-md text-dark-400 hover:text-white hover:bg-dark-700"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                                    className="p-2 rounded-md text-dark-400 hover:text-red-400 hover:bg-dark-700"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* New/Edit Project Modal */}
            {showNewModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 modal-backdrop">
                    <div className="modal-content w-full max-w-2xl p-6 rounded-2xl bg-dark-800 border border-dark-700 max-h-[90vh] overflow-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">
                                {editingProject ? 'Edit Project' : 'Create New Project'}
                            </h2>
                            <button onClick={closeModal} className="p-1 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Templates Section (only for new projects) */}
                        {!editingProject && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-dark-300 mb-3">Start from Template</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { name: 'YouTube Video', type: 'video', description: 'Script, thumbnail, SEO' },
                                        { name: 'Blog Post', type: 'writing', description: 'Draft, images, publish' },
                                        { name: 'Music Track', type: 'audio', description: 'Lyrics, melody, mix' },
                                        { name: 'Design Project', type: 'design', description: 'Mockups, assets, finals' },
                                        { name: 'Social Campaign', type: 'other', description: 'Posts, graphics, schedule' },
                                        { name: 'Podcast Episode', type: 'audio', description: 'Script, recording, edit' },
                                        { name: 'AI Art Series', type: 'design', description: 'Prompts, generations, curation' },
                                        { name: 'Blank Project', type: 'other', description: 'Start from scratch' },
                                    ].map((template) => (
                                        <button
                                            key={template.name}
                                            type="button"
                                            onClick={() => {
                                                if (template.name !== 'Blank Project') {
                                                    setFormName(template.name)
                                                    setFormDescription(template.description)
                                                }
                                                setFormType(template.type)
                                            }}
                                            className={`p-3 rounded-xl border text-left transition-all hover-scale
                                                ${formType === template.type && formName === template.name
                                                    ? 'bg-accent-primary/20 border-accent-primary/50'
                                                    : 'bg-dark-900 border-dark-600 hover:border-dark-500'
                                                }`}
                                        >
                                            <p className="font-medium text-white text-sm">{template.name}</p>
                                            <p className="text-xs text-dark-500 mt-1">{template.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-1">Project Name</label>
                            <input
                                type="text"
                                placeholder="My Creative Project"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg bg-dark-900 border border-dark-600 
                             text-white placeholder-dark-500 focus:outline-none focus:border-accent-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-1">Description</label>
                            <textarea
                                placeholder="What's this project about?"
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2 rounded-lg bg-dark-900 border border-dark-600 
                             text-white placeholder-dark-500 focus:outline-none focus:border-accent-primary resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-1">Type</label>
                            <select
                                value={formType}
                                onChange={(e) => setFormType(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg bg-dark-900 border border-dark-600 
                                   text-white focus:outline-none focus:border-accent-primary"
                            >
                                <option value="video">Video</option>
                                <option value="audio">Audio</option>
                                <option value="design">Design</option>
                                <option value="writing">Writing</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-6">
                        <button
                            onClick={closeModal}
                            className="px-4 py-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving || !formName.trim()}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-primary text-white font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {editingProject ? 'Save Changes' : 'Create Project'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
