// ---------------------------------------------------------------------------
// Digital Biomechanics Laboratory — Core Engine (Week 1–2 deliverable)
//
// Models a single-plane (sagittal) arm-raise: shoulder flexion/abduction with
// elbow flexion and an optional external load in hand. Anthropometric ratios
// follow Winter, D.A. "Biomechanics and Motor Control of Human Movement"
// (segment mass fraction, segment length fraction, and center-of-mass
// fraction, measured from the PROXIMAL end of each segment).
// ---------------------------------------------------------------------------

export const G = 9.80665; // m/s^2

export interface Anthropometrics {
  bodyMassKg: number;
  heightM: number;
}

export interface ArmPose {
  /** Shoulder flexion/abduction angle in degrees. 0 = arm hanging at side, 90 = horizontal, 180 = overhead. */
  shoulderAngleDeg: number;
  /** Elbow angle in degrees. 180 = fully extended (straight), smaller = more flexed. */
  elbowAngleDeg: number;
}

export interface LoadConditions {
  /** Mass held in the hand, in kilograms. */
  externalLoadKg: number;
}

export interface SegmentGeometry {
  name: string;
  massKg: number;
  lengthM: number;
  /** Fraction of segment length from the PROXIMAL joint to that segment's center of mass. */
  comFraction: number;
}

// Winter's anthropometric table (fractions of total body mass / stature).
const SEGMENT_TABLE = {
  upperArm: { massFrac: 0.028, lengthFrac: 0.186, comFrac: 0.436 },
  forearmHand: { massFrac: 0.022, lengthFrac: 0.254, comFrac: 0.682 }, // combined forearm+hand
};

export function buildSegments(a: Anthropometrics): {
  upperArm: SegmentGeometry;
  forearmHand: SegmentGeometry;
} {
  const upperArm: SegmentGeometry = {
    name: "Upper arm",
    massKg: a.bodyMassKg * SEGMENT_TABLE.upperArm.massFrac,
    lengthM: a.heightM * SEGMENT_TABLE.upperArm.lengthFrac,
    comFraction: SEGMENT_TABLE.upperArm.comFrac,
  };
  const forearmHand: SegmentGeometry = {
    name: "Forearm + hand",
    massKg: a.bodyMassKg * SEGMENT_TABLE.forearmHand.massFrac,
    lengthM: a.heightM * SEGMENT_TABLE.forearmHand.lengthFrac,
    comFraction: SEGMENT_TABLE.forearmHand.comFrac,
  };
  return { upperArm, forearmHand };
}

export interface JointPoint {
  x: number; // meters, horizontal, forward = positive
  y: number; // meters, vertical, up = positive
}

export interface KinematicsResult {
  shoulder: JointPoint;
  elbow: JointPoint;
  wrist: JointPoint;
  upperArmComPos: JointPoint;
  forearmComPos: JointPoint;
  /** Direction angle of the upper arm segment, in degrees from vertical (matches shoulderAngleDeg). */
  upperArmAngleDeg: number;
  /** Direction angle of the forearm segment, in degrees from vertical. */
  forearmAngleDeg: number;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Forward kinematics for the two-segment arm chain in the sagittal plane.
 * Shoulder is the origin. Angles are measured from the downward vertical,
 * sweeping forward/up as shoulderAngleDeg increases.
 */
export function computeKinematics(
  a: Anthropometrics,
  pose: ArmPose
): KinematicsResult {
  const { upperArm, forearmHand } = buildSegments(a);
  const shoulderRad = toRad(pose.shoulderAngleDeg);

  // Forearm angle = shoulder angle - (180 - elbow angle): straight arm (elbow=180)
  // continues in the same direction as the upper arm; flexion folds it back.
  const forearmAngleDeg = pose.shoulderAngleDeg - (180 - pose.elbowAngleDeg);
  const forearmRad = toRad(forearmAngleDeg);

  const shoulder: JointPoint = { x: 0, y: 0 };
  const elbow: JointPoint = {
    x: upperArm.lengthM * Math.sin(shoulderRad),
    y: -upperArm.lengthM * Math.cos(shoulderRad),
  };
  const wrist: JointPoint = {
    x: elbow.x + forearmHand.lengthM * Math.sin(forearmRad),
    y: elbow.y - forearmHand.lengthM * Math.cos(forearmRad),
  };

  const upperArmComPos: JointPoint = {
    x: upperArm.lengthM * upperArm.comFraction * Math.sin(shoulderRad),
    y: -upperArm.lengthM * upperArm.comFraction * Math.cos(shoulderRad),
  };
  const forearmComPos: JointPoint = {
    x: elbow.x + forearmHand.lengthM * forearmHand.comFraction * Math.sin(forearmRad),
    y: elbow.y - forearmHand.lengthM * forearmHand.comFraction * Math.cos(forearmRad),
  };

  return {
    shoulder,
    elbow,
    wrist,
    upperArmComPos,
    forearmComPos,
    upperArmAngleDeg: pose.shoulderAngleDeg,
    forearmAngleDeg,
  };
}

/**
 * Approximate deltoid moment arm about the gleno-humeral joint as a function
 * of shoulder abduction angle. Peaks near 90 deg abduction (~0.045 m) and
 * shrinks toward the arm-down and full-overhead ends (~0.018 m), consistent
 * with published moment-arm curves for the middle deltoid.
 */
export function deltoidMomentArm(shoulderAngleDeg: number): number {
  const rad = toRad(shoulderAngleDeg);
  return 0.018 + 0.027 * Math.sin(rad);
}

export interface EngineOutput {
  kinematics: KinematicsResult;
  /** Net gravitational torque about the shoulder, in Newton-meters. */
  gravityTorqueNm: number;
  /** Moment arm used by the prime-mover (deltoid) at this shoulder angle, in meters. */
  muscleMomentArmM: number;
  /** Estimated deltoid force required to hold this position, in Newtons. */
  muscleForceN: number;
  /** Same force expressed as an equivalent mass, for intuition (kg). */
  muscleForceEquivKg: number;
  /** Breakdown of each contribution to gravity torque. */
  contributions: { label: string; torqueNm: number }[];
}

export function runEngine(
  a: Anthropometrics,
  pose: ArmPose,
  load: LoadConditions
): EngineOutput {
  const { upperArm, forearmHand } = buildSegments(a);
  const k = computeKinematics(a, pose);

  const upperArmTorque = upperArm.massKg * G * k.upperArmComPos.x;
  const forearmTorque = forearmHand.massKg * G * k.forearmComPos.x;
  const loadTorque = load.externalLoadKg * G * k.wrist.x;

  const gravityTorqueNm = upperArmTorque + forearmTorque + loadTorque;
  const muscleMomentArmM = deltoidMomentArm(pose.shoulderAngleDeg);
  const muscleForceN =
    muscleMomentArmM > 0 ? Math.abs(gravityTorqueNm) / muscleMomentArmM : 0;

  return {
    kinematics: k,
    gravityTorqueNm,
    muscleMomentArmM,
    muscleForceN,
    muscleForceEquivKg: muscleForceN / G,
    contributions: [
      { label: "Upper arm weight", torqueNm: upperArmTorque },
      { label: "Forearm + hand weight", torqueNm: forearmTorque },
      { label: "External load", torqueNm: loadTorque },
    ],
  };
}

export function torqueCurve(
  a: Anthropometrics,
  elbowAngleDeg: number,
  load: LoadConditions,
  stepDeg = 5
): { angle: number; torque: number; muscleForce: number }[] {
  const points: { angle: number; torque: number; muscleForce: number }[] = [];
  for (let angle = 0; angle <= 180; angle += stepDeg) {
    const out = runEngine(a, { shoulderAngleDeg: angle, elbowAngleDeg }, load);
    points.push({ angle, torque: out.gravityTorqueNm, muscleForce: out.muscleForceN });
  }
  return points;
}
