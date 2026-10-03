// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawOctazookaBehindEffect,
  drawOctazookaEffect,
} from "../../../renderers/moves/gen1/move189_192.js";

/**
 * 190: 대포무노포 (Octazooka) - 물 타입 특수 기술 (위력 65, 명중 85%, 50% 명중률 1랭크 하락)
 *
 * 연출 구성 (유저 요구사항 100% 반영: 독가스 139번 관통 메커니즘 계승):
 * 1. [웅크림 & 먹물 응축]: 시전자 깊은 웅크림 및 입가에 짙은 먹물 연무 응축 (1단계)
 * 2. [직선 제트 분출]: 입에서 전방으로 점점 굵어지며 쇄도하는 고압 직선 먹물 연기 제트 스트림 사출 (2단계)
 * 3. [상대방 직격 & Z축 관통!]: 상대 정면 직격 & 상대를 관통하여 등 뒤(Z축 뒤)로 먹물 연기 맹렬 분출 (3단계)
 * 4. [분사 종료 & 스트림 후미 관통 통과]: 스트림 꼬리가 상대를 통과하며 등 뒤로 빠져나감 (4단계)
 * 5. [먹물 연기 대기 분산]: 관통한 먹물 연기가 상공으로 피어오르며 서서히 소산 & 복귀 (5, 6단계)
 */
export const octazookaMove: BattleMoveAnimation = {
  num: 190,
  key: "octazooka",
  nameKo: "대포무노포",
  nameEn: "Octazooka",
  type: "water",
  category: "special",
  camera: { type: "target", zoom: 1.30, delayUntilStep: 2 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawOctazookaBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawOctazookaEffect(targetCtx, frame, drawCtx);
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
      hitFlash: false,
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
      // 1. [웅크림 & 입가 먹물 응축 1]
      {
        ...baseFrame,
        delay: 80,
        ...cOff(-4, 2),
        pScale: isP ? { x: 1.08, y: 0.92 } : undefined,
        eScale: !isP ? { x: 1.08, y: 0.92 } : undefined,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.35,
        phaseId: "octazooka-gather-1",
        phaseName: "1. 웅크림 & 입가 먹물 연무 응축",
      },
      // 2. [깊은 웅크림 & 먹물 최대 가압 2]
      {
        ...baseFrame,
        delay: 85,
        ...cOff(-6, 3),
        pScale: isP ? { x: 1.15, y: 0.86 } : undefined,
        eScale: !isP ? { x: 1.15, y: 0.86 } : undefined,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.90,
        phaseId: "octazooka-gather-2",
        phaseName: "2. 고압 먹물 연기 가압 충전",
      },
      // 3. [직선 제트 분출 개시]: 입에서 고속 먹물 스트림 사출
      {
        ...baseFrame,
        delay: 65,
        ...cOff(12, -4),
        pScale: isP ? { x: 0.92, y: 1.10 } : undefined,
        eScale: !isP ? { x: 0.92, y: 1.10 } : undefined,
        showEffect: true,
        moveStep: 2,
        streamHead: 0.45,
        streamTail: 0.0,
        streamAlpha: 1.0,
        effectProgress: 0.45,
        phaseId: "octazooka-launch",
        phaseName: "3. 직선 먹물 연기 제트 스트림 발사",
      },
      // 4. [고속 쇄도]: 상대방 정면 도달 직전
      {
        ...baseFrame,
        delay: 60,
        ...cOff(4, -1),
        showEffect: true,
        moveStep: 2,
        streamHead: 0.92,
        streamTail: 0.0,
        streamAlpha: 1.0,
        effectProgress: 0.92,
        phaseId: "octazooka-flight",
        phaseName: "4. 상대 정면 고속 쇄도",
      },
      // 5. [상대방 직격 & 관통 개시!]: 섬광 & 상대를 뚫고 Z축 뒤로 먹물 연기 분출!
      {
        ...baseFrame,
        delay: 80,
        ...cOff(2, 0),
        ...targetReact(-9, -3),
        targetDarkLevel: isHit ? 0.35 : 0,
        hitFlash: isHit,
        showEffect: isHit,
        moveStep: 3,
        streamHead: 1.25,
        streamTail: 0.05,
        streamAlpha: 1.0,
        effectProgress: 0.25,
        phaseId: "octazooka-impact-pierce-1",
        phaseName: "5. 상대 직격 & Z축 관통 개시",
      },
      // 6. [전력 관통 분사!]: 상대를 100% 관통하여 등 뒤로 거대 먹물 연기 방출
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...targetReact(-11, -2),
        targetDarkLevel: isHit ? 0.65 : 0,
        showEffect: isHit,
        moveStep: 3,
        streamHead: 1.50,
        streamTail: 0.15,
        streamAlpha: 1.0,
        effectProgress: 0.75,
        phaseId: "octazooka-impact-pierce-2",
        phaseName: "6. 전력 관통 지속 분사 & 전신 차폐",
      },
      // 7. [분사 종료 & 스트림 후미 쇄도]: 스트림 꼬리가 상대방을 관통하며 지나감
      {
        ...baseFrame,
        delay: 85,
        ...targetReact(-5, 1),
        targetDarkLevel: isHit ? 0.70 : 0,
        showEffect: isHit,
        moveStep: 4,
        streamHead: 1.60,
        streamTail: 0.60,
        streamAlpha: 1.0,
        effectProgress: 0.30,
        phaseId: "octazooka-pass-1",
        phaseName: "7. 스트림 꼬리 관통 통과 1",
      },
      // 8. [스트림 후미 완전 통과]: 상대 등 뒤로 완전히 빠져나감
      {
        ...baseFrame,
        delay: 90,
        ...targetReact(2, 0),
        targetDarkLevel: isHit ? 0.45 : 0,
        showEffect: isHit,
        moveStep: 4,
        streamHead: 1.65,
        streamTail: 1.15,
        streamAlpha: 0.85,
        effectProgress: 0.80,
        phaseId: "octazooka-pass-2",
        phaseName: "8. 스트림 꼬리 완전 통과 & 등 뒤 소산",
      },
      // 9. [먹물 연기 대기 분산 & 승화]
      {
        ...baseFrame,
        delay: 110,
        ...targetReact(0, 0),
        targetDarkLevel: isHit ? 0.20 : 0,
        showEffect: isHit,
        moveStep: 5,
        effectProgress: 0.40,
        phaseId: "octazooka-dissipate-1",
        phaseName: "9. 관통한 먹물 연기 상공 승화",
      },
      // 10. [잔여 먹물 연기 소멸]
      {
        ...baseFrame,
        delay: 100,
        ...targetReact(0, 0),
        targetDarkLevel: 0,
        showEffect: isHit,
        moveStep: 5,
        effectProgress: 0.85,
        phaseId: "octazooka-dissipate-2",
        phaseName: "10. 먹물 연기 소산 및 시야 회복",
      },
      // 11. [복귀 완료]
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        targetDarkLevel: 0,
        showEffect: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 6,
        phaseId: "octazooka-finish",
        phaseName: "11. 복귀 완료",
      },
    ];
  },
};
