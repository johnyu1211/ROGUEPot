// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawHardenEffect } from "../../../renderers/moves/gen1/move105_108.js";

/**
 * 106: 단단해지기 (Harden) - 노말 타입 변화기 (자신의 방어 1랭크 상승)
 *
 * 연출 구성:
 * 1. 전신 압축 웅크림 및 밝은 회색(실버 메탈) 필터 전환
 * 2. 1차 흰색 금속 반사 사선 스트라이프 스위프 & 상체 별빛 글린트
 * 3. 2차 흰색 금속 반사 사선 스트라이프 스위프 & 측면 별빛 글린트
 * 4. 3차 흰색 금속 반사 사선 스트라이프 피니시 & 정수리 대형 "칭!(Tink!)" 글린트
 * 5. 단단해진 몸체 안정화 및 탄성 복귀
 */
export const hardenMove: BattleMoveAnimation = {
  num: 106,
  key: "harden",
  nameKo: "단단해지기",
  nameEn: "Harden",
  type: "normal",
  category: "status",
  camera: { type: "self", zoom: 1.25 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawHardenEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.25,
      pRot: 0,
      eRot: 0,
    };

    // 시전자 전용 오프셋 헬퍼 (수비자는 절대 {0,0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    return [
      // 1. 전신 압축 웅크림 & 밝은 회색 메탈 필터 전환
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 4),
        pScale: isP ? { x: 1.10, y: 0.90 } : undefined,
        eScale: !isP ? { x: 1.10, y: 0.90 } : undefined,
        pGreyTint: isP,
        eGreyTint: !isP,
        showEffect: false,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.50,
        phaseId: "harden-compress",
        phaseName: "1. 전신 압축 & 메탈화 개시",
      },

      // --- [1회차 스트라이프: 좌상단 -> 우하단 대각선 하향 스위프 (7프레임 연속 글라이드)] ---
      {
        ...baseFrame,
        delay: 35,
        ...cOff(0, 1),
        pGreyTint: isP,
        eGreyTint: !isP,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.05,
        phaseId: "harden-pass1-1",
        phaseName: "2. 1차 스트라이프 좌상단 진입",
      },
      {
        ...baseFrame,
        delay: 35,
        ...cOff(0, 0),
        pGreyTint: isP,
        eGreyTint: !isP,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.20,
        phaseId: "harden-pass1-2",
        phaseName: "3. 1차 스트라이프 상체",
      },
      {
        ...baseFrame,
        delay: 35,
        ...cOff(0, 0),
        pGreyTint: isP,
        eGreyTint: !isP,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.35,
        phaseId: "harden-pass1-3",
        phaseName: "4. 1차 스트라이프 중앙 상",
      },
      {
        ...baseFrame,
        delay: 35,
        ...cOff(0, 0),
        pGreyTint: isP,
        eGreyTint: !isP,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.50,
        phaseId: "harden-pass1-4",
        phaseName: "5. 1차 스트라이프 중앙 관통",
      },
      {
        ...baseFrame,
        delay: 35,
        ...cOff(0, 0),
        pGreyTint: isP,
        eGreyTint: !isP,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.65,
        phaseId: "harden-pass1-5",
        phaseName: "6. 1차 스트라이프 하체 횡단",
      },
      {
        ...baseFrame,
        delay: 35,
        ...cOff(0, 0),
        pGreyTint: isP,
        eGreyTint: !isP,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.80,
        phaseId: "harden-pass1-6",
        phaseName: "7. 1차 스트라이프 우하단 횡단",
      },
      {
        ...baseFrame,
        delay: 35,
        ...cOff(0, 0),
        pGreyTint: isP,
        eGreyTint: !isP,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.95,
        phaseId: "harden-pass1-7",
        phaseName: "8. 1차 스트라이프 통과 완료",
      },

      // --- [2회차 스트라이프: 좌상단 -> 우하단 대각선 하향 스위프 (7프레임 연속 글라이드)] ---
      {
        ...baseFrame,
        delay: 35,
        ...cOff(0, 0),
        pGreyTint: isP,
        eGreyTint: !isP,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.05,
        phaseId: "harden-pass2-1",
        phaseName: "9. 2차 스트라이프 좌상단 진입",
      },
      {
        ...baseFrame,
        delay: 35,
        ...cOff(0, 0),
        pGreyTint: isP,
        eGreyTint: !isP,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.20,
        phaseId: "harden-pass2-2",
        phaseName: "10. 2차 스트라이프 상체",
      },
      {
        ...baseFrame,
        delay: 35,
        ...cOff(0, 0),
        pGreyTint: isP,
        eGreyTint: !isP,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.35,
        phaseId: "harden-pass2-3",
        phaseName: "11. 2차 스트라이프 중앙 상",
      },
      {
        ...baseFrame,
        delay: 35,
        ...cOff(0, 0),
        pGreyTint: isP,
        eGreyTint: !isP,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.50,
        phaseId: "harden-pass2-4",
        phaseName: "12. 2차 스트라이프 중앙 관통",
      },
      {
        ...baseFrame,
        delay: 35,
        ...cOff(0, 0),
        pGreyTint: isP,
        eGreyTint: !isP,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.65,
        phaseId: "harden-pass2-5",
        phaseName: "13. 2차 스트라이프 하체 횡단",
      },
      {
        ...baseFrame,
        delay: 35,
        ...cOff(0, 0),
        pGreyTint: isP,
        eGreyTint: !isP,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.80,
        phaseId: "harden-pass2-6",
        phaseName: "14. 2차 스트라이프 우하단 횡단",
      },
      {
        ...baseFrame,
        delay: 35,
        ...cOff(0, 0),
        pGreyTint: isP,
        eGreyTint: !isP,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.95,
        phaseId: "harden-pass2-7",
        phaseName: "15. 2차 스트라이프 통과 완료",
      },

      // --- [3회차 스트라이프: 좌상단 -> 우하단 대각선 하향 스위프 (7프레임 연속 글라이드)] ---
      {
        ...baseFrame,
        delay: 35,
        ...cOff(0, 0),
        pGreyTint: isP,
        eGreyTint: !isP,
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.05,
        phaseId: "harden-pass3-1",
        phaseName: "16. 3차 스트라이프 좌상단 진입",
      },
      {
        ...baseFrame,
        delay: 35,
        ...cOff(0, 0),
        pGreyTint: isP,
        eGreyTint: !isP,
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.20,
        phaseId: "harden-pass3-2",
        phaseName: "17. 3차 스트라이프 상체",
      },
      {
        ...baseFrame,
        delay: 35,
        ...cOff(0, 0),
        pGreyTint: isP,
        eGreyTint: !isP,
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.35,
        phaseId: "harden-pass3-3",
        phaseName: "18. 3차 스트라이프 중앙 상",
      },
      {
        ...baseFrame,
        delay: 35,
        ...cOff(0, 0),
        pGreyTint: isP,
        eGreyTint: !isP,
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.50,
        phaseId: "harden-pass3-4",
        phaseName: "19. 3차 스트라이프 중앙 관통",
      },
      {
        ...baseFrame,
        delay: 35,
        ...cOff(0, 0),
        pGreyTint: isP,
        eGreyTint: !isP,
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.65,
        phaseId: "harden-pass3-5",
        phaseName: "20. 3차 스트라이프 하체 횡단",
      },
      {
        ...baseFrame,
        delay: 35,
        ...cOff(0, 0),
        pGreyTint: isP,
        eGreyTint: !isP,
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.80,
        phaseId: "harden-pass3-6",
        phaseName: "21. 3차 스트라이프 우하단 횡단",
      },
      {
        ...baseFrame,
        delay: 35,
        ...cOff(0, 0),
        pGreyTint: isP,
        eGreyTint: !isP,
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.95,
        phaseId: "harden-pass3-7",
        phaseName: "22. 3차 스트라이프 통과 완료",
      },

      // 23. 단단해진 몸체 안정화 및 복귀
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        showEffect: false,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 1.0,
        phaseId: "harden-settle",
        phaseName: "23. 단단해진 몸체 안정화 & 복귀",
      },
    ];
  },
};

/**
 * 334: 철벽 (Iron Defense) - 강철 타입 변화기 (자신의 방어 2랭크 상승)
 * - 단단해지기와 동일한 메탈릭 경화 연출 공유
 */
export const ironDefenseMove: BattleMoveAnimation = {
  num: 334,
  key: "iron-defense",
  nameKo: "철벽",
  nameEn: "Iron Defense",
  type: "steel",
  category: "status",
  camera: { type: "self", zoom: 1.25 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawHardenEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    return hardenMove.buildFrames(ctx);
  },
};

