// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawMiniRetroStar, drawStarburstImpact } from "../common/helpers.js";

/**
 * Gen 2 Moves 177 - 180 Renderers
 *
 * 177: 에어로블라스트 (Aeroblast) - 루기아 전용기
 * 178: 코튼포자 (Cotton Spore)
 * 179: 기사회생 (Reversal)
 * 180: 원망 (Spite)
 */

// ============================================================================
// 177: 에어로블라스트 (Aeroblast)
// ============================================================================

/**
 * 256색 팔레트 최적화 고선명 색상 상수 (Aeroblast Palette)
 */
const AERO_WHITE = "#FFFFFF";
const AERO_SKY_GLOW = "#E0F2FE";
const AERO_CYAN_LIGHT = "#BAE6FD";
const AERO_CYAN = "#38BDF8";
const AERO_CYAN_NEON = "#00E5FF";
const AERO_BLUE_CORE = "#0284C7";
const AERO_BLUE_DARK = "#0369A1";
const AERO_NAVY = "#0F172A";

/**
 * Step 1: 시전자 앞 흡입 소용돌이 기류 (Inward Suction Wind Spirals)
 */
function drawInwardSuctionTrails(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  dir: number
) {
  ctx.save();
  ctx.lineCap = "round";

  const t = Math.max(0, Math.min(1.0, progress));
  const numTrails = 6;
  const maxRadius = 48;

  for (let i = 0; i < numTrails; i++) {
    const baseAngle = (i / numTrails) * Math.PI * 2 + t * Math.PI * 2;
    const startR = maxRadius * (1.0 - t * 0.4);
    const endR = 6 + (1.0 - t) * 10;

    const sx = cx + Math.cos(baseAngle) * startR;
    const sy = cy + Math.sin(baseAngle) * (startR * 0.75);

    // 나선형으로 꼬이며 중심으로 빨려 들어가는 3차 제어점 궤적
    const midAngle = baseAngle + dir * 0.85;
    const midR = (startR + endR) * 0.55;
    const cpx = cx + Math.cos(midAngle) * midR;
    const cpy = cy + Math.sin(midAngle) * (midR * 0.75);

    const endAngle = baseAngle + dir * 1.7;
    const ex = cx + Math.cos(endAngle) * endR;
    const ey = cy + Math.sin(endAngle) * (endR * 0.75);

    // 외곽은 하늘색, 중심부는 순백의 가속 선
    ctx.lineWidth = 1.8 + (1.0 - t) * 0.6;
    ctx.strokeStyle = i % 2 === 0 ? AERO_CYAN : AERO_SKY_GLOW;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(cpx, cpy, ex, ey);
    ctx.stroke();

    // 꼬리 흡입 파티클
    const dotX = cx + Math.cos(baseAngle + dir * t * 1.5) * (maxR_lerp(startR, endR, t));
    const dotY = cy + Math.sin(baseAngle + dir * t * 1.5) * (maxR_lerp(startR, endR, t) * 0.75);
    ctx.fillStyle = AERO_WHITE;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function maxR_lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Step 1: 초고압 압축 에어로 볼텍스 구체 (Compressed Vortex Sphere Core)
 */
function drawCompressedVortexSphere(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number,
  spinProgress: number
) {
  if (radius <= 1 || alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, alpha);

  // 1. 순백 & 시안 고압 코어 그라디언트
  const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, radius);
  grad.addColorStop(0, AERO_WHITE);
  grad.addColorStop(0.35, AERO_SKY_GLOW);
  grad.addColorStop(0.70, AERO_CYAN);
  grad.addColorStop(1.0, "rgba(2, 132, 199, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // 2. 중심 순백 콤팩트 핵
  ctx.fillStyle = AERO_WHITE;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // 3. 고속 회전하는 이중 기압 궤도 링 (Spinning Pressure Orbit Rings)
  ctx.lineWidth = 1.8;
  const rot1 = spinProgress * Math.PI * 3.0;
  const rot2 = -spinProgress * Math.PI * 2.5;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(0.45 + rot1 * 0.2);
  ctx.strokeStyle = AERO_WHITE;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 1.25, radius * 0.55, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.55 + rot2 * 0.2);
  ctx.strokeStyle = AERO_CYAN_NEON;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 1.35, radius * 0.50, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 4. 4방향 미니 압축 펄스 스파크
  for (let i = 0; i < 4; i++) {
    const a = rot1 + (i / 4) * Math.PI * 2;
    const r = radius * 1.15;
    ctx.fillStyle = AERO_WHITE;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Step 2: 초고속 나선형 공기 볼텍스 캐논 빔 (Supersonic Vortex Beam)
 */
function drawAeroblastBeam(
  ctx: any,
  ax: number,
  ay: number,
  tx: number,
  ty: number,
  progress: number,
  animPhase: number = 0
) {
  const dx = tx - ax;
  const dy = ty - ay;
  const totalDist = Math.hypot(dx, dy);
  if (totalDist <= 2) return;

  const angle = Math.atan2(dy, dx);
  const perpX = -Math.sin(angle);
  const perpY = Math.cos(angle);

  const headProgress = Math.min(1.0, Math.max(0.05, progress));
  const currDist = totalDist * headProgress;
  const headX = ax + Math.cos(angle) * currDist;
  const headY = ay + Math.sin(angle) * currDist;

  ctx.save();

  // -------------------------------------------------------------------------
  // 1. 외곽 고압 공기 제트 빔 외피 (Outer Air Sheath)
  // -------------------------------------------------------------------------
  const outerWidth = 26;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineWidth = outerWidth;
  ctx.strokeStyle = AERO_CYAN;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(headX, headY);
  ctx.stroke();

  // 빔 외곽 테두리 강조선 (Cyan Glow Edge)
  ctx.lineWidth = outerWidth + 4;
  ctx.strokeStyle = "rgba(2, 132, 199, 0.45)";
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(headX, headY);
  ctx.stroke();
  ctx.restore();

  // -------------------------------------------------------------------------
  // 2. 중심 초고밀도 순백 관통 심선 (Pure White Supersonic Core)
  // -------------------------------------------------------------------------
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineWidth = 12;
  ctx.strokeStyle = AERO_WHITE;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(headX, headY);
  ctx.stroke();
  ctx.restore();

  // -------------------------------------------------------------------------
  // 3. 이중 나선 회오리 공기 리본 (Double-Helix 3D Vortex Ribbons)
  // -------------------------------------------------------------------------
  const samples = Math.max(16, Math.floor(currDist / 12));
  const helixAmplitude = 16;
  const spatialFreq = 0.055; // 빔 길이에 따른 나선 주기

  // Ribbon 1 (Main Cyan-Neon Helix)
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineWidth = 3.2;
  ctx.strokeStyle = AERO_WHITE;
  ctx.beginPath();
  for (let i = 0; i <= samples; i++) {
    const s = (i / samples) * currDist;
    const wave = Math.sin(s * spatialFreq + animPhase * 8.0) * helixAmplitude;
    const px = ax + Math.cos(angle) * s + perpX * wave;
    const py = ay + Math.sin(angle) * s + perpY * wave;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  ctx.lineWidth = 2.0;
  ctx.strokeStyle = AERO_CYAN_NEON;
  ctx.stroke();
  ctx.restore();

  // Ribbon 2 (Opposing Azure-White Helix, 180도 위상차)
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = AERO_SKY_GLOW;
  ctx.beginPath();
  for (let i = 0; i <= samples; i++) {
    const s = (i / samples) * currDist;
    const wave = Math.sin(s * spatialFreq + animPhase * 8.0 + Math.PI) * helixAmplitude;
    const px = ax + Math.cos(angle) * s + perpX * wave;
    const py = ay + Math.sin(angle) * s + perpY * wave;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();

  // -------------------------------------------------------------------------
  // 4. 마하 압축 충격파 타원 링 (Mach Shockwave Compression Rings)
  // -------------------------------------------------------------------------
  const ringRatios = [0.28, 0.58, 0.88];
  for (const rRatio of ringRatios) {
    if (rRatio <= headProgress + 0.05) {
      const ringDist = totalDist * rRatio;
      const rx = ax + Math.cos(angle) * ringDist;
      const ry = ay + Math.sin(angle) * ringDist;

      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(angle);
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = AERO_WHITE;
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 20, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 1.0;
      ctx.strokeStyle = AERO_CYAN_NEON;
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 26, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // -------------------------------------------------------------------------
  // 5. 빔 선두 진공 원추 헤드 (Aerodynamic Cone Spearhead)
  // -------------------------------------------------------------------------
  ctx.save();
  ctx.translate(headX, headY);
  ctx.rotate(angle);

  // 전방 뾰족한 콘 스피어
  ctx.fillStyle = AERO_WHITE;
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-8, -14);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-8, 14);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = AERO_CYAN_NEON;
  ctx.lineWidth = 2.0;
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

/**
 * Step 3: 상대방을 삼키는 거대 회오리바람 기둥 (Colossal Tornado Vortex Funnel)
 */
function drawCycloneTornadoColumn(
  ctx: any,
  tx: number,
  ty: number,
  progress: number,
  spinPhase: number,
  isBehindLayer: boolean = false
) {
  const t = Math.max(0, Math.min(1.0, progress));
  const baseY = ty + 24;
  const maxHeight = 160;
  const currentHeight = maxHeight * Math.min(1.0, t * 1.25);
  const topY = baseY - currentHeight;

  const rBase = 22;
  const rTop = 58;

  ctx.save();

  // 배후 레이어: 거대 회오리바람의 뒤쪽 반원 호 & 내부 원통형 음영
  if (isBehindLayer) {
    const numBands = 8;
    for (let i = 0; i < numBands; i++) {
      const u = i / (numBands - 1);
      const y = baseY - u * currentHeight;
      const r = rBase + (rTop - rBase) * u;
      const bandPhase = spinPhase * 4.0 + u * Math.PI * 3.0;

      ctx.save();
      ctx.lineWidth = 2.4 + u * 1.6;
      ctx.strokeStyle = "rgba(2, 132, 199, 0.45)"; // 짙은 에어로 블루
      ctx.beginPath();
      // 뒤쪽 반원 호 (PI ~ 2*PI)
      ctx.ellipse(tx, y, r, r * 0.35, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    return;
  }

  // 전면 레이어: 거대 회오리바람의 앞쪽 고속 순백/시안 회전 호
  const numBands = 8;
  for (let i = 0; i < numBands; i++) {
    const u = i / (numBands - 1);
    const y = baseY - u * currentHeight;
    const r = rBase + (rTop - rBase) * u;
    const bandPhase = spinPhase * 4.5 + u * Math.PI * 3.5;

    // 앞쪽 반원 호 (0 ~ PI)
    ctx.save();
    ctx.lineWidth = 2.8 + u * 1.8;
    ctx.strokeStyle = i % 2 === 0 ? AERO_WHITE : AERO_CYAN_NEON;
    ctx.beginPath();
    ctx.ellipse(tx, y, r, r * 0.35, 0, 0, Math.PI);
    ctx.stroke();

    // 호를 따라 고속 이동하는 바람 칼날 파티클 (Wind Streaks)
    const streakAngle = (bandPhase % Math.PI);
    const sx = tx + Math.cos(streakAngle) * r;
    const sy = y + Math.sin(streakAngle) * (r * 0.35);
    ctx.fillStyle = AERO_WHITE;
    ctx.beginPath();
    ctx.arc(sx, sy, 2.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Step 3 & 4: 타겟을 난타하는 초승달 진공 참격 칼날 (Vacuum Slash Sickles)
 */
function drawVacuumSlashBlades(
  ctx: any,
  tx: number,
  ty: number,
  progress: number
) {
  ctx.save();
  const slashes = [
    { angle: -0.65, length: 74, xOff: -6, yOff: -8, width: 4.8 },
    { angle: 0.75, length: 68, xOff: 8, yOff: 4, width: 4.2 },
    { angle: 0.10, length: 82, xOff: 0, yOff: -14, width: 5.2 },
    { angle: -1.25, length: 62, xOff: -10, yOff: 10, width: 4.0 },
  ];

  const t = Math.max(0, Math.min(1.0, progress));

  for (let i = 0; i < slashes.length; i++) {
    const s = slashes[i];
    // 각 참격마다 시차 부여
    const delay = i * 0.22;
    if (t < delay) continue;
    const localT = Math.min(1.0, (t - delay) / 0.55);

    const len = s.length * Math.sin(localT * Math.PI);
    if (len <= 2) continue;

    ctx.save();
    ctx.translate(tx + s.xOff, ty + s.yOff);
    ctx.rotate(s.angle);

    // 날카로운 초승달 진공 참격
    ctx.beginPath();
    ctx.moveTo(-len * 0.5, 0);
    ctx.quadraticCurveTo(0, -s.width * 2.2, len * 0.5, 0);
    ctx.quadraticCurveTo(0, s.width * 0.6, -len * 0.5, 0);
    ctx.fillStyle = AERO_WHITE;
    ctx.fill();

    ctx.strokeStyle = AERO_CYAN_NEON;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Step 4: 대기 파열 십자 섬광 & 초고압 대폭발 (Atmospheric Rupture & Starburst Cross)
 */
function drawAtmosphericRuptureCross(
  ctx: any,
  tx: number,
  ty: number,
  radius: number,
  alpha: number
) {
  if (radius <= 2 || alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, alpha);

  // 1. 순백 & 시안 거대 충격파 원형 링
  ctx.lineWidth = 3.2;
  ctx.strokeStyle = AERO_WHITE;
  ctx.beginPath();
  ctx.arc(tx, ty, radius * 0.85, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.6;
  ctx.strokeStyle = AERO_CYAN_NEON;
  ctx.beginPath();
  ctx.arc(tx, ty, radius * 1.15, 0, Math.PI * 2);
  ctx.stroke();

  // 2. 4방향 거대 주 섬광 광선 (Cardinal Rays - 날카로운 다이아몬드 참격)
  const cardR = radius * 1.55;
  const cardW = 7.5;
  const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

  for (const a of angles) {
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(a);

    ctx.fillStyle = AERO_WHITE;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(cardR * 0.25, -cardW);
    ctx.lineTo(cardR, 0);
    ctx.lineTo(cardR * 0.25, cardW);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = AERO_CYAN;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  // 3. 4방향 보조 대각선 섬광 광선 (Diagonal Rays)
  const diagR = radius * 1.05;
  const diagW = 4.5;
  const diagAngles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];

  for (const a of diagAngles) {
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(a);

    ctx.fillStyle = AERO_SKY_GLOW;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(diagR * 0.25, -diagW);
    ctx.lineTo(diagR, 0);
    ctx.lineTo(diagR * 0.25, diagW);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 4. 중심 고휘도 폭발 글로우 구체
  const hitGrad = ctx.createRadialGradient(tx, ty, 2, tx, ty, radius * 0.55);
  hitGrad.addColorStop(0, AERO_WHITE);
  hitGrad.addColorStop(0.4, AERO_SKY_GLOW);
  hitGrad.addColorStop(0.8, AERO_CYAN);
  hitGrad.addColorStop(1, "rgba(2, 132, 199, 0)");
  ctx.fillStyle = hitGrad;
  ctx.beginPath();
  ctx.arc(tx, ty, radius * 0.55, 0, Math.PI * 2);
  ctx.fill();

  // 5. 전방위 비산하는 미니 스타버스트 스파크 8개
  for (let i = 0; i < 8; i++) {
    const sparkAngle = (i / 8) * Math.PI * 2 + 0.2;
    const sparkDist = radius * (0.95 + (i % 2) * 0.35);
    const sx = tx + Math.cos(sparkAngle) * sparkDist;
    const sy = ty + Math.sin(sparkAngle) * sparkDist;
    drawMiniRetroStar(ctx, sx, sy, 3.2, AERO_WHITE);
  }

  ctx.restore();
}

/**
 * 지면 공기 압축 충격파 링 (Ground Shockwave Expansion)
 */
function drawGroundShockwave(
  ctx: any,
  tx: number,
  ty: number,
  progress: number
) {
  const t = Math.max(0, Math.min(1.0, progress));
  const gy = ty + 24;
  const rx = 24 + t * 52;
  const ry = rx * 0.34;
  const alpha = Math.max(0, 1.0 - t);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = AERO_WHITE;
  ctx.beginPath();
  ctx.ellipse(tx, gy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.4;
  ctx.strokeStyle = AERO_CYAN_NEON;
  ctx.beginPath();
  ctx.ellipse(tx, gy, rx * 1.25, ry * 1.25, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// ============================================================================
// Main Exported Renderers
// ============================================================================

/**
 * 177: 에어로블라스트 배후 이펙트 (Aeroblast Behind Effect)
 * - 전장 대기압 암전 워시
 * - 피격 포켓몬 등 뒤로 솟구치는 거대 회오리바람의 후면 호
 * - 발밑 지면 압축 충격파 링
 */
export function drawAeroblastBehindEffect(
  targetCtx: any,
  frameOrTargetPos: any,
  drawCtxOrStep?: any
) {
  if (!frameOrTargetPos) return;

  let frame: BattleFrame | null = null;
  let drawCtx: EffectDrawContext | null = null;
  let targetPos = { x: 380, y: 130 };
  let attackerPos = { x: 130, y: 260 };
  let moveStep = 1;
  let p = 0.5;
  let isPlayer = true;

  if (
    typeof frameOrTargetPos === "object" &&
    ("showEffect" in frameOrTargetPos || "moveStep" in frameOrTargetPos || "delay" in frameOrTargetPos)
  ) {
    frame = frameOrTargetPos as BattleFrame;
    drawCtx = drawCtxOrStep as EffectDrawContext;
    if (!frame.showEffect || !drawCtx?.targetPos) return;

    targetPos = drawCtx.targetPos;
    attackerPos = drawCtx.attackerPos || attackerPos;
    isPlayer = drawCtx.isPlayer ?? true;
    moveStep = frame.moveStep ?? 1;
    p = frame.effectProgress ?? 0.5;
  } else {
    targetPos = frameOrTargetPos;
    moveStep = typeof drawCtxOrStep === "number" ? drawCtxOrStep : 1;
    p = 0.5;
  }

  const ctx = targetCtx;
  const tx = targetPos.x + (isPlayer ? (frame?.eOffset?.x ?? 0) : (frame?.pOffset?.x ?? 0));
  const ty = targetPos.y + (isPlayer ? (frame?.eOffset?.y ?? 0) : (frame?.pOffset?.y ?? 0)) - 6;

  ctx.save();

  // 1. 대기압 강하 화면 암전 오버레이 (Atmospheric Dim)
  const dimAlpha = frame?.dimAlpha ?? (
    moveStep === 1 ? 0.25 * p :
    moveStep === 2 ? 0.22 :
    moveStep === 3 ? 0.18 :
    moveStep === 4 ? 0.14 :
    moveStep === 5 ? Math.max(0, 0.12 * (1.0 - p)) : 0
  );

  if (dimAlpha > 0.005) {
    ctx.save();
    ctx.fillStyle = `rgba(15, 23, 42, ${dimAlpha})`;
    ctx.fillRect(-5000, -5000, 12000, 12000);
    ctx.restore();
  }

  // 2. Step 3 & 4 & 5: 피격자 배후 거대 회오리바람 기둥 (후면 호)
  if (moveStep >= 3 && moveStep <= 5) {
    const tornadoProg = moveStep === 3 ? (frame?.tornadoProgress ?? p) :
                        moveStep === 4 ? 1.0 :
                        Math.max(0, 1.0 - (frame?.dissipationProgress ?? p));
    const spinPhase = (frame?.moveStep ?? 3) * 0.8 + p * 1.5;
    drawCycloneTornadoColumn(ctx, tx, ty, tornadoProg, spinPhase, true);

    // 발밑 지면 충격파 링
    if (moveStep === 3 || moveStep === 4) {
      const gProg = moveStep === 3 ? p : 0.5 + p * 0.5;
      drawGroundShockwave(ctx, tx, ty, gProg);
    }
  }

  ctx.restore();
}

/**
 * 177: 에어로블라스트 전면 이펙트 (Aeroblast Front Effect)
 * - Step 1: 시전자 앞 풍압 흡입 소용돌이 기류 & 초고압 에어로 볼텍스 구체
 * - Step 2: 초고속 3D 나선형 볼텍스 캐논 빔 & 마하 충격파 링
 * - Step 3: 상대 직격 착탄 & 전면 회오리바람 기둥 & 진공 참격 난타
 * - Step 4: 대기 파열 십자 섬광 & 초고압 충격파 대폭발 & 스파크 비산
 * - Step 5: 회오리 상공 소산 & 은은한 기류 잔향 소멸
 */
export function drawAeroblastEffect(
  targetCtx: any,
  frameOrTargetPos: any,
  drawCtxOrStep?: any
) {
  if (!frameOrTargetPos) return;

  let frame: BattleFrame | null = null;
  let drawCtx: EffectDrawContext | null = null;
  let targetPos = { x: 380, y: 130 };
  let attackerPos = { x: 130, y: 260 };
  let moveStep = 1;
  let p = 0.5;
  let isPlayer = true;

  if (
    typeof frameOrTargetPos === "object" &&
    ("showEffect" in frameOrTargetPos || "moveStep" in frameOrTargetPos || "delay" in frameOrTargetPos)
  ) {
    frame = frameOrTargetPos as BattleFrame;
    drawCtx = drawCtxOrStep as EffectDrawContext;
    if (!frame.showEffect || !drawCtx?.targetPos) return;

    targetPos = drawCtx.targetPos;
    attackerPos = drawCtx.attackerPos || attackerPos;
    isPlayer = drawCtx.isPlayer ?? true;
    moveStep = frame.moveStep ?? 1;
    p = frame.effectProgress ?? 0.5;
  } else {
    targetPos = frameOrTargetPos;
    moveStep = typeof drawCtxOrStep === "number" ? drawCtxOrStep : 1;
    p = 0.5;
  }

  const ctx = targetCtx;
  const dir = isPlayer ? 1 : -1;

  // 발사 원점 (시전자 입/가슴 앞)
  const ax = attackerPos.x + (isPlayer ? (frame?.pOffset?.x ?? 0) : (frame?.eOffset?.x ?? 0)) + dir * 28;
  const ay = attackerPos.y + (isPlayer ? (frame?.pOffset?.y ?? 0) : (frame?.eOffset?.y ?? 0)) - 12;

  // 피격 표적 중심 (상대방 가슴)
  const tx = targetPos.x + (isPlayer ? (frame?.eOffset?.x ?? 0) : (frame?.pOffset?.x ?? 0));
  const ty = targetPos.y + (isPlayer ? (frame?.eOffset?.y ?? 0) : (frame?.pOffset?.y ?? 0)) - 6;

  ctx.save();

  // ===========================================================================
  // Step 1: 풍압 집약 & 대기압 왜곡 차징
  // ===========================================================================
  if (moveStep === 1) {
    const chargeProg = frame?.chargeProgress ?? p;
    drawInwardSuctionTrails(ctx, ax, ay, chargeProg, dir);

    const sphereR = 12 + chargeProg * 14;
    drawCompressedVortexSphere(ctx, ax, ay, sphereR, 0.85 + chargeProg * 0.15, chargeProg);
  }

  // ===========================================================================
  // Step 2: 초고속 나선형 공기 볼텍스 캐논 발사
  // ===========================================================================
  else if (moveStep === 2) {
    const beamProg = frame?.beamProgress ?? p;
    drawAeroblastBeam(ctx, ax, ay, tx, ty, beamProg, p);

    // 시전자 발사구 반동 섬광 구체
    drawCompressedVortexSphere(ctx, ax, ay, 20 * (1.0 - p * 0.3), 1.0, p);
  }

  // ===========================================================================
  // Step 3: 상대 직격 착탄 & 거대 회오리바람 기둥 분출 & 진공 참격
  // ===========================================================================
  else if (moveStep === 3) {
    // 1. 관통 상태 빔 잔여 (시전자 -> 표적 연결선)
    drawAeroblastBeam(ctx, ax, ay, tx, ty, 1.0, p + 1.0);

    // 2. 피격자 전면 회오리바람 기둥 (앞쪽 호)
    const tornadoProg = frame?.tornadoProgress ?? p;
    const spinPhase = 3.0 + p * 2.5;
    drawCycloneTornadoColumn(ctx, tx, ty, tornadoProg, spinPhase, false);

    // 3. 진공 참격 칼날 난타
    drawVacuumSlashBlades(ctx, tx, ty, tornadoProg);

    // 4. 착탄 직격 순간 타격 스타버스트 플래시
    if (frame?.hitFlash || p <= 0.45) {
      drawStarburstImpact(ctx, tx, ty, AERO_CYAN, AERO_WHITE, 38);
    }
  }

  // ===========================================================================
  // Step 4: 대기 파열 십자 섬광 & 초고압 대폭발 (High-Crit Burst)
  // ===========================================================================
  else if (moveStep === 4) {
    const burstProg = frame?.burstProgress ?? p;
    const burstR = 34 + burstProg * 48;
    const burstAlpha = Math.max(0, 1.0 - burstProg * 0.85);

    // 대기 파열 십자 섬광 & 외곽 충격파
    drawAtmosphericRuptureCross(ctx, tx, ty, burstR, burstAlpha);

    // 잔여 회오리바람 기둥
    const spinPhase = 6.0 + p * 2.0;
    drawCycloneTornadoColumn(ctx, tx, ty, 1.0 - burstProg * 0.35, spinPhase, false);

    // 2차 진공 참격 칼날 잔향
    if (burstProg < 0.6) {
      drawVacuumSlashBlades(ctx, tx, ty, 0.5 + burstProg * 0.5);
    }
  }

  // ===========================================================================
  // Step 5: 폭풍 소멸 & 대기 안정화 (Dissipation & Recovery)
  // ===========================================================================
  else if (moveStep === 5) {
    const dissProg = frame?.dissipationProgress ?? p;
    const fadeAlpha = Math.max(0, 1.0 - dissProg);

    if (fadeAlpha > 0.02) {
      ctx.save();
      ctx.globalAlpha = fadeAlpha;
      const spinPhase = 9.0 + p * 1.5;
      drawCycloneTornadoColumn(ctx, tx, ty, fadeAlpha * 0.6, spinPhase, false);

      // 상공으로 흩어지는 미세 바람 스파크
      for (let i = 0; i < 4; i++) {
        const sx = tx + ((i - 1.5) * 16);
        const sy = ty - 40 - (dissProg * 45) - (i * 8);
        drawMiniRetroStar(ctx, sx, sy, 2.2, AERO_WHITE);
      }
      ctx.restore();
    }
  }

  ctx.restore();
}
