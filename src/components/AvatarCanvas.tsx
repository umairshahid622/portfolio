import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center, Float, Html, useProgress } from "@react-three/drei";
import * as THREE from "three";

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 bg-dark-surface/80 dark:bg-dark-surface/90 px-4 py-2.5 rounded-xl border border-white/10 backdrop-blur-md shadow-xl text-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-orange border-t-transparent animate-spin" />
        <span className="text-xs font-medium tracking-wider uppercase text-zinc-300">
          Loading 3D Avatar {progress.toFixed(0)}%
        </span>
      </div>
    </Html>
  );
}

function AvatarModel() {
  const { scene } = useGLTF("/my3dAvatar.glb");
  const avatarRef = useRef<THREE.Group>(null);

  // Smooth interactive mouse tracking around base forward-facing angle
  useFrame((state) => {
    if (!avatarRef.current) return;
    const baseRotationY = -Math.PI / 2; // Facing front
    const targetY = baseRotationY + (state.pointer.x * Math.PI) / 6;
    const targetX = (-state.pointer.y * Math.PI) / 16;
    
    avatarRef.current.rotation.y = THREE.MathUtils.lerp(
      avatarRef.current.rotation.y,
      targetY,
      0.06
    );
    avatarRef.current.rotation.x = THREE.MathUtils.lerp(
      avatarRef.current.rotation.x,
      targetX,
      0.06
    );
  });

  return (
    <group ref={avatarRef} rotation={[0, -Math.PI / 2, 0]}>
      <Center>
        <primitive object={scene} scale={1.35} />
      </Center>
    </group>
  );
}

useGLTF.preload("/my3dAvatar.glb");

export default function AvatarCanvas() {
  return (
    <div className="w-full h-[50vh] min-h-[360px] max-h-[500px] relative flex items-center justify-center">
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[2, 4, 3]} intensity={2.2} castShadow />
        <directionalLight position={[-3, 2, 2]} intensity={1.2} color="#ff7d00" />
        <directionalLight position={[0, -2, -2]} intensity={0.6} color="#15616d" />

        <Suspense fallback={<Loader />}>
          <Float speed={1.8} rotationIntensity={0.15} floatIntensity={0.15}>
            <AvatarModel />
          </Float>
        </Suspense>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={(2 * Math.PI) / 3}
          rotateSpeed={0.8}
        />
      </Canvas>
    </div>
  );
}
