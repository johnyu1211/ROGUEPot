// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { createCanvas } from "@napi-rs/canvas";
import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawMiniRetroStar, drawStarburstImpact } from "../common/helpers.js";
import { drawRecoveryStarSpiral } from "./move105_108.js";

// ============================================================================
// 🥋 233: 받아던지기 (Vital Throw / あてみなげ) - 격투 타입 물리 기술
//
// 위력: 70 / 명중: — (반드시 명중) / PP: 10 / 우선도: -1 / 접촉: O
// 설명: 상대보다 나중에 공격한다. 그 대신 자신의 공격은 반드시 명중한다.
// ============================================================================

/**
 * 몸통박치기 스타일 작은 날카로운 8각 스타버스트 및 미니 레트로 별 (별만, 작게)
 */
function drawSmallTackleStarBurst(
  ctx: any,
  cx: number,
  cy: number,
  progress: number
) {
  if (progress > 0.45) return;
  const alpha = Math.max(0, 1.0 - progress / 0.45);
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(progress * 0.35);

  // 몸통박치기 이펙트(별만, 작게): 12px -> 17px
  const outerR = 12 + progress * 10;
  const innerR = outerR * 0.42;
  const points = 8;

  ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * alpha})`;
  ctx.strokeStyle = `rgba(253, 224, 71, ${0.95 * alpha})`;
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

  // 사방 비산 미니 레트로 별 (작게)
  const starAngles = [-0.75, 0.55, 1.85, -2.15];
  for (let s = 0; s < starAngles.length; s++) {
    const sa = starAngles[s];
    const sDist = 6 + progress * 24;
    const sx = Math.cos(sa) * sDist;
    const sy = Math.sin(sa) * (sDist * 0.85);
    drawMiniRetroStar(ctx, sx, sy, 4.5 * (1.0 - progress * 0.5), s % 2 === 0 ? "#FFFFFF" : "#FEF08A");
  }

  ctx.restore();
}

/**
 * 속여때리기 기반 점파티클 (몸통박치기 색상: 순백 코어 + 레몬 옐로우 글로우)
 */
function drawGlowingTackleOrb(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number
) {
  if (alpha <= 0.01 || radius <= 0.5) return;
  ctx.save();

  // 1. 외곽 몸통박치기 옐로우/크림 글로우
  const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.55);
  glowGrad.addColorStop(0.00, `rgba(255, 255, 255, ${1.0 * alpha})`);
  glowGrad.addColorStop(0.40, `rgba(254, 240, 138, ${0.95 * alpha})`);
  glowGrad.addColorStop(0.70, `rgba(253, 224, 71, ${0.65 * alpha})`);
  glowGrad.addColorStop(1.00, "rgba(253, 224, 71, 0.0)");

  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.55, 0, Math.PI * 2);
  ctx.fill();

  // 2. 중심부 흰색 구체 코어
  ctx.fillStyle = `rgba(255, 255, 255, ${1.0 * alpha})`;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.68, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawVitalThrowBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  // 후방 이펙트 없음
}

export function drawVitalThrowEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const isP = drawCtx.isPlayer;
  const step = frame.moveStep || 1;
  const p = frame.effectProgress ?? 0;

  if (step === 2) {
    const targetPos = drawCtx.targetPos;
    const targetOffset = isP ? (frame.eOffset ?? { x: 0, y: 0 }) : (frame.pOffset ?? { x: 0, y: 0 });
    const tx = targetPos.x + targetOffset.x;
    const ty = targetPos.y + targetOffset.y;
    const hitProg = frame.hitProgress ?? p;

    ctx.save();

    // 1. 몸통박치기 이펙트 (별만, 작게)
    drawSmallTackleStarBurst(ctx, tx, ty, hitProg);

    // 2. 따라가때리기 스타일 방사형 점파티클 (몸통박치기 색상 적용)
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

        const px = tx + Math.cos(angle) * curDist;
        const py = ty + Math.sin(angle) * curDist;

        // 크기는 퍼지면서 점진적으로 감소
        const baseRadius = 4.8 + (i % 3) * 0.8;
        const radius = Math.max(1.5, baseRadius * (1.0 - hitProg * 0.55));
        const alpha = orbAlpha * (1.0 - (i % 2) * 0.15);

        drawGlowingTackleOrb(ctx, px, py, radius, alpha);
      }
    }

    ctx.restore();
  }
}

// ============================================================================
// ☀️ 234: 아침햇살 (Morning Sun / あさのひざし) - 노말 타입 변화 기술
//
// 위력: — / 명중: — / PP: 5 / 대상: 자신 / 접촉: X
// 설명: 자신의 HP를 회복한다. 맑은 날씨에는 2/3, 비/모래/눈 날씨에는 1/4, 기본 1/2을 회복한다.
//
// [유저 요구사항 100% 반영]:
// 1. 시전 포켓몬 포커싱 (카메라 self 줌)
// 2. 화면에 흰 색깔 필터 25% (전체 화면 25% 순백 오버레이)
// 3. 빛줄기 여러 갈래:
//    - 왼쪽 상단(Top-Left)에서 시작
//    - 왼쪽 상단에 가까운 부분은 흰 색깔 50%
//    - 바깥쪽, 우측 아래(Bottom-Right)로 내려올수록 투명해지게 (그라데이션 소산)
// ============================================================================

export function drawMorningSunBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  // 전면 레이어(drawMorningSunEffect)에서 화면 전체 필터 및 사선 광선을 일괄 합성
}

export function drawMorningSunEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const prog = frame.effectProgress ?? 0;

  // 1. 현재 카메라 변환 매트릭스로부터 뷰포트의 화면 모서리(월드 좌표) 계산
  const logicalW = drawCtx.width || 512;
  const logicalH = drawCtx.height || 384;

  let tl = { x: 0, y: 0 };
  let br = { x: logicalW, y: logicalH };

  try {
    const m = ctx.getTransform();
    const det = m.a * m.d - m.b * m.c;
    if (det && Math.abs(det) > 1e-6) {
      tl = {
        x: (m.d * (0 - m.e) - m.c * (0 - m.f)) / det,
        y: (m.a * (0 - m.f) - m.b * (0 - m.e)) / det,
      };
      const canvasW = ctx.canvas?.width || logicalW;
      const canvasH = ctx.canvas?.height || logicalH;
      br = {
        x: (m.d * (canvasW - m.e) - m.c * (canvasH - m.f)) / det,
        y: (m.a * (canvasH - m.f) - m.b * (canvasW - m.e)) / det,
      };
    }
  } catch {
    tl = { x: -30, y: -20 };
    br = { x: logicalW + 30, y: logicalH + 20 };
  }

  const vw = Math.max(100, br.x - tl.x);
  const vh = Math.max(100, br.y - tl.y);

  // 부드러운 페이드인/페이드아웃 엔벨로프
  let animAlpha = 1.0;
  if (prog < 0.20) {
    animAlpha = Math.sin((prog / 0.20) * (Math.PI / 2));
  } else if (prog > 0.80) {
    animAlpha = Math.sin(((1.0 - prog) / 0.20) * (Math.PI / 2));
  }
  if (animAlpha <= 0.005) return;

  ctx.save();

  // --------------------------------------------------------------------------
  // 1. 화면에 흰 색깔 필터 25% (25% White Screen Overlay Filter)
  // --------------------------------------------------------------------------
  const filterAlpha = 0.25 * animAlpha;
  ctx.fillStyle = `rgba(255, 255, 255, ${filterAlpha})`;
  ctx.fillRect(tl.x - 200, tl.y - 200, vw + 400, vh + 400);

  // --------------------------------------------------------------------------
  // 2. 빛줄기 여러 갈래 (Multiple Crepuscular Rays from Top-Left to Bottom-Right)
  //    - 시작점: 왼쪽 상단 (Top-Left)
  //    - 왼쪽 상단에 가까운 부분: 흰 색깔 50% (rgba(255, 255, 255, 0.50))
  //    - 우측 아래로 내려올수록 투명해지게 (rgba(255, 255, 255, 0.00))
  // --------------------------------------------------------------------------
  const originX = tl.x - vw * 0.03;
  const originY = tl.y - vh * 0.03;

  const baseAngle = Math.atan2(vh, vw); // 대각선 사선 기준각 (~37도)
  const maxDist = Math.hypot(vw, vh) * 1.45; // 화면 전체를 관통하는 충분한 거리

  // 5갈래의 굵고 웅장한 사선 빛줄기 (두께 대폭 강화)
  const rays = [
    { angleOffset: -0.22, spread: 0.13, alpha: 0.88 },
    { angleOffset: -0.11, spread: 0.16, alpha: 1.00 },
    { angleOffset:  0.00, spread: 0.17, alpha: 1.00 },
    { angleOffset:  0.12, spread: 0.15, alpha: 0.95 },
    { angleOffset:  0.23, spread: 0.13, alpha: 0.85 },
  ];

  // 프레임 진행에 따른 자연스러운 미세 광선 시머(Shimmer)
  const shimmer = Math.sin(prog * Math.PI * 2) * 0.010;

  for (let i = 0; i < rays.length; i++) {
    const ray = rays[i];
    const aCenter = baseAngle + ray.angleOffset + shimmer * (i % 2 === 0 ? 1 : -1);
    const halfSpread = ray.spread * 0.5;
    const a1 = aCenter - halfSpread;
    const a2 = aCenter + halfSpread;

    // 1) 굵직한 메인 광선 빔 (Main Broad Beam)
    const nearR = 10;
    const nx1 = originX + Math.cos(a1) * nearR;
    const ny1 = originY + Math.sin(a1) * nearR;
    const nx2 = originX + Math.cos(a2) * nearR;
    const ny2 = originY + Math.sin(a2) * nearR;

    const fx1 = originX + Math.cos(a1) * maxDist;
    const fy1 = originY + Math.sin(a1) * maxDist;
    const fx2 = originX + Math.cos(a2) * maxDist;
    const fy2 = originY + Math.sin(a2) * maxDist;

    const midFarX = (fx1 + fx2) * 0.5;
    const midFarY = (fy1 + fy2) * 0.5;

    // 선형 그라데이션: 좌상단(50% 순백) ➔ 우하단(0% 투명)
    const grad = ctx.createLinearGradient(originX, originY, midFarX, midFarY);
    const peakAlpha = 0.50 * animAlpha * ray.alpha;

    grad.addColorStop(0.00, `rgba(255, 255, 255, ${peakAlpha})`);
    grad.addColorStop(0.20, `rgba(255, 255, 255, ${peakAlpha * 0.82})`);
    grad.addColorStop(0.48, `rgba(255, 255, 255, ${peakAlpha * 0.46})`);
    grad.addColorStop(0.78, `rgba(255, 255, 255, ${peakAlpha * 0.15})`);
    grad.addColorStop(1.00, "rgba(255, 255, 255, 0.0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(nx1, ny1);
    ctx.lineTo(fx1, fy1);
    ctx.lineTo(fx2, fy2);
    ctx.lineTo(nx2, ny2);
    ctx.closePath();
    ctx.fill();

    // 2) 광선 중심부 농도 보강 코어 빔 (Dense Center Core for Thickness Presence)
    const coreSpread = halfSpread * 0.50;
    const ca1 = aCenter - coreSpread;
    const ca2 = aCenter + coreSpread;

    const cnx1 = originX + Math.cos(ca1) * nearR;
    const cny1 = originY + Math.sin(ca1) * nearR;
    const cnx2 = originX + Math.cos(ca2) * nearR;
    const cny2 = originY + Math.sin(ca2) * nearR;

    const cfx1 = originX + Math.cos(ca1) * maxDist;
    const cfy1 = originY + Math.sin(ca1) * maxDist;
    const cfx2 = originX + Math.cos(ca2) * maxDist;
    const cfy2 = originY + Math.sin(ca2) * maxDist;

    const coreMidFarX = (cfx1 + cfx2) * 0.5;
    const coreMidFarY = (cfy1 + cfy2) * 0.5;

    const coreGrad = ctx.createLinearGradient(originX, originY, coreMidFarX, coreMidFarY);
    const corePeak = 0.20 * animAlpha * ray.alpha;

    coreGrad.addColorStop(0.00, `rgba(255, 255, 255, ${corePeak})`);
    coreGrad.addColorStop(0.22, `rgba(255, 255, 255, ${corePeak * 0.75})`);
    coreGrad.addColorStop(0.52, `rgba(255, 255, 255, ${corePeak * 0.35})`);
    coreGrad.addColorStop(1.00, "rgba(255, 255, 255, 0.0)");

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.moveTo(cnx1, cny1);
    ctx.lineTo(cfx1, cfy1);
    ctx.lineTo(cfx2, cfy2);
    ctx.lineTo(cnx2, cny2);
    ctx.closePath();
    ctx.fill();
  }

  // --------------------------------------------------------------------------
  // 3. 왼쪽 상단 발원지 온화한 순백 방사 코로나 (Top-Left Sun Corona)
  //    - 좌상단 50% 순백 광원을 자연스럽게 감싸는 소프트 방사 그라데이션
  // --------------------------------------------------------------------------
  const coronaR = Math.min(vw, vh) * 0.50;
  const coronaGrad = ctx.createRadialGradient(originX, originY, 0, originX, originY, coronaR);
  const coronaPeak = 0.50 * animAlpha;
  coronaGrad.addColorStop(0.00, `rgba(255, 255, 255, ${coronaPeak})`);
  coronaGrad.addColorStop(0.25, `rgba(255, 255, 255, ${coronaPeak * 0.60})`);
  coronaGrad.addColorStop(0.60, `rgba(255, 255, 255, ${coronaPeak * 0.20})`);
  coronaGrad.addColorStop(1.00, "rgba(255, 255, 255, 0.0)");

  ctx.fillStyle = coronaGrad;
  ctx.beginPath();
  ctx.arc(originX, originY, coronaR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ============================================================================
// 🍃 235: 광합성 (Synthesis / こうごうせい) - 풀 타입 변화 기술
//
// 위력: — / 명중: — / PP: 5 / 대상: 자신 / 접촉: X
// 설명: 빛을 흡수하여 자신의 HP를 회복한다. 날씨에 따라 회복량이 변한다.
//
// [연출 기승전결 시퀀스]:
// 1. 기/승(Step 1): 시전 포켓몬 중앙에 순백의 발광 원이 생기고,
//    해당 원에서 안쪽은 흰 색깔, 바깥쪽은 투명한 빛줄기들이 불규칙하게(성스러운 불꽃 메커니즘)
//    다방면으로 뿜어져 나오면서 밖으로 나가며 페이드아웃.
// 2. 전/결(Step 2): 빛줄기 소산 후 HP 회복 기술 회복 애니메이션(나선 회복별 엠블럼 승화) 재생.
// ============================================================================

export function drawSynthesisBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showBehindEffect && !frame.showEffect) return;
  const step = frame.moveStep || 1;
  if (step !== 1) return;

  const isP = Boolean(drawCtx.isPlayer);
  const casterPos = drawCtx.casterPos || drawCtx.attackerPos || { x: 200, y: 300 };
  const prog = frame.effectProgress || 0;

  ctx.save();
  const cx = casterPos.x;
  const cy = casterPos.y - (isP ? 10 : 8);

  // 시전자 배후 부드러운 순백/태양광 앰비언트 글로우
  const glowR = 25 + Math.sin(prog * Math.PI) * 35;
  const alpha = Math.sin(prog * Math.PI) * 0.35;
  if (alpha > 0.01) {
    const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, glowR);
    grad.addColorStop(0.0, `rgba(255, 255, 255, ${alpha})`);
    grad.addColorStop(0.55, `rgba(255, 255, 240, ${alpha * 0.45})`);
    grad.addColorStop(1.0, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * 광합성 - 시전 포켓몬 중앙 순백 원 & 안쪽 흰색, 바깥쪽 투명한 불규칙 빛줄기 분출
 * [유저 요청 완벽 반영]:
 * 1. 시전 포켓몬 중간에 흰 색깔 원 생성
 * 2. 원에서 안쪽은 흰 색깔, 바깥쪽은 투명한 빛줄기 같은 게 불규칙하게 뿜어져 나옴 (성스러운 불꽃 메커니즘 참고)
 * 3. 뿜어져 나온다는 것은 밖으로 나가면서 페이드아웃 한다는 것
 */
function drawSynthesisWhiteCoreAndRays(
  ctx: any,
  cx: number,
  cy: number,
  prog: number
) {
  if (prog < 0 || prog > 1.0) return;

  ctx.save();

  // ---------------------------------------------------------------------------
  // 1. 시전 포켓몬 중간 순백의 원 (Center White Circle)
  // ---------------------------------------------------------------------------
  const baseRadius = 20;
  let circleScale = 1.0;
  let circleAlpha = 1.0;

  if (prog < 0.12) {
    // 0.00 ~ 0.12: 빠르게 피어남 (스케일 0 -> 1, 페이드인 0 -> 1)
    const t = prog / 0.12;
    circleScale = Math.sin(t * Math.PI * 0.5);
    circleAlpha = circleScale;
  } else if (prog <= 0.75) {
    // 0.12 ~ 0.75: 안정적으로 빛나며 미세한 호흡 펄스
    circleScale = 1.0 + Math.sin((prog - 0.12) * Math.PI * 6) * 0.035;
    circleAlpha = 1.0;
  } else if (prog <= 0.90) {
    // 0.75 ~ 0.90: 마지막 빛줄기들이 뿜어져 나가면서 원이 수축 및 페이드아웃
    const t = (prog - 0.75) / 0.15;
    circleScale = Math.max(0, 1.0 - t);
    circleAlpha = Math.max(0, 1.0 - t);
  } else {
    // 0.90 ~ 1.00: 원 완전 소멸 (남은 빛줄기 잔여 페이드아웃 완료)
    circleAlpha = 0;
  }

  const curRadius = baseRadius * circleScale;

  if (circleAlpha > 0.01 && curRadius > 0.5) {
    // 1-1. 외곽 은은한 순백 림 글로우
    const outerR = curRadius * 1.6;
    const outerGrad = ctx.createRadialGradient(cx, cy, curRadius * 0.4, cx, cy, outerR);
    outerGrad.addColorStop(0, `rgba(255, 255, 255, ${circleAlpha * 0.55})`);
    outerGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = outerGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.fill();

    // 1-2. 메인 순백 구체 원
    const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, curRadius);
    innerGrad.addColorStop(0.0, `rgba(255, 255, 255, ${circleAlpha * 1.0})`);
    innerGrad.addColorStop(0.8, `rgba(255, 255, 255, ${circleAlpha * 0.98})`);
    innerGrad.addColorStop(1.0, `rgba(255, 255, 255, ${circleAlpha * 0.90})`);
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, curRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---------------------------------------------------------------------------
  // 2. 안쪽은 흰 색깔, 바깥쪽은 투명한 불규칙 순차 빛줄기 분출 (Irregular Light Rays)
  // [성스러운 불꽃(Sacred Fire) 메커니즘 고증]:
  // - 시계방향 순환 배제, 대각선 및 직교 교차(Criss-cross) 분출
  // - 시차를 두고 불규칙하게 순차 분출
  // - 원에서 출발하여 밖으로 뻗어나가며 지수 곡선 페이드아웃
  // ---------------------------------------------------------------------------
  interface RayPlume {
    angle: number;
    delay: number;
    duration: number;
    maxDist: number;
    rayLength: number;
    rayWidth: number;
  }

  const allRays: RayPlume[] = [
    // 1번: 9시 방향 (좌측)
    { angle: -Math.PI * 0.95, delay: 0.02, duration: 0.23, maxDist: 145, rayLength: 105, rayWidth: 16 },
    // 2번: 2시 방향 (우상단 대각 교차!)
    { angle: -Math.PI * 0.22, delay: 0.07, duration: 0.24, maxDist: 165, rayLength: 120, rayWidth: 18 },
    // 3번: 6시 방향 (하단 수직 교차!)
    { angle:  Math.PI * 0.52, delay: 0.12, duration: 0.23, maxDist: 135, rayLength: 95,  rayWidth: 15 },
    // 4번: 11시 방향 (좌상단 대각 교차!)
    { angle: -Math.PI * 0.72, delay: 0.18, duration: 0.24, maxDist: 160, rayLength: 115, rayWidth: 17 },
    // 5번: 4시 방향 (우하단 대각 교차!)
    { angle:  Math.PI * 0.32, delay: 0.23, duration: 0.23, maxDist: 140, rayLength: 100, rayWidth: 16 },
    // 6번: 8시 방향 (좌하단 대각 교차!)
    { angle:  Math.PI * 0.78, delay: 0.28, duration: 0.24, maxDist: 138, rayLength: 98,  rayWidth: 16 },
    // 7번: 1시 방향 (우상단 대각 교차!)
    { angle: -Math.PI * 0.15, delay: 0.34, duration: 0.25, maxDist: 170, rayLength: 125, rayWidth: 19 },
    // 8번: 12시 방향 (상단 수직 솟구침!)
    { angle: -Math.PI * 0.50, delay: 0.39, duration: 0.25, maxDist: 175, rayLength: 130, rayWidth: 19 },
    // 9번: 5시 방향 (우하단 교차!)
    { angle:  Math.PI * 0.40, delay: 0.45, duration: 0.24, maxDist: 150, rayLength: 110, rayWidth: 17 },
    // 10번: 10시 방향 (좌상단 교차!)
    { angle: -Math.PI * 0.78, delay: 0.50, duration: 0.25, maxDist: 165, rayLength: 120, rayWidth: 18 },
    // 11번: 3시 방향 (우측 수평 교차!)
    { angle:  Math.PI * 0.05, delay: 0.55, duration: 0.24, maxDist: 155, rayLength: 112, rayWidth: 17 },
    // 12번: 7시 방향 (좌하단 교차!)
    { angle:  Math.PI * 0.65, delay: 0.60, duration: 0.24, maxDist: 142, rayLength: 102, rayWidth: 16 },
    // 13번: 12시반 방향 (상단 우측 피날레!)
    { angle: -Math.PI * 0.38, delay: 0.65, duration: 0.25, maxDist: 172, rayLength: 128, rayWidth: 19 },
    // 14번: 9시반 방향 (좌측 상단 피날레!)
    { angle: -Math.PI * 0.88, delay: 0.70, duration: 0.25, maxDist: 162, rayLength: 118, rayWidth: 18 },
  ];

  for (let i = 0; i < allRays.length; i++) {
    const ray = allRays[i];
    const elapsed = prog - ray.delay;
    if (elapsed <= 0 || elapsed >= ray.duration) continue;

    const t = elapsed / ray.duration; // 0.0 ~ 1.0

    // 페이드아웃 알파: 초반 신속 분출 ➔ 지수 곡선으로 빠르게 투명 소산
    const inAlpha = Math.min(1.0, t / 0.14);
    const outAlpha = Math.pow(Math.max(0, 1.0 - t), 1.35);
    const rayAlpha = inAlpha * outAlpha;
    if (rayAlpha <= 0.01) continue;

    const angle = ray.angle;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const nx = -sinA;
    const ny = cosA;

    // 이동 거리: 원 둘레에서 출발하여 밖으로 뻗어나감 (정수 반올림)
    const startDist = Math.round(baseRadius * 0.75);
    const headDist = Math.round(startDist + Math.pow(t, 0.68) * ray.maxDist);
    const tailDist = Math.max(
      Math.round(startDist * 0.5),
      Math.round(headDist - ray.rayLength * (0.45 + 0.55 * Math.sin(t * Math.PI * 0.8)))
    );

    const tx = Math.round(cx + cosA * tailDist);
    const ty = Math.round(cy + sinA * tailDist);
    const hx = Math.round(cx + cosA * headDist);
    const hy = Math.round(cy + sinA * headDist);

    // 밖으로 갈수록 시원하게 퍼지는 부채꼴 폭 설정 (정수 반올림):
    // 안쪽(원 둘레 꼬리): 좁게 모여서 출발
    const wTail = Math.round(6.0 + 3.0 * Math.sin(t * Math.PI));
    // 바깥쪽(선단 머리): 밖으로 갈수록 넓게 확산 (30px ~ 60px+)
    const spreadRatio = Math.pow(t, 0.72);
    const wHead = Math.round(ray.rayWidth * (1.8 + 1.4 * spreadRatio));

    // 사다리꼴 부채꼴(Flaring Ray) 꼭짓점 (정수화)
    const p1x = Math.round(tx + nx * (wTail * 0.5));
    const p1y = Math.round(ty + ny * (wTail * 0.5));
    const p2x = Math.round(hx + nx * (wHead * 0.5));
    const p2y = Math.round(hy + ny * (wHead * 0.5));
    const p3x = Math.round(hx - nx * (wHead * 0.5));
    const p3y = Math.round(hy - ny * (wHead * 0.5));
    const p4x = Math.round(tx - nx * (wTail * 0.5));
    const p4y = Math.round(ty - ny * (wTail * 0.5));

    // 안쪽은 흰 색깔, 바깥쪽은 투명한 선형 그라데이션
    const grad = ctx.createLinearGradient(tx, ty, hx, hy);
    grad.addColorStop(0.00, `rgba(255, 255, 255, ${rayAlpha * 0.95})`);
    grad.addColorStop(0.20, `rgba(255, 255, 255, ${rayAlpha * 0.88})`);
    grad.addColorStop(0.55, `rgba(255, 255, 255, ${rayAlpha * 0.42})`);
    grad.addColorStop(0.85, `rgba(255, 255, 255, ${rayAlpha * 0.10})`);
    grad.addColorStop(1.00, "rgba(255, 255, 255, 0)");

    // 1) 메인 확산 빛줄기 (Flaring Beam)
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(p1x, p1y);
    ctx.lineTo(p2x, p2y);
    // 선단부를 부드럽게 라운딩 돌출 (머리 끝이 둥글게 퍼지도록)
    const tipX = Math.round(hx + cosA * (wHead * 0.22));
    const tipY = Math.round(hy + sinA * (wHead * 0.22));
    ctx.quadraticCurveTo(tipX, tipY, p3x, p3y);
    ctx.lineTo(p4x, p4y);
    ctx.closePath();
    ctx.fill();

    // 2) 중심부 고밀도 내부 코어 빔 (동일하게 밖으로 퍼지지만 더 슬림하고 밝음, 정수화)
    const coreWTail = Math.round(wTail * 0.6);
    const coreWHead = Math.round(wHead * 0.45);
    const cp1x = Math.round(tx + nx * (coreWTail * 0.5));
    const cp1y = Math.round(ty + ny * (coreWTail * 0.5));
    const cp2x = Math.round(hx + nx * (coreWHead * 0.5));
    const cp2y = Math.round(hy + ny * (coreWHead * 0.5));
    const cp3x = Math.round(hx - nx * (coreWHead * 0.5));
    const cp3y = Math.round(hy - ny * (coreWHead * 0.5));
    const cp4x = Math.round(tx - nx * (coreWTail * 0.5));
    const cp4y = Math.round(ty - ny * (coreWTail * 0.5));

    const coreGrad = ctx.createLinearGradient(tx, ty, hx, hy);
    coreGrad.addColorStop(0.00, `rgba(255, 255, 255, ${rayAlpha * 1.0})`);
    coreGrad.addColorStop(0.25, `rgba(255, 255, 255, ${rayAlpha * 0.95})`);
    coreGrad.addColorStop(0.65, `rgba(255, 255, 255, ${rayAlpha * 0.35})`);
    coreGrad.addColorStop(1.00, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.moveTo(cp1x, cp1y);
    ctx.lineTo(cp2x, cp2y);
    ctx.lineTo(cp3x, cp3y);
    ctx.lineTo(cp4x, cp4y);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

export function drawSynthesisEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const isP = Boolean(drawCtx.isPlayer);
  const casterPos = drawCtx.casterPos || drawCtx.attackerPos || { x: 200, y: 300 };
  const step = frame.moveStep || 1;
  const prog = frame.effectProgress || 0;

  ctx.save();
  const cx = casterPos.x;
  const cy = casterPos.y - (isP ? 10 : 8);

  // [Step 1: 시전 포켓몬 중간 순백 원 생성 & 안쪽 흰색, 바깥쪽 투명한 불규칙 빛줄기 분출]
  if (step === 1) {
    drawSynthesisWhiteCoreAndRays(ctx, cx, cy, prog);
  }
  // [Step 2: HP 회복 기술 회복 애니메이션 (Recovery Star Spiral)]
  else if (step === 2) {
    drawRecoveryStarSpiral(ctx, cx, cy, prog);
  }

  ctx.restore();
}

// ============================================================================
// ============================================================================
// 🌙 236: 달빛 (Moonlight / つきのひかり) - 페어리 타입 변화 기술
//
// 위력: — / 명중: — / PP: 5 / 대상: 자신 / 접촉: X
// 설명: 달의 빛을 받아 자신의 HP를 회복한다. 날씨에 따라 회복량이 변한다.
//
// [유저 요구사항 100% 반영]:
// 1. 카메라가 대상 포켓몬보다 살짝 위를 포커싱하다가 빛줄기가 내려오는 것을
//    포커싱하면서 대상 포켓몬을 포커싱.
// 2. 하늘색 빛줄기: 윗쪽은 50% 반투명, 아래로 내려올수록 투명해지는 빛줄기가 아래로 내려옴.
// 3. 빛줄기는 아래로 내려올수록 각도가 퍼짐 (사다리꼴 콘 빔).
// 4. 각도가 퍼지는 바닥 너비는 대상 포켓몬 바닥 플랫폼을 넘어서지 않고, 그보다 많이 작게,
//    웬만한 포켓몬들 스프라이트보다는 크게 (~114px).
// 5. 바닥에 빛에 의한 타원형 빛무리(Floor Elliptical Illumination) 생성.
// ============================================================================

/**
 * 바닥 타원형 빛무리 (Floor Elliptical Illumination)
 * - 등각 배틀필드 원근법에 맞춘 가로 타원 (rx: 54px, ry: 19.5px)
 * - 포켓몬 바닥 플랫폼(180~240px)을 넘지 않고, 스프라이트(65~85px)보다 넓게 감쌈
 */
function drawMoonlightFloorSpot(
  ctx: any,
  cx: number,
  groundY: number,
  intensity: number,
  rippleProg: number,
  isP: boolean = true
) {
  if (intensity <= 0.005) return;

  ctx.save();
  const baseRx = isP ? 54 : 40;
  const baseRy = isP ? 19.5 : 14.5;
  const rx = baseRx * Math.min(1.0, 0.3 + intensity * 0.7);
  const ry = baseRy * Math.min(1.0, 0.3 + intensity * 0.7);

  ctx.translate(cx, groundY);

  // 1. 바닥 타원 방사형 그라데이션 풀 (Elliptical Light Pool)
  ctx.save();
  ctx.scale(1.0, ry / rx);

  const spotGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  spotGrad.addColorStop(0.00, `rgba(224, 242, 254, ${0.48 * intensity})`);
  spotGrad.addColorStop(0.35, `rgba(186, 230, 253, ${0.36 * intensity})`);
  spotGrad.addColorStop(0.70, `rgba(147, 197, 253, ${0.16 * intensity})`);
  spotGrad.addColorStop(1.00, "rgba(147, 197, 253, 0.0)");

  ctx.fillStyle = spotGrad;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * 하늘색 하강 빛줄기 (Sky-Blue Descending Beam)
 * - 윗쪽은 50% 반투명, 아래로 내려올수록 투명해지는 빛줄기
 * - 아래로 내려올수록 각도가 퍼짐 (사다리꼴 콘 빔)
 * - 바닥 너비: 플레이어 ~114px, 상대 ~86px (원근법 반영)
 */
function drawMoonlightSkyBlueBeam(
  ctx: any,
  cx: number,
  groundY: number,
  beamProg: number,
  alpha: number,
  shimmer: number,
  widthScale: number = 1.0,
  isP: boolean = true
) {
  if (alpha <= 0.005 || beamProg <= 0.01 || widthScale <= 0.005) return;

  const beamTopY = groundY - 330; // 상공 높은 지점에서 시작 (길이 연장: 330px)
  const totalH = groundY - beamTopY;
  const curBottomY = beamTopY + totalH * Math.min(1.0, beamProg);

  // [원근감 및 유저 요청 반영]: 플레이어는 114px, 상대는 86px (원근법에 맞춤)
  const baseBottomW = isP ? 114 : 86;
  const baseTopW = isP ? 32 : 24;
  const topW = (baseTopW + shimmer * 1.5) * widthScale;
  const bottomW = (baseBottomW + shimmer * 3) * widthScale;

  const currentBottomProgress = (curBottomY - beamTopY) / totalH;
  const curBottomW = topW + (bottomW - topW) * currentBottomProgress;

  ctx.save();

  // 1. 메인 하늘색 빛줄기 (사다리꼴 빔)
  const x1 = cx - topW * 0.5;
  const y1 = beamTopY;
  const x2 = cx + topW * 0.5;
  const y2 = beamTopY;
  const x3 = cx + curBottomW * 0.5;
  const y3 = curBottomY;
  const x4 = cx - curBottomW * 0.5;
  const y4 = curBottomY;

  // 선형 그라데이션: 상단(50% 반투명 하늘색) -> 하단(투명)
  const grad = ctx.createLinearGradient(cx, beamTopY, cx, curBottomY);
  const peakAlpha = 0.50 * alpha; // [유저 요청]: 윗쪽은 50% 반투명
  grad.addColorStop(0.00, `rgba(186, 230, 253, ${peakAlpha})`);
  grad.addColorStop(0.28, `rgba(165, 215, 252, ${peakAlpha * 0.75})`);
  grad.addColorStop(0.60, `rgba(147, 197, 253, ${peakAlpha * 0.35})`);
  grad.addColorStop(0.88, `rgba(147, 197, 253, ${peakAlpha * 0.08})`);
  grad.addColorStop(1.00, "rgba(147, 197, 253, 0.0)"); // [유저 요청]: 아래로 내려올수록 투명해짐

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.lineTo(x4, y4);
  ctx.closePath();
  ctx.fill();

  // 2. 중심부 고밀도 코어 빔 (맑고 은은한 청백색/하늘색 코어)
  const coreTopW = topW * 0.46;
  const coreBottomW = curBottomW * 0.46;
  const cx1 = cx - coreTopW * 0.5;
  const cx2 = cx + coreTopW * 0.5;
  const cx3 = cx + coreBottomW * 0.5;
  const cx4 = cx - coreBottomW * 0.5;

  const coreGrad = ctx.createLinearGradient(cx, beamTopY, cx, curBottomY);
  const corePeak = 0.32 * alpha;
  coreGrad.addColorStop(0.00, `rgba(224, 242, 254, ${corePeak})`);
  coreGrad.addColorStop(0.35, `rgba(224, 242, 254, ${corePeak * 0.65})`);
  coreGrad.addColorStop(0.70, `rgba(186, 230, 253, ${corePeak * 0.20})`);
  coreGrad.addColorStop(1.00, "rgba(186, 230, 253, 0.0)");

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.moveTo(cx1, y1);
  ctx.lineTo(cx2, y2);
  ctx.lineTo(cx3, y3);
  ctx.lineTo(cx4, y4);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

let darkMaskCanvas: any = null;
let darkMaskCtx: any = null;

function getDarkMaskCanvas(w: number, h: number) {
  if (!darkMaskCanvas || darkMaskCanvas.width !== w || darkMaskCanvas.height !== h) {
    darkMaskCanvas = createCanvas(w, h);
    darkMaskCtx = darkMaskCanvas.getContext("2d");
  }
  return { canvas: darkMaskCanvas, ctx: darkMaskCtx };
}

/**
 * 달빛(Moonlight) 밤하늘 스포트라이트 암전 (Atmospheric Nighttime Dimming)
 * - 전체 전장을 깊은 밤하늘처럼 짙게 암전 (62%)
 * - [유저 요구사항 100% 반영]:
 *   위에서 내려오는 사다리꼴 빛줄기와 땅 위 바닥 타원까지만 암전이 덜 들어가도록 마스킹하고,
 *   바닥(땅) 아래 및 빛줄기 외곽은 100% 짙은 암전을 유지!
 * - 빛줄기가 얇아질 때 widthScale에 따라 마스킹 구멍도 함께 얇아짐.
 */
function drawMoonlightAtmosphericDarkness(
  mainCtx: any,
  cx: number,
  groundY: number,
  beamProg: number,
  spotIntensity: number,
  darkAlpha: number,
  logicalW: number,
  logicalH: number,
  widthScale: number = 1.0,
  isP: boolean = true
) {
  if (darkAlpha <= 0.005) return;

  const { canvas: maskCanvas, ctx: maskCtx } = getDarkMaskCanvas(logicalW, logicalH);

  // 1. 화면 좌표계로 마스크 캔버스 초기화
  maskCtx.setTransform(1, 0, 0, 1, 0, 0);
  maskCtx.globalCompositeOperation = "source-over";
  maskCtx.clearRect(0, 0, logicalW, logicalH);

  // 2. 전체 화면에 깊은 밤하늘 암전 (62%)
  const maxDark = 0.62 * darkAlpha;
  maskCtx.fillStyle = `rgba(4, 7, 20, ${maxDark})`;
  maskCtx.fillRect(0, 0, logicalW, logicalH);

  // 3. 메인 캔버스의 월드 카메라 변환 행렬을 그대로 복제!
  const m = mainCtx.getTransform();
  maskCtx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);

  // 4. 지우개 모드 (destination-out): 땅 위 빛줄기와 바닥 타원 영역만 지워서 암전을 덜 받게 함!
  maskCtx.globalCompositeOperation = "destination-out";

  const beamTopY = groundY - 330;
  const totalH = groundY - beamTopY;
  // 현재 빛줄기가 내려온 Y (땅 groundY를 절대 넘지 않음!)
  const curBottomY = Math.min(groundY, beamTopY + totalH * Math.min(1.0, beamProg));

  // 4-1. 상공 -> 땅(groundY)까지의 사다리꼴 빛줄기 영역 뚫기
  if (curBottomY > beamTopY + 5 && widthScale > 0.01) {
    const curProg = (curBottomY - beamTopY) / totalH;
    const baseTopW = isP ? 34 : 26;
    const baseBottomW = isP ? 116 : 88;
    const topW = baseTopW * widthScale;
    const curBottomW = (baseTopW + (baseBottomW - baseTopW) * curProg) * widthScale;

    const hwTop = topW * 0.5;
    const hwBottom = curBottomW * 0.5;
    const pad = 10 * widthScale; // 자연스러운 소프트 블러 완충 패딩

    maskCtx.save();
    maskCtx.beginPath();
    maskCtx.moveTo(cx - hwTop - pad * 0.4, beamTopY);
    maskCtx.lineTo(cx + hwTop + pad * 0.4, beamTopY);
    maskCtx.lineTo(cx + hwBottom + pad, curBottomY);
    maskCtx.lineTo(cx - hwBottom - pad, curBottomY);
    maskCtx.closePath();

    // 빛줄기 가로 그라데이션: 중심부는 88% 지움(투명화 -> 암전 영향 12%만 남음), 양끝은 0% 지움
    const beamGrad = maskCtx.createLinearGradient(cx - hwBottom - pad, 0, cx + hwBottom + pad, 0);
    beamGrad.addColorStop(0.00, "rgba(0, 0, 0, 0.0)");
    beamGrad.addColorStop(0.22, "rgba(0, 0, 0, 0.45)");
    beamGrad.addColorStop(0.50, "rgba(0, 0, 0, 0.88)");
    beamGrad.addColorStop(0.78, "rgba(0, 0, 0, 0.45)");
    beamGrad.addColorStop(1.00, "rgba(0, 0, 0, 0.0)");

    maskCtx.fillStyle = beamGrad;
    maskCtx.fill();
    maskCtx.restore();
  }

  // 4-2. 땅 위 바닥 타원형 빛무리 영역 뚫기
  // [유저 요구사항]: 바닥 타원형 형태 내부만 부드럽게 지워지고, 그 아래 땅속은 암전 유지!
  if (spotIntensity > 0.01) {
    maskCtx.save();
    const baseRx = isP ? 56 : 42;
    const baseRy = isP ? 20 : 15;
    const rx = baseRx * Math.min(1.0, 0.3 + spotIntensity * 0.7);
    const ry = baseRy * Math.min(1.0, 0.3 + spotIntensity * 0.7);
    maskCtx.translate(cx, groundY);
    maskCtx.scale(1.0, ry / rx);

    const spotGrad = maskCtx.createRadialGradient(0, 0, 0, 0, 0, rx);
    spotGrad.addColorStop(0.00, `rgba(0, 0, 0, ${0.85 * spotIntensity})`);
    spotGrad.addColorStop(0.50, `rgba(0, 0, 0, ${0.55 * spotIntensity})`);
    spotGrad.addColorStop(0.82, `rgba(0, 0, 0, ${0.20 * spotIntensity})`);
    spotGrad.addColorStop(1.00, "rgba(0, 0, 0, 0.0)");

    maskCtx.fillStyle = spotGrad;
    maskCtx.beginPath();
    maskCtx.arc(0, 0, rx, 0, Math.PI * 2);
    maskCtx.fill();
    maskCtx.restore();
  }

  // 5. 마스크 캔버스를 메인 캔버스에 합성 (화면 좌표계로 덮어씌움)
  mainCtx.save();
  mainCtx.setTransform(1, 0, 0, 1, 0, 0);
  mainCtx.drawImage(maskCanvas, 0, 0);
  mainCtx.restore();
}

/**
 * 달빛 후방 이펙트 (Behind Effect Layer)
 * - 포켓몬 발밑 바닥에 깔리는 타원형 빛무리 (Floor Spot) 렌더링
 */
export function drawMoonlightBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showBehindEffect && !frame.showEffect) return;
  const isP = Boolean(drawCtx.isPlayer);
  const casterPos = drawCtx.casterPos || drawCtx.attackerPos || (isP ? { x: 150, y: 244 } : { x: 418, y: 116 });
  const cx = casterPos.x;
  // [지면 좌표 정밀 동기화]: 포켓몬 발밑 지면(플랫폼 상단 접촉면) Y 좌표
  // 플레이어: pm.y(280) + 2 = 282, 상대: em.y(152) + 2 = 154
  const baseGroundY = isP
    ? (drawCtx.pm?.y ?? (casterPos.y + 36))
    : (drawCtx.em?.y ?? (casterPos.y + 36));
  const groundY = baseGroundY + 2;
  const logicalW = drawCtx.width || 512;
  const logicalH = drawCtx.height || 384;

  const step = frame.moveStep || 1;
  const prog = frame.effectProgress || 0;

  let darkAlpha = 0.0;
  let beamProg = 1.0;
  let widthScale = 1.0;
  let spotIntensity = 0.0;
  let rippleProg = 0.0;

  if (step === 1) {
    // Step 1: 카메라 상단 진입 & 빛줄기 하강
    darkAlpha = Math.min(1.0, prog * 1.3);
    beamProg = Math.min(1.0, Math.pow(Math.max(0, prog), 1.15));
    widthScale = 1.0;
    if (prog > 0.65) {
      spotIntensity = Math.min(1.0, (prog - 0.65) / 0.35);
    }
  } else if (step === 2) {
    // Step 2: 빛줄기 조명 & 바닥 타원 충만
    darkAlpha = 1.0;
    beamProg = 1.0;
    widthScale = 1.0;
    spotIntensity = 1.0;
    rippleProg = (prog * 1.5) % 1.0;
  } else if (step === 3) {
    // Step 3: [유저 요청] 빗줄기가 얇아지면서 사라짐 (암전 1.0 완벽 유지!)
    darkAlpha = 1.0;
    beamProg = 1.0;
    widthScale = Math.max(0, 1.0 - prog);
    spotIntensity = Math.max(0, 1.0 - prog);
    rippleProg = ((0.5 + prog) * 1.5) % 1.0;
  } else if (step === 4) {
    // Step 4: [유저 요청] 암전 상태에서 HP 회복 애니메이션 재생 (빛줄기/바닥타원 완전 소멸, 암전 1.0 유지!)
    darkAlpha = 1.0;
    beamProg = 0.0;
    widthScale = 0.0;
    spotIntensity = 0.0;
  } else if (step === 5) {
    // Step 5: 암전 서서히 걷히며 카메라 중립 복귀
    darkAlpha = Math.max(0, 1.0 - prog);
    beamProg = 0.0;
    widthScale = 0.0;
    spotIntensity = 0.0;
  }

  // 1. [유저 요구사항 100% 반영]: 배경 스포트라이트 암전 (빛줄기 영역 및 땅 위 바닥 타원만 암전 영향 덜 받음)
  drawMoonlightAtmosphericDarkness(
    ctx,
    cx,
    groundY,
    beamProg,
    spotIntensity,
    darkAlpha * 0.65,
    logicalW,
    logicalH,
    widthScale,
    isP
  );

  // 2. 바닥 타원형 빛무리 렌더링
  if (spotIntensity > 0.005) {
    drawMoonlightFloorSpot(ctx, cx, groundY, spotIntensity, rippleProg, isP);
  }
}

/**
 * 달빛 전방 이펙트 (Front Effect Layer)
 * - 하늘색 반투명 사다리꼴 빛줄기 하강 및 포켓몬 비춤
 * - 빛줄기가 얇아지면서 사라짐 (Step 3)
 * - 암전 상태에서 HP 회복 애니메이션(나선 회복별) 재생 (Step 4)
 */
export function drawMoonlightEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const isP = Boolean(drawCtx.isPlayer);
  const casterPos = drawCtx.casterPos || drawCtx.attackerPos || (isP ? { x: 150, y: 244 } : { x: 418, y: 116 });
  const cx = casterPos.x;
  // [지면 좌표 정밀 동기화]: 포켓몬 발밑 지면(플랫폼 상단 접촉면) Y 좌표
  // 플레이어: pm.y(280) + 2 = 282, 상대: em.y(152) + 2 = 154
  const baseGroundY = isP
    ? (drawCtx.pm?.y ?? (casterPos.y + 36))
    : (drawCtx.em?.y ?? (casterPos.y + 36));
  const groundY = baseGroundY + 2;
  const bodyCenterY = groundY - (isP ? 42 : 32);
  const logicalW = drawCtx.width || 512;
  const logicalH = drawCtx.height || 384;

  const step = frame.moveStep || 1;
  const prog = frame.effectProgress || 0;

  let darkAlpha = 0.0;
  let beamProg = 1.0;
  let beamAlpha = 1.0;
  let widthScale = 1.0;
  let spotIntensity = 0.0;
  let shimmer = Math.sin(prog * Math.PI * 4) * 1.2;

  if (step === 1) {
    // Step 1: 빛줄기 하강 단계 (0.0 -> 1.0)
    const inT = Math.min(1.0, prog / 0.25);
    beamAlpha = inT;
    beamProg = Math.min(1.0, Math.pow(Math.max(0, prog), 1.15));
    darkAlpha = Math.min(1.0, prog * 1.3);
    widthScale = 1.0;
    spotIntensity = prog > 0.65 ? (prog - 0.65) / 0.35 : 0;
  } else if (step === 2) {
    // Step 2: 충만 단계 (온전히 바닥에 닿은 상태 유지)
    beamProg = 1.0;
    beamAlpha = 1.0;
    darkAlpha = 1.0;
    widthScale = 1.0;
    spotIntensity = 1.0;
  } else if (step === 3) {
    // Step 3: [유저 요청] 빗줄기가 얇아지면서 사라짐 (암전 1.0 유지!)
    beamProg = 1.0;
    widthScale = Math.max(0, 1.0 - prog);
    beamAlpha = Math.max(0, 1.0 - Math.pow(prog, 1.2));
    darkAlpha = 1.0;
    spotIntensity = Math.max(0, 1.0 - prog);
  } else if (step === 4) {
    // Step 4: [유저 요청] 암전 상태에서 HP 회복 애니메이션 재생 (빛줄기 0, 암전 1.0 유지!)
    beamProg = 0.0;
    beamAlpha = 0.0;
    widthScale = 0.0;
    spotIntensity = 0.0;
    darkAlpha = 1.0;
  } else if (step === 5) {
    // Step 5: 암전 서서히 걷히며 카메라 중립 복귀
    beamProg = 0.0;
    beamAlpha = 0.0;
    widthScale = 0.0;
    spotIntensity = 0.0;
    darkAlpha = Math.max(0, 1.0 - prog);
  }

  // 1. [유저 요구사항 100% 반영]: 전경 스포트라이트 암전 (빛줄기 영역 및 땅 위 바닥 타원만 암전 영향 덜 받음)
  drawMoonlightAtmosphericDarkness(
    ctx,
    cx,
    groundY,
    beamProg,
    spotIntensity,
    darkAlpha * 0.68,
    logicalW,
    logicalH,
    widthScale,
    isP
  );

  // 2. 하늘색 빛줄기 렌더링 (widthScale 및 isP 원근감 반영)
  if (beamAlpha > 0.005 && widthScale > 0.005) {
    drawMoonlightSkyBlueBeam(ctx, cx, groundY, beamProg, beamAlpha, shimmer, widthScale, isP);
  }

  // 3. 빛줄기 내부 은은한 달빛/별빛 가루 (Starlight Dust) - Step 2 및 Step 3 초반
  if (beamAlpha > 0.05 && widthScale > 0.20 && (step === 2 || step === 3)) {
    const dustProg = step === 2 ? prog * 0.5 : 0.5 + prog * 0.5;
    const numDust = 6;

    for (let s = 0; s < numDust; s++) {
      const sOffset = s / numDust;
      const curT = (dustProg + sOffset) % 1.0;
      const maxW = (32 + curT * 40) * widthScale;
      const dx = cx + Math.sin(s * 3.7 + curT * 2) * maxW * 0.5;
      const dy = (groundY - 310) + curT * 300;
      const pAlpha = Math.sin(curT * Math.PI) * 0.85 * beamAlpha * widthScale;

      if (pAlpha > 0.02) {
        drawMiniRetroStar(ctx, dx, dy, 3.2 * widthScale, `rgba(224, 242, 254, ${pAlpha})`);

        ctx.fillStyle = `rgba(186, 230, 253, ${pAlpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(dx + 2, dy - 1.5, 1.2 * widthScale, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 4. [유저 핵심 요청]: 암전 상태에서 HP 회복 애니메이션 재생 (Step 4)
  if (step === 4) {
    drawRecoveryStarSpiral(ctx, cx, bodyCenterY, prog);
  }
}
