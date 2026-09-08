// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawAcidEffect } from "../../../renderers/moves/gen1/move049_052.js";

/**
 * 051: 용해액 (Acid)
 * 
 * Concept (유저 요구사항 100% 반영):
 * 1. 포물선으로 발사 (고공 포물선 궤도 H = 75px)
 * 2. 용해액이 벽에 붙은 것 처럼 퍼진 SVG (🫟 이모지와 유사한 다중 로브 스플래터)
 * 3. 포물선으로 잔상을 남기며 발사됨 (4단계 점진 축소/투명 유체 잔상 + 비산 액체 방울)
 * 4. 타격 시 대상 포켓몬 몸체에 찰싹 부착되어 퍼지고, 산성액이 아래로 흘러내리며 부식 거품 보글보글 발생
 */
export const acidMove: BattleMoveAnimation = {
  num: 51,
  key: "acid",
  nameKo: "용해액",
  nameEn: "Acid",
  type: "poison",
  category: "special",
  camera: { type: "target", zoom: 1.30 },
  drawEffect: drawAcidEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    const targetShake = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    const attackerShake = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x, y } : { x: 0, y: 0 },
    });

    return [
      // 1. 시전자 압축 충전 (용해액 체내 축적 및 발사 준비)
      {
        ...baseFrame,
        delay: 70,
        ...attackerShake(-2, 1),
        pScale: isP ? { x: 1.06, y: 0.94 } : undefined,
        eScale: !isP ? { x: 1.06, y: 0.94 } : undefined,
        showEffect: true,
        moveStep: 1,
        projectileT: 0.05,
        splatterScale: 0.75,
        phaseId: "acid-charge",
        phaseName: "1. 용해액 생성 및 발사 준비",
      },
      // 2. 포물선 상공 사출 개시 (H = 75px 고공 궤도 진입)
      {
        ...baseFrame,
        delay: 65,
        ...attackerShake(3, -2),
        pScale: isP ? { x: 0.95, y: 1.05 } : undefined,
        eScale: !isP ? { x: 0.95, y: 1.05 } : undefined,
        showEffect: true,
        moveStep: 2,
        projectileT: 0.22,
        splatterScale: 0.85,
        phaseId: "acid-launch",
        phaseName: "2. 고공 포물선 궤도 진입",
      },
      // 3. 포물선 최고 정점 상승 (후방 4단 잔상 + 미세 방울 비산)
      {
        ...baseFrame,
        delay: 65,
        ...attackerShake(1, -1),
        showEffect: true,
        moveStep: 3,
        projectileT: 0.48,
        splatterScale: 0.92,
        phaseId: "acid-apex",
        phaseName: "3. 포물선 최고점 상승 (잔상 동반)",
      },
      // 4. 포물선 하강 쇄도 (대상을 향한 급강하)
      {
        ...baseFrame,
        delay: 65,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 4,
        projectileT: 0.76,
        splatterScale: 0.98,
        phaseId: "acid-descend",
        phaseName: "4. 대상 방향 급강하 비행",
      },
      // 5. 대상 직전 육박 (착탄 직전 가속)
      {
        ...baseFrame,
        delay: 55,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 5,
        projectileT: 0.94,
        splatterScale: 1.05,
        phaseId: "acid-approach",
        phaseName: "5. 착탄 직전 육박",
      },
      // 6. [착탄 직격!] 둥근 느낌 없는 날카로운 액체 폭발 비산 (Splash Starburst)
      {
        ...baseFrame,
        delay: 95,
        ...targetShake(4, -2),
        showEffect: true,
        moveStep: 6,
        projectileT: 1.0,
        isImpact: true,
        hitFlash: isHit,
        phaseId: "acid-impact",
        phaseName: "6. 대상 포켓몬 액체 폭발 비산 (Splash Starburst)",
      },
      // 7. [산성 흡착 및 흘러내림 1] 벽면에 철푸덕 부착 & 액체 줄기 흘러내림 시작
      {
        ...baseFrame,
        delay: 85,
        ...targetShake(-3, 2),
        showEffect: true,
        moveStep: 7,
        isImpact: true,
        impactSplatterScale: 1.35,
        impactDripLen: 32,
        phaseId: "acid-drip-1",
        phaseName: "7. 철푸덕 흡착 및 액체 줄기 흘러내림",
      },
      // 8. [산성 중력 흘러내림 2] 길게 늘어진 5가닥 드립 스트림 및 물방울 낙하
      {
        ...baseFrame,
        delay: 85,
        ...targetShake(2, -1),
        showEffect: true,
        moveStep: 8,
        isImpact: true,
        impactSplatterScale: 1.25,
        impactDripLen: 54,
        phaseId: "acid-drip-2",
        phaseName: "8. 액체 줄기 최대 흘러내림 및 방울 낙하",
      },
      // 9. [용해 및 소멸] 산성액이 스며들며 페이드아웃
      {
        ...baseFrame,
        delay: 75,
        ...targetShake(-1, 0),
        showEffect: true,
        moveStep: 9,
        isImpact: true,
        impactSplatterScale: 1.15,
        impactSplatterAlpha: 0.40,
        impactDripLen: 64,
        phaseId: "acid-dissolve",
        phaseName: "9. 산성 용해액 침투 및 페이드아웃",
      },
      // 10. 스탠스 원복 및 기술 종료
      {
        ...baseFrame,
        delay: 60,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        moveStep: 10,
        phaseId: "acid-end",
        phaseName: "10. 기술 종료 및 스탠스 원복",
      },
    ];
  },
};
