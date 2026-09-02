import {
  cometPunchFistImg,
  firePunchFistCanvas,
  icePunchFistCanvas,
  drawMiniRetroStar,
} from "../common/helpers.js";
import { drawFrontStraightPunchFistSvg } from "./move001_004.js";

/**
 * 005 메가톤펀치 (Mega Punch): Concentric Yellow Ring + Heavy Front Straight Fist
 */
export function drawMegaPunchEffect(ctx: any, target: { x: number; y: number }, step: number = 3) {
  ctx.save();

  const targetX = target.x;
  const targetY = target.y - 12;

  if (step === 1) {
    ctx.save();
    ctx.strokeStyle = "#FACC15";
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.arc(targetX, targetY - 14, 56, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(targetX, targetY - 14, 56, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(targetX, targetY - 18);
    ctx.rotate(-1.35);
    ctx.scale(0.70, 0.70);
    ctx.globalAlpha = 0.20;
    if (cometPunchFistImg) {
      const fw = cometPunchFistImg.width;
      const fh = cometPunchFistImg.height;
      ctx.drawImage(cometPunchFistImg, -fw / 2, -fw / 2, fw, fh);
    } else {
      drawFrontStraightPunchFistSvg(ctx, 0, 0, 2.2, 1.0);
    }
    ctx.restore();
  } else if (step === 2) {
    ctx.save();
    ctx.strokeStyle = "#FACC15";
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(targetX, targetY - 14, 28, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(targetX, targetY - 14, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(targetX, targetY - 18);
    ctx.rotate(-2.90);
    ctx.scale(0.75, 0.75);
    ctx.globalAlpha = 0.22;
    if (cometPunchFistImg) {
      const fw = cometPunchFistImg.width;
      const fh = cometPunchFistImg.height;
      ctx.drawImage(cometPunchFistImg, -fw / 2, -fh / 2, fw, fh);
    } else {
      drawFrontStraightPunchFistSvg(ctx, 0, 0, 2.3, 1.0);
    }
    ctx.restore();
  } else if (step === 3) {
    ctx.save();
    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(targetX, targetY - 14, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(targetX, targetY - 18);
    ctx.scale(0.82, 0.82);
    ctx.globalAlpha = 1.0;
    if (cometPunchFistImg) {
      const fw = cometPunchFistImg.width;
      const fh = cometPunchFistImg.height;
      ctx.drawImage(cometPunchFistImg, -fw / 2, -fh / 2, fw, fh);
    } else {
      drawFrontStraightPunchFistSvg(ctx, 0, 0, 2.5, 1.0);
    }
    ctx.restore();

    const sparkX = targetX;
    const sparkY = targetY - 24;
    const starRadius = 28;

    ctx.fillStyle = "#FACC15";
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(sparkX, sparkY - starRadius);
    ctx.quadraticCurveTo(sparkX, sparkY, sparkX + starRadius, sparkY);
    ctx.quadraticCurveTo(sparkX, sparkY, sparkX, sparkY + starRadius);
    ctx.quadraticCurveTo(sparkX, sparkY, sparkX - starRadius, sparkY);
    ctx.quadraticCurveTo(sparkX, sparkY, sparkX, sparkY - starRadius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    const innerR = starRadius * 0.5;
    ctx.beginPath();
    ctx.moveTo(sparkX, sparkY - innerR);
    ctx.quadraticCurveTo(sparkX, sparkY, sparkX + innerR, sparkY);
    ctx.quadraticCurveTo(sparkX, sparkY, sparkX, sparkY + innerR);
    ctx.quadraticCurveTo(sparkX, sparkY, sparkX - innerR, sparkY);
    ctx.quadraticCurveTo(sparkX, sparkY, sparkX, sparkY - innerR);
    ctx.closePath();
    ctx.fill();

    const sparks = [
      { ox: -22, oy: -20, r: 3.5, c: "#FFFFFF" },
      { ox: 24, oy: -18, r: 3.2, c: "#FACC15" },
      { ox: -20, oy: 20, r: 3.2, c: "#F59E0B" },
      { ox: 22, oy: 22, r: 3.5, c: "#FFFFFF" },
      { ox: 0, oy: -34, r: 3.0, c: "#FEF08A" },
      { ox: 0, oy: 28, r: 3.0, c: "#FACC15" },
    ];
    for (const s of sparks) {
      ctx.fillStyle = s.c;
      ctx.beginPath();
      ctx.arc(sparkX + s.ox, sparkY + s.oy, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (step === 4) {
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = "#FACC15";
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.arc(targetX, targetY - 14, 48, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(targetX, targetY - 14, 48, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(targetX, targetY - 18);
    ctx.scale(0.85, 0.85);
    ctx.globalAlpha = 0.40;
    if (cometPunchFistImg) {
      const fw = cometPunchFistImg.width;
      const fh = cometPunchFistImg.height;
      ctx.drawImage(cometPunchFistImg, -fw / 2, -fh / 2, fw, fh);
    }
    ctx.restore();

    drawMiniRetroStar(ctx, targetX, targetY - 24, 18, "rgba(250, 204, 21, 0.5)");
  } else if (step === 5) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = "#FACC15";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(targetX, targetY - 14, 70, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(targetX, targetY - 14, 70, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Japanese Koban (금화 / 엽전 코인) Helper for Pay Day
 */
export function drawKobanCoin(ctx: any, x: number, y: number, scale: number = 1.0, angle: number = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  ctx.fillStyle = "#FACC15";
  ctx.strokeStyle = "#B45309";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 11.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "#F59E0B";
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.ellipse(0, 0, 5.2, 9.5, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#92400E";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-3.5, -4.5); ctx.lineTo(3.5, -4.5);
  ctx.moveTo(-4.5, 0); ctx.lineTo(4.5, 0);
  ctx.moveTo(-3.5, 4.5); ctx.lineTo(3.5, 4.5);
  ctx.stroke();

  ctx.fillStyle = "#78350F";
  ctx.fillRect(-1.5, -1.5, 3, 3);

  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.beginPath();
  ctx.ellipse(-2, -5.5, 1.8, 3, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 006 고양이돈받기 (Pay Day): Radial Koban Coin & Gold Star Shower
 */
export function drawPayDayEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  ctx.save();

  const targetX = target.x;
  const targetY = target.y - 10;

  let spread = 0.75;
  let alpha = 1.0;
  let spinMultiplier = 0.0;

  if (step === 2) {
    spread = 1.40;
    alpha = 0.65;
    spinMultiplier = 1.0;
  } else if (step >= 3) {
    spread = 2.10;
    alpha = 0.25;
    spinMultiplier = 2.2;
  }

  ctx.globalAlpha = alpha;

  const baseCoins = [
    { vx: -22, vy: -26, baseAngle: -0.30, spin: -0.5, scale: 1.05 },
    { vx: 20, vy: -28, baseAngle: 0.35, spin: 0.6, scale: 1.15 },
    { vx: -30, vy: -2, baseAngle: -0.45, spin: -0.7, scale: 1.0 },
    { vx: 28, vy: 6, baseAngle: 0.40, spin: 0.8, scale: 1.1 },
    { vx: -18, vy: 22, baseAngle: 0.55, spin: -0.6, scale: 1.05 },
    { vx: 14, vy: 24, baseAngle: -0.25, spin: 0.5, scale: 1.2 },
    { vx: 0, vy: -10, baseAngle: 0.10, spin: 0.9, scale: 1.25 },
  ];

  for (const c of baseCoins) {
    const coinX = targetX + c.vx * spread;
    const coinY = targetY + c.vy * spread;
    const coinAngle = c.baseAngle + c.spin * spinMultiplier;
    drawKobanCoin(ctx, coinX, coinY, c.scale, coinAngle);
  }

  const sparkles = [
    { ox: -16, oy: -35, size: 10, c: "#FEF08A" },
    { ox: 32, oy: -16, size: 12, c: "#FACC15" },
    { ox: -30, oy: -6, size: 9, c: "#FEF08A" },
    { ox: 18, oy: 22, size: 11, c: "#FDE047" },
    { ox: -10, oy: 26, size: 8, c: "#FFFFFF" },
    { ox: 0, oy: -20, size: 14, c: "#FACC15" },
  ];

  for (const sp of sparkles) {
    drawMiniRetroStar(
      ctx,
      targetX + sp.ox * (spread * 0.9),
      targetY + sp.oy * (spread * 0.9),
      step >= 3 ? sp.size * 0.75 : sp.size,
      sp.c
    );
  }

  ctx.restore();
}

/**
 * Flame Tongue Helper for Fire Effects
 */
export function drawFlameTongue(
  ctx: any,
  x: number,
  y: number,
  w: number,
  h: number,
  angle: number = 0,
  alpha: number = 1.0,
  tipCurve: number = 0
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;

  ctx.fillStyle = "#DC2626";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.5);
  ctx.bezierCurveTo(-w * 0.65, h * 0.3, -w * 0.6, -h * 0.2, tipCurve, -h * 0.5);
  ctx.bezierCurveTo(w * 0.2, -h * 0.2, w * 0.65, h * 0.3, 0, h * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#F97316";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.44);
  ctx.bezierCurveTo(-w * 0.45, h * 0.24, -w * 0.40, -h * 0.15, tipCurve * 0.8, -h * 0.38);
  ctx.bezierCurveTo(w * 0.15, -h * 0.15, w * 0.45, h * 0.24, 0, h * 0.44);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#FEF08A";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.36);
  ctx.bezierCurveTo(-w * 0.26, h * 0.18, -w * 0.22, -h * 0.08, tipCurve * 0.5, -h * 0.24);
  ctx.bezierCurveTo(w * 0.08, -h * 0.08, w * 0.26, h * 0.18, 0, h * 0.36);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.ellipse(0, h * 0.16, w * 0.14, h * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 007 불꽃펀치 (Fire Punch): 5-Finger Flaming Fist + Rising Flame Updraft
 */
export function drawFirePunchEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  ctx.save();

  const targetX = target.x;
  const targetY = target.y - 12;

  if (step <= 2) {
    const fireGrad = ctx.createRadialGradient(
      targetX,
      targetY - 14,
      4,
      targetX,
      targetY - 14,
      step === 1 ? 46 : 56
    );
    fireGrad.addColorStop(0, "rgba(254, 240, 138, 0.75)");
    fireGrad.addColorStop(0.4, "rgba(249, 115, 22, 0.65)");
    fireGrad.addColorStop(0.75, "rgba(220, 38, 38, 0.40)");
    fireGrad.addColorStop(1, "rgba(220, 38, 38, 0)");
    ctx.fillStyle = fireGrad;
    ctx.globalAlpha = step === 1 ? 0.90 : 0.50;
    ctx.beginPath();
    ctx.arc(targetX, targetY - 14, step === 1 ? 46 : 56, 0, Math.PI * 2);
    ctx.fill();
  }

  if (step <= 2) {
    ctx.save();
    ctx.translate(targetX, targetY - 14);
    ctx.scale(step === 1 ? 0.68 : 0.72, step === 1 ? 0.68 : 0.72);
    ctx.globalAlpha = step === 1 ? 1.0 : 0.35;

    const fistSprite = firePunchFistCanvas || cometPunchFistImg;
    if (fistSprite) {
      const fw = fistSprite.width;
      const fh = fistSprite.height;
      ctx.drawImage(fistSprite, -fw / 2, -fh / 2, fw, fh);
    } else {
      drawFrontStraightPunchFistSvg(ctx, 0, 0, 2.2, 1.0);
    }
    ctx.restore();
  }

  let riseY = 0;
  let flameScale = 1.0;
  let flameAlpha = 1.0;

  if (step === 2) {
    riseY = -14;
    flameScale = 1.15;
    flameAlpha = 0.70;
  } else if (step >= 3) {
    riseY = -28;
    flameScale = 1.25;
    flameAlpha = 0.30;
  }

  drawFlameTongue(ctx, targetX - 22 * flameScale, targetY + riseY + 2, 14 * flameScale, 28 * flameScale, -0.55, flameAlpha, -5);
  drawFlameTongue(ctx, targetX - 13 * flameScale, targetY + riseY - 14, 16 * flameScale, 36 * flameScale, -0.22, flameAlpha, -3);
  drawFlameTongue(ctx, targetX, targetY + riseY - 20, 18 * flameScale, 42 * flameScale, 0.0, flameAlpha, 0);
  drawFlameTongue(ctx, targetX + 13 * flameScale, targetY + riseY - 14, 16 * flameScale, 36 * flameScale, 0.22, flameAlpha, 3);
  drawFlameTongue(ctx, targetX + 22 * flameScale, targetY + riseY + 2, 14 * flameScale, 28 * flameScale, 0.55, flameAlpha, 5);

  if (step === 1) {
    drawMiniRetroStar(ctx, targetX, targetY - 14, 22, "#FDE047");
  } else if (step === 2) {
    drawMiniRetroStar(ctx, targetX, targetY - 24, 14, "rgba(253, 224, 71, 0.60)");
  }

  ctx.save();
  ctx.globalAlpha = step === 1 ? 0.9 : (step === 2 ? 0.7 : 0.35);
  const emberOffsetY = (step - 1) * -16;
  const embers = [
    { ox: -26, oy: -20 + emberOffsetY, r: 2.8, c: "#FEF08A" },
    { ox: 28, oy: -18 + emberOffsetY, r: 3.0, c: "#F97316" },
    { ox: -18, oy: 10 + emberOffsetY, r: 2.5, c: "#EF4444" },
    { ox: 22, oy: 12 + emberOffsetY, r: 2.8, c: "#FDE047" },
    { ox: 0, oy: -36 + emberOffsetY, r: 3.0, c: "#FEF08A" },
    { ox: 32, oy: 2 + emberOffsetY, r: 2.6, c: "#F97316" },
    { ox: -30, oy: 2 + emberOffsetY, r: 2.6, c: "#FDE047" },
  ];

  for (const eb of embers) {
    ctx.fillStyle = eb.c;
    ctx.beginPath();
    ctx.arc(targetX + eb.ox, targetY - 14 + eb.oy, step >= 3 ? eb.r * 0.7 : eb.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.restore();
}

/**
 * 008 냉동펀치 (Ice Punch): 6-Point Diamond Ice Crystal Shards + Cryo Frost
 */
export function drawIcePunchEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  ctx.save();

  const targetX = target.x;
  const targetY = target.y - 12;

  let spread = 0.85;
  let alpha = 1.0;
  let fistAlpha = 1.0;
  let spinOffset = 0.0;

  if (step === 2) {
    spread = 1.55;
    alpha = 0.65;
    fistAlpha = 0.35;
    spinOffset = Math.PI / 6;
  } else if (step >= 3) {
    spread = 2.25;
    alpha = 0.25;
    fistAlpha = 0.0;
    spinOffset = Math.PI / 3;
  }

  if (step <= 2) {
    const iceGrad = ctx.createRadialGradient(
      targetX,
      targetY - 14,
      4,
      targetX,
      targetY - 14,
      step === 1 ? 46 : 56
    );
    iceGrad.addColorStop(0, "rgba(255, 255, 255, 0.85)");
    iceGrad.addColorStop(0.4, "rgba(125, 211, 252, 0.70)");
    iceGrad.addColorStop(0.75, "rgba(2, 132, 199, 0.40)");
    iceGrad.addColorStop(1, "rgba(2, 132, 199, 0)");
    ctx.fillStyle = iceGrad;
    ctx.globalAlpha = step === 1 ? 0.90 : 0.45;
    ctx.beginPath();
    ctx.arc(targetX, targetY - 14, step === 1 ? 46 : 56, 0, Math.PI * 2);
    ctx.fill();
  }

  if (fistAlpha > 0.02) {
    ctx.save();
    ctx.translate(targetX, targetY - 14);
    ctx.scale(step === 1 ? 0.68 : 0.72, step === 1 ? 0.68 : 0.72);
    ctx.globalAlpha = fistAlpha;

    const fistSprite = icePunchFistCanvas || cometPunchFistImg;
    if (fistSprite) {
      const fw = fistSprite.width;
      const fh = fistSprite.height;
      ctx.drawImage(fistSprite, -fw / 2, -fh / 2, fw, fh);
    } else {
      drawFrontStraightPunchFistSvg(ctx, 0, 0, 2.2, 1.0);
    }
    ctx.restore();
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  const baseShards = [
    { vx: 0, vy: -34, w: 8, h: 16, rot: 0 },
    { vx: 28, vy: -20, w: 7, h: 14, rot: Math.PI / 3 },
    { vx: 28, vy: 16, w: 7, h: 14, rot: (2 * Math.PI) / 3 },
    { vx: 0, vy: 30, w: 8, h: 16, rot: Math.PI },
    { vx: -28, vy: 16, w: 7, h: 14, rot: (4 * Math.PI) / 3 },
    { vx: -28, vy: -20, w: 7, h: 14, rot: (5 * Math.PI) / 3 },
  ];

  for (const sh of baseShards) {
    ctx.save();
    ctx.translate(targetX + sh.vx * spread, targetY - 14 + sh.vy * spread);
    ctx.rotate(sh.rot + spinOffset);
    ctx.fillStyle = "#E0F2FE";
    ctx.strokeStyle = "#0284C7";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -sh.h / 2);
    ctx.lineTo(sh.w / 2, 0);
    ctx.lineTo(0, sh.h / 2);
    ctx.lineTo(-sh.w / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, -sh.h / 2);
    ctx.lineTo(0, sh.h / 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  if (step <= 2) {
    drawMiniRetroStar(ctx, targetX, targetY - 14, step === 1 ? 22 : 14, "#BAE6FD");
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  const glints = [
    { vx: -24, vy: -26, r: 2.8, c: "#FFFFFF" },
    { vx: 26, vy: -24, r: 3.0, c: "#E0F2FE" },
    { vx: -20, vy: 20, r: 2.4, c: "#38BDF8" },
    { vx: 22, vy: 22, r: 2.8, c: "#FFFFFF" },
    { vx: 0, vy: -40, r: 3.0, c: "#BAE6FD" },
    { vx: 32, vy: 0, r: 2.6, c: "#38BDF8" },
    { vx: -32, vy: 0, r: 2.6, c: "#E0F2FE" },
  ];
  for (const gl of glints) {
    ctx.fillStyle = gl.c;
    ctx.beginPath();
    ctx.arc(
      targetX + gl.vx * spread,
      targetY - 14 + gl.vy * spread,
      step >= 3 ? gl.r * 0.7 : gl.r,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.restore();

  ctx.restore();
}
