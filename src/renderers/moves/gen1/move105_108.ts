// ============================================================================
// ⚠️ [개발 지침 - AI 필독]
// 1. 256색 팔레트 최적화 (Octree Optimizer) 기준: 고채도 비비드 단색 및 3~4단계 톤 대비.
// 2. 프레임별 이미지 추출/조회 루프 금지 (유저는 웹 뷰어 http://localhost:3456 에서 직접 확인).
// 3. 시전자 모션 기승전결(모으기 ➔ 돌진/방출 ➔ 타격 ➔ 복귀)을 지킬 것.
// ============================================================================

import { createCanvas } from "@napi-rs/canvas";
import { drawFittedBattleSprite, getFittedBattleSpriteBounds } from "../../common/spriteLoader.js";
import { drawStatBoostEffect, drawStatDropEffect, drawMiniRetroStar } from "../common/helpers.js";

// ============================================================================
// 105: HP회복 (Recover)
// ============================================================================

/**
 * AAFF00 외곽 + DEFF99 안쪽의 2중 반투명 원
 * - 안쪽은 반투명, 바깥쪽은 투명한 라디얼 그라데이션 특성 적용
 */
function drawSoftHealingCircle(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  innerAlpha: number = 0.65
) {
  if (radius <= 0 || innerAlpha <= 0) return;
  ctx.save();

  // 1. 외곽 AAFF00 원 (안쪽: 반투명 -> 바깥쪽: 투명)
  const outerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  outerGrad.addColorStop(0, `rgba(170, 255, 0, ${innerAlpha})`);
  outerGrad.addColorStop(0.55, `rgba(170, 255, 0, ${innerAlpha * 0.45})`);
  outerGrad.addColorStop(1, "rgba(170, 255, 0, 0)");
  ctx.fillStyle = outerGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // 2. 안쪽 DEFF99 원 (동일 특성: 안쪽 반투명 -> 바깥쪽 투명)
  const innerR = radius * 0.55;
  const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR);
  innerGrad.addColorStop(0, `rgba(222, 255, 153, ${innerAlpha * 0.90})`);
  innerGrad.addColorStop(0.60, `rgba(222, 255, 153, ${innerAlpha * 0.40})`);
  innerGrad.addColorStop(1, "rgba(222, 255, 153, 0)");
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 부드러운 광학 발광 빔 (Optical Glow Flare Beam)
 * - 동그라미 색상(AAFF00 외곽 + DEFF99 안쪽) 반영:
 *   하드 엣지 없이 중심(화이트/DEFF99)에서 끝단(AAFF00)으로 부드럽게 감쇠되는 빛줄기 연출
 */
function drawGlowBeam(
  ctx: any,
  cx: number,
  cy: number,
  length: number,
  width: number,
  angleRad: number,
  alpha: number
) {
  if (alpha <= 0.01 || length <= 0 || width <= 0) return;
  ctx.save();
  ctx.translate(cx, cy);
  if (angleRad !== 0) {
    ctx.rotate(angleRad);
  }

  // 1. 넓고 몽환적인 외곽 AAFF00 연두 글로우 (Outer Healing Bloom)
  ctx.save();
  ctx.scale(length * 1.15, width * 2.1);
  const outerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  outerGrad.addColorStop(0, `rgba(170, 255, 0, ${alpha * 0.40})`);
  outerGrad.addColorStop(0.50, `rgba(170, 255, 0, ${alpha * 0.18})`);
  outerGrad.addColorStop(1, "rgba(170, 255, 0, 0)");
  ctx.fillStyle = outerGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. 중간 메인 광선 (Mid DEFF99 -> AAFF00 Beam)
  ctx.save();
  ctx.scale(length, width);
  const midGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  midGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.95})`);
  midGrad.addColorStop(0.28, `rgba(222, 255, 153, ${alpha * 0.85})`);
  midGrad.addColorStop(0.65, `rgba(170, 255, 0, ${alpha * 0.48})`);
  midGrad.addColorStop(0.92, `rgba(170, 255, 0, ${alpha * 0.10})`);
  midGrad.addColorStop(1, "rgba(170, 255, 0, 0)");
  ctx.fillStyle = midGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. 중심부 초고휘도 코어 빔 (Core White/DEFF99 Needle)
  ctx.save();
  ctx.scale(length * 0.78, Math.max(1.0, width * 0.35));
  const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  coreGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 1.0})`);
  coreGrad.addColorStop(0.45, `rgba(222, 255, 153, ${alpha * 0.90})`);
  coreGrad.addColorStop(1, "rgba(222, 255, 153, 0)");
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * 치유 링 & 4방향 십자 스타 글로우 엠블럼 (Recover Glowing Emblem)
 * - 동그라미 색상(AAFF00 외곽 + DEFF99 안쪽) 반영:
 *   1) 외곽 원형 치유 링 (AAFF00 외곽 글로우 + DEFF99 선명한 림)
 *   2) 4방향 십자형 광학 발광 빔 (하드 엣지 없이 부드러운 렌즈 플레어)
 *   3) 대각선 다이아몬드 코어 글로우 & 중심부 화이트 핫스팟
 */
export function drawRecoveryEmblem(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || size <= 0) return;
  ctx.save();

  // 1. 은은한 AAFF00/DEFF99 외곽 블룸 (Ambient Bloom)
  const bloomR = size * 1.25;
  const bloomGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, bloomR);
  bloomGrad.addColorStop(0, `rgba(222, 255, 153, ${alpha * 0.45})`);
  bloomGrad.addColorStop(0.50, `rgba(170, 255, 0, ${alpha * 0.24})`);
  bloomGrad.addColorStop(1, "rgba(170, 255, 0, 0)");
  ctx.fillStyle = bloomGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, bloomR, 0, Math.PI * 2);
  ctx.fill();

  // 2. 외곽 원형 치유 링 (은은하고 차분한 반투명 광학 링)
  // 피크 밝기를 낮추고 백색 대신 DEFF99/AAFF00의 부드러운 반투명 글로우로 차분하게 연출
  const ringR = size * 0.52;
  const rOuter = ringR + size * 0.20;
  const rInner = Math.max(1, ringR - size * 0.18);
  const peakT = ringR / rOuter;
  const innerT = rInner / rOuter;

  const ringGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rOuter);
  // 안쪽 홀: 완전 투명
  ringGrad.addColorStop(0, "rgba(170, 255, 0, 0)");
  ringGrad.addColorStop(innerT * 0.70, "rgba(170, 255, 0, 0)");
  // 안쪽 림 부드러운 반투명 글로우
  ringGrad.addColorStop(innerT + (peakT - innerT) * 0.45, `rgba(170, 255, 0, ${alpha * 0.16})`);
  // 피크 궤도 (ringR): 은은하고 차분한 DEFF99 반투명 림 (백색 제거, alpha * 0.38)
  ringGrad.addColorStop(peakT, `rgba(222, 255, 153, ${alpha * 0.38})`);
  // 바깥쪽 림 글로우
  ringGrad.addColorStop(peakT + (1.0 - peakT) * 0.45, `rgba(170, 255, 0, ${alpha * 0.16})`);
  ringGrad.addColorStop(1.0, "rgba(170, 255, 0, 0)");

  ctx.fillStyle = ringGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
  ctx.fill();

  // 3. 중심부 대각선 다이아몬드 글로우 (Soft Diamond Core Fill)
  // 십자선 중심 교차부의 부드러운 다이아몬드 형상 연결
  const diagLen = size * 0.38;
  const diagWidth = Math.max(2.0, size * 0.16);
  drawGlowBeam(ctx, cx, cy, diagLen, diagWidth, Math.PI / 4, alpha * 0.70);
  drawGlowBeam(ctx, cx, cy, diagLen, diagWidth, -Math.PI / 4, alpha * 0.70);

  // 4. 4방향 십자형 메인 광학 발광 빔 (Cross Flare Glow Beams)
  // 링을 뚫고 바깥으로 뻗어나가는 수평 & 수직 빛줄기
  const rayLen = size;
  const rayWidth = Math.max(2.8, size * 0.22);
  drawGlowBeam(ctx, cx, cy, rayLen, rayWidth, 0, alpha);             // 수평선 (좌우)
  drawGlowBeam(ctx, cx, cy, rayLen, rayWidth, Math.PI / 2, alpha);   // 수직선 (상하)

  // 5. 중심부 퓨어 화이트 핫스팟 (Pure White Core Hotspot)
  const coreR = Math.max(2.5, size * 0.20);
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
  coreGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 1.0})`);
  coreGrad.addColorStop(0.45, `rgba(222, 255, 153, ${alpha * 0.90})`);
  coreGrad.addColorStop(1, "rgba(170, 255, 0, 0)");
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 105: HP회복 (Recover) 전용 렌더러
 * - Step 1: AAFF00 외곽 + DEFF99 안쪽 2중 반투명 원 8개가 2개씩 순차 생성 & 쫀득하게 포켓몬 몸체로 흡수
 * - Step 2: 흡수 완료 후 황금빛 힐링 엠블럼이 아래에서 위로 올라가며 투명해지며 소멸
 */
export function drawRecoverEffect(
  ctx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  let p = 0.5;
  let ax = 200;
  let ay = 300;
  let isP = true;
  let step = 1;

  if (attackerPosOrFrame && typeof attackerPosOrFrame.x === "number") {
    ax = attackerPosOrFrame.x;
    ay = attackerPosOrFrame.y;
    p = Math.min(1.0, Math.max(0.0, progress ?? 0.5));
    isP = Boolean(isPlayer);
    step = moveStep ?? 1;
  } else {
    const frame = attackerPosOrFrame || {};
    const drawCtx = targetPosOrDrawCtx || {};
    const aPos = drawCtx.attackerPos || { x: 200, y: 300 };
    ax = aPos.x;
    ay = aPos.y;
    p = Math.min(1.0, Math.max(0.0, frame.effectProgress ?? 0.5));
    isP = Boolean(drawCtx.isPlayer);
    step = frame.moveStep ?? (moveStep ?? 1);
  }

  ctx.save();

  const bodyCenterY = ay - (isP ? 10 : 8);

  // [Step 1: 8개 원 순차 생성 & 쫀득한 흡수 연출]
  if (step === 1) {
    // 4개 페어 (총 8개 원): 2개가 생기고 다음 2개가 생길 때 이전 2개는 시전 포켓몬으로 서서히 흡수
    const GREEN_CIRCLES_PAIRS = [
      // Pair 1 (0.00~): 대각 상좌 & 하우 -> Pair 2 생기는 0.20부터 흡수 시작
      { dx: -42, dy: -38, r: 13, spawnT: 0.00, absorbStartT: 0.20 },
      { dx:  38, dy:  28, r: 14, spawnT: 0.00, absorbStartT: 0.20 },

      // Pair 2 (0.20~): 대각 상우 & 하좌 -> Pair 3 생기는 0.40부터 흡수 시작
      { dx:  20, dy: -44, r: 14, spawnT: 0.20, absorbStartT: 0.40 },
      { dx: -34, dy:  26, r: 13, spawnT: 0.20, absorbStartT: 0.40 },

      // Pair 3 (0.40~): 외곽 좌 & 외곽 우 -> Pair 4 생기는 0.60부터 흡수 시작
      { dx: -52, dy:  -8, r: 12, spawnT: 0.40, absorbStartT: 0.60 },
      { dx:  50, dy: -12, r: 14, spawnT: 0.40, absorbStartT: 0.60 },

      // Pair 4 (0.60~): 몸체 근처 내측 좌 & 내측 우 -> 0.76부터 흡수 시작
      { dx: -16, dy: -22, r: 15, spawnT: 0.60, absorbStartT: 0.76 },
      { dx:  18, dy:  14, r: 13, spawnT: 0.60, absorbStartT: 0.76 },
    ];

    const BLOOM_DURATION = 0.16; // 생성 후 피어나는 시간
    const ABSORB_DURATION = 0.20; // 몸체로 빨려들어가며 흡수되는 시간

    // 1. 포켓몬 체표면 흡수 발광 (흡수가 시작되면 체표면/봉오리가 따스한 연둣빛으로 빛남)
    if (p >= 0.22) {
      const bodyGlowAlpha = Math.min(0.42, (p - 0.22) * 0.7) * (1.0 - Math.max(0, (p - 0.92) / 0.08));
      if (bodyGlowAlpha > 0.02) {
        const bGrad = ctx.createRadialGradient(ax, bodyCenterY, 0, ax, bodyCenterY, 28);
        bGrad.addColorStop(0, `rgba(222, 255, 153, ${bodyGlowAlpha * 0.75})`);
        bGrad.addColorStop(0.5, `rgba(170, 255, 0, ${bodyGlowAlpha * 0.45})`);
        bGrad.addColorStop(1, "rgba(170, 255, 0, 0)");
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.arc(ax, bodyCenterY, 28, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. 각 원들의 생성 및 순차적 흡수 연출
    for (let i = 0; i < GREEN_CIRCLES_PAIRS.length; i++) {
      const c = GREEN_CIRCLES_PAIRS[i];
      if (p < c.spawnT) continue; // 아직 생성 전

      const startX = ax + c.dx;
      const startY = bodyCenterY + c.dy;

      // A. 아직 흡수 전: 생성 위치에서 서서히 피어나며 부유
      if (p < c.absorbStartT) {
        const bloomRelT = Math.min(1.0, (p - c.spawnT) / BLOOM_DURATION);
        const easeAlpha = Math.sin(bloomRelT * Math.PI * 0.5);
        const curRadius = c.r * (0.60 + 0.40 * easeAlpha);

        const floatY = Math.sin((p * Math.PI * 2) + i * 1.1) * 2.5;
        drawSoftHealingCircle(ctx, startX, startY + floatY, curRadius, 0.70 * easeAlpha);
      }
      // B. 다음 2개가 생길 때: 이전 2개가 쫀득하게 늘어지면서 시전 포켓몬으로 흡수!
      else {
        const absorbRelT = (p - c.absorbStartT) / ABSORB_DURATION;
        if (absorbRelT >= 1.0) continue; // 흡수 완료 후 소멸

        // 목표 지점 (시전 포켓몬 몸체) 및 진행 벡터 각도
        const targetX = ax + c.dx * 0.10;
        const targetY = bodyCenterY + c.dy * 0.10;
        const vx = targetX - startX;
        const vy = targetY - startY;
        const angleToTarget = Math.atan2(vy, vx);

        // 중심으로 가속 이동
        const moveEase = Math.pow(absorbRelT, 1.45);
        const curX = startX + vx * moveEase;
        const curY = startY + vy * moveEase;

        // 쫀득한 탄성 신장 공식
        let stretch = 1.0;
        if (absorbRelT < 0.68) {
          stretch = 1.0 + Math.pow(absorbRelT / 0.68, 1.3) * 2.2;
        } else {
          const endT = (absorbRelT - 0.68) / 0.32;
          stretch = Math.max(0.6, (1.0 + 2.2) * (1.0 - endT * 0.75));
        }

        // 안쪽으로 들어가면 들어갈수록 점진적으로 투명해짐
        const fadeAlpha = Math.max(0, Math.pow(1.0 - absorbRelT, 1.15));

        const sx = stretch;
        const sy = Math.max(0.45, 1.0 / Math.sqrt(Math.max(1.0, stretch * 0.85)));

        ctx.save();
        ctx.translate(curX, curY);
        ctx.rotate(angleToTarget);
        ctx.scale(sx, sy);
        drawSoftHealingCircle(ctx, 0, 0, c.r, 0.70 * fadeAlpha);
        ctx.restore();
      }
    }
  }
  // [Step 2: 흡수 완료 이후 여러 회복별이 시계방향으로 나선 상승하며 투명해져 소멸]
  else if (step === 2) {
    drawRecoveryStarSpiral(ctx, ax, bodyCenterY, p);
  }

  ctx.restore();
}

/**
 * 🌟 HP 회복 나선 상승 별 & 포켓몬 체표면 치유 광채 (Recover Step 2 Spiral)
 * - 1시 방향 발밑 출현 -> 330도 시계방향 선회 -> 12시 상공 승화
 * - 회복 엠블럼 (drawRecoveryEmblem) 4개 순차 출현
 */
export function drawRecoveryStarSpiral(
  ctx: any,
  ax: number,
  bodyCenterY: number,
  p: number
) {
  // 1. 포켓몬 체표면 잔여 치유 광채 (차분히 페이드아웃)
  const bodyGlowAlpha = Math.max(0, (1.0 - p) * 0.32);
  if (bodyGlowAlpha > 0.02) {
    ctx.save();
    const bGrad = ctx.createRadialGradient(ax, bodyCenterY, 0, ax, bodyCenterY, 28);
    bGrad.addColorStop(0, `rgba(222, 255, 153, ${bodyGlowAlpha * 0.75})`);
    bGrad.addColorStop(0.5, `rgba(170, 255, 0, ${bodyGlowAlpha * 0.45})`);
    bGrad.addColorStop(1, "rgba(170, 255, 0, 0)");
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.arc(ax, bodyCenterY, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. 4개의 회복별 구성 (1시 방향 출현 ➔ 시계방향 선회 ➔ 12시 방향 상공 승화)
  const RECOVERY_STARS = [
    { spawnT: 0.00, duration: 0.54, size: 22, rx: 44, ry: 16 },
    { spawnT: 0.16, duration: 0.54, size: 20, rx: 42, ry: 15 },
    { spawnT: 0.32, duration: 0.54, size: 23, rx: 45, ry: 16 },
    { spawnT: 0.48, duration: 0.54, size: 21, rx: 43, ry: 15 },
  ];

  const startY = bodyCenterY + 16;
  const endY = bodyCenterY - 48;
  const startAngle = Math.PI / 6; // 30도 (1시 방향)
  const totalRot = (11 * Math.PI) / 6; // 330도 회전 (12시 방향 완주)

  // 활성 상태의 별들을 Z축 깊이(후면 -> 전면) 순으로 정렬하여 입체적으로 렌더링
  const activeStars: any[] = [];
  for (let i = 0; i < RECOVERY_STARS.length; i++) {
    const s = RECOVERY_STARS[i];
    if (p < s.spawnT) continue; // 아직 생성 전 (1개씩 단독 순차 출현)
    const relT = (p - s.spawnT) / s.duration;
    if (relT >= 1.0) continue; // 소멸

    // A. 아래에서 위로 올라가는 높이 (완만한 가속 상승)
    const yBase = startY + (endY - startY) * Math.pow(relT, 1.3);

    // B. 시계방향 회전 각도 (1시 ➔ 12시)
    const phi = startAngle + relT * totalRot;

    // C. 생성 직후 발밑에서 부드럽게 반경이 피어남
    const bloomRadius = Math.min(1.0, relT / 0.15);
    const curRx = s.rx * bloomRadius;
    const curRy = s.ry * bloomRadius;

    // D. 시계방향 3D 타원 궤도:
    const offsetX = Math.sin(phi) * curRx;
    const depthY = -Math.cos(phi) * curRy;

    // E. Z축 입체 깊이감: 전면일 때 크기와 선명도 미세 증가
    const depthRatio = curRy > 0 ? (depthY / curRy) : 0; // -1.0(후면) ~ +1.0(전면)
    const curSize = s.size * (1.0 + depthRatio * 0.10);

    // F. 투명도: 발밑 생성 시 페이드인(0~0.15) ➔ 상공으로 올라가며 점차 투명해져 0으로 소멸(0.15~1.0)
    let starAlpha = 1.0;
    if (relT < 0.15) {
      starAlpha = relT / 0.15;
    } else {
      starAlpha = Math.max(0, 1.0 - (relT - 0.15) / 0.85);
    }
    starAlpha *= (0.88 + 0.12 * depthRatio);

    activeStars.push({
      x: ax + offsetX,
      y: yBase + depthY,
      size: curSize,
      alpha: starAlpha,
      depthRatio,
    });
  }

  // Z축 깊이 순(후면 -> 전면) 정렬 후 렌더링
  activeStars.sort((a, b) => a.depthRatio - b.depthRatio);
  for (const star of activeStars) {
    drawRecoveryEmblem(ctx, star.x, star.y, star.size, star.alpha);
  }
}

// ============================================================================
// 106: 단단해지기 (Harden)
// ============================================================================

let hardenMaskCanvas: any = null;
let hardenMaskCtx: any = null;
let hardenStripeCanvas: any = null;
let hardenStripeCtx: any = null;

function getHardenBuffers(s: number) {
  if (!hardenMaskCanvas || hardenMaskCanvas.width !== s || hardenMaskCanvas.height !== s) {
    hardenMaskCanvas = createCanvas(s, s);
    hardenMaskCtx = hardenMaskCanvas.getContext("2d");
  }
  if (!hardenStripeCanvas || hardenStripeCanvas.width !== s || hardenStripeCanvas.height !== s) {
    hardenStripeCanvas = createCanvas(s, s);
    hardenStripeCtx = hardenStripeCanvas.getContext("2d");
  }
  return {
    maskCanvas: hardenMaskCanvas,
    maskCtx: hardenMaskCtx,
    stripeCanvas: hardenStripeCanvas,
    stripeCtx: hardenStripeCtx,
  };
}

/**
 * 금속 광택 반사 사선 스트라이프 (Sprite-Masked Metallic Sheen Stripe)
 * - 시전 포켓몬의 스프라이트 실루엣(알파 채널)에만 정확히 100% 마스킹
 * - 좌상단 모서리에서 시작하여 우하단 모서리로 완벽하게 가로지르는 사선(-42°) 단색 순백 스트라이프
 * - Skia 변환 좌표계 source-in 클리핑 버그 방지를 위해 독립 stripeCanvas 합성 적용
 */
function drawMaskedMetallicStripe(
  targetCtx: any,
  sprite: any,
  cx: number,
  groundY: number,
  size: number,
  shiftRatio: number // -0.28 (좌상단) ~ +0.28 (우하단)
) {
  const bounds = getFittedBattleSpriteBounds(sprite, size);
  const actualW = bounds.drawW;
  const actualH = bounds.drawH;
  const refDim = Math.max(actualW, actualH);

  const s = Math.max(Math.ceil(size * 1.5), 256);
  const { maskCanvas, maskCtx, stripeCanvas, stripeCtx } = getHardenBuffers(s);
  const midX = s / 2;
  const bottomY = s - 10;
  // 실제 포켓몬 스프라이트의 수직 중심
  const spriteCenterY = bottomY - actualH / 2;

  maskCtx.clearRect(0, 0, s, s);
  stripeCtx.clearRect(0, 0, s, s);

  if (sprite) {
    // 1. 스트라이프 전용 버퍼에 단색 순백 사선 스트라이프 렌더링 (메인 + 좌상단 보조 얇은 스트라이프)
    const angle = -Math.PI * 0.23;
    const shift = shiftRatio * refDim;
    const W = Math.max(8, Math.round(refDim * 0.16)); // 메인 굵은 스트라이프 폭 (약 9~13px)
    const H = W / 2;
    const L = refDim * 2.6; // 실루엣 전체를 완전히 가로지르는 길이

    // 좌상단 보조 얇은 스트라이프 규격 (유저 요청: 스트라이프 왼쪽 위에 얇은 스트라이프 하나 더)
    const W_thin = Math.max(2, Math.round(W * 0.25)); // 약 2~3px
    const gap = Math.max(3, Math.round(W * 0.35));   // 약 4~5px
    const thinShift = shift - H - gap - W_thin / 2;

    stripeCtx.save();
    stripeCtx.translate(midX, spriteCenterY);
    stripeCtx.rotate(angle);
    stripeCtx.fillStyle = "#FFFFFF";
    // 메인 스트라이프
    stripeCtx.fillRect(-L / 2, shift - H, L, W);
    // 좌상단 얇은 스트라이프
    stripeCtx.fillRect(-L / 2, thinShift - W_thin / 2, L, W_thin);
    stripeCtx.restore();

    // 2. 포켓몬 실루엣을 마스크 버퍼에 렌더링
    maskCtx.save();
    drawFittedBattleSprite(maskCtx, sprite, midX, bottomY, size);
    // 3. 변환이 제거된 1:1 drawImage로 source-in 합성 (좌표 클리핑 버그 원천 차단)
    maskCtx.globalCompositeOperation = "source-in";
    maskCtx.drawImage(stripeCanvas, 0, 0);
    maskCtx.restore();

    // 4. 메인 캔버스에 마스킹된 스트라이프 합성
    targetCtx.save();
    targetCtx.drawImage(maskCanvas, cx - midX, groundY - bottomY);
    targetCtx.restore();
  } else {
    // 스프라이트가 없는 경우 몸체 타원 클리핑 대체
    targetCtx.save();
    targetCtx.beginPath();
    targetCtx.ellipse(cx, groundY - actualH / 2, actualW / 2, actualH / 2, 0, 0, Math.PI * 2);
    targetCtx.clip();

    const angle = -Math.PI * 0.23;
    targetCtx.translate(cx, groundY - actualH / 2);
    targetCtx.rotate(angle);

    const shift = shiftRatio * refDim;
    const W = Math.max(8, Math.round(refDim * 0.16));
    const H = W / 2;
    const L = refDim * 2.6;

    const W_thin = Math.max(2, Math.round(W * 0.25));
    const gap = Math.max(3, Math.round(W * 0.35));
    const thinShift = shift - H - gap - W_thin / 2;

    targetCtx.fillStyle = "#FFFFFF";
    targetCtx.fillRect(-L / 2, shift - H, L, W);
    targetCtx.fillRect(-L / 2, thinShift - W_thin / 2, L, W_thin);
    targetCtx.restore();
  }
}

/**
 * 십자선 메탈릭 반짝임 (Mathematically Symmetric Single-Path Crosshair Glint)
 * - 픽셀 그리드 정수 스냅(Integer Snap) 및 단일 닫힌 8각 다각형으로 상하/좌우 오차 0px 완벽 대칭 보장
 * - 다중 경로 중첩 시 발생하는 서브픽셀 감마 래스터 왜곡(미세한 어긋남/기울어짐) 원천 차단
 */
function drawCrossStarSparkle(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  color: string = "#FFFFFF"
) {
  ctx.save();
  ctx.fillStyle = color;

  const intCx = Math.round(cx);
  const intCy = Math.round(cy);
  const half = Math.round(size / 2);
  const pinch = Math.max(1.2, Math.round(size * 0.08 * 10) / 10);

  // 단일 닫힌 대칭 십자선 다각형 (100% 좌우/상하 거울 대칭)
  ctx.beginPath();
  ctx.moveTo(intCx, intCy - half);
  ctx.lineTo(intCx + pinch, intCy - pinch);
  ctx.lineTo(intCx + half, intCy);
  ctx.lineTo(intCx + pinch, intCy + pinch);
  ctx.lineTo(intCx, intCy + half);
  ctx.lineTo(intCx - pinch, intCy + pinch);
  ctx.lineTo(intCx - half, intCy);
  ctx.lineTo(intCx - pinch, intCy - pinch);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 단단해지기 시전 포켓몬 오른쪽 반짝임 (Sparkle at the right of caster sprite)
 * - 이동하는 스트라이프와 완전히 별개로 시전 포켓몬 스프라이트 오른쪽에 표시
 * - 정수 픽셀 정렬을 통한 완벽한 대칭 십자선 표출
 */
function drawHardenSparkle(
  targetCtx: any,
  sprite: any,
  cx: number,
  groundY: number,
  size: number,
  p: number
) {
  const bounds = getFittedBattleSpriteBounds(sprite, size);
  const actualW = bounds.drawW;
  const actualH = bounds.drawH;
  const refDim = Math.max(actualW, actualH);

  // 시전 포켓몬 스프라이트 오른쪽 외곽 (정수 픽셀 스냅 적용)
  const starX = Math.round(cx + actualW * 0.46);
  const starY = Math.round((groundY - actualH) + actualH * 0.04);

  // 스위프 진행(p: 0 -> 1)에 맞춰 중앙 통과 시 가장 선명하게 빛나는 순백 십자선 (Cross Glint)
  const starPulse = 0.85 + 0.35 * Math.sin(p * Math.PI);
  const starSize = Math.max(12, Math.round(refDim * 0.14 * starPulse));

  drawCrossStarSparkle(targetCtx, starX, starY, starSize, "#FFFFFF");
}

/**
 * 106: 단단해지기 (Harden) 전용 렌더러
 * - 시전자 포켓몬이 슬레이트 그레이(회색) 필터로 변함
 * - 실기 레퍼런스 일치: 포켓몬 체표면에 마스킹된 대각선 흰색 금속 반사 스트라이프가 3회 통과
 * - 유저 요청: 반짝거림 없이 단색 순백 스트라이프가 좌상단에서 우하단으로 시원하게 스위프
 */
export function drawHardenEffect(
  ctx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  let step = 1;
  let p = 0.5;
  let ax = 200;
  let ay = 300;
  let isP = true;
  let casterSprite: any = null;
  let casterSize = 140;
  let groundY = 300;

  if (attackerPosOrFrame && typeof attackerPosOrFrame.x === "number") {
    ax = attackerPosOrFrame.x;
    ay = attackerPosOrFrame.y;
    step = moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, progress ?? 0.5));
    isP = Boolean(isPlayer);
    casterSize = isP ? 140 : 110;
    groundY = ay + (isP ? 20 : 15);
  } else {
    const frame = attackerPosOrFrame || {};
    const drawCtx = targetPosOrDrawCtx || {};
    isP = Boolean(drawCtx.isPlayer);
    casterSprite = isP ? drawCtx.playerSprite : drawCtx.enemySprite;
    casterSize = isP ? (drawCtx?.pm?.size || 140) : (drawCtx?.em?.size || 110);
    const cPos = drawCtx.casterPos || drawCtx.attackerPos || { x: 200, y: 300 };
    ax = cPos.x;
    ay = cPos.y;
    const casterOffset = isP ? (frame.pOffset ?? { x: 0, y: 0 }) : (frame.eOffset ?? { x: 0, y: 0 });
    const baseGroundY = isP ? (drawCtx?.pm?.y ?? (ay + 36)) : (drawCtx?.em?.y ?? (ay + 36));
    groundY = baseGroundY + casterOffset.y;
    step = frame.moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, frame.effectProgress ?? 0.5));
  }

  ctx.save();

  // Step 2, 3, 4: [1차, 2차, 3차 단색 순백 스트라이프 스위프 - 좌상단에서 우하단으로 완주]
  if (step === 2 || step === 3 || step === 4) {
    const shiftRatio = -0.28 + p * 0.56;
    // 1. 시전 포켓몬 몸체에 마스킹된 대각선 듀얼 스트라이프
    drawMaskedMetallicStripe(ctx, casterSprite, ax, groundY, casterSize, shiftRatio);
    // 2. 스트라이프와 별개로 시전 포켓몬 스프라이트 오른쪽에 표시되는 반짝임
    drawHardenSparkle(ctx, casterSprite, ax, groundY, casterSize, p);
  }

  ctx.restore();
}

// ============================================================================
// 107: 작아지기 (Minimize)
// ============================================================================

/**
 * 107: 작아지기 (Minimize) 전용 전면 렌더러
 * - 노말 / 변화 (자신의 회피율 2랭크 상승)
 *
 * 유저 요청: 번잡한 이펙트(연기 링, 별 스파클, 바람선 등) 전부 제거.
 * 스프라이트 본체 축소 및 후방 투명 잔상만으로 깔끔하게 연출.
 */
export function drawMinimizeEffect(
  _ctx: any,
  _attackerPosOrFrame?: any,
  _targetPosOrDrawCtx?: any,
  _moveStep?: number,
  _progress?: number,
  _isPlayer?: boolean
) {
  // All decorative canvas clutter removed per user request.
}

/**
 * 107: 작아지기 (Minimize) 후방 잔상 렌더러
 * - 유저 요청: "작아질 때 투명한 잔상 (5개의 투명한) 남기면서 작아지기"
 * - 시전자 포켓몬이 축소될 때 뒤편에 단계별로 남겨지는 5개의 투명한 잔상(Afterimages)을 렌더링.
 */
export function drawMinimizeBehindEffect(
  ctx: any,
  frame: any,
  drawCtx: any
) {
  const afterimages = frame?.afterimages;
  if (!afterimages || !Array.isArray(afterimages) || afterimages.length === 0) return;

  const isPlayer = drawCtx?.isPlayer ?? true;
  const casterSprite = isPlayer ? drawCtx?.playerSprite : drawCtx?.enemySprite;
  if (!casterSprite) return;

  const basePos = isPlayer ? drawCtx?.pm : drawCtx?.em;
  if (!basePos) return;

  const casterSize = basePos.size || (isPlayer ? 140 : 110);
  const casterX = basePos.x;
  const casterY = basePos.y;
  const battlerAlpha = isPlayer ? (drawCtx?.pAlpha ?? 1.0) : (drawCtx?.eAlpha ?? 1.0);

  ctx.save();
  for (const ghost of afterimages) {
    if (!ghost || ghost.alpha <= 0.01 || ghost.scale <= 0.01) continue;

    ctx.save();
    ctx.globalAlpha = Math.min(1.0, Math.max(0.0, ghost.alpha * battlerAlpha));
    ctx.translate(casterX, casterY);
    ctx.scale(ghost.scale, ghost.scale);
    drawFittedBattleSprite(ctx, casterSprite, 0, 0, casterSize);
    ctx.restore();
  }
  ctx.restore();
}

// ============================================================================
// 108: 연막 (Smokescreen)
// ============================================================================

/**
 * 부드러운 연기 퍼프 (안쪽: 반투명, 바깥쪽: 완전 투명 라디얼 그라데이션)
 * - 유저 요청: "연기 바깥쪽 투명 안쪽 반투명형태"
 * - 하드 엣지 없이 중심에서 외곽으로 완벽히 투명해지는 라디얼 그라데이션 적용
 */
function drawSoftSmokePuff(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  innerAlpha: number = 0.60,
  tint: "dark" | "mid" | "light" = "mid"
) {
  if (radius <= 1 || innerAlpha <= 0.01) return;
  ctx.save();

  // 바깥쪽: 완전 투명 (0.0), 안쪽: 반투명 (innerAlpha)
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);

  if (tint === "dark") {
    // 짙은 칠흑-차콜 스모크 (#090D16 ~ #1E293B)
    grad.addColorStop(0.0, `rgba(9, 13, 22, ${innerAlpha})`);
    grad.addColorStop(0.35, `rgba(15, 23, 42, ${innerAlpha * 0.82})`);
    grad.addColorStop(0.70, `rgba(30, 41, 59, ${innerAlpha * 0.42})`);
    grad.addColorStop(1.0, `rgba(30, 41, 59, 0.0)`);
  } else if (tint === "mid") {
    // 중간 슬레이트 스모크 (#1E293B ~ #475569)
    grad.addColorStop(0.0, `rgba(30, 41, 59, ${innerAlpha})`);
    grad.addColorStop(0.40, `rgba(51, 65, 85, ${innerAlpha * 0.72})`);
    grad.addColorStop(0.75, `rgba(71, 85, 105, ${innerAlpha * 0.35})`);
    grad.addColorStop(1.0, `rgba(71, 85, 105, 0.0)`);
  } else {
    // 상단 연무 하이라이트 (#475569 ~ #64748B)
    grad.addColorStop(0.0, `rgba(51, 65, 85, ${innerAlpha})`);
    grad.addColorStop(0.45, `rgba(71, 85, 105, ${innerAlpha * 0.68})`);
    grad.addColorStop(0.80, `rgba(100, 116, 139, ${innerAlpha * 0.28})`);
    grad.addColorStop(1.0, `rgba(100, 116, 139, 0.0)`);
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 다엽형 유기적 연막 구름 클러스터 (Organic Billowing Smoke Cloud Cluster)
 * - 중심 코어 + 7개의 불규칙 크기/각도 연기 로브(Lobe)의 유기적 결합.
 * - 모든 퍼프가 '안쪽 반투명, 바깥쪽 완전 투명' 라디얼 그라데이션으로 렌더링되어
 *   인위적인 경계선 없이 자욱하고 몽환적인 3D 연막 볼륨 형성.
 */
function drawOrganicSmokeCloud(
  ctx: any,
  cx: number,
  cy: number,
  baseRadius: number,
  alpha: number,
  seed: number = 0,
  riseOffset: number = 0
) {
  if (alpha <= 0.02 || baseRadius <= 3) return;
  ctx.save();
  ctx.translate(cx, cy - riseOffset);
  ctx.globalAlpha = Math.min(1.0, Math.max(0.0, alpha));

  const lobes = 7;
  const lobeData: { x: number; y: number; r: number }[] = [];

  for (let i = 0; i < lobes; i++) {
    const ang = (i / lobes) * Math.PI * 2 + seed;
    const rVar = 0.72 + 0.38 * Math.sin(ang * 2.3 + seed * 1.7);
    const dist = baseRadius * 0.46 * rVar;
    const lx = Math.cos(ang) * dist;
    const ly = Math.sin(ang) * (dist * 0.82);
    const lr = baseRadius * 0.58 * (0.80 + 0.35 * Math.cos(ang * 3.1 + seed));
    lobeData.push({ x: lx, y: ly, r: lr });
  }

  // 1. 심연 차콜 코어 퍼프 (안쪽 반투명, 바깥쪽 투명)
  drawSoftSmokePuff(ctx, 0, 0, baseRadius * 0.95, 0.65, "dark");

  // 2. 외곽 7개 엽(Lobes) 연막 퍼프 (각각 안쪽 반투명, 바깥쪽 완전 투명)
  for (const l of lobeData) {
    drawSoftSmokePuff(ctx, l.x, l.y, l.r, 0.58, "dark");
  }

  // 3. 중상단 슬레이트 볼륨 퍼프 (자연스러운 3D 음영)
  drawSoftSmokePuff(ctx, 0, -baseRadius * 0.12, baseRadius * 0.70, 0.50, "mid");
  for (const l of lobeData) {
    if (l.y < baseRadius * 0.25) {
      drawSoftSmokePuff(ctx, l.x * 0.7, l.y * 0.7 - baseRadius * 0.10, l.r * 0.75, 0.45, "mid");
    }
  }

  // 4. 상단 능선 하이라이트 연무
  for (const l of lobeData) {
    if (l.y < 0) {
      drawSoftSmokePuff(ctx, l.x * 0.6, l.y * 0.6 - baseRadius * 0.18, l.r * 0.55, 0.38, "light");
    }
  }

  ctx.restore();
}

/**
 * 표준 포물곡선 위치 계산 헬퍼
 * - t: 0.0 (시전자) ~ 1.0 (대상)
 * - arcHeight: 포물곡선 정점 높이
 */
function getParabolaPos(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  t: number,
  arcHeight: number = 80
) {
  const x = startX + (endX - startX) * t;
  const directY = startY + (endY - startY) * t;
  const arc = arcHeight * 4 * t * (1 - t);
  return { x, y: directY - arc };
}

/**
 * 고속 비행 연기탄 (Smoke Bomb Pellet) 및 흐릿한 포물곡선 구체 잔상 렌더러
 * - 유저 요청: "연막 구체 잔상 좀만 더 흐리게 + 포물곡선"
 */
function drawSmokePellet(
  ctx: any,
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  p: number,
  arcHeight: number = 80,
  alpha: number = 1.0
) {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0.0, alpha));

  const curPos = getParabolaPos(startX, startY, targetX, targetY, p, arcHeight);

  // 1. 포물선 궤적을 따른 5단계 흐릿한 구체 잔상 (Soft Translucent Afterimages)
  const afterimageCount = 5;
  for (let i = afterimageCount; i >= 1; i--) {
    const trailP = p - i * 0.052;
    if (trailP > 0) {
      const trailPos = getParabolaPos(startX, startY, targetX, targetY, trailP, arcHeight);
      const tRatio = 1.0 - i / (afterimageCount + 1); // 0.83 -> 0.16
      const trailAlpha = tRatio * 0.30; // 흐릿하고 부드러운 반투명 잔상
      const trailR = 8.0 + i * 1.6; // 뒤로 갈수록 부드럽게 번져 퍼짐
      drawSoftSmokePuff(ctx, trailPos.x, trailPos.y, trailR, trailAlpha, "mid");
    }
  }

  // 2. 잔상 사이를 잇는 은은하고 얇은 에어로다이내믹 연무 스트림
  const prevP = Math.max(0.0, p - 0.20);
  if (prevP < p) {
    const tailPos = getParabolaPos(startX, startY, targetX, targetY, prevP, arcHeight);
    const grad = ctx.createLinearGradient(tailPos.x, tailPos.y, curPos.x, curPos.y);
    grad.addColorStop(0.0, "rgba(51, 65, 85, 0.0)");
    grad.addColorStop(0.6, "rgba(30, 41, 59, 0.12)");
    grad.addColorStop(1.0, "rgba(15, 23, 42, 0.28)");

    ctx.save();
    ctx.strokeStyle = grad;
    ctx.lineWidth = 6.0;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(tailPos.x, tailPos.y);
    ctx.lineTo(curPos.x, curPos.y);
    ctx.stroke();
    ctx.restore();
  }

  // 3. 선두 연막 구체 본체 (안쪽 반투명, 바깥쪽 투명한 소프트 구체)
  drawSoftSmokePuff(ctx, curPos.x, curPos.y, 11.0, 0.72, "dark");
  drawSoftSmokePuff(ctx, curPos.x, curPos.y, 6.5, 0.88, "dark");
  drawSoftSmokePuff(ctx, curPos.x - 1.5, curPos.y - 1.5, 3.2, 0.48, "light");

  ctx.restore();
}

interface BillowingCloudDef {
  dx: number;
  dy: number;
  r: number;
  birth: number; // Step 3 기준 등장 시점 (0.0 ~ 1.0)
  wave: 1 | 2 | 3;
  seed: number;
  layer: "behind" | "front";
}

/**
 * 뭉게연기 클러스터 정의 (총 9개: 3개씩 3웨이브 순차 전개 & 순차 소산)
 * - 유저 요청:
 *   1. "뭉게연기가 한번에 나타나지말고 둘셋씩"
 *   2. "먼저 나타났던 애는 먼저 투명해지게 서서히" (FIFO 순차 페이드아웃)
 */
const SMOKE_BILLOW_CLOUDS: BillowingCloudDef[] = [
  // 1차 웨이브 (가장 먼저 피어오르고 ➔ 가장 먼저 서서히 투명해짐!)
  { dx: 0, dy: -2, r: 46, birth: 0.05, wave: 1, seed: 1.2, layer: "front" },
  { dx: -24, dy: 10, r: 40, birth: 0.08, wave: 1, seed: 2.5, layer: "front" },
  { dx: 22, dy: -12, r: 48, birth: 0.10, wave: 1, seed: 3.7, layer: "behind" },

  // 2차 웨이브 (두 번째로 피어오르고 ➔ 두 번째로 서서히 투명해짐!)
  { dx: -28, dy: -20, r: 44, birth: 0.36, wave: 2, seed: 4.8, layer: "front" },
  { dx: 26, dy: 14, r: 42, birth: 0.40, wave: 2, seed: 5.6, layer: "front" },
  { dx: -8, dy: -28, r: 50, birth: 0.44, wave: 2, seed: 6.4, layer: "behind" },

  // 3차 웨이브 (마지막으로 피어오르고 ➔ 가장 늦게까지 남아 서서히 투명해짐!)
  { dx: 30, dy: -18, r: 46, birth: 0.68, wave: 3, seed: 7.2, layer: "front" },
  { dx: 2, dy: 24, r: 42, birth: 0.72, wave: 3, seed: 8.3, layer: "front" },
  { dx: -30, dy: -6, r: 52, birth: 0.76, wave: 3, seed: 9.1, layer: "behind" },
];

/**
 * 각 뭉게연기별 생애주기(순차 피어오름 ➔ 순차 페이드아웃) 투명도 및 스케일 계산 헬퍼
 * - 먼저 나타났던 1차 웨이브부터 서서히 투명해지며 소멸
 */
function getCloudAlphaAndScale(
  c: BillowingCloudDef,
  step: number,
  p: number
): { alpha: number; scale: number; riseOffset: number; active: boolean } {
  if (step < 3) {
    return { alpha: 0, scale: 0, riseOffset: 0, active: false };
  }

  // Step 3: 둘셋씩 순차 피어오름
  if (step === 3) {
    if (p < c.birth) {
      return { alpha: 0, scale: 0, riseOffset: 0, active: false };
    }
    const grow = Math.min(1.0, (p - c.birth) / 0.22);
    const scale = 0.35 + 0.65 * Math.sin(grow * Math.PI * 0.5);
    const alpha = Math.min(0.96, grow * 1.05);
    return { alpha, scale, riseOffset: 0, active: true };
  }

  // Step 4: 소용돌이 & 먼저 나타났던 애(Wave 1)부터 서서히 투명해지기 시작
  if (step === 4) {
    let alpha = 0.96;
    if (c.wave === 1) {
      // 1차 웨이브: 먼저 태어났으므로 후반부(p: 0.85)에 0.50 수준으로 서서히 투명화
      alpha = Math.max(0.50, 0.96 - p * 0.48);
    } else if (c.wave === 2) {
      // 2차 웨이브: 1차보다 늦게 후반부부터 미세하게 투명화
      alpha = Math.max(0.75, 0.96 - Math.max(0, p - 0.30) * 0.30);
    } else {
      // 3차 웨이브: 가장 마지막에 태어나 짙게 유지
      alpha = 0.96;
    }
    return { alpha, scale: 1.0, riseOffset: 0, active: true };
  }

  // Step 5: 상공 분산 & 먼저 나타났던 순서대로 완전히 투명해짐 (Wave 1 ➔ Wave 2 ➔ Wave 3)
  if (step === 5) {
    let alpha = 0;
    let waveRiseMult = 1.0;
    let waveExpandMult = 1.0;

    if (c.wave === 1) {
      // 1차: 가장 먼저 소산되어 p=0.55에 완전 투명(0.0) 도달
      alpha = Math.max(0.0, 0.50 * (1.0 - p / 0.55));
      waveRiseMult = 1.25;
      waveExpandMult = 1.40;
    } else if (c.wave === 2) {
      // 2차: 두 번째로 소산되어 p=0.80에 완전 투명(0.0) 도달
      alpha = Math.max(0.0, 0.75 * (1.0 - p / 0.80));
      waveRiseMult = 1.05;
      waveExpandMult = 1.22;
    } else {
      // 3차: 가장 늦게까지 잔류하며 p=1.00에 완전 투명 도달
      alpha = Math.max(0.0, 0.95 * (1.0 - p));
      waveRiseMult = 0.85;
      waveExpandMult = 1.10;
    }

    const rise = p * 35 * waveRiseMult;
    const scale = (1.0 + p * 0.35) * waveExpandMult;
    return { alpha, scale, riseOffset: rise, active: alpha > 0.01 };
  }

  return { alpha: 0, scale: 0, riseOffset: 0, active: false };
}

/**
 * 108: 연막 (Smokescreen) 후방 레이어 렌더러
 * - 대상 포켓몬 뒤편에 거대한 칠흑 연막 장벽을 형성하여 완벽한 입체감(Volumetric 3D Sandwich) 구현.
 */
export function drawSmokescreenBehindEffect(
  ctx: any,
  frame: any,
  drawCtx: any
) {
  const step = frame.moveStep ?? 1;
  const p = Math.min(1.0, Math.max(0.0, frame.effectProgress ?? 0.5));
  if (step < 3) return;

  const tPos = drawCtx?.targetPos || { x: 550, y: 180 };
  const isPlayer = drawCtx?.isPlayer ?? true;
  const tx = tPos.x;
  const ty = tPos.y - (isPlayer ? 12 : 8);

  ctx.save();

  const behindClouds = SMOKE_BILLOW_CLOUDS.filter(c => c.layer === "behind");

  for (const c of behindClouds) {
    const info = getCloudAlphaAndScale(c, step, p);
    if (!info.active) continue;

    const swirlFreq = step === 5 ? 1.2 : 2.0;
    const swirlAmp = step === 4 ? 4 : (step === 3 ? 3 : 2);
    const sx = c.dx + Math.sin(p * Math.PI * swirlFreq + c.seed) * swirlAmp;
    const sy = c.dy + Math.cos(p * Math.PI * swirlFreq + c.seed) * swirlAmp;

    drawOrganicSmokeCloud(
      ctx,
      tx + sx,
      ty + sy,
      c.r * info.scale,
      info.alpha,
      c.seed,
      info.riseOffset
    );
  }

  ctx.restore();
}

/**
 * 108: 연막 (Smokescreen) 전면 레이어 렌더러
 * - 노말 / 변화 (상대의 명중률 1랭크 하락)
 *
 * 연출 구성:
 * 1. 시전자 입가에서 연막탄 장전 및 고속 사출 반동 (머즐 연무 & 궤적)
 * 2. 칠흑 연기탄의 유려한 포물선 탄도 비행 & 흐릿한 구체 잔상 스트림
 * 3. 상대 정면 직격 폭발! 2~3개씩 3웨이브 순차 피어오르는 뭉게연기 전개
 * 4. 대상 전면 완전 차폐 & 먼저 나타났던 1차 연막부터 서서히 투명해지며 시야 전환
 * 5. 명중률 하락 디버프 연기 스트림 하강 ➔ 연막이 상공으로 서서히 피어오르며 소멸
 */
export function drawSmokescreenEffect(
  ctx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  let step = 1;
  let p = 0.5;
  let ax = 200;
  let ay = 300;
  let tx = 550;
  let ty = 180;
  let isP = true;

  if (attackerPosOrFrame && typeof attackerPosOrFrame.x === "number") {
    ax = attackerPosOrFrame.x;
    ay = attackerPosOrFrame.y;
    tx = targetPosOrDrawCtx?.x ?? 550;
    ty = targetPosOrDrawCtx?.y ?? 180;
    step = moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, progress ?? 0.5));
    isP = Boolean(isPlayer);
  } else {
    const frame = attackerPosOrFrame || {};
    const drawCtx = targetPosOrDrawCtx || {};
    const aPos = drawCtx.attackerPos || { x: 200, y: 300 };
    const tPos = drawCtx.targetPos || { x: 550, y: 180 };
    ax = aPos.x;
    ay = aPos.y;
    tx = tPos.x;
    ty = tPos.y;
    step = frame.moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, frame.effectProgress ?? 0.5));
    isP = Boolean(drawCtx.isPlayer);
  }

  ctx.save();

  const mouthX = ax + (isP ? 34 : -34);
  const mouthY = ay - (isP ? 12 : 8);
  const targetCenterY = ty - (isP ? 14 : 10);

  // Step 1: 시전자 연막탄 발사 웅크림 & 머즐 연무 퍼프
  if (step === 1) {
    const muzzleAlpha = Math.min(0.95, p * 1.6);
    const muzzleR = 10 + p * 14;

    drawOrganicSmokeCloud(ctx, mouthX, mouthY, muzzleR, muzzleAlpha, 0.7);

    // 사출 순간의 고속 그을음(Soot) 파티클 5개
    for (let i = 0; i < 5; i++) {
      const ang = -0.3 + (i / 4) * 0.8 + (isP ? 0 : Math.PI);
      const dist = 10 + p * 24;
      const sx = mouthX + Math.cos(ang) * dist;
      const sy = mouthY + Math.sin(ang) * (dist * 0.6);
      drawSoftSmokePuff(ctx, sx, sy, 3.5, muzzleAlpha * 0.75, "dark");
    }
  }

  // Step 2: 연기탄 포물선 탄도 비행 & 흐릿한 구체 잔상 (높이 80px의 유려한 포물곡선)
  else if (step === 2) {
    drawSmokePellet(ctx, mouthX, mouthY, tx, targetCenterY, p, 80, 0.95);
  }

  // Step 3 ~ 5: 뭉게연기 렌더링 (순차 피어오름 ➔ 먼저 나타난 애부터 순차 투명화)
  else if (step >= 3) {
    const frontClouds = SMOKE_BILLOW_CLOUDS.filter(c => c.layer === "front");

    for (const c of frontClouds) {
      const info = getCloudAlphaAndScale(c, step, p);
      if (!info.active) continue;

      const swirlFreq = step === 5 ? 1.2 : 2.0;
      const swirlAmp = step === 4 ? 4 : (step === 3 ? 3 : 2);
      const sx = c.dx + Math.sin(p * Math.PI * swirlFreq + c.seed) * swirlAmp;
      const sy = c.dy + Math.cos(p * Math.PI * swirlFreq + c.seed) * swirlAmp;

      drawOrganicSmokeCloud(
        ctx,
        tx + sx,
        targetCenterY + sy,
        c.r * info.scale,
        info.alpha,
        c.seed,
        info.riseOffset
      );
    }

    // Step 3 착탄 순간 극초반 찰나의 방사형 고속 충격 연기 잔향 침 (Smoke Shock Spikes)
    if (step === 3 && p < 0.35) {
      const spikeP = p / 0.35;
      ctx.strokeStyle = `rgba(51, 65, 85, ${(1.0 - spikeP) * 0.75})`;
      ctx.lineWidth = 2.0;
      ctx.lineCap = "round";
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2 + 0.3;
        const innerD = 12 + spikeP * 18;
        const outerD = 24 + spikeP * 36;
        ctx.beginPath();
        ctx.moveTo(tx + Math.cos(ang) * innerD, targetCenterY + Math.sin(ang) * innerD * 0.7);
        ctx.lineTo(tx + Math.cos(ang) * outerD, targetCenterY + Math.sin(ang) * outerD * 0.7);
        ctx.stroke();
      }
    }

    // Step 4 명중률 1랭크 하락 정밀 디버프 연기 기운 (하향 하강 연무 침선)
    if (step === 4) {
      const debuffAlpha = Math.sin(p * Math.PI) * 0.85;
      if (debuffAlpha > 0.05) {
        ctx.save();
        ctx.globalAlpha = debuffAlpha;
        for (let i = 0; i < 4; i++) {
          const fallP = (p * 2.0 + i * 0.25) % 1.0;
          const lineX = tx - 24 + i * 16;
          const lineY = targetCenterY - 30 + fallP * 55;
          const grad = ctx.createLinearGradient(lineX, lineY - 14, lineX, lineY);
          grad.addColorStop(0.0, "rgba(100, 116, 139, 0.0)");
          grad.addColorStop(1.0, "rgba(148, 163, 184, 0.75)");

          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.8;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(lineX, lineY - 14);
          ctx.lineTo(lineX, lineY);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  }

  ctx.restore();
}


