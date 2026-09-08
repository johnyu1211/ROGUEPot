import { drawMiniRetroStar } from "../common/helpers.js";

/**
 * Gen 1 Moves: 029 to 032 Visual Effects Renderers
 * 
 * 029: 박치기 (Headbutt) - Powerful physical impact shockwave and retro stars (same motion as Tackle)
 * 030: 뿔찌르기 (Horn Attack) - Yellowish sharp horn charge, dramatic frontal stop, pierce-through, and bottom-left return
 * 031: 마구 찌르기 (Fury Attack) - Step forward, continuous barrage of 3 parallel horn cones streaking & striking
 * 032: 뿔드릴 (Horn Drill) - High-speed spinning drill vortex charge, solid black execution freeze with pure white victim silhouette,
 *                           drilled hole (black circle) covering middle-upper torso, caster turned facing camera, and black fadeout
 */

/**
 * 029: 박치기 (Headbutt) Visual Effect
 */
export function drawHeadbuttEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    em: { x: number; y: number; size: number };
    pm: { x: number; y: number; size: number };
    [key: string]: any;
  }
) {
  const { targetPos, isHit } = drawCtx;
  if (!isHit) return;

  const cx = targetPos.x;
  const cy = targetPos.y;
  const step = frame.moveStep || 2;

  ctx.save();

  if (step === 2) {
    // Physical Impact Burst: concentric shockwave rings & retro stars
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(254, 240, 138, 0.75)";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(cx, cy, 40, 0, Math.PI * 2);
    ctx.stroke();

    // 4-Point Impact Stars
    const starOffsets = [
      { x: -28, y: -22, size: 8, color: "#FEF08A" },
      { x: 30, y: -18, size: 10, color: "#FFFFFF" },
      { x: -24, y: 24, size: 7, color: "#FFFFFF" },
      { x: 26, y: 22, size: 9, color: "#FEF08A" },
    ];
    for (const s of starOffsets) {
      drawMiniRetroStar(ctx, cx + s.x, cy + s.y, s.size, s.color);
    }
  }

  ctx.restore();
}

/**
 * Helper: Draw a sleek yellowish cone horn with rounded base
 */
export function drawYellowSharpHorn(
  ctx: any,
  x: number,
  y: number,
  angle: number,
  scale: number = 1.0,
  alpha: number = 1.0,
  showGlint: boolean = false
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;

  const length = 52 * scale;
  const baseRadius = 16 * scale; // Solid, full-sized cone width (32px total diameter)

  // 1. Outer Dark Contour (Sleek cone with smoothly rounded base)
  ctx.beginPath();
  ctx.moveTo(length, 0); // Sharp Tip
  ctx.lineTo(0, -baseRadius); // Upper straight cone flank
  // Rounded base (아래쪽 / 바닥 둥글게)
  ctx.quadraticCurveTo(-9 * scale, 0, 0, baseRadius);
  ctx.lineTo(length, 0); // Lower straight cone flank
  ctx.closePath();
  ctx.fillStyle = "#78350F"; // Dark Amber border
  ctx.fill();

  // 2. Inner Conical Body Fill with 3D cylindrical lighting (Natural Ivory Palette)
  const bodyGrad = ctx.createLinearGradient(0, -baseRadius, 0, baseRadius);
  bodyGrad.addColorStop(0.0, "#FAF7EE"); // Soft ivory rim light
  bodyGrad.addColorStop(0.20, "#FFFFFF"); // Gleaming specular sheen
  bodyGrad.addColorStop(0.48, "#F4EBD9"); // Natural rich ivory cream
  bodyGrad.addColorStop(0.78, "#DECDB0"); // Soft bone shading
  bodyGrad.addColorStop(1.0, "#A89878"); // Natural bone shadow on bottom flank

  ctx.beginPath();
  ctx.moveTo(length - 2, 0);
  ctx.lineTo(1.5, -baseRadius + 2);
  ctx.quadraticCurveTo(-7 * scale, 0, 1.5, baseRadius - 2);
  ctx.lineTo(length - 2, 0);
  ctx.closePath();
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // 3. Central Specular Highlight Streak along the cone axis
  const sheenGrad = ctx.createLinearGradient(0, 0, length, 0);
  sheenGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.2)");
  sheenGrad.addColorStop(0.65, "rgba(255, 255, 255, 0.85)");
  sheenGrad.addColorStop(1.0, "#FFFFFF");

  ctx.strokeStyle = sheenGrad;
  ctx.lineWidth = 2.2 * scale;
  ctx.beginPath();
  ctx.moveTo(2, -baseRadius * 0.25);
  ctx.lineTo(length - 2, 0);
  ctx.stroke();

  // 4. Glint on the sharp cone tip
  if (showGlint) {
    ctx.fillStyle = "#FFFFFF";
    drawMiniRetroStar(ctx, length + 2, 0, 9 * scale, "#FFFFFF");
    drawMiniRetroStar(ctx, length + 2, 0, 5 * scale, "#F5EFEB");
  }

  ctx.restore();
}

/**
 * Helper: Draw an interlocking figure-8 rotating trail behind the horn with transparent fading tail
 * Expanded wide to match the full horn size with generous loop spacing!
 */
function drawFigure8SpinTrail(
  ctx: any,
  headX: number,
  headY: number,
  angle: number,
  trailLength: number = 150,
  amplitude: number = 22,
  alpha: number = 1.0
) {
  ctx.save();
  ctx.translate(headX, headY);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;

  const steps = 52;
  const numLoops = 1.65; // Spacious, well-proportioned figure-8 cycles (not clustered)

  // Gradients fading completely to transparent (alpha 0.0) at the end of the tail (-trailLength)
  const gradA = ctx.createLinearGradient(0, 0, -trailLength, 0);
  gradA.addColorStop(0.0, "rgba(255, 255, 255, 0.95)");
  gradA.addColorStop(0.20, "rgba(254, 240, 138, 0.88)");
  gradA.addColorStop(0.60, "rgba(234, 179, 8, 0.45)");
  gradA.addColorStop(1.0, "rgba(234, 179, 8, 0.0)"); // Tail completely transparent!

  const gradB = ctx.createLinearGradient(0, 0, -trailLength, 0);
  gradB.addColorStop(0.0, "rgba(254, 240, 138, 0.95)");
  gradB.addColorStop(0.20, "rgba(253, 224, 71, 0.85)");
  gradB.addColorStop(0.60, "rgba(202, 138, 4, 0.40)");
  gradB.addColorStop(1.0, "rgba(202, 138, 4, 0.0)"); // Tail completely transparent!

  // Figure-8 Strand 1 (Positive Sine Wave, as wide as horn size!)
  ctx.strokeStyle = gradA;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const frac = i / steps;
    const x = -frac * trailLength;
    // Envelope: wide from horn base, maintaining full width, smoothly tapering to zero at tail
    const envelope = Math.sin(Math.PI * (1 - frac * 0.82));
    const y = Math.sin(frac * numLoops * Math.PI * 2) * amplitude * envelope;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Figure-8 Strand 2 (Opposite Phase, crossing over at nodes to form majestic interlocking '8' loops)
  ctx.strokeStyle = gradB;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const frac = i / steps;
    const x = -frac * trailLength;
    const envelope = Math.sin(Math.PI * (1 - frac * 0.82));
    const y = -Math.sin(frac * numLoops * Math.PI * 2) * amplitude * envelope;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Subtle central aerodynamic speed streak
  const coreGrad = ctx.createLinearGradient(0, 0, -trailLength * 0.7, 0);
  coreGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.80)");
  coreGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");
  ctx.strokeStyle = coreGrad;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-trailLength * 0.7, 0);
  ctx.stroke();

  ctx.restore();
}

/**
 * 030: 뿔찌르기 (Horn Attack) Visual Effect
 */
export function drawHornAttackEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    em: { x: number; y: number; size: number };
    pm: { x: number; y: number; size: number };
    [key: string]: any;
  }
) {
  const { targetPos, attackerPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep || 1;

  // Direction angle from attacker towards target
  const angle = isP ? -0.46 : 2.68; // -26 degrees for player, +154 degrees for enemy

  ctx.save();

  if (step === 1) {
    // 1. Horn appears in front of caster with glowing energy aura
    const hornX = attackerPos.x + (isP ? 42 : -42);
    const hornY = attackerPos.y + (isP ? -18 : 18);
    drawYellowSharpHorn(ctx, hornX, hornY, angle, 1.05, 0.95, true);

    // Energy sparkles
    drawMiniRetroStar(ctx, hornX - 12, hornY - 14, 5, "#FEF08A");
    drawMiniRetroStar(ctx, hornX + 10, hornY + 12, 4, "#FFFFFF");
  } else if (step === 2) {
    // 2. Rapid charge towards target with broad figure-8 trail (as wide as horn!)
    const currentAttackerX = attackerPos.x + (frame.pOffset?.x || frame.eOffset?.x || 0);
    const currentAttackerY = attackerPos.y + (frame.pOffset?.y || frame.eOffset?.y || 0);
    const hornX = currentAttackerX + (isP ? 46 : -46);
    const hornY = currentAttackerY + (isP ? -20 : 20);

    // Dynamic 8-loop rotating afterimage trail: expansive length 150px, amplitude 22px (full horn width)
    drawFigure8SpinTrail(ctx, hornX, hornY, angle, 150, 22, 0.95);

    drawYellowSharpHorn(ctx, hornX, hornY, angle, 1.15, 1.0, false);
  } else if (step === 3) {
    // 3. Pause right in front of target with intense tip glint and settling 8-trail
    const currentAttackerX = attackerPos.x + (frame.pOffset?.x || frame.eOffset?.x || 0);
    const currentAttackerY = attackerPos.y + (frame.pOffset?.y || frame.eOffset?.y || 0);
    const hornX = currentAttackerX + (isP ? 46 : -46);
    const hornY = currentAttackerY + (isP ? -20 : 20);

    // Settling 8-loop aura behind horn: amplitude 18px
    drawFigure8SpinTrail(ctx, hornX, hornY, angle, 90, 18, 0.70);

    drawYellowSharpHorn(ctx, hornX, hornY, angle, 1.25, 1.0, true);

    // Tension shockwave ring at tip
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(hornX + (isP ? 52 : -52), hornY + (isP ? -24 : 24), 13, 0, Math.PI * 2);
    ctx.stroke();
  } else if (step === 4) {
    // 4. Pierces clean through target! Extended golden streak with BOTH ENDS TRANSPARENT
    const tx = targetPos.x;
    const ty = targetPos.y;

    // Extended pierce line: length 210px (nicely longer as requested!)
    const streakLength = 210;
    const halfLen = streakLength / 2;
    const dx = Math.cos(angle) * halfLen;
    const dy = Math.sin(angle) * halfLen;

    const x1 = tx - dx;
    const y1 = ty - dy;
    const x2 = tx + dx;
    const y2 = ty + dy;

    // 1. Broad outer golden streak with BOTH ENDS COMPLETELY TRANSPARENT (alpha 0.0)
    const outerGrad = ctx.createLinearGradient(x1, y1, x2, y2);
    outerGrad.addColorStop(0.0, "rgba(254, 240, 138, 0.0)"); // Tip 1: 100% transparent
    outerGrad.addColorStop(0.18, "rgba(254, 240, 138, 0.85)");
    outerGrad.addColorStop(0.50, "rgba(255, 255, 255, 1.0)"); // Gleaming pure white cut in center
    outerGrad.addColorStop(0.82, "rgba(254, 240, 138, 0.85)");
    outerGrad.addColorStop(1.0, "rgba(254, 240, 138, 0.0)"); // Tip 2: 100% transparent

    ctx.strokeStyle = outerGrad;
    ctx.lineWidth = 7.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // 2. Sharp intense white core cut with transparent ends
    const coreGrad = ctx.createLinearGradient(x1, y1, x2, y2);
    coreGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
    coreGrad.addColorStop(0.25, "rgba(255, 255, 255, 0.95)");
    coreGrad.addColorStop(0.75, "rgba(255, 255, 255, 0.95)");
    coreGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

    ctx.strokeStyle = coreGrad;
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Puncture impact ring
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(tx, ty, 32, 0, Math.PI * 2);
    ctx.stroke();

    // Piercing star particles
    drawMiniRetroStar(ctx, tx - 24, ty - 20, 9, "#FEF08A");
    drawMiniRetroStar(ctx, tx + 26, ty + 18, 11, "#FFFFFF");
    drawMiniRetroStar(ctx, tx + 20, ty - 24, 8, "#FACC15");
  }

  ctx.restore();
}

/**
 * Helper: Draw a sleek ivory cone projectile with rounded base (Fury Attack)
 * - Removed 2 thin lines
 * - Single thick beam behind cone, similar to (slightly smaller than) horn thickness, not too long, transparent tail
 */
function drawSingleHornCone(
  ctx: any,
  x: number,
  y: number,
  angle: number,
  scale: number = 1.0,
  alpha: number = 1.0
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;

  const length = 36 * scale;
  const radius = 9 * scale; // Full 3D cone with rounded base (18px diameter)

  // 1. Single thick beam behind cone (similar to, slightly smaller than horn thickness, not too long, transparent tail)
  const beamHalfWidth = 6.8 * scale; // 13.6px total width
  const beamLength = 26 * scale; // Compact length
  const trailGrad = ctx.createLinearGradient(0, 0, -beamLength, 0);
  trailGrad.addColorStop(0.0, "rgba(244, 235, 217, 0.85)"); // Ivory base
  trailGrad.addColorStop(0.35, "rgba(244, 235, 217, 0.50)");
  trailGrad.addColorStop(1.0, "rgba(244, 235, 217, 0.0)"); // Tail completely transparent!

  ctx.fillStyle = trailGrad;
  ctx.beginPath();
  ctx.moveTo(0, -beamHalfWidth);
  ctx.lineTo(-beamLength, -beamHalfWidth * 0.4);
  ctx.lineTo(-beamLength, beamHalfWidth * 0.4);
  ctx.lineTo(0, beamHalfWidth);
  ctx.closePath();
  ctx.fill();

  // 2. Dark Natural Bone/Amber Outline (Cone with rounded base)
  ctx.beginPath();
  ctx.moveTo(length, 0); // Sharp needle point
  ctx.lineTo(0, -radius);
  ctx.quadraticCurveTo(-5 * scale, 0, 0, radius); // Rounded base cap
  ctx.lineTo(length, 0);
  ctx.closePath();
  ctx.fillStyle = "#451A03";
  ctx.fill();

  // 3. Natural Ivory Gradient
  const bodyGrad = ctx.createLinearGradient(0, -radius, 0, radius);
  bodyGrad.addColorStop(0.0, "#FAF7EE"); // Rim light
  bodyGrad.addColorStop(0.22, "#FFFFFF"); // Specular sheen
  bodyGrad.addColorStop(0.48, "#F4EBD9"); // Natural warm ivory
  bodyGrad.addColorStop(0.78, "#DECDB0"); // Bone shading
  bodyGrad.addColorStop(1.0, "#A89878"); // Soft bone shadow

  ctx.beginPath();
  ctx.moveTo(length - 1.5, 0);
  ctx.lineTo(1, -radius + 1.5);
  ctx.quadraticCurveTo(-3.5 * scale, 0, 1, radius - 1.5);
  ctx.lineTo(length - 1.5, 0);
  ctx.closePath();
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // 4. Central Specular Ridge
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 1.6 * scale;
  ctx.beginPath();
  ctx.moveTo(2, -radius * 0.2);
  ctx.lineTo(length - 2, 0);
  ctx.stroke();

  ctx.restore();
}

/**
 * 031: 마구 찌르기 (Fury Attack) Visual Effect
 * 3 horn-shaped ivory cones with staggered launch and sequential impact rings
 */
export function drawFuryAttackEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    em: { x: number; y: number; size: number };
    pm: { x: number; y: number; size: number };
    [key: string]: any;
  }
) {
  const { targetPos, attackerPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep || 1;
  const angle = isP ? -0.46 : 2.68;

  // Direction unit vector along flight axis
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);

  // Perpendicular unit vector for parallel spacing
  const perpX = Math.cos(angle + Math.PI / 2);
  const perpY = Math.sin(angle + Math.PI / 2);
  const parallelSpacing = 20;

  ctx.save();

  if (step === 1) {
    // 1. Caster steps forward: 3 horns visible in staggered echelon formation (Center leading, Upper mid, Lower trailing)
    const currentAttackerX = attackerPos.x + (frame.pOffset?.x || frame.eOffset?.x || 0);
    const currentAttackerY = attackerPos.y + (frame.pOffset?.y || frame.eOffset?.y || 0);
    const baseX = currentAttackerX + (isP ? 42 : -42);
    const baseY = currentAttackerY + (isP ? -16 : 16);

    // Staggered along flight direction: Center (+22px), Upper (0px), Lower (-22px)
    drawSingleHornCone(ctx, baseX + dirX * 22, baseY + dirY * 22, angle, 1.05);
    drawSingleHornCone(ctx, baseX + perpX * -parallelSpacing, baseY + perpY * -parallelSpacing, angle, 0.95);
    drawSingleHornCone(ctx, baseX + perpX * parallelSpacing - dirX * 22, baseY + perpY * parallelSpacing - dirY * 22, angle, 0.95);
  } else if (step === 2) {
    // 2. Wave 1 in Flight: STAGGERED sequential flight speeds!
    // Center is furthest ahead (prog: 0.82), Upper follows (prog: 0.54), Lower trails (prog: 0.28)
    const currentAttackerX = attackerPos.x + (frame.pOffset?.x || frame.eOffset?.x || 0);
    const currentAttackerY = attackerPos.y + (frame.pOffset?.y || frame.eOffset?.y || 0);
    const startX = currentAttackerX + (isP ? 42 : -42);
    const startY = currentAttackerY + (isP ? -16 : 16);
    const totalDx = targetPos.x - startX;
    const totalDy = targetPos.y - startY;

    // Horn 1: Center (Leading spearhead, prog = 0.82)
    const h1X = startX + totalDx * 0.82;
    const h1Y = startY + totalDy * 0.82;
    drawSingleHornCone(ctx, h1X, h1Y, angle, 1.15);

    // Horn 2: Upper (Mid follower, prog = 0.54)
    const h2X = startX + perpX * -parallelSpacing + totalDx * 0.54;
    const h2Y = startY + perpY * -parallelSpacing + totalDy * 0.54;
    drawSingleHornCone(ctx, h2X, h2Y, angle, 1.05);

    // Horn 3: Lower (Trailing follower, prog = 0.28)
    const h3X = startX + perpX * parallelSpacing + totalDx * 0.28;
    const h3Y = startY + perpY * parallelSpacing + totalDy * 0.28;
    drawSingleHornCone(ctx, h3X, h3Y, angle, 1.0);
  } else if (step === 3) {
    // 3. Wave 1 Hits Target: SEQUENTIAL IMPACT RINGS!
    // Center hit first (ring already expanded large: 25px)
    // Upper hit second (ring mid-expansion: 16px)
    // Lower hits third (ring small, fresh & tight: 9px)
    const tx = targetPos.x;
    const ty = targetPos.y;

    // Cones at impact positions
    drawSingleHornCone(ctx, tx + dirX * 12, ty + dirY * 12, angle, 0.95);
    drawSingleHornCone(ctx, tx + perpX * -parallelSpacing, ty + perpY * -parallelSpacing, angle, 0.95);
    drawSingleHornCone(ctx, tx + perpX * parallelSpacing - dirX * 10, ty + perpY * parallelSpacing - dirY * 10, angle, 0.95);

    // 1st Impact Ring (Center - Expanded Large, fading)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.60)";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(tx, ty, 25, 0, Math.PI * 2);
    ctx.stroke();

    // 2nd Impact Ring (Upper - Mid-sized, solid)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(tx + perpX * -parallelSpacing, ty + perpY * -parallelSpacing, 16, 0, Math.PI * 2);
    ctx.stroke();

    // 3rd Impact Ring (Lower - Small, fresh intense puncture flash!)
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(tx + perpX * parallelSpacing, ty + perpY * parallelSpacing, 9, 0, Math.PI * 2);
    ctx.stroke();

    // Puncture stars
    drawMiniRetroStar(ctx, tx - 14, ty - 12, 7, "#F4EBD9");
    drawMiniRetroStar(ctx, tx + 14, ty + 12, 8, "#FFFFFF");
    drawMiniRetroStar(ctx, tx + perpX * -parallelSpacing + 10, ty + perpY * -parallelSpacing - 8, 6, "#DECDB0");
  } else if (step === 4) {
    // 4. Wave 2 in Rapid Flight: Alternate Stagger! (Upper leading: 0.84, Lower mid: 0.56, Center trailing: 0.30)
    const currentAttackerX = attackerPos.x + (frame.pOffset?.x || frame.eOffset?.x || 0);
    const currentAttackerY = attackerPos.y + (frame.pOffset?.y || frame.eOffset?.y || 0);
    const startX = currentAttackerX + (isP ? 42 : -42);
    const startY = currentAttackerY + (isP ? -16 : 16);
    const totalDx = targetPos.x - startX;
    const totalDy = targetPos.y - startY;

    // Upper leads (prog: 0.84)
    drawSingleHornCone(ctx, startX + perpX * -parallelSpacing + totalDx * 0.84, startY + perpY * -parallelSpacing + totalDy * 0.84, angle, 1.15);

    // Lower follows (prog: 0.56)
    drawSingleHornCone(ctx, startX + perpX * parallelSpacing + totalDx * 0.56, startY + perpY * parallelSpacing + totalDy * 0.56, angle, 1.05);

    // Center trails (prog: 0.30)
    drawSingleHornCone(ctx, startX + totalDx * 0.30, startY + totalDy * 0.30, angle, 1.0);
  } else if (step === 5) {
    // 5. Wave 2 Hits Target: Alternating Sequential Impact Rings!
    // Upper ring: Large 25px (expanded)
    // Lower ring: Mid 16px (solid)
    // Center ring: Small 9px (fresh)
    const tx = targetPos.x;
    const ty = targetPos.y;

    // 1st Impact Ring (Upper - Expanded Large)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.60)";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(tx + perpX * -parallelSpacing, ty + perpY * -parallelSpacing, 25, 0, Math.PI * 2);
    ctx.stroke();

    // 2nd Impact Ring (Lower - Mid-sized)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(tx + perpX * parallelSpacing, ty + perpY * parallelSpacing, 16, 0, Math.PI * 2);
    ctx.stroke();

    // 3rd Impact Ring (Center - Small, fresh intense puncture)
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(tx, ty, 9, 0, Math.PI * 2);
    ctx.stroke();

    drawMiniRetroStar(ctx, tx - 20, ty + 10, 9, "#FFFFFF");
    drawMiniRetroStar(ctx, tx + 18, ty - 16, 10, "#F4EBD9");
    drawMiniRetroStar(ctx, tx, ty - 22, 7, "#DECDB0");
  }

  ctx.restore();
}

/**
 * Helper: Draw a high-speed rotating spiral drill horn
 * Conical body with rounded base cap
 * Helical Archimedean illusion: lines start wide/long at base, move up and shrink towards tip,
 * while new wide lines emerge from base, plus tiny micro-sparks on the edge!
 */
function drawSpiralDrillHorn(
  ctx: any,
  x: number,
  y: number,
  angle: number,
  spinProgress: number,
  scale: number = 1.0
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const length = 56 * scale;
  const baseRadius = 16 * scale; // Conical width

  // 1. Rotating Wind Vortex Swirls around drill
  ctx.strokeStyle = "rgba(226, 232, 240, 0.65)";
  ctx.lineWidth = 2.0 * scale;
  for (let i = 0; i < 3; i++) {
    const vPhase = (spinProgress * 2.5 + i * 0.33) % 1.0;
    const vx = length * vPhase;
    const vr = baseRadius * (1 - vPhase * 0.6);
    ctx.beginPath();
    ctx.ellipse(vx, 0, 5 * scale, vr, Math.PI / 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 2. Drill Bit Outer Shell (Conical body with rounded base cap)
  ctx.beginPath();
  ctx.moveTo(length, 0); // Sharp needle point
  ctx.lineTo(0, -baseRadius);
  ctx.quadraticCurveTo(-9 * scale, 0, 0, baseRadius); // Rounded base cap
  ctx.lineTo(length, 0);
  ctx.closePath();
  ctx.fillStyle = "#334155"; // Dark metallic slate outline
  ctx.fill();

  // 3. Drill Metallic Body Fill with cylindrical shine
  const bodyGrad = ctx.createLinearGradient(0, -baseRadius, 0, baseRadius);
  bodyGrad.addColorStop(0.0, "#CBD5E1");
  bodyGrad.addColorStop(0.28, "#F8FAFC"); // Gleaming metallic highlight
  bodyGrad.addColorStop(0.68, "#94A3B8");
  bodyGrad.addColorStop(1.0, "#475569");

  ctx.beginPath();
  ctx.moveTo(length - 2, 0);
  ctx.lineTo(1.5, -baseRadius + 2);
  ctx.quadraticCurveTo(-7 * scale, 0, 1.5, baseRadius - 2);
  ctx.lineTo(length - 2, 0);
  ctx.closePath();
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // 4. Helical Screw Flutes / Archimedean Spiral Threads (착시 회전선)
  // Lines start wide and long at base, move towards tip getting narrower/smaller,
  // then vanish at tip while fresh wide lines appear at base!
  const numFlutes = 3;
  for (let i = 0; i < numFlutes; i++) {
    const p = (spinProgress + i / numFlutes) % 1.0; // 0.0 at base -> 1.0 at tip
    const fx = length * p;
    const sweep = 9 * scale * (1 - p * 0.65); // Tilted angle of thread decreases near tip

    // Draw 3D curved helical thread across the cone surface
    const xTop = Math.max(0, fx - sweep);
    const xBot = Math.min(length - 2, fx + sweep);
    const rTop = baseRadius * (1 - (xTop / length) * 0.9);
    const rBot = baseRadius * (1 - (xBot / length) * 0.9);

    // Deep dark groove
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = Math.max(1.8, 3.6 * scale * (1 - p * 0.5));
    ctx.beginPath();
    ctx.moveTo(xTop, -rTop);
    ctx.quadraticCurveTo(fx + 3.5 * scale * (1 - p), 0, xBot, rBot);
    ctx.stroke();

    // Gleaming chrome highlight along groove crest
    ctx.strokeStyle = "rgba(255, 255, 255, 0.90)";
    ctx.lineWidth = Math.max(1.2, 2.0 * scale * (1 - p * 0.5));
    ctx.beginPath();
    ctx.moveTo(xTop + 1.2, -rTop);
    ctx.quadraticCurveTo(fx + 1.2 + 3.5 * scale * (1 - p), 0, xBot + 1.2, rBot);
    ctx.stroke();
  }

  // 5. Tiny Friction Micro-Sparks (아주 작은 미세 마찰 불꽃)
  // Flickering dynamically off the spinning drill flanks and tip
  for (let s = 0; s < 3; s++) {
    const spPhase = (spinProgress * 3.7 + s * 0.33) % 1.0;
    const sx = length * (0.15 + spPhase * 0.7);
    const side = (s + Math.floor(spinProgress * 5)) % 2 === 0 ? 1 : -1;
    const sy = (baseRadius * (1 - sx / length) + 2 + (s * 1.5)) * side;
    const spColor = s === 0 ? "#FFFFFF" : (s === 1 ? "#FEF08A" : "#F97316");

    ctx.fillStyle = spColor;
    ctx.fillRect(sx, sy, 2.5 * scale, 2.5 * scale);
  }

  // 6. Sharp Gleaming Metallic Needle Tip
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(length - 1, 0, 2.5 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 032: 뿔드릴 (Horn Drill) Visual Effect
 * 
 * Features:
 * - High-speed spinning drill vortex charge
 * - Clean blue piercing streak with BOTH ENDS TRANSPARENT (No stars)
 * - Blackout execution freeze: pure white victim silhouette first, then black hole appears
 * - Solid black circle covering middle-upper torso of victim
 * - Caster maintains front facing view until animation ends
 */
export function drawHornDrillEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    em: { x: number; y: number; size: number };
    pm: { x: number; y: number; size: number };
    [key: string]: any;
  }
) {
  const { targetPos, attackerPos, isPlayer: isP, em, pm } = drawCtx;
  const step = frame.moveStep || 1;
  const angle = isP ? -0.46 : 2.68;

  ctx.save();

  if (step >= 1 && step <= 5) {
    // 1 ~ 5: Drill horn spinning in front of caster with increasing RPM
    const currentAttackerX = attackerPos.x + (frame.pOffset?.x || frame.eOffset?.x || 0);
    const currentAttackerY = attackerPos.y + (frame.pOffset?.y || frame.eOffset?.y || 0);
    const hornX = currentAttackerX + (isP ? 48 : -46);
    const hornY = currentAttackerY + (isP ? -26 : 20);
    // Spin shifts by 0.085 on each frame to guarantee visible, distinct rotation!
    const spin = (step - 1) * 0.085;

    drawSpiralDrillHorn(ctx, hornX, hornY, angle, spin, 1.25);
  } else if (step === 6) {
    // 5. Piercing clean through target with blue piercing line (BOTH ENDS TRANSPARENT, NO STARS!)
    const tx = targetPos.x;
    const ty = targetPos.y;

    // Massive conical drill cone vortex rings over target
    ctx.strokeStyle = "rgba(255, 255, 255, 0.90)";
    ctx.lineWidth = 3.5;
    for (let r = 16; r <= 52; r += 12) {
      ctx.beginPath();
      ctx.ellipse(tx, ty, r, r * 0.55, angle, 0, Math.PI * 2);
      ctx.stroke();
    }

    // High velocity blue piercing streak with BOTH ENDS TRANSPARENT (양쪽 끝 투명한 파란직선)
    const streakLen = 220; // Long piercing streak
    const halfLen = streakLen / 2;
    const dx = Math.cos(angle) * halfLen;
    const dy = Math.sin(angle) * halfLen;

    const x1 = tx - dx;
    const y1 = ty - dy;
    const x2 = tx + dx;
    const y2 = ty + dy;

    // Blue glow streak: transparent ends
    const blueGrad = ctx.createLinearGradient(x1, y1, x2, y2);
    blueGrad.addColorStop(0.0, "rgba(56, 189, 248, 0.0)"); // Transparent tip 1
    blueGrad.addColorStop(0.22, "rgba(56, 189, 248, 0.85)");
    blueGrad.addColorStop(0.50, "#FFFFFF"); // Pure white gleam in core
    blueGrad.addColorStop(0.78, "rgba(56, 189, 248, 0.85)");
    blueGrad.addColorStop(1.0, "rgba(56, 189, 248, 0.0)"); // Transparent tip 2

    ctx.strokeStyle = blueGrad;
    ctx.lineWidth = 5.0;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Sharp white core streak with transparent ends
    const coreGrad = ctx.createLinearGradient(x1, y1, x2, y2);
    coreGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
    coreGrad.addColorStop(0.30, "rgba(255, 255, 255, 0.95)");
    coreGrad.addColorStop(0.70, "rgba(255, 255, 255, 0.95)");
    coreGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

    ctx.strokeStyle = coreGrad;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  } else if (frame.holeInTarget) {
    // 5: SOLID BLACK CIRCLE COVERING THE MIDDLE-UPPER TORSO OF TARGET WHITE SPRITE!
    // Appears on frame 5 (AFTER the pure white sprite appears on frame 4)
    const targetSize = isP ? em.size : pm.size;
    const holeX = targetPos.x;
    // Middle-upper part of the sprite
    const holeY = targetPos.y - Math.round(targetSize * 0.12);
    const holeRadius = Math.round(targetSize * 0.18); // Clean, massive drilled void hole

    // 1. Pure solid black drilled hole (No white rim!)
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(holeX, holeY, holeRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
