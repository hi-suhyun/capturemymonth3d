import { useMemo, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
const ROCK_GEOMETRY = new THREE.LatheGeometry(
  [
    [0, -0.43],
    [0.43, -0.43],
    [0.57, -0.32],
    [0.61, -0.12],
    [0.57, 0.27],
    [0.46, 0.44],
    [0.32, 0.49],
    [0, 0.49],
  ].map(([x, y]) => new THREE.Vector2(x, y)),
  12,
);
const positions = ROCK_GEOMETRY.attributes.position;
for (let i = 0; i < positions.count; i++) {
  const x = positions.getX(i),
    y = positions.getY(i),
    z = positions.getZ(i);
  const n = 1 + Math.sin(Math.atan2(z, x) * 5 + y * 3) * 0.055;
  positions.setXYZ(i, x * n, y, z * n);
}
ROCK_GEOMETRY.computeVertexNormals();
export function Pine({
  position = [0, 0, 0],
  scale = 1,
  variant = 0,
}: {
  position?: [number, number, number];
  scale?: number;
  variant?: number;
}) {
  return (
    <group position={position} scale={scale} rotation={[0, variant, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.065, 0.095, 1.05, 7]} />
        <meshStandardMaterial color="#8b7155" roughness={1} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} position={[0, 0.55 + i * 0.28, 0]}>
          <mesh castShadow>
            <coneGeometry args={[0.67 - i * 0.108, 0.7, 16, 1]} />
            <meshStandardMaterial
              color={["#506d60", "#607c6c", "#6b8574"][variant % 3 | 0]}
              roughness={0.95}
            />
          </mesh>
          <mesh position={[0.01, 0.105, 0.005]} castShadow>
            <coneGeometry args={[(0.67 - i * 0.108) * 0.88, 0.55, 16, 1]} />
            <meshStandardMaterial color="#dedfd4" roughness={0.84} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
export function Rock({
  position = [0, 0, 0],
  scale = [1, 1, 1],
  color = "#b6a998",
  snow = true,
}: {
  position?: [number, number, number];
  scale?: [number, number, number];
  color?: string;
  snow?: boolean;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh
        geometry={ROCK_GEOMETRY}
        position={[0, 0.28, 0]}
        castShadow
        receiveShadow
        rotation={[0.12, 0.4, -0.08]}
      >
        <meshStandardMaterial color={color} roughness={0.96} />
      </mesh>
      {snow && (
        <mesh
          position={[-0.04, 0.67, 0]}
          scale={[0.75, 0.21, 0.69]}
          rotation={[0, 0, 0.05]}
          castShadow
        >
          <sphereGeometry args={[0.65, 16, 10]} />
          <meshStandardMaterial color="#eeece0" roughness={0.82} />
        </mesh>
      )}
    </group>
  );
}
export function Lamp({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.37, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.038, 0.74, 7]} />
        <meshStandardMaterial color="#7e6d54" />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <sphereGeometry args={[0.105, 12, 10]} />
        <meshStandardMaterial
          color="#fff4ce"
          emissive="#ffce69"
          emissiveIntensity={2.7}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <coneGeometry args={[0.14, 0.1, 8]} />
        <meshStandardMaterial color="#7e6d54" metalness={0.2} roughness={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[0.36, 24]} />
        <meshBasicMaterial
          color="#ffd18c"
          transparent
          opacity={0.14}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
export function Shrub({
  position,
  scale = 1,
  color = "#849272",
}: {
  position: [number, number, number];
  scale?: number;
  color?: string;
}) {
  return (
    <group position={position} scale={scale}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          position={[
            Math.sin(i * 2.4) * 0.2,
            0.14 + (i % 2) * 0.1,
            Math.cos(i * 2.4) * 0.2,
          ]}
          scale={[0.22, 0.25 + (i % 2) * 0.11, 0.22]}
          castShadow
        >
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? color : "#a3aa88"}
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  );
}
export function Flowers({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      {[0, 1, 2, 3].map((i) => (
        <group
          key={i}
          position={[Math.sin(i * 2.4) * 0.2, 0, Math.cos(i * 2.4) * 0.2]}
        >
          <mesh position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.012, 0.015, 0.32, 5]} />
            <meshStandardMaterial color="#6b8a65" />
          </mesh>
          <mesh position={[0, 0.33, 0]} scale={[1, 0.65, 1]}>
            <sphereGeometry args={[0.075, 8, 6]} />
            <meshStandardMaterial
              color={["#cf9ca2", "#e8c778", "#a8b9be", "#cfb4cf"][i]}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
export function Cottage({
  position = [0, 0, 0],
  scale = 1,
  rotation = 0,
  color = "#b8845d",
}: {
  position?: [number, number, number];
  scale?: number;
  rotation?: number;
  color?: string;
}) {
  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      <RoundedBox
        args={[1.55, 1.1, 1.3]}
        radius={0.16}
        smoothness={3}
        position={[0, 0.55, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={color} roughness={0.87} />
      </RoundedBox>
      {[-1, 1].map((s) => (
        <group
          key={s}
          position={[s * 0.43, 1.22, 0]}
          rotation={[0, 0, -s * 0.58]}
        >
          <RoundedBox
            args={[1.12, 0.17, 1.7]}
            radius={0.08}
            smoothness={2}
            castShadow
          >
            <meshStandardMaterial color="#7d614c" roughness={0.9} />
          </RoundedBox>
          <RoundedBox
            args={[1.15, 0.14, 1.73]}
            radius={0.07}
            smoothness={2}
            position={[0, 0.12, 0]}
            castShadow
          >
            <meshStandardMaterial color="#eeeade" roughness={0.85} />
          </RoundedBox>
        </group>
      ))}
      <RoundedBox
        args={[0.38, 0.62, 0.08]}
        position={[0, 0.33, 0.68]}
        radius={0.06}
        smoothness={2}
      >
        <meshStandardMaterial color="#634a3a" />
      </RoundedBox>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.49, 0.64, 0.68]}>
          <RoundedBox args={[0.31, 0.37, 0.08]} radius={0.045} smoothness={2}>
            <meshStandardMaterial
              color="#fed295"
              emissive="#e99a47"
              emissiveIntensity={0.85}
            />
          </RoundedBox>
          <mesh position={[0, 0, 0.05]}>
            <boxGeometry args={[0.025, 0.38, 0.02]} />
            <meshStandardMaterial color="#73533d" />
          </mesh>
          <mesh position={[0, 0, 0.05]}>
            <boxGeometry args={[0.32, 0.025, 0.02]} />
            <meshStandardMaterial color="#73533d" />
          </mesh>
        </group>
      ))}
      <RoundedBox
        args={[0.27, 0.65, 0.28]}
        position={[0.45, 1.5, -0.3]}
        radius={0.04}
        smoothness={2}
        castShadow
      >
        <meshStandardMaterial color="#b49d83" />
      </RoundedBox>
      <mesh position={[0, 0.06, 0.95]} castShadow>
        <boxGeometry args={[0.75, 0.12, 0.6]} />
        <meshStandardMaterial color="#aa8663" />
      </mesh>
      <Lamp position={[-0.9, 0, 0.8]} scale={0.8} />
    </group>
  );
}
export function Desk({
  position = [0, 0, 0],
  rotation = 0,
  laptop = false,
}: {
  position?: [number, number, number];
  rotation?: number;
  laptop?: boolean;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RoundedBox
        args={[0.8, 0.08, 0.47]}
        position={[0, 0.47, 0]}
        radius={0.035}
        smoothness={2}
        castShadow
      >
        <meshStandardMaterial color="#ac8056" />
      </RoundedBox>
      {[-1, 1].map((i) => (
        <mesh key={i} position={[i * 0.3, 0.23, 0]} castShadow>
          <boxGeometry args={[0.065, 0.47, 0.3]} />
          <meshStandardMaterial color="#7e654d" />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0.1]} position={[0.06, 0.52, 0.02]}>
        <planeGeometry args={[0.34, 0.26]} />
        <meshStandardMaterial color="#fcf2d4" side={THREE.DoubleSide} />
      </mesh>
      {laptop && (
        <mesh position={[0, 0.69, -0.11]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[0.38, 0.28, 0.025]} />
          <meshStandardMaterial
            color="#526d6d"
            emissive="#749998"
            emissiveIntensity={0.35}
          />
        </mesh>
      )}
      <mesh position={[-0.27, 0.58, 0]}>
        <cylinderGeometry args={[0.05, 0.04, 0.12, 12]} />
        <meshStandardMaterial color="#d2d7b6" />
      </mesh>
    </group>
  );
}
export function Fire({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number];
  scale?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current)
      ref.current.scale.y = 1 + Math.sin(clock.elapsedTime * 7) * 0.08;
  });
  return (
    <group position={position} scale={scale} userData={{ dynamic: true }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh
          key={i}
          position={[Math.sin(i) * 0.32, 0.08, Math.cos(i) * 0.32]}
          scale={[0.16, 0.1, 0.13]}
          castShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#9f9688" />
        </mesh>
      ))}
      <group ref={ref}>
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            position={[
              Math.sin(i * 2) * 0.1,
              0.22 + i * 0.07,
              Math.cos(i * 2) * 0.08,
            ]}
            scale={[0.17 - i * 0.035, 0.45 - i * 0.04, 0.14]}
            rotation={[0, 0, 0.1 * Math.sin(i)]}
          >
            <sphereGeometry args={[1, 12, 12]} />
            <meshStandardMaterial
              color="#ffce65"
              emissive={i === 1 ? "#ffad35" : "#ffb75b"}
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
      <pointLight
        position={[0, 0.5, 0]}
        color="#ffb55e"
        intensity={1.4}
        distance={3}
      />
    </group>
  );
}
export function Water({
  position,
  scale = [1, 1, 1],
}: {
  position: [number, number, number];
  scale?: [number, number, number];
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        uniforms: { uTime: { value: 0 } },
        vertexShader:
          "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
        fragmentShader:
          "varying vec2 vUv; uniform float uTime; void main(){float a=sin(vUv.x*38.+uTime)*sin(vUv.y*30.-uTime*.8); float b=sin((vUv.x+vUv.y)*65.+uTime*1.4);vec3 col=mix(vec3(.24,.58,.65),vec3(.57,.84,.84),.5+a*.15+b*.07);float edge=smoothstep(.5,.38,length(vUv-.5)); gl_FragColor=vec4(col,.94*edge); }",
      }),
    [],
  );
  useFrame(({ clock }) => (material.uniforms.uTime.value = clock.elapsedTime));
  return (
    <mesh
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={scale}
      material={material}
      userData={{ dynamic: true }}
    >
      <planeGeometry args={[2, 2, 1, 1]} />
    </mesh>
  );
}
export function Waterfall({
  position,
}: {
  position: [number, number, number];
}) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        uniforms: { time: { value: 0 } },
        vertexShader:
          "varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
        fragmentShader:
          "varying vec2 v;uniform float time;void main(){float s=sin(v.x*70.+sin(v.y*5.-time*4.));float b=sin(v.y*18.-time*6.);gl_FragColor=vec4(mix(vec3(.25,.62,.73),vec3(.75,.93,.91),.5+s*.18+b*.07),.85);}",
      }),
    [],
  );
  useFrame(({ clock }) => (mat.uniforms.time.value = clock.elapsedTime));
  return (
    <group position={position} userData={{ dynamic: true }}>
      <mesh material={mat} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[1.3, 2.2, 1, 1]} />
      </mesh>
      <Water position={[0, -1.13, 0]} scale={[0.8, 1.1, 1]} />
    </group>
  );
}

export function Dumbbell() {
  return (
    <group rotation={[0, 0, Math.PI / 2]} userData={{ asset: "dumbbell" }}>
      <mesh castShadow>
        <cylinderGeometry args={[0.028, 0.028, 0.3, 10]} />
        <meshStandardMaterial
          color="#b4a58c"
          metalness={0.45}
          roughness={0.55}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0, side * 0.16, 0]} castShadow>
          <cylinderGeometry args={[0.085, 0.085, 0.075, 12]} />
          <meshStandardMaterial color="#64796c" roughness={0.82} />
        </mesh>
      ))}
    </group>
  );
}

export function YogaMat({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  return (
    <group position={position} userData={{ asset: "yoga-mat" }}>
      <RoundedBox
        args={[0.66, 0.035, 0.98]}
        position={[0, 0.025, 0]}
        radius={0.025}
        smoothness={3}
        castShadow
      >
        <meshStandardMaterial color="#9aae9b" roughness={0.92} />
      </RoundedBox>
      <mesh position={[0, 0.06, -0.43]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.052, 0.052, 0.66, 12]} />
        <meshStandardMaterial color="#879e89" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function JoshuaTree({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number];
  scale?: number;
}) {
  return (
    <group
      position={position}
      scale={scale}
      userData={{ asset: "joshua-tree" }}
    >
      <mesh position={[0, 0.48, 0]} rotation={[0, 0, -0.05]} castShadow>
        <cylinderGeometry args={[0.075, 0.12, 0.95, 7]} />
        <meshStandardMaterial color="#76604e" roughness={0.96} />
      </mesh>
      <mesh position={[-0.23, 0.83, 0]} rotation={[0, 0, 0.78]} castShadow>
        <cylinderGeometry args={[0.052, 0.075, 0.58, 7]} />
        <meshStandardMaterial color="#806a54" roughness={0.95} />
      </mesh>
      <mesh position={[-0.43, 1.08, 0]} rotation={[0, 0, 0.08]} castShadow>
        <cylinderGeometry args={[0.045, 0.055, 0.5, 7]} />
        <meshStandardMaterial color="#806a54" roughness={0.95} />
      </mesh>
      <mesh position={[0.22, 0.9, 0]} rotation={[0, 0, -0.75]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.55, 7]} />
        <meshStandardMaterial color="#806a54" roughness={0.95} />
      </mesh>
      <mesh position={[0.42, 1.12, 0]} rotation={[0, 0, -0.08]} castShadow>
        <cylinderGeometry args={[0.042, 0.052, 0.48, 7]} />
        <meshStandardMaterial color="#806a54" roughness={0.95} />
      </mesh>
      {[
        [-0.43, 1.32, 0],
        [0, 1.1, 0],
        [0.42, 1.34, 0],
      ].map(([x, y, z], index) => (
        <group key={index} position={[x, y, z]}>
          {[-1, 0, 1].map((side) => (
            <mesh
              key={side}
              position={[side * 0.055, 0.08, 0]}
              rotation={[0, 0, side * -0.48]}
              castShadow
            >
              <coneGeometry args={[0.055, 0.22, 5]} />
              <meshStandardMaterial color="#78826a" roughness={0.92} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export function KbbqGrill({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number];
  scale?: number;
}) {
  return (
    <group
      position={position}
      scale={scale}
      userData={{ asset: "kbbq-grill" }}
    >
      <RoundedBox
        args={[0.82, 0.1, 0.62]}
        position={[0, 0.38, 0]}
        radius={0.06}
        smoothness={3}
        castShadow
      >
        <meshStandardMaterial color="#80644f" roughness={0.9} />
      </RoundedBox>
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => (
          <mesh key={`${x}-${z}`} position={[x * 0.3, 0.19, z * 0.2]} castShadow>
            <cylinderGeometry args={[0.035, 0.045, 0.38, 7]} />
            <meshStandardMaterial color="#705743" roughness={0.94} />
          </mesh>
        )),
      )}
      <RoundedBox
        args={[0.53, 0.07, 0.43]}
        position={[0, 0.47, 0]}
        radius={0.08}
        smoothness={3}
        castShadow
      >
        <meshStandardMaterial
          color="#454c49"
          metalness={0.42}
          roughness={0.62}
        />
      </RoundedBox>
      {[-0.16, -0.08, 0, 0.08, 0.16].map((x) => (
        <mesh key={x} position={[x, 0.515, 0]} castShadow>
          <boxGeometry args={[0.018, 0.012, 0.31]} />
          <meshStandardMaterial color="#b6a78b" metalness={0.3} />
        </mesh>
      ))}
      {[
        [-0.12, -0.08, -0.07],
        [0.02, 0.08, 0.1],
        [0.14, -0.04, 0.03],
      ].map(([x, rotation, z], index) => (
        <RoundedBox
          key={index}
          args={[0.13, 0.035, 0.07]}
          position={[x, 0.55, z]}
          rotation={[0, rotation, 0]}
          radius={0.025}
          smoothness={3}
          castShadow
        >
          <meshStandardMaterial color="#b86e52" roughness={0.85} />
        </RoundedBox>
      ))}
      <mesh position={[-0.35, 0.49, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.035, 16]} />
        <meshStandardMaterial color="#eee4ce" />
      </mesh>
      <mesh position={[0.35, 0.49, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.035, 16]} />
        <meshStandardMaterial color="#eee4ce" />
      </mesh>
    </group>
  );
}
