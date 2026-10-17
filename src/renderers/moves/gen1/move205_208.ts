// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawMiniRetroStar, drawStarburstImpact, drawStatBoostEffect } from "../common/helpers.js";
import { drawConfusionEffect } from "./move045_048.js";
import { drawRecoveryStarSpiral } from "./move105_108.js";

// ============================================================================
// 🪨 205: 구르기 (Rollout) - 바위 타입 물리 기술
//
// 5턴 동안 구르기를 반복하여 공격한다. 기술이 맞을 때마다 위력이 올라간다.
// 웅크리기를 먼저 썼다면 위력이 2배가 된다.
//
// [유저 지정 연출 시퀀스]:
// 1. [웅크리기 준비]: 시전 포켓몬 살짝 납작해지고(Squash) -> 세로도 줄어서 작아진 상태로 웅크림
// 2. [제자리 Z축 회전 & 구체 형성]: 앞면/뒷면/앞면/뒷면 연속 반전 회전하며 동그란 암석 구체 에너지 형성
// 3. [전방 돌진 & 타격]: 동그란 형상을 두른 채 앞으로 고속 돌진 -> 대상 스프라이트 직격 타격 (임팩트 섬광)
// 4. [관통 돌파]: 대상을 뚫고 지나가 화면 우상단 밖으로 돌파
// 5. [화면 밖 선회 & 복귀]: 화면 왼쪽 아래 카메라 밖에서 굴러 들어와 제자리로 복귀 후 기지개(Uncurl)
// ============================================================================

// 256색 최적화 바위/대지 팔레트 (Octree Quantizer 최적화)
const ROCK_DARK = "#78350F";       // 짙은 암석 외곽선 / 음영
const ROCK_BROWN = "#92400E";      // 묵직한 대지 갈색
const ROCK_AMBER = "#B45309";      // 바위 중간 톤
const ROCK_WARM = "#D97706";       // 따뜻한 호박빛 모래암
const ROCK_GOLD = "#F59E0B";       // 빛나는 황금빛 바위 코어
const ROCK_LIGHT = "#FBBF24";      // 밝은 암석 하이라이트
const ROCK_PALE = "#FDE68A";       // 흙먼지 / 반사광
const ROCK_WHITE = "#FFFBEB";      // 코어 백색 광택

/**
 * 외곽 투명 그라데이션이 적용된 부드러운 모래먼지 알갱이 렌더러
 * - 중심: 선명하고 묵직한 모래/황토/대지 컬러
 * - 외곽: 부드럽게 0으로 페이드아웃되는 투명 그라데이션 (안개/모래먼지 질감)
 */
function drawGradientDustGrain(
  ctx: any,
  x: number,
  y: number,
  radius: number,
  colorType: "pale" | "warm" | "amber" | "dark",
  alpha: number
): void {
  if (radius <= 0.5 || alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  if (colorType === "pale") {
    // 밝은 황금빛 모래 알갱이
    grad.addColorStop(0.0, "rgba(254, 243, 199, 0.95)");
    grad.addColorStop(0.35, "rgba(253, 230, 138, 0.80)");
    grad.addColorStop(0.70, "rgba(245, 158, 11, 0.35)");
    grad.addColorStop(1.0, "rgba(245, 158, 11, 0.0)");
  } else if (colorType === "warm") {
    // 따뜻한 황토빛 먼지 알갱이
    grad.addColorStop(0.0, "rgba(245, 158, 11, 0.90)");
    grad.addColorStop(0.40, "rgba(217, 119, 6, 0.70)");
    grad.addColorStop(0.75, "rgba(180, 83, 9, 0.30)");
    grad.addColorStop(1.0, "rgba(180, 83, 9, 0.0)");
  } else if (colorType === "amber") {
    // 짙은 흙먼지 알갱이
    grad.addColorStop(0.0, "rgba(180, 83, 9, 0.85)");
    grad.addColorStop(0.45, "rgba(146, 64, 14, 0.60)");
    grad.addColorStop(0.80, "rgba(120, 53, 15, 0.25)");
    grad.addColorStop(1.0, "rgba(120, 53, 15, 0.0)");
  } else {
    // 미세 암석 부스러기
    grad.addColorStop(0.0, "rgba(120, 53, 15, 0.80)");
    grad.addColorStop(0.40, "rgba(146, 64, 14, 0.50)");
    grad.addColorStop(0.75, "rgba(180, 83, 9, 0.20)");
    grad.addColorStop(1.0, "rgba(180, 83, 9, 0.0)");
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 205: 구르기 (Rollout) 이펙트 렌더러
 */
export function drawRolloutEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
): void {
  const isPlayer = drawCtx.isPlayer ?? true;
  const targetPos = drawCtx.targetPos || { x: 380, y: 130 };
  const casterPos = drawCtx.casterPos || (isPlayer ? { x: 150, y: 280 } : { x: 418, y: 152 });

  const moveStep = frame.moveStep ?? 1;
  const spinAngle = frame.rolloutSpinAngle ?? 0;
  const radius = frame.rolloutSphereRadius ?? (isPlayer ? 38 : 30);
  const dustIntensity = frame.rolloutDustIntensity ?? 0.5;
  const hitProg = frame.hitProgress ?? 0;
  const uncurlProg = frame.uncurlProgress ?? 0;

  // 구체 중심점: 시전자 발 밑 기준이 아닌 몸체 중심 (스프라이트 중심 높이로 보정)
  const sphereYOffset = isPlayer ? -36 : -26;
  const cx = casterPos.x;
  const cy = casterPos.y + sphereYOffset;

  ctx.save();

  // 유저 요청: 둥근 이펙트 효과 및 구체 제거 테스트 모드
  const ENABLE_ROLLOUT_SPHERE = false;
  // 유저 요청: 타격 이펙트 제거 테스트 모드
  const ENABLE_HIT_EFFECT = false;

  // --------------------------------------------------------------------------
  // 1. 고속 돌진 & 루프 잔상 트레일 (Motion Blur Trail)
  // --------------------------------------------------------------------------
  if (ENABLE_ROLLOUT_SPHERE && frame.rolloutTrail && (moveStep === 2 || moveStep === 3)) {
    const trailOffset = frame.rolloutTrailOffset || { x: -28, y: 13 };
    const tx1 = cx + (isPlayer ? trailOffset.x : -trailOffset.x);
    const ty1 = cy + (isPlayer ? trailOffset.y : -trailOffset.y);

    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = ROCK_AMBER;
    ctx.beginPath();
    ctx.arc(tx1, ty1, radius * 0.88, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = ROCK_WARM;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(tx1, ty1, radius * 0.88, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 2. 굴러가는 동그란 형상 (Rollout Boulder Shell & Aura)
  // --------------------------------------------------------------------------
  if (ENABLE_ROLLOUT_SPHERE && frame.showRolloutSphere !== false && uncurlProg < 0.95) {
    const sphereAlpha = uncurlProg > 0 ? Math.max(0, 1.0 - uncurlProg) : 1.0;

    ctx.save();
    ctx.globalAlpha = sphereAlpha;

    // 2-1. 반투명 암석 구체 베이스 (Radial Glow)
    const baseGrad = ctx.createRadialGradient(cx - radius * 0.25, cy - radius * 0.25, 2, cx, cy, radius);
    baseGrad.addColorStop(0, "rgba(253, 230, 138, 0.45)");
    baseGrad.addColorStop(0.35, "rgba(245, 158, 11, 0.35)");
    baseGrad.addColorStop(0.75, "rgba(180, 83, 9, 0.40)");
    baseGrad.addColorStop(1.0, "rgba(120, 53, 15, 0.55)");

    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // 2-2. 3D 회전 암석 크러스트 & 회전 밴드 (앞으로 굴러가는 입체감)
    // 원형 구체 내부로 클리핑하여 구체 굴러가는 방향으로 동기화 회전
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    ctx.translate(cx, cy);
    const rot = isPlayer ? spinAngle : -spinAngle;
    ctx.rotate(rot);

    // 구체 회전 밴드 1 (암석 단면)
    ctx.fillStyle = "rgba(120, 53, 15, 0.60)";
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.95, radius * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = ROCK_WARM;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.95, radius * 0.38, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 구체 회전 밴드 2 (교차 암석선)
    ctx.fillStyle = "rgba(180, 83, 9, 0.45)";
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.38, radius * 0.95, 0, 0, Math.PI * 2);
    ctx.fill();

    // 바위 표면 거친 텍스처 각진 파편 디테일 (구체와 함께 회전)
    const rockChunks = [
      { rRel: 0.55, aRel: 0.2 },
      { rRel: 0.70, aRel: 1.8 },
      { rRel: 0.40, aRel: 3.4 },
      { rRel: 0.65, aRel: 4.9 },
    ];
    for (const chunk of rockChunks) {
      const rx = Math.cos(chunk.aRel) * (radius * chunk.rRel);
      const ry = Math.sin(chunk.aRel) * (radius * chunk.rRel);
      ctx.fillStyle = ROCK_DARK;
      ctx.beginPath();
      ctx.arc(rx, ry, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ROCK_PALE;
      ctx.beginPath();
      ctx.arc(rx - 1, ry - 1, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore(); // 클리핑 해제

    // 2-3. 구체 외곽 글로우 링 & 상단 코어 하이라이트
    ctx.strokeStyle = ROCK_GOLD;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 251, 235, 0.75)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 1.5, 0, Math.PI * 2);
    ctx.stroke();

    // 3D 구체 광택 (Specular Shine - 상단 앞쪽)
    const shineX = cx - radius * 0.32;
    const shineY = cy - radius * 0.35;
    ctx.fillStyle = ROCK_WHITE;
    ctx.beginPath();
    ctx.ellipse(shineX, shineY, radius * 0.28, radius * 0.16, -0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 3. 지면 마찰 흙먼지 & 자갈 튀김 파티클 (Ground Dust & Friction Debris)
  // --------------------------------------------------------------------------
  if (dustIntensity > 0.05 && uncurlProg < 0.8) {
    ctx.save();
    const dustCount = Math.round(8 * dustIntensity);
    const groundY = cy + radius - 2;

    for (let i = 0; i < dustCount; i++) {
      // 굴러가는 반대 방향으로 흙먼지 비산
      const dirX = isPlayer ? -1 : 1;
      const spreadX = (i * 7.5 + 4) * dirX;
      const spreadY = (Math.sin(i * 1.7 + spinAngle) * 5) - (i * 1.2);
      // 알갱이 크기: 중심은 뚜렷하고 외곽은 부드럽게 사라지는 모래먼지 입자
      const dSize = 3.6 + (i % 4) * 1.8;
      const dAlpha = Math.max(0, 0.85 - (i / dustCount) * 0.5) * (1.0 - uncurlProg);
      const colType: "pale" | "warm" | "amber" | "dark" =
        i % 4 === 0 ? "pale" : (i % 4 === 1 ? "warm" : (i % 4 === 2 ? "amber" : "dark"));

      drawGradientDustGrain(ctx, cx + spreadX, groundY + spreadY, dSize, colType, dAlpha);

      // 추가 미세 모래먼지 알갱이 (위쪽으로 살짝 피어오르는 미세 입자)
      if (i % 2 === 0) {
        const microX = cx + (spreadX * 0.75) + (Math.cos(i * 2.3) * 3);
        const microY = groundY + spreadY - (3 + (i % 3) * 2.5);
        const microSize = 2.4 + (i % 3) * 1.2;
        const microAlpha = dAlpha * 0.75;
        drawGradientDustGrain(ctx, microX, microY, microSize, "pale", microAlpha);
      }
    }
    ctx.restore();
  }


  // --------------------------------------------------------------------------
  // 5. 피격 대상 타격 순간 임팩트 연출 (Strike Hit Burst)
  // --------------------------------------------------------------------------
  if (ENABLE_HIT_EFFECT && hitProg > 0.02 && hitProg <= 1.0) {
    const tx = targetPos.x;
    const ty = targetPos.y;

    ctx.save();

    // 4-1. 대형 다이내믹 스타버스트 충격파
    drawStarburstImpact(ctx, tx, ty, ROCK_DARK, ROCK_GOLD, 38 + hitProg * 14);

    // 4-2. 8방향 비산하는 암석 파편 (Rock Shards)
    const shardCount = 8;
    for (let i = 0; i < shardCount; i++) {
      const ang = (i / shardCount) * Math.PI * 2 + 0.25;
      const dist = 16 + hitProg * 36;
      const sx = tx + Math.cos(ang) * dist;
      const sy = ty + Math.sin(ang) * dist * 0.85;
      const shardSize = Math.max(2, 6 * (1.0 - hitProg * 0.6));

      ctx.fillStyle = i % 2 === 0 ? ROCK_GOLD : ROCK_BROWN;
      ctx.beginPath();
      ctx.moveTo(sx, sy - shardSize);
      ctx.lineTo(sx + shardSize * 0.8, sy);
      ctx.lineTo(sx, sy + shardSize);
      ctx.lineTo(sx - shardSize * 0.8, sy);
      ctx.closePath();
      ctx.fill();
    }

    // 4-3. 코어 십자 다이아몬드 섬광
    if (hitProg < 0.6) {
      drawMiniRetroStar(ctx, tx, ty, 28 * (1.0 - hitProg), ROCK_WHITE, 0);
      drawMiniRetroStar(ctx, tx, ty, 18 * (1.0 - hitProg), ROCK_LIGHT, Math.PI / 4);
    }

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 5. 복귀 후 웅크림 해제 파티클 (Uncurl Dissipate)
  // --------------------------------------------------------------------------
  if (uncurlProg > 0.1 && uncurlProg <= 1.0) {
    ctx.save();
    const puffCount = 7;
    const pDist = 18 + uncurlProg * 26;
    const pAlpha = Math.max(0, (1.0 - uncurlProg) * 0.85);

    for (let i = 0; i < puffCount; i++) {
      const ang = (i / puffCount) * Math.PI * 2;
      const px = cx + Math.cos(ang) * pDist;
      const py = cy + Math.sin(ang) * pDist * 0.75;
      const pSize = 4.5 + (1.0 - uncurlProg) * 3.5;
      const colType: "pale" | "warm" | "amber" = i % 3 === 0 ? "pale" : (i % 3 === 1 ? "warm" : "amber");

      drawGradientDustGrain(ctx, px, py, pSize, colType, pAlpha);
    }
    ctx.restore();
  }

  ctx.restore();
}

// ============================================================================
// 🗡️ 206: 칼등치기 (False Swipe / みねうち) - 노말 타입 물리 기술
//
// 상대의 HP가 반드시 1만큼 남도록 칼등으로 조절하여 공격한다.
//
// [연출 기승전결 시퀀스]:
// 1. [발도세 & 칼자루 섬광]: 시전자 웅크림 & 칼자루/손끝에 찰나의 은청색 십자 별빛 섬광 (✦)
// 2. [칼등 반전 & 쾌속 쇄도]: 전방 고속 쇄도 & 상대 전면에 은빛/푸른빛 유려한 카타나 칼등 참격호 전개
// 3. [챙!! 칼등 직격 & 십자 메탈릭 글린트]: 날카로운 십자 섬광 + 둔탁한 칼등 충격파 펄스 + 스파크 비산
// 4. [납도 & 잔향 소산]: 참격호와 스파크가 부드럽게 기화 소산 & 상대 포켓몬 HP 1로 생존 안정화
// ============================================================================

/**
 * 1. 카타나 칼등 참격호 렌더러 (Sleek Silver-Blue False Swipe Blade Arc)
 * - 윗면은 두껍고 묵직한 칼등(Spine) 능선, 아랫면은 날카로운 0px 바늘 수렴
 * - 은백색 ~ 하늘빛 ~ 코발트 블루 메탈릭 그라데이션
 */
function drawFalseSwipeBlade(
  ctx: any,
  cx: number,
  cy: number,
  angle: number,
  length: number = 200,
  thickness: number = 13.0,
  progress: number = 1.0,
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

  // [유저 요청 피드백]: 좌하단(-halfL)만 뾰족하지 않고 뭉툭하게(blunt & rounded), 우상단(+halfL)은 날카롭게(sharp)
  const bluntR = Math.min(5.6, halfThick * 0.90);
  const actualBluntR = Math.min(bluntR, halfL * 0.85);

  // 1-1. 외곽 은청색 대기 찢김 바람 베일 (좌측 라운드 바깥으로 테두리가 돌출되지 않도록 일치)
  const auraW = thickness * 1.7;
  const auraHalfThick = auraW * 0.5;
  const auraR = actualBluntR * 0.95;
  const auraGrad = ctx.createLinearGradient(-halfL, 0, halfL, 0);
  auraGrad.addColorStop(0.0, "rgba(56, 189, 248, 0.20)");
  auraGrad.addColorStop(0.30, "rgba(224, 242, 254, 0.40)");
  auraGrad.addColorStop(0.70, "rgba(2, 132, 199, 0.30)");
  auraGrad.addColorStop(1.0, "rgba(2, 132, 199, 0.0)");

  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(-halfL, 0, auraR, Math.PI * 0.5, Math.PI * 1.5, false);
  ctx.bezierCurveTo(-halfL * 0.35, -auraHalfThick * 1.15, halfL * 0.40, -auraHalfThick * 0.70, halfL * 1.05, 0);
  ctx.bezierCurveTo(halfL * 0.40, auraHalfThick * 0.70, -halfL * 0.35, auraHalfThick * 1.05, -halfL, auraR);
  ctx.closePath();
  ctx.fill();

  // 1-2. 메인 강철 실버-블루 칼등 블레이드 (좌측은 뭉툭한 라운드 캡, 우측은 날카로운 칼끝)
  // [유저 요청]: 동그란 끝부분에 border 없이 깔끔하게 일체형으로 이어지도록 테두리선(stroke) 제거
  const bladeGrad = ctx.createLinearGradient(-halfL - actualBluntR, 0, halfL, 0);
  bladeGrad.addColorStop(0.0, "#BAE6FD");  // 부드러운 스카이 블루 (테두리선 느낌 제거)
  bladeGrad.addColorStop(0.20, "#7DD3FC");
  bladeGrad.addColorStop(0.50, "#38BDF8"); // 청명한 시안 블루
  bladeGrad.addColorStop(0.82, "#0284C7"); // 딥 코발트
  bladeGrad.addColorStop(1.0, "#1D4ED8");  // 로열 블루 (우측 날카로운 끝)

  ctx.fillStyle = bladeGrad;
  ctx.beginPath();
  // 좌측 뭉툭한 반원형 캡 (6시 -> 9시 -> 12시)
  ctx.arc(-halfL, 0, actualBluntR, Math.PI * 0.5, Math.PI * 1.5, false);
  // 상부 호선 (12시 좌측 뭉툭한 끝 -> 우측 0px 날카로운 칼끝)
  ctx.bezierCurveTo(-halfL * 0.35, -halfThick * 1.10, halfL * 0.40, -halfThick * 0.65, halfL, 0);
  // 하부 호선 (우측 0px 날카로운 칼끝 -> 6시 좌측 뭉툭한 끝)
  ctx.bezierCurveTo(halfL * 0.40, halfThick * 0.60, -halfL * 0.35, halfThick * 0.95, -halfL, actualBluntR);
  ctx.closePath();
  ctx.fill();

  // 1-3. 중심 백열 순백 코어 (Razor Core: 좌측 뭉툭 라운드, 우측 날카로운 수렴)
  const coreHalfL = halfL * 0.94;
  const coreHalfThick = halfThick * 0.42;
  const coreBluntR = actualBluntR * 0.46;

  ctx.save();
  ctx.shadowColor = "rgba(56, 189, 248, 0.80)";
  ctx.shadowBlur = 5;
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(-coreHalfL, 0, coreBluntR, Math.PI * 0.5, Math.PI * 1.5, false);
  ctx.bezierCurveTo(-coreHalfL * 0.35, -coreHalfThick * 1.05, coreHalfL * 0.40, -coreHalfThick * 0.60, coreHalfL, 0);
  ctx.bezierCurveTo(coreHalfL * 0.40, coreHalfThick * 0.60, -coreHalfL * 0.35, coreHalfThick * 0.95, -coreHalfL, coreBluntR);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * 2. '챙!!' 칼등 타격 순간 십자 메탈릭 글린트 & 둔탁한 충격파 펄스
 */
function drawFalseSwipeImpactGlint(
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

  // 2-1. 은은한 블루 코로나 헤일로 (Impact Halo)
  const coronaGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coronaR);
  coronaGrad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  coronaGrad.addColorStop(0.25, "rgba(224, 242, 254, 0.95)");
  coronaGrad.addColorStop(0.60, "rgba(56, 189, 248, 0.70)");
  coronaGrad.addColorStop(0.85, "rgba(2, 132, 199, 0.35)");
  coronaGrad.addColorStop(1.0, "rgba(2, 132, 199, 0.0)");

  ctx.fillStyle = coronaGrad;
  ctx.beginPath();
  ctx.arc(0, 0, coronaR, 0, Math.PI * 2);
  ctx.fill();

  // 2-2. 둔탁한 칼등 충격파 호 (Blunt Spine Shockwave Arc)
  ctx.save();
  ctx.rotate(angle);
  const waveR = 26 * scale;
  ctx.strokeStyle = "rgba(186, 230, 253, 0.85)";
  ctx.lineWidth = 2.8 * scale;
  ctx.beginPath();
  ctx.arc(0, 0, waveR, -Math.PI * 0.65, Math.PI * 0.65);
  ctx.stroke();

  ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
  ctx.lineWidth = 1.5 * scale;
  ctx.beginPath();
  ctx.arc(0, 0, waveR + 5 * scale, -Math.PI * 0.55, Math.PI * 0.55);
  ctx.stroke();
  ctx.restore();

  // 2-3. '챙!' 칼등 금속 십자 섬광 (Metallic Cross Glint)
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
 * 3. 비산하는 은청색 메탈릭 스파크 (Flying Cyan-Steel Sparks)
 */
const FALSE_SWIPE_SPARKS = [
  { angle: -Math.PI * 0.60, speed: 72, r: 3.0, col: "#FFFFFF" },
  { angle: -Math.PI * 0.40, speed: 88, r: 3.4, col: "#BAE6FD" },
  { angle: -Math.PI * 0.20, speed: 64, r: 2.6, col: "#38BDF8" },
  { angle: -Math.PI * 0.80, speed: 80, r: 3.2, col: "#E0F2FE" },
  { angle: Math.PI * 0.35,  speed: 74, r: 3.0, col: "#FFFFFF" },
  { angle: Math.PI * 0.55,  speed: 90, r: 3.5, col: "#BAE6FD" },
  { angle: Math.PI * 0.75,  speed: 68, r: 2.8, col: "#38BDF8" },
  { angle: Math.PI * 0.15,  speed: 82, r: 3.1, col: "#E0F2FE" },
];

function drawFalseSwipeSparks(
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

  for (const s of FALSE_SWIPE_SPARKS) {
    const dist = t * s.speed;
    const px = cx + Math.cos(s.angle) * dist;
    const py = cy + Math.sin(s.angle) * dist;

    const shrink = Math.max(0.1, 1.0 - t * 0.8);
    const curR = s.r * shrink;

    ctx.fillStyle = s.col;
    ctx.beginPath();
    ctx.arc(px, py, curR, 0, Math.PI * 2);
    ctx.fill();

    // 스파크 꼬리선
    ctx.strokeStyle = s.col;
    ctx.lineWidth = Math.max(0.6, curR * 0.55);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - Math.cos(s.angle) * (curR * 2.0), py - Math.sin(s.angle) * (curR * 2.0));
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 206: 칼등치기 (False Swipe) 메인 이펙트 렌더러
 */
export function drawFalseSwipeEffect(
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

  // Step 1: 시전자 발도 자세 & 손끝/칼자루 메탈릭 십자 섬광
  if (step === 1) {
    const glintX = isPlayer ? casterPos.x + 22 : casterPos.x - 22;
    const glintY = casterPos.y - 20;
    const glintScale = p * 1.2;
    drawMiniRetroStar(ctx, glintX, glintY, 14 * glintScale, "#FFFFFF", 0);
    drawMiniRetroStar(ctx, glintX, glintY, 8 * glintScale, "#38BDF8", Math.PI / 4);
  }

  // Step 2: 상대 전면 쾌속 은빛-청색 칼등 참격호 전개
  else if (step === 2) {
    drawFalseSwipeBlade(ctx, slashX, slashY, slashAngle, 195, 12.0, p, 1.0);
  }

  // Step 3: '챙!!' 칼등 직격 타격 & 십자 메탈릭 섬광 & 충격파 펄스
  else if (step === 3) {
    const bladeAlpha = Math.max(0, 1.0 - p * 0.6);
    if (bladeAlpha > 0.01) {
      drawFalseSwipeBlade(ctx, slashX, slashY, slashAngle, 195, 12.0, 1.0, bladeAlpha);
    }

    if (isHit) {
      const burstScale = p < 0.4 ? (0.75 + p * 1.4) : (1.3 - (p - 0.4) * 0.7);
      const burstAlpha = Math.max(0, 1.0 - p * 0.75);
      drawFalseSwipeImpactGlint(ctx, slashX, slashY, slashAngle, burstScale, burstAlpha);
      drawFalseSwipeSparks(ctx, slashX, slashY, p * 0.7, 1.0);
    }
  }

  // Step 4: 참격 잔향 소산 & 스파크 비산 페이드아웃
  else if (step === 4) {
    const fade = Math.max(0, 1.0 - p * 1.25);
    if (fade > 0.01) {
      drawFalseSwipeBlade(ctx, slashX, slashY, slashAngle, 195, 10.0, 1.0, fade * 0.6);
    }
    if (isHit && fade > 0.01) {
      drawFalseSwipeSparks(ctx, slashX, slashY, 0.7 + p * 0.3, fade);
    }
  }

  ctx.restore();
}

// ============================================================================
// 💢 207: 뽐내기 (Swagger) - 노말 타입 변화 기술
//
// 상대를 도발하여 공격을 2랭크 올리고 혼란에 빠뜨린다.
//
// [유저 지정 연출 시퀀스]:
// 1. [시전포켓몬 살짝 커짐]: 시전 포켓몬이 가슴을 펴며 체격이 살짝 확대(Scale 1.18x)되어 의기양양한 태세
// 2. [대상포켓몬 붉어짐 & 화난 빠직(💢) 마크 왼쪽 ➔ 오른쪽]:
//    - 대상 포켓몬이 분노로 붉게 페이드인 (eRedLevel / pRedLevel 0.35 ➔ 1.0)
//    - 왼쪽 이마에 빠직(💢) 마크 출현 ('빠직!' 팝인 스파클)
//    - 오른쪽 이마에 2차 빠직(💢) 마크 연쇄 출현
//    - 양쪽 빠직 마크가 맥동하며 대상이 분노로 부들부들 떨림
//    - 대상 붉은기 및 빠직 마크 서서히 페이드아웃 소산
// 3. [공격 2랭크 상승]: 분노로 인해 대상 포켓몬 주변에 붉은색/황금빛 랭크업 오라 구체 솟구침
// 4. [혼란(Confusion) 상태 돌입]: 머리 위 3D 궤도 회전 별무리(★ ★ ★) 공전 & 대상 비틀거림
// ============================================================================

/**
 * 화난 빠직(💢) 마크 렌더러 (Anime Anger Vein Mark)
 * - 4개의 둥근 모퉁이 외곽 만곡선(Corner Elbows)
 * - 딥 크림슨 외곽선(#7F1D1D) + 비비드 레드 바디(#DC2626) + 코어 하이라이트(#FCA5A5)
 * - 팝인 스파클 틱(pop ticks) 지원
/**
 * 화난 빠직(💢) 마크 렌더러
 * - 유저 지정 디자인: 빨간색으로 된 선 4개로 사각형, 꼭짓점들은 일정하게 떨어져 있고 안쪽으로 구부러진 형태
 */
export function drawAngerVeinMark(
  ctx: any,
  cx: number,
  cy: number,
  size: number = 15,
  alpha: number = 1.0,
  popProgress: number = 1.0,
  rot: number = 0
): void {
  if (alpha <= 0.01 || size <= 1) return;

  ctx.save();
  ctx.translate(cx, cy);
  if (rot !== 0) ctx.rotate(rot);
  // 4개의 안쪽으로 구부러진 빨간색 선 (꼭짓점이 일정하게 분리된 사각형)
  const cornerGap = size * 0.32;
  const inwardSag = size * 0.52;

  const traceInwardSquarePaths = () => {
    ctx.beginPath();

    // 1. 상단 선 (좌 ➔ 우, 아래쪽 안으로 구부러짐)
    ctx.moveTo(-size + cornerGap, -size);
    ctx.quadraticCurveTo(0, -size + inwardSag, size - cornerGap, -size);

    // 2. 하단 선 (좌 ➔ 우, 위쪽 안으로 구부러짐)
    ctx.moveTo(-size + cornerGap, size);
    ctx.quadraticCurveTo(0, size - inwardSag, size - cornerGap, size);

    // 3. 좌측 선 (상 ➔ 하, 오른쪽 안으로 구부러짐)
    ctx.moveTo(-size, -size + cornerGap);
    ctx.quadraticCurveTo(-size + inwardSag, 0, -size, size - cornerGap);

    // 4. 우측 선 (상 ➔ 하, 왼쪽 안으로 구부러짐)
    ctx.moveTo(size, -size + cornerGap);
    ctx.quadraticCurveTo(size - inwardSag, 0, size, size - cornerGap);
  };

  // 짙고 선명한 붉은색 선 (버티기와 동일한 rgb(220, 20, 40) 계열 #DC1428)
  ctx.strokeStyle = "#DC1428";
  ctx.lineWidth = Math.max(2.2, size * 0.22);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  traceInwardSquarePaths();
  ctx.stroke();

  ctx.restore();
}

/**
 * 207: 뽐내기 (Swagger) 메인 이펙트 렌더러
 */
export function drawSwaggerEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
): void {
  const isPlayer = drawCtx.isPlayer ?? true;
  const targetPos = drawCtx.targetPos || { x: 380, y: 130 };
  const moveStep = frame.moveStep ?? 1;
  const isHit = drawCtx.isHit !== false;

  const targetHeadX = targetPos.x + (isPlayer ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0));
  const targetHeadY = targetPos.y + (isPlayer ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0)) - (isPlayer ? 30 : 38);

  ctx.save();

  // Step 2: 대상 화난 빠직(💢) 마크 (단일 마크로 집중 연출)
  const ENABLE_ANGER_MARK = true;
  if (ENABLE_ANGER_MARK && moveStep === 2 && isHit) {
    const baseSize = isPlayer ? 16 : 14;

    if (frame.swaggerVein) {
      const v = frame.swaggerVein;
      // 유저 지침: 상대방(적)이면 왼쪽, 내 포켓몬이면 오른쪽
      const vx = targetHeadX + (isPlayer ? -22 : 22);
      const vy = targetHeadY - 12;
      const rot = isPlayer ? -0.16 : 0.16;
      drawAngerVeinMark(ctx, vx, vy, baseSize * (v.scale ?? 1.0), v.alpha ?? 1.0, v.popProgress ?? 1.0, rot);
    }
  }

  // Step 3: 공격 2랭크업 오라 파티클
  if (moveStep === 3 && frame.statProgress !== undefined) {
    const curTargetPos = {
      x: targetPos.x + (isPlayer ? (frame.eOffset?.x ?? 0) : (frame.pOffset?.x ?? 0)),
      y: targetPos.y + (isPlayer ? (frame.eOffset?.y ?? 0) : (frame.pOffset?.y ?? 0)),
    };
    drawStatBoostEffect(ctx, curTargetPos, frame.statProgress);
  }

  // Step 4: 혼란(Confusion) 3D 궤도 회전 별무리
  const confProg = frame.confusionProgress ?? 0;
  if (moveStep === 4 && confProg > 0) {
    drawConfusionEffect(ctx, targetHeadX, targetHeadY - 8, confProg);
  }

  ctx.restore();
}

// ============================================================================
// 🥛 208: 우유마시기 (Milk Drink) - 노말 타입 변화 기술
//
// 자신의 최대 HP 절반을 회복한다. 동료에게 HP를 나누어 줄 수도 있다.
//
// [유저 지정 연출 시퀀스]:
// 1. [우유 마시기 & 모션]:
//    - 시전 포켓몬이 납작해졌다가 길쭉해졌다가 2번 반복 (꿀꺽꿀꺽 음용 모션)
//    - 흰색 필터 (80% 불투명)가 물들고 위에서부터 흰색 필터가 사라지면서 아래로 내려감
// 2. [회복 애니메이션 재생]:
//    - 기술 '회복(Recover)'의 회복 연출 재생 (빛나는 회복 엠블럼 나선 상승 & 체표면 치유 광채)
// ============================================================================

export function drawMilkDrinkEffect(
  ctx: any,
  targetOrFrame: any,
  drawCtxOrStep?: any,
  progressOpt?: number,
  isPlayerOpt?: boolean
): void {
  let frame: BattleFrame | null = null;
  let drawCtx: EffectDrawContext | null = null;

  let isPlayer = true;
  let moveStep = 1;
  let p = 0.5;
  let casterPos = { x: 150, y: 280 };

  if (targetOrFrame && typeof targetOrFrame === "object" && ("moveStep" in targetOrFrame || "phaseId" in targetOrFrame || "showEffect" in targetOrFrame)) {
    frame = targetOrFrame as BattleFrame;
    drawCtx = (drawCtxOrStep as EffectDrawContext) || {};
    isPlayer = drawCtx.isPlayer ?? true;
    casterPos = drawCtx.casterPos || (isPlayer ? { x: 150, y: 280 } : { x: 418, y: 152 });
    moveStep = frame.moveStep ?? 1;
    p = frame.effectProgress ?? 0.5;
  } else if (targetOrFrame && typeof targetOrFrame === "object" && "x" in targetOrFrame) {
    casterPos = targetOrFrame;
    if (typeof drawCtxOrStep === "number") moveStep = drawCtxOrStep;
    if (typeof progressOpt === "number") p = progressOpt;
    if (typeof isPlayerOpt === "boolean") isPlayer = isPlayerOpt;
  }

  ctx.save();

  const bodyCenterY = casterPos.y - (isPlayer ? 10 : 8);

  // Step 2: 회복 애니메이션 재생 (기술 '회복(Recover)' 연출과 완벽 일치)
  if (moveStep === 2) {
    drawRecoveryStarSpiral(ctx, casterPos.x, bodyCenterY, p);
  }

  ctx.restore();
}

