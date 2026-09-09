# Digital Biomechanics Laboratory

An interactive arm-raise biomechanics simulator. Next.js + TypeScript +
Tailwind CSS v4 + Three.js (via react-three-fiber), with a webcam pose-driven
mode powered by TensorFlow.js MoveNet.

This scaffold implements the first month of the roadmap end-to-end:

| Week | Deliverable | Where it lives |
|---|---|---|
| 1–2 | Biomechanics engine — anthropometrics, forward kinematics, torque & muscle-force model | `src/lib/biomechanics.ts` |
| 3 | Manual slider-driven 3D simulation | `src/components/lab/ControlPanel.tsx`, `ArmScene.tsx`, `/lab` (Manual tab) |
| 3–4 | Live camera pose integration (MoveNet arm-angle tracking) | `src/components/lab/CameraTracker.tsx`, `/lab` (Camera tab) |
| 4 | Educational layer — prediction, comparison, scoring | `src/components/lab/PredictionQuiz.tsx` |

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The landing page routes to `/experiments` (the
3-experiment teaching flow) or `/lab` (the free-form simulator).

## Two ways to explore the lab

**`/experiments`** — the 3 experiments exactly as scoped: load position,
joint angle, and muscle line of pull, each isolating one variable at a time
with a human-like figure, moment-arm/force overlays matching the original
diagrams, a live chart, and a predict-then-check quiz. This is the primary
teaching flow.

**`/lab`** — the free-form simulator from the first build: full anthropometric
two-segment engine, manual sliders or live camera pose tracking, dial gauges.
Good for open-ended exploration once the core lever concept lands via
`/experiments`.

## The 3 experiments — architecture

`src/lib/experiments.ts` is a small, reusable engine — the same
`torque = force × moment arm` primitive powers all three:

| Experiment | What's fixed | What's manipulated | Where |
|---|---|---|---|
| 1 — Load position | Shoulder angle (90°), load mass | Distance of the load from the shoulder | `experiment1()` |
| 2 — Joint angle | Load mass, arm length | Shoulder elevation angle (0–180°) | `experiment2()` |
| 3 — Muscle line of pull | Shoulder angle, muscle force | Insertion point on the upper arm | `experiment3()` |

Each experiment scene (`src/components/lab/scenes/`) reuses a shared
`HumanBody` component (head, torso, shoulder joint, arm) and a shared set of
schematic overlays (`src/components/lab/schematic/Overlays.tsx`) — the yellow
moment-arm double-arrow, the red force vector, the green joint-axis marker,
and the angle arc — styled to match the original hand-drawn diagrams.



```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The landing page explains the physics thesis;
`/lab` is the working simulator with **Manual sliders** and **Camera pose**
modes.

Camera mode needs webcam permission and downloads the MoveNet model on first
use (client-side, cached by the browser afterward). It works over `https://`
or `http://localhost` — browsers block camera access on plain `http://` for
any other host.

## How the engine works

The arm is modeled as two segments (upper arm, forearm+hand) using standard
anthropometric mass/length/center-of-mass fractions (Winter, *Biomechanics
and Motor Control of Human Movement*). Given a shoulder angle, elbow angle,
body mass, height, and an optional hand-held load, `runEngine()`:

1. Computes forward kinematics (joint and center-of-mass positions).
2. Sums gravitational torque about the shoulder from each segment's weight
   plus the external load.
3. Divides by an angle-dependent deltoid moment-arm estimate to get the
   required muscle force — this is the "short lever" effect that's the whole
   point of the demo.

`torqueCurve()` sweeps the full 0–180° range at a fixed elbow angle, which
feeds the chart on the right-hand panel.

This is a teaching model, not a clinical or research-grade one: it's
single-plane, uses population-average anthropometric ratios rather than
subject-specific ones, and approximates the deltoid moment arm with a smooth
curve rather than measured EMG/imaging data. That's an intentional scope
choice for an MVP demo — swapping in per-subject anthropometry or a measured
moment-arm table later is a matter of extending `src/lib/biomechanics.ts`,
not restructuring the app.

## Real human 3D model

`/lab` has a "Real human model (beta)" toggle (top-right of the 3D view) that
swaps the stylized rig for **CesiumMan** — a real, textured, fully-rigged
human glTF model, public domain (CC0), pulled from Khronos Group's official
`glTF-Sample-Models` repository. It's not a placeholder or a purchased asset
— it's genuinely free for any use, including commercial.

The model file lives at `public/models/CesiumMan.glb` and loads via
`@react-three/drei`'s `useGLTF`. `src/components/lab/RealHumanModel.tsx`
bypasses the model's built-in walk-cycle animation and instead poses the
`Skeleton_arm_joint_R` bone directly, each frame, from `shoulderAngleDeg` —
same input the sliders and camera mode already produce.

**Honest limitation:** the rotation axis/sign mapping (`REST_OFFSET_DEG`,
`ANGLE_SCALE` in that file) was calibrated from the raw glTF bone data, not
from watching it move in a browser — I don't have a way to render and eyeball
Three.js output from here. If the arm swings the wrong way or through the
wrong range when you run it, that's a one-line constant to flip/tune in
`RealHumanModel.tsx`, not a structural problem.

**If you want a better-fitting or higher-quality human model**, these are
free but need a manual download (they require an account or a web app, so I
can't fetch them for you here):

- **[Mixamo](https://www.mixamo.com)** (Adobe, free with any Adobe ID) — big
  library of realistic rigged characters + a huge animation library,
  including arm-raise/reach animations you could retarget directly. Standard
  `mixamorig:` bone names.
- **[Ready Player Me](https://readyplayer.me)** — free full-body avatar
  creator, exports rigged glTF via a URL, Mixamo-compatible skeleton.
- **[Quaternius](https://quaternius.com)** — free CC0 low-poly rigged
  humanoid packs, glTF-ready, no account needed.

Drop any of those `.glb` files into `public/models/`, update `MODEL_URL` in
`RealHumanModel.tsx`, and update `ARM_BONE` to that model's right-upper-arm
bone name (open the file in [gltf.report](https://gltf.report) or Blender to
find it).



## Muscle tension — the "real model" feel

Every scene now visualizes strain, not just position: the working
shoulder/upper-arm reddens and gains a subtle glow as the required muscle
force rises, using `src/lib/tension.ts` (`computeTension()` maps a force or
torque value to 0-1; `tensionColor()`/`tensionEmissive()` map that to a
resting-skin-tone → flushed-red gradient). A `<TensionBar>` readout shows the
same 0-100% number next to the gauges on every page.

This is wired into all three human representations already in the app:

- **Stylized rig** (`HumanBody.tsx`) — the deltoid bulge and upper-arm bone
  tint directly, since we control exactly which mesh represents the muscle.
- **CesiumMan** (`RealHumanModel.tsx`) — this particular free model has a
  single material for the whole body (no separate "deltoid" mesh), so tension
  drives a subtle full-body flush rather than a localized one. The code is
  already written to auto-localize if you swap in a model with named muscle
  submeshes (see `ARM_MESH_NAME_PATTERN` — any mesh whose name matches
  arm/delt/shoulder/bicep/tricep gets the full effect; everything else gets a
  faint background flush).

**About the écorché/muscle-anatomy look you asked for** (arms-out, all
muscle groups visible, no skin): that specific style of asset lives on
Sketchfab/TurboSquid/CGTrader, not on GitHub, and those sites aren't reachable
from this build environment — I can point you to it but can't fetch it
myself. The closest free match I found:

- **["Male base muscular anatomy" by CharacterZone](https://sketchfab.com/3d-models/male-base-muscular-anatomy-0954aa04666d45aab9633009318f7b66)**
  on Sketchfab — free, T-pose, full muscular detail, explicitly built for
  anatomy study. This looks like the source of the reference image.

To use it: download it as glTF Binary (.glb) from Sketchfab's download panel,
drop the file in `public/models/`, then in `RealHumanModel.tsx` update
`MODEL_URL` to point at it and `ARM_BONE` to that model's actual right-arm
bone name (open the file at [gltf.report](https://gltf.report) to see its
node names — muscular-anatomy models often *do* separate meshes per muscle
group, which is exactly what `ARM_MESH_NAME_PATTERN` is built to take
advantage of once you check what those meshes are actually called). If it
isn't rigged/skinned, you'll need Blender's Rigify or a Mixamo auto-rig pass
before the angle-driving code in this file will work — I can walk through
that step by step once you've got the file, since that has to happen inside
a tool I can't run headlessly.

## Real anatomical muscle model (not stylized)

`/lab` has a third view: **"Real muscle anatomy."** This is genuine,
individually-named anatomical geometry — not a placeholder, not a capsule
figure — sourced from the BodyParts3D/Anatomography dataset via the
[Kevin-Mattheus-Moerman/BodyParts3D](https://github.com/Kevin-Mattheus-Moerman/BodyParts3D)
GitHub mirror (CC BY-SA 2.1 Japan). It assembles **40 real anatomical
structures** into one full shoulder-to-fingertip arm (`src/components/lab/AnatomicalArm.tsx`):

- **Shoulder/upper arm bone:** clavicle, scapula, humerus
- **Shoulder muscle:** deltoid (clavicular / acromial / spinal heads),
  biceps brachii (short / long heads), triceps brachii (medial / lateral /
  long heads)
- **Forearm bone:** radius, ulna
- **Hand bone:** all 8 carpals, all 5 metacarpals, all 14 phalanges (full
  hand skeleton, individually named)

All 40 files come from the same underlying body scan and share one
coordinate space — confirmed by inspecting their bounding boxes before
building this, so no manual per-part placement was needed; they assemble
correctly just by loading them together.

**Rig:** three nested Three.js groups matching how the joints actually
chain — torso (fixed: clavicle, scapula) → upper arm (rotates on
`shoulderAngleDeg` around the shoulder pivot: humerus + all 8 muscle heads)
→ forearm+hand (rotates on elbow flexion around the elbow pivot, nested
inside the upper-arm group so it inherits the shoulder rotation
automatically: radius, ulna, and the full hand skeleton). No finger
articulation — the hand is rigid, matching what was asked for (forearm/hand
*bones*, not per-finger posing).

**This got visually verified before shipping**, the same way the shoulder
version did: I rendered the actual transform pipeline (both pivots, axis
remap, nested rotation) with matplotlib at several shoulder/elbow angle
combinations and confirmed the arm swings cleanly from hanging-down to
horizontal, and the elbow flexes the forearm+hand correctly relative to the
already-rotated upper arm, with no distortion at any tested angle — not a
disclaimer, an actual checked result.

**Attachment pins:** small yellow markers at each shoulder muscle's origin,
in the style of the reference anatomy app's interactive pins. Positions were
computed geometrically (centroid of each muscle's proximal-most ~4% of
vertices) rather than pulled from a specific anatomical atlas — a reasonable
approximation for a teaching visual, not a citation-grade coordinate. Toggle
with the `showPins` prop on `AnatomicalArm`.

Muscle color starts at a resting deep-red tissue tone (this is exposed
muscle, matching the reference image — not skin) and shifts toward the same
strained-red used everywhere else in the app as `tensionFrac` rises. Bone
stays a fixed ivory tone throughout.

**Known limitations:** covers the arm only (shoulder to fingertips), not the
rest of the body. Non-manifold/display-oriented geometry from the dataset,
not simulation-grade. Wrist and finger joints are rigid (no articulation) —
extending that would mean giving each hand bone its own pivot, same
technique, more engineering. And per the dataset's own README, the skin
surface (FMA7163) is explicitly flagged as messy — which is why this view
shows exposed muscle rather than a skinned body, matching the reference
image rather than fighting the data.

**About the exact reference image you're matching against:** that
specific look (smooth PBR shading, "SHOW INTERFACE" button, interactive
pins) is almost certainly from **3D Anatomy for the Artist** by Catfish
Animation Studio — a free app (skeleton free, muscles in-app purchase) on
[Google Play](https://play.google.com/store/apps/details?id=com.catfishanimationstudio.AnatomyForTheArtistLite)
and Microsoft Store. Those are that studio's own commercial 3D assets, not
open data — this model can't and won't try to reproduce their exact files.
Everything above is built from a genuinely free, separately-licensed dataset
instead.

## Camera mode notes

`CameraTracker.tsx` loads MoveNet SINGLEPOSE_LIGHTNING, reads
`right_shoulder` / `right_elbow` / `right_wrist` / `right_hip` keypoints, and
derives the same two angles the manual sliders control — so both modes drive
the identical physics engine. Confidence is shown live; low-confidence poses
are ignored rather than fed into the engine.

## What's next (weeks 5–12, per the original roadmap)

- Two-arm and frontal-plane tracking (currently sagittal-plane, one arm).
- Scoring/assessment persistence (currently in-memory per session).
- Internal testing pass with students/faculty, then the first institutional
  pilot.

## Notes on this build

- Fonts use system stacks (serif display / sans body / mono data) rather than
  `next/font/google`, since this sandbox has no network access to Google
  Fonts. Swapping in Fraunces / Inter / IBM Plex Mono via `next/font/google`
  once deployed is a two-line change in `src/app/layout.tsx` if you want the
  exact typefaces from the design plan.
- `next.config.ts` aliases `@mediapipe/pose` to an empty stub — the
  pose-detection package statically imports it even though this project only
  uses the TensorFlow.js MoveNet backend, not the MediaPipe runtime.
