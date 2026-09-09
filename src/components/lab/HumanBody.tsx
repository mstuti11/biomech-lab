"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { tensionColorHex, tensionEmissive } from "@/lib/tension";

const SKIN = "#d9a679";
const SHIRT = "#2c3a44";
const JOINT_AXIS = "#3ddc97";

function Bone({
  from,
  to,
  radius,
  color = SKIN,
  emissive,
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius: number;
  color?: string;
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
      <capsuleGeometry args={[radius, Math.max(length - radius * 2, 0.001), 6, 14]} />
      <meshStandardMaterial
        color={color}
        roughness={0.55}
        metalness={0.05}
        emissive={emissive ?? "#000000"}
        emissiveIntensity={emissive ? 1 : 0}
      />
    </mesh>
  );
}

/**
 * A stylized, clearly-human torso + head anchored so the shoulder joint sits
 * at the local origin (0,0,0) — every experiment scene positions this once
 * and then only has to reason about the shoulder-relative arm geometry.
 */
export default function HumanBody({
  shoulderAngleDeg,
  armLengthM,
  forearmLengthM,
  elbowBendDeg = 0,
  loadAtHand,
  tensionFrac = 0,
}: {
  shoulderAngleDeg: number;
  armLengthM: number;
  forearmLengthM?: number;
  /** Extra bend applied at the elbow, in degrees, purely for visual realism (0 = straight). */
  elbowBendDeg?: number;
  loadAtHand?: boolean;
  /** 0-1: how hard the working muscle is straining. Tints the shoulder/upper-arm toward red and adds a working-hard glow past ~55%. */
  tensionFrac?: number;
}) {
  const rad = (shoulderAngleDeg * Math.PI) / 180;
  const shoulder: [number, number, number] = [0, 0, 0];
  const hasElbow = !!forearmLengthM;
  const upperLen = hasElbow ? armLengthM : armLengthM;

  const elbow: [number, number, number] = [
    upperLen * Math.sin(rad),
    -upperLen * Math.cos(rad),
    0,
  ];

  const forearmAngleRad = ((shoulderAngleDeg - elbowBendDeg) * Math.PI) / 180;
  const hand: [number, number, number] = hasElbow
    ? [
        elbow[0] + (forearmLengthM as number) * Math.sin(forearmAngleRad),
        elbow[1] - (forearmLengthM as number) * Math.cos(forearmAngleRad),
        0,
      ]
    : elbow;

  const armColor = tensionColorHex(tensionFrac);
  const armEmissive = tensionEmissive(tensionFrac);
  const forearmColor = tensionColorHex(tensionFrac * 0.55);

  return (
    <group>
      {/* Head */}
      <mesh position={[0, 0.42, -0.05]} castShadow>
        <sphereGeometry args={[0.09, 20, 20]} />
        <meshStandardMaterial color={SKIN} roughness={0.6} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 0.3, -0.05]} castShadow>
        <cylinderGeometry args={[0.03, 0.035, 0.08, 12]} />
        <meshStandardMaterial color={SKIN} roughness={0.6} />
      </mesh>
      {/* Torso */}
      <mesh position={[-0.02, 0.05, -0.08]} castShadow receiveShadow>
        <capsuleGeometry args={[0.13, 0.34, 8, 16]} />
        <meshStandardMaterial color={SHIRT} roughness={0.65} />
      </mesh>
      {/* Opposite shoulder joint cap for a smooth silhouette where the hanging arm meets the torso */}
      <mesh position={[-0.12, 0.2, -0.08]} castShadow>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial color={SKIN} roughness={0.6} />
      </mesh>

      {/* Opposite arm — hangs naturally at the side, giving the figure a
          recognizable human silhouette instead of one isolated limb. */}
      <Bone from={[-0.12, 0.19, -0.08]} to={[-0.15, -0.14, -0.06]} radius={0.036} color={SKIN} />
      <Bone from={[-0.15, -0.14, -0.06]} to={[-0.16, -0.42, -0.05]} radius={0.03} color={SKIN} />
      <mesh position={[-0.16, -0.42, -0.05]}>
        <sphereGeometry args={[0.026, 14, 14]} />
        <meshStandardMaterial color={SKIN} roughness={0.6} />
      </mesh>

      {/* Legs, so the figure reads as a standing person rather than a floating torso. */}
      <Bone from={[0.06, -0.31, -0.08]} to={[0.07, -0.75, -0.04]} radius={0.055} color="#33404a" />
      <Bone from={[-0.09, -0.31, -0.08]} to={[-0.08, -0.75, -0.04]} radius={0.055} color="#33404a" />

      {/* Shoulder joint marker (rotation axis) */}
      <mesh position={shoulder}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial color={JOINT_AXIS} emissive={JOINT_AXIS} emissiveIntensity={0.6} />
      </mesh>

      {/* Deltoid bulge — the working muscle this whole app is about. Reddens and glows with tensionFrac. */}
      <mesh position={[shoulder[0] * 0.6 + elbow[0] * 0.15, shoulder[1] * 0.6 + elbow[1] * 0.15 + 0.02, 0.01]} castShadow>
        <sphereGeometry args={[0.052, 16, 16]} />
        <meshStandardMaterial
          color={armColor}
          roughness={0.5}
          emissive={armEmissive}
          emissiveIntensity={1}
        />
      </mesh>

      <Bone from={shoulder} to={elbow} radius={hasElbow ? 0.04 : 0.038} color={armColor} emissive={armEmissive} />
      {hasElbow && (
        <>
          <Bone from={elbow} to={hand} radius={0.032} color={forearmColor} />
          <mesh position={elbow}>
            <sphereGeometry args={[0.026, 14, 14]} />
            <meshStandardMaterial color={SKIN} roughness={0.6} />
          </mesh>
        </>
      )}
      <mesh position={hand}>
        <sphereGeometry args={[0.028, 14, 14]} />
        <meshStandardMaterial color={SKIN} roughness={0.6} />
      </mesh>

      {loadAtHand && (
        <mesh position={[hand[0], hand[1] - 0.09, hand[2]]} castShadow>
          <boxGeometry args={[0.09, 0.09, 0.09]} />
          <meshStandardMaterial color="#e4572e" roughness={0.5} />
        </mesh>
      )}
    </group>
  );
}

export function armEndpoint(
  shoulderAngleDeg: number,
  armLengthM: number
): [number, number, number] {
  const rad = (shoulderAngleDeg * Math.PI) / 180;
  return [armLengthM * Math.sin(rad), -armLengthM * Math.cos(rad), 0];
}
