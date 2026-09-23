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
export function createLightningPoints(
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
export function drawSharpGlowingBolt(
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

  // 부드러운 외곽 투명도 감쇠 (Soft Gradient Transparency Falloff)
  // 외곽 경계선이 뚝 끊기지 않고 어두운 전장에 부드럽게 스며들도록 다층 투명도 적용
  const style0 = createLayerStyle(234, 179, 8, 0.03, 0.04, 0.01);
  const style1 = createLayerStyle(245, 158, 11, 0.06, 0.08, 0.02);
  const style2 = createLayerStyle(250, 204, 21, 0.14, 0.18, 0.04);
  const style3 = createLayerStyle(253, 224, 71, 0.35, 0.42, 0.10);
  const style4 = createLayerStyle(254, 240, 138, 0.65, 0.75, 0.18);
  const style5 = createLayerStyle(254, 249, 195, 0.82, 0.92, 0.22);
  const style6 = createLayerStyle(255, 255, 255, 0.90, 1.00, 0.30);

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

  // Pass 0: 극외곽 소프트 대기 산란 헤이즈 (가장 바깥쪽 부드러운 투명도 감쇠)
  drawLayer(style0, width * 5.2);
  // Pass 1: 최외곽 소프트 앰버 글로우
  drawLayer(style1, width * 3.8);
  // Pass 2: 중간 앰버-골드 확산 글로우
  drawLayer(style2, width * 2.6);
  // Pass 3: 고전압 옐로우 미드 바디
  drawLayer(style3, width * 1.7);
  // Pass 4: 선명한 일렉트릭 레몬 바디
  drawLayer(style4, width * 1.1);
  // Pass 5: 따뜻한 백황색 서브 코어
  drawLayer(style5, width * 0.65);

  // Pass 6: 눈부신 순백 핫 코어 (연속 얇은 와이어 + 테이퍼링 끝점)
  const coreStartIdx = taperStart ? 1 : 0;
  const coreEndIdx = taperEnd ? n - 1 : n;
  ctx.strokeStyle = style6;
  ctx.fillStyle = style6;
  ctx.lineWidth = Math.max(1.0, width * 0.32);

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
export function drawImpactTendril(
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
export function drawThunderboltPlasmaSphere(
  ctx: any,
  tx: number,
  ty: number,
  radius: number,
  alpha: number = 1.0,
  tendrilSeed: number = 0,
  numTendrils: number = 14
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
  for (let i = 0; i < numTendrils; i++) {
    const baseAngle = (i / numTendrils) * Math.PI * 2 + Math.sin(i * 1.5 + tendrilSeed) * 0.2;
    const innerR = radius * 0.42;
    const outerR = radius * (1.20 + (i % 3) * 0.18);
    drawImpactTendril(ctx, tx, ty, baseAngle, innerR, outerR, i * 2.7 + tendrilSeed);
  }

  // 4. 구체 내부를 가로지르는 무작위 마이크로 전격 아크 줄기
  const microArcCount = Math.max(2, Math.round(numTendrils * 0.3));
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1.6;
  for (let i = 0; i < microArcCount; i++) {
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
export function drawShockwaveRing(
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
export function drawRadiatingTaperedStrands(
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
export function drawElectricSparkEmbers(
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
// // ============================================================================
// 087: 번개 (Thunder)
// ============================================================================

/**
 * 번개(Thunder) 특수 화면 암전:
 * "배경 좀 많이 어둡게" & "하단은 회색빛 위는 검은"
 * 상공은 칠흑의 어둠, 하단은 짙고 묵직한 폭풍우 챠콜 회색으로 이어지는 극적 명암 대비
 */
function drawStormSkyDimming(
  ctx: any,
  centerX: number,
  currentCenterY: number,
  alpha: number
) {
  if (alpha <= 0.01) return;
  ctx.save();
  const topY = currentCenterY - 260;
  const bottomY = currentCenterY + 260;

  const a = Math.min(1.0, alpha);
  const grad = ctx.createLinearGradient(centerX, topY, centerX, bottomY);
  // 상단: 칠흑의 심연 (Pitch Black Abyss)
  grad.addColorStop(0.0, `rgba(1, 2, 6, ${0.99 * a})`);
  // 상중단: 딥 옵시디언 네이비 (Midnight Obsidian)
  grad.addColorStop(0.38, `rgba(4, 7, 16, ${0.97 * a})`);
  // 하중단: 다크 챠콜 슬레이트 (Dark Storm Slate)
  grad.addColorStop(0.72, `rgba(16, 24, 38, ${0.94 * a})`);
  // 하단: 짙은 폭풍우 회색빛 (Deep Misty Charcoal Gray)
  grad.addColorStop(1.0, `rgba(28, 36, 50, ${0.92 * a})`);

  ctx.fillStyle = grad;
  ctx.fillRect(centerX - 1200, currentCenterY - 1200, 2400, 2400);
  ctx.restore();
}

/**
 * 2D Canvas 부드러운 수증기 퍼프 (Soft Gaussian-like Vapor Puff)
 * 중심에서 순백/밝은 회색 -> 외곽 1.0에서 완전 투명(0.0)으로 부드럽게 감쇠하여
 * 딱딱한 원형/타원형 테두리(boundary arc) 없이 몽글몽글 퍼지는 실제 수증기 응축 질감 구현.
 */
function drawSoftVaporPuff(
  ctx: any,
  x: number,
  y: number,
  rx: number,
  ry: number,
  r: number,
  g: number,
  b: number,
  peakAlpha: number
) {
  if (peakAlpha <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.0, ry / rx);

  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  grad.addColorStop(0.0, `rgba(${r}, ${g}, ${b}, ${peakAlpha})`);
  grad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${peakAlpha * 0.78})`);
  grad.addColorStop(0.65, `rgba(${r}, ${g}, ${b}, ${peakAlpha * 0.40})`);
  grad.addColorStop(0.85, `rgba(${r}, ${g}, ${b}, ${peakAlpha * 0.12})`);
  grad.addColorStop(1.0, `rgba(${r}, ${g}, ${b}, 0.0)`); // 외곽 완전 0! 경계선 절대 없음!

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 구름 속 유기적 볼류메트릭 플라즈마 에너지 수렴 볼 (Volumetric Plasma Vortex Node):
 * 피드백 반영:
 * 1) "구름에서 번개 내려치기 전 보이는구체 납작하게 만들어봐 (입체적으로 보일 수있도록)"
 * 2) "번개 시작점 위치 위로 그리고 해당 형태 너무 선명한것도 이상한듯"
 *
 * 개선 사항:
 * - 인위적인 기하학 외곽선(stroke 링, 다이아몬드 각진 선, 사각 스파크 점) 완전 제거!
 * - 구름 속에 자연스럽게 융합되어 타오르는 가로 납작(aspect: 0.33) 볼류메트릭 플라즈마 블룸.
 * - 부드러운 가우시안 감쇠의 순백 중심 코어 + 레몬/골든 코로나 헤이즈.
 * - 구름 수증기를 투과하는 부드러운 수평 대기 이온화 광선대 (경계선 없는 소프트 방사형 그라데이션).
 * - 구름 틈새로 은은하게 일렁이는 유기적 미세 전격 필라멘트 아크 (자연스러운 테이퍼링).
 * - 아래로 스며 나오는 전조 방전 텐드릴 (지면을 향해 뻗는 예비 방전).
 */
function drawFlattenedConvergenceNode(
  ctx: any,
  cx: number,
  cy: number,
  alpha: number,
  chargeProgress: number = 1.0,
  seed: number = 0
) {
  if (alpha <= 0.02) return;
  ctx.save();

  const aspect = 0.33; // 3D 원근 가로 납작 비율
  const scale = 0.70 + chargeProgress * 0.30; // 충전에 따른 자연스러운 팽창

  // --------------------------------------------------------------------------
  // 1. 광역 수증기 플라즈마 헤이즈 (Volumetric Atmosphere Ionization Wash)
  // --------------------------------------------------------------------------
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1.0, aspect);
  const hazeR = 64 * scale;
  const hazeGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, hazeR);
  hazeGrad.addColorStop(0.0, `rgba(255, 255, 255, ${0.75 * alpha})`);
  hazeGrad.addColorStop(0.28, `rgba(254, 240, 138, ${0.55 * alpha})`);
  hazeGrad.addColorStop(0.62, `rgba(234, 179, 8, ${0.28 * alpha})`);
  hazeGrad.addColorStop(0.85, `rgba(202, 138, 4, ${0.08 * alpha})`);
  hazeGrad.addColorStop(1.0, "rgba(202, 138, 4, 0.0)"); // 경계선 없이 완벽 감쇠
  ctx.fillStyle = hazeGrad;
  ctx.beginPath();
  ctx.arc(0, 0, hazeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // --------------------------------------------------------------------------
  // 2. 수평 대기 이온화 광선대 (Soft Horizontal Equatorial Glow - 각진 폴리곤 제거)
  // --------------------------------------------------------------------------
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1.0, 0.16); // 극도로 납작한 수평 빔
  const slitR = 56 * scale;
  const slitGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, slitR);
  slitGrad.addColorStop(0.0, `rgba(255, 255, 255, ${0.90 * alpha})`);
  slitGrad.addColorStop(0.35, `rgba(254, 249, 195, ${0.65 * alpha})`);
  slitGrad.addColorStop(0.70, `rgba(250, 204, 21, ${0.25 * alpha})`);
  slitGrad.addColorStop(1.0, "rgba(234, 179, 8, 0.0)");
  ctx.fillStyle = slitGrad;
  ctx.beginPath();
  ctx.arc(0, 0, slitR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // --------------------------------------------------------------------------
  // 3. 고밀도 순백/레몬 이온화 플라즈마 코어 (Dense Radiant Plasma Core)
  // --------------------------------------------------------------------------
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1.0, 0.28);
  const coreR = 32 * scale;
  const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
  coreGrad.addColorStop(0.0, `rgba(255, 255, 255, ${alpha})`);
  coreGrad.addColorStop(0.45, `rgba(255, 255, 255, ${0.92 * alpha})`);
  coreGrad.addColorStop(0.75, `rgba(254, 240, 138, ${0.60 * alpha})`);
  coreGrad.addColorStop(1.0, "rgba(250, 204, 21, 0.0)");
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, coreR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // --------------------------------------------------------------------------
  // 4. 구름 틈새로 감기는 유기적 미세 전격 필라멘트 (인위적 링 선/사각 점 대체)
  // --------------------------------------------------------------------------
  // 타원 궤도를 따라 일렁이는 3개의 유기적 번개 미세 아크
  const filamentConfigs = [
    { startA: 0.15,  endA: 0.85,  r: 38 * scale, w: 1.4 * scale, seg: 4, jit: 3 },
    { startA: 1.05,  endA: 1.85,  r: 44 * scale, w: 1.2 * scale, seg: 4, jit: 4 },
    { startA: -0.80, endA: -0.15, r: 34 * scale, w: 1.3 * scale, seg: 3, jit: 3 },
  ];

  for (let f = 0; f < filamentConfigs.length; f++) {
    const cfg = filamentConfigs[f];
    const rot = seed * 1.5 + f * 2.1;
    const a1 = cfg.startA + rot;
    const a2 = cfg.endA + rot;
    const pStart = {
      x: cx + Math.cos(a1) * cfg.r,
      y: cy + Math.sin(a1) * (cfg.r * aspect)
    };
    const pEnd = {
      x: cx + Math.cos(a2) * cfg.r,
      y: cy + Math.sin(a2) * (cfg.r * aspect)
    };
    const midA = (a1 + a2) * 0.5;
    const pMid = {
      x: cx + Math.cos(midA) * (cfg.r * 1.05),
      y: cy + Math.sin(midA) * (cfg.r * aspect * 1.05)
    };

    const pts1 = createLightningPoints(pStart.x, pStart.y, pMid.x, pMid.y, cfg.seg, cfg.jit, seed + f * 3.7);
    const pts2 = createLightningPoints(pMid.x, pMid.y, pEnd.x, pEnd.y, cfg.seg, cfg.jit, seed + f * 5.3);
    const fullPts = [...pts1, ...pts2.slice(1)];

    drawSharpGlowingBolt(ctx, fullPts, cfg.w, alpha * 0.80, true, true);
  }

  // --------------------------------------------------------------------------
  // 5. 하단 정점 전조 방전 텐드릴 (지면을 향해 뻗치는 미세 번개 바늘)
  // --------------------------------------------------------------------------
  for (let j = 0; j < 3; j++) {
    const sx = cx - 10 + j * 10;
    const sy = cy + 2;
    const ey = cy + (14 + (j % 2) * 10) * scale;
    const ex = sx + (j === 1 ? 0 : (j === 0 ? -6 : 6));
    const pts = createLightningPoints(sx, sy, ex, ey, 3, 4, seed + j * 2.8);
    drawSharpGlowingBolt(ctx, pts, 1.6 * scale, alpha * 0.85, true, true);
  }

  ctx.restore();
}

/**
 * 최상단 백색 반투명 수증기 응축 구름 (Condensed White Vapor Cloud):
 * - 유저 요청: "최상단에 흰색 반투명으로 수증기를 응축시킨 것 같은 구름", "희게 퍼지는 느낌", "구름의 형체 자체가 느껴지도록"
 * - 딱딱한 타원형 스티커 경계선(Mach bands) 완전 제거 -> 부드러운 감쇠 곡선의 다층 수증기 돔 클러스터.
 * - 어두운 폭풍우 하늘 최상단에서 눈부시게 대비되는 은백색 뭉게구름 체적감 구현.
 */
function drawCondensedVaporCloud(
  ctx: any,
  cloudCenterX: number,
  cloudCenterY: number,
  alpha: number,
  internalFlash: number = 0,
  seed: number = 0
) {
  if (alpha <= 0.01) return;
  ctx.save();

  // 상공 최상단 기준 Y (화면 상단 천장선)
  const baseY = cloudCenterY - 32;

  // --------------------------------------------------------------------------
  // 1. 최상단 수증기 헤이즈 워시 (Atmospheric Vapor Glow Wash)
  // --------------------------------------------------------------------------
  const hazeGrad = ctx.createLinearGradient(cloudCenterX, baseY - 40, cloudCenterX, baseY + 95);
  hazeGrad.addColorStop(0.0, `rgba(255, 255, 255, ${0.45 * alpha})`);
  hazeGrad.addColorStop(0.30, `rgba(240, 248, 255, ${0.35 * alpha})`);
  hazeGrad.addColorStop(0.65, `rgba(215, 230, 250, ${0.18 * alpha})`);
  hazeGrad.addColorStop(1.0, "rgba(190, 215, 245, 0.0)");
  ctx.fillStyle = hazeGrad;
  ctx.fillRect(cloudCenterX - 500, baseY - 60, 1000, 160);

  // --------------------------------------------------------------------------
  // 2. 내부 전격 이온화 플라즈마 역광 (Backlit Lightning Flash - 원형 220px 0.0 감쇠로 잘림 방지)
  // --------------------------------------------------------------------------
  if (internalFlash > 0.05) {
    const flash = Math.min(1.0, internalFlash) * alpha;

    // 구름 중심부 뒤에서 눈부시게 터져 나오는 황금-순백 역광 (원형 블룸으로 잘림 없이 0.0 감쇠)
    ctx.save();
    const flashGrad = ctx.createRadialGradient(cloudCenterX, baseY + 30, 0, cloudCenterX, baseY + 30, 220);
    flashGrad.addColorStop(0.0, `rgba(255, 255, 255, ${0.90 * flash})`);
    flashGrad.addColorStop(0.25, `rgba(254, 240, 138, ${0.75 * flash})`);
    flashGrad.addColorStop(0.60, `rgba(234, 179, 8, ${0.35 * flash})`);
    flashGrad.addColorStop(1.0, "rgba(202, 138, 4, 0.0)");
    ctx.fillStyle = flashGrad;
    ctx.beginPath();
    ctx.arc(cloudCenterX, baseY + 30, 220, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 구름 속을 가로지르는 번개 크롤러 아크
    for (let j = 0; j < 4; j++) {
      const sx = cloudCenterX - 120 + j * 60;
      const sy = baseY + 12 + (j % 2) * 10;
      const ex = cloudCenterX - 50 + j * 45;
      const ey = baseY + 38;
      const arcPts = createLightningPoints(sx, sy, ex, ey, 4, 7, seed + j * 2.3);
      drawSharpGlowingBolt(ctx, arcPts, 2.4, flash * 0.95, true, true);
    }
  }

  // --------------------------------------------------------------------------
  // 3. 심층 음영 구름 덩어리 (Deep Shaded Billow Layer - 입체 체적감 형성)
  // --------------------------------------------------------------------------
  const deepPuffs = [
    { x: cloudCenterX - 180, y: baseY + 18, rx: 65, ry: 45 },
    { x: cloudCenterX - 90,  y: baseY + 26, rx: 62, ry: 46 },
    { x: cloudCenterX,       y: baseY + 20, rx: 70, ry: 48 },
    { x: cloudCenterX + 95,  y: baseY + 24, rx: 64, ry: 46 },
    { x: cloudCenterX + 185, y: baseY + 18, rx: 65, ry: 45 },
    { x: cloudCenterX - 270, y: baseY + 14, rx: 55, ry: 40 },
    { x: cloudCenterX + 275, y: baseY + 14, rx: 55, ry: 40 },
  ];

  for (const p of deepPuffs) {
    drawSoftVaporPuff(ctx, p.x, p.y, p.rx, p.ry, 195, 212, 232, 0.65 * alpha);
  }

  // --------------------------------------------------------------------------
  // 4. 주요 순백 응축 수증기 돔 클러스터 (Primary White Cumulus Domes)
  // "흰색 반투명으로 수증기를 응축시킨 구름", "희게 퍼지는 느낌"
  // --------------------------------------------------------------------------
  const mainPuffs = [
    // 중앙 수렴 지점 주변 거대 뭉게구름 돔
    { x: cloudCenterX,       y: baseY + 12, rx: 68, ry: 50, a: 0.92 },
    { x: cloudCenterX - 45,  y: baseY + 18, rx: 56, ry: 44, a: 0.88 },
    { x: cloudCenterX + 48,  y: baseY + 16, rx: 58, ry: 44, a: 0.88 },

    // 좌측 주요 적란운 능선
    { x: cloudCenterX - 110, y: baseY + 20, rx: 62, ry: 46, a: 0.90 },
    { x: cloudCenterX - 165, y: baseY + 14, rx: 58, ry: 42, a: 0.86 },
    { x: cloudCenterX - 225, y: baseY + 20, rx: 54, ry: 40, a: 0.84 },
    { x: cloudCenterX - 290, y: baseY + 12, rx: 52, ry: 38, a: 0.80 },
    { x: cloudCenterX - 355, y: baseY + 15, rx: 50, ry: 36, a: 0.75 },

    // 우측 주요 적란운 능선
    { x: cloudCenterX + 115, y: baseY + 18, rx: 62, ry: 46, a: 0.90 },
    { x: cloudCenterX + 170, y: baseY + 14, rx: 58, ry: 42, a: 0.86 },
    { x: cloudCenterX + 230, y: baseY + 20, rx: 54, ry: 40, a: 0.84 },
    { x: cloudCenterX + 295, y: baseY + 12, rx: 52, ry: 38, a: 0.80 },
    { x: cloudCenterX + 360, y: baseY + 15, rx: 50, ry: 36, a: 0.75 },
  ];

  for (const p of mainPuffs) {
    drawSoftVaporPuff(ctx, p.x, p.y, p.rx, p.ry, 255, 255, 255, p.a * alpha);
  }

  // --------------------------------------------------------------------------
  // 5. 전면 하이라이트 순백 코어 (Bright Core Highlights)
  // --------------------------------------------------------------------------
  const corePuffs = [
    { x: cloudCenterX,       y: baseY + 6,  rx: 48, ry: 34, a: 0.95 },
    { x: cloudCenterX - 95,  y: baseY + 10, rx: 42, ry: 30, a: 0.90 },
    { x: cloudCenterX + 98,  y: baseY + 8,  rx: 44, ry: 30, a: 0.90 },
    { x: cloudCenterX - 195, y: baseY + 8,  rx: 38, ry: 26, a: 0.85 },
    { x: cloudCenterX + 200, y: baseY + 8,  rx: 40, ry: 26, a: 0.85 },
  ];

  for (const p of corePuffs) {
    drawSoftVaporPuff(ctx, p.x, p.y, p.rx, p.ry, 255, 255, 255, p.a * alpha);
  }

  // --------------------------------------------------------------------------
  // 6. 하단 수증기 흩날림/갈래 (Soft Lower Vapor Tendrils - 자연스러운 경계선 소멸)
  // --------------------------------------------------------------------------
  const wisps = [
    { x: cloudCenterX - 75,  y: baseY + 42, rx: 32, ry: 20, a: 0.45 },
    { x: cloudCenterX + 70,  y: baseY + 40, rx: 34, ry: 22, a: 0.45 },
    { x: cloudCenterX - 145, y: baseY + 38, rx: 30, ry: 18, a: 0.40 },
    { x: cloudCenterX + 150, y: baseY + 36, rx: 32, ry: 19, a: 0.40 },
    { x: cloudCenterX - 220, y: baseY + 34, rx: 28, ry: 17, a: 0.35 },
    { x: cloudCenterX + 225, y: baseY + 35, rx: 28, ry: 17, a: 0.35 },
  ];

  for (const w of wisps) {
    drawSoftVaporPuff(ctx, w.x, w.y, w.rx, w.ry, 235, 245, 255, w.a * alpha);
  }

  ctx.restore();
}

/**
 * 번개(Thunder) 전용: 지축을 가르는 5-Pass 극초고압 거대 벼락 (Trunk Bolt)
 * 본체 벼락 기둥 + 3줄기 분기 벼락 (모두 drawSharpGlowingBolt로 날카롭고 각지게 렌더링)
 */
function drawGreatThunderbolt(
  ctx: any,
  startX: number,
  startY: number,
  targetX: number,
  endY: number,
  width: number,
  alpha: number,
  seed: number
) {
  if (alpha <= 0.02 || endY <= startY + 5) return;
  ctx.save();

  // 1) 메인 벼락 줄기 지그재그 생성 (14마디) - 지면 안착 지점까지 테이퍼링 수렴
  const mainPts = createLightningPoints(startX, startY, targetX, endY, 14, 18, seed);
  drawSharpGlowingBolt(ctx, mainPts, width, alpha, false, true);

  // 2) 좌우로 찢어져 나가는 분기 벼락 3줄기 (화면 내 가시 영역에 정밀 배치)
  if (mainPts.length >= 8) {
    // 분기 1: 화면 상단 가시 영역 (y ≈ targetPos.y - 65)
    const m1 = mainPts[Math.floor(mainPts.length * 0.60)];
    const b1Pts = createLightningPoints(m1.x, m1.y, m1.x - 48, m1.y + 38, 5, 10, seed + 4.2);
    drawSharpGlowingBolt(ctx, b1Pts, width * 0.42, alpha * 0.90, true, true);

    // 분기 2: 화면 중단 가시 영역 (y ≈ targetPos.y - 25)
    const m2 = mainPts[Math.floor(mainPts.length * 0.74)];
    const b2Pts = createLightningPoints(m2.x, m2.y, m2.x + 52, m2.y + 35, 5, 10, seed + 7.8);
    drawSharpGlowingBolt(ctx, b2Pts, width * 0.45, alpha * 0.90, true, true);

    // 분기 3: 지면 직전 하단부 (y ≈ targetPos.y + 12)
    const m3 = mainPts[Math.floor(mainPts.length * 0.88)];
    const b3Pts = createLightningPoints(m3.x, m3.y, m3.x - 36, m3.y + 20, 4, 8, seed + 11.4);
    drawSharpGlowingBolt(ctx, b3Pts, width * 0.38, alpha * 0.85, true, true);
  }

  // 3) 지면 접촉부 초고온 순백/황금 접지 블룸 (원근 타원 적용으로 원형 링 형태 방지)
  ctx.save();
  ctx.translate(targetX, endY);
  ctx.scale(1.0, 0.35);
  const impactBloom = ctx.createRadialGradient(0, 0, 0, 0, 0, 36);
  impactBloom.addColorStop(0.0, `rgba(255, 255, 255, ${alpha})`);
  impactBloom.addColorStop(0.35, `rgba(254, 240, 138, ${0.92 * alpha})`);
  impactBloom.addColorStop(0.70, `rgba(234, 179, 8, ${0.45 * alpha})`);
  impactBloom.addColorStop(1.0, "rgba(202, 138, 4, 0.0)");
  ctx.fillStyle = impactBloom;
  ctx.beginPath();
  ctx.arc(0, 0, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * 구름에서 하방으로 고속 강하하는 벼락 선단 (Leader Head Bolt)
 */
function drawDescendingLightningLeader(
  ctx: any,
  startX: number,
  startY: number,
  targetX: number,
  currentTipY: number,
  trunkWidth: number,
  alpha: number,
  seed: number
) {
  if (alpha <= 0.02 || currentTipY <= startY + 5) return;
  ctx.save();

  // 1) 메인 하강 줄기: 시작점/끝점 바늘 테이퍼링 + 전방 투명 감쇠(frontFade) 적용으로 날카로운 낙뢰 선단 연출
  const mainPts = createLightningPoints(startX, startY, targetX, currentTipY, 10, 16, seed);
  drawSharpGlowingBolt(ctx, mainPts, trunkWidth, alpha, true, true, true);

  // 2) 하강 도중 찢어지는 곁가지
  if (mainPts.length >= 5) {
    const mid = mainPts[Math.floor(mainPts.length * 0.50)];
    const bPts = createLightningPoints(mid.x, mid.y, mid.x + (seed % 2 === 0 ? 38 : -38), mid.y + 40, 4, 8, seed + 3.7);
    drawSharpGlowingBolt(ctx, bPts, trunkWidth * 0.40, alpha * 0.85, true, true);
  }

  // [피드백 반영]: 도달하기 전 선두 구체 완전 제거!
  // 대상에 도달하기 전까지는 번개가 날카롭고 매서운 선단(Needle Tip)으로만 쇄도하며,
  // 대상에게 도달했을 때(Step 4) 비로소 거대한 임팩트 플라즈마 구체가 폭발합니다.

  ctx.restore();
}

/**
 * 번개 타격 순간 방사되는 고전압 전격 방전 가닥 (Impact Discharge Streaks)
 * 유저 피드백: "직선 가닥들 중앙 및 외각 투명하게"
 * 
 * - 중앙(시작부) 0.0 투명도 -> 중간(중심부) 순백-레몬 고전압 피크 -> 외각(끝단) 0.0 투명도
 * - 양 끝단(중앙 & 외각)이 부드럽게 감쇠하여 인위적인 직선 느낌 없이 공기 중으로 뻗어나가는 스트리머
 */
function drawImpactDischargeStreaks(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number,
  count: number = 12,
  seed: number = 0
) {
  if (alpha <= 0.02 || radius <= 4) return;
  ctx.save();
  ctx.lineCap = "round";

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + seed * 0.45 + (i % 2 === 0 ? 0.08 : -0.08);
    const innerDist = radius * 0.20;
    const outerDist = radius * (0.95 + (i % 3) * 0.35);

    const x1 = cx + Math.cos(angle) * innerDist;
    const y1 = cy + Math.sin(angle) * (innerDist * 0.88);
    const x2 = cx + Math.cos(angle) * outerDist;
    const y2 = cy + Math.sin(angle) * (outerDist * 0.88);

    // 미세한 전격 곡선 굴곡 (완전 직선 탈피)
    const midT = 0.50;
    const perpAngle = angle + Math.PI * 0.5;
    const jitter = Math.sin(seed * 2.5 + i * 2.1) * (radius * 0.08);
    const midX = x1 + (x2 - x1) * midT + Math.cos(perpAngle) * jitter;
    const midY = y1 + (y2 - y1) * midT + Math.sin(perpAngle) * jitter;

    // [핵심] 중앙(0.0) 투명 -> 중간(0.5) 고전압 레몬/골드 -> 외각(1.0) 완전 투명
    const streakGrad = ctx.createLinearGradient(x1, y1, x2, y2);
    streakGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)"); // 중앙 완전 투명!
    streakGrad.addColorStop(0.20, `rgba(254, 240, 138, ${0.40 * alpha})`);
    streakGrad.addColorStop(0.50, `rgba(255, 255, 255, ${0.92 * alpha})`); // 중간 최대 발광
    streakGrad.addColorStop(0.78, `rgba(250, 204, 21, ${0.40 * alpha})`);
    streakGrad.addColorStop(1.0, "rgba(234, 179, 8, 0.0)"); // 외각 완전 투명!

    ctx.strokeStyle = streakGrad;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(midX, midY, x2, y2);
    ctx.stroke();

    // 내부 순백 코어 (중앙 & 외각 투명)
    const coreGrad = ctx.createLinearGradient(x1, y1, x2, y2);
    coreGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)"); // 중앙 투명
    coreGrad.addColorStop(0.35, `rgba(255, 255, 255, ${0.75 * alpha})`);
    coreGrad.addColorStop(0.50, `rgba(255, 255, 255, ${1.00 * alpha})`);
    coreGrad.addColorStop(0.65, `rgba(255, 255, 255, ${0.75 * alpha})`);
    coreGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)"); // 외각 투명

    ctx.strokeStyle = coreGrad;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(midX, midY, x2, y2);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 표적 도달 시 폭발하는 대형 블라인딩 플라즈마 임팩트 구체 (Target Impact Plasma Sphere)
 * 피드백 반영:
 * 1) "대상에게 도달했을 때 구체가 나오게 해주고"
 * 2) "번개의 외각에 있는 것들 부드러운 투명도"
 */
function drawTargetImpactPlasmaSphere(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number,
  seed: number = 0
) {
  if (alpha <= 0.02 || radius <= 2) return;
  ctx.save();

  // 1. 최외곽 부드러운 대기 발광 투명도 블룸 (Soft Atmospheric Transparency Bloom)
  // 외곽 1.0에서 0.0으로 완벽 감쇠하여 경계선 없이 부드럽게 스며듦
  const outerR = radius * 2.4;
  const outerBloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerR);
  outerBloom.addColorStop(0.0, `rgba(255, 255, 255, ${0.95 * alpha})`);
  outerBloom.addColorStop(0.25, `rgba(254, 240, 138, ${0.75 * alpha})`);
  outerBloom.addColorStop(0.55, `rgba(234, 179, 8, ${0.35 * alpha})`);
  outerBloom.addColorStop(0.80, `rgba(202, 138, 4, ${0.10 * alpha})`);
  outerBloom.addColorStop(1.0, "rgba(202, 138, 4, 0.0)"); // 부드러운 0.0 투명도
  ctx.fillStyle = outerBloom;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.fill();

  // 2. 중간 고밀도 일렉트릭 레몬-골드 구체 바디
  const midR = radius * 1.25;
  const midGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, midR);
  midGrad.addColorStop(0.0, `rgba(255, 255, 255, ${alpha})`);
  midGrad.addColorStop(0.40, `rgba(255, 255, 255, ${0.95 * alpha})`);
  midGrad.addColorStop(0.70, `rgba(254, 249, 195, ${0.80 * alpha})`);
  midGrad.addColorStop(1.0, "rgba(250, 204, 21, 0.0)");
  ctx.fillStyle = midGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, midR, 0, Math.PI * 2);
  ctx.fill();

  // 3. 중심 초고온 순백 핫 코어
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
/**
 * 지면 원근법 적용 대형 볼류메트릭 방전 플라즈마 충격파 영역 (Ground Plasma Shockwave Field)
 * 피드백 반영:
 * "바닥에 지면에 도형처럼 나오던거 (반투명한) 그건 유지하면서 링을 제거"
 * 
 * - 외곽선 테두리(stroke 링)는 완전 제거하여 인위적인 링 형태 방지
 * - 지면에 반투명한 면(도형) 형태로 넓고 두껍게 퍼져나가는 입체 플라즈마 충격파 장판 구현
 * - 안쪽은 은은한 반투명 발광 -> 중심 대역 최대 에너지 -> 바깥쪽은 부드러운 완전 투명(0.0) 감쇠
 */
function drawGroundDischargeField(
  ctx: any,
  cx: number,
  cy: number,
  baseR: number,
  alpha: number
) {
  if (alpha <= 0.02 || baseR <= 4) return;

  ctx.save();
  const aspect = 0.35; // 지면 원근감 (납작한 바닥 타원)

  // --------------------------------------------------------------------------
  // 1. [메인 1차 외곽 두꺼운 확산 충격파 대역] (바깥쪽 완전 투명, 안쪽 반투명)
  // --------------------------------------------------------------------------
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1.0, aspect);

  const r1Outer = baseR * 1.45;
  const r1Inner = Math.max(0, baseR * 0.45); // 두껍게 퍼지는 충격파 파면

  const waveGrad1 = ctx.createRadialGradient(0, 0, r1Inner, 0, 0, r1Outer);
  waveGrad1.addColorStop(0.0, `rgba(255, 255, 255, ${0.18 * alpha})`); // 안쪽 시작부 반투명
  waveGrad1.addColorStop(0.25, `rgba(254, 240, 138, ${0.52 * alpha})`); // 중간 반투명 레몬 골드
  waveGrad1.addColorStop(0.55, `rgba(234, 179, 8, ${0.38 * alpha})`);  // 확산 앰버
  waveGrad1.addColorStop(0.80, `rgba(202, 138, 4, ${0.14 * alpha})`);  // 외곽 감쇠
  waveGrad1.addColorStop(1.0, "rgba(202, 138, 4, 0.0)"); // [핵심] 바깥쪽 완전 투명!

  ctx.fillStyle = waveGrad1;
  ctx.beginPath();
  ctx.arc(0, 0, r1Outer, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // --------------------------------------------------------------------------
  // 2. [2차 내부 고에너지 두꺼운 충격파 대역] (중심부 반투명 순백-레몬)
  // --------------------------------------------------------------------------
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1.0, aspect);

  const r2Outer = baseR * 0.95;
  const r2Inner = Math.max(0, baseR * 0.20);

  const waveGrad2 = ctx.createRadialGradient(0, 0, r2Inner, 0, 0, r2Outer);
  waveGrad2.addColorStop(0.0, `rgba(255, 255, 255, ${0.28 * alpha})`); // 안쪽 반투명 순백
  waveGrad2.addColorStop(0.35, `rgba(255, 255, 255, ${0.72 * alpha})`); // 코어 반투명 피크
  waveGrad2.addColorStop(0.70, `rgba(254, 249, 195, ${0.45 * alpha})`);
  waveGrad2.addColorStop(1.0, "rgba(250, 204, 21, 0.0)"); // 바깥쪽 투명!

  ctx.fillStyle = waveGrad2;
  ctx.beginPath();
  ctx.arc(0, 0, r2Outer, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // [주의]: 링 테두리 선(ctx.stroke() 엣지 라인)은 절대 그리지 않음!
  // 순수 반투명 면 그라데이션 도형만 렌더링.

  ctx.restore();
}

/**
 * 대지 위를 타고 거미줄처럼 질주하는 지면 방전 지그재그 크랙
 */
function drawGroundLightningCrackles(
  ctx: any,
  cx: number,
  cy: number,
  count: number,
  maxDist: number,
  alpha: number,
  seed: number
) {
  if (alpha <= 0.02) return;

  ctx.save();
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + seed * 0.35;
    const dist = maxDist * (0.75 + 0.25 * Math.sin(seed * 2.1 + i * 1.7));
    const gx = cx + Math.cos(angle) * dist;
    const gy = cy + Math.sin(angle) * (dist * 0.36); // 원근감

    const pts = createLightningPoints(cx, cy, gx, gy, 4, 7, seed + i * 2.2);
    drawSharpGlowingBolt(ctx, pts, 3.2, alpha, false, true);
  }
  ctx.restore();
}

/**
 * 뇌격 대폭발: 12방향 지그재그 분기 벼락 가지 (날카로운 miter join 발광 볼트)
 */
function drawBranchingThunderExplosion(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number,
  seed: number
) {
  if (alpha <= 0.02) return;

  ctx.save();
  const branches = 12;
  for (let i = 0; i < branches; i++) {
    const angle = (i / branches) * Math.PI * 2 + seed * 0.25 + (i % 2 === 0 ? 0.08 : -0.08);
    const dist = radius * (0.85 + 0.30 * Math.sin(seed * 3.1 + i * 1.9));
    const ex = cx + Math.cos(angle) * dist;
    const ey = cy + Math.sin(angle) * (dist * 0.85);

    const mainPts = createLightningPoints(cx, cy, ex, ey, 6, 12, seed + i * 2.7);
    drawSharpGlowingBolt(ctx, mainPts, 4.5, alpha, false, true);

    // 중간 곁가지
    if (mainPts.length >= 4) {
      const mid = mainPts[2];
      const subAngle = angle + (i % 2 === 0 ? 0.60 : -0.60);
      const subDist = dist * 0.50;
      const subEx = mid.x + Math.cos(subAngle) * subDist;
      const subEy = mid.y + Math.sin(subAngle) * subDist;
      const subPts = createLightningPoints(mid.x, mid.y, subEx, subEy, 4, 8, seed + i * 5.1);
      drawSharpGlowingBolt(ctx, subPts, 2.6, alpha * 0.85, true, true);
    }
  }

  // 사방으로 튀는 고에너지 전격 파편 (32개) - 부드러운 원형 발광 파티클
  for (let i = 0; i < 32; i++) {
    const a = i * 1.28 + seed * 2.2;
    const spDist = 18 + radius * (0.35 + 0.65 * (((i * 7) % 10) / 10));
    const sx = cx + Math.cos(a) * spDist;
    const sy = cy + Math.sin(a) * (spDist * 0.82);
    const size = (i % 3 === 0) ? 3.4 : 2.0;
    ctx.fillStyle = (i % 2 === 0) ? `rgba(255, 255, 255, ${alpha * 0.90})` : `rgba(254, 240, 138, ${alpha * 0.80})`;
    ctx.beginPath();
    ctx.arc(sx, sy, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 번개(Thunder) 배경 레이어 렌더러 (포켓몬/플랫폼 뒷면에 렌더링)
 */
export function drawThunderBehindEffect(
  ctx: any,
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number,
  frame: any
) {
  ctx.save();
  const targetX = targetPos.x;
  const panProg = frame?.skyPanProgress ?? ((moveStep >= 4) ? 1.0 : 0.0);
  const skyFocalY = targetPos.y - 180;
  const easedPan = panProg < 0.5 ? 2 * panProg * panProg : 1 - Math.pow(-2 * panProg + 2, 2) / 2;
  const currentCenterY = Math.round(skyFocalY + ((targetPos.y + 36) - skyFocalY) * easedPan);

  const cloudCenterY = targetPos.y - 275;

  // 1. [전장 폭풍우 암전]: 화면 하단 회색빛, 위는 검은 그라데이션 (배경 레이어)
  const dimAlpha = frame?.dimAlpha ?? (
    moveStep === 0 ? 0.35 :
    moveStep <= 3 ? 0.80 :
    moveStep === 4 ? 0.45 :
    moveStep === 5 ? 0.65 :
    moveStep === 6 ? 0.40 : 0.15
  );

  if (dimAlpha > 0) {
    drawStormSkyDimming(ctx, targetX, currentCenterY, dimAlpha);
  }

  // 2. [최상단 백색 반투명 수증기 응축 구름]: 배경 레이어에 렌더링
  if (moveStep <= 4) {
    const cloudAlpha = moveStep === 0
      ? Math.max(0, 1.0 - (frame?.skyPanProgress ?? 0)) * 0.92
      : (moveStep <= 2 ? 0.96 : moveStep === 3 ? 0.88 : 0.70);

    if (cloudAlpha > 0.05) {
      const internalFlash = moveStep === 1
        ? (effectProgress > 0.25 ? Math.sin((effectProgress - 0.25) / 0.75 * Math.PI) : 0.1)
        : (moveStep === 2 ? 1.0 : (moveStep === 0 ? 0.0 : 0.35));
      drawCondensedVaporCloud(ctx, targetX, cloudCenterY, cloudAlpha, internalFlash, effectProgress * 4);
    }
  }

  ctx.restore();
}

/**
 * 번개(Thunder) 전면 이펙트 레이어 렌더러 (포켓몬 앞면에 렌더링)
 */
export function drawThunderEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0.5,
  frame?: any
) {
  ctx.save();
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.miterLimit = 3.5;

  const targetX = targetPos.x;
  const targetY = targetPos.y - 4;
  const groundY = targetPos.y + 36; // 표적 플랫폼 지면(ground level)에 정확히 밀착

  // 상공 및 카메라 수직 위치
  const panProg = frame?.skyPanProgress ?? ((moveStep >= 4) ? 1.0 : 0.0);
  const skyFocalY = targetPos.y - 180;
  const easedPan = panProg < 0.5 ? 2 * panProg * panProg : 1 - Math.pow(-2 * panProg + 2, 2) / 2;
  const currentCenterY = Math.round(skyFocalY + ((targetPos.y + 36) - skyFocalY) * easedPan);

  const cloudCenterY = targetPos.y - 275;
  const cloudStartY = targetPos.y - 264; // 상공 구름 천장 수렴 중심 및 벼락 분출 지점 (충분한 상공 높이감 확보)

  // 1. [전장 전체 순백 섬광 (Full-Screen Whiteout Flash)]
  const whiteFlash = frame?.whiteoutAlpha ?? 0;
  if (whiteFlash > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.92, whiteFlash)})`;
    ctx.fillRect(targetX - 1200, currentCenterY - 1200, 2400, 2400);
    ctx.restore();
  }

  // Step 0: 필드에서 상공으로 카메라 틸트업 진행 중 (전면 이펙트 대기)
  if (moveStep === 0) {
    // 필드 틸트업 도중에는 전면 이펙트 없이 배경 암전과 구름 진입만 연출
  }

  // Step 1: 카메라 상공 지향 & 3D 납작한 전격 수렴 구체 충전 (입체적 에너지 디스크)
  else if (moveStep === 1) {
    const p = effectProgress;
    drawFlattenedConvergenceNode(ctx, targetX, cloudStartY, 1.0, p, p * 8);
  }

  // Step 2: 수증기 구름에서 강력한 4중 전격 분출 및 하방 급강하 개시
  else if (moveStep === 2) {
    const p = effectProgress;
    // 3D 납작 수렴 노드 잔류 발광
    drawFlattenedConvergenceNode(ctx, targetX, cloudStartY, Math.max(0, 1.0 - p * 0.35), 1.0, 12 + p * 15);

    const tipY = cloudStartY + (targetY - cloudStartY) * Math.min(1.0, 0.25 + p * 0.60);
    drawDescendingLightningLeader(ctx, targetX, cloudStartY, targetX, tipY, 14, 1.0, 3.5 + p * 4);
  }

  // Step 3: 카메라 수직 하강 (적 머리 위 ➔ 아래로만 내림) & 벼락이 적 정수리 바로 위까지 쇄도
  else if (moveStep === 3) {
    const p = effectProgress;
    // 상공의 3D 수렴 노드 희미하게 잔류
    drawFlattenedConvergenceNode(ctx, targetX, cloudStartY, Math.max(0, 0.65 - p * 0.45), 1.0, 25 + p * 15);

    const tipY = cloudStartY + (targetY - cloudStartY) * Math.min(1.0, 0.82 + p * 0.18);
    drawDescendingLightningLeader(ctx, targetX, cloudStartY, targetX, tipY, 16, 1.0, 7.8 + p * 6);
  }

  // Step 4: 적 포켓몬 도착 직후 정수리 대격돌 직격! (Cataclysmic Impact)
  else if (moveStep === 4) {
    const p = effectProgress;

    // 1) 구름에서 지면까지 대지를 가르는 16px 거대 본체 벼락 기둥 + 3줄기 분기 벼락
    drawGreatThunderbolt(ctx, targetX, cloudStartY, targetX, groundY, 16, 1.0, 4.5);

    // 2) [피드백 반영] 바닥 반투명 충격파 장판 (테두리 링 선 없이 순수 반투명 도형)
    drawGroundDischargeField(ctx, targetX, groundY, 44 + p * 16, 1.0);

    // 3) [피드백 반영] 타격 방사 전격 가닥: 중앙 및 외각 투명 감쇠 (직선 spoke 제거)
    drawImpactDischargeStreaks(ctx, targetX, targetY, 68, 1.0, 14, 4.2 + p * 8);

    // 4) [피드백 반영] 대상에게 도달했을 때 폭발하는 대형 블라인딩 플라즈마 임팩트 구체
    drawTargetImpactPlasmaSphere(ctx, targetX, targetY, 40 * (1.0 - p * 0.2), 1.0, 5.2 + p * 10);
  }

  // Step 5: 맹렬한 지속 뇌격 방전 & 대지 방전 크랙 (Sustained Surge)
  else if (moveStep === 5) {
    const p = effectProgress;

    // 1) 지속 방전 요동치는 거대 벼락
    drawGreatThunderbolt(ctx, targetX, cloudStartY, targetX, groundY, 15, 1.0, 8.7 + p * 15);

    // 2) [피드백 반영] 바닥 반투명 충격파 장판 확산 (테두리 링 선 없이 순수 반투명 도형)
    drawGroundDischargeField(ctx, targetX, groundY, 60 + p * 28, Math.max(0, 1.0 - p * 0.35));

    // 3) 지면을 거미줄처럼 가르는 날카로운 방전 크랙 (8줄기)
    drawGroundLightningCrackles(ctx, targetX, groundY, 8, 60 + p * 35, 0.95, 3.8 + p * 7);

    // 4) [피드백 반영] 타격 방사 전격 잔여 가닥 (중앙 & 외각 투명)
    drawImpactDischargeStreaks(ctx, targetX, targetY, 52, 1.0 - p * 0.35, 10, 8.4 + p * 12);

    // 5) [피드백 반영] 표적에 잔류하여 맹렬히 방전하는 플라즈마 임팩트 구체
    drawTargetImpactPlasmaSphere(ctx, targetX, targetY, 30 * (1.0 - p * 0.25), 1.0 - p * 0.2, 12.4 + p * 20);
  }

  // Step 6: 12방향 지그재그 분기 전격 대폭발 (Fractal Mega Burst)
  else if (moveStep === 6) {
    const p = effectProgress;

    // 1) 12방향 지그재그 분기 벼락 폭발!
    drawBranchingThunderExplosion(ctx, targetX, targetY, 75 + p * 50, Math.max(0, 1.0 - p * 0.65), 5.7);

    // 2) 지면 크랙 페이드아웃
    drawGroundLightningCrackles(ctx, targetX, groundY, 7, 80, Math.max(0, 0.65 * (1.0 - p)), 9.1);

    // 3) 바닥 반투명 장판 잔류 확산 페이드아웃 (링 없이 순수 감쇠)
    drawGroundDischargeField(ctx, targetX, groundY, 88 + p * 20, Math.max(0, (1.0 - p) * 0.55));
  }

  // Step 7: 지면 그을림 & 잔류 뇌격 아크 페이드아웃
  else if (moveStep === 7) {
    const p = effectProgress;
    const alpha = Math.max(0, 1.0 - p);

    if (alpha > 0.02) {
      // 1) 지면 짙게 그을린 크레이터 타원 (테두리 선 없이 부드러운 그을림 음영)
      ctx.save();
      ctx.fillStyle = `rgba(15, 23, 42, ${0.45 * alpha})`;
      ctx.beginPath();
      ctx.ellipse(targetX, groundY, 46 * (1.0 - p * 0.2), 16 * (1.0 - p * 0.2), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2) 잔류 쿨링 엠버
      drawElectricSparkEmbers(ctx, targetX, targetY, 10, 22, p, 4.0, alpha * 0.85);
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
  rotation: number = 0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;
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

  // 4) 슬림하고 예리한 외곽선 마감 (#1C1917) - 유저 피드백 반영: border 대폭 슬림화 & 안쪽 border 제거
  ctx.strokeStyle = "#1C1917";
  ctx.lineWidth = Math.max(0.65, s * 0.045);
  ctx.beginPath();
  ctx.moveTo(vertices[0].x, vertices[0].y);
  for (let i = 1; i < vertices.length; i++) ctx.lineTo(vertices[i].x, vertices[i].y);
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
}

/**
 * 088: 돌떨구기 (Rock Throw) 헬퍼 및 메인 이펙트 렌더러
 *
 * 유저 지침:
 * 1. 시전 포켓몬 웅크림 -> 위로 도약할 때 돌멩이가 시전자 스프라이트에서 위로 발사됨
 * 2. 시전 포켓몬 포커싱 -> 머리 위로 돌이 떨어짐
 * 3. 현재의 타격 이펙트(스타버스트) 완전 제거 -> #8에서 모래먼지와 돌이 여러 개로 쪼개지는 효과
 * 4. 쪼개진 돌들이 바닥으로 뿌려지며 떨어짐 (동시에 대상 포켓몬 찌그러짐 -> 펴짐)
 */
const ROCK_SHARDS = [
  { angle: -Math.PI * 0.75, dist: 38, size: 5.5, rotSpeed: 4.5, dropOffset: 8 },
  { angle: -Math.PI * 0.50, dist: 28, size: 4.2, rotSpeed: -5.2, dropOffset: 4 },
  { angle: -Math.PI * 0.25, dist: 40, size: 6.0, rotSpeed: 6.0, dropOffset: 10 },
  { angle: -Math.PI * 0.90, dist: 48, size: 4.5, rotSpeed: -3.8, dropOffset: 18 },
  { angle: -Math.PI * 0.10, dist: 46, size: 5.0, rotSpeed: 4.2, dropOffset: 20 },
  { angle: Math.PI * 0.85,  dist: 42, size: 4.2, rotSpeed: 5.8, dropOffset: 28 },
  { angle: Math.PI * 0.15,  dist: 40, size: 4.8, rotSpeed: -6.4, dropOffset: 26 },
  { angle: Math.PI * 0.65,  dist: 34, size: 5.8, rotSpeed: 3.5, dropOffset: 34 },
  { angle: Math.PI * 0.35,  dist: 32, size: 5.2, rotSpeed: -4.0, dropOffset: 32 },
  { angle: Math.PI * 0.50,  dist: 24, size: 3.8, rotSpeed: 7.0, dropOffset: 38 },
];

const DUST_PUFFS = [
  { offX: -18, offY: -8, baseR: 14, maxR: 24, color: "#D6D3D1" },
  { offX: 20,  offY: -6, baseR: 16, maxR: 26, color: "#E7E5E4" },
  { offX: -8,  offY: -18, baseR: 12, maxR: 22, color: "#A8A29E" },
  { offX: 12,  offY: -16, baseR: 15, maxR: 25, color: "#C7BAA7" },
  { offX: -26, offY: 6,  baseR: 13, maxR: 22, color: "#78716C" },
  { offX: 24,  offY: 8,  baseR: 14, maxR: 24, color: "#A8A29E" },
  { offX: 0,   offY: 10, baseR: 18, maxR: 30, color: "#D6D3D1" },
];

function drawSandDustPuff(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number,
  color: string = "#D6D3D1"
) {
  if (alpha <= 0.01 || radius <= 0.5) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
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

  const p = effectProgress;
  const targetX = targetPos.x;
  const targetY = targetPos.y;
  const groundY = targetPos.y + 18;
  const impactY = targetPos.y - 14; // 머리 직격 높이

  // Step 1: 시전자 웅크림 (상대 머리 위에는 아직 돌 출현 전)
  if (moveStep === 1) {
    // 시전자 발사 제거: 돌 이펙트 없음
  }

  // Step 2: 상대 머리 위 높은 상공에서 돌멩이 출현 (낙하 시작 및 가속)
  else if (moveStep === 2) {
    const startDropY = targetY - 175;
    const curY = startDropY + p * 80;
    const rot = 1.6 + p * 2.2;

    // 머리 위 높은 상공에서 떨어지기 시작하는 하강 속도선 (윗부분/뒷부분 100% 투명 페이드)
    const topY = Math.max(0, curY - 45);
    const botY = curY - 10;
    if (botY > topY) {
      const lineGrad = ctx.createLinearGradient(0, topY, 0, botY);
      lineGrad.addColorStop(0, "rgba(214, 211, 209, 0)");
      lineGrad.addColorStop(0.4, "rgba(214, 211, 209, 0.30)");
      lineGrad.addColorStop(1, "rgba(255, 255, 255, 0.75)");

      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(targetX - 8, topY);
      ctx.lineTo(targetX - 8, botY);
      ctx.moveTo(targetX + 8, topY);
      ctx.lineTo(targetX + 8, botY);
      ctx.moveTo(targetX, topY + 6);
      ctx.lineTo(targetX, botY);
      ctx.stroke();
    }

    drawFacetedBoulder(ctx, targetX, curY, 22, rot);
  }

  // Step 3: 머리 위로 고속 급강하 낙하 (중력 가속도로 머리 직전 도달)
  else if (moveStep === 3) {
    const plungeStartY = targetY - 115;
    const curY = plungeStartY + p * 80; // 머리 바로 위까지 급강하
    const rot = 3.8 + p * 3.5;

    const topY = Math.max(0, curY - 65);
    const botY = curY - 8;

    if (botY > topY) {
      // 1) 강렬한 수직 하강 모션 트레일 (윗부분/뒷부분 100% 투명 페이드)
      const trailGrad = ctx.createLinearGradient(0, topY, 0, botY);
      trailGrad.addColorStop(0, "rgba(120, 113, 108, 0)");
      trailGrad.addColorStop(0.4, "rgba(168, 162, 158, 0.35)");
      trailGrad.addColorStop(0.8, "rgba(214, 211, 209, 0.70)");
      trailGrad.addColorStop(1, "rgba(255, 255, 255, 0.90)");

      ctx.strokeStyle = trailGrad;
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(targetX, topY);
      ctx.lineTo(targetX, botY);
      ctx.stroke();

      // 2) 좌우 공기 가르는 날카로운 스피드 라인 (윗부분/뒷부분 100% 투명 페이드아웃 그라데이션)
      const speedGrad = ctx.createLinearGradient(0, topY + 12, 0, botY);
      speedGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
      speedGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.40)");
      speedGrad.addColorStop(1, "rgba(255, 255, 255, 0.95)");

      ctx.strokeStyle = speedGrad;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(targetX - 11, topY + 12);
      ctx.lineTo(targetX - 11, botY);
      ctx.moveTo(targetX + 11, topY + 12);
      ctx.lineTo(targetX + 11, botY);
      ctx.moveTo(targetX - 5, topY + 20);
      ctx.lineTo(targetX - 5, botY);
      ctx.moveTo(targetX + 5, topY + 20);
      ctx.lineTo(targetX + 5, botY);
      ctx.stroke();
    }

    drawFacetedBoulder(ctx, targetX, curY, 23, rot);
  }

  // Step 4: [신규] 돌이 머리를 쾅 내려침! (타격 섬광 & 먼지)
  else if (moveStep === 4) {
    // 1) 머리 직격 위치에 돌 바위 렌더링
    drawFacetedBoulder(ctx, targetX, impactY, 23, 7.5);

    // 2) 타격 순간 좌우 충격 먼지 퍼프 2개 분출
    drawSandDustPuff(ctx, targetX - 16, impactY + 4, 8, 0.75, "#D6D3D1");
    drawSandDustPuff(ctx, targetX + 16, impactY + 4, 8, 0.75, "#E7E5E4");
  }

  // Step 5: [피드백 반영] 타격 반동으로 돌이 좀 더 위로(36px) 튀어오르며 점진적 투명화 (중간프레임 지원)
  else if (moveStep === 5) {
    const bounceMax = 36;
    const bounceH = bounceMax * Math.sin(p * Math.PI * 0.5);
    const bounceY = impactY - bounceH;
    const rot = 7.5 + p * 1.0;
    const bounceAlpha = Math.max(0.48, 1.0 - p * 0.52);

    // 1) 아래에서 위로 튀어오른 은은한 반투명 모션 잔상
    if (bounceH > 4) {
      const bounceTrail = ctx.createLinearGradient(0, impactY, 0, bounceY);
      bounceTrail.addColorStop(0, "rgba(255, 255, 255, 0)");
      bounceTrail.addColorStop(0.5, `rgba(214, 211, 209, ${0.25 * p})`);
      bounceTrail.addColorStop(1, `rgba(255, 255, 255, ${0.50 * p})`);
      ctx.strokeStyle = bounceTrail;
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(targetX, impactY);
      ctx.lineTo(targetX, bounceY);
      ctx.stroke();
    }

    // 2) 좀 더 위로 튀면서 투명해진 돌 바위
    drawFacetedBoulder(ctx, targetX, bounceY, 22.5, rot, bounceAlpha);

    // 3) 타격 부위 잔여 먼지 퍼프
    const dustAlpha = Math.max(0, 0.45 * (1.0 - p * 0.5));
    drawSandDustPuff(ctx, targetX - 18, impactY + 5, 10, dustAlpha, "#D6D3D1");
    drawSandDustPuff(ctx, targetX + 18, impactY + 5, 10, dustAlpha, "#E7E5E4");
  }

  // Step 6: [신규] 튀어오른 높은 정점에서 돌이 콰앙 산산조각 깨짐! (모래먼지 폭발 + 파편 비산, 흰색 선 제거)
  else if (moveStep === 6) {
    const shatterY = impactY - 36;

    // 1) 모래먼지 구름 폭발 (7개 퍼프 구름 팽창)
    for (let i = 0; i < DUST_PUFFS.length; i++) {
      const puff = DUST_PUFFS[i];
      const curR = puff.baseR + (puff.maxR - puff.baseR) * p;
      const alpha = Math.max(0, 0.85 - p * 0.35);
      const px = targetX + puff.offX * (0.9 + p * 0.7);
      const py = shatterY + puff.offY * (0.9 + p * 0.7);
      drawSandDustPuff(ctx, px, py, curR, alpha, puff.color);
    }

    // 2) 미세 모래 알갱이 입자들 사방 비산 (16개)
    ctx.fillStyle = "#A8A29E";
    for (let i = 0; i < 16; i++) {
      const grainAngle = (i / 16) * Math.PI * 2 + 0.2;
      const grainDist = 12 + p * 42 + (i % 4) * 6;
      const gx = targetX + Math.cos(grainAngle) * grainDist;
      const gy = shatterY + Math.sin(grainAngle) * (grainDist * 0.75) + p * 8;
      ctx.fillRect(gx, gy, 2, 2);
    }

    // 3) 돌이 여러 개(10개)로 산산조각 쪼개지는 파편 효과 (흰색 선 없이 순수 파편 비산)
    const shardSpread = 12 + p * 36;
    for (let i = 0; i < ROCK_SHARDS.length; i++) {
      const shard = ROCK_SHARDS[i];
      const sx = targetX + Math.cos(shard.angle) * shardSpread;
      const sy = shatterY + Math.sin(shard.angle) * shardSpread * 0.75 + p * shard.dropOffset * 0.5;
      const rot = shard.rotSpeed * p * 2.5;
      drawFacetedBoulder(ctx, sx, sy, shard.size, rot, Math.max(0.25, 0.75 - p * 0.35));
    }
  }

  // Step 7: 쪼개진 돌들이 바닥으로 뿌려지며 떨어짐
  else if (moveStep === 7) {
    const shatterY = impactY - 36;
    const fallProgress = p;

    // 1) 쪼개진 돌들이 중력을 받아 바닥으로 쏟아져 내림
    for (let i = 0; i < ROCK_SHARDS.length; i++) {
      const shard = ROCK_SHARDS[i];
      const startX = targetX + Math.cos(shard.angle) * 38;
      const startY = shatterY + Math.sin(shard.angle) * 26 + shard.dropOffset * 0.5;
      const destY = groundY + (i % 3) * 3;

      const t = Math.min(1.0, fallProgress * 1.35);
      const sy = Math.min(destY, startY + (destY - startY) * (t * t));
      const sx = startX + (Math.cos(shard.angle) > 0 ? 1 : -1) * (12 + (i % 3) * 6) * t;
      const rot = shard.rotSpeed * (1.8 + fallProgress * 3.5);

      // 바닥 충돌 시 미니 먼지 퍼프
      if (sy >= destY - 2 && fallProgress > 0.4) {
        drawSandDustPuff(ctx, sx, destY, 5 + (i % 3) * 2, 0.45 * (1.0 - fallProgress), "#D6D3D1");
      }

      drawFacetedBoulder(ctx, sx, sy, Math.max(3.5, shard.size * (1.0 - fallProgress * 0.12)), rot);
    }

    // 2) 모래먼지 구름이 바닥으로 가라앉으며 넓게 타원형으로 확산
    const groundDustAlpha = Math.max(0, 0.55 - fallProgress * 0.35);
    ctx.fillStyle = `rgba(214, 211, 209, ${groundDustAlpha})`;
    ctx.beginPath();
    ctx.ellipse(targetX, groundY - 2, 45 + fallProgress * 25, 14 + fallProgress * 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 상공 잔여 엷은 먼지 퍼프들
    for (let i = 0; i < 4; i++) {
      const puff = DUST_PUFFS[i];
      const px = targetX + puff.offX * 1.2;
      const py = shatterY + puff.offY * 1.1 + fallProgress * 12;
      drawSandDustPuff(ctx, px, py, puff.maxR * (1.0 + fallProgress * 0.2), groundDustAlpha * 0.6, puff.color);
    }
  }

  // Step 8: 쪼개진 돌들이 바닥에 안착 & 모래먼지 부드럽게 페이드아웃
  else if (moveStep === 8) {
    const alpha = Math.max(0, 0.35 * (1.0 - p));

    // 바닥에 안착한 7개 작은 돌멩이 파편들
    for (let i = 0; i < 7; i++) {
      const offsetX = (i - 3) * 14 + ((i % 2) * 4 - 2);
      const shardY = groundY + (i % 2) * 3;
      drawFacetedBoulder(ctx, targetX + offsetX, shardY, 3.8 + (i % 3), i * 1.4);
    }

    // 바닥에 깔린 은은한 모래먼지 헤이즈 페이드아웃
    if (alpha > 0.01) {
      ctx.fillStyle = `rgba(214, 211, 209, ${alpha})`;
      ctx.beginPath();
      ctx.ellipse(targetX, groundY, 60, 15, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Step 9: 완료 및 복귀
  else if (moveStep === 9) {
    const alpha = Math.max(0, 1.0 - p * 2.0);
    if (alpha > 0.05) {
      for (let i = 0; i < 4; i++) {
        const offsetX = (i - 1.5) * 16;
        const shardY = groundY + (i % 2) * 3;
        drawFacetedBoulder(ctx, targetX + offsetX, shardY, 3.2, i * 1.4);
      }
    }
  }

  ctx.restore();
}

