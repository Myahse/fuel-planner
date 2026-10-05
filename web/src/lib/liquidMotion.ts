/**
 * Shared motion input for the liquid: how far the phone is rolled (so the fuel can stay
 * level with the ground) and short jolts from bumps or scrolling (so it sloshes).
 * One set of listeners serves every tank on the page.
 */

type Listener = (impulse: number) => void

const MAX_TILT = 0.6 // rad: past this the surface would leave a short card

let rollRad = 0
let started = false
const listeners = new Set<Listener>()

const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v))

/** Screen-relative roll: rotate with the screen so landscape still reads correctly. */
function onOrientation(e: DeviceOrientationEvent) {
  if (e.gamma == null || e.beta == null) return
  const angle = (screen.orientation?.angle ?? 0) % 360
  const deg = angle === 90 ? -e.beta : angle === 270 || angle === -90 ? e.beta : angle === 180 ? -e.gamma : e.gamma
  rollRad = clamp((deg * Math.PI) / 180, MAX_TILT)
}

let lastAccel: number | null = null
function onMotion(e: DeviceMotionEvent) {
  const x = e.acceleration?.x ?? null
  if (x == null) return
  // Jolts, not steady acceleration: the change since the last reading drives the slosh.
  if (lastAccel != null) {
    const jolt = x - lastAccel
    if (Math.abs(jolt) > 0.6) emit(clamp(jolt * 0.04, 0.35))
  }
  lastAccel = x
}

let lastScrollY = 0
let lastScrollT = 0
function onScroll() {
  const now = performance.now()
  const y = window.scrollY
  const dt = Math.max(16, now - lastScrollT)
  const v = (y - lastScrollY) / dt // px per ms
  lastScrollY = y
  lastScrollT = now
  if (Math.abs(v) > 0.3) emit(clamp(v * 0.05, 0.3))
}

function emit(impulse: number) {
  listeners.forEach((l) => l(impulse))
}

function start() {
  if (started || typeof window === 'undefined') return
  started = true
  lastScrollY = window.scrollY
  window.addEventListener('deviceorientation', onOrientation)
  window.addEventListener('devicemotion', onMotion)
  window.addEventListener('scroll', onScroll, { passive: true })
}

function stop() {
  if (!started) return
  started = false
  rollRad = 0
  lastAccel = null
  window.removeEventListener('deviceorientation', onOrientation)
  window.removeEventListener('devicemotion', onMotion)
  window.removeEventListener('scroll', onScroll)
}

let enabled = true

/** Turns motion input on or off for every tank (the Settings toggle). */
export function setLiquidMotionEnabled(on: boolean) {
  enabled = on
  if (!on) stop()
  else if (listeners.size > 0) start()
}

/** Current phone roll in radians; 0 on desktop or when motion is off. */
export function liquidRoll() {
  return enabled ? rollRad : 0
}

/** Subscribe a tank to jolts. Listeners only attach while at least one tank is mounted. */
export function onLiquidImpulse(fn: Listener) {
  listeners.add(fn)
  if (enabled) start()
  return () => {
    listeners.delete(fn)
    if (listeners.size === 0) stop()
  }
}

type PermissionedEvent = { requestPermission?: () => Promise<'granted' | 'denied'> }

/** True on browsers (iOS Safari) that only send motion after the user allows it. */
export function motionNeedsPermission() {
  return typeof DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as unknown as PermissionedEvent).requestPermission === 'function'
}

/** Asks for motion access where required. Must run inside a tap. Resolves true when allowed. */
export async function requestLiquidMotion(): Promise<boolean> {
  if (!motionNeedsPermission()) return true
  try {
    const orientation = await (DeviceOrientationEvent as unknown as PermissionedEvent).requestPermission!()
    const motion = await ((DeviceMotionEvent as unknown as PermissionedEvent).requestPermission?.() ?? Promise.resolve('granted'))
    return orientation === 'granted' && motion === 'granted'
  } catch {
    return false
  }
}
