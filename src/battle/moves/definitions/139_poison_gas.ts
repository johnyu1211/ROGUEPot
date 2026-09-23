// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawPoisonGasEffect } from "../../../renderers/moves/gen1/move137_140.js";

/**
 * 139: 독가스 (Poison Gas) - 독 타입 변화기 (90% 독 상태이상)
 *
 * 연출 시퀀스:
 * 1. 시전자 입가에서 짙은 보라색 독가스 구름 분출
 * 2. 전장 지면을 타고 상대를 향해 쇄도하는 독무 스트림
 * 3. 상대 전신을 완벽 차폐하는 유기적 3단계 보라색 뭉게구름 & 독 기포 비산
 * 4. 대상 포켓몬 고통스러운 중독 기침 전율(Tremble 진동)
 * 5. 독가스 상공으로 페이드아웃 승화 & 정위치 복귀
 */
export const poisonGasMove: BattleMoveAnimation = {
  num: 139,
  key: "poison-gas",
  nameKo: "독가스",
  nameEn: "Poison Gas",
  type: "poison",
  category: "status",
  camera: { type: "target", zoom: 1.25 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (frame.showEffect) {
      drawPoisonGasEffect(targetCtx, frame, drawCtx);
    }
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    // 시전자 오프셋
    const cOff = (x: number, y: number) =>
      isP ? { pOffset: { x, y } } : { eOffset: { x: -x, y: -y } };

    // 대상 중독 전율 진동
    const tTremble = (shake: number) =>
      isP
        ? (isHit ? { eOffset: { x: shake, y: 0 } } : { eOffset: { x: 0, y: 0 } })
        : (isHit ? { pOffset: { x: shake, y: 0 } } : { pOffset: { x: 0, y: 0 } });

    return [
      // 1. 시전자 입가 독가스 분출
      {
        ...baseFrame,
        delay: 100,
        ...cOff(8, -3),
        ...tTremble(0),
        showEffect: true,
        moveStep: 1,
        phaseId: "poison-gas-mouth",
        phaseName: "1. 시전자 입가 독가스 분출",
      },
      // 2. 전장 지면 쇄도 독무 스트림
      {
        ...baseFrame,
        delay: 110,
        ...cOff(4, -1),
        ...tTremble(0),
        showEffect: true,
        moveStep: 2,
        phaseId: "poison-gas-stream",
        phaseName: "2. 독무 구름 쇄도 비행",
      },
      // 3. 상대 전신 차폐 & 독 기포 비산
      {
        ...baseFrame,
        delay: 130,
        ...cOff(0, 0),
        ...tTremble(isHit ? 3 : 0),
        showEffect: true,
        moveStep: 3,
        phaseId: "poison-gas-cover",
        phaseName: "3. 상대 전신 차폐 & 독 기포 비산",
      },
      // 4. 대상 중독 전율 진동 & 독무 최대 팽창
      {
        ...baseFrame,
        delay: 130,
        ...cOff(0, 0),
        ...tTremble(isHit ? -3 : 0),
        showEffect: true,
        moveStep: 4,
        phaseId: "poison-gas-tremble",
        phaseName: "4. 대상 중독 전율 & 독무 팽창",
      },
      // 5. 독가스 상공 페이드아웃 승화
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        ...tTremble(0),
        showEffect: true,
        moveStep: 5,
        phaseId: "poison-gas-fade",
        phaseName: "5. 독가스 상공 분산 페이드아웃",
      },
      // 6. 정위치 복귀
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...tTremble(0),
        showEffect: false,
        moveStep: 6,
        phaseId: "poison-gas-finish",
        phaseName: "6. 정위치 복귀 완료",
      },
    ];
  },
};
