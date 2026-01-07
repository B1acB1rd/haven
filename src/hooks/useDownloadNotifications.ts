import { useEffect } from 'react'
import { useToast } from '../components/Toast'

interface DownloadedAsset {
    name: string
    type: string
    source: string
}

export function useDownloadNotifications() {
    const { showToast } = useToast()

    useEffect(() => {
        // Check if electronAPI and onDownloaded exist
        const assets = window.electronAPI?.assets as any
        if (!assets?.onDownloaded) return

        const cleanup = assets.onDownloaded((asset: unknown) => {
            const a = asset as DownloadedAsset
            showToast(`Downloaded: ${a.name} from ${a.source}`, 'success')
        })

        return cleanup
    }, [showToast])
}
