import { useJobsStore } from '@/stores/jobsStore'
import {
  jobsInPeriod,
  totalEffectiveness,
  type Effectiveness,
  type Period
} from '@/lib/stats'
import { formatTime } from '@/lib/format'

const EFFECTIVE = '#5EEAD4'
const LOST = '#F87171'

export default function StatsPanel(): JSX.Element {
  const jobs = useJobsStore((s) => s.jobs)

  if (jobs.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-chalk-30 text-[11px]">
        Guarda un trabajo para ver tus estadísticas.
      </div>
    )
  }

  const day = totalEffectiveness(jobsInPeriod(jobs, 'day'))
  const week = totalEffectiveness(jobsInPeriod(jobs, 'week'))
  const month = totalEffectiveness(jobsInPeriod(jobs, 'month'))
  const all = totalEffectiveness(jobs)

  return (
    <div className="flex flex-col gap-3 px-3 pt-2 pb-3 no-drag">
      <div className="text-[9px] uppercase tracking-[0.18em] text-chalk-30 px-1 pt-1">
        Efectividad
      </div>

      <Legend />

      <div className="flex flex-col gap-2.5">
        <PeriodBar period="day" label="Hoy" data={day} />
        <PeriodBar period="week" label="Semana" data={week} />
        <PeriodBar period="month" label="Mes" data={month} />
      </div>

      <div className="mt-1 pt-2 border-t border-chalk-05">
        <StatsTable
          rows={[
            { label: 'Hoy', data: day },
            { label: 'Semana', data: week },
            { label: 'Mes', data: month },
            { label: 'Total', data: all, emphasis: true }
          ]}
        />
      </div>

      <div className="mt-1 px-3 py-2 rounded-xl bg-mint-dim border border-mint/30 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-mint font-medium">
          Efectividad global
        </span>
        <span
          className="font-mono tabular-nums text-[15px] font-semibold"
          style={{ color: all.ratio >= 0.8 ? EFFECTIVE : LOST }}
        >
          {Math.round(all.ratio * 100)}%
        </span>
      </div>
    </div>
  )
}

function Legend(): JSX.Element {
  return (
    <div className="flex items-center gap-3 text-[10px] px-0.5">
      <div className="flex items-center gap-1.5">
        <span
          className="w-2 h-2 rounded-sm"
          style={{ backgroundColor: EFFECTIVE }}
        />
        <span className="text-chalk-70">Efectivo</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: LOST }} />
        <span className="text-chalk-70">Perdido</span>
      </div>
    </div>
  )
}

function PeriodBar({
  period: _period,
  label,
  data
}: {
  period: Period
  label: string
  data: Effectiveness
}): JSX.Element {
  const hasData = data.totalMs > 0
  const pctEffective = hasData ? (data.effectiveMs / data.totalMs) * 100 : 0
  const pctLost = hasData ? 100 - pctEffective : 0

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="uppercase tracking-wider text-chalk-50 font-medium">
          {label}
        </span>
        {hasData ? (
          <span className="font-mono tabular-nums text-chalk-70">
            {formatTime(data.totalMs)}
          </span>
        ) : (
          <span className="text-chalk-30">Sin trabajos</span>
        )}
      </div>

      <div className="h-4 bg-chalk-05 rounded-md overflow-hidden flex">
        {hasData ? (
          <>
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${pctEffective}%`,
                backgroundColor: EFFECTIVE,
                boxShadow:
                  pctEffective > 0 ? `inset 0 0 8px rgba(94,234,212,0.3)` : undefined
              }}
              title={`Efectivo: ${formatTime(data.effectiveMs)}`}
            />
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${pctLost}%`,
                backgroundColor: LOST,
                boxShadow:
                  pctLost > 0 ? `inset 0 0 8px rgba(248,113,113,0.3)` : undefined
              }}
              title={`Perdido: ${formatTime(data.lostMs)}`}
            />
          </>
        ) : null}
      </div>

      {hasData && (
        <div className="flex justify-between text-[10px] font-mono tabular-nums">
          <span style={{ color: EFFECTIVE }}>
            {formatTime(data.effectiveMs)} efectivo
          </span>
          <span style={{ color: data.lostMs > 0 ? LOST : 'rgba(250,250,250,0.3)' }}>
            {formatTime(data.lostMs)} perdido
          </span>
        </div>
      )}
    </div>
  )
}

function StatsTable({
  rows
}: {
  rows: { label: string; data: Effectiveness; emphasis?: boolean }[]
}): JSX.Element {
  return (
    <div className="rounded-xl border border-chalk-08 overflow-hidden">
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-1.5 bg-ink-700/60 text-[9px] uppercase tracking-wider text-chalk-50">
        <span>Periodo</span>
        <span className="text-right">Efectivo</span>
        <span className="text-right">Perdido</span>
        <span className="text-right">%</span>
      </div>
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-1.5 text-[11px] font-mono tabular-nums items-center ${
            i < rows.length - 1 ? 'border-b border-chalk-05' : ''
          } ${row.emphasis ? 'bg-chalk-05' : ''}`}
        >
          <span
            className={`text-chalk-70 ${row.emphasis ? 'font-semibold text-chalk' : ''}`}
          >
            {row.label}
          </span>
          <span className="text-right" style={{ color: EFFECTIVE }}>
            {formatTime(row.data.effectiveMs)}
          </span>
          <span
            className="text-right"
            style={{ color: row.data.lostMs > 0 ? LOST : 'rgba(250,250,250,0.3)' }}
          >
            {formatTime(row.data.lostMs)}
          </span>
          <span
            className="text-right font-semibold"
            style={{
              color:
                row.data.totalMs === 0
                  ? 'rgba(250,250,250,0.3)'
                  : row.data.ratio >= 0.8
                    ? EFFECTIVE
                    : LOST
            }}
          >
            {row.data.totalMs === 0 ? '—' : `${Math.round(row.data.ratio * 100)}%`}
          </span>
        </div>
      ))}
    </div>
  )
}
