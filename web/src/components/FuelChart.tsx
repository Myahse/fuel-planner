type BarPoint = { label: string; value: number }

export function FuelBarChart({ data, title }: { data: BarPoint[]; title: string }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="rounded-3xl bg-white p-5 shadow-card">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div className="mt-6 flex items-end justify-between gap-1.5 h-36">
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full max-w-[28px] rounded-t-lg bg-brand-600 transition-all"
              style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 8 : 0 }}
              title={`${d.value} L`}
            />
            <span className="text-[9px] text-muted">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FuelLineChart({ data, title }: { data: BarPoint[]; title: string }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const w = 100
  const h = 40
  const points = data
    .map((d, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * w
      const y = h - (d.value / max) * h
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="rounded-3xl bg-white p-5 shadow-card">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 h-28 w-full text-brand-700">
        <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} />
      </svg>
    </div>
  )
}
