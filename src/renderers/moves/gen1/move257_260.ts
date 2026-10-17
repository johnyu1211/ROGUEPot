// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawAngerVeinMark } from "./move205_208.js";
import { drawConfusionEffect } from "./move045_048.js";
import { getFittedBattleSpriteBounds } from "../../common/spriteLoader.js";

// ============================================================================
// 🔥 257: 열풍 (Heat Wave / ねっぷう) - 불꽃 타입 특수 기술
//
// 위력: 95 / 명중: 90 / PP: 10 / 10% 확률로 상대 화상 / 특수 공격
// 설명: 뜨거운 숨결을 상대에게 내뿜어 공격한다. 화상 상태로 만들 때가 있다.
//
// [유저 요구사항 100% 엄수]:
// 1. 배경 필터: 약간 붉은 색깔, 주황 색깔로 섞여 있는 스트라이프로 된 필터 적용
// 2. 스트라이프 사이를 투명 반투명 그라데이션 적용
// 3. 스트라이프가 약간 비스듬하게 되어 있음 (약 -20도 경사각)
// 4. 이 스트라이프가 위로 올라가는 애니메이션을 빠르게 적용
// ============================================================================

/**
 * 257번 열풍 전용 붉은색·주황색 비스듬한 스트라이프 배경 필터 (Heat Wave Stripe Atmosphere Filter)
 * - 붉은 색(#EF4444 / #DC2626)과 주황 색(#FF7A00 / #F97316)이 교차/블렌딩된 사선 스트라이프
 * - 스트라이프 중심은 반투명(alpha ~0.35), 경계와 사이는 완전 투명(alpha 0.0)으로 부드러운 그라데이션
 * - 약간 비스듬한 각도(-20° 우상향 경사)
 * - 화면 위쪽(-Y 방향)으로 빠르게 올라가는 스크롤 애니메이션
 * - 카메라 줌(1.25배) 및 타격 흔들림에도 모서리가 절대 잘리지 않는 광활한 안전 마진 적용
 */
export function drawHeatWaveStripeFilter(
  ctx: any,
  progress: number,
  timeVal: number,
  drawCtx: EffectDrawContext,
  baseIntensity: number = 1.0
) {
  if (baseIntensity <= 0.005) return;

  // 1. 뷰포트 월드 좌표계 계산 (카메라 줌/이동 반영)
  const logicalW = drawCtx.width || 560;
  const logicalH = drawCtx.height || 380;

  let tl = { x: 0, y: 0 };
  let br = { x: logicalW, y: logicalH };

  try {
    const m = ctx.getTransform();
    const det = m.a * m.d - m.b * m.c;
    if (det && Math.abs(det) > 1e-6) {
      tl = {
        x: (m.d * (0 - m.e) - m.c * (0 - m.f)) / det,
        y: (m.a * (0 - m.f) - m.b * (0 - m.e)) / det,
      };
      const canvasW = ctx.canvas?.width || logicalW;
      const canvasH = ctx.canvas?.height || logicalH;
      br = {
        x: (m.d * (canvasW - m.e) - m.c * (canvasH - m.f)) / det,
        y: (m.a * (canvasH - m.f) - m.b * (canvasW - m.e)) / det,
      };
    }
  } catch {
    tl = { x: -60, y: -40 };
    br = { x: logicalW + 60, y: logicalH + 40 };
  }

  // 안전 마진 넉넉히 확보 (줌인 1.35배 및 카메라 진동 흔들림에도 화면 여백 0%)
  const padX = Math.max(logicalW * 1.6, 900);
  const padY = Math.max(logicalH * 1.6, 800);
  const minX = tl.x - padX;
  const maxX = br.x + padX;
  const minY = tl.y - padY;
  const maxY = br.y + padY;

  ctx.save();

  // [유저 피드백 100% 반영]: "상대시전시 지금거 좌우반전해봐 (상대시전것만)"
  const isPlayer = drawCtx.isPlayer ?? true;
  if (!isPlayer) {
    ctx.translate(logicalW, 0);
    ctx.scale(-1, 1);
  }

  // 2. 전체 필터 마스터 알파 엔벨로프 (도입부 부드러운 페이드인, 퇴장부 자연스러운 페이드아웃)
  let envelope = 1.0;
  if (progress < 0.15) {
    envelope = Math.sin((progress / 0.15) * (Math.PI / 2));
  } else if (progress > 0.82) {
    envelope = Math.sin(((1.0 - progress) / 0.18) * (Math.PI / 2));
  }
  const masterAlpha = Math.max(0, Math.min(1.0, envelope * baseIntensity));
  if (masterAlpha <= 0.005) {
    ctx.restore();
    return;
  }

  // 3. [완전 투명 영역 전면 차단]: 전체 화면을 꽉 채우는 부드러운 열기 대기 베이스 (Translucent Heat Mirage Base)
  //    - 맨바닥 0% 투명 홀을 막으면서도, 최대 전개 시 화면이 답답하지 않고 투명감 있게 비치도록 투명도 조율
  const heatBaseGrad = ctx.createLinearGradient(minX, minY, minX, maxY);
  heatBaseGrad.addColorStop(0.0, `rgba(135, 32, 42, ${0.20 * masterAlpha})`);
  heatBaseGrad.addColorStop(0.5, `rgba(175, 52, 35, ${0.24 * masterAlpha})`);
  heatBaseGrad.addColorStop(1.0, `rgba(130, 28, 38, ${0.20 * masterAlpha})`);
  ctx.fillStyle = heatBaseGrad;
  ctx.fillRect(minX, minY, maxX - minX, maxY - minY);

  // 4. [유저 피드백 100% 반영]:
  // - 각도: 약간 세로 방향 느낌 (약 52도 대각 세로각, 플레이어: +52°, 상대: -52°)
  const stripeAngleDeg = isPlayer ? 52.0 : -52.0;
  const stripeAngleRad = (stripeAngleDeg * Math.PI) / 180;
  const slope = Math.tan(stripeAngleRad); // 약 ±1.28

  // - 두께/너비: "넓이 지금의 6배" -> 기존 155px의 정확히 6배인 930px로 초대형 확장!
  const bandHeight = 930; // 155 * 6
  const cycleDist = bandHeight * 2; // 1860px (와인색/주황색 2색 교차 1주기)

  // - 진행 방향: 내가 시전 시 위(-1), 상대 시전 시 아래(+1)
  // 930px 대형 밴드가 화면을 박진감 넘치고 시원하게 훑고 지나가도록 속도 조정
  const dirY = isPlayer ? -1 : 1;
  const rawOffset = timeVal * 850 * dirY;
  const scrollOffsetY = ((rawOffset % cycleDist) + cycleDist) % cycleDist;

  // 법선 벡터 (그라데이션 축)
  const nx = -Math.sin(stripeAngleRad);
  const ny = Math.cos(stripeAngleRad);
  const normalBandDist = bandHeight * Math.cos(stripeAngleRad);

  // 세로 각도 회전에 맞춘 광활한 루프 범위 계산 (화면 밖 넉넉한 오버랩)
  const maxSlopeSpan = Math.abs((maxX - minX) * slope);
  const ySpanMin = minY - maxSlopeSpan - 1200;
  const ySpanMax = maxY + maxSlopeSpan + 1200;

  const startK = Math.floor(ySpanMin / bandHeight) - 2;
  const endK = Math.ceil(ySpanMax / bandHeight) + 2;

  // [본가 레퍼런스 실측 RGB 팔레트]:
  // 1. 깊은 붉은 와인/버건디 (Dark Crimson Wine)
  const C_DARK_CRIMSON = { r: 140, g: 30, b: 42 };
  // 2. 타오르는 따뜻한 주황빛 앰버 (Warm Amber Orange)
  const C_WARM_ORANGE = { r: 238, g: 105, b: 32 };
  // 3. 스트라이프 사이 전환/계곡부 (Valley Color) - 완전 투명이 아닌 부드러운 붉은 주황빛
  const C_TRANSITION = { r: 185, g: 62, b: 36 };

  // [투명도 조율]: "최대로 퍼쳐졌을 때의 투명도가 지금보다 더 투명해야 돼"
  // 베이스 틴트와 합성되어 최대 전개 시 39~56%의 맑고 투명한 열기 필터링 연출 (답답함 해소 & 투명 영역 0% 동시 만족)
  const crimsonAlpha = 0.44 * masterAlpha;
  const orangeAlpha = 0.36 * masterAlpha;
  const valleyAlpha = 0.22 * masterAlpha;

  // X축 스텝 간격
  const stepX = 28;
  const flowSign = isPlayer ? 1 : -1;

  // 일관된 물결 리플 함수: 밴드 상하 경계가 수학적으로 100% 일치하도록 보장
  const getWaveY = (kIdx: number, curX: number): number => {
    const flippedX = isPlayer ? curX : (logicalW - curX);
    const ripple = Math.sin((flippedX * 0.026 + timeVal * 5.2 * flowSign) + kIdx * 0.8) * 3.8
                 + Math.sin((flippedX * 0.052 - timeVal * 2.8 * flowSign)) * 1.8;
    return (kIdx * bandHeight + scrollOffsetY) + curX * slope + ripple;
  };

  for (let k = startK; k <= endK; k++) {
    // 짝수: 어두운 붉은 와인 / 홀수: 타오르는 주황 앰버
    const isDark = Math.abs(k) % 2 === 0;

    // 그라데이션 중심점
    const midX = (minX + maxX) * 0.5;
    const midY = getWaveY(k + 0.5, midX);

    // 직교 방향 선형 그라데이션:
    // [전환색 valleyAlpha] -> [중심 짙은색 peakAlpha] -> [전환색 valleyAlpha]
    // 밴드와 밴드가 맞닿는 경계에서 정확히 같은 색상과 알파(valleyAlpha)로 연결되어 완벽한 무봉제(Seamless) 보장!
    const halfDist = normalBandDist * 0.5;
    const stripeGrad = ctx.createLinearGradient(
      midX - nx * halfDist, midY - ny * halfDist,
      midX + nx * halfDist, midY + ny * halfDist
    );

    if (isDark) {
      stripeGrad.addColorStop(0.00, `rgba(${C_TRANSITION.r}, ${C_TRANSITION.g}, ${C_TRANSITION.b}, ${valleyAlpha})`);
      stripeGrad.addColorStop(0.50, `rgba(${C_DARK_CRIMSON.r}, ${C_DARK_CRIMSON.g}, ${C_DARK_CRIMSON.b}, ${crimsonAlpha})`);
      stripeGrad.addColorStop(1.00, `rgba(${C_TRANSITION.r}, ${C_TRANSITION.g}, ${C_TRANSITION.b}, ${valleyAlpha})`);
    } else {
      stripeGrad.addColorStop(0.00, `rgba(${C_TRANSITION.r}, ${C_TRANSITION.g}, ${C_TRANSITION.b}, ${valleyAlpha})`);
      stripeGrad.addColorStop(0.50, `rgba(${C_WARM_ORANGE.r}, ${C_WARM_ORANGE.g}, ${C_WARM_ORANGE.b}, ${orangeAlpha})`);
      stripeGrad.addColorStop(1.00, `rgba(${C_TRANSITION.r}, ${C_TRANSITION.g}, ${C_TRANSITION.b}, ${valleyAlpha})`);
    }

    ctx.fillStyle = stripeGrad;
    ctx.beginPath();

    // 상단 라인 (minX -> maxX): k번째 경계 곡선
    let isFirst = true;
    for (let x = minX; x <= maxX + stepX; x += stepX) {
      const curX = Math.min(x, maxX);
      const curY = getWaveY(k, curX);
      if (isFirst) {
        ctx.moveTo(curX, curY);
        isFirst = false;
      } else {
        ctx.lineTo(curX, curY);
      }
    }

    // 하단 라인 (maxX -> minX): (k+1)번째 경계 곡선 + 2px 오버랩 (안티에일리어싱 틈새 원천 차단)
    for (let x = maxX; x >= minX - stepX; x -= stepX) {
      const curX = Math.max(x, minX);
      const curY = getWaveY(k + 1, curX) + 2.0;
      ctx.lineTo(curX, curY);
    }

    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 257: 열풍 후방 배경 레이어 (drawHeatWaveBehindEffect)
 * - 포켓몬 스프라이트 뒤쪽 배경에 유저 요구사항인 붉은색·주황색 비스듬한 스트라이프 필터를 완벽 렌더링
 */
export function drawHeatWaveBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect && !frame.showBehindEffect) return;

  const prog = frame.effectProgress ?? 0;
  const timeVal = frame.heatWaveTime ?? prog * 6.0;
  const intensity = frame.filterIntensity ?? 1.0;

  // 유저 지정 붉은색·주황색 비스듬한 스트라이프 배경 필터 렌더링
  drawHeatWaveStripeFilter(ctx, prog, timeVal, drawCtx, intensity);
}

/**
 * 257: 열풍 전면 대기 레이어 (drawHeatWaveEffect)
 * - 레퍼런스 이미지처럼 포켓몬 몸체 위에도 은은한 열기 틴트(12%)를 살짝 얹어 자연스러운 대기 일체감 완성
 * - 타격 이펙트, 파티클, 바람 줄기 선, 다이아몬드는 완벽 제거된 상태 유지
 */
export function drawHeatWaveEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;

  const prog = frame.effectProgress ?? 0;
  const timeVal = frame.heatWaveTime ?? prog * 6.0;
  const intensity = (frame.filterIntensity ?? 1.0) * 0.12; // 은은한 12% 보조 전면 틴트

  // 전면에서도 살짝 은은하게 감싸는 아지랑이 틴트
  drawHeatWaveStripeFilter(ctx, prog, timeVal, drawCtx, intensity);
}

// ============================================================================
// ❄️ 258: 싸라기눈 (Hail / あられ) - 얼음 타입 변화 기술 (날씨)
//
// 위력: — / 명중: — / PP: 10 / 5턴간 싸라기눈(눈) 날씨 조성
// 설명: 5턴 동안 싸라기눈을 내리게 하여 얼음 타입 이외의 포켓몬에게 매 턴 데미지를 준다.
//
// [5세대(BW / B2W2) 스타일 전장 연출 + 유저 요구사항 100% 극대화]:
// 1. 암전: 페이드 인으로 검정 색깔 70% (Black Fade-in to 70%)
// 2. 5세대 특유의 맹렬한 냉기 대기 (Arctic Gale Wind & Diamond Dust):
//    - 전장을 휘몰아치는 반투명 청백색 냉기 돌풍 기류 (Swirling Frost Wind Ribbons)
//    - 허공에 부유하며 반짝이는 다이아몬드 더스트 및 얼음 결정 입자
// 3. 3D 입체 투명 얼음 돌멩이 (Faceted 3D Ice Hail Stone):
//    - 8개 패싯(Facets)의 3D 입체 다면체 지오메트리 (Rotational 3D Polyhedron)
//    - 직격광/중간면: 맑고 투명한 빙결 청백색 (Clear Translucent Glacial Ice)
//    - 외곽 실루엣: 선명한 순백색(#FFFFFF) 크리스탈 림
//    - 음영/측면부: 짙은 쿨 슬레이트 그레이(#334155, #475569)로 확고하고 묵직한 3D 입체감
//    - 상단 최고광: 반짝이는 다이아몬드 스파클 반사광 (✦ Specular Star)
// 4. 다층 원근감 (Multi-layered Scale & Depth):
//    - 근경(Foreground): 크고 묵직한 3D 얼음 암석(8.2 ~ 11.2px)이 화면 앞을 구르며 통통 바운스
//    - 중경(Midground): 전장 전역을 타격하는 메인 얼음 돌멩이(5.2 ~ 7.4px)
//    - 원경(Background): 원거리에서 고속으로 쏟아지는 싸라기눈 입자(3.2 ~ 4.6px)
// 5. 비바라기 스타일 지면 반응 + 5세대 통통 바운스 & 얼음 파편 비산 (Impact Shatter & Elastic Bounce):
//    - 지면 격돌 순간: 순간 발광 링 + 방사형으로 폭발 비산하는 5~7개의 날카로운 얼음 파편 칩(Ice Shards)
//    - 지면 탄도학 바운스: 1차 대형 점프(통!) ➔ 2차 소형 점프(통!) ➔ 안착 및 융해
// 6. 완전 2D 불규칙 산포 (대각선 일렬 원천 차단):
//    - X(25~495px), Y(120~365px) 전장 전역에 사방 교차 분산
// ============================================================================

// 3D 옥타헤드론 기반 크리스탈 바위 지오메트리 (6 정점, 8 삼각형 패싯)
const HAIL_CRYSTAL_VERTS: readonly [number, number, number][] = [
  [ 0.00,  1.25,  0.00], // 0: Top apex (+Y)
  [ 0.00, -1.15,  0.00], // 1: Bottom apex (-Y)
  [ 1.10,  0.10,  0.20], // 2: Right (+X)
  [-1.05, -0.15, -0.10], // 3: Left (-X)
  [ 0.15,  0.10,  1.15], // 4: Front (+Z)
  [-0.10, -0.05, -1.05], // 5: Back (-Z)
];

const HAIL_CRYSTAL_FACES: readonly [number, number, number][] = [
  [0, 4, 2], [0, 2, 5], [0, 5, 3], [0, 3, 4], // 상단 4개 피라미드 면
  [1, 2, 4], [1, 5, 2], [1, 3, 5], [1, 4, 3], // 하단 4개 역피라미드 면
];

/**
 * 3D 입체 투명 얼음 돌멩이 (Faceted 3D Ice Hail Stone)
 * - 5세대(BW) 특유의 보석/크리스탈 결정체 컷팅 질감
 * - 중간 부분 투명/반투명 (Clear Translucent Glacial Ice)
 * - 외곽: 선명한 순백색(#FFFFFF) 크리스탈 림
 * - 음영 면: 짙은 쿨 그레이(#334155, #475569) 음영으로 단단하고 묵직한 3D 입체감
 * - 최고광 정점: 다이아몬드 스파클 반사광
 */
export function draw3DIceHailStone(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  rotation: number = 0,
  seed: number = 0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || size <= 0.5) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, (ctx.globalAlpha ?? 1.0) * alpha));

  // 1) 3D 정점 오일러 회전 (Rx, Ry, Rz) + 시드별 고유 결정체 비대칭 변형
  const rotX = rotation * 0.95 + seed * 1.37;
  const rotY = rotation * 1.35 + seed * 2.19;
  const rotZ = rotation * 0.55 + seed * 0.73;

  const cy_ang = Math.cos(rotY), sy_ang = Math.sin(rotY);
  const cx_ang = Math.cos(rotX), sx_ang = Math.sin(rotX);
  const cz_ang = Math.cos(rotZ), sz_ang = Math.sin(rotZ);

  const p3d = HAIL_CRYSTAL_VERTS.map((v) => {
    // 시드 기반 비대칭 유기적 얼음 암석 변형
    const jx = Math.sin(seed * 3.7 + v[0] * 2.3 + v[1]) * 0.12;
    const jy = Math.cos(seed * 5.1 + v[1] * 2.5 + v[2]) * 0.12;
    const jz = Math.sin(seed * 4.3 + v[2] * 2.1 + v[0]) * 0.12;

    const x0 = (v[0] + jx) * size;
    const y0 = (v[1] + jy) * size;
    const z0 = (v[2] + jz) * size;

    // Ry
    const x1 = x0 * cy_ang + z0 * sy_ang;
    const y1 = y0;
    const z1 = -x0 * sy_ang + z0 * cy_ang;

    // Rx
    const x2 = x1;
    const y2 = y1 * cx_ang - z1 * sx_ang;
    const z2 = y1 * sx_ang + z1 * cx_ang;

    // Rz
    const x3 = x2 * cz_ang - y2 * sz_ang;
    const y3 = x2 * sz_ang + y2 * cz_ang;
    const z3 = z2;

    return { x: cx + x3, y: cy + y3, z: z3 };
  });

  // 2) 가시 면 선별 (Backface Culling) 및 광원 내적 계산
  // 광원: 좌상단 전면 (LX: -0.45, LY: -0.70, LZ: 0.55)
  const LX = -0.448;
  const LY = -0.697;
  const LZ = 0.548;

  interface FaceInfo {
    pts: [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }];
    intensity: number;
    avgZ: number;
  }

  const visibleFaces: FaceInfo[] = [];
  const edgeCountMap = new Map<string, { p1: { x: number; y: number }; p2: { x: number; y: number } }[]>();

  for (let f = 0; f < HAIL_CRYSTAL_FACES.length; f++) {
    const [i0, i1, i2] = HAIL_CRYSTAL_FACES[f];
    const p0 = p3d[i0];
    const p1 = p3d[i1];
    const p2 = p3d[i2];

    const abx = p1.x - p0.x, aby = p1.y - p0.y, abz = p1.z - p0.z;
    const acx = p2.x - p0.x, acy = p2.y - p0.y, acz = p2.z - p0.z;

    const nx = aby * acz - abz * acy;
    const ny = abz * acx - abx * acz;
    const nz = abx * acy - aby * acx;

    if (nz <= 0.001) continue; // Backface culling

    const len = Math.hypot(nx, ny, nz);
    if (len <= 0.0001) continue;

    const dot = (nx / len) * LX + (ny / len) * LY + (nz / len) * LZ;

    visibleFaces.push({
      pts: [{ x: p0.x, y: p0.y }, { x: p1.x, y: p1.y }, { x: p2.x, y: p2.y }],
      intensity: dot,
      avgZ: (p0.z + p1.z + p2.z) / 3,
    });

    const edges: [number, number][] = [
      [Math.min(i0, i1), Math.max(i0, i1)],
      [Math.min(i1, i2), Math.max(i1, i2)],
      [Math.min(i2, i0), Math.max(i2, i0)],
    ];
    const vPts = [p0, p1, p2];
    for (let e = 0; e < 3; e++) {
      const key = `${edges[e][0]}_${edges[e][1]}`;
      if (!edgeCountMap.has(key)) {
        edgeCountMap.set(key, []);
      }
      edgeCountMap.get(key)!.push({ p1: vPts[e], p2: vPts[(e + 1) % 3] });
    }
  }

  // Z-Sort
  visibleFaces.sort((a, b) => a.avgZ - b.avgZ);

  // 3) 면 채색: 유저 요구사항 엄수
  // - 직격광/중간면: 투명/반투명 얼음빛
  // - 그늘면/하단: 짙은 쿨 그레이로 묵직한 3D 입체감
  for (const face of visibleFaces) {
    const dot = face.intensity;
    let fillColor: string;

    if (dot > 0.40) {
      // 최상단 직격광: 맑고 투명한 빙결 하이라이트
      fillColor = "rgba(240, 249, 255, 0.45)";
    } else if (dot > 0.00) {
      // 정면 기본 면: 맑고 투명한 시안 얼음빛
      fillColor = "rgba(186, 230, 253, 0.38)";
    } else if (dot > -0.35) {
      // 측면 음영: 입체감을 주는 짙은 쿨 그레이 1단계
      fillColor = "rgba(100, 116, 139, 0.65)";
    } else {
      // 하단/배면 깊은 음영: 짙은 슬레이트 그레이 2단계 (단단한 3D 볼륨감)
      fillColor = "rgba(51, 65, 85, 0.82)";
    }

    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.moveTo(face.pts[0].x, face.pts[0].y);
    ctx.lineTo(face.pts[1].x, face.pts[1].y);
    ctx.lineTo(face.pts[2].x, face.pts[2].y);
    ctx.closePath();
    ctx.fill();
  }

  // 4) 엣지 렌더링:
  // - 외곽 실루엣: 선명한 순백색 크리스탈 윤곽선
  // - 내부 능선: 은은하고 얇은 반투명 백색 능선 (투박한 검정선이 아닌 5세대 보석 컷팅선)
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // 내부 컷팅 능선
  ctx.strokeStyle = "rgba(255, 255, 255, 0.40)";
  ctx.lineWidth = 0.75;
  ctx.beginPath();
  for (const [_key, list] of edgeCountMap.entries()) {
    if (list.length > 1) {
      const e = list[0];
      ctx.moveTo(e.p1.x, e.p1.y);
      ctx.lineTo(e.p2.x, e.p2.y);
    }
  }
  ctx.stroke();

  // 외곽 실루엣 림
  ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
  ctx.lineWidth = Math.max(0.9, size * 0.14);
  ctx.beginPath();
  for (const [_key, list] of edgeCountMap.entries()) {
    if (list.length === 1) {
      const e = list[0];
      ctx.moveTo(e.p1.x, e.p1.y);
      ctx.lineTo(e.p2.x, e.p2.y);
    }
  }
  ctx.stroke();

  // 5) 5세대 스타일 다이아몬드 스파클 반사광 (✦ Specular Glint)
  if (visibleFaces.length > 0 && size >= 2.8) {
    const peak = visibleFaces[visibleFaces.length - 1];
    if (peak.intensity > 0.48) {
      const gcx = (peak.pts[0].x + peak.pts[1].x + peak.pts[2].x) / 3;
      const gcy = (peak.pts[0].y + peak.pts[1].y + peak.pts[2].y) / 3;
      const glintR = Math.max(0.8, size * 0.28);

      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.beginPath();
      ctx.moveTo(gcx, gcy - glintR);
      ctx.lineTo(gcx + glintR * 0.32, gcy);
      ctx.lineTo(gcx, gcy + glintR);
      ctx.lineTo(gcx - glintR * 0.32, gcy);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}

interface HailStoneDef {
  startX: number;
  startY: number;      // 다양한 시작 상공 고도 (-30px ~ -160px)
  landingX: number;
  landingY: number;    // 지면 불규칙 고도 (120px ~ 365px)
  size: number;        // 다층 크기 (1.7px ~ 5.4px)
  seed: number;
  tFallStart: number;  // 시작 시간
  fallDur: number;     // 낙하 속도
  rotSpeed: number;
  bounce1Height: number;
  bounce1Dur: number;
  bounce1Drift: number;
  bounce2Height: number;
  bounce2Dur: number;
  bounce2Drift: number;
  settleDur: number;
  layer: "front" | "mid" | "back"; // 다층 심도 (원경/중경/근경)
}

// 52개 싸라기눈 군집 데이터 (5세대 다층 원근감 + 콤팩트 크기 + 완전 2D 불규칙 산포)
// - 근경(front: 4.4~5.4px): 콤팩트하고 정교한 3D 면을 지닌 전면 얼음 돌멩이
// - 중경(mid: 2.4~3.6px): 전장을 고르게 타격하는 앙증맞은 주력 싸라기눈 입자
// - 원경(back: 1.7~2.2px): 상공에서 빠르게 쏟아지는 고속 미세 얼음 알갱이
// - 동시 착지 쌍은 반드시 대각선 반대 분면(상단좌측 & 하단우측 등)으로 교차 배치
const HAIL_STONES: readonly HailStoneDef[] = [
  // --------------------------------------------------------------------------
  // [Step 1: 전조 선발대] 암전 70% 페이드인과 함께 먼저 떨어지는 4개 돌멩이
  // --------------------------------------------------------------------------
  { startX:  60, startY: -45,  landingX:  50, landingY: 140, size: 2.7, seed: 11, tFallStart: 0.04, fallDur: 0.12, rotSpeed:  4.6, bounce1Height: 11, bounce1Dur: 0.11, bounce1Drift: -4, bounce2Height: 3, bounce2Dur: 0.07, bounce2Drift: -2, settleDur: 0.07, layer: "mid" },   // 상단 좌측
  { startX: 420, startY: -110, landingX: 430, landingY: 345, size: 4.8, seed: 44, tFallStart: 0.05, fallDur: 0.15, rotSpeed: -5.2, bounce1Height: 16, bounce1Dur: 0.13, bounce1Drift:  5, bounce2Height: 5, bounce2Dur: 0.08, bounce2Drift:  3, settleDur: 0.08, layer: "front" }, // [근경] 하단 우측
  { startX: 370, startY: -35,  landingX: 360, landingY: 145, size: 2.5, seed: 72, tFallStart: 0.12, fallDur: 0.11, rotSpeed:  3.8, bounce1Height: 10, bounce1Dur: 0.11, bounce1Drift:  5, bounce2Height: 3, bounce2Dur: 0.07, bounce2Drift:  2, settleDur: 0.07, layer: "mid" },   // 상단 우측
  { startX: 110, startY: -125, landingX: 100, landingY: 330, size: 3.4, seed: 28, tFallStart: 0.14, fallDur: 0.17, rotSpeed: -4.3, bounce1Height: 13, bounce1Dur: 0.12, bounce1Drift: -5, bounce2Height: 4, bounce2Dur: 0.08, bounce2Drift: -2, settleDur: 0.07, layer: "mid" },   // 하단 좌측

  // --------------------------------------------------------------------------
  // [Step 2: 5세대 본대 쇄도 Wave A] 폭풍의 시작 & 사방 교차 분산
  // --------------------------------------------------------------------------
  { startX: 250, startY: -60,  landingX: 260, landingY: 135, size: 2.0, seed: 83, tFallStart: 0.25, fallDur: 0.12, rotSpeed:  5.0, bounce1Height:  9, bounce1Dur: 0.10, bounce1Drift: -4, bounce2Height: 2, bounce2Dur: 0.06, bounce2Drift: -2, settleDur: 0.06, layer: "back" },  // 최상단 중앙
  { startX: 320, startY: -45,  landingX: 310, landingY: 355, size: 5.2, seed: 15, tFallStart: 0.26, fallDur: 0.13, rotSpeed: -4.8, bounce1Height: 17, bounce1Dur: 0.14, bounce1Drift:  6, bounce2Height: 6, bounce2Dur: 0.08, bounce2Drift:  3, settleDur: 0.08, layer: "front" }, // [근경] 최하단 중앙

  { startX: 470, startY: -95,  landingX: 480, landingY: 155, size: 2.9, seed: 56, tFallStart: 0.29, fallDur: 0.14, rotSpeed:  4.2, bounce1Height: 12, bounce1Dur: 0.12, bounce1Drift: -4, bounce2Height: 4, bounce2Dur: 0.07, bounce2Drift: -2, settleDur: 0.07, layer: "mid" },   // 상단 극우
  { startX: 180, startY: -40,  landingX: 190, landingY: 350, size: 3.6, seed: 98, tFallStart: 0.30, fallDur: 0.12, rotSpeed: -3.6, bounce1Height: 14, bounce1Dur: 0.12, bounce1Drift:  5, bounce2Height: 4, bounce2Dur: 0.08, bounce2Drift:  3, settleDur: 0.07, layer: "mid" },   // 하단 좌중앙

  { startX: 150, startY: -85,  landingX: 140, landingY: 190, size: 1.9, seed: 33, tFallStart: 0.33, fallDur: 0.13, rotSpeed:  4.5, bounce1Height:  8, bounce1Dur: 0.10, bounce1Drift: -3, bounce2Height: 2, bounce2Dur: 0.06, bounce2Drift: -1, settleDur: 0.06, layer: "back" },  // 중상단 좌
  { startX: 390, startY: -140, landingX: 400, landingY: 275, size: 3.1, seed: 62, tFallStart: 0.34, fallDur: 0.18, rotSpeed: -5.4, bounce1Height: 12, bounce1Dur: 0.12, bounce1Drift:  4, bounce2Height: 4, bounce2Dur: 0.07, bounce2Drift:  2, settleDur: 0.07, layer: "mid" },   // 중하단 우

  { startX: 360, startY: -55,  landingX: 350, landingY: 180, size: 2.8, seed: 7,   tFallStart: 0.37, fallDur: 0.13, rotSpeed:  4.8, bounce1Height: 11, bounce1Dur: 0.11, bounce1Drift: -4, bounce2Height: 3, bounce2Dur: 0.07, bounce2Drift: -2, settleDur: 0.07, layer: "mid" },   // 중상단 우
  { startX: 165, startY: -120, landingX: 175, landingY: 305, size: 4.5, seed: 91, tFallStart: 0.38, fallDur: 0.16, rotSpeed: -4.0, bounce1Height: 15, bounce1Dur: 0.13, bounce1Drift:  5, bounce2Height: 5, bounce2Dur: 0.08, bounce2Drift:  3, settleDur: 0.08, layer: "front" }, // [근경] 하단 좌중앙

  { startX: 440, startY: -35,  landingX: 450, landingY: 220, size: 1.9, seed: 23, tFallStart: 0.40, fallDur: 0.11, rotSpeed:  5.3, bounce1Height:  8, bounce1Dur: 0.09, bounce1Drift:  3, bounce2Height: 2, bounce2Dur: 0.06, bounce2Drift:  1, settleDur: 0.06, layer: "back" },  // 중단 우
  { startX:  85, startY: -95,  landingX:  75, landingY: 250, size: 3.5, seed: 38, tFallStart: 0.41, fallDur: 0.15, rotSpeed: -4.6, bounce1Height: 13, bounce1Dur: 0.12, bounce1Drift: -5, bounce2Height: 4, bounce2Dur: 0.08, bounce2Drift: -2, settleDur: 0.07, layer: "mid" },   // 중단 좌

  // --------------------------------------------------------------------------
  // [Step 2: 5세대 본대 쇄도 Wave B] 절정 폭풍 & 연속 충돌 바운스
  // --------------------------------------------------------------------------
  { startX: 120, startY: -50,  landingX: 110, landingY: 360, size: 5.4, seed: 85, tFallStart: 0.43, fallDur: 0.13, rotSpeed:  4.1, bounce1Height: 18, bounce1Dur: 0.14, bounce1Drift:  6, bounce2Height: 6, bounce2Dur: 0.08, bounce2Drift:  3, settleDur: 0.08, layer: "front" }, // [근경] 최하단 좌
  { startX: 430, startY: -130, landingX: 440, landingY: 140, size: 1.7, seed: 19, tFallStart: 0.44, fallDur: 0.17, rotSpeed: -3.7, bounce1Height:  7, bounce1Dur: 0.10, bounce1Drift: -3, bounce2Height: 2, bounce2Dur: 0.06, bounce2Drift: -1, settleDur: 0.06, layer: "back" },  // 상단 우

  { startX: 220, startY: -70,  landingX: 230, landingY: 155, size: 2.8, seed: 66, tFallStart: 0.46, fallDur: 0.14, rotSpeed:  4.4, bounce1Height: 11, bounce1Dur: 0.12, bounce1Drift:  4, bounce2Height: 3, bounce2Dur: 0.07, bounce2Drift:  2, settleDur: 0.07, layer: "mid" },   // 상단 중앙
  { startX: 490, startY: -45,  landingX: 480, landingY: 325, size: 3.3, seed: 51, tFallStart: 0.47, fallDur: 0.12, rotSpeed: -4.9, bounce1Height: 12, bounce1Dur: 0.12, bounce1Drift: -4, bounce2Height: 4, bounce2Dur: 0.07, bounce2Drift: -2, settleDur: 0.07, layer: "mid" },   // 하단 극우

  { startX:  40, startY: -105, landingX:  30, landingY: 170, size: 2.2, seed: 77, tFallStart: 0.49, fallDur: 0.15, rotSpeed:  4.6, bounce1Height:  9, bounce1Dur: 0.11, bounce1Drift:  3, bounce2Height: 3, bounce2Dur: 0.07, bounce2Drift:  2, settleDur: 0.07, layer: "back" },  // 상단 극좌
  { startX: 375, startY: -35,  landingX: 385, landingY: 315, size: 4.9, seed: 3,   tFallStart: 0.50, fallDur: 0.12, rotSpeed: -4.2, bounce1Height: 16, bounce1Dur: 0.13, bounce1Drift:  5, bounce2Height: 5, bounce2Dur: 0.08, bounce2Drift:  3, settleDur: 0.08, layer: "front" }, // [근경] 하단 우

  { startX: 265, startY: -85,  landingX: 255, landingY: 340, size: 3.4, seed: 94, tFallStart: 0.52, fallDur: 0.15, rotSpeed:  3.8, bounce1Height: 13, bounce1Dur: 0.12, bounce1Drift: -5, bounce2Height: 4, bounce2Dur: 0.08, bounce2Drift: -2, settleDur: 0.07, layer: "mid" },   // 최하단 중앙
  { startX: 315, startY: -125, landingX: 325, landingY: 150, size: 1.7, seed: 41, tFallStart: 0.53, fallDur: 0.16, rotSpeed: -5.0, bounce1Height:  7, bounce1Dur: 0.09, bounce1Drift:  3, bounce2Height: 2, bounce2Dur: 0.06, bounce2Drift:  1, settleDur: 0.06, layer: "back" },  // 상단 중앙

  { startX:  90, startY: -65,  landingX:  80, landingY: 165, size: 3.0, seed: 18, tFallStart: 0.55, fallDur: 0.13, rotSpeed:  4.3, bounce1Height: 11, bounce1Dur: 0.12, bounce1Drift:  4, bounce2Height: 3, bounce2Dur: 0.07, bounce2Drift:  2, settleDur: 0.07, layer: "mid" },   // 상단 좌
  { startX: 455, startY: -40,  landingX: 465, landingY: 345, size: 4.6, seed: 60, tFallStart: 0.56, fallDur: 0.12, rotSpeed: -4.5, bounce1Height: 15, bounce1Dur: 0.13, bounce1Drift: -4, bounce2Height: 5, bounce2Dur: 0.08, bounce2Drift: -2, settleDur: 0.08, layer: "front" }, // [근경] 최하단 우

  // --------------------------------------------------------------------------
  // [Step 2: 5세대 본대 쇄도 Wave C] 묵직한 클라이맥스 전면 폭격
  // --------------------------------------------------------------------------
  { startX: 175, startY: -95,  landingX: 165, landingY: 230, size: 2.7, seed: 88, tFallStart: 0.58, fallDur: 0.15, rotSpeed:  4.9, bounce1Height: 10, bounce1Dur: 0.11, bounce1Drift:  4, bounce2Height: 3, bounce2Dur: 0.07, bounce2Drift:  2, settleDur: 0.07, layer: "mid" },   // 중단 좌
  { startX: 395, startY: -150, landingX: 385, landingY: 235, size: 3.6, seed: 26, tFallStart: 0.59, fallDur: 0.18, rotSpeed: -3.7, bounce1Height: 14, bounce1Dur: 0.13, bounce1Drift: -5, bounce2Height: 4, bounce2Dur: 0.08, bounce2Drift: -2, settleDur: 0.08, layer: "mid" },   // 중단 우

  { startX: 135, startY: -50,  landingX: 125, landingY: 275, size: 2.0, seed: 73, tFallStart: 0.61, fallDur: 0.11, rotSpeed:  4.7, bounce1Height:  8, bounce1Dur: 0.09, bounce1Drift:  3, bounce2Height: 2, bounce2Dur: 0.06, bounce2Drift:  1, settleDur: 0.06, layer: "back" },  // 중하단 좌
  { startX: 300, startY: -75,  landingX: 290, landingY: 160, size: 3.1, seed: 35, tFallStart: 0.62, fallDur: 0.14, rotSpeed: -4.1, bounce1Height: 12, bounce1Dur: 0.12, bounce1Drift:  5, bounce2Height: 4, bounce2Dur: 0.07, bounce2Drift:  2, settleDur: 0.07, layer: "mid" },   // 상단 중앙

  { startX:  60, startY: -115, landingX:  70, landingY: 345, size: 5.1, seed: 9,  tFallStart: 0.64, fallDur: 0.15, rotSpeed:  3.6, bounce1Height: 17, bounce1Dur: 0.14, bounce1Drift: -5, bounce2Height: 6, bounce2Dur: 0.08, bounce2Drift: -2, settleDur: 0.08, layer: "front" }, // [근경] 하단 극좌
  { startX: 420, startY: -45,  landingX: 410, landingY: 195, size: 2.6, seed: 50, tFallStart: 0.65, fallDur: 0.12, rotSpeed: -5.2, bounce1Height: 10, bounce1Dur: 0.11, bounce1Drift:  4, bounce2Height: 3, bounce2Dur: 0.06, bounce2Drift:  2, settleDur: 0.06, layer: "mid" },   // 중상단 우

  { startX: 195, startY: -135, landingX: 185, landingY: 145, size: 1.9, seed: 81, tFallStart: 0.67, fallDur: 0.16, rotSpeed:  4.3, bounce1Height:  8, bounce1Dur: 0.10, bounce1Drift: -3, bounce2Height: 2, bounce2Dur: 0.06, bounce2Drift: -1, settleDur: 0.06, layer: "back" },  // 상단 좌중앙
  { startX: 330, startY: -35,  landingX: 340, landingY: 335, size: 3.2, seed: 14, tFallStart: 0.68, fallDur: 0.10, rotSpeed: -4.8, bounce1Height: 12, bounce1Dur: 0.12, bounce1Drift:  4, bounce2Height: 4, bounce2Dur: 0.07, bounce2Drift:  2, settleDur: 0.07, layer: "mid" },   // 하단 우중앙

  { startX: 465, startY: -90,  landingX: 455, landingY: 290, size: 3.4, seed: 68, tFallStart: 0.70, fallDur: 0.14, rotSpeed:  4.0, bounce1Height: 13, bounce1Dur: 0.12, bounce1Drift: -5, bounce2Height: 4, bounce2Dur: 0.07, bounce2Drift: -2, settleDur: 0.07, layer: "mid" },   // 하단 우
  { startX: 110, startY: -50,  landingX: 100, landingY: 215, size: 2.2, seed: 95, tFallStart: 0.71, fallDur: 0.12, rotSpeed: -4.4, bounce1Height:  9, bounce1Dur: 0.10, bounce1Drift:  3, bounce2Height: 3, bounce2Dur: 0.07, bounce2Drift:  2, settleDur: 0.07, layer: "back" },  // 중단 좌

  // --------------------------------------------------------------------------
  // [Step 3: 필드 안정화 & 안착 후미대] 암전 서서히 걷히며 마지막 바운스 & 용해
  // --------------------------------------------------------------------------
  { startX: 235, startY: -105, landingX: 245, landingY: 260, size: 3.5, seed: 31, tFallStart: 0.74, fallDur: 0.14, rotSpeed:  4.6, bounce1Height: 13, bounce1Dur: 0.12, bounce1Drift:  4, bounce2Height: 4, bounce2Dur: 0.07, bounce2Drift:  2, settleDur: 0.07, layer: "mid" },   // 중단 중앙
  { startX: 490, startY: -40,  landingX: 480, landingY: 240, size: 2.2, seed: 74, tFallStart: 0.75, fallDur: 0.11, rotSpeed: -4.9, bounce1Height:  9, bounce1Dur: 0.10, bounce1Drift: -3, bounce2Height: 2, bounce2Dur: 0.06, bounce2Drift: -1, settleDur: 0.06, layer: "back" },  // 중단 극우

  { startX:  30, startY: -80,  landingX:  40, landingY: 280, size: 3.1, seed: 2,   tFallStart: 0.77, fallDur: 0.13, rotSpeed:  3.7, bounce1Height: 12, bounce1Dur: 0.11, bounce1Drift:  4, bounce2Height: 4, bounce2Dur: 0.07, bounce2Drift:  2, settleDur: 0.07, layer: "mid" },   // 하단 좌
  { startX: 415, startY: -145, landingX: 425, landingY: 160, size: 2.6, seed: 47, tFallStart: 0.78, fallDur: 0.16, rotSpeed: -4.2, bounce1Height: 10, bounce1Dur: 0.11, bounce1Drift: -4, bounce2Height: 3, bounce2Dur: 0.07, bounce2Drift: -2, settleDur: 0.07, layer: "mid" },   // 상단 우

  { startX: 160, startY: -60,  landingX: 150, landingY: 335, size: 4.4, seed: 89, tFallStart: 0.80, fallDur: 0.12, rotSpeed:  4.5, bounce1Height: 15, bounce1Dur: 0.13, bounce1Drift:  4, bounce2Height: 5, bounce2Dur: 0.07, bounce2Drift:  2, settleDur: 0.07, layer: "front" }, // [근경] 하단 좌
  { startX: 280, startY: -35,  landingX: 270, landingY: 180, size: 2.4, seed: 16, tFallStart: 0.81, fallDur: 0.11, rotSpeed: -4.7, bounce1Height:  9, bounce1Dur: 0.10, bounce1Drift: -3, bounce2Height: 3, bounce2Dur: 0.07, bounce2Drift: -2, settleDur: 0.07, layer: "mid" },   // 중상단 중앙

  { startX:  75, startY: -75,  landingX:  65, landingY: 190, size: 1.8, seed: 63, tFallStart: 0.83, fallDur: 0.12, rotSpeed:  4.4, bounce1Height:  8, bounce1Dur: 0.10, bounce1Drift:  3, bounce2Height: 2, bounce2Dur: 0.06, bounce2Drift:  1, settleDur: 0.06, layer: "back" },  // 중상단 좌
  { startX: 345, startY: -120, landingX: 355, landingY: 355, size: 3.4, seed: 21, tFallStart: 0.84, fallDur: 0.15, rotSpeed: -3.8, bounce1Height: 13, bounce1Dur: 0.12, bounce1Drift: -4, bounce2Height: 4, bounce2Dur: 0.07, bounce2Drift: -2, settleDur: 0.07, layer: "mid" },   // 최하단 우중앙
];

/**
 * 258: 싸라기눈 5세대 스타일 후방 배경 레이어 (drawHailBehindEffect)
 * - 70% 페이드인 암전
 * - 5세대 전장 냉기 돌풍 기류 (Arctic Frost Wind Ribbons)
 * - 공중 부유 다이아몬드 더스트 및 얼음 결정 반짝임 (Diamond Dust Flurries)
 */
export function drawHailBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showBehindEffect && !frame.showEffect) return;

  const w = drawCtx.width || 512;
  const h = drawCtx.height || 384;
  const step = frame.moveStep || 1;
  const prog = frame.effectProgress || 0;

  const normProg = step === 1 ? prog * 0.28 : (step === 2 ? 0.28 + prog * 0.52 : 0.80 + prog * 0.20);

  ctx.save();

  // 1. 암전 70% 페이드 인 (frame.blackFadeAlpha 반영, 기본 0.70)
  const fadeAlpha = frame.blackFadeAlpha !== undefined ? frame.blackFadeAlpha : (
    normProg < 0.25 ? (normProg / 0.25) * 0.70 : (normProg > 0.85 ? Math.max(0, (1.0 - normProg) / 0.15) * 0.70 : 0.70)
  );
  if (fadeAlpha > 0.005) {
    ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
    ctx.fillRect(-w * 2, -h * 2, w * 5, h * 5);
  }

  // 2. 5세대 특유의 전장 냉기 돌풍 기류 (Arctic Frost Gale Winds)
  // - 5개의 반투명 청백색 유선형 바람 밴드가 화면 우상단에서 좌하단으로 거세게 흐름
  const windAlpha = Math.sin(normProg * Math.PI) * 0.22;
  if (windAlpha > 0.01) {
    const windBands = [
      { y0: 40,  speed: 1.15, width: 22, waveA: 8 },
      { y0: 110, speed: 0.95, width: 28, waveA: 12 },
      { y0: 190, speed: 1.25, width: 32, waveA: 10 },
      { y0: 270, speed: 1.05, width: 26, waveA: 14 },
      { y0: 340, speed: 1.10, width: 20, waveA: 9 },
    ];

    for (let b = 0; b < windBands.length; b++) {
      const band = windBands[b];
      const scrollX = (normProg * 650 * band.speed) % (w + 200);

      ctx.save();
      ctx.globalAlpha = windAlpha * 0.85;

      const grad = ctx.createLinearGradient(0, band.y0 - band.width, 0, band.y0 + band.width);
      grad.addColorStop(0.0, "rgba(224, 242, 254, 0.0)");
      grad.addColorStop(0.5, "rgba(224, 242, 254, 0.25)");
      grad.addColorStop(1.0, "rgba(224, 242, 254, 0.0)");

      ctx.fillStyle = grad;
      ctx.beginPath();

      // 상단 물결
      ctx.moveTo(-60, band.y0 - band.width * 0.5);
      for (let x = -60; x <= w + 60; x += 40) {
        const wy = band.y0 - band.width * 0.5 + Math.sin((x + scrollX) * 0.025 + b) * band.waveA;
        ctx.lineTo(x, wy);
      }
      // 하단 물결
      for (let x = w + 60; x >= -60; x -= 40) {
        const wy = band.y0 + band.width * 0.5 + Math.sin((x + scrollX) * 0.025 + b) * band.waveA;
        ctx.lineTo(x, wy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // 3. 5세대 전장 부유 다이아몬드 더스트 & 미세 눈결정 (Diamond Dust Shimmer)
  // - 36개의 미세 얼음 결정이 허공에서 반짝이며 바람을 타고 흩날림
  const dustAlpha = Math.sin(normProg * Math.PI) * 0.85;
  if (dustAlpha > 0.01) {
    const numDust = 36;
    for (let i = 0; i < numDust; i++) {
      const seedI = i * 19.3 + 7.1;
      const baseDX = ((seedI * 47.3) % w);
      const baseDY = ((seedI * 79.1) % (h - 40)) + 20;
      const dustSpeed = 140 + (i % 5) * 35;

      // 바람에 의한 수평 좌향 이동 + 상하 미세 부유
      const curDX = ((baseDX - normProg * dustSpeed) % w + w) % w;
      const curDY = baseDY + Math.sin(normProg * 12 + i) * 6;

      const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(normProg * 18 + i * 2.1));
      const pSize = 1.0 + (i % 3) * 0.7;

      ctx.save();
      ctx.globalAlpha = dustAlpha * twinkle;
      ctx.fillStyle = (i % 2 === 0) ? "rgba(255, 255, 255, 0.95)" : "rgba(186, 230, 253, 0.90)";

      if (i % 4 === 0) {
        // 작은 다이아몬드 형태
        ctx.beginPath();
        ctx.moveTo(curDX, curDY - pSize * 1.3);
        ctx.lineTo(curDX + pSize * 0.8, curDY);
        ctx.lineTo(curDX, curDY + pSize * 1.3);
        ctx.lineTo(curDX - pSize * 0.8, curDY);
        ctx.closePath();
        ctx.fill();
      } else {
        // 원형 점
        ctx.beginPath();
        ctx.arc(curDX, curDY, pSize * 0.65, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * 258: 싸라기눈 메인 전면 이펙트 렌더러 (drawHailEffect)
 * - 5세대 스타일 다층(근경/중경/원경) 3D 투명 얼음 돌멩이 쇄도
 * - 지면 충돌 순간: 순간 발광 링 + 방사형으로 폭발 비산하는 5~7개의 날카로운 얼음 파편 칩(Ice Shards)
 * - 통통 튀는 탄도학 바운스 (1차 대형 점프 ➔ 2차 소형 점프 ➔ 안착)
 */
export function drawHailEffect(
  ctx: any,
  frame: BattleFrame,
  _drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;

  const step = frame.moveStep || 1;
  const prog = frame.effectProgress || 0;

  // 3개 스텝에 걸쳐 0.0 ~ 1.0으로 단조 증가하는 절대 시간축
  const t = step === 1
    ? prog * 0.28
    : (step === 2
      ? 0.28 + prog * 0.52
      : 0.80 + prog * 0.20);

  ctx.save();

  // 모든 싸라기눈 돌멩이 및 바닥 충돌 바운스 시뮬레이션
  for (const s of HAIL_STONES) {
    const t1 = s.tFallStart;
    const t2 = t1 + s.fallDur;            // 1차 바닥 착지 (Impact 1)
    const t3 = t2 + s.bounce1Dur;         // 2차 바닥 착지 (Impact 2)
    const t4 = t3 + s.bounce2Dur;         // 안착 시작
    const t5 = t4 + s.settleDur;          // 소멸 완료

    // ------------------------------------------------------------------------
    // A. 5세대 지면 착지 연출: 순간 충격 발광 링 + 폭발 비산하는 날카로운 얼음 파편(Ice Shards)
    // ------------------------------------------------------------------------
    // 1차 착지 연출 (t2 ~ t2 + 0.12)
    if (t >= t2 && t < t2 + 0.12) {
      const hitU = (t - t2) / 0.12;
      const hitR = s.size * (0.9 + hitU * 2.4);
      const hitAlpha = Math.max(0, 1.0 - hitU) * 0.85;

      ctx.save();

      // 1) 지면 충격 외곽 발광 타원
      ctx.fillStyle = `rgba(224, 242, 254, ${hitAlpha * 0.45})`;
      ctx.beginPath();
      ctx.ellipse(s.landingX, s.landingY, hitR, hitR * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2) 지면 충격 코어 발광
      ctx.fillStyle = `rgba(255, 255, 255, ${hitAlpha * 0.75})`;
      ctx.beginPath();
      ctx.ellipse(s.landingX, s.landingY, hitR * 0.45, hitR * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3) 5세대 특유의 폭발 비산하는 날카로운 얼음 파편 칩 5~7개 (Shattered Ice Shards)
      const numChips = s.layer === "front" ? 7 : (s.layer === "mid" ? 5 : 3);
      for (let c = 0; c < numChips; c++) {
        const spreadAng = -Math.PI * 0.5 + (c - (numChips - 1) * 0.5) * 0.42 + Math.sin(s.seed * 3.1 + c) * 0.18;
        const chipSpeed = (12 + (s.seed % 5) * 3.5 + c * 2.2);
        const chipDist = hitU * chipSpeed;
        const chipX = s.landingX + Math.cos(spreadAng) * chipDist;
        // 포물선 중력 낙하
        const chipY = s.landingY + Math.sin(spreadAng) * chipDist + hitU * hitU * 11;
        const chipSize = Math.max(0.8, (s.size * 0.22) * (1.0 - hitU * 0.45));

        ctx.save();
        ctx.translate(chipX, chipY);
        ctx.rotate(spreadAng + hitU * 7.5);
        ctx.fillStyle = (c % 2 === 0) ? `rgba(255, 255, 255, ${hitAlpha * 0.95})` : `rgba(186, 230, 253, ${hitAlpha * 0.90})`;

        // 날카로운 다이아몬드 크리스탈 파편
        ctx.beginPath();
        ctx.moveTo(0, -chipSize * 1.2);
        ctx.lineTo(chipSize * 0.7, 0);
        ctx.lineTo(0, chipSize * 1.2);
        ctx.lineTo(-chipSize * 0.7, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    }

    // 2차 착지 소형 연출 (t3 ~ t3 + 0.07)
    if (t >= t3 && t < t3 + 0.07) {
      const hitU2 = (t - t3) / 0.07;
      const hitR2 = s.size * (0.6 + hitU2 * 1.5);
      const hitAlpha2 = Math.max(0, 1.0 - hitU2) * 0.60;
      const impact2X = s.landingX + s.bounce1Drift;

      ctx.save();
      ctx.fillStyle = `rgba(186, 230, 253, ${hitAlpha2 * 0.38})`;
      ctx.beginPath();
      ctx.ellipse(impact2X, s.landingY, hitR2, hitR2 * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2차 착지 시 작은 얼음 불꽃 2개
      for (let c = 0; c < 2; c++) {
        const cAng = -Math.PI * 0.5 + (c === 0 ? -0.4 : 0.4);
        const cDist = hitU2 * 8;
        const cx = impact2X + Math.cos(cAng) * cDist;
        const cy = s.landingY + Math.sin(cAng) * cDist + hitU2 * hitU2 * 5;
        ctx.fillStyle = `rgba(255, 255, 255, ${hitAlpha2 * 0.90})`;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(0.5, s.size * 0.15), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // ------------------------------------------------------------------------
    // B. 3D 얼음 돌멩이 본체 (낙하 ➔ 1차 탄도학 바운스 ➔ 2차 바운스 ➔ 안착)
    // ------------------------------------------------------------------------
    if (t < t1 || t >= t5) continue;

    let curX = s.landingX;
    let curY = s.landingY;
    let curRot = t * s.rotSpeed;
    let curAlpha = 1.0;

    // 1) 상공 고속 수직/약사선 낙하 (선 전혀 없음!)
    if (t < t2) {
      const u = (t - t1) / s.fallDur;
      const fallEased = Math.pow(u, 1.45); // 중력 가속도

      curX = s.startX + (s.landingX - s.startX) * fallEased;
      curY = s.startY + (s.landingY - s.startY) * fallEased;
      curRot = u * s.rotSpeed * 2.4;
    }
    // 2) 1차 대형 탄도학 바운스 (통!)
    else if (t < t3) {
      const u = (t - t2) / s.bounce1Dur;
      // 완벽한 포물선 바운스
      const arcH = Math.sin(u * Math.PI) * s.bounce1Height;

      curX = s.landingX + s.bounce1Drift * u;
      curY = s.landingY - arcH;
      // 충돌 후 리바운드 탄성 회전 가속
      curRot = (1.0 + u * 1.8) * s.rotSpeed;
    }
    // 3) 2차 소형 탄도학 바운스 (통!)
    else if (t < t4) {
      const u = (t - t3) / s.bounce2Dur;
      const arcH = Math.sin(u * Math.PI) * s.bounce2Height;

      curX = s.landingX + s.bounce1Drift + s.bounce2Drift * u;
      curY = s.landingY - arcH;
      curRot = (2.8 + u * 1.2) * s.rotSpeed;
    }
    // 4) 바닥 안착 및 서서히 부드러운 융해/소산
    else {
      const u = (t - t4) / s.settleDur;
      curX = s.landingX + s.bounce1Drift + s.bounce2Drift;
      curY = s.landingY;
      curAlpha = Math.max(0, 1.0 - u);
      curRot = 4.0 * s.rotSpeed;
    }

    // 3D 투명 얼음 돌멩이 렌더링
    draw3DIceHailStone(ctx, curX, curY, s.size, curRot, s.seed, curAlpha);
  }

  ctx.restore();
}

// ============================================================================
// 👿 259: 트집 (Torment / いちゃもん) - 악 타입 변화 기술
//
// 명중: 100 / PP: 15 / 악 타입 변화
// 설명: 상대에게 트집을 잡아서 똑같은 기술을 2회 연속으로 쓸 수 없게 한다.
//
// [유저 지정 연출 시퀀스]:
// 1. [말풍선 생김]: 시전 포켓몬 앞에 팝업 말풍선 출현 (Scale 0.35 ➔ 1.10 ➔ 1.0)
// 2. [말풍선 안에 꼬임선 동그랗게 생김]: 말풍선 중심에서부터 엉킨 검은 꼬임선이 동그랗게 차오름 (욕설/투덜거림 묘사)
// 3. [대상포켓몬 빨갛게 변하면서 뽐내기 당했을 때 연출]:
//    - 대상 포켓몬이 분노로 빨갛게 물듦 (30% ➔ 70% ➔ 100% 피크 ➔ 페이드아웃)
//    - 대상 머리에 화난 빠직(💢) 마크 팝인 & 팽창 맥동
//    - 대상 포켓몬 분노로 부들부들 진동
// ============================================================================

/**
 * 말풍선 내부 입체 볼륨감 만화 꼬불선 뭉치 (Volumetric 3D Scribble Tangle)
 * - 납작하게 찌그러진 타원을 탈피하여 상하좌우 균형 잡힌 구형 실타래 볼륨(13px x 12px) 형성
 * - [후면 심도 루프 + 전면 똬리 코일 + 입체 오버래핑 가닥] 3단 레이어로 풍성한 3D 깊이감 연출
 */
function drawTormentScribble(
  ctx: any,
  cx: number,
  cy: number,
  scale: number = 1.0,
  progress: number = 1.0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || progress <= 0.01 || scale <= 0.01) return;

  ctx.save();
  ctx.translate(cx, cy);

  // 말풍선 중심 순백색 안전 구역(가로 19.5px, 세로 15.0px) 클리핑 (바깥 이탈 절대 방지)
  ctx.beginPath();
  ctx.ellipse(0, 0, 19.5 * scale, 15.0 * scale, 0, 0, Math.PI * 2);
  ctx.clip();

  // 미세한 분노 지터 (트집 잡는 동안 찌릿찌릿 떠는 진동)
  if (progress >= 0.8) {
    const jitterX = Math.sin(progress * 52) * 0.6;
    const jitterY = Math.cos(progress * 64) * 0.6;
    ctx.translate(jitterX, jitterY);
  }

  // 상하좌우 볼륨 비율 복원 (가로 13.0px, 세로 12.0px - 둥글고 풍성한 3D 구형 덩어리감)
  const rx = 13.0 * scale;
  const ry = 12.0 * scale;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // --------------------------------------------------------------------------
  // Layer 1: 후면 심도 음영 꼬불선 (Depth Under-layer - 깊이감 형성)
  // --------------------------------------------------------------------------
  if (progress >= 0.25) {
    const bgProg = Math.min(1.0, (progress - 0.25) / 0.55);
    ctx.strokeStyle = `rgba(63, 63, 70, ${0.75 * alpha})`;
    ctx.lineWidth = 1.35;

    const BACK_POINTS = [
      { x: -0.2, y: -0.1 },
      { x: 0.5, y: -0.7 },
      { x: 0.85, y: -0.2 },
      { x: 0.4, y: 0.65 },
      { x: -0.5, y: 0.8 },
      { x: -0.85, y: 0.2 },
      { x: -0.6, y: -0.7 },
      { x: 0.1, y: -0.85 },
      { x: 0.7, y: -0.5 },
      { x: 0.75, y: 0.3 },
      { x: -0.2, y: 0.75 },
      { x: -0.75, y: 0.4 },
      { x: -0.4, y: -0.4 },
      { x: 0.3, y: -0.1 },
    ];
    const bCount = Math.max(2, Math.floor(bgProg * BACK_POINTS.length));
    ctx.beginPath();
    ctx.moveTo(BACK_POINTS[0].x * rx, BACK_POINTS[0].y * ry);
    for (let i = 1; i < bCount; i++) {
      const p = BACK_POINTS[i];
      const prev = BACK_POINTS[i - 1];
      ctx.quadraticCurveTo(prev.x * rx, prev.y * ry, ((prev.x + p.x) / 2) * rx, ((prev.y + p.y) / 2) * ry);
    }
    ctx.stroke();
  }

  // --------------------------------------------------------------------------
  // Layer 2: 전면 메인 볼륨 실타래 똬리 (Foreground Volumetric Coils)
  // --------------------------------------------------------------------------
  ctx.strokeStyle = `rgba(15, 15, 18, ${alpha})`;
  ctx.lineWidth = 2.1;

  // 상하좌우로 똬리를 틀며 3차원 볼륨을 만드는 노드들
  const MAIN_COILS = [
    { x: 0.0, y: 0.15 },
    { x: 0.35, y: -0.3 },
    { x: 0.8, y: -0.8 },   // 우상단 볼륨 루프
    { x: 0.2, y: -1.05 },  // 상단 높은 정점
    { x: -0.6, y: -0.85 }, // 좌상단 볼륨 루프
    { x: -1.05, y: -0.25 }, // 좌측 외곽 똬리
    { x: -0.5, y: 0.35 },
    { x: -0.85, y: 0.95 }, // 좌하단 풍성한 똬리
    { x: -0.1, y: 1.1 },   // 하단 깊은 볼륨
    { x: 0.55, y: 0.8 },   // 우하단 볼륨
    { x: 1.05, y: 0.3 },   // 우측 외곽 똬리
    { x: 0.7, y: -0.35 },
    { x: 0.95, y: -0.9 },
    { x: 0.1, y: -0.65 },
    { x: -0.75, y: -0.95 },
    { x: -1.1, y: -0.4 },
    { x: -0.65, y: 0.15 },
    { x: -0.95, y: 0.75 },
    { x: 0.2, y: 0.6 },
    { x: 0.8, y: 0.95 },
    { x: 1.0, y: 0.1 },
    { x: 0.35, y: -0.55 },
    { x: -0.3, y: -0.75 },
    { x: -0.75, y: -0.25 },
    { x: -0.15, y: 0.4 },
    { x: 0.6, y: 0.25 },
    { x: 0.7, y: -0.6 },
    { x: -0.1, y: -0.3 },
    { x: -0.55, y: 0.55 },
    { x: 0.35, y: 0.65 },
    { x: 0.05, y: 0.0 },
  ];

  const totalPoints = MAIN_COILS.length;
  const visiblePointsCount = Math.max(2, Math.floor(progress * totalPoints));

  ctx.beginPath();
  const p0 = MAIN_COILS[0];
  ctx.moveTo(p0.x * rx, p0.y * ry);

  for (let i = 1; i < visiblePointsCount; i++) {
    const prev = MAIN_COILS[i - 1];
    const curr = MAIN_COILS[i];
    const midX = ((prev.x + curr.x) / 2) * rx;
    const midY = ((prev.y + curr.y) / 2) * ry;
    ctx.quadraticCurveTo(prev.x * rx, prev.y * ry, midX, midY);
  }

  if (visiblePointsCount < totalPoints && visiblePointsCount >= 1) {
    const last = MAIN_COILS[visiblePointsCount - 1];
    const next = MAIN_COILS[visiblePointsCount];
    const frac = (progress * totalPoints) - visiblePointsCount + 1;
    const curX = (last.x + (next.x - last.x) * frac) * rx;
    const curY = (last.y + (next.y - last.y) * frac) * ry;
    ctx.lineTo(curX, curY);
  }
  ctx.stroke();

  // --------------------------------------------------------------------------
  // Layer 3: 전면 교차 오버래핑 루프 (Cross Overlap Strands - 입체감 결정타)
  // --------------------------------------------------------------------------
  if (progress >= 0.55) {
    const frontAlpha = Math.min(1.0, (progress - 0.55) / 0.35) * alpha;
    ctx.strokeStyle = `rgba(10, 10, 12, ${frontAlpha})`;
    ctx.lineWidth = 2.3;

    // 중심부를 사선으로 둥글게 가로지르는 굵은 입체 가닥 (앞뒤 원근 형성)
    ctx.beginPath();
    ctx.moveTo(-0.75 * rx, -0.45 * ry);
    ctx.bezierCurveTo(-0.2 * rx, -1.05 * ry, 0.4 * rx, -0.85 * ry, 0.75 * rx, -0.3 * ry);
    ctx.bezierCurveTo(0.95 * rx, 0.3 * ry, 0.4 * rx, 0.95 * ry, -0.3 * rx, 0.65 * ry);
    ctx.stroke();

    // 우하단에서 좌상단으로 휘감는 2차 볼륨 가닥
    if (progress >= 0.75) {
      ctx.beginPath();
      ctx.moveTo(0.65 * rx, 0.5 * ry);
      ctx.bezierCurveTo(0.1 * rx, 0.9 * ry, -0.8 * rx, 0.4 * ry, -0.5 * rx, -0.5 * ry);
      ctx.stroke();
    }
  }

  // 4. 만화풍 분노 틱 파편 점
  if (progress >= 0.7) {
    const dotsAlpha = Math.min(1.0, (progress - 0.7) / 0.3) * alpha;
    ctx.fillStyle = `rgba(18, 18, 20, ${dotsAlpha})`;
    const DOTS = [
      { x: 0.75 * rx, y: -0.85 * ry, r: 1.1 },
      { x: -0.9 * rx, y: 0.65 * ry, r: 1.0 },
      { x: 0.35 * rx, y: 1.05 * ry, r: 0.9 },
    ];
    for (const d of DOTS) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * 트집 시전자 앞 말풍선 (Torment Speech Bubble)
 * - 보더 제거: 순수 화이트 바디 + 부드러운 드롭 섀도우
 */
function drawSpeechBubble(
  ctx: any,
  bx: number,
  by: number,
  isPlayer: boolean,
  scale: number = 1.0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || scale <= 0.01) return;

  ctx.save();
  ctx.translate(bx, by);
  ctx.scale(scale, scale);
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const rw = 25; // 가로 반지름
  const rh = 18; // 세로 반지름

  // 부드러운 타원 + 꼬리 복합 경로
  // 플레이어: 말풍선이 포켓몬 완전 우측 바깥에 있으므로 좌하단에서 포켓몬 쪽을 가리킴
  // 상대(전면): 말풍선이 포켓몬 완전 좌측 바깥에 있으므로 우하단에서 포켓몬 쪽을 가리킴
  const startAng = isPlayer ? Math.PI * 0.82 : Math.PI * 0.35;
  const endAng = isPlayer ? Math.PI * 0.65 : Math.PI * 0.18;
  const tipX = isPlayer ? -rw * 1.45 : rw * 1.45;
  const tipY = rh * 1.30;

  ctx.beginPath();
  ctx.ellipse(0, 0, rw, rh, 0, startAng, endAng, false);
  ctx.lineTo(tipX, tipY);
  ctx.closePath();

  // [유저 요구사항 100% 반영]: 말풍선 보더 외각 투명화
  // 중심부는 순백색(1.0) 유지, 외곽 보더 경계선으로 갈수록 부드럽게 0% 투명해지는 방사형 그라데이션
  const maxR = Math.max(rw, rh) * 1.15;
  const bubbleGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR);
  bubbleGrad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  bubbleGrad.addColorStop(0.65, "rgba(255, 255, 255, 0.95)");
  bubbleGrad.addColorStop(0.85, "rgba(255, 255, 255, 0.45)");
  bubbleGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.fillStyle = bubbleGrad;
  ctx.fill();

  ctx.restore();
}

export function drawTormentBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  // 트집은 전면 레이어에서 렌더링
}

export function drawTormentEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const isPlayer = drawCtx.isPlayer ?? true;
  const isHit = drawCtx.isHit !== false;
  const moveStep = frame.moveStep ?? 1;

  ctx.save();

  // ==========================================================================
  // [Step 1]: 시전자 포켓몬 앞 말풍선 & 말풍선 안 동그란 꼬임선 생성
  // ==========================================================================
  if (frame.tormentBubble) {
    const { scale = 1.0, alpha = 1.0, scribble = 0.0 } = frame.tormentBubble;
    if (alpha > 0.01 && scale > 0.01) {
      const cPos = drawCtx.casterPos ?? drawCtx.attackerPos ?? (isPlayer ? { x: 150, y: 280 } : { x: 418, y: 152 });
      const casterOff = isPlayer ? (frame.pOffset ?? { x: 0, y: 0 }) : (frame.eOffset ?? { x: 0, y: 0 });
      const casterX = cPos.x + casterOff.x;
      const casterY = cPos.y + casterOff.y;

      // [유저 요구사항 100% 엄수]:
      // 포켓몬마다 가로 스프라이트 너비가 상대적이므로, 실제 렌더링 스프라이트의 픽셀 폭을
      // 실시간 동적 측정(getFittedBattleSpriteBounds)하여 크기와 무관하게 최외곽면에 완벽 밀착
      const casterSprite = isPlayer ? drawCtx.playerSprite : drawCtx.enemySprite;
      const targetSize = isPlayer ? (drawCtx.pm?.size || 135) : (drawCtx.em?.size || 135);
      const bounds = getFittedBattleSpriteBounds(casterSprite, targetSize);
      const halfW = bounds?.drawW ? (bounds.drawW / 2) : (targetSize * 0.42);

      const rw = 25; // 말풍선 가로 반지름
      const margin = 8; // 스프라이트와 말풍선 사이 최소 안전 마진

      // 1. 플레이어: 포켓몬 실제 우측 끝(casterX + halfW) 바로 바깥 허공에 배치 (높이 -50 유지)
      // 2. 상대(전면): 포켓몬 실제 좌측 끝(casterX - halfW) 바로 바깥 허공에 배치 (높이 -26 유지)
      const bubbleX = isPlayer
        ? (casterX + halfW + rw + margin)
        : (casterX - halfW - rw - margin);
      const bubbleY = isPlayer ? (casterY - 50) : (casterY - 26);

      // 1. 말풍선 그리기 (보더 제거)
      drawSpeechBubble(ctx, bubbleX, bubbleY, isPlayer, scale, alpha);

      // 2. 말풍선 내부 동그란 꼬임선 그리기 (말풍선 내부 절대 이탈 방지)
      if (scribble > 0.01) {
        drawTormentScribble(ctx, bubbleX, bubbleY - 1, scale, scribble, alpha);
      }
    }
  }

  // ==========================================================================
  // [Step 2]: 대상포켓몬 빨갛게 변하면서 뽐내기 당했을 때 연출 (화난 빠직 💢)
  // ==========================================================================
  if (isHit && moveStep === 2 && frame.tormentVein) {
    const targetPos = drawCtx.targetPos || (isPlayer ? { x: 380, y: 130 } : { x: 150, y: 280 });
    const targetHeadX = targetPos.x + (isPlayer ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
    const targetHeadY = targetPos.y + (isPlayer ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0)) - (isPlayer ? 30 : 38);

    const v = frame.tormentVein;
    const baseSize = isPlayer ? 16 : 14;
    // 유저 지침/뽐내기 고증: 상대방(적)이면 머리 왼쪽, 내 포켓몬이면 머리 오른쪽
    const vx = targetHeadX + (isPlayer ? -22 : 22);
    const vy = targetHeadY - 12;
    const rot = isPlayer ? -0.16 : 0.16;

    drawAngerVeinMark(ctx, vx, vy, baseSize * (v.scale ?? 1.0), v.alpha ?? 1.0, v.popProgress ?? 1.0, rot);
  }

  ctx.restore();
}

// ============================================================================
// 🎭 260: 부추기기 (Flatter / おだてる) - 악 타입 변화 기술
//
// 위력: - / 명중: 100 / PP: 15 / 상대 특공 1랭크 상승 & 100% 혼란
// 설명: 상대를 부추겨서 혼란시킨다. 동시에 상대의 특수공격도 올라가 버린다.
//
// [유저 지정 연출 시퀀스]:
// 1. [시전포켓몬 세로로 2번 길어졌다 돌아오기]:
//    - 시전자 포켓몬이 상하로 길쭉하게 늘어났다 정위치로 돌아오는 모션 2회 반복
// 2. [대상포켓몬 스포트라이트 이후 혼란]:
//    - 대상 포켓몬 머리 위에서부터 지면으로 내리쬐는 극장식 스포트라이트 조명
//    - 대상 발밑의 원형 조명풀(Floor Light Pool) & 광선 기둥(Light Cone) 및 부유하는 빛가루
//    - 이후 대상 머리 위 3D 궤도 회전 별무리(★ ★ ★) 공전 & 비틀거리며 혼란 돌입
// ============================================================================

export function drawFlatterBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const isPlayer = drawCtx.isPlayer ?? true;
  const isHit = drawCtx.isHit !== false;
  const moveStep = frame.moveStep ?? 1;

  if (!isHit || moveStep !== 2) return;

  const spot = frame.flatterSpotlight;
  if (!spot || spot.alpha <= 0.01) return;

  const spotAlpha = Math.max(0, Math.min(1.0, spot.alpha));
  const targetPos = drawCtx.targetPos || (isPlayer ? { x: 380, y: 130 } : { x: 150, y: 280 });
  const targetFloorX = targetPos.x + (isPlayer ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));

  // [달빛(Moonlight 236) 지면 좌표 완벽 동기화]: 포켓몬 발밑 지면(플랫폼 상단 접촉면) Y 좌표
  const baseGroundY = isPlayer
    ? (drawCtx.em?.y ?? (targetPos.y + 36))
    : (drawCtx.pm?.y ?? (targetPos.y + 36));
  const targetFloorY = baseGroundY + 2 + (isPlayer ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0));

  const rBottom = isPlayer ? 48 : 64;

  ctx.save();

  // 1. 대상 발밑 바닥 조명풀 (Floor Light Pool)
  ctx.translate(targetFloorX, targetFloorY);
  ctx.scale(1.0, 0.35);
  ctx.beginPath();
  ctx.arc(0, 0, rBottom, 0, Math.PI * 2);
  const floorGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, rBottom);
  floorGrad.addColorStop(0.0, `rgba(255, 255, 220, ${(0.85 * spotAlpha).toFixed(3)})`);
  floorGrad.addColorStop(0.35, `rgba(255, 250, 180, ${(0.60 * spotAlpha).toFixed(3)})`);
  floorGrad.addColorStop(0.70, `rgba(255, 240, 140, ${(0.25 * spotAlpha).toFixed(3)})`);
  floorGrad.addColorStop(1.0, "rgba(255, 230, 100, 0.0)");
  ctx.fillStyle = floorGrad;
  ctx.fill();

  ctx.restore();
}

export function drawFlatterEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const isPlayer = drawCtx.isPlayer ?? true;
  const isHit = drawCtx.isHit !== false;
  const moveStep = frame.moveStep ?? 1;

  if (!isHit || moveStep !== 2) return;

  ctx.save();

  const targetPos = drawCtx.targetPos || (isPlayer ? { x: 380, y: 130 } : { x: 150, y: 280 });
  const targetFloorX = targetPos.x + (isPlayer ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));

  // [달빛(Moonlight 236) 지면 좌표 완벽 동기화]: 포켓몬 발밑 지면 Y 좌표
  const baseGroundY = isPlayer
    ? (drawCtx.em?.y ?? (targetPos.y + 36))
    : (drawCtx.pm?.y ?? (targetPos.y + 36));
  const targetFloorY = baseGroundY + 2 + (isPlayer ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0));

  // 1. [스포트라이트 전면 광선 기둥 & 빛가루]
  const spot = frame.flatterSpotlight;
  if (spot && spot.alpha > 0.01) {
    const spotAlpha = Math.max(0, Math.min(1.0, spot.alpha));
    // [유저 지침 100% 엄수]: 대각선이 아닌 수직 조명 & 바닥까지 완벽하게 도달하는 광선 기둥 (달빛 고증)
    const lightSourceX = targetFloorX;
    const beamTopY = targetFloorY - 330;
    const rTop = isPlayer ? 14 : 18;
    const rBottom = isPlayer ? 48 : 64;

    // (1) 부드러운 외곽 광채 (Outer Ambient Cone)
    ctx.beginPath();
    ctx.moveTo(lightSourceX - rTop * 1.5, beamTopY);
    ctx.lineTo(lightSourceX + rTop * 1.5, beamTopY);
    ctx.lineTo(targetFloorX + rBottom * 1.30, targetFloorY);
    ctx.lineTo(targetFloorX - rBottom * 1.30, targetFloorY);
    ctx.closePath();
    const haloGrad = ctx.createLinearGradient(lightSourceX, beamTopY, targetFloorX, targetFloorY);
    haloGrad.addColorStop(0.0, `rgba(255, 255, 230, ${(0.22 * spotAlpha).toFixed(3)})`);
    haloGrad.addColorStop(0.5, `rgba(255, 250, 190, ${(0.14 * spotAlpha).toFixed(3)})`);
    haloGrad.addColorStop(1.0, "rgba(255, 240, 150, 0.0)");
    ctx.fillStyle = haloGrad;
    ctx.fill();

    // (2) 중심 조명 광선 (Main Spotlight Beam)
    ctx.beginPath();
    ctx.moveTo(lightSourceX - rTop, beamTopY);
    ctx.lineTo(lightSourceX + rTop, beamTopY);
    ctx.lineTo(targetFloorX + rBottom, targetFloorY);
    ctx.lineTo(targetFloorX - rBottom, targetFloorY);
    ctx.closePath();
    const beamGrad = ctx.createLinearGradient(lightSourceX, beamTopY, targetFloorX, targetFloorY);
    beamGrad.addColorStop(0.0, `rgba(255, 255, 240, ${(0.50 * spotAlpha).toFixed(3)})`);
    beamGrad.addColorStop(0.3, `rgba(255, 255, 220, ${(0.38 * spotAlpha).toFixed(3)})`);
    beamGrad.addColorStop(0.7, `rgba(255, 250, 190, ${(0.28 * spotAlpha).toFixed(3)})`);
    beamGrad.addColorStop(1.0, `rgba(255, 245, 170, ${(0.15 * spotAlpha).toFixed(3)})`);
    ctx.fillStyle = beamGrad;
    ctx.fill();

    // (3) 조명 안에서 부유하는 무대 먼지/빛가루 (Stage Dust Motes)
    const tVal = (spot.time ?? 0.5) * 10;
    for (let i = 0; i < 14; i++) {
      const pProg = ((i * 0.17 + tVal * 0.08) % 1.0);
      const px = lightSourceX + Math.sin(i * 3.7 + tVal * 0.5) * (rBottom * 0.45 * pProg);
      const py = beamTopY + (targetFloorY - beamTopY) * pProg;
      const pAlpha = Math.sin(pProg * Math.PI) * 0.70 * spotAlpha;
      const pRadius = 1.0 + (i % 3) * 0.6;
      ctx.beginPath();
      ctx.arc(px, py, pRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 230, ${pAlpha.toFixed(3)})`;
      ctx.fill();
    }
  }

  // 2. [대상포켓몬 혼란(Confusion) 3D 궤도 회전 별무리]
  const confProg = frame.confusionProgress ?? 0;
  if (confProg > 0) {
    const targetHeadX = targetPos.x + (isPlayer ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
    const targetHeadY = targetPos.y + (isPlayer ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0)) - (isPlayer ? 30 : 38);
    drawConfusionEffect(ctx, targetHeadX, targetHeadY - 8, confProg);
  }

  ctx.restore();
}

