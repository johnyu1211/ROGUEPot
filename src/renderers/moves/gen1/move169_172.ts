// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawMiniRetroStar, drawStarburstImpact } from "../common/helpers.js";
import { drawBillowingFlamePuff } from "./move053_056.js";

/**
 * Gen 2 Moves 169 - 172 Renderers
 * 
 * 169: 거미집 (Spider Web)
 * 170: 마음의눈 (Mind Reader)
 * 171: 악몽 (Nightmare)
 * 172: 화염자동차 (Flame Wheel)
 */

// ============================================================================
// 169: 거미집 (Spider Web)
// ============================================================================

/**
 * 거미집 8방향 방사선 및 동심 나선형 거미줄 기하학 렌더러
 * 
 * @param ctx 캔버스 2D 컨텍스트
 * @param cx 거미집 중심 X 좌표
 * @param cy 거미집 중심 Y 좌표
 * @param radius 현재 전개 반경 (px)
 * @param ringProgress 동심 링 전개 비율 (0.0 ~ 1.0)
 * @param alpha 전체 투명도 (0.0 ~ 1.0)
 * @param tensionWobble 미세 장력 진동 오프셋
 */
function drawSpiderWebGeometry(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  ringProgress: number = 1.0,
  alpha: number = 1.0,
  tensionWobble: number = 0
) {
  if (radius <= 2 || alpha <= 0.01) return;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const numSpokes = 8;
  const spokeAngles: number[] = [];
  for (let i = 0; i < numSpokes; i++) {
    // 8방향 균등 각도 (45도 간격)
    spokeAngles.push(i * (Math.PI / 4));
  }

  // 1. 방사형 축실 (8 Radial Spokes - 끝단 날카로운 바늘/침 형태 0px 테이퍼링)
  ctx.save();
  ctx.lineCap = "butt";
  ctx.lineWidth = 1.7;
  ctx.strokeStyle = `rgba(241, 245, 249, ${alpha * 0.95})`; // 순백/실버 실크 코어
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;

  for (let i = 0; i < numSpokes; i++) {
    const ang = spokeAngles[i];
    const ex = cx + Math.cos(ang) * radius * 1.05;
    const ey = cy + Math.sin(ang) * radius * 0.95;

    // 중심에서 외곽 교차선까지의 메인 축실
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    // 외곽 끝단을 날카로운 바늘 침(0px Needle Tip)으로 테이퍼링 연장
    const extLen = 12;
    const tipX = ex + Math.cos(ang) * extLen * 1.05;
    const tipY = ey + Math.sin(ang) * extLen * 0.95;
    const nx = -Math.sin(ang);
    const ny = Math.cos(ang);
    const halfBase = 0.85;

    ctx.beginPath();
    ctx.moveTo(tipX, tipY); // 끝단 0px 초정밀 바늘 끝
    ctx.lineTo(ex + nx * halfBase, ey + ny * halfBase);
    ctx.lineTo(ex - nx * halfBase, ey - ny * halfBase);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 2. 동심 나선 다각형 웹 링 (Concentric Polygon Web Rings - 4단)
  const ringDistances = [0.26, 0.50, 0.74, 0.96]; // 중심부터의 비율

  ringDistances.forEach((distFrac, ringIdx) => {
    // 해당 링이 전개 진행도에 도달했는지 확인
    const ringAppearThreshold = (ringIdx + 1) / (ringDistances.length + 1);
    if (ringProgress < ringAppearThreshold) return;

    // 해당 링의 페이드인 비율
    const ringAlphaFrac = Math.min(1.0, (ringProgress - ringAppearThreshold) * 4.0);
    const ringAlpha = alpha * ringAlphaFrac;

    const rCur = radius * distFrac;
    ctx.lineWidth = ringIdx === ringDistances.length - 1 ? 1.4 : 1.7;
    ctx.strokeStyle = `rgba(255, 255, 255, ${ringAlpha * 0.9})`;

    ctx.beginPath();
    for (let i = 0; i < numSpokes; i++) {
      const ang1 = spokeAngles[i];
      const ang2 = spokeAngles[(i + 1) % numSpokes];

      const p1x = cx + Math.cos(ang1) * rCur * 1.05;
      const p1y = cy + Math.sin(ang1) * rCur * 0.95;
      const p2x = cx + Math.cos(ang2) * rCur * 1.05;
      const p2y = cy + Math.sin(ang2) * rCur * 0.95;

      if (i === 0) {
        ctx.moveTo(p1x, p1y);
      }

      // 거미줄 특유의 안쪽으로 살짝 처지는 장력 현수선 곡선 (Inward Catenary Sag)
      // ang1에서 시계방향으로 정확히 절반 간격(Math.PI / numSpokes) 전진한 각도 사용 (원주 각도 랩어라운드 오류 방지)
      const midAng = ang1 + (Math.PI / numSpokes);
      const sagFactor = 0.88; // 중심 쪽으로 12% 장력 수축
      const ctrlX = cx + Math.cos(midAng) * rCur * 1.05 * sagFactor;
      const ctrlY = cy + Math.sin(midAng) * rCur * 0.95 * sagFactor;

      ctx.quadraticCurveTo(ctrlX, ctrlY, p2x, p2y);
    }
    ctx.closePath();
    ctx.stroke();

    // 3. 교차점 실크 매듭 방울 (순백 실크 노드)
    ctx.fillStyle = `rgba(255, 255, 255, ${ringAlpha * 0.95})`;
    for (let i = 0; i < numSpokes; i++) {
      const ang = spokeAngles[i];
      const nx = cx + Math.cos(ang) * rCur * 1.05;
      const ny = cy + Math.sin(ang) * rCur * 0.95;

      ctx.beginPath();
      ctx.arc(nx, ny, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // 4. 거미집 중심 코어 매듭 (Center Silk Hub)
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
  ctx.beginPath();
  ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 🕸️ 거미집 (Spider Web) 이펙트 렌더러
 * 
 * [연출 기승전결 시퀀스]:
 * 1. Step 1: 시전자 웅크림 힘 축적 & 입가 은백색 실크 에너지 응축
 * 2. Step 2: 시전자에서 상대를 향해 3가닥 유려한 실크 탄환 초고속 발사
 * 3. Step 3: 상대 전면에 8방향 방사선 & 4단 동심 다각형 거미줄 폭발적 전개
 * 4. Step 4: 거미줄의 팽팽한 장력 수축 진동 & 대상 몸통 이중 결박 밴드 속박 작렬
 * 5. Step 5: 대상 포켓몬 완전 결박 고정 (cannotEscape) & 은은한 점착 페이드아웃
 */
export function drawSpiderWebEffect(
  targetCtx: any,
  frameOrTargetPos: any,
  drawCtxOrStep?: any
) {
  if (!frameOrTargetPos) return;

  let frame: BattleFrame | null = null;
  let drawCtx: EffectDrawContext | null = null;
  let targetPos = { x: 380, y: 130 };
  let attackerPos = { x: 130, y: 260 };
  let moveStep = 2;
  let p = 0.5;
  let isPlayer = true;

  if (
    typeof frameOrTargetPos === "object" &&
    ("showEffect" in frameOrTargetPos || "moveStep" in frameOrTargetPos || "delay" in frameOrTargetPos)
  ) {
    frame = frameOrTargetPos as BattleFrame;
    drawCtx = drawCtxOrStep as EffectDrawContext;
    if (!frame.showEffect || !drawCtx?.targetPos) return;

    targetPos = drawCtx.targetPos;
    attackerPos = drawCtx.attackerPos || attackerPos;
    isPlayer = drawCtx.isPlayer ?? true;
    moveStep = frame.moveStep ?? 2;
    p = frame.effectProgress ?? 0.5;
  } else {
    targetPos = frameOrTargetPos;
    moveStep = typeof drawCtxOrStep === "number" ? drawCtxOrStep : 2;
    p = 0.5;
  }

  const ctx = targetCtx;
  const tx = targetPos.x;
  const ty = targetPos.y;
  const ax = attackerPos.x;
  const ay = attackerPos.y;

  // 실뿜기 좌표 규격 완벽 계승 (시전자 입/분출구 및 타겟 중심)
  const startX = ax + (isPlayer ? 10 : -10);
  const startY = ay - 12;
  const targetX = tx;
  const targetY = ty - 4;

  ctx.save();

  // 10% 어두운색 암전 (10% Dark Dim Overlay)
  let dimAlpha = 0;
  if (moveStep === 1) {
    dimAlpha = 0.10 * Math.min(1.0, p * 1.5);
  } else if (moveStep >= 2 && moveStep <= 4) {
    dimAlpha = 0.10;
  } else if (moveStep === 5) {
    dimAlpha = Math.max(0, 0.10 * (1.0 - p));
  }

  if (dimAlpha > 0.005) {
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${dimAlpha})`;
    ctx.fillRect(-5000, -5000, 12000, 12000);
    ctx.restore();
  }

  // ===========================================================================
  // Step 1: 시전자 입가 실크 에너지 응축 (실뿜기 고증)
  // ===========================================================================
  if (moveStep === 1) {
    const t = Math.max(0, Math.min(1.0, p));
    const r = 3.5 + t * 5;

    ctx.save();
    const grad = ctx.createRadialGradient(startX, startY, 1, startX, startY, r);
    grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    grad.addColorStop(0.6, "rgba(226, 232, 240, 0.75)");
    grad.addColorStop(1, "rgba(203, 213, 225, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(startX, startY, r, 0, Math.PI * 2);
    ctx.fill();

    // 주변 실크 에너지 수렴 파티클
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + t * 4;
      const dist = 6 + t * 6;
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.fillRect(startX + Math.cos(a) * dist - 1, startY + Math.sin(a) * dist - 1, 2, 2);
    }

    drawMiniRetroStar(ctx, startX + 6 * Math.cos(t * Math.PI * 3), startY + 6 * Math.sin(t * Math.PI * 3), 4, "#FFFFFF");
    ctx.restore();
  }

  // ===========================================================================
  // Step 2: 실뿜기 완벽 고증 - 2가닥 투명한 직선 실 발사 (독립된 침 형태)
  // ===========================================================================
  else if (moveStep === 2) {
    const t = Math.max(0, Math.min(1.0, p));
    const reach = Math.min(1.0, t * 1.15);

    const headX = startX + (targetX - startX) * reach;
    const headY = startY + (targetY - startY) * reach;

    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist; // 진행 방향 단위 벡터
    const uy = dy / dist;
    const nx = -dy / dist; // 수직 법선 단위 벡터
    const ny = dx / dist;

    // 서로 가까운 2가닥 직선 간격 (gap = 3.2px, 실뿜기 표준 규격)
    const gap = 3.2;

    const s1x = startX + nx * gap;
    const s1y = startY + ny * gap;
    const h1x = headX + nx * gap;
    const h1y = headY + ny * gap;

    const s2x = startX - nx * gap;
    const s2y = startY - ny * gap;
    const h2x = headX - nx * gap;
    const h2y = headY - ny * gap;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // 1번 직선 가닥 (약간 투명한 순백 실)
    ctx.beginPath();
    ctx.moveTo(s1x, s1y);
    ctx.lineTo(h1x, h1y);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 1.9;
    ctx.stroke();

    // 2번 직선 가닥 (약간 투명한 순백 실)
    ctx.beginPath();
    ctx.moveTo(s2x, s2y);
    ctx.lineTo(h2x, h2y);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 1.9;
    ctx.stroke();

    // 앞쪽 형태: 중앙 연결부(원 등) 없이, 양쪽 다 독립적으로 뾰족한 바늘/침 형태
    if (reach > 0.05) {
      const tipLength = 7.0;
      const tipHalfWidth = 1.2;

      // 1번 가닥 침
      const tip1X = h1x + ux * tipLength;
      const tip1Y = h1y + uy * tipLength;
      ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
      ctx.beginPath();
      ctx.moveTo(tip1X, tip1Y);
      ctx.lineTo(h1x + nx * tipHalfWidth - ux * 0.5, h1y + ny * tipHalfWidth - uy * 0.5);
      ctx.lineTo(h1x - nx * tipHalfWidth - ux * 0.5, h1y - ny * tipHalfWidth - uy * 0.5);
      ctx.closePath();
      ctx.fill();

      // 2번 가닥 침
      const tip2X = h2x + ux * tipLength;
      const tip2Y = h2y + uy * tipLength;
      ctx.beginPath();
      ctx.moveTo(tip2X, tip2Y);
      ctx.lineTo(h2x + nx * tipHalfWidth - ux * 0.5, h2y + ny * tipHalfWidth - uy * 0.5);
      ctx.lineTo(h2x - nx * tipHalfWidth - ux * 0.5, h2y - ny * tipHalfWidth - uy * 0.5);
      ctx.closePath();
      ctx.fill();
    }

    // 선두부 미세 순백 점착 스파클
    if (reach > 0.15) {
      drawMiniRetroStar(ctx, headX + ux * 4, headY + uy * 4, 3, "#FFFFFF");
    }

    ctx.restore();
  }

  // ===========================================================================
  // Step 3: 상대 전면에 거미집 방사형 폭발 전개 (Web Burst & Unfolding)
  // ===========================================================================
  else if (moveStep === 3) {
    const t = Math.max(0, Math.min(1.0, p));
    const webAlpha = Math.min(1.0, t * 1.4);

    // 탄성 오버슈트 전개: 빠르게 펴진 뒤 살짝 자리 잡음
    const easeOutElastic = 1.0 - Math.pow(1.0 - t, 2.5);
    const maxRadius = 58;
    const curRadius = Math.max(8, maxRadius * easeOutElastic);

    // 착탄 직후 실 가닥 페이드아웃 연결 잔향 (초반 0.4까지)
    if (t < 0.4) {
      const strandFade = (0.4 - t) / 0.4;
      const dx = targetX - startX;
      const dy = targetY - startY;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = -dy / dist;
      const ny = dx / dist;
      const gap = 3.2;

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = `rgba(255, 255, 255, ${strandFade * 0.75})`;
      ctx.beginPath();
      ctx.moveTo(startX + nx * gap, startY + ny * gap);
      ctx.lineTo(targetX + nx * gap, targetY + ny * gap);
      ctx.moveTo(startX - nx * gap, startY - ny * gap);
      ctx.lineTo(targetX - nx * gap, targetY - ny * gap);
      ctx.stroke();
      ctx.restore();
    }

    // 거미집 기하학 구조 렌더링
    drawSpiderWebGeometry(ctx, tx, ty, curRadius, t, webAlpha, 0);

    // 4방향 미니 실크 글린트
    if (t > 0.4) {
      drawMiniRetroStar(ctx, tx - 22, ty - 18, 4, "#FFFFFF");
      drawMiniRetroStar(ctx, tx + 24, ty + 16, 4, "#FFFFFF");
    }
  }

  // ===========================================================================
  // Step 4: 장력 수축 진동 & 몸통 결박 밴드 속박 (Tension Snap & Ensnarement)
  // ===========================================================================
  else if (moveStep === 4) {
    const t = Math.max(0, Math.min(1.0, p));
    const webAlpha = 1.0;

    // 팽팽해진 거미줄의 고주파 장력 진동 (Tension Vibration)
    const wobble = Math.sin(t * Math.PI * 8) * (1.8 * (1.0 - t * 0.4));
    const webRadius = 56 - Math.sin(t * Math.PI) * 2.5; // 살짝 조여듦

    // 거미집 본체 렌더링 (진동 포함)
    drawSpiderWebGeometry(ctx, tx + wobble, ty, webRadius, 1.0, webAlpha, 0);

    // 4방향 결박 록다운 순백 스파클 글린트
    ctx.save();
    drawMiniRetroStar(ctx, tx - 28, ty - 12, 4, "#FFFFFF");
    drawMiniRetroStar(ctx, tx + 26, ty - 14, 4, "#FFFFFF");
    drawMiniRetroStar(ctx, tx, ty + 24, 4, "#FFFFFF");
    ctx.restore();
  }

  // ===========================================================================
  // Step 5: 결박 완성 & 점착 페이드아웃 (Lockdown & Dissipate)
  // ===========================================================================
  else if (moveStep === 5) {
    const t = Math.max(0, Math.min(1.0, p));
    const settleAlpha = Math.max(0.0, 1.0 - t * 1.1);

    if (settleAlpha > 0.01) {
      drawSpiderWebGeometry(ctx, tx, ty, 54, 1.0, settleAlpha, 0);

      // 소산되는 은백색 실크 파티클
      ctx.save();
      const disperseCount = 5;
      for (let i = 0; i < disperseCount; i++) {
        const ang = (i / disperseCount) * Math.PI * 2 + t;
        const dist = 20 + t * 25;
        const sx = tx + Math.cos(ang) * dist;
        const sy = ty + Math.sin(ang) * dist * 0.7;

        ctx.fillStyle = `rgba(255, 255, 255, ${settleAlpha * 0.75})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  ctx.restore();
}

// ============================================================================
// 170: 마음의눈 (Mind Reader)
// ============================================================================

/**
 * 1. 암전 및 스포트라이트 오버레이
 * - Step 1: 전장 전체 암전 (Full Field Dimming)
 * - Step 2~5: 타겟 포켓몬 중심 스포트라이트 개방 (주변부는 어둡게 유지하여 속도선 및 구체 강조)
 */
function drawMindReaderDimOverlay(
  ctx: any,
  tx: number,
  ty: number,
  alpha: number,
  hasSpotlight: boolean = true
) {
  if (alpha <= 0.01) return;
  ctx.save();
  if (!hasSpotlight) {
    // 순수 전체 암전
    ctx.fillStyle = `rgba(6, 8, 18, ${alpha * 0.75})`;
    ctx.fillRect(-6000, -6000, 14000, 14000);
  } else {
    // 타겟 중심 스포트라이트 (중심부는 맑고 외곽으로 갈수록 짙은 암전)
    const grad = ctx.createRadialGradient(tx, ty, 32, tx, ty, 200);
    grad.addColorStop(0, `rgba(6, 8, 18, ${alpha * 0.12})`);
    grad.addColorStop(0.45, `rgba(6, 8, 18, ${alpha * 0.45})`);
    grad.addColorStop(0.85, `rgba(6, 8, 18, ${alpha * 0.72})`);
    grad.addColorStop(1.0, `rgba(6, 8, 18, ${alpha * 0.82})`);
    ctx.fillStyle = grad;
    ctx.fillRect(-6000, -6000, 14000, 14000);
  }
  ctx.restore();
}

/**
 * 2. 대상 포켓몬을 감싸는 반투명 역장 구체 (Translucent Mind Sphere)
 * - [첨부 이미지 고증]: 마릴을 구형으로 감싸는 은은한 광택과 테두리의 렌즈/버블 구체
 */
function drawMindReaderSphere(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number = 1.0,
  pulse: number = 0
) {
  if (radius <= 2 || alpha <= 0.01) return;

  const r = radius + pulse;

  ctx.save();

  // 구체 내부 미세 굴절 / 반투명 틴트
  const innerGrad = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.1, cx, cy, r);
  innerGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.08})`);
  innerGrad.addColorStop(0.65, `rgba(215, 230, 245, ${alpha * 0.06})`);
  innerGrad.addColorStop(0.92, `rgba(165, 200, 230, ${alpha * 0.18})`);
  innerGrad.addColorStop(1.0, `rgba(190, 220, 245, ${alpha * 0.32})`);

  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // 구체 외곽 글로우 링
  ctx.save();
  ctx.strokeStyle = `rgba(180, 215, 245, ${alpha * 0.35})`;
  ctx.lineWidth = 4.0;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 구체 메인 아웃라인
  ctx.save();
  ctx.strokeStyle = `rgba(220, 238, 252, ${alpha * 0.88})`;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 구체 상단/좌상단 렌즈 하이라이트 (은은하고 부드러운 반투명 처리)
  ctx.save();
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.20})`;
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 2.0, -Math.PI * 0.82, -Math.PI * 0.32);
  ctx.stroke();

  // 우하단 반사광 림
  ctx.strokeStyle = `rgba(200, 230, 255, ${alpha * 0.15})`;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 2.0, Math.PI * 0.22, Math.PI * 0.58);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

/**
 * 3. 개안하는 마음의 눈 (Mind's Eye Opening)
 * - [첨부 이미지 1:1 완벽 고증]:
 *   1. 유려한 아몬드 눈 윤곽 (짙은 갈색 에스프레소 테두리)
 *   2. 순백의 깨끗한 안구 흰자 (Sclera)
 *   3. 중앙의 둥근 적갈색 홍채 (Warm Amber/Hazel Brown Iris)
 *   4. 정중앙의 칠흑 동공 (Deep Black Pupil)
 *   5. 서서히 실눈에서 부릅뜨는 개안(開眼) 애니메이션
 */
function drawMindReaderEye(
  ctx: any,
  cx: number,
  cy: number,
  openProgress: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.translate(cx, cy);

  const hw = 24; // 눈 가로 반폭 (전체 폭: 48px)
  const maxHh = 16; // 눈 세로 반높이 (전체 높이: 32px)

  // 부드러운 개안 이징 (Cubic Ease-Out)
  const p = Math.max(0.02, Math.min(1.0, openProgress));
  const easedP = 1.0 - Math.pow(1.0 - p, 2.4);
  const curHh = Math.max(0.8, maxHh * easedP);

  // 1. 눈이 거의 감겨있을 때 (가로 실선 슬릿)
  if (p <= 0.06) {
    ctx.fillStyle = `rgba(43, 22, 12, ${alpha * 0.95})`;
    ctx.beginPath();
    ctx.moveTo(-hw, 0);
    ctx.quadraticCurveTo(0, -1.2, hw, 0);
    ctx.quadraticCurveTo(0, 1.2, -hw, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return;
  }

  // 개안 시 은은한 배경 후광 (Psychic Eye Halo)
  if (p >= 0.7) {
    const haloAlpha = alpha * (p - 0.7) * 0.8;
    const haloGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, 36);
    haloGrad.addColorStop(0, `rgba(255, 245, 220, ${haloAlpha * 0.45})`);
    haloGrad.addColorStop(0.5, `rgba(255, 220, 160, ${haloAlpha * 0.25})`);
    haloGrad.addColorStop(1, `rgba(255, 200, 120, 0)`);
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fill();
  }

  // 눈꺼풀 외곽 곡선 경로 정의 (아몬드 형태)
  const buildEyePath = () => {
    ctx.beginPath();
    ctx.moveTo(-hw, 0);
    // 상단 눈꺼풀 (자연스러운 완만한 아치)
    ctx.bezierCurveTo(-hw * 0.52, -curHh * 1.15, hw * 0.52, -curHh * 1.15, hw, 0);
    // 하단 눈꺼풀 (하향 완만한 아치)
    ctx.bezierCurveTo(hw * 0.52, curHh * 1.05, -hw * 0.52, curHh * 1.05, -hw, 0);
    ctx.closePath();
  };

  // 2. 안구 흰자 (Sclera) - 순백 채우기
  buildEyePath();
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.98})`;
  ctx.fill();

  // 3. 눈 내부 클리핑 (홍채 및 동공이 눈꺼풀 밖으로 삐져나가지 않도록 완벽 차단)
  ctx.save();
  buildEyePath();
  ctx.clip();

  // 4. 홍채 (Iris) - 첨부 이미지와 1:1 완벽 일치하는 적갈색/헤이즐 브라운 원형
  const irisR = 11.2;
  const irisGrad = ctx.createRadialGradient(0, 0, 1.0, 0, 0, irisR);
  irisGrad.addColorStop(0, `rgba(165, 84, 36, ${alpha})`);   // 중심부 따뜻한 앰버 브라운
  irisGrad.addColorStop(0.55, `rgba(122, 54, 21, ${alpha})`); // 중간부 리치 체스트넛 브라운
  irisGrad.addColorStop(0.85, `rgba(80, 34, 13, ${alpha})`);  // 외곽 딥 브라운
  irisGrad.addColorStop(1.0, `rgba(50, 20, 8, ${alpha})`);    // 최외곽 테두리 에스프레소

  ctx.fillStyle = irisGrad;
  ctx.beginPath();
  ctx.arc(0, 0, irisR, 0, Math.PI * 2);
  ctx.fill();

  // 홍채 미세 동심 텍스처 림
  ctx.strokeStyle = `rgba(60, 24, 10, ${alpha * 0.65})`;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(0, 0, irisR * 0.75, 0, Math.PI * 2);
  ctx.stroke();

  // 5. 정중앙 동공 (Deep Black Pupil) - 첨부 이미지 고증
  const pupilR = 5.0;
  ctx.fillStyle = `rgba(8, 8, 10, ${alpha * 0.98})`;
  ctx.beginPath();
  ctx.arc(0, 0, pupilR, 0, Math.PI * 2);
  ctx.fill();

  // 6. 극미세 안구 반사광 (자연스러운 생기)
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
  ctx.beginPath();
  ctx.arc(-3.0, -2.8, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // 클리핑 해제

  // 7. 눈꺼풀 윤곽 테두리 (Espresso Outline)
  buildEyePath();
  ctx.strokeStyle = `rgba(43, 22, 12, ${alpha * 0.95})`;
  ctx.lineWidth = 1.7;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();

  // 양 끝단 날카로운 눈꼬리 포인트 강조
  if (p > 0.4) {
    ctx.fillStyle = `rgba(43, 22, 12, ${alpha * 0.95})`;
    ctx.fillRect(-hw - 1.0, -0.6, 1.5, 1.2);
    ctx.fillRect(hw - 0.5, -0.6, 1.5, 1.2);
  }

  ctx.restore();
}

/**
 * 👁️ 마음의눈 (Mind Reader) 이펙트 렌더러
 * 
 * [유저 명시 연출 시퀀스]:
 * 1. 암전 (Step 1)
 * 2. 상대방 포켓몬 포커싱 & 구체가 생김 (Step 2)
 * 3. 역장 구체 안정화 & 정신 집중 (Step 3)
 * 4. 눈을 뜸 (이미지 1:1 고증: 안구 흰자 + 적갈색 홍채 + 칠흑 동공) (Step 4)
 * 5. 상대 궤적 완전 파악 및 각인 & 잔향 페이드아웃 (Step 5)
 */
export function drawMindReaderEffect(
  targetCtx: any,
  frameOrTargetPos: any,
  drawCtxOrStep?: any
) {
  if (!frameOrTargetPos) return;

  let frame: BattleFrame | null = null;
  let drawCtx: EffectDrawContext | null = null;
  let targetPos = { x: 380, y: 130 };
  let moveStep = 4;
  let p = 0.5;

  if (
    typeof frameOrTargetPos === "object" &&
    ("showEffect" in frameOrTargetPos || "moveStep" in frameOrTargetPos || "delay" in frameOrTargetPos)
  ) {
    frame = frameOrTargetPos as BattleFrame;
    drawCtx = drawCtxOrStep as EffectDrawContext;
    if (!frame.showEffect || !drawCtx?.targetPos) return;

    targetPos = drawCtx.targetPos;
    moveStep = frame.moveStep ?? 4;
    p = frame.effectProgress ?? 0.5;
  } else {
    targetPos = frameOrTargetPos;
    moveStep = typeof drawCtxOrStep === "number" ? drawCtxOrStep : 4;
    p = 0.5;
  }

  const ctx = targetCtx;
  const tx = targetPos.x;
  const ty = targetPos.y;

  ctx.save();

  // ===========================================================================
  // Step 1: 암전 (Darkness / Dimming Fade-In)
  // ===========================================================================
  if (moveStep === 1) {
    const dimAlpha = Math.min(1.0, p * 1.25);
    drawMindReaderDimOverlay(ctx, tx, ty, dimAlpha, false);
  }

  // ===========================================================================
  // Step 2: 상대방 포켓몬 포커싱 & 구체가 생김 (Focus & Sphere Expansion)
  // ===========================================================================
  else if (moveStep === 2) {
    const dimAlpha = 1.0;
    // 타겟 중심 스포트라이트 암전
    drawMindReaderDimOverlay(ctx, tx, ty, dimAlpha, true);

    // 구체 생성 팽창 애니메이션 (0 -> 46px 탄성 안착)
    const t = Math.max(0, Math.min(1.0, p));
    const easeOutBack = (x: number) => {
      const c1 = 1.5;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    };
    const sphereRadius = 46 * Math.min(1.04, Math.max(0.1, easeOutBack(t)));
    const sphereAlpha = Math.min(1.0, t * 1.6);
    drawMindReaderSphere(ctx, tx, ty, sphereRadius, sphereAlpha, 0);

    // 생성 초반 미세 확산 링 파동
    if (t < 0.6) {
      const waveProg = t / 0.6;
      ctx.save();
      ctx.strokeStyle = `rgba(220, 240, 255, ${(1.0 - waveProg) * 0.6})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(tx, ty, sphereRadius * (0.8 + waveProg * 0.4), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ===========================================================================
  // Step 3: 역장 구체 안정화 & 정신 집중 (Sphere Stabilization & Focus)
  // ===========================================================================
  else if (moveStep === 3) {
    const dimAlpha = 1.0;
    drawMindReaderDimOverlay(ctx, tx, ty, dimAlpha, true);

    // 구체 유지 (미세 호흡 펄스)
    const spherePulse = Math.sin(p * Math.PI * 2) * 1.0;
    drawMindReaderSphere(ctx, tx, ty, 46, 1.0, spherePulse);

    // 구체 내부 은은한 개안 전조 에너지 수렴 링
    const waveT = (p * 1.5) % 1.0;
    ctx.save();
    ctx.strokeStyle = `rgba(220, 240, 255, ${(1.0 - waveT) * 0.45})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(tx, ty, 46 * (0.35 + waveT * 0.6), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // ===========================================================================
  // Step 4: 눈을 뜸 (이미지 1:1 고증: 안구 흰자 + 적갈색 홍채 + 칠흑 동공 개안)
  // ===========================================================================
  else if (moveStep === 4) {
    const dimAlpha = 1.0;
    drawMindReaderDimOverlay(ctx, tx, ty, dimAlpha, true);

    // 구체 유지
    const spherePulse = Math.sin(p * Math.PI * 2) * 0.8;
    drawMindReaderSphere(ctx, tx, ty, 46, 1.0, spherePulse);

    // 마음의 눈 개안 (0.0 실눈 -> 1.0 완전 개안 응시)
    const eyeOpenProg = Math.min(1.0, p * 1.2);
    drawMindReaderEye(ctx, tx, ty, eyeOpenProg, 1.0);

    // 완전 개안 시 4방향 미니 스타버스트 글린트
    if (p >= 0.85) {
      drawMiniRetroStar(ctx, tx - 25, ty, 3.5, "#FFFFFF");
      drawMiniRetroStar(ctx, tx + 25, ty, 3.5, "#FFFFFF");
    }
  }

  // ===========================================================================
  // Step 5: 각인 완료 & 페이드아웃 (Imprint & Fadeout)
  // ===========================================================================
  else if (moveStep === 5) {
    const t = Math.max(0, Math.min(1.0, p));
    const fadeAlpha = Math.max(0.0, 1.0 - t * 1.15);

    if (fadeAlpha > 0.01) {
      drawMindReaderDimOverlay(ctx, tx, ty, fadeAlpha, true);
      drawMindReaderSphere(ctx, tx, ty, 46, fadeAlpha, 0);
      drawMindReaderEye(ctx, tx, ty, 1.0, fadeAlpha);
    }
  }

  ctx.restore();
}

// ============================================================================
// 171: 악몽 (Nightmare)
// ============================================================================

/**
 * 🌌 악몽 백그라운드 레이어 렌더러 (drawNightmareBehindEffect)
 * 
 * [유저 명시 연출]:
 * 1. Step 1~2: 암전 (어두움 100%, 대상 포켓몬 제외하고 전장 및 시전자 완전 칠흑)
 * 2. Step 3~4: 갑작스럽게 나타나는 사이코키네시스 배경필터 (비틀림 / Vortex Twist 효과 적용)
 * 3. Step 5: 악몽 각인 완료 및 부드러운 페이드아웃
 */
export function drawNightmareBehindEffect(
  targetCtx: any,
  frameOrTargetPos: any,
  drawCtxOrStep?: any
) {
  if (!targetCtx) return;

  let moveStep = 1;
  let p = 0.5;
  let targetPos = { x: 380, y: 130 };

  if (typeof frameOrTargetPos === "object" && frameOrTargetPos !== null) {
    if ("moveStep" in frameOrTargetPos || "showEffect" in frameOrTargetPos || "showBehindEffect" in frameOrTargetPos) {
      const frame = frameOrTargetPos as BattleFrame;
      const drawCtx = drawCtxOrStep as EffectDrawContext;
      // 프레임에서 showBehindEffect가 명시적으로 false이거나, 카메라 복귀(afterCameraReturn) 중이거나, moveStep이 없으면 즉시 종료
      if (frame.showBehindEffect === false || frame.afterCameraReturn || !frame.moveStep) {
        return;
      }
      moveStep = frame.moveStep;
      p = frame.effectProgress ?? 0.5;
      if (drawCtx?.targetPos) targetPos = drawCtx.targetPos;
    } else if ("x" in frameOrTargetPos) {
      targetPos = frameOrTargetPos;
      moveStep = typeof drawCtxOrStep === "number" ? drawCtxOrStep : 1;
    }
  } else if (typeof frameOrTargetPos === "number") {
    moveStep = frameOrTargetPos;
    p = typeof drawCtxOrStep === "number" ? drawCtxOrStep : 0.5;
  }

  const ctx = targetCtx;
  const tx = targetPos.x;
  const ty = targetPos.y;

  ctx.save();

  // ===========================================================================
  // Step 1 & 2: 암전 (어두움 100% - 대상 포켓몬 제외하고 전장 완전 칠흑 암전)
  // ===========================================================================
  if (moveStep === 1 || moveStep === 2) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(-6000, -6000, 16000, 16000);

    // Step 2 후반: 악몽 발현 직전 불길한 심연의 기운이 극미세하게 태동
    if (moveStep === 2 && p > 0.5) {
      const tensionAlpha = (p - 0.5) * 0.4;
      const tensionGrad = ctx.createRadialGradient(tx, ty, 30, tx, ty, 260);
      tensionGrad.addColorStop(0, `rgba(45, 0, 60, ${tensionAlpha * 0.5})`);
      tensionGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = tensionGrad;
      ctx.fillRect(-6000, -6000, 16000, 16000);
    }
  }

  // ===========================================================================
  // Step 3, 4, 5: 갑작스럽게 나타나는 사이코키네시스 배경필터 (비틀림 효과 적용)
  // ===========================================================================
  else if (moveStep >= 3 && moveStep <= 5) {
    // 1. 칠흑 암전 베이스 (Step 3~4는 100% 칠흑, Step 5는 0으로 부드럽고 완전한 페이드아웃)
    const darkAlpha = moveStep === 5 ? Math.max(0.0, 1.0 - p * 1.1) : 1.0;
    if (darkAlpha > 0.01) {
      ctx.fillStyle = `rgba(0, 0, 0, ${darkAlpha})`;
      ctx.fillRect(-6000, -6000, 16000, 16000);
    }

    // 갑작스러운 발현: Step 3은 페이드인 없이 즉시 100% 풀 강도로 폭발, Step 5 후반에는 완전 소멸!
    const filterAlpha = moveStep === 5 ? Math.max(0.0, 1.0 - p * 1.1) : 1.0;

    if (filterAlpha > 0.01) {
      // 대상 중심 심연 보라 오라 방사
      const coreDarkGrad = ctx.createRadialGradient(tx, ty, 20, tx, ty, 340);
      coreDarkGrad.addColorStop(0, `rgba(48, 4, 68, ${0.75 * filterAlpha})`);
      coreDarkGrad.addColorStop(0.65, `rgba(18, 1, 28, ${0.9 * filterAlpha})`);
      coreDarkGrad.addColorStop(1.0, `rgba(5, 0, 10, ${1.0 * filterAlpha})`);
      ctx.fillStyle = coreDarkGrad;
      ctx.fillRect(-6000, -6000, 16000, 16000);

      // 2. 비틀림이 적용된 공식 사이코키네시스 4색 네온 물결 스트라이프
      const PALETTE = [
        [245, 12, 245], // Electric Neon Magenta
        [175, 10, 248], // Vivid Psychic Violet
        [112, 10, 188], // Deep Indigo Violet
        [215, 60, 248], // Bright Lilac / Orchid
      ];

      const stripeH = 11.0;
      const minX = -320;
      const maxX = 820;
      const minY = -160;
      const maxY = 420;

      // 흘러내리는 하향 이동 및 위상 회전
      const downwardSpeed = 12;
      const yShift = (moveStep * downwardSpeed + p * 9) % (stripeH * 4);
      const phase = moveStep * 0.85 + p * 2.5;

      let stripeIdx = 0;
      for (let baseY = minY + yShift; baseY < maxY; baseY += stripeH) {
        const c = PALETTE[((stripeIdx % PALETTE.length) + PALETTE.length) % PALETTE.length];
        stripeIdx++;

        const yNorm = Math.min(1.0, Math.max(0.0, (baseY - (-50)) / 320));
        const alpha = (0.40 + yNorm * 0.40) * filterAlpha;

        const darken = 1.0 - yNorm * 0.25;
        const r = Math.round(c[0] * darken);
        const g = Math.round(c[1] * darken);
        const b = Math.round(c[2] * darken);

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.beginPath();

        // 상단 경계선 (minX -> maxX, 비틀림 왜곡 수식)
        const calcDistortedY = (x: number, yBase: number) => {
          const dx = x - tx;
          const dy = yBase - ty;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const theta = Math.atan2(dy, dx);

          // 1) 대상 중심 소용돌이 비틀림 (Radial Vortex Swirl)
          const swirlFactor = 160 / (dist + 65);
          const swirlAngle = swirlFactor * 2.2 * Math.sin(phase + moveStep * 0.7);
          const swirlDispY = -Math.sin(theta + swirlAngle) * (swirlFactor * 26);
          const swirlDispX = Math.cos(theta + swirlAngle) * (swirlFactor * 16);

          // 2) 다중 비틀림 복합 파동 (Compound Distortion Waves)
          const effX = x + swirlDispX;
          const w1 = Math.sin(effX * 0.08 + phase * 3.2) * 13;
          const w2 = Math.sin(effX * 0.15 - yBase * 0.035 + phase * 2.0) * 8;
          const w3 = Math.cos(dx * 0.045 + dy * 0.04 - phase * 3.0) * (6 + swirlFactor * 12);

          // 3) 현실 왜곡 전단 응력 (Reality Shear)
          const shear = Math.sin(dx * 0.032) * Math.cos(dy * 0.032) * 14;

          return yBase + swirlDispY + w1 + w2 + w3 + shear;
        };

        const stepX = 7;
        for (let x = minX; x <= maxX; x += stepX) {
          const dyTop = calcDistortedY(x, baseY);
          if (x === minX) ctx.moveTo(x, dyTop);
          else ctx.lineTo(x, dyTop);
        }

        // 하단 경계선 (maxX -> minX)
        for (let x = maxX; x >= minX; x -= stepX) {
          const dyBot = calcDistortedY(x, baseY + stripeH);
          ctx.lineTo(x, dyBot);
        }

        ctx.closePath();
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

/**
 * 🌌 악몽 전경 이펙트 렌더러 (drawNightmareEffect)
 * 
 * 유저 요청:
 * - 눈 제거
 * - ( ) 형태 제거
 * - 100% 암전(대상 제외) 속에서 비틀린 사이코키네시스 배경필터와 함께 미세 심연 에너지 입자만 은은하게 연출
 */
export function drawNightmareEffect(
  targetCtx: any,
  frameOrTargetPos: any,
  drawCtxOrStep?: any
) {
  if (!targetCtx) return;

  let moveStep = 3;
  let p = 0.5;
  let targetPos = { x: 380, y: 130 };

  if (typeof frameOrTargetPos === "object" && frameOrTargetPos !== null) {
    if ("moveStep" in frameOrTargetPos || "showEffect" in frameOrTargetPos) {
      const frame = frameOrTargetPos as BattleFrame;
      const drawCtx = drawCtxOrStep as EffectDrawContext;
      if (frame.showEffect === false || frame.afterCameraReturn || !frame.moveStep) {
        return;
      }
      moveStep = frame.moveStep;
      p = frame.effectProgress ?? 0.5;
      if (drawCtx?.targetPos) targetPos = drawCtx.targetPos;
    } else if ("x" in frameOrTargetPos) {
      targetPos = frameOrTargetPos;
      moveStep = typeof drawCtxOrStep === "number" ? drawCtxOrStep : 3;
    }
  } else if (typeof frameOrTargetPos === "number") {
    moveStep = frameOrTargetPos;
    p = typeof drawCtxOrStep === "number" ? drawCtxOrStep : 3;
  }

  const ctx = targetCtx;
  const tx = targetPos.x;
  const ty = targetPos.y;

  ctx.save();

  // Step 1 & 2: 완전한 암전 속 대상 포켓몬 고요
  if (moveStep === 1 || moveStep === 2) {
    // 순수 암전
  }

  // Step 3 & 4: 비틀린 사이코키네시스 배경필터와 연동되는 은은한 심연 파티클
  else if (moveStep === 3 || moveStep === 4) {
    const particleAlpha = moveStep === 3 ? Math.min(0.8, p * 1.5) : 0.8;
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const px = tx + Math.sin(p * 4 + i * 1.5) * (20 + i * 4);
      const py = ty + 12 - ((p * 35 + i * 8) % 36);
      ctx.fillStyle = i % 2 === 0 
        ? `rgba(245, 12, 245, ${particleAlpha * 0.75})` 
        : `rgba(175, 10, 248, ${particleAlpha * 0.75})`;
      ctx.beginPath();
      ctx.arc(px, py, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Step 5: 악몽 흡수 및 페이드아웃
  else if (moveStep === 5) {
    const fadeAlpha = Math.max(0.0, 1.0 - p * 1.2);
    if (fadeAlpha > 0.01) {
      ctx.save();
      const r = 20 * (1.0 - p * 0.5);
      const absorbGrad = ctx.createRadialGradient(tx, ty, 2, tx, ty, r);
      absorbGrad.addColorStop(0, `rgba(245, 12, 245, ${fadeAlpha * 0.4})`);
      absorbGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = absorbGrad;
      ctx.beginPath();
      ctx.arc(tx, ty, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
}

// ============================================================================
// 172: 화염바퀴 (Flame Wheel / かえんぐるま)
// ============================================================================

/**
 * 화염바퀴 고유 헬퍼: 유선형 회전 불꽃 혓바닥 (Streamlined Whirling Flame Tongue)
 * - 바퀴의 림 둘레를 따라 반시계방향(CCW)으로 휘몰아치며 타오르는 불꽃 혓바닥
 * - 바퀴 회전 접선 방향 뒤쪽으로 날카롭게 뻗어 나가는 유기적 화염 꼬리
 */
function drawWheelFlameTongue(
  ctx: any,
  x: number,
  y: number,
  size: number,
  tangentAngle: number,
  alpha: number = 1.0,
  seed: number = 0
) {
  if (alpha <= 0.01 || size <= 0.5) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tangentAngle);

  const len = size * 2.2;
  const w = size * 0.95;

  // 1. 외곽 100% 투명 페이드 방사형 화염 혓바닥 (하드라인 완전 제거)
  const grad = ctx.createRadialGradient(-len * 0.15, 0, 0, -len * 0.15, 0, len * 0.95);
  grad.addColorStop(0.0, `rgba(255, 255, 255, ${alpha * 0.95})`);
  grad.addColorStop(0.20, `rgba(254, 240, 138, ${alpha * 0.90})`);
  grad.addColorStop(0.55, `rgba(249, 115, 22, ${alpha * 0.65})`);
  grad.addColorStop(0.82, `rgba(239, 68, 68, ${alpha * 0.30})`);
  grad.addColorStop(1.0, "rgba(220, 38, 38, 0.0)"); // 100% 투명 페이드

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(w * 0.35, 0);
  ctx.quadraticCurveTo(0, -w, -len * 0.65, -w * 0.4);
  ctx.lineTo(-len, 0);
  ctx.quadraticCurveTo(-len * 0.65, w * 0.4, 0, w);
  ctx.closePath();
  ctx.fill();

  // 2. 내부 초고열 코어 (황금-백색 투명 페이드)
  const coreLen = len * 0.55;
  const coreW = w * 0.55;
  const coreGrad = ctx.createRadialGradient(-coreLen * 0.1, 0, 0, -coreLen * 0.1, 0, coreLen * 0.9);
  coreGrad.addColorStop(0.0, `rgba(255, 255, 255, ${alpha * 0.98})`);
  coreGrad.addColorStop(0.40, `rgba(254, 240, 138, ${alpha * 0.85})`);
  coreGrad.addColorStop(1.0, "rgba(249, 115, 22, 0.0)");

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.moveTo(coreW * 0.3, 0);
  ctx.quadraticCurveTo(0, -coreW, -coreLen * 0.7, -coreW * 0.3);
  ctx.lineTo(-coreLen, 0);
  ctx.quadraticCurveTo(-coreLen * 0.7, coreW * 0.3, 0, coreW);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 🔥 화염바퀴 고유 헬퍼: 링 궤도를 따라 뒤쪽으로 유려하게 휘어지는 불꼬리 (Curved Arc Flame Tail)
 * - [유저 요청] 6개의 회전 화염 구체 뒤를 반시계 회전 궤적에 맞춰 따라오는 역동적인 혜성 불꼬리
 * - 테이퍼링(선단으로 갈수록 날카롭게 가늘어짐) + 원심력 외곽 전개 + 100% 외곽 투명 페이드아웃
 */
function drawCurvedFlameTail(
  ctx: any,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  theta: number,
  tailAngle: number = 0.82,
  headSize: number = 11,
  alpha: number = 1.0,
  seed: number = 0
) {
  if (alpha <= 0.01 || headSize <= 0.5) return;
  ctx.save();

  // 1. 헤드(불머리) 중심 좌표
  const hx = cx + Math.cos(theta) * rx;
  const hy = cy + Math.sin(theta) * ry;

  // 2. 링 원주 궤도를 따라 뒤쪽(+tailAngle)으로 휘어지는 불꼬리 리본 패스
  const NUM_STEPS = 14;
  const outerPts: { x: number; y: number }[] = [];
  const innerPts: { x: number; y: number }[] = [];

  const baseWidth = headSize * 1.05;

  for (let s = 0; s <= NUM_STEPS; s++) {
    const t = s / NUM_STEPS; // 0 = 헤드, 1 = 꼬리 끝
    const ang = theta + t * tailAngle;

    // 원심력에 의해 꼬리가 원호 바깥쪽으로 날리는 자연스러운 플레어
    const flare = 1.0 + t * 0.12 + Math.sin(t * Math.PI) * 0.04;
    const curRx = rx * flare;
    const curRy = ry * flare;

    const centerArcX = cx + Math.cos(ang) * curRx;
    const centerArcY = cy + Math.sin(ang) * curRy;

    // 테이퍼링 너비 (꼬리 끝으로 갈수록 비선형적으로 날카롭게 수렴)
    const w = baseWidth * Math.pow(1.0 - t, 1.25);

    // 원호 법선 벡터 (반경 방향 외곽 / 내곽 분할)
    const cosA = Math.cos(ang);
    const sinA = Math.sin(ang);

    // 유기적인 불꽃 요동 (Flicker wave)
    const wave = Math.sin(t * Math.PI * 2.5 + seed) * (headSize * 0.14 * (1.0 - t));

    const outW = w * 0.65 + wave;
    const inW = w * 0.45 - wave * 0.5;

    outerPts.push({
      x: centerArcX + cosA * outW,
      y: centerArcY + sinA * outW,
    });
    innerPts.push({
      x: centerArcX - cosA * inW,
      y: centerArcY - sinA * inW,
    });
  }

  const tipX = (outerPts[NUM_STEPS].x + innerPts[NUM_STEPS].x) * 0.5;
  const tipY = (outerPts[NUM_STEPS].y + innerPts[NUM_STEPS].y) * 0.5;

  // A. [외곽 타오르는 주황/적색 불꼬리 본체 (Outer Flame Body)]
  ctx.beginPath();
  ctx.moveTo(outerPts[0].x, outerPts[0].y);
  for (let s = 1; s <= NUM_STEPS; s++) {
    ctx.lineTo(outerPts[s].x, outerPts[s].y);
  }
  for (let s = NUM_STEPS; s >= 0; s--) {
    ctx.lineTo(innerPts[s].x, innerPts[s].y);
  }
  ctx.closePath();

  // 헤드에서 꼬리 끝으로 이어지는 유려한 선형 그라데이션 (선단 100% 투명 페이드아웃)
  const tailGrad = ctx.createLinearGradient(hx, hy, tipX, tipY);
  tailGrad.addColorStop(0.0, `rgba(255, 240, 138, ${alpha * 0.95})`);
  tailGrad.addColorStop(0.20, `rgba(254, 240, 138, ${alpha * 0.90})`);
  tailGrad.addColorStop(0.50, `rgba(249, 115, 22, ${alpha * 0.75})`);
  tailGrad.addColorStop(0.82, `rgba(239, 68, 68, ${alpha * 0.40})`);
  tailGrad.addColorStop(1.0, "rgba(220, 38, 38, 0.0)"); // 100% 외곽 투명화

  ctx.fillStyle = tailGrad;
  ctx.fill();

  // B. [내부 백열-황금 코어 불꼬리 (High-heat Core Tail)]
  const CORE_STEPS = 8;
  const coreAlpha = alpha * 0.98;
  const coreOuterPts: { x: number; y: number }[] = [];
  const coreInnerPts: { x: number; y: number }[] = [];

  for (let s = 0; s <= CORE_STEPS; s++) {
    const t = (s / CORE_STEPS) * 0.58; // 꼬리 길이의 58%까지 전개
    const ang = theta + t * tailAngle;
    const flare = 1.0 + t * 0.06;
    const curRx = rx * flare;
    const curRy = ry * flare;

    const centerArcX = cx + Math.cos(ang) * curRx;
    const centerArcY = cy + Math.sin(ang) * curRy;

    const w = baseWidth * 0.52 * Math.pow(1.0 - (s / CORE_STEPS), 1.15);
    const cosA = Math.cos(ang);
    const sinA = Math.sin(ang);

    coreOuterPts.push({ x: centerArcX + cosA * (w * 0.55), y: centerArcY + sinA * (w * 0.55) });
    coreInnerPts.push({ x: centerArcX - cosA * (w * 0.45), y: centerArcY - sinA * (w * 0.45) });
  }

  ctx.beginPath();
  ctx.moveTo(coreOuterPts[0].x, coreOuterPts[0].y);
  for (let s = 1; s <= CORE_STEPS; s++) {
    ctx.lineTo(coreOuterPts[s].x, coreOuterPts[s].y);
  }
  for (let s = CORE_STEPS; s >= 0; s--) {
    ctx.lineTo(coreInnerPts[s].x, coreInnerPts[s].y);
  }
  ctx.closePath();

  const coreTipX = (coreOuterPts[CORE_STEPS].x + coreInnerPts[CORE_STEPS].x) * 0.5;
  const coreTipY = (coreOuterPts[CORE_STEPS].y + coreInnerPts[CORE_STEPS].y) * 0.5;

  const coreGrad = ctx.createLinearGradient(hx, hy, coreTipX, coreTipY);
  coreGrad.addColorStop(0.0, `rgba(255, 255, 255, ${coreAlpha})`);
  coreGrad.addColorStop(0.35, `rgba(254, 240, 138, ${coreAlpha * 0.90})`);
  coreGrad.addColorStop(0.75, `rgba(249, 115, 22, ${coreAlpha * 0.55})`);
  coreGrad.addColorStop(1.0, "rgba(239, 68, 68, 0.0)");

  ctx.fillStyle = coreGrad;
  ctx.fill();

  // C. [헤드 화염구 (Blazing Orb Head)]
  const headR = baseWidth * 0.65;
  const headGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, headR * 1.35);
  headGrad.addColorStop(0.0, `rgba(255, 255, 255, ${alpha * 0.98})`);
  headGrad.addColorStop(0.35, `rgba(254, 240, 138, ${alpha * 0.92})`);
  headGrad.addColorStop(0.70, `rgba(249, 115, 22, ${alpha * 0.60})`);
  headGrad.addColorStop(1.0, "rgba(239, 68, 68, 0.0)");

  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.arc(hx, hy, headR * 1.35, 0, Math.PI * 2);
  ctx.fill();

  // D. [꼬리 끝단 비산 불티 (Trailing Embers)]
  const emberT = 0.88;
  const emberAng = theta + emberT * tailAngle;
  const emberX = cx + Math.cos(emberAng) * (rx * 1.14);
  const emberY = cy + Math.sin(emberAng) * (ry * 1.14);
  ctx.fillStyle = seed % 2 === 0 ? `rgba(255, 255, 255, ${alpha * 0.92})` : `rgba(254, 240, 138, ${alpha * 0.85})`;
  ctx.beginPath();
  ctx.arc(emberX, emberY, 1.4, 0, Math.PI * 2);
  ctx.fill();

  // E. [유저 요청] 불꼬리 뒤를 따라오는 붉은 연기 (Trailing Red Smoke Wisps)
  // 불꼬리 선단 뒤쪽 궤도(+tailAngle ~ +tailAngle + 0.38)를 따라 부풀어 오르는 붉은 연기 타래
  const SMOKE_PUFFS = 3;
  for (let sp = 1; sp <= SMOKE_PUFFS; sp++) {
    const sFrac = sp / SMOKE_PUFFS;
    const smokeAng = theta + tailAngle + sFrac * 0.38 + (seed % 3) * 0.04;
    // 원심력으로 연기가 바퀴 바깥쪽으로 부풀어 오르며 확산 (Centrifugal Smoke Expansion)
    const smokeDistR = 1.08 + sFrac * 0.20;
    const smX = cx + Math.cos(smokeAng) * (rx * smokeDistR);
    const smY = cy + Math.sin(smokeAng) * (ry * smokeDistR);
    const smRadius = (headSize * 0.55 + sFrac * 6.5) * (0.85 + Math.sin(seed + sp) * 0.15);
    const smAlpha = Math.max(0, (alpha * 0.65) * (1.0 - sFrac * 0.55));

    if (smAlpha > 0.01) {
      const smGrad = ctx.createRadialGradient(smX, smY, smRadius * 0.15, smX, smY, smRadius);
      smGrad.addColorStop(0.0, `rgba(185, 28, 28, ${smAlpha * 0.85})`); // 진한 붉은 연기 코어
      smGrad.addColorStop(0.40, `rgba(153, 27, 27, ${smAlpha * 0.60})`);
      smGrad.addColorStop(0.75, `rgba(127, 29, 29, ${smAlpha * 0.30})`);
      smGrad.addColorStop(1.0, "rgba(69, 10, 10, 0.0)"); // 100% 외곽 투명 페이드

      ctx.fillStyle = smGrad;
      ctx.beginPath();
      ctx.arc(smX, smY, smRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * 🔥 화염바퀴 후면 레이어 (drawFlameWheelBehindEffect)
 * - 포켓몬 스프라이트 뒤에 렌더링되어 포켓몬이 화염바퀴 '내부'에 위치하도록 입체감 부여
 * - 1) 바퀴 뒤쪽 반원 화염 아우라 및 후방 화염 혓바닥
 * - 2) 돌진 시(Step 2) 지면에 남는 작열하는 타오르는 화염 궤적 (Ground Fire Scorch)
 * - 3) 돌진 시 후방으로 뿜어져 나가는 거대한 화염 잔상 구름 (drawBillowingFlamePuff)
 * - 4) 타격 시(Step 3) 피격자 후방 작열 열기 아우라
 */
export function drawFlameWheelBehindEffect(
  targetCtx: any,
  frameOrTargetPos: any,
  drawCtxOrStep?: any
) {
  if (!targetCtx) return;

  let moveStep = 1;
  let p = 0.5;
  let isP = true;
  let isHit = true;
  let casterPos = { x: 80, y: 200 };
  let attackerPos = { x: 80, y: 200 };
  let targetPos = { x: 380, y: 130 };

  if (typeof frameOrTargetPos === "object" && frameOrTargetPos !== null) {
    const frame = frameOrTargetPos as BattleFrame;
    const drawCtx = drawCtxOrStep as EffectDrawContext;
    if (frame.showEffect === false && frame.showBehindEffect === false) return;
    if (frame.afterCameraReturn) return;

    moveStep = frame.moveStep ?? 1;
    p = frame.effectProgress ?? 0.5;
    if (drawCtx) {
      if (drawCtx.casterPos) casterPos = drawCtx.casterPos;
      if (drawCtx.attackerPos) attackerPos = drawCtx.attackerPos;
      if (drawCtx.targetPos) targetPos = drawCtx.targetPos;
      if (drawCtx.isPlayer !== undefined) isP = drawCtx.isPlayer;
      if (drawCtx.isHit !== undefined) isHit = drawCtx.isHit;
    }
  }

  const ctx = targetCtx;
  const cx = casterPos.x;
  const cy = casterPos.y;
  const ax = attackerPos.x;
  const ay = attackerPos.y;
  const tx = targetPos.x;
  const ty = targetPos.y;

  ctx.save();

  // ==========================================================================
  // Step 1: 회전 시동 & 화염바퀴 형성 (후면 아우라 & 후방 화염)
  // ==========================================================================
  if (moveStep === 1) {
    // [유저 요청] 회전 시작 시 링이 즉시 나타나지 않고 점진적으로 부드럽게 페이드인 (Fade-in)
    const progressFrac = Math.max(0, Math.min(1.0, (p - 0.10) / 0.75));
    const wheelAlpha = Math.pow(progressFrac, 1.4);
    const radiusX = 33;
    const radiusY = 47; // [유저 요청] 살짝 세로가 긴 타원형
    const spinAngle = -p * Math.PI * 6.0; // 반시계 회전

    // 1. [유저 요청 수정] 바퀴 중심 완전 투명화 & 림 외곽 은은한 아우라
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radiusX * 1.55);
    bgGrad.addColorStop(0.00, "rgba(0, 0, 0, 0.0)"); // 중심부 완전 투명화
    bgGrad.addColorStop(0.40, "rgba(0, 0, 0, 0.0)");
    bgGrad.addColorStop(0.52, `rgba(220, 38, 38, ${wheelAlpha * 0.12})`);
    bgGrad.addColorStop(0.65, `rgba(239, 68, 68, ${wheelAlpha * 0.22})`);
    bgGrad.addColorStop(1.00, "rgba(220, 38, 38, 0.0)"); // 100% 외곽 투명화

    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, radiusX * 1.55, radiusY * 1.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. 바퀴 뒤쪽 반원 (z < 0) 림 아크
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = `rgba(239, 68, 68, ${wheelAlpha * 0.65})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, radiusX, radiusY, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
  }

  // ==========================================================================
  // Step 2: 화염바퀴 돌진 (지면 타오르는 궤적 & 거대 후방 제트 화염 잔상)
  // ==========================================================================
  else if (moveStep === 2) {
    const rushDir = isP ? 1 : -1;
    const spinAngle = -(1.0 + p * 1.5) * Math.PI * 8.0;
    const radiusX = 33;
    const radiusY = 47; // [유저 요청] 살짝 세로가 긴 타원형

    // 0. [유저 요청 수정] 돌진 시 바퀴 중심 완전 투명화 & 림 외곽 온기
    const dashBgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radiusX * 1.55);
    dashBgGrad.addColorStop(0.00, "rgba(0, 0, 0, 0.0)"); // 중심부 완전 투명화
    dashBgGrad.addColorStop(0.40, "rgba(0, 0, 0, 0.0)");
    dashBgGrad.addColorStop(0.52, "rgba(220, 38, 38, 0.15)");
    dashBgGrad.addColorStop(0.65, "rgba(239, 68, 68, 0.25)");
    dashBgGrad.addColorStop(1.00, "rgba(220, 38, 38, 0.0)"); // 100% 외곽 투명화

    ctx.fillStyle = dashBgGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, radiusX * 1.55, radiusY * 1.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. 지면 타오르는 궤적 (Ground Fire Scorch Trail)
    const groundStartY = ay + 22;
    const groundCurY = cy + 22;
    const trailGrad = ctx.createLinearGradient(ax, groundStartY, cx, groundCurY);
    trailGrad.addColorStop(0.0, "rgba(239, 68, 68, 0.0)");
    trailGrad.addColorStop(0.35, "rgba(239, 68, 68, 0.45)");
    trailGrad.addColorStop(0.75, "rgba(249, 115, 22, 0.85)");
    trailGrad.addColorStop(1.0, "rgba(254, 240, 138, 0.95)");

    ctx.save();
    ctx.strokeStyle = "rgba(40, 18, 8, 0.55)";
    ctx.lineWidth = 8.0;
    ctx.beginPath();
    ctx.moveTo(ax, groundStartY);
    ctx.lineTo(cx, groundCurY);
    ctx.stroke();

    ctx.strokeStyle = trailGrad;
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(ax, groundStartY);
    ctx.lineTo(cx, groundCurY);
    ctx.stroke();
    ctx.restore();

    // 지면 궤적 중간에 피어오르는 미세 불꽃 혓바닥 4개
    for (let k = 1; k <= 4; k++) {
      const frac = k / 5;
      const gx = ax + (cx - ax) * frac;
      const gy = groundStartY + (groundCurY - groundStartY) * frac;
      const gAlpha = frac * 0.85;
      drawWheelFlameTongue(ctx, gx, gy - 2, 7, -Math.PI * 0.5 + (k % 2 === 0 ? 0.3 : -0.3), gAlpha, k * 11);
    }

    // 2. 바퀴 뒤쪽으로 뿜어져 나가는 거대한 화염 잔상 구름 (drawBillowingFlamePuff)
    const wakeAngles = isP ? [-Math.PI * 0.88, -Math.PI * 0.95, -Math.PI * 0.80] : [Math.PI * 0.12, Math.PI * 0.05, Math.PI * 0.20];
    for (let w = 1; w <= 3; w++) {
      const dist = 18 + w * 16;
      const wx = cx - rushDir * dist * 0.95;
      const wy = cy + dist * 0.32 - Math.sin(p * 6 + w) * 3;
      const wRadius = 16 + w * 4;
      const wAlpha = Math.max(0, 0.90 - w * 0.22);
      drawBillowingFlamePuff(
        ctx,
        wx,
        wy,
        wRadius,
        wakeAngles[w - 1],
        spinAngle * 0.5 + w * 1.5,
        wAlpha,
        w * 13 + 5,
        w > 1
      );
    }

    // 2-B. [유저 요청] 돌진 시 바퀴 뒤를 따라오는 거대한 붉은 연기 구름 흔적 (Trailing Red Smoke Plumes)
    for (let sm = 1; sm <= 4; sm++) {
      const smDist = 22 + sm * 18;
      const smX = cx - rushDir * smDist * 0.95;
      const smY = cy + (smDist * 0.28) - Math.sin(p * 7.0 + sm * 1.6) * 4;
      const smR = 15 + sm * 5;
      const smAlpha = Math.max(0, (1.0 - sm * 0.20) * 0.65);

      if (smAlpha > 0.01) {
        const smGrad = ctx.createRadialGradient(smX, smY, smR * 0.15, smX, smY, smR);
        smGrad.addColorStop(0.0, `rgba(185, 28, 28, ${smAlpha * 0.85})`);
        smGrad.addColorStop(0.40, `rgba(153, 27, 27, ${smAlpha * 0.60})`);
        smGrad.addColorStop(0.75, `rgba(127, 29, 29, ${smAlpha * 0.30})`);
        smGrad.addColorStop(1.0, "rgba(69, 10, 10, 0.0)");

        ctx.fillStyle = smGrad;
        ctx.beginPath();
        ctx.arc(smX, smY, smR, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. 바퀴 뒤쪽 림 아크
    ctx.lineWidth = 5.0;
    ctx.strokeStyle = "rgba(239, 68, 68, 0.75)";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 35, 41, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
  }

  // ==========================================================================
  // Step 3: 충돌 직격 & 후방 화염 아우라
  // ==========================================================================
  else if (moveStep === 3) {
    if (isHit) {
      const blastAlpha = Math.max(0, 1.0 - p * 0.85);
      if (blastAlpha > 0.01) {
        const blastGrad = ctx.createRadialGradient(tx, ty, 8, tx, ty, 85);
        blastGrad.addColorStop(0.0, `rgba(255, 255, 255, ${blastAlpha * 0.75})`);
        blastGrad.addColorStop(0.25, `rgba(254, 240, 138, ${blastAlpha * 0.65})`);
        blastGrad.addColorStop(0.60, `rgba(249, 115, 22, ${blastAlpha * 0.40})`);
        blastGrad.addColorStop(0.85, `rgba(239, 68, 68, ${blastAlpha * 0.18})`);
        blastGrad.addColorStop(1.0, "rgba(220, 38, 38, 0.0)");

        ctx.fillStyle = blastGrad;
        ctx.beginPath();
        ctx.arc(tx, ty, 85, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ==========================================================================
  // Step 4: 복귀 및 잔여 열기 소멸
  // ==========================================================================
  else if (moveStep === 4) {
    const fadeAlpha = Math.max(0, 1.0 - p * 1.1);
    if (fadeAlpha > 0.01) {
      const r = 26 * (1.0 - p * 0.4);
      const settleGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
      settleGrad.addColorStop(0.0, `rgba(249, 115, 22, ${fadeAlpha * 0.35})`);
      settleGrad.addColorStop(1.0, "rgba(239, 68, 68, 0.0)");
      ctx.fillStyle = settleGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * 🔥 화염바퀴 전면 이펙트 렌더러 (drawFlameWheelEffect)
 * 
 * 시퀀스:
 * 1. Step 1: 시동 & 제자리 반시계 회전 (2D 기준)
 *    - 시전자가 반시계방향으로 회전하면서 몸 둘레에 화염 잔상 발생
 *    - 회전 속도가 가속되며 타오르는 바퀴 모양 화염바퀴(Flame Wheel) 완성
 * 2. Step 2: 화염바퀴 상태로 상대 포켓몬에게 돌진 (회전하면서!)
 *    - 맹렬한 반시계 회전을 유지하며 상대에게 지면을 박차고 로켓 쇄도
 *    - 림 앞쪽의 예리한 화염 쐐기와 원심력 비산 스파크
 * 3. Step 3: 상대방 격돌 직격 & 화염 폭발 (첨부 이미지 1 Drifloon 피격 고증)
 *    - 1프레임 hitFlash 백색 섬광 + 다이아몬드 충격파 + 사방으로 비산하는 화염 파편(Puffs & Embers)
 * 4. Step 4: 복귀 & 화염 페이드아웃
 */
export function drawFlameWheelEffect(
  targetCtx: any,
  frameOrTargetPos: any,
  drawCtxOrStep?: any
) {
  if (!targetCtx) return;

  let moveStep = 1;
  let p = 0.5;
  let isP = true;
  let isHit = true;
  let casterPos = { x: 80, y: 200 };
  let attackerPos = { x: 80, y: 200 };
  let targetPos = { x: 380, y: 130 };

  if (typeof frameOrTargetPos === "object" && frameOrTargetPos !== null) {
    const frame = frameOrTargetPos as BattleFrame;
    const drawCtx = drawCtxOrStep as EffectDrawContext;
    if (frame.showEffect === false) return;
    if (frame.afterCameraReturn) return;

    moveStep = frame.moveStep ?? 1;
    p = frame.effectProgress ?? 0.5;
    if (drawCtx) {
      if (drawCtx.casterPos) casterPos = drawCtx.casterPos;
      if (drawCtx.attackerPos) attackerPos = drawCtx.attackerPos;
      if (drawCtx.targetPos) targetPos = drawCtx.targetPos;
      if (drawCtx.isPlayer !== undefined) isP = drawCtx.isPlayer;
      if (drawCtx.isHit !== undefined) isHit = drawCtx.isHit;
    }
  }

  const ctx = targetCtx;
  const cx = casterPos.x;
  const cy = casterPos.y;
  const tx = targetPos.x;
  const ty = targetPos.y;

  ctx.save();

  // ==========================================================================
  // Step 1: 시동 & 제자리 반시계 회전 & 화염바퀴 형성
  // ==========================================================================
  if (moveStep === 1) {
    // 0. [유저 요청] 회전 전: 시전 포켓몬 불 필터와 함께 점화되는 불씨 및 플레어
    if (p <= 0.08) {
      ctx.save();
      const flareR = 26;
      const flareGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, flareR);
      flareGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.85)");
      flareGrad.addColorStop(0.35, "rgba(254, 240, 138, 0.75)");
      flareGrad.addColorStop(0.70, "rgba(249, 115, 22, 0.45)");
      flareGrad.addColorStop(1.0, "rgba(239, 68, 68, 0.0)");
      ctx.fillStyle = flareGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, flareR, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2 + 0.4;
        const dist = 18;
        const fx = cx + Math.cos(ang) * dist;
        const fy = cy + Math.sin(ang) * dist;
        ctx.fillStyle = i % 2 === 0 ? "#FEF08A" : "#F97316";
        ctx.beginPath();
        ctx.arc(fx, fy, 2.0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      ctx.restore();
      return;
    }

    const spinAngle = -p * Math.PI * 6.0; // 반시계 방향 회전 (음수)
    // [유저 요청] 회전과 함께 링이 곧바로 생기지 않고 부드럽게 페이드인으로 나타나게 적용
    const progressFrac = Math.max(0, Math.min(1.0, (p - 0.10) / 0.75));
    const wheelAlpha = Math.pow(progressFrac, 1.4);
    const radiusX = 33;
    const radiusY = 47; // [유저 요청] 살짝 세로가 긴 타원형

    // 1. 회전 화염 스트릭 아크 (Whirling Speed Arcs - 고속 회전감)
    ctx.save();
    for (let a = 0; a < 3; a++) {
      const arcStart = spinAngle + a * (Math.PI * 2 / 3);
      const arcLen = Math.PI * (0.45 + p * 0.35);
      const arcR_X = radiusX * (0.92 + a * 0.08);
      const arcR_Y = radiusY * (0.92 + a * 0.08);

      ctx.beginPath();
      ctx.ellipse(cx, cy, arcR_X, arcR_Y, 0, arcStart, arcStart + arcLen, false);
      ctx.lineWidth = 2.4 - a * 0.4;
      ctx.strokeStyle = a === 0
        ? `rgba(255, 255, 255, ${wheelAlpha * 0.95})`
        : (a === 1 ? `rgba(254, 240, 138, ${wheelAlpha * 0.85})` : `rgba(249, 115, 22, ${wheelAlpha * 0.70})`);
      ctx.stroke();
    }
    ctx.restore();

    // 2. [유저 요청] 링 두께 안쪽으로 1.5배 대폭 확장 + 안쪽 투명 그라데이션 + 중심부 코어 홀
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1.0, radiusY / radiusX);

    const R = radiusX;
    const maxR = R * 1.55;
    const ringBandGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR);
    // [계층 0] 중심부 관통 공동 (0.0 ~ 0.06*maxR): 깔끔하게 비워진 투명 중심 홀
    ringBandGrad.addColorStop(0.00, "rgba(0, 0, 0, 0.0)");
    ringBandGrad.addColorStop(0.06, "rgba(0, 0, 0, 0.0)");

    // [계층 1] 안쪽 심홍 화염층 ➔ 중심부 투명 그라데이션 (0.08 ~ 0.28)
    // 기존에 있던 안쪽은 더 투명하게 페이드되면서 심홍색으로 매끄럽게 발색
    ringBandGrad.addColorStop(0.08, "rgba(185, 28, 28, 0.0)");
    ringBandGrad.addColorStop(0.18, `rgba(220, 38, 38, ${wheelAlpha * 0.28})`);
    ringBandGrad.addColorStop(0.28, `rgba(239, 68, 68, ${wheelAlpha * 0.58})`);

    // [계층 2] 중간 주황 작열층 그라데이션 (0.28 ~ 0.46)
    // 적색에서 생생한 주황으로 이어지는 유기적 전이층
    ringBandGrad.addColorStop(0.38, `rgba(249, 115, 22, ${wheelAlpha * 0.80})`);
    ringBandGrad.addColorStop(0.46, `rgba(251, 146, 60, ${wheelAlpha * 0.88})`);

    // [계층 3] 황금빛 옐로우 고열층 그라데이션 (0.46 ~ 0.61)
    // 주황에서 고열 황금 옐로우로 화려하게 상승하는 층
    ringBandGrad.addColorStop(0.54, `rgba(253, 224, 71, ${wheelAlpha * 0.95})`);
    ringBandGrad.addColorStop(0.61, `rgba(254, 240, 138, ${wheelAlpha * 0.98})`);

    // [계층 4] 메인 림 백열선 피크 (0.645 = R / maxR)
    ringBandGrad.addColorStop(0.645, `rgba(255, 255, 255, ${wheelAlpha * 1.00})`);

    // [계층 5] 외곽 화염 투명 페이드아웃 (0.645 ~ 1.00)
    ringBandGrad.addColorStop(0.70, `rgba(254, 240, 138, ${wheelAlpha * 0.82})`);
    ringBandGrad.addColorStop(0.78, `rgba(249, 115, 22, ${wheelAlpha * 0.52})`);
    ringBandGrad.addColorStop(0.88, `rgba(239, 68, 68, ${wheelAlpha * 0.18})`);
    ringBandGrad.addColorStop(1.00, "rgba(220, 38, 38, 0.0)");

    ctx.fillStyle = ringBandGrad;
    ctx.beginPath();
    ctx.arc(0, 0, maxR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. 바퀴의 메인 작열 림 (Main Blazing Rim - 예리한 백열 피크선만 섬세하게 유지)
    ctx.save();
    // A. 중심 순백 백열 코어 라인 (얇고 선명한 림 피크선)
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = `rgba(255, 255, 255, ${wheelAlpha * 0.95})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();

    // B. 림 엣지 미세 황금빛 글로우
    ctx.lineWidth = 3.8;
    ctx.strokeStyle = `rgba(254, 240, 138, ${wheelAlpha * 0.45})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 4. [유저 요청] 림 둘레 6개의 화염 구체와 뒤를 따라오는 유선형 불꼬리 효과
    const NUM_TONGUES = 6;
    for (let i = 0; i < NUM_TONGUES; i++) {
      const theta = spinAngle + (i / NUM_TONGUES) * Math.PI * 2;
      const tongueSize = (11 + Math.sin(p * 8 + i * 2) * 2.5) * Math.min(1.0, 0.4 + p * 0.6);
      drawCurvedFlameTail(ctx, cx, cy, radiusX, radiusY, theta, 0.82, tongueSize, wheelAlpha, i * 17);
    }

    // 5. 원심력으로 튕겨나가는 회전 불꽃 스파크 (Centrifugal Embers)
    ctx.save();
    for (let s = 0; s < 5; s++) {
      const sparkTheta = spinAngle * 1.25 + s * 1.3;
      const sparkDist = (radiusX + 4 + ((p * 28 + s * 9) % 18));
      const sx = cx + Math.cos(sparkTheta) * sparkDist;
      const sy = cy + Math.sin(sparkTheta) * (sparkDist * 1.15);
      const sparkSize = 1.6 + (s % 2) * 0.8;
      ctx.fillStyle = s % 2 === 0 ? "#FFFFFF" : "#FEF08A";
      ctx.beginPath();
      ctx.arc(sx, sy, sparkSize, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ==========================================================================
  // Step 2: 화염바퀴 돌진 (회전하면서 상대에게 맹렬히 쇄도)
  // ==========================================================================
  else if (moveStep === 2) {
    const spinAngle = -(1.0 + p * 1.5) * Math.PI * 8.0; // 돌진 중 초고속 반시계 회전
    const rushDir = isP ? 1 : -1;
    const radiusX = 33;
    const radiusY = 47; // [유저 요청] 살짝 세로가 긴 타원형

    // 1. 돌진 전방 화염 쐐기 헤드 (Prow Flame Spear / Leading Flare)
    const headAngle = isP ? -0.42 : Math.PI - 0.42;
    const prowLen = 28 + Math.sin(p * 14) * 4;
    const prowX = cx + Math.cos(headAngle) * (radiusX + 4);
    const prowY = cy + Math.sin(headAngle) * (radiusY + 4);

    const prowGrad = ctx.createRadialGradient(prowX, prowY, 2, prowX, prowY, prowLen);
    prowGrad.addColorStop(0.0, "#FFFFFF");
    prowGrad.addColorStop(0.30, "#FEF08A");
    prowGrad.addColorStop(0.65, "#F97316");
    prowGrad.addColorStop(1.0, "rgba(239, 68, 68, 0.0)");

    ctx.fillStyle = prowGrad;
    ctx.beginPath();
    ctx.arc(prowX, prowY, prowLen, 0, Math.PI * 2);
    ctx.fill();

    // 2. [유저 요청] 돌진 링 안쪽으로 1.5배 대폭 확장 + 안쪽 투명 그라데이션
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1.0, radiusY / radiusX);

    const R = radiusX;
    const maxR = R * 1.55;
    const ringBandGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR);
    // [계층 0] 중심부 관통 공동 (0.0 ~ 0.06*maxR): 깔끔하게 비워진 투명 중심 홀
    ringBandGrad.addColorStop(0.00, "rgba(0, 0, 0, 0.0)");
    ringBandGrad.addColorStop(0.06, "rgba(0, 0, 0, 0.0)");

    // [계층 1] 안쪽 심홍 화염층 ➔ 중심부 투명 그라데이션 (0.08 ~ 0.28)
    // 기존에 있던 안쪽은 더 투명하게 페이드되면서 심홍색으로 매끄럽게 발색
    ringBandGrad.addColorStop(0.08, "rgba(185, 28, 28, 0.0)");
    ringBandGrad.addColorStop(0.18, "rgba(220, 38, 38, 0.30)");
    ringBandGrad.addColorStop(0.28, "rgba(239, 68, 68, 0.60)");

    // [계층 2] 중간 주황 작열층 그라데이션 (0.28 ~ 0.46)
    // 적색에서 생생한 주황으로 이어지는 유기적 전이층
    ringBandGrad.addColorStop(0.38, "rgba(249, 115, 22, 0.85)");
    ringBandGrad.addColorStop(0.46, "rgba(251, 146, 60, 0.92)");

    // [계층 3] 황금빛 옐로우 고열층 그라데이션 (0.46 ~ 0.61)
    // 주황에서 고열 황금 옐로우로 화려하게 상승하는 층
    ringBandGrad.addColorStop(0.54, "rgba(253, 224, 71, 0.98)");
    ringBandGrad.addColorStop(0.61, "rgba(254, 240, 138, 1.00)");

    // [계층 4] 메인 림 백열선 피크 (0.645 = R / maxR)
    ringBandGrad.addColorStop(0.645, "rgba(255, 255, 255, 1.00)");

    // [계층 5] 외곽 화염 투명 페이드아웃 (0.645 ~ 1.00)
    ringBandGrad.addColorStop(0.70, "rgba(254, 240, 138, 0.85)");
    ringBandGrad.addColorStop(0.78, "rgba(249, 115, 22, 0.55)");
    ringBandGrad.addColorStop(0.88, "rgba(239, 68, 68, 0.20)");
    ringBandGrad.addColorStop(1.00, "rgba(220, 38, 38, 0.0)");

    ctx.fillStyle = ringBandGrad;
    ctx.beginPath();
    ctx.arc(0, 0, maxR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. 바퀴 메인 림 (예리한 백열 피크선만 섬세하게 유지)
    ctx.save();
    // A. 중심 순백 백열 코어 라인
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.98)";
    ctx.beginPath();
    ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();

    // B. 림 엣지 미세 황금빛 글로우
    ctx.lineWidth = 4.2;
    ctx.strokeStyle = "rgba(254, 240, 138, 0.50)";
    ctx.beginPath();
    ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 3. [유저 요청] 림 둘레 6개의 회전 화염 구체와 뒤를 따라오는 강력한 불꼬리 효과 (돌진)
    const NUM_TONGUES = 6;
    for (let i = 0; i < NUM_TONGUES; i++) {
      const theta = spinAngle + (i / NUM_TONGUES) * Math.PI * 2;
      const tongueSize = 13 + Math.sin(p * 10 + i * 2) * 3.0;
      drawCurvedFlameTail(ctx, cx, cy, radiusX, radiusY, theta, 0.88, tongueSize, 1.0, i * 19);
    }

    // 4. 고속 회전 스피드 스트릭 아크 (4단)
    ctx.save();
    for (let a = 0; a < 4; a++) {
      const arcStart = spinAngle * 1.2 + a * (Math.PI / 2);
      const arcLen = Math.PI * 0.65;
      ctx.beginPath();
      ctx.ellipse(cx, cy, radiusX + a * 1.5, radiusY + a * 1.5, 0, arcStart, arcStart + arcLen, false);
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = a % 2 === 0 ? "rgba(255, 255, 255, 0.95)" : "rgba(254, 240, 138, 0.85)";
      ctx.stroke();
    }
    ctx.restore();

    // 5. 지면 접촉부 마찰 스파크 (Ground Friction Sparks)
    const groundContactX = cx;
    const groundContactY = cy + radiusY;
    ctx.save();
    for (let s = 0; s < 4; s++) {
      const spx = groundContactX - rushDir * (4 + s * 6);
      const spy = groundContactY - (s % 2) * 3;
      ctx.fillStyle = s % 2 === 0 ? "#FFFFFF" : "#FEF08A";
      ctx.fillRect(spx, spy, 2.2, 2.2);
    }
    ctx.restore();
  }

  // ==========================================================================
  // Step 3: 상대방 격돌 직격 & 화염 폭발 (첨부 이미지 1 고증)
  // ==========================================================================
  else if (moveStep === 3) {
    if (isHit) {
      // 1. Frame 8: 직격 순간 다이아몬드 섬광 & 충격파 링 (p <= 0.35)
      if (p <= 0.35) {
        drawStarburstImpact(ctx, tx, ty, "#F97316", "#FEF08A", 38);

        // 초고열 중심 폭발 구체
        const burstR = 30 + p * 20;
        const burstGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, burstR);
        burstGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.98)");
        burstGrad.addColorStop(0.35, "rgba(254, 240, 138, 0.90)");
        burstGrad.addColorStop(0.70, "rgba(249, 115, 22, 0.60)");
        burstGrad.addColorStop(1.0, "rgba(239, 68, 68, 0.0)");

        ctx.fillStyle = burstGrad;
        ctx.beginPath();
        ctx.arc(tx, ty, burstR, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. 화염 쇄도 & 사방으로 비산하는 화염 파편 구름 (첨부 이미지 1 Drifloon 피격 모습)
      const puffAlpha = Math.max(0, 1.0 - (p - 0.2) * 1.15);
      if (puffAlpha > 0.01) {
        const BURST_PUFF_COUNT = 6;
        for (let i = 0; i < BURST_PUFF_COUNT; i++) {
          const angle = (i / BURST_PUFF_COUNT) * Math.PI * 2 + p * 1.5;
          const dist = 16 + p * 34 + (i % 2) * 8;
          const px = tx + Math.cos(angle) * dist * 1.15;
          const py = ty + Math.sin(angle) * dist * 0.85;
          const puffR = 15 + (i % 2) * 4;

          drawBillowingFlamePuff(
            ctx,
            px,
            py,
            puffR,
            angle,
            p * 8 + i * 2,
            puffAlpha * 0.92,
            i * 19 + 7,
            false
          );

          // [유저 요청: #13 불꽃 중앙 노란부분 살짝 추가]
          const yellowCoreR = puffR * 0.45;
          const puffYellowGrad = ctx.createRadialGradient(px, py, 0, px, py, yellowCoreR);
          puffYellowGrad.addColorStop(0.0, `rgba(254, 240, 138, ${puffAlpha * 0.85})`);
          puffYellowGrad.addColorStop(0.40, `rgba(253, 224, 71, ${puffAlpha * 0.70})`);
          puffYellowGrad.addColorStop(0.75, `rgba(249, 115, 22, ${puffAlpha * 0.30})`);
          puffYellowGrad.addColorStop(1.0, "rgba(249, 115, 22, 0.0)");
          ctx.fillStyle = puffYellowGrad;
          ctx.beginPath();
          ctx.arc(px, py, yellowCoreR, 0, Math.PI * 2);
          ctx.fill();
        }

        // [유저 요청: #13 피격 중심 잔여 화염 노란 열기 살짝 추가]
        const centerWarmR = 18 + (p - 0.2) * 10;
        const centerWarmAlpha = puffAlpha * 0.40;
        if (centerWarmAlpha > 0.01) {
          const centerWarmGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, centerWarmR);
          centerWarmGrad.addColorStop(0.0, `rgba(254, 240, 138, ${centerWarmAlpha * 0.80})`);
          centerWarmGrad.addColorStop(0.40, `rgba(253, 224, 71, ${centerWarmAlpha * 0.50})`);
          centerWarmGrad.addColorStop(0.75, `rgba(249, 115, 22, ${centerWarmAlpha * 0.20})`);
          centerWarmGrad.addColorStop(1.0, "rgba(239, 68, 68, 0.0)");
          ctx.fillStyle = centerWarmGrad;
          ctx.beginPath();
          ctx.arc(tx, ty, centerWarmR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. 고속 비산하는 작열 불티 및 스파크 10개
      ctx.save();
      const sparkAlpha = Math.max(0, 1.0 - p * 1.05);
      for (let s = 0; s < 10; s++) {
        const sAngle = (s / 10) * Math.PI * 2 + 0.4;
        const sDist = 20 + p * 52 + ((s * 7) % 14);
        const sx = tx + Math.cos(sAngle) * sDist * 1.2;
        const sy = ty + Math.sin(sAngle) * sDist * 0.85;
        const sz = 2.4 - p * 1.2;

        ctx.fillStyle = s % 2 === 0
          ? `rgba(255, 255, 255, ${sparkAlpha})`
          : `rgba(254, 240, 138, ${sparkAlpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, sz, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // ==========================================================================
  // Step 4: 복귀 및 잔여 화염 페이드아웃
  // ==========================================================================
  else if (moveStep === 4) {
    const fadeAlpha = Math.max(0, 1.0 - p * 1.1);
    if (fadeAlpha > 0.01) {
      // 시전자 몸 둘레에 잔류하는 작은 불씨들
      ctx.save();
      for (let i = 0; i < 4; i++) {
        const theta = (i / 4) * Math.PI * 2 + p * 3;
        const dist = 18 + i * 4;
        const ex = cx + Math.cos(theta) * dist;
        const ey = cy + Math.sin(theta) * (dist * 0.85) - p * 10;
        ctx.fillStyle = i % 2 === 0
          ? `rgba(254, 240, 138, ${fadeAlpha * 0.85})`
          : `rgba(249, 115, 22, ${fadeAlpha * 0.70})`;
        ctx.beginPath();
        ctx.arc(ex, ey, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  ctx.restore();
}

