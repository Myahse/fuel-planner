import type { ReactNode } from 'react'
import { LiquidTank, type FuelStatus } from './LiquidTank'

type Props = {
  level: number
  status?: FuelStatus
  reserve?: number
  bars?: number
  onLevelChange?: (level: number) => void
  children?: ReactNode
  className?: string
}

/** The tank as a window under the gauge: liquid seen from the side, with its reading on top. */
export function TankCard({ level, status, reserve, bars, onLevelChange, children, className = 'h-24' }: Props) {
  return (
    <div className={`relative overflow-hidden rounded-[22px] border border-fg/10 bg-panel ${className}`}>
      <LiquidTank level={level} status={status} reserve={reserve} bars={bars} onLevelChange={onLevelChange} className="absolute inset-0" />
      {children && <div className="pointer-events-none relative flex h-full items-end justify-between gap-3 px-4 pb-3">{children}</div>}
    </div>
  )
}
