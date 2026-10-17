// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawCartoonBone, getBoneParabolaPos } from "./move125_128.js";
import { drawStarburstImpact, drawMiniRetroStar } from "../common/helpers.js";

// ============================================================================
// 🥋 197: 판별 (Detect) - 격투 타입 변화 기술
//
// 유저 지시 심플 연출:
// [전장 암전] ➔ [시전 포켓몬 포커싱 & 흰색 필터] ➔ [십자별 빤짝!] ➔ [페이드아웃 복귀]
// ============================================================================

/**
 * 인자 유연 파싱 헬퍼 (targetCtx, frame, drawCtx 또는 직접 좌표 호출 지원)
 */
function parseDetectArgs(
  frameOrTargetPos: any,
  drawCtxOrStep?: any,
  stepArg?: number,
  progArg?: number,
  isPlayerArg?: boolean
) {
  let ax = 130;
  let ay = 220;
  let step = 1;
  let p = 0.5;
  let isP = true;
  let frameObj: BattleFrame | null = null;

  if (frameOrTargetPos && typeof frameOrTargetPos === "object" && "x" in frameOrTargetPos) {
    ax = frameOrTargetPos.x;
    ay = frameOrTargetPos.y;
    step = typeof drawCtxOrStep === "number" ? drawCtxOrStep : (stepArg ?? 1);
    p = typeof progArg === "number" ? progArg : 0.5;
    isP = isPlayerArg ?? (typeof drawCtxOrStep === "object" && drawCtxOrStep?.isPlayer !== undefined ? Boolean(drawCtxOrStep.isPlayer) : (ax < 250));
  } else {
    frameObj = (frameOrTargetPos as BattleFrame) || null;
    const drawCtx = (drawCtxOrStep as EffectDrawContext) || {};
    const aPos = drawCtx.attackerPos || drawCtx.casterPos || { x: 130, y: 220 };
    ax = aPos.x;
    ay = aPos.y;
    step = frameObj?.moveStep ?? (typeof drawCtxOrStep === "number" ? drawCtxOrStep : 1);
    p = frameObj?.effectProgress ?? 0.5;
    isP = drawCtx.isPlayer !== undefined ? Boolean(drawCtx.isPlayer) : true;
  }

  return { ax, ay, step, p, isP, frame: frameObj };
}

/**
 * 진정한 십자별 렌더러 (True Anime Cross Star)
 * - 마름모(다이아몬드) 느낌을 완전히 없애기 위해 가로/세로 바늘 광선이 직교 교차하는 정통 십자(+) 구조 적용
 * - 4개 팔이 중심에서 독립적으로 뻗어나와 깊은 V자 음각을 형성하므로 마름모로 보이지 않음
 * - 끝부분은 0px 바늘 끝으로 뾰족하게 빠짐
 * - 외곽 청록(시안) 림 + 내부 순백 코어
 */
function drawCrossStar(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  alpha: number,
  rotation: number = 0
) {
  if (alpha <= 0.01 || size <= 0.5) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.translate(cx, cy);
  if (rotation !== 0) {
    ctx.rotate(rotation);
  }

  const rx = size * 1.75;
  const ry = size * 1.75;
  const w = Math.max(1.0, size * 0.17);
  const rim = Math.max(1.0, size * 0.15);

  // 1. 외곽 시안에서 내부 순백 코어로 이어지는 부드러운 다단계 림 그라데이션
  // 흰색 영역의 외곽과 하늘색(시안) 영역 사이를 매끄럽게 연결
  const GRAD_STEPS = 12;
  const outerRx = rx + rim;
  const outerRy = ry + rim;
  const outerW = w + rim;

  const innerRx = rx * 0.70;
  const innerRy = ry * 0.70;
  const innerW = w * 0.60;

  for (let i = GRAD_STEPS; i >= 0; i--) {
    const t = i / GRAD_STEPS; // 1.0 (외곽 시안) -> 0.0 (내부 순백)

    // 비선형 컬러 커브: 내부 화이트 코어는 탄탄하게 유지하며 외곽으로 갈수록 시안으로 번짐
    const colorT = Math.pow(t, 1.25);
    const r = Math.round(255 * (1.0 - colorT));
    const g = Math.round(255 - 15 * colorT);
    const b = 255;
    const stepColor = `rgb(${r}, ${g}, ${b})`;

    const curRx = innerRx + (outerRx - innerRx) * t;
    const curRy = innerRy + (outerRy - innerRy) * t;
    const curW = innerW + (outerW - innerW) * t;

    ctx.fillStyle = stepColor;

    // 가로 빔
    ctx.beginPath();
    ctx.moveTo(-curRx, 0);
    ctx.lineTo(0, -curW);
    ctx.lineTo(curRx, 0);
    ctx.lineTo(0, curW);
    ctx.closePath();
    ctx.fill();

    // 세로 빔
    ctx.beginPath();
    ctx.moveTo(0, -curRy);
    ctx.lineTo(curW, 0);
    ctx.lineTo(0, curRy);
    ctx.lineTo(-curW, 0);
    ctx.closePath();
    ctx.fill();
  }

  // 2. 중심부 교차 결합 다이아몬드 코어 (부드러운 중심 순백 발광 블렌딩)
  const cSize = innerW * 1.4;
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(0, -cSize);
  ctx.lineTo(cSize, 0);
  ctx.lineTo(0, cSize);
  ctx.lineTo(-cSize, 0);
  ctx.closePath();
  ctx.fill();

  // 3. 중심 샤프 헤어라인 광선 (순백 핀포인트 강조)
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1.0;
  ctx.lineCap = "butt";
  ctx.beginPath();
  ctx.moveTo(-innerRx * 0.95, 0);
  ctx.lineTo(innerRx * 0.95, 0);
  ctx.moveTo(0, -innerRy * 0.95);
  ctx.lineTo(0, innerRy * 0.95);
  ctx.stroke();

  ctx.restore();
}

/**
 * 🥋 메인 이펙트 진입점: drawDetectEffect
 */
export function drawDetectEffect(
  targetCtx: any,
  frameOrTargetPos: any,
  drawCtxOrStep?: any,
  stepArg?: number,
  progArg?: number,
  isPlayerArg?: boolean
) {
  if (!targetCtx) return;

  const { ax, ay, step, p, isP, frame } = parseDetectArgs(
    frameOrTargetPos,
    drawCtxOrStep,
    stepArg,
    progArg,
    isPlayerArg
  );

  // 시전자 스프라이트 동적 오프셋 반영 좌표
  const curX = ax + (isP ? (frame?.pOffset?.x ?? 0) : (frame?.eOffset?.x ?? 0));
  const curY = ay + (isP ? (frame?.pOffset?.y ?? 0) : (frame?.eOffset?.y ?? 0));

  // 시전 포켓몬의 눈/전방 포인트 (바라보는 방향으로 과감하게 전방 배치)
  const eyeX = curX + (isP ? 50 : -42);
  const eyeY = curY - (isP ? 32 : 20);

  // ===========================================================================
  // Step 1: [1단계 - 대형] 십자별 플래시 출현 & 대형 스핀 (Large Stage)
  // ===========================================================================
  if (step === 1) {
    const t = Math.min(1.0, Math.max(0.0, p));
    // 1단계 대형: 26px -> 20px
    const starSize = 26 - t * 6;
    const starAlpha = 0.92 + t * 0.08;
    const rot = t * 0.65; // 0° -> ~37°

    drawCrossStar(targetCtx, eyeX, eyeY, starSize, starAlpha, rot);
  }

  // ===========================================================================
  // Step 2: [2단계 - 중형] 중형 압축 & 다이내믹 가속 스핀 (Medium Stage)
  // ===========================================================================
  else if (step === 2) {
    const t = Math.min(1.0, Math.max(0.0, p));
    // 2단계 중형: 19px -> 13px
    const starSize = 19 - t * 6;
    const rot = 0.65 + t * 0.90; // ~37° -> ~89°

    drawCrossStar(targetCtx, eyeX, eyeY, starSize, 1.0, rot);
  }

  // ===========================================================================
  // Step 3: [3단계 - 소형] 미세 핀포인트 수렴 & 부드러운 소산 (Small Stage)
  // ===========================================================================
  else if (step === 3) {
    const t = Math.min(1.0, Math.max(0.0, p));
    // 3단계 소형: 12px -> 2px
    const starSize = Math.max(2, 12 - t * 10);
    const settleAlpha = Math.max(0.0, 1.0 - t * 1.25);
    const rot = 1.55 + t * 0.85; // ~89° -> ~138°

    if (settleAlpha > 0.01) {
      drawCrossStar(targetCtx, eyeX, eyeY, starSize, settleAlpha, rot);
    }
  }
}

// ============================================================================
// ============================================================================
// 🦴 198: 본러시 (Bone Rush) - 땅 타입 물리 연속 공격 기술 (2~5회)
//
// 연출 구성 (유저 요청 100% 반영: "뼈다귀 던지기를 연속으로 하는 걸로 연출"):
// 1. 뼈 에셋: 뼈다귀치기/뼈다귀부메랑(drawCartoonBone) 포켓몬 정통 뼈다귀 100% 동일 활용
// 2. 뼈다귀치기의 검증된 포물선 탄도(getBoneParabolaPos) & 지면 그림자 & 회전 윈드 아크(drawTaperedWindArc)
// 3. 다발성 연속 투척 (Rapid Consecutive Bone Throws):
//    - Step 1: 시전자 연속 투척 준비 와인드업
//    - Step 2: 1번 뼈 포물선 회전 비행 ➔ 상대 머리 톡! 직격 (1타)
//    - Step 3: 1번 뼈 우측 튕겨나감과 동시에 2번 뼈 쾌속 비행 ➔ 상대 머리 톡! 직격 (2타)
//    - Step 4: 2번 뼈 우측 튕겨나감과 동시에 3번 뼈 쾌속 비행 ➔ 상대 머리 톡! 직격 (3타)
//    - Step 5: 3번 뼈 우측 튕겨나감과 동시에 4번 피니시 뼈 고각 쇄도 ➔ 쾅! 피니시 직격 (4타 피니시)
//    - Step 6: 4번 뼈 우측 튕겨나감 & 페이드 소멸
// 4. 불필요한 이펙트나 파티클 최소화 지침 엄수:
//    - 흙먼지 연기, 잡다한 폭발/파티클 0개 배제
//    - 오직 포물선 그림자, 회전 윈드 아크, 샤프한 임팩트 선(drawCleanHitImpact)으로 경쾌한 타격감 구현
// ============================================================================

/**
 * 뼈다귀의 왜건 휠(Wagon-Wheel) 정지 착시를 완벽 차단하는 직접 회전각 계산
 * - 뼈는 180° 점대칭이므로, 프레임마다 약 65°~75°씩 명확히 변해야 시각적 회전이 극대화됨
 * - normalizedP (0.0 ~ 1.0)에 따라 프레임마다 뼈의 형태가 대각선 ➔ 세로 ➔ 가로 ➔ 반대 대각선으로 역동적으로 전환
 */
function getBoneSpinAngle(p: number, boneIndex: number, isP: boolean): number {
  const dir = isP ? 1 : -1;
  const initOffsets = [0.45, 1.15, 0.25, 0.90];
  const baseOffset = initOffsets[boneIndex % initOffsets.length];
  // 0.0 ~ 1.0 동안 4.4 rad (~252°)를 회전하여 각 프레임(간격 0.25)마다 약 63°~70°씩 확실하게 회전
  return (baseOffset + p * 4.4) * dir;
}

/**
 * 포물선 회전 비행 중인 단일 뼈다귀 렌더러
 * - 유저 요청 반영: 회전선(바람 아크) 완전 제거 및 뼈다귀 자체의 직접 회전 각도 명확화
 */
function renderFlyingBone(
  ctx: any,
  launchX: number,
  launchY: number,
  targetHitX: number,
  targetHitY: number,
  p: number,
  arcHeight: number,
  groundStartY: number,
  groundTargetY: number,
  isP: boolean,
  boneIndex: number = 0
) {
  const clampedP = Math.max(0, Math.min(1.0, p));
  const curPos = getBoneParabolaPos(launchX, launchY, targetHitX, targetHitY, clampedP, arcHeight);

  // 1. 바닥 타원형 그림자 추적
  const shadowY = groundStartY + (groundTargetY - groundStartY) * clampedP;
  const heightFactor = Math.sin(clampedP * Math.PI);
  const shadowAlpha = Math.max(0.10, 0.40 * (1.0 - heightFactor * 0.45));
  const shadowRx = 14 * (1.0 - heightFactor * 0.35);
  const shadowRy = 6 * (1.0 - heightFactor * 0.35);

  ctx.save();
  ctx.fillStyle = `rgba(20, 24, 39, ${shadowAlpha})`;
  ctx.beginPath();
  ctx.ellipse(curPos.x, shadowY, shadowRx, shadowRy, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. 뼈다귀 직접 회전 (왜건 휠 착시 방지 황금각 매핑, 회전선 완전 배제)
  const spinAngle = getBoneSpinAngle(clampedP, boneIndex, isP);
  drawCartoonBone(ctx, curPos.x, curPos.y, spinAngle, 1.15, 1.0, true);
}

/**
 * 타격 후 우측으로 튕겨져 나가는 단일 뼈다귀 렌더러
 */
function renderRicochetBone(
  ctx: any,
  hitX: number,
  hitY: number,
  bounceProg: number,
  isP: boolean
) {
  const p = Math.max(0, Math.min(1.0, bounceProg));
  const bounceDir = isP ? 1 : -1;
  const bounceX = hitX + bounceDir * p * 86;
  const bounceArcY = Math.sin(p * Math.PI) * 38;
  const bounceY = hitY - bounceArcY + p * 26;

  const impactRot = isP ? 0.65 : -0.65;
  const rapidSpinAngle = impactRot + p * Math.PI * 8.0 * bounceDir;
  const fadeAlpha = Math.max(0, 1.0 - Math.pow(p, 1.25) * 1.05);

  if (fadeAlpha > 0.02) {
    drawCartoonBone(ctx, bounceX, bounceY, rapidSpinAngle, 1.10, fadeAlpha, true);
  }
}

/**
 * 본러시 인자 유연 파싱 헬퍼
 */
function parseBoneRushArgs(
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
  let frameObj: BattleFrame | null = null;

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
    step = frameObj?.moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, frameObj?.effectProgress ?? 0.5));
    isP = Boolean(drawCtx.isPlayer);
  }

  return { ax, ay, tx, ty, step, p, isP, frame: frameObj };
}

/**
 * 🦴 198: 본러시 (Bone Rush) 후방 레이어 렌더러
 */
export function drawBoneRushBehindEffect(
  _ctx: any,
  _attackerPosOrFrame: any,
  _targetPosOrDrawCtx: any,
  _moveStep?: number,
  _progress?: number,
  _isPlayer?: boolean
) {
  // 후방 레이어는 기본 투명
}

/**
 * 🦴 198: 본러시 (Bone Rush) 전면 메인 렌더러
 */
export function drawBoneRushEffect(
  ctx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  if (!ctx) return;

  const { ax, ay, tx, ty, step, p, isP, frame } = parseBoneRushArgs(
    attackerPosOrFrame,
    targetPosOrDrawCtx,
    moveStep,
    progress,
    isPlayer
  );

  // 스프라이트 동적 오프셋 반영 좌표
  const curAx = ax + (isP ? (frame?.pOffset?.x ?? 0) : (frame?.eOffset?.x ?? 0));
  const curAy = ay + (isP ? (frame?.pOffset?.y ?? 0) : (frame?.eOffset?.y ?? 0));
  const curTx = tx + (isP ? (frame?.eOffset?.x ?? 0) : (frame?.pOffset?.x ?? 0));
  const curTy = ty + (isP ? (frame?.eOffset?.y ?? 0) : (frame?.pOffset?.y ?? 0));

  const dir = isP ? 1 : -1;

  // 투척 시작점 (시전자 앞/손 부근)
  const launchX = curAx + dir * 34;
  const launchY = curAy - (isP ? 16 : 14);

  // 대상 타격 지점 (대상 머리/상단 부근)
  const targetHitX = curTx - dir * 6;
  const targetHitY = curTy - (isP ? 18 : 12);

  // 바닥 그림자 기준 Y좌표
  const groundStartY = curAy + 24;
  const groundTargetY = curTy + 24;

  ctx.save();

  // ==========================================================================
  // Step 1: 시전자 연속 투척 준비 와인드업 (손에서 1번 뼈다귀 장전)
  // ==========================================================================
  if (step === 1) {
    const prepRotation = isP ? -0.45 : 0.45;
    drawCartoonBone(ctx, launchX, launchY, prepRotation, 1.15, 1.0, false);
  }

  // ==========================================================================
  // Step 2: 1번 뼈 포물선 회전 비행 & 직격 타격 (1타)
  // ==========================================================================
  else if (step === 2) {
    if (p < 0.90) {
      // 1번 뼈 비행 (boneIndex: 0)
      renderFlyingBone(
        ctx,
        launchX,
        launchY,
        targetHitX,
        targetHitY,
        p / 0.90,
        75,
        groundStartY,
        groundTargetY,
        isP,
        0
      );
    } else {
      // 1번 뼈 톡! 타격 직격 (유저 지시: 십자선 제거, 뼈 본체 닿음만 깔끔하게)
      const impactRot = isP ? 0.65 : -0.65;
      drawCartoonBone(ctx, targetHitX, targetHitY, impactRot, 1.25, 1.0, false);
    }
  }

  // ==========================================================================
  // Step 3: 1번 뼈 우측 튕겨나감 + 2번 뼈 동시 쾌속 투척 비행 & 직격 (2타)
  // ==========================================================================
  else if (step === 3) {
    // 1번 뼈는 오른쪽으로 튕겨나감
    renderRicochetBone(ctx, targetHitX, targetHitY, p, isP);

    // 2번 뼈 (살짝 더 낮고 빠른 탄도, boneIndex: 1)
    const hit2X = targetHitX + dir * 3;
    const hit2Y = targetHitY + 4;
    if (p < 0.90) {
      renderFlyingBone(
        ctx,
        launchX,
        launchY,
        hit2X,
        hit2Y,
        p / 0.90,
        65,
        groundStartY,
        groundTargetY,
        isP,
        1
      );
    } else {
      // 2번 뼈 톡! 타격 직격 (십자선 제거)
      const impactRot = isP ? 0.70 : -0.70;
      drawCartoonBone(ctx, hit2X, hit2Y, impactRot, 1.25, 1.0, false);
    }
  }

  // ==========================================================================
  // Step 4: 2번 뼈 우측 튕겨나감 + 3번 뼈 동시 쾌속 투척 비행 & 직격 (3타)
  // ==========================================================================
  else if (step === 4) {
    // 2번 뼈는 오른쪽으로 튕겨나감
    renderRicochetBone(ctx, targetHitX + dir * 3, targetHitY + 4, p, isP);

    // 3번 뼈 (boneIndex: 2)
    const hit3X = targetHitX - dir * 3;
    const hit3Y = targetHitY - 2;
    if (p < 0.90) {
      renderFlyingBone(
        ctx,
        launchX,
        launchY,
        hit3X,
        hit3Y,
        p / 0.90,
        80,
        groundStartY,
        groundTargetY,
        isP,
        2
      );
    } else {
      // 3번 뼈 톡! 타격 직격 (십자선 제거)
      const impactRot = isP ? 0.60 : -0.60;
      drawCartoonBone(ctx, hit3X, hit3Y, impactRot, 1.25, 1.0, false);
    }
  }

  // ==========================================================================
  // Step 5: 3번 뼈 우측 튕겨나감 + 4번 피니시 뼈 고각 쇄도 & 쾅 직격! (4타 피니시)
  // ==========================================================================
  else if (step === 5) {
    // 3번 뼈는 오른쪽으로 튕겨나감
    renderRicochetBone(ctx, targetHitX - dir * 3, targetHitY - 2, p, isP);

    // 4번 피니시 뼈 (고각 95px 상공 포물선, boneIndex: 3)
    const hit4X = targetHitX;
    const hit4Y = targetHitY - 6;
    if (p < 0.90) {
      renderFlyingBone(
        ctx,
        launchX,
        launchY,
        hit4X,
        hit4Y,
        p / 0.90,
        95,
        groundStartY,
        groundTargetY,
        isP,
        3
      );
    } else {
      // 4번 뼈 쾅! 피니시 직격 (십자선 제거)
      const impactRot = isP ? 0.75 : -0.75;
      drawCartoonBone(ctx, hit4X, hit4Y, impactRot, 1.35, 1.0, false);
    }
  }

  // ==========================================================================
  // Step 6: 4번 피니시 뼈 우측 튕겨나감 & 페이드아웃 소멸
  // ==========================================================================
  else if (step === 6) {
    renderRicochetBone(ctx, targetHitX, targetHitY - 6, p, isP);
  }

  ctx.restore();
}

// ============================================================================
// 🎯 199: 록온 (Lock-On) - 노말 타입 변화 기술
//
// 유저 지시 연출:
// - 조준경이 대상포켓몬을 조준
// - 꿰뚫어보기랑 동일한 움직임이나 대상은 상대
// 1. 조준경이 상대 포켓몬 좌측에 출현
// 2. 상대 포켓몬의 좌 ➔ 우 ➔ 좌를 부드럽게 오가며 스캔 (Step 1)
// 3. 상대 포켓몬 좌측에서 중심(몸체)으로 조준경이 슥 이동 (Step 2)
// 4. 대상 포켓몬 위치에서 조준경 페이드아웃 + 대상 포켓몬 살짝 붉은/백색 록온 페이드 적용 (Step 3)
// 5. 대상 포켓몬 록온 페이드 잔향 마무리 및 안정 복귀 (Step 4)
// ============================================================================

/**
 * 인자 파싱 헬퍼
 */
function parseLockOnArgs(
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
  let frameObj: any = null;

  if (attackerPosOrFrame && typeof attackerPosOrFrame === "object" && "x" in attackerPosOrFrame) {
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
    frameObj = attackerPosOrFrame || {};
    const drawCtx = targetPosOrDrawCtx || {};
    const aPos = drawCtx.casterPos || drawCtx.attackerPos || { x: 130, y: 220 };
    const tPos = drawCtx.targetPos || { x: 380, y: 130 };
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
 * 🎯 정밀 조준경 (Tactical Lock-On Crosshair Reticle) 렌더링 함수
 * - 메인: 전체 순백 (Pure White #FFFFFF, 브래킷/십자선/삼각포인터/원형링/핀포인트 모두 흰색)
 * - 잔상: 움직일 때 점차 투명해지는 하늘색(Sky-Blue / Cyan) 애프터이미지
 */
function drawCrosshairScope(
  ctx: any,
  cx: number,
  cy: number,
  radius: number = 20,
  alpha: number = 1.0,
  isLocked: boolean = false,
  isPlayer: boolean = true,
  lockProgress: number = 0,
  isGhost: boolean = false
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.translate(cx, cy);

  if (isGhost) {
    // =========================================================================
    // 🌌 하늘색 투명 잔상 (Sky-Blue Translucent Afterimage)
    // =========================================================================
    // 1. 외곽 하늘색 은은한 글로우
    ctx.strokeStyle = "rgba(56, 189, 248, 0.40)";
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // 2. 메인 조준경 링 (하늘색)
    ctx.strokeStyle = "#38BDF8";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // 3. 4분면 브래킷 (하늘색)
    const bracketDist = radius + 4;
    const bLen = 5;
    ctx.strokeStyle = "#7DD3FC";
    ctx.lineWidth = 1.4;
    ctx.lineCap = "square";

    // Top-Left [
    ctx.beginPath();
    ctx.moveTo(-bracketDist, -bracketDist + bLen);
    ctx.lineTo(-bracketDist, -bracketDist);
    ctx.lineTo(-bracketDist + bLen, -bracketDist);
    ctx.stroke();

    // Top-Right ]
    ctx.beginPath();
    ctx.moveTo(bracketDist - bLen, -bracketDist);
    ctx.lineTo(bracketDist, -bracketDist);
    ctx.lineTo(bracketDist, -bracketDist + bLen);
    ctx.stroke();

    // Bottom-Left [
    ctx.beginPath();
    ctx.moveTo(-bracketDist, bracketDist - bLen);
    ctx.lineTo(-bracketDist, bracketDist);
    ctx.lineTo(-bracketDist + bLen, bracketDist);
    ctx.stroke();

    // Bottom-Right ]
    ctx.beginPath();
    ctx.moveTo(bracketDist - bLen, bracketDist);
    ctx.lineTo(bracketDist, bracketDist);
    ctx.lineTo(bracketDist, bracketDist - bLen);
    ctx.stroke();

    // 4. 십자선 (중심 개방)
    const innerR = radius * 0.42;
    const outerR = radius * 1.25;
    ctx.strokeStyle = "#38BDF8";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-outerR, 0); ctx.lineTo(-innerR, 0);
    ctx.moveTo(innerR, 0);  ctx.lineTo(outerR, 0);
    ctx.moveTo(0, -outerR); ctx.lineTo(0, -innerR);
    ctx.moveTo(0, innerR);  ctx.lineTo(0, outerR);
    ctx.stroke();

    // 5. 정중앙 미세 핀포인트
    ctx.fillStyle = "#BAE6FD";
    ctx.beginPath();
    ctx.arc(0, 0, 1.4, 0, Math.PI * 2);
    ctx.fill();

  } else {
    // =========================================================================
    // 🎯 메인 조준경: 전체 순백 (Entirely Crisp Pure White)
    // =========================================================================
    // 1. 외곽 순백 / 미세 시안 글로우
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 4.8;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // 2. 어두운 그림자 테두리 (어떤 배경에서도 순백이 선명하게 보이도록)
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // 3. 메인 조준경 링 (순백)
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // 4. 4분면 외곽 브래킷 HUD ([ ]) - 전체 순백
    // 락온 진행도에 따라 외곽에서 안쪽으로 쫀득하게 수축 스냅
    const bracketDist = isLocked
      ? radius + 4 - Math.sin(lockProgress * Math.PI) * 2.2
      : radius + 5;
    const bLen = 6;

    // 브래킷 그림자
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 3.2;
    ctx.lineCap = "square";
    // Top-Left [
    ctx.beginPath();
    ctx.moveTo(-bracketDist, -bracketDist + bLen);
    ctx.lineTo(-bracketDist, -bracketDist);
    ctx.lineTo(-bracketDist + bLen, -bracketDist);
    ctx.stroke();
    // Top-Right ]
    ctx.beginPath();
    ctx.moveTo(bracketDist - bLen, -bracketDist);
    ctx.lineTo(bracketDist, -bracketDist);
    ctx.lineTo(bracketDist, -bracketDist + bLen);
    ctx.stroke();
    // Bottom-Left [
    ctx.beginPath();
    ctx.moveTo(-bracketDist, bracketDist - bLen);
    ctx.lineTo(-bracketDist, bracketDist);
    ctx.lineTo(-bracketDist + bLen, bracketDist);
    ctx.stroke();
    // Bottom-Right ]
    ctx.beginPath();
    ctx.moveTo(bracketDist - bLen, bracketDist);
    ctx.lineTo(bracketDist, bracketDist);
    ctx.lineTo(bracketDist, bracketDist - bLen);
    ctx.stroke();

    // 브래킷 메인 순백
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.8;
    // Top-Left [
    ctx.beginPath();
    ctx.moveTo(-bracketDist, -bracketDist + bLen);
    ctx.lineTo(-bracketDist, -bracketDist);
    ctx.lineTo(-bracketDist + bLen, -bracketDist);
    ctx.stroke();
    // Top-Right ]
    ctx.beginPath();
    ctx.moveTo(bracketDist - bLen, -bracketDist);
    ctx.lineTo(bracketDist, -bracketDist);
    ctx.lineTo(bracketDist, -bracketDist + bLen);
    ctx.stroke();
    // Bottom-Left [
    ctx.beginPath();
    ctx.moveTo(-bracketDist, bracketDist - bLen);
    ctx.lineTo(-bracketDist, bracketDist);
    ctx.lineTo(-bracketDist + bLen, bracketDist);
    ctx.stroke();
    // Bottom-Right ]
    ctx.beginPath();
    ctx.moveTo(bracketDist - bLen, bracketDist);
    ctx.lineTo(bracketDist, bracketDist);
    ctx.lineTo(bracketDist, bracketDist - bLen);
    ctx.stroke();

    // 5. 십자선 (Crosshairs) - 중심부는 뚫려있어 포켓몬이 가려지지 않음
    const innerR = radius * 0.40;
    const outerR = radius * 1.30;

    // 십자선 어두운 그림자
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-outerR, 0); ctx.lineTo(-innerR, 0);
    ctx.moveTo(innerR, 0);  ctx.lineTo(outerR, 0);
    ctx.moveTo(0, -outerR); ctx.lineTo(0, -innerR);
    ctx.moveTo(0, innerR);  ctx.lineTo(0, outerR);
    ctx.stroke();

    // 십자선 메인 순백 라인
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-outerR, 0); ctx.lineTo(-innerR, 0);
    ctx.moveTo(innerR, 0);  ctx.lineTo(outerR, 0);
    ctx.moveTo(0, -outerR); ctx.lineTo(0, -innerR);
    ctx.moveTo(0, innerR);  ctx.lineTo(0, outerR);
    ctx.stroke();

    // 6. 4방향 안쪽 지향 삼각 포인터 화살표 (Inward Triangles) - 순백
    const triDist = radius * 0.76;
    const triSize = 3;

    // 삼각 포인터 그림자 테두리
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 1.2;

    ctx.fillStyle = "#FFFFFF";

    // 상단 삼각
    ctx.beginPath();
    ctx.moveTo(0, -triDist + triSize);
    ctx.lineTo(-triSize, -triDist - triSize);
    ctx.lineTo(triSize, -triDist - triSize);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 하단 삼각
    ctx.beginPath();
    ctx.moveTo(0, triDist - triSize);
    ctx.lineTo(-triSize, triDist + triSize);
    ctx.lineTo(triSize, triDist + triSize);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 좌측 삼각
    ctx.beginPath();
    ctx.moveTo(-triDist + triSize, 0);
    ctx.lineTo(-triDist - triSize, -triSize);
    ctx.lineTo(-triDist - triSize, triSize);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 우측 삼각
    ctx.beginPath();
    ctx.moveTo(triDist - triSize, 0);
    ctx.lineTo(triDist + triSize, -triSize);
    ctx.lineTo(triDist + triSize, triSize);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 7. 정중앙 핀포인트 (Center Point) - 순백
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // 8. 락온 확정 시 순백/하늘색 펄스 웨이브 링
    if (isLocked && lockProgress > 0) {
      const pulseR = radius + lockProgress * 14;
      const pulseAlpha = Math.max(0, 1.0 - lockProgress);
      ctx.strokeStyle = `rgba(186, 230, 253, ${pulseAlpha * 0.85})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * 대상 포켓몬 록온 페이드 렌더링 (순백 코어 + 하늘색 에너지 틴트)
 */
function drawSoftLockFade(ctx: any, x: number, y: number, alpha: number) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(0.65, Math.max(0, alpha));

  const grad = ctx.createRadialGradient(x, y, 4, x, y, 46);
  grad.addColorStop(0.0, "rgba(255, 255, 255, 0.92)");
  grad.addColorStop(0.35, "rgba(186, 230, 253, 0.65)");
  grad.addColorStop(0.75, "rgba(56, 189, 248, 0.25)");
  grad.addColorStop(1.0, "rgba(56, 189, 248, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(x, y, 46, 46, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 🎯 199: 록온 Behind Effect
 */
export function drawLockOnBehindEffect(
  targetCtx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  // 필요 시 확장 가능
}

/**
 * 🎯 199: 록온 Front Effect
 * - Step 1: 대상 포켓몬의 좌 ➔ 우 ➔ 좌를 부드럽게 오가며 스캔 (하늘색 투명 잔상 방출)
 * - Step 2: 좌측에서 대상 포켓몬 중심(몸체)으로 슥 이동 (하늘색 투명 잔상 방출 ➔ 정중앙 스냅)
 * - Step 3: 대상 포켓몬 위치에서 조준경 페이드아웃 + 대상 포켓몬 순백/하늘색 록온 페이드 적용
 * - Step 4: 잔향 소산 및 복귀
 */
export function drawLockOnEffect(
  targetCtx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  const { ax, ay, tx, ty, step, p, isP, frame } = parseLockOnArgs(
    attackerPosOrFrame,
    targetPosOrDrawCtx,
    moveStep,
    progress,
    isPlayer
  );

  const ctx = targetCtx;
  ctx.save();

  // 대상 포켓몬 중심 좌표 (상대방 위치)
  // isP일 때 피격자는 적(enemy), !isP일 때 피격자는 플레이어(player)
  const targetOffX = isP ? (frame?.eOffset?.x ?? 0) : (frame?.pOffset?.x ?? 0);
  const targetOffY = isP ? (frame?.eOffset?.y ?? 0) : (frame?.pOffset?.y ?? 0);
  const targetCenterX = tx + targetOffX;
  const targetCenterY = ty + targetOffY - 10;
  const scanDistance = 34; // 대상 포켓몬 좌우 폭 기준 이동 반경 (좌: -34px, 우: +34px)

  // --------------------------------------------------------------------------
  // Step 1: 대상 포켓몬의 [좌 ➔ 우 ➔ 좌] 부드럽게 왕복 스캔
  // --------------------------------------------------------------------------
  if (step === 1) {
    const calcPos = (t: number) => {
      const waveAngle = t * Math.PI * 2 - Math.PI / 2;
      const swayX = Math.sin(waveAngle) * scanDistance;
      const swayY = Math.cos(waveAngle) * 4;
      return {
        x: targetCenterX + swayX,
        y: targetCenterY - 4 + swayY,
      };
    };

    const mainPos = calcPos(p);
    const alpha = Math.min(1.0, p * 2.8);

    // 하늘색 투명 잔상 (Afterimages)
    // 이전 4개 궤적 위치에 점차 투명해지는 하늘색 잔상 렌더링
    const ghostLags = [0.04, 0.08, 0.12, 0.16];
    const ghostAlphas = [0.52, 0.36, 0.22, 0.12];

    // 잔상 궤적 연결선 (Motion Ribbon)
    if (p > 0.05) {
      ctx.save();
      ctx.beginPath();
      const oldestLag = Math.min(p, 0.18);
      const oldestPos = calcPos(p - oldestLag);
      ctx.moveTo(oldestPos.x, oldestPos.y);
      for (let lag = oldestLag; lag >= 0; lag -= 0.02) {
        const pt = calcPos(p - lag);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.lineTo(mainPos.x, mainPos.y);
      ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.30})`;
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.restore();
    }

    for (let i = ghostLags.length - 1; i >= 0; i--) {
      const lag = ghostLags[i];
      if (p - lag >= 0) {
        const gPos = calcPos(p - lag);
        const gAlpha = alpha * ghostAlphas[i];
        const gRadius = 20 - i * 0.5;
        drawCrosshairScope(ctx, gPos.x, gPos.y, gRadius, gAlpha, false, isP, 0, true);
      }
    }

    // 메인 조준경: 전체 흰색
    drawCrosshairScope(ctx, mainPos.x, mainPos.y, 20, alpha, false, isP, 0, false);
  }

  // --------------------------------------------------------------------------
  // Step 2: 좌측(-34px)에서 대상 포켓몬 중심(0px)으로 슥 이동
  // --------------------------------------------------------------------------
  else if (step === 2) {
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
    const startX = targetCenterX - scanDistance;
    const startY = targetCenterY - 4;

    const calcGlidePos = (t: number) => {
      const k = easeOutCubic(t);
      return {
        x: startX + (targetCenterX - startX) * k,
        y: startY + (targetCenterY - startY) * k,
      };
    };

    const mainPos = calcGlidePos(p);
    const isSnapping = p >= 0.85;

    // 하늘색 투명 잔상 (Afterimages)
    // 중심 도달 전까지 움직임 궤적에 맞춰 하늘색 잔상 남김
    const ghostLags = [0.05, 0.10, 0.15, 0.20];
    const ghostAlphas = [0.55, 0.38, 0.24, 0.12];

    // 잔상 궤적 연결선 (Motion Ribbon)
    ctx.save();
    ctx.beginPath();
    const oldestLag = Math.min(p, 0.22);
    const oldestPos = calcGlidePos(p - oldestLag);
    ctx.moveTo(oldestPos.x, oldestPos.y);
    for (let lag = oldestLag; lag >= 0; lag -= 0.02) {
      const pt = calcGlidePos(p - lag);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.lineTo(mainPos.x, mainPos.y);
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.35 * (1 - p * 0.3)})`;
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.restore();

    for (let i = ghostLags.length - 1; i >= 0; i--) {
      const lag = ghostLags[i];
      if (p - lag >= 0) {
        const gPos = calcGlidePos(p - lag);
        const gAlpha = ghostAlphas[i] * (1 - p * 0.4); // 중심에 안착할수록 잔상 소산
        const gRadius = 20 - i * 0.5;
        drawCrosshairScope(ctx, gPos.x, gPos.y, gRadius, gAlpha, false, isP, 0, true);
      }
    }

    // 메인 조준경: 전체 흰색
    drawCrosshairScope(
      ctx,
      mainPos.x,
      mainPos.y,
      20,
      1.0,
      isSnapping,
      isP,
      Math.max(0, (p - 0.85) / 0.15),
      false
    );
  }

  // --------------------------------------------------------------------------
  // Step 3: 중심에서 조준경 페이드 아웃 & 대상 포켓몬 살짝 록온 페이드 적용
  // --------------------------------------------------------------------------
  else if (step === 3) {
    // 락온 직후 살짝 남아있던 잔상 잔향 소산 (p: 0.0 ~ 0.35)
    if (p < 0.35) {
      const ghostAlpha = (1.0 - p / 0.35) * 0.25;
      drawCrosshairScope(ctx, targetCenterX, targetCenterY, 22 + p * 8, ghostAlpha, true, isP, p, true);
    }

    // 조준경 페이드 아웃 (1.0 -> 0.0) (전체 흰색)
    const scopeAlpha = Math.max(0, 1.0 - p * 1.4);
    if (scopeAlpha > 0.01) {
      drawCrosshairScope(ctx, targetCenterX, targetCenterY, 20, scopeAlpha, true, isP, p, false);
    }

    // 대상 포켓몬 살짝 페이드 (0.0 -> 피크 0.55 -> 서서히 감쇠)
    const fadeAlpha = Math.sin(p * Math.PI) * 0.55;
    drawSoftLockFade(ctx, targetCenterX, targetCenterY, fadeAlpha);
  }

  // --------------------------------------------------------------------------
  // Step 4: 대상 포켓몬 록온 페이드 잔향 마무리 및 안정 복귀
  // --------------------------------------------------------------------------
  else if (step === 4) {
    const fadeAlpha = Math.max(0, (1.0 - p) * 0.25);
    drawSoftLockFade(ctx, targetCenterX, targetCenterY, fadeAlpha);
  }

  ctx.restore();
}

// ============================================================================
// 🐲 200: 역린 (Outrage) - 드래곤 타입 물리 접촉기 (위력 120, 명중 100)
//
// "2-3턴 동안 마구 난동 부려서 공격한다. 난동 부린 뒤에는 혼란에 빠진다."
//
// [연출 기승전결 시퀀스]:
// 1. [역린의 각성 & 포효 (Awakening & Roar)]:
//    - 시전자 웅크림 및 몸체 진동 ➔ 바닥에서 솟구치는 심홍색/청자색 드래곤 불꽃 오라 ➔
//    - 붉은 안광(Eye Glint) 번뜩임 & 사방으로 포효 충격파 링 방출
// 2. [1타: 벼락같은 1차 사선 드래곤 클로 참격 (1st Diagonal Dragon Slash)]:
//    - 초고속 전방 쇄도 ➔ 대상 전면 우상단->좌하단 3중 드래곤 클로 참격호 촥! ➔
//    - 백색 섬광(hitFlash) & 스타버스트 폭발 & 피격자 뒤로 넉백
// 3. [2타: 광란의 2차 역방향 교차 참격 ('X' 폭쇄) (2nd Cross Dragon Slash)]:
//    - 좌상단->우하단 역방향 3중 클로 교차 ➔ 거대한 불타는 'X'자 드래곤 상흔 폭쇄 ➔
//    - 중심부 충격파 폭발 & 피격자 반대편 넉백
// 4. [3타: 피니시 대폭쇄 - 용의 파동 분쇄 & 지면 대격변 (Devastating Dragon Crush)]:
//    - 시전자 상공 고공 도약 ➔ 상대 머리 위로 수직 급강하 강타 분쇄 ➔
//    - 거대한 지면 크레이터 충격파 링 & 16방향 드래곤 방사 스파크 대폭발 ➔
//    - 피격자 납작 스쿼시 & 체력 게이지 감소 본격 반영
// 5. [피날레 복귀 & 잔여 화염 소산 (Cool Down & Recovery)]:
//    - 시전자 탄성 착지 후 기본 위치 복귀 ➔ 잔여 드래곤 화염 불티 부유 소산
// ============================================================================

/**
 * 역린 인자 유연 파싱 헬퍼
 */
function parseOutrageArgs(
  attackerPosOrFrame: any,
  targetPosOrDrawCtx: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  let step = 1;
  let p = 0.5;
  let ax = 130;
  let ay = 220;
  let tx = 390;
  let ty = 120;
  let isP = true;
  let frameObj: BattleFrame | null = null;
  let isHit = true;

  if (attackerPosOrFrame && typeof attackerPosOrFrame.x === "number") {
    ax = attackerPosOrFrame.x;
    ay = attackerPosOrFrame.y;
    tx = targetPosOrDrawCtx?.x ?? 390;
    ty = targetPosOrDrawCtx?.y ?? 120;
    step = moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, progress ?? 0.5));
    isP = Boolean(isPlayer);
    isHit = true;
  } else {
    frameObj = attackerPosOrFrame || {};
    const drawCtx = targetPosOrDrawCtx || {};
    const aPos = drawCtx.attackerPos || { x: 130, y: 220 };
    const tPos = drawCtx.targetPos || { x: 390, y: 120 };
    ax = aPos.x;
    ay = aPos.y;
    tx = tPos.x;
    ty = tPos.y;
    step = frameObj?.moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, frameObj?.effectProgress ?? 0.5));
    isP = drawCtx.isPlayer !== undefined ? Boolean(drawCtx.isPlayer) : true;
    isHit = drawCtx.isHit !== undefined ? Boolean(drawCtx.isHit) : true;
  }

  return { ax, ay, tx, ty, step, p, isP, isHit, frame: frameObj };
}

/**
 * 솟구치는 드래곤 화염 플룸 (Dragon Flame Plume)
 */
function drawDragonFlamePlume(
  ctx: any,
  cx: number,
  baseY: number,
  width: number,
  height: number,
  alpha: number,
  isCrimson: boolean,
  sway: number = 0
) {
  if (alpha <= 0.01 || height <= 2) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const tipX = cx + sway;
  const tipY = baseY - height;
  const halfW = width * 0.5;

  // 1. 외곽 화염 오라 (심홍색 vs 청자색)
  const gradOuter = ctx.createLinearGradient(cx, baseY, tipX, tipY);
  if (isCrimson) {
    gradOuter.addColorStop(0.0, "rgba(185, 28, 28, 0.85)");
    gradOuter.addColorStop(0.45, "rgba(239, 68, 68, 0.70)");
    gradOuter.addColorStop(1.0, "rgba(254, 202, 202, 0.0)");
  } else {
    gradOuter.addColorStop(0.0, "rgba(67, 56, 202, 0.85)");
    gradOuter.addColorStop(0.45, "rgba(99, 102, 241, 0.70)");
    gradOuter.addColorStop(1.0, "rgba(199, 210, 254, 0.0)");
  }

  ctx.fillStyle = gradOuter;
  ctx.beginPath();
  ctx.moveTo(cx - halfW, baseY);
  ctx.quadraticCurveTo(cx - halfW * 1.1, baseY - height * 0.5, tipX, tipY);
  ctx.quadraticCurveTo(cx + halfW * 1.1, baseY - height * 0.5, cx + halfW, baseY);
  ctx.closePath();
  ctx.fill();

  // 2. 내부 백열 화염 코어
  const innerHalfW = halfW * 0.45;
  const innerH = height * 0.65;
  const innerTipY = baseY - innerH;

  const gradInner = ctx.createLinearGradient(cx, baseY, cx, innerTipY);
  if (isCrimson) {
    gradInner.addColorStop(0.0, "rgba(255, 255, 255, 0.95)");
    gradInner.addColorStop(0.5, "rgba(254, 240, 138, 0.85)");
    gradInner.addColorStop(1.0, "rgba(239, 68, 68, 0.0)");
  } else {
    gradInner.addColorStop(0.0, "rgba(255, 255, 255, 0.95)");
    gradInner.addColorStop(0.5, "rgba(199, 210, 254, 0.85)");
    gradInner.addColorStop(1.0, "rgba(99, 102, 241, 0.0)");
  }

  ctx.fillStyle = gradInner;
  ctx.beginPath();
  ctx.moveTo(cx - innerHalfW, baseY);
  ctx.quadraticCurveTo(cx - innerHalfW * 0.8, baseY - innerH * 0.5, tipX * 0.5 + cx * 0.5, innerTipY);
  ctx.quadraticCurveTo(cx + innerHalfW * 0.8, baseY - innerH * 0.5, cx + innerHalfW, baseY);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 부유하는 드래곤 화염 불티 (Dragon Embers)
 */
const OUTRAGE_EMBERS = [
  { dx: -24, dy: 6, speed: 45, r: 2.5, isCrimson: true, phase: 0.1 },
  { dx: 18, dy: 10, speed: 55, r: 2.8, isCrimson: false, phase: 0.35 },
  { dx: -12, dy: 18, speed: 60, r: 2.2, isCrimson: true, phase: 0.6 },
  { dx: 26, dy: 4, speed: 50, r: 3.0, isCrimson: false, phase: 0.8 },
  { dx: -32, dy: 14, speed: 40, r: 2.0, isCrimson: true, phase: 0.2 },
  { dx: 8, dy: 22, speed: 65, r: 2.6, isCrimson: false, phase: 0.5 },
  { dx: -6, dy: 12, speed: 52, r: 2.2, isCrimson: true, phase: 0.75 },
  { dx: 30, dy: 18, speed: 48, r: 2.4, isCrimson: false, phase: 0.9 },
];

function drawDragonEmbers(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  alpha: number
) {
  if (alpha <= 0.01) return;
  ctx.save();
  for (const e of OUTRAGE_EMBERS) {
    const t = (progress + e.phase) % 1.0;
    const px = cx + e.dx + Math.sin(t * Math.PI * 2) * 8;
    const py = cy + e.dy - t * e.speed;
    const pAlpha = alpha * Math.sin(t * Math.PI);
    if (pAlpha <= 0.01) continue;

    ctx.globalAlpha = pAlpha;
    ctx.fillStyle = e.isCrimson ? "#EF4444" : "#818CF8";
    ctx.beginPath();
    ctx.arc(px, py, e.r * (1 - t * 0.35), 0, Math.PI * 2);
    ctx.fill();

    // 중심 순백 코어
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(px, py, e.r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * 단일 드래곤 클로 참격호 (Curved Dragon Crescent Blade)
 * - 0px 바늘 끝으로 수렴하는 닫힌 베지어 다각형
 * - 3중 구조: 외곽 오라 ➔ 드래곤 그라데이션 몸체 ➔ 순백 바늘 코어
 */
function drawSingleDragonClawBlade(
  ctx: any,
  cx: number,
  cy: number,
  angle: number,
  length: number,
  thickness: number,
  curveAmount: number,
  alpha: number = 1.0,
  isCrimsonTheme: boolean = true
) {
  if (alpha <= 0.01 || length <= 2) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const halfL = length * 0.5;
  const halfThick = thickness * 0.5;
  const curve = curveAmount;

  // 1. 외곽 오라 (Glow)
  const auraThick = halfThick * 2.2;
  ctx.fillStyle = isCrimsonTheme ? "rgba(220, 38, 38, 0.34)" : "rgba(79, 70, 229, 0.34)";
  ctx.beginPath();
  ctx.moveTo(-halfL * 1.08, 0);
  ctx.bezierCurveTo(-halfL * 0.35, auraThick + curve, halfL * 0.35, auraThick + curve, halfL * 1.08, 0);
  ctx.bezierCurveTo(halfL * 0.35, -auraThick * 0.5 + curve, -halfL * 0.35, -auraThick * 0.5 + curve, -halfL * 1.08, 0);
  ctx.closePath();
  ctx.fill();

  // 2. 메인 블레이드 몸체
  const bladeGrad = ctx.createLinearGradient(-halfL, 0, halfL, 0);
  if (isCrimsonTheme) {
    bladeGrad.addColorStop(0.0, "#991B1B");
    bladeGrad.addColorStop(0.25, "#DC2626");
    bladeGrad.addColorStop(0.55, "#EF4444");
    bladeGrad.addColorStop(0.85, "#4F46E5");
    bladeGrad.addColorStop(1.0, "#818CF8");
  } else {
    bladeGrad.addColorStop(0.0, "#312E81");
    bladeGrad.addColorStop(0.30, "#4F46E5");
    bladeGrad.addColorStop(0.65, "#6366F1");
    bladeGrad.addColorStop(0.85, "#EF4444");
    bladeGrad.addColorStop(1.0, "#F87171");
  }

  ctx.fillStyle = bladeGrad;
  ctx.beginPath();
  ctx.moveTo(-halfL, 0);
  ctx.bezierCurveTo(-halfL * 0.35, halfThick + curve, halfL * 0.35, halfThick + curve, halfL, 0);
  ctx.bezierCurveTo(halfL * 0.35, -halfThick * 0.4 + curve, -halfL * 0.35, -halfThick * 0.4 + curve, -halfL, 0);
  ctx.closePath();
  ctx.fill();

  // 3. 순백 바늘 코어
  const coreL = halfL * 0.92;
  const coreThick = halfThick * 0.38;
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(-coreL, 0);
  ctx.bezierCurveTo(-coreL * 0.35, coreThick + curve * 0.85, coreL * 0.35, coreThick + curve * 0.85, coreL, 0);
  ctx.bezierCurveTo(coreL * 0.35, -coreThick * 0.3 + curve * 0.85, -coreL * 0.35, -coreThick * 0.3 + curve * 0.85, -coreL, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 🐲 참격 궤적을 휘감아 타오르는 드래곤 화염 리본 (할퀴기는 불과 함께)
 */
function drawClawFlameRibbon(
  ctx: any,
  cx: number,
  cy: number,
  angle: number,
  length: number,
  alpha: number
) {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  const halfL = length * 0.5;
  const PUFF_COUNT = 6;

  // 참격선을 따라 피어오르는 작열하는 화염 덩어리들 (용의분노 형태 + 산호/황금 옐로우 컬러)
  for (let i = 0; i < PUFF_COUNT; i++) {
    const t = i / (PUFF_COUNT - 1); // 0.0 ~ 1.0 (궤적 시작 -> 끝)
    const px = -halfL * 0.80 + t * (halfL * 1.6);
    // 참격의 완만한 곡선을 따르는 호 오프셋
    const arcY = Math.sin(t * Math.PI) * 12;
    const r = (16 + Math.sin(t * Math.PI) * 10);
    const puffAlpha = alpha * Math.max(0.25, Math.sin(t * Math.PI) * 0.95);
    const roll = t * 2.8;

    drawOutrageFlamePuff(ctx, px, arcY, r, roll, puffAlpha, i * 7 + 10);
  }

  // 참격선 주변으로 비산하는 화염 불티
  for (let s = 0; s < 4; s++) {
    const st = s / 3;
    const sx = -halfL * 0.65 + st * (halfL * 1.3);
    const sy = Math.sin(st * Math.PI) * 14 + (s % 2 === 0 ? 1 : -1) * (8 + s * 2);
    ctx.fillStyle = s % 2 === 0 ? "rgba(254, 240, 138, 0.95)" : "rgba(251, 113, 133, 0.90)";
    ctx.fillRect(sx - 1.2, sy - 1.2, 2.5, 2.5);
  }

  ctx.restore();
}

/**
 * 3중 드래곤 클로 참격 레이크 (Triple Dragon Claw Rake)
 * - "할퀴기는 불과 함께"
 */
function drawTripleDragonClaw(
  ctx: any,
  cx: number,
  cy: number,
  angle: number,
  length: number,
  spacing: number,
  alpha: number,
  isCrimsonTheme: boolean = true
) {
  if (alpha <= 0.01) return;
  const perpAngle = angle + Math.PI / 2;
  const px = Math.cos(perpAngle);
  const py = Math.sin(perpAngle);

  // 🔥 1. 참격을 감싸며 활활 타오르는 화염 리본 (할퀴기는 불과 함께)
  drawClawFlameRibbon(ctx, cx, cy, angle, length, alpha * 0.90);
  drawClawFlameRibbon(ctx, cx - px * (spacing * 0.6), cy - py * (spacing * 0.6), angle, length * 0.85, alpha * 0.65);
  drawClawFlameRibbon(ctx, cx + px * (spacing * 0.6), cy + py * (spacing * 0.6), angle, length * 0.85, alpha * 0.65);

  // 2. 메인 중앙 클로
  drawSingleDragonClawBlade(ctx, cx, cy, angle, length, 12.0, 10, alpha, isCrimsonTheme);

  // 3. 상단 클로
  drawSingleDragonClawBlade(
    ctx,
    cx - px * spacing,
    cy - py * spacing,
    angle,
    length * 0.88,
    9.5,
    8,
    alpha * 0.90,
    isCrimsonTheme
  );

  // 4. 하단 클로
  drawSingleDragonClawBlade(
    ctx,
    cx + px * spacing,
    cy + py * spacing,
    angle,
    length * 0.88,
    9.5,
    8,
    alpha * 0.90,
    isCrimsonTheme
  );
}

/**
 * 지면 충격파 타원 링 & 드래곤 크레이터
 */
function drawDragonGroundShockwave(
  ctx: any,
  cx: number,
  groundY: number,
  rx: number,
  ry: number,
  alpha: number
) {
  if (alpha <= 0.01 || rx <= 1) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 외곽 심홍색 충격파 링
  ctx.strokeStyle = "rgba(220, 38, 38, 0.75)";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.ellipse(cx, groundY, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 내부 순백/시안 광채 링
  ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(cx, groundY, rx * 0.82, ry * 0.82, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 지면 작열 글로우
  const glow = ctx.createRadialGradient(cx, groundY, 2, cx, groundY, rx);
  glow.addColorStop(0.0, "rgba(255, 255, 255, 0.85)");
  glow.addColorStop(0.35, "rgba(239, 68, 68, 0.45)");
  glow.addColorStop(0.75, "rgba(79, 70, 229, 0.25)");
  glow.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(cx, groundY, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 붉은 안광 십자 섬광 (Dragon Eye Glint)
 */
function drawDragonEyeGlint(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  alpha: number
) {
  if (alpha <= 0.01 || size <= 1) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 외곽 코로나
  const corona = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 2.2);
  corona.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  corona.addColorStop(0.35, "rgba(239, 68, 68, 0.85)");
  corona.addColorStop(0.75, "rgba(185, 28, 28, 0.35)");
  corona.addColorStop(1.0, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = corona;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 2.2, 0, Math.PI * 2);
  ctx.fill();

  // 샤프 십자 침
  ctx.fillStyle = "#FFFFFF";
  const armL = size * 2.6;
  const armW = size * 0.35;
  ctx.beginPath();
  ctx.moveTo(cx, cy - armL);
  ctx.lineTo(cx + armW, cy);
  ctx.lineTo(cx, cy + armL);
  ctx.lineTo(cx - armW, cy);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - armL, cy);
  ctx.lineTo(cx - armW, cy);
  ctx.lineTo(cx + armL, cy);
  ctx.lineTo(cx + armW, cy);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 포효 충격파 링 (Dragon Roar Shockwave)
 */
function drawDragonRoarShockwave(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number
) {
  if (alpha <= 0.01 || radius <= 2) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  ctx.strokeStyle = `rgba(239, 68, 68, ${alpha * 0.85})`;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius * 1.25, radius * 0.9, 0, 0, Math.PI * 2);
  ctx.stroke();

  if (radius > 10) {
    ctx.strokeStyle = `rgba(129, 140, 248, ${alpha * 0.65})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(cx, cy, radius * 0.95, radius * 0.7, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 비산 드래곤 스파크 (Flying Dragon Sparks)
 */
const OUTRAGE_SPARKS = [
  { angle: -Math.PI * 0.65, speed: 75, r: 3.2, col: "#EF4444" },
  { angle: -Math.PI * 0.45, speed: 90, r: 3.8, col: "#FFFFFF" },
  { angle: -Math.PI * 0.25, speed: 68, r: 2.8, col: "#818CF8" },
  { angle: -Math.PI * 0.85, speed: 82, r: 3.5, col: "#EF4444" },
  { angle: Math.PI * 0.35, speed: 76, r: 3.2, col: "#F59E0B" },
  { angle: Math.PI * 0.55, speed: 95, r: 4.0, col: "#FFFFFF" },
  { angle: Math.PI * 0.75, speed: 70, r: 3.0, col: "#818CF8" },
  { angle: Math.PI * 0.15, speed: 84, r: 3.4, col: "#EF4444" },
  { angle: -Math.PI * 0.05, speed: 60, r: 2.6, col: "#FDE047" },
  { angle: -Math.PI * 0.95, speed: 65, r: 2.8, col: "#FFFFFF" },
  { angle: Math.PI * 0.95, speed: 58, r: 2.5, col: "#818CF8" },
  { angle: 0.05, speed: 54, r: 2.4, col: "#EF4444" },
];

function drawDragonSparks(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  alpha: number
) {
  if (alpha <= 0.01 || progress <= 0) return;
  const t = Math.min(1.0, Math.max(0, progress));

  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  for (const s of OUTRAGE_SPARKS) {
    const dist = t * s.speed;
    const px = cx + Math.cos(s.angle) * dist;
    const py = cy + Math.sin(s.angle) * dist;

    const shrink = Math.max(0.1, 1.0 - t * 0.80);
    const curR = s.r * shrink;

    ctx.fillStyle = s.col;
    ctx.beginPath();
    ctx.arc(px, py, curR, 0, Math.PI * 2);
    ctx.fill();

    // 꼬리 잔상
    ctx.strokeStyle = s.col;
    ctx.lineWidth = Math.max(0.8, curR * 0.6);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - Math.cos(s.angle) * (curR * 2.2), py - Math.sin(s.angle) * (curR * 2.2));
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 역린 시전 시 배경 주황빛 그을림 연출 (Scorched Orange Background Glow)
 * - 배경이 주황빛으로 변하면서 (시전자 포켓몬 위치 중심부는 더 밝은 순백/살구빛)
 * - 마치 불이 그을려지듯이 주황빛이 불규칙하게 서서히 빛났다가 서서히 줄어듦 (2회 맥동)
 * - "반투명, 단, 그을리는효과 할때 추가로 투명해지지는않게"
 *   => 확고한 기본 반투명 농도(0.65)를 유지하여 필드가 비치되, 그을릴 때 추가로 투명해지지 않고
 *      주황빛과 중심 순백광의 휘도/강도(Intensity)만으로 맥동!
 * - "이 밝은 부분은 시전자 포켓몬 위치에 배치해줘"
 *   => 가장 밝은 순백/살구 발광의 중심점(cx, cy)을 시전자 포켓몬(casterX, casterY) 위치로 배치!
 */
function drawOutrageScorchedBackground(
  ctx: any,
  progress: number,
  casterX?: number,
  casterY?: number,
  isPlayer: boolean = true
) {
  const p = Math.max(0, Math.min(1.0, progress));

  // 시작과 종료 시 부드러운 전환 (스텝 진입 시 배경 전환, 스텝 종료 직전 자연스러운 복귀)
  const rampIn = Math.min(1.0, p / 0.06);
  const rampOut = Math.min(1.0, (1.0 - p) / 0.05);
  const envelope = rampIn * rampOut;
  if (envelope <= 0.001) return;

  // 1. 2회 펄스 맥동 곡선: 0.0 (최저 강도 - 짙은 그을림 엠버) ~ 1.0 (최고 강도 - 작열하는 백색/주황 섬광)
  const pulsePhase = p * Math.PI * 2.0;
  const sinWave = (Math.sin(pulsePhase * 2.0 - Math.PI * 0.5) + 1.0) * 0.5;

  // 2. 유기적 미세 플리커 (불이 그을리듯 불규칙한 빛의 요동)
  const flicker =
    Math.sin(p * Math.PI * 7.5 + 0.3) * 0.07 +
    Math.sin(p * Math.PI * 15.0 + 1.2) * 0.04;

  // 3. 투명도 대신 순수 "주황빛과 백색광의 강도(Intensity)"로 제어
  // 최저 강도 0.22 (짙고 깊은 그을린 훈열 엠버) ~ 최고 강도 1.0 (눈부신 비비드 주황 및 중심 순백광)
  const minIntensity = 0.22;
  const intensity = Math.min(
    1.0,
    Math.max(0.15, minIntensity + (1.0 - minIntensity) * sinWave + flicker)
  );
  const normIntensity = Math.max(0, Math.min(1.0, (intensity - minIntensity) / (1.0 - minIntensity)));

  ctx.save();

  // 4. "반투명, 단, 그을리는효과 할때 추가로 투명해지지는않게"
  // - 기본 베이스: 0.65의 확고한 반투명 상태 유지 (필드가 은은하게 비침)
  // - 그을림 맥동 시: 아래로 추가 투명해지지 않고(0.65 최저 지지선), 강도에 따라 최대 0.77까지 열기만 강화
  const baseTranslucency = 0.65;
  const currentAlpha = (baseTranslucency + 0.12 * normIntensity) * envelope;
  ctx.globalAlpha = currentAlpha;

  // 색상 보간 헬퍼 (완전 불투명 RGB)
  const lerpColor = (
    r1: number,
    g1: number,
    b1: number,
    r2: number,
    g2: number,
    b2: number,
    t: number
  ) => {
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r}, ${g}, ${b})`;
  };

  // 5. 시전자 포켓몬 위치 중심 방사형 열기 그라데이션
  // "이 밝은 부분은 시전자 포켓몬 위치에 배치해줘"
  const cx = casterX ?? 280;
  const cy = casterY != null ? casterY - (isPlayer ? 16 : 14) : 165;
  const innerRadius = 25 + 55 * intensity;
  const outerRadius = 400 + 120 * intensity;
  const bloomGrad = ctx.createRadialGradient(cx, cy, innerRadius * 0.15, cx, cy, outerRadius);

  // 중심 (시전자 포켓몬 위치): 강할 때 눈부신 순백광 #FFFFFF, 약할 때도 따뜻하고 밝은 살구빛 코어
  bloomGrad.addColorStop(0.00, lerpColor(245, 175, 110, 255, 255, 255, intensity));
  bloomGrad.addColorStop(0.18, lerpColor(235, 135, 60, 255, 248, 225, intensity));
  // 중간: 풍부한 주황빛
  bloomGrad.addColorStop(0.42, lerpColor(195, 80, 20, 251, 146, 60, intensity));
  // 외곽: 선명한 불꽃 주황
  bloomGrad.addColorStop(0.72, lerpColor(140, 48, 12, 234, 88, 12, intensity));
  // 가장자리: 짙고 깊은 그을린 엠버
  bloomGrad.addColorStop(1.00, lerpColor(105, 30, 8, 194, 65, 12, intensity));

  ctx.fillStyle = bloomGrad;
  ctx.fillRect(-4000, -4000, 10000, 10000);

  ctx.restore();
}

/**
 * 울퉁불퉁하게 타오르는 화염 덩어리(Billowing Flame Puff) 제어점 생성 (용의분노 알고리즘 계승)
 * - 완전한 원형을 탈피하여 만화풍 5~6개 화염 돌기(Lobes)가 뭉쳐진 유기적 불꽃 덩어리
 */
function getOutrageBillowingPoints(
  baseR: number,
  seed: number,
  roll: number,
  isCore: boolean = false,
  aspectX: number = 1.0,
  aspectY: number = 1.0
): { x: number; y: number }[] {
  const scale = isCore ? 0.58 : 1.0;
  const R = baseR * scale;
  const SAMPLES = 16;
  const pts: { x: number; y: number }[] = [];

  for (let i = 0; i < SAMPLES; i++) {
    const angle = (i / SAMPLES) * Math.PI * 2;
    // 5~6개의 울퉁불퉁한 화염 돌기(Lobes)
    const bump =
      1.0 +
      Math.sin(angle * 5 + roll + seed) * 0.16 +
      Math.cos(angle * 3 - roll * 0.8) * 0.10 +
      Math.sin(angle * 2 + seed * 1.5) * 0.06;

    const r = R * bump;
    pts.push({
      x: Math.cos(angle) * r * aspectX,
      y: Math.sin(angle) * r * aspectY,
    });
  }

  return pts;
}

function traceOutrageContour(ctx: any, pts: { x: number; y: number }[]) {
  const n = pts.length;
  if (n < 3) return;
  ctx.beginPath();
  const startMidX = (pts[0].x + pts[n - 1].x) * 0.5;
  const startMidY = (pts[0].y + pts[n - 1].y) * 0.5;
  ctx.moveTo(startMidX, startMidY);

  for (let i = 0; i < n; i++) {
    const curr = pts[i];
    const next = pts[(i + 1) % n];
    const midX = (curr.x + next.x) * 0.5;
    const midY = (curr.y + next.y) * 0.5;
    ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
  }
  ctx.closePath();
}

/**
 * 역린 시전 포켓몬 전용 화염 덩어리 렌더러
 * - 형태/유형: 용의분노 빌로잉 화염 퍼프 (울퉁불퉁한 만화풍 불꽃 구름)
 * - 색상: 유저 레퍼런스 이미지 기반 완벽 매칭
 *   * 외곽: 산호빛 로즈/살구 핑크 (#F43F5E, #FB7185, #FDA4AF)
 *   * 중간: 타오르는 주황 (#FB923C, #F97316)
 *   * 내부: 레몬-황금 옐로우 (#FEF08A, #FDE047, #FACC15) + 순백 코어
 */
function drawOutrageFlamePuff(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  rollAngle: number,
  alpha: number = 1.0,
  seed: number = 0,
  isCenterDarkRed: boolean = false
) {
  if (alpha <= 0.01 || radius <= 2) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.translate(cx, cy);
  ctx.rotate(rollAngle);

  // 1. 외곽 화염 연무 (Outer Billow)
  const outerPts = getOutrageBillowingPoints(radius, seed, rollAngle * 0.4, false);
  traceOutrageContour(ctx, outerPts);

  const outerGrad = ctx.createRadialGradient(0, 0, radius * 0.15, 0, 0, radius * 1.18);
  if (isCenterDarkRed) {
    // 중앙 코어 화염 외곽: 짙고 묵직한 심홍/산호빛
    outerGrad.addColorStop(0.00, "rgba(185, 28, 28, 0.95)");  // 중심 짙은 레드
    outerGrad.addColorStop(0.35, "rgba(220, 38, 38, 0.90)");  // 심홍색
    outerGrad.addColorStop(0.70, "rgba(244, 63, 94, 0.70)");  // 로즈 레드
    outerGrad.addColorStop(0.92, "rgba(251, 113, 133, 0.28)"); // 분홍 연무
    outerGrad.addColorStop(1.00, "rgba(251, 113, 133, 0.00)"); // 완전 투명 페이드
  } else {
    // 일반 방사 화염: 산호/로즈/살구빛 화염 연무
    outerGrad.addColorStop(0.00, "rgba(251, 146, 60, 0.95)");  // 중심 오렌지
    outerGrad.addColorStop(0.35, "rgba(244, 63, 94, 0.92)");   // 산호빛 로즈 레드 (이미지 외곽 컬러)
    outerGrad.addColorStop(0.70, "rgba(251, 113, 133, 0.70)"); // 살구/피치 핑크
    outerGrad.addColorStop(0.92, "rgba(253, 164, 175, 0.28)"); // 부드러운 분홍빛 연무
    outerGrad.addColorStop(1.00, "rgba(253, 164, 175, 0.00)"); // 완전 투명 페이드
  }
  ctx.fillStyle = outerGrad;
  ctx.fill();

  // 2. 내부 코어: 중앙 불꽃은 "안쪽 노란불꽃 어두운 붉은색으로"
  const corePts = getOutrageBillowingPoints(radius, seed + 1, rollAngle * 0.5, true);
  traceOutrageContour(ctx, corePts);

  const coreR = radius * 0.58;
  const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR * 1.2);
  if (isCenterDarkRed) {
    // 🔴 중앙 불꽃: 안쪽 노란불꽃 대신 어두운 붉은색 코어 (Dark Red Core)
    coreGrad.addColorStop(0.00, "#580A0A");                     // 최심부 가장 어두운 흑적색 (Dark Crimson/Black-Red)
    coreGrad.addColorStop(0.35, "rgba(127, 29, 29, 0.98)");    // 어두운 붉은색 (Red 900)
    coreGrad.addColorStop(0.70, "rgba(153, 27, 27, 0.90)");    // 짙은 레드 (Red 800)
    coreGrad.addColorStop(0.88, "rgba(185, 28, 28, 0.45)");    // 붉은 번짐
    coreGrad.addColorStop(1.00, "rgba(185, 28, 28, 0.00)");    // 투명 페이드
  } else {
    // 🟡 일반 방사 화염: 작열하는 황금빛 옐로우 코어 (Inner Golden-Yellow Core)
    coreGrad.addColorStop(0.00, "#FFFFFF");                      // 중심 초고열 순백
    coreGrad.addColorStop(0.30, "rgba(254, 240, 138, 0.98)");  // 레몬 옐로우 (이미지 노란 중심)
    coreGrad.addColorStop(0.65, "rgba(250, 204, 21, 0.88)");   // 황금빛 옐로우
    coreGrad.addColorStop(0.88, "rgba(249, 115, 22, 0.40)");   // 주황빛 번짐
    coreGrad.addColorStop(1.00, "rgba(249, 115, 22, 0.00)");   // 투명 페이드
  }
  ctx.fillStyle = coreGrad;
  ctx.fill();

  ctx.restore();
}

interface OutrageFlameDef {
  a: number;      // 방사 각도 (불규칙 분포)
  speed: number;  // 비산 거리/속도 (45 ~ 250px 극적인 속도 편차)
  r: number;      // 기본 반경
  grow: number;   // 팽창 크기
  seed: number;   // 형상 시드
  accel: number;  // 가속 지수 (< 0.65: 초반 폭발적 돌출 및 초고속 장거리 비산)
  isFront?: boolean; // Z-축 앞(foreground) 여부
}

// 1차 파동: 4개 정예 불꽃 (수량 축소, Z-축 앞 2개 / 뒤 2개, 4방위 불규칙 속도차)
const OUTRAGE_WAVE1_DEFS: OutrageFlameDef[] = [
  // 🚀 초고속 원거리 돌출 제트
  { a: -0.65, speed: 220, r: 26, grow: 7, seed: 101, accel: 0.52, isFront: false }, // [뒤] 우상단 원거리 제트
  { a: 2.15,  speed: 215, r: 27, grow: 8, seed: 102, accel: 0.54, isFront: true },  // [앞] 좌하단 쾌속 분출

  // 💨 중거리 불규칙 확산 불꽃 (115px)
  { a: 0.85,  speed: 115, r: 29, grow: 7, seed: 103, accel: 0.85, isFront: true },  // [앞] 우하단

  // 🌋 근거리 체류 화염 (55px)
  { a: -2.35, speed: 55,  r: 30, grow: 6, seed: 104, accel: 1.10, isFront: false }, // [뒤] 좌상단
];

// 2차 파동: 5개 정예 불꽃 (Z-축 앞 2개 / 뒤 3개, 다른 각도로 2차 절정 분출)
const OUTRAGE_WAVE2_DEFS: OutrageFlameDef[] = [
  // 🚀 2차 초고속 장거리 돌출 제트
  { a: -1.20, speed: 235, r: 26, grow: 8, seed: 201, accel: 0.50, isFront: false }, // [뒤] 상공 돌출
  { a: 0.50,  speed: 220, r: 26, grow: 8, seed: 202, accel: 0.52, isFront: true },  // [앞] 우하단

  // 💨 2차 중거리 불꽃 (125px)
  { a: 2.10,  speed: 125, r: 29, grow: 8, seed: 203, accel: 0.82, isFront: true },  // [앞] 좌하단
  { a: -2.40, speed: 115, r: 28, grow: 7, seed: 204, accel: 0.85, isFront: false }, // [뒤] 좌상단

  // 🌋 2차 근거리 화염 (55px)
  { a: 1.25,  speed: 55,  r: 31, grow: 7, seed: 205, accel: 1.12, isFront: false }, // [뒤] 하단
];

/**
 * 🐲 역린 시전 포켓몬 중앙 회전 팽창 불꽃
 * - "해당 중간불꽃은 z축 위에 보이는 하나" (isForeground === true 전면 레이어 1개 단독 렌더링)
 * - "처음에는 크기가 작음" -> p 진행에 따라 11px에서 46px로 점진적 팽창
 * - "(추가로 외각부분은 가로로넓음)" -> 외곽 aspectX = 1.70, aspectY = 0.75 로 뚜렷한 가로 타원형
 * - ">회전하면서 커짐" -> ctx.rotate(rot) 적용으로 화면 상에서 가로 형태가 360도 몸체 회전하며 팽창!
 * - "가로로 넓은게 회전하는데 왜 가로상태가 유지되는거지 안돌아가고" ->
 *   이전에는 캔버스 회전 없이 X/Y 축이 화면에 고정되어 형태가 가로로 멈춰있었으나,
 *   ctx.rotate(rot)를 직접 적용하여 가로로 긴 화염 덩어리 자체가 팽이처럼 빙글빙글 회전!
 * - "안쪽 노란불꽃 어두운 붉은색으로" -> 내부 코어는 짙은 흑적색/어두운 붉은색(#580A0A, #7F1D1D)
 */
function drawOutrageCenterSwirlFlame(
  ctx: any,
  cx: number,
  cy: number,
  p: number
) {
  // 진입 페이드인 및 끝부분 부드러운 소산
  const fadeIn = Math.min(1.0, p / 0.07);
  const fadeOut = p > 0.88 ? Math.max(0.0, (1.0 - p) / 0.12) : 1.0;
  const alpha = fadeIn * fadeOut;
  if (alpha <= 0.01) return;

  // 1. 크기: 처음에는 아주 작은 불씨 상태(약 3.5px)에서 시작하여 점진적으로 거대하게 팽창(최대 46px)
  const growProg = Math.pow(Math.min(1.0, Math.max(0.0, p)), 0.85);
  const curR = 3.5 + growProg * 42.5;

  // 2. 회전각: p 진행에 따라 고속 회전 (약 2.5바퀴 회전)
  const rot = p * Math.PI * 5.0;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  // 🌟 캔버스 컨텍스트 자체를 회전시켜 가로로 넓은 타원 화염이 실제로 360도 물리 회전!
  ctx.rotate(rot);

  // 3. 외곽 화염 연무: ctx.scale(1.70, 0.75)을 적용하여 방사형 그라디언트도 완벽한 타원형으로 일치
  // -> 짧은 축과 긴 축 모두 외곽 경계선에서 동일하게 부드러운 투명 페이드(0.00)에 도달하여 짧은 쪽이 진해보이는 현상 완전 해결!
  ctx.save();
  ctx.scale(1.70, 0.75);

  const outerPts = getOutrageBillowingPoints(curR, 77, rot * 0.35, false, 1.0, 1.0);
  traceOutrageContour(ctx, outerPts);

  const outerGrad = ctx.createRadialGradient(
    0,
    0,
    Math.max(0.5, curR * 0.15),
    0,
    0,
    Math.max(3.0, curR * 1.18)
  );
  outerGrad.addColorStop(0.00, "rgba(185, 28, 28, 0.95)");  // 중심 짙은 레드
  outerGrad.addColorStop(0.35, "rgba(220, 38, 38, 0.90)");  // 심홍색
  outerGrad.addColorStop(0.70, "rgba(244, 63, 94, 0.65)");  // 로즈 레드
  outerGrad.addColorStop(0.90, "rgba(251, 113, 133, 0.25)"); // 살구 핑크 연무
  outerGrad.addColorStop(1.00, "rgba(251, 113, 133, 0.00)"); // 완전 투명
  ctx.fillStyle = outerGrad;
  ctx.fill();
  ctx.restore();

  // 4. 내부 코어: 내부 코어도 scale(1.35, 0.82)로 타원형 그라디언트 일치
  ctx.save();
  ctx.scale(1.35, 0.82);

  const corePts = getOutrageBillowingPoints(curR, 88, -rot * 0.25, true, 1.0, 1.0);
  traceOutrageContour(ctx, corePts);

  const coreR = Math.max(1.5, curR * 0.58);
  const coreGrad = ctx.createRadialGradient(
    0,
    0,
    0,
    0,
    0,
    Math.max(2.0, coreR * 1.18)
  );
  coreGrad.addColorStop(0.00, "#580A0A");                     // 최심부 가장 어두운 흑적색 (Dark Crimson/Black-Red)
  coreGrad.addColorStop(0.35, "rgba(127, 29, 29, 0.98)");    // 어두운 붉은색 (Red 900)
  coreGrad.addColorStop(0.70, "rgba(153, 27, 27, 0.85)");    // 짙은 레드 (Red 800)
  coreGrad.addColorStop(0.90, "rgba(185, 28, 28, 0.35)");    // 붉은 번짐
  coreGrad.addColorStop(1.00, "rgba(185, 28, 28, 0.00)");    // 투명 페이드
  ctx.fillStyle = coreGrad;
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * 🐲 역린 시전 시 포켓몬을 중심으로 사방 360도로 퍼져나가는 방사형 불꽃 폭발 (Step 1)
 * - 1차 파동 4개, 2차 파동 5개로 정예화하여 난잡함 없이 깔끔하고 웅장한 방사 연출
 */
function drawOutrageRadiatingFlames(
  ctx: any,
  cx: number,
  cy: number,
  p: number,
  isForeground: boolean = false
) {
  // 2회의 방사 파동
  const waves = [
    { start: 0.00, end: 0.65, defs: OUTRAGE_WAVE1_DEFS, scale: 1.0 },
    { start: 0.35, end: 1.00, defs: OUTRAGE_WAVE2_DEFS, scale: 1.12 },
  ];

  for (const wave of waves) {
    if (p < wave.start || p > wave.end) continue;
    const wp = (p - wave.start) / (wave.end - wave.start); // 0.0 -> 1.0

    // 진입 팽창 & 외곽 자연스러운 페이드아웃
    const waveAlpha = Math.min(1.0, wp / 0.14) * Math.max(0.0, 1.0 - Math.pow(wp, 1.5));
    if (waveAlpha <= 0.01) continue;

    for (let i = 0; i < wave.defs.length; i++) {
      const d = wave.defs[i];

      // Z-축 필터링: 앞쪽 레이어는 isFront가 true인 화염만, 뒤쪽 레이어는 false인 화염만 렌더링
      if (Boolean(d.isFront) !== isForeground) continue;

      // 가속 지수(accel) 적용: 고속 제트는 초반에 폭발적으로 돌진하여 훨씬 멀리 도달
      const speedProg = Math.pow(wp, d.accel);
      const dist = speedProg * d.speed * wave.scale;

      const px = cx + Math.cos(d.a) * dist;
      const py = cy + Math.sin(d.a) * (dist * 0.85); // 자연스러운 원근 타원 방사

      // 퍼져나가며 유기적으로 팽창하는 크기
      const curR = (d.r + wp * d.grow) * wave.scale;
      const roll = wp * 2.4 + d.seed;

      // 1. 2차 파동의 초고속 장거리 제트에서만 은은한 잔상 적용
      if (wave.scale > 1.05 && d.speed >= 230 && dist > 70) {
        const trailDist = dist * 0.55;
        const tpx = cx + Math.cos(d.a) * trailDist;
        const tpy = cy + Math.sin(d.a) * (trailDist * 0.85);
        drawOutrageFlamePuff(ctx, tpx, tpy, curR * 0.55, roll * 1.3, waveAlpha * 0.50, d.seed + 50);
      }

      // 2. 메인 화염 덩어리 렌더링
      drawOutrageFlamePuff(ctx, px, py, curR, roll, waveAlpha, d.seed);
    }
  }

  // =========================================================================
  // 중앙 코어 불꽃: "해당 중간불꽃은 z축 위에 보이는 하나"
  // - 전면(isForeground === true) 레이어에만 단 1개 렌더링! 후방에는 중앙 불꽃 없음.
  // - "처음에는 크기가 작음 > (추가로 외각부분은 가로로넓음) > 회전하면서 커짐"
  // - "중앙에 보이는 불꽃은 안쪽 노란불꽃 어두운 붉은색으로"
  // =========================================================================
  if (isForeground) {
    drawOutrageCenterSwirlFlame(ctx, cx, cy, p);
  }

  // 절제된 미세 불티 스파크 (Z-축 분리, 총 6개)
  const sparkAlpha = Math.min(1.0, p / 0.08) * Math.min(1.0, (1.0 - p) / 0.06);
  for (let s = 0; s < 6; s++) {
    const sAngle = (s / 6) * Math.PI * 2 + s * 1.8 + p * 2.0;
    const isFrontSpark = Math.sin(sAngle) > 0;
    if (isFrontSpark !== isForeground) continue;

    const sSpeed = s % 2 === 0 ? 140 : 80;
    const sDist = 15 + ((p * sSpeed + s * 22) % (sSpeed * 0.85));
    const spx = cx + Math.cos(sAngle) * sDist;
    const spy = cy + Math.sin(sAngle) * (sDist * 0.85);
    const sAlpha = sparkAlpha * Math.max(0, 1.0 - sDist / (sSpeed * 0.85));
    if (sAlpha > 0.05) {
      ctx.fillStyle = s % 2 === 0
        ? `rgba(254, 240, 138, ${sAlpha * 0.95})`
        : `rgba(251, 113, 133, ${sAlpha * 0.90})`;
      ctx.fillRect(spx - 1.2, spy - 1.2, 2.2, 2.2);
    }
  }
}

/**
 * 🐲 200: 역린 (Outrage) 후방 레이어 렌더러
 */
export function drawOutrageBehindEffect(
  ctx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  if (!ctx) return;
  const { ax, ay, tx, ty, step, p, isP, frame } = parseOutrageArgs(
    attackerPosOrFrame,
    targetPosOrDrawCtx,
    moveStep,
    progress,
    isPlayer
  );

  const curAx = ax + (isP ? (frame?.pOffset?.x ?? 0) : (frame?.eOffset?.x ?? 0));
  const curAy = ay + (isP ? (frame?.pOffset?.y ?? 0) : (frame?.eOffset?.y ?? 0));
  const curTx = tx + (isP ? (frame?.eOffset?.x ?? 0) : (frame?.pOffset?.x ?? 0));
  const curTy = ty + (isP ? (frame?.eOffset?.y ?? 0) : (frame?.pOffset?.y ?? 0));

  ctx.save();

  // --------------------------------------------------------------------------
  // Step 1: 배경 주황빛 그을림 2회 펄스 + [Z-축 뒤] 후방 화염 폭발
  // --------------------------------------------------------------------------
  if (step === 1) {
    drawOutrageScorchedBackground(ctx, p, curAx, curAy, isP);
    const casterY = curAy - (isP ? 16 : 14);
    drawOutrageRadiatingFlames(ctx, curAx, casterY, p, false); // isForeground = false (Z-축 뒤)
  }

  // --------------------------------------------------------------------------
  // Step 4: 타격 시 링 및 추가 이펙트 제거 (할퀴기 전면 유지)
  // --------------------------------------------------------------------------
  else if (step === 4) {
    // 링 및 후방 파티클 완전 제거
  }

  ctx.restore();
}

/**
 * 🐲 200: 역린 (Outrage) 전면 메인 렌더러
 */
export function drawOutrageEffect(
  ctx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  if (!ctx) return;
  const { ax, ay, tx, ty, step, p, isP, isHit, frame } = parseOutrageArgs(
    attackerPosOrFrame,
    targetPosOrDrawCtx,
    moveStep,
    progress,
    isPlayer
  );

  const curAx = ax + (isP ? (frame?.pOffset?.x ?? 0) : (frame?.eOffset?.x ?? 0));
  const curAy = ay + (isP ? (frame?.pOffset?.y ?? 0) : (frame?.eOffset?.y ?? 0));
  const curTx = tx + (isP ? (frame?.eOffset?.x ?? 0) : (frame?.pOffset?.x ?? 0));
  const curTy = ty + (isP ? (frame?.eOffset?.y ?? 0) : (frame?.pOffset?.y ?? 0));

  ctx.save();

  // --------------------------------------------------------------------------
  // Step 1: [Z-축 앞] 시전자 전면을 휘감으며 사방으로 뻗어나가는 전방 화염
  // --------------------------------------------------------------------------
  if (step === 1) {
    const casterY = curAy - (isP ? 16 : 14);
    drawOutrageRadiatingFlames(ctx, curAx, casterY, p, true); // isForeground = true (Z-축 앞)
  }

  // --------------------------------------------------------------------------
  // Step 2: 1타 - 벼락같은 1차 사선 드래곤 클로 참격 (우상단 ➔ 좌하단) (할퀴기 전용)
  // --------------------------------------------------------------------------
  else if (step === 2) {
    const strikeX = curTx;
    const strikeY = curTy - 8;
    const slashAngle = -0.58; // 약 -33도

    const bladeAlpha = Math.max(0, p < 0.65 ? 1.0 : (1.0 - (p - 0.65) / 0.35));
    if (bladeAlpha > 0.01) {
      drawTripleDragonClaw(ctx, strikeX, strikeY, slashAngle, 170, 13, bladeAlpha, true);
    }

    // 🔥 타격 시점 화염 폭쇄 (불과 함께)
    if (p >= 0.50) {
      const hitP = (p - 0.50) / 0.50;
      const hitAlpha = Math.sin(hitP * Math.PI);
      drawOutrageFlamePuff(ctx, strikeX, strikeY, 26 + hitP * 8, hitP * 2.0, hitAlpha * 0.90, 101);
      drawOutrageFlamePuff(ctx, strikeX - 12, strikeY + 8, 20 + hitP * 6, -hitP * 2.2, hitAlpha * 0.75, 102);
    }
  }

  // --------------------------------------------------------------------------
  // Step 3: 2타 - 광란의 2차 역방향 교차 참격 (좌상단 ➔ 우하단, 'X' 폭쇄) (할퀴기 전용)
  // --------------------------------------------------------------------------
  else if (step === 3) {
    const strikeX = curTx;
    const strikeY = curTy - 8;
    const crossAngle = 0.58; // 약 +33도 (역방향 교차)

    // 1차 참격 잔향이 희미하게 남아 'X'자 상흔 형성
    const woundAlpha = Math.max(0, (1.0 - p * 0.8) * 0.45);
    if (woundAlpha > 0.01) {
      drawTripleDragonClaw(ctx, strikeX, strikeY, -0.58, 170, 13, woundAlpha, true);
    }

    // 2차 역방향 참격호
    const bladeAlpha = Math.max(0, p < 0.65 ? 1.0 : (1.0 - (p - 0.65) / 0.35));
    if (bladeAlpha > 0.01) {
      drawTripleDragonClaw(ctx, strikeX, strikeY, crossAngle, 170, 13, bladeAlpha, false);
    }

    // 🔥 'X' 교차점 화염 폭쇄 (불과 함께)
    if (p >= 0.50) {
      const hitP = (p - 0.50) / 0.50;
      const hitAlpha = Math.sin(hitP * Math.PI);
      drawOutrageFlamePuff(ctx, strikeX, strikeY, 30 + hitP * 10, hitP * 2.5, hitAlpha * 0.95, 201);
      drawOutrageFlamePuff(ctx, strikeX + 14, strikeY - 10, 22 + hitP * 6, -hitP * 2.0, hitAlpha * 0.80, 202);
      drawOutrageFlamePuff(ctx, strikeX - 14, strikeY + 10, 22 + hitP * 6, hitP * 2.0, hitAlpha * 0.80, 203);
    }
  }

  // --------------------------------------------------------------------------
  // Step 4: 3타 - 피니시 수직 분쇄 드래곤 클로 (할퀴기 전용)
  // --------------------------------------------------------------------------
  else if (step === 4) {
    const strikeX = curTx;
    const strikeY = curTy - 6;

    // 수직 분쇄 드래곤 클로
    const smashAlpha = Math.max(0, p < 0.65 ? 1.0 : (1.0 - (p - 0.65) / 0.35));
    if (smashAlpha > 0.01) {
      drawTripleDragonClaw(ctx, strikeX, strikeY - 10, Math.PI * 0.52, 185, 16, smashAlpha, true);
    }

    // 🔥 피니시 지면 대분쇄 화염 폭쇄 (불과 함께)
    if (p >= 0.40) {
      const hitP = (p - 0.40) / 0.60;
      const hitAlpha = Math.sin(hitP * Math.PI);
      drawOutrageFlamePuff(ctx, strikeX, strikeY + 10, 36 + hitP * 12, hitP * 2.0, hitAlpha * 0.95, 301);
      drawOutrageFlamePuff(ctx, strikeX - 26 * hitP - 8, strikeY + 12, 24 + hitP * 8, -hitP * 2.4, hitAlpha * 0.85, 302);
      drawOutrageFlamePuff(ctx, strikeX + 26 * hitP + 8, strikeY + 12, 24 + hitP * 8, hitP * 2.4, hitAlpha * 0.85, 303);
    }
  }

  // --------------------------------------------------------------------------
  // Step 5: 피날레 복귀
  // --------------------------------------------------------------------------
  else if (step === 5) {
    // 점파티클 제거됨
  }

  ctx.restore();
}

