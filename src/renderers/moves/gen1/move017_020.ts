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
 * 018 날려버리기 (Whirlwind): Towering Spiral Tornado Column
 */
export function drawWhirlwindEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  ctx.save();
  const tx = target.x;
  const ty = target.y - 12;

  if (step === 1) {
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = "rgba(148, 163, 184, 0.55)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(tx, ty + 20 - i * 8, 30 + i * 6, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (step === 2 || step === 3) {
    const layers = 8;
    for (let i = 0; i < layers; i++) {
      const ringY = ty + 25 - i * 14;
      const ringW = 20 + i * 5.5;
      const ringH = 8 + i * 1.5;
      const rot = ((step * 3 + i) * Math.PI) / 6;

      ctx.strokeStyle = i % 2 === 0 ? "#E2E8F0" : "#94A3B8";
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.ellipse(tx, ringY, ringW, ringH, rot, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(tx, ringY, ringW * 0.9, ringH * 0.85, rot + 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (step === 3) {
      drawMiniRetroStar(ctx, tx, ty - 20, 16, "rgba(148, 163, 184, 0.85)");
    }
  } else if (step >= 4) {
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = "rgba(226, 232, 240, 0.35)";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.ellipse(tx, ty - 20 + i * 20, 55 + i * 10, 12, 0, 0, Math.PI * 2);
      ctx.stroke();
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
