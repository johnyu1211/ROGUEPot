// ============================================================================
// ⚠️ [기술 이펙트 제작 지침 - 256색 팔레트 최적화(Octree Optimizer) 기준]
// 1. 배틀 GIF 렌더러는 Octree Quantizer + useOptimizer (threshold: 85) 기반의
//    256색 팔레트 재사용 표준을 채택하고 있음.
// 2. 기술 제작 시 불필요한 과도한 그라디언트 난사를 지양하고, 256색 팔레트 환경에서
//    선명하게 돋보이는 핵심 고채도 단색/네온 색상 체계 및 30 FPS 규격을 기준으로 제작할 것.
// 3. 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
//    직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { drawStarburstImpact, drawStatDropEffect } from "../common/helpers.js";
import { drawFlamethrowerChargeFlare, drawBillowingFlamePuff } from "./move053_056.js";
import {
  createLightningPoints,
  drawSharpGlowingBolt,
  drawThunderboltPlasmaSphere,
  drawShockwaveRing,
  drawRadiatingTaperedStrands,
  drawElectricSparkEmbers,
} from "./move085_088.js";

/**
 * Gen 1 Moves 081 - 084 Renderers
 *
 * 081: 실뿜기 (String Shot)
 * 082: 용의분노 (Dragon Rage)
 * 083: 회오리불꽃 (Fire Spin)
 * 084: 전기쇼크 (Thunder Shock)
 */

// ============================================================================
// 081: 실뿜기 (String Shot)
// ============================================================================

/**
 * 암전 전체 화면 반투명 오버레이
 */
function drawStringShotDimOverlay(ctx: any, alpha: number) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  ctx.fillRect(-5000, -5000, 12000, 12000);
  ctx.restore();
}

/**
 * 실뿜기 나선 궤적 계산 헬퍼
 * 대상의 몸을 감싸는 3D 나선 좌표를 생성 (가로 반경 radiusX 수축 지원 및 좌우 흔들림 shakeX 반영)
 */
function getStringShotSpiralPoint(
  targetPos: { x: number; y: number },
  u: number, // 0.0 (발목/하단) ~ 1.0 (머리/상단)
  rotOffset: number,
  radiusX: number = 32,
  radiusY: number = 14,
  height: number = 54,
  shakeX: number = 0
) {
  // 3.5바퀴 회전
  const angle = u * Math.PI * 7 + rotOffset;
  const cx = targetPos.x + shakeX;
  const cy = targetPos.y - 4;

  const x = cx + Math.cos(angle) * radiusX * (0.85 + 0.15 * Math.sin(u * Math.PI));
  const z = Math.sin(angle); // z > 0: 앞면, z < 0: 뒷면
  const y = cy + (0.5 - u) * height + z * radiusY * 0.4;

  return { x, y, z, angle };
}

/**
 * 실뿜기 뒤쪽 레이어 (대상 뒤로 돌아가는 살짝 투명한 실 가닥)
 */
export function drawBehindStringShotEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0.5,
  isPlayer: boolean = true
) {
  // 4~7단계: 대상 몸체 실뭉치 속박 중 뒤쪽 가닥 렌더링
  if (moveStep < 4 || moveStep > 7) return;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  let radiusX = 36;
  let shakeX = 0;
  if (moveStep === 4) {
    radiusX = 36 - effectProgress * 6; // 36 -> 30
    shakeX = Math.sin(effectProgress * Math.PI * 6) * 1.5;
  } else if (moveStep === 5) {
    radiusX = 30 - effectProgress * 10; // 30 -> 20 (흔들리며 가로 수축)
    shakeX = Math.sin(effectProgress * Math.PI * 8) * 3.0;
  } else if (moveStep === 6) {
    radiusX = 20 - effectProgress * 7; // 20 -> 13 (타이트한 실뭉치 수축)
    shakeX = Math.sin(effectProgress * Math.PI * 10) * 2.5;
  } else if (moveStep === 7) {
    radiusX = 13;
    shakeX = Math.sin(effectProgress * Math.PI * 4) * 1.0;
  }

  // "살짝 투명함" 반영 (alpha: ~0.72)
  let alpha = 0.72;
  if (moveStep === 4) alpha = 0.72 * Math.min(1.0, effectProgress * 2.0);
  if (moveStep === 7) alpha = Math.max(0.0, 0.72 * (1.0 - effectProgress * 0.9));

  const numStrands = 3;
  const stepsPerStrand = 36;
  const rot = (moveStep - 4) * 0.8 + effectProgress * 0.5;

  for (let s = 0; s < numStrands; s++) {
    const strandOffset = s * ((Math.PI * 2) / numStrands);
    ctx.beginPath();
    let drawing = false;

    for (let i = 0; i <= stepsPerStrand; i++) {
      const u = i / stepsPerStrand;
      const pt = getStringShotSpiralPoint(targetPos, u, rot + strandOffset, radiusX, 14, 54, shakeX);

      if (pt.z < 0) { // 뒷면
        if (!drawing) {
          ctx.moveTo(pt.x, pt.y);
          drawing = true;
        } else {
          ctx.lineTo(pt.x, pt.y);
        }
      } else {
        drawing = false;
      }
    }

    // 뒷면 실 가닥: 살짝 투명한 은회색 (깊이감 부여)
    ctx.strokeStyle = `rgba(148, 163, 184, ${alpha * 0.75})`;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.strokeStyle = `rgba(241, 245, 249, ${alpha * 0.85})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 실뿜기 앞쪽 레이어 메인 렌더러
 * - 1. 암전
 * - 2. 실 (약간 투명한 직선 2가닥 서로 가까운) 적에게 발사
 * - 3. 적에게 닿으면 살짝 투명한 실뭉치 나타남
 * - 4. 흔들리면서 가로가 줄어드는 실뭉치 결박 & 스피드 2랭크 하강
 */
export function drawStringShotEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0.5,
  isPlayer: boolean = true
) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // 1. 암전 오버레이 (페이드인 & 페이드아웃 적용)
  let dimAlpha = 0;
  if (moveStep === 1) {
    // 암전 페이드인: 0.0에서 0.54까지 부드럽게 점증
    dimAlpha = 0.54 * Math.min(1.0, effectProgress * 1.15);
  } else if (moveStep === 2) {
    // 암전 유지 (발사 초반)
    dimAlpha = 0.54;
  } else if (moveStep === 3) {
    // 암전 유지 (비행 쇄도)
    dimAlpha = 0.52;
  } else if (moveStep === 4) {
    // 적 착탄 & 실뭉치 출현과 함께 서서히 페이드아웃 시작: 0.42 -> 0.30
    dimAlpha = Math.max(0.28, 0.42 - effectProgress * 0.14);
  } else if (moveStep === 5) {
    // 흔들리며 가로 수축: 0.28 -> 0.14
    dimAlpha = Math.max(0.12, 0.28 - effectProgress * 0.15);
  } else if (moveStep === 6) {
    // 최대 결박: 0.12 -> 0.02
    dimAlpha = Math.max(0.0, 0.12 - effectProgress * 0.12);
  } else {
    // 디버프 단계(7) 및 완료(8)는 원래 밝기 복구
    dimAlpha = 0;
  }

  if (dimAlpha > 0.02) {
    drawStringShotDimOverlay(ctx, dimAlpha);
  }

  const startX = attackerPos.x + (isPlayer ? 10 : -10);
  const startY = attackerPos.y - 12;
  const targetX = targetPos.x;
  const targetY = targetPos.y - 8;

  // Step 1: 암전 & 시전자 입가 실크 에너지 응축 & 작은 실 뭉치
  if (moveStep === 1) {
    const p = effectProgress;
    const r = 3.5 + p * 5;

    const grad = ctx.createRadialGradient(startX, startY, 1, startX, startY, r);
    grad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    grad.addColorStop(0.6, "rgba(226, 232, 240, 0.7)");
    grad.addColorStop(1, "rgba(203, 213, 225, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(startX, startY, r, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + p * 4;
      const dist = 6 + p * 6;
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.fillRect(startX + Math.cos(a) * dist - 1, startY + Math.sin(a) * dist - 1, 2, 2);
    }
  }

  // Step 2 & 3: 실 (약간 투명한 직선 2가닥 서로 가까운) 적에게 발사
  else if (moveStep === 2 || moveStep === 3) {
    const progress = moveStep === 2 ? effectProgress * 0.55 : 0.55 + effectProgress * 0.45;
    const reach = Math.min(1.0, progress * 1.12);

    const headX = startX + (targetX - startX) * reach;
    const headY = startY + (targetY - startY) * reach;

    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist; // 진행 방향 단위 벡터
    const uy = dy / dist;
    const nx = -dy / dist; // 수직 법선 단위 벡터
    const ny = dx / dist;

    // 서로 가까운 2가닥 직선 간격 (gap = 3.2px, 두 가닥 중심축 간격 6.4px)
    const gap = 3.2;

    // 1번 가닥 기준점 (양쪽 다 서로 연결되어 있지 않음)
    const s1x = startX + nx * gap;
    const s1y = startY + ny * gap;
    const h1x = headX + nx * gap;
    const h1y = headY + ny * gap;

    // 2번 가닥 기준점 (완전 독립적인 가닥)
    const s2x = startX - nx * gap;
    const s2y = startY - ny * gap;
    const h2x = headX - nx * gap;
    const h2y = headY - ny * gap;

    // 1번 직선 가닥 (약간 투명한 순백 실)
    ctx.beginPath();
    ctx.moveTo(s1x, s1y);
    ctx.lineTo(h1x, h1y);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.82)";
    ctx.lineWidth = 1.9;
    ctx.stroke();

    // 2번 직선 가닥 (약간 투명한 순백 실)
    ctx.beginPath();
    ctx.moveTo(s2x, s2y);
    ctx.lineTo(h2x, h2y);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.82)";
    ctx.lineWidth = 1.9;
    ctx.stroke();

    // 앞쪽 형태: 중앙 연결부(원 등) 없이, 양쪽 다 독립적으로 뾰족한 바늘/침 형태
    if (reach > 0.05) {
      const tipLength = 7.0; // 뾰족하게 앞으로 뻗는 침 길이
      const tipHalfWidth = 1.2; // 가닥 폭에 맞춘 기저 반폭 (두 가닥 사이 간격 4.0px 확보)

      // 1번 가닥의 독립된 뾰족한 앞머리
      const tip1X = h1x + ux * tipLength;
      const tip1Y = h1y + uy * tipLength;
      const p1_lX = h1x + nx * tipHalfWidth - ux * 0.5;
      const p1_lY = h1y + ny * tipHalfWidth - uy * 0.5;
      const p1_rX = h1x - nx * tipHalfWidth - ux * 0.5;
      const p1_rY = h1y - ny * tipHalfWidth - uy * 0.5;

      ctx.fillStyle = "rgba(255, 255, 255, 0.90)";
      ctx.beginPath();
      ctx.moveTo(tip1X, tip1Y);
      ctx.lineTo(p1_lX, p1_lY);
      ctx.lineTo(p1_rX, p1_rY);
      ctx.closePath();
      ctx.fill();

      // 2번 가닥의 독립된 뾰족한 앞머리
      const tip2X = h2x + ux * tipLength;
      const tip2Y = h2y + uy * tipLength;
      const p2_lX = h2x + nx * tipHalfWidth - ux * 0.5;
      const p2_lY = h2y + ny * tipHalfWidth - uy * 0.5;
      const p2_rX = h2x - nx * tipHalfWidth - ux * 0.5;
      const p2_rY = h2y - ny * tipHalfWidth - uy * 0.5;

      ctx.fillStyle = "rgba(255, 255, 255, 0.90)";
      ctx.beginPath();
      ctx.moveTo(tip2X, tip2Y);
      ctx.lineTo(p2_lX, p2_lY);
      ctx.lineTo(p2_rX, p2_rY);
      ctx.closePath();
      ctx.fill();

      // 양쪽 첨단 미세 예리한 침 선(0.8px)으로 뾰족함 극대화
      ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(h1x, h1y);
      ctx.lineTo(tip1X + ux * 1.5, tip1Y + uy * 1.5);
      ctx.moveTo(h2x, h2y);
      ctx.lineTo(tip2X + ux * 1.5, tip2Y + uy * 1.5);
      ctx.stroke();
    }
  }

  // Step 4, 5, 6, 7: 적 착탄 시 실뭉치 출현(살짝 투명함) & 흔들리면서 가로가 줄어드는 실뭉치
  else if (moveStep >= 4 && moveStep <= 7) {
    let radiusX = 36;
    let shakeX = 0;
    if (moveStep === 4) {
      radiusX = 36 - effectProgress * 6; // 36 -> 30 (착탄 시 넓게 형성)
      shakeX = Math.sin(effectProgress * Math.PI * 6) * 1.5;
    } else if (moveStep === 5) {
      radiusX = 30 - effectProgress * 10; // 30 -> 20 (흔들리며 가로 수축 1단계)
      shakeX = Math.sin(effectProgress * Math.PI * 8) * 3.0;
    } else if (moveStep === 6) {
      radiusX = 20 - effectProgress * 7; // 20 -> 13 (흔들리며 가로 수축 2단계 - 최대 결박)
      shakeX = Math.sin(effectProgress * Math.PI * 10) * 2.5;
    } else if (moveStep === 7) {
      radiusX = 13;
      shakeX = Math.sin(effectProgress * Math.PI * 4) * 1.0;
    }

    let alpha = 0.75; // "얘도 살짝 투명함"
    if (moveStep === 4) alpha = 0.75 * Math.min(1.0, effectProgress * 2.0);
    if (moveStep === 7) alpha = Math.max(0.0, 0.75 * (1.0 - effectProgress * 0.9));

    const numStrands = 3;
    const stepsPerStrand = 36;
    const rot = (moveStep - 4) * 0.8 + effectProgress * 0.5;

    // 1. 앞면 나선 실 가닥 렌더링 (살짝 투명한 실크 화이트)
    for (let s = 0; s < numStrands; s++) {
      const strandOffset = s * ((Math.PI * 2) / numStrands);
      ctx.beginPath();
      let drawing = false;

      for (let i = 0; i <= stepsPerStrand; i++) {
        const u = i / stepsPerStrand;
        const pt = getStringShotSpiralPoint(targetPos, u, rot + strandOffset, radiusX, 14, 54, shakeX);

        if (pt.z >= 0) { // 앞면
          if (!drawing) {
            ctx.moveTo(pt.x, pt.y);
            drawing = true;
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        } else {
          drawing = false;
        }
      }

      ctx.strokeStyle = `rgba(226, 232, 240, ${alpha * 0.75})`;
      ctx.lineWidth = 2.6;
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.90})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 2. 가로가 줄어들며 묶이는 중심 수축 실매듭/허리 링 (Tightening Waist Ring)
    if (moveStep >= 5 && moveStep <= 7) {
      const ringAlpha = alpha * 0.85;
      ctx.beginPath();
      ctx.ellipse(targetPos.x + shakeX, targetPos.y - 4, radiusX * 0.85, 6, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${ringAlpha})`;
      ctx.lineWidth = 2.0;
      ctx.stroke();
    }

    // 3. Step 7: 실이 칭칭 감긴 상태에서 스피드 2랭크 하강 파티클 연출
    if (moveStep === 7) {
      drawStatDropEffect(ctx, targetPos, effectProgress);
    }
  }

  ctx.restore();
}

// ============================================================================
// 082: 용의분노 (Dragon Rage)
// ============================================================================

/**
 * 1. 파란불꽃 외곽 덩어리 렌더러 (하위 레이어)
 * - 쨍하고 채도 높은 진한 코발트 블루 / 딥 인디고 / 바이올렛
 * - 어두운 검정/먹색 없이 선명하고 쨍하게 발색!
 */
/**
 * 울퉁불퉁하게 타오르는 화염 덩어리(Billowing Flame Puff) 제어점 생성
 * - 완전한 동그라미(원형)를 배제하고, 만화/애니메이션 특유의 5~6개 화염 돌기(Lobes)가 뭉쳐진 유기적 불꽃 덩어리
 * - 앞머리는 도톰하고 후방 꼬리는 1.25배로 자연스럽게 빠지는 풍성한 볼륨감
 */
function getDragonBillowingFlamePoints(
  baseR: number,
  seed: number,
  roll: number,
  isCore: boolean = false
): { x: number; y: number }[] {
  const scale = isCore ? 0.52 : 1.0;
  const R = baseR * scale;
  const SAMPLES = 16;
  const pts: { x: number; y: number }[] = [];

  for (let i = 0; i < SAMPLES; i++) {
    const angle = (i / SAMPLES) * Math.PI * 2;

    // 앞머리(angle=0)는 도톰하고, 후방(angle=PI)은 1.25배로 자연스럽게 늘어나는 유선형
    const aspect = 1.0 + Math.cos(angle) * 0.12 - Math.cos(angle * 0.5) * 0.15;
    // 5~6개의 울퉁불퉁한 화염 돌기(Lobes)로 완전한 원형 형태 완전 탈피
    const bump = 1.0
      + Math.sin(angle * 5 + roll + seed) * 0.16
      + Math.cos(angle * 3 - roll * 0.8) * 0.10
      + Math.sin(angle * 2 + seed * 1.5) * 0.06;

    const r = R * aspect * bump;
    pts.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
    });
  }

  return pts;
}

function traceBillowingContour(ctx: any, pts: { x: number; y: number }[]) {
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
 * 1. 보라빛 푸른 화염 덩어리 렌더러 (하위 레이어)
 * - 동그란 구체가 아니라 5~6개 화염 돌기가 뭉친 울퉁불퉁한 불꽃 덩어리 실루엣
 * - 진하고 쨍한 비비드 코발트/인디고 블루 & 보라빛 오라
 */
function drawDragonBlueFlamePuff(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  flightAngle: number,
  rollAngle: number,
  alpha: number = 1.0,
  seed: number = 0
) {
  if (alpha <= 0.01 || radius <= 2) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.translate(cx, cy);
  ctx.rotate(flightAngle);

  // 1. 외곽 은은한 딥 블루-바이올렛 오라 (넓게 퍼지는 부드러운 투명 페이드)
  const auraPts = getDragonBillowingFlamePoints(radius * 1.32, seed + 2, rollAngle * 0.8, false);
  traceBillowingContour(ctx, auraPts);
  const auraR = radius * 1.45;
  const auraGrad = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, auraR);
  auraGrad.addColorStop(0.0, "rgba(67, 24, 184, 0.45)");  // 짙은 인디고 퍼플
  auraGrad.addColorStop(0.50, "rgba(79, 46, 220, 0.28)"); // 블루-바이올렛
  auraGrad.addColorStop(0.80, "rgba(99, 70, 235, 0.10)");
  auraGrad.addColorStop(1.00, "rgba(99, 70, 235, 0.0)");
  ctx.fillStyle = auraGrad;
  ctx.fill();

  // 2. 메인 화염 덩어리 - 짙고 푸른빛 감도는 딥 바이올렛 방사형 그라데이션
  // - [유저 요청: "살짝 짙고 지금보다는 살짝 파란"]
  // - 묵직하고 깊은 농도의 딥 인디고 코어에 푸른빛이 감도는 선명한 블루-바이올렛 밸런스!
  const flamePts = getDragonBillowingFlamePoints(radius, seed, rollAngle, false);
  traceBillowingContour(ctx, flamePts);

  const maxR = radius * 1.25;
  const flameGrad = ctx.createRadialGradient(0, 0, radius * 0.08, 0, 0, maxR);
  flameGrad.addColorStop(0.0, "rgba(49, 16, 150, 0.98)");   // 중심: 묵직하고 짙은 딥 인디고
  flameGrad.addColorStop(0.30, "rgba(67, 24, 195, 0.94)"); // 중간: 짙으면서도 푸른빛 도는 딥 블루-바이올렛
  flameGrad.addColorStop(0.60, "rgba(88, 48, 225, 0.82)"); // 외곽: 선명한 인디고 퍼플
  flameGrad.addColorStop(0.85, "rgba(109, 74, 240, 0.38)"); // 최외곽: 푸른 기가 감도는 바이올렛
  flameGrad.addColorStop(1.00, "rgba(109, 74, 240, 0.0)");  // 외곽 경계: 완벽한 0% 투명 페이드아웃!
  ctx.fillStyle = flameGrad;
  ctx.fill();

  // 3. 후방으로 흩날리는 미세 불티 파편 2개
  for (let s = 0; s < 2; s++) {
    const spX = -radius * (0.9 + s * 0.4);
    const spY = (s === 0 ? -1 : 1) * radius * (0.55 + Math.sin(seed + s) * 0.2);
    ctx.fillStyle = "rgba(165, 140, 255, 0.85)";
    ctx.fillRect(spX - 1, spY - 1, 2.2, 2.2);
  }

  ctx.restore();
}

/**
 * 2. 노란불꽃 코어 화염 덩어리 렌더러 (상위 레이어)
 * - 파란불꽃 위에 단독으로 얹혀지는 상위 레이어
 * - [유저 요청: "외각 부분들을 투명도그라데이션 적용해봐 ㅈ금 형체가 너무 선명하게 보이잖아"]
 * - 외곽 경계선이 칼로 자른 듯 선명하지 않고, 중심에서 샛노랗게 빛나다 외곽으로 갈수록 투명 페이드아웃!
 */
function drawDragonYellowCorePuff(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  flightAngle: number,
  rollAngle: number,
  alpha: number = 1.0,
  seed: number = 0
) {
  if (alpha <= 0.01 || radius <= 2) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.translate(cx, cy);
  ctx.rotate(flightAngle);

  // 메인 노란 코어 화염 패스 (약 52% 크기로 파란불꽃 중심에 얹힘)
  const corePts = getDragonBillowingFlamePoints(radius, seed, rollAngle, true);
  traceBillowingContour(ctx, corePts);

  const coreR = radius * 0.52;
  const coreMaxR = coreR * 1.25;
  // 중심에서 외곽으로 완벽하게 투명해지는 방사형 그라디언트
  const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreMaxR);
  coreGrad.addColorStop(0.0, "#FFFFFF");                     // 중심 초고열 백열
  coreGrad.addColorStop(0.25, "rgba(254, 240, 138, 0.98)"); // 밝은 황금 노랑
  coreGrad.addColorStop(0.60, "rgba(250, 204, 21, 0.72)");  // 샛노랑
  coreGrad.addColorStop(0.82, "rgba(234, 179, 8, 0.25)");   // 외곽 앰버
  coreGrad.addColorStop(1.00, "rgba(234, 179, 8, 0.0)");    // 외곽 경계: 완벽한 0% 투명 페이드 (테두리 칼선 소멸!)
  ctx.fillStyle = coreGrad;
  ctx.fill();

  // 중심 초고열 백열 코어 하이라이트 (어느 각도로 회전해도 중심 대칭 유지)
  ctx.save();
  const hlGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR * 0.48);
  hlGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.98)");
  hlGrad.addColorStop(0.45, "rgba(254, 240, 138, 0.70)");
  hlGrad.addColorStop(1.00, "rgba(250, 204, 21, 0.0)");
  ctx.fillStyle = hlGrad;
  ctx.beginPath();
  ctx.arc(0, 0, coreR * 0.48, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * 용의분노 축선 기체 빔 (선 없이 순수 부드러운 기체 대역)
 */
function drawDragonThermalStream(
  ctx: any,
  ax: number,
  ay: number,
  tx: number,
  ty: number,
  startP: number,
  endP: number,
  alpha: number = 1.0,
  frameStep: number = 1
) {
  if (alpha <= 0.01 || endP <= startP) return;

  const dx = tx - ax;
  const dy = ty - ay;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;

  const SAMPLES = 10;
  const centerPts: { x: number; y: number }[] = [];
  const topPtsViolet: { x: number; y: number }[] = [];
  const botPtsViolet: { x: number; y: number }[] = [];
  const topPtsYellow: { x: number; y: number }[] = [];
  const botPtsYellow: { x: number; y: number }[] = [];

  const vWStart = 5.0 + startP * 6.0;
  const vWEnd = 5.0 + endP * 12.0;
  const yWStart = 1.5 + startP * 2.5;
  const yWEnd = 1.5 + endP * 4.5;

  for (let i = 0; i <= SAMPLES; i++) {
    const s = i / SAMPLES;
    const t = startP + s * (endP - startP);

    // [유저 요청: "살짝 화염이 위로갔다가아래로갔다가 하게", "(근데 왜 지나치고 나면 일직선으로 변함?"]
    // 입가(t=0)에서 시작되어 적을 관통하고 지나친 후에도 일직선으로 변하지 않고 계속 물결치도록 유지
    const wavePhase = t * Math.PI * 3.2 - frameStep * 1.5;
    const waveAmp = Math.min(1.0, Math.max(0, t) / 0.35) * 14.0;
    const waveY = Math.sin(wavePhase) * waveAmp;
    const waveX = Math.cos(wavePhase) * (waveAmp * 0.25);

    const cx = ax + ux * (dist * t) + waveX;
    const cy = ay + uy * (dist * t) + waveY;
    centerPts.push({ x: cx, y: cy });

    const vW = vWStart + s * (vWEnd - vWStart);
    topPtsViolet.push({ x: cx, y: cy - vW });
    botPtsViolet.push({ x: cx, y: cy + vW });

    const yW = yWStart + s * (yWEnd - yWStart);
    topPtsYellow.push({ x: cx, y: cy - yW });
    botPtsYellow.push({ x: cx, y: cy + yW });
  }

  const pStart = centerPts[0];
  const pEnd = centerPts[centerPts.length - 1];

  ctx.save();

  // 1. 외곽 은은한 딥 블루-바이올렛 기체 대역 (퍼프를 가리지 않고 부드러운 분위기 형성)
  const vGrad = ctx.createLinearGradient(pStart.x, pStart.y, pEnd.x, pEnd.y);
  vGrad.addColorStop(0.0, `rgba(49, 16, 150, ${0.22 * alpha})`);
  vGrad.addColorStop(0.45, `rgba(67, 24, 195, ${0.25 * alpha})`);
  vGrad.addColorStop(1.0, `rgba(109, 74, 240, ${0.08 * alpha})`);

  ctx.fillStyle = vGrad;
  ctx.beginPath();
  ctx.moveTo(topPtsViolet[0].x, topPtsViolet[0].y);
  for (let i = 1; i <= SAMPLES; i++) ctx.lineTo(topPtsViolet[i].x, topPtsViolet[i].y);
  for (let i = SAMPLES; i >= 0; i--) ctx.lineTo(botPtsViolet[i].x, botPtsViolet[i].y);
  ctx.closePath();
  ctx.fill();

  // 2. 중심 은은한 열기 대역 (퍼프 사이를 메워 떡지지 않도록 얇고 은은하게)
  const yGrad = ctx.createLinearGradient(pStart.x, pStart.y, pEnd.x, pEnd.y);
  yGrad.addColorStop(0.0, `rgba(254, 240, 138, ${0.20 * alpha})`);
  yGrad.addColorStop(0.5, `rgba(250, 204, 21, ${0.16 * alpha})`);
  yGrad.addColorStop(1.0, `rgba(234, 179, 8, ${0.04 * alpha})`);

  ctx.fillStyle = yGrad;
  ctx.beginPath();
  ctx.moveTo(topPtsYellow[0].x, topPtsYellow[0].y);
  for (let i = 1; i <= SAMPLES; i++) ctx.lineTo(topPtsYellow[i].x, topPtsYellow[i].y);
  for (let i = SAMPLES; i >= 0; i--) ctx.lineTo(botPtsYellow[i].x, botPtsYellow[i].y);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 용의분노 연속 화염 스트림 렌더러
 * - [2-Pass 렌더링]: Pass 1에서 파란불꽃 하위 레이어 전체 렌더링, Pass 2에서 노란불꽃 상위 레이어 렌더링
 * - [진하게 != 어두운]: 채도 100% 쨍한 비비드 코발트/인디고 블루
 * - [동그라미 제거]: 유기적 미니 로브로 자연스럽게 퍼지는 노란 화염 코어
 * - [덜 촘촘하고 뚜렷한 덩어리감]: BURST_SPACING = 0.135로 큼직한 독립 화염 덩어리들이 발사됨
 */
function drawDragonRageStream(
  ctx: any,
  ax: number,
  ay: number,
  tx: number,
  ty: number,
  headProgress: number,
  tailProgress: number = 0.0,
  alpha: number = 1.0,
  frameStep: number = 1
) {
  if (alpha <= 0.01 || headProgress <= 0 || headProgress <= tailProgress) return;

  const startP = Math.max(0, tailProgress);
  const endP = Math.min(1.90, headProgress);

  const dx = tx - ax;
  const dy = ty - ay;
  const dist = Math.hypot(dx, dy) || 1;
  const mainAngle = Math.atan2(dy, dx);
  const ux = dx / dist;
  const uy = dy / dist;

  ctx.save();

  // 1. 축선 반투명 기체 베이스 스트림
  drawDragonThermalStream(ctx, ax, ay, tx, ty, startP, endP, alpha, frameStep);

  // 퍼프 좌표 계산 (간격을 0.135로 넓혀 큼직하고 독립된 화염 덩어리 리듬 유지)
  const BURST_SPACING = 0.135;
  const flowAdvance = ((frameStep - 2) * 0.065) % BURST_SPACING;
  const activeEnd = endP;

  interface DragonPuffNode {
    px: number;
    py: number;
    puffR: number;
    flightAngle: number;
    rollAngle: number;
    puffAlpha: number;
    k: number;
    t: number;
  }
  const puffList: DragonPuffNode[] = [];

  const maxPuffs = Math.min(15, Math.ceil((endP - startP + 0.1) / BURST_SPACING) + 2);
  for (let k = 0; k < maxPuffs; k++) {
    const t = activeEnd - flowAdvance - k * BURST_SPACING;
    if (t < startP - 0.04 || t > endP + 0.02) continue;

    // [유저 요청: "살짝 화염이 위로갔다가아래로갔다가 하게", "(근데 왜 지나치고 나면 일직선으로 변함?"]
    // 입가(t=0)에서 시작하여 적을 관통하고 지나친 후에도 물결치는 S자 곡선을 끊김 없이 유지!
    const wavePhase = t * Math.PI * 3.2 - frameStep * 1.5;
    const waveAmp = Math.min(1.0, Math.max(0, t) / 0.35) * 14.0;
    const waveY = Math.sin(wavePhase) * waveAmp;
    const waveX = Math.cos(wavePhase) * (waveAmp * 0.25);

    // 미세 난류
    const jiggle = Math.sin(k * 2.1 + frameStep * 1.5) * (1.2 + Math.min(1.2, t) * 1.8);

    const px = ax + ux * (dist * t) + waveX + jiggle * 0.3;
    const py = ay + uy * (dist * t) + waveY + jiggle;

    // S자 파동 궤적의 안정적이고 유연한 비행 각도(flightAngle) 계산 (관통 후에도 파동 각도 유지!)
    const waveSlope = Math.cos(wavePhase) * 0.28;
    const flightAngle = mainAngle + waveSlope;

    // [유저 요청: "발사될 때 각도를 돌려서 랜덤한 형태가 나오는 것처럼 보이게 해줄래? (그냥 각도만 여러가지로)"]
    // 퍼프마다 고유한 각도 오프셋(황금각 기반 분산)을 주어 매번 완전히 다른 형태의 화염 덩어리로 보이게 함
    const randomAngleOffset = k * 2.399963 + (frameStep - 2) * 0.35;
    const puffFlightAngle = flightAngle + randomAngleOffset;

    // [핵심 유저 요청: "커지면서 페이드아웃되게 해줘"]
    // 기본 크기: 시전자 입가(9px) -> 타겟 도달 시(28.5px)
    const baseR = 9.0 + Math.pow(Math.min(1.0, Math.max(0, t)), 0.68) * 19.5;
    // 적을 통과하여 지나친 후(t > 1.0), 거대한 화염 구름으로 대폭 팽창(28.5px -> 52px+)하며 번짐!
    const expandMult = t > 1.0 ? 1.0 + (t - 1.0) * 1.45 : 1.0;
    const puffR = baseR * expandMult;
    const rollAngle = -frameStep * 1.4 - k * 1.1;

    // 시전자 근처 및 비행 끝단 부드러운 투명도 감쇄
    const casterDist = Math.max(0, t - startP);
    const nearFade = Math.min(1.0, casterDist / 0.18);
    let puffAlpha = alpha * 0.95 * nearFade;

    if (t > endP - 0.08) {
      puffAlpha *= Math.max(0, (endP - t) / 0.08);
    }

    // [핵심 유저 요청: "커지면서 페이드아웃되게 해줘"]
    // 타겟(t = 1.0)을 통과한 후, 화염이 거대하게 부풀어오르며 스르륵 페이드아웃
    if (t > 1.0) {
      const passProgress = (t - 1.0) / 0.65;
      const passFade = Math.max(0.0, 1.0 - Math.min(1.0, passProgress));
      puffAlpha *= Math.pow(passFade, 1.15);
    }

    puffList.push({ px, py, puffR, flightAngle: puffFlightAngle, rollAngle, puffAlpha, k, t });
  }

  // =========================================================================
  // Pass 1: [하위 레이어] 파란불꽃 전체 체인 렌더링
  // - 쨍하고 채도 높은 진한 블루-바이올렛 층을 먼저 바닥에 깔아 덮이지 않게 함!
  // =========================================================================
  for (const p of puffList) {
    drawDragonBlueFlamePuff(ctx, p.px, p.py, p.puffR, p.flightAngle, p.rollAngle, p.puffAlpha, p.k + frameStep);
  }

  // =========================================================================
  // Pass 2: [상위 레이어] 노란불꽃 코어 전체 체인 렌더링
  // - [유저 요청: "저 노란부분은 파란불꽃 위레이어에 배치"]
  // - 적을 통과한 후(t > 1.0)에는 초고열 노란 코어가 먼저 냉각되어 소멸하고,
  //   거대하게 팽창하는 딥 바이올렛 화염 구름이 주인공이 되어 페이드아웃!
  // =========================================================================
  for (const p of puffList) {
    const yellowAlpha = p.t > 1.0
      ? p.puffAlpha * Math.max(0.0, 1.0 - (p.t - 1.0) * 1.8)
      : p.puffAlpha;
    if (yellowAlpha > 0.02) {
      drawDragonYellowCorePuff(ctx, p.px, p.py, p.puffR, p.flightAngle, p.rollAngle, yellowAlpha, p.k + frameStep);
    }
  }

  // 3. 주변 비산하는 노란색 & 보라빛 미세 불티 (선 없이 작은 픽셀 스파크)
  for (let s = 0; s < 8; s++) {
    const st = startP + ((s * 0.14 + frameStep * 0.08) % Math.max(0.1, endP - startP));
    const sWaveAmp = Math.min(1.0, Math.max(0, st) / 0.35) * 14.0;
    const sWave = Math.sin(st * Math.PI * 3.2 - frameStep * 1.5) * sWaveAmp;
    const sSign = s % 2 === 0 ? 1 : -1;
    const sOffset = (10 + (s % 3) * 6) * sSign;
    const spx = ax + ux * (dist * st);
    const spy = ay + uy * (dist * st) + sWave + sOffset;

    const sparkFade = st > 1.0 ? Math.max(0.0, 1.0 - (st - 1.0) * 2.0) : 1.0;
    if (sparkFade * alpha > 0.05) {
      const sColor = s % 2 === 0
        ? `rgba(254, 240, 138, ${0.90 * sparkFade * alpha})`
        : `rgba(192, 132, 252, ${0.90 * sparkFade * alpha})`;
      ctx.fillStyle = sColor;
      ctx.fillRect(spx - 1, spy - 1, 2.2, 2.2);
    }
  }

  ctx.restore();
}

/**
 * 시전자 입가 드래곤 분노 에너지 응축 플레어 (노란 코어 + 보라빛 불꽃)
 */
function drawDragonRageChargeFlare(
  ctx: any,
  x: number,
  y: number,
  intensity: number = 1.0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const r = 8.0 + intensity * 12.0;

  // 외곽 보라빛 오라 팽창
  const outerGrad = ctx.createRadialGradient(x, y, 1, x, y, r * 1.5);
  outerGrad.addColorStop(0.0, "rgba(109, 74, 240, 0.75)");
  outerGrad.addColorStop(0.5, "rgba(67, 24, 195, 0.45)");
  outerGrad.addColorStop(0.85, "rgba(49, 16, 150, 0.20)");
  outerGrad.addColorStop(1.0, "rgba(49, 16, 150, 0.0)");
  ctx.fillStyle = outerGrad;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // 중앙 노란빛 코어 플레어
  const coreGrad = ctx.createRadialGradient(x, y, 0, x, y, r * 0.7);
  coreGrad.addColorStop(0.0, "#FFFFFF");
  coreGrad.addColorStop(0.35, "#FEF08A");
  coreGrad.addColorStop(0.80, "#FACC15");
  coreGrad.addColorStop(1.0, "rgba(234, 179, 8, 0.0)");
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.7, 0, Math.PI * 2);
  ctx.fill();

  // 사방에서 응축되는 드래곤 불꽃 파편 6개
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + intensity * 3.5;
    const dist = (1.0 - intensity * 0.4) * 24 + 6;
    const sx = x + Math.cos(a) * dist;
    const sy = y + Math.sin(a) * dist;

    ctx.fillStyle = i % 2 === 0 ? "#FEF08A" : "#DDD6FE";
    ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
  }

  ctx.restore();
}

/**
 * 2. 미니 보라빛 불꽃 덩어리 렌더러 (타격 시 비산되는 작은 불꽃 파편)
 * - [유저 요청: "용의 분노 근데 불꽃 색깔이 좀더 보라빛어야 할 것 같은데"]
 * - 오직 선명한 보라빛 불꽃(딥 퍼플 ~ 딥 바이올렛 ~ 일렉트릭 바이올렛)으로만 구성!
 * - 외곽 투명도 방사형 그라디언트 적용으로 부드럽게 타오르는 미니 화염
 */
function drawMiniBlueFlamelet(
  ctx: any,
  x: number,
  y: number,
  r: number,
  alpha: number = 1.0,
  seed: number = 0
) {
  if (alpha <= 0.01 || r <= 1.2) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.translate(x, y);

  // 울퉁불퉁한 미니 불꽃 패스
  const pts = getDragonBillowingFlamePoints(r, seed, seed * 1.6, false);
  traceBillowingContour(ctx, pts);

  const grad = ctx.createRadialGradient(0, 0, r * 0.08, 0, 0, r * 1.25);
  grad.addColorStop(0.0, "rgba(49, 16, 150, 0.98)");   // 중심: 딥 인디고
  grad.addColorStop(0.35, "rgba(67, 24, 195, 0.92)"); // 중간: 딥 블루-바이올렛
  grad.addColorStop(0.70, "rgba(88, 48, 225, 0.70)"); // 외곽: 인디고 퍼플
  grad.addColorStop(0.90, "rgba(109, 74, 240, 0.28)"); // 최외곽: 블루-바이올렛
  grad.addColorStop(1.00, "rgba(109, 74, 240, 0.0)");  // 테두리: 100% 투명 페이드
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.restore();
}

/**
 * 용의분노 적 타격 지점 화염 비산 이펙트
 * - [유저 요청: "지금 무슨 거품 터지는 것처럼 선으로된 이펙트를 줬는데 불꽃이 작은 불꽃으로 나눠지는 (파란 불꽃으로만) 이펙트로 수정"]
 * - [유저 요청: "용의 분노 근데 불꽃 색깔이 좀더 보라빛어야 할 것 같은데"]
 * - 거품 터지는 선을 완전히 제거하고, 큰 화염이 적에게 부딪히며 여러 개의 작은 보라빛 불꽃 덩어리로 쪼개져 흩날리는 연출!
 */
function drawDragonRageFlameSplash(
  ctx: any,
  tx: number,
  ty: number,
  ux: number,
  uy: number,
  progress: number,
  alpha: number = 1.0,
  frameStep: number = 4
) {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 1. 타격 지점에서 사방으로 튀어나가며 흩어지는 9개의 작은 보라빛 불꽃 덩어리들 (Only Violet-Purple!)
  // 관통하는 화염의 전방 추진력(forwardDrift)을 받아 적 뒤편으로 비산
  const FLAMELET_COUNT = 9;
  for (let i = 0; i < FLAMELET_COUNT; i++) {
    // 황금각 분산으로 자연스러운 방사 각도
    const angle = (i / FLAMELET_COUNT) * Math.PI * 2 + frameStep * 0.85 + i * 0.45;
    // 충돌 지점에서 바깥으로 흩어지는 거리
    const spreadSpeed = 12 + (i % 3) * 10;
    const dist = 3 + progress * spreadSpeed;

    // 관통 분출 추진력
    const forwardSpeed = 16 + (i % 3) * 14;
    const forwardDrift = progress * forwardSpeed;

    // 전방으로 뿜어지며 살짝 부력 상승
    const fx = tx + Math.cos(angle) * (dist * 0.85) + ux * forwardDrift;
    const fy = ty + Math.sin(angle) * (dist * 0.65) + uy * forwardDrift - progress * 5.5;

    // [유저 요청: "커지면서 페이드아웃되게 해줘"] 진행에 따라 화염 조각이 거대하게 팽창하며 소멸 (3.5px -> 8.5px+)
    const flameletR = (3.5 + progress * 5.0) * (0.85 + (i % 3) * 0.25);
    // 서서히 페이드아웃
    const flameletAlpha = alpha * Math.max(0.0, 1.0 - progress * 0.82);

    drawMiniBlueFlamelet(ctx, fx, fy, flameletR, flameletAlpha, i + frameStep);
  }

  // 2. 보라빛 불꽃 파편들 사이로 흩날리는 미세한 보라/라벤더 불티
  for (let s = 0; s < 6; s++) {
    const sa = (s / 6) * Math.PI * 2 + frameStep * 1.4;
    const sDist = 6 + (s % 3) * 8 + progress * 18;
    const sForward = progress * (14 + (s % 3) * 12);
    const sx = tx + Math.cos(sa) * (sDist * 0.9) + ux * sForward;
    const sy = ty + Math.sin(sa) * (sDist * 0.7) + uy * sForward - progress * 7.0;
    const sAlpha = alpha * Math.max(0.0, 1.0 - progress * 0.9);

    ctx.fillStyle = s % 2 === 0
      ? `rgba(192, 132, 252, ${sAlpha * 0.90})`   // 밝은 퍼플 불티
      : `rgba(216, 180, 254, ${sAlpha * 0.85})`; // 몽환적인 라벤더 불티
    ctx.fillRect(sx - 1.2, sy - 1.2, 2.4, 2.4);
  }

  ctx.restore();
}

/**
 * 용의분노 메인 이펙트 렌더러
 * - [유저 요청: "용의 분노는 적에게 타격된 후 사라지는게 아니라 적을 지나가면서 페이드아웃"]
 * - 적에게 닿아서 멈추는 것이 아니라 대상을 완전히 관통하여 지나가며 부드럽게 페이드아웃!
 */
export function drawDragonRageEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0.5,
  isPlayer: boolean = true
) {
  ctx.save();

  // 공격자 입 위치 및 타겟 피격 위치
  const startX = attackerPos.x + (isPlayer ? 14 : -14);
  const startY = attackerPos.y - (isPlayer ? 14 : 6);
  const endX = targetPos.x;
  const endY = targetPos.y - 8;

  const dx = endX - startX;
  const dy = endY - startY;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;

  // Step 1: 시전자 입가에서 분노의 불꽃 응축 (노란 코어 + 보라빛 푸른 오라)
  if (moveStep === 1) {
    drawDragonRageChargeFlare(ctx, startX, startY, effectProgress, 0.90);
  }

  // Step 2: 화염 방사 시작 (입에서 뻗어나오는 노랑-보라빛 푸른불꽃 줄기 초반 사출)
  else if (moveStep === 2) {
    drawDragonRageChargeFlare(ctx, startX, startY, 1.0, 0.75);
    const headP = 0.08 + effectProgress * 0.48; // 0.08 -> 0.56
    drawDragonRageStream(ctx, startX, startY, endX, endY, headP, 0.0, 0.90, 2);
  }

  // Step 3: 화염 스트림 쇄도 (거대한 불꽃 줄기가 화면을 가로질러 대상 직전까지 도달)
  else if (moveStep === 3) {
    const headP = 0.56 + effectProgress * 0.46; // 0.56 -> 1.02 (착탄 직전)
    const tailP = effectProgress * 0.06;
    drawDragonRageStream(ctx, startX, startY, endX, endY, headP, tailP, 0.95, 3);
  }

  // Step 4: 화염 직격 및 관통 시작 - 대상을 덮치며 뚫고 지나가기 시작
  else if (moveStep === 4) {
    const headP = 1.02 + effectProgress * 0.23; // 1.02 -> 1.25 (적을 뚫고 통과 시작!)
    drawDragonRageStream(ctx, startX, startY, endX, endY, headP, 0.0, 0.98, 4);
    drawDragonRageFlameSplash(ctx, endX, endY, ux, uy, effectProgress, 0.88, 4);
  }

  // Step 5: 맹렬한 지속 화염 방사 (2) - 연속 스트림이 적을 완전히 꿰뚫고 후방으로 분출
  else if (moveStep === 5) {
    const headP = 1.25 + effectProgress * 0.15; // 1.25 -> 1.40
    drawDragonRageStream(ctx, startX, startY, endX, endY, headP, 0.0, 1.0, 5);
    drawDragonRageFlameSplash(ctx, endX, endY, ux, uy, effectProgress, 0.95, 5);
  }

  // Step 6: 맹렬한 지속 화염 방사 (3) - 최대 위력 관통 분출
  else if (moveStep === 6) {
    const headP = 1.40 + effectProgress * 0.15; // 1.40 -> 1.55
    drawDragonRageStream(ctx, startX, startY, endX, endY, headP, 0.0, 1.0, 6);
    drawDragonRageFlameSplash(ctx, endX, endY, ux, uy, effectProgress, 0.95, 6);
  }

  // Step 7: 지속 화염 방사 (4) - 방사 끝물 & 시전자 입가 꼬리 분리 시작
  else if (moveStep === 7) {
    const headP = 1.55 + effectProgress * 0.10; // 1.55 -> 1.65
    const tailP = effectProgress * 0.22; // 0.0 -> 0.22 (입에서 분리)
    drawDragonRageStream(ctx, startX, startY, endX, endY, headP, tailP, 0.98, 7);
    drawDragonRageFlameSplash(ctx, endX, endY, ux, uy, effectProgress, 0.92, 7);
  }

  // Step 8: [유저 요청: "용의 분노는 적에게 타격된 후 사라지는게 아니라 적을 지나가면서 페이드아웃"]
  // 시전자 입에서 분사 완료 후, 화염 스트림 본체가 적을 꿰뚫고 지나가며 페이드아웃 진행
  else if (moveStep === 8) {
    const tailP = 0.22 + effectProgress * 0.60; // 0.22 -> 0.82 (꼬리가 적 바로 앞까지 전진)
    const headP = 1.65 + effectProgress * 0.10; // 1.65 -> 1.75
    const streamAlpha = 0.95 * (1.0 - effectProgress * 0.35); // 0.95 -> 0.62
    drawDragonRageStream(ctx, startX, startY, endX, endY, headP, tailP, streamAlpha, 8);
    drawDragonRageFlameSplash(ctx, endX, endY, ux, uy, 1.0 - effectProgress * 0.4, 0.75, 8);
  }

  // Step 9: [유저 요청: "적을 지나가면서 페이드아웃"]
  // 화염 스트림 꼬리가 적을 완전히 지나쳐(tailP > 1.0) 후방으로 통과하면서 서서히 페이드아웃 완료
  else if (moveStep === 9) {
    const tailP = 0.82 + effectProgress * 0.50; // 0.82 -> 1.32 (꼬리까지 적을 완전히 통과!)
    const headP = 1.75 + effectProgress * 0.10; // 1.75 -> 1.85
    const streamAlpha = Math.max(0.0, 0.62 * (1.0 - effectProgress)); // 0.62 -> 0.0 (지나가면서 페이드아웃!)

    if (streamAlpha > 0.02) {
      drawDragonRageStream(ctx, startX, startY, endX, endY, headP, tailP, streamAlpha, 9);
    }

    // 적을 뚫고 지나간 미니 파란 불꽃 조각들도 적 뒤편으로 비산하며 소멸
    const splashAlpha = Math.max(0.0, (1.0 - effectProgress) * 0.65);
    if (splashAlpha > 0.03) {
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + i * 1.3;
        const forwardDist = 20 + effectProgress * 30;
        const fx = endX + ux * forwardDist + Math.cos(a) * (8 + effectProgress * 14);
        const fy = endY + uy * forwardDist + Math.sin(a) * (6 + effectProgress * 10) - effectProgress * 10.0;
        // [유저 요청: "커지면서 페이드아웃되게 해줘"] 잔류 불꽃 조각도 거대하게 번지며 소멸
        const r = (3.5 + effectProgress * 4.8) * (0.8 + (i % 2) * 0.35);

        drawMiniBlueFlamelet(ctx, fx, fy, r, splashAlpha, i + 9);
      }
    }
  }

  ctx.restore();
}

// ============================================================================
// 083: 회오리불꽃 (Fire Spin)
// ============================================================================

/**
 * 솟구쳐 오르는 유선형 불꽃 혓바닥 (Rising Flame Tongue)
 * - 외곽 하드 라인 완전 제거: 100% 투명 페이드 방사형 그라데이션 적용
 * - 중심 백열황색 코어에서 외곽 적색 투명으로 부드럽게 감쇄
 */
function drawRisingFlameTongue(
  ctx: any,
  x: number,
  y: number,
  size: number,
  angle: number,
  alpha: number
) {
  if (alpha <= 0.01 || size <= 0.5) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const len = size * 2.4;
  const w = size * 1.1;

  // 1. 외곽 부드러운 투명도 감쇄 화염 바디 (외곽 100% 투명 페이드)
  const flameGrad = ctx.createRadialGradient(0, -len * 0.15, 0, 0, -len * 0.15, len * 0.95);
  flameGrad.addColorStop(0.0, `rgba(255, 255, 255, ${alpha * 0.95})`);
  flameGrad.addColorStop(0.20, `rgba(254, 240, 138, ${alpha * 0.90})`);
  flameGrad.addColorStop(0.50, `rgba(249, 115, 22, ${alpha * 0.65})`);
  flameGrad.addColorStop(0.80, `rgba(239, 68, 68, ${alpha * 0.28})`);
  flameGrad.addColorStop(1.0, "rgba(239, 68, 68, 0.0)");

  ctx.fillStyle = flameGrad;
  ctx.beginPath();
  ctx.moveTo(0, -len);
  ctx.quadraticCurveTo(w * 1.4, -len * 0.25, w * 0.8, len * 0.4);
  ctx.quadraticCurveTo(0, len * 0.9, -w * 0.8, len * 0.4);
  ctx.quadraticCurveTo(-w * 1.4, -len * 0.25, 0, -len);
  ctx.closePath();
  ctx.fill();

  // 2. 중심 초고열 광채 코어
  const coreGrad = ctx.createRadialGradient(0, -len * 0.25, 0, 0, -len * 0.25, len * 0.45);
  coreGrad.addColorStop(0.0, `rgba(255, 255, 255, ${alpha * 0.95})`);
  coreGrad.addColorStop(0.40, `rgba(254, 240, 138, ${alpha * 0.70})`);
  coreGrad.addColorStop(1.0, "rgba(254, 240, 138, 0.0)");

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, -len * 0.25, len * 0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 불 발사 투사체 (Fire Spin Projectile)
 * - [유저 요청: "동그란 불 구체가 중간에 있고 그 근처를 불꽃 세개가 회전하면서 발사하는 형태"]
 * - 중심에 선명한 원형 불 구체(Central Round Fire Sphere)가 위치
 * - 그 주변(공전 반경 13px)을 120도 간격의 3개 불꽃(3 Orbiting Flames)이 나선 궤적을 그리며 맹렬히 회전
 * - 포물선 궤적으로 대상 발밑을 향해 날아가는 화염 회전 투사체
 */
function drawFireSpinProjectile(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  progress: number,
  isPlayer: boolean
) {
  const startX = attackerPos.x + (isPlayer ? 10 : -10);
  const startY = attackerPos.y - 12;
  const targetX = targetPos.x;
  const targetY = targetPos.y + 6;

  const p = Math.max(0, Math.min(1.0, progress));
  const curX = startX + (targetX - startX) * p;
  const curY = startY + (targetY - startY) * p - Math.sin(p * Math.PI) * 22; // 포물선

  const dx = targetX - startX;
  const dy = targetY - startY;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;

  ctx.save();

  // 1. 후방으로 흩날리는 불티 꼬리 (Embers Trail along flight path)
  for (let i = 0; i < 5; i++) {
    const tp = Math.max(0, p - (i + 1) * 0.05);
    const tx = startX + (targetX - startX) * tp;
    const ty = startY + (targetY - startY) * tp - Math.sin(tp * Math.PI) * 22;
    const tailAlpha = (1.0 - (i / 5)) * 0.80;
    ctx.fillStyle = (i % 2 === 0) ? `rgba(254, 240, 138, ${tailAlpha})` : `rgba(249, 115, 22, ${tailAlpha})`;
    const sz = 2.4 - i * 0.35;
    ctx.fillRect(tx + Math.sin(i * 2 + p * 12) * 2.5 - sz / 2, ty - sz / 2, sz, sz);
  }

  // 2. 중심 구체 주위를 도는 3개 불꽃의 회전 각도 및 궤도 반경
  const spinSpeed = p * Math.PI * 10; // 비행 중 약 5회전 회전
  const orbitR = 13.0; // 중심 구체 외곽을 회전하는 공전 반경

  // 3. 3개 불꽃과 중심을 잇는 나선형 화염 회전 기류 선 (Swirling Vortex Arcs)
  for (let i = 0; i < 3; i++) {
    const a1 = spinSpeed + (i * Math.PI * 2) / 3;
    const a2 = a1 + (Math.PI * 2) / 3;
    const o1x = curX + Math.cos(a1) * orbitR;
    const o1y = curY + Math.sin(a1) * (orbitR * 0.85);
    const midA = a1 + Math.PI / 3;
    const midR = orbitR * 0.55;
    const mx = curX + Math.cos(midA) * midR;
    const my = curY + Math.sin(midA) * (midR * 0.85);
    const o2x = curX + Math.cos(a2) * orbitR;
    const o2y = curY + Math.sin(a2) * (orbitR * 0.85);

    ctx.beginPath();
    ctx.moveTo(o1x, o1y);
    ctx.quadraticCurveTo(mx, my, o2x, o2y);
    ctx.strokeStyle = "rgba(249, 115, 22, 0.55)";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.strokeStyle = "rgba(254, 240, 138, 0.75)";
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  // 4. [핵심 1: 동그란 불 구체가 중간에 있고]
  const centerR = 6.8;

  // A. 중심 구체 외곽 고열 림 글로우
  ctx.fillStyle = "rgba(239, 68, 68, 0.40)";
  ctx.beginPath();
  ctx.arc(curX, curY, centerR * 1.45, 0, Math.PI * 2);
  ctx.fill();

  // B. 선명한 작열 주황 구체 바디
  ctx.fillStyle = "#F97316";
  ctx.beginPath();
  ctx.arc(curX, curY, centerR, 0, Math.PI * 2);
  ctx.fill();

  // C. 내부 밝은 황금빛 코어
  ctx.fillStyle = "#FDE047";
  ctx.beginPath();
  ctx.arc(curX, curY, centerR * 0.65, 0, Math.PI * 2);
  ctx.fill();

  // D. 중심 초고열 순백 하이라이트
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(curX, curY, centerR * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // 5. [핵심 2: 그 근처를 불꽃 세개가 회전하면서 발사]
  for (let i = 0; i < 3; i++) {
    const a = spinSpeed + (i * Math.PI * 2) / 3;
    const ox = curX + Math.cos(a) * orbitR;
    const oy = curY + Math.sin(a) * (orbitR * 0.85);

    // 공전 궤적 접선 방향 + 전방 진행 벡터로 불꽃 방향(flameAngle) 산출
    const tanX = -Math.sin(a) * orbitR + ux * 5;
    const tanY = Math.cos(a) * (orbitR * 0.85) + uy * 5;
    const flameAngle = Math.atan2(tanY, tanX) + Math.PI / 2;

    // 각 회전 불꽃 뒤편으로 흩날리는 미세 스파크 꼬리 (Orbit Wake Sparks)
    for (let s = 1; s <= 2; s++) {
      const tailA = a - s * 0.35;
      const tailR = orbitR * (1.0 - s * 0.10);
      const tx = curX + Math.cos(tailA) * tailR - ux * (s * 3.0);
      const ty = curY + Math.sin(tailA) * (tailR * 0.85) - uy * (s * 3.0);
      const sz = 2.0 - s * 0.5;
      ctx.fillStyle = s === 1 ? "#FEF08A" : "#F97316";
      ctx.fillRect(tx - sz / 2, ty - sz / 2, sz, sz);
    }

    // 유선형 불꽃 혓바닥 (Flame Tongue) 렌더링
    drawRisingFlameTongue(ctx, ox, oy, 3.4, flameAngle, 0.95);

    // 불꽃 선두 원형 코어 글로우
    ctx.fillStyle = "rgba(255, 255, 255, 0.90)";
    ctx.beginPath();
    ctx.arc(ox, oy, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 지면 착탄 화염 버스트 (Fire Spin Ground Impact)
 * - 투사체가 대상 발밑에 닿아 사방으로 지면 화염과 불꽃 파편이 튀는 연출
 */
function drawFireSpinImpact(
  ctx: any,
  targetPos: { x: number; y: number },
  progress: number
) {
  const targetX = targetPos.x;
  const targetY = targetPos.y + 24; // 지면 위치를 포켓몬 발밑 지면(+24)으로 확실히 하향 조정
  const p = progress;

  ctx.save();

  // 1. 지면을 핥으며 퍼져나가는 6방향 화염 혓바닥 (우측 위쪽 꼬리 방향 반영)
  const tongueCount = 6;
  const spreadDist = 8 + p * 24;
  const alpha = Math.max(0.0, 1.0 - p * 0.9);

  for (let i = 0; i < tongueCount; i++) {
    const angle = (i / tongueCount) * Math.PI * 2 + p * 0.5;
    const fx = targetX + Math.cos(angle) * spreadDist;
    const fy = targetY + Math.sin(angle) * spreadDist * 0.42;
    const size = (6.0 + (i % 3) * 2.0) * (1.0 - p * 0.5);

    drawFireSpinFlameLobe(ctx, fx, fy, size, true, alpha, i, 0);
  }

  // 2. 사방으로 튀는 지면 스파크 파편 (12개)
  for (let s = 0; s < 12; s++) {
    const sAngle = (s / 12) * Math.PI * 2 + s * 1.3;
    const sDist = (10 + s * 3) * (0.3 + p * 1.1);
    const sx = targetX + Math.cos(sAngle) * sDist;
    const sy = targetY + Math.sin(sAngle) * sDist * 0.42 - p * 16 * (0.6 + (s % 3) * 0.3);
    const sz = 2.0 * (1.0 - p * 0.6);

    ctx.fillStyle = s % 2 === 0 ? `rgba(254, 240, 138, ${alpha})` : `rgba(249, 115, 22, ${alpha})`;
    ctx.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
  }

  ctx.restore();
}

/**
 * 나팔형 깔때기(Trumpet Funnel) 3D 볼텍스 좌표 산출
 * - 상공으로 갈수록 반경이 나팔형으로 넓어지며 상단을 감쌈
 * - [위치 하향 조정]: 회오리 베이스 위치를 포켓몬 발밑 지면(targetPos.y + 24)으로 안착
 */
function getFireSpinVortexPoint(
  targetPos: { x: number; y: number },
  u: number, // 0.0 (지면) ~ 1.0 (최상공)
  angle: number,
  baseRadiusX: number = 33,
  baseRadiusY: number = 13,
  height: number = 74
) {
  // 상단으로 갈수록 나팔형으로 확장 (지면 ~0.84 -> 상공 ~1.52)
  const expand = 0.84 + Math.pow(u, 1.15) * 0.68;
  const radiusX = baseRadiusX * expand;
  const radiusY = baseRadiusY * expand;

  const cx = targetPos.x;
  const cy = targetPos.y + 24; // 발밑 지면 위치로 확실하게 하향 조정

  const x = cx + Math.cos(angle) * radiusX;
  const z = Math.sin(angle); // z >= 0: 앞면, z < 0: 뒷면
  const y = cy - u * height + z * radiusY * 0.35;

  return { x, y, z, angle, radiusX, radiusY };
}

/**
 * 화염 꼬리 뒤로 피어오르는 선명한 화염 기체 플룸 (Flame Gas Plume)
 * - 중심부는 고열의 밝은 레몬/오렌지로 선명하고, 외곽으로 갈수록 부드럽게 투명해지는 화염 가스
 */
function drawFireSpinGasPlume(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number
) {
  if (alpha <= 0.01 || radius <= 0.6) return;
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  // [요청 반영]: 투명도를 더 높여 부드럽고 맑은 화염 기체 연기
  grad.addColorStop(0.0, `rgba(255, 255, 255, ${alpha * 0.52})`);
  grad.addColorStop(0.22, `rgba(254, 240, 138, ${alpha * 0.62})`);
  grad.addColorStop(0.55, `rgba(249, 115, 22, ${alpha * 0.48})`);
  grad.addColorStop(0.82, `rgba(194, 65, 12, ${alpha * 0.22})`);
  grad.addColorStop(1.0, "rgba(194, 65, 12, 0.0)"); // 외곽 완전투명

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * 4단 셀 셰이딩 유기적 화염 로브 (Flame Lobe)
 * - [핵심 요구사항 1]: 회전 반대방향인 우측 위쪽으로 불의 꼬리가 치솟아 올라가 있음
 * - [핵심 요구사항 2]: 화염 기체 연기 꼬리쪽 투명도 상향 (좀더 투명하게!)
 * - [핵심 요구사항 3]: 기체 연기가 나오는 각도를 거의 화면 기준 가로수직(직각 수직 아래!)으로 배출
 */
function drawFireSpinFlameLobe(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  isFront: boolean,
  alpha: number = 1.0,
  seed: number = 0,
  wobble: number = 0
) {
  if (alpha <= 0.01 || size <= 0.8) return;

  const baseAngle = isFront ? -Math.PI * 0.20 : -Math.PI * 0.80;
  const angle = baseAngle + wobble;
  const s = size;

  // -------------------------------------------------------------------------
  // 1. [핵심]: 꼬리에서 화면 기준 가로수직(직각 수직 아래 +Y)으로 떨어지는 투명 화염 기체
  // - [요청 반영]: 각도 거의 걍 가로수직(직각 수직 아래)으로 배출!
  // - [요청 반영]: 꼬리 접점 위치를 투명화 시작 지점(s * 0.70)으로 밀착
  // -------------------------------------------------------------------------
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const tipLocalX = s * 0.70;
  const tipLocalY = -s * 0.15;
  const tailWorldX = cx + tipLocalX * cosA - tipLocalY * sinA;
  const tailWorldY = cy + tipLocalX * sinA + tipLocalY * cosA;

  const wobX = Math.sin(wobble * 2.5 + seed) * s * 0.08;
  const wobY = Math.cos(wobble * 2.5 + seed * 1.5) * s * 0.08;

  // 꼬리 접점에서부터 화면 수직 아래(+Y)로 6단계 기체 플룸 (투명도 상향 적용)
  drawFireSpinGasPlume(ctx, tailWorldX + wobX, tailWorldY + s * 0.28 + wobY, s * 0.65, alpha * 0.48);
  drawFireSpinGasPlume(ctx, tailWorldX + wobX * 1.2, tailWorldY + s * 0.65 + wobY, s * 0.78, alpha * 0.36);
  drawFireSpinGasPlume(ctx, tailWorldX + wobX * 1.5, tailWorldY + s * 1.08 + wobY, s * 0.92, alpha * 0.26);
  drawFireSpinGasPlume(ctx, tailWorldX + wobX * 1.8, tailWorldY + s * 1.55 + wobY, s * 1.08, alpha * 0.18);
  drawFireSpinGasPlume(ctx, tailWorldX + wobX * 2.0, tailWorldY + s * 2.05 + wobY, s * 1.25, alpha * 0.11);
  drawFireSpinGasPlume(ctx, tailWorldX + wobX * 2.2, tailWorldY + s * 2.58 + wobY, s * 1.40, alpha * 0.05);

  // 수직 아래로 떨어지는 미세 불티 엠버
  ctx.fillStyle = `rgba(254, 240, 138, ${alpha * 0.50})`;
  ctx.fillRect(tailWorldX + wobX, tailWorldY + s * 0.55, 1.8, 1.8);
  ctx.fillStyle = `rgba(249, 115, 22, ${alpha * 0.38})`;
  ctx.fillRect(tailWorldX + wobX * 1.3, tailWorldY + s * 1.10, 1.6, 1.6);
  ctx.fillStyle = `rgba(249, 115, 22, ${alpha * 0.22})`;
  ctx.fillRect(tailWorldX + wobX * 1.6, tailWorldY + s * 1.75, 1.4, 1.4);

  // -------------------------------------------------------------------------
  // 2. 4단 셀 셰이딩 유기적 화염 바디
  // -------------------------------------------------------------------------
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // -------------------------------------------------------------------------
  // 2. 유기적 3갈래 화염 혓바닥 바디 (타오르는 진짜 불꽃 형태)
  // -------------------------------------------------------------------------
  const drawFlameBodyPath = (scale: number, forwardShift: number = 0) => {
    const sc = s * scale;
    const hx = -forwardShift;
    ctx.beginPath();

    // 머리 상단
    ctx.moveTo(hx, -sc * 0.65);
    // 머리 앞쪽(-X) 유기적 돔 굴곡 (진행방향 코어)
    ctx.bezierCurveTo(hx - sc * 0.7, -sc * 0.75, hx - sc * 0.95, -sc * 0.3, hx - sc * 0.9, 0);
    ctx.bezierCurveTo(hx - sc * 0.95, sc * 0.35, hx - sc * 0.7, sc * 0.75, hx, sc * 0.65);

    // 꼬리 하단 -> 하단 보조 혓바닥
    ctx.quadraticCurveTo(hx + sc * 0.6, sc * 0.62, hx + sc * 1.25, sc * 0.42);
    ctx.quadraticCurveTo(hx + sc * 0.85, sc * 0.18, hx + sc * 1.15, sc * 0.05);

    // 메인 꼬리 팁 (우측 위쪽으로 가장 길게 뻗어나가는 뾰족한 화염 혀)
    const mainTipX = hx + sc * 2.35;
    const mainTipY = -sc * 0.28;
    ctx.quadraticCurveTo(hx + sc * 1.55, -sc * 0.10, mainTipX, mainTipY);

    // 상단 보조 혓바닥 (갈라지며 타오르는 결)
    ctx.quadraticCurveTo(hx + sc * 1.5, -sc * 0.45, hx + sc * 1.7, -sc * 0.65);
    ctx.quadraticCurveTo(hx + sc * 1.2, -sc * 0.55, hx, -sc * 0.65);
    ctx.closePath();
  };

  const gradX0 = -s * 0.9;
  const gradX1 = s * 2.4;

  // [사용자 요구사항]: 불꽃덩어리(뒷부분이 뾰족한 불)의 뒷부분을 좀만 더 투명하게 처리
  // 머리(-X)는 부드럽게 타오르고, 꼬리/뒷부분(+X)은 0.40 지점부터 100% 완전 투명(0.0) 소멸

  // Layer 1: 외곽 다크 오렌지/진홍 림 (#C2410C) - 꼬리/뒷부분 완전투명(0.0)
  const grad1 = ctx.createLinearGradient(gradX0, 0, gradX1, 0);
  grad1.addColorStop(0.0, `rgba(194, 65, 12, ${alpha * 0.82})`);
  grad1.addColorStop(0.18, `rgba(194, 65, 12, ${alpha * 0.62})`);
  grad1.addColorStop(0.30, `rgba(194, 65, 12, ${alpha * 0.18})`);
  grad1.addColorStop(0.40, `rgba(194, 65, 12, 0.0)`);
  grad1.addColorStop(1.0, `rgba(194, 65, 12, 0.0)`);
  drawFlameBodyPath(1.0, 0);
  ctx.fillStyle = grad1;
  ctx.fill();

  // Layer 2: 작열 주황 메인 바디 (#F97316) - 꼬리/뒷부분 완전투명(0.0)
  const grad2 = ctx.createLinearGradient(gradX0, 0, gradX1, 0);
  grad2.addColorStop(0.0, `rgba(249, 115, 22, ${alpha * 0.85})`);
  grad2.addColorStop(0.16, `rgba(249, 115, 22, ${alpha * 0.55})`);
  grad2.addColorStop(0.26, `rgba(249, 115, 22, ${alpha * 0.12})`);
  grad2.addColorStop(0.34, `rgba(249, 115, 22, 0.0)`);
  grad2.addColorStop(1.0, `rgba(249, 115, 22, 0.0)`);
  drawFlameBodyPath(0.76, s * 0.12);
  ctx.fillStyle = grad2;
  ctx.fill();

  // Layer 3: 고열 레몬 옐로우 코어 (#FEF08A) - 중심부만 작열, 뒷부분 조기 완전투명화
  const grad3 = ctx.createLinearGradient(gradX0, 0, gradX1, 0);
  grad3.addColorStop(0.0, `rgba(254, 240, 138, ${alpha * 0.88})`);
  grad3.addColorStop(0.14, `rgba(254, 240, 138, ${alpha * 0.45})`);
  grad3.addColorStop(0.24, `rgba(254, 240, 138, 0.0)`);
  grad3.addColorStop(1.0, `rgba(254, 240, 138, 0.0)`);
  drawFlameBodyPath(0.48, s * 0.22);
  ctx.fillStyle = grad3;
  ctx.fill();

  // Layer 4: 초고열 순백 하이라이트 (#FFFFFF) - 머리 전면부만 작열
  const grad4 = ctx.createLinearGradient(gradX0, 0, gradX1, 0);
  grad4.addColorStop(0.0, `rgba(255, 255, 255, ${alpha * 0.80})`);
  grad4.addColorStop(0.12, `rgba(255, 255, 255, 0.0)`);
  grad4.addColorStop(1.0, `rgba(255, 255, 255, 0.0)`);
  drawFlameBodyPath(0.24, s * 0.28);
  ctx.fillStyle = grad4;
  ctx.fill();

  ctx.restore();
}

/**
 * 모션 스위핑 트레일 (Sweeping Motion Trail)
 * - [핵심 요구사항]: 선명한 선이 아니라, 진행방향 쪽은 반투명, 진행방향과 반대방향은 완전투명!
 * - 불꽃 머리(Head)의 뒤쪽으로 이어지는 잔상으로, 꼬리 끝으로 갈수록 완전히 투명해짐 (fade-out to 0)
 */
function drawFireSpinSweepingTrail(
  ctx: any,
  targetPos: { x: number; y: number },
  headU: number,
  headAngle: number,
  isFront: boolean,
  overallAlpha: number,
  trailSpanAngle: number = Math.PI * 0.52
) {
  if (overallAlpha <= 0.01) return;

  const numTrailSteps = 12;
  // 머리 뒤쪽(진행 반대방향)으로 뻗어나가는 각도 샘플링
  // dU: 트레일 끝은 머리보다 살짝 아래 높이
  const trailSpanU = 0.08;

  let prevPt: any = null;

  for (let step = 0; step <= numTrailSteps; step++) {
    // t: 0.0 (꼬리 끝 = 진행 반대방향) ~ 1.0 (머리 = 진행방향)
    const t = step / numTrailSteps;
    const u = Math.max(0.0, headU - (1.0 - t) * trailSpanU);
    // 진행 반대방향(과거 위치) 각도: headAngle - (1.0 - t) * trailSpanAngle
    const angle = headAngle - (1.0 - t) * trailSpanAngle;
    const currPt = getFireSpinVortexPoint(targetPos, u, angle);

    if (prevPt) {
      const p1Front = prevPt.z >= -0.06;
      const p2Front = currPt.z >= -0.06;

      // 앞/뒤 레이어 클리핑
      if ((isFront && (p1Front || p2Front)) || (!isFront && (!p1Front || !p2Front))) {
        // [핵심]: 진행방향(t=1.0) 쪽은 반투명 (0.32), 진행 반대방향(t=0.0) 쪽은 완전투명 (0.0)!
        const tAlpha = Math.pow(t, 1.45) * overallAlpha * 0.32;

        if (tAlpha > 0.01) {
          const w = (6.5 + u * 3.5) * (0.2 + t * 0.8);

          ctx.save();
          ctx.lineCap = "round";

          // 1) 외곽 반투명 다크 오렌지 잔상
          ctx.strokeStyle = `rgba(194, 65, 12, ${tAlpha * 0.72})`;
          ctx.lineWidth = w;
          ctx.beginPath();
          ctx.moveTo(prevPt.x, prevPt.y);
          ctx.lineTo(currPt.x, currPt.y);
          ctx.stroke();

          // 2) 내부 작열 주황 잔상
          ctx.strokeStyle = `rgba(249, 115, 22, ${tAlpha * 0.92})`;
          ctx.lineWidth = w * 0.62;
          ctx.beginPath();
          ctx.moveTo(prevPt.x, prevPt.y);
          ctx.lineTo(currPt.x, currPt.y);
          ctx.stroke();

          // 3) 머리 근처 고열 밝은 잔상 (t > 0.45 구간에만 은은하게)
          if (t > 0.45) {
            ctx.strokeStyle = `rgba(254, 240, 138, ${tAlpha * 1.05})`;
            ctx.lineWidth = w * 0.28;
            ctx.beginPath();
            ctx.moveTo(prevPt.x, prevPt.y);
            ctx.lineTo(currPt.x, currPt.y);
            ctx.stroke();
          }

          ctx.restore();
        }
      }
    }

    prevPt = currPt;
  }
}

/**
 * 최상단 치솟는 대형 화염 크레스트 (Trumpet Funnel Top Crest)
 * - 우측 위쪽으로 강렬하게 뻗어 올라가는 3갈래 화염 스파이크 (끝부분 투명 기체 플룸 포함)
 */
function drawFireSpinTopCrest(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  isFront: boolean,
  alpha: number = 1.0,
  seed: number = 0
) {
  if (alpha <= 0.01 || size <= 1.0) return;

  const baseAngle = isFront ? -Math.PI * 0.22 : -Math.PI * 0.78;
  const s = size;

  // 크레스트 뒷부분 투명화 시작 지점의 월드 좌표 계산 (로컬 s * 0.90, -s * 0.1)
  const cosA = Math.cos(baseAngle);
  const sinA = Math.sin(baseAngle);
  const tipX = cx + s * 0.90 * cosA - (-s * 0.1) * sinA;
  const tipY = cy + s * 0.90 * sinA + (-s * 0.1) * cosA;

  // 화면 수직 아래(+Y)로 떨어지는 선명한 기체 플룸 (투명도 상향)
  drawFireSpinGasPlume(ctx, tipX, tipY + s * 0.30, s * 0.70, alpha * 0.45);
  drawFireSpinGasPlume(ctx, tipX, tipY + s * 0.75, s * 0.95, alpha * 0.30);
  drawFireSpinGasPlume(ctx, tipX, tipY + s * 1.30, s * 1.25, alpha * 0.16);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(baseAngle);

  // 3갈래로 갈라지는 뾰족한 화염 스파이크 형상 (+X 방향으로 뻗음)
  const drawCrestPath = (scale: number) => {
    const sc = s * scale;
    ctx.beginPath();
    ctx.moveTo(0, -sc * 0.5);
    // 상단 서브 스파이크
    ctx.quadraticCurveTo(sc * 0.6, -sc * 0.65, sc * 1.35, -sc * 0.75);
    ctx.quadraticCurveTo(sc * 0.9, -sc * 0.35, sc * 1.1, -sc * 0.2);
    // 중앙 메인 스파이크 (가장 길게 치솟음)
    ctx.quadraticCurveTo(sc * 1.6, -sc * 0.15, sc * 2.4, -sc * 0.1);
    ctx.quadraticCurveTo(sc * 1.6, sc * 0.15, sc * 1.1, sc * 0.25);
    // 하단 서브 스파이크
    ctx.quadraticCurveTo(sc * 0.9, sc * 0.55, sc * 1.4, sc * 0.7);
    ctx.quadraticCurveTo(sc * 0.5, sc * 0.5, 0, sc * 0.5);
    ctx.closePath();
  };

  // 4단 셀 셰이딩 (스파이크/뒷부분 완전투명화 0.0)
  const crestGrad1 = ctx.createLinearGradient(0, 0, s * 2.4, 0);
  crestGrad1.addColorStop(0.0, `rgba(194, 65, 12, ${alpha * 0.80})`);
  crestGrad1.addColorStop(0.18, `rgba(194, 65, 12, ${alpha * 0.48})`);
  crestGrad1.addColorStop(0.30, `rgba(194, 65, 12, ${alpha * 0.12})`);
  crestGrad1.addColorStop(0.40, `rgba(194, 65, 12, 0.0)`);
  crestGrad1.addColorStop(1.0, `rgba(194, 65, 12, 0.0)`);
  drawCrestPath(1.0);
  ctx.fillStyle = crestGrad1;
  ctx.fill();

  const crestGrad2 = ctx.createLinearGradient(0, 0, s * 2.0, 0);
  crestGrad2.addColorStop(0.0, `rgba(249, 115, 22, ${alpha * 0.85})`);
  crestGrad2.addColorStop(0.16, `rgba(249, 115, 22, ${alpha * 0.42})`);
  crestGrad2.addColorStop(0.28, `rgba(249, 115, 22, 0.0)`);
  crestGrad2.addColorStop(1.0, `rgba(249, 115, 22, 0.0)`);
  drawCrestPath(0.74);
  ctx.fillStyle = crestGrad2;
  ctx.fill();

  const crestGrad3 = ctx.createLinearGradient(0, 0, s * 1.4, 0);
  crestGrad3.addColorStop(0.0, `rgba(254, 240, 138, ${alpha * 0.88})`);
  crestGrad3.addColorStop(0.15, `rgba(254, 240, 138, ${alpha * 0.25})`);
  crestGrad3.addColorStop(0.24, `rgba(254, 240, 138, 0.0)`);
  crestGrad3.addColorStop(1.0, `rgba(254, 240, 138, 0.0)`);
  drawCrestPath(0.48);
  ctx.fillStyle = crestGrad3;
  ctx.fill();

  const crestGrad4 = ctx.createLinearGradient(0, 0, s * 0.8, 0);
  crestGrad4.addColorStop(0.0, `rgba(255, 255, 255, ${alpha * 0.80})`);
  crestGrad4.addColorStop(0.14, `rgba(255, 255, 255, 0.0)`);
  crestGrad4.addColorStop(1.0, `rgba(255, 255, 255, 0.0)`);
  drawCrestPath(0.24);
  ctx.fillStyle = crestGrad4;
  ctx.fill();

  ctx.restore();
}

/**
 * 비산하는 쐐기형 화염 조각 (Floating Flame Flake)
 */
function drawFireSpinFlake(
  ctx: any,
  x: number,
  y: number,
  size: number,
  angle: number,
  alpha: number
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // 뾰족한 유선형 불꽃 조각
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(size * 0.5, 0, 0, size * 0.8);
  ctx.quadraticCurveTo(-size * 0.5, 0, 0, -size);
  ctx.closePath();

  ctx.fillStyle = `rgba(249, 115, 22, ${alpha * 0.9})`;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, -size * 0.6);
  ctx.quadraticCurveTo(size * 0.25, 0, 0, size * 0.4);
  ctx.quadraticCurveTo(-size * 0.25, 0, 0, -size * 0.6);
  ctx.closePath();

  ctx.fillStyle = `rgba(254, 240, 138, ${alpha * 0.95})`;
  ctx.fill();

  ctx.restore();
}

/**
 * 5세대 B/W 레퍼런스 스타일 3D 화염 볼텍스 (앞/뒤 분할 렌더러)
 * - [사용자 요구사항 반영]:
 *   1) 회전 방향과 반대방향인 우측 위쪽으로 불의 꼬리가 올라가 있음
 *   2) 선명한 선 제거 ➔ 진행방향 쪽은 반투명, 진행방향과 반대방향은 완전투명한 스위핑 트레일
 *   3) 캐릭터가 자연스럽게 화염 사이로 보이는 풍성하고 유기적인 3줄기 볼텍스
 */
function drawFireSpin3DVortex(
  ctx: any,
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number,
  isFront: boolean
) {
  const numRibbons = 3; // 3가닥의 메인 나선 화염 스트림
  const rot = (moveStep - 3) * 2.3 + effectProgress * 2.3;

  let minU = 0.0;
  let maxU = 1.0;
  let alpha = 1.0;
  let riseLimit = 1.0; // [핵심]: 아래에서 위로 나타나는 전선 높이

  if (moveStep === 3) {
    // 1단: 바닥 지면(0.0)에서부터 허리 높이(0.50)까지 아래에서 위로 치솟으며 나타남
    riseLimit = 0.06 + effectProgress * 0.44; // 0.06 ~ 0.50
    minU = 0.0;
    maxU = riseLimit;
    alpha = Math.min(1.0, 0.55 + effectProgress * 0.45);
  } else if (moveStep === 4) {
    // 2단: 허리(0.50)에서 머리 위 최상공(1.00)까지 계속해서 위로 솟구치며 볼텍스 완성
    riseLimit = 0.50 + effectProgress * 0.50; // 0.50 ~ 1.00
    minU = 0.0;
    maxU = riseLimit;
    alpha = 1.0;
  } else if (moveStep >= 5 && moveStep <= 7) {
    // 3단: 3D 화염 감옥 풀 볼텍스 구속 지속 (완성된 화염 기둥 유지)
    riseLimit = 1.0;
    minU = 0.0;
    maxU = 1.0;
    alpha = 1.0;
  } else if (moveStep === 8) {
    // 4단: 상공 분산 소멸 (바닥부터 흩어짐)
    riseLimit = 1.0;
    minU = effectProgress * 0.55;
    maxU = 1.0;
    alpha = Math.max(0.0, 1.0 - effectProgress * 1.15);
  }

  if (alpha <= 0.01 || minU >= maxU) return;

  // -------------------------------------------------------------
  // 1. 3가닥의 메인 화염 스트림 렌더링
  // - [핵심]: 불꽃 덩어리들이 지속적으로 아래에서 위로 솟구쳐 올라가는 상승 모션
  // - 나타나는 단계(Step 3~4)에서는 riseLimit보다 높은 곳의 불꽃은 아직 안 나타남
  // -------------------------------------------------------------
  const headsPerStream = 5;
  const riseSpeed = 0.35;
  const climb = (moveStep - 3 + effectProgress) * riseSpeed;

  for (let r = 0; r < numRibbons; r++) {
    const ribbonOffset = r * ((Math.PI * 2) / numRibbons);

    for (let h = 0; h < headsPerStream; h++) {
      // 각 헤드가 아래에서 위로 나선을 타고 솟구쳐 오르는 높이
      const baseH = h / headsPerStream;
      const headU = (baseH + climb) % 1.0;

      // [핵심]: 아래에서 위로 나타나는 전선(riseLimit)보다 높은 불꽃은 차단하여 아래->위 출현 연출!
      if (headU > riseLimit || headU < minU) continue;

      // 나선 각도
      const headAngle = headU * Math.PI * 5.2 + rot + ribbonOffset;
      const headPt = getFireSpinVortexPoint(targetPos, headU, headAngle);

      // z 판별 (앞면: z >= -0.06, 뒷면: z < 0.06)
      const isHeadFront = headPt.z >= -0.06;

      // A. [핵심]: 모션 스위핑 트레일 렌더링 (진행방향은 반투명, 반대방향은 완전투명!)
      drawFireSpinSweepingTrail(ctx, targetPos, headU, headAngle, isFront, alpha);

      // B. [핵심]: 화염 헤드 로브 (꼬리 아래쪽으로 기체 연기 방출)
      if ((isFront && isHeadFront) || (!isFront && !isHeadFront)) {
        // 크기는 상공으로 갈수록 나팔형으로 확장
        const lobeSize = (6.8 + headU * 4.2) * (0.9 + 0.2 * Math.sin(rot * 2 + r * 3 + h));
        const wobble = Math.sin(rot * 3 + h * 2 + r) * 0.15;

        // 최상단(headU > 0.82)에서는 거대한 3갈래 크레스트, 그 외는 4단 셀 셰이딩 화염 로브
        if (headU > 0.82) {
          drawFireSpinTopCrest(ctx, headPt.x, headPt.y, lobeSize * 1.25, isFront, alpha, r * 10 + h);
        } else {
          drawFireSpinFlameLobe(ctx, headPt.x, headPt.y, lobeSize, isFront, alpha, r * 10 + h, wobble);
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 2. 외곽으로 흩날리는 불꽃 파편 (Flakes) & 맹렬한 스파크 (16개)
  // -------------------------------------------------------------
  const flakeCount = 16;
  const time = (moveStep - 3) * 0.32 + effectProgress * 0.32;

  for (let f = 0; f < flakeCount; f++) {
    const fSeed = f * 1.618;
    const fU = (fSeed + time * 0.95) % 1.0;

    if (fU < minU || fU > riseLimit) continue;

    const fAngle = fU * Math.PI * 5.2 + rot * 1.2 + fSeed * Math.PI * 2;
    const basePt = getFireSpinVortexPoint(targetPos, fU, fAngle);
    const outwardDist = 4 + (f % 4) * 3.5;
    const fx = basePt.x + Math.cos(fAngle) * outwardDist;
    const fy = basePt.y + Math.sin(fAngle) * outwardDist * 0.35 - (fU * 8);

    const isFlakeFront = basePt.z >= -0.05;
    if ((isFront && !isFlakeFront) || (!isFront && isFlakeFront)) continue;

    const flakeAlpha = Math.min(1.0, fU * 4.0) * Math.max(0.0, 1.0 - fU * 0.9) * alpha;

    if (f % 2 === 0) {
      // 쐐기형 불꽃 파편 (우측 위쪽 각도로 비산)
      const fSize = 3.2 + (f % 3) * 1.2;
      drawFireSpinFlake(ctx, fx, fy, fSize, -Math.PI * 0.25, flakeAlpha);
    } else {
      // 고열 사각 스파크 엠버
      const sSz = 1.8 + (f % 3) * 0.6;
      ctx.fillStyle = f % 3 === 1 ? `rgba(254, 240, 138, ${flakeAlpha})` : `rgba(249, 115, 22, ${flakeAlpha})`;
      ctx.fillRect(fx - sSz / 2, fy - sSz / 2, sSz, sSz);
    }
  }

  // -------------------------------------------------------------
  // 3. 발밑 지면 착화 화염 클러스터 (Ground Base Flames)
  // -------------------------------------------------------------
  if (minU <= 0.15 && riseLimit >= 0.05) {
    const baseCount = 5;
    for (let b = 0; b < baseCount; b++) {
      const bAngle = (b / baseCount) * Math.PI * 2 + rot * 0.7;
      const bPt = getFireSpinVortexPoint(targetPos, 0.05, bAngle);
      const isBaseFront = bPt.z >= -0.05;
      if ((isFront && !isBaseFront) || (!isFront && isBaseFront)) continue;

      const baseSize = 4.8 + (b % 3) * 1.6;
      drawFireSpinFlameLobe(
        ctx,
        bPt.x,
        bPt.y,
        baseSize,
        isFront,
        alpha * 0.9,
        b + 77,
        0
      );
    }
  }
}

/**
 * 회오리불꽃 뒷면 레이어 (대상 뒤쪽을 통과하는 3D 화염 기둥 및 화염 덩어리)
 */
export function drawBehindFireSpinEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0.5,
  isPlayer: boolean = true
) {
  if (moveStep < 3 || moveStep > 8) return;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // 3D 화염 볼텍스 뒷면 렌더링
  drawFireSpin3DVortex(ctx, targetPos, moveStep, effectProgress, false);

  ctx.restore();
}

/**
 * 회오리불꽃 앞면 레이어 메인 렌더러
 */
export function drawFireSpinEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0.5,
  isPlayer: boolean = true
) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Phase 1: 불 발사 (Step 1) - 중심 구체 + 외곽 회전하는 3개 불꽃
  if (moveStep === 1) {
    drawFireSpinProjectile(ctx, attackerPos, targetPos, effectProgress, isPlayer);
  }

  // Phase 2: 지면 착탄 (Step 2)
  else if (moveStep === 2) {
    drawFireSpinImpact(ctx, targetPos, effectProgress);
  }

  // Phase 3: 바닥부터 올라오는 3D 불 회오리 및 구속 (Step 3~8)
  else if (moveStep >= 3 && moveStep <= 8) {
    // 3D 화염 볼텍스 앞면 렌더링
    drawFireSpin3DVortex(ctx, targetPos, moveStep, effectProgress, true);
  }

  ctx.restore();
}

// ============================================================================
// 084: 전기쇼크 (Thunder Shock)
// ============================================================================

/**
 * 지그재그 번개 줄기 생성 헬퍼
 */
// ============================================================================
// 084: 전기쇼크 (Thunder Shock)
// - [유저 요청: "전기쇼크는 10만볼트 그대로 가져다가 전기가닥이랑 이펙트 약화시킨 형태로 만들어"]
// - 10만볼트(085)의 고품질 렌더링 파이프라인(날카로운 테이퍼링 볼트, 플라즈마 구체, 충격파 링, 스파클 엠버)을
//   기본기로서 컴팩트하고 슬림하게 약화 스케일링한 버전.
// ============================================================================

export function drawThunderShockEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0.5,
  isPlayer: boolean = true
) {
  ctx.save();
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.miterLimit = 3.5;

  const startX = attackerPos.x + (isPlayer ? 10 : -10);
  const startY = attackerPos.y - 12;
  const targetX = targetPos.x;
  const targetY = targetPos.y - 6;

  // --------------------------------------------------------------------------
  // 1. 전체 화면 암전 및 노란빛 대전환 & 페이드아웃 오버레이 (10만볼트 대비 부드럽고 가볍게)
  // --------------------------------------------------------------------------
  if (moveStep === 1) {
    // Step 1: 시전 준비 & 전장 은은한 정전기 암전 (42%)
    ctx.save();
    ctx.fillStyle = "rgba(4, 6, 14, 0.42)";
    ctx.fillRect(-5000, -5000, 12000, 12000);
    ctx.restore();
  } else if (moveStep === 2 || moveStep === 3) {
    // Step 2 & 3: 전기 가닥 발사 & 쇄도 중 암전 (48%)
    ctx.save();
    ctx.fillStyle = "rgba(4, 6, 14, 0.48)";
    ctx.fillRect(-5000, -5000, 12000, 12000);
    ctx.restore();
  } else if (moveStep === 4) {
    // Step 4: 타격 순간 부드러운 황금빛 노란 조명 대전환 (26%)
    ctx.save();
    ctx.fillStyle = "rgba(250, 204, 21, 0.26)";
    ctx.fillRect(-5000, -5000, 12000, 12000);
    ctx.restore();
  } else if (moveStep === 5) {
    // Step 5: 노란빛 조명 1차 페이드아웃 (14%)
    ctx.save();
    ctx.fillStyle = "rgba(234, 179, 8, 0.14)";
    ctx.fillRect(-5000, -5000, 12000, 12000);
    ctx.restore();
  } else if (moveStep === 6) {
    // Step 6: 잔류 노란빛 2차 페이드아웃 (5%)
    ctx.save();
    ctx.fillStyle = "rgba(234, 179, 8, 0.05)";
    ctx.fillRect(-5000, -5000, 12000, 12000);
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 2. 스텝별 애니메이션 그래픽 (10만볼트 파이프라인 약화 버전)
  // --------------------------------------------------------------------------

  // Step 1: 시전자 주변 작은 정전기 스파크 충전
  if (moveStep === 1) {
    const p = effectProgress;

    // 시전자 중심 소형 플라즈마 응축구 (반경 9~13px)
    const coreGrad = ctx.createRadialGradient(startX, startY, 0, startX, startY, 9 + p * 4);
    coreGrad.addColorStop(0.0, "#FFFFFF");
    coreGrad.addColorStop(0.35, "#FEF9C3");
    coreGrad.addColorStop(0.70, "#CCFF00");
    coreGrad.addColorStop(1.0, "rgba(204, 255, 0, 0)");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(startX, startY, 9 + p * 4, 0, Math.PI * 2);
    ctx.fill();

    // 4방향 미니 고압 전격 스파크 (10만볼트의 8방향 대비 4방향, 두께 1.2px)
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + p * 5.0;
      const r = 12 + (i % 2) * 6;
      const x1 = startX + Math.cos(a) * 4;
      const y1 = startY + Math.sin(a) * 4;
      const x2 = startX + Math.cos(a) * r;
      const y2 = startY + Math.sin(a) * r;

      const pts = createLightningPoints(x1, y1, x2, y2, 3, 6, i * 1.9);
      drawSharpGlowingBolt(ctx, pts, 1.2, 0.85, true, true, true);
    }
  }

  // Step 2: 슬림한 2가닥 전격 발사 (0% -> 50% 도달)
  else if (moveStep === 2) {
    const p = effectProgress;
    const reach = 0.45 + p * 0.12;
    const headX = startX + (targetX - startX) * reach;
    const headY = startY + (targetY - startY) * reach;

    // 2가닥 슬림 볼트 줄기 (10만볼트의 4가닥 대비 2가닥 & 얇은 두께 w: 2.8, 1.8)
    const bolts = [
      { sx: startX, sy: startY, tx: headX, ty: headY, jitter: 14, seed: 1.2, w: 2.8 },
      { sx: startX, sy: startY - 4, tx: headX - 6, ty: headY + 5, jitter: 18, seed: 3.5, w: 1.8 },
    ];

    for (const b of bolts) {
      const pts = createLightningPoints(b.sx, b.sy, b.tx, b.ty, 6, b.jitter, b.seed);
      drawSharpGlowingBolt(ctx, pts, b.w, 0.95, true, true, true);
    }

    // 소형 선두 관통 헤드
    const angle = Math.atan2(targetY - startY, targetX - startX);
    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate(angle);

    const headGrad = ctx.createLinearGradient(-5, 0, 9, 0);
    headGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.60)");
    headGrad.addColorStop(0.4, "rgba(254, 249, 195, 0.40)");
    headGrad.addColorStop(0.75, "rgba(204, 255, 0, 0.15)");
    headGrad.addColorStop(1.0, "rgba(204, 255, 0, 0.0)");

    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-5, -4);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-5, 4);
    ctx.closePath();
    ctx.fill();

    // 헤드 전방 1줄기 미세 스파크 바늘
    const needleGrad = ctx.createLinearGradient(4, 0, 12, 0);
    needleGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.55)");
    needleGrad.addColorStop(0.6, "rgba(204, 255, 0, 0.25)");
    needleGrad.addColorStop(1.0, "rgba(204, 255, 0, 0.0)");
    ctx.strokeStyle = needleGrad;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(12, 0);
    ctx.stroke();

    ctx.restore();
  }

  // Step 3: 전격 쇄도 & 표적 직전 도달 (50% -> 100% 관통 격돌)
  else if (moveStep === 3) {
    const p = effectProgress;

    // 2가닥 슬림 메인 벼락 줄기 (w: 3.0, 1.9)
    const bolts = [
      { sx: startX, sy: startY, tx: targetX, ty: targetY, jitter: 18, seed: 2.3, w: 3.0 },
      { sx: startX, sy: startY - 4, tx: targetX - 6, ty: targetY + 6, jitter: 22, seed: 4.6, w: 1.9 },
    ];

    for (const b of bolts) {
      const pts = createLightningPoints(b.sx, b.sy, b.tx, b.ty, 8, b.jitter, b.seed);
      drawSharpGlowingBolt(ctx, pts, b.w, 0.95, true, true);
    }

    // 착탄점 예비 스파크 2개
    for (let i = 0; i < 2; i++) {
      const spAng = i * Math.PI + 0.4;
      const spLen = 10;
      const pts = createLightningPoints(targetX, targetY, targetX + Math.cos(spAng) * spLen, targetY + Math.sin(spAng) * spLen, 2, 4, i * 2.5);
      drawSharpGlowingBolt(ctx, pts, 1.4, 0.85, true, true);
    }
  }

  // Step 4: 직격 타격 & 소형 플라즈마 임팩트 & 슬림 충격파 링
  else if (moveStep === 4) {
    const p = effectProgress;

    // 연결 잔류 뇌격 1줄기 (10만볼트의 2줄기 대비 1줄기)
    const pts = createLightningPoints(startX, startY, targetX, targetY, 7, 14, 3.1);
    drawSharpGlowingBolt(ctx, pts, 2.2, 0.80, true, true);

    // 10만볼트 대비 컴팩트해진 플라즈마 구체 (반경 20px vs 38px, 7개 텐드릴 vs 14개)
    drawThunderboltPlasmaSphere(ctx, targetX, targetY, 20, 0.95, 1.0, 7);

    // 슬림 충격파 링 (반경 24~34px vs 44~60px, 두께 8px vs 14px)
    const ringR = 24 + p * 10;
    drawShockwaveRing(ctx, targetX, targetY, ringR, 8, 0.45 - p * 0.15);
  }

  // Step 5: 소형 플라즈마 방전 & 6방향 스파이크 & 1개 전격 루프
  else if (moveStep === 5) {
    const p = effectProgress;

    // 방전 구체 (반경 22px vs 44px, 7개 텐드릴 vs 14개)
    drawThunderboltPlasmaSphere(ctx, targetX, targetY, 22, 0.80, 3.8, 7);

    // 6방향 지그재그 뇌격 스파이크 (10만볼트의 12방향 대비 6방향, 반경 30~42px vs 54~78px)
    const blastR = 30 + p * 12;
    drawRadiatingTaperedStrands(ctx, targetX, targetY, 6, 14, blastR, p * 1.5, 0.75);

    // 전신 감전 루프 1개 (10만볼트의 2개 대비 1개)
    ctx.save();
    ctx.translate(targetX, targetY);
    ctx.rotate(0.35 + p * 0.4);
    ctx.strokeStyle = "rgba(204, 255, 0, 0.60)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Step 6: 뇌격 스파크 비산 (피격 반영)
  else if (moveStep === 6) {
    const p = effectProgress;
    const alpha = Math.max(0.0, 1.0 - p * 0.8);

    // 중심 잔류 구체 소멸 (반경 14px vs 28px)
    drawThunderboltPlasmaSphere(ctx, targetX, targetY, 14 * (1.0 - p * 0.5), alpha * 0.5, 6.2, 5);

    // 8개의 미세 전기 스파클 엠버 (10만볼트의 18개 대비 8개)
    drawElectricSparkEmbers(ctx, targetX, targetY, 8, 16, p, 2.0, alpha * 0.85);
  }

  // Step 7: 잔류 전격 냉각
  else if (moveStep === 7) {
    const p = effectProgress;
    const alpha = Math.max(0.0, 1.0 - p);

    // 잔여 미세 스파클 4개 (10만볼트의 8개 대비 4개)
    drawElectricSparkEmbers(ctx, targetX, targetY, 4, 10, p, 5.0, alpha * 0.70);
  }

  ctx.restore();
}
