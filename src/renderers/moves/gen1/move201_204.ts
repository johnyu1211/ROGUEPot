// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawMiniRetroStar } from "../common/helpers.js";
import { drawRecoveryStarSpiral } from "./move105_108.js";

// ============================================================================
// 🌪️ 201: 모래바람 (Sandstorm) - 바위 타입 변화 기술 (날씨)
//
// 5턴 동안 전장에 모래바람을 일으켜 바위/땅/강철 이외의 포켓몬에게 매 턴 데미지를 준다.
// 바위 타입의 특수방어가 1.5배 증가한다.
//
// [연출 기승전결 5단계 시퀀스]:
// 1. [기 모으기 & 발구르기]: 시전자 웅크림 및 발밑 모래먼지 솟구침
// 2. [모래 소용돌이 기둥 분출]: 시전자 도약/포효 및 나선형 샌드 볼텍스 기둥 폭발
// 3. [모래폭풍 전장 쇄도]: 전장 전체로 거센 사선 모래바람 제트 스트림 & 흙먼지 연무 확산
// 4. [모래폭풍 절정]: 전신을 휩쓰는 고속 모래알갱이, 회전 암석 파편, 황토빛 대기 틴트
// 5. [필드 안착 & 안정화]: 지속적인 모래바람 날씨 효과로 정착되며 시전자 복귀
// ============================================================================

// 256색 최적화 모래/바위 팔레트
const SAND_DARK = "#78350F";       // 음영/암석 외곽
const SAND_BROWN = "#92400E";      // 짙은 황토
const SAND_MID = "#B45309";        // 기본 모래
const SAND_WARM = "#D97706";       // 따뜻한 모래
const SAND_GOLD = "#F59E0B";       // 황금빛 모래
const SAND_LIGHT = "#FBBF24";      // 밝은 모래
const SAND_PALE = "#FDE68A";       // 연한 모래먼지
const SAND_WHITE = "#FFFBEB";      // 하이라이트 코어

/**
 * 인자 파싱 헬퍼 (모래바람)
 */
function parseSandstormArgs(
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  let ax = 130;
  let ay = 220;
  let tx = 380;
  let ty = 130;
  let step = 1;
  let p = 0.5;
  let isP = true;
  let frameObj: BattleFrame | null = null;
  let drawCtxObj: EffectDrawContext | null = null;

  if (attackerPosOrFrame && typeof attackerPosOrFrame === "object" && "moveStep" in attackerPosOrFrame) {
    frameObj = attackerPosOrFrame as BattleFrame;
    drawCtxObj = (targetPosOrDrawCtx as EffectDrawContext) || {};
    const aPos = drawCtxObj.attackerPos || { x: 130, y: 220 };
    const tPos = drawCtxObj.targetPos || { x: 380, y: 130 };
    isP = drawCtxObj.isPlayer !== undefined ? Boolean(drawCtxObj.isPlayer) : true;
    ax = aPos.x + (isP ? (frameObj?.pOffset?.x ?? 0) : (frameObj?.eOffset?.x ?? 0));
    ay = aPos.y + (isP ? (frameObj?.pOffset?.y ?? 0) : (frameObj?.eOffset?.y ?? 0));
    tx = tPos.x + (isP ? (frameObj?.eOffset?.x ?? 0) : (frameObj?.pOffset?.x ?? 0));
    ty = tPos.y + (isP ? (frameObj?.eOffset?.y ?? 0) : (frameObj?.pOffset?.y ?? 0));
    step = frameObj?.moveStep ?? 1;
    p = frameObj?.effectProgress ?? 0.5;
  } else if (attackerPosOrFrame && typeof attackerPosOrFrame === "object" && "x" in attackerPosOrFrame) {
    ax = attackerPosOrFrame.x;
    ay = attackerPosOrFrame.y;
    if (targetPosOrDrawCtx && typeof targetPosOrDrawCtx === "object" && "x" in targetPosOrDrawCtx) {
      tx = targetPosOrDrawCtx.x;
      ty = targetPosOrDrawCtx.y;
    }
    step = moveStep || 1;
    p = progress !== undefined ? Math.min(1.0, Math.max(0.0, progress)) : 0.5;
    isP = isPlayer !== undefined ? isPlayer : true;
  } else {
    frameObj = (attackerPosOrFrame as BattleFrame) || null;
    drawCtxObj = (targetPosOrDrawCtx as EffectDrawContext) || {};
    const aPos = drawCtxObj.attackerPos || { x: 130, y: 220 };
    const tPos = drawCtxObj.targetPos || { x: 380, y: 130 };
    isP = drawCtxObj.isPlayer !== undefined ? Boolean(drawCtxObj.isPlayer) : true;
    ax = aPos.x;
    ay = aPos.y;
    tx = tPos.x;
    ty = tPos.y;
    step = frameObj?.moveStep ?? (drawCtxObj?.step || 1);
    p = frameObj?.effectProgress ?? (drawCtxObj?.progress || 0.5);
  }

  return { ax, ay, tx, ty, step, p, isP, frame: frameObj, drawCtx: drawCtxObj };
}

/**
 * 부드러운 모래먼지 연무 구름 (Dust Puff)
 */
function drawDustPuff(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number,
  colorInner: string = SAND_WHITE,
  colorOuter: string = SAND_LIGHT
) {
  if (alpha <= 0.01 || radius <= 1) return;
  ctx.save();
  // 가로로 훨씬 넓게 펼쳐지는 바람결 타원형 모래구름
  ctx.translate(cx, cy);
  ctx.scale(3.5, 0.52);

  const grad = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius);
  grad.addColorStop(0, colorInner);
  grad.addColorStop(0.55, colorOuter);
  grad.addColorStop(1, "rgba(245, 158, 11, 0)"); // 밝은 모래빛으로 페이드아웃

  // 투명도 더 올림 (더 은은하고 투명하게 부드러운 먼지 연무)
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha * 0.6));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 회전하는 각진 암석/자갈 파편 (Tumbling Rock Pebble)
 */
function drawRockPebble(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  angle: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || size <= 0.5) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // 2.5D 입체 각진 다각형 자갈
  const r = size;
  ctx.beginPath();
  ctx.moveTo(-r * 0.8, -r * 0.4);
  ctx.lineTo(-r * 0.2, -r * 0.9);
  ctx.lineTo(r * 0.7, -r * 0.5);
  ctx.lineTo(r * 0.9, r * 0.3);
  ctx.lineTo(r * 0.1, r * 0.8);
  ctx.lineTo(-r * 0.7, r * 0.6);
  ctx.closePath();

  // 음영 면
  ctx.fillStyle = SAND_DARK;
  ctx.fill();

  // 하이라이트 윗면
  ctx.beginPath();
  ctx.moveTo(-r * 0.8, -r * 0.4);
  ctx.lineTo(-r * 0.2, -r * 0.9);
  ctx.lineTo(r * 0.7, -r * 0.5);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fillStyle = SAND_WARM;
  ctx.fill();

  // 밝은 모서리 라인
  ctx.beginPath();
  ctx.moveTo(-r * 0.2, -r * 0.9);
  ctx.lineTo(0, 0);
  ctx.lineTo(r * 0.9, r * 0.3);
  ctx.strokeStyle = SAND_LIGHT;
  ctx.lineWidth = Math.max(0.8, r * 0.25);
  ctx.stroke();

  ctx.restore();
}

function hexToRgba(hex: string, a: number): string {
  if (hex.startsWith("#")) {
    let c = hex.slice(1);
    if (c.length === 3) c = c.split("").map(x => x + x).join("");
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  return hex;
}

/**
 * 부드러운 유선형 모래바람 스트림 (Curved Aerodynamic Sand Wind with Transparent Gradient)
 */
function drawSandStream(
  ctx: any,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  curveOffset: number,
  width: number,
  alpha: number,
  color: string = SAND_WARM
) {
  // 모래바람 선(빗금 스트림) 비활성화
  return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 시작과 끝이 부드럽게 페이드아웃되는 투명 선형 그라데이션
  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  grad.addColorStop(0, hexToRgba(color, 0));
  grad.addColorStop(0.25, hexToRgba(color, 0.95));
  grad.addColorStop(0.75, hexToRgba(color, 0.95));
  grad.addColorStop(1, hexToRgba(color, 0));

  ctx.strokeStyle = grad;
  ctx.lineWidth = width;
  ctx.lineCap = "round";

  const mx = (x1 + x2) / 2 + curveOffset * 0.25;
  const my = (y1 + y2) / 2 + curveOffset;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(mx, my, x2, y2);
  ctx.stroke();
  ctx.restore();
}

/**
 * 모래 알갱이 입자 배열 (난수 시드 기반 고정 오프셋)
 */
const SAND_GRAINS = [
  { sx: 0.10, sy: 0.25, vx: 180, vy: 40, size: 1.6, color: SAND_WARM },
  { sx: 0.22, sy: 0.15, vx: 210, vy: 50, size: 1.2, color: SAND_LIGHT },
  { sx: 0.35, sy: 0.35, vx: 195, vy: 35, size: 2.0, color: SAND_BROWN },
  { sx: 0.05, sy: 0.55, vx: 220, vy: 45, size: 1.4, color: SAND_PALE },
  { sx: 0.48, sy: 0.20, vx: 200, vy: 38, size: 1.8, color: SAND_GOLD },
  { sx: 0.60, sy: 0.40, vx: 230, vy: 55, size: 1.1, color: SAND_LIGHT },
  { sx: 0.15, sy: 0.70, vx: 190, vy: 42, size: 2.2, color: SAND_MID },
  { sx: 0.72, sy: 0.30, vx: 215, vy: 48, size: 1.5, color: SAND_WARM },
  { sx: 0.28, sy: 0.85, vx: 205, vy: 36, size: 1.3, color: SAND_PALE },
  { sx: 0.80, sy: 0.50, vx: 225, vy: 52, size: 1.9, color: SAND_BROWN },
  { sx: 0.40, sy: 0.65, vx: 198, vy: 44, size: 2.4, color: SAND_DARK },
  { sx: 0.55, sy: 0.80, vx: 212, vy: 40, size: 1.7, color: SAND_GOLD },
  { sx: 0.68, sy: 0.68, vx: 235, vy: 58, size: 1.2, color: SAND_LIGHT },
  { sx: 0.85, sy: 0.22, vx: 202, vy: 46, size: 2.1, color: SAND_MID },
  { sx: 0.92, sy: 0.60, vx: 218, vy: 39, size: 1.5, color: SAND_WARM },
];

/**
 * 201: 모래바람 (Behind Layer - 포켓몬 뒤쪽 배경 연출)
 */
export function drawSandstormBehindEffect(
  targetCtx: any,
  frameOrAttackerPos: any,
  drawCtxOrTargetPos?: any,
  stepArg?: number,
  progArg?: number,
  isPlayerArg?: boolean
) {
  const { ax, ay, tx, ty, step, p, isP } = parseSandstormArgs(
    frameOrAttackerPos,
    drawCtxOrTargetPos,
    stepArg,
    progArg,
    isPlayerArg
  );

  const ctx = targetCtx;
  ctx.save();

  // 1. [스텝 1~5]: 필드 전역 황갈색 대기 앰비언트 (사막 모래바람 분위기)
  let ambientAlpha = 0;
  if (step === 1) ambientAlpha = 0.06 * p;
  else if (step === 2) ambientAlpha = 0.06 + 0.08 * p;
  else if (step === 3) ambientAlpha = 0.14 + 0.06 * p;
  else if (step === 4) ambientAlpha = 0.20 - 0.04 * p;
  else if (step === 5) ambientAlpha = 0.14; // 모래바람 지속 필터 유지 (0.14)

  if (ambientAlpha > 0.01) {
    ctx.globalAlpha = ambientAlpha;
    ctx.fillStyle = SAND_WARM;
    const w = ctx.canvas?.width ? Math.max(ctx.canvas.width * 2, 1000) : 1200;
    const h = ctx.canvas?.height ? Math.max(ctx.canvas.height * 2, 800) : 900;
    ctx.fillRect(-200, -200, w, h);
  }

  // 2. [스텝 1~2]: 시전자 발밑 배경 흙먼지 솟구침
  if (step === 1 || step === 2) {
    const puffP = step === 1 ? p : 1.0 + p * 0.5;
    const baseAlpha = step === 1 ? p * 0.6 : (1.0 - p * 0.5) * 0.6;
    drawDustPuff(ctx, ax - 15, ay + 6, 20 + puffP * 15, baseAlpha * 0.7, SAND_WHITE, SAND_LIGHT);
    drawDustPuff(ctx, ax + 18, ay + 4, 18 + puffP * 12, baseAlpha * 0.6, SAND_PALE, SAND_GOLD);
  }

  // 3. [스텝 2]: 시전자 주변 배경 소용돌이 기둥 (Z축 뒤쪽 호 - 양끝 투명 그라데이션)
  if (step === 2) {
    const vortexAlpha = Math.sin(p * Math.PI) * 0.8;
    const vRadius = 28 + p * 30;
    const vY = ay - p * 35;

    ctx.save();
    ctx.globalAlpha = vortexAlpha * 0.7;

    // 뒤쪽 반원 호 (PI ~ 2*PI) - 좌우 끝단 투명 페이드 그라데이션
    const backGrad = ctx.createLinearGradient(ax - vRadius, vY, ax + vRadius, vY);
    backGrad.addColorStop(0, hexToRgba(SAND_GOLD, 0));
    backGrad.addColorStop(0.25, hexToRgba(SAND_GOLD, 0.85));
    backGrad.addColorStop(0.75, hexToRgba(SAND_GOLD, 0.85));
    backGrad.addColorStop(1, hexToRgba(SAND_GOLD, 0));

    ctx.strokeStyle = backGrad;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.ellipse(ax, vY, vRadius, vRadius * 0.4, 0.15, Math.PI, Math.PI * 2);
    ctx.stroke();

    const backCoreGrad = ctx.createLinearGradient(ax - vRadius * 0.8, vY + 8, ax + vRadius * 0.8, vY + 8);
    backCoreGrad.addColorStop(0, hexToRgba(SAND_PALE, 0));
    backCoreGrad.addColorStop(0.3, hexToRgba(SAND_PALE, 0.9));
    backCoreGrad.addColorStop(0.7, hexToRgba(SAND_PALE, 0.9));
    backCoreGrad.addColorStop(1, hexToRgba(SAND_PALE, 0));

    ctx.strokeStyle = backCoreGrad;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(ax, vY + 8, vRadius * 0.8, vRadius * 0.32, 0.15, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 4. [스텝 3~5]: 배경을 가로지르는 사선 모래바람 결 및 원경 모래먼지 구름
  if (step >= 3) {
    const stormProgress = (step === 3 ? p : (step === 4 ? 1.0 + p : 2.0 + p)) / 3.0;
    const windAlpha = step === 3 ? p * 0.75 : (step === 4 ? 0.75 : (1.0 - p * 0.3) * 0.75);

    // 배경 모래먼지 뭉게구름 (원경)
    const clouds = [
      { x: 100 + stormProgress * 80, y: 70, r: 45, alpha: 0.35 * windAlpha },
      { x: 260 + stormProgress * 100, y: 90, r: 55, alpha: 0.40 * windAlpha },
      { x: 390 + stormProgress * 90, y: 110, r: 50, alpha: 0.32 * windAlpha },
      { x: 180 + stormProgress * 70, y: 140, r: 40, alpha: 0.28 * windAlpha },
    ];
    for (const c of clouds) {
      drawDustPuff(ctx, c.x % 540 - 20, c.y, c.r, c.alpha, SAND_WHITE, SAND_LIGHT);
    }

    // 배경 사선 바람결
    const streamYOffsets = [-30, 20, 60, 110, 160];
    const streamDir = isP ? 1 : -1;
    for (let i = 0; i < streamYOffsets.length; i++) {
      const yBase = streamYOffsets[i];
      const shiftX = ((stormProgress * 300 + i * 90) % 450) * streamDir;
      const startX = isP ? -50 + shiftX : 550 + shiftX;
      const startY = yBase + (isP ? (startX * 0.25) : ((500 - startX) * 0.25));
      const endX = startX + 160 * streamDir;
      const endY = startY + 45;

      drawSandStream(
        ctx,
        startX,
        startY,
        endX,
        endY,
        -8,
        2.2,
        0.45 * windAlpha,
        i % 2 === 0 ? SAND_WARM : SAND_LIGHT
      );
    }
  }

  ctx.restore();
}

/**
 * 201: 모래바람 (Front Layer - 포켓몬 앞쪽 전면 이펙트)
 */
export function drawSandstormEffect(
  targetCtx: any,
  frameOrAttackerPos: any,
  drawCtxOrTargetPos?: any,
  stepArg?: number,
  progArg?: number,
  isPlayerArg?: boolean
) {
  const { ax, ay, tx, ty, step, p, isP } = parseSandstormArgs(
    frameOrAttackerPos,
    drawCtxOrTargetPos,
    stepArg,
    progArg,
    isPlayerArg
  );

  const ctx = targetCtx;
  ctx.save();

  const dir = isP ? 1 : -1;

  // ==========================================================================
  // [STEP 1]: 기 모으기 & 발구르기 (Earth Awakening)
  // - 시전자 발밑 흙먼지 퍼프 분출 및 자갈 솟구침
  // ==========================================================================
  if (step === 1) {
    const puffAlpha = Math.sin(p * Math.PI);
    // 발밑 흙먼지 팝 (밝은 모래색)
    drawDustPuff(ctx, ax - 10 * dir, ay + 12, 16 + p * 12, puffAlpha * 0.75, SAND_WHITE, SAND_LIGHT);
    drawDustPuff(ctx, ax + 14 * dir, ay + 10, 14 + p * 10, puffAlpha * 0.65, SAND_PALE, SAND_GOLD);

    // 위로 퐁퐁 튀는 작은 모래 자갈 3개
    const pebbles = [
      { dx: -12 * dir, dy: -6 - p * 22, size: 2.4, rot: p * 2.5 },
      { dx: 4 * dir, dy: -12 - p * 30, size: 3.2, rot: -p * 3.0 },
      { dx: 18 * dir, dy: -4 - p * 18, size: 2.0, rot: p * 4.0 },
    ];
    for (const pb of pebbles) {
      drawRockPebble(ctx, ax + pb.dx, ay + pb.dy, pb.size, pb.rot, puffAlpha);
    }
  }

  // ==========================================================================
  // [STEP 2]: 모래 소용돌이 기둥 폭발 (Sand Vortex Surge)
  // - 시전자 주변을 감싸며 나선형으로 솟구치는 소용돌이 기둥 전면 호
  // - 바닥 모래 충격파 링 확산
  // ==========================================================================
  else if (step === 2) {
    const surgeAlpha = Math.sin(p * Math.PI);
    const vRadius = 32 + p * 32;
    const vY = ay - p * 45;

    // 1. 발밑 모래 충격파 타원형 링 확산
    const ringR = 20 + p * 60;
    ctx.save();
    ctx.globalAlpha = (1.0 - p) * 0.7;
    ctx.strokeStyle = SAND_GOLD;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(ax, ay + 12, ringR, ringR * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = SAND_PALE;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(ax, ay + 12, ringR * 0.7, ringR * 0.28, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 2. 나선형 소용돌이 기둥 전면 호 (0 ~ PI) - 좌우 끝단 투명 페이드 그라데이션
    const frontGrad = ctx.createLinearGradient(ax - vRadius, vY, ax + vRadius, vY);
    frontGrad.addColorStop(0, hexToRgba(SAND_LIGHT, 0));
    frontGrad.addColorStop(0.2, hexToRgba(SAND_LIGHT, 0.95));
    frontGrad.addColorStop(0.5, hexToRgba(SAND_GOLD, 1.0));
    frontGrad.addColorStop(0.8, hexToRgba(SAND_LIGHT, 0.95));
    frontGrad.addColorStop(1, hexToRgba(SAND_LIGHT, 0));

    ctx.save();
    ctx.globalAlpha = surgeAlpha * 0.95;
    ctx.strokeStyle = frontGrad;
    ctx.lineWidth = 4.0;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.ellipse(ax, vY, vRadius, vRadius * 0.45, 0.15 * dir, 0, Math.PI);
    ctx.stroke();

    const frontCoreGrad = ctx.createLinearGradient(ax - vRadius * 0.85, vY + 6, ax + vRadius * 0.85, vY + 6);
    frontCoreGrad.addColorStop(0, hexToRgba(SAND_WHITE, 0));
    frontCoreGrad.addColorStop(0.25, hexToRgba(SAND_WHITE, 1.0));
    frontCoreGrad.addColorStop(0.75, hexToRgba(SAND_WHITE, 1.0));
    frontCoreGrad.addColorStop(1, hexToRgba(SAND_WHITE, 0));

    ctx.strokeStyle = frontCoreGrad;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(ax, vY + 6, vRadius * 0.85, vRadius * 0.38, 0.15 * dir, 0, Math.PI);
    ctx.stroke();
    ctx.restore();

    // 3. 소용돌이를 타고 솟구치는 회전 암석 조각 4개
    const risingRocks = [
      { angle: p * 4.0, dist: vRadius * 0.85, yOff: vY + 10, size: 3.5 },
      { angle: p * 4.0 + 1.6, dist: vRadius * 0.95, yOff: vY - 10, size: 4.2 },
      { angle: p * 4.0 + 3.2, dist: vRadius * 0.75, yOff: vY + 25, size: 2.8 },
      { angle: p * 4.0 + 4.8, dist: vRadius * 0.90, yOff: vY - 20, size: 3.8 },
    ];
    for (const rk of risingRocks) {
      const rx = ax + Math.cos(rk.angle) * rk.dist;
      const ry = rk.yOff + Math.sin(rk.angle) * (rk.dist * 0.35);
      drawRockPebble(ctx, rx, ry, rk.size, rk.angle * 1.5, surgeAlpha);
    }
  }

  // ==========================================================================
  // [STEP 3]: 모래폭풍 전장 쇄도 (Sandstorm Gale Begins)
  // - 시전자로부터 전장 전체를 향해 분사되는 고속 사선 모래바람 스트림
  // - 전면 모래알갱이 및 흙먼지 연무 전개
  // ==========================================================================
  else if (step === 3) {
    const galeAlpha = Math.min(1.0, p * 1.3);

    // 1. 전면 사선 모래바람 고속 스트림 (3중 레이어)
    const streams = [
      { y: 60, len: 240, w: 3.2, color: SAND_GOLD, cOff: -12 },
      { y: 110, len: 300, w: 4.0, color: SAND_LIGHT, cOff: -16 },
      { y: 160, len: 320, w: 4.5, color: SAND_WARM, cOff: -18 },
      { y: 210, len: 280, w: 3.5, color: SAND_GOLD, cOff: -14 },
      { y: 250, len: 220, w: 2.8, color: SAND_PALE, cOff: -10 },
    ];

    for (let i = 0; i < streams.length; i++) {
      const st = streams[i];
      const startProgress = Math.max(0, p * 1.4 - i * 0.12);
      if (startProgress <= 0) continue;

      const progressDist = startProgress * 400;
      const startX = isP ? -40 + progressDist * 0.5 : 540 - progressDist * 0.5;
      const startY = st.y;
      const endX = startX + st.len * dir;
      const endY = startY + 55;

      drawSandStream(
        ctx,
        startX,
        startY,
        endX,
        endY,
        st.cOff,
        st.w,
        galeAlpha * 0.85,
        st.color
      );
    }

    // 2. 고속 비행하는 모래 알갱이 입자들
    for (let i = 0; i < SAND_GRAINS.length; i++) {
      const g = SAND_GRAINS[i];
      const grainProgress = (p + g.sx) % 1.0;
      const gx = isP ? grainProgress * 520 - 20 : 520 - grainProgress * 520;
      const gy = g.sy * 260 + grainProgress * 65;

      ctx.save();
      ctx.globalAlpha = galeAlpha * 0.9;
      ctx.fillStyle = g.color;
      ctx.beginPath();
      ctx.ellipse(gx, gy, g.size * 1.5, g.size * 0.8, 0.3 * dir, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. 지면/대상 쪽으로 덮치는 모래 연무 (밝은 모래색)
    const dustX = tx - 30 * dir + p * 50 * dir;
    const dustY = ty + 15;
    drawDustPuff(ctx, dustX, dustY, 32 + p * 20, galeAlpha * 0.55, SAND_WHITE, SAND_LIGHT);
  }

  // ==========================================================================
  // [STEP 4]: 모래폭풍 절정 (Peak Sandstorm Tempest)
  // - 화면 전체를 휩쓰는 거대한 모래바람 폭풍 & 회전 암석 파편 폭격
  // - 전장 포켓몬 전면 관통
  // ==========================================================================
  else if (step === 4) {
    const stormAlpha = 1.0;

    // 1. 전면 사선 모래바람 광속 돌풍 (강렬한 바람결)
    const strongStreams = [
      { y: 40, w: 4.2, color: SAND_WHITE, cOff: -15 },
      { y: 85, w: 5.0, color: SAND_LIGHT, cOff: -20 },
      { y: 130, w: 5.5, color: SAND_GOLD, cOff: -22 },
      { y: 175, w: 6.0, color: SAND_WARM, cOff: -25 },
      { y: 220, w: 4.8, color: SAND_LIGHT, cOff: -18 },
      { y: 260, w: 3.8, color: SAND_PALE, cOff: -14 },
    ];

    for (let i = 0; i < strongStreams.length; i++) {
      const st = strongStreams[i];
      const offset = ((p * 450 + i * 85) % 480);
      const startX = isP ? -80 + offset : 580 - offset;
      const startY = st.y;
      const endX = startX + 280 * dir;
      const endY = startY + 70;

      drawSandStream(
        ctx,
        startX,
        startY,
        endX,
        endY,
        st.cOff,
        st.w,
        stormAlpha * 0.9,
        st.color
      );
    }

    // 2. 화면 전체를 관통하며 굴러가는 6개의 대형 암석/자갈 파편
    const rocks = [
      { u: (p * 1.5 + 0.1) % 1.2, y: 70, size: 5.0, rotSpd: 8 },
      { u: (p * 1.5 + 0.35) % 1.2, y: 125, size: 6.5, rotSpd: -10 },
      { u: (p * 1.5 + 0.6) % 1.2, y: 180, size: 5.8, rotSpd: 9 },
      { u: (p * 1.5 + 0.8) % 1.2, y: 220, size: 4.6, rotSpd: -7 },
      { u: (p * 1.5 + 0.25) % 1.2, y: 150, size: 7.2, rotSpd: 11 },
      { u: (p * 1.5 + 0.5) % 1.2, y: 95, size: 5.2, rotSpd: -8 },
    ];

    for (const r of rocks) {
      const rx = isP ? -50 + r.u * 600 : 550 - r.u * 600;
      const ry = r.y + r.u * 75;
      drawRockPebble(ctx, rx, ry, r.size, p * r.rotSpd, stormAlpha);
    }

    // 3. 밀도 높은 모래 알갱이 무리
    for (let i = 0; i < SAND_GRAINS.length; i++) {
      const g = SAND_GRAINS[i];
      const grainProgress = (p * 1.6 + g.sx) % 1.0;
      const gx = isP ? grainProgress * 540 - 20 : 520 - grainProgress * 540;
      const gy = g.sy * 260 + grainProgress * 70;

      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = g.color;
      ctx.beginPath();
      ctx.ellipse(gx, gy, g.size * 1.6, g.size * 0.9, 0.35 * dir, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 4. 전면 흙먼지 연무 구름 (밝은 모래색)
    drawDustPuff(ctx, 220 + p * 60 * dir, 140, 48, 0.45, SAND_PALE, SAND_LIGHT);
    drawDustPuff(ctx, 350 + p * 40 * dir, 180, 52, 0.40, SAND_WHITE, SAND_GOLD);
  }

  // ==========================================================================
  // [STEP 5]: 필드 안착 & 잔향 소산 (Weather Settles)
  // - 거센 돌풍이 안정적인 지속 모래바람 날씨 기류로 페이드아웃
  // - 부드러운 바람결과 모래알 잔향
  // ==========================================================================
  else if (step === 5) {
    const settleAlpha = Math.max(0, (1.0 - p * 0.45));

    // 부드러워진 사선 바람결
    const calmStreams = [
      { y: 70, w: 2.8, color: SAND_GOLD },
      { y: 130, w: 3.2, color: SAND_LIGHT },
      { y: 190, w: 3.5, color: SAND_WARM },
      { y: 240, w: 2.6, color: SAND_PALE },
    ];

    for (let i = 0; i < calmStreams.length; i++) {
      const st = calmStreams[i];
      const offset = ((p * 260 + i * 110) % 480);
      const startX = isP ? -60 + offset : 560 - offset;
      const startY = st.y;
      const endX = startX + 220 * dir;
      const endY = startY + 45;

      drawSandStream(
        ctx,
        startX,
        startY,
        endX,
        endY,
        -10,
        st.w,
        settleAlpha * 0.6,
        st.color
      );
    }

    // 가볍게 떠다니는 모래 알갱이
    for (let i = 0; i < 8; i++) {
      const g = SAND_GRAINS[i];
      const grainProgress = (p * 0.9 + g.sx) % 1.0;
      const gx = isP ? grainProgress * 520 - 10 : 510 - grainProgress * 520;
      const gy = g.sy * 260 + grainProgress * 45;

      ctx.save();
      ctx.globalAlpha = settleAlpha * 0.75;
      ctx.fillStyle = g.color;
      ctx.beginPath();
      ctx.arc(gx, gy, g.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
}

// ============================================================================
// 🌿 202: 기가드레인 (Giga Drain) - 풀 타입 특수 기술 (흡수계 최고위 기술)
//
// 위력: 75 / 명중: 100 / PP: 10
//
// [연출 특징 및 시퀀스]:
// - 메가드레인의 상위 호환으로 더욱 깊고 묵직한 심록색 암전 연출
// - 13개의 대형 에메랄드/라임/민트 발광 기가 모트가 대상 스프라이트 z축 아래에서
//   시전자에게로 광폭 나선 호를 그리며 쇄도
// - 4중 고속 잔상 트레일 및 대상 추출 지점의 2중 흡수 볼텍스 링
// - 시전자 체내 도달 시 발밑 생명력 만개 오라 + 3중 팽창 펄스 링과 함께 회전하며 치솟는
//   12개의 대형 십자 별빛 & 크리스탈 스파클
// ============================================================================

/**
 * 기가드레인 인자 파싱 헬퍼
 */
function parseGigaDrainArgs(
  frameOrAttackerPos: any,
  drawCtxOrTargetPos?: any,
  stepArg?: number,
  progArg?: number,
  isPlayerArg?: boolean
) {
  let startPos = { x: 418, y: 152 }; // 대상 (에너지 방출원)
  let endPos = { x: 150, y: 280 };   // 시전자 (에너지 흡수자)
  let frameObj: BattleFrame | null = null;
  let drawCtxObj: EffectDrawContext | null = null;

  if (
    frameOrAttackerPos &&
    typeof frameOrAttackerPos === "object" &&
    ("moveStep" in frameOrAttackerPos || "dimAlpha" in frameOrAttackerPos || "drainProgress" in frameOrAttackerPos)
  ) {
    frameObj = frameOrAttackerPos as BattleFrame;
    drawCtxObj = (drawCtxOrTargetPos as EffectDrawContext) || {};
    startPos = drawCtxObj.targetPos || { x: 418, y: 152 };
    endPos = drawCtxObj.casterPos ?? drawCtxObj.attackerPos ?? { x: 150, y: 280 };
  } else if (frameOrAttackerPos && typeof frameOrAttackerPos === "object" && "x" in frameOrAttackerPos) {
    if (drawCtxOrTargetPos && typeof drawCtxOrTargetPos === "object" && "x" in drawCtxOrTargetPos) {
      startPos = drawCtxOrTargetPos;
      endPos = frameOrAttackerPos;
    }
    const step = stepArg || 1;
    const p = progArg !== undefined ? Math.min(1.0, Math.max(0.0, progArg)) : 0.5;
    frameObj = {
      delay: 90,
      moveStep: step,
      dimAlpha: step === 1 ? 0.16 : step === 2 ? 0.35 : step === 3 ? 0.22 : 0.05,
      drainProgress: p,
      drainAlpha: 1.0,
      healAlpha: step >= 3 ? 1.0 : 0,
      healProgress: step >= 3 ? p : 0,
    } as BattleFrame;
    drawCtxObj = {
      attackerPos: endPos,
      casterPos: endPos,
      targetPos: startPos,
      isPlayer: isPlayerArg !== undefined ? isPlayerArg : true,
      isHit: true,
      width: 560,
      height: 380,
      em: { x: 418, y: 152, size: 80 },
      pm: { x: 150, y: 280, size: 80 },
    };
  } else {
    frameObj = (frameOrAttackerPos as BattleFrame) || null;
    drawCtxObj = (drawCtxOrTargetPos as EffectDrawContext) || null;
    if (drawCtxObj) {
      startPos = drawCtxObj.targetPos || { x: 418, y: 152 };
      endPos = drawCtxObj.casterPos ?? drawCtxObj.attackerPos ?? { x: 150, y: 280 };
    }
  }

  return { frame: frameObj, drawCtx: drawCtxObj, startPos, endPos };
}

/**
 * 202: 기가드레인 에너지 모트 (Luminous Giga Life Orb)
 */
export function drawGigaDrainMote(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || radius <= 0.5) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 1. 최외곽 심록/에메랄드 글로우 아우라
  ctx.fillStyle = "rgba(16, 185, 129, 0.28)";
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 2.8, 0, Math.PI * 2);
  ctx.fill();

  // 2. 중간 브라이트 네온 라임/민트 글로우
  ctx.fillStyle = "rgba(74, 222, 128, 0.52)";
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.8, 0, Math.PI * 2);
  ctx.fill();

  // 3. 내부 고밀도 에메랄드 플라즈마 구체
  ctx.fillStyle = "#A7F3D0";
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.15, 0, Math.PI * 2);
  ctx.fill();

  // 4. 초고열 순백 코어
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.52, 0, Math.PI * 2);
  ctx.fill();

  // 5. 십자 다이아몬드 플레어 (크리스탈 광채)
  if (radius >= 3.0) {
    const spL = radius * 2.2;
    const spW = Math.max(1.0, radius * 0.32);

    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.beginPath();
    ctx.moveTo(cx, cy - spL);
    ctx.lineTo(cx + spW, cy - spW);
    ctx.lineTo(cx + spL, cy);
    ctx.lineTo(cx + spW, cy + spW);
    ctx.lineTo(cx, cy + spL);
    ctx.lineTo(cx - spW, cy + spW);
    ctx.lineTo(cx - spL, cy);
    ctx.lineTo(cx - spW, cy - spW);
    ctx.closePath();
    ctx.fill();

    // 대각선 마이크로 광선 4개
    ctx.strokeStyle = "rgba(187, 247, 208, 0.85)";
    ctx.lineWidth = 1.0;
    const diagL = radius * 1.1;
    ctx.beginPath();
    ctx.moveTo(cx - diagL * 0.7, cy - diagL * 0.7);
    ctx.lineTo(cx + diagL * 0.7, cy + diagL * 0.7);
    ctx.moveTo(cx + diagL * 0.7, cy - diagL * 0.7);
    ctx.lineTo(cx - diagL * 0.7, cy + diagL * 0.7);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 202: 기가드레인 쇄도 스트림 (13개 대형 기가 모트 & 4중 고속 잔상)
 */
export function drawGigaDrainStream(
  ctx: any,
  startPos: { x: number; y: number },
  endPos: { x: number; y: number },
  progress: number = 0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || progress <= 0) return;

  const dx = endPos.x - startPos.x;
  const dy = endPos.y - startPos.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return;

  const nx = -dy / dist;
  const ny = dx / dist;

  // 13개의 대형 기가 에너지 모트 (메가드레인의 8개를 압도하는 스케일)
  const MOTES = [
    { curveOffset:  68, delay: 0.00, dur: 0.60, r: 6.2, ox:   0, oy:   0 },
    { curveOffset: -64, delay: 0.04, dur: 0.60, r: 5.8, ox: -14, oy:   8 },
    { curveOffset:  48, delay: 0.08, dur: 0.58, r: 5.4, ox:  12, oy: -12 },
    { curveOffset: -46, delay: 0.12, dur: 0.57, r: 5.6, ox: -10, oy: -14 },
    { curveOffset:  82, delay: 0.15, dur: 0.58, r: 6.8, ox:  16, oy:  12 },
    { curveOffset: -76, delay: 0.18, dur: 0.57, r: 6.4, ox: -16, oy:   6 },
    { curveOffset:  28, delay: 0.22, dur: 0.55, r: 5.2, ox:   8, oy:  -8 },
    { curveOffset: -26, delay: 0.25, dur: 0.54, r: 5.5, ox:  -6, oy:  14 },
    { curveOffset:  90, delay: 0.28, dur: 0.56, r: 7.2, ox:  18, oy:  14 },
    { curveOffset: -84, delay: 0.31, dur: 0.55, r: 6.6, ox: -18, oy:   2 },
    { curveOffset:  56, delay: 0.34, dur: 0.53, r: 5.8, ox:  10, oy:  -6 },
    { curveOffset: -52, delay: 0.37, dur: 0.52, r: 6.0, ox:  -8, oy:  10 },
    { curveOffset:   0, delay: 0.39, dur: 0.50, r: 6.5, ox:   0, oy:   0 },
  ];

  ctx.save();

  for (const m of MOTES) {
    const p = (progress - m.delay) / m.dur;

    // 사출 전 대상 체내 생명력 응축 단계
    if (p < 0) {
      const gatherProg = Math.max(0, Math.min(1, progress / Math.max(0.01, m.delay)));
      if (gatherProg > 0.10) {
        drawGigaDrainMote(
          ctx,
          startPos.x + m.ox,
          startPos.y + m.oy,
          m.r * 0.65 * gatherProg,
          alpha * gatherProg * 0.85
        );
      }
      continue;
    }

    if (p > 1.0) continue;

    const t = Math.max(0, Math.min(1.0, p));
    const tEased = t * t * (3 - 2 * t);

    // 4중 고속 잔상 트레일 (Comet trail motion blur)
    for (let g = 4; g >= 1; g--) {
      const gt = Math.max(0, t - g * 0.038);
      const gtEased = gt * gt * (3 - 2 * gt);
      const gCurve = Math.sin(gt * Math.PI);

      const gx = startPos.x + m.ox * (1 - gt) + dx * gtEased + nx * (m.curveOffset * gCurve);
      const gy = startPos.y + m.oy * (1 - gt) + dy * gtEased + ny * (m.curveOffset * gCurve);

      let gAlpha = alpha * (1 - g * 0.22) * 0.70;
      if (gt < 0.10) gAlpha *= (gt / 0.10);
      else if (gt > 0.90) gAlpha *= ((1 - gt) / 0.10);

      drawGigaDrainMote(ctx, gx, gy, m.r * (1 - g * 0.18), gAlpha);
    }

    // 본체 모트
    const curve = Math.sin(t * Math.PI);
    const curX = startPos.x + m.ox * (1 - t) + dx * tEased + nx * (m.curveOffset * curve);
    const curY = startPos.y + m.oy * (1 - t) + dy * tEased + ny * (m.curveOffset * curve);

    let moteAlpha = alpha;
    if (t < 0.10) moteAlpha *= (t / 0.10);
    else if (t > 0.90) moteAlpha *= ((1 - t) / 0.10);

    drawGigaDrainMote(ctx, curX, curY, m.r, moteAlpha);
  }

  ctx.restore();
}

/**
 * 202: 기가드레인 단일 두꺼운 펄스 링 (가로 링 퍼지기)
 */
export function drawGigaDrainPulseRing(
  ctx: any,
  cx: number,
  cy: number,
  progress: number = 1.0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || progress <= 0) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const p = Math.max(0, Math.min(1.0, progress));

  // 발밑 단일 대형 두꺼운 펄스 링 (안쪽 투명 그라데이션) - User Prompt 3 반영
  const pulseR = 26 + p * 52;
  const pulseFade = Math.max(0, (1 - p * 0.95) * alpha);

  if (pulseFade > 0.01) {
    ctx.save();
    ctx.translate(cx, cy + 8);
    ctx.scale(1.28, 0.64);

    // 두껍고 묵직한 링 두께 (약 16~18px)
    const ringThickness = Math.max(8, 18 * (1 - p * 0.35));
    const innerR = Math.max(0, pulseR - ringThickness);

    // 안쪽은 100% 완전 투명 -> 외곽으로 갈수록 선명한 에메랄드/라임으로 짙어지는 그라데이션
    const grad = ctx.createRadialGradient(0, 0, innerR, 0, 0, pulseR);
    grad.addColorStop(0.0, "rgba(74, 222, 128, 0)");                    // 안쪽: 완전 투명
    grad.addColorStop(0.35, `rgba(34, 197, 94, ${0.40 * pulseFade})`);  // 중간: 부드러운 에메랄드
    grad.addColorStop(0.80, `rgba(74, 222, 128, ${0.90 * pulseFade})`); // 바깥쪽: 선명한 네온 라임
    grad.addColorStop(1.0, `rgba(187, 247, 208, ${0.95 * pulseFade})`); // 최외곽: 밝은 민트 하이라이트

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
    ctx.fill();

    // 링 외곽 테두리 림 라인
    ctx.strokeStyle = `rgba(220, 252, 231, ${0.90 * pulseFade})`;
    ctx.lineWidth = Math.max(1.0, 2.4 * (1 - p * 0.4));
    ctx.beginPath();
    ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
}

/**
 * 202: 기가드레인 치유 오라 (단일 두꺼운 펄스 링 & HP회복 회복부분 나선 별빛 엠블럼 통합 헬퍼)
 */
export function drawGigaDrainHealAura(
  ctx: any,
  cx: number,
  cy: number,
  progress: number = 1.0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const p = Math.max(0, Math.min(1.0, progress));

  // 가로 링 퍼지기
  drawGigaDrainPulseRing(ctx, cx, cy, p, alpha);

  // HP회복 회복부분
  drawRecoveryStarSpiral(ctx, cx, cy - 8, p);

  ctx.restore();
}

/**
 * 202: 기가드레인 Behind Effect (화면 심록빛 암전 & z-depth 흡수 스트림)
 */
export function drawGigaDrainBehindEffect(
  ctx: any,
  frameOrAttackerPos: any,
  drawCtxOrTargetPos?: any,
  stepArg?: number,
  progArg?: number,
  isPlayerArg?: boolean
) {
  const { frame, startPos, endPos } = parseGigaDrainArgs(
    frameOrAttackerPos,
    drawCtxOrTargetPos,
    stepArg,
    progArg,
    isPlayerArg
  );

  const dimAlpha = frame?.dimAlpha ?? 0;
  if (dimAlpha > 0.005) {
    ctx.save();
    // 심록빛 분위기 틴트 + 깊은 암전 오버레이
    ctx.fillStyle = `rgba(2, 28, 16, ${dimAlpha * 0.45})`;
    ctx.fillRect(-20000, -20000, 40000, 40000);
    ctx.fillStyle = `rgba(0, 0, 0, ${dimAlpha * 0.85})`;
    ctx.fillRect(-20000, -20000, 40000, 40000);
    ctx.restore();
  }

  const drainProg = frame?.drainProgress ?? 0;
  const drainAlpha = frame?.drainAlpha ?? 1.0;
  if (drainProg > 0 && drainAlpha > 0.01) {
    drawGigaDrainStream(ctx, startPos, endPos, drainProg, drainAlpha);
  }
}

/**
 * 202: 기가드레인 Effect (가로 링 퍼지기 & 끝나고 나서 HP회복 회복부분 재생)
 */
export function drawGigaDrainEffect(
  ctx: any,
  frameOrAttackerPos: any,
  drawCtxOrTargetPos?: any,
  stepArg?: number,
  progArg?: number,
  isPlayerArg?: boolean
) {
  const { frame, endPos } = parseGigaDrainArgs(
    frameOrAttackerPos,
    drawCtxOrTargetPos,
    stepArg,
    progArg,
    isPlayerArg
  );

  if (!frame) {
    const prog = progArg ?? 1.0;
    drawGigaDrainHealAura(ctx, endPos.x, endPos.y, prog, 1.0);
    return;
  }

  // 1. [유저 요구사항] 발밑 단일 두꺼운 가로 링 퍼지기
  const ringAlpha = frame.ringAlpha ?? 0;
  const ringProg = frame.ringProgress ?? 0;
  if (ringAlpha > 0.01 && ringProg > 0) {
    drawGigaDrainPulseRing(ctx, endPos.x, endPos.y, ringProg, ringAlpha);
  }

  // 2. [유저 요구사항] 가로 링 퍼지기 끝나고 나서 HP회복 회복부분(Step 2 나선 회복별) 재생
  const recoverAlpha = frame.recoverAlpha ?? (frame.healAlpha ?? 0);
  const recoverProg = frame.recoverProgress ?? (frame.healProgress ?? 0);
  if (recoverAlpha > 0.01 && recoverProg > 0) {
    drawRecoveryStarSpiral(ctx, endPos.x, endPos.y - 8, Math.min(1.0, recoverProg));
  }
}

// ============================================================================
// 🛡️ 203: 버티기 (Endure) - 노말 타입 변화 기술 (우선도 +4)
//
// [유저 지정 연출]:
// 사용 시 페이드인 / 페이드아웃으로 시전 포켓몬 빨갛게 필터 적용 2회
// ============================================================================

/**
 * 인자 파싱 헬퍼 (버티기)
 */
function parseEndureArgs(
  frameOrAttackerPos: any,
  drawCtxOrTargetPos?: any,
  stepArg?: number,
  progArg?: number,
  isPlayerArg?: boolean
) {
  let cx = 150;
  let cy = 280;
  let p = 0.5;
  let frameObj: BattleFrame | null = null;

  if (frameOrAttackerPos && typeof frameOrAttackerPos === "object" && "moveStep" in frameOrAttackerPos) {
    frameObj = frameOrAttackerPos as BattleFrame;
    const drawCtx = (drawCtxOrTargetPos as EffectDrawContext) || {};
    const isP = drawCtx.isPlayer !== undefined ? Boolean(drawCtx.isPlayer) : true;
    const aPos = isP
      ? (drawCtx.casterPos || drawCtx.attackerPos || { x: 150, y: 280 })
      : (drawCtx.casterPos || drawCtx.attackerPos || { x: 418, y: 152 });
    cx = aPos.x + (isP ? (frameObj?.pOffset?.x ?? 0) : (frameObj?.eOffset?.x ?? 0));
    cy = aPos.y + (isP ? (frameObj?.pOffset?.y ?? 0) : (frameObj?.eOffset?.y ?? 0));
    p = frameObj?.endureProgress ?? frameObj?.effectProgress ?? 0.5;
  } else if (frameOrAttackerPos && typeof frameOrAttackerPos === "object" && "x" in frameOrAttackerPos) {
    cx = frameOrAttackerPos.x;
    cy = frameOrAttackerPos.y;
    p = progArg !== undefined ? progArg : (typeof drawCtxOrTargetPos === "number" ? drawCtxOrTargetPos : 0.5);
  } else {
    frameObj = (frameOrAttackerPos as BattleFrame) || null;
    const drawCtx = (drawCtxOrTargetPos as EffectDrawContext) || {};
    const isP = drawCtx.isPlayer !== undefined ? Boolean(drawCtx.isPlayer) : true;
    const aPos = isP
      ? (drawCtx.casterPos || drawCtx.attackerPos || { x: 150, y: 280 })
      : (drawCtx.casterPos || drawCtx.attackerPos || { x: 418, y: 152 });
    cx = aPos.x;
    cy = aPos.y;
    p = frameObj?.endureProgress ?? frameObj?.effectProgress ?? 0.5;
  }

  return { cx, cy, p, frame: frameObj };
}

/**
 * 5세대 버티기 스타일: 상단 돔과 꼬리가 단일체로 완벽히 블렌딩된 상승 에너지 스트림
 */
function drawRisingOrb(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  tailLen: number,
  alpha: number
) {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 단일 패스로 연결된 일체형 에너지 바디 (상단 원형 돔 + 하단 유선형 꼬리)
  // 별도의 원을 덧그리지 않고 상단 호에서 꼬리 끝까지 끊김 없이 이어지는 단일체 구성
  const headW = radius * 0.95;
  const path = () => {
    ctx.beginPath();
    ctx.arc(x, y, headW, Math.PI, 0, false);
    ctx.bezierCurveTo(
      x + headW * 0.85, y + tailLen * 0.25,
      x + headW * 0.35, y + tailLen * 0.65,
      x, y + tailLen
    );
    ctx.bezierCurveTo(
      x - headW * 0.35, y + tailLen * 0.65,
      x - headW * 0.85, y + tailLen * 0.25,
      x - headW, y
    );
    ctx.closePath();
  };

  // 1. 외곽 소프트 글로우 (살짝 주황빛을 머금은 웜 오렌지 발광)
  ctx.save();
  ctx.shadowColor = "rgba(251, 146, 60, 0.65)";
  ctx.shadowBlur = 10;
  path();
  ctx.fillStyle = "rgba(251, 146, 60, 0.16)";
  ctx.fill();
  ctx.restore();

  // 2. 메인 일체형 그라데이션 (연노랑 베이스에 살짝 따뜻한 주황빛/앰버 오렌지 가미)
  const mainGrad = ctx.createLinearGradient(x, y - headW, x, y + tailLen);
  mainGrad.addColorStop(0.0, "rgba(254, 215, 120, 0.85)"); // 최상단 외곽은 따뜻한 옐로우
  mainGrad.addColorStop(0.08, "rgba(255, 252, 235, 0.95)"); // 중간 탑 부분 하이라이트 피크
  mainGrad.addColorStop(0.18, "rgba(254, 195, 90, 0.82)");  // 구체 하단부 웜 앰버
  mainGrad.addColorStop(0.42, "rgba(251, 146, 60, 0.60)");  // 꼬리 중간 주황빛
  mainGrad.addColorStop(0.72, "rgba(249, 115, 22, 0.25)");  // 꼬리 하단 딥 오렌지
  mainGrad.addColorStop(1.0, "rgba(234, 88, 12, 0.0)");     // 끝부분 자연 소산

  path();
  ctx.fillStyle = mainGrad;
  ctx.fill();

  // 3. 상단 내부 소프트 코어 하이라이트 (중간 탑 부분에 부드럽게 위치)
  const hlCenterY = y - headW * 0.35;
  const hlRadius = headW * 0.65;
  const coreGrad = ctx.createRadialGradient(x, hlCenterY, 0, x, hlCenterY, hlRadius);
  coreGrad.addColorStop(0.0, "rgba(255, 255, 250, 0.85)");
  coreGrad.addColorStop(0.45, "rgba(255, 245, 200, 0.50)");
  coreGrad.addColorStop(0.8, "rgba(254, 215, 120, 0.18)");
  coreGrad.addColorStop(1.0, "rgba(251, 146, 60, 0.0)");

  ctx.beginPath();
  ctx.arc(x, hlCenterY, hlRadius, 0, Math.PI * 2);
  ctx.fillStyle = coreGrad;
  ctx.fill();

  ctx.restore();
}

// 일정 규격의 대형 구체 및 꼬리 상수 (꼬리 길이 및 크기 일정화)
const UNIFORM_ORB_RADIUS = 9.0;
const UNIFORM_TAIL_LEN = 65;
const UNIFORM_RISE_DIST = 95;

// 한번에 다 같이 뜨지 않고, 불규칙하게 시차를 두고 순차적으로 솟아오르도록 구성
const ENDURE_ORB_CONFIGS = [
  // 1번 구체: 1차 물들기 초반 좌측에서 솟아오름
  { dx: -24, baseYOff: 0,  startP: 0.05, endP: 0.58 },
  // 2번 구체: 1차 물들기 중후반 우측에서 시차를 두고 솟아오름
  { dx: 22,  baseYOff: -4, startP: 0.22, endP: 0.72 },
  // 3번 구체: 1차->2차 전환기 중앙 살짝 좌측에서 솟아오름
  { dx: -8,  baseYOff: 2,  startP: 0.38, endP: 0.86 },
  // 4번 구체: 2차 물들기 피크 우측 상단으로 솟아오름
  { dx: 26,  baseYOff: -2, startP: 0.50, endP: 0.98 },
];

/**
 * 203: 버티기 Effect (Endure)
 * - 5세대 버티기 연출: 불규칙하게 시차를 두고 솟아오르는 대형 연노랑 구체와 일정한 길이의 반투명 꼬리
 */
export function drawEndureEffect(
  ctx: any,
  frameOrAttackerPos: any,
  drawCtxOrTargetPos?: any,
  stepArg?: number,
  progArg?: number,
  isPlayerArg?: boolean
) {
  if (!ctx) return;
  const { cx, cy, p } = parseEndureArgs(
    frameOrAttackerPos,
    drawCtxOrTargetPos,
    stepArg,
    progArg,
    isPlayerArg
  );

  // 한번에 솟지 않고, 불규칙하게 시차를 두고 순차적으로 솟아오름
  for (const cfg of ENDURE_ORB_CONFIGS) {
    if (p < cfg.startP || p > cfg.endP) continue;

    const u = (p - cfg.startP) / (cfg.endP - cfg.startP);
    const x = cx + cfg.dx;
    const y = cy + cfg.baseYOff - u * UNIFORM_RISE_DIST;

    // 부드러운 시작 페이드인 & 상공 소산 페이드아웃
    let orbAlpha = 1.0;
    if (u < 0.22) {
      orbAlpha = u / 0.22;
    } else if (u > 0.68) {
      orbAlpha = Math.max(0, (1.0 - u) / 0.32);
    }

    drawRisingOrb(ctx, x, y, UNIFORM_ORB_RADIUS, UNIFORM_TAIL_LEN, orbAlpha * 0.95);
  }
}

// ============================================================================
// 💖 204: 애교부리기 (Charm)
// ============================================================================

/**
 * 256색 최적화 유선형 벡터 하트 렌더러 (연분홍 플랫 단색, 보더/그라데이션/하이라이트 없음)
 */
function drawRisingCharmHeart(
  ctx: any,
  x: number,
  y: number,
  size: number,
  alpha: number = 1.0,
  rot: number = 0,
  fillColor: string = "#F472B6"
) {
  if (alpha <= 0.01 || size <= 0.5) return;
  ctx.save();
  ctx.translate(x, y);
  if (rot !== 0) ctx.rotate(rot);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  ctx.beginPath();
  const topH = size * 0.28;
  ctx.moveTo(0, topH);
  ctx.bezierCurveTo(0, -size * 0.15, -size * 0.62, -size * 0.15, -size * 0.62, topH);
  ctx.bezierCurveTo(-size * 0.62, size * 0.72, 0, size * 1.05, 0, size * 1.15);
  ctx.bezierCurveTo(0, size * 1.05, size * 0.62, size * 0.72, size * 0.62, topH);
  ctx.bezierCurveTo(size * 0.62, -size * 0.15, 0, -size * 0.15, 0, topH);
  ctx.closePath();

  // 단색 플랫 연분홍 채우기 (그라데이션 및 보더 없음)
  ctx.fillStyle = fillColor;
  ctx.fill();

  ctx.restore();
}

// 5개 하트의 불규칙 생성 타이밍 및 위치/크기 설정 (모두 부드러운 연분홍 계열)
const CHARM_5_HEARTS = [
  // 1번 하트: 좌측 하단에서 초반에 올라옴
  { dx: -22, baseYOff: 6,  size: 11, riseDist: 52, startP: 0.04, endP: 0.48, rot: -0.12, color: "#F472B6" },
  // 2번 하트: 우측에서 시차를 두고 솟아오름
  { dx:  20, baseYOff: -4, size:  9, riseDist: 58, startP: 0.18, endP: 0.62, rot:  0.15, color: "#FDA4AF" },
  // 3번 하트: 중앙 살짝 좌측에서 가장 크게 솟아오름
  { dx:  -6, baseYOff: 12, size: 14, riseDist: 64, startP: 0.32, endP: 0.78, rot: -0.06, color: "#F472B6" },
  // 4번 하트: 우측 상단으로 경쾌하게 솟아오름
  { dx:  26, baseYOff: 2,  size: 10, riseDist: 54, startP: 0.48, endP: 0.90, rot:  0.18, color: "#F9A8D4" },
  // 5번 하트: 좌측 살짝 위에서 후반부에 부유
  { dx: -14, baseYOff: -2, size:  8, riseDist: 48, startP: 0.60, endP: 0.98, rot: -0.10, color: "#FDA4AF" },
];

export function drawCharmEffect(
  targetCtx: any,
  frameOrAttackerPos: any,
  drawCtxOrTargetPos?: any,
  stepArg?: number,
  progArg?: number,
  isPlayerArg?: boolean
) {
  if (!targetCtx) return;

  let cx = 130;
  let cy = 220;
  let p = 0.5;

  if (frameOrAttackerPos && typeof frameOrAttackerPos === "object" && "moveStep" in frameOrAttackerPos) {
    const frame = frameOrAttackerPos as BattleFrame;
    const drawCtx = (drawCtxOrTargetPos as EffectDrawContext) || {};
    const isP = drawCtx.isPlayer !== undefined ? Boolean(drawCtx.isPlayer) : true;
    const aPos = isP
      ? (drawCtx.casterPos || drawCtx.attackerPos || { x: 150, y: 280 })
      : (drawCtx.casterPos || drawCtx.attackerPos || { x: 418, y: 152 });
    cx = aPos.x + (isP ? (frame?.pOffset?.x ?? 0) : (frame?.eOffset?.x ?? 0));
    cy = aPos.y + (isP ? (frame?.pOffset?.y ?? 0) : (frame?.eOffset?.y ?? 0)) - (isP ? 14 : 10);
    p = frame?.charmProgress ?? frame?.effectProgress ?? 0.5;
  } else if (frameOrAttackerPos && typeof frameOrAttackerPos === "object" && "x" in frameOrAttackerPos) {
    cx = frameOrAttackerPos.x;
    cy = frameOrAttackerPos.y;
    p = progArg !== undefined ? progArg : 0.5;
  } else {
    const frame = (frameOrAttackerPos as BattleFrame) || null;
    const drawCtx = (drawCtxOrTargetPos as EffectDrawContext) || {};
    const isP = drawCtx.isPlayer !== undefined ? Boolean(drawCtx.isPlayer) : true;
    const aPos = isP
      ? (drawCtx.casterPos || drawCtx.attackerPos || { x: 150, y: 280 })
      : (drawCtx.casterPos || drawCtx.attackerPos || { x: 418, y: 152 });
    cx = aPos.x;
    cy = aPos.y - (isP ? 14 : 10);
    p = frame?.charmProgress ?? frame?.effectProgress ?? 0.5;
  }

  // 5개의 하트가 불규칙하게 순차적으로 위로 올라오면서 페이드아웃
  for (const cfg of CHARM_5_HEARTS) {
    if (p < cfg.startP || p > cfg.endP) continue;

    const u = (p - cfg.startP) / (cfg.endP - cfg.startP);
    // 살짝 좌우로 살랑거리며 위로 솟아오름
    const swayX = Math.sin(u * Math.PI * 2) * 5;
    const x = cx + cfg.dx + swayX;
    const y = cy + cfg.baseYOff - u * cfg.riseDist;

    // 올라오면서 페이드아웃
    let alpha = 1.0;
    if (u < 0.22) {
      alpha = u / 0.22;
    } else if (u > 0.55) {
      alpha = Math.max(0, (1.0 - u) / 0.45);
    }

    drawRisingCharmHeart(targetCtx, x, y, cfg.size, alpha * 0.95, cfg.rot, cfg.color);
  }
}




