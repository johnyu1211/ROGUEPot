// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawMiniRetroStar, drawStarburstImpact } from "../common/helpers.js";

// ============================================================================
// 🐲 225: 용의숨결 (Dragon Breath / りゅうのいぶき) - 드래곤 타입 특수 기술
//
// 위력: 60 / 명중: 100 / PP: 20 / 마비 확률: 30% / 접촉: X
// 설명: 강력한 드래곤의 숨결을 상대에게 내뿜어 공격한다. 30% 확률로 상대를 마비시킨다.
//
// [연출 메커니즘 - 유저 피드백 완벽 엄수]:
// 1. [완전 투과 관통]: 대상 포켓몬 몸통을 완전히 가로질러 화면 너머까지 뚫고 지나가는 강력한 투과 연출
// 2. [단일 연속 광선 (끊김 0%)]: 마디 사이에 공백/투명 틈새 없이 일렬로 쫙 이어진 단일 빔
// 3. [그라데이션으로 3단계 마디 표현]: 빔 중간은 100% 꽉 찬 불투명 색상이면서, 마디 경계부에 연한 살구/주황빛(Peach Orange) 블렌딩
// 4. [중간 흰색 제거 & 꽉 찬 유색 밀도]: 중간이 휑하거나 투명하지 않고 선명한 핫핑크 & 연분홍으로 가득 찬 농도
// 5. [적에게 갈수록 대폭 넓어지는 테이퍼링]: 시전자 입가(좁음, ~7px) -> 적에게 도달할 때 약 4배 이상(32~36px) 시원하게 확장!
// 6. [앞뒤 끝단 투명 페이드]: 빔 맨 꼬리와 맨 머리만 부드럽게 완전 투명(0.0) 페이드
// 7. [배경 살짝 암전]: 발사 구간 동안 배경을 살짝만 암전 (dimAlpha: 0.38)
// ============================================================================

const DRAGON_BREATH_PALETTE = {
  // 5세대 원작 마젠타 핫핑크 & 연분홍 (흰색 선 완전 배제, 100% 농도)
  hotPink: "rgba(233, 30, 99, 1.0)",        // 선명한 마젠타 핫핑크 (#E91E63)
  deepMagenta: "rgba(194, 24, 91, 1.0)",     // 딥 마젠타 (#C2185B)
  brightPink: "rgba(255, 64, 129, 1.0)",     // 화사하고 짙은 핑크 (#FF4081)
  softPink: "rgba(244, 143, 177, 1.0)",      // 부드러운 연분홍 (#F48FB1)
  outerPinkGlow: "rgba(233, 30, 99, 0.35)",  // 외곽 핑크 글로우

  // 끊어지는 마디 부분: 연한 살구빛 / 주황빛 (Peach Orange, 흰색 없음!)
  jointPeach: "rgba(255, 138, 101, 1.0)",    // 살구/연주황 (#FF8A65)
  jointLight: "rgba(255, 171, 145, 1.0)",    // 옅은 피치 오렌지 (#FFAB91)
  jointOrange: "rgba(255, 112, 67, 1.0)",    // 선명한 연한 주황 (#FF7043)
  jointGlow: "rgba(255, 138, 101, 0.40)",    // 연주황 글로우

  // 배경 살짝 암전용
  dimBg: "rgba(8, 6, 14, 0.38)",
};

/**
 * 적에게 갈수록 넓어지는 배율 계산 (유저 요청: 살짝만 줄여서 최적 밸런스 조정)
 * - t = 0.0 (시전자 입가): 0.75배 (약 6.8px)
 * - t = 1.0 (적 도달 타격점): 3.40배 (약 30.6px - 과하지 않고 시원한 너비)
 * - t = 1.5 (적 관통 너머): 4.70배 (약 42.3px)
 */
function getTaperScale(t: number): number {
  const ct = Math.max(0, t);
  if (ct <= 1.0) {
    return 0.75 + ct * 2.65;
  }
  return 3.40 + (ct - 1.0) * 1.10;
}

/**
 * ⚡ 직선형 사다리꼴 테이퍼 폴리곤 렌더러
 */
function drawTaperedPolygon(
  ctx: any,
  startX: number,
  startY: number,
  ux: number,
  uy: number,
  nx: number,
  ny: number,
  dist: number,
  t0: number,
  t1: number,
  baseHalfW: number,
  baseOffset: number,
  fillStyle: any
) {
  const scale0 = getTaperScale(t0);
  const scale1 = getTaperScale(t1);

  const p0x = startX + ux * (dist * t0);
  const p0y = startY + uy * (dist * t0);
  const p1x = startX + ux * (dist * t1);
  const p1y = startY + uy * (dist * t1);

  const hw0 = baseHalfW * scale0;
  const hw1 = baseHalfW * scale1;
  const off0 = baseOffset * scale0;
  const off1 = baseOffset * scale1;

  ctx.beginPath();
  ctx.moveTo(p0x + nx * (off0 - hw0), p0y + ny * (off0 - hw0));
  ctx.lineTo(p1x + nx * (off1 - hw1), p1y + ny * (off1 - hw1));
  ctx.lineTo(p1x + nx * (off1 + hw1), p1y + ny * (off1 + hw1));
  ctx.lineTo(p0x + nx * (off0 + hw0), p0y + ny * (off0 + hw0));
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

/**
 * 🐉 용의숨결 단일 연속 일렬 관통 광선
 * - [타격 후 투명화 버그 완전 제거]: 타격 중이나 관통 중에도 100% 진하고 꽉 찬 불투명 광선 유지
 * - [시전자 연속 발사감]: flowTime 기반의 고속 전진 펄스가 시전자에서 적 방향으로 계속 뿜어짐
 * - [적에게 갈수록 넓어짐]: 입가 ~6.8px -> 적 도달 시 ~31px (살짝 줄여 최적화)
 * - [튀는 불꽃 파티클]: 레이저 외곽에서 튀어나오는 작은 불꽃 점 파티클
 */
function drawContinuousDragonBreathBeam(
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
  if (alpha <= 0.01 || endP <= startP + 0.01) return;

  const dx = targetX - startX;
  const dy = targetY - startY;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return;

  const ux = dx / dist;
  const uy = dy / dist;
  const nx = -uy;
  const ny = ux;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, alpha);

  const p0x = startX + ux * (dist * startP);
  const p0y = startY + uy * (dist * startP);
  const p1x = startX + ux * (dist * endP);
  const p1y = startY + uy * (dist * endP);

  const flowCycle = (flowTime * 0.40) % 0.15;

  // 1. 단일 연속 광선의 길이 방향 3단계 마디 그라데이션
  const mainGrad = ctx.createLinearGradient(p0x, p0y, p1x, p1y);
  mainGrad.addColorStop(0.00, "rgba(233, 30, 99, 0.0)");
  mainGrad.addColorStop(0.03, "rgba(233, 30, 99, 1.0)");
  mainGrad.addColorStop(Math.min(0.97, Math.max(0.04, 0.24 + flowCycle)), "rgba(240, 98, 146, 1.0)");
  // [마디 1 관절부: 연한 살구/주황빛]
  mainGrad.addColorStop(Math.min(0.97, Math.max(0.04, 0.30 + flowCycle)), "rgba(255, 171, 145, 1.0)");
  mainGrad.addColorStop(Math.min(0.97, Math.max(0.04, 0.35 + flowCycle)), "rgba(255, 138, 101, 1.0)");
  mainGrad.addColorStop(Math.min(0.97, Math.max(0.04, 0.40 + flowCycle)), "rgba(255, 171, 145, 1.0)");
  // [마디 2 본체: 핫핑크]
  mainGrad.addColorStop(Math.min(0.97, Math.max(0.04, 0.46 + flowCycle)), "rgba(240, 98, 146, 1.0)");
  mainGrad.addColorStop(Math.min(0.97, Math.max(0.04, 0.56 + flowCycle)), "rgba(233, 30, 99, 1.0)");
  // [마디 2 관절부: 연한 살구/주황빛]
  mainGrad.addColorStop(Math.min(0.97, Math.max(0.04, 0.62 + flowCycle)), "rgba(255, 171, 145, 1.0)");
  mainGrad.addColorStop(Math.min(0.97, Math.max(0.04, 0.67 + flowCycle)), "rgba(255, 138, 101, 1.0)");
  mainGrad.addColorStop(Math.min(0.97, Math.max(0.04, 0.72 + flowCycle)), "rgba(255, 171, 145, 1.0)");
  // [마디 3 본체: 핫핑크]
  mainGrad.addColorStop(Math.min(0.97, Math.max(0.04, 0.78 + flowCycle)), "rgba(240, 98, 146, 1.0)");
  mainGrad.addColorStop(0.97, "rgba(233, 30, 99, 1.0)");
  mainGrad.addColorStop(1.00, "rgba(233, 30, 99, 0.0)");

  // 2. 중심 코어 띠 그라데이션
  const coreGrad = ctx.createLinearGradient(p0x, p0y, p1x, p1y);
  coreGrad.addColorStop(0.00, "rgba(255, 64, 129, 0.0)");
  coreGrad.addColorStop(0.03, "rgba(255, 64, 129, 1.0)");
  coreGrad.addColorStop(Math.min(0.97, Math.max(0.04, 0.25 + flowCycle)), "rgba(255, 64, 129, 1.0)");
  coreGrad.addColorStop(Math.min(0.97, Math.max(0.04, 0.33 + flowCycle)), "rgba(255, 171, 145, 1.0)");
  coreGrad.addColorStop(Math.min(0.97, Math.max(0.04, 0.35 + flowCycle)), "rgba(255, 138, 101, 1.0)");
  coreGrad.addColorStop(Math.min(0.97, Math.max(0.04, 0.37 + flowCycle)), "rgba(255, 171, 145, 1.0)");
  coreGrad.addColorStop(Math.min(0.97, Math.max(0.04, 0.48 + flowCycle)), "rgba(255, 64, 129, 1.0)");
  coreGrad.addColorStop(Math.min(0.97, Math.max(0.04, 0.65 + flowCycle)), "rgba(255, 171, 145, 1.0)");
  coreGrad.addColorStop(Math.min(0.97, Math.max(0.04, 0.67 + flowCycle)), "rgba(255, 138, 101, 1.0)");
  coreGrad.addColorStop(Math.min(0.97, Math.max(0.04, 0.69 + flowCycle)), "rgba(255, 171, 145, 1.0)");
  coreGrad.addColorStop(Math.min(0.97, Math.max(0.04, 0.80 + flowCycle)), "rgba(255, 64, 129, 1.0)");
  coreGrad.addColorStop(0.97, "rgba(255, 64, 129, 1.0)");
  coreGrad.addColorStop(1.00, "rgba(255, 64, 129, 0.0)");

  // 3. 외곽 소프트 글로우 그라데이션
  const glowGrad = ctx.createLinearGradient(p0x, p0y, p1x, p1y);
  glowGrad.addColorStop(0.00, "rgba(233, 30, 99, 0.0)");
  glowGrad.addColorStop(0.08, "rgba(233, 30, 99, 0.35)");
  glowGrad.addColorStop(0.35, "rgba(255, 138, 101, 0.35)");
  glowGrad.addColorStop(0.67, "rgba(255, 138, 101, 0.35)");
  glowGrad.addColorStop(0.92, "rgba(233, 30, 99, 0.35)");
  glowGrad.addColorStop(1.00, "rgba(233, 30, 99, 0.0)");

  // =========================================================================
  // [광선 다발 구조 렌더링]: 중간이 꽉 찬 솔리드 바디 + 평행 다발 빗살 + 외곽 글로우
  // =========================================================================

  // [Layer 1] 외곽 은은한 소프트 글로우
  drawTaperedPolygon(ctx, startX, startY, ux, uy, nx, ny, dist, startP, endP, 5.8, 0.0, glowGrad);

  // [Layer 2] 메인 베이스 솔리드 바디 (중간 100% 꽉 채워진 핫핑크 & 피치)
  // 입가 폭: 4.5 * 2 * 0.75 ≈ 6.8px -> 적 타겟 폭: 4.5 * 2 * 3.40 ≈ 30.6px!
  drawTaperedPolygon(ctx, startX, startY, ux, uy, nx, ny, dist, startP, endP, 4.5, 0.0, mainGrad);

  // [Layer 3] 중심 브라이트 코어 (선명한 화사함 부여, 흰색 없음)
  // 입가 폭: 2.3 * 2 * 0.75 ≈ 3.5px -> 적 타겟 폭: 2.3 * 2 * 3.40 ≈ 15.6px!
  drawTaperedPolygon(ctx, startX, startY, ux, uy, nx, ny, dist, startP, endP, 2.3, 0.0, coreGrad);

  // [Layer 4] 평행하게 나란히 달리는 상/하단 보조 광선 빗살 (광선 다발 질감)
  drawTaperedPolygon(ctx, startX, startY, ux, uy, nx, ny, dist, startP, endP, 0.95, -2.5, mainGrad);
  drawTaperedPolygon(ctx, startX, startY, ux, uy, nx, ny, dist, startP, endP, 0.95, 2.5, mainGrad);

  // [Layer 5] 시전자에서 적 방향으로 계속 뿜어져 나가는 고속 레이저 펄스 스트리크 (Streaming Effect)
  const STREAK_COUNT = 4;
  for (let s = 0; s < STREAK_COUNT; s++) {
    const streakProg = ((flowTime * 0.65 + s * 0.25) % 1.0);
    const strT0 = startP + (endP - startP) * Math.max(0, streakProg - 0.12);
    const strT1 = startP + (endP - startP) * Math.min(1.0, streakProg + 0.12);
    if (strT1 > strT0 + 0.01) {
      const offY = (s % 2 === 0 ? 1 : -1) * 1.3;
      drawTaperedPolygon(ctx, startX, startY, ux, uy, nx, ny, dist, strT0, strT1, 0.9, offY, coreGrad);
    }
  }

  // 4. [유저 요청 엄수]: 레이저에서 튀는 불꽃 점 파티클 (Laser Sparks & Embers)
  const SPARK_COUNT = 16;
  const totalSpan = endP - startP;
  for (let k = 0; k < SPARK_COUNT; k++) {
    const st = startP + ((k * 0.15 + flowTime * 0.45) % (totalSpan + 0.001));
    if (st < startP || st > endP) continue;

    const scale = getTaperScale(st);
    // 광선 외곽으로 튀어나오는 불꽃 점
    const side = k % 2 === 0 ? 1 : -1;
    const sparkDist = (4.5 * scale) + Math.sin(k * 3.7 + flowTime * 4.0) * (3.0 + scale * 1.5);
    const spX = startX + ux * (dist * st) + nx * (side * sparkDist);
    const spY = startY + uy * (dist * st) + ny * (side * sparkDist);

    const isJointArea = Math.min(Math.abs(st - 0.35), Math.abs(st - 0.67)) < 0.06;
    ctx.fillStyle = isJointArea ? DRAGON_BREATH_PALETTE.jointPeach : DRAGON_BREATH_PALETTE.brightPink;
    const sparkR = (k % 3 === 0) ? 2.0 : 1.4;
    ctx.beginPath();
    ctx.arc(spX, spY, sparkR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 🐲 225: 용의숨결 후방 레이어 렌더러 (drawDragonBreathBehindEffect)
 */
export function drawDragonBreathBehindEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, attackerPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep || 1;
  const p = frame.effectProgress ?? 0.5;

  // 1. [유저 요청 엄수]: 배경을 살짝만 암전시켜 줌 (포켓몬 스프라이트 뒤의 배경만 살짝 어둡게)
  const dimAlpha = frame.dimAlpha ?? (frame.showEffect && step >= 2 && step <= 4 ? 0.38 : 0.0);
  if (dimAlpha > 0.01) {
    targetCtx.save();
    targetCtx.fillStyle = `rgba(8, 6, 14, ${Math.min(0.50, dimAlpha)})`;
    targetCtx.fillRect(-10000, -10000, 20000, 20000);
    targetCtx.restore();
  }

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));
  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0));

  const mouthX = ax + (isP ? 34 : -34);
  const mouthY = ay - (isP ? 14 : 10);
  const targetCenterY = ty - (isP ? 14 : 10);

  const streamHead = frame.streamHead ?? 0.0;
  const streamTail = frame.streamTail ?? 0.0;
  const streamAlpha = frame.streamAlpha ?? 1.0;

  // [유저 요청 엄수]: 상대 시전 시(!isP) 화면 좌하단 밖까지 완전히 뻗어나가도록 레이저 도달 거리 확장
  const reachHead = streamHead * (isP ? 1.0 : 1.25);
  const reachTail = streamTail > 0 ? streamTail * (isP ? 1.0 : 1.25) : 0;

  // 2. [유저 요청 엄수 - 투과]: 대상 포켓몬 뒤쪽으로 뻗어나가는 관통 빔 보조
  if (reachHead > 0.95 && streamAlpha > 0.01) {
    const flowTime = step * 2.0 + p * 4.0;
    drawContinuousDragonBreathBeam(
      targetCtx,
      mouthX,
      mouthY,
      tx,
      targetCenterY,
      Math.max(0.95, reachTail),
      reachHead,
      streamAlpha * 0.90,
      flowTime,
      "behind"
    );
  }
}

/**
 * 🐲 225: 용의숨결 전면 레이어 렌더러 (drawDragonBreathEffect)
 * - [유저 요청 엄수]: 십자선 이펙트 완전 제거! 대상 포켓몬 몸통을 가로질러 뚫고 지나가는 관통 렌더링
 */
export function drawDragonBreathEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, attackerPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep || 1;
  const p = frame.effectProgress ?? 0.5;

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));
  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0));

  const mouthX = ax + (isP ? 34 : -34);
  const mouthY = ay - (isP ? 14 : 10);
  const targetCenterY = ty - (isP ? 14 : 10);

  // Step 1: 시전자 들이쉬기 및 입가 마젠타 & 살구빛 미세 광선 충전
  if (step === 1) {
    const chargeAlpha = Math.min(0.95, p * 1.6);
    targetCtx.save();
    targetCtx.translate(mouthX, mouthY);
    targetCtx.rotate(isP ? 0.2 : -0.2);

    for (let i = -1; i <= 1; i++) {
      targetCtx.fillStyle = i === 0 ? DRAGON_BREATH_PALETTE.hotPink : DRAGON_BREATH_PALETTE.jointPeach;
      targetCtx.globalAlpha = chargeAlpha * 0.90;
      targetCtx.fillRect(-14 * p, i * 3.5 - 1.5, 18 * p, 3.0);
    }
    targetCtx.restore();
  }

  // [유저 요청 엄수]: 발사될 때 시전자 입가에서 튀어나오는 불꽃 점 파티클 (Muzzle Sparks)
  if (step >= 2 && step <= 4 && (frame.streamTail ?? 0) < 0.3) {
    targetCtx.save();
    const muzAlpha = Math.min(1.0, (frame.streamAlpha ?? 1.0) * 0.90);
    targetCtx.globalAlpha = muzAlpha;
    const muzTime = (step * 2.0 + p * 4.0);
    const dir = isP ? 1 : -1;
    for (let m = 0; m < 5; m++) {
      const angle = (m - 2) * 0.35 + Math.sin(muzTime * 3.0 + m) * 0.2;
      const spDist = 8 + ((muzTime * 15 + m * 7) % 24);
      const spX = mouthX + dir * Math.cos(angle) * spDist;
      const spY = mouthY + Math.sin(angle) * spDist;
      targetCtx.fillStyle = m % 2 === 0 ? DRAGON_BREATH_PALETTE.jointPeach : DRAGON_BREATH_PALETTE.brightPink;
      targetCtx.beginPath();
      targetCtx.arc(spX, spY, 1.8, 0, Math.PI * 2);
      targetCtx.fill();
    }
    targetCtx.restore();
  }

  // Step 2 ~ 4: [유저 요청 엄수 - 완전 투과]: 대상 포켓몬 몸통을 가로질러 뚫고 지나가는 일렬 연속 광선
  const streamHead = frame.streamHead ?? 0.0;
  const streamTail = frame.streamTail ?? 0.0;
  const streamAlpha = frame.streamAlpha ?? 1.0;

  // [유저 요청 엄수]: 상대 시전 시(!isP) 화면 좌하단 밖까지 완전히 뻗어나가도록 레이저 도달 거리 확장
  const reachHead = streamHead * (isP ? 1.0 : 1.25);
  const reachTail = streamTail > 0 ? streamTail * (isP ? 1.0 : 1.25) : 0;

  if (reachHead > 0 && reachHead > reachTail && streamAlpha > 0.01) {
    const flowTime = step * 2.0 + p * 4.0;
    // ⚠️ 십자선 없이 대상 포켓몬 정면을 시원하게 가로질러 적 너머까지 뚫고 지나감!
    drawContinuousDragonBreathBeam(
      targetCtx,
      mouthX,
      mouthY,
      tx,
      targetCenterY,
      reachTail,
      reachHead,
      streamAlpha,
      flowTime,
      "front"
    );
  }

  // Step 5: 분산 및 소멸 잔향 (부드러운 불씨 알갱이 소산)
  if (step === 5) {
    const disperseAlpha = Math.max(0, (1.0 - p) * 0.70);
    if (disperseAlpha > 0.02) {
      targetCtx.save();
      for (let i = 0; i < 6; i++) {
        const px = tx + ((i * 14) % 28) - 14;
        const py = targetCenterY - p * 25 - i * 4;
        targetCtx.fillStyle = i % 2 === 0 ? DRAGON_BREATH_PALETTE.hotPink : DRAGON_BREATH_PALETTE.jointPeach;
        targetCtx.globalAlpha = disperseAlpha * 0.75;
        targetCtx.beginPath();
        targetCtx.arc(px, py, 1.5, 0, Math.PI * 2);
        targetCtx.fill();
      }
      targetCtx.restore();
    }
  }
}




// ============================================================================
// 🏃 226: 배턴터치 (Baton Pass / バトンタッチ) - 노말 타입 변화 기술
//
// 위력: — / 명중: — / PP: 40 / 대상: 자신 / 접촉: X
// 설명: 다음 교대 포켓몬에게 랭크 변화와 혼란/대타 등의 상태를 온전히 이어받게 한다.
//
// [연출 기승전결 시퀀스]:
// 1. 기(起): 시전자 머리 위 반짝이는 황금빛 & 진홍빛 릴레이 배턴(Baton) 소환
// 2. 승(承): 시전자의 경쾌한 회전 점프와 함께 배턴이 포물선 빛의 궤적을 그리며 회전
// 3. 전(轉): 계승의 황금 오라 링 팽창 & 배턴이 전방으로 시원하게 건네어지며(Pass!) 시전자 소환 복귀
// 4. 결(結): 온화한 치유/축복 스파클 잔향 및 다음 주자를 위한 빛의 길 완성
// ============================================================================

const BATON_PALETTE = {
  white: "#FFFFFF",
  redHighlight: "#F87171", // 상단 메탈릭 하이라이트 림 (과한 백색 지양)
  redSpecular: "#FEE2E2",  // 옅고 부드러운 소프트 하이라이트 반사광
  redBody: "#EF4444",      // 선명한 스포츠 릴레이 레드 본체
  redCore: "#DC2626",      // 깊이감 있는 풍부한 레드
  redShadow: "#991B1B",    // 메탈릭 음영 섀도우
  redDeep: "#7F1D1D",      // 최하단 딥 섀도우
};

/**
 * 슬릭 메탈 릴레이 바톤 렌더링 헬퍼
 * - 일체형 스포츠 레드 알루미늄 (양 끝 색 분리 없이 단일 레드 컬러로 통일)
 * - 34×4.6px의 직선 슬릭 원통 튜브 비율과 미세 베벨(0.8px)로 소시지 형태 배제 및 알맞은 크기
 * - 수직 원통 원형 음영 그라데이션으로 리얼한 3D 메탈릭 입체감
 * - 옅고 부드러운 하이라이트와 은은한 음각 가공 링으로 세련된 릴레이 바톤 연출
 */
function drawRelayBaton(
  ctx: any,
  cx: number,
  cy: number,
  angle: number,
  scale: number = 1.0
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  const len = 34; // 살짝 컴팩트한 알맞은 바톤 크기 (기존 42 -> 34)
  const w = 4.6;  // 슬릭한 7.4:1 비율 유지 (기존 5.2 -> 4.6)
  const halfL = len / 2;
  const halfW = w / 2;

  // 1. 단일 통일 레드 원통형 메탈 그라데이션 (은은하고 옅은 하이라이트)
  const bodyGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
  bodyGrad.addColorStop(0.0, BATON_PALETTE.redHighlight);
  bodyGrad.addColorStop(0.22, BATON_PALETTE.redSpecular);
  bodyGrad.addColorStop(0.42, BATON_PALETTE.redBody);
  bodyGrad.addColorStop(0.72, BATON_PALETTE.redCore);
  bodyGrad.addColorStop(0.92, BATON_PALETTE.redShadow);
  bodyGrad.addColorStop(1.0, BATON_PALETTE.redDeep);

  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  // 미세 베벨(0.8px)로 직선 튜브 형태 유지 (뭉툭한 소시지 방지)
  ctx.roundRect(-halfL, -halfW, len, w, 0.8);
  ctx.fill();

  // 2. 바톤 표면 미세 메탈릭 음각 그립 라인 (옅고 은은한 가공선)
  ctx.lineWidth = 0.65;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.beginPath();
  ctx.moveTo(-halfL + 6.5, -halfW + 0.5);
  ctx.lineTo(-halfL + 6.5, halfW - 0.5);
  ctx.moveTo(halfL - 6.5, -halfW + 0.5);
  ctx.lineTo(halfL - 6.5, halfW - 0.5);
  ctx.stroke();

  // 3. 슬릭 메탈 튜브 외곽선 (일체형 다크 레드 테두리)
  ctx.strokeStyle = "rgba(127, 29, 29, 0.5)";
  ctx.lineWidth = 0.55;
  ctx.beginPath();
  ctx.roundRect(-halfL, -halfW, len, w, 0.8);
  ctx.stroke();

  ctx.restore();
}

/**
 * 배턴터치 - 후면 이펙트 (유저 요청: 링/파티클 제거)
 */
export function drawBatonPassBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  // 링이나 점 파티클 없이 깔끔하게 유지
}

/**
 * 배턴터치 - 전면 이펙트 (던짐 > 회전 상승 > 정점 > 회전 하강 & 페이드 아웃)
 * - 28프레임 전 구간에 걸쳐 끊김 없는 완벽한 등속 연속 회전 (프레임당 약 60도)
 * - 정점 도달 및 하강까지 물리적으로 매끄러운 포물선 궤적
 * - 하강 구간에서 부드럽게 페이드 아웃
 */
export function drawBatonPassEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const isP = drawCtx.isPlayer;
  const casterPos = isP ? drawCtx.pm : drawCtx.em;
  const dir = isP ? 1 : -1;

  // 전체 28프레임 기준 글로벌 프레임 인덱스 산출 (0 ~ 27)
  let globalIdx = 0;
  if (typeof frame.animFrame === "number") {
    globalIdx = frame.animFrame;
  } else {
    // step 기반 fallback
    if (step === 1) globalIdx = prog * 5;
    else if (step === 2) globalIdx = 6 + prog * 7;
    else if (step === 3) globalIdx = 14 + prog * 6;
    else globalIdx = 21 + prog * 6;
  }

  // 0.0 ~ 1.0 정규화 진행률
  const u = Math.min(1.0, Math.max(0.0, globalIdx / 27.0));

  // 1. 완벽한 등속 연속 회전 (총 4.5바퀴 = 9π rad, 프레임당 Math.PI * 0.333 균일 회전)
  // 진행 방향(dir)에 맞추어 전방으로 부드럽게 텀블링 롤 회전
  const angle = dir * (globalIdx * (Math.PI * 0.333));

  // 2. 물리 포물선 궤적 (X: 등속 전진, Y: 상공 정점 통과 2차 포물선)
  // X: casterPos.x + dir * (10 ~ 38)
  const bx = casterPos.x + dir * (10 + u * 28);

  // Y: 시전자 손 위치(y-16)에서 출발하여 상공 정점(y-92) 통과 후 지면 부근으로 하강
  // 정점 uApex = 0.44 (약 12프레임 시점)
  const uApex = 0.44;
  const apexY = casterPos.y - 92;
  const by = apexY + 390 * Math.pow(u - uApex, 2);

  // 3. 투명도 (Step 4 하강 구간 21~27프레임에서 부드러운 페이드 아웃)
  let alpha = 1.0;
  if (globalIdx >= 20) {
    alpha = Math.max(0.0, 1.0 - (globalIdx - 20) / 7.0);
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  drawRelayBaton(ctx, bx, by, angle, 1.0);
  ctx.restore();
}

// ============================================================================
// 👏 227: 앙코르 (Encore / アンコール) - 노말 타입 변화 기술
//
// 위력: — / 명중: 100 / PP: 5 / 대상: 상대 / 접촉: X
// 설명: 상대가 마지막으로 사용한 기술에 열광적인 박수를 보내 3턴간 강제로 같은 기술만 반복하게 한다.
//
// [연출 기승전결 시퀀스]:
// 1. 기(起): 무대 위의 조명! 대상 머리 위로 쏟아지는 원추형 무대 스포트라이트 빔
// 2. 승/전(承/轉): 스포트라이트 속에서 피어오르는 경쾌한 음표(♪ ♫)와 오색 축제 콘페티 샤워
// 3. 결(結): 은은한 골든 소프트 글로우 및 미니 음표와 함께 스르륵 소산
// ============================================================================

const ENCORE_PALETTE = {
  white: "#FFFFFF",
  goldLight: "#FEF08A",
  goldCore: "#FACC15",
  goldDeep: "#EAB308",
  spotlightBeam: "rgba(254, 240, 138, 0.32)",
  spotlightFloor: "rgba(250, 204, 21, 0.38)",
  noteCyan: "#38BDF8",
  notePink: "#F43F5E",
  noteGold: "#FACC15",
  notePurple: "#A855F7",
  noteLime: "#4ADE80",
};

/**
 * 앙코르 - 후면 이펙트 (무대 스포트라이트 조명 빔)
 */
export function drawEncoreBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const isP = drawCtx.isPlayer;
  const isTargetEnemy = isP;

  const targetBase = isTargetEnemy
    ? (drawCtx.em ?? { x: 418, y: 152, size: 95 })
    : (drawCtx.pm ?? { x: 150, y: 280, size: 135 });

  const cx = targetBase.x;
  // 대상 포켓몬 발밑 지면 위치 (플랫폼 상단 표면)
  const footY = isTargetEnemy ? targetBase.y - 2 : targetBase.y - 4;
  // 대상 포켓몬 머리 상단 위치
  const headY = isTargetEnemy ? footY - 68 : footY - 95;
  const topY = Math.max(0, headY - 85);

  // Step 1 ~ 2 (또는 레거시 1 ~ 3): 무대 스포트라이트 원추형 빔 & 바닥 조명 (border 완전 배제, 소프트 래디얼 그라데이션)
  if (step === 1 || step === 2 || (step === 3 && frame.showBehindEffect)) {
    ctx.save();
    const alpha = step === 1 ? Math.min(1.0, prog * 1.5) : Math.max(0, 1.0 - prog * 0.4);
    ctx.globalAlpha = alpha;

    // 1. 상단 무대 조명 램프 렌즈 플레어
    const flareGrad = ctx.createRadialGradient(cx, topY, 2, cx, topY, 26);
    flareGrad.addColorStop(0.0, ENCORE_PALETTE.white);
    flareGrad.addColorStop(0.4, ENCORE_PALETTE.goldLight);
    flareGrad.addColorStop(1.0, "rgba(250, 204, 21, 0)");
    ctx.fillStyle = flareGrad;
    ctx.beginPath();
    ctx.arc(cx, topY, 26, 0, Math.PI * 2);
    ctx.fill();

    // 2. 상공에서 대상 포켓몬 발밑으로 쏟아지는 원추형 빛기둥 (Spotlight Beam)
    const beamBottomWidth = isTargetEnemy ? 62 : 74;
    const beamGrad = ctx.createLinearGradient(cx, topY, cx, footY + 4);
    beamGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.60)");
    beamGrad.addColorStop(0.25, ENCORE_PALETTE.spotlightBeam);
    beamGrad.addColorStop(0.8, "rgba(250, 204, 21, 0.16)");
    beamGrad.addColorStop(1.0, "rgba(250, 204, 21, 0.04)");

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 14, topY);
    ctx.lineTo(cx + 14, topY);
    ctx.lineTo(cx + beamBottomWidth, footY + 4);
    ctx.lineTo(cx - beamBottomWidth, footY + 4);
    ctx.closePath();
    ctx.fill();

    // 3. 빛기둥 내부를 유영하는 미세 금빛 먼지/광자 파티클
    for (let i = 0; i < 6; i++) {
      const moteProg = ((prog * 1.5 + i * 0.18) % 1.0);
      const my = topY + moteProg * (footY - topY);
      const spread = 8 + moteProg * (beamBottomWidth - 14);
      const mx = cx + Math.sin(moteProg * Math.PI * 3 + i) * spread;
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.beginPath();
      ctx.arc(mx, my, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. 지면 원형 무대 조명 (유저 요청: border 일체 제거, 부드러운 래디얼 그라데이션 발광만 적용)
    const floorRadiusX = isTargetEnemy ? 56 : 68;
    const floorRadiusY = isTargetEnemy ? 18 : 22;
    const floorGrad = ctx.createRadialGradient(cx, footY, 3, cx, footY, floorRadiusX);
    floorGrad.addColorStop(0.0, "rgba(254, 240, 138, 0.42)");
    floorGrad.addColorStop(0.4, "rgba(250, 204, 21, 0.24)");
    floorGrad.addColorStop(0.8, "rgba(250, 204, 21, 0.08)");
    floorGrad.addColorStop(1.0, "rgba(250, 204, 21, 0.0)");

    ctx.fillStyle = floorGrad;
    ctx.beginPath();
    ctx.ellipse(cx, footY, floorRadiusX, floorRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}



/**
 * 음악 음표(♪, ♫) 렌더링 헬퍼
 */
function drawMusicNote(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  color: string,
  isDouble: boolean = false
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.22;

  // 음표 헤드 (타원)
  ctx.beginPath();
  ctx.ellipse(cx, cy, size * 0.45, size * 0.35, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // 음표 기둥
  ctx.beginPath();
  ctx.moveTo(cx + size * 0.35, cy);
  ctx.lineTo(cx + size * 0.35, cy - size * 1.2);
  ctx.stroke();

  // 꼬리 (단일 or 더블)
  if (isDouble) {
    ctx.beginPath();
    ctx.ellipse(cx + size * 1.1, cy, size * 0.45, size * 0.35, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + size * 1.45, cy);
    ctx.lineTo(cx + size * 1.45, cy - size * 1.2);
    ctx.stroke();

    // 상단 빔
    ctx.lineWidth = size * 0.32;
    ctx.beginPath();
    ctx.moveTo(cx + size * 0.3, cy - size * 1.2);
    ctx.lineTo(cx + size * 1.5, cy - size * 1.2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(cx + size * 0.35, cy - size * 1.2);
    ctx.quadraticCurveTo(cx + size * 0.9, cy - size * 1.0, cx + size * 0.8, cy - size * 0.5);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 앙코르 - 전면 이펙트 (음악 음표, 축제 콘페티, 잔여 글로우)
 */
export function drawEncoreEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const isP = drawCtx.isPlayer;
  const isTargetEnemy = isP;

  const targetBase = isTargetEnemy
    ? (drawCtx.em ?? { x: 418, y: 152, size: 95 })
    : (drawCtx.pm ?? { x: 150, y: 280, size: 135 });

  const cx = targetBase.x;
  // 대상 포켓몬 발밑 지면 위치
  const footY = isTargetEnemy ? targetBase.y - 2 : targetBase.y - 4;
  // 대상 포켓몬 상체/몸통 중심 위치 (음표 발원점)
  const bodyY = isTargetEnemy ? footY - 36 : footY - 50;

  // Step 2 (또는 레거시 Step 3): 음악 음표 & 오색 축제 콘페티 샤워
  if (step === 2 || (step === 3 && frame.showBehindEffect)) {
    ctx.save();
    // 1. 포켓몬 주위로 넓게 퍼져 피어오르는 멜로디 음표들 (유저 요청: 음표 촘촘함 해소 & 넓은 확산)
    const noteDefs = [
      // 좌측 외곽으로 넓게 호를 그리며 퍼지는 핑크 음표
      { baseDx: -30, spreadX: -36, startY: 8, riseDist: 74, size: 12, color: ENCORE_PALETTE.notePink, double: false, waveFreq: 3.5 },
      // 우측 외곽으로 시원하게 확산되는 시안 더블 음표
      { baseDx: 32, spreadX: 36, startY: 0, riseDist: 78, size: 13, color: ENCORE_PALETTE.noteCyan, double: true, waveFreq: 3.2 },
      // 좌측 중간 거리 골드 음표
      { baseDx: -16, spreadX: -20, startY: -16, riseDist: 66, size: 10, color: ENCORE_PALETTE.noteGold, double: false, waveFreq: 4.0 },
      // 우측 중간 거리 퍼플 더블 음표
      { baseDx: 18, spreadX: 20, startY: -22, riseDist: 70, size: 12, color: ENCORE_PALETTE.notePurple, double: true, waveFreq: 3.8 },
      // 중앙 상공으로 유영하는 라임 음표
      { baseDx: -5, spreadX: -10, startY: -38, riseDist: 58, size: 9.5, color: ENCORE_PALETTE.noteLime, double: false, waveFreq: 3.0 },
      // 우측 상공으로 피어나는 화이트 골드 음표
      { baseDx: 9, spreadX: 14, startY: -32, riseDist: 64, size: 10.5, color: ENCORE_PALETTE.white, double: false, waveFreq: 4.2 },
    ];

    for (let i = 0; i < noteDefs.length; i++) {
      const nd = noteDefs[i];
      const wave = Math.sin(prog * Math.PI * nd.waveFreq + i) * 6;
      const nx = cx + nd.baseDx + (nd.spreadX * prog) + wave;
      const ny = (bodyY + nd.startY) - (prog * nd.riseDist);
      const rot = Math.sin(prog * Math.PI * 3 + nd.baseDx) * 0.22;

      let noteAlpha = 1.0;
      if (prog < 0.15) noteAlpha = prog / 0.15;
      else if (prog > 0.8) noteAlpha = Math.max(0, (1.0 - prog) / 0.2);

      ctx.save();
      ctx.globalAlpha = noteAlpha;
      ctx.translate(nx, ny);
      ctx.rotate(rot);
      drawMusicNote(ctx, 0, 0, nd.size, nd.color, nd.double);
      ctx.restore();
    }

    // 2. 사방으로 흩날리는 축제 회전 콘페티 & 미니 별빛 (음표 확산에 맞춰 시원하게 비산)
    const numConfetti = 20;
    for (let i = 0; i < numConfetti; i++) {
      const angle = (i * Math.PI * 2) / numConfetti + prog * 2.5;
      const dist = 28 + prog * 60;
      const px = cx + Math.cos(angle) * dist;
      const py = bodyY + Math.sin(angle) * dist * 0.65;

      const colors = [
        ENCORE_PALETTE.notePink,
        ENCORE_PALETTE.noteCyan,
        ENCORE_PALETTE.noteGold,
        ENCORE_PALETTE.notePurple,
        ENCORE_PALETTE.noteLime,
        ENCORE_PALETTE.white,
      ];
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle * 2 + prog * 6);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(-3, -1.5, 6, 3);
      ctx.restore();

      if (i % 3 === 0) {
        drawMiniRetroStar(ctx, px, py - 4, 4, ENCORE_PALETTE.goldLight, prog * 5);
      }
    }

    ctx.restore();
  }

  // Step 3 (또는 레거시 Step 4): 앙코르 지속 결계 안착 및 안정화 복귀 (바닥 원 border 제거)
  if ((step === 3 && !frame.showBehindEffect) || step === 4) {
    ctx.save();
    const alpha = Math.max(0, 1.0 - prog * 0.9);
    ctx.globalAlpha = alpha;

    // 1. 발밑 잔여 소프트 글로우 (border/stroke 일체 없이 부드러운 발광만 적용)
    const floorRadiusX = isTargetEnemy ? 46 : 56;
    const floorRadiusY = isTargetEnemy ? 16 : 20;
    const endFloorGrad = ctx.createRadialGradient(cx, footY, 2, cx, footY, floorRadiusX);
    endFloorGrad.addColorStop(0.0, "rgba(250, 204, 21, 0.32)");
    endFloorGrad.addColorStop(0.5, "rgba(250, 204, 21, 0.10)");
    endFloorGrad.addColorStop(1.0, "rgba(250, 204, 21, 0.0)");
    ctx.fillStyle = endFloorGrad;
    ctx.beginPath();
    ctx.ellipse(cx, footY, floorRadiusX, floorRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. 발 주위에서 회전하며 승화하는 은은한 미니 음표 4개
    const ringNotes = [
      { angle: 0, icon: "♪" },
      { angle: Math.PI * 0.5, icon: "♫" },
      { angle: Math.PI, icon: "♪" },
      { angle: Math.PI * 1.5, icon: "♫" },
    ];
    for (const rn of ringNotes) {
      const rx = cx + Math.cos(rn.angle + prog * 2) * (floorRadiusX * 0.85);
      const ry = footY + Math.sin(rn.angle + prog * 2) * (floorRadiusY * 0.85);
      drawMusicNote(ctx, rx, ry, 6, ENCORE_PALETTE.goldLight, rn.icon === "♫");
    }

    // 3. 상공으로 스르륵 소산되는 잔여 골드 파티클
    for (let i = 0; i < 4; i++) {
      const px = cx + ((i * 21) % 38) - 19;
      const py = bodyY - 10 - (prog * 30) - i * 5;
      drawMiniRetroStar(ctx, px, py, 4, ENCORE_PALETTE.goldLight, prog * 3);
    }

    ctx.restore();
  }
}

// ============================================================================
// 🗡️ 228: 따라가때리기 (Pursuit / おいうち) - 악 타입 물리 기술
//
// 위력: 40 (교체 시 80) / 명중: 100 / PP: 20 / 접촉: O
// 설명: 상대 포켓몬이 교체될 때 사용하면 2배의 위력으로 공격할 수 있다.
//
// [연출 기승전결 시퀀스]:
// 1. 기(起): 시전자 발밑에 암흑 그림자 웅덩이 생성 ➔ 그림자 속으로 스르륵 잠입(Shadow Meld)
// 2. 승(承): 칠흑의 그림자 궤적이 전장 지면을 마하의 속도로 가로질러 대상 등 뒤로 급습 쇄도
// 3. 전(轉): 대상의 등 뒤 그림자에서 기습 융기! 칠흑/진홍빛 암흑 엑스자 절단 참격(Shadow Cross Slash) 콰앙!!
// 4. 결(結): 시전자 정위치로 재도약 착지 및 어둠의 기운 소산
// ============================================================================

const PURSUIT_PALETTE = {
  white: "#FFFFFF",
  shadowDeep: "#020617",
  shadowViolet: "#1E1B4B",
  darkPurple: "#581C87",
  darkNeon: "#9333EA",
  crimsonRim: "#EF4444",
  crimsonLight: "#F87171",
  smokeDark: "rgba(15, 23, 42, 0.65)",
};

/**
 * 따라가때리기 - 후면 이펙트 (지면 암흑 그림자 웅덩이 & 급습 잔상)
 */
export function drawPursuitBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  // [유저 요청] 모든 이펙트 제거 (움직임 및 투명도만 유지)
  return;
  /*
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const isP = drawCtx.isPlayer;

  const casterPos = isP ? drawCtx.pm : drawCtx.em;
  const targetPos = isP ? drawCtx.em : drawCtx.pm;

  // Step 1: 시전자 발밑 그림자 웅덩이 (Shadow Puddle)
  if (step === 1) {
    const cx = casterPos.x;
    const cy = casterPos.y + 15;

    ctx.save();
    const puddleR = 15 + prog * 25;
    ctx.globalAlpha = Math.min(1.0, prog * 1.5);

    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, puddleR);
    grad.addColorStop(0.0, PURSUIT_PALETTE.shadowDeep);
    grad.addColorStop(0.6, PURSUIT_PALETTE.darkPurple);
    grad.addColorStop(1.0, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, puddleR, puddleR * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Step 2: 지면을 가로지르는 그림자 추적 선 (Shadow Streak)
  if (step === 2) {
    ctx.save();
    const startX = casterPos.x;
    const startY = casterPos.y + 15;
    const endX = targetPos.x;
    const endY = targetPos.y + 15;

    const t = Math.min(1.0, prog * 1.4);
    const curX = startX + (endX - startX) * t;
    const curY = startY + (endY - startY) * t;

    // 칠흑의 그림자 바닥 트랙
    ctx.strokeStyle = PURSUIT_PALETTE.shadowDeep;
    ctx.lineWidth = 6.0;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(curX, curY);
    ctx.stroke();

    // 자주빛 외곽 글로우
    ctx.strokeStyle = PURSUIT_PALETTE.darkNeon;
    ctx.lineWidth = 2.0;
    ctx.stroke();

    ctx.restore();
  }

  // Step 3: 대상 등 뒤 그림자 융기 및 솟구치는 암흑 스파이크 (Shadow Surge & Spikes)
  if (step === 3) {
    const tx = targetPos.x;
    const ty = targetPos.y + 15;

    ctx.save();
    const puddleR = 25 + (1.0 - prog) * 15;
    ctx.globalAlpha = Math.max(0, 1.0 - prog * 0.7);

    const grad = ctx.createRadialGradient(tx, ty, 2, tx, ty, puddleR);
    grad.addColorStop(0.0, PURSUIT_PALETTE.shadowDeep);
    grad.addColorStop(0.6, PURSUIT_PALETTE.darkPurple);
    grad.addColorStop(1.0, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(tx, ty, puddleR, puddleR * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // 대상 등 뒤 솟구치는 그림자 스파이크
    const dir = isP ? 1 : -1;
    const backX = tx + dir * 18;
    for (let j = 0; j < 3; j++) {
      const h = (1.0 - prog) * (32 + j * 8);
      const sx = backX + (j - 1) * 10;
      ctx.fillStyle = PURSUIT_PALETTE.shadowDeep;
      ctx.beginPath();
      ctx.moveTo(sx - 4, ty);
      ctx.lineTo(sx, ty - h);
      ctx.lineTo(sx + 4, ty);
      ctx.fill();
    }
    ctx.restore();
  }

  // Step 4: 시전자 착지 발밑 소산되는 잔여 암흑 웅덩이
  if (step === 4) {
    const cx = casterPos.x;
    const cy = casterPos.y + 15;

    ctx.save();
    const puddleR = (1.0 - prog) * 20;
    ctx.globalAlpha = Math.max(0, (1.0 - prog) * 0.8);

    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, Math.max(1, puddleR));
    grad.addColorStop(0.0, PURSUIT_PALETTE.shadowDeep);
    grad.addColorStop(0.7, PURSUIT_PALETTE.darkPurple);
    grad.addColorStop(1.0, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(1, puddleR), Math.max(1, puddleR * 0.45), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  */
}

/**
 * 속여때리기 타격 연출 헬퍼: 2톤 발광 구체 알갱이 (안쪽 색: #A5A5DE, 바깥쪽 색: #ADADA5)
 */
function drawPursuitTwoToneOrb(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number,
  isInnerColor: boolean
) {
  if (alpha <= 0.01 || radius <= 0.5) return;
  ctx.save();

  // [유저 요청] 안쪽 선 색: #A5A5DE (RGB 165, 165, 222), 바깥쪽 선 색: #ADADA5 (RGB 173, 173, 165)
  const [r, g, b] = isInnerColor ? [165, 165, 222] : [173, 173, 165];

  // [유저 요청] 점 파티클 안쪽의 흰 색깔을 해당 glowColor의 원본 색깔보다 살짝 흰 색깔로 가 있는 색깔로 적용 (약 45% 화이트 믹스)
  const coreR = Math.round(r + (255 - r) * 0.45);
  const coreG = Math.round(g + (255 - g) * 0.45);
  const coreB = Math.round(b + (255 - b) * 0.45);
  const coreColor = `rgba(${coreR}, ${coreG}, ${coreB}, ${1.0 * alpha})`;

  // 1. 외곽 고유 색상 발광 글로우
  const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.6);
  glowGrad.addColorStop(0.00, coreColor);
  glowGrad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${0.92 * alpha})`);
  glowGrad.addColorStop(0.70, `rgba(${r}, ${g}, ${b}, ${0.45 * alpha})`);
  glowGrad.addColorStop(1.00, `rgba(${r}, ${g}, ${b}, 0.0)`);

  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.6, 0, Math.PI * 2);
  ctx.fill();

  // 2. 중심부 코어: 순백색(255,255,255) 대신 원본 glowColor보다 살짝 흰 색상
  ctx.fillStyle = coreColor;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.65, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 속여때리기 타격 연출 헬퍼: 안쪽 선(#A5A5DE) 색상 코어 섬광 플래시
 */
function drawPursuitFeintHitBurst(
  ctx: any,
  cx: number,
  cy: number,
  progress: number
) {
  if (progress > 0.28) return;
  const alpha = Math.max(0, 1.0 - progress / 0.28);
  if (alpha <= 0.01) return;

  ctx.save();
  const coreR = 10 + progress * 14;
  const flashGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
  flashGrad.addColorStop(0.00, `rgba(255, 255, 255, ${1.0 * alpha})`);
  flashGrad.addColorStop(0.30, `rgba(255, 255, 255, ${0.95 * alpha})`);
  flashGrad.addColorStop(0.65, `rgba(165, 165, 222, ${0.85 * alpha})`); // #A5A5DE 안쪽 선 색상
  flashGrad.addColorStop(0.88, `rgba(165, 165, 222, ${0.40 * alpha})`);
  flashGrad.addColorStop(1.00, "rgba(165, 165, 222, 0.0)");

  ctx.fillStyle = flashGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 속여때리기 타격 연출 헬퍼: 안쪽 선(#A5A5DE) 색상 날카로운 8각 스타버스트
 */
function drawPursuitFeintSharpImpact(
  ctx: any,
  cx: number,
  cy: number,
  progress: number
) {
  if (progress > 0.28) return;
  const alpha = Math.max(0, 1.0 - progress / 0.28);
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(progress * 0.45);

  const outerR = 10 + progress * 16;
  const innerR = outerR * 0.38;
  const points = 8;

  // #A5A5DE 안쪽 선 색상 채움 & 순백 하이라이트 림
  ctx.fillStyle = `rgba(165, 165, 222, ${0.90 * alpha})`;
  ctx.strokeStyle = `rgba(255, 255, 255, ${1.0 * alpha})`;
  ctx.lineWidth = 1.8;
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

  // 중앙부 순백 미니 코어
  ctx.fillStyle = `rgba(255, 255, 255, ${1.0 * alpha})`;
  ctx.beginPath();
  ctx.arc(0, 0, outerR * 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 따라가때리기 - 전면 이펙트 (대상 포위 구불구불 원 수축 & 축소 직후 속여때리기 타격)
 */
export function drawPursuitEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const isP = drawCtx.isPlayer;
  const targetPos =
    drawCtx.targetPos ??
    (isP
      ? { x: drawCtx.em.x, y: drawCtx.em.y - 36 }
      : { x: drawCtx.pm.x, y: drawCtx.pm.y - 36 });

  // Step 2: 대상 포켓몬을 향해 줄어드는 2겹 구불구불 원 (Shrinking Double Squiggly Rings)
  // 바깥쪽(밖): #ADADA5 / 안쪽(안): #A5A5DE
  // [유저 요청] 안쪽은 살짝만 더 빠르게 + 줄어들다가 살짝 밖으로 나갔다가 다시 들어가기
  if (step === 2) {
    const cx = targetPos.x;
    const cy = targetPos.y;

    ctx.save();

    // 헬퍼: 3단계 수축 궤적 계산 (줄어들다가 -> 살짝 밖으로 나갔다가 -> 다시 들어가기)
    const getRingRadius = (isInner: boolean): number => {
      const startR = isInner ? 76 : 86;
      // 안쪽은 살짝만 더 빠르게 수축 (midR에서 더 깊이 수축)
      const midR = isInner ? 30 : 44;
      // 살짝 밖으로 나갔다가 (반동 높이 +10px)
      const bounceHeight = 10;
      const endR = isInner ? 8 : 14;

      if (prog <= 0.45) {
        // 1단계: 줄어들다가 (0.0 -> 0.45)
        const p = prog / 0.45;
        const ease = 1 - Math.pow(1 - p, 1.5);
        return startR - (startR - midR) * ease;
      } else if (prog <= 0.65) {
        // 2단계: 살짝 밖으로 나갔다가 (0.45 -> 0.65)
        const p = (prog - 0.45) / 0.20;
        return midR + Math.sin(p * Math.PI) * bounceHeight;
      } else {
        // 3단계: 다시 들어가기 (0.65 -> 1.0)
        const p = (prog - 0.65) / 0.35;
        const ease = Math.pow(p, 1.4);
        return midR - (midR - endR) * ease;
      }
    };

    const outerBaseR = getRingRadius(false);
    const innerBaseR = getRingRadius(true);

    // 고정 기하 형태 매개변수 (시간에 따른 형태 왜곡/회전 제거 - 형태 100% 유지)
    // 16개 꺾인 톱니, 96개 정수 버텍스 (1주기당 정확히 6개 버텍스로 고정)
    const toothCount = 16;
    const points = 96;

    // 헬퍼: 고정된 형태의 꺾인 선 원 렌더링 (형태 불변, 순수 비례 스케일)
    const renderWavyRing = (baseR: number, strokeColor: string, lineWidth: number) => {
      // [유저 요청] 굽은 선의 굴곡을 살짝 더 뾰족하게 (진폭 0.085 -> 0.11 & 3차 고조파로 꼭짓점 첨예화)
      const amp = baseR * 0.11;

      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const theta = (i / points) * Math.PI * 2;
        // + 0.22 3차 고조파로 봉우리와 골짜기를 더 날카롭고 뾰족하게 형성
        const wave = amp * (Math.cos(toothCount * theta) + 0.22 * Math.cos(toothCount * 3 * theta));
        const r = Math.max(2, baseR + wave);
        const x = cx + Math.cos(theta) * r;
        const y = cy + Math.sin(theta) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      // [유저 요청] border 완전 제거 & miter 조인으로 뾰족한 각도 살림
      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "miter";
      ctx.miterLimit = 3.0;
      ctx.stroke();
      ctx.restore();
    };

    // 1. 바깥쪽 원 (밖: #ADADA5)
    renderWavyRing(outerBaseR, "#ADADA5", 3.0);

    // 2. 안쪽 원 (안: #A5A5DE)
    renderWavyRing(innerBaseR, "#A5A5DE", 3.0);

    ctx.restore();
  }

  // Step 3: 속여때리기 타격 연출
  // [유저 요청]:
  // 1. 회전이 아닌 사방으로 팍 하고 퍼지는 방사형 폭발
  // 2. 타격 색상은 안쪽 선과 동일한 색상 (#A5A5DE)
  // 3. 터질 때 점 파티클 색상은 바깥쪽(#ADADA5)과 안쪽(#A5A5DE) 혼합
  if (step === 3) {
    const hitProg = frame.hitProgress ?? prog;
    const targetOffset = isP ? (frame.eOffset ?? { x: 0, y: 0 }) : (frame.pOffset ?? { x: 0, y: 0 });
    const cx = targetPos.x + targetOffset.x;
    const cy = targetPos.y + targetOffset.y;

    ctx.save();

    // 1. 안쪽 선 색상(#A5A5DE) 코어 섬광 플래시 (탁!)
    drawPursuitFeintHitBurst(ctx, cx, cy, hitProg);

    // 2. 안쪽 선 색상(#A5A5DE) 8각 날카로운 스타버스트 (팍!)
    drawPursuitFeintSharpImpact(ctx, cx, cy, hitProg);

    // 3. [유저 요청] 사방으로 팍 하고 퍼지는 2톤 점 파티클 (개수 미세 감축: 16 -> 12개)
    const particleCount = 12;
    const burstEase = 1.0 - Math.pow(1.0 - Math.min(1.0, hitProg), 2.2);

    let orbAlpha = 1.0;
    if (hitProg > 0.60) {
      const fadeT = (hitProg - 0.60) / 0.40;
      orbAlpha = Math.max(0.0, 1.0 - Math.pow(fadeT, 1.3));
    }

    if (orbAlpha > 0.01) {
      for (let i = 0; i < particleCount; i++) {
        // 균일 각도에 유기적인 미세 지터
        const angle = (i / particleCount) * Math.PI * 2 + ((i * 17) % 7) * 0.03;
        // 각 파티클별 도달 거리 (38px ~ 62px)
        const maxDist = 38 + ((i * 13) % 4) * 8;
        const curDist = burstEase * maxDist;

        const px = cx + Math.cos(angle) * curDist;
        const py = cy + Math.sin(angle) * curDist;

        // 크기는 퍼지면서 점진적으로 감소 (5.6px -> 2.2px)
        const baseRadius = 4.8 + (i % 3) * 0.8;
        const curRadius = baseRadius * Math.max(0.35, 1.0 - hitProg * 0.65);

        // [유저 요청] 바깥쪽 색(#ADADA5)과 안쪽 색(#A5A5DE) 혼합 (짝수: 안쪽 색, 홀수: 바깥쪽 색)
        const isInnerColor = i % 2 === 0;

        // 메인 점 파티클
        drawPursuitTwoToneOrb(ctx, px, py, curRadius, orbAlpha, isInnerColor);

        // 꼬리 트레일 미니 파티클 (메인보다 살짝 뒤처진 거리)
        if (curDist > 12 && hitProg < 0.85) {
          const trailDist = curDist * 0.70;
          const tx = cx + Math.cos(angle) * trailDist;
          const ty = cy + Math.sin(angle) * trailDist;
          const trailRadius = curRadius * 0.55;
          const trailAlpha = orbAlpha * 0.65;
          drawPursuitTwoToneOrb(ctx, tx, ty, trailRadius, trailAlpha, !isInnerColor);
        }
      }
    }

    ctx.restore();
  }

  /*
  const casterPos = isP ? drawCtx.pm : drawCtx.em;
  const targetPos = isP ? drawCtx.em : drawCtx.pm;
  const dir = isP ? 1 : -1;

  // Step 1: 시전자 그림자 침투 연무
  if (step === 1) {
    const cx = casterPos.x;
    const cy = casterPos.y + 10;

    ctx.save();
    const alpha = Math.min(1.0, prog * 1.2);
    ctx.globalAlpha = alpha;

    for (let i = 0; i < 6; i++) {
      const px = cx + ((i * 13) % 30) - 15;
      const py = cy - (prog * 25) - i * 3;
      ctx.fillStyle = PURSUIT_PALETTE.darkPurple;
      ctx.beginPath();
      ctx.arc(px, py, 6 * (1.0 - prog * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Step 3: 기습 엑스자 암흑 참격 (Surprise Shadow Cross Slash)
  if (step === 3) {
    const cx = targetPos.x;
    const cy = targetPos.y;

    ctx.save();
    // 1. 거대한 엑스자 참격 (Cross Slash)
    const slashLen = 35 + prog * 20;
    const slashAlpha = Math.max(0, 1.0 - prog * 0.85);
    ctx.globalAlpha = slashAlpha;

    // 슬래시 1: 좌상단 -> 우하단
    ctx.strokeStyle = PURSUIT_PALETTE.crimsonRim;
    ctx.lineWidth = 5.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - slashLen, cy - slashLen * 0.8);
    ctx.lineTo(cx + slashLen, cy + slashLen * 0.8);
    ctx.stroke();

    // 슬래시 2: 우상단 -> 좌하단
    ctx.beginPath();
    ctx.moveTo(cx + slashLen, cy - slashLen * 0.8);
    ctx.lineTo(cx - slashLen, cy + slashLen * 0.8);
    ctx.stroke();

    // 참격 코어 순백 레이저
    ctx.strokeStyle = PURSUIT_PALETTE.white;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(cx - slashLen * 0.9, cy - slashLen * 0.72);
    ctx.lineTo(cx + slashLen * 0.9, cy + slashLen * 0.72);
    ctx.moveTo(cx + slashLen * 0.9, cy - slashLen * 0.72);
    ctx.lineTo(cx - slashLen * 0.9, cy + slashLen * 0.72);
    ctx.stroke();

    // 2. 스타버스트 타격 충격
    if (prog < 0.5) {
      drawStarburstImpact(ctx, cx, cy, PURSUIT_PALETTE.crimsonRim, PURSUIT_PALETTE.white, 38 * (1.0 - prog * 2));
    }

    // 3. 비산하는 암흑 파편 10개
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI * 2) / 10 + i * 0.2;
      const dist = prog * (40 + (i % 3) * 12);
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;

      ctx.fillStyle = i % 2 === 0 ? PURSUIT_PALETTE.darkNeon : PURSUIT_PALETTE.shadowDeep;
      ctx.fillRect(px - 2, py - 2, 4, 4);
    }

    ctx.restore();
  }

  // Step 4: 안정화 복귀
  if (step === 4) {
    const cx = targetPos.x;
    const cy = targetPos.y;

    ctx.save();
    ctx.globalAlpha = Math.max(0, 1.0 - prog);
    for (let i = 0; i < 5; i++) {
      const px = cx + ((i * 15) % 36) - 18;
      const py = cy + ((i * 11) % 30) - 15;
      drawMiniRetroStar(ctx, px, py, 3, PURSUIT_PALETTE.darkNeon, i);
    }
    ctx.restore();
  }
  */
}
