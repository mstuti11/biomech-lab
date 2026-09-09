import * as THREE from "three";

/**
 * Maps a muscle force/torque value to a normalized 0-1 "tension" value.
 * maxN is the value at which the visual reaches full/maximum strain — tune
 * this per experiment since the force ranges differ (Exp 3's muscle force is
 * a direct input; the free-form lab's deltoid force can run into the
 * hundreds of Newtons).
 */
export function computeTension(valueN: number, maxN: number): number {
  if (maxN <= 0) return 0;
  return Math.min(1, Math.max(0, valueN / maxN));
}

const RELAXED = new THREE.Color("#d9a679"); // resting skin/muscle tone
const STRAINED = new THREE.Color("#c23b2e"); // flushed, engorged, working-hard red

/** Interpolated color for a given tension level, resting tone -> strained red. */
export function tensionColor(tension: number): THREE.Color {
  return RELAXED.clone().lerp(STRAINED, tension);
}

export function tensionColorHex(tension: number): string {
  return `#${tensionColor(tension).getHexString()}`;
}

/** Small amount of emissive glow at high tension, for a "working hard" pop under the lights. */
export function tensionEmissive(tension: number): THREE.Color {
  const t = Math.max(0, tension - 0.55) / 0.45; // only kicks in past ~55% tension
  return new THREE.Color("#ff5a3c").multiplyScalar(Math.max(0, Math.min(1, t)) * 0.35);
}
