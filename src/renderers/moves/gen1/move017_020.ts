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
    globalAlpha = 0.55;
    spinPhase = 0.6;
  } else if (step === 2) {
    topY = baseY - 170; // surges way past top of defender
    rBase = 20;
    rTop = 72;
    turns = 4.2;
    globalAlpha = 0.65;
    spinPhase = 2.4;
  } else if (step === 3) {
    topY = baseY - 230; // massive sky funnel roaring past screen top (y < 0)
    rBase = 24;
    rTop = 95;
    turns = 4.8;
    globalAlpha = 0.68;
    spinPhase = 4.2;
  } else if (step >= 4) {
    topY = baseY - 240;
    rBase = 35;
    rTop = 110;
    turns = 3.5;
    globalAlpha = 0.22;
    spinPhase = 5.8;
  }

  // 1. Rotating 3D Ground Cyclone Disc on Platform Floor
  if (step <= 3) {
    ctx.save();
    ctx.globalAlpha = step === 1 ? 0.45 : 0.60;
    ctx.translate(tx, baseY);
    ctx.scale(1.0, 0.28); // 3D flat perspective

    // Ground suction disc
    const discGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, rBase * 1.8);
    discGrad.addColorStop(0, "rgba(255, 255, 255, 0.75)");
    discGrad.addColorStop(0.5, "rgba(224, 242, 254, 0.50)");
    discGrad.addColorStop(1, "rgba(186, 230, 253, 0.0)");
    ctx.fillStyle = discGrad;
    ctx.beginPath();
    ctx.arc(0, 0, rBase * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // 3 Spiral arms sucking in
    ctx.strokeStyle = "rgba(255, 255, 255, 0.80)";
    ctx.lineWidth = 2.2;
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

  // PASS A: Render Back-side of 3D Helices (z <= 0) - Soft sheer air ribbons wrapping behind
  for (const pts of streams) {
    ctx.save();
    ctx.lineCap = "round";
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      if (p1.z <= 0.15 || p2.z <= 0.15) {
        const segAlpha = globalAlpha * (0.20 + (1 - p1.t) * 0.20);
        ctx.globalAlpha = segAlpha;

        // Wide soft back-swath
        ctx.strokeStyle = "rgba(186, 230, 253, 0.25)";
        ctx.lineWidth = 9.0 + p1.t * 7.0; // 9px at base to 16px at top
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Inner soft highlight
        ctx.strokeStyle = "rgba(224, 242, 254, 0.35)";
        ctx.lineWidth = 3.5 + p1.t * 2.5;
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
  ctx.globalAlpha = globalAlpha * 0.22;
  const coneGrad = ctx.createLinearGradient(tx - rTop, 0, tx + rTop, 0);
  coneGrad.addColorStop(0, "rgba(255, 255, 255, 0.45)");
  coneGrad.addColorStop(0.25, "rgba(224, 242, 254, 0.28)");
  coneGrad.addColorStop(0.5, "rgba(186, 230, 253, 0.08)"); // hollow transparent core gives true 3D cylinder depth
  coneGrad.addColorStop(0.75, "rgba(224, 242, 254, 0.28)");
  coneGrad.addColorStop(1, "rgba(255, 255, 255, 0.45)");

  ctx.fillStyle = coneGrad;
  ctx.beginPath();
  ctx.moveTo(tx - rBase, baseY);
  ctx.lineTo(tx - rTop, topY);
  ctx.lineTo(tx + rTop, topY);
  ctx.lineTo(tx + rBase, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // PASS C: Render Front-side of 3D Helices (z > 0) with Sheer Luminous Wind Bands
  for (const pts of streams) {
    ctx.save();
    ctx.lineCap = "round";
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      if (p1.z > -0.15 && p2.z > -0.15) {
        const segAlpha = globalAlpha * (0.42 + p1.z * 0.30);
        ctx.globalAlpha = segAlpha;

        // 1. Broad outer sheer wind swath (14px to 22px wide)
        ctx.strokeStyle = "rgba(224, 242, 254, 0.35)";
        ctx.lineWidth = 14.0 + p1.t * 8.0;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // 2. Medium bright translucent body (7px to 11px wide)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.50)";
        ctx.lineWidth = 7.0 + p1.t * 4.0;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // 3. Center highlight filament (2.5px to 3.5px wide)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = 2.5 + p1.t * 1.0;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 019 공중날기 (Fly): High-Speed Sky Launch & Supersonic Diagonal Dive-Bomb Crater Impact
 */
export function drawFlyEffect(ctx: any, start: { x: number; y: number }, target: { x: number; y: number }, step: number = 1) {
  ctx.save();
  const tx = target.x;
  const ty = target.y - 12;
  const isTargetEnemy = tx > start.x; // true if player attacking enemy (dive angled from upper-left to bottom-right)
  const dirSign = isTargetEnemy ? 1 : -1;

  if (step === 1) {
    // Step 1: Upward Rocket Launch Speed Lines & Ground Wind Burst
    ctx.fillStyle = "rgba(224, 242, 254, 0.35)";
    ctx.beginPath();
    ctx.ellipse(start.x, start.y + 20, 38, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rocket ascension trails
    for (let i = -3; i <= 3; i++) {
      ctx.strokeStyle = i === 0 ? "rgba(255, 255, 255, 0.95)" : "rgba(186, 230, 253, 0.70)";
      ctx.lineWidth = i === 0 ? 3.5 : 2.0;
      ctx.beginPath();
      ctx.moveTo(start.x + i * 12, start.y + 24);
      ctx.lineTo(start.x + i * 12, start.y - 140);
      ctx.stroke();
    }

    // Expanding vapor cone at liftoff
    ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(start.x, start.y - 40, 24, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (step === 2) {
    // Step 2: High Sky Diagonal Dive-Bomb Sonic Trails & Target Lock
    // Target Lock Reticle on Ground Platform
    ctx.fillStyle = "rgba(15, 23, 42, 0.45)";
    ctx.beginPath();
    ctx.ellipse(tx, ty + 24, 38, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // High-Altitude Cloud Breakthrough Sonic Rings
    const cloudApexX = tx - dirSign * 90;
    const cloudApexY = -40;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(cloudApexX, cloudApexY + 20, 32, 10, dirSign * 0.45, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(186, 230, 253, 0.60)";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(cloudApexX, cloudApexY + 20, 48, 14, dirSign * 0.45, 0, Math.PI * 2);
    ctx.stroke();

    // Stream of Diagonal Supersonic Speedlines cutting down from high sky!
    for (let i = -3; i <= 3; i++) {
      const offset = i * 14;
      const startX = tx - dirSign * (110 + offset * 0.6);
      const startY = -60 + offset * 0.3;
      const endX = tx + offset * 0.8;
      const endY = ty - 10 + offset * 0.4;

      ctx.strokeStyle = i === 0 ? "rgba(255, 255, 255, 0.95)" : "rgba(186, 230, 253, 0.75)";
      ctx.lineWidth = i === 0 ? 4.5 : 2.5;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  } else if (step === 3) {
    // Step 3: Massive Supersonic Dive-Bomb Crater Slam & Multi-layer Blast Rings
    // 1. Diagonal Sonic Blast Column
    const blastStartX = tx - dirSign * 80;
    const blastStartY = -50;

    // Outer luminous blast sheath
    ctx.strokeStyle = "rgba(186, 230, 253, 0.55)";
    ctx.lineWidth = 26;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(blastStartX, blastStartY);
    ctx.lineTo(tx, ty + 14);
    ctx.stroke();

    // Inner bright core
    ctx.strokeStyle = "#BAE6FD";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(blastStartX, blastStartY);
    ctx.lineTo(tx, ty + 14);
    ctx.stroke();

    // Pure white center laser streak
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(blastStartX, blastStartY);
    ctx.lineTo(tx, ty + 14);
    ctx.stroke();

    // 2. Explosive Ground Crater Shockwaves
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.ellipse(tx, ty + 20, 52, 16, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(186, 230, 253, 0.85)";
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.ellipse(tx, ty + 20, 78, 24, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Flying Impact Earth Debris Particles
    const debris = [
      { dx: -38, dy: -24, r: 3.5 },
      { dx: -22, dy: -46, r: 4.2 },
      { dx: 18, dy: -52, r: 4.0 },
      { dx: 36, dy: -28, r: 3.8 },
      { dx: -54, dy: 6, r: 3.0 },
      { dx: 52, dy: 8, r: 3.2 },
    ];
    ctx.fillStyle = "#FFFFFF";
    for (const d of debris) {
      ctx.beginPath();
      ctx.arc(tx + d.dx, ty + 16 + d.dy, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (step >= 4) {
    // Step 4: Radial shockwave dispersal & dissipating ground dust
    ctx.strokeStyle = "rgba(224, 242, 254, 0.45)";
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.ellipse(tx, ty + 20, 88, 28, 0, 0, Math.PI * 2);
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
