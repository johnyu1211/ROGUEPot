// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawLickEffect } from "../../../renderers/moves/gen1/move121_124.js";

/**
 * 122: 핥기 (Lick) - 고스트 타입 물리 기술 (위력 30, 명중 100%, 30% 마비)
 *
 * 연출 구성 (유저 요청 100% 반영):
 * 1. [시전 포켓몬 접근 (#1 ~ #2)]:
 *    - 카메라 1.0x 중립 전장에서 시전자가 타겟을 향해 전방 84px 성큼 다가섬
 * 2. [대상 포켓몬 초근접 줌인 (#3)]:
 *    - 카메라 1.70x 초근접 줌인 (대상 포켓몬이 화면 가득 클로즈업)
 *    - 시전 포켓몬은 카메라 뷰포트 바깥에 완벽 격리되어 화면에 비치지 않음
 * 3. [카메라 바깥에서 거대한 혓바닥 출현 & 핥기 강타 (#4 ~ #5)]:
 *    - 카메라 밖 모서리에서 거대한 핑크빛 입체 혓바닥 쇄도 출현
 *    - 대상을 아래에서 위로 쓸어올리며 스쿼시 왜곡 강타 & 타액/침방울 사방 비산
 * 4. [혓바닥 회수 & 묻어난 타액 잔향 (#6 ~ #7)]:
 *    - 혓바닥은 빠르게 카메라 밖으로 회수되고, 대상 몸에 번들거리는 침 코팅 잔향
 * 5. [오한/마비 전율 (#8 ~ #9)]:
 *    - 고스트 기운에 소름 돋아 부들부들 떠는 오한 떨림 (30% 마비 효과 연계)
 * 6. [카메라 중립 복귀 & 정위치 복귀 (#10)]:
 *    - 카메라 1.0x 중립 복귀 (afterCameraReturn: true, hideUI: false) 및 시전자 원위치 안착
 */
export const lickMove: BattleMoveAnimation = {
  num: 122,
  key: "lick",
  nameKo: "핥기",
  nameEn: "Lick",
  type: "ghost",
  category: "physical",
  camera: {
    type: "target",
    zoom: 2.30, // ★ 유저 피드백: "좀 더 확대해야할듯 시전포켓몬이 보여버림" -> 2.30x 대폭 확대
    focalRatio: 1.0, // 대상 포켓몬 정중앙 100% 록온 (시전 포켓몬 화면 밖 자연 이탈)
    delayUntilStep: 2, // ★ 1단계(다가감) 후 2단계부터 급속 줌인
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos, isPlayer: isP } = drawCtx;
    drawLickEffect(
      targetCtx,
      attackerPos,
      targetPos,
      frame.moveStep ?? 1,
      frame.effectProgress ?? 0,
      isP
    );
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      pRot: 0,
      eRot: 0,
      cameraZoom: 1.0,
      delay: 80,
    };

    // 절대 규칙 준수: 시전자와 피격자 오프셋/스케일 완전 격리
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });
    const dOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });
    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : { x: 1, y: 1 },
      eScale: !isP ? { x, y } : { x: 1, y: 1 },
    });
    const dScale = (x: number, y: number) => ({
      pScale: !isP ? { x, y } : { x: 1, y: 1 },
      eScale: isP ? { x, y } : { x: 1, y: 1 },
    });

    // 줌인 상태에서 시전자가 화면에 비치지 않도록 100% 보장
    const hideCaster = {
      hidePlayer: isP,
      hideEnemy: !isP,
    };

    const frames: BattleFrame[] = [];

    // ------------------------------------------------------------------------
    // Step 1: 시전포켓몬이 가까이 다가감 (카메라 1.0x 중립 전장 조망)
    // ------------------------------------------------------------------------
    frames.push({
      ...baseFrame,
      ...cOff(42, -10),
      ...cScale(1.06, 0.94),
      moveStep: 1,
      showEffect: false,
      delay: 85,
      phaseId: "lick-approach-1",
      phaseName: "1. 시전자 타겟 접근 (전진)",
    });

    frames.push({
      ...baseFrame,
      ...cOff(84, -20),
      ...cScale(0.96, 1.04),
      moveStep: 1,
      showEffect: false,
      delay: 80,
      phaseId: "lick-approach-2",
      phaseName: "1. 시전자 타겟 접근 (코앞 안착)",
    });

    // ------------------------------------------------------------------------
    // Step 2: 대상포켓몬 초근접 줌인 (2.30x) & 카메라 바깥에서 거대 혓바닥 출현
    //         (이때 시전포켓몬은 줌인된 카메라 범위 밖에 있음)
    // ------------------------------------------------------------------------
    frames.push({
      ...baseFrame,
      ...cOff(0, 0),
      ...hideCaster,
      ...dScale(1.0, 1.0),
      moveStep: 2,
      effectProgress: 0.35,
      showEffect: true,
      delay: 75,
      phaseId: "lick-emerge",
      phaseName: "2. 카메라 초근접 줌인 & 거대 혓바닥 출현",
    });

    // ------------------------------------------------------------------------
    // Step 3: 거대 혓바닥 전면 쓸어올리기 핥기 강타 & 피격 왜곡 스쿼시
    // ------------------------------------------------------------------------
    if (isHit) {
      frames.push({
        ...baseFrame,
        ...cOff(0, 0),
        ...hideCaster,
        ...dOff(6, -4),
        ...dScale(1.18, 0.82), // 강타 압력 스쿼시
        moveStep: 3,
        effectProgress: 0.65,
        showEffect: true,
        hitFlash: true,
        delay: 80,
        phaseId: "lick-impact",
        phaseName: "3. 거대 혓바닥 쓸어올리기 강타 (스쿼시)",
      });

      frames.push({
        ...baseFrame,
        ...cOff(0, 0),
        ...hideCaster,
        ...dOff(4, -8),
        ...dScale(0.88, 1.14), // 탄성 복원 스트레치
        moveStep: 3,
        effectProgress: 0.90,
        showEffect: true,
        hitFlash: false,
        delay: 75,
        phaseId: "lick-sweep",
        phaseName: "3. 혓바닥 휩쓸기 관통 & 침방울 비산",
      });
    } else {
      // 빗나감 (Miss)
      frames.push({
        ...baseFrame,
        ...cOff(0, 0),
        ...hideCaster,
        ...dOff(-8, 4),
        moveStep: 3,
        effectProgress: 0.65,
        showEffect: true,
        hitFlash: false,
        delay: 85,
        phaseId: "lick-miss",
        phaseName: "3. 혓바닥 빗나감 (상대방 회피)",
      });
    }

    // ------------------------------------------------------------------------
    // Step 4: 혓바닥 관통 회수 & 대상 몸에 묻어난 타액 잔향 코팅
    // ------------------------------------------------------------------------
    frames.push({
      ...baseFrame,
      ...cOff(0, 0),
      ...hideCaster,
      ...dOff(0, 0),
      ...dScale(1.05, 0.96),
      moveStep: 4,
      effectProgress: 0.35,
      showEffect: true,
      delay: 80,
      phaseId: "lick-retract",
      phaseName: "4. 혓바닥 회수 & 타액 잔향 코팅",
    });

    frames.push({
      ...baseFrame,
      ...cOff(0, 0),
      ...hideCaster,
      ...dOff(0, 0),
      ...dScale(1.0, 1.0),
      moveStep: 4,
      effectProgress: 0.85,
      showEffect: true,
      delay: 80,
      phaseId: "lick-slime-drip",
      phaseName: "4. 타액 흘러내림 & 침방울 잔향",
    });

    // ------------------------------------------------------------------------
    // Step 5: 피격자 마비 오한 전율 (고스트 기운에 소름 돋아 부들부들 떪)
    // ------------------------------------------------------------------------
    frames.push({
      ...baseFrame,
      ...cOff(0, 0),
      ...hideCaster,
      ...dOff(-4, 0),
      ...dScale(0.96, 1.04),
      moveStep: 5,
      effectProgress: 0.5,
      showEffect: true,
      delay: 75,
      phaseId: "lick-shiver-1",
      phaseName: "5. 오한/마비 전율 (좌측 떨림)",
    });

    frames.push({
      ...baseFrame,
      ...cOff(0, 0),
      ...hideCaster,
      ...dOff(4, 0),
      ...dScale(1.04, 0.96),
      moveStep: 5,
      effectProgress: 0.8,
      showEffect: true,
      delay: 75,
      phaseId: "lick-shiver-2",
      phaseName: "5. 오한/마비 전율 (우측 떨림)",
    });

    // ------------------------------------------------------------------------
    // Step 6: 카메라 중립 복귀 & 시전자 및 피격자 정위치 복귀 완료
    // ------------------------------------------------------------------------
    frames.push({
      ...baseFrame,
      ...cOff(0, 0),
      ...dOff(0, 0),
      ...cScale(1.0, 1.0),
      ...dScale(1.0, 1.0),
      moveStep: 6,
      afterCameraReturn: true,
      hideUI: false,
      showEffect: false,
      delay: 110,
      phaseId: "lick-finish",
      phaseName: "6. 정위치 복귀 완료",
    });

    return frames;
  },
};
