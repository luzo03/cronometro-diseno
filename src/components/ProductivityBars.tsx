import { useJobsStore } from '@/stores/jobsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { jobsInPeriod, totalHours, totalChargedByCurrency } from '@/lib/stats'
import { findCurrency } from '@/lib/currencies'
import { formatMoney } from '@/lib/format'
import type { Period } from '@/lib/stats'

export default function ProductivityBars(): JSX.Element {
  const jobs = useJobsStore((s) => s.jobs)
  const goalDay = useSettingsStore((s) => s.goalDailyHours)
  const goalWeek = useSettingsStore((s) => s.goalWeeklyHours)
  const goalMonth = useSettingsStore((s) => s.goalMonthlyHours)
  const customCurrencies = useSettingsStore((s) => s.customCurrencies)

  const dayJobs = jobsInPeriod(jobs, 'day')
  const weekJobs = jobsInPeriod(jobs, 'week')
  const monthJobs = jobsInPeriod(jobs, 'month')

  const dayHours = totalHours(dayJobs)
  const weekHours = totalHours(weekJobs)
  const monthHours = totalHours(monthJobs)

  if (jobs.length === 0) {
    return (
      <div className="px-3 py-3 rounded-xl border border-chalk-08 bg-ink-700/40 text-center text-[10px] text-chalk-30">
        Guarda tu primer trabajo para ver tus indicadores.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 px-3 py-2.5 rounded-xl border border-chalk-08 bg-ink-700/40">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] uppercase tracking-[0.18em] text-chalk-30">
          Productividad
        </span>
      </div>
      <Bar period="day" label="día" current={dayHours} goal={goalDay} />
      <Bar period="week" label="sem" current={weekHours} goal={goalWeek} />
      <Bar period="month" label="mes" current={monthHours} goal={goalMonth} />
      <EarningsRow
        jobs={dayJobs}
        weekJobs={weekJobs}
        monthJobs={monthJobs}
        customCurrencies={customCurrencies}
      />
    </div>
  )
}

function Bar({
  period: _period,
  label,
  current,
  goal
}: {
  period: Period
  label: string
  current: number
  goal: number
}): JSX.Element {
  const hasGoal = goal > 0
  const pct = hasGoal ? (current / goal) * 100 : 0
  const clamped = Math.min(pct, 100)
  const exceeded = pct > 100
  const fillColor = exceeded ? '#FCD34D' : '#5EEAD4'

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-wider text-chalk-50 w-6 font-medium">
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-chalk-05 rounded-full overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: hasGoal ? `${clamped}%` : '0%',
            backgroundColor: fillColor,
            boxShadow: clamped > 0 ? `0 0 8px ${fillColor}66` : undefined
          }}
        />
      </div>
      <span className="font-mono tabular-nums text-[10px] w-[68px] text-right">
        <span className="text-chalk-70">{current.toFixed(1)}h</span>
        {hasGoal && <span className="text-chalk-30"> / {goal}h</span>}
      </span>
    </div>
  )
}

function EarningsRow({
  jobs,
  weekJobs,
  monthJobs,
  customCurrencies
}: {
  jobs: ReturnType<typeof useJobsStore.getState>['jobs']
  weekJobs: ReturnType<typeof useJobsStore.getState>['jobs']
  monthJobs: ReturnType<typeof useJobsStore.getState>['jobs']
  customCurrencies: ReturnType<typeof useSettingsStore.getState>['customCurrencies']
}): JSX.Element | null {
  const day = totalChargedByCurrency(jobs)
  const week = totalChargedByCurrency(weekJobs)
  const month = totalChargedByCurrency(monthJobs)

  const codes = new Set([...Object.keys(day), ...Object.keys(week), ...Object.keys(month)])
  if (codes.size === 0) return null

  return (
    <div className="mt-1 pt-2 border-t border-chalk-05 flex flex-col gap-0.5">
      {[...codes].map((code) => {
        const cur = findCurrency(code, customCurrencies)
        return (
          <div
            key={code}
            className="flex items-baseline justify-between gap-2 text-[10px]"
          >
            <span className="font-mono text-chalk-50 w-10">{code}</span>
            <div className="flex-1 grid grid-cols-3 gap-2 font-mono tabular-nums text-right">
              <Slot value={day[code] ?? 0} cur={cur} />
              <Slot value={week[code] ?? 0} cur={cur} />
              <Slot value={month[code] ?? 0} cur={cur} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Slot({
  value,
  cur
}: {
  value: number
  cur: ReturnType<typeof findCurrency>
}): JSX.Element {
  return (
    <span className={value > 0 ? 'text-mint' : 'text-chalk-30'}>
      {value > 0 ? formatMoney(value, cur) : '—'}
    </span>
  )
}
