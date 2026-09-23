// ============================================================================
// ⚠️ [기술 이펙트 제작 지침 - 256색 팔레트 최적화(Octree Optimizer) 기준]
// 1. 배틀 GIF 렌더러는 Octree Quantizer + useOptimizer (threshold: 85) 기반의
//    256색 팔레트 재사용 표준을 채택하고 있음.
// 2. 기술 제작 시 불필요한 과도한 그라디언트 난사를 지양하고, 256색 팔레트 환경에서
//    선명하게 돋보이는 핵심 고채도 단색/네온 색상 체계 및 30 FPS 규격을 기준으로 제작할 것.
// 3. 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
//    직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { drawStarburstImpact } from "../common/helpers.js";
import { drawPerspectiveSilhouetteShadow } from "../../common/spriteLoader.js";

// ============================================================================
// 공통 대지/바위/먼지 헬퍼
// ============================================================================

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let c = hex.replace("#", "").trim();
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  const num = parseInt(c, 16);
  if (isNaN(num)) return { r: 188, g: 170, b: 164 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * 모래먼지 연기 퍼프 (Sand Dust Puff)
 * - [유저 요청 반영] 외곽 형태가 딱딱하고 선명하게 보이는 문제를 완벽 해결
 * - 중심부는 흙먼지 질감을 유지하고, 외곽 경계선으로 갈수록 100% 투명(alpha 0.0)으로 부드럽게 감쇄
 * - 다중 방사형 그라데이션 구름으로 몽실몽실하고 자연스러운 실제 연기/먼지 질감 구현
 */
function drawDustPuff(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number,
  fillColor: string = "#D7CCC8"
) {
  if (alpha <= 0.01 || radius <= 0.5) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const rgb = fillColor.startsWith("#") ? hexToRgb(fillColor) : { r: 188, g: 170, b: 164 };
  const rStr = `${rgb.r}, ${rgb.g}, ${rgb.b}`;

  // 3개의 유기적 중첩 퍼프: 각각 외곽이 투명(0.0)으로 페이드아웃되는 방사형 그라데이션
  const blobs = [
    { x: cx, y: cy, r: radius, w: 1.0 },
    { x: cx - radius * 0.45, y: cy - radius * 0.15, r: radius * 0.72, w: 0.85 },
    { x: cx + radius * 0.42, y: cy - radius * 0.18, r: radius * 0.68, w: 0.85 },
  ];

  for (const b of blobs) {
    const grad = ctx.createRadialGradient(b.x, b.y, b.r * 0.15, b.x, b.y, b.r);
    grad.addColorStop(0, `rgba(${rStr}, ${0.85 * b.w})`);
    grad.addColorStop(0.45, `rgba(${rStr}, ${0.50 * b.w})`);
    grad.addColorStop(0.75, `rgba(${rStr}, ${0.18 * b.w})`);
    grad.addColorStop(1.0, `rgba(${rStr}, 0.0)`); // 외곽은 100% 완전 투명!

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 3D 각진 암석 파편 (Debris Rock Pebble)
 */
function drawRockPebble(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  rotation: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  const s = size;
  // 베이스 암석 바디
  ctx.fillStyle = "#5D4037";
  ctx.beginPath();
  ctx.moveTo(-s * 0.8, -s * 0.3);
  ctx.lineTo(-s * 0.2, -s * 0.9);
  ctx.lineTo(s * 0.7, -s * 0.4);
  ctx.lineTo(s * 0.9, s * 0.5);
  ctx.lineTo(0, s * 0.85);
  ctx.lineTo(-s * 0.7, s * 0.5);
  ctx.closePath();
  ctx.fill();

  // 상단 하이라이트 패싯
  ctx.fillStyle = "#8D6E63";
  ctx.beginPath();
  ctx.moveTo(-s * 0.8, -s * 0.3);
  ctx.lineTo(-s * 0.2, -s * 0.9);
  ctx.lineTo(s * 0.7, -s * 0.4);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();

  // 하단 섀도우 패싯
  ctx.fillStyle = "#3E2723";
  ctx.beginPath();
  ctx.moveTo(s * 0.7, -s * 0.4);
  ctx.lineTo(s * 0.9, s * 0.5);
  ctx.lineTo(0, s * 0.85);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 3D 대지 융기 암반 블록 (Tectonic Ground Slab)
 */
function drawTectonicSlab(
  ctx: any,
  bx: number,
  by: number,
  width: number,
  height: number,
  tiltAngle: number,
  riseAmount: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || riseAmount <= 0.5) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;
  ctx.translate(bx, by);
  ctx.rotate(tiltAngle);

  const w = width * 0.5;
  const h = riseAmount;

  // 1) 블록 하단 흙/단층 벽면 (#3E2723 - 짙은 단층 암갈색)
  ctx.fillStyle = "#3E2723";
  ctx.beginPath();
  ctx.moveTo(-w, 0);
  ctx.lineTo(-w, -h);
  ctx.lineTo(w, -h);
  ctx.lineTo(w, 0);
  ctx.closePath();
  ctx.fill();

  // 2) 블록 우측 측면 음영 (#2E1C14)
  ctx.fillStyle = "#27170E";
  ctx.beginPath();
  ctx.moveTo(w * 0.4, -h);
  ctx.lineTo(w, -h);
  ctx.lineTo(w, 0);
  ctx.lineTo(w * 0.4, 0);
  ctx.closePath();
  ctx.fill();

  // 3) 블록 상단 거친 표면 (#6D4C41 / #8D6E63)
  ctx.fillStyle = "#795548";
  ctx.beginPath();
  ctx.moveTo(-w * 1.05, -h);
  ctx.lineTo(-w * 0.2, -h - 4);
  ctx.lineTo(w * 1.05, -h);
  ctx.lineTo(w * 0.3, -h + 3);
  ctx.closePath();
  ctx.fill();

  // 4) 상단 모서리 하이라이트 (#BCAAA4)
  ctx.strokeStyle = "#BCAAA4";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-w * 1.05, -h);
  ctx.lineTo(-w * 0.2, -h - 4);
  ctx.lineTo(w * 1.05, -h);
  ctx.stroke();

  ctx.restore();
}

// ============================================================================
// 089: 지진 (Earthquake)
// ============================================================================

interface EarthquakeCrackDef {
  points: { dx: number; dy: number }[];
  startProg: number;
  endProg: number;
  baseWidth: number;
}

/**
 * 지진 단층 균열선 정의
 * - 시차(startProg ~ endProg)를 두어 대지가 한순간에 갈라지지 않고 차례대로 찢어지며 뻗어나가도록 구성
 */
const EARTHQUAKE_CRACKS: EarthquakeCrackDef[] = [
  // 1. 메인 좌측 전방 단층선 (가장 먼저 찢어지기 시작)
  {
    points: [
      { dx: 0, dy: 0 },
      { dx: -18, dy: 5 },
      { dx: -40, dy: 2 },
      { dx: -65, dy: 9 },
      { dx: -92, dy: 13 },
      { dx: -120, dy: 18 },
      { dx: -145, dy: 22 },
    ],
    startProg: 0.0,
    endProg: 0.65,
    baseWidth: 5.8,
  },
  // 2. 메인 우측 전방 단층선 (가장 먼저 찢어지기 시작)
  {
    points: [
      { dx: 0, dy: 0 },
      { dx: 20, dy: 4 },
      { dx: 45, dy: 10 },
      { dx: 72, dy: 7 },
      { dx: 102, dy: 14 },
      { dx: 130, dy: 19 },
      { dx: 155, dy: 24 },
    ],
    startProg: 0.0,
    endProg: 0.65,
    baseWidth: 5.8,
  },
  // 3. 중앙 전방 관통 단층선 (중심에서 전방으로 파고듦)
  {
    points: [
      { dx: 0, dy: 0 },
      { dx: -5, dy: 12 },
      { dx: 6, dy: 24 },
      { dx: -4, dy: 34 },
      { dx: 5, dy: 44 },
    ],
    startProg: 0.08,
    endProg: 0.60,
    baseWidth: 4.8,
  },
  // 4. 좌측 중심부 전방 분기 잔균열 (단층 1에서 분기)
  {
    points: [
      { dx: -18, dy: 5 },
      { dx: -26, dy: 16 },
      { dx: -42, dy: 22 },
      { dx: -56, dy: 25 },
    ],
    startProg: 0.18,
    endProg: 0.70,
    baseWidth: 3.8,
  },
  // 5. 우측 중심부 전방 분기 잔균열 (단층 2에서 분기)
  {
    points: [
      { dx: 20, dy: 4 },
      { dx: 30, dy: 15 },
      { dx: 48, dy: 20 },
      { dx: 62, dy: 23 },
    ],
    startProg: 0.18,
    endProg: 0.70,
    baseWidth: 3.8,
  },
  // 6. 좌측 후방 주 분기선 (단층 1에서 후방으로 찢어짐)
  {
    points: [
      { dx: -40, dy: 2 },
      { dx: -54, dy: -6 },
      { dx: -74, dy: -10 },
      { dx: -96, dy: -6 },
      { dx: -115, dy: -2 },
    ],
    startProg: 0.28,
    endProg: 0.80,
    baseWidth: 4.2,
  },
  // 7. 우측 후방 주 분기선 (단층 2에서 후방으로 찢어짐)
  {
    points: [
      { dx: 45, dy: 10 },
      { dx: 62, dy: -4 },
      { dx: 86, dy: -9 },
      { dx: 110, dy: -6 },
      { dx: 130, dy: -2 },
    ],
    startProg: 0.28,
    endProg: 0.80,
    baseWidth: 4.2,
  },
  // 8. 좌측 외곽 첨단 지선 (단층 1 끝단에서 외곽으로 뻗어나감)
  {
    points: [
      { dx: -92, dy: 13 },
      { dx: -106, dy: 24 },
      { dx: -124, dy: 29 },
      { dx: -138, dy: 32 },
    ],
    startProg: 0.48,
    endProg: 0.95,
    baseWidth: 3.4,
  },
  // 9. 우측 외곽 첨단 지선 (단층 2 끝단에서 외곽으로 뻗어나감)
  {
    points: [
      { dx: 102, dy: 14 },
      { dx: 116, dy: 25 },
      { dx: 136, dy: 30 },
      { dx: 150, dy: 33 },
    ],
    startProg: 0.48,
    endProg: 0.95,
    baseWidth: 3.4,
  },
];

/**
 * 끝이 뾰족하고 자연스럽게 테이퍼링되는 단층 균열선 렌더러
 * - [유저 요청 반영] 끝단(Tip)의 두께가 0(바늘처럼 뾰족한 끝)으로 수렴하도록 다각형(Polygon)을 구성
 * - 외곽 단층 토양(#3E2723)과 내부 심연 단층(#1A0F0B) 2중 레이어로 입체감 부여
 */
function drawTaperedCrack(
  ctx: any,
  originX: number,
  originY: number,
  points: { dx: number; dy: number }[],
  prog: number,
  baseWidth: number,
  alpha: number = 1.0
): { tipX: number; tipY: number } | null {
  if (prog <= 0.02 || points.length < 2 || alpha <= 0.01) return null;

  // 1. 각 세그먼트 길이 및 총 경로 길이 계산
  const segLens: number[] = [];
  let totalLen = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const d = Math.hypot(points[i + 1].dx - points[i].dx, points[i + 1].dy - points[i].dy);
    segLens.push(d);
    totalLen += d;
  }
  if (totalLen <= 0.5) return null;

  const targetLen = totalLen * Math.min(1.0, prog);

  // 2. 현재 진행률에 따른 활성 정점 리스트 구축 (끝점이 정확한 테이퍼링 끝점)
  let accumulated = 0;
  const activePts: { x: number; y: number; dist: number }[] = [
    { x: originX + points[0].dx, y: originY + points[0].dy, dist: 0 },
  ];

  for (let i = 0; i < segLens.length; i++) {
    const segLen = segLens[i];
    if (accumulated + segLen >= targetLen) {
      const rem = targetLen - accumulated;
      const u = segLen > 0 ? rem / segLen : 0;
      const p1 = points[i];
      const p2 = points[i + 1];
      const tipX = originX + p1.dx + (p2.dx - p1.dx) * u;
      const tipY = originY + p1.dy + (p2.dy - p1.dy) * u;
      activePts.push({ x: tipX, y: tipY, dist: targetLen });
      break;
    } else {
      accumulated += segLen;
      activePts.push({
        x: originX + points[i + 1].dx,
        y: originY + points[i + 1].dy,
        dist: accumulated,
      });
    }
  }

  if (activePts.length < 2) return null;

  const numPts = activePts.length;
  const tipPt = activePts[numPts - 1];

  // 3. 외곽 단층 레이어 & 내부 심연 레이어 렌더링
  const drawLayer = (wFactor: number, fillColor: string, layerAlpha: number) => {
    ctx.save();
    ctx.fillStyle = fillColor;
    ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * layerAlpha;

    const leftPts: { x: number; y: number }[] = [];
    const rightPts: { x: number; y: number }[] = [];

    // 갈라짐 진행에 따른 단층 기저부 자연스러운 확장 (초기 0.65x -> 완결 1.0x)
    const progExpansion = 0.65 + 0.35 * Math.min(1.0, prog * 1.3);

    for (let i = 0; i < numPts; i++) {
      const cur = activePts[i];
      let nx = 0;
      let ny = 0;

      if (i === 0) {
        const next = activePts[1];
        const dx = next.x - cur.x;
        const dy = next.y - cur.y;
        const len = Math.hypot(dx, dy) || 1;
        nx = -dy / len;
        ny = dx / len;
      } else if (i === numPts - 1) {
        const prev = activePts[numPts - 2];
        const dx = cur.x - prev.x;
        const dy = cur.y - prev.y;
        const len = Math.hypot(dx, dy) || 1;
        nx = -dy / len;
        ny = dx / len;
      } else {
        const prev = activePts[i - 1];
        const next = activePts[i + 1];
        const dx = next.x - prev.x;
        const dy = next.y - prev.y;
        const len = Math.hypot(dx, dy) || 1;
        nx = -dy / len;
        ny = dx / len;
      }

      // 끝쪽으로 갈수록 두께가 감소하여 tip에서는 0이 되는 테이퍼링
      const ratio = targetLen > 0 ? cur.dist / targetLen : 0;
      // 0.72 거듭제곱 곡선: 몸체는 두껍게 유지되다가 끝부분에서 날카로운 바늘끝(pointed tip) 형성
      const taper = Math.pow(Math.max(0, 1.0 - ratio), 0.72);
      const halfW = (baseWidth * progExpansion * wFactor * 0.5) * taper;

      leftPts.push({ x: cur.x + nx * halfW, y: cur.y + ny * halfW });
      rightPts.push({ x: cur.x - nx * halfW, y: cur.y - ny * halfW });
    }

    // 끝이 뾰족한 다각형(Polygon) 생성
    ctx.beginPath();
    ctx.moveTo(leftPts[0].x, leftPts[0].y);
    for (let i = 1; i < numPts - 1; i++) {
      ctx.lineTo(leftPts[i].x, leftPts[i].y);
    }
    // [유저 요청 핵심] 끝점(Tip)에서 좌우 변이 하나로 만나 날카로운 뾰족한 끝 형성!
    ctx.lineTo(tipPt.x, tipPt.y);

    for (let i = numPts - 2; i >= 0; i--) {
      ctx.lineTo(rightPts[i].x, rightPts[i].y);
    }
    ctx.closePath();
    ctx.fill();

    // 상단 림 하이라이트 (외곽선 레이어일 때 뾰족한 끝단까지 미세 3D 광택 부여)
    if (wFactor === 1.0 && alpha > 0.20 && numPts >= 2) {
      ctx.strokeStyle = `rgba(188, 170, 164, ${layerAlpha * 0.45})`;
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(leftPts[0].x, leftPts[0].y - 0.4);
      for (let i = 1; i < numPts - 1; i++) {
        ctx.lineTo(leftPts[i].x, leftPts[i].y - 0.4);
      }
      ctx.lineTo(tipPt.x, tipPt.y);
      ctx.stroke();
    }

    ctx.restore();
  };

  // 1) 외곽 단층 암갈색 레이어 (#3E2723)
  drawLayer(1.0, "#3E2723", alpha * 0.95);
  // 2) 내부 심연 심층 검은색 레이어 (#1A0F0B)
  drawLayer(0.46, "#1A0F0B", alpha * 0.98);

  return { tipX: tipPt.x, tipY: tipPt.y };
}

/**
 * 다각형 바위 그리기 헬퍼 (3D 각진 단면 음영 적용 - 지진 전용 갈색/대지 톤)
 */
function drawEarthquakeFacetedRock(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  rotation: number = 0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || size <= 0.5) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  const s = size;
  const vertices = [
    { x: -s * 0.85, y: -s * 0.35 },
    { x: -s * 0.40, y: -s * 0.95 },
    { x:  s * 0.45, y: -s * 0.90 },
    { x:  s * 0.95, y: -s * 0.25 },
    { x:  s * 0.75, y:  s * 0.80 },
    { x: -s * 0.15, y:  s * 0.95 },
    { x: -s * 0.80, y:  s * 0.60 },
  ];

  // 베이스 암석 바디 (#5D4037 - 짙은 대지 브라운)
  ctx.fillStyle = "#5D4037";
  ctx.beginPath();
  ctx.moveTo(vertices[0].x, vertices[0].y);
  for (let i = 1; i < vertices.length; i++) ctx.lineTo(vertices[i].x, vertices[i].y);
  ctx.closePath();
  ctx.fill();

  // 상단 빛 받는 밝은 패싯 (#A1887F / #BCAAA4)
  ctx.fillStyle = "#A1887F";
  ctx.beginPath();
  ctx.moveTo(vertices[1].x, vertices[1].y);
  ctx.lineTo(vertices[2].x, vertices[2].y);
  ctx.lineTo(0, -s * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#BCAAA4";
  ctx.beginPath();
  ctx.moveTo(vertices[0].x, vertices[0].y);
  ctx.lineTo(vertices[1].x, vertices[1].y);
  ctx.lineTo(0, -s * 0.2);
  ctx.closePath();
  ctx.fill();

  // 하단 그림자 패싯 (#3E2723 / #27170E)
  ctx.fillStyle = "#3E2723";
  ctx.beginPath();
  ctx.moveTo(vertices[3].x, vertices[3].y);
  ctx.lineTo(vertices[4].x, vertices[4].y);
  ctx.lineTo(0, -s * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#27170E";
  ctx.beginPath();
  ctx.moveTo(vertices[4].x, vertices[4].y);
  ctx.lineTo(vertices[5].x, vertices[5].y);
  ctx.lineTo(vertices[6].x, vertices[6].y);
  ctx.lineTo(0, -s * 0.2);
  ctx.closePath();
  ctx.fill();

  // 외곽 슬림 라인 (#1A0F0B)
  ctx.strokeStyle = "#1A0F0B";
  ctx.lineWidth = Math.max(0.65, s * 0.05);
  ctx.beginPath();
  ctx.moveTo(vertices[0].x, vertices[0].y);
  for (let i = 1; i < vertices.length; i++) ctx.lineTo(vertices[i].x, vertices[i].y);
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
}

/**
 * 지진 시 바닥에서 솟구쳐 튀어오르는 9개의 각진 바위 정의
 * - [유저 요청 핵심] 균열 전개와 완벽 동기화: 중심부 균열 발생 시 중심 바위 즉각 폭발 -> 외곽 균열 도달 시 외곽 바위 순차 솟구침
 */
const BOUNCING_ROCKS = [
  // 1. 좌측 전방 대형 바위 (좌측 주 단층선 전개에 맞춰 0.32에 솟구침)
  { baseX: -68, baseYOffset: 6,  size: 11.0, driftX: -18, jumpHeight: 62, rotSpeed: 4.8,  launchT: 0.32, airDuration: 0.54, reboundHeight: 24, reboundDriftX: -8 },
  // 2. 좌측 중앙 중형 바위 (좌측 후방 분기선에 맞춰 0.36에 솟구침)
  { baseX: -42, baseYOffset: -6, size: 8.0,  driftX: -10, jumpHeight: 74, rotSpeed: -5.6, launchT: 0.36, airDuration: 0.50, reboundHeight: 28, reboundDriftX: -5 },
  // 3. 중앙 전방 거대 주 암반 (진원지 중심 균열 개방과 함께 0.16에 가장 먼저 폭발!)
  { baseX: -15, baseYOffset: 14, size: 13.5, driftX: 12,  jumpHeight: 82, rotSpeed: 4.2,  launchT: 0.16, airDuration: 0.58, reboundHeight: 32, reboundDriftX: 8 },
  // 4. 중앙 후방 날카로운 돌 (진원지 후방 균열 통과에 맞춰 0.24에 솟구침)
  { baseX: 12,  baseYOffset: -8, size: 7.0,  driftX: 16,  jumpHeight: 56, rotSpeed: 6.5,  launchT: 0.24, airDuration: 0.52, reboundHeight: 20, reboundDriftX: 7 },
  // 5. 우측 중앙 대형 바위 (우측 주 단층선 전개에 맞춰 0.30에 솟구침)
  { baseX: 38,  baseYOffset: 8,  size: 12.0, driftX: 20,  jumpHeight: 76, rotSpeed: -4.5, launchT: 0.30, airDuration: 0.56, reboundHeight: 28, reboundDriftX: 10 },
  // 6. 우측 전방 중형 바위 (우측 후방 분기선 전개에 맞춰 0.38에 솟구침)
  { baseX: 64,  baseYOffset: -2, size: 8.5,  driftX: 14,  jumpHeight: 66, rotSpeed: 5.8,  launchT: 0.38, airDuration: 0.50, reboundHeight: 25, reboundDriftX: 6 },
  // 7. 좌측 외곽 튀는 돌 (좌측 첨단 외곽 지선 도달에 맞춰 0.48에 솟구침)
  { baseX: -92, baseYOffset: 12, size: 7.5,  driftX: -14, jumpHeight: 52, rotSpeed: -3.8, launchT: 0.48, airDuration: 0.46, reboundHeight: 18, reboundDriftX: -6 },
  // 8. 우측 외곽 튀는 돌 (우측 첨단 외곽 지선 도달에 맞춰 0.46에 솟구침)
  { baseX: 88,  baseYOffset: 16, size: 9.0,  driftX: 16,  jumpHeight: 58, rotSpeed: 5.0,  launchT: 0.46, airDuration: 0.48, reboundHeight: 22, reboundDriftX: 9 },
  // 9. 정면 중심 튀는 주춧돌 바위 (중앙 관통 단층선 전개에 맞춰 0.20에 솟구침)
  { baseX: -2,  baseYOffset: 24, size: 10.5, driftX: -8,  jumpHeight: 68, rotSpeed: -5.2, launchT: 0.20, airDuration: 0.56, reboundHeight: 26, reboundDriftX: -4 },
];

/**
 * 089: 지진 (Earthquake) 이펙트 렌더러
 * - Step 1: 시전자 발구르기 지면 충격파 (시전자 발밑)
 * - Step 2: 전조 지면 격렬한 진동 (지면 파문 링 & 작은 자갈 진동, 아직 균열 없음!)
 * - Step 3: [유저 요청 핵심] 대지 갈라짐과 함께 순차적으로 솟구쳐 오르는 바위 분출 (단층 파열 + 바위 동시 폭발)
 * - Step 4: [2차 여진 & 리바운드] 격렬한 여진 진동 및 떨어진 바위들의 2차 리바운드 튀어오름
 * - Step 5: [대지 안정화 & 안착] 암반 및 균열 침강, 바위 안착 및 미세 연무 정돈
 */
export function drawEarthquakeEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0.5
) {
  ctx.save();

  const groundY = targetPos.y + 36;
  const centerX = targetPos.x;

  // Step 1: 시전자 발구르기 지면 충격파 (시전자 발밑)
  if (moveStep === 1) {
    const p = effectProgress;
    const footX = attackerPos.x;
    const footY = attackerPos.y + 32;

    // 시전자 발밑 지면 충격 링
    const ringRadius = 12 + p * 32;
    const alpha = Math.max(0, 1.0 - p * 0.9);

    ctx.save();
    ctx.strokeStyle = `rgba(141, 110, 99, ${alpha * 0.85})`;
    ctx.lineWidth = 2.4 * (1.0 - p * 0.5);
    ctx.beginPath();
    ctx.ellipse(footX, footY, ringRadius, ringRadius * 0.42, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 2중 외곽 링
    ctx.strokeStyle = `rgba(215, 204, 200, ${alpha * 0.60})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(footX, footY, ringRadius * 1.35, ringRadius * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 발밑에서 튀는 흙먼지 (과도하지 않고 아담한 크기)
    drawDustPuff(ctx, footX - 14 * p, footY + 2, 6 + p * 4, alpha * 0.45, "#D7CCC8");
    drawDustPuff(ctx, footX + 14 * p, footY + 2, 7 + p * 4, alpha * 0.45, "#BCAAA4");
  }

  // Step 2: [유저 요청 반영] 지면 격렬한 진동 (아직 균열 없이 지면이 강하게 떨림!)
  else if (moveStep === 2) {
    const p = Math.min(1.0, effectProgress);

    // 1) 지면 전체를 타고 퍼져나가는 3중 진동 동심 파문 링
    for (let i = 0; i < 3; i++) {
      const waveT = (p + i / 3) % 1.0;
      const rx = 24 + waveT * 105;
      const ry = (10 + waveT * 42) * 0.42;
      const wAlpha = Math.sin(waveT * Math.PI) * 0.55;
      ctx.save();
      ctx.strokeStyle = `rgba(188, 170, 164, ${wAlpha})`;
      ctx.lineWidth = 1.6 * (1.0 - waveT * 0.4);
      ctx.beginPath();
      ctx.ellipse(centerX, groundY + 4, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2) 바닥에서 격렬하게 진동하는 미세 암석 자갈들 (아직 솟구치지 않고 바닥에서 바르르 떨림)
    const vibratingPebbles = [
      { x: -55, y: 6, size: 3.5 },
      { x: -25, y: -2, size: 2.8 },
      { x: 5, y: 10, size: 3.2 },
      { x: 35, y: 0, size: 3.0 },
      { x: 65, y: 8, size: 2.6 },
    ];
    for (let i = 0; i < vibratingPebbles.length; i++) {
      const peb = vibratingPebbles[i];
      const jx = Math.sin(p * 36 + i * 5) * 2.5;
      const jy = Math.cos(p * 40 + i * 3) * 0.8;
      drawRockPebble(ctx, centerX + peb.x + jx, groundY + peb.y + jy, peb.size, i * 1.5, 0.85);
    }

    // 3) 바닥 저면 미세 진동 먼지 (지면 가림 없이 아주 낮고 투명하게)
    drawDustPuff(ctx, centerX - 42, groundY + 8, 5 + p * 3, 0.30, "#D7CCC8");
    drawDustPuff(ctx, centerX + 42, groundY + 8, 6 + p * 3, 0.30, "#BCAAA4");
  }

  // Step 3: [유저 요청 핵심] 대지 갈라짐과 함께 순차적으로 솟구쳐 오르는 바위 분출!
  // - 균열이 차례대로 찢어지며 전장을 횡단하는 순간, 균열 통과 위치의 바위들이 타이밍 맞춰 솟구쳐오름
  else if (moveStep === 3) {
    const p = Math.min(1.0, effectProgress);
    const alpha = Math.min(1.0, p * 2.2);

    // 1) 9개의 단층선이 시차를 두고 차례대로 찢어지며 뻗어나감 (끝쪽이 바늘처럼 뾰족함)
    for (const crack of EARTHQUAKE_CRACKS) {
      if (p < crack.startProg) continue;
      const crackProg = Math.min(1.0, (p - crack.startProg) / (crack.endProg - crack.startProg));
      const tip = drawTaperedCrack(
        ctx,
        centerX,
        groundY,
        crack.points,
        crackProg,
        crack.baseWidth,
        alpha
      );

      // 균열 첨단이 뻗어나갈 때 끝부분에서만 작게 피어나는 미세 흙먼지 (지면 가림 없이 아주 작음)
      if (tip && crackProg > 0.05 && crackProg < 0.98) {
        drawDustPuff(ctx, tip.tipX, tip.tipY + 1, 4.5 + crackProg * 2, alpha * 0.30, "#D7CCC8");
      }
    }

    // 2) 중심 진원지 균열 코어 타원 (자연스럽게 갈라진 틈 중심을 묶어줌)
    ctx.save();
    ctx.fillStyle = `rgba(26, 15, 11, ${alpha * 0.95})`;
    ctx.beginPath();
    ctx.ellipse(centerX, groundY + 2, 6 * p, 2.5 * p, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3) 대지 융기 암반 슬랩 (단층선이 뻗어나가며 서서히 들썩이고 솟구침)
    if (p > 0.35) {
      const slabP = Math.min(1.0, (p - 0.35) / 0.65);
      const risePeak = Math.sin(slabP * Math.PI * 0.5); // 0 -> 1 로 점진적 솟구침
      const slabs = [
        { x: centerX - 42, y: groundY + 4,  w: 32, h: 26, tilt: -0.18, maxRise: 26 },
        { x: centerX + 38, y: groundY + 8,  w: 36, h: 30, tilt: 0.16,  maxRise: 30 },
        { x: centerX - 18, y: groundY - 10, w: 26, h: 22, tilt: -0.08, maxRise: 22 },
        { x: centerX + 16, y: groundY + 16, w: 28, h: 24, tilt: 0.12,  maxRise: 24 },
      ];
      for (const s of slabs) {
        drawTectonicSlab(ctx, s.x, s.y, s.w, s.h, s.tilt, s.maxRise * risePeak, alpha);
      }
    }

    // 4) [유저 요청 핵심] 대지 갈라짐과 함께 솟구쳐 튀어오르는 바위들 (Bouncing Rocks in sync with cracking)
    for (let i = 0; i < BOUNCING_ROCKS.length; i++) {
      const rock = BOUNCING_ROCKS[i];
      if (p < rock.launchT) {
        // 아직 갈라진 틈이 도달하기 전: 진동 중 (p >= 0.08부터 미세 흔들림 표출)
        if (p >= 0.08) {
          const jitter = Math.sin(p * 35 + i * 4) * 1.8;
          const rockAlpha = Math.min(1.0, (p - 0.08) / 0.12) * 0.85;
          drawEarthquakeFacetedRock(
            ctx,
            centerX + rock.baseX + jitter,
            groundY + rock.baseYOffset,
            rock.size,
            i * 1.2,
            rockAlpha
          );
        }
      } else {
        const arcT = (p - rock.launchT) / rock.airDuration;
        if (arcT <= 1.0) {
          // 균열 통과와 동시에 공중으로 솟구쳐 오름! (포물선 궤적)
          const curHeight = Math.sin(arcT * Math.PI) * rock.jumpHeight;
          const curX = centerX + rock.baseX + rock.driftX * arcT;
          const curY = groundY + rock.baseYOffset - curHeight;
          const curRot = rock.rotSpeed * arcT;

          // 바닥 그림자 (높이에 반비례하여 옅어지고 지면에 정확히 투영)
          const shadowAlpha = Math.max(0.12, 0.55 * (1.0 - curHeight / rock.jumpHeight));
          ctx.save();
          ctx.fillStyle = `rgba(30, 20, 15, ${shadowAlpha})`;
          ctx.beginPath();
          ctx.ellipse(curX, groundY + rock.baseYOffset, rock.size * 0.85, rock.size * 0.32, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // 솟구쳐 오른 바위 렌더링
          drawEarthquakeFacetedRock(ctx, curX, curY, rock.size, curRot, 1.0);

          // 지면 착지 순간(arcT >= 0.88) 국소 미세 충돌 먼지 퍼프 (작고 깔끔하게)
          if (arcT >= 0.88) {
            drawDustPuff(ctx, curX, groundY + rock.baseYOffset + 2, rock.size * 0.85, 0.40, "#D7CCC8");
          }
        } else {
          // 1차 착지 완료 후 갈라진 바닥에 안착
          const landX = centerX + rock.baseX + rock.driftX;
          const landY = groundY + rock.baseYOffset;
          drawEarthquakeFacetedRock(ctx, landX, landY, rock.size, rock.rotSpeed, 1.0);
        }
      }
    }

    // 5) 지면 충격 대형 파문 링 (p >= 0.55 메인 피크 시점)
    if (p >= 0.55) {
      const ringP = (p - 0.55) / 0.45;
      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.50 * (1.0 - ringP)})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(centerX, groundY + 4, 110 * ringP, 40 * ringP, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 6) 바닥 저면 미세 연무 (시야 방해 없는 얇은 저면 연무)
    if (p > 0.30) {
      drawDustPuff(ctx, centerX - 58, groundY + 10, 9 + p * 3, 0.28, "#BCAAA4");
      drawDustPuff(ctx, centerX + 56, groundY + 10, 10 + p * 3, 0.28, "#D7CCC8");
    }
  }

  // Step 4: [2차 여진 & 리바운드] 격렬한 여진 진동 및 바위들의 2차 튀어오름
  else if (moveStep === 4) {
    const p = effectProgress;

    // 1) 기본 단층 균열선 선명하게 유지 (끝쪽이 뾰족한 테이퍼링 유지)
    for (const crack of EARTHQUAKE_CRACKS) {
      drawTaperedCrack(ctx, centerX, groundY, crack.points, 1.0, crack.baseWidth, 1.0);
    }

    // 2) 여진으로 서서히 가라앉기 시작하는 단층 슬랩
    const settleRatio = Math.max(0.45, 1.0 - p * 0.55);
    const slabs = [
      { x: centerX - 42, y: groundY + 4,  w: 32, h: 26, tilt: -0.18, maxRise: 26 },
      { x: centerX + 38, y: groundY + 8,  w: 36, h: 30, tilt: 0.16,  maxRise: 30 },
      { x: centerX - 18, y: groundY - 10, w: 26, h: 22, tilt: -0.08, maxRise: 22 },
      { x: centerX + 16, y: groundY + 16, w: 28, h: 24, tilt: 0.12,  maxRise: 24 },
    ];
    for (const s of slabs) {
      drawTectonicSlab(ctx, s.x, s.y, s.w, s.h, s.tilt, s.maxRise * settleRatio, 1.0);
    }

    // 3) 바위들의 2차 리바운드 튀어오름 (Rebound Hop)
    const rebT = Math.min(1.0, p * 1.35);
    for (let i = 0; i < BOUNCING_ROCKS.length; i++) {
      const rock = BOUNCING_ROCKS[i];
      const startX = centerX + rock.baseX + rock.driftX;
      const startY = groundY + rock.baseYOffset;

      if (rebT < 1.0) {
        // 2차 리바운드 체공 중
        const curHeight = Math.sin(rebT * Math.PI) * rock.reboundHeight;
        const curX = startX + rock.reboundDriftX * rebT;
        const curY = startY - curHeight;
        const curRot = rock.rotSpeed + rebT * (rock.rotSpeed * 0.4);

        // 바닥 그림자
        const shadowAlpha = Math.max(0.10, 0.50 * (1.0 - curHeight / rock.reboundHeight));
        ctx.save();
        ctx.fillStyle = `rgba(30, 20, 15, ${shadowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(curX, startY, rock.size * 0.85, rock.size * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        drawEarthquakeFacetedRock(ctx, curX, curY, rock.size, curRot, 1.0);

        // 2차 착지 순간 미세 먼지 (작고 은은하게)
        if (rebT >= 0.85) {
          drawDustPuff(ctx, curX, startY + 2, rock.size * 0.75, 0.35, "#D7CCC8");
        }
      } else {
        // 최종 착지 안착
        const finalX = startX + rock.reboundDriftX;
        drawEarthquakeFacetedRock(ctx, finalX, startY, rock.size, rock.rotSpeed * 1.4, 1.0);
      }
    }

    // 4) 바닥 저면 잔여 미세 연무 (시야 방해 전혀 없는 얇은 저면 안개)
    drawDustPuff(ctx, centerX - 50, groundY + 10, 8, (0.30 - p * 0.15), "#D7CCC8");
    drawDustPuff(ctx, centerX + 50, groundY + 10, 9, (0.30 - p * 0.15), "#BCAAA4");
  }

  // Step 5: [대지 안정화 & 안착] 암반 침강, 튀어오른 바위들 안착 및 흙먼지 페이드아웃
  else if (moveStep === 5) {
    const p = effectProgress;
    const alpha = Math.max(0, 1.0 - p);

    if (alpha > 0.02) {
      // 1) 가라앉는 단층 균열선 (뾰족한 끝단 유지하며 점진적 페이드)
      for (const crack of EARTHQUAKE_CRACKS) {
        drawTaperedCrack(ctx, centerX, groundY, crack.points, 1.0, crack.baseWidth, alpha * 0.85);
      }

      // 2) 가라앉은 암반 흔적
      const settleAmount = Math.max(0, 14 * (1.0 - p));
      drawTectonicSlab(ctx, centerX - 42, groundY + 4, 32, 26, -0.18, settleAmount, alpha);
      drawTectonicSlab(ctx, centerX + 38, groundY + 8, 36, 30, 0.16,  settleAmount * 1.1, alpha);

      // 3) 바닥에 안착한 바위 잔해들
      for (let i = 0; i < BOUNCING_ROCKS.length; i++) {
        const rock = BOUNCING_ROCKS[i];
        const finalX = centerX + rock.baseX + rock.driftX + rock.reboundDriftX;
        const finalY = groundY + rock.baseYOffset;
        drawEarthquakeFacetedRock(ctx, finalX, finalY, rock.size, rock.rotSpeed * 1.4, alpha * 0.95);
      }

      // 4) 흩어지는 바닥 잔여 미세 연무 (지면 가림 없이 조용히 소멸)
      drawDustPuff(ctx, centerX - 45, groundY + 10, 8, alpha * 0.25, "#D7CCC8");
      drawDustPuff(ctx, centerX + 45, groundY + 10, 8, alpha * 0.25, "#BCAAA4");
    }
  }

  ctx.restore();
}

// ============================================================================
// 090: 땅가르기 (Fissure) - 일격필살 (OHKO)
// ============================================================================

/**
 * 090: 땅가르기 (Fissure) - 3D 원근 대협곡 (Perspective Chasm)
 * - 시전자 지면 강타 지점(t=0): 0.5px 바늘처럼 극도로 얇고 뾰족하게 시작
 * - 앞으로 갈수록(t -> 1.0): 64px 이상의 거대한 대협곡으로 파격 확장 (유저 요청 완벽 반영)
 * - 지면 위쪽 흰색 선 일체 제거 (유저 요청 반영: 자연스러운 대지 파쇄면)
 * - 땅 안쪽은 칠흑의 암흑 검정(#000000) 심연 및 3D 수직 단애 음영 (유저 요청 반영)
 */
/**
 * 090: 땅가르기 (Fissure) 대협곡 균열 렌더러
 * - 시전자 지면 강타 원점(0px 바늘) ➔ 대상 발밑(26px 심연 틈새) ➔ 원경 지평선(자연스러운 바늘 수렴 및 지면 방사형 파쇄선)
 * - 각도 왜곡 0%: 시전자 ➔ 대상을 잇는 진정한 3D 벡터를 따라 정확히 관통
 * - 결말(Ending): 인위적인 직사각형/사다리꼴 컷을 원천 제거하고, 대지가 쪼개지며 뾰족하게 수렴한 뒤 지면 균열 가지(Fracture Veins)로 승화
 * - 내부는 칠흑의 블랙(#000000) 및 3D 수직 단애 음영
 */
function drawFissureChasm(
  ctx: any,
  x1: number,
  y1: number, // 시전자 지면 강타 원점
  x2: number,
  y2: number, // 원경 말단점 (정확히 동일한 레이)
  targetRatio: number, // 대상 포켓몬이 위치한 비율 (~0.74)
  prog: number, // 0.0 ~ 1.0 (균열 전개도)
  openScale: number, // 틈새 벌어짐 배율
  alpha: number = 1.0
) {
  if (prog <= 0.01 || openScale <= 0.01 || alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const totalLen = Math.hypot(dx, dy) || 1;
  const ux = dx / totalLen;
  const uy = dy / totalLen;
  const nx = -uy;
  const ny = ux;

  // 24단계 세그먼트로 지각 파쇄선을 정밀 구현
  const NUM_SEGS = 24;
  const activeSegs = Math.max(2, Math.min(NUM_SEGS, Math.ceil(NUM_SEGS * prog)));

  // 대지 파쇄 지그재그 오프셋 (지진에 의해 대지가 꺾여 갈라지는 생생한 암석 결)
  const CENTER_ZIG = [
    0.0,  1.2, -1.8,  2.2, -1.5,  2.0, -2.2,  1.8,
   -1.4,  2.4, -2.0,  1.6, -1.8,  2.0, -1.4,  1.8,
   -1.6,  1.4, -1.2,  1.0, -0.7,  0.5, -0.3,  0.1, 0.0
  ];

  // 좌/우 암석 테두리 톱니 오프셋 (양쪽이 찢어져 맞물리는 파쇄 엣지)
  const JAGGED_L = [
    0.0,  1.0, -1.5,  2.0, -1.8,  2.4, -2.0,  2.5,
   -2.2,  2.6, -2.4,  2.2, -1.8,  2.0, -1.6,  1.4,
   -1.2,  1.0, -0.8,  0.6, -0.5,  0.3, -0.2,  0.0, 0.0
  ];
  const JAGGED_R = [
    0.0, -1.0,  1.5, -2.0,  1.8, -2.4,  2.0, -2.5,
    2.2, -2.6,  2.4, -2.2,  1.8, -2.0,  1.6, -1.4,
    1.2, -1.0,  0.8, -0.6,  0.5, -0.3,  0.2,  0.0, 0.0
  ];

  const leftPts: { x: number; y: number }[] = [];
  const rightPts: { x: number; y: number }[] = [];
  const northPts: { x: number; y: number }[] = [];
  const southPts: { x: number; y: number }[] = [];
  const wallBasePts: { x: number; y: number }[] = [];
  const centerPts: { x: number; y: number }[] = [];

  for (let i = 0; i <= activeSegs; i++) {
    const t = (i / NUM_SEGS) * Math.min(1.0, prog / (activeSegs / NUM_SEGS));
    const cx = x1 + dx * t + nx * (CENTER_ZIG[i] * openScale * 0.7);
    const cy = y1 + dy * t + ny * (CENTER_ZIG[i] * openScale * 0.7);
    centerPts.push({ x: cx, y: cy });

    // [폭 프로필: 인위적인 거대 사다리꼴 완전 배제]
    // 1) 시전자(t=0): 0.5px 바늘 끝
    // 2) 대상 발밑(t = targetRatio): 26px 실감나는 대협곡 틈새 (상대가 딱 빠져들 수 있는 이상적인 스케일)
    // 3) 원경(t -> 1.0): 다시 0.5px 날카로운 바늘 끝으로 완벽 수렴!
    let baseW = 0.5;
    if (t <= targetRatio) {
      const u = t / targetRatio;
      baseW = (0.5 + 25.5 * Math.pow(u, 1.25)) * openScale;
    } else {
      const v = (t - targetRatio) / (1.0 - targetRatio);
      baseW = (26.0 * Math.max(0, 1.0 - Math.pow(v, 1.35)) + 0.5) * openScale;
    }

    // 균열이 전진 중일 때는 선두 쐐기 끝단도 뾰족하게 수렴
    if (prog < 0.98) {
      const segRatio = i / activeSegs;
      const tipDist = 1.0 - segRatio;
      if (tipDist < 0.25) {
        baseW *= Math.max(0.04, Math.pow(tipDist / 0.25, 0.75));
      }
    }

    const halfW = baseW * 0.5;
    const jagL = (i === 0 || i === NUM_SEGS ? 0 : JAGGED_L[i]) * openScale * 0.65;
    const jagR = (i === 0 || i === NUM_SEGS ? 0 : JAGGED_R[i]) * openScale * 0.65;

    const lp = {
      x: cx + nx * (halfW + jagL),
      y: cy + ny * (halfW + jagL),
    };
    const rp = {
      x: cx - nx * (halfW + jagR),
      y: cy - ny * (halfW + jagR),
    };

    leftPts.push(lp);
    rightPts.push(rp);

    // 3D 원근 투영 판별: Y가 작은 쪽이 뒤쪽(North Rim: 카메라를 향해 떨어지는 절벽면)
    let np: { x: number; y: number };
    let sp: { x: number; y: number };
    if (lp.y <= rp.y) {
      np = lp;
      sp = rp;
    } else {
      np = rp;
      sp = lp;
    }
    northPts.push(np);
    southPts.push(sp);

    // 북측 절벽면 수직 낙차 (dropY): 협곡 폭에 비례하여 자연스러운 3D 입체감 연출
    let dropY = Math.min(Math.max(2, sp.y - np.y) * 0.75 + 1.2, (1.5 + 7.0 * Math.sin(Math.min(1.0, t / targetRatio) * Math.PI))) * openScale;

    const wallBase = {
      x: np.x,
      y: np.y + dropY,
    };
    wallBasePts.push(wallBase);
  }

  // -------------------------------------------------------------------------
  // Pass 1: 대지 표면 방사형 파쇄 균열 가지 (Fracture Veins)
  // - 인공적인 판자가 아닌, 진짜 대지가 쩍 갈라진 암석 파쇄선
  // -------------------------------------------------------------------------
  ctx.save();
  ctx.strokeStyle = "rgba(22, 14, 9, 0.75)";
  ctx.lineWidth = 1.1;
  ctx.lineCap = "round";

  // 1) 중간 구간 측면 균열선 (시전자와 대상 사이)
  if (activeSegs >= 8) {
    const mIdx = Math.min(activeSegs, 7);
    const np = northPts[mIdx];
    const sp = southPts[mIdx];
    if (np && sp) {
      ctx.beginPath();
      ctx.moveTo(np.x, np.y);
      ctx.lineTo(np.x - ny * 12 + nx * 4, np.y + nx * 12 + ny * 4);
      ctx.lineTo(np.x - ny * 20 - nx * 2, np.y + nx * 20 - ny * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(sp.x, sp.y);
      ctx.lineTo(sp.x + ny * 10 + nx * 5, sp.y - nx * 10 + ny * 5);
      ctx.stroke();
    }
  }

  // 2) 대상 발밑 집중 파쇄 방사선 (대상이 서 있는 지반 붕괴)
  if (activeSegs >= 16) {
    const tIdx = Math.min(activeSegs, 17);
    const np = northPts[tIdx];
    const sp = southPts[tIdx];
    if (np && sp) {
      ctx.beginPath();
      ctx.moveTo(np.x, np.y);
      ctx.lineTo(np.x - ny * 16 - nx * 5, np.y + nx * 16 - ny * 5);
      ctx.lineTo(np.x - ny * 26 + nx * 2, np.y + nx * 26 + ny * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(sp.x, sp.y);
      ctx.lineTo(sp.x + ny * 15 + nx * 6, sp.y - nx * 15 + ny * 6);
      ctx.lineTo(sp.x + ny * 24 - nx * 3, sp.y - nx * 24 - ny * 3);
      ctx.stroke();
    }
  }

  // 3) [결말 완성] 원경 끝단 지평선 방사형 파쇄선 (바늘 끝에서 사방으로 뻗는 균열선)
  if (prog >= 0.85 && activeSegs >= 20 && centerPts.length > 0) {
    const lastTip = centerPts[centerPts.length - 1];
    if (lastTip) {
      // 정면 전진 분기
      ctx.beginPath();
      ctx.moveTo(lastTip.x, lastTip.y);
      ctx.lineTo(lastTip.x + ux * 18 - uy * 3, lastTip.y + uy * 18 + ux * 3);
      ctx.lineTo(lastTip.x + ux * 32 + uy * 4, lastTip.y + uy * 32 - ux * 4);
      ctx.stroke();

      // 북측 지평선 분기
      ctx.beginPath();
      ctx.moveTo(lastTip.x, lastTip.y);
      ctx.lineTo(lastTip.x - ny * 14 + nx * 8, lastTip.y + nx * 14 + ny * 8);
      ctx.stroke();

      // 남측 지평선 분기
      ctx.beginPath();
      ctx.moveTo(lastTip.x, lastTip.y);
      ctx.lineTo(lastTip.x + ny * 12 + nx * 6, lastTip.y - nx * 12 + ny * 6);
      ctx.stroke();
    }
  }
  ctx.restore();

  // -------------------------------------------------------------------------
  // Pass 2: 심연 무저갱 바디 (칠흑의 블랙 #000000)
  // - 시전자 원점(0px) ➔ 대상(26px) ➔ 원경 말단(0px)으로 양 끝이 날카롭게 수렴하는 유기적 균열
  // -------------------------------------------------------------------------
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.moveTo(leftPts[0].x, leftPts[0].y);
  for (let i = 1; i < leftPts.length; i++) ctx.lineTo(leftPts[i].x, leftPts[i].y);
  for (let i = rightPts.length - 1; i >= 0; i--) ctx.lineTo(rightPts[i].x, rightPts[i].y);
  ctx.closePath();
  ctx.fill();

  // -------------------------------------------------------------------------
  // Pass 3: 3D 입체 단애 절벽면 (북측 림에서 수직 낙하하는 깊이감)
  // -------------------------------------------------------------------------
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(northPts[0].x, northPts[0].y);
  for (let i = 1; i < northPts.length; i++) ctx.lineTo(northPts[i].x, northPts[i].y);
  for (let i = wallBasePts.length - 1; i >= 0; i--) ctx.lineTo(wallBasePts[i].x, wallBasePts[i].y);
  ctx.closePath();

  const topY = northPts[0].y;
  const botY = wallBasePts[wallBasePts.length - 1].y;
  const cliffGrad = ctx.createLinearGradient(0, Math.min(topY, botY), 0, Math.max(topY, botY));
  cliffGrad.addColorStop(0.00, "#180e0a");
  cliffGrad.addColorStop(0.35, "#0b0604");
  cliffGrad.addColorStop(0.70, "#030202");
  cliffGrad.addColorStop(1.00, "#000000");
  ctx.fillStyle = cliffGrad;
  ctx.fill();

  // 단애 수직 단층 결 (Vertical Fault Striations)
  ctx.strokeStyle = "rgba(0, 0, 0, 0.90)";
  ctx.lineWidth = 1.0;
  for (let i = 1; i < northPts.length; i += 2) {
    ctx.beginPath();
    ctx.moveTo(northPts[i].x, northPts[i].y);
    ctx.lineTo(wallBasePts[i].x, wallBasePts[i].y);
    ctx.stroke();
  }
  ctx.restore();

  // -------------------------------------------------------------------------
  // Pass 4: 안쪽 무너져 내린 침하 암반 단층 블록 (Sunken Tectonic Slabs)
  // -------------------------------------------------------------------------
  if (activeSegs >= 6) {
    const slabIndices = [6, 12, 17].filter(idx => idx <= activeSegs);
    for (const sIdx of slabIndices) {
      const wBase = wallBasePts[sIdx];
      const sPt = southPts[sIdx];
      if (!wBase || !sPt) continue;
      const slabW = (3.5 + (sIdx % 3) * 1.8) * openScale;
      const slabH = (2.2 + (sIdx % 2) * 1.2) * openScale;
      const slabX = wBase.x * 0.45 + sPt.x * 0.55;
      const slabY = wBase.y * 0.45 + sPt.y * 0.55;

      ctx.fillStyle = "#160e0a";
      ctx.beginPath();
      ctx.moveTo(slabX - slabW, slabY - slabH * 0.5);
      ctx.lineTo(slabX + slabW * 0.8, slabY - slabH * 0.6);
      ctx.lineTo(slabX + slabW, slabY + slabH * 0.3);
      ctx.lineTo(slabX - slabW * 0.7, slabY + slabH * 0.5);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#080402";
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }
  }

  // -------------------------------------------------------------------------
  // Pass 5: 대상 발밑 단애 림 암석 파편 (지각 파쇄감 강조)
  // -------------------------------------------------------------------------
  if (activeSegs >= 14) {
    const rockRimIndices = [13, 16, 18, 20].filter(idx => idx <= activeSegs);
    for (let k = 0; k < rockRimIndices.length; k++) {
      const idx = rockRimIndices[k];
      const pt = k % 2 === 0 ? northPts[idx] : southPts[idx];
      if (!pt) continue;
      const sz = (2.5 + (k % 3) * 1.0) * openScale;
      const offX = (k % 2 === 0 ? -nx : nx) * (sz * 0.8);
      const offY = (k % 2 === 0 ? -ny : ny) * (sz * 0.8);
      drawEarthquakeFacetedRock(ctx, pt.x + offX, pt.y + offY, sz, k * 1.8 + prog * 3.0, alpha);
    }
  }

  ctx.restore();
}

/**
 * 090: 땅가르기 (Fissure) - 비하인드 스프라이트 렌더러
 * - 하늘 암전 및 시네마틱 심연 배경 비네트
 * - 전경 시전자 ➔ 원경 대상 발밑까지 관통하는 3D 원근 대협곡 렌더링
 */
export function drawFissureBehindEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    casterPos?: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    width: number;
    height: number;
    em: { x: number; y: number; size: number };
    pm: { x: number; y: number; size: number };
    [key: string]: any;
  }
) {
  const moveStep = frame.moveStep ?? 1;
  const p = frame.effectProgress ?? 0.5;
  const isP = drawCtx.isPlayer;
  const horizonY = 142; // 지평선 (하늘과 바닥 지면의 경계선 - 유저 요청으로 아래로 확장)

  // 1. 하늘만 암전 (지평선 위쪽 상공만 암전처럼 어둡게, 바닥 지면은 절대 검게 덮지 않음!)
  const skyDark = frame.skyDarkness !== undefined ? frame.skyDarkness : (
    moveStep === 1 ? p :
    moveStep >= 2 && moveStep <= 4 ? 1.0 :
    moveStep === 5 ? Math.max(0, 1.0 - p) : 0
  );

  if (skyDark > 0.01) {
    ctx.save();
    ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * skyDark;

    const w = drawCtx.width || 580;
    const h = drawCtx.height || 380;

    // 1) 상공 영역(-2000px ~ horizonY) 암전 그라데이션
    // horizonY에 도달하면서 투명(alpha 0.0)으로 페이드아웃
    const skyGrad = ctx.createLinearGradient(0, -300, 0, horizonY);
    skyGrad.addColorStop(0, "#020306");
    skyGrad.addColorStop(0.65, "#060810");
    skyGrad.addColorStop(0.88, "rgba(8, 10, 18, 0.95)");
    skyGrad.addColorStop(1.0, "rgba(8, 10, 18, 0.0)"); // 지평선에서 완전 투명 페이드아웃

    ctx.fillStyle = skyGrad;
    ctx.fillRect(-w * 3, -2000, w * 7, 2000 + horizonY);

    // 2) [유저 요청] 바닥 지면 영역 별도 어두운 갈색 필터
    // 바닥이 검게 변하지 않고 원래 지면 텍스처를 유지하면서,
    // 대지진/땅가르기 특유의 묵직하고 어두운 흙갈색 톤 필터를 지면(horizonY 아래)에 오버레이!
    const groundGrad = ctx.createLinearGradient(0, horizonY - 12, 0, h + 150);
    groundGrad.addColorStop(0, "rgba(55, 34, 22, 0.0)");
    groundGrad.addColorStop(0.08, "rgba(55, 34, 22, 0.35)");
    groundGrad.addColorStop(0.40, "rgba(48, 28, 18, 0.48)");
    groundGrad.addColorStop(1.0, "rgba(38, 20, 12, 0.58)");

    ctx.fillStyle = groundGrad;
    ctx.fillRect(-w * 3, horizonY - 12, w * 7, (h - horizonY) + 200);

    ctx.restore();
  }

  // Caster & Target의 실제 지면 기준 좌표 계산 (정확한 3D 정렬)
  const emX = drawCtx?.em?.x ?? 418;
  const emY = drawCtx?.em?.y ?? 152;
  const pmX = drawCtx?.pm?.x ?? 150;
  const pmY = drawCtx?.pm?.y ?? 280;

  const targetGroundX = isP ? (emX - 68) : (pmX + 80);
  const targetGroundY = (isP ? (emY + 22) : (pmY - 98)) + 20; // 발밑 접지점

  const casterGroundX = isP ? (pmX + 60) : (emX - 140);
  const casterGroundY = (isP ? (pmY + 25) : (emY + 82)) + 8; // 지면 강타점

  // 2. [유저 요청] 3D 원근 극대화 그림자 렌더링 (길게 + 위로 갈수록 길어지게)
  const casterSprite = isP ? drawCtx.playerSprite : drawCtx.enemySprite;
  const targetSprite = isP ? drawCtx.enemySprite : drawCtx.playerSprite;

  const casterOffset = isP ? (frame.pOffset ?? { x: 0, y: 0 }) : (frame.eOffset ?? { x: 0, y: 0 });
  const targetOffset = isP ? (frame.eOffset ?? { x: 0, y: 0 }) : (frame.pOffset ?? { x: 0, y: 0 });

  const casterBaseSize = isP ? (drawCtx.pm?.size || 100) : (drawCtx.em?.size || 100);
  const targetBaseSize = isP ? (drawCtx.em?.size || 100) : (drawCtx.pm?.size || 100);

  const casterScaleX = isP ? (frame.pScale?.x ?? 1.55) : (frame.eScale?.x ?? 1.55);
  const targetScaleX = isP ? (frame.eScale?.x ?? 0.56) : (frame.pScale?.x ?? 0.56);

  const casterEffectiveSize = casterBaseSize * casterScaleX;
  const targetEffectiveSize = targetBaseSize * targetScaleX;

  const casterGroundFeetX = (isP ? (drawCtx.pm?.x ?? 150) : (drawCtx.em?.x ?? 418)) + casterOffset.x;
  const baseGroundOffsetY = moveStep === 1
    ? casterOffset.y
    : (moveStep === 5 ? casterOffset.y : (isP ? 25 : 82));
  const casterGroundFeetY = (isP ? (drawCtx.pm?.y ?? 280) : (drawCtx.em?.y ?? 152)) + baseGroundOffsetY;

  const jumpAltitude = Math.max(0, (isP ? 25 : 82) - casterOffset.y);
  const jumpRatio = Math.min(1.0, jumpAltitude / 180);
  const casterScaleY = (moveStep === 3 && frame.phaseId === "fissure-ground-impact")
    ? 0.40 // 지면 강타 임팩트 시 착지 스쿼시 압축
    : (0.65 + jumpRatio * 0.55); // 지면 0.65 -> 점프 시 1.20으로 자연스럽게 전방 신장

  // [버그 수정] 복귀 단계(moveStep 5)에서 그림자가 0으로 완전히 페이드아웃되도록 보정 (중간에 1.0으로 튀는 현상 원천 차단)
  const shadowBaseAlpha = moveStep === 5
    ? Math.max(0, Math.min(1.0, skyDark))
    : (skyDark > 0.01 ? Math.min(1.0, skyDark * 1.15) : 0.0);
  const casterAlpha = (drawCtx.pAlpha !== undefined ? (isP ? drawCtx.pAlpha : drawCtx.eAlpha) : 1.0) * shadowBaseAlpha;
  const targetRawAlpha = frame.targetAlpha !== undefined ? frame.targetAlpha : (drawCtx.pAlpha !== undefined ? (isP ? drawCtx.eAlpha : drawCtx.pAlpha) : 1.0);
  const targetAlpha = targetRawAlpha * shadowBaseAlpha;

  // [유저 요청 완벽 반영] 바닥 지면 영역(horizonY 아래)으로만 엄격하게 클리핑: 하늘선 위로는 그림자가 절대 침범 불가!
  ctx.save();
  ctx.beginPath();
  const clipW = drawCtx.width || 580;
  const clipH = drawCtx.height || 380;
  ctx.rect(-clipW * 3, horizonY, clipW * 7, (clipH - horizonY) + 300);
  ctx.clip();

  // ① [유저 요청 드로잉 완벽 반영] 대상 포켓몬(원경)의 극대화 원근 그림자: 우측(East)으로 길고 웅장하게 뻗어나감 (하늘선 절대 침범 방지)
  const isTargetFalling = moveStep === 4;
  const targetShadowAlpha = isTargetFalling ? targetAlpha * Math.max(0, 1.0 - p * 1.8) : targetAlpha;
  if (targetSprite && targetShadowAlpha > 0.02) {
    const targetGroundFeetX = (isP ? (drawCtx.em?.x ?? 418) : (drawCtx.pm?.x ?? 150)) + targetOffset.x;
    const targetGroundFeetY = (isP ? (drawCtx.em?.y ?? 152) : (drawCtx.pm?.y ?? 280)) + targetOffset.y;
    drawPerspectiveSilhouetteShadow(
      ctx,
      targetSprite,
      targetGroundFeetX,
      targetGroundFeetY,
      targetEffectiveSize,
      !isP,
      0.48 * targetShadowAlpha,
      {
        direction: "up",
        scaleY: 0.36,
        skewX: isP ? -2.75 : 2.75, // 상대 우측 이동에 맞춰 우측으로 150~180px 더욱 길게 신장!
        scaleX: 1.25,
      }
    );
  }

  // ② [유저 스케치 각도 100% 일치] 시전자 포켓몬의 극대화 원근 그림자: 전방 좌하단(South-West) 대각선 투영
  if (casterSprite && casterAlpha > 0.02) {
    const isImpact = moveStep === 3 && frame.phaseId === "fissure-ground-impact";
    const jumpMod = 1.0 - jumpRatio * 0.18;
    const finalCasterScaleY = isImpact ? 0.65 : (1.05 * jumpMod);
    const finalCasterScaleX = isImpact ? 1.95 : (1.65 * jumpMod);
    const finalCasterSkewX = isImpact ? 2.70 : 2.50;
    const finalCasterAlpha = casterAlpha * (1.0 - jumpRatio * 0.20);

    drawPerspectiveSilhouetteShadow(
      ctx,
      casterSprite,
      casterGroundFeetX,
      casterGroundFeetY,
      casterEffectiveSize,
      isP,
      0.48 * finalCasterAlpha,
      {
        direction: "down", // 유저 스케치 그대로: 발밑에서 전방 좌측(화면 좌하단 모서리)으로 쏟아지는 원근 투영
        scaleY: finalCasterScaleY,
        skewX: isP ? finalCasterSkewX : -finalCasterSkewX, // [스케치 각도 유지] 대각선 각도를 정확히 유지하면서 230px 이상 길게 신장!
        scaleX: finalCasterScaleX,
      }
    );
  }

  ctx.restore();

  // 3. 3D 원근 대지 협곡 균열 렌더링 (Step 3: 균열 전개, Step 4: 심연 나락 개방, Step 5: 봉합)
  if (moveStep >= 3) {
    let crackT = 0;
    let openScale = 1.0;
    let alpha = 1.0;

    if (moveStep === 3) {
      crackT = Math.min(1.0, p);
      openScale = Math.min(1.0, 0.45 + p * 0.55);
    } else if (moveStep === 4) {
      crackT = 1.0;
      openScale = 1.0;
    } else if (moveStep === 5) {
      crackT = 1.0;
      openScale = Math.max(0, 1.0 - p * 1.15);
      alpha = Math.max(0, 1.0 - p);
    }

    if (crackT > 0.01 && openScale > 0.01 && alpha > 0.01) {
      // [각도 왜곡 0% 절대 보장 & 대상 발밑 100% 관통 레이]
      const toTargetX = targetGroundX - casterGroundX;
      const toTargetY = targetGroundY - casterGroundY;
      const targetDist = Math.hypot(toTargetX, toTargetY) || 1;
      const ux = toTargetX / targetDist;
      const uy = toTargetY / targetDist;
      const totalChasmDist = targetDist * 1.35;
      const chasmEndX = casterGroundX + ux * totalChasmDist;
      const chasmEndY = casterGroundY + uy * totalChasmDist;
      const targetRatio = targetDist / totalChasmDist; // 정확히 대상 발밑 위치 비율 (~0.74)

      drawFissureChasm(
        ctx,
        casterGroundX,
        casterGroundY,
        chasmEndX,
        chasmEndY,
        targetRatio,
        crackT,
        openScale,
        alpha
      );
    }
  }
}

/**
 * 090: 땅가르기 (Fissure) - 프론트 스프라이트 렌더러
 * - Step 1: 시전자 웅크림 및 도약 준비
 * - Step 2: 공중 도약, 최고조 체공 & 지면 수직 강하
 * - Step 3: 지면 강타 충격파, "쩌저저적" 전개 암석 파편 비산 & 타격 섬광
 * - Step 4: 대상 나락 추락 시 심연에서 치솟아 오르는 거대 흑연기 & 마그마 불꽃 파티클
 * - Step 5: 잔여 연무 페이드아웃 및 원래 필드 복귀
 */
export function drawFissureEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0.5,
  drawCtx?: any
) {
  ctx.save();

  const isP = drawCtx?.isPlayer ?? true;
  const frame = drawCtx?.frame ?? {};

  const targetOffset = isP ? (frame.eOffset ?? { x: 0, y: 0 }) : (frame.pOffset ?? { x: 0, y: 0 });
  const casterOffset = isP ? (frame.pOffset ?? { x: 0, y: 0 }) : (frame.eOffset ?? { x: 0, y: 0 });

  const targetX = (isP ? (drawCtx?.em?.x ?? targetPos.x) : (drawCtx?.pm?.x ?? targetPos.x)) + targetOffset.x;
  const targetY = (isP ? (drawCtx?.em?.y ?? targetPos.y) : (drawCtx?.pm?.y ?? targetPos.y)) + targetOffset.y;

  const casterX = (isP ? (drawCtx?.pm?.x ?? attackerPos.x) : (drawCtx?.em?.x ?? attackerPos.x)) + casterOffset.x;
  const casterY = (isP ? (drawCtx?.pm?.y ?? attackerPos.y) : (drawCtx?.em?.y ?? attackerPos.y)) + casterOffset.y;

  // 고정 지면 기준 좌표 (정확한 3D 벡터 정렬)
  const baseTargetGroundX = isP ? ((drawCtx?.em?.x ?? 418) - 68) : ((drawCtx?.pm?.x ?? 150) + 80);
  const baseTargetGroundY = (isP ? ((drawCtx?.em?.y ?? 152) + 22) : ((drawCtx?.pm?.y ?? 280) - 98)) + 20;

  const baseCasterGroundX = isP ? ((drawCtx?.pm?.x ?? 150) + 60) : ((drawCtx?.em?.x ?? 418) - 140);
  const baseCasterGroundY = (isP ? ((drawCtx?.pm?.y ?? 280) + 25) : ((drawCtx?.em?.y ?? 152) + 82)) + 8;

  const baseToTargetX = baseTargetGroundX - baseCasterGroundX;
  const baseToTargetY = baseTargetGroundY - baseCasterGroundY;
  const baseTargetDist = Math.hypot(baseToTargetX, baseToTargetY) || 1;
  const baseUx = baseToTargetX / baseTargetDist;
  const baseUy = baseToTargetY / baseTargetDist;
  const baseTotalChasmDist = baseTargetDist * 1.35;
  const baseChasmEndX = baseCasterGroundX + baseUx * baseTotalChasmDist;
  const baseChasmEndY = baseCasterGroundY + baseUy * baseTotalChasmDist;

  const p = effectProgress;

  // Step 1: 무대 세팅 및 웅크림 (점프 전이므로 공격/먼지 이펙트 일체 미출력)
  if (moveStep === 1) {
    // 순수 무대 세팅 단계: 점프 전에는 어떠한 공격 이펙트도 출력하지 않음!
    ctx.restore();
    return;
  }

  // Step 2: 공중 도약 및 체공 & 수직 강하
  else if (moveStep === 2) {
    // 1) 도약 개시 순간 (p <= 0.45): 지면 박차기 추진 흙먼지 폭풍 (유저 요청: 점프선 제거)
    if (p <= 0.45) {
      const launchP = p / 0.45;
      const alpha = Math.max(0, 1.0 - launchP * 0.7);

      // 발밑 지면 좌우로 뿜어지는 부드러운 추진 흙먼지 폭풍 (외곽 투명 그라데이션)
      drawDustPuff(ctx, baseCasterGroundX - 32 - launchP * 25, baseCasterGroundY, 20 + launchP * 8, alpha * 0.75, "#8D6E63");
      drawDustPuff(ctx, baseCasterGroundX + 32 + launchP * 25, baseCasterGroundY, 20 + launchP * 8, alpha * 0.75, "#A1887F");
      drawDustPuff(ctx, baseCasterGroundX - 12, baseCasterGroundY - 4, 15, alpha * 0.60, "#D7CCC8");
      drawDustPuff(ctx, baseCasterGroundX + 12, baseCasterGroundY - 4, 15, alpha * 0.60, "#BCAAA4");
    }
    // 2) 지면을 향한 맹렬한 수직 급강하 (p > 0.80): 슬림한 쐐기형 마하 콘 & [뒤가 투명한] 고속 하강 잔상선 (유저 요청: 상공 링 및 점 이펙트 제거)
    else if (p > 0.80) {
      ctx.save();
      // 포켓몬을 감싸며 내리꽂히는 쐐기형 마하 콘: 슬림하고 얇은 유선형 (뒤쪽 100% 투명)
      const coneGrad = ctx.createLinearGradient(0, casterY - 80, 0, casterY + 50);
      coneGrad.addColorStop(0, "rgba(255, 87, 34, 0.0)"); // 뒤쪽(상공) 100% 완전 투명!
      coneGrad.addColorStop(0.50, "rgba(255, 110, 64, 0.18)");
      coneGrad.addColorStop(1.0, "rgba(255, 171, 64, 0.38)"); // 앞쪽(선두)

      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.moveTo(casterX, casterY + 50);
      ctx.lineTo(casterX - 38, casterY - 75);
      ctx.lineTo(casterX + 38, casterY - 75);
      ctx.closePath();
      ctx.fill();

      // [유저 요청 반영] 머리 위쪽에서 맹렬하게 쏟아지는 고속 하강 잔상선: 슬림하고 은은한 스트림
      ctx.lineCap = "round";
      const diveLines = [
        { dx: -20, yTopOff: -90,  yBotOff: 0,   w: 1.6 },
        { dx: -10, yTopOff: -120, yBotOff: 20,  w: 2.2 },
        { dx: 0,   yTopOff: -135, yBotOff: 32,  w: 2.6 },
        { dx: 10,  yTopOff: -115, yBotOff: 18,  w: 2.2 },
        { dx: 20,  yTopOff: -85,  yBotOff: -4,  w: 1.6 },
      ];

      for (const line of diveLines) {
        const yTop = casterY + line.yTopOff;
        const yBot = casterY + line.yBotOff;
        const lineGrad = ctx.createLinearGradient(0, yTop, 0, yBot);
        lineGrad.addColorStop(0, "rgba(255, 215, 64, 0.0)"); // 뒤쪽(상공 꼬리) 100% 완전 투명!
        lineGrad.addColorStop(0.40, "rgba(255, 152, 0, 0.45)");
        lineGrad.addColorStop(0.80, "rgba(255, 238, 88, 0.85)");
        lineGrad.addColorStop(1.0, "rgba(255, 255, 255, 1.0)"); // 앞쪽(선두) 백색 선명

        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = line.w;
        ctx.beginPath();
        ctx.moveTo(casterX + line.dx, yTop);
        ctx.lineTo(casterX + line.dx * 0.85, yBot);
        ctx.stroke();
      }

      // 중심 코어 고열 백색 섬광 스트림: 뒤쪽 완전 투명
      const coreGrad = ctx.createLinearGradient(0, casterY - 80, 0, casterY + 30);
      coreGrad.addColorStop(0, "rgba(255, 255, 255, 0.0)"); // 뒤쪽 완전 투명!
      coreGrad.addColorStop(0.40, "rgba(255, 255, 255, 0.35)");
      coreGrad.addColorStop(1.0, "rgba(255, 255, 255, 1.0)"); // 앞쪽 선두

      ctx.strokeStyle = coreGrad;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(casterX, casterY - 80);
      ctx.lineTo(casterX, casterY + 30);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Step 3: 지면 강타 & "쩌저저적" 전개 & 타격 섬광
  else if (moveStep === 3) {
    // 1) [유저 요청] 강타 지점: 인위적인 흰색/주황색 링 2개 제거 -> 자연스러운 모래 먼지 팽창 링 & 돌멩이 파편 추가
    if (p < 0.55) {
      const slamP = p / 0.55;
      const alpha = Math.max(0, 1.0 - slamP);

      ctx.save();

      // ① 모래 먼지 링 (Sand/Dust Ring)
      // 강타 중심에서 타원형 지면 원근을 따라 사방으로 폭발하며 팽창하는 10개의 흙먼지 퍼프 링
      const ringRx = 32 + slamP * 88; // 32px -> 120px 팽창
      const ringRy = ringRx * 0.38; // 3D 지면 투영 납작 타원
      const dustPuffCount = 10;
      const dustColors = ["#8D6E63", "#A1887F", "#BCAAA4", "#D7CCC8", "#8D6E63", "#A1887F", "#BCAAA4", "#D7CCC8", "#A1887F", "#8D6E63"];

      for (let i = 0; i < dustPuffCount; i++) {
        const ang = (i / dustPuffCount) * Math.PI * 2 + slamP * 0.25;
        const px = baseCasterGroundX + Math.cos(ang) * ringRx + (i % 2 === 0 ? -4 : 4);
        const py = baseCasterGroundY + Math.sin(ang) * ringRy + (i % 3 === 0 ? -2 : 2);
        const puffRadius = 14 + slamP * 10 + (i % 3) * 3;
        drawDustPuff(ctx, px, py, puffRadius, alpha * 0.70, dustColors[i]);
      }

      // 강타 중심부 짙은 흙먼지 코어 폭풍
      drawDustPuff(ctx, baseCasterGroundX - 18, baseCasterGroundY - 4, 18 + slamP * 8, alpha * 0.75, "#5D4037");
      drawDustPuff(ctx, baseCasterGroundX + 18, baseCasterGroundY - 4, 18 + slamP * 8, alpha * 0.75, "#6D4C41");
      drawDustPuff(ctx, baseCasterGroundX, baseCasterGroundY - 6, 20 + slamP * 10, alpha * 0.80, "#4E342E");

      // ② 돌멩이 파편 추가 (Impact Rock Shards)
      // 강타 순간 지면에서 사방으로 솟구치며 튀어오르는 각진 암석 파편들 (7개)
      const IMPACT_ROCKS = [
        { angle: -2.8, dist: 65, height: 38, size: 5.5, rotSpeed: 4.5 },
        { angle: -2.2, dist: 45, height: 48, size: 6.5, rotSpeed: -3.8 },
        { angle: -1.5, dist: 30, height: 55, size: 7.0, rotSpeed: 5.2 },
        { angle: -0.9, dist: 50, height: 44, size: 6.0, rotSpeed: -4.2 },
        { angle: -0.3, dist: 70, height: 35, size: 5.0, rotSpeed: 3.5 },
        { angle:  2.6, dist: 55, height: 28, size: 4.5, rotSpeed: -5.0 },
        { angle:  0.6, dist: 60, height: 30, size: 4.8, rotSpeed: 4.0 },
      ];

      for (let i = 0; i < IMPACT_ROCKS.length; i++) {
        const rk = IMPACT_ROCKS[i];
        const flightT = Math.min(1.0, slamP * 1.35);
        const curDist = flightT * rk.dist;
        const curX = baseCasterGroundX + Math.cos(rk.angle) * curDist;
        const groundYAtPos = baseCasterGroundY + Math.sin(rk.angle) * (curDist * 0.38);
        const arcY = Math.sin(flightT * Math.PI) * rk.height;
        const curY = groundYAtPos - arcY;

        // 돌멩이 바닥 미세 그림자
        if (flightT < 0.95) {
          const shadowA = Math.max(0.08, 0.40 * (1.0 - arcY / rk.height)) * alpha;
          ctx.save();
          ctx.fillStyle = `rgba(20, 15, 10, ${shadowA})`;
          ctx.beginPath();
          ctx.ellipse(curX, groundYAtPos, rk.size * 0.75, rk.size * 0.30, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        drawEarthquakeFacetedRock(ctx, curX, curY, rk.size, flightT * rk.rotSpeed, alpha);
      }

      ctx.restore();
    }

    // 2) 균열 진행선을 따라 튀어오르는 날카로운 암석 파편들 (8개)
    const rockCount = Math.min(8, Math.ceil(p * 8));
    for (let i = 0; i < rockCount; i++) {
      const u = (i + 1) / 8;
      const curDist = baseTotalChasmDist * u;
      const rockX = baseCasterGroundX + baseUx * curDist + (i % 2 === 0 ? -10 : 10);
      const rockBaseY = baseCasterGroundY + baseUy * curDist;
      const arcT = ((p * 2.2 + i * 0.16) % 1.0);
      const jumpH = 22 + (i % 3) * 8;
      const curY = rockBaseY - Math.sin(arcT * Math.PI) * jumpH;
      drawEarthquakeFacetedRock(ctx, rockX, curY, 3.5 + (i % 3) * 1.2, arcT * 5.0, 1.0 - arcT * 0.3);
    }

    // 3) 대지 균열 첨단 흙먼지 퍼프 (원경 끝까지 관통 전진)
    const curDist = baseTotalChasmDist * p;
    const tipX = baseCasterGroundX + baseUx * curDist;
    const tipY = baseCasterGroundY + baseUy * curDist;
    drawDustPuff(ctx, tipX - 10, tipY, 10, 0.60, "#8D6E63");
    drawDustPuff(ctx, tipX + 10, tipY, 11, 0.60, "#D7CCC8");

    // 4) [유저 요청으로 일시 제거] 타격 프레임 (p >= 0.85) 스타버스트 임팩트 섬광
    /*
    if (p >= 0.85) {
      drawStarburstImpact(ctx, baseTargetGroundX, baseTargetGroundY - 32, "#FFFFFF", "#FF3D00", 50);
    }
    */
  }

  // Step 4: 대상 나락 추락 시 심연에서 치솟는 거대 흑연기 (붉은 파티클 일체 배제)
  else if (moveStep === 4) {
    const plumeAlpha = Math.max(0, 1.0 - p * 0.6);

    // 심연 속에서 치솟아 오르며 떨어지는 대상을 감싸 삼키는 3단 흑연기 기둥
    const smokeY = baseTargetGroundY - 8 - p * 40;
    drawDustPuff(ctx, baseTargetGroundX - 18, smokeY, 22 + p * 16, plumeAlpha * 0.75, "#3E2723");
    drawDustPuff(ctx, baseTargetGroundX + 18, smokeY - 6, 24 + p * 18, plumeAlpha * 0.75, "#4E342E");
    drawDustPuff(ctx, baseTargetGroundX,      smokeY - 14, 28 + p * 20, plumeAlpha * 0.85, "#1A0F0A");
  }

  // Step 5: 안정화 및 연무 페이드아웃
  else if (moveStep === 5) {
    const alpha = Math.max(0, 1.0 - p);
    if (alpha > 0.02) {
      drawDustPuff(ctx, baseTargetGroundX - 18, baseTargetGroundY - 15, 20, alpha * 0.35, "#8D6E63");
      drawDustPuff(ctx, baseTargetGroundX + 18, baseTargetGroundY - 15, 22, alpha * 0.35, "#A1887F");
      drawDustPuff(ctx, casterX, baseCasterGroundY, 16, alpha * 0.30, "#D7CCC8");
    }
  }

  ctx.restore();
}

// ============================================================================
// 091: 구멍파기 (Dig) - 2턴 기술 (1턴: 잠복, 2턴: 기습 타격)
// ============================================================================

interface DigRockDef {
  dx: number;
  dy: number;
  size: number;
  cycle: 1 | 2 | 3;
  popHeight: number;
  driftX: number;
  rotSpeed: number;
}

const DIG_CASTER_ROCKS: DigRockDef[] = [
  // 1차 바운스 (Cycle 1): 발밑에서 가볍게 솟구치는 3D 돌멩이 3개
  { dx: -28, dy:  6, size: 7.0, cycle: 1, popHeight: 18, driftX: -6, rotSpeed:  4.2 },
  { dx:  26, dy:  8, size: 6.5, cycle: 1, popHeight: 22, driftX:  8, rotSpeed: -3.8 },
  { dx:  -8, dy: -8, size: 6.0, cycle: 1, popHeight: 16, driftX: -3, rotSpeed:  5.0 }, // behind

  // 2차 바운스 (Cycle 2): 더 강하게 솟구치는 3D 돌멩이 3개
  { dx: -45, dy:  5, size: 8.5, cycle: 2, popHeight: 32, driftX: -12, rotSpeed: -5.5 },
  { dx:  42, dy:  9, size: 8.0, cycle: 2, popHeight: 34, driftX:  14, rotSpeed:  4.8 },
  { dx:  14, dy: -10, size: 7.0, cycle: 2, popHeight: 26, driftX:   5, rotSpeed: -4.2 }, // behind

  // 3차 바운스 (Cycle 3): 완전 잠복 시 전방위로 분출하는 3D 돌멩이 4개
  { dx: -20, dy: 14, size: 9.0, cycle: 3, popHeight: 40, driftX: -10, rotSpeed:  6.0 },
  { dx:  24, dy: 15, size: 9.5, cycle: 3, popHeight: 42, driftX:  12, rotSpeed: -5.8 },
  { dx: -35, dy: -6, size: 7.5, cycle: 3, popHeight: 30, driftX:  -8, rotSpeed:  4.5 }, // behind
  { dx:  38, dy: -5, size: 7.5, cycle: 3, popHeight: 32, driftX:  10, rotSpeed: -4.0 }, // behind
];

/**
 * 1턴 굴착 시 시전 포켓몬 주변에 솟구쳐 튀어오르는 3D 각진 돌멩이들 (지진 3D 바위 렌더러 참조)
 * - isBehind: true이면 포켓몬 뒤쪽(dy < 0), false이면 포켓몬 앞쪽(dy >= 0) 돌멩이 렌더링
 */
function drawDigCasterRocks(
  ctx: any,
  footX: number,
  footY: number,
  prog: number,
  isBehind: boolean
) {
  for (const r of DIG_CASTER_ROCKS) {
    if (isBehind && r.dy >= 0) continue;
    if (!isBehind && r.dy < 0) continue;

    let startP = 0.08;
    let endP = 0.42;
    if (r.cycle === 2) {
      startP = 0.38;
      endP = 0.72;
    } else if (r.cycle === 3) {
      startP = 0.68;
      endP = 1.00;
    }

    if (prog < startP || prog > endP) continue;

    const t = Math.max(0, Math.min(1.0, (prog - startP) / (endP - startP)));
    const arcY = Math.sin(t * Math.PI) * r.popHeight;
    const curX = footX + r.dx + r.driftX * t;
    const curY = footY + r.dy - arcY;
    const shadowX = curX;
    const shadowY = footY + r.dy;

    // 지면 그림자
    const shadowAlpha = Math.max(0, 0.45 * (1.0 - (arcY / (r.popHeight * 1.5))));
    const shadowScale = Math.max(0.4, 1.0 - (arcY / (r.popHeight * 2.0)));
    ctx.save();
    ctx.fillStyle = `rgba(28, 16, 10, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(shadowX, shadowY, r.size * 0.95 * shadowScale, r.size * 0.40 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3D 각진 입체 돌멩이 (지진 Faceted Rock 셰이더)
    const rot = t * r.rotSpeed;
    drawEarthquakeFacetedRock(ctx, curX, curY, r.size, rot, 1.0);

    // 발사 순간 지면 미세 먼지 퍼프
    if (t <= 0.35) {
      const puffP = t / 0.35;
      drawDustPuff(ctx, shadowX, shadowY - 1, (r.size * 0.75) + puffP * 5, 0.55 * (1.0 - puffP), "#D7CCC8");
    }
  }
}

/**
 * 091: 구멍파기 (Dig) 비하인드 레이어 (포켓몬 스프라이트 뒤에 렌더링)
 * - 1턴 잠복 (isCharging): 시전 포켓몬 뒤쪽 3D 돌멩이들 튀어오름 (구덩이 없음!)
 * - 2턴 기습 (Attack): 상대 발밑 지하 진동 균열 / 크레이터 심연
 */
export function drawBehindDigEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0.5,
  isCharging: boolean = false,
  drawCtx?: any
) {
  ctx.save();
  const isP = drawCtx?.isPlayer !== false;

  // 1턴: 시전자 발밑 3D 돌멩이들 (포켓몬 뒤쪽 레이어) - 구덩이 없음!
  if (isCharging) {
    const footX = isP ? (drawCtx?.pm?.x ?? 150) : (drawCtx?.em?.x ?? 418);
    const footY = isP ? (drawCtx?.pm?.y ?? 280) : (drawCtx?.em?.y ?? 152);
    drawDigCasterRocks(ctx, footX, footY, effectProgress, true);
    ctx.restore();
    return;
  }

  // 2턴: 대상 발밑 기습 분출 크레이터 (상대 뒤쪽)
  if (moveStep === 2) {
    const targetGroundY = isP ? (drawCtx?.em?.y ?? 152) : (drawCtx?.pm?.y ?? 280);
    const targetX = isP ? (drawCtx?.em?.x ?? 418) : (drawCtx?.pm?.x ?? 150);

    ctx.save();
    ctx.fillStyle = "#110704";
    ctx.beginPath();
    ctx.ellipse(targetX, targetGroundY, 34, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#3E2723";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(targetX, targetGroundY, 34, 13, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 091: 구멍파기 (Dig) 프론트 레이어 (포켓몬 스프라이트 앞에 렌더링)
 * - 1턴 잠복 (isCharging): 시전 포켓몬 앞쪽 3D 돌멩이들 튀어오름 + 미세 토사 먼지 (구덩이 없음!)
 * - 2턴 기습 (Attack): 대상 발밑 지하 진동 ➔ 지반 대폭발 솟구침 ➔ 흙기둥 분출 ➔ 착지 안착
 */
export function drawDigEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0.5,
  isCharging: boolean = false,
  drawCtx?: any
) {
  ctx.save();
  const isP = drawCtx?.isPlayer !== false;

  // =========================================================================
  // [1턴: 굴착 잠복 프론트 단계 (isCharging = true)] - 구덩이 없음!
  // =========================================================================
  if (isCharging) {
    const footX = isP ? (drawCtx?.pm?.x ?? 150) : (drawCtx?.em?.x ?? 418);
    const footY = isP ? (drawCtx?.pm?.y ?? 280) : (drawCtx?.em?.y ?? 152);

    // 1) 3D 각진 돌멩이들 (포켓몬 앞쪽 레이어)
    drawDigCasterRocks(ctx, footX, footY, effectProgress, false);

    // 2) 발밑 충격 흙먼지 퍼프 (각 바운스 시점에 지면에서 퐁퐁 피어오름)
    const p = effectProgress;
    const waveT = (p * 3) % 1.0;
    const puffAlpha = Math.sin(waveT * Math.PI) * 0.45;
    drawDustPuff(ctx, footX - 16, footY + 2, 7 + waveT * 5, puffAlpha, "#D7CCC8");
    drawDustPuff(ctx, footX + 16, footY + 2, 8 + waveT * 5, puffAlpha, "#BCAAA4");

    ctx.restore();
    return;
  }

  // =========================================================================
  // [2턴: 지하 기습 타격 단계 (isCharging = false)]
  // =========================================================================
  const groundY = targetPos.y + 36;
  const targetX = targetPos.x;

  // Step 1: 대상 발밑 지하 진동 (두구두구)
  if (moveStep === 1) {
    const p = effectProgress;
    const alpha = Math.min(1.0, p * 2.5);

    // 지하에서 솟아오르기 직전 지면 부풀어오름 타원
    ctx.save();
    ctx.fillStyle = `rgba(93, 64, 55, ${alpha * 0.65})`;
    ctx.beginPath();
    ctx.ellipse(targetX, groundY, 18 + p * 14, 8 + p * 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 진동 충격 잔물결
    ctx.strokeStyle = `rgba(188, 170, 164, ${alpha * 0.75})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(targetX, groundY, 26 + p * 18, 11 + p * 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 뽈뽈 피어오르는 흙먼지
    drawDustPuff(ctx, targetX - 8, groundY - 2, 9 + p * 6, alpha * 0.7, "#D7CCC8");
    drawDustPuff(ctx, targetX + 8, groundY - 2, 10 + p * 6, alpha * 0.7, "#BCAAA4");
  }

  // Step 2: 지반 대폭발 솟구침 & 거대 흙기둥 분출 (어퍼컷 기습 타격)
  else if (moveStep === 2) {
    const p = effectProgress;
    const eruptH = 85 * Math.sin(Math.min(1.0, p * 1.3) * Math.PI);

    ctx.save();

    // 1) 지하 붕괴 크레이터 구멍
    ctx.fillStyle = "#1A0F0B";
    ctx.beginPath();
    ctx.ellipse(targetX, groundY, 30, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2) 수직으로 솟구치는 거대 흙기둥 & 바위 분출 줄기
    // 중심 흙기둥 (#5D4037 / #795548)
    ctx.fillStyle = "#5D4037";
    ctx.beginPath();
    ctx.moveTo(targetX - 22, groundY);
    ctx.lineTo(targetX - 14, groundY - eruptH);
    ctx.lineTo(targetX + 14, groundY - eruptH);
    ctx.lineTo(targetX + 22, groundY);
    ctx.closePath();
    ctx.fill();

    // 밝은 토사 하이라이트 줄기 (#8D6E63)
    ctx.fillStyle = "#8D6E63";
    ctx.beginPath();
    ctx.moveTo(targetX - 10, groundY);
    ctx.lineTo(targetX - 6, groundY - eruptH * 0.9);
    ctx.lineTo(targetX + 6, groundY - eruptH * 0.9);
    ctx.lineTo(targetX + 10, groundY);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // 3) 분출과 함께 하늘 높이 치솟는 파편 바위들 (10개)
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI * 0.5 + (i - 4.5) * 0.22;
      const speed = 40 + (i % 4) * 16;
      const rx = targetX + Math.cos(a) * (speed * p * 0.8);
      const ry = groundY + Math.sin(a) * (speed * Math.sin(p * Math.PI));
      drawRockPebble(ctx, rx, ry, 4.2 + (i % 3) * 1.5, p * 8.0 + i, 1.0 - p * 0.3);
    }

    // 4) 솟구침 하단 모래먼지 대폭발
    drawDustPuff(ctx, targetX - 26, groundY - 10, 22, 0.85, "#BCAAA4");
    drawDustPuff(ctx, targetX + 26, groundY - 8,  24, 0.85, "#D7CCC8");
    drawDustPuff(ctx, targetX,      groundY + 8,  26, 0.90, "#8D6E63");
  }

  // Step 3: 착지 충격파 & 지면 흙더미 안착
  else if (moveStep === 3) {
    const p = effectProgress;
    const alpha = Math.max(0, 1.0 - p * 0.85);

    // 지면 크레이터와 흙더미
    ctx.save();
    ctx.fillStyle = `rgba(62, 39, 35, ${alpha * 0.70})`;
    ctx.beginPath();
    ctx.ellipse(targetX, groundY, 28 * (1.0 - p * 0.2), 10 * (1.0 - p * 0.2), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 바닥으로 떨어지는 낙하 잔여 자갈
    for (let i = 0; i < 6; i++) {
      const offX = (i - 2.5) * 14;
      const offY = 4 + (i % 3) * 3;
      drawRockPebble(ctx, targetX + offX, groundY + offY, 3.2, 0.5 * i, alpha);
    }

    // 흩어지는 먼지 연기
    drawDustPuff(ctx, targetX - 30 - p * 12, groundY, 26 + p * 10, alpha * 0.65, "#D7CCC8");
    drawDustPuff(ctx, targetX + 30 + p * 12, groundY, 28 + p * 10, alpha * 0.65, "#BCAAA4");
  }

  ctx.restore();
}

// ============================================================================
// 092: 맹독 (Toxic) - 독 / 변화 (맹독 상태이상)
// ============================================================================

/**
 * 맹독 해골 기화 형상 (Poison Skull Silhouette)
 */
function drawToxicSkull(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  alpha: number
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;
  ctx.translate(cx, cy);

  const s = size;

  // 1) 해골 머리 윤곽 (#6A1B9A - 짙은 로열 바이올렛)
  ctx.fillStyle = "#6A1B9A";
  ctx.beginPath();
  // 둥근 윗머리
  ctx.arc(0, -s * 0.35, s * 0.65, Math.PI * 0.85, Math.PI * 0.15);
  // 턱으로 내려오는 라인
  ctx.lineTo(s * 0.40, s * 0.45);
  ctx.lineTo(-s * 0.40, s * 0.45);
  ctx.closePath();
  ctx.fill();

  // 2) 해골 눈구멍 2개 (순백/연보라 안광)
  ctx.fillStyle = "#F3E5F5";
  ctx.beginPath();
  ctx.arc(-s * 0.22, -s * 0.32, s * 0.16, 0, Math.PI * 2);
  ctx.arc(s * 0.22, -s * 0.32, s * 0.16, 0, Math.PI * 2);
  ctx.fill();

  // 3) 역삼각형 콧구멍
  ctx.fillStyle = "#4A148C";
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.12);
  ctx.lineTo(-s * 0.08, -s * 0.02);
  ctx.lineTo(s * 0.08, -s * 0.02);
  ctx.closePath();
  ctx.fill();

  // 4) 턱 이빨 세로선
  ctx.strokeStyle = "#4A148C";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-s * 0.15, s * 0.25);
  ctx.lineTo(-s * 0.15, s * 0.45);
  ctx.moveTo(0, s * 0.25);
  ctx.lineTo(0, s * 0.45);
  ctx.moveTo(s * 0.15, s * 0.25);
  ctx.lineTo(s * 0.15, s * 0.45);
  ctx.stroke();

  ctx.restore();
}

/**
 * 맹독 액체 방울/거품 (Toxic Bubble Droplet)
 */
function drawToxicBubble(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  // 보라 독액 외곽
  ctx.fillStyle = "#8E24AA";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // 코어 진보라
  ctx.fillStyle = "#4A148C";
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.65, 0, Math.PI * 2);
  ctx.fill();

  // 상단 반사 하이라이트 (순백 도트)
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(x - radius * 0.32, y - radius * 0.32, radius * 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 대형 맹독 구체 (Step 1에서 응축된 대형 구체와 동일한 비주얼)
 */
function drawLargeToxicOrb(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);

  // 1) 외곽 오라 & 맹독 외피
  ctx.fillStyle = `rgba(106, 27, 154, ${alpha * 0.75})`;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // 2) 내부 짙은 맹독 코어
  ctx.fillStyle = `rgba(74, 20, 140, ${alpha * 0.90})`;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.65, 0, Math.PI * 2);
  ctx.fill();

  // 3) 상단 광택 하이라이트
  ctx.fillStyle = `rgba(243, 229, 245, ${alpha * 0.85})`;
  ctx.beginPath();
  ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 092: 맹독 (Toxic) 이펙트 렌더러
 * - Step 1: 시전자 전면에 짙은 암자색 대형 맹독 구체 응축
 * - Step 2: 응축된 대형 맹독 구체 그대로 대상에게 고속 투척
 * - Step 3: 대상 몸체에 독액 철퍽 스플래터 & 부글거리는 독액 웅덩이 착탄
 * - Step 4: 보라 독기운 속에서 피어오르는 맹독 해골 기화 & 맹독 상태이상 착색
 */
export function drawToxicEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0.5
) {
  ctx.save();

  // Step 1: 시전자 전면에 암자색 맹독 액포 응축
  if (moveStep === 1) {
    const p = effectProgress;
    const ax = attackerPos.x;
    const ay = attackerPos.y + 4;
    const orbRadius = 8 + p * 16;
    const alpha = Math.min(1.0, p * 2.5);

    // 대형 맹독 구체
    drawLargeToxicOrb(ctx, ax, ay, orbRadius, alpha);

    // 주위로 튀는 작은 독방울들 (6개)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + p * 3.0;
      const dist = orbRadius * (1.2 + 0.4 * Math.sin(p * 6 + i));
      drawToxicBubble(ctx, ax + Math.cos(angle) * dist, ay + Math.sin(angle) * dist, 2.5, alpha * 0.8);
    }
  }

  // Step 2: 대형 맹독 구체 투척 및 포물선 비행
  else if (moveStep === 2) {
    const p = effectProgress;
    const bp = Math.max(0, Math.min(1.0, p));

    const startX = attackerPos.x;
    const startY = attackerPos.y + 4;
    const targetX = targetPos.x;
    const targetY = targetPos.y;

    // 포물선 궤적 계산
    const curX = startX + (targetX - startX) * bp;
    const arcH = Math.sin(bp * Math.PI) * 28;
    const curY = startY + (targetY - startY) * bp - arcH;

    const orbRadius = 21.6;

    // 이전 위치 계산 (꼬리 잔상용)
    const prevBp = Math.max(0, bp - 0.20);
    const prevX = startX + (targetX - startX) * prevBp;
    const prevArcH = Math.sin(prevBp * Math.PI) * 28;
    const prevY = startY + (targetY - startY) * prevBp - prevArcH;
    const tailDist = Math.hypot(curX - prevX, curY - prevY);

    // 1) 꼬리 잔상 스트림 (유저 피드백: 반투명하게 + 뒤쪽은 완전투명 + 자연스러운 테이퍼링)
    if (tailDist > 2) {
      const numTailPts = 8;
      const tailPts: { x: number; y: number; u: number }[] = [];
      for (let i = 0; i <= numTailPts; i++) {
        const u = i / numTailPts; // 0 = 뒤쪽 끝 (완전투명), 1 = 구체 중심
        const tp = prevBp + (bp - prevBp) * u;
        const tx = startX + (targetX - startX) * tp;
        const tArc = Math.sin(tp * Math.PI) * 28;
        const ty = startY + (targetY - startY) * tp - tArc;
        tailPts.push({ x: tx, y: ty, u });
      }

      const leftOuter: { x: number; y: number }[] = [];
      const rightOuter: { x: number; y: number }[] = [];
      const leftInner: { x: number; y: number }[] = [];
      const rightInner: { x: number; y: number }[] = [];

      for (let i = 0; i < tailPts.length; i++) {
        const cur = tailPts[i];
        let dx = 0;
        let dy = 0;
        if (i === 0) {
          dx = tailPts[1].x - cur.x;
          dy = tailPts[1].y - cur.y;
        } else if (i === tailPts.length - 1) {
          dx = cur.x - tailPts[i - 1].x;
          dy = cur.y - tailPts[i - 1].y;
        } else {
          dx = tailPts[i + 1].x - tailPts[i - 1].x;
          dy = tailPts[i + 1].y - tailPts[i - 1].y;
        }
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;

        // 테이퍼링: 뒤쪽(u=0)은 0.12로 뾰족하고, 앞쪽(u=1)은 1.0(구체 너비)
        const taper = Math.pow(cur.u, 0.75);
        const outerHalfW = orbRadius * 0.92 * (0.12 + 0.88 * taper);
        const innerHalfW = orbRadius * 0.58 * (0.08 + 0.92 * taper);

        leftOuter.push({ x: cur.x + nx * outerHalfW, y: cur.y + ny * outerHalfW });
        rightOuter.push({ x: cur.x - nx * outerHalfW, y: cur.y - ny * outerHalfW });
        leftInner.push({ x: cur.x + nx * innerHalfW, y: cur.y + ny * innerHalfW });
        rightInner.push({ x: cur.x - nx * innerHalfW, y: cur.y - ny * innerHalfW });
      }

      const rearPt = tailPts[0];
      const frontPt = tailPts[tailPts.length - 1];

      ctx.save();

      // 외곽 반투명 보라 오라 (뒤쪽: 0% 완전투명 -> 앞쪽: 38% 반투명)
      const outerGrad = ctx.createLinearGradient(rearPt.x, rearPt.y, frontPt.x, frontPt.y);
      outerGrad.addColorStop(0.0, "rgba(106, 27, 154, 0.0)"); // 뒤쪽 완전투명!
      outerGrad.addColorStop(0.35, "rgba(106, 27, 154, 0.10)");
      outerGrad.addColorStop(0.70, "rgba(106, 27, 154, 0.24)");
      outerGrad.addColorStop(1.0, "rgba(106, 27, 154, 0.38)"); // 앞쪽 반투명

      ctx.fillStyle = outerGrad;
      ctx.beginPath();
      ctx.moveTo(leftOuter[0].x, leftOuter[0].y);
      for (let i = 1; i < leftOuter.length; i++) ctx.lineTo(leftOuter[i].x, leftOuter[i].y);
      for (let i = rightOuter.length - 1; i >= 0; i--) ctx.lineTo(rightOuter[i].x, rightOuter[i].y);
      ctx.closePath();
      ctx.fill();

      // 내부 짙은 맹독 코어 꼬리 (뒤쪽: 0% 완전투명 -> 앞쪽: 48% 반투명)
      const innerGrad = ctx.createLinearGradient(rearPt.x, rearPt.y, frontPt.x, frontPt.y);
      innerGrad.addColorStop(0.0, "rgba(74, 20, 140, 0.0)"); // 뒤쪽 완전투명!
      innerGrad.addColorStop(0.40, "rgba(74, 20, 140, 0.12)");
      innerGrad.addColorStop(0.75, "rgba(142, 36, 170, 0.30)");
      innerGrad.addColorStop(1.0, "rgba(142, 36, 170, 0.48)"); // 앞쪽 반투명

      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.moveTo(leftInner[0].x, leftInner[0].y);
      for (let i = 1; i < leftInner.length; i++) ctx.lineTo(leftInner[i].x, leftInner[i].y);
      for (let i = rightInner.length - 1; i >= 0; i--) ctx.lineTo(rightInner[i].x, rightInner[i].y);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // 2) 비행 궤적 뒤로 흩날리는 반투명 맹독 미세 방울들
    for (let i = 0; i < 4; i++) {
      const trailP = Math.max(0, bp - 0.06 * (i + 1));
      if (trailP <= 0.02) continue;
      const trailArc = Math.sin(trailP * Math.PI) * 28;
      const bx = startX + (targetX - startX) * trailP + (i % 2 === 0 ? 3 : -3);
      const by = startY + (targetY - startY) * trailP - trailArc + ((i % 3) - 1) * 2;
      const bAlpha = Math.max(0, (1.0 - (i + 1) * 0.22) * 0.45);
      if (bAlpha > 0.05) {
        drawToxicBubble(ctx, bx, by, 2.5 - i * 0.35, bAlpha);
      }
    }

    // 3) 대형 맹독 구체 본체
    drawLargeToxicOrb(ctx, curX, curY, orbRadius, 1.0);
  }

  // Step 3: 대상 몸체에 독액 철퍽 스플래터 & 부식 착탄
  else if (moveStep === 3) {
    const p = effectProgress;
    const tx = targetPos.x;
    const ty = targetPos.y;
    const gy = targetPos.y + 36;

    // 1) 대상 가슴/몸통에 튄 맹독 스플래터 (유기적 튀김 형상)
    const splatScale = Math.min(1.0, p * 2.2);
    ctx.save();
    ctx.fillStyle = "#7B1FA2";
    // 중앙 덩어리
    ctx.beginPath();
    ctx.arc(tx, ty - 2, 16 * splatScale, 0, Math.PI * 2);
    // 흘러내리는 4갈래 독물줄기
    ctx.arc(tx - 12 * splatScale, ty + 8,  8 * splatScale, 0, Math.PI * 2);
    ctx.arc(tx + 14 * splatScale, ty + 6,  9 * splatScale, 0, Math.PI * 2);
    ctx.arc(tx - 4,              ty + 18, 7 * splatScale, 0, Math.PI * 2);
    ctx.arc(tx + 6,              ty + 20, 6 * splatScale, 0, Math.PI * 2);
    ctx.fill();

    // 독액 반사 광택 (#E1BEE7)
    ctx.fillStyle = "#E1BEE7";
    ctx.beginPath();
    ctx.arc(tx - 5, ty - 7, 4 * splatScale, 0, Math.PI * 2);
    ctx.arc(tx + 7, ty + 2, 3 * splatScale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2) 바닥에 튄 부식성 독액 웅덩이
    ctx.save();
    ctx.fillStyle = `rgba(74, 20, 140, ${0.85 * splatScale})`;
    ctx.beginPath();
    ctx.ellipse(tx, gy, 28 * splatScale, 11 * splatScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3) 사방으로 튀는 독방울 파편 (12개)
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const dist = 16 + p * 34 + (i % 3) * 8;
      const bx = tx + Math.cos(a) * dist;
      const by = ty + Math.sin(a) * (dist * 0.85);
      drawToxicBubble(ctx, bx, by, 3.2 + (i % 3), 1.0 - p * 0.4);
    }
  }

  // Step 4: 맹독 해골 기화 & 보라 독 안개 속 맹독 상태이상 각인
  else if (moveStep === 4) {
    const p = effectProgress;
    const tx = targetPos.x;
    const ty = targetPos.y;
    const gy = targetPos.y + 36;
    const alpha = Math.max(0, 1.0 - p * 0.85);

    // 1) 위로 서서히 피어오르는 맹독 해골 형상
    const skullY = ty - 8 - p * 28;
    drawToxicSkull(ctx, tx, skullY, 20 + p * 6, alpha * 0.92);

    // 2) 바닥 잔여 웅덩이에서 보글보글 솟구쳐 오르는 독가스 거품들 (8개)
    for (let i = 0; i < 8; i++) {
      const bubbleP = ((p * 2.2 + i * 0.2) % 1.0);
      const bx = tx - 20 + (i * 5.5);
      const by = gy - bubbleP * 42;
      drawToxicBubble(ctx, bx, by, 2.5 + (i % 3), alpha * (1.0 - bubbleP * 0.6));
    }

    // 3) 바닥 잔여 독 웅덩이 페이드아웃
    ctx.save();
    ctx.fillStyle = `rgba(74, 20, 140, ${alpha * 0.60})`;
    ctx.beginPath();
    ctx.ellipse(tx, gy, 26 * (1.0 - p * 0.2), 10 * (1.0 - p * 0.2), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}
