import { useEffect, useSyncExternalStore } from 'react'
import { useAppStore } from '../store/appStore'
import { askForMotionOnFirstTap, liquidMotionStatus, onLiquidImpulse, onLiquidMotionStatus, setLiquidMotionEnabled } from '../lib/liquidMotion'

/** Applies the "fuel follows movement" setting, and on iOS asks for motion on the first tap. */
export function LiquidMotionSync() {
  const on = useAppStore((s) => s.liquidMotion)
  useEffect(() => setLiquidMotionEnabled(on), [on])
  useEffect(() => askForMotionOnFirstTap(), [])
  return null
}

/** Live sensor status for the Settings row; keeps the sensors listening while shown. */
export function useLiquidMotionStatus() {
  useEffect(() => onLiquidImpulse(() => {}), [])
  return useSyncExternalStore(onLiquidMotionStatus, liquidMotionStatus, liquidMotionStatus)
}
