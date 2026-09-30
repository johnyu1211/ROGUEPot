// ============================================================================
// 🎮 ROGUEPot Move Animation Renderer: No.157 ~ No.160
// 157: 스톤샤워 (Rock Slide)
// 158: 필살앞니 / 하이퍼분쇄 (Hyper Fang)
// 159: 각지기 (Sharpen)
// 160: 텍스처 (Conversion)
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawStatBoostEffect, drawMiniRetroStar } from "../common/helpers.js";

// ============================================================================
// 🪨 157: 스톤샤워 (Rock Slide)
// ============================================================================

// 3D 옥타헤드론(8면체) 기저 지오메트리
const OCTA_VERTS: readonly [number, number, number][] = [
  [ 1,  0,  0], // 0: +X
  [-1,  0,  0], // 1: -X
  [ 0,  1,  0], // 2: +Y
  [ 0, -1,  0], // 3: -Y
  [ 0,  0,  1], // 4: +Z
  [ 0,  0, -1], // 5: -Z
];

const OCTA_FACES: readonly [number, number, number][] = [
  // Z > 0 (+Z 반구)
  [0, 2, 4],
  [2, 1, 4],
  [1, 3, 4],
  [3, 0, 4],
  // Z < 0 (-Z 반구)
  [2, 0, 5],
  [1, 2, 5],
  [3, 1, 5],
  [0, 3, 5],
];

// 32면체 지오메트리 (옥타헤드론 1-to-4 세분화: 18개 정점, 32개 패싯)
// 20면체보다는 정밀하고 80면체보다는 정돈된 최적의 3D 카툰/픽셀 바위 볼륨
const ROCK_MESH = (() => {
  const verts: [number, number, number][] = OCTA_VERTS.map(v => [...v]);
  const faces: [number, number, number][] = [];
  const edgeMidpointMap = new Map<string, number>();

  function getMidpoint(i1: number, i2: number): number {
    const key = i1 < i2 ? `${i1}_${i2}` : `${i2}_${i1}`;
    const cached = edgeMidpointMap.get(key);
    if (cached !== undefined) return cached;

    const v1 = verts[i1];
    const v2 = verts[i2];
    const mx = (v1[0] + v2[0]) * 0.5;
    const my = (v1[1] + v2[1]) * 0.5;
    const mz = (v1[2] + v2[2]) * 0.5;
    const len = Math.hypot(mx, my, mz);
    const newIdx = verts.length;
    verts.push([mx / len, my / len, mz / len]);
    edgeMidpointMap.set(key, newIdx);
    return newIdx;
  }

  for (const [i0, i1, i2] of OCTA_FACES) {
    const m01 = getMidpoint(i0, i1);
    const m12 = getMidpoint(i1, i2);
    const m20 = getMidpoint(i2, i0);

    faces.push([i0, m01, m20]);
    faces.push([i1, m12, m01]);
    faces.push([i2, m20, m12]);
    faces.push([m01, m12, m20]);
  }

  return { verts, faces };
})();

function getFacetColor(dot: number): string {
  // 지진(Earthquake) 바위 원본 색상 완벽 고증 (입체 3D 음영 매핑)
  // - 메인 바디: #5D4037 (지진 바위 고유의 짙은 대지 브라운 톤)
  // - 상단 햇빛면: #BCAAA4 / #A1887F (지진 상단 밝은 패싯)
  // - 측면/하단 음영: #4E342E / #3E2723 / #27170E (지진 하단 암영 패싯)
  if (dot > 0.65) return "#BCAAA4"; // 최상단 햇빛 직격면
  if (dot > 0.38) return "#A1887F"; // 상단 밝은 암석면
  if (dot > -0.15) return "#5D4037"; // ★ 메인 바디 대지 브라운 (지진 돌 기본색)
  if (dot > -0.45) return "#4E342E"; // 측면 음영
  if (dot > -0.70) return "#3E2723"; // 하단 짙은 그림자
  return "#27170E";                 // 최하단 깊은 암영
}

/**
 * 3D 입체 다각면 바위 렌더링 헬퍼 (지진 암석 팔레트 & 깔끔한 32면체 폴리헤드론 렌더링)
 * - 18개 정점, 32개 패싯 지오메트리로 과하지 않고 단단하게 각진 클래식 3D 바위 볼륨 구현
 * - 실시간 Backface Culling (화면 전면을 향하는 면만 선별 렌더링)
 * - 천정-좌상단 고정 광원 벡터 기반 면별 명암 음영(Faceted Shading)
 * - 깔끔한 외곽선(Contour)만 유지하고 내부 폴리곤 구분선은 제거하여 부드러운 3D 볼륨감 연출
 */
export function drawFacetedRock(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  rotation: number = 0,
  seed: number = 0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || size <= 1) return;

  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  // 1) 3D 정점 준비 (자연스러운 저주파 암석 변형 및 3D 텀블링 회전)
  const rotX = rotation * 0.75 + seed * 1.37;
  const rotY = rotation * 1.15 + seed * 2.19;
  const rotZ = rotation * 0.45 + seed * 0.73;

  const cy_ang = Math.cos(rotY), sy_ang = Math.sin(rotY);
  const cx_ang = Math.cos(rotX), sx_ang = Math.sin(rotX);
  const cz_ang = Math.cos(rotZ), sz_ang = Math.sin(rotZ);

  // 18개 정점 자연스러운 형태 변형 (과도한 노이즈 제거 -> 단단하고 굵직한 평면 유지)
  const p3d = ROCK_MESH.verts.map((v, i) => {
    const shape = Math.sin(seed * 4.1 + v[0] * 2.7 + v[1] * 2.1) * 0.16 + Math.cos(seed * 6.7 + v[2] * 2.4) * 0.12;
    const rf = 0.95 + shape;

    const x0 = v[0] * rf * size;
    const y0 = v[1] * rf * size * 0.88; // 지면 중력에 따른 묵직한 형태
    const z0 = v[2] * rf * size;

    // Ry 회전
    const x1 = x0 * cy_ang + z0 * sy_ang;
    const y1 = y0;
    const z1 = -x0 * sy_ang + z0 * cy_ang;

    // Rx 회전
    const x2 = x1;
    const y2 = y1 * cx_ang - z1 * sx_ang;
    const z2 = y1 * sx_ang + z1 * cx_ang;

    // Rz 회전
    const x3 = x2 * cz_ang - y2 * sz_ang;
    const y3 = x2 * sz_ang + y2 * cz_ang;
    const z3 = z2;

    return { x: cx + x3, y: cy + y3, z: z3 };
  });

  // 2) 가시 면 선별 (Backface Culling) 및 광원 내적 계산
  // 화면 기준 광원 방향: 좌상단 앞쪽 (Lx = -0.38, Ly = -0.72, Lz = 0.58)
  const LX = -0.38;
  const LY = -0.72;
  const LZ = 0.58;

  interface FaceInfo {
    pts: { x: number; y: number }[];
    intensity: number;
    avgZ: number;
  }

  const visibleFaces: FaceInfo[] = [];
  const edgeFaceMap = new Map<string, { intensity: number; p1: { x: number; y: number }; p2: { x: number; y: number } }[]>();

  for (let f = 0; f < ROCK_MESH.faces.length; f++) {
    const [i0, i1, i2] = ROCK_MESH.faces[f];
    const p0 = p3d[i0];
    const p1 = p3d[i1];
    const p2 = p3d[i2];

    const abx = p1.x - p0.x, aby = p1.y - p0.y, abz = p1.z - p0.z;
    const acx = p2.x - p0.x, acy = p2.y - p0.y, acz = p2.z - p0.z;

    const nx = aby * acz - abz * acy;
    const ny = abz * acx - abx * acz;
    const nz = abx * acy - aby * acx;

    // Backface culling: nz <= 0 이면 화면 뒤를 향함
    if (nz <= 0.001) continue;

    const len = Math.hypot(nx, ny, nz);
    if (len <= 0.0001) continue;

    const unx = nx / len;
    const uny = ny / len;
    const unz = nz / len;

    const dot = unx * LX + uny * LY + unz * LZ;

    visibleFaces.push({
      pts: [
        { x: p0.x, y: p0.y },
        { x: p1.x, y: p1.y },
        { x: p2.x, y: p2.y },
      ],
      intensity: dot,
      avgZ: (p0.z + p1.z + p2.z) / 3,
    });

    // 엣지 정보 등록
    const edges: [number, number][] = [
      [Math.min(i0, i1), Math.max(i0, i1)],
      [Math.min(i1, i2), Math.max(i1, i2)],
      [Math.min(i2, i0), Math.max(i2, i0)],
    ];
    const vPts = [p0, p1, p2];
    for (let e = 0; e < 3; e++) {
      const key = `${edges[e][0]}_${edges[e][1]}`;
      const ep1 = vPts[e];
      const ep2 = vPts[(e + 1) % 3];
      if (!edgeFaceMap.has(key)) {
        edgeFaceMap.set(key, []);
      }
      edgeFaceMap.get(key)!.push({ intensity: dot, p1: ep1, p2: ep2 });
    }
  }

  // Z-정렬 (깊은 면부터 먼저 채색)
  visibleFaces.sort((a, b) => a.avgZ - b.avgZ);

  // 3) 면 채우기 (면 색상 차이로 자연스럽고 단단한 볼륨 형성)
  for (const face of visibleFaces) {
    ctx.fillStyle = getFacetColor(face.intensity);
    ctx.beginPath();
    ctx.moveTo(face.pts[0].x, face.pts[0].y);
    ctx.lineTo(face.pts[1].x, face.pts[1].y);
    ctx.lineTo(face.pts[2].x, face.pts[2].y);
    ctx.closePath();
    ctx.fill();
  }

  // 4) 엣지 렌더링: 또렷한 외곽선만 적용 (내부 폴리곤 구분선 제거)
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const [_key, list] of edgeFaceMap.entries()) {
    if (list.length === 1) {
      // 외곽 실루엣 엣지: 또렷한 픽셀아트 외곽선
      const e = list[0];
      ctx.strokeStyle = "#1A0F0B";
      ctx.lineWidth = Math.max(1.0, size * 0.08);
      ctx.beginPath();
      ctx.moveTo(e.p1.x, e.p1.y);
      ctx.lineTo(e.p2.x, e.p2.y);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * 빗발쳐 떨어지는 수직 하강 잔상 속도선 (중앙 단일 선, 바위 두께, 끝쪽(뒤쪽) 완전 투명 페이드)
 */
function drawRockSpeedLines(
  ctx: any,
  x: number,
  topY: number,
  botY: number,
  width: number = 16,
  alpha: number = 0.8
) {
  if (botY <= topY || alpha <= 0.01) return;

  const grad = ctx.createLinearGradient(0, topY, 0, botY);
  // 끝쪽(뒤쪽) 100% 완전 투명 -> 바위 쪽으로 오면서 자연스럽게 농도 증가
  grad.addColorStop(0, "rgba(255, 255, 255, 0)");
  grad.addColorStop(0.35, `rgba(240, 235, 225, ${alpha * 0.15})`);
  grad.addColorStop(0.70, `rgba(240, 235, 225, ${alpha * 0.45})`);
  grad.addColorStop(1.0, `rgba(255, 255, 255, ${alpha * 0.75})`);

  ctx.save();
  ctx.strokeStyle = grad;
  ctx.lineWidth = width;
  ctx.lineCap = "butt";
  ctx.beginPath();
  ctx.moveTo(x, topY);
  ctx.lineTo(x, botY);
  ctx.stroke();
  ctx.restore();
}

/**
 * 바위 파편 (날카로운 조각) 렌더링
 * - 돌 본체(drawFacetedRock)와 동일한 입체 음영 체계 적용
 * - 상단 햇빛면(#A1887F) / 측면 바디(#5D4037) / 아랫쪽 짙은 그림자(#27170E) 3단 패싯 구성
 * - 내부 구분선 없이 면별 음영 색상 차이로만 단단한 3D 각진 볼륨감 구현 + 깔끔한 외곽 실루엣(#1A0F0B)
 */
function drawRockShard(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  angle: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || size <= 0.5) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  const s = size;
  // 각 정점: 좌(p0), 상(p1), 우(p2), 하(p3), 중심(c)
  const p0 = { x: -s * 0.75, y: -s * 0.25 };
  const p1 = { x:  s * 0.15, y: -s * 0.88 };
  const p2 = { x:  s * 0.82, y:  s * 0.18 };
  const p3 = { x: -s * 0.18, y:  s * 0.82 };
  const c  = { x:  s * 0.05, y: -s * 0.02 };

  // 1. 상단 밝은 면 (햇빛 직격 패싯: #A1887F)
  ctx.fillStyle = "#A1887F";
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineTo(c.x, c.y);
  ctx.closePath();
  ctx.fill();

  // 2. 우측/측면 바디 면 (대지 브라운 중간톤: #5D4037)
  ctx.fillStyle = "#5D4037";
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(c.x, c.y);
  ctx.closePath();
  ctx.fill();

  // 3. 아랫쪽 짙은 그림자 음영면 (하단 암영 패싯: #27170E)
  ctx.fillStyle = "#27170E";
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.closePath();
  ctx.fill();

  // 4. 또렷한 외곽 실루엣 엣지만 렌더링 (내부 선 제외)
  ctx.strokeStyle = "#1A0F0B";
  ctx.lineWidth = Math.max(0.75, s * 0.09);
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
}

/**
 * 바닥 지면 충격 모래먼지 구름 (착지/강타 시 양옆 팽창)
 */
/**
 * 바닥 지면 충격 모래먼지 구름 (착지/강타 시 양옆 팽창) - 유저 요청으로 비활성화
 */
function drawGroundDustPuff(
  _ctx: any,
  _cx: number,
  _cy: number,
  _rx: number,
  _ry: number,
  _alpha: number = 0.7,
  _color: string = "rgba(214, 180, 130, "
) {
  // [유저 요청] 스톤샤워의 흙먼지 구름 완전 제거
  return;
}

/**
 * 시전 포켓몬 발구르기 시 발생하는 지면 파쇄 및 자갈 분출 이펙트 (흙먼지 구름 제외)
 */
function drawCasterEarthDust(
  ctx: any,
  casterX: number,
  casterY: number,
  isLeft: boolean,
  p: number
) {
  ctx.save();

  // 지면 발밑 플랫폼 기준선
  const groundY = casterY + 20;
  const forwardX = isLeft ? 14 : -14;

  // 1. 발구르기 지면 균열 (유저 요청: 시전 충격파 링 제거)
  const shockScale = p * 1.4;
  const shockAlpha = Math.max(0, 1.0 - p * 0.8);
  if (shockAlpha > 0.05) {
    ctx.save();
    // 지면 균열 선 (발밑에서 바깥으로 뻗어나가는 날카로운 갈라짐)
    ctx.strokeStyle = `rgba(120, 80, 40, ${shockAlpha * 0.75})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    // 좌측 갈라짐
    ctx.moveTo(casterX, groundY);
    ctx.lineTo(casterX - 18 * shockScale, groundY + 1);
    ctx.lineTo(casterX - 28 * shockScale, groundY - 2);
    // 우측 갈라짐
    ctx.moveTo(casterX, groundY);
    ctx.lineTo(casterX + 16 * shockScale, groundY + 2);
    ctx.lineTo(casterX + 26 * shockScale, groundY - 1);
    // 전방 갈라짐
    ctx.moveTo(casterX + forwardX * 0.5, groundY);
    ctx.lineTo(casterX + forwardX * (18 * shockScale / 14), groundY + 3);
    ctx.stroke();
    ctx.restore();
  }

  // 2. 모래 알갱이 및 솟구치는 암석 파편 (Sand Attack / Rock Slide)
  const particles = [
    { angle: -1.75, speed: 45, size: 4.5, color: "#78716C", rot: 1.2 },
    { angle: -1.50, speed: 58, size: 5.0, color: "#A8A29E", rot: 2.5 },
    { angle: -1.30, speed: 50, size: 4.0, color: "#D97706", rot: 0.8 },
    { angle: -1.90, speed: 38, size: 3.5, color: "#B45309", rot: 3.1 },
    { angle: -1.15, speed: 42, size: 4.0, color: "#78716C", rot: 1.9 },
    { angle: -1.60, speed: 64, size: 5.5, color: "#D6D3D1", rot: 4.2 },
    { angle: -1.40, speed: 52, size: 3.0, color: "#F59E0B", rot: 2.1 },
    { angle: -2.05, speed: 30, size: 3.5, color: "#A8A29E", rot: 0.5 },
    { angle: -0.95, speed: 32, size: 3.0, color: "#D97706", rot: 3.8 },
    { angle: -1.55, speed: 70, size: 4.0, color: "#E7E5E4", rot: 1.6 },
  ];

  particles.forEach((pt, i) => {
    const dist = p * pt.speed;
    const px = casterX + forwardX * 0.5 + Math.cos(pt.angle) * dist;
    const py = groundY + Math.sin(pt.angle) * dist + (p * p * 8);
    const pAlpha = Math.max(0, 1.0 - p * 0.35);

    if (i % 2 === 0) {
      drawRockShard(ctx, px, py, pt.size, pt.rot + p * 6, pAlpha);
    } else {
      ctx.save();
      ctx.globalAlpha = pAlpha;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.ellipse(px, py, pt.size * 0.7, pt.size * 0.55, pt.rot + p * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#44403C";
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();
    }
  });

  // 4. 상공 분출 가속선 (지면 파쇄로 바위들이 솟구쳐 오르는 속도감)
  if (p > 0.25) {
    const lineAlpha = (1.0 - (p - 0.25) / 0.75) * 0.75;
    ctx.save();
    ctx.strokeStyle = `rgba(245, 230, 190, ${lineAlpha})`;
    ctx.lineWidth = 1.4;
    for (let k = -2; k <= 2; k++) {
      const lx = casterX + forwardX * 0.5 + k * 10;
      const topY = groundY - 15 - p * 35;
      const botY = groundY - 2;
      ctx.beginPath();
      ctx.moveTo(lx, botY);
      ctx.lineTo(lx, topY);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 3D 포물선 탄도학 바위 파편 (잼잼펀치 3D 혼란 이펙트 물리학 고증)
 * - 360도 전방위 3D 방위각(angle3D)과 앙각(elevation) 기반 구면 분출
 * - 수직 포물선 솟구침 및 중력 낙하 궤적
 * - 카메라 전후 깊이(posZ)에 따른 3D 쿼터뷰 투영 및 원근 스케일 (가까운 파편 확대, 먼 파편 축소)
 * - 깊이 순(Z-Sort) 정렬 렌더링 & 지면 플랫폼 바운스 안착
 */
function render3DParabolicRockShardBurst(
  ctx: any,
  originX: number,
  originY: number,
  progress: number,
  count: number = 8,
  baseSize: number = 3.6,
  seed: number = 0,
  maxGroundY?: number
) {
  const t = Math.max(0, Math.min(1.0, progress));
  if (t <= 0 || t >= 1.0) return;

  // 70% 진행도까지 100% 완전 불투명 유지 후 마지막 30%에서 자연스럽게 페이드아웃
  const alpha = t < 0.70 ? 1.0 : Math.max(0, (1.0 - t) / 0.30);
  if (alpha <= 0.01) return;

  // 파편 개별 탄도학 데이터 생성
  const shards: {
    angle3D: number;
    elevation: number;
    speed: number;
    gravity: number;
    size: number;
    rotSpeed: number;
    rotOffset: number;
  }[] = [];

  for (let i = 0; i < count; i++) {
    // 360도 균등 원형 각도 + 의사 난수 섭동 (둥글게 3D 돔 형태로 퍼져나감)
    const angle3D = (i / count) * Math.PI * 2 + (seed * 0.9) + Math.sin(i * 3.3) * 0.22;
    const elevation = 1.02 + Math.sin(seed * 2.1 + i * 1.9) * 0.24; // 58° ~ 72° 상공 발사
    const speed = 75 + ((i * 19 + seed * 23) % 45); // 75 ~ 120 px/s
    const gravity = 250;
    const size = baseSize * (0.85 + ((i * 13) % 5) * 0.10);
    const rotSpeed = (i % 2 === 0 ? 1 : -1) * (5.5 + (i % 4) * 2.2);
    const rotOffset = i * 1.3 + seed * 1.1;
    shards.push({ angle3D, elevation, speed, gravity, size, rotSpeed, rotOffset });
  }

  // 3D 궤적 계산
  const renderedItems = shards.map((s) => {
    // 3D 수평 확산: 초반 가속 후 공기 저항으로 둥글게 팽창
    const horizEase = Math.sin(t * Math.PI * 0.5);
    const radDist = (s.speed * 0.44) * (0.32 * t + 0.68 * horizEase);
    const posX = radDist * Math.cos(s.angle3D);
    const posZ = radDist * Math.sin(s.angle3D); // +Z: 카메라 앞(전면), -Z: 배경 뒤(후면)

    // 수직 포물선: 솟구침 ➔ 상공 정점 ➔ 중력 낙하
    const vy0 = s.speed * Math.sin(s.elevation);
    const posY = -vy0 * t + 0.5 * s.gravity * t * t;

    // 3D 쿼터뷰 투영 (배틀 필드 원근법: posZ * 0.40)
    const screenX = originX + posX;
    let screenY = originY + posY + posZ * 0.40;

    // 지면 플랫폼 충돌: 바닥 아래 허공으로 떨어지지 않고 지면에 안착
    if (maxGroundY !== undefined && screenY > maxGroundY) {
      screenY = maxGroundY + Math.sin(s.rotOffset) * 1.5;
    }

    // 3D 원근 스케일 (카메라에 가까운 전면 파편은 확대, 먼 후면 파편은 축소)
    const depthScale = Math.max(0.65, Math.min(1.42, 1.0 + (posZ / 65) * 0.32));
    const finalSize = s.size * depthScale;
    const rot = s.rotOffset + s.rotSpeed * t;

    return {
      screenX,
      screenY,
      posZ,
      finalSize,
      rot,
      alpha,
    };
  });

  // 깊이(posZ) 오름차순 정렬: 후방 파편 먼저 렌더링 ➔ 전방 파편 위에 렌더링
  renderedItems.sort((a, b) => a.posZ - b.posZ);

  for (const item of renderedItems) {
    drawRockShard(ctx, item.screenX, item.screenY, item.finalSize, item.rot, item.alpha);
  }
}

interface FallingRockDef {
  id: number;
  ox: number;
  landY: number;
  size: number;
  seed: number;
  rot: number;
  step: number;
  t0: number;
  t1: number;
}

/**
 * 스톤샤워 낙하 바위 군집 데이터 (총 7개 - 지진 톤 3D 각진 바위 순차 낙하)
 * - 앞면 바위 본체(drawRockSlideEffect)와 뒷면 지면 그림자(drawRockSlideBehindEffect)가 공유
 */
function getFallingRocks(groundY: number): FallingRockDef[] {
  return [
    // Step 2 낙하 바위 (1차 선발대 3개)
    { id: 0, ox: -30, landY: groundY - 4, size: 14, seed: 1, rot: 1.2, step: 2, t0: 0.05, t1: 0.55 },
    { id: 1, ox:  22, landY: groundY - 5, size: 17, seed: 2, rot: 2.4, step: 2, t0: 0.28, t1: 0.80 },
    { id: 2, ox: -14, landY: groundY - 6, size: 19, seed: 3, rot: 0.7, step: 2, t0: 0.50, t1: 1.00 },
    // Step 3 낙하 바위 (2차 후발대 3개)
    { id: 3, ox:  32, landY: groundY - 3, size: 15, seed: 4, rot: 3.8, step: 3, t0: 0.05, t1: 0.48 },
    { id: 4, ox:  -6, landY: groundY - 6, size: 18, seed: 5, rot: 2.1, step: 3, t0: 0.25, t1: 0.70 },
    { id: 5, ox: -22, landY: groundY - 2, size: 13, seed: 6, rot: 4.5, step: 3, t0: 0.45, t1: 0.88 },
    // Step 4 낙하 바위 (메인 초대형 주 암반 - 27px)
    { id: 6, ox:   2, landY: groundY - 8, size: 27, seed: 7, rot: 1.5, step: 4, t0: 0.00, t1: 0.40 },
  ];
}

/**
 * 떨어지는 바위의 지면 투영 그림자 렌더링
 * - 대상 포켓몬 발밑 지면 플랫폼(targetPos.y + 36)에 쿼터뷰 납작 타원형으로 투영
 * - 256색 Octree 최적화 규격: 뭉개지는 옅은 그라디언트 대신 외곽 Penumbra + 중심 Umbra 2중 타원으로 선명한 입체감 구현
 * - 바위가 상공에서 떨어져 지면에 가까워질수록 그림자가 점진적으로 급격히 커지고 짙어짐 (원근 투영 고증)
 */
function drawRockShadow(
  ctx: any,
  x: number,
  platformY: number,
  baseSize: number,
  fallProgress: number, // 0.0 (상공 높음) ~ 1.0 (지면 착지)
  alphaMultiplier: number = 1.0
) {
  if (alphaMultiplier <= 0.01 || baseSize <= 0) return;

  const t = Math.max(0, Math.min(1.0, fallProgress));
  // 상공 높을 때 0.28배 -> 지면 착지 시 1.10배 (돌 본체 크기와 자연스럽게 1:1 매칭)
  const scale = 0.28 + 0.82 * Math.pow(t, 1.3);
  const shadowAlpha = (0.28 + 0.48 * t) * alphaMultiplier;
  if (shadowAlpha <= 0.01) return;

  const rx = baseSize * 0.95 * scale;
  const ry = rx * 0.39; // 쿼터뷰 플랫폼 타원 종횡비 (높이/폭)

  ctx.save();

  // 1. 외곽 부드러운 반그림자 림 (Penumbra)
  ctx.fillStyle = `rgba(16, 20, 24, ${(shadowAlpha * 0.42).toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(x, platformY, rx * 1.15, ry * 1.15, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. 중심 짙은 본그림자 핵 (Umbra)
  ctx.fillStyle = `rgba(10, 12, 16, ${(shadowAlpha * 0.85).toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(x, platformY, rx * 0.80, ry * 0.80, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 157: 스톤샤워 (Rock Slide) 메인 이펙트 렌더러
 */
export function drawRockSlideEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0.5
) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const p = effectProgress;
  const targetX = targetPos.x;
  const targetY = targetPos.y;
  // 바닥 영역: 포켓몬 발밑 지면 플랫폼 표면에 정확히 맞닿도록 더 낮춘 최종 착지선
  const groundY = targetPos.y + 34;

  // 스톤샤워 낙하 바위 군집 (총 7개 - 지진 톤 3D 각진 바위 순차 낙하)
  const fallingRocks = getFallingRocks(groundY);

  // =========================================================================
  // Step 1: 시동 & 지면 융기 (지면 균열 및 암석 파편 상공 분출)
  // =========================================================================
  if (moveStep === 1) {
    const isAttackerLeft = attackerPos.x < targetPos.x;
    drawCasterEarthDust(ctx, attackerPos.x, attackerPos.y, isAttackerLeft, p);
  }

  // =========================================================================
  // Step 2: 1차 바위군 순차 급강하 (0호 -> 1호 -> 2호 바위 순차 낙하)
  // =========================================================================
  else if (moveStep === 2) {
    const startY = targetY - 175;

    fallingRocks.filter(r => r.step === 2).forEach((rk) => {
      const rx = targetX + rk.ox;
      if (p < rk.t0) return;

      if (p >= rk.t0 && p < rk.t1) {
        const dropP = (p - rk.t0) / (rk.t1 - rk.t0);
        const curY = Math.min(rk.landY, startY + dropP * (rk.landY - startY));
        const topY = Math.max(0, curY - 50);
        const botY = curY - 6;

        // 중앙선 1개 (돌 두께정도, 끝쪽 투명)
        drawRockSpeedLines(ctx, rx, topY, botY, Math.round(rk.size * 1.15), 0.85);

        drawFacetedRock(ctx, rx, curY, rk.size, rk.rot + dropP * 3.5, rk.seed);
      } else {
        drawFacetedRock(ctx, rx, rk.landY, rk.size, rk.rot + 3.5, rk.seed);

        // 바위 착탄 3D 포물선 파편 전방위 확산
        if (p > rk.t1) {
          const burstProg = Math.min(1.0, (p - rk.t1) / 0.35);
          render3DParabolicRockShardBurst(ctx, rx, rk.landY, burstProg, 7, 3.5, rk.seed, groundY + 4);
        }
      }
    });
  }

  // =========================================================================
  // Step 3: 2차 바위군 순차 급강하 (3호 -> 4호 -> 5호 낙하) & 1차 바위 페이드아웃
  // =========================================================================
  else if (moveStep === 3) {
    const startY = targetY - 175;

    // 1차 바위들 (0, 1, 2호): 2차 바위군이 떨어짐에 따라 점진적 페이드아웃
    const wave1Fade = Math.max(0, 1.0 - p * 1.35);
    if (wave1Fade > 0.01) {
      fallingRocks.filter(r => r.step === 2).forEach((rk) => {
        drawFacetedRock(ctx, targetX + rk.ox, rk.landY, rk.size, rk.rot + 3.5, rk.seed, wave1Fade);
      });
    }

    // 2차 바위들 (3, 4, 5호) 순차 급강하
    fallingRocks.filter(r => r.step === 3).forEach((rk) => {
      const rx = targetX + rk.ox;
      if (p < rk.t0) return;

      if (p >= rk.t0 && p < rk.t1) {
        const dropP = (p - rk.t0) / (rk.t1 - rk.t0);
        const curY = Math.min(rk.landY, startY + dropP * (rk.landY - startY));
        const topY = Math.max(0, curY - 50);
        const botY = curY - 6;

        // 중앙선 1개 (돌 두께정도, 끝쪽 투명)
        drawRockSpeedLines(ctx, rx, topY, botY, Math.round(rk.size * 1.15), 0.85);

        drawFacetedRock(ctx, rx, curY, rk.size, rk.rot + dropP * 3.5, rk.seed);
      } else {
        drawFacetedRock(ctx, rx, rk.landY, rk.size, rk.rot + 3.5, rk.seed);

        // 바위 착탄 3D 포물선 파편 전방위 확산
        if (p > rk.t1) {
          const burstProg = Math.min(1.0, (p - rk.t1) / 0.35);
          render3DParabolicRockShardBurst(ctx, rx, rk.landY, burstProg, 8, 3.6, rk.seed, groundY + 4);
        }
      }
    });

    // 메인 초대형 바위 (6호) 상공 높은 곳에서 서서히 진입 대기
    const mainRock = fallingRocks[6];
    const r6X = targetX + mainRock.ox;
    const r6TopY = targetY - 210 + p * 35;
    drawRockSpeedLines(ctx, r6X, Math.max(0, r6TopY - 45), r6TopY - 6, Math.round(mainRock.size * 1.2), 0.55);
    drawFacetedRock(ctx, r6X, r6TopY, mainRock.size, mainRock.rot + p * 1.5, mainRock.seed);
  }

  // =========================================================================
  // Step 4: 메인 초대형 주 암반 수직 직격(쾅!!) & 2차 바위 페이드아웃 & 파편 비산
  // =========================================================================
  else if (moveStep === 4) {
    const mainRock = fallingRocks[6];
    const r6X = targetX + mainRock.ox;
    const startY = targetY - 175;

    // 2차 바위들 (3, 4, 5호): 메인 대형 바위가 수직 강타함에 따라 점진적 페이드아웃
    const wave2Fade = Math.max(0, 1.0 - p * 1.4);
    if (wave2Fade > 0.01) {
      fallingRocks.filter(r => r.step === 3).forEach((rk) => {
        drawFacetedRock(ctx, targetX + rk.ox, rk.landY, rk.size, rk.rot + 3.5, rk.seed, wave2Fade);
      });
    }

    // 메인 초대형 바위 급강하 후 바닥 격돌
    if (p <= 0.40) {
      const pDrop = p / 0.40;
      const curY = Math.min(mainRock.landY, startY + pDrop * (mainRock.landY - startY));
      const topY = Math.max(0, curY - 60);
      // 중앙선 1개 (돌 두께정도, 끝쪽 투명)
      drawRockSpeedLines(ctx, r6X, topY, curY - 8, Math.round(mainRock.size * 1.25), 0.9);
      drawFacetedRock(ctx, r6X, curY, mainRock.size, mainRock.rot + pDrop * 2.0, mainRock.seed);
    } else {
      // 바닥 직격 후 거대 바위 중심 강타 렌더링
      drawFacetedRock(ctx, r6X, mainRock.landY, mainRock.size, 4.3, mainRock.seed);

      // 메인 바위 쾅!! 착탄 3D 포물선 파편 전방위 대폭쇄 (잼잼펀치 3D 혼란 이펙트 물리학 고증)
      const burstProg = Math.min(1.0, (p - 0.40) / 0.55);
      render3DParabolicRockShardBurst(ctx, r6X, mainRock.landY + 2, burstProg, 16, 4.5, mainRock.seed + 15, groundY + 6);
    }
  }

  // =========================================================================
  // Step 5: 메인 바위 잔해 안착 & 안정화
  // =========================================================================
  else if (moveStep === 5) {
    const settleAlpha = Math.max(0, 1.0 - p * 0.7);
    const mainRock = fallingRocks[6];

    // 메인 바위 및 주변 쪼개진 바위 파편 잔해만 지면에 안착하며 페이드아웃
    drawFacetedRock(ctx, targetX + mainRock.ox, mainRock.landY, mainRock.size * 0.9, 4.3, mainRock.seed, settleAlpha);

    const fragments = [
      { ox: -16, oy: -2, s: 8, r: 0.5 },
      { ox: 18,  oy: -3, s: 7, r: 2.1 },
      { ox: -6,  oy: -4, s: 9, r: 1.2 },
      { ox: 12,  oy: -1, s: 6, r: 3.4 },
    ];
    fragments.forEach((fr) => {
      drawRockShard(ctx, targetX + fr.ox, groundY + fr.oy, fr.s, fr.r, settleAlpha);
    });
  }

  // =========================================================================
  // Step 6: 피날레 복귀
  // =========================================================================
  else if (moveStep >= 6) {
    // 완전 소산
  }

  ctx.restore();
}

/**
 * 157: 스톤샤워 (Rock Slide) 비하인드 이펙트 렌더러
 * - 대상 포켓몬 스프라이트 뒤편(z축 아래) 지면에 떨어지는 바위들의 그림자 렌더링
 * - 상공에서 떨어질 때: 거리가 멀면 작고 옅음 -> 지면에 가까워질수록 크기가 커지고 짙어짐
 */
export function drawRockSlideBehindEffect(
  ctx: any,
  _attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0.5
) {
  if (moveStep < 2 || moveStep > 5) return;

  const p = effectProgress;
  const targetX = targetPos.x;
  const groundY = targetPos.y + 34;
  const fallingRocks = getFallingRocks(groundY);

  // 대상 포켓몬 발밑 지면 플랫폼 정확한 Y 좌표 (그림자 위치는 변경 없이 고정)
  const platformGroundY = targetPos.y + 36;

  ctx.save();

  // =========================================================================
  // Step 2: 1차 바위군 순차 급강하 그림자
  // =========================================================================
  if (moveStep === 2) {
    fallingRocks.filter(r => r.step === 2).forEach((rk) => {
      const rx = targetX + rk.ox;
      const shadowY = platformGroundY + (rk.ox * 0.12);

      if (p < rk.t0) {
        // 낙하 직전 상공 진입 예고 그림자 (아주 작고 옅음)
        const leadIn = Math.max(0, (p - (rk.t0 - 0.15)) / 0.15);
        if (leadIn > 0) {
          drawRockShadow(ctx, rx, shadowY, rk.size, 0.05, leadIn * 0.50);
        }
      } else if (p >= rk.t0 && p < rk.t1) {
        // 낙하 중: 지면에 가까워질수록 그림자가 급격히 커지고 진해짐
        const dropP = (p - rk.t0) / (rk.t1 - rk.t0);
        drawRockShadow(ctx, rx, shadowY, rk.size, dropP, 1.0);
      } else {
        // 착지 완료: 최대 크기 그림자 유지
        drawRockShadow(ctx, rx, shadowY, rk.size, 1.0, 1.0);
      }
    });
  }

  // =========================================================================
  // Step 3: 2차 바위군 급강하 & 1차 바위 그림자 페이드아웃 & 거대 바위 예고 그림자
  // =========================================================================
  else if (moveStep === 3) {
    // 1차 바위들 그림자 페이드아웃
    const wave1Fade = Math.max(0, 1.0 - p * 1.35);
    if (wave1Fade > 0.01) {
      fallingRocks.filter(r => r.step === 2).forEach((rk) => {
        const rx = targetX + rk.ox;
        const shadowY = platformGroundY + (rk.ox * 0.12);
        drawRockShadow(ctx, rx, shadowY, rk.size, 1.0, wave1Fade);
      });
    }

    // 2차 바위들 그림자
    fallingRocks.filter(r => r.step === 3).forEach((rk) => {
      const rx = targetX + rk.ox;
      const shadowY = platformGroundY + (rk.ox * 0.12);

      if (p < rk.t0) {
        const leadIn = Math.max(0, (p - (rk.t0 - 0.15)) / 0.15);
        if (leadIn > 0) {
          drawRockShadow(ctx, rx, shadowY, rk.size, 0.05, leadIn * 0.50);
        }
      } else if (p >= rk.t0 && p < rk.t1) {
        const dropP = (p - rk.t0) / (rk.t1 - rk.t0);
        drawRockShadow(ctx, rx, shadowY, rk.size, dropP, 1.0);
      } else {
        drawRockShadow(ctx, rx, shadowY, rk.size, 1.0, 1.0);
      }
    });

    // 메인 초대형 바위 (6호) 상공 높은 곳에서 진입 중인 예고 그림자
    const mainRock = fallingRocks[6];
    const r6X = targetX + mainRock.ox;
    const r6ShadowY = platformGroundY + (mainRock.ox * 0.12);
    const r6LeadInProg = 0.10 + p * 0.20; // 상공 높은 곳에서 천천히 커지는 그림자
    drawRockShadow(ctx, r6X, r6ShadowY, mainRock.size, r6LeadInProg, 0.45 + p * 0.40);
  }

  // =========================================================================
  // Step 4: 메인 초대형 주 암반 급강하(쾅!!) 그림자 & 2차 바위 그림자 페이드아웃
  // =========================================================================
  else if (moveStep === 4) {
    // 2차 바위들 페이드아웃
    const wave2Fade = Math.max(0, 1.0 - p * 1.4);
    if (wave2Fade > 0.01) {
      fallingRocks.filter(r => r.step === 3).forEach((rk) => {
        const rx = targetX + rk.ox;
        const shadowY = platformGroundY + (rk.ox * 0.12);
        drawRockShadow(ctx, rx, shadowY, rk.size, 1.0, wave2Fade);
      });
    }

    // 메인 초대형 바위 그림자
    const mainRock = fallingRocks[6];
    const r6X = targetX + mainRock.ox;
    const r6ShadowY = platformGroundY + (mainRock.ox * 0.12);

    if (p <= 0.40) {
      const pDrop = p / 0.40;
      // 상공에서 지면으로 고속 낙하: 그림자가 0.30 -> 1.0으로 급격히 확대!
      const fallProgress = 0.30 + pDrop * 0.70;
      drawRockShadow(ctx, r6X, r6ShadowY, mainRock.size, fallProgress, 1.0);
    } else {
      // 착지 강타 후 지면에 묵직하게 깔리는 거대 그림자
      drawRockShadow(ctx, r6X, r6ShadowY, mainRock.size, 1.0, 1.0);
    }
  }

  // =========================================================================
  // Step 5: 메인 바위 잔해 안착 페이드아웃
  // =========================================================================
  else if (moveStep === 5) {
    const settleAlpha = Math.max(0, 1.0 - p * 0.7);
    const mainRock = fallingRocks[6];
    const r6X = targetX + mainRock.ox;
    const r6ShadowY = platformGroundY + (mainRock.ox * 0.12);
    drawRockShadow(ctx, r6X, r6ShadowY, mainRock.size * 0.95, 1.0, settleAlpha);
  }

  ctx.restore();
}

// ============================================================================
// 🦷 158: 필살앞니 (Hyper Fang) - 5세대(BW/B2W2) 완벽 고증
// ============================================================================

/**
 * 5세대 고증 앞니 (Image 1 완벽 1:1 고증)
 * - 원작 형태: 각진 박스/알약 캡슐이 아닌, 매끄럽고 날렵한 3D 타원형(Ellipse) 절치
 * - 후방 외곽 끝단: 완전한 순백색 하이라이트 (#FFFFFF, 후방 약 35% 영역)
 * - 전방 몸체: 슬레이트 그레이 (#64748B ~ #475569, 전방 65% 영역)
 * - 외곽 전체: 또렷한 화이트 하이라이트 림선
 */
function lerpColorRgb(c1: [number, number, number], c2: [number, number, number], t: number): string {
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  return `rgb(${r},${g},${b})`;
}

/**
 * 5세대 원작 고증 단일 치아 렌더러
 * - 후방: 길게 뻗어나가는 백색 꼬리 + 끝단 부드러운 투명 페이드아웃 (외곽선 없음)
 * - 전방: 물어뜯는 그레이 -> 격돌 접근 시 서서히 주황빛(#F97316)으로 고조되는 타원형 헤드 + 동그란 화이트 외곽선(border)
 */
function drawGen5Tooth(
  ctx: any,
  cx: number,
  cy: number,
  angle: number,
  wid: number = 16,
  frontLen: number = 20,
  tailLen: number = 48,
  orangeFactor: number = 0.0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const halfW = wid * 0.5;
  // 꼬리 끝단이 훨씬 얇고 날렵하게 좁아지도록 테이퍼링 (끝단 반경: halfW * 0.2 = 약 1.6px)
  const tailR = Math.max(1.2, halfW * 0.2);

  // 1. 후방 백색 유선형 꼬리 (끝단이 얇게 빠지는 유선형 테이퍼드 테일)
  ctx.beginPath();
  ctx.ellipse(0, 0, frontLen * 0.8, halfW * 0.95, 0, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.lineTo(-tailLen + tailR, tailR);
  ctx.arc(-tailLen + tailR, 0, tailR, Math.PI * 0.5, -Math.PI * 0.5);
  ctx.closePath();

  const tailGrad = ctx.createLinearGradient(-tailLen, 0, 0, 0);
  tailGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
  tailGrad.addColorStop(0.25, "rgba(255, 255, 255, 0.45)");
  tailGrad.addColorStop(0.55, "rgba(255, 255, 255, 0.85)");
  tailGrad.addColorStop(0.85, "#FFFFFF");
  tailGrad.addColorStop(1.0, "#FFFFFF");
  ctx.fillStyle = tailGrad;
  ctx.fill();

  // 2. 전방 회색 -> 가까워질수록 서서히 주황빛(#F97316 / #EA580C)으로 물드는 타원형 헤드
  const headHalfL = frontLen * 0.95;
  const headHalfW = halfW * 0.92;
  const headCx = frontLen * 0.1;

  ctx.beginPath();
  ctx.ellipse(headCx, 0, headHalfL, headHalfW, 0, 0, Math.PI * 2);

  // 기본 슬레이트 그레이 -> 충격 주황빛 에너미 컬러 보간
  const t = Math.max(0, Math.min(1, orangeFactor));
  const col0 = lerpColorRgb([148, 163, 184], [254, 215, 170], t); // 상단 하이라이트 (밝은 회색 -> 살구빛 주황)
  const col1 = lerpColorRgb([100, 116, 139], [249, 115, 22], t);  // 메인 바디 (슬레이트 그레이 -> 선명한 주황)
  const col2 = lerpColorRgb([71, 85, 105], [194, 65, 12], t);     // 하단 음영 (짙은 회색 -> 버트 오렌지)

  const headGrad = ctx.createLinearGradient(headCx - headHalfL, 0, headCx + headHalfL, 0);
  headGrad.addColorStop(0.0, col0);
  headGrad.addColorStop(0.5, col1);
  headGrad.addColorStop(1.0, col2);
  ctx.fillStyle = headGrad;
  ctx.fill();

  // ★ 회색/주황색 타원 헤드에만 화이트 외곽선(border)을 동그랗게 두름
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.restore();
}

/**
 * 5세대 원작 고증 2단 앞니 쌍 (1번 이미지 완벽 고증)
 * - 두 앞니가 뭉쳐서 하나의 알약/반창고가 되지 않도록 18px 간격으로 확실하게 분리
 * - 원작 1번 프레임의 엇갈림(Stagger = 6px) 적용: 좌측 이빨이 살짝 전진, 우측 이빨이 살짝 후진
 */
function drawGen5IncisorPair(
  ctx: any,
  centerX: number,
  centerY: number,
  angle: number,
  sepDist: number = 18,
  wid: number = 16,
  frontLen: number = 20,
  tailLen: number = 48,
  orangeFactor: number = 0.0,
  alpha: number = 1.0
) {
  // 치아 두 개는 진행 축(angle)에 수직인 축으로 분리 배치 (간격을 18px로 좁혀 밀착된 앞니 쌍 구현)
  const sepAngle = angle + Math.PI * 0.5;
  const sx = Math.cos(sepAngle) * sepDist * 0.5;
  const sy = Math.sin(sepAngle) * sepDist * 0.5;

  // 엇갈림 (Stagger): 좌측 이빨과 우측 이빨이 진행 축 방향으로 6px 단차를 둠
  const stagger = 6;
  const ax = Math.cos(angle) * stagger * 0.5;
  const ay = Math.sin(angle) * stagger * 0.5;

  // 좌측 1번 앞니
  drawGen5Tooth(ctx, centerX - sx + ax, centerY - sy + ay, angle, wid, frontLen, tailLen, orangeFactor, alpha);
  // 우측 2번 앞니
  drawGen5Tooth(ctx, centerX + sx - ax, centerY + sy - ay, angle, wid, frontLen, tailLen, orangeFactor, alpha);
}

/**
 * 교합 쇄도 시 뒤따르는 백색 스피드 트레일 선 (Image 2 고증 - 4개 이빨 각각의 트레일)
 */
function drawGen5SnapTrails(
  ctx: any,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  angle: number,
  sepDist: number = 18,
  alpha: number = 0.85
) {
  if (alpha <= 0.01) return;
  const sepAngle = angle + Math.PI * 0.5;
  const sx = Math.cos(sepAngle) * sepDist * 0.5;
  const sy = Math.sin(sepAngle) * sepDist * 0.5;
  const stagger = 6;
  const ax = Math.cos(angle) * stagger * 0.5;
  const ay = Math.sin(angle) * stagger * 0.5;

  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const offsets = [
    { x: -sx + ax, y: -sy + ay },
    { x:  sx - ax, y:  sy - ay },
  ];

  for (const off of offsets) {
    const startX = fromX + off.x;
    const startY = fromY + off.y;
    const endX = toX + off.x;
    const endY = toY + off.y;

    const grad = ctx.createLinearGradient(startX, startY, endX, endY);
    grad.addColorStop(0, "rgba(255, 255, 255, 0)");
    grad.addColorStop(0.35, "rgba(255, 255, 255, 0.45)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0.95)");

    ctx.strokeStyle = grad;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 5세대 특유의 빨간 테두리 만화풍 충격 폭발 구름 (Image 2 고증)
 * - 두 쌍의 앞니가 격돌하는 순간 우상단 & 좌하단으로 솟구치는 뭉게구름 이펙트
 * - 굵은 적색 테두리 (#DC2626) + 연노랑/크림색 면 (#FEF08A)
 */
function drawGen5ComicImpactPuff(
  ctx: any,
  cx: number,
  cy: number,
  scale: number = 1.0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || scale <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const circles = [
    { x: -14, y: 0, r: 12 },
    { x: -5,  y: -10, r: 14 },
    { x: 10,  y: -8, r: 13 },
    { x: 14,  y: 6,  r: 12 },
    { x: 2,   y: 11, r: 13 },
    { x: -10, y: 8,  r: 11 },
    { x: 0,   y: 0,  r: 15 },
  ];

  // 1. 강력한 외각 글로우 (Strong Outer Red Glow): 고광도 섀도우 블러 + 2단 외곽 발광 아우라
  ctx.save();
  ctx.shadowColor = "rgba(255, 40, 40, 0.95)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "rgba(239, 68, 68, 0.35)";
  for (const c of circles) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r + 8.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(220, 38, 38, 0.75)";
  for (const c of circles) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r + 6.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 2. 메인 두꺼운 레드 테두리 (Solid Crimson Red Border)
  ctx.fillStyle = "#DC2626";
  for (const c of circles) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r + 5.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. 강력한 내각 그라데이션 / 글로우 (Rich Inner Glow Transition: Red -> Fiery Orange -> Bright Amber)
  ctx.fillStyle = "#EA580C";
  for (const c of circles) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r + 3.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#F97316";
  for (const c of circles) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r + 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#FBBF24";
  for (const c of circles) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r + 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. 내부 연노랑 크림 채우기 (하이라이트 없이 균일)
  ctx.fillStyle = "#FEF08A";
  for (const c of circles) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 빨간 테두리의 노란 원형 알갱이 비산 파티클 (Image 3, 4 고증)
 * - 상하 교합 축에 수직인 방향(우상단 & 좌하단)으로 시원하게 뿜어져 나가는 탄환형 알갱이들
 */
const GEN5_HYPER_FANG_PARTICLES = [
  // 우상단 스트림 (각도: -45° ~ -78°)
  { angle: -0.92, speed: 70, r: 4.8 },
  { angle: -1.15, speed: 85, r: 5.2 },
  { angle: -1.30, speed: 98, r: 4.5 },
  { angle: -0.76, speed: 62, r: 4.0 },
  { angle: -1.05, speed: 112, r: 5.5 },
  { angle: -1.40, speed: 78, r: 3.8 },
  { angle: -0.86, speed: 94, r: 4.6 },

  // 좌하단 스트림 (각도: 102° ~ 138°)
  { angle: 2.18, speed: 68, r: 4.8 },
  { angle: 2.38, speed: 82, r: 5.2 },
  { angle: 2.00, speed: 96, r: 4.5 },
  { angle: 2.50, speed: 64, r: 4.0 },
  { angle: 2.25, speed: 110, r: 5.4 },
  { angle: 1.85, speed: 74, r: 3.8 },
  { angle: 2.45, speed: 90, r: 4.6 },
];

function drawGen5RedRingParticles(
  ctx: any,
  originX: number,
  originY: number,
  progress: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || progress <= 0) return;
  const t = Math.min(1.0, Math.max(0, progress));

  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  for (const p of GEN5_HYPER_FANG_PARTICLES) {
    const dist = t * p.speed;
    const px = originX + Math.cos(p.angle) * dist;
    const py = originY + Math.sin(p.angle) * dist;

    // 요구사항: 알갱이가 퍼져나가면서 크기가 확연하게 작아지도록 축소 비율 적용
    const shrink = Math.max(0.08, 1.0 - Math.pow(t, 0.75) * 0.85);
    const curR = p.r * shrink;

    // 외각 글로우 및 테두리도 입자 크기에 맞춰 비례 축소
    const glowR1 = curR + 3.6 * shrink;
    const glowR2 = curR + 2.8 * shrink;
    const borderR = curR + 2.0 * shrink;
    const innerR1 = curR + 1.2 * shrink;
    const innerR2 = curR + 0.6 * shrink;
    const curBlur = Math.max(1, Math.round(8 * shrink));

    // 1. 외각 글로우 (Outer Red Glow): 섀도우 블러 + 외곽 은은한 아우라
    ctx.save();
    ctx.shadowColor = "rgba(255, 40, 40, 0.95)";
    ctx.shadowBlur = curBlur;
    ctx.fillStyle = "rgba(239, 68, 68, 0.35)";
    ctx.beginPath();
    ctx.arc(px, py, glowR1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(220, 38, 38, 0.75)";
    ctx.beginPath();
    ctx.arc(px, py, glowR2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. 메인 두꺼운 레드 테두리 (Solid Crimson Red Border)
    ctx.fillStyle = "#DC2626";
    ctx.beginPath();
    ctx.arc(px, py, borderR, 0, Math.PI * 2);
    ctx.fill();

    // 3. 내각 그라데이션 / 글로우 (Inner Warm Glow Transition: Red -> Orange -> Amber)
    ctx.fillStyle = "#EA580C";
    ctx.beginPath();
    ctx.arc(px, py, innerR1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#FBBF24";
    ctx.beginPath();
    ctx.arc(px, py, innerR2, 0, Math.PI * 2);
    ctx.fill();

    // 4. 연노랑 내부 코어 (요구사항: 화이트 하이라이트 원 제거)
    ctx.fillStyle = "#FEF08A";
    ctx.beginPath();
    ctx.arc(px, py, curR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 타격 중심부에 맴도는 부드러운 베이지/크림색 잔여 연막 구름 (Image 3, 4, 5 고증)
 */
function drawGen5SmokePuffs(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  const t = Math.min(1.0, Math.max(0, progress));

  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const puffs = [
    { ox: -10, oy: -12, baseR: 14, grow: 10 },
    { ox: 12,  oy: -6,  baseR: 16, grow: 12 },
    { ox: -4,  oy: 8,   baseR: 15, grow: 11 },
    { ox: 8,   oy: 12,  baseR: 13, grow: 9 },
    { ox: -14, oy: 2,   baseR: 12, grow: 8 },
  ];

  for (const puff of puffs) {
    const px = cx + puff.ox * (1 + t * 0.25);
    const py = cy + puff.oy * (1 + t * 0.25);
    const r = puff.baseR + t * puff.grow;

    // 외각 투명 그라데이션 (부드러운 구름형 페더링)
    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    grad.addColorStop(0.0, "rgba(255, 251, 235, 0.88)");
    grad.addColorStop(0.35, "rgba(254, 243, 199, 0.72)");
    grad.addColorStop(0.70, "rgba(253, 230, 138, 0.32)");
    grad.addColorStop(1.0, "rgba(254, 243, 199, 0.0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 158: 필살앞니 (Hyper Fang) 메인 이펙트 렌더러
 * - 5세대 원작 5개 프레임 완벽 재현
 */
export function drawHyperFangEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0.5,
  isHit: boolean = true
) {
  ctx.save();
  const tx = targetPos.x;
  const ty = targetPos.y;
  const p = effectProgress;

  // 대각선 교합 축: 약 47도 (0.82 rad) - 원작 1번 프레임 실측 각도(47°) 완벽 일치
  const angle = 0.82;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  // =========================================================================
  // Step 1: 좌상단 2개 + 우하단 2개 거대 앞니 대각선 대치 (Image 1 고증)
  // =========================================================================
  if (moveStep === 1) {
    const dist = 56 - p * 8; // 56px -> 48px 대기
    const alpha = Math.min(1.0, p * 2.5);

    // 좌상단 앞니 쌍 (47도 기울기, sepDist: 18px, wid: 16px, frontLen: 20px, tailLen: 48px, 초기 순수 회색)
    const ulX = tx - cosA * dist;
    const ulY = ty - sinA * dist;
    drawGen5IncisorPair(ctx, ulX, ulY, angle, 18, 16, 20, 48, 0.0, alpha);

    // 우하단 앞니 쌍 (47도 기울기, sepDist: 18px, wid: 16px, frontLen: 20px, tailLen: 48px, 초기 순수 회색)
    const brX = tx + cosA * dist;
    const brY = ty + sinA * dist;
    drawGen5IncisorPair(ctx, brX, brY, angle + Math.PI, 18, 16, 20, 48, 0.0, alpha);
  }

  // =========================================================================
  // Step 2: 대각선 초고속 교합 쇄도 & 격돌 만화풍 폭발 구름 (Image 2 고증)
  // =========================================================================
  else if (moveStep === 2) {
    const dist = Math.max(0, 48 * (1.0 - p));

    const startDist = 54;
    const ulStartX = tx - cosA * startDist;
    const ulStartY = ty - sinA * startDist;
    const ulCurX = tx - cosA * dist;
    const ulCurY = ty - sinA * dist;

    const brStartX = tx + cosA * startDist;
    const brStartY = ty + sinA * startDist;
    const brCurX = tx + cosA * dist;
    const brCurY = ty + sinA * dist;

    // 백색 스피드 트레일 (4개 이빨 각각의 독립 궤적)
    drawGen5SnapTrails(ctx, ulStartX, ulStartY, ulCurX, ulCurY, angle, 18, 0.9);
    drawGen5SnapTrails(ctx, brStartX, brStartY, brCurX, brCurY, angle, 18, 0.9);

    // 앞니 쌍 (가까워질수록 서서히 주황빛으로 달아오름: orangeFactor 0.0 -> 1.0)
    const rushTailLen = 48 + p * 14;
    const orangeFactor = Math.min(1.0, p * 1.25);
    drawGen5IncisorPair(ctx, ulCurX, ulCurY, angle, 18, 16, 20, rushTailLen, orangeFactor, 1.0);
    drawGen5IncisorPair(ctx, brCurX, brCurY, angle + Math.PI, 18, 16, 20, rushTailLen, orangeFactor, 1.0);

    // 격돌 순간 (p > 0.45): 적색 테두리 만화풍 충격 폭발 구름 작렬 (우상단 & 좌하단)
    if (p > 0.45) {
      const puffProg = (p - 0.45) / 0.55;
      const puffScale = 0.5 + puffProg * 0.75;
      const puffAlpha = 1.0;

      // 교합 축(47°)의 수직 방향으로 폭발 구름 전개
      drawGen5ComicImpactPuff(ctx, tx + 22, ty - 20, puffScale, puffAlpha);
      drawGen5ComicImpactPuff(ctx, tx - 22, ty + 20, puffScale, puffAlpha);
    }
  }

  // =========================================================================
  // Step 3: 완전 교합 & 빨간 테두리 알갱이 분출 & 연막 구름 생성 (Image 3 고증)
  // =========================================================================
  else if (moveStep === 3) {
    // 맞물린 앞니 (중심, 완전한 주황빛 격돌 상태)
    const teethAlpha = Math.max(0, 1.0 - p * 0.6);
    drawGen5IncisorPair(ctx, tx - cosA * 2, ty - sinA * 2, angle, 18, 16, 20, 48, 1.0, teethAlpha);
    drawGen5IncisorPair(ctx, tx + cosA * 2, ty + sinA * 2, angle + Math.PI, 18, 16, 20, 48, 1.0, teethAlpha);

    // 격돌 순간 만화풍 충격 폭발 구름 (Image 2 교합 순간 동시 작렬)
    if (p <= 0.5) {
      const puffScale = 1.15;
      const puffAlpha = 1.0;
      drawGen5ComicImpactPuff(ctx, tx + 22, ty - 20, puffScale, puffAlpha);
      drawGen5ComicImpactPuff(ctx, tx - 22, ty + 20, puffScale, puffAlpha);
    }

    // 연막 구름 형성 (progress: 0.0 -> 0.3)
    drawGen5SmokePuffs(ctx, tx, ty, p * 0.3, 0.85);

    // 빨간 테두리 노란 알갱이 비산 시작 (progress: 0.1 -> 0.45)
    if (isHit) {
      drawGen5RedRingParticles(ctx, tx, ty, 0.1 + p * 0.35, 1.0);
    }
  }

  // =========================================================================
  // Step 4: 이빨 소멸 & 알갱이 원거리 확산 & 연막 팽창 (Image 4 고증)
  // =========================================================================
  else if (moveStep === 4) {
    // 연막 구름 팽창 및 지속
    drawGen5SmokePuffs(ctx, tx, ty, 0.3 + p * 0.4, 0.75);

    // 빨간 테두리 알갱이 원거리 확산 (progress: 0.45 -> 0.85)
    if (isHit) {
      drawGen5RedRingParticles(ctx, tx, ty, 0.45 + p * 0.4, 1.0);
    }
  }

  // =========================================================================
  // Step 5: 알갱이 및 연막 구름 페이드아웃 (Image 5 고증)
  // =========================================================================
  else if (moveStep === 5) {
    const fade = Math.max(0, 1.0 - p * 1.3);

    // 연막 서서히 페이드아웃
    drawGen5SmokePuffs(ctx, tx, ty, 0.7 + p * 0.3, fade * 0.65);

    // 알갱이 끝자락 페이드아웃
    if (isHit && fade > 0.01) {
      drawGen5RedRingParticles(ctx, tx, ty, 0.85 + p * 0.15, fade);
    }
  }

  // =========================================================================
  // Step 6: 피날레 복귀
  // =========================================================================
  else if (moveStep >= 6) {
    // 완전 소산
  }

  ctx.restore();
}

// ============================================================================
// 💎 159: 각지기 (Sharpen)
// ============================================================================

/**
 * 3D 기하학 사각 큐브(정육면체) 버텍스 정의 (8개 정점, 12개 엣지, 6개 사각형 면)
 */
const SHARPEN_CUBE_VERTS: readonly [number, number, number][] = [
  [-1.0, -1.0, -1.0], // 0: 상단 후좌
  [ 1.0, -1.0, -1.0], // 1: 상단 후우
  [ 1.0, -1.0,  1.0], // 2: 상단 전우
  [-1.0, -1.0,  1.0], // 3: 상단 전좌
  [-1.0,  1.0, -1.0], // 4: 하단 후좌
  [ 1.0,  1.0, -1.0], // 5: 하단 후우
  [ 1.0,  1.0,  1.0], // 6: 하단 전우
  [-1.0,  1.0,  1.0], // 7: 하단 전좌
];

const SHARPEN_CUBE_EDGES: readonly [number, number][] = [
  // 상단 사각형
  [0, 1], [1, 2], [2, 3], [3, 0],
  // 하단 사각형
  [4, 5], [5, 6], [6, 7], [7, 4],
  // 4개 수직 모서리 기둥
  [0, 4], [1, 5], [2, 6], [3, 7],
];

const SHARPEN_CUBE_FACES: readonly [number, number, number, number][] = [
  [0, 1, 2, 3], // 상단 사각면 (Top, outward normal: -Y)
  [7, 6, 5, 4], // 하단 사각면 (Bottom, outward normal: +Y)
  [3, 2, 6, 7], // 전면 사각면 (Front, outward normal: +Z)
  [1, 0, 4, 5], // 후면 사각면 (Back, outward normal: -Z)
  [0, 3, 7, 4], // 좌측 사각면 (Left, outward normal: -X)
  [2, 1, 5, 6], // 우측 사각면 (Right, outward normal: +X)
];

/**
 * 날카로운 4방향 다이아몬드 별빛 글린트 (Tink! Star Glint)
 */
function drawSharpenSparkle(
  ctx: any,
  x: number,
  y: number,
  size: number,
  alpha: number
) {
  if (alpha <= 0.01 || size <= 1) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const ray = size * 1.0;
  const thin = size * 0.18;

  // 가로 & 세로 다이아몬드 십자 광선
  ctx.fillStyle = "#00E5FF";
  ctx.beginPath();
  ctx.moveTo(x - ray, y);
  ctx.lineTo(x, y - thin);
  ctx.lineTo(x + ray, y);
  ctx.lineTo(x, y + thin);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x, y - ray);
  ctx.lineTo(x + thin, y);
  ctx.lineTo(x, y + ray);
  ctx.lineTo(x - thin, y);
  ctx.closePath();
  ctx.fill();

  // 대각선 보조 광선
  const diagRay = ray * 0.55;
  const diagThin = thin * 0.75;
  ctx.beginPath();
  ctx.moveTo(x - diagRay, y - diagRay);
  ctx.lineTo(x + diagThin, y - diagThin);
  ctx.lineTo(x + diagRay, y + diagRay);
  ctx.lineTo(x - diagThin, y + diagThin);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + diagRay, y - diagRay);
  ctx.lineTo(x + diagThin, y + diagThin);
  ctx.lineTo(x - diagRay, y + diagRay);
  ctx.lineTo(x - diagThin, y - diagThin);
  ctx.closePath();
  ctx.fill();

  // 중심 순백 코어
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(x, y, Math.max(1.5, size * 0.22), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 159: 각지기 (Sharpen) 애니메이션 렌더러
 * - [유저 피드백 100% 반영]: 3D 정육각형 큐브 형태 유지 및 사각 펄스/상승 화살표/X자 슬라이스 완전 제거
 *   1단계: 시전자 웅크림 및 몸체 주변 3D 회전 사각 큐브 와이어프레임 & 반투명 패싯 수축 전개
 *   2단계: 모서리 각화! 8개 코너에서 십자 글린트(칭!) 폭발
 *   3단계: 각화 완료! 공격력 랭크업 스탯 부스트 구체 오라 승화
 *   4단계: 사각 큐브 격자 승화 소산 및 탄성 복귀
 */
export function drawSharpenEffect(
  ctx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  let step = 1;
  let p = 0.5;
  let ax = 200;
  let ay = 250;
  let isP = true;

  if (attackerPosOrFrame && typeof attackerPosOrFrame.x === "number") {
    ax = attackerPosOrFrame.x;
    ay = attackerPosOrFrame.y;
    step = moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, progress ?? 0.5));
    isP = Boolean(isPlayer);
  } else {
    const frame = attackerPosOrFrame || {};
    const drawCtx = targetPosOrDrawCtx || {};
    isP = Boolean(drawCtx.isPlayer);
    const cPos = drawCtx.casterPos || drawCtx.attackerPos || { x: 200, y: 250 };
    ax = cPos.x;
    ay = cPos.y;
    step = frame.moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, frame.effectProgress ?? 0.5));
  }

  const baseRadius = isP ? 48 : 38;
  const centerY = ay - (isP ? 10 : 8);

  ctx.save();

  // =========================================================================
  // Step 1: 3D 사각 큐브(정육면체) 와이어프레임 & 반투명 사각면 회전하며 수축 전개
  // =========================================================================
  if (step === 1) {
    const rotY = p * 1.30; // 프레임당 25°~30° 등속 회전 (왜건휠 역회전 착시 완전 방지)
    const pitch = -0.48; // 상공에서 내려다보는 3/4 아이소메트릭 쿼터뷰 피치
    const r = baseRadius * (1.50 - p * 0.45); // 1.50 -> 1.05 회전하며 점진 수축
    const alpha = Math.min(1.0, p * 1.3);

    // 3D 사각 큐브 버텍스 투영
    const proj: [number, number, number][] = SHARPEN_CUBE_VERTS.map(([vx, vy, vz]) => {
      const x1 = vx * Math.cos(rotY) + vz * Math.sin(rotY);
      const y1 = vy;
      const z1 = -vx * Math.sin(rotY) + vz * Math.cos(rotY);
      const x2 = x1;
      const y2 = y1 * Math.cos(pitch) - z1 * Math.sin(pitch);
      const z2 = y1 * Math.sin(pitch) + z1 * Math.cos(pitch);
      return [ax + x2 * r, centerY + y2 * r, z2 * r];
    });

    // 1. 입체적 사각 패싯 & 전면 가시 엣지 수집
    const visibleEdgeSet = new Set<string>();
    for (let fIdx = 0; fIdx < SHARPEN_CUBE_FACES.length; fIdx++) {
      const [i0, i1, i2, i3] = SHARPEN_CUBE_FACES[fIdx];
      const p0 = proj[i0], p1 = proj[i1], p2 = proj[i2], p3 = proj[i3];

      // 화면 카메라 공간 외측 법선 벡터 (Outward normal in screen camera space)
      const ax1 = p1[0] - p0[0], ay1 = p1[1] - p0[1], az1 = p1[2] - p0[2];
      const bx1 = p3[0] - p0[0], by1 = p3[1] - p0[1], bz1 = p3[2] - p0[2];
      const nx = ay1 * bz1 - az1 * by1;
      const ny = az1 * bx1 - ax1 * bz1;
      const nz = ax1 * by1 - ay1 * bx1;

      // 카메라를 향하는 면만 렌더링 (Backface culling: nz > 0.001)
      if (nz > 0.001) {
        const len = Math.hypot(nx, ny, nz);
        const uny = ny / len;

        const cx = (p0[0] + p1[0] + p2[0] + p3[0]) / 4;
        let faceColor = "";
        if (uny < -0.45) {
          faceColor = `rgba(255, 255, 255, ${0.30 * alpha})`; // 상단면: 밝은 하이라이트
        } else if (cx > ax + 0.5) {
          faceColor = `rgba(15, 23, 42, ${0.60 * alpha})`;     // 우측하단면: 확실하게 어두운 그림자 면
        } else {
          faceColor = `rgba(220, 235, 255, ${0.20 * alpha})`; // 좌측하단면: 밝은 면
        }
        ctx.fillStyle = faceColor;
        ctx.beginPath();
        ctx.moveTo(p0[0], p0[1]);
        ctx.lineTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.lineTo(p3[0], p3[1]);
        ctx.closePath();
        ctx.fill();

        visibleEdgeSet.add(`${Math.min(i0, i1)}_${Math.max(i0, i1)}`);
        visibleEdgeSet.add(`${Math.min(i1, i2)}_${Math.max(i1, i2)}`);
        visibleEdgeSet.add(`${Math.min(i2, i3)}_${Math.max(i2, i3)}`);
        visibleEdgeSet.add(`${Math.min(i3, i0)}_${Math.max(i3, i0)}`);
      }
    }

    // 2. 사각 큐브 순백 와이어프레임 엣지 (착시 방지: 뒷면 반대방향 선 제거, 전면 엣지만 그려 단방향 회전감 확립)
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.95 * alpha})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (const [i0, i1] of SHARPEN_CUBE_EDGES) {
      const key = `${Math.min(i0, i1)}_${Math.max(i0, i1)}`;
      if (visibleEdgeSet.has(key)) {
        ctx.moveTo(proj[i0][0], proj[i0][1]);
        ctx.lineTo(proj[i1][0], proj[i1][1]);
      }
    }
    ctx.stroke();
  }

  // =========================================================================
  // Step 2: 예리한 모서리 각화 & 회전하며 몸체로 더 작게 압축 수축
  // =========================================================================
  else if (step === 2) {
    const rotY = 1.30 + p * 1.75; // 등속 25°~30° 전진 회전 유지
    const pitch = -0.48;
    const r = baseRadius * (1.05 - p * 0.45); // 1.05 -> 0.60 더욱 작게 압축 수축
    const alpha = Math.max(0.3, 1.0 - p * 0.2);

    const proj: [number, number, number][] = SHARPEN_CUBE_VERTS.map(([vx, vy, vz]) => {
      const x1 = vx * Math.cos(rotY) + vz * Math.sin(rotY);
      const y1 = vy;
      const z1 = -vx * Math.sin(rotY) + vz * Math.cos(rotY);
      const x2 = x1;
      const y2 = y1 * Math.cos(pitch) - z1 * Math.sin(pitch);
      const z2 = y1 * Math.sin(pitch) + z1 * Math.cos(pitch);
      return [ax + x2 * r, centerY + y2 * r, z2 * r];
    });

    // 1. 입체적 사각 패싯
    const visibleEdgeSet2 = new Set<string>();
    for (let fIdx = 0; fIdx < SHARPEN_CUBE_FACES.length; fIdx++) {
      const [i0, i1, i2, i3] = SHARPEN_CUBE_FACES[fIdx];
      const p0 = proj[i0], p1 = proj[i1], p2 = proj[i2], p3 = proj[i3];

      const ax1 = p1[0] - p0[0], ay1 = p1[1] - p0[1], az1 = p1[2] - p0[2];
      const bx1 = p3[0] - p0[0], by1 = p3[1] - p0[1], bz1 = p3[2] - p0[2];
      const nx = ay1 * bz1 - az1 * by1;
      const ny = az1 * bx1 - ax1 * bz1;
      const nz = ax1 * by1 - ay1 * bx1;

      if (nz > 0.001) {
        const len = Math.hypot(nx, ny, nz);
        const uny = ny / len;
        const cx = (p0[0] + p1[0] + p2[0] + p3[0]) / 4;

        let faceColor = "";
        if (uny < -0.45) {
          faceColor = `rgba(255, 255, 255, ${0.35 * alpha})`; // 상단면: 밝은 하이라이트
        } else if (cx > ax + 0.5) {
          faceColor = `rgba(15, 23, 42, ${0.62 * alpha})`;     // 우측하단면: 확실하게 어두운 그림자 면
        } else {
          faceColor = `rgba(220, 235, 255, ${0.22 * alpha})`; // 좌측하단면: 밝은 면
        }
        ctx.fillStyle = faceColor;
        ctx.beginPath();
        ctx.moveTo(p0[0], p0[1]);
        ctx.lineTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.lineTo(p3[0], p3[1]);
        ctx.closePath();
        ctx.fill();

        visibleEdgeSet2.add(`${Math.min(i0, i1)}_${Math.max(i0, i1)}`);
        visibleEdgeSet2.add(`${Math.min(i1, i2)}_${Math.max(i1, i2)}`);
        visibleEdgeSet2.add(`${Math.min(i2, i3)}_${Math.max(i2, i3)}`);
        visibleEdgeSet2.add(`${Math.min(i3, i0)}_${Math.max(i3, i0)}`);
      }
    }

    // 2. 눈부신 순백 사각 큐브 와이어프레임 엣지 (착시 방지: 전면 엣지만 렌더링)
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.95 * alpha})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (const [i0, i1] of SHARPEN_CUBE_EDGES) {
      const key = `${Math.min(i0, i1)}_${Math.max(i0, i1)}`;
      if (visibleEdgeSet2.has(key)) {
        ctx.moveTo(proj[i0][0], proj[i0][1]);
        ctx.lineTo(proj[i1][0], proj[i1][1]);
      }
    }
    ctx.stroke();
  }

  // =========================================================================
  // Step 3: 각화 완료! 초소형으로 수축하며 소산 & 공격력 랭크업 스탯 부스트 오라
  // =========================================================================
  else if (step === 3) {
    const rotY = 3.05 + p * 1.75; // 프레임 #10->#11 정확히 +30° 순방향 회전 유지 (역회전 0%)
    const pitch = -0.48;
    const r = Math.max(8, baseRadius * (0.60 - p * 0.35)); // 0.60 -> 0.25 초소형으로 수축
    const fade = Math.max(0, 1.0 - p * 0.85);

    // 잔여 사각 큐브 와이어프레임 & 면 초소형 수축 소산
    const proj: [number, number, number][] = SHARPEN_CUBE_VERTS.map(([vx, vy, vz]) => {
      const x1 = vx * Math.cos(rotY) + vz * Math.sin(rotY);
      const y1 = vy;
      const z1 = -vx * Math.sin(rotY) + vz * Math.cos(rotY);
      const x2 = x1;
      const y2 = y1 * Math.cos(pitch) - z1 * Math.sin(pitch);
      const z2 = y1 * Math.sin(pitch) + z1 * Math.cos(pitch);
      return [ax + x2 * r, centerY + y2 * r, z2 * r];
    });

    if (fade > 0.01) {
      const visibleEdgeSet3 = new Set<string>();
      for (let fIdx = 0; fIdx < SHARPEN_CUBE_FACES.length; fIdx++) {
        const [i0, i1, i2, i3] = SHARPEN_CUBE_FACES[fIdx];
        const p0 = proj[i0], p1 = proj[i1], p2 = proj[i2], p3 = proj[i3];

        const ax1 = p1[0] - p0[0], ay1 = p1[1] - p0[1], az1 = p1[2] - p0[2];
        const bx1 = p3[0] - p0[0], by1 = p3[1] - p0[1], bz1 = p3[2] - p0[2];
        const nx = ay1 * bz1 - az1 * by1;
        const ny = az1 * bx1 - ax1 * bz1;
        const nz = ax1 * by1 - ay1 * bx1;

        if (nz > 0.001) {
          const len = Math.hypot(nx, ny, nz);
          const uny = ny / len;
          const cx = (p0[0] + p1[0] + p2[0] + p3[0]) / 4;

          let faceColor = "";
          if (uny < -0.45) {
            faceColor = `rgba(255, 255, 255, ${0.30 * fade})`;
          } else if (cx > ax + 0.5) {
            faceColor = `rgba(15, 23, 42, ${0.60 * fade})`;
          } else {
            faceColor = `rgba(220, 235, 255, ${0.20 * fade})`;
          }
          ctx.fillStyle = faceColor;
          ctx.beginPath();
          ctx.moveTo(p0[0], p0[1]);
          ctx.lineTo(p1[0], p1[1]);
          ctx.lineTo(p2[0], p2[1]);
          ctx.lineTo(p3[0], p3[1]);
          ctx.closePath();
          ctx.fill();

          visibleEdgeSet3.add(`${Math.min(i0, i1)}_${Math.max(i0, i1)}`);
          visibleEdgeSet3.add(`${Math.min(i1, i2)}_${Math.max(i1, i2)}`);
          visibleEdgeSet3.add(`${Math.min(i2, i3)}_${Math.max(i2, i3)}`);
          visibleEdgeSet3.add(`${Math.min(i3, i0)}_${Math.max(i3, i0)}`);
        }
      }

      ctx.strokeStyle = `rgba(255, 255, 255, ${0.85 * fade})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (const [i0, i1] of SHARPEN_CUBE_EDGES) {
        const key = `${Math.min(i0, i1)}_${Math.max(i0, i1)}`;
        if (visibleEdgeSet3.has(key)) {
          ctx.moveTo(proj[i0][0], proj[i0][1]);
          ctx.lineTo(proj[i1][0], proj[i1][1]);
        }
      }
      ctx.stroke();
    }

    // 공용 스탯 상승(공격력) 구체 오라
    drawStatBoostEffect(ctx, { x: ax, y: centerY + 28 }, p);
  }

  // =========================================================================
  // Step 4: 안정화 및 소산
  // =========================================================================
  else if (step === 4) {
    const fade = Math.max(0, 1.0 - p * 1.25);
    if (fade > 0.01) {
      drawStatBoostEffect(ctx, { x: ax, y: centerY + 28 }, 0.7 + p * 0.3);
    }
  }

  ctx.restore();
}

// ============================================================================
// 💾 160: 텍스처 (Conversion)
// ============================================================================

// 서로 다른 크기와 위치를 가진 흰색 사각형 데이터 (총 5개로 정돈)
// 우측상단 (큰 x, 작은 y) ~ 좌측하단 (작은 x, 큰 y) 분포
interface ConversionSquare {
  relX: number;     // 시전자 중심 대비 최종 X
  relY: number;     // 시전자 중심 대비 최종 Y
  size: number;     // 사각형 크기 (서로 다른 크기)
  riseSpeed: number;  // 상승 가속도 비율
  tintType: "yellow" | "blue" | "red"; // 미세한 틴트 종류
}

const CONVERSION_SQUARES: ConversionSquare[] = [
  // 포켓몬 몸체 주위 상·하·좌·우 골고루 자연 분산 (대각선 일직선 쏠림 완전 해소)
  { relX:  28, relY: -32, size: 20, riseSpeed: 1.10, tintType: "yellow" }, // 우상단
  { relX: -24, relY: -26, size: 24, riseSpeed: 1.05, tintType: "blue" },   // 좌상단
  { relX:  -4, relY:  -8, size: 26, riseSpeed: 1.00, tintType: "red" },    // 중앙
  { relX:  32, relY:  10, size: 16, riseSpeed: 1.15, tintType: "yellow" }, // 우하단
  { relX:   8, relY:  26, size: 14, riseSpeed: 1.20, tintType: "blue" },   // 하단 중앙
  { relX: -28, relY:  22, size: 18, riseSpeed: 0.95, tintType: "red" },    // 좌하단
];

// 우측상단(Top-Right: 큰 x, 작은 y) -> 좌측하단(Bottom-Left: 작은 x, 큰 y) 우선순위 계산
// score = relX - relY (클수록 우측상단, 작을수록 좌측하단)
const SORTED_SQUARE_INDICES = CONVERSION_SQUARES.map((sq, i) => ({
  idx: i,
  score: sq.relX - sq.relY,
}))
  .sort((a, b) => b.score - a.score)
  .map(item => item.idx);

// 인덱스별 축소 시작 순번 (0.0 ~ 1.0 정규화된 지연치)
const SHRINK_DELAYS = new Float32Array(CONVERSION_SQUARES.length);
SORTED_SQUARE_INDICES.forEach((sqIdx, order) => {
  SHRINK_DELAYS[sqIdx] = order / (CONVERSION_SQUARES.length - 1); // 0.0(최우측상단) ~ 1.0(최좌측하단)
});

/**
 * 미세한 틴트 색상 계산 (여전히 흰색에 가깝지만 살짝 노랑/파랑/빨강)
 */
function getSubtleTintColor(tintType: "yellow" | "blue" | "red", t: number, alpha: number): string {
  // t: 0.0 (순백색) ~ 1.0 (미세한 파스텔 틴트 최대)
  const clampedT = Math.max(0, Math.min(1, t));

  let r = 255, g = 255, b = 255;
  if (tintType === "yellow") {
    // 순백 #FFFFFF -> 미세 노랑 #FFFED6 (g 살짝 유지, b 살짝 감소)
    r = 255;
    g = Math.round(255 - 2 * clampedT);
    b = Math.round(255 - 42 * clampedT);
  } else if (tintType === "blue") {
    // 순백 #FFFFFF -> 미세 연하늘 #E2F2FF (r, g 살짝 감소, b 최대 유지)
    r = Math.round(255 - 32 * clampedT);
    g = Math.round(255 - 16 * clampedT);
    b = 255;
  } else if (tintType === "red") {
    // 순백 #FFFFFF -> 미세 연분홍/연빨강 #FFE8E8 (r 최대 유지, g, b 살짝 감소)
    r = 255;
    g = Math.round(255 - 26 * clampedT);
    b = Math.round(255 - 26 * clampedT);
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function drawConversionEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { attackerPos } = drawCtx;
  const step = frame.moveStep || 1;
  const p = frame.effectProgress ?? 0.5;

  const ax = attackerPos.x;
  const ay = attackerPos.y;
  const centerY = ay - 32;
  const belowFloorY = ay + 30; // 바닥 아래 완벽 지점

  ctx.save();

  // =========================================================================
  // Step 1: 흰색 사각형들이 바닥 아래에서 위로 올라옴 (border 없음)
  // 올라오면서 미세하게 노란색, 파란색, 빨간색으로 살짝 변함 (여전히 흰색에 가까움)
  // =========================================================================
  if (step === 1) {
    // 상승 프로그레스 (이징 효과)
    for (let i = 0; i < CONVERSION_SQUARES.length; i++) {
      const sq = CONVERSION_SQUARES[i];
      const sqP = Math.min(1.0, Math.max(0, p * sq.riseSpeed));
      const easeP = 1 - Math.pow(1 - sqP, 2.5); // 부드러운 감속 상승

      const curX = ax + sq.relX;
      const targetY = centerY + sq.relY;
      // 바닥 아래(belowFloorY)에서 목표 높이(targetY)로 상승
      const curY = belowFloorY - easeP * (belowFloorY - targetY);

      // 알파: 바닥에서 솟아오르며 신속하게 나타남
      const alpha = Math.min(1.0, sqP * 1.8);
      if (alpha <= 0.01) continue;

      // 틴트 강도: 상승하면서 0.0 (순백) -> 1.0 (미세한 파스텔 틴트)
      const tintT = sqP;
      const fillColor = getSubtleTintColor(sq.tintType, tintT, alpha * 0.95);

      // 사각형 그리기 (border 없이 순수 면 채우기)
      const halfS = sq.size * 0.5;
      ctx.fillStyle = fillColor;
      ctx.fillRect(curX - halfS, curY - halfS, sq.size, sq.size);
    }
  }

  // =========================================================================
  // Step 2: 해당 사각형들이 작아짐 (우측상단부터 좌측하단순으로 순차 축소, border 없음)
  // =========================================================================
  else if (step === 2) {
    for (let i = 0; i < CONVERSION_SQUARES.length; i++) {
      const sq = CONVERSION_SQUARES[i];
      const delay = SHRINK_DELAYS[i]; // 0.0 (최우측상단) ~ 1.0 (최좌측하단)

      // 순차 축소 시간 윈도우 계산
      const shrinkWindow = 0.40; // 개별 사각형이 1.0 -> 0.0으로 줄어드는 기간
      const startTime = delay * (1.0 - shrinkWindow);
      const endTime = startTime + shrinkWindow;

      let scale = 1.0;
      if (p <= startTime) {
        scale = 1.0;
      } else if (p >= endTime) {
        scale = 0.0;
      } else {
        const localP = (p - startTime) / shrinkWindow;
        scale = 1.0 - localP; // 1.0 -> 0.0 선형 축소
      }

      if (scale <= 0.01) continue;

      const curX = ax + sq.relX;
      const curY = centerY + sq.relY;
      const curSize = sq.size * scale;
      const halfS = curSize * 0.5;

      const alpha = Math.min(1.0, scale * 1.3);
      const fillColor = getSubtleTintColor(sq.tintType, 1.0, alpha * 0.95);

      // 사각형 그리기 (border 없이 순수 면 채우기)
      ctx.fillStyle = fillColor;
      ctx.fillRect(curX - halfS, curY - halfS, curSize, curSize);
    }
  }

  // =========================================================================
  // Step 3: 사각형 소멸 완료 ➔ 이후 랭크업 오라 분출!
  // =========================================================================
  else if (step === 3) {
    // 랭크업 스탯 부스트 오라 효과 분출
    drawStatBoostEffect(ctx, { x: ax, y: centerY + 28 }, p);
  }

  // =========================================================================
  // Step 4: 랭크업 오라 안정화 및 복귀
  // =========================================================================
  else if (step === 4) {
    const fade = Math.max(0, 1.0 - p * 1.25);
    if (fade > 0.01) {
      drawStatBoostEffect(ctx, { x: ax, y: centerY + 28 }, 0.65 + p * 0.35);
    }
  }

  ctx.restore();
}
