"use client";

import { useState } from "react";

export interface QuizRecord {
  guess: number;
  actual: number;
  errorPct: number;
}

export default function PredictionQuiz({
  actualForce,
  onScored,
  prompt = "Before checking the gauge — predict the deltoid force needed to hold this exact position.",
  unit = "N",
}: {
  actualForce: number;
  onScored: (r: QuizRecord) => void;
  prompt?: string;
  unit?: string;
}) {
  const [guess, setGuess] = useState("");
  const [revealed, setRevealed] = useState<QuizRecord | null>(null);

  function submit() {
    const g = parseFloat(guess);
    if (Number.isNaN(g)) return;
    const errorPct =
      actualForce > 0 ? (Math.abs(g - actualForce) / actualForce) * 100 : 0;
    const record = { guess: g, actual: actualForce, errorPct };
    setRevealed(record);
    onScored(record);
  }

  function next() {
    setRevealed(null);
    setGuess("");
  }

  return (
    <div>
      <p className="text-sm text-ink-muted mb-3">{prompt}</p>
      {!revealed ? (
        <div className="flex gap-2">
          <input
            type="number"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder={`Your guess (${unit})`}
            className="flex-1 bg-surface-raised border border-line rounded px-3 py-2 text-sm font-mono-data text-ink outline-none focus:border-brass"
          />
          <button
            onClick={submit}
            className="px-4 py-2 text-sm rounded bg-brass text-[#10161b] font-medium hover:brightness-110 transition"
          >
            Check
          </button>
        </div>
      ) : (
        <div className="rounded border border-line bg-surface-raised px-4 py-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-ink-muted">Your guess</span>
            <span className="font-mono-data">{revealed.guess.toFixed(2)} {unit}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-ink-muted">Actual</span>
            <span className="font-mono-data text-teal">
              {revealed.actual.toFixed(2)} {unit}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-3">
            <span className="text-ink-muted">Error</span>
            <span
              className={`font-mono-data ${
                revealed.errorPct < 15 ? "text-teal" : "text-vermilion"
              }`}
            >
              {revealed.errorPct.toFixed(0)}%
            </span>
          </div>
          <button
            onClick={next}
            className="text-xs uppercase tracking-wide text-brass hover:underline"
          >
            Try another pose →
          </button>
        </div>
      )}
    </div>
  );
}
