import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { useLoading } from "../context/LoadingContext";

interface AvatarModelProps {
  isHovered?: boolean;
  baseAnimation?: "idle" | "walk";
  animation?: "idle" | "wave" | "walk";
  onWalkComplete?: () => void;
  onReady?: () => void;
}

function AvatarModel({
  isHovered = false,
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

    const idleClip = rawAnimations.find((a) => a.name === "00_Idle");
    if (idleClip) {
      const idleRight = idleClip.clone();
      idleRight.name = "00_Idle_Right";
      const spineTrack = idleRight.tracks.find((t) => t.name.includes("spine.position"));
      if (spineTrack) {
        for (let i = 0; i < spineTrack.values.length; i += 3) {
          spineTrack.values[i] = TARGET_RIGHT_X;
        }
      }
      list.push(idleRight);
    }

    const waveClip = rawAnimations.find((a) => a.name === "01_Wave");
    if (waveClip) {
      const waveRight = waveClip.clone();
      waveRight.name = "01_Wave_Right";
      const spineTrack = waveRight.tracks.find((t) => t.name.includes("spine.position"));
      if (spineTrack) {
        for (let i = 0; i < spineTrack.values.length; i += 3) {
          spineTrack.values[i] = TARGET_RIGHT_X + spineTrack.values[i];
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

  // Determine active animation based on walk completion, hover, and requested animation
  let targetActionName = "00_Idle";
  if (hasCompletedWalk) {
    targetActionName = isHovered || animation === "wave" ? "01_Wave_Right" : "00_Idle_Right";
  } else if (isHovered || animation === "wave") {
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
    <group ref={groupRef} position={[0, -0.88, 0]} rotation={[0, -0.06, 0]}>
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
  isHovered?: boolean;
  onHoverChange?: (hovered: boolean) => void;
  onReady?: () => void;
}

export default function AvatarCanvas({
  isDark = true,
  className = "",
  baseAnimation = "idle",
  animation,
  isHovered: externalHovered,
  onHoverChange,
  onReady,
}: AvatarCanvasProps) {
  const [internalHovered, setInternalHovered] = useState(false);
  const [hasWalkedToRight, setHasWalkedToRight] = useState(false);
  const isHovered = externalHovered !== undefined ? externalHovered : internalHovered;

  const handleMouseEnter = () => {
    setInternalHovered(true);
    onHoverChange?.(true);
  };

  const handleMouseLeave = () => {
    setInternalHovered(false);
    onHoverChange?.(false);
  };

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
            isHovered={isHovered}
            baseAnimation={baseAnimation}
            animation={animation}
            onWalkComplete={() => setHasWalkedToRight(true)}
            onReady={onReady}
          />
        </Suspense>
      </Canvas>

      {/* Interactive hover zone positioned dynamically over the character */}
      <div
        data-cursor-hover
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => {
          setInternalHovered((prev) => !prev);
          onHoverChange?.(!isHovered);
        }}
        className={`absolute w-36 sm:w-44 md:w-52 h-[72vh] max-h-[660px] min-h-[440px] pointer-events-auto z-20 cursor-pointer transition-all duration-700 ease-out ${
          hasWalkedToRight ? "left-[82%] -translate-x-1/2" : "left-1/2 -translate-x-1/2"
        }`}
        aria-label="3D Avatar Character - Hover to wave"
      />
    </div>
  );
}
