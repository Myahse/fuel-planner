import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Box3, Color, Mesh, MeshStandardMaterial, Vector3, type Group, type Material } from 'three'
import type { VehicleModelConfig } from '../../config/vehicleModels'

type Props = {
  config: VehicleModelConfig
  autoRotate?: boolean
}

/** Every model is normalised to this length (scene units ≈ metres) so lighting and camera framing match. */
const TARGET_LENGTH = 4.4

/**
 * Recolour only the bodywork of a baked texture: bright, near-neutral texels (the white paint)
 * take the paint colour; dark tyres, tinted glass, chrome highlights and coloured lights stay as baked.
 */
function applyTextureMaskPaint(mat: MeshStandardMaterial, paint: Color) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uPaint = { value: paint }
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uPaint;')
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        {
          vec3 c = diffuseColor.rgb;
          float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
          float sat = max(max(c.r, c.g), c.b) - min(min(c.r, c.g), c.b);
          float mask = smoothstep(0.38, 0.7, lum) * (1.0 - smoothstep(0.06, 0.18, sat));
          diffuseColor.rgb = mix(c, uPaint * clamp(lum * 1.2, 0.0, 1.0), mask);
        }`,
      )
  }
  mat.customProgramCacheKey = () => `paint-mask-${paint.getHexString()}`
  mat.needsUpdate = true
}

function CarModelMeshLoaded({ config, autoRotate = true }: Props) {
  const group = useRef<Group>(null)
  const { scene } = useGLTF(config.glbUrl!)

  const { root, scale, offset } = useMemo(() => {
    const root = scene.clone(true)
    const paint = new Color(config.paint)
    const owned: Material[] = []

    root.traverse((child) => {
      if (!(child instanceof Mesh)) return
      child.castShadow = true
      child.receiveShadow = true
      const mats = (Array.isArray(child.material) ? child.material : [child.material]).map((m: Material) => {
        if (!(m instanceof MeshStandardMaterial)) return m
        const mat = m.clone()
        owned.push(mat)
        if (config.paintMode === 'texture-mask' && mat.map) {
          applyTextureMaskPaint(mat, paint)
          mat.envMapIntensity = 1.2
        } else if (config.paintMode === 'named-material' && /paint|body/i.test(mat.name)) {
          mat.color.copy(paint)
          mat.metalness = Math.max(mat.metalness, 0.5)
          mat.roughness = Math.min(mat.roughness, 0.35)
        }
        return mat
      })
      child.material = Array.isArray(child.material) ? mats : mats[0]
    })

    const box = new Box3().setFromObject(root)
    const size = box.getSize(new Vector3())
    const scale = TARGET_LENGTH / Math.max(size.x, size.z, 1e-3)
    const center = box.getCenter(new Vector3())
    const offset = new Vector3(-center.x * scale, -box.min.y * scale, -center.z * scale)
    root.userData.ownedMaterials = owned
    return { root, scale, offset }
  }, [scene, config.paint, config.paintMode])

  useEffect(
    () => () => {
      for (const m of root.userData.ownedMaterials as Material[]) m.dispose()
    },
    [root],
  )

  useFrame((_, delta) => {
    if (autoRotate && group.current) group.current.rotation.y += delta * 0.35
  })

  return (
    <group ref={group} rotation={[0, config.rotationY, 0]}>
      <group position={offset} scale={scale}>
        <primitive object={root} />
      </group>
    </group>
  )
}

export function CarModelMesh({ config, autoRotate = true }: Props) {
  if (!config.glbUrl) return null
  return <CarModelMeshLoaded config={config} autoRotate={autoRotate} />
}
