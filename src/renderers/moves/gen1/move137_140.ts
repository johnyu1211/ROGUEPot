// ============================================================================
// 🎮 ROGUEPot Move Animation Renderer: No.137 ~ No.140
// 137: 뱀눈초리 (Glare)
// 138: 꿈먹기 (Dream Eater)
// 139: 독가스 (Poison Gas)
// 140: 구슬던지기 (Barrage)
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawSmogBehindEffect, drawSmogEffect } from "./move121_124.js";
import { drawPoisonSoapBubble } from "./move037_040.js";

// ============================================================================
// 📍 공통 헬퍼: 암전 오버레이
// ============================================================================
function drawDimOverlay(ctx: any, alpha: number, color: string = "rgba(10, 8, 20, 1.0)") {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.fillStyle = color;
  ctx.fillRect(-6000, -6000, 14000, 14000);
  ctx.restore();
}

// ============================================================================
// 🐍 137: 뱀눈초리 (Glare)
// ============================================================================
/**
 * 뱀눈초리 5세대 공식 고증 붉은 뱀 눈동자 (Snake Slit Eyes)
 * - [첨부 이미지 100% 고증]: 붉은색 아몬드 눈 윤곽 + 중앙 올리브/황록색 세로 슬릿 동공
 */
export function drawSnakeEye(
  ctx: any,
  ex: number,
  ey: number,
  width: number,
  height: number,
  openProg: number, // 0.0 ~ 1.0 (눈꺼풀 열림)
  alpha: number = 1.0,
  isLeft: boolean = true
) {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.translate(ex, ey);
  if (!isLeft) {
    ctx.scale(-1, 1);
  }
  // 매서운 맹수/뱀눈 각도 강제 틸트 (외측 치켜올라가고 내측 떨어짐: 약 15도)
  ctx.rotate(0.26);
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const halfW = width * 0.5;
  const p = Math.max(0.04, openProg);

  // 1. 눈이 감겨있을 때 (날카로운 실선 슬릿)
  if (openProg <= 0.08) {
    ctx.fillStyle = "rgba(185, 28, 28, 0.95)";
    ctx.beginPath();
    ctx.moveTo(-halfW, 0);
    ctx.quadraticCurveTo(0, -1.5, halfW, 0);
    ctx.quadraticCurveTo(0, 1.5, -halfW, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return;
  }

  // 2. 레퍼런스 100% 고증: 외측 상단이 솟구치고 아래쪽이 두텁게 볼록한 맹수 아치
  ctx.beginPath();
  ctx.moveTo(-halfW, 0);
  // 상단 눈꺼풀: 부드러운 아치
  ctx.bezierCurveTo(
    -halfW * 0.45, -height * 0.52 * p,
    halfW * 0.45, -height * 0.35 * p,
    halfW, 0
  );
  // 하단 눈꺼풀: 아래쪽으로 깊고 두껍게 볼록한 맹수 눈망울
  ctx.bezierCurveTo(
    halfW * 0.45, height * 0.78 * p,
    -halfW * 0.45, height * 0.70 * p,
    -halfW, 0
  );
  ctx.closePath();

  // 3. 반투명 핏빛 붉은색 채우기 (레퍼런스 원본 컬러: rgba(165, 24, 24, 0.82))
  ctx.fillStyle = "rgba(165, 24, 24, 0.82)";
  ctx.fill();

  // 미세한 외곽 엣지
  ctx.strokeStyle = "rgba(140, 18, 18, 0.90)";
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // 4. 중앙 세로 슬릿 동공 (눈 안쪽 & 아래쪽으로 배치된 맹수 시선)
  if (openProg >= 0.85) {
    const pupilH = height * 0.45;
    const pupilW = 2.2;
    const pupilX = 12.0; // 눈 안쪽(중앙/코)으로 더 이동
    const pupilY = 4.0;  // 눈 아래쪽으로 이동

    ctx.save();
    // 눈동자(눈알)는 기울이지 않고 완벽한 수직(Vertical) 유지
    ctx.rotate(-0.26);

    // 은은한 올리브 황록색 슬릿 동공 베이스
    ctx.fillStyle = "#A8BD26";
    ctx.beginPath();
    ctx.ellipse(pupilX, pupilY, pupilW, pupilH * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 동공 내부 슬림 코어
    ctx.fillStyle = "#E5F76B";
    ctx.beginPath();
    ctx.ellipse(pupilX, pupilY, pupilW * 0.45, pupilH * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 🌟 137: 뱀눈초리 메인 이펙트 렌더러
 */
export function drawGlareEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, attackerPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep || 1;

  // 1. 암전 효과 필터 적용
  let dimA = 0;
  if (step === 1) dimA = 0.55;
  else if (step === 2 || step === 3 || step === 4) dimA = 0.78;
  else if (step === 5) dimA = 0.38;
  drawDimOverlay(targetCtx, dimA, "rgba(12, 10, 10, 0.82)");

  // 2. 눈 중심 위치: 시전 포켓몬(Attacker) 머리 위 상공에 부유
  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));

  const eyeCenterX = ax;
  const eyeBaseY = ay - 68; // 머리 위 기준 높이 복원

  // 3. 아래(시전자 몸체)에서부터 붉은색 실선 상승 ➔ 머리 위에서 눈 개안
  let riseOffsetY = 0;
  let openProg = 0;
  let eyeAlpha = 1.0;

  if (step === 1) {
    // 1단계: 시전자 몸체 부근에서 머리 위로 실선이 솟아오름
    riseOffsetY = 28;
    openProg = 0.0;
    eyeAlpha = 0.85;
  } else if (step === 2) {
    // 2단계: 실선이 시전자 머리 위에 안착
    riseOffsetY = 0;
    openProg = 0.05;
    eyeAlpha = 0.95;
  } else if (step === 3) {
    // 3단계: 눈을 뜨기 시작함
    riseOffsetY = 0;
    openProg = 0.55;
    eyeAlpha = 1.0;
  } else if (step === 4) {
    // 4단계: 눈을 완전히 뜨며 뱀눈 완성
    riseOffsetY = 0;
    openProg = 1.0;
    eyeAlpha = 1.0;
  } else if (step === 5) {
    // 5단계: 응시 유지 및 페이드아웃
    riseOffsetY = 0;
    openProg = 1.0;
    eyeAlpha = 0.60;
  }

  if (step >= 1 && step <= 5) {
    const eyeSpacing = 35; // 눈들 간격 살짝만 좁힘 (40 -> 35)
    const eyeW = 60;
    const eyeH = 40;
    const curY = eyeBaseY + riseOffsetY;

    // 좌안 & 우안 렌더링 (시전자 머리 위)
    drawSnakeEye(targetCtx, eyeCenterX - eyeSpacing, curY, eyeW, eyeH, openProg, eyeAlpha, true);
    drawSnakeEye(targetCtx, eyeCenterX + eyeSpacing, curY, eyeW, eyeH, openProg, eyeAlpha, false);
  }
}

// ============================================================================
// 🔮 138: 꿈먹기 (Dream Eater)
// ============================================================================
/**
 * 꿈먹기 몽환의 정기 모트 (Dream Spirit Mote - 사이킥 퍼플/마젠타/유백색 코어)
 */
export function drawDreamSpiritMote(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || radius <= 0.5) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 1. 외곽 보랏빛 몽환 안개 글로우 (마젠타/라벤더 -> 바이올렛)
  const auraGrad = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius * 2.0);
  auraGrad.addColorStop(0.0, "rgba(232, 121, 249, 0.85)"); // 밝은 마젠타/라벤더
  auraGrad.addColorStop(0.50, "rgba(168, 85, 247, 0.50)"); // 사이킥 퍼플
  auraGrad.addColorStop(1.0, "rgba(126, 34, 206, 0.0)");
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(x, y, radius * 2.0, 0, Math.PI * 2);
  ctx.fill();

  // 2. 내부 유백색 꿈 코어
  const coreGrad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  coreGrad.addColorStop(0.0, "#FFFFFF"); // 초고열 순백
  coreGrad.addColorStop(0.55, "#F5D0FE"); // 연보라
  coreGrad.addColorStop(1.0, "#C084FC"); // 바이올렛
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // 3. 신비로운 화이트 코어 핫스팟
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(x - radius * 0.25, y - radius * 0.25, radius * 0.28, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 메가드레인 메커니즘 100% 반영: 8개 모트의 교차 곡선 아크 궤적 스트림 (Mega Drain Trajectory)
 */
const DREAM_MOTES = [
  { curveOffset:  56, delay: 0.00, dur: 0.62, r: 5.2, ox:   0, oy:   0 },
  { curveOffset: -52, delay: 0.06, dur: 0.62, r: 4.8, ox: -12, oy:   8 },
  { curveOffset:  36, delay: 0.12, dur: 0.60, r: 4.4, ox:  10, oy: -10 },
  { curveOffset: -38, delay: 0.18, dur: 0.58, r: 4.6, ox:  -8, oy: -12 },
  { curveOffset:  68, delay: 0.22, dur: 0.60, r: 5.4, ox:  14, oy:  10 },
  { curveOffset: -62, delay: 0.26, dur: 0.58, r: 4.8, ox: -14, oy:   4 },
  { curveOffset:  44, delay: 0.30, dur: 0.56, r: 4.2, ox:   6, oy:  -6 },
  { curveOffset: -40, delay: 0.34, dur: 0.55, r: 4.5, ox:  -4, oy:  12 },
];

export function drawDreamEaterStream(
  ctx: any,
  startPos: { x: number; y: number },
  endPos: { x: number; y: number },
  progress: number = 0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || progress <= 0) return;

  const dx = endPos.x - startPos.x;
  const dy = endPos.y - startPos.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return;

  const nx = -dy / dist;
  const ny = dx / dist;

  ctx.save();

  for (const m of DREAM_MOTES) {
    const p = (progress - m.delay) / m.dur;

    // 대기/추출 단계 (시작 지점 모으기)
    if (p < 0) {
      const gatherProg = Math.max(0, Math.min(1, progress / Math.max(0.01, m.delay)));
      if (gatherProg > 0.12) {
        drawDreamSpiritMote(
          ctx,
          startPos.x + m.ox,
          startPos.y + m.oy,
          m.r * 0.65 * gatherProg,
          alpha * gatherProg * 0.85
        );
      }
      continue;
    }

    if (p > 1.0) continue;

    const t = Math.max(0, Math.min(1.0, p));
    const tEased = t * t * (3 - 2 * t);

    // 잔상 트레일 (Ghost Trails, g = 3 down to 1)
    for (let g = 3; g >= 1; g--) {
      const gt = Math.max(0, t - g * 0.04);
      const gtEased = gt * gt * (3 - 2 * gt);
      const gCurve = Math.sin(gt * Math.PI);

      const gx = startPos.x + m.ox * (1 - gt) + dx * gtEased + nx * (m.curveOffset * gCurve);
      const gy = startPos.y + m.oy * (1 - gt) + dy * gtEased + ny * (m.curveOffset * gCurve);

      let gAlpha = alpha * (1 - g * 0.28) * 0.65;
      if (gt < 0.10) gAlpha *= (gt / 0.10);
      else if (gt > 0.90) gAlpha *= ((1 - gt) / 0.10);

      drawDreamSpiritMote(ctx, gx, gy, m.r * (1 - g * 0.20), gAlpha);
    }

    // 메인 비행 모트
    const curve = Math.sin(t * Math.PI);
    const curX = startPos.x + m.ox * (1 - t) + dx * tEased + nx * (m.curveOffset * curve);
    const curY = startPos.y + m.oy * (1 - t) + dy * tEased + ny * (m.curveOffset * curve);

    let moteAlpha = alpha;
    if (t < 0.10) moteAlpha *= (t / 0.10);
    else if (t > 0.90) moteAlpha *= ((1 - t) / 0.10);

    drawDreamSpiritMote(ctx, curX, curY, m.r, moteAlpha);
  }

  ctx.restore();
}

/**
 * 꿈먹기 전용 사이킥 보랏빛 광학 발광 빔 (Dream Psychic Glow Beam)
 */
function drawDreamGlowBeam(
  ctx: any,
  cx: number,
  cy: number,
  length: number,
  width: number,
  angle: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || length <= 0 || width <= 0) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // 1. 외곽 마젠타/바이올렛 부드러운 빔
  ctx.save();
  ctx.scale(length * 1.08, width * 1.08);
  const outerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  outerGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.95})`);
  outerGrad.addColorStop(0.28, `rgba(245, 208, 254, ${alpha * 0.85})`);
  outerGrad.addColorStop(0.70, `rgba(192, 132, 252, ${alpha * 0.35})`);
  outerGrad.addColorStop(1, "rgba(168, 85, 247, 0)");
  ctx.fillStyle = outerGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. 내부 선명한 마젠타/연보라 샤프 빔
  ctx.save();
  ctx.scale(length, width);
  const innerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  innerGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 1.0})`);
  innerGrad.addColorStop(0.35, `rgba(245, 208, 254, ${alpha * 0.92})`);
  innerGrad.addColorStop(0.75, `rgba(232, 121, 249, ${alpha * 0.50})`);
  innerGrad.addColorStop(1, "rgba(168, 85, 247, 0)");
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. 중심부 초고휘도 코어 바늘
  ctx.save();
  ctx.scale(length * 0.78, Math.max(1.0, width * 0.35));
  const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  coreGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 1.0})`);
  coreGrad.addColorStop(0.45, `rgba(245, 208, 254, ${alpha * 0.90})`);
  coreGrad.addColorStop(1, "rgba(245, 208, 254, 0)");
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * 꿈먹기 전용 보랏빛 치유 링 & 4방향 십자 스타 글로우 엠블럼 (HP회복 구조 100% 반영)
 */
export function drawDreamRecoveryEmblem(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || size <= 0) return;
  ctx.save();

  // 1. 은은한 연보라/마젠타 외곽 블룸
  const bloomR = size * 1.25;
  const bloomGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, bloomR);
  bloomGrad.addColorStop(0, `rgba(245, 208, 254, ${alpha * 0.45})`);
  bloomGrad.addColorStop(0.50, `rgba(232, 121, 249, ${alpha * 0.24})`);
  bloomGrad.addColorStop(1, "rgba(168, 85, 247, 0)");
  ctx.fillStyle = bloomGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, bloomR, 0, Math.PI * 2);
  ctx.fill();

  // 2. 외곽 원형 치유 링 (바이올렛 & 연보라 반투명 림)
  const ringR = size * 0.52;
  const rOuter = ringR + size * 0.20;
  const rInner = Math.max(1, ringR - size * 0.18);
  const peakT = ringR / rOuter;
  const innerT = rInner / rOuter;

  const ringGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rOuter);
  ringGrad.addColorStop(0, "rgba(168, 85, 247, 0)");
  ringGrad.addColorStop(innerT * 0.70, "rgba(168, 85, 247, 0)");
  ringGrad.addColorStop(innerT + (peakT - innerT) * 0.45, `rgba(192, 132, 252, ${alpha * 0.16})`);
  ringGrad.addColorStop(peakT, `rgba(245, 208, 254, ${alpha * 0.38})`);
  ringGrad.addColorStop(peakT + (1.0 - peakT) * 0.45, `rgba(192, 132, 252, ${alpha * 0.16})`);
  ringGrad.addColorStop(1.0, "rgba(168, 85, 247, 0)");

  ctx.fillStyle = ringGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
  ctx.fill();

  // 3. 중심부 대각선 다이아몬드 글로우
  const diagLen = size * 0.38;
  const diagWidth = Math.max(2.0, size * 0.16);
  drawDreamGlowBeam(ctx, cx, cy, diagLen, diagWidth, Math.PI / 4, alpha * 0.70);
  drawDreamGlowBeam(ctx, cx, cy, diagLen, diagWidth, -Math.PI / 4, alpha * 0.70);

  // 4. 4방향 십자형 메인 광학 발광 빔
  const rayLen = size;
  const rayWidth = Math.max(2.8, size * 0.22);
  drawDreamGlowBeam(ctx, cx, cy, rayLen, rayWidth, 0, alpha);
  drawDreamGlowBeam(ctx, cx, cy, rayLen, rayWidth, Math.PI / 2, alpha);

  // 5. 중심부 퓨어 화이트 핫스팟
  const coreR = Math.max(2.5, size * 0.20);
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
  coreGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 1.0})`);
  coreGrad.addColorStop(0.45, `rgba(245, 208, 254, ${alpha * 0.90})`);
  coreGrad.addColorStop(1, "rgba(192, 132, 252, 0)");
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 🌟 꿈먹기 전용 보랏빛 나선 상승 회복별 & 시전자 체표면 치유 광채 (HP회복 100% 동일 메커니즘)
 */
export function drawDreamRecoveryStarSpiral(
  ctx: any,
  ax: number,
  bodyCenterY: number,
  p: number
) {
  // 1. 시전자 체표면 잔여 치유 광채 (보랏빛 페이드아웃)
  const bodyGlowAlpha = Math.max(0, (1.0 - p) * 0.32);
  if (bodyGlowAlpha > 0.02) {
    ctx.save();
    const bGrad = ctx.createRadialGradient(ax, bodyCenterY, 0, ax, bodyCenterY, 28);
    bGrad.addColorStop(0, `rgba(245, 208, 254, ${bodyGlowAlpha * 0.75})`);
    bGrad.addColorStop(0.5, `rgba(232, 121, 249, ${bodyGlowAlpha * 0.45})`);
    bGrad.addColorStop(1, "rgba(168, 85, 247, 0)");
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.arc(ax, bodyCenterY, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. 4개의 회복별 구성 (1시 방향 출현 ➔ 330도 시계방향 선회 ➔ 12시 방향 상공 승화)
  const RECOVERY_STARS = [
    { spawnT: 0.00, duration: 0.54, size: 22, rx: 44, ry: 16 },
    { spawnT: 0.16, duration: 0.54, size: 20, rx: 42, ry: 15 },
    { spawnT: 0.32, duration: 0.54, size: 23, rx: 45, ry: 16 },
    { spawnT: 0.48, duration: 0.54, size: 21, rx: 43, ry: 15 },
  ];

  const startY = bodyCenterY + 16;
  const endY = bodyCenterY - 48;
  const startAngle = Math.PI / 6; // 30도 (1시 방향)
  const totalRot = (11 * Math.PI) / 6; // 330도 회전 (12시 방향 완주)

  const activeStars: any[] = [];
  for (let i = 0; i < RECOVERY_STARS.length; i++) {
    const s = RECOVERY_STARS[i];
    if (p < s.spawnT) continue;
    const relT = (p - s.spawnT) / s.duration;
    if (relT >= 1.0) continue;

    // A. 완만한 가속 상승 높이
    const yBase = startY + (endY - startY) * Math.pow(relT, 1.3);
    // B. 시계방향 회전 각도
    const phi = startAngle + relT * totalRot;

    // C. 생성 직후 발밑에서 부드럽게 반경 확장
    const bloomRadius = Math.min(1.0, relT / 0.15);
    const curRx = s.rx * bloomRadius;
    const curRy = s.ry * bloomRadius;

    // D. 3D 타원 궤도
    const offsetX = Math.sin(phi) * curRx;
    const depthY = -Math.cos(phi) * curRy;

    // E. Z축 입체 깊이감
    const depthRatio = curRy > 0 ? (depthY / curRy) : 0;
    const curSize = s.size * (1.0 + depthRatio * 0.10);

    // F. 투명도: 발밑 생성 페이드인 ➔ 상공 승화 페이드아웃
    let starAlpha = 1.0;
    if (relT < 0.15) {
      starAlpha = relT / 0.15;
    } else {
      starAlpha = Math.max(0, 1.0 - (relT - 0.15) / 0.85);
    }
    starAlpha *= (0.88 + 0.12 * depthRatio);

    activeStars.push({
      x: ax + offsetX,
      y: yBase + depthY,
      size: curSize,
      alpha: starAlpha,
      depthRatio,
    });
  }

  // Z축 깊이 순(후면 -> 전면) 정렬 후 렌더링
  activeStars.sort((a, b) => a.depthRatio - b.depthRatio);
  for (const star of activeStars) {
    drawDreamRecoveryEmblem(ctx, star.x, star.y, star.size, star.alpha);
  }
}

/**
 * 🌟 138: 꿈먹기 메인 이펙트 렌더러
 */
export function drawDreamEaterEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, attackerPos, isPlayer: isP } = drawCtx;

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - 8;

  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0)) - 10;

  // 1. 몽환적 사이킥 딥 인디고 암전 (깜빡임 전혀 없는 매끄러운 단조 증가 -> 점진 페이드아웃)
  const drainP = (frame as any).drainProgress ?? 0;
  const healP = (frame as any).healProgress ?? 0;
  let dimA = 0;

  if (healP > 0) {
    // 회복 단계: 회복별이 상공으로 승화하며 암전이 부드럽게 걷힘
    dimA = Math.max(0, 0.68 * (1.0 - healP));
  } else if (drainP > 0) {
    // 추출 및 흡수 단계: 0.42에서 0.68까지 매끄럽게 암전 심화
    dimA = Math.min(0.68, 0.42 + drainP * 0.26);
  } else if (frame.phaseId && frame.phaseId.includes("to-caster")) {
    // 시전자 포커싱 전환 카메라 이동 중에도 암전(0.68)을 일정하게 유지하여 깜빡임 원천 차단!
    dimA = 0.68;
  }
  drawDimOverlay(targetCtx, dimA, "rgba(24, 9, 44, 0.85)");

  // 2. 메가드레인 방식 곡선 아크 비행 스트림 (drainProgress: 0.0 ~ 1.0)
  if (drainP > 0) {
    drawDreamEaterStream(targetCtx, { x: tx, y: ty }, { x: ax, y: ay }, drainP, 1.0);
  }

  // 3. 대상 악몽 타격 왜곡 링 (drainProgress 0.20 ~ 0.65)
  if (drainP >= 0.20 && drainP <= 0.65) {
    targetCtx.save();
    const shockP = (drainP - 0.20) / 0.45;
    const sR = 25 + shockP * 38;
    targetCtx.strokeStyle = `rgba(192, 132, 252, ${(1.0 - shockP) * 0.85})`;
    targetCtx.lineWidth = 2.5;
    targetCtx.beginPath();
    targetCtx.arc(tx, ty, sR, 0, Math.PI * 2);
    targetCtx.stroke();
    targetCtx.restore();
  }

  // 4. 흡수 완료 후! [HP회복(Recover) 나선 회복별 연출 - 보랏빛 꿈먹기 테마]
  if (healP > 0) {
    drawDreamRecoveryStarSpiral(targetCtx, ax, ay - 6, healP);
  }
}

// ============================================================================
// ☠️ 139: 독가스 (Poison Gas) - 직선 관통 제트 스트림 & Z축 후면 통과 렌더링
// ============================================================================

/**
 * 부드러운 유독 가스 퍼프 (외곽 100% 완전 투명 라디얼 그라데이션)
 */
function drawToxicGasPuff(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  innerAlpha: number = 0.65,
  tint: "dark" | "mid" | "light" = "mid"
) {
  if (radius <= 1 || innerAlpha <= 0.01) return;
  ctx.save();

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);

  if (tint === "dark") {
    // 심연 흑자색
    grad.addColorStop(0.0, `rgba(25, 5, 38, ${innerAlpha})`);
    grad.addColorStop(0.35, `rgba(45, 8, 69, ${innerAlpha * 0.85})`);
    grad.addColorStop(0.70, `rgba(74, 14, 110, ${innerAlpha * 0.45})`);
    grad.addColorStop(1.0, `rgba(74, 14, 110, 0.0)`);
  } else if (tint === "mid") {
    // 독성 바이올렛
    grad.addColorStop(0.0, `rgba(59, 7, 100, ${innerAlpha})`);
    grad.addColorStop(0.40, `rgba(88, 28, 135, ${innerAlpha * 0.75})`);
    grad.addColorStop(0.75, `rgba(126, 34, 206, ${innerAlpha * 0.35})`);
    grad.addColorStop(1.0, `rgba(126, 34, 206, 0.0)`);
  } else {
    // 상단 연무 라이트 퍼플
    grad.addColorStop(0.0, `rgba(107, 33, 168, ${innerAlpha})`);
    grad.addColorStop(0.45, `rgba(147, 51, 234, ${innerAlpha * 0.70})`);
    grad.addColorStop(0.80, `rgba(168, 85, 247, ${innerAlpha * 0.30})`);
    grad.addColorStop(1.0, `rgba(168, 85, 247, 0.0)`);
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 일직선 방향 유독 가스 빔 기저 콘
 */
function drawStraightGasCone(
  ctx: any,
  ax: number,
  ay: number,
  tx: number,
  ty: number,
  startP: number,
  endP: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || endP <= startP) return;

  const dx = tx - ax;
  const dy = ty - ay;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return;

  const ux = dx / dist;
  const uy = dy / dist;
  const nx = -uy;
  const ny = ux;

  const SAMPLES = 12;
  const pts: { cx: number; cy: number; w: number; s: number }[] = [];

  for (let i = 0; i <= SAMPLES; i++) {
    const frac = i / SAMPLES;
    const s = startP + frac * (endP - startP);
    // [유저 지시]: 오직 일직선 궤적!
    const cx = ax + ux * (dist * s);
    const cy = ay + uy * (dist * s);
    const w = 8.0 + s * 22.0;
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
    // [유저 지시]: 통과한 가스는 뒤로 갈수록 점진적 투명화 (Distance Depth Fade)
    const backFade = midS > 1.0 ? Math.max(0, 1.0 - (midS - 1.0) / 0.52) : 1.0;
    const longFade = startFade * endFade * backFade;
    if (longFade <= 0.01) continue;

    const grad = ctx.createLinearGradient(
      midCx - nx * midW,
      midCy - ny * midW,
      midCx + nx * midW,
      midCy + ny * midW
    );

    const aBase = alpha * longFade;
    grad.addColorStop(0.0, "rgba(107, 33, 168, 0.0)");
    grad.addColorStop(0.20, `rgba(126, 34, 206, ${0.18 * aBase})`);
    grad.addColorStop(0.40, `rgba(88, 28, 135, ${0.45 * aBase})`);
    grad.addColorStop(0.50, `rgba(25, 5, 38, ${0.65 * aBase})`);
    grad.addColorStop(0.60, `rgba(88, 28, 135, ${0.45 * aBase})`);
    grad.addColorStop(0.80, `rgba(126, 34, 206, ${0.18 * aBase})`);
    grad.addColorStop(1.0, "rgba(107, 33, 168, 0.0)");

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
 * 💨 독가스 전용 직선 관통 제트 스트림 (Straight Penetrating Toxic Gas Stream)
 * - 상대방 방향으로 100% 일직선 궤적으로 발사
 * - layer === "front": 시전자 입가(0.0)에서 상대 앞(1.00)까지 전면 스트림
 * - layer === "behind": 상대를 통과(0.92)하여 Z축 뒤로 깊숙이 뻗어나가는(1.45+) 후면 관통 스트림
 * - [유저 지시]: 관통한 가스는 뒤로 갈수록 점진적으로 투명화되어 허공으로 자연스럽게 소산
 */
function drawStraightToxicGasStream(
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

  // [유저 지시 반영]: 상대방 스프라이트를 통과해서 Z축 뒤로 분리!
  let segStart = startP;
  let segEnd = endP;

  if (layer === "front") {
    segStart = startP;
    segEnd = Math.min(1.02, endP);
  } else {
    // 상대방 후면 레이어: 상대를 관통하여 등 뒤(Z축 뒤)로 빠져나간 가스
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

  // 1. 직선 기저 가스 콘
  drawStraightGasCone(ctx, startX, startY, targetX, targetY, segStart, segEnd, alpha * 0.95);

  // 2. 직선 방향으로 고속 쇄도하는 독가스 퍼프 클러스터
  const BURST_SPACING = 0.08;
  const flowAdvance = (flowTime * 0.35) % BURST_SPACING;
  const activeEnd = segEnd;

  for (let k = 0; k < 18; k++) {
    const t = activeEnd - flowAdvance - k * BURST_SPACING;
    if (t < segStart - 0.03 || t > segEnd + 0.02) continue;

    // 미세 고속 진동 (직선 궤적 유지하면서 기체감 표현)
    const jiggle = Math.sin(k * 2.7 + flowTime * 2.0) * (1.8 + t * 2.5);

    const px = startX + ux * (dist * t) + nx * jiggle;
    const py = startY + uy * (dist * t) + ny * jiggle;

    // 직선 팽창: 입가(10px) -> 상대방(30px) -> 관통 후(38px)
    const r = 10.0 + Math.pow(Math.max(0, t), 0.85) * 26.0;

    let puffAlpha = alpha * 0.88;
    if (t < segStart + 0.06) {
      puffAlpha *= Math.max(0, (t - segStart) / 0.06);
    }
    if (t > segEnd - 0.08) {
      puffAlpha *= Math.max(0, (segEnd - t) / 0.08);
    }

    // [유저 지시 반영]: 통과한 가스(t > 0.98)는 뒤로 갈수록 점진적으로 투명하게 소멸!
    if (layer === "behind" || t > 0.98) {
      const backDist = Math.max(0, t - 0.98);
      const backFade = Math.max(0, Math.pow(1.0 - Math.min(1.0, backDist / 0.52), 1.25));
      puffAlpha *= backFade;
    }

    drawToxicGasPuff(ctx, px, py, r, puffAlpha, layer === "behind" ? "dark" : "mid");
    drawToxicGasPuff(ctx, px, py, r * 0.65, puffAlpha * 0.70, layer === "behind" ? "dark" : "light");
  }

  // 3. 직선 제트 스트림 외곽 연무 가닥 (고속 직선감)
  const WISP_COUNT = 8;
  for (let j = 0; j < WISP_COUNT; j++) {
    const wt = segStart + (j / (WISP_COUNT - 1)) * (segEnd - segStart);
    if (wt < 0.05) continue;

    const sign = j % 2 === 0 ? 1 : -1;
    const halfW = 6.0 + wt * 16.0;
    const wx = startX + ux * (dist * wt) + nx * (sign * halfW);
    const wy = startY + uy * (dist * wt) + ny * (sign * halfW);

    const wispR = 6.0 + wt * 12.0;
    let wispAlpha = alpha * 0.38;
    // [유저 지시 반영]: 연무 가닥도 뒤로 갈수록 투명하게 페이드아웃
    if (layer === "behind" || wt > 0.98) {
      const backDist = Math.max(0, wt - 0.98);
      const backFade = Math.max(0, 1.0 - Math.min(1.0, backDist / 0.52));
      wispAlpha *= backFade;
    }
    drawToxicGasPuff(ctx, wx, wy, wispR, wispAlpha, "light");
  }

  ctx.restore();
}

/**
 * 139: 독가스 후방 레이어 렌더러
 * - [핵심]: 상대방 스프라이트를 관통하여 Z축 뒤로 빠져나간 직선 독가스 제트 스트림 렌더링!
 * - 상대방 등 뒤에서 뭉게뭉게 퍼지는 독무 배경 구름
 */
export function drawPoisonGasBehindEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, attackerPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep || 1;
  const p = frame.effectProgress ?? 0.5;

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));
  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0));

  const mouthX = ax + (isP ? 34 : -34);
  const mouthY = ay - (isP ? 14 : 10);
  const targetCenterY = ty - (isP ? 14 : 10);

  // 1. [유저 지시]: 상대를 관통하여 등 뒤(Z축 뒤)로 분출되는 직선 제트 스트림!
  const streamHead = frame.streamHead ?? 0.0;
  const streamTail = frame.streamTail ?? 0.0;
  const streamAlpha = frame.streamAlpha ?? 1.0;

  if (streamHead > 0.92 && streamAlpha > 0.01) {
    const flowTime = (step * 2.0) + p * 4.0;
    drawStraightToxicGasStream(
      targetCtx,
      mouthX,
      mouthY,
      tx,
      targetCenterY,
      streamTail,
      streamHead,
      streamAlpha,
      flowTime,
      "behind" // 🌟 Z축 뒤로 관통!
    );
  }

  // 2. 상대방 등 뒤(Z축 뒤)에서 퍼져나가는 후방 독무 구름 (step 3~5)
  if (step >= 3) {
    const BEHIND_PUFFS = [
      { dx:  18, dy: -12, r: 42, birth: 0.15 },
      { dx: -22, dy:   8, r: 38, birth: 0.30 },
      { dx:   6, dy: -26, r: 46, birth: 0.50 },
      { dx: -14, dy: -18, r: 40, birth: 0.70 },
    ];

    for (let i = 0; i < BEHIND_PUFFS.length; i++) {
      const b = BEHIND_PUFFS[i];
      let bAlpha = 0;
      let bScale = 1.0;
      let bRise = 0;

      if (step === 3) {
        if (p < b.birth) continue;
        const g = (p - b.birth) / 0.35;
        bAlpha = Math.min(0.85, g * 0.90);
        bScale = 0.5 + 0.5 * Math.sin(Math.min(1.0, g) * Math.PI * 0.5);
      } else if (step === 4) {
        bAlpha = 0.85;
      } else if (step === 5) {
        bAlpha = Math.max(0, 0.85 * (1.0 - p));
        bScale = 1.0 + p * 0.25;
        bRise = p * 30;
      }

      if (bAlpha > 0.02) {
        drawToxicGasPuff(
          targetCtx,
          tx + b.dx,
          targetCenterY + b.dy - bRise,
          b.r * bScale,
          bAlpha,
          "dark"
        );
      }
    }
  }
}

/**
 * 🌟 139: 독가스 전면 레이어 렌더러
 * - [핵심]: 시전자 입에서 상대방을 향해 '직선 방향으로만' 고속 발사되는 독가스 스트림 전면부
 * - 피격자 주변 보랏빛 독 기포(Poison Bubbles) 군집
 */
export function drawPoisonGasEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, attackerPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep || 1;
  const p = frame.effectProgress ?? 0.5;

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));
  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0));

  const mouthX = ax + (isP ? 34 : -34);
  const mouthY = ay - (isP ? 14 : 10);
  const targetCenterY = ty - (isP ? 14 : 10);

  // 1. Step 1: 들이쉬기 및 입가 독기 연무
  if (step === 1) {
    const muzzleAlpha = Math.min(0.95, p * 1.6);
    const muzzleR = 12 + p * 16;
    drawToxicGasPuff(targetCtx, mouthX, mouthY, muzzleR, muzzleAlpha, "dark");
    drawToxicGasPuff(targetCtx, mouthX, mouthY, muzzleR * 0.6, muzzleAlpha * 0.8, "mid");
  }

  // 2. 직선 제트 스트림 전면부 (시전자 입 ➔ 상대방 앞까지)
  const streamHead = frame.streamHead ?? 0.0;
  const streamTail = frame.streamTail ?? 0.0;
  const streamAlpha = frame.streamAlpha ?? 1.0;

  if (streamHead > 0 && streamHead > streamTail && streamAlpha > 0.01) {
    const flowTime = (step * 2.0) + p * 4.0;
    drawStraightToxicGasStream(
      targetCtx,
      mouthX,
      mouthY,
      tx,
      targetCenterY,
      streamTail,
      streamHead,
      streamAlpha,
      flowTime,
      "front" // 🌟 전면부 렌더링!
    );
  }

  // 3. 상대 전면 롤링 퍼프 (step 3~5)
  if (step >= 3) {
    const FRONT_PUFFS = [
      { dx: -18, dy:   4, r: 36, birth: 0.10 },
      { dx:  14, dy:   8, r: 34, birth: 0.25 },
      { dx:   0, dy:  16, r: 32, birth: 0.45 },
    ];

    for (let i = 0; i < FRONT_PUFFS.length; i++) {
      const b = FRONT_PUFFS[i];
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
        bScale = 1.0 + p * 0.25;
        bRise = p * 30;
      }

      if (bAlpha > 0.02) {
        drawToxicGasPuff(
          targetCtx,
          tx + b.dx,
          targetCenterY + b.dy - bRise,
          b.r * bScale,
          bAlpha,
          "mid"
        );
      }
    }

    // 4. 독가스 상태이상 전용 보라색 독 비눗방울 군집
    const POISON_GAS_BUBBLES = [
      { ox: -24, oy:  10, r: 7.0, rise: 30, speed: 1.2, phase: 0.10 },
      { ox:  20, oy: -14, r: 8.5, rise: 36, speed: 1.4, phase: 0.32 },
      { ox: -10, oy: -22, r: 6.0, rise: 26, speed: 1.1, phase: 0.55 },
      { ox:  26, oy:  14, r: 7.5, rise: 32, speed: 1.5, phase: 0.74 },
      { ox:   4, oy:   6, r: 9.5, rise: 40, speed: 1.6, phase: 0.88 },
      { ox: -28, oy:  -6, r: 6.5, rise: 28, speed: 1.3, phase: 0.42 },
    ];

    for (const b of POISON_GAS_BUBBLES) {
      const bP = ((p * b.speed + b.phase) % 1.0);
      const bY = targetCenterY + b.oy - bP * b.rise;
      const bX = tx + b.ox + Math.sin(bP * Math.PI * 2) * 5;
      const bScale = Math.sin(bP * Math.PI);
      if (bScale > 0.08) {
        targetCtx.save();
        targetCtx.globalAlpha = Math.min(1.0, bScale * 1.3);
        drawPoisonSoapBubble(targetCtx, bX, bY, b.r * bScale);
        targetCtx.restore();
      }
    }
  }
}

// ============================================================================
// ⚪ 140: 구슬던지기 (Barrage)
// ============================================================================
/**
 * ⚪ 140: 구슬던지기 전용 흰색 구슬 렌더러
 * - [유저 지시]: "흰색 구슬 (테두리 검정 바깥쪽으로 반투명한 보더를 가진)(흰색구체 안쪽의 흰색 바깥쪽으로 반투명흰색)"
 * - 1. 안쪽: 중심부 고휘도 화이트에서 외곽으로 갈수록 반투명 화이트로 부드럽게 페이드 (피격 몬스터 스프라이트 투과)
 * - 2. 테두리: 선명한 검정 테두리 링
 * - 3. 테두리 바깥: 부드러운 반투명 검정 보더 헤일로
 */
export function drawBarrageWhiteOrb(
  ctx: any,
  x: number,
  y: number,
  radius: number = 23,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || radius <= 0.5) return;

  ctx.save();
  ctx.translate(x, y);

  // 1. 테두리 바깥쪽 반투명 검정 보더 헤일로 (Soft Outer Dark Border)
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = `rgba(25, 25, 30, ${0.35 * alpha})`;
  ctx.beginPath();
  ctx.arc(0, 0, radius + 2.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 2.5;
  ctx.strokeStyle = `rgba(18, 18, 22, ${0.55 * alpha})`;
  ctx.beginPath();
  ctx.arc(0, 0, radius + 1.2, 0, Math.PI * 2);
  ctx.stroke();

  // 2. 메인 검정 테두리 선 (Crisp Black Border)
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = `rgba(10, 10, 15, ${0.92 * alpha})`;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  // 3. 흰색 구체 내부: 중심은 흰색, 바깥쪽으로 갈수록 반투명 흰색 (배경 스프라이트 투과)
  const innerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  innerGrad.addColorStop(0.0, `rgba(255, 255, 255, ${0.95 * alpha})`);
  innerGrad.addColorStop(0.30, `rgba(255, 255, 255, ${0.82 * alpha})`);
  innerGrad.addColorStop(0.65, `rgba(255, 255, 255, ${0.48 * alpha})`);
  innerGrad.addColorStop(0.92, `rgba(255, 255, 255, ${0.22 * alpha})`);
  innerGrad.addColorStop(1.0, `rgba(255, 255, 255, 0.05)`);

  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.arc(0, 0, radius - 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 💨 타격 이후 바닥 흙먼지 구름 (Sandy Beige Dust Cloud - 첨부 이미지 100% 고증)
 * - [유저 지시]: "흙먼지는 바깥쪽 투명그라데이션 적용"
 * - 중심부 샌디 베이지에서 외곽으로 갈수록 100% 완전 투명하게 페이드아웃되는 방사형 그라데이션
 */
const BARRAGE_DUST_PUFFS = [
  // 좌측 먼지 날개
  { ox: -44, oy: -14, r: 16, scale: 0.9 },
  { ox: -32, oy: -20, r: 18, scale: 1.0 },
  { ox: -22, oy: -6,  r: 21, scale: 1.05 },
  // 중앙 바닥 기저부
  { ox: -8,  oy: -16, r: 24, scale: 1.1 },
  { ox:  0,  oy: -8,  r: 25, scale: 1.15 },
  { ox:  12, oy: -15, r: 22, scale: 1.05 },
  // 우측 먼지 날개
  { ox:  24, oy: -6,  r: 21, scale: 1.05 },
  { ox:  34, oy: -19, r: 18, scale: 1.0 },
  { ox:  46, oy: -13, r: 15, scale: 0.9 },
];

// 외곽 미세 흙먼지 스펙
const BARRAGE_DUST_SPECKS = [
  { ox: -52, oy: -10, r: 3.5 },
  { ox: -40, oy: -28, r: 4.0 },
  { ox: -25, oy: -25, r: 3.0 },
  { ox: -12, oy: -27, r: 4.5 },
  { ox:   6, oy: -26, r: 4.0 },
  { ox:  22, oy: -26, r: 3.5 },
  { ox:  42, oy: -27, r: 4.0 },
  { ox:  54, oy: -8,  r: 3.5 },
  { ox: -48, oy:   0, r: 3.0 },
  { ox:  50, oy:   2, r: 3.0 },
];

export function drawBarrageDustCloud(
  ctx: any,
  tx: number,
  groundY: number,
  progress: number // 0.0 ~ 1.0
) {
  if (progress <= 0 || progress > 1.0) return;

  ctx.save();

  // 확산 (0 -> 1) 및 투명도
  let cloudAlpha = 1.0;
  let spreadScale = 1.0;
  let riseY = 0;

  if (progress < 0.4) {
    const t = progress / 0.4;
    cloudAlpha = Math.min(0.95, t * 1.1);
    spreadScale = 0.5 + 0.5 * Math.sin(t * Math.PI * 0.5);
  } else if (progress < 0.75) {
    cloudAlpha = 0.95;
    spreadScale = 1.0 + (progress - 0.4) * 0.15;
  } else {
    const t = (progress - 0.75) / 0.25;
    cloudAlpha = Math.max(0, 0.95 * (1.0 - t));
    spreadScale = 1.05 + t * 0.25;
    riseY = t * 6; // 서서히 허공으로 피어오름
  }

  if (cloudAlpha <= 0.02) {
    ctx.restore();
    return;
  }

  // 1. 바닥 기저 모래빛 타원 그림자 (바깥쪽 투명 그라데이션)
  const baseGrad = ctx.createRadialGradient(tx, groundY, 4, tx, groundY, 56 * spreadScale);
  baseGrad.addColorStop(0.0, `rgba(168, 142, 102, ${0.45 * cloudAlpha})`);
  baseGrad.addColorStop(0.50, `rgba(196, 170, 126, ${0.22 * cloudAlpha})`);
  baseGrad.addColorStop(0.85, `rgba(216, 195, 155, ${0.08 * cloudAlpha})`);
  baseGrad.addColorStop(1.0, `rgba(216, 195, 155, 0.0)`);
  ctx.fillStyle = baseGrad;
  ctx.beginPath();
  ctx.ellipse(tx, groundY + 2, 56 * spreadScale, 14 * spreadScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. 뭉게뭉게 흙먼지 퍼프 (바깥쪽 투명 방사형 그라데이션 완벽 적용)
  for (const puff of BARRAGE_DUST_PUFFS) {
    const px = tx + puff.ox * spreadScale;
    const py = groundY + puff.oy * spreadScale - riseY;
    const pr = puff.r * puff.scale * spreadScale;

    const puffGrad = ctx.createRadialGradient(px, py - pr * 0.15, pr * 0.05, px, py, pr);
    puffGrad.addColorStop(0.0, `rgba(253, 248, 238, ${0.95 * cloudAlpha})`);
    puffGrad.addColorStop(0.35, `rgba(235, 218, 184, ${0.82 * cloudAlpha})`);
    puffGrad.addColorStop(0.65, `rgba(210, 189, 148, ${0.48 * cloudAlpha})`);
    puffGrad.addColorStop(0.88, `rgba(184, 158, 114, ${0.18 * cloudAlpha})`);
    puffGrad.addColorStop(1.0, `rgba(184, 158, 114, 0.0)`);

    ctx.fillStyle = puffGrad;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. 외곽 미세 흙먼지 입자 스펙 (스펙도 바깥쪽 투명 그라데이션 적용)
  for (const s of BARRAGE_DUST_SPECKS) {
    const sx = tx + s.ox * spreadScale;
    const sy = groundY + s.oy * spreadScale - riseY;
    const sr = Math.max(1, s.r * spreadScale);

    const speckGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    speckGrad.addColorStop(0.0, `rgba(248, 240, 224, ${0.85 * cloudAlpha})`);
    speckGrad.addColorStop(0.55, `rgba(227, 210, 175, ${0.40 * cloudAlpha})`);
    speckGrad.addColorStop(1.0, `rgba(227, 210, 175, 0.0)`);

    ctx.fillStyle = speckGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 🌟 140: 구슬던지기 메인 이펙트 렌더러
 */
export function drawBarrageEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const { targetPos, attackerPos, isPlayer: isP } = drawCtx;
  const step = frame.moveStep || 1;

  const ax = attackerPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = attackerPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0));
  const launchX = ax + (isP ? 20 : -20);
  const launchY = ay + (isP ? -10 : 6);

  const tx = targetPos.x + (isP ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const ty = targetPos.y + (isP ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0));

  // 대상 머리 위치 및 바닥 좌표
  const targetHeadX = tx;
  const targetHeadY = ty - 16;
  const groundY = ty + (isP ? 14 : 12);

  // 1. 바닥 흙먼지 구름 (타격 이후 확산)
  const dustProgress = frame.dustProgress ?? 0;
  if (dustProgress > 0) {
    drawBarrageDustCloud(targetCtx, targetHeadX, groundY, dustProgress);
  }

  // 2. 비행 중인 구슬 (단발 투척: [유저 지시] "포물선 위로 올라가서 머리위로 떨어짐")
  const flyProgress = frame.flyProgress ?? 0;
  if (flyProgress > 0 && flyProgress < 1.0) {
    const t = flyProgress;
    const u = 1 - t;

    // 고각 포물선 & 머리 위 수직 낙하 3차 베지어 제어점
    // P0: 발사 시전자 손/입 앞
    // P1: 고각 상공 상승 유도
    // P2: 상대 머리 바로 위 상공 (수평 이동 선행 완료 지점)
    // P3: 상대 머리 타격점
    const dx = targetHeadX - launchX;
    const apexY = Math.min(launchY, targetHeadY) - 55;

    const p0x = launchX;
    const p0y = launchY;

    const p1x = launchX + dx * 0.35;
    const p1y = apexY;

    const p2x = targetHeadX;
    const p2y = apexY + 8;

    const p3x = targetHeadX;
    const p3y = targetHeadY;

    const uu = u * u;
    const uuu = uu * u;
    const tt = t * t;
    const ttt = tt * t;

    const curX = uuu * p0x + 3 * uu * t * p1x + 3 * u * tt * p2x + ttt * p3x;
    const curY = uuu * p0y + 3 * uu * t * p1y + 3 * u * tt * p2y + ttt * p3y;

    // 비행 중 크기: 16 -> 23
    const currentRadius = 16 + flyProgress * 7;
    drawBarrageWhiteOrb(targetCtx, curX, curY, currentRadius, 1.0);
  }

  // 3. 투척 준비 시 손/입 앞의 구슬
  if (step === 1 && frame.showLaunchOrb) {
    drawBarrageWhiteOrb(targetCtx, launchX, launchY, 15, 0.95);
  }

  // 4. 타격 순간 대상 머리에 꽂힌 구슬 (첨부 이미지 고증)
  if (frame.showOrbOnTarget) {
    const orbAlpha = frame.orbAlpha ?? 1.0;
    drawBarrageWhiteOrb(targetCtx, targetHeadX, targetHeadY, 23, orbAlpha);
  }
}
