import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Mesh, MeshStandardMaterial, type Group } from 'three'
import type { VehicleModelConfig } from '../../config/vehicleModels'

type Props = {
  config: VehicleModelConfig
  autoRotate?: boolean
}

function CarModelMeshLoaded({ config, autoRotate = true }: Props) {
  const group = useRef<Group>(null)
  const { scene } = useGLTF(config.glbUrl!)

  const cloned = useMemo(() => {
    const root = scene.clone(true)
    root.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        for (const mat of materials) {
          if (mat instanceof MeshStandardMaterial) {
            mat.color.set(config.paint)
            mat.metalness = 0.55
            mat.roughness = 0.32
          }
        }
      }
    })
    return root
  }, [scene, config.paint])

  useFrame((_, delta) => {
    if (autoRotate && group.current) {
      group.current.rotation.y += delta * 0.45
    }
  })

  useEffect(() => {
    return () => {
      cloned.traverse((child) => {
        if (child instanceof Mesh && child.geometry) child.geometry.dispose()
      })
    }
  }, [cloned])

  return (
    <group ref={group} position={[0, config.yOffset, 0]}>
      <primitive object={cloned} scale={config.scale} />
    </group>
  )
}

export function CarModelMesh({ config, autoRotate = true }: Props) {
  if (!config.glbUrl) return null
  return <CarModelMeshLoaded config={config} autoRotate={autoRotate} />
}
