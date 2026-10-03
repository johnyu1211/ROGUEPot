// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawSludgeBombBehindEffect,
  drawSludgeBombEffect,
} from "../../../renderers/moves/gen1/move185_188.js";

/**
 * 188: 오물폭탄 (Sludge Bomb) - 독 타입 특수 기술 (위력 90, 명중 100%, 30% 독)
 *
 * 연출 구성 (유저 요구사항 100% 반영):
 * 1. [오물 응축] 시전자 웅크림 및 점성 넘치는 덩어리 오물(Sludge Bomb) 생성 및 응축
 * 2. [포물선 투척 & 가스 잔상] 오물 덩어리가 상공 105px 포물선 궤적으로 고속 투척 비행하며,
 *    지나온 탄도 궤적 뒤편으로 부드럽게 피어오르는 독가스 잔상(Gas Trail Puffs) 방출
 * 3. [스모그 타격] 대상 직격 시 오물 파열 & 스모그 타격 충격파 & 사방 오물 파편 비산
 * 4. [가스가 뭉쳐져 있는 연출] 타격 직후 흩날려 사라지지 않고, 대상 전신 주위(Front/Behind)에
 *    고밀도 심연 흑자색 독가스들이 두텁게 뭉쳐져(Clustered) 요동치며 전신을 차폐 포위
 * 5. [승화 및 소산] 뭉쳐진 독가스가 서서히 상공으로 승화하며 대기 중으로 페이드아웃 및 복귀
 */
export const sludgeBombMove: BattleMoveAnimation = {
  num: 188,
  key: "sludge-bomb",
  nameKo: "오물폭탄",
  nameEn: "Sludge Bomb",
  type: "poison",
  category: "special",
  camera: { type: "target", zoom: 1.25, delayUntilStep: 3 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawSludgeBombBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawSludgeBombEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.25,
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
      // 1. 시전자 웅크림 및 점성 덩어리 오물 응축 생성
      {
        ...baseFrame,
        delay: 95,
        ...cOff(-6, 3),
        pScale: isP ? { x: 1.12, y: 0.88 } : undefined,
        eScale: !isP ? { x: 1.12, y: 0.88 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.60,
        targetPurpleLevel: 0,
        phaseId: "sludge-bomb-gather",
        phaseName: "1. 웅크림 및 덩어리 오물 생성",
      },
      // 2. 덩어리 오물 최대 응축 완성 및 힘 비축
      {
        ...baseFrame,
        delay: 85,
        ...cOff(-8, 4),
        pScale: isP ? { x: 1.16, y: 0.84 } : undefined,
        eScale: !isP ? { x: 1.16, y: 0.84 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 1.0,
        targetPurpleLevel: 0,
        phaseId: "sludge-bomb-gather-full",
        phaseName: "2. 덩어리 오물 응축 완성",
      },
      // 3. 힘찬 전방 투척 및 오물 덩어리 발진
      {
        ...baseFrame,
        delay: 60,
        ...cOff(12, -4),
        pScale: isP ? { x: 0.90, y: 1.10 } : undefined,
        eScale: !isP ? { x: 0.90, y: 1.10 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.10,
        targetPurpleLevel: 0,
        phaseId: "sludge-bomb-launch",
        phaseName: "3. 전방 힘찬 투척 및 발진",
      },
      // 4. 포물선 고각 상승 비행 (가스 잔상 피어오름)
      {
        ...baseFrame,
        delay: 60,
        ...cOff(6, -2),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.32,
        targetPurpleLevel: 0,
        phaseId: "sludge-bomb-fly-1",
        phaseName: "4. 포물선 상승 비행 및 가스 잔상",
      },
      // 5. 상공 105px 최고 정점 통과 (포물선 궤적 가스 잔상 지속)
      {
        ...baseFrame,
        delay: 60,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.58,
        targetPurpleLevel: 0,
        phaseId: "sludge-bomb-fly-2",
        phaseName: "5. 최고 정점 통과 & 가스 잔상",
      },
      // 6. 상대를 향해 급강하 쇄도
      {
        ...baseFrame,
        delay: 60,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.82,
        targetPurpleLevel: 0,
        phaseId: "sludge-bomb-fly-3",
        phaseName: "6. 급강하 쇄도 & 후류 가스 잔상",
      },
      // 7. 상대 정면 직격 격돌 직전
      {
        ...baseFrame,
        delay: 55,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.98,
        targetPurpleLevel: 0,
        phaseId: "sludge-bomb-fly-4",
        phaseName: "7. 상대 정면 직격 직전",
      },
      // 8. [스모그 타격]: 착탄 순간 파열 & 스모그 충격파 & 오물 파편 비산
      {
        ...baseFrame,
        delay: 135,
        ...targetReact(-9, -2),
        targetDarkLevel: isHit ? 0.35 : 0,
        targetPurpleLevel: isHit ? 0.65 : 0,
        showEffect: isHit,
        hitFlash: isHit,
        moveStep: 3,
        effectProgress: 0.15,
        phaseId: "sludge-bomb-impact",
        phaseName: "8. 착탄 스모그 타격 & 오물 파편 비산",
      },
      // 9. [가스가 뭉쳐져 있는 연출 1]: 타격 직후 사방으로 흩어지지 않고 짙게 뭉쳐지기 시작
      {
        ...baseFrame,
        delay: 140,
        ...targetReact(4, 1),
        targetDarkLevel: isHit ? 0.60 : 0,
        targetPurpleLevel: isHit ? 0.85 : 0,
        showEffect: isHit,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.40,
        phaseId: "sludge-bomb-cluster-1",
        phaseName: "9. 고밀도 독가스 뭉침 형성 & 대상 포위",
      },
      // 10. [가스가 뭉쳐져 있는 연출 2]: 전신을 짙게 감싼 채 요동치는 뭉쳐진 가스 클러스터 피크
      {
        ...baseFrame,
        delay: 150,
        ...targetReact(-2, 0),
        targetDarkLevel: isHit ? 0.75 : 0,
        targetPurpleLevel: isHit ? 1.0 : 0,
        showEffect: isHit,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.75,
        phaseId: "sludge-bomb-cluster-2",
        phaseName: "10. 뭉쳐진 독가스 클러스터 피크 & 전신 차폐",
      },
      // 11. [가스 서서히 승화]: 뭉쳐진 가스가 상공으로 피어오르며 완화
      {
        ...baseFrame,
        delay: 130,
        ...targetReact(0, 0),
        targetDarkLevel: isHit ? 0.35 : 0,
        targetPurpleLevel: isHit ? 0.50 : 0,
        showEffect: isHit,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 0.30,
        phaseId: "sludge-bomb-cluster-3",
        phaseName: "11. 뭉쳐진 가스 상공 승화 시작",
      },
      // 12. [가스 소멸]: 대기 중으로 페이드아웃 소산
      {
        ...baseFrame,
        delay: 110,
        ...targetReact(0, 0),
        targetDarkLevel: isHit ? 0.10 : 0,
        targetPurpleLevel: isHit ? 0.20 : 0,
        showEffect: isHit,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 0.80,
        phaseId: "sludge-bomb-dissipate",
        phaseName: "12. 가스 대기 소산 및 시야 회복",
      },
      // 13. 복귀 완료
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        targetDarkLevel: 0,
        targetPurpleLevel: 0,
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 6,
        phaseId: "sludge-bomb-finish",
        phaseName: "13. 복귀 완료",
      },
    ];
  },
};
