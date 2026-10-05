export type FuelStation = {
  id: string
  name: string
  brand: string
  distanceKmFromStart: number
  pricePerLiter: number
  lat: number
  lng: number
}

export const MOCK_STATIONS: FuelStation[] = [
  {
    id: '1',
    name: 'Total Energies — Tiébissou',
    brand: 'Total',
    distanceKmFromStart: 147,
    pricePerLiter: 875,
    lat: 6.22,
    lng: -5.22,
  },
  {
    id: '2',
    name: 'Petro Ivoire — Didievi',
    brand: 'Petro Ivoire',
    distanceKmFromStart: 236,
    pricePerLiter: 860,
    lat: 6.45,
    lng: -5.35,
  },
  {
    id: '3',
    name: 'Total Energies — Agboville',
    brand: 'Total',
    distanceKmFromStart: 312,
    pricePerLiter: 870,
    lat: 5.93,
    lng: -4.22,
  },
]
