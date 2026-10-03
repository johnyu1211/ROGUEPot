// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawFrontStraightPunchFistSvg } from "./move001_004.js";
import { drawFittedBattleSprite } from "../../common/spriteLoader.js";
import { getCometPunchFistImg, getScaryFaceImg } from "../common/helpers.js";

/**
 * Gen 2 Moves 181 - 184 Renderers
 *
 * 181: 눈싸라기 (Powder Snow) - 얼음 타입 특수 공격기
 * 182: 방어 (Protect)
 * 183: 마하펀치 (Mach Punch)
 * 184: 겁나는얼굴 (Scary Face)
 */

// ============================================================================
// ❄️ 181: 눈싸라기 (Powder Snow)
// ============================================================================

/**
 * 🌟 순백색 눈 알갱이 (Pure White Snow Grain)
 * - [유저 지시]: 처음부터 빛나는 것이 아니라, 발사되다가 비행 도중 딱 '한 번' 번쩍이고 지나감!
 * - flashIntensity: 0.0 (단정한 순백 미세 알갱이) ~ 1.0 (빛나는 순간 한 번 번쩍임!)
 */
function drawPureWhiteSnowGrain(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number = 1.0,
  flashIntensity: number = 0.0
) {
  if (alpha <= 0.01 || radius <= 0.3) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, alpha);

  // 1. 발사되다가 한 번 빛나는 순간(flashIntensity > 0)에만 나타나는 순백 발광 글로우
  if (flashIntensity > 0.02) {
    const glowR = radius * (1.6 + 1.4 * flashIntensity);
    const haloGrad = ctx.createRadialGradient(
      x, y, radius * 0.2,
      x, y, glowR
    );
    haloGrad.addColorStop(0.0, `rgba(255, 255, 255, ${0.95 * flashIntensity})`);
    haloGrad.addColorStop(0.40, `rgba(255, 255, 255, ${0.65 * flashIntensity})`);
    haloGrad.addColorStop(0.75, `rgba(255, 255, 255, ${0.25 * flashIntensity})`);
    haloGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. 중심부 순백 코어 (평소에는 단정한 1.5~2.4px 알갱이, 빛나는 순간 살짝 팽창)
  const coreR = radius * (1.0 + 0.35 * flashIntensity);
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(x, y, coreR, 0, Math.PI * 2);
  ctx.fill();

  // 3. 비행 도중 "딱 한 번 번쩍" 빛나는 피크 순간에만 드러나는 십자 스파크
  if (flashIntensity > 0.50) {
    const spFrac = (flashIntensity - 0.50) / 0.50; // 0.0 ~ 1.0
    const spLen = radius * 3.2 * spFrac;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.95 * spFrac})`;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(x - spLen, y);
    ctx.lineTo(x + spLen, y);
    ctx.moveTo(x, y - spLen);
    ctx.lineTo(x, y + spLen);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 24개의 관통 눈싸라기 알갱이
 * - flashCenterT: 비행 거리(distT, 0.0~1.45) 중 '딱 한 번' 빛나는 중심 지점!
 */
interface PenetratingSnowOrb {
  launchP: number;      // 발사 시점
  speed: number;        // 비행 속도 (0.95 ~ 1.15)
  arcHeight: number;    // 포물선 궤적
  spreadY: number;      // 상하 확산 폭
  radius: number;       // 알갱이 반지름
  flashCenterT: number; // 비행 도중 딱 한 번 빛나는 지점 (0.38 ~ 0.72)
  layer: "front" | "behind";
}

const PENETRATING_SNOW_ORBS: PenetratingSnowOrb[] = [
  { launchP: 0.00, speed: 1.05, arcHeight:  -8, spreadY: -28, radius: 2.2, flashCenterT: 0.45, layer: "front" },
  { launchP: 0.02, speed: 1.00, arcHeight:  10, spreadY:  24, radius: 1.6, flashCenterT: 0.52, layer: "behind" },
  { launchP: 0.04, speed: 1.10, arcHeight: -18, spreadY: -35, radius: 2.4, flashCenterT: 0.40, layer: "front" },
  { launchP: 0.07, speed: 1.02, arcHeight:   6, spreadY:  15, radius: 1.9, flashCenterT: 0.60, layer: "behind" },
  { launchP: 0.09, speed: 1.12, arcHeight: -22, spreadY: -18, radius: 2.3, flashCenterT: 0.48, layer: "front" },
  { launchP: 0.12, speed: 0.98, arcHeight:  16, spreadY:  32, radius: 1.5, flashCenterT: 0.55, layer: "behind" },
  { launchP: 0.14, speed: 1.08, arcHeight:  -4, spreadY:  -8, radius: 2.5, flashCenterT: 0.42, layer: "front" },
  { launchP: 0.17, speed: 1.04, arcHeight:  20, spreadY:  26, radius: 1.8, flashCenterT: 0.64, layer: "front" },
  { launchP: 0.19, speed: 1.14, arcHeight: -14, spreadY: -30, radius: 2.1, flashCenterT: 0.50, layer: "behind" },
  { launchP: 0.22, speed: 0.96, arcHeight:   8, spreadY:  18, radius: 1.6, flashCenterT: 0.58, layer: "front" },
  { launchP: 0.24, speed: 1.06, arcHeight: -20, spreadY: -22, radius: 2.4, flashCenterT: 0.46, layer: "behind" },
  { launchP: 0.27, speed: 1.02, arcHeight:  14, spreadY:  34, radius: 1.7, flashCenterT: 0.66, layer: "front" },
  { launchP: 0.29, speed: 1.12, arcHeight:  -6, spreadY: -12, radius: 2.2, flashCenterT: 0.54, layer: "front" },
  { launchP: 0.32, speed: 1.00, arcHeight:   4, spreadY:   8, radius: 1.8, flashCenterT: 0.62, layer: "behind" },
  { launchP: 0.34, speed: 1.08, arcHeight: -16, spreadY: -26, radius: 2.3, flashCenterT: 0.44, layer: "front" },
  { launchP: 0.37, speed: 0.98, arcHeight:  12, spreadY:  20, radius: 1.5, flashCenterT: 0.56, layer: "behind" },
  { launchP: 0.39, speed: 1.10, arcHeight:  -8, spreadY: -16, radius: 2.4, flashCenterT: 0.50, layer: "front" },
  { launchP: 0.42, speed: 1.04, arcHeight:  14, spreadY:  28, radius: 1.7, flashCenterT: 0.68, layer: "front" },
  { launchP: 0.44, speed: 1.08, arcHeight: -12, spreadY: -32, radius: 2.0, flashCenterT: 0.48, layer: "behind" },
  { launchP: 0.47, speed: 1.02, arcHeight:   6, spreadY:  12, radius: 1.8, flashCenterT: 0.60, layer: "front" },
  { launchP: 0.49, speed: 1.12, arcHeight:  -4, spreadY:  -4, radius: 2.2, flashCenterT: 0.52, layer: "behind" },
  { launchP: 0.52, speed: 1.00, arcHeight:  10, spreadY:  22, radius: 1.6, flashCenterT: 0.70, layer: "front" },
  { launchP: 0.54, speed: 1.06, arcHeight: -10, spreadY: -20, radius: 2.1, flashCenterT: 0.46, layer: "front" },
  { launchP: 0.57, speed: 1.02, arcHeight:   8, spreadY:  16, radius: 1.7, flashCenterT: 0.58, layer: "behind" },
];

/**
 * 궤적 렌더링 공통 헬퍼
 */
function renderPenetratingStream(
  ctx: any,
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  progress: number,
  layerFilter: "front" | "behind"
) {
  for (let i = 0; i < PENETRATING_SNOW_ORBS.length; i++) {
    const orb = PENETRATING_SNOW_ORBS[i];
    if (orb.layer !== layerFilter) continue;
    if (progress < orb.launchP) continue;

    const distT = (progress - orb.launchP) * orb.speed;
    if (distT <= 0.0 || distT > 1.48) continue;

    const spreadProgress = Math.min(1.0, distT);
    const spread = orb.spreadY * Math.sin(spreadProgress * Math.PI * 0.85);

    const curX = startX + (targetX - startX) * distT;
    const curY = startY + (targetY - startY) * distT + Math.sin(Math.min(1.0, distT) * Math.PI) * orb.arcHeight + spread;

    let alpha = 1.0;
    if (distT < 0.10) {
      alpha = distT / 0.10;
    } else if (distT > 1.05) {
      alpha = Math.max(0, 1.0 - (distT - 1.05) / 0.40);
    }

    if (alpha <= 0.01) continue;

    // [핵심 연출]: 비행 도중 딱 한 번(flashCenterT 부근)만 싹 번쩍이는 펄스 강도 계산
    const flashDist = Math.abs(distT - orb.flashCenterT);
    const flashHalfWidth = 0.11; // 좁은 구간에서 한 번 빛나고 원복
    let flashIntensity = 0.0;
    if (flashDist < flashHalfWidth) {
      flashIntensity = Math.cos((flashDist / flashHalfWidth) * (Math.PI / 2));
    }

    drawPureWhiteSnowGrain(ctx, curX, curY, orb.radius, alpha, flashIntensity);
  }
}

/**
 * ❄️ 181: 눈싸라기 후방 레이어 렌더러
 */
export function drawPowderSnowBehindEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, attackerPos, isPlayer: isP } = drawCtx;
  const p = frame.effectProgress ?? 0.5;

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));
  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0));

  const startX = ax + (isP ? 26 : -26);
  const startY = ay - (isP ? 10 : 8);
  const targetCenterY = ty - (isP ? 14 : 10);

  renderPenetratingStream(targetCtx, startX, startY, tx, targetCenterY, p, "behind");
}

/**
 * ❄️ 181: 눈싸라기 전면 레이어 렌더러
 */
export function drawPowderSnowEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, attackerPos, isPlayer: isP } = drawCtx;
  const p = frame.effectProgress ?? 0.5;

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));
  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0));

  const startX = ax + (isP ? 26 : -26);
  const startY = ay - (isP ? 10 : 8);
  const targetCenterY = ty - (isP ? 14 : 10);

  renderPenetratingStream(targetCtx, startX, startY, tx, targetCenterY, p, "front");
}

interface BlurredLightBlob {
  dx: number;
  dy: number;
  radius: number;
  r: number;
  g: number;
  b: number;
  appearT: number;
  maxAlpha: number;
}

// [유저 지시]: 빛 덩어리들로 이루어진 사각형 (6열 x 4행 사각 그리드 배치 확대, 우에서 좌로 순차 출현)
const PROTECT_BLURRED_BLOBS: BlurredLightBlob[] = [
  // 1열 (우측 끝, dx: +40) -> 가장 먼저 출현 (appearT: 0.10)
  { dx:  40, dy: -24, radius: 13.0, r:  50, g: 150, b: 255, appearT: 0.10, maxAlpha: 0.90 }, // 파랑
  { dx:  40, dy:  -8, radius: 13.0, r:  40, g: 130, b: 250, appearT: 0.10, maxAlpha: 0.90 }, // 파랑
  { dx:  40, dy:   8, radius: 13.0, r:  40, g: 140, b: 255, appearT: 0.10, maxAlpha: 0.90 }, // 파랑
  { dx:  40, dy:  24, radius: 13.0, r:  50, g: 150, b: 255, appearT: 0.10, maxAlpha: 0.90 }, // 파랑

  // 2열 (dx: +24) -> appearT: 0.25
  { dx:  24, dy: -24, radius: 14.0, r:  80, g: 240, b: 220, appearT: 0.25, maxAlpha: 0.92 }, // 시안-민트
  { dx:  24, dy:  -8, radius: 14.0, r: 180, g: 245, b: 255, appearT: 0.25, maxAlpha: 0.94 }, // 밝은 시안
  { dx:  24, dy:   8, radius: 14.0, r:  50, g: 210, b: 250, appearT: 0.25, maxAlpha: 0.92 }, // 시안
  { dx:  24, dy:  24, radius: 14.5, r: 210, g: 245, b: 255, appearT: 0.25, maxAlpha: 0.96 }, // 순백-시안

  // 3열 (dx: +8) -> appearT: 0.40
  { dx:   8, dy: -24, radius: 14.5, r: 120, g: 255, b: 190, appearT: 0.40, maxAlpha: 0.94 }, // 민트
  { dx:   8, dy:  -8, radius: 14.5, r:  40, g: 235, b: 230, appearT: 0.40, maxAlpha: 0.92 }, // 청록
  { dx:   8, dy:   8, radius: 14.5, r:  50, g: 225, b: 240, appearT: 0.40, maxAlpha: 0.92 }, // 시안
  { dx:   8, dy:  24, radius: 15.0, r: 250, g: 255, b: 255, appearT: 0.40, maxAlpha: 1.00 }, // 순백

  // 4열 (dx: -8) -> appearT: 0.55
  { dx:  -8, dy: -24, radius: 14.5, r: 240, g: 255, b: 255, appearT: 0.55, maxAlpha: 0.98 }, // 순백 발광
  { dx:  -8, dy:  -8, radius: 14.5, r:  50, g: 235, b: 180, appearT: 0.55, maxAlpha: 0.92 }, // 청록/민트
  { dx:  -8, dy:   8, radius: 14.5, r:  70, g: 240, b: 150, appearT: 0.55, maxAlpha: 0.92 }, // 연두
  { dx:  -8, dy:  24, radius: 15.0, r: 255, g: 255, b: 255, appearT: 0.55, maxAlpha: 1.00 }, // 순백 최고 발광

  // 5열 (dx: -24) -> appearT: 0.70
  { dx: -24, dy: -24, radius: 14.0, r:  60, g: 230, b: 140, appearT: 0.70, maxAlpha: 0.90 }, // 초록
  { dx: -24, dy:  -8, radius: 14.0, r:  60, g: 225, b: 130, appearT: 0.70, maxAlpha: 0.90 }, // 초록
  { dx: -24, dy:   8, radius: 14.0, r:  60, g: 225, b: 160, appearT: 0.70, maxAlpha: 0.90 }, // 연두
  { dx: -24, dy:  24, radius: 14.5, r: 245, g: 255, b: 255, appearT: 0.70, maxAlpha: 0.98 }, // 순백-시안

  // 6열 (좌측 끝, dx: -40) -> appearT: 0.85
  { dx: -40, dy: -24, radius: 13.0, r:  60, g: 230, b: 140, appearT: 0.85, maxAlpha: 0.88 }, // 초록
  { dx: -40, dy:  -8, radius: 13.0, r:  40, g: 200, b: 220, appearT: 0.85, maxAlpha: 0.88 }, // 청록
  { dx: -40, dy:   8, radius: 13.0, r: 180, g: 240, b: 255, appearT: 0.85, maxAlpha: 0.88 }, // 밝은 시안
  { dx: -40, dy:  24, radius: 13.0, r:  60, g: 180, b: 250, appearT: 0.85, maxAlpha: 0.88 }, // 스카이블루
];

function drawBlurredBlob(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  r: number,
  g: number,
  b: number,
  alpha: number
) {
  if (alpha <= 0.01 || radius <= 1) return;
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0.0, `rgba(${r}, ${g}, ${b}, ${Math.min(1.0, alpha * 0.95)})`);
  grad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${alpha * 0.65})`);
  grad.addColorStop(0.70, `rgba(${r}, ${g}, ${b}, ${alpha * 0.25})`);
  grad.addColorStop(1.0, `rgba(${r}, ${g}, ${b}, 0.0)`);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * 🛡️ 182: 방어 (Protect) 이펙트 렌더러
 */
export function drawProtectEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { attackerPos, isPlayer: isP } = drawCtx;
  const p = frame.effectProgress ?? 0.5;
  const step = frame.moveStep ?? 1;

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));

  const cx = ax + (isP ? -4 : 4);
  const cy = ay - (isP ? 22 : 16);

  let unfoldT = 1.0;
  let globalAlpha = 1.0;

  if (step === 1) {
    unfoldT = p; // 0.18 (1열 점화)
    globalAlpha = 0.80;
  } else if (step === 2) {
    unfoldT = p; // 0.38, 0.68 (2~4열 순차 전개)
    globalAlpha = 0.92;
  } else if (step === 3) {
    unfoldT = p; // 0.98 (5~6열 좌측 끝까지 전개)
    globalAlpha = 0.96;
  } else if (step === 4) {
    unfoldT = 1.0;
    globalAlpha = 1.0;
  } else if (step === 5) {
    unfoldT = 1.0;
    globalAlpha = 1.0;
  } else if (step === 6) {
    unfoldT = 1.0;
    globalAlpha = Math.max(0, 1.0 - p);
  }

  if (globalAlpha <= 0.01) return;

  targetCtx.save();

  for (let i = 0; i < PROTECT_BLURRED_BLOBS.length; i++) {
    const blob = PROTECT_BLURRED_BLOBS[i];

    if (unfoldT < blob.appearT) continue;

    const appearProgress = Math.min(1.0, (unfoldT - blob.appearT) / 0.12);
    const blobRadius = blob.radius * (0.6 + 0.4 * appearProgress);
    const blobAlpha = blob.maxAlpha * globalAlpha * appearProgress;

    const shimmer = (step === 4 || step === 5) ? (1.0 + Math.sin(p * Math.PI * 3 + i * 0.5) * 0.08) : 1.0;

    const bx = cx + blob.dx;
    const by = cy + blob.dy;

    drawBlurredBlob(
      targetCtx,
      bx,
      by,
      blobRadius * shimmer,
      blob.r,
      blob.g,
      blob.b,
      blobAlpha
    );
  }

  targetCtx.restore();
}

// ============================================================================
// 🥊 183: 마하펀치 (Mach Punch)
// ============================================================================

interface MachPunchWhiteOrb {
  angle: number;
  speed: number;
  radius: number;
  ySquash: number;
  extraJitterX: number;
  extraJitterY: number;
}

// [유저 지시 엄수]: 인위적인 좌우대칭을 완전히 탈피한 자연스러운 유기적 3D 비산 알갱이 클러스터 (21개)
const MACH_WHITE_ORBS: MachPunchWhiteOrb[] = [
  // 1. 상단 높은 고도 (좌우 높이 및 각도가 불규칙하게 흩어짐)
  { angle: -1.68, speed: 71, radius: 5.6, ySquash: 0.96, extraJitterX: -6, extraJitterY: -4 },
  { angle: -1.35, speed: 64, radius: 4.2, ySquash: 0.92, extraJitterX:  8, extraJitterY:  2 },
  { angle: -2.02, speed: 59, radius: 4.8, ySquash: 0.88, extraJitterX: -3, extraJitterY: -7 },
  { angle: -1.05, speed: 68, radius: 6.2, ySquash: 0.94, extraJitterX:  5, extraJitterY: -3 }, // 상단 우측 큼
  { angle: -1.82, speed: 49, radius: 3.6, ySquash: 0.90, extraJitterX: -8, extraJitterY:  5 },
  { angle: -0.78, speed: 55, radius: 4.5, ySquash: 0.86, extraJitterX: 11, extraJitterY: -2 },

  // 2. 좌측 클러스터 (속도 및 반경이 비대칭)
  { angle: -2.48, speed: 62, radius: 5.2, ySquash: 0.82, extraJitterX: -7, extraJitterY:  4 },
  { angle: -2.85, speed: 43, radius: 3.4, ySquash: 0.76, extraJitterX: -4, extraJitterY: -5 },
  { angle:  2.95, speed: 56, radius: 6.0, ySquash: 0.70, extraJitterX: -9, extraJitterY:  3 },
  { angle:  2.52, speed: 38, radius: 4.0, ySquash: 0.68, extraJitterX: -2, extraJitterY: -6 },
  { angle:  2.18, speed: 51, radius: 4.7, ySquash: 0.64, extraJitterX: -6, extraJitterY:  2 },

  // 3. 우측 클러스터 (좌측과 완전히 다른 밀도와 궤적)
  { angle: -0.42, speed: 65, radius: 5.8, ySquash: 0.78, extraJitterX:  9, extraJitterY: -5 },
  { angle: -0.15, speed: 47, radius: 3.8, ySquash: 0.74, extraJitterX:  6, extraJitterY:  3 },
  { angle:  0.22, speed: 58, radius: 5.0, ySquash: 0.68, extraJitterX: 12, extraJitterY: -4 },
  { angle:  0.55, speed: 41, radius: 6.5, ySquash: 0.62, extraJitterX:  4, extraJitterY:  6 }, // 우측 중하단 큼
  { angle:  0.88, speed: 53, radius: 4.3, ySquash: 0.65, extraJitterX:  8, extraJitterY:  1 },

  // 4. 전면 및 하단 (포켓몬 앞/아래에 맺히는 자연스러운 알갱이들)
  { angle:  1.42, speed: 33, radius: 7.0, ySquash: 0.54, extraJitterX: -4, extraJitterY:  8 }, // 전면 좌측 대형 알갱이
  { angle:  1.78, speed: 28, radius: 5.5, ySquash: 0.58, extraJitterX: -9, extraJitterY:  5 }, // 전면 좌측 중형
  { angle:  1.12, speed: 36, radius: 6.6, ySquash: 0.56, extraJitterX:  7, extraJitterY:  7 }, // 전면 우측 대형 알갱이
  { angle:  1.58, speed: 22, radius: 4.4, ySquash: 0.52, extraJitterX:  1, extraJitterY: 10 }, // 전면 최하단 소형
  { angle:  1.28, speed: 45, radius: 3.9, ySquash: 0.60, extraJitterX:  5, extraJitterY:  3 }, // 내측 흩뿌림
];

/**
 * 🥊 [유저 레퍼런스 엄수]: 바깥으로 퍼져나가는 구체형 순백 발광 알갱이 (Luminous White Orb)
 * - 중심부는 눈부신 100% 순백(#FFFFFF) 코어
 * - [유저 지시 반영]: 외곽 글로우는 은은한 푸른빛 회색(Bluish-Gray) 림
 */
function drawGlowingWhiteOrb(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number
) {
  if (alpha <= 0.01 || radius <= 0.5) return;
  ctx.save();

  // 1. 외곽 푸른빛 회색(Bluish-Gray) 발광 글로우
  const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.55);
  glowGrad.addColorStop(0.00, `rgba(255, 255, 255, ${1.0 * alpha})`);
  glowGrad.addColorStop(0.40, `rgba(255, 255, 255, ${0.95 * alpha})`);
  glowGrad.addColorStop(0.68, `rgba(175, 192, 212, ${0.72 * alpha})`); // 푸른빛 회색 미드
  glowGrad.addColorStop(0.88, `rgba(145, 166, 190, ${0.45 * alpha})`); // 푸른빛 회색 림
  glowGrad.addColorStop(1.00, "rgba(130, 152, 178, 0.0)");             // 완전 투명 소산

  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.55, 0, Math.PI * 2);
  ctx.fill();

  // 2. 중심부 선명하고 단단한 순백 구체 코어
  ctx.fillStyle = `rgba(255, 255, 255, ${1.0 * alpha})`;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.68, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 🥊 [유저 지시 엄수]: 타격도 흰색 (선 없는 순백 코어 플래시)
 * - 십자 선, 스파이크, 외곽 링 등의 선 요소를 일체 제거하고, 깔끔하고 눈부신 순백 코어 발광 섬광만 렌더링
 */
function drawWhiteHitBurst(
  ctx: any,
  cx: number,
  cy: number,
  progress: number
) {
  if (progress > 0.55) return;
  const alpha = Math.max(0, 1.0 - progress / 0.55);
  if (alpha <= 0.01) return;

  ctx.save();

  // 순백 원형 코어 플래시 (선 없이 부드럽고 강렬한 순백 섬광)
  const coreR = (16 + progress * 28);
  const flashGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
  flashGrad.addColorStop(0.00, `rgba(255, 255, 255, ${1.0 * alpha})`);
  flashGrad.addColorStop(0.40, `rgba(255, 255, 255, ${0.92 * alpha})`);
  flashGrad.addColorStop(0.72, `rgba(215, 226, 240, ${0.50 * alpha})`); // 은은한 푸른빛 회색 외곽
  flashGrad.addColorStop(1.00, "rgba(155, 172, 194, 0.0)");

  ctx.fillStyle = flashGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 🥊 [유저 지시 엄수]: 흰색으로 된 몸통박치기 타격시 나오는 삐죽삐죽 스타버스트 (Sharp Comic Impact Starburst)
 * - Tackle(몸통박치기)의 drawSharpImpactBurst 구조 재사용
 * - 링(Shockwave Ring) 일체 없음
 * - 순백(#FFFFFF) 컬러의 8방향 날카로운 충돌 스타버스트
 */
function drawWhiteSharpImpactBurst(
  ctx: any,
  cx: number,
  cy: number,
  progress: number
) {
  if (progress > 0.58) return;
  const alpha = Math.max(0, 1.0 - progress / 0.58);
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(progress * 0.35); // 타격 임팩트 미세 회전

  const outerR = 20 + progress * 24; // 20px -> 34px 확장
  const innerR = outerR * 0.42;      // 날카로운 8방향 삐죽삐죽
  const points = 8;

  // 순백(#FFFFFF) 발광 내부 채우기 & 순백 외곽선
  ctx.fillStyle = `rgba(255, 255, 255, ${0.98 * alpha})`;
  ctx.strokeStyle = `rgba(255, 255, 255, ${1.0 * alpha})`;
  ctx.lineWidth = 2.2;
  ctx.lineJoin = "miter";
  ctx.miterLimit = 4;

  ctx.beginPath();
  const step = Math.PI / points;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = i * step - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}





/**
 * 🥊 183: 마하펀치 (Mach Punch) Behind Effect
 * - Phase 1: 시전 포켓몬이 앞으로 전진하며 뒤편에 남기는 고속 잔상 (Caster Forward Dash Afterimages)
 */
export function drawMachPunchBehindEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const step = frame.moveStep ?? 1;
  if (step !== 1) return;

  const isPlayer = drawCtx.isPlayer;
  const casterSprite = isPlayer ? drawCtx.playerSprite : drawCtx.enemySprite;
  if (!casterSprite) return;

  const basePos = isPlayer ? drawCtx.pm : drawCtx.em;
  if (!basePos) return;

  const casterSize = basePos.size || (isPlayer ? 140 : 110);
  const casterAfterimages = frame.casterAfterimages;
  if (!casterAfterimages || !Array.isArray(casterAfterimages) || casterAfterimages.length === 0) return;

  const sign = isPlayer ? 1 : -1;
  const battlerAlpha = isPlayer ? (drawCtx.pAlpha ?? 1.0) : (drawCtx.eAlpha ?? 1.0);

  targetCtx.save();
  for (let i = 0; i < casterAfterimages.length; i++) {
    const ghost = casterAfterimages[i];
    if (!ghost || ghost.alpha <= 0.01) continue;

    const gx = basePos.x + ghost.dx * sign;
    const gy = basePos.y + ghost.dy;
    const gAlpha = Math.min(1.0, ghost.alpha * battlerAlpha);

    targetCtx.save();
    targetCtx.globalAlpha = gAlpha;
    drawFittedBattleSprite(targetCtx, casterSprite, gx, gy, casterSize);
    targetCtx.restore();
  }
  targetCtx.restore();
}

/**
 * 🥊 메가톤펀치(005)에서 사용된 공식 주먹 스프라이트(Comet Punch Fist) 재사용 렌더러
 */
function drawMegaTonFist(
  ctx: any,
  x: number,
  y: number,
  scale: number,
  alpha: number,
  rot: number = 0
) {
  if (alpha <= 0.01 || scale <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  if (rot !== 0) ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.globalAlpha = Math.min(1.0, alpha);

  const cometFist = getCometPunchFistImg();
  if (cometFist) {
    const fw = cometFist.width;
    const fh = cometFist.height;
    ctx.drawImage(cometFist, -fw / 2, -fh / 2, fw, fh);
  } else {
    drawFrontStraightPunchFistSvg(ctx, 0, 0, 2.2, 1.0);
  }
  ctx.restore();
}

/**
 * 🥊 [유저 지시]: 주먹 축소 시 카메라 테두리 부분에 나타나는 속도선 베이스라인
 * - 카메라 뷰포트(Screen Space 560x380) 테두리(상/하/좌/우/모서리)에서 안쪽으로 뻗는 깔끔한 테이퍼드 스피드라인
 */
function drawMachCameraBorderSpeedLines(
  ctx: any,
  drawCtx: EffectDrawContext,
  frame: BattleFrame,
  intensity: number
) {
  if (intensity <= 0.05) return;
  const cw = drawCtx.width || 560;
  const ch = drawCtx.height || 380;
  const fistProg = frame.fistProg ?? (frame.effectProgress ?? 0.5);

  ctx.save();

  // 1. 카메라 변환 초기화 및 논리적 화면 좌표계(560x380) 정렬
  if (ctx.resetTransform) {
    ctx.resetTransform();
  } else {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  const scale = (ctx.canvas?.width || 420) / cw;
  ctx.scale(scale, scale);

  const baseAlpha = Math.min(1.0, intensity * 0.95);

  // [유저 지시]: 대상 포켓몬의 화면 중심점 계산 (카메라 줌 및 초점이 반영된 실제 화면상 위치)
  let targetScreenX = cw * 0.5;
  let targetScreenY = ch * 0.5 - 15;

  if (frame.cameraFocal && frame.cameraZoom) {
    const zoom = frame.cameraZoom;
    const panX = frame.cameraPan?.x || 0;
    const panY = frame.cameraPan?.y || 0;
    const isP = drawCtx.isPlayer;
    const tWorldX = drawCtx.targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
    const tWorldY = drawCtx.targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0)) - (isP ? 16 : 12);
    targetScreenX = (cw * 0.5 + panX) + (tWorldX - frame.cameraFocal.x) * zoom;
    targetScreenY = (ch * 0.5 + panY) + (tWorldY - frame.cameraFocal.y) * zoom;
  }

  // 프레임 진행도(fistProg)에 따른 미세 지터 및 길이 증감
  const jit = Math.sin(fistProg * Math.PI * 3.5) * 3;
  const lenMul = 0.90 + fistProg * 0.20;

  // 테두리 속도선 공통 헬퍼: (x0, y0) 테두리에서 대상 포켓몬(targetScreenX, targetScreenY)을 향해 뻗는 테이퍼드 라인
  const drawBorderLine = (x0: number, y0: number, len: number, width: number, aMul: number = 1.0) => {
    const alpha = baseAlpha * aMul;
    if (alpha <= 0.01) return;

    const toX = targetScreenX - x0;
    const toY = targetScreenY - y0;
    const dist = Math.hypot(toX, toY);
    if (dist < 1) return;

    const dirX = toX / dist;
    const dirY = toY / dist;

    const actualLen = Math.min(len * lenMul, dist * 0.75);
    const x1 = x0 + dirX * actualLen;
    const y1 = y0 + dirY * actualLen;

    const nx = -dirY;
    const ny = dirX;
    const halfW = width * 0.5;

    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0.00, `rgba(255, 255, 255, ${0.98 * alpha})`);
    grad.addColorStop(0.50, `rgba(240, 248, 255, ${0.75 * alpha})`);
    grad.addColorStop(1.00, "rgba(255, 255, 255, 0.0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x0 - nx * halfW, y0 - ny * halfW);
    ctx.lineTo(x0 + nx * halfW, y0 + ny * halfW);
    ctx.lineTo(x1, y1);
    ctx.closePath();
    ctx.fill();
  };

  // --------------------------------------------------------------------------
  // 1. 상단 테두리 (Top Border) - 중앙 영역 집중 (각 꼭짓점 영역 여백 확보)
  // --------------------------------------------------------------------------
  const topLines = [
    { x: cw * 0.20, len: 45, w: 3.4 },
    { x: cw * 0.32, len: 38, w: 2.8 },
    { x: cw * 0.44, len: 48, w: 3.2 },
    { x: cw * 0.56, len: 42, w: 3.0 },
    { x: cw * 0.68, len: 52, w: 3.5 },
    { x: cw * 0.80, len: 44, w: 3.1 },
  ];
  for (const l of topLines) {
    drawBorderLine(l.x + jit, 0, l.len, l.w);
  }

  // --------------------------------------------------------------------------
  // 2. 하단 테두리 (Bottom Border) - 중앙 영역 집중 (각 꼭짓점 영역 여백 확보)
  // --------------------------------------------------------------------------
  const botLines = [
    { x: cw * 0.22, len: 42, w: 3.2 },
    { x: cw * 0.34, len: 36, w: 2.6 },
    { x: cw * 0.46, len: 46, w: 3.0 },
    { x: cw * 0.58, len: 40, w: 2.8 },
    { x: cw * 0.70, len: 50, w: 3.4 },
    { x: cw * 0.80, len: 38, w: 2.9 },
  ];
  for (const l of botLines) {
    drawBorderLine(l.x - jit, ch, l.len, l.w);
  }

  // --------------------------------------------------------------------------
  // 3. 좌측 테두리 (Left Border) - 꼭짓점을 피해 중앙부 배치
  // --------------------------------------------------------------------------
  const leftLines = [
    { y: ch * 0.26, len: 46, w: 3.0 },
    { y: ch * 0.42, len: 42, w: 2.8 },
    { y: ch * 0.58, len: 45, w: 3.0 },
    { y: ch * 0.74, len: 40, w: 2.6 },
  ];
  for (const l of leftLines) {
    drawBorderLine(0, l.y + jit, l.len, l.w);
  }

  // --------------------------------------------------------------------------
  // 4. 우측 테두리 (Right Border) - 꼭짓점을 피해 중앙부 배치
  // --------------------------------------------------------------------------
  const rightLines = [
    { y: ch * 0.25, len: 48, w: 3.2 },
    { y: ch * 0.41, len: 44, w: 3.0 },
    { y: ch * 0.59, len: 48, w: 3.1 },
    { y: ch * 0.75, len: 42, w: 2.8 },
  ];
  for (const l of rightLines) {
    drawBorderLine(cw, l.y - jit, l.len, l.w);
  }

  ctx.restore();
}

/**
 * 🥊 183: 마하펀치 (Mach Punch) Front Effect
 * - Phase 2: 적 포커싱 & 주먹 작아짐 (메가톤펀치 스프라이트 기반 작아지기 잔상) + 짧은 속도선
 * - Phase 3: 최소 크기 도달 & 백색 타격 섬광 및 파티클 폭발
 */
export function drawMachPunchEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep ?? 1;
  const p = frame.effectProgress ?? 0.5;

  // 타겟 중심 좌표
  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0)) - (isP ? 16 : 12);

  const sign = isP ? 1 : -1;

  // --------------------------------------------------------------------------
  // Phase 2 (step === 2): 주먹 작아짐 (작아지기처럼 잔상을 남기며) + 카메라 속도선
  // --------------------------------------------------------------------------
  if (step === 2) {
    const shrinkProg = frame.fistProg ?? p; // 0.15 ~ 0.90
    // 주먹 크기: 대형(1.95)에서 목표 지점 근접 시 급격히 축소(0.47)
    const currentScale = 1.95 * (1.0 - shrinkProg * 0.76); // 1.95 -> 0.47

    // 날아오는 궤적 오프셋 (공격 방향에서 중심으로 쇄도)
    const curX = tx - (1.0 - shrinkProg) * 28 * sign;
    const curY = ty - (1.0 - shrinkProg) * 8;

    // 1. 카메라 테두리 속도선 (피드백 조율용 베이스라인)
    drawMachCameraBorderSpeedLines(targetCtx, drawCtx, frame, 0.70 + shrinkProg * 0.30);


    // 2. 작아지기처럼 뒤편에 남겨지는 단계별 4개 투명 잔상 (Afterimages)
    const ghostSteps = [
      { scaleMul: 1.70, alpha: 0.15, offset: -16 },
      { scaleMul: 1.45, alpha: 0.22, offset: -12 },
      { scaleMul: 1.25, alpha: 0.30, offset: -7 },
      { scaleMul: 1.10, alpha: 0.40, offset: -3 },
    ];

    targetCtx.save();
    for (let i = 0; i < ghostSteps.length; i++) {
      const g = ghostSteps[i];
      const gx = curX + g.offset * sign;
      const gy = curY + g.offset * 0.3;
      const gScale = currentScale * g.scaleMul;

      drawMegaTonFist(targetCtx, gx, gy, gScale, g.alpha);
    }

    // 3. 본체 주먹 (메가톤펀치 공식 스프라이트)
    drawMegaTonFist(targetCtx, curX, curY, currentScale, 1.0);
    targetCtx.restore();
  }

  // --------------------------------------------------------------------------
  // Phase 3 (step === 3): [유저 지시 엄수]: 순백 타격 및 바깥으로 퍼지는 알갱이들
  // --------------------------------------------------------------------------
  if (step === 3) {
    const hitProg = frame.hitProgress ?? p; // 0.10, 0.55, 0.90

    targetCtx.save();

    // 1. 임팩트 순간 최소 크기 정권 타격 유지 (frame 1)
    if (hitProg < 0.35) {
      const punchAlpha = Math.max(0, 1.0 - hitProg * 2.8);
      drawMegaTonFist(targetCtx, tx, ty, 0.40, punchAlpha);
    }

    // 2. [유저 지시 엄수]: 타격도 흰색 (Pure White Hit Burst Flash)
    drawWhiteHitBurst(targetCtx, tx, ty, hitProg);

    // 3. [유저 지시 반영]: 흰색으로 된 몸통박치기 타격시 나오는 삐죽삐죽 스타버스트 (링 없이)
    drawWhiteSharpImpactBurst(targetCtx, tx, ty, hitProg);

    // 4. [유저 지시 엄수]: 알갱이는 퍼지면서 속도가 줄어듦 > 작아지면서 사라짐
    // - 1단계 (hitProg <= 0.48): 강한 감속 곡선(Ease-Out Deceleration)으로 초반에 빠르게 퍼지다 속도가 급격히 줄어듦 (크기 100% 유지)
    // - 2단계 (hitProg > 0.48): 확산이 거의 멈춘 상태에서 급격히 축소되며(> 작아지면서) 투명하게 소산(사라짐)
    const spreadEase = 1.0 - Math.pow(1.0 - Math.min(1.0, hitProg), 2.4);

    let sizeScale = 1.0;
    let orbAlpha = 1.0;

    if (hitProg > 0.48) {
      // 2단계: 퍼짐이 둔화된 후 작아지면서 사라짐
      const shrinkT = (hitProg - 0.48) / 0.52; // 0.0 ~ 1.0
      sizeScale = Math.max(0.0, 1.0 - Math.pow(shrinkT, 1.15));
      orbAlpha = Math.max(0.0, 1.0 - Math.pow(shrinkT, 1.35));
    }

    if (orbAlpha > 0.01 && sizeScale > 0.03) {
      for (let i = 0; i < MACH_WHITE_ORBS.length; i++) {
        const orb = MACH_WHITE_ORBS[i];
        // 감속 확산 거리 (초반 고속 확산 ➔ 중반 이후 감속하여 정지)
        const dist = orb.speed * (0.28 + spreadEase * 0.82);
        const ox = tx + Math.cos(orb.angle) * dist + orb.extraJitterX * (spreadEase * 0.7 + 0.3);
        const oy = ty + Math.sin(orb.angle) * dist * orb.ySquash + orb.extraJitterY * (spreadEase * 0.7 + 0.3);

        const orbR = orb.radius * sizeScale;
        drawGlowingWhiteOrb(targetCtx, ox, oy, orbR, orbAlpha);
      }
    }

    targetCtx.restore();
  }
}

// ============================================================================
// 😈 184: 겁나는얼굴 (Scary Face)
// ============================================================================

/**
 * 5세대(BW) 공식 고증: 45x35 보라색(#A552EF) 귀면 비트맵 마스크
 * - 유저 첨부 5세대 실기 캡처 1:1 고증 (위로 치켜올라간 날카로운 눈 + 톱니형 이빨을 가진 흉측한 입)
 */
const SCARY_FACE_MASK: string[] = [
  "110000000000000000000000000000000000000000011",
  "011000000000000000000000000000000000000000010",
  "011100000000000000000000000000000000000001110",
  "011110000000000000000000000000000000000011110",
  "011111000000000000000000000000000000000111110",
  "011111000000000000000000000000000000000111110",
  "001111110000000000000000000000000000011111100",
  "001111111000000000000000000000000000111111100",
  "001111111100000000000000000000000001111111100",
  "001111111100000000000000000000000001111111100",
  "001111111110000000000000000000000011111111100",
  "000111111111100000000000000000001111111111100",
  "000111111111110000000000000000011111111111100",
  "000111111111111000000000000000011111111111000",
  "000011111111111000000000000000111111111111000",
  "000000111111111110000000000001111111111000000",
  "000000000111111111000000000111111110000000000",
  "000000000000000111000000000111100000000000000",
  "000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000",
  "000000100000000000000000000000000000000000000",
  "000000010001000000000000000000000100010000000",
  "000000011001000000000000000000000100110000000",
  "000000001101100011000111000010001101100000000",
  "000000001111110111000111100111001111100000000",
  "000000000111111111111111111111111111100000000",
  "000000000111111111111111111111111111000000000",
  "000000000111111111111111111111111111000000000",
  "000000000011111111111111111111111111000000000",
  "000000000011011111111111111111110110000000000",
  "000000000000001101111111111111110010000000000",
  "000000000000000000111111111000100000000000000",
  "000000000000000000111111111000000000000000000",
  "000000000000000000011100110000000000000000000"
];

let cachedScaryFaceFallbackCanvas: any = null;

function getFallbackScaryFaceCanvas(): any {
  if (cachedScaryFaceFallbackCanvas) return cachedScaryFaceFallbackCanvas;
  try {
    const { createCanvas } = require("@napi-rs/canvas");
    const w = 45;
    const h = 35;
    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#A552EF";
    for (let y = 0; y < h; y++) {
      const row = SCARY_FACE_MASK[y];
      for (let x = 0; x < w; x++) {
        if (row[x] === "1") {
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    cachedScaryFaceFallbackCanvas = canvas;
    return canvas;
  } catch {
    return null;
  }
}

/**
 * 겁나는얼굴(Scary Face) 메인 그래픽 렌더러
 * - 원작 5세대 완벽 고증: 선명한 바이올렛-퍼플(#A552EF) 귀면
 * - scale, alpha, glow(발광 오라), eyeOffset, mouthOffset 지원
 */
/**
 * 세로로 된 날카로운 붉은 슬릿 눈동자 (Vertical Slit Red Pupil)
 * - [유저 지시]: 마지막에 나타나는 세로형 붉은 맹수/악마 눈동자
 */
function drawVerticalSlitPupil(
  ctx: any,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha: number
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);

  // [유저 지시]: 빨간 점 글로우 및 흰 선 완전 제거, 깔끔한 순수 붉은색 세로 슬릿 렌더링
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.5);
  ctx.quadraticCurveTo(w * 0.5, 0, 0, h * 0.5);
  ctx.quadraticCurveTo(-w * 0.5, 0, 0, -h * 0.5);
  ctx.closePath();
  ctx.fillStyle = `rgba(255, 15, 30, ${1.0 * alpha})`;
  ctx.fill();

  ctx.restore();
}

/**
 * 겁나는얼굴(Scary Face) 메인 그래픽 렌더러
 * - 원작 5세대 완벽 고증: 선명한 바이올렛-퍼플(#A552EF) 귀면
 * - scale, alpha, glow(발광 오라), eyeOffset, mouthOffset 지원
 * - [유저 지시]: 마지막에 나타나는 세로형 붉은 눈동자(showRedPupils, 서로 가까운 간격)
 */
function drawScaryFaceGraphic(
  ctx: any,
  x: number,
  y: number,
  scale: number,
  alpha: number = 1.0,
  glow: number = 0.0,
  eyeOffset: number = 0.0,
  mouthOffset: number = 0.0,
  showRedPupils: boolean = false,
  redPupilAlpha: number = 1.0,
  redPupilScale: number = 1.0
) {
  if (alpha <= 0.01 || scale <= 0.02) return;
  const img = getScaryFaceImg() || getFallbackScaryFaceCanvas();
  if (!img) return;

  const w = 45;
  const h = 35;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = Math.min(1.0, alpha);

  // 1. 배후 보라색 불길 발광 글로우 (Glow)
  if (glow > 0.02) {
    const glowR = 34 * (1.0 + glow * 0.45);
    const grad = ctx.createRadialGradient(0, 0, 6, 0, 0, glowR);
    grad.addColorStop(0.00, `rgba(180, 95, 255, ${0.48 * glow * alpha})`);
    grad.addColorStop(0.50, `rgba(145, 60, 235, ${0.28 * glow * alpha})`);
    grad.addColorStop(0.85, `rgba(110, 30, 195, ${0.12 * glow * alpha})`);
    grad.addColorStop(1.00, "rgba(80, 15, 160, 0.0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, glowR, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. 본체 귀면 렌더링
  if (Math.abs(eyeOffset) < 0.1 && Math.abs(mouthOffset) < 0.1) {
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  } else {
    // 눈 영역 (h: 19)
    ctx.drawImage(img, 0, 0, w, 19, -w / 2, -h / 2 + eyeOffset, w, 19);
    // 입 영역 (y: 20..35, h: 15)
    ctx.drawImage(img, 0, 20, w, 15, -w / 2, -h / 2 + 20 + mouthOffset, w, 15);
  }

  // 3. [유저 지시]: 마지막에 나타나는 세로로 된 빨간 눈동자 (가로 살짝 두껍게)
  if (showRedPupils && redPupilAlpha > 0.01) {
    const pw = 3.4 * (redPupilScale || 1.0); // [유저 지시]: 가로 살짝 두껍게 (2.2 -> 3.4)
    const ph = 7.0 * (redPupilScale || 1.0);
    const pAlpha = redPupilAlpha;
    const pupilDistX = 11.5;
    const pupilY = -4.5;
    // 좌측 눈동자
    drawVerticalSlitPupil(ctx, -pupilDistX, pupilY + eyeOffset, pw, ph, pAlpha);
    // 우측 눈동자
    drawVerticalSlitPupil(ctx, pupilDistX, pupilY + eyeOffset, pw, ph, pAlpha);
  }

  ctx.restore();
}

/**
 * 😈 184: 겁나는얼굴 (Scary Face) Behind Effect
 * - 전장 배경 어두운 암전 오버레이 (포켓몬 스프라이트 뒤편에 깔려 대상을 더욱 선명하게 부각)
 */
export function drawScaryFaceBehindEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const dimAlpha = frame.dimAlpha ?? 0.0;
  if (dimAlpha <= 0.01) return;

  targetCtx.save();
  targetCtx.globalAlpha = Math.min(1.0, dimAlpha);
  targetCtx.fillStyle = "rgba(6, 4, 14, 0.86)";
  targetCtx.fillRect(-6000, -6000, 14000, 14000);
  targetCtx.restore();
}

/**
 * 😈 184: 겁나는얼굴 (Scary Face) Front Effect
 * - 대상 포켓몬 전면에 나타나는 거대한 보라색 귀면(Scary Face)
 * - Step 2: 전장 암전 속에서 보라색 귀면 점멸 출현
 * - Step 3: 귀면의 위협적 펄스 & 전방 덮침 팽창 (Looming & Surge) + 보라색 잔상 + 세로형 붉은 눈동자 개안
 * - Step 4: 귀면 소산 페이드아웃
 */
export function drawScaryFaceEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { attackerPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep ?? 2;
  const p = frame.effectProgress ?? 0.5;

  // [유저 지시 엄수]: 시전 포켓몬(Attacker) 안면/머리 위 안착
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));
  const cx = ax;
  const cy = ay - (isP ? 54 : 40);

  const scale = frame.faceScale ?? 1.85;
  const alpha = frame.faceAlpha ?? (frame.showEffect ? 1.0 : 0.0);
  const glow = frame.faceGlow ?? 0.0;
  const eyeOffset = frame.faceEyeOffset ?? 0.0;
  const mouthOffset = frame.faceMouthOffset ?? 0.0;
  const jitterX = frame.faceJitX ?? 0.0;
  const jitterY = frame.faceJitY ?? 0.0;

  const showRedPupils = frame.showRedPupils ?? false;
  const redPupilAlpha = frame.redPupilAlpha ?? 1.0;
  const redPupilScale = frame.redPupilScale ?? 1.0;

  if (alpha <= 0.01) return;

  targetCtx.save();

  // 1. [Step 3 급속 팽창 시]: 순간적으로 퍼져나가는 보라색 외곽 충격파 잔상
  if (frame.faceAfterimage) {
    const afterScale = scale * 1.28;
    const afterAlpha = alpha * 0.32;
    drawScaryFaceGraphic(
      targetCtx,
      cx + jitterX,
      cy + jitterY,
      afterScale,
      afterAlpha,
      0.0,
      eyeOffset * 1.3,
      mouthOffset * 1.3,
      false
    );
  }

  // 2. 메인 보라색 귀면 본체 렌더링 (+ 세로 붉은 눈동자)
  drawScaryFaceGraphic(
    targetCtx,
    cx + jitterX,
    cy + jitterY,
    scale,
    alpha,
    glow,
    eyeOffset,
    mouthOffset,
    showRedPupils,
    redPupilAlpha,
    redPupilScale
  );

  targetCtx.restore();
}

