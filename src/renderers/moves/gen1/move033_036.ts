import { drawStarburstImpact } from "../common/helpers.js";

/**
 * 036: 돌진 (Take Down) Visual Effect
 * 
 * Concept:
 * - High-speed heavy body tackle with vibrant ORANGE (#F97316 / #EA580C) impact burst
 * - Radial orange shockwave rings and sharp orange impact bursts at target
 */
export function drawTakeDownEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    [key: string]: any;
  }
) {
  const { targetPos, isPlayer: isP } = drawCtx;
  const tx = targetPos.x;
  const ty = targetPos.y;

  ctx.save();

  // 1. Core vibrant orange starburst impact
  drawStarburstImpact(ctx, tx, ty, "#EA580C", "#FED7AA", 38);

  // 2. High-energy orange shockwave ring
  ctx.strokeStyle = "#F97316";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(tx, ty, 28, 0, Math.PI * 2);
  ctx.stroke();

  // 3. Sharp orange impact streaks radiating outwards (바깥쪽으로 투명하게 페이드)
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + (isP ? -0.4 : 2.7);
    const rInner = 14;
    const rOuter = 38 + (i % 2) * 10;
    const x1 = tx + Math.cos(angle) * rInner;
    const y1 = ty + Math.sin(angle) * rInner;
    const x2 = tx + Math.cos(angle) * rOuter;
    const y2 = ty + Math.sin(angle) * rOuter;

    const streakGrad = ctx.createLinearGradient(x1, y1, x2, y2);
    streakGrad.addColorStop(0, "#FFFFFF");
    streakGrad.addColorStop(0.35, "#F97316");
    streakGrad.addColorStop(1, "rgba(234, 88, 12, 0)");

    ctx.strokeStyle = streakGrad;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // 4. Pure white flash core
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(tx, ty, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 034: 누르기 (Body Slam) Visual Effect
 * 
 * Concept:
 * - Heavy body press impact: wide horizontal shockwave ring + downward impact burst lines
 */
export function drawBodySlamEffect(
  ctx: any,
  targetPos: { x: number; y: number },
  step: number = 1
) {
  ctx.save();
  const tx = targetPos.x;
  const ty = targetPos.y + 16;

  // [유저 요구사항] 과한 폭발/스타버스트 완전 제거!
  // 지긋이 누르는 묵직한 바닥 눌림 타원형 먼지/압박선만 은은하게 연출
  ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(tx, ty, 42, 12, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(214, 211, 209, 0.40)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(tx, ty, 58, 16, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 좌우로 살짝 퍼지는 은은한 지면 먼지 압력 점들
  ctx.fillStyle = "rgba(230, 230, 230, 0.50)";
  const dustOffsets = [-48, -36, -24, 24, 36, 48];
  for (const ox of dustOffsets) {
    ctx.beginPath();
    ctx.arc(tx + ox, ty + (Math.sin(ox) * 2), 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 035: 김밥말이 (Wrap) Visual Effect
 * 
 * Concept:
 * - Serpentine coiling spiral bands winding in 360° around the spinning target
 * - Dynamic spiral ribbons + impact burst on tight constriction
 */
export function drawWrapEffect(
  ctx: any,
  targetPos: { x: number; y: number },
  step: number = 1
) {
  ctx.save();
  const tx = targetPos.x;
  const ty = targetPos.y - 10;

  let progress = 1.0;
  if (step === 1) progress = 0.25;
  else if (step === 2) progress = 0.50;
  else if (step === 3) progress = 0.75;
  else if (step >= 4) progress = 1.0;

  const squeeze = (step === 4 || step === 5) ? 0.72 : 1.0;
  const alpha = step >= 6 ? 0.45 : 1.0;
  ctx.globalAlpha = alpha;

  const totalPoints = Math.max(10, Math.floor(60 * progress));
  const totalTurns = 2.5 * Math.PI * 2;
  const startAngle = -0.25 * Math.PI;

  const points: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i <= totalPoints; i++) {
    const u = i / 60;
    if (u > progress) break;
    const angle = startAngle + u * totalTurns;
    const rx = 34 * squeeze;
    const ry = 11 * squeeze;
    const yCenter = (ty + 16) - u * 34;

    const px = tx + rx * Math.cos(angle);
    const py = yCenter + ry * Math.sin(angle);
    const pz = Math.sin(angle);
    points.push({ x: px, y: py, z: pz });
  }

  if (points.length >= 2) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Layer 1: Soft Golden Foundation Outline (조이기와 100% 동일한 황금빛 외곽선)
    ctx.strokeStyle = "#CA8A04";
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    // Layer 2: Soft Luminous Light Yellow Body (조이기와 동일한 부드러운 노란색 몸체)
    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    // Layer 3: Pure Light Pale Cream / White Braided Highlight (꼬임 밧줄 질감)
    ctx.save();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.6;
    ctx.setLineDash([7, 4]);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.restore();

    // Leading Thread Glow Tip
    if (progress < 1.0 && points.length > 0) {
      const tip = points[points.length - 1];
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // [유저 요구사항] 이후 타격 폭발/스타버스트 이펙트 완전 제거!

  ctx.restore();
}
