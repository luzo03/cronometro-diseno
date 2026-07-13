import { useState } from 'react'
import { X, Hourglass } from 'lucide-react'
import { useSessionStore } from '@/stores/sessionStore'

type Props = {
  onClose: () => void
}

export default function SessionModal({ onClose }: Props): JSX.Element {
  const startSession = useSessionStore((s) => s.startSession)
  const [hours, setHours] = useState('4')
  const [minutes, setMinutes] = useState('0')

  function handleStart(): void {
    const h = parseFloat(hours) || 0
    const m = parseFloat(minutes) || 0
    const total = h + m / 60
    if (total <= 0) return
    startSession(total)
    onClose()
  }

  const preview =
    (parseFloat(hours) || 0) + (parseFloat(minutes) || 0) / 60

  return (
    <div className="absolute inset-0 z-50 bg-ink/85 backdrop-blur-sm flex items-center justify-center px-4 animate-fadeIn no-drag">
      <div className="w-full max-w-xs bg-ink-800 border border-chalk-08 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-chalk-05">
          <div className="flex items-center gap-2">
            <Hourglass size={12} className="text-mint" />
            <span className="text-[11px] font-semibold tracking-tightish">
              Nueva sesión
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-5 h-5 rounded text-chalk-50 hover:text-chalk hover:bg-chalk-05 transition"
            title="Cerrar"
          >
            <X size={11} />
          </button>
        </div>

        <div className="px-4 pt-3 pb-4 flex flex-col gap-3">
          <p className="text-[11px] text-chalk-70 leading-relaxed">
            ¿De cuánto tiempo será tu sesión de trabajo hoy? Al final te digo
            cuánto del tiempo estuviste inactivo.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="Horas"
              value={hours}
              onChange={setHours}
              max={24}
            />
            <NumberInput
              label="Minutos"
              value={minutes}
              onChange={setMinutes}
              max={59}
            />
          </div>

          <div className="text-center text-[10px] text-chalk-50 font-mono tabular-nums">
            Total: <span className="text-mint">{preview.toFixed(2)}h</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-lg border border-chalk-08 text-chalk-70 hover:text-chalk hover:bg-chalk-05 text-[11px] font-medium transition"
            >
              Sin sesión
            </button>
            <button
              onClick={handleStart}
              disabled={preview <= 0}
              className="px-3 py-2 rounded-lg bg-mint hover:bg-mint-soft text-ink text-[11px] font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Empezar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function NumberInput({
  label,
  value,
  onChange,
  max
}: {
  label: string
  value: string
  onChange: (v: string) => void
  max: number
}): JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] uppercase tracking-wider text-chalk-50 text-center">
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min="0"
        max={max}
        step="1"
        className="w-full px-2 py-2 rounded-lg bg-ink-700 border border-chalk-08 text-chalk text-[16px] font-mono tabular-nums text-center focus-mint transition"
      />
    </div>
  )
}
