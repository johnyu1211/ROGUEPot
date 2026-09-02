import { drawMiniRetroStar, drawStarburstImpact } from "../common/helpers.js";

/**
 * Helper: Comic/Manga Sharp Physical Hit Burst Polygon
 */
function drawComicHitBurst(
  ctx: any,
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  points: number = 8,
  color: string = "#FFFFFF",
  strokeColor: string = "#D97706"
) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3.0;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * 021 힘껏치기 (Slam): Explosive Forward Physical Slam with Pure Comic Hit Burst (Zero weird lines)
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
    // Step 1: Still / Tension windup (No visual overlay on defender)
  } else if (step === 2) {
    // Step 2: 팍! (BAM!) Pure Comic Physical Hit Burst
    ctx.save();
    // 1. Soft glowing aura
    const hitGrad = ctx.createRadialGradient(tx, ty, 5, tx, ty, 48);
    hitGrad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    hitGrad.addColorStop(0.4, "rgba(251, 191, 36, 0.7)");
    hitGrad.addColorStop(0.8, "rgba(245, 158, 11, 0.3)");
    hitGrad.addColorStop(1, "rgba(245, 158, 11, 0.0)");
    ctx.fillStyle = hitGrad;
    ctx.beginPath();
    ctx.arc(tx, ty, 48, 0, Math.PI * 2);
    ctx.fill();

    // 2. Outer sharp jagged physical impact burst
    drawComicHitBurst(ctx, tx, ty, 44, 22, 8, "#FDE047", "#D97706");

    // 3. Inner hot white core flash
    drawComicHitBurst(ctx, tx, ty, 26, 12, 8, "#FFFFFF", "#F59E0B");
    ctx.restore();
  } else if (step >= 3) {
    // Step 3: Dissipating impact afterglow (softly fading)
    ctx.save();
    ctx.globalAlpha = 0.55;
    drawComicHitBurst(ctx, tx, ty, 32, 16, 8, "#FEF08A", "#F59E0B");
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Helper: Single Slender Curved Vine Stem with Compact Oval Tip (Deep Botanical Forest Green)
 */
function drawSingleVine(
  ctx: any,
  x0: number,
  y0: number,
  cx1: number,
  cy1: number,
  cx2: number,
  cy2: number,
  tx: number,
  ty: number,
  tipAngle: number,
  tipScale: number = 1.0,
  alpha: number = 1.0
) {
  ctx.save();
  if (alpha < 1.0) ctx.globalAlpha = alpha;

  // 1. Deep Dark Forest Shadow Outline
  ctx.strokeStyle = "#064E3B";
  ctx.lineWidth = 3.8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.bezierCurveTo(cx1, cy1, cx2, cy2, tx, ty);
  ctx.stroke();

  // 2. Rich Botanical Vine Body (Deep Lush Green - NOT whitish!)
  ctx.strokeStyle = "#15803D";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.bezierCurveTo(cx1, cy1, cx2, cy2, tx, ty);
  ctx.stroke();

  // 3. Subtle Leaf Gloss Spine (Rich Emerald - NO washed out white!)
  ctx.strokeStyle = "#22C55E";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.bezierCurveTo(cx1, cy1, cx2, cy2, tx, ty);
  ctx.stroke();

  // 4. Compact Oval Leaf Tip (Deep Forest Green)
  ctx.save();
  ctx.translate(tx, ty);
  ctx.rotate(tipAngle);

  // Tip body (Compact Deep Green Oval)
  ctx.fillStyle = "#15803D";
  ctx.beginPath();
  ctx.ellipse(0, 0, 8.5 * tipScale, 4.2 * tipScale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#064E3B";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Subtle inner leaf spine
  ctx.fillStyle = "#22C55E";
  ctx.beginPath();
  ctx.ellipse(-1.0 * tipScale, -0.8 * tipScale, 4.5 * tipScale, 1.8 * tipScale, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  ctx.restore();
}

/**
 * 022 덩굴채찍 (Vine Whip): Slender organic deep green vines emerging from behind caster with compact oval tips & target cross slash cuts
 */
export function drawVineWhipEffect(
  ctx: any,
  start: { x: number; y: number },
  target: { x: number; y: number },
  step: number = 1,
  layer: "behind" | "front" | "all" = "all"
) {
  ctx.save();
  const tx = target.x;
  const ty = target.y - 8;
  const dx = target.x - start.x;
  const dy = target.y - start.y;

  // Helper to draw a stylized leaf particle
  const drawLeaf = (lx: number, ly: number, angle: number, size: number) => {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(angle);
    ctx.fillStyle = "#15803D";
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(size * 0.8, 0, 0, size);
    ctx.quadraticCurveTo(-size * 0.8, 0, 0, -size);
    ctx.fill();
    ctx.strokeStyle = "#064E3B";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  };

  const isFacingRight = dx > 0;
  const dirSign = isFacingRight ? 1 : -1;

  const drawBehindVines = () => {
    if (step === 1) {
      // 1타: 시전자 등 뒤 좌측에서 돋아나 시전자 전방으로 길고 우아하게 뻗어나가는 1차 덩굴 채찍
      drawSingleVine(
        ctx,
        start.x - 10 * dirSign,
        start.y - 16,
        start.x - 30 * dirSign,
        start.y - 55,
        start.x + 35 * dirSign,
        start.y - 75,
        start.x + 75 * dirSign,
        start.y - 38,
        0.65 * dirSign,
        1.0
      );
    } else if (step === 2) {
      // 2타: 1차 덩굴 페이드 + 시전자 등 뒤 우측에서 돋아나 전방으로 길게 휘둘러지는 2차 덩굴 채찍
      drawSingleVine(
        ctx,
        start.x - 10 * dirSign,
        start.y - 16,
        start.x - 30 * dirSign,
        start.y - 55,
        start.x + 35 * dirSign,
        start.y - 75,
        start.x + 75 * dirSign,
        start.y - 38,
        0.65 * dirSign,
        0.85,
        0.35
      );
      drawSingleVine(
        ctx,
        start.x + 10 * dirSign,
        start.y - 8,
        start.x + 45 * dirSign,
        start.y + 20,
        start.x + 85 * dirSign,
        start.y - 5,
        start.x + 78 * dirSign,
        start.y - 55,
        -1.15 * dirSign,
        1.0
      );
    } else if (step >= 3) {
      // 3단계: 덩굴이 시전자 등 뒤로 부드럽게 회수
      drawSingleVine(
        ctx,
        start.x - 10 * dirSign,
        start.y - 16,
        start.x - 12 * dirSign,
        start.y - 35,
        start.x + 12 * dirSign,
        start.y - 38,
        start.x + 22 * dirSign,
        start.y - 20,
        0.5 * dirSign,
        0.7,
        0.4
      );
    }
  };

  const drawFrontImpact = () => {
    if (step === 1) {
      // 1타 타격: 적 몸체에 좌상단 -> 우하단 사선 딥그린 덩굴 채찍 참격선 찰싹! + 타격 플래시
      ctx.save();
      ctx.strokeStyle = "#064E3B";
      ctx.lineWidth = 5.0;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tx - 48 * dirSign, ty - 36);
      ctx.bezierCurveTo(tx - 14 * dirSign, ty - 28, tx - 16 * dirSign, ty - 5, tx + 32 * dirSign, ty + 14);
      ctx.stroke();

      ctx.strokeStyle = "#15803D";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(tx - 48 * dirSign, ty - 36);
      ctx.bezierCurveTo(tx - 14 * dirSign, ty - 28, tx - 16 * dirSign, ty - 5, tx + 32 * dirSign, ty + 14);
      ctx.stroke();

      // 1타 타격 플래시 (Lush Green)
      const hitGrad1 = ctx.createRadialGradient(tx - 5 * dirSign, ty - 10, 2, tx - 5 * dirSign, ty - 10, 26);
      hitGrad1.addColorStop(0, "#FFFFFF");
      hitGrad1.addColorStop(0.35, "#22C55E");
      hitGrad1.addColorStop(0.8, "rgba(21, 128, 61, 0.4)");
      hitGrad1.addColorStop(1, "rgba(21, 128, 61, 0.0)");
      ctx.fillStyle = hitGrad1;
      ctx.beginPath();
      ctx.arc(tx - 5 * dirSign, ty - 10, 26, 0, Math.PI * 2);
      ctx.fill();

      drawLeaf(tx - 22 * dirSign, ty - 24, -0.6 * dirSign, 6);
      drawLeaf(tx + 12 * dirSign, ty + 8, 0.8 * dirSign, 5);
      ctx.restore();
    } else if (step === 2) {
      // 2타 타격: 우상단 -> 좌하단 교차 사선 덩굴 채찍 참격 ('X'자 완성) + 대형 에메랄드 폭발
      ctx.save();
      // 1타 참격선 잔상
      ctx.strokeStyle = "rgba(6, 78, 59, 0.4)";
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(tx - 48 * dirSign, ty - 36);
      ctx.bezierCurveTo(tx - 14 * dirSign, ty - 28, tx - 16 * dirSign, ty - 5, tx + 32 * dirSign, ty + 14);
      ctx.stroke();

      // 2타 역방향 교차 참격선
      ctx.strokeStyle = "#064E3B";
      ctx.lineWidth = 5.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tx + 48 * dirSign, ty - 36);
      ctx.bezierCurveTo(tx + 14 * dirSign, ty - 24, tx + 20 * dirSign, ty + 8, tx - 28 * dirSign, ty + 18);
      ctx.stroke();

      ctx.strokeStyle = "#15803D";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(tx + 48 * dirSign, ty - 36);
      ctx.bezierCurveTo(tx + 14 * dirSign, ty - 24, tx + 20 * dirSign, ty + 8, tx - 28 * dirSign, ty + 18);
      ctx.stroke();

      // 교차 지점 대형 타격 플래시
      const hitGrad2 = ctx.createRadialGradient(tx, ty - 6, 2, tx, ty - 6, 32);
      hitGrad2.addColorStop(0, "#FFFFFF");
      hitGrad2.addColorStop(0.35, "#22C55E");
      hitGrad2.addColorStop(0.8, "rgba(21, 128, 61, 0.4)");
      hitGrad2.addColorStop(1, "rgba(21, 128, 61, 0.0)");
      ctx.fillStyle = hitGrad2;
      ctx.beginPath();
      ctx.arc(tx, ty - 6, 32, 0, Math.PI * 2);
      ctx.fill();

      // 폭발하는 나뭇잎 파티클
      drawLeaf(tx + 22 * dirSign, ty - 20, 0.7 * dirSign, 7);
      drawLeaf(tx - 20 * dirSign, ty - 16, -0.5 * dirSign, 6);
      drawLeaf(tx + 16 * dirSign, ty + 14, 1.2 * dirSign, 6);
      drawLeaf(tx - 22 * dirSign, ty + 10, -1.0 * dirSign, 6);
      ctx.restore();
    } else if (step >= 3) {
      // 3단계: 흩날리는 나뭇잎
      ctx.save();
      drawLeaf(tx - 30 * dirSign, ty - 20, -0.4 * dirSign, 5);
      drawLeaf(tx + 26 * dirSign, ty - 22, 0.9 * dirSign, 6);
      drawLeaf(tx + 18 * dirSign, ty + 14, 1.5 * dirSign, 5);
      drawLeaf(tx - 22 * dirSign, ty + 12, -1.2 * dirSign, 5);
      ctx.restore();
    }
  };

  if (layer === "behind") {
    drawBehindVines();
  } else if (layer === "front") {
    drawFrontImpact();
  } else {
    // "all"
    drawBehindVines();
    drawFrontImpact();
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
