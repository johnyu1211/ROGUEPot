// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame, EffectDrawContext } from "../../../battle/moves/types.js";
import { drawTackleEffect } from "./move033_036.js";
import { drawFootprintStamp } from "./move025_028.js";
import { drawMiniRetroStar } from "../common/helpers.js";

/**
 * Gen 1 / Gen 2 Moves 165 - 168 Renderers
 * 
 * 165: 발버둥 (Struggle)
 * 166: 스케치 (Sketch)
 * 167: 트리플킥 (Triple Kick)
 */

// ============================================================================
// 165: 발버둥 (Struggle)
// ============================================================================

/**
 * 발버둥 3연속 타격 오프셋 위치 (타겟 기준 서로 다른 3곳)
 * 1타: 좌상단 (-20, -16)
 * 2타: 우하단 (+22, +14)
 * 3타: 중앙 피니시 (-2, -6)
 */
export const STRUGGLE_HIT_OFFSETS = [
  { x: -20, y: -16 }, // 1타: 좌상단
  { x: 22, y: 14 },   // 2타: 우하단
  { x: -2, y: -6 },   // 3타: 중앙 피니시
];

/**
 * 💥 발버둥 (Struggle) 타격 이펙트 렌더러
 * 
 * [유저 요구사항 100% 반영]:
 * 1. 시전 포켓몬 각도 좌우로 흔들흔들 (165_struggle.ts buildFrames에서 pRot / eRot 제어)
 * 2. 서로 다른 3곳 위치에 순차적으로 몸통박치기 타격 이펙트 직격
 *    - 1타: 좌상단 (-20, -16) 몸통박치기 타격 & 스타버스트
 *    - 2타: 우하단 (+22, +14) 몸통박치기 타격 & 스타버스트 (1타 충격파 잔향 오버랩)
 *    - 3타: 중앙 (-2, -6) 몸통박치기 피니시 직격 & 폭발적 충격파 전개 (반동 피해)
 */
export function drawStruggleEffect(
  targetCtx: any,
  frameOrTargetPos: any,
  drawCtxOrStep?: any
) {
  if (!frameOrTargetPos) return;

  // Modern call signature: (targetCtx, frame, drawCtx)
  if (
    typeof frameOrTargetPos === "object" &&
    ("showEffect" in frameOrTargetPos || "moveStep" in frameOrTargetPos || "delay" in frameOrTargetPos)
  ) {
    const frame = frameOrTargetPos as BattleFrame;
    const drawCtx = drawCtxOrStep as EffectDrawContext;
    if (!frame.showEffect || !drawCtx?.targetPos) return;

    const { targetPos, attackerPos, isPlayer } = drawCtx;
    const hitIndex = frame.hitIndex ?? 1;
    const hitProgress = frame.effectProgress ?? 0.5;
    const moveStep = frame.moveStep ?? 2;

    const curOffset = STRUGGLE_HIT_OFFSETS[(hitIndex - 1) % STRUGGLE_HIT_OFFSETS.length];
    const curHitPos = {
      x: targetPos.x + curOffset.x,
      y: targetPos.y + curOffset.y,
    };

    // 멀티히트 레이어링 잔향: 이전 타격의 소멸 충격파 잔향이 살아있으면 함께 렌더링
    if (hitIndex === 2 && moveStep === 3) {
      const prevOffset = STRUGGLE_HIT_OFFSETS[0];
      const prevPos = { x: targetPos.x + prevOffset.x, y: targetPos.y + prevOffset.y };
      drawTackleEffect(targetCtx, prevPos, attackerPos, 4, 0.85, isPlayer);
    } else if (hitIndex === 3 && moveStep === 4) {
      const prevOffset = STRUGGLE_HIT_OFFSETS[1];
      const prevPos = { x: targetPos.x + prevOffset.x, y: targetPos.y + prevOffset.y };
      drawTackleEffect(targetCtx, prevPos, attackerPos, 4, 0.85, isPlayer);
    }

    // 현재 타격 몸통박치기 이펙트
    // moveStep 5는 3타 이후 잔향 페이드아웃 (step 4)
    const tackleStep = moveStep === 5 ? 4 : 3;
    drawTackleEffect(targetCtx, curHitPos, attackerPos, tackleStep, hitProgress, isPlayer);
  } else {
    // Legacy fallback signature: (targetCtx, targetPos, step)
    const targetPos = frameOrTargetPos;
    const step = typeof drawCtxOrStep === "number" ? drawCtxOrStep : 3;
    drawTackleEffect(targetCtx, targetPos, undefined, step, 0.65, true);
  }
}

// ============================================================================
// 166: 스케치 (Sketch)
// ============================================================================

/**
 * 🎨 스케치 (Sketch) 이펙트 렌더러
 * 
 * [연출 시퀀스]:
 * 1. [Step 1] 시전자 붓질 와인드업: 시전자 쪽에서 캔버스를 향해 튀는 잉크 방울
 * 2. [Step 2] 캔버스 & 이젤 등장: 타겟 앞에 우든 이젤과 하얀 캔버스 출현, 브러시가 캔버스 위를 빠르게 춤추며 스케치 라인 형성
 * 3. [Step 3] 스케치 완성 & 페인트 폭발: 1프레임 섬광과 함께 캔버스에 마스터피스 완성, 비비드 4색(초록, 빨강, 파랑, 노랑) 페인트 스플래시 분출 및 스타버스트 비산
 * 4. [Step 4] 완성 잔향 및 페이드아웃: 별가루와 캔버스가 부드럽게 페이드아웃
 */
export function drawSketchEffect(
  targetCtx: any,
  frameOrTargetPos: any,
  drawCtxOrStep?: any
) {
  if (!frameOrTargetPos) return;

  let frame: BattleFrame | null = null;
  let drawCtx: EffectDrawContext | null = null;
  let targetPos = { x: 380, y: 130 };
  let attackerPos = { x: 130, y: 260 };
  let isPlayer = true;
  let moveStep = 2;
  let effectProgress = 0.5;

  if (
    typeof frameOrTargetPos === "object" &&
    ("showEffect" in frameOrTargetPos || "moveStep" in frameOrTargetPos || "delay" in frameOrTargetPos)
  ) {
    frame = frameOrTargetPos as BattleFrame;
    drawCtx = drawCtxOrStep as EffectDrawContext;
    if (!frame.showEffect || !drawCtx?.targetPos) return;

    targetPos = drawCtx.targetPos;
    attackerPos = drawCtx.attackerPos || attackerPos;
    isPlayer = drawCtx.isPlayer;
    moveStep = frame.moveStep ?? 2;
    effectProgress = frame.effectProgress ?? 0.5;
  } else {
    targetPos = frameOrTargetPos;
    moveStep = typeof drawCtxOrStep === "number" ? drawCtxOrStep : 2;
    effectProgress = 0.5;
  }

  const ctx = targetCtx;
  ctx.save();

  // Easel & Canvas 위치: 피격 포켓몬 중심 약간 앞/아래쪽
  const easelX = targetPos.x;
  const easelY = targetPos.y + 12;
  const canvasW = 62;
  const canvasH = 46;
  const canvasX = easelX;
  const canvasY = easelY - 14;

  // -------------------------------------------------------------------------
  // Step 1: 시전자 돌진 및 붓질 준비 (발사 물감 배제)
  // -------------------------------------------------------------------------
  if (moveStep === 1) {
    // 발사 물감 제거 및 시전자 돌진에 집중
  }

  // -------------------------------------------------------------------------
  // Step 2: 캔버스 & 이젤 등장 + 붓 드로잉 (스케치)
  // -------------------------------------------------------------------------
  else if (moveStep === 2) {
    const t = Math.min(1.0, Math.max(0.0, effectProgress));

    // 이젤 및 캔버스 팝업 탄성 스케일 (0.4 -> 1.08 -> 1.0)
    let popScale = 1.0;
    if (t < 0.3) {
      popScale = 0.4 + (t / 0.3) * 0.68;
    } else if (t < 0.45) {
      popScale = 1.08 - ((t - 0.3) / 0.15) * 0.08;
    }

    ctx.save();
    ctx.translate(canvasX, canvasY);
    ctx.scale(popScale, popScale);
    ctx.translate(-canvasX, -canvasY);

    // 1. 우든 이젤 (Easel) 삼각대 다리 & 지지대
    ctx.save();
    ctx.strokeStyle = "#8B5A2B"; // rich wood brown
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";

    // 좌측 다리
    ctx.beginPath();
    ctx.moveTo(easelX - 3, easelY - 32);
    ctx.lineTo(easelX - 25, easelY + 36);
    ctx.stroke();

    // 우측 다리
    ctx.beginPath();
    ctx.moveTo(easelX + 3, easelY - 32);
    ctx.lineTo(easelX + 25, easelY + 36);
    ctx.stroke();

    // 중앙 지지대
    ctx.strokeStyle = "#653818";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(easelX, easelY - 34);
    ctx.lineTo(easelX, easelY + 38);
    ctx.stroke();

    // 이젤 가로 선반 (Shelf)
    ctx.fillStyle = "#8B5A2B";
    ctx.strokeStyle = "#4A2711";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(easelX - 28, easelY + 10, 56, 5, 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 2. 캔버스 보드 (Canvas Board)
    ctx.save();
    // 외곽 브라운 액자 테두리
    ctx.fillStyle = "#78350F";
    ctx.beginPath();
    ctx.roundRect(canvasX - canvasW / 2 - 2, canvasY - canvasH / 2 - 2, canvasW + 4, canvasH + 4, 3);
    ctx.fill();

    // 캔버스 아이보리 면
    ctx.fillStyle = "#FFFDF5";
    ctx.beginPath();
    ctx.roundRect(canvasX - canvasW / 2, canvasY - canvasH / 2, canvasW, canvasH, 2);
    ctx.fill();

    // 캔버스 상단 금속 클립
    ctx.fillStyle = "#D97706";
    ctx.fillRect(canvasX - 7, canvasY - canvasH / 2 - 3, 14, 4);
    ctx.fillStyle = "#FEF3C7";
    ctx.fillRect(canvasX - 5, canvasY - canvasH / 2 - 2, 10, 1.5);

    // 3. 캔버스 내부 스케치 라인 (Sketch Lines)
    // t 진행도에 따라 스케치 선이 차례로 그려짐
    ctx.save();
    // 캔버스 내부로 클리핑하여 밖으로 삐져나가지 않도록 처리
    ctx.beginPath();
    ctx.rect(canvasX - canvasW / 2 + 2, canvasY - canvasH / 2 + 2, canvasW - 4, canvasH - 4);
    ctx.clip();

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // 1단계 스케치: 역동적인 사선 해칭 & 기본 타원 윤곽 (t >= 0.15)
    if (t >= 0.15) {
      ctx.strokeStyle = "rgba(71, 85, 105, 0.75)";
      ctx.lineWidth = 1.5;

      // 크로스 해치 라인
      ctx.beginPath();
      ctx.moveTo(canvasX - 18, canvasY - 10);
      ctx.lineTo(canvasX - 6, canvasY - 14);
      ctx.moveTo(canvasX - 16, canvasY - 4);
      ctx.lineTo(canvasX - 4, canvasY - 8);
      ctx.stroke();

      // 메인 윤곽원 (몬스터볼 / 포켓몬 형태)
      const arcEnd = Math.min(Math.PI * 2, (t / 0.7) * Math.PI * 2);
      ctx.strokeStyle = "#1E293B";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 14, -Math.PI / 2, -Math.PI / 2 + arcEnd);
      ctx.stroke();
    }

    // 2단계 스케치: 중앙 분할선 & 버튼 & 귀/스파크 디테일 (t >= 0.45)
    if (t >= 0.45) {
      ctx.strokeStyle = "#1E293B";
      ctx.lineWidth = 2.0;

      // 중앙 분할선
      ctx.beginPath();
      ctx.moveTo(canvasX - 14, canvasY);
      ctx.lineTo(canvasX + 14, canvasY);
      ctx.stroke();

      // 중앙 원 버튼
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 상단 루브도 그린 붓터치 워시 (수채화 느낌)
      ctx.fillStyle = "rgba(16, 185, 129, 0.45)";
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 13, Math.PI, 0);
      ctx.fill();

      // 하단 옐로우 붓터치 워시
      ctx.fillStyle = "rgba(251, 191, 36, 0.45)";
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 13, 0, Math.PI);
      ctx.fill();
    }

    // 3단계 스케치: 별빛 포인트 및 액센트 (t >= 0.75)
    if (t >= 0.75) {
      drawMiniRetroStar(ctx, canvasX + 18, canvasY - 12, 6, "#F59E0B");
      drawMiniRetroStar(ctx, canvasX - 18, canvasY + 10, 5, "#10B981");
    }

    ctx.restore(); // 클리핑 해제
    ctx.restore(); // 캔버스 보드 복원

    // 4. 역동적인 붓 (Paintbrush)
    // 붓의 팁이 스케치 궤적을 따라 회전하며 생동감 있게 춤춤
    ctx.save();
    // 붓끝 이동 궤적 계산
    const brushAngle = -Math.PI / 4 + Math.sin(t * Math.PI * 5) * 0.25;
    const pathAngle = t * Math.PI * 3.5;
    const brushTipX = canvasX + Math.cos(pathAngle) * 14;
    const brushTipY = canvasY + Math.sin(pathAngle) * 9;

    ctx.translate(brushTipX, brushTipY);
    ctx.rotate(brushAngle);

    // 붓 털 (Bristle & Green Paint)
    ctx.fillStyle = "#10B981"; // 루브도 시그니처 에메랄드 그린 물감
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-3, -7);
    ctx.lineTo(3, -7);
    ctx.closePath();
    ctx.fill();

    // 붓 금속 페룰 (Ferrule)
    ctx.fillStyle = "#CBD5E1";
    ctx.fillRect(-3, -11, 6, 4);

    // 붓 나무 자루 (Handle)
    ctx.fillStyle = "#B45309";
    ctx.fillRect(-2, -26, 4, 15);
    ctx.fillStyle = "#92400E";
    ctx.fillRect(1, -26, 1, 15);

    ctx.restore();

    // 붓끝에서 튀는 미세 페인트 파티클
    ctx.fillStyle = "#10B981";
    ctx.beginPath();
    ctx.arc(brushTipX + 4, brushTipY - 3, 1.5, 0, Math.PI * 2);
    ctx.arc(brushTipX - 3, brushTipY + 4, 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // 팝업 스케일 복원
  }

  // -------------------------------------------------------------------------
  // Step 3: 스케치 완성! 순백 플래시 & 컬러풀 페인트 스플래시 & 스타버스트 폭발
  // -------------------------------------------------------------------------
  else if (moveStep === 3) {
    const t = Math.min(1.0, Math.max(0.0, effectProgress));

    // 1. 우든 이젤
    ctx.save();
    ctx.strokeStyle = "#8B5A2B";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(easelX - 3, easelY - 32);
    ctx.lineTo(easelX - 25, easelY + 36);
    ctx.moveTo(easelX + 3, easelY - 32);
    ctx.lineTo(easelX + 25, easelY + 36);
    ctx.stroke();

    ctx.strokeStyle = "#653818";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(easelX, easelY - 34);
    ctx.lineTo(easelX, easelY + 38);
    ctx.stroke();

    ctx.fillStyle = "#8B5A2B";
    ctx.strokeStyle = "#4A2711";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(easelX - 28, easelY + 10, 56, 5, 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 2. 완성된 마스터피스 캔버스 보드 (금빛 테두리 글로우)
    ctx.save();
    ctx.fillStyle = "#F59E0B";
    ctx.beginPath();
    ctx.roundRect(canvasX - canvasW / 2 - 3, canvasY - canvasH / 2 - 3, canvasW + 6, canvasH + 6, 4);
    ctx.fill();

    ctx.fillStyle = "#FFFDF5";
    ctx.beginPath();
    ctx.roundRect(canvasX - canvasW / 2, canvasY - canvasH / 2, canvasW, canvasH, 2);
    ctx.fill();

    // 캔버스 안 완성된 그림: 비비드 몬스터볼 아트
    ctx.save();
    ctx.beginPath();
    ctx.rect(canvasX - canvasW / 2 + 2, canvasY - canvasH / 2 + 2, canvasW - 4, canvasH - 4);
    ctx.clip();

    // 상단 레드
    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 14, Math.PI, 0);
    ctx.fill();

    // 하단 화이트
    ctx.fillStyle = "#F8FAFC";
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 14, 0, Math.PI);
    ctx.fill();

    // 테두리 및 분할선
    ctx.strokeStyle = "#1E293B";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 14, 0, Math.PI * 2);
    ctx.moveTo(canvasX - 14, canvasY);
    ctx.lineTo(canvasX + 14, canvasY);
    ctx.stroke();

    // 중앙 버튼
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore(); // 클리핑 해제
    ctx.restore(); // 캔버스 보드 복원

    // 3. 확산하는 충격파 링 (Shockwave Rings) - 유저 요청: 링만 더 빠르게 투명화
    const ringRadius = 14 + t * 48;
    const ringAlpha = Math.max(0, Math.pow(Math.max(0, 1 - t * 1.9), 1.8) * 0.85);
    if (ringAlpha > 0.01) {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${ringAlpha})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(16, 185, 129, ${ringAlpha * 0.75})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, ringRadius * 0.82, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 4. 4방향 컬러풀 페인트 스플래시 (Paint Splashes)
    // 4가지 대표 색상: 에메랄드 그린, 루비 레드, 선샤인 옐로우, 스카이 블루
    const splashes = [
      { angle: -Math.PI * 0.75, color: "#10B981", core: "#34D399" }, // 좌상단 그린
      { angle: -Math.PI * 0.25, color: "#EF4444", core: "#F87171" }, // 우상단 레드
      { angle:  Math.PI * 0.30, color: "#F59E0B", core: "#FDE047" }, // 우하단 옐로우
      { angle:  Math.PI * 0.80, color: "#3B82F6", core: "#60A5FA" }, // 좌하단 블루
    ];

    const dist = 16 + t * 38;
    const splashAlpha = Math.max(0, 1.0 - t * 0.8);

    for (const sp of splashes) {
      const sx = canvasX + Math.cos(sp.angle) * dist;
      const sy = canvasY + Math.sin(sp.angle) * dist;

      ctx.save();
      ctx.globalAlpha = splashAlpha;

      // 메인 페인트 물방울
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.arc(sx, sy, 5.5 * (1.0 - t * 0.25), 0, Math.PI * 2);
      ctx.fill();

      // 코어 광택
      ctx.fillStyle = sp.core;
      ctx.beginPath();
      ctx.arc(sx - 1.2, sy - 1.2, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // 비산하는 작은 물방울 2개
      const sx2 = sx + Math.cos(sp.angle + 0.3) * (7 + t * 8);
      const sy2 = sy + Math.sin(sp.angle + 0.3) * (7 + t * 8);
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.arc(sx2, sy2, 2.2, 0, Math.PI * 2);
      ctx.fill();

      const sx3 = sx + Math.cos(sp.angle - 0.35) * (9 + t * 10);
      const sy3 = sy + Math.sin(sp.angle - 0.35) * (9 + t * 10);
      ctx.beginPath();
      ctx.arc(sx3, sy3, 1.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 5. 완성 축하 미니 레트로 스타 (Sparkling Retro Stars)
    const starProgress = t;
    const stars = [
      { x: canvasX - 28, y: canvasY - 24, size: 7.5, color: "#FDE047", rot: t * 3.0 },
      { x: canvasX + 30, y: canvasY - 22, size: 8.0, color: "#FFFFFF", rot: -t * 2.8 },
      { x: canvasX + 26, y: canvasY + 22, size: 6.5, color: "#FBBF24", rot: t * 2.5 },
      { x: canvasX - 26, y: canvasY + 20, size: 7.0, color: "#34D399", rot: -t * 2.2 },
      { x: canvasX, y: canvasY - 32, size: 9.0, color: "#FEF08A", rot: t * 3.5 },
    ];

    for (const st of stars) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1.0 - starProgress * 0.4);
      drawMiniRetroStar(ctx, st.x, st.y, st.size, st.color, st.rot);
      ctx.restore();
    }
  }

  // -------------------------------------------------------------------------
  // Step 4: 잔향 소산 & 안착 (Fadeout)
  // -------------------------------------------------------------------------
  else if (moveStep >= 4) {
    const t = Math.min(1.0, Math.max(0.0, effectProgress));
    const fadeAlpha = Math.max(0, 1.0 - t * 1.6);
    if (fadeAlpha <= 0.01) {
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.globalAlpha = fadeAlpha;

    // 반투명 이젤
    ctx.strokeStyle = "#8B5A2B";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(easelX - 3, easelY - 32);
    ctx.lineTo(easelX - 25, easelY + 36);
    ctx.moveTo(easelX + 3, easelY - 32);
    ctx.lineTo(easelX + 25, easelY + 36);
    ctx.stroke();

    ctx.fillStyle = "#8B5A2B";
    ctx.beginPath();
    ctx.roundRect(easelX - 28, easelY + 10, 56, 5, 2);
    ctx.fill();

    // 반투명 캔버스
    ctx.fillStyle = "#FFFDF5";
    ctx.strokeStyle = "#78350F";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.roundRect(canvasX - canvasW / 2, canvasY - canvasH / 2, canvasW, canvasH, 2);
    ctx.fill();
    ctx.stroke();

    // 캔버스 안 완성 그림
    ctx.save();
    ctx.beginPath();
    ctx.rect(canvasX - canvasW / 2 + 2, canvasY - canvasH / 2 + 2, canvasW - 4, canvasH - 4);
    ctx.clip();
    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 14, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#F8FAFC";
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 14, 0, Math.PI);
    ctx.fill();
    ctx.restore();

    // 은은한 잔여 별빛
    drawMiniRetroStar(ctx, canvasX + 20, canvasY - 18, 5, "#FDE047", t * 2);
    drawMiniRetroStar(ctx, canvasX - 20, canvasY + 16, 4.5, "#FFFFFF", -t * 2);

    ctx.restore();
  }

  ctx.restore();
}

// ============================================================================
// 167: 트리플킥 (Triple Kick)
// ============================================================================

/**
 * 트리플킥 3연타 타격 기준 오프셋
 * 1타: 타겟 하단 좌측 (-14, +12) - 날렵한 로우 킥 / 스냅 킥
 * 2타: 타겟 상단 우측 (+16, -12) - 반대 방향 하이 스핀 킥
 * 3타: 타겟 중앙 살짝 위 (0, -4) - 피니시 액스 / 서머솔트 풀파워 드롭 킥
 */
export const TRIPLE_KICK_HIT_OFFSETS = [
  { x: -14, y: 12 }, // 1타
  { x: 16, y: -12 }, // 2타
  { x: 0, y: -4 },   // 3타
];

/**
 * 킥 궤적 초승달(호) 그리기 헬퍼
 * 양 끝단이 100% 완전 투명해지며 바늘처럼 예리하게 빠지는 테이퍼드 페이드 곡선
 */
function drawKickCrescentArc(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  sweepAngle: number,
  thickness: number,
  coreColor: string,
  edgeColor: string,
  alpha: number
) {
  if (alpha <= 0.01) return;
  ctx.save();

  const numSteps = 16;

  for (let i = 0; i < numSteps; i++) {
    const f0 = i / numSteps;
    const f1 = (i + 1) / numSteps;
    const fMid = (f0 + f1) * 0.5;

    // 양 끝단 완전 투명화 (sin(0) = 0, sin(PI) = 0, sin(PI/2) = 1)
    const endFade = Math.sin(fMid * Math.PI);
    const segAlpha = alpha * Math.pow(endFade, 0.85); // 양 끝단 부드러운 투명 페이드
    if (segAlpha <= 0.01) continue;

    const a0 = startAngle + f0 * sweepAngle;
    const a1 = startAngle + f1 * sweepAngle;
    // 끝부분으로 갈수록 두께도 0px로 자연스럽게 얇아짐
    const curThickness = thickness * Math.min(1.0, Math.pow(endFade, 0.65));
    const rOuter = radius;
    const rInner = radius - curThickness;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1.0, segAlpha));

    // 몸체 궤적호
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter, a0 - 0.01, a1 + 0.01, false);
    ctx.arc(cx, cy, rInner, a1 + 0.01, a0 - 0.01, true);
    ctx.closePath();
    ctx.fillStyle = edgeColor;
    ctx.fill();

    // 중심 코어 하이라이트 라인
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = Math.max(0.8, curThickness * 0.38);
    ctx.beginPath();
    ctx.arc(cx, cy, radius - curThickness * 0.45, a0 - 0.01, a1 + 0.01, false);
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
}

/**
 * 십자 광원 섬광 (Cross Flare)
 */
function drawCrossFlare(
  ctx: any,
  cx: number,
  cy: number,
  length: number,
  thickness: number,
  coreColor: string,
  outerColor: string,
  alpha: number,
  rotation: number = 0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));

  const drawRay = (ang: number, len: number, thick: number) => {
    ctx.save();
    ctx.rotate(ang);
    const grad = ctx.createLinearGradient(-len, 0, len, 0);
    grad.addColorStop(0.0, "rgba(255, 255, 255, 0)");
    grad.addColorStop(0.3, outerColor);
    grad.addColorStop(0.5, coreColor);
    grad.addColorStop(0.7, outerColor);
    grad.addColorStop(1.0, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(-len, 0);
    ctx.lineTo(0, -thick);
    ctx.lineTo(len, 0);
    ctx.lineTo(0, thick);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  drawRay(0, length, thickness);
  drawRay(Math.PI / 2, length, thickness);

  ctx.restore();
}

/**
 * 다이아몬드 타격 충격파 스타버스트 (원형 배제, 순수 날카로운 마름모/크로스 형태)
 */
function drawDiamondImpactBurst(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  coreColor: string,
  alpha: number
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));

  // 1. 외곽 세로 다이아몬드
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius);
  ctx.lineTo(cx + radius * 0.45, cy);
  ctx.lineTo(cx, cy + radius);
  ctx.lineTo(cx - radius * 0.45, cy);
  ctx.closePath();
  ctx.fill();

  // 2. 외곽 가로 다이아몬드
  ctx.beginPath();
  ctx.moveTo(cx - radius, cy);
  ctx.lineTo(cx, cy - radius * 0.45);
  ctx.lineTo(cx + radius, cy);
  ctx.lineTo(cx, cy + radius * 0.45);
  ctx.closePath();
  ctx.fill();

  // 3. 중심 순백 다이아몬드 코어 (원형 제거, 날카로운 마름모 일체화)
  ctx.fillStyle = coreColor;
  const coreR = radius * 0.38;
  ctx.beginPath();
  ctx.moveTo(cx, cy - coreR);
  ctx.lineTo(cx + coreR * 0.6, cy);
  ctx.lineTo(cx, cy + coreR);
  ctx.lineTo(cx - coreR * 0.6, cy);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 💥 167: 트리플킥 (Triple Kick) 이펙트 렌더러
 * 
 * [원/링형 불일치 요소 100% 완전 배제]:
 * - 어색하게 겉도는 원형 링(Shockwave Ring) 및 원형 버스트 완전 삭제
 * - 킥 고유의 날렵한 초승달 아크(Crescent Arc) + 예리한 십자 섬광(Cross Flare) + 마름모 스타버스트로 일체화
 */
export function drawTripleKickEffect(
  targetCtx: any,
  frameOrTargetPos: any,
  drawCtxOrStep?: any
) {
  if (!frameOrTargetPos) return;

  // Modern call signature: (targetCtx, frame, drawCtx)
  if (
    typeof frameOrTargetPos === "object" &&
    ("showEffect" in frameOrTargetPos || "moveStep" in frameOrTargetPos || "delay" in frameOrTargetPos)
  ) {
    const frame = frameOrTargetPos as BattleFrame;
    const drawCtx = drawCtxOrStep as EffectDrawContext;
    if (!frame.showEffect || !drawCtx?.targetPos) return;

    const { targetPos, isPlayer } = drawCtx;
    const hitIndex = frame.hitIndex ?? 1;
    const p = frame.effectProgress ?? 0.5;
    const moveStep = frame.moveStep ?? 2;

    const dirSign = isPlayer ? 1 : -1;
    const curOffset = TRIPLE_KICK_HIT_OFFSETS[(hitIndex - 1) % TRIPLE_KICK_HIT_OFFSETS.length];
    const hitX = targetPos.x + curOffset.x;
    const hitY = targetPos.y + curOffset.y;

    // -------------------------------------------------------------------------
    // 1타: 로우/스냅 킥 (hitIndex: 1, moveStep: 2) - 작은 발바닥 스탬프 (scale 0.95)
    // -------------------------------------------------------------------------
    if (hitIndex === 1 && moveStep === 2) {
      const arcAlpha = Math.max(0, 1.0 - p * 0.75);
      // 대각선 상향 킥 아크 (반경 28px, 두께 6.5px, 고대비 비비드 오렌지/레드)
      drawKickCrescentArc(
        targetCtx,
        hitX - 6,
        hitY + 8,
        28,
        -Math.PI * 0.75,
        Math.PI * 0.88,
        6.5,
        "#FFFFFF",
        "#EA580C",
        arcAlpha
      );

      // 🐾 1타 타격점 중앙 발바닥 스탬프 (1단계: scale 0.95, 우상향 궤적 각도 정렬)
      const footAngle1 = (0.62 + (1.0 - p) * 0.15) * dirSign;
      const footAlpha1 = Math.max(0, Math.min(1.0, (1.0 - (p - 0.15) * 1.25)));
      drawFootprintStamp(targetCtx, hitX, hitY, 0.95, footAngle1, "#EA580C", "rgba(154, 52, 18, 0.55)", footAlpha1);

      // 1타 타격 십자 섬광 (선명한 주황 림 & 순백 코어)
      const flareAlpha = Math.max(0, 1.0 - Math.abs(p - 0.4) * 2.0);
      drawCrossFlare(targetCtx, hitX, hitY, 22 + p * 10, 3.2, "#FFFFFF", "#F97316", flareAlpha, 0.2);

      // 1타 다이아몬드 타격 버스트
      drawDiamondImpactBurst(targetCtx, hitX, hitY, 14 + p * 8, "#EA580C", "#FFFFFF", flareAlpha);

      // 선명한 파이팅 스파크 (오렌지 & 딥레드)
      if (p > 0.2) {
        const sparkP = (p - 0.2) / 0.8;
        drawMiniRetroStar(targetCtx, hitX - 16 * sparkP, hitY - 14 * sparkP, 5.0, "#F97316", sparkP * 2.5);
        drawMiniRetroStar(targetCtx, hitX + 18 * sparkP, hitY + 12 * sparkP, 4.5, "#EF4444", -sparkP * 2.5);
      }
    }

    // -------------------------------------------------------------------------
    // 2타: 하이 스핀 킥 (hitIndex: 2, moveStep: 3) - 중간 발바닥 스탬프 (scale 1.30)
    // -------------------------------------------------------------------------
    else if (hitIndex === 2 && moveStep === 3) {
      const arcAlpha = Math.max(0, 1.0 - p * 0.75);
      // 반대 방향 대각선 하향 킥 아크 (반경 32px, 1.3배 이상 대형화)
      drawKickCrescentArc(
        targetCtx,
        hitX + 8,
        hitY - 8,
        32,
        Math.PI * 0.15,
        Math.PI * 0.95,
        7.0,
        "#FFFFFF",
        "#EA580C",
        arcAlpha
      );

      // 🐾 2타 타격점 중앙 발바닥 스탬프 (2단계: scale 1.30, 하향 스핀 궤적 각도 정렬)
      const footAngle2 = (-0.95 - (1.0 - p) * 0.18) * dirSign;
      const footAlpha2 = Math.max(0, Math.min(1.0, (1.0 - (p - 0.15) * 1.25)));
      drawFootprintStamp(targetCtx, hitX, hitY, 1.30, footAngle2, "#EA580C", "rgba(154, 52, 18, 0.65)", footAlpha2);

      // 2타 다이아몬드 스타버스트 & 십자 플레어
      const burstAlpha = Math.max(0, 1.0 - Math.abs(p - 0.45) * 2.0);
      drawDiamondImpactBurst(targetCtx, hitX, hitY, 18 + p * 10, "#F97316", "#FFFFFF", burstAlpha);
      drawCrossFlare(targetCtx, hitX, hitY, 28 + p * 12, 3.5, "#FFFFFF", "#EA580C", burstAlpha, -0.3);

      // 4방향 파이팅 스파크 비산
      const spDist = 14 + p * 32;
      drawMiniRetroStar(targetCtx, hitX + spDist * 0.8, hitY - spDist * 0.6, 5.5, "#FEF08A", p * 3);
      drawMiniRetroStar(targetCtx, hitX - spDist * 0.7, hitY - spDist * 0.7, 5.0, "#FFFFFF", -p * 2.5);
      drawMiniRetroStar(targetCtx, hitX + spDist * 0.6, hitY + spDist * 0.8, 5.0, "#F97316", p * 2);
      drawMiniRetroStar(targetCtx, hitX - spDist * 0.8, hitY + spDist * 0.5, 4.5, "#FBBF24", -p * 3);
    }

    // -------------------------------------------------------------------------
    // 3타: 피니시 풀파워 드롭 킥 (hitIndex: 3, moveStep: 5) - 초대형 피니시 발바닥 (scale 1.80)
    // -------------------------------------------------------------------------
    else if (hitIndex === 3 && moveStep === 5) {
      // 초대형 피니시 초승달 킥 충격파 호 (반경 42px, 두께 9.5px)
      const arcAlpha = Math.max(0, 1.0 - p * 0.7);
      drawKickCrescentArc(
        targetCtx,
        hitX - 4,
        hitY - 4,
        42,
        -Math.PI * 0.6,
        Math.PI * 1.15,
        9.5,
        "#FFFFFF",
        "#C2410C",
        arcAlpha
      );

      // 🐾 3타 피니시 타격점 중앙 발바닥 스탬프 (3단계 피니시: scale 1.80, 정확히 55도 각도 정렬)
      const footAngle3 = 0.96 * dirSign;
      const footAlpha3 = Math.max(0, Math.min(1.0, (1.0 - (p - 0.2) * 1.15)));
      drawFootprintStamp(targetCtx, hitX, hitY, 1.80, footAngle3, "#EA580C", "rgba(154, 52, 18, 0.75)", footAlpha3);

      // 대형 다이아몬드 스타버스트 (반경 최대 42px)
      const burstAlpha = Math.max(0, 1.0 - Math.abs(p - 0.4) * 1.8);
      drawDiamondImpactBurst(targetCtx, hitX, hitY, 26 + p * 16, "#DC2626", "#FFFFFF", burstAlpha);

      // 8방향 초강력 십자 & 대각선 플레어 빔
      drawCrossFlare(targetCtx, hitX, hitY, 44 + p * 20, 5.0, "#FFFFFF", "#F97316", burstAlpha, 0);
      drawCrossFlare(targetCtx, hitX, hitY, 32 + p * 14, 3.2, "#FEF08A", "#EA580C", burstAlpha * 0.8, Math.PI / 4);

      // 8방향 비산하는 고광택 파이팅 파티클 & 스파클 폭발
      const t = Math.max(0, Math.min(1.0, p));
      const dist = 18 + Math.pow(t, 0.85) * 58;

      const angles = [0.1, 0.9, 1.7, 2.5, 3.3, 4.1, 4.9, 5.7];
      const colors = ["#FFFFFF", "#FEF08A", "#F97316", "#EF4444", "#FBBF24", "#FFFFFF", "#EA580C", "#FDE047"];

      for (let i = 0; i < angles.length; i++) {
        const ang = angles[i];
        const px = hitX + Math.cos(ang) * dist * 1.15;
        const py = hitY + Math.sin(ang) * dist * 0.85;
        drawMiniRetroStar(targetCtx, px, py, 6.0 * (1.0 - t * 0.25), colors[i], t * 4 + i);
      }
    }

    // -------------------------------------------------------------------------
    // 소산 잔향 (moveStep 6) - 부드럽게 소멸
    // -------------------------------------------------------------------------
    else if (moveStep >= 6) {
      const t = Math.min(1.0, Math.max(0.0, p));
      const fadeAlpha = Math.max(0, 0.6 - t * 1.2);
      if (fadeAlpha > 0.02) {
        // 잔여 은은한 별가루
        drawMiniRetroStar(targetCtx, hitX + 22, hitY - 18, 4.5, "#FDE047", t * 2);
        drawMiniRetroStar(targetCtx, hitX - 20, hitY + 16, 4.0, "#FFFFFF", -t * 2);
        drawMiniRetroStar(targetCtx, hitX, hitY - 26, 5.0, "#F97316", t * 3);
      }
    }
  } else {
    // Legacy fallback signature: (targetCtx, targetPos, step)
    const targetPos = frameOrTargetPos;
    const step = typeof drawCtxOrStep === "number" ? drawCtxOrStep : 2;
    const hitOffset = TRIPLE_KICK_HIT_OFFSETS[(step - 1) % TRIPLE_KICK_HIT_OFFSETS.length];
    const hitX = targetPos.x + hitOffset.x;
    const hitY = targetPos.y + hitOffset.y;
    drawDiamondImpactBurst(targetCtx, hitX, hitY, 24, "#F97316", "#FFFFFF", 0.8);
    drawCrossFlare(targetCtx, hitX, hitY, 30, 3.5, "#FFFFFF", "#EA580C", 0.8, 0);
  }
}

// ============================================================================
// 168: 도둑질 (Thief)
// ============================================================================

/**
 * 부드러운 유기적 연막 퍼프 그리기 헬퍼
 */
function drawThiefSmokePuff(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  r: number,
  g: number,
  b: number,
  alpha: number
) {
  if (alpha <= 0.01 || radius <= 0.5) return;
  ctx.save();
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0.0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
  grad.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, ${alpha * 0.75})`);
  grad.addColorStop(1.0, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 🖤 168: 도둑질 (Thief) 이펙트 렌더러
 * 
 * [유저 요구사항 100% 반영]:
 * 1. 상대포커싱 (camera: target, zoom: 1.32)
 * 2. 회색연막 같은 게 좁은 범위로 대상 포켓몬 스프라이트 위에 퍼짐 (Step 2)
 * 3. 대상 포켓몬 회색화 (targetGreyTint: true, Step 3)
 * 4. 좀 더 어두운 회색 연기 같은 게 살짝 다각도로 퍼짐 (Step 3)
 * 5. 대상 포켓몬에게서 작은 흰색 구체가 시전 포켓몬에게로 이동 (Step 4)
 * 6. 시전 포켓몬에 안착하며 흡수 반짝임 (Step 5)
 */
export function drawThiefEffect(
  targetCtx: any,
  frameOrTargetPos: any,
  drawCtxOrStep?: any
) {
  if (!frameOrTargetPos) return;

  let frame: BattleFrame | null = null;
  let drawCtx: EffectDrawContext | null = null;
  let targetPos = { x: 380, y: 130 };
  let attackerPos = { x: 130, y: 260 };
  let moveStep = 2;
  let p = 0.5;

  if (
    typeof frameOrTargetPos === "object" &&
    ("showEffect" in frameOrTargetPos || "moveStep" in frameOrTargetPos || "delay" in frameOrTargetPos)
  ) {
    frame = frameOrTargetPos as BattleFrame;
    drawCtx = drawCtxOrStep as EffectDrawContext;
    if (!frame.showEffect || !drawCtx?.targetPos) return;

    targetPos = drawCtx.targetPos;
    attackerPos = drawCtx.attackerPos || attackerPos;
    moveStep = frame.moveStep ?? 2;
    p = frame.effectProgress ?? 0.5;
  } else {
    targetPos = frameOrTargetPos;
    moveStep = typeof drawCtxOrStep === "number" ? drawCtxOrStep : 2;
    p = 0.5;
  }

  const ctx = targetCtx;
  const tx = targetPos.x;
  const ty = targetPos.y;
  const ax = attackerPos.x;
  const ay = attackerPos.y;

  ctx.save();

  // -------------------------------------------------------------------------
  // Step 2: 좁은 범위의 부드러운 회색 연막 (Narrow Grey Smoke Cloud)
  // 대상 포켓몬 스프라이트 위에 살포시 피어오름
  // -------------------------------------------------------------------------
  if (moveStep === 2) {
    const t = Math.max(0, Math.min(1.0, p));
    const smokeAlpha = Math.min(0.88, Math.sin(t * Math.PI * 0.95) * 1.1);

    // 대상 스프라이트 크기에 딱 맞는 좁은 범위 (반경 ~32px 이내)
    const puffs = [
      { dx: 0, dy: -4, r: 24, delay: 0.0 },
      { dx: -12, dy: -10, r: 18, delay: 0.05 },
      { dx: 14, dy: -8, r: 20, delay: 0.08 },
      { dx: -8, dy: 8, r: 17, delay: 0.12 },
      { dx: 10, dy: 6, r: 19, delay: 0.15 },
      { dx: 2, dy: -18, r: 16, delay: 0.18 },
      { dx: -16, dy: 0, r: 15, delay: 0.20 },
    ];

    for (const pf of puffs) {
      const puffProg = Math.max(0, Math.min(1.0, (t - pf.delay) / (1.0 - pf.delay)));
      if (puffProg <= 0) continue;

      const curR = pf.r * (0.55 + puffProg * 0.55);
      const curAlpha = smokeAlpha * Math.min(1.0, puffProg * 1.5) * (1.0 - puffProg * 0.25);

      // 밝고 부드러운 슬레이트 그레이 톤 (148, 163, 184)
      drawThiefSmokePuff(ctx, tx + pf.dx, ty + pf.dy, curR, 148, 163, 184, curAlpha);
      // 코어 연무 (203, 213, 225)
      drawThiefSmokePuff(ctx, tx + pf.dx * 0.7, ty + pf.dy * 0.7, curR * 0.65, 203, 213, 225, curAlpha * 0.85);
    }
  }

  // -------------------------------------------------------------------------
  // Step 3: 대상 회색화 & 좀 더 어두운 회색 연기가 살짝 다각도로 퍼짐
  // (어두운 차콜/슬레이트 연기들이 8방향으로 살짝 퍼져 나감)
  // -------------------------------------------------------------------------
  else if (moveStep === 3) {
    const t = Math.max(0, Math.min(1.0, p));

    // 1. 잔여 1차 회색 연막의 은은한 소산
    const baseAlpha = Math.max(0, (1.0 - t * 0.9) * 0.55);
    if (baseAlpha > 0.02) {
      drawThiefSmokePuff(ctx, tx, ty - 4, 28 * (1.0 + t * 0.2), 148, 163, 184, baseAlpha);
    }

    // 2. 좀 더 어두운 회색 연기가 살짝 다각도로 퍼짐 (Dark Grey Multi-angle Smoke)
    // 8방향 비대칭 각도로 뻗어나가는 짙은 연무 (반경 22px -> 45px로 살짝 퍼짐)
    const angles = [
      0.15,
      0.88,
      1.65,
      2.42,
      3.20,
      3.95,
      4.78,
      5.55,
    ];

    const darkAlpha = Math.max(0, Math.sin(t * Math.PI) * 0.92);

    for (let i = 0; i < angles.length; i++) {
      const ang = angles[i];
      // 살짝 퍼지는 거리: 14px -> 38px
      const dist = 14 + t * 26 + (i % 2) * 5;
      const px = tx + Math.cos(ang) * dist;
      const py = ty + Math.sin(ang) * (dist * 0.75); // 타원형 완충 전개

      const puffRadius = (11 + (i % 3) * 3) * (0.7 + t * 0.45);

      // 깊고 어두운 차콜/슬레이트 그레이 (30, 41, 59 & 51, 65, 85)
      drawThiefSmokePuff(ctx, px, py, puffRadius, 51, 65, 85, darkAlpha * 0.85);
      drawThiefSmokePuff(ctx, px * 0.98 + tx * 0.02, py * 0.98 + ty * 0.02, puffRadius * 0.6, 30, 41, 59, darkAlpha);
    }

    // 3. Step 3 후반: 대상 중심에서 작은 흰색 빛무리 태동 응축 (t >= 0.5)
    if (t >= 0.5) {
      const spawnT = (t - 0.5) / 0.5;
      const spawnAlpha = spawnT * 0.95;
      const spawnR = 3.5 + spawnT * 2.5;

      ctx.save();
      // 순백 글로우
      const sGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, spawnR * 2.5);
      sGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.95)");
      sGrad.addColorStop(0.4, "rgba(255, 255, 255, 0.60)");
      sGrad.addColorStop(1.0, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.arc(tx, ty, spawnR * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // 순백 코어
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(tx, ty, spawnR * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // -------------------------------------------------------------------------
  // Step 4: 작은 흰색 구체가 대상 포켓몬에게서 시전 포켓몬에게로 이동
  // -------------------------------------------------------------------------
  else if (moveStep === 4) {
    const t = Math.max(0, Math.min(1.0, p));

    // 유려한 상향 아크 궤적 (2차 베지어 곡선)
    // 최고점 높이: 36px 위로 호를 그리며 날아감
    const arcHeight = -36 * Math.sin(t * Math.PI);
    const curX = tx + (ax - tx) * t;
    const curY = ty + (ay - ty) * t + arcHeight;

    // 1. 뒤따라오는 영롱한 순백 꼬리 잔상 (Trailing Sparkles)
    const trailSteps = 5;
    for (let i = 1; i <= trailSteps; i++) {
      const lagT = Math.max(0, t - i * 0.05);
      const lagArc = -36 * Math.sin(lagT * Math.PI);
      const lx = tx + (ax - tx) * lagT;
      const ly = ty + (ay - ty) * lagT + lagArc;
      const lagAlpha = Math.max(0, (1.0 - i / (trailSteps + 1)) * 0.75);
      const lagSize = Math.max(1.2, 4.0 - i * 0.6);

      ctx.save();
      ctx.globalAlpha = lagAlpha;
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.beginPath();
      ctx.arc(lx, ly, lagSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. 작은 흰색 구체 본체 (Small Glowing White Orb)
    ctx.save();
    // 외곽 부드러운 아우라 글로우
    const orbGlow = ctx.createRadialGradient(curX, curY, 0, curX, curY, 14);
    orbGlow.addColorStop(0.0, "rgba(255, 255, 255, 0.95)");
    orbGlow.addColorStop(0.35, "rgba(255, 255, 255, 0.70)");
    orbGlow.addColorStop(0.70, "rgba(226, 232, 240, 0.35)");
    orbGlow.addColorStop(1.0, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = orbGlow;
    ctx.beginPath();
    ctx.arc(curX, curY, 14, 0, Math.PI * 2);
    ctx.fill();

    // 순백 중심 코어
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(curX, curY, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // 미니 반짝임 십자 팁
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(curX - 7, curY);
    ctx.lineTo(curX + 7, curY);
    ctx.moveTo(curX, curY - 7);
    ctx.lineTo(curX, curY + 7);
    ctx.stroke();

    ctx.restore();

    // 3. 시전 포켓몬에게 도달 시 흡수 반짝임 (t >= 0.80)
    if (t >= 0.80) {
      const absorbT = (t - 0.80) / 0.20;
      const absorbAlpha = Math.sin(absorbT * Math.PI);
      drawMiniRetroStar(ctx, ax, ay - 6, 7 * (1.0 + absorbT * 0.3), "#FFFFFF", absorbT * 2);
      drawMiniRetroStar(ctx, ax + 8, ay - 14, 4.5, "#E2E8F0", -absorbT * 2);
    }
  }

  // -------------------------------------------------------------------------
  // Step 5: 시전 포켓몬 안착 & 미니 잔향 페이드아웃
  // -------------------------------------------------------------------------
  else if (moveStep >= 5) {
    const t = Math.max(0, Math.min(1.0, p));
    const fadeAlpha = Math.max(0, 1.0 - t * 1.5);
    if (fadeAlpha > 0.02) {
      ctx.save();
      ctx.globalAlpha = fadeAlpha;
      drawMiniRetroStar(ctx, ax, ay - 6, 5.0, "#FFFFFF", t * 3);
      drawMiniRetroStar(ctx, ax - 10, ay - 10, 4.0, "#E2E8F0", -t * 2);
      ctx.restore();
    }
  }

  ctx.restore();
}


