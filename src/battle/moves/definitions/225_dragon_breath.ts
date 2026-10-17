// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawDragonBreathBehindEffect,
  drawDragonBreathEffect,
} from "../../../renderers/moves/gen1/move225_228.js";

/**
 * 225: 용의숨결 (Dragon Breath / りゅうのいぶき) - 드래곤 타입 특수 기술 (위력 60 / 명중 100 / PP 20 / 30% 마비)
 *
 * 연출 메커니즘 (얼음숨결 기반):
 * 1. [기운 들이쉬기 & 배경 암전 개시] 시전자 웅크림 & 입가 연분홍 기운 응축 (1단계)
 * 2. [슬림 용의숨결 빛줄기 사출] 배경 살짝 암전(dimAlpha: 0.38) & 3개 마디로 나뉜 연분홍 빛줄기 초고속 쇄도 (2단계)
 * 3. [대상 직격 관통 & 지속 방사] 대상 관통 & 연한 주황빛 마디 관절이 빛나며 지속 분사 + 직격 섬광 (3단계)
 * 4. [분사 종료 & 스트림 후미 쇄도] 꼬리가 대상을 통과하며 연분홍/연주황 스파클 비산 (4단계)
 * 5. [상공 분산 & 소멸 복귀] 빛줄기 분산 소멸 및 배경 조도 정상 복귀 (5단계)
 */
export const dragonBreathMove: BattleMoveAnimation = {
  num: 225,
  key: "dragon-breath",
  nameKo: "용의숨결",
  nameEn: "Dragon Breath",
  type: "dragon",
  category: "special",
  camera: { type: "target", zoom: 1.28, delayUntilStep: 3 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect && !frame.dimAlpha) return;
    drawDragonBreathBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawDragonBreathEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.28,
      pRot: 0,
      eRot: 0,
      hitFlash: false,
    };

    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const targetReact = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    return [
      // 1. 시전자 숨 들이쉬기 & 입가 연분홍 기운 피어오름
      {
        ...baseFrame,
        delay: 80,
        ...cOff(-4, 2),
        pScale: isP ? { x: 1.05, y: 0.95 } : undefined,
        eScale: !isP ? { x: 1.05, y: 0.95 } : undefined,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.35,
        dimAlpha: 0.15,
        phaseId: "dragon-breath-inhale-1",
        phaseName: "1. 들이쉬기 시작 & 입가 기운 응축",
      },
      // 2. 깊은 웅크림 & 드래곤 브레스 에너지 응축 극대화
      {
        ...baseFrame,
        delay: 85,
        ...cOff(-7, 3),
        pScale: isP ? { x: 1.10, y: 0.90 } : undefined,
        eScale: !isP ? { x: 1.10, y: 0.90 } : undefined,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.85,
        dimAlpha: 0.28,
        phaseId: "dragon-breath-inhale-2",
        phaseName: "2. 깊은 웅크림 & 브레스 응축",
      },
      // 3. 용의숨결 광선 초고속 분출 개시 (시전자 -> 적 방향 쇄도)
      {
        ...baseFrame,
        delay: 70,
        ...cOff(-3, 1),
        pScale: isP ? { x: 0.96, y: 1.04 } : undefined,
        eScale: !isP ? { x: 0.96, y: 1.04 } : undefined,
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.30,
        streamHead: 0.50,
        streamTail: 0.0,
        streamAlpha: 1.0,
        dimAlpha: 0.36,
        phaseId: "dragon-breath-exhale-1",
        phaseName: "3. 용의숨결 광선 분출 개시",
      },
      // 4. 연속 광선 고속 전진 & 적 전방 육박
      {
        ...baseFrame,
        delay: 70,
        ...cOff(-1, 0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.65,
        streamHead: 0.95,
        streamTail: 0.0,
        streamAlpha: 1.0,
        dimAlpha: 0.38,
        phaseId: "dragon-breath-exhale-2",
        phaseName: "4. 연속 광선 전진 & 적 전방 육박",
      },
      // 5. 대상 포켓몬 정면 돌파 & 관통 시작
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.95,
        streamHead: 1.60,
        streamTail: 0.0,
        streamAlpha: 1.0,
        dimAlpha: 0.38,
        phaseId: "dragon-breath-exhale-3",
        phaseName: "5. 대상 포켓몬 정면 돌파 & 관통 시작",
      },
      // 6. [지속 분사 1] 대상 완벽 관통 & 맹렬한 연속 발사 (직격 섬광)
      {
        ...baseFrame,
        delay: 110,
        ...targetReact(isHit ? -6 : 0, -2),
        ...cOff(-2, 1),
        hitFlash: isHit,
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.15,
        streamHead: 2.20,
        streamTail: 0.0,
        streamAlpha: 1.0,
        dimAlpha: 0.40,
        phaseId: "dragon-breath-engulf-1",
        phaseName: "6. 대상 완벽 관통 & 맹렬한 연속 발사",
      },
      // 7. [지속 분사 2] 시전자로부터 계속 에너지가 뿜어져 나오는 연속 발사
      {
        ...baseFrame,
        delay: 115,
        ...targetReact(isHit ? 5 : 0, 1),
        ...cOff(1, -1),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.32,
        streamHead: 2.60,
        streamTail: 0.0,
        streamAlpha: 1.0,
        dimAlpha: 0.40,
        phaseId: "dragon-breath-engulf-2",
        phaseName: "7. 뿜어져 나오는 연속 발사 & 피격 충격 1",
      },
      // 8. [지속 분사 3] 맹렬한 에너지 파동 지속 타격
      {
        ...baseFrame,
        delay: 120,
        ...targetReact(isHit ? -5 : 0, -1),
        ...cOff(-1, 1),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.50,
        streamHead: 2.85,
        streamTail: 0.0,
        streamAlpha: 1.0,
        dimAlpha: 0.40,
        phaseId: "dragon-breath-engulf-3",
        phaseName: "8. 뿜어져 나오는 연속 발사 & 피격 충격 2",
      },
      // 9. [지속 분사 4] 대상 완벽 압도 지속 타격
      {
        ...baseFrame,
        delay: 120,
        ...targetReact(isHit ? 4 : 0, 1),
        ...cOff(1, -1),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.68,
        streamHead: 2.85,
        streamTail: 0.0,
        streamAlpha: 1.0,
        dimAlpha: 0.40,
        phaseId: "dragon-breath-engulf-4",
        phaseName: "9. 광선의 지속 타격 & 브레스 유지",
      },
      // 10. [지속 분사 5] 최대 출력 분사 유지
      {
        ...baseFrame,
        delay: 120,
        ...targetReact(isHit ? -3 : 0, 0),
        ...cOff(-1, 0),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.85,
        streamHead: 2.85,
        streamTail: 0.0,
        streamAlpha: 1.0,
        dimAlpha: 0.40,
        phaseId: "dragon-breath-engulf-5",
        phaseName: "10. 최대 출력 분사 유지 1",
      },
      // 11. [지속 분사 6] 최대 출력 마무리 분사
      {
        ...baseFrame,
        delay: 125,
        ...targetReact(isHit ? 2 : 0, 0),
        ...cOff(1, 0),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.98,
        streamHead: 2.85,
        streamTail: 0.0,
        streamAlpha: 1.0,
        dimAlpha: 0.40,
        phaseId: "dragon-breath-engulf-6",
        phaseName: "11. 최대 출력 분사 유지 2",
      },
      // 12. [유저 요청 엄수 - 통과 탈출 1]: 시전자 분사 중단! 입쪽 끝이 끊어지고 앞으로 날아감
      {
        ...baseFrame,
        delay: 95,
        ...targetReact(isHit ? -2 : 0, 0),
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.25,
        streamHead: 3.20,
        streamTail: 0.45,
        streamAlpha: 1.0,
        dimAlpha: 0.36,
        phaseId: "dragon-breath-swirl-1",
        phaseName: "12. 시전자 쪽 끝 끊김 & 앞으로 쇄도",
      },
      // 13. [유저 요청 엄수 - 통과 탈출 2]: 광선 꼬리가 적 직전까지 앞으로 고속 질주
      {
        ...baseFrame,
        delay: 95,
        ...targetReact(isHit ? 1 : 0, 0),
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.60,
        streamHead: 3.80,
        streamTail: 1.15,
        streamAlpha: 1.0,
        dimAlpha: 0.26,
        phaseId: "dragon-breath-swirl-2",
        phaseName: "13. 광선 꼬리 고속 전진",
      },
      // 14. [유저 요청 엄수 - 통과 탈출 3]: 광선 꼬리가 적(1.0)을 완전히 뚫고 지나쳐 통과 완료!
      {
        ...baseFrame,
        delay: 95,
        ...targetReact(0, 0),
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.88,
        streamHead: 4.40,
        streamTail: 2.05,
        streamAlpha: 1.0,
        dimAlpha: 0.14,
        phaseId: "dragon-breath-swirl-3",
        phaseName: "14. 광선 꼬리 대상 통과 완료",
      },
      // 15. [유저 요청 엄수 - 통과 탈출 4]: 광선 전체가 화면 밖으로 완전히 날아감
      {
        ...baseFrame,
        delay: 90,
        ...targetReact(0, 0),
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.40,
        streamHead: 5.00,
        streamTail: 3.10,
        streamAlpha: 1.0,
        dimAlpha: 0.06,
        phaseId: "dragon-breath-disperse-1",
        phaseName: "15. 화면 밖으로 관통 탈출",
      },
      // 16. 완전 소멸 & 정위치 복귀 (조도 정상화)
      {
        ...baseFrame,
        delay: 80,
        ...targetReact(0, 0),
        ...cOff(0, 0),
        showEffect: false,
        moveStep: 5,
        effectProgress: 0.90,
        dimAlpha: 0.0,
        phaseId: "dragon-breath-end",
        phaseName: "16. 완전 소멸 & 정위치 복귀",
      },
    ];

  },
};

