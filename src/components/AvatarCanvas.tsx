import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { useLoading } from "../context/LoadingContext";

interface AvatarModelProps {
  onWalkComplete?: () => void;
  onAnimationComplete?: () => void;
  onReady?: () => void;
}

function AvatarModel({
  onWalkComplete,
  onAnimationComplete,
  onReady,
}: AvatarModelProps) {
  const { scene, animations } = useGLTF("/my3DAvatar.glb");
  const { actions, mixer } = useAnimations(animations, scene);
  const groupRef = useRef<THREE.Group>(null);
  const shadowGroupRef = useRef<THREE.Group>(null);
  const spineBoneRef = useRef<THREE.Object3D | null>(null);

  let setAvatarReady: (val: boolean) => void = () => {};
  let curtainParting = true;
  try {
    const loading = useLoading();
    setAvatarReady = loading.setAvatarReady;
    curtainParting = loading.curtainParting;
  } catch {
    // Graceful fallback when outside LoadingProvider
  }

  // Find spine bone for contact shadow tracking beneath feet
  useEffect(() => {
    scene.traverse((child: THREE.Object3D) => {
      if (child.name === "spine") {
        spineBoneRef.current = child;
      }
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [scene]);

  // Keep contact shadow aligned beneath feet as character moves
  useFrame(() => {
    if (spineBoneRef.current && shadowGroupRef.current) {
      shadowGroupRef.current.position.x = spineBoneRef.current.position.x * 1.68;
    }
  });

  // Play 02_Natural_Walk solely governed by keyframes from Blender
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const action = actions["02_Natural_Walk"];
    if (!action) return;

    action.reset();
    action.clampWhenFinished = true;
    action.setLoop(THREE.LoopOnce, 1);

    if (prefersReducedMotion) {
      action.play();
      action.time = action.getClip().duration;
      onAnimationComplete?.();
      onWalkComplete?.();
      return;
    }

    if (curtainParting) {
      action.play();
    } else {
      action.play();
      action.paused = true;
    }
  }, [actions, curtainParting, onAnimationComplete, onWalkComplete]);

  // Unpause when curtain starts parting
  useEffect(() => {
    const action = actions["02_Natural_Walk"];
    if (action && curtainParting && action.paused) {
      action.paused = false;
    }
  }, [curtainParting, actions]);

  // Listen for the keyframe animation completion from mixer
  useEffect(() => {
    const onFinished = (e: any) => {
      if (e.action === actions["02_Natural_Walk"]) {
        onAnimationComplete?.();
        onWalkComplete?.();
      }
    };
    mixer.addEventListener("finished", onFinished);
    return () => {
      mixer.removeEventListener("finished", onFinished);
    };
  }, [mixer, actions, onAnimationComplete, onWalkComplete]);

  // Initial readiness notification
  useEffect(() => {
    const timer = setTimeout(() => {
      setAvatarReady(true);
      onReady?.();
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [onReady, setAvatarReady]);

  return (
    <group ref={groupRef} position={[0, -0.88, 0]} rotation={[0, 0, 0]}>
      <primitive object={scene} scale={1.68} position={[0, 0, 0]} />
      <group ref={shadowGroupRef}>
        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.65}
          scale={2.4}
          blur={2.0}
          far={2.5}
          color="#15200c"
        />
      </group>
    </group>
  );
}

useGLTF.preload("/my3DAvatar.glb");

interface AvatarCanvasProps {
  isDark?: boolean;
  className?: string;
  onWalkComplete?: () => void;
  onAnimationComplete?: () => void;
  onReady?: () => void;
}

export default function AvatarCanvas({
  isDark = true,
  className = "",
  onWalkComplete,
  onAnimationComplete,
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
          <AvatarModel
            onWalkComplete={onWalkComplete}
            onAnimationComplete={onAnimationComplete}
            onReady={onReady}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
