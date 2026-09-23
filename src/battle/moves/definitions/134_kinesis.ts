// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawKinesisEffect } from "../../../renderers/moves/gen1/move133_136.js";

/**
 * 134: 숟가락휘기 (Kinesis) - 에스퍼 타입 변화기 (상대 명중률 1랭크 하락 디버프)
 *
 * 연출 구성:
 * 1. 시전자 염력 집중 & 전방에 은빛 메탈릭 숟가락 소환 페이드인
 * 2. 사이킥 오라 감싸이며 숟가락 염동력 고주파 진동
 * 3. 숟가락 목 부분이 서서히 꺾이다가 '칭!(Tink!)' 소리와 함께 80도 급절곡 및 메탈 십자 섬광
 * 4. 숟가락 끝에서 3중 다채색 최면 왜곡 파동 링이 상대방을 향해 쇄도 사출
 * 5. 상대방 눈앞에 직격 착탄하며 시야 왜곡 및 어질어질 흔들림 (명중률 하락)
 * 6. 숟가락 에스퍼 입자 승화 소멸 및 안정 복귀
 */
export const kinesisMove: BattleMoveAnimation = {
  num: 134,
  key: "kinesis",
  nameKo: "숟가락휘기",
  nameEn: "Kinesis",
  type: "psychic",
  category: "status",
  camera: { type: "none" },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawKinesisEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.0,
      pRot: 0,
      eRot: 0,
    };

    // 시전자 전용 오프셋 헬퍼 (수비자는 절대 {0,0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 피격자(상대방) 흔들림 헬퍼
    const tOff = (x: number, y: number) => ({
      pOffset: !isP && isHit ? { x, y } : (isP ? { x: 0, y: 0 } : undefined),
      eOffset: isP && isHit ? { x: -x, y: -y } : (!isP ? { x: 0, y: 0 } : undefined),
    });

    return [
      // 1. 숟가락 등장 (100ms) - 크기 변화 없이 1.0 유지
      {
        ...baseFrame,
        delay: 100,
        ...cOff(-2, 1),
        pScale: isP ? { x: 1.03, y: 0.97 } : undefined,
        eScale: !isP ? { x: 1.03, y: 0.97 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.8,
        phaseId: "kinesis-spawn",
        phaseName: "1. 숟가락 등장",
      },

      // 2. 숟가락 꺾임 시작 (90ms) - 28도
      {
        ...baseFrame,
        delay: 90,
        ...cOff(-3, 2),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.35,
        phaseId: "kinesis-bend",
        phaseName: "2. 숟가락 꺾임 시작",
      },

      // 3. 숟가락 꺾임 진행 (90ms) - 56도
      {
        ...baseFrame,
        delay: 90,
        ...cOff(-4, 2),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.70,
        phaseId: "kinesis-bend",
        phaseName: "3. 숟가락 꺾임 진행",
      },

      // 4. 숟가락 완전 절곡 (100ms) - 80도
      {
        ...baseFrame,
        delay: 100,
        ...cOff(-5, 1),
        pScale: isP ? { x: 0.97, y: 1.03 } : undefined,
        eScale: !isP ? { x: 0.97, y: 1.03 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 1.0,
        phaseId: "kinesis-bend",
        phaseName: "4. 숟가락 완전 절곡",
      },

      // 5. 꺾인 후 보라색 파장 확산 1차 & 피격자 반응 (115ms)
      {
        ...baseFrame,
        delay: 115,
        ...tOff(5, -2),
        showEffect: true,
        hitFlash: isHit,
        moveStep: 3,
        effectProgress: 0.45,
        phaseId: "kinesis-wave-1",
        phaseName: "5. 보라색 파장 확산 1차",
      },

      // 6. 보라색 파장 전장 가득 확산 2차 (115ms)
      {
        ...baseFrame,
        delay: 115,
        ...tOff(-2, 1),
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.85,
        phaseId: "kinesis-wave-2",
        phaseName: "6. 보라색 파장 확산 2차",
      },

      // 7. 상대방 안정화 & 숟가락 페이드아웃 & 암전 해제 (110ms)
      {
        ...baseFrame,
        delay: 110,
        ...tOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.7,
        phaseId: "kinesis-fade",
        phaseName: "7. 숟가락 승화 & 암전 해제",
      },

      // 8. 정위치 복귀 (90ms)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        showEffect: false,
        hitFlash: false,
        moveStep: 9,
        phaseId: "recovery",
        phaseName: "8. 정위치 복귀",
      },
    ];
  },
};
