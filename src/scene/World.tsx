import {
  memo,
  Suspense,
  useMemo,
  useRef,
  useLayoutEffect,
  useEffect,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrthographicCamera,
  ContactShadows,
  RoundedBox,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Vignette,
  N8AO,
} from "@react-three/postprocessing";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
  islandGeometry,
  cliffGeometry,
  ribbon,
  groundHeight,
  distanceFromTrail,
  seeded,
  pointAt,
  tangentAt,
} from "./landscape";
import {
  Pine,
  Rock,
  Lamp,
  Shrub,
  Cottage,
  Fire,
  Flowers,
  Water,
  Waterfall,
} from "./Props";
import { Traveler, journeyPose, type Playback } from "./Avatar";
import type { Journey } from "../domain/types";
const Terrain = memo(function Terrain() {
  const top = useMemo(islandGeometry, []),
    cliff = useMemo(cliffGeometry, []),
    road = useMemo(() => ribbon(1.08, 0.025), []),
    edge = useMemo(() => ribbon(1.25, 0.01), []);
  return (
    <group>
      <mesh geometry={cliff} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.96} />
      </mesh>
      <mesh geometry={top} castShadow receiveShadow>
        <meshStandardMaterial
          vertexColors
          roughness={0.94}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={edge} receiveShadow>
        <meshStandardMaterial
          color="#c49a6c"
          roughness={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={road} receiveShadow>
        <meshStandardMaterial
          color="#e9cd9e"
          emissive="#d8a464"
          emissiveIntensity={0.18}
          roughness={0.89}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
});
const Decoration = memo(function Decoration() {
  const scatter = useMemo(() => {
    const random = seeded(4324);
    const a: { x: number; z: number; s: number; k: number; r: number }[] = [];
    for (let i = 0; i < 610; i++) {
      const x = (random() - 0.5) * 12,
        z = (random() - 0.5) * 27;
      if ((x * x) / 38 + (z * z) / 190 > 0.9 || distanceFromTrail(x, z) < 1.02)
        continue;
      if (
        Math.hypot(x + 4.5, (z - 5) * 0.7) < 1.7 ||
        Math.hypot(x - 3, z - 8) < 1.5 ||
        Math.hypot(x + 1, z + 1) < 1.5 ||
        Math.hypot(x - 3.5, z + 8) < 1.5
      )
        continue;
      a.push({
        x,
        z,
        s: 0.36 + random() * 0.64,
        k: Math.floor(random() * 8),
        r: random() * 6,
      });
    }
    return a;
  }, []);
  return (
    <group>
      {scatter.map((o, i) => {
        const p: [number, number, number] = [
          o.x,
          groundHeight(o.x, o.z) + 0.03,
          o.z,
        ];
        return o.k < 2 ? (
          <Pine key={i} position={p} scale={o.s * 1.15} variant={o.r} />
        ) : o.k < 4 ? (
          <Rock
            key={i}
            position={p}
            scale={[o.s, o.s * 0.7, o.s * 0.9]}
            color={i % 3 === 0 ? "#c2ac98" : "#aaa99c"}
          />
        ) : o.k < 7 ? (
          <Shrub key={i} position={p} scale={o.s} />
        ) : (
          <Flowers key={i} position={p} scale={o.s * 1.5} />
        );
      })}
      {Array.from({ length: 39 }, (_, i) => {
        const t = 0.012 + i / 40,
          p = pointAt(t),
          dir = tangentAt(t);
        const side = i % 2 ? 1 : -1;
        return (
          <Lamp
            key={`lamp${i}`}
            position={[
              p.x + dir.z * 0.85 * side,
              p.y - 0.07,
              p.z - dir.x * 0.85 * side,
            ]}
            scale={i % 3 === 0 ? 0.88 : 0.7}
          />
        );
      })}
      <Cottage
        position={[3.7, groundHeight(3.7, 7.1), 7.1]}
        scale={1.25}
        rotation={-0.5}
      />
      <Cottage
        position={[-1.9, groundHeight(-1.9, -0.3), -0.3]}
        scale={1.1}
        rotation={0.4}
        color="#b8a389"
      />
      <Cottage
        position={[4.05, groundHeight(4.05, -7), -7]}
        scale={0.85}
        rotation={-0.7}
        color="#b57e5f"
      />
      <Pine position={[-4.7, groundHeight(-4.7, 1.3), 1.3]} scale={1.8} />
      <Pine
        position={[4.9, groundHeight(4.9, -4), -4]}
        scale={1.65}
        variant={1}
      />
      <Rock
        position={[-4.6, groundHeight(-4.6, -7.5), -7.5]}
        scale={[1.8, 3, 1.7]}
        color="#bfa78f"
      />
      <Rock
        position={[3, groundHeight(3, -11.2), -11.2]}
        scale={[2, 2.8, 1.6]}
        color="#c3aa93"
      />
      <Rock
        position={[-2.5, groundHeight(-2.5, -11.8), -11.8]}
        scale={[2.1, 2.8, 2.3]}
        color="#bd9f83"
      />
      <Rock
        position={[-0.6, groundHeight(-0.6, -13), -13]}
        scale={[2.1, 2.4, 1.6]}
        color="#c2a78f"
      />
      <group position={[-0.7, groundHeight(-0.7, -11.4), -11.4]}>
        <mesh position={[0, 0.65, -0.5]} scale={[1, 0.9, 0.4]}>
          <sphereGeometry args={[0.9, 20, 16]} />
          <meshStandardMaterial color="#81624b" />
        </mesh>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Rock
            key={i}
            position={[
              Math.cos((i / 6) * Math.PI) * 0.95,
              Math.sin((i / 6) * Math.PI) * 1.3,
              0,
            ]}
            scale={[0.55, 0.6, 0.6]}
            color="#c2a284"
          />
        ))}
        <Fire position={[0, 0.05, 0.4]} scale={1.4} />
      </group>
      <Water
        position={[-4.7, groundHeight(-4.7, 4.7) + 0.04, 4.7]}
        scale={[1.4, 2.05, 1]}
      />
      <Waterfall position={[-5.8, groundHeight(-5.8, 5) - 1, 5]} />
      <Water
        position={[4, groundHeight(4, -4.6) + 0.03, -4.6]}
        scale={[1.2, 1.5, 1]}
      />
      {Array.from({ length: 9 }, (_, i) => {
        const t = 0.264 + i * 0.0028;
        const p = pointAt(t),
          dir = tangentAt(t);
        return (
          <RoundedBox
            key={`bridge${i}`}
            position={[p.x, p.y + 0.065, p.z]}
            rotation={[0, Math.atan2(dir.x, dir.z), 0]}
            args={[1.25, 0.12, 0.19]}
            radius={0.025}
            smoothness={2}
            castShadow
          >
            <meshStandardMaterial
              color={i % 2 ? "#aa7d51" : "#bd9163"}
              roughness={0.9}
            />
          </RoundedBox>
        );
      })}
      {[-1, 1].map((s) =>
        [0.264, 0.286].map((t, i) => {
          const p = pointAt(t),
            d = tangentAt(t);
          return (
            <mesh
              key={`${s}${i}`}
              position={[
                p.x + d.z * 0.64 * s,
                p.y + 0.29,
                p.z - d.x * 0.64 * s,
              ]}
              castShadow
            >
              <cylinderGeometry args={[0.055, 0.075, 0.62, 8]} />
              <meshStandardMaterial color="#926c49" />
            </mesh>
          );
        }),
      )}
      <group position={[1, groundHeight(1, 11.9), 11.9]} rotation={[0, 0.5, 0]}>
        <mesh position={[0, 0.65, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.045, 1.3, 8]} />
          <meshStandardMaterial color="#826947" />
        </mesh>
        <RoundedBox
          args={[0.7, 0.26, 0.08]}
          radius={0.04}
          smoothness={2}
          position={[0, 1.12, 0]}
          castShadow
        >
          <meshStandardMaterial color="#bfa37a" />
        </RoundedBox>
        <RoundedBox
          args={[0.52, 0.2, 0.08]}
          radius={0.03}
          smoothness={2}
          position={[0.08, 0.82, 0.01]}
        >
          <meshStandardMaterial color="#d1bc99" />
        </RoundedBox>
      </group>
    </group>
  );
});

function StaticBatch({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    const root = group.current;
    if (!root) return;
    root.updateWorldMatrix(true, true);
    const buckets = new Map<
      string,
      { mat: THREE.MeshStandardMaterial; geos: THREE.BufferGeometry[] }
    >();
    const hidden: THREE.Mesh[] = [];
    root.traverse((object) => {
      if (
        !(object instanceof THREE.Mesh) ||
        !(object.material instanceof THREE.MeshStandardMaterial)
      )
        return;
      let parent: THREE.Object3D | null = object;
      while (parent && parent !== root) {
        if (parent.userData.dynamic) return;
        parent = parent.parent;
      }
      const mat = object.material;
      const key = [
        mat.color.getHex(),
        mat.emissive.getHex(),
        mat.emissiveIntensity,
        mat.roughness,
        mat.metalness,
        mat.side,
        mat.opacity,
        mat.transparent,
      ].join(":");
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { mat: mat.clone(), geos: [] };
        buckets.set(key, bucket);
      }
      const geo = object.geometry.index
        ? object.geometry.toNonIndexed()
        : object.geometry.clone();
      geo.clearGroups();
      for (const key of Object.keys(geo.attributes))
        if (!["position", "normal"].includes(key)) geo.deleteAttribute(key);
      geo.applyMatrix4(object.matrixWorld);
      bucket.geos.push(geo);
      hidden.push(object);
    });
    const merged: THREE.Mesh[] = [];
    for (const bucket of buckets.values()) {
      const geo = mergeGeometries(bucket.geos);
      bucket.geos.forEach((g) => g.dispose());
      if (!geo) continue;
      const mesh = new THREE.Mesh(geo, bucket.mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      root.add(mesh);
      merged.push(mesh);
    }
    hidden.forEach((m) => (m.visible = false));
    return () => {
      hidden.forEach((m) => (m.visible = true));
      merged.forEach((m) => {
        root.remove(m);
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
    };
  }, []);
  return <group ref={group}>{children}</group>;
}

function CameraRig({
  journey,
  playback,
  active,
}: {
  journey?: Journey;
  playback: React.RefObject<Playback>;
  active: boolean;
}) {
  const { camera, size } = useThree();
  const target = useRef(new THREE.Vector3(0, 0.6, 0));
  useFrame((_, dt) => {
    const t = playback.current.time;
    const pose = journeyPose(journey, t),
      p = pointAt(pose.position);
    const full =
      !active || playback.current.overview
        ? 0
        : t < 2.1
          ? 0
          : t < 5
            ? THREE.MathUtils.smoothstep(t, 2.1, 5)
            : journey && t > journey.duration - 5
              ? 1 -
                THREE.MathUtils.smoothstep(
                  t,
                  journey.duration - 5,
                  journey.duration,
                )
              : 1;
    const desiredTarget = new THREE.Vector3(0, 0.7, 0).lerp(
      new THREE.Vector3(p.x, p.y + 0.5, p.z),
      full,
    );
    if (!active && size.width > 850)
      desiredTarget.add(new THREE.Vector3(-6.5, 0, 3.8));
    target.current.lerp(desiredTarget, 1 - Math.exp(-dt * 5));
    const offset = new THREE.Vector3(17, 24, 29).lerp(
      new THREE.Vector3(9, 12, 14),
      full,
    );
    camera.position.copy(target.current).add(offset);
    camera.lookAt(target.current);
    const ortho = camera as THREE.OrthographicCamera;
    const fullZoom = Math.min(
      size.height / 34,
      size.width / (size.width > 850 ? 38 : 24),
    );
    const closeZoom = Math.min(
      size.height / 9,
      size.width / (size.width > 850 ? 16 : 11),
    );
    const zoom = THREE.MathUtils.lerp(fullZoom, closeZoom, full);
    ortho.zoom = THREE.MathUtils.lerp(ortho.zoom, zoom, 1 - Math.exp(-dt * 5));
    ortho.updateProjectionMatrix();
  });
  return null;
}
function PhotoThought({
  image,
  journey,
  playback,
}: {
  image: string;
  journey?: Journey;
  playback: React.RefObject<Playback>;
}) {
  const group = useRef<THREE.Group>(null);
  const { camera, scene } = useThree();
  const [texture, setTexture] = useState<THREE.Texture>();
  const obstacles = useRef<THREE.Mesh[]>([]);
  const textureLoader = useMemo(() => new THREE.TextureLoader(), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const head = useMemo(() => new THREE.Vector3(), []);
  const side = useMemo(() => new THREE.Vector3(), []);
  const screenRight = useMemo(() => new THREE.Vector3(), []);
  const movement = useMemo(() => new THREE.Vector3(), []);
  const photoScale = 2.89;
  const aspect =
    (texture?.image?.width || 1) / (texture?.image?.height || 1);
  const photoHeight = Math.min(0.9 * photoScale, (1.15 * photoScale) / aspect);
  const photoWidth = photoHeight * aspect;
  const bubbleWidth = photoWidth + 0.18;
  const bubbleHeight = photoHeight + 0.18;

  useEffect(() => {
    let active = true;
    let loadedTexture: THREE.Texture | undefined;
    const request = textureLoader.load(
      image,
      (loaded) => {
        loadedTexture = loaded;
        if (!active) {
          loaded.dispose();
          return;
        }
        loaded.colorSpace = THREE.SRGBColorSpace;
        setTexture(loaded);
      },
      undefined,
      (error) => {
        if (active) console.error("Could not load journey photo.", error);
      },
    );
    return () => {
      active = false;
      request.dispose();
      loadedTexture?.dispose();
    };
  }, [image, textureLoader]);

  useEffect(() => {
    const meshes: THREE.Mesh[] = [];
    scene.traverse((object) => {
      if (
        object instanceof THREE.Mesh &&
        object.visible &&
        !group.current?.getObjectById(object.id)
      )
        meshes.push(object);
    });
    obstacles.current = meshes;
  }, [scene]);

  useFrame(({ clock }) => {
    if (!group.current || !journey) return;
    const pose = journeyPose(journey, playback.current.time);
    if (!pose.chapter) {
      group.current.visible = false;
      return;
    }

    group.current.visible = Boolean(texture);
    if (!texture) return;
    head.copy(pointAt(pose.position));
    head.y += 1.85;
    screenRight.setFromMatrixColumn(camera.matrixWorld, 0);
    screenRight.y = 0;
    screenRight.normalize();
    movement.copy(tangentAt(pose.position));
    const horizontalMotion = movement.dot(screenRight);
    const useTop =
      Math.abs(horizontalMotion) < 0.12 ||
      obstacles.current.length === 0;
    side
      .copy(screenRight)
      .multiplyScalar(horizontalMotion > 0 ? -1 : 1);
    side.y = 0;
    side.normalize();

    const blocked = (direction: THREE.Vector3) => {
      raycaster.set(head, direction);
      raycaster.far = bubbleWidth * 0.5 + 0.5;
      return raycaster.intersectObjects(obstacles.current, false).length > 0;
    };
    const preferredBlocked = blocked(side);
    const otherSide = side.clone().negate();
    const otherBlocked = blocked(otherSide);
    const raiseAbove = useTop || (preferredBlocked && otherBlocked);
    if (raiseAbove) {
      group.current.position.copy(head).add(new THREE.Vector3(0, 1.25, 0));
    } else {
      if (preferredBlocked) side.copy(otherSide);
      group.current.position
        .copy(head)
        .addScaledVector(side, bubbleWidth * 0.5 + 0.32)
        .add(new THREE.Vector3(0, 0.12, 0));
    }
    group.current.position.y += Math.sin(clock.elapsedTime * 2.2) * 0.035;
    group.current.quaternion.copy(camera.quaternion);
  });

  return (
    <group ref={group} visible={false}>
      <RoundedBox
        args={[bubbleWidth, bubbleHeight, 0.075]}
        radius={0.09}
        smoothness={4}
        position={[0, 0, 0]}
      >
        <meshBasicMaterial color="#fffdf7" />
      </RoundedBox>
      <mesh position={[0, 0, 0.045]}>
        <planeGeometry args={[photoWidth, photoHeight]} />
        <meshBasicMaterial map={texture ?? null} toneMapped={false} />
      </mesh>
      <mesh position={[0, -bubbleHeight * 0.5 - 0.06, 0.02]}>
        <sphereGeometry args={[0.075, 16, 12]} />
        <meshBasicMaterial color="#fffdf7" />
      </mesh>
      <mesh position={[0, -bubbleHeight * 0.5 - 0.17, 0.02]}>
        <sphereGeometry args={[0.04, 12, 10]} />
        <meshBasicMaterial color="#fffdf7" />
      </mesh>
    </group>
  );
}
function FloatingMotes() {
  const group = useRef<THREE.Group>(null);
  const positions = useMemo(() => {
    const r = seeded(12);
    return Array.from(
      { length: 32 },
      () =>
        [(r() - 0.5) * 12, 1 + r() * 4, (r() - 0.5) * 25] as [
          number,
          number,
          number,
        ],
    );
  }, []);
  useFrame(({ clock }) => {
    if (group.current)
      group.current.position.y = Math.sin(clock.elapsedTime * 0.4) * 0.1;
  });
  return (
    <group ref={group}>
      {positions.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.014 + (i % 3) * 0.009, 5, 5]} />
          <meshBasicMaterial color="#fff6d7" transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}
function World({
  journey,
  photo,
  playback,
  active,
  lowQuality = false,
}: {
  journey?: Journey;
  photo?: string;
  playback: React.RefObject<Playback>;
  active: boolean;
  lowQuality?: boolean;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, lowQuality ? 1 : 1.6]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true,
      }}
      camera={{ position: [17, 24, 29], near: 0.1, far: 120 }}
      onCreated={({ gl }) => {
        gl.setClearColor("#eef0ed");
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <OrthographicCamera
        makeDefault
        position={[17, 24, 29]}
        zoom={20}
        near={0.1}
        far={120}
      />
      <color attach="background" args={["#eef0ed"]} />
      <hemisphereLight args={["#fffaed", "#9aa89c", 1.15]} />
      <directionalLight
        position={[-8, 20, 10]}
        color="#fff2db"
        intensity={2.3}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-far={65}
        shadow-normalBias={0.035}
        shadow-bias={-0.0002}
      />
      <directionalLight
        position={[10, 8, -8]}
        color="#c0d7e3"
        intensity={0.7}
      />
      <Suspense fallback={null}>
        <Terrain />
        <StaticBatch>
          <Decoration />
        </StaticBatch>
        <Traveler journey={journey} playback={playback} />
        {photo && (
          <PhotoThought
            key={photo}
            image={photo}
            journey={journey}
            playback={playback}
          />
        )}
        <FloatingMotes />
        {!lowQuality && (
          <ContactShadows
            position={[0, -1.85, 0]}
            opacity={0.3}
            scale={45}
            blur={2.6}
            far={8}
            resolution={512}
            frames={1}
          />
        )}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1.87, 0]}
          receiveShadow
        >
          <planeGeometry args={[180, 180]} />
          <shadowMaterial transparent opacity={0.1} />
        </mesh>
      </Suspense>
      <CameraRig journey={journey} playback={playback} active={active} />
      {!lowQuality && (
        <EffectComposer multisampling={2}>
          <N8AO
            aoRadius={0.55}
            distanceFalloff={0.8}
            intensity={1.15}
            quality="medium"
            halfRes
          />
          <Bloom
            intensity={0.48}
            luminanceThreshold={1.35}
            luminanceSmoothing={0.65}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.22} darkness={0.16} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

export default memo(World);
