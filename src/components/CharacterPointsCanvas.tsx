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
  wordCenterXOrLeft: number,
  wordCenterY: number,
  align: "center" | "left" = "center"
): RawPoint[] {
  if (typeof document === "undefined") {
    return generateFallbackPoints(text, viewportWidth, viewportHeight, targetWidthRatio, targetHeightRatio, wordCenterXOrLeft, wordCenterY, totalPoints, align);
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return generateFallbackPoints(text, viewportWidth, viewportHeight, targetWidthRatio, targetHeightRatio, wordCenterXOrLeft, wordCenterY, totalPoints, align);
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
  // Leftmost inked pixel, used to left-align the word with zero side bearing
  let minPixelX = canvasW;

  for (let y = 1; y < canvasH - 1; y++) {
    for (let x = 1; x < canvasW - 1; x++) {
      const idx = (y * canvasW + x) * 4;
      const alpha = data[idx + 3];

      if (alpha > 75) {
        if (x < minPixelX) minPixelX = x;

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
    return generateFallbackPoints(text, viewportWidth, viewportHeight, targetWidthRatio, targetHeightRatio, wordCenterXOrLeft, wordCenterY, totalPoints, align);
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
      const nx = align === "left"
        ? (p.x - minPixelX) * scale + wordCenterXOrLeft
        : (p.x - centerX) * scale + wordCenterXOrLeft;
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
      const nx = align === "left"
        ? (p.x - minPixelX) * scale + wordCenterXOrLeft
        : (p.x - centerX) * scale + wordCenterXOrLeft;
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
  wordCenterXOrLeft: number,
  wordCenterY: number,
  totalPoints: number = 2500,
  align: "center" | "left" = "center"
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
    // "ABOUT ME"
    // A
    addSegmentPoints([-2.7, -0.55], [-2.35, 0.55], 115, true, true);
    addSegmentPoints([-2.35, 0.55], [-2.0, -0.55], 115, false, true);
    addSegmentPoints([-2.52, -0.1], [-2.18, -0.1], 50, false, false);
    // B
    addSegmentPoints([-1.75, -0.55], [-1.75, 0.55], 105, true, true);
    addArcPoints(-1.75, 0.275, 0.26, 0.275, -Math.PI / 2, Math.PI / 2, 85);
    addArcPoints(-1.75, -0.275, 0.28, 0.275, -Math.PI / 2, Math.PI / 2, 90);
    // O
    addArcPoints(-1.05, 0.0, 0.30, 0.54, 0, Math.PI * 2, 220);
    // U
    addSegmentPoints([-0.60, 0.55], [-0.60, -0.25], 85, true, false);
    addArcPoints(-0.40, -0.25, 0.20, 0.30, Math.PI, 0, 75);
    addSegmentPoints([-0.20, -0.25], [-0.20, 0.55], 85, false, true);
    // T
    addSegmentPoints([0.25, 0.55], [0.25, -0.55], 110, true, true);
    addSegmentPoints([-0.02, 0.55], [0.52, 0.55], 65, false, false);
    // Space
    // M
    addSegmentPoints([0.95, -0.55], [0.95, 0.55], 95, true, true);
    addSegmentPoints([0.95, 0.55], [1.30, 0.0], 80, false, true);
    addSegmentPoints([1.30, 0.0], [1.65, 0.55], 80, false, true);
    addSegmentPoints([1.65, 0.55], [1.65, -0.55], 95, false, true);
    // E
    addSegmentPoints([2.0, -0.55], [2.0, 0.55], 100, true, true);
    addSegmentPoints([2.0, 0.55], [2.48, 0.55], 60, false, false);
    addSegmentPoints([2.0, 0.0], [2.38, 0.0], 48, false, false);
    addSegmentPoints([2.0, -0.55], [2.48, -0.55], 60, false, false);
  }

  // Shift points according to alignment
  let minX = Infinity;
  for (let i = 0; i < rawPoints.length; i++) {
    if (rawPoints[i].x < minX) minX = rawPoints[i].x;
  }
  for (let i = 0; i < rawPoints.length; i++) {
    if (align === "left") {
      rawPoints[i].x = rawPoints[i].x - minX + wordCenterXOrLeft;
    } else {
      rawPoints[i].x += wordCenterXOrLeft;
    }
  }

  while (rawPoints.length < totalPoints) {
    rawPoints.push({ ...rawPoints[rawPoints.length % 200] });
  }

  return rawPoints.slice(0, totalPoints);
}

// =========================================================================
// 3D CODE SYMBOL "</>" GENERATOR
// Parametrically constructs a sharp, proportional "</>" code tag symbol with:
// - Left angle bracket "<"
// - Centered diagonal forward slash "/"
// - Right angle bracket ">" (tip touching targetRightX)
// Distributed across exactly 1,250 particles with multi-strand thickness,
// 3D depth, and glowing vertex nodes.
// =========================================================================
function generateCodeSymbolPoints(
  count: number,
  targetRightX: number,
  centerY: number,
  targetHeight: number
): RawPoint[] {
  const points: RawPoint[] = [];
  const h = targetHeight;
  const bracketH = h * 0.90;
  const slashH = h * 1.08;
  const strokeW = h * 0.082;
  const bracketW = h * 0.44;
  const slashW = h * 0.36;
  const gap = h * 0.18;

  const totalW = bracketW * 2 + slashW + gap * 2;
  const startX = targetRightX - totalW;

  // Bracket 1: "<"
  const b1TopX = startX + bracketW;
  const b1TopY = centerY + bracketH * 0.5;
  const b1TipX = startX;
  const b1TipY = centerY;
  const b1BotX = startX + bracketW;
  const b1BotY = centerY - bracketH * 0.5;

  // Slash: "/"
  const slashCenterX = startX + bracketW + gap + slashW * 0.5;
  const sStartX = slashCenterX - slashW * 0.5;
  const sStartY = centerY - slashH * 0.5;
  const sEndX = slashCenterX + slashW * 0.5;
  const sEndY = centerY + slashH * 0.5;

  // Bracket 2: ">" - tip aligns to targetRightX
  const b2TopX = targetRightX - bracketW;
  const b2TopY = centerY + bracketH * 0.5;
  const b2TipX = targetRightX;
  const b2TipY = centerY;
  const b2BotX = targetRightX - bracketW;
  const b2BotY = centerY - bracketH * 0.5;

  function sampleLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    numPts: number,
    isArm = false
  ) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1e-4;
    const nx = -dy / len;
    const ny = dx / len;

    for (let i = 0; i < numPts; i++) {
      const t = numPts > 1 ? i / (numPts - 1) : 0.5;
      const baseX = x1 + dx * t;
      const baseY = y1 + dy * t;

      // Multi-strand thickness
      const strand = (i % 3) - 1; // -1, 0, 1
      const offsetX = nx * strand * (strokeW * 0.45);
      const offsetY = ny * strand * (strokeW * 0.45);
      const z = i % 2 === 0 ? 0.015 : -0.015;

      const isCorner = i === 0 || i === numPts - 1;
      const isTip = isArm && i === numPts - 1;

      points.push({
        x: baseX + offsetX,
        y: baseY + offsetY,
        z,
        isNode: isCorner || isTip || i % 24 === 0,
      });
    }
  }

  // Exact 1,250 points distribution:
  // 4 bracket arms: 200 pts each = 800 pts
  // 1 slash: 450 pts
  // Total = 1,250 pts
  const ptsPerArm = Math.floor(count * 0.16);
  const ptsSlash = count - ptsPerArm * 4;

  // 1. "<" top arm & bottom arm
  sampleLine(b1TopX, b1TopY, b1TipX, b1TipY, ptsPerArm, true);
  sampleLine(b1TipX, b1TipY, b1BotX, b1BotY, ptsPerArm, true);

  // 2. "/" slash
  sampleLine(sStartX, sStartY, sEndX, sEndY, ptsSlash, false);

  // 3. ">" top arm & bottom arm
  sampleLine(b2TopX, b2TopY, b2TipX, b2TipY, ptsPerArm, true);
  sampleLine(b2TipX, b2TipY, b2BotX, b2BotY, ptsPerArm, true);

  return points.slice(0, count);
}

// =========================================================================
// HEADER CONTENT EDGES → WORLD SPACE
// Mirrors Header.tsx layout: px-5 / sm:px-8 / md:px-12 padding + max-w-7xl
// (1280px) centered container. Returns left/right content edges in world units
// so particle shapes line up exactly with the monogram and theme toggle.
// =========================================================================
function getHeaderContentEdgesWorld(viewportWidth: number, pxWidth: number) {
  const safePx = Math.max(pxWidth, 1);
  const mq = (q: string) =>
    typeof window !== "undefined" && window.matchMedia ? window.matchMedia(q).matches : safePx >= parseInt(q.replace(/\D/g, ""), 10);
  const pad = mq("(min-width: 768px)") ? 48 : mq("(min-width: 640px)") ? 32 : 20;
  const contentW = Math.min(safePx - pad * 2, 1280);
  const leftPx = (safePx - contentW) / 2;
  const worldPerPx = viewportWidth / safePx;
  const left = -viewportWidth / 2 + leftPx * worldPerPx;
  return { left, right: -left };
}

// Global lightweight mouse state for direct 120fps WebGL updates without React re-renders
const globalMouseState = {
  worldX: 0,
  worldY: 0,
  active: 0,
};

function UnifiedCelestialMesh() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport, size } = useThree();
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
  // 1. ABOUT ME (centered top, 2,500 particles)
  // 2. Dispersed Nebula (full screen, 2,500 particles)
  // 3. SKILLS (top-left, exactly 1,250 particles = 50%)
  // 4. 3D Code Symbol "</>" (top-right, exactly 1,250 particles = 50%)
  const pointsGeometry = useMemo(() => {
    const overviewPositions: number[] = [];
    const dispersedPositions: number[] = [];
    const skillsPositions: number[] = [];
    const objectPositions: number[] = [];
    const isSymbols: number[] = [];
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
    // Golden Palette from our brand palette (#dda15e Earth Yellow / Warm Gold)
    const goldenPalette = [
      new THREE.Color("#dda15e"), // Primary Earth Yellow / Sand Gold
      new THREE.Color("#f4c07b"), // Radiant Warm Gold
      new THREE.Color("#eec187"), // Luminous Amber Gold
      new THREE.Color("#f5cb8a"), // Honey Gold
      new THREE.Color("#e6b172"), // Rich Warm Gold
    ];

    const TOTAL_POINTS = 2500;
    const SKILLS_POINTS = 1750; // Dense, sharp "SKILLS" text
    const SYMBOL_POINTS = 750;  // Perfectly balanced "</>" symbol

    // 1. Sample "ABOUT ME" (Centered Upper Area) - utilizes ALL 2,500 particles
    const overviewCenterY = viewport.height * (viewport.width < 3.2 ? 0.26 : 0.23);
    const overviewWidthRatio = viewport.width < 3.2 ? 0.88 : 0.68;
    const overviewHeightRatio = viewport.width < 3.2 ? 0.16 : 0.20;
    const rawOverview = sampleClashDisplayText(
      "ABOUT ME",
      TOTAL_POINTS,
      viewport.width,
      viewport.height,
      overviewWidthRatio,
      overviewHeightRatio,
      0, // centered X
      overviewCenterY
    );

    // Header content edges (monogram left edge / theme toggle right edge)
    const edges = getHeaderContentEdgesWorld(viewport.width, size.width);

    // 2. Sample "SKILLS" (Top-Left) - first 1,750 particles (70%)
    // Left-aligned: first glyph pixel sits exactly on the header's left content edge
    const skillsLeftX = edges.left;
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
      skillsLeftX,
      skillsCenterY,
      "left"
    );

    // 3. 3D Code Tag Symbol "</>" (Top-Right) - remaining 750 particles (30%)
    // The right tip of the ">" bracket touches the theme toggle's right edge exactly
    const symbolH = viewport.height * (viewport.width < 3.2 ? 0.10 : 0.13);
    const rawCodeSymbol = generateCodeSymbolPoints(
      SYMBOL_POINTS,
      edges.right,
      skillsCenterY,
      symbolH
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
      let isSymbolVal = 0.0;

      if (idx < SKILLS_POINTS) {
        ptPhase2 = rawSkills[idx];
        isSymbolVal = 0.0;
      } else {
        ptPhase2 = rawCodeSymbol[idx - SKILLS_POINTS];
        isSymbolVal = 1.0;
      }

      overviewPositions.push(ptOverview.x, ptOverview.y, ptOverview.z);
      skillsPositions.push(ptPhase2.x, ptPhase2.y, ptPhase2.z);
      isSymbols.push(isSymbolVal);

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

      // Unified Earthy Color assignment: symbol and text share the exact same color mix
      const streamRand = Math.random();
      let colObj: THREE.Color;
      if (streamRand < 0.36) {
        colObj = sandPalette[Math.floor(Math.random() * sandPalette.length)];
      } else if (streamRand < 0.70) {
        colObj = terracottaPalette[Math.floor(Math.random() * terracottaPalette.length)];
      } else if (streamRand < 0.88) {
        colObj = mossPalette[Math.floor(Math.random() * mossPalette.length)];
      } else {
        colObj = goldenPalette[Math.floor(Math.random() * goldenPalette.length)];
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
    geo.setAttribute("aIsSymbol", new THREE.Float32BufferAttribute(isSymbols, 1));
    // Default position attribute for bounding box
    geo.setAttribute("position", new THREE.Float32BufferAttribute(overviewPositions, 3));

    geo.setAttribute("aColor", new THREE.Float32BufferAttribute(colors, 3));
    geo.setAttribute("aSize", new THREE.Float32BufferAttribute(sizes, 1));
    geo.setAttribute("aPhase", new THREE.Float32BufferAttribute(phases, 1));
    geo.setAttribute("aSwirlSpeed", new THREE.Float32BufferAttribute(swirlSpeeds, 1));
    geo.setAttribute("aRandom", new THREE.Float32BufferAttribute(randoms, 1));

    return geo;
  }, [viewport.width, viewport.height, size.width, fontLoaded]);

  const uniforms = useMemo(
    () => ({
      uOverviewProgress: { value: 0.0 },
      uSkillsProgress: { value: 0.0 },
      uObjectProgress: { value: 0.0 },
      uOpacity: { value: 0.0 },
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

    smoothMouseWorld.current.lerp(
      new THREE.Vector2(globalMouseState.worldX, globalMouseState.worldY),
      0.15
    );
    smoothMouseActive.current = THREE.MathUtils.lerp(
      smoothMouseActive.current,
      globalMouseState.active,
      0.15
    );

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time;
      materialRef.current.uniforms.uOverviewProgress.value = smoothOverviewProgress.current;
      materialRef.current.uniforms.uSkillsProgress.value = smoothSkillsProgress.current;
      materialRef.current.uniforms.uObjectProgress.value = smoothObjectProgress.current;
      materialRef.current.uniforms.uOpacity.value = smoothOpacity.current;
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
          uniform vec2 uMouseWorld;
          uniform float uMouseActive;
          uniform float uPixelRatio;

          attribute vec3 aOverviewPosition;
          attribute vec3 aDispersedPosition;
          attribute vec3 aSkillsPosition;
          attribute vec3 aObjectPosition;
          attribute float aIsSymbol;

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

            // Phase 2: Dispersed Nebula to "SKILLS" (Left) & 3D Code Symbol "</>" (Right)
            float p2Offset = aRandom * 0.22;
            float p2 = clamp((uSkillsProgress - p2Offset) / (1.0 - p2Offset + 0.0001), 0.0, 1.0);
            float easeP2 = easeOutQuart(p2);

            float arc2 = sin((1.0 - easeP2) * 3.14159);
            vec3 flightArc2 = vec3(
              arc2 * (aRandom - 0.5) * 1.4,
              arc2 * (aSwirlSpeed) * 1.0,
              arc2 * (aRandom - 0.5) * 1.2
            );

            // Target position for 3D Code Symbol "</>"
            vec3 targetPhase2 = aSkillsPosition;
            if (aIsSymbol > 0.5) {
              // Subtle floating breathing & starlight life (keeping </> upright and crisp)
              targetPhase2.y += sin(uTime * 1.5 + aPhase * 0.5) * 0.005;
              targetPhase2.x += cos(uTime * 1.1 + aPhase * 0.5) * 0.003;
            }

            vec3 posPhase2 = mix(aDispersedPosition, targetPhase2, easeP2) + flightArc2;

            // Seamless blending between Phase 1 and Phase 2:
            // When uSkillsProgress > 0, smoothly transitions from dispersed field into SKILLS & "</>"
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

            // Interactive mouse repulsion:
            // Dynamic behavior based on whether particles are assembled (tight, subtle)
            // or separated out in cosmic nebula (broad, magnetic, fluid swirl).
            vec2 mouseOffset = pos.xy - uMouseWorld;
            float mouseDist = length(mouseOffset);

            // How dispersed / separated out are the particles?
            // 1.0 = fully separated out into nebula; 0.0 = assembled into OVERVIEW or SKILLS / </>
            float dispersedAmount = clamp(easeP1 * (1.0 - easeP2), 0.0, 1.0);

            // Radius:
            // When assembled: tight radius around glyph strokes (0.36 text, 0.44 symbol)
            // When separated out: broad interactive field (1.10) so sweeping the cursor moves many particles
            float textRadius = aIsSymbol > 0.5 ? 0.44 : 0.36;
            float dispersedRadius = 1.10;
            float mouseRadius = mix(textRadius, dispersedRadius, dispersedAmount);

            // Repulsion strength:
            // When assembled: subtle elastic displacement (0.075) so words stay readable
            // When separated out: responsive fluid displacement (0.32) so stars part around cursor
            float textRepelMax = 0.075;
            float dispersedRepelMax = 0.32;
            float currentRepelMax = mix(textRepelMax, dispersedRepelMax, dispersedAmount);

            float repelStrength = smoothstep(mouseRadius, 0.0, mouseDist);
            float mouseRepel = repelStrength * repelStrength * currentRepelMax * uMouseActive;

            // Radial push away from cursor
            vec2 radialDir = normalize(mouseOffset + vec2(0.0001, 0.0001));

            // Fluid tangential swirl when separated out:
            // Particles gently curve around the cursor like celestial fluid
            vec2 tangentDir = vec2(-radialDir.y, radialDir.x);
            float swirlFactor = dispersedAmount * aSwirlSpeed * 0.45;
            vec2 repelDir = normalize(radialDir + tangentDir * swirlFactor);

            pos.xy += repelDir * mouseRepel;

            // 3D Depth displacement (push particles backwards/forwards in z)
            float zRepel = repelStrength * mix(0.035, 0.22, dispersedAmount) * uMouseActive;
            pos.z += (aRandom > 0.5 ? 1.0 : -0.7) * zRepel;

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;

            // Crisp pinprick starlight size attenuation + interactive hover flare
            float twinkle = 0.88 + 0.22 * sin(uTime * 2.5 + aPhase);
            float hoverGlow = repelStrength * uMouseActive * (0.35 + dispersedAmount * 0.55);
            float baseSize = aSize * uPixelRatio * (28.0 / -mvPosition.z) * twinkle;
            gl_PointSize = clamp(baseSize * (1.0 + flightActive * 0.35 + hoverGlow), 1.2, 5.5);

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
            vec3 goldenSparkle = vec3(0.867, 0.631, 0.369) * sparkle * 0.95;

            vec3 finalColor = vColor * (0.92 + core * 0.75) + goldenSparkle;
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
        globalMouseState.active = 0;
        return;
      }

      const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((clientY - rect.top) / rect.height) * 2 - 1);

      const aspect = rect.width / (rect.height || 1);
      const fovRad = (42 * Math.PI) / 180;
      const vHeight = 2 * Math.tan(fovRad / 2) * 5.0;
      const vWidth = vHeight * aspect;

      globalMouseState.worldX = nx * (vWidth * 0.5);
      globalMouseState.worldY = ny * (vHeight * 0.5);
      globalMouseState.active = 1;
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
      globalMouseState.active = 0;
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
        <UnifiedCelestialMesh />
      </Canvas>
    </div>
  );
}
