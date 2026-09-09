/**
 * Matches AnatomicalArm's actual visual rotation convention (see the sign
 * note in AnatomicalArm.tsx — the live render needed the shoulder rotation
 * negated relative to the original offline derivation). Schematic overlays
 * drawn alongside the real anatomical model (moment-arm arrows, force
 * vectors, muscle-line-of-pull) must use this same convention or they'll
 * point the opposite way from the mesh.
 *
 * The underlying physics in src/lib/experiments.ts is untouched and still
 * correct — torque magnitude doesn't depend on which visual side the arm is
 * mirrored to. This only affects where things are *drawn*.
 */

const toRad = (deg: number) => (deg * Math.PI) / 180;

export function realArmEndpoint(
  shoulderAngleDeg: number,
  armLengthM: number
): [number, number, number] {
  const rad = toRad(shoulderAngleDeg);
  return [-armLengthM * Math.sin(rad), -armLengthM * Math.cos(rad), 0];
}

/** Real, measured segment lengths from the anatomical model (BodyParts3D), in meters. */
export const REAL_UPPER_ARM_LENGTH_M = 0.295; // shoulder pivot -> elbow pivot
export const REAL_FULL_ARM_LENGTH_M = 0.618; // shoulder pivot -> mid-hand, elbow straight
