// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawEggBombEffect } from "../../../renderers/moves/gen1/move121_124.js";

/**
 * 121: 알폭탄 (Egg Bomb) - 노말 타입 원거리 물리 기술 (위력 100, 명중 75%)
 *
 * 연출 구성 (유저 요청 100% 반영: 줌 아웃 와이드 시야 + 포물선 투척 ➔ 폭발):
 * 1. [카메라 - 줌 아웃 (type: "none")]:
 *    - 시전자(아군)와 수비자(상대) 및 전장 상공 전체를 1.0x 중립 와이드로 시원하게 조망
 * 2. [와인드업 & 힘찬 투척 (#1 ~ #2)]:
 *    - 시전자가 힘을 모아 알을 들어올림 ➔ 전방 릴리스 투척
 * 3. [탄도 포물선 비행 (#3 ~ #7)]:
 *    - 시전자 손에서 출발하여 전장 상공 95px 정점을 통과하는 5단계 부드러운 포물선 아크
 *    - 바닥을 따라 달리는 지면 투영 타원 그림자 + 텀블링 회전 + 유선형 속도 잔상
 * 4. [상대 직격 & 껍질 파쇄 & 대폭발 (#8 ~ #11)]:
 *    - 상대 직격 1프레임 순백 섬광 (hitFlash: true)
 *    - 10조각 날카로운 달걀 껍질 파편(Eggshell Shards) 사방 비산 & 황금 노른자 스플래시
 *    - 중심 초고열 플라즈마 코어 + 바닥 2중 충격파 링 + 거대 화구 클러스터 폭발
 *    - 상대방 위력 100급 강타 넉백 피격 리액션 ➔ 흑연 연막 페이드아웃 및 안정적 복귀
 */
export const eggBombMove: BattleMoveAnimation = {
  num: 121,
  key: "egg-bomb",
  nameKo: "알폭탄",
  nameEn: "Egg Bomb",
  type: "normal",
  category: "physical",
  camera: { type: "none" }, // ★ 유저 요청: 줌 아웃 (와이드 전장 전체 조망)
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos, isPlayer: isP } = drawCtx;
    drawEggBombEffect(
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

    // 절대 규칙 준수: 시전자와 피격자 오프셋 완전 격리
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

    const frames: BattleFrame[] = [];

    // ------------------------------------------------------------------------
    // Step 1: 와인드업 힘 축적 & 알 들어올리기
    // ------------------------------------------------------------------------
    frames.push({
      ...baseFrame,
      ...cOff(-5, 3),
      ...cScale(1.05, 0.95),
      showEffect: true,
      moveStep: 1,
      effectProgress: 1.0,
      delay: 85,
    });

    // ------------------------------------------------------------------------
    // Step 2: 힘찬 전방 릴리스 투척
    // ------------------------------------------------------------------------
    frames.push({
      ...baseFrame,
      ...cOff(14, -4),
      ...cScale(0.94, 1.06),
      showEffect: true,
      moveStep: 2,
      effectProgress: 0.02,
      delay: 60,
    });

    // ------------------------------------------------------------------------
    // Step 3: 부드럽고 시원한 5단계 포물선 탄도 비행 (계란이 포물선으로 날아가기)
    // ------------------------------------------------------------------------
    // #3-1. 포물선 상승 초기 (속도선 꼬리 형성)
    frames.push({
      ...baseFrame,
      ...cOff(8, -2),
      showEffect: true,
      moveStep: 3,
      effectProgress: 0.12,
      delay: 60,
    });

    // #3-2. 포물선 상승 궤적 (지면 그림자 축소)
    frames.push({
      ...baseFrame,
      ...cOff(4, -1),
      showEffect: true,
      moveStep: 3,
      effectProgress: 0.32,
      delay: 60,
    });

    // #3-3. 포물선 최고 정점 통과 (상공 95px)
    frames.push({
      ...baseFrame,
      ...cOff(0, 0),
      showEffect: true,
      moveStep: 3,
      effectProgress: 0.55,
      delay: 60,
    });

    // #3-4. 상대를 향해 급강하 하강
    frames.push({
      ...baseFrame,
      ...cOff(0, 0),
      showEffect: true,
      moveStep: 3,
      effectProgress: 0.78,
      delay: 60,
    });

    // #3-5. 상대 코앞 직전 돌입
    frames.push({
      ...baseFrame,
      ...cOff(0, 0),
      showEffect: true,
      moveStep: 3,
      effectProgress: 0.94,
      delay: 55,
    });

    // ------------------------------------------------------------------------
    // Step 4: 적 직격 & 껍질 파쇄 & 대폭발 (폭발)
    // ------------------------------------------------------------------------
    if (isHit) {
      // #4-1: 상대 머리/상체 직격 착탄 순간 1프레임 순백 섬광
      frames.push({
        ...baseFrame,
        ...cOff(0, 0),
        ...dOff(4, -2),
        hitFlash: true,
        hit: true,
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.05,
        delay: 50,
      });

      // #4-2: 껍질 10조각 산산조각 파쇄 + 노른자 스플래시 + 초고열 플라즈마 기폭 + 적 큰 넉백
      frames.push({
        ...baseFrame,
        ...dOff(20, -5),
        ...dScale(1.14, 0.88),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.28,
        delay: 85,
      });

      // #4-3: 거대 화구 클러스터 폭발 + 바닥 2중 타원 충격파 링 확산 + 적 반대편 진동
      frames.push({
        ...baseFrame,
        ...dOff(-12, 3),
        ...dScale(0.94, 1.06),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.56,
        delay: 90,
      });

      // #4-4: 흑연 연막 구름 피어오름 + 비산 파편 낙하 + 적 반동 수습
      frames.push({
        ...baseFrame,
        ...dOff(6, -1),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.82,
        delay: 90,
      });

      // ----------------------------------------------------------------------
      // Step 5: 연막 페이드아웃 & 정위치 복귀
      // ----------------------------------------------------------------------
      frames.push({
        ...baseFrame,
        ...dOff(-2, 0),
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.95,
        delay: 85,
      });

      frames.push({
        ...baseFrame,
        ...dOff(0, 0),
        showEffect: false,
        moveStep: 5,
        effectProgress: 1.0,
        delay: 80,
      });
    } else {
      // 빗나감 (Miss): 포물선 알이 적 뒤편 바닥에 떨어져 펑!
      frames.push({
        ...baseFrame,
        showEffect: true,
        moveStep: 3,
        effectProgress: 1.0,
        delay: 60,
      });
      frames.push({
        ...baseFrame,
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.45,
        delay: 90,
      });
      frames.push({
        ...baseFrame,
        showEffect: true,
        moveStep: 5,
        effectProgress: 1.0,
        delay: 80,
      });
    }

    return frames;
  },
};
