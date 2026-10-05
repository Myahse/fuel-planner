import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bounds, ContactShadows, OrbitControls } from '@react-three/drei'
import type { VehicleModelConfig } from '../../config/vehicleModels'
import { CarModelMesh } from './CarModelMesh'
import { ProceduralCar } from './ProceduralCar'
import { ModelErrorBoundary } from './ModelErrorBoundary'

type Props = {
  config: VehicleModelConfig
  autoRotate?: boolean
  interactive?: boolean
}

function SceneContent({ config, autoRotate, interactive }: Props) {
  const procedural = (
    <ProceduralCar bodyType={config.bodyType} paint={config.paint} autoRotate={autoRotate && !interactive} />
  )

  return (
    <>
      <color attach="background" args={['#f8faf8']} />
      <ambientLight intensity={0.65} />
      <hemisphereLight intensity={0.45} color="#ffffff" groundColor="#94a3b8" />
      <directionalLight position={[6, 10, 4]} intensity={1.2} castShadow />
      <directionalLight position={[-4, 6, -2]} intensity={0.35} />
      <ContactShadows position={[0, -0.35, 0]} opacity={0.45} scale={12} blur={2.5} far={4} />
      <Bounds fit clip observe margin={1.2}>
        {config.useGltf && config.glbUrl ? (
          <ModelErrorBoundary fallback={procedural}>
            <Suspense fallback={procedural}>
              <CarModelMesh config={config} autoRotate={autoRotate && !interactive} />
            </Suspense>
          </ModelErrorBoundary>
        ) : (
          procedural
        )}
      </Bounds>
      {interactive && (
        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={9}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.1}
          autoRotate={autoRotate}
          autoRotateSpeed={0.8}
        />
      )}
    </>
  )
}

export default function CarSceneCanvas({ config, autoRotate = true, interactive = false }: Props) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      className="!h-full !w-full"
      style={{ width: '100%', height: '100%', display: 'block' }}
      camera={{ position: [4.2, 2.2, 4.8], fov: 42 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#f8faf8', 1)
      }}
    >
      <SceneContent config={config} autoRotate={autoRotate} interactive={interactive} />
    </Canvas>
  )
}
