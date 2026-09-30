import { BattleFrame, BattleMoveAnimation, MoveContext } from "../types.js";
import {
  drawLovelyKissBehindEffect,
  drawLovelyKissEffect,
} from "../../../renderers/moves/gen1/move141_144.js";

/**
 * 142: 악마의키스 (Lovely Kiss)
 * 
 * 타입: 노말 (Normal)
 * 분류: 변화 (Status)
 * 위력: - / 명중: 75 / PP: 10
 * 
 * [연출 타임라인]:
 * Phase 1: 시전자 전방 기울임 & 매혹적인 핫핑크 츄 입술 부드러운 아크 사출 (Frames 1~3, 230ms)
 * Phase 2: 대상 얼굴 정면에 찰싹 "쪽!" 립스틱 마크 밀착 & 피격자 흠칫 리액션 (Frame 4, 90ms)
 * Phase 3: 러블리 핑크 하트들이 퐁퐁 터져 비산하며 대상이 몽롱하게 좌우로 흔들림 (Frames 5~6, 190ms)
 * Phase 4: 머리 위로 Zzz 수면 방울이 피어오르고 대상 고개가 스르륵 잠에 빠져듦 (Frames 7~9, 270ms)
 */
export const lovelyKissMove: BattleMoveAnimation = {
  num: 142,
  key: "lovely-kiss",
  nameKo: "악마의키스",
  nameEn: "Lovely Kiss",
  type: "normal",
  category: "status",
  camera: { type: "target", zoom: 1.28 },
  drawBehindEffect: drawLovelyKissBehindEffect,
  drawEffect: drawLovelyKissEffect,

  buildFrames: (context: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = context;

    // 시전자만 움직이고 수비자는 {0, 0} 고정 헬퍼
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 피격자만 흔들리는 리액션 헬퍼
    const tOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const scl = (casterScale?: { x: number; y: number }, targetScale?: { x: number; y: number }) => ({
      pScale: isP ? casterScale : targetScale,
      eScale: !isP ? casterScale : targetScale,
    });

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
      pScale: { x: 1, y: 1 },
      eScale: { x: 1, y: 1 },
      pRot: 0,
      eRot: 0,
      hidePShadow: false,
      hideEShadow: false,
      showEffect: true,
      pRedTint: false,
      eRedTint: false,
    };

    // 빗맞았을 때 (Miss 처리)
    if (!isHit) {
      return [
        {
          ...baseFrame,
          delay: 75,
          moveStep: 1,
          ...cOff(12, -4),
          lipsProgress: 0.30,
          lipsAlpha: 0.95,
          phaseId: "lovely-kiss-miss-1",
          phaseName: "1. 키스 입술 사출 (75ms)",
        },
        {
          ...baseFrame,
          delay: 80,
          moveStep: 2,
          ...cOff(4, -1),
          ...tOff(0, -18), // 대상 회피 도약
          lipsProgress: 1.25,
          lipsAlpha: 0.8,
          phaseId: "lovely-kiss-miss-2",
          phaseName: "2. 대상 회피 (80ms)",
        },
        {
          ...baseFrame,
          delay: 70,
          moveStep: 3,
          ...cOff(0, 0),
          ...tOff(0, -4),
          lipsProgress: 0,
          lipsAlpha: 0,
          phaseId: "lovely-kiss-miss-3",
          phaseName: "3. 빗나감 (70ms)",
        },
        {
          ...baseFrame,
          delay: 60,
          moveStep: 4,
          ...cOff(0, 0),
          ...tOff(0, 0),
          phaseId: "lovely-kiss-miss-4",
          phaseName: "4. 복귀 (60ms)",
        },
      ];
    }

    // 명중 시 정규 애니메이션 (총 9프레임, 약 780ms)
    return [
      // 1. [Phase 1: 시전자 전방 기울임 & 키스 입술 발사]
      {
        ...baseFrame,
        delay: 75,
        moveStep: 1,
        ...cOff(12, -4),
        ...scl({ x: 1.04, y: 0.96 }, { x: 1.0, y: 1.0 }),
        lipsProgress: 0.15,
        lipsAlpha: 0.95,
        phaseId: "lovely-kiss-shoot",
        phaseName: "1. 전방 기울임 & 입술 사출 (75ms)",
      },

      // 2. [Phase 1: 완만한 아크 궤적으로 비행]
      {
        ...baseFrame,
        delay: 80,
        moveStep: 1,
        ...cOff(6, -2),
        ...scl({ x: 1.02, y: 0.98 }, { x: 1.0, y: 1.0 }),
        lipsProgress: 0.55,
        lipsAlpha: 1.0,
        phaseId: "lovely-kiss-fly",
        phaseName: "2. 키스 입술 비행 (80ms)",
      },

      // 3. [Phase 1: 대상 면전 접근]
      {
        ...baseFrame,
        delay: 75,
        moveStep: 1,
        ...cOff(0, 0),
        ...scl({ x: 1.0, y: 1.0 }, { x: 1.0, y: 1.0 }),
        lipsProgress: 0.90,
        lipsAlpha: 1.0,
        phaseId: "lovely-kiss-approach",
        phaseName: "3. 대상 접근 (75ms)",
      },

      // 4. [Phase 2: 얼굴에 "쪽!" 립스틱 마크 밀착 & 흠칫 리액션]
      {
        ...baseFrame,
        delay: 90,
        moveStep: 2,
        ...cOff(0, 0),
        ...tOff(0, 4),
        ...scl({ x: 1.0, y: 1.0 }, { x: 1.06, y: 0.94 }),
        lipsProgress: 1.0,
        lipsAlpha: 0,
        kissMarkAlpha: 1.0,
        kissMarkScale: 1.30,
        heartsProgress: 0.15,
        heartsAlpha: 0.9,
        phaseId: "lovely-kiss-smack",
        phaseName: "4. 얼굴 정면 쪽! 립스틱 밀착 (90ms)",
      },

      // 5. [Phase 3: 핑크 하트 퐁퐁 팝 & 대상 몽롱한 흔들림]
      {
        ...baseFrame,
        delay: 95,
        moveStep: 3,
        ...cOff(0, 0),
        ...tOff(-4, 1),
        ...scl({ x: 1.0, y: 1.0 }, { x: 0.97, y: 1.03 }),
        kissMarkAlpha: 0.85,
        kissMarkScale: 1.25,
        heartsProgress: 0.55,
        heartsAlpha: 1.0,
        phaseId: "lovely-kiss-hearts-1",
        phaseName: "5. 하트 팝 & 몽롱한 흔들림 (95ms)",
      },

      // 6. [Phase 3: 반대편 흔들림 & 첫 Zzz 수면 방울 출현]
      {
        ...baseFrame,
        delay: 95,
        moveStep: 3,
        ...cOff(0, 0),
        ...tOff(3, 0),
        ...scl({ x: 1.0, y: 1.0 }, { x: 1.02, y: 0.98 }),
        kissMarkAlpha: 0.50,
        kissMarkScale: 1.20,
        heartsProgress: 0.95,
        heartsAlpha: 0.55,
        sleepProgress: 0.30,
        sleepAlpha: 0.85,
        phaseId: "lovely-kiss-hearts-2",
        phaseName: "6. 첫 Zzz 수면 방울 발생 (95ms)",
      },

      // 7. [Phase 4: Zzz 방울 상승 & 대상 고개 스르륵 잠듦]
      {
        ...baseFrame,
        delay: 100,
        moveStep: 4,
        ...cOff(0, 0),
        ...tOff(0, 4),
        ...scl({ x: 1.0, y: 1.0 }, { x: 1.03, y: 0.95 }),
        kissMarkAlpha: 0.20,
        sleepProgress: 0.65,
        sleepAlpha: 1.0,
        phaseId: "lovely-kiss-sleep-1",
        phaseName: "7. Zzz 방울 상승 & 잠듦 진입 (100ms)",
      },

      // 8. [Phase 4: 완전 수면 상태 안착]
      {
        ...baseFrame,
        delay: 90,
        moveStep: 4,
        ...cOff(0, 0),
        ...tOff(0, 3),
        ...scl({ x: 1.0, y: 1.0 }, { x: 1.01, y: 0.98 }),
        kissMarkAlpha: 0,
        sleepProgress: 0.95,
        sleepAlpha: 0.65,
        phaseId: "lovely-kiss-sleep-2",
        phaseName: "8. 수면 안착 (90ms)",
      },

      // 9. [Phase 4: 중립 복귀]
      {
        ...baseFrame,
        delay: 80,
        moveStep: 4,
        ...cOff(0, 0),
        ...tOff(0, 0),
        ...scl({ x: 1.0, y: 1.0 }, { x: 1.0, y: 1.0 }),
        sleepAlpha: 0,
        phaseId: "lovely-kiss-return",
        phaseName: "9. 중립 복귀 (80ms)",
      },
    ];
  },
};
