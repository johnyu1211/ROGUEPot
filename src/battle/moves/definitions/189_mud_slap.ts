// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawMudSlapBehindEffect,
  drawMudSlapEffect,
} from "../../../renderers/moves/gen1/move189_192.js";

/**
 * 189: 진흙뿌리기 (Mud-Slap) - 땅 타입 특수 기술 (위력 20, 명중 100%, 명중률 1랭크 하락)
 *
 * 연출 구성:
 * 1. [진흙 퍼올리기] 시전자가 몸을 낮추어 바닥에서 축축한 진흙을 긁어모음 (Ground Scoop & Splash)
 * 2. [힘찬 투척 & 비행] 시전자가 일어서며 전방으로 촥- 뿌리고, 여러 덩어리의 진흙이 부채꼴 포물선 호를 그리며 날아감
 * 3. [철퍽 착탄 타격] 상대 얼굴/상체 정면에 철퍽! 직격 파열 & 사방으로 튀는 진흙 스파이크
 * 4. [얼굴에 찰싹 붙은 진흙 & 주르륵 흘러내림] 상대 얼굴에 찰진 진흙 얼룩이 달라붙고, 중력에 의해 3가닥 진흙 방울이 주르륵 흘러내리며 시야 방해
 * 5. [진흙 미끄러짐 & 소산] 묻었던 진흙이 아래로 흘러내려 뚝 떨어지며 서서히 페이드아웃
 * 6. [복귀 완료] 정위치 안정적 복귀 및 카메라 부드러운 줌아웃
 */
export const mudSlapMove: BattleMoveAnimation = {
  num: 189,
  key: "mud-slap",
  nameKo: "진흙뿌리기",
  nameEn: "Mud-Slap",
  type: "ground",
  category: "special",
  camera: { type: "target", zoom: 1.32, delayUntilStep: 2 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawMudSlapBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawMudSlapEffect(targetCtx, frame, drawCtx);
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

    // 피격자(수비자) 전용 리액션 오프셋 헬퍼 (시전자는 절대 {0,0} 고정)
    const targetReact = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    return [
      // 1. [진흙 퍼올리기 1]: 시전자 웅크림 및 바닥 파내기 시작
      {
        ...baseFrame,
        delay: 90,
        ...cOff(10, 6),
        pScale: isP ? { x: 1.14, y: 0.86 } : undefined,
        eScale: !isP ? { x: 1.14, y: 0.86 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.35,
        phaseId: "mud-slap-scoop-1",
        phaseName: "1. 웅크림 및 바닥 진흙 긁어모으기",
      },
      // 2. [진흙 퍼올리기 2]: 진흙 덩어리 응축 완성 및 시동
      {
        ...baseFrame,
        delay: 85,
        ...cOff(14, 4),
        pScale: isP ? { x: 1.18, y: 0.82 } : undefined,
        eScale: !isP ? { x: 1.18, y: 0.82 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.95,
        phaseId: "mud-slap-scoop-2",
        phaseName: "2. 진흙 덩어리 응축 및 투척 준비",
      },
      // 3. [힘찬 투척 & 발진]: 시전자 도약 및 진흙 다발 일제 방출
      {
        ...baseFrame,
        delay: 65,
        ...cOff(22, -6),
        pScale: isP ? { x: 0.88, y: 1.14 } : undefined,
        eScale: !isP ? { x: 0.88, y: 1.14 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.12,
        phaseId: "mud-slap-launch",
        phaseName: "3. 전방 도약 및 진흙 다발 방출",
      },
      // 4. [탄도 궤적 1]: 포물선 상승 비행 (거리 38%)
      {
        ...baseFrame,
        delay: 60,
        ...cOff(12, -2),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.38,
        phaseId: "mud-slap-flight-1",
        phaseName: "4. 포물선 상승 비행",
      },
      // 5. [탄도 궤적 2]: 정점 통과 및 부채꼴 확산 (거리 70%)
      {
        ...baseFrame,
        delay: 60,
        ...cOff(4, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.70,
        phaseId: "mud-slap-flight-2",
        phaseName: "5. 정점 통과 & 부채꼴 확산 비행",
      },
      // 6. [탄도 궤적 3]: 상대 얼굴 직격 직전 급강하 (거리 96%)
      {
        ...baseFrame,
        delay: 55,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.96,
        phaseId: "mud-slap-flight-3",
        phaseName: "6. 상대 정면 직격 직전",
      },
      // 7. [철퍽 착탄 타격]: 상대 얼굴 정면 직격 & 사방 비산 충격파
      {
        ...baseFrame,
        delay: 130,
        ...targetReact(-10, -4),
        targetDarkLevel: isHit ? 0.25 : 0,
        showEffect: isHit,
        hitFlash: isHit,
        moveStep: 3,
        effectProgress: 0.20,
        phaseId: "mud-slap-splat",
        phaseName: "7. 철퍽! 착탄 파열 & 사방 비산",
      },
      // 8. [얼굴 진흙 얼룩 & 반동]: 피격자 넉백 반동 및 진흙 밀착
      {
        ...baseFrame,
        delay: 135,
        ...targetReact(5, 2),
        targetDarkLevel: isHit ? 0.40 : 0,
        showEffect: isHit,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.50,
        phaseId: "mud-slap-smear-drip-1",
        phaseName: "8. 피격자 반동 & 얼굴 진흙 밀착",
      },
      // 9. [얼굴 진흙 흘러내림]: 3가닥 진흙 방울 주르륵 흘러내림 & 시야 차폐
      {
        ...baseFrame,
        delay: 145,
        ...targetReact(-3, 0),
        targetDarkLevel: isHit ? 0.45 : 0,
        showEffect: isHit,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.85,
        phaseId: "mud-slap-smear-drip-2",
        phaseName: "9. 진흙 방울 주르륵 흘러내림 & 시야 차폐",
      },
      // 10. [진흙 미끄러짐]: 아래로 뚝뚝 떨어지며 서서히 소산
      {
        ...baseFrame,
        delay: 120,
        ...targetReact(0, 0),
        targetDarkLevel: isHit ? 0.20 : 0,
        showEffect: isHit,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 0.40,
        phaseId: "mud-slap-slide-fade",
        phaseName: "10. 진흙 미끄러져 떨어짐 & 소산",
      },
      // 11. [소산 완료]: 잔여 흙먼지 소멸 및 시야 회복
      {
        ...baseFrame,
        delay: 100,
        ...targetReact(0, 0),
        targetDarkLevel: 0,
        showEffect: isHit,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 0.85,
        phaseId: "mud-slap-dissipate",
        phaseName: "11. 잔여 흙먼지 소멸 & 시야 회복",
      },
      // 12. [복귀 완료]: 중립 자세 안정적 복귀
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        targetDarkLevel: 0,
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 6,
        phaseId: "mud-slap-finish",
        phaseName: "12. 복귀 완료",
      },
    ];
  },
};
