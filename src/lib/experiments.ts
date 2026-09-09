// ---------------------------------------------------------------------------
// The 3 Experiments — a reusable, simplified single-segment engine.
//
// Deliberately simpler than lib/biomechanics.ts (which models real
// anthropometric segment masses for the free-form simulator). These three
// experiments isolate ONE variable at a time, exactly as specified in the
// project brief, so each one teaches a single, clean idea:
//
//   Experiment 1 — load position   → external moment arm → external torque
//   Experiment 2 — joint angle     → external moment arm → external torque
//   Experiment 3 — muscle line of pull → internal moment arm → muscle torque
//
// All three reuse the same primitive: torque = force x perpendicular moment
// arm. That reuse is the point — one small engine, three demonstrations.
// ---------------------------------------------------------------------------

export const G = 9.80665;

export interface Point {
  x: number;
  y: number;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Perpendicular (shortest) distance from a point to the infinite line through a and b. */
export function pointToLineDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  // 2D cross product magnitude / segment length = perpendicular distance to the line
  const cross = Math.abs(dx * (a.y - p.y) - dy * (a.x - p.x));
  return cross / Math.sqrt(lenSq);
}

// ---------------------------------------------------------------------------
// Experiment 1 — Load position → moment arm → torque
// Shoulder held at 90 deg abduction (arm horizontal). The load slides along
// the arm at a variable distance from the shoulder. Because the arm is
// horizontal and the force is vertical, the moment arm equals that distance
// directly — the cleanest possible illustration of F x MA = Torque.
// ---------------------------------------------------------------------------
export interface Exp1Result {
  shoulder: Point;
  hand: Point;
  loadPoint: Point;
  momentArmM: number;
  torqueNm: number;
}

export function experiment1(loadDistanceM: number, loadKg: number, armLengthM = 0.618): Exp1Result {
  const shoulder: Point = { x: 0, y: 0 };
  const hand: Point = { x: armLengthM, y: 0 };
  const loadPoint: Point = { x: loadDistanceM, y: 0 };
  const momentArmM = loadDistanceM;
  const torqueNm = loadKg * G * momentArmM;
  return { shoulder, hand, loadPoint, momentArmM, torqueNm };
}

// ---------------------------------------------------------------------------
// Experiment 2 — Joint angle → moment arm → torque
// Load mass and arm length fixed; shoulder elevation angle varies 0-180 deg.
// Moment arm = armLength * sin(angle) — peaks at 90 deg, symmetric either
// side of it, exactly matching the brief.
// ---------------------------------------------------------------------------
export interface Exp2Result {
  shoulder: Point;
  hand: Point;
  momentArmM: number;
  torqueNm: number;
}

export function experiment2(
  shoulderAngleDeg: number,
  loadKg: number,
  armLengthM = 0.618
): Exp2Result {
  const rad = toRad(shoulderAngleDeg);
  const shoulder: Point = { x: 0, y: 0 };
  const hand: Point = {
    x: armLengthM * Math.sin(rad),
    y: -armLengthM * Math.cos(rad),
  };
  const momentArmM = armLengthM * Math.sin(rad);
  const torqueNm = loadKg * G * momentArmM;
  return { shoulder, hand, momentArmM, torqueNm };
}

export function experiment2Curve(loadKg: number, armLengthM = 0.618, stepDeg = 5) {
  const pts: { angle: number; momentArm: number; torque: number }[] = [];
  for (let angle = 0; angle <= 180; angle += stepDeg) {
    const r = experiment2(angle, loadKg, armLengthM);
    pts.push({ angle, momentArm: r.momentArmM, torque: r.torqueNm });
  }
  return pts;
}

// ---------------------------------------------------------------------------
// Experiment 3 — Muscle line of pull → internal moment arm → muscle torque
// A simplified single-muscle model (standing in for the deltoid). It
// originates at a fixed point near the shoulder (representing the
// acromion/clavicle) and inserts on the upper arm at a variable point.
// Moving the insertion point changes the muscle's line of pull relative to
// the joint axis, which changes its moment arm — independent of how hard the
// muscle pulls.
//
// NOTE (scientific boundary, per the brief): this is an explicit teaching
// simplification, not a claim about real deltoid geometry.
// ---------------------------------------------------------------------------
export interface Exp3Result {
  shoulder: Point;
  origin: Point;
  insertion: Point;
  armEnd: Point;
  momentArmM: number;
  muscleTorqueNm: number;
}

/** Fixed muscle origin, offset above and slightly behind the shoulder joint. */
const MUSCLE_ORIGIN_OFFSET: Point = { x: -0.015, y: 0.07 };

export function experiment3(
  shoulderAngleDeg: number,
  insertionFrac: number, // 0..1 along the upper arm, from shoulder
  muscleForceN: number,
  armLengthM = 0.295
): Exp3Result {
  const rad = toRad(shoulderAngleDeg);
  const shoulder: Point = { x: 0, y: 0 };
  const armEnd: Point = {
    x: armLengthM * Math.sin(rad),
    y: -armLengthM * Math.cos(rad),
  };
  const origin: Point = {
    x: shoulder.x + MUSCLE_ORIGIN_OFFSET.x,
    y: shoulder.y + MUSCLE_ORIGIN_OFFSET.y,
  };
  const insertion: Point = {
    x: shoulder.x + (armEnd.x - shoulder.x) * insertionFrac,
    y: shoulder.y + (armEnd.y - shoulder.y) * insertionFrac,
  };
  const momentArmM = pointToLineDistance(shoulder, origin, insertion);
  const muscleTorqueNm = muscleForceN * momentArmM;
  return { shoulder, origin, insertion, armEnd, momentArmM, muscleTorqueNm };
}

export function experiment3Curve(
  shoulderAngleDeg: number,
  muscleForceN: number,
  armLengthM = 0.295,
  steps = 20
) {
  const pts: { insertionFrac: number; momentArm: number; torque: number }[] = [];
  for (let i = 2; i <= steps; i++) {
    const frac = i / steps;
    const r = experiment3(shoulderAngleDeg, frac, muscleForceN, armLengthM);
    pts.push({ insertionFrac: frac, momentArm: r.momentArmM, torque: r.muscleTorqueNm });
  }
  return pts;
}
