export type Vehicle = {
  id: string
  make: string
  model: string
  year: number
  engine: string
  fuel_type: string
  tank_capacity_liters: number
  city_consumption?: number
  highway_consumption?: number
  mixed_consumption: number
  fuel_gauge_bars: number
  is_default: boolean
  paint_color?: string | null
  model_3d_url?: string | null
  body_style?: 'sedan' | 'hatchback' | 'suv' | 'pickup' | 'minivan' | null
  fuel_percentage?: number
  estimated_fuel_liters?: number
}

export type FuelCurrent = {
  vehicle_id: string
  fuel_percentage: number
  tank_capacity_liters: number
  estimated_fuel_liters: number
  estimated_range_km: number
  consumption_l_per_100km: number
  disclaimer: string
}

export type TripAssessment = {
  status: 'enough' | 'low' | 'insufficient'
  fuel_required: number
  starting_fuel: number
  remaining_fuel: number
  remaining_range_km: number
  shortage_liters?: number
  recommended_refuel?: number
}

export type TripCalculateResult = {
  origin: string
  destination: string
  trip_type: string
  distance_km: number
  estimated_duration_seconds: number
  fuel_required_liters: number
  estimated_fuel_cost: number
  starting_fuel_liters_est: number
  assessment: TripAssessment
  map_provider: string
  /** [lat, lng] of the geocoded endpoints */
  origin_coords?: [number, number]
  destination_coords?: [number, number]
  /** Road geometry, Google polyline precision 6 — present when the backend routes with Mapbox */
  route_polyline?: string
  disclaimer: string
}

export type FuelTransaction = {
  id: string
  vehicle_id: string
  liters: number
  price_per_liter: number
  total_amount: number
  fuel_type: string
  notes: string
  created_at: string
}

export type Trip = {
  id: string
  vehicle_id: string
  origin: string
  destination: string
  distance_km: number
  estimated_duration_seconds: number
  fuel_required_liters: number
  fuel_cost: number
  starting_fuel_liters_est: number
  ending_fuel_liters_est?: number
  trip_type: string
  status: string
  consumption_profile: string
  created_at: string
}
