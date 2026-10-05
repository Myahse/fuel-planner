import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { setLiquidMotionEnabled } from '../lib/liquidMotion'

/** Applies the "liquid follows movement" setting to every tank. */
export function LiquidMotionSync() {
  const on = useAppStore((s) => s.liquidMotion)
  useEffect(() => setLiquidMotionEnabled(on), [on])
  return null
}
