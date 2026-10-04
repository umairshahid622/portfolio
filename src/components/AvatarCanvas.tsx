import { Suspense, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, useAnimations, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { useLoading } from "../context/LoadingContext";

interface AvatarModelProps {
  animation?: "idle" | "handsToPockets";
  onReady?: () => void;
}

function AvatarModel({ animation = "idle", onReady }: AvatarModelProps) {
  const { scene, animations } = useGLTF("/my3DAvatar.glb");
  const { actions } = useAnimations(animations, scene);
  const groupRef = useRef<THREE.Group>(null);
  
  let setAvatarReady: (val: boolean) => void = () => {};
  try {
    const loading = useLoading();
    setAvatarReady = loading.setAvatarReady;
  } catch {
    // Graceful fallback when outside LoadingProvider
  }

  // Enable shadows on avatar meshes
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [scene]);

  // Activate the selected animation pose and notify readiness
  useEffect(() => {
    if (animation === "handsToPockets") {
      const pocketsAction = actions["01_Hands_To_Pockets"] || actions["00_Idle"];
      if (pocketsAction) {
        pocketsAction.reset();
        pocketsAction.clampWhenFinished = true;
        pocketsAction.setLoop(THREE.LoopOnce, 1);
        pocketsAction.fadeIn(0.3).play();
      }

      const timer = setTimeout(() => {
        setAvatarReady(true);
        onReady?.();
      }, 100);

      return () => {
        clearTimeout(timer);
        pocketsAction?.fadeOut(0.3);
      };
    } else {
      const idleAction = actions["00_Idle"] || actions["01_Hands_To_Pockets"];
      if (idleAction) {
        idleAction.reset();
        idleAction.clampWhenFinished = false;
        idleAction.setLoop(THREE.LoopRepeat, Infinity);
        idleAction.fadeIn(0.3).play();
      }

      // Small delay to ensure WebGL pipeline compiles materials & paints idle pose
      const timer = setTimeout(() => {
        setAvatarReady(true);
        onReady?.();
      }, 100);

      return () => {
        clearTimeout(timer);
        idleAction?.fadeOut(0.3);
      };
    }
  }, [actions, animation, onReady, setAvatarReady]);

  return (
    <group ref={groupRef} position={[0, -0.88, 0]} rotation={[0, -0.06, 0]}>
      <primitive object={scene} scale={1.68} position={[0, 0, 0]} />
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.65}
        scale={2.4}
        blur={2.0}
        far={2.5}
        color="#15200c"
      />
    </group>
  );
}

useGLTF.preload("/my3DAvatar.glb");

interface AvatarCanvasProps {
  isDark?: boolean;
  className?: string;
  animation?: "idle" | "handsToPockets";
  onReady?: () => void;
}

export default function AvatarCanvas({
  isDark = true,
  className = "",
  animation = "idle",
  onReady,
}: AvatarCanvasProps) {
  return (
    <div
      className={`w-full h-full relative flex items-center justify-center select-none pointer-events-none ${className}`}
    >
      <Canvas
        camera={{ position: [0, 0.05, 4.2], fov: 38 }}
        dpr={[1, Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 2, 2)]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        shadows
        className="w-full h-full pointer-events-none"
        style={{ pointerEvents: "none" }}
      >
        {/* Soft hemispheric light for rich ambient atmosphere */}
        <hemisphereLight
          args={[
            isDark ? "#fefae0" : "#ffffff",
            isDark ? "#283618" : "#dda15e",
            isDark ? 0.95 : 0.75,
          ]}
        />

        {/* Ambient base lighting */}
        <ambientLight intensity={isDark ? 1.0 : 1.2} />

        {/* Key Light: Crisp warm front-top light */}
        <directionalLight
          position={[2.5, 4.5, 3.5]}
          intensity={isDark ? 2.2 : 1.8}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0001}
          shadow-camera-near={0.5}
          shadow-camera-far={10}
          shadow-camera-left={-2}
          shadow-camera-right={2}
          shadow-camera-top={2}
          shadow-camera-bottom={-2}
        />

        {/* Fill Light: Soft sand tone on the left */}
        <directionalLight
          position={[-3, 2, 2]}
          intensity={isDark ? 1.2 : 0.9}
          color={isDark ? "#dda15e" : "#bc6c25"}
        />

        {/* Rim / Back Light: Terracotta edge lighting that outlines the silhouette */}
        <directionalLight
          position={[0, 3, -3]}
          intensity={isDark ? 2.2 : 1.5}
          color={isDark ? "#bc6c25" : "#dda15e"}
        />

        {/* Ground bounce light for subtle chin/torso fill */}
        <directionalLight
          position={[0, -2, 1]}
          intensity={0.4}
          color={isDark ? "#606c38" : "#fefae0"}
        />

        <Suspense fallback={null}>
          <AvatarModel animation={animation} onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  );
}
