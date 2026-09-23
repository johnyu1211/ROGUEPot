// ============================================================================
// ⚠️ [기술 이펙트 제작 지침 - 256색 팔레트 최적화(Octree Optimizer) 기준]
// 1. 배틀 GIF 렌더러는 Octree Quantizer + useOptimizer (threshold: 85) 기반의
//    256색 팔레트 재사용 표준을 채택하고 있음.
// 2. 기술 제작 시 불필요한 과도한 그라디언트 난사를 지양하고, 256색 팔레트 환경에서
//    선명하게 돋보이는 핵심 고채도 단색/네온 색상 체계 및 30 FPS 규격을 기준으로 제작할 것.
// 3. 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
//    직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { drawMiniRetroStar } from "../common/helpers.js";

// ============================================================================
// 공통 방어력 상승 쉐브론(▲) 및 글린트 헬퍼
// ============================================================================

/**
 * 방어력 상승 쉐브론 화살표 (Defense Boost Chevron Arrow)
 */
function drawDefenseChevron(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  color: string,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;
  ctx.translate(cx, cy);

  const w = size;
  const h = size * 0.65;
  const thick = size * 0.35;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -h);
  ctx.lineTo(w * 0.5, 0);
  ctx.lineTo(w * 0.5, thick);
  ctx.lineTo(0, -h + thick);
  ctx.lineTo(-w * 0.5, thick);
  ctx.lineTo(-w * 0.5, 0);
  ctx.closePath();
  ctx.fill();

  // 상단 하이라이트 모서리
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.5, 0);
  ctx.lineTo(0, -h);
  ctx.lineTo(w * 0.5, 0);
  ctx.stroke();

  ctx.restore();
}

/**
 * 4방향 다이아몬드 방어 경질화 글린트 (Defense Hardness Glint)
 */
function drawHardnessGlint(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  color: string = "#FFFFFF",
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;
  ctx.translate(cx, cy);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(0, 0, size * 0.25, 0);
  ctx.lineTo(size, 0);
  ctx.quadraticCurveTo(0, 0, 0, size * 0.25);
  ctx.lineTo(0, size);
  ctx.quadraticCurveTo(0, 0, -size * 0.25, 0);
  ctx.lineTo(-size, 0);
  ctx.quadraticCurveTo(0, 0, 0, -size * 0.25);
  ctx.closePath();
  ctx.fill();

  // 중심부 순백 도트
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ============================================================================
// 109: 이상한빛 (Confuse Ray)
// ============================================================================

/**
 * 109: 이상한빛(Confuse Ray) 3색 외곽 글로우(노랑 ➔ 초록 ➔ 빨강) 테마 정의
 * - 유저 요청 지침:
 *   1) 원(구체 본체)은 언제나 밝고 영롱한 '노란빛'
 *   2) 원 말고 '글로우'만 노랑 ➔ 초록 ➔ 빨강 번갈아가며 발광
 *   3) 반짝이가루(스파클/글린트) 및 구체 잔상(꼬리 구체들) 일체 제거
 */
export interface ConfuseRayGlowTheme {
  name: "yellow" | "green" | "red";
  innerGlow: string;
  midGlow: string;
  outerGlow: string;
}

export const CONFUSE_RAY_GLOWS: ConfuseRayGlowTheme[] = [
  // 0: 노랑 (Yellow Glow) - 눈부신 황금빛 엠버 오라
  {
    name: "yellow",
    innerGlow: "rgba(253, 224, 71, 0.95)",
    midGlow: "rgba(234, 179, 8, 0.55)",
    outerGlow: "rgba(202, 138, 4, 0.0)",
  },
  // 1: 초록 (Green Glow) - 신비로운 에메랄드 그린 오라
  {
    name: "green",
    innerGlow: "rgba(74, 222, 128, 0.95)",
    midGlow: "rgba(34, 197, 94, 0.55)",
    outerGlow: "rgba(21, 128, 61, 0.0)",
  },
  // 2: 빨강 (Red Glow) - 강렬한 루비 레드 오라
  {
    name: "red",
    innerGlow: "rgba(248, 113, 113, 0.95)",
    midGlow: "rgba(239, 68, 68, 0.55)",
    outerGlow: "rgba(185, 28, 28, 0.0)",
  },
];

/**
 * 이상한빛(Confuse Ray)의 핵심 광구 렌더러
 * - 중심 본체: 순백 핫스팟 코어를 품은 영롱한 '노란빛' 구체 (항상 노란빛 유지)
 * - 외곽 글로우: 노랑 ➔ 초록 ➔ 빨강 3색이 프레임마다 번갈아 빛남 (원 말고 글로우만)
 * - 반짝이가루/스파클 도트/글린트 없음
 */
export function drawConfuseRayLight(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  colorIndex: number = 0,
  alpha: number = 1.0,
  isBehind: boolean = false,
  glowScale: number = 1.0
) {
  if (alpha <= 0.01 || radius <= 0.5) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const theme = CONFUSE_RAY_GLOWS[Math.abs(Math.floor(colorIndex)) % 3];
  const scale = Math.max(0.35, glowScale ?? 1.0);
  const glowR = radius * 3.6 * scale;

  // 1) 외곽 와이드 앰비언트 글로우 (부드러운 오라 확산 - 커졌다가 작아졌다가 연동)
  const wideGlowGrad = ctx.createRadialGradient(
    x,
    y,
    radius * 0.7,
    x,
    y,
    glowR * 1.25
  );
  wideGlowGrad.addColorStop(0.0, theme.midGlow.replace(/[\d\.]+\)$/, `${Math.min(0.65, 0.45 * scale)})`));
  wideGlowGrad.addColorStop(0.55, theme.midGlow.replace(/[\d\.]+\)$/, `${Math.min(0.30, 0.15 * scale)})`));
  wideGlowGrad.addColorStop(1.0, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = wideGlowGrad;
  ctx.beginPath();
  ctx.arc(x, y, glowR * 1.25, 0, Math.PI * 2);
  ctx.fill();

  // 2) 중심부 선명한 인텐스 글로우 (원 외곽을 감싸는 고채도 번갈아 발광 오라 - 커졌다가 작아졌다가)
  const coreGlowGrad = ctx.createRadialGradient(
    x,
    y,
    radius * 0.30,
    x,
    y,
    glowR
  );
  coreGlowGrad.addColorStop(0.0, theme.innerGlow);
  coreGlowGrad.addColorStop(0.35, theme.midGlow);
  coreGlowGrad.addColorStop(0.70, theme.midGlow.replace(/[\d\.]+\)$/, `${Math.min(0.40, 0.20 * scale)})`));
  coreGlowGrad.addColorStop(1.0, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = coreGlowGrad;
  ctx.beginPath();
  ctx.arc(x, y, glowR, 0, Math.PI * 2);
  ctx.fill();

  // 3) 중심 본체: 흰색 쪽으로 대폭 밝아진 영롱한 연노랑빛 구체 (유저 지침: "노란 구체 좀더 흰색쪽으로")
  const bodyGrad = ctx.createRadialGradient(
    x,
    y,
    0,
    x,
    y,
    radius
  );
  bodyGrad.addColorStop(0.0, "#FFFFF0"); // 화이트에 가까운 은은한 아이보리
  bodyGrad.addColorStop(0.55, "#FEFCE8"); // 밝은 페일 웜 화이트
  bodyGrad.addColorStop(0.85, "#FEF9C3"); // 은은하고 화사한 연노랑
  bodyGrad.addColorStop(1.0, "#FEF08A");  // 부드러운 파스텔 옐로우 림

  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // 외곽 경계 림 (부드러운 연노랑 림)
  ctx.strokeStyle = "#FDE047";
  ctx.lineWidth = 1.0;
  ctx.stroke();

  ctx.restore();
}

/**
 * 상대방 스프라이트 주위를 3D로 빙글빙글 돌며 하강하는 헬퍼 좌표 함수
 * - u: 0.0 (머리 상단) ~ 1.0 (발끝/바닥)
 * - 총 2.0바퀴(720도) 자연스러운 회전 (유저 지침: 꼬리 남기지 말고 프레임 늘려 자연스럽게 감싸 하강)
 * - z: Math.sin(angle) (z < 0: 스프라이트 뒤쪽 레이어, z >= 0: 스프라이트 앞쪽 레이어)
 */
export function getConfuseRaySpiralPoint(
  targetPos: { x: number; y: number },
  u: number
) {
  const clampedU = Math.max(0, Math.min(1.0, u));
  const startY = targetPos.y - 42; // 머리/정수리 위
  const endY = targetPos.y + 20;   // 발끝/지면 접지

  // 총 2.0바퀴 회전: 상대방 좌측(입사 방향)에서 시작하여 뒤 ➔ 앞 ➔ 뒤 ➔ 앞 ➔ 바닥
  const totalRot = Math.PI * 4.0;
  const angle = Math.PI + clampedU * totalRot;

  // 가로 반경: 머리 부근 38px에서 발목 부근으로 내려오며 26px로 부드럽게 수축
  const rx = 38 * (1.0 - 0.28 * clampedU * clampedU);
  const ry = 13; // 3D 원근 시점 타원 세로 반경

  const cx = targetPos.x;
  const cy = startY + (endY - startY) * clampedU;

  const x = cx + Math.cos(angle) * rx;
  const y = cy + Math.sin(angle) * (ry * 0.45);
  const z = Math.sin(angle); // z < 0 : Behind, z >= 0 : Front

  return { x, y, z, angle, u: clampedU, rx };
}

/**
 * 109: 이상한빛 (Confuse Ray) 배후 레이어 렌더러
 * - 전장 배경 암전(Blackout) 오버레이
 * - 상대방 스프라이트 뒤편을 지나는 3D 나선 하강 빛구체 (z < 0, 꼬리 잔상 없이 단일 구체 회전)
 */
export function drawConfuseRayBehindEffect(
  targetCtx: any,
  frameOrPos: any,
  drawCtxOrTarget?: any
) {
  const frame = frameOrPos || {};
  const drawCtx = drawCtxOrTarget || {};
  const tx = drawCtx.targetPos?.x ?? 550;
  const ty = drawCtx.targetPos?.y ?? 180;
  const step = frame.moveStep ?? 1;
  const p = Math.max(0, Math.min(1.0, frame.effectProgress ?? 0.5));
  const dim = frame.dimAlpha ?? 0;
  const colorIdx = frame.lightColorIdx !== undefined ? frame.lightColorIdx : 0;
  const glowScale = frame.glowScale !== undefined ? frame.glowScale : 1.0;

  // 1. 암전 (Blackout) 배경 오버레이 (포켓몬 스프라이트 뒤편 전장 배경 차단)
  if (dim > 0.01) {
    targetCtx.save();
    targetCtx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.85, dim)})`;
    targetCtx.fillRect(-5000, -5000, 12000, 12000);
    targetCtx.restore();
  }

  // 2. Step 3: 상대방 스프라이트 둘레 3D 나선 하강 시 뒤쪽(z < 0) 구간 렌더링 (꼬리 잔상 X - 유저 지침 엄수)
  if (step === 3) {
    const curU = p;
    const targetPos = { x: tx, y: ty };

    // 현재 빛구체 위치가 스프라이트 뒤쪽(z < 0)에 있는 경우에만 렌더링
    const curPt = getConfuseRaySpiralPoint(targetPos, curU);
    if (curPt.z < 0) {
      const lightR = 9.0;
      drawConfuseRayLight(targetCtx, curPt.x, curPt.y, lightR, colorIdx, 0.90, true, glowScale);
    }
  }
}

/**
 * 109: 이상한빛 (Confuse Ray) 전면 레이어 렌더러
 * - Step 1: 시전자 앞 노란/초록/빨강 빛 점화
 * - Step 2: 상대방으로 위아래 흔들리며 날아감 (노랑/초록/빨강 교차 발광 & 꼬리 잔상)
 * - Step 3: 상대방 스프라이트 둘레 3D 나선 하강 시 앞쪽(z >= 0) 구간 렌더링
 * - Step 4: 착란 섬광 파동 및 머리 위 3D 회전 혼란 별무리(★ ★ ★)
 */
export function drawConfuseRayEffect(
  targetCtx: any,
  frameOrPos: any,
  drawCtxOrTarget?: any,
  legacyStep?: number,
  legacyProgress?: number
) {
  let frame = frameOrPos || {};
  let drawCtx = drawCtxOrTarget || {};
  let ax = 200;
  let ay = 300;
  let tx = 550;
  let ty = 180;
  let isP = true;
  let step = 1;
  let p = 0.5;

  if (frameOrPos && typeof frameOrPos.x === "number") {
    ax = frameOrPos.x;
    ay = frameOrPos.y;
    tx = drawCtxOrTarget?.x ?? 550;
    ty = drawCtxOrTarget?.y ?? 180;
    step = legacyStep ?? 1;
    p = Math.max(0, Math.min(1.0, legacyProgress ?? 0.5));
  } else {
    ax = drawCtx.attackerPos?.x ?? 200;
    ay = drawCtx.attackerPos?.y ?? 300;
    tx = drawCtx.targetPos?.x ?? 550;
    ty = drawCtx.targetPos?.y ?? 180;
    isP = Boolean(drawCtx.isPlayer ?? true);
    step = frame.moveStep ?? (legacyStep ?? 1);
    p = Math.max(0, Math.min(1.0, frame.effectProgress ?? (legacyProgress ?? 0.5)));
  }

  const colorIdx = frame.lightColorIdx !== undefined ? frame.lightColorIdx : 0;
  const glowScale = frame.glowScale !== undefined ? frame.glowScale : 1.0;

  targetCtx.save();

  // Step 1: 시전자 앞 빛구체 점화 & 노랑/초록/빨강 펄스
  if (step === 1) {
    const startX = ax + (isP ? 26 : -26);
    const startY = ay - (isP ? 12 : 8);
    const lightR = 5.5 + p * 4.5; // 5.5 -> 10px
    const alpha = Math.min(1.0, p * 1.8);
    drawConfuseRayLight(targetCtx, startX, startY, lightR, colorIdx, alpha, false, glowScale);
  }

  // Step 2: 상대방을 향해 날아감 (위아래 흔들림 비행 + 단일 노란빛 구체 & 번갈아 발광 오라)
  else if (step === 2) {
    const startX = ax + (isP ? 26 : -26);
    const startY = ay - (isP ? 12 : 8);
    const endX = tx - (isP ? 38 : -38); // 상대방 머리 좌측(3D 나선 입사점)
    const endY = ty - 42;

    // 상하 2.0주기 사인파 상하 흔들림: 위 ➔ 아래 ➔ 위 ➔ 아래 ➔ 상대 머리 안착
    const curX = startX + (endX - startX) * p;
    const wobbleY = -Math.sin(p * Math.PI * 4.0) * 26 * (1.0 - 0.20 * p);
    const curY = startY + (endY - startY) * p + wobbleY;

    // 단일 빛구체 (구체 잔상 X - 단 하나의 노란빛 구체만 비행)
    drawConfuseRayLight(targetCtx, curX, curY, 10.5, colorIdx, 1.0, false, glowScale);
  }

  // Step 3: 상대방 스프라이트 둘레 3D 나선 하강 시 앞쪽(z >= 0) 구간 렌더링 (꼬리 잔상 X - 유저 지침 엄수)
  else if (step === 3) {
    const curU = p;
    const targetPos = { x: tx, y: ty };

    // 현재 빛구체 위치가 스프라이트 앞쪽(z >= 0)에 있는 경우에만 렌더링
    const curPt = getConfuseRaySpiralPoint(targetPos, curU);
    if (curPt.z >= 0) {
      const lightR = 10.5;
      drawConfuseRayLight(targetCtx, curPt.x, curPt.y, lightR, colorIdx, 1.0, false, glowScale);
    }
  }

  // Step 4: 착란 파동 펄스 & 머리 위 3D 회전 혼란 별무리(★ ★ ★)
  else if (step === 4) {
    // 1) 바닥 착란 섬광 및 동심원 최면 링
    if (p < 0.45) {
      const ripP = p / 0.45;
      const ripR = 12 + ripP * 34;
      const ripAlpha = (1.0 - ripP) * 0.70;
      targetCtx.save();
      targetCtx.strokeStyle = `rgba(250, 204, 21, ${ripAlpha})`;
      targetCtx.lineWidth = 2.0;
      targetCtx.beginPath();
      targetCtx.ellipse(tx, ty + 16, ripR, ripR * 0.38, 0, 0, Math.PI * 2);
      targetCtx.stroke();

      // 외곽 빨강/초록 교차 최면 링
      targetCtx.strokeStyle = `rgba(239, 68, 68, ${ripAlpha * 0.55})`;
      targetCtx.beginPath();
      targetCtx.ellipse(tx, ty + 16, ripR * 1.15, ripR * 0.44, 0, 0, Math.PI * 2);
      targetCtx.stroke();
      targetCtx.restore();
    }

    // 2) 머리 위 3D 회전 혼란 별무리 (3개)
    const headY = ty - 40;
    const starCount = 3;
    const orbitRx = 24;
    const orbitRy = 9;
    const starRot = p * 8.5;
    const starAlpha = Math.max(0, 1.0 - p * 0.55);

    for (let i = 0; i < starCount; i++) {
      const a = (i / starCount) * Math.PI * 2 + starRot;
      const sx = tx + Math.cos(a) * orbitRx;
      const sy = headY + Math.sin(a) * orbitRy;
      const isFront = Math.sin(a) >= 0;
      const starSize = isFront ? 7.5 : 5.2;
      const sAlpha = (isFront ? starAlpha : starAlpha * 0.65);

      targetCtx.save();
      targetCtx.globalAlpha = sAlpha;
      drawMiniRetroStar(targetCtx, sx, sy, starSize, "#FACC15");
      targetCtx.restore();
    }
  }

  targetCtx.restore();
}

// ============================================================================
// ============================================================================
// 110: 껍질에숨기 (Withdraw)
// ============================================================================

/**
 * 5세대 공식 연출 기반 조개 껍질 상단 반투명 워터 버블 렌더러
 */
export function drawGlossyBubble(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || radius <= 0.5) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  // 1) 반투명 아쿠아 바디 그라데이션
  const bubbleGrad = ctx.createRadialGradient(
    x - radius * 0.35,
    y - radius * 0.35,
    radius * 0.1,
    x,
    y,
    radius
  );
  bubbleGrad.addColorStop(0.0, "rgba(224, 242, 254, 0.90)"); // 내부 투명 순백광
  bubbleGrad.addColorStop(0.40, "rgba(56, 189, 248, 0.65)");  // 청명한 시안 블루
  bubbleGrad.addColorStop(0.85, "rgba(2, 132, 199, 0.80)");  // 깊은 아쿠아 림
  bubbleGrad.addColorStop(1.0, "rgba(3, 105, 161, 0.95)");   // 진한 외곽 림

  ctx.fillStyle = bubbleGrad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // 2) 외곽 또렷한 림 테두리
  ctx.strokeStyle = "#0284C7";
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // 3) 상단 초승달 모양 순백 하이라이트 (Crescent Glint)
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.ellipse(
    x - radius * 0.30,
    y - radius * 0.32,
    radius * 0.38,
    radius * 0.20,
    -Math.PI / 4,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // 4) 우하단 은은한 2차 반사광 점
  ctx.fillStyle = "rgba(255, 255, 255, 0.70)";
  ctx.beginPath();
  ctx.arc(x + radius * 0.32, y + radius * 0.32, radius * 0.14, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 껍질에숨기 3개 물방울 상승 및 점진적 투명화 렌더러
 * - 유저 요청:
 *   1) 2개가 아니라 3개
 *   2) 같은 높이가 아니라 서로 다른 높이 (좌하단 -24px, 우중단 -36px, 중상단 -50px : 26px 단차)
 *   3) 위로 떠오르면서(상승) 점진적으로 투명해짐 (fade-out)
 */
export function drawRisingWithdrawBubbles(
  ctx: any,
  cx: number,
  cy: number,
  riseAmount: number,
  overallAlpha: number
) {
  if (overallAlpha <= 0.01) return;

  // 3개 물방울의 각기 다른 기본 위치(x, baseY)와 크기(radius), 고유 흔들림 위상(phase), 상승속도 가중치
  const bubbleDefs = [
    { x: -18, baseY: -24, r: 6.8, speedMult: 0.95, phase: 0.0, baseAlpha: 1.00 }, // 1. 좌하단 (낮은 고도: base -24px)
    { x:  15, baseY: -36, r: 8.4, speedMult: 1.15, phase: 1.8, baseAlpha: 0.95 }, // 2. 우중단 (중간 고도: base -36px)
    { x:  -3, baseY: -50, r: 5.6, speedMult: 1.35, phase: 3.5, baseAlpha: 0.88 }, // 3. 중상단 (높은 고도: base -50px)
  ];

  for (const b of bubbleDefs) {
    const rise = riseAmount * b.speedMult;
    const sway = Math.sin(rise * 0.16 + b.phase) * 2.2;
    const bx = cx + b.x + sway;
    const by = cy + b.baseY - rise;

    // 위로 올라갈수록 투명해짐: 상승 거리(rise)에 비례하여 알파 감소 (fade-out)
    const heightFade = Math.max(0.12, 1.0 - (rise / 38.0) * 0.72);
    const bubbleAlpha = Math.max(0, Math.min(1.0, overallAlpha * heightFade * b.baseAlpha));

    drawGlossyBubble(ctx, bx, by, b.r, bubbleAlpha);
  }
}


/**
 * 110: 껍질에숨기 (Withdraw) 5세대 공식 보라색 달걀형 조개 껍질 단일 밸브(Valve) 렌더러
 * - 5세대 B/W 공식 인게임 스프라이트 1:1 정밀 컬러 및 줄무늬 매칭:
 *   - 바디 기본색: 부드러운 위스테리아 바이올렛 (#6B52A5 / #7158AB)
 *   - 핵심 줄무늬: 온화하고 밝은 페리윙클-라벤더 (#A59CE7 / #A298E4 / 코어 #C4BCF8)
 *   - 음영 및 굴곡: 차분한 딥 플럼 섀도우 (#4C326F / #593989)
 *   - 외곽 테두리 & 접합선: 짙은 차콜 바이올렛 (#231735 / #1F1A2D)
 * - isRight: true면 우측 껍질(수평 대칭 반전), false면 좌측 껍질
 * - openOffset: 중앙(cx)으로부터의 수평 이격 거리 (0 = 완전 맞물림 닫힘)
 * - angleRad: 개폐 회전각 (0 = 수직 닫힘)
 */
export function drawClamValve(
  ctx: any,
  cx: number,
  cy: number,
  isRight: boolean,
  openOffset: number,
  angleRad: number,
  scale: number = 1.0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  // 회전 중심: 하단 접합부 부근 (cx, cy + 24)
  const hingeY = cy + 24;
  const posX = cx + (isRight ? openOffset : -openOffset);

  ctx.translate(posX, hingeY);
  ctx.rotate(isRight ? angleRad : -angleRad);
  if (isRight) {
    ctx.scale(-1, 1); // 좌측 껍질을 완벽하게 수평 대칭 반전하여 우측 껍질 생성
  }
  ctx.scale(scale, scale);

  // 로컬 좌표계:
  // - 하단 접합부가 (0, 0)
  // - 상단 꼭짓점은 (0, -60)
  // - 닫혔을 때 중앙 접합선은 x = 0 (y: 0 ~ -60)
  // - 껍질 몸체는 x <= 0 (좌측으로 불룩하게 전개)
  // - 유저 요청: 아랫부분이 훨씬 굵은 형태 (하단 최대 반쪽 너비 27.5px, 총 너비 55px!)

  // 1) 껍질 기본 유선형 외형 경로 (하단 팽창 종형/달걀형 실루엣)
  ctx.beginPath();
  ctx.moveTo(0, -1); // 하단 중앙 시작점
  ctx.lineTo(-2, 1); // 하단 중앙 미세 노치(클레프트)

  // 하단 굵직하고 넓은 둥근 베이스
  ctx.bezierCurveTo(-11, 2.5, -21, -2, -26.5, -12);

  // 하단 30% 지점에서 최대 굵기 달성 (x = -28.0px, y = -20)
  ctx.bezierCurveTo(-28.5, -18, -28.0, -26, -24.5, -34);

  // 상단으로 올라가면서 매끄럽고 날렵하게 수축
  ctx.bezierCurveTo(-21, -42, -15.5, -50, -8, -56);

  // 상단 꼭짓점으로 모여드는 둥근 팁
  ctx.bezierCurveTo(-4, -59, -1.5, -60, 0, -60);

  // 중앙 맞물림 접합선 (x = 0)
  ctx.lineTo(0, -1);
  ctx.closePath();

  // 2) 5세대 인게임 추출 1:1 매칭 그라데이션 채우기
  // 수평 그라데이션: 외곽 음영 -> 외곽 림 반사 -> 바디 바이올렛 -> 접합선 음영
  const shellGrad = ctx.createLinearGradient(-28, -20, 0, -20);
  shellGrad.addColorStop(0.00, "#4C326F"); // 외곽 어두운 딥 플럼
  shellGrad.addColorStop(0.18, "#846BBD"); // 외곽 림 소프트 러스터
  shellGrad.addColorStop(0.45, "#6B52A5"); // 원작 핵심 바디 바이올렛
  shellGrad.addColorStop(0.80, "#7962AD"); // 중간 전이톤
  shellGrad.addColorStop(1.00, "#593989"); // 접합선 부근 차분한 그림자

  ctx.fillStyle = shellGrad;
  ctx.fill();

  // 하단 둥근 베이스 묵직한 입체 음영 (수직 방향 부드러운 섀도우)
  const bottomShadowGrad = ctx.createLinearGradient(0, -30, 0, 2);
  bottomShadowGrad.addColorStop(0.0, "rgba(76, 50, 111, 0.0)");
  bottomShadowGrad.addColorStop(0.65, "rgba(76, 50, 111, 0.25)");
  bottomShadowGrad.addColorStop(1.0, "rgba(43, 38, 61, 0.55)");
  ctx.fillStyle = bottomShadowGrad;
  ctx.fill();

  // 3) 줄무늬 렌더링 (원작 인게임과 완벽 일치하는 페리윙클-라벤더 세로 밴드)
  ctx.save();

  // [외곽 림 하이라이트 밴드] 외곽 곡면을 따라 흐르는 은은한 반사광
  ctx.strokeStyle = "#8C7ACA";
  ctx.lineWidth = 2.0;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.moveTo(-1, -57);
  ctx.bezierCurveTo(-14, -50, -25, -34, -24, -18);
  ctx.bezierCurveTo(-23, -8, -16, 0, -4, 0);
  ctx.stroke();

  // [메인 핵심 줄무늬 - #A59CE7] 원작 스크린샷에서 가장 또렷한 넓은 페리윙클 밴드
  // 1차 소프트 확산광 (#9484D6)
  ctx.strokeStyle = "#9484D6";
  ctx.lineWidth = 5.2;
  ctx.globalAlpha = 0.50;
  ctx.beginPath();
  ctx.moveTo(0, -58);
  ctx.bezierCurveTo(-12, -50, -20, -32, -17, -15);
  ctx.bezierCurveTo(-15, -7, -8, 0, 0, 0);
  ctx.stroke();

  // 2차 선명한 메인 밴드 (#A59CE7)
  ctx.strokeStyle = "#A59CE7";
  ctx.lineWidth = 3.6;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(0, -58);
  ctx.bezierCurveTo(-12, -50, -20, -32, -17, -15);
  ctx.bezierCurveTo(-15, -7, -8, 0, 0, 0);
  ctx.stroke();

  // 3차 정수리-상반신 코어 하이라이트 (#C4BCF8)
  ctx.strokeStyle = "#C4BCF8";
  ctx.lineWidth = 1.6;
  ctx.globalAlpha = 0.90;
  ctx.beginPath();
  ctx.moveTo(0, -58);
  ctx.bezierCurveTo(-10, -50, -18, -34, -16, -20);
  ctx.stroke();

  // [보조 내부 줄무늬 - #9E93E0] 메인 줄무늬와 접합선 사이의 2차 세로 밴드
  ctx.strokeStyle = "#9E93E0";
  ctx.lineWidth = 2.4;
  ctx.globalAlpha = 0.65;
  ctx.beginPath();
  ctx.moveTo(0, -58);
  ctx.bezierCurveTo(-7, -46, -11, -28, -9, -12);
  ctx.bezierCurveTo(-8, -5, -4, 0, 0, 0);
  ctx.stroke();

  // 두 줄무늬 사이의 자연스러운 깊이 음영선 (유저 요청: 일반 껍질색에 가깝게 조정)
  ctx.strokeStyle = "rgba(98, 75, 150, 0.40)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -58);
  ctx.bezierCurveTo(-9.5, -48, -15, -30, -13, -13);
  ctx.stroke();

  ctx.restore();

  // 4) 외곽 테두리선 (유저 요청: 껍질 일반색 #6B52A5에 자연스럽게 가깝도록 #5E4792 적용)
  ctx.strokeStyle = "#5E4792";
  ctx.lineWidth = 2.4;
  ctx.stroke();

  ctx.restore();
}

/**
 * 껍질에숨기 좌우 조개 껍질 결합 렌더러
 */
export function drawClamBivalveShell(
  ctx: any,
  cx: number,
  cy: number,
  openDist: number,
  openAngle: number,
  alpha: number = 1.0,
  scale: number = 1.0
) {
  if (alpha <= 0.01) return;
  // 좌측 껍질
  drawClamValve(ctx, cx, cy, false, openDist, openAngle, scale, alpha);
  // 우측 껍질
  drawClamValve(ctx, cx, cy, true, openDist, openAngle, scale, alpha);

  // 완전히 닫혔을 때 중앙 세로 접합선 (유저 요청: 맞닿는 면은 어두운 음영선 #36224E으로 렌더링)
  if (openDist < 1.0 && Math.abs(openAngle) < 0.02) {
    ctx.save();
    ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;
    ctx.strokeStyle = "#36224E";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 36);
    ctx.lineTo(cx, cy + 24);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * 110: 껍질에숨기 (Withdraw) 이펙트 렌더러 (5세대 공식 연출 기반)
 * - Step 1: 시전자 웅크림 & 양쪽 외곽에서 보라색 조개 껍질 출현 (Open)
 * - Step 2: 조개 껍질이 안쪽으로 빠르게 좁혀오며 닫히는 중 (Closing)
 * - Step 3: [딱! 맞물려 닫힘] 중앙 어두운 접합선 맞물림 & 상단 물방울 3개 출현
 * - Step 4: 굳건히 닫힌 조개 껍질 표면 칭!(Tink!) 경질화 글린트 & 물방울 상승 및 투명화
 * - Step 5: 조개 껍질 살짝 열리며 물빛 에너지로 승화 해제, 물방울 상공 부유 소멸 & 시전자 기상
 */
export function drawWithdrawEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0.5
) {
  ctx.save();
  const cx = attackerPos.x;
  const cy = attackerPos.y + 4;

  // Step 1: 시전자 웅크림 & 양쪽 조개 껍질 출현 (열림)
  if (moveStep === 1) {
    const p = effectProgress;
    // 양쪽 외곽에서 열린 상태로 나타나는 보라색 조개 껍질 (openDist: 48px, angle: 22도)
    const shellAlpha = Math.min(1.0, p * 2.5);
    drawClamBivalveShell(ctx, cx, cy, 48, 22 * (Math.PI / 180), shellAlpha);
  }

  // Step 2: 조개 껍질이 안쪽으로 빠르게 좁혀오며 닫히는 중
  else if (moveStep === 2) {
    const p = effectProgress;
    // 이격 거리 48px -> 14px 급속 축소, 각도 22도 -> 6도
    const openDist = 48 * (1.0 - p * 0.72);
    const openAngle = (22 * (1.0 - p * 0.72)) * (Math.PI / 180);

    // 좌우 추진 속도선 (Water rush trails)
    ctx.save();
    ctx.strokeStyle = "rgba(165, 156, 231, 0.65)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cx - openDist - 22, cy - 8);
    ctx.lineTo(cx - openDist - 6, cy - 8);
    ctx.moveTo(cx - openDist - 18, cy + 6);
    ctx.lineTo(cx - openDist - 4, cy + 6);

    ctx.moveTo(cx + openDist + 22, cy - 8);
    ctx.lineTo(cx + openDist + 6, cy - 8);
    ctx.moveTo(cx + openDist + 18, cy + 6);
    ctx.lineTo(cx + openDist + 4, cy + 6);
    ctx.stroke();
    ctx.restore();

    drawClamBivalveShell(ctx, cx, cy, openDist, openAngle, 0.95);
  }

  // Step 3: [딱! 맞물려 닫힘] 중앙에서 완전 합체 & 시전자 껍질 내부 숨기 & 상단 물방울 출현
  else if (moveStep === 3) {
    const p = effectProgress;

    // 완전히 닫힌 5세대 보라색 달걀형 조개 껍질 (openDist = 0, angle = 0)
    drawClamBivalveShell(ctx, cx, cy, 0, 0, 1.0);

    // 전반부 (p < 0.5): 딱! 닫히는 순간 껍질 맞물림 & 어두운 접합선 & 상단 물방울 3개 생성 (흰색 섬광선 제거)
    if (p < 0.5) {
      const snapP = p / 0.5;

      // 1) 상단 3개 물방울 생성 및 상승 시작 (서로 다른 높이)
      const rise = snapP * 5;
      const bAlpha = Math.min(1.0, snapP * 2.2);
      drawRisingWithdrawBubbles(ctx, cx, cy, rise, bAlpha);

      // 2) 주변 스플래시 물방울 (6개)
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const dist = 10 + snapP * 22;
        const bx = cx + Math.cos(ang) * dist;
        const by = cy - 6 + Math.sin(ang) * (dist * 0.6);
        ctx.save();
        ctx.fillStyle = (i % 2 === 0) ? "#E0F2FE" : "#38BDF8";
        ctx.globalAlpha = Math.max(0, 1.0 - snapP);
        ctx.beginPath();
        ctx.arc(bx, by, 2.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 후반부 (p >= 0.5): 굳건히 닫힌 조개 껍질 표면에 단단한 경질화 반짝임 (칭! Tink!) & 물방울 부유
    else {
      const glintP = (p - 0.5) / 0.5;
      const glintScale = Math.sin(Math.min(1.0, glintP * 1.8) * Math.PI);

      // 상단 3개 물방울 위로 더 높이 상승하며 은은하게 반투명화 진행
      const rise = 6 + glintP * 14;
      const bAlpha = Math.max(0.2, 0.85 - glintP * 0.35);
      drawRisingWithdrawBubbles(ctx, cx, cy, rise, bAlpha);

      // 다이아몬드 별빛 글린트 3개 (중앙, 좌상단, 우상단)
      drawHardnessGlint(ctx, cx, cy - 10, 10.0 * glintScale, "#FFFFFF", 1.0);
      drawHardnessGlint(ctx, cx - 14, cy - 16, 7.5 * glintScale, "#EDE9FE", 1.0);
      drawHardnessGlint(ctx, cx + 14, cy - 14, 7.0 * glintScale, "#C4BCF8", 1.0);

      // 껍질에서 튕겨나가는 물방울 파티클 (8개)
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const dist = 22 + glintP * 26 + (i % 3) * 5;
        const wx = cx + Math.cos(a) * dist;
        const wy = cy - 6 + Math.sin(a) * (dist * 0.7);

        ctx.save();
        ctx.fillStyle = (i % 2 === 0) ? "#38BDF8" : "#CFFAFE";
        ctx.globalAlpha = Math.max(0, 1.0 - glintP * 0.9);
        ctx.beginPath();
        ctx.arc(wx, wy, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // Step 4: 조개 껍질 살짝 열리며 물빛 에너지로 승화 해제 & 물방울 상승 소멸 & 시전자 기상
  else if (moveStep === 4) {
    const p = effectProgress;
    const openDist = 18 * p;
    const openAngle = 10 * p * (Math.PI / 180);
    const alpha = Math.max(0, 1.0 - p * 1.5);

    drawClamBivalveShell(ctx, cx, cy, openDist, openAngle, alpha);

    // 상단 3개 물방울이 위로 둥실 떠오르며 완전히 투명하게 승화 소멸
    const rise = 22 + p * 16;
    const bAlpha = Math.max(0, 0.45 * (1.0 - p * 1.2));
    drawRisingWithdrawBubbles(ctx, cx, cy, rise, bAlpha);
  }

  ctx.restore();
}

// ============================================================================
// 111: 웅크리기 (Defense Curl)
// ============================================================================

/**
 * 111: 웅크리기 (Defense Curl) 이펙트 렌더러
 * - Step 1: 시전자 공 형태로 웅크림 & 4가닥 나선 수축 라인
 * - Step 2: 완벽한 원형 황금빛 보호 에너지 구체 쉘 고정
/**
 * 111: 웅크리기 (Defense Curl) 파란색 공 렌더러
 * - 유저 요청:
 *   1) 조금 큰 동그라미가 빠르게 줄어들면서 페이드인, 선명해짐 (밝은 블루)
 *   2) 짙은 파랑으로 변하면서 페이드아웃 (네이비/미드나잇 블루)
 */
export function drawDefenseCurlBlueSphere(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  colorProg: number, // 0.0: 선명한 밝은 파랑, 1.0: 짙은 네이비 파랑
  alpha: number
) {
  if (alpha <= 0.01 || radius <= 1.0) return;

  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;

  const cp = Math.max(0, Math.min(1.0, colorProg));

  // 색상 보간: 밝은 파랑 (0.0) ➔ 짙은 파랑 (1.0)
  // 1) 코어 내부: 순백에 가까운 아쿠아 화이트 -> 짙은 로얄블루
  const cInnerR = Math.round(224 + (29 - 224) * cp);
  const cInnerG = Math.round(242 + (78 - 242) * cp);
  const cInnerB = Math.round(254 + (216 - 254) * cp);

  // 2) 바디 주 색상: 청명한 시안-스카이(#38BDF8) -> 짙은 네이비 블루(#1E3A8A)
  const cMidR = Math.round(56 + (30 - 56) * cp);
  const cMidG = Math.round(189 + (58 - 189) * cp);
  const cMidB = Math.round(248 + (138 - 248) * cp);

  // 3) 외곽 림: 딥 아쿠아(#0284C7) -> 짙은 미드나잇 블루(#172554)
  const cOuterR = Math.round(2 + (23 - 2) * cp);
  const cOuterG = Math.round(132 + (37 - 132) * cp);
  const cOuterB = Math.round(199 + (84 - 199) * cp);

  // 4) 외곽선: #0369A1 -> #0F172A
  const cStrokeR = Math.round(3 + (15 - 3) * cp);
  const cStrokeG = Math.round(105 + (23 - 105) * cp);
  const cStrokeB = Math.round(161 + (42 - 161) * cp);

  // 1. 방사형 외곽 부드러운 오라
  const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.7, cx, cy, radius * 1.35);
  glowGrad.addColorStop(0.0, `rgba(${cMidR}, ${cMidG}, ${cMidB}, 0.35)`);
  glowGrad.addColorStop(1.0, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.35, 0, Math.PI * 2);
  ctx.fill();

  // 2. 구체 본체 라디얼 그라데이션
  const bodyGrad = ctx.createRadialGradient(
    cx - radius * 0.28,
    cy - radius * 0.28,
    radius * 0.08,
    cx,
    cy,
    radius
  );
  bodyGrad.addColorStop(0.00, `rgba(${cInnerR}, ${cInnerG}, ${cInnerB}, 0.95)`);
  bodyGrad.addColorStop(0.45, `rgba(${cMidR}, ${cMidG}, ${cMidB}, 0.85)`);
  bodyGrad.addColorStop(0.85, `rgba(${cOuterR}, ${cOuterG}, ${cOuterB}, 0.90)`);
  bodyGrad.addColorStop(1.00, `rgba(${cStrokeR}, ${cStrokeG}, ${cStrokeB}, 0.98)`);

  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // 3. 선명한 외곽 테두리 림
  ctx.strokeStyle = `rgb(${cStrokeR}, ${cStrokeG}, ${cStrokeB})`;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // 4. 상단 원형 하이라이트 (유저 피드백: "하이라이트 흰색 동그라미 타원형이아니라 원형으로")
  if (cp < 0.75) {
    const hlAlpha = (1.0 - cp / 0.75) * 0.88;
    const hx = cx - radius * 0.28;
    const hy = cy - radius * 0.28;
    const hlR = radius * 0.22; // 완벽한 원형 하이라이트

    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${hlAlpha})`;
    ctx.beginPath();
    ctx.arc(hx, hy, hlR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 웅크리기 3D 회전 감싸기 선 렌더러
 * - 유저 요청:
/**
 * 웅크리기 2D 회전 감싸기 선 렌더러
 * - 유저 피드백 반영:
 *   1) 2D 평면 원형 회전선
 *   2) 2겹 (안쪽은 왼쪽(반시계), 바깥쪽은 오른쪽(시계)으로 회전)
 *   3) 원을 완전히 감쌈 (arcLength: ~1.90π)
 *   4) 두께감 있는 리본 (11.4px, 13.2px)
 *   5) 앞부분 반투명하게 (alpha: ~0.50), 뒤쪽은 완전 투명(0.0)
 *   6) RADIUS 0: 앞부분 둥근 팁(원형 캡) 완전 제거, lineCap = "butt" (반경 0)
 */
export function draw2DOrbitWrapLine(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  rotAngle: number,
  dir: number, // +1: 오른쪽(시계방향), -1: 왼쪽(반시계방향)
  arcLength: number,
  lineWidth: number,
  baseAlpha: number
) {
  if (baseAlpha <= 0.01 || radius <= 1.0) return;

  ctx.save();
  // 유저 피드백: RADIUS 0 -> 둥근 캡(round) 제거하고 플랫 캡(butt, radius 0) 적용
  ctx.lineCap = "butt";

  // 세그먼트 분할: 꼬리(t=0, 투명 0.0)부터 머리(t=1, 은은한 반투명 0.50)까지 매끄러운 2D 원호 렌더링
  const steps = 60;
  const overlap = (arcLength / steps) * 0.15; // 세그먼트 간 미세 오버랩으로 틈새 방지

  for (let i = 0; i < steps; i++) {
    const t1 = i / steps;
    const t2 = (i + 1) / steps;

    // t=0(뒤쪽 꼬리)은 투명(0.0), t=1(앞쪽 머리)은 반투명(0.50)
    const segT = (t1 + t2) * 0.5;
    // 유저 피드백: 앞부분 반투명하게 -> 최대 알파 약 0.50으로 부드럽게 조정
    const segAlpha = baseAlpha * 0.52 * Math.pow(segT, 1.25);
    if (segAlpha <= 0.01) continue;

    // 회전 방향에 따른 세그먼트 각도 계산 (t=1이 항상 회전의 앞쪽)
    let a1: number, a2: number;
    if (dir >= 0) {
      a1 = rotAngle - arcLength * (1.0 - t1) - (i > 0 ? overlap : 0);
      a2 = rotAngle - arcLength * (1.0 - t2);
    } else {
      a1 = rotAngle + arcLength * (1.0 - t1) + (i > 0 ? overlap : 0);
      a2 = rotAngle + arcLength * (1.0 - t2);
    }

    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${segAlpha})`;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, a1, a2, dir < 0);
    ctx.stroke();
    ctx.restore();
  }

  // 유저 피드백: RADIUSE 0 -> 앞부분 둥근 원(radius) 팁 완전 제거!

  ctx.restore();
}

/**
 * 111: 웅크리기 (Defense Curl) 이펙트 렌더러
 * - Step 1: 시전자 수축 웅크림 & 큰 파란색 공이 빠르게 줄어들며 선명화
 * - Step 2: 짙은 파랑으로 변하면서 페이드아웃 & 2겹 2D 흰색 회전선 (안쪽 좌회전, 바깥쪽 우회전, 앞쪽 반투명/뒤쪽 투명)
 * - Step 3: 구체 및 회전선 완전 승화 소멸 & 시전자 복귀
 */
export function drawDefenseCurlEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0.5
) {
  ctx.save();
  const cx = attackerPos.x;
  // 유저 피드백: "동그란 원이 살짝 아래로 내려가는데?" -> +4 제거하고 -2로 상향 보정하여 포켓몬 몸통 중앙에 완벽 정렬
  const cy = attackerPos.y - 2;

  // Step 1: 파란색 공 빠른 페이드인 & 수축 & 선명화
  if (moveStep === 1) {
    const p = effectProgress;
    // 조금 큰 동그라미(38px)에서 빠르게 기본 크기(27px)로 수축
    const r = 38 * (1.0 - p * 0.29); // 38px -> 27px
    // 빠른 페이드인 (p=0.4일 때 이미 0.95 도달)
    const alpha = Math.min(1.0, p * 2.5);
    // 선명한 밝은 파랑 (colorProg: 0.0)
    drawDefenseCurlBlueSphere(ctx, cx, cy, r, 0.0, alpha);
  }

  // Step 2: 짙은 파랑으로 변하면서 한 바퀴 회전 & 돌기 후반즈음 커지면서 페이드아웃
  else if (moveStep === 2) {
    const p = effectProgress;
    const baseR = 27;

    // 유저 피드백: "동그라미 회전선은 한바퀴 돌고 돌기 후반즈음 커지면서 페이드아웃"
    // 1) 회전량: 정확히 한 바퀴 (2π rad, 360도)!
    const totalRotation = p * Math.PI * 2.0;
    const innerRot = -Math.PI - totalRotation; // 좌(9시)에서 출발하여 반시계 1바퀴 완주
    const outerRot = 0.0 + totalRotation;      // 우(3시)에서 출발하여 시계 1바퀴 완주

    // 2) 돌기 후반즈음(p >= 0.55) 커지면서 페이드아웃
    const expandStart = 0.55;
    let expandScale = 1.0;
    let lineAlpha = 0.95;
    let ballAlpha = Math.max(0.18, 1.0 - p * 0.70);
    let ballScale = 1.0;

    if (p < 0.15) {
      lineAlpha = 0.92;
    } else if (p >= expandStart) {
      const ep = (p - expandStart) / (1.0 - expandStart); // 0.0 -> 1.0
      // 후반부 반경이 부드럽게 1.0 -> 1.42배로 커짐 (확산 팽창)
      expandScale = 1.0 + Math.pow(ep, 1.2) * 0.42;
      ballScale = 1.0 + Math.pow(ep, 1.2) * 0.32;
      // 커지면서 알파가 0으로 사르르 페이드아웃
      lineAlpha = Math.max(0, 0.95 * (1.0 - Math.pow(ep, 0.95)));
      ballAlpha = Math.max(0, ballAlpha * (1.0 - Math.pow(ep, 0.95)));
    }

    // 파란색 공: 짙은 파랑 변색 & 후반부 커지면서 페이드아웃
    const colorProg = Math.min(1.0, p * 1.25);
    drawDefenseCurlBlueSphere(ctx, cx, cy, baseR * ballScale, colorProg, ballAlpha);

    // 안쪽 2D 회전선: 기본 29.5px * expandScale (두께 11.4px)
    draw2DOrbitWrapLine(ctx, cx, cy, 29.5 * expandScale, innerRot, -1, Math.PI * 1.90, 11.4 * (1.0 + (expandScale - 1.0) * 0.3), lineAlpha);

    // 바깥쪽 2D 회전선: 기본 38.5px * expandScale (두께 13.2px)
    draw2DOrbitWrapLine(ctx, cx, cy, 38.5 * expandScale, outerRot, +1, Math.PI * 1.90, 13.2 * (1.0 + (expandScale - 1.0) * 0.3), lineAlpha);
  }

  // Step 3: 공과 회전선 최종 소멸 (완전 팽창 & 투명 소멸) & 시전자 기상 복귀
  else if (moveStep === 3) {
    const p = effectProgress;
    const alpha = Math.max(0, 0.28 * (1.0 - p * 1.6));

    if (alpha > 0.01) {
      const expandScale = 1.42 + p * 0.25;
      const ballScale = 1.32 + p * 0.20;
      drawDefenseCurlBlueSphere(ctx, cx, cy, 27 * ballScale, 1.0, alpha);
      const endRot = Math.PI * 2.0 + p * (Math.PI * 0.20);
      const endInnerRot = -Math.PI - endRot;
      const endOuterRot = 0.0 + endRot;
      draw2DOrbitWrapLine(ctx, cx, cy, 29.5 * expandScale, endInnerRot, -1, Math.PI * 1.90, 11.4, alpha * 2.0);
      draw2DOrbitWrapLine(ctx, cx, cy, 38.5 * expandScale, endOuterRot, +1, Math.PI * 1.90, 13.2, alpha * 2.0);
    }
  }

  ctx.restore();
}

// ============================================================================
// 112: 배리어 (Barrier)
// ============================================================================

/**
 * 대칭 단색 순백 십자별 (Cross Star Sparkle)
 */
function drawBarrierCrossStar(
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
 * 배리어 사선 반사 하이라이트 (단단해지기 스타일 순백 듀얼 스트라이프)
 */
function drawBarrierReflectStripes(
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
  const W = Math.max(10, Math.round(refDim * 0.20)); // 메인 굵은 스트라이프 폭
  const H = W / 2;
  const L = refDim * 2.6;

  const W_thin = Math.max(3, Math.round(W * 0.28));  // 보조 얇은 스트라이프 폭
  const gap = Math.max(4, Math.round(W * 0.38));
  const thinShift = shiftOffset - H - gap - W_thin / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;

  // 메인 스트라이프
  ctx.fillRect(-L / 2, shiftOffset - H, L, W);
  // 좌상단 얇은 스트라이프
  ctx.fillRect(-L / 2, thinShift - W_thin / 2, L, W_thin);

  ctx.restore();
}

/**
 * 112: 배리어 (Barrier) 이펙트 렌더러
 * - Step 1: 스프라이트 위쪽에서 단색 순백 십자별 번쩍임
 * - Step 2: 십자별 위치에서 가로로 넓어지는 선 형성 (좌우 동시 확장)
 * - Step 3: 가로선 양 끝에서 아래로 수직 하강하는 세로선 형성 (양쪽 동시)
 * - Step 4: 양 하단에서 안쪽(중앙)으로 가로선이 뻗어오며 완벽한 사각형 형성 & 결합 번쩍
 * - Step 5: 사각형 중간에 반투명 색상 채움 + 사선 반사 하이라이트 번쩍 (단단해지기 참고)
 * - Step 6: 완성 후 반투명 배경색 전환 (보라빛 2프레임 ➔ 푸른빛 2프레임) & 반사면 유지 & 꼭짓점 순회 반짝임 (2프레임씩)
 * - Step 7: 배리어 유지 및 자연스러운 페이드아웃
 */
export function drawBarrierEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0.5
) {
  ctx.save();
  const cx = attackerPos.x;
  const cy = attackerPos.y - 2;

  // 사각형 규격 (가로 62px, 세로 66px - 포켓몬 스프라이트 전면 감싸기)
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
    drawBarrierCrossStar(ctx, cx, topY, starSize, "#FFFFFF");

    // 중심 은은한 순백 글로우
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.sin(p * Math.PI) * 0.4})`;
    ctx.beginPath();
    ctx.arc(cx, topY, starSize * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Step 2: 가로로 넓어지는 선이 생김 (좌우 동시 확장)
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

    // 양 끝 전진 팁 십자별
    const tipSize = 8;
    drawBarrierCrossStar(ctx, cx - curHW, topY, tipSize, "#FFFFFF");
    drawBarrierCrossStar(ctx, cx + curHW, topY, tipSize, "#FFFFFF");
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

    // 양 하단 전진 팁 십자별
    const tipSize = 8;
    drawBarrierCrossStar(ctx, leftX, topY + curH, tipSize, "#FFFFFF");
    drawBarrierCrossStar(ctx, rightX, topY + curH, tipSize, "#FFFFFF");
    ctx.restore();
  }

  // Step 4: 다시 가로로 안쪽으로 길어지면서 사각형을 만듦
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

    // 중앙 결합 순간(p >= 0.85) 번쩍임
    if (p >= 0.85) {
      const sparkP = (p - 0.85) / 0.15;
      const sparkSize = Math.sin(sparkP * Math.PI) * 16;
      drawBarrierCrossStar(ctx, cx, bottomY, sparkSize, "#FFFFFF");
    } else {
      const tipSize = 7;
      drawBarrierCrossStar(ctx, leftX + curInW, bottomY, tipSize, "#FFFFFF");
      drawBarrierCrossStar(ctx, rightX - curInW, bottomY, tipSize, "#FFFFFF");
    }
    ctx.restore();
  }

  // Step 5: 사각형 중간에 반투명 색상 + 반사 하이라이트 번쩍 (단단해지기 참고)
  else if (moveStep === 5) {
    const p = effectProgress;

    ctx.save();

    // 1) 사각형 내부 클리핑
    ctx.save();
    ctx.beginPath();
    ctx.rect(leftX, topY, rectW, rectH);
    ctx.clip();

    // 2) 반투명 색상 채움 (에스퍼 크리스탈 핑크/바이올렛)
    ctx.fillStyle = "rgba(232, 121, 249, 0.30)";
    ctx.fillRect(leftX, topY, rectW, rectH);
    ctx.fillStyle = "rgba(56, 189, 248, 0.12)";
    ctx.fillRect(leftX, topY, rectW, rectH);

    // 3) 단단해지기 스타일 순백 사선 반사 하이라이트 번쩍 스위프!
    const refDim = Math.max(rectW, rectH);
    const shift = (-0.8 + p * 1.6) * refDim;
    drawBarrierReflectStripes(ctx, cx, cy, rectW, rectH, shift, 0.95);

    ctx.restore(); // clip 해제

    // 4) 순백 사각형 외곽 테두리 (선명하게 유지)
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(leftX, topY, rectW, rectH);

    // 5) 우측 상단 모서리 Tink! 십자별 글린트
    const glintSize = Math.sin(Math.min(1.0, p * 1.6) * Math.PI) * 14;
    drawBarrierCrossStar(ctx, rightX, topY, glintSize, "#FFFFFF");

    ctx.restore();
  }

  // Step 6: 배리어 완성 후 - 반투명 배경색 전환 (보라빛 2프레임 ➔ 푸른빛 2프레임) & 반사면 유지 & 꼭짓점 순회 반짝임 (2프레임씩)
  else if (moveStep === 6) {
    const p = effectProgress;

    // 4개 꼭짓점 인덱스 (0: 좌상단, 1: 우상단, 2: 우하단, 3: 좌하단)
    const cornerIdx = Math.min(3, Math.floor(p * 4));
    // 꼭짓점 내 2프레임 진행도 (0.0 ~ 1.0)
    const subP = (p * 4) - cornerIdx;

    // 배경색: 0, 2번 꼭짓점 구간(보라빛 2프레임), 1, 3번 꼭짓점 구간(푸른빛 2프레임)
    const isPurple = (cornerIdx % 2 === 0);

    ctx.save();

    // 1) 사각형 내부 클리핑
    ctx.save();
    ctx.beginPath();
    ctx.rect(leftX, topY, rectW, rectH);
    ctx.clip();

    // 2) 반투명 배경색 (보라빛 2프레임 ➔ 푸른빛 2프레임)
    if (isPurple) {
      // 살짝 보라빛 (Violet / Light Purple)
      ctx.fillStyle = "rgba(192, 132, 252, 0.32)";
      ctx.fillRect(leftX, topY, rectW, rectH);
      ctx.fillStyle = "rgba(147, 51, 234, 0.10)";
      ctx.fillRect(leftX, topY, rectW, rectH);
    } else {
      // 다시 푸른빛 (Cyan / Soft Blue)
      ctx.fillStyle = "rgba(56, 189, 248, 0.30)";
      ctx.fillRect(leftX, topY, rectW, rectH);
      ctx.fillStyle = "rgba(59, 130, 246, 0.10)";
      ctx.fillRect(leftX, topY, rectW, rectH);
    }

    // 3) [유저 요청] 반짝거리던 반사면 유지!
    drawBarrierReflectStripes(ctx, cx, cy, rectW, rectH, 0, 0.85);

    ctx.restore(); // clip 해제

    // 4) 순백 사각형 테두리
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(leftX, topY, rectW, rectH);

    // 5) 현재 꼭짓점 좌표 계산 (왼쪽꼭짓점인 좌상단부터 시계방향 순회)
    let cornerX = leftX;
    let cornerY = topY;
    if (cornerIdx === 0) {
      cornerX = leftX;
      cornerY = topY;
    } else if (cornerIdx === 1) {
      cornerX = rightX;
      cornerY = topY;
    } else if (cornerIdx === 2) {
      cornerX = rightX;
      cornerY = bottomY;
    } else if (cornerIdx === 3) {
      cornerX = leftX;
      cornerY = bottomY;
    }

    // 6) [유저 요청] 애니메이션에 사용된 순수 단색 십자별 그대로 사용 (원형 글로우 / 파티클 잡음 완전 제거)
    // 2프레임 주기: 1프레임(13px) -> 2프레임(19px 피크 번쩍!)
    const starSize = (subP < 0.5) ? 13 : 19;
    drawBarrierCrossStar(ctx, cornerX, cornerY, starSize, "#FFFFFF");

    ctx.restore();
  }

  // Step 7: 배리어 페이드아웃 (반사면과 배경색 함께 페이드아웃)
  else if (moveStep === 7) {
    const p = effectProgress;
    const alpha = Math.max(0, 1.0 - p);

    ctx.save();
    ctx.globalAlpha = alpha;

    // 사각형 내부 클리핑 후 배경 및 반사면 페이드아웃
    ctx.save();
    ctx.beginPath();
    ctx.rect(leftX, topY, rectW, rectH);
    ctx.clip();

    ctx.fillStyle = "rgba(56, 189, 248, 0.28)";
    ctx.fillRect(leftX, topY, rectW, rectH);
    drawBarrierReflectStripes(ctx, cx, cy, rectW, rectH, 0, 0.70);

    ctx.restore();

    // 외곽 테두리
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(leftX, topY, rectW, rectH);

    ctx.restore();
  }

  ctx.restore();
}
