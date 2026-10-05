import { create } from 'zustand'
import type { TripCalculateResult } from '../api/types'

export type TripPlanDraft = {
  origin: string
  destination: string
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
  setDraft: (patch: Partial<TripPlanDraft>) => void
  setLastResult: (result: TripCalculateResult | null) => void
  setNavigationActive: (active: boolean) => void
}

const defaultDraft: TripPlanDraft = {
  origin: 'Abidjan',
  destination: 'Yamoussoukro',
  trip_type: 'round_trip',
  profile: 'mixed',
  includeReturn: true,
  preference: 'fastest',
}

export const useTripStore = create<TripState>((set) => ({
  draft: defaultDraft,
  lastResult: null,
  navigationActive: false,
  setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  setLastResult: (result) => set({ lastResult: result }),
  setNavigationActive: (active) => set({ navigationActive: active }),
}))
