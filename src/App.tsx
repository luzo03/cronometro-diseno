import { useEffect, useRef, useState } from 'react'
import { X, Settings, History, Save, Minus, BarChart3, Hourglass } from 'lucide-react'
import TimerDisplay from '@/components/TimerDisplay'
import JobForm from '@/components/JobForm'
import ComparisonResult from '@/components/ComparisonResult'
import HistoryPanel from '@/components/HistoryPanel'
import SettingsPanel from '@/components/SettingsPanel'
import StatsPanel from '@/components/StatsPanel'
import UpdateBanner from '@/components/UpdateBanner'
import ProductivityBars from '@/components/ProductivityBars'
import SessionModal from '@/components/SessionModal'
import SessionBar from '@/components/SessionBar'
import SessionSummary from '@/components/SessionSummary'
import {
  useTimerStore,
  startTickerOnce,
  startPeriodicSaveOnce
} from '@/stores/timerStore'
import { useJobsStore } from '@/stores/jobsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useSessionStore } from '@/stores/sessionStore'
import { sessionWorkedMs, sessionJobsCount } from '@/lib/stats'
import { findCurrency } from '@/lib/currencies'
import { lighten, darken, rgbTriplet } from '@/lib/color'

type Panel = 'none' | 'history' | 'stats' | 'settings'

export default function App(): JSX.Element {
  const [jobName, setJobName] = useState('')
  const [charged, setCharged] = useState('')
  const [panel, setPanel] = useState<Panel>('none')
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [modalDismissedThisRun, setModalDismissedThisRun] = useState(false)

  const hourlyRate = useSettingsStore((s) => s.hourlyRate)
  const currencyCode = useSettingsStore((s) => s.currencyCode)
  const setCurrencyCode = useSettingsStore((s) => s.setCurrencyCode)
  const customCurrencies = useSettingsStore((s) => s.customCurrencies)
  const allCurrencies = useSettingsStore((s) => s.allCurrencies)
  const alwaysOnTop = useSettingsStore((s) => s.alwaysOnTop)
  const zoomFactor = useSettingsStore((s) => s.zoomFactor)
  const accentColor = useSettingsStore((s) => s.accentColor)

  const addJob = useJobsStore((s) => s.addJob)
  const jobsCount = useJobsStore((s) => s.jobs.length)

  const sessionActive = useSessionStore((s) => s.active)
  const sessionStartedAt = useSessionStore((s) => s.startedAt)
  const sessionPlannedMs = useSessionStore((s) => s.plannedMs)
  const sessionLastSummary = useSessionStore((s) => s.lastSummary)
  const endSession = useSessionStore((s) => s.endSession)
  const resetTimer = useTimerStore((s) => s.reset)
  useTimerStore((s) => s.tick)
  const elapsedMs = useTimerStore.getState().getElapsedMs()
  const running = useTimerStore((s) => s.running)

  useEffect(() => {
    startTickerOnce()
    startPeriodicSaveOnce()
  }, [])

  // Mostrar el modal de sesión al arrancar si no hay sesión activa ni resumen pendiente
  useEffect(() => {
    if (
      !sessionActive &&
      !sessionLastSummary &&
      !modalDismissedThisRun &&
      !showSessionModal
    ) {
      setShowSessionModal(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionActive, sessionLastSummary])

  // Auto-terminar la sesión cuando se cumple el tiempo planeado
  useEffect(() => {
    if (!sessionActive || sessionStartedAt === null || sessionPlannedMs <= 0)
      return
    const check = (): void => {
      const s = useSessionStore.getState()
      if (!s.active || s.startedAt === null) return
      const elapsedNow = Date.now() - s.startedAt
      if (elapsedNow >= s.plannedMs) {
        const workedMs = sessionWorkedMs(
          useJobsStore.getState().jobs,
          s.startedAt,
          useTimerStore.getState().getElapsedMs()
        )
        const count = sessionJobsCount(
          useJobsStore.getState().jobs,
          s.startedAt
        )
        endSession(workedMs, count)
      }
    }
    check()
    const id = setInterval(check, 5000)
    return () => clearInterval(id)
  }, [sessionActive, sessionStartedAt, sessionPlannedMs, endSession])

  useEffect(() => {
    window.api?.window.setAlwaysOnTop(alwaysOnTop)
  }, [alwaysOnTop])

  useEffect(() => {
    window.api?.window.setZoomFactor(zoomFactor)
  }, [zoomFactor])

  useEffect(() => {
    const root = document.documentElement
    const softHex = lighten(accentColor, 0.35)
    const deepHex = darken(accentColor, 0.15)
    root.style.setProperty('--accent-rgb', rgbTriplet(accentColor))
    root.style.setProperty('--accent-soft-rgb', rgbTriplet(softHex))
    root.style.setProperty('--accent-deep-rgb', rgbTriplet(deepHex))
  }, [accentColor])

  const chargedNum = parseFloat(charged) || 0
  const currency = findCurrency(currencyCode, customCurrencies)
  const canSave = elapsedMs > 0 && chargedNum > 0 && hourlyRate > 0 && !running
  const showComparison = chargedNum > 0 && hourlyRate > 0 && elapsedMs > 0

  const notifiedRef = useRef(false)
  useEffect(() => {
    if (elapsedMs === 0) {
      notifiedRef.current = false
      return
    }
    if (chargedNum <= 0 || hourlyRate <= 0) return
    const budgetMs = (chargedNum / hourlyRate) * 3_600_000
    if (budgetMs <= 0) return
    // Si el elapsed baja del presupuesto (usuario subió el monto cobrado),
    // permitimos que la próxima cruzada vuelva a notificar.
    if (elapsedMs < budgetMs) {
      notifiedRef.current = false
      return
    }
    if (notifiedRef.current) return
    notifiedRef.current = true
    const label = jobName.trim() ? ` — ${jobName.trim()}` : ''
    window.api?.notifications.notify({
      title: `¡Llegaste al presupuesto!${label}`,
      body: 'Ya cubriste el tiempo que cobraste. Cada minuto extra es regalado.'
    })
  }, [elapsedMs, chargedNum, hourlyRate, jobName])

  function handleSave(): void {
    if (!canSave) return
    addJob({
      name: jobName.trim(),
      charged: chargedNum,
      currency: currency.code,
      elapsedMs,
      hourlyRate
    })
    setJobName('')
    setCharged('')
    resetTimer()
  }

  function togglePanel(target: Panel): void {
    setPanel((current) => (current === target ? 'none' : target))
  }

  return (
    <div className="flex flex-col h-screen bg-ink text-chalk relative">
      <TitleBar
        onClose={() => window.api?.window.close()}
        onMinimize={() => window.api?.window.minimize()}
        onOpenSession={() => setShowSessionModal(true)}
        onToggleHistory={() => togglePanel('history')}
        onToggleStats={() => togglePanel('stats')}
        onToggleSettings={() => togglePanel('settings')}
        panel={panel}
        jobsCount={jobsCount}
        running={running}
        sessionActive={sessionActive}
      />

      <SessionBar />

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="px-4 pt-3 pb-3 flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <TimerDisplay charged={chargedNum} hourlyRate={hourlyRate} />
            <div className="flex-1 min-w-0">
              <JobForm
                jobName={jobName}
                charged={charged}
                currency={currency}
                currencies={allCurrencies()}
                onNameChange={setJobName}
                onChargedChange={setCharged}
                onCurrencyChange={setCurrencyCode}
              />
            </div>
          </div>

          {hourlyRate <= 0 && (
            <button
              onClick={() => setPanel('settings')}
              className="no-drag w-full px-3 py-2 rounded-lg bg-mint-dim border border-mint/30 text-mint text-[11px] font-medium hover:bg-mint-glow transition text-left flex items-center justify-between"
            >
              <span>Configura tu tarifa por hora</span>
              <span className="text-[10px] opacity-70">Ajustes →</span>
            </button>
          )}

          {showComparison && (
            <ComparisonResult
              charged={chargedNum}
              elapsedMs={elapsedMs}
              hourlyRate={hourlyRate}
              currency={currency}
            />
          )}

          {canSave && (
            <button
              onClick={handleSave}
              className="no-drag flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-mint hover:bg-mint-soft text-ink text-[11px] font-semibold transition animate-fadeIn"
            >
              <Save size={11} />
              Guardar trabajo
            </button>
          )}

          <ProductivityBars />
        </div>

        {panel === 'history' && (
          <div className="border-t border-chalk-08">
            <HistoryPanel />
          </div>
        )}
        {panel === 'stats' && (
          <div className="border-t border-chalk-08">
            <StatsPanel />
          </div>
        )}
        {panel === 'settings' && (
          <div className="border-t border-chalk-08">
            <SettingsPanel />
          </div>
        )}
      </div>

      <UpdateBanner />

      {showSessionModal && (
        <SessionModal
          onClose={() => {
            setShowSessionModal(false)
            setModalDismissedThisRun(true)
          }}
        />
      )}
      <SessionSummary />
    </div>
  )
}

function TitleBar({
  onClose,
  onMinimize,
  onOpenSession,
  onToggleHistory,
  onToggleStats,
  onToggleSettings,
  panel,
  jobsCount,
  running,
  sessionActive
}: {
  onClose: () => void
  onMinimize: () => void
  onOpenSession: () => void
  onToggleHistory: () => void
  onToggleStats: () => void
  onToggleSettings: () => void
  panel: Panel
  jobsCount: number
  running: boolean
  sessionActive: boolean
}): JSX.Element {
  return (
    <div className="drag-region flex items-center justify-between px-3 py-2 border-b border-chalk-05">
      <div className="flex items-center gap-2 text-[11px] font-semibold tracking-tightish">
        <span
          className={`w-1.5 h-1.5 rounded-full transition-colors ${running ? 'bg-mint' : 'bg-chalk-30'}`}
          style={
            running
              ? { boxShadow: '0 0 8px rgb(var(--accent-rgb) / 1)' }
              : undefined
          }
        />
        <span className="text-chalk-70">DesignTimer</span>
      </div>
      <div className="flex items-center gap-0.5 no-drag">
        <IconButton
          onClick={onOpenSession}
          active={sessionActive}
          title={sessionActive ? 'Sesión activa' : 'Nueva sesión'}
        >
          <Hourglass
            size={11}
            className={sessionActive ? 'text-mint' : undefined}
          />
        </IconButton>
        <IconButton
          onClick={onToggleHistory}
          active={panel === 'history'}
          title="Historial"
        >
          <History size={11} />
          {jobsCount > 0 && (
            <span className="ml-1 text-[9px] font-mono tabular-nums text-mint">
              {jobsCount}
            </span>
          )}
        </IconButton>
        <IconButton
          onClick={onToggleStats}
          active={panel === 'stats'}
          title="Estadísticas"
        >
          <BarChart3 size={11} />
        </IconButton>
        <IconButton
          onClick={onToggleSettings}
          active={panel === 'settings'}
          title="Ajustes"
        >
          <Settings size={11} />
        </IconButton>
        <div className="w-px h-3 bg-chalk-08 mx-1" />
        <IconButton onClick={onMinimize} title="Minimizar">
          <Minus size={11} />
        </IconButton>
        <IconButton onClick={onClose} title="Cerrar" danger>
          <X size={11} />
        </IconButton>
      </div>
    </div>
  )
}

function IconButton({
  children,
  onClick,
  active,
  title,
  danger
}: {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
  title: string
  danger?: boolean
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md text-chalk-50 hover:text-chalk transition-colors ${
        active ? 'bg-chalk-08 text-chalk' : ''
      } ${danger ? 'hover:bg-[#F87171]/15 hover:text-[#F87171]' : 'hover:bg-chalk-05'}`}
    >
      {children}
    </button>
  )
}
