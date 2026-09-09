import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between border-b border-line">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brass" />
          <span className="font-display text-lg tracking-tight">
            Digital Biomechanics Laboratory
          </span>
        </div>
        <Link
          href="/experiments"
          className="text-xs uppercase tracking-wide px-4 py-2 rounded-full border border-line hover:border-brass hover:text-brass transition"
        >
          The 3 experiments
        </Link>
      </header>

      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 grid md:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brass mb-5">
              Instrument 01 — Gleno-humeral lever
            </p>
            <h1 className="font-display text-4xl md:text-5xl leading-[1.08] mb-6">
              Lifting a 2&nbsp;kg weight can cost your shoulder
              <span className="text-teal"> 40&nbsp;kg</span> of muscle force.
            </h1>
            <p className="text-ink-muted text-base leading-relaxed mb-8 max-w-md">
              The deltoid pulls on a lever barely two centimeters long. Raise
              your arm to the side and gravity gets the long end of that
              lever — the short end has to fight back proportionally harder.
              This lab makes that trade visible, in real time, on your own
              body or a slider-driven model.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/experiments"
                className="px-5 py-3 rounded bg-brass text-[#10161b] text-sm font-medium hover:brightness-110 transition"
              >
                Start the 3 experiments
              </Link>
              <Link
                href="/lab"
                className="text-xs text-ink-muted hover:text-ink font-mono-data transition"
              >
                or try the free-form simulator →
              </Link>
            </div>
          </div>

          <HeroDiagram />
        </section>

        <section className="border-t border-line">
          <div className="max-w-5xl mx-auto px-6 py-16 grid sm:grid-cols-3 gap-8">
            <Feature
              index="01"
              title="Biomechanics engine"
              body="Two-segment arm chain built on Winter's anthropometric tables — real mass fractions, real lever arms, real torque."
            />
            <Feature
              index="02"
              title="Manual simulator"
              body="Drag shoulder angle, elbow angle, body size, and hand load. Watch the 3D rig and the gauges respond instantly."
            />
            <Feature
              index="03"
              title="Camera-driven mode"
              body="Point a webcam at yourself. Pose estimation reads your actual joint angles and drives the same physics engine live."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-line px-6 py-6 text-xs text-ink-muted flex justify-between">
        <span>Digital Biomechanics Laboratory — MVP build</span>
        <span className="font-mono-data">v0.1 · weeks 1–4</span>
      </footer>
    </div>
  );
}

function Feature({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <div className="border-t border-brass pt-4">
      <div className="font-mono-data text-xs text-brass mb-2">{index}</div>
      <h3 className="font-display text-lg mb-2">{title}</h3>
      <p className="text-sm text-ink-muted leading-relaxed">{body}</p>
    </div>
  );
}

function HeroDiagram() {
  return (
    <div className="relative rounded-lg border border-line bg-surface p-6">
      <svg viewBox="0 0 300 300" className="w-full">
        {/* protractor arc */}
        <path
          d="M 150 260 A 110 110 0 0 1 260 150"
          fill="none"
          stroke="#2a3540"
          strokeWidth="1.5"
        />
        {/* torso */}
        <rect x="128" y="220" width="44" height="70" rx="6" fill="#232f39" />
        {/* upper arm */}
        <line
          x1="150"
          y1="230"
          x2="230"
          y2="150"
          stroke="#d7dbe0"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* forearm */}
        <line
          x1="230"
          y1="150"
          x2="255"
          y2="205"
          stroke="#c3c9d0"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* load */}
        <rect x="246" y="205" width="18" height="18" rx="3" fill="#e2654b" />
        {/* joints */}
        <circle cx="150" cy="230" r="7" fill="#e0a83e" />
        <circle cx="230" cy="150" r="6" fill="#eceff2" />
        {/* moment arm annotation */}
        <line
          x1="150"
          y1="230"
          x2="255"
          y2="223"
          stroke="#5ec8c2"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <text x="190" y="215" fontSize="10" fill="#5ec8c2" fontFamily="var(--font-mono)">
          moment arm
        </text>
        <text x="200" y="285" fontSize="10" fill="#8b98a5" fontFamily="var(--font-mono)">
          shoulder flexion
        </text>
      </svg>
      <p className="text-[11px] text-ink-muted text-center mt-2">
        Live geometry from the actual engine — not a static illustration.
      </p>
    </div>
  );
}
