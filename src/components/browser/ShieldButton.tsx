import { useState, useEffect } from 'react'
import { Shield, ShieldCheck, ShieldOff, ChevronDown } from 'lucide-react'

interface ShieldButtonProps {
    className?: string
}

export default function ShieldButton({ className }: ShieldButtonProps) {
    const [enabled, setEnabled] = useState(true)
    const [stats, setStats] = useState({ totalBlocked: 0 })
    const [showDropdown, setShowDropdown] = useState(false)

    // Load initial state
    useEffect(() => {
        loadState()
    }, [])

    const loadState = async () => {
        try {
            const isEnabled = await window.electronAPI.adBlocker.isEnabled()
            setEnabled(isEnabled)

            const blockerStats = await window.electronAPI.adBlocker.getStats()
            setStats(blockerStats)
        } catch (err) {
            console.log('AdBlocker API not available:', err)
        }
    }

    const toggleBlocker = async () => {
        try {
            const newState = !enabled
            await window.electronAPI.adBlocker.setEnabled(newState)
            setEnabled(newState)
            setShowDropdown(false)
        } catch (err) {
            console.error('Failed to toggle ad blocker:', err)
        }
    }

    const resetStats = async () => {
        try {
            await window.electronAPI.adBlocker.resetStats()
            setStats({ totalBlocked: 0 })
            setShowDropdown(false)
        } catch (err) {
            console.error('Failed to reset stats:', err)
        }
    }

    return (
        <div className={`relative ${className}`}>
            {/* Shield Button */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`
                    flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all
                    ${enabled
                        ? 'text-green-400 hover:bg-green-500/20'
                        : 'text-dark-500 hover:bg-dark-700'
                    }
                `}
                title={enabled ? 'Shield is ON' : 'Shield is OFF'}
            >
                {enabled ? (
                    <ShieldCheck className="w-4 h-4" />
                ) : (
                    <ShieldOff className="w-4 h-4" />
                )}
                {stats.totalBlocked > 0 && (
                    <span className="text-xs font-medium">
                        {stats.totalBlocked > 999 ? '999+' : stats.totalBlocked}
                    </span>
                )}
                <ChevronDown className="w-3 h-3" />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowDropdown(false)}
                    />

                    {/* Menu */}
                    <div className="absolute top-full right-0 mt-2 w-64 rounded-xl bg-dark-800 
                        border border-dark-600 shadow-xl z-50 overflow-hidden">

                        {/* Header */}
                        <div className="px-4 py-3 border-b border-dark-700 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Shield className={`w-5 h-5 ${enabled ? 'text-green-400' : 'text-dark-500'}`} />
                                <span className="font-semibold text-white">Haven Shield</span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${enabled
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-dark-600 text-dark-400'
                                }`}>
                                {enabled ? 'ON' : 'OFF'}
                            </span>
                        </div>

                        {/* Stats */}
                        <div className="px-4 py-3 border-b border-dark-700">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">
                                    {stats.totalBlocked.toLocaleString()}
                                </div>
                                <div className="text-sm text-dark-400">
                                    Ads & Trackers Blocked
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-2">
                            <button
                                onClick={toggleBlocker}
                                className={`w-full px-3 py-2 rounded-lg text-left text-sm
                                    flex items-center gap-2 transition-colors
                                    ${enabled
                                        ? 'hover:bg-red-500/20 text-red-400'
                                        : 'hover:bg-green-500/20 text-green-400'
                                    }`}
                            >
                                {enabled ? (
                                    <>
                                        <ShieldOff className="w-4 h-4" />
                                        Turn Off Shield
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="w-4 h-4" />
                                        Turn On Shield
                                    </>
                                )}
                            </button>

                            <button
                                onClick={resetStats}
                                className="w-full px-3 py-2 rounded-lg text-left text-sm
                                    text-dark-400 hover:bg-dark-700 transition-colors"
                            >
                                Reset Statistics
                            </button>
                        </div>

                        {/* Info */}
                        <div className="px-4 py-2 bg-dark-850 text-xs text-dark-500">
                            Blocks ads, trackers, and malicious scripts
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
