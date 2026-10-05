import { useId, useState, type InputHTMLAttributes, type KeyboardEvent } from 'react'
import { usePlaceSuggestions, type PlaceSuggestion } from '../hooks/usePlaceSuggestions'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onSelect'> & {
  value: string
  onChange: (v: string) => void
  /** Called when a suggestion is picked (click or Enter). */
  onPick?: (place: PlaceSuggestion) => void
}

/** Text input with Mapbox place suggestions, as an ARIA combobox. Plain input when no token is set. */
export function PlaceField({ value, onChange, onPick, className = '', ...rest }: Props) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const { suggestions } = usePlaceSuggestions(value, open)
  const show = open && suggestions.length > 0

  const pick = (s: PlaceSuggestion) => {
    onChange(s.context ? `${s.name}, ${s.context}` : s.name)
    onPick?.(s)
    setOpen(false)
    setActive(-1)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!show) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault()
      pick(suggestions[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <span className="relative block">
      <input
        {...rest}
        className={className}
        value={value}
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={show && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setActive(-1)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
      />
      {show && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-3 overflow-hidden rounded-[18px] border border-fg/15 bg-panel-2/95 shadow-[0_18px_40px_rgb(0_0_0/0.6)] backdrop-blur-xl"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault()
                pick(s)
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer border-b border-fg/10 px-4 py-2.5 last:border-0 ${i === active ? 'bg-panel-3' : ''}`}
            >
              <span className="block text-sm font-semibold text-fg">{s.name}</span>
              {s.context && <span className="unit block truncate">{s.context}</span>}
            </li>
          ))}
        </ul>
      )}
    </span>
  )
}
