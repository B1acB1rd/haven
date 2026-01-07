import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import type { AppSettings } from '../types'

// Simplified User for local use
interface LocalUser {
    id: string
    displayName: string
}

// State interface
interface AppState {
    user: LocalUser
    settings: AppSettings
    isLoading: boolean
    isReady: boolean
}

// Action types
type AppAction =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_READY'; payload: boolean }
    | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }

// Initial state
const initialState: AppState = {
    user: {
        id: 'local-user',
        displayName: 'Local User',
    },
    settings: {
        theme: 'dark',
        sidebarCollapsed: false,
        apiKeys: {},
    },
    isLoading: true,
    isReady: false,
}

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload }
        case 'SET_READY':
            return { ...state, isReady: action.payload, isLoading: false }
        case 'UPDATE_SETTINGS':
            return {
                ...state,
                settings: { ...state.settings, ...action.payload },
            }
        default:
            return state
    }
}

// Context
interface AppContextType {
    state: AppState
    dispatch: React.Dispatch<AppAction>
    updateSettings: (settings: Partial<AppSettings>) => void
}

const AppContext = createContext<AppContextType | null>(null)

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(appReducer, initialState)

    // Initialize app state
    useEffect(() => {
        initializeApp()
    }, [])

    const initializeApp = async () => {
        try {
            // Load settings from store
            const savedSettings = await window.electronAPI?.settings?.get('app-settings')
            if (savedSettings) {
                dispatch({ type: 'UPDATE_SETTINGS', payload: savedSettings as Partial<AppSettings> })
            }

            dispatch({ type: 'SET_READY', payload: true })
        } catch (error) {
            console.error('Failed to initialize app:', error)
            dispatch({ type: 'SET_READY', payload: true })
        }
    }

    const updateSettings = async (settings: Partial<AppSettings>) => {
        dispatch({ type: 'UPDATE_SETTINGS', payload: settings })
        // Save to store
        try {
            await window.electronAPI?.settings?.set('app-settings', { ...state.settings, ...settings })
        } catch (error) {
            console.error('Failed to save settings:', error)
        }
    }

    return (
        <AppContext.Provider
            value={{
                state,
                dispatch,
                updateSettings,
            }}
        >
            {children}
        </AppContext.Provider>
    )
}

// Hook
export function useApp() {
    const context = useContext(AppContext)
    if (!context) {
        throw new Error('useApp must be used within an AppProvider')
    }
    return context
}

// Selector hooks
export function useUser() {
    const { state } = useApp()
    return state.user
}

export function useSettings() {
    const { state, updateSettings } = useApp()
    return { settings: state.settings, updateSettings }
}

export function useAppReady() {
    const { state } = useApp()
    return { isLoading: state.isLoading, isReady: state.isReady }
}
