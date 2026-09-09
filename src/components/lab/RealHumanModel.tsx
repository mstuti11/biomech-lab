"use client";

import { useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { GLTF } from "three-stdlib";
import { tensionColor, tensionEmissive } from "@/lib/tension";

/**
 * A real, textured, CC0-licensed rigged human model — Khronos Group's
 * "CesiumMan" glTF sample (public domain, from the official glTF-Sample-Models
 * repo). Unlike the stylized capsule figure used elsewhere in this app, this
 * is an actual skinned human mesh with a real bone hierarchy.
 *
 * Every bone in this particular rig rotates on a single local axis (Y), which
 * is what makes it practical to drive procedurally from a single angle value
 * without a full IK setup. We bypass the model's built-in walk-cycle
 * animation entirely and pose the right-arm bone directly each frame from
 * `shoulderAngleDeg`.
 *
 * Calibration note: the rest-pose rotation of "Skeleton_arm_joint_R" reads as
 * ~195° about local Y in the raw glTF data. REST_OFFSET_DEG below re-zeroes
 * that so shoulderAngleDeg=0 matches "arm down." The sign/scale of
 * ANGLE_SCALE was chosen from the raw bone data, not from a visual check in
 * a running browser — if the arm swings the wrong way or feels off-scale on
 * screen, that's the one constant to flip/tune.
 *
 * Muscle tension: this model has a single material covering the whole body
 * (check with `gltf.materials` in gltf.report), so there's no separate
 * "deltoid" submesh to tint in isolation — tensionFrac drives a subtle
 * full-body flush here. ARM_MESH_NAME_PATTERN below is checked per-mesh, so
 * if you swap in a richer anatomical model with named muscle groups (e.g.
 * meshes literally called "Deltoid" or "Biceps_R"), those meshes will
 * automatically get the FULL tension tint while the rest of the body only
 * gets the subtle background flush — no code changes needed beyond adjusting
 * the pattern.
 */

type CesiumGLTF = GLTF & {
  nodes: Record<string, THREE.Object3D>;
};

const MODEL_URL = "/models/CesiumMan.glb";
const ARM_BONE = "Skeleton_arm_joint_R";
const REST_OFFSET_DEG = 195.44;
const ANGLE_SCALE = -1; // flip sign here if the arm raises the wrong direction
const ARM_MESH_NAME_PATTERN = /arm|delt|shoulder|bicep|tricep/i;
const BASE_TINT_STRENGTH = 0.35; // how much of full tension shows on non-matched (whole-body) meshes

export default function RealHumanModel({
  shoulderAngleDeg,
  tensionFrac = 0,
  scale = 0.55,
  position = [0, -0.35, 0] as [number, number, number],
}: {
  shoulderAngleDeg: number;
  tensionFrac?: number;
  scale?: number;
  position?: [number, number, number];
}) {
  const gltf = useGLTF(MODEL_URL) as unknown as CesiumGLTF;
  const armBone = useRef<THREE.Object3D | null>(null);
  const taggedMeshesRef = useRef<
    { material: THREE.MeshStandardMaterial; localized: boolean }[]
  >([]);

  // Clone materials once per mesh so we never mutate the cached/shared asset
  // (useGLTF caches the parsed scene — mutating its materials directly would
  // leak across every instance of this component).
  useEffect(() => {
    const entries: { material: THREE.MeshStandardMaterial; localized: boolean }[] = [];
    gltf.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const original = mesh.material as THREE.MeshStandardMaterial;
      const cloned = original.clone();
      mesh.material = cloned;
      entries.push({ material: cloned, localized: ARM_MESH_NAME_PATTERN.test(mesh.name) });
    });
    taggedMeshesRef.current = entries;
  }, [gltf]);

  useEffect(() => {
    armBone.current = gltf.nodes[ARM_BONE] ?? null;
  }, [gltf]);

  useEffect(() => {
    if (!armBone.current) return;
    const deg = REST_OFFSET_DEG + ANGLE_SCALE * shoulderAngleDeg;
    const rad = THREE.MathUtils.degToRad(deg);
    armBone.current.quaternion.set(0, Math.sin(rad / 2), 0, Math.cos(rad / 2));
  }, [shoulderAngleDeg]);

  /* eslint-disable react-hooks/immutability -- intentional imperative mutation of Three.js material objects (not React state), the standard r3f pattern */
  useEffect(() => {
    for (const { material, localized } of taggedMeshesRef.current) {
      const weight = localized ? 1 : BASE_TINT_STRENGTH;
      const effectiveTension = tensionFrac * weight;
      if (material.color) material.color.copy(tensionColor(effectiveTension));
      material.emissive.copy(tensionEmissive(effectiveTension));
      material.emissiveIntensity = 1;
    }
  }, [tensionFrac]);
  /* eslint-enable react-hooks/immutability */

  return <primitive object={gltf.scene} scale={scale} position={position} />;
}

useGLTF.preload(MODEL_URL);

