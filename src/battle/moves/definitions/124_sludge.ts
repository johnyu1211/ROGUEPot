// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawSludgeBehindEffect,
  drawSludgeEffect,
} from "../../../renderers/moves/gen1/move121_124.js";

/**
 * 124: 오물공격 (Sludge) - 독 타입 특수 기술 (위력 65, 명중 100%, 30% 독)
 *
 * 연출 구성 (유저 100% 반영):
 * 1. [웅크림/응축] 시전자 웅크림 및 순수 스모그 가스로 뭉쳐진 독가스 덩어리 응축 생성
 * 2. [포물선 투척] 스모그 덩어리가 포물선 탄도로 날아가며 뒤편으로 부드러운 스모그 연무 잔상 방출 & 바닥 그림자
 * 3. [직격 파열 & 독기 타격] 착탄 순간 스모그 덩어리 파열 & 독침 맞았을 때 같은 핀포인트 독기 타격 스파크
 * 4. [보라색화 & 1차 독 비눗방울] 피격자 전신 보라색화 진행 & 영롱한 보라색 독 비눗방울 군집 발생
 * 5. [전신 중독 피크 & 비눗방울 상승] 전신 100% 중독 보라색화 피크 & 비눗방울 군집 상공 부유
 * 6. [독기 분산 & 비눗방울 소멸] 독기 분산 & 비눗방울 상공 분산 페이드아웃 및 복귀
 */
export const sludgeMove: BattleMoveAnimation = {
  num: 124,
  key: "sludge",
  nameKo: "오물공격",
  nameEn: "Sludge",
  type: "poison",
  category: "special",
  camera: { type: "target", zoom: 1.25, delayUntilStep: 3 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawSludgeBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawSludgeEffect(targetCtx, frame, drawCtx);
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
      // 1. 시전자 웅크림 및 스모그 덩어리 응축 생성
      {
        ...baseFrame,
        delay: 95,
        ...cOff(-6, 3),
        pScale: isP ? { x: 1.12, y: 0.88 } : undefined,
        eScale: !isP ? { x: 1.12, y: 0.88 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 1.0,
        targetPurpleLevel: 0,
        phaseId: "sludge-gather",
        phaseName: "1. 웅크림 및 스모그 덩어리 생성",
      },
      // 2. 힘찬 전방 투척 및 스모그 덩어리 발진
      {
        ...baseFrame,
        delay: 60,
        ...cOff(12, -4),
        pScale: isP ? { x: 0.92, y: 1.08 } : undefined,
        eScale: !isP ? { x: 0.92, y: 1.08 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.08,
        targetPurpleLevel: 0,
        phaseId: "sludge-fly-1",
        phaseName: "2. 전방 투척 및 발진",
      },
      // 3. 포물선 고각 상승 비행 (속도감 형성)
      {
        ...baseFrame,
        delay: 60,
        ...cOff(6, -2),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.28,
        targetPurpleLevel: 0,
        phaseId: "sludge-fly-2",
        phaseName: "3. 포물선 고각 상승 비행",
      },
      // 4. 상공 105px 최고 정점 통과 (완만한 궤적 정점)
      {
        ...baseFrame,
        delay: 60,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.52,
        targetPurpleLevel: 0,
        phaseId: "sludge-fly-3",
        phaseName: "4. 상공 105px 최고 정점 통과",
      },
      // 5. 상대를 향해 급강하 하강
      {
        ...baseFrame,
        delay: 60,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.76,
        targetPurpleLevel: 0,
        phaseId: "sludge-fly-4",
        phaseName: "5. 상대를 향해 급강하 쇄도",
      },
      // 6. 상대 정면 직격 격돌 직전
      {
        ...baseFrame,
        delay: 55,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.98,
        targetPurpleLevel: 0,
        phaseId: "sludge-fly-5",
        phaseName: "6. 상대 정면 직격 격돌 직전",
      },
      // 7. 도달 시 사방 여러 방향으로 스모그 대규모 확산 & 1차 독 거품 발생
      {
        ...baseFrame,
        delay: 135,
        ...targetReact(-9, -2),
        targetPurpleLevel: isHit ? 0.65 : 0,
        showEffect: isHit,
        hitFlash: isHit,
        moveStep: 3,
        phaseId: "sludge-impact",
        phaseName: "7. 도달 시 사방 여러 방향 스모그 확산 & 1차 독 거품",
      },
      // 8. 스모그 사방 확장 및 승화 & 전신 중독 보라색화 피크 및 독 거품 상승
      {
        ...baseFrame,
        delay: 140,
        ...targetReact(4, 1),
        targetPurpleLevel: isHit ? 1.0 : 0,
        showEffect: isHit,
        hitFlash: false,
        moveStep: 4,
        phaseId: "sludge-bubble-2",
        phaseName: "8. 스모그 사방 확장 승화 & 전신 중독 및 2차 독 거품 상승",
      },
      // 9. 스모그 완전 소멸 & 독 거품 상공 부유 및 분산 소멸
      {
        ...baseFrame,
        delay: 125,
        ...targetReact(0, 0),
        targetPurpleLevel: isHit ? 0.40 : 0,
        showEffect: isHit,
        hitFlash: false,
        moveStep: 5,
        phaseId: "sludge-bubble-3",
        phaseName: "9. 스모그 완전 소멸 & 3차 독 거품 상공 부유 분산",
      },
      // 10. 복귀 완료
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        targetPurpleLevel: 0,
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 5,
        phaseId: "sludge-finish",
        phaseName: "10. 복귀 완료",
      },
    ];
  },
};
