export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="card-surface space-y-3 p-5">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-3 w-full" />
    </div>
  )
}

export function MapSkeleton() {
  return <Skeleton className="h-full min-h-[220px] w-full rounded-none lg:rounded-3xl" />
}
