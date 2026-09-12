// ============================================================================
// ⚠️ [기술 이펙트 제작 지침 - 256색 팔레트 최적화(Octree Optimizer) 기준]
// 1. 배틀 GIF 렌더러는 Octree Quantizer + useOptimizer (threshold: 85) 기반의
//    256색 팔레트 재사용 표준을 채택하고 있음.
// 2. 기술 제작 시 불필요한 과도한 그라디언트 난사를 지양하고, 256색 팔레트 환경에서
//    선명하게 돋보이는 핵심 고채도 단색/네온 색상 체계 및 30 FPS 규격을 기준으로 제작할 것.
// 3. 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
//    직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { drawStarburstImpact, drawMiniRetroStar } from "../common/helpers.js";

/**
 * Gen 1 Moves 085 - 088 Renderers
 *
 * 085: 10만볼트 (Thunderbolt)
 * 086: 전기자석파 (Thunder Wave)
 * 087: 번개 (Thunder)
 * 088: 돌떨구기 (Rock Throw)
 */

// ============================================================================
// 공통 번개 / 스파크 계산 헬퍼
// ============================================================================

/**
 * 지그재그 번개 줄기 생성 헬퍼
 */
function createLightningPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  segments: number = 8,
  jitter: number = 18,
  seed: number = 0
) {
  const points = [{ x: x1, y: y1 }];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return points;
  const nx = -dy / dist;
  const ny = dx / dist;

  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const bx = x1 + dx * t;
    const by = y1 + dy * t;
    const offset = Math.sin(seed + i * 2.8) * jitter * (0.4 + 0.6 * Math.sin(t * Math.PI));
    points.push({
      x: bx + nx * offset,
      y: by + ny * offset,
    });
  }

  points.push({ x: x2, y: y2 });
  return points;
}

/**
 * 다중 레이어 번개 선 그리기 (외곽 오라 -> 본체 -> 순백 코어)
 */
function strokeLightningLayers(
  ctx: any,
  points: { x: number; y: number }[],
  width: number,
  auraColor: string = "#EAB308",
  bodyColor: string = "#FDE047",
  coreColor: string = "#FFFFFF"
) {
  if (points.length < 2) return;

  // 1) 외곽 오라
  ctx.strokeStyle = auraColor;
  ctx.lineWidth = width + 3.0;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();

  // 2) 고전압 바디
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = width + 1.2;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();

  // 3) 눈부신 순백 코어
  ctx.strokeStyle = coreColor;
  ctx.lineWidth = Math.max(1.0, width * 0.5);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
}

// ============================================================================
// 085: 10만볼트 (Thunderbolt)
// ============================================================================

// ----------------------------------------------------------------------------
// 10만볼트 전용 렌더링 헬퍼
// ----------------------------------------------------------------------------

/**
 * 다중 레이어 입체 볼류메트릭 발광 뇌격 (외곽 앰버 -> 레몬 옐로우 -> 백황색 -> 순백 코어)
 * ⚠️ 마디에 원형 블룸(arc)을 그리지 않고, miter join과 butt cap을 사용하여 꺾인 부분이 완벽하게 날카롭고 각지게 표현됨.
 * ⚠️ taperStart / taperEnd를 통해 시작점과 끝점을 칼날처럼 뾰족하게 테이퍼링.
 */
function drawSharpGlowingBolt(
  ctx: any,
  points: { x: number; y: number }[],
  width: number,
  alpha: number = 1.0,
  taperStart: boolean = true,
  taperEnd: boolean = false,
  frontFade: boolean = false
) {
  const n = points.length;
  if (n < 2) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.miterLimit = 3.5;

  const p0 = points[0];
  const p1 = points[1];
  const pLast = points[n - 1];
  const pPrev = points[n - 2];

  // 시작점 테이퍼링용 법선 벡터
  const startDx = p1.x - p0.x;
  const startDy = p1.y - p0.y;
  const startLen = Math.hypot(startDx, startDy) || 1;
  const startNx = -startDy / startLen;
  const startNy = startDx / startLen;

  // 끝점 테이퍼링용 법선 벡터
  const endDx = pLast.x - pPrev.x;
  const endDy = pLast.y - pPrev.y;
  const endLen = Math.hypot(endDx, endDy) || 1;
  const endNx = -endDy / endLen;
  const endNy = endDx / endLen;

  // frontFade 활성화 시 전기가닥 앞쪽(진행방향 끝) 투명도 그라데이션 적용
  const createLayerStyle = (
    baseR: number,
    baseG: number,
    baseB: number,
    startA: number,
    midA: number,
    endA: number
  ) => {
    if (!frontFade) {
      return `rgba(${baseR}, ${baseG}, ${baseB}, ${midA})`;
    }
    const grad = ctx.createLinearGradient(p0.x, p0.y, pLast.x, pLast.y);
    grad.addColorStop(0.0, `rgba(${baseR}, ${baseG}, ${baseB}, ${startA})`);
    grad.addColorStop(0.35, `rgba(${baseR}, ${baseG}, ${baseB}, ${midA})`);
    grad.addColorStop(0.70, `rgba(${baseR}, ${baseG}, ${baseB}, ${midA * 0.65})`);
    grad.addColorStop(1.0, `rgba(${baseR}, ${baseG}, ${baseB}, ${endA})`); // 앞쪽 투명화!
    return grad;
  };

  const style1 = createLayerStyle(234, 179, 8, 0.20, 0.24, 0.02);
  const style2 = createLayerStyle(250, 204, 21, 0.45, 0.58, 0.12);
  const style3 = createLayerStyle(250, 204, 21, 0.85, 1.0, 0.25);
  const style4 = createLayerStyle(254, 249, 195, 0.85, 1.0, 0.20);
  const style5 = createLayerStyle(255, 255, 255, 0.90, 1.0, 0.30);

  // 각 레이어 그리기
  const drawLayer = (strokeColor: any, layerWidth: number) => {
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = strokeColor;
    ctx.lineWidth = layerWidth;

    // 본체 스트로크 (테이퍼링 시 시작/끝 세그먼트는 뾰족한 삼각형이 담당)
    const startIdx = taperStart ? 1 : 0;
    const endIdx = taperEnd ? n - 1 : n;

    if (startIdx < endIdx) {
      ctx.beginPath();
      ctx.moveTo(points[startIdx].x, points[startIdx].y);
      for (let i = startIdx + 1; i < endIdx; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    }

    // 1) 시작점: p0에서 너비 0으로 수렴하는 날카로운 삼각형 바늘 (네모난 컷팅 방지)
    if (taperStart) {
      const hw = layerWidth * 0.5;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y); // 날카로운 시작 정점
      ctx.lineTo(p1.x + startNx * hw, p1.y + startNy * hw);
      ctx.lineTo(p1.x - startNx * hw, p1.y - startNy * hw);
      ctx.closePath();
      ctx.fill();
    }

    // 2) 끝점: pLast에서 너비 0으로 수렴하는 날카로운 삼각형 바늘 (네모난 컷팅 방지)
    if (taperEnd) {
      const hw = layerWidth * 0.5;
      ctx.beginPath();
      ctx.moveTo(pLast.x, pLast.y); // 날카로운 끝 정점
      ctx.lineTo(pPrev.x + endNx * hw, pPrev.y + endNy * hw);
      ctx.lineTo(pPrev.x - endNx * hw, pPrev.y - endNy * hw);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Pass 1: 최외곽 소프트 앰버 투명도 글로우
  drawLayer(style1, width * 3.6);
  // Pass 2: 고전압 옐로우 미드 글로우
  drawLayer(style2, width * 2.2);
  // Pass 3: 선명한 일렉트릭 레몬 옐로우 바디
  drawLayer(style3, width * 1.3);
  // Pass 4: 따뜻한 백황색 서브 코어
  drawLayer(style4, width * 0.75);

  // Pass 5: 눈부신 순백 핫 코어 (연속 얇은 와이어 + 테이퍼링 끝점)
  const coreStartIdx = taperStart ? 1 : 0;
  const coreEndIdx = taperEnd ? n - 1 : n;
  ctx.strokeStyle = style5;
  ctx.fillStyle = style5;
  ctx.lineWidth = Math.max(1.0, width * 0.38);

  if (coreStartIdx < coreEndIdx) {
    ctx.beginPath();
    ctx.moveTo(points[coreStartIdx].x, points[coreStartIdx].y);
    for (let i = coreStartIdx + 1; i < coreEndIdx; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }

  // 코어 시작점 바늘
  if (taperStart) {
    const chw = Math.max(0.6, width * 0.19);
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x + startNx * chw, p1.y + startNy * chw);
    ctx.lineTo(p1.x - startNx * chw, p1.y - startNy * chw);
    ctx.closePath();
    ctx.fill();
  }

  // 코어 끝점 바늘
  if (taperEnd) {
    const chw = Math.max(0.6, width * 0.19);
    ctx.beginPath();
    ctx.moveTo(pLast.x, pLast.y);
    ctx.lineTo(pPrev.x + endNx * chw, pPrev.y + endNy * chw);
    ctx.lineTo(pPrev.x - endNx * chw, pPrev.y - endNy * chw);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 첨부 이미지 기준: 전격 구체 테두리에서 사방으로 뻗어나가는 지그재그 벼락 텐드릴
 * ⚠️ 끝자락이 뭉툭하지 않고 뾰족한 바늘처럼 테이퍼링되며, 끝부분으로 갈수록 투명도 페이드 적용!
 */
function drawImpactTendril(
  ctx: any,
  cx: number,
  cy: number,
  angle: number,
  innerR: number,
  outerR: number,
  seed: number
) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const perpX = -sin;
  const perpY = cos;

  const p0 = { x: cx + cos * innerR, y: cy + sin * innerR };
  const mid1Dist = innerR + (outerR - innerR) * 0.35;
  const mid2Dist = innerR + (outerR - innerR) * 0.70;
  const j1 = (Math.sin(seed * 3.7) > 0 ? 1 : -1) * (4 + Math.abs(Math.sin(seed * 2.1)) * 5);
  const j2 = -j1 * 0.8;

  const p1 = {
    x: cx + cos * mid1Dist + perpX * j1,
    y: cy + sin * mid1Dist + perpY * j1,
  };
  const p2 = {
    x: cx + cos * mid2Dist + perpX * j2,
    y: cy + sin * mid2Dist + perpY * j2,
  };
  const p3 = {
    x: cx + cos * outerR,
    y: cy + sin * outerR,
  };

  ctx.save();
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.miterLimit = 3.5;

  // 방향성 선형 그라데이션 (안쪽 고휘도 라임 -> 바깥 끝자락 100% 투명도 페이드아웃)
  const grad = ctx.createLinearGradient(p0.x, p0.y, p3.x, p3.y);
  grad.addColorStop(0.0, "rgba(204, 255, 0, 1.0)");
  grad.addColorStop(0.35, "rgba(204, 255, 0, 0.95)");
  grad.addColorStop(0.70, "rgba(204, 255, 0, 0.65)");
  grad.addColorStop(1.0, "rgba(204, 255, 0, 0.0)"); // 끝자락 완전 투명

  // 1) 안쪽 뿌리 세그먼트 p0 -> p1
  ctx.strokeStyle = grad;
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.stroke();

  // 2) 중간 세그먼트 p1 -> p2
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();

  // 3) 끝 세그먼트 p2 -> p3 : 뾰족한 바늘 삼각형으로 테이퍼링! (박스/원 제거)
  const tipDx = p3.x - p2.x;
  const tipDy = p3.y - p2.y;
  const tipLen = Math.hypot(tipDx, tipDy) || 1;
  const tnx = -tipDy / tipLen;
  const tny = tipDx / tipLen;
  const tipHalfW = 1.1;

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(p2.x + tnx * tipHalfW, p2.y + tny * tipHalfW);
  ctx.lineTo(p3.x, p3.y); // 칼날처럼 뾰족한 바깥 끝 정점!
  ctx.lineTo(p2.x - tnx * tipHalfW, p2.y - tny * tipHalfW);
  ctx.closePath();
  ctx.fill();

  // 순백 코어 (p0 -> p2, 끝자락 앞까지만 얇게)
  const coreGrad = ctx.createLinearGradient(p0.x, p0.y, p2.x, p2.y);
  coreGrad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  coreGrad.addColorStop(0.7, "rgba(255, 255, 255, 0.6)");
  coreGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");
  ctx.strokeStyle = coreGrad;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();

  // 미니 서브 브랜치 (뾰족한 1개 곁가지)
  if (Math.sin(seed * 4.2) > 0.15) {
    const bLen = (outerR - innerR) * 0.35;
    const bAng = angle + (Math.sin(seed * 2.5) > 0 ? 0.65 : -0.65);
    const bEnd = { x: p1.x + Math.cos(bAng) * bLen, y: p1.y + Math.sin(bAng) * bLen };

    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(bEnd.x, bEnd.y);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 첨부 이미지 100% 일치: 중심 고열 순백 + 외곽 라임-옐로우 그라데이션 발광 구체 & 방사 텐드릴
 */
function drawThunderboltPlasmaSphere(
  ctx: any,
  tx: number,
  ty: number,
  radius: number,
  alpha: number = 1.0,
  tendrilSeed: number = 0
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.miterLimit = 3.5;

  // 1. 대형 방사형 그라데이션 구체 (중심 순백 -> 일렉트릭 라임-옐로우 -> 외곽 투명도 페이드)
  const sphereGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, radius);
  sphereGrad.addColorStop(0.0, "#FFFFFF"); // 중심 순백 고열 코어
  sphereGrad.addColorStop(0.22, "#FEF9C3"); // 따뜻한 백황색
  sphereGrad.addColorStop(0.52, "#CCFF00"); // 선명한 일렉트릭 라임-옐로우 (첨부 이미지 색감)
  sphereGrad.addColorStop(0.78, "rgba(163, 230, 53, 0.70)"); // 라임그린-옐로우 외곽 글로우
  sphereGrad.addColorStop(1.0, "rgba(132, 204, 22, 0.0)"); // 외곽 투명화 그라데이션

  ctx.fillStyle = sphereGrad;
  ctx.beginPath();
  ctx.arc(tx, ty, radius, 0, Math.PI * 2);
  ctx.fill();

  // 2. 중심부 추가적인 고휘도 순백 블룸
  const innerBloom = ctx.createRadialGradient(tx, ty, 0, tx, ty, radius * 0.45);
  innerBloom.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  innerBloom.addColorStop(0.65, "rgba(254, 249, 195, 0.9)");
  innerBloom.addColorStop(1.0, "rgba(204, 255, 0, 0.0)");
  ctx.fillStyle = innerBloom;
  ctx.beginPath();
  ctx.arc(tx, ty, radius * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // 3. 구체 테두리에서 사방으로 뻗어나가는 날카로운 벼락 텐드릴들 (첨부 이미지 핵심)
  const numTendrils = 14;
  for (let i = 0; i < numTendrils; i++) {
    const baseAngle = (i / numTendrils) * Math.PI * 2 + Math.sin(i * 1.5 + tendrilSeed) * 0.2;
    const innerR = radius * 0.42;
    const outerR = radius * (1.20 + (i % 3) * 0.18);
    drawImpactTendril(ctx, tx, ty, baseAngle, innerR, outerR, i * 2.7 + tendrilSeed);
  }

  // 4. 구체 내부를 가로지르는 무작위 마이크로 전격 아크 4줄기
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 4; i++) {
    const a1 = i * 1.6 + tendrilSeed;
    const a2 = a1 + 1.4;
    const p1x = tx + Math.cos(a1) * (radius * 0.35);
    const p1y = ty + Math.sin(a1) * (radius * 0.35);
    const p2x = tx + Math.cos(a2) * (radius * 0.35);
    const p2y = ty + Math.sin(a2) * (radius * 0.35);
    const midX = (p1x + p2x) / 2 + (Math.sin(i * 3 + tendrilSeed) * 6);
    const midY = (p1y + p2y) / 2 + (Math.cos(i * 3 + tendrilSeed) * 6);

    ctx.beginPath();
    ctx.moveTo(p1x, p1y);
    ctx.lineTo(midX, midY);
    ctx.lineTo(p2x, p2y);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 충격파 링: 투명도가 적용된 부드러운 그라데이션 도넛(Annulus) 링
 * 안쪽도 바깥쪽도 딱딱한 단색 선이 아니라 투명도 그라데이션으로 자연스럽게 발광 페이드
 */
function drawShockwaveRing(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  thickness: number = 14,
  alpha: number = 0.55
) {
  if (radius <= 2 || alpha <= 0.01) return;
  ctx.save();

  const rIn = Math.max(1, radius - thickness * 0.5);
  const rOut = radius + thickness * 0.5;

  const ringGrad = ctx.createRadialGradient(cx, cy, rIn, cx, cy, rOut);
  ringGrad.addColorStop(0.0, "rgba(255, 255, 255, 0)"); // 안쪽 완전 투명
  ringGrad.addColorStop(0.20, `rgba(255, 255, 255, ${alpha * 0.75})`); // 은은한 순백 엣지
  ringGrad.addColorStop(0.55, `rgba(250, 204, 21, ${alpha * 0.65})`); // 따뜻한 황금빛
  ringGrad.addColorStop(0.85, `rgba(204, 255, 0, ${alpha * 0.35})`); // 라임 옐로우 외곽 글로우
  ringGrad.addColorStop(1.0, "rgba(204, 255, 0, 0)"); // 바깥쪽 완전 투명

  ctx.fillStyle = ringGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, rOut, 0, Math.PI * 2, false);
  ctx.arc(cx, cy, rIn, 0, Math.PI * 2, true); // 구멍 뚫기
  ctx.fill();

  ctx.restore();
}

/**
 * 방사형 뇌격 스파이크 가닥:
 * 12방향 지그재그 전격으로, 안쪽은 두껍고 선명하다가 바깥쪽으로 갈수록 바늘처럼 뾰족해지며
 * 투명도 그라데이션으로 자연스럽게 소멸 페이드아웃 (#9번 프레임 전용)
 */
function drawRadiatingTaperedStrands(
  ctx: any,
  cx: number,
  cy: number,
  numStrands: number = 12,
  innerRadius: number = 24,
  outerRadius: number = 72,
  seedOffset: number = 0,
  overallAlpha: number = 0.85
) {
  ctx.save();
  ctx.globalAlpha = overallAlpha;
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.miterLimit = 3.5;

  for (let i = 0; i < numStrands; i++) {
    const angle = (i / numStrands) * Math.PI * 2 + seedOffset * 0.15;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const perpX = -sin;
    const perpY = cos;

    const curOuterR = outerRadius * (0.88 + (i % 3) * 0.12);
    const p0 = { x: cx + cos * innerRadius, y: cy + sin * innerRadius };
    const r1 = innerRadius + (curOuterR - innerRadius) * 0.35;
    const r2 = innerRadius + (curOuterR - innerRadius) * 0.70;

    const j1 = ((i % 2 === 0 ? 1 : -1) * 6);
    const j2 = -j1 * 0.7;

    const p1 = { x: cx + cos * r1 + perpX * j1, y: cy + sin * r1 + perpY * j1 };
    const p2 = { x: cx + cos * r2 + perpX * j2, y: cy + sin * r2 + perpY * j2 };
    const p3 = { x: cx + cos * curOuterR, y: cy + sin * curOuterR }; // 바깥 끝점!

    // 바깥쪽으로 갈수록 투명해지는 선형 그라데이션
    const grad = ctx.createLinearGradient(p0.x, p0.y, p3.x, p3.y);
    grad.addColorStop(0.0, "rgba(255, 255, 255, 0.95)");
    grad.addColorStop(0.25, "rgba(254, 240, 138, 0.85)");
    grad.addColorStop(0.65, "rgba(204, 255, 0, 0.55)");
    grad.addColorStop(1.0, "rgba(204, 255, 0, 0.0)"); // 끝자락 0% 투명!

    // 안쪽 세그먼트 p0 -> p1
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();

    // 중간 세그먼트 p1 -> p2
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // 바깥 끝 세그먼트 p2 -> p3 : 뾰족한 바늘 테이퍼링 폴리곤!
    const dx = p3.x - p2.x;
    const dy = p3.y - p2.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const hw = 1.0;

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(p2.x + nx * hw, p2.y + ny * hw);
    ctx.lineTo(p3.x, p3.y); // 칼날처럼 뾰족한 바깥쪽 끝 정점!
    ctx.lineTo(p2.x - nx * hw, p2.y - ny * hw);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 비산하는 미세 전격 스파클 엠버:
 * 딱딱하고 네모난 사각형(fillRect) 대신, 각진 2마디 마이크로 지그재그 아크 및 날카로운 십자 다이아몬드 스파크로 렌더링.
 */
function drawElectricSparkEmbers(
  ctx: any,
  cx: number,
  cy: number,
  count: number,
  distanceBase: number,
  progress: number,
  seedOffset: number = 0,
  alpha: number = 1.0
) {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.miterLimit = 3.5;

  for (let i = 0; i < count; i++) {
    const angle = i * 1.37 + seedOffset + progress * 2.5;
    const dist = distanceBase + progress * 35 + (i % 4) * 9;
    const sx = cx + Math.cos(angle) * dist;
    const sy = cy + Math.sin(angle) * dist;

    const isWhite = (i % 2 === 0);
    const color = isWhite ? "#FFFFFF" : "#CCFF00";

    if (i % 3 === 0) {
      // 1) 2마디 마이크로 전격 지그재그 아크 (길이 5~7px)
      const arcLen = 5 + (i % 3);
      const radAng = angle;
      const perpAng = angle + Math.PI * 0.5;
      const m1x = sx - Math.cos(radAng) * (arcLen * 0.5);
      const m1y = sy - Math.sin(radAng) * (arcLen * 0.5);
      const midX = sx + Math.cos(perpAng) * 2;
      const midY = sy + Math.sin(perpAng) * 2;
      const m2x = sx + Math.cos(radAng) * (arcLen * 0.5);
      const m2y = sy + Math.sin(radAng) * (arcLen * 0.5);

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(m1x, m1y);
      ctx.lineTo(midX, midY);
      ctx.lineTo(m2x, m2y);
      ctx.stroke();
    } else {
      // 2) 날카로운 십자 다이아몬드 미니 스타 스파크 (길이 4px)
      const starR = 2.4;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(sx, sy - starR);
      ctx.lineTo(sx + 0.6, sy);
      ctx.lineTo(sx + starR, sy);
      ctx.lineTo(sx + 0.6, sy);
      ctx.lineTo(sx, sy + starR);
      ctx.lineTo(sx - 0.6, sy);
      ctx.lineTo(sx - starR, sy);
      ctx.lineTo(sx - 0.6, sy);
      ctx.closePath();
      ctx.fill();

      // 중심부 초미세 순백 발광
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(sx - 0.5, sy - 0.5, 1, 1);
    }
  }

  ctx.restore();
}

// ============================================================================
// 085: 10만볼트 (Thunderbolt) 메인 이펙트 렌더러
// ============================================================================

export function drawThunderboltEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0.5,
  isPlayer: boolean = true
) {
  ctx.save();
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.miterLimit = 3.5;

  const startX = attackerPos.x + (isPlayer ? 10 : -10);
  const startY = attackerPos.y - 12;
  const targetX = targetPos.x;
  const targetY = targetPos.y - 6;

  // --------------------------------------------------------------------------
  // 1. 전체 화면 암전 및 노란빛 대전환 & 페이드아웃 오버레이
  // --------------------------------------------------------------------------
  if (moveStep === 1) {
    // Step 1: 시전 준비 & 전장 짙은 암전 (68%)
    ctx.save();
    ctx.fillStyle = "rgba(4, 6, 14, 0.68)";
    ctx.fillRect(-5000, -5000, 12000, 12000);
    ctx.restore();
  } else if (moveStep === 2 || moveStep === 3) {
    // Step 2 & 3: 전기 가닥 고속 발사 & 쇄도 중 짙은 암전 (74%)
    ctx.save();
    ctx.fillStyle = "rgba(4, 6, 14, 0.74)";
    ctx.fillRect(-5000, -5000, 12000, 12000);
    ctx.restore();
  } else if (moveStep === 4) {
    // Step 4: [유저 핵심 요구사항] 타격 순간! 검은 암전이 눈부신 황금빛 노란 조명으로 극적 대전환!
    ctx.save();
    ctx.fillStyle = "rgba(250, 204, 21, 0.42)"; // 찬란한 노란빛 필터
    ctx.fillRect(-5000, -5000, 12000, 12000);
    ctx.restore();
  } else if (moveStep === 5) {
    // Step 5: 노란빛 조명의 부드러운 1차 페이드아웃 (24%)
    ctx.save();
    ctx.fillStyle = "rgba(234, 179, 8, 0.24)";
    ctx.fillRect(-5000, -5000, 12000, 12000);
    ctx.restore();
  } else if (moveStep === 6) {
    // Step 6: 잔류 노란빛 2차 페이드아웃 (8%)
    ctx.save();
    ctx.fillStyle = "rgba(234, 179, 8, 0.08)";
    ctx.fillRect(-5000, -5000, 12000, 12000);
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 2. 스텝별 애니메이션 그래픽
  // --------------------------------------------------------------------------

  // Step 1: 암전 속 시전자 몸체 주변 고압 전력 응축 & 스파크 충전
  if (moveStep === 1) {
    const p = effectProgress;

    // 시전자 중심 플라즈마 응축구 (그라데이션 발광)
    const coreGrad = ctx.createRadialGradient(startX, startY, 0, startX, startY, 16 + p * 8);
    coreGrad.addColorStop(0.0, "#FFFFFF");
    coreGrad.addColorStop(0.30, "#FEF9C3");
    coreGrad.addColorStop(0.65, "#CCFF00");
    coreGrad.addColorStop(1.0, "rgba(204, 255, 0, 0)");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(startX, startY, 16 + p * 8, 0, Math.PI * 2);
    ctx.fill();

    // 8방향 뻗어나오는 날카로운 고압 전격 스파크 (시작점/끝점 모두 뾰족한 바늘 + 끝자락 투명도, 네모난 컷팅 제거)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + p * 6.0;
      const r = 18 + (i % 3) * 12;
      const x1 = startX + Math.cos(a) * 6;
      const y1 = startY + Math.sin(a) * 6;
      const x2 = startX + Math.cos(a) * r;
      const y2 = startY + Math.sin(a) * r;

      const pts = createLightningPoints(x1, y1, x2, y2, 4, 10, i * 1.7);
      drawSharpGlowingBolt(ctx, pts, 2.0, 1.0, true, true, true);
    }
  }

  // Step 2: [유저 요구사항: 발사되는 느낌] 전기 가닥이 시전자로부터 뿜어져 나와 날아가는 중 (0% -> 50% 도달)
  // ⚠️ 앞쪽에 둥근 구체를 그리지 않음! 시작점과 끝점이 바늘처럼 뾰족하게 테이퍼링된 번개 줄기
  else if (moveStep === 2) {
    const p = effectProgress;
    const reach = 0.45 + p * 0.12; // 전장 절반까지 고속 돌파
    const headX = startX + (targetX - startX) * reach;
    const headY = startY + (targetY - startY) * reach;

    // 4중 대전류 볼트 줄기 (시작점 날카로움 taperStart: true, 끝점 날카로움 taperEnd: true)
    const bolts = [
      { sx: startX, sy: startY, tx: headX, ty: headY, jitter: 18, seed: 1.2, w: 5.2 },
      { sx: startX, sy: startY - 8, tx: headX - 10, ty: headY + 8, jitter: 24, seed: 3.5, w: 3.6 },
      { sx: startX, sy: startY + 8, tx: headX + 6, ty: headY - 12, jitter: 22, seed: 5.8, w: 3.2 },
      { sx: startX - 4, sy: startY, tx: headX - 16, ty: headY - 6, jitter: 28, seed: 8.4, w: 2.6 },
    ];

    for (const b of bolts) {
      const pts = createLightningPoints(b.sx, b.sy, b.tx, b.ty, 7, b.jitter, b.seed);
      drawSharpGlowingBolt(ctx, pts, b.w, 1.0, true, true, true); // frontFade: true (앞쪽 투명도 그라데이션)
    }

    // 선두 전진 관통 헤드: ⚠️ [유저 요구사항: 앞쪽만 좀 투명하게] 불투명 흰색 대신 은은한 투명도 그라데이션 적용
    const angle = Math.atan2(targetY - startY, targetX - startX);
    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate(angle);

    // 날카로운 전격 관통 헤드 (앞쪽으로 갈수록 투명해지는 선형 그라데이션)
    const headGrad = ctx.createLinearGradient(-8, 0, 14, 0);
    headGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.65)");
    headGrad.addColorStop(0.4, "rgba(254, 249, 195, 0.45)");
    headGrad.addColorStop(0.75, "rgba(204, 255, 0, 0.20)");
    headGrad.addColorStop(1.0, "rgba(204, 255, 0, 0.0)"); // 앞쪽 끝 정점 완전 투명 페이드

    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();

    // 헤드 전방 3줄기 미세 스파크 바늘 (끝자락으로 갈수록 투명화)
    for (let k = -1; k <= 1; k++) {
      const needleGrad = ctx.createLinearGradient(6, 0, 18, k * 6);
      needleGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.60)");
      needleGrad.addColorStop(0.5, "rgba(204, 255, 0, 0.30)");
      needleGrad.addColorStop(1.0, "rgba(204, 255, 0, 0.0)"); // 앞쪽 끝부분 완전 투명
      ctx.strokeStyle = needleGrad;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(18, k * 6);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Step 3: [유저 요구사항: 발사되는 느낌] 전광석화 쇄도 & 표적 직전 완전 도달 (50% -> 100% 관통 격돌)
  // ⚠️ 착탄하기 전에 목표 지점에 둥근 구체를 띄우지 않음!
  else if (moveStep === 3) {
    const p = effectProgress;

    // 표적 직격 4중 메인 벼락 줄기 (시작점/끝점 모두 뾰족한 테이퍼링, 각진 꺾임)
    const bolts = [
      { sx: startX, sy: startY, tx: targetX, ty: targetY, jitter: 24, seed: 2.3, w: 5.6 },
      { sx: startX, sy: startY - 8, tx: targetX - 10, ty: targetY + 12, jitter: 28, seed: 4.6, w: 3.8 },
      { sx: startX, sy: startY + 8, tx: targetX + 12, ty: targetY - 14, jitter: 26, seed: 7.1, w: 3.4 },
      { sx: startX - 4, sy: startY, tx: targetX - 14, ty: targetY - 10, jitter: 32, seed: 9.5, w: 2.8 },
    ];

    for (const b of bolts) {
      const pts = createLightningPoints(b.sx, b.sy, b.tx, b.ty, 9, b.jitter, b.seed);
      drawSharpGlowingBolt(ctx, pts, b.w, 1.0, true, true);
    }

    // 착탄점 예비 번개 스파크 (구체 없이 날카로운 지그재그 스파크만)
    for (let i = 0; i < 4; i++) {
      const spAng = i * 1.57 + 0.4;
      const spLen = 14 + (i % 2) * 8;
      const pts = createLightningPoints(targetX, targetY, targetX + Math.cos(spAng) * spLen, targetY + Math.sin(spAng) * spLen, 3, 5, i * 2.1);
      drawSharpGlowingBolt(ctx, pts, 1.8, 0.9, true, true);
    }
  }

  // Step 4: [유저 핵심 요구사항: 첨부 이미지 완벽 구현 타격 이펙트 & 노란빛 대전환]
  else if (moveStep === 4) {
    const p = effectProgress;

    // 시전자에서 표적으로 이어지는 연결 잔류 뇌격 2줄기
    const hitBolts = [
      { sx: startX, sy: startY, tx: targetX, ty: targetY, jitter: 18, seed: 3.1, w: 4.2 },
      { sx: startX, sy: startY - 6, tx: targetX, ty: targetY, jitter: 22, seed: 6.4, w: 2.8 },
    ];
    for (const b of hitBolts) {
      const pts = createLightningPoints(b.sx, b.sy, b.tx, b.ty, 8, b.jitter, b.seed);
      drawSharpGlowingBolt(ctx, pts, b.w, 0.85, true, true);
    }

    // 첨부 이미지 기준: 중심 고열 순백 + 외곽 라임-옐로우 발광 구체 & 끝이 바늘처럼 뾰족한 14방향 텐드릴
    drawThunderboltPlasmaSphere(ctx, targetX, targetY, 38, 1.0, 1.0);

    // 충격파 링: 투명도가 적용된 부드러운 도넛 그라데이션 링 (딱딱한 선 X)
    const ringR = 44 + p * 16;
    drawShockwaveRing(ctx, targetX, targetY, ringR, 14, 0.65 - p * 0.25);
  }

  // Step 5: 방전 확장 & 대형화 & 노란빛 조명 1차 페이드아웃 (#9번 프레임)
  // ⚠️ 유저 요구사항: 번개가닥 바깥쪽이 뾰족하고, 바깥쪽으로 갈수록 투명도 그라데이션 적용!
  else if (moveStep === 5) {
    const p = effectProgress;

    // 더욱 팽창한 전격 플라즈마 구체 & 격렬해진 텐드릴
    drawThunderboltPlasmaSphere(ctx, targetX, targetY, 44, 0.85, 3.8);

    // 12방향 지그재그 뇌격 스파이크 (바깥쪽이 뾰족하고 투명도 그라데이션 적용)
    const blastR = 54 + p * 24;
    drawRadiatingTaperedStrands(ctx, targetX, targetY, 12, 22, blastR, p * 1.5, 0.88);

    // 몸체 전신을 감싸는 전격 루프 2개 (부드러운 타원 글로우)
    for (let ring = 0; ring < 2; ring++) {
      ctx.save();
      ctx.translate(targetX, targetY);
      ctx.rotate((ring === 0 ? 0.35 : -0.35) + p * 0.4);
      ctx.strokeStyle = "rgba(204, 255, 0, 0.70)";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.ellipse(0, 0, 32, 18, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Step 6: 뇌격 스파크 폭발 비산 & 노란빛 조명 2차 페이드아웃 (#10번 프레임)
  // ⚠️ 유저 요구사항: 튀는 점을 네모난 사각형(fillRect) 대신, 각진 마이크로 지그재그와 다이아몬드 스파크로 개선!
  else if (moveStep === 6) {
    const p = effectProgress;
    const alpha = Math.max(0.0, 1.0 - p * 0.8);

    // 중심 잔류 구체 소멸
    drawThunderboltPlasmaSphere(ctx, targetX, targetY, 28 * (1.0 - p * 0.5), alpha * 0.6, 6.2);

    // 사방으로 비산하는 18개의 섬세한 전기 스파클 엠버 (마이크로 지그재그 + 다이아몬드 스타)
    drawElectricSparkEmbers(ctx, targetX, targetY, 18, 26, p, 2.0, alpha);
  }

  // Step 7: 잔류 전격 냉각 및 완전 복귀 (정상 전장 조명)
  else if (moveStep === 7) {
    const p = effectProgress;
    const alpha = Math.max(0.0, 1.0 - p);

    // 잔여 미세 스파클 엠버 냉각
    drawElectricSparkEmbers(ctx, targetX, targetY, 8, 16, p, 5.0, alpha * 0.85);
  }

  ctx.restore();
}

// ============================================================================
// 086: 전기자석파 (Thunder Wave)
// ============================================================================

/**
 * 밖으로 퍼지는 노란 링 (완전한 기하학적 원형 + 전자기 진동 + 크기에 따른 투명화):
 * 유저 요구사항 100% 반영:
 * 1) "원으로 해다오.. 흔들거림은 진동을 의미하는것이었다.."
 *    - 외곽/내곽 모두 완벽하고 매끄러운 기하학적 원형(Circle: ctx.arc)으로 구현
 *    - 흔들거림은 찌그러진 왜곡이 아닌 고주파 전자기 진동(Jitter / Electric Tremor)으로 표현
 * 2) "원이 커지면서 투명화되고"
 *    - 안쪽은 반투명(alpha * 0.70), 바깥쪽은 100% 완전 투명(alpha 0.0) 도넛 링
 *    - 원이 밖으로 팽창할수록 링 자체의 alpha가 0에 가깝게 자연스럽게 페이드아웃
 */
function drawThunderWaveAnnulusRing(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  thickness: number,
  alpha: number,
  jitterAmp: number = 0,
  jitterPhase: number = 0
) {
  if (radius <= 2 || alpha <= 0.01) return;
  ctx.save();

  // 고주파 전자기 진동 오프셋 (완전한 원형을 유지한 채 중심점과 크기가 미세하게 고속 진동)
  const jX = jitterAmp > 0 ? (Math.sin(jitterPhase * 17.3) * 0.7 + Math.cos(jitterPhase * 31.7) * 0.3) * jitterAmp : 0;
  const jY = jitterAmp > 0 ? (Math.cos(jitterPhase * 19.1) * 0.7 + Math.sin(jitterPhase * 29.3) * 0.3) * jitterAmp : 0;
  const jR = jitterAmp > 0 ? Math.sin(jitterPhase * 23.9) * (jitterAmp * 0.35) : 0;

  const rcx = cx + jX;
  const rcy = cy + jY;
  const r = Math.max(2, radius + jR);

  const rIn = Math.max(1, r - thickness * 0.45);
  const rOut = r + thickness * 0.55;

  const ringGrad = ctx.createRadialGradient(rcx, rcy, rIn, rcx, rcy, rOut);
  // 안쪽 림: 반투명 순백 -> 따뜻한 레몬 옐로우 코어
  ringGrad.addColorStop(0.0, `rgba(255, 255, 255, ${alpha * 0.70})`);
  ringGrad.addColorStop(0.20, `rgba(254, 240, 138, ${alpha * 0.70})`);
  ringGrad.addColorStop(0.55, `rgba(250, 204, 21, ${alpha * 0.45})`);
  ringGrad.addColorStop(0.85, `rgba(204, 255, 0, ${alpha * 0.15})`);
  // 바깥쪽 림: 100% 완전 투명!
  ringGrad.addColorStop(1.0, "rgba(204, 255, 0, 0.0)");

  ctx.fillStyle = ringGrad;
  ctx.beginPath();
  // 완벽한 원형 링 (시계방향 외경 + 반시계방향 내경으로 도넛 구멍 파내기)
  ctx.arc(rcx, rcy, rOut, 0, Math.PI * 2, false);
  ctx.arc(rcx, rcy, rIn, 0, Math.PI * 2, true);
  ctx.fill();

  // 안쪽 림의 또렷한 반투명 테두리 원
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.48})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(rcx, rcy, rIn + 0.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * 원을 따라가는 곡선들 (바깥쪽이 뾰족한 형태):
 * 유저 요구사항 100% 반영: "원을 따라가는 곡선들 바깥쪽이 뾰족한 형태여야"
 * - 원 둘레를 따라 회전하는 전자기 궤도 곡선
 * - 뭉툭한 선이 아닌 바깥쪽 끝자락(Outer Tip)으로 갈수록 칼날처럼 두께가 0으로 수렴
 * - 바깥쪽 끝이 원 외곽을 향해 약간 뻗어나가며 날카로운 바늘 스파크 침 장착
 */
function drawThunderWavePointedArc(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  sAng: number,
  length: number,
  maxWidth: number,
  alpha: number,
  outwardOffset: number = 2.0,
  jitterAmp: number = 0,
  jitterPhase: number = 0
) {
  if (radius <= 2 || alpha <= 0.01) return;
  ctx.save();

  // 링과 동일한 전자기 진동 적용
  const jX = jitterAmp > 0 ? (Math.sin(jitterPhase * 17.3) * 0.7 + Math.cos(jitterPhase * 31.7) * 0.3) * jitterAmp : 0;
  const jY = jitterAmp > 0 ? (Math.cos(jitterPhase * 19.1) * 0.7 + Math.sin(jitterPhase * 29.3) * 0.3) * jitterAmp : 0;
  const jR = jitterAmp > 0 ? Math.sin(jitterPhase * 23.9) * (jitterAmp * 0.35) : 0;

  const rcx = cx + jX;
  const rcy = cy + jY;
  const r = Math.max(2, radius + jR);

  const numSteps = 24;
  const dAng = length / numSteps;

  // 3개 레이어: 외곽 글로우 -> 레몬 옐로우 바디 -> 순백 코어
  const layers = [
    { wMult: 1.5, color: `rgba(250, 204, 21, ${alpha * 0.55})` },
    { wMult: 1.0, color: `rgba(254, 240, 138, ${alpha * 0.85})` },
    { wMult: 0.45, color: `rgba(255, 255, 255, ${alpha * 0.95})` },
  ];

  for (const layer of layers) {
    const W = maxWidth * layer.wMult;
    ctx.fillStyle = layer.color;
    ctx.beginPath();

    // 1) 바깥쪽 둘레선 (t: 0 -> 1)
    for (let i = 0; i <= numSteps; i++) {
      const t = i / numSteps;
      const ang = sAng + i * dAng;
      // 바깥쪽(t=1)으로 갈수록 두께가 날카롭게 0으로 수렴하는 테이퍼링 프로파일
      // t=0(시작점): 얇음 -> t=0.28: 최대 두께 -> t=1.0(바깥쪽 끝): 완전한 0 (바늘처럼 뾰족함)
      const profile = Math.sin(t * Math.PI) * (1.1 - t * 0.35);
      const w = W * profile;
      // 바깥쪽 끝(t -> 1)이 살짝 원 바깥쪽으로 향함 (outwardOffset)
      const rOut = r + t * outwardOffset + w * 0.55;
      const x = rcx + Math.cos(ang) * rOut;
      const y = rcy + Math.sin(ang) * rOut;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    // 2) 안쪽 둘레선 (t: 1 -> 0)
    for (let i = numSteps; i >= 0; i--) {
      const t = i / numSteps;
      const ang = sAng + i * dAng;
      const profile = Math.sin(t * Math.PI) * (1.1 - t * 0.35);
      const w = W * profile;
      const rIn = r + t * outwardOffset - w * 0.45;
      const x = rcx + Math.cos(ang) * rIn;
      const y = rcy + Math.sin(ang) * rIn;
      ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fill();
  }

  // 바깥쪽 뾰족한 끝(tip)에서 방사형/접선 방향으로 뻗어나가는 날카로운 바늘 스파크 침
  const tipAng = sAng + length;
  const tipR = r + outwardOffset;
  const tipX = rcx + Math.cos(tipAng) * tipR;
  const tipY = rcy + Math.sin(tipAng) * tipR;
  const tanX = -Math.sin(tipAng);
  const tanY = Math.cos(tipAng);
  const radX = Math.cos(tipAng);
  const radY = Math.sin(tipAng);

  const spikeDirX = tanX * 0.75 + radX * 0.45;
  const spikeDirY = tanY * 0.75 + radY * 0.45;

  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX + spikeDirX * 4.2, tipY + spikeDirY * 4.2);
  ctx.stroke();

  ctx.restore();
}

/**
 * 원을 따라가는 바깥쪽 뾰족한 곡선들 일괄 렌더링 헬퍼
 */
function drawThunderWavePointedArcs(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  arcs: { startAngle: number; length: number; width?: number; alpha?: number }[],
  outwardOffset: number = 2.0,
  jitterAmp: number = 0,
  jitterPhase: number = 0
) {
  for (const arc of arcs) {
    const w = arc.width ?? 2.4;
    const a = arc.alpha ?? 1.0;
    drawThunderWavePointedArc(ctx, cx, cy, radius, arc.startAngle, arc.length, w, a, outwardOffset, jitterAmp, jitterPhase);
  }
}

export function drawThunderWaveEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0.5,
  isPlayer: boolean = true
) {
  ctx.save();
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.miterLimit = 3.5;

  const targetX = targetPos.x;
  const targetY = targetPos.y - 6;

  // --------------------------------------------------------------------------
  // 1. 전체 화면 암전 (Blackout) - 유저 요구사항: "노란 빛전환 할 필요 없어"
  // 전장이 짙은 어둠에 휩싸인 채 흔들리는 노란 링이 퍼지고, 후반부에 자연스럽게 페이드아웃
  // --------------------------------------------------------------------------
  if (moveStep === 1) {
    // Step 1: 시전 준비 & 전장 짙은 암전 (68%)
    ctx.save();
    ctx.fillStyle = "rgba(4, 6, 14, 0.68)";
    ctx.fillRect(-5000, -5000, 12000, 12000);
    ctx.restore();
  } else if (moveStep === 2 || moveStep === 3) {
    // Step 2 & 3: 적 중심 다중 링 팽창 & 궤도 곡선 쇄도 중 짙은 암전 (74%)
    ctx.save();
    ctx.fillStyle = "rgba(4, 6, 14, 0.74)";
    ctx.fillRect(-5000, -5000, 12000, 12000);
    ctx.restore();
  } else if (moveStep === 4) {
    // Step 4: 최대 팽창 방전 단계 - 노란빛 전환 없이 암전 유지 및 서서히 감소 (58%)
    ctx.save();
    ctx.fillStyle = "rgba(4, 6, 14, 0.58)";
    ctx.fillRect(-5000, -5000, 12000, 12000);
    ctx.restore();
  } else if (moveStep === 5) {
    // Step 5: 암전 1차 부드러운 페이드아웃 (30%)
    ctx.save();
    ctx.fillStyle = "rgba(4, 6, 14, 0.30)";
    ctx.fillRect(-5000, -5000, 12000, 12000);
    ctx.restore();
  } else if (moveStep === 6) {
    // Step 6: 암전 2차 페이드아웃 (10%)
    ctx.save();
    ctx.fillStyle = "rgba(4, 6, 14, 0.10)";
    ctx.fillRect(-5000, -5000, 12000, 12000);
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 2. 스텝별 애니메이션 (적 중심 완전한 원형 노란 링 + 바깥쪽이 뾰족한 곡선들)
  // 유저 요청: "원으로 해다오.. 흔들거림은 진동을 의미하는것이었다.. 그리고 원을 따라가는 곡선들 바깥쪽이 뾰족한 형태여야"
  // --------------------------------------------------------------------------

  // Step 1: 암전 속 적 스프라이트 중심 전자기 코어 응축 & 초기 원형 링 태동
  if (moveStep === 1) {
    const p = effectProgress;

    // 적 중심부 은은한 전자기 발광 핵
    const coreGrad = ctx.createRadialGradient(targetX, targetY, 0, targetX, targetY, 16 + p * 8);
    coreGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.95)");
    coreGrad.addColorStop(0.35, "rgba(254, 240, 138, 0.80)");
    coreGrad.addColorStop(0.70, "rgba(250, 204, 21, 0.45)");
    coreGrad.addColorStop(1.0, "rgba(204, 255, 0, 0.0)");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(targetX, targetY, 16 + p * 8, 0, Math.PI * 2);
    ctx.fill();

    // 시작을 알리는 1차 완전한 원형 노란 링 (태동 & 미세 진동)
    const r1 = 12 + p * 14;
    const jitAmp1 = 1.2;
    const jitPhase1 = p * 10.0;
    drawThunderWaveAnnulusRing(ctx, targetX, targetY, r1, 10, 0.80, jitAmp1, jitPhase1);

    // 원을 따라가는 바깥쪽이 뾰족한 2개의 곡선
    drawThunderWavePointedArcs(
      ctx,
      targetX,
      targetY,
      r1,
      [
        { startAngle: p * 4.0, length: 1.1, width: 2.4, alpha: 0.85 },
        { startAngle: p * 4.0 + Math.PI, length: 1.1, width: 2.4, alpha: 0.85 },
      ],
      1.5,
      jitAmp1,
      jitPhase1
    );
  }

  // Step 2: [유저 핵심 요구사항] 적 스프라이트 중심 밖으로 퍼지는 3겹의 완전한 원형 링
  // 커지면서 투명화되고, 고속 전자기 진동을 일으키며, 바깥쪽이 뾰족한 곡선들 장착
  else if (moveStep === 2) {
    const p = effectProgress;

    // 밖으로 퍼져나가는 3겹의 완전한 원형 노란 링 (커지면서 투명화 + 진동)
    const rings = [
      { r: 22 + p * 26, w: 12, alpha: 0.64, jit: 2.2, phase: p * 12.0 },
      { r: 12 + p * 18, w: 10, alpha: 0.76, jit: 1.6, phase: p * 12.0 + 2.0 },
      { r: 4 + p * 12, w: 8, alpha: 0.88, jit: 1.2, phase: p * 12.0 + 4.0 },
    ];

    for (let i = 0; i < rings.length; i++) {
      const ring = rings[i];
      drawThunderWaveAnnulusRing(ctx, targetX, targetY, ring.r, ring.w, ring.alpha, ring.jit, ring.phase);

      // 각 링의 둘레를 따라 돌며 바깥쪽이 뾰족한 곡선들 (회전 속도 및 위상차)
      const rot = (i % 2 === 0 ? 1 : -1) * (p * 3.5 + i * 1.8);
      const arcLen = 0.95 + (i % 2) * 0.35;
      drawThunderWavePointedArcs(
        ctx,
        targetX,
        targetY,
        ring.r,
        [
          { startAngle: rot, length: arcLen, width: 2.4, alpha: ring.alpha * 0.95 },
          { startAngle: rot + Math.PI, length: arcLen, width: 2.4, alpha: ring.alpha * 0.95 },
        ],
        1.8,
        ring.jit,
        ring.phase
      );
    }
  }

  // Step 3: 4겹 원형 링 고속 팽창 (크게 커지며 더욱 투명화 + 고주파 진동 + 바깥쪽 뾰족한 곡선 쇄도)
  else if (moveStep === 3) {
    const p = effectProgress;

    // 크게 밖으로 퍼져나가는 4겹의 원형 링 (외곽으로 갈수록 투명화가 심화되며 진동 폭 증가)
    const rings = [
      { r: 52 + p * 32, w: 16, alpha: 0.22 * (1.0 - p * 0.3), jit: 3.0, phase: p * 15.0 },
      { r: 33 + p * 26, w: 14, alpha: 0.44 * (1.0 - p * 0.25), jit: 2.4, phase: p * 15.0 + 2.0 },
      { r: 18 + p * 20, w: 12, alpha: 0.66, jit: 1.8, phase: p * 15.0 + 4.0 },
      { r: 7 + p * 15, w: 10, alpha: 0.82, jit: 1.4, phase: p * 15.0 + 6.0 },
    ];

    for (let i = 0; i < rings.length; i++) {
      const ring = rings[i];
      drawThunderWaveAnnulusRing(ctx, targetX, targetY, ring.r, ring.w, ring.alpha, ring.jit, ring.phase);

      // 원을 따라가는 바깥쪽이 뾰족한 곡선들 (3방향 120도 배치)
      const rot = (i % 2 === 0 ? 1 : -1) * (p * 4.2 + i * 1.5);
      const arcLen = 1.0 + (i % 3) * 0.3;
      drawThunderWavePointedArcs(
        ctx,
        targetX,
        targetY,
        ring.r,
        [
          { startAngle: rot, length: arcLen, width: 2.5, alpha: ring.alpha },
          { startAngle: rot + (Math.PI * 2) / 3, length: arcLen * 0.85, width: 2.0, alpha: ring.alpha * 0.85 },
          { startAngle: rot + (Math.PI * 4) / 3, length: arcLen * 0.85, width: 2.0, alpha: ring.alpha * 0.85 },
        ],
        2.2,
        ring.jit,
        ring.phase
      );
    }
  }

  // Step 4: 최대 팽창 방전 (화면 외곽까지 퍼지며 극대 투명화 & 전자기 진동 & 날카로운 뾰족 곡선)
  else if (moveStep === 4) {
    const p = effectProgress;

    // 전장 외곽으로 광활하게 퍼져나가는 4겹의 거대 원형 링
    const rings = [
      { r: 84 + p * 34, w: 18, alpha: 0.08 * (1.0 - p * 0.5), jit: 3.5, phase: p * 18.0 },
      { r: 60 + p * 28, w: 15, alpha: 0.20 * (1.0 - p * 0.4), jit: 2.8, phase: p * 18.0 + 2.0 },
      { r: 38 + p * 22, w: 13, alpha: 0.38 * (1.0 - p * 0.3), jit: 2.2, phase: p * 18.0 + 4.0 },
      { r: 19 + p * 17, w: 10, alpha: 0.58 * (1.0 - p * 0.2), jit: 1.6, phase: p * 18.0 + 6.0 },
    ];

    for (let i = 0; i < rings.length; i++) {
      const ring = rings[i];
      drawThunderWaveAnnulusRing(ctx, targetX, targetY, ring.r, ring.w, ring.alpha, ring.jit, ring.phase);

      // 궤도를 도는 날카로운 바깥쪽 뾰족 곡선들
      const rot = (i % 2 === 0 ? 1 : -1) * (p * 5.0 + i * 2.0);
      drawThunderWavePointedArcs(
        ctx,
        targetX,
        targetY,
        ring.r,
        [
          { startAngle: rot, length: 1.3, width: 2.5, alpha: ring.alpha },
          { startAngle: rot + Math.PI, length: 1.3, width: 2.5, alpha: ring.alpha },
        ],
        2.5,
        ring.jit,
        ring.phase
      );
    }
  }

  // Step 5: 최외곽 잔여 링 소멸 투명화 & 마비 상태이상 각인 & 정전기 엠버 비산
  else if (moveStep === 5) {
    const p = effectProgress;

    // 최외곽으로 사라져가는 마지막 잔류 링 (초고투명화 & 미세 진동)
    const rOuter = 112 + p * 22;
    const aOuter = Math.max(0.0, 0.06 * (1.0 - p));
    drawThunderWaveAnnulusRing(ctx, targetX, targetY, rOuter, 18, aOuter, 3.0, p * 20.0);

    const rMid = 78 + p * 18;
    const aMid = Math.max(0.0, 0.14 * (1.0 - p));
    drawThunderWaveAnnulusRing(ctx, targetX, targetY, rMid, 14, aMid, 2.2, p * 20.0 + 2.5);

    // 마비(Paralysis)를 나타내는 섬세한 다이아몬드 스타 및 전자기 스파클 엠버
    drawElectricSparkEmbers(ctx, targetX, targetY, 12, 20, p, 3.0, (1.0 - p * 0.6) * 0.85);

    // 대상 머리/몸체 주변 찌릿찌릿 마비 번개 기호
    drawMiniRetroStar(ctx, targetX, targetY - 24, 10, "#FDE047");
    drawMiniRetroStar(ctx, targetX - 16, targetY + 6, 7, "#FEF08A");
    drawMiniRetroStar(ctx, targetX + 16, targetY + 6, 7, "#FDE047");
  }

  // Step 6 & 7: 마비 정전기 잔류 및 완전 복귀 (정상 조명)
  else if (moveStep === 6 || moveStep === 7) {
    const p = moveStep === 6 ? effectProgress * 0.5 : 0.5 + effectProgress * 0.5;
    const alpha = Math.max(0.0, 1.0 - p);

    // 잔류 미세 스파클 엠버 냉각
    drawElectricSparkEmbers(ctx, targetX, targetY, 6, 16, p, 5.0, alpha * 0.75);
  }

  ctx.restore();
}

// ============================================================================
// 087: 번개 (Thunder)
// ============================================================================

export function drawThunderEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0.5
) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const targetX = targetPos.x;
  const targetY = targetPos.y - 4;
  const skyY = -40; // 캔버스 최상단 상공 좌표

  // Step 1: 하늘에 짙은 먹구름 뇌운 형성 & 대기 경고 섬광
  if (moveStep === 1) {
    const p = effectProgress;
    // 상공 먹구름 덩어리 렌더링
    const cloudY = 32;
    const clouds = [
      { x: targetX - 45, y: cloudY - 6, r: 28 },
      { x: targetX, y: cloudY - 14, r: 36 },
      { x: targetX + 45, y: cloudY - 8, r: 30 },
      { x: targetX - 20, y: cloudY + 6, r: 24 },
      { x: targetX + 22, y: cloudY + 8, r: 26 },
    ];

    // 먹구름 기저 어둠 레이어
    ctx.fillStyle = "#0F172A"; // 슬레이트 다크
    for (const c of clouds) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r * (0.8 + p * 0.25), 0, Math.PI * 2);
      ctx.fill();
    }

    // 먹구름 속 전격 오라 (보라/남색)
    ctx.fillStyle = "#312E81"; // 인디고
    for (const c of clouds) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r * 0.65, 0, Math.PI * 2);
      ctx.fill();
    }

    // 구름 사이로 비치는 내부 번개 섬광
    if (p > 0.4) {
      ctx.fillStyle = "#FEF08A";
      ctx.beginPath();
      ctx.arc(targetX + 4, cloudY - 6, 14 * p, 0, Math.PI * 2);
      ctx.fill();
    }

    // 하향 번개 전조 가이드 선
    for (let i = 0; i < 3; i++) {
      const sx = targetX - 16 + i * 16;
      const sy = cloudY + 16;
      const ey = sy + 30 + (i % 2) * 15;
      const pts = createLightningPoints(sx, sy, sx + (i - 1) * 8, ey, 4, 8, i * 2.1);
      ctx.strokeStyle = "#FDE047";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let j = 1; j < pts.length; j++) ctx.lineTo(pts[j].x, pts[j].y);
      ctx.stroke();
    }
  }

  // Step 2: 하늘 최상단에서 수직 강하하는 초대형 거대 벼락 기둥
  else if (moveStep === 2) {
    const p = effectProgress;
    const currentTipY = skyY + (targetY - skyY) * Math.min(1.0, p * 1.35);

    // 1) 메인 거대 벼락 줄기 (Trunk Bolt)
    const mainPts = createLightningPoints(targetX, skyY, targetX, currentTipY, 10, 24, 2.5);
    strokeLightningLayers(ctx, mainPts, 8.5, "#CA8A04", "#FDE047", "#FFFFFF");

    // 2) 좌우 분기 서브 벼락 2줄기
    const leftPts = createLightningPoints(targetX - 12, skyY + 20, targetX - 22, currentTipY - 14, 8, 20, 5.8);
    strokeLightningLayers(ctx, leftPts, 4.0, "#CA8A04", "#FDE047", "#FFFFFF");

    const rightPts = createLightningPoints(targetX + 10, skyY + 30, targetX + 24, currentTipY - 10, 8, 22, 8.4);
    strokeLightningLayers(ctx, rightPts, 3.8, "#CA8A04", "#FDE047", "#FFFFFF");

    // 선두 낙뢰 헤드 순백 섬광구
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(targetX, currentTipY, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#FDE047";
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.arc(targetX, currentTipY, 26, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Step 3: 지면 대격돌 & 1프레임 순백 히트 플래시 대폭발!
  else if (moveStep === 3) {
    const p = effectProgress;
    const groundY = targetPos.y + 24;

    // 지면 충격파 타원 링 2중 전개 (원근법 적용 지면 링)
    const ringW = 48 + p * 32;
    const ringH = ringW * 0.38;

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.ellipse(targetX, groundY, ringW, ringH, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#EAB308";
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.ellipse(targetX, groundY, ringW * 0.75, ringH * 0.75, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 표적 중심 초대형 스타버스트 임팩트
    drawStarburstImpact(ctx, targetX, targetY, "#CA8A04", "#FDE047", 52);

    // 관통 수직 벼락 잔상
    const strikePts = createLightningPoints(targetX, skyY, targetX, targetY + 20, 10, 18, 3.1);
    strokeLightningLayers(ctx, strikePts, 7.0, "#CA8A04", "#FDE047", "#FFFFFF");

    // 눈부신 백색 중심구
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(targetX, targetY, 22 * (1.0 - p * 0.3), 0, Math.PI * 2);
    ctx.fill();
  }

  // Step 4: 지면 역류 뇌격 방전 & 대지 관통
  else if (moveStep === 4) {
    const p = effectProgress;
    const groundY = targetPos.y + 24;

    // 지면에서 솟구쳐 오르는 역류 뇌격 텐드릴 6줄기
    for (let i = 0; i < 6; i++) {
      const offsetX = (i - 2.5) * 16;
      const startGroundX = targetX + offsetX;
      const endSkyY = targetY - 40 - (i % 3) * 15;
      const endX = targetX + offsetX * 1.5;

      const pts = createLightningPoints(startGroundX, groundY, endX, endSkyY, 6, 16, i * 4.2 + p * 3);
      strokeLightningLayers(ctx, pts, 3.2, "#EAB308", "#FDE047", "#FFFFFF");
    }

    // 대상을 관통하는 중심 전격 기둥
    const centerPts = createLightningPoints(targetX, skyY + 20, targetX, groundY, 8, 14, 1.9);
    strokeLightningLayers(ctx, centerPts, 5.0, "#EAB308", "#FDE047", "#FFFFFF");
  }

  // Step 5: 16방향 초특대 뇌격 스타버스트 & 뇌격 파편 비산
  else if (moveStep === 5) {
    const p = effectProgress;
    const burstR = 56 + p * 34;
    const alpha = Math.max(0.0, 1.0 - p * 0.65);

    // 16방향 방사 벼락 창
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const len1 = burstR * 0.2;
      const len2 = burstR * (0.8 + (i % 2) * 0.4);
      const x1 = targetX + Math.cos(a) * len1;
      const y1 = targetY + Math.sin(a) * len1;
      const x2 = targetX + Math.cos(a) * len2;
      const y2 = targetY + Math.sin(a) * len2;

      ctx.strokeStyle = `rgba(253, 224, 71, ${alpha})`;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // 사방으로 튀어나가는 20개의 전격 스파클
    for (let i = 0; i < 20; i++) {
      const a = i * 1.2 + p * 6;
      const dist = 26 + p * 55 + (i % 4) * 10;
      const sx = targetX + Math.cos(a) * dist;
      const sy = targetY + Math.sin(a) * dist;
      ctx.fillStyle = (i % 2 === 0) ? "#FFFFFF" : "#FDE047";
      ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
    }
  }

  // Step 6 & 7: 지면 그을림 잔류 스파크 & 뇌운 소멸
  else if (moveStep === 6 || moveStep === 7) {
    const p = moveStep === 6 ? effectProgress * 0.5 : 0.5 + effectProgress * 0.5;
    const alpha = Math.max(0.0, 1.0 - p);

    if (alpha > 0.05) {
      const groundY = targetPos.y + 24;
      // 지면 그을린 전격 균열
      ctx.strokeStyle = `rgba(253, 224, 71, ${alpha * 0.7})`;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.ellipse(targetX, groundY, 32 * (1.0 - p * 0.3), 12 * (1.0 - p * 0.3), 0, 0, Math.PI * 2);
      ctx.stroke();

      for (let i = 0; i < 8; i++) {
        const a = i * 1.6;
        const dist = 16 + (i % 3) * 10;
        const sx = targetX + Math.cos(a) * dist;
        const sy = targetY + Math.sin(a) * (dist * 0.6);
        ctx.fillStyle = `rgba(253, 224, 71, ${alpha * 0.85})`;
        ctx.fillRect(sx - 1, sy - 1, 2.5, 2.5);
      }
    }
  }

  ctx.restore();
}

// ============================================================================
// 088: 돌떨구기 (Rock Throw)
// ============================================================================

/**
 * 다각형 바위 그리기 헬퍼 (3D 각진 단면 음영 적용)
 */
function drawFacetedBoulder(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  rotation: number = 0
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  const s = size;

  // 1) 바위 기본 외곽 다각형 (돌의 불규칙한 각진 형태)
  const vertices = [
    { x: -s * 0.85, y: -s * 0.3 },
    { x: -s * 0.45, y: -s * 0.95 },
    { x:  s * 0.35, y: -s * 0.9 },
    { x:  s * 0.95, y: -s * 0.25 },
    { x:  s * 0.8,  y:  s * 0.75 },
    { x: -s * 0.1,  y:  s * 0.95 },
    { x: -s * 0.75, y:  s * 0.65 },
  ];

  // 바위 베이스 음영 (#78716C - 미드 그레이 록)
  ctx.fillStyle = "#78716C";
  ctx.beginPath();
  ctx.moveTo(vertices[0].x, vertices[0].y);
  for (let i = 1; i < vertices.length; i++) ctx.lineTo(vertices[i].x, vertices[i].y);
  ctx.closePath();
  ctx.fill();

  // 2) 상단 빛 받는 밝은 패싯 (#A8A29E / #D6D3D1)
  ctx.fillStyle = "#A8A29E";
  ctx.beginPath();
  ctx.moveTo(vertices[1].x, vertices[1].y);
  ctx.lineTo(vertices[2].x, vertices[2].y);
  ctx.lineTo(0, -s * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#D6D3D1"; // 하이라이트 패싯
  ctx.beginPath();
  ctx.moveTo(vertices[0].x, vertices[0].y);
  ctx.lineTo(vertices[1].x, vertices[1].y);
  ctx.lineTo(0, -s * 0.2);
  ctx.closePath();
  ctx.fill();

  // 3) 하단 그림자 어두운 패싯 (#44403C / #292524)
  ctx.fillStyle = "#44403C";
  ctx.beginPath();
  ctx.moveTo(vertices[3].x, vertices[3].y);
  ctx.lineTo(vertices[4].x, vertices[4].y);
  ctx.lineTo(0, -s * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#292524";
  ctx.beginPath();
  ctx.moveTo(vertices[4].x, vertices[4].y);
  ctx.lineTo(vertices[5].x, vertices[5].y);
  ctx.lineTo(vertices[6].x, vertices[6].y);
  ctx.lineTo(0, -s * 0.2);
  ctx.closePath();
  ctx.fill();

  // 4) 굵고 선명한 외곽선 마감 (#1C1917)
  ctx.strokeStyle = "#1C1917";
  ctx.lineWidth = Math.max(1.8, s * 0.12);
  ctx.beginPath();
  ctx.moveTo(vertices[0].x, vertices[0].y);
  for (let i = 1; i < vertices.length; i++) ctx.lineTo(vertices[i].x, vertices[i].y);
  ctx.closePath();
  ctx.stroke();

  // 내부 패싯 각진 구분선
  ctx.strokeStyle = "#292524";
  ctx.lineWidth = Math.max(1.2, s * 0.08);
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.2);
  ctx.lineTo(vertices[1].x, vertices[1].y);
  ctx.moveTo(0, -s * 0.2);
  ctx.lineTo(vertices[4].x, vertices[4].y);
  ctx.moveTo(0, -s * 0.2);
  ctx.lineTo(vertices[6].x, vertices[6].y);
  ctx.stroke();

  ctx.restore();
}

export function drawRockThrowEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0.5
) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const startX = attackerPos.x + 8;
  const groundStartY = attackerPos.y + 18;
  const targetX = targetPos.x;
  const targetY = targetPos.y - 6;

  // 바위 스펙 (메인 대형 바위 1개 + 보조 중형 바위 2개)
  const boulders = [
    { offX: 0, offY: -16, size: 20, rotSpeed: 4.2 },
    { offX: -18, offY: -6, size: 14, rotSpeed: -5.0 },
    { offX: 16, offY: -4, size: 12, rotSpeed: 6.5 },
  ];

  // Step 1: 시전자 발밑 지면 균열 & 바위 3개 공중 융기/부유
  if (moveStep === 1) {
    const p = effectProgress;
    const groundY = groundStartY;

    // 지면 균열선
    ctx.strokeStyle = "#78350F";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(startX - 24, groundY);
    ctx.lineTo(startX - 6, groundY - 3);
    ctx.lineTo(startX + 12, groundY + 2);
    ctx.lineTo(startX + 26, groundY);
    ctx.stroke();

    // 솟아오르는 바위들 (지면에서 공중으로 솟구침)
    for (let i = 0; i < boulders.length; i++) {
      const b = boulders[i];
      const curY = groundY - (p * (32 - i * 6));
      const curX = startX + b.offX * p;
      const rot = p * b.rotSpeed * 0.5;

      // 바위 밑 흙먼지 파티클
      if (p < 0.6) {
        ctx.fillStyle = "#D97706";
        ctx.beginPath();
        ctx.arc(curX + (i - 1) * 6, groundY - 2, 4 + (1 - p) * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      drawFacetedBoulder(ctx, curX, curY, b.size * Math.min(1.0, 0.4 + p * 0.6), rot);
    }
  }

  // Step 2: 대상을 향한 포물선 고속 투척 및 비행 궤적
  else if (moveStep === 2) {
    const p = effectProgress;
    const arcHeight = 46; // 포물선 정점 높이

    for (let i = 0; i < boulders.length; i++) {
      const b = boulders[i];
      // 개별 바위 시차 적용 (약간의 분산)
      const bProgress = Math.min(1.0, Math.max(0.0, p * 1.15 - i * 0.08));
      if (bProgress <= 0.0) continue;

      const curX = startX + (targetX - startX) * bProgress + b.offX * (1.0 - bProgress * 0.8);
      const linearY = (attackerPos.y - 14) + (targetY - (attackerPos.y - 14)) * bProgress;
      const curY = linearY - Math.sin(bProgress * Math.PI) * arcHeight + b.offY * (1.0 - bProgress * 0.8);
      const rot = bProgress * b.rotSpeed * 3.0;

      // 뒤따르는 움직임 궤적 선 (Motion streak trail)
      const prevX = curX - (targetX - startX) * 0.12;
      const prevY = curY + 6;
      const trailGrad = ctx.createLinearGradient(prevX, prevY, curX, curY);
      trailGrad.addColorStop(0, "rgba(168, 162, 158, 0)");
      trailGrad.addColorStop(1, "rgba(120, 113, 108, 0.85)");

      ctx.strokeStyle = trailGrad;
      ctx.lineWidth = b.size * 0.55;
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(curX, curY);
      ctx.stroke();

      // 바위 렌더링
      drawFacetedBoulder(ctx, curX, curY, b.size, rot);
    }
  }

  // Step 3: 표적 정면 대충돌 직격 (1프레임 히트 플래시와 동조)
  else if (moveStep === 3) {
    const p = effectProgress;

    // 바위 타격 코믹 버스트 & 지면 먼지 충격파
    drawStarburstImpact(ctx, targetX, targetY, "#D97706", "#FEF3C7", 38 + p * 12);

    // 충돌 순간 금이 간 대형 바위 직격 렌더링
    drawFacetedBoulder(ctx, targetX, targetY, 22, 0.4);

    // 바위 표면 방사형 균열선
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.4;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
      ctx.beginPath();
      ctx.moveTo(targetX, targetY);
      ctx.lineTo(targetX + Math.cos(a) * 20, targetY + Math.sin(a) * 20);
      ctx.stroke();
    }

    // 지면 충격파 타원
    ctx.strokeStyle = "#B45309";
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.ellipse(targetX, targetPos.y + 18, 36, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Step 4: 바위 산산조각 분쇄 (8~10개 파편 사방 비산)
  else if (moveStep === 4) {
    const p = effectProgress;
    const shardCount = 10;

    for (let i = 0; i < shardCount; i++) {
      const a = (i / shardCount) * Math.PI * 2;
      const dist = 14 + p * 42 + (i % 3) * 8;
      const sx = targetX + Math.cos(a) * dist;
      const sy = targetY + Math.sin(a) * (dist * 0.75) + p * 16; // 중력 낙하
      const shardSize = 5 + (i % 4) * 2.5;
      const rot = i + p * 5.0;

      drawFacetedBoulder(ctx, sx, sy, shardSize, rot);
    }

    // 사방으로 퍼지는 흙먼지 퍼프 구름 4개
    const dustClouds = [
      { x: targetX - 24, y: targetY + 10, r: 12 + p * 14 },
      { x: targetX + 22, y: targetY + 8, r: 14 + p * 12 },
      { x: targetX - 8, y: targetY - 14, r: 10 + p * 10 },
      { x: targetX + 10, y: targetY + 16, r: 16 + p * 16 },
    ];

    ctx.fillStyle = `rgba(168, 162, 158, ${Math.max(0.0, 0.75 - p * 0.6)})`;
    for (const d of dustClouds) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Step 5: 파편 지면 안착 및 자욱한 흙먼지 연무 확산
  else if (moveStep === 5) {
    const p = effectProgress;
    const alpha = Math.max(0.0, 1.0 - p * 0.75);

    // 지면에 흩어진 작은 돌조각들
    for (let i = 0; i < 6; i++) {
      const offsetX = (i - 2.5) * 12;
      const groundShardY = targetPos.y + 16 + (i % 2) * 4;
      drawFacetedBoulder(ctx, targetX + offsetX, groundShardY, 4.5, i * 1.5);
    }

    // 안착하는 부드러운 먼지 연무
    ctx.fillStyle = `rgba(214, 211, 209, ${alpha * 0.6})`;
    ctx.beginPath();
    ctx.ellipse(targetX, targetPos.y + 16, 44 + p * 16, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Step 6 & 7: 잔여 먼지 페이드아웃 및 완료
  else if (moveStep === 6 || moveStep === 7) {
    const p = moveStep === 6 ? effectProgress * 0.5 : 0.5 + effectProgress * 0.5;
    const alpha = Math.max(0.0, 1.0 - p);

    if (alpha > 0.05) {
      // 바닥 잔여 작은 돌파편
      for (let i = 0; i < 4; i++) {
        const offsetX = (i - 1.5) * 14;
        const groundShardY = targetPos.y + 16 + (i % 2) * 4;
        drawFacetedBoulder(ctx, targetX + offsetX, groundShardY, 3.5, i * 1.5);
      }
    }
  }

  ctx.restore();
}
