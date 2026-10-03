// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawPerishSongBehindEffect,
  drawPerishSongEffect,
} from "../../../renderers/moves/gen1/move193_196.js";

/**
 * 195: 멸망의 노래 (Perish Song) - 노말 타입 변화 기술
 *
 * 위력: — / 명중: — / PP: 5 / 접촉 판정: X / 소리 기술 (방음 특성에 무효)
 * 설명: 노래를 들은 모든 활성 포켓몬은 3턴 뒤에 기절한다. 교체되면 카운트가 해제된다.
 *
 * [유저 지정 연출]:
 * 1. 사용 시 내 포켓몬과 대상 포켓몬을 향해 음표들이 화면 밖에서부터 회전하면서 나타남 (Step 1)
 * 2. 포켓몬 근처에 도달하여 3D 타원 궤도로 근처를 매끄럽게 회전 (Step 2)
 * 3. 회전하다가 회전속도가 급격히 느려지면서 붉게 변함 (붉고 검정) (Step 3)
 * 4. 그리고는 음표가 하나씩 깨짐 > 깨지면서 파편이 작아지면서 사라짐 (Step 4)
 */
export const perishSongMove: BattleMoveAnimation = {
  num: 195,
  key: "perish-song",
  nameKo: "멸망의노래",
  nameEn: "Perish Song",
  type: "normal",
  category: "status",
  camera: {
    type: "none",
    zoom: 1.0,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawPerishSongBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawPerishSongEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.0,
      pRot: 0,
      eRot: 0,
      hitFlash: false,
      showEffect: true,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    // 시전자/피격자 오프셋 헬퍼
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const targetReaction = (tx: number, ty: number) => ({
      pOffset: !isP ? { x: tx, y: ty } : { x: 0, y: 0 },
      eOffset: isP ? { x: tx, y: ty } : { x: 0, y: 0 },
    });

    return [
      // ======================================================================
      // 1. Step 1: [화면 밖에서부터 나선형으로 회전하면서 나타나 양 포켓몬 근처로 쇄도] (6 frames)
      // ======================================================================
      {
        ...baseFrame,
        delay: 70,
        ...cOff(-1, -2),
        blackFadeAlpha: 0.18,
        moveStep: 1,
        effectProgress: 0.15,
        phaseId: "perish-spiral-entry-1",
        phaseName: "1. 화면 밖에서 저주의 음표 회전하며 출현",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, -3),
        blackFadeAlpha: 0.28,
        moveStep: 1,
        effectProgress: 0.32,
        phaseId: "perish-spiral-entry-2",
        phaseName: "2. 화면 밖에서 나선형으로 쇄도 진입",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cOff(1, -3),
        blackFadeAlpha: 0.38,
        moveStep: 1,
        effectProgress: 0.50,
        phaseId: "perish-spiral-entry-3",
        phaseName: "3. 양 포켓몬을 향해 급속 나선 회전",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cOff(2, -2),
        blackFadeAlpha: 0.45,
        moveStep: 1,
        effectProgress: 0.68,
        phaseId: "perish-spiral-entry-4",
        phaseName: "4. 양 포켓몬 근처로 수렴 접근",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cOff(1, -1),
        blackFadeAlpha: 0.50,
        moveStep: 1,
        effectProgress: 0.85,
        phaseId: "perish-spiral-entry-5",
        phaseName: "5. 내 포켓몬 및 대상 포켓몬 궤도 진입",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        blackFadeAlpha: 0.50,
        moveStep: 1,
        effectProgress: 1.00,
        phaseId: "perish-orbit-arrival",
        phaseName: "6. 양 포켓몬 주위 3D 궤도 안착",
      },

      // ======================================================================
      // 2. Step 2: [포켓몬 근처에 안착하여 매끄러운 3D 궤도 회전] (8 frames)
      // ======================================================================
      {
        ...baseFrame,
        delay: 65,
        ...cOff(1, -1),
        blackFadeAlpha: 0.50,
        moveStep: 2,
        effectProgress: 0.12,
        phaseId: "perish-orbit-rotate-1",
        phaseName: "7. 양 포켓몬 근처 3D 음표 궤도 회전",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(0, -1),
        ...targetReaction(1, 0),
        blackFadeAlpha: 0.50,
        moveStep: 2,
        effectProgress: 0.25,
        phaseId: "perish-orbit-rotate-2",
        phaseName: "8. 음표 3D 공간 회전 가속",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(-1, 0),
        ...targetReaction(1, 1),
        blackFadeAlpha: 0.50,
        moveStep: 2,
        effectProgress: 0.38,
        phaseId: "perish-orbit-rotate-3",
        phaseName: "9. 상하 Z축 심도 음표 입체 순환",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(0, 0),
        ...targetReaction(0, 1),
        blackFadeAlpha: 0.50,
        moveStep: 2,
        effectProgress: 0.50,
        phaseId: "perish-orbit-rotate-4",
        phaseName: "10. 포켓몬 주위 음표 궤도 회전 지속",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(1, 0),
        ...targetReaction(-1, 0),
        blackFadeAlpha: 0.50,
        moveStep: 2,
        effectProgress: 0.62,
        phaseId: "perish-orbit-rotate-5",
        phaseName: "11. 저주의 선율 공전 가속",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(0, 1),
        ...targetReaction(0, -1),
        blackFadeAlpha: 0.50,
        moveStep: 2,
        effectProgress: 0.75,
        phaseId: "perish-orbit-rotate-6",
        phaseName: "12. 양 포켓몬 주변 3D 공전 궤도 순환",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(-1, 0),
        ...targetReaction(1, 0),
        blackFadeAlpha: 0.50,
        moveStep: 2,
        effectProgress: 0.88,
        phaseId: "perish-orbit-rotate-7",
        phaseName: "13. 절정 진입 직전 고속 회전",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        ...targetReaction(0, 0),
        blackFadeAlpha: 0.50,
        moveStep: 2,
        effectProgress: 1.00,
        phaseId: "perish-orbit-rotate-8",
        phaseName: "14. 전장 전역 선율 공명",
      },

      // ======================================================================
      // 3. Step 3: [회전속도 감속 & 붉은색/검정 색상 변환] (8 frames)
      // ======================================================================
      {
        ...baseFrame,
        delay: 75,
        pRot: isP ? 0.02 : -0.02,
        eRot: isP ? -0.015 : 0.015,
        blackFadeAlpha: 0.50,
        moveStep: 3,
        effectProgress: 0.12,
        phaseId: "perish-slow-1",
        phaseName: "15. 회전 속도 감속 시작 & 붉은 기운 태동",
      },
      {
        ...baseFrame,
        delay: 75,
        pRot: isP ? -0.025 : 0.025,
        eRot: isP ? 0.02 : -0.02,
        blackFadeAlpha: 0.52,
        moveStep: 3,
        effectProgress: 0.25,
        phaseId: "perish-slow-2",
        phaseName: "16. 회전 감속 진행 & 음표 붉은색 변색",
      },
      {
        ...baseFrame,
        delay: 80,
        pRot: isP ? 0.03 : -0.03,
        eRot: isP ? -0.025 : 0.025,
        blackFadeAlpha: 0.55,
        moveStep: 3,
        effectProgress: 0.40,
        phaseId: "perish-slow-3",
        phaseName: "17. 저주의 핏빛 붉은색/검정 심화",
      },
      {
        ...baseFrame,
        delay: 80,
        pRot: isP ? -0.035 : 0.035,
        eRot: isP ? 0.03 : -0.03,
        blackFadeAlpha: 0.56,
        moveStep: 3,
        effectProgress: 0.55,
        phaseId: "perish-slow-4",
        phaseName: "18. 회전 급격히 둔화 & 흑적색 발광",
      },
      {
        ...baseFrame,
        delay: 85,
        pRot: isP ? 0.04 : -0.04,
        eRot: isP ? -0.035 : 0.035,
        blackFadeAlpha: 0.58,
        moveStep: 3,
        effectProgress: 0.70,
        phaseId: "perish-slow-5",
        phaseName: "19. 음표 완전 붉은색/검정 전환",
      },
      {
        ...baseFrame,
        delay: 85,
        pRot: isP ? -0.03 : 0.03,
        eRot: isP ? 0.025 : -0.025,
        blackFadeAlpha: 0.58,
        moveStep: 3,
        effectProgress: 0.82,
        phaseId: "perish-slow-6",
        phaseName: "20. 회전 정지 임박 & 균열 진동",
      },
      {
        ...baseFrame,
        delay: 90,
        pRot: isP ? 0.02 : -0.02,
        eRot: isP ? -0.015 : 0.015,
        blackFadeAlpha: 0.55,
        moveStep: 3,
        effectProgress: 0.92,
        phaseId: "perish-slow-7",
        phaseName: "21. 음표 정지 상태 & 멸망의 긴장감",
      },
      {
        ...baseFrame,
        delay: 95,
        pRot: 0,
        eRot: 0,
        blackFadeAlpha: 0.55,
        moveStep: 3,
        effectProgress: 1.00,
        phaseId: "perish-slow-8",
        phaseName: "22. 완전 정적 & 파괴 직전",
      },

      // ======================================================================
      // 4. Step 4: [음표가 하나씩 깨짐 & 파편이 작아지며 소멸] (10 frames)
      // ======================================================================
      {
        ...baseFrame,
        delay: 75,
        blackFadeAlpha: 0.52,
        moveStep: 4,
        effectProgress: 0.10,
        phaseId: "perish-shatter-1",
        phaseName: "23. [음표 파괴 1] 첫 번째 음표 파열 및 파편 비산",
      },
      {
        ...baseFrame,
        delay: 75,
        blackFadeAlpha: 0.50,
        moveStep: 4,
        effectProgress: 0.20,
        phaseId: "perish-shatter-2",
        phaseName: "24. 첫 번째 파편 축소 및 두 번째 음표 균열",
      },
      {
        ...baseFrame,
        delay: 75,
        blackFadeAlpha: 0.48,
        moveStep: 4,
        effectProgress: 0.30,
        phaseId: "perish-shatter-3",
        phaseName: "25. [음표 파괴 2] 두 번째 음표 파열 및 파편 비산",
      },
      {
        ...baseFrame,
        delay: 75,
        blackFadeAlpha: 0.45,
        moveStep: 4,
        effectProgress: 0.40,
        phaseId: "perish-shatter-4",
        phaseName: "26. 파편 작아지며 소멸 & 세 번째 음표 긴장",
      },
      {
        ...baseFrame,
        delay: 80,
        blackFadeAlpha: 0.42,
        moveStep: 4,
        effectProgress: 0.50,
        phaseId: "perish-shatter-5",
        phaseName: "27. [음표 파괴 3] 세 번째 음표 산산조각 파열",
      },
      {
        ...baseFrame,
        delay: 80,
        blackFadeAlpha: 0.38,
        moveStep: 4,
        effectProgress: 0.60,
        phaseId: "perish-shatter-6",
        phaseName: "28. 세 번째 파편 축소 및 마지막 음표 피크",
      },
      {
        ...baseFrame,
        delay: 80,
        blackFadeAlpha: 0.32,
        moveStep: 4,
        effectProgress: 0.72,
        phaseId: "perish-shatter-7",
        phaseName: "29. [음표 파괴 4] 마지막 음표 완전 파열",
      },
      {
        ...baseFrame,
        delay: 85,
        blackFadeAlpha: 0.22,
        moveStep: 4,
        effectProgress: 0.84,
        phaseId: "perish-shatter-8",
        phaseName: "30. 모든 파편 급속 축소 및 소산",
      },
      {
        ...baseFrame,
        delay: 85,
        blackFadeAlpha: 0.10,
        moveStep: 4,
        effectProgress: 0.94,
        phaseId: "perish-shatter-9",
        phaseName: "31. 파편 소멸 및 전장 암전 해제",
      },
      {
        ...baseFrame,
        delay: 90,
        blackFadeAlpha: 0.00,
        moveStep: 4,
        effectProgress: 1.00,
        phaseId: "perish-settle",
        phaseName: "32. 멸망의 노래 종료 (3턴 카운트다운 각인)",
      },
    ];
  },
};
