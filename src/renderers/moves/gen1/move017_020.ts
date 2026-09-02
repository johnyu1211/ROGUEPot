import { drawMiniRetroStar } from "../common/helpers.js";

/**
 * 017 날개치기 (Wing Attack): Rapid Dash Strike with Physics-Accurate Feather Burst & Fluttering Leaf Descent
 */
export function drawWingAttackEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  ctx.save();
  const tx = target.x;
  const ty = target.y - 12;

  /**
   * Draws an authentic, delicate feather with curved rachis (shaft), asymmetric vanes, and fine barb details.
   */
  const drawAuthenticFeather = (
    fx: number,
    fy: number,
    angle: number,
    length: number = 26,
    curvature: number = 0.15,
    alpha: number = 0.85
  ) => {
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;

    const wWide = length * 0.24; // trailing vane (wider & softer)
    const wNarrow = length * 0.14; // leading vane (narrower & aerodynamic)
    const stemCurve = length * curvature * 0.25;

    // 1. Soft Asymmetrical Translucent Vanes (Feather Body)
    // Wider trailing vane (left side)
    ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
    ctx.beginPath();
    ctx.moveTo(0, length * 0.5); // Quill base
    ctx.quadraticCurveTo(-wWide * 1.25 + stemCurve * 0.5, length * 0.15, -wWide * 0.95 + stemCurve, -length * 0.18);
    ctx.quadraticCurveTo(-wWide * 0.5 + stemCurve, -length * 0.45, stemCurve, -length * 0.5); // Tip
    ctx.quadraticCurveTo(stemCurve * 0.6, 0, 0, length * 0.5);
    ctx.closePath();
    ctx.fill();

    // Narrower leading vane (right side)
    ctx.fillStyle = "rgba(235, 245, 255, 0.68)";
    ctx.beginPath();
    ctx.moveTo(0, length * 0.5);
    ctx.quadraticCurveTo(wNarrow * 1.15 + stemCurve * 0.5, length * 0.18, wNarrow * 0.88 + stemCurve, -length * 0.15);
    ctx.quadraticCurveTo(wNarrow * 0.4 + stemCurve, -length * 0.45, stemCurve, -length * 0.5);
    ctx.quadraticCurveTo(stemCurve * 0.6, 0, 0, length * 0.5);
    ctx.closePath();
    ctx.fill();

    // 2. Subtle Barb Striations (깃가지 결)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 0.8;
    const numBarbs = 5;
    for (let i = 1; i <= numBarbs; i++) {
      const t = i / (numBarbs + 1);
      const py = length * 0.5 - length * t;
      const px = stemCurve * t;
      const barbFade = 1 - Math.abs(t - 0.5) * 1.2;

      // Left barb line
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - wWide * barbFade, py - length * 0.08);
      ctx.stroke();

      // Right barb line
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + wNarrow * barbFade, py - length * 0.08);
      ctx.stroke();
    }

    // 3. Delicate Arched Center Shaft / Rachis (깃대)
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(0, length * 0.56); // Quill extending at bottom
    ctx.quadraticCurveTo(stemCurve * 0.5, 0, stemCurve, -length * 0.5);
    ctx.stroke();

    // 4. Soft Fluffy Downy Tuft at Base (솜깃)
    ctx.fillStyle = "rgba(255, 255, 255, 0.90)";
    ctx.beginPath();
    ctx.arc(-1.5, length * 0.43, 2.2, 0, Math.PI * 2);
    ctx.arc(1.5, length * 0.45, 2.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  if (step === 1) {
    // Step 1: Initial rush - Slipstream wake feathers floating in the air
    drawAuthenticFeather(tx - 42, ty + 16, -0.38, 22, 0.14, 0.75);
    drawAuthenticFeather(tx - 18, ty - 14, 0.25, 26, -0.16, 0.80);
  } else if (step === 2) {
    // Step 2: Impact Burst - Distinct individual feathers dislodged and launched UPWARD with unique angles & arcs
    drawAuthenticFeather(tx - 48, ty - 22, -0.72, 27, 0.22, 0.95);  // A: Far Left
    drawAuthenticFeather(tx - 24, ty - 52, -0.28, 31, -0.18, 0.95); // B: High Left
    drawAuthenticFeather(tx + 6, ty - 60, 0.10, 33, 0.14, 0.95);    // C: High Center
    drawAuthenticFeather(tx + 38, ty - 45, 0.45, 29, -0.24, 0.95);  // D: High Right
    drawAuthenticFeather(tx + 56, ty - 16, 0.82, 25, 0.16, 0.90);   // E: Far Right
    drawAuthenticFeather(tx - 15, ty + 16, -0.40, 23, 0.10, 0.85);  // F: Lower Left
    drawAuthenticFeather(tx + 26, ty + 20, 0.35, 24, -0.14, 0.85);  // G: Lower Right

    // Center sharp impact star & bright flash
    drawMiniRetroStar(ctx, tx, ty, 20, "#BAE6FD");
    drawMiniRetroStar(ctx, tx, ty, 10, "#FFFFFF");
  } else if (step === 3) {
    // Step 3: Peak Float & Final Fade - Feathers reach zenith, tilt flat horizontally, and swiftly fade away
    drawAuthenticFeather(tx - 62, ty - 58, -1.42, 27, 0.20, 0.45); // A: tilted slightly up-left
    drawAuthenticFeather(tx - 18, ty - 78, 1.66, 31, -0.15, 0.50);  // B: floated high, right-tilt
    drawAuthenticFeather(tx + 14, ty - 84, -1.58, 33, 0.12, 0.52); // C: highest apex, nearly flat
    drawAuthenticFeather(tx + 48, ty - 65, 1.48, 29, -0.20, 0.48);  // D: rightward hang
    drawAuthenticFeather(tx + 72, ty - 32, -1.64, 25, 0.14, 0.38); // E: wide drift
    drawAuthenticFeather(tx - 32, ty + 8, 1.52, 23, 0.08, 0.35);   // F: low hover
    drawAuthenticFeather(tx + 36, ty + 10, -1.48, 24, -0.12, 0.35); // G: low hover
  }
  // Step 4 & Step 5: Completely transparent and vanished (100% clean)

  ctx.restore();
}

/**
 * 018 날려버리기 (Whirlwind): Rising Towering Cyclone Funnel & Sky Vortex
 */
export function drawWhirlwindEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  ctx.save();
  const tx = target.x;
  const ty = target.y - 12;
  const baseY = ty + 38; // ground platform base

  // Helper: Draw spiral wind ribbon funnel ring
  const drawFunnelRing = (
    cy: number,
    radiusX: number,
    radiusY: number,
    rot: number,
    alpha: number,
    lineWidth: number = 3.0
  ) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(tx, cy);
    ctx.rotate(rot);

    // Outer luminous air glow
    ctx.strokeStyle = "rgba(224, 242, 254, 0.75)";
    ctx.lineWidth = lineWidth + 2.0;
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Inner brilliant white core
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX * 0.95, radiusY * 0.9, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  };

  // Helper: Draw vertical spiral helix streamers wrapping around the cone
  const drawAscendingStreamer = (
    startY: number,
    endY: number,
    startW: number,
    endW: number,
    phaseOffset: number,
    alpha: number
  ) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();

    const segments = 16;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const curY = startY + (endY - startY) * t;
      const curW = startW + (endW - startW) * t;
      const curX = tx + Math.sin(t * Math.PI * 3 + phaseOffset) * curW;
      if (i === 0) ctx.moveTo(curX, curY);
      else ctx.lineTo(curX, curY);
    }
    ctx.stroke();
    ctx.restore();
  };

  if (step === 1) {
    // Step 1: Whirlwind begins spinning and rising from ground to waist
    const numRings = 5;
    for (let i = 0; i < numRings; i++) {
      const t = i / (numRings - 1);
      const ringY = baseY - t * 45;
      const rx = 16 + t * 14;
      const ry = 6 + t * 3;
      const rot = i * 0.4 - 0.2;
      drawFunnelRing(ringY, rx, ry, rot, 0.65 + t * 0.25, 2.5);
    }
    drawAscendingStreamer(baseY, baseY - 45, 16, 30, 0, 0.7);
    drawAscendingStreamer(baseY, baseY - 45, 16, 30, Math.PI, 0.7);
  } else if (step === 2) {
    // Step 2: Towering cyclone funnel surges violently upward through defender into the sky
    const numRings = 10;
    for (let i = 0; i < numRings; i++) {
      const t = i / (numRings - 1);
      const ringY = baseY - t * 150;
      const rx = 18 + t * 42; // expanding funnel: 18px at base to 60px at top
      const ry = 6 + t * 10;
      const rot = Math.sin(i * 0.8 + 1) * 0.25;
      drawFunnelRing(ringY, rx, ry, rot, 0.85, 3.2);
    }
    drawAscendingStreamer(baseY, baseY - 150, 18, 60, 0.5, 0.9);
    drawAscendingStreamer(baseY, baseY - 150, 18, 60, 0.5 + Math.PI * 0.66, 0.9);
    drawAscendingStreamer(baseY, baseY - 150, 18, 60, 0.5 + Math.PI * 1.33, 0.9);

    // Starburst flash
    drawMiniRetroStar(ctx, tx, ty - 40, 18, "#BAE6FD");
  } else if (step === 3) {
    // Step 3: Roaring Sky Vortex - Tornado engulfs everything and surges high past the top of the screen
    const numRings = 11;
    for (let i = 0; i < numRings; i++) {
      const t = i / (numRings - 1);
      const ringY = baseY + 10 - t * 210; // surges all the way past y < 0
      const rx = 22 + t * 55;
      const ry = 7 + t * 12;
      const rot = Math.sin(i * 0.8 + 2.5) * 0.3;
      drawFunnelRing(ringY, rx, ry, rot, 0.9, 3.5);
    }
    drawAscendingStreamer(baseY, baseY - 210, 22, 75, 1.2, 0.95);
    drawAscendingStreamer(baseY, baseY - 210, 22, 75, 1.2 + Math.PI * 0.66, 0.95);
    drawAscendingStreamer(baseY, baseY - 210, 22, 75, 1.2 + Math.PI * 1.33, 0.95);
  } else if (step >= 4) {
    // Step 4: Sky Vortex Dispersal - Wide fading wind rings in the high sky
    const numRings = 5;
    for (let i = 0; i < numRings; i++) {
      const t = i / (numRings - 1);
      const ringY = ty - 40 - t * 100;
      const rx = 45 + t * 35;
      const ry = 10 + t * 8;
      const rot = i * 0.3;
      drawFunnelRing(ringY, rx, ry, rot, 0.35 * (1 - t * 0.5), 2.0);
    }
  }

  ctx.restore();
}

/**
 * 019 공중날기 (Fly): High-Speed Sky Launch & Supersonic Dive-Bomb Crater Impact
 */
export function drawFlyEffect(ctx: any, start: { x: number; y: number }, target: { x: number; y: number }, step: number = 1) {
  ctx.save();
  const tx = target.x;
  const ty = target.y - 12;

  if (step === 1) {
    for (let i = -2; i <= 2; i++) {
      ctx.strokeStyle = "rgba(224, 242, 254, 0.75)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(start.x + i * 14, start.y + 20);
      ctx.lineTo(start.x + i * 14, start.y - 70);
      ctx.stroke();
    }
  } else if (step === 2) {
    ctx.fillStyle = "rgba(15, 23, 42, 0.45)";
    ctx.beginPath();
    ctx.ellipse(tx, ty + 24, 32, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = -1; i <= 1; i++) {
      ctx.strokeStyle = "rgba(186, 230, 253, 0.70)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(tx + i * 18, 0);
      ctx.lineTo(tx + i * 18, ty - 30);
      ctx.stroke();
    }
  } else if (step === 3) {
    // Step 3: Supersonic Dive-Bomb Impact Slam!
    ctx.strokeStyle = "#BAE6FD";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(tx, 0);
    ctx.lineTo(tx, ty + 10);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(tx, 0);
    ctx.lineTo(tx, ty + 10);
    ctx.stroke();

    // Explosive Ground Crater Shockwave
    ctx.strokeStyle = "#F8FAFC";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(tx, ty + 18, 48, 14, 0, 0, Math.PI * 2);
    ctx.stroke();

    drawMiniRetroStar(ctx, tx, ty, 24, "#BAE6FD");
    drawMiniRetroStar(ctx, tx, ty, 14, "#FFFFFF");
  } else if (step >= 4) {
    // Step 4: Radial impact dispersal
    ctx.strokeStyle = "rgba(224, 242, 254, 0.40)";
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.ellipse(tx, ty + 18, 64, 18, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 020 조이기 (Bind): Constricting Coiled Bands with Pressure Squeeze
 */
export function drawBindEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  ctx.save();
  const tx = target.x;
  const ty = target.y - 10;

  const squeeze = step === 2 ? 0.75 : (step >= 3 ? 0.90 : 1.0);
  const alpha = step >= 3 ? 0.35 : 1.0;

  ctx.globalAlpha = alpha;
  for (let i = 0; i < 3; i++) {
    const cy = ty - 12 + i * 12;
    ctx.strokeStyle = "#D97706";
    ctx.lineWidth = 6.0;
    ctx.beginPath();
    ctx.ellipse(tx, cy, 32 * squeeze, 10 * squeeze, -0.15, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#FEF3C7";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(tx, cy, 32 * squeeze, 10 * squeeze, -0.15, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (step === 2) {
    drawMiniRetroStar(ctx, tx, ty, 16, "#F59E0B");
  }

  ctx.restore();
}
