import { Play, Pause, RotateCcw } from 'lucide-react'
import { useTimerStore } from '@/stores/timerStore'
import { formatTime } from '@/lib/format'
import { progressColor, computeRatio } from '@/lib/progressColor'

type Props = {
  charged: number
  hourlyRate: number
}

export default function TimerDisplay({ charged, hourlyRate }: Props): JSX.Element {
  const running = useTimerStore((s) => s.running)
  useTimerStore((s) => s.tick)
  const elapsedMs = useTimerStore.getState().getElapsedMs()
  const start = useTimerStore((s) => s.start)
  const pause = useTimerStore((s) => s.pause)
  const reset = useTimerStore((s) => s.reset)

  const ratio = computeRatio(elapsedMs, charged, hourlyRate)
  const color = progressColor(ratio)
  const clampedRatio = Math.min(ratio, 1)

  const size = 96
  const stroke = 4
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - clampedRatio)

  const showRing = charged > 0 && hourlyRate > 0
  const overBudget = ratio >= 1

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative ${overBudget ? 'animate-pulseRing' : ''} ${running && showRing ? 'glow-mint' : ''} rounded-full transition-shadow`}
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="-rotate-90 overflow-visible">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(250, 250, 250, 0.06)"
            strokeWidth={stroke}
            fill="none"
          />
          {showRing && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{
                transition: 'stroke-dashoffset 0.25s linear, stroke 0.25s linear'
              }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono text-[18px] tabular-nums font-medium tracking-tighter2"
            style={{
              color: showRing ? color : '#FAFAFA',
              transition: 'color 0.25s linear'
            }}
          >
            {formatTime(elapsedMs)}
          </span>
          {showRing && (
            <span
              className="text-[9px] uppercase tracking-widest mt-0.5"
              style={{ color, opacity: 0.7 }}
            >
              {ratio <= 1 ? `${Math.round(clampedRatio * 100)}%` : 'excedido'}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 no-drag">
        {!running ? (
          <button
            onClick={start}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-mint text-ink hover:bg-mint-soft text-[11px] font-semibold transition-colors"
            title="Iniciar"
          >
            <Play size={10} fill="currentColor" />
            <span>Iniciar</span>
          </button>
        ) : (
          <button
            onClick={pause}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-chalk-15 text-chalk hover:bg-chalk-08 text-[11px] font-semibold transition-colors"
            title="Pausar"
          >
            <Pause size={10} fill="currentColor" />
            <span>Pausar</span>
          </button>
        )}
        <button
          onClick={reset}
          className="flex items-center justify-center w-7 h-7 rounded-full text-chalk-50 hover:text-chalk hover:bg-chalk-05 transition-colors"
          title="Reiniciar"
        >
          <RotateCcw size={11} />
        </button>
      </div>
    </div>
  )
}
