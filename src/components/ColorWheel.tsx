import { useEffect, useRef, useState } from 'react'
import { hexToRgb, rgbToHex } from '@/lib/color'

type HSV = { h: number; s: number; v: number }

const SIZE = 180
const RING_WIDTH = 22
const SQ_SIZE = 92

type Props = {
  value: string
  onChange: (hex: string) => void
}

export default function ColorWheel({ value, onChange }: Props): JSX.Element {
  const hsv = hexToHsv(value)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<'ring' | 'square' | null>(null)

  useEffect(() => {
    if (!dragging) return
    function handleMove(e: PointerEvent): void {
      if (dragging === 'ring') updateHueFromClient(e.clientX, e.clientY)
      else if (dragging === 'square') updateSVFromClient(e.clientX, e.clientY)
    }
    function handleUp(): void {
      setDragging(null)
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, value])

  function updateHueFromClient(clientX: number, clientY: number): void {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = clientX - cx
    const dy = clientY - cy
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90
    if (angle < 0) angle += 360
    const currentHsv = hexToHsv(value)
    // Si el color actual es gris puro (s=0 o v=0), asumimos s=100, v=100
    // para que la primera vez que agarras el hue el color se vea.
    const s = currentHsv.s < 5 ? 100 : currentHsv.s
    const v = currentHsv.v < 5 ? 100 : currentHsv.v
    onChange(hsvToHex({ h: angle, s, v }))
  }

  function updateSVFromClient(clientX: number, clientY: number): void {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const sqLeft = rect.left + (rect.width - SQ_SIZE) / 2
    const sqTop = rect.top + (rect.height - SQ_SIZE) / 2
    const x = Math.max(0, Math.min(SQ_SIZE, clientX - sqLeft))
    const y = Math.max(0, Math.min(SQ_SIZE, clientY - sqTop))
    const s = (x / SQ_SIZE) * 100
    const v = 100 - (y / SQ_SIZE) * 100
    onChange(hsvToHex({ ...hexToHsv(value), s, v }))
  }

  // Marker positions
  const ringCenterRadius = (SIZE - RING_WIDTH) / 2
  const hueRad = ((hsv.h - 90) * Math.PI) / 180
  const hueMarkerX = SIZE / 2 + ringCenterRadius * Math.cos(hueRad)
  const hueMarkerY = SIZE / 2 + ringCenterRadius * Math.sin(hueRad)

  const sqLeft = (SIZE - SQ_SIZE) / 2
  const sqTop = (SIZE - SQ_SIZE) / 2
  const svMarkerX = sqLeft + (hsv.s / 100) * SQ_SIZE
  const svMarkerY = sqTop + (1 - hsv.v / 100) * SQ_SIZE

  const pureHue = hsvToHex({ h: hsv.h, s: 100, v: 100 })

  const ringMaskOuter = SIZE / 2
  const ringMaskInner = SIZE / 2 - RING_WIDTH
  const maskCss = `radial-gradient(circle, transparent ${ringMaskInner - 0.5}px, #000 ${ringMaskInner}px, #000 ${ringMaskOuter - 0.5}px, transparent ${ringMaskOuter}px)`

  return (
    <div className="flex justify-center py-1">
      <div
        ref={containerRef}
        className="relative select-none no-drag"
        style={{ width: SIZE, height: SIZE, touchAction: 'none' }}
      >
        {/* Hue ring */}
        <div
          className="absolute inset-0 rounded-full cursor-crosshair"
          style={{
            background:
              'conic-gradient(from -90deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
            WebkitMaskImage: maskCss,
            maskImage: maskCss
          }}
          onPointerDown={(e) => {
            setDragging('ring')
            updateHueFromClient(e.clientX, e.clientY)
          }}
        />

        {/* Hue marker */}
        <div
          className="absolute pointer-events-none rounded-full border-2 border-white"
          style={{
            width: 14,
            height: 14,
            left: hueMarkerX,
            top: hueMarkerY,
            transform: 'translate(-50%, -50%)',
            backgroundColor: pureHue,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.4)'
          }}
        />

        {/* SV square */}
        <div
          className="absolute rounded-md cursor-crosshair overflow-hidden"
          style={{
            left: sqLeft,
            top: sqTop,
            width: SQ_SIZE,
            height: SQ_SIZE,
            background: `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, ${pureHue})`,
            boxShadow: '0 0 0 1px rgba(255,255,255,0.08)'
          }}
          onPointerDown={(e) => {
            setDragging('square')
            updateSVFromClient(e.clientX, e.clientY)
          }}
        />

        {/* SV marker */}
        <div
          className="absolute pointer-events-none rounded-full border-2 border-white"
          style={{
            width: 12,
            height: 12,
            left: svMarkerX,
            top: svMarkerY,
            transform: 'translate(-50%, -50%)',
            backgroundColor: value,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.4)'
          }}
        />
      </div>
    </div>
  )
}

function hexToHsv(hex: string): HSV {
  const [rRaw, gRaw, bRaw] = hexToRgb(hex)
  const r = rRaw / 255
  const g = gRaw / 255
  const b = bRaw / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const s = max === 0 ? 0 : (d / max) * 100
  const v = max * 100
  return { h, s, v }
}

function hsvToHex(hsv: HSV): string {
  const { h, s, v } = hsv
  const sn = s / 100
  const vn = v / 100
  const c = vn * sn
  const hp = h / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r = 0
  let g = 0
  let b = 0
  if (0 <= hp && hp < 1) {
    r = c
    g = x
  } else if (1 <= hp && hp < 2) {
    r = x
    g = c
  } else if (2 <= hp && hp < 3) {
    g = c
    b = x
  } else if (3 <= hp && hp < 4) {
    g = x
    b = c
  } else if (4 <= hp && hp < 5) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }
  const m = vn - c
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255)
}
