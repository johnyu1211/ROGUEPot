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
 * 018 날려버리기 (Whirlwind): Volumetric 3D Cylindrical Spiral Cyclone Funnel
 */
export function drawWhirlwindEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  ctx.save();
  const tx = target.x;
  const ty = target.y - 12;
  const baseY = ty + 38; // Ground platform baseline

  // Config per step:
  let topY = baseY - 60;
  let rBase = 18;
  let rTop = 38;
  let turns = 2.5;
  let globalAlpha = 0.85;
  let spinPhase = (step * Math.PI) / 3;

  if (step === 1) {
    topY = baseY - 70;
    rBase = 16;
    rTop = 42;
    turns = 2.8;
    globalAlpha = 0.80;
    spinPhase = 0.6;
  } else if (step === 2) {
    topY = baseY - 170; // surges way past top of defender
    rBase = 20;
    rTop = 72;
    turns = 4.2;
    globalAlpha = 0.95;
    spinPhase = 2.4;
  } else if (step === 3) {
    topY = baseY - 230; // massive sky funnel roaring past screen top (y < 0)
    rBase = 24;
    rTop = 95;
    turns = 4.8;
    globalAlpha = 0.95;
    spinPhase = 4.2;
  } else if (step >= 4) {
    topY = baseY - 240;
    rBase = 35;
    rTop = 110;
    turns = 3.5;
    globalAlpha = 0.35;
    spinPhase = 5.8;
  }

  // 1. Rotating 3D Ground Cyclone Disc on Platform Floor
  if (step <= 3) {
    ctx.save();
    ctx.globalAlpha = step === 1 ? 0.65 : 0.85;
    ctx.translate(tx, baseY);
    ctx.scale(1.0, 0.28); // 3D flat perspective

    // Ground suction disc
    const discGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, rBase * 1.8);
    discGrad.addColorStop(0, "rgba(255, 255, 255, 0.90)");
    discGrad.addColorStop(0.5, "rgba(224, 242, 254, 0.70)");
    discGrad.addColorStop(1, "rgba(186, 230, 253, 0.0)");
    ctx.fillStyle = discGrad;
    ctx.beginPath();
    ctx.arc(0, 0, rBase * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // 3 Spiral arms sucking in
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.5;
    for (let a = 0; a < 3; a++) {
      const startAngle = (a * (Math.PI * 2)) / 3 + spinPhase * 2;
      ctx.beginPath();
      for (let i = 0; i <= 20; i++) {
        const rad = (i / 20) * rBase * 1.6;
        const ang = startAngle + (i / 20) * 1.8;
        const x = Math.cos(ang) * rad;
        const y = Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // 2. 3D Parametric Spiral Helix Ribbons Generator
  const numStreamers = 3;
  const samples = 60;
  const streams: Array<Array<{ x: number; y: number; z: number; t: number }>> = [];

  for (let s = 0; s < numStreamers; s++) {
    const streamPhase = spinPhase + (s * (Math.PI * 2)) / numStreamers;
    const pts: Array<{ x: number; y: number; z: number; t: number }> = [];

    for (let i = 0; i <= samples; i++) {
      const t = i / samples; // 0 (bottom) to 1 (top)
      const curY = baseY - (baseY - topY) * t;
      const curR = rBase + (rTop - rBase) * Math.pow(t, 1.15);
      const angle = streamPhase + turns * Math.PI * 2 * t;

      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const x = tx + cosA * curR;
      const y = curY + sinA * curR * 0.28; // 3D perspective vertical tilt
      const z = sinA; // z > 0: front facing, z <= 0: back facing

      pts.push({ x, y, z, t });
    }
    streams.push(pts);
  }

  // PASS A: Render Back-side of 3D Helices (z <= 0)
  for (const pts of streams) {
    ctx.save();
    ctx.lineCap = "round";
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      if (p1.z <= 0.1 || p2.z <= 0.1) {
        const segAlpha = globalAlpha * (0.35 + (1 - p1.t) * 0.35);
        ctx.globalAlpha = segAlpha;
        ctx.strokeStyle = "rgba(186, 230, 253, 0.60)";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // PASS B: Volumetric 3D Translucent Funnel Body (Conical Air Core Shading)
  ctx.save();
  ctx.globalAlpha = globalAlpha * 0.40;
  const coneGrad = ctx.createLinearGradient(tx - rTop, 0, tx + rTop, 0);
  coneGrad.addColorStop(0, "rgba(255, 255, 255, 0.60)");
  coneGrad.addColorStop(0.25, "rgba(224, 242, 254, 0.45)");
  coneGrad.addColorStop(0.5, "rgba(186, 230, 253, 0.18)"); // transparent core reveals interior 3D depth!
  coneGrad.addColorStop(0.75, "rgba(224, 242, 254, 0.45)");
  coneGrad.addColorStop(1, "rgba(255, 255, 255, 0.60)");

  ctx.fillStyle = coneGrad;
  ctx.beginPath();
  ctx.moveTo(tx - rBase, baseY);
  ctx.lineTo(tx - rTop, topY);
  ctx.lineTo(tx + rTop, topY);
  ctx.lineTo(tx + rBase, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // PASS C: Render Front-side of 3D Helices (z > 0) with Brilliant Glowing White Rim
  for (const pts of streams) {
    ctx.save();
    ctx.lineCap = "round";
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      if (p1.z > -0.1 && p2.z > -0.1) {
        const segAlpha = globalAlpha * (0.65 + p1.z * 0.35);
        ctx.globalAlpha = segAlpha;

        // Outer sky-blue ribbon glow
        ctx.strokeStyle = "rgba(224, 242, 254, 0.85)";
        ctx.lineWidth = 4.2;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Inner brilliant pure white cutting core
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // 3. Volumetric Floating Air Orbits & Top Starburst
  if (step === 2 || step === 3) {
    drawMiniRetroStar(ctx, tx, ty - 35, step === 2 ? 18 : 24, "#BAE6FD");
    drawMiniRetroStar(ctx, tx, ty - 35, step === 2 ? 10 : 14, "#FFFFFF");
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
