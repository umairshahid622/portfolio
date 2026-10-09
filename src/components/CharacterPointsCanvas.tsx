import { useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { particleBridge } from "../utils/particleBridge";
import { loadMeshFontGeometries, type TextMeshGeometries } from "../utils/meshFontBuilder";

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
// 3D MESH NODE BREAKDOWN SHADERS
// Physically shatters and disperses mesh polygon facets and nodes on scroll!
// =========================================================================
const BREAKDOWN_VERTEX_SHADER = `
  uniform float uScrollBreak;
  uniform vec2 uMouseWorld;
  uniform float uMouseActive;
  uniform float uRadius;
  uniform vec2 uViewport;

  attribute vec3 aCenter;
  attribute vec4 aRandom;

  varying vec3 vWorldPos;
  varying float vBreakProgress;

  void main() {
    vec4 worldCenter4 = modelMatrix * vec4(aCenter, 1.0);
    vec3 worldCenter = worldCenter4.xyz;

    // Relative vector from triangle center to this vertex in world space
    vec3 localVec = (modelMatrix * vec4(position - aCenter, 0.0)).xyz;

    // Staggered breakdown start per triangle
    float threshold = aRandom.w * 0.35;
    float breakP = clamp((uScrollBreak - threshold) / (1.0 - threshold + 0.0001), 0.0, 1.0);

    vec3 finalWorldPos = worldCenter + localVec;

    if (breakP > 0.0) {
      // Deterministic spread target evenly distributed across visible viewport
      float s1 = sin(aCenter.x * 12.9898 + aCenter.y * 78.233 + aRandom.x * 43.123) * 43758.5453;
      float s2 = cos(aCenter.x * 93.9898 + aCenter.y * 67.345 + aRandom.y * 24.634) * 24634.6345;
      float s3 = sin(aCenter.x * 43.1234 + aCenter.y * 19.876 + aRandom.z * 58.392) * 58392.1234;

      float r1 = fract(abs(s1));
      float r2 = fract(abs(s2));
      float r3 = fract(abs(s3));

      // Target position distributed evenly across screen boundaries
      vec3 screenTarget = vec3(
        (r1 - 0.5) * uViewport.x * 0.92,
        (r2 - 0.5) * uViewport.y * 0.90,
        (r3 - 0.5) * 1.6
      );

      // Node shrinkage & separation as it breaks apart into geometric facet
      float scale = max(0.18, 1.0 - pow(breakP, 0.65) * 0.65);

      // 3D rotation of the facet around its own random axis
      float angle = breakP * 8.0 * (aRandom.x > 0.0 ? 1.0 : -1.0);
      vec3 axis = normalize(aRandom.xyz + vec3(0.001));
      localVec = localVec * cos(angle) + cross(axis, localVec) * sin(angle) + axis * dot(axis, localVec) * (1.0 - cos(angle));
      localVec *= scale;

      float t = smoothstep(0.0, 1.0, breakP);
      vec3 arc = vec3(aRandom.x * 0.40, aRandom.y * 0.35, aRandom.z * 0.35) * sin(breakP * 3.14159);

      vec3 currentCenter = mix(worldCenter, screenTarget, t) + arc;
      finalWorldPos = currentCenter + localVec;
    }

    // Interactive mouse repulsion on world position
    float d = length(finalWorldPos.xy - uMouseWorld);
    float repel = smoothstep(uRadius, 0.03, d) * uMouseActive * 0.085;
    vec2 repelDir = normalize(finalWorldPos.xy - uMouseWorld + vec2(0.0001));
    finalWorldPos.xy += repelDir * repel;
    finalWorldPos.z -= repel * 0.3;

    vBreakProgress = breakP;
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

    // As nodes break down, their edges catch subtle luminous energy
    if (vBreakProgress > 0.0) {
      col += vec3(0.18, 0.12, 0.06) * sin(vBreakProgress * 3.14159);
    }

    // Alpha stays visible when dispersed across the screen
    float alpha = uOpacity * max(0.35, 1.0 - vBreakProgress * 0.45);
    if (alpha < 0.005) discard;

    gl_FragColor = vec4(col, alpha);
  }
`;

const POINTS_VERTEX_SHADER = `
  uniform float uScrollBreak;
  uniform vec2 uMouseWorld;
  uniform float uMouseActive;
  uniform float uRadius;
  uniform vec2 uViewport;

  attribute vec3 aCenter;
  attribute vec4 aRandom;

  varying float vBreakProgress;

  void main() {
    vec4 worldCenter4 = modelMatrix * vec4(aCenter, 1.0);
    vec3 worldCenter = worldCenter4.xyz;

    float threshold = aRandom.w * 0.35;
    float breakP = clamp((uScrollBreak - threshold) / (1.0 - threshold + 0.0001), 0.0, 1.0);

    vec4 localPos4 = modelMatrix * vec4(position, 1.0);
    vec3 finalWorldPos = localPos4.xyz;

    if (breakP > 0.0) {
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

      float t = smoothstep(0.0, 1.0, breakP);
      vec3 arc = vec3(aRandom.x * 0.40, aRandom.y * 0.35, aRandom.z * 0.35) * sin(breakP * 3.14159);

      finalWorldPos = mix(worldCenter, screenTarget, t) + arc;
    }

    // Mouse repulsion on final world position
    float d = length(finalWorldPos.xy - uMouseWorld);
    float repel = smoothstep(uRadius, 0.03, d) * uMouseActive * 0.085;
    vec2 repelDir = normalize(finalWorldPos.xy - uMouseWorld + vec2(0.0001));
    finalWorldPos.xy += repelDir * repel;
    finalWorldPos.z -= repel * 0.3;

    vBreakProgress = breakP;
    gl_PointSize = clamp(breakP * 4.5, 0.0, 6.0);
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
    float alpha = uOpacity * max(0.35, 1.0 - vBreakProgress * 0.35) * (1.0 - dist * 2.0);
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
      uScrollBreak: { value: 0.0 },
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
      uScrollBreak: { value: 0.0 },
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

    return {
      overviewCenterY,
      scale,
      xAbout,
      xMe,
      skillsCenterY,
      skillsScale,
      xSkills,
      xCode,
    };
  }, [viewport.width, viewport.height, size.width]);

  // Mesh Materials
  const aboutMeshMat = useMemo(() => createBreakdownMeshMaterial("#fefae0"), []);
  const meMeshMat = useMemo(() => createBreakdownMeshMaterial("#bc6c25"), []);
  const codeMeshMat = useMemo(() => createBreakdownMeshMaterial("#bc6c25"), []);
  const skillsMeshMat = useMemo(() => createBreakdownMeshMaterial("#fefae0"), []);

  // Point Node Materials
  const aboutPointsMat = useMemo(() => createBreakdownPointsMaterial("#fefae0"), []);
  const mePointsMat = useMemo(() => createBreakdownPointsMaterial("#bc6c25"), []);
  const codePointsMat = useMemo(() => createBreakdownPointsMaterial("#bc6c25"), []);
  const skillsPointsMat = useMemo(() => createBreakdownPointsMaterial("#fefae0"), []);

  useEffect(() => {
    return () => {
      aboutMeshMat.dispose();
      meMeshMat.dispose();
      codeMeshMat.dispose();
      skillsMeshMat.dispose();
      aboutPointsMat.dispose();
      mePointsMat.dispose();
      codePointsMat.dispose();
      skillsPointsMat.dispose();
    };
  }, [
    aboutMeshMat,
    meMeshMat,
    codeMeshMat,
    skillsMeshMat,
    aboutPointsMat,
    mePointsMat,
    codePointsMat,
    skillsPointsMat,
  ]);

  useFrame(() => {
    smoothOverviewProgress.current = THREE.MathUtils.lerp(
      smoothOverviewProgress.current,
      particleBridge.overviewProgress,
      0.12
    );
    smoothSkillsProgress.current = THREE.MathUtils.lerp(
      smoothSkillsProgress.current,
      particleBridge.skillsProgress,
      0.12
    );
    smoothDarkActive.current = THREE.MathUtils.lerp(
      smoothDarkActive.current,
      particleBridge.isDarkActive ? 1.0 : 0.0,
      0.12
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

    // Section 1 (ABOUT ME):
    // Opacity fades out once merging into Skills begins
    const skillsHide = 1.0 - THREE.MathUtils.smoothstep(smoothSkillsProgress.current, 0.0, 0.25);
    const aboutMeOpacity = smoothDarkActive.current * skillsHide;
    const aboutMeBreak = smoothOverviewProgress.current;

    const vW = viewport.width;
    const vH = viewport.height;

    // ABOUT Mesh & Points uniforms:
    aboutMeshMat.uniforms.uViewport.value.set(vW, vH);
    aboutMeshMat.uniforms.uScrollBreak.value = aboutMeBreak;
    aboutMeshMat.uniforms.uOpacity.value = aboutMeOpacity;
    aboutMeshMat.uniforms.uMouseWorld.value.copy(smoothMouseWorld.current);
    aboutMeshMat.uniforms.uMouseActive.value = smoothMouseActive.current;

    aboutPointsMat.uniforms.uViewport.value.set(vW, vH);
    aboutPointsMat.uniforms.uScrollBreak.value = aboutMeBreak;
    aboutPointsMat.uniforms.uOpacity.value = aboutMeOpacity;
    aboutPointsMat.uniforms.uMouseWorld.value.copy(smoothMouseWorld.current);
    aboutPointsMat.uniforms.uMouseActive.value = smoothMouseActive.current;

    // ME Mesh & Points uniforms:
    meMeshMat.uniforms.uViewport.value.set(vW, vH);
    meMeshMat.uniforms.uScrollBreak.value = aboutMeBreak;
    meMeshMat.uniforms.uOpacity.value = aboutMeOpacity;
    meMeshMat.uniforms.uMouseWorld.value.copy(smoothMouseWorld.current);
    meMeshMat.uniforms.uMouseActive.value = smoothMouseActive.current;

    mePointsMat.uniforms.uViewport.value.set(vW, vH);
    mePointsMat.uniforms.uScrollBreak.value = aboutMeBreak;
    mePointsMat.uniforms.uOpacity.value = aboutMeOpacity;
    mePointsMat.uniforms.uMouseWorld.value.copy(smoothMouseWorld.current);
    mePointsMat.uniforms.uMouseActive.value = smoothMouseActive.current;

    // Section 2 (SKILLS & CODE):
    // 100% invisible in Overview. Fades in symmetrically when entering Skills section.
    const skillsOpacity = smoothDarkActive.current * THREE.MathUtils.smoothstep(smoothSkillsProgress.current, 0.0, 0.20);
    // Breaks down as user scrolls through horizontal cards towards the end
    const skillsBreak = THREE.MathUtils.clamp(1.0 - smoothSkillsProgress.current, 0.0, 1.0);

    // CODE "</>" (Brand Red / Terracotta #bc6c25) uniforms:
    codeMeshMat.uniforms.uViewport.value.set(vW, vH);
    codeMeshMat.uniforms.uScrollBreak.value = skillsBreak;
    codeMeshMat.uniforms.uOpacity.value = skillsOpacity;
    codeMeshMat.uniforms.uMouseWorld.value.copy(smoothMouseWorld.current);
    codeMeshMat.uniforms.uMouseActive.value = smoothMouseActive.current;

    codePointsMat.uniforms.uViewport.value.set(vW, vH);
    codePointsMat.uniforms.uScrollBreak.value = skillsBreak;
    codePointsMat.uniforms.uOpacity.value = skillsOpacity;
    codePointsMat.uniforms.uMouseWorld.value.copy(smoothMouseWorld.current);
    codePointsMat.uniforms.uMouseActive.value = smoothMouseActive.current;

    // SKILLS (Brand White #fefae0) uniforms:
    skillsMeshMat.uniforms.uViewport.value.set(vW, vH);
    skillsMeshMat.uniforms.uScrollBreak.value = skillsBreak;
    skillsMeshMat.uniforms.uOpacity.value = skillsOpacity;
    skillsMeshMat.uniforms.uMouseWorld.value.copy(smoothMouseWorld.current);
    skillsMeshMat.uniforms.uMouseActive.value = smoothMouseActive.current;

    skillsPointsMat.uniforms.uViewport.value.set(vW, vH);
    skillsPointsMat.uniforms.uScrollBreak.value = skillsBreak;
    skillsPointsMat.uniforms.uOpacity.value = skillsOpacity;
    skillsPointsMat.uniforms.uMouseWorld.value.copy(smoothMouseWorld.current);
    skillsPointsMat.uniforms.uMouseActive.value = smoothMouseActive.current;

    // 3D Perspective Tilt on Group
    if (groupRef.current) {
      groupRef.current.rotation.y = smoothMouseWorld.current.x * 0.012 * smoothMouseActive.current;
      groupRef.current.rotation.x = smoothMouseWorld.current.y * 0.008 * smoothMouseActive.current;
      groupRef.current.rotation.z = 0;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 1. Real 3D Clash Display typography mesh for "ABOUT" (Brand White #fefae0) */}
      <mesh
        geometry={geometries.about}
        material={aboutMeshMat}
        position={[textLayout.xAbout, textLayout.overviewCenterY, 0]}
        scale={[textLayout.scale, textLayout.scale, 1]}
      />
      <points
        geometry={geometries.about}
        material={aboutPointsMat}
        position={[textLayout.xAbout, textLayout.overviewCenterY, 0]}
        scale={[textLayout.scale, textLayout.scale, 1]}
      />

      {/* 2. Real 3D Clash Display typography mesh for "ME" (Brand Red #bc6c25) */}
      <mesh
        geometry={geometries.me}
        material={meMeshMat}
        position={[textLayout.xMe, textLayout.overviewCenterY, 0]}
        scale={[textLayout.scale, textLayout.scale, 1]}
      />
      <points
        geometry={geometries.me}
        material={mePointsMat}
        position={[textLayout.xMe, textLayout.overviewCenterY, 0]}
        scale={[textLayout.scale, textLayout.scale, 1]}
      />

      {/* 3. Real 3D Clash Display typography mesh for "SKILLS" (Brand White #fefae0) */}
      <mesh
        geometry={geometries.skills}
        material={skillsMeshMat}
        position={[textLayout.xSkills, textLayout.skillsCenterY, 0]}
        scale={[textLayout.skillsScale, textLayout.skillsScale, 1]}
      />
      <points
        geometry={geometries.skills}
        material={skillsPointsMat}
        position={[textLayout.xSkills, textLayout.skillsCenterY, 0]}
        scale={[textLayout.skillsScale, textLayout.skillsScale, 1]}
      />

      {/* 4. Real 3D Clash Display typography mesh for "</>" (Brand Red #bc6c25) in front of SKILLS */}
      <mesh
        geometry={geometries.code}
        material={codeMeshMat}
        position={[textLayout.xCode, textLayout.skillsCenterY, 0.05]}
        scale={[textLayout.skillsScale, textLayout.skillsScale, 1]}
        renderOrder={2}
      />
      <points
        geometry={geometries.code}
        material={codePointsMat}
        position={[textLayout.xCode, textLayout.skillsCenterY, 0.05]}
        scale={[textLayout.skillsScale, textLayout.skillsScale, 1]}
        renderOrder={2}
      />
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
        {geometries && <UnifiedCelestialMesh geometries={geometries} />}
      </Canvas>
    </div>
  );
}
