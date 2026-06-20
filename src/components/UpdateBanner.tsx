import { useEffect, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'

type Status = 'idle' | 'available' | 'downloading' | 'downloaded' | 'error'

export default function UpdateBanner(): JSX.Element | null {
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!window.api?.updater) return
    const offAvailable = window.api.updater.onAvailable(() => {
      setStatus('downloading')
      setProgress(0)
    })
    const offProgress = window.api.updater.onProgress((p) => {
      setStatus('downloading')
      setProgress(p.percent ?? 0)
    })
    const offDownloaded = window.api.updater.onDownloaded(() => {
      setStatus('downloaded')
    })
    const offError = window.api.updater.onError((msg) => {
      setStatus('error')
      setErrorMsg(msg)
    })
    return () => {
      offAvailable?.()
      offProgress?.()
      offDownloaded?.()
      offError?.()
    }
  }, [])

  if (status === 'idle' || status === 'error') return null

  async function install(): Promise<void> {
    await window.api?.updater.installUpdate()
  }

  return (
    <div className="absolute bottom-2.5 left-2.5 right-2.5 z-50 no-drag animate-fadeIn">
      {status === 'downloading' && (
        <div className="px-3 py-2 rounded-xl bg-ink-700/95 backdrop-blur border border-mint/30 text-chalk text-[11px] flex items-center gap-2 shadow-lg">
          <Download size={11} className="text-mint" />
          <span className="flex-1">Descargando actualización…</span>
          <span className="font-mono tabular-nums text-mint">
            {Math.floor(progress)}%
          </span>
        </div>
      )}
      {status === 'downloaded' && (
        <button
          onClick={install}
          className="w-full px-3 py-2 rounded-xl bg-mint hover:bg-mint-soft text-ink text-[11px] font-semibold flex items-center gap-2 justify-center transition shadow-lg"
        >
          <RefreshCw size={11} />
          <span>Reiniciar y actualizar</span>
        </button>
      )}
      {errorMsg && <span className="hidden">{errorMsg}</span>}
    </div>
  )
}
