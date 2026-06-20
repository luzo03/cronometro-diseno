import { Trash2 } from 'lucide-react'
import { useJobsStore } from '@/stores/jobsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { findCurrency } from '@/lib/currencies'
import { compare, formatMoney, formatTime } from '@/lib/format'

export default function HistoryPanel(): JSX.Element {
  const jobs = useJobsStore((s) => s.jobs)
  const removeJob = useJobsStore((s) => s.removeJob)
  const customCurrencies = useSettingsStore((s) => s.customCurrencies)

  if (jobs.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-chalk-30 text-[11px]">
        Aún no hay trabajos guardados.
      </div>
    )
  }

  const totals = new Map<string, { charged: number; realCost: number; ms: number }>()
  for (const j of jobs) {
    const t = totals.get(j.currency) ?? { charged: 0, realCost: 0, ms: 0 }
    const { realCost } = compare(j.charged, j.elapsedMs, j.hourlyRate)
    t.charged += j.charged
    t.realCost += realCost
    t.ms += j.elapsedMs
    totals.set(j.currency, t)
  }

  return (
    <div className="flex flex-col gap-2.5 px-3 pb-3 pt-2 overflow-y-auto no-drag">
      <div className="text-[9px] uppercase tracking-[0.18em] text-chalk-30 px-1 pt-1">
        Totales
      </div>

      {[...totals.entries()].map(([code, t]) => {
        const cur = findCurrency(code, customCurrencies)
        const diff = t.charged - t.realCost
        const profitable = diff >= 0
        const diffColor = profitable ? '#5EEAD4' : '#F87171'
        return (
          <div
            key={`total-${code}`}
            className="px-3 py-2.5 rounded-xl bg-mint-dim border border-mint/30 flex flex-col gap-1"
          >
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] uppercase tracking-wider text-mint font-medium">
                {code}
              </span>
              <span className="font-mono tabular-nums text-[11px] text-chalk-70">
                {formatTime(t.ms)}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-chalk-50">Cobrado</span>
              <span className="font-mono tabular-nums">
                {formatMoney(t.charged, cur)}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-chalk-50">Costo real</span>
              <span className="font-mono tabular-nums">
                {formatMoney(t.realCost, cur)}
              </span>
            </div>
            <div
              className="flex justify-between text-[12px] font-semibold mt-0.5"
              style={{ color: diffColor }}
            >
              <span>Diferencia</span>
              <span className="font-mono tabular-nums">
                {diff >= 0 ? '+' : ''}
                {formatMoney(diff, cur)}
              </span>
            </div>
          </div>
        )
      })}

      <div className="text-[9px] uppercase tracking-[0.18em] text-chalk-30 px-1 pt-1">
        Trabajos · {jobs.length}
      </div>

      {jobs.map((j) => {
        const cur = findCurrency(j.currency, customCurrencies)
        const { diff, effectiveRate } = compare(j.charged, j.elapsedMs, j.hourlyRate)
        const profitable = diff >= 0
        const diffColor = profitable ? '#5EEAD4' : '#F87171'
        return (
          <div
            key={j.id}
            className="px-3 py-2 rounded-xl bg-ink-700/70 border border-chalk-08 group hover:border-chalk-15 transition-colors"
          >
            <div className="flex justify-between items-center gap-2 mb-1">
              <span className="font-medium truncate flex-1 text-[12px]">
                {j.name || <span className="text-chalk-30">Sin nombre</span>}
              </span>
              <span className="font-mono tabular-nums text-[10px] text-chalk-50">
                {formatTime(j.elapsedMs)}
              </span>
              <button
                onClick={() => removeJob(j.id)}
                className="opacity-0 group-hover:opacity-100 text-chalk-50 hover:text-[#F87171] transition"
                title="Eliminar"
              >
                <Trash2 size={11} />
              </button>
            </div>
            <div className="flex justify-between items-baseline text-[10px]">
              <span className="font-mono tabular-nums text-chalk-50">
                {formatMoney(effectiveRate, cur)}/h ef.
              </span>
              <span
                className="font-mono tabular-nums font-semibold"
                style={{ color: diffColor }}
              >
                {diff >= 0 ? '+' : ''}
                {formatMoney(diff, cur)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
