import { X, Hourglass, Coffee, Zap } from 'lucide-react'
import { useSessionStore } from '@/stores/sessionStore'
import { formatTime } from '@/lib/format'

export default function SessionSummary(): JSX.Element | null {
  const lastSummary = useSessionStore((s) => s.lastSummary)
  const dismissSummary = useSessionStore((s) => s.dismissSummary)

  if (!lastSummary) return null

  const { plannedMs, workedMs, jobsCount, startedAt, endedAt } = lastSummary
  const realElapsedMs = endedAt - startedAt
  const idleMs = Math.max(0, Math.min(plannedMs, realElapsedMs) - workedMs)
  const workedRatio = plannedMs > 0 ? Math.min(1, workedMs / plannedMs) : 0
  const productivityPct = Math.round(workedRatio * 100)

  const idleColor = productivityPct >= 70 ? '#5EEAD4' : '#FCD34D'

  return (
    <div className="absolute inset-0 z-50 bg-ink/85 backdrop-blur-sm flex items-center justify-center px-4 animate-fadeIn no-drag">
      <div className="w-full max-w-xs bg-ink-800 border border-chalk-08 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-chalk-05">
          <div className="flex items-center gap-2">
            <Hourglass size={12} className="text-mint" />
            <span className="text-[11px] font-semibold tracking-tightish">
              Resumen de sesión
            </span>
          </div>
          <button
            onClick={dismissSummary}
            className="flex items-center justify-center w-5 h-5 rounded text-chalk-50 hover:text-chalk hover:bg-chalk-05 transition"
            title="Cerrar"
          >
            <X size={11} />
          </button>
        </div>

        <div className="px-4 py-3 flex flex-col gap-3">
          <div className="flex items-center justify-center py-2">
            <div className="text-center">
              <div
                className="text-[36px] font-mono tabular-nums font-semibold tracking-tighter2"
                style={{ color: idleColor }}
              >
                {productivityPct}%
              </div>
              <div className="text-[9px] uppercase tracking-widest text-chalk-50 mt-0.5">
                Productividad
              </div>
            </div>
          </div>

          <div className="h-1.5 bg-chalk-05 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${productivityPct}%`,
                backgroundColor: idleColor,
                boxShadow: `0 0 8px ${idleColor}66`
              }}
            />
          </div>

          <div className="flex flex-col gap-1 pt-1">
            <Row
              icon={<Hourglass size={11} className="text-chalk-50" />}
              label="Planeado"
              value={formatTime(plannedMs)}
            />
            <Row
              icon={<Zap size={11} style={{ color: '#5EEAD4' }} />}
              label="Trabajado"
              value={formatTime(workedMs)}
              valueColor="#5EEAD4"
            />
            <Row
              icon={<Coffee size={11} style={{ color: idleColor }} />}
              label="Inactivo"
              value={formatTime(idleMs)}
              valueColor={idleColor}
            />
            <Row
              icon={<span className="text-chalk-50 text-[10px]">·</span>}
              label="Trabajos"
              value={String(jobsCount)}
            />
          </div>

          <button
            onClick={dismissSummary}
            className="mt-1 px-3 py-2 rounded-lg bg-mint hover:bg-mint-soft text-ink text-[11px] font-semibold transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({
  icon,
  label,
  value,
  valueColor
}: {
  icon: React.ReactNode
  label: string
  value: string
  valueColor?: string
}): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-ink-700/50">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] uppercase tracking-wider text-chalk-50">
          {label}
        </span>
      </div>
      <span
        className="font-mono tabular-nums text-[12px] font-medium"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </span>
    </div>
  )
}
