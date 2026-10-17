// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawFakeOutHand, getTargetSpriteCenter } from "./move249_252.js";
import { drawMiniRetroStar } from "../common/helpers.js";
import {
  drawTriAttackBehindEffect,
  drawTriAttackEffect,
} from "./move161_164.js";
import { createLightningPoints } from "./move085_088.js";

// ============================================================================
// 🧂 265: 정신차리기 (Smelling Salts / きつけ) - 노말 타입 물리 공격 기술
//
// 위력: 70 (마비 상태의 상대에게는 2배인 140) / 명중: 100 / PP: 10 / 접촉: O
// 설명: 마비 상태의 상대에게는 위력이 2배가 되지만 대신 상대의 마비가 풀린다.
//
// [유저 요구사항 100% 완벽 반영]:
// "정신차리기의 경우에는 속이기 기술 그대로 사용하되 이펙트 노랑에 점파티클 주황"
//
// 1. [속이기 모션 100% 계승]:
//    - 양쪽에 90도 직립 태권당수 손(손바닥 흰색) 배치
//    - 부드러운 2회 유선형 상하 교차 운동 (왼쪽이 위면 오른쪽은 아래)
//    - 위에서 아래로 내려치며 박수 맞닿음 (5개 슬라이스 분리 & 안쪽부터 얇아짐)
// 2. [이펙트 노랑]:
//    - 중심 100% 완전 투명한 8각 만화풍 노란색 스타버스트 (drawSmellingSaltsYellowSharpImpact)
//    - 중심을 비워둔 2줄의 노란색 모멘텀 스피드선 (drawSmellingSaltsYellowMomentumStreaks)
// 3. [점파티클 주황]:
//    - 맞닿는 순간 사방으로 폭발적으로 비산하는 주황색 발광 구체 알갱이 및 스피드 스트릭 (drawSmellingSaltsOrangeDotParticles)
// ============================================================================

/**
 * 💥 1. 중심 100% 완전 투명한 8각 만화풍 노란색 스타버스트 (Yellow Sharp Comic Impact Starburst)
 * - 중심(0.0 ~ 0.50): 100% 완전 투명 홀 유지
 * - 외곽: 따뜻하고 강렬한 골든 옐로우 ➔ 일렉트릭 브라이트 옐로우 ➔ 레몬빛 화사한 림
 */
function drawSmellingSaltsYellowSharpImpact(
  ctx: any,
  cx: number,
  cy: number,
  progress: number
) {
  if (progress > 0.75) return;
  const alpha = Math.max(0, 1.0 - progress / 0.75);
  const outerR = 18 + progress * 24;
  const innerR = outerR * 0.44;
  const points = 8;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(progress * 0.35);

  // [중심 100% 완전 투명한 노란색 그라데이션 필]
  const starGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, outerR);
  starGrad.addColorStop(0.00, "rgba(234, 179, 8, 0.0)"); // 중심 0% ~ 50%: 100% 완전 투명!
  starGrad.addColorStop(0.50, "rgba(234, 179, 8, 0.0)"); // 투명 홀 유지
  starGrad.addColorStop(0.75, `rgba(234, 179, 8, ${0.85 * alpha})`); // 골든 옐로우 바디 (#EAB308)
  starGrad.addColorStop(0.92, `rgba(250, 204, 21, ${0.95 * alpha})`); // 일렉트릭 브라이트 옐로우 (#FACC15)
  starGrad.addColorStop(1.00, `rgba(254, 240, 138, ${0.90 * alpha})`); // 레몬빛 화사한 림 (#FEF08A)

  ctx.fillStyle = starGrad;
  ctx.strokeStyle = `rgba(254, 240, 138, ${0.95 * alpha})`; // 선명한 외곽 림
  ctx.lineWidth = 2.2;
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
 * 💨 2. 충돌 관통 모멘텀 노란 스피드 속도선 (Yellow Momentum Streaks)
 * - [중심 투명 유지]: 중앙(oy=0)을 비워두고 상하(oy=±18)로 2줄 배치하여 중심 100% 투명 보장
 */
function drawSmellingSaltsYellowMomentumStreaks(
  ctx: any,
  cx: number,
  cy: number,
  progress: number
) {
  if (progress > 0.65) return;
  const alpha = Math.max(0, 1.0 - progress / 0.65);
  const streakOffsetsY = [-18, 18];

  ctx.save();
  for (let i = 0; i < streakOffsetsY.length; i++) {
    const oy = streakOffsetsY[i];
    const len = 34 + progress * 20;
    const sx = cx - len / 2;
    const ex = cx + len / 2;
    const sy = cy + oy;

    const sGrad = ctx.createLinearGradient(sx, sy, ex, sy);
    sGrad.addColorStop(0.0, "rgba(234, 179, 8, 0.0)");
    sGrad.addColorStop(0.5, `rgba(254, 240, 138, ${0.85 * alpha})`);
    sGrad.addColorStop(1.0, "rgba(234, 179, 8, 0.0)");

    ctx.strokeStyle = sGrad;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, sy);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * 🟠 3. 살짝 노란빛이 감도는 주황색(골든 앰버 오렌지) 점 파티클 렌더러
 * - [유저 요청 완벽 반영]: "점파티클 살짝만 노랗게"
 * - 따뜻하고 화사한 골든 앰버 오렌지 코어 + 옐로우-오렌지 발광 글로우 + 미세 소프트 옐로우 코어 하이라이트
 */
function drawOrangeDotOrb(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  alpha: number,
  isDeepTone: boolean
) {
  if (alpha <= 0.01 || radius <= 0.4) return;
  ctx.save();

  // [살짝 노란빛이 도는 옐로우-오렌지 / 앰버 2톤 팔레트]:
  // Tone 1 (골든 오렌지): [255, 165, 10] (#FFA50A)
  // Tone 2 (따뜻한 앰버 옐로우): [255, 196, 20] (#FFC414)
  const [r, g, b] = isDeepTone ? [255, 165, 10] : [255, 196, 20];
  const coreColor = `rgba(${r}, ${g}, ${b}, ${1.0 * alpha})`;

  // 1. 외곽 옐로우-오렌지빛 발광 글로우 아우라
  const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.8);
  glowGrad.addColorStop(0.00, coreColor);
  glowGrad.addColorStop(0.40, `rgba(${r}, ${g}, ${b}, ${0.85 * alpha})`);
  glowGrad.addColorStop(0.75, `rgba(${r}, ${g}, ${b}, ${0.35 * alpha})`);
  glowGrad.addColorStop(1.00, `rgba(${r}, ${g}, ${b}, 0.0)`);

  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.8, 0, Math.PI * 2);
  ctx.fill();

  // 2. 중심부 선명한 옐로우-오렌지 코어
  ctx.fillStyle = coreColor;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.75, 0, Math.PI * 2);
  ctx.fill();

  // 3. 중심부 살짝 노란 미니 코어 하이라이트 (살짝 노란빛 은은하게 보강)
  ctx.fillStyle = `rgba(255, 230, 80, ${0.90 * alpha})`;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 💥 4. 사방으로 팍 튀는 주황색 점 파티클 대폭발 (Orange Dot Particle Burst)
 * - 16개의 주황빛 점파티클이 타격 중심에서 방사형으로 고속 분출
 * - 후미 미니 트레일 스트릭으로 속도감 및 입체감 극대화
 */
function drawSmellingSaltsOrangeDotParticles(
  ctx: any,
  cx: number,
  cy: number,
  hitProg: number
) {
  const particleCount = 16;
  const burstEase = 1.0 - Math.pow(1.0 - Math.min(1.0, hitProg), 2.2);

  let orbAlpha = 1.0;
  if (hitProg > 0.45) {
    const fadeT = (hitProg - 0.45) / 0.55;
    orbAlpha = Math.max(0.0, 1.0 - Math.pow(fadeT, 1.2));
  }
  if (orbAlpha <= 0.01) return;

  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2 + ((i * 17) % 9) * 0.05;
    const baseDist = 38;
    const maxDist = baseDist + ((i * 11) % 5) * 8; // 38 ~ 70px
    const curDist = burstEase * maxDist;

    const px = cx + Math.cos(angle) * curDist;
    const py = cy + Math.sin(angle) * (curDist * 0.90);

    const baseRadius = 4.6 + (i % 3) * 0.6; // 4.6 ~ 5.8px
    const curRadius = baseRadius * Math.max(0.35, 1.0 - hitProg * 0.55);

    // 딥 오렌지와 비비드 오렌지 교차 배색
    const isDeepTone = i % 2 === 0;

    // 메인 주황 점 파티클
    drawOrangeDotOrb(ctx, px, py, curRadius, orbAlpha, isDeepTone);

    // 꼬리 트레일 미니 주황 점 파티클
    if (curDist > 10 && hitProg < 0.85) {
      const trailDist = curDist * 0.68;
      const tx = cx + Math.cos(angle) * trailDist;
      const ty = cy + Math.sin(angle) * (trailDist * 0.90);
      const trailRadius = curRadius * 0.55;
      const trailAlpha = orbAlpha * 0.65;
      drawOrangeDotOrb(ctx, tx, ty, trailRadius, trailAlpha, !isDeepTone);
    }
  }
}

// ============================================================================
// [정신차리기 렌더러: 1. 후면 레이어]
// ============================================================================
export function drawSmellingSaltsBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  // 클린 렌더링: 속이기와 동일하게 배경 전체 틴트 없이 대상 본연의 비주얼 유지
}

// ============================================================================
// [정신차리기 렌더러: 2. 전면 레이어 (양손 90도 교차 상하 2회 운동 & 박수 맞닿음 & 노란 이펙트 & 주황 점파티클)]
// ============================================================================
export function drawSmellingSaltsEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;

  const targetCenter = getTargetSpriteCenter(drawCtx, frame);
  const cx = targetCenter.x;
  const cy = targetCenter.y;

  const handDistX = 48;
  const amplitude = 18; // 위아래 진폭 18px

  // --------------------------------------------------------------------------
  // [Step 1: 양쪽에 태권당수 손 90도 직립 + 부드러운 2회 교차 상하 운동 (속이기 동일)]
  // --------------------------------------------------------------------------
  if (step === 1) {
    const waveProg = prog;
    const cycleProg = waveProg * 2.0; // 2회 완전 순환
    const wave = Math.sin(cycleProg * Math.PI * 2);

    // "왼쪽이 위면 오른쪽은 아래":
    const leftY = cy - wave * amplitude;
    const rightY = cy + wave * amplitude;
    const leftX = cx - handDistX;
    const rightX = cx + handDistX;

    // 90도 직립 모션 블러 고스트 잔상
    const prevWave1 = Math.sin(Math.max(0, cycleProg - 0.08) * Math.PI * 2);
    const prevWave2 = Math.sin(Math.max(0, cycleProg - 0.16) * Math.PI * 2);

    // 1) 보조 잔상 2
    drawFakeOutHand(ctx, leftX, cy - prevWave2 * amplitude, true, 0.18, 0.95);
    drawFakeOutHand(ctx, rightX, cy + prevWave2 * amplitude, false, 0.18, 0.95);

    // 2) 보조 잔상 1
    drawFakeOutHand(ctx, leftX, cy - prevWave1 * amplitude, true, 0.35, 0.95);
    drawFakeOutHand(ctx, rightX, cy + prevWave1 * amplitude, false, 0.35, 0.95);

    // 3) 선두 메인 손 (정확히 90도 직립 + 손 바닥 흰색)
    drawFakeOutHand(ctx, leftX, leftY, true, 1.0, 0.95);
    drawFakeOutHand(ctx, rightX, rightY, false, 1.0, 0.95);
  }

  // --------------------------------------------------------------------------
  // [Step 2: 마지막에 손이 맞닿으면서 - 정면 고속 쇄도 및 박수 맞닿음 (속이기 동일)]
  // --------------------------------------------------------------------------
  if (step === 2) {
    const clapProg = prog;
    const easeClap = Math.pow(clapProg, 2.0); // 순간적인 가속 맞닿음
    const curDist = handDistX * (1.0 - easeClap) + 8 * easeClap; // 48px -> 8px 맞닿음

    // 위(cy - 22)에서 아래(cy + 4)로 내려치며 박수!
    const chopY = cy - 22 * (1.0 - easeClap) + 4 * easeClap;

    const leftX = cx - curDist;
    const rightX = cx + curDist;

    // 내려칠수록 얇아지는 계수 (0 -> 1.0)
    const thinFactor = easeClap;

    // 수평 쇄도 속도 잔상
    if (curDist > 14) {
      const trailDist = curDist + 10;
      drawFakeOutHand(ctx, cx - trailDist, chopY - 4, true, 0.30, 0.95, thinFactor * 0.7);
      drawFakeOutHand(ctx, cx + trailDist, chopY - 4, false, 0.30, 0.95, thinFactor * 0.7);
    }

    // 메인 내려치는 90도 직립 손 (5개 슬라이스 분리 & 안쪽부터 얇아짐)
    drawFakeOutHand(ctx, leftX, chopY, true, 1.0, 0.95, thinFactor);
    drawFakeOutHand(ctx, rightX, chopY, false, 1.0, 0.95, thinFactor);
  }

  // --------------------------------------------------------------------------
  // [Step 3: 손이 맞닿은 직격 순간 & 노란 이펙트 & 주황 점파티클 대폭발]
  // --------------------------------------------------------------------------
  if (step === 3) {
    const hitProg = frame.hitProgress ?? prog;

    // 1) 손바닥: 맞닿은 상태 유지 후 반동 및 페이드아웃
    if (hitProg < 0.55) {
      const handAlpha = Math.max(0, 1.0 - hitProg / 0.55);
      const reboundDist = 8 + Math.min(1.0, hitProg * 2.5) * 12; // 8px -> 20px 반동
      const settleY = cy + 4 - hitProg * 4;

      drawFakeOutHand(ctx, cx - reboundDist, settleY, true, handAlpha, 0.95, 1.0);
      drawFakeOutHand(ctx, cx + reboundDist, settleY, false, handAlpha, 0.95, 1.0);
    }

    // 2) 노란색 8각 만화풍 스타버스트 (중앙 100% 완전 투명)
    drawSmellingSaltsYellowSharpImpact(ctx, cx, cy, hitProg);

    // 3) 노란색 충돌 관통 모멘텀 스피드선 (중앙(0)을 비워두어 중심 100% 투명 유지)
    drawSmellingSaltsYellowMomentumStreaks(ctx, cx, cy, hitProg);

    // 4) [유저 핵심 요구]: 주황색 점 파티클 사방 비산 대폭발!
    drawSmellingSaltsOrangeDotParticles(ctx, cx, cy, hitProg);
  }

  // --------------------------------------------------------------------------
  // [Step 4: 잔여 주황 점파티클 소산 및 안정화]
  // --------------------------------------------------------------------------
  if (step === 4) {
    const fadeProg = prog;
    const lingeringAlpha = Math.max(0, 1.0 - fadeProg);
    if (lingeringAlpha > 0.01) {
      // 잔여 주황 점파티클 서서히 공중 소산
      drawSmellingSaltsOrangeDotParticles(ctx, cx, cy, 0.70 + fadeProg * 0.30);
    }
  }
}

// ============================================================================
// ☝️ 266: 날따름 (Follow Me / このゆびとまれ) - 노말 타입 변화 기술
//
// 위력: — / 명중: — / PP: 20 / 우선도: +2 / 접촉: X
// 설명: 자신에게 주목시켜 상대로부터의 공격을 모두 자신에게 향하게 한다.
//
// [유저 요구사항 100% 완벽 반영]:
// "시전포켓몬이 동그랗게 원을 돌아. (3D로 도는거임.) 원을 그리고는 원위치에서 길어지면서 점프 후 앞뒤로 부드럽게 까딱 움직임."
//
// 1. [동그랗게 원을 돌아 (3D)]:
//    - 3D 지면 타원 궤도(Rx: 38px, Ry: 14px)를 따라 360도 공전 회전
//    - 깊이 원근 스케일링(뒤: 0.84, 앞: 1.04) 및 원심 뱅킹 회전각(인워드 틸트)
//    - 발밑에 3D 원형 궤적 링 및 반짝이는 스타더스트 트레일
// 2. [원위치에서 길어지면서 점프]:
//    - 원위치 복귀 후 수직 도약(-36px) 및 세로 신장(scaleY: 1.35, scaleX: 0.80)
//    - 도약 가속선 및 착지 탄성 스쿼시 연계
// 3. [앞뒤로 부드럽게 까딱 움직임]:
//    - 부드러운 2회 왕복 전후 끄덕임(까딱까딱 틸트 ±0.18rad & 전후 오프셋)
//    - 머리 및 손 주변으로 반짝이는 4방향 주목 스타버스트(골드·핑크·화이트) 및 파동 링
// ============================================================================

/**
 * 시전자 기준 중심 좌표 산출 헬퍼
 */
function getFollowMeCasterPos(drawCtx: EffectDrawContext, frame: BattleFrame) {
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
    cy: basePos.y + offY - (isP ? 42 : 36),
    offX,
    offY,
    isP,
  };
}


/**
 * ✨ 2. 날따름 주목(Attention) 스타버스트
 * - 포켓몬 주변에서 반짝이며 까딱거리는 동작에 맞추어 통통 튀는 별무리 (링 제거)
 */
function drawFollowMeAttentionSparkles(
  ctx: any,
  cx: number,
  cy: number,
  progress: number,
  cycleIdx: number
) {
  ctx.save();
  const alpha = Math.max(0, 1.0 - progress * 0.4);

  // 머리 및 좌우 손 주변의 다채로운 주목 4방향 별무리 (링 없이 깔끔한 별무리만 유지)
  const sparkleConfigs = [
    { dx: -24, dy: -28, size: 7.2, color: "#FACC15", rotOffset: 0.2 }, // 좌상단 골드 스타
    { dx: 26, dy: -24, size: 6.8, color: "#F472B6", rotOffset: -0.3 }, // 우상단 파스텔 핑크 스타
    { dx: -28, dy: -4, size: 5.5, color: "#FFFFFF", rotOffset: 0.4 },  // 좌측 퓨어 화이트
    { dx: 30, dy: -2, size: 6.0, color: "#FDE047", rotOffset: -0.1 },  // 우측 라이트 골드
    { dx: 2, dy: -42, size: 8.0, color: "#FFFFFF", rotOffset: 0.0 },   // 정수리 메인 샤인 스타
    { dx: -12, dy: 10, size: 4.8, color: "#FDE047", rotOffset: 0.5 },  // 하단 미니 스파클
    { dx: 16, dy: 12, size: 4.5, color: "#F472B6", rotOffset: -0.4 },  // 하단 핑크 스파클
  ];

  for (let i = 0; i < sparkleConfigs.length; i++) {
    const sc = sparkleConfigs[i];
    // 까딱거리는 리듬에 맞춰 통통 튀어오르는 Y 오프셋
    const bounceY = Math.sin(progress * Math.PI * 2 + i) * 3;
    const sx = cx + sc.dx;
    const sy = cy + sc.dy + bounceY;
    const starRot = sc.rotOffset + progress * 0.6;
    const pulseSize = sc.size * (0.85 + 0.30 * Math.sin(progress * Math.PI * 3 + i));

    drawMiniRetroStar(ctx, sx, sy, pulseSize, sc.color, starRot);
  }

  ctx.restore();
}

// ============================================================================
// [날따름 렌더러: 1. 후면 레이어]
// ============================================================================
export function drawFollowMeBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  // 선 및 링 이펙트 제거 (유저 요청 반영: 포켓몬 본체 모션 및 주변 별무리만 깔끔하게 유지)
}

// ============================================================================
// [날따름 렌더러: 2. 전면 레이어 (원형 궤적 스파클 & 까딱 주목 별무리)]
// ============================================================================
export function drawFollowMeEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const pos = getFollowMeCasterPos(drawCtx, frame);

  // --------------------------------------------------------------------------
  // [Step 1: 3D 원형 궤도 공전 회전 중 시전자 주변 스타더스트 궤적]
  // --------------------------------------------------------------------------
  if (step === 1) {
    ctx.save();
    // 시전자 발밑 주변 미니 골든 스타더스트
    const sparkCount = 3;
    for (let i = 0; i < sparkCount; i++) {
      const ang = prog * Math.PI * 4 + (i * Math.PI * 2) / sparkCount;
      const sx = pos.cx + Math.cos(ang) * 16;
      const sy = pos.cy + 18 + Math.sin(ang) * 6;
      drawMiniRetroStar(ctx, sx, sy, 3.5, `rgba(254, 240, 138, 0.75)`);
    }
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // [Step 2: 원위치에서 길어지면서 점프 (도약 가속선 제거 완료)]
  // --------------------------------------------------------------------------
  if (step === 2) {
    // 선 제거: 포켓몬 본체의 도약 및 세로 신장(stretch) 모션만 클린하게 연출
  }

  // --------------------------------------------------------------------------
  // [Step 3: 앞뒤로 부드럽게 까딱 움직임 (주목 별무리, 펄스 링 제거 완료)]
  // --------------------------------------------------------------------------
  if (step === 3) {
    const cycleIdx = (frame as any).cycleIdx ?? 1;
    drawFollowMeAttentionSparkles(ctx, pos.cx, pos.cy, prog, cycleIdx);
  }

  // --------------------------------------------------------------------------
  // [Step 4: 안정화 (잔여 별빛 상공 승화 소산)]
  // --------------------------------------------------------------------------
  if (step === 4) {
    const fadeAlpha = Math.max(0, 1.0 - prog);
    if (fadeAlpha > 0.01) {
      ctx.save();
      const lingerStars = [
        { dx: -18, dy: -32 - prog * 16, size: 5.0, col: "#FACC15" },
        { dx: 22, dy: -36 - prog * 18, size: 5.5, col: "#F472B6" },
        { dx: 2, dy: -48 - prog * 20, size: 6.0, col: "#FFFFFF" },
      ];
      for (const ls of lingerStars) {
        drawMiniRetroStar(ctx, pos.cx + ls.dx, pos.cy + ls.dy, ls.size * fadeAlpha, ls.col);
      }
      ctx.restore();
    }
  }
}

// ============================================================================
// 🍃 267: 자연의힘 (Nature Power / しぜんのちから)
//
// 타입: 노말 (Normal) / 분류: 변화 (Status) ➔ 공격 기술 전환
// 위력: 80 (트라이어택 변환 시) / 명중: 100 / PP: 20 / 접촉: X
// 설명: 자연의 힘을 빌려 공격한다. 통신 배틀 규정상 [트라이어택]으로 변환되어 발동된다!
//
// [연출 시퀀스 - 옵션 A: 통신배틀 표준 트라이어택 완벽 구현]:
// 1. [Step 1: 자연의 기운 소집]:
//    - 시전자 주변 360도에서 에메랄드빛/라임색 자연의 잎새들이 나선형으로 소용돌이치며 시전자에게 수렴
//    - 시전자 발밑에 펼쳐지는 싱그러운 그린·골드 자연의 파동 오라 링 및 반짝이는 별무리
// 2. [Step 2: 3원소 변환 트랜지션]:
//    - 모여든 자연의 에너지가 중앙에서 번쩍이며 화사한 플래시 폭발
//    - 빨강(화염), 노랑(전격), 파랑(빙결)의 3원소 씨앗 불씨로 분열되며 궤도 형성 & 암전 진입
// 3. [Step 3: 칠흑 같은 암전 & 트라이어택 3D 삼색 불꽃 공전 가속]:
//    - 삼색 불꽃이 3차원 궤도를 따라 가속 회전하며 점차 길어지는 원소 화염 구축
// 4. [Step 4: 타겟 클로즈업 & 3원소 탄환 발사 & 3연타 폭발 타격]:
//    - 빨강(화염 1타) ➔ 노랑(전격 2타) ➔ 파랑(빙결 3타) 순차 투척 및 폭발 강타
//    - 3타 타격 시 체력 감소 및 3원소 복합 충격파 전개!
// ============================================================================

/**
 * 나뭇잎 파티클 렌더링 헬퍼 (베지어 곡선 + 잎맥)
 */
function drawNatureLeaf(
  ctx: any,
  x: number,
  y: number,
  size: number,
  angle: number,
  color: string,
  alpha: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(size * 0.55, 0, 0, size);
  ctx.quadraticCurveTo(-size * 0.55, 0, 0, -size);
  ctx.closePath();
  ctx.fill();

  // 잎맥 (중심선)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.7);
  ctx.lineTo(0, size * 0.7);
  ctx.stroke();

  ctx.restore();
}

/**
 * 자연의힘 시전자 좌표 산출 헬퍼
 */
function getNaturePowerCasterPos(drawCtx: EffectDrawContext, frame: BattleFrame) {
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
    cy: basePos.y + offY - (isP ? 42 : 36),
    groundY: basePos.y + offY,
    offX,
    offY,
    isP,
  };
}

/**
 * 🍃 자연의힘 후면 레이어 (drawBehindEffect)
 */
export function drawNaturePowerBehindEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const step = frame.moveStep;
  const darkAlpha = frame.darkAlpha ?? 0;

  // Step 1: 시전자 발밑에 펼쳐지는 싱그러운 자연의 오라 파동 링
  if (step === 1) {
    const pos = getNaturePowerCasterPos(drawCtx, frame);
    const prog = (frame as any).natureGatherProgress ?? 0;
    const alpha = Math.max(0, Math.sin(prog * Math.PI));

    targetCtx.save();
    // 발밑 부드러운 그린-골드 타원형 오라 펄스
    const auraRx = 24 + prog * 28;
    const auraRy = auraRx * 0.45;
    const grad = targetCtx.createRadialGradient(pos.cx, pos.groundY, 0, pos.cx, pos.groundY, auraRx);
    grad.addColorStop(0.0, `rgba(74, 222, 128, ${0.45 * alpha})`);
    grad.addColorStop(0.6, `rgba(34, 197, 94, ${0.25 * alpha})`);
    grad.addColorStop(1.0, "rgba(34, 197, 94, 0.0)");

    targetCtx.fillStyle = grad;
    targetCtx.beginPath();
    targetCtx.ellipse(pos.cx, pos.groundY, auraRx, auraRy, 0, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.restore();
    return;
  }

  // Step 2: 트라이어택 3D 불꽃 회전 (뒤쪽 절반) & 암전 오버레이
  if (step === 2) {
    const proxyFrame = { ...frame, moveStep: 1 };
    drawTriAttackBehindEffect(targetCtx, proxyFrame, drawCtx);
    return;
  }

  // Step 3: 트라이어택 펠릿 타격 & 암전 오버레이
  if (step === 3) {
    const proxyFrame = { ...frame, moveStep: 2 };
    drawTriAttackBehindEffect(targetCtx, proxyFrame, drawCtx);
    return;
  }
}

/**
 * 🌟 자연의힘 전면 레이어 (drawEffect)
 */
export function drawNaturePowerEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const step = frame.moveStep;

  // --------------------------------------------------------------------------
  // [Step 1: 자연의 기운 소집 - 나뭇잎 소용돌이 및 자연의 별빛]
  // --------------------------------------------------------------------------
  if (step === 1) {
    const pos = getNaturePowerCasterPos(drawCtx, frame);
    const prog = (frame as any).natureGatherProgress ?? 0;
    const leafCount = 8;
    const leafColors = ["#4ADE80", "#22C55E", "#86EFAC", "#A3E635"];

    targetCtx.save();

    // 1) 나선형으로 시전자 중심을 향해 빨려드는 나뭇잎들
    for (let i = 0; i < leafCount; i++) {
      const leafProg = (prog + i / leafCount) % 1.0;
      // 반경: 65px -> 8px 수렴
      const radius = (1.0 - leafProg) * 65 + 8;
      // 회전각: 3바퀴 나선 회전
      const angle = (i * Math.PI * 2 / leafCount) + leafProg * Math.PI * 2.8;
      const lx = pos.cx + Math.cos(angle) * radius;
      // 타원형 궤적 (Y축 압축)
      const ly = pos.cy + Math.sin(angle) * (radius * 0.55);

      const leafSize = 4.5 + (1.0 - leafProg) * 3.5;
      const leafAlpha = Math.sin(leafProg * Math.PI) * 0.95;
      const leafRot = angle + Math.PI / 4 + leafProg * 2.0;
      const color = leafColors[i % leafColors.length];

      drawNatureLeaf(targetCtx, lx, ly, leafSize, leafRot, color, leafAlpha);
    }

    // 2) 시전자 주변에서 부드럽게 반짝이는 자연의 미니 스타더스트
    const starConfigs = [
      { dx: -22, dy: -24, size: 5.5, color: "#86EFAC" },
      { dx: 24, dy: -20, size: 6.0, color: "#FDE047" },
      { dx: -18, dy: 10, size: 4.8, color: "#4ADE80" },
      { dx: 20, dy: 14, size: 5.0, color: "#A3E635" },
      { dx: 0, dy: -36, size: 7.0, color: "#FFFFFF" },
    ];
    for (let i = 0; i < starConfigs.length; i++) {
      const sc = starConfigs[i];
      const starAlpha = Math.sin((prog * 2 + i * 0.3) % Math.PI) * 0.85;
      if (starAlpha > 0.1) {
        drawMiniRetroStar(
          targetCtx,
          pos.cx + sc.dx,
          pos.cy + sc.dy,
          sc.size * starAlpha,
          sc.color,
          prog * 0.8 + i
        );
      }
    }

    targetCtx.restore();
    return;
  }

  // --------------------------------------------------------------------------
  // [Step 2: 트라이어택 3D 삼색 불꽃 공전 가속 (앞쪽 절반)]
  // --------------------------------------------------------------------------
  if (step === 2) {
    const proxyFrame = { ...frame, moveStep: 1 };
    drawTriAttackEffect(targetCtx, proxyFrame, drawCtx);
    return;
  }

  // --------------------------------------------------------------------------
  // [Step 3: 트라이어택 3원소 알갱이 투척 & 3연타 폭발 타격]
  // --------------------------------------------------------------------------
  if (step === 3) {
    const proxyFrame = { ...frame, moveStep: 2 };
    drawTriAttackEffect(targetCtx, proxyFrame, drawCtx);
    return;
  }
}

// ============================================================================
// ⚡ 268: 충전 (Charge / じゅうでん) - 전기 타입 변화 기술
//
// 위력: — / 명중: — / PP: 20 / 대상: 자신 / 접촉: X
// 설명: 다음 턴에 쓸 전기타입 기술의 위력을 2배로 올린다. 자신의 특수방어도 1랭크 올라간다.
//
// [연출 시퀀스]:
// 1. [Step 1: 전자기 에너지 수렴 및 집적 (Converging Influx)]:
//    - 시전자 중심을 향해 사방에서 빨려 들어오는 날카로운 노란색/황금색 지그재그 번개 줄기 및 일렉트릭 스파크 입자
//    - 시전자 발밑에 펼쳐지는 은은한 전자기장 펄스 오라 링
// 2. [Step 2: 전격 대방전 폭발 & 특수방어 상승 버프 (Supercharged Burst & Sp.Def Buff)]:
//    - 화면 전체에 순간적으로 번쩍하는 전자기 섬광(Yellow-Amber Ambient Flash)
//    - 시전자 중심에서 사방으로 뻗어나가는 고전압 번개 아크 & 8각 골든 스타버스트 코어
//    - 발밑에 급격히 팽창하는 2중 전격 충격파 링
//    - 시전자 몸체 둘레를 타고 도는 플라즈마 전격 가닥
//    - 머리 위로 솟아오르는 특수방어 상승을 상징하는 청록/민트빛 및 황금빛 상승 화살표 & 반짝이는 별무리
// 3. [Step 3: 잔류 전류 및 안정화 (Residual Crackle)]:
//    - 몸 표면에 파직- 파직- 남아 깜빡이는 미니 잔류 스파크
//    - 발밑 전자기장의 부드러운 소산
// ============================================================================

/**
 * 충전 시전자 중심 및 발밑 좌표 산출 헬퍼
 */
function getChargeCasterPos(drawCtx: EffectDrawContext, frame: BattleFrame) {
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

/**
 * ⬆️ 특수방어 상승을 상징하는 버프 화살표 렌더러
 */
function drawChargeBuffArrow(
  ctx: any,
  x: number,
  y: number,
  size: number,
  alpha: number,
  color: string
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.35;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x - size, y + size * 0.5);
  ctx.lineTo(x, y - size * 0.5);
  ctx.lineTo(x + size, y + size * 0.5);
  ctx.stroke();
  ctx.restore();
}

/**
 * ⚡ 번개 줄기 외곽 글로우 + 코어 렌더러 - [유저 요구사항 100% 반영]:
 * "전기는 양쪽 끝 뾰족하게"
 * 시작점(u=0)과 끝점(u=1) 모두 바늘 끝(0.0px)으로 완벽하게 수렴하도록
 * 사인파 테이퍼(sin(u * PI)) 및 3분할 팁 서브세그먼트 정밀 테이퍼링 적용!
 */
function drawChargeLightningStroke(
  ctx: any,
  pts: Array<{ x: number; y: number }>,
  coreColor: string,
  glowColor: string,
  width: number,
  alpha: number
) {
  if (pts.length < 2 || alpha <= 0.01) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const numSegments = pts.length - 1;

  for (let i = 0; i < numSegments; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const u1 = i / numSegments;
    const u2 = (i + 1) / numSegments;

    // 시작과 끝 세그먼트는 3분할 세분화하여 극도로 날카로운 바늘 끝(Needle Tip) 보장
    const isTipSeg = i === 0 || i === numSegments - 1;
    const subCount = isTipSeg ? 3 : 1;

    for (let s = 0; s < subCount; s++) {
      const su1 = u1 + (u2 - u1) * (s / subCount);
      const su2 = u1 + (u2 - u1) * ((s + 1) / subCount);
      const suMid = (su1 + su2) * 0.5;

      const sx1 = p1.x + (p2.x - p1.x) * (s / subCount);
      const sy1 = p1.y + (p2.y - p1.y) * (s / subCount);
      const sx2 = p1.x + (p2.x - p1.x) * ((s + 1) / subCount);
      const sy2 = p1.y + (p2.y - p1.y) * ((s + 1) / subCount);

      // 양쪽 끝 뾰족 테이퍼 배율: sin(u * PI)^0.85 (u=0 -> 0, u=0.5 -> 1.0, u=1 -> 0)
      const taper = Math.pow(Math.sin(suMid * Math.PI), 0.85);
      if (taper < 0.02) continue;

      const glowW = Math.max(0.2, width * 2.5 * taper);
      const coreW = Math.max(0.15, width * taper);

      // 1) 외곽 글로우 (양쪽 끝 뾰족)
      ctx.globalAlpha = Math.min(1.0, alpha * 0.85);
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = glowW;
      ctx.beginPath();
      ctx.moveTo(sx1, sy1);
      ctx.lineTo(sx2, sy2);
      ctx.stroke();

      // 2) 중심 코어 (양쪽 끝 뾰족)
      ctx.globalAlpha = Math.min(1.0, alpha);
      ctx.strokeStyle = coreColor;
      ctx.lineWidth = coreW;
      ctx.beginPath();
      ctx.moveTo(sx1, sy1);
      ctx.lineTo(sx2, sy2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

// ============================================================================
// [충전 렌더러: 1. 후면 레이어 (배경 암전 ➔ 번쩍 섬광, 지면 전자기장, 방전 링)]
// ============================================================================
export function drawChargeBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const pos = getChargeCasterPos(drawCtx, frame);

  // --------------------------------------------------------------------------
  // [Step 1: 전자기 에너지 수렴 - 배경 암전 먼저 드리움 & 발밑 전자기장 & 후면 수렴 번개]
  // --------------------------------------------------------------------------
  if (step === 1) {
    ctx.save();

    // 1) 🌌 [유저 요구사항]: "암전먼저 시키고 번쩍거리게 해주고"
    // 전력이 모여들면서 대기가 칠흑같이 어두워지는 짙은 암전 먼저 전개 (0.0 -> 0.82)
    const darknessAlpha = Math.min(0.82, Math.pow(prog, 0.85) * 0.85);
    ctx.fillStyle = `rgba(10, 8, 4, ${darknessAlpha})`;
    ctx.fillRect(-6000, -6000, 14000, 14000);

    // 2) 발밑 전자기장 오라 펄스
    const auraR = 24 + Math.sin(prog * Math.PI) * 12;
    const grad = ctx.createRadialGradient(pos.cx, pos.groundY, 0, pos.cx, pos.groundY, auraR);
    grad.addColorStop(0.0, "rgba(254, 240, 138, 0.50)");
    grad.addColorStop(0.45, "rgba(250, 204, 21, 0.28)");
    grad.addColorStop(0.80, "rgba(234, 179, 8, 0.12)");
    grad.addColorStop(1.0, "rgba(234, 179, 8, 0.0)");

    ctx.save();
    ctx.translate(pos.cx, pos.groundY);
    ctx.scale(1.0, 0.38); // 타원형 지면 전자기장
    ctx.beginPath();
    ctx.arc(0, 0, auraR, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    // 3) 후면 수렴 번개 (3줄기 - 양쪽 끝 뾰족하게 수렴)
    const rearAngles = [Math.PI * 0.9, Math.PI * 1.3, Math.PI * 1.7];
    for (let i = 0; i < rearAngles.length; i++) {
      const angle = rearAngles[i] + Math.sin(prog * 6 + i) * 0.2;
      const startDist = 65 * (1.0 - prog * 0.7);
      const endDist = Math.max(8, startDist - 30);
      const x1 = pos.cx + Math.cos(angle) * startDist;
      const y1 = pos.cy + Math.sin(angle) * (startDist * 0.65);
      const x2 = pos.cx + Math.cos(angle) * endDist;
      const y2 = pos.cy + Math.sin(angle) * (endDist * 0.65);

      const pts = createLightningPoints(x1, y1, x2, y2, 5, 8, prog * 10 + i * 2.3);
      const lAlpha = Math.sin(prog * Math.PI) * 0.90;
      drawChargeLightningStroke(ctx, pts, "#FFFFFF", "#FACC15", 2.2, lAlpha);
    }

    ctx.restore();
    return;
  }

  // --------------------------------------------------------------------------
  // [Step 2: 전격 대방전 폭발 - 암전 베이스에서 팍! 터지는 섬광 번쩍임 & 방전 링 & 방사형 번개]
  // --------------------------------------------------------------------------
  if (step === 2) {
    ctx.save();
    const burstAlpha = Math.max(0, 1.0 - prog);

    // 1) 🌌 Step 1에서 깔린 짙은 암전 유지 후 서서히 페이드아웃 (암전 먼저 깔려있는 상태)
    const baseDarkAlpha = Math.max(0, (1.0 - prog / 0.75) * 0.82);
    if (baseDarkAlpha > 0.01) {
      ctx.fillStyle = `rgba(10, 8, 4, ${baseDarkAlpha})`;
      ctx.fillRect(-6000, -6000, 14000, 14000);
    }

    // 2) ⚡ [유저 요구사항]: "암전먼저 시키고 번쩍거리게 해주고"
    // 암전 속에서 팍! 하고 터져 나오는 고휘도 순백 및 네온 옐로우 전자기 섬광 (Flicker Flash)
    if (prog < 0.42) {
      const flashCurve = Math.pow(1.0 - prog / 0.42, 0.75);
      // 순백 코어 플래시 번쩍임
      ctx.fillStyle = `rgba(255, 255, 255, ${flashCurve * 0.75})`;
      ctx.fillRect(-6000, -6000, 14000, 14000);
      // 화사한 네온 옐로우 틴트 섬광
      ctx.fillStyle = `rgba(254, 240, 138, ${flashCurve * 0.45})`;
      ctx.fillRect(-6000, -6000, 14000, 14000);
    }

    // 3) 발밑 2중 고전압 전격 방전 링
    const ringR1 = 18 + prog * 48;
    const ringR2 = Math.max(0, ringR1 - 14);
    ctx.save();
    ctx.translate(pos.cx, pos.groundY);
    ctx.scale(1.0, 0.38);

    ctx.strokeStyle = `rgba(254, 240, 138, ${burstAlpha * 0.9})`;
    ctx.lineWidth = 3.0 * (1.0 - prog * 0.5);
    ctx.beginPath();
    ctx.arc(0, 0, ringR1, 0, Math.PI * 2);
    ctx.stroke();

    if (ringR2 > 0) {
      ctx.strokeStyle = `rgba(250, 204, 21, ${burstAlpha * 0.7})`;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(0, 0, ringR2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // 4) 후면 방사형 대형 번개 줄기 (5방향 - 양쪽 끝 뾰족하게 방전)
    const boltAngles = [
      -Math.PI * 0.75,
      -Math.PI * 0.45,
      -Math.PI * 0.15,
      -Math.PI * 0.85,
      -Math.PI * 0.3,
    ];
    for (let i = 0; i < boltAngles.length; i++) {
      const ang = boltAngles[i];
      const length = (40 + i * 8) * (0.6 + prog * 0.6);
      const ex = pos.cx + Math.cos(ang) * length;
      const ey = pos.cy + Math.sin(ang) * length;
      const pts = createLightningPoints(pos.cx, pos.cy, ex, ey, 6, 12, prog * 15 + i * 3.7);
      drawChargeLightningStroke(ctx, pts, "#FFFFFF", "#FDE047", 2.8, burstAlpha * 0.95);
    }

    ctx.restore();
    return;
  }

  // --------------------------------------------------------------------------
  // [Step 3: 안정화 - 발밑 잔류 잔광 소산]
  // --------------------------------------------------------------------------
  if (step === 3) {
    const fadeAlpha = Math.max(0, 1.0 - prog);
    if (fadeAlpha > 0.01) {
      ctx.save();
      const auraR = 30 * fadeAlpha;
      ctx.translate(pos.cx, pos.groundY);
      ctx.scale(1.0, 0.38);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, auraR);
      grad.addColorStop(0.0, `rgba(254, 240, 138, ${fadeAlpha * 0.3})`);
      grad.addColorStop(1.0, "rgba(234, 179, 8, 0.0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, auraR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

// ============================================================================
// [충전 렌더러: 2. 전면 레이어 (수렴 스파크, 스타버스트 코어, Sp.Def 버프)]
// ============================================================================
export function drawChargeEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const pos = getChargeCasterPos(drawCtx, frame);

  // --------------------------------------------------------------------------
  // [Step 1: 전자기 에너지 수렴 - 사방에서 중심으로 빨려드는 양쪽 끝 뾰족 번개]
  // --------------------------------------------------------------------------
  if (step === 1) {
    ctx.save();
    const particleCount = 8;
    const lAlpha = Math.sin(prog * Math.PI) * 0.95;

    for (let i = 0; i < particleCount; i++) {
      const baseAng = (i * Math.PI * 2) / particleCount;
      const curDist = 60 * (1.0 - prog) + 6;
      // 나선형 회전 수렴
      const ang = baseAng + prog * 2.2;
      const px = pos.cx + Math.cos(ang) * curDist;
      const py = pos.cy + Math.sin(ang) * (curDist * 0.8);

      // 중심을 향하는 양쪽 끝 뾰족한 번개 스파크 줄기
      const tailDist = curDist + 16;
      const tx = pos.cx + Math.cos(ang) * tailDist;
      const ty = pos.cy + Math.sin(ang) * (tailDist * 0.8);
      const pts = createLightningPoints(tx, ty, px, py, 4, 6, prog * 12 + i * 2.1);
      drawChargeLightningStroke(ctx, pts, "#FFFFFF", "#FDE047", 1.8, lAlpha * 0.90);
    }

    // 시전자 몸체 표면의 미세 지그재그 정전기 아크 (양쪽 끝 뾰족)
    const staticCount = 3;
    for (let i = 0; i < staticCount; i++) {
      const ox = (Math.sin(prog * 15 + i * 3) * 16);
      const oy = (Math.cos(prog * 12 + i * 2) * 16);
      const sx1 = pos.cx + ox - 4;
      const sy1 = pos.cy + oy - 4;
      const sx2 = pos.cx + ox + 4;
      const sy2 = pos.cy + oy + 4;
      const sPts = createLightningPoints(sx1, sy1, sx2, sy2, 3, 4, prog * 20 + i);
      drawChargeLightningStroke(ctx, sPts, "#FFFFFF", "#FEF08A", 1.2, lAlpha * 0.85);
    }

    ctx.restore();
    return;
  }

  // --------------------------------------------------------------------------
  // [Step 2: 전격 대폭발 & 특수방어 상승 버프 연출]
  // --------------------------------------------------------------------------
  if (step === 2) {
    ctx.save();
    const alpha = Math.max(0, 1.0 - prog);

    // 1) 중심 골든 8각 스타버스트 코어
    if (prog < 0.65) {
      const starAlpha = (1.0 - prog / 0.65);
      const outerR = 24 + prog * 28;
      const innerR = outerR * 0.42;
      const points = 8;
      ctx.save();
      ctx.translate(pos.cx, pos.cy);
      ctx.rotate(prog * 0.5);

      const starGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, outerR);
      starGrad.addColorStop(0.0, `rgba(255, 255, 255, ${0.95 * starAlpha})`);
      starGrad.addColorStop(0.35, `rgba(254, 240, 138, ${0.90 * starAlpha})`);
      starGrad.addColorStop(0.75, `rgba(250, 204, 21, ${0.75 * starAlpha})`);
      starGrad.addColorStop(1.0, `rgba(234, 179, 8, 0.0)`);

      ctx.fillStyle = starGrad;
      ctx.beginPath();
      const stepAng = Math.PI / points;
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = i * stepAng - Math.PI / 2;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 2) ⚡ [유저 요구사항]: "전기는 양쪽 끝 뾰족하게"
    // 전면 고전압 지그재그 번개 가닥 (시전자 앞쪽에서 뻗침 - 양쪽 끝 뾰족 테이퍼)
    const frontAngles = [
      Math.PI * 0.2,
      Math.PI * 0.55,
      Math.PI * 0.85,
      -Math.PI * 0.6,
    ];
    for (let i = 0; i < frontAngles.length; i++) {
      const ang = frontAngles[i];
      const dist = (36 + i * 6) * (0.5 + prog * 0.7);
      const ex = pos.cx + Math.cos(ang) * dist;
      const ey = pos.cy + Math.sin(ang) * (dist * 0.85);
      const pts = createLightningPoints(pos.cx, pos.cy, ex, ey, 5, 10, prog * 18 + i * 4.1);
      drawChargeLightningStroke(ctx, pts, "#FFFFFF", "#FEF08A", 2.6, alpha * 0.95);
    }

    // 3) 특수방어 상승 버프: 위로 솟아오르는 빛나는 화살표 및 민트/골드 스타
    const buffConfigs = [
      { dx: -18, startDy: 8, speed: 48, size: 7.0, color: "#34D399" }, // 민트빛 Sp.Def 화살표
      { dx: 0, startDy: 16, speed: 56, size: 8.5, color: "#FDE047" },   // 중앙 골든 Sp.Def 화살표
      { dx: 18, startDy: 10, speed: 48, size: 7.0, color: "#6EE7B7" },  // 민트빛 Sp.Def 화살표
    ];

    for (let i = 0; i < buffConfigs.length; i++) {
      const bc = buffConfigs[i];
      const curY = pos.cy + bc.startDy - (prog * bc.speed);
      const curX = pos.cx + bc.dx + Math.sin(prog * 5 + i) * 2;
      const buffAlpha = Math.sin(prog * Math.PI) * 0.95;
      drawChargeBuffArrow(ctx, curX, curY, bc.size, buffAlpha, bc.color);
    }

    // 상승하는 반짝이는 버프 스타클라우드
    const sparkleConfigs = [
      { dx: -24, dy: -10 - prog * 42, size: 5.0, col: "#34D399" },
      { dx: 22, dy: -14 - prog * 45, size: 5.5, col: "#FACC15" },
      { dx: -8, dy: -28 - prog * 50, size: 6.0, col: "#FFFFFF" },
      { dx: 12, dy: -32 - prog * 48, size: 4.8, col: "#6EE7B7" },
    ];
    for (const sc of sparkleConfigs) {
      const sAlpha = Math.sin(prog * Math.PI) * 0.9;
      drawMiniRetroStar(ctx, pos.cx + sc.dx, sc.dy, sc.size * (0.8 + 0.3 * Math.sin(prog * 8)), sc.col);
    }

    ctx.restore();
    return;
  }

  // --------------------------------------------------------------------------
  // [Step 3: 안정화 - 시전자 몸체 표면 잔류 전류 아크 (양쪽 끝 뾰족)]
  // --------------------------------------------------------------------------
  if (step === 3) {
    const fadeAlpha = Math.max(0, 1.0 - prog);
    if (fadeAlpha > 0.01) {
      ctx.save();
      const staticArcs = [
        { x1: pos.cx - 16, y1: pos.cy - 12, x2: pos.cx - 4, y2: pos.cy - 22 },
        { x1: pos.cx + 6, y1: pos.cy - 18, x2: pos.cx + 18, y2: pos.cy - 6 },
        { x1: pos.cx - 12, y1: pos.cy + 6, x2: pos.cx + 2, y2: pos.cy + 14 },
        { x1: pos.cx + 4, y1: pos.cy + 8, x2: pos.cx + 16, y2: pos.cy + 16 },
      ];
      for (let i = 0; i < staticArcs.length; i++) {
        const sa = staticArcs[i];
        const blink = Math.sin((prog * 10 + i * 2.3) % Math.PI) * fadeAlpha;
        if (blink > 0.25) {
          const pts = createLightningPoints(sa.x1, sa.y1, sa.x2, sa.y2, 3, 5, prog * 15 + i * 3.1);
          drawChargeLightningStroke(ctx, pts, "#FFFFFF", "#FEF08A", 1.5, blink);
        }
      }
      ctx.restore();
    }
  }
}


