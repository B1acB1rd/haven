import { NavLink } from 'react-router-dom'
import {
    LayoutDashboard,
    Bot,
    Share2,
    Image,
    Settings,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Music,
    PlayCircle,
    FileText,
    Globe
} from 'lucide-react'

interface SidebarProps {
    collapsed: boolean
    onToggle: () => void
}

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/ai-tools', icon: Bot, label: 'AI Tools' },
    { path: '/browser', icon: Globe, label: 'Browser' },
    { path: '/music', icon: Music, label: 'Music' },
    { path: '/videos', icon: PlayCircle, label: 'Videos' },
    { path: '/documents', icon: FileText, label: 'Documents' },
    { path: '/social', icon: Share2, label: 'Social Hub' },
    { path: '/assets', icon: Image, label: 'Assets' },
    { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
    return (
        <aside
            className={`
        h-full bg-dark-950 border-r border-dark-700 
        flex flex-col transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-64'}
      `}
        >
            {/* Logo */}
            <div className="h-14 flex items-center justify-center border-b border-dark-700 px-4">
                {!collapsed && (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-lg text-white">Haven</span>
                    </div>
                )}
                {collapsed && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-2 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
              ${isActive
                                ? 'bg-accent-primary/20 text-accent-primary'
                                : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                            }
              ${collapsed ? 'justify-center' : ''}
            `}
                    >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span className="font-medium">{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Collapse Toggle */}
            <div className="p-2 border-t border-dark-700">
                <button
                    onClick={onToggle}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                     text-dark-400 hover:bg-dark-800 hover:text-white transition-colors"
                >
                    {collapsed ? (
                        <ChevronRight className="w-5 h-5" />
                    ) : (
                        <>
                            <ChevronLeft className="w-5 h-5" />
                            <span className="font-medium">Collapse</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    )
}
