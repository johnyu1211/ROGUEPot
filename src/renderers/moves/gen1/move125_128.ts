// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { drawTackleEffect } from "./move033_036.js";
import { drawBillowingFlamePuff } from "./move053_056.js";
import { drawClamValve } from "./move109_112.js";

/**
 * 🦴 포켓몬 정통 뼈다귀 외곽선 패스 (Authentic Rounded Pokémon Bone Path)
 * - 끝부분이 풍만하고 둥글둥글한 관절 골두 (Bulbous Rounded Knobs)
 * - 골이 깊지 않고 완만한 자연스러운 뼈 관절 홈
 */
function pathPokemonBone(ctx: any) {
  ctx.beginPath();
  // 1. 샤프트 상단 라인: 좌측 (-7.5, -3.8) -> 우측 (7.5, -3.8)
  ctx.moveTo(-7.5, -3.8);
  ctx.lineTo(7.5, -3.8);

  // 2. 우상 골두: 샤프트에서 꼭대기 (12.8, -7.5)로 부드럽게 둥글게 솟음
  ctx.bezierCurveTo(9.5, -3.8, 10.8, -7.5, 12.8, -7.5);
  // 우상 골두: 꼭대기에서 우측 둥근 정점 (17.2, -3.8)까지 둥근 호
  ctx.bezierCurveTo(15.2, -7.5, 17.2, -5.8, 17.2, -3.8);
  // 우상 골두: 우측 정점에서 완만한 얕은 중앙 홈 (15.8, 0)으로 살짝만 들어감 (골 완화)
  ctx.bezierCurveTo(17.2, -1.8, 16.5, -0.6, 15.8, 0);

  // 3. 우하 골두: 얕은 중앙 홈 (15.8, 0)에서 우하 정점 (17.2, 3.8)으로 나옴
  ctx.bezierCurveTo(16.5, 0.6, 17.2, 1.8, 17.2, 3.8);
  // 우하 골두: 우측 정점에서 바닥 꼭대기 (12.8, 7.5)까지 둥근 호
  ctx.bezierCurveTo(17.2, 5.8, 15.2, 7.5, 12.8, 7.5);
  // 우하 골두: 바닥 꼭대기에서 샤프트 하단 (7.5, 3.8)으로 연결
  ctx.bezierCurveTo(10.8, 7.5, 9.5, 3.8, 7.5, 3.8);

  // 4. 샤프트 하단 라인: 우측 (7.5, 3.8) -> 좌측 (-7.5, 3.8)
  ctx.lineTo(-7.5, 3.8);

  // 5. 좌하 골두: 샤프트 하단에서 바닥 꼭대기 (-12.8, 7.5)로 둥글게
  ctx.bezierCurveTo(-9.5, 3.8, -10.8, 7.5, -12.8, 7.5);
  // 좌하 골두: 바닥 꼭대기에서 좌측 둥근 정점 (-17.2, 3.8)까지 둥근 호
  ctx.bezierCurveTo(-15.2, 7.5, -17.2, 5.8, -17.2, 3.8);
  // 좌하 골두: 좌측 정점에서 완만한 얕은 중앙 홈 (-15.8, 0)으로 살짝만 들어감
  ctx.bezierCurveTo(-17.2, 1.8, -16.5, 0.6, -15.8, 0);

  // 6. 좌상 골두: 얕은 중앙 홈 (-15.8, 0)에서 좌상 정점 (-17.2, -3.8)으로 나옴
  ctx.bezierCurveTo(-16.5, -0.6, -17.2, -1.8, -17.2, -3.8);
  // 좌상 골두: 좌측 정점에서 꼭대기 (-12.8, -7.5)까지 둥근 호
  ctx.bezierCurveTo(-17.2, -5.8, -15.2, -7.5, -12.8, -7.5);
  // 좌상 골두: 꼭대기에서 샤프트 상단 (-7.5, -3.8)으로 연결
  ctx.bezierCurveTo(-10.8, -7.5, -9.5, -3.8, -7.5, -3.8);

  ctx.closePath();
}

/**
 * 🦴 완성도 높은 포켓몬 정통 뼈다귀 렌더러 (Authentic Pokémon Bone Renderer)
 * - 쿨톤 순백-실버그레이 3D 볼륨 셰이딩 + 또렷한 딥차콜 테두리 + 중심 하이라이트
 */
export function drawCartoonBone(
  ctx: any,
  cx: number,
  cy: number,
  rotation: number = 0,
  scale: number = 1.0,
  alpha: number = 1.0,
  withMotionBlur: boolean = false
) {
  if (alpha <= 0.01 || scale <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // 1. 고속 회전 모션 블러 잔상 (Spin Motion Blur)
  if (withMotionBlur && alpha > 0.3) {
    const blurOffsets = [-0.32, -0.16];
    for (let i = 0; i < blurOffsets.length; i++) {
      ctx.save();
      ctx.rotate(rotation + blurOffsets[i]);
      ctx.globalAlpha = alpha * (0.15 + i * 0.12);
      pathPokemonBone(ctx);
      ctx.fillStyle = "#E4E4EC";
      ctx.fill();
      ctx.strokeStyle = "rgba(126, 126, 142, 0.35)";
      ctx.lineWidth = 1.0;
      ctx.stroke();
      ctx.restore();
    }
  }

  // 2. 메인 뼈다귀 회전
  ctx.rotate(rotation);

  // A. 순백-실버그레이 쿨톤 베이스 그라데이션 채우기 (레퍼런스 이미지 매칭)
  pathPokemonBone(ctx);
  const boneGrad = ctx.createLinearGradient(0, -9.0, 0, 9.0);
  boneGrad.addColorStop(0.0, "#FFFFFF");
  boneGrad.addColorStop(0.32, "#F7F7FA");
  boneGrad.addColorStop(0.68, "#E2E2EA");
  boneGrad.addColorStop(1.0, "#C4C4D2");
  ctx.fillStyle = boneGrad;
  ctx.fill();

  // B. 하단 3D 볼륨 섀도우 (클리핑 후 실버-차콜 섀도우)
  ctx.save();
  pathPokemonBone(ctx);
  ctx.clip();
  const shadowGrad = ctx.createLinearGradient(0, 0.8, 0, 9.0);
  shadowGrad.addColorStop(0.0, "rgba(160, 160, 180, 0)");
  shadowGrad.addColorStop(0.5, "rgba(145, 145, 168, 0.45)");
  shadowGrad.addColorStop(1.0, "rgba(115, 115, 138, 0.70)");
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.rect(-24, 0.8, 48, 12);
  ctx.fill();
  ctx.restore();

  // C. 뼈와 일체감 있는 얇고 자연스러운 쿨 실버 외곽선 (유저 요청: 두께 줄이고 뼈랑 유사한 색)
  pathPokemonBone(ctx);
  ctx.strokeStyle = "#787888";
  ctx.lineWidth = 1.2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();

  // D. 중심 샤프트 백색 광택 빔 & 골두 하이라이트 (레퍼런스 이미지 매칭)
  ctx.save();
  // 중심 샤프트 굵은 광택선
  ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
  ctx.lineWidth = 2.0;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-8, -1.0);
  ctx.lineTo(8, -1.0);
  ctx.stroke();

  // 양쪽 골두 상단 광택 닷 (풍만해진 둥근 헤드에 맞춤)
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(-13.0, -4.8, 1.8, 0, Math.PI * 2);
  ctx.arc(13.0, -4.8, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * 🌀 뼈다귀 쪽은 선명하고, 꼬리 끝으로 갈수록 가늘어지며 투명해지는 회전 후류 바람 아크
 * - 유저 요청: "회전선이 뼈다귀쪽에 가까운건 투명할필요는없어"
 * - 뼈다귀 헤드 근처: alpha 0.65, lineWidth 1.6px 선명하게 시작
 * - 후류 꼬리 끝: alpha 0.0, lineWidth 0.5px 가늘어지며 자연스럽게 페이드아웃
 */
function drawTaperedWindArc(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  headAngle: number,
  sweepAngle: number,
  spinDir: number = 1,
  maxAlpha: number = 0.65
) {
  const segments = 10;
  const segStep = sweepAngle / segments;

  for (let s = 0; s < segments; s++) {
    const t1 = s / segments;
    const t2 = (s + 1) / segments;
    const midT = (t1 + t2) * 0.5;

    // t=0 (뼈다귀 쪽) -> 100% 선명 (maxAlpha)
    // t=1 (후류 꼬리 끝) -> 0% 투명 페이드아웃
    const alpha = Math.max(0, Math.pow(1.0 - midT, 1.25) * maxAlpha);
    if (alpha <= 0.01) continue;

    // 뼈다귀 쪽은 도톰하고(1.6px), 꼬리 끝은 가늘어짐(0.5px)
    const lw = 0.5 + Math.pow(1.0 - midT, 0.9) * 1.1;

    // 뼈다귀 헤드에서 회전 반대 방향(후류)으로 꼬리 전개
    const a1 = headAngle - s * segStep * spinDir;
    const a2 = headAngle - (s + 1) * segStep * spinDir;

    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = lw;
    ctx.lineCap = "round";
    ctx.beginPath();
    const startA = Math.min(a1, a2);
    const endA = Math.max(a1, a2);
    ctx.arc(cx, cy, radius, startA, endA);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * 궤적 포물선 위치 계산 헬퍼
 */
export function getBoneParabolaPos(
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  t: number,
  arcHeight: number = 85
) {
  const clampedT = Math.max(0, Math.min(1.0, t));
  const x = startX + (targetX - startX) * clampedT;
  const linearY = startY + (targetY - startY) * clampedT;
  const arcY = Math.sin(clampedT * Math.PI) * arcHeight;
  return { x, y: linearY - arcY };
}

/**
 * 125: 뼈다귀치기 (Bone Club) 후방 레이어 렌더러
 */
export function drawBoneClubBehindEffect(
  _ctx: any,
  _attackerPosOrFrame: any,
  _targetPosOrDrawCtx: any,
  _moveStep?: number,
  _progress?: number,
  _isPlayer?: boolean
) {
  // 후방 레이어는 기본 투명 (전면에서 타격 및 비행 처리)
}

/**
 * 125: 뼈다귀치기 (Bone Club) 전면 레이어 렌더러
 *
 * 연출 구성 (유저 요청 100% 반영):
 * 1. [시전자 투척 와인드업] 시전자 손에서 뼈다귀 투척 준비
 * 2. [포물선 회전 비행] 뼈다귀가 회전하며 포물선을 그리며 상대를 향해 날아감 & 지면 그림자
 * 3. [톡! 타격 순간] 대상 포켓몬 머리에 통 닿음! (몸통박치기 타격 이펙트 & 대상 납작)
 * 4. [오른쪽 튕겨나감 & 더 빠른 회전] 닿은 뼈다귀가 오른쪽으로 튕겨져 나가며 초고속 회전 & 점차 투명해지며 페이드아웃
 */
export function drawBoneClubEffect(
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

  // 투척 시작점 (시전자 손/앞쪽)
  const launchX = ax + (isP ? 34 : -34);
  const launchY = ay - (isP ? 16 : 14);

  // 대상 타격 지점 (대상 머리/상단 부근 - 통 칠 위치)
  const targetHitX = tx + (isP ? -8 : 8);
  const targetHitY = ty - (isP ? 18 : 12);

  const arcHeight = 85;

  // ==========================================================================
  // Step 1: 시전자 투척 와인드업 (시전자 손에서 투척 준비)
  // ==========================================================================
  if (step === 1) {
    const prepRotation = isP ? -0.45 : 0.45;
    drawCartoonBone(ctx, launchX, launchY, prepRotation, 1.15, 1.0, false);
  }

  // ==========================================================================
  // Step 2: 포물선 회전 비행 (상대를 향해 회전하며 날아감)
  // ==========================================================================
  else if (step === 2) {
    const curPos = getBoneParabolaPos(launchX, launchY, targetHitX, targetHitY, p, arcHeight);

    // 1. 바닥 타원형 그림자 추적
    const groundStartY = ay + 24;
    const groundTargetY = ty + 24;
    const shadowY = groundStartY + (groundTargetY - groundStartY) * p;
    const heightFactor = Math.sin(p * Math.PI);
    const shadowAlpha = Math.max(0.12, 0.42 * (1.0 - heightFactor * 0.45));
    const shadowRx = 15 * (1.0 - heightFactor * 0.35);
    const shadowRy = 6.5 * (1.0 - heightFactor * 0.35);

    ctx.save();
    ctx.fillStyle = `rgba(20, 24, 39, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(curPos.x, shadowY, shadowRx, shadowRy, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. 회전 각도 (왜건 휠 정지 착시 방지: 프레임당 약 75°씩 완벽 회전하여 뚜렷한 회전감 구현)
    const spinDir = isP ? 1 : -1;
    const spinAngle = p * Math.PI * 2.8 * spinDir;

    // 3. 고속 회전 뼈다귀 렌더링 (모션 블러 잔상 포함)
    drawCartoonBone(ctx, curPos.x, curPos.y, spinAngle, 1.15, 1.0, true);

    // 4. 고속 회전 바람 아크 (뼈다귀 쪽은 선명하고, 꼬리 끝만 가늘어지며 투명해짐)
    const windRadius = 19;
    drawTaperedWindArc(ctx, curPos.x, curPos.y, windRadius, spinAngle, Math.PI * 0.45, spinDir, 0.65);
    drawTaperedWindArc(ctx, curPos.x, curPos.y, windRadius, spinAngle + Math.PI, Math.PI * 0.45, spinDir, 0.65);
  }

  // ==========================================================================
  // Step 3: 톡! 타격 순간 (대상 머리에 닿아 통 치고 몸통박치기 타격 이펙트 발동)
  // ==========================================================================
  else if (step === 3) {
    // 1. 정통 몸통박치기 타격 이펙트 (스타버스트 섬광, 충격파 링, 스파크 별빛, 속도선)
    drawTackleEffect(ctx, { x: targetHitX, y: targetHitY }, { x: launchX, y: launchY }, 3, p * 0.5, isP);

    // 2. 타격 순간 딱 멈칫 닿아있는 뼈다귀 (임팩트 순간의 틸트)
    const impactRot = isP ? 0.65 : -0.65;
    drawCartoonBone(ctx, targetHitX, targetHitY, impactRot, 1.25, 1.0, false);
  }

  // ==========================================================================
  // Step 4: 오른쪽으로 튕겨져 나가면서 더 빠른 회전 & 점차 투명해지며 페이드아웃
  // ==========================================================================
  else if (step === 4) {
    const bounceProg = p; // 0.0 ~ 1.0

    // 1. 닿은 뼈다귀는 오른쪽으로 튕겨져 나감 (우상향 솟구침 -> 우하향 바운스)
    // 유저 요청: "오른쪽으로 튕겨져 나가면서"
    const bounceX = targetHitX + bounceProg * 88;
    const bounceArcY = Math.sin(bounceProg * Math.PI) * 44;
    const bounceY = targetHitY - bounceArcY + bounceProg * 32;

    // 2. 더 빠른 회전 (각속도 2.5배 급증!)
    const impactRot = isP ? 0.65 : -0.65;
    const rapidSpinAngle = impactRot + bounceProg * Math.PI * 8.5;

    // 3. 점차 투명해지며 페이드아웃
    const fadeAlpha = Math.max(0, 1.0 - Math.pow(bounceProg, 1.25) * 1.05);

    // 4. 타격 이펙트의 잔향 전개
    if (bounceProg < 0.6) {
      drawTackleEffect(ctx, { x: targetHitX, y: targetHitY }, { x: launchX, y: launchY }, 3, 0.5 + bounceProg * 0.5, isP);
    }

    // 5. 초고속 회전하며 튕겨 날아가는 뼈다귀 렌더링
    if (fadeAlpha > 0.02) {
      drawCartoonBone(ctx, bounceX, bounceY, rapidSpinAngle, 1.10, fadeAlpha, true);
    }
  }

  ctx.restore();
}

// ============================================================================
// 126: 불대문자 (Fire Blast / だいもんじ)
// - 특수 / 불꽃 / 위력 110 / 명중 85% / 10% 화상
//
// 연출 흐름 (유저 지침 100% 반영):
// 1. [회전 불꽃 응축] 시전 포켓몬 위치에 회전하는 소용돌이 불꽃 발생 -> 뭉쳐져 거대한 화염구 형성
// 2. [상대방 쇄도 비행] 뭉쳐진 화염구가 상대방 포켓몬을 향해 꼬리 잔상을 남기며 고속 비행 (프레임 넉넉히)
// 3. [5갈래 '大' 분출] 대상 포켓몬 스프라이트 Z축 위에서 중심 폭발하며 5갈래로 뿜어져 나가는 불잔상 한자 큰 대(大) 형성
// 4. ['大' 자 전신 연소 & 소멸] 대상 전면에서 '大' 자 화염이 강렬히 타오르며 피격 점멸 후 서서히 승화 페이드아웃
// ============================================================================

/**
 * 춤추듯 이글거리는 유기적 불꽃 구체 (Blazing Organic Fireball with Flickering Tongues)
 * - 단순한 원형이 아닌, 요동치는 7개의 불꽃 혓바닥(Flame Tongues)과 일렁이는 백열 코어
 */
function drawFlickeringFireball(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  moveAngle: number,
  alpha: number,
  timeSeed: number
) {
  if (alpha <= 0.01 || radius <= 2) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.translate(cx, cy);

  // 1. 사방으로 솟구치며 일렁이는 7개의 유기적 불꽃 혓바닥 (Flickering Flame Tongues)
  // - 원형을 깨부수고 살아 타오르는 불꽃의 실루엣을 만듦!
  const TONGUE_COUNT = 7;
  for (let i = 0; i < TONGUE_COUNT; i++) {
    const tBaseAngle = (i / TONGUE_COUNT) * Math.PI * 2;
    // 프레임마다 불규칙하게 펄럭이는 진폭
    const flicker = Math.sin(timeSeed * 6.5 + i * 2.3) * 0.38;
    const tLen = radius * (1.20 + flicker);
    const tAngle = tBaseAngle + Math.sin(timeSeed * 4.5 + i * 1.7) * 0.25;

    const tTipX = Math.cos(tAngle) * tLen;
    const tTipY = Math.sin(tAngle) * tLen;

    // 불꽃 혓바닥 양옆 베지어 제어점
    const sideAngle1 = tAngle - 0.42;
    const sideAngle2 = tAngle + 0.42;
    const baseR = radius * 0.52;
    const b1x = Math.cos(sideAngle1) * baseR;
    const b1y = Math.sin(sideAngle1) * baseR;
    const b2x = Math.cos(sideAngle2) * baseR;
    const b2y = Math.sin(sideAngle2) * baseR;

    const tGrad = ctx.createRadialGradient(0, 0, 0, tTipX, tTipY, radius * 0.9);
    tGrad.addColorStop(0.0, "#FEF08A");
    tGrad.addColorStop(0.35, "#F97316");
    tGrad.addColorStop(0.70, "#EF4444");
    tGrad.addColorStop(1.0, "rgba(220, 38, 38, 0.0)");

    ctx.fillStyle = tGrad;
    ctx.beginPath();
    ctx.moveTo(b1x, b1y);
    ctx.quadraticCurveTo(tTipX * 0.7 - b1y * 0.35, tTipY * 0.7 + b1x * 0.35, tTipX, tTipY);
    ctx.quadraticCurveTo(tTipX * 0.7 + b2y * 0.35, tTipY * 0.7 - b2x * 0.35, b2x, b2y);
    ctx.closePath();
    ctx.fill();
  }

  // 2. 중심부 초고열 백열 황금 핵 (일렁이는 코어)
  const corePulse = 1.0 + Math.sin(timeSeed * 8.0) * 0.20;
  const coreR = radius * 0.60 * corePulse;
  const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
  coreGrad.addColorStop(0.0, "#FFFFFF");
  coreGrad.addColorStop(0.38, "#FEF08A");
  coreGrad.addColorStop(0.75, "#F97316");
  coreGrad.addColorStop(1.0, "rgba(249, 115, 22, 0.0)");

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, coreR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 중심에 하나로 융합되어 타오르는 거대 고열 화염구 (Merged Superheated Fire Core)
 * - 부드러운 다중 투명도 그라데이션과 6개의 일렁이는 화염 로브, 솟구치는 불꽃 혓바닥
 * - 단순한 동그라미(원)가 아닌, 진정한 타오르는 불꽃 덩어리 볼륨감 (십자선 플레어 완전 배제)
 */
function drawMergedFireCore(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  timeSeed: number
) {
  if (progress <= 0) return;
  const p = Math.min(1.0, Math.max(0, progress));

  ctx.save();
  ctx.translate(cx, cy);

  // 성장 반경 (8px -> 28px)
  const coreRadius = (10 + p * 18);
  const coreAlpha = Math.min(1.0, p * 1.5);

  // 1. 외곽 초고열 열기 블룸 (Soft Ambient Heat Bloom) - 투명도 극도로 부드러운 감쇄
  const bloomR = coreRadius * 2.1;
  const bloomGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, bloomR);
  bloomGrad.addColorStop(0.0, `rgba(249, 115, 22, ${0.45 * coreAlpha})`);
  bloomGrad.addColorStop(0.35, `rgba(239, 68, 68, ${0.28 * coreAlpha})`);
  bloomGrad.addColorStop(0.70, `rgba(220, 38, 38, ${0.10 * coreAlpha})`);
  bloomGrad.addColorStop(1.0, "rgba(220, 38, 38, 0.0)");
  ctx.fillStyle = bloomGrad;
  ctx.beginPath();
  ctx.arc(0, 0, bloomR, 0, Math.PI * 2);
  ctx.fill();

  // 2. 6개의 유기적인 뭉게 화염 로브 (Billowing Fire Lobes)
  const LOBE_COUNT = 6;
  for (let l = 0; l < LOBE_COUNT; l++) {
    const lAngle = (l / LOBE_COUNT) * Math.PI * 2 + timeSeed * 3.2;
    const lDist = coreRadius * (0.36 + Math.sin(timeSeed * 5.0 + l) * 0.08);
    const lx = Math.cos(lAngle) * lDist;
    const ly = Math.sin(lAngle) * lDist;
    const lobeR = coreRadius * (0.72 + Math.cos(timeSeed * 4.0 + l * 2) * 0.12);

    const lobeGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lobeR);
    lobeGrad.addColorStop(0.0, `rgba(249, 115, 22, ${0.90 * coreAlpha})`);
    lobeGrad.addColorStop(0.45, `rgba(239, 68, 68, ${0.65 * coreAlpha})`);
    lobeGrad.addColorStop(0.80, `rgba(220, 38, 38, ${0.25 * coreAlpha})`);
    lobeGrad.addColorStop(1.0, "rgba(220, 38, 38, 0.0)");

    ctx.fillStyle = lobeGrad;
    ctx.beginPath();
    ctx.arc(lx, ly, lobeR, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. 중심에서 위로 일렁이며 피어오르는 5개의 불꽃 혓바닥 (Rising Flame Tendrils)
  for (let t = 0; t < 5; t++) {
    const tBaseAngle = -Math.PI * 0.5 + (t - 2) * 0.42;
    const flicker = Math.sin(timeSeed * 7.0 + t * 2.5) * 0.35;
    const tLen = coreRadius * (1.25 + flicker);
    const tAngle = tBaseAngle + Math.sin(timeSeed * 4.5 + t) * 0.20;

    const tTipX = Math.cos(tAngle) * tLen;
    const tTipY = Math.sin(tAngle) * tLen;

    const tGrad = ctx.createRadialGradient(0, 0, 0, tTipX, tTipY, coreRadius * 0.85);
    tGrad.addColorStop(0.0, `rgba(254, 240, 138, ${0.95 * coreAlpha})`);
    tGrad.addColorStop(0.40, `rgba(249, 115, 22, ${0.75 * coreAlpha})`);
    tGrad.addColorStop(0.75, `rgba(239, 68, 68, ${0.35 * coreAlpha})`);
    tGrad.addColorStop(1.0, "rgba(239, 68, 68, 0.0)");

    const sideR = coreRadius * 0.45;
    const b1x = Math.cos(tAngle - 0.45) * sideR;
    const b1y = Math.sin(tAngle - 0.45) * sideR;
    const b2x = Math.cos(tAngle + 0.45) * sideR;
    const b2y = Math.sin(tAngle + 0.45) * sideR;

    ctx.fillStyle = tGrad;
    ctx.beginPath();
    ctx.moveTo(b1x, b1y);
    ctx.quadraticCurveTo(tTipX * 0.65 - b1y * 0.3, tTipY * 0.65 + b1x * 0.3, tTipX, tTipY);
    ctx.quadraticCurveTo(tTipX * 0.65 + b2y * 0.3, tTipY * 0.65 - b2x * 0.3, b2x, b2y);
    ctx.closePath();
    ctx.fill();
  }

  // 4. 중심 초고열 백열 플라즈마 핵 (White-Hot Plasma Core)
  const pulse = 1.0 + Math.sin(timeSeed * 9.0) * 0.15;
  const innerR = coreRadius * 0.58 * pulse;
  const innerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, innerR);
  innerGrad.addColorStop(0.0, `rgba(255, 255, 255, ${1.0 * coreAlpha})`);
  innerGrad.addColorStop(0.35, `rgba(254, 240, 138, ${0.95 * coreAlpha})`);
  innerGrad.addColorStop(0.70, `rgba(249, 115, 22, ${0.60 * coreAlpha})`);
  innerGrad.addColorStop(1.0, "rgba(249, 115, 22, 0.0)");

  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.arc(0, 0, innerR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Step 1: 화염이 시전 포켓몬을 둥글게 회전함 (Caster 2-Revolution Orbiting Fire)
 * - 유저 요구: "2바퀴로 하되 불이 너무 빨리 돈다", "불이 이글거리는것처럼",
 *              "십자선 별은 제거하고 불꽃 뒷부분이 회전하되 기체처럼 위로 올라가게",
 *              "모여지는 화염도 투명도그라데이션 잘 적용해서"
 * - 춤추듯 이글거리는 불꽃 혓바닥과 꼬리가 시전 포켓몬 둘레를 2.05바퀴 우아하게 공전
 * - 2바퀴 막바지(p > 0.75)에 나선형으로 중심으로 빨려들어가며 거대한 초고열 화염구로 융합
 */
export function drawCasterFireOrbit(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  layer: "behind" | "front",
  isPlayer: boolean
) {
  if (progress <= 0) return;
  const p = Math.min(1.0, Math.max(0, progress));

  ctx.save();

  // 1. 3D 타원 공전 궤도 파라미터 (rx: 48px, ry: 21px)
  // p > 0.75부터 회전하던 불꽃들이 나선형으로 중심을 향해 빨려들어감 (Inward Spiral)
  const spiralConvergence = p > 0.75 ? Math.max(0.20, 1.0 - Math.pow((p - 0.75) / 0.25, 1.25) * 0.80) : 1.0;
  const rx = 48 * spiralConvergence;
  const ry = 21 * spiralConvergence;
  const centerY = cy - 4;

  const spinDir = isPlayer ? 1 : -1;
  const totalSpin = p * Math.PI * 2 * 2.05 * spinDir;

  // 2개의 화염구: #1 메인 대형 화염구(0도, 반경 20px), #2 보조 화염구(180도, 반경 12px)
  // 중심으로 빨려들어갈 때 본체 크기는 중심 코어와 융합되며 자연스럽게 축소
  const orbScaleFactor = p > 0.80 ? Math.max(0.3, 1.0 - (p - 0.80) / 0.20 * 0.7) : 1.0;
  const ORB_CONFIGS = [
    { offsetAngle: 0,           radius: 20 * orbScaleFactor, isMain: true },
    { offsetAngle: Math.PI,     radius: 12 * orbScaleFactor, isMain: false },
  ];

  // 2. [동적 바닥 광원] 불이 광원이므로 회전하는 각 화염구의 실시간 위치 아래 바닥에 부드러운 조명 스팟 투영
  for (let k = 0; k < ORB_CONFIGS.length; k++) {
    const cfg = ORB_CONFIGS[k];
    const orbAngle = totalSpin + cfg.offsetAngle * spinDir;
    const z = Math.sin(orbAngle);
    const isFront = z >= -0.05;

    if (layer === "behind" && isFront) continue;
    if (layer === "front" && !isFront) continue;

    const ox = cx + Math.cos(orbAngle) * rx;
    const groundY = cy + 18 + z * 5;

    const depthRatio = (z + 1) / 2;
    const lightAlpha = Math.min(0.65, (0.40 + depthRatio * 0.35) * Math.min(1.0, p * 2.5));
    const lightRx = (cfg.isMain ? 34 : 20) * (0.85 + depthRatio * 0.30) * spiralConvergence;
    const lightRy = (cfg.isMain ? 13 : 8) * (0.85 + depthRatio * 0.30) * spiralConvergence;

    const lightGrad = ctx.createRadialGradient(ox, groundY, 0, ox, groundY, lightRx);
    lightGrad.addColorStop(0.0, `rgba(254, 240, 138, ${lightAlpha * 0.85})`);
    lightGrad.addColorStop(0.35, `rgba(249, 115, 22, ${lightAlpha * 0.55})`);
    lightGrad.addColorStop(0.70, `rgba(239, 68, 68, ${lightAlpha * 0.22})`);
    lightGrad.addColorStop(1.0, "rgba(220, 38, 38, 0.0)");

    ctx.fillStyle = lightGrad;
    ctx.beginPath();
    ctx.ellipse(ox, groundY, lightRx, lightRy, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. 회전하는 화염구 및 기체처럼 위로 피어오르는 꼬리 렌더링
  for (let k = 0; k < ORB_CONFIGS.length; k++) {
    const cfg = ORB_CONFIGS[k];
    const orbAngle = totalSpin + cfg.offsetAngle * spinDir;
    const z = Math.sin(orbAngle);
    const isFront = z >= -0.05;

    if (layer === "behind" && isFront) continue;
    if (layer === "front" && !isFront) continue;

    const ox = cx + Math.cos(orbAngle) * rx;
    const oy = centerY + Math.sin(orbAngle) * ry;

    const depthRatio = (z + 1) / 2;
    const depthScale = 0.82 + depthRatio * 0.43;
    const orbAlpha = Math.min(1.0, (0.78 + depthRatio * 0.22) * Math.min(1.0, p * 3.0));

    // A. 열대류 부력으로 상공으로 피어오르는 기체 화염 꼬리
    const TRAIL_NODES = cfg.isMain ? 11 : 7;
    for (let t = TRAIL_NODES; t >= 1; t--) {
      const tu = t / TRAIL_NODES;
      const tAngle = orbAngle - tu * 0.90 * spinDir;
      const baseTx = cx + Math.cos(tAngle) * rx;
      const baseTy = centerY + Math.sin(tAngle) * ry;
      const tz = Math.sin(tAngle);

      const tIsFront = tz >= -0.05;
      if (layer === "behind" && tIsFront) continue;
      if (layer === "front" && !tIsFront) continue;

      const upwardLift = Math.pow(tu, 1.15) * (cfg.isMain ? 24 : 15);
      const waftX = Math.sin(totalSpin * 3.5 + t * 1.4) * (tu * 5.0);

      const tx = baseTx + waftX;
      const ty = baseTy - upwardLift;

      const tR = (cfg.radius * (0.85 + tu * 0.35)) * depthScale;
      const tAlpha = orbAlpha * Math.pow(1.0 - tu, 0.95) * 0.85;

      drawBillowingFlamePuff(
        ctx,
        tx,
        ty,
        tR,
        -Math.PI * 0.5,
        totalSpin * 3.0 + t,
        tAlpha,
        k * 19 + t
      );

    }

    // B. 이글거리는 화염구 본체
    const orbRadius = cfg.radius * depthScale;
    const fireballTimeSeed = p * 14.0 + k * 3.7;
    drawFlickeringFireball(
      ctx,
      ox,
      oy,
      orbRadius,
      orbAngle + Math.PI * 0.5 * spinDir,
      orbAlpha,
      fireballTimeSeed
    );
  }

  // 4. [Front Layer] 2회전 융합 시점(p > 0.78) 중심 거대 화염구 코어 형성 (부드러운 다중 투명도 그라데이션)
  // - 유저 지침: "모여지는 화염도 똑바로해줘 투명도그라데이션들 잘 적용해서"
  if (layer === "front" && p > 0.78) {
    const centerProg = (p - 0.78) / 0.22;
    const timeSeed = p * 16.0;
    drawMergedFireCore(ctx, cx, centerY, centerProg, timeSeed);
  }

  ctx.restore();
}

/**
 * Step 2: 하나로 뭉쳐진 고밀도 화염구가 상대방을 향해 쇄도 비행
 * - 비행 궤적을 따라 유기적인 꼬리 화염 제트와 불티 잔상 형성
 */
export function drawFireBlastSurgeOrb(
  ctx: any,
  startPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  progress: number,
  isPlayer: boolean
) {
  const p = Math.min(1.0, Math.max(0, progress));

  // 비행 좌표 계산 (약간의 상향 아크로 역동적인 탄도감)
  const curX = startPos.x + (targetPos.x - startPos.x) * p;
  const straightY = startPos.y + (targetPos.y - startPos.y) * p;
  const arcY = -Math.sin(p * Math.PI) * 16;
  const curY = straightY + arcY;

  // 비행 방향 각도
  const dx = targetPos.x - startPos.x;
  const dy = targetPos.y - startPos.y;
  const travelAngle = Math.atan2(dy, dx);

  ctx.save();

  // 1. 지면 비행 그림자 / 열기 반사광
  const groundStartY = startPos.y + 24;
  const groundTargetY = targetPos.y + 24;
  const shadowY = groundStartY + (groundTargetY - groundStartY) * p;
  const shadowGrad = ctx.createRadialGradient(curX, shadowY, 0, curX, shadowY, 36);
  shadowGrad.addColorStop(0.0, "rgba(249, 115, 22, 0.42)");
  shadowGrad.addColorStop(0.6, "rgba(239, 68, 68, 0.22)");
  shadowGrad.addColorStop(1.0, "rgba(220, 38, 38, 0.0)");
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(curX, shadowY, 32, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. 유저가 마음에 들어했던 후방 화염 꼬리 제트 잔상 복원 (5-Step Billowing Flame Puff Trail)
  const TRAIL_STEPS = 5;
  const tailBaseDist = 22;

  for (let t = TRAIL_STEPS; t >= 1; t--) {
    const tu = t / TRAIL_STEPS;
    const trailDeployScale = Math.min(1.0, Math.max(0.2, p / 0.30));
    const tailDist = t * tailBaseDist * trailDeployScale;
    const waveOffset = Math.sin(p * Math.PI * 8 + t * 1.2) * 5.5;

    const tx = curX - Math.cos(travelAngle) * tailDist - Math.sin(travelAngle) * waveOffset;
    const ty = curY - Math.sin(travelAngle) * tailDist + Math.cos(travelAngle) * waveOffset;

    const tailRadius = 24 * (1.0 - tu * 0.45);
    const tailAlpha = (1.0 - tu * 0.82) * 0.95;

    // 유저 요청: "뒷가닥 몇개정도는 중앙노랑"
    // 본체에 가장 가까운 앞쪽 꼬리 퍼프(t === 1)는 중앙 노랑 코어를 살려 본체와 자연스럽게 연결하고,
    // 후미 꼬리들(t > 1)은 노란 코어 없이 깊은 주황-적색 가스 연기로 표현
    const noYellow = (t > 1);
    drawBillowingFlamePuff(
      ctx,
      tx,
      ty,
      tailRadius,
      travelAngle + Math.PI,
      p * 12 + t * 1.5,
      tailAlpha,
      t * 11,
      noYellow
    );
  }

  // 3. 메인 고밀도 화염구 본체 (Supercharged Fire Blast Orb)
  // ★ 유저 피드백 완벽 해결:
  // - 원래의 단일 화염구 구조로 복원 (앞에 튀어나온 2번째 노란 구체 완전 제거)
  // - "앞 머리가 불인데 움직임 없이 날아가서 지적한건데":
  //   비행 진행 방향(+X) 앞머리에 살아 숨쉬며 펄럭이고 일렁이는 유기적 화염 혓바닥(Flickering Flame Head) 구현!
  const orbRadius = 27;
  const timeSeed = p * 26.0;

  ctx.save();
  ctx.translate(curX, curY);
  ctx.rotate(travelAngle); // +X = 진행 방향(앞머리), -X = 후방(꼬리)

  // A. 외곽 열기 블룸 (Soft Ambient Heat Bloom)
  const bloomGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, orbRadius * 1.5);
  bloomGrad.addColorStop(0.0, "rgba(249, 115, 22, 0.45)");
  bloomGrad.addColorStop(0.45, "rgba(239, 68, 68, 0.25)");
  bloomGrad.addColorStop(0.80, "rgba(220, 38, 38, 0.08)");
  bloomGrad.addColorStop(1.0, "rgba(220, 38, 38, 0.0)");
  ctx.fillStyle = bloomGrad;
  ctx.beginPath();
  ctx.arc(0, 0, orbRadius * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // B. 회전 및 맥동하는 몸체 화염 로브 6개 (Swirling Body Lobes)
  const LOBES = 6;
  for (let l = 0; l < LOBES; l++) {
    const lAngle = (l / LOBES) * Math.PI * 2 + timeSeed * 0.45;
    const lDist = orbRadius * (0.36 + Math.sin(timeSeed * 0.8 + l * 1.5) * 0.08);
    const lx = Math.cos(lAngle) * lDist;
    const ly = Math.sin(lAngle) * lDist;
    const lobeR = orbRadius * (0.68 + Math.cos(timeSeed * 0.7 + l * 2.0) * 0.10);

    const lGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lobeR);
    lGrad.addColorStop(0.0, "rgba(249, 115, 22, 0.90)");
    lGrad.addColorStop(0.48, "rgba(239, 68, 68, 0.65)");
    lGrad.addColorStop(0.85, "rgba(220, 38, 38, 0.25)");
    lGrad.addColorStop(1.0, "rgba(220, 38, 38, 0.0)");

    ctx.fillStyle = lGrad;
    ctx.beginPath();
    ctx.arc(lx, ly, lobeR, 0, Math.PI * 2);
    ctx.fill();
  }

  // C. ★ [유저 피드백] 뒷가닥 몇개정도는 중앙노랑 (Rear Trailing Tendrils with Yellow Center)
  // - 화염구 뒤쪽(-X 방향)으로 맞바람에 젖혀지는 3개의 유기적 불꽃 뒷가닥
  // - 중앙 기저부는 백열 황금빛(#FEF08A), 끝단으로 갈수록 주황 ➔ 적색으로 흩날림
  const REAR_TONGUES = 3;
  for (let r = 0; r < REAR_TONGUES; r++) {
    const rBaseAngle = Math.PI + (r - 1) * 0.38; // 후방 부채꼴
    const rWaver = Math.sin(timeSeed * 1.3 + r * 2.1) * 0.16;
    const rAngle = rBaseAngle + rWaver;

    const rLen = orbRadius * (1.26 + Math.sin(timeSeed * 1.7 + r * 1.8) * 0.24);
    const tipX = Math.cos(rAngle) * rLen;
    const tipY = Math.sin(rAngle) * rLen;

    const sideR = orbRadius * 0.44;
    const b1x = Math.cos(rAngle - 0.36) * sideR;
    const b1y = Math.sin(rAngle - 0.36) * sideR;
    const b2x = Math.cos(rAngle + 0.36) * sideR;
    const b2y = Math.sin(rAngle + 0.36) * sideR;

    const rGrad = ctx.createRadialGradient(0, 0, 0, tipX, tipY, orbRadius * 0.85);
    rGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.95)");
    rGrad.addColorStop(0.28, "#FEF08A"); // ★ 중앙 노랑
    rGrad.addColorStop(0.62, "#F97316");
    rGrad.addColorStop(0.88, "rgba(239, 68, 68, 0.40)");
    rGrad.addColorStop(1.0, "rgba(220, 38, 38, 0.0)");

    ctx.fillStyle = rGrad;
    ctx.beginPath();
    ctx.moveTo(b1x, b1y);
    ctx.quadraticCurveTo(tipX * 0.65 - b1y * 0.3, tipY * 0.65 + b1x * 0.3, tipX, tipY);
    ctx.quadraticCurveTo(tipX * 0.65 + b2y * 0.3, tipY * 0.65 - b2x * 0.3, b2x, b2y);
    ctx.closePath();
    ctx.fill();
  }

  // D. ★ [핵심] 앞머리 불꽃 움직임: 바람을 가르며 맹렬하게 펄럭이고 일렁이는 5개의 전두부 화염 혓바닥
  // - 비행 진행 방향(+X, 정면 ±60도)에서 매 프레임 불규칙하게 요동치며 살아있는 불꽃의 앞머리 실루엣 형성
  const FRONT_TONGUES = 5;
  for (let t = 0; t < FRONT_TONGUES; t++) {
    // -0.60 rad ~ +0.60 rad (전방 부채꼴)
    const baseAngle = -0.58 + (t / (FRONT_TONGUES - 1)) * 1.16;
    // 프레임에 따라 빠르고 불규칙하게 펄럭이는 진폭
    const waver = Math.sin(timeSeed * 1.2 + t * 2.4) * 0.16;
    const tAngle = baseAngle + waver;

    // 혓바닥 길이도 프레임마다 신축
    const flickerLen = orbRadius * (1.18 + Math.sin(timeSeed * 1.5 + t * 2.1) * 0.28);
    const tipX = Math.cos(tAngle) * flickerLen;
    const tipY = Math.sin(tAngle) * flickerLen;

    // 혓바닥 베지어 양옆 제어점
    const sideA1 = tAngle - 0.35;
    const sideA2 = tAngle + 0.35;
    const rootR = orbRadius * 0.52;
    const b1x = Math.cos(sideA1) * rootR;
    const b1y = Math.sin(sideA1) * rootR;
    const b2x = Math.cos(sideA2) * rootR;
    const b2y = Math.sin(sideA2) * rootR;

    const tGrad = ctx.createRadialGradient(0, 0, 0, tipX, tipY, orbRadius * 0.85);
    tGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.95)");
    tGrad.addColorStop(0.25, "#FEF08A");
    tGrad.addColorStop(0.55, "#F97316");
    tGrad.addColorStop(0.85, "rgba(239, 68, 68, 0.45)");
    tGrad.addColorStop(1.0, "rgba(220, 38, 38, 0.0)");

    ctx.fillStyle = tGrad;
    ctx.beginPath();
    ctx.moveTo(b1x, b1y);
    ctx.quadraticCurveTo(tipX * 0.65 - b1y * 0.3, tipY * 0.65 + b1x * 0.3, tipX, tipY);
    ctx.quadraticCurveTo(tipX * 0.65 + b2y * 0.3, tipY * 0.65 - b2x * 0.3, b2x, b2y);
    ctx.closePath();
    ctx.fill();
  }

  // D. 단 하나의 중심 초고열 백열 황금 핵 (White-Hot Core at Center 0, 0)
  // - 앞에 가짜 원을 덧그리지 않고, 중심(0, 0)에서만 강렬히 맥동
  const corePulse = 1.0 + Math.sin(timeSeed * 1.6) * 0.14;
  const coreR = orbRadius * 0.60 * corePulse;
  const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
  coreGrad.addColorStop(0.0, "#FFFFFF");
  coreGrad.addColorStop(0.38, "#FEF08A");
  coreGrad.addColorStop(0.72, "#F97316");
  coreGrad.addColorStop(1.0, "rgba(249, 115, 22, 0.0)");

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, coreR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // end of translate(curX, curY) & rotate(travelAngle)

  ctx.restore();
}

/**
 * 🔥 #24 프레임 5갈래 끝단 화염 헤드 (발사되는 불 앞머리 구조와 동일)
 */
function drawKanjiBranchFlameHead(
  ctx: any,
  x: number,
  y: number,
  angle: number,
  radius: number,
  timeSeed: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || radius <= 2) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, ctx.globalAlpha * alpha));
  ctx.translate(x, y);
  ctx.rotate(angle); // +X = 바깥 방향(앞머리), -X = 중심 방향

  // A. 외곽 열기 블룸
  const bloomGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.5);
  bloomGrad.addColorStop(0.0, "rgba(249, 115, 22, 0.45)");
  bloomGrad.addColorStop(0.45, "rgba(239, 68, 68, 0.25)");
  bloomGrad.addColorStop(0.80, "rgba(220, 38, 38, 0.08)");
  bloomGrad.addColorStop(1.0, "rgba(220, 38, 38, 0.0)");
  ctx.fillStyle = bloomGrad;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // B. 몸체 화염 로브 6개
  const LOBES = 6;
  for (let l = 0; l < LOBES; l++) {
    const lAngle = (l / LOBES) * Math.PI * 2 + timeSeed * 0.45;
    const lDist = radius * (0.36 + Math.sin(timeSeed * 0.8 + l * 1.5) * 0.08);
    const lx = Math.cos(lAngle) * lDist;
    const ly = Math.sin(lAngle) * lDist;
    const lobeR = radius * (0.68 + Math.cos(timeSeed * 0.7 + l * 2.0) * 0.10);

    const lGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lobeR);
    lGrad.addColorStop(0.0, "rgba(249, 115, 22, 0.90)");
    lGrad.addColorStop(0.48, "rgba(239, 68, 68, 0.65)");
    lGrad.addColorStop(0.85, "rgba(220, 38, 38, 0.25)");
    lGrad.addColorStop(1.0, "rgba(220, 38, 38, 0.0)");

    ctx.fillStyle = lGrad;
    ctx.beginPath();
    ctx.arc(lx, ly, lobeR, 0, Math.PI * 2);
    ctx.fill();
  }

  // C. 중심 방향으로 뻗는 뒷가닥 3개 (중앙 노랑)
  const REAR_TONGUES = 3;
  for (let r = 0; r < REAR_TONGUES; r++) {
    const rBaseAngle = Math.PI + (r - 1) * 0.38;
    const rWaver = Math.sin(timeSeed * 1.3 + r * 2.1) * 0.16;
    const rAngle = rBaseAngle + rWaver;

    const rLen = radius * (1.26 + Math.sin(timeSeed * 1.7 + r * 1.8) * 0.24);
    const tipX = Math.cos(rAngle) * rLen;
    const tipY = Math.sin(rAngle) * rLen;

    const sideR = radius * 0.44;
    const b1x = Math.cos(rAngle - 0.36) * sideR;
    const b1y = Math.sin(rAngle - 0.36) * sideR;
    const b2x = Math.cos(rAngle + 0.36) * sideR;
    const b2y = Math.sin(rAngle + 0.36) * sideR;

    const rGrad = ctx.createRadialGradient(0, 0, 0, tipX, tipY, radius * 0.85);
    rGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.95)");
    rGrad.addColorStop(0.28, "#FEF08A");
    rGrad.addColorStop(0.62, "#F97316");
    rGrad.addColorStop(0.88, "rgba(239, 68, 68, 0.40)");
    rGrad.addColorStop(1.0, "rgba(220, 38, 38, 0.0)");

    ctx.fillStyle = rGrad;
    ctx.beginPath();
    ctx.moveTo(b1x, b1y);
    ctx.quadraticCurveTo(tipX * 0.65 - b1y * 0.3, tipY * 0.65 + b1x * 0.3, tipX, tipY);
    ctx.quadraticCurveTo(tipX * 0.65 + b2y * 0.3, tipY * 0.65 - b2x * 0.3, b2x, b2y);
    ctx.closePath();
    ctx.fill();
  }

  // D. 바깥쪽으로 맹렬하게 펄럭이는 5개의 화염 혓바닥
  const FRONT_TONGUES = 5;
  for (let t = 0; t < FRONT_TONGUES; t++) {
    const baseAngle = -0.58 + (t / (FRONT_TONGUES - 1)) * 1.16;
    const waver = Math.sin(timeSeed * 1.2 + t * 2.4) * 0.16;
    const tAngle = baseAngle + waver;

    const flickerLen = radius * (1.18 + Math.sin(timeSeed * 1.5 + t * 2.1) * 0.28);
    const tipX = Math.cos(tAngle) * flickerLen;
    const tipY = Math.sin(tAngle) * flickerLen;

    const sideA1 = tAngle - 0.35;
    const sideA2 = tAngle + 0.35;
    const rootR = radius * 0.52;
    const b1x = Math.cos(sideA1) * rootR;
    const b1y = Math.sin(sideA1) * rootR;
    const b2x = Math.cos(sideA2) * rootR;
    const b2y = Math.sin(sideA2) * rootR;

    const tGrad = ctx.createRadialGradient(0, 0, 0, tipX, tipY, radius * 0.85);
    tGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.95)");
    tGrad.addColorStop(0.25, "#FEF08A");
    tGrad.addColorStop(0.55, "#F97316");
    tGrad.addColorStop(0.85, "rgba(239, 68, 68, 0.45)");
    tGrad.addColorStop(1.0, "rgba(220, 38, 38, 0.0)");

    ctx.fillStyle = tGrad;
    ctx.beginPath();
    ctx.moveTo(b1x, b1y);
    ctx.quadraticCurveTo(tipX * 0.65 - b1y * 0.3, tipY * 0.65 + b1x * 0.3, tipX, tipY);
    ctx.quadraticCurveTo(tipX * 0.65 + b2y * 0.3, tipY * 0.65 - b2x * 0.3, b2x, b2y);
    ctx.closePath();
    ctx.fill();
  }

  // E. 중심 초고열 백열 황금 핵
  const corePulse = 1.0 + Math.sin(timeSeed * 1.6) * 0.14;
  const coreR = radius * 0.60 * corePulse;
  const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
  coreGrad.addColorStop(0.0, "#FFFFFF");
  coreGrad.addColorStop(0.38, "#FEF08A");
  coreGrad.addColorStop(0.72, "#F97316");
  coreGrad.addColorStop(1.0, "rgba(249, 115, 22, 0.0)");

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, coreR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

interface KanjiBranchDef {
  id: string;
  angle: number;
  len: number;
  tipR: number;
}

/**
 * 한자 '大' 자 5갈래 기하학 정의
 * - 상단 세로획, 좌우 가로획, 좌하단 삐침, 우하단 파임
 */
const KANJI_5_BRANCHES: KanjiBranchDef[] = [
  { id: "top",       angle: -Math.PI * 0.50, len: 65, tipR: 24 }, // 상단 기둥
  { id: "left-arm",  angle: Math.PI * 0.97,  len: 75, tipR: 24 }, // 좌측 팔
  { id: "right-arm", angle: -0.03,           len: 75, tipR: 24 }, // 우측 팔
  { id: "left-leg",  angle: Math.PI * 0.68,  len: 86, tipR: 26 }, // 좌하단 삐침 다리
  { id: "right-leg", angle: Math.PI * 0.32,  len: 86, tipR: 26 }, // 우하단 파임 다리
];

/**
 * 한자 '大' 자 5갈래 중 하나의 획 렌더링
 * - 중심(cx, cy)에서 바깥쪽 끝단(ex, ey)으로 뻗어나가며
 * - 유기적인 연결 화염 퍼프 2개 + 끝단에 '발사되는 불 앞머리(Flame Head)' 배치!
 * - 안쪽부터 사라지는 연출: 줄기 퍼프(stemAlpha)와 끝단 머리(headAlpha)의 알파를 독립 제어
 */
function drawKanjiBranchWithFlameHead(
  ctx: any,
  cx: number,
  cy: number,
  branch: KanjiBranchDef,
  growthProgress: number,
  stemAlpha: number,
  headAlpha: number,
  timeSeed: number
) {
  const curLen = branch.len * growthProgress;
  if (curLen <= 3 || (stemAlpha <= 0.01 && headAlpha <= 0.01)) return;

  const cosA = Math.cos(branch.angle);
  const sinA = Math.sin(branch.angle);
  const ex = cx + cosA * curLen;
  const ey = cy + sinA * curLen;

  ctx.save();

  // 1. 유저 요청: "불대문자 퍼질 때 화염꼬리 (발사되는 불 꼬리부분) 좀 넣어볼까"
  // 발사되는 불 꼬리와 동일하게, 5갈래 끝단 머리(ex, ey) 뒤로 중심(cx, cy)을 향해 뻗어 나가는 다단계 화염 꼬리 제트 (drawBillowingFlamePuff)
  if (stemAlpha > 0.01) {
    const TRAIL_STEPS = 4;
    for (let t = 1; t <= TRAIL_STEPS; t++) {
      const tu = t / (TRAIL_STEPS + 0.5); // 0.22, 0.44, 0.66, 0.88
      const puffFade = (tu > 0.6) ? stemAlpha : Math.min(1.0, stemAlpha * 1.25);
      if (puffFade <= 0.01) continue;

      // 머리(ex, ey)에서 중심(cx, cy) 방향으로 tailDist만큼 떨어진 위치
      const tailDist = curLen * tu;
      const waveOffset = Math.sin(timeSeed * 2.8 + t * 1.4) * (3.5 * growthProgress);
      const px = ex - cosA * tailDist - Math.sin(branch.angle) * waveOffset;
      const py = ey - sinA * tailDist + Math.cos(branch.angle) * waveOffset;

      // 머리에 가까울수록 크고 풍만하며, 안쪽으로 갈수록 가늘어지는 꼬리 테이퍼링
      const puffR = (branch.tipR * (0.95 - tu * 0.35)) * Math.min(1.0, 0.65 + growthProgress * 0.35);

      // 머리에 가까운 꼬리(tu <= 0.55)는 백열 황금빛 코어 활성화, 안쪽은 고열 주황-적색
      const noYellow = (tu > 0.55);

      // 머리가 branch.angle로 나아가므로 꼬리 퍼프는 중심 반대쪽(branch.angle + PI)으로 뿜어짐
      drawBillowingFlamePuff(
        ctx,
        px,
        py,
        puffR,
        branch.angle + Math.PI,
        timeSeed * 2.2 + t * 1.6,
        puffFade * (1.0 - tu * 0.25),
        t * 13 + Math.floor(timeSeed),
        noYellow
      );

      // 줄기 내부를 밝히는 부드러운 고열 황금빛 코어 보강
      const stemCoreR = puffR * 0.46;
      const stemCoreGrad = ctx.createRadialGradient(px, py, 0, px, py, stemCoreR);
      stemCoreGrad.addColorStop(0.0, `rgba(255, 255, 255, ${0.95 * puffFade})`);
      stemCoreGrad.addColorStop(0.35, `rgba(254, 240, 138, ${0.90 * puffFade})`);
      stemCoreGrad.addColorStop(0.70, `rgba(249, 115, 22, ${0.60 * puffFade})`);
      stemCoreGrad.addColorStop(1.0, "rgba(249, 115, 22, 0.0)");
      ctx.fillStyle = stemCoreGrad;
      ctx.beginPath();
      ctx.arc(px, py, stemCoreR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. 끝단의 맹렬한 발사 화염구 앞머리 (Flickering Flame Head pointing outward)
  if (headAlpha > 0.01) {
    const headRadius = branch.tipR * Math.min(1.0, 0.65 + growthProgress * 0.35);
    drawKanjiBranchFlameHead(
      ctx,
      ex,
      ey,
      branch.angle,
      headRadius,
      timeSeed,
      headAlpha
    );
  }

  ctx.restore();
}

/**
 * Step 3 & 4: 대상 포켓몬 스프라이트 Z축 위에서 5갈래로 뿜어지며
 * 웅장한 한자 '大' 자를 형성하고 활활 타오른 뒤 소멸
 * - 유저 요청:
 *   1) "큰 대로 뻗어나가는 거" -> 중심 폭발 직후 5갈래가 시원하게 바깥으로 뿜어져 나감
 *   2) "큰 대인상태로 좀 유지되다가 안쪽부터 사라지는거 만들어주고"
 *      -> p <= 0.48 동안 100% 형태 유지, 그 후 중심 코어/줄기부터 먼저 소멸하고 끝단 5개 머리가 마지막까지 잔류
 */
export function drawFireBlastKanjiDai(
  ctx: any,
  cx: number,
  cy: number,
  step: number,
  progress: number,
  isPlayer: boolean
) {
  const p = Math.min(1.0, Math.max(0, progress));

  // 대상 포켓몬 전면에서 완벽한 상하 밸런스를 위해 교차점을 살짝 상단으로 조정
  const centerCy = cy - 6;

  ctx.save();

  // ==========================================================================
  // Step 3: 직격 순간 중심 대폭발 & 5갈래 화염이 순식간에 뿜어져 나가며 '大' 자 형성
  // ==========================================================================
  if (step === 3) {
    // 5갈래가 중심에서 바깥으로 힘차게 뿜어져 뻗어나가는 성장 진행도
    const growthProgress = Math.min(1.0, Math.max(0.18, Math.pow(p, 0.90)));
    const timeSeed = p * 8.0;

    // 1. 5갈래 두툼한 화염 획 및 끝단 화염 헤드 렌더링 (뻗어나감)
    for (let b = 0; b < KANJI_5_BRANCHES.length; b++) {
      const branch = KANJI_5_BRANCHES[b];
      drawKanjiBranchWithFlameHead(
        ctx,
        cx,
        centerCy,
        branch,
        growthProgress,
        1.0, // stemAlpha
        1.0, // headAlpha
        timeSeed + b * 2.3
      );
    }

    // 2. 중심 화염 구체
    // 유저 요청:
    // - "구체 #25 굿": #24 직격 순간의 거대 폭발 구체가 #25에서 페이드아웃 진행
    // - "26부터는 기존의 구체크기의 그거 어디감?": #26부터 '기존 구체 크기(R: 24px)' 화염 코어 구체 유지!

    // A. #26부터 안착되는 "기존의 구체 크기" 중심 화염 코어 (R: 24px)
    const baseCoreR = 24;
    const baseCoreGrad = ctx.createRadialGradient(cx, centerCy, 0, cx, centerCy, baseCoreR);
    baseCoreGrad.addColorStop(0.0, "#FFFFFF");
    baseCoreGrad.addColorStop(0.35, "#FEF08A");
    baseCoreGrad.addColorStop(0.68, "#F97316");
    baseCoreGrad.addColorStop(0.90, "#EF4444");
    baseCoreGrad.addColorStop(1.0, "rgba(220, 38, 38, 0.0)");

    ctx.fillStyle = baseCoreGrad;
    ctx.beginPath();
    ctx.arc(cx, centerCy, baseCoreR, 0, Math.PI * 2);
    ctx.fill();

    // B. #24 순간 생성된 거대 폭발 구체 및 충격파 블룸 (#25에서 페이드아웃되고 #26에서 소멸)
    const burstBloomAlpha = p <= 0.28
      ? 1.0
      : Math.max(0, 1.0 - (p - 0.28) / 0.42); // #25(p=0.55)에서 ~0.35로 감쇄, #26(p=0.82)에서 0(소멸)

    if (burstBloomAlpha > 0.01) {
      const burstR = (28 + p * 16) * 1.4;
      const burstGrad = ctx.createRadialGradient(cx, centerCy, 0, cx, centerCy, burstR);
      burstGrad.addColorStop(0.0, `rgba(255, 255, 255, ${burstBloomAlpha * 0.90})`);
      burstGrad.addColorStop(0.35, `rgba(254, 240, 138, ${burstBloomAlpha * 0.75})`);
      burstGrad.addColorStop(0.70, `rgba(249, 115, 22, ${burstBloomAlpha * 0.45})`);
      burstGrad.addColorStop(1.0, "rgba(239, 68, 68, 0.0)");

      ctx.fillStyle = burstGrad;
      ctx.beginPath();
      ctx.arc(cx, centerCy, burstR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ==========================================================================
  // Step 4: 완성된 '大' 자가 활활 타오르며 전신 연소 -> 형태 유지 후 안쪽부터 소멸
  // ==========================================================================
  else if (step === 4) {
    // 유저 요청:
    // 1) "큰 대인상태로 좀 유지되다가": p <= 0.48 동안 100% 형태 유지하며 맹렬 연소
    // 2) "26부터는 기존의 구체크기의 그거": 기존 크기(R: 24~26px) 중심 구체 유지!
    // 3) "안쪽부터 사라지는거": p > 0.48부터 중심 코어와 줄기가 먼저 페이드아웃
    const centerAlpha = p <= 0.48
      ? 1.0
      : Math.max(0, 1.0 - (p - 0.48) / 0.26);

    const stemAlpha = p <= 0.52
      ? 1.0
      : Math.max(0, 1.0 - (p - 0.52) / 0.28);

    const headAlpha = p <= 0.74
      ? 1.0
      : Math.max(0, 1.0 - Math.pow((p - 0.74) / 0.24, 1.15));

    const timeSeed = 6.0 + p * 12.0;

    if (headAlpha > 0.01 || stemAlpha > 0.01) {
      // 1. 5갈래 '大' 자 화염 연소 (줄기는 안쪽부터 소멸, 머리는 오래 잔류)
      for (let b = 0; b < KANJI_5_BRANCHES.length; b++) {
        const branch = KANJI_5_BRANCHES[b];
        drawKanjiBranchWithFlameHead(
          ctx,
          cx,
          centerCy,
          branch,
          1.0,
          stemAlpha,
          headAlpha,
          timeSeed + b * 2.3
        );
      }

      // 2. 유저 요청: "기존의 구체크기의 그거" (안쪽부터 사라지기 전까지 100% 유지)
      if (centerAlpha > 0.01) {
        const coreR = (24 + Math.sin(timeSeed * 2.0) * 2.5) * Math.min(1.0, 0.4 + centerAlpha * 0.6);
        const centerGrad = ctx.createRadialGradient(cx, centerCy, 0, cx, centerCy, coreR);
        centerGrad.addColorStop(0.0, `rgba(255, 255, 255, ${centerAlpha})`);
        centerGrad.addColorStop(0.35, `rgba(254, 240, 138, ${centerAlpha * 0.95})`);
        centerGrad.addColorStop(0.70, `rgba(249, 115, 22, ${centerAlpha * 0.85})`);
        centerGrad.addColorStop(1.0, "rgba(220, 38, 38, 0.0)");

        ctx.fillStyle = centerGrad;
        ctx.beginPath();
        ctx.arc(cx, centerCy, coreR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

/**
 * 유저 요청: "불대문자 끝날 때 그 불꼬리 잔상으로 중, 소 한자모양 1프레임씩 남기면서 사라지게 해줘"
 * 🔥 한자 '中' (Chuu) 화염 꼬리 잔상 렌더러
 * - 불꼬리 잔상(drawBillowingFlamePuff)과 백열 화염 획으로 형성되는 한자 '中'
 */
export function drawFireBlastKanjiChuu(
  ctx: any,
  cx: number,
  cy: number,
  isPlayer: boolean,
  frame?: any
) {
  const centerCy = cy - 6;
  const isSecondFrame = frame?.phaseId === "fire-blast-kanji-chuu-2";
  const timeSeed = isSecondFrame ? 21.0 : 18.5;
  // 유저 요청: "중짜리도 #33부터는 페이드아웃시작" (#32: 1.0 -> #33: 0.58)
  const chuuAlpha = isSecondFrame ? 0.58 : 1.0;

  ctx.save();

  // 유저 요청:
  // 1) "이떄 여기 나타나는 연결 선은 제거" -> 선 일체 없음!
  // 2) "선 없이 불꼬리 잔상만으로 한자형태"
  // 3) "불꽃꼬리에 노란점 있었냐" -> noYellowCore=true
  // 4) "#32부터 등장, #33에서 페이드아웃 시작"
  const CHUU_PUFF_NODES = [
    // 세로 관통선 (위에서 아래로)
    { x: cx, y: centerCy - 38, r: 8.5, angle: -Math.PI * 0.5 },
    { x: cx, y: centerCy - 26, r: 8.0, angle: -Math.PI * 0.5 },
    { x: cx, y: centerCy - 14, r: 7.5, angle: -Math.PI * 0.5 },
    { x: cx, y: centerCy,      r: 8.5, angle: 0 },
    { x: cx, y: centerCy + 14, r: 7.5, angle: Math.PI * 0.5 },
    { x: cx, y: centerCy + 26, r: 8.0, angle: Math.PI * 0.5 },
    { x: cx, y: centerCy + 38, r: 8.5, angle: Math.PI * 0.5 },
    // 네모 상자 윗변 (y = centerCy - 14)
    { x: cx - 20, y: centerCy - 14, r: 8.0, angle: Math.PI * 0.75 },
    { x: cx - 10, y: centerCy - 14, r: 7.5, angle: -Math.PI * 0.5 },
    { x: cx + 10, y: centerCy - 14, r: 7.5, angle: -Math.PI * 0.5 },
    { x: cx + 20, y: centerCy - 14, r: 8.0, angle: -Math.PI * 0.25 },
    // 네모 상자 아랫변 (y = centerCy + 14)
    { x: cx - 20, y: centerCy + 14, r: 8.0, angle: -Math.PI * 0.75 },
    { x: cx - 10, y: centerCy + 14, r: 7.5, angle: Math.PI * 0.5 },
    { x: cx + 10, y: centerCy + 14, r: 7.5, angle: Math.PI * 0.5 },
    { x: cx + 20, y: centerCy + 14, r: 8.0, angle: Math.PI * 0.25 },
    // 네모 상자 좌/우 측면 중간점
    { x: cx - 20, y: centerCy,      r: 7.5, angle: Math.PI },
    { x: cx + 20, y: centerCy,      r: 7.5, angle: 0 },
  ];

  for (let i = 0; i < CHUU_PUFF_NODES.length; i++) {
    const node = CHUU_PUFF_NODES[i];
    drawBillowingFlamePuff(
      ctx,
      node.x,
      node.y,
      node.r,
      node.angle,
      timeSeed + i * 1.5,
      chuuAlpha,
      i * 17 + 5,
      true // noYellowCore = true (노란 점 완전 배제)
    );
  }

  ctx.restore();
}

/**
 * 유저 요청: "소는 34에서 좀 더 작은형태로, 연결 선은 제거, 선 없이 불꼬리 잔상만으로 한자형태, 소는 기본적으로 이전것보다 투명상태"
 * 🔥 한자 '小' (Shou) 화염 꼬리 잔상 렌더러 (초소형 순수 화염 잔상)
 */
export function drawFireBlastKanjiShou(
  ctx: any,
  cx: number,
  cy: number,
  isPlayer: boolean,
  frame?: any
) {
  const centerCy = cy - 6;
  const timeSeed = 26.0;
  // 유저 요청: "소는 기본적으로 이전것(#33: 0.58)보다 투명상태" -> 0.36
  const shouAlpha = 0.36;

  ctx.save();

  // 유저 요청:
  // 1) "소는 34에서 좀 더 작은형태로" -> 중심 갈고리 및 좌우 삐침 전체 스케일 축소 (r: 5.5~6.5px)
  // 2) "연결 선은 제거, 선 없이 불꼬리 잔상만으로 한자형태"
  // 3) "소는 기본적으로 이전것보다 투명상태" -> shouAlpha: 0.36
  const SHOU_PUFF_NODES = [
    // 중심 세로 갈고리 (컴팩트 스케일)
    { x: cx,      y: centerCy - 18, r: 6.5, angle: -Math.PI * 0.5 },
    { x: cx,      y: centerCy - 9,  r: 6.0, angle: -Math.PI * 0.5 },
    { x: cx,      y: centerCy,      r: 6.0, angle: Math.PI * 0.5 },
    { x: cx,      y: centerCy + 9,  r: 6.0, angle: Math.PI * 0.5 },
    { x: cx,      y: centerCy + 18, r: 6.0, angle: Math.PI * 0.5 },
    { x: cx - 7,  y: centerCy + 14, r: 5.0, angle: -Math.PI * 0.75 }, // 갈고리 끝 삐침
    // 좌측 삐침
    { x: cx - 8,  y: centerCy - 2,  r: 5.5, angle: Math.PI * 0.75 },
    { x: cx - 16, y: centerCy + 7,  r: 6.0, angle: Math.PI * 0.75 },
    // 우측 파임
    { x: cx + 8,  y: centerCy - 2,  r: 5.5, angle: Math.PI * 0.25 },
    { x: cx + 16, y: centerCy + 7,  r: 6.0, angle: Math.PI * 0.25 },
  ];

  for (let i = 0; i < SHOU_PUFF_NODES.length; i++) {
    const node = SHOU_PUFF_NODES[i];
    drawBillowingFlamePuff(
      ctx,
      node.x,
      node.y,
      node.r,
      node.angle,
      timeSeed + i * 1.5,
      shouAlpha,
      i * 19 + 7,
      true // noYellowCore = true (노란 점 완전 배제)
    );
  }

  ctx.restore();
}

/**
 * 126: 불대문자 시전 포켓몬 회전 시 전장 붉은 대기/배경 필터 (Behind Layer)
 * - 유저 요청: "회전할 때 화면이 붉게 변하면서 붉은 필터"
 * - 1회전 -> 2회전으로 회전이 진행됨에 따라 전장 배경 전체가 점진적으로 짙은 진홍빛 열기로 물듦
 */
function drawFireBlastRedFilterBehind(
  ctx: any,
  progress: number,
  cx: number,
  cy: number,
  w: number,
  h: number
) {
  if (progress <= 0) return;
  const p = Math.min(1.0, Math.max(0, progress));

  // 회전 진행도에 따른 점진적 붉은 필터 강도 (0.18 -> 1.0)
  const filterProg = Math.min(1.0, 0.18 + Math.pow(p, 0.82) * 0.82);

  ctx.save();

  // 1. 배틀 필드 배경 전역 붉은 색조 워시 (Global Crimson Red Wash)
  ctx.fillStyle = `rgba(220, 38, 38, ${0.40 * filterProg})`;
  ctx.fillRect(-4000, -4000, 10000, 10000);

  // 2. 상공 암적색 ~ 지면 작열 주황 대기 그라데이션 (Atmospheric Heat Depth)
  const vertGrad = ctx.createLinearGradient(0, -300, 0, h + 300);
  vertGrad.addColorStop(0.0, `rgba(185, 28, 28, ${0.35 * filterProg})`); // 깊은 암적색 하늘
  vertGrad.addColorStop(0.5, `rgba(220, 38, 38, ${0.20 * filterProg})`); // 중간 진홍빛
  vertGrad.addColorStop(1.0, `rgba(234, 88, 12, ${0.28 * filterProg})`); // 지면 고열 주황
  ctx.fillStyle = vertGrad;
  ctx.fillRect(-4000, -4000, 10000, 10000);

  // 3. 시전 포켓몬 중심 고열 방사 글로우 (Caster Heat Radiation)
  const casterBloom = ctx.createRadialGradient(cx, cy, 20, cx, cy, 450);
  casterBloom.addColorStop(0.0, `rgba(251, 146, 60, ${0.45 * filterProg})`);
  casterBloom.addColorStop(0.4, `rgba(239, 68, 68, ${0.28 * filterProg})`);
  casterBloom.addColorStop(1.0, "rgba(185, 28, 28, 0.0)");
  ctx.fillStyle = casterBloom;
  ctx.fillRect(-4000, -4000, 10000, 10000);

  ctx.restore();
}

/**
 * 126: 불대문자 Step 3 & 4 '大' 자 전개 시 전장 주황빛 대기/배경 필터 (Behind Layer)
 * - 유저 요청: "큰 대짜 배경 약간 주황빛으로"
 * - Step 1, 2의 붉은 필터에서, Step 3 직격 및 '大' 자 형성 시 작열하는 따뜻한 주황빛(Orange-Amber) 분위기로 전환
 */
function drawFireBlastOrangeFilterBehind(
  ctx: any,
  progress: number,
  tx: number,
  ty: number,
  w: number,
  h: number
) {
  if (progress <= 0) return;
  const p = Math.min(1.0, Math.max(0, progress));

  ctx.save();

  // 1. 배틀 필드 배경 전역 따뜻한 주황빛 워시 (Warm Fiery Orange Atmosphere)
  ctx.fillStyle = `rgba(234, 88, 12, ${0.28 * p})`;
  ctx.fillRect(-4000, -4000, 10000, 10000);

  // 2. 상공 호박빛 앰버 ~ 지면 작열 주황 대기 그라데이션
  const vertGrad = ctx.createLinearGradient(0, -300, 0, h + 300);
  vertGrad.addColorStop(0.0, `rgba(217, 119, 6, ${0.22 * p})`);   // 상공 따뜻한 앰버
  vertGrad.addColorStop(0.45, `rgba(234, 88, 12, ${0.25 * p})`);  // 중간 작열 주황
  vertGrad.addColorStop(1.0, `rgba(249, 115, 22, ${0.28 * p})`);  // 지면 화염 주황 열기
  ctx.fillStyle = vertGrad;
  ctx.fillRect(-4000, -4000, 10000, 10000);

  // 3. '大' 자 중심 주변으로 찬란하게 퍼지는 거대 주황 방사 광륜 (Kanji Orange Bloom)
  const kanjiBloom = ctx.createRadialGradient(tx, ty - 6, 20, tx, ty - 6, 420);
  kanjiBloom.addColorStop(0.0, `rgba(254, 215, 170, ${0.40 * p})`);  // 백황-주황빛 코어 광원
  kanjiBloom.addColorStop(0.25, `rgba(251, 146, 60, ${0.35 * p})`); // 선명한 주황
  kanjiBloom.addColorStop(0.60, `rgba(234, 88, 12, ${0.20 * p})`); // 깊은 주황
  kanjiBloom.addColorStop(1.0, "rgba(194, 65, 12, 0.0)");
  ctx.fillStyle = kanjiBloom;
  ctx.fillRect(-4000, -4000, 10000, 10000);

  ctx.restore();
}

/**
 * 126: 불대문자 시전 포켓몬 회전 시 화면 전면 붉은 필터 (Front Layer)
 * - 포켓몬 스프라이트 및 전장 전면에 은은한 붉은 틴트를 씌워 "화면 전체가 붉게 변함"을 연출
 * - 전면 불꽃 궤도 및 코어가 렌더링되기 직전에 깔려, 불꽃 본체는 선명한 백/황/주황으로 발광 대비 극대화
 */
function drawFireBlastRedFilterFront(
  ctx: any,
  progress: number,
  cx: number,
  cy: number,
  w: number,
  h: number
) {
  if (progress <= 0) return;
  const p = Math.min(1.0, Math.max(0, progress));

  // 회전 진행도에 따른 점진적 전면 필터 강도 (0.15 -> 1.0)
  const filterProg = Math.min(1.0, 0.15 + Math.pow(p, 0.85) * 0.85);
  const frontAlpha = 0.28 * filterProg;

  ctx.save();

  // 1. 화면 전체를 덮는 은은한 진홍빛 렌즈 필터 (Cinematic Red Screen Filter)
  ctx.fillStyle = `rgba(225, 29, 72, ${frontAlpha})`;
  ctx.fillRect(-4000, -4000, 10000, 10000);

  // 2. 화면 테두리 열기 비네팅 (Vignette Heat Perimeter)
  const edgeGrad = ctx.createRadialGradient(
    w * 0.5,
    h * 0.5,
    h * 0.35,
    w * 0.5,
    h * 0.5,
    Math.max(w, h) * 0.95
  );
  edgeGrad.addColorStop(0.0, "rgba(153, 27, 27, 0.0)");
  edgeGrad.addColorStop(0.65, `rgba(185, 28, 28, ${frontAlpha * 0.50})`);
  edgeGrad.addColorStop(1.0, `rgba(127, 29, 29, ${frontAlpha * 0.95})`);
  ctx.fillStyle = edgeGrad;
  ctx.fillRect(-4000, -4000, 10000, 10000);

  ctx.restore();
}

/**
 * 126: 불대문자 Step 3 & 4 '大' 자 전개 시 화면 전면 은은한 주황 필터 (Front Layer)
 * - 화면 전면에 은은한 주황 틴트와 열기 비네팅을 입혀 "배경 약간 주황빛"의 일체감 극대화
 */
function drawFireBlastOrangeFilterFront(
  ctx: any,
  progress: number,
  tx: number,
  ty: number,
  w: number,
  h: number
) {
  if (progress <= 0) return;
  const p = Math.min(1.0, Math.max(0, progress));
  const frontAlpha = 0.20 * p;

  ctx.save();

  // 1. 전면 은은한 주황 렌즈 필터
  ctx.fillStyle = `rgba(249, 115, 22, ${frontAlpha * 0.55})`;
  ctx.fillRect(-4000, -4000, 10000, 10000);

  // 2. 화면 테두리 주황 열기 비네팅
  const edgeGrad = ctx.createRadialGradient(
    w * 0.5,
    h * 0.5,
    h * 0.35,
    w * 0.5,
    h * 0.5,
    Math.max(w, h) * 0.95
  );
  edgeGrad.addColorStop(0.0, "rgba(234, 88, 12, 0.0)");
  edgeGrad.addColorStop(0.70, `rgba(234, 88, 12, ${frontAlpha * 0.55})`);
  edgeGrad.addColorStop(1.0, `rgba(194, 65, 12, ${frontAlpha * 0.90})`);
  ctx.fillStyle = edgeGrad;
  ctx.fillRect(-4000, -4000, 10000, 10000);

  ctx.restore();
}

function drawFireBlastBehindKanjiChuu(ctx: any, cx: number, centerCy: number, frame?: any) {
  const isSecondFrame = frame?.phaseId === "fire-blast-kanji-chuu-2";
  const chuuAlpha = (isSecondFrame ? 0.58 : 1.0) * 0.70;
  const NODES = [
    { x: cx, y: centerCy - 38 },
    { x: cx, y: centerCy + 38 },
    { x: cx, y: centerCy },
    { x: cx - 20, y: centerCy - 14 },
    { x: cx + 20, y: centerCy - 14 },
    { x: cx + 20, y: centerCy + 14 },
    { x: cx - 20, y: centerCy + 14 },
  ];
  for (let i = 0; i < NODES.length; i++) {
    const n = NODES[i];
    drawBillowingFlamePuff(ctx, n.x, n.y, 9, 0, 18.5 + i * 2, chuuAlpha, i * 13, true);
  }
}

function drawFireBlastBehindKanjiShou(ctx: any, cx: number, centerCy: number, frame?: any) {
  const shouAlpha = 0.36 * 0.65;
  const NODES = [
    { x: cx, y: centerCy - 18 },
    { x: cx, y: centerCy + 18 },
    { x: cx - 14, y: centerCy + 6 },
    { x: cx + 14, y: centerCy + 6 },
  ];
  for (let i = 0; i < NODES.length; i++) {
    const n = NODES[i];
    drawBillowingFlamePuff(ctx, n.x, n.y, 6.5, 0, 24.5 + i * 2, shouAlpha, i * 13, true);
  }
}

/**
 * 126: 불대문자 배후 레이어 이펙트 (Background Warmth / Atmosphere)
 */
export function drawFireBlastBehindEffect(
  ctx: any,
  frame: any,
  drawCtx: any
) {
  const step = frame.moveStep ?? 1;
  const p = frame.effectProgress ?? 0.5;
  const isP = drawCtx?.isPlayer ?? true;

  const ax = drawCtx?.attackerPos?.x ?? 80;
  const ay = drawCtx?.attackerPos?.y ?? 110;
  const tx = drawCtx?.targetPos?.x ?? 160;
  const ty = drawCtx?.targetPos?.y ?? 60;
  const cx = drawCtx?.casterPos?.x ?? ax;
  const cy = drawCtx?.casterPos?.y ?? ay;
  const w = drawCtx?.width ?? 580;
  const h = drawCtx?.height ?? 380;

  ctx.save();

  // Step 1: 시전 포켓몬 뒤쪽으로 도는 화염 궤도 (3D Behind Orbit)
  // - 유저 요청: "회전할 때 화면이 붉게 변하면서 붉은 필터"
  if (step === 1) {
    drawFireBlastRedFilterBehind(ctx, p, cx, cy, w, h);
    drawCasterFireOrbit(ctx, cx, cy, p, "behind", isP);
  }
  // Step 2: 쇄도 비행 시 붉은 필터 유지 (화염구가 날아가는 동안 전장 붉은 열기 지속)
  else if (step === 2) {
    drawFireBlastRedFilterBehind(ctx, 1.0, cx, cy, w, h);
  }
  // Step 3: 유저 요청: "큰 대짜 배경 약간 주황빛으로" & "불대문자 퍼질 때 화염꼬리 좀 넣어볼까"
  else if (step === 3) {
    drawFireBlastOrangeFilterBehind(ctx, 1.0, tx, ty, w, h);
    const bgAlpha = Math.min(0.55, p * 0.6);
    if (bgAlpha > 0.01) {
      const bgGrad = ctx.createRadialGradient(tx, ty - 6, 0, tx, ty - 6, 130);
      bgGrad.addColorStop(0.0, `rgba(254, 215, 170, ${bgAlpha * 0.9})`);
      bgGrad.addColorStop(0.35, `rgba(251, 146, 60, ${bgAlpha * 0.7})`);
      bgGrad.addColorStop(0.70, `rgba(234, 88, 12, ${bgAlpha * 0.4})`);
      bgGrad.addColorStop(1.0, "rgba(234, 88, 12, 0.0)");

      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(tx, ty - 6, 130, 0, Math.PI * 2);
      ctx.fill();
    }

    // 유저 요청: "불대문자 퍼질 때 화염꼬리 (발사되는 불 꼬리부분) 좀 넣어볼까"
    // 대상 포켓몬 뒤쪽으로 5갈래로 뿜어져 나가는 후방 화염 꼬리 제트 (drawBillowingFlamePuff)
    const behindCy = ty - 6;
    const growthProgress = Math.min(1.0, Math.max(0.20, Math.pow(p, 0.90)));
    const timeSeed = p * 8.0;

    for (let b = 0; b < KANJI_5_BRANCHES.length; b++) {
      const branch = KANJI_5_BRANCHES[b];
      const bCos = Math.cos(branch.angle);
      const bSin = Math.sin(branch.angle);

      const TRAIL_STEPS = 3;
      for (let s = 1; s <= TRAIL_STEPS; s++) {
        const flareDist = (30 + s * 32) * growthProgress;
        const fx = tx + bCos * flareDist;
        const fy = behindCy + bSin * flareDist;
        const flareR = (20 + s * 5) * Math.min(1.0, 0.65 + growthProgress * 0.35);

        drawBillowingFlamePuff(
          ctx,
          fx,
          fy,
          flareR,
          branch.angle,
          timeSeed * 2.5 + b * 2 + s,
          growthProgress * (1.0 - (s - 1) * 0.18),
          b * 19 + s * 13,
          s > 2
        );
      }
    }
  }
  // Step 4: 유저 요청:
  // 1) "대문자 뒤에는 그 잔상불 있잖아 (발사되는 불 머리부분 말고 꼬리부분참고)"
  // 2) "큰 대짜 배경 약간 주황빛으로"
  // 3) "안쪽부터 사라지는거": 뒤쪽 잔상불도 안쪽(s=1)부터 먼저 소멸
  // 4) "불대문자 끝날 때 그 불꼬리 잔상으로 중, 소 한자모양 1프레임씩 남기면서 사라지게 해줘"
  else if (step === 4) {
    const timeSeed = 6.0 + p * 12.0;
    const bgFilterProg = p <= 0.74 ? 1.0 : Math.max(0, 1.0 - (p - 0.74) / 0.26);

    // 전장 주황빛 대기 필터 유지
    drawFireBlastOrangeFilterBehind(ctx, bgFilterProg, tx, ty, w, h);

    const behindCy = ty - 6;

    // 유저 요청: '中', '小' 한자 잔상 분기
    if (frame.kanjiChar === "中" || frame.phaseId?.includes("chuu")) {
      drawFireBlastBehindKanjiChuu(ctx, tx, behindCy, frame);
    } else if (frame.kanjiChar === "小" || frame.phaseId?.includes("shou")) {
      drawFireBlastBehindKanjiShou(ctx, tx, behindCy, frame);
    } else {
      // 1. 포켓몬 뒤쪽에서 5갈래로 뿜어지는 거대 화염 꼬리 잔상불 (drawBillowingFlamePuff)
      // 안쪽 퍼프(s=1)부터 먼저 소멸하여 안쪽부터 비워지는 효과 구현
      for (let b = 0; b < KANJI_5_BRANCHES.length; b++) {
        const branch = KANJI_5_BRANCHES[b];
        const bCos = Math.cos(branch.angle);
        const bSin = Math.sin(branch.angle);

        // 중심에서 바깥쪽으로 뻗어 나가는 3단계 화염 꼬리 잔상불
        const TRAIL_STEPS = 3;
        for (let s = 1; s <= TRAIL_STEPS; s++) {
          // s=1 (안쪽): p>0.48부터 소멸, s=2: p>0.58부터 소멸, s=3 (바깥쪽): p>0.74까지 유지
          const trailFadeStart = 0.44 + s * 0.10;
          const trailAlpha = p <= trailFadeStart
            ? 1.0
            : Math.max(0, 1.0 - (p - trailFadeStart) / 0.25);
          if (trailAlpha <= 0.01) continue;

          const flareDist = 32 + s * 34;
          const fx = tx + bCos * flareDist;
          const fy = behindCy + bSin * flareDist;
          const flareR = 24 + s * 6;

          // 발사되는 불 꼬리 잔상과 동일하게, 바깥 방향으로 뿜어지는 제트 잔상불
          drawBillowingFlamePuff(
            ctx,
            fx,
            fy,
            flareR,
            branch.angle,
            timeSeed * 2.5 + b * 2 + s,
            trailAlpha * (1.0 - (s - 1) * 0.18),
            b * 19 + s * 13,
            s > 2 // s === 1, 2(줄기 구간)는 황금빛 코어 활성화
          );
        }
      }
    }
  }

  ctx.restore();
}

/**
 * 126: 불대문자 전면 메인 이펙트 (Z축 위 포켓몬 전면 오버레이)
 * - 유저 요청: "대상포켓몬 스프라이트 Z축 위에서 5갈래로 흩어지며 (불잔상을 남기며 (뿜어지는듯한) 한자 큰 대를만듦)"
 */
export function drawFireBlastEffect(
  ctx: any,
  frame: any,
  drawCtx: any
) {
  const step = frame.moveStep ?? 1;
  const p = frame.effectProgress ?? 0.5;
  const isP = drawCtx?.isPlayer ?? true;

  const ax = drawCtx?.attackerPos?.x ?? 80;
  const ay = drawCtx?.attackerPos?.y ?? 110;
  const tx = drawCtx?.targetPos?.x ?? 160;
  const ty = drawCtx?.targetPos?.y ?? 60;
  const cx = drawCtx?.casterPos?.x ?? ax;
  const cy = drawCtx?.casterPos?.y ?? ay;
  const w = drawCtx?.width ?? 580;
  const h = drawCtx?.height ?? 380;

  ctx.save();

  // Step 1: 시전 포켓몬 앞쪽으로 도는 화염 궤도 (3D Front Orbit)
  // - 유저 요청: "회전할 때 화면이 붉게 변하면서 붉은 필터"
  // - 전면 필터를 먼저 깔아 포켓몬과 화면 전체에 붉은 틴트를 입히고, 그 위에 선명한 화염 본체 렌더링
  if (step === 1) {
    drawFireBlastRedFilterFront(ctx, p, cx, cy, w, h);
    drawCasterFireOrbit(ctx, cx, cy, p, "front", isP);
  }
  // Step 2: 뭉쳐진 거대한 화염구가 상대방을 향해 쇄도 비행
  // - 화염구가 날아가는 동안 전장 붉은 필터 지속 & 1단계 융합 코어 위치(cx, cy - 4)에서 정확히 발사
  else if (step === 2) {
    drawFireBlastRedFilterFront(ctx, 1.0, cx, cy, w, h);
    drawFireBlastSurgeOrb(ctx, { x: cx, y: cy - 4 }, { x: tx, y: ty }, p, isP);
  }
  // Step 3 & 4: 대상 포켓몬 스프라이트 Z축 위에서 5갈래 분출 및 한자 '大' 자 형성 / 연소 / '中' & '小' 잔상
  // - 유저 요청: "큰 대짜 배경 약간 주황빛으로" -> 전면에도 은은한 주황 필터 적용
  else if (step === 3 || step === 4) {
    const filterP = step === 3 ? 1.0 : (p <= 0.74 ? 1.0 : Math.max(0, 1.0 - (p - 0.74) / 0.26));
    if (filterP > 0.01) {
      drawFireBlastOrangeFilterFront(ctx, filterP, tx, ty, w, h);
    }

    // 유저 요청: "불대문자 끝날 때 그 불꼬리 잔상으로 중, 소 한자모양 1프레임씩 남기면서 사라지게 해줘"
    if (frame.kanjiChar === "中" || frame.phaseId?.includes("chuu")) {
      drawFireBlastKanjiChuu(ctx, tx, ty, isP, frame);
    } else if (frame.kanjiChar === "小" || frame.phaseId?.includes("shou")) {
      drawFireBlastKanjiShou(ctx, tx, ty, isP, frame);
    } else {
      drawFireBlastKanjiDai(ctx, tx, ty, step, p, isP);
    }
  }

  ctx.restore();
}

// ============================================================================
// 127: 폭포오르기 (Waterfall / たきのぼ리) 렌더러
// - 물 타입 물리 기술 (위력 80, 명중 100%, 20% 풀죽음)
// ============================================================================

/// ============================================================================
// 127: 폭포오르기 (Waterfall / たきのぼり)
//
// 연출 철학 (하이드로펌프 & 파도타기 기술의 정교한 수류 엔진 완전 이식):
// 1. [유저 요구 1]: 발사직전 이펙트 및 발사/돌진 이펙트 완전 배제!
//    - 시전자 위치의 오라/소용돌이/돌진 일체 제거, 오직 기술 발동 후 상대방 위치에서만 이펙트 분출
// 2. [유저 요구 2]: 파워포인트 사다리꼴 도형 느낌 완전 타파!
//    - 하이드로펌프의 초고속 캐비테이션 유속 스트릭(Velocity Streaks), 날카로운 물보라 촉수(Hydro Tendrils),
//      뽀얗고 짙은 수증기 플룸(Vapor Mist), 테두리 없는 유선형 수적(Streamlined Droplets)
//    - 파도타기의 다단계 로열 코발트 블루(#072f6a ~ #0b68e8) 그라데이션 및 유기적 굴곡 베지에 제트 기둥,
//      상단 크레스트 쇄파(Crest Breaker) 포말 헤드
// ============================================================================

/**
 * 하이드로펌프 규격: 테두리(border) 없는 순수 반투명 유체 바디와 스펙큘러 광택을 지닌 유선형 수적
 */
function drawWaterfallDroplet(
  ctx: any,
  x: number,
  y: number,
  vx: number,
  vy: number,
  size: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || size <= 0.5) return;

  const angle = Math.atan2(vy, vx);
  const speed = Math.hypot(vx, vy);
  const stretch = Math.min(2.4, 1.0 + speed * 0.04);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // [유저 요청 엄수]: border 일체 없는 순수 반투명 유체 바디
  const grad = ctx.createLinearGradient(-size * stretch, 0, size * stretch, 0);
  grad.addColorStop(0.0, `rgba(2, 132, 199, ${0.75 * alpha})`);
  grad.addColorStop(0.5, `rgba(56, 189, 248, ${0.88 * alpha})`);
  grad.addColorStop(1.0, `rgba(186, 230, 253, ${0.95 * alpha})`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * stretch, size, 0, 0, Math.PI * 2);
  ctx.fill();

  // 순백 스펙큘러 하이라이트 (유선형 타원 광택)
  ctx.fillStyle = `rgba(255, 255, 255, ${0.88 * alpha})`;
  ctx.beginPath();
  ctx.ellipse(
    size * stretch * 0.35,
    -size * 0.20,
    Math.max(0.7, size * 0.38),
    Math.max(0.4, size * 0.20),
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.restore();
}

/**
 * 5-Lobe 유기적 포말 클러스터 (순백-아쿠아 유체 거품 덩어리)
 */
function drawWaterfallFoamBlob(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number,
  timeSeed: number
) {
  if (alpha <= 0.01 || radius <= 1) return;
  ctx.save();
  ctx.translate(x, y);

  const LOBE_COUNT = 5;
  for (let i = 0; i < LOBE_COUNT; i++) {
    const lAngle = (i / LOBE_COUNT) * Math.PI * 2 + timeSeed * 2.0;
    const lDist = radius * 0.35;
    const lx = Math.cos(lAngle) * lDist;
    const ly = Math.sin(lAngle) * lDist;
    const lR = radius * (0.65 + Math.sin(timeSeed * 3.5 + i) * 0.15);

    const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lR);
    grad.addColorStop(0.0, `rgba(255, 255, 255, ${alpha * 0.95})`);
    grad.addColorStop(0.55, `rgba(224, 242, 254, ${alpha * 0.75})`);
    grad.addColorStop(0.85, `rgba(56, 189, 248, ${alpha * 0.35})`);
    grad.addColorStop(1.0, "rgba(56, 189, 248, 0.0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(lx, ly, lR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * 하이드로펌프 충격 수면 파문 헬퍼 (Concentric Ground Ripples)
 */
function drawWaterfallRipples(
  ctx: any,
  cx: number,
  cy: number,
  maxRadius: number,
  progress: number,
  alpha: number
) {
  if (alpha <= 0.01) return;
  ctx.save();

  const RIPPLE_COUNT = 3;
  for (let i = 0; i < RIPPLE_COUNT; i++) {
    const rp = (progress + i * 0.33) % 1.0;
    const r = maxRadius * rp;
    const rAlpha = alpha * Math.sin(rp * Math.PI);
    if (rAlpha <= 0.01) continue;

    ctx.strokeStyle = `rgba(186, 230, 253, ${rAlpha * 0.85})`;
    ctx.lineWidth = Math.max(1.0, 2.8 * (1 - rp));
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.34, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(14, 165, 233, ${rAlpha * 0.50})`;
    ctx.lineWidth = Math.max(0.8, 4.0 * (1 - rp));
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.90, r * 0.34 * 0.90, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * 하이드로펌프 & 파도타기 규격: 폭포 기둥 표면을 감싸며 치솟는 뽀얗고 짙은 수증기/물안개 플룸 (Hydro Vapor Mist)
 * - 인위적인 사다리꼴 단면을 부드럽게 감싸고 지워주어 진짜 살아 숨쉬는 유체 볼륨감 형성
 */
/**
 * 하이드로펌프 & 파도타기 규격: 폭포 기둥 표면을 감싸며 치솟는 은은한 수증기 플룸 (Hydro Vapor Mist)
 * - 과도하지 않고 은은하게(투명도 0.25 내외) 물줄기 뒤쪽을 받쳐주는 반투명 연무
 */
function drawWaterfallVaporMist(
  ctx: any,
  tx: number,
  groundY: number,
  colHeight: number,
  alpha: number,
  timeSeed: number
) {
  if (alpha <= 0.01 || colHeight <= 10) return;

  const MIST_COUNT = 4;
  for (let m = 0; m < MIST_COUNT; m++) {
    const mt = (m / (MIST_COUNT - 1));
    const my = groundY - mt * colHeight;
    const sign = (m % 2 === 0) ? 1 : -1;
    const driftX = Math.sin(timeSeed * 1.5 + m * 2.1) * (3 + mt * 5);
    const mx = tx + sign * (8 + mt * 10) + driftX;
    const mistR = 8 + mt * 10;

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, mistR);
    grad.addColorStop(0.00, `rgba(255, 255, 255, ${Math.min(1.0, alpha * 0.25)})`);
    grad.addColorStop(0.40, `rgba(230, 246, 255, ${alpha * 0.16})`);
    grad.addColorStop(0.75, `rgba(186, 230, 253, ${alpha * 0.08})`);
    grad.addColorStop(1.00, "rgba(56, 189, 248, 0.0)");

    ctx.save();
    ctx.translate(mx, my);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, mistR * 1.25, mistR * 0.70, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * 솟아오르는 지점 수증기 (Base Eruption Mist):
 * - [유저 요구 100% 반영]: "바닥에서 위로 뿜어나오는 수증기 작은거 여러개 더 추가"
 * - 1. 바닥 기저부를 포근하게 받쳐주는 베이스 연무 클러스터 (6개)
 * - 2. 바닥 수면에서 위쪽으로 퐁퐁 뿜어져 솟구치는 14개의 아담한 마이크로 수증기 제트 퍼프들 (Tiny Upward Steam Jets)
 */
function drawWaterfallBaseMist(
  ctx: any,
  tx: number,
  groundY: number,
  alpha: number,
  timeSeed: number
) {
  if (alpha <= 0.01) return;

  ctx.save();

  // 1. 바닥 베이스 연무 구름 (6개)
  const BASE_MIST_COUNT = 6;
  for (let b = 0; b < BASE_MIST_COUNT; b++) {
    const cycle = (timeSeed * 1.6 + b * 0.35) % 1.0;
    const sign = (b % 2 === 0) ? 1 : -1;
    const spreadX = sign * (12 + (b % 3) * 14) + Math.sin(timeSeed * 1.2 + b) * 5;
    const riseY = -cycle * 20; // 바닥에서 위로 모락모락 피어오름
    const mx = tx + spreadX;
    const my = groundY + riseY - 2;
    const mistR = 14 + (b % 3) * 5 + cycle * 6;
    const puffAlpha = Math.sin(cycle * Math.PI) * alpha;

    const grad = ctx.createRadialGradient(mx, my, 0, mx, my, mistR);
    grad.addColorStop(0.00, `rgba(255, 255, 255, ${Math.min(1.0, puffAlpha * 0.48)})`);
    grad.addColorStop(0.40, `rgba(235, 248, 255, ${puffAlpha * 0.32})`);
    grad.addColorStop(0.75, `rgba(186, 230, 253, ${puffAlpha * 0.12})`);
    grad.addColorStop(1.00, "rgba(56, 189, 248, 0.0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(mx, my, mistR * 1.35, mistR * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. [유저 요구 100% 반영]: 바닥에서 위로 퐁퐁 뿜어져 나오는 14개의 작은 마이크로 수증기 제트 (Tiny Upward Steam Jets)
  const JET_COUNT = 14;
  for (let j = 0; j < JET_COUNT; j++) {
    const jCycle = (timeSeed * 3.0 + j * 0.22) % 1.0;
    const sign = (j % 2 === 0) ? 1 : -1;
    const baseOffsetX = sign * (6 + (j % 5) * 6.5); // 바닥 기저부 좌우 분포
    const driftX = Math.sin(timeSeed * 2.0 + j * 1.4) * (3 + jCycle * 5);
    const jx = tx + baseOffsetX + driftX;

    // 위로 뿜어져 올라가는 상승 높이 (24px ~ 56px)
    const maxRise = 26 + (j % 4) * 10;
    const jy = groundY - Math.pow(jCycle, 0.70) * maxRise;

    // 작은 수증기 크기: 4.5px에서 8.5px까지 살짝 부풀어 오름
    const jRadius = 4.5 + (j % 3) * 1.5 + jCycle * 3.0;
    const jAlpha = Math.sin(jCycle * Math.PI) * alpha;

    const jGrad = ctx.createRadialGradient(jx, jy, 0, jx, jy, jRadius);
    jGrad.addColorStop(0.00, `rgba(255, 255, 255, ${Math.min(1.0, jAlpha * 0.65)})`);
    jGrad.addColorStop(0.45, `rgba(224, 242, 254, ${jAlpha * 0.42})`);
    jGrad.addColorStop(0.80, `rgba(186, 230, 253, ${jAlpha * 0.15})`);
    jGrad.addColorStop(1.00, "rgba(56, 189, 248, 0.0)");

    ctx.fillStyle = jGrad;
    ctx.beginPath();
    ctx.ellipse(jx, jy, jRadius * 1.20, jRadius * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 대상 포켓몬 타격 지속 수증기 (Continuous Target Steam Mist):
 * - [유저 요구 100% 반영]: "타격되고있는동안 (#11 등)수증기 지속발생"
 * - 폭포에 직격당해 공중 체공하고 착지할 때까지(#11 등 전구간)
 *   피격자 실시간 위치(liveTargetX, liveTargetY)를 감싸며 끊김 없이 퐁퐁 솟아오르는 순백 수증기 구름
 */
function drawWaterfallContinuousTargetMist(
  ctx: any,
  targetX: number,
  targetY: number,
  alpha: number,
  timeSeed: number
) {
  if (alpha <= 0.01) return;

  ctx.save();
  const PUFF_COUNT = 7;
  for (let i = 0; i < PUFF_COUNT; i++) {
    // 각각 다른 위상으로 피어올라 끊김 없는 연속감 형성
    const cycle = (timeSeed * 2.2 + i * 0.32) % 1.0;
    const angle = (i / PUFF_COUNT) * Math.PI * 2 + Math.sin(timeSeed * 1.5 + i) * 0.4;
    const driftDist = (10 + (i % 3) * 8) + cycle * 16;
    const px = targetX + Math.cos(angle) * driftDist * 1.15;
    const py = targetY + Math.sin(angle) * driftDist * 0.80 - cycle * 12; // 상공으로 피어오름
    const puffR = 12 + (i % 3) * 5 + cycle * 8;
    const puffAlpha = Math.sin(cycle * Math.PI) * alpha;

    const grad = ctx.createRadialGradient(px, py, 0, px, py, puffR);
    grad.addColorStop(0.00, `rgba(255, 255, 255, ${Math.min(1.0, puffAlpha * 0.55)})`);
    grad.addColorStop(0.40, `rgba(235, 248, 255, ${puffAlpha * 0.35})`);
    grad.addColorStop(0.75, `rgba(186, 230, 253, ${puffAlpha * 0.12})`);
    grad.addColorStop(1.00, "rgba(56, 189, 248, 0.0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(px, py, puffR * 1.25, puffR * 0.80, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * 대상 포켓몬 타격 수증기 폭발 (Target Impact Vapor Burst):
 * - [유저 요구 100% 반영]: "수증기좀 터트려줘 (대상포켓몬에)"
 * - 폭포수가 대상 포켓몬에 직격하고 치솟는 순간 중심에서 사방으로 순백 수증기가 팡! 터져나가는 역동적 폭발
 * - 팽창 곡선(Power curve)으로 빠르게 팍 터진 뒤 사방으로 뭉게뭉게 흩어지며 부드럽게 기화 페이드아웃
 */
function drawWaterfallTargetVaporBurst(
  ctx: any,
  tx: number,
  hitY: number,
  burstProgress: number, // 0.0 (기폭) ~ 1.0 (사방 확산 및 기화 소멸)
  alpha: number,
  timeSeed: number
) {
  if (alpha <= 0.01 || burstProgress <= 0 || burstProgress >= 1.0) return;

  ctx.save();

  // 폭발 팽창 커브: 초기 급속 팽창 (Fast explosion) -> 후반 완만 확산 (Easing out)
  const expandProg = Math.pow(burstProgress, 0.60);
  const fadeAlpha = Math.sin(burstProgress * Math.PI) * alpha;

  // 1. 중심 순백 수증기 폭발 코어 (Burst Core)
  const coreRadius = 14 + expandProg * 22;
  const coreGrad = ctx.createRadialGradient(tx, hitY, 0, tx, hitY, coreRadius);
  coreGrad.addColorStop(0.00, `rgba(255, 255, 255, ${Math.min(1.0, fadeAlpha * 0.75)})`);
  coreGrad.addColorStop(0.35, `rgba(235, 248, 255, ${fadeAlpha * 0.52})`);
  coreGrad.addColorStop(0.70, `rgba(186, 230, 253, ${fadeAlpha * 0.22})`);
  coreGrad.addColorStop(1.00, "rgba(56, 189, 248, 0.0)");

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.ellipse(tx, hitY, coreRadius * 1.25, coreRadius * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. 사방 8방향으로 파열하며 튀어나가는 방사형 수증기 구름 퍼프 (Radial Erupting Puffs)
  const PUFF_COUNT = 8;
  for (let i = 0; i < PUFF_COUNT; i++) {
    const baseAngle = (i / PUFF_COUNT) * Math.PI * 2;
    const angleJitter = Math.sin(timeSeed * 3.0 + i * 1.7) * 0.22;
    const angle = baseAngle + angleJitter;

    // 사방으로 튀어나가는 거리 (12px -> 최대 46px까지 시원하게 확산)
    const baseDist = 12 + (i % 3) * 7;
    const dist = baseDist + expandProg * (24 + (i % 2) * 12);
    const px = tx + Math.cos(angle) * dist * 1.15;
    const py = hitY + Math.sin(angle) * dist * 0.85;

    // 퍼프 크기도 뭉게뭉게 팽창 (11px -> 24px)
    const puffRadius = (11 + (i % 2) * 4) + expandProg * (10 + (i % 3) * 4);

    const puffGrad = ctx.createRadialGradient(px, py, 0, px, py, puffRadius);
    puffGrad.addColorStop(0.00, `rgba(255, 255, 255, ${Math.min(1.0, fadeAlpha * 0.70)})`);
    puffGrad.addColorStop(0.38, `rgba(235, 248, 255, ${fadeAlpha * 0.44})`);
    puffGrad.addColorStop(0.75, `rgba(186, 230, 253, ${fadeAlpha * 0.16})`);
    puffGrad.addColorStop(1.00, "rgba(56, 189, 248, 0.0)");

    ctx.fillStyle = puffGrad;
    ctx.beginPath();
    ctx.ellipse(px, py, puffRadius * 1.20, puffRadius * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}



/**
 * 하이드로펌프 규격: 폭포 기둥 내부를 타고 수직으로 맹렬히 질주하는 초고속 캐비테이션 선형 스트릭
 * (Longitudinal Cavitation Velocity Streaks - 12줄기)
 * - [유저 피드백 반영]: 양 끝단 완전 투명화(Bell-curve) 적용으로 뭉툭한 단면을 없애고 유기적으로 기화
 */
function drawWaterfallVelocityStreaks(
  ctx: any,
  tx: number,
  groundY: number,
  colHeight: number,
  alpha: number,
  timeSeed: number
) {
  if (alpha <= 0.01 || colHeight <= 20) return;

  ctx.save();
  ctx.lineCap = "round";
  const STREAK_COUNT = 12;
  for (let s = 0; s < STREAK_COUNT; s++) {
    const xOff = ((s - (STREAK_COUNT - 1) / 2) / (STREAK_COUNT / 2)) * 24;
    const speed = 2.4 + (s % 3) * 0.7;
    const phase = (timeSeed * speed + s * 0.35) % 1.0;
    const sLen = 26 + (s % 4) * 14;
    const sStart = groundY - phase * colHeight;
    const sEnd = Math.max(groundY - colHeight, sStart - sLen);

    if (sStart < groundY - colHeight) continue;

    // [유저 요청 반영]: 양 끝단(0.0, 1.0) 완전 투명화 Bell-Curve 그라데이션 (뭉툭한 단면 완전 제거)
    const isWhite = s % 2 === 0;
    const streakGrad = ctx.createLinearGradient(0, sStart, 0, sEnd);
    streakGrad.addColorStop(0.00, "rgba(255, 255, 255, 0.0)");
    streakGrad.addColorStop(0.20, isWhite ? `rgba(255, 255, 255, ${0.55 * alpha})` : `rgba(186, 230, 253, ${0.50 * alpha})`);
    streakGrad.addColorStop(0.50, isWhite ? `rgba(255, 255, 255, ${0.80 * alpha})` : `rgba(56, 189, 248, ${0.75 * alpha})`);
    streakGrad.addColorStop(0.80, isWhite ? `rgba(224, 242, 254, ${0.55 * alpha})` : `rgba(56, 189, 248, ${0.50 * alpha})`);
    streakGrad.addColorStop(1.00, "rgba(56, 189, 248, 0.0)");

    ctx.strokeStyle = streakGrad;
    ctx.lineWidth = isWhite ? 2.4 : 1.6;
    ctx.beginPath();
    ctx.moveTo(tx + xOff, sStart);
    ctx.lineTo(tx + xOff + Math.sin(timeSeed + s) * 2, sEnd);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * 파도타기 규격: 굽이치는 유기적 수직 제트 물기둥 베이스 (Deep Cobalt & Cyan Fluid Jet)
 * - 단일 사다리꼴 다각형을 완전히 버리고, 파도타기의 다단계 로열 코발트 블루(#072f6a ~ #0b68e8)
 *   그라데이션과 시간축에 따라 출렁이는 베지에 굴곡 라인으로 진짜 물기둥의 부피감을 구현
 */
/**
 * 파도타기 규격: 굽이치는 유기적 수직 제트 물기둥 베이스 (Deep Cobalt & Cyan Fluid Jet)
 * - [유저 요구 100% 반영]: "물줄기 제일 윗쪽 짧게 거품영역만 투명하게 아주짧게 투명그라데이션"
 * - 물줄기 대부분(아래 약 85%)은 짙고 시원한 코발트/아쿠아마린 제트 본체 볼륨을 100% 유지
 * - 폭포 꼭대기 거품(Foam)과 맞닿는 최상단 짧은 구간(상단 약 20~22px)만 아래에서 위로
 *   완벽히 투명해지는 부드러운 투명 그라데이션(Fade-to-Transparent)을 적용하여
 *   거품 아래 툭 잘리거나 삐져나오는 딱딱한 면을 완전히 제거하고 거품 및 수증기와 유기적으로 기화/융합
 */
function drawWaterfallBaseStreams(
  ctx: any,
  tx: number,
  groundY: number,
  colHeight: number,
  alpha: number,
  timeSeed: number
) {
  if (alpha <= 0.01 || colHeight <= 6) return;

  // [유저 요구 100% 반영]: 최상단 거품 영역(상단 18~22px) 투명 그라데이션 높이
  const fadeHeight = Math.min(22, colHeight * 0.35);
  const sFade = 1.0 - (fadeHeight / colHeight); // 투명 페이드가 시작되는 높이 비율 (약 0.87)

  // 1. 심해 로열 블루 유체 베이스 (Deep Sapphire Base)
  const baseGrad = ctx.createLinearGradient(tx - 36, 0, tx + 36, 0);
  baseGrad.addColorStop(0.00, "rgba(7, 47, 106, 0.0)");
  baseGrad.addColorStop(0.18, `rgba(13, 97, 219, ${0.78 * alpha})`);
  baseGrad.addColorStop(0.50, `rgba(14, 165, 233, ${0.90 * alpha})`);
  baseGrad.addColorStop(0.82, `rgba(13, 97, 219, ${0.78 * alpha})`);
  baseGrad.addColorStop(1.00, "rgba(7, 47, 106, 0.0)");

  const getBaseLeftX = (s: number) => {
    const wave = Math.sin(timeSeed * 3.0 + s * 8.0) * 4;
    return tx - (32 - s * 6 + wave);
  };
  const getBaseRightX = (s: number) => {
    const wave = Math.cos(timeSeed * 3.0 + s * 8.0) * 4;
    return tx + (32 - s * 6 + wave);
  };

  // 1-A. 베이스 메인 바디 (지면 ~ 페이드 시작점까지 100% 불투명 본체)
  const MAIN_SAMPLES = 10;
  ctx.fillStyle = baseGrad;
  ctx.beginPath();
  ctx.moveTo(getBaseLeftX(0), groundY);
  for (let i = 1; i <= MAIN_SAMPLES; i++) {
    const s = (i / MAIN_SAMPLES) * sFade;
    ctx.lineTo(getBaseLeftX(s), groundY - s * colHeight);
  }
  ctx.lineTo(getBaseRightX(sFade), groundY - sFade * colHeight);
  for (let i = MAIN_SAMPLES; i >= 0; i--) {
    const s = (i / MAIN_SAMPLES) * sFade;
    ctx.lineTo(getBaseRightX(s), groundY - s * colHeight);
  }
  ctx.closePath();
  ctx.fill();

  // 1-B. [유저 요구 100% 반영]: 거품 영역 최상단 짧은 투명 그라데이션 (Fade-to-Transparent)
  const FADE_SLICES = 8;
  for (let k = 0; k < FADE_SLICES; k++) {
    const frac0 = k / FADE_SLICES;
    const frac1 = (k + 1) / FADE_SLICES;
    const s0 = sFade + frac0 * (1.0 - sFade);
    const s1 = sFade + frac1 * (1.0 - sFade);
    const y0 = groundY - s0 * colHeight;
    const y1 = groundY - s1 * colHeight;

    // 위로 올라갈수록 투명해지는 부드러운 감쇠 곡선 (1.0 -> 0.0)
    const midFrac = (frac0 + frac1) * 0.5;
    const fadeMul = Math.max(0, 1.0 - midFrac);

    ctx.save();
    ctx.globalAlpha = fadeMul;
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.moveTo(getBaseLeftX(s0), y0 + 0.5); // 미세 0.5px 오버랩으로 안티앨리어싱 틈새 방지
    ctx.lineTo(getBaseLeftX(s1), y1);
    ctx.lineTo(getBaseRightX(s1), y1);
    ctx.lineTo(getBaseRightX(s0), y0 + 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 2. 중심 초고압 아쿠아마린 제트 코어
  const coreGrad = ctx.createLinearGradient(tx - 18, 0, tx + 18, 0);
  coreGrad.addColorStop(0.0, "rgba(56, 189, 248, 0.0)");
  coreGrad.addColorStop(0.3, `rgba(186, 230, 253, ${0.90 * alpha})`);
  coreGrad.addColorStop(0.5, `rgba(255, 255, 255, ${0.95 * alpha})`);
  coreGrad.addColorStop(0.7, `rgba(186, 230, 253, ${0.90 * alpha})`);
  coreGrad.addColorStop(1.0, "rgba(56, 189, 248, 0.0)");

  const getCoreLeftX = (s: number) => {
    const wave = Math.sin(timeSeed * 4.0 + s * 10.0) * 2.5;
    return tx - (16 - s * 3 + wave);
  };
  const getCoreRightX = (s: number) => {
    const wave = Math.cos(timeSeed * 4.0 + s * 10.0) * 2.5;
    return tx + (16 - s * 3 + wave);
  };

  // 2-A. 코어 메인 바디 (지면 ~ 페이드 시작점까지 100% 불투명 본체)
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.moveTo(getCoreLeftX(0), groundY);
  for (let i = 1; i <= MAIN_SAMPLES; i++) {
    const s = (i / MAIN_SAMPLES) * sFade;
    ctx.lineTo(getCoreLeftX(s), groundY - s * colHeight);
  }
  ctx.lineTo(getCoreRightX(sFade), groundY - sFade * colHeight);
  for (let i = MAIN_SAMPLES; i >= 0; i--) {
    const s = (i / MAIN_SAMPLES) * sFade;
    ctx.lineTo(getCoreRightX(s), groundY - s * colHeight);
  }
  ctx.closePath();
  ctx.fill();

  // 2-B. [유저 요구 100% 반영]: 코어 최상단 거품 영역 짧은 투명 그라데이션
  for (let k = 0; k < FADE_SLICES; k++) {
    const frac0 = k / FADE_SLICES;
    const frac1 = (k + 1) / FADE_SLICES;
    const s0 = sFade + frac0 * (1.0 - sFade);
    const s1 = sFade + frac1 * (1.0 - sFade);
    const y0 = groundY - s0 * colHeight;
    const y1 = groundY - s1 * colHeight;

    const midFrac = (frac0 + frac1) * 0.5;
    const fadeMul = Math.max(0, 1.0 - midFrac);

    ctx.save();
    ctx.globalAlpha = fadeMul;
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.moveTo(getCoreLeftX(s0), y0 + 0.5);
    ctx.lineTo(getCoreLeftX(s1), y1);
    ctx.lineTo(getCoreRightX(s1), y1);
    ctx.lineTo(getCoreRightX(s0), y0 + 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/**
 * 파도타기 규격: 폭포 꼭대기 쇄파(Crest Breaker) 포말 헤드 및 정상 수증기 (Crest Foam & Steam)
 * - [유저 요구 100% 반영]: "이 제일 위에 보이는거에도 수증기좀"
 * - 1. 폭포 꼭대기 정상 쇄파 지점을 부드럽고 웅장하게 감싸는 뽀얀 순백 정상 수증기 클러스터 (Crest Mist Aura)
 * - 2. 정상을 뚫고 상공으로 몽실몽실 피어오르는 6개의 미세 수증기 퍼프 (Rising Crest Vapor)
 * - 3. 3개 클러스터 포말 블롭이 수증기와 자연스럽게 융합되어 인위적인 구형 느낌을 완전히 지우고 시원한 포말 연출
 * - 4. 전면 오버레이 수증기 연무(Front Mist Overlay)로 포말 블롭 간의 경계를 뽀얗게 안개화
 */
function drawWaterfallCrestBreaker(
  ctx: any,
  tx: number,
  apexY: number,
  radius: number,
  alpha: number,
  timeSeed: number
) {
  if (alpha <= 0.01 || radius <= 2) return;

  ctx.save();

  // 1. [유저 요구 100% 반영]: 폭포 꼭대기 정상 수증기 연무 아우라 (Crest Mist Aura - 6개)
  // - 포말 헤드의 3개 원형 블롭 경계를 부드럽게 감싸 안아 유기적인 물안개 형태로 융합
  const CREST_MIST_COUNT = 6;
  for (let m = 0; m < CREST_MIST_COUNT; m++) {
    const cycle = (timeSeed * 2.0 + m * 0.33) % 1.0;
    const mAngle = (m / CREST_MIST_COUNT) * Math.PI * 2 + Math.sin(timeSeed * 1.8 + m) * 0.35;
    const mDist = radius * (0.55 + (m % 3) * 0.25) + cycle * 4;
    const mx = tx + Math.cos(mAngle) * mDist * 1.25;
    const my = apexY + Math.sin(mAngle) * mDist * 0.75 - cycle * 8; // 위쪽으로 모락모락
    const mistR = radius * (0.85 + (m % 2) * 0.35) + cycle * 6;
    const mistAlpha = Math.sin(cycle * Math.PI) * alpha;

    const mGrad = ctx.createRadialGradient(mx, my, 0, mx, my, mistR);
    mGrad.addColorStop(0.00, `rgba(255, 255, 255, ${Math.min(1.0, mistAlpha * 0.70)})`);
    mGrad.addColorStop(0.40, `rgba(235, 248, 255, ${mistAlpha * 0.45})`);
    mGrad.addColorStop(0.75, `rgba(186, 230, 253, ${mistAlpha * 0.18})`);
    mGrad.addColorStop(1.00, "rgba(56, 189, 248, 0.0)");

    ctx.fillStyle = mGrad;
    ctx.beginPath();
    ctx.ellipse(mx, my, mistR * 1.30, mistR * 0.80, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. [유저 요구 100% 반영]: 꼭대기에서 상공으로 피어오르는 6개의 앙증맞은 상승 수증기 퍼프 (Rising Crest Vapor)
  const UPWARD_VAPOR_COUNT = 6;
  for (let u = 0; u < UPWARD_VAPOR_COUNT; u++) {
    const uCycle = (timeSeed * 2.5 + u * 0.28) % 1.0;
    const sign = (u % 2 === 0) ? 1 : -1;
    const ux = tx + sign * (4 + (u % 3) * 5) + Math.sin(timeSeed * 2.0 + u) * 4;
    const uy = apexY - 6 - Math.pow(uCycle, 0.75) * (14 + (u % 3) * 8); // 꼭대기 위쪽으로 솟구침
    const uRadius = (radius * 0.35) + uCycle * (radius * 0.45);
    const uAlpha = Math.sin(uCycle * Math.PI) * alpha * 0.65;

    const uGrad = ctx.createRadialGradient(ux, uy, 0, ux, uy, uRadius);
    uGrad.addColorStop(0.00, `rgba(255, 255, 255, ${Math.min(1.0, uAlpha * 0.65)})`);
    uGrad.addColorStop(0.45, `rgba(224, 242, 254, ${uAlpha * 0.40})`);
    uGrad.addColorStop(0.80, `rgba(186, 230, 253, ${uAlpha * 0.12})`);
    uGrad.addColorStop(1.00, "rgba(56, 189, 248, 0.0)");

    ctx.fillStyle = uGrad;
    ctx.beginPath();
    ctx.ellipse(ux, uy, uRadius * 1.25, uRadius * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. 포말 블롭들 (기존 3개 클러스터 유지 - 코어 광택 유지)
  const CLUSTERS = [
    { offX: 0, offY: -4, r: radius * 1.0, seed: 0 },
    { offX: -radius * 0.65, offY: 4, r: radius * 0.75, seed: 1.5 },
    { offX: radius * 0.65, offY: 4, r: radius * 0.75, seed: 3.0 },
  ];

  for (const c of CLUSTERS) {
    const cx = tx + c.offX + Math.sin(timeSeed * 2.5 + c.seed) * 3;
    const cy = apexY + c.offY + Math.cos(timeSeed * 2.0 + c.seed) * 2;
    drawWaterfallFoamBlob(ctx, cx, cy, c.r, alpha, timeSeed + c.seed);
  }

  // 4. 전면 오버레이 수증기 (포말 블롭 앞쪽을 살짝 덮어 구형 이음새를 자연스럽게 뭉개주는 2차 연무)
  for (let m = 0; m < 3; m++) {
    const frontSeed = timeSeed * 1.7 + m * 2.1;
    const fx = tx + Math.sin(frontSeed) * (radius * 0.45);
    const fy = apexY + Math.cos(frontSeed * 0.9) * (radius * 0.25);
    const fR = radius * 0.75;
    const fGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, fR);
    fGrad.addColorStop(0.00, `rgba(255, 255, 255, ${alpha * 0.40})`);
    fGrad.addColorStop(0.50, `rgba(235, 248, 255, ${alpha * 0.20})`);
    fGrad.addColorStop(1.00, "rgba(56, 189, 248, 0.0)");

    ctx.fillStyle = fGrad;
    ctx.beginPath();
    ctx.ellipse(fx, fy, fR * 1.20, fR * 0.80, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 127: 폭포오르기 전장 배경 파란색 수중 필터 & 위로 올라가는 물결무늬 (Rising Caustics & Blue Ambient Filter)
 * - [유저 요구 100% 반영]: "필터 파란색깔 배경에 넣고 물결무늬 위로올라가는"
 * - 1. 전장 전체를 덮는 시원하고 깊이감 있는 딥 아쿠아 사파이어 블루 앰비언트 필터
 * - 2. 6개의 굽이치는 사인곡선 물결 밴드가 아래에서 위로 쏴아아 끊임없이 흘러올라가는 수직 상승 물결무늬
 */
function drawWaterfallRisingCausticsBackground(
  ctx: any,
  groundY: number,
  alpha: number,
  timeSeed: number
) {
  if (alpha <= 0.01) return;

  ctx.save();

  // 1. 전역 딥 아쿠아 사파이어 블루 앰비언트 필터 (카메라 줌/팬을 고려해 -600 ~ +1800 광역 커버)
  const bgGrad = ctx.createLinearGradient(0, -500, 0, groundY + 300);
  bgGrad.addColorStop(0.00, `rgba(7, 89, 133, ${0.30 * alpha})`);   // 깊은 사파이어 블루
  bgGrad.addColorStop(0.40, `rgba(2, 132, 199, ${0.24 * alpha})`);  // 청량한 아쿠아 시안
  bgGrad.addColorStop(0.75, `rgba(14, 165, 233, ${0.28 * alpha})`); // 밝은 코발트 블루
  bgGrad.addColorStop(1.00, `rgba(3, 105, 161, ${0.35 * alpha})`);  // 심해 기저부 네이비

  ctx.fillStyle = bgGrad;
  ctx.fillRect(-600, -600, 1800, 1600);

  // 2. 아래에서 위로 쏴아아 끊임없이 흘러올라가는 6개의 유기적 사인파 물결 밴드 (Rising Caustic Waves)
  const WAVE_BAND_COUNT = 6;
  const TOTAL_HEIGHT = 480; // 물결이 순환하는 수직 전체 높이
  const speed = timeSeed * 75; // 위로 상승하는 속도

  for (let w = 0; w < WAVE_BAND_COUNT; w++) {
    // 아래(groundY + 80)에서부터 위(groundY - 400)로 부드럽게 상승 순환
    const rawY = (w * (TOTAL_HEIGHT / WAVE_BAND_COUNT) - speed) % TOTAL_HEIGHT;
    const normY = rawY < 0 ? rawY + TOTAL_HEIGHT : rawY;
    const curY = (groundY + 80) - normY;

    // 상/하단 가장자리 부드러운 페이드인/아웃 윈도우
    const edgeFade = Math.sin((normY / TOTAL_HEIGHT) * Math.PI);
    const bandAlpha = alpha * edgeFade * 0.42;
    if (bandAlpha <= 0.01) continue;

    const waveFreq = 0.018 + (w % 3) * 0.005;
    const waveAmp = 7 + (w % 2) * 5;
    const phaseOffset = timeSeed * 2.5 + w * 1.4;

    ctx.beginPath();
    const startX = -400;
    const endX = 1200;
    const STEP = 20;

    // 물결 상단 라인
    ctx.moveTo(startX, curY + Math.sin(startX * waveFreq + phaseOffset) * waveAmp);
    for (let x = startX + STEP; x <= endX; x += STEP) {
      const wy = curY + Math.sin(x * waveFreq + phaseOffset) * waveAmp;
      ctx.lineTo(x, wy);
    }

    // 약간의 두께감(8~12px)을 가진 물결 리본으로 채우기
    const bandThick = 8 + (w % 3) * 4;
    for (let x = endX; x >= startX; x -= STEP) {
      const wy = curY + bandThick + Math.sin(x * waveFreq + phaseOffset + 0.5) * waveAmp;
      ctx.lineTo(x, wy);
    }
    ctx.closePath();

    // 밝은 아쿠아-시안 물결 그라데이션
    const waveGrad = ctx.createLinearGradient(0, curY - 5, 0, curY + bandThick + 5);
    waveGrad.addColorStop(0.00, "rgba(224, 242, 254, 0.0)");
    waveGrad.addColorStop(0.35, `rgba(224, 242, 254, ${bandAlpha * 0.85})`);
    waveGrad.addColorStop(0.65, `rgba(56, 189, 248, ${bandAlpha * 0.65})`);
    waveGrad.addColorStop(1.00, "rgba(14, 165, 233, 0.0)");

    ctx.fillStyle = waveGrad;
    ctx.fill();

    // 물결 상단 엣지 하이라이트 선
    ctx.strokeStyle = `rgba(255, 255, 255, ${bandAlpha * 0.70})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(startX, curY + Math.sin(startX * waveFreq + phaseOffset) * waveAmp);
    for (let x = startX + STEP; x <= endX; x += STEP) {
      const wy = curY + Math.sin(x * waveFreq + phaseOffset) * waveAmp;
      ctx.lineTo(x, wy);
    }
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 127: 폭포오르기 배후 레이어 이펙트 (Background Layer)
 * - [유저 요구 1]: 발사직전/발사 이펙트 완전 배제! (시전자 위치에는 아무것도 그리지 않음)
 * - [유저 요구 2]: 파란색 배경 필터 & 위로 올라가는 물결무늬 + 거대 폭포 배후 수류
 */
export function drawWaterfallBehindEffect(
  ctx: any,
  frame: any,
  drawCtx: any
) {
  const step = frame.moveStep ?? 2;
  const p = frame.effectProgress ?? 0.5;
  const isP = drawCtx?.isPlayer ?? true;

  // 피격자(대상) 위치 및 실시간 체공/착지 오프셋
  const tx = drawCtx?.targetPos?.x ?? 160;
  const ty = drawCtx?.targetPos?.y ?? 60;
  const groundY = ty + 24;

  const targetOff = isP ? (frame.eOffset ?? { x: 0, y: 0 }) : (frame.pOffset ?? { x: 0, y: 0 });
  const liveTargetX = tx + targetOff.x;
  const liveTargetY = ty + targetOff.y;

  ctx.save();

  // ==========================================================================
  // Step 2: 상대방 발밑에서 거대한 수직 폭포 용솟음 (배후 수류 베이스 & 파문)
  // ==========================================================================
  if (step === 2) {
    const colProgress = Math.min(1.0, p * 1.4);
    const colHeight = 175 * colProgress;
    const colTopY = groundY - colHeight;
    const timeSeed = p * 14.0;

    // 0. [유저 요구 100% 반영]: 파란색 배경 필터 & 위로 올라가는 물결무늬 (Rising Caustics)
    const filterAlpha = Math.min(1.0, p * 3.0);
    drawWaterfallRisingCausticsBackground(ctx, groundY, filterAlpha, timeSeed);

    // 1. 바닥 충격 수면 웅덩이 & 3중 동심원 파문
    const poolGrad = ctx.createRadialGradient(tx, groundY, 0, tx, groundY, 56);
    poolGrad.addColorStop(0.0, "rgba(240, 253, 250, 0.95)");
    poolGrad.addColorStop(0.35, "rgba(56, 189, 248, 0.75)");
    poolGrad.addColorStop(0.70, "rgba(2, 132, 199, 0.45)");
    poolGrad.addColorStop(1.0, "rgba(2, 132, 199, 0.0)");
    ctx.fillStyle = poolGrad;
    ctx.beginPath();
    ctx.ellipse(tx, groundY, 56, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    drawWaterfallRipples(ctx, tx, groundY, 52, p * 2.2, 0.85);

    // 2. 파도타기 규격: 굽이치는 로열 코발트 블루 유체 베이스 기둥
    drawWaterfallBaseStreams(ctx, tx, groundY, colHeight, 0.95, timeSeed);

    // 3. 하이드로펌프 규격: 폭포 기둥 뒤쪽을 살짝 받쳐주는 은은한 배경 연무
    drawWaterfallVaporMist(ctx, tx, groundY, colHeight, 0.35, timeSeed);

    // 4. [유저 요구 100% 반영]: 나오는 지점 (바닥) 수증기 지속 발생!
    drawWaterfallBaseMist(ctx, tx, groundY, 0.75, timeSeed);

    // 5. [유저 요구 100% 반영]: 타격되고 있는 동안 대상 포켓몬 배후 지속 수증기
    if (p >= 0.15) {
      drawWaterfallContinuousTargetMist(ctx, liveTargetX, liveTargetY, 0.50, timeSeed);
    }
  }

  // ==========================================================================
  // Step 3: 정상 포말 대폭발 & 폭포수 붕괴 & 바닥 침수 수면 및 파문
  // ==========================================================================
  else if (step === 3) {
    const fadeProg = Math.max(0, 1.0 - p);
    const timeSeed = p * 12.0;

    // 0. [유저 요구 100% 반영]: 파란색 배경 필터 & 위로 올라가는 물결무늬 서서히 페이드아웃
    const filterAlpha = Math.max(0, 1.0 - p * 1.15);
    drawWaterfallRisingCausticsBackground(ctx, groundY, filterAlpha, timeSeed);

    // 1. [유저 요구 100% 반영]: 물줄기가 사라질 때는 수축/침강하지 않고 제자리에서 매끄럽게 페이드아웃 (Fade-Out)
    if (p <= 0.85) {
      const fadeOutProg = p / 0.85;
      const streamAlpha = Math.pow(1.0 - fadeOutProg, 1.25) * 0.95;
      if (streamAlpha > 0.01) {
        drawWaterfallBaseStreams(ctx, tx, groundY, 175, streamAlpha, timeSeed + 5.0);
        // 물줄기 배후 연무도 함께 자연스럽게 페이드아웃
        drawWaterfallVaporMist(ctx, tx, groundY, 175, streamAlpha * 0.35, timeSeed + 5.0);
      }
    }

    // 2. 바닥 거대 침수 수면 풀 & 3중 동심원 수면 파문 & 나오는 지점 수증기 지속 발생
    if (fadeProg > 0.01) {
      const poolGrad = ctx.createRadialGradient(tx, groundY, 0, tx, groundY, 68);
      poolGrad.addColorStop(0.0, `rgba(56, 189, 248, ${fadeProg * 0.65})`);
      poolGrad.addColorStop(0.60, `rgba(2, 132, 199, ${fadeProg * 0.40})`);
      poolGrad.addColorStop(1.0, "rgba(2, 132, 199, 0.0)");
      ctx.fillStyle = poolGrad;
      ctx.beginPath();
      ctx.ellipse(tx, groundY, 68, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      drawWaterfallRipples(ctx, tx, groundY, 64, p * 1.5, fadeProg * 0.85);

      // [유저 요구 반영]: 나오는 지점 (바닥) 수증기 지속 발생
      drawWaterfallBaseMist(ctx, tx, groundY, fadeProg * 0.60, timeSeed);
    }

    // 3. [유저 요구 100% 반영]: 타격되고 있는 동안 (#11 등) 대상 포켓몬 배후 지속 수증기
    if (fadeProg > 0.05) {
      drawWaterfallContinuousTargetMist(ctx, liveTargetX, liveTargetY, fadeProg * 0.50, timeSeed);
    }
  }

  ctx.restore();
}

/**
 * 127: 폭포오르기 전면 메인 레이어 이펙트 (Front Layer)
 * - [유저 요구 1]: 발사직전/발사 이펙트 완전 배제! (시전자 위치에는 아무것도 그리지 않음)
 * - [유저 요구 2]: 하이드로펌프/파도타기 규격의 고밀도 수류 이펙트 (대상 위치 집중)
 */
export function drawWaterfallEffect(
  ctx: any,
  frame: any,
  drawCtx: any
) {
  const step = frame.moveStep ?? 2;
  const p = frame.effectProgress ?? 0.5;
  const isP = drawCtx?.isPlayer ?? true;

  // 피격자(대상) 위치 및 실시간 체공/착지 오프셋
  const tx = drawCtx?.targetPos?.x ?? 160;
  const ty = drawCtx?.targetPos?.y ?? 60;
  const groundY = ty + 24;

  const targetOff = isP ? (frame.eOffset ?? { x: 0, y: 0 }) : (frame.pOffset ?? { x: 0, y: 0 });
  const liveTargetX = tx + targetOff.x;
  const liveTargetY = ty + targetOff.y;

  ctx.save();

  // ==========================================================================
  // Step 2: 수직 폭포 분출 & 상승 강타 (Front Layer)
  // - 캐비테이션 스트릭, 정상 쇄파 포말, 수포/기포, 타격 지점 지속 수증기 및 폭발
  // ==========================================================================
  if (step === 2) {
    const colProgress = Math.min(1.0, p * 1.4);
    const colHeight = 175 * colProgress;
    const colTopY = groundY - colHeight;
    const timeSeed = p * 14.0;

    // 1. 하이드로펌프 규격: 폭포 기둥 내부를 맹렬히 질주하는 초고속 캐비테이션 선형 스트릭
    drawWaterfallVelocityStreaks(ctx, tx, groundY, colHeight, 0.95, timeSeed);

    // 2. [유저 요구 100% 반영]: 나오는 지점 (바닥 전면) 수증기 지속 발생
    drawWaterfallBaseMist(ctx, tx, groundY, 0.65, timeSeed + 1.2);

    // 3. [유저 요구 100% 반영]: 대상 포켓몬 타격 수증기 폭발 (Target Impact Vapor Burst)
    // Wave 1: 1차 직격 폭발 (p: 0.20 ~ 0.65)
    if (p >= 0.20 && p <= 0.65) {
      const burst1Prog = (p - 0.20) / 0.45;
      const hitY1 = ty - 10 - burst1Prog * 18;
      drawWaterfallTargetVaporBurst(ctx, liveTargetX, hitY1, burst1Prog, 0.85, timeSeed);
    }

    // Wave 2: 2차 최고점 넉업 격류 폭발 (p: 0.50 ~ 0.92)
    if (p >= 0.50 && p <= 0.92) {
      const burst2Prog = (p - 0.50) / 0.42;
      const hitY2 = ty - 28 - burst2Prog * 14;
      drawWaterfallTargetVaporBurst(ctx, liveTargetX, hitY2, burst2Prog, 0.90, timeSeed + 3.5);
    }

    // 4. [유저 요구 100% 반영]: 타격되고 있는 동안 대상 포켓몬 전면 지속 수증기
    if (p >= 0.15) {
      drawWaterfallContinuousTargetMist(ctx, liveTargetX, liveTargetY, 0.75, timeSeed + 0.8);
    }

    // 5. 파도타기 규격: 폭포 정상 쇄파(Crest Breaker) 포말 헤드
    if (colProgress > 0.25) {
      const crestAlpha = Math.min(1.0, (colProgress - 0.25) / 0.50);
      drawWaterfallCrestBreaker(ctx, tx, colTopY, 18, crestAlpha * 0.95, timeSeed);
    }

    // 6. [유저 요구 100% 반영]: 폭포 기둥 내부 수포/기포 바깥쪽 투명 그라데이션 (Soft Radial Gradient Bubbles)
    // - 딱딱하게 잘리는 원형 단면을 완전히 제거하고, 중심은 눈부신 순백 코어, 외곽은 부드럽게 감쇠하여 투명해지는 그라데이션 적용
    for (let b = 0; b < 14; b++) {
      const bubbleProg = ((p * 2.2 + b * 0.15) % 1.0) * colProgress;
      const bx = tx + Math.sin(b * 1.9 + timeSeed) * 20;
      const by = groundY - bubbleProg * colHeight;
      const bAlpha = Math.sin(bubbleProg * Math.PI) * 0.92;
      if (bAlpha <= 0.01) continue;

      const bRadius = (2.6 + (b % 3) * 1.4) * 1.35;
      const bGrad = ctx.createRadialGradient(bx, by, 0, bx, by, bRadius);
      bGrad.addColorStop(0.00, `rgba(255, 255, 255, ${bAlpha})`);
      bGrad.addColorStop(0.35, `rgba(255, 255, 255, ${bAlpha * 0.85})`);
      bGrad.addColorStop(0.70, `rgba(224, 242, 254, ${bAlpha * 0.35})`);
      bGrad.addColorStop(1.00, "rgba(186, 230, 253, 0.0)");

      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.arc(bx, by, bRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ==========================================================================
  // Step 3: 정상 포말 대폭발 & 사방 비산 유선형 수적 & 수면 안착
  // ==========================================================================
  else if (step === 3) {
    const timeSeed = p * 12.0;
    const apexY = ty - 130; // 폭포 정상 위치
    const fadeProg = Math.max(0, 1.0 - p);

    // 1. [유저 요구 100% 반영]: 나오는 지점 (바닥 전면) 수증기 지속 발생
    if (fadeProg > 0.05) {
      drawWaterfallBaseMist(ctx, tx, groundY, fadeProg * 0.50, timeSeed + 2.0);
    }

    // 2. [유저 요구 100% 반영]: 타격되고 있는 동안 (#11 등 착지/파문 확산 구간) 대상 포켓몬 전면 지속 수증기
    if (fadeProg > 0.05) {
      drawWaterfallContinuousTargetMist(ctx, liveTargetX, liveTargetY, fadeProg * 0.75, timeSeed + 1.2);
    }

    // 2.5 [유저 요구 100% 반영]: 물줄기가 사라질 때 내부 캐비테이션 속도선도 수축 없이 함께 페이드아웃
    if (p <= 0.85) {
      const fadeOutProg = p / 0.85;
      const streakAlpha = Math.pow(1.0 - fadeOutProg, 1.25) * 0.95;
      if (streakAlpha > 0.01) {
        drawWaterfallVelocityStreaks(ctx, tx, groundY, 175, streakAlpha, timeSeed + 5.0);
      }
    }

    // 3. 폭포 정상에서 사방으로 팡 터져 나가는 순백 포말 클러스터 (초반 p <= 0.60)
    const foamAlpha = Math.max(0, 1.0 - p * 1.6);
    if (foamAlpha > 0.01) {
      const foamR = (24 + p * 28);
      drawWaterfallCrestBreaker(ctx, tx, apexY, foamR, foamAlpha, timeSeed);
    }

    // 4. 하이드로펌프 규격: 사방으로 포물선을 그리며 비산 낙하하는 28개의 유선형 수적(Droplets)
    const DROP_COUNT = 28;
    for (let d = 0; d < DROP_COUNT; d++) {
      const angle = (d / DROP_COUNT) * Math.PI * 2 + (d % 3) * 0.2;
      const speed = 36 + (d % 5) * 18;
      const gravity = 125 * p * p;

      const dx = tx + Math.cos(angle) * speed * p;
      const dy = apexY + Math.sin(angle) * speed * 0.6 * p + gravity;

      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed * 0.6 + 240 * p;

      const dropSize = 2.2 + (d % 4) * 0.8;
      const dropAlpha = Math.max(0, 1.0 - p * 1.15) * 0.88;

      drawWaterfallDroplet(ctx, dx, dy, vx, vy, dropSize, dropAlpha);

      // 바닥 수면에 도달한 물방울의 미니 스플래시 링
      if (dy >= groundY - 6 && dy <= groundY + 12 && dropAlpha > 0.15) {
        ctx.strokeStyle = `rgba(186, 230, 253, ${dropAlpha * 0.60})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.ellipse(dx, groundY, 4 + (d % 3) * 2, 1.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}

// ============================================================================
// 128: 껍질에끼우기 (Clamp / からではさむ) 렌더러
// ============================================================================

/**
 * 128: 껍질에끼우기용 양쪽 조개 껍질 결합 렌더러
 * - 110번 껍질에숨기(Withdraw)에서 검수 완료된 5세대 정통 보라색 조개 껍질(drawClamValve) 100% 재사용
 * - 좌우 양쪽 밸브(Valve) 결합 및 완전 닫힘 시 중앙 세로 접합선(#36224E) 생성
 */
function drawClampBivalveShell(
  ctx: any,
  cx: number,
  cy: number,
  openDist: number,
  openAngle: number,
  scale: number = 1.25,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;

  // 110번 껍질에숨기 좌우 조개 껍질 렌더러 재사용
  // 좌측 껍질 (isRight = false)
  drawClamValve(ctx, cx, cy, false, openDist, openAngle, scale, alpha);
  // 우측 껍질 (isRight = true)
  drawClamValve(ctx, cx, cy, true, openDist, openAngle, scale, alpha);

  // 완전히 맞물려 닫혔을 때 중앙 세로 어두운 접합선 (#36224E)
  if (openDist < 1.0 && Math.abs(openAngle) < 0.02) {
    ctx.save();
    ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;
    ctx.strokeStyle = "#36224E";
    ctx.lineWidth = 2.4 * scale;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 24 - 60 * scale);
    ctx.lineTo(cx, cy + 24);
    ctx.stroke();
    ctx.restore();
  }
}



/**
 * 조이기 충돌 비산 수적 (Water Sparks & Droplets)
 */
function drawClampWaterSparks(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  alpha: number
) {
  if (alpha <= 0.01 || progress <= 0 || progress >= 1.0) return;

  ctx.save();
  const SPARK_COUNT = 16;
  const speed = 48;
  for (let s = 0; s < SPARK_COUNT; s++) {
    const angle = (s / SPARK_COUNT) * Math.PI * 2 + (s % 2) * 0.2;
    const dist = progress * (speed + (s % 4) * 12);
    const px = cx + Math.cos(angle) * dist * 1.35;
    const py = cy + Math.sin(angle) * dist * 0.75;
    const pAlpha = (1 - progress) * alpha * 0.90;
    const pSize = 1.8 + (s % 3) * 0.9;

    ctx.fillStyle = `rgba(255, 255, 255, ${pAlpha})`;
    ctx.beginPath();
    ctx.arc(px, py, pSize, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * 조이기 압박 틈새 분출 수포 (Escaping Squeeze Bubbles)
 */
function drawClampBubbles(
  ctx: any,
  cx: number,
  cy: number,
  alpha: number,
  timeSeed: number
) {
  if (alpha <= 0.01) return;

  ctx.save();
  const BUBBLE_COUNT = 8;
  for (let b = 0; b < BUBBLE_COUNT; b++) {
    const cycle = (timeSeed * 2.4 + b * 0.35) % 1.0;
    const sign = (b % 2 === 0) ? 1 : -1;
    const bx = cx + sign * (14 + (b % 3) * 10) + Math.sin(timeSeed * 2.0 + b) * 4;
    const by = cy + (b % 2 === 0 ? -1 : 1) * 8 - cycle * 24; // 껍질 틈새에서 위로 퐁퐁 솟아오름
    const bAlpha = Math.sin(cycle * Math.PI) * alpha * 0.85;
    const bRadius = 3.0 + (b % 3) * 1.2;

    const bGrad = ctx.createRadialGradient(bx, by, 0, bx, by, bRadius);
    bGrad.addColorStop(0.00, `rgba(255, 255, 255, ${bAlpha})`);
    bGrad.addColorStop(0.40, `rgba(235, 248, 255, ${bAlpha * 0.85})`);
    bGrad.addColorStop(0.75, `rgba(186, 230, 253, ${bAlpha * 0.35})`);
    bGrad.addColorStop(1.00, "rgba(56, 189, 248, 0.0)");

    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.arc(bx, by, bRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * 닫힐 때 조개 모양의 투명도 잔상 렌더러 (Closing Shell Ghost Afterimages)
 * - 닫히는 속도에 비례하여 바깥쪽으로 뒤쳐진 2~3단계의 투명 조개 밸브 잔상 투영
 */
function drawClampShellAfterimages(
  ctx: any,
  cx: number,
  cy: number,
  openDist: number,
  openAngle: number,
  closeProgress: number, // 0.0 (시작) ~ 1.0 (닫힘 직전)
  scale: number,
  alpha: number
) {
  if (alpha <= 0.01) return;

  const speedFactor = Math.sin(closeProgress * Math.PI); // 가속도 피크
  const GHOST_COUNT = 3;

  for (let g = 1; g <= GHOST_COUNT; g++) {
    const lagDist = openDist + g * (6.5 + speedFactor * 7.5);
    const lagAngle = openAngle + g * (0.028 + speedFactor * 0.035);
    const ghostAlpha = alpha * (0.35 / (g * 1.30)) * (1.0 - closeProgress * 0.25);

    if (ghostAlpha > 0.01) {
      // 110번 껍질에숨기 조개 그래픽을 100% 재사용한 투명도 잔상
      drawClamValve(ctx, cx, cy, false, lagDist, lagAngle, scale, ghostAlpha);
      drawClamValve(ctx, cx, cy, true, lagDist, lagAngle, scale, ghostAlpha);
    }
  }
}

/**
 * 닫힌 조개 틈새에서 뿜어져 나오는 물 수증기 (Water Steam / Vapor Mist)
 * - 고압 압착에 의해 중앙 세로 접합선 틈새에서 퐁퐁 피어오르는 부드러운 화이트-연하늘 스팀 클라우드
 */
function drawClampSteam(
  ctx: any,
  cx: number,
  cy: number, // shellCy (중앙)
  alpha: number,
  timeSeed: number
) {
  if (alpha <= 0.01) return;

  ctx.save();
  const STEAM_PUFFS = 8;

  for (let i = 0; i < STEAM_PUFFS; i++) {
    // 틈새를 따라 세로로 고르게 분포 (-42px ~ +14px)
    const baseOffsetY = -42 + i * 7.5;
    const cycle = (timeSeed * 1.7 + i * 0.26) % 1.0;

    // 증기가 틈새에서 좌우/위쪽으로 부드럽게 뿜어져 나옴
    const sign = (i % 2 === 0) ? 1 : -1;
    const driftX = sign * (cycle * 13.0 + Math.sin(timeSeed * 2.2 + i) * 3.5);
    const driftY = baseOffsetY - cycle * 18.0; // 위로 모락모락 피어오름

    const px = cx + driftX;
    const py = cy + driftY;

    // 수증기 구름이 상승하면서 자연스럽게 팽창
    const radius = 4.5 + cycle * 13.5;
    // 부드러운 페이드인 -> 페이드아웃 곡선
    const puffAlpha = Math.sin(cycle * Math.PI) * alpha * 0.65;

    if (puffAlpha > 0.01) {
      const grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
      grad.addColorStop(0.00, `rgba(255, 255, 255, ${puffAlpha})`);
      grad.addColorStop(0.35, `rgba(240, 249, 255, ${puffAlpha * 0.85})`);
      grad.addColorStop(0.70, `rgba(186, 230, 253, ${puffAlpha * 0.35})`);
      grad.addColorStop(1.00, "rgba(186, 230, 253, 0.0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * 틈새 고압 물 타격 이펙트 (Seam Water Strike / High-Pressure Impact Burst)
 * - 조개가 쾅! 닫히며 틈새에서 뿜어져 나오는 날카로운 수류 제트 & 물빛 타격 스플래시
 */
function drawClampWaterStrike(
  ctx: any,
  cx: number,
  cy: number,
  progress: number, // 0.0 ~ 1.0 (타격 순간 진행도)
  alpha: number
) {
  if (alpha <= 0.01 || progress <= 0 || progress >= 1.0) return;

  ctx.save();
  const easeP = Math.pow(progress, 0.55);
  const fadeAlpha = Math.sin(progress * Math.PI) * alpha;

  // 1. 틈새 중앙 물 타격 섬광 (Water Strike Center Flash)
  const coreGrad = ctx.createRadialGradient(cx, cy - 10, 0, cx, cy - 10, 30 * easeP);
  coreGrad.addColorStop(0.00, `rgba(255, 255, 255, ${fadeAlpha * 0.95})`);
  coreGrad.addColorStop(0.35, `rgba(56, 189, 248, ${fadeAlpha * 0.85})`);
  coreGrad.addColorStop(0.75, `rgba(14, 165, 233, ${fadeAlpha * 0.35})`);
  coreGrad.addColorStop(1.00, "rgba(2, 132, 199, 0.0)");
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy - 10, 30 * easeP, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 128: 껍질에끼우기 배후 레이어 이펙트 (Background Layer)
 * - 바닥 아쿠아 수면 풀 & 잔잔한 파문, 조개 개방 시 배후 어두운 내부 동굴 깊이 그림자
 */
export function drawClampBehindEffect(
  ctx: any,
  frame: any,
  drawCtx: any
) {
  const step = frame.moveStep ?? 1;
  const p = frame.effectProgress ?? 0.5;
  const isP = drawCtx?.isPlayer ?? true;

  const tx = drawCtx?.targetPos?.x ?? 160;
  const ty = drawCtx?.targetPos?.y ?? 60;

  const targetOff = isP ? (frame.eOffset ?? { x: 0, y: 0 }) : (frame.pOffset ?? { x: 0, y: 0 });
  const liveTargetX = tx + targetOff.x;
  const liveTargetY = ty + targetOff.y;
  const groundY = liveTargetY + 34;

  ctx.save();

  // 바닥 얕은 아쿠아 수면 웅덩이 & 잔잔한 파문
  const poolAlpha = Math.min(0.65, (step === 4 ? (1.0 - p) : p) * 0.65);
  if (poolAlpha > 0.01) {
    const poolGrad = ctx.createRadialGradient(liveTargetX, groundY, 0, liveTargetX, groundY, 48);
    poolGrad.addColorStop(0.0, `rgba(224, 242, 254, ${poolAlpha * 0.70})`);
    poolGrad.addColorStop(0.5, `rgba(56, 189, 248, ${poolAlpha * 0.45})`);
    poolGrad.addColorStop(1.0, "rgba(2, 132, 199, 0.0)");
    ctx.fillStyle = poolGrad;
    ctx.beginPath();
    ctx.ellipse(liveTargetX, groundY, 48, 15, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 조개 개방 시 대상 배후에 생기는 어두운 심해 바이올렛 깊이 그림자 (조개 내부 공간감)
  let openProg = 0.0;
  let shellAlpha = 1.0;
  if (step === 1) {
    shellAlpha = Math.min(1.0, p * 2.2);
    openProg = 0.5 + p * 0.5;
  } else if (step === 2) {
    shellAlpha = 1.0;
    openProg = p < 0.35 ? Math.pow(1.0 - p / 0.35, 2.0) : 0.0;
  } else if (step === 3) {
    shellAlpha = 1.0;
    openProg = 0.0;
  } else if (step === 4) {
    shellAlpha = Math.max(0, 1.0 - p);
    openProg = p * 0.65;
  }

  if (openProg > 0.12 && shellAlpha > 0.05) {
    const shadowAlpha = shellAlpha * openProg * 0.42;
    const bgGrad = ctx.createRadialGradient(liveTargetX, liveTargetY + 2, 6, liveTargetX, liveTargetY + 2, 44);
    bgGrad.addColorStop(0.0, `rgba(28, 18, 48, ${shadowAlpha})`);
    bgGrad.addColorStop(0.65, `rgba(45, 28, 77, ${shadowAlpha * 0.55})`);
    bgGrad.addColorStop(1.0, "rgba(45, 28, 77, 0.0)");
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.ellipse(liveTargetX, liveTargetY + 2, 36, 44, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 128: 껍질에끼우기 전면 메인 레이어 이펙트 (Front Layer)
 * - 110번 껍질에숨기(Withdraw) 보라색 달걀형 조개 껍질(drawClamValve) 100% 재사용
 * - 닫힐 때 조개 모양의 투명도 잔상 궤적 (Shell Ghost Afterimages)
 * - 쾅! 닫힘 직격 시 틈새 물 타격(Water Strike) 및 충격파
 * - 닫힌 틈새에서 모락모락 뿜어져 나오는 물 수증기(Water Steam)
 * - 2단 연속 압박 조이기(Squeeze Pulse) & 틈새 수포 분출
 */
export function drawClampEffect(
  ctx: any,
  frame: any,
  drawCtx: any
) {
  const step = frame.moveStep ?? 1;
  const p = frame.effectProgress ?? 0.5;
  const isP = drawCtx?.isPlayer ?? true;

  const tx = drawCtx?.targetPos?.x ?? 160;
  const ty = drawCtx?.targetPos?.y ?? 60;

  const targetOff = isP ? (frame.eOffset ?? { x: 0, y: 0 }) : (frame.pOffset ?? { x: 0, y: 0 });
  const liveTargetX = tx + targetOff.x;
  const liveTargetY = ty + targetOff.y;
  const shellCy = liveTargetY + 14; // 조개 세로 중심이 피격 포켓몬 중심과 완벽 일치하도록 보정
  const timeSeed = p * 12.0;

  const SHELL_SCALE = 1.25;
  const MAX_OPEN_DIST = 46;
  const MAX_OPEN_ANGLE = 22 * (Math.PI / 180);

  ctx.save();

  let openDist = 0.0;
  let openAngle = 0.0;
  let shellAlpha = 1.0;
  let currentScale = SHELL_SCALE;

  // 닫히는 중인지 여부 (잔상 렌더링용)
  let isClosing = false;
  let closeProgress = 0.0;

  // 틈새 물 타격 진행도 및 수증기 알파
  let strikeProgress = 0.0;
  let strikeAlpha = 0.0;
  let steamAlpha = 0.0;

  if (step === 1) {
    // Phase 1: 껍질 소환 & 활짝 벌어지며 대상 포위 (0.5 -> 1.0 개방)
    shellAlpha = Math.min(1.0, p * 2.2);
    const prog = 0.5 + p * 0.5;
    openDist = MAX_OPEN_DIST * prog;
    openAngle = MAX_OPEN_ANGLE * prog;
  } else if (step === 2) {
    // Phase 2: 1차 쾅! 초고속 닫힘 돌진 및 맞물림 직격 (SNAP!)
    shellAlpha = 1.0;
    if (p < 0.35) {
      // 급가속 닫힘 (0.35 미만에서 46px -> 0px)
      closeProgress = p / 0.35;
      isClosing = true;
      const easeClose = Math.pow(1.0 - closeProgress, 2.0);
      openDist = MAX_OPEN_DIST * easeClose;
      openAngle = MAX_OPEN_ANGLE * easeClose;

      // 좌우 고속 추진 속도선 (Water rush trails)
      ctx.save();
      ctx.strokeStyle = "rgba(165, 156, 231, 0.75)";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(liveTargetX - openDist - 24, liveTargetY - 4);
      ctx.lineTo(liveTargetX - openDist - 6, liveTargetY - 4);
      ctx.moveTo(liveTargetX - openDist - 20, liveTargetY + 10);
      ctx.lineTo(liveTargetX - openDist - 4, liveTargetY + 10);

      ctx.moveTo(liveTargetX + openDist + 24, liveTargetY - 4);
      ctx.lineTo(liveTargetX + openDist + 6, liveTargetY - 4);
      ctx.moveTo(liveTargetX + openDist + 20, liveTargetY + 10);
      ctx.lineTo(liveTargetX + openDist + 4, liveTargetY + 10);
      ctx.stroke();
      ctx.restore();
    } else {
      // 쾅! 완전히 닫힌 상태 (openDist = 0, openAngle = 0)
      openDist = 0.0;
      openAngle = 0.0;

      // 닫힘 직격 충격파, 물 타격, 물방울 비산
      const impactProg = (p - 0.35) / 0.65;
      strikeProgress = impactProg;
      strikeAlpha = 0.95;

      // 닫힌 직후부터 틈새에서 모락모락 피어오르는 물 수증기
      steamAlpha = Math.min(0.95, impactProg * 2.0);

      drawClampWaterSparks(ctx, liveTargetX, liveTargetY, impactProg, 0.90);
    }
  } else if (step === 3) {
    // Phase 3: 2단 연속 압박 조이기 (SQUEEZE PULSE)
    shellAlpha = 1.0;
    // 2회 압박 사인파 펄스
    const pulse = Math.sin(p * Math.PI * 2);
    openDist = Math.max(0, pulse) * 2.2;
    openAngle = Math.max(0, pulse) * 0.015;
    currentScale = SHELL_SCALE * (1.0 + Math.abs(pulse) * 0.035);

    // 틈새 물 수증기 지속 분출
    steamAlpha = 0.85;

    // 틈새 수포 분출
    drawClampBubbles(ctx, liveTargetX, liveTargetY, 0.85, timeSeed);

    // 펄스 절정 시 미니 물 타격 제트
    const pulsePhase = (p * 2) % 1.0;
    if (pulsePhase > 0.05 && pulsePhase < 0.60) {
      const pNorm = pulsePhase / 0.60;
      drawClampWaterStrike(ctx, liveTargetX, shellCy, pNorm, 0.70);
    }
  } else if (step === 4) {
    // Phase 4: 껍질 개방 & 페이드아웃
    shellAlpha = Math.max(0, 1.0 - p);
    openDist = p * 28;
    openAngle = p * (12 * Math.PI / 180);

    // 개방 시 잔여 수증기 확산 소멸
    steamAlpha = (1.0 - p) * 0.45;

    // 소멸 시 잔여 수적 비산
    drawClampWaterSparks(ctx, liveTargetX, liveTargetY, p, shellAlpha * 0.70);
  }

  // 1. [닫힐 때 조개 모양의 투명도 잔상] (Shell Ghost Afterimages)
  // 닫히는 과정에서 조개 본체 뒤쪽에 2~3단계의 투명 조개 궤적 렌더링
  if (isClosing) {
    drawClampShellAfterimages(
      ctx,
      liveTargetX,
      shellCy,
      openDist,
      openAngle,
      closeProgress,
      currentScale,
      shellAlpha
    );
  }

  // 2. [110번 껍질에숨기 조개 껍질 본체 결합 렌더링]
  drawClampBivalveShell(
    ctx,
    liveTargetX,
    shellCy,
    openDist,
    openAngle,
    currentScale,
    shellAlpha
  );

  // 3. [틈새 고압 물 타격] (Seam Water Strike)
  // 조개가 쾅! 닫히며 틈새에서 뿜어져 나오는 날카로운 수류 제트 및 중앙 섬광
  if (strikeAlpha > 0.01 && strikeProgress > 0) {
    drawClampWaterStrike(ctx, liveTargetX, shellCy, strikeProgress, strikeAlpha);
  }

  // 4. [틈새 물 수증기] (Water Steam / Vapor Puffs)
  // 닫힌 조개 틈새(접합선)에서 모락모락 피어오르는 부드러운 화이트-연하늘 스팀
  if (steamAlpha > 0.01) {
    drawClampSteam(ctx, liveTargetX, shellCy, steamAlpha, timeSeed);
  }

  ctx.restore();
}

