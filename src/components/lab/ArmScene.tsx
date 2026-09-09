"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Line, OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import type { KinematicsResult } from "@/lib/biomechanics";
import { tensionColorHex, tensionEmissive } from "@/lib/tension";

const BRASS = "#e0a83e";
const TEAL = "#5ec8c2";
const VERMILION = "#e2654b";
const LINE = "#3a4854";
const INK_MUTED = "#8b98a5";

function Bone({
  from,
  to,
  radius,
  color,
  emissive,
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius: number;
  color: string;
  emissive?: THREE.Color;
}) {
  const { position, quaternion, length } = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const dir = new THREE.Vector3().subVectors(end, start);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    );
    return { position: mid, quaternion: quat, length: len };
  }, [from, to]);

  return (
    <mesh position={position} quaternion={quaternion} castShadow receiveShadow>
      <capsuleGeometry args={[radius, Math.max(length - radius * 2, 0.001), 6, 12]} />
      <meshStandardMaterial
        color={color}
        roughness={0.4}
        metalness={0.15}
        emissive={emissive ?? "#000000"}
        emissiveIntensity={emissive ? 1 : 0}
      />
    </mesh>
  );
}

function Joint({ pos, color = "#eceff2" }: { pos: [number, number, number]; color?: string }) {
  return (
    <mesh position={pos} castShadow>
      <sphereGeometry args={[0.028, 20, 20]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
    </mesh>
  );
}

/** Protractor arc drawn behind the arm, ticked every 30 degrees, from 0 to 180. */
function ProtractorArc({ radius = 0.65 }: { radius?: number }) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let deg = 0; deg <= 180; deg += 2) {
      const rad = (deg * Math.PI) / 180;
      pts.push([radius * Math.sin(rad), -radius * Math.cos(rad), -0.02]);
    }
    return pts;
  }, [radius]);

  const ticks = useMemo(() => {
    const arr: { pos: [number, number, number]; label: string }[] = [];
    for (let deg = 0; deg <= 180; deg += 30) {
      const rad = (deg * Math.PI) / 180;
      arr.push({
        pos: [(radius + 0.09) * Math.sin(rad), -(radius + 0.09) * Math.cos(rad), -0.02],
        label: `${deg}°`,
      });
    }
    return arr;
  }, [radius]);

  return (
    <group>
      <Line points={points} color={LINE} lineWidth={1.5} />
      {ticks.map((t) => (
        <Text
          key={t.label}
          position={t.pos}
          fontSize={0.045}
          color={INK_MUTED}
          anchorX="center"
          anchorY="middle"
        >
          {t.label}
        </Text>
      ))}
    </group>
  );
}

function Rig({
  kinematics,
  hasLoad,
  tensionFrac = 0,
}: {
  kinematics: KinematicsResult;
  hasLoad: boolean;
  tensionFrac?: number;
}) {
  const { shoulder, elbow, wrist, upperArmComPos, forearmComPos } = kinematics;
  const s3: [number, number, number] = [shoulder.x, shoulder.y, 0];
  const e3: [number, number, number] = [elbow.x, elbow.y, 0];
  const w3: [number, number, number] = [wrist.x, wrist.y, 0];

  return (
    <group>
      <ProtractorArc />

      {/* Torso block anchoring the shoulder */}
      <mesh position={[0, 0.22, -0.06]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 0.5, 0.2]} />
        <meshStandardMaterial color="#232f39" roughness={0.6} />
      </mesh>

      <Bone
        from={s3}
        to={e3}
        radius={0.045}
        color={tensionColorHex(tensionFrac)}
        emissive={tensionEmissive(tensionFrac)}
      />
      <Bone from={e3} to={w3} radius={0.036} color={tensionColorHex(tensionFrac * 0.5)} />

      <Joint pos={s3} color={BRASS} />
      <Joint pos={e3} />
      <Joint pos={w3} />

      {hasLoad && (
        <mesh position={[w3[0], w3[1] - 0.09, w3[2]]} castShadow>
          <boxGeometry args={[0.09, 0.09, 0.09]} />
          <meshStandardMaterial color={VERMILION} roughness={0.5} />
        </mesh>
      )}

      {/* Center-of-mass markers */}
      <mesh position={[upperArmComPos.x, upperArmComPos.y, 0.02]}>
        <sphereGeometry args={[0.015, 12, 12]} />
        <meshStandardMaterial color={TEAL} emissive={TEAL} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[forearmComPos.x, forearmComPos.y, 0.02]}>
        <sphereGeometry args={[0.015, 12, 12]} />
        <meshStandardMaterial color={TEAL} emissive={TEAL} emissiveIntensity={0.5} />
      </mesh>

      {/* Gravity reference line */}
      <Line
        points={[
          [0, 0.05, 0],
          [0, -0.85, 0],
        ]}
        color={LINE}
        dashed
        dashSize={0.02}
        gapSize={0.015}
        lineWidth={1}
      />
    </group>
  );
}

export default function ArmScene({
  kinematics,
  hasLoad,
  tensionFrac = 0,
}: {
  kinematics: KinematicsResult;
  hasLoad: boolean;
  tensionFrac?: number;
}) {
  const controls = useRef(null);
  return (
    <div className="h-full w-full">
      <Canvas
        shadows
        dpr={[1, 1.8]}
        camera={{ position: [0.9, 0.15, 1.3], fov: 40 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#10161b"]} />
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[1.5, 2, 1.5]}
          intensity={1.1}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-1.5, 0.5, -1]} intensity={0.25} color="#5ec8c2" />
        <Suspense fallback={null}>
          <Rig kinematics={kinematics} hasLoad={hasLoad} tensionFrac={tensionFrac} />
        </Suspense>
        <OrbitControls
          ref={controls}
          enablePan={false}
          minDistance={0.9}
          maxDistance={3}
          target={[0.15, -0.25, 0]}
        />
      </Canvas>
    </div>
  );
}
