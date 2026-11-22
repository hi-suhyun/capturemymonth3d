import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { Pine, Rock, Fire } from "./Props";
import { LittlePerson } from "./Avatar";
function Mini({ scene }: { scene: "chicago" | "mountain" | "friends" }) {
  const root = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (root.current)
      root.current.rotation.y = Math.sin(clock.elapsedTime * 0.3) * 0.12 - 0.35;
  });
  return (
    <group ref={root}>
      <mesh position={[0, -0.18, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.4, 0.34, 48]} />
        <meshStandardMaterial
          color={
            scene === "chicago"
              ? "#b6cbd1"
              : scene === "mountain"
                ? "#c7c3ad"
                : "#cfb9aa"
          }
        />
      </mesh>
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <cylinderGeometry args={[1.47, 1.47, 0.09, 48]} />
        <meshStandardMaterial color="#eee9dd" />
      </mesh>
      {scene === "chicago" ? (
        <group>
          {[
            [-0.5, 0.9, -0.3, 0.4],
            [-0.05, 1.4, -0.45, 0.45],
            [0.55, 0.7, -0.3, 0.45],
            [0.8, 0.42, 0.35, 0.38],
            [-0.75, 0.45, 0.3, 0.5],
          ].map(([x, h, z, w], i) => (
            <group key={i} position={[x, h / 2 + 0.06, z]}>
              <RoundedBox
                args={[w, h, w]}
                radius={0.04}
                smoothness={2}
                castShadow
              >
                <meshStandardMaterial color={i % 2 ? "#768c9b" : "#b7b9b1"} />
              </RoundedBox>
              {Array.from({ length: Math.floor(h * 5) }, (_, j) => (
                <mesh
                  key={j}
                  position={[0, -h / 2 + 0.15 + j * 0.18, w / 2 + 0.005]}
                >
                  <planeGeometry args={[w * 0.65, 0.055]} />
                  <meshStandardMaterial
                    color="#f3dbaa"
                    emissive="#e7b366"
                    emissiveIntensity={0.3}
                  />
                </mesh>
              ))}
            </group>
          ))}
          <mesh position={[-0.05, 1.6, -0.45]}>
            <cylinderGeometry args={[0.015, 0.02, 0.5, 6]} />
            <meshStandardMaterial color="#667e8a" />
          </mesh>
          <mesh position={[0, 0.18, 0.65]} scale={[0.55, 0.25, 0.3]}>
            <sphereGeometry args={[1, 24, 16]} />
            <meshStandardMaterial
              color="#bac3c6"
              metalness={0.8}
              roughness={0.25}
            />
          </mesh>
        </group>
      ) : scene === "mountain" ? (
        <group>
          <Rock position={[0.35, 0.1, -0.3]} scale={[1.3, 1.65, 1.1]} />
          <Pine position={[-0.8, 0.1, -0.25]} scale={0.6} />
          <group position={[0.2, 1.34, -0.3]}>
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.5, 6]} />
              <meshStandardMaterial color="#6b6256" />
            </mesh>
            <mesh position={[0.17, 0.42, 0]}>
              <planeGeometry args={[0.35, 0.2]} />
              <meshStandardMaterial color="#d29565" side={THREE.DoubleSide} />
            </mesh>
          </group>
          <group position={[-0.2, 0.08, 0.6]} scale={0.55}>
            <LittlePerson color="#d99b51" />
          </group>
        </group>
      ) : (
        <group>
          <Fire position={[0, 0.1, 0.15]} scale={0.75} />
          <group position={[-0.6, 0.1, 0.1]} rotation={[0, 1.1, 0]} scale={0.8}>
            <LittlePerson color="#d99b51" />
          </group>
          <group position={[0.65, 0.1, 0.05]} rotation={[0, -1, 0]} scale={0.8}>
            <LittlePerson color="#79958d" />
          </group>
          <Pine position={[-0.75, 0.1, -0.65]} scale={0.5} />
          <Pine position={[0.65, 0.1, -0.75]} scale={0.65} />
        </group>
      )}
    </group>
  );
}
export default function MemoryMiniature({
  scene,
}: {
  scene: "chicago" | "mountain" | "friends";
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      orthographic
      camera={{ position: [4, 3.3, 6], zoom: 59 }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={1.7} />
      <directionalLight
        position={[-3, 6, 5]}
        intensity={3}
        castShadow
        shadow-mapSize={[512, 512]}
      />
      <directionalLight position={[3, 3, -2]} color="#c8dde5" intensity={1} />
      <Mini scene={scene} />
    </Canvas>
  );
}
