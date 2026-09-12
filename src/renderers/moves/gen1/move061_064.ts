/**
 * Move Renderers: 061 - 064
 * 061: 거품광선 (Bubble Beam)
 * 062: 오로라빔 (Aurora Beam)
 * 063: 파괴광선 (Hyper Beam)
 * 064: 쪼기 (Peck) - 예약
 *
 * ⚠️ [개발/작업 지침 - AI 필독]
 * 1. 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
 *    직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하여 턴 시간을 낭비하지 말 것!
 *    코드 수정 -> 빌드 -> 뷰어 캐시 갱신 확인 후 즉시 유저에게 보고할 것.
 * 2. [256색 팔레트 최적화(Octree Optimizer) 기준 제작 지침]:
 *    - 배틀 GIF 렌더러는 Octree Quantizer + useOptimizer (threshold: 85) 기반의 256색 팔레트 재사용 표준을 사용함.
 *    - 신규 기술 구현 시 과도한 반투명 그라디언트 난사를 지양하고, 256색 환경에서 선명하게 돋보이는 고채도 단색/네온 색상 체계와 30 FPS 규격 준수.
 *    - 발사 -> 타격 -> 폭발 등 주요 연출 전환 시 phaseId 또는 moveStep을 명확히 지정하여 팔레트 자동 리셋(isVisualStateShift)이 완벽히 동작하도록 구성할 것.
 */

import {
  draw3DPsybeamRing,
  drawPsybeamHollowCircle,
  PSYBEAM_RING_PALETTES,
} from "./move057_060.js";

// ============================================================================
// 061 거품광선 (Bubble Beam) Helpers
// ============================================================================

export function drawWaterSoapBubble(
  ctx: any,
  x: number,
  y: number,
  r: number,
  alpha: number = 1.0
) {
  if (r <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.05, x, y, r);
  grad.addColorStop(0.00, "#FFFFFF");
  grad.addColorStop(0.18, "#BAE6FD");
  grad.addColorStop(0.42, "#7DD3FC");
  grad.addColorStop(0.70, "#38BDF8");
  grad.addColorStop(0.90, "#0EA5E9");
  grad.addColorStop(1.00, "#0284C7");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#C4FFFF";
  ctx.lineWidth = Math.max(1.0, r * 0.16);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = Math.max(1.1, r * 0.20);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(x, y, r * 0.74, -Math.PI * 0.95, -Math.PI * 0.48);
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(x - r * 0.42, y - r * 0.42, Math.max(0.9, r * 0.18), 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#E0FFFF";
  ctx.lineWidth = Math.max(0.8, r * 0.14);
  ctx.beginPath();
  ctx.arc(x, y, r * 0.80, Math.PI * 0.15, Math.PI * 0.42);
  ctx.stroke();

  ctx.restore();
}

export function drawBubbleBeamTrail(
  ctx: any,
  headX: number,
  headY: number,
  angle: number,
  trailLength: number,
  bubbleRadius: number,
  alpha: number = 1.0
) {
  if (trailLength <= 2 || alpha <= 0) return;
  ctx.save();
  ctx.translate(headX, headY);
  ctx.rotate(angle);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const tailL = trailLength;
  const wHead = bubbleRadius * 0.75;
  const wTail = bubbleRadius * 0.18;

  const auraGrad = ctx.createLinearGradient(0, 0, -tailL, 0);
  auraGrad.addColorStop(0.00, "rgba(196, 255, 255, 0.85)");
  auraGrad.addColorStop(0.25, "rgba(125, 211, 252, 0.60)");
  auraGrad.addColorStop(0.65, "rgba(56, 189, 248, 0.28)");
  auraGrad.addColorStop(1.00, "rgba(56, 189, 248, 0.00)");

  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.moveTo(0, -wHead);
  ctx.lineTo(-tailL, -wTail);
  ctx.lineTo(-tailL, wTail);
  ctx.lineTo(0, wHead);
  ctx.closePath();
  ctx.fill();

  const coreGrad = ctx.createLinearGradient(0, 0, -tailL * 0.90, 0);
  coreGrad.addColorStop(0.00, "rgba(255, 255, 255, 0.95)");
  coreGrad.addColorStop(0.35, "rgba(196, 255, 255, 0.75)");
  coreGrad.addColorStop(0.75, "rgba(125, 211, 252, 0.35)");
  coreGrad.addColorStop(1.00, "rgba(186, 230, 253, 0.00)");

  ctx.strokeStyle = coreGrad;
  ctx.lineWidth = Math.max(1.2, bubbleRadius * 0.24);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-tailL * 0.90, 0);
  ctx.stroke();

  const subGrad = ctx.createLinearGradient(0, 0, -tailL * 0.75, 0);
  subGrad.addColorStop(0.00, "rgba(224, 255, 255, 0.60)");
  subGrad.addColorStop(1.00, "rgba(186, 230, 253, 0.00)");

  ctx.strokeStyle = subGrad;
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(-2, -wHead * 0.55);
  ctx.lineTo(-tailL * 0.75, -wTail * 0.6);
  ctx.moveTo(-2, wHead * 0.55);
  ctx.lineTo(-tailL * 0.75, wTail * 0.6);
  ctx.stroke();

  ctx.restore();
}

export function drawBubblePopSplash(
  ctx: any,
  x: number,
  y: number,
  progress: number,
  baseRadius: number = 18
) {
  if (progress <= 0 || progress > 1.0) return;
  ctx.save();

  const alpha = Math.max(0, 1.0 - progress);
  const ringR = baseRadius * (0.8 + progress * 1.5);
  ctx.strokeStyle = `rgba(125, 211, 252, ${alpha * 0.9})`;
  ctx.lineWidth = Math.max(1.2, 2.5 * (1.0 - progress * 0.6));
  ctx.beginPath();
  ctx.arc(x, y, ringR, 0, Math.PI * 2);
  ctx.stroke();

  if (progress < 0.45) {
    const flashA = (1.0 - progress / 0.45) * 0.8;
    ctx.fillStyle = `rgba(255, 255, 255, ${flashA})`;
    ctx.beginPath();
    ctx.arc(x, y, baseRadius * 0.55 * (1.0 + progress), 0, Math.PI * 2);
    ctx.fill();
  }

  const dropletCount = 6;
  for (let i = 0; i < dropletCount; i++) {
    const angle = (i * Math.PI * 2) / dropletCount + 0.35;
    const dist = ringR * (0.9 + progress * 0.65);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist * 0.78;

    const dropR = Math.max(1.0, 2.4 * (1.0 - progress));
    ctx.fillStyle = i % 2 === 0 ? "#FFFFFF" : "#BAE6FD";
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, dropR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawBubbleBeamBehindEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    [key: string]: any;
  }
) {
  if (frame.showEffect === false) return;
  const { attackerPos, targetPos, isPlayer: isP } = drawCtx;

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 12 : 8);
  const tx = targetPos.x;
  const ty = targetPos.y - (isP ? 15 : 10);

  const dx = tx - ax;
  const dy = ty - ay;
  const dist = Math.hypot(dx, dy);
  if (dist <= 0) return;

  const streamT = frame.streamT ?? 0;
  if (streamT <= 0) return;

  ctx.save();
  const angle = Math.atan2(dy, dx);
  ctx.translate(ax, ay);
  ctx.rotate(angle);

  const currentLen = dist * Math.min(1.0, streamT);
  const auraAlpha = frame.beamAuraAlpha ?? 0.25;

  const auraGrad = ctx.createLinearGradient(0, 0, currentLen, 0);
  auraGrad.addColorStop(0.0, "rgba(186, 230, 253, 0.35)");
  auraGrad.addColorStop(0.5, "rgba(125, 211, 252, 0.20)");
  auraGrad.addColorStop(1.0, "rgba(125, 211, 252, 0.00)");

  ctx.fillStyle = auraGrad;
  ctx.globalAlpha = Math.min(1.0, auraAlpha);
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(currentLen, -9);
  ctx.lineTo(currentLen, 9);
  ctx.lineTo(0, 6);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

export function drawBubbleBeamEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    [key: string]: any;
  }
) {
  if (frame.showEffect === false) return;
  const { attackerPos, targetPos, isPlayer: isP } = drawCtx;

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 12 : 8);
  const tx = targetPos.x;
  const ty = targetPos.y - (isP ? 15 : 10);

  const dx = tx - ax;
  const dy = ty - ay;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  ctx.save();

  const BUBBLE_CONFIGS = [
    { radius: 8.5, perpOffset: -0.8, trailLen: 62 },
    { radius: 7.5, perpOffset: 3.6,  trailLen: 56 },
    { radius: 8.0, perpOffset: -4.0, trailLen: 60 },
    { radius: 7.0, perpOffset: 3.4,  trailLen: 54 },
    { radius: 8.0, perpOffset: -3.6, trailLen: 58 },
    { radius: 7.5, perpOffset: 1.0,  trailLen: 56 },
  ];

  const bubbleProgresses: number[] = frame.bubbles || [];
  const globalAlpha = frame.effectAlpha ?? 1.0;

  const renderItems: Array<{ index: number; prog: number }> = [];
  for (let i = 0; i < bubbleProgresses.length; i++) {
    const prog = bubbleProgresses[i];
    if (prog !== undefined && prog > 0) {
      renderItems.push({ index: i, prog });
    }
  }
  renderItems.sort((a, b) => a.prog - b.prog);

  const normX = -Math.sin(angle);
  const normY = Math.cos(angle);

  for (const item of renderItems) {
    const i = item.index;
    const prog = item.prog;
    const cfg = BUBBLE_CONFIGS[i % BUBBLE_CONFIGS.length];

    if (prog < 1.0) {
      const flightT = Math.max(0, Math.min(1.0, prog));
      const spreadT = Math.min(1.0, flightT / 0.18);
      const effectiveOffset = cfg.perpOffset * (0.35 + 0.65 * spreadT);

      const baseX = ax + dx * flightT;
      const baseY = ay + dy * flightT;

      const curX = baseX + normX * effectiveOffset;
      const curY = baseY + normY * effectiveOffset;

      const bAlpha = Math.min(1.0, flightT / 0.10) * globalAlpha;
      const activeTrailLen = Math.min(cfg.trailLen, flightT * dist * 0.92);
      drawBubbleBeamTrail(ctx, curX, curY, angle, activeTrailLen, cfg.radius, bAlpha * 0.95);
      drawWaterSoapBubble(ctx, curX, curY, cfg.radius, bAlpha);
    } else {
      const popProg = Math.min(1.0, (prog - 1.0) / 0.40);
      if (popProg < 1.0) {
        const hitX = tx + normX * cfg.perpOffset;
        const hitY = ty + normY * cfg.perpOffset;
        drawBubblePopSplash(ctx, hitX, hitY, popProg, cfg.radius);
      }
    }
  }

  const splashRingProg = frame.splashRingProg;
  if (splashRingProg !== undefined && splashRingProg > 0 && splashRingProg <= 1.0) {
    const ringR = 24 + splashRingProg * 18;
    const ringA = Math.max(0, 1.0 - splashRingProg) * 0.65;
    ctx.strokeStyle = `rgba(125, 211, 252, ${ringA})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(tx, ty + 18, ringR, ringR * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

// ============================================================================
// 062 오로라빔 (Aurora Beam) Helpers & Renderers
// ============================================================================

function drawAuroraBorealisCurtains(
  ctx: any,
  alpha: number = 1.0,
  phase: number = 0,
  canvasWidth: number = 560,
  canvasHeight: number = 380
) {
  if (alpha <= 0.01) return;
  ctx.save();

  if (ctx.resetTransform) {
    ctx.resetTransform();
  } else {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  const screenW = ctx.canvas?.width || Math.round(canvasWidth * 0.75);
  const screenH = ctx.canvas?.height || Math.round(canvasHeight * 0.75);

  const skyTopGrad = ctx.createLinearGradient(0, 0, 0, screenH * 0.45);
  skyTopGrad.addColorStop(0.00, `rgba(16, 185, 129, ${0.18 * alpha})`);
  skyTopGrad.addColorStop(0.35, `rgba(6, 182, 212, ${0.14 * alpha})`);
  skyTopGrad.addColorStop(0.70, `rgba(168, 85, 247, ${0.08 * alpha})`);
  skyTopGrad.addColorStop(1.00, "rgba(6, 10, 24, 0.0)");

  ctx.fillStyle = skyTopGrad;
  ctx.fillRect(0, 0, screenW, screenH * 0.45);

  const skyBotGrad = ctx.createLinearGradient(0, screenH, 0, screenH * 0.55);
  skyBotGrad.addColorStop(0.00, `rgba(16, 185, 129, ${0.18 * alpha})`);
  skyBotGrad.addColorStop(0.35, `rgba(6, 182, 212, ${0.14 * alpha})`);
  skyBotGrad.addColorStop(0.70, `rgba(168, 85, 247, ${0.08 * alpha})`);
  skyBotGrad.addColorStop(1.00, "rgba(6, 10, 24, 0.0)");

  ctx.fillStyle = skyBotGrad;
  ctx.fillRect(0, screenH * 0.55, screenW, screenH * 0.45);

  const CURTAIN_LAYERS = [
    {
      topBaseY: screenH * 0.08,
      topHeight: screenH * 0.32,
      botBaseY: screenH * 0.92,
      botHeight: screenH * 0.32,
      speed: 1.1,
      freq: 0.008,
      amp: 13,
      colorEdge: `rgba(192, 132, 252, ${0.22 * alpha})`,
      colorMid: `rgba(236, 72, 153, ${0.14 * alpha})`,
      colorFade: "rgba(236, 72, 153, 0.0)"
    },
    {
      topBaseY: screenH * 0.13,
      topHeight: screenH * 0.36,
      botBaseY: screenH * 0.87,
      botHeight: screenH * 0.36,
      speed: 1.4,
      freq: 0.010,
      amp: 16,
      colorEdge: `rgba(52, 211, 153, ${0.26 * alpha})`,
      colorMid: `rgba(34, 211, 238, ${0.16 * alpha})`,
      colorFade: "rgba(34, 211, 238, 0.0)"
    },
    {
      topBaseY: screenH * 0.18,
      topHeight: screenH * 0.28,
      botBaseY: screenH * 0.82,
      botHeight: screenH * 0.28,
      speed: 1.7,
      freq: 0.012,
      amp: 11,
      colorEdge: `rgba(56, 189, 248, ${0.20 * alpha})`,
      colorMid: `rgba(99, 102, 241, ${0.11 * alpha})`,
      colorFade: "rgba(99, 102, 241, 0.0)"
    },
  ];

  const startX = -60;
  const endX = screenW + 60;
  const stepX = 20;

  for (let l = 0; l < CURTAIN_LAYERS.length; l++) {
    const layer = CURTAIN_LAYERS[l];
    const t = phase * layer.speed + l * 1.5;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(startX, 0);

    for (let x = startX; x <= endX; x += stepX) {
      const wave1 = Math.sin(x * layer.freq + t) * layer.amp;
      const wave2 = Math.cos(x * layer.freq * 1.6 - t * 0.7) * (layer.amp * 0.4);
      const y = layer.topBaseY + wave1 + wave2;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(endX, 0);
    ctx.closePath();

    const topGrad = ctx.createLinearGradient(0, layer.topBaseY - layer.amp, 0, layer.topBaseY + layer.topHeight);
    topGrad.addColorStop(0.00, layer.colorEdge);
    topGrad.addColorStop(0.40, layer.colorMid);
    topGrad.addColorStop(1.00, layer.colorFade);

    ctx.fillStyle = topGrad;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(startX, screenH);

    for (let x = startX; x <= endX; x += stepX) {
      const wave1 = Math.sin(x * layer.freq - t * 0.9 + 1.2) * layer.amp;
      const wave2 = Math.cos(x * layer.freq * 1.5 + t * 0.6) * (layer.amp * 0.4);
      const y = layer.botBaseY - (wave1 + wave2);
      ctx.lineTo(x, y);
    }

    ctx.lineTo(endX, screenH);
    ctx.closePath();

    const botGrad = ctx.createLinearGradient(0, layer.botBaseY + layer.amp, 0, layer.botBaseY - layer.botHeight);
    botGrad.addColorStop(0.00, layer.colorEdge);
    botGrad.addColorStop(0.40, layer.colorMid);
    botGrad.addColorStop(1.00, layer.colorFade);

    ctx.fillStyle = botGrad;
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

export function drawAuroraBeamBehindEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    [key: string]: any;
  }
) {
  if (frame.showEffect === false) return;

  const dimAlpha = frame.dimAlpha ?? 0;
  if (dimAlpha > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(3, 5, 15, ${Math.min(0.92, dimAlpha)})`;
    ctx.fillRect(-10000, -10000, 20000, 20000);
    ctx.restore();
  }

  const auroraSkyAlpha = frame.auroraSkyAlpha ?? (dimAlpha > 0.2 ? dimAlpha : 0);
  if (auroraSkyAlpha > 0.02) {
    drawAuroraBorealisCurtains(
      ctx,
      auroraSkyAlpha,
      frame.streamPhase ?? (frame.moveStep || 1),
      drawCtx.width || 560,
      drawCtx.height || 380
    );
  }

  const { attackerPos, targetPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep || 1;

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 10 : 6);
  const tx = targetPos.x;
  const ty = targetPos.y - (isP ? 15 : 10);

  const dx = tx - ax;
  const dy = ty - ay;
  const dist = Math.hypot(dx, dy);
  if (dist <= 0) return;

  const leaderT = frame.leaderT ?? frame.beamT ?? (step * 0.28);
  const tailT = frame.tailT ?? 0.0;
  const beamAlpha = frame.beamAlpha ?? (step >= 7 ? Math.max(0, 1.0 - (step - 6) * 0.45) : 1.0);

  if (beamAlpha > 0 && leaderT > 0 && step <= 7) {
    ctx.save();
    const mainAngle = Math.atan2(dy, dx);
    ctx.translate(ax, ay);
    ctx.rotate(mainAngle);

    const startX = dist * Math.max(0, tailT);
    const endX = dist * Math.min(1.0, leaderT);
    const packetLen = endX - startX;

    if (packetLen > 2) {
      const hStart = 11 + (startX / dist) * 11;
      const hEnd = 11 + (endX / dist) * 11;

      ctx.globalAlpha = Math.min(1.0, beamAlpha * 0.26);
      const auraGrad = ctx.createLinearGradient(startX, 0, endX, 0);
      auraGrad.addColorStop(0.00, "rgba(59, 92, 232, 0.35)");
      auraGrad.addColorStop(0.28, "rgba(255, 160, 32, 0.35)");
      auraGrad.addColorStop(0.55, "rgba(214, 8, 215, 0.35)");
      auraGrad.addColorStop(0.80, "rgba(168, 23, 225, 0.35)");
      auraGrad.addColorStop(1.00, "rgba(121, 82, 204, 0.40)");

      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.moveTo(startX, -hStart);
      ctx.lineTo(endX, -hEnd);
      ctx.lineTo(endX, hEnd);
      ctx.lineTo(startX, hStart);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

export function drawAuroraBeamEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    [key: string]: any;
  }
) {
  if (frame.showEffect === false) return;
  const { attackerPos, targetPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep || 1;

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 10 : 6);

  const tx = targetPos.x;
  const ty = targetPos.y - (isP ? 15 : 10);

  const dx = tx - ax;
  const dy = ty - ay;
  const dist = Math.hypot(dx, dy);

  ctx.save();
  const mainAngle = Math.atan2(dy, dx);

  const leaderT = frame.leaderT ?? frame.beamT ?? Math.min(1.0, step * 0.28);
  const tailT = frame.tailT ?? 0.0;
  const streamPhase = frame.streamPhase ?? (step - 1);
  const burstR = frame.psyBurstR ?? frame.yellowBurstR;
  const beamAlpha = frame.beamAlpha ?? (step >= 8 ? 0 : 1.0);

  const NUM_RINGS = 14;
  const BASE_RING_RADIUS = 10.5;

  const dirSign = dx >= 0 ? 1 : -1;
  const baseTilt = dirSign * (7.5 * Math.PI / 180);

  const RING_TILT_ANGLES = [
    -42, 28, -20, 52, -32, 38, -55, 20,
    -14, 46, -36, 24, -48, 34, -26, 58,
    -38, 30, -18, 48, -44, 22, -30, 54
  ];

  if (beamAlpha > 0 && leaderT > 0 && (step <= 7 || (burstR !== undefined && burstR < 70))) {
    for (let i = 0; i < NUM_RINGS; i++) {
      const frac = i / (NUM_RINGS - 1);
      const compressFrac = Math.pow(frac, 1.25);
      const ringT = leaderT - (leaderT - tailT) * compressFrac;

      if (ringT < -0.02) continue;

      const clampedT = Math.max(0, Math.min(1.0, ringT));
      const rx = ax + dx * clampedT;
      const ry = ay + dy * clampedT;

      const wave = Math.sin(clampedT * Math.PI * 6 - streamPhase * 1.5) * (1.2 * (1.0 - clampedT * 0.4));
      const normX = -Math.sin(mainAngle);
      const normY = Math.cos(mainAngle);
      const cx = rx + normX * wave;
      const cy = ry + normY * wave;

      const expandFactor = 1.0 + clampedT * 1.0;
      const curRadius = BASE_RING_RADIUS * expandFactor;
      const paletteIndex = Math.abs(Math.floor(i - streamPhase * 2 + 1200)) % PSYBEAM_RING_PALETTES.length;

      let ringAlpha = beamAlpha;
      if (clampedT < 0.05 && tailT <= 0.01) {
        ringAlpha *= (clampedT / 0.05);
      }

      const tiltDeg = RING_TILT_ANGLES[i % RING_TILT_ANGLES.length];
      const tiltFactor = 0.75 + 0.85 * Math.pow(clampedT, 1.25);
      const spinSpeed = 0.25 + 0.75 * Math.pow(clampedT, 1.6);
      const spinDirection = (i % 2 === 0) ? 1 : -1;
      const spinAngle = streamPhase * spinSpeed * spinDirection;
      const dynamicTilt = baseTilt + (tiltDeg * (Math.PI / 180) * tiltFactor) + spinAngle;

      const depthTumble = Math.abs(Math.cos(dynamicTilt * 1.3 + streamPhase * 0.4 * (0.5 + clampedT * 0.5)));
      const dynamicDepth = 0.58 + 0.36 * depthTumble;

      if (clampedT >= 0.95 && leaderT >= 0.98) {
        const contactMorph = Math.min(1.0, (clampedT - 0.95) / 0.05);
        const contactR = curRadius + contactMorph * 5.0;
        const depthRatio = dynamicDepth + contactMorph * (0.98 - dynamicDepth);
        const tilt = dynamicTilt * (1.0 - contactMorph * 0.5);
        draw3DPsybeamRing(ctx, cx, cy, tilt, contactR, ringAlpha, depthRatio, 1.3, paletteIndex);
      } else {
        draw3DPsybeamRing(ctx, cx, cy, dynamicTilt, curRadius, ringAlpha, dynamicDepth, 1.2, paletteIndex);
      }
    }

    if (leaderT >= 0.98 && step >= 5 && step <= 6) {
      for (let c = 0; c < 3; c++) {
        const cR = 15 + c * 6.0 + Math.sin(streamPhase * 2.2 + c) * 1.5;
        const cAlpha = Math.min(1.0, beamAlpha * (0.90 - c * 0.20));
        const cPalIdx = (streamPhase + c * 2) % PSYBEAM_RING_PALETTES.length;
        const cTilt = baseTilt * 0.5 + ((c % 2 === 0 ? 40 : -40) * Math.PI / 180) + streamPhase * 0.70 * (c % 2 === 0 ? 1 : -1);
        const cDepth = 0.65 + 0.30 * Math.abs(Math.sin(streamPhase * 0.8 + c));
        draw3DPsybeamRing(ctx, tx, ty, cTilt, cR, cAlpha, cDepth, 1.3, cPalIdx);
      }
    }
  }

  if (burstR !== undefined && burstR > 0) {
    const burstAlpha = frame.burstAlpha ?? 0.80;
    drawPsybeamHollowCircle(ctx, tx, ty, burstR, burstAlpha);

    if (burstAlpha > 0.4) {
      const sparkColors = ["#3B5CE8", "#FFA020", "#D608D7", "#A817E1", "#7952CC"];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + burstR * 0.05;
        const spDist = burstR * 0.75;
        const spX = tx + Math.cos(a) * spDist;
        const spY = ty + Math.sin(a) * spDist;
        ctx.save();
        ctx.fillStyle = sparkColors[i % sparkColors.length];
        ctx.fillRect(spX - 1.5, spY - 1.5, 3, 3);
        ctx.restore();
      }
    }
  }

  ctx.restore();
}

// ============================================================================
// 063: 파괴광선 (Hyper Beam) - 5세대 공식 배틀 초거대 빔 & 충격파 렌더러
// ============================================================================

/**
 * Helper: 번개 / 플라즈마 방전 아크 렌더러 (Plasma Lightning Discharge Arc)
 */
function drawHyperBeamLightningArc(
  ctx: any,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  segments: number = 4,
  jaggedness: number = 8,
  color: string = "#FDE047",
  lineWidth: number = 1.6,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(x1, y1);

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist <= 0) {
    ctx.restore();
    return;
  }
  const nx = -dy / dist;
  const ny = dx / dist;

  for (let i = 1; i < segments; i++) {
    const frac = i / segments;
    const basePx = x1 + dx * frac;
    const basePy = y1 + dy * frac;
    const offset = (Math.sin(i * 3.7 + dist * 0.1) * 2 - 1) * jaggedness;
    ctx.lineTo(basePx + nx * offset, basePy + ny * offset);
  }

  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Helper: 아나모픽 수평/직교 렌즈 플레어 (Anamorphic Impact Lens Flare)
 * - 인위적인 8방향 바퀴살 직선을 완전히 제거하고,
 * - 광선 충돌면에 수직으로 전개되는 영화적 아나모픽 섬광 스트릭 & 부드러운 다이아몬드 코어 발광을 연출
 */
function drawAnamorphicImpactFlare(
  ctx: any,
  cx: number,
  cy: number,
  length: number,
  height: number,
  alpha: number,
  axisAngle: number
) {
  if (length <= 0 || alpha <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(axisAngle);

  // 1. 메인 아나모픽 수평 스트릭 (주 광선 충돌축 직교 플레어)
  const flareGrad = ctx.createLinearGradient(-length, 0, length, 0);
  flareGrad.addColorStop(0.00, "rgba(255, 255, 255, 0.0)");
  flareGrad.addColorStop(0.20, `rgba(249, 115, 22, ${0.40 * alpha})`);
  flareGrad.addColorStop(0.42, `rgba(254, 240, 138, ${0.85 * alpha})`);
  flareGrad.addColorStop(0.50, `rgba(255, 255, 255, ${0.98 * alpha})`);
  flareGrad.addColorStop(0.58, `rgba(254, 240, 138, ${0.85 * alpha})`);
  flareGrad.addColorStop(0.80, `rgba(249, 115, 22, ${0.40 * alpha})`);
  flareGrad.addColorStop(1.00, "rgba(255, 255, 255, 0.0)");

  ctx.fillStyle = flareGrad;
  ctx.beginPath();
  ctx.moveTo(-length, 0);
  ctx.quadraticCurveTo(0, -height, length, 0);
  ctx.quadraticCurveTo(0, height, -length, 0);
  ctx.closePath();
  ctx.fill();

  // 2. 십자 서브 글레어 (Cross Glare - 짧은 종방향 날개)
  const crossLen = length * 0.40;
  const crossH = height * 0.75;
  const crossGrad = ctx.createLinearGradient(0, -crossLen, 0, crossLen);
  crossGrad.addColorStop(0.00, "rgba(255, 255, 255, 0.0)");
  crossGrad.addColorStop(0.50, `rgba(255, 255, 255, ${0.92 * alpha})`);
  crossGrad.addColorStop(1.00, "rgba(255, 255, 255, 0.0)");

  ctx.fillStyle = crossGrad;
  ctx.beginPath();
  ctx.moveTo(0, -crossLen);
  ctx.quadraticCurveTo(-crossH, 0, 0, crossLen);
  ctx.quadraticCurveTo(crossH, 0, 0, -crossLen);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

export function drawHyperBeamBehindEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    [key: string]: any;
  }
) {
  if (frame.showEffect === false) return;
  const { attackerPos, targetPos, isPlayer: isP } = drawCtx;

  // 1. [초광역 전장 암전 (Cosmic Void Darkening)]: 줌/팬 시 절대 잘리지 않는 2만 픽셀 캔버스
  const dimAlpha = frame.dimAlpha ?? 0;
  if (dimAlpha > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(5, 4, 14, ${Math.min(0.92, dimAlpha)})`;
    ctx.fillRect(-10000, -10000, 20000, 20000);
    ctx.restore();
  }

  // 2. [전장 전체 순백/황금빛 섬광 작렬 (Full-Screen Shock Flash)]
  const whiteFlash = frame.whiteFlashAlpha ?? 0;
  if (whiteFlash > 0.02) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 248, 230, ${Math.min(1.0, whiteFlash)})`;
    ctx.fillRect(-10000, -10000, 20000, 20000);
    ctx.restore();
  }

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 10 : 6);
  const tx = targetPos.x;
  const ty = targetPos.y - (isP ? 15 : 10);

  // 3. [시전자 발밑 중력 흡인 룬 & 지면 충격광 (Steps 1~3)]
  const chargeProg = frame.chargeProgress ?? 0;
  if (chargeProg > 0 && (frame.beamProgress ?? 0) < 0.15) {
    ctx.save();
    const groundR = 26 + chargeProg * 22;
    const gGrad = ctx.createRadialGradient(ax, ay + 20, 0, ax, ay + 20, groundR);
    gGrad.addColorStop(0.00, `rgba(254, 240, 138, ${0.75 * chargeProg})`);
    gGrad.addColorStop(0.40, `rgba(249, 115, 22, ${0.45 * chargeProg})`);
    gGrad.addColorStop(0.85, `rgba(147, 51, 234, ${0.20 * chargeProg})`);
    gGrad.addColorStop(1.00, "rgba(147, 51, 234, 0.0)");
    ctx.fillStyle = gGrad;
    ctx.beginPath();
    ctx.ellipse(ax, ay + 20, groundR, groundR * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }


}

export function drawHyperBeamEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    [key: string]: any;
  }
) {
  if (frame.showEffect === false) return;
  const { attackerPos, targetPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep || 1;

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 10 : 6);
  const tx = targetPos.x;
  const ty = targetPos.y - (isP ? 15 : 10);

  const dx = tx - ax;
  const dy = ty - ay;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  ctx.save();

  // ==========================================================================
  // 1. [반투명 회색 구체 수축 & 초기발사 원 응축 차징 (Steps 1~3)]
  // - 반투명의 회색 구체가 화면 절반 크기(140px)를 차지한 채로 줄어들다가,
  //   프레임 3에서 시전자 위치의 초기발사 원(32px)과 완벽히 일치 후 발포
  // - 기존의 빛 선들(중력 흡인 스트림, 번개 방전 아크, 스타버스트 빔 등) 완전 제거
  // ==========================================================================
  const chargeProg = frame.chargeProgress ?? 0;
  const beamProg = frame.beamProgress ?? 0;

  if (chargeProg > 0 && beamProg < 0.20) {
    // 1. 초기발사 원 규격 (Initial Firing Circle: 기준 반경 32px)
    const fireOrbR = 32;

    // 2. 반투명 회색 구체 수축 반경 계산
    // - frame.greyRadius가 지정되어 있으면 해당 값 사용 (다중 프레임 완벽 지원)
    let greyR = 140;
    if (frame.greyRadius !== undefined) {
      greyR = frame.greyRadius;
    } else if (step === 1) {
      greyR = 140;
    } else if (step === 2) {
      greyR = 80;
    } else if (step === 3) {
      greyR = fireOrbR;
    } else {
      greyR = Math.max(fireOrbR, 140 - chargeProg * (140 - fireOrbR));
    }

    const isMatched = Math.abs(greyR - fireOrbR) < 1.0;

    // A. [반투명의 회색 구체 (Translucent Grey Sphere)]
    ctx.save();
    const sphereGrad = ctx.createRadialGradient(
      ax - greyR * 0.10,
      ay - greyR * 0.10,
      greyR * 0.05,
      ax,
      ay,
      greyR
    );

    if (isMatched) {
      // 초기발사 원과 일치하며 고밀도로 응축된 반투명 회색 림
      sphereGrad.addColorStop(0.00, "rgba(240, 244, 250, 0.35)");
      sphereGrad.addColorStop(0.45, "rgba(160, 168, 180, 0.50)");
      sphereGrad.addColorStop(0.80, "rgba(90, 96, 110, 0.65)");
      sphereGrad.addColorStop(1.00, "rgba(45, 48, 58, 0.80)");
    } else {
      // 수축 중인 화면 절반 크기의 묵직한 반투명 회색 구체
      sphereGrad.addColorStop(0.00, "rgba(220, 225, 235, 0.20)");
      sphereGrad.addColorStop(0.40, "rgba(145, 152, 165, 0.35)");
      sphereGrad.addColorStop(0.78, "rgba(85, 90, 102, 0.50)");
      sphereGrad.addColorStop(1.00, "rgba(38, 42, 50, 0.65)");
    }

    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(ax, ay, greyR, 0, Math.PI * 2);
    ctx.fill();

    // 외곽 테두리 (Translucent Grey Sphere Rim)
    ctx.strokeStyle = isMatched
      ? "rgba(255, 255, 255, 0.85)"
      : "rgba(200, 208, 220, 0.55)";
    ctx.lineWidth = isMatched ? 2.4 : 1.8;
    ctx.beginPath();
    ctx.arc(ax, ay, greyR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // B. [초기발사 원 (Initial Firing Circle / Core Energy Orb)]
    // - 시전자 입가/발사점(ax, ay)에 맺히는 기준 32px 발사 원
    const coreAlpha = frame.coreAlpha !== undefined
      ? frame.coreAlpha
      : (isMatched ? 1.0 : (0.40 + chargeProg * 0.55));

    ctx.save();
    // 1) 외곽 플라즈마 오라 (Warm Orange/Gold Corona - 32px)
    const gCorona = ctx.createRadialGradient(ax, ay, fireOrbR * 0.25, ax, ay, fireOrbR);
    gCorona.addColorStop(0.00, `rgba(255, 255, 255, ${0.98 * coreAlpha})`);
    gCorona.addColorStop(0.35, `rgba(254, 240, 138, ${0.90 * coreAlpha})`);
    gCorona.addColorStop(0.68, `rgba(249, 115, 22, ${0.75 * coreAlpha})`);
    gCorona.addColorStop(0.92, `rgba(220, 38, 38, ${0.45 * coreAlpha})`);
    gCorona.addColorStop(1.00, "rgba(147, 51, 234, 0.0)");
    ctx.fillStyle = gCorona;
    ctx.beginPath();
    ctx.arc(ax, ay, fireOrbR, 0, Math.PI * 2);
    ctx.fill();

    // 2) 중간 솔라 플라즈마 코어 (20px)
    ctx.fillStyle = `rgba(253, 224, 71, ${0.92 * coreAlpha})`;
    ctx.beginPath();
    ctx.arc(ax, ay, fireOrbR * 0.62, 0, Math.PI * 2);
    ctx.fill();

    // 3) 중심 초고온 순백 심핵 (12px)
    ctx.fillStyle = `rgba(255, 255, 255, ${0.98 * coreAlpha})`;
    ctx.beginPath();
    ctx.arc(ax, ay, fireOrbR * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ==========================================================================
  // 2. [초거대 파괴광선 본체 & 나선 이중 나선 리본 (Steps 4~8)]
  // ==========================================================================
  const beamFade = frame.beamFadeAlpha ?? 1.0;

  if (beamProg > 0 && beamFade > 0.02) {
    // 빔 길이는 타겟 중심(dist)까지만 도달하여 폭발 중심에 깔끔하게 안착
    const beamLen = dist * Math.min(1.0, beamProg);

    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(angle);

    const beamScale = frame.beamScale ?? 1.0;

    // 파괴광선의 압도적 규격: 시전자 24px 노즐 ➔ 전장 46px 거대 주신체
    const maxW = 46 * beamFade * beamScale;
    const baseW = 24 * beamFade * beamScale;

    // A. [외곽 코스믹 자주/퍼플 파괴 오라 (Layer A: Outer Destructive Aura)]
    // - 레이저 파장(보라색 오라)이 도중에 조기 단절되거나 둥글게 뭉툭해지지 않고,
    //   주황/백색 빔과 동일하게 폭발 화염구 중심(beamLen)까지 일직선으로 곧게 뻗어 도달
    const auraW = maxW * 1.35;
    const gAuraBeam = ctx.createLinearGradient(0, -auraW, 0, auraW);
    gAuraBeam.addColorStop(0.00, "rgba(88, 28, 135, 0.0)");
    gAuraBeam.addColorStop(0.20, "rgba(147, 51, 234, 0.35)");
    gAuraBeam.addColorStop(0.40, "rgba(192, 38, 211, 0.65)");
    gAuraBeam.addColorStop(0.50, "rgba(239, 68, 68, 0.85)");
    gAuraBeam.addColorStop(0.60, "rgba(192, 38, 211, 0.65)");
    gAuraBeam.addColorStop(0.80, "rgba(147, 51, 234, 0.35)");
    gAuraBeam.addColorStop(1.00, "rgba(88, 28, 135, 0.0)");

    const auraTaper = Math.max(0, beamLen - 20);
    ctx.fillStyle = gAuraBeam;
    ctx.beginPath();
    ctx.moveTo(0, -baseW * 0.8);
    ctx.lineTo(auraTaper, -auraW);
    ctx.lineTo(beamLen, 0);
    ctx.lineTo(auraTaper, auraW);
    ctx.lineTo(0, baseW * 0.8);
    ctx.closePath();
    ctx.fill();

    // B. [중간 맹렬한 솔라 오렌지/크림슨 플라즈마 바디 (Layer B: Mid Solar Plasma Body)]
    const midW = maxW * 0.85;
    const midTaper = Math.max(0, beamLen - 18);
    const gMidBeam = ctx.createLinearGradient(0, -midW, 0, midW);
    gMidBeam.addColorStop(0.00, "rgba(220, 38, 38, 0.0)");
    gMidBeam.addColorStop(0.25, "#EA580C");
    gMidBeam.addColorStop(0.42, "#F97316");
    gMidBeam.addColorStop(0.50, "#FEF08A");
    gMidBeam.addColorStop(0.58, "#F97316");
    gMidBeam.addColorStop(0.75, "#EA580C");
    gMidBeam.addColorStop(1.00, "rgba(220, 38, 38, 0.0)");

    ctx.fillStyle = gMidBeam;
    ctx.beginPath();
    ctx.moveTo(0, -baseW * 0.5);
    ctx.lineTo(midTaper, -midW);
    ctx.lineTo(beamLen, 0);
    ctx.lineTo(midTaper, midW);
    ctx.lineTo(0, baseW * 0.5);
    ctx.closePath();
    ctx.fill();

    // C. [초고열 순백 캐비테이션 레이저 심선 (Layer C: Hyper White Core)]
    const coreW = maxW * 0.36;
    const coreTaper = Math.max(0, beamLen - 12);
    const gCoreBeam = ctx.createLinearGradient(0, -coreW, 0, coreW);
    gCoreBeam.addColorStop(0.00, "rgba(255, 255, 255, 0.0)");
    gCoreBeam.addColorStop(0.28, "#FEF08A");
    gCoreBeam.addColorStop(0.50, "#FFFFFF");
    gCoreBeam.addColorStop(0.72, "#FEF08A");
    gCoreBeam.addColorStop(1.00, "rgba(255, 255, 255, 0.0)");

    ctx.fillStyle = gCoreBeam;
    ctx.beginPath();
    ctx.moveTo(0, -baseW * 0.22);
    ctx.lineTo(coreTaper, -coreW);
    ctx.lineTo(beamLen, 0);
    ctx.lineTo(coreTaper, coreW);
    ctx.lineTo(0, baseW * 0.22);
    ctx.closePath();
    ctx.fill();

    // D. [광선 심선 고속 레이저 스트리에이션 (Laser Core Filaments)]
    for (let f = 0; f < 4; f++) {
      const fProg = ((step * 0.35 + f * 0.25) % 1.0);
      const fStart = fProg * beamLen * 0.5;
      const fEnd = Math.min(beamLen, fStart + 45);
      const fY = (f - 1.5) * (3.5 * Math.min(1.0, beamScale));

      ctx.save();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = Math.max(0.8, 1.6 * beamScale);
      ctx.globalAlpha = 0.90 * beamFade;
      ctx.beginPath();
      ctx.moveTo(fStart, fY);
      ctx.lineTo(fEnd, fY);
      ctx.stroke();
      ctx.restore();
    }

    // E. [시전자 노즐 발사 원 캡 (Muzzle Origin Cap)]
    const capR = baseW * 0.95;
    if (capR > 1.5) {
      const gCap = ctx.createRadialGradient(0, 0, 0, 0, 0, capR);
      gCap.addColorStop(0.00, "#FFFFFF");
      gCap.addColorStop(0.40, "#FEF08A");
      gCap.addColorStop(0.80, "#F97316");
      gCap.addColorStop(1.00, "rgba(249, 115, 22, 0.0)");
      ctx.fillStyle = gCap;
      ctx.beginPath();
      ctx.arc(0, 0, capR, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // ==========================================================================
  // 3. [충격파 대폭발 & 피격 대격돌 분출 (Steps 6~8)]
  // ==========================================================================
  const impactR = frame.impactBurstR ?? 0;
  const impactAlpha = frame.impactAlpha ?? 0;

  if (impactR > 0 && impactAlpha > 0.02) {
    ctx.save();

    // A. [중심 파괴 플라즈마 폭발 코어 (Turbulent Central Plasma Core)]
    const coreR = Math.min(52, 18 + impactR * 0.24);

    // 1) 고온 순백 심핵 & 외곽 퍼플 오라 블렌드 (빔 파장과 자연스러운 융합)
    const fireGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, coreR * 1.35);
    fireGrad.addColorStop(0.00, `rgba(255, 255, 255, ${0.98 * impactAlpha})`);
    fireGrad.addColorStop(0.28, `rgba(254, 240, 138, ${0.90 * impactAlpha})`);
    fireGrad.addColorStop(0.56, `rgba(249, 115, 22, ${0.72 * impactAlpha})`);
    fireGrad.addColorStop(0.78, `rgba(220, 38, 38, ${0.45 * impactAlpha})`);
    fireGrad.addColorStop(0.90, `rgba(168, 85, 247, ${0.40 * impactAlpha})`);
    fireGrad.addColorStop(1.00, "rgba(147, 51, 234, 0.0)");
    ctx.fillStyle = fireGrad;
    ctx.beginPath();
    ctx.arc(tx, ty, coreR * 1.35, 0, Math.PI * 2);
    ctx.fill();

    // 2) 끓어오르는 비등 플라즈마 로브 (Boiling Turbulent Plasma Lobes)
    const lobeSeed = (step * 1.7) % (Math.PI * 2);
    const l1x = tx + Math.cos(lobeSeed) * (coreR * 0.35);
    const l1y = ty + Math.sin(lobeSeed) * (coreR * 0.28);
    const l1R = coreR * 0.85;
    const gLobe1 = ctx.createRadialGradient(l1x, l1y, 0, l1x, l1y, l1R);
    gLobe1.addColorStop(0.00, `rgba(255, 255, 255, ${0.92 * impactAlpha})`);
    gLobe1.addColorStop(0.45, `rgba(249, 115, 22, ${0.65 * impactAlpha})`);
    gLobe1.addColorStop(1.00, "rgba(220, 38, 38, 0.0)");
    ctx.fillStyle = gLobe1;
    ctx.beginPath();
    ctx.arc(l1x, l1y, l1R, 0, Math.PI * 2);
    ctx.fill();

    const l2x = tx + Math.cos(lobeSeed + 2.4) * (coreR * 0.38);
    const l2y = ty + Math.sin(lobeSeed + 2.4) * (coreR * 0.30);
    const l2R = coreR * 0.75;
    const gLobe2 = ctx.createRadialGradient(l2x, l2y, 0, l2x, l2y, l2R);
    gLobe2.addColorStop(0.00, `rgba(254, 240, 138, ${0.85 * impactAlpha})`);
    gLobe2.addColorStop(0.50, `rgba(234, 88, 12, ${0.55 * impactAlpha})`);
    gLobe2.addColorStop(1.00, "rgba(147, 51, 234, 0.0)");
    ctx.fillStyle = gLobe2;
    ctx.beginPath();
    ctx.arc(l2x, l2y, l2R, 0, Math.PI * 2);
    ctx.fill();

    // B. [수평/직교 아나모픽 섬광 (Anamorphic Impact Lens Flare - 바퀴살 선 일체 제거)]
    if (impactAlpha > 0.35) {
      const flareLen = Math.min(135, 36 + impactR * 0.70);
      const flareH = Math.max(3.5, 7.5 * impactAlpha);
      drawAnamorphicImpactFlare(ctx, tx, ty, flareLen, flareH, impactAlpha * 0.95, angle + Math.PI / 2);
    }

    // C. [부드러운 고에너지 압축 충격파 파면 (Soft-Edged Blast Wavefront - 와이어프레임 링 완전 제거)]
    if (impactR > 24) {
      const swMaxR = impactR * 1.05;
      const swMinR = Math.max(0, impactR * 0.65);
      const swGrad = ctx.createRadialGradient(tx, ty, swMinR, tx, ty, swMaxR);
      swGrad.addColorStop(0.00, "rgba(255, 255, 255, 0.0)");
      swGrad.addColorStop(0.35, `rgba(249, 115, 22, ${0.28 * impactAlpha})`);
      swGrad.addColorStop(0.75, `rgba(254, 240, 138, ${0.70 * impactAlpha})`);
      swGrad.addColorStop(0.88, `rgba(255, 255, 255, ${0.92 * impactAlpha})`);
      swGrad.addColorStop(1.00, "rgba(255, 255, 255, 0.0)");

      ctx.fillStyle = swGrad;
      ctx.beginPath();
      ctx.arc(tx, ty, swMaxR, 0, Math.PI * 2);
      ctx.fill();
    }

    // D. [피격 포켓몬 전신을 감싸는 파괴 방전 아크 (Catastrophic Plasma Arcs)]
    if (impactAlpha > 0.65) {
      const ARC_SEEDS = [
        [ { x: -22, y: -26 }, { x: -12, y: -34 }, { x: 4, y: -28 }, { x: 18, y: -32 } ],
        [ { x: -28, y: -10 }, { x: -14, y: -4 }, { x: 10, y: -12 }, { x: 24, y: -6 } ],
        [ { x: -16, y: 12 }, { x: -2, y: 18 }, { x: 14, y: 10 }, { x: 26, y: 20 } ],
      ];

      const arcPhase = (step * 1.3);
      for (let aIdx = 0; aIdx < ARC_SEEDS.length; aIdx++) {
        const pts = ARC_SEEDS[aIdx];
        const jitterX = Math.sin(arcPhase + aIdx * 2.1) * 4;
        const jitterY = Math.cos(arcPhase + aIdx * 2.1) * 3;

        ctx.beginPath();
        for (let pIdx = 0; pIdx < pts.length; pIdx++) {
          const px = tx + pts[pIdx].x + (pIdx > 0 ? jitterX : 0);
          const py = ty + pts[pIdx].y + (pIdx > 0 ? jitterY : 0);
          if (pIdx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }

        ctx.strokeStyle = aIdx % 2 === 0 ? "#FFFFFF" : "#FEF08A";
        ctx.lineWidth = 1.8;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      }
    }

    // E. [방사형 고속 플라즈마 파편 & 에너지 결정 비산 (Directional Plasma Shards)]
    const shardCount = 14;
    for (let p = 0; p < shardCount; p++) {
      const pAngle = (p * Math.PI * 2) / shardCount + Math.sin(p * 2.4 + step) * 0.40;
      const pDist = impactR * (0.60 + 0.50 * ((p * 13) % 7) / 6);
      const spX = tx + Math.cos(pAngle) * pDist;
      const spY = ty + Math.sin(pAngle) * pDist * 0.85;

      const shardSize = Math.max(1.8, 5.0 * (1.0 - Math.min(1.0, impactR / 160)) * impactAlpha);
      const shardCol = p % 3 === 0 ? "#FFFFFF" : (p % 3 === 1 ? "#FEF08A" : "#F97316");

      ctx.save();
      ctx.translate(spX, spY);
      ctx.rotate(pAngle);

      // 다이아몬드 결정체 파편
      ctx.fillStyle = shardCol;
      ctx.globalAlpha = Math.min(1.0, impactAlpha * 0.95);
      ctx.beginPath();
      ctx.moveTo(shardSize * 1.5, 0);
      ctx.lineTo(0, -shardSize * 0.6);
      ctx.lineTo(-shardSize * 0.8, 0);
      ctx.lineTo(0, shardSize * 0.6);
      ctx.closePath();
      ctx.fill();

      // 고속 모션 트레일 스트릭
      ctx.strokeStyle = shardCol;
      ctx.lineWidth = Math.max(0.8, shardSize * 0.4);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-shardSize * 3.5, 0);
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }

  // ==========================================================================
  // 4. [반동 턴 후유증: 시전자 탈진 & 고열 수증기/연기 분출 (Step 9)]
  // ==========================================================================
  const smokeAlpha = frame.recoilSmokeAlpha ?? 0;
  if (smokeAlpha > 0.02) {
    ctx.save();
    const SMOKE_PUFFS = [
      { ox: -14, oy: -8,  r: 16, a: 0.70 },
      { ox:   6, oy: -14, r: 20, a: 0.85 },
      { ox:  -4, oy: -24, r: 24, a: 0.90 },
      { ox:  18, oy: -32, r: 22, a: 0.75 },
      { ox: -12, oy: -42, r: 26, a: 0.60 },
      { ox:   8, oy: -52, r: 28, a: 0.45 },
    ];

    for (let sm = 0; sm < SMOKE_PUFFS.length; sm++) {
      const sp = SMOKE_PUFFS[sm];
      const smX = ax + sp.ox;
      const smY = ay + sp.oy;

      const sGrad = ctx.createRadialGradient(smX, smY, 0, smX, smY, sp.r);
      sGrad.addColorStop(0.00, `rgba(203, 213, 225, ${sp.a * smokeAlpha * 0.85})`);
      sGrad.addColorStop(0.50, `rgba(148, 163, 184, ${sp.a * smokeAlpha * 0.55})`);
      sGrad.addColorStop(1.00, "rgba(100, 116, 139, 0.0)");

      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.arc(smX, smY, sp.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 잔여 고열 스파크 3개
    for (let e = 0; e < 3; e++) {
      const eX = ax + (e - 1) * 12 + Math.sin(e * 1.5) * 6;
      const eY = ay - 18 - e * 14;
      ctx.fillStyle = `rgba(254, 240, 138, ${smokeAlpha * 0.85})`;
      ctx.beginPath();
      ctx.arc(eX, eY, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  ctx.restore();
}

// ============================================================================
// 064 쪼기 (Peck) Helpers & Renderer
// ============================================================================

/**
 * 쪼기 타격 지점 핀포인트 관통 섬광 & 침형 스파크 (Peck Impact Puncture Spark)
 * - 인위적인 부리 그림, 파란색 호(호선), 깃털 그래픽 일체 배제
 * - 피격 중심점에 콕! 꽂히는 예리하고 선명한 순백/황금빛 찌르기 타격 섬광 & 방사형 스파크 연출
 */
export function drawPeckImpactSpark(
  ctx: any,
  tx: number,
  ty: number,
  intensity: number = 1.0,
  isSecondHit: boolean = false
) {
  ctx.save();
  ctx.translate(tx, ty);

  // 1. 고휘도 중심 다이아몬드 섬광
  const coreSize = (isSecondHit ? 15 : 11) * intensity;
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(0, -coreSize * 1.5);
  ctx.lineTo(coreSize * 0.32, -coreSize * 0.32);
  ctx.lineTo(coreSize * 1.5, 0);
  ctx.lineTo(coreSize * 0.32, coreSize * 0.32);
  ctx.lineTo(0, coreSize * 1.5);
  ctx.lineTo(-coreSize * 0.32, coreSize * 0.32);
  ctx.lineTo(-coreSize * 1.5, 0);
  ctx.lineTo(-coreSize * 0.32, -coreSize * 0.32);
  ctx.closePath();
  ctx.fill();

  // 2. 중심 따뜻한 골든 플라즈마 코어
  ctx.fillStyle = "#FEF08A";
  ctx.beginPath();
  ctx.arc(0, 0, coreSize * 0.50, 0, Math.PI * 2);
  ctx.fill();

  // 3. 콕! 찍히는 방사형 침형 스파크 (Needle Sparks)
  // - 바깥쪽으로 뻗어나갈수록 부드럽게 0% 투명도로 페이드아웃
  // - 굵기도 중심에서 바깥쪽으로 갈수록 날카롭게 뾰족해지는 쐐기형 테이퍼 구조
  const sparkCount = isSecondHit ? 8 : 6;
  const maxLen = (isSecondHit ? 28 : 20) * intensity;
  const innerR = coreSize * 0.30;

  for (let s = 0; s < sparkCount; s++) {
    const sAngle = (s * Math.PI * 2) / sparkCount + (isSecondHit ? 0.35 : 0.15);
    const sLen = maxLen * (0.75 + 0.30 * ((s * 7) % 3) / 2);
    const isWhite = s % 2 === 0;

    ctx.save();
    ctx.rotate(sAngle);

    // 바깥쪽으로 갈수록 투명해지는 선형 그라디언트
    const grad = ctx.createLinearGradient(innerR, 0, sLen, 0);
    if (isWhite) {
      grad.addColorStop(0.00, "rgba(255, 255, 255, 1.0)");
      grad.addColorStop(0.35, "rgba(255, 255, 255, 0.85)");
      grad.addColorStop(0.70, "rgba(255, 255, 255, 0.35)");
      grad.addColorStop(1.00, "rgba(255, 255, 255, 0.0)");
    } else {
      grad.addColorStop(0.00, "rgba(254, 240, 138, 1.0)");
      grad.addColorStop(0.35, "rgba(253, 224, 71, 0.85)");
      grad.addColorStop(0.70, "rgba(249, 115, 22, 0.35)");
      grad.addColorStop(1.00, "rgba(249, 115, 22, 0.0)");
    }

    // A. 쐐기형 테이퍼 바늘면 (안쪽은 도톰하고 바깥쪽 끝은 뾰족하게 수렴하며 투명화)
    const baseHalfW = (isSecondHit ? 1.8 : 1.3) * intensity;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(innerR, -baseHalfW);
    ctx.lineTo(sLen, 0);
    ctx.lineTo(innerR, baseHalfW);
    ctx.closePath();
    ctx.fill();

    // B. 중심부 고휘도 관통 스트릭 선 (바깥쪽 투명 페이드)
    ctx.strokeStyle = grad;
    ctx.lineWidth = Math.max(0.8, (isSecondHit ? 1.5 : 1.1) * intensity);
    ctx.beginPath();
    ctx.moveTo(innerR, 0);
    ctx.lineTo(sLen, 0);
    ctx.stroke();

    ctx.restore();
  }

  // 4. 선명한 핀포인트 찌르기 충격파 링 (Puncture Ring)
  const ringR = (isSecondHit ? 22 : 14) * intensity;
  ctx.strokeStyle = isSecondHit ? "#FFFFFF" : "#FEF08A";
  ctx.lineWidth = isSecondHit ? 2.0 : 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, ringR, 0, Math.PI * 2);
  ctx.stroke();

  if (isSecondHit) {
    ctx.strokeStyle = "rgba(254, 240, 138, 0.65)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, ringR * 1.4, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 064 쪼기 (Peck) Visual Effect Renderer
 * - 부리 그림, 파란색 호선, 깃털 등 장식 요소 완전 배제
 * - 콕! 콕! 2연속 핀포인트 순백/골든 타격 섬광 & 침형 관통 스파크로 깔끔하고 스피디하게 연출
 */
export function drawPeckEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    [key: string]: any;
  }
) {
  if (frame.showEffect === false) return;
  const { attackerPos, targetPos, isPlayer: isP, isHit } = drawCtx;
  const step = frame.moveStep || 1;

  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0)) - (isP ? 12 : 8);

  ctx.save();

  // Step 2: [1차 쪼기 직격 - 콕!]
  if (step === 2 && isHit) {
    drawPeckImpactSpark(ctx, tx, ty, 1.0, false);
  }

  // Step 4: [2차 연속 쪼기 극대 강타 - 콕!]
  if (step === 4 && isHit) {
    drawPeckImpactSpark(ctx, tx, ty, 1.4, true);
  }

  ctx.restore();
}