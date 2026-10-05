export type FuelStation = {
  id: string
  name: string
  brand: string
  /** Town the station sits in, shown under the price. */
  town: string
  distanceKmFromStart: number
  pricePerLiter: number
  lat: number
  lng: number
}

/** Sample stations along the Abidjan–Yamoussoukro autoroute (prices in FCFA per litre of super). */
export const MOCK_STATIONS: FuelStation[] = [
  { id: '1', name: 'Total Energies', brand: 'Total', town: "N'Douci", distanceKmFromStart: 95, pricePerLiter: 875, lat: 5.872, lng: -4.765 },
  { id: '2', name: 'Oryx', brand: 'Oryx', town: 'Singrobo', distanceKmFromStart: 150, pricePerLiter: 880, lat: 6.12, lng: -4.93 },
  { id: '3', name: 'Petro Ivoire', brand: 'Petro Ivoire', town: 'Toumodi', distanceKmFromStart: 190, pricePerLiter: 860, lat: 6.557, lng: -5.019 },
  { id: '4', name: 'Vivo Energy', brand: 'Shell', town: 'Yamoussoukro', distanceKmFromStart: 232, pricePerLiter: 870, lat: 6.81, lng: -5.27 },
]
