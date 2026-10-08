import * as THREE from "three";
import { TTFLoader, FontLoader } from "three-stdlib";

export interface TextMeshGeometries {
  about: THREE.BufferGeometry;
  me: THREE.BufferGeometry;
  skills: THREE.BufferGeometry;
}

function subdivideAndProcess(geom: THREE.ShapeGeometry, maxEdge = 0.1): THREE.BufferGeometry {
  geom.center();
  const nonIndexed = geom.toNonIndexed();
  const pos = nonIndexed.attributes.position.array;
  const newPositions: number[] = [];

  function processTriangle(
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
        processTriangle(p1, mid, p3);
        processTriangle(mid, p2, p3);
      } else if (d23 >= d12 && d23 >= d31) {
        const mid: [number, number, number] = [
          (p2[0] + p3[0]) / 2,
          (p2[1] + p3[1]) / 2,
          (p2[2] + p3[2]) / 2,
        ];
        processTriangle(p1, p2, mid);
        processTriangle(p1, mid, p3);
      } else {
        const mid: [number, number, number] = [
          (p3[0] + p1[0]) / 2,
          (p3[1] + p1[1]) / 2,
          (p3[2] + p1[2]) / 2,
        ];
        processTriangle(p1, p2, mid);
        processTriangle(p2, p3, mid);
      }
    } else {
      newPositions.push(...p1, ...p2, ...p3);
    }
  }

  for (let i = 0; i < pos.length; i += 9) {
    const p1: [number, number, number] = [pos[i], pos[i + 1], pos[i + 2]];
    const p2: [number, number, number] = [pos[i + 3], pos[i + 4], pos[i + 5]];
    const p3: [number, number, number] = [pos[i + 6], pos[i + 7], pos[i + 8]];
    processTriangle(p1, p2, p3);
  }

  const totalVertices = newPositions.length / 3;
  const centers = new Float32Array(totalVertices * 3);
  const randoms = new Float32Array(totalVertices * 4);

  for (let i = 0; i < newPositions.length; i += 9) {
    const cx = (newPositions[i] + newPositions[i + 3] + newPositions[i + 6]) / 3;
    const cy = (newPositions[i + 1] + newPositions[i + 4] + newPositions[i + 7]) / 3;
    const cz = (newPositions[i + 2] + newPositions[i + 5] + newPositions[i + 8]) / 3;

    // Deterministic pseudo-random seed based on triangle center
    const s1 = Math.sin(cx * 12.9898 + cy * 78.233) * 43758.5453;
    const s2 = Math.cos(cx * 93.9898 + cy * 67.345) * 24634.6345;
    const s3 = Math.sin(cx * 43.1234 + cy * 19.876) * 58392.1234;
    const r1 = (s1 - Math.floor(s1)) * 2 - 1;
    const r2 = (s2 - Math.floor(s2)) * 2 - 1;
    const r3 = (s3 - Math.floor(s3)) * 2 - 1;
    const phase = Math.sin(cx * 4.5 + cy * 2.3) * 0.5 + 0.5;

    const len = Math.hypot(r1, r2, r3) || 1;
    const nx = r1 / len;
    const ny = r2 / len;
    const nz = Math.abs(r3 / len) * 1.5;

    for (let v = 0; v < 3; v++) {
      const idx = (i / 3 + v) * 3;
      centers[idx] = cx;
      centers[idx + 1] = cy;
      centers[idx + 2] = cz;

      const ridx = (i / 3 + v) * 4;
      randoms[ridx] = nx;
      randoms[ridx + 1] = ny;
      randoms[ridx + 2] = nz;
      randoms[ridx + 3] = phase;
    }
  }

  const result = new THREE.BufferGeometry();
  result.setAttribute("position", new THREE.Float32BufferAttribute(newPositions, 3));
  result.setAttribute("aCenter", new THREE.BufferAttribute(centers, 3));
  result.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 4));
  result.computeBoundingBox();
  return result;
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
    const geomAbout = new THREE.ShapeGeometry(shapesAbout);
    const about = subdivideAndProcess(geomAbout, 0.1);

    const shapesMe = font.generateShapes("ME", 1);
    const geomMe = new THREE.ShapeGeometry(shapesMe);
    const me = subdivideAndProcess(geomMe, 0.1);

    const shapesSkills = font.generateShapes("SKILLS", 1);
    const geomSkills = new THREE.ShapeGeometry(shapesSkills);
    const skills = subdivideAndProcess(geomSkills, 0.1);

    cachedGeometries = { about, me, skills };
    return cachedGeometries;
  })();

  return loadPromise;
}
