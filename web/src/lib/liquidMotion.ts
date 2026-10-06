/**
 * Shared motion input for the liquid: how far the phone is rolled (so the fuel stays
 * level with the ground), how hard it is being moved (so the fuel sloshes against the
 * walls) and quick scrolls on desktop. One set of listeners serves every tank.
 */

export type MotionStatus =
  | 'active' // sensor data is arriving
  | 'waiting' // listening, nothing received yet
  | 'needs-permission' // iOS: waiting for a tap to ask
  | 'denied'
  | 'insecure' // http page: browsers withhold sensors
  | 'unsupported'
  | 'off'

type Impulse = (impulse: number) => void

const MAX_TILT = 0.6 // rad: past this the surface leaves a short card

let rollRad = 0
// Sideways and up-down acceleration of the phone in screen axes (m/s², gravity removed).
let accelX = 0
let accelY = 0
let enabled = true
let listening = false
let gotSensorData = false
let permission: 'unknown' | 'granted' | 'denied' = 'unknown'
const impulseListeners = new Set<Impulse>()
const statusListeners = new Set<() => void>()

const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v))
const screenAngle = () => ((screen.orientation?.angle ?? (window as { orientation?: number }).orientation ?? 0) + 360) % 360

/** Device axes to screen axes, so landscape tilts the right way too. */
function toScreen(x: number, y: number): [number, number] {
  switch (screenAngle()) {
    case 90:
      return [-y, x]
    case 180:
      return [-x, -y]
    case 270:
      return [y, -x]
    default:
      return [x, y]
  }
}

function markActive() {
  if (gotSensorData) return
  gotSensorData = true
  notifyStatus()
}

function onOrientation(e: DeviceOrientationEvent) {
  if (e.gamma == null || e.beta == null) return
  markActive()
  const a = screenAngle()
  const deg = a === 90 ? -e.beta : a === 270 ? e.beta : a === 180 ? -e.gamma : e.gamma
  rollRad = clamp((deg * Math.PI) / 180, MAX_TILT)
}

// Fallback for browsers without gravity-free acceleration: strip gravity with a low-pass.
const gravity = { x: 0, y: 0, ready: false }
function onMotion(e: DeviceMotionEvent) {
  let x = e.acceleration?.x ?? null
  let y = e.acceleration?.y ?? null
  if (x == null || y == null) {
    const g = e.accelerationIncludingGravity
    if (g?.x == null || g.y == null) return
    if (!gravity.ready) Object.assign(gravity, { x: g.x, y: g.y, ready: true })
    gravity.x += (g.x - gravity.x) * 0.1
    gravity.y += (g.y - gravity.y) * 0.1
    x = g.x - gravity.x
    y = g.y - gravity.y
  }
  markActive()
  ;[accelX, accelY] = toScreen(clamp(x, 20), clamp(y, 20))
}

let lastScrollY = 0
let lastScrollT = 0
function onScroll() {
  const now = performance.now()
  const y = window.scrollY
  const v = (y - lastScrollY) / Math.max(16, now - lastScrollT) // px per ms
  lastScrollY = y
  lastScrollT = now
  if (Math.abs(v) > 0.3) impulseListeners.forEach((l) => l(clamp(v * 0.05, 0.3)))
}

function listen() {
  if (listening || typeof window === 'undefined') return
  listening = true
  lastScrollY = window.scrollY
  window.addEventListener('deviceorientation', onOrientation)
  window.addEventListener('devicemotion', onMotion)
  window.addEventListener('scroll', onScroll, { passive: true })
  notifyStatus()
}

function unlisten() {
  if (!listening) return
  listening = false
  rollRad = accelX = accelY = 0
  window.removeEventListener('deviceorientation', onOrientation)
  window.removeEventListener('devicemotion', onMotion)
  window.removeEventListener('scroll', onScroll)
  notifyStatus()
}

function notifyStatus() {
  statusListeners.forEach((l) => l())
}

/** Turns motion input on or off for every tank (the Settings switch). */
export function setLiquidMotionEnabled(on: boolean) {
  enabled = on
  if (!on) unlisten()
  else if (impulseListeners.size > 0) listen()
  notifyStatus()
}

/** Current phone roll in radians; 0 on desktop or when motion is off. */
export function liquidRoll() {
  return enabled ? rollRad : 0
}

/** Current sideways and vertical acceleration (m/s², screen axes). */
export function liquidAccel(): [number, number] {
  return enabled ? [accelX, accelY] : [0, 0]
}

/** Subscribe a tank to scroll jolts. Sensors only attach while a tank is on screen. */
export function onLiquidImpulse(fn: Impulse) {
  impulseListeners.add(fn)
  if (enabled) listen()
  return () => {
    impulseListeners.delete(fn)
    if (impulseListeners.size === 0) unlisten()
  }
}

type PermissionedEvent = { requestPermission?: () => Promise<'granted' | 'denied'> }

/** True on browsers (iOS Safari) that only send motion after the user allows it. */
export function motionNeedsPermission() {
  return typeof DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as unknown as PermissionedEvent).requestPermission === 'function'
}

/**
 * Asks for motion access where required. Safari only accepts this inside a click or
 * touchend handler. Resolves true when sensors may be used.
 */
export async function requestLiquidMotion(): Promise<boolean> {
  if (!motionNeedsPermission()) return true
  try {
    const orientation = await (DeviceOrientationEvent as unknown as PermissionedEvent).requestPermission!()
    const motion = await ((DeviceMotionEvent as unknown as PermissionedEvent).requestPermission?.() ?? Promise.resolve('granted'))
    permission = orientation === 'granted' && motion === 'granted' ? 'granted' : 'denied'
  } catch {
    // Called outside a tap: leave it unknown so the next tap can ask again.
  }
  notifyStatus()
  return permission === 'granted'
}

/**
 * iOS: ask on the first tap anywhere in the app, since nothing moves until then.
 * The listener removes itself once Safari has given an answer.
 */
export function askForMotionOnFirstTap() {
  if (typeof window === 'undefined' || !motionNeedsPermission()) return () => {}
  const ask = () => {
    if (!enabled || permission !== 'unknown') return
    void requestLiquidMotion().then(() => {
      if (permission !== 'unknown') off()
    })
  }
  const off = () => {
    window.removeEventListener('click', ask, true)
    window.removeEventListener('touchend', ask, true)
  }
  window.addEventListener('click', ask, true)
  window.addEventListener('touchend', ask, true)
  return off
}

export function liquidMotionStatus(): MotionStatus {
  if (!enabled) return 'off'
  if (typeof window === 'undefined' || typeof DeviceOrientationEvent === 'undefined') return 'unsupported'
  if (!window.isSecureContext) return 'insecure'
  if (gotSensorData) return 'active'
  if (motionNeedsPermission() && permission === 'unknown') return 'needs-permission'
  if (permission === 'denied') return 'denied'
  return 'waiting'
}

export function onLiquidMotionStatus(fn: () => void) {
  statusListeners.add(fn)
  return () => {
    statusListeners.delete(fn)
  }
}
