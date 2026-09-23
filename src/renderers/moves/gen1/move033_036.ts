import { drawStarburstImpact, drawMiniRetroStar } from "../common/helpers.js";

/**
 * Sharp Comic Impact Starburst Polygon (날카로운 만화풍 충돌 섬광 스타버스트 💥)
 */
function drawSharpImpactBurst(
  ctx: any,
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  points: number = 8,
  fillColor: string = "#FFFFFF",
  strokeColor: string = "#FEF08A",
  lineWidth: number = 2.0,
  rotation: number = 0
) {
  ctx.save();
  ctx.translate(cx, cy);
  if (rotation !== 0) ctx.rotate(rotation);

  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "miter";
  ctx.miterLimit = 4;

  ctx.beginPath();
  const step = Math.PI / points;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const a = i * step - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  if (strokeColor && lineWidth > 0) ctx.stroke();
  ctx.restore();
}

/**
 * 033: 몸통박치기 (Tackle) Visual Effect
 * 
 * Concept: Authentic Gen 5 Normal-Type Physical Tackle
 * 
 * - Behind (시전자 후방 레이어):
 *   - Step 1: 도움닫기 발밑 흙먼지 퍼프
 *   - Step 2: 전방 고속 쇄도 흰색 스피드 대시 스트릭 라인
 * 
 * - Front (대상 전면 타격 레이어):
 *   - Step 3 (정면 격돌):
 *     1. 순백 섬광 코어 (#FFFFFF) & 부드러운 크림빛 오라
 *     2. 날카로운 8방향 정통 충돌 스타버스트 💥 (Sharp Comic Impact Starburst)
 *     3. 순백 고속 팽창 충격파 링 확산
 *     4. 4방향 레트로 별빛 스파크 비산 (drawMiniRetroStar)
 *     5. 충돌 모멘텀 전방 관통 속도선 (3줄)
 *   - Step 4 (충돌 반동 및 잔향):
 *     - 충격파 링 확장 소멸, 미세 별빛 페이드아웃
 */
export function drawTackleBehindEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  step: number = 2,
  progress: number = 0.5,
  isPlayer: boolean = true
) {
  if (step === 1) {
    // 1. 도움닫기 웅크림 시 발밑 흙먼지
    const footX = attackerPos.x;
    const footY = attackerPos.y + 18;
    ctx.save();
    ctx.fillStyle = "rgba(209, 213, 219, 0.65)";
    ctx.beginPath();
    ctx.arc(footX - (isPlayer ? 10 : -10), footY, 4.5, 0, Math.PI * 2);
    ctx.arc(footX - (isPlayer ? 16 : -16), footY - 1, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (step === 2) {
    // 2. 고속 쇄도 시전자 후방 스피드 스트림
    ctx.save();
    const ax = attackerPos.x;
    const ay = attackerPos.y;
    const tx = targetPos.x;
    const ty = targetPos.y;
    const angle = Math.atan2(ty - ay, tx - ax);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const perpX = -sin;
    const perpY = cos;

    const streakOffsets = [-14, -5, 6, 15];
    for (let i = 0; i < streakOffsets.length; i++) {
      const off = streakOffsets[i];
      const startDist = -12 - (i % 2) * 8;
      const endDist = -52 - (i % 3) * 14;

      const sx = ax + perpX * off + cos * startDist;
      const sy = ay + perpY * off + sin * startDist;
      const ex = ax + perpX * off + cos * endDist;
      const ey = ay + perpY * off + sin * endDist;

      const grad = ctx.createLinearGradient(sx, sy, ex, ey);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.85)");
      grad.addColorStop(0.5, "rgba(241, 245, 249, 0.55)");
      grad.addColorStop(1, "rgba(226, 232, 240, 0)");

      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function drawTackleEffect(
  ctx: any,
  targetPos: { x: number; y: number },
  attackerPos?: { x: number; y: number },
  step: number = 3,
  progress: number = 0.65,
  isPlayer: boolean = true
) {
  if (step < 3) return;

  const tx = targetPos.x;
  const ty = targetPos.y;
  const p = Math.max(0, Math.min(1, progress));

  ctx.save();

  if (step === 3) {
    // 1. 순백 중심 섬광 코어 (Central Impact Flash Core)
    const flashAlpha = Math.max(0, 1.0 - p * 0.75);
    if (flashAlpha > 0.05) {
      const coreR = (22 + (1.0 - p) * 14);
      const grad = ctx.createRadialGradient(tx, ty, 2, tx, ty, coreR);
      grad.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
      grad.addColorStop(0.35, `rgba(254, 240, 138, ${flashAlpha * 0.9})`);
      grad.addColorStop(0.75, `rgba(253, 224, 71, ${flashAlpha * 0.4})`);
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(tx, ty, coreR, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. 날카로운 정통 충돌 스타버스트 💥 (Sharp Comic Impact Starburst)
    const burstAlpha = Math.max(0, 1.0 - p * 0.85);
    if (burstAlpha > 0.05) {
      const outerR = 18 + p * 16;
      const innerR = outerR * 0.44;
      drawSharpImpactBurst(
        ctx,
        tx,
        ty,
        outerR,
        innerR,
        8,
        `rgba(255, 255, 255, ${burstAlpha})`,
        `rgba(253, 224, 71, ${burstAlpha * 0.95})`,
        2.4,
        p * 0.35
      );
    }

    // 3. 순백 고속 팽창 충격파 링 (Expanding Shockwave Ring)
    const ringAlpha = Math.max(0, 1.0 - p * 0.9);
    if (ringAlpha > 0.05) {
      const rx = 14 + p * 26;
      const ry = rx * 0.72;
      ctx.strokeStyle = `rgba(255, 255, 255, ${ringAlpha})`;
      ctx.lineWidth = 2.8 * (1.0 - p * 0.3);
      ctx.beginPath();
      ctx.ellipse(tx, ty, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(254, 240, 138, ${ringAlpha * 0.6})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(tx, ty, rx + 3, ry + 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 4. 사방 비산 4방향 레트로 별빛 스파크 (Flying Mini Retro Hit Stars)
    const starAlpha = Math.max(0, 1.0 - p * 0.75);
    if (starAlpha > 0.05) {
      const starAngles = [-0.65, 0.45, 1.75, 2.85, -2.15, -1.25];
      for (let i = 0; i < starAngles.length; i++) {
        const a = starAngles[i];
        const dist = 10 + p * (22 + (i % 3) * 8);
        const sx = tx + Math.cos(a) * dist;
        const sy = ty + Math.sin(a) * (dist * 0.85);
        const sz = (10 - p * 3) * (i % 2 === 0 ? 1.0 : 0.75);
        ctx.globalAlpha = starAlpha;
        drawMiniRetroStar(
          ctx,
          sx,
          sy,
          sz,
          i % 2 === 0 ? "#FFFFFF" : "#FEF08A",
          a + p * 1.5
        );
        ctx.globalAlpha = 1.0;
      }
    }

    // 5. 충돌 모멘텀 전방 관통 속도선 (Directional Penetration Streak Lines)
    const lineAlpha = Math.max(0, 0.95 - p * 1.05);
    if (lineAlpha > 0.05) {
      let dirAngle = isPlayer ? -0.42 : 2.72;
      if (attackerPos) {
        dirAngle = Math.atan2(ty - attackerPos.y, tx - attackerPos.x);
      }
      const cos = Math.cos(dirAngle);
      const sin = Math.sin(dirAngle);
      const perpX = -sin;
      const perpY = cos;

      const punchOffsets = [-14, 0, 14];
      for (let i = 0; i < punchOffsets.length; i++) {
        const off = punchOffsets[i];
        const startDist = -14 + p * 10;
        const endDist = 24 + (i === 1 ? 16 : 8) + p * 20;

        const x1 = tx + perpX * off + cos * startDist;
        const y1 = ty + perpY * off + sin * startDist;
        const x2 = tx + perpX * off + cos * endDist;
        const y2 = ty + perpY * off + sin * endDist;

        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, "rgba(255, 255, 255, 0)");
        grad.addColorStop(0.3, `rgba(255, 255, 255, ${lineAlpha})`);
        grad.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.strokeStyle = grad;
        ctx.lineWidth = i === 1 ? 2.8 : 1.8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
  } else if (step === 4) {
    // 4단계 잔향 (소멸하는 충격파 링)
    const fadeAlpha = Math.max(0, 0.45 * (1.0 - p));
    if (fadeAlpha > 0.03) {
      const rx = 34 + p * 14;
      const ry = rx * 0.72;
      ctx.strokeStyle = `rgba(255, 255, 255, ${fadeAlpha})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(tx, ty, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

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
  const { targetPos, attackerPos, isPlayer: isP } = drawCtx;
  const tx = targetPos.x;
  const ty = targetPos.y;
  const p = Math.max(0, Math.min(1, frame?.effectProgress ?? 0.65));
  const step = frame?.moveStep ?? 2;

  ctx.save();

  if (step === 2) {
    // 1. 순백 & 고에너지 오렌지 섬광 코어 (Flash Core)
    const flashAlpha = Math.max(0, 1.0 - p * 0.7);
    if (flashAlpha > 0.05) {
      const coreR = 24 + (1.0 - p) * 16;
      const grad = ctx.createRadialGradient(tx, ty, 2, tx, ty, coreR);
      grad.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
      grad.addColorStop(0.35, `rgba(254, 215, 170, ${flashAlpha * 0.9})`);
      grad.addColorStop(0.70, `rgba(249, 115, 22, ${flashAlpha * 0.5})`);
      grad.addColorStop(1, "rgba(234, 88, 12, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(tx, ty, coreR, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. 날카로운 고에너지 오렌지 충돌 스타버스트 💥 (Orange Comic Impact Starburst)
    const burstAlpha = Math.max(0, 1.0 - p * 0.85);
    if (burstAlpha > 0.05) {
      const outerR = 20 + p * 18;
      const innerR = outerR * 0.44;
      drawSharpImpactBurst(
        ctx,
        tx,
        ty,
        outerR,
        innerR,
        8,
        `rgba(255, 255, 255, ${burstAlpha})`,
        `rgba(249, 115, 22, ${burstAlpha * 0.95})`,
        2.6,
        p * 0.35
      );
    }

    // 3. 고속 팽창 오렌지 충격파 링 (Expanding Orange Shockwave Ring)
    const ringAlpha = Math.max(0, 1.0 - p * 0.9);
    if (ringAlpha > 0.05) {
      const rx = 16 + p * 30;
      const ry = rx * 0.75;
      ctx.strokeStyle = `rgba(255, 255, 255, ${ringAlpha})`;
      ctx.lineWidth = 3.0 * (1.0 - p * 0.3);
      ctx.beginPath();
      ctx.ellipse(tx, ty, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(249, 115, 22, ${ringAlpha * 0.75})`;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.ellipse(tx, ty, rx + 4, ry + 2.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 4. 사방 비산 오렌지/황금 레트로 별빛 스파크 (Flying Mini Retro Hit Stars)
    const starAlpha = Math.max(0, 1.0 - p * 0.75);
    if (starAlpha > 0.05) {
      const starAngles = [-0.65, 0.45, 1.75, 2.85, -2.15, -1.25];
      for (let i = 0; i < starAngles.length; i++) {
        const a = starAngles[i];
        const dist = 12 + p * (26 + (i % 3) * 10);
        const sx = tx + Math.cos(a) * dist;
        const sy = ty + Math.sin(a) * (dist * 0.85);
        const sz = (11 - p * 3.5) * (i % 2 === 0 ? 1.0 : 0.75);
        ctx.globalAlpha = starAlpha;
        drawMiniRetroStar(
          ctx,
          sx,
          sy,
          sz,
          i % 2 === 0 ? "#FFFFFF" : "#F97316",
          a + p * 1.5
        );
        ctx.globalAlpha = 1.0;
      }
    }

    // 5. 돌진 관통 방향성 오렌지 속도선
    const streakAlpha = Math.max(0, 0.95 - p * 1.05);
    if (streakAlpha > 0.05) {
      let dirAngle = isP ? -0.42 : 2.72;
      if (attackerPos) {
        dirAngle = Math.atan2(ty - attackerPos.y, tx - attackerPos.x);
      }
      const cos = Math.cos(dirAngle);
      const sin = Math.sin(dirAngle);
      const perpX = -sin;
      const perpY = cos;

      const streakOffsets = [-16, 0, 16];
      for (let i = 0; i < streakOffsets.length; i++) {
        const off = streakOffsets[i];
        const startDist = -16 + p * 10;
        const endDist = 28 + (i === 1 ? 18 : 8) + p * 22;

        const x1 = tx + perpX * off + cos * startDist;
        const y1 = ty + perpY * off + sin * startDist;
        const x2 = tx + perpX * off + cos * endDist;
        const y2 = ty + perpY * off + sin * endDist;

        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, "rgba(255, 255, 255, 0)");
        grad.addColorStop(0.3, `rgba(255, 255, 255, ${streakAlpha})`);
        grad.addColorStop(0.7, `rgba(249, 115, 22, ${streakAlpha * 0.8})`);
        grad.addColorStop(1, "rgba(234, 88, 12, 0)");

        ctx.strokeStyle = grad;
        ctx.lineWidth = i === 1 ? 3.0 : 2.0;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
  } else if (step === 3) {
    // 3단계 잔향 (소멸하는 오렌지 충격파 링)
    const fadeAlpha = Math.max(0, 0.45 * (1.0 - p));
    if (fadeAlpha > 0.03) {
      const rx = 36 + p * 16;
      const ry = rx * 0.75;
      ctx.strokeStyle = `rgba(249, 115, 22, ${fadeAlpha})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(tx, ty, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

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
