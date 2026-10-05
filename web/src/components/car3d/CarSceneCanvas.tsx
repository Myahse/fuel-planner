import { Suspense, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import type { VehicleModelConfig } from '../../config/vehicleModels'
import { CarModelMesh } from './CarModelMesh'
import { ProceduralCar } from './ProceduralCar'
import { ModelErrorBoundary } from './ModelErrorBoundary'

type Props = {
  config: VehicleModelConfig
  autoRotate?: boolean
  interactive?: boolean
  /** false pauses rendering entirely (off-screen) */
  active?: boolean
  framing?: 'wide' | 'tight'
}

/**
 * A dark studio: no HDR download — reflections come from procedural light strips,
 * which is what gives car paint its long highlights.
 */
function Studio() {
  return (
    <Environment resolution={256} frames={1} environmentIntensity={1.6}>
      <Lightformer form="rect" intensity={3} color="#ffffff" position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 1.4, 1]} />
      <Lightformer form="rect" intensity={1.4} color="#ffffff" position={[0, 4, -4]} rotation-x={Math.PI / 3} scale={[8, 0.5, 1]} />
      <Lightformer form="rect" intensity={1.6} color="#ffe2b0" position={[-6, 1.5, 1]} rotation-y={Math.PI / 2} scale={[6, 1.2, 1]} />
      <Lightformer form="rect" intensity={1.2} color="#cfe4ff" position={[6, 1.5, -1]} rotation-y={-Math.PI / 2} scale={[6, 1, 1]} />
    </Environment>
  )
}

/**
 * Keeps the whole car in frame at any aspect ratio: on tall, narrow phones the camera
 * backs off along the same viewing direction instead of cropping the bumpers.
 */
function FitCamera({ framing }: { framing: 'wide' | 'tight' }) {
  const camera = useThree((s) => s.camera)
  const { width, height } = useThree((s) => s.size)
  useEffect(() => {
    const aspect = width / Math.max(height, 1)
    const base = framing === 'tight' ? 9 : 10.5
    const minAspect = framing === 'tight' ? 2 : 1.4
    const dist = base * Math.max(1, minAspect / aspect)
    const dir = new Vector3(6.2, framing === 'tight' ? 1.6 : 2.3, 5.8).normalize()
    camera.position.copy(dir.multiplyScalar(dist))
    camera.lookAt(0, 0.6, 0)
    camera.updateProjectionMatrix()
  }, [camera, width, height, framing])
  return null
}

function SceneContent({ config, autoRotate, interactive }: Props) {
  const procedural = <ProceduralCar bodyType={config.bodyType} paint={config.paint} autoRotate={autoRotate} />

  return (
    <>
      <Studio />
      <ambientLight intensity={0.35} />
      <spotLight position={[0, 9, 2]} angle={0.45} penumbra={0.9} intensity={120} castShadow shadow-mapSize={[1024, 1024]} />
      <ContactShadows position={[0, 0.001, 0]} opacity={0.85} scale={11} blur={2.4} far={3} resolution={512} color="#000000" />
      {config.glbUrl ? (
        <ModelErrorBoundary fallback={procedural}>
          <Suspense fallback={procedural}>
            <CarModelMesh config={config} autoRotate={autoRotate} />
          </Suspense>
        </ModelErrorBoundary>
      ) : (
        procedural
      )}
      {interactive && (
        <OrbitControls
          enablePan={false}
          target={[0, 0.7, 0]}
          minDistance={4.5}
          maxDistance={22}
          minPolarAngle={Math.PI / 5}
          maxPolarAngle={Math.PI / 2.05}
        />
      )}
    </>
  )
}

export default function CarSceneCanvas({ config, autoRotate = true, interactive = false, active = true, framing = 'wide' }: Props) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      frameloop={active ? 'always' : 'demand'}
      className="!h-full !w-full"
      style={{ width: '100%', height: '100%', display: 'block' }}
      camera={{ position: [7, 2.4, 6.4], fov: 28 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <FitCamera framing={framing} />
      <SceneContent config={config} autoRotate={autoRotate} interactive={interactive} />
    </Canvas>
  )
}
