// ============================================================================
// 🎮 ROGUEPot Move Animation Renderer: No.141 ~ No.144
// 141: 흡혈 (Leech Life)
// 142: 악마의키스 (Lovely Kiss)
// 143: 불새 (Sky Attack)
// 144: 변신 (Transform)
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawMiniRetroStar } from "../common/helpers.js";

// ============================================================================
// 📍 공통 헬퍼: 암전 오버레이
// ============================================================================
function drawDimOverlay(ctx: any, alpha: number, color: string = "rgba(10, 8, 20, 1.0)") {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.fillStyle = color;
  ctx.fillRect(-6000, -6000, 14000, 14000);
  ctx.restore();
}

// ============================================================================
// 🩸 141: 흡혈 (Leech Life)
// ============================================================================

/**
 * 흡혈 침 (White Sharp Needle)
 * 앞쪽과 뒤쪽 끝이 모두 완벽히 날카롭게 끝나는 순백색 직선 침 (원형 요소 일체 없음)
 */
export function drawLeechLifeNeedle(
  ctx: any,
  startPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  progress: number = 0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || progress <= 0) return;

  const curX = startPos.x + (targetPos.x - startPos.x) * progress;
  const curY = startPos.y + (targetPos.y - startPos.y) * progress;
  const angle = Math.atan2(targetPos.y - startPos.y, targetPos.x - startPos.x);

  ctx.save();
  ctx.translate(curX, curY);
  ctx.rotate(angle);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const halfLen = 26; // 침 길이 연장 (총 52px)
  const halfWidth = 1.6;
  const trailLen = 110; // 잔상 대폭 연장 (110px)

  // 1. 침 본체 내부(x = 0)부터 겹쳐서 뒤로 길게 뻗어나가며 끝이 투명해지는 잔상
  const trailStart = 0;
  const trailEnd = -halfLen - trailLen;

  const trailGrad = ctx.createLinearGradient(trailStart, 0, trailEnd, 0);
  trailGrad.addColorStop(0.00, "rgba(255, 255, 255, 0.95)");
  trailGrad.addColorStop(0.20, "rgba(255, 255, 255, 0.75)");
  trailGrad.addColorStop(0.55, "rgba(255, 255, 255, 0.30)");
  trailGrad.addColorStop(1.00, "rgba(255, 255, 255, 0.00)");

  // 중심 선명한 긴 잔상선
  ctx.lineWidth = 2.0;
  ctx.strokeStyle = trailGrad;
  ctx.beginPath();
  ctx.moveTo(trailStart, 0);
  ctx.lineTo(trailEnd, 0);
  ctx.stroke();

  // 외곽 은은한 글로우 잔상선
  const glowGrad = ctx.createLinearGradient(trailStart, 0, trailEnd * 0.85, 0);
  glowGrad.addColorStop(0.00, "rgba(255, 255, 255, 0.35)");
  glowGrad.addColorStop(1.00, "rgba(255, 255, 255, 0.00)");
  ctx.lineWidth = 4.0;
  ctx.strokeStyle = glowGrad;
  ctx.beginPath();
  ctx.moveTo(trailStart, 0);
  ctx.lineTo(trailEnd * 0.85, 0);
  ctx.stroke();

  // 2. 앞/뒤 양끝이 완벽하게 뾰족한 다이아몬드 쐐기형 침 본체
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(halfLen, 0);     // 앞쪽 날카로운 끝 (Front Sharp Tip)
  ctx.lineTo(0, -halfWidth);  // 중심 상단
  ctx.lineTo(-halfLen, 0);    // 뒤쪽 날카로운 끝 (Back Sharp Tip)
  ctx.lineTo(0, halfWidth);   // 중심 하단
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 흡혈 피격 충격파 & 스파크 (Piercing Impact Spark)
 */
export function drawLeechLifeImpact(
  ctx: any,
  tx: number,
  ty: number,
  progress: number = 0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || progress <= 0) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const p = Math.min(1.0, progress);

  // 1. 타격 충격파 링 확산
  const ringR = 12 + p * 28;
  ctx.strokeStyle = `rgba(253, 224, 71, ${Math.max(0, (1 - p) * 0.85)})`;
  ctx.lineWidth = Math.max(1.0, 2.8 * (1 - p));
  ctx.beginPath();
  ctx.arc(tx, ty, ringR, 0, Math.PI * 2);
  ctx.stroke();

  // 2. 다이아몬드 십자 스파이크
  const sparkSize = Math.max(2, (1 - p * 0.7) * 22);
  ctx.fillStyle = "#F59E0B";
  ctx.beginPath();
  ctx.moveTo(tx, ty - sparkSize);
  ctx.lineTo(tx + sparkSize * 0.35, ty);
  ctx.lineTo(tx, ty + sparkSize);
  ctx.lineTo(tx - sparkSize * 0.35, ty);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#FEF08A";
  ctx.beginPath();
  ctx.moveTo(tx - sparkSize, ty);
  ctx.lineTo(tx, ty - sparkSize * 0.35);
  ctx.lineTo(tx + sparkSize, ty);
  ctx.lineTo(tx, ty + sparkSize * 0.35);
  ctx.closePath();
  ctx.fill();

  // 중심 백색 코어
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(tx, ty, sparkSize * 0.28, 0, Math.PI * 2);
  ctx.fill();

  // 3. 비산하는 침 조각/스파크 (Tiny Sparks)
  const SPARKS = [
    { dx: -18, dy: -14, r: 2.5 },
    { dx: 16, dy: -18, r: 2.2 },
    { dx: -14, dy: 16, r: 2.0 },
    { dx: 18, dy: 14, r: 2.6 },
  ];
  for (const sp of SPARKS) {
    const sx = tx + sp.dx * p * 1.5;
    const sy = ty + sp.dy * p * 1.5;
    ctx.fillStyle = "#FEF08A";
    ctx.beginPath();
    ctx.arc(sx, sy, Math.max(0.8, sp.r * (1 - p * 0.5)), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 흡혈 노란색 에너지 입자 구체 (Yellow Drain Mote) - [기술 흡수 고증]
 */
export function drawLeechDrainMote(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || radius <= 0.5) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 바깥쪽 은은한 노란빛 글로우
  ctx.fillStyle = "rgba(254, 240, 138, 0.20)";
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 2.2, 0, Math.PI * 2);
  ctx.fill();

  // 중간 황금빛 톤
  ctx.fillStyle = "rgba(253, 224, 71, 0.40)";
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.4, 0, Math.PI * 2);
  ctx.fill();

  // 밝은 레몬 옐로우 바디
  ctx.fillStyle = "#FEF9C3";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // 중앙 백색 광택 코어
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // 크기가 큰 경우 십자 반짝임
  if (radius >= 3.6) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 1.0;
    const spL = radius * 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - spL, cy);
    ctx.lineTo(cx + spL, cy);
    ctx.moveTo(cx, cy - spL);
    ctx.lineTo(cx, cy + spL);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 노란색 흡수 스트림 (Yellow Drain Stream) - [기술 흡수 완벽 고증]
 * 대상에서 시전자를 향해 바깥쪽 완만한 호를 그리며 쇄도하는 노란색 에너지
 */
export function drawLeechLifeDrainStream(
  ctx: any,
  startPos: { x: number; y: number },
  endPos: { x: number; y: number },
  progress: number = 0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || progress <= 0) return;

  const dx = endPos.x - startPos.x;
  const dy = endPos.y - startPos.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return;

  // 법선 벡터 (곡선 궤적용)
  const nx = -dy / dist;
  const ny = dx / dist;

  // 5개의 시차를 둔 에너지 입자들 (외곽 호 궤적)
  const MOTES = [
    { curveOffset: 48, delay: 0.00, dur: 0.65, r: 4.4, ox: 0, oy: 0 },
    { curveOffset: -42, delay: 0.08, dur: 0.64, r: 4.0, ox: -10, oy: 6 },
    { curveOffset: 28, delay: 0.16, dur: 0.62, r: 3.6, ox: 8, oy: -8 },
    { curveOffset: -30, delay: 0.24, dur: 0.60, r: 3.8, ox: -6, oy: -10 },
    { curveOffset: 58, delay: 0.30, dur: 0.62, r: 4.2, ox: 12, oy: 8 },
  ];

  ctx.save();

  for (const m of MOTES) {
    const p = (progress - m.delay) / m.dur;

    // 아직 발사되지 않은 입자: 대상체 내부에서 응축 태동
    if (p < 0) {
      const gatherProg = Math.max(0, Math.min(1, progress / Math.max(0.01, m.delay)));
      if (gatherProg > 0.15) {
        drawLeechDrainMote(
          ctx,
          startPos.x + m.ox,
          startPos.y + m.oy,
          m.r * 0.55 * gatherProg,
          alpha * gatherProg * 0.75
        );
      }
      continue;
    }

    if (p > 1.0) continue;

    const t = Math.max(0, Math.min(1.0, p));
    const tEased = t * t * (3 - 2 * t);

    // 잔상 입자 (Ghost Trails)
    for (let g = 2; g >= 1; g--) {
      const gt = Math.max(0, t - g * 0.045);
      const gtEased = gt * gt * (3 - 2 * gt);
      const gCurve = Math.sin(gt * Math.PI);

      const gx = startPos.x + m.ox * (1 - gt) + dx * gtEased + nx * (m.curveOffset * gCurve);
      const gy = startPos.y + m.oy * (1 - gt) + dy * gtEased + ny * (m.curveOffset * gCurve);

      let gAlpha = alpha * (1 - g * 0.35) * 0.65;
      if (gt < 0.12) gAlpha *= (gt / 0.12);
      else if (gt > 0.88) gAlpha *= ((1 - gt) / 0.12);

      drawLeechDrainMote(ctx, gx, gy, m.r * (1 - g * 0.28), gAlpha);
    }

    // 메인 입자
    const curve = Math.sin(t * Math.PI);
    const curX = startPos.x + m.ox * (1 - t) + dx * tEased + nx * (m.curveOffset * curve);
    const curY = startPos.y + m.oy * (1 - t) + dy * tEased + ny * (m.curveOffset * curve);

    let moteAlpha = alpha;
    if (t < 0.12) moteAlpha *= (t / 0.12);
    else if (t > 0.88) moteAlpha *= ((1 - t) / 0.12);

    drawLeechDrainMote(ctx, curX, curY, m.r, moteAlpha);
  }

  ctx.restore();
}

/**
 * 흡혈 치유 오라 (Heal Pulse & Sparkles)
 */
export function drawLeechLifeHealAura(
  ctx: any,
  cx: number,
  cy: number,
  progress: number = 1.0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const p = Math.max(0, Math.min(1.5, progress));

  // 발밑 골드 펄스 링 팽창
  const pulseR = 18 + p * 24;
  ctx.strokeStyle = `rgba(253, 224, 71, ${Math.max(0, (1 - p * 0.65) * 0.75)})`;
  ctx.lineWidth = Math.max(1.2, 2.8 * (1 - p * 0.5));
  ctx.beginPath();
  ctx.ellipse(cx, cy + 6, pulseR * 1.2, pulseR * 0.6, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 상승하는 골드/백색 치유 별빛
  const SPARKLES = [
    { ox: -18, oy: 6, vy: -34, size: 7.0, color: "#FEF08A" },
    { ox: 16, oy: 2, vy: -40, size: 8.0, color: "#FDE047" },
    { ox: -4, oy: -10, vy: -48, size: 9.0, color: "#FFFFFF" },
    { ox: 22, oy: 12, vy: -30, size: 6.5, color: "#FEF9C3" },
    { ox: -22, oy: 14, vy: -32, size: 6.5, color: "#FEF08A" },
  ];

  for (const sp of SPARKLES) {
    const sx = cx + sp.ox;
    const sy = cy + sp.oy + sp.vy * p;
    const sSize = Math.max(1.5, sp.size * (1 - p * 0.35));
    const sAlpha = Math.max(0, 1.0 - p * 0.65);

    if (sAlpha > 0.01) {
      drawMiniRetroStar(ctx, sx, sy, sSize, sp.color);
    }
  }

  ctx.restore();
}

/**
 * 141 흡혈 Behind Effect
 * - 암전 배경
 * - 대상에서 시전자로 날아오는 노란색 흡수 스트림
 */
export function drawLeechLifeBehindEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    casterPos?: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    width?: number;
    height?: number;
    [key: string]: any;
  }
) {
  const dimAlpha = frame.dimAlpha ?? 0;
  if (dimAlpha > 0.005) {
    drawDimOverlay(ctx, dimAlpha, "rgba(5, 5, 12, 1.0)");
  }

  const drainProg = frame.drainProgress ?? 0;
  const drainAlpha = frame.drainAlpha ?? 1.0;
  if (drainProg > 0 && drainAlpha > 0.01) {
    const startPos = drawCtx.targetPos;
    const endPos = drawCtx.casterPos ?? drawCtx.attackerPos;
    drawLeechLifeDrainStream(ctx, startPos, endPos, drainProg, drainAlpha);
  }
}

/**
 * 141 흡혈 Front Effect
 * - 직선으로 날아가는 침
 * - 타격 충격파 및 스파크
 * - 시전자 치유 오라
 */
export function drawLeechLifeEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    casterPos?: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    width?: number;
    height?: number;
    [key: string]: any;
  }
) {
  const needleProg = frame.needleProgress ?? 0;
  const needleAlpha = frame.needleAlpha ?? 1.0;
  if (needleProg > 0 && needleAlpha > 0.01) {
    const casterPos = drawCtx.casterPos ?? drawCtx.attackerPos;
    drawLeechLifeNeedle(ctx, casterPos, drawCtx.targetPos, needleProg, needleAlpha);
  }

  // [유저 요청]: 타격 효과 완전 제거

  const healAlpha = frame.healAlpha ?? 0;
  if (healAlpha > 0.01) {
    const casterPos = drawCtx.casterPos ?? drawCtx.attackerPos;
    const healProg = frame.healProgress ?? 1.0;
    drawLeechLifeHealAura(ctx, casterPos.x, casterPos.y, healProg, healAlpha);
  }
}

// ============================================================================
// 💋 142: 악마의키스 (Lovely Kiss)
// ============================================================================

/**
 * 키스 입술 (Kiss Lips)
 * - isImprint: false ➔ 날아가는 츄(Puckered Kiss) 입술
 * - isImprint: true  ➔ 대상 얼굴에 찰싹 밀착된 립스틱 키스 마크
 */
export function drawKissLips(
  ctx: any,
  cx: number,
  cy: number,
  scale: number = 1.0,
  rot: number = 0,
  alpha: number = 1.0,
  isImprint: boolean = false
) {
  if (alpha <= 0.01 || scale <= 0.01) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  if (!isImprint) {
    // 💋 1. 날아가는 츄(Kiss) 입술 - 테두리/외곽글로우/백색 하이라이트 일체 배제, 깔끔한 핫핑크
    // 윗입술
    ctx.fillStyle = "#F43F5E";
    ctx.beginPath();
    ctx.moveTo(-12, 1);
    ctx.bezierCurveTo(-9, -8, -3, -9, 0, -5);
    ctx.bezierCurveTo(3, -9, 9, -8, 12, 1);
    ctx.bezierCurveTo(6, -1.5, -6, -1.5, -12, 1);
    ctx.closePath();
    ctx.fill();

    // 아랫입술
    ctx.fillStyle = "#FB7185";
    ctx.beginPath();
    ctx.moveTo(-11, 0);
    ctx.bezierCurveTo(-7, 8, 7, 8, 11, 0);
    ctx.bezierCurveTo(5, 1.5, -5, 1.5, -11, 0);
    ctx.closePath();
    ctx.fill();
  } else {
    // 💋 2. 대상 얼굴에 찍힌 립스틱 마크 - 테두리/백색 하이라이트 없는 선명한 립 마크
    // 윗입술
    ctx.fillStyle = "#E11D48";
    ctx.beginPath();
    ctx.moveTo(-16, 2);
    ctx.bezierCurveTo(-12, -10, -4, -11, 0, -5);
    ctx.bezierCurveTo(4, -11, 12, -10, 16, 2);
    ctx.bezierCurveTo(8, -1, -8, -1, -16, 2);
    ctx.closePath();
    ctx.fill();

    // 아랫입술
    ctx.fillStyle = "#F43F5E";
    ctx.beginPath();
    ctx.moveTo(-15, 1);
    ctx.bezierCurveTo(-10, 12, 10, 12, 15, 1);
    ctx.bezierCurveTo(6, 1.5, -6, 1.5, -15, 1);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 핑크 하트 파티클 (Cute Pink Heart)
 */
export function drawKissHeart(
  ctx: any,
  x: number,
  y: number,
  size: number,
  alpha: number = 1.0,
  color: string = "#F43F5E"
) {
  if (alpha <= 0.01 || size <= 1) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  ctx.fillStyle = color;
  ctx.beginPath();
  const topH = size * 0.3;
  ctx.moveTo(0, topH);
  ctx.bezierCurveTo(0, 0, -size * 0.55, 0, -size * 0.55, topH);
  ctx.bezierCurveTo(-size * 0.55, size * 0.7, 0, size * 0.95, 0, size * 1.05);
  ctx.bezierCurveTo(0, size * 0.95, size * 0.55, size * 0.7, size * 0.55, topH);
  ctx.bezierCurveTo(size * 0.55, 0, 0, 0, 0, topH);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 몽롱한 Zzz 수면 방울 (Sleep Zzz Bubbles)
 */
export function drawSleepZzz(
  ctx: any,
  cx: number,
  cy: number,
  progress: number = 0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || progress <= 0) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const Z_DATA = [
    { startP: 0.0, speed: 45, dx: -2, size: 12, color: "#A5F3FC", font: "bold 12px sans-serif" },
    { startP: 0.2, speed: 55, dx: 14, size: 15, color: "#C4B5FD", font: "bold 15px sans-serif" },
    { startP: 0.4, speed: 65, dx: 28, size: 19, color: "#FBCFE8", font: "bold 19px sans-serif" },
  ];

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const z of Z_DATA) {
    if (progress < z.startP) continue;
    const localP = (progress - z.startP) / (1.0 - z.startP);
    if (localP > 1.0) continue;

    const sway = Math.sin(localP * Math.PI * 2) * 6;
    const zx = cx + z.dx + sway;
    const zy = cy - localP * z.speed;
    const zAlpha = Math.sin(localP * Math.PI) * alpha;

    ctx.font = z.font;
    // 어두운 외곽선 (가독성 확보)
    ctx.lineWidth = 3.0;
    ctx.strokeStyle = `rgba(15, 23, 42, ${zAlpha * 0.85})`;
    ctx.strokeText("Z", zx, zy);

    // 본체 파스텔 톤
    ctx.fillStyle = z.color;
    ctx.fillText("Z", zx, zy);
  }

  ctx.restore();
}

/**
 * 142 악마의키스 Behind Effect
 * - 은은한 핑크빛 로맨틱 분위기 암전
 */
export function drawLovelyKissBehindEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    casterPos?: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    width?: number;
    height?: number;
    [key: string]: any;
  }
) {
  const dimAlpha = frame.dimAlpha ?? 0;
  if (dimAlpha > 0.005) {
    drawDimOverlay(ctx, dimAlpha, "rgba(20, 5, 15, 1.0)");
  }
}

/**
 * 142 악마의키스 Front Effect
 * - 날아가는 입술
 * - 대상 밀착 립스틱 마크
 * - 팝핑 핑크 하트
 * - Zzz 수면 방울
 */
export function drawLovelyKissEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    casterPos?: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    width?: number;
    height?: number;
    [key: string]: any;
  }
) {
  const casterPos = drawCtx.casterPos ?? drawCtx.attackerPos;
  const tg = drawCtx.targetPos;

  // 1. 날아가는 입술 (Lips Flight)
  const lipsProg = frame.lipsProgress ?? 0;
  const lipsAlpha = frame.lipsAlpha ?? 1.0;
  if (lipsProg > 0 && lipsProg < 1.0 && lipsAlpha > 0.01) {
    const curX = casterPos.x + (tg.x - casterPos.x) * lipsProg;
    // 살짝 떠오르는 부드러운 아크 궤적
    const arcY = Math.sin(lipsProg * Math.PI) * -18;
    const curY = casterPos.y + (tg.y - casterPos.y) * lipsProg + arcY;
    const swayRot = Math.sin(lipsProg * Math.PI * 3) * 0.15;
    const scale = 1.0 + Math.sin(lipsProg * Math.PI) * 0.35;

    drawKissLips(ctx, curX, curY, scale, swayRot, lipsAlpha, false);
  }

  // 2. 대상 얼굴에 찍힌 키스 마크 (Kiss Mark Imprint)
  const kissMarkAlpha = frame.kissMarkAlpha ?? 0;
  const kissMarkScale = frame.kissMarkScale ?? 1.25;
  if (kissMarkAlpha > 0.01) {
    drawKissLips(ctx, tg.x, tg.y - 12, kissMarkScale, -0.08, kissMarkAlpha, true);
  }

  // 3. 퐁퐁 터지는 하트 파티클들 (Popping Hearts)
  const heartsProg = frame.heartsProgress ?? 0;
  const heartsAlpha = frame.heartsAlpha ?? 1.0;
  if (heartsProg > 0 && heartsAlpha > 0.01) {
    const HEARTS = [
      { ox: -22, oy: -20, vx: -18, vy: -32, size: 14, color: "#F43F5E" },
      { ox:  20, oy: -26, vx:  22, vy: -36, size: 16, color: "#FB7185" },
      { ox:  -4, oy: -38, vx:  -6, vy: -44, size: 18, color: "#FDA4AF" },
      { ox:  28, oy:  -8, vx:  24, vy: -20, size: 12, color: "#F43F5E" },
      { ox: -28, oy:  -4, vx: -24, vy: -18, size: 13, color: "#FB7185" },
    ];

    for (const h of HEARTS) {
      const hx = tg.x + h.ox + h.vx * heartsProg;
      const hy = tg.y + h.oy + h.vy * heartsProg;
      const hSize = Math.max(2, h.size * (1 - heartsProg * 0.35));
      const hAlpha = Math.sin(heartsProg * Math.PI) * heartsAlpha;
      drawKissHeart(ctx, hx, hy, hSize, hAlpha, h.color);
    }
  }

  // 4. 머리 위로 피어오르는 Zzz 수면 방울 (Sleep Zzz)
  const sleepProg = frame.sleepProgress ?? 0;
  const sleepAlpha = frame.sleepAlpha ?? 1.0;
  if (sleepProg > 0 && sleepAlpha > 0.01) {
    drawSleepZzz(ctx, tg.x + 8, tg.y - 32, sleepProg, sleepAlpha);
  }
}

// ============================================================================
// 🦅 143: 불새 (Sky Attack) - 2턴 충전 & 음속 급강하 화염조(Phoenix) 공격기
// ============================================================================

/**
 * 143-Charge: 푸른 도깨비불 / 화염구 (Blue Flame Orb)
 * - [유저 첨부 이미지 100% 고증]:
 *   1) 외곽 딥/로열 블루 부드러운 발광 아우라
 *   2) 중간 일렉트릭 블루/시안 불꽃 바디
 *   3) 중심 초고열 순백 광원 (#FFFFFF)
 */
export function drawBlueFlameOrb(
  ctx: any,
  x: number,
  y: number,
  size: number = 13,
  alpha: number = 1.0,
  flickerOffset: number = 0,
  tiltAngle: number = 0
) {
  if (alpha <= 0.01 || size <= 1) return;

  ctx.save();
  ctx.translate(x, y);
  if (tiltAngle !== 0) {
    ctx.rotate(tiltAngle);
  }
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 유저 피드백 반영: 딱딱한 동그라미 원형 탈피 -> 위로 타오르는 자연스러운 불꽃 형상
  const fSize = size * (1.0 + Math.sin(flickerOffset) * 0.10);
  const tipSway = Math.sin(flickerOffset * 1.4) * (fSize * 0.28);
  const flameH = fSize * 1.45; // 상하로 긴 불꽃 높이
  const flameW = fSize * 0.90; // 좌우 폭
  const coreY = flameH * 0.18; // 발광 중심점

  // 1. 외곽 은은한 푸른 발광 아우라 (외곽 끝부분 100% 완전 투명 그라데이션)
  ctx.save();
  ctx.scale(1.0, 1.35);
  const haloGrad = ctx.createRadialGradient(0, coreY / 1.35, fSize * 0.2, 0, coreY / 1.35, fSize * 2.1);
  haloGrad.addColorStop(0.00, "rgba(59, 130, 246, 0.45)");
  haloGrad.addColorStop(0.40, "rgba(37, 99, 235, 0.22)");
  haloGrad.addColorStop(0.75, "rgba(29, 78, 216, 0.08)");
  haloGrad.addColorStop(1.00, "rgba(29, 78, 216, 0.00)");
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(0, coreY / 1.35, fSize * 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. 메인 불꽃 바디 (위로 솟구쳐 뾰족해지는 불꽃 Path + 외곽 투명 그라데이션)
  const bodyGrad = ctx.createRadialGradient(
    0, coreY, fSize * 0.1,
    0, coreY, flameH * 1.05
  );
  bodyGrad.addColorStop(0.00, "rgba(147, 197, 253, 0.95)"); // 밝은 시안
  bodyGrad.addColorStop(0.35, "rgba(59, 130, 246, 0.85)");  // 일렉트릭 블루
  bodyGrad.addColorStop(0.70, "rgba(29, 78, 216, 0.50)");  // 로열 블루
  bodyGrad.addColorStop(0.92, "rgba(30, 58, 138, 0.15)");  // 딥 블루
  bodyGrad.addColorStop(1.00, "rgba(30, 58, 138, 0.00)");  // 외곽 투명 소멸

  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(tipSway, -flameH);
  ctx.bezierCurveTo( flameW * 0.85, -flameH * 0.40,  flameW * 1.05, flameH * 0.40, 0, flameH * 0.70);
  ctx.bezierCurveTo(-flameW * 1.05, flameH * 0.40, -flameW * 0.85, -flameH * 0.40, tipSway, -flameH);
  ctx.closePath();
  ctx.fill();

  // 3. 내부 밝은 코어 불꽃 (안쪽 동그란 부분도 하드한 원이 아닌 유기적 형상 + 완전 투명 그라데이션)
  const coreH = flameH * 0.55;
  const coreW = flameW * 0.55;
  const coreTipSway = tipSway * 0.6;
  const coreGrad = ctx.createRadialGradient(
    0, coreY, 0,
    0, coreY, coreH * 0.95
  );
  coreGrad.addColorStop(0.00, "rgba(255, 255, 255, 0.98)"); // 순백 중심
  coreGrad.addColorStop(0.30, "rgba(224, 242, 254, 0.85)"); // 아이스 시안
  coreGrad.addColorStop(0.65, "rgba(147, 197, 253, 0.35)"); // 시안 블루 페이드
  coreGrad.addColorStop(1.00, "rgba(59, 130, 246, 0.00)");  // 완전 투명 소멸

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.moveTo(coreTipSway, -coreH + coreY * 0.2);
  ctx.bezierCurveTo( coreW * 0.85, -coreH * 0.35 + coreY,  coreW * 1.05, coreH * 0.35 + coreY, 0, coreH * 0.65 + coreY);
  ctx.bezierCurveTo(-coreW * 1.05, coreH * 0.35 + coreY, -coreW * 0.85, -coreH * 0.35 + coreY, coreTipSway, -coreH + coreY * 0.2);
  ctx.closePath();
  ctx.fill();

  // 4. 최심부 초고열 미세 화이트 핫스팟 (부드러운 투명 방사 그라데이션)
  const hotGrad = ctx.createRadialGradient(0, coreY, 0, 0, coreY, fSize * 0.30);
  hotGrad.addColorStop(0.00, "rgba(255, 255, 255, 0.95)");
  hotGrad.addColorStop(0.50, "rgba(255, 255, 255, 0.40)");
  hotGrad.addColorStop(1.00, "rgba(255, 255, 255, 0.00)");
  ctx.fillStyle = hotGrad;
  ctx.beginPath();
  ctx.arc(0, coreY, fSize * 0.30, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 불꽃회오리(Fire Spin) 고증 3D 호형 스위핑 트레일 (Sweeping Motion Trail)
 * - 불꽃 헤드의 이동 궤적을 따라 뒤쪽으로 유선형의 푸른 화염 잔상이 스위핑됨
 * - 진행방향 쪽(헤드)은 불꽃과 자연스럽게 결합되고, 꼬리 끝으로 갈수록 완전히 투명(alpha: 0)하게 소멸
 * - isFront 플래그에 따라 포켓몬 스프라이트 앞/뒤 레이어에 정확히 분할 렌더링
 */
function drawBlueFlameSweepingTrail(
  ctx: any,
  cx: number,
  baseY: number,
  Rx: number,
  Ry: number,
  headAngle: number,
  headSize: number,
  isFront: boolean,
  alpha: number,
  trailSpanAngle: number = Math.PI * 0.48
) {
  if (alpha <= 0.01) return;

  const numTrailSteps = 12;
  let prevPt: { x: number; y: number; z: number } | null = null;

  for (let step = 0; step <= numTrailSteps; step++) {
    const t = step / numTrailSteps; // 0.0 (꼬리 끝) ~ 1.0 (헤드)
    const angle = headAngle - (1.0 - t) * trailSpanAngle;

    const x = cx + Math.cos(angle) * Rx;
    const y = baseY + Math.sin(angle) * Ry;
    const z = Math.sin(angle);
    const currPt = { x, y, z };

    if (prevPt) {
      const p1Front = prevPt.z >= -0.05;
      const p2Front = currPt.z >= -0.05;

      // 앞/뒤 레이어 클리핑
      if ((isFront && (p1Front || p2Front)) || (!isFront && (!p1Front || !p2Front))) {
        // 헤드(t=1.0)는 반투명 발광, 꼬리(t=0.0)는 완전투명(0.0) 페이드아웃
        const tAlpha = Math.pow(t, 1.35) * alpha * 0.60;

        if (tAlpha > 0.01) {
          const w = headSize * (0.20 + t * 0.80);

          ctx.save();
          ctx.lineCap = "round";

          // 1) 외곽 부드러운 로열 블루 잔상
          ctx.strokeStyle = `rgba(29, 78, 216, ${tAlpha * 0.65})`;
          ctx.lineWidth = w * 1.5;
          ctx.beginPath();
          ctx.moveTo(prevPt.x, prevPt.y);
          ctx.lineTo(currPt.x, currPt.y);
          ctx.stroke();

          // 2) 내부 작열 일렉트릭 블루 잔상
          ctx.strokeStyle = `rgba(59, 130, 246, ${tAlpha * 0.85})`;
          ctx.lineWidth = w * 0.85;
          ctx.beginPath();
          ctx.moveTo(prevPt.x, prevPt.y);
          ctx.lineTo(currPt.x, currPt.y);
          ctx.stroke();

          // 3) 헤드 근처 고열 시안/순백 코어 잔상 (t > 0.40 구간)
          if (t > 0.40) {
            ctx.strokeStyle = `rgba(224, 242, 254, ${tAlpha * 1.10})`;
            ctx.lineWidth = w * 0.35;
            ctx.beginPath();
            ctx.moveTo(prevPt.x, prevPt.y);
            ctx.lineTo(currPt.x, currPt.y);
            ctx.stroke();
          }

          ctx.restore();
        }
      }
    }

    prevPt = currPt;
  }
}

/**
 * 143-Charge: 푸른 불꽃 3D 궤도 회전 감싸기 (3D Orbiting Blue Flame Cloak)
 * - [유저 피드백 100% 반영]:
 *   불꽃회오리(Fire Spin)의 고품질 3D 회전 메커니즘을 적용:
 *   3개의 푸른 화염 스트림이 상/중/하 높이에서 스위핑 모션 트레일(Sweeping Trail)을 남기며 시전자를 회전
 *   Z축 관리 (Strict Depth Sorting):
 *     - z < -0.05 : 포켓몬 뒤편 (Z축 아래) -> drawBehindEffect에서 렌더링
 *     - z >= -0.05: 포켓몬 앞편 (Z축 위) -> drawEffect에서 렌더링
 *     - Painter's Algorithm: z축(깊이) 오름차순 정렬로 원근감 완벽 보장
 *     - 원근 스케일링: 뒤편 0.82x ~ 앞편 1.18x로 입체 원근감 극대화
 */
export function drawSkyAttackBlueFlameCloak(
  ctx: any,
  cx: number,
  cy: number,
  progress: number = 0,
  alpha: number = 1.0,
  stepIdx: number = 1,
  layer: "behind" | "front" = "front",
  orbitAngle: number = 0,
  radiusScale: number = 1.0
) {
  if (alpha <= 0.01 || progress <= 0) return;

  ctx.save();
  const isFront = layer === "front";

  // 1. 배후 아우라 (포켓몬 뒤편 은은한 푸른 발광)
  if (!isFront) {
    const auraProg = Math.min(1.0, progress / 0.4);
    if (auraProg > 0.01) {
      const bgAura = ctx.createRadialGradient(cx, cy, 10 * radiusScale, cx, cy, 60 * radiusScale);
      bgAura.addColorStop(0.00, `rgba(59, 130, 246, ${0.30 * alpha * auraProg})`);
      bgAura.addColorStop(0.60, `rgba(29, 78, 216, ${0.12 * alpha * auraProg})`);
      bgAura.addColorStop(1.00, "rgba(30, 58, 138, 0.00)");
      ctx.fillStyle = bgAura;
      ctx.beginPath();
      ctx.arc(cx, cy, 60 * radiusScale, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. 불꽃회오리 스타일 점진적 불꽃 증식 스트림 설정
  // [유저 요청: "회전할수록 불이 많아지게"]:
  // 초반 2줄기(progress 0.05~)에서 시작하여, 회전이 전개됨에 따라
  // 3줄기(0.28~) -> 4줄기(0.48~) -> 5줄기(0.68~) -> 6줄기(0.82~)로 불꽃이 나선형으로 늘어남!
  const STREAM_DEFS = [
    { baseAngle: 0.0, height: 12, threshold: 0.05 },                       // 1. 하단 (발/다리)
    { baseAngle: Math.PI, height: -12, threshold: 0.10 },                   // 2. 상단 (가슴/어깨)
    { baseAngle: Math.PI * 0.5, height: -2, threshold: 0.28 },              // 3. 중단 (허리)
    { baseAngle: Math.PI * 1.5, height: 6, threshold: 0.48 },               // 4. 하단-중간
    { baseAngle: Math.PI * 0.25, height: -20, threshold: 0.68 },            // 5. 최상단 (머리 위)
    { baseAngle: Math.PI * 1.25, height: 18, threshold: 0.82 },            // 6. 최하단 (발밑 지면)
  ];

  const Rx = 45 * radiusScale;       // X축 반경 (줌아웃 시 축소)
  const Ry = 18 * radiusScale;       // Y축(깊이) 반경 (아이소메트릭 기울기)
  const baseSize = 14.5 * (0.75 + 0.25 * Math.min(1.0, radiusScale));

  interface StreamFlame {
    x: number;
    y: number;
    z: number;
    size: number;
    alpha: number;
    flicker: number;
    tilt: number;
  }

  const flames: StreamFlame[] = [];

  for (let i = 0; i < STREAM_DEFS.length; i++) {
    const s = STREAM_DEFS[i];
    if (progress < s.threshold) continue;

    const streamBirth = Math.min(1.0, (progress - s.threshold) / 0.16);
    const streamAlpha = alpha * streamBirth;
    const phi = s.baseAngle + orbitAngle;
    const baseY = cy + s.height * (0.65 + 0.35 * radiusScale);
    const cosP = Math.cos(phi);
    const sinP = Math.sin(phi);

    const z = sinP;
    const depthScale = 1.0 + z * 0.18;
    const streamSize = baseSize * (0.65 + 0.35 * streamBirth) * depthScale;
    const trailAlpha = streamAlpha * Math.min(1.0, streamBirth * 1.25);
    const trailSpan = (Math.PI * 0.48) * (0.5 + 0.5 * streamBirth) * Math.min(1.0, 0.60 + 0.40 * radiusScale);

    // A. [불꽃회오리 고증]: 스위핑 모션 트레일 렌더링 (호형 궤적 잔상)
    drawBlueFlameSweepingTrail(
      ctx,
      cx,
      baseY,
      Rx,
      Ry,
      phi,
      streamSize,
      isFront,
      trailAlpha,
      trailSpan
    );

    // B. 화염 헤드 계산 & 등록
    const tilt = -cosP * 0.32;
    flames.push({
      x: cx + Rx * cosP,
      y: baseY + Ry * sinP,
      z,
      size: streamSize,
      alpha: streamAlpha * (0.91 + z * 0.09),
      flicker: stepIdx * 1.5 + i * 1.7,
      tilt,
    });
  }

  // Z축 필터링 & Painter's Algorithm 깊이 정렬 (오름차순: 깊은 곳부터 먼저 그림)
  const targetFlames = flames
    .filter((f) => (isFront ? f.z >= -0.05 : f.z < -0.05))
    .sort((a, b) => a.z - b.z);

  for (const f of targetFlames) {
    drawBlueFlameOrb(ctx, f.x, f.y, f.size, f.alpha, f.flicker, f.tilt);
  }

  ctx.restore();
}

/**
 * 하위 호환성 유지용 alias
 */
export function drawSkyAttackBlueFlameWings(
  ctx: any,
  cx: number,
  cy: number,
  progress: number = 0,
  alpha: number = 1.0,
  stepIdx: number = 1
) {
  drawSkyAttackBlueFlameCloak(ctx, cx, cy, progress, alpha, stepIdx, "front");
}

/**
 * 143: 불새 형상 화염체 (Fiery Phoenix Bird Aura)
 * - 상공에서 대각선 아래로 초고속 급강하 쇄도하는 전설의 불새 실루엣
 */
export function drawFieryPhoenixBird(
  ctx: any,
  cx: number,
  cy: number,
  scale: number = 1.0,
  rot: number = 0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || scale <= 0.01) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 1. 거대한 후방 화염 혜성 꼬리 (Flaming Streamers)
  const tailLen = 85;
  const tailGrad = ctx.createLinearGradient(0, 0, -tailLen, 0);
  tailGrad.addColorStop(0.00, "rgba(254, 240, 138, 0.95)");
  tailGrad.addColorStop(0.35, "rgba(249, 115, 22, 0.75)");
  tailGrad.addColorStop(0.70, "rgba(220, 38, 38, 0.45)");
  tailGrad.addColorStop(1.00, "rgba(185, 28, 28, 0.00)");

  // 중앙 꼬리 스트림
  ctx.fillStyle = tailGrad;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(-tailLen, 0);
  ctx.lineTo(0, 6);
  ctx.closePath();
  ctx.fill();

  // 상단/하단 보조 꼬리 불꽃
  ctx.beginPath();
  ctx.moveTo(-10, -18);
  ctx.lineTo(-tailLen * 0.8, -10);
  ctx.lineTo(-10, -8);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-10, 8);
  ctx.lineTo(-tailLen * 0.8, 10);
  ctx.moveTo(-10, 18);
  ctx.closePath();
  ctx.fill();

  // 2. 웅장하게 펼쳐진 양쪽 화염 날개 (Majestic Flaming Wings)
  const WING_OUTER = "#EA580C";
  const WING_MID = "#F59E0B";
  const WING_INNER = "#FEF08A";

  // 외곽 화염 날개 (Darker Orange Flame)
  ctx.fillStyle = WING_OUTER;
  ctx.beginPath();
  // 윗날개
  ctx.moveTo(12, -4);
  ctx.bezierCurveTo(4, -30, -14, -50, -18, -58);
  ctx.lineTo(-14, -42);
  ctx.lineTo(-24, -36);
  ctx.lineTo(-18, -24);
  ctx.lineTo(-28, -16);
  ctx.lineTo(-10, -8);
  // 아랫날개 (대칭)
  ctx.lineTo(-10, 8);
  ctx.lineTo(-28, 16);
  ctx.lineTo(-18, 24);
  ctx.lineTo(-24, 36);
  ctx.lineTo(-14, 42);
  ctx.lineTo(-18, 58);
  ctx.bezierCurveTo(-14, 50, 4, 30, 12, 4);
  ctx.closePath();
  ctx.fill();

  // 중간 황금빛 날개 깃털 (Golden Yellow Flame)
  ctx.fillStyle = WING_MID;
  ctx.beginPath();
  ctx.moveTo(14, -3);
  ctx.bezierCurveTo(6, -24, -8, -40, -12, -48);
  ctx.lineTo(-9, -34);
  ctx.lineTo(-18, -28);
  ctx.lineTo(-12, -18);
  ctx.lineTo(-6, -6);
  // 아랫날개
  ctx.lineTo(-6, 6);
  ctx.lineTo(-12, 18);
  ctx.lineTo(-18, 28);
  ctx.lineTo(-9, 34);
  ctx.lineTo(-12, 48);
  ctx.bezierCurveTo(-8, 40, 6, 24, 14, 3);
  ctx.closePath();
  ctx.fill();

  // 내부 밝은 하이라이트 날개 (Bright Lemon Core)
  ctx.fillStyle = WING_INNER;
  ctx.beginPath();
  ctx.moveTo(16, -2);
  ctx.bezierCurveTo(8, -18, -2, -30, -6, -36);
  ctx.lineTo(-4, -26);
  ctx.lineTo(-10, -20);
  ctx.lineTo(-3, -4);
  // 아랫날개
  ctx.lineTo(-3, 4);
  ctx.lineTo(-10, 20);
  ctx.lineTo(-4, 26);
  ctx.lineTo(-6, 36);
  ctx.bezierCurveTo(-2, 30, 8, 18, 16, 2);
  ctx.closePath();
  ctx.fill();

  // 3. 불새 머리 & 날카로운 부리 (Sharp Avian Beak & Head)
  // 부리 외곽 (#EA580C)
  ctx.fillStyle = "#EA580C";
  ctx.beginPath();
  ctx.moveTo(34, 0);       // 날카로운 부리 끝
  ctx.lineTo(16, -8);      // 머리 상단
  ctx.lineTo(8, -12);      // 머리 깃
  ctx.lineTo(14, -4);
  ctx.lineTo(2, 0);        // 목
  ctx.lineTo(14, 4);
  ctx.lineTo(8, 12);       // 머리 깃
  ctx.lineTo(16, 8);       // 머리 하단
  ctx.closePath();
  ctx.fill();

  // 부리 황금 코어 (#FEF08A)
  ctx.fillStyle = "#FEF08A";
  ctx.beginPath();
  ctx.moveTo(32, 0);
  ctx.lineTo(16, -5);
  ctx.lineTo(4, 0);
  ctx.lineTo(16, 5);
  ctx.closePath();
  ctx.fill();

  // 순백 초고열 심장부 코어 (#FFFFFF)
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(26, 0);
  ctx.lineTo(12, -2.5);
  ctx.lineTo(0, 0);
  ctx.lineTo(12, 2.5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 143: 불새 격돌 대폭발 & 화염 충격파 (Cataclysmic Impact Explosion)
 */
export function drawSkyAttackExplosion(
  ctx: any,
  tx: number,
  ty: number,
  progress: number = 0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || progress <= 0) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const p = Math.min(1.0, progress);

  // 1. 방사형 화염 폭발 링
  const ringR = 25 + p * 75;
  ctx.strokeStyle = `rgba(234, 88, 12, ${Math.max(0, (1 - p) * 0.9)})`;
  ctx.lineWidth = Math.max(1.2, 5.0 * (1 - p));
  ctx.beginPath();
  ctx.ellipse(tx, ty, ringR * 1.25, ringR * 0.85, 0, 0, Math.PI * 2);
  ctx.stroke();

  const innerRingR = ringR * 0.65;
  ctx.strokeStyle = `rgba(254, 240, 138, ${Math.max(0, (1 - p) * 0.95)})`;
  ctx.lineWidth = Math.max(1.0, 3.2 * (1 - p));
  ctx.beginPath();
  ctx.ellipse(tx, ty, innerRingR * 1.25, innerRingR * 0.85, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 2. 사방으로 뻗어나가는 거대한 불새 날개형 충격파 칼날 (Flaming Shockwave Blades)
  const bladeLen = (1 - p * 0.6) * 55;
  const numBlades = 8;
  for (let i = 0; i < numBlades; i++) {
    const angle = (i * Math.PI * 2) / numBlades + p * 0.35;
    const bx = tx + Math.cos(angle) * (20 + p * 45);
    const by = ty + Math.sin(angle) * (20 + p * 45) * 0.75;

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(angle);

    ctx.fillStyle = i % 2 === 0 ? "#F59E0B" : "#EA580C";
    ctx.beginPath();
    ctx.moveTo(bladeLen, 0);
    ctx.lineTo(0, -6 * (1 - p));
    ctx.lineTo(-bladeLen * 0.3, 0);
    ctx.lineTo(0, 6 * (1 - p));
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(bladeLen * 0.6, 0);
    ctx.lineTo(0, -2 * (1 - p));
    ctx.lineTo(0, 2 * (1 - p));
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // 3. 중심 초고열 화염구 섬광
  if (p < 0.7) {
    const coreScale = (1 - p * 1.3);
    const grad = ctx.createRadialGradient(tx, ty, 5, tx, ty, 42 * coreScale);
    grad.addColorStop(0.00, "rgba(255, 255, 255, 1.0)");
    grad.addColorStop(0.35, "rgba(254, 240, 138, 0.95)");
    grad.addColorStop(0.70, "rgba(234, 88, 12, 0.75)");
    grad.addColorStop(1.00, "rgba(185, 28, 28, 0.0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(tx, ty, 42 * coreScale, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. 사방으로 튀는 불꽃 파편 스파크들
  const DEBRIS = [
    { vx: -48, vy: -36, r: 3.2 },
    { vx:  52, vy: -42, r: 3.5 },
    { vx: -62, vy:  12, r: 2.8 },
    { vx:  58, vy:  18, r: 3.0 },
    { vx: -25, vy: -58, r: 3.6 },
    { vx:  28, vy: -62, r: 3.8 },
    { vx: -38, vy:  34, r: 2.6 },
    { vx:  42, vy:  30, r: 2.5 },
  ];
  for (const d of DEBRIS) {
    const dx = tx + d.vx * p;
    const dy = ty + d.vy * p + 30 * p * p;
    ctx.fillStyle = "#FEF08A";
    ctx.beginPath();
    ctx.arc(dx, dy, Math.max(0.8, d.r * (1 - p * 0.6)), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 143-Charge Behind Effect
 */
export function drawSkyAttackChargeBehindEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    casterPos?: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    width?: number;
    height?: number;
    [key: string]: any;
  }
) {
  const dimAlpha = frame.dimAlpha ?? 0;
  if (dimAlpha > 0.005) {
    drawDimOverlay(ctx, dimAlpha, "rgba(0, 0, 0, 1.0)");
  }

  const casterPos = drawCtx.casterPos ?? drawCtx.attackerPos;
  const chargeProg = frame.chargeProgress ?? 0;
  const chargeAlpha = frame.chargeAlpha ?? 1.0;
  const flameIdx = frame.flameIndex ?? frame.moveStep ?? 1;
  const orbitAngle = frame.orbitAngle ?? (flameIdx * 0.9);
  const radiusScale = frame.radiusScale ?? 1.0;

  // Z축 아래: 포켓몬 스프라이트 뒤편(z < 0)에 위치하는 공전 푸른 불꽃들
  if (chargeProg > 0 && chargeAlpha > 0.01) {
    drawSkyAttackBlueFlameCloak(ctx, casterPos.x, casterPos.y, chargeProg, chargeAlpha, flameIdx, "behind", orbitAngle, radiusScale);
  }
}

/**
 * 143-Charge Front Effect: 포켓몬 스프라이트 앞편 푸른 불꽃 (Z축 위)
 */
export function drawSkyAttackChargeEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    casterPos?: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    width?: number;
    height?: number;
    [key: string]: any;
  }
) {
  const casterPos = drawCtx.casterPos ?? drawCtx.attackerPos;
  const chargeProg = frame.chargeProgress ?? 0;
  const chargeAlpha = frame.chargeAlpha ?? 1.0;
  const flameIdx = frame.flameIndex ?? frame.moveStep ?? 1;
  const orbitAngle = frame.orbitAngle ?? (flameIdx * 0.9);
  const radiusScale = frame.radiusScale ?? 1.0;

  // Z축 위: 포켓몬 스프라이트 앞편(z >= 0)에서 감싸는 공전 푸른 불꽃들
  if (chargeProg > 0 && chargeAlpha > 0.01) {
    drawSkyAttackBlueFlameCloak(ctx, casterPos.x, casterPos.y, chargeProg, chargeAlpha, flameIdx, "front", orbitAngle, radiusScale);
  }

  // 체내 흡수 섬광 (Absorption Core Flash)
  const absGlow = frame.absorptionGlow ?? 0;
  if (absGlow > 0.01) {
    ctx.save();
    const g = ctx.createRadialGradient(casterPos.x, casterPos.y, 4, casterPos.x, casterPos.y, 42);
    g.addColorStop(0.00, `rgba(255, 255, 255, ${0.90 * absGlow})`);
    g.addColorStop(0.35, `rgba(186, 230, 253, ${0.75 * absGlow})`);
    g.addColorStop(0.70, `rgba(59, 130, 246, ${0.35 * absGlow})`);
    g.addColorStop(1.00, "rgba(29, 78, 216, 0.00)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(casterPos.x, casterPos.y, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * 유기적인 눈물/유성 형태의 푸른 불꽃 잔재 (Organic Trailing Flame Wisp)
 * - [유저 피드백]: "뒤에 따라오는 불꽃 잔재들도 동그랗기만하고" 완전 해소
 * - 원형(circle) 배제: 앞쪽은 유선형 불꽃 헤드, 뒤쪽은 유기적으로 펄럭이며 길게 빠지는 화염 꼬리
 * - 중심 순백 코어 -> 아이스 화이트 -> 일렉트릭 시안 -> 100% 외곽 완전 투명 그라데이션
 */
function drawOrganicFlameWisp(
  ctx: any,
  ox: number,
  oy: number,
  size: number,
  flickerSeed: number,
  alpha: number,
  pulseScale: number = 1.0,
  pulseStretch: number = 1.0
) {
  if (alpha <= 0.01 || size <= 1) return;
  ctx.save();
  ctx.translate(ox, oy);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const effSize = size * pulseScale;
  const tailLen = effSize * 2.2 * pulseStretch;
  const sway1 = Math.sin(flickerSeed * 2.2) * (effSize * 0.28);
  const sway2 = Math.cos(flickerSeed * 1.8) * (effSize * 0.22);
  const w = effSize * 0.72;

  // 1. 외곽 은은한 푸른 발광 아우라 (외곽 끝 100% 완전 투명)
  const haloGrad = ctx.createRadialGradient(0, 0, effSize * 0.15, -tailLen * 0.4, 0, effSize * 2.4);
  haloGrad.addColorStop(0.00, "rgba(56, 189, 248, 0.45)");
  haloGrad.addColorStop(0.40, "rgba(37, 99, 235, 0.20)");
  haloGrad.addColorStop(0.75, "rgba(29, 78, 216, 0.06)");
  haloGrad.addColorStop(1.00, "rgba(29, 78, 216, 0.00)");
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.ellipse(-tailLen * 0.4, 0, effSize * 2.4, effSize * 1.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. 메인 유기적 화염 바디 (위아래로 일렁이며 뒤로 길게 빠지는 불꽃)
  const bodyGrad = ctx.createLinearGradient(effSize * 0.7, 0, -tailLen, sway1);
  bodyGrad.addColorStop(0.00, "rgba(224, 242, 254, 0.98)");
  bodyGrad.addColorStop(0.25, "rgba(56, 189, 248, 0.90)");
  bodyGrad.addColorStop(0.65, "rgba(37, 99, 235, 0.55)");
  bodyGrad.addColorStop(0.90, "rgba(30, 58, 138, 0.18)");
  bodyGrad.addColorStop(1.00, "rgba(30, 58, 138, 0.00)");

  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(effSize * 0.7, 0);
  ctx.bezierCurveTo(effSize * 0.45, -w, -effSize * 0.4, -w * 0.8, -tailLen, sway1);
  ctx.bezierCurveTo(-effSize * 0.4, w * 0.8, effSize * 0.45, w, effSize * 0.7, 0);
  ctx.closePath();
  ctx.fill();

  // 3. 보조 일렁이는 곁불꽃 혀 (Flickering Flame Tongue)
  ctx.beginPath();
  ctx.moveTo(effSize * 0.2, -w * 0.35);
  ctx.quadraticCurveTo(-effSize * 0.4, -w * 1.3, -tailLen * 0.7, -w * 0.6 + sway2);
  ctx.quadraticCurveTo(-effSize * 0.25, -w * 0.2, effSize * 0.2, -w * 0.35);
  ctx.closePath();
  ctx.fill();

  // 4. 중심 순백 초고열 코어 불꽃 (하드한 동그라미가 아닌 유기적 코어)
  const coreLen = tailLen * 0.50;
  const coreW = w * 0.45;
  const coreGrad = ctx.createLinearGradient(effSize * 0.5, 0, -coreLen, sway1 * 0.5);
  coreGrad.addColorStop(0.00, "#FFFFFF");
  coreGrad.addColorStop(0.40, "rgba(255, 255, 255, 0.95)");
  coreGrad.addColorStop(0.75, "rgba(186, 230, 253, 0.60)");
  coreGrad.addColorStop(1.00, "rgba(56, 189, 248, 0.00)");

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.moveTo(effSize * 0.5, 0);
  ctx.bezierCurveTo(effSize * 0.3, -coreW, -effSize * 0.2, -coreW * 0.7, -coreLen, sway1 * 0.5);
  ctx.bezierCurveTo(-effSize * 0.2, coreW * 0.7, effSize * 0.3, coreW, effSize * 0.5, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 고열 방사형 푸른 화염구 (Roaring Volumetric Flame Puff)
 * - 5세대 본가(media_1790333787364.png) 고증:
 * - [화염 융합 핵심]: 화염구들이 겹치는 내부는 파란 테두리가 생기지 않고 순백/시안으로 매끄럽게 융합(Fusion)!
 * - 오직 전체 화염체의 최외곽 둘레에만 짙은 코발트 블루 화염 맨틀이 위치함
 */
function drawRoaringFlamePuff(
  ctx: any,
  x: number,
  y: number,
  r: number,
  alpha: number = 1.0,
  type: "white_core" | "cyan_fire" | "blue_mantle" | "gas_shroud" = "cyan_fire",
  seed: number = 0
) {
  if (r <= 0.8 || alpha <= 0.01) return;
  const jx = x + Math.sin(seed * 4.3) * (r * 0.12);
  const jy = y + Math.cos(seed * 3.7) * (r * 0.12);

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  const grad = ctx.createRadialGradient(jx, jy, r * 0.08, jx, jy, r);

  if (type === "white_core") {
    // 순백 초고열 코어: 겹치는 내부에서 어두운 파란선이 생기지 않도록 순백 -> 아이스 시안 -> 투명 시안으로 완벽 융합
    grad.addColorStop(0.00, "#FFFFFF");
    grad.addColorStop(0.40, "rgba(224, 242, 254, 0.98)");
    grad.addColorStop(0.75, "rgba(56, 189, 248, 0.65)");
    grad.addColorStop(1.00, "rgba(56, 189, 248, 0.00)");
  } else if (type === "cyan_fire") {
    // 일렉트릭 시안 플라즈마: 겹치는 불꽃끼리 서로 파란 테두리를 만들지 않고 하나로 융합
    grad.addColorStop(0.00, "rgba(224, 242, 254, 0.95)");
    grad.addColorStop(0.40, "rgba(56, 189, 248, 0.90)");
    grad.addColorStop(0.75, "rgba(56, 189, 248, 0.45)");
    grad.addColorStop(1.00, "rgba(56, 189, 248, 0.00)");
  } else if (type === "blue_mantle") {
    // 코발트 블루 외곽 맨틀: 융합된 화염체 전체의 '가장 바깥쪽 둘레(외곽 실루엣)'만을 감싸는 짙은 푸른 화염
    grad.addColorStop(0.00, "rgba(56, 189, 248, 0.85)");
    grad.addColorStop(0.40, "rgba(37, 99, 235, 0.70)");
    grad.addColorStop(0.75, "rgba(30, 64, 175, 0.40)");
    grad.addColorStop(1.00, "rgba(30, 58, 138, 0.00)");
  } else {
    // gas_shroud / heat haze: 최외곽 대기 열기
    grad.addColorStop(0.00, "rgba(56, 189, 248, 0.35)");
    grad.addColorStop(0.50, "rgba(37, 99, 235, 0.15)");
    grad.addColorStop(0.85, "rgba(29, 78, 216, 0.04)");
    grad.addColorStop(1.00, "rgba(29, 78, 216, 0.00)");
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(jx, jy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 유기적 연속 화염 깃털 플룸 (Continuous Flowing Flame Feather Ribbon)
 * - [유저 피드백 100% 반영]:
 *   1) 징그러운 구슬/원형 점(Circles) 나열 전면 배제!
 *   2) 뿌리부터 끝까지 끊김 없이 웅장하고 날렵하게 뻗어나가는 '연속된 유선형 화염 리본'
 *   3) [외곽 투명 핵심]: 가장자리 테두리가 딱딱한 벡터선이 아니라, 100% 투명(rgba 0.0)으로 부드럽게 녹아드는 다층 외곽 투명 그라데이션(Soft Feathered Transparency)
 *   4) 깃털 중심축을 따라 흐르는 일체형 순백-시안 초고열 발광 코어
 */
function drawFlameTonguePlume(
  ctx: any,
  sx: number,
  sy: number,
  c1x: number,
  c1y: number,
  c2x: number,
  c2y: number,
  tx: number,
  ty: number,
  baseW: number,
  sway: number,
  alpha: number = 1.0,
  isFar: boolean = false,
  seed: number = 0
) {
  if (alpha <= 0.01 || baseW <= 1) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const tipX = tx;
  const tipY = ty + sway;

  // 방향 벡터 및 둥근 불꽃 팁 법선 계산 (날카로운 바늘 끝 제거 -> 부드러운 불꽃 꽃잎형 라운드 팁)
  const dx = tipX - c2x;
  const dy = tipY - c2y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;

  // 1. [외곽 투명] 최외곽 소프트 투명 아우라 슈라우드 (Outer Feathered Transparent Shroud)
  const shroudW = baseW * 1.30;
  const sTipR = Math.max(2.8, shroudW * 0.20); // 슈라우드 라운드 반경
  const shroudGrad = ctx.createLinearGradient(sx, sy, tipX, tipY);
  if (isFar) {
    shroudGrad.addColorStop(0.00, "rgba(56, 189, 248, 0.30)");
    shroudGrad.addColorStop(0.30, "rgba(37, 99, 235, 0.15)");
    shroudGrad.addColorStop(0.60, "rgba(30, 64, 175, 0.05)");
    shroudGrad.addColorStop(0.85, "rgba(29, 78, 216, 0.00)"); // 팁 이전부터 100% 외곽 투명
    shroudGrad.addColorStop(1.00, "rgba(29, 78, 216, 0.00)");
  } else {
    shroudGrad.addColorStop(0.00, "rgba(186, 230, 253, 0.38)");
    shroudGrad.addColorStop(0.30, "rgba(56, 189, 248, 0.20)");
    shroudGrad.addColorStop(0.60, "rgba(37, 99, 235, 0.05)");
    shroudGrad.addColorStop(0.85, "rgba(29, 78, 216, 0.00)"); // 팁 이전부터 100% 외곽 투명
    shroudGrad.addColorStop(1.00, "rgba(29, 78, 216, 0.00)");
  }

  ctx.fillStyle = shroudGrad;
  ctx.beginPath();
  ctx.moveTo(sx, sy - shroudW * 0.5);
  ctx.bezierCurveTo(c1x, c1y - shroudW * 0.42, c2x + nx * sTipR, c2y + ny * sTipR, tipX + nx * sTipR, tipY + ny * sTipR);
  // 끝부분 V자 뾰족점 대신 부드러운 원형 호로 돌아나옴
  ctx.bezierCurveTo(
    tipX + nx * sTipR + ux * sTipR * 1.2, tipY + ny * sTipR + uy * sTipR * 1.2,
    tipX - nx * sTipR + ux * sTipR * 1.2, tipY - ny * sTipR + uy * sTipR * 1.2,
    tipX - nx * sTipR, tipY - ny * sTipR
  );
  ctx.bezierCurveTo(c2x - nx * sTipR, c2y - ny * sTipR, c1x, c1y + shroudW * 0.42, sx, sy + shroudW * 0.5);
  ctx.closePath();
  ctx.fill();

  // 2. [메인 화염 바디] 연속적인 유선형 화염 깃털 (Main Continuous Flame Blade)
  // - [유저 피드백]: 팁 끝이 뾰족한 칼날이 아니라 부드럽게 둥글게 소산
  const bTipR = Math.max(2.2, baseW * 0.18); // 바디 라운드 반경
  const bodyGrad = ctx.createLinearGradient(sx, sy, tipX, tipY);
  if (isFar) {
    bodyGrad.addColorStop(0.00, "rgba(186, 230, 253, 0.85)");
    bodyGrad.addColorStop(0.25, "rgba(56, 189, 248, 0.68)");
    bodyGrad.addColorStop(0.55, "rgba(37, 99, 235, 0.45)");
    bodyGrad.addColorStop(0.75, "rgba(30, 64, 175, 0.15)");
    bodyGrad.addColorStop(0.90, "rgba(30, 58, 138, 0.00)"); // 팁 앞에서 완전 투명 소멸
    bodyGrad.addColorStop(1.00, "rgba(30, 58, 138, 0.00)");
  } else {
    bodyGrad.addColorStop(0.00, "#FFFFFF");
    bodyGrad.addColorStop(0.20, "rgba(224, 242, 254, 0.95)");
    bodyGrad.addColorStop(0.50, "rgba(56, 189, 248, 0.75)");
    bodyGrad.addColorStop(0.72, "rgba(37, 99, 235, 0.28)");
    bodyGrad.addColorStop(0.88, "rgba(29, 78, 216, 0.00)"); // 팁 앞에서 완전 투명 소멸
    bodyGrad.addColorStop(1.00, "rgba(29, 78, 216, 0.00)");
  }

  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(sx, sy - baseW * 0.5);
  ctx.bezierCurveTo(c1x, c1y - baseW * 0.40, c2x + nx * bTipR, c2y + ny * bTipR, tipX + nx * bTipR, tipY + ny * bTipR);
  // 바디 끝부분도 부드러운 불꽃 꽃잎형 라운드로 마감
  ctx.bezierCurveTo(
    tipX + nx * bTipR + ux * bTipR * 1.2, tipY + ny * bTipR + uy * bTipR * 1.2,
    tipX - nx * bTipR + ux * bTipR * 1.2, tipY - ny * bTipR + uy * bTipR * 1.2,
    tipX - nx * bTipR, tipY - ny * bTipR
  );
  ctx.bezierCurveTo(c2x - nx * bTipR, c2y - ny * bTipR, c1x, c1y + baseW * 0.40, sx, sy + baseW * 0.5);
  ctx.closePath();
  ctx.fill();

  // 3. [초고열 코어 척추선] 깃털 축을 따라 흐르는 단일 연속 순백 발광 코어
  // - [핵심]: 코어선은 깃털 끝(100%)까지 가지 않고 62% 지점에서 부드럽게 소산되어 끝부분이 날카롭지 않음!
  const coreW = baseW * (isFar ? 0.38 : 0.50);
  const coreReach = 0.62;
  const cEndX = sx * (1 - coreReach) + tipX * coreReach;
  const cEndY = sy * (1 - coreReach) + tipY * coreReach;
  const coreGrad = ctx.createLinearGradient(sx, sy, cEndX, cEndY);
  coreGrad.addColorStop(0.00, "#FFFFFF");
  coreGrad.addColorStop(0.40, "rgba(255, 255, 255, 0.96)");
  coreGrad.addColorStop(0.70, isFar ? "rgba(186, 230, 253, 0.40)" : "rgba(186, 230, 253, 0.70)");
  coreGrad.addColorStop(0.90, "rgba(56, 189, 248, 0.20)");
  coreGrad.addColorStop(1.00, "rgba(56, 189, 248, 0.00)"); // 부드럽게 소멸

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.moveTo(sx + 3, sy - coreW * 0.5);
  ctx.bezierCurveTo(
    c1x * 0.86 + sx * 0.14, c1y * 0.86 - coreW * 0.36,
    c2x * 0.86 + sx * 0.14, c2y * 0.86 - coreW * 0.16,
    cEndX, cEndY
  );
  ctx.bezierCurveTo(
    c2x * 0.86 + sx * 0.14, c2y * 0.86 + coreW * 0.16,
    c1x * 0.86 + sx * 0.14, c1y * 0.86 + coreW * 0.36,
    sx + 3, sy + coreW * 0.5
  );
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 불새 전용 울퉁불퉁 타오르는 유기적 화염/연기 덩어리(Billowing Flame & Smoke Puff) 제어점
 * - 용의분노(082) & 독가스(139) 고증: 완전한 원형을 배제하고 5~6개 화염 돌기(Lobes)가 살아 움직이는 볼륨감
 */
function getSkyAttackBillowingPuffPoints(
  baseR: number,
  seed: number,
  roll: number = 0,
  stretchX: number = 1.25
): { x: number; y: number }[] {
  const SAMPLES = 16;
  const pts: { x: number; y: number }[] = [];

  for (let i = 0; i < SAMPLES; i++) {
    const angle = (i / SAMPLES) * Math.PI * 2;
    // 후방(-X 방향, angle ≈ PI)으로 자연스럽게 늘어나는 유선형 불꽃 타원
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const aspect = 1.0 - cosA * (stretchX - 1.0) * 0.40;
    // 5~6개의 울퉁불퉁한 만화/애니메이션 화염 돌기 (Billowing Flame Lobes)
    const bump = 1.0
      + Math.sin(angle * 5 + roll + seed) * 0.18
      + Math.cos(angle * 3 - roll * 0.7) * 0.11
      + Math.sin(angle * 2 + seed * 1.3) * 0.07;

    const r = baseR * aspect * bump;
    pts.push({
      x: cosA * r * stretchX,
      y: sinA * r,
    });
  }
  return pts;
}

function traceSkyAttackPuffContour(ctx: any, pts: { x: number; y: number }[]) {
  const n = pts.length;
  if (n < 3) return;
  ctx.beginPath();
  const startMidX = (pts[0].x + pts[n - 1].x) * 0.5;
  const startMidY = (pts[0].y + pts[n - 1].y) * 0.5;
  ctx.moveTo(startMidX, startMidY);

  for (let i = 0; i < n; i++) {
    const curr = pts[i];
    const next = pts[(i + 1) % n];
    const midX = (curr.x + next.x) * 0.5;
    const midY = (curr.y + next.y) * 0.5;
    ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
  }
  ctx.closePath();
}

/**
 * 불새 푸른 화염 & 연기 퍼프 렌더러
 * - 용의분노(082) & 독가스(139) 결합:
 *   1) 최외곽 딥 인디고 / 코발트 블루 연기 슈라우드 (100% 외곽 투명 페이드)
 *   2) 중간 일렉트릭 시안 / 브라이트 블루 불꽃 덩어리
 *   3) (선택) 초고열 순백 / 아이스 시안 핫스팟 코어
 */
function drawSkyAttackBillowingPuff(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number = 1.0,
  seed: number = 0,
  roll: number = 0,
  hasCore: boolean = true,
  stretchX: number = 1.25
) {
  if (alpha <= 0.01 || radius <= 2) return;

  ctx.save();
  ctx.translate(cx, cy);

  // 1. 외곽 은은한 딥 코발트/인디고 연기 오라 (100% 외곽 투명 페이드)
  const auraPts = getSkyAttackBillowingPuffPoints(radius * 1.35, seed + 2.5, roll * 0.8, stretchX);
  traceSkyAttackPuffContour(ctx, auraPts);
  const auraR = radius * 1.45 * stretchX;
  const auraGrad = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, auraR);
  auraGrad.addColorStop(0.00, `rgba(37, 99, 235, ${alpha * 0.35})`);
  auraGrad.addColorStop(0.45, `rgba(29, 78, 216, ${alpha * 0.18})`);
  auraGrad.addColorStop(0.80, `rgba(30, 58, 138, ${alpha * 0.05})`);
  auraGrad.addColorStop(1.00, "rgba(30, 58, 138, 0.00)");
  ctx.fillStyle = auraGrad;
  ctx.fill();

  // 2. 메인 푸른 화염 덩어리 (일렉트릭 시안 -> 로열 블루 -> 인디고 페이드아웃)
  const flamePts = getSkyAttackBillowingPuffPoints(radius, seed, roll, stretchX);
  traceSkyAttackPuffContour(ctx, flamePts);
  const flameR = radius * 1.22 * stretchX;
  const flameGrad = ctx.createRadialGradient(0, 0, radius * 0.08, 0, 0, flameR);
  flameGrad.addColorStop(0.00, `rgba(186, 230, 253, ${alpha * 0.95})`);
  flameGrad.addColorStop(0.25, `rgba(56, 189, 248, ${alpha * 0.85})`);
  flameGrad.addColorStop(0.60, `rgba(37, 99, 235, ${alpha * 0.60})`);
  flameGrad.addColorStop(0.85, `rgba(29, 78, 216, ${alpha * 0.20})`);
  flameGrad.addColorStop(1.00, "rgba(29, 78, 216, 0.00)"); // 외곽 100% 완전 투명
  ctx.fillStyle = flameGrad;
  ctx.fill();

  // 3. 초고열 순백 코어 (hasCore인 앞쪽/중간 퍼프에만 작렬)
  if (hasCore) {
    const corePts = getSkyAttackBillowingPuffPoints(radius * 0.52, seed + 5.1, roll * 1.2, stretchX);
    traceSkyAttackPuffContour(ctx, corePts);
    const coreR = radius * 0.58 * stretchX;
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
    coreGrad.addColorStop(0.00, `rgba(255, 255, 255, ${alpha * 0.98})`);
    coreGrad.addColorStop(0.40, `rgba(224, 242, 254, ${alpha * 0.85})`);
    coreGrad.addColorStop(0.75, `rgba(56, 189, 248, ${alpha * 0.35})`);
    coreGrad.addColorStop(1.00, "rgba(56, 189, 248, 0.00)");
    ctx.fillStyle = coreGrad;
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 143: ) 형태의 3D 입체 푸른 불새 돌진체 (3D Stereoscopic Blue Flame Bird Charge)
 * - [유저 피드백 100% 반영]:
 *   1) 징그러운 구슬 목걸이/비눗방울 점 전면 제거!
 *   2) 음속으로 질주하는 웅장하고 날렵한 불새의 유선형 날개와 동체 실루엣 복원
 *   3) 날아가는 푸른 화염 & 연기 불꼬리 (용의분노 082 + 독가스 139 고증)
 *   4) 단일 초음속 관통 화염 부리 & 펄스 팽창 날개
 */
export function drawBlueFlameBirdCharge(
  ctx: any,
  cx: number,
  cy: number,
  angle: number,
  scale: number = 1.0,
  alpha: number = 1.0,
  wakeSeed: number = 0,
  isPlayer: boolean = true
) {
  if (alpha <= 0.01 || scale <= 0.01) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 펄스 파동 계산: 날개의 펄스 팽창 및 불꽃 맥동 (Wing Pulse Rhythm)
  const wingPulse = 1.0 + Math.sin(wakeSeed * 3.6) * 0.18;
  const wingSpread = 1.0 + Math.cos(wakeSeed * 3.6) * 0.12;
  const wingBasePulse = 1.0 + Math.sin(wakeSeed * 3.6) * 0.15;

  const swayW1 = Math.sin(wakeSeed * 2.5) * 5;
  const swayW2 = Math.cos(wakeSeed * 2.2) * 4;

  // =========================================================================
  // [Layer 0] 전신 부드러운 푸른 발광 아우라 (Soft Outer Ambient Glow)
  // - 과도한 다층 아우라를 배제하고 실루엣을 살리는 은은한 단일 앰비언트 글로우
  // =========================================================================
  const outerAura = ctx.createRadialGradient(4, 0, 6, 4, 0, 72);
  outerAura.addColorStop(0.00, "rgba(186, 230, 253, 0.25)");
  outerAura.addColorStop(0.40, "rgba(56, 189, 248, 0.12)");
  outerAura.addColorStop(0.75, "rgba(37, 99, 235, 0.03)");
  outerAura.addColorStop(1.00, "rgba(29, 78, 216, 0.00)");
  ctx.fillStyle = outerAura;
  ctx.beginPath();
  ctx.ellipse(4, 0, 74, 52, 0, 0, Math.PI * 2);
  ctx.fill();

  // =========================================================================
  // [Layer 1] 상단 원경 날개 (Far Wing, Z < 0, 펄스 팽창/수축 적용)
  // - 시야에서 먼 쪽으로 단축 투영된 5줄기 유선형 화염 깃털 리본
  // =========================================================================
  drawFlameTonguePlume(ctx, 16, -8, 24, -25 * wingPulse, 4, -42 * wingPulse, -28 * wingSpread, -55 * wingPulse, 16 * wingBasePulse, swayW1 * 0.70, alpha, true);
  drawFlameTonguePlume(ctx, 12, -10, 18, -21 * wingPulse, 0, -35 * wingPulse, -22 * wingSpread, -45 * wingPulse, 14 * wingBasePulse, swayW2 * 0.70, alpha, true);
  drawFlameTonguePlume(ctx, 8, -11, 13, -17 * wingPulse, -4, -28 * wingPulse, -16 * wingSpread, -35 * wingPulse, 12 * wingBasePulse, swayW1 * 0.55, alpha, true);
  drawFlameTonguePlume(ctx, 3, -11, 8, -14 * wingPulse, -6, -20 * wingPulse, -12 * wingSpread, -26 * wingPulse, 10 * wingBasePulse, swayW2 * 0.45, alpha, true);
  drawFlameTonguePlume(ctx, -2, -9, 3, -10 * wingPulse, -8, -14 * wingPulse, -12 * wingSpread, -18 * wingPulse, 9 * wingBasePulse, swayW1 * 0.35, alpha, true);

  // =========================================================================
  // [Layer 2] 날아가는 푸른 화염 & 연기 불꼬리 (Dynamic Fluid Flame Wake Tail)
  // - [유저 피드백 100% 반영]:
  //   1) 고정된 형태(rigid body)로 새와 함께 그대로 미끄러지는 현상 완전 해결!
  //   2) 유체 흐름(Fluid Flow): 비행 추진력에 의해 화염 덩어리들이 뒤로 끊임없이 뿜어져 흘러감
  //   3) 자연스러운 유선형 펄럭임(Aerodynamic Whipping Wave):
  //      동체 연결부는 흔들림 없이 밀착, 뒤로 갈수록 12~15px 자연스럽게 굽이치며 펄럭임
  //   4) 동적 펄스 & 변형: 퍼프 크기와 제트 콘의 두께/길이가 프레임마다 살아 움직이듯 팽창/수축
  //   5) 꼬리를 감싸며 휘날리는 유기적 화염 스트림(Flowing Flame Wisps)
  // =========================================================================

  // 1) 꼬리 유체 흐름 및 펄럭임 계산
  const tailWavePhase = wakeSeed * 3.6;
  const tailFlowOffset = ((wakeSeed * 22.0) % 28.0); // 뒤로 뿜어져 나가는 유체 흐름
  const tailTotalLen = 220.0 + Math.sin(wakeSeed * 2.8) * 20.0; // 프레임마다 200~240px로 역동적 신축

  // 꼬리 중심선의 부드러운 유선형 파동 (Aerodynamic Wave)
  const getTailWaveY = (frac: number) => {
    return Math.sin(tailWavePhase - frac * 3.8) * (frac * 14.0)
      + Math.cos(tailWavePhase * 0.8 + frac * 2.0) * (frac * 4.0);
  };

  const tipWaveY = getTailWaveY(1.0);
  const midWaveY = getTailWaveY(0.5);

  // A. 기저 테이퍼드 제트 콘 (Whipping Streamlined Jet Flame Cone)
  const coneGrad = ctx.createLinearGradient(2, 0, -tailTotalLen, tipWaveY);
  coneGrad.addColorStop(0.00, "#FFFFFF");
  coneGrad.addColorStop(0.12, "rgba(224, 242, 254, 0.98)");
  coneGrad.addColorStop(0.32, "rgba(56, 189, 248, 0.75)");
  coneGrad.addColorStop(0.65, "rgba(37, 99, 235, 0.32)");
  coneGrad.addColorStop(0.88, "rgba(29, 78, 216, 0.08)");
  coneGrad.addColorStop(1.00, "rgba(29, 78, 216, 0.00)"); // 완전 투명 소멸

  const coneThick = 15.0 + Math.sin(wakeSeed * 3.2) * 2.0;
  ctx.fillStyle = coneGrad;
  ctx.beginPath();
  ctx.moveTo(2, -coneThick);
  ctx.bezierCurveTo(-45, -coneThick * 0.75 + midWaveY * 0.35, -120, -5 + midWaveY, -tailTotalLen, tipWaveY);
  ctx.bezierCurveTo(-120, 5 + midWaveY, -45, coneThick * 0.75 + midWaveY * 0.35, 2, coneThick);
  ctx.closePath();
  ctx.fill();

  // B. 꼬리 중심축을 따라 휘날리는 유기적 화염 깃 (Flowing Flame Tendril Plumes)
  // - 꼬리 본체와 유기적으로 결합되어 뒤로 흩날리는 2가닥의 푸른 화염 깃
  const plume1Y = getTailWaveY(0.65) - 6;
  const plume2Y = getTailWaveY(0.65) + 6;
  const plumeTip1Y = getTailWaveY(0.9) - 12 + Math.sin(wakeSeed * 3.4) * 8.0;
  const plumeTip2Y = getTailWaveY(0.9) + 12 - Math.sin(wakeSeed * 3.4) * 8.0;

  drawFlameTonguePlume(ctx, -8, -5, -45, -12 + plume1Y * 0.5, -95, plume1Y, -165, plumeTip1Y, 14, 0, alpha * 0.85, true);
  drawFlameTonguePlume(ctx, -8, 5, -45, 12 + plume2Y * 0.5, -95, plume2Y, -165, plumeTip2Y, 14, 0, alpha * 0.85, true);

  // C. 동적으로 뒤로 뿜어져 흐르고 굽이치는 8연속 푸른 화염 퍼프 (Flowing & Billowing Flame Nodes)
  // - 프레임마다 x위치가 flowOffset으로 뒤로 흘러가며, y위치는 파동에 의해 유려하게 굽이침
  const BASE_PUFF_X = [-4, -26, -52, -84, -120, -158, -195, -232];
  const BASE_PUFF_R = [28.0, 24.5, 20.5, 16.5, 13.0, 10.0, 7.5, 5.0];

  for (let i = BASE_PUFF_X.length - 1; i >= 0; i--) {
    const frac = i / (BASE_PUFF_X.length - 1);
    // 1) 유체 흐름: 비행체에서 뿜어져 나와 뒤로 이동
    const posX = BASE_PUFF_X[i] - (frac > 0.12 ? tailFlowOffset * frac : 0);

    // 2) 부드러운 유선형 파동 Y
    const waveY = getTailWaveY(frac);

    // 3) 맥동하는 퍼프 크기 (프레임마다 팽창/수축)
    const pulseMod = 1.0 + Math.sin(wakeSeed * 3.8 + i * 1.7) * 0.20;
    const effR = BASE_PUFF_R[i] * pulseMod;

    // 4) 회전각 및 X축 스트레치
    const roll = wakeSeed * 2.0 + i * 1.2;
    const stretchX = 1.25 + frac * 0.40;
    const puffAlpha = alpha * Math.pow(Math.max(0, 1.0 - frac * 0.92), 1.15);
    const hasCore = i <= 3; // 앞쪽 4개 퍼프는 초고열 순백 코어 유지

    drawSkyAttackBillowingPuff(
      ctx,
      posX,
      waveY,
      effR,
      puffAlpha,
      wakeSeed * 1.5 + i * 7.3,
      roll,
      hasCore,
      stretchX
    );
  }

  // D. 굽이치는 슬립스트림을 따라 비산하는 유성 불티 스파크 12개
  for (let s = 0; s < 12; s++) {
    const spFrac = ((wakeSeed * 0.38 + s * 0.27) % 1.0);
    const spX = -4 - spFrac * (tailTotalLen - 15);
    const spWaveY = getTailWaveY(spFrac);
    const spJiggle = Math.sin(wakeSeed * 3.8 + s * 2.1) * (5.5 * (0.3 + spFrac * 0.7));
    const spY = spWaveY + spJiggle;
    const spSize = 2.4 * (1.0 - spFrac * 0.45);
    const spAlpha = alpha * (1.0 - spFrac * 0.85);

    ctx.fillStyle = `rgba(224, 242, 254, ${spAlpha})`;
    ctx.fillRect(spX - spSize * 0.5, spY - spSize * 0.5, spSize, spSize);
  }

  // A. 등줄기 3D 화염 능선 (Dorsal Spine Ridge Plumes)
  const spineSway = Math.sin(wakeSeed * 3.2) * 2.5;
  drawFlameTonguePlume(ctx, 16, -5, 12, -10, 2, -12, -6, -14, 8, spineSway, alpha, false);
  drawFlameTonguePlume(ctx, 6, -6, 2, -11, -6, -13, -14, -15, 7, spineSway * 0.8, alpha, false);
  drawFlameTonguePlume(ctx, -4, -6, -8, -10, -14, -12, -22, -13, 6, spineSway * 0.6, alpha, false);

  // B. 유선형 유기적 푸른 화염 동체 (Flowing Organic Blue Flame Fuselage)
  const bodySway1 = Math.sin(wakeSeed * 3.4) * 2.8;
  const bodySway2 = Math.cos(wakeSeed * 2.8) * 2.2;

  // 1) 동체 최외곽 소프트 투명 아우라 슈라우드 (Outer Feathered Transparent Shroud)
  const bShroudGrad = ctx.createLinearGradient(28, 0, -56, bodySway1);
  bShroudGrad.addColorStop(0.00, "rgba(224, 242, 254, 0.45)");
  bShroudGrad.addColorStop(0.30, "rgba(56, 189, 248, 0.30)");
  bShroudGrad.addColorStop(0.65, "rgba(37, 99, 235, 0.10)");
  bShroudGrad.addColorStop(0.90, "rgba(30, 58, 138, 0.00)");
  bShroudGrad.addColorStop(1.00, "rgba(30, 58, 138, 0.00)"); // 100% 외곽 투명

  ctx.fillStyle = bShroudGrad;
  ctx.beginPath();
  ctx.moveTo(28, 0);
  ctx.bezierCurveTo(18, -16, -10, -16, -48, -4 + bodySway1);
  ctx.bezierCurveTo(-56, bodySway2, -56, 0, -48, 4);
  ctx.bezierCurveTo(-10, 16, 18, 16, 28, 0);
  ctx.closePath();
  ctx.fill();

  // 2) 메인 유선형 푸른 화염 동체 (Main Flowing Flame Blade Body)
  const bMainGrad = ctx.createLinearGradient(24, 0, -50, bodySway1 * 0.8);
  bMainGrad.addColorStop(0.00, "#FFFFFF");
  bMainGrad.addColorStop(0.18, "rgba(224, 242, 254, 0.96)");
  bMainGrad.addColorStop(0.48, "rgba(56, 189, 248, 0.85)");
  bMainGrad.addColorStop(0.78, "rgba(37, 99, 235, 0.42)");
  bMainGrad.addColorStop(1.00, "rgba(29, 78, 216, 0.00)"); // 미부 투명 소산

  ctx.fillStyle = bMainGrad;
  ctx.beginPath();
  ctx.moveTo(24, 0);
  ctx.bezierCurveTo(14, -13, -8, -14, -44, -3 + bodySway1 * 0.8);
  ctx.bezierCurveTo(-50, bodySway2, -50, 0, -44, 3);
  ctx.bezierCurveTo(-8, 14, 14, 13, 24, 0);
  ctx.closePath();
  ctx.fill();

  // 3) 심장부 초고열 순백-시안 발광 코어 (White-Hot Luminous Core Spine)
  const bCoreGrad = ctx.createLinearGradient(20, 0, -32, bodySway1 * 0.4);
  bCoreGrad.addColorStop(0.00, "#FFFFFF");
  bCoreGrad.addColorStop(0.35, "rgba(255, 255, 255, 0.98)");
  bCoreGrad.addColorStop(0.65, "rgba(186, 230, 253, 0.80)");
  bCoreGrad.addColorStop(0.88, "rgba(56, 189, 248, 0.35)");
  bCoreGrad.addColorStop(1.00, "rgba(56, 189, 248, 0.00)");

  ctx.fillStyle = bCoreGrad;
  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.bezierCurveTo(12, -7, -4, -8, -26, -2 + bodySway1 * 0.4);
  ctx.bezierCurveTo(-32, 0, -32, 1, -26, 2);
  ctx.bezierCurveTo(-4, 7, 12, 7, 20, 0);
  ctx.closePath();
  ctx.fill();

  // =========================================================================
  // [Layer 4] 3D 초음속 관통 부리 (단일 화염 부리 & 외곽 투명 충격파)
  // - [유저 피드백]: "단일 화염 부리"
  // - 전방 공기를 날카롭게 꿰뚫는 단일 순백-시안 초음속 화염 부리
  // =========================================================================
  drawFlameTonguePlume(
    ctx,
    14, 0,
    30, 0,
    44, 0,
    58, Math.sin(wakeSeed * 3.0) * 1.5,
    18, 0, alpha, false
  );

  // 초음속 마하 원추 충격파 (바깥쪽으로 100% 투명해지는 다층 충격파 아우라)
  ctx.save();
  ctx.strokeStyle = "rgba(224, 242, 254, 0.85)";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(18, 0, 9, 22, 0, -Math.PI * 0.42, Math.PI * 0.42);
  ctx.stroke();

  ctx.strokeStyle = "rgba(56, 189, 248, 0.40)";
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.ellipse(16, 0, 11, 26, 0, -Math.PI * 0.42, Math.PI * 0.42);
  ctx.stroke();

  // 바깥쪽 최외곽 투명 충격파 호 (100% 투명 falloff)
  ctx.strokeStyle = "rgba(37, 99, 235, 0.15)";
  ctx.lineWidth = 7.0;
  ctx.beginPath();
  ctx.ellipse(14, 0, 13, 30, 0, -Math.PI * 0.42, Math.PI * 0.42);
  ctx.stroke();
  ctx.restore();

  // =========================================================================
  // [Layer 5] 하단 근경 날개 (Near Wing, Z > 0, 펄스 팽창/수축 적용)
  // - [3D 입체 핵심]: 화면 앞쪽으로 크고 웅장하게 펼쳐지며(1.25x), 몸체 앞면에서
  //   뻗어나와 몸체를 오버랩 (구슬 없이 매끄럽게 흐르는 5줄기 화염 깃)
  // - 눈부신 순백-아이스 일렉트릭 시안 하이라이트 & 외곽 투명 그라데이션
  // =========================================================================
  drawFlameTonguePlume(ctx, 22, 8, 34, 34 * wingPulse, 14, 60 * wingPulse, -38 * wingSpread, 76 * wingPulse, 22 * wingBasePulse, -swayW1 * 1.0, alpha, false);
  drawFlameTonguePlume(ctx, 17, 10, 27, 30 * wingPulse, 8, 48 * wingPulse, -30 * wingSpread, 64 * wingPulse, 19 * wingBasePulse, -swayW2 * 0.9, alpha, false);
  drawFlameTonguePlume(ctx, 11, 12, 19, 24 * wingPulse, 3, 38 * wingPulse, -22 * wingSpread, 52 * wingPulse, 16 * wingBasePulse, -swayW1 * 0.8, alpha, false);
  drawFlameTonguePlume(ctx, 4, 12, 12, 20 * wingPulse, -3, 28 * wingPulse, -16 * wingSpread, 40 * wingPulse, 13 * wingBasePulse, -swayW2 * 0.7, alpha, false);
  drawFlameTonguePlume(ctx, -3, 9, 4, 15 * wingPulse, -7, 20 * wingPulse, -14 * wingSpread, 28 * wingPulse, 10 * wingBasePulse, -swayW1 * 0.6, alpha, false);


  ctx.restore();
}

/**
 * 관통 순간의 초음속 대각선 참격선 (Supersonic Piercing Slash Cut)
 * - 상대를 뚫고 지나가는 순간, 상대 몸체를 대각선으로 베어 가르는 눈부신 순백-시안 참격선
 */
export function drawPiercingSlashCut(
  ctx: any,
  tx: number,
  ty: number,
  angle: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.translate(tx, ty);
  ctx.rotate(angle);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const len = 85;

  // 1. 외곽 푸른 발광 글로우
  ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
  ctx.lineWidth = 7.0;
  ctx.beginPath();
  ctx.moveTo(-len * 0.5, 0);
  ctx.lineTo(len * 0.5, 0);
  ctx.stroke();

  // 2. 중심 순백 초광속 참격 칼날
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(-len * 0.5, 0);
  ctx.lineTo(len * 0.5, 0);
  ctx.stroke();

  // 3. 중심 크로스 스파크 십자별
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 3.0, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 0, 3.0, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4. 비산하는 미세 스파크 6개
  const SPARKS = [
    { x: -22, y: -8 },
    { x:  22, y:  8 },
    { x: -14, y:  9 },
    { x:  16, y: -9 },
    { x:  -6, y: -12 },
    { x:   8, y:  12 },
  ];
  for (const s of SPARKS) {
    const sGrad = ctx.createRadialGradient(s.x, s.y, 0.4, s.x, s.y, 3.6);
    sGrad.addColorStop(0.00, "#FFFFFF");
    sGrad.addColorStop(0.35, "rgba(186, 230, 253, 0.90)");
    sGrad.addColorStop(0.70, "rgba(56, 189, 248, 0.45)");
    sGrad.addColorStop(1.00, "rgba(37, 99, 235, 0.00)");
    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 3.6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 새로 바꾼 불꽃(drawBlueFlameOrb) 규격의 유기적 폭발 화염체 (Exploding Organic Blue Flame)
 * - [유저 피드백 100% 반영]:
 *   1) 딱딱한 원형(circle/arc) 구체 전면 배제!
 *   2) 위로 치솟으며 타오르는 유기적 베지에 화염 형상
 *   3) 4단계 다층 발광 그라데이션:
 *      - 외곽 은은한 푸른 발광 아우라 (외곽 끝 100% 완전 투명)
 *      - 메인 화염 바디 (시안 -> 일렉트릭 블루 -> 로열 블루 -> 투명)
 *      - 내부 순백-아이스 시안 코어 불꽃
 *      - 최심부 초고열 화이트 핫스팟
 *   4) 폭발 충격에 따른 불꽃 팁 흔들림 및 방향성(tiltAngle) 지원
 */
/**
 * 143: 불새 고유 색상(일렉트릭 시안/로열 블루/순백 코어)의 엠보싱 폭발구 엽 (Volumetric Explosion Lobe)
 * - 불꽃(flame tongue)이 아닌 팡 터져나가는 둥근 구름형 만화풍 대폭발 덩어리
 */
export function drawBlueExplosionLobe(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number = 1.0,
  seed: number = 0
) {
  if (alpha <= 0.01 || radius <= 1.5) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 1. 외곽 딥 코발트 연기 아우라 (외곽 끝 100% 완전 투명)
  const auraR = radius * 1.45;
  const auraGrad = ctx.createRadialGradient(cx, cy, radius * 0.15, cx, cy, auraR);
  auraGrad.addColorStop(0.00, "rgba(59, 130, 246, 0.40)");
  auraGrad.addColorStop(0.45, "rgba(29, 78, 216, 0.18)");
  auraGrad.addColorStop(0.80, "rgba(30, 58, 138, 0.05)");
  auraGrad.addColorStop(1.00, "rgba(30, 58, 138, 0.00)");
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, auraR, 0, Math.PI * 2);
  ctx.fill();

  // 2. 다엽형 폭발 서브 퍼프들 (유기적이고 볼륨감 넘치는 폭발 구름 형태)
  const subAngles = [
    seed * 0.7 + 0.3,
    seed * 0.7 + 2.3,
    seed * 0.7 + 4.4,
  ];
  for (let i = 0; i < 3; i++) {
    const ang = subAngles[i];
    const dist = radius * 0.42;
    const subX = cx + Math.cos(ang) * dist;
    const subY = cy + Math.sin(ang) * dist * 0.88;
    const subR = radius * 0.68;

    const subGrad = ctx.createRadialGradient(subX, subY, 0, subX, subY, subR);
    subGrad.addColorStop(0.00, "rgba(224, 242, 254, 0.95)");
    subGrad.addColorStop(0.35, "rgba(56, 189, 248, 0.88)");
    subGrad.addColorStop(0.70, "rgba(37, 99, 235, 0.65)");
    subGrad.addColorStop(0.92, "rgba(29, 78, 216, 0.20)");
    subGrad.addColorStop(1.00, "rgba(29, 78, 216, 0.00)");
    ctx.fillStyle = subGrad;
    ctx.beginPath();
    ctx.arc(subX, subY, subR, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. 메인 중앙 폭발구 (일렉트릭 시안 -> 로열 블루 -> 인디고)
  const mainGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  mainGrad.addColorStop(0.00, "rgba(255, 255, 255, 0.98)");
  mainGrad.addColorStop(0.28, "rgba(186, 230, 253, 0.95)");
  mainGrad.addColorStop(0.60, "rgba(56, 189, 248, 0.85)");
  mainGrad.addColorStop(0.85, "rgba(37, 99, 235, 0.45)");
  mainGrad.addColorStop(1.00, "rgba(29, 78, 216, 0.00)");
  ctx.fillStyle = mainGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // 4. 최심부 초고열 순백 플라즈마 코어
  const coreR = radius * 0.45;
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
  coreGrad.addColorStop(0.00, "rgba(255, 255, 255, 0.98)");
  coreGrad.addColorStop(0.55, "rgba(224, 242, 254, 0.88)");
  coreGrad.addColorStop(1.00, "rgba(56, 189, 248, 0.00)");
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 143: 폭발 순간 사방으로 뻗어나가는 날카로운 폭발 섬광 스파이크 광선 (Explosion Blast Spikes)
 */
export function drawBlueExplosionBurstRays(
  ctx: any,
  cx: number,
  cy: number,
  rayCount: number = 8,
  maxLen: number = 55,
  alpha: number = 1.0,
  rotOffset: number = 0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  for (let i = 0; i < rayCount; i++) {
    const angle = rotOffset + (i * Math.PI * 2) / rayCount;
    const len = maxLen * (i % 2 === 0 ? 1.0 : 0.72);
    const halfW = (i % 2 === 0 ? 4.5 : 3.0) * alpha;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const rayGrad = ctx.createLinearGradient(0, 0, len, 0);
    rayGrad.addColorStop(0.00, "rgba(255, 255, 255, 0.98)");
    rayGrad.addColorStop(0.35, "rgba(186, 230, 253, 0.88)");
    rayGrad.addColorStop(0.70, "rgba(56, 189, 248, 0.50)");
    rayGrad.addColorStop(1.00, "rgba(37, 99, 235, 0.00)");

    ctx.fillStyle = rayGrad;
    ctx.beginPath();
    ctx.moveTo(len, 0);
    ctx.lineTo(len * 0.35, -halfW);
    ctx.lineTo(0, 0);
    ctx.lineTo(len * 0.35, halfW);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}

/**
 * 143: 폭발 잔여 푸른 연기 퍼프 클러스터 (Blue Smoke Puff)
 */
export function drawBlueExplosionSmokePuff(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.02 || radius <= 1.0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const puffGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  puffGrad.addColorStop(0.00, "rgba(186, 230, 253, 0.75)");
  puffGrad.addColorStop(0.45, "rgba(56, 189, 248, 0.50)");
  puffGrad.addColorStop(0.80, "rgba(37, 99, 235, 0.20)");
  puffGrad.addColorStop(1.00, "rgba(29, 78, 216, 0.00)");

  ctx.fillStyle = puffGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.arc(cx - radius * 0.42, cy + radius * 0.20, radius * 0.68, 0, Math.PI * 2);
  ctx.arc(cx + radius * 0.42, cy + radius * 0.20, radius * 0.68, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 143: 상대 위치 푸른 대폭발 (불새 타격 직결 폭발 연출)
 * - [유저 피드백 100% 반영]: "불새 타격시 나오는거 불꽃이라기 보다는 저 색상의 폭발이야"
 *   1) 촛불/장작불처럼 위로 날름거리는 불꽃(Flame) 전면 제거!
 *   2) 일렉트릭 시안 / 로열 블루 / 순백 고유 색상의 팡 터지는 볼류메트릭 폭발 구체(Explosion Lobes) 클러스터로 구현!
 *   3) 방사형 폭발 광선 스파이크(Burst Rays) + 2중 팽창 충격파 링 + 비산 플라즈마 파편 스파크
 *   4) Step 1: 직격 1차 본 폭발 (거대 폭발구 7개 + 8방향 스파이크 + 충격파 링 + 스파크)
 *   5) Step 2: 2차 연계 폭발 & 팽창 (상단 2차 폭발구 5개 + 6방향 스파이크 + 잔여 연기)
 *   6) Step 3: 부드럽게 상공으로 흩어지며 소산되는 푸른 연기 퍼프 클러스터
 */
export function drawSmallBlueFlameChainExplosion(
  ctx: any,
  tx: number,
  ty: number,
  step: number = 1,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 중심 초고열 플래시 섬광
  const drawCoreFlash = (cx: number, cy: number, r: number, flashAlpha: number) => {
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
    grad.addColorStop(0.00, `rgba(255, 255, 255, ${0.98 * flashAlpha})`);
    grad.addColorStop(0.35, `rgba(186, 230, 253, ${0.80 * flashAlpha})`);
    grad.addColorStop(0.70, `rgba(59, 130, 246, ${0.35 * flashAlpha})`);
    grad.addColorStop(1.00, "rgba(29, 78, 216, 0.00)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  };

  if (step === 1) {
    // 💥 Step 1 (1차 직격 충돌 폭발: 중심 코어 & 좌하단 점화):
    // 첫 충돌 지점에서 1차 폭발구들이 번쩍이며 급팽창!
    drawCoreFlash(tx, ty - 6, 36, 1.0);
    drawBlueExplosionBurstRays(ctx, tx, ty - 6, 8, 54, 0.95, 0.15);

    // [등장]: 중심 메인 코어 폭발구 + 좌하단 폭발구
    drawBlueExplosionLobe(ctx, tx, ty - 6, 34, 1.0, 1.0);
    drawBlueExplosionLobe(ctx, tx - 18, ty + 10, 24, 0.92, 2.0);
  } else if (step === 2) {
    // 🔥 Step 2 (교차 폭발 1: 1차 폭발 감쇄 & 우상단/상단 2차 콰쾅! 신규 교차 폭발!):
    // [페이드아웃]: 1차 중심 코어는 확산되며 연기화
    drawBlueExplosionLobe(ctx, tx, ty - 6, 38, 0.45, 1.0);
    drawBlueExplosionSmokePuff(ctx, tx - 20, ty + 12, 20, 0.50);

    // [신규 교차 등장]: 우상단 & 상단 솟구침 폭발구가 새로 쾅!
    drawCoreFlash(tx + 22, ty - 22, 28, 0.90);
    drawBlueExplosionBurstRays(ctx, tx + 20, ty - 20, 6, 48, 0.90, 0.65);
    drawBlueExplosionLobe(ctx, tx + 24, ty - 22, 30, 1.0, 3.2);
    drawBlueExplosionLobe(ctx, tx - 4, ty - 28, 27, 0.95, 4.1);
  } else if (step === 3) {
    // 💥 Step 3 (교차 폭발 2: 2차 폭발 감쇄 & 좌우 외곽 3차 콰쾅! 신규 교차 폭발!):
    // [페이드아웃]: 2차 우상단/상단 폭발구는 연기로 변하며 페이드아웃
    drawBlueExplosionLobe(ctx, tx + 26, ty - 24, 32, 0.45, 3.2);
    drawBlueExplosionSmokePuff(ctx, tx - 4, ty - 30, 22, 0.55);

    // [신규 교차 등장]: 좌측 & 우측 외곽 폭발구 2개가 새로운 스파이크와 함께 격렬히 팽창!
    drawCoreFlash(tx, ty + 2, 24, 0.85);
    drawBlueExplosionBurstRays(ctx, tx - 26, ty + 2, 5, 42, 0.85, 1.10);
    drawBlueExplosionBurstRays(ctx, tx + 26, ty + 0, 5, 42, 0.85, 0.40);
    drawBlueExplosionLobe(ctx, tx - 30, ty + 2, 28, 1.0, 5.0);
    drawBlueExplosionLobe(ctx, tx + 30, ty + 0, 29, 1.0, 6.0);
  } else if (step === 4) {
    // 🌟 Step 4 (교차 폭발 3: 3차 좌우 폭발 감쇄 & 상공 중심 4차 피날레 대화구 작렬!):
    // [페이드아웃]: 3차 좌우 폭발구 연기화 페이드아웃
    drawBlueExplosionSmokePuff(ctx, tx - 32, ty + 2, 24, 0.45);
    drawBlueExplosionSmokePuff(ctx, tx + 32, ty + 0, 24, 0.45);

    // [신규 교차 등장]: 상공 약간 위쪽에서 최종 피날레 대화구 쾅!
    const fx = tx + 6;
    const fy = ty - 18;
    drawCoreFlash(fx, fy, 32, 0.95);
    drawBlueExplosionBurstRays(ctx, fx, fy, 8, 52, 0.90, 0.35);
    drawBlueExplosionLobe(ctx, fx, fy, 36, 1.0, 7.5);
    drawBlueExplosionLobe(ctx, fx - 16, ty - 6, 24, 0.80, 8.2);
  } else if (step === 5) {
    // 💨 Step 5 (연막 확산 단계: 모든 폭발구가 부드러운 푸른 연기 퍼프로 전환되며 상공 확산):
    drawBlueExplosionSmokePuff(ctx, tx + 6, ty - 22, 26, 0.65);
    drawBlueExplosionSmokePuff(ctx, tx - 14, ty - 28, 22, 0.55);
    drawBlueExplosionSmokePuff(ctx, tx + 20, ty - 12, 20, 0.50);
    drawBlueExplosionSmokePuff(ctx, tx - 12, ty + 4, 18, 0.40);
  } else if (step === 6) {
    // 🌫️ Step 6 (최종 소멸: 상공으로 흩어지며 완전 투명으로 페이드아웃):
    drawBlueExplosionSmokePuff(ctx, tx + 8, ty - 28, 28, 0.35);
    drawBlueExplosionSmokePuff(ctx, tx - 16, ty - 34, 22, 0.28);
    drawBlueExplosionSmokePuff(ctx, tx + 22, ty - 16, 18, 0.20);
  }

  ctx.restore();
}

/**
 * 143 불새 Behind Effect
 * - [유저 요청]: "필터 하늘색 적용 후"
 */
export function drawSkyAttackBehindEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    casterPos?: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    width?: number;
    height?: number;
    [key: string]: any;
  }
) {
  const skyFilterAlpha = frame.skyFilterAlpha ?? frame.dimAlpha ?? 0;
  if (skyFilterAlpha > 0.005) {
    // 맑고 화사한 상공의 하늘색 / 시안 대기 필터 (media_1790333787364.png 배경색 고증)
    drawDimOverlay(ctx, skyFilterAlpha, "rgba(56, 189, 248, 1.0)");
  }
}

/**
 * 143 불새 Front Effect
 * - 1) 관통 순간 대각선 참격선 (showSlashCut)
 * - 2) ) 형태의 푸른 불새 돌진체 & 궤적 불빛 잔상
 * - 3) 통과하고 나서 상대 위치 푸른화염 연계폭발 (작게)
 */
export function drawSkyAttackEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    casterPos?: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    width?: number;
    height?: number;
    [key: string]: any;
  }
) {
  const tg = drawCtx.targetPos;
  const baseCaster = drawCtx.attackerPos;
  const dx = tg.x - baseCaster.x;
  const dy = tg.y - baseCaster.y;
  const chargeAngle = Math.atan2(dy, dx);

  // 1. ) 형태의 푸른 불새 돌진체 & 궤적 불빛 잔상 (Blue Flame Bird Charge)
  // - [유저 피드백]: "적스프라이트 위에 선 표시한건 제거" ➔ 가짜 참격선 제거, 불새 본체가 직접 적 스프라이트를 관통 비행!
  const birdAlpha = frame.birdAlpha ?? frame.phoenixAlpha ?? 0;
  const birdScale = frame.birdScale ?? 1.0;
  if (birdAlpha > 0.01) {
    const curCaster = drawCtx.casterPos ?? drawCtx.attackerPos;
    const wakeSeed = frame.birdStep ?? frame.moveStep ?? 1;

    drawBlueFlameBirdCharge(
      ctx,
      curCaster.x,
      curCaster.y,
      chargeAngle,
      birdScale,
      birdAlpha,
      wakeSeed,
      drawCtx.isPlayer
    );
  }

  // 3. 통과하고 나서 상대 위치 푸른 화염 연계폭발 (작게)
  const chainStep = frame.chainExplosionStep ?? 0;
  const chainAlpha = frame.chainExplosionAlpha ?? frame.explodeAlpha ?? 0;
  if (chainStep > 0 && chainAlpha > 0.01) {
    drawSmallBlueFlameChainExplosion(ctx, tg.x, tg.y, chainStep, chainAlpha);
  }
}

// ============================================================================
// ✨ 144: 변신 (Transform)
// - 시전포켓몬 납작 압축 & 순백화 -> 완전 납작 -> 대상포켓몬 후면(순백) -> 펴지며 순백 필터 서서히 제거
// ============================================================================

/**
 * 변신 바닥 젤 링 / 몰핑 펄스 (Morphing Gel Ring)
 * - 납작해질 때와 바닥에서 솟구칠 때 바닥면에 퍼지는 영롱한 타원형 에너지 파문
 */
export function drawTransformMorphRing(
  ctx: any,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || rx <= 1) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 외곽 은은한 하늘빛 글로우
  ctx.strokeStyle = "rgba(186, 230, 253, 0.45)";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 1.08, ry * 1.08, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 중간 부드러운 순백 링
  ctx.strokeStyle = "rgba(255, 255, 255, 0.90)";
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 내부 젤리같은 반투명 연하늘 채움
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
  grad.addColorStop(0.0, "rgba(255, 255, 255, 0.35)");
  grad.addColorStop(0.6, "rgba(224, 242, 254, 0.20)");
  grad.addColorStop(1.0, "rgba(186, 230, 253, 0.00)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 변신 피어오르는 미세 다이아몬드 별빛 (Rising Morph Sparkles)
 */
export function drawTransformSparkles(
  ctx: any,
  cx: number,
  cy: number,
  progress: number = 0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || progress <= 0) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const SPARKLES = [
    { ox: -28, oy: 18, vy: -38, size: 7.0, color: "#FFFFFF" },
    { ox:  26, oy: 16, vy: -42, size: 6.5, color: "#E0F2FE" },
    { ox: -14, oy:  8, vy: -48, size: 8.0, color: "#BAE6FD" },
    { ox:  16, oy: 12, vy: -52, size: 7.5, color: "#FFFFFF" },
    { ox:  -4, oy: 22, vy: -34, size: 5.5, color: "#F0F9FF" },
    { ox:  32, oy: 20, vy: -32, size: 6.0, color: "#BAE6FD" },
  ];

  for (const s of SPARKLES) {
    const sx = cx + s.ox;
    const sy = cy + s.oy + s.vy * progress;
    const sAlpha = Math.sin(progress * Math.PI) * alpha;
    const sSize = Math.max(1.5, s.size * (1 - progress * 0.3));

    if (sAlpha > 0.01) {
      drawMiniRetroStar(ctx, sx, sy, sSize, s.color);
    }
  }

  ctx.restore();
}

/**
 * 144 변신 Behind Effect
 * - 시전 포켓몬의 순백 실루엣이 선명하게 돋보이도록 하는 은은한 배경 집중 톤다운
 */
export function drawTransformBehindEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    casterPos?: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    width?: number;
    height?: number;
    [key: string]: any;
  }
) {
  const dimAlpha = frame.dimAlpha ?? 0;
  if (dimAlpha > 0.005) {
    drawDimOverlay(ctx, dimAlpha, "rgba(8, 12, 24, 1.0)");
  }
}

/**
 * 144 변신 Front Effect
 * - 발밑 몰핑 젤 파문 링
 * - 솟구치며 원래 형태로 펴질 때 피어오르는 미세 다이아몬드 별빛
 */
export function drawTransformEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    casterPos?: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    width?: number;
    height?: number;
    [key: string]: any;
  }
) {
  const casterPos = drawCtx.casterPos ?? drawCtx.attackerPos;

  // [유저 요청]: 바닥에 퍼지는 흰색 링 완전 제거
  // 피어오르는 몰핑 별빛 (Sparkles)만 유지
  const sparkProg = frame.sparkleProgress ?? 0;
  const sparkAlpha = frame.sparkleAlpha ?? 0;
  if (sparkProg > 0 && sparkAlpha > 0.01) {
    drawTransformSparkles(ctx, casterPos.x, casterPos.y, sparkProg, sparkAlpha);
  }
}



