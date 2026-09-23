// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawAmnesiaEffect } from "../../../renderers/moves/gen1/move133_136.js";

/**
 * 133: 망각술 (Amnesia) - 에스퍼 타입 변화기 (특수방어 2랭크 상승)
 *
 * 연출 구성:
 * 1. 머리를 비우며 힘빼기 & 머리 위 몽실몽실 생각 거품 출현
 * 2. 1차 대형 물음표(?) 솟아오름 및 귀여운 좌우 갸우뚱
 * 3. 2차, 3차 보조 물음표 연쇄 출현 (퐁! 퐁!)
 * 4. 물음표 파열 및 찬란한 스파클 승화 (무념무상의 경지 도달)
 * 5. 청록/바이올렛 에스퍼 수호 빛기둥 & 타원 링 3단계 수직 상승 (특수방어 2랭크 대폭 상승)
 * 6. 스탯 상승 확정 및 평온한 안정 복귀
 */
export const amnesiaMove: BattleMoveAnimation = {
  num: 133,
  key: "amnesia",
  nameKo: "망각술",
  nameEn: "Amnesia",
  type: "psychic",
  category: "status",
  camera: { type: "self", zoom: 1.28 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawAmnesiaEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.28,
      pRot: 0,
      eRot: 0,
    };

    // 시전자 전용 오프셋 헬퍼 (수비자는 절대 {0,0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    return [
      // 1. 머리 비우기 가벼운 힘빼기 웅크림 (75ms, 암전 서서히 시작)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 3),
        pScale: isP ? { x: 1.05, y: 0.95 } : undefined,
        eScale: !isP ? { x: 1.05, y: 0.95 } : undefined,
        skyDarkness: 0.35,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.2,
        phaseId: "amnesia-crouch",
        phaseName: "1. 머리 비우기 웅크림 & 암전 개시",
      },

      // 2. 머리 위에 흰색 수증기 구름 + 중앙 파란 물음표(?) 퐁! 솟아오름 (85ms, 암전 심화)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 1),
        skyDarkness: 0.70,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.70,
        phaseId: "amnesia-cloud-spawn",
        phaseName: "2. 수증기 구름 & 파란 물음표 솟아오름",
      },

      // 3. 수증기 구름 정점 안착 & 시전자와 함께 귀엽게 갸우뚱~ (90ms, 암전 유지)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        pRot: isP ? -0.10 : undefined,
        eRot: !isP ? 0.10 : undefined,
        skyDarkness: 0.70,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.50,
        phaseId: "amnesia-cloud-tilt-1",
        phaseName: "3. 수증기 구름 갸우뚱 (좌)",
      },

      // 4. 반대편으로 살짝 갸우뚱~ (90ms, 암전 유지)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        pRot: isP ? 0.08 : undefined,
        eRot: !isP ? -0.08 : undefined,
        skyDarkness: 0.70,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.50,
        phaseId: "amnesia-cloud-tilt-2",
        phaseName: "4. 수증기 구름 갸우뚱 (우)",
      },

      // 5. 해당 수증기 구름 퐁! 하고 기화 터짐 (Pop!) (90ms, 암전 페이드아웃)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        pScale: isP ? { x: 0.97, y: 1.03 } : undefined,
        eScale: !isP ? { x: 0.97, y: 1.03 } : undefined,
        skyDarkness: 0.35,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.50,
        phaseId: "amnesia-cloud-pop",
        phaseName: "5. 수증기 구름 퐁! 기화 터짐",
      },

      // 6. 스탯 상승 파티클 1차 (85ms, 암전 완전 해제)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, -2),
        pScale: isP ? { x: 1.02, y: 1.04 } : undefined,
        eScale: !isP ? { x: 1.02, y: 1.04 } : undefined,
        skyDarkness: 0.0,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.40,
        phaseId: "amnesia-buff-1",
        phaseName: "6. 스탯 상승 파티클 1",
      },

      // 7. 스탯 상승 파티클 2차 (85ms)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        pScale: isP ? { x: 1.02, y: 0.98 } : undefined,
        eScale: !isP ? { x: 1.02, y: 0.98 } : undefined,
        skyDarkness: 0.0,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.85,
        phaseId: "amnesia-buff-2",
        phaseName: "7. 스탯 상승 파티클 2",
      },

      // 8. 정위치 복귀 (90ms)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        skyDarkness: 0.0,
        showEffect: false,
        hitFlash: false,
        moveStep: 9,
        phaseId: "recovery",
        phaseName: "8. 정위치 복귀",
      },
    ];
  },
};
