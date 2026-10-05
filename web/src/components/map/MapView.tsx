import { lazy, Suspense, useCallback, useState } from 'react'
import type { MapViewProps } from './types'
import { MapSkeleton } from '../Skeleton'
import { MAPBOX_TOKEN } from '../../config/mapbox'
import { useMapPinDrop } from '../../hooks/useMapPinDrop'
import { useUserLocation } from '../../hooks/useUserLocation'
import { mapPinHint } from '../../lib/mapPin'
import { useTripStore } from '../../store/tripStore'
import { MapPinToggle } from './MapPinToggle'
import { MapRecenterButton } from './MapRecenterButton'

const MapboxMapView = lazy(() => import('./MapboxMapView'))
const LeafletMapView = lazy(() => import('./LeafletMapView'))

/** Mapbox when VITE_MAPBOX_TOKEN is set, otherwise Leaflet on free CARTO tiles. Same props either way. */
export function MapView({
  loading,
  className = '',
  showRecenter = true,
  allowMapPin = false,
  syncTripPin = false,
  interactive = true,
  onMapClick: onMapClickProp,
  mode = 'default',
  ...engineProps
}: MapViewProps) {
  const [recenterTick, setRecenterTick] = useState(0)
  const [localPinMode, setLocalPinMode] = useState(false)
  const tripPinMode = useTripStore((s) => s.mapPinMode)
  const tripPinTarget = useTripStore((s) => s.mapPinTarget)
  const setTripPinMode = useTripStore((s) => s.setMapPinMode)
  const beginMapPin = useTripStore((s) => s.beginMapPin)
  const draft = useTripStore((s) => s.draft)

  const { refresh, loading: locating } = useUserLocation()
  const dropPin = useMapPinDrop()

  const pinMode = syncTripPin ? tripPinMode : localPinMode || tripPinMode
  const pinAllowed = allowMapPin && interactive && mode !== 'navigation'
  const mapClickActive = pinMode && pinAllowed

  const togglePin = useCallback(() => {
    if (syncTripPin) {
      if (tripPinMode) setTripPinMode(false)
      else beginMapPin(tripPinTarget)
    } else if (localPinMode) {
      setLocalPinMode(false)
      setTripPinMode(false)
    } else {
      beginMapPin({ kind: 'destination' })
      setLocalPinMode(true)
    }
  }, [syncTripPin, tripPinMode, localPinMode, setTripPinMode, beginMapPin, tripPinTarget])

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (mapClickActive) void dropPin(lat, lng)
      onMapClickProp?.(lat, lng)
    },
    [dropPin, mapClickActive, onMapClickProp],
  )

  const pinHint = syncTripPin ? mapPinHint(tripPinTarget, draft) : 'Tap the map to set destination'

  if (loading) return <MapSkeleton className={className} />

  const Engine = MAPBOX_TOKEN ? MapboxMapView : LeafletMapView

  const recenter = () => {
    void refresh({ fillOrigin: false }).then(() => setRecenterTick((t) => t + 1))
  }

  return (
    <div className={`relative min-h-[inherit] ${mapClickActive ? 'map-pin-mode' : ''} ${className}`}>
      <Suspense fallback={<MapSkeleton className="h-full min-h-[inherit] w-full" />}>
        <Engine
          {...engineProps}
          mode={mode}
          interactive={interactive}
          className="h-full w-full min-h-[inherit]"
          recenterTick={recenterTick}
          mapClickActive={mapClickActive}
          onMapClick={mapClickActive ? handleMapClick : onMapClickProp}
        />
      </Suspense>
      {pinAllowed && (
        <MapPinToggle
          active={pinMode}
          onToggle={togglePin}
          hint={pinHint}
          className="bottom-3 right-[3.75rem] sm:bottom-4 sm:right-[4.5rem]"
        />
      )}
      {showRecenter && interactive && (
        <MapRecenterButton onClick={recenter} loading={locating} className="bottom-3 right-3 sm:bottom-4 sm:right-4" />
      )}
      {mapClickActive && (
        <p className="pointer-events-none absolute left-3 top-3 z-[1000] rounded-sm border border-fg/15 bg-panel/90 px-2.5 py-1.5 text-xs font-semibold text-fg backdrop-blur-sm">
          {pinHint}
        </p>
      )}
    </div>
  )
}
