// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawHealBellBehindEffect,
  drawHealBellEffect,
} from "../../../renderers/moves/gen1/move213_216.js";

/**
 * 215: 치료방울 (Heal Bell / いやしのすず) - 노말 타입 변화 기술
 *
 * 위력: — / 명중: — / PP: 5 / 접촉 판정: X
 * 설명: 기분 좋은 방울소리를 들려주어 같은 편 전원의 상태 이상을 회복한다.
 *
 * [연출 기승전결 시퀀스]:
 * 1. 기(起): 시전자 중심에서 1차 가로 3D 노란 링(Horizontal 3D Yellow Ring)이 퍼져나가며 십자 섬광 생성
 * 2. 승(承): 2차 가로 3D 노란 링이 넓게 퍼져나가며 그 사이로 춤추는 스타일리시 파스텔 음표(♪, ♫)들이 피어오름
 * 3. 전(轉): 파스텔 음표들이 하늘로 흩날리며 시전자 전신으로 치유의 별빛 가루 샤워(Healing Sparkle Shower) 강림 및 상태이상 완치
 * 4. 결(結): 몸이 가뿐해진 시전자가 기쁨에 찬 도약 바운스(Joyful Bounce) 후 단정하게 제자리 복귀
 */
export const healBellMove: BattleMoveAnimation = {
  num: 215,
  key: "heal-bell",
  nameKo: "치료방울",
  nameEn: "Heal Bell",
  type: "normal",
  category: "status",
  camera: { type: "self", zoom: 1.25 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawHealBellBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawHealBellEffect(targetCtx, frame, drawCtx);
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
      showEffect: true,
      showBehindEffect: true,
      hitFlash: false,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
      playerStatus: undefined as string | null | undefined,
      enemyStatus: undefined as string | null | undefined,
    };

    // 시전자 트랜스폼 헬퍼
    const cTransform = (ox: number, oy: number, rot: number = 0, sx: number = 1.0, sy: number = 1.0) => ({
      pOffset: isP ? { x: ox, y: oy } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -ox, y: oy } : { x: 0, y: 0 },
      pRot: isP ? rot : 0,
      eRot: !isP ? -rot : 0,
      pScale: isP ? { x: sx, y: sy } : undefined,
      eScale: !isP ? { x: sx, y: sy } : undefined,
    });

    return [
      // -------------------------------------------------------------
      // Phase 1: 기(起) - 1차 가로 3D 노란 링 확산 및 영롱한 십자 섬광
      // -------------------------------------------------------------
      {
        ...baseFrame,
        delay: 70,
        ...cTransform(0, 1, 0, 1.04, 0.96),
        moveStep: 1,
        ring1Progress: 0.15,
        ring1Alpha: 0.90,
        healBellWaveProgress: 0.15,
        healBellWaveAlpha: 0.90,
        healBellGlintAlpha: 0.85,
        healBellGlintSize: 9,
        healBellBgAlpha: 0.30,
        phaseId: "healbell-ring1-1",
        phaseName: "1. 1차 가로 3D 링 태동 & 섬광",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cTransform(0, 2, 0, 1.06, 0.94),
        moveStep: 1,
        ring1Progress: 0.42,
        ring1Alpha: 0.95,
        healBellWaveProgress: 0.42,
        healBellWaveAlpha: 0.95,
        healBellGlintAlpha: 1.0,
        healBellGlintSize: 15,
        healBellBgAlpha: 0.50,
        phaseId: "healbell-ring1-2",
        phaseName: "2. 1차 3D 링 확산 & 섬광 극대화",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cTransform(0, 1, 0, 1.02, 0.98),
        moveStep: 1,
        ring1Progress: 0.70,
        ring1Alpha: 0.85,
        healBellWaveProgress: 0.70,
        healBellWaveAlpha: 0.85,
        healBellGlintAlpha: 0.40,
        healBellGlintSize: 8,
        healBellNotesAlpha: 0.35,
        healBellNotesProgress: 0.12,
        healBellBgAlpha: 0.65,
        phaseId: "healbell-ring1-3",
        phaseName: "3. 1차 링 원거리 전개 & 음표 태동",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cTransform(0, 0, 0, 1.0, 1.0),
        moveStep: 1,
        ring1Progress: 0.92,
        ring1Alpha: 0.55,
        healBellWaveProgress: 0.92,
        healBellWaveAlpha: 0.55,
        healBellNotesAlpha: 0.65,
        healBellNotesProgress: 0.25,
        healBellBgAlpha: 0.75,
        phaseId: "healbell-ring1-4",
        phaseName: "4. 1차 링 잔향 & 음표 상승",
      },

      // -------------------------------------------------------------
      // Phase 2: 승(承) - 2차 가로 3D 노란 링 확산 & 파스텔 음표 춤
      // -------------------------------------------------------------
      {
        ...baseFrame,
        delay: 70,
        ...cTransform(-1, 0, -0.02, 0.99, 1.01),
        moveStep: 2,
        ring1Progress: 1.0,
        ring1Alpha: 0.18,
        ring2Progress: 0.18,
        ring2Alpha: 0.95,
        healBellNotesAlpha: 0.85,
        healBellNotesProgress: 0.38,
        healBellBgAlpha: 0.85,
        phaseId: "healbell-ring2-1",
        phaseName: "5. 2차 가로 3D 링 생성 & 음표 고조",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cTransform(1, 0, 0.02, 0.99, 1.01),
        moveStep: 2,
        ring2Progress: 0.45,
        ring2Alpha: 0.95,
        healBellNotesAlpha: 1.0,
        healBellNotesProgress: 0.52,
        healBellBgAlpha: 0.85,
        phaseId: "healbell-ring2-2",
        phaseName: "6. 2차 링 파동 확산 & 음표 만발",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cTransform(-1, 0, -0.01, 1.0, 1.0),
        moveStep: 2,
        ring2Progress: 0.72,
        ring2Alpha: 0.85,
        healBellNotesAlpha: 1.0,
        healBellNotesProgress: 0.68,
        healBellBgAlpha: 0.80,
        phaseId: "healbell-ring2-3",
        phaseName: "7. 2차 링 와이드 전개 & 율동",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cTransform(1, 0, 0.01, 1.0, 1.0),
        moveStep: 2,
        ring2Progress: 0.92,
        ring2Alpha: 0.55,
        healBellNotesAlpha: 1.0,
        healBellNotesProgress: 0.82,
        healBellBgAlpha: 0.75,
        phaseId: "healbell-ring2-4",
        phaseName: "8. 2차 링 최대 공명 & 음표 개화",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cTransform(0, 0, 0, 1.0, 1.0),
        moveStep: 2,
        ring2Progress: 1.0,
        ring2Alpha: 0.18,
        healBellNotesAlpha: 1.0,
        healBellNotesProgress: 0.92,
        healBellBgAlpha: 0.70,
        phaseId: "healbell-ring2-5",
        phaseName: "9. 2차 링 소산 & 음표 정점",
      },

      // -------------------------------------------------------------
      // Phase 3: 전(轉) - 치유 별빛 샤워 강림 & 상태이상 해제
      // -------------------------------------------------------------
      {
        ...baseFrame,
        delay: 75,
        ...cTransform(0, 1, 0, 1.04, 0.96),
        moveStep: 3,
        healBellNotesAlpha: 0.80,
        healBellNotesProgress: 1.0,
        healBellShowerAlpha: 0.75,
        healBellShowerProgress: 0.20,
        healBellBgAlpha: 0.85,
        phaseId: "healbell-shower-1",
        phaseName: "10. 치유 별빛 샤워 낙하 시작",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cTransform(0, 0, 0, 1.0, 1.0),
        moveStep: 3,
        healBellShowerAlpha: 1.0,
        healBellShowerProgress: 0.48,
        healBellBgAlpha: 0.95,
        // 시전자 전신 순백/황금 치유 광채 턴온
        pWhiteAlpha: isP ? 0.35 : undefined,
        eWhiteAlpha: !isP ? 0.35 : undefined,
        // 상태이상 해제 (HUD 상태이상 아이콘 제거)
        playerStatus: isP ? null : baseFrame.playerStatus,
        enemyStatus: !isP ? null : baseFrame.enemyStatus,
        phaseId: "healbell-shower-2",
        phaseName: "11. 치유 별빛 샤워 극대화 & 상태이상 완치!",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cTransform(0, 0, 0, 1.0, 1.0),
        moveStep: 3,
        healBellShowerAlpha: 0.95,
        healBellShowerProgress: 0.72,
        healBellBgAlpha: 0.80,
        pWhiteAlpha: isP ? 0.25 : undefined,
        eWhiteAlpha: !isP ? 0.25 : undefined,
        playerStatus: isP ? null : baseFrame.playerStatus,
        enemyStatus: !isP ? null : baseFrame.enemyStatus,
        phaseId: "healbell-shower-3",
        phaseName: "12. 치유의 전신 광채 & 별빛 샤워",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cTransform(0, 0, 0, 1.0, 1.0),
        moveStep: 3,
        healBellShowerAlpha: 0.70,
        healBellShowerProgress: 0.92,
        healBellBgAlpha: 0.60,
        pWhiteAlpha: isP ? 0.12 : undefined,
        eWhiteAlpha: !isP ? 0.12 : undefined,
        playerStatus: isP ? null : baseFrame.playerStatus,
        enemyStatus: !isP ? null : baseFrame.enemyStatus,
        phaseId: "healbell-shower-4",
        phaseName: "13. 별빛 샤워 흡수 & 잔향 소산",
      },

      // -------------------------------------------------------------
      // Phase 4: 결(結) - 개운해진 시전자의 기쁨에 찬 도약 바운스(Joyful Bounce)
      // -------------------------------------------------------------
      {
        ...baseFrame,
        delay: 70,
        ...cTransform(0, 3, 0, 1.12, 0.88), // 도약 준비 웅크림
        moveStep: 4,
        healBellShowerAlpha: 0.30,
        healBellShowerProgress: 1.0,
        healBellBgAlpha: 0.30,
        playerStatus: isP ? null : baseFrame.playerStatus,
        enemyStatus: !isP ? null : baseFrame.enemyStatus,
        phaseId: "healbell-bounce-1",
        phaseName: "14. 기쁨의 도약 준비 웅크림",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cTransform(0, -9, 0, 0.92, 1.12), // 공중 도약 정점!
        moveStep: 4,
        healBellShowerAlpha: 0.0,
        healBellBgAlpha: 0.10,
        healBellGlintAlpha: 0.85,
        healBellGlintSize: 11,
        playerStatus: isP ? null : baseFrame.playerStatus,
        enemyStatus: !isP ? null : baseFrame.enemyStatus,
        phaseId: "healbell-bounce-2",
        phaseName: "15. 기쁨의 바운스 도약 정점!",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cTransform(0, 1, 0, 1.06, 0.94), // 착지 완충
        moveStep: 4,
        healBellGlintAlpha: 0.35,
        healBellGlintSize: 6,
        playerStatus: isP ? null : baseFrame.playerStatus,
        enemyStatus: !isP ? null : baseFrame.enemyStatus,
        phaseId: "healbell-bounce-3",
        phaseName: "16. 착지 및 완충",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cTransform(0, 0, 0, 1.0, 1.0), // 정상 복귀
        moveStep: 4,
        showEffect: false,
        playerStatus: isP ? null : baseFrame.playerStatus,
        enemyStatus: !isP ? null : baseFrame.enemyStatus,
        phaseId: "healbell-finish",
        phaseName: "17. 완전 치유 및 원위치 복귀",
      },
    ];
  },
};
