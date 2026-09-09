"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export default function ExperimentCanvas({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full w-full">
      <Canvas
        shadows
        dpr={[1, 1.8]}
        camera={{ position: [0.6, 0.05, 0.85], fov: 38 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#10161b"]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[1.2, 1.6, 1.2]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-1.2, 0.4, -0.8]} intensity={0.25} color="#5ec8c2" />
        <Suspense fallback={null}>{children}</Suspense>
        <OrbitControls enablePan={false} minDistance={0.5} maxDistance={2.2} target={[0.02, -0.2, 0]} />
      </Canvas>
    </div>
  );
}
