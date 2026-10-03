// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";

// ============================================================================
// 🟤 189: 진흙뿌리기 (Mud-Slap) - 땅 타입 특수 기술 (위력 20, 명중 100%, 명중률 1랭크 하락)
// ============================================================================

/**
 * 흙과 진흙 256색 최적화 팔레트:
 * - 딥 톤 (외곽/음영): #23120B, #331A10
 * - 베이스 톤 (몸체): #542E13, #6D3B19, #82471E
 * - 하이라이트/코어 톤 (젖은 윤기 광택): #AB6832, #CF9153, #F5D2A4, #FFFFFF
 */
const MUD_PALETTE = {
  shadow: "#1E0F08",
  deep: "#2E160B",
  dark: "#45220F",
  base: "#663717",
  mid: "#80471E",
  light: "#9E5C2A",
  sheen: "#BF7B3F",
  specular: "#E8B278",
  pureHighlight: "#FFF0D6",
  dropRing: "rgba(191, 123, 63, 0.45)",
};

/**
 * 흙/진흙 유기적 타원체 덩어리 그리기 (Organic Mud Blob)
 * - 젖은 진흙 특유의 광택(Glossy Wet Sheen)과 묵직한 점성 표현
 */
export function drawOrganicMudBlob(
  ctx: any,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  angle: number = 0,
  alpha: number = 1.0,
  _withHighlight: boolean = false
) {
  if (alpha <= 0.01 || rx <= 0.5 || ry <= 0.5) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 묵직하고 걸쭉한 젖은 진흙 베이스 그라데이션 (테두리 및 하이라이트 제거)
  const mudGrad = ctx.createRadialGradient(-rx * 0.25, -ry * 0.3, 0, 0, 0, rx * 1.1);
  mudGrad.addColorStop(0.00, MUD_PALETTE.light);
  mudGrad.addColorStop(0.40, MUD_PALETTE.mid);
  mudGrad.addColorStop(0.75, MUD_PALETTE.base);
  mudGrad.addColorStop(1.00, MUD_PALETTE.dark);
  ctx.fillStyle = mudGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 꼬리가 길게 늘어나는 비행 진흙 덩어리 (Teardrop Mud Projectile)
 * - 비행 방향 각도(tangentAngle)에 맞춰 뒤쪽으로 찰지게 늘어나는 꼬리(Viscous Tail)
 */
export function drawFlyingMudClump(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  tangentAngle: number,
  stretch: number = 1.6,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || radius <= 0.5) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tangentAngle);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const rx = radius * stretch;
  const ry = radius * 0.78;

  // 1. 늘어나는 물방울/눈물 형태 경로 (Teardrop path)
  ctx.beginPath();
  ctx.moveTo(rx * 0.85, 0); // 머리 정점
  ctx.bezierCurveTo(rx * 0.85, ry * 1.1, 0, ry * 1.0, -rx * 1.25, 0); // 꼬리 끝점
  ctx.bezierCurveTo(0, -ry * 1.0, rx * 0.85, -ry * 1.1, rx * 0.85, 0);
  ctx.closePath();

  // 내부 진흙 그라데이션 (외곽선 및 하이라이트 제거)
  const grad = ctx.createLinearGradient(rx, 0, -rx * 1.2, 0);
  grad.addColorStop(0.00, MUD_PALETTE.light);
  grad.addColorStop(0.35, MUD_PALETTE.mid);
  grad.addColorStop(0.70, MUD_PALETTE.base);
  grad.addColorStop(1.00, MUD_PALETTE.dark);
  ctx.fillStyle = grad;
  ctx.fill();

  // 뒤따라 떨어져 나가는 작은 흙탕물 방울들 (Detached Droplets)
  ctx.fillStyle = MUD_PALETTE.mid;
  ctx.beginPath();
  ctx.arc(-rx * 1.55, -ry * 0.25, radius * 0.28, 0, Math.PI * 2);
  ctx.arc(-rx * 1.95, ry * 0.35, radius * 0.20, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 포물선 궤적 계산 헬퍼
 */
function getMudParabolaPos(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  p: number,
  arcHeight: number = 70
) {
  const x = sx + (tx - sx) * p;
  const linearY = sy + (ty - sy) * p;
  const parabolicLift = Math.sin(p * Math.PI) * arcHeight;
  return { x, y: linearY - parabolicLift };
}

/**
 * 포물선 진행 접선 각도(Tangent Angle) 계산
 */
function getMudTangentAngle(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  p: number,
  arcHeight: number = 70
) {
  const dx = tx - sx;
  const linearDy = ty - sy;
  const dParabola = Math.cos(p * Math.PI) * Math.PI * arcHeight;
  const dy = linearDy - dParabola;
  return Math.atan2(dy, dx);
}

/**
 * 1단계: 바닥 진흙 긁어모으기 / 파내기 (Ground Scoop & Mud Splash)
 */
export function drawMudGroundScoop(
  ctx: any,
  gx: number,
  gy: number,
  progress: number,
  isPlayer: boolean,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const dir = isPlayer ? 1 : -1;
  const scoopCenterY = gy + 20;
  const scoopCenterX = gx + dir * 18;

  // 1. 바닥에서 위로 팍 튀어오르는 진흙 스퍼트 & 파편들 (Rising Mud Splashes)
  const splashCount = 7;
  for (let i = 0; i < splashCount; i++) {
    const splashProg = Math.min(1.0, progress * 1.25);
    const ang = -Math.PI * 0.5 + (i - (splashCount - 1) / 2) * 0.28 * dir;
    const dist = (12 + (i % 3) * 8) * splashProg;
    const spX = scoopCenterX + Math.cos(ang) * dist;
    const spY = scoopCenterY + Math.sin(ang) * dist - splashProg * 8;
    const spR = Math.max(1.2, (3.2 - (i % 3) * 0.8) * (1.1 - splashProg * 0.2));

    drawOrganicMudBlob(ctx, spX, spY, spR, spR * 0.85, ang, alpha * (0.85 - (i % 2) * 0.2), false);
  }

  // 3. 시전자 앞/발치에 응축되어 뭉쳐지는 메인 진흙 덩어리
  const gatherX = gx + dir * (26 + progress * 6);
  const gatherY = gy - (4 + progress * 14);
  const gatherR = 6.0 + progress * 8.5; // 6px -> 14.5px 묵직하게 팽창

  drawOrganicMudBlob(ctx, gatherX, gatherY, gatherR * 1.15, gatherR * 0.95, dir * 0.2, alpha, true);

  ctx.restore();
}

/**
 * 2단계: 다발로 흩뿌려지는 진흙 투척 비행 (Fling Mud Projectiles)
 * - 주 탄두(메인 덩어리) + 보조 탄두 2개 + 흙탕물 비산 물방울들의 부채꼴 비행
 */
export function drawMudSlapFlight(
  ctx: any,
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  progress: number,
  isPlayer: boolean,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || progress <= 0 || progress >= 1.05) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const arcHeight = 65;

  // 1. 탄두 3형제 (메인 선두 덩어리 + 상/하부 보조 덩어리)
  const projectiles = [
    { pOffset: 0.00, dyOffset: 0, r: 13.5, stretch: 1.7, seed: 0 },    // 메인 선두 대형 진흙
    { pOffset: -0.07, dyOffset: -11, r: 9.5, stretch: 1.5, seed: 1 },  // 상단 보조 진흙
    { pOffset: -0.13, dyOffset: +9, r: 8.0, stretch: 1.4, seed: 2 },   // 하단 보조 진흙
    { pOffset: -0.20, dyOffset: -4, r: 5.5, stretch: 1.3, seed: 3 },   // 후방 소형 덩어리
  ];

  for (const proj of projectiles) {
    const curP = progress + proj.pOffset;
    if (curP < 0.02 || curP > 1.02) continue;

    const pos = getMudParabolaPos(sx, sy, tx, ty + proj.dyOffset, curP, arcHeight);
    const angle = getMudTangentAngle(sx, sy, tx, ty + proj.dyOffset, curP, arcHeight);

    // 바닥 타원형 그림자
    const groundY = sy + (ty - sy) * curP + (isPlayer ? 22 : 18);
    const heightFactor = Math.sin(curP * Math.PI);
    const shadowAlpha = Math.max(0.08, 0.32 * (1.0 - heightFactor * 0.45)) * alpha;
    ctx.save();
    ctx.fillStyle = `rgba(30, 15, 8, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(pos.x, groundY, proj.r * 1.1, proj.r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 진흙 탄두 본체 (뒤로 늘어나는 점성 눈물방울)
    drawFlyingMudClump(ctx, pos.x, pos.y, proj.r, angle, proj.stretch, alpha);
  }

  // 2. 공중에 흩날리는 흙탕물 궤적 비산 알갱이들 (Scatter Mud Droplets)
  const trailDrops = [
    { pOff: -0.04, yOff: 5, r: 2.8, col: MUD_PALETTE.mid },
    { pOff: -0.10, yOff: -8, r: 2.2, col: MUD_PALETTE.light },
    { pOff: -0.16, yOff: 14, r: 3.2, col: MUD_PALETTE.base },
    { pOff: -0.24, yOff: -14, r: 2.0, col: MUD_PALETTE.dark },
    { pOff: -0.28, yOff: 2, r: 2.6, col: MUD_PALETTE.mid },
    { pOff: -0.34, yOff: 8, r: 1.8, col: MUD_PALETTE.light },
  ];

  for (const drop of trailDrops) {
    const dp = progress + drop.pOff;
    if (dp > 0.03 && dp < 1.0) {
      const dpos = getMudParabolaPos(sx, sy, tx, ty, dp, arcHeight);
      ctx.fillStyle = drop.col;
      ctx.beginPath();
      ctx.arc(dpos.x, dpos.y + drop.yOff, drop.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * 3단계: 착탄 철퍽 타격 & 사방 비산 임팩트 (Mud Splat Impact Burst)
 */
export function drawMudImpactBurst(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  alpha: number = 1.0
) {
  if (progress > 0.60 || alpha <= 0.01) return;
  const t = progress / 0.60;
  const burstAlpha = Math.max(0, 1.0 - t) * alpha;

  ctx.save();

  // 1. 중심부 순간 철퍽 섬광 글로우 (Muddy Core Flash)
  const flashR = 14 + t * 20;
  const flashGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, flashR);
  flashGrad.addColorStop(0.0, `rgba(255, 240, 214, ${0.90 * burstAlpha})`);
  flashGrad.addColorStop(0.35, `rgba(232, 178, 120, ${0.75 * burstAlpha})`);
  flashGrad.addColorStop(0.70, `rgba(128, 71, 30, ${0.40 * burstAlpha})`);
  flashGrad.addColorStop(1.0, "rgba(46, 22, 11, 0)");
  ctx.fillStyle = flashGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, flashR, 0, Math.PI * 2);
  ctx.fill();

  // 3. 사방으로 촤악 튀어나가는 찰진 진흙 스파이크 촉수들 (Jagged Mud Tendril Spikes)
  const spikeCount = 9;
  for (let i = 0; i < spikeCount; i++) {
    const baseAng = (i / spikeCount) * Math.PI * 2 + 0.15;
    const len = (16 + (i % 4) * 8) * Math.pow(t, 0.70);
    const spikeX = cx + Math.cos(baseAng) * (len + 4);
    const spikeY = cy + Math.sin(baseAng) * (len * 0.82) + t * t * 14; // 중력 낙하

    const w = Math.max(1.4, (4.2 - (i % 3)) * (1.0 - t * 0.7));

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(baseAng);
    ctx.fillStyle = (i % 2 === 0) ? MUD_PALETTE.dark : MUD_PALETTE.mid;
    ctx.beginPath();
    ctx.moveTo(0, -w * 0.6);
    ctx.lineTo(len, 0);
    ctx.lineTo(0, w * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 스파이크 끝에서 튀어나가는 물방울 파편 (Flying Mud Droplet)
    ctx.fillStyle = (i % 2 === 0) ? MUD_PALETTE.base : MUD_PALETTE.light;
    ctx.beginPath();
    ctx.arc(spikeX, spikeY, Math.max(1.0, (3.2 - (i % 3)) * (1.0 - t * 0.5)), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 4단계 & 5단계: ★ 상대방 얼굴에 찰싹 달라붙은 진흙 얼룩 & 주르륵 흘러내림 (Face Mud Decal & Viscous Drips)
 * - 진흙뿌리기의 시그니처: "상대의 얼굴에 진흙을 던져 명중률을 떨어뜨린다"
 * - 중심부 찰진 불규칙 얼룩 + 아래로 주르륵 늘어지며 떨어지는 3가닥 진흙 방울
 */
export function drawMudFaceDecalAndDrips(
  ctx: any,
  faceX: number,
  faceY: number,
  progress: number,
  alpha: number = 1.0,
  slideDownY: number = 0,
  dripAlphaMult: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const cx = faceX;
  const cy = faceY + slideDownY;

  // 1. [z축 아래]: 아래를 향하는 3가닥 진흙 방울 (Viscous Drips)
  // 페이드아웃 시 진흙 덩어리(본체)보다 먼저 빠르게 소멸 (dripAlphaMult 적용)
  const finalDripAlpha = Math.max(0, Math.min(1.0, dripAlphaMult));
  if (finalDripAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha * finalDripAlpha));

    const dripProgress = Math.min(1.0, progress * 1.35);

    // 1-1. 좌측 중간 물방울 (Left Drip): 약 12px 늘어남
    const leftDripLen = 5 + dripProgress * 11;
    const leftX = cx - 11;
    const leftStartY = cy + 6;
    ctx.fillStyle = MUD_PALETTE.dark;
    ctx.beginPath();
    ctx.moveTo(leftX - 3.5, leftStartY);
    ctx.quadraticCurveTo(leftX - 1.5, leftStartY + leftDripLen * 0.5, leftX, leftStartY + leftDripLen);
    ctx.arc(leftX, leftStartY + leftDripLen, 3.2, 0, Math.PI);
    ctx.quadraticCurveTo(leftX + 1.5, leftStartY + leftDripLen * 0.5, leftX + 3.5, leftStartY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = MUD_PALETTE.mid;
    ctx.beginPath();
    ctx.ellipse(leftX, leftStartY + leftDripLen, 2.2, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1-2. 중앙 메인 물방울 (Center Long Drip): 24px 까지 길게 주르륵 흘러내림!
    const centerDripLen = 8 + dripProgress * 19;
    const centerX = cx + 1;
    const centerStartY = cy + 8;

    ctx.fillStyle = MUD_PALETTE.dark;
    ctx.beginPath();
    ctx.moveTo(centerX - 4.5, centerStartY);
    ctx.quadraticCurveTo(centerX - 2.0, centerStartY + centerDripLen * 0.6, centerX, centerStartY + centerDripLen);
    ctx.arc(centerX, centerStartY + centerDripLen, 4.2, 0, Math.PI);
    ctx.quadraticCurveTo(centerX + 2.0, centerStartY + centerDripLen * 0.6, centerX + 4.5, centerStartY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = MUD_PALETTE.mid;
    ctx.beginPath();
    ctx.ellipse(centerX, centerStartY + centerDripLen, 3.0, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1-3. 우측 물방울 & 분리되어 떨어지는 뚝! 방울 (Right Drip & Detached Drop)
    const rightDripLen = 6 + dripProgress * 14;
    const rightX = cx + 12;
    const rightStartY = cy + 6;

    ctx.fillStyle = MUD_PALETTE.dark;
    ctx.beginPath();
    ctx.moveTo(rightX - 3.2, rightStartY);
    ctx.quadraticCurveTo(rightX - 1.0, rightStartY + rightDripLen * 0.5, rightX, rightStartY + rightDripLen);
    ctx.arc(rightX, rightStartY + rightDripLen, 3.0, 0, Math.PI);
    ctx.quadraticCurveTo(rightX + 1.0, rightStartY + rightDripLen * 0.5, rightX + 3.2, rightStartY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = MUD_PALETTE.mid;
    ctx.beginPath();
    ctx.ellipse(rightX, rightStartY + rightDripLen, 2.0, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 진척도 0.55 이상 시 우측 아래로 완전히 뚝! 떨어져 낙하하는 분리 방울 (Falling Detached Droplet)
    if (dripProgress > 0.55) {
      const fallT = (dripProgress - 0.55) / 0.45;
      const fallY = rightStartY + rightDripLen + 6 + fallT * 18;
      ctx.fillStyle = MUD_PALETTE.dark;
      ctx.beginPath();
      ctx.arc(rightX, fallY, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = MUD_PALETTE.light;
      ctx.beginPath();
      ctx.arc(rightX - 0.6, fallY - 0.6, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // 2. [z축 위]: 얼굴 중심 찰진 진흙 덩어리 본체 (Viscous Irregular Mud Splat Decal)
  // 10개 제어점으로 찰지고 쫀득한 원작 진흙 얼룩 형상 형성
  const splatNodes = [
    { angle: 0.00, r: 21 },
    { angle: 0.62, r: 16 },
    { angle: 1.15, r: 24 }, // 우하단 돌출 로브
    { angle: 1.70, r: 18 },
    { angle: 2.30, r: 22 }, // 좌하단 로브
    { angle: 2.85, r: 17 },
    { angle: 3.50, r: 23 }, // 좌상단 돌출 로브
    { angle: 4.10, r: 15 },
    { angle: 4.80, r: 25 }, // 상단 메인 로브
    { angle: 5.50, r: 18 },
  ];

  // 묵직한 진흙 몸체 입체 그라데이션 (외곽선 및 하이라이트 제거)
  const decalGrad = ctx.createRadialGradient(cx - 3, cy - 4, 2, cx, cy, 26);
  decalGrad.addColorStop(0.00, MUD_PALETTE.light);
  decalGrad.addColorStop(0.35, MUD_PALETTE.mid);
  decalGrad.addColorStop(0.70, MUD_PALETTE.base);
  decalGrad.addColorStop(1.00, MUD_PALETTE.dark);
  ctx.fillStyle = decalGrad;
  ctx.beginPath();
  for (let i = 0; i < splatNodes.length; i++) {
    const node = splatNodes[i];
    const r = node.r;
    const nx = cx + Math.cos(node.angle) * r;
    const ny = cy + Math.sin(node.angle) * (r * 0.88);
    if (i === 0) ctx.moveTo(nx, ny);
    else ctx.lineTo(nx, ny);
  }
  ctx.closePath();
  ctx.fill();

  // 3. 얼룩 주변에 묻은 튀김 자국들 (Stray Mud Spots on Face)
  const straySpots = [
    { dx: -22, dy: -10, r: 2.8 },
    { dx: -18, dy: 16, r: 2.2 },
    { dx: 20, dy: -14, r: 3.0 },
    { dx: 24, dy: 10, r: 2.4 },
    { dx: -5, dy: -24, r: 2.6 },
  ];
  for (const s of straySpots) {
    drawOrganicMudBlob(ctx, cx + s.dx, cy + s.dy, s.r, s.r * 0.8, 0.2, alpha * 0.9, false);
  }

  ctx.restore();
}

/**
 * 인수 파싱 헬퍼 (Direct Calls & BattleFrames 호환)
 */
export function parseMudSlapArgs(
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  let ax = 200;
  let ay = 300;
  let tx = 550;
  let ty = 180;
  let step = 1;
  let p = 0.5;
  let isP = true;
  let frameObj: any = {};

  if (attackerPosOrFrame && typeof attackerPosOrFrame.x === "number") {
    ax = attackerPosOrFrame.x;
    ay = attackerPosOrFrame.y;
    tx = targetPosOrDrawCtx?.x ?? 550;
    ty = targetPosOrDrawCtx?.y ?? 180;
    step = moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, progress ?? 0.5));
    isP = Boolean(isPlayer);
  } else {
    frameObj = attackerPosOrFrame || {};
    const drawCtx = targetPosOrDrawCtx || {};
    const aPos = drawCtx.attackerPos || { x: 200, y: 300 };
    const tPos = drawCtx.targetPos || { x: 550, y: 180 };
    ax = aPos.x;
    ay = aPos.y;
    tx = tPos.x;
    ty = tPos.y;
    step = frameObj.moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, frameObj.effectProgress ?? 0.5));
    isP = Boolean(drawCtx.isPlayer);
  }

  return { ax, ay, tx, ty, step, p, isP, frame: frameObj };
}

/**
 * 🟤 189: 진흙뿌리기 (Mud-Slap) Behind Effect
 * - 타격 시 피격자 뒤편으로 날아가는 배경 진흙 파편들 (3D 깊이감 부여)
 */
export function drawMudSlapBehindEffect(
  targetCtx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  const { tx, ty, step, p } = parseMudSlapArgs(
    attackerPosOrFrame,
    targetPosOrDrawCtx,
    moveStep,
    progress,
    isPlayer
  );

  // 착탄 타격 단계(Step 3) 및 얼굴에 묻는 단계(Step 4)에서만 뒤편 배경 파편 렌더링
  if (step !== 3 && step !== 4) return;

  targetCtx.save();
  const faceY = ty - 12;

  // 뒤쪽으로 튀어 흩날리는 진흙 파편들
  const behindDrops = [
    { dx: -34, dy: -22, r: 2.2, a: 0.55 },
    { dx: 38, dy: -18, r: 2.6, a: 0.60 },
    { dx: -26, dy: 24, r: 1.8, a: 0.50 },
    { dx: 30, dy: 20, r: 2.0, a: 0.50 },
  ];

  for (const bd of behindDrops) {
    targetCtx.fillStyle = MUD_PALETTE.dark;
    targetCtx.beginPath();
    targetCtx.arc(tx + bd.dx, faceY + bd.dy, bd.r, 0, Math.PI * 2);
    targetCtx.fill();
  }

  targetCtx.restore();
}

/**
 * 🟤 189: 진흙뿌리기 (Mud-Slap) Main Front Effect
 *
 * 연출 기승전결:
 * 1. [진흙 퍼올리기]: 시전자 웅크림 및 바닥에서 진흙 긁어모으기 + 스퍼트 (Step 1)
 * 2. [진흙 흩뿌리기]: 힘차게 전방으로 뿌리며 부채꼴 포물선 비행 (Step 2)
 * 3. [철퍽 착탄 타격]: 상대 얼굴 정면 직격 & 사방 비산 충격파 (Step 3)
 * 4. [얼굴 진흙 얼룩 & 흘러내림]: 상대 얼굴에 찰진 얼룩 밀착 & 주르륵 흘러내리는 진흙 방울 (Step 4)
 * 5. [진흙 미끄러짐 & 소산]: 진흙이 씻겨 나가듯 아래로 흘러내려 페이드아웃 (Step 5)
 */
export function drawMudSlapEffect(
  targetCtx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  const { ax, ay, tx, ty, step, p, isP } = parseMudSlapArgs(
    attackerPosOrFrame,
    targetPosOrDrawCtx,
    moveStep,
    progress,
    isPlayer
  );

  targetCtx.save();

  const launchX = ax + (isP ? 26 : -26);
  const launchY = ay - (isP ? 6 : 4);
  const targetFaceY = ty - 12;

  // --------------------------------------------------------------------------
  // Step 1: 바닥 진흙 긁어모으기 (Ground Scoop & Splash)
  // --------------------------------------------------------------------------
  if (step === 1) {
    drawMudGroundScoop(targetCtx, ax, ay, p, isP, 1.0);
  }

  // --------------------------------------------------------------------------
  // Step 2: 다발 진흙 흩뿌리기 포물선 비행 (Flight of Mud Clumps)
  // --------------------------------------------------------------------------
  else if (step === 2) {
    drawMudSlapFlight(targetCtx, launchX, launchY, tx, targetFaceY, p, isP, 1.0);
  }

  // --------------------------------------------------------------------------
  // Step 3: 착탄 철퍽 타격 & 사방 비산 임팩트 (Mud Splat Impact Burst)
  // --------------------------------------------------------------------------
  else if (step === 3) {
    // 1. 착탄 폭발 버스트
    drawMudImpactBurst(targetCtx, tx, targetFaceY, p, 1.0);

    // 2. 타격 순간 얼굴에 즉시 생겨나는 초기 진흙 얼룩
    const initialProgress = 0.20 + p * 0.30;
    drawMudFaceDecalAndDrips(targetCtx, tx, targetFaceY, initialProgress, 1.0, 0);
  }

  // --------------------------------------------------------------------------
  // Step 4: ★ 상대 얼굴에 찰싹 달라붙은 진흙 얼룩 & 주르륵 흘러내림
  // --------------------------------------------------------------------------
  else if (step === 4) {
    drawMudFaceDecalAndDrips(targetCtx, tx, targetFaceY, p, 1.0, 0);
  }

  // --------------------------------------------------------------------------
  // Step 5: 진흙이 미끄러져 떨어지며 서서히 소산 (Slide Off & Fadeout)
  // --------------------------------------------------------------------------
  else if (step === 5) {
    const fadeAlpha = Math.max(0, 1.0 - p);
    const dripFade = Math.max(0, 1.0 - p / 0.35); // 아래 역삼각형 진흙방울들이 본체보다 먼저 사라짐
    const slideY = p * 12; // 아래로 12px 미끄러져 떨어짐
    drawMudFaceDecalAndDrips(targetCtx, tx, targetFaceY, 1.0, fadeAlpha, slideY, dripFade);
  }

  targetCtx.restore();
}


// ============================================================================
// 🐙 190: 대포무노포 (Octazooka) - 물 타입 특수 기술 (위력 65, 명중 85%, 50% 명중률 1랭크 하락)
// ============================================================================

/**
 * 먹물 연기 256색 최적화 팔레트:
 * - 딥 톤 (외곽/음영): #05080E, #0A0F1A
 * - 베이스 톤 (몸체): #111827, #1E293B, #283548
 * - 하이라이트/연무 림 (푸르스름한 연기빛): #334155, #475569, #64748B, #94A3B8
 */
const INK_PALETTE = {
  pitch: "#05080E",
  deep: "#0B101D",
  dark: "#111827",
  base: "#1E293B",
  mid: "#283548",
  light: "#3B4C63",
  smoke: "#475569",
  rim: "#64748B",
  highlight: "#94A3B8",
};

/**
 * 💨 연기처럼 피어오르는 유기적 먹물 연무 구름 (Ink Smoke Puff)
 */
export function drawInkSmokePuff(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  innerAlpha: number = 0.65,
  tint: "dark" | "mid" | "light" = "mid"
) {
  if (radius <= 1 || innerAlpha <= 0.01) return;
  ctx.save();

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);

  if (tint === "dark") {
    // 짙은 심연의 먹물 흑색 (#05080E ~ #111827) - 부드러운 반투명 연기화
    grad.addColorStop(0.0, `rgba(5, 8, 14, ${innerAlpha * 0.70})`);
    grad.addColorStop(0.40, `rgba(17, 24, 39, ${innerAlpha * 0.55})`);
    grad.addColorStop(0.75, `rgba(30, 41, 59, ${innerAlpha * 0.25})`);
    grad.addColorStop(1.0, "rgba(30, 41, 59, 0.0)");
  } else if (tint === "mid") {
    // 묵직한 네이비 블랙 먹물 연무 (#111827 ~ #334155)
    grad.addColorStop(0.0, `rgba(17, 24, 39, ${innerAlpha * 0.65})`);
    grad.addColorStop(0.35, `rgba(30, 41, 59, ${innerAlpha * 0.48})`);
    grad.addColorStop(0.70, `rgba(51, 65, 85, ${innerAlpha * 0.20})`);
    grad.addColorStop(1.0, "rgba(51, 65, 85, 0.0)");
  } else {
    // 연무 외곽 푸르스름한 연기빛 림 (#334155 ~ #64748B)
    grad.addColorStop(0.0, `rgba(51, 65, 85, ${innerAlpha * 0.50})`);
    grad.addColorStop(0.45, `rgba(71, 85, 105, ${innerAlpha * 0.30})`);
    grad.addColorStop(0.80, `rgba(100, 116, 139, ${innerAlpha * 0.12})`);
    grad.addColorStop(1.0, "rgba(100, 116, 139, 0.0)");
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 직선 기저 먹물 제트 코어 사다리꼴 콘 (Straight Ink Jet Cone)
 */
function drawStraightInkCone(
  ctx: any,
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  startP: number,
  endP: number,
  alpha: number
) {
  const dx = targetX - startX;
  const dy = targetY - startY;
  const dist = Math.hypot(dx, dy);
  const ux = dx / dist;
  const uy = dy / dist;
  const nx = -uy;
  const ny = ux;

  const wStart = 10 + startP * 24;
  const wEnd = 10 + endP * 28;

  const x1 = startX + ux * (dist * startP) + nx * (wStart * 0.5);
  const y1 = startY + uy * (dist * startP) + ny * (wStart * 0.5);
  const x2 = startX + ux * (dist * endP) + nx * (wEnd * 0.5);
  const y2 = startY + uy * (dist * endP) + ny * (wEnd * 0.5);
  const x3 = startX + ux * (dist * endP) - nx * (wEnd * 0.5);
  const y3 = startY + uy * (dist * endP) - ny * (wEnd * 0.5);
  const x4 = startX + ux * (dist * startP) - nx * (wStart * 0.5);
  const y4 = startY + uy * (dist * startP) - ny * (wStart * 0.5);

  const grad = ctx.createLinearGradient(
    startX + ux * (dist * startP),
    startY + uy * (dist * startP),
    startX + ux * (dist * endP),
    startY + uy * (dist * endP)
  );
  // [앞뒤 투명도 적용]: 시작(뒷부분)과 끝(앞부분) 모두 0.0에서 부드럽게 페이드인/아웃
  grad.addColorStop(0.0, "rgba(5, 8, 14, 0.0)");
  grad.addColorStop(0.20, `rgba(5, 8, 14, ${0.30 * alpha})`);
  grad.addColorStop(0.50, `rgba(15, 23, 42, ${0.22 * alpha})`);
  grad.addColorStop(0.80, `rgba(30, 41, 59, ${0.08 * alpha})`);
  grad.addColorStop(1.0, "rgba(30, 41, 59, 0.0)");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.lineTo(x4, y4);
  ctx.closePath();
  ctx.fill();
}

/**
 * [유저 요구 100% 반영 & 독가스 139번 관통 메커니즘 계승]:
 * 직선으로 먹물을 연기처럼 뿌리며 상대방을 관통하여 지나가는 제트 스트림
 */
function drawStraightInkSmokeStream(
  ctx: any,
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  startP: number = 0.0,
  endP: number = 1.0,
  alpha: number = 1.0,
  flowTime: number = 0.0,
  layer: "front" | "behind" = "front"
) {
  if (alpha <= 0.01 || endP <= startP) return;

  // [독가스 139번 동일 메커니즘]: 상대방 스프라이트를 관통하여 Z축 뒤로 분리!
  let segStart = startP;
  let segEnd = endP;

  if (layer === "front") {
    segStart = startP;
    segEnd = Math.min(1.02, endP);
  } else {
    // 상대방 후면 레이어: 상대를 관통하여 등 뒤(Z축 뒤)로 빠져나간 먹물 연기
    segStart = Math.max(0.92, startP);
    segEnd = endP;
  }

  if (segEnd <= segStart) return;

  const dx = targetX - startX;
  const dy = targetY - startY;
  const dist = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / dist;
  const uy = dy / dist;
  const nx = -uy;
  const ny = ux;

  ctx.save();

  // 1. 기저 직선 먹물 제트 코어
  drawStraightInkCone(ctx, startX, startY, targetX, targetY, segStart, segEnd, alpha * 0.65);

  // 2. 직선 방향으로 고속 쇄도하는 연기형 먹물 퍼프 클러스터
  const BURST_SPACING = 0.07;
  const flowAdvance = (flowTime * 0.40) % BURST_SPACING;
  const activeEnd = segEnd;

  for (let k = 0; k < 22; k++) {
    const t = activeEnd - flowAdvance - k * BURST_SPACING;
    if (t < segStart - 0.03 || t > segEnd + 0.02) continue;

    // 미세 고속 진동 (직선 궤적 유지하면서 꿀렁이는 기체/연기감 표현)
    const jiggle = Math.sin(k * 2.8 + flowTime * 2.5) * (1.8 + t * 3.0);

    const px = startX + ux * (dist * t) + nx * jiggle;
    const py = startY + uy * (dist * t) + ny * jiggle;

    // 직선 팽창: 입가(11px) -> 상대방(30px) -> 관통 후(40px)
    const r = 11.0 + Math.pow(Math.max(0, t), 0.85) * 28.0;

    let puffAlpha = alpha * 0.52;
    // [유저 요구 100% 반영]: 앞뒤 모두 투명도 적용 (꼬리/뒷부분 22% & 선두/앞부분 22% 부드러운 투명 페이드)
    if (t < segStart + 0.22) {
      puffAlpha *= Math.max(0, (t - segStart) / 0.22);
    }
    if (t > segEnd - 0.22) {
      puffAlpha *= Math.max(0, (segEnd - t) / 0.22);
    }

    // 관통한 먹물 연기(t > 0.98)는 뒤로 갈수록 점진적으로 투명하게 대기 소산
    if (layer === "behind" || t > 0.98) {
      const backDist = Math.max(0, t - 0.98);
      const backFade = Math.max(0, Math.pow(1.0 - Math.min(1.0, backDist / 0.55), 1.25));
      puffAlpha *= backFade * 0.55;
    }

    // [유저 요구 반영]: 대상 포켓몬과 배경 시인성 확보
    const frontSoft = (layer === "front" && t > 0.45) ? Math.max(0.18, 1.0 - (t - 0.45) * 1.4) : 0.75;
    drawInkSmokePuff(ctx, px, py, r, puffAlpha * frontSoft, layer === "behind" ? "mid" : "mid");
    drawInkSmokePuff(ctx, px, py, r * 0.65, puffAlpha * 0.50 * frontSoft, "light");
  }

  // 3. 직선 제트 스트림 외곽 연무 가닥 (고속 직선 연기감)
  const WISP_COUNT = 9;
  for (let j = 0; j < WISP_COUNT; j++) {
    const wt = segStart + (j / (WISP_COUNT - 1)) * (segEnd - segStart);
    if (wt < 0.05) continue;

    const sign = j % 2 === 0 ? 1 : -1;
    const halfW = 7.0 + wt * 18.0;
    const wx = startX + ux * (dist * wt) + nx * (sign * halfW);
    const wy = startY + uy * (dist * wt) + ny * (sign * halfW);

    const wispR = 7.0 + wt * 13.0;
    let wispAlpha = alpha * 0.38;
    // 외곽 연무 가닥도 앞뒤 투명도 적용
    if (wt < segStart + 0.20) {
      wispAlpha *= Math.max(0, (wt - segStart) / 0.20);
    }
    if (wt > segEnd - 0.20) {
      wispAlpha *= Math.max(0, (segEnd - wt) / 0.20);
    }
    if (layer === "behind" || wt > 0.98) {
      const backDist = Math.max(0, wt - 0.98);
      const backFade = Math.max(0, 1.0 - Math.min(1.0, backDist / 0.55));
      wispAlpha *= backFade * 0.55;
    }
    drawInkSmokePuff(ctx, wx, wy, wispR, wispAlpha, "light");
  }

  ctx.restore();
}

/**
 * 대포무노포 인수 파싱 헬퍼
 */
export function parseOctazookaArgs(
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  let ax = 200;
  let ay = 300;
  let tx = 550;
  let ty = 180;
  let step = 1;
  let p = 0.5;
  let isP = true;
  let frameObj: any = {};

  if (attackerPosOrFrame && typeof attackerPosOrFrame.x === "number") {
    ax = attackerPosOrFrame.x;
    ay = attackerPosOrFrame.y;
    tx = targetPosOrDrawCtx?.x ?? 550;
    ty = targetPosOrDrawCtx?.y ?? 180;
    step = moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, progress ?? 0.5));
    isP = Boolean(isPlayer);
  } else {
    frameObj = attackerPosOrFrame || {};
    const drawCtx = targetPosOrDrawCtx || {};
    const aPos = drawCtx.attackerPos || { x: 200, y: 300 };
    const tPos = drawCtx.targetPos || { x: 550, y: 180 };
    ax = aPos.x;
    ay = aPos.y;
    tx = tPos.x;
    ty = tPos.y;
    step = frameObj.moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, frameObj.effectProgress ?? 0.5));
    isP = Boolean(drawCtx.isPlayer);
  }

  return { ax, ay, tx, ty, step, p, isP, frame: frameObj };
}

/**
 * 🐙 190: 대포무노포 (Octazooka) Behind Effect
 * - [핵심]: 상대를 관통하여 등 뒤(Z축 뒤)로 빠져나간 직선 먹물 연기 제트 스트림 & 후방 먹물 구름 렌더링!
 */
export function drawOctazookaBehindEffect(
  targetCtx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  const { ax, ay, tx, ty, step, p, isP, frame } = parseOctazookaArgs(
    attackerPosOrFrame,
    targetPosOrDrawCtx,
    moveStep,
    progress,
    isPlayer
  );

  const mouthX = ax + (isP ? 32 : -32);
  const mouthY = ay - (isP ? 14 : 10);
  const targetAimX = tx - (isP ? 28 : -15);
  const targetCenterY = ty - (isP ? 14 : 10);

  targetCtx.save();

  // 1. 상대를 관통하여 등 뒤로 뻗어나가는 직선 먹물 연기 스트림 (독가스 139번 구조)
  let streamHead = frame?.streamHead;
  let streamTail = frame?.streamTail ?? 0.0;
  let streamAlpha = frame?.streamAlpha ?? 1.0;

  if (streamHead === undefined) {
    if (step === 2) {
      streamHead = Math.min(1.05, 0.40 + p * 0.65);
      streamTail = 0.0;
    } else if (step === 3) {
      streamHead = 1.25 + p * 0.25;
      streamTail = 0.05 + p * 0.10;
    } else if (step === 4) {
      streamHead = 1.60 + p * 0.05;
      streamTail = 0.60 + p * 0.55;
    }
  }

  if (streamHead !== undefined && streamHead > 0.92 && streamAlpha > 0.01) {
    const flowTime = step * 2.5 + p * 4.0;
    drawStraightInkSmokeStream(
      targetCtx,
      mouthX,
      mouthY,
      targetAimX,
      targetCenterY,
      streamTail,
      streamHead,
      streamAlpha,
      flowTime,
      "behind" // 🌟 Z축 뒤로 관통!
    );
  }

  // 2. 상대방 등 뒤(Z축 뒤)에서 퍼져나가는 후방 먹물 연무 구름 (Step 3~5)
  if (step >= 3) {
    const BEHIND_PUFFS = [
      { dx: 20, dy: -14, r: 42, birth: 0.15 },
      { dx: -24, dy: 10, r: 38, birth: 0.30 },
      { dx: 8, dy: -28, r: 46, birth: 0.50 },
      { dx: -14, dy: -20, r: 40, birth: 0.70 },
    ];

    for (const b of BEHIND_PUFFS) {
      let bAlpha = 0;
      let bScale = 1.0;
      let bRise = 0;

      if (step === 3) {
        if (p < b.birth) continue;
        const g = (p - b.birth) / 0.35;
        bAlpha = Math.min(0.28, g * 0.32);
        bScale = 0.5 + 0.5 * Math.sin(Math.min(1.0, g) * Math.PI * 0.5);
      } else if (step === 4) {
        bAlpha = 0.28;
      } else if (step === 5) {
        bAlpha = Math.max(0, 0.28 * (1.0 - p));
        bScale = 1.0 + p * 0.25;
        bRise = p * 30;
      }

      if (bAlpha > 0.02) {
        drawInkSmokePuff(
          targetCtx,
          targetAimX + b.dx,
          targetCenterY + b.dy - bRise,
          b.r * bScale,
          bAlpha,
          "dark"
        );
      }
    }
  }

  targetCtx.restore();
}

/**
 * 🐙 190: 대포무노포 (Octazooka) Front Effect
 * - [핵심]: 시전자 입에서 상대방을 향해 '직선 방향으로' 고속 발사되는 먹물 연기 스트림 전면부
 * - 피격자 주변에 튀는 흑색 먹물 방울(Ink Droplets) 및 격돌 충격파
 */
export function drawOctazookaEffect(
  targetCtx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  const { ax, ay, tx, ty, step, p, isP, frame } = parseOctazookaArgs(
    attackerPosOrFrame,
    targetPosOrDrawCtx,
    moveStep,
    progress,
    isPlayer
  );

  const mouthX = ax + (isP ? 32 : -32);
  const mouthY = ay - (isP ? 14 : 10);
  const targetAimX = tx - (isP ? 28 : -15);
  const targetCenterY = ty - (isP ? 14 : 10);

  targetCtx.save();

  // --------------------------------------------------------------------------
  // Step 1: 시전자 웅크림 및 입가 먹물 연무 응축
  // --------------------------------------------------------------------------
  if (step === 1) {
    const gatherR = 8.0 + p * 12.0; // 8px -> 20px 짙은 먹물 연무 응축
    const gatherAlpha = Math.min(0.55, 0.25 + p * 0.35);
    drawInkSmokePuff(targetCtx, mouthX, mouthY, gatherR, gatherAlpha, "dark");
    drawInkSmokePuff(targetCtx, mouthX, mouthY, gatherR * 0.65, gatherAlpha * 0.75, "light");
  }

  // --------------------------------------------------------------------------
  // Step 2: 직선 먹물 연기 제트 스트림 사출 및 상대방 쇄도
  // --------------------------------------------------------------------------
  else if (step === 2) {
    let streamHead = frame?.streamHead ?? Math.min(1.05, 0.40 + p * 0.65);
    let streamTail = frame?.streamTail ?? 0.0;
    let streamAlpha = frame?.streamAlpha ?? 1.0;
    const flowTime = step * 2.5 + p * 4.0;

    // 입가 머즐 플래시 먹물 폭발 구체 (투명도 적용)
    drawInkSmokePuff(targetCtx, mouthX, mouthY, 16.0, 0.45 * streamAlpha, "dark");
    drawInkSmokePuff(targetCtx, mouthX, mouthY, 10.0, 0.35 * streamAlpha, "light");

    // 직선 먹물 스트림 전면부
    drawStraightInkSmokeStream(
      targetCtx,
      mouthX,
      mouthY,
      targetAimX,
      targetCenterY,
      streamTail,
      streamHead,
      streamAlpha,
      flowTime,
      "front"
    );
  }

  // --------------------------------------------------------------------------
  // Step 3: 상대방 직격 & 관통 지속 분사
  // --------------------------------------------------------------------------
  else if (step === 3) {
    let streamHead = frame?.streamHead ?? (1.25 + p * 0.25);
    let streamTail = frame?.streamTail ?? (0.05 + p * 0.10);
    let streamAlpha = frame?.streamAlpha ?? 1.0;
    const flowTime = step * 2.5 + p * 4.0;

    // 1. 머즐 화염/먹물 유지 (투명도 적용)
    drawInkSmokePuff(targetCtx, mouthX, mouthY, 14.0, 0.40 * streamAlpha, "dark");

    // 2. 직선 먹물 스트림 전면부 (상대방 스프라이트 앞까지)
    drawStraightInkSmokeStream(
      targetCtx,
      mouthX,
      mouthY,
      targetAimX,
      targetCenterY,
      streamTail,
      streamHead,
      streamAlpha,
      flowTime,
      "front"
    );

    // 3. 착탄 시 상대 정면에서 퍼져나가는 먹물 연무 충격파 (투명도 상향)
    const hitR = 16 + p * 20;
    const hitAlpha = Math.max(0.08, 0.35 * (1.0 - p * 0.4));
    drawInkSmokePuff(targetCtx, targetAimX, targetCenterY, hitR, hitAlpha, "dark");
    drawInkSmokePuff(targetCtx, targetAimX, targetCenterY, hitR * 0.65, hitAlpha * 0.70, "light");
  }

  // --------------------------------------------------------------------------
  // Step 4: 분사 종료 & 스트림 꼬리가 상대를 관통하여 지나감 (후미 통과)
  // --------------------------------------------------------------------------
  else if (step === 4) {
    let streamHead = frame?.streamHead ?? (1.60 + p * 0.05);
    let streamTail = frame?.streamTail ?? (0.60 + p * 0.55);
    let streamAlpha = frame?.streamAlpha ?? Math.max(0, 1.0 - p * 0.4);
    const flowTime = step * 2.5 + p * 4.0;

    // 스트림 후미 전면부 (상대 통과 직전 꼬리)
    drawStraightInkSmokeStream(
      targetCtx,
      mouthX,
      mouthY,
      targetAimX,
      targetCenterY,
      streamTail,
      streamHead,
      streamAlpha,
      flowTime,
      "front"
    );

    // 피격자 전면에 남은 먹물 연무 구름 (투명도 상향)
    const frontCloudAlpha = Math.max(0, 0.38 * (1.0 - p * 0.5));
    drawInkSmokePuff(targetCtx, targetAimX - 8, targetCenterY + 4, 32.0, frontCloudAlpha, "dark");
    drawInkSmokePuff(targetCtx, targetAimX + 10, targetCenterY - 6, 28.0, frontCloudAlpha * 0.75, "mid");
  }

  // --------------------------------------------------------------------------
  // Step 5: 먹물 연기 상공 승화 및 대기 소산
  // --------------------------------------------------------------------------
  else if (step === 5) {
    const fadeAlpha = Math.max(0, 0.35 * (1.0 - p));
    const riseY = p * 25;

    // 전면 잔여 연무 상공 피어오름 (투명도 상향)
    drawInkSmokePuff(targetCtx, targetAimX - 10, targetCenterY - riseY, 34.0, fadeAlpha, "dark");
    drawInkSmokePuff(targetCtx, targetAimX + 12, targetCenterY - riseY - 8, 30.0, fadeAlpha * 0.70, "mid");
  }

  targetCtx.restore();
}

// ============================================================================
// 📌 191: 압정뿌리기 (Spikes) 렌더러
// ============================================================================

/**
 * 날카로운 4각 백색/황금색 금속 글린트 (Metallic Sparkle)
 */
function drawSpikeGlint(ctx: any, cx: number, cy: number, r: number, alpha: number) {
  if (alpha <= 0.01 || r <= 0.5) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, alpha);

  // 1. 중심 소프트 글로우
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.5);
  glow.addColorStop(0.0, "rgba(254, 240, 138, 0.95)");
  glow.addColorStop(0.4, "rgba(250, 204, 21, 0.50)");
  glow.addColorStop(1.0, "rgba(234, 179, 8, 0.0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // 2. 4방향 샤프 다이아몬드 스파크 레이
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  // 수직 레이
  ctx.moveTo(cx, cy - r * 2.2);
  ctx.lineTo(cx + r * 0.3, cy);
  ctx.lineTo(cx, cy + r * 2.2);
  ctx.lineTo(cx - r * 0.3, cy);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  // 수평 레이
  ctx.moveTo(cx - r * 2.2, cy);
  ctx.lineTo(cx, cy + r * 0.3);
  ctx.lineTo(cx + r * 2.2, cy);
  ctx.lineTo(cx, cy - r * 0.3);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 지면 착탄 시 튀는 흙먼지 퍼프 (Dirt Impact Puff)
 */
function drawSpikeDirtPuff(ctx: any, cx: number, cy: number, r: number, alpha: number) {
  if (alpha <= 0.01 || r <= 0.5) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, alpha);

  const DIRT_COLORS = ["#78350F", "#92400E", "#B45309", "#D97706"];
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI + Math.sin(i * 1.5) * 0.2;
    const dist = r * 0.55;
    const px = cx + Math.cos(ang) * dist;
    const py = cy - Math.sin(ang) * dist * 0.6;
    const pr = r * 0.42;

    ctx.fillStyle = DIRT_COLORS[i % DIRT_COLORS.length];
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * 3차원 입체 마름쇠 / 강철 압정 단품 드로잉 (Caltrop Spike)
 * - 4개 뿔 중 1개는 반드시 하늘을 향해 날카롭게 직립 (항상 밟히는 구조)
 * - 입체 메탈릭 음영 (#F8FAFC 하이라이트, #94A3B8 바디, #1E293B 음영)
 */
function drawSingleCaltrop(
  ctx: any,
  x: number,
  y: number,
  size: number,
  angle: number,
  alpha: number,
  isGrounded: boolean = true
) {
  if (alpha <= 0.01 || size <= 1) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, alpha);

  // 1. 지면 안착 시 타원형 접촉 그림자
  if (isGrounded) {
    ctx.fillStyle = "rgba(15, 23, 42, 0.40)";
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.45, size * 0.90, size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.translate(x, y);
  ctx.rotate(angle);

  // 2. 후면 지지 뿔 2개 (어두운 스틸톤 - 좌우 대칭 지면 지지)
  ctx.fillStyle = "#334155";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size * 0.70, size * 0.45);
  ctx.lineTo(-size * 0.40, size * 0.60);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#475569";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size * 0.70, size * 0.45);
  ctx.lineTo(size * 0.40, size * 0.60);
  ctx.closePath();
  ctx.fill();

  // 3. 전면 지지 뿔 (중간 스틸톤)
  ctx.fillStyle = "#64748B";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size * 0.20, size * 0.50);
  ctx.lineTo(size * 0.20, size * 0.50);
  ctx.closePath();
  ctx.fill();

  // 4. [유저 요구 100% 반영]: 수직 위(12시 방향)를 완벽하게 향하는 날카로운 메인 칼날
  const bladeH = size * 1.45;

  // 좌측 음영면
  ctx.fillStyle = "#475569";
  ctx.beginPath();
  ctx.moveTo(0, -bladeH);
  ctx.lineTo(-size * 0.35, 0.1);
  ctx.lineTo(0, 0.1);
  ctx.closePath();
  ctx.fill();

  // 우측 밝은면
  ctx.fillStyle = "#94A3B8";
  ctx.beginPath();
  ctx.moveTo(0, -bladeH);
  ctx.lineTo(size * 0.35, 0.1);
  ctx.lineTo(0, 0.1);
  ctx.closePath();
  ctx.fill();

  // 중심 능선 순백 날카로운 하이라이트 선 (수직 위 직립)
  ctx.strokeStyle = "#F8FAFC";
  ctx.lineWidth = Math.max(1.0, size * 0.12);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -bladeH);
  ctx.lineTo(0, 0.05);
  ctx.stroke();

  // 중심 코어 허브 리벳
  ctx.fillStyle = "#1E293B";
  ctx.beginPath();
  ctx.arc(0, size * 0.05, size * 0.20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#E2E8F0";
  ctx.beginPath();
  ctx.arc(-size * 0.05, size * 0.0, size * 0.07, 0, Math.PI * 2);
  ctx.fill();

  // 칼날 끝 핀포인트 섬광 팁 (수직 꼭짓점)
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(0, -bladeH, size * 0.09, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 3개 압정 개별 물리/탄도학 파라미터 구성 테이블
 * - 0, 2: 상대방 발 앞쪽(front layer)
 * - 1: 상대방 발 뒤쪽(behind layer)
 */
export const SPIKES_CONFIG = [
  { id: 0, dx: -24, dy: 10, arcH: 70, delay: 0.00, flightEnd: 0.85, size: 11.0, restAng: 0.0, layer: "front" },
  { id: 1, dx: 18,  dy: -8, arcH: 92, delay: 0.06, flightEnd: 0.90, size: 9.5,  restAng: 0.0, layer: "behind" },
  { id: 2, dx: 26,  dy: 8,  arcH: 80, delay: 0.12, flightEnd: 0.95, size: 10.5, restAng: 0.0, layer: "front" },
];

/**
 * 압정뿌리기 인수 파싱 헬퍼
 */
export function parseSpikesArgs(
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  let ax = 200;
  let ay = 300;
  let tx = 550;
  let ty = 180;
  let step = 1;
  let p = 0.5;
  let isP = true;
  let frameObj: any = {};

  if (attackerPosOrFrame && typeof attackerPosOrFrame.x === "number") {
    ax = attackerPosOrFrame.x;
    ay = attackerPosOrFrame.y;
    tx = targetPosOrDrawCtx?.x ?? 550;
    ty = targetPosOrDrawCtx?.y ?? 180;
    step = moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, progress ?? 0.5));
    isP = Boolean(isPlayer);
  } else {
    frameObj = attackerPosOrFrame || {};
    const drawCtx = targetPosOrDrawCtx || {};
    const aPos = drawCtx.attackerPos || { x: 200, y: 300 };
    const tPos = drawCtx.targetPos || { x: 550, y: 180 };
    ax = aPos.x;
    ay = aPos.y;
    tx = tPos.x;
    ty = tPos.y;
    step = frameObj.moveStep ?? (drawCtx.step || 1);
    // [중요 버그 수정]: frameObj.effectProgress를 최우선으로 읽어 프레임별 비행 진행도 동기화
    p = Math.min(
      1.0,
      Math.max(
        0.0,
        frameObj.effectProgress ??
          frameObj.progress ??
          drawCtx.effectProgress ??
          drawCtx.progress ??
          0.5
      )
    );
    isP = drawCtx.isPlayer !== undefined ? Boolean(drawCtx.isPlayer) : true;
  }

  return { ax, ay, tx, ty, step, p, isP, frame: frameObj };
}

/**
 * 📌 191: 압정뿌리기 (Spikes) Behind Effect
 * - 상대방 발 뒤쪽(Z축 뒤, dy < 0)에 박히는 압정들을 상대방 스프라이트 뒤에 렌더링
 */
export function drawSpikesBehindEffect(
  targetCtx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  const { ax, ay, tx, ty, step, p, isP } = parseSpikesArgs(
    attackerPosOrFrame,
    targetPosOrDrawCtx,
    moveStep,
    progress,
    isPlayer
  );

  // 시전자 손 위치 & 목표 지면 기준점
  const handX = ax + (isP ? 26 : -26);
  const handY = ay - (isP ? 8 : 4);
  const targetFloorX = tx;
  const targetFloorY = ty + (isP ? 22 : 26);

  targetCtx.save();

  // Behind 레이어에 속한 압정들(1번)만 처리
  const behindSpikes = SPIKES_CONFIG.filter((s) => s.layer === "behind");

  for (const s of behindSpikes) {
    const destX = targetFloorX + (isP ? s.dx : -s.dx);
    const destY = targetFloorY + s.dy;

    // Step 2: 비행 중인 압정 (동적 포물선 비행)
    if (step === 2) {
      if (p < s.delay) continue;
      const t = Math.min(1.0, (p - s.delay) / (s.flightEnd - s.delay));
      const arc = s.arcH * Math.sin(t * Math.PI);
      const curX = handX + (destX - handX) * t;
      const curY = handY + (destY - handY) * t - arc;
      const spin = t * Math.PI * 5.0;

      // 비행 중 2단 잔상
      drawSingleCaltrop(targetCtx, curX - (destX - handX) * 0.04, curY + arc * 0.08, s.size * 0.85, spin - 0.4, 0.35, false);
      drawSingleCaltrop(targetCtx, curX, curY, s.size, spin, 0.95, false);

      // 착탄 순간 임팩트
      if (t >= 0.92) {
        const impactG = (t - 0.92) / 0.08;
        drawSpikeDirtPuff(targetCtx, destX, destY, 14.0 * impactG, 0.70 * (1.0 - impactG));
        drawSpikeGlint(targetCtx, destX, destY - s.size, 10.0, 1.0 - impactG);
      }
    }
    // Step 3~4: 지면에 단단히 박힌 결계 상태
    else if (step === 3 || step === 4) {
      const glintPulse = Math.sin(step * 3.5 + p * 6.0 + s.id * 1.8);
      drawSingleCaltrop(targetCtx, destX, destY, s.size, s.restAng, 1.0, true);
      if (glintPulse > 0.65) {
        drawSpikeGlint(targetCtx, destX, destY - s.size * 1.25, 6.0 + glintPulse * 4.0, (glintPulse - 0.65) / 0.35);
      }
    }
    // Step 5: 서서히 지면으로 안착 페이드아웃
    else if (step === 5) {
      const fadeAlpha = Math.max(0, 1.0 - p);
      drawSingleCaltrop(targetCtx, destX, destY, s.size, s.restAng, fadeAlpha, true);
    }
  }

  targetCtx.restore();
}

/**
 * 📌 191: 압정뿌리기 (Spikes) Front Effect
 * - Step 1: 시전자 웅크림 & 손/주머니에서 짤랑거리는 압정 모으기 (유저 요구: 십자별 반짝임 제거)
 * - Step 2: 포물선 투척 비행 & 전면 압정 비행 궤적
 * - Step 3: 상대방 발밑 착탄 & 흙먼지 퍼프 & 금속 글린트 작렬
 * - Step 4: 상대 진영 발밑 전역에 흩뿌려진 압정 결계 활성화 (위험 지대 형성)
 * - Step 5: 결계 지속 & 대기 소산
 */
export function drawSpikesEffect(
  targetCtx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  const { ax, ay, tx, ty, step, p, isP } = parseSpikesArgs(
    attackerPosOrFrame,
    targetPosOrDrawCtx,
    moveStep,
    progress,
    isPlayer
  );

  const handX = ax + (isP ? 26 : -26);
  const handY = ay - (isP ? 8 : 4);
  const targetFloorX = tx;
  const targetFloorY = ty + (isP ? 22 : 26);

  targetCtx.save();

  // --------------------------------------------------------------------------
  // Step 1: 시전자 웅크림 및 압정 주머니/손가락 모으기 (십자별 반짝임 배제)
  // --------------------------------------------------------------------------
  if (step === 1) {
    const gatherR = 7.0 + p * 8.0;
    const gatherAlpha = Math.min(0.95, 0.35 + p * 0.65);

    // 시전자 손 주변에서 회전하는 미니 압정 3개
    for (let i = 0; i < 3; i++) {
      const ang = (i / 3) * Math.PI * 2 + p * Math.PI * 2;
      const px = handX + Math.cos(ang) * gatherR;
      const py = handY + Math.sin(ang) * (gatherR * 0.6);
      drawSingleCaltrop(targetCtx, px, py, 7.0, ang * 2.0, gatherAlpha, false);
    }
  }

  // --------------------------------------------------------------------------
  // Step 2: 전면 포물선 투척 비행 (Front layer spikes: 0, 2, 3)
  // --------------------------------------------------------------------------
  else if (step === 2) {
    const frontSpikes = SPIKES_CONFIG.filter((s) => s.layer === "front");

    for (const s of frontSpikes) {
      if (p < s.delay) continue;
      const t = Math.min(1.0, (p - s.delay) / (s.flightEnd - s.delay));
      const destX = targetFloorX + (isP ? s.dx : -s.dx);
      const destY = targetFloorY + s.dy;

      const arc = s.arcH * Math.sin(t * Math.PI);
      const curX = handX + (destX - handX) * t;
      const curY = handY + (destY - handY) * t - arc;
      const spin = t * Math.PI * 5.5;

      // 비행 잔상 트레일
      drawSingleCaltrop(targetCtx, curX - (destX - handX) * 0.05, curY + arc * 0.07, s.size * 0.85, spin - 0.5, 0.35, false);
      drawSingleCaltrop(targetCtx, curX, curY, s.size, spin, 1.0, false);

      // 착탄 직전/직후 지면 흙먼지 퍼프 및 글린트
      if (t >= 0.90) {
        const impactG = (t - 0.90) / 0.10;
        drawSpikeDirtPuff(targetCtx, destX, destY, 16.0 * impactG, 0.75 * (1.0 - impactG));
        drawSpikeGlint(targetCtx, destX, destY - s.size, 12.0, 1.0 - impactG);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Step 3: 상대방 발밑 착탄 & 충격파 & 결계 안착
  // --------------------------------------------------------------------------
  else if (step === 3) {
    const frontSpikes = SPIKES_CONFIG.filter((s) => s.layer === "front");

    // 1. 착탄 흙먼지 잔향 (초반 감쇠)
    if (p < 0.60) {
      const dustFade = 1.0 - p / 0.60;
      for (const s of frontSpikes) {
        const destX = targetFloorX + (isP ? s.dx : -s.dx);
        const destY = targetFloorY + s.dy;
        drawSpikeDirtPuff(targetCtx, destX, destY, 15.0, 0.50 * dustFade);
      }
    }

    // 2. 전면 안착 압정 렌더링
    for (const s of frontSpikes) {
      const destX = targetFloorX + (isP ? s.dx : -s.dx);
      const destY = targetFloorY + s.dy;
      drawSingleCaltrop(targetCtx, destX, destY, s.size, s.restAng, 1.0, true);

      // 주기적 찌릿 글린트
      const glintPulse = Math.sin(p * 8.0 + s.id * 2.2);
      if (glintPulse > 0.60) {
        drawSpikeGlint(targetCtx, destX, destY - s.size * 1.25, 7.0 + glintPulse * 4.0, (glintPulse - 0.60) / 0.40);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Step 4: 상대 진영 발밑 전역에 흩뿌려진 압정 결계 활성화
  // --------------------------------------------------------------------------
  else if (step === 4) {
    const frontSpikes = SPIKES_CONFIG.filter((s) => s.layer === "front");

    for (const s of frontSpikes) {
      const destX = targetFloorX + (isP ? s.dx : -s.dx);
      const destY = targetFloorY + s.dy;
      drawSingleCaltrop(targetCtx, destX, destY, s.size, s.restAng, 1.0, true);

      const glintPulse = Math.sin(p * 6.0 + s.id * 1.5);
      if (glintPulse > 0.50) {
        drawSpikeGlint(targetCtx, destX, destY - s.size * 1.25, 8.0, (glintPulse - 0.50) / 0.50);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Step 5: 결계 지속 & 대기 소산
  // --------------------------------------------------------------------------
  else if (step === 5) {
    const frontSpikes = SPIKES_CONFIG.filter((s) => s.layer === "front");
    const fadeAlpha = Math.max(0, 1.0 - p);

    for (const s of frontSpikes) {
      const destX = targetFloorX + (isP ? s.dx : -s.dx);
      const destY = targetFloorY + s.dy;
      drawSingleCaltrop(targetCtx, destX, destY, s.size, s.restAng, fadeAlpha, true);
    }
  }

  targetCtx.restore();
}

// ============================================================================
// ⚡ 192: 전자포 (Zap Cannon) 렌더러
// ============================================================================

/**
 * 256색 팔레트 최적화 고선명 일렉트릭/플라즈마 색상 체계 (Octree Quantizer Optimized)
 */
const ZAP_PALETTE = {
  whiteCore: "#FFFFFF",
  yellowUltra: "#FEF9C3",
  yellowLight: "#FEF08A",
  yellowCore: "#FACC15",
  yellowGold: "#EAB308",
  yellowDark: "#CA8A04",
  cyanUltra: "#F0F9FF",
  cyanLight: "#BAE6FD",
  cyanNeon: "#38BDF8",
  cyanDeep: "#0284C7",
  cyanDark: "#0369A1",
  arcViolet: "#818CF8",
  arcIndigo: "#4F46E5",
  darkIon: "rgba(15, 23, 42, 0.75)",
};

/**
 * 결정론적 의사 난수 생성기 (프레임 간 일관성 유지)
 */
function zapPseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * 테이퍼 라인 드로잉 헬퍼 (시작 폭에서 끝 폭으로 날카롭게 좁아지는 선분 렌더러)
 */
function drawTaperedLine(
  ctx: any,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  w1: number,
  w2: number,
  color: string,
  segments: number = 4
) {
  if (w1 <= 0.05 && w2 <= 0.05) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = "round";

  for (let i = 0; i < segments; i++) {
    const u1 = i / segments;
    const u2 = (i + 1) / segments;
    const px1 = x1 + (x2 - x1) * u1;
    const py1 = y1 + (y2 - y1) * u1;
    const px2 = x1 + (x2 - x1) * u2;
    const py2 = y1 + (y2 - y1) * u2;
    const w = w1 + (w2 - w1) * ((u1 + u2) * 0.5);

    if (w < 0.2) continue;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(px1, py1);
    ctx.lineTo(px2, py2);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * 4단계 발광 그라데이션 및 바늘처럼 날카로운 끝단(Tapered Sharp Needle)을 지원하는 초고품질 번개 렌더러
 * - 4-Tier Gradation: 외곽 소프트 오라 -> 선명한 네온 림 -> 밝은 중간 전이대 -> 초고열 순백 코어
 * - taperMode:
 *   - "end": 시작점은 굵고 끝점(tip)으로 갈수록 바늘처럼 날카로워짐 (방사형 폭발 벼락, 지면 접지 낙뢰 등)
 *   - "both": 양 끝이 모두 바늘처럼 가늘어지고 중앙이 굵음 (신체 통전 아크, 나선 벼락, 수렴 벼락 등)
 *   - "start": 시작점이 가늘고 끝점으로 갈수록 굵어짐
 */
function drawBranchingLightning(
  ctx: any,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  segments: number,
  maxOffset: number,
  coreColor: string,
  glowColor: string,
  width: number,
  seed: number = 0,
  branchChance: number = 0.50,
  taperMode: "end" | "both" | "start" = "end",
  fadeStart: boolean = false
) {
  if (width <= 0.1 || segments <= 1) return;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return;

  const ux = dx / dist;
  const uy = dy / dist;
  const nx = -uy;
  const ny = ux;

  // 1. 메인 줄기 점 좌표 계산
  const points: { x: number; y: number }[] = [{ x: x1, y: y1 }];
  interface BranchItem {
    points: { x: number; y: number }[];
    baseWidthRatio: number;
    startU: number;
  }
  const branches: BranchItem[] = [];

  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const rnd = zapPseudoRandom(seed + i * 4.19);
    const wave = (rnd - 0.5) * 2.0;
    const envelope = Math.sin(t * Math.PI);
    const offset = wave * maxOffset * (0.4 + envelope * 0.8);
    const px = x1 + ux * (dist * t) + nx * offset;
    const py = y1 + uy * (dist * t) + ny * offset;
    points.push({ x: px, y: py });

    // 지선 분기 생성
    if (i > 1 && i < segments - 1 && zapPseudoRandom(seed + i * 9.87) < branchChance) {
      const bSign = zapPseudoRandom(seed + i * 3.33) > 0.5 ? 1 : -1;
      const bAngle = Math.atan2(dy, dx) + bSign * (0.45 + zapPseudoRandom(seed + i * 7.7) * 0.45);
      const bLen = (dist / segments) * (1.6 + zapPseudoRandom(seed + i * 2.2) * 1.8);
      const bMidLen = bLen * 0.52;
      const bMidOffset = (zapPseudoRandom(seed + i * 8.11) - 0.5) * maxOffset * 0.5;

      const bxMid = px + Math.cos(bAngle) * bMidLen - Math.sin(bAngle) * bMidOffset;
      const byMid = py + Math.sin(bAngle) * bMidLen + Math.cos(bAngle) * bMidOffset;
      const bxEnd = px + Math.cos(bAngle) * bLen;
      const byEnd = py + Math.sin(bAngle) * bLen;

      branches.push({
        points: [
          { x: px, y: py },
          { x: bxMid, y: byMid },
          { x: bxEnd, y: byEnd },
        ],
        baseWidthRatio: 0.65,
        startU: t,
      });
    }
  }
  points.push({ x: x2, y: y2 });

  // 2. 끝단 테이퍼(Taper) 비율 계산기: 바늘 끝(0.03)으로 완벽 수렴
  const getTaper = (u: number, mode: "end" | "both" | "start") => {
    const clampedU = Math.max(0, Math.min(1, u));
    if (mode === "both") {
      // 양 끝단이 0.03 바늘 끝으로 수렴
      const sinVal = Math.sin(clampedU * Math.PI);
      return Math.max(0.03, Math.pow(sinVal, 1.1));
    } else if (mode === "start") {
      // 시작점이 0.03 바늘 끝으로 수렴
      return Math.max(0.03, Math.pow(clampedU, 0.85));
    } else {
      // "end": 끝점이 0.03 바늘 끝으로 완벽하게 수렴
      const remain = Math.max(0, 1.0 - clampedU);
      return Math.max(0.03, Math.pow(remain, 1.1));
    }
  };

  // 3. 발광 그라데이션 4-Tier 색상 및 두께 구성 (중간 밝은 영역과 외곽 사이의 풍성한 그라데이션)
  const isCyan =
    glowColor.includes("38bdf8") ||
    glowColor.includes("0284c7") ||
    glowColor.includes("cyan") ||
    glowColor === ZAP_PALETTE.cyanNeon ||
    glowColor === ZAP_PALETTE.cyanDeep;
  const isYellow =
    glowColor.includes("facc15") ||
    glowColor.includes("eab308") ||
    glowColor === ZAP_PALETTE.yellowCore ||
    glowColor === ZAP_PALETTE.yellowLight;

  const tiers = [
    // Tier 1: 외곽 소프트 방전 오라 (가장 넓은 부드러운 감쇠)
    {
      color: isCyan ? "rgba(2, 132, 199, 0.28)" : isYellow ? "rgba(202, 138, 4, 0.28)" : "rgba(79, 70, 229, 0.28)",
      widthMultiplier: 3.8,
    },
    // Tier 2: 선명한 네온 컬러 발광층 (Vivid Neon Rim)
    {
      color: glowColor,
      widthMultiplier: 2.4,
    },
    // Tier 3: 중간과 외곽 사이를 부드럽게 이어주는 밝은 하이라이트 전이대 (Bright Sub-Core Transition)
    {
      color: isCyan ? "rgba(186, 230, 253, 0.85)" : isYellow ? "rgba(254, 240, 138, 0.85)" : "rgba(221, 214, 254, 0.85)",
      widthMultiplier: 1.4,
    },
    // Tier 4: 중심 초고열 순백 코어 (Ultra-Bright Core Spine)
    {
      color: ZAP_PALETTE.whiteCore,
      widthMultiplier: 0.65,
    },
  ];

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const originalAlpha = ctx.globalAlpha || 1.0;

  // 4. 각 Tier별로 메인 줄기 및 지선을 테이퍼 세그먼트로 렌더링
  for (let t = 0; t < tiers.length; t++) {
    const tier = tiers[t];
    const baseW = width * tier.widthMultiplier;
    ctx.strokeStyle = tier.color;

    // A. 메인 줄기 그리기 (구간별 테이퍼 적용 + 시작/끝 완벽한 바늘 끝 뾰족 처리)
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const u1 = i / (points.length - 1);
      const u2 = (i + 1) / (points.length - 1);
      const isEndTipSeg = (i === points.length - 2) && (taperMode === "end" || taperMode === "both");
      const isStartTipSeg = (i === 0) && (taperMode === "start" || taperMode === "both");

      // 끝단과 시작단은 3분할 세부 서브세그먼트로 점진적 축소하여 완벽한 바늘 끝 구현
      const subCount = (isEndTipSeg || isStartTipSeg) ? 3 : 1;

      for (let s = 0; s < subCount; s++) {
        const su1 = u1 + (u2 - u1) * (s / subCount);
        const su2 = u1 + (u2 - u1) * ((s + 1) / subCount);
        const suMid = (su1 + su2) * 0.5;

        const sx1 = p1.x + (p2.x - p1.x) * (s / subCount);
        const sy1 = p1.y + (p2.y - p1.y) * (s / subCount);
        const sx2 = p1.x + (p2.x - p1.x) * ((s + 1) / subCount);
        const sy2 = p1.y + (p2.y - p1.y) * ((s + 1) / subCount);

        const segTaper = getTaper(suMid, taperMode);

        let segAlpha = 1.0;
        let startWidthMult = 1.0;
        if (fadeStart) {
          const fadeProgress = Math.min(1.0, suMid / 0.35);
          segAlpha = Math.pow(fadeProgress, 1.25);
          startWidthMult = 0.15 + Math.pow(fadeProgress, 0.9) * 0.85;
        }

        // 끝단에서 외곽 오라(Tier 0, 1)는 먼저 닫히고, 중심 순백 코어만 끝까지 뾰족하게 찌름
        let tierTipFade = 1.0;
        if (taperMode === "end" || taperMode === "both") {
          if (t === 0 && suMid > 0.88) {
            tierTipFade = Math.max(0, (1.0 - suMid) / 0.12);
          } else if (t === 1 && suMid > 0.94) {
            tierTipFade = Math.max(0, (1.0 - suMid) / 0.06);
          }
        }

        const segW = baseW * segTaper * startWidthMult * tierTipFade;
        if (segW < 0.15 || segAlpha <= 0.01) continue;

        ctx.globalAlpha = originalAlpha * segAlpha;
        ctx.lineWidth = segW;
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.stroke();
      }
    }

    // B. 지선(Branches) 그리기 (뿌리에서 끝단으로 갈수록 0.03 바늘 끝으로 수렴)
    for (let b = 0; b < branches.length; b++) {
      const br = branches[b];
      const brBaseW = baseW * br.baseWidthRatio;
      const branchOriginAlpha = fadeStart ? Math.min(1.0, Math.pow(Math.min(1.0, br.startU / 0.35), 1.25)) : 1.0;
      if (branchOriginAlpha <= 0.01) continue;

      const p0 = br.points[0];
      const p1 = br.points[1];
      const p2 = br.points[2];
      const brSubCount = 4; // 4단계 점진 세분화로 지선 끝단까지 완벽히 뾰족함 보장

      for (let s = 0; s < brSubCount; s++) {
        const v1 = s / brSubCount;
        const v2 = (s + 1) / brSubCount;
        const vMid = (v1 + v2) * 0.5;

        // 2차 베지어 곡선 보간
        const qx1 = (1 - v1) * (1 - v1) * p0.x + 2 * (1 - v1) * v1 * p1.x + v1 * v1 * p2.x;
        const qy1 = (1 - v1) * (1 - v1) * p0.y + 2 * (1 - v1) * v1 * p1.y + v1 * v1 * p2.y;
        const qx2 = (1 - v2) * (1 - v2) * p0.x + 2 * (1 - v2) * v2 * p1.x + v2 * v2 * p2.x;
        const qy2 = (1 - v2) * (1 - v2) * p0.y + 2 * (1 - v2) * v2 * p1.y + v2 * v2 * p2.y;

        // 끝단 0.03까지 완벽 테이퍼
        const brTaper = Math.max(0.03, Math.pow(1.0 - vMid, 1.2));

        // 지선 외곽 오라도 끝단에서 먼저 감쇠
        let brTierFade = 1.0;
        if (t === 0 && vMid > 0.85) {
          brTierFade = Math.max(0, (1.0 - vMid) / 0.15);
        } else if (t === 1 && vMid > 0.92) {
          brTierFade = Math.max(0, (1.0 - vMid) / 0.08);
        }

        const brW = brBaseW * brTaper * brTierFade;
        if (brW < 0.15) continue;

        ctx.globalAlpha = originalAlpha * branchOriginAlpha;
        ctx.lineWidth = brW;
        ctx.beginPath();
        ctx.moveTo(qx1, qy1);
        ctx.lineTo(qx2, qy2);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}

/**
 * 안쪽은 투명하고 바깥쪽은 그대로 유지되는 방사형 그라데이션 링 렌더러
 * - rIn (안쪽): 완전 투명 (alpha: 0.0)
 * - rMid: 안쪽에서 바깥쪽으로 이어지는 네온 발광 그라데이션
 * - R (바깥쪽 주 림): 선명한 코어 컬러 그대로 유지
 * - rOut: 바깥쪽 외곽 오라 감쇠
 */
function drawGradatedRingAnnulus(
  ctx: any,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  tiltAngle: number,
  startAng: number,
  endAng: number,
  bandWidth: number,
  coreColor: string,
  glowColor: string,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || rx <= 1 || ry <= 1) return;

  ctx.save();
  ctx.translate(cx, cy);
  if (tiltAngle !== 0) ctx.rotate(tiltAngle);
  ctx.globalAlpha = Math.min(1.0, alpha);

  const scaleY = ry / rx;
  const R = rx;
  const inBand = Math.min(R * 0.45, Math.max(2.5, bandWidth));
  const rIn = Math.max(0.5, R - inBand);
  const rOut = R + Math.max(1.2, inBand * 0.25);

  const isCyan =
    glowColor.includes("38bdf8") ||
    glowColor.includes("0284c7") ||
    glowColor.includes("cyan") ||
    glowColor === ZAP_PALETTE.cyanNeon ||
    glowColor === ZAP_PALETTE.cyanDeep;

  const fadeCol = isCyan ? "rgba(2, 132, 199, 0.00)" : "rgba(202, 138, 4, 0.00)";
  const midNeon = isCyan ? "rgba(56, 189, 248, 0.45)" : "rgba(250, 204, 21, 0.45)";

  // 1. 안쪽 투명 -> 바깥쪽 발광 그라데이션 아눌루스 (Annulus)
  ctx.save();
  ctx.scale(1, scaleY);

  const grad = ctx.createRadialGradient(0, 0, rIn, 0, 0, rOut);
  grad.addColorStop(0.00, fadeCol);       // 안쪽: 완전 투명
  grad.addColorStop(0.35, midNeon);       // 안쪽 전이대: 은은한 발광
  grad.addColorStop(0.72, glowColor);     // 바깥쪽 림: 네온 발광
  grad.addColorStop(0.90, coreColor);     // 바깥쪽 주 림: 순백/골드 코어
  grad.addColorStop(1.00, fadeCol);       // 바깥쪽 외곽 감쇠

  ctx.fillStyle = grad;
  ctx.beginPath();
  if (Math.abs(endAng - startAng) >= Math.PI * 1.99) {
    ctx.arc(0, 0, rOut, 0, Math.PI * 2, false);
    ctx.arc(0, 0, rIn, 0, Math.PI * 2, true);
  } else {
    ctx.arc(0, 0, rOut, startAng, endAng, false);
    ctx.arc(0, 0, rIn, endAng, startAng, true);
    ctx.closePath();
  }
  ctx.fill();
  ctx.restore();

  // 2. 바깥쪽 주 림 선 (바깥쪽은 선명하게 그대로 유지)
  ctx.strokeStyle = coreColor;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, startAng, endAng);
  ctx.stroke();

  ctx.restore();
}

/**
 * 3D 입체 전자기 유도 링 (Electromagnetic Induction Rings)
 * - layer: 'behind'는 물체 뒤를 지나는 상단/후면 호, 'front'는 물체 앞을 지나는 전면 호
 */
function drawMagneticRing3D(
  ctx: any,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  tiltAngle: number,
  spinPhase: number,
  layer: "behind" | "front" | "all",
  alpha: number = 1.0,
  glowColor: string = ZAP_PALETTE.cyanNeon,
  coreColor: string = ZAP_PALETTE.whiteCore
) {
  if (alpha <= 0.01 || rx <= 1 || ry <= 1) return;

  const startAng = layer === "behind" ? Math.PI : layer === "front" ? 0 : 0;
  const endAng = layer === "behind" ? Math.PI * 2 : layer === "front" ? Math.PI : Math.PI * 2;

  // 1. 안쪽은 투명, 바깥쪽은 그대로 유지되는 그라데이션 링 본체
  drawGradatedRingAnnulus(
    ctx,
    cx,
    cy,
    rx,
    ry,
    tiltAngle,
    startAng,
    endAng,
    Math.min(rx * 0.40, 6.0),
    coreColor,
    glowColor,
    alpha
  );

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tiltAngle);
  ctx.globalAlpha = Math.min(1.0, alpha);

  // 4. 링 위를 고속 회전하는 전자기 에너지 집속 노드 2개
  for (let k = 0; k < 2; k++) {
    const nodeAng = (spinPhase * Math.PI * 2 + k * Math.PI) % (Math.PI * 2);
    const isNodeInLayer =
      layer === "all" ||
      (layer === "behind" && nodeAng >= Math.PI && nodeAng <= Math.PI * 2) ||
      (layer === "front" && nodeAng >= 0 && nodeAng < Math.PI);

    if (isNodeInLayer) {
      const nx = Math.cos(nodeAng) * rx;
      const ny = Math.sin(nodeAng) * ry;

      // 링 위 에너지 집속 노드: 안쪽-외곽 그라데이션 및 외곽 투명화
      const isCyanNode = glowColor.includes("38bdf8") || glowColor.includes("0284c7");
      const fadeColor = isCyanNode ? "rgba(2, 132, 199, 0.00)" : "rgba(202, 138, 4, 0.00)";
      const pastelColor = isCyanNode ? "rgba(186, 230, 253, 0.95)" : "rgba(254, 240, 138, 0.95)";

      const nodeR = 2.8;
      const nodeGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, nodeR);
      nodeGrad.addColorStop(0.00, "#FFFFFF");
      nodeGrad.addColorStop(0.30, pastelColor);
      nodeGrad.addColorStop(0.65, glowColor);
      nodeGrad.addColorStop(1.00, fadeColor);

      ctx.fillStyle = nodeGrad;
      ctx.beginPath();
      ctx.arc(nx, ny, nodeR, 0, Math.PI * 2);
      ctx.fill();

      // 중심 고휘도 순백 다이아몬드 코어
      ctx.fillStyle = ZAP_PALETTE.whiteCore;
      ctx.beginPath();
      ctx.moveTo(nx, ny - 1.8);
      ctx.lineTo(nx + 1.1, ny);
      ctx.lineTo(nx, ny + 1.8);
      ctx.lineTo(nx - 1.1, ny);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * 초고밀도 볼 라이트닝 탄두 (Super-Dense Plasma Cannonball)
 * - 4-Layer Plasma: 외곽 시안 방전 코로나 -> 태양 플라즈마 맨틀 -> 초고열 순백 핵 -> 바늘형 삼각 플레어 & 표면 궤도 번개
 */
function drawSuperdensePlasmaCannonball(
  ctx: any,
  cx: number,
  cy: number,
  r: number,
  time: number,
  alpha: number = 1.0,
  flightAngle: number = 0
) {
  if (alpha <= 0.01 || r <= 1) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, alpha);

  // 1. 외곽 청백색/전기 블루 방전 코로나 오라 (부드러운 다단계 방사 그라데이션)
  const outerGlow = ctx.createRadialGradient(cx, cy, r * 0.35, cx, cy, r * 2.4);
  outerGlow.addColorStop(0.00, "rgba(255, 255, 255, 0.95)");
  outerGlow.addColorStop(0.25, "rgba(186, 230, 253, 0.88)");
  outerGlow.addColorStop(0.55, "rgba(56, 189, 248, 0.65)");
  outerGlow.addColorStop(0.80, "rgba(2, 132, 199, 0.30)");
  outerGlow.addColorStop(1.00, "rgba(2, 132, 199, 0.00)");
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2.4, 0, Math.PI * 2);
  ctx.fill();

  // 2. 바늘처럼 날카로운 삼각 플라즈마 스파이크 (태양 플레어 형태 8방향 요동)
  ctx.save();
  ctx.translate(cx, cy);
  const spikeCount = 8;
  for (let s = 0; s < spikeCount; s++) {
    const sAng = (s / spikeCount) * Math.PI * 2 + time * 8.0;
    const sLen = r * (1.35 + Math.sin(time * 16.0 + s * 2.1) * 0.35);
    const apexX = Math.cos(sAng) * sLen;
    const apexY = Math.sin(sAng) * sLen;

    const perpX = -Math.sin(sAng);
    const perpY = Math.cos(sAng);
    const baseHalfW = Math.max(1.2, r * 0.16);
    const innerR = r * 0.85;

    const b1X = Math.cos(sAng) * innerR + perpX * baseHalfW;
    const b1Y = Math.sin(sAng) * innerR + perpY * baseHalfW;
    const b2X = Math.cos(sAng) * innerR - perpX * baseHalfW;
    const b2Y = Math.sin(sAng) * innerR - perpY * baseHalfW;

    // 날카로운 바늘형 삼각 플레어 (Razor-Sharp Triangular Flare)
    ctx.fillStyle = s % 2 === 0 ? ZAP_PALETTE.yellowLight : ZAP_PALETTE.cyanNeon;
    ctx.beginPath();
    ctx.moveTo(b1X, b1Y);
    ctx.lineTo(apexX, apexY);
    ctx.lineTo(b2X, b2Y);
    ctx.closePath();
    ctx.fill();

    // 중심 초고열 순백 바늘선
    ctx.strokeStyle = ZAP_PALETTE.whiteCore;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(Math.cos(sAng) * innerR, Math.sin(sAng) * innerR);
    ctx.lineTo(apexX, apexY);
    ctx.stroke();
  }
  ctx.restore();

  // 3. 황금빛 고전압 플라즈마 구체 바디 (중앙 정렬 5단계 색상 그라데이션)
  const plasmaGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  plasmaGrad.addColorStop(0.00, ZAP_PALETTE.whiteCore);
  plasmaGrad.addColorStop(0.28, ZAP_PALETTE.yellowUltra);
  plasmaGrad.addColorStop(0.55, ZAP_PALETTE.yellowCore);
  plasmaGrad.addColorStop(0.82, ZAP_PALETTE.yellowGold);
  plasmaGrad.addColorStop(1.00, ZAP_PALETTE.yellowDark);
  ctx.fillStyle = plasmaGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // 4. 구체 표면을 고속으로 휘감아 도는 궤도 번개 아크 4가닥 (양 끝단이 날카로운 both 모드)
  for (let k = 0; k < 4; k++) {
    const ang1 = k * (Math.PI * 0.5) + time * 10.0;
    const ang2 = ang1 + 0.95;
    const x1 = cx + Math.cos(ang1) * (r * 1.15);
    const y1 = cy + Math.sin(ang1) * (r * 1.15);
    const x2 = cx + Math.cos(ang2) * (r * 1.15);
    const y2 = cy + Math.sin(ang2) * (r * 1.15);
    drawBranchingLightning(
      ctx,
      x1,
      y1,
      x2,
      y2,
      4,
      r * 0.40,
      ZAP_PALETTE.whiteCore,
      ZAP_PALETTE.cyanNeon,
      1.8,
      k + time * 5.0,
      0.25,
      "both"
    );
  }

  // 5. 중심 초고열 순백 코어 (정중앙 위치 & 부드러운 방사형 그라데이션)
  const coreR = r * 0.56;
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
  coreGrad.addColorStop(0.00, "#FFFFFF");
  coreGrad.addColorStop(0.35, "rgba(255, 255, 255, 0.98)");
  coreGrad.addColorStop(0.65, "rgba(254, 240, 138, 0.85)");
  coreGrad.addColorStop(0.85, "rgba(250, 204, 21, 0.40)");
  coreGrad.addColorStop(1.00, "rgba(250, 204, 21, 0.00)");

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 안쪽과 외곽 색상 그라데이션 및 외곽 투명화 그라데이션이 적용된 고품질 발광 전기 점 파티클
 * - 안쪽: 순백 초고열 코어 (#FFFFFF)
 * - 중간: 밝은 일렉트릭 파스텔 전이대 (Light Yellow / Light Cyan)
 * - 외곽: 선명한 네온 컬러 발광층 (Neon Gold / Neon Cyan)
 * - 최외곽: 100% 알파 감쇠 투명화 그라데이션 (rgba(..., 0.0))
 */
function drawElectricSparks(
  ctx: any,
  cx: number,
  cy: number,
  count: number,
  radius: number,
  alpha: number,
  seed: number,
  palette?: string[]
) {
  if (alpha <= 0.01 || count <= 0) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, alpha);

  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2 + Math.sin(i * 1.73 + seed) * 0.5;
    const dist = radius * (0.35 + 0.65 * zapPseudoRandom(seed + i * 2.71));
    const sx = cx + Math.cos(ang) * dist;
    const sy = cy + Math.sin(ang) * (dist * 0.82); // 2.5D 입체 원근
    const sSize = 0.75 + zapPseudoRandom(seed + i * 5.13) * 0.95; // 0.75px ~ 1.7px (작고 섬세한 스파크)

    const isCyan = i % 2 === 0;

    // 1. 외곽 투명화 소형 원형 발광 오라 (Tight Transparency Fade Halo)
    const haloR = sSize * 1.45; // 최대 ~2.5px 반경
    const haloGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, haloR);
    haloGrad.addColorStop(0.00, "#FFFFFF");
    haloGrad.addColorStop(0.30, isCyan ? "rgba(186, 230, 253, 0.80)" : "rgba(254, 240, 138, 0.80)");
    haloGrad.addColorStop(0.65, isCyan ? "rgba(56, 189, 248, 0.40)" : "rgba(250, 204, 21, 0.40)");
    haloGrad.addColorStop(1.00, isCyan ? "rgba(2, 132, 199, 0.00)" : "rgba(202, 138, 4, 0.00)");

    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, haloR, 0, Math.PI * 2);
    ctx.fill();

    // 2. 중심 미세 발광 코어 (안쪽-외곽 그라데이션)
    const coreGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sSize);
    coreGrad.addColorStop(0.00, "#FFFFFF");
    coreGrad.addColorStop(0.45, isCyan ? "rgba(240, 249, 255, 0.95)" : "rgba(254, 249, 195, 0.95)");
    coreGrad.addColorStop(1.00, isCyan ? "rgba(56, 189, 248, 0.00)" : "rgba(250, 204, 21, 0.00)");

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.moveTo(sx, sy - sSize * 0.85);
    ctx.lineTo(sx + sSize * 0.48, sy);
    ctx.lineTo(sx, sy + sSize * 0.85);
    ctx.lineTo(sx - sSize * 0.48, sy);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 전자포 인수 파싱 헬퍼 (배틀 GIF 렌더러 / 뷰어 완벽 호환)
 */
export function parseZapCannonArgs(
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  let ax = 200;
  let ay = 300;
  let tx = 550;
  let ty = 180;
  let step = 1;
  let p = 0.5;
  let isP = true;
  let frameObj: any = {};

  if (attackerPosOrFrame && typeof attackerPosOrFrame.x === "number") {
    ax = attackerPosOrFrame.x;
    ay = attackerPosOrFrame.y;
    tx = targetPosOrDrawCtx?.x ?? 550;
    ty = targetPosOrDrawCtx?.y ?? 180;
    step = moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, progress ?? 0.5));
    isP = Boolean(isPlayer);
  } else {
    frameObj = attackerPosOrFrame || {};
    const drawCtx = targetPosOrDrawCtx || {};
    const aPos = drawCtx.casterPos || drawCtx.attackerPos || { x: 200, y: 300 };
    const tPos = drawCtx.targetPos || { x: 550, y: 180 };
    ax = aPos.x;
    ay = aPos.y;
    tx = tPos.x;
    ty = tPos.y;
    step = frameObj.moveStep ?? (drawCtx.step || 1);
    p = Math.min(
      1.0,
      Math.max(
        0.0,
        frameObj.effectProgress ??
          frameObj.progress ??
          drawCtx.effectProgress ??
          drawCtx.progress ??
          0.5
      )
    );
    isP = drawCtx.isPlayer !== undefined ? Boolean(drawCtx.isPlayer) : true;
  }

  return { ax, ay, tx, ty, step, p, isP, frame: frameObj };
}

/**
 * ⚡ 192: 전자포 (Zap Cannon) Behind Effect
 * - Step 1: 전장 전자기 암전 비네트 & 바닥 지면 이온화 필드 & 후면 자기장 링
 * - Step 2: 궤적 후면 레일건 가속 링 & 이온화 빔 후면 오라
 * - Step 3: 상대방 등 뒤로 뻗어나가는 초대형 폭발 충격파 링 & 지면 접지 방전 크레이터
 * - Step 4: 100% 확정 마비 감전 구속망 후면 링 & 후면 접지 방전 아크
 */
export function drawZapCannonBehindEffect(
  targetCtx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  const { ax, ay, tx, ty, step, p, isP } = parseZapCannonArgs(
    attackerPosOrFrame,
    targetPosOrDrawCtx,
    moveStep,
    progress,
    isPlayer
  );

  const muzzleX = ax + (isP ? 34 : -34);
  const muzzleY = ay - (isP ? 14 : 10);
  const targetCenterY = ty - (isP ? 10 : 8);

  targetCtx.save();

  // --------------------------------------------------------------------------
  // Step 1: 대기 이온화 암전 및 시전자 발밑 자기장 필드
  // --------------------------------------------------------------------------
  if (step === 1) {
    // 1. 발밑 지면 전자기 이온화 타원 링: 안쪽은 투명, 바깥쪽은 그대로 그라데이션
    const groundR = 24.0 + p * 32.0;
    const groundAlpha = Math.min(0.65, p * 0.75);
    drawGradatedRingAnnulus(
      targetCtx,
      ax,
      ay + (isP ? 20 : 16),
      groundR,
      groundR * 0.42,
      0,
      0,
      Math.PI * 2,
      Math.min(groundR * 0.35, 8.0),
      ZAP_PALETTE.whiteCore,
      ZAP_PALETTE.cyanNeon,
      groundAlpha
    );

    // 2. 포구 중심 3D 전자기 유도 링의 후면 호
    const ringR = 14.0 + p * 18.0;
    drawMagneticRing3D(
      targetCtx,
      muzzleX,
      muzzleY,
      ringR * 1.2,
      ringR * 0.45,
      isP ? -0.25 : 0.25,
      p * 4.0,
      "behind",
      p * 0.9,
      ZAP_PALETTE.cyanNeon,
      ZAP_PALETTE.whiteCore
    );
  }

  // --------------------------------------------------------------------------
  // Step 2: 레일건 가속 링 후면 & 이온화 빔 후면 오라
  // --------------------------------------------------------------------------
  else if (step === 2) {
    const flightT = Math.min(1.0, Math.max(0.0, p));
    const curX = muzzleX + (tx - muzzleX) * flightT;
    const curY = muzzleY + (targetCenterY - muzzleY) * flightT;

    const dx = tx - muzzleX;
    const dy = targetCenterY - muzzleY;
    const beamAngle = Math.atan2(dy, dx);

    // 1. 비행 궤적을 둘러싼 레일건 전자기 가속 링 3개 (후면 호)
    for (let c = 1; c <= 3; c++) {
      const ringFrac = c * 0.28;
      if (flightT >= ringFrac * 0.7) {
        const ringX = muzzleX + dx * ringFrac;
        const ringY = muzzleY + dy * ringFrac;
        const ringScale = 1.0 + (flightT - ringFrac) * 0.6;
        const ringAlpha = Math.max(0, 0.85 - (flightT - ringFrac) * 1.2);

        drawMagneticRing3D(
          targetCtx,
          ringX,
          ringY,
          24.0 * ringScale,
          10.0 * ringScale,
          beamAngle + Math.PI * 0.5,
          flightT * 6.0,
          "behind",
          ringAlpha,
          ZAP_PALETTE.cyanNeon,
          ZAP_PALETTE.yellowLight
        );
      }
    }

    // 2. 후면 이온화 연무 (Ionization Sheath Behind)
    const beamDist = Math.hypot(curX - muzzleX, curY - muzzleY);
    if (beamDist > 5) {
      targetCtx.strokeStyle = "rgba(2, 132, 199, 0.35)";
      targetCtx.lineWidth = 26.0;
      targetCtx.lineCap = "round";
      targetCtx.beginPath();
      targetCtx.moveTo(muzzleX, muzzleY);
      targetCtx.lineTo(curX, curY);
      targetCtx.stroke();
    }
  }

  // --------------------------------------------------------------------------
  // Step 3: 상대방 등 뒤로 터져나가는 초대형 플라즈마 후면 폭발 충격파 및 지면 크레이터
  // --------------------------------------------------------------------------
  else if (step === 3) {
    const shockR = 35.0 + p * 85.0;
    const shockAlpha = Math.max(0, 0.90 * (1.0 - p * 0.85));

    // 1. 발밑 지면 초고열 전자기 방전 크레이터
    const craterR = 40.0 + p * 60.0;
    targetCtx.fillStyle = `rgba(2, 132, 199, ${shockAlpha * 0.40})`;
    targetCtx.beginPath();
    targetCtx.ellipse(tx, ty + 18, craterR, craterR * 0.45, 0, 0, Math.PI * 2);
    targetCtx.fill();

    drawGradatedRingAnnulus(
      targetCtx,
      tx,
      ty + 18,
      craterR * 0.85,
      craterR * 0.38,
      0,
      0,
      Math.PI * 2,
      Math.min(craterR * 0.30, 8.0),
      ZAP_PALETTE.yellowUltra,
      ZAP_PALETTE.yellowGold,
      shockAlpha * 0.85
    );

    // 2. 후면 다중 팽창 충격파 링: 안쪽은 투명, 바깥쪽은 그대로 그라데이션
    drawGradatedRingAnnulus(
      targetCtx,
      tx,
      targetCenterY,
      shockR * 1.25,
      shockR * 0.90,
      0,
      0,
      Math.PI * 2,
      Math.min(shockR * 0.35, 12.0),
      ZAP_PALETTE.whiteCore,
      ZAP_PALETTE.cyanNeon,
      shockAlpha * 0.85
    );

    drawGradatedRingAnnulus(
      targetCtx,
      tx,
      targetCenterY,
      shockR * 0.85,
      shockR * 0.65,
      0,
      0,
      Math.PI * 2,
      Math.min(shockR * 0.30, 9.0),
      ZAP_PALETTE.yellowLight,
      ZAP_PALETTE.yellowGold,
      shockAlpha
    );

    // 3. 후면 방사형 대형 벼락 볼트 6가닥 (끝단이 바늘처럼 날카로운 end 테이퍼)
    for (let k = 0; k < 6; k++) {
      const ang = (k / 6) * Math.PI * 2 + p * 1.5;
      const bx = tx + Math.cos(ang) * (shockR * 1.45);
      const by = targetCenterY + Math.sin(ang) * (shockR * 1.05);
      drawBranchingLightning(
        targetCtx,
        tx,
        targetCenterY,
        bx,
        by,
        5,
        22,
        ZAP_PALETTE.whiteCore,
        ZAP_PALETTE.cyanDeep,
        2.4,
        k + p * 7.0,
        0.55,
        "end",
        true // 폭발 중심 시작 부분은 투명하게 그라데이션 페이드인
      );
    }
  }

  // --------------------------------------------------------------------------
  // Step 4: 100% 확정 마비 감전 구속망 (후면 호 & 후면 접지 아크)
  // --------------------------------------------------------------------------
  else if (step === 4) {
    const cageAlpha = Math.max(0, 0.95 * (1.0 - p * 0.45));

    // 1. 발밑에서 지면으로 뻗는 후면 접지 전류 아크 3가닥 (지면 접지단이 예리하게 꽂히는 end 테이퍼)
    const groundOffsets = [-32, 0, 32];
    for (let g = 0; g < groundOffsets.length; g++) {
      const gx = tx + groundOffsets[g];
      const gy = ty + 24;
      drawBranchingLightning(
        targetCtx,
        tx + groundOffsets[g] * 0.3,
        ty + 10,
        gx,
        gy,
        4,
        10,
        ZAP_PALETTE.whiteCore,
        ZAP_PALETTE.yellowGold,
        2.2,
        g + p * 10.0,
        0.3,
        "end"
      );
    }

    // 2. 상대방 신체를 구속하는 3중 전자기 링 (머리, 몸통, 하체 후면 호)
    const CAGE_LEVELS = [
      { yOff: -26, rx: 20, ry: 7 },
      { yOff: -8,  rx: 26, ry: 9 },
      { yOff: 10,  rx: 22, ry: 8 },
    ];

    for (let l = 0; l < CAGE_LEVELS.length; l++) {
      const lvl = CAGE_LEVELS[l];
      drawMagneticRing3D(
        targetCtx,
        tx,
        targetCenterY + lvl.yOff,
        lvl.rx,
        lvl.ry,
        0,
        p * 5.0 + l * 0.33,
        "behind",
        cageAlpha,
        ZAP_PALETTE.cyanNeon,
        ZAP_PALETTE.yellowCore
      );
    }

    // 3. 후면 잔류 감전 스파크
    drawElectricSparks(targetCtx, tx, targetCenterY, 10, 42, cageAlpha * 0.7, p * 5.0);
  }

  targetCtx.restore();
}

/**
 * ⚡ 192: 전자포 (Zap Cannon) Front Effect
 * - Step 1: 시전자 포구 초고압 플라즈마 에너지 응축 (수렴 벼락 & 전자기 유도 링 & 핵 팽창)
 * - Step 2: 대포 격발! 레일건 사출 & 이온화 빔 회랑 & 이중 나선 벼락 & 초음속 마하 콘
 * - Step 3: 상대방 정면 직격 & 초신성 플라즈마 대폭발 & 16방향 방사 벼락 분기 폭쇄
 * - Step 4: 100% 확정 마비 감전! 전신을 옥죄는 3D 전자기 구속망 & 고전압 통전 경련
 * - Step 5: 방전 소산 및 대기 이온화 안정화
 */
export function drawZapCannonEffect(
  targetCtx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  const { ax, ay, tx, ty, step, p, isP } = parseZapCannonArgs(
    attackerPosOrFrame,
    targetPosOrDrawCtx,
    moveStep,
    progress,
    isPlayer
  );

  const muzzleX = ax + (isP ? 34 : -34);
  const muzzleY = ay - (isP ? 14 : 10);
  const targetAimX = tx;
  const targetAimY = ty - (isP ? 10 : 8);

  const dx = targetAimX - muzzleX;
  const dy = targetAimY - muzzleY;
  const beamDist = Math.hypot(dx, dy);
  const beamAngle = Math.atan2(dy, dx);
  const ux = dx / (beamDist || 1);
  const uy = dy / (beamDist || 1);
  const nx = -uy;
  const ny = ux;

  targetCtx.save();

  // --------------------------------------------------------------------------
  // Step 1: 대포 에너지 응축 (Electromagnetic Condensation & Core Charging)
  // --------------------------------------------------------------------------
  if (step === 1) {
    const chargeR = 7.0 + p * 19.0;
    const chargeAlpha = Math.min(1.0, 0.40 + p * 0.60);

    // 1. 포구 중심 3D 전자기 유도 링의 전면 호 (회전 자기장 코일)
    const ringR = 14.0 + p * 18.0;
    drawMagneticRing3D(
      targetCtx,
      muzzleX,
      muzzleY,
      ringR * 1.2,
      ringR * 0.45,
      isP ? -0.25 : 0.25,
      p * 4.0,
      "front",
      chargeAlpha,
      ZAP_PALETTE.cyanNeon,
      ZAP_PALETTE.whiteCore
    );

    // 2. 사방 먼 곳에서 포구 핵으로 맹렬히 빨려 들어가는 수렴 벼락 6가닥 (외곽 출발점이 날카로운 start 모드)
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + p * 4.5;
      const outerDist = 65.0 - p * 35.0;
      const sx = muzzleX + Math.cos(ang) * outerDist;
      const sy = muzzleY + Math.sin(ang) * (outerDist * 0.75);

      drawBranchingLightning(
        targetCtx,
        sx,
        sy,
        muzzleX,
        muzzleY,
        4,
        14,
        ZAP_PALETTE.whiteCore,
        ZAP_PALETTE.cyanNeon,
        2.2,
        i + p * 7.0,
        0.35,
        "start"
      );
    }

    // 3. 포구 초고열 플라즈마 구체 바디
    drawSuperdensePlasmaCannonball(targetCtx, muzzleX, muzzleY, chargeR, p * 3.0, chargeAlpha, beamAngle);

    // 4. 구체 외곽 고속 수축 에너지 링 2개: 안쪽은 투명, 바깥쪽은 그대로 그라데이션
    for (let k = 0; k < 2; k++) {
      const shrinkPhase = (p * 2.5 + k * 0.5) % 1.0;
      const curRingR = Math.max(1, chargeR * (2.8 - shrinkPhase * 1.8));
      const ringAlpha = Math.sin(shrinkPhase * Math.PI) * 0.85;

      drawGradatedRingAnnulus(
        targetCtx,
        muzzleX,
        muzzleY,
        curRingR,
        curRingR,
        0,
        0,
        Math.PI * 2,
        Math.min(curRingR * 0.40, 6.0),
        k === 0 ? ZAP_PALETTE.yellowLight : ZAP_PALETTE.whiteCore,
        k === 0 ? ZAP_PALETTE.yellowGold : ZAP_PALETTE.cyanNeon,
        ringAlpha
      );
    }

    // 5. 유입되는 고압 스파크 파티클
    drawElectricSparks(targetCtx, muzzleX, muzzleY, 12, chargeR * 1.8, chargeAlpha, p * 6.0);
  }

  // --------------------------------------------------------------------------
  // Step 2: 레일건 포격 사출 & 초음속 마하 쇄도 (Cannon Fire & Flight)
  // --------------------------------------------------------------------------
  else if (step === 2) {
    const flightT = Math.min(1.0, Math.max(0.0, p));
    const curX = muzzleX + dx * flightT;
    const curY = muzzleY + dy * flightT;

    // 1. 포구 머즐 블라스트 (Muzzle Burst & Flash)
    const muzzleBurstR = 24.0 * Math.max(0, 1.0 - p * 1.8);
    if (muzzleBurstR > 1.0) {
      drawSuperdensePlasmaCannonball(targetCtx, muzzleX, muzzleY, muzzleBurstR, p, 1.0 - p * 1.2, beamAngle);

      // 머즐 방사 스파크
      drawElectricSparks(targetCtx, muzzleX, muzzleY, 14, muzzleBurstR * 2.0, 1.0 - p * 1.5, p);
    }

    // 2. 고전압 전력 빔 회랑 (5-Tier 풍성한 광학 발광 그라데이션)
    const beamAlpha = Math.max(0, 0.95 * (1.0 - p * 0.35));

    // Tier 1: 외곽 블루 이온화 채널
    targetCtx.strokeStyle = `rgba(2, 132, 199, ${beamAlpha * 0.28})`;
    targetCtx.lineWidth = 26.0;
    targetCtx.lineCap = "round";
    targetCtx.beginPath();
    targetCtx.moveTo(muzzleX, muzzleY);
    targetCtx.lineTo(curX, curY);
    targetCtx.stroke();

    // Tier 2: 선명한 네온 시안 채널
    targetCtx.strokeStyle = `rgba(56, 189, 248, ${beamAlpha * 0.65})`;
    targetCtx.lineWidth = 16.0;
    targetCtx.beginPath();
    targetCtx.moveTo(muzzleX, muzzleY);
    targetCtx.lineTo(curX, curY);
    targetCtx.stroke();

    // Tier 3: 하이라이트 일렉트릭 옐로우 전이대
    targetCtx.strokeStyle = `rgba(254, 240, 138, ${beamAlpha * 0.85})`;
    targetCtx.lineWidth = 9.0;
    targetCtx.beginPath();
    targetCtx.moveTo(muzzleX, muzzleY);
    targetCtx.lineTo(curX, curY);
    targetCtx.stroke();

    // Tier 4: 중심 솔라 플라즈마 코어
    targetCtx.strokeStyle = `rgba(250, 204, 21, ${beamAlpha * 0.95})`;
    targetCtx.lineWidth = 5.2;
    targetCtx.beginPath();
    targetCtx.moveTo(muzzleX, muzzleY);
    targetCtx.lineTo(curX, curY);
    targetCtx.stroke();

    // Tier 5: 최심부 순백 초고열 레이저 스파인
    targetCtx.strokeStyle = ZAP_PALETTE.whiteCore;
    targetCtx.lineWidth = 2.4;
    targetCtx.beginPath();
    targetCtx.moveTo(muzzleX, muzzleY);
    targetCtx.lineTo(curX, curY);
    targetCtx.stroke();

    // 3. 빔 회랑을 감싸고 회전하는 이중 나선 벼락 (양 끝이 바늘처럼 가늘어지는 테이퍼 나선)
    const helixSamples = 18;
    const helixR = 14.0;
    for (let h = 0; h < 2; h++) {
      const hPhase = h * Math.PI + p * 14.0;
      const helixPts: { x: number; y: number }[] = [];

      for (let s = 0; s <= helixSamples; s++) {
        const u = s / helixSamples;
        const ptX = muzzleX + (curX - muzzleX) * u;
        const ptY = muzzleY + (curY - muzzleY) * u;
        const wave = Math.sin(u * Math.PI * 4.5 + hPhase) * helixR * Math.sin(u * Math.PI);
        helixPts.push({ x: ptX + nx * wave, y: ptY + ny * wave });
      }

      // 나선 2-Tier Tapered 드로잉 (Glow + Core)
      for (let pass = 0; pass < 2; pass++) {
        targetCtx.strokeStyle =
          pass === 0
            ? h === 0
              ? "rgba(56, 189, 248, 0.85)"
              : "rgba(250, 204, 21, 0.85)"
            : ZAP_PALETTE.whiteCore;

        for (let s = 0; s < helixPts.length - 1; s++) {
          const uMid = (s + 0.5) / (helixPts.length - 1);
          const taper = Math.max(0.03, Math.pow(Math.sin(uMid * Math.PI), 1.15));
          const segW = (pass === 0 ? 3.6 : 1.5) * taper;
          if (segW < 0.15) continue;

          targetCtx.lineWidth = segW;
          targetCtx.beginPath();
          targetCtx.moveTo(helixPts[s].x, helixPts[s].y);
          targetCtx.lineTo(helixPts[s + 1].x, helixPts[s + 1].y);
          targetCtx.stroke();
        }
      }
    }

    // 4. 레일건 가속 링 전면 호 (Front Halves of Induction Rings)
    for (let c = 1; c <= 3; c++) {
      const ringFrac = c * 0.28;
      if (flightT >= ringFrac * 0.7) {
        const ringX = muzzleX + dx * ringFrac;
        const ringY = muzzleY + dy * ringFrac;
        const ringScale = 1.0 + (flightT - ringFrac) * 0.6;
        const ringAlpha = Math.max(0, 0.90 - (flightT - ringFrac) * 1.2);

        drawMagneticRing3D(
          targetCtx,
          ringX,
          ringY,
          24.0 * ringScale,
          10.0 * ringScale,
          beamAngle + Math.PI * 0.5,
          flightT * 6.0,
          "front",
          ringAlpha,
          ZAP_PALETTE.cyanNeon,
          ZAP_PALETTE.yellowLight
        );
      }
    }

    // 5. 주 탄두: 초대형 초고압 플라즈마 캐논볼
    const cannonR = 21.0 + Math.sin(p * Math.PI) * 4.0;
    drawSuperdensePlasmaCannonball(targetCtx, curX, curY, cannonR, p * 12.0, 1.0, beamAngle);

    // 6. 탄두 전면 공기 압축 마하 충격파 콘 (끝쪽이 예리하게 좁아지는 테이퍼 선)
    const coneNoseX = curX + ux * 28;
    const coneNoseY = curY + uy * 28;
    const wing1X = curX - ux * 12 + nx * 24;
    const wing1Y = curY - uy * 12 + ny * 24;
    const wing2X = curX - ux * 12 - nx * 24;
    const wing2Y = curY - uy * 12 - ny * 24;

    drawTaperedLine(targetCtx, coneNoseX, coneNoseY, wing1X, wing1Y, 3.2, 0.3, "rgba(255, 255, 255, 0.95)");
    drawTaperedLine(targetCtx, coneNoseX, coneNoseY, wing2X, wing2Y, 3.2, 0.3, "rgba(255, 255, 255, 0.95)");

    const outerNoseX = curX + ux * 36;
    const outerNoseY = curY + uy * 36;
    const outerWing1X = curX - ux * 8 + nx * 32;
    const outerWing1Y = curY - uy * 8 + ny * 32;
    const outerWing2X = curX - ux * 8 - nx * 32;
    const outerWing2Y = curY - uy * 8 - ny * 32;

    drawTaperedLine(targetCtx, outerNoseX, outerNoseY, outerWing1X, outerWing1Y, 2.0, 0.2, "rgba(56, 189, 248, 0.75)");
    drawTaperedLine(targetCtx, outerNoseX, outerNoseY, outerWing2X, outerWing2Y, 2.0, 0.2, "rgba(56, 189, 248, 0.75)");
  }

  // --------------------------------------------------------------------------
  // Step 3: 상대방 직격 & 초신성 플라즈마 대폭발 (Catastrophic Detonation)
  // --------------------------------------------------------------------------
  else if (step === 3) {
    const burstR = 24.0 + p * 56.0;
    const burstAlpha = Math.max(0, 1.0 - p * 0.75);

    // 1. 중심 순백/황금 플라즈마 대폭발 화구
    drawSuperdensePlasmaCannonball(
      targetCtx,
      targetAimX,
      targetAimY,
      burstR,
      p * 10.0,
      burstAlpha,
      beamAngle
    );

    // 2. 16방향 전방위 방사형 벼락 분기 폭쇄 (바깥쪽 끝단이 바늘처럼 뾰족한 end 테이퍼)
    const BOLT_COUNT = 16;
    for (let b = 0; b < BOLT_COUNT; b++) {
      const ang = (b / BOLT_COUNT) * Math.PI * 2 + Math.sin(b * 1.9 + p * 5.0) * 0.35;
      const bDist = burstR * (1.3 + 0.75 * Math.sin(b * 2.3 + p * 6.0));
      const bx = targetAimX + Math.cos(ang) * bDist;
      const by = targetAimY + Math.sin(ang) * (bDist * 0.85);

      const isEven = b % 2 === 0;
      const coreCol = isEven ? ZAP_PALETTE.whiteCore : ZAP_PALETTE.yellowLight;
      const glowCol = isEven ? ZAP_PALETTE.cyanNeon : ZAP_PALETTE.yellowCore;

      drawBranchingLightning(
        targetCtx,
        targetAimX,
        targetAimY,
        bx,
        by,
        6,
        24,
        coreCol,
        glowCol,
        2.8,
        b + p * 8.0,
        0.55,
        "end",
        true // 폭발 중심 시작 부분은 투명하게 그라데이션 페이드인!
      );
    }

    // 3. 전방위로 폭발 비산하는 고압 전기 스파크 파티클 28개
    drawElectricSparks(
      targetCtx,
      targetAimX,
      targetAimY,
      28,
      burstR * 1.85,
      burstAlpha,
      p * 9.0
    );

    // 4. 전면 고속 충격파 링: 안쪽은 투명, 바깥쪽은 그대로 그라데이션
    drawGradatedRingAnnulus(
      targetCtx,
      targetAimX,
      targetAimY,
      burstR * 1.15,
      burstR * 1.15,
      0,
      0,
      Math.PI * 2,
      Math.min(burstR * 0.40, 14.0),
      ZAP_PALETTE.whiteCore,
      ZAP_PALETTE.cyanNeon,
      burstAlpha * 0.95
    );
  }

  // --------------------------------------------------------------------------
  // Step 4: 100% 확정 마비 감전! 전신을 옥죄는 전자기 구속망 & 고전압 경련 (Electromagnetic Paralysis Cage)
  // --------------------------------------------------------------------------
  else if (step === 4) {
    const electroAlpha = Math.max(0, 0.98 * (1.0 - p * 0.40));

    // 1. 상대방 신체 3단 전자기 구속 링 전면 호 (머리, 몸통, 하체)
    const CAGE_LEVELS = [
      { yOff: -26, rx: 20, ry: 7 },
      { yOff: -8,  rx: 26, ry: 9 },
      { yOff: 10,  rx: 22, ry: 8 },
    ];

    for (let l = 0; l < CAGE_LEVELS.length; l++) {
      const lvl = CAGE_LEVELS[l];
      drawMagneticRing3D(
        targetCtx,
        targetAimX,
        targetAimY + lvl.yOff,
        lvl.rx,
        lvl.ry,
        0,
        p * 5.0 + l * 0.33,
        "front",
        electroAlpha,
        ZAP_PALETTE.cyanNeon,
        ZAP_PALETTE.yellowCore
      );
    }

    // 2. 머리끝부터 발끝까지 전신을 가로지르는 격렬한 7중 관통 고압 벼락 아크망 (양 끝이 바늘처럼 뾰족한 both 모드)
    const CRAWL_BOLTS = [
      { x1: targetAimX - 22, y1: targetAimY - 32, x2: targetAimX + 24, y2: targetAimY - 14 },
      { x1: targetAimX + 24, y1: targetAimY - 26, x2: targetAimX - 22, y2: targetAimY + 8  },
      { x1: targetAimX - 26, y1: targetAimY + 6,  x2: targetAimX + 26, y2: targetAimY + 24 },
      { x1: targetAimX - 14, y1: targetAimY - 36, x2: targetAimX + 16, y2: targetAimY + 30 },
      { x1: targetAimX + 18, y1: targetAimY - 34, x2: targetAimX - 20, y2: targetAimY + 28 },
      { x1: targetAimX - 30, y1: targetAimY - 4,  x2: targetAimX + 30, y2: targetAimY - 4  },
      { x1: targetAimX,      y1: targetAimY - 38, x2: targetAimX,      y2: targetAimY + 34 },
    ];

    for (let c = 0; c < CRAWL_BOLTS.length; c++) {
      const bolt = CRAWL_BOLTS[c];
      const isAlt = c % 2 === 0;
      const coreCol = isAlt ? ZAP_PALETTE.whiteCore : ZAP_PALETTE.yellowUltra;
      const glowCol = isAlt ? ZAP_PALETTE.yellowCore : ZAP_PALETTE.cyanNeon;

      drawBranchingLightning(
        targetCtx,
        bolt.x1,
        bolt.y1,
        bolt.x2,
        bolt.y2,
        5,
        14,
        coreCol,
        glowCol,
        3.0,
        c + p * 16.0,
        0.4,
        "both" // 양 끝단이 피격체 표면에 예리하게 꽂히도록 both 테이퍼 적용
      );

      // 관통 교차점 방전 노드: 안쪽-외곽 그라데이션 및 외곽 투명화 원형 발광 + 다이아몬드 코어
      const midX = (bolt.x1 + bolt.x2) * 0.5;
      const midY = (bolt.y1 + bolt.y2) * 0.5;
      const nodeR = 2.6;
      const nGrad = targetCtx.createRadialGradient(midX, midY, 0, midX, midY, nodeR);
      nGrad.addColorStop(0.00, "#FFFFFF");
      nGrad.addColorStop(0.30, isAlt ? "rgba(254, 240, 138, 0.95)" : "rgba(186, 230, 253, 0.95)");
      nGrad.addColorStop(0.65, glowCol);
      nGrad.addColorStop(1.00, isAlt ? "rgba(202, 138, 4, 0.00)" : "rgba(2, 132, 199, 0.00)");

      targetCtx.fillStyle = nGrad;
      targetCtx.beginPath();
      targetCtx.arc(midX, midY, nodeR, 0, Math.PI * 2);
      targetCtx.fill();

      // 중심 고휘도 순백 다이아몬드 코어
      targetCtx.fillStyle = ZAP_PALETTE.whiteCore;
      targetCtx.beginPath();
      targetCtx.moveTo(midX, midY - 1.6);
      targetCtx.lineTo(midX + 1.0, midY);
      targetCtx.lineTo(midX, midY + 1.6);
      targetCtx.lineTo(midX - 1.0, midY);
      targetCtx.closePath();
      targetCtx.fill();
    }

    // 3. 전신 고전압 스파크 폭발
    drawElectricSparks(
      targetCtx,
      targetAimX,
      targetAimY,
      22,
      48.0,
      electroAlpha,
      p * 10.0
    );
  }

  // --------------------------------------------------------------------------
  // Step 5: 방전 소산 및 대기 이온화 안정화 (Dissipation & Settling)
  // --------------------------------------------------------------------------
  else if (step === 5) {
    const fadeAlpha = Math.max(0, 0.75 * (1.0 - p));

    // 부유하는 잔류 전기 스파크
    drawElectricSparks(
      targetCtx,
      targetAimX,
      targetAimY,
      14,
      42.0,
      fadeAlpha,
      p * 4.0
    );

    // 잔여 미세 전기 아크 3가닥 (양 끝단이 날카로운 both 모드)
    if (fadeAlpha > 0.15) {
      drawBranchingLightning(
        targetCtx,
        targetAimX - 18,
        targetAimY - 12,
        targetAimX + 20,
        targetAimY + 10,
        4,
        10,
        ZAP_PALETTE.whiteCore,
        ZAP_PALETTE.cyanNeon,
        1.8,
        p * 6.0,
        0.2,
        "both"
      );
      drawBranchingLightning(
        targetCtx,
        targetAimX + 15,
        targetAimY - 16,
        targetAimX - 14,
        targetAimY + 18,
        4,
        8,
        ZAP_PALETTE.yellowLight,
        ZAP_PALETTE.yellowGold,
        1.5,
        p * 9.0,
        0.2,
        "both"
      );
    }
  }

  targetCtx.restore();
}


