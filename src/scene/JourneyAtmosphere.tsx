import { memo, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Journey } from '../domain/types';
import { CATEGORY_META } from '../domain/types';
import { activityEnvelope, currentChapter } from '../domain/journey';
import type { Playback } from './Avatar';
import { pointAt, tangentAt, groundHeight, seeded } from './landscape';

const DAY = new THREE.Color('#eef0ed');
const SUNSET = new THREE.Color('#edb1a0');
const GOLDEN_SUN = new THREE.Color('#ffb571');
const EVENING_FILL = new THREE.Color('#bcacce');
const DAY_FILL = new THREE.Color('#c0d7e3');
const NIGHT = new THREE.Color('#17233e');
const SUN = new THREE.Color('#fff2db');
const MOON = new THREE.Color('#a7c9ff');

export function JourneyAtmosphere({journey, playback}: {journey?: Journey; playback: React.RefObject<Playback>}) {
  const ambient = useRef<THREE.HemisphereLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const stars = useRef<THREE.Group>(null);
  const starMeshes = useRef<THREE.Mesh[]>([]);
  const eveningEvents = useMemo(() => {
    const ids = new Set<string>();
    if (!journey) return ids;
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: journey.month.timezone, hour: 'numeric', hourCycle: 'h23',
    });
    for (const event of journey.month.events) {
      if (event.allDay || event.hidden) continue;
      const hour = Number(formatter.format(new Date(event.start)));
      if (hour >= 16 && hour < 21) ids.add(event.id);
    }
    return ids;
  }, [journey]);
  const positions = useMemo(() => {
    const random = seeded(761);
    return Array.from({length: 64}, () => new THREE.Vector3((random() - .5) * 14, 2.3 + random() * 5, (random() - .5) * 12));
  }, []);
  useFrame(({scene}) => {
    const time = playback.current.time;
    const chapter = journey ? currentChapter(journey, time) : undefined;
    const envelope = activityEnvelope(chapter, time);
    const night = chapter?.action === 'stargazing' ? envelope : 0;
    const sunset = chapter && chapter.action !== 'stargazing' && eveningEvents.has(chapter.eventId) ? envelope : 0;
    if (scene.background instanceof THREE.Color) scene.background.copy(DAY).lerp(SUNSET, sunset).lerp(NIGHT, night);
    if (ambient.current) ambient.current.intensity = THREE.MathUtils.lerp(1.15 - sunset * .25, .32, night);
    if (key.current) {
      key.current.intensity = THREE.MathUtils.lerp(2.3 - sunset * .65, .4, night);
      key.current.color.copy(SUN).lerp(GOLDEN_SUN, sunset).lerp(MOON, night);
      key.current.position.y = 20 - sunset * 11;
    }
    if (fill.current) {
      fill.current.intensity = THREE.MathUtils.lerp(.7 - sunset * .12, .35, night);
      fill.current.color.copy(DAY_FILL).lerp(EVENING_FILL, sunset);
    }
    if (stars.current) {
      stars.current.visible = night > .001;
      if (chapter) stars.current.position.copy(pointAt(chapter.pathPosition));
    }
    starMeshes.current.forEach((star, i) => {
      const twinkle = .6 + .4 * Math.sin(time * (1.4 + i % 3 * .4) + i * 2.4);
      star.scale.setScalar((.65 + twinkle * .65) * night);
      (star.material as THREE.MeshBasicMaterial).opacity = night * (.5 + .5 * twinkle);
    });
  });
  return <>
    <hemisphereLight ref={ambient} args={['#fffaed', '#9aa89c', 1.15]} />
    <directionalLight ref={key} position={[-8, 20, 10]} color="#fff2db" intensity={2.3} castShadow
      shadow-mapSize={[2048, 2048]} shadow-camera-left={-20} shadow-camera-right={20}
      shadow-camera-top={20} shadow-camera-bottom={-20} shadow-camera-far={65}
      shadow-normalBias={.035} shadow-bias={-.0002} />
    <directionalLight ref={fill} position={[10, 8, -8]} color="#c0d7e3" intensity={.7} />
    <group ref={stars} visible={false}>
      {positions.map((p, i) => <mesh key={i} position={p} ref={el => { if (el) starMeshes.current[i] = el; }}>
        <octahedronGeometry args={[i % 7 === 0 ? .09 : .035, 0]} />
        <meshBasicMaterial color={i % 4 === 0 ? '#a7d5ff' : '#fff1c5'} transparent depthWrite={false} toneMapped={false} />
      </mesh>)}
    </group>
  </>;
}

/** Each original event leaves one colored record, synchronized with the progress counters. */
export const RecordedMilestones = memo(function RecordedMilestones({journey, playback}: {journey?: Journey; playback: React.RefObject<Playback>}) {
  const refs = useRef<THREE.Group[]>([]);
  const records = useMemo(() => {
    const byId = new Map(journey?.month.events.map(event => [event.id, event]));
    return journey?.chapters.flatMap((chapter, index) => {
      const event = byId.get(chapter.eventId);
      if (!event || event.hidden) return [];
      const position = pointAt(chapter.pathPosition);
      const tangent = tangentAt(chapter.pathPosition);
      const side = index % 2 ? -1 : 1;
      position.add(new THREE.Vector3(tangent.z, 0, -tangent.x).multiplyScalar(side * .79));
      position.y = groundHeight(position.x, position.z) + .07;
      return [{chapter, position, color: CATEGORY_META[event.category].color, special: event.highlight}];
    }) ?? [];
  }, [journey]);
  useFrame(() => {
    records.forEach((record, i) => {
      const group = refs.current[i];
      if (!group) return;
      const elapsed = playback.current.time - record.chapter.end;
      group.visible = elapsed >= 0;
      const u = THREE.MathUtils.smoothstep(elapsed, 0, .45);
      group.scale.setScalar(Math.max(.001, u));
    });
  });
  return <group>
    {records.map((record, i) => <group key={record.chapter.eventId} position={record.position} visible={false} ref={el => { if (el) refs.current[i] = el; }}>
      <mesh position={[0, .045, 0]} receiveShadow><cylinderGeometry args={[.17, .19, .09, 12]} /><meshStandardMaterial color="#eee2cb" /></mesh>
      <mesh position={[0, record.special ? .26 : .17, 0]} castShadow>
        <octahedronGeometry args={[record.special ? .18 : .11, 0]} />
        <meshStandardMaterial color={record.color} emissive={record.color} emissiveIntensity={.3} roughness={.4} />
      </mesh>
    </group>)}
  </group>;
});
