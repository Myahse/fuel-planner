import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DoubleSide, ExtrudeGeometry, Shape, Vector2, type BufferGeometry, type Group } from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import type { VehicleBodyType } from '../../config/vehicleModels'
import { CAR_PROFILES, GROUND_Y } from './carProfiles'

type Props = {
  bodyType: VehicleBodyType
  paint: string
  autoRotate?: boolean
}

/** Profile units → metres: the 112-unit sedan becomes a ~4.5 m car. */
const S = 0.04
const WIDTH: Record<VehicleBodyType, number> = { sedan: 1.76, hatchback: 1.7, suv: 1.86, pickup: 1.86, minivan: 1.9 }
const BEVEL = 0.07

function shapesFromPath(d: string): Shape[] {
  const parsed = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`)
  return parsed.paths.flatMap((p) =>
    SVGLoader.createShapes(p).map((shape) => {
      // Flip into a y-up, metre-scaled shape so extrusion winding and normals stay correct.
      const pts = shape.getPoints(10).map((v) => new Vector2(v.x * S, (GROUND_Y - v.y) * S))
      return new Shape(pts)
    }),
  )
}

function extrude(shapes: Shape[], depth: number, bevel: boolean): BufferGeometry {
  const geo = new ExtrudeGeometry(shapes, {
    depth,
    bevelEnabled: bevel,
    bevelSize: BEVEL,
    bevelThickness: BEVEL,
    bevelSegments: 4,
    curveSegments: 10,
  })
  geo.translate(0, 0, -depth / 2)
  geo.computeVertexNormals()
  return geo
}

/** Stylised fallback car, extruded from the same profile as the 2D silhouette. Used until a Meshy model exists. */
export function ProceduralCar({ bodyType, paint, autoRotate = true }: Props) {
  const group = useRef<Group>(null)
  const profile = CAR_PROFILES[bodyType]
  const width = WIDTH[bodyType]

  const { body, glass, centerX } = useMemo(() => {
    const core = width - BEVEL * 2
    const body = extrude(shapesFromPath(profile.body), core, true)
    const glass = extrude(shapesFromPath(profile.glass), width + 0.004, false)
    body.computeBoundingBox()
    const bb = body.boundingBox!
    return { body, glass, centerX: (bb.min.x + bb.max.x) / 2 }
  }, [profile, width])

  useFrame((_, delta) => {
    if (autoRotate && group.current) group.current.rotation.y += delta * 0.35
  })

  const tireR = profile.r * S
  const wheelZ = width / 2 - 0.08

  return (
    <group ref={group}>
      {/* Rotate so the car's front (profile left) faces the default camera's right-hand side. */}
      <group position={[0, 0, 0]} rotation={[0, Math.PI, 0]}>
        <group position={[-centerX, 0, 0]}>
          <mesh geometry={body} castShadow receiveShadow>
            <meshPhysicalMaterial color={paint} metalness={0.55} roughness={0.28} clearcoat={1} clearcoatRoughness={0.08} side={DoubleSide} />
          </mesh>
          <mesh geometry={glass}>
            <meshPhysicalMaterial color="#05070a" metalness={0.2} roughness={0.05} clearcoat={1} side={DoubleSide} />
          </mesh>

          {profile.wheels.map((wx) =>
            [-1, 1].map((side) => (
              <group key={`${wx}-${side}`} position={[wx * S, tireR, side * wheelZ]}>
                <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                  <cylinderGeometry args={[tireR, tireR, 0.26, 40]} />
                  <meshStandardMaterial color="#0c0d0f" roughness={0.85} />
                </mesh>
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, side * 0.002]}>
                  <cylinderGeometry args={[tireR * 0.62, tireR * 0.62, 0.27, 32]} />
                  <meshStandardMaterial color="#9aa0a8" metalness={0.9} roughness={0.25} />
                </mesh>
              </group>
            )),
          )}

          {/* Head- and tail-lamp strips */}
          {[-1, 1].map((side) => (
            <group key={side}>
              <mesh position={[(profile.wheels[0] - profile.r * 2.3) * S, (GROUND_Y - 30) * S, side * (width / 2 - 0.28)]}>
                <boxGeometry args={[0.06, 0.07, 0.42]} />
                <meshStandardMaterial color="#fff6e0" emissive="#fff1cc" emissiveIntensity={2.2} />
              </mesh>
              <mesh position={[(profile.wheels[1] + profile.r * 2.6) * S, (GROUND_Y - 31) * S, side * (width / 2 - 0.26)]}>
                <boxGeometry args={[0.06, 0.06, 0.4]} />
                <meshStandardMaterial color="#ff2a1a" emissive="#ff2a1a" emissiveIntensity={1.6} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  )
}
