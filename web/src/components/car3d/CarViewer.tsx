import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { Vehicle } from '../../api/types'
import { getVehicleModelConfig, type VehicleBodyType } from '../../config/vehicleModels'

const CarSceneCanvas = lazy(() => import('./CarSceneCanvas'))

export type CarViewerVariant = 'hero' | 'banner' | 'card'

const HEIGHT: Record<CarViewerVariant, string> = {
  hero: 'h-[min(46vh,360px)] min-h-[240px]',
  banner: 'h-[200px] sm:h-[240px]',
  card: 'h-[240px]',
}

type VehicleLike = Pick<Vehicle, 'make' | 'model' | 'paint_color' | 'model_3d_url' | 'body_style'>

type Props = {
  vehicle: VehicleLike
  variant?: CarViewerVariant
  autoRotate?: boolean
  interactive?: boolean
  bodyType?: VehicleBodyType
  paintOverride?: string
  modelUrlOverride?: string
  className?: string
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

/** Renders only while on screen, so a scrolled-away car stops costing battery. */
function useOnScreen<T extends Element>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '64px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, visible] as const
}

export function CarViewer({
  vehicle,
  variant = 'card',
  autoRotate = true,
  interactive = false,
  bodyType,
  paintOverride,
  modelUrlOverride,
  className = '',
}: Props) {
  const config = useMemo(
    () => getVehicleModelConfig(vehicle, { bodyType, paint: paintOverride, modelUrl: modelUrlOverride }),
    [vehicle, bodyType, paintOverride, modelUrlOverride],
  )
  const reducedMotion = usePrefersReducedMotion()
  const [ref, visible] = useOnScreen<HTMLDivElement>()

  return (
    <div ref={ref} className={`relative overflow-hidden ${HEIGHT[variant]} ${className}`}>
      {/* Floor: a striped pump island under the car */}
      <div className="grid-bg pointer-events-none absolute inset-x-0 bottom-0 h-[42%] border-t-[2.5px] border-dashed border-espresso/25" />
      <div className={`absolute inset-0 ${interactive ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}>
        <Suspense fallback={<CarViewerFallback />}>
          <CarSceneCanvas
            key={`${config.glbUrl ?? 'procedural'}-${config.bodyType}`}
            config={config}
            autoRotate={autoRotate && !interactive && !reducedMotion}
            interactive={interactive}
            active={visible}
            framing={variant === 'banner' ? 'tight' : 'wide'}
          />
        </Suspense>
      </div>
    </div>
  )
}

function CarViewerFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <span className="unit animate-pulse">loading model…</span>
    </div>
  )
}
