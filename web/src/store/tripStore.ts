import { create } from 'zustand'
import type { TripCalculateResult } from '../api/types'
import {
  defaultMapPinTarget,
  mapPinTargetsEqual,
  type MapPinTarget,
} from '../lib/mapPin'

export type TripWaypoint = {
  id: string
  label: string
  lat?: number
  lng?: number
}

export type TripPlanDraft = {
  origin: string
  destination: string
  origin_lat?: number
  origin_lng?: number
  destination_lat?: number
  destination_lng?: number
  waypoints: TripWaypoint[]
  trip_type: 'one_way' | 'round_trip' | 'multi_stop'
  profile: string
  includeReturn: boolean
  preference: 'fastest' | 'efficient' | 'cheapest'
  vehicle_id?: string
}

type TripState = {
  draft: TripPlanDraft
  lastResult: TripCalculateResult | null
  navigationActive: boolean
  selectedFuelStationId: string | null
  mapPinMode: boolean
  mapPinTarget: MapPinTarget
  setDraft: (patch: Partial<TripPlanDraft>) => void
  setLastResult: (result: TripCalculateResult | null) => void
  setNavigationActive: (active: boolean) => void
  setSelectedFuelStationId: (id: string | null) => void
  beginMapPin: (target: MapPinTarget) => void
  setMapPinMode: (active: boolean) => void
}

const defaultDraft: TripPlanDraft = {
  origin: '',
  destination: '',
  waypoints: [],
  trip_type: 'one_way',
  profile: 'mixed',
  includeReturn: false,
  preference: 'fastest',
}

export function newTripWaypoint(): TripWaypoint {
  return { id: crypto.randomUUID(), label: '' }
}

export const useTripStore = create<TripState>((set) => ({
  draft: defaultDraft,
  lastResult: null,
  navigationActive: false,
  setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  setLastResult: (result) => set({ lastResult: result }),
  setNavigationActive: (active) => set({ navigationActive: active }),
  selectedFuelStationId: null,
  mapPinMode: false,
  mapPinTarget: defaultMapPinTarget,
  setSelectedFuelStationId: (id) => set({ selectedFuelStationId: id }),
  beginMapPin: (target) =>
    set((s) => {
      const same = s.mapPinMode && mapPinTargetsEqual(s.mapPinTarget, target)
      if (same) return { mapPinMode: false, mapPinTarget: defaultMapPinTarget }
      return { mapPinMode: true, mapPinTarget: target }
    }),
  setMapPinMode: (active) =>
    set((s) => ({
      mapPinMode: active,
      mapPinTarget: active ? s.mapPinTarget : defaultMapPinTarget,
    })),
}))
