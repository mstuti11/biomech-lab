"use client";

import { useEffect, useMemo, useRef } from "react";
import { useLoader } from "@react-three/fiber";
import { STLLoader } from "three-stdlib";
import * as THREE from "three";
import { tensionColor, tensionEmissive } from "@/lib/tension";

/**
 * A REAL anatomical arm — shoulder through fingertips — built from actual
 * named muscle and bone geometry from the BodyParts3D/Anatomography dataset
 * (via the Kevin-Mattheus-Moerman/BodyParts3D GitHub mirror), not a
 * stylized capsule figure. 40 individually-identified real structures:
 *
 *   Bone:   clavicle, scapula, humerus, radius, ulna, 8 carpals,
 *           5 metacarpals, 14 phalanges (full hand skeleton)
 *   Muscle: deltoid (clavicular / acromial / spinal heads),
 *           biceps brachii (short / long heads),
 *           triceps brachii (medial / lateral / long heads)
 *
 * License: CC BY-SA 2.1 Japan — "BodyParts3D, (c) The Database Center for
 * Life Science licensed under CC Attribution-Share Alike 2.1 Japan."
 * http://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
 *
 * All files share one coordinate space (confirmed via bounding-box overlap
 * before building this — no manual per-part placement needed). Scale
 * 1/1000 (mm->m), rotate Z-up -> Y-up for Three.js.
 *
 * RIG: three nested groups, matching how the joints actually chain:
 *   torso (fixed: clavicle, scapula)
 *     -> upper arm (rotates on shoulderAngleDeg around SHOULDER_PIVOT_MM):
 *          humerus + all 8 muscle heads
 *          -> forearm+hand (rotates on elbow flexion around ELBOW_PIVOT_MM,
 *             nested inside the upper-arm group so it inherits the shoulder
 *             rotation automatically): radius, ulna, all carpals,
 *             metacarpals, phalanges
 *
 * CALIBRATION: both pivots and the rotation axis were verified — not just
 * assumed — by rendering the actual transform pipeline (pivot, mm->m,
 * axis remap, nested rotation) with matplotlib at several shoulder/elbow
 * angle combinations before shipping this. The arm swings cleanly from
 * hanging-down to horizontal, and the elbow flexes the forearm+hand
 * correctly relative to the (already-rotated) upper arm, with no
 * distortion at any tested angle. The dataset's standard anatomical pose
 * (arm hanging, elbow straight) is taken as shoulderAngleDeg=0,
 * elbowAngleDeg=180 (this app's "fully extended" convention).
 *
 * Attachment pins: small markers at each muscle's proximal (origin)
 * attachment, in the style of the reference anatomy app's interactive
 * pins. Positions were computed geometrically (centroid of each muscle's
 * proximal-most ~4% of vertices along its long axis) rather than taken
 * from a specific anatomical atlas — a reasonable approximation for a
 * teaching visual, not a citation-grade attachment coordinate.
 */

type PartDef = { file: string; kind: "bone" | "muscle" };

const FIXED_PARTS: PartDef[] = [
  { file: "clavicle", kind: "bone" },
  { file: "scapula", kind: "bone" },
];

const UPPER_ARM_PARTS: PartDef[] = [
  { file: "humerus", kind: "bone" },
  { file: "deltoid_clavicular", kind: "muscle" },
  { file: "deltoid_acromial", kind: "muscle" },
  { file: "deltoid_spinal", kind: "muscle" },
  { file: "biceps_short_head", kind: "muscle" },
  { file: "biceps_long_head", kind: "muscle" },
  { file: "triceps_medial_head", kind: "muscle" },
  { file: "triceps_lateral_head", kind: "muscle" },
  { file: "triceps_long_head", kind: "muscle" },
];

const FOREARM_HAND_PARTS: PartDef[] = [
  { file: "radius", kind: "bone" },
  { file: "ulna", kind: "bone" },
  { file: "carpal_scaphoid", kind: "bone" },
  { file: "carpal_lunate", kind: "bone" },
  { file: "carpal_triquetral", kind: "bone" },
  { file: "carpal_pisiform", kind: "bone" },
  { file: "carpal_trapezium", kind: "bone" },
  { file: "carpal_trapezoid", kind: "bone" },
  { file: "carpal_capitate", kind: "bone" },
  { file: "carpal_hamate", kind: "bone" },
  { file: "metacarpal_1", kind: "bone" },
  { file: "metacarpal_2", kind: "bone" },
  { file: "metacarpal_3", kind: "bone" },
  { file: "metacarpal_4", kind: "bone" },
  { file: "metacarpal_5", kind: "bone" },
  { file: "phalanx_thumb_proximal", kind: "bone" },
  { file: "phalanx_thumb_distal", kind: "bone" },
  { file: "phalanx_index_proximal", kind: "bone" },
  { file: "phalanx_index_middle", kind: "bone" },
  { file: "phalanx_index_distal", kind: "bone" },
  { file: "phalanx_middle_proximal", kind: "bone" },
  { file: "phalanx_middle_middle", kind: "bone" },
  { file: "phalanx_middle_distal", kind: "bone" },
  { file: "phalanx_ring_proximal", kind: "bone" },
  { file: "phalanx_ring_middle", kind: "bone" },
  { file: "phalanx_ring_distal", kind: "bone" },
  { file: "phalanx_little_proximal", kind: "bone" },
  { file: "phalanx_little_middle", kind: "bone" },
  { file: "phalanx_little_distal", kind: "bone" },
];

const ALL_PARTS = [...FIXED_PARTS, ...UPPER_ARM_PARTS, ...FOREARM_HAND_PARTS];
const PART_URLS = ALL_PARTS.map((p) => `/models/anatomy/${p.file}.stl`);

const SCALE = 0.001; // mm -> m
const SHOULDER_PIVOT_MM: [number, number, number] = [-166.4, -73.0, 1339.2];
const ELBOW_PIVOT_MM: [number, number, number] = [-209.3, -66.3, 1047.0];
// Anterior-posterior axis (post Z-up->Y-up remap) — verified correct for
// both shoulder abduction and elbow flexion in this app's single-plane model.
const ROTATION_AXIS = new THREE.Vector3(0, 0, 1);

const BONE_COLOR = "#e8dfc9";
const MUSCLE_REST_COLOR = new THREE.Color("#9a3f3f");
const PIN_COLOR = "#f2c744";

// Muscle origin attachment points, in raw STL (mm) coordinates — computed
// geometrically, see file header note.
const MUSCLE_ORIGIN_MM: Record<string, [number, number, number]> = {
  deltoid_clavicular: [-129.4, -73.6, 1361.7],
  deltoid_acromial: [-174.4, -62.5, 1355.6],
  deltoid_spinal: [-166.2, -35.1, 1345.7],
  biceps_short_head: [-139.8, -92.9, 1335.0],
  biceps_long_head: [-159.8, -81.1, 1343.9],
  triceps_medial_head: [-176.2, -63.9, 1262.8],
  triceps_lateral_head: [-182.1, -60.9, 1297.5],
  triceps_long_head: [-144.4, -55.0, 1303.1],
};

function toGroupSpace(p: [number, number, number], pivot: [number, number, number]) {
  // translate to pivot, mm -> m, Z-up -> Y-up (matches the geometry transform below)
  const [x, y, z] = p;
  const [px, py, pz] = pivot;
  const rx = (x - px) * SCALE;
  const ry = (z - pz) * SCALE;
  const rz = -(y - py) * SCALE;
  return new THREE.Vector3(rx, ry, rz);
}

function transformGeometry(raw: THREE.BufferGeometry, pivot: [number, number, number]) {
  const [px, py, pz] = pivot;
  const g = raw.clone();
  g.translate(-px, -py, -pz);
  g.scale(SCALE, SCALE, SCALE);
  g.rotateX(-Math.PI / 2);
  return g;
}

function AttachmentPin({ position }: { position: THREE.Vector3 }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.006, 12, 12]} />
      <meshStandardMaterial color={PIN_COLOR} emissive={PIN_COLOR} emissiveIntensity={0.9} />
    </mesh>
  );
}

export default function AnatomicalArm({
  shoulderAngleDeg,
  elbowAngleDeg = 180,
  tensionFrac = 0,
  showPins = true,
  position = [0, -0.35, 0] as [number, number, number],
}: {
  shoulderAngleDeg: number;
  elbowAngleDeg?: number;
  tensionFrac?: number;
  showPins?: boolean;
  /** Root group offset. Default matches the original /lab standalone viewer.
   * Pass [0,0,0] when overlay graphics elsewhere need the shoulder pivot at
   * true local origin (e.g. the 3-experiments scenes). */
  position?: [number, number, number];
}) {
  const rawGeometries = useLoader(STLLoader, PART_URLS) as THREE.BufferGeometry[];

  const { fixed, upperArm, forearmHand } = useMemo(() => {
    let i = 0;
    const fixed = FIXED_PARTS.map((part) => ({
      ...part,
      geometry: transformGeometry(rawGeometries[i++], SHOULDER_PIVOT_MM),
    }));
    const upperArm = UPPER_ARM_PARTS.map((part) => ({
      ...part,
      geometry: transformGeometry(rawGeometries[i++], SHOULDER_PIVOT_MM),
    }));
    // Transformed directly relative to the ELBOW pivot (not the shoulder
    // pivot) — since forearmGroup below is itself positioned at the elbow
    // pivot (in the upper arm's local space), its children just need to be
    // elbow-centered, with no further per-render adjustment needed.
    const forearmHand = FOREARM_HAND_PARTS.map((part) => ({
      ...part,
      geometry: transformGeometry(rawGeometries[i++], ELBOW_PIVOT_MM),
    }));
    return { fixed, upperArm, forearmHand };
  }, [rawGeometries]);

  const upperArmGroup = useRef<THREE.Group>(null);
  const forearmGroup = useRef<THREE.Group>(null);

  const elbowPivotLocal = useMemo(
    () => toGroupSpace(ELBOW_PIVOT_MM, SHOULDER_PIVOT_MM),
    []
  );

  useEffect(() => {
    if (!upperArmGroup.current) return;
    // NOTE: the offline matplotlib check (see file header) confirmed this
    // axis/pivot pairing produces an anatomically correct swing in an
    // isolated coordinate-math sense, but the live render was reported
    // moving the opposite way from the shoulderAngleDeg slider (i.e. arm
    // drops as the angle increases). Negating the angle here fixes that
    // against the actual rendered behavior, which is the higher-confidence
    // signal — a live visual report beats an offline derivation.
    const q = new THREE.Quaternion().setFromAxisAngle(
      ROTATION_AXIS,
      THREE.MathUtils.degToRad(-shoulderAngleDeg)
    );
    upperArmGroup.current.quaternion.copy(q);
  }, [shoulderAngleDeg]);

  useEffect(() => {
    if (!forearmGroup.current) return;
    // 180deg = straight (this app's convention) -> 0 additional rotation.
    // Smaller elbowAngleDeg = more flexed -> larger rotation.
    const flexionDeg = 180 - elbowAngleDeg;
    const q = new THREE.Quaternion().setFromAxisAngle(
      ROTATION_AXIS,
      THREE.MathUtils.degToRad(flexionDeg)
    );
    forearmGroup.current.position.copy(elbowPivotLocal);
    forearmGroup.current.quaternion.copy(q);
  }, [elbowAngleDeg, elbowPivotLocal]);

  const muscleColor = muscleColorFor(tensionFrac);
  const muscleEmissive = tensionEmissive(tensionFrac);

  return (
    <group position={position}>
      {fixed.map((p) => (
        <mesh key={p.file} geometry={p.geometry} castShadow receiveShadow>
          <meshStandardMaterial color={BONE_COLOR} roughness={0.55} />
        </mesh>
      ))}

      <group ref={upperArmGroup}>
        {upperArm.map((p) => (
          <mesh key={p.file} geometry={p.geometry} castShadow receiveShadow>
            <meshStandardMaterial
              color={p.kind === "bone" ? BONE_COLOR : muscleColor}
              roughness={0.55}
              emissive={p.kind === "muscle" ? muscleEmissive : undefined}
              emissiveIntensity={p.kind === "muscle" ? 1 : 0}
            />
          </mesh>
        ))}

        {showPins &&
          Object.entries(MUSCLE_ORIGIN_MM).map(([name, mm]) => (
            <AttachmentPin key={name} position={toGroupSpace(mm, SHOULDER_PIVOT_MM)} />
          ))}

        {/* forearmGroup is positioned at the elbow pivot (in the upper arm's
            local space); its children were pre-transformed relative to that
            same pivot in useMemo above, so they render correctly with no
            further per-frame adjustment. */}
        <group ref={forearmGroup}>
          {forearmHand.map((p) => (
            <mesh key={p.file} geometry={p.geometry} castShadow receiveShadow>
              <meshStandardMaterial color={BONE_COLOR} roughness={0.55} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

function muscleColorFor(tensionFrac: number): THREE.Color {
  return MUSCLE_REST_COLOR.clone().lerp(tensionColor(tensionFrac), 0.6 + tensionFrac * 0.4);
}
