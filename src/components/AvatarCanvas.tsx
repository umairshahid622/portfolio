import { Suspense, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, useAnimations, Center, Float, Html, useProgress, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

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
          <span className="text-[10px] text-earth-sand/80">3D Avatar</span>
        </div>
      </div>
    </Html>
  );
}

function AvatarModel() {
  const { scene, animations } = useGLTF("/my3DAvatarWithBones.glb");

  // Modify animation tracks so the arms hang naturally and very close to the pants
  const adjustedAnimations = useMemo(() => {
    // Upper arm: Rotate inwards down against the ribcage and pants
    const offsetUpperArmL = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, (-3 * Math.PI) / 180, (-19 * Math.PI) / 180, "YXZ")
    );
    const offsetUpperArmR = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, (3 * Math.PI) / 180, (19 * Math.PI) / 180, "YXZ")
    );

    // Forearm: Keep forearms hanging flush right beside the pants
    const offsetForearmL = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, 0, (-17.5 * Math.PI) / 180, "XYZ")
    );
    const offsetForearmR = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, 0, (17.5 * Math.PI) / 180, "XYZ")
    );

    // Hands aligned right along the outer seam of the pants
    const offsetHandL = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, 0, (-6 * Math.PI) / 180, "XYZ")
    );
    const offsetHandR = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, 0, (6 * Math.PI) / 180, "XYZ")
    );

    const qTemp = new THREE.Quaternion();

    return animations.map((clip) => {
      const cloned = clip.clone();
      cloned.tracks = cloned.tracks.map((track) => {
        const clonedTrack = track.clone();
        if (clonedTrack.name === "DEF-upper_armL.quaternion") {
          for (let i = 0; i < clonedTrack.values.length; i += 4) {
            qTemp.fromArray(clonedTrack.values, i);
            qTemp.premultiply(offsetUpperArmL);
            qTemp.toArray(clonedTrack.values, i);
          }
        } else if (clonedTrack.name === "DEF-upper_armR.quaternion") {
          for (let i = 0; i < clonedTrack.values.length; i += 4) {
            qTemp.fromArray(clonedTrack.values, i);
            qTemp.premultiply(offsetUpperArmR);
            qTemp.toArray(clonedTrack.values, i);
          }
        } else if (clonedTrack.name === "DEF-forearmL.quaternion") {
          for (let i = 0; i < clonedTrack.values.length; i += 4) {
            qTemp.fromArray(clonedTrack.values, i);
            qTemp.premultiply(offsetForearmL);
            qTemp.toArray(clonedTrack.values, i);
          }
        } else if (clonedTrack.name === "DEF-forearmR.quaternion") {
          for (let i = 0; i < clonedTrack.values.length; i += 4) {
            qTemp.fromArray(clonedTrack.values, i);
            qTemp.premultiply(offsetForearmR);
            qTemp.toArray(clonedTrack.values, i);
          }
        } else if (clonedTrack.name === "DEF-handL.quaternion") {
          for (let i = 0; i < clonedTrack.values.length; i += 4) {
            qTemp.fromArray(clonedTrack.values, i);
            qTemp.premultiply(offsetHandL);
            qTemp.toArray(clonedTrack.values, i);
          }
        } else if (clonedTrack.name === "DEF-handR.quaternion") {
          for (let i = 0; i < clonedTrack.values.length; i += 4) {
            qTemp.fromArray(clonedTrack.values, i);
            qTemp.premultiply(offsetHandR);
            qTemp.toArray(clonedTrack.values, i);
          }
        }
        return clonedTrack;
      });
      return cloned;
    });
  }, [animations]);

  // Pass scene directly to useAnimations so clips bind directly to scene bones
  const { actions } = useAnimations(adjustedAnimations, scene);

  // Play 'Idle' animation on mount
  useEffect(() => {
    const idleAction = actions["Idle"];
    if (idleAction) {
      idleAction.reset().fadeIn(0.6).play();
    }
    return () => {
      idleAction?.fadeOut(0.4);
    };
  }, [actions]);

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

  return (
    <group rotation={[0, -0.12, 0]}>
      <Center position={[0, -0.08, 0]}>
        <primitive object={scene} scale={0.95} />
      </Center>
    </group>
  );
}

useGLTF.preload("/my3DAvatarWithBones.glb");

interface AvatarCanvasProps {
  isDark?: boolean;
  className?: string;
}

export default function AvatarCanvas({ isDark = true, className = "" }: AvatarCanvasProps) {
  return (
    <div className={`w-full h-full relative flex items-center justify-center select-none pointer-events-none ${className}`}>
      <Canvas
        camera={{ position: [0, 0.05, 3.8], fov: 38 }}
        dpr={[1, Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 2, 2)]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        shadows
        className="w-full h-full"
      >
        {/* Soft hemispheric light for rich ambient gradients */}
        <hemisphereLight
          args={[
            isDark ? "#fefae0" : "#ffffff",
            isDark ? "#283618" : "#dda15e",
            isDark ? 0.9 : 0.7,
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
          <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.08} floatingRange={[-0.03, 0.03]}>
            <AvatarModel />
          </Float>

          {/* Soft grounding contact shadow underneath */}
          <ContactShadows
            position={[0, -1.02, 0]}
            opacity={isDark ? 0.6 : 0.45}
            scale={3.4}
            blur={2.2}
            far={3.2}
            color={isDark ? "#121a0a" : "#455026"}
          />
        </Suspense>


      </Canvas>
    </div>
  );
}
