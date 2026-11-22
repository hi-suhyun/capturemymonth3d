import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { Journey, SceneAction } from "../domain/types";
import { pointAt, tangentAt } from "./landscape";
import { Desk, Dumbbell, YogaMat } from "./Props";
export interface Playback {
  time: number;
  playing: boolean;
  speed: number;
  preview: boolean;
  overview: boolean;
}
export function journeyPose(journey: Journey | undefined, time: number) {
  if (!journey?.chapters.length)
    return {
      position: 0.015,
      walking: false,
      action: "looking",
      chapter: undefined,
    };
  const index = journey.chapters.findIndex(
    (c) => time >= c.start && time < c.end,
  );
  if (time < 5)
    return {
      position: 0.015,
      walking: time > 3,
      action: "looking",
      chapter: undefined,
    };
  if (index < 0) {
    const last = journey.chapters.at(-1)!;
    const u = THREE.MathUtils.clamp((time - last.end) / 4, 0, 1);
    return {
      position: THREE.MathUtils.lerp(last.pathPosition, 0.99, u),
      walking: u < 1,
      action: "celebrating",
      chapter: last,
    };
  }
  const chapter = journey.chapters[index];
  const prev = index ? journey.chapters[index - 1].pathPosition : 0.015;
  const u = THREE.MathUtils.clamp(
    (time - chapter.start) / (chapter.arrival - chapter.start),
    0,
    1,
  );
  const smooth = u * u * (3 - 2 * u);
  return {
    position: THREE.MathUtils.lerp(prev, chapter.pathPosition, smooth),
    walking: u < 1,
    action: chapter.action,
    chapter,
  };
}
export function LittlePerson({
  walking = false,
  action = "looking",
  time = 0,
  color = "#d9994b",
}: {
  walking?: boolean;
  action?: SceneAction;
  time?: number;
  color?: string;
}) {
  const stride = walking ? Math.sin(time * 9) * 0.55 : 0;
  const work = ["reading", "writing", "typing"].includes(action) && !walking;
  return (
    <group
      position={[0, walking ? Math.abs(Math.sin(time * 9)) * 0.025 : 0, 0]}
    >
      <group position={[0, 0.62, 0]} rotation={[work ? -0.08 : 0, 0, 0]}>
        <RoundedBox
          args={[0.36, 0.43, 0.26]}
          radius={0.11}
          smoothness={3}
          castShadow
        >
          <meshStandardMaterial color={color} roughness={0.8} />
        </RoundedBox>
        <mesh position={[0, 0.27, 0]} castShadow>
          <sphereGeometry args={[0.19, 24, 16]} />
          <meshStandardMaterial color="#deb99a" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.38, -0.015]} scale={[1, 0.75, 1]} castShadow>
          <sphereGeometry args={[0.203, 24, 16]} />
          <meshStandardMaterial color="#e9e5cd" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.5, -0.015]} castShadow>
          <sphereGeometry args={[0.064, 12, 10]} />
          <meshStandardMaterial color="#e8e5d6" />
        </mesh>
        <mesh position={[0, 0.34, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.19, 0.033, 8, 24]} />
          <meshStandardMaterial color="#d5d3bd" />
        </mesh>
        <mesh position={[0, 0.17, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.13, 0.055, 8, 16]} />
          <meshStandardMaterial color="#a35f49" />
        </mesh>
        <RoundedBox
          args={[0.07, 0.23, 0.05]}
          position={[-0.09, 0.04, 0.16]}
          radius={0.02}
          smoothness={2}
        >
          <meshStandardMaterial color="#a35f49" />
        </RoundedBox>
        {[-1, 1].map((s) => (
          <group
            key={s}
            position={[s * 0.22, 0.13, 0]}
            rotation={[
              work
                ? -0.9 + Math.sin(time * 4 + s) * 0.035
                : action === "celebrating" && !walking
                  ? -2.4
                  : action === "waving" && s === 1 && !walking
                    ? -2 + Math.sin(time * 5) * 0.2
                    : stride * s,
              0,
              action === "stretching" && !walking ? s * 1.2 : s * 0.08,
            ]}
          >
            <mesh position={[0, -0.12, 0]} castShadow>
              <capsuleGeometry args={[0.066, 0.16, 5, 10]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[0, -0.25, 0]} castShadow>
              <sphereGeometry args={[0.065, 12, 8]} />
              <meshStandardMaterial color="#d8ac8b" />
            </mesh>
          </group>
        ))}
        <RoundedBox
          args={[0.27, 0.3, 0.13]}
          radius={0.07}
          smoothness={3}
          position={[0, -0.01, -0.2]}
          castShadow
        >
          <meshStandardMaterial color="#9d7353" roughness={0.95} />
        </RoundedBox>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.065, 0.28, 0.174]}>
            <sphereGeometry args={[0.016, 8, 6]} />
            <meshStandardMaterial color="#3f423b" />
          </mesh>
        ))}
      </group>
      {[-1, 1].map((s) => (
        <group
          key={s}
          position={[s * 0.1, 0.42, 0]}
          rotation={[-stride * s, 0, 0]}
        >
          <mesh position={[0, -0.13, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.18, 5, 10]} />
            <meshStandardMaterial color="#42584e" roughness={0.9} />
          </mesh>
          <RoundedBox
            args={[0.16, 0.1, 0.23]}
            position={[0, -0.3, 0.035]}
            radius={0.045}
            smoothness={2}
            castShadow
          >
            <meshStandardMaterial color="#664f41" />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}
export function Traveler({
  journey,
  playback,
}: {
  journey?: Journey;
  playback: React.RefObject<Playback>;
}) {
  const root = useRef<THREE.Group>(null),
    body = useRef<THREE.Group>(null),
    desk = useRef<THREE.Group>(null),
    arms = useRef<THREE.Group[]>([]),
    legs = useRef<THREE.Group[]>([]),
    dumbbells = useRef<THREE.Group[]>([]),
    yogaMat = useRef<THREE.Group>(null);
  const smoothAngle = useRef(0);
  useFrame(() => {
    const time = playback.current.time;
    const pose = journeyPose(journey, time);
    const p = pointAt(pose.position),
      dir = tangentAt(pose.position);
    if (root.current) {
      root.current.position.copy(p);
      const angle = Math.atan2(dir.x, dir.z);
      smoothAngle.current +=
        Math.atan2(
          Math.sin(angle - smoothAngle.current),
          Math.cos(angle - smoothAngle.current),
        ) * 0.12;
      root.current.rotation.y = smoothAngle.current;
    }
    const jogging = pose.action === "jogging";
    const lifting = pose.action === "lifting" && !pose.walking;
    const yoga = pose.action === "yoga" && !pose.walking;
    const stride =
      pose.walking || jogging
        ? Math.sin(time * (jogging ? 9 : 11)) * (jogging ? 0.66 : 0.6)
        : 0;
    const work =
      ["reading", "writing", "typing"].includes(pose.action) &&
      !pose.walking &&
      time >= 5;
    if (body.current) {
      body.current.position.y = pose.walking || jogging
        ? Math.abs(Math.sin(time * (jogging ? 9 : 11))) *
          (jogging ? 0.045 : 0.03)
        : Math.sin(time * 2) * 0.008;
      body.current.rotation.x = work ? -0.08 : 0;
      body.current.rotation.z = yoga ? Math.sin(time * 1.5) * 0.025 : 0;
    }
    const lift = 0.9 + Math.sin(time * 3.2) * 0.32;
    arms.current.forEach((a, i) => {
      if (!a) return;
      if (work) {
        a.rotation.x = -0.9 + Math.sin(time * 6 + i) * 0.04;
        a.rotation.z = 0;
      } else if (lifting) {
        a.rotation.x = -0.15;
        a.rotation.z = (i ? 1 : -1) * lift;
      } else if (yoga) {
        a.rotation.x = -0.12;
        a.rotation.z =
          (i ? 1 : -1) * (2.55 + Math.sin(time * 1.4) * 0.035);
      } else {
        a.rotation.x =
          pose.action === "celebrating" && !pose.walking
            ? -2.4
            : pose.action === "waving" && !pose.walking && i === 1
              ? -2.1 + Math.sin(time * 6) * 0.25
              : stride * (i ? 1 : -1);
        a.rotation.z =
          pose.action === "stretching" && !pose.walking
            ? (i ? 1 : -1) * 1.2
            : 0;
      }
    });
    dumbbells.current.forEach((weight) => {
      if (weight) weight.visible = lifting;
    });
    legs.current.forEach((l, i) => {
      if (yoga) {
        l.rotation.x = i === 1 ? -0.08 : 0;
        l.rotation.z =
          i === 1 ? 0.5 + Math.sin(time * 1.8) * 0.035 : 0;
      } else {
        l.rotation.x = stride * (i ? -1 : 1);
        l.rotation.z = 0;
      }
    });
    if (yogaMat.current) yogaMat.current.visible = yoga;
    if (desk.current) desk.current.visible = work;
  });
  return (
    <group ref={root} scale={0.92}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <circleGeometry args={[0.28, 24]} />
        <meshBasicMaterial
          color="#8c7a5d"
          transparent
          opacity={0.13}
          depthWrite={false}
        />
      </mesh>
      <group ref={body}>
        <RoundedBox
          args={[0.37, 0.44, 0.28]}
          radius={0.11}
          smoothness={4}
          position={[0, 0.66, 0]}
          castShadow
        >
          <meshStandardMaterial color="#d99a4f" roughness={0.78} />
        </RoundedBox>
        <mesh position={[0, 0.96, 0]} castShadow>
          <sphereGeometry args={[0.19, 24, 16]} />
          <meshStandardMaterial color="#deb99a" roughness={0.84} />
        </mesh>
        <mesh position={[0, 1.065, -0.012]} scale={[1, 0.78, 1]} castShadow>
          <sphereGeometry args={[0.202, 24, 16]} />
          <meshStandardMaterial color="#e8e6d4" roughness={0.96} />
        </mesh>
        <mesh position={[0, 1.19, -0.01]} castShadow>
          <sphereGeometry args={[0.066, 14, 10]} />
          <meshStandardMaterial color="#efece0" />
        </mesh>
        <mesh position={[0, 1.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.185, 0.033, 8, 24]} />
          <meshStandardMaterial color="#d4d3bd" />
        </mesh>
        <mesh position={[0, 0.85, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.135, 0.055, 8, 20]} />
          <meshStandardMaterial color="#a45e45" />
        </mesh>
        <RoundedBox
          args={[0.075, 0.24, 0.045]}
          position={[-0.08, 0.73, 0.17]}
          radius={0.02}
          smoothness={2}
        >
          <meshStandardMaterial color="#a45e45" />
        </RoundedBox>
        {[-1, 1].map((s, i) => (
          <group
            key={s}
            ref={(el) => {
              if (el) arms.current[i] = el;
            }}
            position={[s * 0.23, 0.79, 0]}
          >
            <mesh position={[0, -0.13, 0]} castShadow>
              <capsuleGeometry args={[0.069, 0.17, 5, 12]} />
              <meshStandardMaterial color="#d99a4f" />
            </mesh>
            <mesh position={[0, -0.27, 0]} castShadow>
              <sphereGeometry args={[0.067, 12, 10]} />
              <meshStandardMaterial color="#dcb493" />
            </mesh>
            <group
              ref={(el) => {
                if (el) dumbbells.current[i] = el;
              }}
              position={[0, -0.34, 0.07]}
              visible={false}
            >
              <Dumbbell />
            </group>
          </group>
        ))}
        <RoundedBox
          args={[0.28, 0.32, 0.14]}
          position={[0, 0.68, -0.21]}
          radius={0.06}
          smoothness={3}
          castShadow
        >
          <meshStandardMaterial color="#916b4f" />
        </RoundedBox>
        <RoundedBox
          args={[0.19, 0.11, 0.05]}
          position={[0, 0.6, -0.29]}
          radius={0.03}
          smoothness={2}
        >
          <meshStandardMaterial color="#ac8561" />
        </RoundedBox>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.063, 0.96, 0.177]}>
            <sphereGeometry args={[0.014, 10, 8]} />
            <meshStandardMaterial color="#44463d" />
          </mesh>
        ))}
      </group>
      {[-1, 1].map((s, i) => (
        <group
          key={s}
          ref={(el) => {
            if (el) legs.current[i] = el;
          }}
          position={[s * 0.105, 0.45, 0]}
        >
          <mesh position={[0, -0.14, 0]} castShadow>
            <capsuleGeometry args={[0.078, 0.19, 5, 12]} />
            <meshStandardMaterial color="#435a50" />
          </mesh>
          <RoundedBox
            args={[0.17, 0.11, 0.24]}
            radius={0.045}
            smoothness={3}
            position={[0, -0.32, 0.04]}
            castShadow
          >
            <meshStandardMaterial color="#665140" />
          </RoundedBox>
        </group>
      ))}
      <group ref={yogaMat} visible={false}>
        <YogaMat position={[0, 0, 0.04]} />
      </group>
      <group ref={desk} visible={false}>
        <Desk position={[0, 0, 0.58]} rotation={Math.PI} laptop />
      </group>
    </group>
  );
}
