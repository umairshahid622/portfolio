import { useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface CelestialPointsProps {
  progress: number;
  mouse: { x: number; y: number };
  isMobile: boolean;
}

function CelestialPointsMesh({
  progress,
  mouse,
}: CelestialPointsProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  // Smooth lerped progress for silky fluid animation
  const smoothProgress = useRef(0);
  const smoothMouse = useRef(new THREE.Vector2(0, 0));

  // Build the particle geometry: Exactly 750 points forming a BIGGER 3D </> developer emblem
  // that breaks apart and spreads evenly across the screen on scroll
  const pointsGeometry = useMemo(() => {
    const startPositions: number[] = [];
    const targetPositions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    const phases: number[] = [];
    const swirlSpeeds: number[] = [];
    const randoms: number[] = [];

    // Cosmic starlight color palettes
    const amberPalette = [
      new THREE.Color("#f59e0b"), // Amber 500
      new THREE.Color("#f97316"), // Orange 500
      new THREE.Color("#fbbf24"), // Amber 400
      new THREE.Color("#eab308"), // Yellow 500
      new THREE.Color("#ffd166"), // Warm sun gold
      new THREE.Color("#ffedd5"), // Champagne gold
    ];

    const cyanPalette = [
      new THREE.Color("#38bdf8"), // Sky 400
      new THREE.Color("#60a5fa"), // Blue 400
      new THREE.Color("#0284c7"), // Sky 600
      new THREE.Color("#67e8f9"), // Cyan 300
      new THREE.Color("#93c5fd"), // Blue 300
      new THREE.Color("#e0f2fe"), // Ice white
    ];

    const whiteColor = new THREE.Color("#ffffff");

    interface RawPoint {
      x: number;
      y: number;
      z: number;
      isNode: boolean;
    }
    const rawPoints: RawPoint[] = [];

    // Base coordinates for the 3D "OVERVIEW" constellation:
    // Total bounding box: Width ~6.03, Height ~1.10
    // Positioned cleanly ABOVE the roller drum when merged
    const wordCenterY = viewport.height * (viewport.width < 3.2 ? 0.30 : 0.28);
    const targetW = viewport.width * (viewport.width < 3.2 ? 0.88 : 0.65);
    const targetH = viewport.height * (viewport.width < 3.2 ? 0.16 : 0.20);
    const scale = Math.min(targetW / 6.03, targetH / 1.10);

    // Helper to sample points along a 3D line segment with extruded prism thickness
    const addSegmentPoints = (
      start: [number, number],
      end: [number, number],
      count: number,
      isCornerStart = false,
      isCornerEnd = false
    ) => {
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const len = Math.hypot(dx, dy) || 1e-4;
      const nx = -dy / len;
      const ny = dx / len;

      const strokeHalfW = 0.05 * scale;
      const depthHalfZ = 0.12 * scale;

      for (let i = 0; i < count; i++) {
        const t = count > 1 ? i / (count - 1) : 0.5;
        const baseX = (start[0] + dx * t) * scale;
        const baseY = (start[1] + dy * t) * scale + wordCenterY;

        // Distribute across 6 extruded 3D spatial profiles for tangible solid depth
        const profile = i % 6;
        let offsetX = 0;
        let offsetY = 0;
        let offsetZ = 0;

        if (profile === 0) {
          offsetX = nx * strokeHalfW;
          offsetY = ny * strokeHalfW;
          offsetZ = depthHalfZ;
        } else if (profile === 1) {
          offsetX = -nx * strokeHalfW;
          offsetY = -ny * strokeHalfW;
          offsetZ = depthHalfZ;
        } else if (profile === 2) {
          offsetX = nx * strokeHalfW;
          offsetY = ny * strokeHalfW;
          offsetZ = -depthHalfZ;
        } else if (profile === 3) {
          offsetX = -nx * strokeHalfW;
          offsetY = -ny * strokeHalfW;
          offsetZ = -depthHalfZ;
        } else if (profile === 4) {
          offsetZ = depthHalfZ * 0.55;
        } else {
          offsetZ = -depthHalfZ * 0.55;
        }

        const jx = (Math.random() - 0.5) * 0.02 * scale;
        const jy = (Math.random() - 0.5) * 0.02 * scale;
        const jz = (Math.random() - 0.5) * 0.02 * scale;

        const isNode =
          (isCornerStart && i === 0) ||
          (isCornerEnd && i === count - 1) ||
          i % 8 === 0;

        rawPoints.push({
          x: baseX + offsetX + jx,
          y: baseY + offsetY + jy,
          z: offsetZ + jz,
          isNode,
        });
      }
    };

    // Helper to sample points along a 3D elliptical arc
    const addArcPoints = (
      centerX: number,
      centerY: number,
      rx: number,
      ry: number,
      startAngle: number,
      endAngle: number,
      count: number
    ) => {
      const strokeHalfW = 0.05 * scale;
      const depthHalfZ = 0.12 * scale;

      for (let i = 0; i < count; i++) {
        const t = count > 1 ? i / (count - 1) : 0.5;
        const angle = startAngle + t * (endAngle - startAngle);
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        const baseX = (centerX + cosA * rx) * scale;
        const baseY = (centerY + sinA * ry) * scale + wordCenterY;

        const profile = i % 6;
        let offsetX = 0;
        let offsetY = 0;
        let offsetZ = 0;

        if (profile === 0) {
          offsetX = cosA * strokeHalfW;
          offsetY = sinA * strokeHalfW;
          offsetZ = depthHalfZ;
        } else if (profile === 1) {
          offsetX = -cosA * strokeHalfW;
          offsetY = -sinA * strokeHalfW;
          offsetZ = depthHalfZ;
        } else if (profile === 2) {
          offsetX = cosA * strokeHalfW;
          offsetY = sinA * strokeHalfW;
          offsetZ = -depthHalfZ;
        } else if (profile === 3) {
          offsetX = -cosA * strokeHalfW;
          offsetY = -sinA * strokeHalfW;
          offsetZ = -depthHalfZ;
        } else if (profile === 4) {
          offsetZ = depthHalfZ * 0.55;
        } else {
          offsetZ = -depthHalfZ * 0.55;
        }

        const jx = (Math.random() - 0.5) * 0.02 * scale;
        const jy = (Math.random() - 0.5) * 0.02 * scale;
        const jz = (Math.random() - 0.5) * 0.02 * scale;

        const isNode = i % 8 === 0 || i === 0 || i === count - 1;

        rawPoints.push({
          x: baseX + offsetX + jx,
          y: baseY + offsetY + jy,
          z: offsetZ + jz,
          isNode,
        });
      }
    };

    // Construct the 8 letters of "OVERVIEW" (Exactly 1000 points total)
    // 1. 'O' (135 points)
    addArcPoints(-2.705, 0.0, 0.31, 0.54, 0, Math.PI * 2, 135);

    // 2. 'V' (114 points)
    addSegmentPoints([-2.175, 0.55], [-1.875, -0.55], 57, true, true);
    addSegmentPoints([-1.875, -0.55], [-1.575, 0.55], 57, false, true);

    // 3. 'E' (114 points)
    addSegmentPoints([-1.355, -0.55], [-1.355, 0.55], 45, true, true);
    addSegmentPoints([-1.355, 0.55], [-0.835, 0.55], 25, false, true);
    addSegmentPoints([-1.355, 0.0], [-0.915, 0.0], 19, false, true);
    addSegmentPoints([-1.355, -0.55], [-0.835, -0.55], 25, false, true);

    // 4. 'R' (140 points)
    addSegmentPoints([-0.605, -0.55], [-0.605, 0.55], 46, true, true);
    addArcPoints(-0.605, 0.275, 0.31, 0.275, Math.PI / 2, -Math.PI / 2, 56);
    addSegmentPoints([-0.605, 0.0], [-0.035, -0.55], 38, false, true);

    // 5. 'V' (114 points)
    addSegmentPoints([0.185, 0.55], [0.485, -0.55], 57, true, true);
    addSegmentPoints([0.485, -0.55], [0.785, 0.55], 57, false, true);

    // 6. 'I' (80 points)
    addSegmentPoints([1.105, -0.55], [1.105, 0.55], 52, true, true);
    addSegmentPoints([0.985, 0.55], [1.225, 0.55], 14, true, true);
    addSegmentPoints([0.985, -0.55], [1.225, -0.55], 14, true, true);

    // 7. 'E' (114 points)
    addSegmentPoints([1.425, -0.55], [1.425, 0.55], 45, true, true);
    addSegmentPoints([1.425, 0.55], [1.945, 0.55], 25, false, true);
    addSegmentPoints([1.425, 0.0], [1.865, 0.0], 19, false, true);
    addSegmentPoints([1.425, -0.55], [1.945, -0.55], 25, false, true);

    // 8. 'W' (189 points)
    addSegmentPoints([2.165, 0.55], [2.378, -0.55], 47, true, true);
    addSegmentPoints([2.378, -0.55], [2.590, 0.20], 47, false, true);
    addSegmentPoints([2.590, 0.20], [2.802, -0.55], 47, false, true);
    addSegmentPoints([2.802, -0.55], [3.015, 0.55], 48, false, true);

    const totalCount = rawPoints.length; // Exactly 1000 points!

    // Evenly distribute target positions across the screen using a stratified grid
    const numCols = 40;
    const numRows = Math.ceil(totalCount / numCols); // Exactly 25 rows (40 * 25 = 1000)

    // Shuffle grid cell assignments so all letters disperse uniformly across the screen
    const cellIndices = Array.from({ length: totalCount }, (_, i) => i);
    for (let i = cellIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cellIndices[i], cellIndices[j]] = [cellIndices[j], cellIndices[i]];
    }

    rawPoints.forEach((pt, idx) => {
      // 1. Initial Position (3D </> Symbol)
      startPositions.push(pt.x, pt.y, pt.z);

      // 2. Target Position (Dispersed Cosmic Nebula Across Entire Screen)
      const cellIdx = cellIndices[idx];
      const col = cellIdx % numCols;
      const row = Math.floor(cellIdx / numCols);

      // Normalized coordinates [0, 1] with organic jitter
      const u = (col + 0.15 + Math.random() * 0.7) / numCols;
      const v = (row + 0.15 + Math.random() * 0.7) / numRows;

      // Full screen coverage in camera space (camera z=5.0, fov=42)
      const targetX = (u - 0.5) * (viewport.width * 1.15);
      const targetY = (v - 0.5) * (viewport.height * 1.15);
      const targetZ = (Math.random() - 0.5) * 2.8;

      targetPositions.push(targetX, targetY, targetZ);

      // Color assignment: 48% Amber, 44% Cyan, 8% Diamond White
      const streamRand = Math.random();
      let colObj: THREE.Color;
      if (streamRand < 0.48) {
        colObj = amberPalette[Math.floor(Math.random() * amberPalette.length)];
      } else if (streamRand < 0.92) {
        colObj = cyanPalette[Math.floor(Math.random() * cyanPalette.length)];
      } else {
        colObj = whiteColor;
      }
      colors.push(colObj.r, colObj.g, colObj.b);

      // Sizes: halved for delicate, crisp pinpricks
      const size = pt.isNode
        ? 1.8 + Math.random() * 0.8
        : 0.9 + Math.random() * 0.8;
      sizes.push(size);

      phases.push(Math.random() * Math.PI * 2);
      swirlSpeeds.push((Math.random() - 0.5) * 1.6);
      randoms.push(Math.random());
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(startPositions, 3)
    );
    geo.setAttribute(
      "aTargetPosition",
      new THREE.Float32BufferAttribute(targetPositions, 3)
    );
    geo.setAttribute(
      "aColor",
      new THREE.Float32BufferAttribute(colors, 3)
    );
    geo.setAttribute(
      "aSize",
      new THREE.Float32BufferAttribute(sizes, 1)
    );
    geo.setAttribute(
      "aPhase",
      new THREE.Float32BufferAttribute(phases, 1)
    );
    geo.setAttribute(
      "aSwirlSpeed",
      new THREE.Float32BufferAttribute(swirlSpeeds, 1)
    );
    geo.setAttribute(
      "aRandom",
      new THREE.Float32BufferAttribute(randoms, 1)
    );

    return geo;
  }, [viewport.width, viewport.height]);

  // Shader Material uniforms
  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0.0 },
      uTime: { value: 0.0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uPixelRatio: { value: 1.0 },
    }),
    []
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2.0);
    }
  }, [uniforms]);

  // Frame animation loop
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    // Smoothly interpolate progress toward target
    smoothProgress.current = THREE.MathUtils.lerp(
      smoothProgress.current,
      progress,
      0.08
    );

    // Smoothly interpolate mouse
    smoothMouse.current.x = THREE.MathUtils.lerp(
      smoothMouse.current.x,
      mouse.x,
      0.05
    );
    smoothMouse.current.y = THREE.MathUtils.lerp(
      smoothMouse.current.y,
      mouse.y,
      0.05
    );

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time;
      materialRef.current.uniforms.uProgress.value = smoothProgress.current;
      materialRef.current.uniforms.uMouse.value.copy(smoothMouse.current);
    }

    // No auto-rotation: symbol remains static and still without rotating on its own.
    // Retains only subtle interactive mouse parallax if the user moves their cursor.
    if (pointsRef.current) {
      pointsRef.current.rotation.y = smoothMouse.current.x * 0.10;
      pointsRef.current.rotation.x = smoothMouse.current.y * 0.06;
      pointsRef.current.rotation.z = 0;
    }
  });

  return (
    <points ref={pointsRef} geometry={pointsGeometry}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`
          uniform float uProgress;
          uniform float uTime;
          uniform vec2 uMouse;
          uniform float uPixelRatio;

          attribute vec3 aTargetPosition;
          attribute vec3 aColor;
          attribute float aSize;
          attribute float aPhase;
          attribute float aSwirlSpeed;
          attribute float aRandom;

          varying vec3 vColor;
          varying float vAlpha;
          varying float vPhase;

          float easeOutQuart(float x) {
            return 1.0 - pow(1.0 - x, 4.0);
          }

          void main() {
            vColor = aColor;
            vPhase = aPhase;

            // Cascade break-off: outer points break first, core points follow
            float pOffset = aRandom * 0.22;
            float p = clamp((uProgress - pOffset) / (1.0 - pOffset + 0.0001), 0.0, 1.0);
            float easeP = easeOutQuart(p);

            // Dynamic arching flight arc during explosion
            float arc = sin(easeP * 3.14159);
            vec3 flightArc = vec3(
              arc * (aRandom - 0.5) * 1.5,
              arc * (aSwirlSpeed) * 1.0,
              arc * (aRandom - 0.5) * 1.3
            );

            // Interpolate position from code symbol shape to even screen spread
            vec3 pos = mix(position, aTargetPosition, easeP) + flightArc;

            // Organic turbulence in 3D (active only as points disperse during scroll)
            pos.y += sin(uTime * 1.2 + aPhase) * 0.05 * easeP;
            pos.x += cos(uTime * 0.9 + aPhase * 1.3) * 0.04 * easeP;
            pos.z += sin(uTime * 1.0 + aPhase * 0.8) * 0.04 * easeP;

            // Subtle interactive mouse repulsion
            vec2 mouseOffset = pos.xy - uMouse * 4.0;
            float mouseDist = length(mouseOffset);
            float mouseRepel = smoothstep(2.5, 0.0, mouseDist) * 0.28 * (0.3 + easeP * 0.7);
            pos.xy += normalize(mouseOffset + 0.0001) * mouseRepel;

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;

            // Twinkle effect & halved size attenuation
            float twinkle = 0.85 + 0.25 * sin(uTime * 2.5 + aPhase);
            float sizeExpansion = 1.0 + easeP * 0.35;
            gl_PointSize = aSize * uPixelRatio * (50.0 / -mvPosition.z) * twinkle * sizeExpansion;
            gl_PointSize = clamp(gl_PointSize, 1.0, 13.0);

            // Alpha transparency
            vAlpha = 0.82 + easeP * 0.18;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          varying float vAlpha;
          varying float vPhase;

          void main() {
            // Distance from point center
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;

            // Soft glowing gaussian halo
            float core = smoothstep(0.5, 0.05, dist);
            float glow = pow(core, 2.0);

            // Radiant diamond sparkle at the center of the star
            float sparkle = pow(smoothstep(0.18, 0.0, dist), 3.0);

            // Additive starlight composition
            vec3 finalColor = vColor * (0.85 + glow * 1.3) + vec3(1.0) * sparkle * 0.65;
            float finalAlpha = core * vAlpha;

            gl_FragColor = vec4(finalColor, finalAlpha);
          }
        `}
      />
    </points>
  );
}

interface CharacterPointsCanvasProps {
  progress?: number;
  className?: string;
}

export default function CharacterPointsCanvas({
  progress = 0,
  className = "",
}: CharacterPointsCanvasProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalized mouse coordinates: [-1, 1]
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      setMouse({ x: nx, y: ny });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      className={`w-full h-full relative select-none pointer-events-none ${className}`}
      style={{ pointerEvents: "none" }}
    >
      <Canvas
        camera={{ position: [0, 0, 5.0], fov: 42 }}
        dpr={[1, Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 2, 2)]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        className="w-full h-full pointer-events-none"
        style={{ pointerEvents: "none" }}
      >
        <CelestialPointsMesh
          progress={progress}
          mouse={mouse}
          isMobile={isMobile}
        />
      </Canvas>
    </div>
  );
}
