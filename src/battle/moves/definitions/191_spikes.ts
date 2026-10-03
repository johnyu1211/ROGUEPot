// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawSpikesBehindEffect,
  drawSpikesEffect,
} from "../../../renderers/moves/gen1/move189_192.js";

/**
 * 191: 압정뿌리기 (Spikes) - 땅 타입 변화 기술 (상대 진영에 최대 3겹 압정 설치)
 *
 * 연출 구성 (5세대 BW 고증 + ROGUEPot 2.5D 입체 Z-Layer 계승):
 * 1. [웅크림 & 압정 준비]: 시전자가 뒤로 물러나 웅크리며 손 부근에서 짤랑거리는 강철 압정 3개 회전 모으기 (1단계)
 * 2. [포물선 도약 투척]: 전방으로 팔을 내지르며 5개의 날카로운 마름쇠(Caltrops)가 시간차를 두고 고속 포물선 비행 (2단계)
 * 3. [상대 진영 착탄]: 상대방 발밑 지면에 1~5번 압정이 흙먼지 퍼프 및 샤프 다이아몬드 글린트와 함께 '팅! 팍!' 박힘 (3단계)
 *    - 1, 4번 압정은 상대방 등 뒤(Z축 뒤, Behind 레이어)에 배치
 *    - 0, 2, 3번 압정은 상대방 발 앞(Front 레이어)에 배치
 * 4. [압정 결계 활성화]: 지면에 박힌 압정들이 사선 그림자와 함께 서서히 공명하며 위험 지대(Hazard Zone) 형성 (4단계)
 * 5. [지면 안착 및 소산]: 결계가 필드에 영구 안착되며 서서히 페이드아웃 & 시전자 복귀 (5단계)
 */
export const spikesMove: BattleMoveAnimation = {
  num: 191,
  key: "spikes",
  nameKo: "압정뿌리기",
  nameEn: "Spikes",
  type: "ground",
  category: "status",
  camera: { type: "target", zoom: 1.30, delayUntilStep: 2 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawSpikesBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawSpikesEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

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

    return [
      // 1. [웅크림 & 압정 준비 1]
      {
        ...baseFrame,
        delay: 80,
        ...cOff(-4, 2),
        pScale: isP ? { x: 1.08, y: 0.92 } : undefined,
        eScale: !isP ? { x: 1.08, y: 0.92 } : undefined,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.35,
        phaseId: "spikes-prepare-1",
        phaseName: "1. 시전자 웅크림 및 압정 모으기 1",
      },
      // 2. [웅크림 심화 & 압정 짤랑거림 2]
      {
        ...baseFrame,
        delay: 90,
        ...cOff(-8, 4),
        pScale: isP ? { x: 1.12, y: 0.88 } : undefined,
        eScale: !isP ? { x: 1.12, y: 0.88 } : undefined,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.85,
        phaseId: "spikes-prepare-2",
        phaseName: "2. 압정 주머니/손가락 모으기 완료",
      },
      // 3. [전방 도약 투척 사출 1]
      {
        ...baseFrame,
        delay: 85,
        ...cOff(14, -6),
        pScale: isP ? { x: 0.92, y: 1.08 } : undefined,
        eScale: !isP ? { x: 0.92, y: 1.08 } : undefined,
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.25,
        phaseId: "spikes-throw-1",
        phaseName: "3. 마름쇠 전방 고속 투척",
      },
      // 4. [고속 포물선 비행 2]
      {
        ...baseFrame,
        delay: 95,
        ...cOff(20, -4),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.60,
        phaseId: "spikes-flight-2",
        phaseName: "4. 포물선 분산 비행",
      },
      // 5. [상대 진영 쇄도 & 낙하 3]
      {
        ...baseFrame,
        delay: 85,
        ...cOff(12, -2),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.95,
        phaseId: "spikes-flight-3",
        phaseName: "5. 상대방 발밑 지면 쇄도",
      },
      // 6. [지면 착탄 & 흙먼지 퍼프 1]
      {
        ...baseFrame,
        delay: 90,
        ...cOff(4, 0),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.30,
        phaseId: "spikes-impact-1",
        phaseName: "6. 지면 착탄 & 흙먼지 분출",
      },
      // 7. [지면 단단히 박힘 & 메탈릭 글린트 2]
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.85,
        phaseId: "spikes-impact-2",
        phaseName: "7. 마름쇠 지면 안착 & 금속 섬광",
      },
      // 8. [발밑 전역 압정 결계 활성화 1]
      {
        ...baseFrame,
        delay: 100,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.35,
        phaseId: "spikes-hazard-1",
        phaseName: "8. 압정 결계 활성화 1",
      },
      // 9. [발밑 전역 압정 결계 활성화 2 & 위험 지대 아우라]
      {
        ...baseFrame,
        delay: 105,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.85,
        phaseId: "spikes-hazard-2",
        phaseName: "9. 위험 지대(Hazard Zone) 아우라 전개",
      },
      // 10. [압정 결계 지면 안착 및 서서히 소산]
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.50,
        phaseId: "spikes-fade-1",
        phaseName: "10. 압정 결계 필드 안착",
      },
      // 11. [복귀 완료]
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        showEffect: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 5,
        effectProgress: 1.0,
        phaseId: "spikes-finish",
        phaseName: "11. 복귀 완료",
      },
    ];
  },
};
