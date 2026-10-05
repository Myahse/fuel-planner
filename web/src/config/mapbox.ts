/**
 * Mapbox public token (pk.…) for map tiles and place search in the browser.
 * Set VITE_MAPBOX_TOKEN in web/.env. Without it the app falls back to free CARTO tiles
 * and plain-text place inputs. Restrict the token to your domains in the Mapbox dashboard.
 */
export const MAPBOX_TOKEN: string = import.meta.env.VITE_MAPBOX_TOKEN ?? ''

/** ISO 3166 country bias for place search; matches the backend's MAP_COUNTRY. */
export const MAPBOX_COUNTRY: string = import.meta.env.VITE_MAPBOX_COUNTRY ?? 'ci'

export const MAP_STYLES = {
  default: 'mapbox://styles/mapbox/dark-v11',
  navigation: 'mapbox://styles/mapbox/navigation-night-v1',
} as const
