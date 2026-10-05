import { lazy, Suspense } from 'react'
import type { MapViewProps } from './types'
import { MapSkeleton } from '../Skeleton'
import { MAPBOX_TOKEN } from '../../config/mapbox'

// Each engine is its own chunk, so pages without a map never download one.
const MapboxMapView = lazy(() => import('./MapboxMapView'))
const LeafletMapView = lazy(() => import('./LeafletMapView'))

/** Mapbox when VITE_MAPBOX_TOKEN is set, otherwise Leaflet on free CARTO tiles. Same props either way. */
export function MapView(props: MapViewProps) {
  if (props.loading) return <MapSkeleton />
  const Engine = MAPBOX_TOKEN ? MapboxMapView : LeafletMapView
  return (
    <Suspense fallback={<MapSkeleton />}>
      <Engine {...props} />
    </Suspense>
  )
}
