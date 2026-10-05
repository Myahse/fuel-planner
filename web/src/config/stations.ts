/** Max road detour (km) when searching fuel POIs along a trip polyline. */
export const STATIONS_MAX_DETOUR_KM = Number(import.meta.env.VITE_STATIONS_MAX_DETOUR_KM) || 12

/** Default nearby search radius (km) when the app does not pass one. */
export const STATIONS_NEARBY_RADIUS_KM = Number(import.meta.env.VITE_STATIONS_NEARBY_RADIUS_KM) || 30
