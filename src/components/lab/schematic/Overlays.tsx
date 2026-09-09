"use client";

import { useMemo } from "react";
import { Line, Text } from "@react-three/drei";

export const MA_COLOR = "#f0b429";
export const FORCE_COLOR = "#ef5350";
export const AXIS_COLOR = "#3ddc97";

type Pt3 = [number, number, number];

/** Double-headed horizontal (or arbitrary) arrow with a "M.A." style label, matching the sketch's yellow moment-arm indicator. */
export function MomentArmArrow({
  from,
  to,
  label = "M.A.",
  labelOffset = 0.045,
}: {
  from: Pt3;
  to: Pt3;
  label?: string;
  labelOffset?: number;
}) {
  const mid: Pt3 = [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2 + labelOffset,
    (from[2] + to[2]) / 2,
  ];
  const heads = useMemo(() => {
    const dir = [to[0] - from[0], to[1] - from[1]];
    const len = Math.hypot(dir[0], dir[1]) || 1;
    const ux = dir[0] / len;
    const uy = dir[1] / len;
    const headSize = 0.018;
    const perp = { x: -uy, y: ux };
    const makeHead = (tip: Pt3, sign: 1 | -1): Pt3[] => [
      tip,
      [
        tip[0] - sign * ux * headSize + perp.x * headSize * 0.55,
        tip[1] - sign * uy * headSize + perp.y * headSize * 0.55,
        tip[2],
      ],
      [
        tip[0] - sign * ux * headSize - perp.x * headSize * 0.55,
        tip[1] - sign * uy * headSize - perp.y * headSize * 0.55,
        tip[2],
      ],
      tip,
    ];
    return [makeHead(from, -1), makeHead(to, 1)];
  }, [from, to]);

  return (
    <group>
      <Line points={[from, to]} color={MA_COLOR} lineWidth={1.75} />
      {heads.map((pts, i) => (
        <Line key={i} points={pts} color={MA_COLOR} lineWidth={1.75} />
      ))}
      <Text position={mid} fontSize={0.028} color={MA_COLOR} anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  );
}

/** Downward force vector with an "F" label, matching the sketch's force arrow under the load block. */
export function ForceVector({ at, length = 0.09, label = "F" }: { at: Pt3; length?: number; label?: string }) {
  const tip: Pt3 = [at[0], at[1] - length, at[2]];
  const headSize = 0.014;
  return (
    <group>
      <Line points={[at, tip]} color={FORCE_COLOR} lineWidth={2} />
      <Line
        points={[
          [tip[0] - headSize, tip[1] + headSize * 1.6, tip[2]],
          tip,
          [tip[0] + headSize, tip[1] + headSize * 1.6, tip[2]],
        ]}
        color={FORCE_COLOR}
        lineWidth={2}
      />
      <Text
        position={[tip[0], tip[1] - 0.02, tip[2]]}
        fontSize={0.026}
        color={FORCE_COLOR}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

/** Small labeled dot marking the joint / rotation axis, matching the sketch's green "Joint axis" callout. */
export function JointAxisLabel({ at }: { at: Pt3 }) {
  return (
    <Text
      position={[at[0] - 0.09, at[1] + 0.06, at[2]]}
      fontSize={0.022}
      color={AXIS_COLOR}
      anchorX="center"
      anchorY="middle"
    >
      Joint axis
    </Text>
  );
}

/** Angle arc from the downward vertical to the current arm direction, with a degree label. */
export function AngleArc({
  originDeg = 0,
  sweepDeg,
  radius = 0.14,
  center = [0, 0, 0.01] as Pt3,
  mirrorX = false,
}: {
  originDeg?: number;
  sweepDeg: number;
  radius?: number;
  center?: Pt3;
  /** Flip the arc's X direction (label text stays showing the true positive angle). Use when pairing with a model whose arm swings toward -X for a positive angle. */
  mirrorX?: boolean;
}) {
  const sign = mirrorX ? -1 : 1;
  const points = useMemo(() => {
    const pts: Pt3[] = [];
    const steps = Math.max(4, Math.round(Math.abs(sweepDeg) / 4));
    for (let i = 0; i <= steps; i++) {
      const deg = originDeg + (sweepDeg * i) / steps;
      const rad = (deg * Math.PI) / 180;
      pts.push([center[0] + sign * radius * Math.sin(rad), center[1] - radius * Math.cos(rad), center[2]]);
    }
    return pts;
  }, [originDeg, sweepDeg, radius, center, sign]);

  const labelDeg = originDeg + sweepDeg / 2;
  const labelRad = (labelDeg * Math.PI) / 180;
  const labelPos: Pt3 = [
    center[0] + sign * (radius + 0.03) * Math.sin(labelRad),
    center[1] - (radius + 0.03) * Math.cos(labelRad),
    center[2],
  ];

  return (
    <group>
      <Line points={points} color="#8b98a5" lineWidth={1.5} />
      <Text position={labelPos} fontSize={0.024} color="#c7cfd6" anchorX="center" anchorY="middle">
        {Math.round(sweepDeg)}°
      </Text>

    </group>
  );
}
