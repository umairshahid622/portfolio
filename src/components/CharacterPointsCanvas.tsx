import { useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { particleBridge } from "../utils/particleBridge";
import { loadMeshFontGeometries, type TextMeshGeometries } from "../utils/meshFontBuilder";
import { cn } from "../utils/cn";

// =========================================================================
// HEADER CONTENT EDGES → WORLD SPACE
// Mirrors Header.tsx layout: px-5 / sm:px-8 / md:px-12 padding + max-w-7xl
// (1280px) centered container. Returns left/right content edges in world units.
// =========================================================================
function getHeaderContentEdgesWorld(viewportWidth: number, pxWidth: number) {
  const safePx = Math.max(pxWidth, 1);
  const mq = (q: string) =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia(q).matches
      : safePx >= parseInt(q.replace(/\D/g, ""), 10);
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

// =========================================================================
// UNIFIED MORPHABLE TRIANGLE & POINTS VERTEX SHADER
// Parameterized via `isPoints` to eliminate ~370 lines of duplicate code.
// The spreaded particles ARE the spreaded triangles/points of the text mesh!
// =========================================================================
function buildCelestialVertexShader(isPoints: boolean): string {
  return `
  ${isPoints ? "#define IS_POINTS 1" : ""}

  uniform float uTime;
  uniform float uOverviewBreak;
  uniform float uSkillsProgress;
  uniform float uSkillsSpread;
  uniform float uExperienceProgress;
  uniform float uExperienceTitleYProgress;
  uniform float uContactProgress;
  uniform vec3 uOriginOffset;
  uniform float uOriginScale;
  uniform vec3 uTargetOffset;
  uniform float uTargetScale;
  uniform vec3 uTarget3Offset;
  uniform float uTarget3Scale;
  uniform vec3 uTarget4Offset;
  uniform float uTarget4Scale;

  uniform vec2 uMouseWorld;
  uniform float uMouseActive;
  uniform float uRadius;
  uniform vec2 uViewport;
  uniform vec2 uCardYInfo;
  uniform vec2 uSkillsPhraseInfo;

  attribute vec3 aCenter;
  attribute vec3 aTargetPos;
  attribute vec3 aTargetCenter;
  attribute vec3 aTarget3Pos;
  attribute vec3 aTarget3Center;
  attribute vec3 aTarget4Pos;
  attribute vec3 aTarget4Center;
  attribute vec4 aRandom;

  varying vec3 vWorldPos;
  varying float vBreakProgress;

  vec3 computeOrbitalFlight(
    vec3 startPos,
    vec3 endPos,
    float mergeP,
    vec4 rnd,
    vec2 viewport
  ) {
    float t = smoothstep(0.0, 1.0, mergeP);
    
    vec2 halfVp = viewport * 0.5;
    vec2 nStart = startPos.xy / max(vec2(0.001), halfVp);
    vec2 nEnd = endPos.xy / max(vec2(0.001), halfVp);

    float rStart = length(nStart);
    float rEnd = length(nEnd);

    float aStart = atan(nStart.y, nStart.x);
    float aEnd = atan(nEnd.y, nEnd.x);

    float da = aEnd - aStart;
    if (da > 3.14159265) da -= 6.2831853;
    if (da < -3.14159265) da += 6.2831853;

    // Full dramatic rounded loop (360 degrees) around the screen perimeter
    float spinSign = rnd.y > 0.0 ? 1.0 : -1.0;
    float angle = aStart + da * t + spinSign * 6.2831853 * (1.0 - t);

    // Very large radius hugging the screen edges during mid-flight
    float peakRho = 0.90 + abs(rnd.x) * 0.30;
    float rBase = mix(rStart, rEnd, t);
    float rArc = max(0.0, peakRho - rBase) * sin(t * 3.14159265);
    float rho = rBase + rArc;

    vec2 xy = vec2(rho * cos(angle), rho * sin(angle)) * halfVp;
    
    // Deep 3D Z-loop forward and backward across perspective depth
    float zSign = rnd.z > 0.0 ? 1.0 : -1.0;
    float zArc = zSign * (1.8 + abs(rnd.w) * 1.5) * sin(t * 3.14159265);
    float z = mix(startPos.z, endPos.z, t) + zArc;

    return vec3(xy, z);
  }

  // 3D spiral loop across the cards:
  // - Starts where "Skills </>" is written (top-left)
  // - Descends towards bottom-center behind the cards (Z < 0)
  // - Loops under Card 02 at bottom-center
  // - Ascends to top-right above the cards (Z > 0)
  vec3 computeSkillsSpringTarget(
    vec4 rnd,
    float seqP,
    vec2 viewport,
    float time,
    vec2 cardYInfo
  ) {
    // Sequence-aligned distribution along the spiral from 0.0 to 1.0
    // Subtle micro-jitter ensures full volumetric 3D richness without breaking sequence order
    float uJitter = (rnd.x - 0.5) * 0.05 + (rnd.y - 0.5) * 0.025;
    float u = clamp(seqP + uJitter, 0.0, 1.0);

    // 1. Horizontal traversal:
    // Starts at the exact position of "Skills </>" on the top-left (phraseStartX)
    // and ends at the top-right across the cards
    float defaultStartX = -viewport.x * (viewport.x < 3.5 ? 0.42 : 0.39);
    float phraseStartX = uSkillsPhraseInfo.y > 0.0001 ? uSkillsPhraseInfo.x + 0.15 : defaultStartX;
    float startX = phraseStartX;
    float endX = viewport.x * (viewport.x < 3.5 ? 0.44 : 0.40);
    float xTarget = mix(startX, endX, u);

    // 2. Vertical Y Trajectory:
    // - Initial part starts where "Skills </>" is written (top-left)
    // - Descends towards bottom-center, looping under Card 02
    // - Ascends upwards to the top-right
    float skillsTopY = viewport.y * (viewport.x < 3.5 ? 0.34 : 0.32);
    float yBottom = cardYInfo.x - cardYInfo.y - 0.22;
    float yTop = skillsTopY;

    // Theta: 0 to 2*PI across trajectory (u in [0, 1])
    // u = 0.0: theta = 0,    cos = 1,  y = yTop (Top-Left at "Skills </>")
    // u = 0.5: theta = PI,   cos = -1, y = yBottom (Bottom-Center under Card 02)
    // u = 1.0: theta = 2*PI, cos = 1,  y = yTop (Top-Right across cards)
    float theta = u * 6.2831853;
    float yCurveP = 0.5 + 0.5 * cos(theta);
    float yTarget = mix(yBottom, yTop, yCurveP);

    // 3. True 3D Depth looping around cards:
    // "coming towards the bottom center from behind the cards
    // and from bottom center goind to top right from above the cards"
    //
    // Descent (u: 0.0 -> 0.42): BEHIND the cards (Z ~ -1.15).
    // Fragments falling within Card 01 and Card 02 bounding boxes are occluded!
    // Bottom swoop (u: 0.42 -> 0.58): sweeps forward in the open space under Card 02.
    // Ascent (u: 0.58 -> 1.00): ABOVE / IN FRONT of the cards (Z ~ +0.75).
    float zBehind = -1.15;
    float zInFront = +0.75;
    float zBlend = smoothstep(0.35, 0.65, u);
    float z = mix(zBehind, zInFront, zBlend);

    // 4. Perspective Compensation so the projected loop on screen is perfectly uniform:
    // Camera is at Z = 5.0. Perspective scales screen coordinates by 5.0 / (5.0 - z).
    // Compensating by (5.0 - z) / 5.0 ensures the screen projection matches the target curve!
    float perspScale = (5.0 - z) / 5.0;
    float x = xTarget * perspScale;
    float y = yTarget * perspScale;

    // 5. Volumetric 3D thickness and helical swirl around the core path
    float tubeRadius = 0.22;
    float swirlAngle = u * 6.2831853 * 1.5 + rnd.w * 3.14159;
    vec3 volumeOffset = vec3(
      rnd.x * tubeRadius + cos(swirlAngle) * 0.08,
      rnd.y * tubeRadius + sin(swirlAngle) * 0.08,
      rnd.z * 0.16
    );

    // 6. Living celestial shimmer & wave drift
    float tDrift = time * 0.75;
    vec3 waveDrift = vec3(
      sin(tDrift + u * 6.283) * 0.04,
      cos(tDrift * 0.85 + u * 6.283) * 0.035,
      sin(tDrift * 0.65 + u * 3.141) * 0.04
    );

    return vec3(x, y, z) + volumeOffset + waveDrift;
  }

  // =======================================================================
  // EXTENDED SPIRAL PATH (Skills -> Work Experience)
  // The Skills spiral is the FIRST SEGMENT of one continuous spiral thread.
  // u in [0, LOOP_SPLIT]   : walks the existing Skills loop around the cards
  // u in [LOOP_SPLIT, 1.0] : the SAME thread keeps winding as a descending
  //                          coil that carries the stream down to the title
  // Both segments meet exactly, and the coil collapses to zero radius at the
  // title so every triangle lands precisely in its glyph slot.
  // =======================================================================
  vec3 computeExperienceSpiralPath(
    vec4 rnd,
    float u,
    vec2 viewport,
    float time,
    vec2 cardYInfo,
    vec3 titleCenter
  ) {
    float LOOP_SPLIT = 0.42;

    if (u <= LOOP_SPLIT) {
      // Segment 1: the Skills loop itself (unchanged geometry)
      return computeSkillsSpringTarget(rnd, u / LOOP_SPLIT, viewport, time, cardYInfo);
    }

    // Segment 2: the same thread keeps winding as an inward spiral. It sweeps across the
    // whole screen and funnels down into the title centre, which is why the particles read
    // as travelling along the spiral path instead of dropping straight down.
    float v = clamp((u - LOOP_SPLIT) / (1.0 - LOOP_SPLIT), 0.0, 1.0);
    float vEase = v * v * (3.0 - 2.0 * v);

    vec3 anchor = computeSkillsSpringTarget(rnd, 1.0, viewport, time, cardYInfo);

    // Radius + angle are measured from the title centre (screen centre during the hand-off),
    // so BOTH the cream and gold meshes start their spiral at the exact same loop exit point.
    float r0 = max(length(anchor.xy), 0.001);
    float th0 = atan(anchor.y, anchor.x);

    float spiralTurns = 1.75;
    float th = th0 - 6.2831853 * spiralTurns * vEase;   // clockwise, continuing the loop exit
    float r = r0 * pow(max(1.0 - vEase, 0.0), 1.15);     // radius collapses to 0 at the title

    // The spiral's hub drifts from the title centre onto this mesh's own word centre, so the
    // two colour streams unfurl into "Work" and "Experience" as the spiral tightens.
    float settle = smoothstep(0.55, 1.0, vEase);
    vec2 hub = mix(vec2(0.0, 0.0), titleCenter.xy, settle);

    vec2 xy = hub + vec2(cos(th), sin(th)) * r;

    // Depth: the thread dives toward the viewer through the spiral, then settles flat
    float z = mix(anchor.z, titleCenter.z, vEase) + 0.75 * sin(th - th0) * (1.0 - vEase);

    return vec3(xy, z);
  }

  void main() {
    // 1. Text 1 World Coordinates (ABOUT or ME)
    vec3 text1Center = uOriginOffset + aCenter * uOriginScale;
    vec3 text1Local = (position - aCenter) * uOriginScale;
    vec3 text1Pos = text1Center + text1Local;

    // 2. Text 2 World Coordinates (SKILLS or </>)
    vec3 text2Center = uTargetOffset + aTargetCenter * uTargetScale;
    vec3 text2Local = (aTargetPos - aTargetCenter) * uTargetScale;
    vec3 text2Pos = text2Center + text2Local;

    // 3. Text 3 World Coordinates (Work or Experience)
    vec3 text3Center = uTarget3Offset + aTarget3Center * uTarget3Scale;
    vec3 text3Local = (aTarget3Pos - aTarget3Center) * uTarget3Scale;
    vec3 text3Pos = text3Center + text3Local;

    // 4. Text 4 World Coordinates (Let's Get In or Touch)
    vec3 text4Center = uTarget4Offset + aTarget4Center * uTarget4Scale;
    vec3 text4Local = (aTarget4Pos - aTarget4Center) * uTarget4Scale;
    vec3 text4Pos = text4Center + text4Local;

    // Screen Spread Target with full 3D perspective volume (Z-axis, X-axis, Y-axis)
    float s1 = sin(aCenter.x * 12.9898 + aCenter.y * 78.233 + aRandom.x * 43.123) * 43758.5453;
    float s2 = cos(aCenter.x * 93.9898 + aCenter.y * 67.345 + aRandom.y * 24.634) * 24634.6345;
    float s3 = sin(aCenter.x * 43.1234 + aCenter.y * 19.876 + aRandom.z * 58.392) * 58392.1234;

    float r1 = fract(abs(s1));
    float r2 = fract(abs(s2));
    float r3 = fract(abs(s3));

    // Deep perspective depth along Z-axis: from foreground (close to camera) to deep background
    float zDepth = (r3 - 0.5) * 4.6; // span ~ -2.3 (deep background) to +2.3 (foreground near camera)
    float frustumExpand = max(0.60, (5.0 - zDepth) / 5.0);

    vec3 screenTarget = vec3(
      (r1 - 0.5) * uViewport.x * 1.05 * frustumExpand,
      (r2 - 0.5) * uViewport.y * 1.02 * frustumExpand,
      zDepth
    );

    // Staggered threshold per triangle for natural organic flight
    float threshold = aRandom.w * 0.32;

    float mergeOverviewP = 0.0;
    if (uOverviewBreak <= 0.015) {
      mergeOverviewP = 1.0;
    } else {
      float assembledP = 1.0 - uOverviewBreak;
      mergeOverviewP = clamp((assembledP - threshold) / (0.985 - threshold + 0.0001), 0.0, 1.0);
    }

    float mergeSkillsP = 0.0;
    if (uSkillsProgress >= 0.985) {
      mergeSkillsP = 1.0;
    } else {
      mergeSkillsP = clamp((uSkillsProgress - threshold) / (0.985 - threshold + 0.0001), 0.0, 1.0);
    }

    float mergeExpP = 0.0;
    if (uExperienceProgress >= 0.985) {
      mergeExpP = 1.0;
    } else {
      mergeExpP = clamp((uExperienceProgress - threshold) / (0.985 - threshold + 0.0001), 0.0, 1.0);
    }

    float mergeContactP = 0.0;
    if (uContactProgress >= 0.985) {
      mergeContactP = 1.0;
    } else {
      mergeContactP = clamp((uContactProgress - threshold) / (0.985 - threshold + 0.0001), 0.0, 1.0);
    }

    vec3 currentCenter;
    vec3 currentLocal;
    float facetP;

    if (uContactProgress > 0.001) {
      // In Contact: Orbit around large radius on screen and merge into Text 4
      currentCenter = computeOrbitalFlight(screenTarget, text4Center, mergeContactP, aRandom, uViewport);
      currentLocal = mix(text3Local, text4Local, smoothstep(0.0, 1.0, mergeContactP));
      facetP = 1.0 - mergeContactP;
    } else if (uExperienceTitleYProgress > 0.5) {
      // Leaving Work Experience towards Contact: break into the free floating nebula (never back into the Skills spiral)
      currentCenter = computeOrbitalFlight(screenTarget, text3Center, mergeExpP, aRandom, uViewport);
      currentLocal = text3Local;
      facetP = 1.0 - mergeExpP;
    } else if (uExperienceProgress > 0.001) {
      // Skills -> Work Experience: the particles never leave the spiral thread.
      // Each one keeps its own slot on the thread and marches along it (loop segment
      // first, then the descending coil) until the thread arrives at the title.
      float seqP = clamp((text2Center.x - uSkillsPhraseInfo.x) * uSkillsPhraseInfo.y, 0.0, 1.0);

      // Slot on the thread: u = 0 is the Skills loop start, u = 1 is the title
      float uStart = seqP * 0.42;

      // Eased march. Spacing along the thread is preserved, so the spiral reads as one
      // continuous ribbon flowing down toward the Experience section instead of scattering.
      float marchP = smoothstep(0.0, 1.0, clamp(uExperienceProgress, 0.0, 1.0));
      float uNow = clamp(
        mix(uStart, 1.0, marchP) + (aRandom.w - 0.5) * 0.05 * sin(marchP * 3.14159265),
        0.0,
        1.0
      );

      vec3 pathPos = computeExperienceSpiralPath(
        aRandom, uNow, uViewport, uTime, uCardYInfo, text3Center
      );

      // Glyph assembly: as the spiral tightens onto the title, each triangle morphs into its
      // own glyph slot (the spiral hub has already migrated onto the word centre by then)
      float settleV = clamp((uNow - 0.42) / 0.58, 0.0, 1.0);
      settleV = settleV * settleV * (3.0 - 2.0 * settleV);
      float converge = smoothstep(0.55, 1.0, settleV);

      currentCenter = pathPos;
      currentLocal = mix(text2Local, text3Local, converge);
      facetP = 1.0 - converge;
    } else if (uSkillsSpread > 0.001) {
      // Sequential breakdown from right-to-left: starts breaking from "</>" first, then "SKILLS"
      float seqP = clamp((text2Center.x - uSkillsPhraseInfo.x) * uSkillsPhraseInfo.y, 0.0, 1.0);
      float seqBreak = 1.0 - seqP;
      float pTri = clamp(seqBreak + (aRandom.w - 0.5) * 0.05, 0.0, 0.98);
      float tStart = pTri * 0.50;
      float localSpread = clamp((uSkillsSpread - tStart) / (1.0 - tStart + 0.0001), 0.0, 1.0);
      float t = smoothstep(0.0, 1.0, localSpread);

      // Traversal: starts at u = 0.0 (behind cards on the left) and travels along the full spiral shape to uTarget
      float uTarget = seqP;
      float uCurrent = mix(0.0, uTarget, t);
      vec3 spiralPos = computeSkillsSpringTarget(aRandom, uCurrent, uViewport, uTime, uCardYInfo);

      currentCenter = mix(text2Center, spiralPos, smoothstep(0.0, 0.16, t));
      currentLocal = text2Local;
      facetP = t;
    } else if (uSkillsProgress > 0.001) {
      // From Overview into Skills: Skill text forms NORMALLY via orbital flight from screenTarget
      currentCenter = computeOrbitalFlight(screenTarget, text2Center, mergeSkillsP, aRandom, uViewport);
      currentLocal = mix(text1Local, text2Local, smoothstep(0.0, 1.0, mergeSkillsP));
      facetP = 1.0 - mergeSkillsP;
    } else {
      // In Overview: Orbit around large radius on screen and merge into Text 1 (ABOUT ME)
      currentCenter = computeOrbitalFlight(screenTarget, text1Center, mergeOverviewP, aRandom, uViewport);
      currentLocal = text1Local;
      facetP = 1.0 - mergeOverviewP;
    }

    // Continuous 3D floating waves across all perspective axes: X, Y, and Z
    float tFlow = uTime * 0.75;
    float phaseX = aRandom.x * 6.28318 + aCenter.x * 1.8;
    float phaseY = aRandom.y * 6.28318 + aCenter.y * 1.8;
    float phaseZ = aRandom.z * 6.28318 + (aRandom.x + aRandom.y) * 2.2;

    vec3 floatOffset = vec3(
      sin(tFlow * 0.70 + phaseX) * 0.35 + cos(tFlow * 0.35 + phaseY) * 0.18,
      cos(tFlow * 0.60 + phaseY) * 0.30 + sin(tFlow * 0.45 + phaseX) * 0.15,
      sin(tFlow * 0.55 + phaseZ) * 0.55 + cos(tFlow * 0.85 + phaseX) * 0.30
    );

    // Apply continuous 3D floating to the dispersed particles (zero when assembled into text)
    if (uSkillsSpread > 0.001 && uExperienceTitleYProgress <= 0.5) {
      currentCenter += floatOffset * 0.15 * smoothstep(0.0, 0.20, facetP);
    } else {
      currentCenter += floatOffset * smoothstep(0.0, 0.20, facetP);
    }

    // Scaling of facet when dispersed (smoothly eased once facet begins motion)
    if (facetP > 0.01) {
      float motionP = smoothstep(0.01, 0.15, facetP);
      float shrinkFactor = (uSkillsSpread > 0.001 || uExperienceProgress > 0.001) ? 0.32 : 0.65;
      float scale = max(0.35, 1.0 - pow(facetP, 0.65) * shrinkFactor * motionP);
      currentLocal *= scale;
    }

    vec3 finalWorldPos = currentCenter + currentLocal;

    // Interactive mouse repulsion
    float d = length(finalWorldPos.xy - uMouseWorld);
    float repel = smoothstep(uRadius, 0.03, d) * uMouseActive * 0.085;
    vec2 repelDir = normalize(finalWorldPos.xy - uMouseWorld + vec2(0.0001));
    finalWorldPos.xy += repelDir * repel;
    finalWorldPos.z -= repel * 0.3;

    vBreakProgress = facetP;
    vWorldPos = finalWorldPos;

#ifdef IS_POINTS
    // Optical distance attenuation for true 3D perspective point sizing
    float distToCam = max(1.2, 5.0 - finalWorldPos.z);
    float ptMultiplier = (uSkillsSpread > 0.001 || uExperienceProgress > 0.001) ? 28.0 : 18.0;
    float maxPt = (uSkillsSpread > 0.001 || uExperienceProgress > 0.001) ? 11.0 : 7.5;
    gl_PointSize = clamp((facetP * ptMultiplier) / distToCam, 0.0, maxPt);
#endif

    gl_Position = projectionMatrix * viewMatrix * vec4(finalWorldPos, 1.0);
  }
  `;
}

const BREAKDOWN_VERTEX_SHADER = buildCelestialVertexShader(false);
const POINTS_VERTEX_SHADER = buildCelestialVertexShader(true);

// =========================================================================
// SHARED CARD OCCLUSION HELPER FOR FRAGMENT SHADERS
// Deduplicated into a single reusable GLSL function chunk.
// =========================================================================
const CARD_OCCLUSION_GLSL = `
// Precise per-card occlusion during Skills spread:
// Depth decides, exactly as it reads in 3D. Measured against the live card rects:
//   u 0.00 -> 0.42  left descent,  z ~ -1.15         -> BEHIND the cards, discarded here
//   u 0.42 -> 0.58  bottom swoop,  z ~ -0.20         -> swoops forward below cards in open space
//   u 0.58 -> 1.00  the rise/head, z ~ +0.75         -> ABOVE / IN FRONT of cards (worldPos.z >= 0.0)
// In the space/gap between cards, or above/below the cards, fragments remain fully visible!
bool isCardOccluded(vec3 worldPos, vec2 cardYInfo, vec4 cardBoxes[8], int cardCount) {
  if (worldPos.z >= 0.0) return false;
  float projFactor = 5.0 / max(0.1, 5.0 - worldPos.z);
  vec2 screenPos = vec2(
    worldPos.x * projFactor,
    worldPos.y * projFactor
  );

  for (int i = 0; i < 8; i++) {
    if (i >= cardCount) break;
    vec4 box = cardBoxes[i];
    if (screenPos.x >= box.x && screenPos.x <= box.y &&
        screenPos.y >= box.z && screenPos.y <= box.w) {
      float r = 0.04;
      vec2 cMin = vec2(box.x + r, box.z + r);
      vec2 cMax = vec2(box.y - r, box.w - r);
      if (screenPos.x < cMin.x && screenPos.y > cMax.y) {
        if (length(screenPos - vec2(cMin.x, cMax.y)) > r) continue;
      } else if (screenPos.x > cMax.x && screenPos.y > cMax.y) {
        if (length(screenPos - vec2(cMax.x, cMax.y)) > r) continue;
      } else if (screenPos.x < cMin.x && screenPos.y < cMin.y) {
        if (length(screenPos - vec2(cMin.x, cMin.y)) > r) continue;
      } else if (screenPos.x > cMax.x && screenPos.y < cMin.y) {
        if (length(screenPos - vec2(cMax.x, cMin.y)) > r) continue;
      }
      return true;
    }
  }
  return false;
}
`;

const BREAKDOWN_FRAGMENT_SHADER = `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uSkillsSpread;
  uniform float uExperienceProgress;
  uniform vec4 uCardBoxes[8];
  uniform int uCardCount;
  uniform vec2 uCardYInfo;
  varying vec3 vWorldPos;
  varying float vBreakProgress;

  ${CARD_OCCLUSION_GLSL}

  void main() {
    if (uSkillsSpread > 0.05 && (uExperienceProgress < 0.001 || vBreakProgress > 0.97)) {
      if (isCardOccluded(vWorldPos, uCardYInfo, uCardBoxes, uCardCount)) {
        discard;
      }
    }

    vec3 col = uColor;

    // Luminous energy when floating as facets (warm golden radiance)
    if (vBreakProgress > 0.0) {
      col += vec3(0.12, 0.10, 0.03) * sin(vBreakProgress * 3.14159);

      // Dynamic facet lighting based on 3D geometric face normal
      vec3 fdx = dFdx(vWorldPos);
      vec3 fdy = dFdy(vWorldPos);
      vec3 normal = normalize(cross(fdx, fdy));
      vec3 lightDir = normalize(vec3(0.2, 0.5, 0.8));
      float diff = abs(dot(normal, lightDir));
      float lighting = mix(1.0, 0.72 + 0.38 * diff, smoothstep(0.02, 0.20, vBreakProgress));
      col *= lighting;
    }

    // Alpha stays visible when dispersed across the screen
    float alpha = uOpacity * max(0.40, 1.0 - vBreakProgress * 0.40);
    if (alpha < 0.005) discard;

    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

const POINTS_FRAGMENT_SHADER = `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uSkillsSpread;
  uniform float uExperienceProgress;
  uniform vec4 uCardBoxes[8];
  uniform int uCardCount;
  uniform vec2 uCardYInfo;
  varying vec3 vWorldPos;
  varying float vBreakProgress;

  ${CARD_OCCLUSION_GLSL}

  void main() {
    if (vBreakProgress < 0.01) discard;

    if (uSkillsSpread > 0.05 && (uExperienceProgress < 0.001 || vBreakProgress > 0.97)) {
      if (isCardOccluded(vWorldPos, uCardYInfo, uCardBoxes, uCardCount)) {
        discard;
      }
    }

    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = uOpacity * max(0.40, 1.0 - vBreakProgress * 0.35) * (1.0 - dist * 2.0);
    gl_FragColor = vec4(uColor + vec3(0.1), alpha);
    #include <colorspace_fragment>
  }
`;

// Creates shared uniform dictionary where common animation uniforms are bound by reference
function createSharedCelestialUniforms(colorHex: string, radius = 0.40) {
  return {
    uTime: { value: 0.0 },
    uOverviewBreak: { value: 0.0 },
    uSkillsProgress: { value: 0.0 },
    uSkillsSpread: { value: 0.0 },
    uExperienceProgress: { value: 0.0 },
    uExperienceTitleYProgress: { value: 0.0 },
    uContactProgress: { value: 0.0 },
    uOriginOffset: { value: new THREE.Vector3(0, 0, 0) },
    uOriginScale: { value: 1.0 },
    uTargetOffset: { value: new THREE.Vector3(0, 0, 0) },
    uTargetScale: { value: 1.0 },
    uTarget3Offset: { value: new THREE.Vector3(0, 0, 0) },
    uTarget3Scale: { value: 1.0 },
    uTarget4Offset: { value: new THREE.Vector3(0, 0, 0) },
    uTarget4Scale: { value: 1.0 },
    uMouseWorld: { value: new THREE.Vector2(0, 0) },
    uMouseActive: { value: 0.0 },
    uRadius: { value: radius },
    uViewport: { value: new THREE.Vector2(6.0, 4.0) },
    uCardBoxes: {
      value: Array.from({ length: 8 }, () => new THREE.Vector4(-100, -100, -100, -100)),
    },
    uCardCount: { value: 0 },
    uCardYInfo: { value: new THREE.Vector2(0.0, 0.85) },
    uSkillsPhraseInfo: { value: new THREE.Vector2(-3.0, 1.0 / 6.0) },
    uColor: { value: new THREE.Color(colorHex) },
    uOpacity: { value: 1.0 },
  };
}

function UnifiedCelestialMesh({
  geometries,
}: {
  geometries: TextMeshGeometries;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport, size } = useThree();

  // Smoothed animation state refs
  const smoothOverviewProgress = useRef(0);
  const smoothSkillsProgress = useRef(0);
  const smoothSkillsSpread = useRef(0);
  const smoothExperienceProgress = useRef(0);
  const smoothExperienceTitleYProgress = useRef(0);
  const smoothContactProgress = useRef(0);
  const smoothDarkActive = useRef(0);
  const smoothMouseWorld = useRef(new THREE.Vector2(0, 0));
  const smoothMouseActive = useRef(0.0);
  const cardBoxesRef = useRef(
    Array.from({ length: 8 }, () => new THREE.Vector4(-100, -100, -100, -100))
  );

  // Cached DOM elements to eliminate forced layout reflows during useFrame
  const cardElementsRef = useRef<HTMLElement[]>([]);
  const cardsWrapperElRef = useRef<HTMLElement | null>(null);
  const contactAnchorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleResize = () => {
      cardElementsRef.current = [];
      cardsWrapperElRef.current = null;
      contactAnchorRef.current = null;
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const textLayout = useMemo(() => {
    const edges = getHeaderContentEdgesWorld(viewport.width, size.width);
    const overviewCenterY = viewport.height * (viewport.width < 3.2 ? 0.28 : 0.24);
    const overviewWidthRatio = viewport.width < 3.2 ? 0.72 : 0.52;
    const overviewHeightRatio = viewport.width < 3.2 ? 0.13 : 0.145;

    const targetW = viewport.width * overviewWidthRatio;
    const targetH = viewport.height * overviewHeightRatio;

    // Unscaled geometry metrics (from Clash Display font shapes at size 1):
    // ABOUT: w = 5.209, h = 0.958
    // ME: w = 2.148, h = 0.931
    // Space between: 0.52
    const baseWAbout = 5.209;
    const baseWMe = 2.148;
    const baseSpace = 0.52;
    const baseTotalW = baseWAbout + baseSpace + baseWMe; // ~7.877
    const baseH = 0.958;

    const scale = Math.min(targetW / baseTotalW, targetH / baseH);

    const wAbout = baseWAbout * scale;
    const spaceW = baseSpace * scale;

    const xAbout = -(baseWMe * scale + spaceW) * 0.5;
    const xMe = +(wAbout + spaceW) * 0.5;

    // Skills Layout:
    const skillsCenterY = viewport.height * (viewport.width < 3.2 ? 0.34 : 0.32);
    const skillsWidthRatio = viewport.width < 3.2 ? 0.68 : 0.44;
    const skillsHeightRatio = viewport.width < 3.2 ? 0.10 : 0.13;
    const skillsTargetW = viewport.width * skillsWidthRatio;
    const skillsTargetH = viewport.height * skillsHeightRatio;

    // Unscaled metrics for "</>" and "SKILLS"
    // </>: w = 2.120, h = 0.986
    // SKILLS: w = 4.953, h = 0.958
    // Space between: 0.42
    const baseWCode = 2.12;
    const baseWSkills = 4.953;
    const baseSpaceSkills = 0.42;
    const baseTotalSkills = baseWCode + baseSpaceSkills + baseWSkills; // ~7.493

    const skillsScale = Math.min(skillsTargetW / baseTotalSkills, skillsTargetH / baseH);

    const wCode = baseWCode * skillsScale;
    const spaceSkillsW = baseSpaceSkills * skillsScale;
    const wSkills = baseWSkills * skillsScale;

    // Left-aligned to the header content edge:
    // [ SKILLS (White) ] [space] [ </> (Red) ]
    const xSkills = edges.left + wSkills * 0.5;
    const xCode = edges.left + wSkills + spaceSkillsW + wCode * 0.5;
    const phraseLeft = edges.left;
    const phraseTotalW = wSkills + spaceSkillsW + wCode;

    // Work Experience Layout:
    const expTargetW = viewport.width * (viewport.width < 3.2 ? 0.90 : 0.72);
    const expTargetH = viewport.height * (viewport.width < 3.2 ? 0.12 : 0.16);

    // Unscaled geometry metrics for "Work" (White) and "Experience" (Red):
    // "Work": w = 4.054, h = 0.945
    // "Experience": w = 8.061, h = 1.167
    // Space between: 0.52
    const baseWWork = 4.054;
    const baseWExp = 8.061;
    const baseSpaceExp = 0.52;
    const baseTotalExp = baseWWork + baseSpaceExp + baseWExp; // ~12.635
    const baseExpH = 1.167;

    const expScale = Math.min(expTargetW / baseTotalExp, expTargetH / baseExpH);

    const wWork = baseWWork * expScale;
    const wExperience = baseWExp * expScale;
    const spaceExpW = baseSpaceExp * expScale;

    // Both words centered together at X = 0, Y = 0 (exact screen center):
    const xWork = -(wExperience + spaceExpW) * 0.5;
    const xExperience = +(wWork + spaceExpW) * 0.5;
    const expCenterY = 0.0;

    // Top title coordinates when cards are stacked below:
    const isMobileViewport =
      typeof window !== "undefined"
        ? window.innerWidth < 1024
        : viewport.width < 3.2;

    const expTopY = viewport.height * (isMobileViewport ? 0.372 : 0.365);
    const expTopScale = expScale * (isMobileViewport ? 0.78 : 0.72);
    const wWorkTop = baseWWork * expTopScale;
    const wExpTop = baseWExp * expTopScale;
    const spaceExpWTop = baseSpaceExp * expTopScale;
    const xWorkTop = -(wExpTop + spaceExpWTop) * 0.5;
    const xExperienceTop = +(wWorkTop + spaceExpWTop) * 0.5;

    // Contact Layout ("Let's Get In" / "Touch") in the Left Section:
    const metrics = geometries.contactMetrics || {
      wWhite: 6.8,
      hWhite: 0.96,
      wRed: 3.4,
      hRed: 0.96,
    };

    const isContactMobile =
      typeof window !== "undefined"
        ? window.innerWidth < 1024
        : viewport.width < 3.2;

    const contactColW = isContactMobile
      ? viewport.width * 0.88
      : Math.abs(edges.left) * 0.86;
    const contactColH = viewport.height * (isContactMobile ? 0.17 : 0.28);

    const baseContactW = Math.max(metrics.wWhite, metrics.wRed * 1.6);
    const baseContactH = metrics.hWhite + metrics.hRed + 0.35;

    const contactScale = Math.min(contactColW / baseContactW, contactColH / baseContactH);

    const xContact = isContactMobile ? 0.0 : edges.left * 0.52;

    const contactLineGap = 0.28 * contactScale;
    const yContactCenter = isContactMobile
      ? viewport.height * 0.37
      : viewport.height * 0.08;

    const lineOffsetWhite =
      metrics.hWhite * 0.5 * contactScale + contactLineGap * 0.5;
    const lineOffsetRed =
      -(metrics.hRed * 0.5 * contactScale + contactLineGap * 0.5);

    const yContactWhite = yContactCenter + lineOffsetWhite;
    const yContactRed = yContactCenter + lineOffsetRed;

    return {
      phraseLeft,
      phraseTotalW,
      overviewCenterY,
      scale,
      xAbout,
      xMe,
      skillsCenterY,
      skillsScale,
      xSkills,
      xCode,
      expCenterY,
      expScale,
      xWork,
      xExperience,
      expTopY,
      expTopScale,
      xWorkTop,
      xExperienceTop,
      xContact,
      yContactCenter,
      lineOffsetWhite,
      lineOffsetRed,
      yContactWhite,
      yContactRed,
      contactScale,
      isContactMobile,
    };
  }, [viewport.width, viewport.height, size.width, geometries]);

  // Color tokens
  const creamColor = typeof window !== "undefined"
    ? getComputedStyle(document.documentElement).getPropertyValue("--color-foreground").trim() ||
      getComputedStyle(document.documentElement).getPropertyValue("--color-cream").trim() ||
      "#fefae0"
    : "#fefae0";
  const goldenSandColor = typeof window !== "undefined"
    ? getComputedStyle(document.documentElement).getPropertyValue("--color-primary").trim() ||
      getComputedStyle(document.documentElement).getPropertyValue("--color-sand").trim() ||
      "#dda15e"
    : "#dda15e";

  // Create shared uniform dictionaries:
  // Points materials share the EXACT same uniform dictionary references as mesh materials,
  // allowing a single uniform write to update both mesh and points simultaneously!
  const whiteUniforms = useMemo(() => createSharedCelestialUniforms(creamColor), [creamColor]);
  const goldUniforms = useMemo(() => createSharedCelestialUniforms(goldenSandColor), [goldenSandColor]);

  const whiteMeshMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: BREAKDOWN_VERTEX_SHADER,
        fragmentShader: BREAKDOWN_FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: whiteUniforms,
      }),
    [whiteUniforms]
  );

  const whitePointsMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: POINTS_VERTEX_SHADER,
        fragmentShader: POINTS_FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: whiteUniforms,
      }),
    [whiteUniforms]
  );

  const goldMeshMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: BREAKDOWN_VERTEX_SHADER,
        fragmentShader: BREAKDOWN_FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: goldUniforms,
      }),
    [goldUniforms]
  );

  const goldPointsMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: POINTS_VERTEX_SHADER,
        fragmentShader: POINTS_FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: goldUniforms,
      }),
    [goldUniforms]
  );

  useEffect(() => {
    whiteUniforms.uColor.value.set(creamColor);
    goldUniforms.uColor.value.set(goldenSandColor);
  }, [creamColor, goldenSandColor, whiteUniforms, goldUniforms]);

  useEffect(() => {
    return () => {
      whiteMeshMat.dispose();
      whitePointsMat.dispose();
      goldMeshMat.dispose();
      goldPointsMat.dispose();
    };
  }, [whiteMeshMat, whitePointsMat, goldMeshMat, goldPointsMat]);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    // Cap delta at 0.1s to prevent extreme jumps when switching browser tabs
    const dt = Math.min(delta, 0.1);

    // Frame-rate independent exponential damping (lambda = 10 matches ~0.15 lerp at 60fps)
    smoothOverviewProgress.current = THREE.MathUtils.damp(
      smoothOverviewProgress.current,
      particleBridge.overviewProgress,
      10,
      dt
    );
    if (Math.abs(smoothOverviewProgress.current - particleBridge.overviewProgress) < 0.002) {
      smoothOverviewProgress.current = particleBridge.overviewProgress;
    }

    smoothSkillsProgress.current = THREE.MathUtils.damp(
      smoothSkillsProgress.current,
      particleBridge.skillsProgress,
      10,
      dt
    );
    if (Math.abs(smoothSkillsProgress.current - particleBridge.skillsProgress) < 0.002) {
      smoothSkillsProgress.current = particleBridge.skillsProgress;
    }

    smoothSkillsSpread.current = THREE.MathUtils.damp(
      smoothSkillsSpread.current,
      particleBridge.skillsSpreadProgress,
      10,
      dt
    );
    if (Math.abs(smoothSkillsSpread.current - particleBridge.skillsSpreadProgress) < 0.002) {
      smoothSkillsSpread.current = particleBridge.skillsSpreadProgress;
    }

    smoothExperienceProgress.current = THREE.MathUtils.damp(
      smoothExperienceProgress.current,
      particleBridge.experienceProgress,
      10,
      dt
    );
    if (Math.abs(smoothExperienceProgress.current - particleBridge.experienceProgress) < 0.002) {
      smoothExperienceProgress.current = particleBridge.experienceProgress;
    }

    smoothExperienceTitleYProgress.current = THREE.MathUtils.damp(
      smoothExperienceTitleYProgress.current,
      particleBridge.experienceTitleYProgress,
      10,
      dt
    );
    if (Math.abs(smoothExperienceTitleYProgress.current - particleBridge.experienceTitleYProgress) < 0.002) {
      smoothExperienceTitleYProgress.current = particleBridge.experienceTitleYProgress;
    }

    smoothContactProgress.current = THREE.MathUtils.damp(
      smoothContactProgress.current,
      particleBridge.contactProgress,
      10,
      dt
    );
    if (Math.abs(smoothContactProgress.current - particleBridge.contactProgress) < 0.002) {
      smoothContactProgress.current = particleBridge.contactProgress;
    }

    smoothDarkActive.current = THREE.MathUtils.damp(
      smoothDarkActive.current,
      particleBridge.isDarkActive ? 1.0 : 0.0,
      10,
      dt
    );
    if (Math.abs(smoothDarkActive.current - (particleBridge.isDarkActive ? 1.0 : 0.0)) < 0.002) {
      smoothDarkActive.current = particleBridge.isDarkActive ? 1.0 : 0.0;
    }

    smoothMouseWorld.current.x = THREE.MathUtils.damp(
      smoothMouseWorld.current.x,
      globalMouseState.worldX,
      10,
      dt
    );
    smoothMouseWorld.current.y = THREE.MathUtils.damp(
      smoothMouseWorld.current.y,
      globalMouseState.worldY,
      10,
      dt
    );
    smoothMouseActive.current = THREE.MathUtils.damp(
      smoothMouseActive.current,
      globalMouseState.active,
      10,
      dt
    );

    const vW = viewport.width;
    const vH = viewport.height;
    const opacity = smoothDarkActive.current;
    const ovBreak = smoothOverviewProgress.current;
    const skProgress = smoothSkillsProgress.current;
    const skSpread = smoothSkillsSpread.current;
    const expProgress = smoothExperienceProgress.current;
    const ctProgress = smoothContactProgress.current;

    const titleP = smoothExperienceTitleYProgress.current;
    const currentExpY = THREE.MathUtils.lerp(textLayout.expCenterY, textLayout.expTopY, titleP);
    const currentExpScale = THREE.MathUtils.lerp(textLayout.expScale, textLayout.expTopScale, titleP);
    const currentXWork = THREE.MathUtils.lerp(textLayout.xWork, textLayout.xWorkTop, titleP);
    const currentXExperience = THREE.MathUtils.lerp(textLayout.xExperience, textLayout.xExperienceTop, titleP);

    // Exact typographic baseline & cap-height alignment:
    const yAlignOffset = 0.0555 * currentExpScale;
    const currentExpYWork = currentExpY + yAlignOffset;
    const currentExpYExperience = currentExpY - yAlignOffset;

    // Contact Title live Y-position: only read DOM rect when Contact is active
    let liveContactYCenter = textLayout.yContactCenter;
    if (textLayout.isContactMobile && ctProgress > 0.001 && typeof document !== "undefined") {
      if (!contactAnchorRef.current) {
        contactAnchorRef.current = document.getElementById("contact-title-anchor");
      }
      if (contactAnchorRef.current) {
        const rect = contactAnchorRef.current.getBoundingClientRect();
        const centerY_px = rect.top + rect.height * 0.5;
        liveContactYCenter = ((window.innerHeight * 0.5 - centerY_px) / window.innerHeight) * vH;
      }
    }

    const currentYContactWhite = liveContactYCenter + textLayout.lineOffsetWhite;
    const currentYContactRed = liveContactYCenter + textLayout.lineOffsetRed;

    // Skills Card Occlusion: only query DOM elements when the Skills spread is actually visible
    let cardCenterY = 0.0;
    let cardHalfH = 0.85;
    let cardCount = 0;

    if (skSpread > 0.02 && typeof document !== "undefined") {
      if (!cardsWrapperElRef.current) {
        cardsWrapperElRef.current = document.getElementById("skills-cards-wrapper");
      }
      if (cardsWrapperElRef.current) {
        const rect = cardsWrapperElRef.current.getBoundingClientRect();
        const rawCenterY = ((window.innerHeight * 0.5 - (rect.top + rect.bottom) * 0.5) / window.innerHeight) * vH;
        cardCenterY = Math.max(-1.5, Math.min(0.2, rawCenterY));
        const cardMaxY = ((window.innerHeight * 0.5 - rect.top) / window.innerHeight) * vH;
        const cardMinY = ((window.innerHeight * 0.5 - rect.bottom) / window.innerHeight) * vH;
        cardHalfH = Math.max(0.4, (cardMaxY - cardMinY) * 0.5);
      }

      // Query cards once and reuse the array to avoid continuous querySelectorAll allocations
      if (cardElementsRef.current.length === 0) {
        const nodes = document.querySelectorAll<HTMLElement>(
          '#skills-cards-track [data-skill-card="true"], #skills-cards-wrapper [data-skill-card="true"]'
        );
        if (nodes.length > 0) {
          cardElementsRef.current = Array.from(nodes);
        }
      }

      const cards = cardElementsRef.current;
      const numCards = cards.length;
      if (numCards > 0) {
        const halfWinW = window.innerWidth * 0.5;
        const halfWinH = window.innerHeight * 0.5;
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        for (let i = 0; i < numCards && cardCount < 8; i++) {
          const r = cards[i].getBoundingClientRect();
          if (r.right > -60 && r.left < winW + 60) {
            const minX = ((r.left - halfWinW) / winW) * vW;
            const maxX = ((r.right - halfWinW) / winW) * vW;
            const maxY = ((halfWinH - r.top) / winH) * vH;
            const minY = ((halfWinH - r.bottom) / winH) * vH;
            cardBoxesRef.current[cardCount].set(minX, maxX, minY, maxY);
            cardCount++;
          }
        }
      }
    }

    const phraseInvW = 1.0 / Math.max(0.001, textLayout.phraseTotalW);

    // Update shared uniform properties across White and Gold materials
    const updateCommonUniforms = (u: typeof whiteUniforms) => {
      u.uTime.value = time;
      u.uViewport.value.set(vW, vH);
      u.uCardBoxes.value = cardBoxesRef.current;
      u.uCardCount.value = cardCount;
      u.uCardYInfo.value.set(cardCenterY, cardHalfH);
      u.uSkillsPhraseInfo.value.set(textLayout.phraseLeft, phraseInvW);
      u.uOverviewBreak.value = ovBreak;
      u.uSkillsProgress.value = skProgress;
      u.uSkillsSpread.value = skSpread;
      u.uExperienceProgress.value = expProgress;
      u.uExperienceTitleYProgress.value = titleP;
      u.uContactProgress.value = ctProgress;
      u.uOpacity.value = opacity;
      u.uMouseWorld.value.copy(smoothMouseWorld.current);
      u.uMouseActive.value = smoothMouseActive.current;
    };

    updateCommonUniforms(whiteUniforms);
    whiteUniforms.uOriginOffset.value.set(textLayout.xAbout, textLayout.overviewCenterY, 0);
    whiteUniforms.uOriginScale.value = textLayout.scale;
    whiteUniforms.uTargetOffset.value.set(textLayout.xSkills, textLayout.skillsCenterY, 0);
    whiteUniforms.uTargetScale.value = textLayout.skillsScale;
    whiteUniforms.uTarget3Offset.value.set(currentXWork, currentExpYWork, 0);
    whiteUniforms.uTarget3Scale.value = currentExpScale;
    whiteUniforms.uTarget4Offset.value.set(textLayout.xContact, currentYContactWhite, 0);
    whiteUniforms.uTarget4Scale.value = textLayout.contactScale;

    updateCommonUniforms(goldUniforms);
    goldUniforms.uOriginOffset.value.set(textLayout.xMe, textLayout.overviewCenterY, 0);
    goldUniforms.uOriginScale.value = textLayout.scale;
    goldUniforms.uTargetOffset.value.set(textLayout.xCode, textLayout.skillsCenterY, 0.05);
    goldUniforms.uTargetScale.value = textLayout.skillsScale;
    goldUniforms.uTarget3Offset.value.set(currentXExperience, currentExpYExperience, 0);
    goldUniforms.uTarget3Scale.value = currentExpScale;
    goldUniforms.uTarget4Offset.value.set(textLayout.xContact, currentYContactRed, 0.05);
    goldUniforms.uTarget4Scale.value = textLayout.contactScale;

    // 3D Perspective Tilt on Group for immersive depth parallax across X and Y
    if (groupRef.current) {
      groupRef.current.rotation.y = smoothMouseWorld.current.x * 0.016 * smoothMouseActive.current;
      groupRef.current.rotation.x = smoothMouseWorld.current.y * 0.010 * smoothMouseActive.current;
      groupRef.current.rotation.z = 0;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 1. White Unified Mesh & Nodes: Morphs "ABOUT" -> Spread Screen Triangles -> "SKILLS" -> "Work" -> "Let's Get In" */}
      <mesh geometry={geometries.white} material={whiteMeshMat} />
      <points geometry={geometries.white} material={whitePointsMat} />

      {/* 2. Gold Unified Mesh & Nodes: Morphs "ME" -> Spread Screen Triangles -> "</>" -> "Experience" -> "Touch" */}
      <mesh geometry={geometries.red} material={goldMeshMat} renderOrder={2} />
      <points geometry={geometries.red} material={goldPointsMat} renderOrder={2} />
    </group>
  );
}

interface CharacterPointsCanvasProps {
  className?: string;
}

export default function CharacterPointsCanvas({
  className = "",
}: CharacterPointsCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [geometries, setGeometries] = useState<TextMeshGeometries | null>(null);

  const isMobile =
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  useEffect(() => {
    loadMeshFontGeometries().then(setGeometries).catch(console.error);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w <= 0 || h <= 0) return;

      const x = (e.clientX / w) * 2 - 1;
      const y = -((e.clientY / h) * 2 - 1);

      const fovRad = (45 * Math.PI) / 180;
      const vhAtDist = 2 * Math.tan(fovRad / 2) * 5;
      const vwAtDist = vhAtDist * (w / h);

      globalMouseState.worldX = (x * vwAtDist) / 2;
      globalMouseState.worldY = (y * vhAtDist) / 2;
      globalMouseState.active = 1;
    };

    const handleMouseLeave = () => {
      globalMouseState.active = 0;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0 pointer-events-none select-none w-full h-full", className)}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={isMobile ? [1, 1.25] : [1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          depth: false,
          stencil: false,
        }}
        style={{ pointerEvents: "none" }}
        className="w-full h-full pointer-events-none"
      >
        {geometries && <UnifiedCelestialMesh geometries={geometries} />}
      </Canvas>
    </div>
  );
}
