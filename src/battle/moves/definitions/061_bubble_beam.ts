// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import {
  drawBubbleBeamEffect,
  drawBubbleBeamBehindEffect,
} from "../../../renderers/moves/gen1/move061_064.js";

/**
 * 061: 거품광선 (Bubble Beam)
 * 
 * Concept (유저 요구사항 100% 반영):
 * 1. 거품동그라미: 독침(040)에서 호평받은 고품질 비눗방울 스타일을 워터 블루 컬러로 계승
 * 2. 5발 순차 발사: 시전자로부터 목표를 향해 시차를 두고 5발의 대형 거품이 맹렬히 사출
 * 3. 투명도 있는 파란색 빔 잔상: 거품 뒤편으로 유선형 빔 제트 스트림이 뻗으며 뒤쪽은 100% 완전 투명하게 페이드아웃
 * 4. 연속 피격 파열: 대상에 닿을 때마다 톡-톡-톡-톡-톡 연속으로 터지는 상쾌한 물보라 난타
 */
export const bubbleBeamMove: BattleMoveAnimation = {
  num: 61,
  key: "bubble-beam",
  nameKo: "거품광선",
  nameEn: "Bubble Beam",
  type: "water",
  category: "special",
  camera: { type: "target", zoom: 1.25 },
  drawBehindEffect: drawBubbleBeamBehindEffect,
  drawEffect: drawBubbleBeamEffect,
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

    // 거품 6발의 쾌적한 발사 및 도달 타이밍 (1.8프레임 간격: 각 거품의 볼륨감과 시원한 빔 잔상이 선명하게 살아남)
    const BUBBLE_TIMINGS = [
      { startF: 4.0, hitF: 17.0 }, // 1호 (선두 대형)
      { startF: 5.8, hitF: 18.8 }, // 2호
      { startF: 7.6, hitF: 20.6 }, // 3호
      { startF: 9.4, hitF: 22.4 }, // 4호
      { startF: 11.2, hitF: 24.2 }, // 5호
      { startF: 13.0, hitF: 26.0 }, // 6호 (후미)
    ];

    const TOTAL_FRAMES = 42;

    for (let f = 1; f <= TOTAL_FRAMES; f++) {
      // 1. 6발 거품 각각의 진행도 계산
      // 0.0 ~ 1.0: 시전자 -> 대상 비행 중
      // 1.0 ~ 1.40: 대상 피격 및 물보라 파열 진행 (이후 소멸)
      const bubbles = BUBBLE_TIMINGS.map(({ startF, hitF }) => {
        if (f < startF) return 0;
        if (f <= hitF) {
          // 비행 진행도
          return (f - startF) / (hitF - startF);
        }
        // 피격 파열 진행도 (hitF 이후 1.0 -> 1.40까지 4프레임간 파열)
        const popDuration = 4.0;
        const popProgress = (f - hitF) / popDuration;
        if (popProgress <= 1.0) {
          return 1.0 + popProgress * 0.40;
        }
        return 0; // 파열 완료 후 소멸
      });

      // 2. 시전자 모션 (거품 발사 시 반동)
      let pOffset = { x: 0, y: 0 };
      let eOffset = { x: 0, y: 0 };
      let pScale: { x: number; y: number } | undefined;
      let eScale: { x: number; y: number } | undefined;

      if (f <= 4) {
        // 충전 단계: 가벼운 전방 웅크림
        const chargeT = f / 4;
        if (isP) {
          pOffset = { x: chargeT * 3, y: -chargeT * 2 };
          pScale = { x: 1.04, y: 0.96 };
        } else {
          eOffset = { x: -chargeT * 3, y: -chargeT * 2 };
          eScale = { x: 1.04, y: 0.96 };
        }
      } else if (f >= 5 && f <= 16) {
        // 6발 빔 연속 사출 수압 반동 진동
        const recoilSine = Math.sin((f - 5) * Math.PI * 0.85) * 2.2;
        if (isP) {
          pOffset = { x: -recoilSine, y: recoilSine * 0.4 };
        } else {
          eOffset = { x: recoilSine, y: recoilSine * 0.4 };
        }
      }

      // 3. 대상 피격 모션 (연속 피격 섬광 및 흔들림)
      let isFlashing = false;
      if (f >= 17 && f <= 28) {
        isFlashing = (f % 2 === 1);
        const hitStep = f - 17;
        const shakeX = (hitStep % 2 === 0 ? 1 : -1) * (3.0 + Math.min(hitStep, 8) * 0.2);
        const shakeY = (hitStep % 3 === 0 ? -1.8 : 1.4);
        if (isP) {
          eOffset = { x: shakeX, y: shakeY };
        } else {
          pOffset = { x: -shakeX, y: shakeY };
        }
      }

      // 4. 배후 워터 빔 오라 지속도
      const streamT = f >= 4 && f <= 27 ? Math.min(1.0, (f - 4) / 13) : 0;
      const beamAuraAlpha = f >= 4 && f <= 27 ? 0.30 : 0;

      // 5. 발밑 물방울 파문 진행도 (28프레임 이후)
      const splashRingProg = f >= 28 ? (f - 28) / 12 : undefined;

      // 6. 256색 최적화 팔레트 페이즈 및 단계명 (주요 연출 전환 시에만 moveStep 변경)
      let phaseId = "bubblebeam-charge";
      let phaseName = "1. 거품광선 조준 및 수압 충전";
      let stepNum = 1;

      if (f >= 5 && f <= 16) {
        phaseId = "bubblebeam-fire-stream";
        phaseName = "2. 대형 거품광선 빔 쇄도";
        stepNum = 2;
      } else if (f >= 17 && f <= 28) {
        phaseId = "bubblebeam-rapid-impact";
        phaseName = "3. 거품광선 6연속 파열 난타";
        stepNum = 3;
      } else if (f >= 29) {
        phaseId = "bubblebeam-splash-finish";
        phaseName = "4. 물보라 비산 및 잔여 파문 마무리";
        stepNum = 4;
      }

      frames.push({
        ...baseFrame,
        delay: 35, // 30 FPS 규격
        pOffset,
        eOffset,
        pScale,
        eScale,
        showEffect: f >= 4,
        moveStep: stepNum,
        bubbles,
        streamT,
        beamAuraAlpha,
        splashRingProg,
        hitFlash: isFlashing,
        phaseId,
        phaseName,
      });
    }

    return frames;
  },
};
