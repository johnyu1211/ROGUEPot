// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawMiniRetroStar, drawStarburstImpact } from "../common/helpers.js";
import { createLightningPoints } from "./move085_088.js";

// ============================================================================
// ⚡ 209: 스파크 (Spark) - 전기 타입 물리 기술
//
// [유저 지정 연출 규격]:
// 1. 화면 노랗게 암전 (노란빛 대기 암전)
// 2. 바깥에는 노란색, 안쪽은 흰색으로 이루어진 (외곽 그라데이션, border 등은 없음)
//    점점 서서히 커짐 (커지면서 전기를 뿜어냄)
//    (검정 외곽 투명이 좀 많은 (거의 연기들 참고) 그림자)
//    (전기는 끝이 뾰족한 찌지직을 뿜어냄)
// 3. 그리고 돌진 박치기
// 4. 대상 포켓몬에게도 동일한 찌지직 뿜어냄
// ============================================================================

// 256색 최적화 전기 팔레트 (Octree Quantizer 최적화)
const ELEC_WHITE = "#FFFFFF";       // 눈부신 초고온 코어
const ELEC_LIGHT = "#FEF08A";       // 네온 라이트 옐로우
const ELEC_YELLOW = "#FDE047";      // 선명한 네온 옐로우
const ELEC_GOLD = "#FACC15";        // 베이스 일렉트릭 골드
const ELEC_DARK = "#EAB308";        // 딥 앰버 섀도우
const ELEC_AMBER = "#CA8A04";       // 외곽 음영 오라

/**
 * 화면 노랗게 암전 렌더러
 */
function drawYellowDarkness(ctx: any, width: number, height: number, alpha: number, isFlickerFlash: boolean = false) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(0.78, Math.max(0, alpha));

  // 1. 짙은 앰버-블랙 대기 암전 (카메라 줌/팬/적 시전 시에도 절대 잘리지 않는 무한 화각)
  ctx.fillStyle = "#1a1504";
  ctx.fillRect(-6000, -6000, 14000, 14000);

  // 2. 은은한 황금빛 전자기 틴트
  ctx.fillStyle = "rgba(234, 179, 8, 0.12)";
  ctx.fillRect(-6000, -6000, 14000, 14000);

  // 3. 팍 터질 때 번쩍하는 전자기 섬광 (Flicker Flash)
  if (isFlickerFlash) {
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#FEF08A";
    ctx.fillRect(-6000, -6000, 14000, 14000);
  }

  ctx.restore();
}

/**
 * 검정 외곽 투명이 많은 부드러운 연기 형태의 그림자 (외곽 투명이 많은 거의 연기들 참고)
 */
function drawDarkSmokyShadow(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number
) {
  if (radius <= 2 || alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 번개와 구체 둘레를 부드럽게 감싸는 다중 연기 그림자 퍼프
  const puffs = [
    { dx: 0, dy: radius * 0.06, r: radius * 1.15, op: 0.70 },
    { dx: -radius * 0.22, dy: -radius * 0.06, r: radius * 0.95, op: 0.55 },
    { dx: radius * 0.22, dy: radius * 0.08, r: radius * 0.98, op: 0.58 },
    { dx: 0, dy: -radius * 0.18, r: radius * 0.90, op: 0.48 },
    { dx: -radius * 0.16, dy: radius * 0.18, r: radius * 0.88, op: 0.50 },
  ];

  for (const p of puffs) {
    const px = cx + p.dx;
    const py = cy + p.dy;
    const pr = p.r;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, pr);
    grad.addColorStop(0.0, `rgba(8, 7, 4, ${p.op})`);
    grad.addColorStop(0.35, `rgba(16, 13, 7, ${p.op * 0.60})`);
    grad.addColorStop(0.70, `rgba(24, 18, 9, ${p.op * 0.20})`);
    grad.addColorStop(1.0, "rgba(0, 0, 0, 0.0)"); // 외곽 투명이 많은 부드러운 연기 마감

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 바깥에는 노란색, 안쪽은 흰색 (외곽 그라데이션, border 없음) 전기 구체
 */
function drawElectricSphere(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number
) {
  if (radius <= 1 || alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0.0, "#FFFFFF");                    // 안쪽 순백색
  grad.addColorStop(0.25, "rgba(255, 255, 255, 0.96)");
  grad.addColorStop(0.50, "rgba(254, 240, 138, 0.88)"); // 네온 옐로우
  grad.addColorStop(0.75, "rgba(250, 204, 21, 0.55)");  // 골드 옐로우
  grad.addColorStop(1.0, "rgba(234, 179, 8, 0.0)");     // border 없이 부드럽게 0으로 사라짐

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 날카로운 지그재그 번개 좌표 생성 (1번 이미지의 각진 \/\/\ 찌지직 번개)
 */
function createSharpElectricPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  segments: number = 6,
  jitter: number = 5.5,
  seed: number = 0
): { x: number; y: number }[] {
  const points = [{ x: x1, y: y1 }];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return points;

  const nx = -dy / dist;
  const ny = dx / dist;
  const ux = dx / dist;
  const uy = dy / dist;

  const initialSide = Math.sin(seed * 3.7) > 0 ? 1 : -1;
  // 각도 꺾인 마디의 꺾임 길이가 너무 튀어나오지 않도록 축소 및 클램핑
  const maxJitter = Math.min(jitter, dist * 0.18);

  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const bx = x1 + dx * t;
    const by = y1 + dy * t;

    // 매 마디마다 좌우로 적당한 길이로 꺾이는 날카로운 지그재그 (\/\/\)
    const side = (i % 2 === 1 ? initialSide : -initialSide);
    const bellFactor = Math.sin(t * Math.PI);
    const sideJitter = side * maxJitter * (0.75 + 0.35 * Math.abs(Math.sin(seed + i * 2.1))) * Math.max(0.65, bellFactor);
    const fwdJitter = (Math.cos(seed * 2.3 + i * 1.7) * maxJitter * 0.12);

    points.push({
      x: bx + nx * sideJitter + ux * fwdJitter,
      y: by + ny * sideJitter + uy * fwdJitter,
    });
  }

  // 최종 끝점: 목표 외곽 좌표로 직선 연장
  points.push({ x: x2, y: y2 });
  return points;
}

/**
 * 안쪽은 투명 그라데이션, 바깥 끝은 뾰족한 침으로 끝나는 스파크 찌지직 렌더러
 * - 안쪽(p0, 시작부): 0% 투명도에서 서서히 나타나는 투명 그라데이션 (부드러운 시작)
 * - 중간부: 고전압 네온 옐로우 & 순백 핫 코어의 강렬한 다층 발광
 * - 바깥 끝(pLast, 종단부): 0 너비의 날카로운 정점 바늘(Needle Apex Spike)로 완벽하게 뾰족함
 */
function drawSharpCrackle(
  ctx: any,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  baseWidth: number,
  seed: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  const pts = createSharpElectricPoints(x1, y1, x2, y2, 6, 5.5, seed);
  const n = pts.length;
  if (n < 2) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const p0 = pts[0];
  const pLast = pts[n - 1];
  const pPrev = pts[n - 2];

  // 끝 세그먼트의 법선 벡터 (끝점 테이퍼링 바늘침 계산용)
  const endDx = pLast.x - pPrev.x;
  const endDy = pLast.y - pPrev.y;
  const endLen = Math.hypot(endDx, endDy) || 1;
  const endNx = -endDy / endLen;
  const endNy = endDx / endLen;

  // 0. ★ [전기의 그림자 언더레이]: 안쪽은 투명 그라데이션으로 부드럽게 시작
  const shadowGrad = ctx.createLinearGradient(p0.x, p0.y, pLast.x, pLast.y);
  shadowGrad.addColorStop(0.0, "rgba(12, 10, 5, 0.0)");       // 안쪽 완전 투명!
  shadowGrad.addColorStop(0.30, "rgba(12, 10, 5, 0.28)");
  shadowGrad.addColorStop(0.70, "rgba(12, 10, 5, 0.20)");
  shadowGrad.addColorStop(1.0, "rgba(12, 10, 5, 0.0)");        // 바깥도 투명

  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.miterLimit = 3.0;

  // 번개 배후 연기 그림자 언더레이 (alpha가 0.20 이상일 때만 입체 그림자 적용)
  if (alpha >= 0.20) {
    const numSegs = n - 1;
    for (let i = 0; i < Math.min(numSegs - 1, Math.ceil(numSegs * 0.70)); i++) {
      const t = i / numSegs;
      const shadowW = baseWidth + 2.2 * (1.0 - t * 0.5);
      ctx.strokeStyle = shadowGrad;
      ctx.lineWidth = shadowW;
      ctx.beginPath();
      ctx.moveTo(pts[i].x, pts[i].y);
      ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
      ctx.stroke();
    }
  }

  // ★ 안쪽 투명 그라데이션 레이어 스타일 생성 헬퍼
  // (0.0 위치는 항상 0.0 투명도로 시작하여 안쪽이 부드럽게 투명 그라데이션 처리됨)
  const createInnerFadeStyle = (
    baseR: number,
    baseG: number,
    baseB: number,
    peakA: number
  ) => {
    const grad = ctx.createLinearGradient(p0.x, p0.y, pLast.x, pLast.y);
    grad.addColorStop(0.0, `rgba(${baseR}, ${baseG}, ${baseB}, 0.0)`);           // 안쪽 완전 투명 (0.0)
    grad.addColorStop(0.18, `rgba(${baseR}, ${baseG}, ${baseB}, ${peakA * 0.22})`); // 서서히 투명 페이드인
    grad.addColorStop(0.45, `rgba(${baseR}, ${baseG}, ${baseB}, ${peakA * 0.85})`);
    grad.addColorStop(0.75, `rgba(${baseR}, ${baseG}, ${baseB}, ${peakA})`);       // 외곽에서 최고 전압
    grad.addColorStop(1.0, `rgba(${baseR}, ${baseG}, ${baseB}, ${peakA * 0.90})`);
    return grad;
  };

  // 다층 볼류메트릭 발광 레이어 (안쪽 투명 그라데이션)
  const styleOuterHaze = createInnerFadeStyle(234, 179, 8, 0.10);  // 최외곽 산란 앰버 오라
  const styleGlowAmber = createInnerFadeStyle(250, 204, 21, 0.22); // 외곽 골드 글로우
  const styleMidNeon   = createInnerFadeStyle(253, 224, 71, 0.55); // 선명한 네온 옐로우
  const styleSubCore   = createInnerFadeStyle(254, 240, 138, 0.85); // 백황색 서브 코어
  const styleHotCore   = createInnerFadeStyle(255, 255, 255, 1.00); // 눈부신 순백 코어

  const drawLayer = (strokeColor: any, layerWidth: number, drawSpike: boolean = true) => {
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = strokeColor;
    ctx.lineWidth = layerWidth;

    // 본체 스트로크 (안쪽 p0부터 끝 pPrev까지)
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < n - 1; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();

    // 끝점: pLast에서 너비 0으로 수렴하는 날카로운 정점 바늘 (Needle Apex Spike)
    if (drawSpike) {
      const hw = layerWidth * 0.5;
      ctx.beginPath();
      ctx.moveTo(pLast.x, pLast.y); // 날카로운 끝 정점 (너비 0)
      ctx.lineTo(pPrev.x + endNx * hw, pPrev.y + endNy * hw);
      ctx.lineTo(pPrev.x - endNx * hw, pPrev.y - endNy * hw);
      ctx.closePath();
      ctx.fill();
    }
  };

  // 1. 최외곽 소프트 대기 산란
  drawLayer(styleOuterHaze, baseWidth * 4.2, false);
  // 2. 외곽 골드 글로우
  drawLayer(styleGlowAmber, baseWidth * 2.8, true);
  // 3. 고전압 일렉트릭 레몬 미드 바디
  drawLayer(styleMidNeon, baseWidth * 1.8, true);
  // 4. 따뜻한 백황색 서브 코어
  drawLayer(styleSubCore, baseWidth * 1.1, true);
  // 5. 눈부신 순백 핫 코어 (선명하고 얇은 백색 전기침)
  drawLayer(styleHotCore, Math.max(0.9, baseWidth * 0.45), true);

  ctx.restore();
}

/**
 * 특정 중심점 둘레로 끝이 뾰족한 찌지직 방사 헬퍼
 */
function drawRadialSharpCrackles(
  ctx: any,
  cx: number,
  cy: number,
  count: number,
  innerR: number,
  outerR: number,
  baseWidth: number,
  seedOffset: number,
  alpha: number
) {
  if (alpha <= 0.01) return;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (seedOffset * 0.35);
    const r1 = innerR * (0.6 + ((i * 3) % 4) * 0.12);
    const r2 = outerR * (0.85 + ((i * 7) % 5) * 0.08);
    const x1 = cx + Math.cos(angle) * r1;
    const y1 = cy + Math.sin(angle) * r1 * 0.88;
    const x2 = cx + Math.cos(angle) * r2;
    const y2 = cy + Math.sin(angle) * r2 * 0.88;
    drawSharpCrackle(ctx, x1, y1, x2, y2, baseWidth, i * 4.3 + seedOffset * 5.7, alpha);
  }
}

/**
 * 외각 글로우 효과를 가진 초소형 단일 점 파티클 렌더러
 * - 코어는 밝고 순백의 선명한 미세 점 (0.65 ~ 1.25px)
 * - 외각은 컴팩트하고 강렬한 네온 옐로우/골드 발광 글로우
 */
function drawGlowingDot(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number = 1.0,
  glowColor: string = "rgba(254, 240, 138, 0.92)"
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 컴팩트한 글로우 반경 (외곽 투명이 많은 부드럽고 작은 발광)
  const haloR = Math.max(1.8, radius * 2.3);
  const grad = ctx.createRadialGradient(x, y, 0, x, y, haloR);
  grad.addColorStop(0.0, "#FFFFFF");                   // 코어 순백
  grad.addColorStop(0.35, "rgba(255, 255, 255, 0.95)");
  grad.addColorStop(0.70, glowColor);                   // 외각 네온 옐로우 글로우
  grad.addColorStop(1.0, "rgba(234, 179, 8, 0.0)");     // 부드러운 투명 감쇄

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, haloR, 0, Math.PI * 2);
  ctx.fill();

  // 초소형 코어 스파크 침 (반짝이는 점)
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.45, radius * 0.55), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 적 타격 시 사방으로 폭발/비산하는 초소형 외각 글로우 점 파티클 렌더러
 * - 360도 전방향으로 힘차게 퍼져나가는 방사 속도 벡터 적용
 * - 비산 궤적을 보여주는 초미세 선형 스트릭으로 "사방으로 퍼지는 느낌" 극대화
 */
function drawRadialSparkParticles(
  ctx: any,
  cx: number,
  cy: number,
  count: number,
  minDist: number,
  maxDist: number,
  seed: number,
  alpha: number = 1.0,
  streakLength: number = 0
) {
  if (alpha <= 0.01) return;
  ctx.save();

  for (let i = 0; i < count; i++) {
    const pSeed = seed + i * 11.37;
    // 360도 전방향 골고루 퍼지면서 유기적인 각도 지터
    const baseAngle = (i / count) * Math.PI * 2;
    const angleJitter = Math.sin(pSeed * 1.7) * 0.40;
    const angle = baseAngle + angleJitter;

    // 사방으로 퍼지는 다양한 비산 거리 (속도 편차)
    const distRatio = 0.25 + 0.75 * Math.abs(Math.sin(pSeed * 3.1));
    const dist = minDist + (maxDist - minDist) * distRatio;

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // 타원형 배틀 구도 (y축 0.85 투영)
    const px = cx + cosA * dist;
    const py = cy + sinA * dist * 0.85;

    // 작고 깔끔한 점 크기 (0.65px ~ 1.25px)
    const dotR = 0.65 + ((i * 3) % 4) * 0.20;
    const pAlpha = alpha * (0.60 + 0.40 * Math.abs(Math.sin(pSeed * 4.3)));

    // 사방으로 뻗어 나가는 방사 궤적 스트릭
    if (streakLength > 0.5 && pAlpha > 0.08) {
      const sLen = streakLength * (0.6 + 0.7 * distRatio);
      const tailX = px - cosA * sLen;
      const tailY = py - sinA * sLen * 0.85;

      ctx.save();
      ctx.globalAlpha = pAlpha * 0.80;
      ctx.strokeStyle = "rgba(254, 240, 138, 0.85)";
      ctx.lineWidth = Math.max(0.6, dotR * 0.75);
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(px, py);
      ctx.stroke();

      // 내부 코어 백색 스트릭
      ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      ctx.lineWidth = Math.max(0.4, dotR * 0.4);
      ctx.beginPath();
      ctx.moveTo(tailX + (px - tailX) * 0.45, tailY + (py - tailY) * 0.45);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.restore();
    }

    // 선단부 외각 글로우 점 파티클
    drawGlowingDot(ctx, px, py, dotR, pAlpha);
  }

  ctx.restore();
}

/**
 * 돌진 격돌 순간 "팍!" 하고 터지는 고에너지 전기 파열 폭발 렌더러
 */
function drawSparkBurst(
  ctx: any,
  hitX: number,
  hitY: number,
  progress: number,
  seedOffset: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 1. 배후 충격파 연기 그림자 (외곽 투명이 많은 부드러운 연기 폭발 - 30% 축소)
  const smokeRadius = 32 + progress * 25;
  drawDarkSmokyShadow(ctx, hitX, hitY, smokeRadius, 0.75 * (1.0 - progress * 0.5));

  // 2. 전기 충격파 링 (Expanding Electric Shockwave Ring - 30% 축소)
  const ringR = 13 + progress * 38;
  const ringAlpha = Math.max(0, (1.0 - progress) * 0.85);
  if (ringAlpha > 0.02) {
    ctx.lineWidth = Math.max(1.2, 2.8 * (1.0 - progress));
    ctx.strokeStyle = `rgba(254, 240, 138, ${ringAlpha})`;
    ctx.beginPath();
    ctx.arc(hitX, hitY, ringR, 0, Math.PI * 2);
    ctx.stroke();

    // 2차 내부 백색 충격파
    ctx.lineWidth = Math.max(0.8, 1.5 * (1.0 - progress));
    ctx.strokeStyle = `rgba(255, 255, 255, ${ringAlpha * 0.9})`;
    ctx.beginPath();
    ctx.arc(hitX, hitY, ringR * 0.72, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 3. 중심부 순백-황금 파열 코어 (Blinding Burst Core Flash - 30% 축소)
  const coreR = Math.max(6, 26 * (1.0 - progress * 0.7));
  const coreGrad = ctx.createRadialGradient(hitX, hitY, 0, hitX, hitY, coreR);
  coreGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.95)");
  coreGrad.addColorStop(0.35, "rgba(254, 240, 138, 0.80)");
  coreGrad.addColorStop(0.70, "rgba(250, 204, 21, 0.40)");
  coreGrad.addColorStop(1.0, "rgba(234, 179, 8, 0.0)");
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(hitX, hitY, coreR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 209: 스파크 (Spark) 메인 이펙트 렌더러
 */
export function drawSparkEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
): void {
  const isPlayer = drawCtx.isPlayer ?? true;

  // drawCtx.casterPos는 battleGifRenderer에서 이미 pOffset/eOffset이 포함된 시전자 스프라이트의 정확한 몸통 중심 좌표임
  // 중복으로 pOffset을 더하지 않고, drawCtx.casterPos를 직접 사용하여 시전자 스프라이트 중앙 Z축 위에 완벽하게 일치시킴
  const casterX = drawCtx.casterPos
    ? drawCtx.casterPos.x
    : (isPlayer ? 130 + (frame.pOffset?.x ?? 0) : 380 - (frame.eOffset?.x ?? 0));
  const casterY = drawCtx.casterPos
    ? drawCtx.casterPos.y
    : (isPlayer ? 244 + (frame.pOffset?.y ?? 0) : 94 + (frame.eOffset?.y ?? 0));

  // 대상 포켓몬 피격 좌표 (targetPos + 피격자 오프셋)
  const targetOffset = isPlayer ? (frame.eOffset ?? { x: 0, y: 0 }) : (frame.pOffset ?? { x: 0, y: 0 });
  const targetBase = drawCtx.targetPos || (isPlayer ? { x: 380, y: 94 } : { x: 130, y: 244 });
  const targetX = targetBase.x + targetOffset.x;
  const targetY = targetBase.y + targetOffset.y;

  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0.5;
  const width = drawCtx.width || 560;
  const height = drawCtx.height || 380;

  // 프레임마다 완전히 고유한 랜덤 시드 (전기가 멈추거나 이전 프레임과 동일하지 않고 매 프레임 생동감 있게 튐)
  const phaseId = frame.phaseId || "";
  let frameSeed = 0;
  if (phaseId.includes("charge-1")) frameSeed = 13.7;
  else if (phaseId.includes("charge-2")) frameSeed = 31.9;
  else if (phaseId.includes("charge-3")) frameSeed = 53.1;
  else if (phaseId.includes("dash-1")) frameSeed = 79.3;
  else if (phaseId.includes("dash-2")) frameSeed = 109.7;
  else if (phaseId.includes("dash-3")) frameSeed = 129.5;
  else if (phaseId.includes("impact-1")) frameSeed = 149.1;
  else if (phaseId.includes("impact-2")) frameSeed = 173.3;
  else if (phaseId.includes("impact-3")) frameSeed = 203.9;
  else frameSeed = (prog * 47.3) + (step * 83.1);

  ctx.save();

  // =========================================================================
  // 1. 화면 노랗게 암전 (모든 단계에 걸쳐 부드럽게 유지 및 페이드, 파열 시 번쩍 깜빡임)
  // =========================================================================
  const rawDarkness = frame.sparkDarkness ?? 0.0;
  const yellowDarkness = frame.afterCameraReturn
    ? rawDarkness * Math.max(0, 1.0 - (frame.effectProgress ?? 0))
    : rawDarkness;
  const isFlickerFlash = phaseId.includes("impact-1") || phaseId.includes("impact-3");
  if (yellowDarkness > 0.005) {
    drawYellowDarkness(ctx, width, height, yellowDarkness, isFlickerFlash);
  }

  // =========================================================================
  // 1단계: [점점 서서히 커지는 전기 구체 + 연기 그림자 + 끝이 뾰족한 찌지직 방출 - 30% 축소]
  // =========================================================================
  if (step === 1) {
    // 30% 추가 축소 적용 (기존 대비 30% 더 작게)
    const rawSphereRadius = frame.sparkSphereRadius ?? (20 + prog * 34);
    const sphereRadius = rawSphereRadius * 0.56;
    const crackleCount = frame.sparkCrackleCount ?? (6 + Math.floor(prog * 4));

    // 1-1. 검정 연기 그림자 (외곽 투명이 많은 부드러운 연기 그림자)
    drawDarkSmokyShadow(ctx, casterX, casterY, sphereRadius * 1.50 + 4, 0.85);

    // 1-2. 작은 찌지직 (Z축 깊은 층: 투명도 90% / alpha: 0.10으로 은은하게 비치는 배경 스파크)
    drawRadialSharpCrackles(
      ctx,
      casterX,
      casterY,
      crackleCount + 1,
      sphereRadius * 0.25,
      sphereRadius * 1.15 + 4,
      1.1,
      frameSeed + 19.3,
      0.10
    );

    // 1-3. 큰 찌지직 (Z축 중간 층: 구체 중심에서 외곽으로 적당하고 날카롭게 뻗어나가는 주 뇌격)
    drawRadialSharpCrackles(
      ctx,
      casterX,
      casterY,
      crackleCount,
      sphereRadius * 0.35,
      sphereRadius * 1.30 + 5,
      1.5,
      frameSeed,
      0.95
    );

    // 1-4. ★ [Z축 최상단] 바깥 노란색 안쪽 흰색 (외곽 그라데이션, border 없음) 전기 구체
    drawElectricSphere(ctx, casterX, casterY, sphereRadius, 0.98);
  }

  // =========================================================================
  // 2단계: [돌진: 전기를 두른 채 상대 포켓몬에게 쾌속 쇄도 - 30% 축소]
  // =========================================================================
  else if (step === 2) {
    const dir = isPlayer ? 1 : -1;
    // 30% 추가 축소 적용
    const rawSphereRadius = frame.sparkSphereRadius ?? 54;
    const sphereRadius = rawSphereRadius * 0.56;

    // 2-1. 돌진 후방 연기 그림자 (외곽 투명이 많은 부드러운 연기 잔상)
    drawDarkSmokyShadow(ctx, casterX, casterY, sphereRadius * 1.45 + 5, 0.80);

    // 2-2. 작은 찌지직 (Z축 깊은 층: 투명도 90% / alpha: 0.10으로 은은하게 비치는 배경 스파크)
    drawRadialSharpCrackles(
      ctx,
      casterX,
      casterY,
      6,
      sphereRadius * 0.25,
      sphereRadius * 1.18 + 4,
      1.2,
      frameSeed + 23.7,
      0.10
    );

    // 2-3. 큰 찌지직 (Z축 중간 층: 구체 중심에서 적당하고 날카롭게 분출되는 주 뇌격)
    drawRadialSharpCrackles(
      ctx,
      casterX,
      casterY,
      8,
      sphereRadius * 0.40,
      sphereRadius * 1.34 + 6,
      1.6,
      frameSeed,
      1.0
    );

    // 2-4. ★ [Z축 최상단] 돌진하며 전신을 감싸는 바깥 노란색 안쪽 흰색 전기 구체
    drawElectricSphere(ctx, casterX, casterY, sphereRadius, 0.98);
  }

  // =========================================================================
  // 3단계: [적에게 스파크가 닿고 나서: 구체는 천천히 투명해지며 페이드아웃,
  //         찌지직은 빠르게 찌지직거리며 작아짐, 사방으로 퍼지는 초소형 점 파티클 비산 - 30% 축소]
  // =========================================================================
  else if (step === 3) {
    const isImpact1 = phaseId.includes("impact-1");
    const isImpact2 = phaseId.includes("impact-2");
    const isImpact3 = phaseId.includes("impact-3");

    // 격돌점 (시전자와 대상 포켓몬이 일치하는 중심 좌표)
    const hitX = targetX;
    const hitY = targetY;

    if (isImpact1) {
      // 1. 닿는 순간 "팍!" 하고 터지는 충격파 & 코어 섬광
      drawSparkBurst(ctx, hitX, hitY, prog, frameSeed, 1.0);

      // 2. ★ [적에게 닿는 순간] 크기 작고 사방으로 힘차게 퍼지는 초소형 점 파티클 폭발 비산 (30% 축소)
      drawRadialSparkParticles(ctx, hitX, hitY, 24, 10, 52, frameSeed + 83.1, 1.0, 3.8);

      // 3. ★ [구체는 천천히 투명해지며 페이드아웃 시작] (크기 32px, alpha 0.82)
      drawElectricSphere(ctx, hitX, hitY, 32, 0.82);

      // 4. ★ 찌지직 1차 방출 (반경 28px)
      drawRadialSharpCrackles(
        ctx,
        hitX,
        hitY,
        10,
        6,
        28,
        1.5,
        frameSeed * 3.7 + 11.2,
        0.95
      );
    } else if (isImpact2) {
      // 1. 배후 연기 그림자 (30px)
      drawDarkSmokyShadow(ctx, targetX, targetY, 30, 0.60);

      // 2. ★ 점 파티클이 사방으로 더 멀리 확산 (30% 축소)
      drawRadialSparkParticles(ctx, targetX, targetY, 20, 28, 78, frameSeed + 67.4, 0.80, 2.0);

      // 3. ★ [구체는 서서히 천천히 투명해짐] (크기 30px, alpha 0.40)
      drawElectricSphere(ctx, targetX, targetY, 30, 0.40);

      // 4. ★ [찌지직이 밖으로 퍼지면서 투명해짐] (반경 40px로 확산, alpha 0.52로 투명화)
      drawRadialSharpCrackles(
        ctx,
        targetX,
        targetY,
        10,
        12,
        40,
        1.2,
        frameSeed * 5.3 + 29.7,
        0.52
      );
    } else if (isImpact3) {
      // 1. 배후 연기 그림자 확산 및 소멸
      drawDarkSmokyShadow(ctx, targetX, targetY, 32, 0.25);

      // 2. ★ 점 파티클이 사방 공중으로 넓게 퍼지며 페이드아웃 (30% 축소)
      drawRadialSparkParticles(ctx, targetX, targetY, 15, 48, 102, frameSeed + 91.2, 0.35, 0.8);

      // 3. ★ [구체는 아주 희미하게 서서히 투명해지며 소멸 직전] (크기 26px, alpha 0.12)
      drawElectricSphere(ctx, targetX, targetY, 26, 0.12);

      // 4. ★ [찌지직이 더 넓게 밖으로 퍼지면서 투명하게 사라짐] (반경 52px로 넓게 비산, alpha 0.18로 소멸)
      drawRadialSharpCrackles(
        ctx,
        targetX,
        targetY,
        8,
        20,
        52,
        0.9,
        frameSeed * 7.1 + 43.1,
        0.18
      );
    }
  }

  // =========================================================================
  // 4단계: [복귀: 스파크 미세 소멸 - 30% 축소]
  // =========================================================================
  else if (step === 4) {
    if (prog < 0.6) {
      // 잔여 초미세 찌지직
      drawRadialSharpCrackles(
        ctx,
        casterX,
        casterY,
        3,
        3,
        8,
        0.8,
        frameSeed,
        0.35 * (1.0 - prog)
      );
    }
  }

  ctx.restore();
}

// ============================================================================
// 🍃 210: 연속자르기 (Fury Cutter) - 벌레 타입 물리 기술
//
// [유저 지정 연출 규격]:
// - 날카로운 연두색 칼등치기
// - 기술 베기 전 페이드암전 페이드아웃
// ============================================================================

const FURY_LIME_WHITE = "#FFFFFF";
const FURY_LIME_PALE = "#ECFCCB";   // 연한 네온 라임
const FURY_LIME_LIGHT = "#D9F99D";  // 파스텔 라임
const FURY_LIME_NEON = "#BEF264";   // 밝고 강렬한 네온 라임
const FURY_LIME_BASE = "#84CC16";   // 생생한 비비드 벌레 연두
const FURY_LIME_DEEP = "#65A30D";   // 딥 올리브/그린
const FURY_LIME_DARK = "#4D7C0F";   // 다크 포레스트 그린

/**
 * 1. 날카로운 연두색 카타나 참격호 (양 끝이 날카로운 0px 바늘침으로 수렴하는 초승달 칼날)
 */
function drawFuryCutterBlade(
  ctx: any,
  cx: number,
  cy: number,
  angle: number,
  length: number,
  thickness: number,
  progress: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const t = Math.max(0.1, Math.min(1.0, progress));
  const curL = length * t;
  const halfL = curL * 0.5;
  const halfThick = thickness * 0.5;

  // 1-1. 외곽 연두빛 대기 찢김 바람 베일 (Aerodynamic Lime Aura)
  const auraW = thickness * 1.8;
  const auraHalfThick = auraW * 0.5;
  const auraGrad = ctx.createLinearGradient(-halfL * 1.06, 0, halfL * 1.06, 0);
  auraGrad.addColorStop(0.0, "rgba(163, 230, 53, 0.0)");
  auraGrad.addColorStop(0.20, "rgba(190, 242, 100, 0.35)");
  auraGrad.addColorStop(0.70, "rgba(132, 204, 22, 0.28)");
  auraGrad.addColorStop(1.0, "rgba(101, 163, 13, 0.0)");

  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.moveTo(-halfL * 1.06, 0);
  ctx.bezierCurveTo(-halfL * 0.35, -auraHalfThick * 1.15, halfL * 0.35, -auraHalfThick * 0.70, halfL * 1.06, 0);
  ctx.bezierCurveTo(halfL * 0.35, auraHalfThick * 0.70, -halfL * 0.35, auraHalfThick * 1.05, -halfL * 1.06, 0);
  ctx.closePath();
  ctx.fill();

  // 1-2. 메인 날카로운 연두색 블레이드 (양 끝 0px 바늘침으로 완벽 수렴)
  const bladeGrad = ctx.createLinearGradient(-halfL, 0, halfL, 0);
  bladeGrad.addColorStop(0.0, FURY_LIME_PALE);
  bladeGrad.addColorStop(0.20, FURY_LIME_NEON);
  bladeGrad.addColorStop(0.50, FURY_LIME_BASE);
  bladeGrad.addColorStop(0.82, FURY_LIME_DEEP);
  bladeGrad.addColorStop(1.0, FURY_LIME_DARK);

  ctx.fillStyle = bladeGrad;
  ctx.beginPath();
  ctx.moveTo(-halfL, 0);
  // 상부 호선 (좌측 0px 바늘침 -> 우측 0px 날카로운 칼끝)
  ctx.bezierCurveTo(-halfL * 0.35, -halfThick * 1.15, halfL * 0.35, -halfThick * 0.70, halfL, 0);
  // 하부 호선 (우측 0px 날카로운 칼끝 -> 좌측 0px 바늘침)
  ctx.bezierCurveTo(halfL * 0.35, halfThick * 0.60, -halfL * 0.35, halfThick * 0.95, -halfL, 0);
  ctx.closePath();
  ctx.fill();

  // 1-3. 중심 백열 순백 코어 (Razor Core)
  const coreHalfL = halfL * 0.94;
  const coreHalfThick = halfThick * 0.42;

  ctx.save();
  ctx.shadowColor = "rgba(190, 242, 100, 0.85)";
  ctx.shadowBlur = 6;
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(-coreHalfL, 0);
  ctx.bezierCurveTo(-coreHalfL * 0.35, -coreHalfThick * 1.05, coreHalfL * 0.35, -coreHalfThick * 0.65, coreHalfL, 0);
  ctx.bezierCurveTo(coreHalfL * 0.35, coreHalfThick * 0.60, -coreHalfL * 0.35, coreHalfThick * 0.95, -coreHalfL, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * 양 끝이 0px 바늘침으로 날카롭게 모아지는 테이퍼드 초승달 충격파 호
 */
function drawTaperedCrescentArc(
  ctx: any,
  r: number,
  startAngle: number,
  endAngle: number,
  maxThickness: number,
  fillStyle: any
) {
  const steps = 24;
  const outerPts: { x: number; y: number }[] = [];
  const innerPts: { x: number; y: number }[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = startAngle + (endAngle - startAngle) * t;
    // sin 곡선에 따라 양 끝(0, 1)은 정확히 0px 바늘침, 중심(0.5)은 maxThickness
    const thick = maxThickness * Math.sin(t * Math.PI);
    const rOut = r + thick * 0.5;
    const rIn = r - thick * 0.5;

    outerPts.push({ x: Math.cos(a) * rOut, y: Math.sin(a) * rOut });
    innerPts.push({ x: Math.cos(a) * rIn, y: Math.sin(a) * rIn });
  }

  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.moveTo(outerPts[0].x, outerPts[0].y);
  for (let i = 1; i <= steps; i++) {
    ctx.lineTo(outerPts[i].x, outerPts[i].y);
  }
  for (let i = steps; i >= 0; i--) {
    ctx.lineTo(innerPts[i].x, innerPts[i].y);
  }
  ctx.closePath();
  ctx.fill();
}

/**
 * 2. '챙!!' 참격 타격 순간 십자 메탈릭 글린트 & 연두색 충격파 펄스
 */
function drawFuryCutterImpactGlint(
  ctx: any,
  cx: number,
  cy: number,
  angle: number,
  scale: number = 1.0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || scale <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const coronaR = 36 * scale;

  // 2-1. 은은한 라임-그린 코로나 헤일로 (Impact Halo)
  const coronaGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coronaR);
  coronaGrad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  coronaGrad.addColorStop(0.25, "rgba(236, 252, 203, 0.95)");
  coronaGrad.addColorStop(0.60, "rgba(190, 242, 100, 0.70)");
  coronaGrad.addColorStop(0.85, "rgba(132, 204, 22, 0.35)");
  coronaGrad.addColorStop(1.0, "rgba(101, 163, 13, 0.0)");

  ctx.fillStyle = coronaGrad;
  ctx.beginPath();
  ctx.arc(0, 0, coronaR, 0, Math.PI * 2);
  ctx.fill();

  // 2-2. 양 끝이 완벽하게 날카로운 참격 충격파 호 (Tapered Sharp Crescent Arcs)
  ctx.save();
  ctx.rotate(angle);
  const waveR = 26 * scale;

  // 외곽 연두 충격파 호 (양 끝 0px 바늘침)
  drawTaperedCrescentArc(
    ctx,
    waveR + 5 * scale,
    -Math.PI * 0.58,
    Math.PI * 0.58,
    2.6 * scale,
    "rgba(132, 204, 22, 0.65)"
  );

  // 메인 연두빛 형광 충격파 호 (양 끝 0px 바늘침)
  drawTaperedCrescentArc(
    ctx,
    waveR,
    -Math.PI * 0.68,
    Math.PI * 0.68,
    3.6 * scale,
    "rgba(217, 249, 157, 0.95)"
  );

  // 중심 순백 초승달 코어 (양 끝 0px 바늘침)
  drawTaperedCrescentArc(
    ctx,
    waveR,
    -Math.PI * 0.55,
    Math.PI * 0.55,
    1.6 * scale,
    "#FFFFFF"
  );
  ctx.restore();

  // 2-3. '챙!' 금속 십자 섬광 (Metallic Cross Glint)
  ctx.save();
  ctx.rotate(angle);

  // 칼날 축 방향 긴 침
  const needleL = 46 * scale;
  const needleW = 3.4 * scale;
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(-needleL, 0);
  ctx.lineTo(0, -needleW);
  ctx.lineTo(needleL, 0);
  ctx.lineTo(0, needleW);
  ctx.closePath();
  ctx.fill();

  // 직각 교차 침
  const crossL = 26 * scale;
  const crossW = 2.4 * scale;
  ctx.beginPath();
  ctx.moveTo(0, -crossL);
  ctx.lineTo(-crossW, 0);
  ctx.lineTo(0, crossL);
  ctx.lineTo(crossW, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  ctx.restore();
}

/**
 * 3. 비산하는 연두색 메탈릭 스파크
 */
const FURY_CUTTER_SPARKS = [
  { angle: -Math.PI * 0.60, speed: 72, r: 3.0, col: "#FFFFFF" },
  { angle: -Math.PI * 0.40, speed: 88, r: 3.4, col: "#ECFCCB" },
  { angle: -Math.PI * 0.20, speed: 64, r: 2.6, col: "#BEF264" },
  { angle: -Math.PI * 0.80, speed: 80, r: 3.2, col: "#84CC16" },
  { angle: Math.PI * 0.35,  speed: 74, r: 3.0, col: "#FFFFFF" },
  { angle: Math.PI * 0.55,  speed: 90, r: 3.5, col: "#ECFCCB" },
  { angle: Math.PI * 0.75,  speed: 68, r: 2.8, col: "#BEF264" },
  { angle: Math.PI * 0.15,  speed: 82, r: 3.1, col: "#84CC16" },
];

function drawFuryCutterSparks(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || progress <= 0) return;
  const t = Math.min(1.0, Math.max(0, progress));

  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  for (const s of FURY_CUTTER_SPARKS) {
    const dist = t * s.speed;
    const px = cx + Math.cos(s.angle) * dist;
    const py = cy + Math.sin(s.angle) * dist;

    const shrink = Math.max(0.1, 1.0 - t * 0.8);
    const curR = s.r * shrink;

    ctx.fillStyle = s.col;
    ctx.beginPath();
    ctx.arc(px, py, curR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 발도 자세 시전 포켓몬 손끝/칼자루 메탈릭 섬광 (외곽 투명 그라데이션 적용)
 */
function drawFuryCutterChargeGlint(
  ctx: any,
  cx: number,
  cy: number,
  scale: number
) {
  if (scale <= 0.05) return;
  ctx.save();
  ctx.translate(cx, cy);

  const r = 16 * scale;

  // 1. 외곽 부드러운 투명 방사형 오라 (외곽으로 갈수록 alpha: 0.0 완전 투명)
  const auraGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  auraGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.95)");
  auraGrad.addColorStop(0.25, "rgba(236, 252, 203, 0.80)");
  auraGrad.addColorStop(0.55, "rgba(163, 230, 53, 0.40)");
  auraGrad.addColorStop(0.85, "rgba(132, 204, 22, 0.15)");
  auraGrad.addColorStop(1.0, "rgba(101, 163, 13, 0.0)"); // 외곽 투명

  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // 2. 다이아몬드 섬광 (외곽 0px 및 alpha: 0.0 투명 페이드)
  const dR = 14 * scale;
  const dGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, dR);
  dGrad.addColorStop(0.0, "#FFFFFF");
  dGrad.addColorStop(0.35, "rgba(190, 242, 100, 0.85)");
  dGrad.addColorStop(0.70, "rgba(132, 204, 22, 0.40)");
  dGrad.addColorStop(1.0, "rgba(132, 204, 22, 0.0)"); // 외곽 투명

  ctx.fillStyle = dGrad;
  ctx.beginPath();
  ctx.moveTo(0, -dR);
  ctx.lineTo(dR * 0.40, -dR * 0.40);
  ctx.lineTo(dR, 0);
  ctx.lineTo(dR * 0.40, dR * 0.40);
  ctx.lineTo(0, dR);
  ctx.lineTo(-dR * 0.40, dR * 0.40);
  ctx.lineTo(-dR, 0);
  ctx.lineTo(-dR * 0.40, -dR * 0.40);
  ctx.closePath();
  ctx.fill();

  // 3. 중심 날카로운 십자 광선 (끝부분 투명 페이드아웃)
  const rayL = 18 * scale;
  const rayW = 1.8 * scale;

  // 가로 광선
  const hGrad = ctx.createLinearGradient(-rayL, 0, rayL, 0);
  hGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
  hGrad.addColorStop(0.5, "#FFFFFF");
  hGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

  ctx.fillStyle = hGrad;
  ctx.beginPath();
  ctx.moveTo(-rayL, 0);
  ctx.lineTo(0, -rayW);
  ctx.lineTo(rayL, 0);
  ctx.lineTo(0, rayW);
  ctx.closePath();
  ctx.fill();

  // 세로 광선
  const vGrad = ctx.createLinearGradient(0, -rayL, 0, rayL);
  vGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
  vGrad.addColorStop(0.5, "#FFFFFF");
  vGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

  ctx.fillStyle = vGrad;
  ctx.beginPath();
  ctx.moveTo(0, -rayL);
  ctx.lineTo(-rayW, 0);
  ctx.lineTo(0, rayL);
  ctx.lineTo(rayW, 0);
  ctx.closePath();
  ctx.fill();

  // 중심 극소 순백 하이라이트 핀포인트
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(0, 0, 2.2 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 210: 연속자르기 (Fury Cutter) 메인 이펙트 렌더러
 */
export function drawFuryCutterEffect(
  ctx: any,
  targetOrFrame: any,
  drawCtxOrStep?: any,
  progressOpt?: number
): void {
  let frame: BattleFrame | null = null;
  let drawCtx: EffectDrawContext | null = null;

  let tx = 380;
  let ty = 130;
  let step = 3;
  let p = 0.8;
  let isHit = true;
  let isPlayer = true;
  let casterPos = { x: 150, y: 280 };

  if (targetOrFrame && typeof targetOrFrame === "object" && ("moveStep" in targetOrFrame || "phaseId" in targetOrFrame || "showEffect" in targetOrFrame)) {
    frame = targetOrFrame as BattleFrame;
    drawCtx = (drawCtxOrStep as EffectDrawContext) || {};
    const tPos = drawCtx.targetPos || { x: 380, y: 130 };
    tx = tPos.x;
    ty = tPos.y;
    casterPos = drawCtx.casterPos || (drawCtx.isPlayer ? { x: 150, y: 280 } : { x: 418, y: 152 });
    step = frame.moveStep ?? 3;
    p = frame.effectProgress ?? 0.8;
    isHit = drawCtx.isHit !== false;
    isPlayer = drawCtx.isPlayer !== false;
  } else if (targetOrFrame && typeof targetOrFrame === "object" && "x" in targetOrFrame) {
    tx = targetOrFrame.x;
    ty = targetOrFrame.y;
    if (typeof drawCtxOrStep === "number") {
      step = drawCtxOrStep;
      p = 0.8;
    }
    if (typeof progressOpt === "number") {
      p = progressOpt;
    }
  }

  ctx.save();

  const slashX = tx;
  const slashY = ty - 12;
  const slashAngle = -0.42;

  // Step 1: 시전자 발도 자세 & 손끝/칼자루 메탈릭 십자 섬광 (외곽 투명 그라데이션)
  if (step === 1) {
    const glintX = isPlayer ? casterPos.x + 22 : casterPos.x - 22;
    const glintY = casterPos.y - 20;
    const glintScale = p * 1.2;
    drawFuryCutterChargeGlint(ctx, glintX, glintY, glintScale);
  }

  // Step 2: 상대 전면 쾌속 날카로운 연두색 참격호 전개
  else if (step === 2) {
    drawFuryCutterBlade(ctx, slashX, slashY, slashAngle, 195, 12.0, p, 1.0);
  }

  // Step 3: '챙!!' 참격 직격 타격 & 십자 메탈릭 섬광 & 충격파 펄스
  else if (step === 3) {
    const bladeAlpha = Math.max(0, 1.0 - p * 0.6);
    if (bladeAlpha > 0.01) {
      drawFuryCutterBlade(ctx, slashX, slashY, slashAngle, 195, 12.0, 1.0, bladeAlpha);
    }

    if (isHit) {
      const burstScale = p < 0.4 ? (0.75 + p * 1.4) : (1.3 - (p - 0.4) * 0.7);
      const burstAlpha = Math.max(0, 1.0 - p * 0.75);
      drawFuryCutterImpactGlint(ctx, slashX, slashY, slashAngle, burstScale, burstAlpha);
      drawFuryCutterSparks(ctx, slashX, slashY, p * 0.7, 1.0);
    }
  }

  // Step 4: 참격 잔향 소산 & 스파크 비산 페이드아웃
  else if (step === 4) {
    const fade = Math.max(0, 1.0 - p * 1.25);
    if (fade > 0.01) {
      drawFuryCutterBlade(ctx, slashX, slashY, slashAngle, 195, 10.0, 1.0, fade * 0.6);
    }
    if (isHit && fade > 0.01) {
      drawFuryCutterSparks(ctx, slashX, slashY, 0.7 + p * 0.3, fade);
    }
  }

  ctx.restore();
}

// ============================================================================
// 🪽 211: 강철날개 (Steel Wing) - 강철 타입 물리 기술
//
// 위력: 70 / 명중: 90 / PP: 25
// 설명: 단단한 날개를 상대에게 부딪쳐서 공격한다. 자신의 방어가 올라갈 때가 있다 (10%).
//
// [커스텀 연출 기승전결 시퀀스]:
// 1. [도약 & 강철 날개 발현]: 시전자 웅크림 후 도약 & 배후에 거대한 은백색 강철 날개 전개 (메탈릭 실버/크롬 광택 + 십자 글린트)
// 2. [초고속 급강하 쇄도]: 강철 날개를 전방으로 모아 상대 전면으로 쾌속 급강하 (은빛 슬립스트림 스트리머 & 스피드라인)
// 3. [양단 교차 베기 (Cross Slash) 강타]: 상대 전면에 좌우 거대한 강철 날개가 교차하며 '챙-캉!!' 대각 X자 강타
//    - 눈부신 은백색 메탈릭 충돌 섬광 (hitFlash: true) + 4방향 대형 메탈릭 크로스 글린트 + 원형 충격파 링
//    - 16방향 은빛/시안/플래티넘 메탈릭 스파크 폭발 비산
// 4. [강철 깃털 비산 & 잔향 소산]: 은백색 강철 깃털(Steel Feathers) 4~6개가 물리 궤적을 그리며 공중으로 유려하게 비산
//    - 참격 잔향 소산 & 피격자 넉백 후 탄성 복귀
// 5. [착지 복귀 & 경질화 방어 태세]: 시전자 원위치 착지 & 다이아몬드/방패형 은빛 경질화 방어 오라 파동 (10% 방어 랭크업 연계)
// ============================================================================

// 강철 타입 메탈릭 크롬 팔레트 (256색 최적화)
const SW_WHITE = "#FFFFFF";              // 초고휘도 반사광
const SW_PLATINUM = "#F8FAFC";           // 플래티넘 실버
const SW_CYAN_LIGHT = "#E0F2FE";         // 차가운 청백색 틴트
const SW_CYAN_MID = "#7DD3FC";           // 네온 시안 하이라이트
const SW_SILVER_LIGHT = "#CBD5E1";       // 고광택 메탈릭 실버
const SW_SILVER_MID = "#94A3B8";         // 크롬 메탈릭 베이스
const SW_GUNMETAL = "#475569";           // 딥 건메탈 섀도우
const SW_DEEP_SHADOW = "#1E293B";        // 날밑/윤곽 엣지

/**
 * 1. 단일 강철 깃털 블레이드 (Single Steel Feather Blade)
 * - 날카로운 단면 다면체(Faceted Polygonal Blade)로 제작되어 빛 반사감이 뛰어남
 */
function drawSingleSteelBlade(
  ctx: any,
  angle: number,
  length: number,
  width: number,
  alpha: number = 1.0,
  isLeft: boolean = false
) {
  if (alpha <= 0.01 || length <= 2) return;
  ctx.save();
  ctx.rotate(angle);
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const dir = isLeft ? -1 : 1;
  const halfW = width * 0.5;

  // 1-1. 바깥쪽 어두운 면 (Dark Gunmetal Bevel Facet)
  const darkGrad = ctx.createLinearGradient(0, 0, dir * width, -length * 0.5);
  darkGrad.addColorStop(0.0, SW_GUNMETAL);
  darkGrad.addColorStop(0.6, SW_SILVER_MID);
  darkGrad.addColorStop(1.0, SW_GUNMETAL);

  ctx.fillStyle = darkGrad;
  ctx.beginPath();
  ctx.moveTo(0, 0); // 날뿌리
  ctx.lineTo(dir * halfW * 0.4, -length * 0.25);
  ctx.quadraticCurveTo(dir * width * 1.05, -length * 0.65, 0, -length); // 날끝
  ctx.lineTo(0, 0); // 중심 능선으로 복귀
  ctx.closePath();
  ctx.fill();

  // 1-2. 안쪽 밝은 면 (Bright Chrome Metallic Facet)
  const brightGrad = ctx.createLinearGradient(0, 0, -dir * halfW, -length);
  brightGrad.addColorStop(0.0, SW_SILVER_LIGHT);
  brightGrad.addColorStop(0.3, SW_WHITE);
  brightGrad.addColorStop(0.7, SW_CYAN_LIGHT);
  brightGrad.addColorStop(1.0, SW_SILVER_MID);

  ctx.fillStyle = brightGrad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-dir * halfW * 0.35, -length * 0.20);
  ctx.quadraticCurveTo(-dir * halfW * 0.90, -length * 0.60, 0, -length);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();

  // 1-3. 중심 능선 (Center Specular Ridge Line)
  ctx.strokeStyle = SW_WHITE;
  ctx.lineWidth = Math.max(0.75, width * 0.09);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -length);
  ctx.stroke();

  ctx.restore();
}

/**
 * 2. 강철 날개 한 쌍 (Steel Wing Pair - Left & Right Wings)
 * - 5장의 레이어드 강철 깃털 블레이드가 양옆으로 시원하게 활짝 펼쳐지는(Fan-out) 메탈릭 크롬 날개
 */
function drawSteelWingSet(
  ctx: any,
  cx: number,
  cy: number,
  spreadProg: number,
  baseAngle: number = 0,
  scale: number = 1.0,
  alpha: number = 1.0,
  facingRight: boolean = true
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.rotate(baseAngle);
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  // 깃털 5장의 규격 [바깥쪽 전개 각도(rad), 길이, 폭]
  // 안쪽으로 몰리지 않고 바깥쪽으로 시원하게 활짝 펼쳐지는 각도 배치 (0.32 ~ 1.32 rad)
  const bladeConfigs = [
    { ang: 0.32, len: 74, w: 14 }, // 최상단 주익 (가장 길고 위쪽-바깥쪽으로 곧게 뻗음)
    { ang: 0.58, len: 66, w: 13 }, // 제2차익
    { ang: 0.82, len: 56, w: 12 }, // 제3차익
    { ang: 1.06, len: 46, w: 10 }, // 제4차익
    { ang: 1.30, len: 36, w: 9 },  // 최하단 소익 (완전히 옆-아래로 펼쳐짐)
  ];

  // 아래에서 기울어지며 펼쳐지는 동적 모션 계수:
  // spreadProg (0.0 -> 1.0):
  // 1. 아래로 기울어진 각도 (0일 때 아래쪽으로 0.65 rad 기울어짐 ➔ 1일 때 똑바로 활짝 펴짐)
  const tiltDownOffset = (1.0 - spreadProg) * 0.65;
  // 2. 부채꼴 펼침 폭 (0일 때 좁게 모여있다가 ➔ 1일 때 시원하게 활짝 전개)
  const fanSpread = 0.35 + spreadProg * 0.75;
  // 3. 깃털 블레이드 길이 신장 (0일 때 48% 길이 ➔ 1일 때 100% 완전 전개)
  const lengthExtension = 0.48 + spreadProg * 0.52;

  // 좌익 / 우익 렌더링 헬퍼
  const drawSingleWing = (isLeft: boolean) => {
    ctx.save();
    const wingSign = isLeft ? -1 : 1;
    ctx.scale(wingSign, 1);

    // 날개 기저 조인트 오프셋 (아래에서 위로 자연스럽게 상승하며 안착)
    const rootX = 14 + spreadProg * 2.5;
    const rootY = 6 - spreadProg * 14;
    ctx.translate(rootX, rootY);

    for (let i = bladeConfigs.length - 1; i >= 0; i--) {
      const cfg = bladeConfigs[i];
      // 아래로 기울어진 각도(tiltDownOffset)에서 위로 회전하며 부채꼴(fanSpread)로 펼쳐짐
      const bladeAng = cfg.ang * fanSpread + tiltDownOffset;
      const bladeLen = cfg.len * lengthExtension;
      drawSingleSteelBlade(ctx, bladeAng, bladeLen, cfg.w, 0.98, isLeft);
    }

    ctx.restore();
  };

  // facingRight 여부에 따라 Z축 배치 (뒤쪽 날개 먼저, 앞쪽 날개 나중)
  if (facingRight) {
    drawSingleWing(true);  // 좌익 (배후)
    drawSingleWing(false); // 우익 (전면)
  } else {
    drawSingleWing(false); // 우익 (배후)
    drawSingleWing(true);  // 좌익 (전면)
  }

  ctx.restore();
}

/**
 * 3. 초고속 급강하 은빛 슬립스트림 스트리머 (Supersonic Steel Dive Streamers)
 */
function drawSteelDiveStreamers(
  ctx: any,
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  progress: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const dx = tx - sx;
  const dy = ty - sy;
  const angle = Math.atan2(dy, dx);
  const perpX = -Math.sin(angle);
  const perpY = Math.cos(angle);

  const lines = [
    { offset: -24, lenRatio: 0.85, width: 2.6, col: SW_WHITE },
    { offset: -12, lenRatio: 1.00, width: 3.8, col: SW_CYAN_LIGHT },
    { offset:   0, lenRatio: 1.15, width: 4.5, col: SW_WHITE },
    { offset:  12, lenRatio: 1.00, width: 3.8, col: SW_CYAN_LIGHT },
    { offset:  24, lenRatio: 0.85, width: 2.6, col: SW_WHITE },
  ];

  for (const line of lines) {
    const startOffsetDist = 18;
    const lineLen = 85 * line.lenRatio;

    const lx1 = sx + perpX * line.offset + Math.cos(angle) * startOffsetDist;
    const ly1 = sy + perpY * line.offset + Math.sin(angle) * startOffsetDist;
    const lx2 = lx1 - Math.cos(angle) * lineLen;
    const ly2 = ly1 - Math.sin(angle) * lineLen;

    const grad = ctx.createLinearGradient(lx1, ly1, lx2, ly2);
    grad.addColorStop(0.0, line.col);
    grad.addColorStop(0.5, "rgba(224, 242, 254, 0.65)");
    grad.addColorStop(1.0, "rgba(224, 242, 254, 0.0)");

    ctx.strokeStyle = grad;
    ctx.lineWidth = line.width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(lx1, ly1);
    ctx.lineTo(lx2, ly2);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 끝으로 갈수록 선 두께가 자연스럽게 가늘어지는 테이퍼드 아크 스트로크
 * - 폴리곤/삼각형 왜곡 없이 순수한 원호(Arc) 경로를 유지하며 칼날 끝을 0.4px로 예리하게 테이퍼링
 */
function drawTaperedArcStroke(
  ctx: any,
  radius: number,
  thetaCenter: number,
  tipAngle: number,
  tailAngle: number,
  maxLineWidth: number,
  strokeStyle: any,
  steps: number = 16
) {
  ctx.save();
  ctx.strokeStyle = strokeStyle;
  ctx.lineCap = "round";

  // 1. 하단 짧은 꼬리: 중심에서 짧게 뻗어 자연스럽게 수렴 (4단계 미세 감쇠)
  const tailSteps = 4;
  for (let j = 0; j < tailSteps; j++) {
    const u1 = j / tailSteps;
    const u2 = (j + 1) / tailSteps;
    const a1 = thetaCenter + (tailAngle - thetaCenter) * u1;
    const a2 = thetaCenter + (tailAngle - thetaCenter) * u2;
    const uMid = (u1 + u2) * 0.5;
    const w = Math.max(0.6, maxLineWidth * (1.0 - uMid * 0.45));
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.arc(0, radius, radius, Math.min(a1, a2), Math.max(a1, a2));
    ctx.stroke();
  }

  // 2. 상단 긴 날개: 중심에서 칼날 끝으로 가면서 점진적으로 예리하게 0.4px 바늘 끝으로 수렴
  for (let i = 0; i < steps; i++) {
    const u1 = i / steps;
    const u2 = (i + 1) / steps;
    const a1 = thetaCenter + (tipAngle - thetaCenter) * u1;
    const a2 = thetaCenter + (tipAngle - thetaCenter) * u2;
    const uMid = (u1 + u2) * 0.5;

    let factor = 1.0;
    if (uMid < 0.35) {
      factor = 1.0 - 0.15 * (uMid / 0.35);
    } else {
      const taperU = (uMid - 0.35) / 0.65;
      factor = 0.85 * Math.pow(Math.max(0, 1.0 - taperU), 1.25);
    }

    const w = Math.max(0.4, maxLineWidth * factor);
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.arc(0, radius, radius, Math.min(a1, a2), Math.max(a1, a2));
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 4. 양단 교차 베기 (Cross Slash Arc Blade Trails)
 * - 상대 전면에 양 날개가 내리꽂히며 교차하는 은백색 메탈릭 날개 참격
 * - 긴쪽(상단 날개)은 순수 원호를 따라 자연스럽게 가늘어지며 예리하게 뾰족해지고(Tapered Arc),
 *   하단 꼬리는 짧게 절제되어 X자가 아닌 날개 형상을 구현 (삼각형/폴리곤 형태 완전 배제)
 */
function drawSteelWingCrossSlash(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const slashSpan = 180;
  const slashRadius = 140;

  // 두 참격의 각도:
  // 슬래시 1: 좌상단 -> 우하단 (0.68 rad)
  // 슬래시 2: 우상단 -> 좌하단 (-0.68 rad)
  const cuts = [
    { angle: 0.68, sweep: 1.0 },
    { angle: -0.68, sweep: -1.0 },
  ];

  const thetaCenter = -Math.PI * 0.5;

  for (const cut of cuts) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(cut.angle);

    const progClamped = Math.min(1.0, Math.max(0, progress));
    const curLen = slashSpan * Math.min(1.0, progClamped * 1.35);
    const isPos = cut.angle > 0;

    const xStart = isPos ? -curLen * 0.60 : -curLen * 0.16;
    const xEnd = isPos ? curLen * 0.16 : curLen * 0.60;

    const grad = ctx.createLinearGradient(xStart, 0, xEnd, 0);
    if (isPos) {
      grad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
      grad.addColorStop(0.25, "rgba(224, 242, 254, 0.65)");
      grad.addColorStop(0.78, SW_WHITE);
      grad.addColorStop(0.92, "rgba(125, 211, 252, 0.80)");
      grad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");
    } else {
      grad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
      grad.addColorStop(0.08, "rgba(125, 211, 252, 0.80)");
      grad.addColorStop(0.22, SW_WHITE);
      grad.addColorStop(0.75, "rgba(224, 242, 254, 0.65)");
      grad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");
    }

    // 각도 범위: 긴쪽 날개 끝(tipAngle), 하단 짧은 꼬리 끝(tailAngle)
    const glowTop = 0.46;
    const glowBot = 0.09;
    const glowTip = isPos ? thetaCenter - glowTop : thetaCenter + glowTop;
    const glowTail = isPos ? thetaCenter + glowBot : thetaCenter - glowBot;

    const bladeTop = 0.43;
    const bladeBot = 0.08;
    const bladeTip = isPos ? thetaCenter - bladeTop : thetaCenter + bladeTop;
    const bladeTail = isPos ? thetaCenter + bladeBot : thetaCenter - bladeBot;

    const coreTop = 0.38;
    const coreBot = 0.06;
    const coreTip = isPos ? thetaCenter - coreTop : thetaCenter + coreTop;
    const coreTail = isPos ? thetaCenter + coreBot : thetaCenter - coreBot;

    // 1. 외부 광륜 테이퍼드 아크 (청록 은은한 발광 호)
    drawTaperedArcStroke(
      ctx,
      slashRadius,
      thetaCenter,
      glowTip,
      glowTail,
      13.5 * (1.0 - progClamped * 0.45),
      "rgba(125, 211, 252, 0.45)",
      14
    );

    // 2. 메인 고휘도 크롬 칼날 테이퍼드 아크 (끝이 0.4px로 날카롭게 수렴)
    drawTaperedArcStroke(
      ctx,
      slashRadius,
      thetaCenter,
      bladeTip,
      bladeTail,
      6.2 * (1.0 - progClamped * 0.35),
      grad,
      16
    );

    // 3. 초고온 순백 코어선 테이퍼드 아크
    drawTaperedArcStroke(
      ctx,
      slashRadius,
      thetaCenter,
      coreTip,
      coreTail,
      2.2,
      SW_WHITE,
      14
    );

    ctx.restore();
  }

  ctx.restore();
}

/**
 * 5. 강철 임팩트 버스트 & 십자 크롬 글린트 (Steel Impact Burst & Metallic Cross Glint)
 */
function drawSteelImpactBurst(
  ctx: any,
  cx: number,
  cy: number,
  scale: number = 1.0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || scale <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  // 5-1. 충격파 링 (Shockwave Ring)
  const ringR = 48 * scale;
  const ringGrad = ctx.createRadialGradient(0, 0, ringR * 0.7, 0, 0, ringR);
  ringGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
  ringGrad.addColorStop(0.7, "rgba(224, 242, 254, 0.85)");
  ringGrad.addColorStop(1.0, "rgba(125, 211, 252, 0.0)");

  ctx.strokeStyle = ringGrad;
  ctx.lineWidth = 4.2 * Math.max(0.5, 1.2 - scale * 0.4);
  ctx.beginPath();
  ctx.arc(0, 0, ringR, 0, Math.PI * 2);
  ctx.stroke();

  // 5-2. 중심 섬광 코로나 (Center Glow Corona)
  const coronaR = 38 * scale;
  const coronaGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coronaR);
  coronaGrad.addColorStop(0.0, SW_WHITE);
  coronaGrad.addColorStop(0.25, "rgba(224, 242, 254, 0.95)");
  coronaGrad.addColorStop(0.60, "rgba(125, 211, 252, 0.55)");
  coronaGrad.addColorStop(1.0, "rgba(71, 85, 105, 0.0)");

  ctx.fillStyle = coronaGrad;
  ctx.beginPath();
  ctx.arc(0, 0, coronaR, 0, Math.PI * 2);
  ctx.fill();

  // 5-3. 대형 메탈릭 십자 글린트 (Large Metallic Cross Flare)
  const flareL = 58 * scale;
  const flareW = 3.6 * scale;

  // 수평 침
  ctx.fillStyle = SW_WHITE;
  ctx.beginPath();
  ctx.moveTo(-flareL, 0);
  ctx.lineTo(0, -flareW);
  ctx.lineTo(flareL, 0);
  ctx.lineTo(0, flareW);
  ctx.closePath();
  ctx.fill();

  // 수직 침
  ctx.beginPath();
  ctx.moveTo(0, -flareL);
  ctx.lineTo(-flareW, 0);
  ctx.lineTo(0, flareL);
  ctx.lineTo(flareW, 0);
  ctx.closePath();
  ctx.fill();

  // 대각 보조 침 (X자)
  const subL = flareL * 0.55;
  const subW = flareW * 0.65;
  ctx.save();
  ctx.rotate(Math.PI * 0.25);
  ctx.beginPath();
  ctx.moveTo(-subL, 0);
  ctx.lineTo(0, -subW);
  ctx.lineTo(subL, 0);
  ctx.lineTo(0, subW);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, -subL);
  ctx.lineTo(-subW, 0);
  ctx.lineTo(0, subL);
  ctx.lineTo(subW, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * 불규칙한 사다리꼴 메탈릭 강철 파편 (Irregular Trapezoidal Metallic Shard)
 * - 동그란 원형 대신 깨져나간 불규칙한 사다리꼴 단면의 날카로운 금속 파편을 렌더링
 */
function drawIrregularTrapezoidShard(
  ctx: any,
  x: number,
  y: number,
  size: number,
  angle: number,
  color: string,
  variantSeed: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // 불규칙한 사다리꼴의 4변 치수 (상단 좁은 윗변, 하단 넓은 밑변, 사선 왜곡)
  const h = size * (1.6 + (variantSeed % 3) * 0.35);
  const wTop = size * (0.45 + (variantSeed % 2) * 0.25);
  const wBottom = size * (1.20 + ((variantSeed + 1) % 3) * 0.30);
  const skew = size * (((variantSeed % 4) - 1.5) * 0.28);

  const p1 = { x: -wTop * 0.5 + skew, y: -h * 0.5 };
  const p2 = { x:  wTop * 0.5 + skew, y: -h * 0.5 };
  const p3 = { x:  wBottom * 0.5,      y:  h * 0.5 };
  const p4 = { x: -wBottom * 0.5,      y:  h * 0.5 };

  // 메탈릭 파편 음영 그라데이션
  const grad = ctx.createLinearGradient(p1.x, p1.y, p3.x, p3.y);
  grad.addColorStop(0.0, SW_WHITE);
  grad.addColorStop(0.35, color);
  grad.addColorStop(0.75, SW_SILVER_MID);
  grad.addColorStop(1.0, SW_GUNMETAL);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.lineTo(p4.x, p4.y);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 6. 비산하는 강철 깃털 & 불규칙한 사다리꼴 메탈릭 파편
 */
const STEEL_FEATHERS_DATA = [
  { angle: -Math.PI * 0.70, dist: 64, len: 26, w: 7, rot: -0.85, isLeft: true },
  { angle: -Math.PI * 0.35, dist: 72, len: 30, w: 8, rot: 0.95, isLeft: false },
  { angle: -Math.PI * 0.88, dist: 52, len: 22, w: 6, rot: -1.25, isLeft: true },
  { angle: -Math.PI * 0.15, dist: 68, len: 28, w: 7.5, rot: 1.15, isLeft: false },
  { angle:  Math.PI * 0.40, dist: 58, len: 24, w: 6.5, rot: 0.65, isLeft: false },
  { angle:  Math.PI * 0.75, dist: 50, len: 20, w: 5.5, rot: -0.55, isLeft: true },
];

const STEEL_SHARDS_DATA = [
  { angle: -Math.PI * 0.85, speed: 110, size: 5.2, spin:  4.2, col: SW_WHITE },
  { angle: -Math.PI * 0.65, speed: 135, size: 6.0, spin: -5.5, col: SW_CYAN_LIGHT },
  { angle: -Math.PI * 0.45, speed: 125, size: 5.5, spin:  6.1, col: SW_CYAN_MID },
  { angle: -Math.PI * 0.25, speed: 105, size: 4.8, spin: -3.8, col: SW_WHITE },
  { angle: -Math.PI * 0.10, speed: 138, size: 6.4, spin:  5.2, col: SW_PLATINUM },
  { angle:  Math.PI * 0.15, speed:  98, size: 4.5, spin: -4.5, col: SW_CYAN_LIGHT },
  { angle:  Math.PI * 0.35, speed: 120, size: 5.8, spin:  5.8, col: SW_WHITE },
  { angle:  Math.PI * 0.55, speed: 130, size: 5.6, spin: -6.4, col: SW_CYAN_MID },
  { angle:  Math.PI * 0.75, speed: 102, size: 4.6, spin:  4.0, col: SW_WHITE },
  { angle:  Math.PI * 0.95, speed: 118, size: 5.2, spin: -5.0, col: SW_PLATINUM },
  { angle: -Math.PI * 0.50, speed:  92, size: 4.2, spin:  3.5, col: SW_WHITE },
  { angle:  Math.PI * 0.00, speed:  88, size: 4.0, spin: -4.8, col: SW_CYAN_LIGHT },
  { angle: -Math.PI * 0.75, speed: 115, size: 5.0, spin:  5.0, col: SW_SILVER_LIGHT },
  { angle:  Math.PI * 0.65, speed: 112, size: 4.8, spin: -3.9, col: SW_CYAN_LIGHT },
];

function drawSteelSparksAndFeathers(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || progress <= 0) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const t = Math.min(1.0, Math.max(0, progress));

  // 6-1. 비산하는 강철 깃털들
  for (const f of STEEL_FEATHERS_DATA) {
    const curDist = f.dist * (0.35 + t * 0.75);
    const fx = cx + Math.cos(f.angle) * curDist;
    const fy = cy + Math.sin(f.angle) * curDist;

    ctx.save();
    ctx.translate(fx, fy);
    const rotAngle = f.rot + t * 1.8;
    const fAlpha = Math.max(0, 1.0 - t * 0.85);
    drawSingleSteelBlade(ctx, rotAngle, f.len, f.w, fAlpha, f.isLeft);
    ctx.restore();
  }

  // 6-2. 고속 방사형 불규칙한 사다리꼴 메탈릭 강철 파편들
  for (let idx = 0; idx < STEEL_SHARDS_DATA.length; idx++) {
    const s = STEEL_SHARDS_DATA[idx];
    const curDist = s.speed * t;
    const px = cx + Math.cos(s.angle) * curDist;
    const py = cy + Math.sin(s.angle) * curDist;

    const shrink = Math.max(0.15, 1.0 - t * 0.75);
    const curSize = s.size * shrink;
    const rot = s.angle + t * s.spin;

    drawIrregularTrapezoidShard(ctx, px, py, curSize, rot, s.col, idx);
  }

  ctx.restore();
}

/**
 * 7. 방어 경질화 쉴드 오라 (Steel Defense Hardening Aura - Hexagonal Diamond Sheen)
 */
function drawSteelDefenseShieldPulse(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const t = Math.min(1.0, Math.max(0, progress));
  const hexR = 36 + t * 18;
  const hexAlpha = Math.max(0, (1.0 - t) * 0.85);

  // 육각형 쉴드 꼭짓점
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    pts.push({ x: Math.cos(a) * hexR, y: Math.sin(a) * hexR });
  }

  // 쉴드 면 채우기 (은빛 투명 광채)
  ctx.fillStyle = `rgba(224, 242, 254, ${hexAlpha * 0.22})`;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.closePath();
  ctx.fill();

  // 쉴드 테두리선
  ctx.strokeStyle = `rgba(255, 255, 255, ${hexAlpha})`;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // 꼭짓점 메탈릭 글린트
  for (const pt of pts) {
    drawMiniRetroStar(ctx, pt.x, pt.y, 1.8 * (1.0 - t * 0.5), SW_WHITE);
  }

  ctx.restore();
}

/**
 * 211: 강철날개 (Steel Wing) 메인 이펙트 렌더러
 */
export function drawSteelWingEffect(
  ctx: any,
  targetOrFrame: any,
  drawCtxOrStep?: any,
  progressOpt?: number
): void {
  let frame: BattleFrame | null = null;
  let drawCtx: EffectDrawContext | null = null;

  let tx = 380;
  let ty = 130;
  let step = 3;
  let p = 0.8;
  let isHit = true;
  let isPlayer = true;
  let casterPos = { x: 150, y: 280 };

  if (targetOrFrame && typeof targetOrFrame === "object" && ("moveStep" in targetOrFrame || "phaseId" in targetOrFrame || "showEffect" in targetOrFrame)) {
    frame = targetOrFrame as BattleFrame;
    drawCtx = (drawCtxOrStep as EffectDrawContext) || {};
    const tPos = drawCtx.targetPos || { x: 380, y: 130 };
    tx = tPos.x;
    ty = tPos.y;
    casterPos = drawCtx.casterPos || (drawCtx.isPlayer ? { x: 150, y: 280 } : { x: 418, y: 152 });
    step = frame.moveStep ?? 3;
    p = frame.effectProgress ?? 0.8;
    isHit = drawCtx.isHit !== false;
    isPlayer = drawCtx.isPlayer !== false;
  } else if (targetOrFrame && typeof targetOrFrame === "object" && "x" in targetOrFrame) {
    tx = targetOrFrame.x;
    ty = targetOrFrame.y;
    if (typeof drawCtxOrStep === "number") {
      step = drawCtxOrStep;
      p = 0.8;
    }
    if (typeof progressOpt === "number") {
      p = progressOpt;
    }
  }

  // 동적 좌표 계산 (drawCtx.casterPos는 배틀 엔진에서 이미 pOffset/eOffset이 반영되어 전달됨)
  let cX = casterPos.x;
  let cY = casterPos.y;
  if (!drawCtx?.casterPos) {
    const baseCaster = isPlayer ? { x: 150, y: 280 } : { x: 418, y: 152 };
    const cOffset = isPlayer ? (frame?.pOffset ?? { x: 0, y: 0 }) : (frame?.eOffset ?? { x: 0, y: 0 });
    cX = baseCaster.x + cOffset.x;
    cY = baseCaster.y + cOffset.y;
  }

  const targetOffset = isPlayer ? (frame?.eOffset ?? { x: 0, y: 0 }) : (frame?.pOffset ?? { x: 0, y: 0 });
  const targetX = tx + targetOffset.x;
  const targetY = ty + targetOffset.y;

  ctx.save();

  // =========================================================================
  // Step 1: [도약 & 강철 날개 발현 (아래에서 기울어지며 펴짐 & 서서히 불투명해지는 페이드인)]
  // =========================================================================
  if (step === 1) {
    // 투명도 페이드인: 투명(0.0)에서 서서히 불투명(1.0)으로 점진 전개
    const wingAlpha = Math.min(1.0, Math.max(0.08, p * 1.05));
    drawSteelWingSet(ctx, cX, cY - 8, p, 0, 1.10, wingAlpha, isPlayer);
  }

  // =========================================================================
  // Step 2: [초고속 급강하 쇄도 (Steel Dive Rush)]
  // =========================================================================
  else if (step === 2) {
    // 전방으로 모아 뻗은 날카로운 강철 날개
    const diveAngle = isPlayer ? -0.38 : 0.38;
    drawSteelWingSet(ctx, cX, cY - 8, 1.0, diveAngle, 1.15, 0.98, isPlayer);
  }

  // =========================================================================
  // Step 3: [양단 교차 베기 (Cross Slash) 강타 & 충격파 / 스파크 작렬]
  // =========================================================================
  else if (step === 3) {
    // 3-1. 거대한 X자 양단 강철 참격호
    const slashAlpha = Math.max(0, 1.0 - p * 0.45);
    drawSteelWingCrossSlash(ctx, targetX, targetY - 12, p, slashAlpha);

    // 3-2. 직격 시 '챙-캉!!' 대형 십자 글린트 & 원형 충격파
    if (isHit) {
      const burstScale = p < 0.4 ? (0.75 + p * 1.5) : (1.35 - (p - 0.4) * 0.6);
      const burstAlpha = Math.max(0, 1.0 - p * 0.75);
      drawSteelImpactBurst(ctx, targetX, targetY - 12, burstScale, burstAlpha);

      // 3-3. 16방향 메탈릭 스파크 폭발 & 비산하는 강철 깃털
      drawSteelSparksAndFeathers(ctx, targetX, targetY - 12, p * 0.85, 1.0);
    }
  }

  // =========================================================================
  // Step 4: [강철 깃털 비산 잔향 & 경질화 방어 태세 오라]
  // =========================================================================
  else if (step === 4) {
    const fade = Math.max(0, 1.0 - p * 1.15);
    if (fade > 0.01) {
      drawSteelWingCrossSlash(ctx, targetX, targetY - 12, 1.0, fade * 0.5);
    }

    if (isHit && fade > 0.01) {
      drawSteelSparksAndFeathers(ctx, targetX, targetY - 12, 0.85 + p * 0.15, fade);
    }

    // 시전자 원위치 복귀 지점에서의 은빛 경질화 방어 오라 파동
    drawSteelDefenseShieldPulse(ctx, cX, cY - 10, p, 0.85);
  }

  // =========================================================================
  // Step 5: [원위치 복귀 완료 & 안정화]
  // =========================================================================
  else if (step === 5) {
    const finishFade = Math.max(0, 1.0 - p * 1.8);
    if (finishFade > 0.01) {
      drawSteelDefenseShieldPulse(ctx, cX, cY - 10, 1.0, finishFade * 0.5);
    }
  }

  ctx.restore();
}

// ============================================================================
// 👁️ 212: 검은눈빛 (Mean Look / くろいまなざし) - 노말 타입 변화 기술
//
// [유저 지정 연출 규격]:
// 1. 암전 보라색 (전체 전장을 뒤덮는 짙은 보라빛 대기 암전 및 비네트 + 네 코너 집중선)
// 2. 적에게 스프라이트 위에 눈이 나타남 > 3단계에 걸쳐서 작아짐
//    - 1단계: 대형 (scale: 1.45) - 슬릿에서 번뜩이며 서서히 눈이 떠짐 (이미지 1:1 고증 황금빛 눈동자)
//    - 2단계: 중형 (scale: 1.02) - 쿵! 하고 1차 수축하며 보라색 충격파 파동 & 대상 압박 전율
//    - 3단계: 소형 (scale: 0.70) - 2차 수축 & 눈동자 십자 섬광 플래시 + 도망 불가 그림자 속박 링 형성
// 3. 대상포켓몬 z축 중앙 위에서 눈이 떠짐 (이미지 참고 - Poliwag 머리 위 정중앙 안착)
// ============================================================================

// 256색 최적화 검은눈빛 팔레트 (Mean Look Palette)
const ML_PURPLE_DARK = "#150619";      // 심연의 보라-블랙 (대기 암전 베이스)
const ML_PURPLE_MID = "#2d0a2f";       // 딥 플럼 바이올렛 (비네트 중간톤)
const ML_PURPLE_GLOW = "#5b1452";      // 와인 바이올렛 (중심 안개 발광)
const ML_PURPLE_HAZE = "#86198f";      // 네온 퍼플 헤이즈
const ML_LAVENDER_LINE = "#f3e8ff";    // 집중선 하이라이트 (라벤더 화이트)
const ML_VIOLET_LINE = "#d8b4fe";      // 집중선 메인 (바이올렛)

// 황금빛 눈동자 팔레트 (Golden Eye Palette - 이미지 1:1 고증)
const ML_IRIS_LIGHT = "#fffab0";       // 홍채 최심부 레몬 하이라이트
const ML_IRIS_BRIGHT = "#ffcc00";      // 선명한 골든 옐로우
const ML_IRIS_AMBER = "#e67e00";       // 리치 앰버 골드
const ML_IRIS_DARK = "#a84c00";        // 다크 앰버 림
const ML_IRIS_RIM = "#3b1500";         // 홍채 외곽 암갈색 테두리
const ML_PUPIL_CORE = "#06030c";       // 흑요석 동공 코어
const ML_PUPIL_TINT = "#150c26";       // 인디고 섀도우 틴트
const ML_SPEC_WHITE = "#ffffff";       // 유리알 반사광 (순백)

/**
 * 1. 전장 보라빛 대기 암전 및 비네트
 */
function drawPurpleAtmosphere(
  ctx: any,
  dimAlpha: number,
  targetPos: { x: number; y: number }
) {
  if (dimAlpha <= 0.01) return;
  ctx.save();
  const alpha = Math.min(1.0, Math.max(0, dimAlpha));
  ctx.globalAlpha = alpha;

  // 1. 전체 화면 심연의 보라빛 베이스 틴트 (무한 화각)
  ctx.fillStyle = "rgba(21, 6, 25, 0.86)";
  ctx.fillRect(-6000, -6000, 14000, 14000);

  // 2. 대상 포켓몬 상공 중심의 와인-바이올렛 안개 비네트 (Vignette)
  const cx = targetPos.x;
  const cy = targetPos.y - 40;
  const vigR = 340;
  const vigGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, vigR);
  vigGrad.addColorStop(0.0, "rgba(91, 20, 82, 0.42)");
  vigGrad.addColorStop(0.45, "rgba(52, 10, 50, 0.60)");
  vigGrad.addColorStop(0.85, "rgba(21, 6, 25, 0.88)");
  vigGrad.addColorStop(1.0, "rgba(10, 2, 14, 0.96)");

  ctx.fillStyle = vigGrad;
  ctx.fillRect(-6000, -6000, 14000, 14000);

  ctx.restore();
}

/**
 * 2. 대상 포켓몬 바닥 보라빛 그림자 웅덩이 (이미지 고증)
 */
function drawPurpleGroundShadowPool(
  ctx: any,
  tx: number,
  ty: number,
  scale: number = 1.0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.translate(tx, ty + 2);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.scale(1.0, 0.28);

  const poolR = 48 * scale;
  const poolGrad = ctx.createRadialGradient(0, 0, poolR * 0.15, 0, 0, poolR);
  poolGrad.addColorStop(0.0, "rgba(35, 8, 38, 0.65)");
  poolGrad.addColorStop(0.55, "rgba(48, 10, 52, 0.45)");
  poolGrad.addColorStop(0.85, "rgba(32, 6, 36, 0.20)");
  poolGrad.addColorStop(1.0, "rgba(20, 4, 24, 0.0)");

  ctx.fillStyle = poolGrad;
  ctx.beginPath();
  ctx.arc(0, 0, poolR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 3. 네 코너 집중선 (Anime Radial Speed Lines - 이미지 고증)
 * - 시작점은 반드시 카메라 화면 바깥(dist 600~680px)에서부터 안쪽으로 뻗어 들어옴
 */
const SPEED_LINES_DEF = [
  // 좌상단 코너 스트릭들 (카메라 바깥 -> 안쪽)
  { angle: -Math.PI * 0.88, startDist: 620, endDist: 155, w: 4.2 },
  { angle: -Math.PI * 0.80, startDist: 670, endDist: 140, w: 5.8 },
  { angle: -Math.PI * 0.72, startDist: 610, endDist: 170, w: 3.6 },
  { angle: -Math.PI * 0.65, startDist: 650, endDist: 185, w: 4.5 },

  // 우상단 코너 스트릭들 (카메라 바깥 -> 안쪽)
  { angle: -Math.PI * 0.12, startDist: 620, endDist: 155, w: 4.2 },
  { angle: -Math.PI * 0.20, startDist: 670, endDist: 140, w: 6.0 },
  { angle: -Math.PI * 0.28, startDist: 610, endDist: 175, w: 3.8 },
  { angle: -Math.PI * 0.35, startDist: 650, endDist: 185, w: 4.6 },

  // 좌하단 코너 스트릭들 (카메라 바깥 -> 안쪽)
  { angle:  Math.PI * 0.86, startDist: 610, endDist: 165, w: 4.0 },
  { angle:  Math.PI * 0.78, startDist: 660, endDist: 150, w: 5.4 },
  { angle:  Math.PI * 0.70, startDist: 590, endDist: 180, w: 3.4 },

  // 우하단 코너 스트릭들 (카메라 바깥 -> 안쪽)
  { angle:  Math.PI * 0.14, startDist: 610, endDist: 165, w: 4.2 },
  { angle:  Math.PI * 0.22, startDist: 660, endDist: 150, w: 5.6 },
  { angle:  Math.PI * 0.30, startDist: 590, endDist: 180, w: 3.6 },
];

function drawAnimeSpeedLines(
  ctx: any,
  cx: number,
  cy: number,
  alpha: number = 1.0,
  seed: number = 0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  for (let i = 0; i < SPEED_LINES_DEF.length; i++) {
    const line = SPEED_LINES_DEF[i];
    const jitter = Math.sin(seed * 2.5 + i * 1.7) * 8;
    const endDist = line.endDist + jitter;
    const startDist = line.startDist + Math.cos(seed * 3.1 + i) * 12;

    // 바깥쪽 시작점 (카메라 화면 바깥) -> 안쪽 끝점 (중심을 향해 뻗어오는 끝점)
    const xOuter = cx + Math.cos(line.angle) * startDist;
    const yOuter = cy + Math.sin(line.angle) * startDist;
    const xInner = cx + Math.cos(line.angle) * endDist;
    const yInner = cy + Math.sin(line.angle) * endDist;

    const grad = ctx.createLinearGradient(xOuter, yOuter, xInner, yInner);
    grad.addColorStop(0.0, "rgba(255, 255, 255, 0.95)");
    grad.addColorStop(0.30, "rgba(243, 232, 255, 0.85)");
    grad.addColorStop(0.65, "rgba(216, 180, 254, 0.50)");
    grad.addColorStop(0.90, "rgba(147, 51, 234, 0.18)");
    grad.addColorStop(1.0, "rgba(147, 51, 234, 0.0)");

    ctx.strokeStyle = grad;
    ctx.lineWidth = line.w;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(xOuter, yOuter);
    ctx.lineTo(xInner, yInner);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 4. 검은 눈빛 본체 렌더러 (이미지 1:1 고증 아몬드 안와 + 황금빛 홍채 + 흑요석 동공 + 유리알 반사광)
 */
function drawMeanLookEye(
  ctx: any,
  cx: number,
  cy: number,
  scale: number,
  eyelidOpen: number,
  alpha: number = 1.0,
  glintFlash: boolean = false
) {
  if (alpha <= 0.01 || scale <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const clampedOpen = Math.min(1.0, Math.max(0.02, eyelidOpen));
  const baseW = 82 * scale;
  const baseH = 36 * scale;

  // 1. 눈꺼풀 기하학 곡선 정의 (직선이 아닌 살짝 아래로 굴곡이 있는 자연스러운 곡선 형태)
  // 좌/우 끝점
  const lx = -baseW * 0.76;
  const rx = baseW * 0.76;
  const cpX1 = -baseW * 0.35;
  const cpX2 = baseW * 0.35;

  // 닫혀있거나 슬릿 상태일 때의 자연스러운 아래 방향 굴곡 베이스라인 (살짝 아래로 굴곡진 곡선)
  const curveSag = 6.5 * scale;
  const targetTopY = -baseH * 0.95;
  const targetBotY = baseH * 0.75;

  // 개안 진행도(clampedOpen)에 따른 상/하 눈꺼풀 Y 위치 보간
  // 완전 슬릿일 때는 상/하 눈꺼풀이 아래로 굴곡진 선으로 일치하고,
  // 눈이 떠지면서 상안검은 위로 크게 솟고(⌒), 하안검은 완만한 아래 굴곡(◡)을 형성
  const upperMidY = curveSag * (1.0 - clampedOpen) + targetTopY * clampedOpen;
  const lowerMidY = curveSag * (1.0 - clampedOpen) + targetBotY * clampedOpen;

  const upperCpY = upperMidY * 1.333;
  const lowerCpY = lowerMidY * 1.333;

  const buildEyelidPath = (targetCtx: any) => {
    targetCtx.beginPath();
    targetCtx.moveTo(lx, 0);
    // 상안검 곡선 (Upper Eyelid)
    targetCtx.bezierCurveTo(cpX1, upperCpY, cpX2, upperCpY, rx, 0);
    // 하안검 곡선 (Lower Eyelid)
    targetCtx.bezierCurveTo(cpX2, lowerCpY, cpX1, lowerCpY, lx, 0);
    targetCtx.closePath();
  };

  // 2. 외곽 칠흑 연기/안개 아우라 (Outer Smoky Shadow Aura)
  // [유저 피드백 반영]: 검정색 타원형 연기 헤이즈 투명도 완화 (반투명 오라)
  // 눈 중앙 위치에 맞춰 부드럽게 감싸는 타원형
  ctx.save();
  const midEyeY = (upperMidY + lowerMidY) * 0.5;
  ctx.translate(0, midEyeY);
  ctx.scale(1.0, 0.42 * Math.max(0.35, clampedOpen));
  const smokeR = baseW * 1.08;
  const smokeGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, smokeR);
  smokeGrad.addColorStop(0.0, "rgba(0, 0, 0, 0.55)");
  smokeGrad.addColorStop(0.40, "rgba(0, 0, 0, 0.40)");
  smokeGrad.addColorStop(0.70, "rgba(20, 4, 25, 0.18)");
  smokeGrad.addColorStop(1.0, "rgba(20, 4, 25, 0.0)");

  ctx.fillStyle = smokeGrad;
  ctx.beginPath();
  ctx.arc(0, 0, smokeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. 검은 눈 안와 (Black Eye Socket - 자연스러운 곡선 안와)
  ctx.save();
  buildEyelidPath(ctx);

  // 눈 내부 기본 칠흑색 채우기
  ctx.fillStyle = "#000000";
  ctx.fill();

  // 슬릿 이상으로 열렸을 때만 내부 홍채/동공 렌더링
  if (clampedOpen > 0.08) {
    ctx.clip(); // 눈꺼풀 틈새 안으로만 홍채/동공이 보이도록 클리핑!

    // 3-1. 황금빛 홍채 (Golden Iris) - 원형 홍채가 개안되며 자연스럽게 드러남
    const irisR = 22 * scale;
    const irisRx = irisR * 1.06;
    const irisRy = irisR * 1.06;

    const irisX = 0;
    const irisY = (upperMidY + lowerMidY) * 0.35;

    const irisGrad = ctx.createRadialGradient(
      irisX - 3.5 * scale,
      irisY - 3.5 * scale,
      irisR * 0.08,
      irisX,
      irisY,
      irisR
    );
    irisGrad.addColorStop(0.0, ML_IRIS_LIGHT);
    irisGrad.addColorStop(0.24, ML_IRIS_BRIGHT);
    irisGrad.addColorStop(0.62, ML_IRIS_AMBER);
    irisGrad.addColorStop(0.86, ML_IRIS_DARK);
    irisGrad.addColorStop(1.0, ML_IRIS_RIM);

    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.ellipse(irisX, irisY, irisRx, irisRy, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3-2. 흑요석 동공 (Obsidian Pupil)
    // 이미지 고증: 약간 오른쪽 중심에 위치한 둥근 흑색 동공
    const pupilX = irisX + 2.2 * scale;
    const pupilY = irisY;
    const pupilR = irisR * 0.52;
    const pupilRy = pupilR * 1.0;

    const pupilGrad = ctx.createRadialGradient(
      pupilX - 1.5 * scale,
      pupilY - 1.5 * scale,
      pupilR * 0.1,
      pupilX,
      pupilY,
      pupilR
    );
    pupilGrad.addColorStop(0.0, ML_PUPIL_TINT);
    pupilGrad.addColorStop(0.65, ML_PUPIL_CORE);
    pupilGrad.addColorStop(1.0, "#000000");

    ctx.fillStyle = pupilGrad;
    ctx.beginPath();
    ctx.ellipse(pupilX, pupilY, pupilR, pupilRy, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3-3. 유리알 반사광 (Specular Glint - 이미지 고증 타원형 반사광)
    // [유저 피드백 반영]: 십자별 플래시 없이 오직 순수한 원작 타원형 하이라이트만 유지
    const glintX = pupilX - pupilR * 0.44;
    const glintY = pupilY - pupilRy * 0.42;
    const glintRx = pupilR * 0.36;
    const glintRy = pupilRy * 0.44;

    ctx.save();
    ctx.translate(glintX, glintY);
    ctx.rotate(-0.35);

    ctx.fillStyle = ML_SPEC_WHITE;
    ctx.beginPath();
    ctx.ellipse(0, 0, glintRx, glintRy, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 보조 미세 반사광 (하단 4시 방향 은은한 잔반사)
    const subGlintX = pupilX + pupilR * 0.62;
    const subGlintY = pupilY + pupilRy * 0.58;
    const subGlintR = pupilR * 0.11;

    ctx.fillStyle = "rgba(255, 255, 255, 0.60)";
    ctx.beginPath();
    ctx.arc(subGlintX, subGlintY, subGlintR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore(); // 클리핑 해제

  // 4. 눈꺼풀 외곽 딥 블랙 윤곽선 (Outer Eyelid Dark Rim)
  ctx.save();
  buildEyelidPath(ctx);
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2.4 * scale;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

/**
 * 212: 검은눈빛 (Mean Look) 배후 이펙트 렌더러 (Behind Layer)
 * - 전장 보라빛 대기 암전 및 비네트
 * - 대상 포켓몬 바닥 보라빛 그림자 웅덩이
 * - 네 코너 집중선 (시작점 카메라 바깥)
 */
export function drawMeanLookBehindEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos } = drawCtx;
  const dimAlpha = frame.dimAlpha ?? 0.0;
  if (dimAlpha <= 0.01) return;

  // 1. 전장 보라빛 암전 및 비네트
  drawPurpleAtmosphere(targetCtx, dimAlpha, targetPos);

  // 2. 대상 포켓몬 바닥 보라빛 그림자 웅덩이 (이미지 고증)
  drawPurpleGroundShadowPool(targetCtx, targetPos.x, targetPos.y + 36, 1.0, dimAlpha * 0.95);

  // 3. 네 코너 집중선 (Anime Speed Lines - 시작점이 카메라 화면 바깥!)
  const speedLinesAlpha = frame.speedLinesAlpha ?? (dimAlpha * 0.75);
  const seed = (frame.effectProgress ?? 0.5) * 10;
  const isTargetPlayer = !drawCtx.isPlayer;
  const eyeYOffset = isTargetPlayer ? 62 : 46;
  const eyeX = targetPos.x;
  const eyeY = targetPos.y - eyeYOffset;

  drawAnimeSpeedLines(targetCtx, eyeX, eyeY, speedLinesAlpha, seed);
}

/**
 * 212: 검은눈빛 (Mean Look) 전면 메인 이펙트 렌더러 (Front Layer)
 * - 대상 포켓몬 z축 중앙 상공 검은 눈빛 본체 렌더링 (3단계 수축 & 개안 애니메이션)
 * - [유저 피드백 반영]: 눈에서 퍼지던 충격파 링 및 눈동자 십자별 완전 제거
 */
export function drawMeanLookEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, isPlayer } = drawCtx;

  const isTargetPlayer = !isPlayer;
  const eyeYOffset = isTargetPlayer ? 62 : 46;
  const eyeX = targetPos.x;
  const eyeY = targetPos.y - eyeYOffset;

  const scale = frame.eyeScale ?? 1.0;
  const eyelidOpen = frame.eyelidOpen ?? 1.0;
  const alpha = frame.eyeAlpha ?? (frame.showEffect ? 1.0 : 0.0);

  // 대상 포켓몬 z축 중앙 상공 검은 눈빛 본체 렌더링 (3단계 수축)
  drawMeanLookEye(targetCtx, eyeX, eyeY, scale, eyelidOpen, alpha);
}


