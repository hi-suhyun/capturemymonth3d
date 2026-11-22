import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import {
  Desk,
  JoshuaTree,
  KbbqGrill,
  Pine,
  Rock,
  Fire,
} from "./Props";
import { LittlePerson } from "./Avatar";
const STAR_POINTS: [number, number, number, number][] = [
  [-0.95, 1.55, -0.43, 0.035],
  [-0.7, 1.12, -0.43, 0.025],
  [-0.36, 1.78, -0.43, 0.03],
  [-0.12, 1.35, -0.43, 0.04],
  [0.22, 1.67, -0.43, 0.025],
  [0.56, 1.42, -0.43, 0.045],
  [0.89, 1.72, -0.43, 0.03],
  [1.02, 1.18, -0.43, 0.025],
];

function StargazingScene() {
  const stars = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    stars.current.forEach((star, index) => {
      if (star) {
        const pulse =
          1 + Math.sin(clock.elapsedTime * (1.5 + index * 0.12) + index) * 0.2;
        star.scale.setScalar(pulse);
      }
    });
  });
  return (
    <group>
      <mesh position={[0, 1.2, -0.76]} scale={[1.65, 1.18, 0.24]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshBasicMaterial color="#30364a" />
      </mesh>
      <mesh position={[-0.72, 1.63, -0.42]}>
        <sphereGeometry args={[0.14, 16, 12]} />
        <meshStandardMaterial
          color="#f0d9a2"
          emissive="#d4aa63"
          emissiveIntensity={0.8}
        />
      </mesh>
      <mesh position={[-0.65, 1.67, -0.36]}>
        <sphereGeometry args={[0.13, 16, 12]} />
        <meshBasicMaterial color="#30364a" />
      </mesh>
      {STAR_POINTS.map(([x, y, z, size], index) => (
        <mesh
          key={index}
          ref={(star) => {
            stars.current[index] = star;
          }}
          position={[x, y, z]}
        >
          <octahedronGeometry args={[size, 0]} />
          <meshBasicMaterial color="#fff0c8" toneMapped={false} />
        </mesh>
      ))}
      <JoshuaTree position={[-0.88, 0.08, -0.15]} scale={0.58} />
      <JoshuaTree position={[0.82, 0.08, -0.24]} scale={0.82} />
      <Rock
        position={[-0.55, 0.08, 0.18]}
        scale={[0.7, 0.65, 0.72]}
        color="#8b7161"
        snow={false}
      />
      <Rock
        position={[0.64, 0.08, 0.36]}
        scale={[0.63, 0.5, 0.65]}
        color="#927968"
        snow={false}
      />
      <group position={[-0.32, 0.08, 0.28]} rotation={[0, -0.42, 0]}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.035, 0.52, 8]} />
          <meshStandardMaterial color="#88755f" metalness={0.25} />
        </mesh>
        <mesh
          position={[0.03, 0.55, 0]}
          rotation={[0, 0, -0.55]}
          castShadow
        >
          <cylinderGeometry args={[0.045, 0.06, 0.4, 10]} />
          <meshStandardMaterial color="#b6a384" metalness={0.35} />
        </mesh>
        <mesh position={[0.08, 0.66, 0]}>
          <cylinderGeometry args={[0.065, 0.055, 0.06, 10]} />
          <meshStandardMaterial color="#e5d7b6" />
        </mesh>
      </group>
      <group position={[0.17, 0.08, 0.54]} rotation={[0, -0.22, 0]} scale={0.43}>
        <LittlePerson color="#d99b51" />
      </group>
      <pointLight
        position={[-0.5, 1.9, 0.25]}
        color="#c2cceb"
        intensity={0.55}
        distance={3.5}
      />
    </group>
  );
}

function HackathonScene() {
  return (
    <group>
      <mesh position={[0, 0.1, -0.5]} scale={[0.95, 0.7, 0.18]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color="#d8d1b3" roughness={0.96} />
      </mesh>
      <group position={[0, 0.08, -0.12]} scale={0.78}>
        <Desk laptop />
      </group>
      <group position={[-0.65, 0.08, 0.44]} rotation={[0, 2.1, 0]} scale={0.43}>
        <LittlePerson color="#d99b51" action="typing" />
      </group>
      <group position={[0.65, 0.08, 0.44]} rotation={[0, -2.1, 0]} scale={0.43}>
        <LittlePerson color="#79958d" action="typing" />
      </group>
      <mesh position={[0, 1.18, -0.36]} rotation={[0, Math.PI / 4, 0]}>
        <octahedronGeometry args={[0.13, 0]} />
        <meshStandardMaterial
          color="#e5c779"
          emissive="#d4aa4f"
          emissiveIntensity={0.75}
        />
      </mesh>
      <pointLight
        position={[0, 1.16, -0.2]}
        color="#e4c57c"
        intensity={0.65}
        distance={2.2}
      />
    </group>
  );
}

function KbbqScene() {
  return (
    <group>
      <KbbqGrill position={[0, 0.08, -0.08]} scale={0.84} />
      <group position={[-0.68, 0.08, 0.45]} rotation={[0, 2.1, 0]} scale={0.42}>
        <LittlePerson color="#d99b51" action="reading" />
      </group>
      <group position={[0.68, 0.08, 0.45]} rotation={[0, -2.1, 0]} scale={0.42}>
        <LittlePerson color="#79958d" action="reading" />
      </group>
      <mesh position={[0, 0.62, -0.08]}>
        <sphereGeometry args={[0.12, 12, 8]} />
        <meshStandardMaterial
          color="#e88857"
          emissive="#c95739"
          emissiveIntensity={0.55}
        />
      </mesh>
      <pointLight
        position={[0, 0.95, -0.05]}
        color="#ffbd78"
        intensity={0.55}
        distance={2}
      />
    </group>
  );
}

function Mini({
  scene,
}: {
  scene:
    | "chicago"
    | "mountain"
    | "friends"
    | "stargazing"
    | "hackathon"
    | "kbbq";
}) {
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
              : scene === "stargazing"
                ? "#555466"
                : scene === "hackathon"
                  ? "#c4bd9f"
                  : scene === "kbbq"
                    ? "#ad8a72"
                    : scene === "mountain"
                      ? "#c7c3ad"
                      : "#cfb9aa"
          }
        />
      </mesh>
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <cylinderGeometry args={[1.47, 1.47, 0.09, 48]} />
        <meshStandardMaterial
          color={
            scene === "stargazing"
              ? "#39394a"
              : scene === "hackathon"
                ? "#eee8d7"
                : scene === "kbbq"
                  ? "#ead8c7"
                  : "#eee9dd"
          }
        />
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
      ) : scene === "stargazing" ? (
        <StargazingScene />
      ) : scene === "hackathon" ? (
        <HackathonScene />
      ) : scene === "kbbq" ? (
        <KbbqScene />
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
  scene:
    | "chicago"
    | "mountain"
    | "friends"
    | "stargazing"
    | "hackathon"
    | "kbbq";
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      orthographic
      camera={{ position: [4, 3.3, 6], zoom: scene === "stargazing" ? 51 : 59 }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={scene === "stargazing" ? 0.95 : 1.7} />
      <directionalLight
        position={[-3, 6, 5]}
        intensity={scene === "stargazing" ? 1.8 : 3}
        castShadow
        shadow-mapSize={[512, 512]}
      />
      <directionalLight
        position={[3, 3, -2]}
        color="#c8dde5"
        intensity={scene === "stargazing" ? 0.45 : 1}
      />
      <Mini scene={scene} />
    </Canvas>
  );
}
