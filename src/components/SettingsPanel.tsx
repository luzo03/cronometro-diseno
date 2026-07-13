import { useState } from 'react'
import { Plus, X, Pin, PinOff, Minus, Type, RotateCcw, Check } from 'lucide-react'
import { useSettingsStore } from '@/stores/settingsStore'
import { presetCurrencies } from '@/lib/currencies'
import { accentPresets, normalizeHex } from '@/lib/color'
import ColorWheel from '@/components/ColorWheel'

export default function SettingsPanel(): JSX.Element {
  const hourlyRate = useSettingsStore((s) => s.hourlyRate)
  const setHourlyRate = useSettingsStore((s) => s.setHourlyRate)
  const customCurrencies = useSettingsStore((s) => s.customCurrencies)
  const addCurrency = useSettingsStore((s) => s.addCurrency)
  const removeCurrency = useSettingsStore((s) => s.removeCurrency)
  const alwaysOnTop = useSettingsStore((s) => s.alwaysOnTop)
  const setAlwaysOnTop = useSettingsStore((s) => s.setAlwaysOnTop)
  const goalDailyHours = useSettingsStore((s) => s.goalDailyHours)
  const setGoalDailyHours = useSettingsStore((s) => s.setGoalDailyHours)
  const goalWeeklyHours = useSettingsStore((s) => s.goalWeeklyHours)
  const setGoalWeeklyHours = useSettingsStore((s) => s.setGoalWeeklyHours)
  const goalMonthlyHours = useSettingsStore((s) => s.goalMonthlyHours)
  const setGoalMonthlyHours = useSettingsStore((s) => s.setGoalMonthlyHours)
  const currencyCode = useSettingsStore((s) => s.currencyCode)
  const moneyGoals = useSettingsStore((s) => s.moneyGoals)
  const setMoneyGoal = useSettingsStore((s) => s.setMoneyGoal)
  const currentMoneyGoals = moneyGoals[currencyCode] ?? { day: 0, week: 0, month: 0 }
  const zoomFactor = useSettingsStore((s) => s.zoomFactor)
  const setZoomFactor = useSettingsStore((s) => s.setZoomFactor)
  const accentColor = useSettingsStore((s) => s.accentColor)
  const setAccentColor = useSettingsStore((s) => s.setAccentColor)

  const [showCustomForm, setShowCustomForm] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newSymbol, setNewSymbol] = useState('')
  const [newName, setNewName] = useState('')

  function handleAdd(): void {
    const code = newCode.trim().toUpperCase()
    if (!code) return
    addCurrency({
      code,
      symbol: newSymbol.trim() || code,
      name: newName.trim() || code,
      locale: 'en-US'
    })
    setNewCode('')
    setNewSymbol('')
    setNewName('')
    setShowCustomForm(false)
  }

  async function toggleAlwaysOnTop(): Promise<void> {
    const next = !alwaysOnTop
    setAlwaysOnTop(next)
    await window.api?.window.setAlwaysOnTop(next)
  }

  return (
    <div className="px-3 pt-2 pb-3 flex flex-col gap-3 no-drag">
      <Section title="Tarifa por hora">
        <input
          type="number"
          value={hourlyRate || ''}
          onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          min="0"
          step="0.01"
          className="w-full px-3 py-2 rounded-lg bg-ink-700 border border-chalk-08 text-chalk text-[12px] font-mono tabular-nums focus-mint transition"
        />
      </Section>

      <Section title="Metas de horas">
        <div className="grid grid-cols-3 gap-1.5">
          <GoalInput
            label="día"
            value={goalDailyHours}
            onChange={setGoalDailyHours}
            unit="h"
          />
          <GoalInput
            label="sem"
            value={goalWeeklyHours}
            onChange={setGoalWeeklyHours}
            unit="h"
          />
          <GoalInput
            label="mes"
            value={goalMonthlyHours}
            onChange={setGoalMonthlyHours}
            unit="h"
          />
        </div>
        <p className="mt-1.5 text-[10px] text-chalk-30 leading-snug">
          Pon 0 para ocultar la meta de ese periodo.
        </p>
      </Section>

      <Section title={`Metas de ingreso (${currencyCode})`}>
        <div className="grid grid-cols-3 gap-1.5">
          <GoalInput
            label="día"
            value={currentMoneyGoals.day}
            onChange={(v) => setMoneyGoal(currencyCode, 'day', v)}
            unit={currencyCode}
          />
          <GoalInput
            label="sem"
            value={currentMoneyGoals.week}
            onChange={(v) => setMoneyGoal(currencyCode, 'week', v)}
            unit={currencyCode}
          />
          <GoalInput
            label="mes"
            value={currentMoneyGoals.month}
            onChange={(v) => setMoneyGoal(currencyCode, 'month', v)}
            unit={currencyCode}
          />
        </div>
        <p className="mt-1.5 text-[10px] text-chalk-30 leading-snug">
          Las metas se guardan por moneda. Cambia la moneda arriba para editar otras.
        </p>
      </Section>

      <Section title="Ventana">
        <button
          onClick={toggleAlwaysOnTop}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-ink-700 border border-chalk-08 text-[11px] hover:border-chalk-15 transition"
        >
          <span>Siempre encima</span>
          {alwaysOnTop ? (
            <Pin size={11} className="text-mint" />
          ) : (
            <PinOff size={11} className="text-chalk-30" />
          )}
        </button>
      </Section>

      <Section title="Color de acento">
        <AccentPicker current={accentColor} onPick={setAccentColor} />
      </Section>

      <Section title="Tamaño de texto">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoomFactor(zoomFactor - 0.1)}
            disabled={zoomFactor <= 0.7}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-ink-700 border border-chalk-08 text-chalk hover:border-mint disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Reducir"
          >
            <Minus size={12} />
          </button>
          <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-ink-700 border border-chalk-08 text-[11px] font-mono tabular-nums">
            <Type size={11} className="text-chalk-50" />
            <span>{Math.round(zoomFactor * 100)}%</span>
          </div>
          <button
            onClick={() => setZoomFactor(zoomFactor + 0.1)}
            disabled={zoomFactor >= 1.6}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-ink-700 border border-chalk-08 text-chalk hover:border-mint disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Aumentar"
          >
            <Plus size={12} />
          </button>
          <button
            onClick={() => setZoomFactor(1)}
            disabled={Math.abs(zoomFactor - 1) < 0.01}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-ink-700 border border-chalk-08 text-chalk-70 hover:border-mint hover:text-chalk disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Restablecer"
          >
            <RotateCcw size={11} />
          </button>
        </div>
      </Section>

      <Section
        title="Monedas"
        action={
          <button
            onClick={() => setShowCustomForm((v) => !v)}
            className="flex items-center gap-1 text-mint hover:text-mint-soft text-[10px] uppercase tracking-wider transition"
            title="Agregar moneda"
          >
            <Plus size={11} />
            <span>Agregar</span>
          </button>
        }
      >
        <div className="flex flex-col gap-1">
          {presetCurrencies.map((c) => (
            <div
              key={c.code}
              className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-ink-700/40 text-[11px]"
            >
              <span>
                <span className="font-mono font-medium">{c.code}</span>
                <span className="text-chalk-50 ml-2">{c.name}</span>
              </span>
              <span className="text-chalk-30 text-[9px] uppercase tracking-wider">
                preset
              </span>
            </div>
          ))}

          {customCurrencies.map((c) => (
            <div
              key={c.code}
              className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-ink-700 border border-chalk-08 text-[11px] group"
            >
              <span>
                <span className="font-mono font-medium">{c.code}</span>
                <span className="text-chalk-50 ml-2">{c.name}</span>
              </span>
              <button
                onClick={() => removeCurrency(c.code)}
                className="text-chalk-50 hover:text-[#F87171] opacity-0 group-hover:opacity-100 transition"
                title="Eliminar"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>

        {showCustomForm && (
          <div className="mt-2 p-2.5 rounded-xl border border-chalk-08 bg-ink-700/60 flex flex-col gap-1.5 animate-fadeIn">
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="Código (ej. GTQ)"
              maxLength={6}
              className="w-full px-2 py-1.5 rounded-md bg-ink-800 border border-chalk-08 text-chalk text-[11px] font-mono focus-mint transition uppercase"
            />
            <input
              type="text"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              placeholder="Símbolo (ej. Q)"
              maxLength={4}
              className="w-full px-2 py-1.5 rounded-md bg-ink-800 border border-chalk-08 text-chalk text-[11px] focus-mint transition"
            />
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre (ej. Quetzal)"
              className="w-full px-2 py-1.5 rounded-md bg-ink-800 border border-chalk-08 text-chalk text-[11px] focus-mint transition"
            />
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 rounded-md bg-mint text-ink hover:bg-mint-soft font-semibold text-[11px] transition mt-0.5"
            >
              Agregar
            </button>
          </div>
        )}
      </Section>
    </div>
  )
}

function AccentPicker({
  current,
  onPick
}: {
  current: string
  onPick: (hex: string) => void
}): JSX.Element {
  const [customValue, setCustomValue] = useState('')
  const [error, setError] = useState(false)

  function tryCustom(): void {
    const hex = normalizeHex(customValue)
    if (!hex) {
      setError(true)
      return
    }
    setError(false)
    onPick(hex)
    setCustomValue('')
  }

  const currentUpper = current.toUpperCase()

  return (
    <div className="flex flex-col gap-3">
      <ColorWheel value={current} onChange={onPick} />

      <div className="flex items-center gap-1.5">
        <div className="flex-1 flex items-center bg-ink-700 border border-chalk-08 rounded-lg focus-within:border-mint transition">
          <div
            className="w-6 h-6 ml-1.5 rounded border border-chalk-08 flex-shrink-0"
            style={{ backgroundColor: current }}
          />
          <input
            type="text"
            value={customValue}
            onChange={(e) => {
              setCustomValue(e.target.value)
              setError(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') tryCustom()
            }}
            placeholder={current}
            className="w-full bg-transparent px-2 py-1.5 text-chalk text-[11px] font-mono uppercase min-w-0"
          />
        </div>
        <button
          onClick={tryCustom}
          disabled={!customValue.trim()}
          className="px-2.5 py-1.5 rounded-lg bg-mint hover:bg-mint-soft text-ink text-[10px] font-semibold uppercase tracking-wider transition disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
        >
          OK
        </button>
      </div>
      {error && (
        <span className="text-[10px] text-[#F87171]">
          Color inválido. Formato: #RRGGBB (ej. #FF5566)
        </span>
      )}

      <div>
        <div className="text-[9px] uppercase tracking-wider text-chalk-50 mb-1.5">
          Rápidos
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {accentPresets.map((p) => {
            const active = p.hex.toUpperCase() === currentUpper
            return (
              <button
                key={p.hex}
                onClick={() => onPick(p.hex)}
                title={p.name}
                className={`aspect-square rounded-lg border transition flex items-center justify-center ${
                  active
                    ? 'border-chalk ring-2 ring-chalk-15'
                    : 'border-chalk-08 hover:border-chalk-30'
                }`}
                style={{ backgroundColor: p.hex }}
              >
                {active && <Check size={12} className="text-ink" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function GoalInput({
  label,
  value,
  onChange,
  unit
}: {
  label: string
  value: number
  onChange: (n: number) => void
  unit: string
}): JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] uppercase tracking-wider text-chalk-50 text-center">
        {label}
      </span>
      <div className="flex items-center bg-ink-700 border border-chalk-08 rounded-lg focus-within:border-mint transition">
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder="0"
          min="0"
          step={unit === 'h' ? '0.5' : '1'}
          className="w-full bg-transparent pl-2 pr-1 py-1.5 text-chalk text-[12px] font-mono tabular-nums text-right min-w-0"
        />
        <span className="pr-2 text-chalk-50 text-[9px] font-mono uppercase">
          {unit}
        </span>
      </div>
    </div>
  )
}

function Section({
  title,
  action,
  children
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}): JSX.Element {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <span className="text-[9px] uppercase tracking-[0.18em] text-chalk-30">
          {title}
        </span>
        {action}
      </div>
      {children}
    </div>
  )
}
