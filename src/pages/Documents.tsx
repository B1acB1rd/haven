import { useTabs } from '../context/TabsContext'
import {
    FileText,
    File,
    Presentation,
    FolderOpen,
    Link,
    X,
    Plus,
    ExternalLink
} from 'lucide-react'

export default function Documents() {
    const { documentTabs, activeDocumentTabId, addDocumentTab, closeDocumentTab, setActiveDocumentTab } = useTabs()

    const activeTab = documentTabs.find(t => t.id === activeDocumentTabId)

    const openFromUrl = (url: string) => {
        if (!url.trim()) return

        // Create Google Docs viewer URL
        const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`

        addDocumentTab({
            name: url.split('/').pop() || 'Document',
            type: 'url',
            src: viewerUrl
        })
    }

    return (
        <div className="h-full flex flex-col">
            {/* Tab Bar */}
            {documentTabs.length > 0 && (
                <div className="flex items-center gap-1 px-4 pt-2 bg-dark-900 border-b border-dark-700 overflow-x-auto">
                    {documentTabs.map((tab) => (
                        <div
                            key={tab.id}
                            className={`group flex items-center gap-2 px-3 py-2 rounded-t-lg cursor-pointer transition-colors min-w-[150px] max-w-[200px]
                ${activeDocumentTabId === tab.id
                                    ? 'bg-dark-800 text-white'
                                    : 'bg-dark-900 text-dark-400 hover:text-white hover:bg-dark-800/50'
                                }`}
                            onClick={() => setActiveDocumentTab(tab.id)}
                        >
                            {tab.type === 'pdf' ? <FileText className="w-4 h-4 flex-shrink-0 text-red-400" /> :
                                <Link className="w-4 h-4 flex-shrink-0 text-green-400" />}
                            <span className="truncate text-sm">{tab.name}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); closeDocumentTab(tab.id); }}
                                className="ml-auto opacity-0 group-hover:opacity-100 hover:text-red-400"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                    <button className="p-2 text-dark-400 hover:text-white" onClick={() => setActiveDocumentTab(null)}>
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Document Content */}
            {activeTab ? (
                <div className="flex-1 flex flex-col">
                    {/* Toolbar */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-dark-800 border-b border-dark-700">
                        <div className="flex-1 px-3 py-1.5 rounded-lg bg-dark-900 text-sm text-dark-300 truncate">
                            {activeTab.name}
                        </div>
                        <button
                            onClick={() => window.open(activeTab.src, '_blank')}
                            className="p-1.5 rounded-md text-dark-400 hover:text-white hover:bg-dark-700"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Document Viewer */}
                    <div className="flex-1">
                        <iframe
                            src={activeTab.src}
                            className="w-full h-full"
                            style={{ border: 'none' }}
                        />
                    </div>
                </div>
            ) : (
                /* Document Selection */
                <div className="flex-1 p-8 overflow-auto">
                    <div className="max-w-3xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-white mb-2">Documents</h1>
                            <p className="text-dark-400">View PDFs, Word documents, and presentations</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Local File */}
                            <button
                                onClick={async () => {
                                    if (!(window.electronAPI as any)?.dialog) {
                                        alert('Local file access requires the Electron app.')
                                        return
                                    }
                                    const result = await (window.electronAPI as any).dialog.openDocument()
                                    if (result) {
                                        const ext = result.name.split('.').pop()?.toLowerCase()
                                        addDocumentTab({
                                            name: result.name,
                                            type: ext === 'pdf' ? 'pdf' : 'url',
                                            src: `local-file://${result.path}`
                                        })
                                    }
                                }}
                                className="group p-8 rounded-xl bg-dark-800 border border-dark-700 hover:border-dark-500 
                                         transition-all duration-200 text-center"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-pink-500 
                                                flex items-center justify-center mx-auto mb-4 text-white
                                                group-hover:scale-110 transition-transform">
                                    <FolderOpen className="w-8 h-8" />
                                </div>
                                <h3 className="font-semibold text-white text-lg mb-2">Open Local File</h3>
                                <p className="text-sm text-dark-400">PDF files supported</p>
                            </button>

                            {/* URL */}
                            <div className="p-8 rounded-xl bg-dark-800 border border-dark-700">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600 to-teal-500 
                                                flex items-center justify-center mx-auto mb-4 text-white">
                                    <Link className="w-8 h-8" />
                                </div>
                                <h3 className="font-semibold text-white text-lg mb-4 text-center">Open from URL</h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Paste document URL..."
                                        className="flex-1 px-3 py-2 rounded-lg bg-dark-900 border border-dark-600 
                                                   text-white placeholder-dark-500 focus:outline-none focus:border-accent-primary"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                openFromUrl((e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = ''
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={(e) => {
                                            const input = (e.target as HTMLElement).parentElement?.querySelector('input')
                                            if (input) {
                                                openFromUrl(input.value)
                                                input.value = ''
                                            }
                                        }}
                                        className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-500"
                                    >
                                        Open
                                    </button>
                                </div>
                                <p className="text-xs text-dark-500 mt-2 text-center">Uses Google Docs Viewer</p>
                            </div>
                        </div>

                        {/* Supported Formats */}
                        <div className="mt-8 p-6 rounded-xl bg-dark-800/50 border border-dark-700">
                            <h3 className="font-medium text-white mb-4">Supported Formats</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-red-400" />
                                    <span className="text-sm text-dark-300">PDF</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <File className="w-5 h-5 text-blue-400" />
                                    <span className="text-sm text-dark-300">Word (via URL)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Presentation className="w-5 h-5 text-orange-400" />
                                    <span className="text-sm text-dark-300">PowerPoint (via URL)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
