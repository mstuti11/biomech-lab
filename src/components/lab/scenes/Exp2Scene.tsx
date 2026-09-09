"use client";

import AnatomicalArm from "@/components/lab/AnatomicalArm";
import { AngleArc, ForceVector, JointAxisLabel, MomentArmArrow } from "@/components/lab/schematic/Overlays";
import { realArmEndpoint, REAL_FULL_ARM_LENGTH_M } from "@/lib/realArmKinematics";

export default function Exp2Scene({
  shoulderAngleDeg,
  armLengthM = REAL_FULL_ARM_LENGTH_M,
  tensionFrac = 0,
}: {
  shoulderAngleDeg: number;
  armLengthM?: number;
  tensionFrac?: number;
}) {
  const shoulder: [number, number, number] = [0, 0, 0];
  const hand = realArmEndpoint(shoulderAngleDeg, armLengthM);
  const handAt: [number, number, number] = [hand[0], hand[1], 0.02];

  return (
    <>
      <AnatomicalArm
        shoulderAngleDeg={shoulderAngleDeg}
        elbowAngleDeg={180}
        tensionFrac={tensionFrac}
        position={[0, 0, 0]}
      />
      <AngleArc sweepDeg={shoulderAngleDeg} radius={0.12} mirrorX />
      <mesh position={[handAt[0], handAt[1] - 0.05, handAt[2]]} castShadow>
        <boxGeometry args={[0.045, 0.045, 0.045]} />
        <meshStandardMaterial color="#ef5350" roughness={0.5} />
      </mesh>
      <MomentArmArrow from={[shoulder[0], handAt[1], 0.03]} to={[handAt[0], handAt[1], 0.03]} />
      <ForceVector at={[handAt[0], handAt[1] - 0.09, 0.02]} length={0.08} />
      <JointAxisLabel at={shoulder} />
    </>
  );
}
