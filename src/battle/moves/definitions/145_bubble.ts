// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawBubbleEffect } from "../../../renderers/moves/gen1/move145_148.js";

/**
 * 145: 거품 (Bubble)
 * 
 * 타입: 물 (Water)
 * 분류: 특수 (Special)
 * 위력: 40 / 명중: 100 / PP: 30
 * 부가 효과: 10% 확률로 상대의 스피드를 1랭크 하락시킴
 * 
 * [유저 요구사항 100% 반영]:
 * 1. 거품광선에서 거품 3개만 차용
 * 2. 꼬리같은 것 일체 없이
 * 3. 해당 거품 3개가 커졌다가 작아졌다가 하면서 적에게 이동
 * 4. 닿고나서 1번, 2번, 3번 거품 순차적으로 '펑! 펑! 펑!' 파열
 */
export const bubbleMove: BattleMoveAnimation = {
  num: 145,
  key: "bubble",
  nameKo: "거품",
  nameEn: "Bubble",
  type: "water",
  category: "special",
  camera: { type: "target", zoom: 1.25 },
  drawEffect: drawBubbleEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    const frames: BattleFrame[] = [];

    // 거품 3개의 발사 및 적중 타이밍 (17F, 20F, 23F에 각각 '펑! 펑! 펑!')
    const BUBBLE_TIMINGS = [
      { startF: 5.0, hitF: 17.0, popDur: 4.0 }, // 1호 거품 (상단, 17F에 첫번째 펑!)
      { startF: 7.5, hitF: 20.0, popDur: 4.0 }, // 2호 거품 (중앙, 20F에 두번째 펑!)
      { startF: 10.0, hitF: 23.0, popDur: 4.5 }, // 3호 거품 (하단, 23F에 세번째 펑!)
    ];

    const TOTAL_FRAMES = 34;

    for (let f = 1; f <= TOTAL_FRAMES; f++) {
      // 1. 거품 3발 각각의 진행도 계산
      // 0.0 ~ 1.0: 시전자 -> 대상 비행 중 (커졌다 작아졌다 펄스 진동)
      // 1.0 ~ 1.40: 대상 적중 및 '펑' 파열 진행
      const bubbles = BUBBLE_TIMINGS.map(({ startF, hitF, popDur }) => {
        if (f < startF) return 0;
        if (f <= hitF) {
          // 비행 진행도
          return (f - startF) / (hitF - startF);
        }
        if (!isHit) {
          // 빗맞았을 경우 대상 너머로 계속 날아감
          return 1.0 + (f - hitF) * 0.08;
        }
        // 피격 파열 진행도
        const popProgress = (f - hitF) / popDur;
        if (popProgress <= 1.0) {
          return 1.0 + popProgress * 0.40;
        }
        return 0; // 파열 완료 후 소멸
      });

      // 2. 시전자 모션 (거품 불기 전 들이마시기 & 발사 반동)
      let pOffset = { x: 0, y: 0 };
      let eOffset = { x: 0, y: 0 };
      let pScale: { x: number; y: number } | undefined;
      let eScale: { x: number; y: number } | undefined;

      if (f <= 4) {
        // 호흡 축적 준비 단계
        const chargeT = f / 4;
        if (isP) {
          pOffset = { x: chargeT * 3, y: -chargeT * 2 };
          pScale = { x: 1.05, y: 0.95 };
        } else {
          eOffset = { x: -chargeT * 3, y: -chargeT * 2 };
          eScale = { x: 1.05, y: 0.95 };
        }
      } else if (f >= 5 && f <= 13) {
        // 3발 거품 연속 입으로 내뿜는 반동 진동
        const blowSine = Math.sin((f - 5) * Math.PI * 0.7) * 1.8;
        if (isP) {
          pOffset = { x: -blowSine, y: blowSine * 0.3 };
        } else {
          eOffset = { x: blowSine, y: blowSine * 0.3 };
        }
      }

      // 3. 대상 피격 리액션 (17F, 20F, 23F 순차 타격감 펑-펑-펑!)
      let isFlashing = false;

      if (isHit) {
        if (f >= 17 && f <= 19) {
          // 1차 펑! (17F)
          isFlashing = (f === 17);
          const sX = (f === 17 ? 3.0 : (f === 18 ? -1.5 : 0.8));
          const sY = (f === 17 ? -1.5 : (f === 18 ? 0.8 : -0.4));
          if (isP) eOffset = { x: sX, y: sY };
          else pOffset = { x: -sX, y: sY };
        } else if (f >= 20 && f <= 22) {
          // 2차 펑! (20F)
          isFlashing = (f === 20);
          const sX = (f === 20 ? -4.0 : (f === 21 ? 2.0 : -1.0));
          const sY = (f === 20 ? 2.0 : (f === 21 ? -1.0 : 0.5));
          if (isP) eOffset = { x: sX, y: sY };
          else pOffset = { x: -sX, y: sY };
        } else if (f >= 23 && f <= 26) {
          // 3차 펑! 피날레 넉백 (23F)
          isFlashing = (f === 23);
          const sX = (f === 23 ? 5.5 : (f === 24 ? -3.0 : (f === 25 ? 1.5 : -0.6)));
          const sY = (f === 23 ? -2.5 : (f === 24 ? 1.5 : (f === 25 ? -0.8 : 0.3)));
          if (isP) eOffset = { x: sX, y: sY };
          else pOffset = { x: -sX, y: sY };
        }
      } else {
        // Miss: 대상이 16~22F에 살짝 위로 도약하여 회피
        if (f >= 16 && f <= 22) {
          const jumpT = Math.sin(((f - 16) / 6) * Math.PI);
          const dodgeY = -jumpT * 14;
          if (isP) eOffset = { x: 0, y: dodgeY };
          else pOffset = { x: 0, y: dodgeY };
        }
      }

      // 4. 발밑 물보라 파문 진행도 (24프레임 이후)
      const splashRingProg = isHit && f >= 24 ? (f - 24) / 10 : undefined;

      // 5. 256색 최적화 팔레트 페이즈 및 단계명
      let phaseId = "bubble-ready";
      let phaseName = "1. 거품 발사 준비";
      let stepNum = 1;

      if (f >= 5 && f <= 16) {
        phaseId = "bubble-flight";
        phaseName = "2. 방울 거품 3개 팽창·수축 비행";
        stepNum = 2;
      } else if (f >= 17 && f <= 26) {
        phaseId = "bubble-pops";
        phaseName = "3. 거품 3연속 순차 파열 (펑펑펑)";
        stepNum = 3;
      } else if (f >= 27) {
        phaseId = "bubble-finish";
        phaseName = "4. 물보라 소산 및 복귀";
        stepNum = 4;
      }

      frames.push({
        ...baseFrame,
        delay: 35, // 30 FPS 규격
        pOffset,
        eOffset,
        pScale,
        eScale,
        showEffect: f >= 5,
        moveStep: stepNum,
        bubbles,
        splashRingProg,
        hitFlash: isFlashing,
        phaseId,
        phaseName,
      });
    }

    return frames;
  },
};
