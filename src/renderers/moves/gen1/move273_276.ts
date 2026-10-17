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
  drawStatDropEffect,
  getCometPunchFistImg,
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
// 🌟 273: 희망사항 (Wish / ねがいごと) - 노말 타입 변화 기술
//
// 위력: — / 명중: — / PP: 10 / 대상: 자신 / 접촉: X
// 설명: 밤하늘의 별에 소원을 빈다. 다음 턴 종료 시 사용자 위치의 포켓몬 체력을 최대 HP의 절반만큼 회복한다.
//
// [연출 시퀀스]:
// 1. [Step 1: 밤하늘 유성 횡단 (Shooting Star Streaking Across the Sky)]:
//    - 어두운 밤하늘 비네트가 드리우며 상공에 은은한 별무리 반짝임
//    - 시전자에게 떨어지지 않고 밤하늘 상공을 가로질러 화면 한쪽에서 반대편으로 시원하게 지나가는 유성
// 2. [Step 2: 시전 포켓몬 위로 솟아오르는 소원의 별들 (Rising Wish Stars Over Caster)]:
//    - 유성이 지나간 뒤 시전자 몸 주변에서 머리 위 상공을 향해 다채로운 소원의 별들이 수직 상승
//    - 각 별 아래로 이어지는 상승 빛줄기 꼬리와 발밑의 따스한 축복 파동 링
// 3. [Step 3: 소원별 승천 & 축복의 여운 (Ascending Starlight & Warm Blessing)]:
//    - 시전자 머리 위 높이 계속해서 올라가는 별무리와 반짝이는 별가루가 하늘로 승천하며 마무리
// ============================================================================

/**
 * 부드러운 황금빛 광학 발광 빔 (Yellow Optical Glow Flare Beam)
 * - 105 HP회복(Recover)의 drawGlowBeam(AAFF00/DEFF99)을 노란색(FFD700/FFF899)으로 변환
 */
function drawYellowGlowBeam(
  ctx: any,
  cx: number,
  cy: number,
  length: number,
  width: number,
  angleRad: number,
  alpha: number
) {
  if (alpha <= 0.01 || length <= 0 || width <= 0) return;
  ctx.save();
  ctx.translate(cx, cy);
  if (angleRad !== 0) {
    ctx.rotate(angleRad);
  }

  // 1. 넓고 몽환적인 외곽 FFD700 노란 글로우 (Outer Yellow Healing Bloom)
  ctx.save();
  ctx.scale(length * 1.15, width * 2.1);
  const outerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  outerGrad.addColorStop(0, `rgba(255, 215, 0, ${alpha * 0.40})`);
  outerGrad.addColorStop(0.50, `rgba(255, 215, 0, ${alpha * 0.18})`);
  outerGrad.addColorStop(1, "rgba(255, 215, 0, 0)");
  ctx.fillStyle = outerGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. 중간 메인 광선 (Mid FFF899 -> FFD700 Beam)
  ctx.save();
  ctx.scale(length, width);
  const midGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  midGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.95})`);
  midGrad.addColorStop(0.28, `rgba(255, 248, 153, ${alpha * 0.85})`);
  midGrad.addColorStop(0.65, `rgba(255, 215, 0, ${alpha * 0.48})`);
  midGrad.addColorStop(0.92, `rgba(255, 215, 0, ${alpha * 0.10})`);
  midGrad.addColorStop(1, "rgba(255, 215, 0, 0)");
  ctx.fillStyle = midGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. 중심부 초고휘도 코어 빔 (Core White/FFF899 Needle)
  ctx.save();
  ctx.scale(length * 0.78, Math.max(1.0, width * 0.35));
  const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  coreGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 1.0})`);
  coreGrad.addColorStop(0.45, `rgba(255, 248, 153, ${alpha * 0.90})`);
  coreGrad.addColorStop(1, "rgba(255, 248, 153, 0)");
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * 노란색 HP재생 파티클 엠블럼 (Yellow Recovery Star Emblem)
 * - 105 HP회복(Recover)의 drawRecoveryEmblem 디자인을 그대로 가져와 노란색으로 적용:
 *   1) 외곽 원형 치유 링 (FFD700 외곽 글로우 + FFF899 반투명 림)
 *   2) 4방향 십자형 광학 발광 빔 (소프트 렌즈 플레어)
 *   3) 대각선 다이아몬드 코어 글로우 & 중심부 화이트 핫스팟
 */
function drawYellowRecoveryEmblem(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || size <= 0) return;
  ctx.save();

  // 1. 은은한 FFD700/FFF899 외곽 블룸 (Ambient Bloom)
  const bloomR = size * 1.25;
  const bloomGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, bloomR);
  bloomGrad.addColorStop(0, `rgba(255, 248, 153, ${alpha * 0.45})`);
  bloomGrad.addColorStop(0.50, `rgba(255, 215, 0, ${alpha * 0.24})`);
  bloomGrad.addColorStop(1, "rgba(255, 215, 0, 0)");
  ctx.fillStyle = bloomGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, bloomR, 0, Math.PI * 2);
  ctx.fill();

  // 2. 외곽 원형 치유 링 (반투명 광학 링)
  const ringR = size * 0.52;
  const rOuter = ringR + size * 0.20;
  const rInner = Math.max(1, ringR - size * 0.18);
  const peakT = ringR / rOuter;
  const innerT = rInner / rOuter;

  const ringGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rOuter);
  ringGrad.addColorStop(0, "rgba(255, 215, 0, 0)");
  ringGrad.addColorStop(innerT * 0.70, "rgba(255, 215, 0, 0)");
  ringGrad.addColorStop(innerT + (peakT - innerT) * 0.45, `rgba(255, 215, 0, ${alpha * 0.16})`);
  ringGrad.addColorStop(peakT, `rgba(255, 248, 153, ${alpha * 0.38})`);
  ringGrad.addColorStop(peakT + (1.0 - peakT) * 0.45, `rgba(255, 215, 0, ${alpha * 0.16})`);
  ringGrad.addColorStop(1.0, "rgba(255, 215, 0, 0)");

  ctx.fillStyle = ringGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
  ctx.fill();

  // 3. 중심부 대각선 다이아몬드 글로우 (Soft Diamond Core Fill)
  const diagLen = size * 0.38;
  const diagWidth = Math.max(2.0, size * 0.16);
  drawYellowGlowBeam(ctx, cx, cy, diagLen, diagWidth, Math.PI / 4, alpha * 0.70);
  drawYellowGlowBeam(ctx, cx, cy, diagLen, diagWidth, -Math.PI / 4, alpha * 0.70);

  // 4. 4방향 십자형 메인 광학 발광 빔 (Cross Flare Glow Beams)
  const rayLen = size;
  const rayWidth = Math.max(2.8, size * 0.22);
  drawYellowGlowBeam(ctx, cx, cy, rayLen, rayWidth, 0, alpha);           // 수평선 (좌우)
  drawYellowGlowBeam(ctx, cx, cy, rayLen, rayWidth, Math.PI / 2, alpha); // 수직선 (상하)

  // 5. 중심부 퓨어 화이트 핫스팟 (Pure White Core Hotspot)
  const coreR = Math.max(2.5, size * 0.20);
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
  coreGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 1.0})`);
  coreGrad.addColorStop(0.45, `rgba(255, 248, 153, ${alpha * 0.90})`);
  coreGrad.addColorStop(1, "rgba(255, 215, 0, 0)");
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawWishBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showBehindEffect && !frame.showEffect) return;
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const pos = getCasterPos(drawCtx, frame);

  // --------------------------------------------------------------------------
  // [Step 1: 밤하늘 비네트 & 상공의 은은한 별빛]
  // --------------------------------------------------------------------------
  if (step === 1) {
    ctx.save();
    const darkAlpha = Math.sin(Math.min(1, prog * 1.15) * Math.PI * 0.75) * 0.55;
    const grad = ctx.createRadialGradient(pos.cx, pos.cy - 60, 30, pos.cx, pos.cy, 260);
    grad.addColorStop(0, "rgba(15, 23, 42, 0.0)");
    grad.addColorStop(0.7, `rgba(15, 23, 42, ${darkAlpha * 0.6})`);
    grad.addColorStop(1, `rgba(10, 15, 30, ${darkAlpha})`);
    ctx.fillStyle = grad;
    ctx.fillRect(-2000, -2000, 5000, 5000);

    // 밤하늘 상공의 미세 반짝이 배경 별
    const skyBaseY = pos.cy - (pos.isP ? 115 : 75);
    const twinkleCount = 7;
    for (let i = 0; i < twinkleCount; i++) {
      const tx = pos.cx - 140 + ((i * 47) % 280);
      const ty = skyBaseY - 20 + ((i * 23) % 50);
      const tAlpha = Math.sin(prog * 5 + i * 1.7) * 0.5 + 0.5;
      if (tAlpha > 0.2) {
        drawMiniRetroStar(ctx, tx, ty, 3.2, `rgba(254, 240, 138, ${tAlpha * 0.75})`);
      }
    }
    ctx.restore();
    return;
  }

  // --------------------------------------------------------------------------
  // [Step 2 & 3 통합: 바닥 링(선에 내부 투명 그라데이션) & 단 1회 노란 치유 광채]
  // --------------------------------------------------------------------------
  if (step === 2 || step === 3) {
    ctx.save();
    const u = step === 2 ? prog * 0.62 : 0.62 + prog * 0.38;

    // Step 1 밤하늘 잔향 자연스럽게 페이드아웃
    const skyFade = Math.max(0, (1.0 - u * 2.5) * 0.28);
    if (skyFade > 0.01) {
      ctx.fillStyle = `rgba(15, 23, 42, ${skyFade})`;
      ctx.fillRect(-2000, -2000, 5000, 5000);
    }

    // 1) 바닥의 링: 선(stroke) 자체에 내부 투명 그라데이션 적용 (안쪽 경계 0 -> 바깥쪽 경계 불투명)
    const ringAlpha = Math.sin(u * Math.PI) * 0.75;
    if (ringAlpha > 0.02) {
      ctx.save();
      ctx.translate(pos.cx, pos.groundY);
      ctx.scale(1.0, 0.38); // 3D 지면 타원

      // 메인 외곽 바닥 링 (선에 내부 투명 그라데이션)
      const rOuter1 = 22 + u * 38;
      const bandW1 = 10;
      const rInner1 = Math.max(1, rOuter1 - bandW1);
      const midR1 = (rInner1 + rOuter1) * 0.5;

      const lineGrad1 = ctx.createRadialGradient(0, 0, rInner1, 0, 0, rOuter1);
      lineGrad1.addColorStop(0.0, "rgba(255, 215, 0, 0.0)");
      lineGrad1.addColorStop(0.45, `rgba(255, 215, 0, ${ringAlpha * 0.40})`);
      lineGrad1.addColorStop(0.82, `rgba(253, 224, 71, ${ringAlpha * 0.82})`);
      lineGrad1.addColorStop(1.0, `rgba(255, 248, 153, ${ringAlpha})`);

      ctx.strokeStyle = lineGrad1;
      ctx.lineWidth = rOuter1 - rInner1;
      ctx.beginPath();
      ctx.arc(0, 0, midR1, 0, Math.PI * 2);
      ctx.stroke();

      // 보조 안쪽 바닥 링 (선에 내부 투명 그라데이션)
      const rOuter2 = rOuter1 * 0.68;
      const bandW2 = 7;
      const rInner2 = Math.max(1, rOuter2 - bandW2);
      const midR2 = (rInner2 + rOuter2) * 0.5;

      const lineGrad2 = ctx.createRadialGradient(0, 0, rInner2, 0, 0, rOuter2);
      lineGrad2.addColorStop(0.0, "rgba(255, 215, 0, 0.0)");
      lineGrad2.addColorStop(0.50, `rgba(255, 215, 0, ${ringAlpha * 0.30})`);
      lineGrad2.addColorStop(1.0, `rgba(253, 224, 71, ${ringAlpha * 0.75})`);

      ctx.strokeStyle = lineGrad2;
      ctx.lineWidth = rOuter2 - rInner2;
      ctx.beginPath();
      ctx.arc(0, 0, midR2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    // 2) 포켓몬 체표면 노란 치유 광채 (1회 부드럽게 피어올랐다 소멸)
    const bodyGlowAlpha = Math.sin(u * Math.PI) * 0.32;
    if (bodyGlowAlpha > 0.02) {
      const bGrad = ctx.createRadialGradient(pos.cx, pos.cy, 0, pos.cx, pos.cy, 30);
      bGrad.addColorStop(0, `rgba(255, 248, 153, ${bodyGlowAlpha * 0.75})`);
      bGrad.addColorStop(0.5, `rgba(255, 215, 0, ${bodyGlowAlpha * 0.45})`);
      bGrad.addColorStop(1, "rgba(255, 215, 0, 0)");
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.arc(pos.cx, pos.cy, 30, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function drawWishEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const pos = getCasterPos(drawCtx, frame);

  // --------------------------------------------------------------------------
  // [Step 1: 화면 상공을 가로질러 지나가는 유성 (Shooting Star Across the Sky)]
  // --------------------------------------------------------------------------
  if (step === 1) {
    ctx.save();
    // 시전자에게 도달하지 않고 화면 상공을 한쪽 끝에서 반대쪽 끝으로 시원하게 가로질러 지나감
    const dir = pos.isP ? 1 : -1;
    const startX = pos.cx - dir * 175;
    const endX = pos.cx + dir * 225;
    const startY = pos.cy - (pos.isP ? 132 : 86);
    const endY = pos.cy - (pos.isP ? 88 : 56);

    // 완만한 포물선 아치를 그리며 상공을 빠르게 통과
    const curX = startX + (endX - startX) * prog;
    const arcLift = Math.sin(prog * Math.PI) * 14;
    const curY = startY + (endY - startY) * prog - arcLift;

    // 진입 및 이탈 시 자연스러운 알파 페이드
    const edgeAlpha =
      prog < 0.12
        ? Math.max(0.2, prog / 0.12)
        : prog > 0.85
          ? Math.max(0.15, (1.0 - prog) / 0.15)
          : 1.0;

    const tailLen = 88 * Math.min(1.0, 0.35 + prog * 0.9);
    const dirX = endX - startX;
    const dirY = endY - startY;
    const dist = Math.hypot(dirX, dirY) || 1;
    const ndx = dirX / dist;
    const ndy = dirY / dist;

    // 유성 긴 꼬리 스트로크 (외곽 노란 글로우 + 중심 순백 코어)
    const tailX = curX - ndx * tailLen;
    const tailY = curY - ndy * tailLen + arcLift * 0.25;

    const outerTailGrad = ctx.createLinearGradient(tailX, tailY, curX, curY);
    outerTailGrad.addColorStop(0.0, "rgba(255, 215, 0, 0.0)");
    outerTailGrad.addColorStop(0.45, `rgba(255, 215, 0, ${0.45 * edgeAlpha})`);
    outerTailGrad.addColorStop(1.0, `rgba(255, 248, 153, ${0.85 * edgeAlpha})`);

    ctx.strokeStyle = outerTailGrad;
    ctx.lineWidth = 5.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(curX, curY);
    ctx.stroke();

    const coreTailGrad = ctx.createLinearGradient(tailX, tailY, curX, curY);
    coreTailGrad.addColorStop(0.0, "rgba(255, 215, 0, 0.0)");
    coreTailGrad.addColorStop(0.6, `rgba(255, 248, 153, ${0.8 * edgeAlpha})`);
    coreTailGrad.addColorStop(1.0, `rgba(255, 255, 255, ${0.98 * edgeAlpha})`);

    ctx.strokeStyle = coreTailGrad;
    ctx.lineWidth = 2.8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(curX, curY);
    ctx.stroke();

    // 상공을 가로지르는 유성 헤드 (노란색 HP재생 파티클 엠블럼)
    const headSize = 20 + Math.sin(prog * Math.PI) * 3;
    drawYellowRecoveryEmblem(ctx, curX, curY, headSize, edgeAlpha);
    ctx.restore();
    return;
  }

  // --------------------------------------------------------------------------
  // [Step 2 & 3 통합: 시전 포켓몬 위로 단 1회 올라가는 노란 회복별 파티클]
  // - 두 번에 걸쳐 올라오지 않도록 Step 2~3을 단일 진행도(u: 0.0 -> 1.0)로 통합
  // - 회복(Recover)의 HP재생 파티클(drawRecoveryEmblem)을 노란색으로 적용
  // --------------------------------------------------------------------------
  if (step === 2 || step === 3) {
    ctx.save();
    const u = step === 2 ? prog * 0.62 : 0.62 + prog * 0.38;

    const WISH_STARS = [
      { dx: -28, startOffY: 14, riseDist: 68, size: 18, spawnT: 0.00, duration: 0.55 },
      { dx:  28, startOffY: 16, riseDist: 68, size: 17, spawnT: 0.15, duration: 0.55 },
      { dx:   8, startOffY: 20, riseDist: 70, size: 19, spawnT: 0.30, duration: 0.55 },
      { dx: -16, startOffY: 10, riseDist: 66, size: 17, spawnT: 0.44, duration: 0.55 },
    ];

    for (let i = 0; i < WISH_STARS.length; i++) {
      const s = WISH_STARS[i];
      if (u < s.spawnT) continue;
      const relT = (u - s.spawnT) / s.duration;
      if (relT >= 1.0) continue;

      const sx = pos.cx + s.dx;
      const sy = pos.cy + s.startOffY - Math.pow(relT, 1.15) * s.riseDist;

      // 발밑 생성 시 페이드인(0~0.16) ➔ 상공으로 올라가며 투명해져 소멸(0.16~1.0)
      let starAlpha = 1.0;
      if (relT < 0.16) {
        starAlpha = relT / 0.16;
      } else {
        starAlpha = Math.max(0, 1.0 - (relT - 0.16) / 0.84);
      }

      drawYellowRecoveryEmblem(ctx, sx, sy, s.size, starAlpha);
    }

    ctx.restore();
  }
}

// ============================================================================
// 🐾 274: 조수 (Assist / ねこのて) - 노말 타입 변화 기술
//
// 위력: — / 명중: — / PP: 20 / 대상: 자신 / 접촉: X
// 설명: 서둘러 동료의 도움을 받아 파티 멤버가 기억하고 있는 기술 중 하나를 랜덤으로 쓴다.
//
// [연출 시퀀스 (원작 'ねこのて(고양이의 손)' 고증)]:
// 1. [Step 1: 바쁜 도움 요청 & 고양이 손 스탬프 시동]:
//    - 시전자가 좌우로 종종거리며 동료들에게 다급히 도움을 요청
//    - 시전자 좌/우 상단에 복슬복슬한 크림빛 고양이 앞발과 분홍 젤리 육구(🐾)가 탄성 있게 '팡! 팡!' 스탬프
// 2. [Step 2: 다다다닥! 고양이 손 총출동 릴레이]:
//    - 사방에서 동료들의 고양이 손 스탬프가 연달아 통통통 찍히며 폭신한 스탬프 퍼프와 반짝이 발생
// 3. [Step 3: 기술 추첨 완료 & 영감의 스타 스파클]:
//    - 머리 위 중앙에 마지막 고양이 손이 '짝!' 찍히며 황금빛 4각 다이아몬드 스타 스파클이 반짝이고 시전 태세 완료
// ============================================================================

/**
 * 4각 다이아몬드 반짝이 (✦) 렌더러
 */
function drawAssistDiamondGlint(
  ctx: any,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  color: string,
  alpha: number,
  rot: number = 0
) {
  if (alpha <= 0.02 || outerR <= 0.5) return;
  ctx.save();
  ctx.translate(cx, cy);
  if (rot !== 0) ctx.rotate(rot);

  // 은은한 후광
  const glowR = outerR * 1.4;
  const gGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR);
  gGrad.addColorStop(0.0, `rgba(255, 255, 255, ${alpha * 0.75})`);
  gGrad.addColorStop(0.5, `rgba(253, 224, 71, ${alpha * 0.35})`);
  gGrad.addColorStop(1.0, "rgba(253, 224, 71, 0.0)");
  ctx.fillStyle = gGrad;
  ctx.beginPath();
  ctx.arc(0, 0, glowR, 0, Math.PI * 2);
  ctx.fill();

  // 4각 별 본체
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * 고양이 손이 '팡!' 찍힐 때 뒤에서 퍼지는 폭신한 스탬프 임팩트 퍼프
 */
function drawPawStampPuff(
  ctx: any,
  cx: number,
  cy: number,
  baseR: number,
  localT: number,
  alpha: number
) {
  if (localT > 0.55 || alpha <= 0.02) return;
  const puffProg = localT / 0.55;
  const puffAlpha = Math.sin(puffProg * Math.PI) * alpha * 0.75;
  if (puffAlpha <= 0.02) return;

  ctx.save();
  ctx.translate(cx, cy);

  const puffCount = 6;
  const dist = baseR * (0.65 + puffProg * 0.75);
  const puffR = baseR * 0.32 * (1.0 - puffProg * 0.45);

  for (let i = 0; i < puffCount; i++) {
    const ang = (i * Math.PI * 2) / puffCount + 0.3;
    const px = Math.cos(ang) * dist;
    const py = Math.sin(ang) * dist;

    const pGrad = ctx.createRadialGradient(px, py, 0, px, py, puffR);
    pGrad.addColorStop(0.0, `rgba(255, 255, 255, ${puffAlpha * 0.9})`);
    pGrad.addColorStop(0.6, `rgba(254, 243, 199, ${puffAlpha * 0.5})`);
    pGrad.addColorStop(1.0, "rgba(254, 243, 199, 0.0)");

    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(px, py, puffR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * 🐾 고양이 발자국(Pawprint) 스탬프 렌더러
 * - 흰색 앞발 털 바디 없이, 중앙 3엽 발바닥 패드와 4개의 발가락 도장만 선명한 검정색 발자국(🐾)으로 표시
 */
function drawCatPawStamp(
  ctx: any,
  cx: number,
  cy: number,
  size: number,
  rot: number,
  alpha: number,
  _tintVariant: number = 0
) {
  if (alpha <= 0.01 || size <= 0.5) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);

  // 발가락 4개 도장 위치 및 크기 (중앙 발바닥 패드와 깔끔한 간격 유지)
  const toes = [
    { x: -size * 0.52, y: -size * 0.16, rx: size * 0.16, ry: size * 0.22, a: -0.42 },
    { x: -size * 0.19, y: -size * 0.40, rx: size * 0.17, ry: size * 0.23, a: -0.14 },
    { x:  size * 0.19, y: -size * 0.40, rx: size * 0.17, ry: size * 0.23, a:  0.14 },
    { x:  size * 0.52, y: -size * 0.16, rx: size * 0.16, ry: size * 0.22, a:  0.42 },
  ];

  // 검정색 발자국 스탬프 그라데이션 (진한 먹색/블랙)
  const padGrad = ctx.createRadialGradient(0, size * 0.05, size * 0.02, 0, size * 0.10, size * 0.60);
  padGrad.addColorStop(0.0, `rgba(30, 30, 36, ${alpha})`);
  padGrad.addColorStop(0.6, `rgba(12, 12, 16, ${alpha})`);
  padGrad.addColorStop(1.0, `rgba(0, 0, 0, ${alpha})`);

  ctx.fillStyle = padGrad;

  // 1. 가운데 3엽 메인 발바닥 패드 (Main Tri-lobed Paw Pad)
  // 상단 중앙 볼록 로브
  ctx.beginPath();
  ctx.ellipse(0, size * 0.12, size * 0.30, size * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  // 좌하단 볼록 로브
  ctx.beginPath();
  ctx.ellipse(-size * 0.18, size * 0.26, size * 0.26, size * 0.20, 0.28, 0, Math.PI * 2);
  ctx.fill();
  // 우하단 볼록 로브
  ctx.beginPath();
  ctx.ellipse(size * 0.18, size * 0.26, size * 0.26, size * 0.20, -0.28, 0, Math.PI * 2);
  ctx.fill();

  // 2. 발가락 4개의 발자국 콩 (4 Toe Beans)
  for (const t of toes) {
    ctx.beginPath();
    ctx.ellipse(t.x, t.y, t.rx, t.ry, t.a, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 스탬프 애니메이션 곡선 계산 헬퍼 (위에서 '팡!' 찍히는 탄성 스케일 및 알파)
 */
function evalPawStampAnim(localT: number) {
  if (localT <= 0 || localT >= 1.0) return { scale: 0, alpha: 0, tapY: 0 };

  let scale = 1.0;
  let tapY = 0;
  if (localT < 0.18) {
    // 위에서 빠르게 쾅 찍힘 (1.35 -> 0.90)
    const u = localT / 0.18;
    scale = 1.35 - 0.45 * u;
    tapY = -6 * (1.0 - u);
  } else if (localT < 0.36) {
    // 쫀득한 탄성 리바운드 (0.90 -> 1.08 -> 1.00)
    const u = (localT - 0.18) / 0.18;
    scale = 0.90 + Math.sin(u * Math.PI) * 0.18 + u * 0.10;
  } else if (localT < 0.76) {
    // 유지하며 살짝 까딱거림
    scale = 1.0;
  } else {
    // 부드럽게 축소 소멸
    const u = (localT - 0.76) / 0.24;
    scale = 1.0 - u * 0.25;
  }

  const alpha =
    localT < 0.12
      ? localT / 0.12
      : localT > 0.74
        ? Math.max(0, (1.0 - localT) / 0.26)
        : 1.0;

  return { scale, alpha, tapY };
}

export function drawAssistBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showBehindEffect && !frame.showEffect) return;
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const pos = getCasterPos(drawCtx, frame);

  // 단색 링이나 작위적인 도형 없이, 시전자 뒤편에 은은하고 따뜻한 앰비언트 백라이트만 부여
  ctx.save();
  const glowAlpha =
    step === 1
      ? Math.sin(prog * Math.PI * 0.5) * 0.22
      : step === 2
        ? 0.22 + Math.sin(prog * Math.PI) * 0.12
        : Math.max(0, (1.0 - prog) * 0.28);

  if (glowAlpha > 0.01) {
    const glowR = 42 + (step === 3 ? prog * 14 : 0);
    const grad = ctx.createRadialGradient(pos.cx, pos.cy, 4, pos.cx, pos.cy, glowR);
    grad.addColorStop(0.0, `rgba(254, 249, 195, ${glowAlpha})`);
    grad.addColorStop(0.55, `rgba(253, 224, 71, ${glowAlpha * 0.5})`);
    grad.addColorStop(1.0, "rgba(253, 224, 71, 0.0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pos.cx, pos.cy, glowR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawAssistEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const pos = getCasterPos(drawCtx, frame);

  // Step 1 ~ 3을 하나의 연속 진행도(u: 0.0 -> 1.0)로 계산하여 고양이 손 스탬프들이 끊김 없이 이어지도록 구성
  const u =
    step === 1
      ? prog * 0.33
      : step === 2
        ? 0.33 + prog * 0.40
        : 0.73 + prog * 0.27;

  // 시전자 주변에 시차를 두고 '팡! 팡! 다다다닥!' 찍히는 검정 발자국(🐾) 스탬프 배치
  const PAW_STAMPS = [
    // Step 1 구간: 좌상단 & 우상단 첫 발자국
    { dx: -32, dy: -20, size: 22.0, rot: -0.35, spawnU: 0.02, duration: 0.28, variant: 0 },
    { dx:  32, dy: -16, size: 22.0, rot:  0.35, spawnU: 0.16, duration: 0.28, variant: 1 },

    // Step 2 구간: 사방에서 바쁘게 찍히는 동료들의 발자국 릴레이
    { dx: -38, dy:  12, size: 21.0, rot: -0.52, spawnU: 0.30, duration: 0.26, variant: 1 },
    { dx:  38, dy:  10, size: 21.0, rot:  0.52, spawnU: 0.40, duration: 0.26, variant: 0 },
    { dx: -20, dy: -36, size: 23.0, rot: -0.18, spawnU: 0.50, duration: 0.26, variant: 0 },
    { dx:  22, dy: -34, size: 23.0, rot:  0.20, spawnU: 0.60, duration: 0.26, variant: 1 },

    // Step 3 구간: 정중앙 상단에 경쾌하게 '짝!' 찍히는 피날레 발자국
    { dx:   0, dy: -42, size: 25.0, rot:  0.00, spawnU: 0.70, duration: 0.28, variant: 0 },
  ];

  ctx.save();

  for (let i = 0; i < PAW_STAMPS.length; i++) {
    const p = PAW_STAMPS[i];
    if (u < p.spawnU) continue;
    const localT = (u - p.spawnU) / p.duration;
    if (localT >= 1.0) continue;

    const { scale, alpha, tapY } = evalPawStampAnim(localT);
    if (alpha <= 0.01 || scale <= 0.05) continue;

    const px = pos.cx + p.dx;
    const py = pos.cy + p.dy + tapY;
    const wiggleRot = p.rot + Math.sin(localT * Math.PI * 3) * 0.06;

    // 검정 발자국(🐾) 본체 렌더링 (흰색 외곽/털 부분 제거)
    drawCatPawStamp(ctx, px, py, p.size * scale, wiggleRot, alpha, p.variant);

    // 스탬프 주변에 톡 튀는 작은 4각 다이아몬드 반짝이 (✦)
    if (localT > 0.10 && localT < 0.75) {
      const spkProg = (localT - 0.10) / 0.65;
      const spkAlpha = Math.sin(spkProg * Math.PI) * alpha;
      const side = p.dx >= 0 ? 1 : -1;
      const sx = px + side * (p.size * 0.75 + spkProg * 8);
      const sy = py - p.size * 0.55 - spkProg * 6;
      drawAssistDiamondGlint(ctx, sx, sy, 5.5, 1.8, "#FEF08A", spkAlpha, spkProg * 0.8);
    }
  }

  ctx.restore();
}

// ============================================================================
// 🌱 275: 뿌리박기 (Ingrain / ねをはる) - 풀 타입 변화 기술
//
// 위력: — / 명중: — / PP: 20 / 대상: 자신 / 접촉: X
// 설명: 대지에 깊은 뿌리를 내린다. 매 턴마다 HP를 1/16씩 회복하지만, 뿌리를 내렸으므로 교체할 수 없다.
//
// [연출 시퀀스]:
// 1. [Step 1: 대지 접지 & 뿌리 발아 (Ground Stance & Root Sprouting)]:
//    - 시전자가 체중을 실어 바닥에 굳건히 착지 (Squash & Ground Dust)
//    - 발밑에서 싱그러운 흙먼지와 진녹색/우디 브라운 뿌리 가지들이 싹트기 시작
// 2. [Step 2: 깊은 뿌리 결속 & 대지 착근 (Deep Soil Entanglement & Root Anchoring)]:
//    - 좌우로 뻗어나가며 대지 깊숙이 파고드는 유기적인 굵은 나무뿌리 시스템 렌더링
//    - 지면 크랙 라인 & 뿌리 마디마디에서 돋아나는 신선한 에메랄드 새싹 잎사귀
//    - 대지와 완벽하게 일체화되는 풀빛 오라 파동 펄스
// 3. [Step 3: 대지의 양분 흡수 & 생명력 충전 (Nutrient Influx & Verdant Healing Flow)]:
//    - 뿌리 끝에서 시전자의 발과 몸통을 향해 빛을 내며 거슬러 올라가는 에메랄드 수액 펄스
//    - 몸 표면을 타고 하늘로 수직 상승하는 치유의 녹색 십자 스파클과 생명력 오라
// ============================================================================

/**
 * 테두리(border) 없이 시작점이 투명 그라데이션으로 시작해 끝이 뾰족하게 테이퍼링되는 갈색 뿌리 렌더러
 */
function hexToRgbTuple(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim();
  const num = parseInt(clean, 16);
  if (isNaN(num)) return [139, 90, 43];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function drawPointedBrownRoot(
  ctx: any,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  baseWidth: number,
  growProg: number,
  color: string,
  alpha: number,
  isSubRootlet = false
) {
  if (growProg <= 0.02 || alpha <= 0.01) return;
  const clampedProg = Math.max(0.02, Math.min(1.0, growProg));
  const steps = 14;
  const leftPts: Array<{ x: number; y: number }> = [];
  const rightPts: Array<{ x: number; y: number }> = [];

  for (let i = 0; i <= steps; i++) {
    const u = i / steps; // 0.0 (뿌리 시작점) -> 1.0 (뾰족한 끝점)
    const t = u * clampedProg;
    const inv = 1.0 - t;

    // 2차 베지어 곡선 위치
    const bx = inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x;
    const by = inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y;

    // 접선 벡터
    const tx = 2 * inv * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
    const ty = 2 * inv * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
    const len = Math.hypot(tx, ty) || 1.0;
    const nx = -ty / len;
    const ny = tx / len;

    // 시작점(u=0)에서는 굵고 끝점(u=1)에서는 정확히 0이 되어 끝이 뾰족해짐
    const halfW = (baseWidth * 0.5) * Math.pow(1.0 - u, 0.85);
    leftPts.push({ x: bx + nx * halfW, y: by + ny * halfW });
    rightPts.push({ x: bx - nx * halfW, y: by - ny * halfW });
  }

  const tipPt = leftPts[steps];
  const [r, g, b] = hexToRgbTuple(color);
  const clampedAlpha = Math.min(1.0, alpha);

  ctx.save();
  // 주 뿌리 시작점(p0)은 완전 투명(0.0) 그라데이션, 잔뿌리는 원줄기에서 자연스럽게 이어지도록 반투명 시작
  const grad = ctx.createLinearGradient(p0.x, p0.y, tipPt.x, tipPt.y);
  const startA = isSubRootlet ? clampedAlpha * 0.45 : 0.0;
  grad.addColorStop(0.0, `rgba(${r}, ${g}, ${b}, ${startA.toFixed(3)})`);
  grad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${(clampedAlpha * 0.80).toFixed(3)})`);
  grad.addColorStop(0.65, `rgba(${r}, ${g}, ${b}, ${clampedAlpha.toFixed(3)})`);
  grad.addColorStop(1.0, `rgba(${r}, ${g}, ${b}, ${clampedAlpha.toFixed(3)})`);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(leftPts[0].x, leftPts[0].y);
  for (let i = 1; i <= steps; i++) {
    ctx.lineTo(leftPts[i].x, leftPts[i].y);
  }
  for (let i = steps - 1; i >= 0; i--) {
    ctx.lineTo(rightPts[i].x, rightPts[i].y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** 십자형 치유 스파클 렌더러 */
function drawHealCross(ctx: any, cx: number, cy: number, size: number, color: string, alpha: number) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, alpha);
  ctx.fillStyle = color;

  const w = Math.max(1.5, size * 0.32);
  ctx.fillRect(cx - w / 2, cy - size / 2, w, size);
  ctx.fillRect(cx - size / 2, cy - w / 2, size, w);

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(cx - w * 0.5, cy - w * 0.5, w, w);
  ctx.restore();
}

export function drawIngrainBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showBehindEffect && !frame.showEffect) return;
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const pos = getCasterPos(drawCtx, frame);
  const groundLineY = pos.baseY - 2;

  // Step 1에서는 포켓몬이 땅으로 내려가며 박히는 연출만 진행
  if (step === 1) return;

  const growProg = step === 2 ? Math.sin(prog * (Math.PI / 2)) : 1.0;
  const alpha = step === 2 ? 1.0 : Math.max(0, 1.0 - Math.max(0, (prog - 0.65) / 0.35));

  ctx.save();
  if (step === 3) {
    const pulseAlpha = (Math.sin(prog * Math.PI * 2) * 0.2 + 0.6) * Math.max(0, 1.0 - prog * 0.5);
    ctx.save();
    ctx.translate(pos.baseX, groundLineY + 4);
    ctx.scale(1.0, 0.36);
    const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, 48);
    grad.addColorStop(0.0, `rgba(74, 222, 128, ${pulseAlpha * 0.7})`);
    grad.addColorStop(0.7, `rgba(34, 197, 94, ${pulseAlpha * 0.3})`);
    grad.addColorStop(1.0, "rgba(34, 197, 94, 0.0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 뒤쪽 지면(원근상 위쪽 평면)으로 넓고 완만하게 뻗어 박히는 어두운 갈색 뿌리
  drawPointedBrownRoot(
    ctx,
    { x: pos.baseX - 10, y: groundLineY - 10 },
    { x: pos.baseX - 30, y: groundLineY - 14 },
    { x: pos.baseX - 48, y: groundLineY - 3 },
    9.5,
    growProg,
    "#5C3414",
    alpha
  );

  drawPointedBrownRoot(
    ctx,
    { x: pos.baseX + 10, y: groundLineY - 10 },
    { x: pos.baseX + 30, y: groundLineY - 14 },
    { x: pos.baseX + 48, y: groundLineY - 3 },
    9.5,
    growProg,
    "#5C3414",
    alpha
  );

  // 뒤쪽 주 뿌리에서 옆으로 뻗는 잔뿌리 1쌍 (Y축으로 길게 처지지 않고 지면 원근을 따라 수평에 가깝게 뻗음)
  const backTwigGrow = Math.max(0, Math.min(1.0, (growProg - 0.35) / 0.65));
  drawPointedBrownRoot(
    ctx,
    { x: pos.baseX - 28, y: groundLineY - 9 },
    { x: pos.baseX - 42, y: groundLineY - 12 },
    { x: pos.baseX - 56, y: groundLineY - 6 },
    4.2,
    backTwigGrow,
    "#5C3414",
    alpha,
    true
  );

  drawPointedBrownRoot(
    ctx,
    { x: pos.baseX + 28, y: groundLineY - 9 },
    { x: pos.baseX + 42, y: groundLineY - 12 },
    { x: pos.baseX + 56, y: groundLineY - 6 },
    4.2,
    backTwigGrow,
    "#5C3414",
    alpha,
    true
  );
  ctx.restore();
}

export function drawIngrainEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const pos = getCasterPos(drawCtx, frame);
  const groundLineY = pos.baseY - 2;

  // Step 1에서는 포켓몬이 땅으로 내려가며 아랫부분이 잘려 박히는 연출에 집중
  if (step === 1) return;

  const growProg = step === 2 ? Math.sin(prog * (Math.PI / 2)) : 1.0;
  const alpha = step === 2 ? 1.0 : Math.max(0, 1.0 - Math.max(0, (prog - 0.65) / 0.35));

  ctx.save();
  // 좌우 옆면 지면을 따라 입체적인 아치(등줄기 굴곡)를 그리며 얕은 Y낙차로 박히는 갈색 주 뿌리
  drawPointedBrownRoot(
    ctx,
    { x: pos.baseX - 8, y: groundLineY - 8 },
    { x: pos.baseX - 26, y: groundLineY - 11 },
    { x: pos.baseX - 45, y: groundLineY + 2 },
    11.5,
    growProg,
    "#8B5A2B",
    alpha
  );

  drawPointedBrownRoot(
    ctx,
    { x: pos.baseX + 8, y: groundLineY - 8 },
    { x: pos.baseX + 26, y: groundLineY - 11 },
    { x: pos.baseX + 45, y: groundLineY + 2 },
    11.5,
    growProg,
    "#8B5A2B",
    alpha
  );

  // 앞쪽 대각선 지면으로 짧고 입체감 있게 꽂히는 보조 뿌리 (Y축으로 과도하게 길어지지 않도록 압축)
  const innerGrow = Math.max(0, Math.min(1.0, (growProg - 0.15) / 0.85));
  drawPointedBrownRoot(
    ctx,
    { x: pos.baseX - 4, y: groundLineY - 6 },
    { x: pos.baseX - 16, y: groundLineY - 7 },
    { x: pos.baseX - 27, y: groundLineY + 5 },
    9,
    innerGrow,
    "#783F16",
    alpha
  );

  drawPointedBrownRoot(
    ctx,
    { x: pos.baseX + 4, y: groundLineY - 6 },
    { x: pos.baseX + 16, y: groundLineY - 7 },
    { x: pos.baseX + 27, y: groundLineY + 5 },
    9,
    innerGrow,
    "#783F16",
    alpha
  );

  // 주 뿌리/보조 뿌리 중간 마디에서 지면 원근 면을 따라 뻗는 잔뿌리들
  const twigGrow1 = Math.max(0, Math.min(1.0, (growProg - 0.32) / 0.68));
  const twigGrow2 = Math.max(0, Math.min(1.0, (growProg - 0.48) / 0.52));

  // 좌측 바깥 잔뿌리 & 앞쪽 잔뿌리
  drawPointedBrownRoot(
    ctx,
    { x: pos.baseX - 25, y: groundLineY - 6 },
    { x: pos.baseX - 38, y: groundLineY - 8 },
    { x: pos.baseX - 52, y: groundLineY - 1 },
    4.8,
    twigGrow1,
    "#8B5A2B",
    alpha,
    true
  );
  drawPointedBrownRoot(
    ctx,
    { x: pos.baseX - 18, y: groundLineY - 3 },
    { x: pos.baseX - 28, y: groundLineY + 1 },
    { x: pos.baseX - 36, y: groundLineY + 7 },
    4.2,
    twigGrow2,
    "#783F16",
    alpha,
    true
  );

  // 우측 바깥 잔뿌리 & 앞쪽 잔뿌리
  drawPointedBrownRoot(
    ctx,
    { x: pos.baseX + 25, y: groundLineY - 6 },
    { x: pos.baseX + 38, y: groundLineY - 8 },
    { x: pos.baseX + 52, y: groundLineY - 1 },
    4.8,
    twigGrow1,
    "#8B5A2B",
    alpha,
    true
  );
  drawPointedBrownRoot(
    ctx,
    { x: pos.baseX + 18, y: groundLineY - 3 },
    { x: pos.baseX + 28, y: groundLineY + 1 },
    { x: pos.baseX + 36, y: groundLineY + 7 },
    4.2,
    twigGrow2,
    "#783F16",
    alpha,
    true
  );

  // Step 3: 회복 연출 (뿌리 수액 광택 & 치유의 십자 스파클 상승)
  if (step === 3) {
    const pulseOffset = (prog * 2.2) % 1.0;
    const sapNodes = [
      { x: pos.baseX - 38 + pulseOffset * 30, y: groundLineY + 2 - pulseOffset * 10 },
      { x: pos.baseX + 38 - pulseOffset * 30, y: groundLineY + 2 - pulseOffset * 10 },
    ];
    for (const sn of sapNodes) {
      drawMiniRetroStar(ctx, sn.x, sn.y, 4.0, "#86EFAC");
    }

    const crossConfigs = [
      { dx: -18, speed: 52, size: 7.5, phase: 0 },
      { dx: 0,   speed: 60, size: 9.0, phase: 0.35 },
      { dx: 18,  speed: 54, size: 7.5, phase: 0.7 },
      { dx: -8,  speed: 46, size: 6.5, phase: 0.2 },
      { dx: 10,  speed: 48, size: 6.5, phase: 0.55 },
    ];

    for (let i = 0; i < crossConfigs.length; i++) {
      const cc = crossConfigs[i];
      const curProg = (prog + cc.phase) % 1.0;
      const cy = groundLineY - 6 - (curProg * cc.speed);
      const cx = pos.baseX + cc.dx + Math.sin(curProg * 6) * 3;
      const cAlpha = Math.sin(curProg * Math.PI) * 0.95;

      drawHealCross(ctx, cx, cy, cc.size, "#4ADE80", cAlpha);
    }
  }
  ctx.restore();
}

// ============================================================================
// 💥 276: 엄청난힘 (Superpower / ばかぢから) - 격투 타입 물리 공격 기술
//
// 위력: 120 / 명중: 100 / PP: 5 / 접촉: O
// 설명: 온몸의 엄청난 힘을 짜내어 상대를 공격한다. 자신의 공격과 방어가 1랭크씩 떨어진다.
//
// [연출 시퀀스 (5세대 & 포케로그 원작 고증 - 주먹 이펙트 없음)]:
// 1. [Step 1: 전신 투기 분출 & 상승 에너지 스트리크 (Power Surge & Rising Aura Streaks)]:
//    - 시전자 주변 전/후면 3D 레이어로 치솟는 붉은빛·주황빛·연노랑 라운드 캡 상승 에너지 선들
//    - 발밑 지면에서 퍼져나가는 내부 투명 그라데이션 투기 파동 링
// 2. [Step 2: 초고속 전신 몸통 돌진 (Full-Body Supersonic Tackle Rush)]:
//    - 주먹 이펙트 없이 시전자 본체가 직접 몸을 날려 돌진
//    - 돌진 궤적을 따라 이어지는 양끝 투명 테이퍼드 스피드 라인 & 전방 충격파 웨지
// 3. [Step 3: 5세대풍 방사형 톱니 충격파 & 2중 스타버스트 대폭발 (Jagged Radial Shockwave & Starburst Impact)]:
//    - 대형 16각 수축/확산 톱니 스타버스트(PRAS graphicFrame 3 고증) + 8각 순백/황금 코어 스타버스트(graphicFrame 4 고증)
//    - 사방 360도로 튀어나가는 20개의 고속 발광 점파티클 스파크
// 4. [Step 4: 반동 복귀 & 피로로 인한 능력치 하락 (Rebound & Stat-Drop Exhaustion)]:
//    - 시전자 몸 주변으로 쏟아져 내리는 세룰리안 블루 랭크 하락 디버프 파티클 (-1)
// ============================================================================

interface SuperpowerRisingStreak {
  offsetX: number;
  length: number;
  speed: number;
  phase: number;
  width: number;
  palette: "crimson" | "amber" | "gold";
  isBehind: boolean;
}

const SUPERPOWER_RISING_STREAKS: SuperpowerRisingStreak[] = [
  // Behind Layer (시전자 등 뒤로 솟구치는 투기 스트리크, 6개)
  { offsetX: -32, length: 40, speed: 1.20, phase: 0.04, width: 3.4, palette: "crimson", isBehind: true },
  { offsetX: -18, length: 48, speed: 1.00, phase: 0.36, width: 3.8, palette: "amber",   isBehind: true },
  { offsetX:  -4, length: 44, speed: 1.30, phase: 0.68, width: 3.2, palette: "gold",    isBehind: true },
  { offsetX:  10, length: 46, speed: 1.10, phase: 0.18, width: 3.6, palette: "crimson", isBehind: true },
  { offsetX:  24, length: 40, speed: 1.35, phase: 0.52, width: 3.2, palette: "amber",   isBehind: true },
  { offsetX:  36, length: 42, speed: 0.95, phase: 0.82, width: 3.0, palette: "gold",    isBehind: true },

  // Front Layer (시전자 앞쪽으로 솟구치는 투기 스트리크, 8개)
  { offsetX: -36, length: 42, speed: 1.25, phase: 0.24, width: 3.6, palette: "amber",   isBehind: false },
  { offsetX: -24, length: 52, speed: 1.05, phase: 0.60, width: 4.2, palette: "crimson", isBehind: false },
  { offsetX: -11, length: 48, speed: 1.40, phase: 0.08, width: 3.8, palette: "gold",    isBehind: false },
  { offsetX:   0, length: 56, speed: 1.15, phase: 0.44, width: 4.4, palette: "crimson", isBehind: false },
  { offsetX:  12, length: 50, speed: 0.98, phase: 0.76, width: 3.8, palette: "amber",   isBehind: false },
  { offsetX:  23, length: 46, speed: 1.30, phase: 0.20, width: 3.6, palette: "gold",    isBehind: false },
  { offsetX:  34, length: 38, speed: 1.12, phase: 0.54, width: 3.2, palette: "crimson", isBehind: false },
  { offsetX:  -6, length: 44, speed: 1.22, phase: 0.88, width: 3.5, palette: "amber",   isBehind: false },
];

/**
 * 상단 라운드 돔 캡 + 하단 투명 테이퍼링 처리된 투기 상승 스트리크 렌더러
 */
function drawSuperpowerRisingStreaks(
  ctx: any,
  cx: number,
  cy: number,
  groundY: number,
  prog: number,
  isBehindLayer: boolean
) {
  const yStart = groundY + 4;
  const yEnd = cy - 68;
  const hSpan = yStart - yEnd;
  const globalAlpha = Math.sin(Math.min(1.0, prog * 1.1) * Math.PI * 0.85) * 0.95 + 0.05;

  ctx.save();
  for (let i = 0; i < SUPERPOWER_RISING_STREAKS.length; i++) {
    const s = SUPERPOWER_RISING_STREAKS[i];
    if (s.isBehind !== isBehindLayer) continue;

    const cycle = (prog * s.speed * 1.35 + s.phase) % 1.0;
    const curY = yStart - cycle * hSpan;
    const sway = Math.sin(cycle * Math.PI * 2.5 + i * 1.5) * 1.8;
    const curX = cx + s.offsetX + sway;

    const topY = curY - s.length * 0.5;
    const botY = curY + s.length * 0.5;
    const alpha = Math.sin(cycle * Math.PI) * globalAlpha;
    if (alpha <= 0.02) continue;

    const r = s.width * 0.5;
    const grad = ctx.createLinearGradient(curX, botY, curX, topY);
    if (s.palette === "crimson") {
      grad.addColorStop(0.0, "rgba(220, 38, 38, 0.0)");
      grad.addColorStop(0.28, `rgba(239, 68, 68, ${(alpha * 0.72).toFixed(3)})`);
      grad.addColorStop(0.72, `rgba(248, 113, 113, ${(alpha * 0.94).toFixed(3)})`);
      grad.addColorStop(1.0, `rgba(254, 202, 202, ${alpha.toFixed(3)})`);
    } else if (s.palette === "amber") {
      grad.addColorStop(0.0, "rgba(234, 88, 12, 0.0)");
      grad.addColorStop(0.28, `rgba(249, 115, 22, ${(alpha * 0.72).toFixed(3)})`);
      grad.addColorStop(0.72, `rgba(251, 146, 60, ${(alpha * 0.94).toFixed(3)})`);
      grad.addColorStop(1.0, `rgba(254, 240, 138, ${alpha.toFixed(3)})`);
    } else {
      grad.addColorStop(0.0, "rgba(249, 115, 22, 0.0)");
      grad.addColorStop(0.28, `rgba(251, 191, 36, ${(alpha * 0.72).toFixed(3)})`);
      grad.addColorStop(0.72, `rgba(253, 224, 71, ${(alpha * 0.94).toFixed(3)})`);
      grad.addColorStop(1.0, `rgba(255, 255, 255, ${alpha.toFixed(3)})`);
    }

    // 외곽 라운드 캡 기둥
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(curX - r, botY);
    ctx.lineTo(curX - r, topY + r);
    ctx.arc(curX, topY + r, r, Math.PI, 0, false);
    ctx.lineTo(curX + r, botY);
    ctx.closePath();
    ctx.fill();

    // 중심 순백 코어 심선
    const cr = r * 0.45;
    const coreGrad = ctx.createLinearGradient(curX, botY, curX, topY);
    coreGrad.addColorStop(0.15, "rgba(255, 255, 255, 0.0)");
    coreGrad.addColorStop(0.65, `rgba(255, 255, 255, ${(alpha * 0.82).toFixed(3)})`);
    coreGrad.addColorStop(1.0, `rgba(255, 255, 255, ${(alpha * 0.96).toFixed(3)})`);

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.moveTo(curX - cr, botY);
    ctx.lineTo(curX - cr, topY + cr);
    ctx.arc(curX, topY + cr, cr, Math.PI, 0, false);
    ctx.lineTo(curX + cr, botY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/**
 * 5세대 & PRAS(graphicFrame 3, 4) 고증 다층 톱니 방사형 스타버스트 렌더러
 */
function drawSuperpowerJaggedStarburst(
  ctx: any,
  tx: number,
  ty: number,
  prog: number,
  isBehindLayer: boolean
) {
  const alpha = prog < 0.15
    ? Math.min(1.0, 0.45 + (prog / 0.15) * 0.55)
    : Math.max(0.0, 1.0 - Math.pow((prog - 0.15) / 0.85, 1.35));
  if (alpha <= 0.02) return;

  ctx.save();
  ctx.translate(tx, ty);

  if (isBehindLayer) {
    // 1. 배후 진홍/화염 방사형 대기 글로우
    const bloomR = 36 + prog * 54;
    const bloomGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, bloomR);
    bloomGrad.addColorStop(0.0, `rgba(255, 255, 255, ${(alpha * 0.95).toFixed(3)})`);
    bloomGrad.addColorStop(0.35, `rgba(249, 115, 22, ${(alpha * 0.80).toFixed(3)})`);
    bloomGrad.addColorStop(0.70, `rgba(220, 38, 38, ${(alpha * 0.45).toFixed(3)})`);
    bloomGrad.addColorStop(1.0, "rgba(220, 38, 38, 0.0)");
    ctx.fillStyle = bloomGrad;
    ctx.beginPath();
    ctx.arc(0, 0, bloomR, 0, Math.PI * 2);
    ctx.fill();

    // 2. 5세대 특유의 뾰족한 20각 방사형 톱니 충격파 외곽 림 (Jagged Radial Shockwave)
    const spikes = 20;
    const baseOuterR = 44 + Math.sin(Math.min(1.0, prog * 1.4) * (Math.PI / 2)) * 34;
    const baseInnerR = baseOuterR * 0.52;

    ctx.fillStyle = `rgba(220, 38, 38, ${(alpha * 0.85).toFixed(3)})`;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const isPeak = i % 2 === 0;
      const spikeIdx = Math.floor(i / 2);
      const longFactor = spikeIdx % 2 === 0 ? 1.18 : 0.88;
      const r = isPeak ? baseOuterR * longFactor : baseInnerR;
      const ang = (i * Math.PI) / spikes - Math.PI / 2;
      const x = Math.cos(ang) * r;
      const y = Math.sin(ang) * (r * 0.88);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
    return;
  }

  // Front Layer:
  // 1) PRAS graphicFrame 3 고증: 300% -> 100%로 강렬하게 응축/작렬하는 16각 대형 홍련/황금 스타버스트
  const contractScale = prog < 0.55
    ? 2.15 - (prog / 0.55) * 1.15
    : 1.0 - ((prog - 0.55) / 0.45) * 0.25;
  const outerSpikes = 16;
  const outerPeakR = 38 * contractScale;
  const outerValleyR = 16 * contractScale;

  // 주황/진홍 외곽 16각 스타버스트
  ctx.save();
  ctx.rotate(prog * 0.18);
  const burstGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, outerPeakR);
  burstGrad.addColorStop(0.0, `rgba(255, 255, 255, ${alpha.toFixed(3)})`);
  burstGrad.addColorStop(0.35, `rgba(253, 224, 71, ${(alpha * 0.96).toFixed(3)})`);
  burstGrad.addColorStop(0.72, `rgba(249, 115, 22, ${(alpha * 0.92).toFixed(3)})`);
  burstGrad.addColorStop(1.0, `rgba(220, 38, 38, ${(alpha * 0.90).toFixed(3)})`);

  ctx.fillStyle = burstGrad;
  ctx.strokeStyle = `rgba(220, 38, 38, ${(alpha * 0.95).toFixed(3)})`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < outerSpikes * 2; i++) {
    const isPeak = i % 2 === 0;
    const alt = Math.floor(i / 2) % 2 === 0 ? 1.14 : 0.84;
    const r = isPeak ? outerPeakR * alt : outerValleyR;
    const a = (i * Math.PI) / outerSpikes;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 2) PRAS graphicFrame 4 고증: 중심부 선명한 8각 순백/황금 코어 스타버스트
  const coreSpikes = 8;
  const coreExpand = 0.85 + Math.sin(Math.min(1.0, prog * 1.5) * Math.PI) * 0.35;
  const corePeakR = 26 * coreExpand;
  const coreValleyR = 10 * coreExpand;

  ctx.fillStyle = `rgba(255, 255, 255, ${(alpha * 0.98).toFixed(3)})`;
  ctx.strokeStyle = `rgba(254, 240, 138, ${(alpha * 0.95).toFixed(3)})`;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i < coreSpikes * 2; i++) {
    const r = i % 2 === 0 ? corePeakR : coreValleyR;
    const a = (i * Math.PI) / coreSpikes - Math.PI / 2;
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

const SUPERPOWER_IMPACT_SPARKS = [
  // 고속 장거리 파편 (불규칙한 각도와 속도·중력 낙차)
  { angle: -2.88, speed: 126, startDist:  6, delay: 0.00, life: 0.92, gravity: 14, curve: -0.16, radius: 5.8, color: "#FFFFFF", streak: true },
  { angle: -2.24, speed:  64, startDist: 14, delay: 0.06, life: 0.72, gravity:  8, curve:  0.12, radius: 3.4, color: "#FEF08A", streak: false },
  { angle: -1.96, speed: 112, startDist:  4, delay: 0.02, life: 0.88, gravity: 10, curve: -0.10, radius: 4.9, color: "#FB923C", streak: true },
  { angle: -1.31, speed:  42, startDist:  9, delay: 0.10, life: 0.65, gravity:  6, curve:  0.18, radius: 2.8, color: "#EF4444", streak: false },
  { angle: -0.98, speed: 134, startDist:  5, delay: 0.00, life: 0.96, gravity: 16, curve:  0.14, radius: 6.2, color: "#FFFFFF", streak: true },
  { angle: -0.74, speed:  78, startDist: 16, delay: 0.04, life: 0.78, gravity: 12, curve: -0.15, radius: 4.1, color: "#FDE047", streak: false },
  { angle: -0.22, speed: 104, startDist:  3, delay: 0.03, life: 0.86, gravity: 18, curve:  0.08, radius: 5.1, color: "#FB923C", streak: true },
  { angle: -0.05, speed:  52, startDist: 12, delay: 0.12, life: 0.68, gravity: 10, curve: -0.20, radius: 3.1, color: "#EF4444", streak: false },
  { angle:  0.34, speed: 128, startDist:  7, delay: 0.00, life: 0.94, gravity: 22, curve:  0.15, radius: 5.6, color: "#FFFFFF", streak: true },
  { angle:  0.58, speed:  68, startDist: 11, delay: 0.08, life: 0.74, gravity: 15, curve: -0.12, radius: 3.8, color: "#FEF08A", streak: false },
  { angle:  1.08, speed:  94, startDist:  5, delay: 0.02, life: 0.84, gravity: 24, curve:  0.10, radius: 4.6, color: "#FB923C", streak: true },
  { angle:  1.46, speed:  38, startDist:  8, delay: 0.14, life: 0.62, gravity: 12, curve: -0.18, radius: 2.6, color: "#FDE047", streak: false },
  { angle:  1.89, speed: 118, startDist:  4, delay: 0.01, life: 0.90, gravity: 20, curve: -0.14, radius: 5.3, color: "#FFFFFF", streak: true },
  { angle:  2.18, speed:  82, startDist: 15, delay: 0.05, life: 0.80, gravity: 16, curve:  0.16, radius: 4.3, color: "#EF4444", streak: true },
  { angle:  2.68, speed:  48, startDist: 10, delay: 0.09, life: 0.70, gravity: 11, curve: -0.11, radius: 3.2, color: "#FEF08A", streak: false },
  { angle:  2.95, speed: 108, startDist:  6, delay: 0.03, life: 0.88, gravity: 18, curve:  0.13, radius: 4.8, color: "#FB923C", streak: true },
  { angle: -2.55, speed:  88, startDist:  8, delay: 0.07, life: 0.82, gravity: 14, curve:  0.22, radius: 4.0, color: "#FDE047", streak: false },
  { angle: -0.48, speed:  60, startDist:  5, delay: 0.11, life: 0.66, gravity:  9, curve: -0.14, radius: 3.0, color: "#FFFFFF", streak: false },
];

/**
 * 타격 순간 불규칙한 각도·속도·시차·중력 궤적으로 사방에 흩뿌려지는 발광 점파티클 스파크 렌더러
 */
function drawSuperpowerImpactSparks(
  ctx: any,
  tx: number,
  ty: number,
  prog: number
) {
  if (prog <= 0.0 || prog >= 1.0) return;

  ctx.save();
  for (let i = 0; i < SUPERPOWER_IMPACT_SPARKS.length; i++) {
    const sp = SUPERPOWER_IMPACT_SPARKS[i];
    if (prog < sp.delay) continue;
    const localT = (prog - sp.delay) / sp.life;
    if (localT <= 0.0 || localT >= 1.0) continue;

    // 입자마다 다른 감쇠 곡선과 휘어짐(curve), 중력 낙차(gravity)를 적용해 동심원 형태를 깨고 불규칙하게 확산
    const easePow = 1.6 + (i % 4) * 0.35;
    const easeOut = 1.0 - Math.pow(1.0 - Math.min(1.0, localT), easePow);
    const curAngle = sp.angle + sp.curve * localT;
    const dist = sp.startDist + sp.speed * easeOut;
    const gravY = sp.gravity * localT * localT;

    const px = tx + Math.cos(curAngle) * dist;
    const py = ty + Math.sin(curAngle) * dist + gravY;

    const alpha =
      localT < 0.35 ? 1.0 : Math.max(0.0, 1.0 - (localT - 0.35) / 0.65);
    const sizeScale =
      localT < 0.30 ? 1.0 : Math.max(0.25, 1.0 - (localT - 0.30) * 0.95);
    if (alpha <= 0.02) continue;

    const r = sp.radius * sizeScale;

    if (sp.streak && localT > 0.03 && localT < 0.88) {
      const prevT = Math.max(0, localT - 0.16);
      const prevEase = 1.0 - Math.pow(1.0 - prevT, easePow);
      const prevAng = sp.angle + sp.curve * prevT;
      const prevDist = sp.startDist + sp.speed * prevEase;
      const tailX = tx + Math.cos(prevAng) * prevDist;
      const tailY = ty + Math.sin(prevAng) * prevDist + sp.gravity * prevT * prevT;

      const sGrad = ctx.createLinearGradient(tailX, tailY, px, py);
      sGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
      sGrad.addColorStop(1.0, sp.color);

      ctx.save();
      ctx.strokeStyle = sGrad;
      ctx.globalAlpha = alpha * 0.85;
      ctx.lineWidth = Math.max(1.2, r * 0.48);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.restore();
    }

    // 외곽 컬러 발광 구체
    ctx.save();
    ctx.fillStyle = sp.color;
    ctx.globalAlpha = alpha * 0.95;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();

    // 중심 순백 코어
    ctx.fillStyle = "#FFFFFF";
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(px, py, Math.max(0.9, r * 0.50), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

/**
 * 5세대 원작풍 배경 암전 & 열기 투기 스트림 배경 효과 렌더러
 */
function drawSuperpowerBattlefieldBg(
  ctx: any,
  pos: ReturnType<typeof getCasterPos>,
  targetPos: { x: number; y: number },
  step: number,
  prog: number
) {
  let bgAlpha = 0;
  if (step === 1) {
    // 준비 단계: 시작 직후 빠르게 진홍/암적색 투기 배경이 깔리며 고조됨
    bgAlpha = prog < 0.20 ? (prog / 0.20) * 0.78 : 0.78 + (prog - 0.20) * 0.12;
  } else if (step === 2) {
    // 돌진 단계: 최고조 배경 유지
    bgAlpha = 0.88;
  } else if (step === 3) {
    // 타격 단계: 대상 타격 지점에서도 동일한 강도의 배경 효과가 유지되다가 막바지에 페이드아웃
    bgAlpha = prog < 0.72 ? 0.88 : Math.max(0, (1.0 - (prog - 0.72) / 0.28) * 0.88);
  }
  if (bgAlpha <= 0.01) return;

  ctx.save();

  // 1. 전장 전체를 덮는 진홍/암적색 열기 비네트 & 오라 배경 그라데이션
  const focusX = step === 3 ? targetPos.x : pos.cx;
  const focusY = step === 3 ? targetPos.y : pos.cy;
  const bgGrad = ctx.createRadialGradient(focusX, focusY, 18, focusX, focusY, 380);
  bgGrad.addColorStop(0.0, `rgba(249, 115, 22, ${(bgAlpha * 0.52).toFixed(3)})`);
  bgGrad.addColorStop(0.28, `rgba(220, 38, 38, ${(bgAlpha * 0.64).toFixed(3)})`);
  bgGrad.addColorStop(0.62, `rgba(127, 29, 29, ${(bgAlpha * 0.76).toFixed(3)})`);
  bgGrad.addColorStop(1.0, `rgba(20, 5, 8, ${(bgAlpha * 0.86).toFixed(3)})`);

  ctx.fillStyle = bgGrad;
  ctx.fillRect(-2000, -2000, 5000, 5000);

  // 2. 준비 단계(Step 1) & 타격 단계(Step 3): 포커스 지점(시전자 / 피격 대상) 중심 5세대풍 투기 배경 스트림 & 배후 화염 할로
  if (step === 1 || step === 3) {
    // 중심점(시전자 또는 타격 지점) 뒤에서 맥동하는 강렬한 다중 열기 할로
    const pulse = 1.0 + Math.sin(prog * Math.PI * 4) * 0.12;
    const haloR = (58 + prog * 28) * pulse;
    const haloGrad = ctx.createRadialGradient(focusX, focusY, 6, focusX, focusY, haloR);
    haloGrad.addColorStop(0.0, `rgba(254, 240, 138, ${(bgAlpha * 0.75).toFixed(3)})`);
    haloGrad.addColorStop(0.45, `rgba(249, 115, 22, ${(bgAlpha * 0.55).toFixed(3)})`);
    haloGrad.addColorStop(0.80, `rgba(220, 38, 38, ${(bgAlpha * 0.28).toFixed(3)})`);
    haloGrad.addColorStop(1.0, "rgba(220, 38, 38, 0.0)");
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(focusX, focusY, haloR, 0, Math.PI * 2);
    ctx.fill();

    // 배경 전역 수직 상승 에너지 스트림 (18줄)
    const bgLineCount = 18;
    for (let i = 0; i < bgLineCount; i++) {
      const lx = focusX - 260 + i * 30 + ((i % 3) - 1) * 7;
      const speed = 1.1 + (i % 4) * 0.28;
      const phase = (i * 0.19) % 1.0;
      const cycle = (prog * speed * 1.4 + phase) % 1.0;
      const lineLen = 75 + (i % 3) * 32;
      const cyLine = (focusY + 140) - cycle * 280;
      const topY = cyLine - lineLen * 0.5;
      const botY = cyLine + lineLen * 0.5;
      const lAlpha = Math.sin(cycle * Math.PI) * bgAlpha * 0.55;
      if (lAlpha <= 0.02) continue;

      const lGrad = ctx.createLinearGradient(lx, botY, lx, topY);
      const isGold = i % 3 === 0;
      lGrad.addColorStop(0.0, "rgba(220, 38, 38, 0.0)");
      lGrad.addColorStop(
        0.5,
        isGold
          ? `rgba(253, 224, 71, ${lAlpha.toFixed(3)})`
          : `rgba(249, 115, 22, ${lAlpha.toFixed(3)})`
      );
      lGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

      ctx.strokeStyle = lGrad;
      ctx.lineWidth = isGold ? 3.2 : 2.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(lx, botY);
      ctx.lineTo(lx, topY);
      ctx.stroke();
    }
  }

  // 3. 돌진 단계(Step 2): 전장 배경 전체를 가로지르는 초고속 액션 스피드 스트림
  if (step === 2) {
    const dx = targetPos.x - pos.baseX;
    const dy = targetPos.y - (pos.baseY - (pos.isP ? 38 : 34));
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;
    const nx = -uy;
    const ny = ux;

    const bgSpeedLines = 14;
    for (let i = 0; i < bgSpeedLines; i++) {
      const perp = (i - bgSpeedLines * 0.5) * 24;
      const phase = (i * 0.23) % 1.0;
      const travel = ((prog * 1.8 + phase) % 1.0) * 420 - 160;
      const len = 110 + (i % 3) * 45;
      const hx = pos.baseX + ux * (travel + len) + nx * perp;
      const hy = pos.baseY - 34 + uy * (travel + len) + ny * perp;
      const tx = hx - ux * len;
      const ty = hy - uy * len;
      const sAlpha = Math.sin(((prog * 1.8 + phase) % 1.0) * Math.PI) * bgAlpha * 0.65;
      if (sAlpha <= 0.02) continue;

      const sGrad = ctx.createLinearGradient(tx, ty, hx, hy);
      sGrad.addColorStop(0.0, "rgba(220, 38, 38, 0.0)");
      sGrad.addColorStop(0.6, `rgba(249, 115, 22, ${(sAlpha * 0.85).toFixed(3)})`);
      sGrad.addColorStop(0.9, `rgba(254, 240, 138, ${sAlpha.toFixed(3)})`);
      sGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

      ctx.strokeStyle = sGrad;
      ctx.lineWidth = i % 2 === 0 ? 3.0 : 2.0;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(hx, hy);
      ctx.stroke();
    }
  }

  ctx.restore();
}

interface SuperpowerSteamPuff {
  dx: number;
  startDy: number;
  riseDist: number;
  baseR: number;
  spawnAt: number;
  duration: number;
  swayDir: number;
  isBehind: boolean;
}

const SUPERPOWER_STEAM_PUFFS: SuperpowerSteamPuff[] = [
  // Behind Layer (포켓몬 등/어깨 뒤에서 모락모락 피어오르는 열기 김)
  { dx: -24, startDy:  4, riseDist: 52, baseR: 12, spawnAt: 0.00, duration: 0.55, swayDir: -1, isBehind: true },
  { dx:  22, startDy:  2, riseDist: 54, baseR: 13, spawnAt: 0.08, duration: 0.55, swayDir:  1, isBehind: true },
  { dx:  -8, startDy: -14, riseDist: 58, baseR: 14, spawnAt: 0.18, duration: 0.56, swayDir: -1, isBehind: true },
  { dx:  14, startDy: -12, riseDist: 56, baseR: 13, spawnAt: 0.28, duration: 0.56, swayDir:  1, isBehind: true },
  { dx: -20, startDy: -4, riseDist: 54, baseR: 14, spawnAt: 0.38, duration: 0.56, swayDir: -1, isBehind: true },
  { dx:  24, startDy: -6, riseDist: 56, baseR: 13, spawnAt: 0.46, duration: 0.54, swayDir:  1, isBehind: true },

  // Front Layer (포켓몬 몸통/머리 앞에서 모락모락 뿜어져 올라오는 하얀 열기 김)
  { dx: -16, startDy:  10, riseDist: 50, baseR: 11, spawnAt: 0.02, duration: 0.52, swayDir: -1, isBehind: false },
  { dx:  16, startDy:   8, riseDist: 52, baseR: 11, spawnAt: 0.10, duration: 0.52, swayDir:  1, isBehind: false },
  { dx:   0, startDy: -10, riseDist: 58, baseR: 13, spawnAt: 0.16, duration: 0.56, swayDir:  1, isBehind: false },
  { dx: -22, startDy:  -2, riseDist: 54, baseR: 12, spawnAt: 0.26, duration: 0.55, swayDir: -1, isBehind: false },
  { dx:  20, startDy:  -4, riseDist: 54, baseR: 12, spawnAt: 0.34, duration: 0.55, swayDir:  1, isBehind: false },
  { dx:  -6, startDy: -16, riseDist: 60, baseR: 14, spawnAt: 0.42, duration: 0.56, swayDir: -1, isBehind: false },
  { dx:  10, startDy: -14, riseDist: 58, baseR: 13, spawnAt: 0.50, duration: 0.50, swayDir:  1, isBehind: false },
];

/**
 * 준비 단계에서 포켓몬의 과열된 육체로부터 모락모락 피어오르는 하얀 열기 김(Steam) 렌더러
 */
function drawSuperpowerRisingSteam(
  ctx: any,
  cx: number,
  cy: number,
  prog: number,
  isBehindLayer: boolean
) {
  ctx.save();

  // 1. 뭉게뭉게 피어오르며 팽창·소산하는 다중 구름형 하얀 김 클러스터
  for (let i = 0; i < SUPERPOWER_STEAM_PUFFS.length; i++) {
    const p = SUPERPOWER_STEAM_PUFFS[i];
    if (p.isBehind !== isBehindLayer) continue;

    // 2회 순환 구조로 준비 단계 내내 끊이지 않고 김이 모락모락 올라오게 처리
    const rawT = (prog - p.spawnAt + 1.0) % 1.0;
    const localT = rawT / p.duration;
    if (localT <= 0.0 || localT >= 1.0) continue;

    const easeOut = 1.0 - Math.pow(1.0 - localT, 1.8);
    const scale = 0.55 + easeOut * 0.95;
    const alpha =
      localT < 0.22
        ? (localT / 0.22) * 0.88
        : Math.max(0.0, (1.0 - (localT - 0.22) / 0.78) * 0.88);
    if (alpha <= 0.02) continue;

    const swayX =
      p.swayDir * (easeOut * 10 + Math.sin(localT * Math.PI * 2.2 + i) * 4.5);
    const px = cx + p.dx + swayX;
    const py = cy + p.startDy - easeOut * p.riseDist;
    const r = p.baseR * scale;

    // 구름 한 덩어리를 4개의 부드러운 볼륨 로브로 그려 진짜 김/수증기 질감 구현
    const lobes = [
      { ox: 0, oy: 0, lr: r },
      { ox: -r * 0.48, oy: r * 0.12, lr: r * 0.76 },
      { ox: r * 0.48, oy: r * 0.10, lr: r * 0.76 },
      { ox: 0, oy: -r * 0.38, lr: r * 0.82 },
    ];

    for (let l = 0; l < lobes.length; l++) {
      const lb = lobes[l];
      const lx = px + lb.ox;
      const ly = py + lb.oy;
      const g = ctx.createRadialGradient(lx, ly - lb.lr * 0.15, lb.lr * 0.08, lx, ly, lb.lr);
      g.addColorStop(0.0, `rgba(255, 255, 255, ${(alpha * 0.95).toFixed(3)})`);
      g.addColorStop(0.52, `rgba(255, 241, 242, ${(alpha * 0.65).toFixed(3)})`);
      g.addColorStop(0.82, `rgba(254, 205, 211, ${(alpha * 0.28).toFixed(3)})`);
      g.addColorStop(1.0, "rgba(254, 205, 211, 0.0)");

      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(lx, ly, lb.lr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. 포켓몬 어깨·머리 위로 유려하게 피어오르는 S자 수증기 김 줄기 (Wavy Steam Wisps)
  const wispOffsets = isBehindLayer ? [-26, 0, 26] : [-16, 16];
  for (let w = 0; w < wispOffsets.length; w++) {
    const ox = wispOffsets[w];
    const cycle = (prog * 1.5 + w * 0.31) % 1.0;
    const wAlpha = Math.sin(cycle * Math.PI) * 0.78;
    if (wAlpha <= 0.02) continue;

    const baseX = cx + ox;
    const botY = cy + 4 - cycle * 26;
    const topY = botY - (28 + cycle * 16);
    const wave = Math.sin(prog * Math.PI * 4 + w * 2.1) * 8;

    const wGrad = ctx.createLinearGradient(baseX, botY, baseX, topY);
    wGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
    wGrad.addColorStop(0.35, `rgba(255, 241, 242, ${(wAlpha * 0.80).toFixed(3)})`);
    wGrad.addColorStop(0.75, `rgba(255, 255, 255, ${(wAlpha * 0.95).toFixed(3)})`);
    wGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

    ctx.strokeStyle = wGrad;
    ctx.lineWidth = 4.2 - cycle * 1.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(baseX, botY);
    ctx.bezierCurveTo(
      baseX - wave,
      botY - (botY - topY) * 0.35,
      baseX + wave,
      botY - (botY - topY) * 0.70,
      baseX + wave * 0.3,
      topY
    );
    ctx.stroke();
  }

  ctx.restore();
}

export function drawSuperpowerBehindEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showBehindEffect && !frame.showEffect) return;
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const pos = getCasterPos(drawCtx, frame);
  const targetPos = getTargetSpriteCenter(drawCtx, frame);

  // 전장 전체 5세대풍 열기/진홍 투기 배경 효과 (Step 1 ~ Step 3 초반)
  drawSuperpowerBattlefieldBg(ctx, pos, targetPos, step, prog);

  // --------------------------------------------------------------------------
  // [Step 1: 시전자 배후 상승 투기 스트리크 + 모락모락 피어오르는 열기 김 & 바닥 링]
  // --------------------------------------------------------------------------
  if (step === 1) {
    ctx.save();
    const ringAlpha = Math.sin(prog * Math.PI) * 0.80;

    // 바닥 파동 링 (선 자체에 안쪽 투명 그라데이션 적용)
    if (ringAlpha > 0.02) {
      ctx.save();
      ctx.translate(pos.baseX, pos.groundY);
      ctx.scale(1.0, 0.38);

      const rOuter = 20 + prog * 36;
      const bandW = 9;
      const rInner = Math.max(1, rOuter - bandW);
      const midR = (rInner + rOuter) * 0.5;

      const ringGrad = ctx.createRadialGradient(0, 0, rInner, 0, 0, rOuter);
      ringGrad.addColorStop(0.0, "rgba(220, 38, 38, 0.0)");
      ringGrad.addColorStop(0.50, `rgba(239, 68, 68, ${(ringAlpha * 0.45).toFixed(3)})`);
      ringGrad.addColorStop(0.85, `rgba(249, 115, 22, ${(ringAlpha * 0.85).toFixed(3)})`);
      ringGrad.addColorStop(1.0, `rgba(254, 240, 138, ${ringAlpha.toFixed(3)})`);

      ctx.strokeStyle = ringGrad;
      ctx.lineWidth = rOuter - rInner;
      ctx.beginPath();
      ctx.arc(0, 0, midR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 배후에서 모락모락 피어오르는 하얀 열기 김 (Steam)
    drawSuperpowerRisingSteam(ctx, pos.cx, pos.cy, prog, true);
    // 배후 상승 투기 스트리크 (Behind Layer)
    drawSuperpowerRisingStreaks(ctx, pos.cx, pos.cy, pos.groundY, prog, true);
    ctx.restore();
    return;
  }

  // --------------------------------------------------------------------------
  // [Step 2: 전신 초고속 돌진 시 배후 테이퍼드 스피드 라인 & 출발지 잔여 김]
  // --------------------------------------------------------------------------
  if (step === 2) {
    ctx.save();
    // 돌진 직후 출발 위치에 살짝 남는 열기 김 잔향
    if (prog < 0.45) {
      drawSuperpowerRisingSteam(
        ctx,
        pos.baseX,
        pos.baseY - (pos.isP ? 38 : 34),
        0.75 + prog * 0.4,
        true
      );
    }

    const alpha = Math.sin(prog * Math.PI) * 0.88;
    const dx = targetPos.x - pos.baseX;
    const dy = targetPos.y - (pos.baseY - (pos.isP ? 38 : 34));
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;
    const nx = -uy;
    const ny = ux;

    const lineOffsets = [-26, -12, 0, 12, 24];
    for (let i = 0; i < lineOffsets.length; i++) {
      const perp = lineOffsets[i];
      const lineLen = 85 + (i % 2) * 28;
      const headX = pos.cx + ux * 24 + nx * perp;
      const headY = pos.cy + uy * 24 + ny * perp;
      const tailX = headX - ux * lineLen;
      const tailY = headY - uy * lineLen;

      const sGrad = ctx.createLinearGradient(tailX, tailY, headX, headY);
      sGrad.addColorStop(0.0, "rgba(220, 38, 38, 0.0)");
      sGrad.addColorStop(0.55, `rgba(249, 115, 22, ${(alpha * 0.80).toFixed(3)})`);
      sGrad.addColorStop(0.88, `rgba(254, 240, 138, ${(alpha * 0.95).toFixed(3)})`);
      sGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

      ctx.strokeStyle = sGrad;
      ctx.lineWidth = i === 2 ? 3.6 : 2.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(headX, headY);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // --------------------------------------------------------------------------
  // [Step 3: 피격 지점 배후 5세대풍 뾰족한 방사형 톱니 충격파 & 후광]
  // --------------------------------------------------------------------------
  if (step === 3) {
    drawSuperpowerJaggedStarburst(ctx, targetPos.x, targetPos.y, prog, true);
  }
}

export function drawSuperpowerEffect(
  ctx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  if (!frame.showEffect) return;
  const step = frame.moveStep ?? 1;
  const prog = frame.effectProgress ?? 0;
  const pos = getCasterPos(drawCtx, frame);
  const targetPos = getTargetSpriteCenter(drawCtx, frame);

  // --------------------------------------------------------------------------
  // [Step 1: 시전자 전면 열기 김(Steam) + 상승 투기 스트리크 (Front Layer)]
  // --------------------------------------------------------------------------
  if (step === 1) {
    drawSuperpowerRisingSteam(ctx, pos.cx, pos.cy, prog, false);
    drawSuperpowerRisingStreaks(ctx, pos.cx, pos.cy, pos.groundY, prog, false);
    return;
  }

  // --------------------------------------------------------------------------
  // [Step 2: 주먹 없이 시전자 전신을 감싸는 초승달형 돌파 충격파 웨지]
  // --------------------------------------------------------------------------
  if (step === 2) {
    ctx.save();
    const dx = targetPos.x - pos.baseX;
    const dy = targetPos.y - (pos.baseY - (pos.isP ? 38 : 34));
    const angle = Math.atan2(dy, dx);
    const waveAlpha = Math.sin(prog * Math.PI) * 0.92;

    if (waveAlpha > 0.02) {
      const frontX = pos.cx + Math.cos(angle) * 18;
      const frontY = pos.cy + Math.sin(angle) * 18;

      ctx.translate(frontX, frontY);
      ctx.rotate(angle);

      const r = 26 + prog * 10;
      // 외곽 진홍/주황 소닉붐 초승달 웨지 (양끝 0px 바늘침 수렴)
      ctx.fillStyle = `rgba(249, 115, 22, ${(waveAlpha * 0.85).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(r * 0.85, 0, 0, r);
      ctx.quadraticCurveTo(r * 0.38, 0, 0, -r);
      ctx.closePath();
      ctx.fill();

      // 중심 순백 코어 초승달
      const cr = r * 0.78;
      ctx.fillStyle = `rgba(255, 255, 255, ${(waveAlpha * 0.95).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(2, -cr);
      ctx.quadraticCurveTo(cr * 0.78, 0, 2, cr);
      ctx.quadraticCurveTo(cr * 0.45, 0, 2, -cr);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  // --------------------------------------------------------------------------
  // [Step 3: 5세대풍 다층 톱니 스타버스트 & 사방 발광 점파티클 대폭발]
  // --------------------------------------------------------------------------
  if (step === 3) {
    drawSuperpowerJaggedStarburst(ctx, targetPos.x, targetPos.y, prog, false);
    drawSuperpowerImpactSparks(ctx, targetPos.x, targetPos.y, prog);
    return;
  }

  // --------------------------------------------------------------------------
  // [Step 4: 피로로 인한 능력치 하락 디버프 (공격/방어 -1 하락)]
  // --------------------------------------------------------------------------
  if (step === 4) {
    ctx.save();
    drawStatDropEffect(ctx, { x: pos.cx, y: pos.cy }, prog);
    ctx.restore();
  }
}

