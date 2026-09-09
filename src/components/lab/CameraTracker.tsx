"use client";

import { useEffect, useRef, useState } from "react";

type Keypoint = { x: number; y: number; score?: number; name?: string };

export interface DetectedPose {
  shoulderAngleDeg: number;
  elbowAngleDeg: number;
  confidence: number;
}

function angleBetween(a: Keypoint, vertex: Keypoint, b: Keypoint) {
  const v1 = { x: a.x - vertex.x, y: a.y - vertex.y };
  const v2 = { x: b.x - vertex.x, y: b.y - vertex.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.hypot(v1.x, v1.y);
  const mag2 = Math.hypot(v2.x, v2.y);
  if (mag1 === 0 || mag2 === 0) return 0;
  const cos = Math.min(1, Math.max(-1, dot / (mag1 * mag2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

export default function CameraTracker({
  active,
  onPose,
}: {
  active: boolean;
  onPose: (pose: DetectedPose | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading-model" | "requesting-camera" | "running" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!active) {
      cleanup();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting to idle on prop-driven teardown, not a derived-render loop
      setStatus("idle");
      return;
    }

    let cancelled = false;
    let detector: import("@tensorflow-models/pose-detection").PoseDetector | null =
      null;

    async function start() {
      try {
        setStatus("loading-model");
        const tf = await import("@tensorflow/tfjs");
        await import("@tensorflow/tfjs-backend-webgl");
        await tf.setBackend("webgl");
        await tf.ready();
        const poseDetection = await import("@tensorflow-models/pose-detection");

        detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
        );
        if (cancelled) return;

        setStatus("requesting-camera");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 480, height: 360, facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus("running");

        const loop = async () => {
          if (cancelled || !videoRef.current || !detector) return;
          const video = videoRef.current;
          if (video.readyState >= 2) {
            const poses = await detector.estimatePoses(video, {
              flipHorizontal: true,
            });
            drawAndReport(poses[0]?.keypoints as Keypoint[] | undefined);
          }
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setErrorMsg(
          err instanceof Error ? err.message : "Could not access camera or model."
        );
      }
    }

    function drawAndReport(keypoints?: Keypoint[]) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = video.videoWidth || 480;
      canvas.height = video.videoHeight || 360;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      if (!keypoints) {
        onPose(null);
        return;
      }

      const byName: Record<string, Keypoint> = {};
      keypoints.forEach((k) => {
        if (k.name) byName[k.name] = k;
      });

      const shoulder = byName["right_shoulder"];
      const elbow = byName["right_elbow"];
      const wrist = byName["right_wrist"];
      const hip = byName["right_hip"];

      // Draw skeleton points
      ctx.fillStyle = "#5ec8c2";
      keypoints.forEach((k) => {
        if ((k.score ?? 0) > 0.3) {
          ctx.beginPath();
          ctx.arc(k.x, k.y, 4, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
      ctx.strokeStyle = "#e0a83e";
      ctx.lineWidth = 2.5;
      const bones: [Keypoint | undefined, Keypoint | undefined][] = [
        [shoulder, elbow],
        [elbow, wrist],
        [shoulder, hip],
      ];
      bones.forEach(([p1, p2]) => {
        if (p1 && p2 && (p1.score ?? 0) > 0.3 && (p2.score ?? 0) > 0.3) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });

      if (
        shoulder &&
        elbow &&
        wrist &&
        hip &&
        (shoulder.score ?? 0) > 0.4 &&
        (elbow.score ?? 0) > 0.4 &&
        (hip.score ?? 0) > 0.4
      ) {
        // Shoulder angle: angle between the downward torso line (hip) and
        // the upper arm (elbow), measured at the shoulder vertex.
        const shoulderAngleDeg = angleBetween(hip, shoulder, elbow);
        const elbowAngleDeg =
          (wrist.score ?? 0) > 0.4 ? angleBetween(shoulder, elbow, wrist) : 180;
        const confidence = Math.min(
          shoulder.score ?? 0,
          elbow.score ?? 0,
          hip.score ?? 0
        );
        onPose({ shoulderAngleDeg, elbowAngleDeg, confidence });
      } else {
        onPose(null);
      }
    }

    start();

    return () => {
      cancelled = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function cleanup() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  useEffect(() => () => cleanup(), []);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-surface">
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="max-w-full max-h-full rounded" />
      {status !== "running" && (
        <div className="absolute inset-0 flex items-center justify-center text-center px-6">
          <p className="text-sm text-ink-muted font-mono-data">
            {status === "idle" && "Camera mode is off."}
            {status === "loading-model" && "Loading pose model…"}
            {status === "requesting-camera" && "Requesting camera access…"}
            {status === "error" && (errorMsg || "Camera unavailable.")}
          </p>
        </div>
      )}
    </div>
  );
}
