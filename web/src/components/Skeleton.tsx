export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-sm bg-panel-3 ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="panel space-y-3 p-5">
      <Skeleton className="h-3 w-1/4" />
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-1 w-full" />
    </div>
  )
}

export function MapSkeleton() {
  return <Skeleton className="h-full min-h-[220px] w-full rounded-none" />
}
