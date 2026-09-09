"use client";

import AnatomicalArm from "@/components/lab/AnatomicalArm";
import { ForceVector, JointAxisLabel, MomentArmArrow } from "@/components/lab/schematic/Overlays";
import { realArmEndpoint, REAL_FULL_ARM_LENGTH_M } from "@/lib/realArmKinematics";

export default function Exp1Scene({
  loadDistanceM,
  armLengthM = REAL_FULL_ARM_LENGTH_M,
  tensionFrac = 0,
}: {
  loadDistanceM: number;
  armLengthM?: number;
  tensionFrac?: number;
}) {
  const shoulder: [number, number, number] = [0, 0, 0];
  // Mirrored x to match AnatomicalArm's actual rotation direction (see realArmKinematics.ts).
  const mirroredX = -loadDistanceM;
  const handPoint = realArmEndpoint(90, armLengthM);

  return (
    <>
      <AnatomicalArm shoulderAngleDeg={90} elbowAngleDeg={180} tensionFrac={tensionFrac} position={[0, 0, 0]} />
      {/* load block at variable position along the (fixed horizontal) arm */}
      <mesh position={[mirroredX, -0.045, 0.02]} castShadow>
        <boxGeometry args={[0.045, 0.045, 0.045]} />
        <meshStandardMaterial color="#ef5350" roughness={0.5} />
      </mesh>
      <ForceVector at={[mirroredX, -0.07, 0.02]} length={0.08} />
      <MomentArmArrow from={[shoulder[0], 0.09, 0.02]} to={[mirroredX, 0.09, 0.02]} />
      <JointAxisLabel at={shoulder} />
      {/* faint guide showing the fixed full arm length */}
      <mesh position={[handPoint[0] / 2, handPoint[1] / 2 - 0.09, -0.01]}>
        <boxGeometry args={[0.001, 0.001, 0.001]} />
      </mesh>
    </>
  );
}
