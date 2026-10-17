// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { getTargetSpriteCenter } from "./move249_252.js";
import {
  drawMiniRetroStar,
  drawStarburstImpact,
  getKarateBlackImg,
  getKarateRedImg,
} from "../common/helpers.js";

// ============================================================================
// 📍 공통 시전자 좌표 헬퍼
// ============================================================================
function getCasterPos(drawCtx: EffectDrawContext, frame: BattleFrame) {
  const isP = drawCtx.isPlayer !== undefined ? Boolean(drawCtx.isPlayer) : true;
  const basePos = isP
    ? (drawCtx.pm || { x: 150, y: 280 })
    : (drawCtx.em || { x: 418, y: 152 });
  const offX = isP ? (frame?.pOffset?.x ?? 0) : (frame?.eOffset?.x ?? 0);
  const offY = isP ? (frame?.pOffset?.y ?? 0) : (frame?.eOffset?.y ?? 0);
  return {
    baseX: basePos.x,
    baseY: basePos.y,
    cx: basePos.x + offX,
    cy: basePos.y + offY - (isP ? 38 : 34),
    groundY: basePos.y + offY + (isP ? 6 : 4),
    offX,
    offY,
    isP,
  };
}

// ============================================================================
// 🪞 277: 매직코트 (Magic Coat / マジックコート) - 에스퍼 타입 변화 기술
//
// 위력: — / 명중: — / PP: 15 / 우선도: +4 / 대상: 자신 / 접촉: X
// 설명: 상대가 상태 이상이 되는 기술이나 씨뿌리기 등을 썼을 때 되받아친다.
//
// [연출 시퀀스 (유저 맞춤 기획)]:
// 1. Step 1~4: 112번 배리어(Barrier)와 동일하게 상단 십자별 ➔ 가로선 확장 ➔ 좌우 세로선 하강 ➔ 하단 수렴 사각형 형성
// 2. Step 5: 배리어 흰색 버전 (반투명 순백 채움 + 사선 반사 하이라이트 번쩍 스위프)
// 3. Step 6: 흰색 배리어 완성 후 유지 + 별로 된 동그라미가 시계방향으로 그려지면서 끝부분(시작했던 꼬리 부분)부터 순차 소멸
// 4. Step 7: 흰색 배리어 페이드아웃 및 종료
// ============================================================================

/**
 * 대칭 단색 순백 십자별 (배리어와 동일)
 */
function drawMagicCoatCrossStar(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  color: string = "#FFFFFF"
) {
  if (size <= 0.5) return;
  ctx.save();
  ctx.fillStyle = color;

  const intCx = Math.round(cx);
  const intCy = Math.round(cy);
  const half = Math.round(size / 2);
  const pinch = Math.max(1.2, Math.round(size * 0.08 * 10) / 10);

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
 * 배리어 사선 반사 하이라이트 (순백 듀얼 스트라이프)
 */
function drawMagicCoatReflectStripes(
  ctx: any,
  cx: number,
  cy: number,
  rectW: number,
  rectH: number,
  shiftOffset: number = 0,
  alpha: number = 0.85
) {
  if (alpha <= 0.01) return;
  const angle = -Math.PI * 0.23;
  const refDim = Math.max(rectW, rectH);
  const W = Math.max(10, Math.round(refDim * 0.20));
  const H = W / 2;
  const L = refDim * 2.6;

  const W_thin = Math.max(3, Math.round(W * 0.28));
  const gap = Math.max(4, Math.round(W * 0.38));
  const thinShift = shiftOffset - H - gap - W_thin / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;

  ctx.fillRect(-L / 2, shiftOffset - H, L, W);
  ctx.fillRect(-L / 2, thinShift - W_thin / 2, L, W_thin);

  ctx.restore();
}

/**
 * 별로 된 동그라미용 십자별 렌더러 (border 없음, 좀 더 노랗게 + 외곽으로 갈수록 살짝 주황빛)
 */
function drawMagicCoatCircleStar(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || size <= 0.5) return;

  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;
  ctx.translate(cx, cy);

  const half = size;
  const pinch = Math.max(1.2, size * 0.22);

  // 중심부는 진한 노란빛(#FDE047 -> #FACC15), 외곽 끝부분으로 갈수록 살짝 주황빛(#F59E0B -> #FB923C)
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, half);
  grad.addColorStop(0.0, "#FEF08A");
  grad.addColorStop(0.35, "#FACC15");
  grad.addColorStop(0.72, "#F59E0B");
  grad.addColorStop(1.0, "#EA580C");

  ctx.beginPath();
  ctx.moveTo(0, -half);
  ctx.lineTo(pinch, -pinch);
  ctx.lineTo(half, 0);
  ctx.lineTo(pinch, pinch);
  ctx.lineTo(0, half);
  ctx.lineTo(-pinch, pinch);
  ctx.lineTo(-half, 0);
  ctx.lineTo(-pinch, -pinch);
  ctx.closePath();

  ctx.fillStyle = grad;
  ctx.fill();

  ctx.restore();
}

/**
 * 완성된 흰색 배리어 본체 (반투명 흰색 채움 + 사선 반사면 + 순백 외곽선)
 */
function drawWhiteBarrierBody(
  ctx: any,
  cx: number,
  cy: number,
  rectW: number,
  rectH: number,
  lineWidth: number,
  alpha: number = 1.0,
  stripeShift: number = 0,
  stripeAlpha: number = 0.85
) {
  if (alpha <= 0.01) return;
  const leftX = cx - rectW / 2;
  const topY = cy - rectH / 2;

  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  // 1) 사각형 내부 클리핑 후 반투명 흰색 채움 + 반사 스트라이프
  ctx.save();
  ctx.beginPath();
  ctx.rect(leftX, topY, rectW, rectH);
  ctx.clip();

  ctx.fillStyle = "rgba(255, 255, 255, 0.34)";
  ctx.fillRect(leftX, topY, rectW, rectH);
  ctx.fillStyle = "rgba(241, 245, 249, 0.14)";
  ctx.fillRect(leftX, topY, rectW, rectH);

  drawMagicCoatReflectStripes(ctx, cx, cy, rectW, rectH, stripeShift, stripeAlpha);
  ctx.restore();

  // 2) 순백 사각형 외곽 테두리
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.rect(leftX, topY, rectW, rectH);
  ctx.stroke();

  ctx.restore();
}

export function drawMagicCoatBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  // 기존 매직코트 후면 오라/마법진 완전 제거 (배리어처럼 깔끔하게 전면 이펙트만 사용)
}

export function drawMagicCoatEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const moveStep = frame.moveStep ?? 1;
  const effectProgress = Math.max(0, Math.min(1.0, frame.effectProgress ?? 0.5));

  const attackerPos = drawCtx.attackerPos ?? (() => {
    const pos = getCasterPos(drawCtx, frame);
    return { x: pos.cx, y: pos.cy + 2 };
  })();

  ctx.save();
  const cx = attackerPos.x;
  const cy = attackerPos.y - 2;

  // 배리어(112)와 동일한 사각형 규격 (가로 62px, 세로 66px)
  const rectW = 62;
  const rectH = 66;
  const halfW = rectW / 2; // 31
  const halfH = rectH / 2; // 33
  const topY = cy - halfH;
  const bottomY = cy + halfH;
  const leftX = cx - halfW;
  const rightX = cx + halfW;
  const lineWidth = 2.8;

  // Step 1: 스프라이트 위쪽에서 십자별 번쩍임
  if (moveStep === 1) {
    const p = effectProgress;
    const starSize = Math.sin(Math.min(1.0, p * 1.5) * Math.PI) * 20;
    drawMagicCoatCrossStar(ctx, cx, topY, starSize, "#FFFFFF");

    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.sin(p * Math.PI) * 0.4})`;
    ctx.beginPath();
    ctx.arc(cx, topY, starSize * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Step 2: 가로로 넓어지는 선 형성 (좌우 동시 확장)
  else if (moveStep === 2) {
    const p = effectProgress;
    const curHW = Math.min(halfW, p * halfW);

    ctx.save();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(cx - curHW, topY);
    ctx.lineTo(cx + curHW, topY);
    ctx.stroke();

    const tipSize = 8;
    drawMagicCoatCrossStar(ctx, cx - curHW, topY, tipSize, "#FFFFFF");
    drawMagicCoatCrossStar(ctx, cx + curHW, topY, tipSize, "#FFFFFF");
    ctx.restore();
  }

  // Step 3: 좌우 세로선이 길어지고 아래로 내려옴 (양쪽 동시)
  else if (moveStep === 3) {
    const p = effectProgress;
    const curH = Math.min(rectH, p * rectH);

    ctx.save();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";

    // 1) 상단 가로선 고정
    ctx.beginPath();
    ctx.moveTo(leftX, topY);
    ctx.lineTo(rightX, topY);
    ctx.stroke();

    // 2) 좌우 세로선 수직 하강
    ctx.beginPath();
    ctx.moveTo(leftX, topY);
    ctx.lineTo(leftX, topY + curH);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rightX, topY);
    ctx.lineTo(rightX, topY + curH);
    ctx.stroke();

    const tipSize = 8;
    drawMagicCoatCrossStar(ctx, leftX, topY + curH, tipSize, "#FFFFFF");
    drawMagicCoatCrossStar(ctx, rightX, topY + curH, tipSize, "#FFFFFF");
    ctx.restore();
  }

  // Step 4: 양 하단에서 안쪽(중앙)으로 가로선이 길어지면서 사각형 완성
  else if (moveStep === 4) {
    const p = effectProgress;
    const curInW = Math.min(halfW, p * halfW);

    ctx.save();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";

    // 1) 상단 가로선 + 좌우 세로선 고정
    ctx.beginPath();
    ctx.moveTo(leftX, topY);
    ctx.lineTo(rightX, topY);
    ctx.lineTo(rightX, bottomY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(leftX, topY);
    ctx.lineTo(leftX, bottomY);
    ctx.stroke();

    // 2) 좌하단, 우하단에서 안쪽(중앙)으로 가로선 전진
    ctx.beginPath();
    ctx.moveTo(leftX, bottomY);
    ctx.lineTo(leftX + curInW, bottomY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rightX, bottomY);
    ctx.lineTo(rightX - curInW, bottomY);
    ctx.stroke();

    if (p >= 0.85) {
      const sparkP = (p - 0.85) / 0.15;
      const sparkSize = Math.sin(sparkP * Math.PI) * 16;
      drawMagicCoatCrossStar(ctx, cx, bottomY, sparkSize, "#FFFFFF");
    } else {
      const tipSize = 7;
      drawMagicCoatCrossStar(ctx, leftX + curInW, bottomY, tipSize, "#FFFFFF");
      drawMagicCoatCrossStar(ctx, rightX - curInW, bottomY, tipSize, "#FFFFFF");
    }
    ctx.restore();
  }

  // Step 5: 사각형 중간에 반투명 흰색 채움 + 사선 반사 하이라이트 번쩍
  else if (moveStep === 5) {
    const p = effectProgress;
    const refDim = Math.max(rectW, rectH);
    const shift = (-0.8 + p * 1.6) * refDim;

    drawWhiteBarrierBody(ctx, cx, cy, rectW, rectH, lineWidth, 1.0, shift, 0.95);

    const glintSize = Math.sin(Math.min(1.0, p * 1.6) * Math.PI) * 14;
    drawMagicCoatCrossStar(ctx, rightX, topY, glintSize, "#FFFFFF");
  }

  // Step 6: 흰색 배리어 완성 후 - 십자별로 된 동그라미가 불규칙하게 퍼지면서 그려지고 끝부분(꼬리)부터 사라짐
  else if (moveStep === 6) {
    const p = effectProgress;

    // 1) 완성된 흰색 배리어 유지
    drawWhiteBarrierBody(ctx, cx, cy, rectW, rectH, lineWidth, 1.0, 0, 0.85);

    // 2) 십자별로 된 동그라미 (과밀하지 않게 12개의 별이 시계방향 원을 그리며 각자 불규칙하게 퍼진 뒤 끝부분부터 소멸)
    const starCount = 12;
    const headDrawSpan = 0.60; // p: 0 -> 0.60 동안 360도 한 바퀴 순차 생성
    const baseStarLife = 0.42;

    // 결정론적 의사 난수 헬퍼 (0.0 ~ 1.0)
    const hash = (n: number) => {
      const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };

    for (let i = 0; i < starCount; i++) {
      const frac = i / starCount;
      const spawnP = frac * headDrawSpan;
      const r1 = hash(i * 19 + 1);
      const r2 = hash(i * 19 + 2);
      const r3 = hash(i * 19 + 3);
      const r4 = hash(i * 19 + 4);
      const r5 = hash(i * 19 + 5);

      // 별마다 수명도 미세하게 불규칙
      const starLife = baseStarLife * (0.88 + r1 * 0.24);
      const localT = (p - spawnP) / starLife;

      if (localT < 0 || localT >= 1.0) continue;

      // 12시 방향(-Math.PI / 2)에서 시작해 시계방향으로 동그라미 형성 + 불규칙 각도 편차 및 확산
      const baseAngle = -Math.PI / 2 + frac * Math.PI * 2;
      const angleJitter = (r2 - 0.5) * 0.18;
      const angleDrift = (r3 - 0.5) * 0.22 * localT;
      const starAngle = baseAngle + angleJitter + angleDrift;

      // 시작 반경(26~34px) 및 퍼져나가는 거리(6~20px 제각각 불규칙 확산)
      const startR = 26 + r4 * 8;
      const spreadR = 6 + r5 * 14;
      const easeSpread = Math.pow(localT, 0.80 + r1 * 0.35);
      const curR = startR + easeSpread * spreadR;

      const sx = cx + Math.cos(starAngle) * curR;
      const sy = cy + Math.sin(starAngle) * curR;

      // 앞부분은 선명하게 나타나고 끝부분(꼬리)부터 작아지며 사라짐
      let scale = 1.0;
      let starAlpha = 1.0;
      if (localT < 0.15) {
        const inT = localT / 0.15;
        scale = 0.50 + inT * 0.50;
        starAlpha = Math.min(1.0, inT * 1.25);
      } else if (localT > 0.52) {
        const outT = (localT - 0.52) / 0.48;
        scale = Math.max(0.18, 1.0 - outT * 0.80);
        starAlpha = Math.max(0, 1.0 - outT);
      }

      // 별 크기도 제각각 불규칙 (6.8 ~ 10.2px)
      const baseSize = 6.8 + r3 * 3.4;
      drawMagicCoatCircleStar(ctx, sx, sy, baseSize * scale, starAlpha);
    }
  }

  // Step 7: 흰색 배리어 페이드아웃
  else if (moveStep === 7) {
    const p = effectProgress;
    const alpha = Math.max(0, 1.0 - p);
    drawWhiteBarrierBody(ctx, cx, cy, rectW, rectH, lineWidth, alpha, 0, 0.70);
  }

  ctx.restore();
}

// ============================================================================
// ♻️ 278: 리사이클 (Recycle / リサイクル) - 노말 타입 변화 기술
//
// 위력: — / 명중: — / PP: 10 / 대상: 자신 / 접촉: X
// 설명: 배틀 중에 사용하여 없어진 자신의 지닌 물건을 재생시켜 사용할 수 있게 한다.
//
// [연출 시퀀스 (유저 맞춤 기획)]:
// - 바깥쪽: 크고 두꺼운 흰색 화살표 2개로 만들어진 원 (border 없음, 단색, 꼬리부분 투명)
// - 안쪽: 동일한 방식으로 2개로 만들어진 원, 같은 방향 회전
//   (색상 변화: 노랑 > 하늘형광 > 주황 > 노랑 > 하늘형광)
// ============================================================================

/**
 * 꼬리 부분이 투명하고 테두리(border)가 없는 단색 곡선 화살표 1개 렌더링
 */
function drawCurvedSolidArrowWithFadeTail(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  shaftThickness: number,
  headWidth: number,
  startAng: number,
  shaftSpan: number,
  headSpan: number,
  rgb: [number, number, number],
  masterAlpha: number = 1.0
) {
  if (masterAlpha <= 0.01) return;

  const shaftEndAng = startAng + shaftSpan;
  const tipAng = shaftEndAng + headSpan;

  const rInner = radius - shaftThickness / 2;
  const rOuter = radius + shaftThickness / 2;
  const rHeadInner = radius - headWidth / 2;
  const rHeadOuter = radius + headWidth / 2;

  const tipX = cx + Math.cos(tipAng) * radius;
  const tipY = cy + Math.sin(tipAng) * radius;

  // 꼬리 구간(약 58도)에만 투명->불투명 그라디언트가 걸리도록 설정
  // (60도~180도 전 구간에서 코사인 투영값이 1.0 이상으로 유지되어 몸통과 화살촉 전체가 선명한 단색 유지)
  const fadeStartAng = startAng + 0.03;
  const fadeEndAng = startAng + Math.PI * 0.34;
  const gradX0 = cx + Math.cos(fadeStartAng) * radius;
  const gradY0 = cy + Math.sin(fadeStartAng) * radius;
  const gradX1 = cx + Math.cos(fadeEndAng) * radius;
  const gradY1 = cy + Math.sin(fadeEndAng) * radius;

  const [r, g, b] = rgb;
  const aStr = masterAlpha.toFixed(3);

  const grad = ctx.createLinearGradient(gradX0, gradY0, gradX1, gradY1);
  grad.addColorStop(0.0, `rgba(${r}, ${g}, ${b}, 0.0)`);
  grad.addColorStop(1.0, `rgba(${r}, ${g}, ${b}, ${aStr})`);

  ctx.save();
  ctx.fillStyle = grad;

  ctx.beginPath();
  // 1) 바깥쪽 호 (꼬리 -> 화살촉 어깨)
  ctx.arc(cx, cy, rOuter, startAng, shaftEndAng, false);
  // 2) 화살촉 바깥 날개 -> 화살촉 끝점 -> 화살촉 안쪽 날개
  ctx.lineTo(
    cx + Math.cos(shaftEndAng) * rHeadOuter,
    cy + Math.sin(shaftEndAng) * rHeadOuter
  );
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(
    cx + Math.cos(shaftEndAng) * rHeadInner,
    cy + Math.sin(shaftEndAng) * rHeadInner
  );
  // 3) 안쪽 호 (화살촉 어깨 -> 꼬리, 역방향)
  ctx.arc(cx, cy, rInner, shaftEndAng, startAng, true);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 내부 화살표 색상 시퀀스 보간:
 * 노랑 > 하늘형광 > 주황 > 노랑 > 하늘형광
 */
function getRecycleInnerArrowRGB(t: number): [number, number, number] {
  const stops: [number, number, number][] = [
    [253, 224, 71],  // 1. 노랑 (#FDE047)
    [0, 245, 255],   // 2. 하늘형광 (#00F5FF)
    [255, 138, 20],  // 3. 주황 (#FF8A14)
    [253, 224, 71],  // 4. 노랑 (#FDE047)
    [0, 245, 255],   // 5. 하늘형광 (#00F5FF)
  ];

  const clamped = Math.max(0, Math.min(1, t));
  const segCount = stops.length - 1; // 4구간
  const scaled = clamped * segCount;
  const idx = Math.min(segCount - 1, Math.floor(scaled));
  const localT = scaled - idx;

  const c0 = stops[idx];
  const c1 = stops[idx + 1];
  return [
    Math.round(c0[0] + (c1[0] - c0[0]) * localT),
    Math.round(c0[1] + (c1[1] - c0[1]) * localT),
    Math.round(c0[2] + (c1[2] - c0[2]) * localT),
  ];
}

export function drawRecycleBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  // 기존 리사이클 후면 오라/링 완전 제거
}

export function drawRecycleEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const prog = Math.max(0, Math.min(1, frame.effectProgress ?? 0));
  const pos = getCasterPos(drawCtx, frame);

  // 시작/종료 시 부드러운 알파 페이드
  let masterAlpha = 1.0;
  if (prog < 0.10) {
    masterAlpha = prog / 0.10;
  } else if (prog > 0.88) {
    masterAlpha = Math.max(0, (1.0 - prog) / 0.12);
  }
  if (masterAlpha <= 0.01) return;

  ctx.save();

  // 시계방향 회전 (바깥쪽 원과 안쪽 원 모두 같은 방향)
  const baseRot = -Math.PI / 2 + prog * Math.PI * 2.2;

  // 화살표 2개가 꽉 찬 원을 이루도록 호 길이 확대 (총합 약 0.96 * PI = 173도)
  const shaftSpan = Math.PI * 0.74;
  const outerHeadSpan = Math.PI * 0.22;
  const innerHeadSpan = Math.PI * 0.23;

  // 1) 바깥쪽: 크고 두꺼운 흰색 화살표 2개로 만들어진 원 (border 없음, 단색, 꼬리 투명)
  const outerRadius = 48;
  const outerThickness = 14;
  const outerHeadWidth = 28;
  const whiteRGB: [number, number, number] = [255, 255, 255];

  for (let i = 0; i < 2; i++) {
    const startAng = baseRot + i * Math.PI;
    drawCurvedSolidArrowWithFadeTail(
      ctx,
      pos.cx,
      pos.cy,
      outerRadius,
      outerThickness,
      outerHeadWidth,
      startAng,
      shaftSpan,
      outerHeadSpan,
      whiteRGB,
      masterAlpha
    );
  }

  // 2) 안쪽: 동일한 방식으로 2개로 만들어진 원, 같은 방향 회전
  //    색상: 노랑 > 하늘형광 > 주황 > 노랑 > 하늘형광
  const innerRadius = 26;
  const innerThickness = 10;
  const innerHeadWidth = 20;
  const innerRGB = getRecycleInnerArrowRGB(prog);

  for (let i = 0; i < 2; i++) {
    const startAng = baseRot + i * Math.PI;
    drawCurvedSolidArrowWithFadeTail(
      ctx,
      pos.cx,
      pos.cy,
      innerRadius,
      innerThickness,
      innerHeadWidth,
      startAng,
      shaftSpan,
      innerHeadSpan,
      innerRGB,
      masterAlpha
    );
  }

  ctx.restore();
}

// ============================================================================
// 🔥 279: 리벤지 (Revenge / リベンジ) - 격투 타입 물리 공격 기술
//
// 위력: 60 (피격 시 120) / 명중: 100 / PP: 10 / 우선도: -4 / 접촉: O
// 설명: 상대에게 기술을 받으면 그 상대에게 주는 데미지가 2배가 된다.
//
// [연출 시퀀스]:
// 1. [Step 1: 피격 인내 & 검붉은 복수의 투기 응축 (Enduring Grudge Charge)]:
//    - 전장이 진홍빛 암전으로 물들며 시전자가 공격을 버텨내는 인내 스파크와 검붉은/황금빛 분노 화염 오라 방출
// 2. [Step 2: 분노의 역습 돌진 (Wrathful Counter-Rush)]:
//    - 응축된 투기를 폭발시키며 타겟을 향해 진홍/황금 혜성 궤적으로 돌진
// 3. [Step 3: 2배 위력 복수의 십자 격투 대폭발 (Double-Power Cross Vengeance Impact)]:
//    - 타겟에 거대한 진홍빛 카운터 타격과 X자 크로스 격투 슬래시 & 스타버스트 충격파 작렬
// ============================================================================

/**
 * 리벤지 준비 단계 증기 퍼프 렌더러
 * - 회전하면서 올라가고, 좀 더 투명하며, 크기가 더 크고 넓게 퍼진 증기 형태
 * - 바깥 부분: 은은하고 투명하게 퍼지는 붉은빛 증기 외곽
 * - 중간 부분: 반투명하고 부드럽게 퍼지는 흰색·회색빛 증기 코어
 */
function drawRevengeSteamPuff(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number,
  rotAngle: number = 0
) {
  if (alpha <= 0.015 || radius <= 1.5) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotAngle);

  const r = radius;

  // 회전감이 잘 보이고 넓게 퍼진 비대칭 소용돌이형 구름 로브 배치
  const lobes = [
    { ox: 0,          oy: -r * 0.42, lr: r * 0.82 },
    { ox: -r * 0.56,  oy:  r * 0.06, lr: r * 0.72 },
    { ox:  r * 0.54,  oy: -r * 0.08, lr: r * 0.68 },
    { ox: -r * 0.10,  oy:  r * 0.44, lr: r * 0.74 },
  ];

  // --------------------------------------------------------------------------
  // Pass 1: 바깥 붉은 부분 (넓게 퍼지고 좀 더 투명한 붉은 증기 외곽)
  // --------------------------------------------------------------------------
  for (const lobe of lobes) {
    const outR = lobe.lr * 1.52;
    const redGrad = ctx.createRadialGradient(
      lobe.ox,
      lobe.oy,
      outR * 0.10,
      lobe.ox,
      lobe.oy,
      outR
    );
    redGrad.addColorStop(0.0, `rgba(235, 85, 85, ${(alpha * 0.19).toFixed(3)})`);
    redGrad.addColorStop(0.48, `rgba(215, 60, 60, ${(alpha * 0.14).toFixed(3)})`);
    redGrad.addColorStop(0.78, `rgba(185, 45, 45, ${(alpha * 0.07).toFixed(3)})`);
    redGrad.addColorStop(1.0, "rgba(160, 35, 35, 0.0)");

    ctx.fillStyle = redGrad;
    ctx.beginPath();
    ctx.arc(lobe.ox, lobe.oy, outR, 0, Math.PI * 2);
    ctx.fill();
  }

  // --------------------------------------------------------------------------
  // Pass 2: 중간 흰색·회색빛 증기 (좀 더 투명하고 부드럽게 퍼진 회백색 증기)
  // --------------------------------------------------------------------------
  for (const lobe of lobes) {
    const inR = lobe.lr * 0.96;
    const steamGrad = ctx.createRadialGradient(
      lobe.ox,
      lobe.oy,
      0,
      lobe.ox,
      lobe.oy,
      inR
    );
    steamGrad.addColorStop(0.0, `rgba(250, 252, 255, ${(alpha * 0.28).toFixed(3)})`);
    steamGrad.addColorStop(0.40, `rgba(218, 224, 233, ${(alpha * 0.22).toFixed(3)})`);
    steamGrad.addColorStop(0.72, `rgba(160, 170, 184, ${(alpha * 0.14).toFixed(3)})`);
    steamGrad.addColorStop(0.90, `rgba(160, 170, 184, ${(alpha * 0.05).toFixed(3)})`);
    steamGrad.addColorStop(1.0, "rgba(160, 170, 184, 0.0)");

    ctx.fillStyle = steamGrad;
    ctx.beginPath();
    ctx.arc(lobe.ox, lobe.oy, inR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

interface RevengeSteamPlumeSpec {
  ox: number;
  oy: number;
  driftX: number;
  riseH: number;
  swayX: number;
  startR: number;
  endR: number;
  baseRot: number;
  rotSpeed: number;
  delay: number;
  duration: number;
  isBehind: boolean;
}

// 크기를 더 키우고(startR 13~15 ➔ endR 24~29), 바깥으로 더 넓게 퍼지며 회전하면서 상승
const REVENGE_STEAM_PLUMES: RevengeSteamPlumeSpec[] = [
  // Behind 레이어 (시전자 등 뒤 좌우 외곽으로 넓게 퍼지며 회전 상승)
  { ox: -38, oy:   0, driftX: -22, riseH: 72, swayX: -6, startR: 14.0, endR: 26.0, baseRot: 0.2, rotSpeed: -1.45, delay: 0.03, duration: 0.56, isBehind: true },
  { ox:  36, oy:  -6, driftX:  22, riseH: 74, swayX:  6, startR: 14.0, endR: 26.0, baseRot: 1.1, rotSpeed:  1.45, delay: 0.24, duration: 0.56, isBehind: true },

  // Front 레이어 (시전자 주변에서 큼직하고 넓게 퍼져 회전하며 올라오는 증기)
  { ox: -28, oy:  14, driftX: -20, riseH: 68, swayX: -5, startR: 13.5, endR: 25.0, baseRot: 0.0, rotSpeed: -1.55, delay: 0.00, duration: 0.52, isBehind: false },
  { ox:  28, oy:  10, driftX:  20, riseH: 70, swayX:  5, startR: 13.5, endR: 25.0, baseRot: 0.8, rotSpeed:  1.55, delay: 0.12, duration: 0.52, isBehind: false },
  { ox: -10, oy: -10, driftX: -12, riseH: 76, swayX: -5, startR: 15.0, endR: 28.0, baseRot: 1.6, rotSpeed: -1.35, delay: 0.22, duration: 0.52, isBehind: false },
  { ox:  40, oy:  -2, driftX:  24, riseH: 66, swayX:  6, startR: 13.0, endR: 24.0, baseRot: 2.3, rotSpeed:  1.60, delay: 0.34, duration: 0.50, isBehind: false },
  { ox:  14, oy: -18, driftX:  14, riseH: 74, swayX:  5, startR: 14.5, endR: 27.0, baseRot: 3.0, rotSpeed:  1.40, delay: 0.44, duration: 0.50, isBehind: false },
];

/**
 * 시전자 주변에서 회전하며 위로 크게 퍼져 올라오는 리벤지 증기 렌더러
 */
function drawRevengeRisingSteamLayer(
  ctx: any,
  cx: number,
  cy: number,
  steamProg: number,
  isBehindLayer: boolean
) {
  if (steamProg <= 0.01) return;

  for (let i = 0; i < REVENGE_STEAM_PLUMES.length; i++) {
    const p = REVENGE_STEAM_PLUMES[i];
    if (p.isBehind !== isBehindLayer) continue;

    const localT = (steamProg - p.delay) / p.duration;
    if (localT <= 0 || localT >= 1.0) continue;

    // 부드러운 상승·확산 이징 및 알파 페이드 인/아웃
    const riseEase = 1.0 - Math.pow(1.0 - localT, 1.45);
    const alpha =
      localT < 0.22
        ? localT / 0.22
        : localT > 0.58
          ? Math.max(0, (1.0 - localT) / 0.42)
          : 1.0;

    const curX =
      cx +
      p.ox +
      p.driftX * riseEase +
      Math.sin(localT * Math.PI * 1.5 + i * 1.7) * p.swayX;
    const curY = cy + p.oy - riseEase * p.riseH;
    const curR = p.startR + (p.endR - p.startR) * riseEase;
    const rotAngle = p.baseRot + localT * Math.PI * p.rotSpeed;

    drawRevengeSteamPuff(ctx, curX, curY, curR, alpha * 0.78, rotAngle);
  }
}

export function drawRevengeBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showBehindEffect && !frame.showEffect) return;
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const pos = getCasterPos(drawCtx, frame);
  const targetPos = getTargetSpriteCenter(drawCtx, frame);

  ctx.save();

  // 1. 전장 배경 연출:
  //    - 준비 단계(Step 1) 및 돌진(Step 2): 검은 암전 유지
  //    - 타격 단계(Step 3): 타겟 중심 붉은 배경 비네트 유지
  if (step === 1 || step === 2) {
    const bgAlpha =
      step === 1
        ? Math.min(1, prog / 0.22) * 0.65
        : 0.65;
    if (bgAlpha > 0.01) {
      ctx.fillStyle = `rgba(0, 0, 0, ${bgAlpha.toFixed(3)})`;
      ctx.fillRect(-2000, -2000, 5000, 5000);
    }
  } else if (step === 3) {
    const bgAlpha = Math.max(0, (1.0 - prog * 0.85) * 0.68);
    if (bgAlpha > 0.01) {
      const focusX = targetPos.x;
      const focusY = targetPos.y;
      const bgGrad = ctx.createRadialGradient(focusX, focusY, 20, focusX, focusY, 360);
      bgGrad.addColorStop(0.0, `rgba(239, 68, 68, ${(bgAlpha * 0.45).toFixed(3)})`);
      bgGrad.addColorStop(0.45, `rgba(153, 27, 27, ${(bgAlpha * 0.65).toFixed(3)})`);
      bgGrad.addColorStop(1.0, `rgba(24, 4, 8, ${(bgAlpha * 0.82).toFixed(3)})`);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(-2000, -2000, 5000, 5000);
    }
  }

  // 2. Step 1: 암전 이후 시전자 뒤편에서 올라오는 증기 (바깥 붉은빛, 중간 흰색회색빛)
  if (step === 1 && prog >= 0.20) {
    const steamProg = (prog - 0.20) / 0.80;
    drawRevengeRisingSteamLayer(ctx, pos.cx, pos.cy, steamProg, true);
  }

  ctx.restore();
}

/**
 * 리벤지 타격 시(Step 3) 위로 그려지는 파란색 굵은 선 렌더러
 * - 형태: 위로 갈수록 둥근 형태(상단 둥근 돔 캡 & 상부로 갈수록 도톰해지는 실루엣)의 굵은 선
 * - 그라데이션: 꼬리(아래) 부분은 완전 투명하고, 뒤(아래/후반)로 갈수록 빠르게 페이드아웃
 * - 움직임: 타겟 위치에서 아래에서 위로 빠르게 그려지며 상승 후 빠른 페이드아웃
 */
function drawRevengeHitBlueLine(
  ctx: any,
  tx: number,
  ty: number,
  prog: number
) {
  // 뒤(후반 프레임)로 갈수록 빠른 지수형 페이드아웃
  if (prog >= 0.82) return;
  const timeAlpha =
    prog < 0.25
      ? Math.min(1.0, (prog + 0.08) / 0.25)
      : Math.pow(Math.max(0, 1.0 - (prog - 0.25) / 0.57), 1.85);
  if (timeAlpha <= 0.01) return;

  // 아래에서 위로 빠르게 그려지는 진행도
  const headT = Math.min(1.0, prog / 0.38);
  const headEase = 1.0 - Math.pow(1.0 - headT, 2.2);

  // 꼬리도 뒤따라 올라오며 뒤쪽부터 빠르게 소멸
  const tailT = Math.max(0, Math.min(1.0, (prog - 0.06) / 0.65));
  const tailEase = Math.pow(tailT, 1.25);

  const startY = ty + 38;
  const endY = ty - 64;
  const totalSpan = startY - endY; // 102px

  const topY = startY - (0.22 + 0.78 * headEase) * totalSpan;
  const botY = startY - tailEase * (totalSpan * 0.68);
  const lineH = botY - topY;
  if (lineH <= 6) return;

  // 굵은 선 폭: 위로 갈수록 둥글고 도톰해지는 형태
  const rTop = 14.5; // 상단 둥근 헤드 반경 (전체 폭 29px의 굵은 선)
  const rBot = 7.5;  // 하단 꼬리 반경
  const domeCenterY = Math.min(botY - 2, topY + rTop);

  ctx.save();

  // 초기에는 연한 하늘색(#93DAFD)이었다가 올라갈 때:
  // - 꼬리(아래) 부분은 형광파란색(rgb(0, 240, 255))으로 변화
  // - 위쪽(헤드) 부분은 진한 파란색(rgb(29, 78, 216))으로 변화
  const colorShift = Math.min(1.0, prog / 0.42);
  const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

  const lowT = Math.min(1.0, colorShift * 1.15);
  const rLow = lerp(147, 0, lowT);
  const gLow = lerp(218, 240, lowT);
  const bLow = lerp(253, 255, lowT);

  const highT = Math.min(1.0, 0.20 + colorShift * 0.80);
  const rHigh = lerp(125, 29, highT);
  const gHigh = lerp(211, 78, highT);
  const bHigh = lerp(252, 216, highT);

  // 중간 구분된 코어 색 없이 단일 그라데이션: 꼬리 끝은 투명 -> 꼬리부 형광파란색 -> 상단부 진한 파란색
  const mainGrad = ctx.createLinearGradient(tx, botY, tx, topY);
  mainGrad.addColorStop(0.00, `rgba(${rLow}, ${gLow}, ${bLow}, 0.0)`);
  mainGrad.addColorStop(0.20, `rgba(${rLow}, ${gLow}, ${bLow}, ${(timeAlpha * 0.28).toFixed(3)})`);
  mainGrad.addColorStop(0.46, `rgba(${rLow}, ${gLow}, ${bLow}, ${(timeAlpha * 0.72).toFixed(3)})`);
  mainGrad.addColorStop(0.76, `rgba(${rHigh}, ${gHigh}, ${bHigh}, ${(timeAlpha * 0.90).toFixed(3)})`);
  mainGrad.addColorStop(1.00, `rgba(${rHigh}, ${gHigh}, ${bHigh}, ${(timeAlpha * 0.98).toFixed(3)})`);

  ctx.fillStyle = mainGrad;
  ctx.beginPath();
  ctx.moveTo(tx - rBot, botY);
  ctx.quadraticCurveTo(
    tx - rTop,
    botY - lineH * 0.55,
    tx - rTop,
    domeCenterY
  );
  // 위로 갈수록 둥근 반원형 돔 캡
  ctx.arc(tx, domeCenterY, rTop, Math.PI, 0, false);
  ctx.quadraticCurveTo(
    tx + rTop,
    botY - lineH * 0.55,
    tx + rBot,
    botY
  );
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 리벤지 타격 후 원 형태로 퍼지는 점 파티클 데이터 (360도 원형 확산, 각도 간격은 불규칙)
 */
interface RevengeDotParticleSpec {
  angle: number;
  speed: number;
  startT: number;
  life: number;
  coreR: number;
}

const REVENGE_HIT_DOT_PARTICLES: RevengeDotParticleSpec[] = [
  { angle: -Math.PI * 0.96, speed: 60, startT: 0.05, life: 0.76, coreR: 3.0 },
  { angle: -Math.PI * 0.84, speed: 62, startT: 0.05, life: 0.78, coreR: 3.3 },
  { angle: -Math.PI * 0.73, speed: 59, startT: 0.06, life: 0.75, coreR: 2.8 },
  { angle: -Math.PI * 0.64, speed: 63, startT: 0.05, life: 0.79, coreR: 3.2 },
  { angle: -Math.PI * 0.21, speed: 61, startT: 0.06, life: 0.76, coreR: 2.9 },
  { angle: -Math.PI * 0.09, speed: 58, startT: 0.05, life: 0.74, coreR: 2.7 },
  { angle:  Math.PI * 0.14, speed: 62, startT: 0.05, life: 0.77, coreR: 3.1 },
  { angle:  Math.PI * 0.27, speed: 59, startT: 0.06, life: 0.75, coreR: 2.8 },
  { angle:  Math.PI * 0.49, speed: 61, startT: 0.05, life: 0.77, coreR: 3.2 },
  { angle:  Math.PI * 0.61, speed: 58, startT: 0.06, life: 0.74, coreR: 2.7 },
  { angle:  Math.PI * 0.73, speed: 63, startT: 0.05, life: 0.78, coreR: 3.0 },
  { angle:  Math.PI * 0.91, speed: 60, startT: 0.06, life: 0.76, coreR: 2.9 },
];

/**
 * 리벤지 타격 후 원 형태로 튀는 점 파티클 렌더러 (불규칙 간격, 보라빛 글로우 + 중간 흰색)
 */
function drawRevengeHitDotParticles(
  ctx: any,
  tx: number,
  ty: number,
  prog: number
) {
  ctx.save();

  for (const p of REVENGE_HIT_DOT_PARTICLES) {
    const localT = (prog - p.startT) / p.life;
    if (localT <= 0 || localT >= 1.0) continue;

    // 중심에서 원 형태를 유지하며 방사형으로 빠르게 퍼짐 (중력 왜곡 제거)
    const distEase = 1.0 - Math.pow(1.0 - localT, 2.2);
    const dist = 12 + p.speed * distEase;
    const px = tx + Math.cos(p.angle) * dist;
    const py = ty + Math.sin(p.angle) * dist;

    const alpha =
      localT < 0.18
        ? localT / 0.18
        : Math.pow(Math.max(0, 1.0 - (localT - 0.18) / 0.82), 1.35);
    if (alpha <= 0.02) continue;

    const scale = localT < 0.25 ? 0.85 + 0.25 * (localT / 0.25) : 1.10 - 0.45 * ((localT - 0.25) / 0.75);
    const coreR = Math.max(1.2, p.coreR * scale);
    const glowR = coreR * 3.2;

    // 1) 바깥 보라빛 글로우 (Purple Glow)
    const glowGrad = ctx.createRadialGradient(px, py, coreR * 0.3, px, py, glowR);
    glowGrad.addColorStop(0.00, `rgba(216, 180, 254, ${(alpha * 0.95).toFixed(3)})`);
    glowGrad.addColorStop(0.38, `rgba(168, 85, 247, ${(alpha * 0.82).toFixed(3)})`);
    glowGrad.addColorStop(0.72, `rgba(126, 34, 206, ${(alpha * 0.42).toFixed(3)})`);
    glowGrad.addColorStop(1.00, "rgba(107, 33, 168, 0.0)");

    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(px, py, glowR, 0, Math.PI * 2);
    ctx.fill();

    // 2) 중간 흰색 코어 점 (White Center)
    ctx.fillStyle = `rgba(255, 255, 255, ${(alpha * 0.98).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(px, py, coreR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawRevengeEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const pos = getCasterPos(drawCtx, frame);
  const targetPos = getTargetSpriteCenter(drawCtx, frame);

  ctx.save();

  // --------------------------------------------------------------------------
  // [Step 1: 암전 후 시전자에게서 피어오르는 증기 (바깥 붉은빛, 중간 흰색회색빛)]
  // --------------------------------------------------------------------------
  if (step === 1 && prog >= 0.20) {
    const steamProg = (prog - 0.20) / 0.80;
    drawRevengeRisingSteamLayer(ctx, pos.cx, pos.cy, steamProg, false);
  }

  // --------------------------------------------------------------------------
  // [Step 3: 타격 시 파란색 굵은 선 + 보라빛 글로우 & 중간 흰색 점 파티클 비산]
  // --------------------------------------------------------------------------
  if (step === 3) {
    drawRevengeHitBlueLine(ctx, targetPos.x, targetPos.y, prog);
    drawRevengeHitDotParticles(ctx, targetPos.x, targetPos.y, prog);
  }

  ctx.restore();
}

// ============================================================================
// 🧱 280: 깨뜨리다 (Brick Break / かわらわり) - 격투 타입 물리 공격 기술
//
// 위력: 75 / 명중: 100 / PP: 15 / 접촉: O
// 설명: 수도로 기세 좋게 내려쳐서 상대를 공격한다. 빛의장막이나 리플렉터도 파괴할 수 있다.
//
// [연출 시퀀스]:
// 1. [Step 1: 수도 기합 응축 & 타겟 전방 장막(Reflect/Light Screen) 출현]:
//    - 시전자가 높이 도약하며 손날에 백열/주황 기공을 응축하고, 타겟 앞에는 반투명 크리스탈 장막 & 벽돌 벽이 세워짐
// 2. [Step 2: 초고속 수직 수도(Karate Chop) 내려치기 & 거미줄 균열]:
//    - 위에서 아래로 날카로운 수도 참격이 수직 낙하하며 장막 전체에 하얀 균열이 퍼짐
// 3. [Step 3: 장막 & 벽돌 완전 파쇄 (Shattered Barrier Shards) & 타격 폭발]:
//    - 장막과 벽돌이 산산조각나 사방으로 크리스탈 유리 파편과 벽돌 조각이 튀며 타겟 본체에 격투 스타버스트 폭발
// ============================================================================

export function drawBrickBreakBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  // 태권당수(Karate Chop) 연출 그대로 적용 (후면 이펙트 없음)
}

export function drawBrickBreakEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const targetPos = drawCtx.targetPos || getTargetSpriteCenter(drawCtx, frame);
  if (!targetPos || !(frame.showEffect || (frame.moveStep && frame.moveStep >= 1))) {
    return;
  }

  const step = frame.moveStep ?? 4;
  const isP = drawCtx.isPlayer !== undefined ? Boolean(drawCtx.isPlayer) : true;
  const cx = targetPos.x;
  const cy = targetPos.y;

  let handOy = -52;
  let handAlpha = 1.0;

  if (step === 1) {
    // 1단계: 대상 포켓몬 머리 위에 손 출현
    handOy = -52;
    handAlpha = 1.0;
  } else if (step === 2) {
    // 2단계: 머리 위에서 살짝 아래로 둥둥 떠 있음
    handOy = -44;
    handAlpha = 1.0;
  } else if (step === 3) {
    // 3단계: 내려찍기 직전 살짝 위로 들어올리며 둥둥 대기
    handOy = -58;
    handAlpha = 1.0;
  } else if (step === 4) {
    // 4단계: 대상 포켓몬과 닿는 부분 (일시적으로 손이 투명해짐)
    handOy = -2;
    handAlpha = 0.35;
  } else if (step === 5) {
    // 5단계: 대상 포켓몬 그라운드 아래까지 이동 완료 (다시 선명해짐)
    handOy = 42;
    handAlpha = 1.0;
  } else if (step === 6) {
    // 6단계: 그라운드 아래에서 잔상 소멸
    handOy = 46;
    handAlpha = 0.30;
  } else {
    handAlpha = 0;
  }

  const sprite = getKarateBlackImg();
  if (sprite && handAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = handAlpha;
    ctx.translate(cx, cy + handOy);
    if (isP) {
      ctx.scale(-1, 1);
    }
    // 기존 1.15배에서 살짝 작게 (0.95배)
    const sw = 80 * 0.95;
    const sh = 60 * 0.95;
    ctx.drawImage(sprite, -sw / 2, -sh / 2, sw, sh);
    ctx.restore();
  }
}


