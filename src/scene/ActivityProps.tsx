import { RoundedBox } from '@react-three/drei';

export function Bench() {
  return <group>
    {[0, 1, 2].map(i => <mesh key={i} position={[0, .38, -.13 + i * .13]} castShadow receiveShadow>
      <boxGeometry args={[1.25, .065, .11]} /><meshStandardMaterial color="#bd865b" roughness={.85} />
    </mesh>)}
    {[.59, .75].map(y => <mesh key={y} position={[0, y, -.23]} castShadow>
      <boxGeometry args={[1.25, .12, .065]} /><meshStandardMaterial color="#c99568" />
    </mesh>)}
    {[-.48, .48].map(x => <group key={x}>
      <mesh position={[x, .18, 0]} castShadow><boxGeometry args={[.065, .36, .32]} /><meshStandardMaterial color="#50655b" /></mesh>
      <mesh position={[x, .55, -.25]} castShadow><boxGeometry args={[.055, .5, .055]} /><meshStandardMaterial color="#50655b" /></mesh>
    </group>)}
  </group>;
}

/** Small open-cockpit travel miniature, with the existing avatar as its passenger. */
export function Airplane() {
  return <group>
    <mesh position={[0, .43, .05]} scale={[.32, .29, 1.05]} castShadow>
      <sphereGeometry args={[1, 20, 12]} /><meshStandardMaterial color="#f2e9d4" roughness={.55} />
    </mesh>
    <RoundedBox args={[2.35, .08, .46]} radius={.06} smoothness={2} position={[0, .43, .12]} castShadow>
      <meshStandardMaterial color="#c76e4c" />
    </RoundedBox>
    <RoundedBox args={[.85, .06, .28]} radius={.04} smoothness={2} position={[0, .55, -.78]} castShadow>
      <meshStandardMaterial color="#c76e4c" />
    </RoundedBox>
    <mesh position={[0, .72, -.78]} castShadow><boxGeometry args={[.06, .4, .3]} /><meshStandardMaterial color="#c76e4c" /></mesh>
    <mesh position={[0, .7, .3]} scale={[1, .65, 1]}>
      <sphereGeometry args={[.24, 16, 10, 0, Math.PI]} /><meshStandardMaterial color="#b8dde3" transparent opacity={.6} roughness={.18} />
    </mesh>
    {[-.23, .23].map(x => <mesh key={x} position={[x, .12, .35]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[.1, .1, .09, 12]} /><meshStandardMaterial color="#4b5656" />
    </mesh>)}
    <mesh position={[0, .43, 1.09]}><sphereGeometry args={[.13, 12, 8]} /><meshStandardMaterial color="#d39b4f" /></mesh>
  </group>;
}
