"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  experiment1,
  experiment2,
  experiment2Curve,
  experiment3,
  experiment3Curve,
} from "@/lib/experiments";
import PredictionQuiz, { QuizRecord } from "@/components/lab/PredictionQuiz";
import { computeTension } from "@/lib/tension";
import TensionBar from "@/components/lab/TensionBar";
import CameraTracker, { DetectedPose } from "@/components/lab/CameraTracker";
import {
  Line as RLine,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceDot,
  Tooltip,
} from "recharts";

const ExperimentCanvas = dynamic(() => import("@/components/lab/ExperimentCanvas"), {
  ssr: false,
  loading: () => <SceneLoading />,
});
const Exp1Scene = dynamic(() => import("@/components/lab/scenes/Exp1Scene"), { ssr: false });
const Exp2Scene = dynamic(() => import("@/components/lab/scenes/Exp2Scene"), { ssr: false });
const Exp3Scene = dynamic(() => import("@/components/lab/scenes/Exp3Scene"), { ssr: false });

function SceneLoading() {
  return (
    <div className="h-full w-full flex items-center justify-center text-ink-muted text-sm">
      Loading 3D scene…
    </div>
  );
}

type ExpId = "exp1" | "exp2" | "exp3";

function ReadoutCard({ label, value, unit, accent = "#e0a83e" }: { label: string; value: number; unit: string; accent?: string }) {
  return (
    <div className="rounded border border-line bg-surface-raised px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1">{label}</div>
      <div className="font-mono-data text-2xl" style={{ color: accent }}>
        {value.toFixed(2)} <span className="text-sm text-ink-muted">{unit}</span>
      </div>
    </div>
  );
}

function CameraFeedBlock({
  confidence,
  onPose,
}: {
  confidence: number | null;
  onPose: (pose: DetectedPose | null) => void;
}) {
  return (
    <div className="mb-5">
      <div className="text-xs uppercase tracking-[0.14em] text-ink-muted mb-2">
        Camera feed
      </div>
      <div className="aspect-[4/3] rounded overflow-hidden border border-line mb-2">
        <CameraTracker active={true} onPose={onPose} />
      </div>
      <p className="text-[11px] text-ink-muted leading-relaxed mb-2">
        Stand side-on with your right shoulder visible and raise your arm —
        the tracked shoulder angle drives this experiment live.
      </p>
      <div className="text-xs font-mono-data text-ink-muted">
        Tracking confidence:{" "}
        <span className={confidence && confidence > 0.4 ? "text-teal" : "text-vermilion"}>
          {confidence ? `${(confidence * 100).toFixed(0)}%` : "—"}
        </span>
      </div>
    </div>
  );
}

function MiniSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-xs uppercase tracking-[0.14em] text-ink-muted">{label}</label>
        <span className="font-mono-data text-sm text-ink">
          {value.toFixed(step < 1 ? 2 : 0)}
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
        className="w-full h-1.5"
        style={{ accentColor: "#e0a83e" }}
      />
    </div>
  );
}

export default function ExperimentsPage() {
  const [tab, setTab] = useState<ExpId>("exp1");
  const [inputMode, setInputMode] = useState<"manual" | "camera">("manual");
  const [liveConfidence, setLiveConfidence] = useState<number | null>(null);
  const [quizHistory, setQuizHistory] = useState<Record<ExpId, QuizRecord[]>>({
    exp1: [],
    exp2: [],
    exp3: [],
  });

  // Experiment 1 state
  const [loadKg1, setLoadKg1] = useState(2);
  const [loadDist, setLoadDist] = useState(0.3);
  const exp1 = useMemo(() => experiment1(loadDist, loadKg1), [loadDist, loadKg1]);
  const tension1 = useMemo(() => computeTension(exp1.torqueNm, 30), [exp1.torqueNm]);

  // Experiment 2 state
  const [loadKg2, setLoadKg2] = useState(2);
  const [angle2, setAngle2] = useState(90);
  const exp2 = useMemo(() => experiment2(angle2, loadKg2), [angle2, loadKg2]);
  const exp2Curve = useMemo(() => experiment2Curve(loadKg2), [loadKg2]);
  const tension2 = useMemo(() => computeTension(exp2.torqueNm, 30), [exp2.torqueNm]);

  // Experiment 3 state
  const [angle3, setAngle3] = useState(90);
  const [insertionFrac, setInsertionFrac] = useState(0.35);
  const [muscleForce, setMuscleForce] = useState(300);
  const exp3 = useMemo(
    () => experiment3(angle3, insertionFrac, muscleForce),
    [angle3, insertionFrac, muscleForce]
  );
  const exp3Curve = useMemo(() => experiment3Curve(angle3, muscleForce), [angle3, muscleForce]);
  const tension3 = useMemo(() => computeTension(muscleForce, 800), [muscleForce]);

  function recordQuiz(id: ExpId, r: QuizRecord) {
    setQuizHistory((h) => ({ ...h, [id]: [...h[id], r] }));
  }

  // Camera pose drives the joint-angle variable of whichever experiment is
  // active (Experiment 2's shoulder angle, or Experiment 3's shoulder angle).
  // Experiment 1 manipulates load position, not an angle, so camera mode has
  // nothing to drive there.
  function handlePose(pose: DetectedPose | null) {
    if (!pose) {
      setLiveConfidence(null);
      return;
    }
    setLiveConfidence(pose.confidence);
    if (tab === "exp2") {
      setAngle2(Math.round(Math.min(180, Math.max(0, pose.shoulderAngleDeg))));
    } else if (tab === "exp3") {
      setAngle3(Math.round(Math.min(150, Math.max(0, pose.shoulderAngleDeg))));
    }
  }

  const TABS: { id: ExpId; label: string }[] = [
    { id: "exp1", label: "1 · Load position" },
    { id: "exp2", label: "2 · Joint angle" },
    { id: "exp3", label: "3 · Muscle line of pull" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brass" />
          <span className="font-display text-lg tracking-tight">Digital Biomechanics Laboratory</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-surface rounded-full p-1 border border-line">
            {(["manual", "camera"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setInputMode(m)}
                className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wide transition ${
                  inputMode === m
                    ? "bg-brass text-[#10161b] font-medium"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {m === "manual" ? "Manual sliders" : "Camera pose"}
              </button>
            ))}
          </div>
          <Link href="/lab" className="text-xs uppercase tracking-wide text-ink-muted hover:text-ink transition">
            Free-form simulator →
          </Link>
        </div>
      </header>

      <div className="border-b border-line px-6 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-xs uppercase tracking-wide whitespace-nowrap border-b-2 transition ${
              tab === t.id ? "border-brass text-brass" : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <main className="flex-1">
        {tab === "exp1" && (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px]">
            <aside className="border-r border-line p-6 order-2 lg:order-1">
              <p className="text-sm text-ink-muted leading-relaxed mb-6">
                &ldquo;What happens to shoulder torque when I move the same weight
                farther away from the shoulder?&rdquo;
              </p>
              {inputMode === "camera" && (
                <p className="text-[11px] text-vermilion leading-relaxed mb-4 border border-vermilion/40 rounded px-3 py-2">
                  Camera mode drives joint angle — this experiment varies load
                  position instead, so the sliders below still apply. Switch
                  to Experiment 2 or 3 to drive the scene with your camera.
                </p>
              )}
              <MiniSlider label="Load position" value={loadDist} min={0.1} max={0.618} step={0.01} unit=" m" onChange={setLoadDist} />
              <MiniSlider label="Load mass" value={loadKg1} min={1} max={5} step={0.5} unit=" kg" onChange={setLoadKg1} />
              <p className="text-[11px] text-ink-muted leading-relaxed mt-6">
                Shoulder held fixed at 90°. Slide the load closer to or farther
                from the shoulder and watch the moment arm — and torque —
                change, with the load&apos;s weight unchanged.
              </p>
            </aside>
            <section className="order-1 lg:order-2 min-h-[420px] border-b lg:border-b-0 border-line">
              <ExperimentCanvas>
                <Exp1Scene loadDistanceM={loadDist} tensionFrac={tension1} />
              </ExperimentCanvas>
            </section>
            <aside className="border-l border-line p-6 order-3 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <ReadoutCard label="Moment arm" value={exp1.momentArmM} unit="m" accent="#f0b429" />
                <ReadoutCard label="Torque" value={exp1.torqueNm} unit="N·m" accent="#5ec8c2" />
              </div>
              <TensionBar tensionFrac={tension1} />
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-brass mb-3">Predict &amp; check</div>
                <PredictionQuiz
                  actualForce={exp1.torqueNm}
                  onScored={(r) => recordQuiz("exp1", r)}
                  prompt="Predict the external torque at the shoulder for this load position."
                  unit="N·m"
                />
              </div>
              <p className="text-[11px] text-ink-muted leading-relaxed">
                Torque = Force × Moment arm. The same 2kg weight produces
                different torque depending only on where it sits — this is the
                relationship every later experiment builds on.
              </p>
            </aside>
          </div>
        )}

        {tab === "exp2" && (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px]">
            <aside className="border-r border-line p-6 order-2 lg:order-1">
              <p className="text-sm text-ink-muted leading-relaxed mb-6">
                &ldquo;If I hold the same weight, why does torque change as I move
                my shoulder through different angles?&rdquo;
              </p>
              {inputMode === "camera" ? (
                <CameraFeedBlock confidence={liveConfidence} onPose={handlePose} />
              ) : (
                <MiniSlider label="Shoulder angle" value={angle2} min={0} max={180} step={1} unit="°" onChange={setAngle2} />
              )}
              <MiniSlider label="Load mass" value={loadKg2} min={1} max={5} step={0.5} unit=" kg" onChange={setLoadKg2} />
              <p className="text-[11px] text-ink-muted leading-relaxed mt-6">
                Load and arm length fixed. Moment arm = arm length × sin(angle)
                — it grows to a maximum at 90° and shrinks again on either
                side, because M.A. is the perpendicular distance from the
                joint axis to the force&apos;s line of action.
              </p>
            </aside>
            <section className="order-1 lg:order-2 min-h-[420px] border-b lg:border-b-0 border-line">
              <ExperimentCanvas>
                <Exp2Scene shoulderAngleDeg={angle2} tensionFrac={tension2} />
              </ExperimentCanvas>
            </section>
            <aside className="border-l border-line p-6 order-3 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <ReadoutCard label="Moment arm" value={exp2.momentArmM} unit="m" accent="#f0b429" />
                <ReadoutCard label="Torque" value={exp2.torqueNm} unit="N·m" accent="#5ec8c2" />
              </div>
              <TensionBar tensionFrac={tension2} />
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-brass mb-3">Across the full range</div>
                <div className="h-36 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={exp2Curve} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid stroke="#2a3540" strokeDasharray="2 4" vertical={false} />
                      <XAxis dataKey="angle" tick={{ fill: "#8b98a5", fontSize: 10 }} stroke="#2a3540" ticks={[0, 30, 60, 90, 120, 150, 180]} tickFormatter={(v) => `${v}°`} />
                      <YAxis tick={{ fill: "#8b98a5", fontSize: 10 }} stroke="#2a3540" width={30} />
                      <Tooltip
                        contentStyle={{ background: "#171f26", border: "1px solid #2a3540", borderRadius: 6, fontSize: 12 }}
                        formatter={(v) => [`${Number(v ?? 0).toFixed(2)} N·m`, "Torque"]}
                        labelFormatter={(v) => `${v}°`}
                      />
                      <RLine type="monotone" dataKey="torque" stroke="#5ec8c2" strokeWidth={2} dot={false} />
                      <ReferenceDot x={angle2} y={exp2.torqueNm} r={4} fill="#5ec8c2" stroke="#10161b" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-brass mb-3">Predict &amp; check</div>
                <PredictionQuiz
                  actualForce={exp2.torqueNm}
                  onScored={(r) => recordQuiz("exp2", r)}
                  prompt="Predict the external torque at this shoulder angle."
                  unit="N·m"
                />
              </div>
            </aside>
          </div>
        )}

        {tab === "exp3" && (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px]">
            <aside className="border-r border-line p-6 order-2 lg:order-1">
              <p className="text-sm text-ink-muted leading-relaxed mb-6">
                &ldquo;Why does the direction a muscle pulls affect its ability to
                rotate a joint?&rdquo;
              </p>
              {inputMode === "camera" ? (
                <CameraFeedBlock confidence={liveConfidence} onPose={handlePose} />
              ) : (
                <MiniSlider label="Shoulder angle" value={angle3} min={0} max={150} step={1} unit="°" onChange={setAngle3} />
              )}
              <MiniSlider label="Insertion point" value={insertionFrac} min={0.1} max={0.9} step={0.01} unit="" onChange={setInsertionFrac} />
              <MiniSlider label="Muscle force" value={muscleForce} min={50} max={800} step={10} unit=" N" onChange={setMuscleForce} />
              <p className="text-[11px] text-ink-muted leading-relaxed mt-6">
                A simplified single-muscle model (standing in for the
                deltoid). Moving where it inserts on the arm changes its line
                of pull — and its internal moment arm — independent of how
                hard it pulls. This is a teaching simplification, not real
                deltoid geometry.
              </p>
            </aside>
            <section className="order-1 lg:order-2 min-h-[420px] border-b lg:border-b-0 border-line">
              <ExperimentCanvas>
                <Exp3Scene
                  shoulderAngleDeg={angle3}
                  insertionFrac={insertionFrac}
                  origin={exp3.origin}
                  insertion={exp3.insertion}
                  tensionFrac={tension3}
                />
              </ExperimentCanvas>
            </section>
            <aside className="border-l border-line p-6 order-3 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <ReadoutCard label="Muscle moment arm" value={exp3.momentArmM * 100} unit="cm" accent="#c084fc" />
                <ReadoutCard label="Muscle torque" value={exp3.muscleTorqueNm} unit="N·m" accent="#5ec8c2" />
              </div>
              <TensionBar tensionFrac={tension3} />
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-brass mb-3">Vs. insertion point</div>
                <div className="h-36 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={exp3Curve} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid stroke="#2a3540" strokeDasharray="2 4" vertical={false} />
                      <XAxis
                        dataKey="insertionFrac"
                        tick={{ fill: "#8b98a5", fontSize: 10 }}
                        stroke="#2a3540"
                        tickFormatter={(v) => `${Math.round(v * 100)}%`}
                      />
                      <YAxis tick={{ fill: "#8b98a5", fontSize: 10 }} stroke="#2a3540" width={30} />
                      <Tooltip
                        contentStyle={{ background: "#171f26", border: "1px solid #2a3540", borderRadius: 6, fontSize: 12 }}
                        formatter={(v) => [`${Number(v ?? 0).toFixed(2)} N·m`, "Muscle torque"]}
                        labelFormatter={(v) => `Insertion ${Math.round(Number(v) * 100)}%`}
                      />
                      <RLine type="monotone" dataKey="torque" stroke="#c084fc" strokeWidth={2} dot={false} />
                      <ReferenceDot x={insertionFrac} y={exp3.muscleTorqueNm} r={4} fill="#c084fc" stroke="#10161b" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-brass mb-3">Predict &amp; check</div>
                <PredictionQuiz
                  actualForce={exp3.muscleTorqueNm}
                  onScored={(r) => recordQuiz("exp3", r)}
                  prompt="Predict the muscle torque produced at this insertion point."
                  unit="N·m"
                />
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
