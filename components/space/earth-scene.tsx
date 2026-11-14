'use client'

import { Line, Stars } from '@react-three/drei'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'

const atmosphereVertex = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const atmosphereFragment = /* glsl */ `
  varying vec3 vNormal;
  uniform float uPower;
  uniform float uStrength;
  uniform vec3 uColor;
  void main() {
    float intensity = pow(max(0.0, uPower - dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.2) * uStrength;
    gl_FragColor = vec4(uColor, 1.0) * intensity;
  }
`
const rimFragment = /* glsl */ `
  varying vec3 vNormal;
  uniform vec3 uColor;
  void main() {
    float f = pow(1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.6);
    gl_FragColor = vec4(uColor, f * 0.85);
  }
`

function Earth() {
  const texture = useLoader(THREE.TextureLoader, '/textures/earth-night.png')
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  const ref = useRef<THREE.Mesh>(null)
  const atmo = useMemo(
    () => ({ uPower: { value: 0.72 }, uStrength: { value: 1.25 }, uColor: { value: new THREE.Color('#6adcf5') } }),
    [],
  )
  const rim = useMemo(() => ({ uColor: { value: new THREE.Color('#8fe6ff') } }), [])

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.035
  })

  return (
    <group rotation={[0.38, 0, 0.14]}>
      <mesh ref={ref}>
        <sphereGeometry args={[2, 128, 128]} />
        <meshStandardMaterial
          map={texture}
          emissiveMap={texture}
          emissive="#ffffff"
          emissiveIntensity={0.55}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>
      <mesh scale={1.012}>
        <sphereGeometry args={[2, 96, 96]} />
        <shaderMaterial
          vertexShader={atmosphereVertex}
          fragmentShader={rimFragment}
          uniforms={rim}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh scale={1.17}>
        <sphereGeometry args={[2, 96, 96]} />
        <shaderMaterial
          vertexShader={atmosphereVertex}
          fragmentShader={atmosphereFragment}
          uniforms={atmo}
          side={THREE.BackSide}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

function ellipse(rx: number, ry: number, n = 200) {
  return new THREE.EllipseCurve(0, 0, rx, ry, 0, Math.PI * 2, false, 0).getPoints(n).map((p) => new THREE.Vector3(p.x, 0, p.y))
}

function Orbits({ reduced }: { reduced: boolean }) {
  const a = useMemo(() => ellipse(3.3, 3.1), [])
  const b = useMemo(() => ellipse(4.4, 3.9), [])
  const sat = useRef<THREE.Mesh>(null)
  const trail = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const t = reduced ? 1.2 : clock.getElapsedTime() * 0.16
    if (sat.current) sat.current.position.set(Math.cos(t) * 3.3, 0, Math.sin(t) * 3.1)
    if (trail.current) trail.current.position.set(Math.cos(-t * 0.7 + 2) * 4.4, 0, Math.sin(-t * 0.7 + 2) * 3.9)
  })
  return (
    <group rotation={[0.42, 0, -0.32]}>
      <Line points={a} color="#6adcf5" lineWidth={0.8} transparent opacity={0.28} />
      <group rotation={[0.25, 0.4, 0.15]}>
        <Line points={b} color="#a397ff" lineWidth={0.6} transparent opacity={0.18} dashed dashSize={0.12} gapSize={0.1} />
        <mesh ref={trail}>
          <sphereGeometry args={[0.025, 12, 12]} />
          <meshBasicMaterial color="#a397ff" />
        </mesh>
      </group>
      <mesh ref={sat}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#eaf6ff" />
      </mesh>
    </group>
  )
}

function CameraRig({ skip, reduced, offset }: { skip: boolean; reduced: boolean; offset: [number, number] }) {
  const { camera, pointer } = useThree()
  const start = useRef<number | null>(null)
  const light = useRef<THREE.DirectionalLight>(null)
  useFrame(({ clock }) => {
    if (start.current === null) start.current = clock.getElapsedTime()
    const p = skip || reduced ? 1 : Math.min((clock.getElapsedTime() - start.current) / 4.2, 1)
    const ease = 1 - Math.pow(1 - p, 4)
    const z = THREE.MathUtils.lerp(42, 8.2, ease)
    const tx = reduced ? 0 : pointer.x * 0.45
    const ty = reduced ? 0 : pointer.y * 0.3
    camera.position.x += (tx - offset[0] - camera.position.x) * 0.04
    camera.position.y += (ty - offset[1] - camera.position.y) * 0.04
    camera.position.z = skip ? camera.position.z + (8.2 - camera.position.z) * 0.08 : z
    camera.lookAt(-offset[0], -offset[1], 0)
    if (light.current) {
      light.current.position.x = -6 + pointer.x * 1.5
      light.current.position.y = 2.5 + pointer.y * 1.2
    }
  })
  return <directionalLight ref={light} position={[-6, 2.5, 5]} intensity={2.2} color="#d8efff" />
}

export default function EarthScene({
  skip = false,
  reduced = false,
  offset = [0, 0],
}: {
  skip?: boolean
  reduced?: boolean
  offset?: [number, number]
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 42], fov: 38, near: 0.1, far: 400 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      aria-hidden
    >
      <ambientLight intensity={0.06} />
      <CameraRig skip={skip} reduced={reduced} offset={offset} />
      <Stars radius={120} depth={60} count={reduced ? 2500 : 5000} factor={3.2} saturation={0} fade speed={reduced ? 0 : 0.4} />
      <Suspense fallback={null}>
        <Earth />
      </Suspense>
      <Orbits reduced={reduced} />
    </Canvas>
  )
}
