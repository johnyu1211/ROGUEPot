// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawPsychicMoveEffect, drawPsychicBehindEffect } from "../../../renderers/moves/gen1/move093_096.js";

/**
 * 094: 사이코키네시스 (Psychic) - 에스퍼 타입 최강 특수기 (위력 90, 10% 특방 1랭크 하락)
 *
 * 연출:
 * 1. 시전자 전방 3D 사이킥 에너지 링(원+외곽선+외곽 투명화 링) 군집 발현 & 딥 바이올렛 특수 암전 시작
 * 2. 3D 사이킥 링 다중 전개(좌측/Z축 하향 3D 틸트) & 전방 공명 파동 방출
 * 3. 대상 텔레키네틱 포획: 순백 실루엣 1차 부유 & 진동 (지상 원본 스프라이트 고정)
 * 4. 극대 사이코키네틱 구속: 역동적 공중 요동 & 고주파 진동 (오프셋 5px, 고도 -12px, 팽창 1.09x)
 * 5. 특이점 초고밀도 압축 진동 (폭발 직전 긴장)
 * 6. 사이킥 초신성 대폭발 타격! (암전 해제, 블라인딩 섬광, 16방향 테이퍼드 빔 광선, 2중 충격파 & 넉백)
 * 7. 특수방어 1랭크 하락 디버프 인디케이터
 * 8. 완료 및 복귀
 */
export const psychicMove: BattleMoveAnimation = {
  num: 94,
  key: "psychic",
  nameKo: "사이코키네시스",
  nameEn: "Psychic",
  type: "psychic",
  category: "special",
  camera: { type: "target", zoom: 1.25 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawPsychicBehindEffect(targetCtx, step, prog);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos, isPlayer } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawPsychicMoveEffect(targetCtx, attackerPos, targetPos, step, prog, isPlayer);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.25,
      pRot: 0,
      eRot: 0,
    };

    return [
      // #1. 3방향 사이킥 링: 1차 원 (0°) 발현
      {
        ...baseFrame,
        delay: 90,
        pOffset: isP ? { x: -2, y: 1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 2, y: -1 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.04, y: 0.96 } : undefined,
        eScale: !isP ? { x: 1.04, y: 0.96 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.50,
        phaseId: "psychic-circle-1",
        phaseName: "#1. 3방향 사이킥 링: 1차 원 (0°) 발현",
      },
      // #2. 3방향 사이킥 링: 2차 원 (60°) 발현
      {
        ...baseFrame,
        delay: 90,
        pOffset: isP ? { x: -3, y: 1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 3, y: -1 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.05, y: 0.95 } : undefined,
        eScale: !isP ? { x: 1.05, y: 0.95 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.70,
        phaseId: "psychic-circle-2",
        phaseName: "#2. 3방향 사이킥 링: 2차 원 (60°) 발현",
      },
      // #3. 3방향 사이킥 링: 3차 원 (120°) 완성
      {
        ...baseFrame,
        delay: 95,
        pOffset: isP ? { x: -4, y: 1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 4, y: -1 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.06, y: 0.94 } : undefined,
        eScale: !isP ? { x: 1.06, y: 0.94 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.85,
        phaseId: "psychic-circle-3",
        phaseName: "#3. 3방향 사이킥 링: 3차 원 (120°) 완성",
      },
      // #4. 3방향 사이킥 링 공명 펄스
      {
        ...baseFrame,
        delay: 115,
        pOffset: isP ? { x: -5, y: 1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 5, y: -1 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.07, y: 0.93 } : undefined,
        eScale: !isP ? { x: 1.07, y: 0.93 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.90,
        phaseId: "psychic-mandala-resonance",
        phaseName: "#4. 3방향 사이킥 링 공명 펄스",
      },
      // #5. 대상 사이킥 포획 개시 & 1차 텔레키네틱 진동 (순백 실루엣 활성화)
      {
        ...baseFrame,
        delay: 110,
        pOffset: !isP && isHit ? { x: -4, y: -8 } : { x: 0, y: 0 },
        eOffset: isP && isHit ? { x: -4, y: -8 } : { x: 0, y: 0 },
        pScale: !isP && isHit ? { x: 1.06, y: 1.06 } : undefined,
        eScale: isP && isHit ? { x: 1.06, y: 1.06 } : undefined,
        targetWhiteAura: isHit,
        targetWhiteOpacity: 0.50,
        targetWhiteBorderAlpha: 0.88,
        showEffect: true,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 0.45,
        phaseId: "psychic-capture",
        phaseName: "#5. 대상 사이킥 포획 & 1차 진동",
      },
      // #6. 극대 사이코키네틱 구속 & 역동적 공중 진동 (최대 진폭 & 고도)
      {
        ...baseFrame,
        delay: 120,
        pOffset: !isP && isHit ? { x: 6, y: -14 } : { x: 0, y: 0 },
        eOffset: isP && isHit ? { x: 6, y: -14 } : { x: 0, y: 0 },
        pScale: !isP && isHit ? { x: 1.10, y: 1.10 } : undefined,
        eScale: isP && isHit ? { x: 1.10, y: 1.10 } : undefined,
        targetWhiteAura: isHit,
        targetWhiteOpacity: 0.58,
        targetWhiteBorderAlpha: 0.92,
        showEffect: true,
        hitFlash: false,
        moveStep: 6,
        effectProgress: 0.70,
        phaseId: "psychic-violent-vibrate",
        phaseName: "#6. 극대 구속 & 역동적 공중 진동",
      },
      // #7. 특이점 초고밀도 압축 진동 (폭발 직전 긴장)
      {
        ...baseFrame,
        delay: 110,
        pOffset: !isP && isHit ? { x: -6, y: -10 } : { x: 0, y: 0 },
        eOffset: isP && isHit ? { x: -6, y: -10 } : { x: 0, y: 0 },
        pScale: !isP && isHit ? { x: 1.08, y: 1.08 } : undefined,
        eScale: isP && isHit ? { x: 1.08, y: 1.08 } : undefined,
        targetWhiteAura: isHit,
        targetWhiteOpacity: 0.54,
        targetWhiteBorderAlpha: 0.90,
        showEffect: true,
        hitFlash: false,
        moveStep: 7,
        effectProgress: 0.90,
        phaseId: "psychic-singularity",
        phaseName: "#7. 특이점 초고밀도 압축 진동",
      },
      // #8. 사이킥 초신성 대폭발 타격! (암전 해제, 초신성 타격)
      {
        ...baseFrame,
        delay: 135,
        pOffset: !isP && isHit ? { x: -10, y: 4 } : { x: 0, y: 0 },
        eOffset: isP && isHit ? { x: 10, y: -4 } : { x: 0, y: 0 },
        pScale: !isP && isHit ? { x: 1.18, y: 0.85 } : undefined,
        eScale: isP && isHit ? { x: 1.18, y: 0.85 } : undefined,
        pWhiteTint: isHit && !isP,
        eWhiteTint: isHit && isP,
        whiteTintRadius: 2.0,
        targetWhiteAura: false,
        showEffect: true,
        hitFlash: isHit,
        moveStep: 8,
        effectProgress: 0.60,
        phaseId: "psychic-hit",
        phaseName: "#8. 사이킥 타격 (피격 플래시 & 넉백)",
      },
      // #9. 완료 및 복귀 (배경 암전 페이드아웃 완료)
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        targetWhiteAura: false,
        showEffect: true,
        hitFlash: false,
        moveStep: 9,
        phaseId: "psychic-complete",
        phaseName: "#9. 완료 및 복귀 (암전 페이드아웃)",
      },
    ];
  },
};
