// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawMiniRetroStar } from "../common/helpers.js";

// ============================================================================
// ⚡ 245: 신속 (Extreme Speed / しんそく) - 노말 타입 물리 기술
//
// 위력: 80 / 명중: 100 / PP: 5 / 우선도: +2 / 접촉: O
// 설명: 눈에 보이지 않을 정도의 엄청난 스피드로 상대에게 돌진하여 공격한다. 반드시 선제공격할 수 있다.
//
// [연출 전체 플로우]:
// 1. 배경 필터 페이드인 (상하 파란색, 중간 하늘색) & 오른쪽 -> 왼쪽 초고속 반투명 하늘색 스피드 라인
// 2. 시전 포켓몬이 가로로 얇아지면서 완벽히 얇아져서 소멸
// 3. 시전 포켓몬이 있던 위치에 흰색 연기 나타남 (연기는 흰색 중간, 외곽 완전 투명, 사이 그라데이션)
// 4. 사라진 후 적 뒤에서 나타남
// 5. 타격 이펙트와 함께 사라짐 (강렬한 타격 충격파, 십자별, 섬광 + 시전자 사라짐)
// 6. 원래 제자리로 복귀 및 착지 안착 (배경 필터 페이드아웃)
// ============================================================================

/**
 * 신속 스피드 라인 고유 속성 (결정론적 불규칙 배치)
 */
interface SpeedStreak {
  normY: number;      // 화면 높이 기준 Y 비율 (0.05 ~ 0.95)
  length: number;     // 선의 길이 (px)
  width: number;      // 선의 두께 (px)
  speed: number;      // 이동 속도 배수
  phase: number;      // 초기 위상 오프셋 (0.0 ~ 1.0)
  alpha: number;      // 기본 반투명도 (0.55 ~ 0.90)
  hasCore?: boolean;  // 중앙 고속 순백 코어 하이라이트 여부
}

// 무작위 불규칙한 28개의 고속 스트라이프 선 데이터
const SPEED_STREAKS: SpeedStreak[] = [
  { normY: 0.08, length: 220, width: 2.0, speed: 2.3, phase: 0.05, alpha: 0.70 },
  { normY: 0.14, length: 310, width: 3.5, speed: 3.0, phase: 0.42, alpha: 0.85, hasCore: true },
  { normY: 0.19, length: 160, width: 1.5, speed: 2.1, phase: 0.80, alpha: 0.60 },
  { normY: 0.25, length: 280, width: 4.0, speed: 2.8, phase: 0.18, alpha: 0.88, hasCore: true },
  { normY: 0.29, length: 190, width: 2.0, speed: 3.4, phase: 0.65, alpha: 0.65 },
  { normY: 0.34, length: 340, width: 3.0, speed: 2.6, phase: 0.32, alpha: 0.80, hasCore: true },
  { normY: 0.39, length: 140, width: 1.5, speed: 3.2, phase: 0.90, alpha: 0.55 },
  { normY: 0.43, length: 260, width: 4.5, speed: 2.9, phase: 0.12, alpha: 0.90, hasCore: true },
  { normY: 0.48, length: 320, width: 2.5, speed: 3.5, phase: 0.55, alpha: 0.75 },
  { normY: 0.52, length: 180, width: 2.0, speed: 2.2, phase: 0.28, alpha: 0.65 },
  { normY: 0.57, length: 360, width: 4.0, speed: 3.1, phase: 0.72, alpha: 0.85, hasCore: true },
  { normY: 0.62, length: 210, width: 1.8, speed: 2.4, phase: 0.02, alpha: 0.60 },
  { normY: 0.66, length: 290, width: 3.2, speed: 2.7, phase: 0.48, alpha: 0.82, hasCore: true },
  { normY: 0.71, length: 150, width: 1.5, speed: 3.6, phase: 0.85, alpha: 0.58 },
  { normY: 0.76, length: 330, width: 3.8, speed: 2.9, phase: 0.22, alpha: 0.85, hasCore: true },
  { normY: 0.81, length: 200, width: 2.0, speed: 3.3, phase: 0.60, alpha: 0.70 },
  { normY: 0.86, length: 270, width: 4.2, speed: 2.5, phase: 0.38, alpha: 0.88, hasCore: true },
  { normY: 0.91, length: 170, width: 1.8, speed: 2.8, phase: 0.95, alpha: 0.62 },
  { normY: 0.95, length: 240, width: 2.5, speed: 3.2, phase: 0.15, alpha: 0.72 },
  { normY: 0.11, length: 130, width: 1.2, speed: 3.8, phase: 0.25, alpha: 0.50 },
  { normY: 0.22, length: 180, width: 1.6, speed: 3.5, phase: 0.70, alpha: 0.55 },
  { normY: 0.37, length: 250, width: 2.2, speed: 2.7, phase: 0.08, alpha: 0.68 },
  { normY: 0.46, length: 160, width: 1.4, speed: 4.0, phase: 0.45, alpha: 0.52 },
  { normY: 0.59, length: 220, width: 2.0, speed: 3.3, phase: 0.88, alpha: 0.65 },
  { normY: 0.69, length: 190, width: 1.5, speed: 3.7, phase: 0.35, alpha: 0.58 },
  { normY: 0.84, length: 230, width: 2.2, speed: 2.6, phase: 0.78, alpha: 0.68 },
  { normY: 0.88, length: 140, width: 1.2, speed: 3.9, phase: 0.50, alpha: 0.50 },
  { normY: 0.04, length: 200, width: 2.0, speed: 3.0, phase: 0.62, alpha: 0.65 },
];

/**
 * 뷰포트 월드 바운딩 박스 계산 헬퍼
 */
function getViewportBounds(ctx: any, drawCtx: EffectDrawContext) {
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

  const margin = 80;
  const screenLeft = tl.x - margin;
  const screenTop = tl.y - margin;
  const screenRight = br.x + margin;
  const screenBottom = br.y + margin;

  return {
    screenLeft,
    screenTop,
    screenRight,
    screenBottom,
    vw: screenRight - screenLeft,
    vh: screenBottom - screenTop,
  };
}

/**
 * 연기 퍼프 단일 타원형 (중간 흰색, 외곽 완전 투명, 사이 그라데이션)
 * - 바닥 쪽에 낮게 깔리도록 flattenY(Y축 압축 비율) 적용
 */
function drawSingleSmokePuff(
  ctx: any,
  cx: number,
  cy: number,
  rx: number,
  alpha: number = 1.0,
  flattenY: number = 0.38
) {
  if (alpha <= 0.005 || rx <= 1) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1.0, flattenY);

  // 중간 흰색, 외곽 완전 투명, 사이 그라데이션
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  grad.addColorStop(0.00, `rgba(255, 255, 255, ${alpha})`);
  grad.addColorStop(0.35, `rgba(255, 255, 255, ${alpha * 0.78})`);
  grad.addColorStop(0.70, `rgba(255, 255, 255, ${alpha * 0.28})`);
  grad.addColorStop(1.00, `rgba(255, 255, 255, 0.0)`);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 시전 포켓몬 원래 위치의 바닥(발밑 지면)에만 피어오르는 흰색 연기 렌더러
 * - 상체나 화면 위로 크게 퍼지지 않고 발밑 바닥 쪽에만 퐁! 하고 낮게 피어올라 소산
 * - 연기는 흰색 중간, 외곽 완전 투명, 사이는 그라데이션
 */
function drawExtremeSpeedSmoke(
  ctx: any,
  originPos: { x: number; y: number },
  smokeProg: number,
  isPlayer: boolean,
  drawCtx: EffectDrawContext
) {
  if (smokeProg < 0 || smokeProg >= 1.0) return;

  // 바닥 지면 좌표 (발밑 접지점):
  // attackerPos는 포켓몬 몸통 중심이므로, 바닥 플랫폼 표면은 y + 34px (또는 pm/em.y)
  const groundY = (isPlayer ? drawCtx.pm?.y : drawCtx.em?.y) ?? (originPos.y + 34);
  const groundX = originPos.x;

  // 1. 크기 팽창: 바닥 쪽에만 아담하게 생기도록 최대 rx 26px 수준으로 컴팩트하게 제한 (기존 78px 대비 축소)
  const easeOut = Math.sin(smokeProg * (Math.PI / 2));
  const baseRx = 12 + easeOut * 15; // 12px -> 27px

  // 2. 투명도 감쇠: 초반 퐁! 발생 후 부드럽게 소산
  let alpha = 1.0;
  if (smokeProg > 0.15) {
    alpha = Math.max(0, 1.0 - (smokeProg - 0.15) / 0.85);
  }
  const peakAlpha = 0.95 * alpha;
  if (peakAlpha <= 0.005) return;

  ctx.save();

  // A. 바닥 중앙 메인 연기 (납작한 타원형으로 지면에 밀착)
  drawSingleSmokePuff(ctx, groundX, groundY - 2, baseRx, peakAlpha, 0.38);

  // B. 바닥 좌우로 살짝 퍼지는 서브 퍼프들 (바닥 지면 높이를 유지하며 좌우로만 가볍게 전개)
  const subPuffs = [
    { dx: -baseRx * 0.52, dy: -1, rxMul: 0.70, flatten: 0.36 },
    { dx:  baseRx * 0.52, dy: -1, rxMul: 0.68, flatten: 0.36 },
    { dx: -baseRx * 0.24, dy: -3, rxMul: 0.62, flatten: 0.40 },
    { dx:  baseRx * 0.24, dy: -3, rxMul: 0.60, flatten: 0.40 },
  ];

  for (const puff of subPuffs) {
    drawSingleSmokePuff(
      ctx,
      groundX + puff.dx,
      groundY + puff.dy,
      baseRx * puff.rxMul,
      peakAlpha * 0.80,
      puff.flatten
    );
  }

  ctx.restore();
}

/**
 * 신속 점 파티클 렌더러 (따라가때리기 동일 규격, 신속 하늘색/청백색 2톤)
 */
function drawExtremeSpeedOrb(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number,
  isSecondary: boolean
) {
  if (alpha <= 0.01 || radius <= 0.5) return;
  ctx.save();

  // 신속 고유 색상 2톤: 메인 하늘색(#38BDF8, 56, 189, 248) & 보조 청백색(#BAE6FD, 186, 230, 253)
  const [r, g, b] = isSecondary ? [186, 230, 253] : [56, 189, 248];

  // 코어 색상: 원본 색상보다 화이트가 믹스된 화사한 발광 코어 (약 45% 화이트 믹스)
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

  // 2. 중심부 코어
  ctx.fillStyle = coreColor;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.65, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 신속 코어 섬광 플래시 (따라가때리기 동일 규격)
 */
function drawExtremeSpeedHitBurst(
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
  flashGrad.addColorStop(0.65, `rgba(56, 189, 248, ${0.85 * alpha})`);
  flashGrad.addColorStop(0.88, `rgba(56, 189, 248, ${0.40 * alpha})`);
  flashGrad.addColorStop(1.00, "rgba(56, 189, 248, 0.0)");

  ctx.fillStyle = flashGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 신속 8각 날카로운 스타버스트 (따라가때리기 동일 규격)
 */
function drawExtremeSpeedSharpImpact(
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

  // 신속 하늘색 채움 & 순백 하이라이트 림
  ctx.fillStyle = `rgba(56, 189, 248, ${0.90 * alpha})`;
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
 * 신속 타격 이펙트 (따라가때리기 참조: 코어 섬광 + 8각 스타버스트 + 사방 방사형 점 파티클)
 * - X 모양 완전 제거
 * - 색상은 신속 고유의 하늘색/청백색 2톤 그대로 유지
 */
function drawExtremeSpeedImpact(
  ctx: any,
  tx: number,
  ty: number,
  hitProg: number
) {
  if (hitProg < 0 || hitProg > 1.0) return;

  ctx.save();

  // 1. 코어 섬광 플래시 (탁!)
  drawExtremeSpeedHitBurst(ctx, tx, ty, hitProg);

  // 2. 8각 날카로운 스타버스트 (팍!)
  drawExtremeSpeedSharpImpact(ctx, tx, ty, hitProg);

  // 3. 사방으로 팍 하고 퍼지는 점 파티클 (따라가때리기 동일 12개 방사형 파티클 + 트레일)
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

      // 크기는 퍼지면서 점진적으로 감소 (4.8px -> 2.2px)
      const baseRadius = 4.8 + (i % 3) * 0.8;
      const curRadius = baseRadius * Math.max(0.35, 1.0 - hitProg * 0.65);

      // 메인 하늘색(#38BDF8) & 보조 청백색(#BAE6FD) 혼합
      const isSecondary = i % 2 === 0;

      // 메인 점 파티클
      drawExtremeSpeedOrb(ctx, px, py, curRadius, orbAlpha, isSecondary);

      // 꼬리 트레일 미니 파티클 (메인보다 살짝 뒤처진 거리)
      if (curDist > 12 && hitProg < 0.85) {
        const trailDist = curDist * 0.70;
        const trailX = tx + Math.cos(angle) * trailDist;
        const trailY = ty + Math.sin(angle) * trailDist;
        const trailRadius = curRadius * 0.55;
        const trailAlpha = orbAlpha * 0.65;
        drawExtremeSpeedOrb(ctx, trailX, trailY, trailRadius, trailAlpha, !isSecondary);
      }
    }
  }

  ctx.restore();
}

/**
 * 신속 배경 레이어 렌더러 (포켓몬 배후 배경 필터 및 스피드 라인)
 */
export function drawExtremeSpeedBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect && !frame.showBehindEffect) return;

  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const bgProg = (frame as any).bgProgress ?? prog;

  const {
    screenLeft,
    screenTop,
    screenRight,
    screenBottom,
    vw,
    vh,
  } = getViewportBounds(ctx, drawCtx);

  // 1. 배경 필터 페이드인 / 페이드아웃 알파
  let filterAlpha = 1.0;
  if (step === 1 && prog < 0.35) {
    // Step 1: 부드러운 페이드인
    filterAlpha = Math.sin((prog / 0.35) * (Math.PI / 2));
  } else if (step === 6) {
    // Step 6 (제자리 복귀): 부드러운 페이드아웃
    filterAlpha = Math.max(0, 1.0 - prog);
  }
  if (filterAlpha <= 0.005) return;

  ctx.save();

  // --------------------------------------------------------------------------
  // [1] 배경 필터: 중간이 하늘색, 위와 아래가 파란색인 수직 그라데이션
  // --------------------------------------------------------------------------
  const bgGrad = ctx.createLinearGradient(0, screenTop, 0, screenBottom);
  const baseBgAlpha = 0.88 * filterAlpha;

  // 상단 파란색
  bgGrad.addColorStop(0.00, `rgba(29, 78, 216, ${baseBgAlpha})`);
  bgGrad.addColorStop(0.20, `rgba(37, 99, 235, ${baseBgAlpha * 0.95})`);
  // 중간 하늘색
  bgGrad.addColorStop(0.50, `rgba(56, 189, 248, ${baseBgAlpha * 0.90})`);
  // 하단 파란색
  bgGrad.addColorStop(0.80, `rgba(37, 99, 235, ${baseBgAlpha * 0.95})`);
  bgGrad.addColorStop(1.00, `rgba(29, 78, 216, ${baseBgAlpha})`);

  ctx.fillStyle = bgGrad;
  ctx.fillRect(screenLeft, screenTop, vw, vh);

  // --------------------------------------------------------------------------
  // [2] 반투명한 하늘색 선이 오른쪽 화면 밖에서 왼쪽 화면 밖으로 지나다님
  // --------------------------------------------------------------------------
  for (let i = 0; i < SPEED_STREAKS.length; i++) {
    const streak = SPEED_STREAKS[i];

    // 이동 진행률: 오른쪽 화면 밖 -> 왼쪽 화면 밖 (dx < 0)
    const lineT = (bgProg * streak.speed + streak.phase) % 1.0;
    const totalTravel = vw + streak.length + 80;

    const headX = (screenRight + 40) - lineT * totalTravel;
    const tailX = headX + streak.length;

    if (tailX < screenLeft || headX > screenRight) continue;

    const y = screenTop + vh * streak.normY;
    const currentAlpha = streak.alpha * filterAlpha;

    const lineGrad = ctx.createLinearGradient(headX, y, tailX, y);
    lineGrad.addColorStop(0.00, `rgba(125, 211, 252, ${currentAlpha})`);
    lineGrad.addColorStop(0.20, `rgba(56, 189, 248, ${currentAlpha * 0.85})`);
    lineGrad.addColorStop(0.55, `rgba(14, 165, 233, ${currentAlpha * 0.40})`);
    lineGrad.addColorStop(1.00, `rgba(56, 189, 248, 0.0)`);

    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = streak.width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(headX, y);
    ctx.lineTo(tailX, y);
    ctx.stroke();

    if (streak.hasCore && streak.width >= 2.8) {
      const coreLength = streak.length * 0.45;
      const coreTailX = headX + coreLength;
      const coreGrad = ctx.createLinearGradient(headX, y, coreTailX, y);
      coreGrad.addColorStop(0.00, `rgba(255, 255, 255, ${currentAlpha * 0.95})`);
      coreGrad.addColorStop(0.30, `rgba(224, 242, 254, ${currentAlpha * 0.60})`);
      coreGrad.addColorStop(1.00, `rgba(224, 242, 254, 0.0)`);

      ctx.strokeStyle = coreGrad;
      ctx.lineWidth = Math.max(1.0, streak.width * 0.4);
      ctx.beginPath();
      ctx.moveTo(headX, y);
      ctx.lineTo(coreTailX, y);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * 신속 전면 레이어 렌더러
 * - 1) 시전 포켓몬이 있던 위치에 피어오르는 흰색 연기
 * - 2) 적 중심 타격 이펙트 (피격 플래시 & 충격파)
 */
export function drawExtremeSpeedEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;

  // 1. 원래 위치 흰색 연기 (바닥 쪽에만 생성)
  const smokeProg = (frame as any).smokeProgress;
  if (smokeProg !== undefined && smokeProg >= 0) {
    const originPos = drawCtx.attackerPos;
    const isPlayer = drawCtx.isPlayer ?? true;
    drawExtremeSpeedSmoke(ctx, originPos, smokeProg, isPlayer, drawCtx);
  }

  // 2. 적 중심 타격 이펙트
  const hitProg = (frame as any).hitProgress;
  if (hitProg !== undefined && hitProg >= 0) {
    const targetPos = drawCtx.targetPos;
    drawExtremeSpeedImpact(ctx, targetPos.x, targetPos.y, hitProg);
  }
}

// ============================================================================
// 🗿 246: 원시의 힘 (Ancient Power / げんしのちから) - 바위 타입 특수 기술
//
// 위력: 60 / 명중: 100 / PP: 5 / 접촉: X
// 설명: 원시의 힘으로 공격한다. 자신의 모든 능력이 오를 때가 있다. (10% 확률 모든 랭크 +1)
//
// [연출 기승전결 플로우]:
// 1. 기(起): 시전자 고대 힘 집중 & 지면 파란색/보라색 파장 공명 링 확산
// 2. 승(承): 지면에서 다각형 돌무더기들이 공중으로 솟구쳐 끌어올려짐 (부유)
//    - 매그니튜드 다면체 바위 3면 입체 구조 계승
//    - 각 돌에 파란색~보라색 파장이 섞인 얇은 감싸는 글로우(Snug outer aura) 적용
//    - 글로우가 너무 길지 않고 바위 외곽을 껍질처럼 타이트하게 감싸는 형태
// 3. 전(轉): 공중에 부유한 돌무더기들이 대상(적)을 향해 순차적/맹렬하게 고속 발사!
//    - 날아가서 적에게 연속 격돌 폭쇄 (Hit Flash, 바위 파쇄 파편, 파란/보라 8각 충격파)
// 4. 결(結): 파쇄된 돌 조각들이 흩어져 낙하하고, 신비로운 파란/보라 에너지 입자가 공중으로 소산
// ============================================================================

const ANCIENT_POWER_PALETTE = {
  rockShadow: "#3E2723",
  rockBase: "#6D4C41",
  rockHighlight: "#BCAAA4",
  glowBlue: "#38BDF8",
  glowDeepBlue: "#2563EB",
  glowPurple: "#8B5CF6",
  glowLightPurple: "#C084FC",
  coreWhite: "#FFFFFF",
  dustLight: "rgba(215, 204, 200, 0.45)",
  dustDark: "rgba(109, 76, 65, 0.35)",
};

export interface AncientRockDef {
  size: number;
  startRelX: number;
  startRelY: number;
  hoverRelX: number;
  hoverRelY: number;
  launchDelay: number;
  flightDuration: number;
  baseRot: number;
  rotSpeed: number;
}

export const ANCIENT_ROCKS: AncientRockDef[] = [
  // 1. 선두 중형 바위 (가장 먼저 고속 발사)
  {
    size: 13,
    startRelX: 16,
    startRelY: 26,
    hoverRelX: 30,
    hoverRelY: -16,
    launchDelay: 0.00,
    flightDuration: 0.44,
    baseRot: 0.4,
    rotSpeed: 4.8,
  },
  // 2. 상단 중소형 바위 (높은 아치 궤적으로 발사)
  {
    size: 11,
    startRelX: -10,
    startRelY: 22,
    hoverRelX: -6,
    hoverRelY: -42,
    launchDelay: 0.08,
    flightDuration: 0.46,
    baseRot: -0.6,
    rotSpeed: -4.2,
  },
  // 3. 중심 메인 대형 바위 (가장 묵직하고 강렬함)
  {
    size: 16,
    startRelX: 6,
    startRelY: 30,
    hoverRelX: 18,
    hoverRelY: -28,
    launchDelay: 0.16,
    flightDuration: 0.48,
    baseRot: 0.2,
    rotSpeed: 3.6,
  },
  // 4. 하단 소형 바위 (낮은 탄도로 빠르게 발사)
  {
    size: 9,
    startRelX: 26,
    startRelY: 24,
    hoverRelX: 42,
    hoverRelY: 4,
    launchDelay: 0.24,
    flightDuration: 0.42,
    baseRot: 1.1,
    rotSpeed: 5.6,
  },
  // 5. 후방 대형 바위 (마지막에 강력한 피니시 타격)
  {
    size: 15,
    startRelX: -24,
    startRelY: 28,
    hoverRelX: -24,
    hoverRelY: -22,
    launchDelay: 0.30,
    flightDuration: 0.50,
    baseRot: -0.3,
    rotSpeed: 3.5,
  },
];

/**
 * 원시의 힘 다면체 암석 + 얇은 파란색/보라색 파장 감싸는 글로우
 * - 매그니튜드의 3면 입체 다면체 바위 구조 계승
 * - 글로우는 파란색~보라색 파장이 혼합된 선형 그라데이션
 * - "단 글로우가 너무 길면 안 돼 그냥 일종의 감싸는 느낌으로" 요구사항 준수:
 *   외곽으로 멀리 퍼지는 긴 블러가 아니라 바위 윤곽선에 2~3.5px 두께로 타이트하게 밀착된 오라 림!
 */
export function drawAncientPowerPolygonalRock(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  rot: number,
  alpha = 1.0,
  wavelengthPhase = 0
) {
  if (alpha <= 0.01 || size <= 1) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);

  // 1. 파란색과 보라색 파장이 섞인 선형 그라데이션 (시간/위상에 따라 각도 및 파장 맥동)
  const angle = wavelengthPhase;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const rDist = size * 1.50;

  const auraGrad = ctx.createLinearGradient(
    -cosA * rDist,
    -sinA * rDist,
    cosA * rDist,
    sinA * rDist
  );
  auraGrad.addColorStop(0.00, `rgba(56, 189, 248, ${0.90 * alpha})`); // 네온 스카이블루
  auraGrad.addColorStop(0.35, `rgba(37, 99, 235, ${0.85 * alpha})`);  // 로열블루
  auraGrad.addColorStop(0.70, `rgba(139, 92, 246, ${0.90 * alpha})`); // 바이올렛
  auraGrad.addColorStop(1.00, `rgba(192, 132, 252, ${0.85 * alpha})`); // 소프트퍼플

  // 바위 6각형 외곽선 Hull 경로
  const makeOuterHullPath = () => {
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.85, -size * 0.25);
    ctx.lineTo(size * 0.70, size * 0.70);
    ctx.lineTo(-size * 0.50, size);
    ctx.lineTo(-size * 0.90, size * 0.40);
    ctx.lineTo(-size * 0.85, -size * 0.25);
    ctx.closePath();
  };

  // [글로우 연출]: 유저 요청에 따라 글로우 범위를 살짝 넓게 확장
  // 1) 최외곽 은은한 확장 아우라 스트로크 (두께 6.5px ~ 8.5px)
  ctx.save();
  ctx.globalAlpha = 0.35 * alpha;
  ctx.strokeStyle = auraGrad;
  ctx.lineWidth = Math.min(8.5, Math.max(5.5, size * 0.50));
  ctx.lineJoin = "round";
  makeOuterHullPath();
  ctx.stroke();
  ctx.restore();

  // 2) 중간 메인 소프트 아우라 스트로크 (두께 4.0px ~ 5.2px)
  ctx.save();
  ctx.globalAlpha = 0.65 * alpha;
  ctx.strokeStyle = auraGrad;
  ctx.lineWidth = Math.min(5.2, Math.max(3.5, size * 0.32));
  ctx.lineJoin = "round";
  makeOuterHullPath();
  ctx.stroke();
  ctx.restore();

  // 3) 바위 표면에 밀착된 타이트 네온 림 (두께 1.8px)
  ctx.save();
  ctx.globalAlpha = 0.95 * alpha;
  ctx.strokeStyle = auraGrad;
  ctx.lineWidth = 1.8;
  ctx.lineJoin = "round";
  makeOuterHullPath();
  ctx.stroke();
  ctx.restore();

  // 4) 바위 3면 채우기 (매그니튜드 방식의 다면체 입체 구조)
  // 바위 전체 외곽을 기본 베이스로 먼저 채워 면 사이 서브픽셀 틈새 선 방지
  ctx.fillStyle = ANCIENT_POWER_PALETTE.rockBase;
  makeOuterHullPath();
  ctx.fill();

  // 상단 밝은 면 (Top Highlight)
  ctx.fillStyle = ANCIENT_POWER_PALETTE.rockHighlight;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.85, -size * 0.25);
  ctx.lineTo(0, size * 0.30);
  ctx.lineTo(-size * 0.85, -size * 0.25);
  ctx.closePath();
  ctx.fill();

  // 좌측 중간면 (Left Base)
  ctx.fillStyle = ANCIENT_POWER_PALETTE.rockBase;
  ctx.beginPath();
  ctx.moveTo(-size * 0.85, -size * 0.25);
  ctx.lineTo(0, size * 0.30);
  ctx.lineTo(-size * 0.50, size);
  ctx.lineTo(-size * 0.90, size * 0.40);
  ctx.closePath();
  ctx.fill();

  // 우측 그림자면 (Right Shadow)
  ctx.fillStyle = ANCIENT_POWER_PALETTE.rockShadow;
  ctx.beginPath();
  ctx.moveTo(0, size * 0.30);
  ctx.lineTo(size * 0.85, -size * 0.25);
  ctx.lineTo(size * 0.70, size * 0.70);
  ctx.lineTo(-size * 0.50, size);
  ctx.closePath();
  ctx.fill();

  // 5) 바위 바로 외곽을 밀착해서 감싸고 도는 초미니 에너지 스파크 (외곽 3px 근처)
  const sparkAngle = wavelengthPhase * 2.0;
  const sparkDist = size + 3.0;
  const spX = Math.cos(sparkAngle) * sparkDist;
  const spY = Math.sin(sparkAngle) * sparkDist * 0.85;
  ctx.fillStyle = Math.sin(wavelengthPhase * 3.5) > 0 ? "#38BDF8" : "#C084FC";
  ctx.globalAlpha = 0.90 * alpha;
  ctx.fillRect(spX - 1, spY - 1, 2, 2);

  ctx.restore();
}

/**
 * 원시의 힘 타격 임팩트 (8각 날카로운 스타버스트 + 파란/보라 충격파 + 바위 파쇄 파편)
 */
function drawAncientPowerHitBurst(
  ctx: any,
  tx: number,
  ty: number,
  progress: number
) {
  if (progress < 0 || progress > 1.0) return;
  const alpha = Math.max(0, 1.0 - progress);
  if (alpha <= 0.01) return;

  ctx.save();

  // 1. 코어 백색/시안 섬광 플래시
  if (progress < 0.35) {
    const flashAlpha = Math.max(0, 1.0 - progress / 0.35);
    const flashR = 14 + progress * 24;
    const flashGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, flashR);
    flashGrad.addColorStop(0.00, `rgba(255, 255, 255, ${1.0 * flashAlpha})`);
    flashGrad.addColorStop(0.30, `rgba(56, 189, 248, ${0.85 * flashAlpha})`);
    flashGrad.addColorStop(0.65, `rgba(139, 92, 246, ${0.60 * flashAlpha})`);
    flashGrad.addColorStop(1.00, "rgba(139, 92, 246, 0.0)");

    ctx.fillStyle = flashGrad;
    ctx.beginPath();
    ctx.arc(tx, ty, flashR, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. 8각 스타버스트 (유저 요청: stroke 보더 테두리 제거 및 부드러운 채움 적용)
  const outerR = 12 + progress * 26;
  const innerR = outerR * 0.35;
  const points = 8;
  const starRot = progress * 0.5;

  ctx.save();
  ctx.translate(tx, ty);
  ctx.rotate(starRot);

  const starGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, outerR);
  starGrad.addColorStop(0.00, `rgba(255, 255, 255, ${0.95 * alpha})`);
  starGrad.addColorStop(0.40, `rgba(56, 189, 248, ${0.85 * alpha})`);
  starGrad.addColorStop(0.85, `rgba(139, 92, 246, ${0.70 * alpha})`);
  starGrad.addColorStop(1.00, `rgba(139, 92, 246, 0.0)`);

  ctx.fillStyle = starGrad;

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
  // (유저 요청: stroke 보더 테두리 제거됨)
  ctx.restore();

  // (유저 요청: 타격 시 나오는 충격파 링 연출 완전 제거됨)

  // 3. 바위 파쇄 파편 (8개의 암석 조각이 사방으로 비산, 보더 제거)
  const fragmentCount = 8;
  for (let i = 0; i < fragmentCount; i++) {
    const fAngle = (i / fragmentCount) * Math.PI * 2 + (i % 2 === 0 ? 0.2 : -0.2);
    const fDist = (10 + ((i * 7) % 5) * 6) + progress * 42;
    const fx = tx + Math.cos(fAngle) * fDist;
    const fy = ty + Math.sin(fAngle) * (fDist * 0.8) + progress * progress * 16; // 중력 낙하
    const fSize = (3.5 - (i % 3) * 0.8) * (1.0 - progress * 0.4);
    const fRot = i + progress * 6;

    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(fRot);
    ctx.fillStyle = i % 2 === 0 ? ANCIENT_POWER_PALETTE.rockBase : ANCIENT_POWER_PALETTE.rockHighlight;
    ctx.fillRect(-fSize, -fSize, fSize * 2, fSize * 2);
    // (유저 요청: strokeRect 테두리 보더 제거됨)
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 원시의 힘 배경 레이어 렌더러
 * (유저 요청: 시작할 때 시전 포켓몬 바닥 아래에서 링 생기는 연출 완전 제거됨)
 */
export function drawAncientPowerBehindEffect(
  _ctx: any,
  _frame: BattleFrame,
  _drawCtx: EffectDrawContext
) {
  // 시작할 때 시전 포켓몬 바닥 링 연출 완전 제거됨 (no-op)
}

/**
 * 원시의 힘 전면 레이어 렌더러
 * - Step 2: 지면에서 돌무더기를 공중으로 끌어올림 (Rising & Levitation, 페이드인 처리)
 * - Step 3: 공중에서 상대를 향해 차례대로 발사 & 연속 타격 폭쇄
 * - Step 4: 파쇄된 바위 파편 낙하 및 고대 파장 에너지 잔향 소산
 */
export function drawAncientPowerEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;

  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const isPlayer = drawCtx.isPlayer ?? true;
  const dir = isPlayer ? 1 : -1;

  const casterPos = drawCtx.attackerPos;
  const targetPos = drawCtx.targetPos;
  const groundY = (isPlayer ? drawCtx.pm?.y : drawCtx.em?.y) ?? (casterPos.y + 32);

  // 글로벌 위상 각도 (파란색/보라색 파장 그라데이션 회전)
  const wavelengthPhase = (frame as any).wavelengthPhase ?? (prog * Math.PI * 4);

  // --------------------------------------------------------------------------
  // [Step 2: 승(承) - 돌무더기를 지면에서 공중으로 끌어올림]
  // --------------------------------------------------------------------------
  if (step === 2) {
    ctx.save();

    // 솟구침 이징 곡선 (부드럽게 붕 떠오름)
    const easeUp = 1 - Math.pow(1 - prog, 2.4);

    // [유저 요청]: 바닥에서 돌 올라올 때 페이드인 처리하여 공중에 뜰 때 완전히 불투명(1.0)이 되도록
    const fadeProg = Math.min(1.0, Math.max(0.0, prog / 0.70));
    const rockAlpha = Math.sin(fadeProg * Math.PI * 0.5);

    for (let i = 0; i < ANCIENT_ROCKS.length; i++) {
      const rock = ANCIENT_ROCKS[i];

      // 각 바위의 지면 시작 좌표
      const startX = casterPos.x + rock.startRelX * dir;
      const startY = groundY + rock.startRelY * 0.3;

      // 공중 부유 정점 좌표
      const hoverX = casterPos.x + rock.hoverRelX * dir;
      const hoverY = casterPos.y + rock.hoverRelY;

      // 현재 보간 좌표
      const curX = startX + (hoverX - startX) * easeUp;
      const curY = startY + (hoverY - startY) * easeUp;

      // 회전 각도
      const curRot = rock.baseRot + rock.rotSpeed * prog;

      // 솟구칠 때 바닥 지면 흙먼지 퍼프 (초반 prog < 0.45)
      if (prog < 0.45) {
        const dustAlpha = Math.max(0, 1.0 - prog / 0.45) * 0.45;
        const dustR = 6 + prog * 10;
        ctx.fillStyle = ANCIENT_POWER_PALETTE.dustLight;
        ctx.globalAlpha = dustAlpha;
        ctx.beginPath();
        ctx.arc(startX, startY - 2, dustR, 0, Math.PI * 2);
        ctx.fill();
      }

      // 바위 렌더링 (매그니튜드 다면체 + 얇은 파란/보라 파장 글로우 감싸기 + 페이드인 알파)
      drawAncientPowerPolygonalRock(
        ctx,
        curX,
        curY,
        rock.size,
        curRot,
        rockAlpha,
        wavelengthPhase + i * 1.2
      );
    }

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // [Step 3: 전(轉) - 공중 돌무더기 순차 발사 & 대상 연속 격돌 폭쇄]
  // --------------------------------------------------------------------------
  if (step === 3) {
    ctx.save();

    for (let i = 0; i < ANCIENT_ROCKS.length; i++) {
      const rock = ANCIENT_ROCKS[i];

      // 공중 부유 정점 좌표 (발사 시작 위치)
      const hoverX = casterPos.x + rock.hoverRelX * dir;
      const hoverY = casterPos.y + rock.hoverRelY;

      // 대상 피격 목표점 (약간의 바위별 랜덤 타격 지터)
      const hitOffsetX = (i % 2 === 0 ? 1 : -1) * ((i * 5) % 8);
      const hitOffsetY = (i % 3 === 0 ? -1 : 1) * ((i * 4) % 10);
      const tx = targetPos.x + hitOffsetX;
      const ty = targetPos.y + hitOffsetY;

      // 개별 바위 비행 진행률 t: [0.0 ~ 1.0]
      const tFlight = (prog - rock.launchDelay) / rock.flightDuration;

      if (tFlight < 0) {
        // [A. 아직 발사 전: 공중에서 부유 호버링]
        const hoverBob = Math.sin(prog * Math.PI * 4 + i) * 2;
        const curRot = rock.baseRot + rock.rotSpeed * prog;
        drawAncientPowerPolygonalRock(
          ctx,
          hoverX,
          hoverY + hoverBob,
          rock.size,
          curRot,
          1.0,
          wavelengthPhase + i * 1.2
        );
      } else if (tFlight <= 1.0) {
        // [B. 고속 비행 중: 아치형 곡선을 그리며 쇄도]
        // 가속 곡선 (easeInQuad)
        const easeFly = Math.pow(tFlight, 1.8);

        // 아치형 제어점
        const midX = (hoverX + tx) * 0.5;
        const midY = Math.min(hoverY, ty) - 24;

        // 2차 베지에 곡선 좌표
        const invT = 1.0 - easeFly;
        const bx = invT * invT * hoverX + 2 * invT * easeFly * midX + easeFly * easeFly * tx;
        const by = invT * invT * hoverY + 2 * invT * easeFly * midY + easeFly * easeFly * ty;

        const curRot = rock.baseRot + rock.rotSpeed * (1.0 + easeFly * 2.5);

        // 비행 중 바위 렌더링
        drawAncientPowerPolygonalRock(
          ctx,
          bx,
          by,
          rock.size,
          curRot,
          1.0,
          wavelengthPhase + i * 1.2
        );
      } else {
        // [C. 이미 격돌함: 타격 폭쇄 이펙트 렌더링]
        const hitProg = (tFlight - 1.0) / 0.55; // 0.0 -> 1.0 충돌 폭쇄 진행도
        if (hitProg <= 1.0) {
          drawAncientPowerHitBurst(ctx, tx, ty, hitProg);
        }
      }
    }

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // [Step 4: 결(結) - 파쇄 바위 잔해 낙하 & 파란/보라 신비로운 에너지 소산]
  // --------------------------------------------------------------------------
  if (step === 4) {
    ctx.save();
    const settleAlpha = Math.max(0, 1.0 - prog);

    if (settleAlpha > 0.01) {
      // 1. 적 주변 지면으로 낙하 분산되는 바위 파편들
      const debrisCount = 10;
      for (let i = 0; i < debrisCount; i++) {
        const dAngle = (i / debrisCount) * Math.PI * 2;
        const dDist = 18 + ((i * 11) % 7) * 4 + prog * 18;
        const dx = targetPos.x + Math.cos(dAngle) * dDist;
        const dy = targetPos.y + Math.sin(dAngle) * (dDist * 0.5) + prog * 20; // 지면으로 가라앉음
        const dSize = Math.max(1, 3.5 * (1.0 - prog * 0.7));

        ctx.fillStyle = i % 2 === 0 ? ANCIENT_POWER_PALETTE.rockBase : ANCIENT_POWER_PALETTE.rockShadow;
        ctx.globalAlpha = settleAlpha * 0.8;
        ctx.fillRect(dx - dSize * 0.5, dy - dSize * 0.5, dSize, dSize);
      }

      // 2. 공중으로 승화/소산되는 파란색과 보라색의 미세 고대 에너지 스파클
      const sparkleCount = 8;
      for (let i = 0; i < sparkleCount; i++) {
        const spAngle = (i / sparkleCount) * Math.PI * 2 + prog;
        const spDist = 14 + ((i * 9) % 5) * 6;
        const spX = targetPos.x + Math.cos(spAngle) * spDist;
        const spY = targetPos.y + Math.sin(spAngle) * (spDist * 0.6) - prog * 26; // 공중으로 떠오름
        const isBlue = i % 2 === 0;

        ctx.fillStyle = isBlue ? "#38BDF8" : "#C084FC";
        ctx.globalAlpha = settleAlpha * 0.9;
        ctx.fillRect(spX - 1, spY - 1, 2, 2);
      }
    }

    ctx.restore();
  }
}

// ============================================================================
// 🔮 247: 섀도볼 / 쉐도우볼 (Shadow Ball / シャドーボール) - 고스트 타입 특수 기술
//
// 위력: 80 / 명중: 100 / PP: 15 / 접촉: X
// 설명: 그림자 덩어리를 내던져서 공격한다. 상대의 특수방어를 떨어뜨릴 때가 있다. (20% 확률 특수방어 -1)
//
// [유저 요구사항 연출 플로우]:
// 1. 반투명한 작은 구체에서 빙글빙글 회전 시작
// 2. 사방에서 보라색 빛 무언가(에너지 줄기 및 입자)를 회전하면서 흡수
// 3. 흡수되면서 점차 커져 칠흑의 검정 색깔 구체로 완성! (외곽 보라 오라 림)
// 4. 검은색 구체가 완성된 후 목표를 향해 고속 발포!
// 5. 묵직하고 파괴적인 고품질 타격 이펙트 (암흑 충격파, 바이올렛 플래시, 사방 비산 암흑 탄환 & 잔향)
// ============================================================================

const SHADOW_BALL_PALETTE = {
  voidBlack: "#09090B",
  deepShadow: "#18181B",
  deepPurple: "#3B0764",
  shadowPurple: "#581C87",
  royalPurple: "#7E22CE",
  brightPurple: "#9333EA",
  neonViolet: "#A855F7",
  lightViolet: "#C084FC",
  paleLavender: "#E9D5FF",
  pureWhite: "#FFFFFF",
};

/**
 * 사방에서 구체 중심으로 빨려들어가는 반투명한 보라색 에너지 점 렌더러
 * - 유저 요청: "모여드는 덩어리에 하이라이트 제거하고"
 * - 흰색(255,255,255) 하이라이트 완전 제거 -> 순수 반투명 보라색 덩어리로만 채움
 * - 큼직하고(r: 4.2px ~ 6.5px) 부드러운 반투명(alpha: 0.35 ~ 0.65) 보라빛 에너지 덩어리가 중심으로 빨려들어감
 */
function drawShadowBallAbsorbingStreams(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  rot: number,
  ballRadius: number
) {
  const moteCount = 12;
  ctx.save();

  for (let i = 0; i < moteCount; i++) {
    // 사방 균일 분산 + 회전 위상
    const baseAngle = (i / moteCount) * Math.PI * 2 + rot * 0.55;
    const streamPhase = (progress * 2.2 + i * 0.15) % 1.0;

    // 외곽 52~96px 거리에서 구체 내부/표면으로 수렴
    const startDist = ballRadius + 52 + ((i * 11) % 5) * 9;
    const endDist = Math.max(3, ballRadius * 0.42);
    const curDist = startDist - streamPhase * (startDist - endDist);

    // 나선형 소용돌이 인폴딩 (중심에 가까울수록 회전 각도가 자연스럽게 감김)
    const spiralAngle = baseAngle + Math.pow(1.0 - curDist / startDist, 1.6) * 1.3;

    const sx = cx + Math.cos(spiralAngle) * curDist;
    const sy = cy + Math.sin(spiralAngle) * curDist * 0.85;

    // 투명도: 부드러운 반투명 (유저 요청: "반투명하게")
    const moteAlpha = Math.sin(streamPhase * Math.PI) * 0.65;
    if (moteAlpha <= 0.02) continue;

    // 점 크기: 큼직한 덩어리 (4.8px ~ 7.2px)
    const baseR = 4.8 + (i % 3) * 1.2;
    const curR = baseR * (0.75 + (curDist / startDist) * 0.35);

    // 색상: 순수한 보라색 톤 (유저 요청: "모여드는 덩어리에 하이라이트 제거")
    const isLight = i % 2 === 0;
    const [r, g, b] = isLight ? [168, 85, 247] : [126, 34, 206]; // neonViolet or royalPurple

    // 흰색 하이라이트 없이 순수 보라색으로만 부드럽게 채움
    const dotGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, curR);
    dotGrad.addColorStop(0.00, `rgba(${r}, ${g}, ${b}, ${moteAlpha})`);
    dotGrad.addColorStop(0.60, `rgba(${r}, ${g}, ${b}, ${moteAlpha * 0.75})`);
    dotGrad.addColorStop(1.00, `rgba(${r}, ${g}, ${b}, 0.0)`);

    ctx.fillStyle = dotGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, curR, 0, Math.PI * 2);
    ctx.fill();

    // 2) 꼬리쪽 뒤따르는 서브 반투명 미니 점 (하이라이트 없이 순수 보라색)
    const trailDist = curDist + curR * 1.7;
    if (trailDist < startDist) {
      const trailAngle = spiralAngle - 0.16;
      const tx = cx + Math.cos(trailAngle) * trailDist;
      const ty = cy + Math.sin(trailAngle) * trailDist * 0.85;
      const trailR = curR * 0.58;
      const trailAlpha = moteAlpha * 0.45;

      const subGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, trailR);
      subGrad.addColorStop(0.00, `rgba(${r}, ${g}, ${b}, ${trailAlpha})`);
      subGrad.addColorStop(1.00, `rgba(${r}, ${g}, ${b}, 0.0)`);

      ctx.fillStyle = subGrad;
      ctx.beginPath();
      ctx.arc(tx, ty, trailR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * 섀도볼 구체 렌더러
 * - [유저 요구사항]: "구체는 시작부터 검정"
 * - 생성 초기 작은 크기부터 발사 때까지 100% 완전 불투명 솔리드 블랙(#000000 / #09090B) 칠흑 구체!
 * - 외곽은 부드러운 네온 보라 발광 아우라로 감싸고, 본체는 절대 배경이 비치지 않는 순수 암흑체
 * - 보더(테두리 선) 없음
 */
function drawShadowBallOrb(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  rot: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || radius <= 1) return;

  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.translate(cx, cy);

  // 안쪽에 좁게 형성된 솔리드 블랙 코어 반지름 (구체 크기감 강화: 약 58% 크기)
  const coreR = Math.max(3.5, radius * 0.58);

  // --------------------------------------------------------------------------
  // 1. [기존 상태 완벽 유지]: 외각 두꺼운 반투명 보라 에너지 레이어
  // - 외곽으로 갈수록 자연스럽게 페이드아웃 (0.82 반경에서 0.0 완전 투명, 외곽 선 일체 없음)
  // --------------------------------------------------------------------------
  const mantleGrad = ctx.createRadialGradient(
    0,
    0,
    coreR * 0.88,
    0,
    0,
    radius
  );
  mantleGrad.addColorStop(0.00, `rgba(168, 85, 247, ${0.75 * alpha})`); // 코어 접점 네온 바이올렛
  mantleGrad.addColorStop(0.35, `rgba(147, 51, 234, ${0.48 * alpha})`); // 브라이트 퍼플
  mantleGrad.addColorStop(0.65, `rgba(126, 34, 206, ${0.18 * alpha})`); // 로열 퍼플
  mantleGrad.addColorStop(0.82, "rgba(88, 28, 135, 0.0)");              // 0.82에서 100% 완전 투명
  mantleGrad.addColorStop(1.00, "rgba(59, 7, 100, 0.0)");

  ctx.fillStyle = mantleGrad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // --------------------------------------------------------------------------
  // 2. [기존 상태 완벽 유지]: 검은 구체 본체 (100% 완전 불투명 솔리드 블랙)
  // --------------------------------------------------------------------------
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(0, 0, coreR, 0, Math.PI * 2);
  ctx.fill();

  // 암흑 코어 미세 회전 그라데이션
  ctx.save();
  ctx.rotate(rot);
  const coreGrad = ctx.createRadialGradient(
    -coreR * 0.18,
    -coreR * 0.18,
    0,
    0,
    0,
    coreR
  );
  coreGrad.addColorStop(0.00, "#050507");
  coreGrad.addColorStop(0.80, "#000000");
  coreGrad.addColorStop(0.93, "#18052B");
  coreGrad.addColorStop(1.00, "#2E0854");

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, coreR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // --------------------------------------------------------------------------
  // 3. [유저 요청]: "검은 구체 안의 링 = 검정 구체 안의 링의 바깥쪽"
  // - 링 안쪽 중심부는 칠흑의 블랙으로 완벽히 유지
  // - 링 바깥쪽부터 검은 구체 경계(ringR ~ coreR)까지 넓고 풍성한 바이올렛 글로우 그라데이션 채움
  // --------------------------------------------------------------------------
  const ringR = coreR * 0.54;

  // 1) 검정 구체 안의 링의 바깥쪽(ringR ~ coreR)을 시원하게 채우는 넓은 바이올렛 글로우 그라데이션
  const ringOuterGlow = ctx.createRadialGradient(0, 0, ringR, 0, 0, coreR);
  ringOuterGlow.addColorStop(0.00, `rgba(192, 132, 252, ${0.85 * alpha})`); // 링 접점 가장 선명한 바이올렛
  ringOuterGlow.addColorStop(0.25, `rgba(168, 85, 247, ${0.70 * alpha})`); // 네온 바이올렛
  ringOuterGlow.addColorStop(0.60, `rgba(126, 34, 206, ${0.45 * alpha})`); // 로열 퍼플
  ringOuterGlow.addColorStop(0.88, `rgba(88, 28, 135, ${0.20 * alpha})`);  // 딥 퍼플
  ringOuterGlow.addColorStop(1.00, "rgba(59, 7, 100, 0.0)");

  // 도넛형(annulus) 패스: 링 안쪽(r < ringR)은 100% 순수 블랙 보존, 바깥쪽 영역(ringR ~ coreR)만 채움
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, coreR, 0, Math.PI * 2, false);
  ctx.arc(0, 0, ringR, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fillStyle = ringOuterGlow;
  ctx.fill();
  ctx.restore();

  // 2) 동그라미(링) 선명한 바이올렛 라인
  ctx.strokeStyle = `rgba(216, 180, 254, ${0.98 * alpha})`;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, ringR, 0, Math.PI * 2);
  ctx.stroke();

  // --------------------------------------------------------------------------
  // 4. [기존 상태 완벽 유지]: 보라 에너지 영역 내부를 맴도는 초미니 고스트 스파크
  // --------------------------------------------------------------------------
  const sparkCount = 4;
  for (let i = 0; i < sparkCount; i++) {
    const spA = rot * 2.2 + (i / sparkCount) * Math.PI * 2;
    const spR = coreR + (radius * 0.70 - coreR) * 0.40;
    const spX = Math.cos(spA) * spR;
    const spY = Math.sin(spA) * spR * 0.82;

    ctx.fillStyle = i % 2 === 0 ? SHADOW_BALL_PALETTE.neonViolet : SHADOW_BALL_PALETTE.brightPurple;
    ctx.globalAlpha = 0.60 * alpha;
    ctx.beginPath();
    ctx.arc(spX, spY, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  ctx.restore();

}

/**
 * 섀도볼 고속 비행 렌더러 (완성된 100% 불투명 검은색 구체 + 회전 + 뒤로 뿜어지는 잔상 궤적)
 */
function drawShadowBallProjectile(
  ctx: any,
  bx: number,
  by: number,
  flightProg: number,
  rot: number,
  startPos: { x: number; y: number }
) {
  ctx.save();
  ctx.globalAlpha = 1.0;

  // 비행 방향 각도
  const dx = bx - startPos.x;
  const dy = by - startPos.y;
  const angle = Math.atan2(dy, dx);

  // 1. 검은 구체 뒤편으로 뿜어지는 보라/검정 잔상 트레일 (메인 구체 뒤에 위치)
  // - 유저 요청: "구체 좀 크게" -> 30px
  const trailCount = 5;
  const ballR = 30;

  for (let i = trailCount; i >= 1; i--) {
    const lagDist = i * 13;
    const lagX = bx - Math.cos(angle) * lagDist;
    const lagY = by - Math.sin(angle) * lagDist;
    const trailAlpha = Math.max(0, 0.65 - i * 0.11);
    const trailR = ballR * (1.0 - i * 0.12);

    if (trailAlpha > 0.02) {
      // 잔상 보라-암흑 구체 (보더 없음)
      const trailGrad = ctx.createRadialGradient(lagX, lagY, 0, lagX, lagY, trailR);
      trailGrad.addColorStop(0.00, `rgba(9, 9, 11, ${trailAlpha * 0.95})`);
      trailGrad.addColorStop(0.55, `rgba(88, 28, 135, ${trailAlpha * 0.65})`);
      trailGrad.addColorStop(0.85, "rgba(168, 85, 247, 0.0)");
      trailGrad.addColorStop(1.00, "rgba(168, 85, 247, 0.0)");

      ctx.fillStyle = trailGrad;
      ctx.beginPath();
      ctx.arc(lagX, lagY, trailR, 0, Math.PI * 2);
      ctx.fill();

      // 잔상 미니 파티클 (보더 없는 점)
      if (i % 2 === 1) {
        const pJitterY = ((i * 17) % 7 - 3) * 2.2;
        ctx.fillStyle = SHADOW_BALL_PALETTE.neonViolet;
        ctx.globalAlpha = trailAlpha * 0.85;
        ctx.beginPath();
        ctx.arc(lagX, lagY + pJitterY, 2.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0; // 확실한 리셋!
      }
    }
  }

  // 2. [유저 핵심 요청]: "발사되는 구체는 반투명하면 안 되지"
  //    -> 100% 완전 불투명(alpha = 1.0) 칠흑의 솔리드 블랙 구체 렌더링!
  ctx.globalAlpha = 1.0;
  drawShadowBallOrb(ctx, bx, by, ballR, rot, 1.0);

  ctx.restore();
}

/**
 * 섀도볼 묵직하고 파괴적인 타격 이펙트
 * - (유저 요청: 보더랑 링들 완전 제거!)
 * 1) 착탄 순간 중심 암흑 왜곡 플래시 (부드러운 그라데이션)
 * 2) 부드러운 타원형 암흑 팽창 펄스 (링 선 스트로크 대신 은은한 그라데이션 채움)
 * 3) 날카로운 8각 바이올렛 스타버스트 (스트로크 보더 없는 순수 채움)
 * 4) 사방으로 폭발하며 비산하는 12개 암흑 탄환 구체 (스트로크 보더 없는 순수 구체)
 * 5) 상공으로 피어오르는 어둠의 잔류 기운 및 바이올렛 스파클
 */
function drawShadowBallHitImpact(
  ctx: any,
  tx: number,
  ty: number,
  progress: number
) {
  if (progress < 0 || progress > 1.0) return;
  const alpha = Math.max(0, 1.0 - progress);
  if (alpha <= 0.01) return;

  ctx.save();

  // --------------------------------------------------------------------------
  // [1] 착탄 순간 중심 암흑 왜곡 플래시 (크기 대폭 확대: 32px ~ 90px)
  // - 유저 요청: "타격시 나오는 이펙트 더 크게"
  // - 순수 솔리드 블랙 중심, 흰색 배제
  // --------------------------------------------------------------------------
  if (progress < 0.35) {
    const flashAlpha = Math.max(0, 1.0 - progress / 0.35);
    const flashR = 32 + progress * 58;

    const flashGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, flashR);
    flashGrad.addColorStop(0.00, `rgba(0, 0, 0, ${flashAlpha * 0.98})`);       // 칠흑의 순수 블랙 중심
    flashGrad.addColorStop(0.30, `rgba(9, 9, 11, ${flashAlpha * 0.92})`);      // 보이드 블랙
    flashGrad.addColorStop(0.65, `rgba(59, 7, 100, ${flashAlpha * 0.75})`);     // 딥 바이올렛
    flashGrad.addColorStop(1.00, "rgba(88, 28, 135, 0.0)");

    ctx.fillStyle = flashGrad;
    ctx.beginPath();
    ctx.arc(tx, ty, flashR, 0, Math.PI * 2);
    ctx.fill();
  }

  // --------------------------------------------------------------------------
  // [2] 부드러운 타원형 암흑 에너지 팽창 파동 (크기 확대: 26px ~ 105px)
  // - 링 선 스트로크 없이 부드럽게 퍼져나가는 대형 암흑/보라색 필드
  // --------------------------------------------------------------------------
  const easePulse = Math.sin(progress * (Math.PI / 2));
  const rx1 = 26 + easePulse * 78;
  const ry1 = rx1 * 0.65;
  const pulseAlpha = Math.max(0, 1.0 - progress * 1.15) * 0.50;

  if (pulseAlpha > 0.01) {
    ctx.save();
    ctx.translate(tx, ty);
    ctx.scale(1.0, 0.65);

    const pulseGrad = ctx.createRadialGradient(0, 0, rx1 * 0.25, 0, 0, rx1);
    pulseGrad.addColorStop(0.00, `rgba(0, 0, 0, ${pulseAlpha * 0.92})`);
    pulseGrad.addColorStop(0.50, `rgba(59, 7, 100, ${pulseAlpha * 0.75})`);
    pulseGrad.addColorStop(0.82, `rgba(126, 34, 206, ${pulseAlpha * 0.45})`);
    pulseGrad.addColorStop(1.00, "rgba(126, 34, 206, 0.0)");

    ctx.fillStyle = pulseGrad;
    ctx.beginPath();
    ctx.arc(0, 0, rx1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // [3] 8각 대형 암흑-바이올렛 스타버스트 (크기 확대: 24px ~ 72px)
  // --------------------------------------------------------------------------
  if (progress < 0.65) {
    const starProg = progress / 0.65;
    const starAlpha = Math.max(0, 1.0 - starProg);
    const outerR = 24 + starProg * 48;
    const innerR = outerR * 0.38;
    const points = 8;
    const starRot = starProg * 0.45;

    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(starRot);

    const starGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, outerR);
    starGrad.addColorStop(0.00, `rgba(0, 0, 0, ${starAlpha * 0.98})`);         // 순수 솔리드 블랙 중심
    starGrad.addColorStop(0.35, `rgba(24, 24, 27, ${starAlpha * 0.90})`);      // 딥 섀도우
    starGrad.addColorStop(0.70, `rgba(88, 28, 135, ${starAlpha * 0.75})`);     // 다크 퍼플
    starGrad.addColorStop(1.00, "rgba(88, 28, 135, 0.0)");

    ctx.fillStyle = starGrad;
    ctx.beginPath();
    const step = Math.PI / points;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const a = i * step - Math.PI / 2;
      const sx = Math.cos(a) * r;
      const sy = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();

    // 중심 솔리드 블랙 암흑 코어 (순수 블랙)
    ctx.fillStyle = `rgba(0, 0, 0, ${starAlpha * 0.98})`;
    ctx.beginPath();
    ctx.arc(0, 0, outerR * 0.32, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // [4] 사방으로 격렬하게 폭발/비산하는 14개 대형 암흑 탄환 (비산 거리 58px ~ 128px)
  // --------------------------------------------------------------------------
  const fragmentCount = 14;
  const burstEase = 1.0 - Math.pow(1.0 - progress, 2.0);

  for (let i = 0; i < fragmentCount; i++) {
    const angle = (i / fragmentCount) * Math.PI * 2 + ((i * 13) % 7) * 0.04;
    const maxDist = 58 + ((i * 17) % 6) * 14;
    const curDist = burstEase * maxDist;

    const fx = tx + Math.cos(angle) * curDist;
    const fy = ty + Math.sin(angle) * (curDist * 0.85);

    const fRadius = Math.max(1.8, (7.0 - (i % 3) * 1.2) * (1.0 - progress * 0.60));
    const fAlpha = Math.max(0, 1.0 - progress * 0.95);

    if (fAlpha > 0.02) {
      // 꼬리쪽 부드러운 서브 점
      if (curDist > 14) {
        const trailDist = curDist * 0.72;
        const trailX = tx + Math.cos(angle) * trailDist;
        const trailY = ty + Math.sin(angle) * (trailDist * 0.85);

        ctx.fillStyle = `rgba(126, 34, 206, ${fAlpha * 0.55})`;
        ctx.beginPath();
        ctx.arc(trailX, trailY, fRadius * 0.65, 0, Math.PI * 2);
        ctx.fill();
      }

      // 암흑 탄환 구체 채우기 (흰색 없음, 순수 블랙 & 다크 퍼플)
      const ballGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, fRadius);
      if (i % 2 === 0) {
        ballGrad.addColorStop(0.00, `rgba(0, 0, 0, ${fAlpha * 0.98})`);
        ballGrad.addColorStop(0.65, `rgba(59, 7, 100, ${fAlpha * 0.92})`);
        ballGrad.addColorStop(1.00, "rgba(126, 34, 206, 0.0)");
      } else {
        ballGrad.addColorStop(0.00, `rgba(9, 9, 11, ${fAlpha * 0.98})`);
        ballGrad.addColorStop(0.55, `rgba(88, 28, 135, ${fAlpha * 0.88})`);
        ballGrad.addColorStop(1.00, "rgba(59, 7, 100, 0.0)");
      }

      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(fx, fy, fRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --------------------------------------------------------------------------
  // [5] 상공으로 피어오르는 어둠의 잔류 기운 및 바이올렛 스파클 (확대)
  // --------------------------------------------------------------------------
  if (progress > 0.25) {
    const hazeProg = (progress - 0.25) / 0.75;
    const hazeAlpha = Math.max(0, 1.0 - hazeProg) * 0.85;
    const moteCount = 10;

    for (let i = 0; i < moteCount; i++) {
      const mA = (i / moteCount) * Math.PI * 2 + hazeProg * 1.5;
      const mDist = 20 + ((i * 9) % 5) * 10;
      const mx = tx + Math.cos(mA) * mDist;
      const my = ty + Math.sin(mA) * (mDist * 0.6) - hazeProg * 36;
      const mSize = Math.max(1.5, 3.8 * (1.0 - hazeProg * 0.5));

      ctx.fillStyle = i % 2 === 0 ? SHADOW_BALL_PALETTE.neonViolet : SHADOW_BALL_PALETTE.royalPurple;
      ctx.globalAlpha = hazeAlpha;
      ctx.beginPath();
      ctx.arc(mx, my, mSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
  }


  ctx.restore();
}

/**
 * 섀도볼 배경 레이어 렌더러
 */
export function drawShadowBallBehindEffect(
  _ctx: any,
  _frame: BattleFrame,
  _drawCtx: EffectDrawContext
) {
  // 배경 전용 연출 필요 시 확장 (현재는 전면 집중 연출)
}

/**
 * 섀도볼 전면 레이어 메인 렌더러
 * - Step 1: 반투명 작은 구체 생성 및 회전 & 사방에서 보라색 빛 에너지 흡수 개시
 * - Step 2: 회전 가속 및 에너지 흡수 지속 -> 칠흑의 검은색 구체 완성!
 * - Step 3: 완성된 검은색 구체 고속 발포 (타겟을 향해 사출 & 비행)
 * - Step 4: 묵직하고 파괴적인 고스트 특수 타격 이펙트 작렬!
 * - Step 5: 잔여 어둠의 기운 소산 및 자세 안정화
 */
export function drawShadowBallEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;

  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const rotPhase = (frame as any).rotPhase ?? (prog * Math.PI * 6);

  const casterPos = drawCtx.attackerPos;
  const targetPos = drawCtx.targetPos;
  const isPlayer = drawCtx.isPlayer ?? true;
  const dir = isPlayer ? 1 : -1;

  // 구체 형성 및 발사 위치: 시전자 포켓몬 앞쪽 (가슴/양손 높이)
  const spawnX = casterPos.x + 24 * dir;
  const spawnY = casterPos.y - 4;

  // --------------------------------------------------------------------------
  // [Step 1: 검은색 작은 구체에서 빙글빙글 돌면서 사방에서 보라색 빛을 흡수]
  // - [유저 요구사항]: "구체 좀 크게"
  // --------------------------------------------------------------------------
  if (step === 1) {
    ctx.save();
    // 작은 검은 구체 크기 (13px -> 20px)
    const ballR = 13 + prog * 7;

    // 1. 사방에서 구체 중심으로 빨려들어가는 반투명 보라색 에너지 덩어리
    drawShadowBallAbsorbingStreams(ctx, spawnX, spawnY, prog, rotPhase, ballR);

    // 2. 빙글빙글 회전하는 100% 완전 불투명 검은색 구체 (시작부터 솔리드 블랙!)
    drawShadowBallOrb(ctx, spawnX, spawnY, ballR, rotPhase, 1.0);

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // [Step 2: 회전하면서 흡수하고 커져서 거대한 칠흑의 검정 색깔 구체로 완성!]
  // --------------------------------------------------------------------------
  if (step === 2) {
    ctx.save();
    // 구체 크기 팽창 (20px -> 30px)
    const easeGrow = Math.sin(prog * (Math.PI / 2));
    const ballR = 20 + easeGrow * 10;

    // 1. 더 맹렬하게 사방에서 빨려들어오는 보라색 에너지 덩어리
    drawShadowBallAbsorbingStreams(ctx, spawnX, spawnY, prog, rotPhase * 1.4, ballR);

    // 2. 커지면서 완성되는 100% 완전 불투명 칠흑의 검은색 메인 구체
    drawShadowBallOrb(ctx, spawnX, spawnY, ballR, rotPhase, 1.0);

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // [Step 3: 검은색 구체 완성 후 상대에게 고속 발포!]
  // --------------------------------------------------------------------------
  if (step === 3) {
    ctx.save();
    // 발포 고속 비행: spawnX, spawnY -> targetPos.x, targetPos.y
    // easeInQuad/easeOut 약간 섞인 역동적 탄도
    const easeFly = Math.pow(prog, 1.4);
    const curX = spawnX + (targetPos.x - spawnX) * easeFly;
    // 미세한 상하 포물선
    const arcHeight = -Math.sin(prog * Math.PI) * 14;
    const curY = spawnY + (targetPos.y - spawnY) * easeFly + arcHeight;

    // 날아가는 검은색 구체 및 잔상 트레일
    drawShadowBallProjectile(ctx, curX, curY, prog, rotPhase * 2.5, { x: spawnX, y: spawnY });

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // [Step 4: 묵직하고 파괴적인 고품질 타격 이펙트 작렬!]
  // --------------------------------------------------------------------------
  if (step === 4) {
    ctx.save();
    const hitProg = (frame as any).hitProgress ?? prog;
    drawShadowBallHitImpact(ctx, targetPos.x, targetPos.y, hitProg);
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // [Step 5: 잔여 어둠의 기운 소산 및 피격자 안정화]
  // --------------------------------------------------------------------------
  if (step === 5) {
    ctx.save();
    const settleAlpha = Math.max(0, 1.0 - prog);
    if (settleAlpha > 0.01) {
      // 적 주변에서 흩어지는 미세 보라색 스파크 잔향
      const sparkCount = 6;
      for (let i = 0; i < sparkCount; i++) {
        const spA = (i / sparkCount) * Math.PI * 2 + prog * 2;
        const spDist = 16 + ((i * 7) % 5) * 5 + prog * 16;
        const sx = targetPos.x + Math.cos(spA) * spDist;
        const sy = targetPos.y + Math.sin(spA) * (spDist * 0.7) - prog * 18;
        ctx.fillStyle = i % 2 === 0 ? SHADOW_BALL_PALETTE.neonViolet : SHADOW_BALL_PALETTE.lightViolet;
        ctx.globalAlpha = settleAlpha * 0.85;
        ctx.fillRect(sx - 1, sy - 1, 2, 2);
      }
    }
    ctx.restore();
  }
}

// ============================================================================
// ⚡ 248: 미래예지 (Future Sight / みらいよち) - 에스퍼 타입 특수 기술
//
// 위력: 120 / 명중: 100 / PP: 10 / 비접촉
// 설명: 기술을 사용한 2턴 뒤에 상대에게 염동력의 덩어리를 보내어 공격한다.
//
// [연출 전체 플로우]:
// 1. 시전 시: 사용 포켓몬 포커싱, 흰색 필터 페이드인, 살짝 흔들거리고 끝
// 2. 대미지 시: 대상 포켓몬 포커싱 전환, 흰색 필터 살짝 적용, 여러 번 찌그러뜨림
// ============================================================================

export function drawFutureSightBehindEffect(
  _ctx: any,
  _frame: BattleFrame,
  _drawCtx: EffectDrawContext
) {
  // 배경 이펙트 필요 시 확장
}

export function drawFutureSightEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;

  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const targetPos = drawCtx.targetPos;

  // 대미지 타격 스텝(Step 3): 대상 주변에 시공간/에스퍼 왜곡 스파크 살짝 연출
  if (step === 3) {
    ctx.save();
    const hitFlash = frame.hitFlash ?? false;
    if (hitFlash) {
      // 타격 피크 시 흰색/하늘색 십자 스파크
      ctx.fillStyle = "#FFFFFF";
      drawMiniRetroStar(ctx, targetPos.x - 14, targetPos.y - 12, 1.2);
      drawMiniRetroStar(ctx, targetPos.x + 16, targetPos.y + 10, 1.0);
      drawMiniRetroStar(ctx, targetPos.x - 10, targetPos.y + 14, 0.9);
      drawMiniRetroStar(ctx, targetPos.x + 12, targetPos.y - 16, 1.1);
    }
    ctx.restore();
  }
}


