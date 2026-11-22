import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EXTRA_ACTIVITIES, isExtraAction, type ExtraAction } from '../domain/activities';
import type { Journey } from '../domain/types';
import { currentChapter, activityEnvelope } from '../domain/journey';
import type { Playback } from './Avatar';

type V3 = [number, number, number];
function Box({p, s, color = '#bc936d', r = [0,0,0]}: {p: V3; s: V3; color?: string; r?: V3}) {
  return <mesh position={p} rotation={r} castShadow receiveShadow><boxGeometry args={s}/><meshStandardMaterial color={color} roughness={.75}/></mesh>;
}
function Ball({p, radius = .12, color = '#e5bb74'}: {p: V3; radius?: number; color?: string}) {
  return <mesh position={p} castShadow><sphereGeometry args={[radius, 16, 12]}/><meshStandardMaterial color={color}/></mesh>;
}
function Ring({p, radius = .25, color = '#525f61', r = [0,0,0]}: {p: V3; radius?: number; color?: string; r?: V3}) {
  return <mesh position={p} rotation={r}><torusGeometry args={[radius, .025, 6, 24]}/><meshStandardMaterial color={color}/></mesh>;
}
function Table() {
  return <><Box p={[0,.56,.65]} s={[1.25,.09,.65]}/>{[-.5,.5].map(x => <Box key={x} p={[x,.28,.65]} s={[.08,.56,.48]} color="#71817a"/>)}</>;
}
function Moving({name, children}: {name: string; children: React.ReactNode}) {
  return <group name={name}>{children}</group>;
}
function Props({action}: {action: ExtraAction}) {
  switch(action) {
    case 'cooking': return <><Table/><mesh position={[0,.68,.65]}><cylinderGeometry args={[.23,.18,.15,20]}/><meshStandardMaterial color="#5f7d80"/></mesh><Moving name="stir"><Box p={[.12,.85,.6]} s={[.025,.4,.025]} color="#d1ad74" r={[.3,0,-.3]}/></Moving>{[0,1,2].map(i=><Moving name={`steam${i}`} key={i}><Ball p={[(i-1)*.12,1.05,.65]} radius={.045} color="#f2eee3"/></Moving>)}</>;
    case 'painting': return <><Box p={[0,.77,.65]} s={[.75,.65,.07]} color="#f6e6c8"/>{[-.3,.3].map(x=><Box key={x} p={[x,.45,.67]} s={[.055,.9,.055]} r={[.1,0,-x*.2]}/>)}{['#c6858b','#739a91','#e5bf75'].map((color,i)=><Ball key={i} p={[-.18+i*.18,.8+Math.sin(i)*.12,.71]} radius={.1} color={color}/>)}<Moving name="brush"><Box p={[.25,.83,.72]} s={[.025,.34,.025]} color="#66594f" r={[0,0,-.6]}/></Moving></>;
    case 'guitar': return <group rotation={[0,0,-.35]} position={[0,.62,.29]}><mesh scale={[.2,.25,.07]}><sphereGeometry args={[1,20,12]}/><meshStandardMaterial color="#b87e45"/></mesh><Ball p={[0,.08,.04]} radius={.07} color="#53473e"/><Box p={[0,.38,0]} s={[.06,.5,.06]} color="#725a45"/>{[-.015,0,.015].map(x=><Box key={x} p={[x,.2,.075]} s={[.003,.6,.003]} color="#eee0bf"/>)}</group>;
    case 'piano': return <><Table/><Box p={[0,.66,.63]} s={[1.2,.1,.4]} color="#3f5558"/>{Array.from({length:12},(_,i)=><Box key={i} p={[-.52+i*.095,.73,.65]} s={[.085,.025,.27]} color="#f4ecd7"/>)}<Box p={[0,.91,.84]} s={[1.2,.4,.08]} color="#496368"/></>;
    case 'cycling': return <><Moving name="wheel0"><Ring p={[0,0,0]} radius={.34}/><Box p={[0,0,0]} s={[.6,.015,.015]} color="#d7d0b9"/></Moving><Moving name="wheel1"><Ring p={[0,0,0]} radius={.34}/><Box p={[0,0,0]} s={[.6,.015,.015]} color="#d7d0b9"/></Moving><Box p={[0,.55,0]} s={[.06,.06,.9]} color="#8aa9a4"/><Box p={[0,.56,.4]} s={[.06,.55,.06]} color="#8aa9a4" r={[.25,0,0]}/><Box p={[0,.78,-.2]} s={[.28,.07,.22]} color="#594d44"/><Box p={[0,.86,.5]} s={[.55,.04,.05]} color="#6d7976"/></>;
    case 'basketball': return <><Moving name="basketball"><Ball p={[.38,.4,.38]} radius={.17} color="#d58a4e"/><Ring p={[.38,.4,.38]} radius={.172} color="#6f513c"/></Moving><Box p={[.6,.9,1.1]} s={[.07,1.8,.07]} color="#7e9190"/><Box p={[.6,1.7,1.05]} s={[.9,.65,.06]} color="#e5e3cf"/><Ring p={[.6,1.45,.8]} radius={.24} color="#c97a51" r={[Math.PI/2,0,0]}/></>;
    case 'soccer': return <><Moving name="soccerball"><Ball p={[0,0,0]} radius={.17} color="#eee9d8"/><Box p={[0,0,.16]} s={[.1,.1,.025]} color="#53655e"/></Moving>{[-.65,.65].map(x=><Box key={x} p={[x,.47,1.2]} s={[.06,.94,.06]} color="#e2e5d5"/>)}<Box p={[0,.94,1.2]} s={[1.36,.06,.06]} color="#e2e5d5"/>{[-.4,-.2,0,.2,.4].map(x=><Box key={x} p={[x,.45,1.23]} s={[.012,.85,.012]} color="#b1c3b6"/>)}</>;
    case 'tennis': return <><Moving name="racket"><Ring p={[.35,.94,.3]} radius={.2} color="#c58764"/><Box p={[.35,.63,.3]} s={[.04,.28,.04]} color="#7d6753"/>{[-.1,0,.1].map(x=><Box key={x} p={[.35+x,.94,.3]} s={[.008,.32,.008]} color="#dfdbc0"/>)}</Moving><Moving name="tennisball"><Ball p={[0,0,0]} radius={.075} color="#cddd82"/></Moving></>;
    case 'swimming': return <><Box p={[0,.05,0]} s={[1.7,.12,2.7]} color="#85bbc5"/>{[-.88,.88].map(x=><Box key={x} p={[x,.12,0]} s={[.1,.18,2.9]} color="#e6dfcd"/>)}{[0,1,2].map(i=><Moving key={i} name={`ripple${i}`}><Ring p={[0,.13,.45]} radius={.3+i*.2} color="#d3eff0" r={[-Math.PI/2,0,0]}/></Moving>)}</>;
    case 'gardening': return <><Box p={[0,.15,.65]} s={[1.2,.3,.7]} color="#94735c"/><Box p={[0,.32,.65]} s={[1.08,.04,.58]} color="#625c46"/>{[-.35,0,.35].map((x,i)=><Moving name={`plant${i}`} key={i}><Box p={[x,.48,.65]} s={[.025,.35,.025]} color="#69875d"/><mesh position={[x+.07,.56,.65]} scale={[.13,.055,.06]}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color="#92b478"/></mesh></Moving>)}<Moving name="watering"><Box p={[.4,.71,.45]} s={[.23,.2,.18]} color="#86a9ae"/><Box p={[.22,.67,.46]} s={[.25,.04,.04]} color="#86a9ae" r={[0,0,.3]}/></Moving></>;
    case 'photography': return <><Box p={[0,.91,.39]} s={[.35,.22,.15]} color="#4e6266"/><mesh position={[0,.91,.51]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.085,.085,.15,20]}/><meshStandardMaterial color="#a1bfc6" metalness={.5}/></mesh><Moving name="flash"><Ball p={[.12,1.02,.5]} radius={.055} color="#fff4bd"/></Moving></>;
    case 'dogwalking': return <><Moving name="dog"><Box p={[0,.25,0]} s={[.28,.26,.5]} color="#b4906d"/><Ball p={[0,.43,.25]} radius={.17} color="#c5a37f"/>{[-.13,.13].map(x=><Box key={x} p={[x,.47,.25]} s={[.09,.19,.1]} color="#84664d"/>)}{[-.1,.1].flatMap(x=>[-.16,.16].map(z=><Box key={`${x}-${z}`} p={[x,.09,z]} s={[.065,.2,.065]} color="#ad8863"/>))}<Box p={[0,.4,-.3]} s={[.07,.3,.07]} color="#b4906d" r={[-.7,0,0]}/></Moving><Box p={[.37,.51,.32]} s={[.025,.025,.75]} color="#8d7f65" r={[0,-.55,.5]}/></>;
    case 'meditation': return <><mesh position={[0,.07,0]}><cylinderGeometry args={[.5,.52,.14,32]}/><meshStandardMaterial color="#b299ae"/></mesh><Moving name="breath"><Ring p={[0,.45,0]} radius={.7} color="#b4c9b1" r={[Math.PI/2,0,0]}/></Moving></>;
    case 'presenting': return <><Box p={[0,.58,.56]} s={[.6,1.16,.35]} color="#9caa91"/><Box p={[-.75,1.1,.85]} s={[.9,.65,.05]} color="#ebead5"/>{[0,1,2].map(i=><Box key={i} p={[-1+i*.22,.9+i*.05,.89]} s={[.12,.15+i*.1,.025]} color={['#8faaa1','#c5a780','#9e93af'][i]}/>)}<Moving name="pointer"><Box p={[.35,1,.5]} s={[.025,.5,.025]} r={[0,0,-.65]} color="#6c6b60"/></Moving></>;
    case 'volunteering': return <><Table/><Box p={[.45,.76,.7]} s={[.4,.34,.38]} color="#c4a17a"/>{[-.4,-.2,0].map(x=><Ball key={x} p={[x,.69,.7]} radius={.09} color="#b5b877"/>)}<Moving name="donation"><Box p={[0,.7,.35]} s={[.32,.23,.28]} color="#d7b887"/><Box p={[0,.7,.5]} s={[.06,.23,.01]} color="#e8d4a7"/></Moving></>;
  }
}

export function ExtraActivityProps({journey, playback}: {journey?: Journey; playback: React.RefObject<Playback>}) {
  const root = useRef<THREE.Group>(null);
  // Only fifteen modest prop sets, built once. No React state updates in the render loop.
  const groups = useRef<(THREE.Group | null)[]>([]);
  const animated = useRef<Map<string, THREE.Object3D>[]>([]);
  const registry = useMemo(() => EXTRA_ACTIVITIES.map(a => a.action), []);
  useFrame(() => {
    const time = playback.current.time;
    const chapter = journey ? currentChapter(journey, time) : undefined;
    const active = chapter && isExtraAction(chapter.action) && time >= chapter.arrival && time < chapter.end ? chapter.action : undefined;
    const envelope = activityEnvelope(chapter, time);
    groups.current.forEach((group, index) => {
      if (!group) return;
      group.visible = registry[index] === active && envelope > .001;
      if (!group.visible) return;
      group.scale.setScalar(envelope);
      const objects = animated.current[index];
      const move = (name: string, fn: (object: THREE.Object3D) => void) => { const object = objects?.get(name); if (object) fn(object); };
      move('stir', o => { o.rotation.y = time*3; });
      for(let i=0;i<3;i++) {
        move(`steam${i}`, o => { o.position.y = ((time*.3+i*.17)% .5); o.scale.setScalar(1- o.position.y); });
        move(`plant${i}`, o => o.scale.y = .6 + envelope*.4);
        move(`ripple${i}`, o => o.scale.setScalar(1 + Math.sin(time*3+i)*.13));
      }
      move('brush', o => {o.position.y = Math.sin(time*2)*.15; o.position.x = Math.cos(time*2)*.1;});
      for(let i=0;i<2;i++) move(`wheel${i}`, o => {o.position.set(0,.36,i ? .6 : -.6);o.rotation.set(0,Math.PI/2,0);o.rotateZ(time*5);});
      move('basketball', o => o.position.y = Math.abs(Math.sin(time*5))*.38 - .18);
      move('soccerball', o => {o.position.set(.15,.2,.35+Math.abs(Math.sin(time*2.5))*.55);o.rotation.x=time*3;});
      move('racket', o => {o.rotation.x = Math.sin(time*5)*.5;});
      move('tennisball', o => o.position.set(.3, .7+Math.abs(Math.sin(time*5))*.5, .6+Math.sin(time*5)*.45));
      move('watering', o => o.rotation.z = -.2+Math.sin(time*2)*.15);
      move('flash', o => {o.visible = Math.sin(time*5)>.9;});
      move('dog', o => {o.position.set(.65,Math.abs(Math.sin(time*5))*.03,.55+Math.sin(time*2)*.1);o.rotation.y=.2;});
      move('breath', o => {o.scale.setScalar(1+Math.sin(time*2)*.12);o.position.y=Math.sin(time*2)*.04;});
      move('pointer', o => o.rotation.z = Math.sin(time*2)*.18);
      move('donation', o => {o.position.set(.3*Math.sin(time*2),Math.sin(time*2)*.1, .2+Math.sin(time*2)*.15);});
    });
  });
  return <group ref={root}>{registry.map((action,index)=><group key={action} visible={false} ref={group=>{
    groups.current[index]=group;
    if(group) {const objects=new Map<string,THREE.Object3D>();group.traverse(o=>{if(o.name)objects.set(o.name,o);});animated.current[index]=objects;}
  }}><Props action={action}/></group>)}</group>;
}
