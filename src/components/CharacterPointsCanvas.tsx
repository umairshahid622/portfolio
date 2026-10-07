import { useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { particleBridge } from "../utils/particleBridge";

interface RawPoint {
  x: number;
  y: number;
  z: number;
  isNode: boolean;
}

// =========================================================================
// CLASH DISPLAY FONT SAMPLER
// Samples 2,500 points directly from Clash Display vector glyphs
// =========================================================================
function sampleClashDisplayText(
  text: string,
  totalPoints: number,
  viewportWidth: number,
  viewportHeight: number,
  targetWidthRatio: number,
  targetHeightRatio: number,
  wordCenterX: number,
  wordCenterY: number
): RawPoint[] {
  if (typeof document === "undefined") {
    return generateFallbackPoints(text, viewportWidth, viewportHeight, targetWidthRatio, targetHeightRatio, wordCenterX, wordCenterY, totalPoints);
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return generateFallbackPoints(text, viewportWidth, viewportHeight, targetWidthRatio, targetHeightRatio, wordCenterX, wordCenterY, totalPoints);
  }

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
          bodyPixels.push({ x, y });
        }
      }
    }
  }

  if (edgePixels.length === 0 && bodyPixels.length === 0) {
    return generateFallbackPoints(text, viewportWidth, viewportHeight, targetWidthRatio, targetHeightRatio, wordCenterX, wordCenterY, totalPoints);
  }

  const targetW = viewportWidth * targetWidthRatio;
  const targetH = viewportHeight * targetHeightRatio;
  const fontBBoxH = fontSize * 0.82;
  const scale = Math.min(targetW / textWidth, targetH / fontBBoxH);

  const rawPoints: RawPoint[] = [];
  const targetEdgeCount = Math.min(Math.floor(totalPoints * 0.65), edgePixels.length);
  const targetBodyCount = totalPoints - targetEdgeCount;

  if (edgePixels.length > 0) {
    const edgeStep = edgePixels.length / targetEdgeCount;
    for (let i = 0; i < targetEdgeCount; i++) {
      const p = edgePixels[Math.floor(i * edgeStep)];
      const nx = (p.x - centerX) * scale + wordCenterX;
      const ny = -(p.y - centerY) * scale + wordCenterY;
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

  if (bodyPixels.length > 0) {
    const bodyStep = bodyPixels.length / targetBodyCount;
    for (let i = 0; i < targetBodyCount; i++) {
      const p = bodyPixels[Math.floor(i * bodyStep)];
      const nx = (p.x - centerX) * scale + wordCenterX;
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

// Fallback points generator in case 2D offscreen canvas is unavailable
function generateFallbackPoints(
  text: string,
  viewportWidth: number,
  viewportHeight: number,
  targetWidthRatio: number,
  targetHeightRatio: number,
  wordCenterX: number,
  wordCenterY: number,
  totalPoints: number = 2500
): RawPoint[] {
  const targetW = viewportWidth * targetWidthRatio;
  const targetH = viewportHeight * targetHeightRatio;
  const scale = Math.min(targetW / 6.0, targetH / 1.0);

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
      const baseX = (start[0] + dx * t) * scale + wordCenterX;
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
      const baseX = (centerX + rx * Math.cos(angle)) * scale + wordCenterX;
      const baseY = (centerY + ry * Math.sin(angle)) * scale + wordCenterY;
      rawPoints.push({ x: baseX, y: baseY, z: (i % 2 === 0 ? 0.012 : -0.012), isNode: i % 8 === 0 });
    }
  };

  if (text === "SKILLS") {
    addArcPoints(-2.0, 0.25, 0.28, 0.25, 0.2, Math.PI, 180);
    addArcPoints(-2.0, -0.25, 0.28, 0.25, Math.PI, 0.2, 180);
    addSegmentPoints([-1.4, -0.5], [-1.4, 0.5], 130, true, true);
    addSegmentPoints([-1.4, 0.0], [-0.85, 0.5], 120, false, true);
    addSegmentPoints([-1.4, 0.0], [-0.85, -0.5], 120, false, true);
    addSegmentPoints([-0.45, -0.5], [-0.45, 0.5], 140, true, true);
    addSegmentPoints([0.0, -0.5], [0.0, 0.5], 130, true, true);
    addSegmentPoints([0.0, -0.5], [0.45, -0.5], 110, true, true);
    addSegmentPoints([0.8, -0.5], [0.8, 0.5], 130, true, true);
    addSegmentPoints([0.8, -0.5], [1.25, -0.5], 110, true, true);
    addArcPoints(1.8, 0.25, 0.28, 0.25, 0.2, Math.PI, 180);
    addArcPoints(1.8, -0.25, 0.28, 0.25, Math.PI, 0.2, 180);
  } else {
    // "OVERVIEW"
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
  }

  while (rawPoints.length < totalPoints) {
    rawPoints.push({ ...rawPoints[rawPoints.length % 200] });
  }

  return rawPoints.slice(0, totalPoints);
}

// =========================================================================
// 3D MECHANICAL GEAR GENERATOR
// Parametrically constructs an authentic 8-tooth mechanical gear with
// outer involute teeth, pitch rim, 6 radial spokes, center hub, axle bore,
// keyway notch, and mechanical fastener nodes.
// =========================================================================
function generateMechanicalGearPoints(
  count: number,
  centerX: number,
  centerY: number,
  radius: number
): RawPoint[] {
  const points: RawPoint[] = [];
  const teeth = 8;
  const outerR = radius;
  const rootR = radius * 0.76;
  const rimR = radius * 0.60;
  const hubR = radius * 0.30;
  const axleR = radius * 0.14;

  // 1. Involute Teeth & Outer Rim Land (approx 36% of points = 450)
  const teethCount = Math.floor(count * 0.36);
  for (let i = 0; i < teethCount; i++) {
    const angle = (i / teethCount) * Math.PI * 2;
    const toothPhase = ((angle * teeth) / (Math.PI * 2)) % 1.0;
    // Trapezoidal tooth profile with beveled slopes
    let toothHeight = 0;
    if (toothPhase < 0.22) {
      toothHeight = toothPhase / 0.22; // slope up
    } else if (toothPhase < 0.50) {
      toothHeight = 1.0; // crest top land
    } else if (toothPhase < 0.72) {
      toothHeight = 1.0 - (toothPhase - 0.50) / 0.22; // slope down
    } else {
      toothHeight = 0.0; // root bottom land
    }

    const r = rootR + (outerR - rootR) * toothHeight;
    // Dual-face 3D depth for solid mechanical appearance
    const zFace = i % 2 === 0 ? 0.016 : -0.016;
    const isToothTip = toothPhase >= 0.22 && toothPhase <= 0.50 && i % 4 === 0;

    points.push({
      x: centerX + Math.cos(angle) * r,
      y: centerY + Math.sin(angle) * r,
      z: zFace,
      isNode: isToothTip,
    });
  }

  // 2. Pitch Circle / Tooth Root Ring (approx 14% of points = 175)
  const pitchCount = Math.floor(count * 0.14);
  for (let i = 0; i < pitchCount; i++) {
    const angle = (i / pitchCount) * Math.PI * 2;
    const z = i % 2 === 0 ? 0.012 : -0.012;
    points.push({
      x: centerX + Math.cos(angle) * rootR,
      y: centerY + Math.sin(angle) * rootR,
      z,
      isNode: i % 18 === 0,
    });
  }

  // 3. Inner Rim Ring (approx 14% of points = 175)
  const rimCount = Math.floor(count * 0.14);
  for (let i = 0; i < rimCount; i++) {
    const angle = (i / rimCount) * Math.PI * 2;
    const z = i % 2 === 0 ? 0.014 : -0.014;
    points.push({
      x: centerX + Math.cos(angle) * rimR,
      y: centerY + Math.sin(angle) * rimR,
      z,
      isNode: i % 20 === 0,
    });
  }

  // 4. 6 Radial Mechanical Spokes (approx 20% of points = 250)
  const numSpokes = 6;
  const spokeTotalCount = Math.floor(count * 0.20);
  const ptsPerSpoke = Math.floor(spokeTotalCount / numSpokes);
  for (let s = 0; s < numSpokes; s++) {
    const baseAngle = (s / numSpokes) * Math.PI * 2;
    for (let p = 0; p < ptsPerSpoke; p++) {
      const t = ptsPerSpoke > 1 ? p / (ptsPerSpoke - 1) : 0.5;
      const r = hubR + t * (rimR - hubR);
      const spokeHalfW = 0.012;
      const widthOffset = ((p % 2 === 0 ? 1 : -1) * spokeHalfW) / Math.max(r, 0.1);
      const angle = baseAngle + widthOffset;
      const z = p % 3 === 0 ? 0.012 : -0.012;
      points.push({
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r,
        z,
        isNode: p === 0 || p === ptsPerSpoke - 1,
      });
    }
  }

  // 5. Center Hub Outer Ring (approx 9% of points = 112)
  const hubCount = Math.floor(count * 0.09);
  for (let i = 0; i < hubCount; i++) {
    const angle = (i / hubCount) * Math.PI * 2;
    const z = i % 2 === 0 ? 0.014 : -0.014;
    points.push({
      x: centerX + Math.cos(angle) * hubR,
      y: centerY + Math.sin(angle) * hubR,
      z,
      isNode: i % 14 === 0,
    });
  }

  // 6. Axle Bore & Keyway Notch (approx 7% of points = 88)
  const axleCount = Math.floor(count * 0.07);
  for (let i = 0; i < axleCount; i++) {
    const angle = (i / axleCount) * Math.PI * 2;
    const z = i % 2 === 0 ? 0.008 : -0.008;
    // Keyway slot notch on top
    const isKeyway = Math.abs(angle - Math.PI / 2) < 0.28;
    const r = isKeyway ? axleR * 1.45 : axleR;
    points.push({
      x: centerX + Math.cos(angle) * r,
      y: centerY + Math.sin(angle) * r,
      z,
      isNode: isKeyway,
    });
  }

  // 7. Mechanical Fastener Rivets / Bolts on Spoke Shoulders (fill remaining)
  let remaining = count - points.length;
  for (let i = 0; i < remaining; i++) {
    const s = i % numSpokes;
    const baseAngle = (s / numSpokes) * Math.PI * 2;
    const boltR = (hubR + rimR) * 0.52;
    const jitter = (Math.random() - 0.5) * 0.015;
    points.push({
      x: centerX + Math.cos(baseAngle) * (boltR + jitter),
      y: centerY + Math.sin(baseAngle) * (boltR + jitter),
      z: 0.02,
      isNode: true,
    });
  }

  return points.slice(0, count);
}

interface CelestialMeshProps {
  mouseWorld: { x: number; y: number };
  mouseActive: number;
}

function UnifiedCelestialMesh({
  mouseWorld,
  mouseActive,
}: CelestialMeshProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined" && document.fonts) {
      Promise.all([
        document.fonts.load('700 240px "Clash Display"'),
        document.fonts.ready,
      ])
        .then(() => setFontLoaded(true))
        .catch(() => setFontLoaded(true));
    } else {
      setFontLoaded(true);
    }
  }, []);

  const smoothOverviewProgress = useRef(0);
  const smoothSkillsProgress = useRef(0);
  const smoothObjectProgress = useRef(0);
  const smoothOpacity = useRef(0);
  const smoothMouseWorld = useRef(new THREE.Vector2(0, 0));
  const smoothMouseActive = useRef(0.0);

  // Exact 2,500 particles with key target states:
  // 1. OVERVIEW (centered top, 2,500 particles)
  // 2. Dispersed Nebula (full screen, 2,500 particles)
  // 3. SKILLS (top-left, exactly 1,250 particles = 50%)
  // 4. 3D Mechanical Gear Icon (top-right, exactly 1,250 particles = 50%)
  const pointsGeometry = useMemo(() => {
    const overviewPositions: number[] = [];
    const dispersedPositions: number[] = [];
    const skillsPositions: number[] = [];
    const objectPositions: number[] = [];
    const isGears: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    const phases: number[] = [];
    const swirlSpeeds: number[] = [];
    const randoms: number[] = [];

    // Earthy Color Palette tokens
    const sandPalette = [
      new THREE.Color("#dda15e"),
      new THREE.Color("#e6b172"),
      new THREE.Color("#eec187"),
      new THREE.Color("#f4d29f"),
      new THREE.Color("#d4944d"),
    ];
    const terracottaPalette = [
      new THREE.Color("#bc6c25"),
      new THREE.Color("#cd7629"),
      new THREE.Color("#d98236"),
      new THREE.Color("#e4934b"),
      new THREE.Color("#b85d1e"),
    ];
    const mossPalette = [
      new THREE.Color("#606c38"),
      new THREE.Color("#788746"),
      new THREE.Color("#8f9f55"),
      new THREE.Color("#9cb05d"),
    ];
    const creamPalette = [
      new THREE.Color("#fefae0"),
      new THREE.Color("#fffdf0"),
      new THREE.Color("#fbf5d5"),
    ];

    const TOTAL_POINTS = 2500;
    const SKILLS_POINTS = 1250;
    const GEAR_POINTS = 1250;

    // 1. Sample "OVERVIEW" (Centered Upper Area) - utilizes ALL 2,500 particles
    const overviewCenterY = viewport.height * (viewport.width < 3.2 ? 0.26 : 0.23);
    const overviewWidthRatio = viewport.width < 3.2 ? 0.88 : 0.68;
    const overviewHeightRatio = viewport.width < 3.2 ? 0.16 : 0.20;
    const rawOverview = sampleClashDisplayText(
      "OVERVIEW",
      TOTAL_POINTS,
      viewport.width,
      viewport.height,
      overviewWidthRatio,
      overviewHeightRatio,
      0, // centered X
      overviewCenterY
    );

    // 2. Sample "SKILLS" (Top-Left Area) - utilizes first 1,250 particles (50%)
    const skillsCenterX = -viewport.width * (viewport.width < 3.2 ? 0.22 : 0.30);
    const skillsCenterY = viewport.height * (viewport.width < 3.2 ? 0.34 : 0.32);
    const skillsWidthRatio = viewport.width < 3.2 ? 0.44 : 0.28;
    const skillsHeightRatio = viewport.width < 3.2 ? 0.09 : 0.12;
    const rawSkills = sampleClashDisplayText(
      "SKILLS",
      SKILLS_POINTS,
      viewport.width,
      viewport.height,
      skillsWidthRatio,
      skillsHeightRatio,
      skillsCenterX,
      skillsCenterY
    );

    // 3. Generate 3D Mechanical Gear Icon (Top-Right Area) - utilizes remaining 1,250 particles (50%)
    const gearCenterX = viewport.width * (viewport.width < 3.2 ? 0.26 : 0.32);
    const gearCenterY = viewport.height * (viewport.width < 3.2 ? 0.34 : 0.32);
    const gearRadius = viewport.width < 3.2 ? 0.30 : 0.40;
    const rawGear = generateMechanicalGearPoints(
      GEAR_POINTS,
      gearCenterX,
      gearCenterY,
      gearRadius
    );

    // 4. Stratified grid for Dispersed Nebula
    const totalCount = TOTAL_POINTS;
    const numCols = 50;
    const numRows = Math.ceil(totalCount / numCols);

    const cellIndices = Array.from({ length: totalCount }, (_, i) => i);
    for (let i = cellIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cellIndices[i], cellIndices[j]] = [cellIndices[j], cellIndices[i]];
    }

    for (let idx = 0; idx < TOTAL_POINTS; idx++) {
      const ptOverview = rawOverview[idx];
      let ptPhase2: RawPoint;
      let isGearVal = 0.0;

      if (idx < SKILLS_POINTS) {
        ptPhase2 = rawSkills[idx];
        isGearVal = 0.0;
      } else {
        ptPhase2 = rawGear[idx - SKILLS_POINTS];
        isGearVal = 1.0;
      }

      overviewPositions.push(ptOverview.x, ptOverview.y, ptOverview.z);
      skillsPositions.push(ptPhase2.x, ptPhase2.y, ptPhase2.z);
      isGears.push(isGearVal);

      const cellIdx = cellIndices[idx];
      const col = cellIdx % numCols;
      const row = Math.floor(cellIdx / numCols);

      const u = (col + 0.15 + Math.random() * 0.7) / numCols;
      const v = (row + 0.15 + Math.random() * 0.7) / numRows;

      const dispersedX = (u - 0.5) * (viewport.width * 1.15);
      const dispersedY = (v - 0.5) * (viewport.height * 1.15);
      const dispersedZ = (Math.random() - 0.5) * 2.8;

      dispersedPositions.push(dispersedX, dispersedY, dispersedZ);

      // 5. Parametric 3D Celestial Torus Object
      const loopU = (idx / TOTAL_POINTS) * Math.PI * 2 * 6;
      const loopV = (idx / TOTAL_POINTS) * Math.PI * 2;
      const majorR = 1.35;
      const minorR = 0.42;
      const cogTeeth = 1.0 + 0.15 * Math.sin(loopV * 12);
      const ox = (majorR * cogTeeth + minorR * Math.cos(loopU)) * Math.cos(loopV);
      const oy = (majorR * cogTeeth + minorR * Math.cos(loopU)) * Math.sin(loopV);
      const oz = minorR * Math.sin(loopU);
      objectPositions.push(ox, oy, oz);

      // Earthy Color assignment
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

      const size = ptOverview.isNode || ptPhase2.isNode
        ? 1.15 + Math.random() * 0.28
        : 0.75 + Math.random() * 0.25;
      sizes.push(size);

      phases.push(Math.random() * Math.PI * 2);
      swirlSpeeds.push((Math.random() - 0.5) * 1.6);
      randoms.push(Math.random());
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("aOverviewPosition", new THREE.Float32BufferAttribute(overviewPositions, 3));
    geo.setAttribute("aDispersedPosition", new THREE.Float32BufferAttribute(dispersedPositions, 3));
    geo.setAttribute("aSkillsPosition", new THREE.Float32BufferAttribute(skillsPositions, 3));
    geo.setAttribute("aObjectPosition", new THREE.Float32BufferAttribute(objectPositions, 3));
    geo.setAttribute("aIsGear", new THREE.Float32BufferAttribute(isGears, 1));
    // Default position attribute for bounding box
    geo.setAttribute("position", new THREE.Float32BufferAttribute(overviewPositions, 3));

    geo.setAttribute("aColor", new THREE.Float32BufferAttribute(colors, 3));
    geo.setAttribute("aSize", new THREE.Float32BufferAttribute(sizes, 1));
    geo.setAttribute("aPhase", new THREE.Float32BufferAttribute(phases, 1));
    geo.setAttribute("aSwirlSpeed", new THREE.Float32BufferAttribute(swirlSpeeds, 1));
    geo.setAttribute("aRandom", new THREE.Float32BufferAttribute(randoms, 1));

    return geo;
  }, [viewport.width, viewport.height, fontLoaded]);

  const gearCenterX = viewport.width * (viewport.width < 3.2 ? 0.26 : 0.32);
  const gearCenterY = viewport.height * (viewport.width < 3.2 ? 0.34 : 0.32);

  const uniforms = useMemo(
    () => ({
      uOverviewProgress: { value: 0.0 },
      uSkillsProgress: { value: 0.0 },
      uObjectProgress: { value: 0.0 },
      uOpacity: { value: 0.0 },
      uTime: { value: 0.0 },
      uGearCenter: { value: new THREE.Vector2(gearCenterX, gearCenterY) },
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

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    // Lerp progress values directly from the global particleBridge
    smoothOverviewProgress.current = THREE.MathUtils.lerp(
      smoothOverviewProgress.current,
      particleBridge.overviewProgress,
      0.08
    );
    smoothSkillsProgress.current = THREE.MathUtils.lerp(
      smoothSkillsProgress.current,
      particleBridge.skillsProgress,
      0.08
    );
    smoothObjectProgress.current = THREE.MathUtils.lerp(
      smoothObjectProgress.current,
      particleBridge.objectProgress,
      0.08
    );
    smoothOpacity.current = THREE.MathUtils.lerp(
      smoothOpacity.current,
      particleBridge.isDarkActive ? 1.0 : 0.0,
      0.08
    );

    smoothMouseWorld.current.lerp(new THREE.Vector2(mouseWorld.x, mouseWorld.y), 0.1);
    smoothMouseActive.current = THREE.MathUtils.lerp(smoothMouseActive.current, mouseActive, 0.12);

    const currentGearCenterX = viewport.width * (viewport.width < 3.2 ? 0.26 : 0.32);
    const currentGearCenterY = viewport.height * (viewport.width < 3.2 ? 0.34 : 0.32);

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time;
      materialRef.current.uniforms.uOverviewProgress.value = smoothOverviewProgress.current;
      materialRef.current.uniforms.uSkillsProgress.value = smoothSkillsProgress.current;
      materialRef.current.uniforms.uObjectProgress.value = smoothObjectProgress.current;
      materialRef.current.uniforms.uOpacity.value = smoothOpacity.current;
      materialRef.current.uniforms.uGearCenter.value.set(currentGearCenterX, currentGearCenterY);
      materialRef.current.uniforms.uMouseWorld.value.copy(smoothMouseWorld.current);
      materialRef.current.uniforms.uMouseActive.value = smoothMouseActive.current;
    }

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
          uniform float uOverviewProgress;
          uniform float uSkillsProgress;
          uniform float uObjectProgress;
          uniform float uOpacity;
          uniform float uTime;
          uniform vec2 uGearCenter;
          uniform vec2 uMouseWorld;
          uniform float uMouseActive;
          uniform float uPixelRatio;

          attribute vec3 aOverviewPosition;
          attribute vec3 aDispersedPosition;
          attribute vec3 aSkillsPosition;
          attribute vec3 aObjectPosition;
          attribute float aIsGear;

          attribute vec3 aColor;
          attribute float aSize;
          attribute float aPhase;
          attribute float aSwirlSpeed;
          attribute float aRandom;

          varying vec3 vColor;
          varying float vAlpha;

          float easeOutQuart(float x) {
            return 1.0 - pow(1.0 - x, 4.0);
          }

          void main() {
            vColor = aColor;

            // Phase 1: Overview to Dispersed Nebula
            float p1Offset = aRandom * 0.22;
            float p1 = clamp((uOverviewProgress - p1Offset) / (1.0 - p1Offset + 0.0001), 0.0, 1.0);
            float easeP1 = easeOutQuart(p1);

            float arc1 = sin(easeP1 * 3.14159);
            vec3 flightArc1 = vec3(
              arc1 * (aRandom - 0.5) * 1.5,
              arc1 * (aSwirlSpeed) * 1.0,
              arc1 * (aRandom - 0.5) * 1.3
            );
            vec3 posPhase1 = mix(aOverviewPosition, aDispersedPosition, easeP1) + flightArc1;

            // Phase 2: Dispersed Nebula to "SKILLS" (Left) & Mechanical Rotating Gear (Right)
            float p2Offset = aRandom * 0.22;
            float p2 = clamp((uSkillsProgress - p2Offset) / (1.0 - p2Offset + 0.0001), 0.0, 1.0);
            float easeP2 = easeOutQuart(p2);

            float arc2 = sin((1.0 - easeP2) * 3.14159);
            vec3 flightArc2 = vec3(
              arc2 * (aRandom - 0.5) * 1.4,
              arc2 * (aSwirlSpeed) * 1.0,
              arc2 * (aRandom - 0.5) * 1.2
            );

            // Compute rotating target position for the Gear Icon
            vec3 targetPhase2 = aSkillsPosition;
            if (aIsGear > 0.5) {
              vec2 rel = targetPhase2.xy - uGearCenter;
              // Smooth clockwise mechanical rotation
              float gearAngle = -uTime * 0.70;
              float cosG = cos(gearAngle);
              float sinG = sin(gearAngle);
              targetPhase2.xy = uGearCenter + mat2(cosG, -sinG, sinG, cosG) * rel;
            }

            vec3 posPhase2 = mix(aDispersedPosition, targetPhase2, easeP2) + flightArc2;

            // Seamless blending between Phase 1 and Phase 2:
            // When uSkillsProgress > 0, smoothly transitions from dispersed field into SKILLS & Gear
            vec3 posBase = mix(posPhase1, posPhase2, easeP2);

            // Phase 3: Morph into 3D Geometric / Mechanical Object
            float p3Offset = aRandom * 0.22;
            float p3 = clamp((uObjectProgress - p3Offset) / (1.0 - p3Offset + 0.0001), 0.0, 1.0);
            float easeP3 = easeOutQuart(p3);

            vec3 rotatedObj = aObjectPosition;
            float objAngle = uTime * 0.45;
            float cosA = cos(objAngle);
            float sinA = sin(objAngle);
            rotatedObj.xz = mat2(cosA, -sinA, sinA, cosA) * rotatedObj.xz;

            vec3 pos = mix(posBase, rotatedObj, easeP3);

            // Flight turbulence
            float flightActive = max(easeP1 * (1.0 - easeP1), (1.0 - easeP2) * easeP2);
            pos.y += sin(uTime * 1.2 + aPhase) * 0.04 * flightActive;
            pos.x += cos(uTime * 0.9 + aPhase * 1.3) * 0.03 * flightActive;
            pos.z += sin(uTime * 1.0 + aPhase * 0.8) * 0.03 * flightActive;

            // Refined, localized interactive mouse repulsion:
            // Active when hovering directly over assembled text or gear
            vec2 mouseOffset = pos.xy - uMouseWorld;
            float mouseDist = length(mouseOffset);
            float mouseRadius = aIsGear > 0.5 ? 0.46 : 0.36;

            float repelStrength = smoothstep(mouseRadius, 0.0, mouseDist);
            float isAssembled = max(1.0 - easeP1, easeP2);
            float mouseRepel = repelStrength * repelStrength * 0.065 * uMouseActive * isAssembled;
            pos.xy += normalize(mouseOffset + vec2(0.0001, 0.0001)) * mouseRepel;
            pos.z += repelStrength * 0.035 * uMouseActive * isAssembled;

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;

            // Crisp pinprick starlight size attenuation
            float twinkle = 0.88 + 0.22 * sin(uTime * 2.5 + aPhase);
            float baseSize = aSize * uPixelRatio * (28.0 / -mvPosition.z) * twinkle;
            float gearBonus = aIsGear * 0.15;
            gl_PointSize = clamp(baseSize * (1.0 + flightActive * 0.35 + gearBonus), 1.2, 5.2);

            vAlpha = (0.88 + flightActive * 0.12) * uOpacity;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          varying float vAlpha;

          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;

            float edge = smoothstep(0.5, 0.38, dist);
            float core = smoothstep(0.32, 0.0, dist);
            float sparkle = pow(smoothstep(0.18, 0.0, dist), 3.0);
            vec3 creamSparkle = vec3(0.996, 0.980, 0.878) * sparkle * 0.85;

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
  className?: string;
}

export default function CharacterPointsCanvas({
  className = "",
}: CharacterPointsCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseState, setMouseState] = useState({
    worldX: 0,
    worldY: 0,
    active: 0,
  });

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

      if (!isInside || !particleBridge.isDarkActive) {
        setMouseState((prev) =>
          prev.active === 0 ? prev : { worldX: prev.worldX, worldY: prev.worldY, active: 0 }
        );
        return;
      }

      const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((clientY - rect.top) / rect.height) * 2 - 1);

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
        <UnifiedCelestialMesh
          mouseWorld={{ x: mouseState.worldX, y: mouseState.worldY }}
          mouseActive={mouseState.active}
        />
      </Canvas>
    </div>
  );
}
