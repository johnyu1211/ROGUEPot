import { drawMiniRetroStar } from "../common/helpers.js";

/**
 * Gen 1 Moves: 025 to 028 Visual Effects Renderers
 * 
 * 025: 메가톤킥 (Mega Kick) - Mega Punch Style Concentric Gold Rings & 4-Point Star + Black Footprint Stamp
 * 026: 점프킥 (Jump Kick) - Supersonic Sprite-Thickness Slipstream & Sleek Footprint Mark
 * 027: 돌려차기 (Rolling Kick) - 360° Circular Kick Arc & Roundhouse Footprint Strike
 * 028: 모래뿌리기 (Sand Attack) - Progressive Traveling Sand Storm & Dust Grains (No Lines, No White Flash)
 */

/**
 * Exact 16x16 Pixel Grid of the Official Pokémon Kick / Footprint Impact Sprite
 * (3 toes, side wings, hollow horseshoe arch, bottom heel)
 */
const FOOTPRINT_BITMAP = [
  0b0000000000000000,
  0b0000000100000000,
  0b0001000100010000,
  0b0001001110010000,
  0b0001101110110000,
  0b0001111111110000,
  0b0001111111110000,
  0b0001111111110000,
  0b0011111111111000,
  0b0011111111111000,
  0b0011110001111000,
  0b0001100000110000,
  0b0001100000110000,
  0b0000100000100000,
  0b0000110001100000,
  0b0000001110000000
];

/**
 * Helper: Draw the authentic pixel-art kick footprint based on the reference image
 */
export function drawFootprintStamp(
  ctx: any,
  cx: number,
  cy: number,
  scale: number = 1.0,
  angle: number = 0,
  mainColor: string = "#0F172A",
  shadowColor?: string,
  alpha: number = 1.0
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;

  const pSize = 3.0 * scale;
  const halfW = 8 * pSize;
  const halfH = 8 * pSize;

  // 1. Pixel Shadow
  if (shadowColor && alpha > 0.4) {
    ctx.fillStyle = shadowColor;
    const sOff = 2.0 * scale;
    for (let y = 0; y < 16; y++) {
      const row = FOOTPRINT_BITMAP[y];
      if (!row) continue;
      for (let x = 0; x < 16; x++) {
        if ((row >> (15 - x)) & 1) {
          ctx.fillRect(-halfW + x * pSize + sOff, -halfH + y * pSize + sOff, pSize, pSize);
        }
      }
    }
  }

  // 2. Main Footprint Pixels
  ctx.fillStyle = mainColor;
  for (let y = 0; y < 16; y++) {
    const row = FOOTPRINT_BITMAP[y];
    if (!row) continue;
    for (let x = 0; x < 16; x++) {
      if ((row >> (15 - x)) & 1) {
        ctx.fillRect(-halfW + x * pSize, -halfH + y * pSize, pSize, pSize);
      }
    }
  }

  ctx.restore();
}

/**
 * Exact 16x16 Pixel Grid of Mega Kick's Special Footprint Sprite
 * (Black outline + Inner ring with White interior fill)
 */
const MEGA_KICK_GRID = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
  [0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0],
  [0,0,0,1,0,0,1,2,1,0,0,1,0,0,0,0],
  [0,0,0,1,1,0,1,2,1,0,1,1,0,0,0,0],
  [0,0,0,1,2,1,1,2,1,1,2,1,0,0,0,0],
  [0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],
  [0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],
  [0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],
  [0,0,1,2,2,2,1,1,1,2,2,2,1,0,0,0],
  [0,0,1,2,2,1,0,0,0,1,2,2,1,0,0,0],
  [0,0,0,1,2,1,0,0,0,1,2,1,0,0,0,0],
  [0,0,0,1,2,1,0,0,0,1,2,1,0,0,0,0],
  [0,0,0,0,1,2,1,1,1,2,1,0,0,0,0,0],
  [0,0,0,0,1,1,2,2,2,1,1,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0]
];

/**
 * Helper: Draw the authentic Mega Kick footprint (black outline + white fill)
 */
function drawMegaKickFootprint(
  ctx: any,
  cx: number,
  cy: number,
  scale: number = 1.0,
  angle: number = 0,
  alpha: number = 1.0
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;

  const pSize = 3.2 * scale;
  const halfW = 8 * pSize;
  const halfH = 8 * pSize;

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const v = MEGA_KICK_GRID[y][x];
      if (v === 0) continue;
      ctx.fillStyle = v === 1 ? "#000000" : "#FFFFFF";
      ctx.fillRect(-halfW + x * pSize, -halfH + y * pSize, pSize, pSize);
    }
  }

  ctx.restore();
}

/**
 * 025 메가톤킥 (Mega Kick):
 * 1. 동그란 큰 링이 빠르게 줄어들면서 발 (거의 투명 28%) 출현
 * 2. 링이 더 줄어들면서 발이 60%까지 불투명해짐
 * 3. 정면 불투명(100%) 발이 나타나며 강타 임팩트 (황금빛 스타 + 미니스타 + 링)
 * 4. 발이 커지면서(확대) 페이드 아웃 및 충격파 확산
 */
export function drawMegaKickEffect(
  ctx: any,
  target: { x: number; y: number },
  step: number = 3
) {
  ctx.save();
  const tx = target.x;
  const ty = target.y - 12;

  if (step === 1) {
    // 1단계: 동그란 큰 링 (r=56) + 거의 투명한 발 (28%)
    ctx.save();
    ctx.strokeStyle = "#FACC15";
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.arc(tx, ty - 10, 56, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(tx, ty - 10, 56, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    drawMegaKickFootprint(ctx, tx, ty - 10, 1.05, -0.22, 0.28);
  } else if (step === 2) {
    // 2단계: 링이 빠르게 줄어들며(r=28) 발이 60%까지 불투명해짐
    ctx.save();
    ctx.strokeStyle = "#FACC15";
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(tx, ty - 10, 28, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(tx, ty - 10, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    drawMegaKickFootprint(ctx, tx, ty - 10, 1.22, -0.18, 0.60);
  } else if (step === 3) {
    // 3단계: 정면 100% 완전 불투명 발이 나타나며 강타 작렬!
    ctx.save();
    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(tx, ty - 10, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 황금 레트로 4각 임팩트 스타 (메가톤펀치 스타일)
    ctx.save();
    const sparkX = tx;
    const sparkY = ty - 10;
    const starRadius = 34;

    ctx.fillStyle = "#FACC15";
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(sparkX, sparkY - starRadius);
    ctx.quadraticCurveTo(sparkX, sparkY, sparkX + starRadius, sparkY);
    ctx.quadraticCurveTo(sparkX, sparkY, sparkX, sparkY + starRadius);
    ctx.quadraticCurveTo(sparkX, sparkY, sparkX - starRadius, sparkY);
    ctx.quadraticCurveTo(sparkX, sparkY, sparkX, sparkY - starRadius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 미니 레트로 스타
    drawMiniRetroStar(ctx, tx + 36, ty - 34, 11, "#FDE047");
    drawMiniRetroStar(ctx, tx - 34, ty - 28, 9, "#FFFFFF");
    drawMiniRetroStar(ctx, tx + 32, ty + 18, 9, "#FEF08A");
    drawMiniRetroStar(ctx, tx - 30, ty + 20, 10, "#FACC15");

    // 100% 불투명 메가톤킥 발바닥!
    drawMegaKickFootprint(ctx, tx, ty - 10, 1.40, -0.15, 1.0);
  } else if (step >= 4) {
    // 4단계: 발이 커지면서(확대 scale 1.85) 페이드 아웃(alpha 0.40) 및 충격파 확산
    ctx.save();
    ctx.strokeStyle = "rgba(250, 204, 21, 0.45)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(tx, ty - 10, 52, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.50;
    drawMiniRetroStar(ctx, tx, ty - 10, 18, "rgba(250, 204, 21, 0.6)");
    ctx.restore();

    // 발이 커지면서 페이드 아웃!
    drawMegaKickFootprint(ctx, tx, ty - 10, 1.85, -0.15, 0.40);
  }

  ctx.restore();
}

/**
 * 026 점프킥 (Jump Kick):
 * Thick supersonic slipstream (sprite height) trailing transparently to rear + sleek footprint stamp
 * STRICTLY NO RIGID STICK LINES!
 */
export function drawJumpKickEffect(
  ctx: any,
  target: { x: number; y: number },
  step: number = 2,
  isPlayer: boolean = true
) {
  ctx.save();
  const tx = target.x;
  const ty = target.y - 10;
  // Flight vector: Player dives toward top-right (-0.42 rad), Enemy dives toward bottom-left (PI - 0.42 rad)
  const diveAngle = isPlayer ? -0.42 : (Math.PI - 0.42);
  const footAngle = isPlayer ? -0.35 : 0.35; // Claws stay naturally upright!

  if (step === 2) {
    // 1. Single thick sprite-thickness supersonic slipstream ribbon trailing transparently behind!
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(diveAngle);

    // Smooth gradient cone (NO straight center line!)
    const ribbonGrad = ctx.createLinearGradient(-260, 0, 0, 0);
    ribbonGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");     // Completely transparent at rear
    ribbonGrad.addColorStop(0.45, "rgba(255, 255, 255, 0.16)");   // Smooth slipstream fade
    ribbonGrad.addColorStop(0.85, "rgba(255, 255, 255, 0.52)");   // Thick airflow
    ribbonGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.78)");    // Crisp supersonic head

    ctx.fillStyle = ribbonGrad;
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(0, 28);
    ctx.lineTo(-260, 10);
    ctx.lineTo(-260, -10);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // 2. 5 Semi-transparent footprints along the flight trajectory (5%, 10%, 15%, 20%, 25%)
    const trailAlphas = [0.05, 0.10, 0.15, 0.20, 0.25];
    for (let i = 0; i < trailAlphas.length; i++) {
      const alpha = trailAlphas[i];
      // Trailing backwards from impact point along dive vector (towards attacker's launch origin)
      const distBack = (5 - i) * 32; // 160, 128, 96, 64, 32 px back
      const px = tx - Math.cos(diveAngle) * distBack;
      const py = ty - Math.sin(diveAngle) * distBack;
      const scale = 1.05 + i * 0.05;
      drawFootprintStamp(ctx, px, py, scale, footAngle, "#EA580C", undefined, alpha);
    }

    // 3. Impact foot at contact point (100% full opacity, upright)!
    drawFootprintStamp(ctx, tx, ty, 1.35, footAngle, "#EA580C", "rgba(154, 52, 18, 0.55)", 1.0);

    // 4. Soft impact ember sparks (NO straight lines!)
    ctx.save();
    ctx.fillStyle = "#FDE047";
    const sparks = [
      { x: -28, y: -20, r: 3.2, a: 0.8 },
      { x: 26, y: -24, r: 2.8, a: 0.85 },
      { x: 32, y: 16, r: 3.5, a: 0.75 },
      { x: -22, y: 24, r: 2.5, a: 0.7 },
      { x: 38, y: -4, r: 2.2, a: 0.8 },
    ];
    sparks.forEach(s => {
      ctx.globalAlpha = s.a;
      ctx.beginPath();
      ctx.arc(tx + s.x, ty + s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  } else if (step >= 3) {
    // Step 3: Fading footprint mark on the defender as attacker loops around
    ctx.save();
    ctx.globalAlpha = 0.45;
    drawFootprintStamp(ctx, tx, ty, 1.20, footAngle, "#C2410C", "rgba(0,0,0,0.25)");
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 027 돌려차기 (Rolling Kick):
 * Attacker dashes in and spins 360° mid-air.
 * Effect: Clean footprint stamp in center with high-speed straight afterimage lines
 * on BOTH SIDES (양측 사이드) whose ends fade transparently to 0 opacity!
 */
export function drawRollingKickEffect(
  ctx: any,
  target: { x: number; y: number },
  step: number = 2
) {
  ctx.save();
  const tx = target.x;
  const ty = target.y - 8;

  if (step === 2) {
    // 1. A SINGLE THICK SPEEDLINE BEAM: Middle is 100% solid, ends fade to 0 opacity
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(-0.15); // Dynamic sweep angle
    ctx.lineCap = "round";

    // 1-1. Outer glowing amber aura of the thick beam (width 18px)
    const gGlow = ctx.createLinearGradient(-150, 0, 150, 0);
    gGlow.addColorStop(0.0, "rgba(234, 88, 12, 0.0)");
    gGlow.addColorStop(0.25, "rgba(234, 88, 12, 0.45)");
    gGlow.addColorStop(0.50, "rgba(254, 240, 138, 0.85)");
    gGlow.addColorStop(0.75, "rgba(234, 88, 12, 0.45)");
    gGlow.addColorStop(1.0, "rgba(234, 88, 12, 0.0)");

    ctx.strokeStyle = gGlow;
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(-150, 0);
    ctx.lineTo(150, 0);
    ctx.stroke();

    // 1-2. Solid thick center core (width 8px) - 100% fully opaque in the middle!
    const gCore = ctx.createLinearGradient(-135, 0, 135, 0);
    gCore.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
    gCore.addColorStop(0.25, "rgba(255, 255, 255, 0.50)");
    gCore.addColorStop(0.40, "#FFFFFF"); // 100% solid
    gCore.addColorStop(0.60, "#FFFFFF"); // 100% solid
    gCore.addColorStop(0.75, "rgba(255, 255, 255, 0.50)");
    gCore.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

    ctx.strokeStyle = gCore;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-135, 0);
    ctx.lineTo(135, 0);
    ctx.stroke();

    ctx.restore();

    // 2. Authentic Pixel-Art Footprint stamp delivered at the center!
    drawFootprintStamp(ctx, tx, ty - 2, 1.35, 0.35, "#EA580C", "rgba(154, 52, 18, 0.6)");
  } else if (step >= 3) {
    // Step 3: Fading afterimage beam & fading footprint
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(-0.15);
    ctx.lineCap = "round";

    const gFade = ctx.createLinearGradient(-100, 0, 100, 0);
    gFade.addColorStop(0.0, "rgba(234, 88, 12, 0.0)");
    gFade.addColorStop(0.5, "rgba(234, 88, 12, 0.35)");
    gFade.addColorStop(1.0, "rgba(234, 88, 12, 0.0)");
    ctx.strokeStyle = gFade;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(-100, 0);
    ctx.lineTo(100, 0);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.40;
    drawFootprintStamp(ctx, tx, ty - 2, 1.25, 0.35, "#C2410C", "rgba(0,0,0,0.2)");
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 42 pre-calculated sand particles for realistic fine dust distribution
 */
const SAND_PARTICLES = [
  { u: 0.20, vOffset: -24, r: 1.1, color: "#D97706", alpha: 0.85 },
  { u: 0.28, vOffset: 12, r: 1.4, color: "#B45309", alpha: 0.90 },
  { u: 0.35, vOffset: -10, r: 0.8, color: "#FBBF24", alpha: 0.80 },
  { u: 0.42, vOffset: 26, r: 1.3, color: "#D97706", alpha: 0.88 },
  { u: 0.48, vOffset: -32, r: 1.0, color: "#FDE68A", alpha: 0.75 },
  { u: 0.55, vOffset: 4, r: 1.5, color: "#92400E", alpha: 0.92 },
  { u: 0.60, vOffset: -18, r: 1.1, color: "#FBBF24", alpha: 0.85 },
  { u: 0.65, vOffset: 20, r: 1.2, color: "#D97706", alpha: 0.90 },
  { u: 0.70, vOffset: -8, r: 0.8, color: "#FDE68A", alpha: 0.82 },
  { u: 0.75, vOffset: -28, r: 1.4, color: "#B45309", alpha: 0.88 },
  { u: 0.80, vOffset: 16, r: 1.0, color: "#D97706", alpha: 0.85 },
  { u: 0.85, vOffset: -14, r: 1.2, color: "#FBBF24", alpha: 0.90 },
  { u: 0.90, vOffset: 6, r: 0.9, color: "#FEF3C7", alpha: 0.80 },
  { u: 0.95, vOffset: -22, r: 1.1, color: "#B45309", alpha: 0.85 },
  { u: 1.02, vOffset: 18, r: 1.4, color: "#D97706", alpha: 0.90 },
  { u: 1.08, vOffset: -6, r: 0.8, color: "#FBBF24", alpha: 0.80 },
  { u: 1.14, vOffset: -30, r: 1.3, color: "#92400E", alpha: 0.85 },
  { u: 1.18, vOffset: 12, r: 1.0, color: "#FDE68A", alpha: 0.78 },
  { u: 1.25, vOffset: -16, r: 1.2, color: "#D97706", alpha: 0.85 },
  { u: 0.32, vOffset: -38, r: 0.8, color: "#FEF3C7", alpha: 0.70 },
  { u: 0.50, vOffset: 42, r: 1.2, color: "#B45309", alpha: 0.75 },
  { u: 0.68, vOffset: 34, r: 1.1, color: "#D97706", alpha: 0.80 },
  { u: 0.82, vOffset: -38, r: 1.2, color: "#FBBF24", alpha: 0.82 },
  { u: 0.98, vOffset: 32, r: 1.4, color: "#92400E", alpha: 0.88 },
  { u: 1.12, vOffset: 26, r: 1.0, color: "#FDE68A", alpha: 0.75 },
  { u: 0.44, vOffset: -16, r: 1.5, color: "#B45309", alpha: 0.90 },
  { u: 0.58, vOffset: 18, r: 0.9, color: "#D97706", alpha: 0.82 },
  { u: 0.72, vOffset: -22, r: 1.2, color: "#FBBF24", alpha: 0.88 },
  { u: 0.88, vOffset: 24, r: 1.1, color: "#FEF3C7", alpha: 0.85 },
  { u: 1.05, vOffset: -12, r: 1.5, color: "#D97706", alpha: 0.92 },
];

/**
 * 028 모래뿌리기 (Sand Attack):
 * Genuinely moves from attacker's feet to defender across steps!
 * COMPLETELY REMOVED WEIRD STRIPED LINES!
 * ABSOLUTELY NO WHITE FLASH!
 */
export function drawSandAttackEffect(
  ctx: any,
  attacker: { x: number; y: number },
  target: { x: number; y: number },
  step: number = 2
) {
  ctx.save();
  const ax = attacker.x;
  const ay = attacker.y;
  const tx = target.x;
  const ty = target.y - 6;

  // Progressive travel progress t:
  // Step 1: 0.15 (launch at attacker's feet)
  // Step 2: 0.52 (flying in mid-air toward target)
  // Step 3: 0.96 (crashing into and engulfing target)
  // Step 4: 1.22 (dispersing past target)
  const baseT = step === 1 ? 0.15 : (step === 2 ? 0.52 : (step === 3 ? 0.96 : 1.22));
  const waveAlpha = step === 4 ? 0.45 : (step === 1 ? 0.80 : 0.95);

  // Soft billowing sand dust puffs that travel with the wave
  const cloudOffsets = [
    { dt: -0.12, dy: 6, r: 26, alpha: 0.35 },
    { dt: 0.0, dy: -12, r: 34, alpha: 0.40 },
    { dt: 0.08, dy: 10, r: 32, alpha: 0.38 },
    { dt: 0.18, dy: -6, r: 26, alpha: 0.30 },
  ];

  cloudOffsets.forEach(c => {
    const curT = Math.max(0, Math.min(1.35, baseT + c.dt));
    const cx = ax + (tx - ax) * curT;
    const cy = ay + (ty - ay) * curT + c.dy;

    const g = ctx.createRadialGradient(cx, cy, 3, cx, cy, c.r);
    g.addColorStop(0, `rgba(251, 191, 36, ${c.alpha * waveAlpha})`);
    g.addColorStop(0.55, `rgba(217, 119, 6, ${c.alpha * 0.7 * waveAlpha})`);
    g.addColorStop(1, "rgba(180, 83, 9, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, c.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Genuinely moving sand grains (NO STRIPED LINES AT ALL!)
  SAND_PARTICLES.forEach(p => {
    const curT = Math.max(0, baseT + (p.u - 0.7) * 0.65);
    const px = ax + (tx - ax) * curT;
    const py = ay + (ty - ay) * curT + p.vOffset;

    const particleAlpha = p.alpha * waveAlpha;
    ctx.globalAlpha = particleAlpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(px, py, p.r, p.r * 0.75, 0.25, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}
