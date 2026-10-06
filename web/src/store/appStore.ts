import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type StoredUserLocation = { lat: number; lng: number; label: string }

type AppState = {
  selectedVehicleId: string | null
  fuelPricePerLiter: number
  displayName: string
  country: string
  currency: string
  distanceUnit: 'km' | 'mi'
  consumptionUnit: 'l100km' | 'mpg'
  notificationsEnabled: boolean
  offlineMapsEnabled: boolean
  theme: 'system' | 'light' | 'dark'
  /** Fuel stays level and sloshes as the phone moves. */
  liquidMotion: boolean
  language: string
  userLocation: StoredUserLocation | null
  setSelectedVehicleId: (id: string | null) => void
  setFuelPricePerLiter: (price: number) => void
  setDisplayName: (name: string) => void
  setCountry: (c: string) => void
  setNotificationsEnabled: (v: boolean) => void
  setOfflineMapsEnabled: (v: boolean) => void
  setTheme: (t: 'system' | 'light' | 'dark') => void
  setLiquidMotion: (on: boolean) => void
  setUserLocation: (loc: StoredUserLocation | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedVehicleId: null,
      fuelPricePerLiter: 875,
      displayName: 'Mohammed',
      country: "Côte d'Ivoire",
      currency: 'FCFA (XOF)',
      distanceUnit: 'km',
      consumptionUnit: 'l100km',
      notificationsEnabled: true,
      offlineMapsEnabled: false,
      theme: 'system',
      liquidMotion: true,
      language: 'English',
      userLocation: null,
      setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),
      setFuelPricePerLiter: (price) => set({ fuelPricePerLiter: price }),
      setDisplayName: (name) => set({ displayName: name }),
      setCountry: (c) => set({ country: c }),
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
      setOfflineMapsEnabled: (v) => set({ offlineMapsEnabled: v }),
      setTheme: (t) => set({ theme: t }),
      setLiquidMotion: (on) => set({ liquidMotion: on }),
      setUserLocation: (loc) => set({ userLocation: loc }),
    }),
    {
      name: 'fuelgo-app',
      version: 1,
      // v0 could switch the motion setting off when iOS refused a prompt it shouldn't
      // have shown yet; start everyone from on again.
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<AppState>
        return (version < 1 ? { ...state, liquidMotion: true } : state) as AppState
      },
    },
  ),
)
