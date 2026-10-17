// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import {
  getBeatUpFistCanvas,
  getKarateBlackImg,
  getKarateWhiteImg,
  drawMiniRetroStar,
} from "../common/helpers.js";

// ============================================================================
// 🪨 249: 바위깨기 (Rock Smash / いわくだき) - 격투 타입 물리 기술
//
// 위력: 40 / 명중: 100 / PP: 15 / 50% 확률로 상대 방어 1랭크 하락 / 접촉: O
// 설명: 바위를 부수는 주먹으로 공격한다. 상대의 방어를 떨어뜨릴 때가 있다.
//
// [유저 요구사항 완벽 반영]:
// 1. 작은 타격 이펙트 (콤팩트하고 명확한 정권 직격 섬광 + 미니 스타버스트 + 암석 미세 분진)
// 2. 돌파편 튀는 연출
// 3. 물리 엔진 적용: 위로 살짝 튀었다가 포물선으로 아래로 떨어짐
// 4. 단, 3D 다각도로 (X, Y, Z 3차원 속도 벡터, 원근 스케일링, 실시간 3D 텀블링 다면체 렌더링)
// ============================================================================

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Face3 {
  a: number;
  b: number;
  c: number;
}

export interface RockMesh {
  vertices: Vec3[];
  faces: Face3[];
}

// ----------------------------------------------------------------------------
// 3D 다면체 암석 메쉬 아키타입 (3종류의 불규칙한 3D 암석 원형)
// ----------------------------------------------------------------------------

/** 아키타입 0: 날카로운 쐐기형 파편 (Sharp Jagged Shard) */
const MESH_SHARP_SHARD: RockMesh = {
  vertices: [
    { x: 0.0, y: -1.2, z: 0.1 },  // 0: 상단 첨두
    { x: 0.85, y: -0.2, z: 0.4 }, // 1: 우측 능선
    { x: 0.2, y: 0.35, z: 0.95 }, // 2: 전면 돌출각
    { x: -0.8, y: -0.15, z: 0.3 },// 3: 좌측 능선
    { x: -0.25, y: -0.3, z: -0.85},// 4: 후면 능선
    { x: 0.05, y: 1.15, z: -0.1 },// 5: 하단 첨두
  ],
  faces: [
    { a: 0, b: 1, c: 2 },
    { a: 0, b: 2, c: 3 },
    { a: 0, b: 3, c: 4 },
    { a: 0, b: 4, c: 1 },
    { a: 5, b: 2, c: 1 },
    { a: 5, b: 3, c: 2 },
    { a: 5, b: 4, c: 3 },
    { a: 5, b: 1, c: 4 },
  ],
};

/** 아키타입 1: 묵직한 다면체 덩어리 바위 (Chunky Polyhedral Rock) */
const MESH_CHUNKY_ROCK: RockMesh = {
  vertices: [
    { x: -0.55, y: -0.85, z: -0.45 }, // 0
    { x: 0.65, y: -0.9, z: -0.35 },  // 1
    { x: 0.8, y: -0.65, z: 0.6 },    // 2
    { x: -0.65, y: -0.6, z: 0.75 },  // 3
    { x: -0.8, y: 0.65, z: -0.5 },   // 4
    { x: 0.6, y: 0.8, z: -0.55 },    // 5
    { x: 0.75, y: 0.7, z: 0.65 },    // 6
    { x: -0.6, y: 0.85, z: 0.6 },    // 7
  ],
  faces: [
    // 상단 면
    { a: 0, b: 1, c: 2 },
    { a: 0, b: 2, c: 3 },
    // 하단 면
    { a: 4, b: 6, c: 5 },
    { a: 4, b: 7, c: 6 },
    // 전면
    { a: 3, b: 2, c: 6 },
    { a: 3, b: 6, c: 7 },
    // 후면
    { a: 1, b: 0, c: 4 },
    { a: 1, b: 4, c: 5 },
    // 우측면
    { a: 2, b: 1, c: 5 },
    { a: 2, b: 5, c: 6 },
    // 좌측면
    { a: 0, b: 3, c: 7 },
    { a: 0, b: 7, c: 4 },
  ],
};

/** 아키타입 2: 납작한 쪼개진 바위 파편 (Flake / Chipping) */
const MESH_FLAKE_SHARD: RockMesh = {
  vertices: [
    { x: 0.0, y: -0.9, z: 0.2 },
    { x: 0.95, y: 0.1, z: 0.15 },
    { x: 0.4, y: 0.85, z: 0.25 },
    { x: -0.7, y: 0.75, z: 0.2 },
    { x: -0.85, y: -0.2, z: 0.1 },
    // 얇은 후면 정점
    { x: 0.0, y: -0.8, z: -0.2 },
    { x: 0.8, y: 0.1, z: -0.2 },
    { x: 0.3, y: 0.75, z: -0.2 },
    { x: -0.6, y: 0.65, z: -0.2 },
    { x: -0.75, y: -0.15, z: -0.15 },
  ],
  faces: [
    { a: 0, b: 1, c: 2 },
    { a: 0, b: 2, c: 3 },
    { a: 0, b: 3, c: 4 },
    { a: 5, b: 7, c: 6 },
    { a: 5, b: 8, c: 7 },
    { a: 5, b: 9, c: 8 },
    { a: 0, b: 6, c: 1 },
    { a: 0, b: 5, c: 6 },
    { a: 1, b: 7, c: 2 },
    { a: 1, b: 6, c: 7 },
    { a: 2, b: 8, c: 3 },
    { a: 2, b: 7, c: 8 },
    { a: 3, b: 9, c: 4 },
    { a: 3, b: 8, c: 9 },
    { a: 4, b: 5, c: 0 },
    { a: 4, b: 9, c: 5 },
  ],
};

const ROCK_MESHES = [MESH_SHARP_SHARD, MESH_CHUNKY_ROCK, MESH_FLAKE_SHARD];

// ----------------------------------------------------------------------------
// 파편 물리 정의 (14개의 3D 다각도 암석 파편)
// - vx: 수평 비산 속도 (-120 ~ +120 px/s)
// - vy0: 초기 수직 속도 (음수 = 위로 튀어오름, -130 ~ -200 px/s)
// - vz: 전후 깊이 속도 (양수 = 카메라 앞, 음수 = 배경 안, -60 ~ +85 px/s)
// - gravity: 중력 가속도 (700 ~ 950 px/s^2) -> 0.15~0.2초에 정점 찍고 포물선 낙하
// ----------------------------------------------------------------------------

export interface RockSmashFragmentDef {
  meshIndex: number;
  size: number;
  vx: number;
  vy0: number;
  vz: number;
  gravity: number;
  rotSpeedX: number;
  rotSpeedY: number;
  rotSpeedZ: number;
  initialRotZ: number;
  delay?: number; // 파편별 미세 지연 시간 (0.00~0.05초 순차 파쇄)
}

export const ROCK_SMASH_FRAGMENTS: RockSmashFragmentDef[] = [
  // --------------------------------------------------------------------------
  // 1. [후방 파편군 (vz < 0)]: 대상 포켓몬의 등 뒤편으로 포물선 낙하 (오클루전 3D 연출)
  // - 파편마다 정점 도달 시간(0.13s~0.23s)과 낙하 속도가 각양각색으로 불규칙하게 흩어짐
  // --------------------------------------------------------------------------
  // 1. 후방 중앙 직상향 하이 아치 (정점 0.224초, 체공 후 등 뒤 수직 낙하)
  {
    meshIndex: 0,
    size: 7.5,
    vx: 12,
    vy0: -215,
    vz: -70,
    gravity: 960,
    rotSpeedX: 5.5,
    rotSpeedY: 6.2,
    rotSpeedZ: 4.1,
    initialRotZ: 0.3,
    delay: 0.00,
  },
  // 2. 후방 좌측 묵직한 조기 추락 바위 (정점 0.130초, 살짝 튀었다가 적 등 뒤로 빠르게 곤두박질)
  {
    meshIndex: 1,
    size: 6.8,
    vx: -32,
    vy0: -150,
    vz: -65,
    gravity: 1150,
    rotSpeedX: -5.8,
    rotSpeedY: 5.4,
    rotSpeedZ: -4.5,
    initialRotZ: 1.1,
    delay: 0.02,
  },
  // 3. 후방 우측 완만한 아치 (정점 0.189초, 지연 파편 0.04초)
  {
    meshIndex: 2,
    size: 7.0,
    vx: 36,
    vy0: -185,
    vz: -65,
    gravity: 980,
    rotSpeedX: 4.2,
    rotSpeedY: -5.0,
    rotSpeedZ: 5.2,
    initialRotZ: 2.4,
    delay: 0.04,
  },
  // 4. 후방 좌측 와이드 조기 낙하 (정점 0.152초, 좌측 어깨 너머로 낮게 빠르게 튐)
  {
    meshIndex: 0,
    size: 6.2,
    vx: -145,
    vy0: -140,
    vz: -70,
    gravity: 920,
    rotSpeedX: -4.8,
    rotSpeedY: 4.6,
    rotSpeedZ: -5.0,
    initialRotZ: 0.8,
    delay: 0.01,
  },
  // 5. 후방 우측 와이드 고공 비산 (정점 0.228초, 우측 어깨 너머 높은 포물선)
  {
    meshIndex: 1,
    size: 6.5,
    vx: 150,
    vy0: -210,
    vz: -70,
    gravity: 920,
    rotSpeedX: 7.2,
    rotSpeedY: 3.0,
    rotSpeedZ: 6.0,
    initialRotZ: 1.7,
    delay: 0.03,
  },
  // 6. 후방 딥 백그라운드 원거리 비산 (정점 0.174초, 깊은 배경으로 낙하)
  {
    meshIndex: 2,
    size: 5.8,
    vx: -195,
    vy0: -165,
    vz: -85,
    gravity: 950,
    rotSpeedX: 4.0,
    rotSpeedY: 7.5,
    rotSpeedZ: -3.5,
    initialRotZ: 3.1,
    delay: 0.05,
  },

  // --------------------------------------------------------------------------
  // 2. [전면 파편군 (vz > 0)]: 대상 포켓몬의 앞면을 가로지르며 카메라 쪽으로 와이드 비산
  // --------------------------------------------------------------------------
  // 7. 정면 대형 묵직한 돌 (정점 0.145초, 카메라를 향해 튀어나오며 빠르게 하강)
  {
    meshIndex: 1,
    size: 9.8,
    vx: 35,
    vy0: -160,
    vz: 90,
    gravity: 1100,
    rotSpeedX: -7.0,
    rotSpeedY: 3.8,
    rotSpeedZ: 7.2,
    initialRotZ: 0.5,
    delay: 0.00,
  },
  // 8. 전면 좌측 와이드 고공 비산 (정점 0.227초, 좌측 높은 궤적을 그리며 체공)
  {
    meshIndex: 2,
    size: 8.5,
    vx: -180,
    vy0: -220,
    vz: 85,
    gravity: 970,
    rotSpeedX: 6.5,
    rotSpeedY: -6.0,
    rotSpeedZ: -6.5,
    initialRotZ: 2.1,
    delay: 0.02,
  },
  // 9. 전면 우측 와이드 고속 낙하 (정점 0.162초, 우측으로 시원하게 솟구치다 빠른 낙하)
  {
    meshIndex: 0,
    size: 8.2,
    vx: 185,
    vy0: -170,
    vz: 90,
    gravity: 1050,
    rotSpeedX: 3.5,
    rotSpeedY: -5.5,
    rotSpeedZ: 4.0,
    initialRotZ: 1.4,
    delay: 0.01,
  },
  // 10. 전면 좌하단 최단시간 급강하 파편 (정점 0.118초, 가장 먼저 정점 찍고 바닥으로 낙하!)
  {
    meshIndex: 1,
    size: 7.2,
    vx: -110,
    vy0: -130,
    vz: 65,
    gravity: 1100,
    rotSpeedX: -4.0,
    rotSpeedY: 5.8,
    rotSpeedZ: -4.2,
    initialRotZ: 2.8,
    delay: 0.00,
  },
  // 11. 전면 우하단 중간 아치 파편 (정점 0.204초)
  {
    meshIndex: 2,
    size: 7.0,
    vx: 120,
    vy0: -190,
    vz: 70,
    gravity: 930,
    rotSpeedX: 5.0,
    rotSpeedY: -4.5,
    rotSpeedZ: 5.5,
    initialRotZ: 0.2,
    delay: 0.04,
  },
  // 12. 전면 상향 고공 최고점 로켓 도약 파편 (정점 0.231초, 가장 높은 곳까지 솟구침)
  {
    meshIndex: 1,
    size: 8.0,
    vx: -20,
    vy0: -240,
    vz: 75,
    gravity: 1040,
    rotSpeedX: -5.5,
    rotSpeedY: 4.8,
    rotSpeedZ: -4.8,
    initialRotZ: 1.9,
    delay: 0.01,
  },

  // --------------------------------------------------------------------------
  // 3. [측면 익스트림 와이드 비산 (스파크)]: 화면 양옆으로 시원하게 흩뿌려짐
  // --------------------------------------------------------------------------
  // 13. 극좌측 원거리 파편 (정점 0.148초, 화면 좌측으로 낮고 빠르게 비산)
  {
    meshIndex: 2,
    size: 4.5,
    vx: -255,
    vy0: -145,
    vz: 30,
    gravity: 980,
    rotSpeedX: 8.5,
    rotSpeedY: 7.0,
    rotSpeedZ: 6.8,
    initialRotZ: 0.9,
    delay: 0.00,
  },
  // 14. 극우측 원거리 파편 (정점 0.228초, 화면 우측으로 높고 멀리 비산)
  {
    meshIndex: 0,
    size: 4.5,
    vx: 260,
    vy0: -205,
    vz: -30,
    gravity: 900,
    rotSpeedX: -8.0,
    rotSpeedY: -6.5,
    rotSpeedZ: -7.5,
    initialRotZ: 2.6,
    delay: 0.03,
  },
];

// ----------------------------------------------------------------------------
// 색상 팔레트 (매그니튜드 #222 바위 팔레트 1:1 완벽 참조)
// - highlight: #A1887F (매그니튜드 상단 밝은 면)
// - base: #6D4C41 (매그니튜드 기본 암석 면)
// - midShadow: #4E342E (중간 음영면)
// - deepShadow: #3E2723 (매그니튜드 그림자면)
// - dust: rgba(215, 204, 200, 0.45) (매그니튜드 미세 분진)
// - dustDark: rgba(109, 76, 65, 0.35) (매그니튜드 흙먼지)
// ----------------------------------------------------------------------------
const ROCK_PALETTE = {
  highlight: "#A1887F",     // 밝은 암석 면 (매그니튜드 MAGNITUDE_PALETTE.rockHighlight)
  base: "#6D4C41",          // 기본 바위 표면 (매그니튜드 MAGNITUDE_PALETTE.rockBase)
  midShadow: "#4E342E",     // 중간 음영면 (자연스러운 중간 그림자)
  deepShadow: "#3E2723",    // 짙은 그림자면 (매그니튜드 MAGNITUDE_PALETTE.rockShadow)
  dust: "rgba(215, 204, 200, 0.45)",    // 매그니튜드 충격 미세 분진
  dustDark: "rgba(109, 76, 65, 0.35)",  // 매그니튜드 어두운 흙먼지
  impactCore: "#FFFFFF",    // 타격 직격 백색 코어
  impactWarm: "#FFF3E0",    // 타격 웜화이트
  impactOrange: "#FFB74D",  // 격투 타격 오렌지 스파크
};

// ----------------------------------------------------------------------------
// 3D 회전 및 투영 렌더러
// ----------------------------------------------------------------------------
function draw3DRockFragment(
  ctx: any,
  frag: RockSmashFragmentDef,
  timeSec: number,
  targetX: number,
  targetY: number,
  alpha: number
) {
  if (alpha <= 0.01) return;

  const startDelay = frag.delay ?? 0;
  if (timeSec < startDelay) return; // 미세 지연: 아직 파쇄되지 않은 파편은 그리지 않음

  const t = timeSec - startDelay;

  // 1. 물리 궤적 계산 (개별 유효 체공 시간 t)
  const x = frag.vx * t;
  // y = v0*t + 0.5*g*t^2 (초기 v0 음수로 위로 튀어오른 후 중력에 의해 포물선 낙하)
  const y = frag.vy0 * t + 0.5 * frag.gravity * t * t;
  const z = frag.vz * t;

  // 2. 3D 의사 투영 (Z 깊이에 따른 원근 스케일링 및 Y축 바닥 틸트 투영)
  // z > 0 (카메라 쪽으로 돌출): 스케일 증가 / z < 0 (배경 안쪽): 스케일 감소
  const depthScale = Math.max(0.35, Math.min(1.5, 1.0 + z * 0.004));
  const screenX = targetX + x * (1.0 + z * 0.002);
  const screenY = targetY + y + z * 0.28; // 틸트 각도 보정

  // 3. 3D 회전 각도 계산 (시간에 따른 X, Y, Z 회전)
  const rotX = frag.rotSpeedX * t;
  const rotY = frag.rotSpeedY * t;
  const rotZ = frag.initialRotZ + frag.rotSpeedZ * t;

  const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
  const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ);

  const mesh = ROCK_MESHES[frag.meshIndex % ROCK_MESHES.length];
  const finalScale = frag.size * depthScale;

  // 각 정점 3D 회전 계산
  const rotVerts: { px: number; py: number; rx: number; ry: number; rz: number }[] = [];
  for (let i = 0; i < mesh.vertices.length; i++) {
    const v = mesh.vertices[i];
    // A. X축 회전
    const y1 = v.y * cosX - v.z * sinX;
    const z1 = v.y * sinX + v.z * cosX;
    const x1 = v.x;

    // B. Y축 회전
    const x2 = x1 * cosY + z1 * sinY;
    const z2 = -x1 * sinY + z1 * cosY;
    const y2 = y1;

    // C. Z축 회전
    const x3 = x2 * cosZ - y2 * sinZ;
    const y3 = x2 * sinZ + y2 * cosZ;
    const z3 = z2;

    rotVerts.push({
      px: screenX + x3 * finalScale,
      py: screenY + y3 * finalScale,
      rx: x3,
      ry: y3,
      rz: z3,
    });
  }

  // 조명 광원 벡터 (좌상단 전면: [-0.45, -0.65, 0.61] 정규화)
  const lx = -0.45;
  const ly = -0.65;
  const lz = 0.61;

  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  // 4. 각 면(Triangle) 렌더링 (Backface Culling + 3D Diffuse Shading)
  // ⚠️ [유저 요청 완벽 반영]: 돌 표면의 격자선/외곽선(Stroke) 완전 제거! 순수 3D 음영 면만 채움
  for (let fi = 0; fi < mesh.faces.length; fi++) {
    const f = mesh.faces[fi];
    const vA = rotVerts[f.a];
    const vB = rotVerts[f.b];
    const vC = rotVerts[f.c];

    // 스크린 상 2D 외적을 이용한 가시성(Backface Culling)
    const crossZ = (vB.px - vA.px) * (vC.py - vA.py) - (vB.py - vA.py) * (vC.px - vA.px);
    if (crossZ <= 0.02) continue; // 카메라 반대편 면은 은면 제거

    // 3D 면 법선 벡터 계산
    const e1x = vB.rx - vA.rx;
    const e1y = vB.ry - vA.ry;
    const e1z = vB.rz - vA.rz;

    const e2x = vC.rx - vA.rx;
    const e2y = vC.ry - vA.ry;
    const e2z = vC.rz - vA.rz;

    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;

    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (len < 1e-4) continue;

    // 광원 벡터와의 내적 (음영 결정)
    const dot = (nx * lx + ny * ly + nz * lz) / len;

    let faceColor = ROCK_PALETTE.base;
    if (dot > 0.42) {
      faceColor = ROCK_PALETTE.highlight;
    } else if (dot > 0.05) {
      faceColor = ROCK_PALETTE.base;
    } else if (dot > -0.32) {
      faceColor = ROCK_PALETTE.midShadow;
    } else {
      faceColor = ROCK_PALETTE.deepShadow;
    }

    ctx.fillStyle = faceColor;
    ctx.beginPath();
    ctx.moveTo(vA.px, vA.py);
    ctx.lineTo(vB.px, vB.py);
    ctx.lineTo(vC.px, vC.py);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

// ----------------------------------------------------------------------------
// 타격 이펙트 (따라가때리기 중앙부 연출 참조: 코어 섬광 플래시 + 8각 날카로운 스타버스트)
// ⚠️ 유저 요청: 주먹(Fist) 및 링(Ring) 완전 제거!
// ----------------------------------------------------------------------------

/**
 * 타격 코어 섬광 플래시 (따라가때리기 drawPursuitFeintHitBurst 규격)
 */
function drawRockSmashHitBurst(
  ctx: any,
  cx: number,
  cy: number,
  progress: number
) {
  if (progress < 0 || progress > 1.0) return;
  const alpha = Math.max(0, 1.0 - progress);
  if (alpha <= 0.01) return;

  ctx.save();
  const coreR = 10 + progress * 14;
  const flashGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
  flashGrad.addColorStop(0.00, `rgba(255, 255, 255, ${1.0 * alpha})`);
  flashGrad.addColorStop(0.30, `rgba(255, 255, 255, ${0.95 * alpha})`);
  flashGrad.addColorStop(0.65, `rgba(255, 213, 79, ${0.85 * alpha})`); // 따뜻한 골든 옐로우/암석 타격
  flashGrad.addColorStop(0.88, `rgba(255, 183, 77, ${0.40 * alpha})`);
  flashGrad.addColorStop(1.00, "rgba(255, 183, 77, 0.0)");

  ctx.fillStyle = flashGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 타격 8각 날카로운 스타버스트 (따라가때리기 drawPursuitFeintSharpImpact 동일 규격)
 * - 8각 별 채움 + 순백 1.8px miter 림 + 중앙부 순백 미니 코어
 */
function drawRockSmashSharpImpact(
  ctx: any,
  cx: number,
  cy: number,
  progress: number
) {
  if (progress < 0 || progress > 1.0) return;
  const alpha = Math.max(0, 1.0 - progress);
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(progress * 0.45);

  const outerR = 10 + progress * 16;
  const innerR = outerR * 0.38;
  const points = 8;

  // 따뜻한 골든 앰버 채움 & 순백 하이라이트 림 (miter join)
  ctx.fillStyle = `rgba(255, 213, 79, ${0.90 * alpha})`;
  ctx.strokeStyle = `rgba(255, 255, 255, ${1.0 * alpha})`;
  ctx.lineWidth = 1.8;
  ctx.lineJoin = "miter";
  ctx.miterLimit = 4;

  ctx.beginPath();
  const step = Math.PI / points;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = i * step - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 중앙부 순백 미니 코어
  ctx.fillStyle = `rgba(255, 255, 255, ${1.0 * alpha})`;
  ctx.beginPath();
  ctx.arc(0, 0, outerR * 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 암석 분쇄 미세 분진 (Chalky Stone Dust Puffs)
 * 바위가 깨지며 중심에서 퍼져나가는 고운 돌가루 연무
 */
function drawRockSmashChalkDust(
  ctx: any,
  tx: number,
  ty: number,
  progress: number
) {
  if (progress < 0 || progress > 1.0) return;
  const alpha = Math.max(0, 1.0 - progress);
  if (alpha <= 0.01) return;

  ctx.save();
  const dustCount = 8;
  for (let d = 0; d < dustCount; d++) {
    const dAngle = (d / dustCount) * Math.PI * 2 + 0.3;
    const dDist = 8 + progress * 42;
    const dx = tx + Math.cos(dAngle) * dDist;
    const dy = ty + Math.sin(dAngle) * (dDist * 0.7);
    const dRadius = 5 + progress * 9;
    const dAlpha = Math.max(0, (1.0 - progress) * 0.55);

    const dGrad = ctx.createRadialGradient(dx, dy, 0, dx, dy, dRadius);
    dGrad.addColorStop(0.0, `rgba(215, 204, 200, ${dAlpha})`);
    dGrad.addColorStop(0.6, `rgba(109, 76, 65, ${dAlpha * 0.6})`);
    dGrad.addColorStop(1.0, "rgba(62, 39, 35, 0.0)");

    ctx.fillStyle = dGrad;
    ctx.beginPath();
    ctx.arc(dx, dy, dRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ----------------------------------------------------------------------------
// 대상 포켓몬 스프라이트의 정확한 중심 좌표 계산
// ⚠️ 바닥 접지점(feet)이 아닌 포켓몬 몸체/가슴 정중앙을 타격점으로 지정
// ----------------------------------------------------------------------------
export function getTargetSpriteCenter(
  drawCtx: EffectDrawContext,
  frame: BattleFrame
): { x: number; y: number } {
  const isP = drawCtx.isPlayer ?? true;
  const targetBase = isP ? drawCtx.em : drawCtx.pm;
  const targetSprite = isP ? drawCtx.enemySprite : drawCtx.playerSprite;
  const targetOffset = isP
    ? (frame.eOffset ?? { x: 0, y: 0 })
    : (frame.pOffset ?? { x: 0, y: 0 });

  const baseX = targetBase?.x ?? (isP ? 418 : 150);
  const baseY = targetBase?.y ?? (isP ? 152 : 280);

  // 스프라이트 픽셀 바운딩 박스가 측정되어 있으면 실제 그려지는 높이의 50%를 기준으로 중심 산출
  let centerY = baseY - (isP ? 42 : 58);
  if (targetSprite?._pixelBounds) {
    const bounds = targetSprite._pixelBounds;
    const targetSize = isP ? (targetBase?.size ?? 95) : (targetBase?.size ?? 135);
    const sizeRatio = Math.max(0.55, Math.min(1.35, bounds.maxDim / 70));
    const effectiveSize = targetSize * sizeRatio;
    const scale = effectiveSize / bounds.maxDim;
    const drawH = bounds.actH * scale;
    centerY = baseY - drawH * 0.5;
  } else if (drawCtx.targetPos?.y) {
    // drawCtx.targetPos는 기본적으로 baseY - 36
    centerY = isP ? drawCtx.targetPos.y - 6 : drawCtx.targetPos.y - 18;
  }

  return {
    x: baseX + targetOffset.x,
    y: centerY + targetOffset.y,
  };
}

// ============================================================================
// 1. 후면 이펙트 렌더러 (대상 포켓몬의 뒤쪽으로 떨어지는 vz < 0 파편)
// ⚠️ [유저 요청 완벽 반영]: 파편 일부는 포켓몬 뒤편으로 낙하하여 몸체에 가려지는 3D 연출
// ============================================================================
export function drawRockSmashBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const step = frame.moveStep ?? 1;

  // Step 3: 바위 파쇄 및 3D 파편 포물선 비산 (적 뒤편으로 낙하하는 파편 전담)
  if (step === 3) {
    const prog = frame.effectProgress ?? 0;
    const timeSec = prog * 0.48; // 총 체공 시간 약 0.48초
    const center = getTargetSpriteCenter(drawCtx, frame);

    // 페이드아웃 감쇠 (후반부 부드럽게 소산)
    const fadeAlpha = prog > 0.8 ? Math.max(0, (1.0 - prog) / 0.2) : 1.0;

    for (let i = 0; i < ROCK_SMASH_FRAGMENTS.length; i++) {
      const frag = ROCK_SMASH_FRAGMENTS[i];

      // vz < 0 인 후방 파편은 포켓몬 스프라이트 뒤편(Behind 레이어)에서 비산 및 낙하
      if (frag.vz < 0) {
        draw3DRockFragment(
          ctx,
          frag,
          timeSec,
          center.x,
          center.y,
          fadeAlpha
        );
      }
    }
  }
}

// ============================================================================
// 2. 전면 이펙트 렌더러 (타격 섬광, 미세 분진, 전면 vz >= 0 파편)
// ============================================================================
export function drawRockSmashEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const center = getTargetSpriteCenter(drawCtx, frame);

  // --------------------------------------------------------------------------
  // Step 2: 타격 직격 & 작은 타격 이펙트 순간 (대상 스프라이트 중앙)
  // ⚠️ [유저 요청]: 주먹(Fist) 및 링(Ring) 제거, 따라가때리기 중앙부 규격(코어 섬광 + 8각 스타버스트)
  // --------------------------------------------------------------------------
  if (step === 2) {
    const hitProg = frame.hitProgress ?? prog;

    // 1. 따라가때리기 중앙부 코어 섬광 플래시
    drawRockSmashHitBurst(ctx, center.x, center.y, hitProg);

    // 2. 따라가때리기 중앙부 8각 날카로운 스타버스트
    drawRockSmashSharpImpact(ctx, center.x, center.y, hitProg);

    // 3. 암석 분쇄 미세 분진
    drawRockSmashChalkDust(ctx, center.x, center.y, hitProg);
  }

  // --------------------------------------------------------------------------
  // Step 3: 바위 파쇄 & 3D 물리 돌파편 포물선 비산 (전면 파편: vz >= 0)
  // --------------------------------------------------------------------------
  if (step === 3) {
    const timeSec = prog * 0.48; // 체공 시간 (0.0 ~ 0.48s)

    // 초반 잔여 섬광 (prog < 0.25)
    if (prog < 0.25) {
      const lingeringProg = prog / 0.25;
      drawRockSmashHitBurst(ctx, center.x, center.y, lingeringProg);
      drawRockSmashSharpImpact(ctx, center.x, center.y, lingeringProg);
    }

    // 페이드아웃 감쇠 (후반부 0.8~1.0 구간 서서히 소산)
    const fadeAlpha = prog > 0.8 ? Math.max(0, (1.0 - prog) / 0.2) : 1.0;

    // vz >= 0 인 전면 파편만 대상 포켓몬 앞쪽(Front 레이어)에서 비산 및 낙하
    for (let i = 0; i < ROCK_SMASH_FRAGMENTS.length; i++) {
      const frag = ROCK_SMASH_FRAGMENTS[i];

      if (frag.vz >= 0) {
        draw3DRockFragment(
          ctx,
          frag,
          timeSec,
          center.x,
          center.y,
          fadeAlpha
        );
      }
    }
  }

  // --------------------------------------------------------------------------
  // Step 4: 안정화 및 미세 잔여 분진 소산
  // --------------------------------------------------------------------------
  if (step === 4) {
    if (prog < 0.5) {
      const settleAlpha = Math.max(0, (1.0 - prog / 0.5) * 0.25);
      ctx.save();
      ctx.fillStyle = `rgba(215, 204, 200, ${settleAlpha})`;
      ctx.beginPath();
      ctx.arc(center.x, center.y + 18, 12 + prog * 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

// ============================================================================
// 🌊 250: 바다회오리 (Whirlpool / うずしお) - 물 타입 특수 기술
// 위력: 35 / 명중: 85 / PP: 15 / 4~5턴 구속(바인드) / 다이빙(수중) 상태 2배 위력
// 설명: 세차게 소용돌이치는 물속에 4-5턴 동안 상대를 가두어 공격한다.
//
// [유저 요구사항 100% 반영]:
// 1. 주변이 푸른색으로 물듦:
//    - 회오리 발생과 함께 전장 주변 배경 전체에 깊은 해양 심해 블루 앰비언트 틴트(drawWhirlpoolAmbientBlue)가 퍼져나감
// 2. 회오리랑 비슷하지만 거품이 포함된 회오리 발생:
//    - 3D 모래시계형 물소용돌이 본체(에메랄드/청록/하늘빛 물결 그라데이션)가 바닥에서 위로 솟구침
//    - 회오리 기둥 내부 및 외표면에 3D 나선 궤도로 빠르게 회전하며 솟구쳐 오르는 입체 거품(Bubbles & Foam) 28개 포함
// 3. 회오리 외각에 추가적인 선들이 보임 (이 선은 3D로 이루어짐 흰색 외각 투명):
//    - 회오리 본체 외곽(반경 1.24배)을 따라 3D 나선 궤도로 맹렬히 회전하는 4개의 순백색 유선 리본
//    - [선 양 끝단 및 외곽 투명화]: 선 시작/끝점 및 외곽 글로우가 투명(0.0)으로 페이드아웃되어 부드럽게 감기는 3D 유선 연출
//    - Z축 분리: Behind(Z < 0)와 Front(Z >= 0)로 대상을 감싸며 회전
// ============================================================================

/**
 * 바다회오리 높이 비율(u: 0=바닥, 1=최상단)에 따른 반경(픽셀) 반환
 * - 아랫부분이 넓고(44px), 중간 부분이 잘록하며(22px), 윗부분이 또 넓게(58px) 퍼지는 3D 모래시계형 물기둥
 */
export function getWhirlpoolRadius(u: number): number {
  const clampedU = Math.max(0, Math.min(1, u));
  const uMid = 0.40;
  const rBase = 44; // 아랫부분 넓은 수면 밑동
  const rMid = 22;  // 중간 부분 잘록한 중심부
  const rTop = 58;  // 윗부분 분출되는 넓은 깔때기형 왕관

  if (clampedU <= uMid) {
    const t = clampedU / uMid;
    const factor = (1 - t) * (1 - t);
    return rMid + (rBase - rMid) * factor;
  } else {
    const t = (clampedU - uMid) / (1 - uMid);
    const factor = Math.pow(t, 1.35);
    return rMid + (rTop - rMid) * factor;
  }
}

/**
 * 1. 주변이 푸른색으로 물듦 (Oceanic Ambient Blue Screen Tint)
 * - [유저 피드백 완벽 반영]:
 *   1. "푸른색 필터는 좀 더 파랑": 시안/청록을 완전히 배제하고, 선명하고 깊은 순수 오션/로열 블루(#2563EB, #1D4ED8, #1E40AF) 톤 적용
 *   2. "추가로 화면을 다 채우지 못하네": 카메라 줌/시점 오프셋(-6000 ~ 14000)으로 전장 화면 전체를 빈틈없이 100% 완전 커버
 */
function drawWhirlpoolAmbientBlue(
  ctx: any,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  intensity: number
) {
  if (intensity <= 0.01) return;
  ctx.save();

  // 1. 전체 화면을 빈틈없이 100% 가득 채우는 깊은 베이스 파란색 (카메라 줌/시점 완벽 대응)
  ctx.fillStyle = `rgba(18, 55, 185, ${0.36 * intensity})`;
  ctx.fillRect(-6000, -6000, 14000, 14000);

  // 2. 대상 포켓몬 중심에서 사방으로 웅장하게 퍼지는 선명한 로열 블루 방사형 그라데이션
  const maxR = 900;
  const grad = ctx.createRadialGradient(centerX, centerY, 30, centerX, centerY, maxR);
  grad.addColorStop(0.00, `rgba(59, 130, 246, ${0.46 * intensity})`); // 중심: 눈부신 바다 파랑 (#3B82F6)
  grad.addColorStop(0.30, `rgba(37, 99, 235, ${0.54 * intensity})`);  // 근거리: 선명한 로열 블루 (#2563EB)
  grad.addColorStop(0.65, `rgba(30, 64, 175, ${0.64 * intensity})`);  // 원거리: 깊은 해양 코발트 블루 (#1E40AF)
  grad.addColorStop(1.00, `rgba(15, 23, 85, ${0.76 * intensity})`);   // 화면 외곽: 짙고 어두운 심해 네이비 블루

  ctx.fillStyle = grad;
  ctx.fillRect(-6000, -6000, 14000, 14000);

  ctx.restore();
}

/**
 * 2. 바닥 지면 수면 소용돌이 & 물결 리플 (Base Water Whirl & Ripples)
 */
function drawWhirlpoolBaseWater(
  ctx: any,
  centerX: number,
  baseY: number,
  baseRot: number,
  isBehind: boolean,
  alpha: number
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));

  // 바닥 수면 2.5D 타원 물결 링 (하늘색)
  const numRings = 3;
  for (let r = 0; r < numRings; r++) {
    const ringProg = ((baseRot * 0.16) + r / numRings) % 1.0;
    const ringRadius = 18 + ringProg * 36;
    const ringAlpha = Math.sin(ringProg * Math.PI) * (isBehind ? 0.35 : 0.65) * alpha;

    ctx.save();
    ctx.translate(centerX, baseY + 6);
    ctx.scale(1.0, 0.32); // 2.5D 바닥면 투영

    ctx.strokeStyle = `rgba(56, 189, 248, ${ringAlpha})`;
    ctx.lineWidth = 2.5 * (1 - ringProg * 0.5);
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // 바닥 밑동 물보라 안개 구름 (하늘빛 포말)
  const numPuffs = 6;
  for (let i = 0; i < numPuffs; i++) {
    const puffAng = (i * Math.PI * 2) / numPuffs + baseRot;
    const distR = 20 + ((i * 9) % 18);
    const px = centerX + Math.cos(puffAng) * distR;
    const py = baseY + 6 + Math.sin(puffAng) * (distR * 0.30);
    const z = Math.sin(puffAng);

    if (isBehind && z >= 0) continue;
    if (!isBehind && z < 0) continue;

    const puffSize = 10 + (i % 3) * 5;
    const puffAlpha = (isBehind ? 0.25 : 0.45) * alpha;

    const pGrad = ctx.createRadialGradient(px, py, 0, px, py, puffSize);
    pGrad.addColorStop(0, `rgba(224, 242, 254, ${puffAlpha})`);
    pGrad.addColorStop(0.5, `rgba(56, 189, 248, ${puffAlpha * 0.6})`);
    pGrad.addColorStop(1, "rgba(56, 189, 248, 0.0)");

    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(px, py, puffSize, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 3. 반투명 3D 하늘색 물소용돌이 기둥 바디 (Hourglass Sky Blue Vortex Body)
 * - [유저 요구 100% 반영]: "회오리바람을 하늘색으로 바꿔주고"
 * - 영롱하고 맑은 하늘색(#38BDF8, #7DD3FC, #BAE6FD) 톤으로 유려하게 빛나는 회오리 바디
 */
function drawWhirlpoolWaterBody(
  ctx: any,
  centerX: number,
  baseY: number,
  curHeight: number,
  alpha: number,
  isBehind: boolean
) {
  if (alpha <= 0.01 || curHeight <= 2) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));

  const steps = 38;
  const maxCenterAlpha = isBehind ? 0.30 : 0.42;

  for (let i = 0; i < steps; i++) {
    const u0 = i / steps;
    const u1 = (i + 1) / steps;
    const uMid = (u0 + u1) * 0.5;

    const y0 = baseY - u0 * curHeight;
    const y1 = baseY - u1 * curHeight;

    const r0 = getWhirlpoolRadius(u0);
    const r1 = getWhirlpoolRadius(u1);
    const maxR = Math.max(r0, r1);

    // 수직 페이드: 상단 및 하단 자연스러운 감쇠
    const topFade = Math.pow(Math.max(0, 1 - uMid), 0.55);
    const bottomFade = Math.min(1.0, uMid * 4.5 + 0.40);
    const vFade = topFade * bottomFade;

    const peakAlpha = maxCenterAlpha * vFade;
    if (peakAlpha <= 0.005) continue;

    // 맑고 눈부신 하늘색 (Sky Blue) 보간:
    // 하단: 시원한 하늘색(#38BDF8: 56, 189, 248) -> 상단: 부드러운 파스텔 하늘빛(#BAE6FD: 186, 230, 253)
    const red = Math.round(56 + uMid * 95);
    const grn = Math.round(189 + uMid * 38);
    const blu = Math.round(248 + uMid * 6);

    const fadeR = maxR * 0.92;
    const grad = ctx.createLinearGradient(centerX - fadeR, 0, centerX + fadeR, 0);

    const c0 = `rgba(${red}, ${grn}, ${blu}, 0.0)`;
    const cSoft = `rgba(${red}, ${grn}, ${blu}, ${peakAlpha * 0.25})`;
    const cSide = `rgba(${red}, ${grn}, ${blu}, ${peakAlpha * 0.70})`;
    const cMid = `rgba(224, 242, 254, ${peakAlpha * 0.95})`; // 중심부는 맑은 하늘백색 코어광

    grad.addColorStop(0.0, c0);
    grad.addColorStop(0.18, cSoft);
    grad.addColorStop(0.35, cSide);
    grad.addColorStop(0.50, cMid);
    grad.addColorStop(0.65, cSide);
    grad.addColorStop(0.82, cSoft);
    grad.addColorStop(1.0, c0);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(centerX - r0, y0 + 0.5);
    ctx.lineTo(centerX + r0, y0 + 0.5);
    ctx.lineTo(centerX + r1, y1 - 0.5);
    ctx.lineTo(centerX - r1, y1 - 0.5);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 4. 표면 고속 회전 하늘색 나선 급류 밴드 (Sky Blue Surface Vortex Torrents)
 * - [핵심 유저 요구]: "회오리바람을 하늘색으로 바꿔주고, 회전을 계속 이어서 진행해 줘. 현재는 이펙트만 나타나고 회전을 안 함."
 * - 회오리 표면(radMult = 0.98)에 굵직하고 선명한 4개의 하늘색(#38BDF8, #7DD3FC) 나선 급류 밴드가 회전
 * - 단색 원통이 아닌 표면 밴드가 회오리 경사를 타고 대각선으로 돌아가므로 강력한 3D 회전감이 시각적으로 완벽 구현됨
 */
function drawWhirlpoolSkyBlueTorrents(
  ctx: any,
  centerX: number,
  baseY: number,
  curHeight: number,
  baseRot: number,
  alpha: number,
  isBehind: boolean
) {
  if (alpha <= 0.01 || curHeight <= 6) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));

  const numStreams = 4; // 4개의 대형 표면 급류 리본
  const steps = 80;
  const turns = 2.4;
  const radMult = 0.98; // 회오리 표면에서 뚜렷하게 회전

  for (let s = 0; s < numStreams; s++) {
    const phaseOffset = (s * Math.PI * 2) / numStreams;
    const rotSpeed = baseRot;

    let currentChunk: { x: number; y: number; u: number; z: number }[] = [];

    const flushChunk = () => {
      if (currentChunk.length < 2) {
        currentChunk = [];
        return;
      }

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const startPt = currentChunk[0];
      const endPt = currentChunk[currentChunk.length - 1];
      const avgU = (startPt.u + endPt.u) * 0.5;
      const uFade = Math.sin(Math.max(0, Math.min(1, avgU)) * Math.PI);

      const peakAlpha = (isBehind ? 0.35 : 0.75) * (0.35 + 0.65 * uFade);
      const w = (isBehind ? 4.5 : 7.5) + uFade * 2.5;

      // 1. 하늘색 소프트 오라 그라데이션
      const auraGrad = ctx.createLinearGradient(startPt.x, startPt.y, endPt.x, endPt.y);
      auraGrad.addColorStop(0.0, "rgba(56, 189, 248, 0.0)");
      auraGrad.addColorStop(0.2, `rgba(56, 189, 248, ${peakAlpha * 0.70})`);
      auraGrad.addColorStop(0.8, `rgba(56, 189, 248, ${peakAlpha * 0.70})`);
      auraGrad.addColorStop(1.0, "rgba(56, 189, 248, 0.0)");

      ctx.strokeStyle = auraGrad;
      ctx.lineWidth = w * 1.6;
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      for (let j = 1; j < currentChunk.length; j++) {
        ctx.lineTo(currentChunk[j].x, currentChunk[j].y);
      }
      ctx.stroke();

      // 2. 밝은 하늘색 + 순백 하이라이트 코어
      const coreGrad = ctx.createLinearGradient(startPt.x, startPt.y, endPt.x, endPt.y);
      coreGrad.addColorStop(0.0, "rgba(186, 230, 253, 0.0)");
      coreGrad.addColorStop(0.25, `rgba(186, 230, 253, ${peakAlpha})`);
      coreGrad.addColorStop(0.50, `rgba(255, 255, 255, ${peakAlpha * 0.95})`);
      coreGrad.addColorStop(0.75, `rgba(186, 230, 253, ${peakAlpha})`);
      coreGrad.addColorStop(1.0, "rgba(186, 230, 253, 0.0)");

      ctx.strokeStyle = coreGrad;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      for (let j = 1; j < currentChunk.length; j++) {
        ctx.lineTo(currentChunk[j].x, currentChunk[j].y);
      }
      ctx.stroke();

      ctx.restore();
      currentChunk = [];
    };

    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const ang = phaseOffset + rotSpeed + u * turns * Math.PI * 2;
      const rad = getWhirlpoolRadius(u) * radMult;

      const x = centerX + Math.cos(ang) * rad;
      const z = Math.sin(ang);
      const y = baseY - u * curHeight + z * (rad * 0.22);

      const isInCurrentPass = isBehind ? z < 0.05 : z > -0.05;

      if (isInCurrentPass) {
        currentChunk.push({ x, y, u, z });
      } else {
        flushChunk();
      }
    }
    flushChunk();
  }

  ctx.restore();
}

// ----------------------------------------------------------------------------
// 5. [유저 요구사항]: "거품이 포함된 회오리 발생" - 3D 부유 수포/물거품
// ----------------------------------------------------------------------------

export interface WhirlpoolBubbleDef {
  baseU: number;      // 기본 높이 [0..1]
  speedU: number;     // 수직 상승 속도 배율
  baseAngle: number;  // 나선 기준 각도 (라디안)
  radiusRatio: number;// 회오리 반경 대비 위치 (0.65 ~ 1.05)
  size: number;       // 거품 구체 반경 (2.2 ~ 6.5px)
  wobbleSpeed: number;// 요동 주파수
}

export const WHIRLPOOL_BUBBLES: WhirlpoolBubbleDef[] = [
  { baseU: 0.05, speedU: 1.1, baseAngle: 0.2, radiusRatio: 0.75, size: 4.8, wobbleSpeed: 4.2 },
  { baseU: 0.12, speedU: 1.3, baseAngle: 1.8, radiusRatio: 0.90, size: 3.2, wobbleSpeed: 5.1 },
  { baseU: 0.20, speedU: 0.9, baseAngle: 3.4, radiusRatio: 0.65, size: 5.5, wobbleSpeed: 3.8 },
  { baseU: 0.28, speedU: 1.4, baseAngle: 4.9, radiusRatio: 0.85, size: 2.8, wobbleSpeed: 6.0 },
  { baseU: 0.35, speedU: 1.2, baseAngle: 0.8, radiusRatio: 1.00, size: 6.2, wobbleSpeed: 4.5 },
  { baseU: 0.42, speedU: 1.0, baseAngle: 2.5, radiusRatio: 0.70, size: 3.5, wobbleSpeed: 5.5 },
  { baseU: 0.50, speedU: 1.5, baseAngle: 4.1, radiusRatio: 0.95, size: 4.2, wobbleSpeed: 4.0 },
  { baseU: 0.58, speedU: 1.1, baseAngle: 5.6, radiusRatio: 0.80, size: 5.8, wobbleSpeed: 3.5 },
  { baseU: 0.65, speedU: 1.3, baseAngle: 1.2, radiusRatio: 0.72, size: 3.0, wobbleSpeed: 5.8 },
  { baseU: 0.72, speedU: 0.9, baseAngle: 2.9, radiusRatio: 1.02, size: 5.0, wobbleSpeed: 4.7 },
  { baseU: 0.80, speedU: 1.4, baseAngle: 4.5, radiusRatio: 0.88, size: 2.5, wobbleSpeed: 6.2 },
  { baseU: 0.88, speedU: 1.2, baseAngle: 0.1, radiusRatio: 0.68, size: 4.6, wobbleSpeed: 4.1 },
  { baseU: 0.95, speedU: 1.0, baseAngle: 1.6, radiusRatio: 0.92, size: 3.8, wobbleSpeed: 5.0 },
  // 작은 마이크로 폼 거품군
  { baseU: 0.08, speedU: 1.5, baseAngle: 3.1, radiusRatio: 0.82, size: 2.2, wobbleSpeed: 6.5 },
  { baseU: 0.16, speedU: 1.2, baseAngle: 4.7, radiusRatio: 0.98, size: 2.6, wobbleSpeed: 5.7 },
  { baseU: 0.24, speedU: 1.0, baseAngle: 0.5, radiusRatio: 0.78, size: 4.0, wobbleSpeed: 4.3 },
  { baseU: 0.32, speedU: 1.3, baseAngle: 2.1, radiusRatio: 0.84, size: 2.4, wobbleSpeed: 6.1 },
  { baseU: 0.40, speedU: 1.1, baseAngle: 3.8, radiusRatio: 0.62, size: 5.2, wobbleSpeed: 3.9 },
  { baseU: 0.48, speedU: 1.4, baseAngle: 5.3, radiusRatio: 0.96, size: 2.7, wobbleSpeed: 5.9 },
  { baseU: 0.55, speedU: 0.9, baseAngle: 1.0, radiusRatio: 0.74, size: 4.4, wobbleSpeed: 4.6 },
  { baseU: 0.62, speedU: 1.3, baseAngle: 2.7, radiusRatio: 0.86, size: 3.6, wobbleSpeed: 5.2 },
  { baseU: 0.70, speedU: 1.2, baseAngle: 4.3, radiusRatio: 1.04, size: 6.0, wobbleSpeed: 3.7 },
  { baseU: 0.77, speedU: 1.5, baseAngle: 5.9, radiusRatio: 0.80, size: 2.3, wobbleSpeed: 6.4 },
  { baseU: 0.85, speedU: 1.0, baseAngle: 1.4, radiusRatio: 0.66, size: 4.9, wobbleSpeed: 4.4 },
  { baseU: 0.92, speedU: 1.4, baseAngle: 3.0, radiusRatio: 0.90, size: 3.1, wobbleSpeed: 5.6 },
  { baseU: 0.02, speedU: 1.1, baseAngle: 4.6, radiusRatio: 0.76, size: 5.4, wobbleSpeed: 3.6 },
  { baseU: 0.18, speedU: 1.3, baseAngle: 0.3, radiusRatio: 1.02, size: 2.9, wobbleSpeed: 6.3 },
  { baseU: 0.38, speedU: 1.0, baseAngle: 2.0, radiusRatio: 0.85, size: 4.1, wobbleSpeed: 4.8 },
];

/**
 * 입체 물거품(Bubble) 단일 렌더러
 * - 투명한 중심부 + 선명한 시안/아쿠아 막 + 좌상단 순백 하이라이트 글린트 + 우하단 반사광
 */
function drawSingleWhirlpoolBubble(
  ctx: any,
  bx: number,
  by: number,
  radius: number,
  alpha: number
) {
  if (alpha <= 0.01 || radius <= 0.5) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));

  // 1. 거품 바디 방사형 그라데이션 (투명한 중심과 영롱한 외곽 수막)
  const grad = ctx.createRadialGradient(
    bx - radius * 0.25,
    by - radius * 0.25,
    radius * 0.15,
    bx,
    by,
    radius
  );
  grad.addColorStop(0.0, "rgba(224, 242, 254, 0.15)");
  grad.addColorStop(0.55, "rgba(56, 189, 248, 0.40)");
  grad.addColorStop(0.85, "rgba(14, 165, 233, 0.75)");
  grad.addColorStop(1.0, "rgba(255, 255, 255, 0.95)");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(bx, by, radius, 0, Math.PI * 2);
  ctx.fill();

  // 2. 좌상단 순백 하이라이트 글린트
  const hlX = bx - radius * 0.36;
  const hlY = by - radius * 0.36;
  const hlR = Math.max(0.6, radius * 0.28);
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.beginPath();
  ctx.arc(hlX, hlY, hlR, 0, Math.PI * 2);
  ctx.fill();

  // 3. 우하단 보조 반사광
  if (radius > 2.8) {
    const brX = bx + radius * 0.32;
    const brY = by + radius * 0.32;
    const brR = Math.max(0.4, radius * 0.16);
    ctx.fillStyle = "rgba(186, 230, 253, 0.65)";
    ctx.beginPath();
    ctx.arc(brX, brY, brR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 3D 나선 궤도로 상승 회전하는 거품군 렌더러
 */
function drawWhirlpoolBubbles(
  ctx: any,
  centerX: number,
  baseY: number,
  curHeight: number,
  baseRot: number,
  alpha: number,
  isBehind: boolean
) {
  if (alpha <= 0.01 || curHeight <= 6) return;

  for (let i = 0; i < WHIRLPOOL_BUBBLES.length; i++) {
    const b = WHIRLPOOL_BUBBLES[i];
    // 높이: baseRot에 비례하여 위로 부드럽게 상승 (모듈로 1.0)
    const u = (b.baseU + baseRot * 0.08 * b.speedU) % 1.0;
    const rad = getWhirlpoolRadius(u) * b.radiusRatio;

    // 회전 각도: baseRot을 따라 지속적으로 회전
    const rotSpeed = baseRot * (0.92 + 0.16 * (b.speedU - 1.0));
    const ang = b.baseAngle + rotSpeed + u * 2.2 * Math.PI;

    const x = centerX + Math.cos(ang) * rad;
    const z = Math.sin(ang); // -1 (back) to +1 (front)
    const y = baseY - u * curHeight + z * (rad * 0.20);

    // Behind vs Front 레이어 필터링
    if (isBehind && z >= 0) continue;
    if (!isBehind && z < 0) continue;

    const vFade = Math.sin(u * Math.PI);
    const bubbleAlpha = alpha * vFade * (isBehind ? 0.65 : 0.95);

    const depthScale = 0.85 + 0.30 * ((z + 1) * 0.5);
    const curRadius = b.size * depthScale;

    drawSingleWhirlpoolBubble(ctx, x, y, curRadius, bubbleAlpha);
  }
}

// ----------------------------------------------------------------------------
// 6. [유저 요구사항]: "(회오리 외각에 추가적인 선들이 보임 (이 선은 3D로 이루어짐 흰색 외각 투명 ))"
// ----------------------------------------------------------------------------

/**
 * 회오리 외각 3D 나선 유선 리본 렌더러
 * - 회오리 본체 외곽(반경 1.24배)을 감싸며 고속 3D 나선 회전
 * - [핵심 유저 요구 완벽 구현]: "이 선은 3D로 이루어짐 흰색 외각 투명"
 *   - 중심 코어: 순백색 (#FFFFFF)
 *   - 외각(세그먼트 시작/끝점 및 스트로크 외곽 테두리): 완벽한 0.0 투명도 페이드아웃
 *   - Z축 분리: Behind(Z < 0)와 Front(Z >= 0)로 대상을 감싸며 완벽한 3D 입체 투영
 */
function drawWhirlpoolOuter3DLines(
  ctx: any,
  centerX: number,
  baseY: number,
  curHeight: number,
  baseRot: number,
  alpha: number,
  isBehind: boolean
) {
  if (alpha <= 0.01 || curHeight <= 6) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));

  const numLines = 4;   // 4개의 3D 외각 유선
  const steps = 80;     // 정밀 곡선 보간
  const turns = 2.1;    // 회오리를 따라 2.1바퀴 3D 나선 회전
  const radMult = 1.28; // 회오리 본체 외곽에 위치

  for (let l = 0; l < numLines; l++) {
    const phaseOffset = (l * Math.PI * 2) / numLines;
    const rotSpeed = baseRot; // 일관된 회전 속도 (스트로보 왜곡 방지)

    let currentChunk: { x: number; y: number; u: number; z: number }[] = [];

    const flushChunk = () => {
      if (currentChunk.length < 2) {
        currentChunk = [];
        return;
      }

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const startPt = currentChunk[0];
      const endPt = currentChunk[currentChunk.length - 1];
      const avgU = (startPt.u + endPt.u) * 0.5;
      const uFade = Math.sin(Math.max(0, Math.min(1, avgU)) * Math.PI);

      const depthFactor = isBehind ? 0.38 : 0.95;
      const peakAlpha = depthFactor * (0.35 + 0.65 * uFade);
      const w = (isBehind ? 4.5 : 9.5) + avgU * 4.5;

      // 1. 외각 투명 글로우 패스 (선 양 끝단 및 외곽 투명화: 흰색 외각 투명)
      const glowGrad = ctx.createLinearGradient(startPt.x, startPt.y, endPt.x, endPt.y);
      glowGrad.addColorStop(0.0, "rgba(56, 189, 248, 0.0)");
      glowGrad.addColorStop(0.25, `rgba(56, 189, 248, ${peakAlpha * 0.45})`);
      glowGrad.addColorStop(0.75, `rgba(56, 189, 248, ${peakAlpha * 0.45})`);
      glowGrad.addColorStop(1.0, "rgba(56, 189, 248, 0.0)");

      ctx.strokeStyle = glowGrad;
      ctx.lineWidth = w * 2.1;
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      for (let j = 1; j < currentChunk.length; j++) {
        ctx.lineTo(currentChunk[j].x, currentChunk[j].y);
      }
      ctx.stroke();

      // 2. 바디 리본 패스 (밝은 하늘빛-백색 바디)
      const bodyGrad = ctx.createLinearGradient(startPt.x, startPt.y, endPt.x, endPt.y);
      bodyGrad.addColorStop(0.0, "rgba(186, 230, 253, 0.0)");
      bodyGrad.addColorStop(0.20, `rgba(186, 230, 253, ${peakAlpha * 0.80})`);
      bodyGrad.addColorStop(0.80, `rgba(186, 230, 253, ${peakAlpha * 0.80})`);
      bodyGrad.addColorStop(1.0, "rgba(186, 230, 253, 0.0)");

      ctx.strokeStyle = bodyGrad;
      ctx.lineWidth = w * 1.15;
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      for (let j = 1; j < currentChunk.length; j++) {
        ctx.lineTo(currentChunk[j].x, currentChunk[j].y);
      }
      ctx.stroke();

      // 3. 중심 순백 코어선 패스 (선명한 흰색 중심 + 양끝 투명 그라데이션)
      const coreGrad = ctx.createLinearGradient(startPt.x, startPt.y, endPt.x, endPt.y);
      coreGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
      coreGrad.addColorStop(0.20, `rgba(255, 255, 255, ${peakAlpha * 0.95})`);
      coreGrad.addColorStop(0.80, `rgba(255, 255, 255, ${peakAlpha * 0.95})`);
      coreGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

      ctx.strokeStyle = coreGrad;
      ctx.lineWidth = Math.max(2.6, w * 0.35);
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      for (let j = 1; j < currentChunk.length; j++) {
        ctx.lineTo(currentChunk[j].x, currentChunk[j].y);
      }
      ctx.stroke();

      ctx.restore();
      currentChunk = [];
    };

    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const ang = phaseOffset + rotSpeed + u * turns * Math.PI * 2;
      const rad = getWhirlpoolRadius(u) * radMult;

      const x = centerX + Math.cos(ang) * rad;
      const z = Math.sin(ang);
      const y = baseY - u * curHeight + z * (rad * 0.26);

      const isInCurrentPass = isBehind ? z < 0.05 : z > -0.05;

      if (isInCurrentPass) {
        currentChunk.push({ x, y, u, z });
      } else {
        flushChunk();
      }
    }
    flushChunk();
  }

  ctx.restore();
}

/**
 * 7. [유저 이미지 1:1 완벽 반영]: 외각 상단 및 하단 거대 회오리 선 밴드 (Outer Whirlwind Accent Swoosh Bands)
 * - 유저가 캡처 이미지에서 빨간색으로 직접 강조한 바로 그 '외각에 추가적인 회오리 선'!
 *   1) 상단 외각 회오리 띠: u=0.70~0.92 구간에서 넓게 나팔꽃처럼 펼쳐지며 대상 머리 위를 감싸 도는 거대 순백-하늘색 유선
 *   2) 하단 외각 회오리 띠: u=0.15~0.38 구간에서 대상의 발밑/허리를 감싸며 앞으로 둥글게 휘어지는 거대 순백-하늘색 유선
 *   3) 중간 외각 보조 회오리 띠: u=0.42~0.65 구간에서 중심부를 감싸며 흐르는 다이내믹 유선
 * - 두께감 있는 와이드 리본(14~24px) + 중심 순백색(#FFFFFF) + 외곽 0.0 투명도(흰색 외각 투명)
 */
function drawWhirlpoolOuterAccentSwooshes(
  ctx: any,
  centerX: number,
  baseY: number,
  curHeight: number,
  baseRot: number,
  alpha: number,
  isBehind: boolean
) {
  if (alpha <= 0.01 || curHeight <= 8) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));

  const swooshes = [
    // 1. [상단 외각 회오리 선]: 유저 캡처 상단 빨간 원 위치 (u: 0.70 ~ 0.92, radMult: 1.38)
    {
      uMin: 0.70,
      uMax: 0.92,
      radMult: 1.38,
      phaseOffset: 0.0,
      turns: 1.35,
      baseW: isBehind ? 8.5 : 16.5,
    },
    // 2. [하단 외각 회오리 선]: 유저 캡처 하단 빨간 원 위치 (u: 0.15 ~ 0.38, radMult: 1.32)
    {
      uMin: 0.15,
      uMax: 0.38,
      radMult: 1.32,
      phaseOffset: Math.PI * 0.9,
      turns: 1.35,
      baseW: isBehind ? 7.5 : 14.5,
    },
    // 3. [중간 외각 보조 회오리 선]: 상단과 하단을 자연스럽게 잇는 볼륨감 (u: 0.42 ~ 0.65, radMult: 1.35)
    {
      uMin: 0.42,
      uMax: 0.65,
      radMult: 1.35,
      phaseOffset: Math.PI * 0.45,
      turns: 1.35,
      baseW: isBehind ? 8.0 : 15.0,
    },
  ];

  const steps = 60;

  for (const sw of swooshes) {
    const rotSpeed = baseRot;
    let currentChunk: { x: number; y: number; u: number; z: number }[] = [];

    const flushChunk = () => {
      if (currentChunk.length < 2) {
        currentChunk = [];
        return;
      }

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const startPt = currentChunk[0];
      const endPt = currentChunk[currentChunk.length - 1];
      const avgU = (startPt.u + endPt.u) * 0.5;

      // sw.uMin ~ sw.uMax 사이에서 부드러운 사인 아치 페이드
      const uRel = (avgU - sw.uMin) / (sw.uMax - sw.uMin);
      const uFade = Math.sin(Math.max(0, Math.min(1, uRel)) * Math.PI);

      const depthFactor = isBehind ? 0.42 : 1.0;
      const peakAlpha = depthFactor * (0.40 + 0.60 * uFade);
      const w = sw.baseW * (0.85 + 0.30 * uFade);

      // 1. 외각 투명 글로우 패스 (하늘색 소프트 오라: 외각 투명)
      const glowGrad = ctx.createLinearGradient(startPt.x, startPt.y, endPt.x, endPt.y);
      glowGrad.addColorStop(0.0, "rgba(56, 189, 248, 0.0)");
      glowGrad.addColorStop(0.20, `rgba(56, 189, 248, ${peakAlpha * 0.50})`);
      glowGrad.addColorStop(0.50, `rgba(186, 230, 253, ${peakAlpha * 0.65})`);
      glowGrad.addColorStop(0.80, `rgba(56, 189, 248, ${peakAlpha * 0.50})`);
      glowGrad.addColorStop(1.0, "rgba(56, 189, 248, 0.0)");

      ctx.strokeStyle = glowGrad;
      ctx.lineWidth = w * 2.2;
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      for (let j = 1; j < currentChunk.length; j++) {
        ctx.lineTo(currentChunk[j].x, currentChunk[j].y);
      }
      ctx.stroke();

      // 2. 바디 리본 패스 (밝은 하늘빛-백색 바디)
      const bodyGrad = ctx.createLinearGradient(startPt.x, startPt.y, endPt.x, endPt.y);
      bodyGrad.addColorStop(0.0, "rgba(186, 230, 253, 0.0)");
      bodyGrad.addColorStop(0.20, `rgba(186, 230, 253, ${peakAlpha * 0.85})`);
      bodyGrad.addColorStop(0.50, `rgba(224, 242, 254, ${peakAlpha * 0.95})`);
      bodyGrad.addColorStop(0.80, `rgba(186, 230, 253, ${peakAlpha * 0.85})`);
      bodyGrad.addColorStop(1.0, "rgba(186, 230, 253, 0.0)");

      ctx.strokeStyle = bodyGrad;
      ctx.lineWidth = w * 1.15;
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      for (let j = 1; j < currentChunk.length; j++) {
        ctx.lineTo(currentChunk[j].x, currentChunk[j].y);
      }
      ctx.stroke();

      // 3. 중심 순백 코어선 패스 (선명한 순백색 중심: 흰색 외각 투명 완벽 완성)
      const coreGrad = ctx.createLinearGradient(startPt.x, startPt.y, endPt.x, endPt.y);
      coreGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
      coreGrad.addColorStop(0.20, `rgba(255, 255, 255, ${peakAlpha * 0.98})`);
      coreGrad.addColorStop(0.50, `rgba(255, 255, 255, ${peakAlpha * 1.0})`);
      coreGrad.addColorStop(0.80, `rgba(255, 255, 255, ${peakAlpha * 0.98})`);
      coreGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

      ctx.strokeStyle = coreGrad;
      ctx.lineWidth = Math.max(3.2, w * 0.38);
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      for (let j = 1; j < currentChunk.length; j++) {
        ctx.lineTo(currentChunk[j].x, currentChunk[j].y);
      }
      ctx.stroke();

      ctx.restore();
      currentChunk = [];
    };

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const u = sw.uMin + t * (sw.uMax - sw.uMin);
      const ang = sw.phaseOffset + rotSpeed + t * sw.turns * Math.PI * 2;
      const rad = getWhirlpoolRadius(u) * sw.radMult;

      const x = centerX + Math.cos(ang) * rad;
      const z = Math.sin(ang);
      const y = baseY - u * curHeight + z * (rad * 0.28);

      const isInCurrentPass = isBehind ? z < 0.05 : z > -0.05;

      if (isInCurrentPass) {
        currentChunk.push({ x, y, u, z });
      } else {
        flushChunk();
      }
    }
    flushChunk();
  }

  ctx.restore();
}

/**
 * 7. 바다회오리 소산 시 파열 물방울 및 비산 물보라
 */
function drawWhirlpoolBurstSplash(
  ctx: any,
  centerX: number,
  baseY: number,
  maxHeight: number,
  prog: number
) {
  const alpha = Math.max(0, 1.0 - prog);
  if (alpha <= 0.01) return;

  ctx.save();
  const numDroplets = 24;
  for (let i = 0; i < numDroplets; i++) {
    const ang = (i * Math.PI * 2) / numDroplets + 0.2;
    const u = 0.2 + ((i * 13) % 65) / 100;
    const speed = 25 + (i % 7) * 8;
    const dist = speed * prog;
    const px = centerX + Math.cos(ang) * (getWhirlpoolRadius(u) + dist);
    const py = baseY - u * maxHeight + Math.sin(ang) * (dist * 0.45) + prog * prog * 18;
    const r = Math.max(0.8, (3.5 - prog * 2.0));

    ctx.fillStyle = `rgba(186, 230, 253, ${alpha * 0.85})`;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ============================================================================
// [공개 렌더러]: 1. 후면 레이어 (대상 포켓몬의 뒤쪽: Z < 0)
// ============================================================================
export function drawWhirlpoolBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showBehindEffect && !frame.showEffect) return;
  const step = frame.moveStep || 1;
  const prog = frame.effectProgress || 0;
  const targetPos = drawCtx.targetPos;
  const centerX = targetPos.x;
  const baseY = targetPos.y + 40;
  const maxHeight = 155;
  const width = drawCtx.width || 512;
  const height = drawCtx.height || 384;

  // 전체 프레임에 걸쳐 끊김 없이 연속되는 단조 증가 회전각
  const baseRot = frame.whirlpoolRot ?? ((step - 1) * 3.5 + prog * 3.5);

  ctx.save();

  // [Step 1: 주변 푸른색 물듦 시작 & 바닥 물소용돌이 및 하늘색 회오리 발생 회전 - 후면]
  if (step === 1) {
    const intensity = Math.min(0.85, 0.40 + prog * 0.45);
    // 1. 주변이 푸른색으로 물듦 (전체 화면 100% 완전 커버)
    drawWhirlpoolAmbientBlue(ctx, width, height, centerX, targetPos.y, intensity);
    // 2. 바닥 수면 물결 리플 후면
    drawWhirlpoolBaseWater(ctx, centerX, baseY, baseRot, true, Math.min(1.0, 0.50 + prog * 0.50));

    // 3. 솟구치기 시작하는 하늘색 회오리 본체 후면
    const curHeight = Math.max(15, 20 + prog * 60);
    const alpha = Math.min(0.88, 0.35 + prog * 0.53);
    drawWhirlpoolWaterBody(ctx, centerX, baseY, curHeight, alpha, true);
    drawWhirlpoolSkyBlueTorrents(ctx, centerX, baseY, curHeight, baseRot, alpha, true);
    drawWhirlpoolBubbles(ctx, centerX, baseY, curHeight, baseRot, alpha, true);
    drawWhirlpoolOuter3DLines(ctx, centerX, baseY, curHeight, baseRot, alpha, true);
    drawWhirlpoolOuterAccentSwooshes(ctx, centerX, baseY, curHeight, baseRot, alpha, true);
  }

  // [Step 2: 3D 하늘색 바다회오리 최대 솟구침 & 거품 회전 & 외각 3D 백색 유선 지속 회전 - 후면]
  if (step === 2) {
    const curHeight = Math.min(maxHeight, 80 + prog * 75);

    // 1. 주변이 푸른색으로 물듦 (최대 정점 유지 - 선명하고 깊은 로열/오션 블루, 전체 화면 커버)
    drawWhirlpoolAmbientBlue(ctx, width, height, centerX, targetPos.y, 0.85);

    // 2. 바닥 밑동 수면 물결 후면
    drawWhirlpoolBaseWater(ctx, centerX, baseY, baseRot, true, 0.95);

    // 3. 3D 하늘색 물소용돌이 기둥 바디 후면
    drawWhirlpoolWaterBody(ctx, centerX, baseY, curHeight, 0.92, true);

    // 4. 표면 고속 회전 하늘색 나선 급류 밴드 후면
    drawWhirlpoolSkyBlueTorrents(ctx, centerX, baseY, curHeight, baseRot, 0.92, true);

    // 5. 회오리 내부 거품(Bubbles) 지속 회전 후면 (Z < 0)
    drawWhirlpoolBubbles(ctx, centerX, baseY, curHeight, baseRot, 0.92, true);

    // 6. 회오리 외각 3D 백색 외각 투명 유선 후면 (Z < 0)
    drawWhirlpoolOuter3DLines(ctx, centerX, baseY, curHeight, baseRot, 0.92, true);

    // 7. 유저 이미지 1:1 외각 상단 및 하단 거대 회오리 선 밴드 후면 (Z < 0)
    drawWhirlpoolOuterAccentSwooshes(ctx, centerX, baseY, curHeight, baseRot, 0.95, true);
  }

  // [Step 3: 회오리 소산 & 거품 물보라 비산 & 푸른빛 해제 - 후면]
  if (step === 3) {
    const alpha = Math.max(0, 1.0 - prog);

    // 푸른빛 서서히 페이드아웃 (전체 화면 커버)
    drawWhirlpoolAmbientBlue(ctx, width, height, centerX, targetPos.y, 0.85 * alpha);

    // 바닥 물결 및 소용돌이 소산 (회전은 멈춤 없이 끝까지 지속)
    drawWhirlpoolBaseWater(ctx, centerX, baseY, baseRot, true, alpha * 0.65);
    drawWhirlpoolWaterBody(ctx, centerX, baseY, maxHeight, alpha * 0.75, true);
    drawWhirlpoolSkyBlueTorrents(ctx, centerX, baseY, maxHeight, baseRot, alpha * 0.75, true);
    drawWhirlpoolBubbles(ctx, centerX, baseY, maxHeight, baseRot, alpha * 0.75, true);
    drawWhirlpoolOuter3DLines(ctx, centerX, baseY, maxHeight, baseRot, alpha * 0.75, true);
    drawWhirlpoolOuterAccentSwooshes(ctx, centerX, baseY, maxHeight, baseRot, alpha * 0.75, true);
  }

  ctx.restore();
}

// ============================================================================
// [공개 렌더러]: 2. 전면 레이어 (대상 포켓몬의 앞쪽: Z >= 0)
// ============================================================================
export function drawWhirlpoolEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const step = frame.moveStep || 1;
  const prog = frame.effectProgress || 0;
  const targetPos = drawCtx.targetPos;
  const centerX = targetPos.x;
  const baseY = targetPos.y + 40;
  const maxHeight = 155;
  const width = drawCtx.width || 512;
  const height = drawCtx.height || 384;

  // 전체 프레임에 걸쳐 끊김 없이 연속되는 단조 증가 회전각
  const baseRot = frame.whirlpoolRot ?? ((step - 1) * 3.5 + prog * 3.5);

  ctx.save();

  // [Step 1: 바닥 물소용돌이 전개 & 하늘색 회오리 발생 회전 - 전면]
  if (step === 1) {
    const alpha = Math.min(1.0, 0.40 + prog * 0.60);
    // 전면 미세 파란색 틴트 페이드인 (전체 화면 100% 완전 커버)
    ctx.save();
    ctx.fillStyle = `rgba(29, 78, 216, ${0.08 * prog})`;
    ctx.fillRect(-6000, -6000, 14000, 14000);
    ctx.restore();

    drawWhirlpoolBaseWater(ctx, centerX, baseY, baseRot, false, alpha);

    // 솟구치기 시작하는 하늘색 회오리 본체 전면
    const curHeight = Math.max(15, 20 + prog * 60);
    drawWhirlpoolWaterBody(ctx, centerX, baseY, curHeight, alpha, false);
    drawWhirlpoolSkyBlueTorrents(ctx, centerX, baseY, curHeight, baseRot, alpha, false);
    drawWhirlpoolBubbles(ctx, centerX, baseY, curHeight, baseRot, alpha, false);
    drawWhirlpoolOuter3DLines(ctx, centerX, baseY, curHeight, baseRot, alpha, false);
    drawWhirlpoolOuterAccentSwooshes(ctx, centerX, baseY, curHeight, baseRot, alpha, false);
  }

  // [Step 2: 3D 하늘색 바다회오리 최대 솟구침 & 거품 회전 & 외각 3D 백색 유선 회전 - 전면]
  if (step === 2) {
    const curHeight = Math.min(maxHeight, 80 + prog * 75);

    // 1. 전면 미세 앰비언트 블루 톤 (포켓몬을 덮는 선명한 파란 물빛 틴트 - 전체 화면 100% 완전 커버)
    ctx.save();
    ctx.fillStyle = "rgba(29, 78, 216, 0.14)";
    ctx.fillRect(-6000, -6000, 14000, 14000);
    ctx.restore();

    // 2. 바닥 밑동 수면 물결 전면
    drawWhirlpoolBaseWater(ctx, centerX, baseY, baseRot, false, 0.98);

    // 3. 3D 하늘색 물소용돌이 기둥 바디 전면
    drawWhirlpoolWaterBody(ctx, centerX, baseY, curHeight, 0.98, false);

    // 4. 표면 고속 회전 하늘색 나선 급류 밴드 전면
    drawWhirlpoolSkyBlueTorrents(ctx, centerX, baseY, curHeight, baseRot, 0.98, false);

    // 5. 회오리 내부 거품(Bubbles) 전면 (Z >= 0)
    drawWhirlpoolBubbles(ctx, centerX, baseY, curHeight, baseRot, 0.98, false);

    // 6. 회오리 외각 3D 백색 외각 투명 유선 전면 (Z >= 0)
    drawWhirlpoolOuter3DLines(ctx, centerX, baseY, curHeight, baseRot, 0.98, false);

    // 7. 유저 이미지 1:1 외각 상단 및 하단 거대 회오리 선 밴드 전면 (Z >= 0)
    drawWhirlpoolOuterAccentSwooshes(ctx, centerX, baseY, curHeight, baseRot, 0.98, false);
  }

  // [Step 3: 회오리 소산 & 거품 물보라 비산 - 전면]
  if (step === 3) {
    const alpha = Math.max(0, 1.0 - prog);

    // 전면 미세 앰비언트 블루 톤 페이드아웃 (전체 화면 100% 완전 커버)
    ctx.save();
    ctx.fillStyle = `rgba(29, 78, 216, ${0.14 * alpha})`;
    ctx.fillRect(-6000, -6000, 14000, 14000);
    ctx.restore();

    drawWhirlpoolBaseWater(ctx, centerX, baseY, baseRot, false, alpha * 0.70);
    drawWhirlpoolWaterBody(ctx, centerX, baseY, maxHeight, alpha * 0.75, false);
    drawWhirlpoolSkyBlueTorrents(ctx, centerX, baseY, maxHeight, baseRot, alpha * 0.75, false);
    drawWhirlpoolBubbles(ctx, centerX, baseY, maxHeight, baseRot, alpha * 0.75, false);
    drawWhirlpoolOuter3DLines(ctx, centerX, baseY, maxHeight, baseRot, alpha * 0.75, false);
    drawWhirlpoolOuterAccentSwooshes(ctx, centerX, baseY, maxHeight, baseRot, alpha * 0.75, false);

    // 소산 시 파열하는 물방울 물보라
    drawWhirlpoolBurstSplash(ctx, centerX, baseY, maxHeight, prog);
  }

  ctx.restore();
}

// ============================================================================
// 🥊 251: 집단구타 (Beat Up / ふくろだたき) - 악 타입 물리 기술
//
// 위력: 특수(파티원 공격력 비례) / 명중: 100 / PP: 10 / 접촉: O
// 설명: 같은 편 전원이 공격한다. 동료 포켓몬이 많을수록 기술의 공격 횟수가 증가한다.
//
// [유저 요구사항 완벽 반영]:
// 1. [회색과 보라색이 섞인 주먹]:
//    - 코멧펀치나 펀치류 기술에 사용했던 공식 주먹 스프라이트에
//      회색(#ADADA5)과 보라색(#A5A5DE)이 조화롭게 섞인 색상을 씌운 전용 주먹
//    - 하이라이트는 연보라빛 실버, 미드톤은 회보라, 섀도우는 다크 슬레이트 바이올렛
//    - SVG 폴백(drawBeatUpFistSvg) 역시 회색-보라 그라데이션 및 실버 림으로 100% 매칭!
// 2. [타격 이펙트는 따라가때리기 참고]:
//    - 타격 직격 순간 순백 코어 -> 연보라/회색 섬광 플래시(drawBeatUpHitBurst)
//    - 안쪽 선 색상(#A5A5DE) 8각 날카로운 스타버스트(drawBeatUpSharpImpact)
//    - 사방으로 팍 퍼지는 2톤(회색+연보라) 점 파티클 & 꼬리 트레일(drawBeatUpTwoToneOrb)
// 3. [퍼지는 효과]:
//    - 타격점 중심에서 사방 360도로 2톤 점 파티클이 시원하게 확 퍼져나감
//    - 피날레 타격 시 파티클 확산 반경과 개수 대폭 증가로 피니시 쾌감 극대화!
// 4. [주먹의 개수는 보유한 포켓몬에 따라 달라짐]:
//    - 파티 내 살아있는 포켓몬 수(1~6마리)만큼 주먹이 생성되어 각기 다른 궤적으로 연속 타격!
//    - 각 포켓몬의 주먹마다 쇄도 각도, 타격 부위(좌상단, 우측, 하단 어퍼컷 등) 다변화
// ============================================================================

export interface BeatUpPunchTrack {
  angle: number;       // 주먹이 날아오는 방향 (라디안)
  startDist: number;   // 발사 시작 거리 (px)
  hitOffsetX: number;  // 타격점 오프셋 X (적 중심 기준)
  hitOffsetY: number;  // 타격점 오프셋 Y
  punchScale: number;  // 주먹 크기 배율
}

/** 보유 포켓몬 최대 6마리에 대응하는 다각도 난무 주먹 궤적 */
export const BEAT_UP_TRACKS: BeatUpPunchTrack[] = [
  // 1번 포켓몬: 좌상단에서 비스듬히 안면으로 쇄도
  { angle: -Math.PI * 0.72, startDist: 62, hitOffsetX: -16, hitOffsetY: -24, punchScale: 0.58 },
  // 2번 포켓몬: 우측에서 들어오는 날카로운 훅
  { angle: 0.12, startDist: 65, hitOffsetX: 18, hitOffsetY: -10, punchScale: 0.60 },
  // 3번 포켓몬: 좌하단에서 솟구치는 번개같은 어퍼컷
  { angle: Math.PI * 0.76, startDist: 58, hitOffsetX: -12, hitOffsetY: 8, punchScale: 0.62 },
  // 4번 포켓몬: 우상단에서 내리꽂는 묵직한 오버핸드
  { angle: -Math.PI * 0.28, startDist: 64, hitOffsetX: 15, hitOffsetY: -28, punchScale: 0.60 },
  // 5번 포켓몬: 좌측 중하단 복부 파고드는 바디블로우
  { angle: Math.PI * 0.94, startDist: 62, hitOffsetX: -18, hitOffsetY: -2, punchScale: 0.64 },
  // 6번 포켓몬 (피날레): 상공 정면에서 꽂히는 결정타 대형 정권 스트레이트!
  { angle: -Math.PI * 0.50, startDist: 75, hitOffsetX: 0, hitOffsetY: -15, punchScale: 0.78 },
];

/**
 * 🥊 어두운 회보라색(#946394) 정면 정권 SVG 폴백 (흰색 완전 배제)
 */
function drawBeatUpFistSvg(
  ctx: any,
  x: number,
  y: number,
  scale: number = 1.35,
  alpha: number = 1.0
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  // [유저 요청 엄수]: 흰색 완전 배제 & 유저 지정 #946394 (R: 148, G: 99, B: 148) 그라데이션 적용
  const fistGrad = ctx.createLinearGradient(-15, -15, 15, 15);
  fistGrad.addColorStop(0.0, "#946394"); // 유저 지정 메인 컬러 #946394 (R: 148, G: 99, B: 148)
  fistGrad.addColorStop(0.45, "#7E527E"); // 차분한 미드톤
  fistGrad.addColorStop(1.0, "#4D2E4D"); // 딥 바이올렛 그레이 섀도우 (R: 77, G: 46, B: 77)

  ctx.fillStyle = fistGrad;
  ctx.strokeStyle = "#2B172B"; // 딥 섀도우 외곽선
  ctx.lineWidth = 3.0;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // 정권 주먹 외곽선
  ctx.beginPath();
  ctx.moveTo(-14, 18);
  ctx.lineTo(14, 18);
  ctx.lineTo(18, 10);
  ctx.lineTo(20, -2);
  ctx.arc(15, -9, 5.0, 0, Math.PI, true);
  ctx.arc(5, -12, 5.2, 0, Math.PI, true);
  ctx.arc(-5, -12, 5.2, 0, Math.PI, true);
  ctx.arc(-15, -9, 5.0, 0, Math.PI, true);
  ctx.lineTo(-20, -2);
  ctx.lineTo(-18, 10);
  ctx.lineTo(-14, 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 손가락 마디 주름선
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = "#4D2E4D";
  ctx.beginPath();
  ctx.moveTo(-10, -9); ctx.lineTo(-10, 3);
  ctx.moveTo(0, -12); ctx.lineTo(0, 3);
  ctx.moveTo(10, -9); ctx.lineTo(10, 3);
  ctx.moveTo(-15, -2); ctx.lineTo(15, -2);
  ctx.stroke();

  ctx.restore();
}

/**
 * 🥊 #946394 회보라색 틴팅 공식 주먹 스프라이트 렌더러
 */
function drawBeatUpPunchFist(
  ctx: any,
  cx: number,
  cy: number,
  scale: number,
  alpha: number,
  rot: number = 0
) {
  if (alpha <= 0.01 || scale <= 0.02) return;
  ctx.save();
  ctx.translate(cx, cy);
  if (rot !== 0) ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const fistCanvas = getBeatUpFistCanvas();
  if (fistCanvas) {
    const fw = fistCanvas.width;
    const fh = fistCanvas.height;
    ctx.drawImage(fistCanvas, -fw / 2, -fh / 2, fw, fh);
  } else {
    drawBeatUpFistSvg(ctx, 0, 0, 1.8, 1.0);
  }
  ctx.restore();
}

/**
 * 💥 따라가때리기 참고: 코어 섬광 플래시 (흰색 완전 배제, 100% #946394 톤)
 * [유저 요청 엄수]: 흰색 부분 없이 #946394 (R: 148, G: 99, B: 148) 색상 계열로만 구현
 */
function drawBeatUpHitBurst(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  scaleMult: number = 1.0
) {
  if (progress > 0.40) return;
  const alpha = Math.max(0, 1.0 - progress / 0.40);
  if (alpha <= 0.01) return;

  ctx.save();
  const coreR = (12 + progress * 18) * scaleMult;
  const flashGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
  // [유저 요청 엄수]: 흰색/밝은 하이라이트 완전 배제! 순수 #946394 그라데이션
  flashGrad.addColorStop(0.00, `rgba(148, 99, 148, ${1.0 * alpha})`); // #946394 코어
  flashGrad.addColorStop(0.35, `rgba(148, 99, 148, ${0.95 * alpha})`); // #946394 메인 컬러
  flashGrad.addColorStop(0.68, `rgba(99, 64, 99, ${0.85 * alpha})`);   // #634063 딥 미드톤
  flashGrad.addColorStop(0.90, `rgba(60, 34, 60, ${0.45 * alpha})`);   // #3C223C 섀도우
  flashGrad.addColorStop(1.00, "rgba(30, 16, 30, 0.0)");

  ctx.fillStyle = flashGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 💥 따라가때리기 참고: 8각 날카로운 스타버스트 (흰색 림/코어 완전 배제, #946394 톤)
 * [유저 요청 엄수]: 흰색 림/코어 제거, #946394 기반 림 및 딥 퍼플그레이 채움
 */
function drawBeatUpSharpImpact(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  scaleMult: number = 1.0
) {
  if (progress > 0.40) return;
  const alpha = Math.max(0, 1.0 - progress / 0.40);
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(progress * 0.55);

  const outerR = (12 + progress * 20) * scaleMult;
  const innerR = outerR * 0.38;
  const points = 8;

  // [유저 요청 엄수]: 흰색 림 완전 배제!
  // 채움: 딥 바이올렛 그레이 (#634063), 림(외곽선): #946394
  ctx.fillStyle = `rgba(99, 64, 99, ${0.95 * alpha})`; // #634063
  ctx.strokeStyle = `rgba(148, 99, 148, ${1.0 * alpha})`; // #946394 림 (흰색 X)
  ctx.lineWidth = 1.8 * Math.min(1.5, scaleMult);
  ctx.lineJoin = "miter";
  ctx.miterLimit = 4;

  ctx.beginPath();
  const step = Math.PI / points;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = i * step - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 중앙부 미니 코어: 흰색 완전 배제, 메인 컬러 #946394 코어
  ctx.fillStyle = `rgba(148, 99, 148, ${1.0 * alpha})`; // #946394 (흰색 X)
  ctx.beginPath();
  ctx.arc(0, 0, outerR * 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 🔮 따라가때리기 참고: 2톤 발광 구체 알갱이 (흰색 부분 완전 배제 & #946394 기반)
 * [유저 요청 엄수]: 점 파티클의 중심부 색깔을 글로우 색깔(#946394)과 100% 동일하게 적용!
 */
function drawBeatUpTwoToneOrb(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number,
  isInnerColor: boolean
) {
  if (alpha <= 0.01 || radius <= 0.5) return;
  ctx.save();

  // [유저 요청 완벽 반영]:
  // 1. 흰색 부분 100% 완전 배제 (코어 포함 흰색 전혀 없음)
  // 2. 점 파티클의 중심부 색깔도 글로우 색깔로 동일하게 적용!
  //    - 톤 1 (메인 #946394): R 148, G 99, B 148
  //    - 톤 2 (어두운 회보라): R 110, G 72, B 110
  const [r, g, b] = isInnerColor ? [148, 99, 148] : [110, 72, 110];

  // [유저 요청 핵심]: 점 파티클 중심부 색깔 = 글로우 색깔!
  const coreColor = `rgba(${r}, ${g}, ${b}, ${1.0 * alpha})`;

  // 1. 외곽 #946394 발광 글로우
  const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.6);
  glowGrad.addColorStop(0.00, coreColor);
  glowGrad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${0.90 * alpha})`);
  glowGrad.addColorStop(0.70, `rgba(${r}, ${g}, ${b}, ${0.45 * alpha})`);
  glowGrad.addColorStop(1.00, `rgba(${r}, ${g}, ${b}, 0.0)`);

  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.6, 0, Math.PI * 2);
  ctx.fill();

  // 2. 중심부 코어: 글로우 색깔과 100% 동일한 색상으로 채움 (흰색이나 밝은 하이라이트 일절 없음)
  ctx.fillStyle = coreColor;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.70, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 💥 따라가때리기 참고: 사방으로 팍 하고 퍼지는 #946394 2톤 점 파티클
 */
function drawBeatUpTwoToneBurst(
  ctx: any,
  cx: number,
  cy: number,
  hitProg: number,
  isClimax: boolean = false
) {
  const particleCount = isClimax ? 16 : 10;
  const burstEase = 1.0 - Math.pow(1.0 - Math.min(1.0, hitProg), 2.2);

  let orbAlpha = 1.0;
  if (hitProg > 0.50) {
    const fadeT = (hitProg - 0.50) / 0.50;
    orbAlpha = Math.max(0.0, 1.0 - Math.pow(fadeT, 1.2));
  }
  if (orbAlpha <= 0.01) return;

  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2 + ((i * 19) % 7) * 0.04;
    const baseDist = isClimax ? 48 : 34;
    const maxDist = baseDist + ((i * 13) % 4) * 8;
    const curDist = burstEase * maxDist;

    const px = cx + Math.cos(angle) * curDist;
    const py = cy + Math.sin(angle) * (curDist * 0.90);

    const baseRadius = (isClimax ? 5.2 : 4.4) + (i % 3) * 0.7;
    const curRadius = baseRadius * Math.max(0.35, 1.0 - hitProg * 0.60);

    // 메인 #946394와 어두운 섀도우 회보라 교차 믹스
    const isInnerColor = i % 2 === 0;

    // 메인 점 파티클
    drawBeatUpTwoToneOrb(ctx, px, py, curRadius, orbAlpha, isInnerColor);

    // 꼬리 트레일 미니 파티클
    if (curDist > 10 && hitProg < 0.85) {
      const trailDist = curDist * 0.68;
      const tx = cx + Math.cos(angle) * trailDist;
      const ty = cy + Math.sin(angle) * (trailDist * 0.90);
      const trailRadius = curRadius * 0.55;
      const trailAlpha = orbAlpha * 0.65;
      drawBeatUpTwoToneOrb(ctx, tx, ty, trailRadius, trailAlpha, !isInnerColor);
    }
  }
}

// ============================================================================
// [집단구타 렌더러: 1. 후면 레이어 (배경 미세 다크 암전 & 후방 비산 파편)]
// ============================================================================
export function drawBeatUpBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showBehindEffect && !frame.showEffect) return;
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;

  ctx.save();

  // 은은한 다크 회보라 배경 암전 (집단구타 분위기 고조)
  let dimAlpha = 0.30;
  if (step === 1) {
    dimAlpha = 0.30 * Math.min(1.0, prog * 2.0);
  } else if (step === 3) {
    dimAlpha = 0.30 * Math.max(0.0, 1.0 - prog);
  }

  if (dimAlpha > 0.01) {
    ctx.fillStyle = `rgba(28, 18, 28, ${dimAlpha})`;
    ctx.fillRect(-6000, -6000, 14000, 14000);
  }

  ctx.restore();
}

// ============================================================================
// [집단구타 렌더러: 2. 전면 레이어 (회색+보라 주먹 쇄도 & 따라가때리기 타격 폭발)]
// ============================================================================
export function drawBeatUpEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const isP = drawCtx.isPlayer;

  const targetCenter = getTargetSpriteCenter(drawCtx, frame);
  const cx = targetCenter.x;
  const cy = targetCenter.y;

  // Step 2: 포켓몬별 주먹 쇄도 및 따라가때리기 타격 연출
  if (step === 2) {
    const punchIndex = (frame as any).punchIndex ?? 0;
    const totalPunches = (frame as any).punchCount ?? 6;
    const isClimax = punchIndex === totalPunches - 1;

    // 해당 번호의 궤적 프로필 선택
    const track = BEAT_UP_TRACKS[punchIndex % BEAT_UP_TRACKS.length];
    const hitX = cx + track.hitOffsetX;
    const hitY = cy + track.hitOffsetY;

    // 타격 순간 분기 (0.0 ~ 0.38: 주먹 쇄도 접근, 0.38 ~ 1.0: 타격 폭발 & 주먹 페이드아웃)
    const hitThreshold = 0.38;

    if (prog < hitThreshold) {
      // 1) [주먹 쇄도 단계] 목표 타격점을 향해 날아오는 회색+보라 주먹
      const approachT = prog / hitThreshold;
      const easeApproach = Math.pow(approachT, 1.8);
      const curDist = track.startDist * (1.0 - easeApproach);

      const fistX = hitX + Math.cos(track.angle) * curDist;
      const fistY = hitY + Math.sin(track.angle) * curDist;

      // 주먹 비행 잔상 1회 (뒤쪽)
      if (curDist > 12) {
        const shadowDist = curDist + 14;
        const sx = hitX + Math.cos(track.angle) * shadowDist;
        const sy = hitY + Math.sin(track.angle) * shadowDist;
        drawBeatUpPunchFist(ctx, sx, sy, track.punchScale * 0.90, 0.30, track.angle + Math.PI / 2);
      }

      // 메인 주먹 본체
      drawBeatUpPunchFist(ctx, fistX, fistY, track.punchScale, 1.0, track.angle + Math.PI / 2);

    } else {
      // 2) [타격 직격 & 따라가때리기 폭발 단계] (prog >= hitThreshold)
      const hitProg = (prog - hitThreshold) / (1.0 - hitThreshold);

      // 주먹 직격 순간 찰나의 임팩트 스케일 & 페이드아웃 (hitProg < 0.28)
      if (hitProg < 0.28) {
        const punchAlpha = Math.max(0, 1.0 - hitProg / 0.28);
        const punchScale = track.punchScale * (1.0 + (0.28 - hitProg) * 0.4);
        drawBeatUpPunchFist(ctx, hitX, hitY, punchScale, punchAlpha * 0.95, track.angle + Math.PI / 2);
      }

      const scaleMult = isClimax ? 1.45 : 1.05;

      // 1. 따라가때리기 코어 섬광 플래시
      drawBeatUpHitBurst(ctx, hitX, hitY, hitProg, scaleMult);

      // 2. 따라가때리기 8각 날카로운 스타버스트
      drawBeatUpSharpImpact(ctx, hitX, hitY, hitProg, scaleMult);

      // 3. 따라가때리기 사방으로 팍 퍼지는 2톤 점 파티클
      drawBeatUpTwoToneBurst(ctx, hitX, hitY, hitProg, isClimax);
    }
  }

  // Step 3: 피날레 후속 잔여 파티클 소산
  if (step === 3) {
    const fadeProg = prog;
    const lingeringAlpha = Math.max(0, 1.0 - fadeProg);
    if (lingeringAlpha > 0.01) {
      // 잔여 2톤 파티클 서서히 공중 소산
      drawBeatUpTwoToneBurst(ctx, cx, cy - 15, 0.70 + fadeProg * 0.30, true);
    }
  }
}

// ============================================================================
// ✋ 252: 속이기 (Fake Out / ねこだまし) - 노말 타입 물리 기술
//
// 위력: 40 / 명중: 100 / PP: 10 / 우선도: +3 / 100% 상대 풀죽음 / 접촉: O
// 설명: 선제공격으로 상대를 풀죽게 한다. 배틀에 나가서 바로 쓰지 않으면 성공할 수 없다.
//
// [유저 요구사항 100% 완벽 반영]:
// 1. [양쪽에 태권당수 손이 90도로 서있는 애들]:
//    - 태권당수 공식 손바닥 스프라이트(getKarateBlackImg) 사용
//    - 90도 회전(rotate(Math.PI / 2))으로 손가락이 위를 향해 세로로 우뚝 섬
//    - 좌측 손: 좌측 외곽에서 엄지가 바깥(왼쪽), 손날이 안쪽(오른쪽)을 향함
//    - 우측 손: 우측 외곽에서 엄지가 바깥(오른쪽), 손날이 안쪽(왼쪽)을 향함
// 2. [위 아래로 움직이다가 부드럽게 (3번 (왼쪽이 위면 오른쪽은 아래))]:
//    - 사인 곡선(Math.sin)을 이용한 부드러운 유선형 교차 상하 운동 (총 3사이클)
//    - "왼쪽이 위면 오른쪽은 아래":
//      leftY = cy - wave * amp (wave > 0일 때 위로 이동)
//      rightY = cy + wave * amp (wave > 0일 때 아래로 이동)
//    - 미세 틸트 각도 및 부드러운 반투명 잔상 궤적으로 실키한 유체 애니메이션 연출
// 3. [마지막에 손이 맞닿으면서]:
//    - 3회 교차 운동 직후, 양손이 중심 타격점을 향해 급가속 쇄도(rush inward)하여
//      상대 포켓몬의 눈앞 정중앙(cx ± 8px)에서 손바닥이 찰싹 맞닿음(clap)!
// 4. [파란색 몸통박치기 이펙트 (중간이 투명그라데이션인(투명100%))]:
//    - 손이 맞닿는 순간 발생하는 파란색 몸통박치기 타격 충돌 폭발:
//    - ① [중간이 100% 투명한 방사형 섬광 코어 (drawFakeOutBlueFlashCore)]:
//         중심부(0.0 ~ 0.22 반경)는 100% 완전 투명(rgba(59, 130, 246, 0.0))!
//         0.48 반경부터 0.90 반경까지 진하고 영롱한 로열/일렉트릭 블루가 전개된 후 외곽 페이드아웃
//    - ② [중간이 100% 투명한 8각 만화풍 스타버스트 (drawFakeOutBlueSharpImpact)]:
//         몸통박치기 고유의 8각 스타버스트 내부 역시 중심부가 100% 투명한 파란색 그라데이션으로 채워짐
//         외곽은 선명한 하늘빛-순백 림(rgba(191, 219, 254, 0.95))
//    - ③ [파란색 고속 팽창 타원 충격파 링 (drawFakeOutBlueShockwaveRings)]:
//         몸통박치기 고유의 팽창 충격파 링이 시원한 로열 블루/하늘색 2중 링으로 퍼져나감
//    - ④ [사방 비산 4방향 레트로 파란 별빛 스파크 (drawFakeOutBlueRetroStars)]:
//         몸통박치기 고유의 4방향 레트로 히트 스타들이 사방으로 회전 비산 (#3B82F6, #60A5FA, #93C5FD)
//    - ⑤ [충돌 관통 모멘텀 파란 스피드 속도선 (drawFakeOutBlueMomentumStreaks)]:
//         타격점을 수평으로 가로지르는 3줄의 파란색 속도선
// ============================================================================

/**
 * ✋ 90도로 우뚝 선 태권당수 손바닥 단일 렌더러
 * [유저 요청 완벽 반영]:
 * - "각도는 90도 맞춰줘 다시": 3D 틸트 제거하고 정확히 90도 직립 회전(rotate(Math.PI / 2))
 * - "손 바닥부분 흰색": 손바닥 내부가 순백색(#FFFFFF)인 전용 스프라이트 사용
 * - 좌측 손: 엄지가 바깥(왼쪽), 손날이 안쪽(오른쪽)
 * - 우측 손: 엄지가 바깥(오른쪽), 손날이 안쪽(왼쪽)
 */
export function drawFakeOutHand(
  ctx: any,
  x: number,
  y: number,
  isLeftHand: boolean,
  alpha: number,
  scale: number = 0.95,
  thinFactor: number = 0 // 0: 원본 두께, >0: 내려치며 5개 슬라이스 분리 및 안쪽부터 얇아짐
) {
  if (alpha <= 0.01) return;
  const sprite = getKarateWhiteImg();
  if (!sprite) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));
  ctx.translate(x, y);

  // 좌우 대칭 (손날이 타격점 안쪽을 향함)
  if (isLeftHand) {
    ctx.scale(-scale, scale);
  } else {
    ctx.scale(scale, scale);
  }

  // 90도 직립 회전 (손가락이 위를 향함)
  ctx.rotate(Math.PI / 2);

  const sw = 80;
  const sh = 60;

  if (thinFactor <= 0.01) {
    // 기본 일반 상태: 단일 손바닥 렌더링
    ctx.drawImage(sprite, -sw / 2, -sh / 2, sw, sh);
  } else {
    // [유저 요구사항 100% 완벽 반영]:
    // "손 내려치면서 얇아지게 ( 손바닥을 5개로 분리시키고 각 안쪽부터 크기가 얇아지게) (단 분리된 5개는 붙어있긴 해야함)"
    const numSlices = 5;
    const srcSliceH = sprite.height / numSlices; // 60 / 5 = 12

    // 각 슬라이스의 두께 비율: 안쪽(index 4)부터 크기가 얇아지도록 설정
    // index 0: 바깥쪽(엄지) -> index 4: 안쪽(손날/타격점)
    const baseW = sh / numSlices; // 12
    const tf = Math.min(1.0, thinFactor);

    // 슬라이스별 두께 스케일: 안쪽으로 갈수록 극초박형으로 훨씬 더 얇아짐 (유저 요청 반영)
    const sliceScales = [
      1.0 - tf * 0.45, // 0: 바깥쪽 (엄지 측)
      1.0 - tf * 0.60, // 1
      1.0 - tf * 0.74, // 2 (중간)
      1.0 - tf * 0.84, // 3
      1.0 - tf * 0.92, // 4: 안쪽 (손날 측, 극초박형 칼날)
    ];

    const sliceHeights = sliceScales.map(s => baseW * s);
    const totalDestH = sliceHeights.reduce((a, b) => a + b, 0);

    // 내려치면서 안쪽 슬라이스가 타격 방향(+X, 화면상 아래)으로 역동적으로 살짝 앞서는 스미어 오프셋
    const chopOffsets = [
      -0.8 * tf,
      -0.4 * tf,
      0,
      0.5 * tf,
      1.2 * tf,
    ];

    let currentY = -totalDestH / 2;
    for (let i = 0; i < numSlices; i++) {
      const sH = sliceHeights[i];
      const srcY = i * srcSliceH;
      const chopOffX = chopOffsets[i];

      // [유저 요청 완벽 반영]: 분리선 제거 및 0.6px 미세 오버랩으로 검은 틈새 없이 완벽하게 하나로 이어진 흰색 손바닥 구현
      ctx.drawImage(
        sprite,
        0, srcY, sprite.width, srcSliceH,
        -sw / 2 + chopOffX, currentY, sw, sH + 0.6
      );

      currentY += sH;
    }
  }

  ctx.restore();
}



/**
 * 💥 2. 이펙트 중앙이 100% 완전 투명한 날카로운 8각 만화풍 스타버스트 (Sharp Comic Impact Starburst)
 * [유저 핵심 요구]: "이펙트의 중앙은 투명이라고 했잖아"
 * - 중심(0.0 ~ 0.50): 100% 완전 투명!
 * - 외곽 팁으로 갈수록 파란색 그라데이션 전개 + 하늘빛 림
 */
function drawFakeOutBlueSharpImpact(
  ctx: any,
  cx: number,
  cy: number,
  progress: number
) {
  if (progress > 0.75) return;
  const alpha = Math.max(0, 1.0 - progress / 0.75);
  const outerR = 18 + progress * 24;
  const innerR = outerR * 0.44;
  const points = 8;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(progress * 0.35);

  // [중심 100% 완전 투명한 그라데이션 필]
  const starGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, outerR);
  starGrad.addColorStop(0.00, "rgba(37, 99, 235, 0.0)"); // 중심 0% ~ 50%: 100% 완전 투명!
  starGrad.addColorStop(0.50, "rgba(37, 99, 235, 0.0)"); // 중심 투명 홀 유지
  starGrad.addColorStop(0.75, `rgba(37, 99, 235, ${0.80 * alpha})`); // 외곽 파란 바디
  starGrad.addColorStop(0.92, `rgba(59, 130, 246, ${0.90 * alpha})`); // 일렉트릭 블루
  starGrad.addColorStop(1.00, `rgba(147, 197, 253, ${0.85 * alpha})`); // 하늘빛 림

  ctx.fillStyle = starGrad;
  ctx.strokeStyle = `rgba(147, 197, 253, ${0.95 * alpha})`; // 선명한 외곽 림
  ctx.lineWidth = 2.2;
  ctx.lineJoin = "miter";
  ctx.miterLimit = 4;

  ctx.beginPath();
  const step = Math.PI / points;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = i * step - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}



/**
 * 💨 4. 충돌 관통 모멘텀 파란 스피드 속도선 (Blue Momentum Streaks)
 * - [중심 투명 유지]: 중앙(oy=0)을 비워두고 상하(oy=±18)로만 2줄 배치하여 중심 100% 투명 보장
 */
function drawFakeOutBlueMomentumStreaks(
  ctx: any,
  cx: number,
  cy: number,
  progress: number
) {
  if (progress > 0.65) return;
  const alpha = Math.max(0, 1.0 - progress / 0.65);
  const streakOffsetsY = [-18, 18]; // 중앙(0)을 비워두어 중심 100% 투명 유지

  ctx.save();
  for (let i = 0; i < streakOffsetsY.length; i++) {
    const oy = streakOffsetsY[i];
    const len = 34 + progress * 20;
    const sx = cx - len / 2;
    const ex = cx + len / 2;
    const sy = cy + oy;

    const sGrad = ctx.createLinearGradient(sx, sy, ex, sy);
    sGrad.addColorStop(0.0, "rgba(59, 130, 246, 0.0)");
    sGrad.addColorStop(0.5, `rgba(147, 197, 253, ${0.85 * alpha})`);
    sGrad.addColorStop(1.0, "rgba(59, 130, 246, 0.0)");

    ctx.strokeStyle = sGrad;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, sy);
    ctx.stroke();
  }
  ctx.restore();
}

// ============================================================================
// [속이기 렌더러: 1. 후면 레이어 (배경 틴트 없이 대상 본연의 비주얼 유지)]
// ============================================================================
export function drawFakeOutBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  // 클린 렌더링: 배경 전체 틴트 없이 대상 본연의 비주얼 유지
}

// ============================================================================
// [속이기 렌더러: 2. 전면 레이어 (양손 90도 교차 상하 2회 운동 & 맞닿음 & 파란 몸통박치기)]
// ============================================================================
export function drawFakeOutEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;

  const targetCenter = getTargetSpriteCenter(drawCtx, frame);
  const cx = targetCenter.x;
  const cy = targetCenter.y;

  const handDistX = 48;
  const amplitude = 18; // 위아래 진폭 18px

  // --------------------------------------------------------------------------
  // [Step 1: 양쪽에 태권당수 손 90도 직립 + 부드러운 2회 교차 상하 운동]
  // - [유저 요구사항]: "위 아래 움직이는거 두번이면 족할듯"
  // - [유저 요구사항]: "각도는 90도 맞춰줘 다시"
  // --------------------------------------------------------------------------
  if (step === 1) {
    const waveProg = prog;
    const cycleProg = waveProg * 2.0; // 2회 완전 순환
    const wave = Math.sin(cycleProg * Math.PI * 2);

    // "왼쪽이 위면 오른쪽은 아래":
    // wave > 0 일 때 왼쪽은 Y 감소(위), 오른쪽은 Y 증가(아래)
    const leftY = cy - wave * amplitude;
    const rightY = cy + wave * amplitude;
    const leftX = cx - handDistX;
    const rightX = cx + handDistX;

    // 90도 직립 모션 블러 고스트 잔상
    const prevWave1 = Math.sin(Math.max(0, cycleProg - 0.08) * Math.PI * 2);
    const prevWave2 = Math.sin(Math.max(0, cycleProg - 0.16) * Math.PI * 2);

    // 1) 보조 잔상 2 (가장 옅음)
    drawFakeOutHand(ctx, leftX, cy - prevWave2 * amplitude, true, 0.18, 0.95);
    drawFakeOutHand(ctx, rightX, cy + prevWave2 * amplitude, false, 0.18, 0.95);

    // 2) 보조 잔상 1 (중간)
    drawFakeOutHand(ctx, leftX, cy - prevWave1 * amplitude, true, 0.35, 0.95);
    drawFakeOutHand(ctx, rightX, cy + prevWave1 * amplitude, false, 0.35, 0.95);

    // 3) 선두 메인 손 (정확히 90도 직립 + 손 바닥 흰색)
    drawFakeOutHand(ctx, leftX, leftY, true, 1.0, 0.95);
    drawFakeOutHand(ctx, rightX, rightY, false, 1.0, 0.95);
  }

  // --------------------------------------------------------------------------
  // [Step 2: 마지막에 손이 맞닿으면서 - 정면 고속 쇄도 및 박수 맞닿음]
  // --------------------------------------------------------------------------
  if (step === 2) {
    const clapProg = prog;
    const easeClap = Math.pow(clapProg, 2.0); // 순간적인 가속 맞닿음
    const curDist = handDistX * (1.0 - easeClap) + 8 * easeClap; // 48px -> 8px 맞닿음

    // [손 내려치면서]: 위(cy - 22)에서 아래(cy + 4)로 내려치며 박수!
    const chopY = cy - 22 * (1.0 - easeClap) + 4 * easeClap;

    const leftX = cx - curDist;
    const rightX = cx + curDist;

    // 내려칠수록 얇아지는 계수 (0 -> 1.0)
    const thinFactor = easeClap;

    // 수평 쇄도 속도 잔상
    if (curDist > 14) {
      const trailDist = curDist + 10;
      drawFakeOutHand(ctx, cx - trailDist, chopY - 4, true, 0.30, 0.95, thinFactor * 0.7);
      drawFakeOutHand(ctx, cx + trailDist, chopY - 4, false, 0.30, 0.95, thinFactor * 0.7);
    }

    // 메인 내려치는 90도 직립 손 (5개 슬라이스 분리 & 안쪽부터 얇아짐)
    drawFakeOutHand(ctx, leftX, chopY, true, 1.0, 0.95, thinFactor);
    drawFakeOutHand(ctx, rightX, chopY, false, 1.0, 0.95, thinFactor);
  }

  // --------------------------------------------------------------------------
  // [Step 3: 손이 맞닿은 직격 순간 & 파란색 몸통박치기 이펙트 (중간 100% 완전 투명)]
  // --------------------------------------------------------------------------
  if (step === 3) {
    const hitProg = frame.hitProgress ?? prog;

    // 1) 손바닥: 내려친 위치(cy + 4)에서 맞닿은 상태 유지 후 반동 및 페이드아웃
    if (hitProg < 0.55) {
      const handAlpha = Math.max(0, 1.0 - hitProg / 0.55);
      const reboundDist = 8 + Math.min(1.0, hitProg * 2.5) * 12; // 8px -> 20px 반동
      const settleY = cy + 4 - hitProg * 4;

      drawFakeOutHand(ctx, cx - reboundDist, settleY, true, handAlpha, 0.95, 1.0);
      drawFakeOutHand(ctx, cx + reboundDist, settleY, false, handAlpha, 0.95, 1.0);
    }

    // 2) [유저 요청 완벽 반영]: 글로우(Flash Core Glow) 완전 제거!

    // 3) 파란색 몸통박치기 8각 스타버스트 (중앙은 100% 완전 투명!)
    drawFakeOutBlueSharpImpact(ctx, cx, cy, hitProg);

    // 4) [유저 요청 완벽 반영]: 링(Shockwave Rings) 완전 제거!

    // 5) [유저 요청 완벽 반영]: 점파티클(drawFakeOutBlueRetroStars) 완전 제거!

    // 6) 충돌 관통 모멘텀 파란 스피드 속도선 (중앙(0)을 비워두어 중심 100% 투명 유지)
    drawFakeOutBlueMomentumStreaks(ctx, cx, cy, hitProg);
  }

  // --------------------------------------------------------------------------
  // [Step 4: 안정화 (점파티클 없이 클린 소산)]
  // --------------------------------------------------------------------------
  if (step === 4) {
    // 점파티클 완전 제거
  }
}



