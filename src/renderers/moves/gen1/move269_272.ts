// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { getTargetSpriteCenter, drawFakeOutHand } from "./move249_252.js";
import { drawMiniRetroStar } from "../common/helpers.js";
import { drawAngerVeinMark } from "./move205_208.js";
import { drawFittedBattleSprite } from "../../common/spriteLoader.js";

/**
 * 시전자 스프라이트 중심 좌표 산출 헬퍼
 */
export function getCasterSpriteCenter(
  drawCtx: EffectDrawContext,
  frame: BattleFrame
): { x: number; y: number } {
  const isP = drawCtx.isPlayer ?? true;
  const casterBase = isP ? drawCtx.pm : drawCtx.em;
  const casterOffset = isP
    ? (frame.pOffset ?? { x: 0, y: 0 })
    : (frame.eOffset ?? { x: 0, y: 0 });
  return {
    x: casterBase.x + casterOffset.x,
    y: casterBase.y + casterOffset.y,
  };
}

// ============================================================================
// 💢 269: 도발 (Taunt / ちょうはつ) - 악 타입 변화 기술
//
// 위력: — / 명중: 100 / PP: 20 / 대상: 상대 / 접촉: X
// 설명: 상대를 화나게 한다. 3턴 동안 상대는 공격 기술밖에 쓸 수 없게 된다.
//
// [연출 시퀀스]:
// 1. [Step 1: 시전자 도발 제스처]:
//    - 시전 포켓몬이 앞으로 까딱까딱 두 번 기울이며 도발 모션 수행
// 2. [Step 2: 대상 포켓몬 분노 폭발 (뽐내기 Step 2 동일 이펙트)]:
//    - 대상 포켓몬이 붉게 달아오르며 좌우 진동 + 이마 옆 만화풍 빠직 핏줄(💢) 팝업 & 박동
// ============================================================================

/**
 * 도발 배후 연출
 */
export function drawTauntBehindEffect(
  _targetCtx: any,
  _frame: BattleFrame,
  _drawCtx: EffectDrawContext
) {
  // 배후 이펙트 없음 (깔끔한 모션 및 핏줄 연출 집중)
}

/**
 * 도발 전면 연출
 */
export function drawTauntEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const isPlayer = drawCtx.isPlayer ?? true;
  const isHit = drawCtx.isHit ?? true;
  const moveStep = frame.moveStep ?? 1;

  const targetPos = drawCtx.targetPos || { x: 380, y: 130 };
  const targetHeadX = targetPos.x + (isPlayer ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const targetHeadY = targetPos.y + (isPlayer ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0)) - (isPlayer ? 30 : 38);

  // [Step 2: 뽐내기(Swagger) 피격과 동일한 분노의 핏줄(💢) 팝업 & 박동]
  if (moveStep === 2 && isHit && frame.swaggerVein) {
    const baseSize = isPlayer ? 16 : 14;
    const v = frame.swaggerVein;
    const vx = targetHeadX + (isPlayer ? -22 : 22);
    const vy = targetHeadY - 12;
    const rot = isPlayer ? -0.16 : 0.16;

    drawAngerVeinMark(
      targetCtx,
      vx,
      vy,
      baseSize * (v.scale ?? 1.0),
      v.alpha ?? 1.0,
      v.popProgress ?? 1.0,
      rot
    );
  }
}

// ============================================================================
// 🤝 270: 도우미 (Helping Hand / てだすけ) - 노말 타입 변화 기술
//
// 위력: — / 명중: — / PP: 20 / 우선도: +5 / 대상: 아군 / 접촉: X
// 설명: 동료를 돕는다. 사용하면 동료(또는 자신)가 쓰는 기술의 위력이 1.5배가 된다.
//
// [연출 시퀀스]:
// 1. [Step 1: 90도 직립 태권당수 손(속이기 손) 박수 맞닿음]:
//    - 양쪽에서 90도로 세운 태권당수 손바닥(drawFakeOutHand)이 중앙으로 모여 맞닿음
// 2. [Step 2: 내부 투명 그라데이션 단일 링 폭발 & 응원 별빛/화살표]:
//    - 맞닿는 순간 안쪽이 투명한 그라데이션 단일 황금 링이 팽창
//    - 사방 360도로 터져 나가는 4각 반짝이 별과 위력 강화 화살표 3개
// 3. [Step 3: 축복 잔광 및 안정화]:
//    - 대상을 감싸는 은은한 황금빛 글리터 파티클이 위로 피어오르며 완착
// ============================================================================

/**
 * 도우미 배후 연출 (단일 링 집중을 위해 배후 링 제거)
 */
export function drawHelpingHandBehindEffect(
  _targetCtx: any,
  _frame: BattleFrame,
  _drawCtx: EffectDrawContext
) {
  // 전면 단일 내부 투명 그라데이션 링에만 집중
}

/**
 * 도우미 전면 연출
 */
export function drawHelpingHandEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const isP = drawCtx.isPlayer ?? true;
  const dir = isP ? 1 : -1;
  const center = isP ? drawCtx.pm : drawCtx.em;
  // 시전 포켓몬 머리 위쪽 좌표
  const cx = center.x;
  const cy = center.y - (isP ? 74 : 64);

  // --------------------------------------------------------------------------
  // [Step 1: 시전 포켓몬 위에 손이 나타나고, 주변에서 다른 손이 나타나 하이파이브]
  // --------------------------------------------------------------------------
  if (step === 1) {
    // 1) 시전 포켓몬 위에 먼저 나타나는 90도 직립 손 (하이파이브 전까지 서서히 페이드인)
    const baseHandAlpha = Math.min(1.0, 0.15 + prog * 0.85);
    const baseHandX = cx - dir * 6;
    drawFakeOutHand(targetCtx, baseHandX, cy, isP, baseHandAlpha, 0.92);

    // 2) 주변(옆쪽)에서 나타나 시전자 위의 손을 향해 날아와 하이파이브하는 다른 손 (하이파이브 직전까지 페이드인)
    if (prog >= 0.18) {
      const moveProg = (prog - 0.18) / 0.82; // 0.0 -> 1.0
      const easeIn = Math.pow(moveProg, 1.8);
      const startOffset = 58;
      const endOffset = 6;
      const curOffset = startOffset * (1.0 - easeIn) + endOffset * easeIn;
      const incomingX = cx + dir * curOffset;
      const incomingY = cy - (1.0 - easeIn) * 8;
      const incomingAlpha = Math.min(1.0, 0.10 + moveProg * 0.90);

      // 하이파이브 접근 잔상
      if (curOffset > 14) {
        const trailX = cx + dir * (curOffset + 10);
        drawFakeOutHand(targetCtx, trailX, incomingY - 2, !isP, incomingAlpha * 0.25, 0.92);
      }

      drawFakeOutHand(targetCtx, incomingX, incomingY, !isP, incomingAlpha, 0.92);
    }
  }

  // --------------------------------------------------------------------------
  // [Step 2: 하이파이브 맞닿음 & 선 내부 투명 그라데이션 단일 링 폭발]
  // --------------------------------------------------------------------------
  if (step === 2) {
    // 1. 하이파이브 직후 맞닿은 두 손의 미세 반동 및 페이드아웃 (초반 유지)
    if (prog < 0.45) {
      const handAlpha = Math.max(0, 1.0 - prog / 0.45);
      const recoil = Math.min(1.0, prog * 2.5);
      drawFakeOutHand(targetCtx, cx - dir * (6 + recoil * 4), cy, isP, handAlpha, 0.92);
      drawFakeOutHand(targetCtx, cx + dir * (6 + recoil * 12), cy, !isP, handAlpha, 0.92);
    }

    const burstAlpha = Math.max(0, 1.0 - prog * 0.9);

    targetCtx.save();
    targetCtx.translate(cx, cy);

    // 2. 팽창하는 단일 골든 링 (선 내부 투명 그라데이션)
    const outerR = 12 + prog * 56;
    const ringGrad = targetCtx.createRadialGradient(0, 0, 0, 0, 0, outerR);
    ringGrad.addColorStop(0.00, "rgba(254, 240, 138, 0.0)");
    ringGrad.addColorStop(0.58, "rgba(254, 240, 138, 0.0)"); // 내부 완전 투명
    ringGrad.addColorStop(0.76, `rgba(253, 224, 71, ${(burstAlpha * 0.35).toFixed(3)})`);
    ringGrad.addColorStop(0.90, `rgba(253, 224, 71, ${(burstAlpha * 0.82).toFixed(3)})`);
    ringGrad.addColorStop(0.97, `rgba(254, 240, 138, ${(burstAlpha * 0.98).toFixed(3)})`);
    ringGrad.addColorStop(1.00, `rgba(245, 158, 11, ${(burstAlpha * 0.95).toFixed(3)})`);

    targetCtx.fillStyle = ringGrad;
    targetCtx.beginPath();
    targetCtx.arc(0, 0, outerR, 0, Math.PI * 2);
    targetCtx.fill();

    // 외곽선 마감 (바깥쪽 경계만 선명하게)
    targetCtx.strokeStyle = `rgba(254, 249, 195, ${(burstAlpha * 0.9).toFixed(3)})`;
    targetCtx.lineWidth = 1.4;
    targetCtx.beginPath();
    targetCtx.arc(0, 0, outerR, 0, Math.PI * 2);
    targetCtx.stroke();

    // 3. 8방향 응원 별빛 버스트
    const starCount = 8;
    for (let i = 0; i < starCount; i++) {
      const angle = (i / starCount) * Math.PI * 2 + prog * 0.6;
      const dist = 14 + prog * 44;
      const sx = Math.cos(angle) * dist;
      const sy = Math.sin(angle) * dist;
      const sScale = Math.max(0.4, (1.0 - prog * 0.8) * 1.3);

      drawMiniRetroStar(
        targetCtx,
        sx,
        sy,
        sScale * 8,
        `rgba(253, 224, 71, ${burstAlpha})`
      );
    }

    targetCtx.restore();
  }

  // --------------------------------------------------------------------------
  // [Step 3: 축복 잔광 (Floating Golden Sparks)]
  // --------------------------------------------------------------------------
  if (step === 3) {
    const fadeAlpha = Math.max(0, 1.0 - prog);
    targetCtx.save();

    for (let s = 0; s < 7; s++) {
      const px = cx + (s - 3) * 12 + Math.sin(s * 2.3 + prog * 3) * 6;
      const py = cy - prog * 28 - s * 4;
      const pr = Math.max(1, 2.6 * (1 - prog * 0.6));

      targetCtx.fillStyle = `rgba(253, 224, 71, ${fadeAlpha * 0.85})`;
      targetCtx.beginPath();
      targetCtx.arc(px, py, pr, 0, Math.PI * 2);
      targetCtx.fill();
    }

    targetCtx.restore();
  }
}

// ============================================================================
// 🥛 271: 트릭 (Trick / トリック) - 에스퍼 타입 변화 기술
//
// 위력: — / 명중: 100 / PP: 10 / 대상: 상대 / 접촉: X
// 설명: 틈을 노려 자신과 상대가 지닌 도구를 서로 맞바꾼다.
//
// [연출 시퀀스 - 본가 스타일 야바위 컵(Shell Game Cups) 연출]:
// 1. [Step 1: 양쪽 포켓몬 위로 컵 하강 & 덮기]:
//    - 시전자와 상대 포켓몬 머리 위에서 심플한 하얀색/은색 컵이 내려와 두 포켓몬을 덮음
//    - 발판에 '탁!' 착지하며 탄성 스쿼시 및 바닥 충격 링 발생
// 2. [Step 2: 야바위 셔플 (3회 고속 교차 자리바꿈)]:
//    - 두 컵이 아군 발판과 적군 발판 사이를 타원 궤도로 3회 연속 빠르게 교차 이동
//    - 3D 원근 스케일 보간, 전후방 Z-정렬 및 은빛 잔상 연출
// 3. [Step 3: 컵 들어올리기 & 포켓몬 재등장]:
//    - 두 컵이 동시에 위로 들려 올라가며 사르르 소멸하고 양쪽 포켓몬이 재등장
//    - 도구 교환 완료를 뜻하는 반짝이 스타 스파클 연출
// ============================================================================

/**
 * 트릭 배후 연출 (전면 컵 및 바닥 그림자 연출에 집중)
 */
export function drawTrickBehindEffect(
  _targetCtx: any,
  _frame: BattleFrame,
  _drawCtx: EffectDrawContext
) {
  // 컵이 포켓몬을 위에서 덮어야 하므로 전면(drawTrickEffect)에서 그림자와 컵을 일괄 렌더링
}

/**
 * 거꾸로 덮인 심플한 하얀색/은색 컵(Upside-down White/Silver Cup) 그리기 헬퍼
 * - 기준점 (x, groundY - liftY): 컵 하단 입구(Rim)의 중심 좌표
 */
function drawSimpleWhiteSilverCup(
  ctx: any,
  x: number,
  groundY: number,
  liftY: number,
  baseScale: number,
  squashX: number,
  squashY: number,
  rot: number,
  alpha: number,
  drawShadow: boolean = true
) {
  if (alpha <= 0.01) return;

  const botR = 46; // 하단 입구 반경 (폭 92px)
  const topR = 30; // 상단 바닥면 반경 (폭 60px)
  const cupH = 88; // 컵 높이
  const botRy = 11; // 하단 입구 타원 세로 반경
  const topRy = 8; // 상단 면 타원 세로 반경

  // 1. 발판 바닥 그림자 (컵이 공중에 떠 있을수록 약간 작고 옅어짐)
  if (drawShadow) {
    const heightRatio = Math.max(0, Math.min(1, liftY / 130));
    const shadowScale = baseScale * squashX * (1.0 - heightRatio * 0.35);
    const shadowAlpha = alpha * (0.42 - heightRatio * 0.26);
    if (shadowAlpha > 0.01) {
      ctx.save();
      ctx.translate(x, groundY + 2);
      ctx.scale(shadowScale, shadowScale);
      ctx.fillStyle = `rgba(15, 23, 42, ${shadowAlpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, botR + 5, botRy + 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 2. 컵 본체
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.translate(x, groundY - liftY);
  if (rot !== 0) {
    ctx.translate(0, -cupH * 0.45 * baseScale);
    ctx.rotate(rot);
    ctx.translate(0, cupH * 0.45 * baseScale);
  }
  ctx.scale(baseScale * squashX, baseScale * squashY);

  // 2-1. 컵이 들려 있을 때 살짝 보이는 하단 입구 내부 음영
  if (liftY > 2) {
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.ellipse(0, 0, botR, botRy, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2-2. 컵 원뿔대 몸통 (하얀색 ~ 밝은 은색 3D 원통형 그라데이션)
  const bodyGrad = ctx.createLinearGradient(-botR, 0, botR, 0);
  bodyGrad.addColorStop(0.00, "#CBD5E1"); // 좌측 끝 반사광/음영
  bodyGrad.addColorStop(0.18, "#F8FAFC"); // 좌측 밝은 면
  bodyGrad.addColorStop(0.32, "#FFFFFF"); // 정면 좌측 순백 하이라이트
  bodyGrad.addColorStop(0.58, "#F1F5F9"); // 중앙 미색 화이트
  bodyGrad.addColorStop(0.82, "#CBD5E1"); // 우측 실버 음영
  bodyGrad.addColorStop(1.00, "#94A3B8"); // 우측 끝 메탈릭 실버 쉐도우

  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(-topR, -cupH);
  ctx.lineTo(-botR, 0);
  ctx.ellipse(0, 0, botR, botRy, 0, Math.PI, 0, true);
  ctx.lineTo(topR, -cupH);
  ctx.closePath();
  ctx.fill();

  // 2-3. 좌측 전면 순백 광택 스트립 (입체감 강조)
  ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
  ctx.beginPath();
  ctx.moveTo(-topR * 0.48, -cupH + 4);
  ctx.lineTo(-topR * 0.24, -cupH + 4);
  ctx.lineTo(-botR * 0.26, -4);
  ctx.lineTo(-botR * 0.50, -4);
  ctx.closePath();
  ctx.fill();

  // 2-4. 심플한 은색 가로 홈 라인 1줄 (상단부 포인트)
  const bandT = 0.25; // 위에서 25% 지점
  const bandY = -cupH * (1 - bandT);
  const bandRx = topR + (botR - topR) * bandT;
  const bandRy = topRy + (botRy - topRy) * bandT;
  ctx.strokeStyle = "rgba(148, 163, 184, 0.75)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, bandY, bandRx, bandRy, 0, 0.08 * Math.PI, 0.92 * Math.PI, false);
  ctx.stroke();

  // 2-5. 하단 입구 두꺼운 테두리 립(Rim Lip)
  const rimGrad = ctx.createLinearGradient(-botR - 2, 0, botR + 2, 0);
  rimGrad.addColorStop(0.00, "#94A3B8");
  rimGrad.addColorStop(0.28, "#FFFFFF");
  rimGrad.addColorStop(0.65, "#E2E8F0");
  rimGrad.addColorStop(1.00, "#64748B");

  ctx.strokeStyle = rimGrad;
  ctx.lineWidth = 4.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.ellipse(0, 0, botR, botRy, 0, 0, Math.PI, false);
  ctx.stroke();

  // 2-6. 컵 몸통 외곽선 마감 (어두운 슬레이트 실버)
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 2.0;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(-topR, -cupH);
  ctx.lineTo(-botR, 0);
  ctx.ellipse(0, 0, botR, botRy, 0, Math.PI, 0, true);
  ctx.lineTo(topR, -cupH);
  ctx.stroke();

  // 2-7. 위쪽을 향한 컵 바닥면 (Top Closed Base)
  const topGrad = ctx.createLinearGradient(-topR, -cupH - topRy, topR, -cupH + topRy);
  topGrad.addColorStop(0.0, "#FFFFFF");
  topGrad.addColorStop(0.6, "#E2E8F0");
  topGrad.addColorStop(1.0, "#CBD5E1");

  ctx.fillStyle = topGrad;
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.ellipse(0, -cupH, topR, topRy, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 컵 바닥면 안쪽 오목한 링 디테일
  ctx.strokeStyle = "#94A3B8";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, -cupH, topR * 0.76, topRy * 0.72, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * 트릭 전면 연출
 */
export function drawTrickEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;

  // 아군(전경) 및 적군(원경) 발판 위 컵 착지 기준 좌표와 원근 스케일
  const pAnchor = {
    x: drawCtx.pm.x,
    y: drawCtx.pm.y - 8,
    scale: 1.08,
  };
  const eAnchor = {
    x: drawCtx.em.x,
    y: drawCtx.em.y - 2,
    scale: 0.84,
  };

  // --------------------------------------------------------------------------
  // [Step 1: 양쪽 포켓몬 위로 하얀색/은색 컵 하강 & 덮기]
  // --------------------------------------------------------------------------
  if (step === 1) {
    const dropEndProg = 0.60;
    let liftY = 0;
    let alpha = 1.0;
    let squashX = 1.0;
    let squashY = 1.0;

    if (prog < dropEndProg) {
      // 상공에서 빠르게 내려와 포켓몬을 덮음
      const u = prog / dropEndProg;
      const easeIn = u * u;
      liftY = (1.0 - easeIn) * 125;
      alpha = Math.min(1.0, 0.25 + u * 0.90);
      squashX = 0.96 + easeIn * 0.04;
      squashY = 1.05 - easeIn * 0.05;
    } else {
      // 발판 착지 순간 '탁!' 스쿼시 탄성 및 안정화
      const landU = (prog - dropEndProg) / (1.0 - dropEndProg);
      const bounce = Math.sin(landU * Math.PI * 1.6) * Math.exp(-landU * 2.8);
      squashX = 1.0 + bounce * 0.14;
      squashY = 1.0 - bounce * 0.14;
    }

    // 원경(적군) 컵 먼저 그린 후 전경(아군) 컵 렌더링
    drawSimpleWhiteSilverCup(
      targetCtx,
      eAnchor.x,
      eAnchor.y,
      liftY * 0.85,
      eAnchor.scale,
      squashX,
      squashY,
      0,
      alpha
    );
    drawSimpleWhiteSilverCup(
      targetCtx,
      pAnchor.x,
      pAnchor.y,
      liftY,
      pAnchor.scale,
      squashX,
      squashY,
      0,
      alpha
    );

    // 착지 충격 링 (prog >= 0.60)
    if (prog >= dropEndProg) {
      const ringU = (prog - dropEndProg) / (1.0 - dropEndProg);
      const ringAlpha = Math.max(0, (1.0 - ringU) * 0.65);

      const drawLandingRing = (cx: number, cy: number, s: number) => {
        targetCtx.save();
        targetCtx.translate(cx, cy);
        targetCtx.scale(s, s * 0.26);
        targetCtx.strokeStyle = `rgba(241, 245, 249, ${ringAlpha.toFixed(3)})`;
        targetCtx.lineWidth = 2.5 * (1.0 - ringU * 0.5);
        targetCtx.beginPath();
        targetCtx.arc(0, 0, 48 + ringU * 24, 0, Math.PI * 2);
        targetCtx.stroke();
        targetCtx.restore();
      };

      drawLandingRing(eAnchor.x, eAnchor.y, eAnchor.scale);
      drawLandingRing(pAnchor.x, pAnchor.y, pAnchor.scale);
    }
  }

  // --------------------------------------------------------------------------
  // [Step 2: 야바위 셔플 - 두 컵의 3회 고속 교차 자리바꿈]
  // --------------------------------------------------------------------------
  if (step === 2) {
    const swapCount = 3; // 총 3번 교차하여 최종적으로 서로 반대편에 안착
    const scaled = Math.min(swapCount - 0.0001, Math.max(0, prog * swapCount));
    const swapIdx = Math.floor(scaled);
    const localU = scaled - swapIdx;

    // 특정 시점(u)에서 두 컵의 위치·스케일·기울기를 계산하는 헬퍼
    const computeCupStates = (sIdx: number, u: number) => {
      const clampedU = Math.max(0, Math.min(1, u));
      // 부드러우면서 경쾌한 S-커브 보간
      const t = 0.5 - 0.5 * Math.cos(clampedU * Math.PI);
      const sinArc = Math.sin(clampedU * Math.PI);

      // 짝수 스왑(0, 2): Cup A는 P -> E, Cup B는 E -> P
      // 홀수 스왑(1):    Cup A는 E -> P, Cup B는 P -> E
      const aFrom = sIdx % 2 === 0 ? pAnchor : eAnchor;
      const aTo = sIdx % 2 === 0 ? eAnchor : pAnchor;
      const bFrom = sIdx % 2 === 0 ? eAnchor : pAnchor;
      const bTo = sIdx % 2 === 0 ? pAnchor : eAnchor;

      // 타원 교차 궤도 오프셋 (하나는 아래/전경 호, 다른 하나는 위/배경 호)
      const arcSignA = sIdx % 2 === 0 ? 1 : -1;
      const arcSignB = -arcSignA;

      const perpX = 28;
      const perpY = 44;

      const ax = aFrom.x + (aTo.x - aFrom.x) * t + sinArc * perpX * arcSignA;
      const ay = aFrom.y + (aTo.y - aFrom.y) * t + sinArc * perpY * arcSignA;
      const aScale = aFrom.scale + (aTo.scale - aFrom.scale) * t + sinArc * 0.06 * arcSignA;
      const aLift = sinArc * 10;
      const aRot = sinArc * (aTo.x > aFrom.x ? 0.13 : -0.13);

      const bx = bFrom.x + (bTo.x - bFrom.x) * t + sinArc * perpX * arcSignB;
      const by = bFrom.y + (bTo.y - bFrom.y) * t + sinArc * perpY * arcSignB;
      const bScale = bFrom.scale + (bTo.scale - bFrom.scale) * t + sinArc * 0.06 * arcSignB;
      const bLift = sinArc * 10;
      const bRot = sinArc * (bTo.x > bFrom.x ? 0.13 : -0.13);

      // 스왑 끝부분 착지 순간 미세 스쿼시
      const edgeImpact = Math.pow(Math.cos(clampedU * Math.PI), 4) * 0.04;
      const sx = 1.0 + edgeImpact;
      const sy = 1.0 - edgeImpact;

      return [
        { x: ax, y: ay, lift: aLift, scale: aScale, sx, sy, rot: aRot },
        { x: bx, y: by, lift: bLift, scale: bScale, sx, sy, rot: bRot },
      ];
    };

    // 1. 모션 잔상 (Afterimages)
    for (let g = 2; g >= 1; g--) {
      const ghostU = localU - g * 0.11;
      if (ghostU <= 0.02) continue;
      const ghostCups = computeCupStates(swapIdx, ghostU);
      ghostCups.sort((a, b) => a.y - b.y);
      const ghostAlpha = g === 1 ? 0.24 : 0.12;
      for (const c of ghostCups) {
        drawSimpleWhiteSilverCup(
          targetCtx,
          c.x,
          c.y,
          c.lift,
          c.scale,
          c.sx,
          c.sy,
          c.rot,
          ghostAlpha,
          false
        );
      }
    }

    // 2. 메인 컵 2개 (Y좌표 기준 Z-Order 정렬: 아래쪽/전경 컵이 항상 위에 그려짐)
    const activeCups = computeCupStates(swapIdx, localU);
    activeCups.sort((a, b) => a.y - b.y);
    for (const c of activeCups) {
      drawSimpleWhiteSilverCup(
        targetCtx,
        c.x,
        c.y,
        c.lift,
        c.scale,
        c.sx,
        c.sy,
        c.rot,
        1.0,
        true
      );
    }
  }

  // --------------------------------------------------------------------------
  // [Step 3: 컵 들어올리기 & 포켓몬 재등장 + 교환 완료 스파클]
  // --------------------------------------------------------------------------
  if (step === 3) {
    const liftEase = Math.pow(prog, 1.35);
    const liftY = liftEase * 125;
    const cupAlpha = Math.max(0, 1.0 - Math.max(0, (prog - 0.18) / 0.82));
    const stretchX = 1.0 - Math.sin(prog * Math.PI) * 0.06;
    const stretchY = 1.0 + Math.sin(prog * Math.PI) * 0.08;

    // 1. 위로 들려 올라가며 사라지는 두 컵
    drawSimpleWhiteSilverCup(
      targetCtx,
      eAnchor.x,
      eAnchor.y,
      liftY * 0.85,
      eAnchor.scale,
      stretchX,
      stretchY,
      0,
      cupAlpha
    );
    drawSimpleWhiteSilverCup(
      targetCtx,
      pAnchor.x,
      pAnchor.y,
      liftY,
      pAnchor.scale,
      stretchX,
      stretchY,
      0,
      cupAlpha
    );

    // 2. 컵이 열린 자리에서 반짝이는 도구 교환 스파클 (✦)
    if (prog >= 0.12) {
      const spProg = (prog - 0.12) / 0.88;
      const spAlpha = Math.sin(spProg * Math.PI);

      const drawRevealSparkles = (cx: number, cy: number, s: number) => {
        targetCtx.save();
        targetCtx.translate(cx, cy);
        const starOffsets = [
          { dx: -34 * s, dy: -48 * s, size: 10 * s, color: `rgba(255, 255, 255, ${spAlpha})` },
          { dx: 36 * s, dy: -42 * s, size: 9 * s, color: `rgba(253, 224, 71, ${spAlpha})` },
          { dx: -26 * s, dy: -16 * s, size: 8 * s, color: `rgba(253, 224, 71, ${spAlpha * 0.9})` },
          { dx: 30 * s, dy: -14 * s, size: 9 * s, color: `rgba(255, 255, 255, ${spAlpha * 0.95})` },
        ];
        for (let i = 0; i < starOffsets.length; i++) {
          const st = starOffsets[i];
          const floatY = -spProg * 14;
          drawMiniRetroStar(
            targetCtx,
            st.dx,
            st.dy + floatY,
            st.size * (0.7 + 0.4 * Math.sin(spProg * Math.PI + i)),
            st.color
          );
        }
        targetCtx.restore();
      };

      drawRevealSparkles(eAnchor.x, eAnchor.y - 10, eAnchor.scale);
      drawRevealSparkles(pAnchor.x, pAnchor.y - 14, pAnchor.scale);
    }
  }
}

// ============================================================================
// 👥 272: 역할놀이 (Role Play / なりきり) - 에스퍼 타입 변화 기술
//
// 위력: — / 명중: — / PP: 10 / 대상: 상대 / 접촉: X
// 설명: 상대의 행동을 모방하여 자신도 상대와 같은 특성으로 변화한다.
//
// [연출 시퀀스 - 본가(3~5세대) 스타일 상대 포켓몬 분신 투영 & 확대·수축 동화 연출]:
// 1. [Step 1: 전장 암전 & 시전자 모방 도약 + 상대 포켓몬 반투명 분신(실루엣) 분리]:
//    - 전장이 은은하게 암전되며 시전자가 가볍게 점프해 상대를 모방하는 포즈를 취함
//    - 상대 포켓몬에게서 하얀/하늘빛 실루엣 파동과 함께 반투명 분신(클론)이 스르륵 떠오름
// 2. [Step 2: 상대 포켓몬 반투명 분신의 시전자 방향 슬라이드 이동 & 중첩]:
//    - 상대에게서 분리된 반투명 분신이 잔상을 남기며 시전자 위치로 미끄러지듯 고속 이동해 시전자 몸 위에 포개짐
// 3. [Step 3: 시전자 위에서 상대 분신 확대·수축 흡수 (TransparentCloneGrowAndShrink) & 동기화 섬광]:
//    - 본가 특유의 연출처럼 시전자 위에 겹쳐진 상대의 반투명 분신이 크게 팽창(1.28x)했다가
//      시전자 몸속으로 빠르게 수축·흡수되며 백색 섬광과 스타 스파클이 반짝이고 원래 모습으로 안착
// ============================================================================

/**
 * 역할놀이 배후 연출 (본가 스타일 암전 배경 및 발판 동화 링)
 */
export function drawRolePlayBehindEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const isP = drawCtx.isPlayer ?? true;
  const casterBase = isP ? drawCtx.pm : drawCtx.em;
  const targetBase = isP ? drawCtx.em : drawCtx.pm;

  // Step 1: 상대 발판 아래에서 피어오르는 분신 추출 파문
  if (step === 1) {
    const ringAlpha = Math.sin(prog * Math.PI) * 0.55;
    if (ringAlpha > 0.01) {
      targetCtx.save();
      targetCtx.translate(targetBase.x, targetBase.y - 4);
      targetCtx.scale(1.0, 0.34);
      targetCtx.strokeStyle = `rgba(186, 230, 253, ${ringAlpha.toFixed(3)})`;
      targetCtx.lineWidth = 2.4;
      targetCtx.beginPath();
      targetCtx.arc(0, 0, 28 + prog * 26, 0, Math.PI * 2);
      targetCtx.stroke();
      targetCtx.restore();
    }
  }

  // Step 3: 시전자 발판 아래에서 퍼져나가는 특성 동화 완료 파문
  if (step === 3) {
    const ringAlpha = Math.max(0, (1.0 - prog) * 0.65);
    if (ringAlpha > 0.01) {
      targetCtx.save();
      targetCtx.translate(casterBase.x, casterBase.y - 4);
      targetCtx.scale(1.0, 0.34);
      targetCtx.strokeStyle = `rgba(224, 242, 254, ${ringAlpha.toFixed(3)})`;
      targetCtx.lineWidth = 2.8 * (1.0 - prog * 0.5);
      targetCtx.beginPath();
      targetCtx.arc(0, 0, 24 + prog * 46, 0, Math.PI * 2);
      targetCtx.stroke();
      targetCtx.restore();
    }
  }
}

/**
 * 상대 포켓몬의 반투명 분신(클론/실루엣) 렌더링 헬퍼
 * - 기준점 (x, groundY): 스프라이트 하단 접지 중심 좌표
 */
function drawRolePlayTargetClone(
  ctx: any,
  sprite: any,
  x: number,
  groundY: number,
  baseSize: number,
  scaleX: number,
  scaleY: number,
  alpha: number,
  whiteMix: number = 0,
  tintColor: string | null = "rgba(186, 230, 253, 0.38)",
  waveAmp: number = 0
) {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scaleX, scaleY);

  if (sprite && sprite.width && sprite.height) {
    // 1. 반투명 분신 본체 (밝은 에스퍼/시안 림 글로우)
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.filter = "brightness(1.18) saturate(1.15) drop-shadow(0px 0px 5px rgba(186, 230, 253, 0.80))";
    const wave = waveAmp > 0.05 ? { amp: waveAmp, freq: Math.PI * 3.5, phase: groundY * 0.1 } : undefined;
    drawFittedBattleSprite(ctx, sprite, 0, 0, baseSize, tintColor, undefined, wave);
    ctx.restore();

    // 2. 순백 실루엣 하이라이트 오버레이 (분리 직후 및 흡수 직전 실루엣 강조)
    if (whiteMix > 0.02) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha * whiteMix));
      ctx.filter = "brightness(0) invert(1)";
      drawFittedBattleSprite(ctx, sprite, 0, 0, baseSize, null, undefined, undefined);
      ctx.restore();
    }
  } else {
    // Mock 테스트 환경 등 스프라이트 이미지가 없을 때의 안전한 폴백 실루엣
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillStyle = `rgba(186, 230, 253, ${(alpha * 0.7).toFixed(3)})`;
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(0, -baseSize * 0.35, baseSize * 0.26, baseSize * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 역할놀이 전면 연출 (본가 스타일 상대 포켓몬 분신 투영 ➔ 슬라이드 이동 ➔ 확대·수축 동화)
 */
export function drawRolePlayEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const isP = drawCtx.isPlayer ?? true;

  const casterBase = isP ? drawCtx.pm : drawCtx.em;
  const targetBase = isP ? drawCtx.em : drawCtx.pm;
  const casterSize = casterBase.size || (isP ? 140 : 110);
  const targetSize = targetBase.size || (isP ? 110 : 140);

  // 복사할 대상(상대 포켓몬)의 스프라이트
  const targetSprite = isP ? drawCtx.enemySprite : drawCtx.playerSprite;

  // 시전자 방향 단위 벡터
  const dirToCasterX = casterBase.x >= targetBase.x ? 1 : -1;

  // --------------------------------------------------------------------------
  // [Step 1: 상대 포켓몬에게서 반투명 분신(실루엣) 분리 및 부유]
  // --------------------------------------------------------------------------
  if (step === 1) {
    // 초반(0~0.35): 상대 본체 위에서 순백 실루엣으로 번쩍이며 생성
    // 중후반(0.35~1.0): 상대 본체에서 시전자 쪽으로 살짝 빠져나오며 반투명 분신 형태 확립
    const appearAlpha = Math.min(0.78, prog * 1.15);
    const whiteFlash = Math.max(0, 1.0 - prog * 1.4) * 0.75;
    const slideOutT = Math.pow(prog, 1.3);
    const cloneX = targetBase.x + dirToCasterX * slideOutT * 18;
    const cloneY = targetBase.y - Math.sin(prog * Math.PI * 0.85) * 10;
    const scalePop = 1.0 + Math.sin(prog * Math.PI) * 0.08;
    const waveAmp = (1.0 - prog) * 3.2;

    drawRolePlayTargetClone(
      targetCtx,
      targetSprite,
      cloneX,
      cloneY,
      targetSize,
      scalePop,
      scalePop,
      appearAlpha,
      whiteFlash,
      "rgba(186, 230, 253, 0.36)",
      waveAmp
    );
  }

  // --------------------------------------------------------------------------
  // [Step 2: 상대 포켓몬의 반투명 분신이 시전자 위치로 미끄러지듯 이동해 겹쳐짐]
  // --------------------------------------------------------------------------
  if (step === 2) {
    const startX = targetBase.x + dirToCasterX * 18;
    const startY = targetBase.y - 5;
    const endX = casterBase.x;
    const endY = casterBase.y;

    // 부드러운 S-커브 가감속 보간 + 살짝 띄운 포물선 궤도
    const computeSlideState = (u: number) => {
      const clamped = Math.max(0, Math.min(1, u));
      const ease = 0.5 - 0.5 * Math.cos(clamped * Math.PI);
      const arcLift = Math.sin(clamped * Math.PI) * 22;
      const x = startX + (endX - startX) * ease;
      const y = startY + (endY - startY) * ease - arcLift;
      const size = targetSize + (casterSize - targetSize) * ease;
      // 이동 중 속도감 있는 스트레치
      const stretchX = 1.0 + Math.sin(clamped * Math.PI) * 0.08;
      const stretchY = 1.0 - Math.sin(clamped * Math.PI) * 0.05;
      return { x, y, size, stretchX, stretchY };
    };

    // 1. 이동 궤적 반투명 잔상 (2겹)
    for (let g = 2; g >= 1; g--) {
      const ghostU = prog - g * 0.12;
      if (ghostU <= 0.02) continue;
      const gs = computeSlideState(ghostU);
      const ghostAlpha = g === 1 ? 0.28 : 0.14;
      drawRolePlayTargetClone(
        targetCtx,
        targetSprite,
        gs.x,
        gs.y,
        gs.size,
        gs.stretchX,
        gs.stretchY,
        ghostAlpha,
        0.15,
        "rgba(125, 211, 252, 0.45)",
        0
      );
    }

    // 2. 메인 반투명 분신
    const cur = computeSlideState(prog);
    const arrivalFlash = prog > 0.75 ? ((prog - 0.75) / 0.25) * 0.45 : 0;
    drawRolePlayTargetClone(
      targetCtx,
      targetSprite,
      cur.x,
      cur.y,
      cur.size,
      cur.stretchX,
      cur.stretchY,
      0.76,
      arrivalFlash,
      "rgba(186, 230, 253, 0.34)",
      0
    );
  }

  // --------------------------------------------------------------------------
  // [Step 3: 시전자 위에서 상대 분신 확대·수축 동화 (Grow & Shrink) 및 흡수 스파클]
  // --------------------------------------------------------------------------
  if (step === 3) {
    // 본가 AnimTask_TransparentCloneGrowAndShrink 구현:
    // prog 0.0 ~ 0.45: 시전자 위에서 1.0x -> 1.28x로 팽창하며 밝아짐
    // prog 0.45 ~ 0.90: 1.28x -> 0.88x로 시전자 몸속으로 빠르게 수축·흡수되며 페이드아웃
    if (prog < 0.92) {
      let cloneScale = 1.0;
      let cloneAlpha = 0.75;
      let whiteMix = 0.3;

      if (prog < 0.45) {
        const u = prog / 0.45;
        const easeOut = Math.sin(u * (Math.PI / 2));
        cloneScale = 1.0 + easeOut * 0.28; // 1.00 -> 1.28
        cloneAlpha = 0.76 - easeOut * 0.10; // 0.76 -> 0.66
        whiteMix = 0.35 + easeOut * 0.45; // 0.35 -> 0.80 (팽창 정점에서 하얗게 빛남)
      } else {
        const u = (prog - 0.45) / 0.47;
        const easeIn = u * u;
        cloneScale = 1.28 - easeIn * 0.42; // 1.28 -> 0.86 (시전자 몸속으로 수축)
        cloneAlpha = Math.max(0, 0.66 * (1.0 - u));
        whiteMix = Math.max(0, 0.80 * (1.0 - u * 0.6));
      }

      // 중심이 시전자 몸통 중앙에서 팽창/수축하도록 살짝 Y 보정
      const centerLiftY = (cloneScale - 1.0) * (casterSize * 0.22);

      drawRolePlayTargetClone(
        targetCtx,
        targetSprite,
        casterBase.x,
        casterBase.y + centerLiftY,
        casterSize,
        cloneScale,
        cloneScale,
        cloneAlpha,
        whiteMix,
        "rgba(186, 230, 253, 0.45)",
        0
      );
    }

    // 분신이 시전자에게 흡수되는 순간(prog >= 0.35) 피어오르는 동기화 스파클 (✦)
    if (prog >= 0.30) {
      const spProg = (prog - 0.30) / 0.70;
      const spAlpha = Math.sin(spProg * Math.PI);
      const s = isP ? 1.05 : 0.85;

      targetCtx.save();
      targetCtx.translate(casterBase.x, casterBase.y - 34 * s);

      const starCount = 6;
      for (let i = 0; i < starCount; i++) {
        const angle = (i / starCount) * Math.PI * 2 + spProg * 0.5;
        const rx = (22 + spProg * 28) * s;
        const ry = (16 + spProg * 20) * s;
        const sx = Math.cos(angle) * rx;
        const sy = Math.sin(angle) * ry - spProg * 10;
        const starColor = i % 2 === 0
          ? `rgba(255, 255, 255, ${spAlpha.toFixed(3)})`
          : `rgba(186, 230, 253, ${spAlpha.toFixed(3)})`;

        drawMiniRetroStar(
          targetCtx,
          sx,
          sy,
          (1.0 - spProg * 0.45) * 10 * s,
          starColor
        );
      }

      targetCtx.restore();
    }
  }
}

