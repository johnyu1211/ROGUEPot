// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";

/**
 * Gen 2 Moves 173 - 176 Renderers
 * 
 * 173: 코골기 (Snore)
 * 174: 저주 (Curse)
 * 175: 버둥거리기 (Flail)
 * 176: 텍스처2 (Conversion 2)
 */

// ============================================================================
// 173: 코골기 (Snore)
// ============================================================================

/**
 * 3D 원근 틸트가 적용된 반투명 보라/파랑 음파 타원 렌더러 (울부짖기 3D 메커니즘 + 첨부 이미지 1:1 색상)
 * - 비행 진행 축(angle)에 맞추어 깊이축(depthRatio: 0.54) 압축 원근 왜곡 적용
 * - 외곽 가장자리: 로열 블루 / 전기 네온 스카이블루 발광 오라
 * - 몸체: 반투명 딥 바이올렛 / 인디고 / 퍼플 그라데이션
 * - 중심부: 전장과 캐릭터가 비치는 투명 영역
 */
function draw3DSnoreWaveDisc(
  ctx: any,
  cx: number,
  cy: number,
  angle: number,
  radius: number,
  alpha: number = 1.0,
  depthRatio: number = 0.54
) {
  if (radius <= 1 || alpha <= 0.01) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle); // 진행 방향 축
  ctx.scale(depthRatio, 1.08); // 3D 원근 타원 압축 (울부짖기와 동일 규격)

  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // 외곽 톱니형(Spiky) 3D 음파 윤곽 (첨부 이미지 고증)
  const numSpikes = 18;
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  grad.addColorStop(0.00, "rgba(76, 29, 149, 0)");        // 중심부: 100% 완전 투명
  grad.addColorStop(0.35, "rgba(76, 29, 149, 0.08)");     // 안쪽 투명 영역 유지
  grad.addColorStop(0.62, "rgba(147, 51, 234, 0.38)");    // 마젠타/바이올렛 몸체부
  grad.addColorStop(0.82, "rgba(67, 56, 202, 0.58)");     // 딥 인디고/블루
  grad.addColorStop(0.95, "rgba(37, 99, 235, 0.78)");     // 선명한 로열 블루 가장자리
  grad.addColorStop(1.00, "rgba(56, 189, 248, 0.90)");    // 외곽 네온 스카이 림

  ctx.fillStyle = grad;
  ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.92})`;
  ctx.lineWidth = 3.2;

  ctx.beginPath();
  for (let i = 0; i < numSpikes; i++) {
    const a = (i / numSpikes) * Math.PI * 2;
    const spikeFactor = i % 2 === 0 ? 0.12 : -0.06;
    const r1 = radius * (0.92 + spikeFactor);
    const px = Math.cos(a) * r1;
    const py = Math.sin(a) * r1;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * 173: 코골기 (Snore) 배경 이펙트: 살짝 파란빛어두운 암전
 */
export function drawSnoreBehindEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const ctx = targetCtx;
  const moveStep = frame.moveStep || 1;
  const p = frame.effectProgress || 0;

  // 기승전결 파란빛 어두운 암전 강도
  let darkAlpha = 0;
  if (moveStep === 1) {
    // Step 1: 들숨과 함께 화면이 서서히 짙푸른 밤하늘처럼 어두워짐
    darkAlpha = 0.20 + p * 0.35; // 0.20 -> 0.55
  } else if (moveStep === 2) {
    // Step 2: 발포와 함께 짙은 암전 유지
    darkAlpha = 0.55 + p * 0.10; // 0.55 -> 0.65
  } else if (moveStep === 3) {
    // Step 3: 상대 직격 시 암전 유지
    darkAlpha = 0.65 - p * 0.10; // 0.65 -> 0.55
  } else if (moveStep === 4) {
    // Step 4: 파장 소산되며 서서히 밝아짐
    darkAlpha = 0.55 - p * 0.30; // 0.55 -> 0.25
  } else if (moveStep === 5) {
    // Step 5: 단잠 복귀하며 완전히 밝아짐
    darkAlpha = Math.max(0, 0.25 * (1.0 - p)); // 0.25 -> 0.00
  }

  if (darkAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = darkAlpha;
    // 살짝 파란빛어두운 딥 나이트 블루 컬러
    ctx.fillStyle = "#070E28";
    ctx.fillRect(-ctx.canvas.width * 4, -3000, ctx.canvas.width * 9, 6000);
    ctx.restore();
  }
}

/**
 * 173: 코골기 (Snore) 메인 드로우 이펙트
 * - 살짝 파란빛어두운 암전 전면 틴트
 * - 발사 전 사전 이펙트 없음 (들숨 충전)
 * - 거품/Z/번개/타격이펙트 없이 순수 3D 반투명 파장만 발사되어 관통
 */
export function drawSnoreEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const ctx = targetCtx;
  const { attackerPos: aPos, targetPos: tPos } = drawCtx;
  const isP = Boolean(drawCtx.isPlayer ?? (drawCtx as any).isPlayerAttacking ?? true);
  const moveStep = frame.moveStep || 1;
  const p = frame.effectProgress || 0;

  // 기승전결 살짝 파란빛어두운 암전 전면 오버레이 (포켓몬 스프라이트와 필드가 자연스럽게 블루 나이트에 잠김)
  let darkAlpha = 0;
  if (moveStep === 1) {
    darkAlpha = 0.12 + p * 0.18; // 0.12 -> 0.30
  } else if (moveStep === 2) {
    darkAlpha = 0.30 + p * 0.06; // 0.30 -> 0.36
  } else if (moveStep === 3) {
    darkAlpha = 0.36 - p * 0.06; // 0.36 -> 0.30
  } else if (moveStep === 4) {
    darkAlpha = 0.30 - p * 0.16; // 0.30 -> 0.14
  } else if (moveStep === 5) {
    darkAlpha = Math.max(0, 0.14 * (1.0 - p)); // 0.14 -> 0.00
  }

  if (darkAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = darkAlpha;
    ctx.fillStyle = "#0A1232";
    ctx.fillRect(-ctx.canvas.width * 4, -3000, ctx.canvas.width * 9, 6000);
    ctx.restore();
  }

  // ===========================================================================
  // Step 1: 수면 들숨 (발사 전에는 소리 이펙트 일체 비표시)
  // ===========================================================================
  if (moveStep === 1) {
    return;
  }

  // 시전자와 대상의 실제 렌더링 위치
  const ax = aPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = aPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - (isP ? 10 : 6);

  const tx = tPos.x;
  const ty = tPos.y - (isP ? 15 : 10);

  // 시전자 -> 대상 방향 비행 궤적 주 각도 (X축이 비행 진행선)
  const mainAngle = Math.atan2(ty - ay, tx - ax);

  ctx.save();

  // ===========================================================================
  // Step 2: 3D 원추형 반투명 파장 초고속 전진 사출 (거품 없음)
  // ===========================================================================
  if (moveStep === 2) {
    const t = Math.max(0, Math.min(1.0, p));

    // 3D 원추형 3단 링 전진 사출 (t3 후미 -> t2 중간 -> t1 선두)
    const t1 = 0.20 + t * 0.55; // 0.20 -> 0.75 (선두 링)
    const t2 = 0.12 + t * 0.45; // 0.12 -> 0.57 (중간 링)
    const t3 = 0.05 + t * 0.35; // 0.05 -> 0.40 (후미 링)

    const cx1 = ax + (tx - ax) * t1; const cy1 = ay + (ty - ay) * t1;
    const cx2 = ax + (tx - ax) * t2; const cy2 = ay + (ty - ay) * t2;
    const cx3 = ax + (tx - ax) * t3; const cy3 = ay + (ty - ay) * t3;

    const r1 = 28 + t * 44; // 28 -> 72px
    const r2 = 20 + t * 32; // 20 -> 52px
    const r3 = 14 + t * 20; // 14 -> 34px

    const a1 = Math.min(1.0, 0.4 + t * 0.6);
    const a2 = Math.min(0.85, 0.3 + t * 0.55);
    const a3 = Math.min(0.70, 0.25 + t * 0.45);

    // 뒤에서 앞 순서로 렌더링하여 3D 깊이 오버랩 구현 (울부짖기 방식)
    draw3DSnoreWaveDisc(ctx, cx3, cy3, mainAngle, r3, a3);
    draw3DSnoreWaveDisc(ctx, cx2, cy2, mainAngle, r2, a2);
    draw3DSnoreWaveDisc(ctx, cx1, cy1, mainAngle, r1, a1);
  }

  // ===========================================================================
  // Step 3: 상대방 면전 3D 파장 관통 직격 (타격 이펙트 없이 순수 3D 파장 세례 - 255ms)
  // ===========================================================================
  else if (moveStep === 3) {
    const t = Math.max(0, Math.min(1.0, p));

    // 대상을 집어삼키는 거대 3D 파장 링들 (울부짖기 Step 4 메커니즘)
    const t1 = 0.75 + t * 0.25; // 0.75 -> 1.00 (직격)
    const t2 = 0.60 + t * 0.25; // 0.60 -> 0.85
    const t3 = 0.45 + t * 0.25; // 0.45 -> 0.70

    const cx1 = ax + (tx - ax) * t1; const cy1 = ay + (ty - ay) * t1;
    const cx2 = ax + (tx - ax) * t2; const cy2 = ay + (ty - ay) * t2;
    const cx3 = ax + (tx - ax) * t3; const cy3 = ay + (ty - ay) * t3;

    const r1 = 72 + t * 38; // 72 -> 110px
    const r2 = 52 + t * 30; // 52 -> 82px
    const r3 = 34 + t * 24; // 34 -> 58px

    draw3DSnoreWaveDisc(ctx, cx3, cy3, mainAngle, r3, 0.60);
    draw3DSnoreWaveDisc(ctx, cx2, cy2, mainAngle, r2, 0.75);
    draw3DSnoreWaveDisc(ctx, cx1, cy1, mainAngle, r1, 0.90);
  }

  // ===========================================================================
  // Step 4: 대상을 통과하여 전방으로 소산되는 3D 파장 (울부짖기 페이드아웃 - 255ms)
  // ===========================================================================
  else if (moveStep === 4) {
    const t = Math.max(0, Math.min(1.0, p));

    const fadeAlpha = Math.max(0, 1.0 - t * 1.15);
    if (fadeAlpha > 0.02) {
      const cx = tx + (tx - ax) * (t * 0.25);
      const cy = ty + (ty - ay) * (t * 0.25);
      draw3DSnoreWaveDisc(ctx, cx, cy, mainAngle, 110 + t * 30, fadeAlpha * 0.55);
    }
  }

  // ===========================================================================
  // Step 5: 시전자 태평한 단잠 복귀 & 페이드아웃 (170ms)
  // ===========================================================================
  else if (moveStep === 5) {
    // 거품 없이 평온하게 카메라 원위치 복귀
  }

  ctx.restore();
}

// ============================================================================
// 174: 저주 (Curse) - 일반 타입 & 고스트 타입 렌더러
// ============================================================================

// ----------------------------------------------------------------------------
// A. 일반 타입 버전 (Curse - Normal / Non-Ghost)
// - 개념: 둔화(Speed -1) & 파워/방어 2중 응축(Atk +1, Def +1)
// - Step 1: 묵직한 중력 침강 & 스피드 하락 파티클 (Speed Drop)
// - Step 2: 내면에서 끓어오르는 붉은 공격력 + 푸른 방어력 2중 나선 오라 응축
// - Step 3: 스탯 2단 상승 펄스 링 & 샤이니 스파클 분출 (Twin Stat Boost)
// - Step 4: 묵직하고 견고한 자세로 안정화
// ----------------------------------------------------------------------------

export function drawCurseNormalBehindEffect(
  _targetCtx: any,
  _frame: BattleFrame,
  _drawCtx: EffectDrawContext
) {
  // 일반타입 저주는 별도의 기술 이펙트 없이 시전자 움직임 후 엔진 랭크 애니메이션이 작동함
}

export function drawCurseNormalEffect(
  _targetCtx: any,
  _frame: BattleFrame,
  _drawCtx: EffectDrawContext
) {
  // 일반타입 저주는 별도의 기술 이펙트 없이 시전자 움직임 후 엔진 랭크 애니메이션이 작동함
}

// ----------------------------------------------------------------------------
// B. 고스트 타입 버전 (Curse - Ghost)
// - 개념: 짚인형에 못을 박는 저주의 의식 (Voodoo Nail & Hex Brand)
// - Step 1: 칠흑 보랏빛 암전 & 저주의 대못과 유령 해머 소환
// - Step 2: 해머가 못을 시전자에게 내리찍어 최대 HP 50% 희생 (쾅! 쾅! 타격 & 영혼 파편)
// - Step 3: 카메라 타겟 글라이드 & 원혼 그림자 쇄도 ➔ 상대 가슴에 저주 각인 직격 쾅!!
// - Step 4: 상대 주위를 맴도는 3기 도깨비불(Will-o'-Wisps) & 저주 상태이상 각인
// - Step 5: 저주의 불씨가 상대에게 깃들며 페이드아웃 및 카메라 복귀
// ----------------------------------------------------------------------------

/**
 * 정통 일반 대못 (Regular Iron Curse Nail) 드로우 헬퍼
 * - 쐐기형이 아닌 실물 규격의 정통 쇠못 (Flat Cap + Straight Stem + Tapered Tip)
 * - isEmbedded: true 시 하단에 가로 검정색 타원(관통 구멍)을 그리고, 못이 구멍 속으로 박힌 형상 연출
 */
function drawCurseNail(
  ctx: any,
  cx: number,
  cy: number,
  scale: number = 1.0,
  angle: number = 0,
  alpha: number = 1.0,
  embedProgress: number = 0.0 // 0.0: 대기(살짝 꽂힌 상태) ~ 1.0: 깊숙이 박힌 상태
) {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const holeY = cy; // 박힌 기준면
  const holeRadiusX = 13 * scale;
  const holeRadiusY = 5.5 * scale;

  // 1. 아랫부분 가로 검정 원 (관통 구멍)
  ctx.save();
  ctx.translate(cx, holeY);
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.ellipse(0, 0, holeRadiusX, holeRadiusY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. 못 본체 렌더링
  // 못의 아랫부분이 검정 원 밖으로 노출되지 않도록 클리핑:
  // holeY + 1 * scale 아래로는 체내/구멍 안이므로 절대 노출되지 않음!
  ctx.save();
  ctx.beginPath();
  ctx.rect(cx - 150 * scale, holeY - 200 * scale, 300 * scale, (200 + 1) * scale);
  ctx.clip();

  // 못 중심 좌표 계산:
  // embedProgress:
  // 0.00: 살짝 꽂힌 대기 상태 (headTop이 holeY 위 40px)
  // 0.35: 1st 쿵 ➔ 못이 1단계 더 들어감 (headTop이 holeY 위 33px)
  // 0.68: 2nd 쿵 ➔ 못이 2단계 더 들어감 (headTop이 holeY 위 26px)
  // 1.00: 3rd 쿵 ➔ 못이 3단계 완전히 깊숙이 박힘 (headTop이 holeY 위 19px)
  const sinkY = holeY - 15 * scale + embedProgress * 21 * scale;

  ctx.translate(cx, sinkY);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  // ---------------------------------------------------------------------------
  // A. 못 머리 (Rounded Flat Head Cap - 너비 13px, 두께 3.8px, border-radius 적용)
  // ---------------------------------------------------------------------------
  const headW = 13;
  const headH = 3.8;
  const headTop = -25;
  const headR = 1.6;

  // 못 머리 베이스 (둥근 모서리)
  ctx.save();
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(-headW / 2, headTop, headW, headH, [headR, headR, 0.8, 0.8]);
  } else {
    ctx.rect(-headW / 2, headTop, headW, headH);
  }
  ctx.fillStyle = "#475569";
  ctx.fill();

  // 클리핑하여 상단 하이라이트 & 하단 그림자를 둥근 머리 안에 정밀 렌더링
  ctx.clip();

  // 못 머리 상단 하이라이트 (금속 광택)
  ctx.fillStyle = "#CBD5E1";
  ctx.fillRect(-headW / 2, headTop, headW, 1.4);

  // 못 머리 하단 언더컷 그림자
  ctx.fillStyle = "#0F172A";
  ctx.fillRect(-headW / 2, headTop + headH - 1.0, headW, 1.0);

  ctx.restore();

  // 못 머리 테두리 (둥근 외곽선)
  ctx.strokeStyle = "#1E293B";
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(-headW / 2, headTop, headW, headH, [headR, headR, 0.8, 0.8]);
  } else {
    ctx.rect(-headW / 2, headTop, headW, headH);
  }
  ctx.stroke();

  // ---------------------------------------------------------------------------
  // B. 못 몸통 (Straight Cylindrical Stem - 너비 6px 고정 직사각형, 길이 50px)
  // ---------------------------------------------------------------------------
  const stemW = 6;
  const stemHalf = stemW / 2; // 3px
  const stemTop = headTop + headH; // -21.2
  const stemBottom = 30; // 넉넉히 구멍 안으로 이어지도록 연장

  // 좌측 절반: 밝은 실버 메탈 하이라이트 (-3 ~ 0)
  ctx.fillStyle = "#94A3B8";
  ctx.fillRect(-stemHalf, stemTop, stemHalf, stemBottom - stemTop);

  // 우측 절반: 짙은 스틸 섀도우 (0 ~ +3)
  ctx.fillStyle = "#334155";
  ctx.fillRect(0, stemTop, stemHalf, stemBottom - stemTop);

  // 좌측 1px 스페큘러 반사광선
  ctx.fillStyle = "#F1F5F9";
  ctx.fillRect(-stemHalf + 0.8, stemTop, 1.0, stemBottom - stemTop);

  // 몸통 외곽선
  ctx.strokeStyle = "#1E293B";
  ctx.lineWidth = 1.0;
  ctx.strokeRect(-stemHalf, stemTop, stemW, stemBottom - stemTop);

  ctx.restore();
  ctx.restore();
}

/**
 * 174: 저주 (고스트 타입) 배경 이펙트: 칠흑의 보랏빛 오컬트 암전
 */
export function drawCurseGhostBehindEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const ctx = targetCtx;
  const moveStep = frame.moveStep || 1;
  const p = frame.effectProgress || 0;

  // 기승전결 칠흑 암전 강도
  let darkAlpha = 0;
  if (moveStep === 1) {
    darkAlpha = 0.20 + p * 0.35; // 0.20 -> 0.55
  } else if (moveStep === 2) {
    darkAlpha = 0.55 + Math.sin(p * Math.PI * 2) * 0.12;
  } else if (moveStep === 3) {
    darkAlpha = 0.60 - p * 0.10; // 0.60 -> 0.50
  } else if (moveStep === 4) {
    darkAlpha = 0.50 - p * 0.20; // 0.50 -> 0.30
  } else if (moveStep === 5) {
    darkAlpha = Math.max(0, 0.30 * (1.0 - p)); // 0.30 -> 0.00
  }

  if (darkAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = darkAlpha;
    ctx.fillStyle = "#0B0314"; // 짙은 보랏빛 칠흑
    ctx.fillRect(-ctx.canvas.width * 4, -3000, ctx.canvas.width * 9, 6000);
    ctx.restore();
  }
}

/**
 * 174: 저주 (고스트 타입) 메인 이펙트
 * - 못의 아랫부분을 허공에 노출하지 않고, 살짝 아래로 내린 채로 검정 원 안에 들어있게 연출
 * - 쿵 > 쿵 > 쿵 3단계 타격마다 못이 점점 더 깊숙이 박히도록 구현
 */
export function drawCurseGhostEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const ctx = targetCtx;
  const { attackerPos: aPos, targetPos: tPos } = drawCtx;
  const isP = Boolean(drawCtx.isPlayer ?? (drawCtx as any).isPlayerAttacking ?? true);
  const moveStep = frame.moveStep || 1;
  const p = frame.effectProgress || 0;

  const ax = aPos.x + (isP ? (frame.pOffset?.x ?? 0) : (frame.eOffset?.x ?? 0));
  const ay = aPos.y + (isP ? (frame.pOffset?.y ?? 0) : (frame.eOffset?.y ?? 0)) - 10;

  const tx = tPos.x;
  const ty = tPos.y - 12;

  ctx.save();

  // ===========================================================================
  // Step 1: 시전자 가슴에 검정 원이 나타나고, 못이 살짝 아래로 내린 채로 검정 원 안에 위치
  // ===========================================================================
  if (moveStep === 1) {
    const t = Math.max(0, Math.min(1.0, p));
    const summonAlpha = Math.min(1.0, t * 1.5);
    const surfaceY = ay + 4; // 시전자 가슴 관통 기준면

    // 못의 아랫부분은 항상 검정 원 안에 머물며 대기 (embedProgress: 0.00)
    drawCurseNail(ctx, ax, surfaceY, 1.35, 0.02 * Math.sin(t * 3), summonAlpha, 0.00);
  }

  // ===========================================================================
  // Step 2: 쿵 > 쿵 > 쿵 3단계로 못이 점점 더 깊이 들어감 & HP 절반 희생
  // ===========================================================================
  else if (moveStep === 2) {
    const t = Math.max(0, Math.min(1.0, p));
    const surfaceY = ay + 4; // 시전자 가슴 관통 기준면

    // 쿵 > 쿵 > 쿵 3단계 타격 깊이:
    // Frame 1 (t <= 0.40): 1st 쿵 ➔ depth 0.35
    // Frame 2 (0.40 < t <= 0.75): 2nd 쿵 ➔ depth 0.68
    // Frame 3 (t > 0.75): 3rd 쿵 ➔ depth 1.00
    let embedProg = 0.35;
    let shudder = 0;

    if (t <= 0.40) {
      embedProg = 0.35;
      shudder = (Math.sin(t * 50) > 0 ? 1 : -1) * 1.4;
    } else if (t <= 0.75) {
      embedProg = 0.68;
      shudder = (Math.sin(t * 50) > 0 ? 1 : -1) * 1.8;
    } else {
      embedProg = 1.00;
      shudder = (Math.sin(t * 50) > 0 ? 1 : -1) * 2.2;
    }

    drawCurseNail(ctx, ax + shudder, surfaceY, 1.35, 0.02, 1.0, embedProg);
  }

  // ===========================================================================
  // Step 3: 상대방 가슴에 대못이 쿵 > 쿵 > 쿵 3단계로 더 깊이 들어감!
  // ===========================================================================
  else if (moveStep === 3) {
    const t = Math.max(0, Math.min(1.0, p));
    const targetSurfaceY = ty - 2;

    let embedProg = 0.35;
    let shudder = 0;

    if (t <= 0.40) {
      embedProg = 0.35;
      shudder = (Math.sin(t * 50) > 0 ? 1 : -1) * 1.4;
    } else if (t <= 0.75) {
      embedProg = 0.68;
      shudder = (Math.sin(t * 50) > 0 ? 1 : -1) * 1.8;
    } else {
      embedProg = 1.00;
      shudder = (Math.sin(t * 50) > 0 ? 1 : -1) * 2.2;
    }

    drawCurseNail(ctx, tx + shudder, targetSurfaceY, 1.4, 0.02, 1.0, embedProg);
  }

  // ===========================================================================
  // Step 4: 상대 가슴 검정 원 속 깊숙이 박힌 대못 유지
  // ===========================================================================
  else if (moveStep === 4) {
    const targetSurfaceY = ty - 2;

    drawCurseNail(ctx, tx, targetSurfaceY, 1.4, 0.02, 1.0, 1.00);
  }

  // ===========================================================================
  // Step 5: 대못과 검정 원이 서서히 페이드아웃 및 카메라 복귀
  // ===========================================================================
  else if (moveStep === 5) {
    const t = Math.max(0, Math.min(1.0, p));
    const fadeAlpha = Math.max(0, 1.0 - t * 1.2);
    const targetSurfaceY = ty - 2;

    if (fadeAlpha > 0.02) {
      drawCurseNail(ctx, tx, targetSurfaceY, 1.4, 0.02, fadeAlpha, 1.00);
    }
  }

  ctx.restore();
}

/**
 * 저주 (턴 종료 데미지) 배경 암전 이펙트
 */
export function drawCurseDamageBehindEffect(
  targetCtx: any,
  frame: BattleFrame,
  _drawCtx: EffectDrawContext
) {
  const ctx = targetCtx;
  const moveStep = frame.moveStep || 1;
  const p = frame.effectProgress || 0;

  let darkAlpha = 0;
  if (moveStep === 1) {
    darkAlpha = 0.35;
  } else if (moveStep === 2) {
    darkAlpha = 0.55;
  } else if (moveStep === 3) {
    darkAlpha = 0.40;
  } else if (moveStep === 4) {
    darkAlpha = Math.max(0, 0.40 * (1.0 - p));
  }

  if (darkAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = darkAlpha;
    ctx.fillStyle = "#0B0314";
    ctx.fillRect(-ctx.canvas.width * 4, -3000, ctx.canvas.width * 9, 6000);
    ctx.restore();
  }
}

/**
 * 저주 (턴 종료 데미지) 메인 피격 이펙트
 * - 매 턴 저주로 피해를 입는 대상의 가슴에 검정 원과 대못이 나타나 쿵! 하고 더 깊숙이 박히며 피해를 줌
 */
export function drawCurseDamageEffect(
  targetCtx: any,
  frame: BattleFrame,
  drawCtx: EffectDrawContext
) {
  const ctx = targetCtx;
  const { targetPos: tPos } = drawCtx;
  const moveStep = frame.moveStep || 1;
  const p = frame.effectProgress || 0;

  const tx = tPos.x;
  const ty = tPos.y - 12;

  ctx.save();

  if (moveStep === 1) {
    // 1. 대기: 검정 원에 대못이 살짝 꽂힌 채로 대기
    drawCurseNail(ctx, tx, ty, 1.4, 0.02, 1.0, 0.00);
  } else if (moveStep === 2) {
    // 2. 쿵! 타격: 못이 깊숙이 쾅 박히며 강한 충격 떨림
    const shudder = (Math.sin(p * 50) > 0 ? 1 : -1) * 2.2;
    drawCurseNail(ctx, tx + shudder, ty, 1.4, 0.02, 1.0, 1.00);
  } else if (moveStep === 3) {
    // 3. 유지: 깊숙이 박힌 상태 유지
    drawCurseNail(ctx, tx, ty, 1.4, 0.02, 1.0, 1.00);
  } else if (moveStep === 4) {
    // 4. 페이드아웃: 대못과 검정 원 소산
    const fadeAlpha = Math.max(0, 1.0 - p * 1.2);
    if (fadeAlpha > 0.02) {
      drawCurseNail(ctx, tx, ty, 1.4, 0.02, fadeAlpha, 1.00);
    }
  }

  ctx.restore();
}

