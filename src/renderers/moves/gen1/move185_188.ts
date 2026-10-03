// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawConfusionEffect } from "./move045_048.js";
import { getKarateBlackImg } from "../common/helpers.js";
import { drawGen5ComicHitBurst, drawSparkleStars } from "./move037_040.js";
import {
  drawOrganicToxicCloud,
  drawToxicGasPuff,
  SMOG_BILLOW_CLOUDS,
  SmogCloudDef,
  drawSmogTrailPuff,
} from "./move121_124.js";

// ============================================================================
// 🌑 185: 속여때리기 (Feint Attack)
// ============================================================================

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
 * 🥊 [유저 지시 엄수]: 작은 마하펀치 순백 코어 플래시 (선 없는 순백 코어 발광 섬광)
 */
function drawSmallWhiteHitBurst(
  ctx: any,
  cx: number,
  cy: number,
  progress: number
) {
  // [유저 지시]: 타격은 1프레임만 (hitProgress 0.18 초과 시 미표시)
  if (progress > 0.18) return;
  const alpha = Math.max(0, 1.0 - progress / 0.18);
  if (alpha <= 0.01) return;

  ctx.save();

  // 순백 원형 코어 플래시 (8px -> 16px)
  const coreR = (8 + progress * 8);
  const flashGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
  flashGrad.addColorStop(0.00, `rgba(255, 255, 255, ${1.0 * alpha})`);
  flashGrad.addColorStop(0.40, `rgba(255, 255, 255, ${0.92 * alpha})`);
  flashGrad.addColorStop(0.72, `rgba(215, 226, 240, ${0.48 * alpha})`);
  flashGrad.addColorStop(1.00, "rgba(155, 172, 194, 0.0)");

  ctx.fillStyle = flashGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 🥊 [유저 지시 엄수]: 작은 몸통박치기 타격 스타일 날카로운 8각 스타버스트 (Sharp Comic Starburst, 주먹 없이)
 */
function drawSmallWhiteSharpImpactBurst(
  ctx: any,
  cx: number,
  cy: number,
  progress: number
) {
  // [유저 지시]: 타격은 1프레임만 (hitProgress 0.18 초과 시 미표시)
  if (progress > 0.18) return;
  const alpha = Math.max(0, 1.0 - progress / 0.18);
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(progress * 0.40);

  // [유저 지시 반영]: 타격 별 크기 축소 (8px -> 16px)
  const outerR = 8 + progress * 8;
  const innerR = outerR * 0.40;
  const points = 8;

  ctx.fillStyle = `rgba(255, 255, 255, ${0.96 * alpha})`;
  ctx.strokeStyle = `rgba(255, 255, 255, ${1.0 * alpha})`;
  ctx.lineWidth = 1.4;
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
 * 🌑 185: 속여때리기 (Feint Attack) Front Effect
 * - Phase 3 (step === 3):
 *   [유저 지시 엄수]:
 *   1. 작은 마하펀치 타격 (주먹 없이)
 *   2. 흰색 동그라미가 바깥으로 퍼지는 게 아닌, 동그라미를 그리면서 회전
 */
export function drawFeintAttackEffect(
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

  // --------------------------------------------------------------------------
  // Step 3: 작은 마하펀치 타격 & 흰색 동그라미들이 동그라미를 그리며 회전
  // --------------------------------------------------------------------------
  if (step === 3) {
    const hitProg = frame.hitProgress ?? p;

    targetCtx.save();

    // 1. [유저 지시]: 작은 마하펀치 순백 코어 플래시 (1프레임만 출력)
    drawSmallWhiteHitBurst(targetCtx, tx, ty, hitProg);

    // 2. [유저 지시]: 작은 8각 순백 날카로운 스타버스트 (1프레임만 출력)
    drawSmallWhiteSharpImpactBurst(targetCtx, tx, ty, hitProg);

    // [유저 지시 엄수]: 회전하면서 바깥으로 퍼지면서(반경 24px -> 52px) 작아져(sizeScale 1.0 -> 0.28)
    const expandEase = 1.0 - Math.pow(1.0 - Math.min(1.0, hitProg), 1.6);
    const circleRadius = 24 + expandEase * 28; // 24px에서 바깥으로 52px까지 퍼짐

    // 1바퀴(2 * PI) 회전 스윕
    const startAngle = -Math.PI * 0.5; // 12시 방향에서 시작
    const sweepAngle = Math.min(1.0, hitProg) * Math.PI * 2.0; // 정확히 한 바퀴 회전
    const currentAngle = startAngle + sweepAngle;

    // 회전하며 바깥으로 퍼질수록 점진적으로 작아짐 (1.0 -> 0.28)
    const sizeScale = Math.max(0.25, 1.0 - hitProg * 0.72);
    let orbAlpha = 1.0;

    if (hitProg > 0.65) {
      // 바깥으로 퍼진 뒤 투명하게 소산
      const fadeT = (hitProg - 0.65) / 0.35;
      orbAlpha = Math.max(0.0, 1.0 - Math.pow(fadeT, 1.25));
    }

    if (orbAlpha > 0.01) {
      // 2개의 대칭 머리를 가진 순백 알갱이 스트림 (180도 반대편에서 서로를 쫓으며 회전)
      const streamHeadAngles = [currentAngle, currentAngle + Math.PI];
      const trailBeads = [
        { angleOffset: 0.00, radius: 6.2 },  // 머리 (2개)
        { angleOffset: -0.28, radius: 5.3 },
        { angleOffset: -0.58, radius: 4.5 },
        { angleOffset: -0.90, radius: 3.7 },
        { angleOffset: -1.25, radius: 2.9 },
        { angleOffset: -1.65, radius: 2.2 },  // 꼬리
      ];

      for (const headAngle of streamHeadAngles) {
        for (let i = 0; i < trailBeads.length; i++) {
          const bead = trailBeads[i];
          const bAngle = headAngle + bead.angleOffset;

          const bx = tx + Math.cos(bAngle) * circleRadius;
          const by = ty + Math.sin(bAngle) * circleRadius;

          const bRadius = bead.radius * sizeScale;
          const bAlpha = orbAlpha * (1.0 - i * 0.10);

          drawGlowingWhiteOrb(targetCtx, bx, by, bRadius, bAlpha);
        }
      }
    }

    targetCtx.restore();
  }
}

// ============================================================================
// 👼 186: 천사의키스 (Sweet Kiss)
// ============================================================================

/**
 * 4각 미니 페어리 스파클 (Mini Fairy Sparkle)
 */
function drawFairySparkle(
  ctx: any,
  x: number,
  y: number,
  size: number,
  alpha: number,
  color: string = "#FFFFFF"
) {
  if (alpha <= 0.01 || size <= 0.5) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(0, 0, size, 0);
  ctx.quadraticCurveTo(0, 0, 0, size);
  ctx.quadraticCurveTo(0, 0, -size, 0);
  ctx.quadraticCurveTo(0, 0, 0, -size);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 퐁퐁 터지는 미니 핑크 하트 (Mini Popping Heart)
 */
function drawMiniHeart(
  ctx: any,
  x: number,
  y: number,
  size: number,
  alpha: number,
  color: string = "#FB7185"
) {
  if (alpha <= 0.01 || size <= 0.5) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.fillStyle = color;

  ctx.beginPath();
  const topH = size * 0.3;
  ctx.moveTo(0, topH);
  ctx.bezierCurveTo(0, 0, -size * 0.55, 0, -size * 0.55, topH);
  ctx.bezierCurveTo(-size * 0.55, size * 0.7, 0, size * 0.95, 0, size * 1.05);
  ctx.bezierCurveTo(0, size * 0.95, size * 0.55, size * 0.7, size * 0.55, topH);
  ctx.bezierCurveTo(size * 0.55, 0, 0, 0, 0, topH);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 👼 페어리 천사 날개 하트 (Angelic Winged Heart VFX)
 * - PPT 클립아트 스타일의 인위적인 테두리 선(stroke) 완전 배제
 * - 다층 깃털 레이어(Layered Ethereal Feathers) & 방사형 발광 글로우
 * - 눈부신 크리스탈 보석 하트 코어 & 십자 하이라이트 글린트
 */
function drawAngelWingedHeart(
  ctx: any,
  x: number,
  y: number,
  scale: number = 1.0,
  wingFlapAngle: number = 0,
  alpha: number = 1.0,
  flipX: boolean = false
) {
  if (alpha <= 0.01 || scale <= 0.1) return;
  ctx.save();
  ctx.translate(x, y);
  if (flipX) ctx.scale(-1, 1);
  ctx.scale(scale, scale);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 1. 좌/우 천사 날개 (다층 깃털 레이어 & 테두리선 없는 부드러운 순백/파스텔 실루엣)
  const drawWing = (isRight: boolean) => {
    ctx.save();
    ctx.translate(isRight ? 7 : -7, -2);
    ctx.rotate((isRight ? -1 : 1) * wingFlapAngle);
    if (!isRight) ctx.scale(-1, 1);

    // 깃털 1: 가장 뒤쪽/하단 은은한 파스텔 깃털
    ctx.save();
    ctx.fillStyle = "rgba(244, 208, 226, 0.85)";
    ctx.beginPath();
    ctx.moveTo(2, 2);
    ctx.quadraticCurveTo(12, 10, 18, 14);
    ctx.quadraticCurveTo(12, 16, 6, 12);
    ctx.quadraticCurveTo(2, 8, 2, 2);
    ctx.fill();
    ctx.restore();

    // 깃털 2: 중간 깃털 (연한 스카이 펄 화이트)
    ctx.save();
    const f2Grad = ctx.createLinearGradient(0, 0, 22, 4);
    f2Grad.addColorStop(0.0, "#FFFFFF");
    f2Grad.addColorStop(0.7, "#F1F5F9");
    f2Grad.addColorStop(1.0, "#E2E8F0");
    ctx.fillStyle = f2Grad;
    ctx.beginPath();
    ctx.moveTo(1, 0);
    ctx.quadraticCurveTo(14, -2, 24, 4);
    ctx.quadraticCurveTo(18, 9, 10, 7);
    ctx.quadraticCurveTo(4, 5, 1, 0);
    ctx.fill();
    ctx.restore();

    // 깃털 3: 상단 메인 깃털 (순백 + 솟아오르는 날개 깃)
    ctx.save();
    const f3Grad = ctx.createLinearGradient(0, 0, 28, -14);
    f3Grad.addColorStop(0.0, "#FFFFFF");
    f3Grad.addColorStop(0.6, "#FFFFFF");
    f3Grad.addColorStop(1.0, "#FCE7F3");
    ctx.fillStyle = f3Grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(8, -12, 18, -18, 28, -12);
    ctx.bezierCurveTo(24, -5, 16, -2, 12, 0);
    ctx.quadraticCurveTo(6, 2, 0, 0);
    ctx.fill();
    ctx.restore();

    // 날개 상단 반짝이는 미세 하이라이트 림
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.beginPath();
    ctx.ellipse(14, -8, 6, 2, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // 왼쪽 & 오른쪽 날개 렌더링
  drawWing(false);
  drawWing(true);

  // 2. 중앙 핑크 하트 (단색 솔리드)
  const hr = 11;
  ctx.save();

  // 하트 본체 (그라데이션/하이라이트 없는 깔끔한 솔리드 핑크)
  ctx.fillStyle = "#FB7185";
  ctx.beginPath();
  const topH = hr * 0.35;
  ctx.moveTo(0, topH);
  ctx.bezierCurveTo(0, -hr * 0.8, -hr * 1.25, -hr * 0.8, -hr * 1.25, topH);
  ctx.bezierCurveTo(-hr * 1.25, hr * 0.95, 0, hr * 1.4, 0, hr * 1.75);
  ctx.bezierCurveTo(0, hr * 1.4, hr * 1.25, hr * 0.95, hr * 1.25, topH);
  ctx.bezierCurveTo(hr * 1.25, -hr * 0.8, 0, -hr * 0.8, 0, topH);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  ctx.restore();
}

/**
 * 대상 양 볼 수줍은 홍조 및 하트 키스 마크 (Sweet Kiss Mark & Blush)
 */
function drawSweetKissMarkAndBlush(
  ctx: any,
  tx: number,
  ty: number,
  alpha: number,
  scale: number
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 1. 수줍은 양 볼 핑크 홍조
  ctx.fillStyle = "rgba(251, 113, 133, 0.45)";
  ctx.beginPath();
  ctx.ellipse(tx - 18, ty + 2, 9 * scale, 5 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(tx + 18, ty + 2, 9 * scale, 5 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. 앙증맞은 핑크 하트 키스 마크
  ctx.save();
  ctx.translate(tx, ty - 6);
  ctx.scale(scale, scale);
  // 윗입술
  ctx.fillStyle = "#E11D48";
  ctx.beginPath();
  ctx.moveTo(-11, 1);
  ctx.bezierCurveTo(-8, -6, -2, -7, 0, -3);
  ctx.bezierCurveTo(2, -7, 8, -6, 11, 1);
  ctx.bezierCurveTo(5, -1, -5, -1, -11, 1);
  ctx.closePath();
  ctx.fill();
  // 아랫입술
  ctx.fillStyle = "#FB7185";
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.bezierCurveTo(-6, 7, 6, 7, 10, 0);
  ctx.bezierCurveTo(4, 1, -4, 1, -10, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * 👼 186: 천사의키스 (Sweet Kiss) Front Effect
 * - Step 1: 시전자 앞 천사의 날개 하트 생성 & 펄스
 * - Step 2: 포물선 아크 궤적 비행 & 날갯짓 파닥파닥 & 별가루 트레일
 * - Step 3: 대상 면전에 찰싹 쪽! 키스 마크 착탄 + 양 볼 홍조 + 퐁퐁 터지는 핑크 하트
 * - Step 4: 머리 위 3D 궤도 회전 혼란(Confusion) 별무리 (★ ★ ★)
 */
export function drawSweetKissEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { attackerPos, targetPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep ?? 1;

  // 시전자 및 대상 중심 좌표
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 16 : 10);

  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0)) - (isP ? 16 : 10);

  targetCtx.save();

  // 1. 날아가는 천사의 날개 하트
  const heartProg = frame.heartProgress ?? 0;
  const heartAlpha = frame.heartAlpha ?? 1.0;
  const wingFlap = frame.wingFlap ?? (Math.sin(heartProg * Math.PI * 8) * 0.45);
  const heartScale = frame.heartScale ?? 1.0;

  if (heartAlpha > 0.01 && (step === 1 || step === 2)) {
    let curX = ax;
    let curY = ay;

    if (step === 1) {
      curX = ax + (isP ? 20 : -20);
      curY = ay - 14 - (frame.effectProgress ?? 0) * 8;
    } else if (step === 2) {
      const sx = ax + (isP ? 20 : -20);
      const sy = ay - 22;
      const ex = tx;
      const ey = ty - 4;
      curX = sx + (ex - sx) * heartProg;
      const arcH = Math.sin(Math.min(1.0, heartProg) * Math.PI) * -24;
      curY = sy + (ey - sy) * heartProg + arcH;

      // 뒤따르는 반짝이 별가루 트레일
      for (let i = 1; i <= 4; i++) {
        const tProg = Math.max(0, heartProg - i * 0.07);
        const trX = sx + (ex - sx) * tProg;
        const trY = sy + (ey - sy) * tProg + Math.sin(tProg * Math.PI) * -24;
        const spAlpha = heartAlpha * (1.0 - i * 0.22) * 0.75;
        const spColor = i % 2 === 0 ? "#FEF08A" : "#FFFFFF";
        drawFairySparkle(targetCtx, trX, trY, 3.5 - i * 0.5, spAlpha, spColor);
      }
    }

    drawAngelWingedHeart(targetCtx, curX, curY, heartScale, wingFlap, heartAlpha, !isP);
  }

  // 2. 대상 얼굴에 찍힌 키스 마크 & 양 볼 핑크 홍조 (Step 3에서만 출력)
  const kissMarkAlpha = frame.kissMarkAlpha ?? 0;
  const kissMarkScale = frame.kissMarkScale ?? 1.1;
  if (step === 3 && kissMarkAlpha > 0.01) {
    drawSweetKissMarkAndBlush(targetCtx, tx, ty, kissMarkAlpha, kissMarkScale);
  }

  // 3. 퐁퐁 터져 비산하는 핑크 하트들 (Step 3에서만 출력)
  const heartsProg = frame.heartsProgress ?? 0;
  const heartsAlpha = frame.heartsAlpha ?? 1.0;
  if (step === 3 && heartsProg > 0 && heartsAlpha > 0.01) {
    const HEARTS = [
      { ox: -16, oy: -12, vx: -20, vy: -28, size: 11, color: "#FB7185" },
      { ox:  16, oy: -16, vx:  22, vy: -32, size: 13, color: "#F472B6" },
      { ox:   0, oy: -26, vx:   0, vy: -36, size: 14, color: "#FDA4AF" },
      { ox: -22, oy:   0, vx: -24, vy: -14, size:  9, color: "#F43F5E" },
      { ox:  22, oy:  -2, vx:  26, vy: -16, size: 10, color: "#FB7185" },
    ];
    for (const h of HEARTS) {
      const hx = tx + h.ox + h.vx * heartsProg;
      const hy = ty + h.oy + h.vy * heartsProg;
      const hSize = Math.max(1, h.size * (1 - heartsProg * 0.3));
      const hAlpha = Math.sin(heartsProg * Math.PI) * heartsAlpha;
      drawMiniHeart(targetCtx, hx, hy, hSize, hAlpha, h.color);
    }
  }

  // 4. 머리 위 혼란(Confusion) 3D 궤도 회전 별무리 (Step 4에서 입술/파티클 종료 후 출력)
  const confProg = frame.confusionProgress ?? 0;
  if (step === 4 && confProg > 0) {
    const headX = tx;
    const headY = ty - 28;
    drawConfusionEffect(targetCtx, headX, headY, confProg);
  }

  targetCtx.restore();
}

// ============================================================================
// 🥁 187: 배북 (Belly Drum)
// ============================================================================

/**
 * 4각 다이아몬드 스파클 별 (Thrash 고증)
 */
function drawBellyDrumSparkleStar(
  ctx: any,
  x: number,
  y: number,
  size: number = 6,
  alpha: number = 1.0,
  rot: number = 0
) {
  if (alpha <= 0.01 || size <= 0.5) return;
  ctx.save();
  ctx.translate(x, y);
  if (rot !== 0) ctx.rotate(rot);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.38, 0);
  ctx.lineTo(0, size);
  ctx.lineTo(-size * 0.38, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#FEF08A";
  ctx.beginPath();
  ctx.moveTo(-size, 0);
  ctx.lineTo(0, size * 0.38);
  ctx.lineTo(size, 0);
  ctx.lineTo(0, -size * 0.38);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 난동부리기 (Thrash) 스타일 상승 파티클 설정 목록
 * - ⚠️ 유저 지시 엄수: 파티클 수 대폭 축소 (타마다 1개씩 깔끔하게 상승, 총 6개)
 */
const BELLY_DRUM_RISING_PARTICLES = [
  // Beat 1 (Left): 1타 왼손에서 피어오르는 단일 8각 스타버스트
  { spawn: 0.12, life: 0.40, baseX: -22, startY: 6, speedY: 82, swayAmp: 5, swayFreq: 2.0, phase: 0.2, type: "burst", size: 15, rot: 0.2 },

  // Beat 2 (Right): 2타 오른손에서 피어오르는 단일 8각 스타버스트
  { spawn: 0.34, life: 0.40, baseX: 22, startY: 6, speedY: 85, swayAmp: 5, swayFreq: 2.0, phase: 1.1, type: "burst", size: 15, rot: -0.3 },

  // Beat 3 (Left): 3타 왼손에서 피어오르는 단일 8각 스타버스트
  { spawn: 0.56, life: 0.42, baseX: -24, startY: 6, speedY: 95, swayAmp: 6, swayFreq: 2.2, phase: 1.8, type: "burst", size: 16, rot: 0.4 },

  // Beat 4 (Right): 4타 오른손 피니시에서 피어오르는 스타버스트
  { spawn: 0.76, life: 0.45, baseX: 24, startY: 6, speedY: 105, swayAmp: 6, swayFreq: 2.0, phase: 2.5, type: "burst", size: 18, rot: -0.4 },

  // Climax Fountains: 공격력 최대치 달성 시 상공으로 치솟는 2개의 피날레 스타버스트
  { spawn: 0.86, life: 0.40, baseX: -12, startY: 2, speedY: 125, swayAmp: 5, swayFreq: 2.2, phase: 2.0, type: "burst", size: 18, rot: 0.3 },
  { spawn: 0.88, life: 0.40, baseX: 12, startY: 2, speedY: 128, swayAmp: 5, swayFreq: 2.0, phase: 1.0, type: "burst", size: 19, rot: -0.3 },
];

/**
 * 🥁 187: 배북 (Belly Drum) Front Effect
 *
 * [유저 지시 엄수]:
 * 1. 시전 포켓몬에게 손바닥이 왼쪽 -> 오른쪽 -> 왼쪽 -> 오른쪽 나타남
 *    - ⚠️ 손의 각도: 세로로 세워진 느낌 (손가락이 위를 향하도록 회전 정렬)
 *    - 태권당수 손바닥 getKarateBlackImg 사용
 * 2. 시전포켓몬 스프라이트가 쿵쿵쿵쿵 거리며 격렬하게 탄성 진동
 * 3. 난동부리기(Thrash) 할 때 나오던 효과들이 아래에서 위로 치솟아오름
 *    - ⚠️ 위로 올라가는 파티클 중 십자별(다이아몬드 별) 및 점 파티클 제거 ➔ 오직 8각 난동 스타버스트만 상승
 *    - ⚠️ 배북 손 칠 때 순백색 링이 시원하게 퍼져나감
 */
export function drawBellyDrumEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { attackerPos, casterPos, isPlayer: isP } = drawCtx;
  const drumBeat = frame.drumBeat ?? 0;
  const handSide = frame.handSide ?? "none";
  const handAlpha = frame.handAlpha ?? 0;
  const impactBurst = frame.impactBurst ?? false;
  const risingProg = frame.risingProgress ?? 0;

  // 시전 포켓몬 중심 좌표
  const cx = casterPos?.x ?? (attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0)));
  const cy = (casterPos?.y ?? (attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)))) - (isP ? 16 : 10);

  targetCtx.save();

  // ==========================================================================
  // 1. Climax Radiant Glow (절정 단계 시전자 은은한 골든 에너지 발광)
  // ==========================================================================
  if (risingProg >= 0.85) {
    const climaxT = Math.min(1.0, (risingProg - 0.85) / 0.25);
    const glowAlpha = Math.sin(climaxT * Math.PI) * 0.45;
    if (glowAlpha > 0.01) {
      targetCtx.save();
      const auraGrad = targetCtx.createRadialGradient(cx, cy, 6, cx, cy, 48);
      auraGrad.addColorStop(0, `rgba(254, 240, 138, ${glowAlpha * 0.8})`);
      auraGrad.addColorStop(0.45, `rgba(245, 158, 11, ${glowAlpha * 0.45})`);
      auraGrad.addColorStop(1, "rgba(245, 158, 11, 0)");
      targetCtx.fillStyle = auraGrad;
      targetCtx.beginPath();
      targetCtx.arc(cx, cy, 48, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.restore();
    }
  }

  // ==========================================================================
  // 2. Rising Thrash Effects (난동부리기 효과들이 배에서 상공으로 치솟음)
  //    ⚠️ 십자별(다이아몬드 별) 및 점 파티클 없이 오직 8각 난동 스타버스트만 솟아오름
  // ==========================================================================
  if (risingProg > 0.05) {
    for (const p of BELLY_DRUM_RISING_PARTICLES) {
      if (risingProg < p.spawn || risingProg > p.spawn + p.life) continue;
      const t = (risingProg - p.spawn) / p.life; // 0.0 -> 1.0 within lifetime
      const alpha = Math.sin(t * Math.PI) * 0.95;
      if (alpha <= 0.02) continue;

      // 치솟아 오르는 Y축 및 좌우 살랑거리는 X축
      const soarY = Math.pow(t, 0.82) * p.speedY;
      const py = (cy + p.startY) - soarY;
      const px = cx + p.baseX + Math.sin(t * Math.PI * p.swayFreq + p.phase) * p.swayAmp;

      if (p.type === "burst") {
        const curR = p.size * (1.0 - t * 0.28);
        drawGen5ComicHitBurst(targetCtx, px, py, curR, alpha);
      }
    }
  }

  // ==========================================================================
  // 3. Expanding White Shockwave Ring on Slap Impact (배북 손 칠 때 퍼지는 순백 링)
  // ==========================================================================
  const ringProg = frame.ringProgress ?? (impactBurst ? 0.30 : 0);
  if (ringProg > 0 && handSide !== "none") {
    const isLeft = handSide === "left";
    const ix = isLeft ? (cx - 28) : (cx + 28);
    const iy = cy + 4;
    // 링이 타격점에서 바깥으로 12px -> 42px 크기로 시원하게 퍼짐
    const ringRadius = 12 + ringProg * 30;
    const ringAlpha = Math.max(0, 1.0 - ringProg * 0.92);

    if (ringAlpha > 0.02) {
      targetCtx.save();
      // 순백색 메인 링
      targetCtx.strokeStyle = `rgba(255, 255, 255, ${ringAlpha})`;
      targetCtx.lineWidth = Math.max(1.2, 3.0 * (1.0 - ringProg * 0.45));
      targetCtx.beginPath();
      targetCtx.arc(ix, iy, ringRadius, 0, Math.PI * 2);
      targetCtx.stroke();

      // 내부 은은한 순백 하이라이트 림
      if (ringProg < 0.6) {
        targetCtx.strokeStyle = `rgba(255, 255, 255, ${ringAlpha * 0.55})`;
        targetCtx.lineWidth = 1.4;
        targetCtx.beginPath();
        targetCtx.arc(ix, iy, ringRadius * 0.68, 0, Math.PI * 2);
        targetCtx.stroke();
      }
      targetCtx.restore();
    }
  }

  // ==========================================================================
  // 4. Slap Impact Hit Bursts at Contact Point (배 타격 순간 난동 코믹 버스트 & 별빛)
  // ==========================================================================
  if (impactBurst && handSide !== "none") {
    const isLeft = handSide === "left";
    const ix = isLeft ? (cx - 28) : (cx + 28);
    const iy = cy + 4;
    const burstR = (drumBeat === 4) ? 30 : (drumBeat === 3 ? 26 : 22);

    // 1) 난동부리기 8각 골든-앰버 코믹 스타버스트
    drawGen5ComicHitBurst(targetCtx, ix, iy, burstR, 1.0);

    // 2) 난동부리기 4각 다이아몬드 스파클 별빛 비산
    drawSparkleStars(targetCtx, ix, iy, (drumBeat === 4 ? 7 : 5), 22, 1.0);
  }

  // ==========================================================================
  // 4. Karate Chop Palms (태권당수 손바닥: 좌-우-좌-우 세로로 세워진 배 때리기)
  //    ⚠️ 유저 지시 반영: 손 위치를 양옆으로 더 넓혀 시원한 타격감 확보
  // ==========================================================================
  if (handAlpha > 0.01 && handSide !== "none") {
    const karateImg = getKarateBlackImg();
    if (karateImg) {
      const sw = 80 * 1.02;
      const sh = 60 * 1.02;

      targetCtx.save();
      targetCtx.globalAlpha = handAlpha;

      if (handSide === "left") {
        // 왼손: 좌측 외곽에서 세로로 우뚝 세워져 복부 방향으로 찰싹!
        const hx = cx - 38;
        const hy = cy + 4;
        targetCtx.translate(hx, hy);
        targetCtx.rotate(Math.PI / 2 - 0.15);
        targetCtx.drawImage(karateImg, -sw / 2, -sh / 2, sw, sh);
      } else if (handSide === "right") {
        // 오른손: 우측 외곽에서 세로로 우뚝 세워져(수평 반전) 복부 방향으로 찰싹!
        const hx = cx + 38;
        const hy = cy + 4;
        targetCtx.translate(hx, hy);
        targetCtx.scale(-1.0, 1.0);
        targetCtx.rotate(Math.PI / 2 - 0.15);
        targetCtx.drawImage(karateImg, -sw / 2, -sh / 2, sw, sh);
      }

      targetCtx.restore();
    }
  }

  targetCtx.restore();
}

// ============================================================================
// 💣 188: 오물폭탄 (Sludge Bomb)
// ============================================================================

/**
 * 포물선 궤적 좌표 계산 헬퍼
 */
function getSludgeBombParabolaPos(
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  p: number,
  arcHeight: number = 105
): { x: number; y: number } {
  const clampedP = Math.min(1.0, Math.max(0.0, p));
  const x = startX + (targetX - startX) * clampedP;
  const straightY = startY + (targetY - startY) * clampedP;
  const arcY = Math.sin(clampedP * Math.PI) * arcHeight;
  return { x, y: straightY - arcY };
}

/**
 * 포물선 궤적 접선(비행 진행 방향) 각도 계산 헬퍼
 */
function getSludgeBombTangentAngle(
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  p: number,
  arcHeight: number = 105
): number {
  const clampedP = Math.min(1.0, Math.max(0.0, p));
  const dx = targetX - startX;
  const dy = (targetY - startY) - Math.cos(clampedP * Math.PI) * Math.PI * arcHeight;
  return Math.atan2(dy, dx);
}

/**
 * 💨 볼류메트릭 독가스 퍼프 (Volumetric Toxic Gas Puff)
 * - 심연의 흑자색 코어 -> 고밀도 바이올렛 -> 연무 외곽 그라데이션
 */
function drawSludgeBombGasPuff(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number = 1.0,
  isDense: boolean = false
) {
  if (alpha <= 0.01 || radius <= 1) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  if (isDense) {
    // 뭉쳐져 있는 짙고 묵직한 고농도 독가스
    grad.addColorStop(0.00, "rgba(28, 4, 42, 0.98)");
    grad.addColorStop(0.35, "rgba(48, 8, 72, 0.90)");
    grad.addColorStop(0.68, "rgba(88, 28, 135, 0.65)");
    grad.addColorStop(0.88, "rgba(126, 34, 206, 0.35)");
    grad.addColorStop(1.00, "rgba(147, 51, 234, 0.0)");
  } else {
    // 부드러운 대기 비산 독가스 연무
    grad.addColorStop(0.00, "rgba(40, 8, 60, 0.85)");
    grad.addColorStop(0.40, "rgba(75, 18, 115, 0.60)");
    grad.addColorStop(0.75, "rgba(126, 34, 206, 0.30)");
    grad.addColorStop(1.00, "rgba(168, 85, 247, 0.0)");
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 🟣 순수 스모그 가스로 뭉쳐진 오물폭탄 독가스 덩어리 (Billowing Smog Bomb Blob)
 * - [유저 피드백 엄수]: 번들거리는 물풍선/액체 껍질/하이라이트 선 완전 제거!
 * - 스모그 124번의 꿀렁이는 고밀도 유기적 스모그 가스 뭉치(drawToxicGasPuff) 구조 100% 적용
 * - 심연 흑자색 고밀도 코어 + 꿀렁이며 회전하는 5개 외곽 스모그 로브 + 후방 스모그 연무 + 선두 능선 라이트 바이올렛 스모그 층
 */
function drawSludgeBombSmogLump(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  tangentAngle: number,
  flightProg: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || radius <= 1) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.translate(cx, cy);
  ctx.rotate(tangentAngle);

  // 탄도 비행 속도감에 따른 미세한 타원 변형 (Squash & Stretch)
  ctx.scale(1.18, 0.90);

  // 1. 심연 흑자색 고밀도 코어 스모그 퍼프
  const coreR = radius * 0.88;
  drawToxicGasPuff(ctx, 0, 0, coreR, 0.98, "dark");

  // 2. 꿀렁이며 회전하는 5개의 외곽 스모그 로브 (스모그 고유 유기적 가스 뭉침)
  const lobes = 5;
  for (let i = 0; i < lobes; i++) {
    const ang = (i / lobes) * Math.PI * 2 + flightProg * 5.2;
    const dist = radius * 0.45;
    const lx = Math.cos(ang) * dist;
    const ly = Math.sin(ang) * dist;
    const lr = radius * 0.55;

    drawToxicGasPuff(ctx, lx, ly, lr, 0.85, "mid");
  }

  // 3. 후방으로 뻗는 연무 스모그 꼬리 퍼프들
  drawToxicGasPuff(ctx, -radius * 0.50, 0, radius * 0.50, 0.75, "dark");
  drawToxicGasPuff(ctx, -radius * 0.80, 0, radius * 0.40, 0.55, "mid");

  // 4. 선두 능선 라이트 바이올렛 스모그 층 (light)
  drawToxicGasPuff(ctx, radius * 0.28, 0, radius * 0.50, 0.70, "light");
  drawToxicGasPuff(ctx, radius * 0.15, -radius * 0.18, radius * 0.42, 0.60, "light");

  ctx.restore();
}

/**
 * 💨 포물선 비행 및 가스 잔상 렌더링
 * - 유저 요구: "오물덩어리는 가스잔상을 남김"
 * - 오물 덩어리가 날아가며 지나온 궤적 뒤편으로 부드럽게 피어오르는 독가스 잔상 배치
 */
function drawSludgeBombFlightAndTrail(
  ctx: any,
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  p: number,
  arcHeight: number = 105,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || p <= 0 || p >= 1.05) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const curPos = getSludgeBombParabolaPos(startX, startY, targetX, targetY, p, arcHeight);

  // 1. 바닥 타원형 그림자 (높이에 따라 작아지고 연해짐)
  const groundStartY = startY + 24;
  const groundTargetY = targetY + 24;
  const shadowY = groundStartY + (groundTargetY - groundStartY) * p;
  const heightFactor = Math.sin(p * Math.PI);
  const shadowAlpha = Math.max(0.10, 0.38 * (1.0 - heightFactor * 0.48));
  const shadowRx = 16 * (1.0 - heightFactor * 0.32);
  const shadowRy = 6.5 * (1.0 - heightFactor * 0.32);

  ctx.save();
  ctx.fillStyle = `rgba(15, 23, 42, ${shadowAlpha * alpha})`;
  ctx.beginPath();
  ctx.ellipse(curPos.x, shadowY, shadowRx, shadowRy, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. [유저 요구 100% 반영]: 오물덩어리가 남기는 가스 잔상 (Smog Trail Puffs)
  // 뒤쪽 궤적 4개 지점에 스모그 고유 3단 셰이딩(dark/mid/light) 가스 구름이 퐁- 퐁- 피어오르는 잔상
  const trailCount = 4;
  const stepGap = 0.07;
  for (let i = trailCount; i >= 1; i--) {
    const tp = p - i * stepGap;
    if (tp > 0.02) {
      const tPos = getSludgeBombParabolaPos(startX, startY, targetX, targetY, tp, arcHeight);
      const trailAlpha = (0.75 - (i - 1) * 0.16) * alpha;
      const trailRadius = 11.0 + i * 4.2; // 멀어질수록 공기 중으로 팽창
      const trailRise = i * 4.0;         // 상공으로 슬며시 피어오름

      // 스모그 고유 연무 잔상 (drawSmogTrailPuff)
      drawSmogTrailPuff(ctx, tPos.x, tPos.y - trailRise, trailRadius, trailAlpha, i * 2.1 + p * 3.0);
    }
  }

  // 3. 탄도 진행 접선 각도
  const tangentAngle = getSludgeBombTangentAngle(startX, startY, targetX, targetY, p, arcHeight);

  // 4. 선두 스모그 덩어리 본체 (20px 묵직하고 꿀렁이는 유기적 스모그 구체)
  drawSludgeBombSmogLump(ctx, curPos.x, curPos.y, 20.0, tangentAngle, p, alpha);

  ctx.restore();
}

/**
 * 💥 착탄 순간 스모그 타격 (Smog Impact Burst)
 * - 유저 요구: "던져진 오물은 스모그 타격이후..."
 * - 타격 순간 오물 파열 & 스파크 & 사방으로 튀는 오물 파편들
 */
function drawSludgeBombImpactBurst(
  ctx: any,
  cx: number,
  cy: number,
  progress: number
) {
  if (progress > 0.45) return;
  const t = progress / 0.45;
  const alpha = Math.max(0, 1.0 - t);
  if (alpha <= 0.01) return;

  ctx.save();

  // 1. 순백 & 마젠타 코어 충격 섬광
  const flashR = 12 + t * 24;
  const flashGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, flashR);
  flashGrad.addColorStop(0.0, `rgba(255, 255, 255, ${0.95 * alpha})`);
  flashGrad.addColorStop(0.4, `rgba(232, 121, 249, ${0.80 * alpha})`);
  flashGrad.addColorStop(0.7, `rgba(147, 51, 234, ${0.45 * alpha})`);
  flashGrad.addColorStop(1.0, "rgba(107, 33, 168, 0.0)");
  ctx.fillStyle = flashGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, flashR, 0, Math.PI * 2);
  ctx.fill();

  // 2. 사방으로 튀는 끈적한 오물 파편 알갱이들 (Sludge Splatter Droplets)
  const splatterCount = 10;
  for (let i = 0; i < splatterCount; i++) {
    const ang = (i / splatterCount) * Math.PI * 2 + 0.3;
    const dist = (14 + i * 4) * Math.pow(t, 0.75);
    const dropX = cx + Math.cos(ang) * dist;
    // 중력에 의해 살짝 아래로 휨
    const dropY = cy + Math.sin(ang) * dist + t * 12;
    const dropR = Math.max(1, (4.5 - (i % 3)) * (1.0 - t * 0.6));

    ctx.fillStyle = (i % 2 === 0) ? `rgba(59, 7, 100, ${0.92 * alpha})` : `rgba(126, 34, 206, ${0.85 * alpha})`;
    ctx.beginPath();
    ctx.arc(dropX, dropY, dropR, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. 팽창하는 타격 충격파 링 (Shockwave Ring)
  const ringR = 10 + t * 45;
  ctx.strokeStyle = `rgba(216, 180, 254, ${0.85 * alpha})`;
  ctx.lineWidth = Math.max(1.2, 3.2 * (1.0 - t));
  ctx.beginPath();
  ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * 🌫️ 스모그(Smog) 고유 생애주기 기반 가스 클라우드 정보 계산
 * - 유저 요구: "스모그의 뭉쳐진거 참고" ➔ 스모그 123번의 SMOG_BILLOW_CLOUDS 및 drawOrganicToxicCloud 100% 계승
 */
function getSludgeBombSmogCloudInfo(
  c: SmogCloudDef,
  step: number,
  p: number
): { alpha: number; scale: number; riseOffset: number; active: boolean } {
  if (step < 3) return { alpha: 0, scale: 0, riseOffset: 0, active: false };

  // Step 3: 착탄 즉시 전파/폭발적으로 뭉쳐지기 시작
  if (step === 3) {
    const grow = Math.min(1.0, 0.30 + p * 0.70);
    const scale = 0.50 + 0.50 * Math.sin(grow * Math.PI * 0.5);
    const alpha = Math.min(0.96, grow * 1.10);
    return { alpha, scale, riseOffset: 0, active: true };
  }

  // Step 4: 가스가 최고 밀도로 짙게 뭉쳐져 있는 상태 (스모그 고유 롤링 & 전신 차폐)
  if (step === 4) {
    let alpha = 0.96;
    if (c.wave === 1) {
      alpha = Math.max(0.70, 0.96 - p * 0.28);
    } else if (c.wave === 2) {
      alpha = Math.max(0.85, 0.96 - Math.max(0, p - 0.30) * 0.15);
    } else {
      alpha = 0.96;
    }
    return { alpha, scale: 1.0, riseOffset: 0, active: true };
  }

  // Step 5: 상공 분산 소멸 (Wave 1 ➔ Wave 2 ➔ Wave 3 순차 FIFO, 스모그 공식 고증)
  if (step === 5) {
    let alpha = 0;
    let waveRiseMult = 1.0;
    let waveExpandMult = 1.0;

    if (c.wave === 1) {
      alpha = Math.max(0.0, 0.50 * (1.0 - p / 0.55));
      waveRiseMult = 1.25;
      waveExpandMult = 1.40;
    } else if (c.wave === 2) {
      alpha = Math.max(0.0, 0.75 * (1.0 - p / 0.80));
      waveRiseMult = 1.05;
      waveExpandMult = 1.22;
    } else {
      alpha = Math.max(0.0, 0.95 * (1.0 - p));
      waveRiseMult = 0.85;
      waveExpandMult = 1.10;
    }

    const rise = p * 38 * waveRiseMult;
    const scale = (1.0 + p * 0.35) * waveExpandMult;
    return { alpha, scale, riseOffset: rise, active: alpha > 0.01 };
  }

  return { alpha: 0, scale: 0, riseOffset: 0, active: false };
}

/**
 * 인자 파싱 유틸리티 (BattleFrame / EffectDrawContext 객체 또는 분리 인자 지원)
 */
function parseSludgeBombArgs(
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
  let frameObj: any = {};

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
    step = frameObj.moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, frameObj.effectProgress ?? 0.5));
    isP = Boolean(drawCtx.isPlayer);
  }

  return { ax, ay, tx, ty, step, p, isP, frame: frameObj };
}

/**
 * 💣 188: 오물폭탄 (Sludge Bomb) Behind Effect
 * - [스모그 뭉쳐진 연출 고증]: 대상 뒤편에 배치되는 123번 스모그 SMOG_BILLOW_CLOUDS (layer === "behind")
 * - 7로브 다엽형 유기적 독가스 구름(drawOrganicToxicCloud)으로 대상을 입체 포위
 */
export function drawSludgeBombBehindEffect(
  targetCtx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  const { tx, ty, step, p, isP } = parseSludgeBombArgs(
    attackerPosOrFrame,
    targetPosOrDrawCtx,
    moveStep,
    progress,
    isPlayer
  );

  // 스모그 타격(step 3) 및 이후 가스가 뭉쳐져 있는 단계(step 4, 5)에서만 출력
  if (step < 3 || step > 5) return;

  targetCtx.save();
  const targetCenterY = ty - (isP ? 14 : 10);
  const behindClouds = SMOG_BILLOW_CLOUDS.filter(c => c.layer === "behind");

  for (const c of behindClouds) {
    const info = getSludgeBombSmogCloudInfo(c, step, p);
    if (!info.active) continue;

    const swirlFreq = step === 5 ? 1.2 : 2.0;
    const swirlAmp = step === 4 ? 4 : (step === 3 ? 3 : 2);
    const sx = c.dx + Math.sin(p * Math.PI * swirlFreq + c.seed) * swirlAmp;
    const sy = c.dy + Math.cos(p * Math.PI * swirlFreq + c.seed) * swirlAmp;

    // 스모그 공식 다엽형 유기적 독가스 구름 (7개 로브 + 4단 셰이딩)
    drawOrganicToxicCloud(
      targetCtx,
      tx + sx,
      targetCenterY + sy,
      c.r * info.scale,
      info.alpha,
      c.seed,
      info.riseOffset
    );
  }

  targetCtx.restore();
}

/**
 * 💣 188: 오물폭탄 (Sludge Bomb) Front Effect
 *
 * [유저 요구사항 100% 구현 & 스모그 뭉쳐진 연출 계승]:
 * 1. 덩어리 오물을 만들고 (Step 1)
 * 2. 포물선으로 적에게 던짐 (Step 2)
 * 3. 오물덩어리는 가스잔상을 남김 (Step 2, drawSmogTrailPuff)
 * 4. 던져진 오물은 스모그 타격 (Step 3, 파열 충격파 & 오물 파편)
 * 5. 이후 가스가 뭉쳐져있는 듯한 연출 (Step 4, 5: 123번 스모그 SMOG_BILLOW_CLOUDS & drawOrganicToxicCloud 100% 적용)
 */
export function drawSludgeBombEffect(
  targetCtx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx?: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  const { ax, ay, tx, ty, step, p, isP } = parseSludgeBombArgs(
    attackerPosOrFrame,
    targetPosOrDrawCtx,
    moveStep,
    progress,
    isPlayer
  );

  targetCtx.save();

  const launchX = ax + (isP ? 34 : -34);
  const launchY = ay - (isP ? 16 : 12);
  const targetCenterY = ty - (isP ? 14 : 10);

  // --------------------------------------------------------------------------
  // Step 1: 시전자 웅크림 및 스모그 덩어리 응축 생성
  // --------------------------------------------------------------------------
  if (step === 1) {
    const gatherR = 9.0 + p * 11.0; // 9px -> 20px 로 스모그 가스가 꿀렁이며 응축
    const gatherAlpha = Math.min(1.0, 0.40 + p * 0.60);
    drawSludgeBombSmogLump(targetCtx, launchX, launchY, gatherR, 0, p, gatherAlpha);
  }

  // --------------------------------------------------------------------------
  // Step 2: 포물선 고각 투척 비행 & 스모그 연무 가스 잔상 & 바닥 그림자
  // --------------------------------------------------------------------------
  else if (step === 2) {
    drawSludgeBombFlightAndTrail(targetCtx, launchX, launchY, tx, targetCenterY, p, 105, 1.0);
  }

  // --------------------------------------------------------------------------
  // Step 3: 스모그 타격 (착탄 파열, 오물 파편 비산, 충격파) & 스모그 클라우드 개시
  // --------------------------------------------------------------------------
  else if (step === 3) {
    // 1. 착탄 스모그 타격 및 오물 파편 비산
    drawSludgeBombImpactBurst(targetCtx, tx, targetCenterY, p);

    // 2. 타격 직후 즉시 뭉쳐지며 피어오르는 전면 스모그 클라우드
    const frontClouds = SMOG_BILLOW_CLOUDS.filter(c => c.layer === "front");
    for (const c of frontClouds) {
      const info = getSludgeBombSmogCloudInfo(c, step, p);
      if (!info.active) continue;

      const swirlAmp = 3;
      const sx = c.dx + Math.sin(p * Math.PI * 2.0 + c.seed) * swirlAmp;
      const sy = c.dy + Math.cos(p * Math.PI * 2.0 + c.seed) * swirlAmp;

      drawOrganicToxicCloud(
        targetCtx,
        tx + sx,
        targetCenterY + sy,
        c.r * info.scale,
        info.alpha,
        c.seed,
        info.riseOffset
      );
    }
  }

  // --------------------------------------------------------------------------
  // Step 4: [스모그 뭉쳐진 연출]: 스모그 123번 고유 7로브 다엽형 유기적 독가스 클러스터 군집
  // --------------------------------------------------------------------------
  else if (step === 4) {
    const frontClouds = SMOG_BILLOW_CLOUDS.filter(c => c.layer === "front");
    for (const c of frontClouds) {
      const info = getSludgeBombSmogCloudInfo(c, step, p);
      if (!info.active) continue;

      const swirlFreq = 2.0;
      const swirlAmp = 4;
      const sx = c.dx + Math.sin(p * Math.PI * swirlFreq + c.seed) * swirlAmp;
      const sy = c.dy + Math.cos(p * Math.PI * swirlFreq + c.seed) * swirlAmp;

      drawOrganicToxicCloud(
        targetCtx,
        tx + sx,
        targetCenterY + sy,
        c.r * info.scale,
        info.alpha,
        c.seed,
        info.riseOffset
      );
    }
  }

  // --------------------------------------------------------------------------
  // Step 5: 뭉쳐진 스모그 서서히 상공 분산 소멸 (FIFO 순차 승화)
  // --------------------------------------------------------------------------
  else if (step === 5) {
    const frontClouds = SMOG_BILLOW_CLOUDS.filter(c => c.layer === "front");
    for (const c of frontClouds) {
      const info = getSludgeBombSmogCloudInfo(c, step, p);
      if (!info.active) continue;

      const swirlFreq = 1.2;
      const swirlAmp = 2;
      const sx = c.dx + Math.sin(p * Math.PI * swirlFreq + c.seed) * swirlAmp;
      const sy = c.dy + Math.cos(p * Math.PI * swirlFreq + c.seed) * swirlAmp;

      drawOrganicToxicCloud(
        targetCtx,
        tx + sx,
        targetCenterY + sy,
        c.r * info.scale,
        info.alpha,
        c.seed,
        info.riseOffset
      );
    }
  }

  targetCtx.restore();
}

