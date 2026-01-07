import { useState, useEffect, useRef } from 'react'
import {
    FileText,
    X,
    Maximize2,
    Minimize2,
    Bold,
    Italic,
    List,
    Link,
    Save,
    Trash2
} from 'lucide-react'

interface QuickNotesProps {
    isOpen: boolean
    onClose: () => void
}

interface Note {
    id: string
    content: string
    updatedAt: string
}

export default function QuickNotes({ isOpen, onClose }: QuickNotesProps) {
    const [notes, setNotes] = useState<Note[]>([])
    const [activeNote, setActiveNote] = useState<Note | null>(null)
    const [content, setContent] = useState('')
    const [isExpanded, setIsExpanded] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Load notes from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('haven-notes')
        if (saved) {
            const parsed = JSON.parse(saved) as Note[]
            setNotes(parsed)
            if (parsed.length > 0) {
                setActiveNote(parsed[0])
                setContent(parsed[0].content)
            }
        }
    }, [])

    // Auto-save
    useEffect(() => {
        if (!activeNote) return

        const timer = setTimeout(() => {
            saveNote()
        }, 1000)

        return () => clearTimeout(timer)
    }, [content])

    const saveNote = () => {
        if (!activeNote) return

        setIsSaving(true)
        const updated = notes.map(n =>
            n.id === activeNote.id
                ? { ...n, content, updatedAt: new Date().toISOString() }
                : n
        )
        setNotes(updated)
        localStorage.setItem('haven-notes', JSON.stringify(updated))
        setTimeout(() => setIsSaving(false), 300)
    }

    const createNote = () => {
        const newNote: Note = {
            id: Date.now().toString(),
            content: '',
            updatedAt: new Date().toISOString()
        }
        const updated = [newNote, ...notes]
        setNotes(updated)
        setActiveNote(newNote)
        setContent('')
        localStorage.setItem('haven-notes', JSON.stringify(updated))
        textareaRef.current?.focus()
    }

    const deleteNote = (id: string) => {
        const updated = notes.filter(n => n.id !== id)
        setNotes(updated)
        localStorage.setItem('haven-notes', JSON.stringify(updated))

        if (activeNote?.id === id) {
            if (updated.length > 0) {
                setActiveNote(updated[0])
                setContent(updated[0].content)
            } else {
                setActiveNote(null)
                setContent('')
            }
        }
    }

    const selectNote = (note: Note) => {
        saveNote()
        setActiveNote(note)
        setContent(note.content)
    }

    const insertMarkdown = (prefix: string, suffix: string = '') => {
        const textarea = textareaRef.current
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const selectedText = content.slice(start, end)
        const newContent = content.slice(0, start) + prefix + selectedText + suffix + content.slice(end)

        setContent(newContent)

        setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start + prefix.length, end + prefix.length)
        }, 0)
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    if (!isOpen) return null

    return (
        <div className={`fixed z-40 bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl overflow-hidden
                        transition-all duration-300 ${isExpanded
                ? 'inset-4'
                : 'bottom-4 right-4 w-[400px] h-[500px]'}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700 bg-dark-800">
                <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent-primary" />
                    <span className="font-semibold text-white">Quick Notes</span>
                    {isSaving && (
                        <span className="text-xs text-dark-500 flex items-center gap-1">
                            <Save className="w-3 h-3" /> Saving...
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700"
                    >
                        {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex h-[calc(100%-52px)]">
                {/* Sidebar - Notes List */}
                <div className="w-32 border-r border-dark-700 flex flex-col bg-dark-850">
                    <button
                        onClick={createNote}
                        className="m-2 px-3 py-2 text-xs font-medium text-white bg-accent-primary rounded-lg hover:bg-accent-primary/90"
                    >
                        + New
                    </button>
                    <div className="flex-1 overflow-auto">
                        {notes.map(note => (
                            <div
                                key={note.id}
                                onClick={() => selectNote(note)}
                                className={`group px-3 py-2 cursor-pointer border-b border-dark-700/50
                                    ${activeNote?.id === note.id ? 'bg-dark-700' : 'hover:bg-dark-800'}`}
                            >
                                <p className="text-xs text-white truncate">
                                    {note.content.slice(0, 20) || 'Empty note'}
                                </p>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-[10px] text-dark-500">{formatDate(note.updatedAt)}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-dark-500 hover:text-red-400"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Editor */}
                <div className="flex-1 flex flex-col">
                    {/* Toolbar */}
                    <div className="flex items-center gap-1 px-3 py-2 border-b border-dark-700">
                        <button
                            onClick={() => insertMarkdown('**', '**')}
                            className="p-1.5 rounded text-dark-400 hover:text-white hover:bg-dark-700"
                            title="Bold"
                        >
                            <Bold className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => insertMarkdown('*', '*')}
                            className="p-1.5 rounded text-dark-400 hover:text-white hover:bg-dark-700"
                            title="Italic"
                        >
                            <Italic className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => insertMarkdown('\n- ')}
                            className="p-1.5 rounded text-dark-400 hover:text-white hover:bg-dark-700"
                            title="List"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => insertMarkdown('[', '](url)')}
                            className="p-1.5 rounded text-dark-400 hover:text-white hover:bg-dark-700"
                            title="Link"
                        >
                            <Link className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Text Area */}
                    {activeNote ? (
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Start typing... Supports **markdown**"
                            className="flex-1 w-full p-4 bg-transparent text-white placeholder-dark-500 
                                     resize-none focus:outline-none font-mono text-sm leading-relaxed"
                        />
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-dark-500">
                            <div className="text-center">
                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No notes yet</p>
                                <button
                                    onClick={createNote}
                                    className="mt-3 text-accent-primary hover:underline"
                                >
                                    Create your first note
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
