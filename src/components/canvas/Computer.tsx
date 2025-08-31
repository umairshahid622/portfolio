// Computer.tsx
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Preload, useGLTF } from "@react-three/drei";
import { Suspense } from "react";
import CanvasLoader from "../CanvasLoader";

function Computer() {
  const { scene } = useGLTF("./desktop_pc/scene.gltf");
  return (
    <mesh>
      <hemisphereLight intensity={3} groundColor="black" />
      <pointLight intensity={3} />
      <primitive object={scene} scale={1} position={[0, -1, -1.5]} />
    </mesh>
  );
}

export default function ComputerCanvas() {
  return (
    <Canvas
      className="!absolute"
      shadows
      frameloop="demand"
      camera={{ position: [25, 5, 20], fov: 30 }}
      gl={{ preserveDrawingBuffer: true }}
    >
      <Suspense fallback={<CanvasLoader />}>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2.5}
        />
        <Computer />
      </Suspense>
      <Preload all />
    </Canvas>
  );
}
