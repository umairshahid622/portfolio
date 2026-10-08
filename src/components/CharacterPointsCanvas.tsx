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

  attribute vec3 aCenter;
  attribute vec4 aRandom;

  varying vec3 vWorldPos;
  varying float vBreakProgress;

  void main() {
    vec3 pos = position;

    // 1. Interactive mouse repulsion (cushion push away from cursor when active)
    vec4 wp = modelMatrix * vec4(pos, 1.0);
    float d = length(wp.xy - uMouseWorld);
    float repel = smoothstep(uRadius, 0.03, d) * uMouseActive * 0.085;
    vec2 repelDir = normalize(wp.xy - uMouseWorld + vec2(0.0001));
    pos.xy += repelDir * repel;
    pos.z -= repel * 0.3;

    // 2. MESH NODE BREAKDOWN ON SCROLL
    // Node breakdown begins smoothly on scroll
    float threshold = aRandom.w * 0.35; // staggered start per node/triangle
    float breakP = clamp((uScrollBreak - threshold) / (1.0 - threshold + 0.0001), 0.0, 1.0);

    if (breakP > 0.0) {
      // Relative vector from triangle center to this vertex node
      vec3 localVec = pos - aCenter;

      // Node shrinkage & separation as it breaks apart
      float scale = max(0.0, 1.0 - pow(breakP, 0.65));

      // 3D rotation of the node facet around its own random axis
      float angle = breakP * 9.0 * (aRandom.x > 0.0 ? 1.0 : -1.0);
      vec3 axis = normalize(aRandom.xyz);
      localVec = localVec * cos(angle) + cross(axis, localVec) * sin(angle) + axis * dot(axis, localVec) * (1.0 - cos(angle));
      localVec *= scale;

      // 3D trajectory burst for this node
      vec3 flyDir = aRandom.xyz;
      flyDir.z += abs(aRandom.y) * 1.8 + 0.2;
      flyDir.y += aRandom.w * 0.5;
      float flyDist = pow(breakP, 1.35) * 4.2;

      pos = aCenter + localVec + flyDir * flyDist;
    }

    vBreakProgress = breakP;
    vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
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

    // Alpha gracefully fades out as nodes disperse into deep space
    float alpha = uOpacity * (1.0 - pow(vBreakProgress, 2.5));
    if (alpha < 0.005) discard;

    gl_FragColor = vec4(col, alpha);
  }
`;

const POINTS_VERTEX_SHADER = `
  uniform float uScrollBreak;
  uniform vec2 uMouseWorld;
  uniform float uMouseActive;
  uniform float uRadius;

  attribute vec3 aCenter;
  attribute vec4 aRandom;

  varying float vBreakProgress;

  void main() {
    vec3 pos = position;

    vec4 wp = modelMatrix * vec4(pos, 1.0);
    float d = length(wp.xy - uMouseWorld);
    float repel = smoothstep(uRadius, 0.03, d) * uMouseActive * 0.085;
    vec2 repelDir = normalize(wp.xy - uMouseWorld + vec2(0.0001));
    pos.xy += repelDir * repel;
    pos.z -= repel * 0.3;

    float threshold = aRandom.w * 0.35;
    float breakP = clamp((uScrollBreak - threshold) / (1.0 - threshold + 0.0001), 0.0, 1.0);

    if (breakP > 0.0) {
      vec3 localVec = pos - aCenter;
      float scale = max(0.0, 1.0 - pow(breakP, 0.65));
      float angle = breakP * 9.0 * (aRandom.x > 0.0 ? 1.0 : -1.0);
      vec3 axis = normalize(aRandom.xyz);
      localVec = localVec * cos(angle) + cross(axis, localVec) * sin(angle) + axis * dot(axis, localVec) * (1.0 - cos(angle));
      localVec *= scale;

      vec3 flyDir = aRandom.xyz;
      flyDir.z += abs(aRandom.y) * 1.8 + 0.2;
      flyDir.y += aRandom.w * 0.5;
      float flyDist = pow(breakP, 1.35) * 4.2;

      pos = aCenter + localVec + flyDir * flyDist;
    }

    vBreakProgress = breakP;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = clamp(breakP * 4.0, 0.0, 6.0);
    gl_Position = projectionMatrix * mvPosition;
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
    float alpha = uOpacity * (1.0 - pow(vBreakProgress, 2.0)) * (1.0 - dist * 2.0);
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
    const skillsWidthRatio = viewport.width < 3.2 ? 0.44 : 0.28;
    const skillsHeightRatio = viewport.width < 3.2 ? 0.09 : 0.12;
    const skillsTargetW = viewport.width * skillsWidthRatio;
    const skillsTargetH = viewport.height * skillsHeightRatio;
    const baseWSkills = 4.953;
    const skillsScale = Math.min(skillsTargetW / baseWSkills, skillsTargetH / baseH);
    const wSkills = baseWSkills * skillsScale;
    const xSkills = edges.left + wSkills * 0.5;

    return {
      overviewCenterY,
      scale,
      xAbout,
      xMe,
      skillsCenterY,
      skillsScale,
      xSkills,
    };
  }, [viewport.width, viewport.height, size.width]);

  // Mesh Materials
  const aboutMeshMat = useMemo(() => createBreakdownMeshMaterial("#fefae0"), []);
  const meMeshMat = useMemo(() => createBreakdownMeshMaterial("#bc6c25"), []);
  const skillsMeshMat = useMemo(() => createBreakdownMeshMaterial("#fefae0"), []);

  // Point Node Materials
  const aboutPointsMat = useMemo(() => createBreakdownPointsMaterial("#fefae0"), []);
  const mePointsMat = useMemo(() => createBreakdownPointsMaterial("#bc6c25"), []);
  const skillsPointsMat = useMemo(() => createBreakdownPointsMaterial("#fefae0"), []);

  useEffect(() => {
    return () => {
      aboutMeshMat.dispose();
      meMeshMat.dispose();
      skillsMeshMat.dispose();
      aboutPointsMat.dispose();
      mePointsMat.dispose();
      skillsPointsMat.dispose();
    };
  }, [aboutMeshMat, meMeshMat, skillsMeshMat, aboutPointsMat, mePointsMat, skillsPointsMat]);

  useFrame(() => {
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
    smoothDarkActive.current = THREE.MathUtils.lerp(
      smoothDarkActive.current,
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

    // Section 1 (ABOUT ME):
    // Opacity fades out if scrolling into Skills
    const skillsHide = 1.0 - THREE.MathUtils.smoothstep(smoothSkillsProgress.current, 0.0, 0.15);
    const aboutMeOpacity = smoothDarkActive.current * skillsHide;
    const aboutMeBreak = smoothOverviewProgress.current;

    // ABOUT Mesh & Points uniforms:
    aboutMeshMat.uniforms.uScrollBreak.value = aboutMeBreak;
    aboutMeshMat.uniforms.uOpacity.value = aboutMeOpacity;
    aboutMeshMat.uniforms.uMouseWorld.value.copy(smoothMouseWorld.current);
    aboutMeshMat.uniforms.uMouseActive.value = smoothMouseActive.current;

    aboutPointsMat.uniforms.uScrollBreak.value = aboutMeBreak;
    aboutPointsMat.uniforms.uOpacity.value = aboutMeOpacity;
    aboutPointsMat.uniforms.uMouseWorld.value.copy(smoothMouseWorld.current);
    aboutPointsMat.uniforms.uMouseActive.value = smoothMouseActive.current;

    // ME Mesh & Points uniforms:
    meMeshMat.uniforms.uScrollBreak.value = aboutMeBreak;
    meMeshMat.uniforms.uOpacity.value = aboutMeOpacity;
    meMeshMat.uniforms.uMouseWorld.value.copy(smoothMouseWorld.current);
    meMeshMat.uniforms.uMouseActive.value = smoothMouseActive.current;

    mePointsMat.uniforms.uScrollBreak.value = aboutMeBreak;
    mePointsMat.uniforms.uOpacity.value = aboutMeOpacity;
    mePointsMat.uniforms.uMouseWorld.value.copy(smoothMouseWorld.current);
    mePointsMat.uniforms.uMouseActive.value = smoothMouseActive.current;

    // Section 2 (SKILLS):
    // 100% invisible in Overview. Fades in when entering Skills section.
    const skillsOpacity = smoothDarkActive.current * THREE.MathUtils.smoothstep(smoothSkillsProgress.current, 0.02, 0.35);
    // Breaks down as user scrolls through horizontal cards towards the end
    const skillsBreak = THREE.MathUtils.clamp(1.0 - smoothSkillsProgress.current, 0.0, 1.0);

    skillsMeshMat.uniforms.uScrollBreak.value = skillsBreak;
    skillsMeshMat.uniforms.uOpacity.value = skillsOpacity;
    skillsMeshMat.uniforms.uMouseWorld.value.copy(smoothMouseWorld.current);
    skillsMeshMat.uniforms.uMouseActive.value = smoothMouseActive.current;

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
