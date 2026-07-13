import { Hourglass, StopCircle } from 'lucide-react'
import { useSessionStore } from '@/stores/sessionStore'
import { useTimerStore } from '@/stores/timerStore'
import { useJobsStore } from '@/stores/jobsStore'
import { sessionWorkedMs, sessionJobsCount } from '@/lib/stats'
import { formatTime } from '@/lib/format'

export default function SessionBar(): JSX.Element | null {
  const active = useSessionStore((s) => s.active)
  const startedAt = useSessionStore((s) => s.startedAt)
  const plannedMs = useSessionStore((s) => s.plannedMs)
  const endSession = useSessionStore((s) => s.endSession)
  useTimerStore((s) => s.tick) // re-render tick
  const jobs = useJobsStore((s) => s.jobs)

  if (!active || startedAt === null || plannedMs <= 0) return null

  const now = Date.now()
  const sessionElapsed = now - startedAt
  const currentTimerMs = useTimerStore.getState().getElapsedMs()
  const workedMs = sessionWorkedMs(jobs, startedAt, currentTimerMs)
  const remaining = Math.max(0, plannedMs - sessionElapsed)
  const pct = Math.min(100, (sessionElapsed / plannedMs) * 100)

  function handleEnd(): void {
    const workedMsSnapshot = sessionWorkedMs(
      jobs,
      startedAt!,
      useTimerStore.getState().getElapsedMs()
    )
    const count = sessionJobsCount(jobs, startedAt!)
    endSession(workedMsSnapshot, count)
  }

  return (
    <div className="px-3 py-2 border-b border-chalk-05 bg-ink-800/60 no-drag">
      <div className="flex items-center gap-2 mb-1.5">
        <Hourglass size={11} className="text-mint" />
        <span className="text-[10px] uppercase tracking-wider text-chalk-50 font-medium">
          Sesión
        </span>
        <span className="font-mono tabular-nums text-[10px] text-chalk-70">
          {formatTime(sessionElapsed)} / {formatTime(plannedMs)}
        </span>
        <span className="flex-1 text-right font-mono tabular-nums text-[10px] text-mint">
          {formatTime(remaining)} restante
        </span>
        <button
          onClick={handleEnd}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider text-chalk-50 hover:text-[#F87171] hover:bg-chalk-05 transition"
          title="Terminar sesión"
        >
          <StopCircle size={10} />
          <span>Terminar</span>
        </button>
      </div>
      <div className="h-1 bg-chalk-05 rounded-full overflow-hidden">
        <div
          className="h-full bg-mint rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            boxShadow: pct > 0 ? '0 0 6px rgb(var(--accent-rgb) / 0.5)' : undefined
          }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[9px] text-chalk-30 font-mono tabular-nums">
        <span>
          Trabajado{' '}
          <span className="text-mint">{formatTime(workedMs)}</span>
        </span>
        <span>
          Inactivo{' '}
          <span className="text-chalk-70">
            {formatTime(Math.max(0, sessionElapsed - workedMs))}
          </span>
        </span>
      </div>
    </div>
  )
}
