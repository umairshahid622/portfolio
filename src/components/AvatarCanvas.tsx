import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { useLoading } from "../context/LoadingContext";

interface AvatarModelProps {
  baseAnimation?: "idle" | "walk";
  animation?: "idle" | "wave" | "walk";
  onWalkComplete?: () => void;
  onReady?: () => void;
}

function AvatarModel({
  baseAnimation = "idle",
  animation,
  onWalkComplete,
  onReady,
}: AvatarModelProps) {
  const { scene, animations: rawAnimations } = useGLTF("/my3DAvatar.glb");

  // Create right-side variations of idle & wave matching the exact stop position of 02_Natural_Walk
  const animations = useMemo(() => {
    const list = [...rawAnimations];
    const TARGET_RIGHT_X = 1.113657; // exact final spine X position of 02_Natural_Walk
    // Exact spine quaternion at walk end frame (frame 140) facing camera
    const TARGET_RIGHT_SPINE_ROT = [
      0.04889841377735138,
      -0.19057218730449677,
      -0.009504875168204308,
      0.9804085493087769,
    ];

    const idleClip = rawAnimations.find((a) => a.name === "00_Idle");
    if (idleClip) {
      const idleRight = idleClip.clone();
      idleRight.name = "00_Idle_Right";
      const spinePosTrack = idleRight.tracks.find((t) => t.name.includes("spine.position"));
      if (spinePosTrack) {
        for (let i = 0; i < spinePosTrack.values.length; i += 3) {
          spinePosTrack.values[i] = TARGET_RIGHT_X;
        }
      }
      const spineRotTrack = idleRight.tracks.find((t) => t.name.includes("spine.quaternion"));
      if (spineRotTrack) {
        for (let i = 0; i < spineRotTrack.values.length; i += 4) {
          spineRotTrack.values[i] = TARGET_RIGHT_SPINE_ROT[0];
          spineRotTrack.values[i + 1] = TARGET_RIGHT_SPINE_ROT[1];
          spineRotTrack.values[i + 2] = TARGET_RIGHT_SPINE_ROT[2];
          spineRotTrack.values[i + 3] = TARGET_RIGHT_SPINE_ROT[3];
        }
      }
      list.push(idleRight);
    }

    const waveClip = rawAnimations.find((a) => a.name === "01_Wave");
    if (waveClip) {
      const waveRight = waveClip.clone();
      waveRight.name = "01_Wave_Right";
      const spinePosTrack = waveRight.tracks.find((t) => t.name.includes("spine.position"));
      if (spinePosTrack) {
        for (let i = 0; i < spinePosTrack.values.length; i += 3) {
          spinePosTrack.values[i] = TARGET_RIGHT_X + spinePosTrack.values[i];
        }
      }
      const spineRotTrack = waveRight.tracks.find((t) => t.name.includes("spine.quaternion"));
      if (spineRotTrack) {
        for (let i = 0; i < spineRotTrack.values.length; i += 4) {
          spineRotTrack.values[i] = TARGET_RIGHT_SPINE_ROT[0];
          spineRotTrack.values[i + 1] = TARGET_RIGHT_SPINE_ROT[1];
          spineRotTrack.values[i + 2] = TARGET_RIGHT_SPINE_ROT[2];
          spineRotTrack.values[i + 3] = TARGET_RIGHT_SPINE_ROT[3];
        }
      }
      list.push(waveRight);
    }

    return list;
  }, [rawAnimations]);

  const { actions, mixer } = useAnimations(animations, scene);
  const groupRef = useRef<THREE.Group>(null);
  const shadowGroupRef = useRef<THREE.Group>(null);
  const spineBoneRef = useRef<THREE.Object3D | null>(null);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const isFirstRenderRef = useRef(true);
  const [hasCompletedWalk, setHasCompletedWalk] = useState(false);

  let setAvatarReady: (val: boolean) => void = () => {};
  try {
    const loading = useLoading();
    setAvatarReady = loading.setAvatarReady;
  } catch {
    // Graceful fallback when outside LoadingProvider
  }

  // Find spine bone for contact shadow tracking
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

  // Keep contact shadow aligned directly beneath feet at all times
  useFrame(() => {
    if (spineBoneRef.current && shadowGroupRef.current) {
      shadowGroupRef.current.position.x = spineBoneRef.current.position.x * 1.68;
    }
  });

  // Listen for the walk animation completion
  useEffect(() => {
    const onFinished = (e: any) => {
      if (e.action === actions["02_Natural_Walk"]) {
        setHasCompletedWalk(true);
        onWalkComplete?.();
      }
    };
    mixer.addEventListener("finished", onFinished);
    return () => {
      mixer.removeEventListener("finished", onFinished);
    };
  }, [mixer, actions, onWalkComplete]);

  // Initial playback: start idle pose and notify readiness
  useEffect(() => {
    const idleAction = actions["00_Idle"];
    if (idleAction) {
      idleAction.reset();
      idleAction.clampWhenFinished = false;
      idleAction.setLoop(THREE.LoopRepeat, Infinity);
      idleAction.fadeIn(0.3).play();
      currentActionRef.current = idleAction;
    }

    const timer = setTimeout(() => {
      setAvatarReady(true);
      onReady?.();
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [actions, onReady, setAvatarReady]);

  // Determine active animation based on walk completion and requested animation
  let targetActionName = "00_Idle";
  if (hasCompletedWalk) {
    targetActionName = animation === "wave" ? "01_Wave_Right" : "00_Idle_Right";
  } else if (animation === "wave") {
    targetActionName = "01_Wave";
  } else if (animation === "walk" || baseAnimation === "walk") {
    targetActionName = "02_Natural_Walk";
  } else {
    targetActionName = "00_Idle";
  }

  useEffect(() => {
    // Skip on first render as initial idle is triggered above
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    const nextAction = actions[targetActionName];
    const prevAction = currentActionRef.current;

    if (!nextAction || prevAction === nextAction) return;

    if (prevAction) {
      prevAction.fadeOut(0.35);
    }
    nextAction.reset();
    if (targetActionName === "02_Natural_Walk") {
      nextAction.clampWhenFinished = true;
      nextAction.setLoop(THREE.LoopOnce, 1);
    } else {
      nextAction.clampWhenFinished = false;
      nextAction.setLoop(THREE.LoopRepeat, Infinity);
    }
    nextAction.fadeIn(0.35).play();

    currentActionRef.current = nextAction;
  }, [actions, targetActionName]);

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
  baseAnimation?: "idle" | "walk";
  animation?: "idle" | "wave" | "walk";
  onWalkComplete?: () => void;
  onReady?: () => void;
}

export default function AvatarCanvas({
  isDark = true,
  className = "",
  baseAnimation = "idle",
  animation,
  onWalkComplete,
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
            baseAnimation={baseAnimation}
            animation={animation}
            onWalkComplete={onWalkComplete}
            onReady={onReady}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
