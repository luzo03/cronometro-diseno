import type { Currency } from '@/lib/currencies'
import { compare, formatMoney } from '@/lib/format'

type Props = {
  charged: number
  elapsedMs: number
  hourlyRate: number
  currency: Currency
}

export default function ComparisonResult({
  charged,
  elapsedMs,
  hourlyRate,
  currency
}: Props): JSX.Element | null {
  if (charged <= 0 || hourlyRate <= 0 || elapsedMs <= 0) return null

  const { hours, realCost, diff, effectiveRate, profitable } = compare(
    charged,
    elapsedMs,
    hourlyRate
  )

  const diffColor = profitable ? '#5EEAD4' : '#F87171'

  return (
    <div className="px-3 py-2.5 rounded-xl bg-ink-700/60 border border-chalk-08 flex flex-col gap-1.5 animate-fadeIn">
      <Row label="Cobraste" value={formatMoney(charged, currency)} />
      <Row
        label="Costo real"
        value={formatMoney(realCost, currency)}
        sub={`${hours.toFixed(2)} h`}
      />
      <div className="h-px bg-chalk-05 my-0.5" />
      <Row
        label="Diferencia"
        value={`${diff >= 0 ? '+' : ''}${formatMoney(diff, currency)}`}
        color={diffColor}
        emphasis
      />
      <Row
        label="Tarifa efectiva"
        value={`${formatMoney(effectiveRate, currency)}/h`}
        color={diffColor}
      />
    </div>
  )
}

function Row({
  label,
  value,
  sub,
  color,
  emphasis
}: {
  label: string
  value: string
  sub?: string
  color?: string
  emphasis?: boolean
}): JSX.Element {
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span className="text-[10px] uppercase tracking-wider text-chalk-50">
        {label}
      </span>
      <div className="flex items-baseline gap-1.5">
        {sub && (
          <span className="text-[10px] text-chalk-30 font-mono tabular-nums">
            {sub}
          </span>
        )}
        <span
          className={`tabular-nums font-mono ${emphasis ? 'text-[13px] font-semibold' : 'text-[11px] font-medium'}`}
          style={color ? { color } : undefined}
        >
          {value}
        </span>
      </div>
    </div>
  )
}
