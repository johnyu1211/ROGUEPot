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
  tipScale: number = 1.0,
  alpha: number = 1.0
) {
  ctx.save();
  if (alpha < 1.0) ctx.globalAlpha = alpha;

  // 1. Deep Dark Forest Shadow Outline
  ctx.strokeStyle = "#064E3B";
  ctx.lineWidth = 3.6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.bezierCurveTo(cx1, cy1, cx2, cy2, tx, ty);
  ctx.stroke();

  // 2. Rich Botanical Vine Body (Deep Lush Green - NOT whitish!)
  ctx.strokeStyle = "#15803D";
  ctx.lineWidth = 2.2;
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

  // 4. Exact Mathematical Tangent Angle at endpoint (tx, ty)
  const tipAngle = Math.atan2(ty - cy2, tx - cx2);

  // 5. Oval Leaf Tip seamlessly aligned with the curve's tangent
  ctx.save();
  ctx.translate(tx, ty);
  ctx.rotate(tipAngle);

  // Tip body (Compact Deep Green Oval extending along curve)
  ctx.fillStyle = "#15803D";
  ctx.beginPath();
  ctx.ellipse(3.5 * tipScale, 0, 7.0 * tipScale, 3.5 * tipScale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#064E3B";
  ctx.lineWidth = 1.1;
  ctx.stroke();

  // Subtle inner leaf spine
  ctx.fillStyle = "#22C55E";
  ctx.beginPath();
  ctx.ellipse(3.0 * tipScale, -0.6 * tipScale, 4.0 * tipScale, 1.4 * tipScale, 0, 0, Math.PI * 2);
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
        0.7,
        0.4
      );
    }
  };

  const drawFrontImpact = () => {
    if (step === 1) {
      // 1타 타격: 적 몸체에 좌상단 -> 우하단 사선 딥그린 덩굴 채찍 참격선 찰싹! + 절제된 타격 플래시
      ctx.save();
      ctx.strokeStyle = "#064E3B";
      ctx.lineWidth = 4.0;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tx - 45 * dirSign, ty - 32);
      ctx.bezierCurveTo(tx - 14 * dirSign, ty - 25, tx - 16 * dirSign, ty - 5, tx + 30 * dirSign, ty + 12);
      ctx.stroke();

      ctx.strokeStyle = "#15803D";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(tx - 45 * dirSign, ty - 32);
      ctx.bezierCurveTo(tx - 14 * dirSign, ty - 25, tx - 16 * dirSign, ty - 5, tx + 30 * dirSign, ty + 12);
      ctx.stroke();

      // 1타 타격 플래시 (컴팩트한 16px 반경)
      const hitGrad1 = ctx.createRadialGradient(tx - 4 * dirSign, ty - 8, 1, tx - 4 * dirSign, ty - 8, 16);
      hitGrad1.addColorStop(0, "#FFFFFF");
      hitGrad1.addColorStop(0.4, "#22C55E");
      hitGrad1.addColorStop(1, "rgba(21, 128, 61, 0.0)");
      ctx.fillStyle = hitGrad1;
      ctx.beginPath();
      ctx.arc(tx - 4 * dirSign, ty - 8, 16, 0, Math.PI * 2);
      ctx.fill();

      drawLeaf(tx - 20 * dirSign, ty - 20, -0.6 * dirSign, 5);
      drawLeaf(tx + 10 * dirSign, ty + 6, 0.8 * dirSign, 4);
      ctx.restore();
    } else if (step === 2) {
      // 2타 타격: 우상단 -> 좌하단 교차 사선 덩굴 채찍 참격 ('X'자 완성) + 절제된 에메랄드 폭발
      ctx.save();
      // 1타 참격선 잔상
      ctx.strokeStyle = "rgba(6, 78, 59, 0.35)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(tx - 45 * dirSign, ty - 32);
      ctx.bezierCurveTo(tx - 14 * dirSign, ty - 25, tx - 16 * dirSign, ty - 5, tx + 30 * dirSign, ty + 12);
      ctx.stroke();

      // 2타 역방향 교차 참격선
      ctx.strokeStyle = "#064E3B";
      ctx.lineWidth = 4.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tx + 45 * dirSign, ty - 32);
      ctx.bezierCurveTo(tx + 14 * dirSign, ty - 22, tx + 18 * dirSign, ty + 6, tx - 25 * dirSign, ty + 16);
      ctx.stroke();

      ctx.strokeStyle = "#15803D";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(tx + 45 * dirSign, ty - 32);
      ctx.bezierCurveTo(tx + 14 * dirSign, ty - 22, tx + 18 * dirSign, ty + 6, tx - 25 * dirSign, ty + 16);
      ctx.stroke();

      // 교차 지점 타격 플래시 (컴팩트한 20px 반경)
      const hitGrad2 = ctx.createRadialGradient(tx, ty - 6, 1, tx, ty - 6, 20);
      hitGrad2.addColorStop(0, "#FFFFFF");
      hitGrad2.addColorStop(0.4, "#22C55E");
      hitGrad2.addColorStop(1, "rgba(21, 128, 61, 0.0)");
      ctx.fillStyle = hitGrad2;
      ctx.beginPath();
      ctx.arc(tx, ty - 6, 20, 0, Math.PI * 2);
      ctx.fill();

      // 폭발하는 나뭇잎 파티클
      drawLeaf(tx + 20 * dirSign, ty - 18, 0.7 * dirSign, 6);
      drawLeaf(tx - 18 * dirSign, ty - 14, -0.5 * dirSign, 5);
      drawLeaf(tx + 14 * dirSign, ty + 12, 1.2 * dirSign, 5);
      drawLeaf(tx - 20 * dirSign, ty + 8, -1.0 * dirSign, 5);
      ctx.restore();
    } else if (step >= 3) {
      // 3단계: 흩날리는 나뭇잎
      ctx.save();
      drawLeaf(tx - 26 * dirSign, ty - 18, -0.4 * dirSign, 4);
      drawLeaf(tx + 22 * dirSign, ty - 20, 0.9 * dirSign, 5);
      drawLeaf(tx + 16 * dirSign, ty + 12, 1.5 * dirSign, 4);
      drawLeaf(tx - 18 * dirSign, ty + 10, -1.2 * dirSign, 4);
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
 * 023 짓밟기 (Stomp): Pokémon approaches upper-left of opponent, tilts forward with perspective scaling, and physically stomps down to crush the opponent flat
 */
export function drawStompEffect(
  ctx: any,
  target: { x: number; y: number },
  step: number = 1,
  layer: "behind" | "front" | "all" = "all"
) {
  ctx.save();
  const tx = target.x;
  const ty = target.y - 8;

  // Step 3: 좌우 은은한 흙먼지 연기 (Subtle Dust Clouds on Press Hold)
  if (step >= 3 && layer !== "behind") {
    ctx.save();
    ctx.fillStyle = "rgba(226, 232, 240, 0.70)";
    ctx.beginPath();
    ctx.arc(tx - 36, ty + 18, 12, 0, Math.PI * 2);
    ctx.arc(tx - 52, ty + 20, 8, 0, Math.PI * 2);
    ctx.arc(tx + 36, ty + 18, 12, 0, Math.PI * 2);
    ctx.arc(tx + 52, ty + 20, 8, 0, Math.PI * 2);
    ctx.fill();
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

  // Deep fighting martial arts amber-orange colors (Authentic Fighting type tone)
  const COLOR_FIGHTING_DEEP = "#C2410C";
  const COLOR_FIGHTING_MAIN = "#EA580C";
  const COLOR_FIGHTING_DARK = "#7C2D12";
  const COLOR_FIGHTING_AMBER = "#D97706";
  const COLOR_FIGHTING_PEACH = "#FED7AA";

  // Helper to draw a stylized martial arts kick foot / boot in deep fighting orange
  const drawKickBoot = (bx: number, by: number, rotAngle: number, scaleX: number = 1) => {
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(rotAngle);
    ctx.scale(scaleX, 1);

    // Boot sole & body
    ctx.fillStyle = COLOR_FIGHTING_DEEP;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLOR_FIGHTING_DARK;
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Boot toe cap highlight
    ctx.fillStyle = COLOR_FIGHTING_PEACH;
    ctx.beginPath();
    ctx.arc(12, 0, 5.5, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    ctx.restore();
  };

  // Helper for crisp comic diamond hit sparks
  const drawDiamondParticle = (cx: number, cy: number, w: number, h: number, angle: number, color: string) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -h);
    ctx.lineTo(w, 0);
    ctx.lineTo(0, h);
    ctx.lineTo(-w, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  if (step === 1) {
    // Step 1: 1타 - 명확한 좌 상단 (Top-Left) 대각선 타격
    ctx.save();
    const hitX = tx - 28;
    const hitY = ty - 26;

    drawKickBoot(hitX - 8, hitY - 6, -0.55, 1.15);

    // Deep fighting orange impact flash (No rings, no straight lines)
    const g = ctx.createRadialGradient(hitX, hitY, 2, hitX, hitY, 24);
    g.addColorStop(0, "#FFF7ED");
    g.addColorStop(0.4, "rgba(234, 88, 12, 0.88)");
    g.addColorStop(1, "rgba(194, 65, 12, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(hitX, hitY, 24, 0, Math.PI * 2);
    ctx.fill();

    // Deep fighting orange diamond sparks & stars
    drawDiamondParticle(hitX - 14, hitY - 14, 4.5, 11, -0.6, COLOR_FIGHTING_AMBER);
    drawDiamondParticle(hitX + 14, hitY - 10, 3.5, 9, 0.4, COLOR_FIGHTING_MAIN);
    drawDiamondParticle(hitX - 12, hitY + 12, 4, 10, 0.8, COLOR_FIGHTING_DEEP);
    drawMiniRetroStar(ctx, hitX - 16, hitY - 18, 8, COLOR_FIGHTING_PEACH);
    drawMiniRetroStar(ctx, hitX + 16, hitY + 10, 7, "#FFFFFF");
    ctx.restore();
  } else if (step === 2) {
    // Step 2: 2타 - 명확한 우 하단 (Bottom-Right) 대각선 타격
    ctx.save();
    const hitX = tx + 26;
    const hitY = ty + 18;

    drawKickBoot(hitX + 8, hitY + 6, 0.60, -1.2);

    // Deep fighting orange impact flash
    const g = ctx.createRadialGradient(hitX, hitY, 2, hitX, hitY, 28);
    g.addColorStop(0, "#FFF7ED");
    g.addColorStop(0.4, "rgba(234, 88, 12, 0.92)");
    g.addColorStop(1, "rgba(194, 65, 12, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(hitX, hitY, 28, 0, Math.PI * 2);
    ctx.fill();

    // Deep fighting orange diamond sparks & stars
    drawDiamondParticle(hitX + 16, hitY + 14, 5, 13, 0.5, COLOR_FIGHTING_AMBER);
    drawDiamondParticle(hitX - 14, hitY + 12, 4, 10, -0.7, COLOR_FIGHTING_MAIN);
    drawDiamondParticle(hitX + 16, hitY - 12, 4.5, 11, -0.4, COLOR_FIGHTING_DEEP);
    drawDiamondParticle(hitX - 12, hitY - 16, 3.5, 8, 0.3, COLOR_FIGHTING_PEACH);
    drawMiniRetroStar(ctx, hitX + 20, hitY + 18, 10, COLOR_FIGHTING_PEACH);
    drawMiniRetroStar(ctx, hitX - 18, hitY - 12, 8, "#FFFFFF");
    ctx.restore();
  } else if (step >= 3) {
    // Step 3: 좌상단 + 우하단 타격 지점의 듀얼 잔상 (Afterglow)
    ctx.save();
    const hitX1 = tx - 28, hitY1 = ty - 26;
    const hitX2 = tx + 26, hitY2 = ty + 18;

    // Top-Left remnants
    drawDiamondParticle(hitX1 - 16, hitY1 - 12, 3.5, 8, -0.4, COLOR_FIGHTING_AMBER);
    drawMiniRetroStar(ctx, hitX1 - 12, hitY1 - 16, 7, COLOR_FIGHTING_PEACH);

    // Bottom-Right remnants
    drawDiamondParticle(hitX2 + 16, hitY2 + 12, 3.5, 8, 0.5, COLOR_FIGHTING_MAIN);
    drawMiniRetroStar(ctx, hitX2 + 14, hitY2 + 14, 7, "#FFFFFF");
    drawMiniRetroStar(ctx, tx, ty, 8, COLOR_FIGHTING_DEEP);
    ctx.restore();
  }

  ctx.restore();
}
