import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

function NeuralKnot() {
  const groupRef = useRef<THREE.Group>(null)
  const knotGeometry = useMemo(() => new THREE.TorusKnotGeometry(1.38, 0.34, 260, 28, 3, 5), [])

  useEffect(() => () => knotGeometry.dispose(), [knotGeometry])

  useFrame((state, delta) => {
    const group = groupRef.current
    if (!group) return

    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, state.pointer.y * 0.22 - 0.16, 3, delta)
    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, state.pointer.x * 0.28 + state.clock.elapsedTime * 0.08, 3, delta)
    group.rotation.z += delta * 0.035
  })

  return (
    <group ref={groupRef} rotation={[-0.18, 0.45, 0.08]}>
      <mesh geometry={knotGeometry} castShadow>
        <meshPhysicalMaterial
          color="#121416"
          metalness={0.92}
          roughness={0.22}
          clearcoat={1}
          clearcoatRoughness={0.1}
          iridescence={1}
          iridescenceIOR={1.8}
          iridescenceThicknessRange={[140, 680]}
          envMapIntensity={1.2}
        />
      </mesh>
      <mesh geometry={knotGeometry} scale={1.006}>
        <meshBasicMaterial color="#6e5dc7" transparent opacity={0.11} wireframe />
      </mesh>
      <points geometry={knotGeometry} scale={1.022}>
        <pointsMaterial color="#d7ff45" size={0.017} transparent opacity={0.86} sizeAttenuation />
      </points>
    </group>
  )
}

function AmbientParticles() {
  const pointsRef = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const values = new Float32Array(360 * 3)
    for (let index = 0; index < 360; index += 1) {
      const offset = index * 3
      values[offset] = (Math.random() - 0.5) * 7
      values[offset + 1] = (Math.random() - 0.5) * 5
      values[offset + 2] = (Math.random() - 0.5) * 4
    }
    return values
  }, [])

  useFrame((_, delta) => {
    if (pointsRef.current) pointsRef.current.rotation.y -= delta * 0.018
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#d7ff45" size={0.012} transparent opacity={0.5} sizeAttenuation />
    </points>
  )
}

export default function HeroScene() {
  return (
    <Canvas
      aria-hidden="true"
      camera={{ position: [0, 0, 4.9], fov: 42 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 3, 4]} intensity={3.5} color="#f3f4ed" />
      <pointLight position={[-3, -2, 2]} intensity={18} color="#7d64ff" distance={8} />
      <pointLight position={[2.5, -1, 3]} intensity={14} color="#d7ff45" distance={7} />
      <NeuralKnot />
      <AmbientParticles />
    </Canvas>
  )
}
