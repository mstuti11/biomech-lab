"use client";

/**
 * A dial-gauge instrument reading, styled after analog lab meters:
 * a 240-degree sweep with tick marks and a brass needle.
 */
export default function Gauge({
  value,
  max,
  label,
  unit,
  accent = "#e0a83e",
}: {
  value: number;
  max: number;
  label: string;
  unit: string;
  accent?: string;
}) {
  const clamped = Math.max(0, Math.min(value, max));
  const sweepDeg = 240;
  const startDeg = -210; // gauge opens toward the bottom
  const frac = max > 0 ? clamped / max : 0;
  const needleDeg = startDeg + frac * sweepDeg;

  const ticks = Array.from({ length: 9 }, (_, i) => i / 8);
  const cx = 100;
  const cy = 100;
  const r = 78;

  const polar = (fracVal: number, radius: number) => {
    const deg = startDeg + fracVal * sweepDeg;
    const rad = (deg * Math.PI) / 180;
    return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
  };

  const needleRad = (needleDeg * Math.PI) / 180;
  const needleX = cx + (r - 14) * Math.cos(needleRad);
  const needleY = cy + (r - 14) * Math.sin(needleRad);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 140" className="w-full max-w-[220px]">
        <path
          d={describeArc(cx, cy, r, startDeg, startDeg + sweepDeg)}
          fill="none"
          stroke="#2a3540"
          strokeWidth={3}
        />
        <path
          d={describeArc(cx, cy, r, startDeg, needleDeg)}
          fill="none"
          stroke={accent}
          strokeWidth={3}
          opacity={0.85}
        />
        {ticks.map((t, i) => {
          const [x1, y1] = polar(t, r + 4);
          const [x2, y2] = polar(t, r - 6);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#5a6a76"
              strokeWidth={1.5}
            />
          );
        })}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke={accent}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={5} fill={accent} />
        <text
          x={cx}
          y={cy + 32}
          textAnchor="middle"
          className="font-mono-data"
          fontSize="18"
          fill="#eceff2"
        >
          {value.toFixed(1)}
        </text>
        <text
          x={cx}
          y={cy + 48}
          textAnchor="middle"
          fontSize="10"
          fill="#8b98a5"
          letterSpacing="1"
        >
          {unit}
        </text>
      </svg>
      <div className="text-xs uppercase tracking-[0.18em] text-ink-muted mt-1">
        {label}
      </div>
    </div>
  );
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarPoint(cx, cy, r, startDeg);
  const end = polarPoint(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg <= 180 ? 0 : 1;
  return `M ${start[0]} ${start[1]} A ${r} ${r} 0 ${largeArc} 1 ${end[0]} ${end[1]}`;
}

function polarPoint(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}
