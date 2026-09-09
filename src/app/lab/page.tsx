"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import Link from "next/link";
import ControlPanel, { ControlState } from "@/components/lab/ControlPanel";
import Gauge from "@/components/lab/Gauge";
import ContributionBars from "@/components/lab/ContributionBars";
import TorqueCurveChart from "@/components/lab/TorqueCurveChart";
import PredictionQuiz, { QuizRecord } from "@/components/lab/PredictionQuiz";
import CameraTracker, { DetectedPose } from "@/components/lab/CameraTracker";
import { runEngine, torqueCurve } from "@/lib/biomechanics";
import { computeTension } from "@/lib/tension";
import TensionBar from "@/components/lab/TensionBar";

const ArmScene = dynamic(() => import("@/components/lab/ArmScene"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-ink-muted text-sm">
      Loading 3D scene…
    </div>
  ),
});

const RealHumanScene = dynamic(() => import("@/components/lab/RealHumanScene"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-ink-muted text-sm">
      Loading human model…
    </div>
  ),
});

const AnatomicalScene = dynamic(() => import("@/components/lab/AnatomicalScene"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-ink-muted text-sm">
      Loading anatomical model…
    </div>
  ),
});

const DEFAULT_STATE: ControlState = {
  bodyMassKg: 70,
  heightM: 1.75,
  shoulderAngleDeg: 90,
  elbowAngleDeg: 165,
  externalLoadKg: 2,
};

type Mode = "manual" | "camera";
type ViewMode = "real" | "anatomical" | "stylized";

export default function LabPage() {
  const [mode, setMode] = useState<Mode>("manual");
  const [view, setView] = useState<ViewMode>("real");
  const [state, setState] = useState<ControlState>(DEFAULT_STATE);
  const [liveConfidence, setLiveConfidence] = useState<number | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizRecord[]>([]);

  const output = useMemo(
    () =>
      runEngine(
        { bodyMassKg: state.bodyMassKg, heightM: state.heightM },
        { shoulderAngleDeg: state.shoulderAngleDeg, elbowAngleDeg: state.elbowAngleDeg },
        { externalLoadKg: state.externalLoadKg }
      ),
    [state]
  );

  const tension = useMemo(() => computeTension(output.muscleForceN, 800), [output.muscleForceN]);

  const curve = useMemo(
    () =>
      torqueCurve(
        { bodyMassKg: state.bodyMassKg, heightM: state.heightM },
        state.elbowAngleDeg,
        { externalLoadKg: state.externalLoadKg }
      ),
    [state.bodyMassKg, state.heightM, state.elbowAngleDeg, state.externalLoadKg]
  );

  function handlePose(pose: DetectedPose | null) {
    if (!pose) {
      setLiveConfidence(null);
      return;
    }
    setLiveConfidence(pose.confidence);
    setState((s) => ({
      ...s,
      shoulderAngleDeg: Math.round(pose.shoulderAngleDeg),
      elbowAngleDeg: Math.round(pose.elbowAngleDeg),
    }));
  }

  const avgError =
    quizHistory.length > 0
      ? quizHistory.reduce((sum, r) => sum + r.errorPct, 0) / quizHistory.length
      : null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="w-2 h-2 rounded-full bg-brass" />
          <span className="font-display text-lg tracking-tight">
            Digital Biomechanics Laboratory
          </span>
        </Link>
        <div className="flex items-center gap-1 bg-surface rounded-full p-1 border border-line">
          {(["manual", "camera"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wide transition ${
                mode === m
                  ? "bg-brass text-[#10161b] font-medium"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {m === "manual" ? "Manual sliders" : "Camera pose"}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_320px]">
        {/* Left: controls or camera feed */}
        <aside className="border-r border-line p-6 order-2 lg:order-1">
          {mode === "manual" ? (
            <ControlPanel state={state} onChange={setState} />
          ) : (
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-brass mb-4">
                Camera feed
              </div>
              <div className="aspect-[4/3] rounded overflow-hidden border border-line mb-3">
                <CameraTracker active={mode === "camera"} onPose={handlePose} />
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Stand side-on to the camera with your right shoulder visible.
                Raise your arm — the model tracks shoulder and elbow angle in
                real time and feeds it straight into the biomechanics engine.
              </p>
              <div className="mt-3 text-xs font-mono-data text-ink-muted">
                Tracking confidence:{" "}
                <span className={liveConfidence && liveConfidence > 0.4 ? "text-teal" : "text-vermilion"}>
                  {liveConfidence ? `${(liveConfidence * 100).toFixed(0)}%` : "—"}
                </span>
              </div>
              <div className="h-px bg-line my-5" />
              <div className="text-xs uppercase tracking-[0.18em] text-brass mb-4">
                Subject
              </div>
              <ControlPanel
                state={state}
                onChange={(s) =>
                  setState((prev) => ({
                    ...prev,
                    bodyMassKg: s.bodyMassKg,
                    heightM: s.heightM,
                    externalLoadKg: s.externalLoadKg,
                  }))
                }
              />
            </div>
          )}
        </aside>

        {/* Center: 3D scene */}
        <section className="order-1 lg:order-2 min-h-[420px] border-b lg:border-b-0 border-line relative">
          {view === "real" && (
            <RealHumanScene shoulderAngleDeg={state.shoulderAngleDeg} tensionFrac={tension} />
          )}
          {view === "anatomical" && (
            <AnatomicalScene
              shoulderAngleDeg={state.shoulderAngleDeg}
              elbowAngleDeg={state.elbowAngleDeg}
              tensionFrac={tension}
            />
          )}
          {view === "stylized" && (
            <ArmScene kinematics={output.kinematics} hasLoad={state.externalLoadKg > 0} tensionFrac={tension} />
          )}
          <div className="absolute top-4 right-4 flex gap-1 bg-ground/60 backdrop-blur rounded-full p-1 border border-line">
            {(
              [
                { id: "real" as ViewMode, label: "Real human" },
                { id: "anatomical" as ViewMode, label: "Real muscle anatomy" },
                { id: "stylized" as ViewMode, label: "Stylized rig" },
              ]
            ).map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] uppercase tracking-wide transition ${
                  view === v.id ? "bg-brass text-[#10161b] font-medium" : "text-ink-muted hover:text-ink"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <div className="absolute top-4 left-4 font-mono-data text-xs text-ink-muted bg-ground/60 backdrop-blur px-2 py-1 rounded">
            Shoulder {state.shoulderAngleDeg}° · Elbow {state.elbowAngleDeg}°
          </div>
        </section>

        {/* Right: readouts */}
        <aside className="border-l border-line p-6 order-3 space-y-6">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-brass mb-4">
              Instrument reading
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Gauge
                value={Math.abs(output.gravityTorqueNm)}
                max={120}
                label="Gravity torque"
                unit="N·m"
                accent="#e0a83e"
              />
              <Gauge
                value={output.muscleForceN}
                max={1200}
                label="Deltoid force"
                unit="N"
                accent="#5ec8c2"
              />
            </div>
            <div className="mt-4">
              <TensionBar tensionFrac={tension} />
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-brass mb-3">
              Torque breakdown
            </div>
            <ContributionBars contributions={output.contributions} />
            <p className="text-[11px] text-ink-muted mt-3 leading-relaxed">
              Moment arm at deltoid: {(output.muscleMomentArmM * 100).toFixed(1)} cm —
              a lever this short is why a {state.externalLoadKg}kg load can demand{" "}
              {output.muscleForceEquivKg.toFixed(0)}kg-equivalent of muscle force.
            </p>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-brass mb-3">
              Across the full range
            </div>
            <TorqueCurveChart data={curve} currentAngle={state.shoulderAngleDeg} />
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-brass mb-3">
              Predict &amp; check
            </div>
            <PredictionQuiz
              actualForce={output.muscleForceN}
              onScored={(r) => setQuizHistory((h) => [...h, r])}
            />
            {avgError !== null && (
              <p className="text-[11px] text-ink-muted mt-3">
                {quizHistory.length} attempt{quizHistory.length === 1 ? "" : "s"} ·
                avg. error {avgError.toFixed(0)}%
              </p>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
