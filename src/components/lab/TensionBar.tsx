"use client";

import { tensionColorHex } from "@/lib/tension";

export default function TensionBar({ tensionFrac }: { tensionFrac: number }) {
  const pct = Math.round(Math.min(1, Math.max(0, tensionFrac)) * 100);
  return (
    <div>
      <div className="flex justify-between text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1.5">
        <span>Muscle tension</span>
        <span className="font-mono-data" style={{ color: tensionColorHex(tensionFrac) }}>
          {pct}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-raised overflow-hidden border border-line">
        <div
          className="h-full rounded-full transition-all duration-150"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, #d9a679, ${tensionColorHex(tensionFrac)})`,
          }}
        />
      </div>
    </div>
  );
}
