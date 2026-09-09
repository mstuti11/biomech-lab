"use client";

import AnatomicalArm from "@/components/lab/AnatomicalArm";
import { Line } from "@react-three/drei";
import type { Point } from "@/lib/experiments";
import { REAL_UPPER_ARM_LENGTH_M } from "@/lib/realArmKinematics";

const MUSCLE_COLOR = "#c084fc";

export default function Exp3Scene({
  shoulderAngleDeg,
  insertionFrac,
  origin,
  insertion,
  armLengthM = REAL_UPPER_ARM_LENGTH_M,
  tensionFrac = 0,
}: {
  shoulderAngleDeg: number;
  insertionFrac: number;
  origin: Point;
  insertion: Point;
  armLengthM?: number;
  tensionFrac?: number;
}) {
  const shoulder: [number, number, number] = [0, 0, 0];

  // Mirrored x to match AnatomicalArm's actual rotation direction (see realArmKinematics.ts).
  // The underlying physics (lib/experiments.ts) is untouched — only the drawing is mirrored.
  const o: [number, number, number] = [-origin.x, origin.y, 0.03];
  const ins: [number, number, number] = [-insertion.x, insertion.y, 0.03];

  // Foot of perpendicular from the shoulder joint to the muscle line, for the moment-arm indicator.
  const dx = ins[0] - o[0];
  const dy = ins[1] - o[1];
  const lenSq = dx * dx + dy * dy || 1;
  const t = ((shoulder[0] - o[0]) * dx + (shoulder[1] - o[1]) * dy) / lenSq;
  const foot: [number, number, number] = [o[0] + t * dx, o[1] + t * dy, 0.03];

  return (
    <>
      <AnatomicalArm
        shoulderAngleDeg={shoulderAngleDeg}
        elbowAngleDeg={180}
        tensionFrac={tensionFrac}
        position={[0, 0, 0]}
      />
      {/* schematic muscle line of pull (teaching overlay — a simplified adjustable model, since real anatomy can't be dragged) */}
      <Line points={[o, ins]} color={MUSCLE_COLOR} lineWidth={2.5} />
      <mesh position={o}>
        <sphereGeometry args={[0.012, 12, 12]} />
        <meshStandardMaterial color={MUSCLE_COLOR} />
      </mesh>
      <mesh position={ins}>
        <sphereGeometry args={[0.012, 12, 12]} />
        <meshStandardMaterial color={MUSCLE_COLOR} />
      </mesh>
      {/* perpendicular moment-arm segment from shoulder axis to the muscle's line of pull */}
      <Line points={[shoulder, foot]} color="#f0b429" lineWidth={2} dashed dashSize={0.008} gapSize={0.006} />
      <mesh position={foot}>
        <sphereGeometry args={[0.008, 10, 10]} />
        <meshStandardMaterial color="#f0b429" />
      </mesh>
    </>
  );
}
