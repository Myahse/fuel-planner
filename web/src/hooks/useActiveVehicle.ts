import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listVehicles } from '../api/endpoints'
import { useAppStore } from '../store/appStore'

export function useActiveVehicle() {
  const { selectedVehicleId, setSelectedVehicleId, fuelPricePerLiter, displayName } = useAppStore()
  const vehiclesQuery = useQuery({ queryKey: ['vehicles'], queryFn: listVehicles })
  const vehicles = vehiclesQuery.data ?? []

  const vehicle =
    vehicles.find((v) => v.id === selectedVehicleId) ??
    vehicles.find((v) => v.is_default) ??
    vehicles[0]

  useEffect(() => {
    if (vehicle && selectedVehicleId !== vehicle.id) {
      setSelectedVehicleId(vehicle.id)
    }
  }, [vehicle, selectedVehicleId, setSelectedVehicleId])

  return {
    vehicles,
    vehicle,
    vehiclesQuery,
    fuelPricePerLiter,
    displayName,
    setSelectedVehicleId,
  }
}
