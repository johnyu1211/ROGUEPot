import { drawMiniRetroStar, drawStarburstImpact } from "../common/helpers.js";

/**
 * 021 힘껏치기 (Slam): Explosive Forward Physical Slam with Punchy Directional Impact Sparks & Shockwave Burst
 */
export function drawSlamEffect(
  ctx: any,
  start: { x: number; y: number },
  target: { x: number; y: number },
  step: number = 1
) {
  ctx.save();
  const tx = target.x;
  const ty = target.y - 8;

  if (step === 1) {
    // Step 1: Calm / Tension building (No curves)
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(tx - 40, ty - 20);
    ctx.lineTo(tx + 20, ty - 20);
    ctx.moveTo(tx - 30, ty + 10);
    ctx.lineTo(tx + 30, ty + 10);
    ctx.stroke();
    ctx.restore();
  } else if (step === 2) {
    // Step 2: 팍! (BAM!) Explosive Heavy Physical Slam Impact
    ctx.save();
    // 1. Sharp Linear Directional Impact Speedlines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(tx - 35, ty + i * 14);
      ctx.lineTo(tx + 35, ty + i * 10);
      ctx.stroke();
    }

    // 2. Sharp Diagonal Slash Spikes
    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(tx - 28, ty - 35);
    ctx.lineTo(tx + 28, ty + 35);
    ctx.moveTo(tx - 28, ty + 35);
    ctx.lineTo(tx + 28, ty - 35);
    ctx.stroke();

    // 3. Central Explosive Hit Flash Starburst
    drawStarburstImpact(ctx, tx, ty, "#F59E0B", "#FFFFFF", 42);

    // 4. Kinetic Impact Stars
    drawMiniRetroStar(ctx, tx - 25, ty - 25, 12, "#FFFFFF");
    drawMiniRetroStar(ctx, tx + 28, ty - 18, 11, "#FEF08A");
    drawMiniRetroStar(ctx, tx - 20, ty + 24, 10, "#F59E0B");
    drawMiniRetroStar(ctx, tx + 24, ty + 22, 12, "#FFFFFF");
    ctx.restore();
  } else if (step >= 3) {
    // Step 3: Dissipating Kinetic Impact Sparks & Tremor Lines
    ctx.save();
    // Horizontal Impact Shock Tremors
    ctx.strokeStyle = "rgba(254, 240, 138, 0.75)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(tx - 50, ty + 18);
    ctx.lineTo(tx + 50, ty + 18);
    ctx.moveTo(tx - 35, ty + 24);
    ctx.lineTo(tx + 35, ty + 24);
    ctx.stroke();

    // Dissipating Stars
    drawMiniRetroStar(ctx, tx - 36, ty - 15, 8, "#FEF08A");
    drawMiniRetroStar(ctx, tx + 38, ty - 10, 9, "#FFFFFF");
    drawMiniRetroStar(ctx, tx + 12, ty - 32, 7, "#F59E0B");
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 022 덩굴채찍 (Vine Whip): Organic Double Snapping Green Vines with Thorny Nodes & Leaf Bursts
 */
export function drawVineWhipEffect(
  ctx: any,
  start: { x: number; y: number },
  target: { x: number; y: number },
  step: number = 1
) {
  ctx.save();
  const tx = target.x;
  const ty = target.y - 8;

  // Helper to draw a stylized leaf particle
  const drawLeaf = (lx: number, ly: number, angle: number, size: number) => {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(angle);
    ctx.fillStyle = "#22C55E";
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(size * 0.8, 0, 0, size);
    ctx.quadraticCurveTo(-size * 0.8, 0, 0, -size);
    ctx.fill();
    ctx.strokeStyle = "#15803D";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  };

  if (step === 1) {
    // Step 1: 1st Vine Lash (Snapping diagonally from top-left to center)
    ctx.save();
    ctx.strokeStyle = "#15803D";
    ctx.lineWidth = 6.0;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(tx - 65, ty - 55);
    ctx.bezierCurveTo(tx - 25, ty - 45, tx - 40, ty - 10, tx + 15, ty + 10);
    ctx.stroke();

    // Inner bright vine core
    ctx.strokeStyle = "#86EFAC";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(tx - 65, ty - 55);
    ctx.bezierCurveTo(tx - 25, ty - 45, tx - 40, ty - 10, tx + 15, ty + 10);
    ctx.stroke();

    // Whip tip crack & leaves
    drawStarburstImpact(ctx, tx - 5, ty - 10, "#4ADE80", "#FFFFFF", 22);
    drawLeaf(tx - 35, ty - 35, -0.6, 7);
    drawLeaf(tx + 5, ty + 5, 0.8, 6);
    ctx.restore();
  } else if (step === 2) {
    // Step 2: 2nd Vine Lash (Cross whip from top-right to bottom-left with 'X' intersection)
    ctx.save();
    // 1st Vine fading
    ctx.strokeStyle = "rgba(34, 197, 94, 0.45)";
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(tx - 65, ty - 55);
    ctx.bezierCurveTo(tx - 25, ty - 45, tx - 40, ty - 10, tx + 15, ty + 10);
    ctx.stroke();

    // 2nd Vine heavy slash
    ctx.strokeStyle = "#166534";
    ctx.lineWidth = 7.0;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(tx + 65, ty - 50);
    ctx.bezierCurveTo(tx + 20, ty - 35, tx + 35, ty + 5, tx - 25, ty + 15);
    ctx.stroke();

    ctx.strokeStyle = "#BBF7D0";
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(tx + 65, ty - 50);
    ctx.bezierCurveTo(tx + 20, ty - 35, tx + 35, ty + 5, tx - 25, ty + 15);
    ctx.stroke();

    // Central Crossing Crack Flash
    drawStarburstImpact(ctx, tx, ty - 8, "#22C55E", "#FFFFFF", 34);

    // Bursting foliage leaves
    drawLeaf(tx + 30, ty - 25, 0.7, 8);
    drawLeaf(tx - 20, ty - 20, -0.5, 7);
    drawLeaf(tx + 18, ty + 12, 1.2, 6);
    drawLeaf(tx - 30, ty + 10, -1.0, 7);
    ctx.restore();
  } else if (step >= 3) {
    // Step 3: Lingering Emerald Leaves & Dissipating Whip Ripple
    ctx.save();
    ctx.strokeStyle = "rgba(74, 222, 128, 0.5)";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(tx, ty + 15, 48, 14, 0, 0, Math.PI * 2);
    ctx.stroke();

    drawLeaf(tx - 40, ty - 30, -0.4, 6);
    drawLeaf(tx + 35, ty - 35, 0.9, 7);
    drawLeaf(tx + 25, ty + 20, 1.5, 6);
    drawLeaf(tx - 32, ty + 18, -1.2, 6);
    drawMiniRetroStar(ctx, tx, ty - 8, 10, "#86EFAC");
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 023 짓밟기 (Stomp): Giant Beast Paw / Foot Silhouette Crushing Down from Above with Heavy Seismic Shockwave Dust
 */
export function drawStompEffect(
  ctx: any,
  target: { x: number; y: number },
  step: number = 1
) {
  ctx.save();
  const tx = target.x;
  const ty = target.y - 8;

  // Helper to draw a stylized monster paw / foot stamp
  const drawBeastFootprint = (fx: number, fy: number, footScale: number, alpha: number) => {
    ctx.save();
    ctx.translate(fx, fy);
    ctx.scale(footScale, footScale);
    ctx.globalAlpha = alpha;

    // Main Foot Pad (Solid dark charcoal silhouette)
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.ellipse(0, 0, 32, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 3 Sharp Toe Claws
    const toes = [-20, 0, 20];
    for (const tox of toes) {
      ctx.fillStyle = "#1E293B";
      ctx.beginPath();
      ctx.ellipse(tox, -24, 9, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Sharp claw tip
      ctx.fillStyle = "#E2E8F0";
      ctx.beginPath();
      ctx.moveTo(tox - 4, -30);
      ctx.lineTo(tox + 4, -30);
      ctx.lineTo(tox, -42);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };

  if (step === 1) {
    // Step 1: Foot Silhouette Looming High Above & Growing Ground Shadow
    ctx.save();
    // Looming Foot (High altitude, descending)
    drawBeastFootprint(tx, ty - 65, 1.15, 0.85);

    // Ground Target Reticle / Shadow
    ctx.fillStyle = "rgba(15, 23, 42, 0.45)";
    ctx.beginPath();
    ctx.ellipse(tx, ty + 24, 38, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (step === 2) {
    // Step 2: Heavy Crushing Stomp Slam Impact (Direct ground impact slam)
    ctx.save();
    // Stomping Foot slammed down
    drawBeastFootprint(tx, ty - 5, 1.35, 0.95);

    // Seismic Impact Flash
    drawStarburstImpact(ctx, tx, ty + 10, "#F87171", "#FFFFFF", 42);

    // Heavy Ground Shockwave
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.ellipse(tx, ty + 22, 60, 18, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else if (step >= 3) {
    // Step 3: Lateral Dust Plumes & Ground Aftershocks
    ctx.save();
    // Expanding Ground Ripple
    ctx.strokeStyle = "rgba(148, 163, 184, 0.65)";
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.ellipse(tx, ty + 22, 85, 24, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Left & Right Dust Clouds
    ctx.fillStyle = "rgba(226, 232, 240, 0.70)";
    ctx.beginPath();
    ctx.arc(tx - 45, ty + 18, 16, 0, Math.PI * 2);
    ctx.arc(tx - 65, ty + 20, 12, 0, Math.PI * 2);
    ctx.arc(tx + 45, ty + 18, 16, 0, Math.PI * 2);
    ctx.arc(tx + 65, ty + 20, 12, 0, Math.PI * 2);
    ctx.fill();

    drawMiniRetroStar(ctx, tx - 28, ty - 25, 10, "#CBD5E1");
    drawMiniRetroStar(ctx, tx + 30, ty - 22, 11, "#FFFFFF");
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 024 두번차기 (Double Kick): Dual Rhythmic Martial Arts Kick Strikes with Glowing Crescent Arcs & Twin Impact Sparks
 */
export function drawDoubleKickEffect(
  ctx: any,
  start: { x: number; y: number },
  target: { x: number; y: number },
  step: number = 1
) {
  ctx.save();
  const tx = target.x;
  const ty = target.y - 8;

  // Helper to draw a stylized martial arts kick foot / boot
  const drawKickBoot = (bx: number, by: number, rotAngle: number, scaleX: number = 1) => {
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(rotAngle);
    ctx.scale(scaleX, 1);

    // Boot sole & body
    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#991B1B";
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Boot toe cap highlight
    ctx.fillStyle = "#FEE2E2";
    ctx.beginPath();
    ctx.arc(14, 0, 6, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    ctx.restore();
  };

  if (step === 1) {
    // Step 1: 1st Kick - Fast Low/Mid Diagonal Kick from Left
    ctx.save();
    // Slashing Kick Arc
    const kickArcGrad = ctx.createLinearGradient(tx - 50, ty + 20, tx + 10, ty - 25);
    kickArcGrad.addColorStop(0, "rgba(239, 68, 68, 0.0)");
    kickArcGrad.addColorStop(0.5, "rgba(249, 115, 22, 0.85)");
    kickArcGrad.addColorStop(1, "#FFFFFF");

    ctx.strokeStyle = kickArcGrad;
    ctx.lineWidth = 7.0;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(tx - 15, ty, 38, Math.PI * 0.7, -Math.PI * 0.15, true);
    ctx.stroke();

    // 1st Boot Strike
    drawKickBoot(tx - 6, ty - 6, -0.4, 1.1);

    // 1st Impact Spark
    drawStarburstImpact(ctx, tx - 4, ty - 8, "#F97171", "#FFFFFF", 26);
    drawMiniRetroStar(ctx, tx - 25, ty - 25, 9, "#FED7AA");
    ctx.restore();
  } else if (step === 2) {
    // Step 2: 2nd Kick - High Jump Roundhouse Kick from Right
    ctx.save();
    // 2nd High Roundhouse Kick Arc
    const kickArcGrad2 = ctx.createLinearGradient(tx + 50, ty - 40, tx - 20, ty + 10);
    kickArcGrad2.addColorStop(0, "rgba(239, 68, 68, 0.0)");
    kickArcGrad2.addColorStop(0.5, "rgba(245, 158, 11, 0.90)");
    kickArcGrad2.addColorStop(1, "#FFFFFF");

    ctx.strokeStyle = kickArcGrad2;
    ctx.lineWidth = 8.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(tx + 10, ty - 8, 44, -Math.PI * 0.85, Math.PI * 0.2, false);
    ctx.stroke();

    // 2nd Boot Strike from Right
    drawKickBoot(tx + 8, ty - 12, 0.55, -1.2);

    // 2nd Major Impact Sparkle & Blast
    drawStarburstImpact(ctx, tx + 6, ty - 10, "#F59E0B", "#FFFFFF", 36);
    drawMiniRetroStar(ctx, tx + 28, ty - 30, 11, "#FEF08A");
    drawMiniRetroStar(ctx, tx - 26, ty + 12, 9, "#FFFFFF");
    ctx.restore();
  } else if (step >= 3) {
    // Step 3: Dual Kick Impact Afterglow & Radial Burst Lines
    ctx.save();
    ctx.strokeStyle = "rgba(249, 115, 22, 0.6)";
    ctx.lineWidth = 2.5;
    for (let a = 0; a < 8; a++) {
      const ang = (a * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(tx + Math.cos(ang) * 15, ty - 8 + Math.sin(ang) * 15);
      ctx.lineTo(tx + Math.cos(ang) * 38, ty - 8 + Math.sin(ang) * 38);
      ctx.stroke();
    }

    drawMiniRetroStar(ctx, tx - 18, ty - 22, 8, "#FED7AA");
    drawMiniRetroStar(ctx, tx + 20, ty - 16, 10, "#FFFFFF");
    drawMiniRetroStar(ctx, tx, ty + 10, 8, "#F97316");
    ctx.restore();
  }

  ctx.restore();
}
