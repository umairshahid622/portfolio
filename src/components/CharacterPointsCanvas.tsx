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

// =========================================================================
// UNIFIED MORPHABLE TRIANGLE MESH SHADERS
// The spreaded particles ARE the spreaded triangles of the text mesh!
// They morph seamlessly from Text 1 -> Spread Screen Facets -> Text 2 without
// ever disappearing or creating separate meshes.
// =========================================================================
const BREAKDOWN_VERTEX_SHADER = `
  uniform float uOverviewBreak;
  uniform float uSkillsProgress;
  uniform float uExperienceProgress;
  uniform vec3 uOriginOffset;
  uniform float uOriginScale;
  uniform vec3 uTargetOffset;
  uniform float uTargetScale;
  uniform vec3 uTarget3Offset;
  uniform float uTarget3Scale;

  uniform vec2 uMouseWorld;
  uniform float uMouseActive;
  uniform float uRadius;
  uniform vec2 uViewport;

  attribute vec3 aCenter;
  attribute vec3 aTargetPos;
  attribute vec3 aTargetCenter;
  attribute vec3 aTarget3Pos;
  attribute vec3 aTarget3Center;
  attribute vec4 aRandom;

  varying vec3 vWorldPos;
  varying float vBreakProgress;

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

    // Screen Spread Target (distributed evenly across visible viewport)
    float s1 = sin(aCenter.x * 12.9898 + aCenter.y * 78.233 + aRandom.x * 43.123) * 43758.5453;
    float s2 = cos(aCenter.x * 93.9898 + aCenter.y * 67.345 + aRandom.y * 24.634) * 24634.6345;
    float s3 = sin(aCenter.x * 43.1234 + aCenter.y * 19.876 + aRandom.z * 58.392) * 58392.1234;

    float r1 = fract(abs(s1));
    float r2 = fract(abs(s2));
    float r3 = fract(abs(s3));

    vec3 screenTarget = vec3(
      (r1 - 0.5) * uViewport.x * 0.92,
      (r2 - 0.5) * uViewport.y * 0.90,
      (r3 - 0.5) * 1.6
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

    vec3 currentCenter;
    vec3 currentLocal;
    float facetP;

    if (uExperienceProgress > 0.001) {
      // In Work Experience: Fly directly from screenTarget to Text 3 (Work Experience in middle)
      float t = smoothstep(0.0, 1.0, mergeExpP);
      vec3 arc = vec3(aRandom.x * 0.40, aRandom.y * 0.35, aRandom.z * 0.35) * sin((1.0 - mergeExpP) * 3.14159);
      currentCenter = mix(screenTarget, text3Center, t) + arc;
      currentLocal = mix(text1Local, text3Local, t);
      facetP = 1.0 - mergeExpP;
    } else if (uSkillsProgress > 0.001) {
      // In Skills: Fly between screenTarget and Text 2 (SKILLS </>)
      float t = smoothstep(0.0, 1.0, mergeSkillsP);
      vec3 arc = vec3(aRandom.x * 0.40, aRandom.y * 0.35, aRandom.z * 0.35) * sin((1.0 - mergeSkillsP) * 3.14159);
      currentCenter = mix(screenTarget, text2Center, t) + arc;
      currentLocal = mix(text1Local, text2Local, t);
      facetP = 1.0 - mergeSkillsP;
    } else {
      // In Overview: Text 1 (ABOUT ME) breaks apart and flies to screenTarget identically to Skills and Work Experience
      float t = smoothstep(0.0, 1.0, mergeOverviewP);
      vec3 arc = vec3(aRandom.x * 0.40, aRandom.y * 0.35, aRandom.z * 0.35) * sin((1.0 - mergeOverviewP) * 3.14159);
      currentCenter = mix(screenTarget, text1Center, t) + arc;
      currentLocal = text1Local;
      facetP = 1.0 - mergeOverviewP;
    }

    // 3D rotation and scaling of facet when dispersed (smoothly eased once facet begins motion)
    if (facetP > 0.01) {
      float motionP = smoothstep(0.01, 0.12, facetP);
      float scale = max(0.20, 1.0 - pow(facetP, 0.65) * 0.65 * motionP);
      float angle = facetP * 8.0 * (aRandom.x > 0.0 ? 1.0 : -1.0) * motionP;
      vec3 axis = normalize(aRandom.xyz + vec3(0.001));
      currentLocal = currentLocal * cos(angle) + cross(axis, currentLocal) * sin(angle) + axis * dot(axis, currentLocal) * (1.0 - cos(angle));
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
    gl_Position = projectionMatrix * viewMatrix * vec4(finalWorldPos, 1.0);
  }
`;

const BREAKDOWN_FRAGMENT_SHADER = `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec3 vWorldPos;
  varying float vBreakProgress;

  void main() {
    vec3 col = uColor;

    // Luminous energy when floating as facets
    if (vBreakProgress > 0.0) {
      col += vec3(0.18, 0.12, 0.06) * sin(vBreakProgress * 3.14159);
    }

    // Alpha stays visible when dispersed across the screen
    float alpha = uOpacity * max(0.40, 1.0 - vBreakProgress * 0.40);
    if (alpha < 0.005) discard;

    gl_FragColor = vec4(col, alpha);
  }
`;

const POINTS_VERTEX_SHADER = `
  uniform float uOverviewBreak;
  uniform float uSkillsProgress;
  uniform float uExperienceProgress;
  uniform vec3 uOriginOffset;
  uniform float uOriginScale;
  uniform vec3 uTargetOffset;
  uniform float uTargetScale;
  uniform vec3 uTarget3Offset;
  uniform float uTarget3Scale;

  uniform vec2 uMouseWorld;
  uniform float uMouseActive;
  uniform float uRadius;
  uniform vec2 uViewport;

  attribute vec3 aCenter;
  attribute vec3 aTargetPos;
  attribute vec3 aTargetCenter;
  attribute vec3 aTarget3Pos;
  attribute vec3 aTarget3Center;
  attribute vec4 aRandom;

  varying float vBreakProgress;

  void main() {
    vec3 text1Center = uOriginOffset + aCenter * uOriginScale;
    vec3 text1Local = (position - aCenter) * uOriginScale;

    vec3 text2Center = uTargetOffset + aTargetCenter * uTargetScale;
    vec3 text2Local = (aTargetPos - aTargetCenter) * uTargetScale;

    vec3 text3Center = uTarget3Offset + aTarget3Center * uTarget3Scale;
    vec3 text3Local = (aTarget3Pos - aTarget3Center) * uTarget3Scale;

    float s1 = sin(aCenter.x * 12.9898 + aCenter.y * 78.233 + aRandom.x * 43.123) * 43758.5453;
    float s2 = cos(aCenter.x * 93.9898 + aCenter.y * 67.345 + aRandom.y * 24.634) * 24634.6345;
    float s3 = sin(aCenter.x * 43.1234 + aCenter.y * 19.876 + aRandom.z * 58.392) * 58392.1234;

    float r1 = fract(abs(s1));
    float r2 = fract(abs(s2));
    float r3 = fract(abs(s3));

    vec3 screenTarget = vec3(
      (r1 - 0.5) * uViewport.x * 0.92,
      (r2 - 0.5) * uViewport.y * 0.90,
      (r3 - 0.5) * 1.6
    );

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

    vec3 currentCenter;
    vec3 currentLocal;
    float facetP;

    if (uExperienceProgress > 0.001) {
      float t = smoothstep(0.0, 1.0, mergeExpP);
      vec3 arc = vec3(aRandom.x * 0.40, aRandom.y * 0.35, aRandom.z * 0.35) * sin((1.0 - mergeExpP) * 3.14159);
      currentCenter = mix(screenTarget, text3Center, t) + arc;
      currentLocal = mix(text1Local, text3Local, t);
      facetP = 1.0 - mergeExpP;
    } else if (uSkillsProgress > 0.001) {
      float t = smoothstep(0.0, 1.0, mergeSkillsP);
      vec3 arc = vec3(aRandom.x * 0.40, aRandom.y * 0.35, aRandom.z * 0.35) * sin((1.0 - mergeSkillsP) * 3.14159);
      currentCenter = mix(screenTarget, text2Center, t) + arc;
      currentLocal = mix(text1Local, text2Local, t);
      facetP = 1.0 - mergeSkillsP;
    } else {
      float t = smoothstep(0.0, 1.0, mergeOverviewP);
      vec3 arc = vec3(aRandom.x * 0.40, aRandom.y * 0.35, aRandom.z * 0.35) * sin((1.0 - mergeOverviewP) * 3.14159);
      currentCenter = mix(screenTarget, text1Center, t) + arc;
      currentLocal = text1Local;
      facetP = 1.0 - mergeOverviewP;
    }

    if (facetP > 0.01) {
      float motionP = smoothstep(0.01, 0.12, facetP);
      float scale = max(0.20, 1.0 - pow(facetP, 0.65) * 0.65 * motionP);
      float angle = facetP * 8.0 * (aRandom.x > 0.0 ? 1.0 : -1.0) * motionP;
      vec3 axis = normalize(aRandom.xyz + vec3(0.001));
      currentLocal = currentLocal * cos(angle) + cross(axis, currentLocal) * sin(angle) + axis * dot(axis, currentLocal) * (1.0 - cos(angle));
      currentLocal *= scale;
    }

    vec3 finalWorldPos = currentCenter + currentLocal;

    float d = length(finalWorldPos.xy - uMouseWorld);
    float repel = smoothstep(uRadius, 0.03, d) * uMouseActive * 0.085;
    vec2 repelDir = normalize(finalWorldPos.xy - uMouseWorld + vec2(0.0001));
    finalWorldPos.xy += repelDir * repel;
    finalWorldPos.z -= repel * 0.3;

    vBreakProgress = facetP;
    gl_PointSize = clamp(facetP * 4.5, 0.0, 6.0);
    gl_Position = projectionMatrix * viewMatrix * vec4(finalWorldPos, 1.0);
  }
`;

const POINTS_FRAGMENT_SHADER = `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vBreakProgress;

  void main() {
    if (vBreakProgress < 0.01) discard;
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = uOpacity * max(0.40, 1.0 - vBreakProgress * 0.35) * (1.0 - dist * 2.0);
    gl_FragColor = vec4(uColor + vec3(0.2), alpha);
  }
`;

function createBreakdownMeshMaterial(colorHex: string, radius = 0.40) {
  return new THREE.ShaderMaterial({
    vertexShader: BREAKDOWN_VERTEX_SHADER,
    fragmentShader: BREAKDOWN_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uOverviewBreak: { value: 0.0 },
      uSkillsProgress: { value: 0.0 },
      uExperienceProgress: { value: 0.0 },
      uOriginOffset: { value: new THREE.Vector3(0, 0, 0) },
      uOriginScale: { value: 1.0 },
      uTargetOffset: { value: new THREE.Vector3(0, 0, 0) },
      uTargetScale: { value: 1.0 },
      uTarget3Offset: { value: new THREE.Vector3(0, 0, 0) },
      uTarget3Scale: { value: 1.0 },
      uMouseWorld: { value: new THREE.Vector2(0, 0) },
      uMouseActive: { value: 0.0 },
      uRadius: { value: radius },
      uViewport: { value: new THREE.Vector2(6.0, 4.0) },
      uColor: { value: new THREE.Color(colorHex) },
      uOpacity: { value: 1.0 },
    },
  });
}

function createBreakdownPointsMaterial(colorHex: string, radius = 0.40) {
  return new THREE.ShaderMaterial({
    vertexShader: POINTS_VERTEX_SHADER,
    fragmentShader: POINTS_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uOverviewBreak: { value: 0.0 },
      uSkillsProgress: { value: 0.0 },
      uExperienceProgress: { value: 0.0 },
      uOriginOffset: { value: new THREE.Vector3(0, 0, 0) },
      uOriginScale: { value: 1.0 },
      uTargetOffset: { value: new THREE.Vector3(0, 0, 0) },
      uTargetScale: { value: 1.0 },
      uTarget3Offset: { value: new THREE.Vector3(0, 0, 0) },
      uTarget3Scale: { value: 1.0 },
      uMouseWorld: { value: new THREE.Vector2(0, 0) },
      uMouseActive: { value: 0.0 },
      uRadius: { value: radius },
      uViewport: { value: new THREE.Vector2(6.0, 4.0) },
      uColor: { value: new THREE.Color(colorHex) },
      uOpacity: { value: 1.0 },
    },
  });
}

function UnifiedCelestialMesh({ geometries }: { geometries: TextMeshGeometries }) {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport, size } = useThree();

  const smoothOverviewProgress = useRef(0);
  const smoothSkillsProgress = useRef(0);
  const smoothExperienceProgress = useRef(0);
  const smoothExperienceTitleYProgress = useRef(0);
  const smoothDarkActive = useRef(0);
  const smoothMouseWorld = useRef(new THREE.Vector2(0, 0));
  const smoothMouseActive = useRef(0.0);

  const textLayout = useMemo(() => {
    const edges = getHeaderContentEdgesWorld(viewport.width, size.width);
    const overviewCenterY = viewport.height * (viewport.width < 3.2 ? 0.26 : 0.23);
    const overviewWidthRatio = viewport.width < 3.2 ? 0.88 : 0.68;
    const overviewHeightRatio = viewport.width < 3.2 ? 0.16 : 0.20;

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
    const wMe = baseWMe * scale;
    const spaceW = baseSpace * scale;

    const xAbout = -(wMe + spaceW) * 0.5;
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

    // Work Experience Layout:
    // Initial center position (Y = 0.0):
    const expTargetW = viewport.width * (viewport.width < 3.2 ? 0.90 : 0.72);
    const expTargetH = viewport.height * (viewport.width < 3.2 ? 0.12 : 0.16);

    // Unscaled geometry metrics for "Work" (White) and "Experience" (Red):
    // "Work": w = 4.054, h = 0.945
    // "Experience": w = 8.061, h = 1.167
    // Space between: 0.45
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
    const expTopY = viewport.height * (viewport.width < 3.2 ? 0.40 : 0.38);
    const expTopScale = expScale * (viewport.width < 3.2 ? 0.78 : 0.72);
    const wWorkTop = baseWWork * expTopScale;
    const wExpTop = baseWExp * expTopScale;
    const spaceExpWTop = baseSpaceExp * expTopScale;
    const xWorkTop = -(wExpTop + spaceExpWTop) * 0.5;
    const xExperienceTop = +(wWorkTop + spaceExpWTop) * 0.5;

    return {
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
    };
  }, [viewport.width, viewport.height, size.width]);

  // Mesh & Point Materials (Cream and Terracotta sourced via CSS variables)
  const creamColor = typeof window !== "undefined"
    ? getComputedStyle(document.documentElement).getPropertyValue("--color-cream").trim() || "#fefae0"
    : "#fefae0";
  const terracottaColor = typeof window !== "undefined"
    ? getComputedStyle(document.documentElement).getPropertyValue("--color-terracotta").trim() || "#bc6c25"
    : "#bc6c25";

  const whiteMeshMat = useMemo(() => createBreakdownMeshMaterial(creamColor), [creamColor]);
  const whitePointsMat = useMemo(() => createBreakdownPointsMaterial(creamColor), [creamColor]);
  const redMeshMat = useMemo(() => createBreakdownMeshMaterial(terracottaColor), [terracottaColor]);
  const redPointsMat = useMemo(() => createBreakdownPointsMaterial(terracottaColor), [terracottaColor]);

  useEffect(() => {
    return () => {
      whiteMeshMat.dispose();
      whitePointsMat.dispose();
      redMeshMat.dispose();
      redPointsMat.dispose();
    };
  }, [whiteMeshMat, whitePointsMat, redMeshMat, redPointsMat]);

  useFrame(() => {
    smoothOverviewProgress.current = THREE.MathUtils.lerp(
      smoothOverviewProgress.current,
      particleBridge.overviewProgress,
      0.15
    );
    if (Math.abs(smoothOverviewProgress.current - particleBridge.overviewProgress) < 0.002) {
      smoothOverviewProgress.current = particleBridge.overviewProgress;
    }
    if (smoothOverviewProgress.current < 0.005) {
      smoothOverviewProgress.current = 0.0;
    } else if (smoothOverviewProgress.current > 0.995) {
      smoothOverviewProgress.current = 1.0;
    }

    smoothSkillsProgress.current = THREE.MathUtils.lerp(
      smoothSkillsProgress.current,
      particleBridge.skillsProgress,
      0.15
    );
    if (Math.abs(smoothSkillsProgress.current - particleBridge.skillsProgress) < 0.002) {
      smoothSkillsProgress.current = particleBridge.skillsProgress;
    }
    if (smoothSkillsProgress.current < 0.005) {
      smoothSkillsProgress.current = 0.0;
    } else if (smoothSkillsProgress.current > 0.995) {
      smoothSkillsProgress.current = 1.0;
    }

    smoothExperienceProgress.current = THREE.MathUtils.lerp(
      smoothExperienceProgress.current,
      particleBridge.experienceProgress,
      0.15
    );
    if (Math.abs(smoothExperienceProgress.current - particleBridge.experienceProgress) < 0.002) {
      smoothExperienceProgress.current = particleBridge.experienceProgress;
    }
    if (smoothExperienceProgress.current < 0.005) {
      smoothExperienceProgress.current = 0.0;
    } else if (smoothExperienceProgress.current > 0.995) {
      smoothExperienceProgress.current = 1.0;
    }

    smoothExperienceTitleYProgress.current = THREE.MathUtils.lerp(
      smoothExperienceTitleYProgress.current,
      particleBridge.experienceTitleYProgress,
      0.15
    );
    if (Math.abs(smoothExperienceTitleYProgress.current - particleBridge.experienceTitleYProgress) < 0.002) {
      smoothExperienceTitleYProgress.current = particleBridge.experienceTitleYProgress;
    }

    smoothDarkActive.current = THREE.MathUtils.lerp(
      smoothDarkActive.current,
      particleBridge.isDarkActive ? 1.0 : 0.0,
      0.15
    );
    if (Math.abs(smoothDarkActive.current - (particleBridge.isDarkActive ? 1.0 : 0.0)) < 0.002) {
      smoothDarkActive.current = particleBridge.isDarkActive ? 1.0 : 0.0;
    }

    smoothMouseWorld.current.lerp(
      new THREE.Vector2(globalMouseState.worldX, globalMouseState.worldY),
      0.15
    );
    smoothMouseActive.current = THREE.MathUtils.lerp(
      smoothMouseActive.current,
      globalMouseState.active,
      0.15
    );

    const vW = viewport.width;
    const vH = viewport.height;
    const opacity = smoothDarkActive.current;
    const ovBreak = smoothOverviewProgress.current;
    const skProgress = smoothSkillsProgress.current;
    const expProgress = smoothExperienceProgress.current;

    const titleP = smoothExperienceTitleYProgress.current;
    const currentExpY = THREE.MathUtils.lerp(textLayout.expCenterY, textLayout.expTopY, titleP);
    const currentExpScale = THREE.MathUtils.lerp(textLayout.expScale, textLayout.expTopScale, titleP);
    const currentXWork = THREE.MathUtils.lerp(textLayout.xWork, textLayout.xWorkTop, titleP);
    const currentXExperience = THREE.MathUtils.lerp(textLayout.xExperience, textLayout.xExperienceTop, titleP);

    // Exact typographic baseline & cap-height alignment:
    // In Clash Display, "Work" center is at Y = 0.4585, while "Experience" (with 'p' descender) center is at Y = 0.3475.
    // By offsetting Work by +0.0555 * scale and Experience by -0.0555 * scale:
    // Both share the exact same baseline at currentExpY - 0.4030 * scale
    // Both share the exact same cap-height ('W' & 'E') at currentExpY + 0.5280 * scale!
    const yAlignOffset = 0.0555 * currentExpScale;
    const currentExpYWork = currentExpY + yAlignOffset;
    const currentExpYExperience = currentExpY - yAlignOffset;

    // White Mesh & Points (Morphs ABOUT -> Spread Screen Triangles -> SKILLS -> Work)
    const whiteMats = [whiteMeshMat, whitePointsMat];
    for (const mat of whiteMats) {
      mat.uniforms.uViewport.value.set(vW, vH);
      mat.uniforms.uOverviewBreak.value = ovBreak;
      mat.uniforms.uSkillsProgress.value = skProgress;
      mat.uniforms.uExperienceProgress.value = expProgress;
      mat.uniforms.uOriginOffset.value.set(textLayout.xAbout, textLayout.overviewCenterY, 0);
      mat.uniforms.uOriginScale.value = textLayout.scale;
      mat.uniforms.uTargetOffset.value.set(textLayout.xSkills, textLayout.skillsCenterY, 0);
      mat.uniforms.uTargetScale.value = textLayout.skillsScale;
      mat.uniforms.uTarget3Offset.value.set(currentXWork, currentExpYWork, 0);
      mat.uniforms.uTarget3Scale.value = currentExpScale;
      mat.uniforms.uOpacity.value = opacity;
      mat.uniforms.uMouseWorld.value.copy(smoothMouseWorld.current);
      mat.uniforms.uMouseActive.value = smoothMouseActive.current;
    }

    // Red Mesh & Points (Morphs ME -> Spread Screen Triangles -> </> -> Experience)
    const redMats = [redMeshMat, redPointsMat];
    for (const mat of redMats) {
      mat.uniforms.uViewport.value.set(vW, vH);
      mat.uniforms.uOverviewBreak.value = ovBreak;
      mat.uniforms.uSkillsProgress.value = skProgress;
      mat.uniforms.uExperienceProgress.value = expProgress;
      mat.uniforms.uOriginOffset.value.set(textLayout.xMe, textLayout.overviewCenterY, 0);
      mat.uniforms.uOriginScale.value = textLayout.scale;
      mat.uniforms.uTargetOffset.value.set(textLayout.xCode, textLayout.skillsCenterY, 0.05);
      mat.uniforms.uTargetScale.value = textLayout.skillsScale;
      mat.uniforms.uTarget3Offset.value.set(currentXExperience, currentExpYExperience, 0);
      mat.uniforms.uTarget3Scale.value = currentExpScale;
      mat.uniforms.uOpacity.value = opacity;
      mat.uniforms.uMouseWorld.value.copy(smoothMouseWorld.current);
      mat.uniforms.uMouseActive.value = smoothMouseActive.current;
    }

    // 3D Perspective Tilt on Group
    if (groupRef.current) {
      groupRef.current.rotation.y = smoothMouseWorld.current.x * 0.012 * smoothMouseActive.current;
      groupRef.current.rotation.x = smoothMouseWorld.current.y * 0.008 * smoothMouseActive.current;
      groupRef.current.rotation.z = 0;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 1. White Unified Mesh & Nodes: Morphs from "ABOUT" -> Spread Screen Triangles -> "SKILLS" */}
      <mesh geometry={geometries.white} material={whiteMeshMat} />
      <points geometry={geometries.white} material={whitePointsMat} />

      {/* 2. Red Unified Mesh & Nodes: Morphs from "ME" -> Spread Screen Triangles -> "</>" in front of Skills */}
      <mesh geometry={geometries.red} material={redMeshMat} renderOrder={2} />
      <points geometry={geometries.red} material={redPointsMat} renderOrder={2} />
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

  useEffect(() => {
    loadMeshFontGeometries().then(setGeometries).catch(console.error);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      const fovRad = (45 * Math.PI) / 180;
      const vhAtDist = 2 * Math.tan(fovRad / 2) * 5;
      const vwAtDist = vhAtDist * (rect.width / rect.height);

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
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          depth: false,
          stencil: false,
        }}
        className="w-full h-full pointer-events-none"
      >
        {geometries && <UnifiedCelestialMesh geometries={geometries} />}
      </Canvas>
    </div>
  );
}
