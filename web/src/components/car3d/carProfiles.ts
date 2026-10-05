import type { VehicleBodyType } from '../../config/vehicleModels'

/**
 * Side profiles on a 120×48 canvas (front of the car at the left, ground at y = 44).
 * Shared by the flat SVG silhouettes and the extruded fallback 3D car, so both always match.
 */
export type CarProfile = { body: string; glass: string; wheels: [number, number]; r: number }

export const GROUND_Y = 44

export const CAR_PROFILES: Record<VehicleBodyType, CarProfile> = {
  sedan: {
    body: 'M6 36 L6 29 Q7 25 16 24 L33 22 L45 13 Q49 10 56 10 L76 10 Q82 10 87 14 L97 22 L110 24 Q116 25 116 30 L116 36 Z',
    glass: 'M38 22 L48 14 Q51 12 56 12 L65 12 L65 22 Z M68 12 L76 12 Q80 12 84 15 L92 22 L68 22 Z',
    wheels: [28, 94],
    r: 7,
  },
  hatchback: {
    body: 'M10 36 L10 28 Q11 24 20 23 L35 21 L47 11 Q50 9 56 9 L92 9 Q98 9 100 14 L104 24 Q106 27 106 31 L106 36 Z',
    glass: 'M40 21 L50 12 Q52 11 56 11 L68 11 L68 21 Z M71 11 L92 11 Q96 11 97 14 L100 21 L71 21 Z',
    wheels: [30, 88],
    r: 7,
  },
  suv: {
    body: 'M6 37 L6 26 Q7 22 16 21 L29 20 L39 8 Q41 6 48 6 L104 6 Q110 6 111 10 L114 22 Q116 24 116 28 L116 37 Z',
    glass: 'M33 20 L42 9 Q43 8 48 8 L66 8 L66 20 Z M69 8 L90 8 L90 20 L69 20 Z M93 8 L104 8 Q108 8 109 11 L111 20 L93 20 Z',
    wheels: [28, 96],
    r: 8,
  },
  pickup: {
    body: 'M4 37 L4 26 Q5 22 14 21 L28 20 L37 8 Q39 6 45 6 L70 6 Q73 6 73 9 L73 21 L116 21 Q117 21 117 23 L117 37 Z',
    glass: 'M31 20 L40 9 Q41 8 45 8 L54 8 L54 20 Z M57 8 L70 8 Q71 8 71 10 L71 20 L57 20 Z',
    wheels: [24, 98],
    r: 8,
  },
  minivan: {
    body: 'M4 37 L4 27 Q5 23 13 22 L22 20 L36 7 Q38 5 45 5 L108 5 Q114 5 115 10 L117 24 Q118 27 118 30 L118 37 Z',
    glass: 'M27 20 L39 8 Q40 7 45 7 L60 7 L60 20 Z M63 7 L84 7 L84 20 L63 20 Z M87 7 L107 7 Q111 7 112 11 L114 20 L87 20 Z',
    wheels: [24, 98],
    r: 7.5,
  },
}
