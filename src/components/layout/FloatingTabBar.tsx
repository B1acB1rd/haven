import {
    LayoutDashboard,
    Bot,
    Share2,
    Image,
    Settings,
    Music,
    PlayCircle,
    FileText,
    Globe,
    LucideIcon
} from 'lucide-react'
import { useNavigation, navItems } from '../../context/NavigationContext'

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
    LayoutDashboard,
    Bot,
    Share2,
    Image,
    Settings,
    Music,
    PlayCircle,
    FileText,
    Globe,
}

interface TabProps {
    path: string
    icon: string
    label: string
    shortcut?: number
    isActive: boolean
    onNavigate: () => void
}

function Tab({ icon, label, shortcut, isActive, onNavigate }: TabProps) {
    const IconComponent = iconMap[icon] || Globe

    return (
        <button
            onClick={onNavigate}
            className={`
                flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
                whitespace-nowrap text-sm font-medium
                ${isActive
                    ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30'
                    : 'text-dark-400 hover:bg-dark-700/50 hover:text-white border border-transparent'
                }
            `}
        >
            <IconComponent className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
            {shortcut && (
                <kbd className={`
                    ml-1 px-1.5 py-0.5 text-xs rounded hidden sm:inline-block
                    ${isActive
                        ? 'bg-accent-primary/20 text-accent-primary/80'
                        : 'bg-dark-700/50 text-dark-500'
                    }
                `}>
                    {shortcut}
                </kbd>
            )}
        </button>
    )
}

export default function FloatingTabBar() {
    const { currentPath, navigateTo } = useNavigation()

    // Filter out settings from main tabs (it's less frequently used)
    const mainTabs = navItems.filter(item => item.path !== '/settings')

    return (
        <div className="h-12 bg-dark-900/80 backdrop-blur-sm border-b border-dark-700/50 
            flex items-center px-4 gap-1 overflow-x-auto scrollbar-hide">
            {mainTabs.map(item => (
                <Tab
                    key={item.path}
                    path={item.path}
                    icon={item.icon}
                    label={item.label}
                    shortcut={item.shortcut}
                    isActive={currentPath === item.path}
                    onNavigate={() => navigateTo(item.path)}
                />
            ))}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Settings tab on the right */}
            <Tab
                path="/settings"
                icon="Settings"
                label="Settings"
                shortcut={9}
                isActive={currentPath === '/settings'}
                onNavigate={() => navigateTo('/settings')}
            />
        </div>
    )
}
