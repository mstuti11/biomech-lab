"use client";

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  accent = "#e0a83e",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  accent?: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-xs uppercase tracking-[0.14em] text-ink-muted">
          {label}
        </label>
        <span className="font-mono-data text-sm text-ink">
          {value.toFixed(step < 1 ? 1 : 0)}
          <span className="text-ink-muted ml-0.5">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[--accent] h-1.5"
        style={
          {
            accentColor: accent,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

export interface ControlState {
  bodyMassKg: number;
  heightM: number;
  shoulderAngleDeg: number;
  elbowAngleDeg: number;
  externalLoadKg: number;
}

export default function ControlPanel({
  state,
  onChange,
}: {
  state: ControlState;
  onChange: (s: ControlState) => void;
}) {
  const set = <K extends keyof ControlState>(key: K, v: number) =>
    onChange({ ...state, [key]: v });

  return (
    <div>
      <div className="text-xs uppercase tracking-[0.18em] text-brass mb-4">
        Subject
      </div>
      <Slider
        label="Body mass"
        value={state.bodyMassKg}
        min={40}
        max={130}
        step={1}
        unit="kg"
        onChange={(v) => set("bodyMassKg", v)}
        accent="#8b98a5"
      />
      <Slider
        label="Height"
        value={state.heightM}
        min={1.4}
        max={2.1}
        step={0.01}
        unit="m"
        onChange={(v) => set("heightM", v)}
        accent="#8b98a5"
      />

      <div className="h-px bg-line my-5" />

      <div className="text-xs uppercase tracking-[0.18em] text-brass mb-4">
        Pose
      </div>
      <Slider
        label="Shoulder angle"
        value={state.shoulderAngleDeg}
        min={0}
        max={180}
        step={1}
        unit="°"
        onChange={(v) => set("shoulderAngleDeg", v)}
        accent="#e0a83e"
      />
      <Slider
        label="Elbow angle"
        value={state.elbowAngleDeg}
        min={30}
        max={180}
        step={1}
        unit="°"
        onChange={(v) => set("elbowAngleDeg", v)}
        accent="#e0a83e"
      />

      <div className="h-px bg-line my-5" />

      <div className="text-xs uppercase tracking-[0.18em] text-brass mb-4">
        Load
      </div>
      <Slider
        label="Hand-held load"
        value={state.externalLoadKg}
        min={0}
        max={20}
        step={0.5}
        unit="kg"
        onChange={(v) => set("externalLoadKg", v)}
        accent="#e2654b"
      />
    </div>
  );
}
