import {
  cometPunchFistImg,
  thunderPunchFistCanvas,
  drawMiniRetroStar,
} from "../common/helpers.js";
import { drawFrontStraightPunchFistSvg } from "./move001_004.js";

/**
 * Dynamic Writhing Sharp Zigzag Lightning Bolt
 */
export function drawWrithingLightningBolt(
  ctx: any,
  originX: number,
  originY: number,
  angle: number,
  startDist: number,
  endDist: number,
  step: number = 1,
  boltIdx: number = 0,
  alpha: number = 1.0
) {
  ctx.save();
  ctx.translate(originX, originY);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;

  const len = Math.max(4, endDist - startDist);
  const phase = (step * 2 + boltIdx) % 3;
  let jitters: number[] = [];

  if (phase === 0) {
    jitters = [0, 9, -13, 12, -10, 8, -2];
  } else if (phase === 1) {
    jitters = [0, -11, 14, -9, 13, -9, 3];
  } else {
    jitters = [0, 13, -8, 14, -12, 10, -1];
  }

  const numSegments = jitters.length - 1;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= numSegments; i++) {
    const t = i / numSegments;
    pts.push({
      x: startDist + len * t,
      y: jitters[i] * (step === 1 ? 1.0 : (step === 2 ? 0.85 : 0.65)),
    });
  }

  ctx.strokeStyle = "#FACC15";
  ctx.lineCap = "round";
  ctx.lineJoin = "miter";
  const baseGlowW = step === 1 ? 5.4 : (step === 2 ? 4.2 : 3.0);

  for (let i = 0; i < numSegments; i++) {
    const t = i / numSegments;
    let taper = 1.0;
    if (step === 1) {
      taper = Math.max(0.20, 1.0 - t * 0.80);
    } else {
      taper = Math.max(0.15, (1.0 - t * 0.75) * (0.5 + 0.5 * Math.sin(t * Math.PI)));
    }

    const segMidDist = (pts[i].x + pts[i + 1].x) / 2;
    const distFade = Math.max(0.10, 1.0 - (segMidDist / 72) * 0.75);
    ctx.globalAlpha = alpha * distFade;

    ctx.lineWidth = baseGlowW * taper;
    ctx.beginPath();
    ctx.moveTo(pts[i].x, pts[i].y);
    ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
    ctx.stroke();
  }

  ctx.strokeStyle = "#FFFFFF";
  const baseCoreW = step === 1 ? 2.4 : (step === 2 ? 1.8 : 1.2);

  for (let i = 0; i < numSegments; i++) {
    const t = i / numSegments;
    let taper = 1.0;
    if (step === 1) {
      taper = Math.max(0.20, 1.0 - t * 0.80);
    } else {
      taper = Math.max(0.15, (1.0 - t * 0.75) * (0.5 + 0.5 * Math.sin(t * Math.PI)));
    }

    const segMidDist = (pts[i].x + pts[i + 1].x) / 2;
    const distFade = Math.max(0.10, 1.0 - (segMidDist / 72) * 0.75);
    ctx.globalAlpha = alpha * distFade;

    ctx.lineWidth = baseCoreW * taper;
    ctx.beginPath();
    ctx.moveTo(pts[i].x, pts[i].y);
    ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 009 번개펀치 (Thunder Punch): Electric Golden Fist + 6-Direction Writhing Lightning
 */
export function drawThunderPunchEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  ctx.save();

  const targetX = target.x;
  const targetY = target.y - 12;

  let startDist = 2;
  let endDist = 46;
  let alpha = 1.0;
  let fistAlpha = 1.0;

  if (step === 2) {
    startDist = 24;
    endDist = 60;
    alpha = 0.70;
    fistAlpha = 0.35;
  } else if (step >= 3) {
    startDist = 54;
    endDist = 68;
    alpha = 0.22;
    fistAlpha = 0.0;
  }

  if (step <= 2) {
    ctx.save();
    ctx.fillStyle = step === 1 ? "rgba(10, 15, 30, 0.42)" : "rgba(10, 15, 30, 0.22)";
    ctx.fillRect(0, 0, 560, 380);
    ctx.restore();
  }

  if (step <= 2) {
    const eleGrad = ctx.createRadialGradient(
      targetX,
      targetY - 14,
      4,
      targetX,
      targetY - 14,
      step === 1 ? 48 : 60
    );
    eleGrad.addColorStop(0, "rgba(255, 255, 255, 0.90)");
    eleGrad.addColorStop(0.35, "rgba(254, 240, 138, 0.80)");
    eleGrad.addColorStop(0.75, "rgba(234, 179, 8, 0.45)");
    eleGrad.addColorStop(1, "rgba(234, 179, 8, 0)");
    ctx.fillStyle = eleGrad;
    ctx.globalAlpha = step === 1 ? 0.90 : 0.45;
    ctx.beginPath();
    ctx.arc(targetX, targetY - 14, step === 1 ? 48 : 60, 0, Math.PI * 2);
    ctx.fill();
  }

  if (fistAlpha > 0.02) {
    ctx.save();
    ctx.translate(targetX, targetY - 14);
    ctx.scale(step === 1 ? 0.68 : 0.72, step === 1 ? 0.68 : 0.72);
    ctx.globalAlpha = fistAlpha;

    const fistSprite = thunderPunchFistCanvas || cometPunchFistImg;
    if (fistSprite) {
      const fw = fistSprite.width;
      const fh = fistSprite.height;
      ctx.drawImage(fistSprite, -fw / 2, -fh / 2, fw, fh);
    } else {
      drawFrontStraightPunchFistSvg(ctx, 0, 0, 2.2, 1.0);
    }
    ctx.restore();
  }

  const boltAngles = [
    -Math.PI / 2,
    -Math.PI / 6,
    Math.PI / 6,
    Math.PI / 2,
    (5 * Math.PI) / 6,
    (7 * Math.PI) / 6,
  ];

  for (let i = 0; i < boltAngles.length; i++) {
    const angle = boltAngles[i];
    drawWrithingLightningBolt(
      ctx,
      targetX,
      targetY - 14,
      angle,
      startDist,
      endDist,
      step,
      i,
      alpha
    );
  }

  if (step <= 2) {
    drawMiniRetroStar(ctx, targetX, targetY - 14, step === 1 ? 26 : 16, "#FEF08A");
  }

  ctx.restore();
}

/**
 * 010 할퀴기 (Scratch): 3 Sharp Diagonal White/Silver Claw Slash Streaks
 */
export function drawScratchEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  ctx.save();

  const targetX = target.x;
  const targetY = target.y - 12;

  let alpha = 1.0;
  let spread = 1.0;
  if (step === 2) {
    alpha = 0.75;
    spread = 1.25;
  } else if (step >= 3) {
    alpha = 0.30;
    spread = 1.50;
  }

  ctx.save();
  ctx.globalAlpha = alpha;

  const clawTracks = [
    { ox: -20, oy: -14, length: 50 },
    { ox: 0, oy: 0, length: 62 },
    { ox: 20, oy: 14, length: 50 },
  ];

  for (const ct of clawTracks) {
    ctx.save();
    ctx.translate(targetX + ct.ox, targetY - 14 + ct.oy);
    ctx.rotate(Math.PI / 4 + 0.15);

    const halfL = (ct.length * spread) / 2;

    ctx.fillStyle = "#E2E8F0";
    ctx.strokeStyle = "#94A3B8";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-halfL, 0);
    ctx.quadraticCurveTo(0, -5 * spread, halfL, 0);
    ctx.quadraticCurveTo(0, 5 * spread, -halfL, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(-halfL * 0.85, 0);
    ctx.quadraticCurveTo(0, -2.5 * spread, halfL * 0.85, 0);
    ctx.quadraticCurveTo(0, 2.5 * spread, -halfL * 0.85, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
  ctx.restore();
}

/**
 * Pincer Claw Helper for Vice Grip & Guillotine
 */
export function drawPincerClaw(ctx: any, x: number, y: number, isLeft: boolean, scale: number = 1.0, isGuillotine: boolean = false) {
  ctx.save();
  ctx.translate(x, y);
  if (!isLeft) ctx.scale(-1, 1);
  ctx.scale(scale, scale);

  const mainColor = isGuillotine ? "#DC2626" : "#EA580C";
  const edgeColor = isGuillotine ? "#F87171" : "#FDBA74";
  const darkOutline = "#7F1D1D";

  ctx.fillStyle = mainColor;
  ctx.strokeStyle = darkOutline;
  ctx.lineWidth = 2.4;

  ctx.beginPath();
  ctx.moveTo(-18, -24);
  ctx.bezierCurveTo(8, -26, 22, -10, 24, 8);
  ctx.bezierCurveTo(24, 20, 14, 26, 4, 24);
  ctx.bezierCurveTo(12, 14, 12, -4, -6, -12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = edgeColor;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-14, -20);
  ctx.bezierCurveTo(6, -22, 18, -8, 20, 6);
  ctx.stroke();

  ctx.restore();
}

/**
 * 011 찝기 (Vice Grip): Dual Opposing Pincers Clamping & Squeezing Target
 */
export function drawViceGripEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  ctx.save();

  const targetX = target.x;
  const targetY = target.y - 12;

  let pincerOx = 36;
  let alpha = 1.0;

  if (step === 2) {
    pincerOx = 8;
    alpha = 1.0;
  } else if (step >= 3) {
    pincerOx = 16;
    alpha = 0.30;
  }

  ctx.save();
  ctx.globalAlpha = alpha;

  drawPincerClaw(ctx, targetX - pincerOx, targetY - 14, true, 1.15, false);
  drawPincerClaw(ctx, targetX + pincerOx, targetY - 14, false, 1.15, false);

  if (step === 2) {
    drawMiniRetroStar(ctx, targetX, targetY - 14, 24, "#FACC15");

    const sparks = [
      { ox: 0, oy: -26, r: 3.2, c: "#FFFFFF" },
      { ox: 0, oy: 22, r: 3.2, c: "#FEF08A" },
      { ox: -24, oy: 0, r: 2.8, c: "#FB923C" },
      { ox: 24, oy: 0, r: 2.8, c: "#FB923C" },
    ];
    for (const sp of sparks) {
      ctx.fillStyle = sp.c;
      ctx.beginPath();
      ctx.arc(targetX + sp.ox, targetY - 14 + sp.oy, sp.r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (step >= 3) {
    drawMiniRetroStar(ctx, targetX, targetY - 14, 14, "rgba(250, 204, 21, 0.5)");
  }

  ctx.restore();
  ctx.restore();
}

/**
 * 012 가위자르기 (Guillotine) Scissor Blade Helper
 */
export function drawSingleScissorBlade(
  ctx: any,
  cx: number,
  cy: number,
  angle: number,
  bladeLength: number,
  rootWidth: number,
  tipWidth: number,
  alpha: number = 1.0
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;

  const halfL = bladeLength / 2;
  const halfR = rootWidth / 2;
  const halfT = tipWidth / 2;

  ctx.fillStyle = "#DC2626";
  ctx.strokeStyle = "#7F1D1D";
  ctx.lineWidth = 1.4;
  ctx.lineJoin = "miter";
  ctx.beginPath();
  ctx.moveTo(0, -halfR);
  ctx.lineTo(halfL * 0.85, -halfT);
  ctx.lineTo(halfL, 0);
  ctx.lineTo(halfL * 0.85, halfT);
  ctx.lineTo(0, halfR);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, halfR);
  ctx.lineTo(-halfL * 0.85, halfT);
  ctx.lineTo(-halfL, 0);
  ctx.lineTo(-halfL * 0.85, -halfT);
  ctx.lineTo(0, -halfR);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "#EF4444";
  ctx.lineWidth = Math.max(1.0, rootWidth * 0.22);
  ctx.beginPath();
  ctx.moveTo(-halfL * 0.94, 0);
  ctx.lineTo(halfL * 0.94, 0);
  ctx.stroke();

  ctx.restore();
}

/**
 * 012 가위자르기 (Guillotine): Pure Scissor Blade Execution Engine
 */
export function drawGuillotineEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  ctx.save();

  const targetX = target.x;
  const targetY = target.y - 12;

  ctx.save();
  if (step === 3) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.82)";
    ctx.fillRect(0, 0, 560, 380);
  } else if (step === 1 || step === 2) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
    ctx.fillRect(0, 0, 560, 380);
  } else if (step >= 4) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
    ctx.fillRect(0, 0, 560, 380);
  }
  ctx.restore();

  if (step === 1) {
    drawSingleScissorBlade(ctx, targetX, targetY - 14, -Math.PI / 4, 145, 8.5, 1.0, 1.0);
  } else if (step === 2) {
    drawSingleScissorBlade(ctx, targetX, targetY - 14, Math.PI / 4, 145, 8.5, 1.0, 1.0);
  } else if (step === 3) {
    drawSingleScissorBlade(ctx, targetX, targetY - 14, -Math.PI / 4, 160, 12.0, 1.0, 1.0);
    drawSingleScissorBlade(ctx, targetX, targetY - 14, Math.PI / 4, 160, 12.0, 1.0, 1.0);
  } else if (step >= 4) {
    drawSingleScissorBlade(ctx, targetX, targetY - 14, -Math.PI / 4, 172, 6.0, 0.8, 0.25);
    drawSingleScissorBlade(ctx, targetX, targetY - 14, Math.PI / 4, 172, 6.0, 0.8, 0.25);
  }

  ctx.restore();
}
