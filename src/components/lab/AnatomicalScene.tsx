"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import AnatomicalArm from "@/components/lab/AnatomicalArm";

export default function AnatomicalScene({
  shoulderAngleDeg,
  elbowAngleDeg = 180,
  tensionFrac = 0,
}: {
  shoulderAngleDeg: number;
  elbowAngleDeg?: number;
  tensionFrac?: number;
}) {
  return (
    <div className="h-full w-full">
      <Canvas shadows dpr={[1, 1.8]} camera={{ position: [0.9, 0.15, 1.1], fov: 38 }}>
        <color attach="background" args={["#10161b"]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[1.2, 1.6, 1.2]} intensity={1.2} castShadow />
        <directionalLight position={[-1.2, 0.4, -0.8]} intensity={0.3} color="#5ec8c2" />
        <Suspense
          fallback={
            <mesh>
              <boxGeometry args={[0.01, 0.01, 0.01]} />
              <meshBasicMaterial visible={false} />
            </mesh>
          }
        >
          <AnatomicalArm
            shoulderAngleDeg={shoulderAngleDeg}
            elbowAngleDeg={elbowAngleDeg}
            tensionFrac={tensionFrac}
          />
        </Suspense>
        <OrbitControls enablePan={false} minDistance={0.4} maxDistance={2.5} target={[-0.1, -0.4, 0]} />
      </Canvas>
    </div>
  );
}
