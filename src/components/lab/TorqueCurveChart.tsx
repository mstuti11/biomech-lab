"use client";

import {
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function TorqueCurveChart({
  data,
  currentAngle,
}: {
  data: { angle: number; torque: number; muscleForce: number }[];
  currentAngle: number;
}) {
  const current = data.reduce((best, p) =>
    Math.abs(p.angle - currentAngle) < Math.abs(best.angle - currentAngle) ? p : best
  );

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="#2a3540" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="angle"
            tick={{ fill: "#8b98a5", fontSize: 10 }}
            tickFormatter={(v) => `${v}°`}
            stroke="#2a3540"
            ticks={[0, 30, 60, 90, 120, 150, 180]}
          />
          <YAxis tick={{ fill: "#8b98a5", fontSize: 10 }} stroke="#2a3540" width={38} />
          <Tooltip
            contentStyle={{
              background: "#171f26",
              border: "1px solid #2a3540",
              borderRadius: 6,
              fontSize: 12,
            }}
            labelFormatter={(v) => `Shoulder angle: ${v}°`}
            formatter={(value, name) => {
              const num = typeof value === "number" ? value : Number(value ?? 0);
              const isForce = name === "muscleForce";
              return [
                `${num.toFixed(2)} ${isForce ? "N" : "N·m"}`,
                isForce ? "Deltoid force" : "Gravity torque",
              ];
            }}
          />
          <Line
            type="monotone"
            dataKey="torque"
            stroke="#e0a83e"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="muscleForce"
            stroke="#5ec8c2"
            strokeWidth={2}
            dot={false}
          />
          <ReferenceDot
            x={current.angle}
            y={current.torque}
            r={4}
            fill="#e0a83e"
            stroke="#10161b"
          />
          <ReferenceDot
            x={current.angle}
            y={current.muscleForce}
            r={4}
            fill="#5ec8c2"
            stroke="#10161b"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-4 justify-center text-[11px] text-ink-muted mt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brass inline-block" /> Gravity torque
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-teal inline-block" /> Deltoid force
        </span>
      </div>
    </div>
  );
}
