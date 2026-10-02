import { Suspense, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations, ContactShadows, Html, useProgress } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { prefersReducedMotion } from "../utils/motion";

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3 bg-earth-forest/85 dark:bg-earth-forest/90 px-5 py-3 rounded-2xl border border-earth-cream/15 backdrop-blur-xl shadow-2xl text-center pointer-events-none min-w-[170px]">
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-earth-sand/20" />
          <div className="absolute inset-0 rounded-full border-2 border-earth-terracotta border-t-transparent animate-spin" />
          <span className="text-[10px] font-mono font-bold text-earth-sand">
            {progress.toFixed(0)}%
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs font-semibold tracking-wider uppercase text-earth-cream">
            Loading Avatar
          </span>
          <span className="text-[10px] text-earth-sand/80">3D Experience</span>
        </div>
      </div>
    </Html>
  );
}

function AvatarModel() {
  const { scene, animations } = useGLTF("/my3DAvatar.glb");
  const { actions } = useAnimations(animations, scene);
  const { viewport } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  const hasArrivedRef = useRef(false);

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

  useEffect(() => {
    if (!groupRef.current) return;

    const walkAction = actions["02_Walk_InPlace"] || actions["02_Natural_Walk"];
    const idleAction = actions["00_Idle"] || actions["01_Hands_To_Pockets"];

    // If user prefers reduced motion or already arrived, stay in idle pose
    if (prefersReducedMotion() || hasArrivedRef.current) {
      groupRef.current.position.set(0, -0.88, 0);
      groupRef.current.rotation.set(0, -0.06, 0);
      idleAction?.reset().fadeIn(0.4).play();
      return;
    }

    // Mathematical stride speed:
    // The natural walk cycle in 02_Natural_Walk moves the spine 0.880 model units per 2.50s cycle.
    // Model scale in scene is 1.68.
    // Natural linear walk speed = (0.880 * 1.68) / 2.50 = 0.59136 world units / second.
    const TIME_SCALE = 1.0;
    const strideSpeed = ((0.880 * 1.68) / 2.50) * TIME_SCALE; // ~0.5914 units/s
    const walkHeadingAngle = Math.PI / 2 - 0.08; // Facing right with a subtle 4.5° camera angle for 3D depth
    const walkSpeedX = strideSpeed * Math.cos(0.08); // Exact speed along X axis (~0.5895 units/s)

    // Start completely beyond the left visible edge
    // Half width of character is ~0.65 units
    const startX = -(viewport.width / 2 + 0.65);
    const targetX = 0;
    const totalDistance = Math.abs(targetX - startX);

    // Stop deceleration phase:
    // Seamless transition from steady walk (walkSpeedX) to 0 with quadratic ease-out (power1.out):
    // Matching v0 = walkSpeedX gives: stopDistance = walkSpeedX * stopDuration / 2.
    const stopDuration = 0.85;
    const stopDistance = Math.min((walkSpeedX * stopDuration) / 2, totalDistance * 0.25);
    const steadyDistance = totalDistance - stopDistance;
    const steadyDuration = steadyDistance / walkSpeedX;

    // Initialize position and orientation
    groupRef.current.position.set(startX, -0.88, 0);
    groupRef.current.rotation.set(0, walkHeadingAngle, 0);

    // Play walk animation matching time scale
    if (walkAction) {
      walkAction.timeScale = TIME_SCALE;
      walkAction.reset().fadeIn(0.2).play();
    }

    const tl = gsap.timeline({
      delay: 0.15,
      onComplete: () => {
        hasArrivedRef.current = true;
      },
    });

    // Phase 1: Steady linear walk across screen matching the exact foot cadence (ZERO foot slip)
    tl.to(groupRef.current.position, {
      x: -stopDistance,
      duration: steadyDuration,
      ease: "none",
    });

    // Phase 2: Smooth deceleration to center x = 0
    tl.to(groupRef.current.position, {
      x: 0,
      duration: stopDuration,
      ease: "power1.out",
    });

    // Turn to face front during the deceleration / settling step
    tl.to(
      groupRef.current.rotation,
      {
        y: -0.06,
        duration: stopDuration,
        ease: "power2.out",
      },
      `-=${stopDuration}`
    );

    // Crossfade smoothly from walking to idle as the character comes to a halt
    tl.call(
      () => {
        if (walkAction && idleAction) {
          idleAction.reset().play();
          walkAction.crossFadeTo(idleAction, 0.75, true);
        }
      },
      undefined,
      steadyDuration + 0.05
    );

    return () => {
      tl.kill();
      walkAction?.stop();
      idleAction?.stop();
    };
  }, [actions, viewport.width]);

  return (
    <group ref={groupRef}>
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
}

export default function AvatarCanvas({ isDark = true, className = "" }: AvatarCanvasProps) {
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
        className="w-full h-full"
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

        <Suspense fallback={<Loader />}>
          <AvatarModel />
        </Suspense>
      </Canvas>
    </div>
  );
}
