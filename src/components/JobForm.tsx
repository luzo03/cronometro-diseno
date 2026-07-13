import type { Currency } from '@/lib/currencies'

type Props = {
  jobName: string
  charged: string
  currency: Currency
  currencies: Currency[]
  onNameChange: (v: string) => void
  onChargedChange: (v: string) => void
  onCurrencyChange: (code: string) => void
}

export default function JobForm({
  jobName,
  charged,
  currency,
  currencies,
  onNameChange,
  onChargedChange,
  onCurrencyChange
}: Props): JSX.Element {
  return (
    <div className="flex flex-col gap-2 no-drag">
      <input
        type="text"
        value={jobName}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Nombre del trabajo"
        className="w-full px-3 py-2 rounded-lg bg-ink-700 border border-chalk-08 text-chalk placeholder:text-chalk-30 text-[12px] focus-mint transition"
      />
      <div className="flex gap-1.5">
        <div className="flex-1 flex items-center bg-ink-700 border border-chalk-08 rounded-lg focus-within:border-mint focus-within:shadow-[0_0_0_1px_rgb(var(--accent-rgb)/0.35)] transition">
          <span className="pl-3 pr-1 text-chalk-50 text-[12px] font-mono">
            {currency.symbol}
          </span>
          <input
            type="number"
            value={charged}
            onChange={(e) => onChargedChange(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="w-full bg-transparent pr-3 py-2 text-chalk placeholder:text-chalk-30 text-[12px] font-mono tabular-nums"
          />
        </div>
        <select
          value={currency.code}
          onChange={(e) => onCurrencyChange(e.target.value)}
          className="px-2.5 py-2 rounded-lg bg-ink-700 border border-chalk-08 text-chalk text-[11px] font-mono focus-mint transition cursor-pointer"
        >
          {currencies.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
