// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawMiniRetroStar, drawStarburstImpact } from "../common/helpers.js";

/**
 * Gen 5 Moves 521 - 524 Renderers
 *
 * 524: 얼음숨결 (Frost Breath) - 얼음 타입 특수 공격기 (반드시 급소 판정)
 */

// ============================================================================
// ❄️ 524: 얼음숨결 (Frost Breath)
// ============================================================================

const FROST_WHITE = "#FFFFFF";
const FROST_ICE_CORE = "#E0F7FA";
const FROST_CYAN_LIGHT = "#B2EBF2";
const FROST_CYAN = "#4DD0E1";
const FROST_CYAN_DEEP = "#00ACC1";
const FROST_BLUE_BASE = "#00838F";
const FROST_BLUE_DARK = "#006064";

/**
 * 6방향 대칭 눈꽃송이 (Snowflake) 렌더링
 */
function drawSnowflake(
  ctx: any,
  x: number,
  y: number,
  size: number,
  rotation: number = 0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || size <= 0.5) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = Math.min(1.0, alpha);

  ctx.strokeStyle = FROST_WHITE;
  ctx.lineWidth = Math.max(1, size * 0.22);
  ctx.lineCap = "round";

  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(0, size);
    ctx.stroke();

    if (size >= 3.5) {
      const branchDist = size * 0.55;
      const branchLen = size * 0.35;
      ctx.beginPath();
      ctx.moveTo(-branchLen, -branchDist + branchLen * 0.4);
      ctx.lineTo(0, -branchDist);
      ctx.lineTo(branchLen, -branchDist + branchLen * 0.4);

      ctx.moveTo(-branchLen, branchDist - branchLen * 0.4);
      ctx.lineTo(0, branchDist);
      ctx.lineTo(branchLen, branchDist - branchLen * 0.4);
      ctx.stroke();
    }

    ctx.rotate(Math.PI / 3);
  }

  ctx.fillStyle = FROST_ICE_CORE;
  ctx.beginPath();
  const coreR = Math.max(1.2, size * 0.25);
  ctx.moveTo(0, -coreR);
  ctx.lineTo(coreR, 0);
  ctx.lineTo(0, coreR);
  ctx.lineTo(-coreR, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 날카로운 다이아몬드 얼음 파편 (Ice Shard / Crystal)
 */
function drawIceCrystal(
  ctx: any,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rotation: number = 0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || rx <= 0.5) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = Math.min(1.0, alpha);

  ctx.fillStyle = FROST_CYAN_LIGHT;
  ctx.beginPath();
  ctx.moveTo(0, -ry);
  ctx.lineTo(rx, 0);
  ctx.lineTo(0, ry);
  ctx.lineTo(-rx, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = FROST_WHITE;
  ctx.beginPath();
  ctx.moveTo(0, -ry);
  ctx.lineTo(rx * 0.4, 0);
  ctx.lineTo(0, ry * 0.7);
  ctx.lineTo(-rx * 0.3, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 부드러운 냉기 숨결 퍼프 (Frost Breath Vapor Puff)
 */
function drawFrostPuff(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number,
  tone: "deep" | "mid" | "light" = "mid"
) {
  if (alpha <= 0.01 || radius <= 0.5) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, alpha);

  const grad = ctx.createRadialGradient(
    x - radius * 0.2,
    y - radius * 0.2,
    radius * 0.1,
    x,
    y,
    radius
  );

  if (tone === "deep") {
    grad.addColorStop(0.0, "rgba(224, 247, 250, 0.75)");
    grad.addColorStop(0.35, "rgba(77, 208, 225, 0.55)");
    grad.addColorStop(0.70, "rgba(0, 131, 143, 0.35)");
    grad.addColorStop(1.0, "rgba(0, 96, 100, 0.0)");
  } else if (tone === "mid") {
    grad.addColorStop(0.0, "rgba(255, 255, 255, 0.90)");
    grad.addColorStop(0.40, "rgba(178, 235, 242, 0.65)");
    grad.addColorStop(0.75, "rgba(77, 208, 225, 0.35)");
    grad.addColorStop(1.0, "rgba(0, 172, 193, 0.0)");
  } else {
    grad.addColorStop(0.0, "rgba(255, 255, 255, 0.95)");
    grad.addColorStop(0.50, "rgba(224, 247, 250, 0.70)");
    grad.addColorStop(0.80, "rgba(178, 235, 242, 0.30)");
    grad.addColorStop(1.0, "rgba(77, 208, 225, 0.0)");
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 직선 얼음숨결 기저 냉기 바람 콘 (Straight Frost Cone)
 */
function drawStraightFrostCone(
  ctx: any,
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  startP: number = 0.0,
  endP: number = 1.0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || endP <= startP) return;

  const dx = targetX - startX;
  const dy = targetY - startY;
  const dist = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / dist;
  const uy = dy / dist;
  const nx = -uy;
  const ny = ux;

  const SAMPLES = 10;
  const pts: Array<{ cx: number; cy: number; w: number; s: number }> = [];

  for (let i = 0; i <= SAMPLES; i++) {
    const frac = i / SAMPLES;
    const s = startP + frac * (endP - startP);
    const cx = startX + ux * (dist * s);
    const cy = startY + uy * (dist * s);
    const w = 9.0 + s * 24.0;
    pts.push({ cx, cy, w, s });
  }

  ctx.save();

  for (let i = 0; i < SAMPLES; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];

    const midCx = (p0.cx + p1.cx) * 0.5;
    const midCy = (p0.cy + p1.cy) * 0.5;
    const midW = (p0.w + p1.w) * 0.5;
    const midS = (p0.s + p1.s) * 0.5;

    const startFade = Math.min(1.0, Math.max(0, (midS - startP) / 0.12));
    const endFade = Math.min(1.0, Math.max(0, (endP - midS) / 0.12));
    const backFade = midS > 1.0 ? Math.max(0, 1.0 - (midS - 1.0) / 0.52) : 1.0;
    const longFade = startFade * endFade * backFade;
    if (longFade <= 0.01) continue;

    const grad = ctx.createLinearGradient(
      midCx - nx * midW,
      midCy - ny * midW,
      midCx + nx * midW,
      midCy + ny * midW
    );

    const aBase = alpha * longFade;
    grad.addColorStop(0.0, "rgba(0, 172, 193, 0.0)");
    grad.addColorStop(0.20, `rgba(77, 208, 225, ${0.25 * aBase})`);
    grad.addColorStop(0.40, `rgba(178, 235, 242, ${0.55 * aBase})`);
    grad.addColorStop(0.50, `rgba(255, 255, 255, ${0.75 * aBase})`);
    grad.addColorStop(0.60, `rgba(178, 235, 242, ${0.55 * aBase})`);
    grad.addColorStop(0.80, `rgba(77, 208, 225, ${0.25 * aBase})`);
    grad.addColorStop(1.0, "rgba(0, 172, 193, 0.0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(p0.cx - nx * p0.w, p0.cy - ny * p0.w);
    ctx.lineTo(p1.cx - nx * p1.w, p1.cy - ny * p1.w);
    ctx.lineTo(p1.cx + nx * p1.w, p1.cy + ny * p1.w);
    ctx.lineTo(p0.cx + nx * p0.w, p0.cy + ny * p0.w);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 💨 얼음숨결 전용 직선 관통 제트 스트림 (Straight Penetrating Frost Breath Stream)
 */
function drawStraightFrostBreathStream(
  ctx: any,
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  startP: number = 0.0,
  endP: number = 1.0,
  alpha: number = 1.0,
  flowTime: number = 0.0,
  layer: "front" | "behind" = "front"
) {
  if (alpha <= 0.01 || endP <= startP) return;

  let segStart = startP;
  let segEnd = endP;

  if (layer === "front") {
    segStart = startP;
    segEnd = Math.min(1.02, endP);
  } else {
    segStart = Math.max(0.92, startP);
    segEnd = endP;
  }

  if (segEnd <= segStart) return;

  const dx = targetX - startX;
  const dy = targetY - startY;
  const dist = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / dist;
  const uy = dy / dist;
  const nx = -uy;
  const ny = ux;

  ctx.save();

  // 1. 직선 기저 냉기 바람 콘
  drawStraightFrostCone(ctx, startX, startY, targetX, targetY, segStart, segEnd, alpha * 0.95);

  // 2. 직선 방향으로 고속 쇄도하는 얼음숨결 퍼프 클러스터
  const BURST_SPACING = 0.075;
  const flowAdvance = (flowTime * 0.40) % BURST_SPACING;
  const activeEnd = segEnd;

  for (let k = 0; k < 20; k++) {
    const t = activeEnd - flowAdvance - k * BURST_SPACING;
    if (t < segStart - 0.03 || t > segEnd + 0.02) continue;

    const jiggle = Math.sin(k * 3.1 + flowTime * 2.4) * (2.0 + t * 2.8);

    const px = startX + ux * (dist * t) + nx * jiggle;
    const py = startY + uy * (dist * t) + ny * jiggle;

    const r = 9.0 + Math.pow(Math.max(0, t), 0.85) * 26.0;

    let puffAlpha = alpha * 0.88;
    if (t < segStart + 0.06) {
      puffAlpha *= Math.max(0, (t - segStart) / 0.06);
    }
    if (t > segEnd - 0.08) {
      puffAlpha *= Math.max(0, (segEnd - t) / 0.08);
    }

    if (layer === "behind" || t > 0.98) {
      const backDist = Math.max(0, t - 0.98);
      const backFade = Math.max(0, Math.pow(1.0 - Math.min(1.0, backDist / 0.52), 1.25));
      puffAlpha *= backFade;
    }

    drawFrostPuff(ctx, px, py, r, puffAlpha, layer === "behind" ? "deep" : "mid");
    drawFrostPuff(ctx, px, py, r * 0.60, puffAlpha * 0.75, layer === "behind" ? "deep" : "light");

    if (k % 2 === 0) {
      const flakeSize = 2.5 + t * 3.5;
      const flakeRot = flowTime * 4.0 + k * 1.5;
      drawSnowflake(ctx, px, py, flakeSize, flakeRot, puffAlpha * 0.95);
    } else {
      const crystalRx = 2.0 + t * 2.5;
      const crystalRy = 4.0 + t * 4.5;
      const crystalRot = flowTime * 3.0 + k * 1.2;
      drawIceCrystal(ctx, px, py, crystalRx, crystalRy, crystalRot, puffAlpha * 0.90);
    }
  }

  // 3. 직선 제트 스트림 외곽 냉기 숨결 가닥
  const WISP_COUNT = 9;
  for (let j = 0; j < WISP_COUNT; j++) {
    const wt = segStart + (j / (WISP_COUNT - 1)) * (segEnd - segStart);
    if (wt < 0.05) continue;

    const sign = j % 2 === 0 ? 1 : -1;
    const halfW = 6.0 + wt * 17.0;
    const wx = startX + ux * (dist * wt) + nx * (sign * halfW);
    const wy = startY + uy * (dist * wt) + ny * (sign * halfW);

    const wispR = 5.5 + wt * 13.0;
    let wispAlpha = alpha * 0.45;
    if (layer === "behind" || wt > 0.98) {
      const backDist = Math.max(0, wt - 0.98);
      const backFade = Math.max(0, 1.0 - Math.min(1.0, backDist / 0.52));
      wispAlpha *= backFade;
    }
    drawFrostPuff(ctx, wx, wy, wispR, wispAlpha, "light");
  }

  ctx.restore();
}

/**
 * ❄️ 524: 얼음숨결 후방 레이어 렌더러 (drawFrostBreathBehindEffect)
 */
export function drawFrostBreathBehindEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, attackerPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep || 1;
  const p = frame.effectProgress ?? 0.5;

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));
  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0));

  const mouthX = ax + (isP ? 34 : -34);
  const mouthY = ay - (isP ? 14 : 10);
  const targetCenterY = ty - (isP ? 14 : 10);

  const streamHead = frame.streamHead ?? 0.0;
  const streamTail = frame.streamTail ?? 0.0;
  const streamAlpha = frame.streamAlpha ?? 1.0;

  if (streamHead > 0.92 && streamAlpha > 0.01) {
    const flowTime = step * 2.0 + p * 4.0;
    drawStraightFrostBreathStream(
      targetCtx,
      mouthX,
      mouthY,
      tx,
      targetCenterY,
      streamTail,
      streamHead,
      streamAlpha,
      flowTime,
      "behind"
    );
  }

  if (step >= 3) {
    const BEHIND_PUFFS = [
      { dx: 18, dy: -12, r: 44, birth: 0.15 },
      { dx: -22, dy: 8, r: 40, birth: 0.30 },
      { dx: 6, dy: -26, r: 48, birth: 0.50 },
      { dx: -14, dy: -18, r: 42, birth: 0.70 },
    ];

    for (let i = 0; i < BEHIND_PUFFS.length; i++) {
      const b = BEHIND_PUFFS[i];
      let bAlpha = 0;
      let bScale = 1.0;
      let bRise = 0;

      if (step === 3) {
        if (p < b.birth) continue;
        const g = (p - b.birth) / 0.35;
        bAlpha = Math.min(0.85, g * 0.90);
        bScale = 0.5 + 0.5 * Math.sin(Math.min(1.0, g) * Math.PI * 0.5);
      } else if (step === 4) {
        bAlpha = 0.85;
      } else if (step === 5) {
        bAlpha = Math.max(0, 0.85 * (1.0 - p));
        bScale = 1.0 + p * 0.25;
        bRise = p * 25;
      }

      if (bAlpha > 0.02) {
        drawFrostPuff(
          targetCtx,
          tx + b.dx,
          targetCenterY + b.dy - bRise,
          b.r * bScale,
          bAlpha,
          "deep"
        );

        drawSnowflake(
          targetCtx,
          tx + b.dx * 1.2,
          targetCenterY + b.dy - bRise,
          5.5 * bScale,
          p * 3.0 + i,
          bAlpha * 0.85
        );
      }
    }
  }
}

/**
 * ❄️ 524: 얼음숨결 전면 레이어 렌더러 (drawFrostBreathEffect)
 */
export function drawFrostBreathEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, attackerPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep || 1;
  const p = frame.effectProgress ?? 0.5;

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));
  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0));

  const mouthX = ax + (isP ? 34 : -34);
  const mouthY = ay - (isP ? 14 : 10);
  const targetCenterY = ty - (isP ? 14 : 10);

  if (step === 1) {
    const muzzleAlpha = Math.min(0.95, p * 1.6);
    const muzzleR = 12 + p * 16;
    drawFrostPuff(targetCtx, mouthX, mouthY, muzzleR, muzzleAlpha, "mid");
    drawFrostPuff(targetCtx, mouthX, mouthY, muzzleR * 0.6, muzzleAlpha * 0.85, "light");

    drawSnowflake(targetCtx, mouthX - 3, mouthY - 4, 3.5 + p * 2.0, p * 2.0, muzzleAlpha);
    drawSnowflake(targetCtx, mouthX + 4, mouthY + 3, 2.5 + p * 1.5, -p * 2.5, muzzleAlpha * 0.85);
  }

  const streamHead = frame.streamHead ?? 0.0;
  const streamTail = frame.streamTail ?? 0.0;
  const streamAlpha = frame.streamAlpha ?? 1.0;

  if (streamHead > 0 && streamHead > streamTail && streamAlpha > 0.01) {
    const flowTime = step * 2.0 + p * 4.0;
    drawStraightFrostBreathStream(
      targetCtx,
      mouthX,
      mouthY,
      tx,
      targetCenterY,
      streamTail,
      streamHead,
      streamAlpha,
      flowTime,
      "front"
    );
  }

  if (step >= 3) {
    const FRONT_PUFFS = [
      { dx: -18, dy: 4, r: 38, birth: 0.10 },
      { dx: 14, dy: 8, r: 35, birth: 0.25 },
      { dx: 0, dy: 16, r: 34, birth: 0.45 },
    ];

    for (let i = 0; i < FRONT_PUFFS.length; i++) {
      const b = FRONT_PUFFS[i];
      let bAlpha = 0;
      let bScale = 1.0;
      let bRise = 0;

      if (step === 3) {
        if (p < b.birth) continue;
        const g = (p - b.birth) / 0.35;
        bAlpha = Math.min(0.80, g * 0.85);
        bScale = 0.5 + 0.5 * Math.sin(Math.min(1.0, g) * Math.PI * 0.5);
      } else if (step === 4) {
        bAlpha = 0.80;
      } else if (step === 5) {
        bAlpha = Math.max(0, 0.80 * (1.0 - p));
        bScale = 1.0 + p * 0.25;
        bRise = p * 25;
      }

      if (bAlpha > 0.02) {
        drawFrostPuff(
          targetCtx,
          tx + b.dx,
          targetCenterY + b.dy - bRise,
          b.r * bScale,
          bAlpha,
          "mid"
        );
      }
    }

    // 타격 임팩트: 반드시 급소(Critical Hit)를 상징하는 강력한 다이아몬드 섬광 & 충격파 링
    if (step === 3 && p <= 0.35) {
      const hitProgress = p / 0.35;
      targetCtx.save();
      targetCtx.globalAlpha = Math.max(0, 1.0 - hitProgress);

      const ringR = 14 + hitProgress * 36;
      targetCtx.strokeStyle = FROST_ICE_CORE;
      targetCtx.lineWidth = Math.max(1, 3.5 * (1.0 - hitProgress));
      targetCtx.beginPath();
      targetCtx.arc(tx, targetCenterY, ringR, 0, Math.PI * 2);
      targetCtx.stroke();

      drawMiniRetroStar(targetCtx, tx, targetCenterY, 22 * (1.0 - hitProgress), FROST_WHITE);
      targetCtx.restore();
    }

    const SNOW_PARTICLES = [
      { ox: -26, oy: 12, size: 4.8, speed: 1.3, phase: 0.10, isFlake: true },
      { ox: 22, oy: -14, size: 5.5, speed: 1.5, phase: 0.28, isFlake: false },
      { ox: -12, oy: -24, size: 4.2, speed: 1.2, phase: 0.52, isFlake: true },
      { ox: 28, oy: 15, size: 5.0, speed: 1.6, phase: 0.70, isFlake: false },
      { ox: 5, oy: 8, size: 6.2, speed: 1.7, phase: 0.85, isFlake: true },
      { ox: -30, oy: -8, size: 4.5, speed: 1.4, phase: 0.40, isFlake: false },
      { ox: 15, oy: -20, size: 3.8, speed: 1.3, phase: 0.62, isFlake: true },
    ];

    for (const pt of SNOW_PARTICLES) {
      const bP = (p * pt.speed + pt.phase) % 1.0;
      const bY = targetCenterY + pt.oy - bP * 30;
      const bX = tx + pt.ox + Math.sin(bP * Math.PI * 2) * 8;
      const bScale = Math.sin(bP * Math.PI);

      if (bScale > 0.08) {
        const partAlpha = Math.min(1.0, bScale * 1.3);
        if (pt.isFlake) {
          drawSnowflake(
            targetCtx,
            bX,
            bY,
            pt.size * bScale,
            p * 4.0 + pt.phase * 5.0,
            partAlpha
          );
        } else {
          drawIceCrystal(
            targetCtx,
            bX,
            bY,
            (pt.size * 0.6) * bScale,
            pt.size * bScale,
            p * 3.5 + pt.phase * 4.0,
            partAlpha
          );
        }
      }
    }
  }
}
