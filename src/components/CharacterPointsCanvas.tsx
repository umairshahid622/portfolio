import { useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface RawPoint {
  x: number;
  y: number;
  z: number;
  isNode: boolean;
}

// =========================================================================
// CLASH DISPLAY FONT GLYPH SAMPLER (2,500 POINTS - ULTRA SHARP & CRISP)
// Samples exactly 2,500 points directly from the vector glyphs of "Clash Display"
// with 0.10em tracking and zero random jitter for razor-sharp legibility
// =========================================================================
function sampleClashDisplayPoints(
  text: string,
  totalPoints: number,
  viewportWidth: number,
  viewportHeight: number,
  wordCenterY: number
): RawPoint[] {
  if (typeof document === "undefined") {
    return generateFallbackPoints(viewportWidth, viewportHeight, wordCenterY, totalPoints);
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return generateFallbackPoints(viewportWidth, viewportHeight, wordCenterY, totalPoints);
  }

  // Render at high resolution (fontSize = 240px) with generous canvas bounds to prevent any clipping
  const fontSize = 240;
  ctx.font = `700 ${fontSize}px "Clash Display", sans-serif`;
  if ("letterSpacing" in ctx) {
    (ctx as any).letterSpacing = "0.10em";
  }

  const textMetrics = ctx.measureText(text);
  const textWidth = Math.max(textMetrics.width, 500);
  const paddingX = 140;
  const paddingY = 120;
  const canvasW = Math.ceil(textWidth + paddingX * 2);
  const canvasH = Math.ceil(fontSize * 1.8 + paddingY * 2);

  canvas.width = canvasW;
  canvas.height = canvasH;

  // Re-apply font styles after canvas dimension assignment
  ctx.font = `700 ${fontSize}px "Clash Display", sans-serif`;
  if ("letterSpacing" in ctx) {
    (ctx as any).letterSpacing = "0.10em";
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";

  const centerX = canvasW / 2;
  const centerY = canvasH / 2;
  ctx.fillText(text, centerX, centerY);

  const imgData = ctx.getImageData(0, 0, canvasW, canvasH);
  const data = imgData.data;

  interface PixelCandidate {
    x: number;
    y: number;
  }

  const edgePixels: PixelCandidate[] = [];
  const bodyPixels: PixelCandidate[] = [];

  // High-resolution scan for maximum outline and infill accuracy
  for (let y = 1; y < canvasH - 1; y++) {
    for (let x = 1; x < canvasW - 1; x++) {
      const idx = (y * canvasW + x) * 4;
      const alpha = data[idx + 3];

      if (alpha > 75) {
        const topAlpha = data[((y - 1) * canvasW + x) * 4 + 3];
        const bottomAlpha = data[((y + 1) * canvasW + x) * 4 + 3];
        const leftAlpha = data[(y * canvasW + (x - 1)) * 4 + 3];
        const rightAlpha = data[(y * canvasW + (x + 1)) * 4 + 3];

        const isBoundary =
          topAlpha < 60 ||
          bottomAlpha < 60 ||
          leftAlpha < 60 ||
          rightAlpha < 60 ||
          alpha < 195;

        if (isBoundary) {
          edgePixels.push({ x, y });
        } else if (x % 2 === 0 && y % 2 === 0) {
          // Regular sub-grid lattice for interior body
          bodyPixels.push({ x, y });
        }
      }
    }
  }

  if (edgePixels.length === 0 && bodyPixels.length === 0) {
    return generateFallbackPoints(viewportWidth, viewportHeight, wordCenterY, totalPoints);
  }

  // Responsive scale in 3D camera viewport space with safe padding
  const targetW = viewportWidth * (viewportWidth < 3.2 ? 0.88 : 0.68);
  const targetH = viewportHeight * (viewportWidth < 3.2 ? 0.16 : 0.20);
  const fontBBoxH = fontSize * 0.82;
  const scale = Math.min(targetW / textWidth, targetH / fontBBoxH);

  const rawPoints: RawPoint[] = [];

  // 65% edge outline points (1,625 points) for razor-sharp Clash Display contours
  // 35% interior body points (875 points) for dense, solid starlight infill
  const targetEdgeCount = Math.min(Math.floor(totalPoints * 0.65), edgePixels.length);
  const targetBodyCount = totalPoints - targetEdgeCount;

  // Evenly stride-sampled edges with ZERO random noise for pristine vector lines
  if (edgePixels.length > 0) {
    const edgeStep = edgePixels.length / targetEdgeCount;
    for (let i = 0; i < targetEdgeCount; i++) {
      const p = edgePixels[Math.floor(i * edgeStep)];
      const nx = (p.x - centerX) * scale;
      const ny = -(p.y - centerY) * scale + wordCenterY;

      // Subtle planar depth
      const zProf = i % 2;
      const nz = zProf === 0 ? 0.012 : -0.012;

      rawPoints.push({
        x: nx,
        y: ny,
        z: nz,
        isNode: i % 5 === 0,
      });
    }
  }

  // Evenly stride-sampled interior body lattice
  if (bodyPixels.length > 0) {
    const bodyStep = bodyPixels.length / targetBodyCount;
    for (let i = 0; i < targetBodyCount; i++) {
      const p = bodyPixels[Math.floor(i * bodyStep)];
      const nx = (p.x - centerX) * scale;
      const ny = -(p.y - centerY) * scale + wordCenterY;
      const nz = (i % 3 - 1) * 0.014;

      rawPoints.push({
        x: nx,
        y: ny,
        z: nz,
        isNode: false,
      });
    }
  }

  // Pad to exact totalPoints if needed
  while (rawPoints.length < totalPoints && rawPoints.length > 0) {
    const clone = rawPoints[Math.floor(Math.random() * rawPoints.length)];
    rawPoints.push({
      x: clone.x,
      y: clone.y,
      z: clone.z,
      isNode: false,
    });
  }

  return rawPoints.slice(0, totalPoints);
}

// Fallback points generator in case offscreen canvas is unavailable
function generateFallbackPoints(
  viewportWidth: number,
  viewportHeight: number,
  wordCenterY: number,
  totalPoints: number = 2500
): RawPoint[] {
  const targetW = viewportWidth * (viewportWidth < 3.2 ? 0.88 : 0.68);
  const targetH = viewportHeight * (viewportWidth < 3.2 ? 0.16 : 0.20);
  const scale = Math.min(targetW / 6.03, targetH / 1.10);

  const rawPoints: RawPoint[] = [];

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
    const strokeHalfW = 0.045 * scale;
    const depthHalfZ = 0.015;

    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / (count - 1) : 0.5;
      const baseX = (start[0] + dx * t) * scale;
      const baseY = (start[1] + dy * t) * scale + wordCenterY;
      const profile = i % 2;
      const offsetX = profile === 0 ? nx * strokeHalfW : -nx * strokeHalfW;
      const offsetY = profile === 0 ? ny * strokeHalfW : -ny * strokeHalfW;
      const offsetZ = profile === 0 ? depthHalfZ : -depthHalfZ;

      rawPoints.push({
        x: baseX + offsetX,
        y: baseY + offsetY,
        z: offsetZ,
        isNode: (isCornerStart && i === 0) || (isCornerEnd && i === count - 1),
      });
    }
  };

  const addArcPoints = (
    centerX: number,
    centerY: number,
    rx: number,
    ry: number,
    startAngle: number,
    endAngle: number,
    count: number
  ) => {
    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / (count - 1) : 0.5;
      const angle = startAngle + t * (endAngle - startAngle);
      const baseX = (centerX + rx * Math.cos(angle)) * scale;
      const baseY = (centerY + ry * Math.sin(angle)) * scale + wordCenterY;
      rawPoints.push({ x: baseX, y: baseY, z: (i % 2 === 0 ? 0.012 : -0.012), isNode: i % 8 === 0 });
    }
  };

  // 2,500 points fallback distribution
  addArcPoints(-2.705, 0.0, 0.31, 0.54, 0, Math.PI * 2, 338);
  addSegmentPoints([-2.175, 0.55], [-1.875, -0.55], 142, true, true);
  addSegmentPoints([-1.875, -0.55], [-1.575, 0.55], 142, false, true);
  addSegmentPoints([-1.355, -0.55], [-1.355, 0.55], 112, true, true);
  addSegmentPoints([-1.355, 0.55], [-0.835, 0.55], 62, false, true);
  addSegmentPoints([-1.355, 0.0], [-0.915, 0.0], 48, false, true);
  addSegmentPoints([-1.355, -0.55], [-0.835, -0.55], 62, false, true);
  addSegmentPoints([-0.605, -0.55], [-0.605, 0.55], 115, true, true);
  addArcPoints(-0.605, 0.275, 0.31, 0.275, Math.PI / 2, -Math.PI / 2, 140);
  addSegmentPoints([-0.605, 0.0], [-0.035, -0.55], 95, false, true);
  addSegmentPoints([0.185, 0.55], [0.485, -0.55], 142, true, true);
  addSegmentPoints([0.485, -0.55], [0.785, 0.55], 142, false, true);
  addSegmentPoints([1.105, -0.55], [1.105, 0.55], 130, true, true);
  addSegmentPoints([0.985, 0.55], [1.225, 0.55], 35, true, true);
  addSegmentPoints([0.985, -0.55], [1.225, -0.55], 35, true, true);
  addSegmentPoints([1.425, -0.55], [1.425, 0.55], 112, true, true);
  addSegmentPoints([1.425, 0.55], [1.945, 0.55], 62, false, true);
  addSegmentPoints([1.425, 0.0], [1.865, 0.0], 48, false, true);
  addSegmentPoints([1.425, -0.55], [1.945, -0.55], 62, false, true);
  addSegmentPoints([2.165, 0.55], [2.378, -0.55], 118, true, true);
  addSegmentPoints([2.378, -0.55], [2.590, 0.20], 118, false, true);
  addSegmentPoints([2.590, 0.20], [2.802, -0.55], 118, false, true);
  addSegmentPoints([2.802, -0.55], [3.015, 0.55], 120, false, true);

  while (rawPoints.length < totalPoints) {
    rawPoints.push({ ...rawPoints[rawPoints.length % 200] });
  }

  return rawPoints.slice(0, totalPoints);
}

interface CelestialPointsProps {
  progress: number;
  mouseWorld: { x: number; y: number };
  mouseActive: number;
  isMobile: boolean;
}

function CelestialPointsMesh({
  progress,
  mouseWorld,
  mouseActive,
}: CelestialPointsProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();
  const [fontLoaded, setFontLoaded] = useState(false);

  // Ensure Clash Display is completely loaded before sampling points
  useEffect(() => {
    if (typeof document !== "undefined" && document.fonts) {
      Promise.all([
        document.fonts.load('700 240px "Clash Display"'),
        document.fonts.ready,
      ])
        .then(() => {
          setFontLoaded(true);
        })
        .catch(() => {
          setFontLoaded(true);
        });
    } else {
      setFontLoaded(true);
    }
  }, []);

  // Smooth lerped values for fluid animation
  const smoothProgress = useRef(0);
  const smoothMouseWorld = useRef(new THREE.Vector2(0, 0));
  const smoothMouseActive = useRef(0.0);

  // Build the particle geometry: Exactly 2,500 points sampled from Clash Display
  // that breaks apart and spreads evenly across the screen on scroll
  const pointsGeometry = useMemo(() => {
    const startPositions: number[] = [];
    const targetPositions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    const phases: number[] = [];
    const swirlSpeeds: number[] = [];
    const randoms: number[] = [];

    // Curated Earthy Color Palette tokens (#dda15e, #bc6c25, #606c38, #fefae0)
    // 1. Warm Sand / Earth Yellow (#dda15e)
    const sandPalette = [
      new THREE.Color("#dda15e"),
      new THREE.Color("#e6b172"),
      new THREE.Color("#eec187"),
      new THREE.Color("#f4d29f"),
      new THREE.Color("#d4944d"),
    ];

    // 2. Terracotta / Tiger's Eye / Copper (#bc6c25)
    const terracottaPalette = [
      new THREE.Color("#bc6c25"),
      new THREE.Color("#cd7629"),
      new THREE.Color("#d98236"),
      new THREE.Color("#e4934b"),
      new THREE.Color("#b85d1e"),
    ];

    // 3. Olive / Moss Green (#606c38)
    const mossPalette = [
      new THREE.Color("#606c38"),
      new THREE.Color("#788746"),
      new THREE.Color("#8f9f55"),
      new THREE.Color("#9cb05d"),
    ];

    // 4. Cornsilk / Warm Cream (#fefae0)
    const creamPalette = [
      new THREE.Color("#fefae0"),
      new THREE.Color("#fffdf0"),
      new THREE.Color("#fbf5d5"),
    ];

    // Positioned cleanly with generous vertical clearance above the roller drum
    const wordCenterY = viewport.height * (viewport.width < 3.2 ? 0.26 : 0.23);

    // Sample exactly 2,500 points from our display font: Clash Display
    const TOTAL_POINTS = 2500;
    const rawPoints = sampleClashDisplayPoints(
      "OVERVIEW",
      TOTAL_POINTS,
      viewport.width,
      viewport.height,
      wordCenterY
    );

    const totalCount = rawPoints.length; // Exactly 2,500 points

    // Stratified grid for 2,500 points: 50 cols x 50 rows = 2,500 cells
    const numCols = 50;
    const numRows = Math.ceil(totalCount / numCols);

    // Shuffle grid cell assignments so all letters disperse uniformly across the screen
    const cellIndices = Array.from({ length: totalCount }, (_, i) => i);
    for (let i = cellIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cellIndices[i], cellIndices[j]] = [cellIndices[j], cellIndices[i]];
    }

    rawPoints.forEach((pt, idx) => {
      // 1. Initial Position: 3D "OVERVIEW" written in Clash Display
      startPositions.push(pt.x, pt.y, pt.z);

      // 2. Target Position: Dispersed Cosmic Nebula Across Entire Screen
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

      // Color assignment from Earthy Color Palette:
      // ~36% Warm Sand, ~34% Terracotta/Copper, ~18% Olive/Moss, ~12% Cornsilk Cream
      const streamRand = Math.random();
      let colObj: THREE.Color;
      if (streamRand < 0.36) {
        colObj = sandPalette[Math.floor(Math.random() * sandPalette.length)];
      } else if (streamRand < 0.70) {
        colObj = terracottaPalette[Math.floor(Math.random() * terracottaPalette.length)];
      } else if (streamRand < 0.88) {
        colObj = mossPalette[Math.floor(Math.random() * mossPalette.length)];
      } else {
        colObj = creamPalette[Math.floor(Math.random() * creamPalette.length)];
      }
      colors.push(colObj.r, colObj.g, colObj.b);

      // Crisp pinprick starlight nodes for high-definition legibility
      const size = pt.isNode
        ? 1.10 + Math.random() * 0.25
        : 0.75 + Math.random() * 0.25;
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
  }, [viewport.width, viewport.height, fontLoaded]);

  // Shader Material uniforms
  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0.0 },
      uTime: { value: 0.0 },
      uMouseWorld: { value: new THREE.Vector2(0, 0) },
      uMouseActive: { value: 0.0 },
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

    // Smoothly interpolate true 3D world mouse position and active state
    smoothMouseWorld.current.lerp(
      new THREE.Vector2(mouseWorld.x, mouseWorld.y),
      0.1
    );
    smoothMouseActive.current = THREE.MathUtils.lerp(
      smoothMouseActive.current,
      mouseActive,
      0.12
    );

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time;
      materialRef.current.uniforms.uProgress.value = smoothProgress.current;
      materialRef.current.uniforms.uMouseWorld.value.copy(smoothMouseWorld.current);
      materialRef.current.uniforms.uMouseActive.value = smoothMouseActive.current;
    }

    // Refined subtle interactive mouse parallax only when active inside the section
    if (pointsRef.current) {
      pointsRef.current.rotation.y = smoothMouseWorld.current.x * 0.012 * smoothMouseActive.current;
      pointsRef.current.rotation.x = smoothMouseWorld.current.y * 0.008 * smoothMouseActive.current;
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
          uniform vec2 uMouseWorld;
          uniform float uMouseActive;
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

            // Interpolate position from Clash Display letters to even screen spread
            vec3 pos = mix(position, aTargetPosition, easeP) + flightArc;

            // Organic turbulence in 3D (active only as points disperse during scroll)
            pos.y += sin(uTime * 1.2 + aPhase) * 0.05 * easeP;
            pos.x += cos(uTime * 0.9 + aPhase * 1.3) * 0.04 * easeP;
            pos.z += sin(uTime * 1.0 + aPhase * 0.8) * 0.04 * easeP;

            // Refined, localized interactive mouse repulsion:
            // ONLY activates when cursor is directly hovering on or very close to the text (tight 0.38 unit radius)
            // and cursor is actively within the Overview section (uMouseActive > 0)
            vec2 mouseOffset = pos.xy - uMouseWorld;
            float mouseDist = length(mouseOffset);
            float mouseRadius = 0.38;

            // Smooth quadratic falloff: zero displacement at boundary, gentle organic parting at core
            float repelStrength = smoothstep(mouseRadius, 0.0, mouseDist);
            float mouseRepel = repelStrength * repelStrength * 0.065 * uMouseActive;
            pos.xy += normalize(mouseOffset + vec2(0.0001, 0.0001)) * mouseRepel;
            pos.z += repelStrength * 0.035 * uMouseActive;

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;

            // Crisp pinprick starlight size attenuation with restrained scaling
            float twinkle = 0.88 + 0.22 * sin(uTime * 2.5 + aPhase);
            float baseSize = aSize * uPixelRatio * (28.0 / -mvPosition.z) * twinkle;
            gl_PointSize = clamp(baseSize * (1.0 + easeP * 0.4), 1.2, 5.2);

            // Alpha transparency
            vAlpha = 0.88 + easeP * 0.12;
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

            // Crisp, high-definition star particle: sharp outer disk boundary with crisp radiant core
            float edge = smoothstep(0.5, 0.38, dist);
            float core = smoothstep(0.32, 0.0, dist);
            float sparkle = pow(smoothstep(0.18, 0.0, dist), 3.0);
            vec3 creamSparkle = vec3(0.996, 0.980, 0.878) * sparkle * 0.85;

            // Additive earthy starlight composition with intense crisp core
            vec3 finalColor = vColor * (0.90 + core * 0.95) + creamSparkle;
            float finalAlpha = edge * vAlpha;

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mouseState, setMouseState] = useState({
    worldX: 0,
    worldY: 0,
    active: 0,
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    let lastClientX = -9999;
    let lastClientY = -9999;

    const updateMouse = (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const isInside =
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom;

      if (!isInside) {
        setMouseState((prev) =>
          prev.active === 0 ? prev : { worldX: prev.worldX, worldY: prev.worldY, active: 0 }
        );
        return;
      }

      // Normalized coordinates [-1, 1] relative to the canvas container
      const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((clientY - rect.top) / rect.height) * 2 - 1);

      // Exact 3D camera world coordinates at Z=0 for camera FOV 42, distance 5.0
      const aspect = rect.width / (rect.height || 1);
      const fovRad = (42 * Math.PI) / 180;
      const vHeight = 2 * Math.tan(fovRad / 2) * 5.0;
      const vWidth = vHeight * aspect;

      const worldX = nx * (vWidth * 0.5);
      const worldY = ny * (vHeight * 0.5);

      setMouseState({ worldX, worldY, active: 1 });
    };

    const handleMouseMove = (e: MouseEvent) => {
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      updateMouse(e.clientX, e.clientY);
    };

    const handleScroll = () => {
      if (lastClientX !== -9999) {
        updateMouse(lastClientX, lastClientY);
      }
    };

    const handleMouseLeave = () => {
      setMouseState((prev) => ({ ...prev, active: 0 }));
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
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
          mouseWorld={{ x: mouseState.worldX, y: mouseState.worldY }}
          mouseActive={mouseState.active}
          isMobile={isMobile}
        />
      </Canvas>
    </div>
  );
}
