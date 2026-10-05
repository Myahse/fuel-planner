/** Towns around Côte d'Ivoire with their road distance from Abidjan (km, main roads). */
export type City = { name: string; roadKmFromAbidjan: number; lat: number; lng: number }

export const CITIES: City[] = [
  { name: 'Grand-Bassam', roadKmFromAbidjan: 42, lat: 5.211, lng: -3.739 },
  { name: 'Dabou', roadKmFromAbidjan: 50, lat: 5.32, lng: -4.377 },
  { name: 'Agboville', roadKmFromAbidjan: 80, lat: 5.928, lng: -4.213 },
  { name: 'Adzopé', roadKmFromAbidjan: 105, lat: 6.107, lng: -3.86 },
  { name: 'Divo', roadKmFromAbidjan: 195, lat: 5.837, lng: -5.357 },
  { name: 'Abengourou', roadKmFromAbidjan: 210, lat: 6.73, lng: -3.496 },
  { name: 'Yamoussoukro', roadKmFromAbidjan: 237, lat: 6.827, lng: -5.289 },
  { name: 'Gagnoa', roadKmFromAbidjan: 275, lat: 6.131, lng: -5.951 },
  { name: 'Sassandra', roadKmFromAbidjan: 280, lat: 4.953, lng: -6.085 },
  { name: 'San-Pédro', roadKmFromAbidjan: 342, lat: 4.748, lng: -6.636 },
  { name: 'Bouaké', roadKmFromAbidjan: 348, lat: 7.69, lng: -5.03 },
  { name: 'Daloa', roadKmFromAbidjan: 383, lat: 6.877, lng: -6.45 },
  { name: 'Katiola', roadKmFromAbidjan: 400, lat: 8.137, lng: -5.101 },
  { name: 'Bondoukou', roadKmFromAbidjan: 420, lat: 8.04, lng: -2.8 },
  { name: 'Man', roadKmFromAbidjan: 580, lat: 7.412, lng: -7.554 },
  { name: 'Ferkessédougou', roadKmFromAbidjan: 590, lat: 9.593, lng: -5.194 },
  { name: 'Korhogo', roadKmFromAbidjan: 635, lat: 9.458, lng: -5.629 },
  { name: 'Odienné', roadKmFromAbidjan: 830, lat: 9.51, lng: -7.564 },
]

/** Roads wind: straight-line reach is roughly road range divided by this. */
export const ROAD_FACTOR = 1.25
