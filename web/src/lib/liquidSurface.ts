/**
 * A fuel surface simulated as shallow water across the tank: the liquid is split into
 * columns whose heights and flows obey gravity, so waves travel, bounce off the walls
 * and die down on their own, the amount of fuel never changes, and a low tank sloshes
 * slower than a full one, as real fuel does.
 *
 * Units are screen pixels and seconds. `eta` is how far each column's surface sits
 * above (+) or below (−) the resting level.
 */

/** Pixels per metre of real tank: sets gravity, and with it the slosh period. */
const PX_PER_METRE = 720
const G = 9.81 * PX_PER_METRE
/** How fast motion dies away (1/s): a few visible swings, like fuel in a baffled tank. */
const DAMPING = 0.85
/** Per-step smoothing that keeps the grid from showing sawtooth noise. */
const SMOOTH = 0.02

export type SurfaceForces = {
  /** Sideways body force on the fuel (px/s²): gravity along a tilted tank, minus the tank's own acceleration. */
  push: number
  /** Up-down acceleration of the tank (px/s²), which strengthens or weakens gravity. */
  heave: number
}

export class LiquidSurface {
  eta: Float64Array
  /** Flow between neighbouring columns (px/s); the walls at both ends stay at 0. */
  private u: Float64Array
  private width = 1
  private time = 0

  constructor(width: number) {
    this.eta = new Float64Array(0)
    this.u = new Float64Array(1)
    this.resize(width)
  }

  get columns() {
    return this.eta.length
  }

  /** Re-grids for a new width, keeping the current shape. */
  resize(width: number) {
    const n = Math.max(24, Math.min(96, Math.round(width / 6)))
    this.width = Math.max(1, width)
    if (n === this.eta.length) return
    const old = this.eta
    this.eta = new Float64Array(n)
    if (old.length) for (let i = 0; i < n; i++) this.eta[i] = old[Math.min(old.length - 1, Math.floor((i / n) * old.length))]
    this.u = new Float64Array(n + 1)
  }

  /** Surface offset at x (px from the left wall), interpolated between columns. */
  at(x: number) {
    const n = this.eta.length
    const f = Math.max(0, Math.min(n - 1, (x / this.width) * n - 0.5))
    const i = Math.floor(f)
    const j = Math.min(n - 1, i + 1)
    return this.eta[i] + (this.eta[j] - this.eta[i]) * (f - i)
  }

  /** Flow speed at x (px/s), for things carried by the fuel such as bubbles. */
  flowAt(x: number) {
    const n = this.eta.length
    const k = Math.max(0, Math.min(n, Math.round((x / this.width) * n)))
    return this.u[k]
  }

  /** Pushes the fuel near x sideways (a hand or cursor sweeping through it). */
  stir(x: number, velocity: number, radius = 40) {
    const n = this.eta.length
    const dx = this.width / n
    for (let k = 1; k < n; k++) {
      const d = k * dx - x
      this.u[k] += velocity * Math.exp(-(d * d) / (2 * radius * radius))
    }
  }

  /** Presses the surface down at x, as if something dropped in; the fuel displaced rises around it. */
  drop(x: number, depth: number, radius = 18) {
    const n = this.eta.length
    const dx = this.width / n
    let mean = 0
    const dent = new Float64Array(n)
    for (let i = 0; i < n; i++) {
      const d = (i + 0.5) * dx - x
      dent[i] = -depth * Math.exp(-(d * d) / (2 * radius * radius))
      mean += dent[i] / n
    }
    for (let i = 0; i < n; i++) this.eta[i] += dent[i] - mean
  }

  /** A sudden sideways jolt of the whole tank (px/s change in the fuel's speed). */
  jolt(velocity: number) {
    for (let k = 1; k < this.u.length - 1; k++) this.u[k] += velocity
  }

  /**
   * Advances the simulation by dt seconds for fuel `depth` px deep.
   * Sub-steps keep it stable however long the frame was.
   */
  step(dt: number, depth: number, forces: SurfaceForces) {
    const n = this.eta.length
    const dx = this.width / n
    // Deep fuel behaves like deep water: waves stop speeding up past about a third of the width.
    const h = Math.max(2, Math.min(depth, this.width / Math.PI))
    const g = Math.max(G * 0.2, G + forces.heave)
    const c = Math.sqrt(g * h)
    const steps = Math.max(1, Math.ceil((c * dt) / (0.45 * dx)))
    const sub = dt / steps
    const decay = Math.exp(-DAMPING * sub)
    const { eta, u } = this
    for (let s = 0; s < steps; s++) {
      this.time += sub
      // A faint draught keeps the surface alive at rest without looking scripted.
      const t = this.time
      for (let k = 1; k < n; k++) {
        const breeze = 18 * Math.sin(k * 0.37 + t * 1.3) + 12 * Math.sin(k * 0.11 - t * 0.7)
        u[k] = (u[k] + sub * (-g * (eta[k] - eta[k - 1]) / dx + forces.push + breeze)) * decay
      }
      for (let i = 0; i < n; i++) eta[i] -= (sub * h * (u[i + 1] - u[i])) / dx
      // Smooth with mirrored ends so the total amount of fuel is unchanged.
      let prev = eta[0]
      for (let i = 0; i < n; i++) {
        const left = i > 0 ? prev : eta[i]
        const right = i < n - 1 ? eta[i + 1] : eta[i]
        prev = eta[i]
        eta[i] += SMOOTH * (left - 2 * eta[i] + right)
      }
    }
  }

  /** Back to a flat, still surface. */
  reset() {
    this.eta.fill(0)
    this.u.fill(0)
  }
}

/** Gravity in the simulation's pixel units, for turning tilt and phone acceleration into forces. */
export const SURFACE_G = G
export const SURFACE_PX_PER_METRE = PX_PER_METRE
