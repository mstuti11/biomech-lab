"use client";

export default function ContributionBars({
  contributions,
}: {
  contributions: { label: string; torqueNm: number }[];
}) {
  const maxAbs = Math.max(...contributions.map((c) => Math.abs(c.torqueNm)), 0.01);

  return (
    <div className="space-y-3">
      {contributions.map((c) => {
        const pct = (Math.abs(c.torqueNm) / maxAbs) * 100;
        return (
          <div key={c.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-ink-muted">{c.label}</span>
              <span className="font-mono-data text-ink">
                {c.torqueNm.toFixed(2)} N·m
              </span>
            </div>
            <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-teal transition-all duration-150"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
