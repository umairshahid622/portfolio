import * as THREE from "three";
import { TTFLoader, FontLoader } from "three-stdlib";

export interface TextMeshGeometries {
  white: THREE.BufferGeometry; // Unified morphable geometry: ABOUT <-> Spread Screen Triangles <-> SKILLS
  red: THREE.BufferGeometry;   // Unified morphable geometry: ME <-> Spread Screen Triangles <-> </>
}

interface RawTriangle {
  p1: [number, number, number];
  p2: [number, number, number];
  p3: [number, number, number];
  cx: number;
  cy: number;
  cz: number;
  area: number;
}

function getTrianglesFromShapes(shapes: THREE.Shape[], maxEdge = 0.08): RawTriangle[] {
  const geom = new THREE.ShapeGeometry(shapes);
  geom.center();
  const nonIndexed = geom.toNonIndexed();
  const pos = nonIndexed.attributes.position.array;
  const triangles: RawTriangle[] = [];

  function split(
    p1: [number, number, number],
    p2: [number, number, number],
    p3: [number, number, number]
  ) {
    const d12 = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);
    const d23 = Math.hypot(p2[0] - p3[0], p2[1] - p3[1]);
    const d31 = Math.hypot(p3[0] - p1[0], p3[1] - p1[1]);
    const maxD = Math.max(d12, d23, d31);

    if (maxD > maxEdge) {
      if (d12 >= d23 && d12 >= d31) {
        const mid: [number, number, number] = [
          (p1[0] + p2[0]) / 2,
          (p1[1] + p2[1]) / 2,
          (p1[2] + p2[2]) / 2,
        ];
        split(p1, mid, p3);
        split(mid, p2, p3);
      } else if (d23 >= d12 && d23 >= d31) {
        const mid: [number, number, number] = [
          (p2[0] + p3[0]) / 2,
          (p2[1] + p3[1]) / 2,
          (p2[2] + p3[2]) / 2,
        ];
        split(p1, p2, mid);
        split(p1, mid, p3);
      } else {
        const mid: [number, number, number] = [
          (p3[0] + p1[0]) / 2,
          (p3[1] + p1[1]) / 2,
          (p3[2] + p1[2]) / 2,
        ];
        split(p1, p2, mid);
        split(p2, p3, mid);
      }
    } else {
      const area =
        0.5 *
        Math.abs(
          (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p3[0] - p1[0]) * (p2[1] - p1[1])
        );
      const cx = (p1[0] + p2[0] + p3[0]) / 3;
      const cy = (p1[1] + p2[1] + p3[1]) / 3;
      const cz = (p1[2] + p2[2] + p3[2]) / 3;
      triangles.push({ p1, p2, p3, cx, cy, cz, area });
    }
  }

  for (let i = 0; i < pos.length; i += 9) {
    split(
      [pos[i], pos[i + 1], pos[i + 2]],
      [pos[i + 3], pos[i + 4], pos[i + 5]],
      [pos[i + 6], pos[i + 7], pos[i + 8]]
    );
  }
  return triangles;
}

function matchTriangleCountCentroid(arr: RawTriangle[], targetCount: number) {
  // If parity difference is odd, duplicate 1 smallest triangle so remaining count difference is even
  if ((targetCount - arr.length) % 2 !== 0) {
    arr.sort((a, b) => a.area - b.area);
    const smallest = arr[0];
    arr.push({ ...smallest });
  }

  // Sort descending by area to subdivide largest triangles first
  arr.sort((a, b) => b.area - a.area);
  let idx = 0;
  while (arr.length < targetCount) {
    const t = arr[idx++];
    const p1 = t.p1;
    const p2 = t.p2;
    const p3 = t.p3;
    // Centroid subdivision:
    // Partition triangle into 3 sub-triangles meeting at centroid.
    // Boundary edges (p1-p2, p2-p3, p3-p1) are 100% preserved with zero edge cuts.
    // This guarantees ZERO T-junctions across the entire font mesh, keeping it completely watertight under mouse vertex displacement!
    const c: [number, number, number] = [
      (p1[0] + p2[0] + p3[0]) / 3,
      (p1[1] + p2[1] + p3[1]) / 3,
      (p1[2] + p2[2] + p3[2]) / 3,
    ];
    const subArea = t.area / 3;
    const tA: RawTriangle = {
      p1,
      p2,
      p3: c,
      cx: (p1[0] + p2[0] + c[0]) / 3,
      cy: (p1[1] + p2[1] + c[1]) / 3,
      cz: (p1[2] + p2[2] + c[2]) / 3,
      area: subArea,
    };
    const tB: RawTriangle = {
      p1: p2,
      p2: p3,
      p3: c,
      cx: (p2[0] + p3[0] + c[0]) / 3,
      cy: (p2[1] + p3[1] + c[1]) / 3,
      cz: (p2[2] + p3[2] + c[2]) / 3,
      area: subArea,
    };
    const tC: RawTriangle = {
      p1: p3,
      p2: p1,
      p3: c,
      cx: (p3[0] + p1[0] + c[0]) / 3,
      cy: (p3[1] + p1[1] + c[1]) / 3,
      cz: (p3[2] + p1[2] + c[2]) / 3,
      area: subArea,
    };
    arr[idx - 1] = tA;
    arr.push(tB);
    arr.push(tC);
  }
}

function buildMorphableGeometry(
  t1: RawTriangle[],
  t2: RawTriangle[],
  t3?: RawTriangle[]
): THREE.BufferGeometry {
  const targetCount = Math.max(t1.length, t2.length, t3 ? t3.length : 0);
  matchTriangleCountCentroid(t1, targetCount);
  matchTriangleCountCentroid(t2, targetCount);
  if (t3) {
    matchTriangleCountCentroid(t3, targetCount);
  }

  // Sort along X to align natural typographic flow
  t1.sort((a, b) => a.cx - b.cx || a.cy - b.cy);
  t2.sort((a, b) => a.cx - b.cx || a.cy - b.cy);
  if (t3) {
    t3.sort((a, b) => a.cx - b.cx || a.cy - b.cy);
  }

  const totalVertices = targetCount * 3;
  const positions = new Float32Array(totalVertices * 3);
  const centers = new Float32Array(totalVertices * 3);
  const targetPositions = new Float32Array(totalVertices * 3);
  const targetCenters = new Float32Array(totalVertices * 3);
  const target3Positions = new Float32Array(totalVertices * 3);
  const target3Centers = new Float32Array(totalVertices * 3);
  const randoms = new Float32Array(totalVertices * 4);

  for (let i = 0; i < targetCount; i++) {
    const tri1 = t1[i];
    const tri2 = t2[i];
    const tri3 = t3 ? t3[i] : null;

    // Deterministic pseudo-random seed based on triangle center
    const s1 = Math.sin(tri1.cx * 12.9898 + tri1.cy * 78.233) * 43758.5453;
    const s2 = Math.cos(tri1.cx * 93.9898 + tri1.cy * 67.345) * 24634.6345;
    const s3 = Math.sin(tri1.cx * 43.1234 + tri1.cy * 19.876) * 58392.1234;
    const r1 = (s1 - Math.floor(s1)) * 2 - 1;
    const r2 = (s2 - Math.floor(s2)) * 2 - 1;
    const r3 = (s3 - Math.floor(s3)) * 2 - 1;
    const phase = Math.sin(tri1.cx * 4.5 + tri1.cy * 2.3) * 0.5 + 0.5;

    const len = Math.hypot(r1, r2, r3) || 1;
    const nx = r1 / len;
    const ny = r2 / len;
    const nz = Math.abs(r3 / len) * 1.5;

    const pts1 = [tri1.p1, tri1.p2, tri1.p3];
    const pts2 = [tri2.p1, tri2.p2, tri2.p3];
    const pts3 = tri3 ? [tri3.p1, tri3.p2, tri3.p3] : pts2;

    for (let v = 0; v < 3; v++) {
      const vIdx = (i * 3 + v) * 3;
      const rIdx = (i * 3 + v) * 4;

      positions[vIdx] = pts1[v][0];
      positions[vIdx + 1] = pts1[v][1];
      positions[vIdx + 2] = pts1[v][2];

      centers[vIdx] = tri1.cx;
      centers[vIdx + 1] = tri1.cy;
      centers[vIdx + 2] = tri1.cz;

      targetPositions[vIdx] = pts2[v][0];
      targetPositions[vIdx + 1] = pts2[v][1];
      targetPositions[vIdx + 2] = pts2[v][2];

      targetCenters[vIdx] = tri2.cx;
      targetCenters[vIdx + 1] = tri2.cy;
      targetCenters[vIdx + 2] = tri2.cz;

      target3Positions[vIdx] = pts3[v][0];
      target3Positions[vIdx + 1] = pts3[v][1];
      target3Positions[vIdx + 2] = pts3[v][2];

      target3Centers[vIdx] = tri3 ? tri3.cx : tri2.cx;
      target3Centers[vIdx + 1] = tri3 ? tri3.cy : tri2.cy;
      target3Centers[vIdx + 2] = tri3 ? tri3.cz : tri2.cz;

      randoms[rIdx] = nx;
      randoms[rIdx + 1] = ny;
      randoms[rIdx + 2] = nz;
      randoms[rIdx + 3] = phase;
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geom.setAttribute("aCenter", new THREE.BufferAttribute(centers, 3));
  geom.setAttribute("aTargetPos", new THREE.BufferAttribute(targetPositions, 3));
  geom.setAttribute("aTargetCenter", new THREE.BufferAttribute(targetCenters, 3));
  geom.setAttribute("aTarget3Pos", new THREE.BufferAttribute(target3Positions, 3));
  geom.setAttribute("aTarget3Center", new THREE.BufferAttribute(target3Centers, 3));
  geom.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 4));
  geom.computeBoundingBox();
  return geom;
}

let cachedGeometries: TextMeshGeometries | null = null;
let loadPromise: Promise<TextMeshGeometries> | null = null;

export async function loadMeshFontGeometries(): Promise<TextMeshGeometries> {
  if (cachedGeometries) return cachedGeometries;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const res = await fetch("/fonts/ClashDisplay-Variable.ttf");
    const arrayBuffer = await res.arrayBuffer();
    const ttfLoader = new TTFLoader();
    const fontData = ttfLoader.parse(arrayBuffer);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const font = new FontLoader().parse(fontData as any);

    const shapesAbout = font.generateShapes("ABOUT", 1);
    const shapesSkills = font.generateShapes("SKILLS", 1);
    const shapesWork = font.generateShapes("Work", 1);
    const white = buildMorphableGeometry(
      getTrianglesFromShapes(shapesAbout, 0.16),
      getTrianglesFromShapes(shapesSkills, 0.17),
      getTrianglesFromShapes(shapesWork, 0.12)
    );

    const shapesMe = font.generateShapes("ME", 1);
    const shapesCode = font.generateShapes("</>", 1);
    const shapesExperience = font.generateShapes("Experience", 1);
    const red = buildMorphableGeometry(
      getTrianglesFromShapes(shapesMe, 0.06),
      getTrianglesFromShapes(shapesCode, 0.06),
      getTrianglesFromShapes(shapesExperience, 0.20)
    );

    cachedGeometries = { white, red };
    return cachedGeometries;
  })();

  return loadPromise;
}
