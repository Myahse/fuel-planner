import { lazy, Suspense, useMemo } from 'react'
import type { Vehicle } from '../../api/types'
import { getVehicleModelConfig, type VehicleBodyType } from '../../config/vehicleModels'

const CarSceneCanvas = lazy(() => import('./CarSceneCanvas'))

export type CarViewerVariant = 'hero' | 'card' | 'thumb'

const HEIGHT: Record<CarViewerVariant, string> = {
  hero: 'min-h-[260px] h-[min(42vh,320px)]',
  card: 'h-[220px]',
  thumb: 'h-[72px] w-[96px]',
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
    () =>
      getVehicleModelConfig(vehicle, {
        bodyType,
        paint: paintOverride,
        modelUrl: modelUrlOverride,
      }),
    [vehicle, bodyType, paintOverride, modelUrlOverride],
  )

  const isThumb = variant === 'thumb'

  return (
    <div
      className={`relative overflow-hidden ${isThumb ? 'rounded-xl' : 'rounded-t-3xl'} bg-gradient-to-b from-slate-100 via-white to-brand-50/40 ${HEIGHT[variant]} ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(34,197,94,0.12),transparent_55%)]" />
      {!isThumb && (
        <div className="absolute left-4 top-4 z-10 rounded-full border border-white/70 bg-white/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-800 shadow-sm backdrop-blur">
          3D preview
        </div>
      )}
      <div
        className={`absolute inset-0 ${interactive ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{ minHeight: isThumb ? 72 : 180 }}
      >
        <Suspense fallback={<CarViewerFallback variant={variant} />}>
          <CarSceneCanvas
            key={`${config.useGltf ? config.glbUrl : 'procedural'}-${config.paint}-${config.bodyType}`}
            config={config}
            autoRotate={autoRotate && !interactive}
            interactive={interactive}
          />
        </Suspense>
      </div>
    </div>
  )
}

function CarViewerFallback({ variant }: { variant: CarViewerVariant }) {
  return (
    <div className="flex h-full min-h-[inherit] items-center justify-center bg-slate-50">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
      {variant !== 'thumb' && <span className="sr-only">Loading 3D vehicle</span>}
    </div>
  )
}
