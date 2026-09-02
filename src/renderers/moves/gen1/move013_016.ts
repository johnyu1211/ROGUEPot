import { drawMiniRetroStar } from "../common/helpers.js";

/**
 * 013 칼바람 (Razor Wind): Official Gen 7/8 Authentic 3D Spiral Whirlwind & Razor Cleave Storm
 * All elements rendered with true razor-sharp tapered polygons (tips taper to needle-point 0px).
 * 
 * Step 1: Cyan ground aura + 3D ascending tapered helical wind ribbons wrapping around attacker
 * Step 2: Dense 6-layer tapered helical tornado swirl around attacker + high tapered launch arc to target
 * Step 3: High sweeping arc descends into target + initial razor crescent blades intercept
 * Step 4: Omnidirectional "사사사사삿!" Razor Cleave Storm on defender + double yellow/white center flash stars
 * Step 5: Center impact star & dispersing blade shards
 */
export function drawRazorWindEffect(
  ctx: any,
  startPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  step: number = 1
) {
  ctx.save();
  const sx = startPos.x;
  const sy = startPos.y;
  const tx = targetPos.x;
  const ty = targetPos.y - 12;

  // 1. Tapered Needle-Sharp Crescent Razor Blade Helper (Both ends meet at 0-width sharp points)
  const drawTaperedRazorBlade = (
    cx: number,
    cy: number,
    angle: number,
    length: number = 65,
    curve: number = 18,
    thickness: number = 8.5,
    scale: number = 1.0,
    alpha: number = 1.0
  ) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    const halfL = length / 2;

    // 1A. Outer Glowing Air Wake (Translucent soft sky-blue)
    ctx.fillStyle = "rgba(186, 230, 253, 0.40)";
    ctx.beginPath();
    ctx.moveTo(-halfL, 0);
    ctx.quadraticCurveTo(0, curve * 1.35, halfL, 0);
    ctx.quadraticCurveTo(0, curve * 0.15, -halfL, 0);
    ctx.closePath();
    ctx.fill();

    // 1B. Main Tapered Crescent Blade Body (#BAE6FD / #E0F2FE)
    ctx.fillStyle = "#BAE6FD";
    ctx.beginPath();
    ctx.moveTo(-halfL, 0); // Sharp needle tip left
    ctx.quadraticCurveTo(0, curve, halfL, 0); // Sharp needle tip right
    ctx.quadraticCurveTo(0, curve - thickness, -halfL, 0);
    ctx.closePath();
    ctx.fill();

    // 1C. Razor-Sharp Luminous White Core Crescent (#FFFFFF)
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(-halfL + 4, 0);
    ctx.quadraticCurveTo(0, curve - 1.5, halfL - 4, 0);
    ctx.quadraticCurveTo(0, curve - thickness * 0.55, -halfL + 4, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  // 2. Tapered 3D Helical Wind Ribbon Helper (Tip starts at 0px, swells in center, tapers to 0px at tail)
  const drawTaperedHelicalRibbon = (
    centerX: number,
    centerY: number,
    yOffset: number,
    radiusX: number,
    radiusY: number,
    rotAngle: number,
    startAngle: number,
    endAngle: number,
    maxWidth: number,
    color: string,
    alpha: number
  ) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(centerX, centerY + yOffset);
    ctx.rotate(rotAngle);

    const steps = 24;
    const outerPts: { x: number; y: number }[] = [];
    const innerPts: { x: number; y: number }[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const ang = startAngle + (endAngle - startAngle) * t;
      // Smooth aerodynamic taper: 0 at ends -> maxWidth at center
      const w = maxWidth * Math.pow(Math.sin(t * Math.PI), 0.75);

      const cosA = Math.cos(ang);
      const sinA = Math.sin(ang);

      outerPts.push({
        x: (radiusX + w * 0.5) * cosA,
        y: (radiusY + w * 0.5) * sinA,
      });
      innerPts.push({
        x: (radiusX - w * 0.5) * cosA,
        y: (radiusY - w * 0.5) * sinA,
      });
    }

    // Outer sky-blue tapered ribbon
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(outerPts[0].x, outerPts[0].y);
    for (let i = 1; i <= steps; i++) ctx.lineTo(outerPts[i].x, outerPts[i].y);
    for (let i = steps; i >= 0; i--) ctx.lineTo(innerPts[i].x, innerPts[i].y);
    ctx.closePath();
    ctx.fill();

    // Pure white sharp tapered core
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    const coreMaxW = maxWidth * 0.45;
    const cOuterPts: { x: number; y: number }[] = [];
    const cInnerPts: { x: number; y: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const ang = startAngle + (endAngle - startAngle) * t;
      const w = coreMaxW * Math.pow(Math.sin(t * Math.PI), 0.75);
      cOuterPts.push({ x: (radiusX + w * 0.5) * Math.cos(ang), y: (radiusY + w * 0.5) * Math.sin(ang) });
      cInnerPts.push({ x: (radiusX - w * 0.5) * Math.cos(ang), y: (radiusY - w * 0.5) * Math.sin(ang) });
    }
    ctx.moveTo(cOuterPts[0].x, cOuterPts[0].y);
    for (let i = 1; i <= steps; i++) ctx.lineTo(cOuterPts[i].x, cOuterPts[i].y);
    for (let i = steps; i >= 0; i--) ctx.lineTo(cInnerPts[i].x, cInnerPts[i].y);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  // Helper: Draw tapered razor blade with convex cutting belly facing 100% directly inward toward target center
  const drawTaperedRazorBladeInward = (
    cx: number,
    cy: number,
    length: number = 70,
    curve: number = 18,
    thickness: number = 8.5,
    scale: number = 1.0,
    alpha: number = 1.0
  ) => {
    const targetAngle = Math.atan2(ty - cy, tx - cx);
    const angle = targetAngle - Math.PI / 2;
    drawTaperedRazorBlade(cx, cy, angle, length, Math.abs(curve), thickness, scale, alpha);
  };

  if (step === 1) {
    // Step 1: Initial 3D Tapered Helical Spiral Wrapping around User (Full Opacity)
    const ribbonLayers = [
      { y: 25, rx: 52, ry: 16, rot: -0.15, sA: -Math.PI * 0.85, eA: Math.PI * 0.85, maxW: 6.5, col: "#E0F2FE", a: 0.90 },
      { y: 6, rx: 46, ry: 14, rot: 0.20, sA: -Math.PI * 0.90, eA: Math.PI * 0.90, maxW: 6.0, col: "#BAE6FD", a: 0.85 },
      { y: -14, rx: 42, ry: 13, rot: -0.25, sA: -Math.PI * 0.85, eA: Math.PI * 0.85, maxW: 5.5, col: "#E0F2FE", a: 0.80 },
      { y: -34, rx: 36, ry: 11, rot: 0.15, sA: -Math.PI * 0.80, eA: Math.PI * 0.80, maxW: 5.0, col: "#FFFFFF", a: 0.75 },
    ];
    for (const r of ribbonLayers) {
      drawTaperedHelicalRibbon(sx, sy, r.y, r.rx, r.ry, r.rot, r.sA, r.eA, r.maxW, r.col, r.a);
    }
  } else if (step === 2) {
    // Step 2: High-Speed Swirl at User Dissolving & Fading Out into the Air (Fade-out Alpha)
    const ribbonLayers = [
      { y: 30, rx: 58, ry: 18, rot: 0.35, sA: -Math.PI * 0.90, eA: Math.PI * 0.90, maxW: 7.0, col: "#BAE6FD", a: 0.45 },
      { y: 14, rx: 52, ry: 16, rot: -0.40, sA: -Math.PI * 0.92, eA: Math.PI * 0.92, maxW: 6.5, col: "#E0F2FE", a: 0.40 },
      { y: -2, rx: 48, ry: 15, rot: 0.45, sA: -Math.PI * 0.90, eA: Math.PI * 0.90, maxW: 6.0, col: "#BAE6FD", a: 0.40 },
      { y: -18, rx: 44, ry: 14, rot: -0.35, sA: -Math.PI * 0.88, eA: Math.PI * 0.88, maxW: 5.5, col: "#FFFFFF", a: 0.35 },
      { y: -36, rx: 40, ry: 12, rot: 0.40, sA: -Math.PI * 0.85, eA: Math.PI * 0.85, maxW: 5.0, col: "#E0F2FE", a: 0.30 },
      { y: -54, rx: 34, ry: 10, rot: -0.30, sA: -Math.PI * 0.80, eA: Math.PI * 0.80, maxW: 4.5, col: "#FFFFFF", a: 0.25 },
    ];
    for (const r of ribbonLayers) {
      drawTaperedHelicalRibbon(sx, sy, r.y, r.rx, r.ry, r.rot, r.sA, r.eA, r.maxW, r.col, r.a);
    }
  } else if (step === 3) {
    // Step 3: First Symmetrical Diagonal Pair Inception (Upper-Left <-> Lower-Right, Faint Alpha, Facing Inward)
    const earlyPair = [
      { cx: tx - 46, cy: ty - 32, len: 64, curve: 16, thick: 7.5, a: 0.45 },
      { cx: tx + 46, cy: ty + 32, len: 64, curve: 16, thick: 7.5, a: 0.45 },
    ];
    for (const b of earlyPair) {
      drawTaperedRazorBladeInward(b.cx, b.cy, b.len, b.curve, b.thick, 1.0, b.a);
    }
  } else if (step === 4) {
    // Step 4: Clean Symmetrical X-Cross Convergence (4 Blades Facing Inward, Semi-Opaque)
    const crossBlades = [
      // Diagonal Pair 1: Upper-Left <-> Lower-Right (Slicing Inward)
      { cx: tx - 24, cy: ty - 18, len: 70, curve: 18, thick: 8.5, a: 0.85 },
      { cx: tx + 24, cy: ty + 18, len: 70, curve: 18, thick: 8.5, a: 0.85 },
      // Diagonal Pair 2: Upper-Right <-> Lower-Left (Joining the Cross, Facing Inward)
      { cx: tx + 38, cy: ty - 26, len: 68, curve: 18, thick: 8.0, a: 0.70 },
      { cx: tx - 38, cy: ty + 26, len: 68, curve: 18, thick: 8.0, a: 0.70 },
    ];
    for (const b of crossBlades) {
      drawTaperedRazorBladeInward(b.cx, b.cy, b.len, b.curve, b.thick, 1.0, b.a);
    }
  } else if (step === 5) {
    // Step 5: Climax Crisp Symmetrical X-Cross Cleave (100% Solid, All Blades Facing Inward)
    const climaxCross = [
      { cx: tx - 14, cy: ty - 10, len: 78, curve: 20, thick: 9.5, s: 1.1 },
      { cx: tx + 14, cy: ty + 10, len: 78, curve: 20, thick: 9.5, s: 1.1 },
      { cx: tx + 14, cy: ty - 10, len: 78, curve: 20, thick: 9.5, s: 1.1 },
      { cx: tx - 14, cy: ty + 10, len: 78, curve: 20, thick: 9.5, s: 1.1 },
    ];

    for (const b of climaxCross) {
      drawTaperedRazorBladeInward(b.cx, b.cy, b.len, b.curve, b.thick, b.s, 1.0);
    }

    // 4 Clean Diagonal Tapered Needle Glints
    const glints = [
      { ox: -24, oy: -18, ex: -56, ey: -42 },
      { ox: 24, oy: -18, ex: 56, ey: -42 },
      { ox: -24, oy: 18, ex: -56, ey: 42 },
      { ox: 24, oy: 18, ex: 56, ey: 42 },
    ];
    for (const st of glints) {
      const dx = st.ex - st.ox;
      const dy = st.ey - st.oy;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.moveTo(tx + st.ox + nx * 1.8, ty + st.oy + ny * 1.8);
      ctx.lineTo(tx + st.ex, ty + st.ey);
      ctx.lineTo(tx + st.ox - nx * 1.8, ty + st.oy - ny * 1.8);
      ctx.closePath();
      ctx.fill();
    }
  } else if (step >= 6) {
    // Step 6: Symmetrical Fade-Out Dispersal
    const shards = [
      { cx: tx - 44, cy: ty - 32, len: 48, curve: 14, thick: 5.5, a: 0.20 },
      { cx: tx + 44, cy: ty + 32, len: 48, curve: 14, thick: 5.5, a: 0.20 },
      { cx: tx + 44, cy: ty - 32, len: 48, curve: 14, thick: 5.5, a: 0.20 },
      { cx: tx - 44, cy: ty + 32, len: 48, curve: 14, thick: 5.5, a: 0.20 },
    ];
    for (const sh of shards) {
      drawTaperedRazorBladeInward(sh.cx, sh.cy, sh.len, sh.curve, sh.thick, 0.85, sh.a);
    }
  }

  ctx.restore();
}

/**
 * 014 칼춤 (Swords Dance): 3D Ascending Monochromatic Sword Orbit & Apex Tip-Touching Clash
 * 
 * Step 1: 4 Thin monochromatic swords in a 3D elliptical orbit around Pokémon waist
 * Step 2: 4 Swords ascending in a fast 3D helical orbit while tilting inward
 * Step 3: Apex Convergence: All 4 sword tips touch together at ONE point above the head + ATK UP clash
 * Step 4: Swords burst outwards with ascending power aura sparks
 */
export function drawSwordsDanceEffect(ctx: any, userPos: { x: number; y: number }, step: number = 1) {
  ctx.save();
  const ux = userPos.x;
  const uy = userPos.y - 10;

  // Sleek Thin Monochromatic Solid Sword Helper
  const drawThinSolidSword = (
    cx: number,
    cy: number,
    rot: number,
    scale: number = 1.0,
    alpha: number = 1.0,
    color: string = "#FFFFFF",
    strokeColor: string = "#EF4444"
  ) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    // 1. Sleek Thin Blade (Needle-sharp tip at (0, -34))
    ctx.fillStyle = color;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -34); // Needle point
    ctx.lineTo(2.4, -26);
    ctx.lineTo(2.2, 4);
    ctx.lineTo(-2.2, 4);
    ctx.lineTo(-2.4, -26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Center Spine
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(0, 4);
    ctx.stroke();

    // 3. Slim Monochromatic Crossguard
    ctx.fillStyle = color;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.rect(-6, 4, 12, 2.2);
    ctx.fill();
    ctx.stroke();

    // 4. Slim Handle & Diamond Pommel
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.rect(-1.2, 6.2, 2.4, 5.5);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 11.7);
    ctx.lineTo(2.2, 13.5);
    ctx.lineTo(0, 15.3);
    ctx.lineTo(-2.2, 13.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  };

  interface Sword3D {
    x: number;
    y: number;
    depth: number;
    rot: number;
    scale: number;
    alpha: number;
  }

  if (step === 1) {
    // Step 1: 4 Swords in 3D Elliptical Orbit around Waist (z = +14)
    const count = 4;
    const rx = 44;
    const ry = 15;
    const zOffset = 14;
    const basePhase = 0.25;

    const swords: Sword3D[] = [];
    for (let i = 0; i < count; i++) {
      const angle = basePhase + (i * 2 * Math.PI) / count;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const x = ux + cosA * rx;
      const y = uy + zOffset + sinA * ry;
      const depth = sinA; // -1 (back) to +1 (front)
      const scale = 0.80 + 0.30 * (depth + 1) * 0.5;
      const alpha = 0.55 + 0.45 * (depth + 1) * 0.5;
      const rot = cosA * 0.20; // Subtle inward tilt
      swords.push({ x, y, depth, rot, scale, alpha });
    }

    swords.sort((a, b) => a.depth - b.depth);
    for (const s of swords) {
      drawThinSolidSword(s.x, s.y, s.rot, s.scale, s.alpha);
    }
  } else if (step === 2) {
    // Step 2: 4 Swords Ascending in 3D Helical Orbit toward Head (z = -12, Fast Spin)
    const count = 4;
    const rx = 36;
    const ry = 12;
    const zOffset = -12;
    const basePhase = 1.65;

    const swords: Sword3D[] = [];
    for (let i = 0; i < count; i++) {
      const angle = basePhase + (i * 2 * Math.PI) / count;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const x = ux + cosA * rx;
      const y = uy + zOffset + sinA * ry;
      const depth = sinA;
      const scale = 0.85 + 0.35 * (depth + 1) * 0.5;
      const alpha = 0.65 + 0.35 * (depth + 1) * 0.5;
      const rot = cosA * 0.45; // Inward angle pointing up toward apex
      swords.push({ x, y, depth, rot, scale, alpha });
    }

    // Soft ascending red aura
    ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
    ctx.beginPath();
    ctx.ellipse(ux, uy - 15, 42, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    swords.sort((a, b) => a.depth - b.depth);
    for (const s of swords) {
      drawThinSolidSword(s.x, s.y, s.rot, s.scale, s.alpha);
    }
  } else if (step === 3) {
    // Step 3: Apex Convergence - All 4 Sword Tips touch together at ONE Point above the head!
    const apexX = ux;
    const apexY = uy - 48; // Apex point where all tips meet

    // When sword is drawn at (cx, cy) rotated by rot with scale:
    // Its tip is at cx + sin(rot)*34*scale, cy - cos(rot)*34*scale
    // So to make tip meet exactly at (apexX, apexY):
    // cx = apexX - sin(rot)*34*scale, cy = apexY + cos(rot)*34*scale

    // Left Sword (Tilted right ~38 deg)
    const rotL = Math.PI * 0.21;
    const scaleL = 1.15;
    const cxL = apexX - Math.sin(rotL) * 34 * scaleL;
    const cyL = apexY + Math.cos(rotL) * 34 * scaleL;
    drawThinSolidSword(cxL, cyL, rotL, scaleL, 1.0);

    // Right Sword (Tilted left ~38 deg)
    const rotR = -Math.PI * 0.21;
    const scaleR = 1.15;
    const cxR = apexX - Math.sin(rotR) * 34 * scaleR;
    const cyR = apexY + Math.cos(rotR) * 34 * scaleR;
    drawThinSolidSword(cxR, cyR, rotR, scaleR, 1.0);

    // Back Depth Sword (Slightly smaller, pointing straight up)
    const scaleB = 0.90;
    const cyB = apexY + 34 * scaleB;
    drawThinSolidSword(apexX, cyB + 4, 0, scaleB, 0.85);

    // Front Depth Sword (Larger, pointing straight up)
    const scaleF = 1.25;
    const cyF = apexY + 34 * scaleF;
    drawThinSolidSword(apexX, cyF - 2, 0, scaleF, 1.0);

    // Clash flash & impact spark at the touching tip apex
    drawMiniRetroStar(ctx, apexX, apexY, 22, "#FACC15");
    drawMiniRetroStar(ctx, apexX, apexY, 12, "#FFFFFF");

    // Attack Up Text
    ctx.fillStyle = "#EF4444";
    ctx.font = "bold 16px DungGeunMo";
    ctx.textAlign = "center";
    ctx.fillText("▲ ATK UP", ux, uy - 68);
  } else if (step >= 4) {
    // Step 4: Swords Burst Outwards & Power Aura Sparks Rise
    const offsets = [
      { ox: -36, oy: -52, rot: -0.45 },
      { ox: 36, oy: -52, rot: 0.45 },
      { ox: -48, oy: -20, rot: -0.80 },
      { ox: 48, oy: -20, rot: 0.80 },
    ];
    for (const o of offsets) {
      drawThinSolidSword(ux + o.ox, uy + o.oy, o.rot, 1.0, 0.35);
    }

    const sparks = [
      { ox: -20, oy: -45, r: 3.5, c: "#EF4444" },
      { ox: 20, oy: -48, r: 3.5, c: "#F59E0B" },
      { ox: 0, oy: -58, r: 4.2, c: "#FFFFFF" },
    ];
    for (const sp of sparks) {
      ctx.fillStyle = sp.c;
      ctx.beginPath();
      ctx.arc(ux + sp.ox, uy + sp.oy, sp.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * 015 풀베기 (Cut): Razor-Sharp Luminous Blade Slash with Severed Flying Leaves
 */
export function drawCutEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  ctx.save();
  const tx = target.x;
  const ty = target.y - 12;

  const drawLeaf = (lx: number, ly: number, rot: number, size: number) => {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(rot);
    ctx.fillStyle = "#22C55E";
    ctx.strokeStyle = "#15803D";
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(size * 0.7, 0, 0, size);
    ctx.quadraticCurveTo(-size * 0.7, 0, 0, -size);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  if (step === 1) {
    ctx.strokeStyle = "rgba(134, 239, 172, 0.45)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tx - 38, ty - 38);
    ctx.lineTo(tx + 38, ty + 38);
    ctx.stroke();
  } else if (step === 2) {
    ctx.strokeStyle = "#22C55E";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(tx - 48, ty - 48);
    ctx.lineTo(tx + 48, ty + 48);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(tx - 42, ty - 42);
    ctx.lineTo(tx + 42, ty + 42);
    ctx.stroke();

    drawLeaf(tx - 24, ty + 12, 0.4, 8);
    drawLeaf(tx + 26, ty - 18, -0.6, 9);
    drawLeaf(tx + 12, ty + 24, 1.2, 7);
  } else if (step === 3) {
    drawMiniRetroStar(ctx, tx, ty, 16, "#22C55E");
    drawMiniRetroStar(ctx, tx, ty, 8, "#FFFFFF");

    drawLeaf(tx - 36, ty + 20, 0.8, 8);
    drawLeaf(tx + 40, ty - 26, -0.9, 9);
    drawLeaf(tx - 18, ty - 32, 1.5, 7);
    drawLeaf(tx + 28, ty + 30, -1.2, 8);
  } else if (step >= 4) {
    drawLeaf(tx - 44, ty + 32, 1.1, 7);
    drawLeaf(tx + 48, ty + 24, -1.4, 8);
  }

  ctx.restore();
}

/**
 * 016 바람일으키기 (Gust): Rapid Aerodynamic Swirling Wind Streams
 */
export function drawGustEffect(ctx: any, start: { x: number; y: number }, target: { x: number; y: number }, step: number = 1) {
  ctx.save();
  const tx = target.x;
  const ty = target.y - 12;

  const drawWindStream = (sx: number, sy: number, ex: number, ey: number, curvature: number, alpha: number) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#E0F2FE";
    ctx.lineWidth = 4.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    const mx = (sx + ex) / 2 + curvature;
    const my = (sy + ey) / 2 - 14;
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();
    ctx.restore();
  };

  if (step === 1) {
    drawWindStream(start.x + 20, start.y - 10, (start.x + tx) / 2, (start.y + ty) / 2, -18, 0.65);
  } else if (step === 2) {
    drawWindStream(start.x + 30, start.y - 24, tx - 10, ty - 20, -26, 0.95);
    drawWindStream(start.x + 20, start.y, tx, ty, 0, 0.95);
    drawWindStream(start.x + 30, start.y + 24, tx - 10, ty + 20, 26, 0.95);
  } else if (step === 3) {
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = i % 2 === 0 ? "#F0F9FF" : "#BAE6FD";
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.ellipse(tx, ty - 8 + i * 8, 36 - i * 4, 12, (i * Math.PI) / 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    drawMiniRetroStar(ctx, tx, ty, 14, "#E0F2FE");
    drawMiniRetroStar(ctx, tx, ty, 7, "#FFFFFF");
  } else if (step >= 4) {
    const sparkles = [
      { ox: -24, oy: -20, r: 2.8 },
      { ox: 22, oy: -16, r: 3.2 },
      { ox: -12, oy: 18, r: 2.5 },
      { ox: 16, oy: 22, r: 2.8 },
    ];
    for (const sp of sparkles) {
      ctx.fillStyle = "#F0F9FF";
      ctx.beginPath();
      ctx.arc(tx + sp.ox, ty + sp.oy, sp.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
