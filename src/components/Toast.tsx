import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
    id: string
    message: string
    type: ToastType
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now().toString()
        setToasts(prev => [...prev, { id, message, type }])

        // Auto remove after 4 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 4000)
    }, [])

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />
            case 'error': return <AlertCircle className="w-5 h-5 text-red-400" />
            default: return <Info className="w-5 h-5 text-blue-400" />
        }
    }

    const getColor = (type: ToastType) => {
        switch (type) {
            case 'success': return 'border-green-500/30 bg-green-500/10'
            case 'error': return 'border-red-500/30 bg-red-500/10'
            default: return 'border-blue-500/30 bg-blue-500/10'
        }
    }

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-16 right-4 z-50 flex flex-col gap-3 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`toast-enter pointer-events-auto flex items-center gap-3 px-4 py-3 
                                    rounded-xl border ${getColor(toast.type)} backdrop-blur-lg
                                    shadow-lg shadow-black/20 min-w-[300px] max-w-[400px]`}
                    >
                        {getIcon(toast.type)}
                        <p className="flex-1 text-sm text-white">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-1 rounded hover:bg-white/10 text-dark-400 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}
