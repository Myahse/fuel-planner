import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import type { Group } from 'three'
import type { VehicleBodyType } from '../../config/vehicleModels'

type Props = {
  bodyType: VehicleBodyType
  paint: string
  autoRotate?: boolean
}

const glass = { color: '#0f172a', metalness: 0.9, roughness: 0.05, transparent: true, opacity: 0.55 }
const trim = { color: '#111827', metalness: 0.4, roughness: 0.5 }
const tire = { color: '#1f2937', metalness: 0.15, roughness: 0.9 }
const rim = { color: '#d1d5db', metalness: 0.85, roughness: 0.25 }

function Wheel({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.28, z]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.36, 0.36, 0.26, 24]} />
        <meshStandardMaterial {...tire} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 0.28, 16]} />
        <meshStandardMaterial {...rim} />
      </mesh>
    </group>
  )
}

/** Premium stylized car — default viewer (no placeholder GLB toys) */
export function ProceduralCar({ bodyType, paint, autoRotate = true }: Props) {
  const group = useRef<Group>(null)

  const dims =
    bodyType === 'suv'
      ? { length: 4.6, width: 1.85, bodyH: 0.72, cabinL: 2.2, cabinH: 0.62, wheelZ: 1.45 }
      : bodyType === 'hatchback'
        ? { length: 3.9, width: 1.65, bodyH: 0.58, cabinL: 1.85, cabinH: 0.52, wheelZ: 1.2 }
        : { length: 4.35, width: 1.72, bodyH: 0.55, cabinL: 2.05, cabinH: 0.5, wheelZ: 1.35 }

  useFrame((_, delta) => {
    if (autoRotate && group.current) group.current.rotation.y += delta * 0.42
  })

  const paintMat = { color: paint, metalness: 0.72, roughness: 0.22 }

  return (
    <group ref={group} position={[0, -0.05, 0]}>
      <RoundedBox args={[dims.width, dims.bodyH, dims.length]} radius={0.12} smoothness={4} position={[0, dims.bodyH * 0.55, 0]} castShadow>
        <meshStandardMaterial {...paintMat} />
      </RoundedBox>

      <RoundedBox
        args={[dims.width * 0.88, dims.cabinH, dims.cabinL]}
        radius={0.14}
        smoothness={4}
        position={[0, dims.bodyH * 0.55 + dims.cabinH * 0.42, -0.15]}
        castShadow
      >
        <meshStandardMaterial {...paintMat} />
      </RoundedBox>

      <RoundedBox
        args={[dims.width * 0.76, dims.cabinH * 0.65, dims.cabinL * 0.92]}
        radius={0.08}
        smoothness={3}
        position={[0, dims.bodyH * 0.55 + dims.cabinH * 0.48, -0.12]}
      >
        <meshStandardMaterial {...glass} />
      </RoundedBox>

      <mesh position={[0, dims.bodyH * 0.35, dims.length * 0.48]}>
        <boxGeometry args={[dims.width * 0.7, 0.06, 0.04]} />
        <meshStandardMaterial color="#fef08a" emissive="#fbbf24" emissiveIntensity={0.6} />
      </mesh>

      <mesh position={[0, dims.bodyH * 0.2, -dims.length * 0.48]}>
        <boxGeometry args={[dims.width * 0.65, 0.08, 0.05]} />
        <meshStandardMaterial {...trim} />
      </mesh>

      <Wheel x={dims.width * 0.48} z={dims.wheelZ} />
      <Wheel x={-dims.width * 0.48} z={dims.wheelZ} />
      <Wheel x={dims.width * 0.48} z={-dims.wheelZ} />
      <Wheel x={-dims.width * 0.48} z={-dims.wheelZ} />
    </group>
  )
}
