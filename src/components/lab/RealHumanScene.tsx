"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import RealHumanModel from "@/components/lab/RealHumanModel";

export default function RealHumanScene({
  shoulderAngleDeg,
  tensionFrac = 0,
}: {
  shoulderAngleDeg: number;
  tensionFrac?: number;
}) {
  return (
    <div className="h-full w-full">
      <Canvas shadows dpr={[1, 1.8]} camera={{ position: [1.1, 0.3, 1.6], fov: 40 }}>
        <color attach="background" args={["#10161b"]} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[1.5, 2.2, 1.5]} intensity={1.2} castShadow />
        <directionalLight position={[-1.5, 0.6, -1]} intensity={0.3} color="#5ec8c2" />
        <Suspense
          fallback={
            <mesh>
              <boxGeometry args={[0.01, 0.01, 0.01]} />
              <meshBasicMaterial visible={false} />
            </mesh>
          }
        >
          <RealHumanModel shoulderAngleDeg={shoulderAngleDeg} tensionFrac={tensionFrac} />
        </Suspense>
        <OrbitControls enablePan={false} minDistance={0.8} maxDistance={3} target={[0, 0.1, 0]} />
      </Canvas>
    </div>
  );
}
