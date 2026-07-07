import { useJobsStore } from '@/stores/jobsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import {
  jobsInPeriod,
  totalHours,
  totalChargedByCurrency,
  totalChargedInCurrency
} from '@/lib/stats'
import { findCurrency } from '@/lib/currencies'
import { formatMoney } from '@/lib/format'
import type { Period } from '@/lib/stats'
import type { ProductivityMode } from '@/stores/settingsStore'

export default function ProductivityBars(): JSX.Element {
  const jobs = useJobsStore((s) => s.jobs)
  const goalDay = useSettingsStore((s) => s.goalDailyHours)
  const goalWeek = useSettingsStore((s) => s.goalWeeklyHours)
  const goalMonth = useSettingsStore((s) => s.goalMonthlyHours)
  const customCurrencies = useSettingsStore((s) => s.customCurrencies)
  const currencyCode = useSettingsStore((s) => s.currencyCode)
  const getMoneyGoals = useSettingsStore((s) => s.getMoneyGoals)
  const mode = useSettingsStore((s) => s.productivityMode)
  const setMode = useSettingsStore((s) => s.setProductivityMode)

  const dayJobs = jobsInPeriod(jobs, 'day')
  const weekJobs = jobsInPeriod(jobs, 'week')
  const monthJobs = jobsInPeriod(jobs, 'month')

  if (jobs.length === 0) {
    return (
      <div className="px-3 py-3 rounded-xl border border-chalk-08 bg-ink-700/40 text-center text-[10px] text-chalk-30">
        Guarda tu primer trabajo para ver tus indicadores.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 px-3 py-2.5 rounded-xl border border-chalk-08 bg-ink-700/40">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-[0.18em] text-chalk-30">
          Productividad
        </span>
        <ModeToggle mode={mode} onChange={setMode} />
      </div>

      {mode === 'hours' ? (
        <HoursMode
          dayJobs={dayJobs}
          weekJobs={weekJobs}
          monthJobs={monthJobs}
          goalDay={goalDay}
          goalWeek={goalWeek}
          goalMonth={goalMonth}
          customCurrencies={customCurrencies}
        />
      ) : (
        <MoneyMode
          dayJobs={dayJobs}
          weekJobs={weekJobs}
          monthJobs={monthJobs}
          currencyCode={currencyCode}
          goals={getMoneyGoals(currencyCode)}
          customCurrencies={customCurrencies}
        />
      )}
    </div>
  )
}

function ModeToggle({
  mode,
  onChange
}: {
  mode: ProductivityMode
  onChange: (m: ProductivityMode) => void
}): JSX.Element {
  return (
    <div className="flex items-center bg-ink-800 rounded-full p-0.5 no-drag">
      <ToggleButton
        active={mode === 'hours'}
        onClick={() => onChange('hours')}
        label="Horas"
      />
      <ToggleButton
        active={mode === 'money'}
        onClick={() => onChange('money')}
        label="Dinero"
      />
    </div>
  )
}

function ToggleButton({
  active,
  onClick,
  label
}: {
  active: boolean
  onClick: () => void
  label: string
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider transition-colors ${
        active ? 'bg-mint text-ink font-semibold' : 'text-chalk-50 hover:text-chalk-70'
      }`}
    >
      {label}
    </button>
  )
}

function HoursMode({
  dayJobs,
  weekJobs,
  monthJobs,
  goalDay,
  goalWeek,
  goalMonth,
  customCurrencies
}: {
  dayJobs: ReturnType<typeof useJobsStore.getState>['jobs']
  weekJobs: ReturnType<typeof useJobsStore.getState>['jobs']
  monthJobs: ReturnType<typeof useJobsStore.getState>['jobs']
  goalDay: number
  goalWeek: number
  goalMonth: number
  customCurrencies: ReturnType<typeof useSettingsStore.getState>['customCurrencies']
}): JSX.Element {
  const dayHours = totalHours(dayJobs)
  const weekHours = totalHours(weekJobs)
  const monthHours = totalHours(monthJobs)

  return (
    <>
      <Bar period="day" label="día" current={dayHours} goal={goalDay} suffix="h" />
      <Bar period="week" label="sem" current={weekHours} goal={goalWeek} suffix="h" />
      <Bar period="month" label="mes" current={monthHours} goal={goalMonth} suffix="h" />
      <EarningsRow
        jobs={dayJobs}
        weekJobs={weekJobs}
        monthJobs={monthJobs}
        customCurrencies={customCurrencies}
      />
    </>
  )
}

function MoneyMode({
  dayJobs,
  weekJobs,
  monthJobs,
  currencyCode,
  goals,
  customCurrencies
}: {
  dayJobs: ReturnType<typeof useJobsStore.getState>['jobs']
  weekJobs: ReturnType<typeof useJobsStore.getState>['jobs']
  monthJobs: ReturnType<typeof useJobsStore.getState>['jobs']
  currencyCode: string
  goals: { day: number; week: number; month: number }
  customCurrencies: ReturnType<typeof useSettingsStore.getState>['customCurrencies']
}): JSX.Element {
  const cur = findCurrency(currencyCode, customCurrencies)
  const dayAmt = totalChargedInCurrency(dayJobs, currencyCode)
  const weekAmt = totalChargedInCurrency(weekJobs, currencyCode)
  const monthAmt = totalChargedInCurrency(monthJobs, currencyCode)

  return (
    <>
      <div className="text-[9px] text-chalk-30 font-mono">
        Metas en <span className="text-chalk-70">{currencyCode}</span> — solo cuenta
        lo cobrado en esa moneda.
      </div>
      <MoneyBar label="día" current={dayAmt} goal={goals.day} currencySymbol={cur.symbol} formatFn={(v) => formatMoney(v, cur)} />
      <MoneyBar label="sem" current={weekAmt} goal={goals.week} currencySymbol={cur.symbol} formatFn={(v) => formatMoney(v, cur)} />
      <MoneyBar label="mes" current={monthAmt} goal={goals.month} currencySymbol={cur.symbol} formatFn={(v) => formatMoney(v, cur)} />
    </>
  )
}

function Bar({
  period: _period,
  label,
  current,
  goal,
  suffix
}: {
  period: Period
  label: string
  current: number
  goal: number
  suffix: string
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
      <span className="font-mono tabular-nums text-[10px] w-[72px] text-right">
        <span className="text-chalk-70">
          {current.toFixed(1)}
          {suffix}
        </span>
        {hasGoal && (
          <span className="text-chalk-30">
            {' '}
            / {goal}
            {suffix}
          </span>
        )}
      </span>
    </div>
  )
}

function MoneyBar({
  label,
  current,
  goal,
  currencySymbol: _currencySymbol,
  formatFn
}: {
  label: string
  current: number
  goal: number
  currencySymbol: string
  formatFn: (n: number) => string
}): JSX.Element {
  const hasGoal = goal > 0
  const pct = hasGoal ? (current / goal) * 100 : 0
  const clamped = Math.min(pct, 100)
  const exceeded = pct > 100
  const fillColor = exceeded ? '#FCD34D' : '#5EEAD4'

  return (
    <div className="flex flex-col gap-0.5">
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
        {hasGoal ? (
          <span className="font-mono tabular-nums text-[10px] w-[36px] text-right text-chalk-70">
            {Math.round(pct)}%
          </span>
        ) : (
          <span className="text-[9px] text-chalk-30 w-[36px] text-right">
            sin meta
          </span>
        )}
      </div>
      <div className="flex justify-between pl-8 text-[10px] font-mono tabular-nums">
        <span className="text-chalk-70">{formatFn(current)}</span>
        {hasGoal && <span className="text-chalk-30">de {formatFn(goal)}</span>}
      </div>
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
