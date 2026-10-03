// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";

// ============================================================================
// 🔍 193: 꿰뚫어보기 (Foresight)
// 유저 지시 연출:
// 1. 돋보기가 시전 포켓몬 좌측에 나타남
// 2. 시전 포켓몬의 좌 ➔ 우 ➔ 좌를 부드럽게 오가며 스캔
// 3. 시전 포켓몬 중심(몸체)에게로 돋보기가 이동함
// 4. 돋보기는 페이드 아웃
// 5. 시전 포켓몬은 살짝 흰색으로 페이드 적용
// ============================================================================

/**
 * 인자 파싱 헬퍼
 */
function parseForesightArgs(
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
 * 돋보기(Magnifying Glass) 렌더링 함수
 */
function drawMagnifyingGlass(
  ctx: any,
  cx: number,
  cy: number,
  radius: number = 18,
  angle: number = Math.PI / 4,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.translate(cx, cy);

  // 1. 손잡이 (Handle) - 유리 내부를 절대 침범하지 않도록 렌즈 영역 마스킹(클리핑)
  ctx.save();
  ctx.beginPath();
  ctx.rect(-radius * 3, -radius * 3, radius * 6, radius * 6);
  ctx.arc(0, 0, radius - 1.2, 0, Math.PI * 2, true);
  ctx.clip();

  const hAngle = angle;
  const hStart = radius * 0.95;
  const hLen = radius * 1.35;
  const hStartX = Math.cos(hAngle) * hStart;
  const hStartY = Math.sin(hAngle) * hStart;
  const hEndX = Math.cos(hAngle) * (hStart + hLen);
  const hEndY = Math.sin(hAngle) * (hStart + hLen);

  // 손잡이 외곽 그림자 (짙은 다크 그레이)
  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(hStartX, hStartY);
  ctx.lineTo(hEndX, hEndY);
  ctx.stroke();

  // 손잡이 어두운 회색 몸체 (Charcoal Dark Gray)
  ctx.strokeStyle = "#374151";
  ctx.lineWidth = 4.2;
  ctx.beginPath();
  ctx.moveTo(hStartX, hStartY);
  ctx.lineTo(hEndX, hEndY);
  ctx.stroke();

  // 손잡이 그레이 하이라이트
  ctx.strokeStyle = "#6B7280";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(hStartX - 0.8, hStartY - 0.8);
  ctx.lineTo(hEndX - 0.8, hEndY - 0.8);
  ctx.stroke();

  ctx.restore();

  // 2. 렌즈 금속 테두리 (Rim)
  // 외곽 딥 차콜 림
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  // 메인 어두운 회색 림
  ctx.strokeStyle = "#4B5563";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  // 내부 림 하이라이트
  ctx.strokeStyle = "#9CA3AF";
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.arc(0, 0, radius - 0.5, 0, Math.PI * 2);
  ctx.stroke();

  // 3. 투명 유리알 (흰 그라데이션 제거하여 완전 투명하게 유지)

  // 4. 유리 반사광 (Glass Glare Arcs)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.90)";
  ctx.lineWidth = 2.0;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.68, -Math.PI * 0.80, -Math.PI * 0.20);
  ctx.stroke();

  // 보조 반사점
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(radius * 0.45, radius * 0.45, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 시전 포켓몬 살짝 흰색 페이드 렌더링
 */
function drawSoftWhiteFade(ctx: any, x: number, y: number, alpha: number) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(0.65, Math.max(0, alpha));

  const grad = ctx.createRadialGradient(x, y, 4, x, y, 44);
  grad.addColorStop(0.0, "rgba(255, 255, 255, 0.85)");
  grad.addColorStop(0.45, "rgba(255, 255, 255, 0.55)");
  grad.addColorStop(0.8, "rgba(224, 242, 254, 0.25)");
  grad.addColorStop(1.0, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(x, y, 44, 44, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 🔍 193: 꿰뚫어보기 Behind Effect
 */
export function drawForesightBehindEffect(
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
 * 🔍 193: 꿰뚫어보기 Front Effect
 * - Step 1: 시전 포켓몬의 좌 ➔ 우 ➔ 좌를 부드럽게 오가며 돋보기 스캔
 * - Step 2: 좌측에서 시전 포켓몬 중심(몸체)으로 돋보기가 슥 이동
 * - Step 3: 시전 포켓몬 위치에서 돋보기 페이드아웃 + 시전 포켓몬 살짝 흰색 페이드 적용
 * - Step 4: 잔향 소산 및 복귀
 */
export function drawForesightEffect(
  targetCtx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  const { ax, ay, step, p, isP } = parseForesightArgs(
    attackerPosOrFrame,
    targetPosOrDrawCtx,
    moveStep,
    progress,
    isPlayer
  );

  const ctx = targetCtx;
  ctx.save();

  // 시전 포켓몬 중심 좌표 및 좌우 폭
  const casterCenterX = ax;
  const casterCenterY = ay - 12;
  const scanDistance = 34; // 시전 포켓몬 좌우 폭 기준 이동 반경 (좌: -34px, 우: +34px)

  // --------------------------------------------------------------------------
  // Step 1: 시전 포켓몬의 [좌 ➔ 우 ➔ 좌] 부드럽게 왕복 스캔
  // --------------------------------------------------------------------------
  if (step === 1) {
    // p: 0.0 ~ 1.0 동안
    // p = 0.0 ➔ 좌측 (-34px)
    // p = 0.5 ➔ 우측 (+34px)
    // p = 1.0 ➔ 좌측 (-34px)
    const waveAngle = p * Math.PI * 2 - Math.PI / 2;
    const swayX = Math.sin(waveAngle) * scanDistance;
    // 살짝 위아래로 부드러운 호를 그리며 이동
    const swayY = Math.cos(waveAngle) * 4;

    const curX = casterCenterX + swayX;
    const curY = casterCenterY - 4 + swayY;
    const alpha = Math.min(1.0, p * 2.8);

    drawMagnifyingGlass(ctx, curX, curY, 18, isP ? Math.PI / 4 : (Math.PI * 3) / 4, alpha);
  }

  // --------------------------------------------------------------------------
  // Step 2: 좌측(-34px)에서 시전 포켓몬 중심(0px)으로 슥 이동
  // --------------------------------------------------------------------------
  else if (step === 2) {
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const t = easeOutCubic(p);

    const startX = casterCenterX - scanDistance;
    const startY = casterCenterY - 4;

    const curX = startX + (casterCenterX - startX) * t;
    const curY = startY + (casterCenterY - startY) * t;

    drawMagnifyingGlass(ctx, curX, curY, 18, isP ? Math.PI / 4 : (Math.PI * 3) / 4, 1.0);
  }

  // --------------------------------------------------------------------------
  // Step 3: 중심에서 돋보기 페이드 아웃 & 시전 포켓몬 살짝 흰색 페이드 적용
  // --------------------------------------------------------------------------
  else if (step === 3) {
    // 돋보기 페이드 아웃 (1.0 -> 0.0)
    const glassAlpha = Math.max(0, 1.0 - p * 1.4);
    if (glassAlpha > 0.01) {
      drawMagnifyingGlass(ctx, casterCenterX, casterCenterY, 18, isP ? Math.PI / 4 : (Math.PI * 3) / 4, glassAlpha);
    }

    // 시전 포켓몬 살짝 흰색 페이드 (0.0 -> 피크 0.55 -> 서서히 감쇠)
    const whiteAlpha = Math.sin(p * Math.PI) * 0.55;
    drawSoftWhiteFade(ctx, casterCenterX, casterCenterY, whiteAlpha);
  }

  // --------------------------------------------------------------------------
  // Step 4: 시전 포켓몬 흰색 페이드 잔향 마무리 및 안정 복귀
  // --------------------------------------------------------------------------
  else if (step === 4) {
    const whiteAlpha = Math.max(0, (1.0 - p) * 0.25);
    drawSoftWhiteFade(ctx, casterCenterX, casterCenterY, whiteAlpha);
  }

  ctx.restore();
}

// ============================================================================
// 👻 194: 길동무 (Destiny Bond)
// 유저 지시 연출:
// 1. 암전 반투명검정
// 2. 시전 포켓몬 위치에 흰색 구체 + 흰색 글로우 효과 좀 크게 나타남
// 3. 이 빛은 페이드아웃
// 4. 시전 포켓몬 아래에 흰색 타원 (구체이나 각도로 입체적으로 보이게 하기 위해 타원)
// 5. 이게 상대 포켓몬 바닥으로 이동
// 6. 완전히 이동하면 시전 포켓몬과 대상 포켓몬 모두 흰색으로 점차 페이드인 > 페이드아웃 (흰색 필터)
// ============================================================================

/**
 * 길동무 인자 파싱 헬퍼
 */
function parseDestinyBondArgs(
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  let ax = 130;
  let ay = 184;
  let tx = 380;
  let ty = 94;
  let step = 1;
  let p = 0.5;
  let isP = true;
  let frameObj: any = null;
  let drawCtxObj: any = null;

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
    drawCtxObj = targetPosOrDrawCtx || {};
    const aPos = drawCtxObj.casterPos || drawCtxObj.attackerPos || { x: 130, y: 184 };
    const tPos = drawCtxObj.targetPos || { x: 380, y: 94 };
    ax = aPos.x;
    ay = aPos.y;
    tx = tPos.x;
    ty = tPos.y;
    step = frameObj.moveStep ?? (drawCtxObj.step || 1);
    p = Math.min(
      1.0,
      Math.max(
        0.0,
        frameObj.effectProgress ??
          frameObj.progress ??
          drawCtxObj.effectProgress ??
          drawCtxObj.progress ??
          0.5
      )
    );
    isP = drawCtxObj.isPlayer !== undefined ? Boolean(drawCtxObj.isPlayer) : true;
  }

  // 발 밑 바닥 좌표 계산 (drawCtx의 pm, em 우선 활용)
  let casterFloorX = ax;
  let casterFloorY = ay + 36;
  let targetFloorX = tx;
  let targetFloorY = ty + 36;

  if (drawCtxObj) {
    if (isP) {
      if (drawCtxObj.pm) {
        casterFloorX = drawCtxObj.pm.x;
        casterFloorY = drawCtxObj.pm.y;
      }
      if (drawCtxObj.em) {
        targetFloorX = drawCtxObj.em.x;
        targetFloorY = drawCtxObj.em.y;
      }
    } else {
      if (drawCtxObj.em) {
        casterFloorX = drawCtxObj.em.x;
        casterFloorY = drawCtxObj.em.y;
      }
      if (drawCtxObj.pm) {
        targetFloorX = drawCtxObj.pm.x;
        targetFloorY = drawCtxObj.pm.y;
      }
    }
  }

  return {
    ax,
    ay,
    tx,
    ty,
    casterFloorX,
    casterFloorY,
    targetFloorX,
    targetFloorY,
    step,
    p,
    isP,
    frame: frameObj,
  };
}

/**
 * 시전 포켓몬 위치의 대형 흰색 구체 렌더링 (하이라이트/링 제거, 외곽 투명 그라데이션)
 */
function drawDestinyWhiteSphere(
  ctx: any,
  cx: number,
  cy: number,
  scale: number = 1.0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const r = Math.max(1, 68 * scale);
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  grad.addColorStop(0.30, "rgba(255, 255, 255, 0.90)");
  grad.addColorStop(0.60, "rgba(255, 255, 255, 0.45)");
  grad.addColorStop(0.85, "rgba(255, 255, 255, 0.15)");
  grad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 바닥 흰색 타원 렌더링 (하이라이트/링 제거, 외곽 투명 그라데이션)
 */
function drawDestinyFloorOval(
  ctx: any,
  x: number,
  y: number,
  alpha: number = 1.0,
  scale: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const rx = 32 * scale;
  const ry = 13 * scale;

  // 타원 비율 스케일 변환을 통해 외곽으로 부드럽게 빠지는 완전한 타원 투명 그라데이션 구현
  ctx.translate(x, y);
  ctx.scale(1.0, ry / rx);

  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  grad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  grad.addColorStop(0.35, "rgba(255, 255, 255, 0.90)");
  grad.addColorStop(0.65, "rgba(255, 255, 255, 0.45)");
  grad.addColorStop(0.85, "rgba(255, 255, 255, 0.15)");
  grad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 두 포켓몬 위치의 소프트 백색 글로우 오버레이
 */
function drawSoftWhiteGlowOnPokemon(
  ctx: any,
  x: number,
  y: number,
  alpha: number
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(0.85, Math.max(0, alpha));

  const grad = ctx.createRadialGradient(x, y, 2, x, y, 52);
  grad.addColorStop(0.0, "rgba(255, 255, 255, 0.90)");
  grad.addColorStop(0.4, "rgba(255, 255, 255, 0.60)");
  grad.addColorStop(0.75, "rgba(230, 242, 255, 0.25)");
  grad.addColorStop(1.0, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, 52, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 👻 194: 길동무 Behind Effect (필요 시 확장 가능)
 */
export function drawDestinyBondBehindEffect(
  targetCtx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  // 필요 시 백그라운드 레이어 연출 확장 가능
}

/**
 * 👻 194: 길동무 Front Effect
 *
 * 연출 시퀀스:
 * - Step 1: 시전 포켓몬 위치에 흰색 구체 + 흰색 글로우 효과 크게 나타남
 * - Step 2: 이 빛은 페이드아웃
 * - Step 3: 시전 포켓몬 아래에 흰색 타원 (입체적 구체 느낌의 타원)이 생성되어 상대 포켓몬 바닥으로 이동
 * - Step 4: 완전히 이동하면 시전 포켓몬과 대상 포켓몬 모두 흰색으로 점차 페이드인 > 페이드아웃 (흰색 필터)
 * - Step 5: 잔향 소산 및 전장 안정 복귀
 */
export function drawDestinyBondEffect(
  targetCtx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  const {
    ax,
    ay,
    tx,
    ty,
    casterFloorX,
    casterFloorY,
    targetFloorX,
    targetFloorY,
    step,
    p,
  } = parseDestinyBondArgs(
    attackerPosOrFrame,
    targetPosOrDrawCtx,
    moveStep,
    progress,
    isPlayer
  );

  const ctx = targetCtx;
  ctx.save();

  // --------------------------------------------------------------------------
  // Step 1: 시전 포켓몬 위치에 흰색 구체 + 흰색 글로우 크게 나타남
  // --------------------------------------------------------------------------
  if (step === 1) {
    const scale = 0.5 + p * 0.55; // 0.5 -> 1.05
    const alpha = Math.min(1.0, p * 1.5);
    drawDestinyWhiteSphere(ctx, ax, ay, scale, alpha);
  }

  // --------------------------------------------------------------------------
  // Step 2: 이 빛은 페이드아웃
  // --------------------------------------------------------------------------
  else if (step === 2) {
    const scale = 1.05 + p * 0.15; // 1.05 -> 1.20
    const alpha = Math.max(0, 1.0 - p);
    drawDestinyWhiteSphere(ctx, ax, ay, scale, alpha);
  }

  // --------------------------------------------------------------------------
  // Step 3: 시전 포켓몬 아래 흰색 타원 출현 & 상대 포켓몬 바닥으로 이동
  // --------------------------------------------------------------------------
  else if (step === 3) {
    // Cubic Ease-In-Out
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const t = easeInOutCubic(p);

    const curX = casterFloorX + (targetFloorX - casterFloorX) * t;
    const curY = casterFloorY + (targetFloorY - casterFloorY) * t;

    // 이동 잔상 (Trail) 렌더링
    if (p > 0.08) {
      const trail1T = easeInOutCubic(Math.max(0, p - 0.12));
      const tr1X = casterFloorX + (targetFloorX - casterFloorX) * trail1T;
      const tr1Y = casterFloorY + (targetFloorY - casterFloorY) * trail1T;
      drawDestinyFloorOval(ctx, tr1X, tr1Y, 0.28, 0.85);

      const trail2T = easeInOutCubic(Math.max(0, p - 0.22));
      const tr2X = casterFloorX + (targetFloorX - casterFloorX) * trail2T;
      const tr2Y = casterFloorY + (targetFloorY - casterFloorY) * trail2T;
      drawDestinyFloorOval(ctx, tr2X, tr2Y, 0.14, 0.70);
    }

    // 메인 흰색 타원
    const ovalAlpha = Math.min(1.0, p < 0.15 ? p / 0.15 : 1.0);
    drawDestinyFloorOval(ctx, curX, curY, ovalAlpha, 1.0);
  }

  // --------------------------------------------------------------------------
  // Step 4: 완전히 이동 완료 후 시전 포켓몬 & 대상 포켓몬 모두 흰색 페이드인 > 페이드아웃
  // --------------------------------------------------------------------------
  else if (step === 4) {
    // 상대 바닥에 안착된 타원은 서서히 페이드아웃
    const floorOvalAlpha = Math.max(0, 1.0 - p * 1.2);
    if (floorOvalAlpha > 0.01) {
      drawDestinyFloorOval(ctx, targetFloorX, targetFloorY, floorOvalAlpha, 1.0);
    }

    // 두 포켓몬 모두에게 은은한 소프트 백색 글로우 (p에 따라 0.0 -> 피크 0.65 -> 0.0)
    const whiteGlowAlpha = Math.sin(p * Math.PI) * 0.65;
    drawSoftWhiteGlowOnPokemon(ctx, ax, ay, whiteGlowAlpha);
    drawSoftWhiteGlowOnPokemon(ctx, tx, ty, whiteGlowAlpha);
  }

  // --------------------------------------------------------------------------
  // Step 5: 잔향 소산 및 안정 복귀
  // --------------------------------------------------------------------------
  else if (step === 5) {
    const remainAlpha = Math.max(0, (1.0 - p) * 0.20);
    drawSoftWhiteGlowOnPokemon(ctx, ax, ay, remainAlpha);
    drawSoftWhiteGlowOnPokemon(ctx, tx, ty, remainAlpha);
  }

  ctx.restore();
}

// ============================================================================
// 🎵 195: 멸망의 노래 (Perish Song)
// - 전장 암전 및 불길한 보랏빛 황혼의 저주 분위기
// - 시전 포켓몬의 몸체에서 피어오르는 저주의 흑자색 음표들 (♪, ♫, ♬)
// - 전장 전체를 가로지르며 퍼져나가는 타원형 3D 음파 리플 충격파
// - 시전자와 상대 포켓몬 모두의 주위를 3D 타원 궤도로 공전하는 저주의 음표 링
// - 절정 화음에서 양 포켓몬의 공명 진동 및 보랏빛 저주의 오라 각인
// - 잔향이 서서히 소산되며 3턴 카운트다운의 불길한 여운을 남김
// ============================================================================

/**
 * 멸망의 노래 인자 파싱 헬퍼
 */
function parsePerishSongArgs(
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  let ax = 130;
  let ay = 210;
  let tx = 380;
  let ty = 120;
  let step = 1;
  let p = 0.5;
  let isP = true;
  let frameObj: any = null;
  let drawCtxObj: any = null;

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
    drawCtxObj = targetPosOrDrawCtx || {};
    const aPos = drawCtxObj.casterPos || drawCtxObj.attackerPos || { x: 130, y: 210 };
    const tPos = drawCtxObj.targetPos || { x: 380, y: 120 };
    ax = aPos.x;
    ay = aPos.y;
    tx = tPos.x;
    ty = tPos.y;
    step = frameObj.moveStep ?? (drawCtxObj.step || 1);
    p = Math.min(
      1.0,
      Math.max(
        0.0,
        frameObj.effectProgress ??
          frameObj.progress ??
          drawCtxObj.effectProgress ??
          drawCtxObj.progress ??
          0.5
      )
    );
    isP = drawCtxObj.isPlayer !== undefined ? Boolean(drawCtxObj.isPlayer) : true;
  }

  return { ax, ay, tx, ty, step, p, isP, frame: frameObj, drawCtx: drawCtxObj };
}

/**
 * 음표 색상 보간 헬퍼 (보라/검정 ➔ 붉은색/검정)
 */
function getPerishColors(redRatio: number = 0) {
  const r = Math.min(1.0, Math.max(0.0, redRatio));
  // Shadow glow: #A855F7 (168, 85, 247) -> #EF4444 (239, 68, 68)
  const sR = Math.round(168 + (239 - 168) * r);
  const sG = Math.round(85 + (68 - 85) * r);
  const sB = Math.round(247 + (68 - 247) * r);

  // Rim border: #C084FC (192, 132, 252) -> #EF4444 (239, 68, 68)
  const bR = Math.round(192 + (239 - 192) * r);
  const bG = Math.round(132 + (68 - 132) * r);
  const bB = Math.round(252 + (68 - 252) * r);

  // Body: #0F172A (15, 23, 42) -> #050505 (5, 5, 5) 흑색
  const bodyR = Math.round(15 + (5 - 15) * r);
  const bodyG = Math.round(23 + (5 - 23) * r);
  const bodyB = Math.round(42 + (5 - 42) * r);

  return {
    shadow: `rgb(${sR}, ${sG}, ${sB})`,
    rim: `rgb(${bR}, ${bG}, ${bB})`,
    body: `rgb(${bodyR}, ${bodyG}, ${bodyB})`,
  };
}

/**
 * 불길한 저주의 단일 8분음표 (♪) 렌더러
 * - redRatio: 0.0 (보라/검정) ➔ 1.0 (붉고 검정)
 * - [유저 피드백 반영]: 머리-기둥-꼬리가 하나의 온전한 일체형 단일 폐곡선(Unified Contour)으로 연결되어,
 *   연결 부위에 불필요한 교차선, 틈새, 내부 border가 일절 없는 완벽한 실루엣 렌더링
 * - 머리 우측 수직 접선과 기둥이 C1 매끄러움으로 접합되며, 좌측 접합점도 수학적 정밀 좌표로 일치
 */
function drawPerishSingleNote(
  ctx: any,
  cx: number,
  cy: number,
  scale: number = 1.0,
  rot: number = 0,
  alpha: number = 1.0,
  redRatio: number = 0
) {
  if (scale <= 0.01 || alpha <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const cols = getPerishColors(redRatio);

  ctx.shadowColor = cols.shadow;
  ctx.shadowBlur = 9;

  // 일체형 단일 폐곡선 (머리 ↔ 기둥 ↔ 꼬리 완벽 통합)
  ctx.beginPath();
  // 1. 기둥 상단 좌측에서 시작
  ctx.moveTo(2.074, -16.5);
  ctx.lineTo(3.474, -16.5);

  // 2. 꼬리 외곽 곡선 및 기둥 복귀 곡선
  ctx.bezierCurveTo(12.0, -14.5, 15.0, -7.5, 13.5, -0.5);
  ctx.bezierCurveTo(11.0, -5.5, 7.5, -8.5, 3.474, -9.0);

  // 3. 기둥 우측 외곽선 (머리 수직 접선점으로 하강)
  ctx.lineTo(3.474, 1.298);

  // 4. 머리 타원형 외곽선 (시계방향: 우측 접점 -> 하단 -> 좌측 -> 상단 좌측 접점)
  ctx.ellipse(-3.5, 3.5, 7.5, 4.2, -0.46, 0.2706, Math.PI * 2 - 0.3741, false);

  // 5. 기둥 좌측 외곽선 (머리 접점에서 기둥 상단으로 상승)
  ctx.lineTo(2.074, -16.5);
  ctx.closePath();

  // 바디 채우기 (내부 절단선 없는 순수 솔리드 검정)
  ctx.fillStyle = cols.body;
  ctx.fill();

  // 외곽선 렌더링 (전체 외곽선만 매끄럽게 연결)
  ctx.strokeStyle = cols.rim;
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.restore();
}

/**
 * 불길한 저주의 2연 16분음표 (♫) 렌더러
 * - redRatio: 0.0 (보라/검정) ➔ 1.0 (붉고 검정)
 * - [유저 피드백 반영]: 좌우 머리, 좌우 기둥, 상단 이음줄의 모든 연결 부위에
 *   내부 경계선이나 어색한 틈새가 전혀 없는 하나의 일체형 단일 폐곡선(Unified Contour)으로 조형
 * - 우측 머리 역방향(counterclockwise) 플래그 버그 수정 및 모든 이음부 정밀 일치
 */
function drawPerishDoubleNote(
  ctx: any,
  cx: number,
  cy: number,
  scale: number = 1.0,
  rot: number = 0,
  alpha: number = 1.0,
  redRatio: number = 0
) {
  if (scale <= 0.01 || alpha <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const cols = getPerishColors(redRatio);

  ctx.shadowColor = cols.shadow;
  ctx.shadowBlur = 10;

  // 일체형 단일 폐곡선 (좌우 머리 ↔ 좌우 기둥 ↔ 상단 이음줄 완벽 통합)
  ctx.beginPath();

  // 1. 이음줄 상단선 (좌측 기둥 상단 -> 우측 기둥 상단)
  ctx.moveTo(-1.905, -15.0);
  ctx.lineTo(12.995, -17.76);

  // 2. 우측 기둥 바깥쪽(우측) 외곽선 (우측 머리 수직 접선점으로 하강)
  ctx.lineTo(12.995, -0.617);

  // 3. 우측 머리 타원형 외곽선 (시계방향: 우측 접점 -> 하단 -> 좌측 -> 상단 좌측 접점)
  ctx.ellipse(6.5, 1.5, 7.0, 3.8, -0.46, 0.2627, Math.PI * 2 - 0.4062, false);

  // 4. 우측 기둥 안쪽(좌측) 외곽선 (이음줄 아랫면으로 상승)
  ctx.lineTo(11.595, -13.90);

  // 5. 이음줄 아랫면 (좌측 기둥 안쪽으로 이동)
  ctx.lineTo(-0.505, -11.66);

  // 6. 좌측 기둥 안쪽(우측) 외곽선 (좌측 머리 수직 접선점으로 하강)
  ctx.lineTo(-0.505, 1.883);

  // 7. 좌측 머리 타원형 외곽선 (시계방향: 우측 접점 -> 하단 -> 좌측 -> 상단 좌측 접점)
  ctx.ellipse(-7.0, 4.0, 7.0, 3.8, -0.46, 0.2627, Math.PI * 2 - 0.4062, false);

  // 8. 좌측 기둥 바깥쪽(좌측) 외곽선 (이음줄 상단으로 상승)
  ctx.lineTo(-1.905, -15.0);

  ctx.closePath();

  // 바디 채우기 (내부 절단선 없는 순수 솔리드 검정)
  ctx.fillStyle = cols.body;
  ctx.fill();

  // 외곽선 렌더링 (전체 외곽선만 매끄럽게 연결)
  ctx.strokeStyle = cols.rim;
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.restore();
}

/**
 * 음표 파열 및 비산 파편 렌더러
 * - [유저 피드백]: 음표가 깨지면서 파편이 사방으로 튀고, 점점 작아지면서 소멸함 (붉고 검정)
 * - [유저 피드백]: 하이라이트 제거 (순수 흑적색 파편)
 */
function drawPerishNoteShatter(
  ctx: any,
  bx: number,
  by: number,
  tau: number, // 0.0 (깨짐 직후) ~ 1.0 (완전 소멸)
  baseScale: number,
  noteIdx: number
) {
  if (tau >= 1.0 || tau < 0) return;

  // 1. 파열 섬광 (Burst Flash Spark - tau < 0.22 구간)
  if (tau < 0.22) {
    const flashProg = tau / 0.22;
    const flashAlpha = Math.max(0, 1.0 - flashProg);
    const flashR = (10 + flashProg * 16) * baseScale;
    ctx.save();
    ctx.globalAlpha = flashAlpha;
    ctx.translate(bx, by);

    // 붉은 성형 섬광 (하이라이트 백색 코어 없이 순수 붉은색)
    ctx.fillStyle = "#FF4D4D";
    ctx.shadowColor = "#EF4444";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, -flashR);
    ctx.lineTo(flashR * 0.22, -flashR * 0.22);
    ctx.lineTo(flashR, 0);
    ctx.lineTo(flashR * 0.22, flashR * 0.22);
    ctx.lineTo(0, flashR);
    ctx.lineTo(-flashR * 0.22, flashR * 0.22);
    ctx.lineTo(-flashR, 0);
    ctx.lineTo(-flashR * 0.22, -flashR * 0.22);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // 2. 파편(Shards) 비산 (6개 각도 분기)
  const shardDefs = [
    { ang: 0.15 * Math.PI, speed: 44, size: 7.2, rotSpeed: 4.8, aspect: 1.6 },
    { ang: 0.48 * Math.PI, speed: 38, size: 6.2, rotSpeed: -3.9, aspect: 1.2 },
    { ang: 0.85 * Math.PI, speed: 52, size: 8.4, rotSpeed: 5.4, aspect: 2.0 },
    { ang: 1.22 * Math.PI, speed: 40, size: 5.8, rotSpeed: -4.4, aspect: 1.4 },
    { ang: 1.55 * Math.PI, speed: 48, size: 7.8, rotSpeed: 4.2, aspect: 1.8 },
    { ang: 1.88 * Math.PI, speed: 36, size: 6.5, rotSpeed: -5.2, aspect: 1.3 },
  ];

  const shardAlpha = Math.max(0, 1.0 - Math.pow(tau, 1.25));
  // [유저 요구사항]: 파편이 작아지면서 (1.0 -> 0.0)
  const sizeMultiplier = Math.max(0, 1.0 - tau);

  for (let s = 0; s < shardDefs.length; s++) {
    const sDef = shardDefs[s];
    const dist = sDef.speed * Math.pow(tau, 0.72) * baseScale;
    const sx = bx + Math.cos(sDef.ang) * dist;
    // 중력 가속도 반영하여 아래로 살짝 호를 그리며 낙하
    const sy = by + Math.sin(sDef.ang) * dist + 14 * Math.pow(tau, 2) * baseScale;
    const sSize = sDef.size * sizeMultiplier * baseScale;
    if (sSize <= 0.4) continue;

    const sRot = sDef.ang + sDef.rotSpeed * tau * Math.PI;

    ctx.save();
    ctx.globalAlpha = shardAlpha;
    ctx.translate(sx, sy);
    ctx.rotate(sRot);

    ctx.shadowColor = "#EF4444";
    ctx.shadowBlur = 6 * sizeMultiplier;

    // 날카로운 파편 폴리곤 (검정 바탕 + 붉은 림, 하이라이트 선 완전 제거)
    const w = sSize * 0.75;
    const h = sSize * sDef.aspect;

    ctx.beginPath();
    ctx.moveTo(0, -h * 0.6);
    ctx.lineTo(w * 0.65, h * 0.35);
    ctx.lineTo(-w * 0.45, h * 0.55);
    ctx.closePath();

    ctx.fillStyle = "#0A0A0A"; // 검정 바디
    ctx.fill();

    ctx.strokeStyle = "#EF4444"; // 붉은 림
    ctx.lineWidth = Math.max(0.6, 1.4 * sizeMultiplier);
    ctx.stroke();

    ctx.restore();
  }
}

interface PerishNoteData {
  x: number;
  y: number;
  z: number; // z < 0: 뒤(Behind, drawBehindEffect), z >= 0: 앞(Front, drawEffect)
  scale: number;
  rot: number;
  alpha: number;
  type: "single" | "double";
  isShattered: boolean;
  shatterTau: number; // 0.0 to 1.0
  redRatio: number;   // 0.0 to 1.0
  noteIdx: number;
}

interface PerishNoteConfig {
  type: "single" | "double";
  basePhi: number;
  yBaseOffset: number;
  orbitRx: number;
  orbitRy: number;
  tiltY: number;
  startAngle: number;
  startHeight: number;
}

/**
 * 4개의 저주의 음표 사양 정의
 * - Note 0: 상단 가슴/어깨 레벨 (♪)
 * - Note 1: 하단 발/바닥 레벨 (♫) -> [유저 요청]: Z축 아래로 확실히 내려가 바닥 근처 궤도 순환
 * - Note 2: 중간 몸통 레벨 (♪)
 * - Note 3: 하단-중간 레벨 (♫) -> 앞쪽 통과 시 Z축 바닥 방향으로 딥(dip)
 */
const PERISH_NOTE_CONFIGS: PerishNoteConfig[] = [
  {
    type: "single",
    basePhi: 0.0,
    yBaseOffset: -16,
    orbitRx: 45,
    orbitRy: 16,
    tiltY: 6,
    startAngle: -0.65 * Math.PI,
    startHeight: -130,
  },
  {
    type: "double",
    basePhi: 0.52 * Math.PI,
    yBaseOffset: 20, // 하단 깊숙이 배치 (Z축 아래로 내려감)
    orbitRx: 42,
    orbitRy: 16,
    tiltY: 12, // 앞쪽(z > 0) 통과 시 최대 y = cy + 20 + 16 + 12 = cy + 48 (발 밑 바닥 레벨)
    startAngle: 0.35 * Math.PI,
    startHeight: 150,
  },
  {
    type: "single",
    basePhi: 1.05 * Math.PI,
    yBaseOffset: -3,
    orbitRx: 48,
    orbitRy: 18,
    tiltY: 8,
    startAngle: 1.15 * Math.PI,
    startHeight: -70,
  },
  {
    type: "double",
    basePhi: 1.58 * Math.PI,
    yBaseOffset: 12, // 하단-중간 (Z축 아래로 내려감)
    orbitRx: 40,
    orbitRy: 15,
    tiltY: 10,
    startAngle: 1.80 * Math.PI,
    startHeight: 120,
  },
];

/**
 * 포켓몬 1마리 주변의 저주의 음표 4개 상태 계산
 * - Step 1: 화면 밖(R=480px)에서부터 나선형으로 회전하며 포켓몬 근처로 쇄도 진입
 * - Step 2: 포켓몬 근처 3D 타원 궤도 회전
 * - Step 3: [유저 요청]: 회전속도가 급격히 느려지며(감속) 붉게 변함 (붉고 검정)
 * - Step 4: [유저 요청]: 음표가 하나씩 순차적으로 깨짐 > 깨지면서 파편이 작아지며 사라짐
 */
function calculatePerishNotesForPokemon(
  cx: number,
  cy: number,
  step: number,
  p: number,
  isTarget: boolean
): PerishNoteData[] {
  const notes: PerishNoteData[] = [];
  const rotDir = isTarget ? -1 : 1;

  // Step 1: 화면 밖에서부터 나선형으로 회전하면서 나타나 포켓몬 근처로 수렴
  if (step === 1) {
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const t = easeOutCubic(p);

    const startDist = 480; // 화면 밖(오프스크린)에서 완전 시작

    for (let i = 0; i < PERISH_NOTE_CONFIGS.length; i++) {
      const cfg = PERISH_NOTE_CONFIGS[i];
      const curRx = startDist * (1 - t) + cfg.orbitRx * t;
      const curRy = (startDist * 0.55) * (1 - t) + cfg.orbitRy * t;
      const curYOffset = cfg.startHeight * (1 - t) + cfg.yBaseOffset * t;

      // Step 1 동안 총 1.25바퀴 나선 회전하며 진입
      const spiralTurns = 1.25 * (1 - t);
      const angle = cfg.basePhi + rotDir * (spiralTurns * Math.PI * 2 + p * (1.25 * Math.PI * 2));

      const nx = cx + Math.cos(angle) * curRx;
      const z = Math.sin(angle); // z < 0: 뒤(Behind), z >= 0: 앞(Front)
      const ny = cy + curYOffset + Math.sin(angle) * curRy + (z > 0 ? z * cfg.tiltY * t : 0);

      const depth01 = (z + 1) / 2;
      const scale = (0.70 + depth01 * 0.45) * (0.85 + t * 0.15);
      const rot = angle + rotDir * (Math.PI * 0.5) + p * 3.0;
      const alpha = Math.min(1.0, p < 0.10 ? p / 0.10 : 1.0);

      notes.push({
        x: nx,
        y: ny,
        z,
        scale,
        rot,
        alpha,
        type: cfg.type,
        isShattered: false,
        shatterTau: 0.0,
        redRatio: 0.0,
        noteIdx: i,
      });
    }
  }
  // Step 2: 포켓몬 근처를 3D 타원 궤도로 매끄럽게 회전
  else if (step === 2) {
    const angleTurns = 1.25 + p * 1.25; // 1.25 -> 2.50

    for (let i = 0; i < PERISH_NOTE_CONFIGS.length; i++) {
      const cfg = PERISH_NOTE_CONFIGS[i];
      const angle = cfg.basePhi + rotDir * angleTurns * Math.PI * 2;
      const nx = cx + Math.cos(angle) * cfg.orbitRx;
      const z = Math.sin(angle); // z < 0: 뒤(Behind), z >= 0: 앞(Front)
      const ny = cy + cfg.yBaseOffset + Math.sin(angle) * cfg.orbitRy + (z > 0 ? z * cfg.tiltY : 0);

      const depth01 = (z + 1) / 2;
      const scale = 0.70 + depth01 * 0.45;
      const rot = Math.cos(angle) * 0.35;
      const alpha = 0.55 + depth01 * 0.45;

      notes.push({
        x: nx,
        y: ny,
        z,
        scale,
        rot,
        alpha,
        type: cfg.type,
        isShattered: false,
        shatterTau: 0.0,
        redRatio: 0.0,
        noteIdx: i,
      });
    }
  }
  // Step 3: [유저 요청]: 회전속도가 급격히 느려지면서 붉게 변함 (붉고 검정)
  else if (step === 3) {
    // 감속 곡선: p: 0.0 -> 1.0 동안 회전 속도가 서서히 0(정지)으로 수렴
    const decelCurve = 1 - Math.pow(1 - p, 2.2);
    const angleTurns = 2.50 + decelCurve * 0.65; // 2.50 -> 3.15로 서서히 멈춤
    const redRatio = p; // 0.0 (보라) -> 1.0 (완전 붉은색 & 검정)

    for (let i = 0; i < PERISH_NOTE_CONFIGS.length; i++) {
      const cfg = PERISH_NOTE_CONFIGS[i];
      const angle = cfg.basePhi + rotDir * angleTurns * Math.PI * 2;
      let nx = cx + Math.cos(angle) * cfg.orbitRx;
      const z = Math.sin(angle);
      let ny = cy + cfg.yBaseOffset + Math.sin(angle) * cfg.orbitRy + (z > 0 ? z * cfg.tiltY : 0);

      // p > 0.65 후반부에 음표가 균열 직전 긴장감으로 미세하게 진동(tremble)
      if (p > 0.65) {
        const shakePower = ((p - 0.65) / 0.35) * 1.5;
        const tremble = Math.sin(p * 45 + i * 2.5) * shakePower;
        nx += tremble;
        ny += tremble * 0.5;
      }

      const depth01 = (z + 1) / 2;
      const scale = 0.70 + depth01 * 0.45;
      const rot = Math.cos(angle) * 0.35 + (p > 0.7 ? Math.sin(p * 30 + i) * 0.1 : 0);
      const alpha = 0.65 + depth01 * 0.35;

      notes.push({
        x: nx,
        y: ny,
        z,
        scale,
        rot,
        alpha,
        type: cfg.type,
        isShattered: false,
        shatterTau: 0.0,
        redRatio,
        noteIdx: i,
      });
    }
  }
  // Step 4: [유저 요청]: 음표가 하나씩 순차적으로 깨짐 > 깨지면서 파편이 작아지면서 사라짐
  else {
    // 거의 정지 상태 유지 (미세 잔향 드리프트)
    const angleTurns = 3.15 + p * 0.04;
    // 4개 음표의 순차 파열 시점 (하나씩 차례대로 깨짐)
    const breakTimings = [0.08, 0.28, 0.48, 0.70];

    for (let i = 0; i < PERISH_NOTE_CONFIGS.length; i++) {
      const cfg = PERISH_NOTE_CONFIGS[i];
      const angle = cfg.basePhi + rotDir * angleTurns * Math.PI * 2;
      let nx = cx + Math.cos(angle) * cfg.orbitRx;
      const z = Math.sin(angle);
      let ny = cy + cfg.yBaseOffset + Math.sin(angle) * cfg.orbitRy + (z > 0 ? z * cfg.tiltY : 0);

      const depth01 = (z + 1) / 2;
      const scale = 0.70 + depth01 * 0.45;
      const rot = Math.cos(angle) * 0.35;

      const breakP = breakTimings[i];

      if (p < breakP) {
        // 아직 깨지기 전: 붉고 검은 음표가 깨지기 직전 강하게 진동
        if (breakP - p < 0.08) {
          const preShake = Math.sin((breakP - p) * 90) * 1.8;
          nx += preShake;
        }
        notes.push({
          x: nx,
          y: ny,
          z,
          scale,
          rot,
          alpha: 1.0,
          type: cfg.type,
          isShattered: false,
          shatterTau: 0.0,
          redRatio: 1.0,
          noteIdx: i,
        });
      } else {
        // 깨짐 발생! 파편이 비산하며 크기가 줄어들고 소멸 (0.0 -> 1.0)
        const shatterTau = Math.min(1.0, (p - breakP) / 0.28);
        notes.push({
          x: nx,
          y: ny,
          z,
          scale,
          rot,
          alpha: Math.max(0, 1.0 - shatterTau),
          type: cfg.type,
          isShattered: true,
          shatterTau,
          redRatio: 1.0,
          noteIdx: i,
        });
      }
    }
  }

  return notes;
}

/**
 * 🎵 195: 멸망의 노래 Behind Effect
 * - 전장 배경 암자색 ➔ 붉은색 틴트 변환
 * - 스프라이트 뒤편(z < 0)을 통과하는 음표 및 파편 엄격 렌더링
 */
export function drawPerishSongBehindEffect(
  targetCtx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  const { ax, ay, tx, ty, step, p } = parsePerishSongArgs(
    attackerPosOrFrame,
    targetPosOrDrawCtx,
    moveStep,
    progress,
    isPlayer
  );

  const ctx = targetCtx;
  ctx.save();

  // 1. 전장 배경 틴트 (Step 1,2: 암자색 ➔ Step 3,4: 붉은 저주의 핏빛 틴트)
  const redRatio = step === 1 || step === 2 ? 0 : step === 3 ? p : 1.0;
  const bgAlpha =
    step === 1 ? p * 0.18 :
    step === 2 ? 0.18 + p * 0.08 :
    step === 3 ? 0.26 :
    Math.max(0, (1.0 - p) * 0.26);

  if (bgAlpha > 0.01) {
    ctx.globalAlpha = bgAlpha;
    const midX = (ax + tx) / 2;
    const midY = (ay + ty) / 2 + 10;
    const grad = ctx.createRadialGradient(midX, midY, 20, midX, midY, 280);
    // 암자색 rgb(88, 28, 135) ➔ 핏빛 붉은색 rgb(153, 27, 27)
    const bgR = Math.round(88 + (153 - 88) * redRatio);
    const bgG = Math.round(28 + (27 - 28) * redRatio);
    const bgB = Math.round(135 + (27 - 135) * redRatio);

    grad.addColorStop(0.0, `rgba(${bgR}, ${bgG}, ${bgB}, 0.45)`);
    grad.addColorStop(0.6, `rgba(${Math.round(bgR * 0.35)}, ${Math.round(bgG * 0.35)}, ${Math.round(bgB * 0.35)}, 0.28)`);
    grad.addColorStop(1.0, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 560, 380);
  }

  // 2. 내 포켓몬과 대상 포켓몬 주변의 뒤편(z < 0) 음표 및 파편 렌더링
  const pCenterY = ay - 6;
  const tCenterY = ty - 6;
  const playerNotes = calculatePerishNotesForPokemon(ax, pCenterY, step, p, false);
  const targetNotes = calculatePerishNotesForPokemon(tx, tCenterY, step, p, true);

  const behindNotes = [...playerNotes, ...targetNotes].filter((n) => n.z < 0);
  behindNotes.sort((a, b) => a.z - b.z);

  for (const n of behindNotes) {
    if (n.isShattered) {
      drawPerishNoteShatter(ctx, n.x, n.y, n.shatterTau, n.scale, n.noteIdx);
    } else {
      if (n.type === "single") {
        drawPerishSingleNote(ctx, n.x, n.y, n.scale, n.rot, n.alpha, n.redRatio);
      } else {
        drawPerishDoubleNote(ctx, n.x, n.y, n.scale, n.rot, n.alpha, n.redRatio);
      }
    }
  }

  ctx.restore();
}

/**
 * 🎵 195: 멸망의 노래 Front Effect
 *
 * 유저 지시 연출:
 * - 회전하다가 회전속도가 느려지면서 붉게 변함 (붉고 검정)
 * - 그리고는 음표가 하나씩 깨짐 > 깨지면서 파편이 작아지면서 사라짐
 * - 스프라이트 앞편(z >= 0) 음표 및 파편 교차 렌더링으로 입체감 극대화
 */
export function drawPerishSongEffect(
  targetCtx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  const { ax, ay, tx, ty, step, p } = parsePerishSongArgs(
    attackerPosOrFrame,
    targetPosOrDrawCtx,
    moveStep,
    progress,
    isPlayer
  );

  const ctx = targetCtx;
  ctx.save();

  const pCenterY = ay - 6;
  const tCenterY = ty - 6;

  // 내 포켓몬 및 대상 포켓몬 주변 앞편(z >= 0) 음표 및 파편 렌더링
  const playerNotes = calculatePerishNotesForPokemon(ax, pCenterY, step, p, false);
  const targetNotes = calculatePerishNotesForPokemon(tx, tCenterY, step, p, true);

  const frontNotes = [...playerNotes, ...targetNotes].filter((n) => n.z >= 0);
  frontNotes.sort((a, b) => a.z - b.z);

  for (const n of frontNotes) {
    if (n.isShattered) {
      drawPerishNoteShatter(ctx, n.x, n.y, n.shatterTau, n.scale, n.noteIdx);
    } else {
      if (n.type === "single") {
        drawPerishSingleNote(ctx, n.x, n.y, n.scale, n.rot, n.alpha, n.redRatio);
      } else {
        drawPerishDoubleNote(ctx, n.x, n.y, n.scale, n.rot, n.alpha, n.redRatio);
      }
    }
  }

  ctx.restore();
}

// ============================================================================
// ❄️ 196: 얼어붙은바람 (Icy Wind)
//
// 유저 요구사항:
// 1. 얼음숨결 기반
// 2. 연기 뜨문뜨문 비어있게 (넓은 간격 & 사이 공간 배치로 바람결 표현)
// 3. 암전효과 어둡게 20% (blackFadeAlpha: 0.20)
// 4. 눈꽃 대신 그냥 흰색 동그라미로
// ============================================================================

const ICY_WHITE = "#FFFFFF";
const ICY_CYAN_LIGHT = "#E0F7FA";
const ICY_CYAN_MID = "#B2EBF2";
const ICY_CYAN_VIVID = "#4DD0E1";

/**
 * 인자 파싱 헬퍼 (얼어붙은바람)
 */
function parseIcyWindArgs(
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
  let drawCtxObj: any = null;

  if (attackerPosOrFrame && typeof attackerPosOrFrame === "object" && "moveStep" in attackerPosOrFrame) {
    frameObj = attackerPosOrFrame;
    drawCtxObj = targetPosOrDrawCtx || {};
    const aPos = drawCtxObj?.attackerPos || { x: 130, y: 220 };
    const tPos = drawCtxObj?.targetPos || { x: 380, y: 130 };
    isP = drawCtxObj?.isPlayer !== undefined ? Boolean(drawCtxObj.isPlayer) : true;
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
    frameObj = attackerPosOrFrame || {};
    drawCtxObj = targetPosOrDrawCtx || {};
    const aPos = drawCtxObj?.attackerPos || { x: 130, y: 220 };
    const tPos = drawCtxObj?.targetPos || { x: 380, y: 130 };
    isP = drawCtxObj?.isPlayer !== undefined ? Boolean(drawCtxObj.isPlayer) : true;
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
 * 눈꽃 대신 단순하고 깔끔한 흰색 동그라미 입자
 */
function drawIcyWhiteCircle(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || radius <= 0.4) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.fillStyle = ICY_WHITE;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 부드러운 냉기 연기 퍼프
 */
function drawIcyWindPuff(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number,
  tone: "deep" | "mid" | "light" = "mid"
) {
  if (alpha <= 0.01 || radius <= 0.5) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const grad = ctx.createRadialGradient(
    x - radius * 0.15,
    y - radius * 0.15,
    radius * 0.1,
    x,
    y,
    radius
  );

  if (tone === "deep") {
    grad.addColorStop(0.0, "rgba(255, 255, 255, 0.70)");
    grad.addColorStop(0.40, "rgba(255, 255, 255, 0.45)");
    grad.addColorStop(0.75, "rgba(240, 245, 255, 0.20)");
    grad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");
  } else if (tone === "mid") {
    grad.addColorStop(0.0, "rgba(255, 255, 255, 0.90)");
    grad.addColorStop(0.45, "rgba(255, 255, 255, 0.55)");
    grad.addColorStop(0.80, "rgba(245, 250, 255, 0.20)");
    grad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");
  } else {
    grad.addColorStop(0.0, "rgba(255, 255, 255, 0.95)");
    grad.addColorStop(0.50, "rgba(255, 255, 255, 0.60)");
    grad.addColorStop(0.80, "rgba(250, 252, 255, 0.20)");
    grad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 직선 얼어붙은 바람 기저 냉기 바람 콘 (Straight Frost Cone)
 * - 인위적인 점선 제거 및 푸른빛 대신 순백의 부드러운 화이트 그라디언트 적용
 */
function drawStraightIcyCone(
  ctx: any,
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  startP: number = 0.0,
  endP: number = 1.0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || endP <= startP) return;

  const dx = targetX - startX;
  const dy = targetY - startY;
  const dist = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / dist;
  const uy = dy / dist;
  const nx = -uy;
  const ny = ux;

  const SAMPLES = 10;
  const pts: Array<{ cx: number; cy: number; w: number; s: number }> = [];

  for (let i = 0; i <= SAMPLES; i++) {
    const frac = i / SAMPLES;
    const s = startP + frac * (endP - startP);
    const cx = startX + ux * (dist * s);
    const cy = startY + uy * (dist * s);
    const w = 9.0 + s * 24.0;
    pts.push({ cx, cy, w, s });
  }

  ctx.save();

  for (let i = 0; i < SAMPLES; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];

    const midCx = (p0.cx + p1.cx) * 0.5;
    const midCy = (p0.cy + p1.cy) * 0.5;
    const midW = (p0.w + p1.w) * 0.5;
    const midS = (p0.s + p1.s) * 0.5;

    const startFade = Math.min(1.0, Math.max(0, (midS - startP) / 0.12));
    const endFade = Math.min(1.0, Math.max(0, (endP - midS) / 0.12));
    const backFade = midS > 1.0 ? Math.max(0, 1.0 - (midS - 1.0) / 0.52) : 1.0;
    const longFade = startFade * endFade * backFade;
    if (longFade <= 0.01) continue;

    const grad = ctx.createLinearGradient(
      midCx - nx * midW,
      midCy - ny * midW,
      midCx + nx * midW,
      midCy + ny * midW
    );

    const aBase = alpha * longFade * 0.28;
    grad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
    grad.addColorStop(0.20, `rgba(245, 248, 255, ${0.15 * aBase})`);
    grad.addColorStop(0.40, `rgba(255, 255, 255, ${0.35 * aBase})`);
    grad.addColorStop(0.50, `rgba(255, 255, 255, ${0.55 * aBase})`);
    grad.addColorStop(0.60, `rgba(255, 255, 255, ${0.35 * aBase})`);
    grad.addColorStop(0.80, `rgba(245, 248, 255, ${0.15 * aBase})`);
    grad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(p0.cx - nx * p0.w, p0.cy - ny * p0.w);
    ctx.lineTo(p1.cx - nx * p1.w, p1.cy - ny * p1.w);
    ctx.lineTo(p1.cx + nx * p1.w, p1.cy + ny * p1.w);
    ctx.lineTo(p0.cx + nx * p0.w, p0.cy + ny * p0.w);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 💨 얼어붙은 바람 제트 스트림
 * - 은은한 기저 바람 위에 연기 퍼프를 뜨문뜨문(BURST_SPACING 0.15) 배치하여 확실한 빈틈 형성
 * - 눈꽃 대신 순백의 흰색 동그라미 입자 배치
 */
function drawIcyWindStream(
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

  let segStart = startP;
  let segEnd = endP;

  if (layer === "front") {
    segStart = startP;
    segEnd = Math.min(1.02, endP);
  } else {
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

  // 1. 은은한 투명 기저 냉기 바람 (배경이 비쳐보여 연기 사이의 빈 공간을 살림)
  drawStraightIcyCone(ctx, startX, startY, targetX, targetY, segStart, segEnd, alpha * 0.45);

  // 2. 뜨문뜨문 비어있는 연기 퍼프 클러스터 (간격 0.15로 대폭 넓혀 뭉치지 않고 낱개로 비어있게 연출)
  const BURST_SPACING = 0.15;
  const flowAdvance = (flowTime * 0.44) % BURST_SPACING;
  const activeEnd = segEnd;

  for (let k = 0; k < 11; k++) {
    const t = activeEnd - flowAdvance - k * BURST_SPACING;
    if (t < segStart - 0.03 || t > segEnd + 0.02) continue;

    const jiggle = Math.sin(k * 2.9 + flowTime * 2.3) * (2.5 + t * 3.2);
    const px = startX + ux * (dist * t) + nx * jiggle;
    const py = startY + uy * (dist * t) + ny * jiggle;

    // 연기 뭉치 반경: 서로 겹쳐서 벽이 되지 않도록 알맞은 크기(7.5 ~ 17px)
    const r = 7.5 + Math.pow(Math.max(0, t), 0.85) * 15.0;

    let puffAlpha = alpha * 0.75;
    if (t < segStart + 0.06) {
      puffAlpha *= Math.max(0, (t - segStart) / 0.06);
    }
    if (t > segEnd - 0.08) {
      puffAlpha *= Math.max(0, (segEnd - t) / 0.08);
    }

    if (layer === "behind" || t > 0.98) {
      const backDist = Math.max(0, t - 0.98);
      const backFade = Math.max(0, Math.pow(1.0 - Math.min(1.0, backDist / 0.52), 1.25));
      puffAlpha *= backFade;
    }

    // 연기 퍼프
    drawIcyWindPuff(ctx, px, py, r, puffAlpha, layer === "behind" ? "deep" : "mid");
    drawIcyWindPuff(ctx, px, py, r * 0.52, puffAlpha * 0.65, layer === "behind" ? "deep" : "light");

    // 눈꽃 대신 순백의 흰색 동그라미 입자
    const circleR = (k % 2 === 0) ? (2.6 + t * 2.2) : (1.8 + t * 1.6);
    const circleOff = (k % 2 === 0 ? 1 : -1) * (3.5 + (k % 3) * 2.0);
    drawIcyWhiteCircle(
      ctx,
      px + nx * circleOff,
      py + ny * circleOff,
      circleR,
      puffAlpha * 0.95
    );
  }

  // 3. 직선 제트 스트림 외곽 냉기 숨결 가닥
  const WISP_COUNT = 9;
  for (let j = 0; j < WISP_COUNT; j++) {
    const wt = segStart + (j / (WISP_COUNT - 1)) * (segEnd - segStart);
    if (wt < 0.05) continue;

    const sign = j % 2 === 0 ? 1 : -1;
    const halfW = 6.0 + wt * 17.0;
    const wx = startX + ux * (dist * wt) + nx * (sign * halfW);
    const wy = startY + uy * (dist * wt) + ny * (sign * halfW);

    const wispR = 5.5 + wt * 13.0;
    let wispAlpha = alpha * 0.45;
    if (layer === "behind" || wt > 0.98) {
      const backDist = Math.max(0, wt - 0.98);
      const backFade = Math.max(0, 1.0 - Math.min(1.0, backDist / 0.52));
      wispAlpha *= backFade;
    }
    drawIcyWindPuff(ctx, wx, wy, wispR, wispAlpha, "light");
  }

  ctx.restore();
}

/**
 * ❄️ 196: 얼어붙은바람 후방 레이어 렌더러 (drawIcyWindBehindEffect)
 */
export function drawIcyWindBehindEffect(
  targetCtx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  const { ax, ay, tx, ty, step, p, isP, frame } = parseIcyWindArgs(
    attackerPosOrFrame,
    targetPosOrDrawCtx,
    moveStep,
    progress,
    isPlayer
  );

  const mouthX = ax + (isP ? 34 : -34);
  const mouthY = ay - (isP ? 14 : 10);
  const targetCenterY = ty - (isP ? 14 : 10);

  const streamHead = frame?.streamHead ?? 0.0;
  const streamTail = frame?.streamTail ?? 0.0;
  const streamAlpha = frame?.streamAlpha ?? 1.0;

  // 후방 관통 스트림
  if (streamHead > 0.92 && streamAlpha > 0.01) {
    const flowTime = step * 2.0 + p * 4.0;
    drawIcyWindStream(
      targetCtx,
      mouthX,
      mouthY,
      tx,
      targetCenterY,
      streamTail,
      streamHead,
      streamAlpha,
      flowTime,
      "behind"
    );
  }

  // 대상 포켓몬 뒤편 잔여 연기 퍼프 (뜨문뜨문 2개)
  if (step >= 3) {
    const BEHIND_PUFFS = [
      { dx: 16, dy: -10, r: 24, birth: 0.15 },
      { dx: -18, dy: 6, r: 22, birth: 0.40 },
    ];

    for (let i = 0; i < BEHIND_PUFFS.length; i++) {
      const b = BEHIND_PUFFS[i];
      let bAlpha = 0;
      let bScale = 1.0;
      let bRise = 0;

      if (step === 3) {
        if (p < b.birth) continue;
        const g = (p - b.birth) / 0.35;
        bAlpha = Math.min(0.80, g * 0.85);
        bScale = 0.5 + 0.5 * Math.sin(Math.min(1.0, g) * Math.PI * 0.5);
      } else if (step === 4) {
        bAlpha = 0.80;
      } else if (step === 5) {
        bAlpha = Math.max(0, 0.80 * (1.0 - p));
        bScale = 1.0 + p * 0.22;
        bRise = p * 22;
      }

      if (bAlpha > 0.02) {
        drawIcyWindPuff(
          targetCtx,
          tx + b.dx,
          targetCenterY + b.dy - bRise,
          b.r * bScale,
          bAlpha,
          "deep"
        );
      }
    }
  }
}

/**
 * ❄️ 196: 얼어붙은바람 전면 레이어 렌더러 (drawIcyWindEffect)
 */
export function drawIcyWindEffect(
  targetCtx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  const { ax, ay, tx, ty, step, p, isP, frame } = parseIcyWindArgs(
    attackerPosOrFrame,
    targetPosOrDrawCtx,
    moveStep,
    progress,
    isPlayer
  );

  const mouthX = ax + (isP ? 34 : -34);
  const mouthY = ay - (isP ? 14 : 10);
  const targetCenterY = ty - (isP ? 14 : 10);

  // 1단계: 시전자 입가 서리 연무 및 흰색 동그라미 입자
  if (step === 1) {
    const muzzleAlpha = Math.min(0.95, p * 1.6);
    const muzzleR = 12 + p * 15;
    drawIcyWindPuff(targetCtx, mouthX, mouthY, muzzleR, muzzleAlpha, "mid");
    drawIcyWindPuff(targetCtx, mouthX, mouthY, muzzleR * 0.6, muzzleAlpha * 0.85, "light");

    // 눈꽃 대신 흰색 동그라미 입자
    drawIcyWhiteCircle(targetCtx, mouthX - 3, mouthY - 4, 3.2 + p * 1.8, muzzleAlpha);
    drawIcyWhiteCircle(targetCtx, mouthX + 4, mouthY + 3, 2.4 + p * 1.3, muzzleAlpha * 0.85);
  }

  // 2~4단계: 전면 스트림 (기저 콘 + 냉기 퍼프 + 흰색 동그라미)
  const streamHead = frame?.streamHead ?? 0.0;
  const streamTail = frame?.streamTail ?? 0.0;
  const streamAlpha = frame?.streamAlpha ?? 1.0;

  if (streamHead > 0 && streamHead > streamTail && streamAlpha > 0.01) {
    const flowTime = step * 2.0 + p * 4.0;
    drawIcyWindStream(
      targetCtx,
      mouthX,
      mouthY,
      tx,
      targetCenterY,
      streamTail,
      streamHead,
      streamAlpha,
      flowTime,
      "front"
    );
  }

  // 3단계 이상: 대상 포켓몬 전면 연기 퍼프 및 비산하는 흰색 동그라미 (뜨문뜨문 2개)
  if (step >= 3) {
    const FRONT_PUFFS = [
      { dx: -14, dy: 4, r: 22, birth: 0.12 },
      { dx: 12, dy: 8, r: 20, birth: 0.35 },
    ];

    for (let i = 0; i < FRONT_PUFFS.length; i++) {
      const b = FRONT_PUFFS[i];
      let bAlpha = 0;
      let bScale = 1.0;
      let bRise = 0;

      if (step === 3) {
        if (p < b.birth) continue;
        const g = (p - b.birth) / 0.35;
        bAlpha = Math.min(0.78, g * 0.82);
        bScale = 0.5 + 0.5 * Math.sin(Math.min(1.0, g) * Math.PI * 0.5);
      } else if (step === 4) {
        bAlpha = 0.78;
      } else if (step === 5) {
        bAlpha = Math.max(0, 0.78 * (1.0 - p));
        bScale = 1.0 + p * 0.22;
        bRise = p * 22;
      }

      if (bAlpha > 0.02) {
        drawIcyWindPuff(
          targetCtx,
          tx + b.dx,
          targetCenterY + b.dy - bRise,
          b.r * bScale,
          bAlpha,
          "mid"
        );
      }
    }

    // 타격 순간 충격파 링
    if (step === 3 && p <= 0.35) {
      const hitProgress = p / 0.35;
      targetCtx.save();
      targetCtx.globalAlpha = Math.max(0, 1.0 - hitProgress);

      const ringR = 14 + hitProgress * 32;
      targetCtx.strokeStyle = "#FFFFFF";
      targetCtx.lineWidth = Math.max(1, 3.0 * (1.0 - hitProgress));
      targetCtx.beginPath();
      targetCtx.arc(tx, targetCenterY, ringR, 0, Math.PI * 2);
      targetCtx.stroke();
      targetCtx.restore();
    }
  }
}



