import { useId } from 'react'
import type { Look, Sim } from '../lib/types'

export const SKIN_TONES = ['#f1c27d', '#c68642', '#a0612c', '#8d5524', '#6b3e1f', '#4a2a14']
export const HAIR_COLORS = ['#1b1b1b', '#3b2416', '#7a4a1d', '#c9a24b', '#9b2d2d']
export const OUTFIT_COLORS = ['#f77f00', '#009e60', '#1f6feb', '#c2185b', '#7b2cbf', '#f2b705', '#ffffff']
export const HAIRS = [
  { id: 'braids', label: 'Tresses' },
  { id: 'afro', label: 'Afro' },
  { id: 'short', label: 'Ras' },
  { id: 'headwrap', label: 'Foulard' },
  { id: 'locks', label: 'Dreads' },
  { id: 'bald', label: 'Crâne rasé' },
]
export const OUTFITS = [
  { id: 'pagne', label: 'Pagne wax' },
  { id: 'boubou', label: 'Boubou' },
  { id: 'casual', label: 'Jean & tee' },
  { id: 'suit', label: 'Costume' },
  { id: 'jersey', label: 'Maillot Éléphants' },
]

type Props = { look: Look; gender: Sim['gender']; size?: number }

// A cute, flat character built from SVG shapes so every combination of
// skin, hair and outfit works without art assets.
export function SimAvatar({ look, gender, size = 160 }: Props) {
  const uid = useId().replace(/:/g, '')
  const wax = `wax-${uid}`
  const cloth = look.outfit === 'pagne' ? `url(#${wax})` : look.outfit === 'jersey' ? '#f77f00' : look.outfitColor
  const dress = gender === 'femme' && (look.outfit === 'pagne' || look.outfit === 'boubou')
  const trousers = look.outfit === 'suit' ? '#22303c' : look.outfit === 'jersey' ? '#fff' : '#2b4c7e'

  return (
    <svg width={size} height={size * 1.5} viewBox="0 0 120 180" aria-label="Avatar du Sim">
      <defs>
        <pattern id={wax} width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill={look.outfitColor} />
          <circle cx="8" cy="8" r="5" fill="none" stroke="#fff8ec" strokeWidth="2" />
          <circle cx="8" cy="8" r="2" fill="#1d2a26" />
          <circle cx="0" cy="0" r="2.5" fill="#fff8ec" />
          <circle cx="16" cy="16" r="2.5" fill="#fff8ec" />
        </pattern>
      </defs>

      <ellipse cx="60" cy="172" rx="34" ry="6" fill="#000" opacity="0.18" />

      {/* legs / shoes */}
      {dress ? (
        <>
          <rect x="47" y="150" width="9" height="16" rx="4" fill={look.skin} />
          <rect x="64" y="150" width="9" height="16" rx="4" fill={look.skin} />
        </>
      ) : (
        <>
          <rect x="45" y="118" width="13" height="46" rx="5" fill={trousers} />
          <rect x="62" y="118" width="13" height="46" rx="5" fill={trousers} />
        </>
      )}
      <rect x="42" y="162" width="17" height="7" rx="3.5" fill="#1d2a26" />
      <rect x="61" y="162" width="17" height="7" rx="3.5" fill="#1d2a26" />

      {/* arms */}
      <rect x="24" y="76" width="13" height="48" rx="6.5" fill={look.outfit === 'boubou' ? cloth : look.skin} />
      <rect x="83" y="76" width="13" height="48" rx="6.5" fill={look.outfit === 'boubou' ? cloth : look.skin} />
      <circle cx="30.5" cy="125" r="6" fill={look.skin} />
      <circle cx="89.5" cy="125" r="6" fill={look.skin} />

      {/* torso */}
      {dress ? (
        <path d="M36 74 Q60 66 84 74 L94 154 Q60 160 26 154 Z" fill={cloth} stroke="#0002" strokeWidth="1.5" />
      ) : look.outfit === 'boubou' ? (
        <path d="M30 74 Q60 64 90 74 L96 134 Q60 140 24 134 Z" fill={cloth} stroke="#0002" strokeWidth="1.5" />
      ) : (
        <rect x="34" y="72" width="52" height="54" rx="14" fill={cloth} stroke="#0002" strokeWidth="1.5" />
      )}
      {look.outfit === 'suit' && (
        <>
          <path d="M60 74 L52 74 L60 100 L68 74 Z" fill="#fff" />
          <path d="M60 80 L57 100 L60 106 L63 100 Z" fill="#c2185b" />
        </>
      )}
      {look.outfit === 'jersey' && (
        <>
          <rect x="34" y="96" width="52" height="6" fill="#009e60" />
          <text x="60" y="92" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff" fontFamily="Fredoka">
            10
          </text>
        </>
      )}

      {/* neck & head */}
      <rect x="53" y="60" width="14" height="14" rx="5" fill={look.skin} />
      <circle cx="60" cy="42" r="24" fill={look.skin} />
      <Hair style={look.hair} color={look.hairColor} accent={look.outfitColor} />

      {/* face */}
      <ellipse cx="51" cy="44" rx="3" ry="3.6" fill="#1d1d1d" />
      <ellipse cx="69" cy="44" rx="3" ry="3.6" fill="#1d1d1d" />
      <circle cx="52" cy="43" r="1" fill="#fff" />
      <circle cx="70" cy="43" r="1" fill="#fff" />
      <path d="M52 53 Q60 60 68 53" fill="none" stroke="#1d1d1d" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="45" cy="52" r="3.5" fill="#e5383b" opacity="0.18" />
      <circle cx="75" cy="52" r="3.5" fill="#e5383b" opacity="0.18" />
      {gender === 'femme' && (
        <>
          <circle cx="36.5" cy="50" r="2.5" fill="#f2b705" />
          <circle cx="83.5" cy="50" r="2.5" fill="#f2b705" />
        </>
      )}
    </svg>
  )
}

function Hair({ style, color, accent }: { style: string; color: string; accent: string }) {
  switch (style) {
    case 'afro':
      return <path d="M30 44 C22 10 98 10 90 44 C92 30 80 20 60 22 C40 20 28 30 30 44Z" fill={color} transform="translate(0 -4) scale(1 1.05)" />
    case 'braids':
      return (
        <g fill={color}>
          <path d="M36 36 Q60 8 84 36 Q76 24 60 24 Q44 24 36 36Z" />
          {[38, 44, 76, 82].map((x) => (
            <rect key={x} x={x - 2.5} y="34" width="5" height="40" rx="2.5" />
          ))}
        </g>
      )
    case 'headwrap':
      return (
        <g>
          <path d="M33 38 Q30 6 60 8 Q92 6 87 38 Q76 26 60 26 Q44 26 33 38Z" fill={accent} />
          <circle cx="78" cy="14" r="8" fill={accent} stroke="#0002" />
          <path d="M40 22 Q60 14 80 22" stroke="#fff8" strokeWidth="2" fill="none" />
        </g>
      )
    case 'locks':
      return (
        <g fill={color}>
          <path d="M35 38 Q60 6 85 38 Q75 22 60 22 Q45 22 35 38Z" />
          {[34, 40, 80, 86].map((x, i) => (
            <rect key={x} x={x - 3} y="30" width="6" height={i % 2 ? 30 : 36} rx="3" />
          ))}
        </g>
      )
    case 'short':
      return <path d="M36 36 Q60 10 84 36 Q76 24 60 24 Q44 24 36 36Z" fill={color} />
    default:
      return <path d="M42 26 Q60 18 70 22" stroke="#fff" strokeOpacity="0.25" strokeWidth="3" fill="none" strokeLinecap="round" />
  }
}
