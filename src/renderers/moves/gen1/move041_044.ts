// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import {
  drawMiniRetroStar,
  drawStarburstImpact,
} from "../common/helpers.js";

/**
 * Helper: Draw a sleek, slender yellowish cone horn with rounded base (더블니들용 얇은 뿔)
 * - 뿔찌르기(Horn Attack)의 공식 아이보리/호박색 3D 명암 텍스처를 100% 동일하게 유지
 * - 유저 요청 반영: 뿔 두께를 슬림하고 날렵하게 조정 (baseRadius: 9.5px, 얇고 예리한 니들 형태)
 * - 유저 요청 반영: 뾰족함을 온전히 드러내기 위해 뿔 앞쪽 끝의 별(Glint Star)을 완전히 제거하여 순수한 바늘 끝 노출
 */
function drawSlenderYellowHorn(
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

  const length = 55 * scale;
  const baseRadius = 9.5 * scale; // 얇고 날렵한 비율 (기존 16px -> 9.5px로 슬림화)

  // 1. Outer Dark Contour (Sleek slender cone with smoothly rounded base)
  ctx.beginPath();
  ctx.moveTo(length, 0); // Sharp Needle Tip
  ctx.lineTo(0, -baseRadius); // Upper straight flank
  ctx.quadraticCurveTo(-6 * scale, 0, 0, baseRadius); // Rounded base cap
  ctx.lineTo(length, 0); // Lower straight flank
  ctx.closePath();
  ctx.fillStyle = "#78350F"; // Dark Amber border (뿔찌르기와 동일)
  ctx.fill();

  // 2. Inner Conical Body Fill with 3D cylindrical lighting (Horn Attack Natural Ivory Palette)
  const bodyGrad = ctx.createLinearGradient(0, -baseRadius, 0, baseRadius);
  bodyGrad.addColorStop(0.0, "#FAF7EE"); // Soft ivory rim light
  bodyGrad.addColorStop(0.20, "#FFFFFF"); // Specular sheen
  bodyGrad.addColorStop(0.48, "#F4EBD9"); // Natural rich ivory cream
  bodyGrad.addColorStop(0.78, "#DECDB0"); // Soft bone shading
  bodyGrad.addColorStop(1.0, "#A89878"); // Natural bone shadow on bottom flank

  ctx.beginPath();
  ctx.moveTo(length - 1.5, 0);
  ctx.lineTo(1.2, -baseRadius + 1.5);
  ctx.quadraticCurveTo(-4.5 * scale, 0, 1.2, baseRadius - 1.5);
  ctx.lineTo(length - 1.5, 0);
  ctx.closePath();
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // 3. Central Specular Highlight Streak along the cone axis
  const sheenGrad = ctx.createLinearGradient(0, 0, length, 0);
  sheenGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.2)");
  sheenGrad.addColorStop(0.65, "rgba(255, 255, 255, 0.85)");
  sheenGrad.addColorStop(1.0, "#FFFFFF");

  ctx.strokeStyle = sheenGrad;
  ctx.lineWidth = 1.6 * scale;
  ctx.beginPath();
  ctx.moveTo(2, -baseRadius * 0.22);
  ctx.lineTo(length - 1, 0);
  ctx.stroke();

  // ⚠️ 뿔 앞쪽 끝의 별(Glint star)은 뾰족함을 살리기 위해 완전히 제거!

  ctx.restore();
}

/**
 * Helper to draw an aerodynamic straight speedline trail behind a flying horn
 */
function drawHornStraightSpeedTrail(
  ctx: any,
  x: number,
  y: number,
  angle: number,
  length: number = 85
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // 1. Center intense glowing core streak
  const grad = ctx.createLinearGradient(0, 0, -length, 0);
  grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
  grad.addColorStop(0.2, "rgba(254, 240, 138, 0.85)");
  grad.addColorStop(0.6, "rgba(245, 158, 11, 0.40)");
  grad.addColorStop(1, "rgba(245, 158, 11, 0.0)");

  ctx.strokeStyle = grad;
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-length, 0);
  ctx.stroke();

  // 2. Parallel outer aerodynamic slipstream lines
  ctx.strokeStyle = "rgba(254, 240, 138, 0.65)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-6, -7);
  ctx.lineTo(-length * 0.72, -7);
  ctx.moveTo(-6, 7);
  ctx.lineTo(-length * 0.72, 7);
  ctx.stroke();

  ctx.restore();
}

/**
 * 041: 더블니들 (Twineedle) Visual Effect
 * 
 * - 뿔찌르기(Horn Attack) 공식 검수 황금빛/아이보리 텍스처 재사용하되 더 얇고 날렵한 니들 비율 적용
 * - 뿔 앞쪽의 별(Glint star)을 제거하여 본래의 날카로운 바늘 끝을 온전히 노출
 * - 2개의 뿔이 직선 나란히(side-by-side parallel) 배치되어 고속 쇄도
 * - 2중 뿔 동시 관통 격돌 (좌우 2중 타격 스파크 및 충격파)
 * 
 * - Step 1: 시전자 전면에 2개의 얇은 뿔이 나란히 생성되며 조준 & 장전
 * - Step 2: 2개의 뿔이 직선으로 나란히 고속 비행 (스피드 트레일)
 * - Step 3: 목표 지점 좌우 2중 동시 관통 타격 (Twin Starbursts & 2중 충격파)
 * - Step 4: 2차 연속 타격 충격파 진동 및 관통 궤적 잔향
 */
export function drawTwineedleEffect(
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
  const step = frame.moveStep || 1;
  const progress = frame.effectProgress !== undefined ? frame.effectProgress : 1.0;

  // Caster position with offsets
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));

  // Target position with offsets
  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0));

  // Direction angle from attacker to target
  const angle = Math.atan2(ty - ay, tx - ax);

  // Perpendicular unit vector for side-by-side parallel horn alignment
  const perpX = Math.cos(angle + Math.PI / 2);
  const perpY = Math.sin(angle + Math.PI / 2);
  const parallelSpacing = 16; // 16px offset each side (total 32px parallel width)

  ctx.save();

  if (step === 1) {
    // Step 1: 더블니들 조준 & 2중 뿔 장전 (별 글린트 없이 순수한 날카로운 뿔 2개 노출)
    const startX = ax + (isP ? 42 : -42);
    const startY = ay + (isP ? -14 : 14);

    const h1x = startX + perpX * parallelSpacing;
    const h1y = startY + perpY * parallelSpacing;
    const h2x = startX - perpX * parallelSpacing;
    const h2y = startY - perpY * parallelSpacing;

    // 얇은 뿔 2개 나란히 장전 (앞쪽 별 제거)
    drawSlenderYellowHorn(ctx, h1x, h1y, angle, 0.95, 0.90);
    drawSlenderYellowHorn(ctx, h2x, h2y, angle, 0.95, 0.90);
  } else if (step === 2) {
    // Step 2: 2개의 얇은 뿔이 직선 나란히 고속 비행
    const curT = Math.max(0.02, Math.min(0.98, progress));
    const cx = ax + (tx - ax) * curT;
    const cy = ay + (ty - ay) * curT;

    const h1x = cx + perpX * parallelSpacing;
    const h1y = cy + perpY * parallelSpacing;
    const h2x = cx - perpX * parallelSpacing;
    const h2y = cy - perpY * parallelSpacing;

    // 직선 스피드 트레일 (나란히 평행하게 사출)
    drawHornStraightSpeedTrail(ctx, h1x, h1y, angle, 90);
    drawHornStraightSpeedTrail(ctx, h2x, h2y, angle, 90);

    // 얇은 뿔 2개 직선 나란히 렌더링 (앞쪽 별 없이 순수 뾰족한 끝)
    drawSlenderYellowHorn(ctx, h1x, h1y, angle, 1.05, 1.0);
    drawSlenderYellowHorn(ctx, h2x, h2y, angle, 1.05, 1.0);
  } else if (step === 3) {
    // Step 3: 목표 지점 좌우 2중 동시 관통 타격 (1타)
    const p1x = tx + perpX * parallelSpacing;
    const p1y = ty + perpY * parallelSpacing;
    const p2x = tx - perpX * parallelSpacing;
    const p2y = ty - perpY * parallelSpacing;

    // 관통 지점에 얇은 뿔 2개 안착
    drawSlenderYellowHorn(ctx, p1x, p1y, angle, 0.92, 0.85);
    drawSlenderYellowHorn(ctx, p2x, p2y, angle, 0.92, 0.85);

    // 2중 타격 버스트 (Twin Starbursts)
    drawStarburstImpact(ctx, p1x, p1y, "#D97706", "#FEF08A", 26);
    drawStarburstImpact(ctx, p2x, p2y, "#D97706", "#FEF08A", 26);

    // 2중 충격파 링
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(p1x, p1y, 16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(p2x, p2y, 16, 0, Math.PI * 2);
    ctx.stroke();

    // 임팩트 스타
    drawMiniRetroStar(ctx, p1x + 10, p1y - 12, 8, "#FFFFFF");
    drawMiniRetroStar(ctx, p2x - 10, p2y + 12, 8, "#FEF08A");
  } else if (step === 4) {
    // Step 4: 2차 연속 타격 충격파 진동 및 관통 궤적 잔향 (2타)
    const p1x = tx + perpX * parallelSpacing;
    const p1y = ty + perpY * parallelSpacing;
    const p2x = tx - perpX * parallelSpacing;
    const p2y = ty - perpY * parallelSpacing;

    // 평행 관통 직선 궤적 (2개의 평행한 관통선)
    const lineLen = 130;
    const halfLen = lineLen / 2;
    const dx = Math.cos(angle) * halfLen;
    const dy = Math.sin(angle) * halfLen;

    const drawPierceLine = (px: number, py: number) => {
      const grad = ctx.createLinearGradient(px - dx, py - dy, px + dx, py + dy);
      grad.addColorStop(0, "rgba(254, 240, 138, 0.0)");
      grad.addColorStop(0.3, "rgba(254, 240, 138, 0.85)");
      grad.addColorStop(0.5, "#FFFFFF");
      grad.addColorStop(0.7, "rgba(254, 240, 138, 0.85)");
      grad.addColorStop(1, "rgba(254, 240, 138, 0.0)");

      ctx.strokeStyle = grad;
      ctx.lineWidth = 4.0;
      ctx.beginPath();
      ctx.moveTo(px - dx, py - dy);
      ctx.lineTo(px + dx, py + dy);
      ctx.stroke();
    };

    drawPierceLine(p1x, p1y);
    drawPierceLine(p2x, p2y);

    // 확산 충격파
    ctx.strokeStyle = "rgba(250, 204, 21, 0.6)";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(tx, ty, 34, 0, Math.PI * 2);
    ctx.stroke();

    // 비산 별빛 파티클
    drawMiniRetroStar(ctx, tx + 24, ty - 18, 9, "#FEF08A");
    drawMiniRetroStar(ctx, tx - 22, ty + 20, 8, "#FFFFFF");
    drawMiniRetroStar(ctx, tx + 18, ty + 22, 7, "#F59E0B");
  }

  ctx.restore();
}

/**
 * Helper: Draw a sharp ivory horn missile based on Fury Attack (마구찌르기 뿔 기반의 아이보리 바늘미사일)
 * - 마구찌르기(Fury Attack)의 공식 내추럴 아이보리 뿔(Natural Ivory Cone Horn) 에셋 텍스처 100% 재사용
 * - 슬림하고 날렵한 미사일 침 비율 적용 (길이 38px, 반경 6.8px, 원뿔 바닥 둥근 캡)
 * - 뿔 뒤쪽 고유 아이보리 빔 트레일 & 공기역학적 슬립스트림
 * - 3D 원통 입체 음영 (#FAF7EE -> #FFFFFF -> #F4EBD9 -> #DECDB0 -> #A89878)
 * - 테두리: 다크 앰버/본 (#451A03)
 */
function drawSlenderHornMissile(
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

  const length = 38 * scale;
  const radius = 6.8 * scale; // 마구찌르기 뿔 기반 슬림 바늘 비율

  // 1. 뿔 뒤쪽 고유 아이보리 빔 트레일 (Ivory beam trail from Fury Attack)
  const beamLength = 45 * scale;
  const beamHalfWidth = radius * 0.75;
  const trailGrad = ctx.createLinearGradient(0, 0, -beamLength, 0);
  trailGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.95)");
  trailGrad.addColorStop(0.25, "rgba(244, 235, 217, 0.85)");
  trailGrad.addColorStop(0.60, "rgba(244, 235, 217, 0.40)");
  trailGrad.addColorStop(1.0, "rgba(244, 235, 217, 0.0)");

  ctx.fillStyle = trailGrad;
  ctx.beginPath();
  ctx.moveTo(0, -beamHalfWidth);
  ctx.lineTo(-beamLength, -beamHalfWidth * 0.3);
  ctx.lineTo(-beamLength, beamHalfWidth * 0.3);
  ctx.lineTo(0, beamHalfWidth);
  ctx.closePath();
  ctx.fill();

  // 상하 슬립스트림 라인
  ctx.strokeStyle = "rgba(254, 240, 138, 0.55)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-3, -radius * 1.05);
  ctx.lineTo(-beamLength * 0.7, -radius * 1.05);
  ctx.moveTo(-3, radius * 1.05);
  ctx.lineTo(-beamLength * 0.7, radius * 1.05);
  ctx.stroke();

  // 2. Dark Natural Bone/Amber Outline (Cone with rounded base)
  ctx.beginPath();
  ctx.moveTo(length, 0); // Sharp needle point
  ctx.lineTo(0, -radius);
  ctx.quadraticCurveTo(-4.5 * scale, 0, 0, radius); // Rounded base cap
  ctx.lineTo(length, 0);
  ctx.closePath();
  ctx.fillStyle = "#451A03"; // 마구찌르기와 동일한 다크 본
  ctx.fill();

  // 3. Natural Ivory Gradient Fill (마구찌르기와 100% 동일한 고급 아이보리 팔레트)
  const bodyGrad = ctx.createLinearGradient(0, -radius, 0, radius);
  bodyGrad.addColorStop(0.0, "#FAF7EE"); // Rim light
  bodyGrad.addColorStop(0.22, "#FFFFFF"); // Specular sheen
  bodyGrad.addColorStop(0.48, "#F4EBD9"); // Natural warm ivory
  bodyGrad.addColorStop(0.78, "#DECDB0"); // Bone shading
  bodyGrad.addColorStop(1.0, "#A89878"); // Soft bone shadow

  ctx.beginPath();
  ctx.moveTo(length - 1.5, 0);
  ctx.lineTo(1.0, -radius + 1.2);
  ctx.quadraticCurveTo(-3.2 * scale, 0, 1.0, radius - 1.2);
  ctx.lineTo(length - 1.5, 0);
  ctx.closePath();
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // 4. Central Specular Ridge
  ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
  ctx.lineWidth = 1.4 * scale;
  ctx.beginPath();
  ctx.moveTo(2, -radius * 0.22);
  ctx.lineTo(length - 1.5, 0);
  ctx.stroke();

  // ⚠️ 뿔 앞쪽 끝의 동그라미/별(Glint Star & Dot)은 날카로운 뾰족함을 온전히 살리기 위해 완전 제거!

  ctx.restore();
}

/**
 * Helper: Puncture spark and impact rings for Pin Missile hits (마구찌르기 뿔 타격 계열)
 * - 유저 요청 반영: 4타 피니시도 1~3타와 100% 동일한 타격 동그라미(r=12px) 및 임팩트로 일관되게 연출
 */
function drawPinMissilePunctureImpact(
  ctx: any,
  x: number,
  y: number
) {
  ctx.save();
  drawStarburstImpact(ctx, x, y, "#D97706", "#FFFFFF", 18);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.90)";
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.stroke();

  drawMiniRetroStar(ctx, x + 8, y - 8, 5, "#FFFFFF");
  drawMiniRetroStar(ctx, x - 8, y + 8, 5, "#FEF08A");
  ctx.restore();
}

/**
 * Helper: Directional muzzle launch flash at the caster's mouth/body
 */
function drawMuzzleLaunchFlash(
  ctx: any,
  x: number,
  y: number,
  angle: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Directional conical muzzle flash
  const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, 20);
  grad.addColorStop(0.0, "#FFFFFF");
  grad.addColorStop(0.35, "rgba(254, 240, 138, 0.90)");
  grad.addColorStop(0.70, "rgba(245, 158, 11, 0.40)");
  grad.addColorStop(1.0, "rgba(245, 158, 11, 0.0)");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, 20, -Math.PI / 3, Math.PI / 3);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 042: 바늘미사일 (Pin Missile / 미사일침) Visual Effect
 * 
 * - 마구찌르기(Fury Attack)의 공식 내추럴 아이보리 뿔 에셋 재사용
 * - 정적인 그림 느낌을 완전히 배제하고, 시전 포켓몬 전면에서 4발이 한 발씩 실제로 발사(Launch Muzzle) ➔ 비행(Flight) ➔ 타격(Hit)되는 다이내믹 발사 시퀀스 구현
 * - 1발 발사 ➔ 1발 비행 ➔ 1발 타격 & 2발 발사 ➔ 2발 비행 ➔ 2발 타격 & 3발 발사 ➔ 3발 비행 ➔ 3발 타격 & 4발 피니시 발사 ➔ 4발 비행 ➔ 4발 피니시 타격!
 */
export function drawPinMissileEffect(
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
  const { targetPos, attackerPos, isPlayer: isP, isHit } = drawCtx;
  const step = frame.moveStep || 1;

  // Caster position with offsets
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));

  // Target base position
  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0));

  // 4발의 개별 조준 타겟 오프셋 (단조로운 직선 나란히를 탈피하여 상대 전신에 역동적인 탄착군 형성)
  const shotConfigs = [
    // Shot 0 (1st): upper-left aim
    { targetOx: -8, targetOy: -12 },
    // Shot 1 (2nd): lower-right aim
    { targetOx: 9, targetOy: 10 },
    // Shot 2 (3rd): mid-left aim
    { targetOx: -7, targetOy: 2 },
    // Shot 3 (4th): direct center aim (finisher)
    { targetOx: 0, targetOy: 0 },
  ];

  ctx.save();

  // Helper to draw flying missile along its true ballistic lane from caster to target
  const drawFlyingShot = (idx: number, prog: number) => {
    const cfg = shotConfigs[idx];
    const sX = ax + (isP ? 34 : -34);
    const sY = ay + (isP ? -12 : 12);
    const tX = tx + cfg.targetOx;
    const tY = ty + cfg.targetOy;

    const shotAngle = Math.atan2(tY - sY, tX - sX);
    const curP = Math.max(0.05, Math.min(0.95, prog));
    const mx = sX + (tX - sX) * curP;
    const my = sY + (tY - sY) * curP;

    drawSlenderHornMissile(ctx, mx, my, shotAngle, 1.15, 1.0);
  };

  // Helper to draw firing muzzle flash at caster's front
  const drawLaunchMuzzle = (idx: number) => {
    const cfg = shotConfigs[idx];
    const sX = ax + (isP ? 34 : -34);
    const sY = ay + (isP ? -12 : 12);
    const tX = tx + cfg.targetOx;
    const tY = ty + cfg.targetOy;
    const shotAngle = Math.atan2(tY - sY, tX - sX);
    drawMuzzleLaunchFlash(ctx, sX, sY, shotAngle);
  };

  // Helper to draw hit puncture impact on target
  const drawHit = (idx: number) => {
    const cfg = shotConfigs[idx];
    drawPinMissilePunctureImpact(ctx, tx + cfg.targetOx, ty + cfg.targetOy);
  };

  if (step === 1) {
    // [1발째 발사]: 시전자 돌진 시작 & 1번째 미사일 총구 화염 발사 (22% 비행)
    drawLaunchMuzzle(0);
    drawFlyingShot(0, 0.22);
  } else if (step === 2) {
    // [1발째 고속 쇄도]: 1번째 미사일 상대방 앞까지 고속 비행 (82% 비행)
    drawFlyingShot(0, 0.82);
  } else if (step === 3) {
    // [1발째 타격 & 2발째 발사]: 1발째 타격 작렬 & 시전자 추가 돌진하며 2번째 미사일 발사 (22% 비행)
    if (isHit) drawHit(0);
    drawLaunchMuzzle(1);
    drawFlyingShot(1, 0.22);
  } else if (step === 4) {
    // [2발째 고속 쇄도]: 2번째 미사일 상대방 앞까지 고속 비행 (82% 비행)
    drawFlyingShot(1, 0.82);
  } else if (step === 5) {
    // [2발째 타격 & 3발째 발사]: 2발째 타격 작렬 & 시전자 추가 돌진하며 3번째 미사일 발사 (22% 비행)
    if (isHit) drawHit(1);
    drawLaunchMuzzle(2);
    drawFlyingShot(2, 0.22);
  } else if (step === 6) {
    // [3발째 고속 쇄도]: 3번째 미사일 상대방 앞까지 고속 비행 (82% 비행)
    drawFlyingShot(2, 0.82);
  } else if (step === 7) {
    // [3발째 타격 & 4발째 발사]: 3발째 타격 작렬 & 시전자 최대 돌진 도달하며 4번째 피니시 미사일 발사 (25% 비행)
    if (isHit) drawHit(2);
    drawLaunchMuzzle(3);
    drawFlyingShot(3, 0.25);
  } else if (step === 8) {
    // [4발째 피니시 고속 쇄도]: 4번째 미사일 중앙 관통 쇄도 (85% 비행)
    drawFlyingShot(3, 0.85);
  } else if (step === 9) {
    // [4발째 피니시 격돌]: 이전 1~3타와 동일한 깔끔한 타격 동그라미 격돌
    if (isHit) drawHit(3);
  } else if (step === 10) {
    // [피니시 잔향]: 별빛 및 잔류 파티클
    if (isHit) {
      drawMiniRetroStar(ctx, tx + 14, ty - 12, 6, "#FFFFFF");
      drawMiniRetroStar(ctx, tx - 12, ty + 10, 5, "#FEF08A");
    }
  }

  ctx.restore();
}

/**
 * Helper: 주변 어두워지는 전체 화면 반투명 검정 오버레이
 * - ⚠️ 유저 요청 주의사항 100% 엄격 반영: "(이때 주변이 어두워지는 반투명 검정 안잘리게 조심)"
 * - 카메라 줌/팬/오프셋에 전혀 영향받지 않도록 초광역 바운드(-5000px ~ +7000px, 12,000 x 12,000px)를 채워
 *   어떤 상황에서도 반투명 검정 박스가 잘리거나 경계선이 노출되지 않음
 */
function drawLeerDimOverlay(ctx: any, alpha: number) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  ctx.fillRect(-5000, -5000, 12000, 12000);
  ctx.restore();
}

/**
 * Helper: 시전자 눈 앞쪽에서 반짝이는 십자모양 별 (Crisp Eye Glint Cross Star)
 * - 유저 피드백 반영: 암전 후 확실하고 시원하게 보이도록 십자선 크기 대폭 확대 (가로 70px, 세로 54px)
 * - 불필요한 과한 오라/레이저는 배제하고, 깔끔하고 예리한 십자 섬광 형태로 연출
 */
function drawLeerCrossStar(
  ctx: any,
  cx: number,
  cy: number,
  scale: number = 1.0,
  alpha: number = 1.0
) {
  if (scale <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const hLen = 35 * scale; // 총 가로 70px (크고 시원한 십자선)
  const vLen = 27 * scale; // 총 세로 54px
  const centerSize = 6.5 * scale;

  // 1. 중심부 소프트 글로우
  const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22 * scale);
  glowGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.95)");
  glowGrad.addColorStop(0.35, "rgba(254, 240, 138, 0.60)");
  glowGrad.addColorStop(1.0, "rgba(254, 240, 138, 0.0)");
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 22 * scale, 0, Math.PI * 2);
  ctx.fill();

  // 2. 가로 샤프 십자선 (양 끝이 날카로운 바늘 모양의 날렵한 광선)
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(cx - hLen, cy);
  ctx.quadraticCurveTo(cx, cy - 3.2 * scale, cx + hLen, cy);
  ctx.quadraticCurveTo(cx, cy + 3.2 * scale, cx - hLen, cy);
  ctx.closePath();
  ctx.fill();

  // 3. 세로 샤프 십자선
  ctx.beginPath();
  ctx.moveTo(cx, cy - vLen);
  ctx.quadraticCurveTo(cx - 2.6 * scale, cy, cx, cy + vLen);
  ctx.quadraticCurveTo(cx + 2.6 * scale, cy, cx, cy - vLen);
  ctx.closePath();
  ctx.fill();

  // 4. 대각선 45도 보조 미세 반짝임 (사선 글린트)
  const diagLen = 13 * scale;
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.beginPath();
  ctx.moveTo(cx - diagLen * 0.7, cy - diagLen * 0.7);
  ctx.quadraticCurveTo(cx, cy, cx + diagLen * 0.7, cy + diagLen * 0.7);
  ctx.quadraticCurveTo(cx, cy, cx - diagLen * 0.7, cy - diagLen * 0.7);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - diagLen * 0.7, cy + diagLen * 0.7);
  ctx.quadraticCurveTo(cx, cy, cx + diagLen * 0.7, cy - diagLen * 0.7);
  ctx.quadraticCurveTo(cx, cy, cx - diagLen * 0.7, cy + diagLen * 0.7);
  ctx.fill();

  // 5. 중심 고광도 다이아몬드 코어
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(cx, cy - centerSize);
  ctx.lineTo(cx + centerSize * 0.85, cy);
  ctx.lineTo(cx, cy + centerSize);
  ctx.lineTo(cx - centerSize * 0.85, cy);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 043: 째려보기 (Leer) Visual Effect
 * 
 * Concept (유저 피드백 100% 반영):
 * - 암전 선행 후 ➔ 시전자 눈 앞쪽에 확실하고 큼직한 십자선 번뜩임!
 * - 주변이 어두워지는 전체 화면 반투명 검정 (-5000~+12000px 완전 커버로 절대 잘림 없음)
 * - 상대방 위압감에 떨림 & 방어력 1랭크 하락 디버프 연출
 */
export function drawLeerEffect(
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
  const { attackerPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep || 1;

  // Caster position with offsets
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));

  // 시전자 전면(눈 앞쪽)에 십자모양 별이 위치할 좌표
  // 플레이어 시점: 우상단 적을 향하는 앞쪽 (ax + 28, ay - 14)
  // 적 시점: 좌하단 아군을 향하는 앞쪽 (ax - 28, ay + 12)
  const starX = ax + (isP ? 28 : -28);
  const starY = ay + (isP ? -14 : 12);

  ctx.save();

  if (step === 1) {
    // 1단계: 주변 먼저 어두워짐 (십자선 없이 암전만 선행)
    drawLeerDimOverlay(ctx, 0.50);
  } else if (step === 2) {
    // 2단계: 어두워진 배경 속에서 시전자 눈 앞쪽 큼직한 십자선 번뜩임!
    drawLeerDimOverlay(ctx, 0.50);
    drawLeerCrossStar(ctx, starX, starY, 1.0, 1.0);
  } else if (step === 3) {
    // 3단계: 십자선 축소 소멸 잔향 & 어둠 빠르게 걷힘
    drawLeerDimOverlay(ctx, 0.20);
    drawLeerCrossStar(ctx, starX, starY, 0.45, 0.6);
  }

  ctx.restore();
}

/**
 * Helper: 가로로 길고 위아래로는 얇은 상악(위쪽 턱) 이빨
 * - 유저 피드백 반영: 이빨 끝을 더욱 날카롭고 예리한 쐐기/송곳니 형태로 샤프닝 (lineJoin: miter)
 */
function drawBiteUpperJaw(
  ctx: any,
  cx: number,
  cy: number,
  scale: number = 1.0,
  alpha: number = 1.0
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  const w = 56; // 총 가로 112px

  // 1. 외곽 아치 곡선
  ctx.beginPath();
  ctx.moveTo(-w, -2);
  ctx.quadraticCurveTo(0, -14, w, -2);

  // 2. 한층 더 날카로워진 쐐기형 톱니 이빨 (끝을 뾰족하게 연장)
  const topTeeth = [
    { x: 48, y: 5 }, { x: 40, y: -3 },
    { x: 30, y: 9.5 }, { x: 21, y: -3 },
    { x: 11, y: 7 }, { x: 0, y: -2 },
    { x: -11, y: 7 }, { x: -21, y: -3 },
    { x: -30, y: 9.5 }, { x: -40, y: -3 },
    { x: -48, y: 5 }, { x: -w, y: -2 },
  ];
  for (const pt of topTeeth) ctx.lineTo(pt.x, pt.y);
  ctx.closePath();

  // 상악 그라데이션 채우기 (아이보리 화이트)
  const grad = ctx.createLinearGradient(0, -14, 0, 9.5);
  grad.addColorStop(0.0, "#E2E8F0");
  grad.addColorStop(0.35, "#F8FAFC");
  grad.addColorStop(1.0, "#FFFFFF");

  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 1.8;
  ctx.lineJoin = "miter";
  ctx.miterLimit = 4;
  ctx.stroke();

  // 내부 하이라이트 능선 (칼날 리지)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(30, 9.5);
  ctx.lineTo(30, -1);
  ctx.moveTo(-30, 9.5);
  ctx.lineTo(-30, -1);
  ctx.moveTo(11, 7);
  ctx.lineTo(11, -1);
  ctx.moveTo(-11, 7);
  ctx.lineTo(-11, -1);
  ctx.stroke();

  ctx.restore();
}

/**
 * Helper: 가로로 길고 위아래로는 얇은 하악(아래쪽 턱) 이빨
 * - 상악과 완벽하게 맞물리는 예리한 하악 송곳니 및 앞니
 */
function drawBiteLowerJaw(
  ctx: any,
  cx: number,
  cy: number,
  scale: number = 1.0,
  alpha: number = 1.0
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  const w = 56;

  // 1. 외곽 아치 곡선
  ctx.beginPath();
  ctx.moveTo(w, 2);
  ctx.quadraticCurveTo(0, 14, -w, 2);

  // 2. 한층 더 날카로워진 톱니 이빨 (상악 계곡에 꽂히는 예리한 송곳니)
  const btmTeeth = [
    { x: -50, y: -4 }, { x: -44, y: 3 },
    { x: -37, y: -9.5 }, { x: -28, y: 3 },
    { x: -19, y: -7 }, { x: -9, y: 2 },
    { x: 0, y: -8 }, { x: 9, y: 2 },
    { x: 19, y: -7 }, { x: 28, y: 3 },
    { x: 37, y: -9.5 }, { x: 44, y: 3 },
    { x: 50, y: -4 }, { x: w, y: 2 },
  ];
  for (const pt of btmTeeth) ctx.lineTo(pt.x, pt.y);
  ctx.closePath();

  // 하악 그라데이션 채우기
  const grad = ctx.createLinearGradient(0, 14, 0, -9.5);
  grad.addColorStop(0.0, "#CBD5E1");
  grad.addColorStop(0.35, "#F1F5F9");
  grad.addColorStop(1.0, "#FFFFFF");

  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 1.8;
  ctx.lineJoin = "miter";
  ctx.miterLimit = 4;
  ctx.stroke();

  // 내부 하이라이트 능선
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-37, -9.5);
  ctx.lineTo(-37, 1);
  ctx.moveTo(37, -9.5);
  ctx.lineTo(37, 1);
  ctx.moveTo(0, -8);
  ctx.lineTo(0, 1);
  ctx.stroke();

  ctx.restore();
}

/**
 * 044: 물기 (Bite) Visual Effect
 * 
 * Concept (유저 피드백 100% 반영):
 * - 상악/하악 이빨 모양을 가로로 길고(112px), 위아래로는 얇고 날렵하게(20px) 리디자인
 * - Step 1: 상하 턱이 넓게 벌어지며 대상 주위에 출현 (gap: 36px)
 * - Step 2: 턱이 고속으로 닫히며 쇄도 (gap: 14px)
 * - Step 3: 완전 교합 & 깨물기 강타 작렬 (gap: -2px, 완전 맞물림 & 다크 크런치 스파크 폭발)
 * - Step 4: 교합 유지 & 2차 타격 진동 잔향
 * - Step 5: 이빨 소멸 페이드아웃
 */
export function drawBiteMoveEffect(
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
  const { targetPos, isHit } = drawCtx;
  const step = frame.moveStep || 1;

  const tx = targetPos.x;
  const ty = targetPos.y;

  ctx.save();

  if (step === 1) {
    // 1단계: 이빨 전개 & 턱 벌어짐 (gap: 36px)
    drawBiteUpperJaw(ctx, tx, ty - 36, 0.95, 0.85);
    drawBiteLowerJaw(ctx, tx, ty + 36, 0.95, 0.85);
  } else if (step === 2) {
    // 2단계: 고속 교합 쇄도 (gap: 14px)
    drawBiteUpperJaw(ctx, tx, ty - 14, 1.0, 1.0);
    drawBiteLowerJaw(ctx, tx, ty + 14, 1.0, 1.0);
  } else if (step === 3) {
    // 3단계: 완전 교합 & 깨물기 (gap: -2px, 부가 이펙트 없이 순수 이빨 교합만 노출)
    drawBiteUpperJaw(ctx, tx, ty - 2, 1.04, 1.0);
    drawBiteLowerJaw(ctx, tx, ty + 2, 1.04, 1.0);
  } else if (step === 4) {
    // 4단계: 교합 유지
    drawBiteUpperJaw(ctx, tx, ty - 2, 1.02, 0.85);
    drawBiteLowerJaw(ctx, tx, ty + 2, 1.02, 0.85);
  } else if (step === 5) {
    // 5단계: 이빨 소멸 잔향
    drawBiteUpperJaw(ctx, tx, ty - 3, 1.0, 0.35);
    drawBiteLowerJaw(ctx, tx, ty + 3, 1.0, 0.35);
  }

  ctx.restore();
}


